const fs=require('fs');
function edit(p,f){fs.writeFileSync(p,f(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')))}
edit('mobile/src/app/(customer)/requirements.tsx',s=>s.replace('title="My Jobs"','title="My jobs"').replace('padding:20','padding:20').replace('padding: 8','padding: 20').replace('<RequirementCard requirement={req} />','<RequirementCard requirement={req} embedded />').replace('        {error ? (','        {!loading && !error && requirements.length > 0 && <Text style={{fontSize:14,color:\'#145C58\',marginBottom:16}}>{requirements.length} requirements</Text>}\n        {error ? ('));
edit('mobile/src/app/(customer)/bookings.tsx',s=>{
 s=s.replace('GlassCard }','GlassCard, glassSurface, palette }');
 const a=s.indexOf('function BookingCard(');const b=s.indexOf('export default function BookingsScreen()',a);
 s=s.slice(0,a)+`function BookingCard({ booking }: { booking: BookingView }) {
  const router=useRouter();
  const date=(value:string)=>new Date(value).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
  const color=STATUS_COLOR[booking.status]??palette.teal;
  return <GlassCard style={{marginBottom:18,padding:16,gap:12}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:14}}>
      <View style={[glassSurface,{width:60,height:60,borderRadius:30,backgroundColor:'rgba(247,201,72,0.25)',alignItems:'center',justifyContent:'center'}]}><Ionicons name="briefcase-outline" size={29} color={palette.teal}/></View>
      <View style={{flex:1,gap:6}}>
        <Text style={{fontSize:20,fontWeight:'700',color:palette.ink}}>{booking.requirementTitle}</Text>
        <Text style={{alignSelf:'flex-start',backgroundColor:color+'18',color,paddingVertical:4,paddingHorizontal:12,borderRadius:16,fontSize:12}}>{booking.status}</Text>
      </View>
    </View>
    <View style={[glassSurface,{borderRadius:20,padding:12,flexDirection:'row',alignItems:'center',gap:10,boxShadow:'none'}]}>
      <View style={{width:40,height:40,borderRadius:20,backgroundColor:'#DCEEE7',alignItems:'center',justifyContent:'center'}}><Text style={{color:palette.teal,fontWeight:'700',fontSize:18}}>{booking.workerName?.charAt(0)}</Text></View>
      <Text style={{flex:1,color:palette.teal,fontWeight:'600',fontSize:15}}>{booking.workerName}</Text>
      <View style={{flex:1,borderLeftWidth:1,borderColor:'#B7D9CE',paddingLeft:10,gap:5}}><Ionicons name="calendar-outline" size={21} color={palette.teal}/><Text style={{fontSize:12,color:palette.teal}}>{date(booking.startsAt)} – {date(booking.endsAt)}</Text></View>
    </View>
    <View style={[glassSurface,{padding:12,borderRadius:20,boxShadow:'none',gap:5}]}>
      <Text style={{fontSize:12,color:palette.teal}}>Quoted amount</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:18}}><Text style={{fontSize:26,fontWeight:'700',color:palette.teal}}>₹{Number(booking.amount).toLocaleString('en-IN')}</Text><Text style={{fontSize:13,color:palette.teal,borderLeftWidth:1,borderColor:'#B7D9CE',paddingLeft:18}}>{PRICING_LABEL[booking.pricingBasis]??booking.pricingBasis}</Text></View>
    </View>
    <Action label="View booking" variant="secondary" onPress={()=>router.push(\`/(customer)/booking/\${booking.id}\`)} />
  </GlassCard>;
}

`+s.slice(b);
 s=s.replace('  Pressable,\n','').replace('  const router = useRouter();\n','');
 s=s.replace('title="My Bookings"','title="My bookings"').replace("FIXED_TOTAL: 'Fixed'","FIXED_TOTAL: 'Fixed total'");
 const x=s.indexOf('          bookings.map(');const y=s.indexOf('\n        )}',x);
 s=s.slice(0,x)+'          bookings.map((b) => <BookingCard key={b.id} booking={b} />)'+s.slice(y);
 s=s.replace('        {error ? (','        {!loading && !error && bookings.length > 0 && <Text style={{fontSize:14,color:palette.teal,marginBottom:16}}>{bookings.length} bookings</Text>}\n        {error ? (');
 return s;
});
edit('mobile/src/app/(customer)/discover.tsx',s=>{
 s=s.replace('GlassCard }','GlassCard, glassSurface, palette }').replace("import { View, Text, ScrollView }","import { View, Text, ScrollView, Pressable }");
 s="import { Ionicons } from '@expo/vector-icons';\n"+s;
 s=s.replace('title="Find Workers"','title="Find workers"');
 const card=s.indexOf('        <GlassCard style={{ gap: 16 }}>');
 const stateStart=s.indexOf('          {locationOpen && (',card);const stateEnd=s.indexOf('          {!!validation',stateStart);
 const locationPanel=s.slice(stateStart,stateEnd);
 const selectStart=s.indexOf('          <Select',card);const selectEnd=s.indexOf('          <View className="gap-2">',selectStart);
 const trade=s.slice(selectStart,selectEnd);
 const cardEnd=s.indexOf('        </GlassCard>',stateEnd)+ '        </GlassCard>'.length;
 const replacement=`        <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
          <Pressable accessibilityRole="button" accessibilityLabel={locationOpen?'Hide city selection':'Choose a city instead'} onPress={()=>setLocationOpen(!locationOpen)} disabled={locating} style={[glassSurface,{flex:1,paddingHorizontal:14,minHeight:48,borderRadius:28,flexDirection:'row',alignItems:'center',gap:8}]}>
            <Ionicons name="location-outline" size={23} color={palette.teal}/><Text style={{flex:1,fontSize:13,fontWeight:'600',color:palette.teal}}>{locationSource || 'Choose a city'}</Text><Ionicons name="chevron-down" size={18} color={palette.teal}/>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Use my current location" disabled={locating} onPress={()=>void locate()} style={{minHeight:48,justifyContent:'center',maxWidth:110}}><Text style={{fontSize:12,color:palette.teal,textDecorationLine:'underline'}}>{locating?'Locating…':'Use current location'}</Text></Pressable>
        </View>
        {!!locationError && <Text accessibilityRole="alert" className="text-rose-700">{locationError}</Text>}
        ${locationPanel.trim()}
        <GlassCard style={{gap:12,padding:16}}>
          <View style={{flexDirection:'row',gap:12,alignItems:'flex-start'}}><View style={{flex:1}}>
          ${trade.trim()}
          </View><View style={{flex:1}}><Select label="Radius" value={draft.radius} onChange={radius=>setDraft({...draft,radius})} options={['5','15','30','50'].map(value=>({value,label:value+' km'}))}/></View></View>
          {!!validation && <Text accessibilityRole="alert" className="text-rose-700">{validation}</Text>}
          <Action label="Search Workers" loading={workers.isFetching} disabled={locating} onPress={search}/>
        </GlassCard>
        {!draft.cityId && draft.lat && draft.lng ? <Text style={{fontSize:11,lineHeight:15,color:palette.muted}}>GPS matches distance-based service areas only. Choose a city to include state, district and nationwide coverage.</Text> : null}`;
 s=s.slice(0,card)+replacement+s.slice(cardEnd);
 s=s.replace('gap: 20, paddingBottom: 32','gap: 14, paddingBottom: 32');
 s=s.replace('            <Text\n              accessibilityLiveRegion="polite"','            <Text style={{fontSize:22,fontWeight:\'700\',color:palette.teal,marginBottom:10}}>Workers nearby</Text>\n            <Text\n              accessibilityLiveRegion="polite"');
 return s;
});
