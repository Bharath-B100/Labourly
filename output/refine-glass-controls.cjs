const fs=require('fs');
function edit(p,f){fs.writeFileSync(p,f(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')))}
edit('mobile/src/components/ui.tsx',s=>{
 s=s.replace('Brand, glassSurface','Brand, glassSurface, GlassRim');
 s=s.replace("primary: 'rgba(247,201,72,0.85)'","primary: 'rgba(255,211,54,0.72)'").replace("secondary: 'rgba(20,92,88,0.08)'","secondary: 'rgba(255,255,255,0.18)'");
 s=s.replace("paddingVertical: 14,","paddingVertical: 8,");
 s=s.replace("? 'rgba(20,92,88,0.3)'","? 'rgba(255,255,255,0.95)'");
 s=s.replace("borderWidth: 1,\n          borderColor:","borderWidth: variant === 'quiet' ? 0 : 1,\n          borderColor:");
 s=s.replace("{variant !== 'quiet' && <GlassHighlight />}","{variant !== 'quiet' && <GlassRim radius={30} />}");
 s=s.replace('GlassHighlight, GlassReveal','GlassReveal');
 s=s.replace("variant === 'primary' && !loading","variant !== 'quiet' && variant !== 'danger' && !loading");
 s=s.replace("flex: variant === 'primary' ? 1 : undefined","flex: variant !== 'quiet' ? 1 : undefined");
 const start=s.indexOf('    <View style={{ gap: 8 }}>');const end=s.indexOf('      {!!(error || hint)',start);
 s=s.slice(0,start)+`    <View style={{gap:6}}>
      <View style={[glassSurface,{borderRadius:20,paddingHorizontal:16,paddingTop:8,paddingBottom:5,borderColor:error?'#B42340':focused?'#145C58':'rgba(255,255,255,0.92)'}]}>
        <GlassRim radius={20} />
        <Text style={{fontSize:12,color:'#466E68'}}>{label}</Text>
        <TextInput {...props} accessibilityLabel={props.accessibilityLabel ?? label} placeholderTextColor="#648C83"
          onFocus={event=>{setFocused(true);onFocus?.(event)}} onBlur={event=>{setFocused(false);onBlur?.(event)}}
          style={[{minHeight:32,padding:0,paddingVertical:3,fontSize:16,fontWeight:'500',color:'#104C49',textAlignVertical:props.multiline?'top':'center'},style]} />
      </View>
`+s.slice(end);
 s=s.replace('      <Text className="text-sm font-semibold text-muted">{label}</Text>\n      <Pressable','      <Pressable');
 s=s.replace('          padding: 14,','          paddingHorizontal: 16,\n          paddingVertical: 8,');
 s=s.replace("            : 'rgba(255,255,255,0.72)'","            : 'rgba(255,255,255,0.20)'");
 const a=s.indexOf('        <Text\n          style={{\n            flex: 1,',s.indexOf('export function Select'));
 const b=s.indexOf('        <Text accessible={false}',a);
 s=s.slice(0,a)+`        <GlassRim radius={18} />
        <View style={{flex:1,gap:3}}>
          <Text style={{fontSize:12,color:'#466E68'}}>{label}</Text>
          <Text style={{fontSize:16,fontWeight:'500',color:selected?'#104C49':'#648C83'}}>{selected?.label ?? placeholder}</Text>
        </View>
`+s.slice(b);
 return s;
});
for(const role of ['customer','worker'])edit(`mobile/src/app/(${role})/_layout.tsx`,s=>{
 s=s.replace("height: 78,","height: 74,").replace("marginBottom: 12,","marginBottom: 8,");
 s=s.replace("borderWidth: 1,\n            borderColor: 'rgba(255,255,255,0.8)',","borderWidth: 0,").replace("borderWidth: 1,\n          borderColor: 'rgba(255,255,255,0.8)',","borderWidth: 0,");
 s=s.replace("'rgba(247,201,72,0.82)'","'rgba(255,210,45,0.64)'");
 s=s.replace("{ borderRadius: 40, overflow: 'hidden' }","{ borderRadius: 40, overflow: 'hidden', justifyContent:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.55)' }");
 return s;
});
