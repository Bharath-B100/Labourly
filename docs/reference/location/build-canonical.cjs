// Offline, reproducible reference builder. Input datasets are never joined by numeric equality.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = 'docs/reference/location/';
const read = p => fs.readFileSync(p, 'utf8');
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const rows = p => read(p).trim().split(/\r?\n/).map(r => r.split('\t'));
const lgd = read(root + 'lgd-states.html').split('<tr>').map(r => [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => c[1].replace(/<[^>]+>/g, '').trim().replace(/&amp;/g, '&'))).filter(r => r.length === 4);
assert.equal(lgd.length, 36);
// Explicitly reviewed pairs: GeoNames key, LGD code, current CLDR subdivision suffix.
// CLDR release-48 common/validity/subdivision.xml regular India codes, checked 2026-10-08.
const pairs = `01 35 AN;02 28 AP;30 12 AR;03 18 AS;34 10 BR;05 4 CH;37 22 CG;52 38 DH;07 7 DL;33 30 GA;09 24 GJ;10 6 HR;11 2 HP;12 1 JK;38 20 JH;19 29 KA;13 32 KL;41 37 LA;14 31 LD;35 23 MP;16 27 MH;17 14 MN;18 17 ML;31 15 MZ;20 13 NL;21 21 OD;22 34 PY;23 3 PB;24 8 RJ;29 11 SK;25 33 TN;40 36 TS;26 16 TR;36 9 UP;39 5 UK;28 19 WB`.split(';').map(x => x.split(' '));
const geo = rows('.tools/geonames/admin1CodesASCII.txt').filter(r => r[0].startsWith('IN.'));
assert.equal(geo.length, 36);
const notes = {
 '01': 'GeoNames omits Islands; official LGD and CLDR specify Andaman and Nicobar Islands.',
 '07': 'GeoNames/CLDR Delhi is LGD NCT OF DELHI.',
 '12': 'Current Jammu and Kashmir UT; Ladakh is a separate record (GeoNames 41, LGD 37).',
 '25': 'LGD spelling TAMILNADU corresponds to Tamil Nadu in GeoNames and CLDR.',
 '37': 'CLDR regular CG; CT is deprecated. Do not overwrite legacy free-text CT values.',
 '40': 'CLDR regular TS; TG is deprecated. Do not overwrite legacy free-text TG values.',
 '39': 'CLDR regular UK; UT is deprecated. Do not overwrite legacy free-text UT values.',
 '52': 'Merged UT only: LGD 38 / CLDR DH. Historical DN and DD must not be treated as separate current states.',
 '21': 'Current Odisha / OD. Historical Orissa / OR is not a new administrative entity.'
};
const sources = ['https://download.geonames.org/export/dump/admin1CodesASCII.txt','https://dilrmp.gov.in/dilrmpold/dashboard/state-list-dashboard','https://raw.githubusercontent.com/unicode-org/cldr/release-48/common/subdivisions/en.xml','https://raw.githubusercontent.com/unicode-org/cldr/release-48/common/validity/subdivision.xml'];
const states = pairs.map(([key, code, suffix]) => {
 const g = geo.find(r => r[0] === 'IN.' + key); const official = lgd.find(r => r[2] === code);
 assert(g && official);
 // Identity is manually reviewed; these assertions additionally catch transposition in the tuple list.
 const normalize=n=>n.toUpperCase().replace(/[^A-Z]/g,'');
 const officialNames={'01':'ANDAMAN & NICOBAR ISLANDS','07':'NCT OF DELHI','12':'JAMMU & KASHMIR','52':'THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU'};
 assert.equal(normalize(official[1]),normalize(officialNames[key]||g[2]),'Official identity mismatch for '+key);
 return {id: 'lgd:' + code, countryCode:'IN', geonamesAdmin1Key:key, geonamesName:g[2], geonamesId:g[3], lgdCode:Number(code), officialName:official[1], name:g[2], subdivisionCode:suffix, unicodeCode:'in'+suffix.toLowerCase(), applicationStateCode:suffix, compatibilityPolicy:'New canonical code; existing free-text state fields are not rewritten. Legacy city selector continues using GeoNames key.', sources, referenceDate:'2026-10-08', verificationStatus:'REVIEWED', note:notes[key] || 'Unambiguous state identity independently listed in GeoNames, LGD and CLDR.'};
});
for (const key of ['id','geonamesAdmin1Key','unicodeCode']) assert.equal(new Set(states.map(s=>s[key])).size,36);
assert.equal(states.find(s=>s.geonamesAdmin1Key==='19').lgdCode,29);
assert.equal(states.find(s=>s.geonamesAdmin1Key==='28').lgdCode,19);
const byGeo = new Map(states.map(s => [s.geonamesAdmin1Key,s]));
const districts = rows('.tools/geonames/admin2Codes.txt').filter(r => r[0].startsWith('IN.')).map(r => ({id:'geonames:'+r[3], geonamesAdmin2Key:r[0], stateId:byGeo.get(r[0].split('.')[1])?.id, name:r[2], source:'https://download.geonames.org/export/dump/admin2Codes.txt', referenceDate:'2026-10-08'}));
assert(districts.every(d=>d.stateId));
assert.equal(new Set(districts.map(d=>d.id)).size,districts.length);
const districtByKey = new Map(districts.map(d=>[d.geonamesAdmin2Key,d]));
const rawCities = new Map(rows('.tools/geonames/cities15000.txt').map(r=>[r[0],r]));
const original = JSON.parse(read('mobile/src/location/india-cities.json'));
const cities = original.cities.map(c => {
 const raw = rawCities.get(c.id); const district=raw && districtByKey.get('IN.'+raw[10]+'.'+raw[11]);
 return {...c, stateId:byGeo.get(c.stateCode).id, countryCode:'IN', districtIds:district?[district.id]:[], districtResolution:district?'SOURCE_VERIFIED':'UNRESOLVED', source:raw?'https://download.geonames.org/export/dump/cities15000.zip':'https://www.geonames.org/1267390/kavaratti.html', referenceDate:'2026-10-08'};
});
assert.equal(cities.length,3781);
assert.equal(cities.filter(c=>c.districtResolution==='UNRESOLVED').length,27);
assert(cities.every(c=>Number.isFinite(c.latitude)&&Math.abs(c.latitude)<=90&&Number.isFinite(c.longitude)&&Math.abs(c.longitude)<=180));
write(root+'state-crosswalk-v1.json', states);
write(root+'unresolved-districts-v1.json', cities.filter(c=>c.districtResolution==='UNRESOLVED'));
write(root+'canonical-locations-v1.json', {version:1,states,districts,cities});
write(root+'source-hashes.json', ['.tools/geonames/admin1CodesASCII.txt','.tools/geonames/admin2Codes.txt','.tools/geonames/cities15000.txt','mobile/src/location/india-cities.json',root+'lgd-states.html'].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')})));
fs.writeFileSync(root+'STATE_CROSSWALK.md', '# Reviewed state crosswalk — 2026-10-08\n\nGeoNames, LGD and subdivision codes are distinct namespaces. Existing free-text application values remain unchanged; subdivision codes below are canonical output for new writes. Legacy city selectors retain GeoNames keys. District IDs remain explicitly GeoNames IDs, not guessed LGD IDs. SOURCE_VERIFIED means an explicit relationship in the saved GeoNames source, not independently surveyed boundaries.\n\n| GeoNames | Name | LGD | Official name | New application / CLDR suffix |\n|---|---|---|---|---|\n'+states.map(s=>`| ${s.geonamesAdmin1Key} | ${s.geonamesName} | ${s.lgdCode} | ${s.officialName} | ${s.subdivisionCode} |`).join('\n')+'\n\n'+Object.values(notes).map(n=>'- '+n).join('\n')+'\n\nSources and per-record evidence are in state-crosswalk-v1.json. Direct LGD download succeeded. Direct raw.githubusercontent.com download failed TLS/reset; CLDR release-48 XML was inspected through the web reader. The CLDR chart is not used as production source.\n');
console.log(JSON.stringify({states:states.length,districts:districts.length,cities:cities.length,resolved:3754,unresolved:27,karnataka:states.find(s=>s.geonamesAdmin1Key==='19').id}));
