const fs = require('fs');
const path = require('path');
const root = path.resolve('mobile');
const files = [];
function walk(dir) { for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {const p=path.join(dir,entry.name); if(entry.isDirectory())walk(p);else if(p.endsWith('.tsx'))files.push(p);} }
for(const folder of ['app','components','onboarding','location'])walk(path.join(root,'src',folder));
const colors = {
 '#EDF1F7':'#F7F9F5','#F4F7FB':'#F7F9F5','#F8FAFE':'#F7F9F5',
 '#202D42':'#104C49','#203B66':'#104C49','#405C92':'#145C58','#59677D':'#466E68',
 '#45556E':'#466E68','#647A9E':'#145C58','#7890B5':'#145C58',
 '#24272D':'#104C49','#141519':'#145C58','#303744':'#145C58',
 '110,145,195':'20,92,88','171,198,237':'247,201,72','158,186,229':'247,201,72',
 '210,226,249':'247,201,72','225,228,234':'247,201,72','152,159,173':'20,92,88',
};
for(const file of files) {
 let s=fs.readFileSync(file,'utf8');
 for(const [old,next] of Object.entries(colors))s=s.split(old).join(next);
 if(s.includes('<SafeAreaView className="flex-1 bg-canvas">')) {
   const rel=path.relative(path.dirname(file),path.join(root,'src/components/theme')).replaceAll('\\','/');
   s=`import { GlassBackdrop } from '${rel.startsWith('.')?rel:'./'+rel}';\n`+s;
   s=s.replaceAll('<SafeAreaView className="flex-1 bg-canvas">','<SafeAreaView className="flex-1 bg-canvas">\n      <GlassBackdrop />');
 }
 s=s.replaceAll('bg-blue-400/10','bg-tinted').replaceAll('text-blue-700','text-accent').replaceAll('border-blue-400/30','border-outline');
 fs.writeFileSync(file,s);
}
let s=fs.readFileSync(path.join(root,'tailwind.config.js'),'utf8');
for(const [old,next] of Object.entries(colors))s=s.split(old).join(next);
s=s.replace("'rgba(100,137,198,0.12)'","'rgba(247,201,72,0.23)'").replace("'rgba(110,132,167,0.25)'","'rgba(255,255,255,0.96)'");
s=s.replace("accent: '#145C58',","accent: '#145C58',\n        sunshine: '#F7C948',\n        mint: '#DCEEE7',");
fs.writeFileSync(path.join(root,'tailwind.config.js'),s);
