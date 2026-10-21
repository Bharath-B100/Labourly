const fs=require('fs');
function edit(file,fn){let s=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');fs.writeFileSync(file,fn(s));}
for(const role of ['customer','worker'])edit(`mobile/src/app/(${role})/_layout.tsx`,s=>{
 s="import { GlassTabBackground } from '../../components/theme';\n"+s;
 s=s.replace("tabBarActiveBackgroundColor: 'rgba(247,201,72,0.22)'", "tabBarActiveBackgroundColor: 'rgba(247,201,72,0.82)'");
 s=s.replace('tabBarItemStyle: { borderRadius: 22, marginHorizontal: 2 }',`tabBarBackground: () => <GlassTabBackground count={${role==='customer'?5:4}} />,
          tabBarItemStyle: { borderRadius: 40, marginHorizontal: 1, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' }`);
 const start=s.indexOf('tabBarStyle: {');const end=s.indexOf('tabBarLabelStyle:',start);
 s=s.slice(0,start)+`tabBarStyle: {
            backgroundColor: 'transparent', borderTopWidth: 0,
            height: 78, paddingTop: 0, paddingBottom: 0,
            marginHorizontal: 14, marginBottom: 12,
            borderRadius: 40, elevation: 0,
          },
          `+s.slice(end);
 s=s.replace("fontSize: 11, fontWeight: '600'","fontSize: 10, fontWeight: '600'");
 return s.replace('name="add-circle"','name="add-outline"').replaceAll('name="briefcase"','name="briefcase-outline"').replaceAll('name="person"','name="person-outline"');
});
edit('mobile/src/app/(customer)/discover.tsx',s=>{
 s=s.replace('import { GlassBackdrop }','import { GlassBackdrop, PageHeading, GlassCard }');
 const start=s.indexOf('        <View className="gap-2">',s.indexOf('return ('));const end=s.indexOf('        <View className="gap-4 rounded-2xl',start);
 s=s.slice(0,start)+`        <PageHeading title="Find Workers" subtitle="The right skills. Close to you." />\n`+s.slice(end);
 s=s.replace('<View className="gap-4 rounded-2xl border border-outline bg-surface p-4">','<GlassCard style={{gap:16}}>');
 s=s.replace('        </View>\n        {!applied.lat','        </GlassCard>\n        {!applied.lat');
 return s.replace('padding: 20, gap: 20','padding: 16, gap: 20');
});
for(const [file,title,subtitle] of [['requirements','My Jobs','Your posted requirements, in one place.'],['bookings','My Bookings','Your work, organised.']])edit(`mobile/src/app/(customer)/${file}.tsx`,s=>{
 s=s.replace('import { GlassBackdrop }','import { GlassBackdrop, PageHeading, GlassCard }');
 s=s.replace(/      <View className="px-4 pt-4 pb-2[^\n]+\n        <Text[^\n]+\n      <\/View>/,`      <PageHeading title="${title}" subtitle="${subtitle}" />`);
 s=s.replace('<ScrollView className="flex-1 p-4">','<ScrollView className="flex-1" contentContainerStyle={{padding:20, paddingBottom:32}}>');
 if(file==='requirements') {
 s=s.replace('GlassCard }','GlassCard }');
 s=s.replace('<View key={req.id} className="mb-1">','<GlassCard key={req.id} style={{marginBottom:20, padding:8}}>');
 s=s.replace('variant="secondary"\n                  onPress','variant="primary"\n                  onPress');
 s=s.replace('              )}\n            </View>','              )}\n            </GlassCard>');
 } else {
 s=s.replace('<View className="bg-surface rounded-2xl border border-outline p-4 mb-3 shadow-sm">','<GlassCard style={{marginBottom:20, gap:14}}>');
 s=s.replace('    </View>\n  );\n}\n\nexport default',`      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:10,borderTopWidth:1,borderTopColor:'#DCEEE7'}}><Text className="text-accent font-semibold">View booking</Text><Ionicons name="arrow-forward-circle" size={32} color="#145C58" /></View>
    </GlassCard>\n  );\n}\n\nexport default`);
 s=s.replace('text-accent font-semibold text-sm ml-1','text-accent font-bold text-2xl ml-1').replace("CONFIRMED: '#315CAB'","CONFIRMED: '#145C58'");
 s=s.replace('key={b.id}\n              onPress','key={b.id}\n              accessibilityRole="button"\n              accessibilityLabel={`View booking: ${b.requirementTitle}`}\n              onPress');
 }
 return s;
});
edit('mobile/src/app/(customer)/post.tsx',s=>{
 s=s.replace('import { GlassBackdrop }','import { GlassBackdrop, PageHeading, GlassCard, glassSurface }');
 s=s.replace('className="px-4 pt-4 pb-2 border-b border-outline"','className="px-4 pt-2"');
 s=s.replace(`<Text className="text-xl font-bold text-ink">\n          {editId ? 'Edit Draft' : 'Post Requirement'}\n        </Text>`,`<PageHeading title={editId ? 'Edit Draft' : 'Post a job'} subtitle="Tell workers what you need." />`);
 s=s.replace('contentContainerStyle={{ paddingBottom: 100 }}','contentContainerStyle={{ paddingBottom: 40 }}');
 s=s.replace('        {!!draftError && (','        <GlassCard>\n        {!!draftError && (');
 s=s.replace('      </ScrollView>','        </GlassCard>\n      </ScrollView>');
 s=s.replaceAll('<TextInput\n','<TextInput\n          style={glassSurface}\n').replace("          style={{ textAlignVertical: 'top' }}","          textAlignVertical=\"top\"");
 return s;
});
for(const file of ['WorkerCard','RequirementCard'])edit(`mobile/src/components/${file}.tsx`,s=>{
 s="import { glassSurface } from './theme';\nimport { GlassHighlight } from './glass';\n"+s;
 s=s.replace('({ opacity: pressed ? 0.75 : 1 })','({ ...glassSurface, padding:20, opacity: pressed ? 0.75 : 1 })');
 s=s.replace(/(className="bg-surface[^\n]+\n    >)/,'$1\n      <GlassHighlight />');
 s=s.replaceAll('rounded-xl shadow-sm','rounded-3xl');
 s=s.replace('className="flex-1 items-center justify-center bg-tinted"','className="flex-1 items-center justify-center bg-sunshine"');
 return s;
});
edit('mobile/src/onboarding/ProfileEditor.tsx',s=>{
 s="import { glassSurface } from '../components/theme';\n"+s;
 s=s.replace("backgroundColor: 'rgba(20,92,88,0.08)',","...glassSurface,\n            backgroundColor: 'rgba(247,201,72,0.16)',");
 s=s.replace("backgroundColor: 'rgba(20,92,88,0.22)'","backgroundColor: '#F7C948'");
 s=s.replace("? '#145C58' : 'rgba(20,92,88,0.22)'","? '#F7C948' : 'rgba(20,92,88,0.22)'");
 s=s.replace("backgroundColor: 'rgba(255,255,255,0.05)',","...glassSurface,");
 s=s.replace("borderColor: 'rgba(20,92,88,0.22)'","borderColor: 'rgba(255,255,255,0.96)'");
 return s;
});
