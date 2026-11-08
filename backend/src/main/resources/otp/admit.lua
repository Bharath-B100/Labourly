-- Stage A contract. All keys share {otp-prod}; caller supplies HMAC identities.
-- KEYS: generation/policy/mode readiness token, operation cache, clock watermark, window sorted sets.
-- ARGV: exact approved readiness token, binding digest, operation UUID, deadline epoch ms,
-- then windowMs, capacity pairs. Gate/version are bound into keys and digest.
-- Missing quota keys are safe ONLY under a durable approved fresh generation.
local unavailable = {'UNAVAILABLE', 0}
local n = #KEYS - 3
if n < 1 or n > 64 or #ARGV ~= 4 + n * 2 then return unavailable end
local function kind(k) return redis.call('TYPE', k).ok end
local seen = {}
for _,k in ipairs(KEYS) do
 if not string.find(k, '{otp-prod}', 1, true) or seen[k] then return unavailable end
 seen[k] = true
end
if kind(KEYS[1]) ~= 'string' or redis.call('GET',KEYS[1]) ~= ARGV[1] then return unavailable end
local t=redis.call('TIME')
local now=tonumber(t[1])*1000+math.floor(tonumber(t[2])/1000)
if kind(KEYS[3])~='string' then return unavailable end
local watermark=tonumber(redis.call('GET',KEYS[3]))
if not watermark or now<watermark then return unavailable end
local deadline=tonumber(ARGV[4])
if not deadline or deadline%1~=0 or deadline<now or deadline>now+60000
 or #ARGV[2]~=64 or not string.match(ARGV[2], '^%x+$')
 or #ARGV[3]~=36 or not string.match(ARGV[3], '^[%x%-]+$') then return unavailable end
local windows, caps = {}, {}
for i=1,n do
 local w,c=tonumber(ARGV[4+i*2-1]),tonumber(ARGV[4+i*2])
 if not w or not c or w%1~=0 or c%1~=0 or w<1 or w>86400000 or c<1 or c>100000 then return unavailable end
 local typ=kind(KEYS[i+3])
 if typ~='none' and typ~='zset' then return unavailable end
 if typ=='zset' and redis.call('PTTL',KEYS[i+3])<0 then return unavailable end
 if typ=='zset' then
  local last=redis.call('ZREVRANGE',KEYS[i+3],0,0,'WITHSCORES')
  if #last>0 and tonumber(last[2])>now then return unavailable end
 end
 windows[i],caps[i]=w,c
end
local cacheType=kind(KEYS[2])
if cacheType~='none' and cacheType~='string' then return unavailable end
if cacheType=='string' and redis.call('PTTL',KEYS[2])<0 then return unavailable end
if cacheType=='string' then
 local ok,v=pcall(cjson.decode,redis.call('GET',KEYS[2]))
 if not ok or v.binding~=ARGV[2] or v.operation~=ARGV[3] or v.deadline~=deadline
 or (v.status~='ALLOW' and v.status~='DENY') or type(v.retry)~='number' then return unavailable end
 redis.call('SET',KEYS[3],now)
 return {v.status,v.retry}
end
-- An operation member without its replay cache is quota-state loss, never a new admission.
for i=1,n do if redis.call('ZSCORE',KEYS[i+3],ARGV[3]) then return unavailable end end
local retry=0
for i=1,n do
 local count=redis.call('ZCOUNT',KEYS[i+3],'('..(now-windows[i]),'+inf')
 if count>=caps[i] then
  local scores=redis.call('ZRANGEBYSCORE',KEYS[i+3],'('..(now-windows[i]),'+inf','WITHSCORES','LIMIT',count-caps[i],1)
  retry=math.max(retry,tonumber(scores[2])+windows[i])
 end
end
redis.call('SET',KEYS[3],now)
local status='DENY'
if retry==0 then
 status='ALLOW'
 for i=1,n do
  redis.call('ZREMRANGEBYSCORE',KEYS[i+3],'-inf',now-windows[i])
  redis.call('ZADD',KEYS[i+3],'NX',now,ARGV[3])
  redis.call('PEXPIRE',KEYS[i+3],windows[i]+60000)
 end
end
redis.call('SET',KEYS[2],cjson.encode({binding=ARGV[2],operation=ARGV[3],deadline=deadline,status=status,retry=retry}),'PX',math.max(1,deadline-now))
return {status,retry}
