const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
// The deploy folder only contains the runtime files; backups/tests are never published.
for (const name of ['app.js','jobs.js','job-picker.js','dashboard.js','nexon-bridge.js','nexon-ui.js']) {
  new vm.Script(fs.readFileSync(path.join(root,'src',name),'utf8'),{filename:name});
}
new vm.Script(fs.readFileSync(path.join(root,'netlify/functions/nexon.cjs'),'utf8'),{filename:'nexon.cjs'});
fs.mkdirSync(out,{recursive:true});
for (const folder of ['assets','src']) fs.cpSync(path.join(root,folder),path.join(out,folder),{recursive:true});
fs.copyFileSync(path.join(root,'index.html'),path.join(out,'index.html'));
const files = ['index.html','src/app.js','src/dashboard.js','src/jobs.js','src/dashboard.css','assets/jobs/default.svg'];
for (const name of files) if (!fs.existsSync(path.join(out,name))) throw new Error('Missing deploy file: '+name);
console.log('Production build succeeded: '+out);
