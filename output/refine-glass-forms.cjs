const fs=require('fs');
function edit(p,f){fs.writeFileSync(p,f(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')))}
edit('mobile/src/location/JobLocationPicker.tsx',s=>{
 s=s.replace("import { Text, View }", "import { Text, View, Pressable }");
 s="import { glassSurface, palette } from '../components/theme';\nimport { Ionicons } from '@expo/vector-icons';\n"+s;
 s=s.replace('  onChange,\n}: {','  onChange,\n  compact = false,\n}: {').replace('  initialValue?: JobLocation | null;','  initialValue?: JobLocation | null;\n  compact?: boolean;');
 s=s.replace('  const [candidate,', '  const [expanded, setExpanded] = useState(!compact);\n  const [candidate,');
 s=s.replace('    <View className="gap-3 rounded-2xl border border-outline bg-surface p-4 mb-5">','    <View style={{gap:10,marginBottom:12}}>');
 s=s.replace('      <Text className="text-ink text-lg font-bold">Job location</Text>',`      <Text style={{fontSize:12,color:palette.teal}}>Job location</Text>
      {compact && <Pressable accessibilityRole="button" accessibilityLabel="Choose job location" accessibilityState={{expanded}} onPress={()=>setExpanded(!expanded)} style={[glassSurface,{borderRadius:28,padding:12,minHeight:48,flexDirection:'row',alignItems:'center',gap:10}]}><Ionicons name="location-outline" size={24} color={palette.teal}/><Text style={{flex:1,color:palette.teal,fontSize:15,fontWeight:'600'}}>{confirmed&&candidate?candidate.city+', '+candidate.stateCode:'Choose job location'}</Text><Ionicons name="chevron-down" size={18} color={palette.teal}/></Pressable>}
      {expanded && <>`);
 s=s.replace('              setConfirmed(true);','              setConfirmed(true);\n              if(compact) setExpanded(false);');
 s=s.replace('    </View>\n  );','      </>}\n    </View>\n  );');
 return s;
});
edit('mobile/src/app/(customer)/post.tsx',s=>{
 s=s.replace('  glassSurface,\n','').replace('  TextInput,\n','').replace('Action, Select','Action, Select, Input');
 const a=s.indexOf('  return (\n    <SafeAreaView',s.indexOf('const handleSubmit')); 
 s=s.slice(0,a)+`  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{padding:20,paddingBottom:32,gap:14}}>
        {editId && <Action label="Back" variant="quiet" onPress={()=>requestExit(leaveEditor)}/>}
        <PageHeading title={editId?'Edit Draft':'Post a job'} subtitle="Tell workers what you need."/>
        <GlassCard style={{padding:16,gap:12}}>
          {!!draftError&&<Text accessibilityRole="alert" className="text-rose-700">{draftError}</Text>}
          {editId&&!draftLoaded&&<Text className="text-ink">Loading draft…</Text>}
          {!!currentLocation&&<Text style={{fontSize:11,color:'#466E68'}}>{currentLocation}</Text>}
          <Input label="Job title" accessibilityLabel="Title" value={title} onChangeText={setTitle} placeholder="e.g. Carpentry for kitchen cabinets"/>
          <View style={{flexDirection:'row',gap:10,alignItems:'flex-start'}}>
            <View style={{flex:1}}><Select label="Trade required" searchable value={tradeId} options={trades.map(t=>({value:t.id,label:t.name}))} onChange={value=>{setTradeId(value);setSkillIds([])}}/></View>
            <View style={{flex:1}}><Input label="Workers needed" accessibilityLabel="Workers needed" value={workerCount} onChangeText={setWorkerCount} keyboardType="number-pad"/></View>
          </View>
          {!!catalogueError&&<><Text accessibilityRole="alert" className="text-rose-700">{catalogueError}</Text><Action label="Retry trades" variant="secondary" onPress={()=>{setCatalogueError('');getTrades().then(setTrades).catch(()=>setCatalogueError('Could not load trades. Please try again.'))}}/></>}
          {!!selectedTrade?.skills?.length&&<View style={{gap:7}}><Text style={{fontSize:12,color:'#145C58'}}>Skills</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{selectedTrade.skills.map(skill=><Pressable key={skill.id} accessibilityRole="checkbox" accessibilityLabel={skill.name} accessibilityState={{checked:skillIds.includes(skill.id)}} onPress={()=>toggleSkill(skill.id)} style={{minHeight:40,paddingHorizontal:14,paddingVertical:10,borderRadius:24,borderWidth:1,borderColor:'white',backgroundColor:skillIds.includes(skill.id)?'rgba(255,211,54,0.65)':'rgba(255,255,255,0.22)'}}><Text style={{color:'#145C58',fontWeight:'600',fontSize:13}}>{skill.name}{skillIds.includes(skill.id)?'  ×':''}</Text></Pressable>)}</View></View>}
          {draftLoaded&&<JobLocationPicker initialValue={location} onChange={setLocation} compact/>}
          <View style={{flexDirection:'row',gap:10}}>
            <View style={{flex:1}}><Input label={editId?'Start date (YYYY-MM-DD)':'Start in (days)'} accessibilityLabel={editId?'Start date':'Start in days'} value={editId?startDate:startsInDays} onChangeText={editId?setStartDate:setStartsInDays} keyboardType={editId?'default':'number-pad'}/></View>
            <View style={{flex:1}}><Input label="Duration (days)" accessibilityLabel="Duration in days" value={durationDays} onChangeText={setDurationDays} keyboardType="number-pad"/></View>
          </View>
          {editId&&<View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Input label="Start time" accessibilityLabel="Start time" value={startTime} onChangeText={setStartTime}/></View><View style={{flex:1}}><Input label="Budget (optional)" accessibilityLabel="Budget" value={budget} onChangeText={setBudget} keyboardType="decimal-pad"/></View></View>}
          <Input label="Description" accessibilityLabel="Description" value={description} onChangeText={setDescription} placeholder="Describe the job in detail" multiline numberOfLines={3} style={{minHeight:55}}/>
          <Action label={editId?'Save draft':'Post Requirement'} disabled={!draftLoaded||!!draftError} loading={loading} onPress={handleSubmit}/>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
`;
 return s;
});
edit('mobile/src/onboarding/ProfileEditor.tsx',s=>{
 s=s.replace('import { glassSurface }', 'import { glassSurface, GlassRim }');
 s=s.replace("backgroundColor: 'rgba(247,201,72,0.16)'","backgroundColor: 'rgba(247,201,72,0.12)'");
 s=s.replace('borderRadius: 18,\n              backgroundColor:', 'borderRadius: 32,\n              backgroundColor:');
 s=s.replace('width: 56,\n              height: 56,','width: 64,\n              height: 64,');
 s=s.replace('.charAt(0)\n                .toUpperCase()',".split(' ').filter(Boolean).slice(0,2).map(word=>word.charAt(0)).join('').toUpperCase()");
 s=s.replace('<View style={{ flexDirection: \'row\', gap: 6 }}>','<View style={{ flexDirection: \'row\', gap: 6, paddingHorizontal:48, alignItems:\'center\' }}>');
 s=s.replace('                height: 4,\n                borderRadius: 4,','                height: 5,\n                borderRadius: 4,');
 s=s.replace('        <Text className="text-sm font-semibold text-muted">','        <Text className="text-sm text-muted text-center">');
 s=s.replace('          gap: 20,','          gap: 14,');
 s=s.replace('        <View style={{ gap: 5 }}>\n          <Text className="text-lg','        <GlassRim />\n        <View style={{ gap: 5 }}>\n          <Text className="text-lg');
 return s;
});
