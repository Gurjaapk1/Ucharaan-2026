// Run the shared prototype behavior checks against the native TypeScript modules.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const ts=require('../native-app/node_modules/typescript');
const base='tmp/reward-tests';
fs.mkdirSync(base+'/src/KidsMode',{recursive:true});fs.mkdirSync(base+'/tests',{recursive:true});
fs.writeFileSync(base+'/package.json','{"type":"module"}');
for(const name of ['wardrobe','rewards','experience','content']) {
 const source=fs.readFileSync(`native-app/src/KidsMode/${name}.ts`,'utf8');
 const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/from '(\.\/[^']+)'/g,"from '$1.js'");
 fs.writeFileSync(`${base}/src/KidsMode/${name}.js`,output);
}
fs.copyFileSync('native-app/src/bani.json',base+'/src/bani.json');
const tests=['wardrobe','rewards','experience'].map(name=>`${base}/tests/${name}.test.mjs`);
for(const name of ['wardrobe','rewards','experience'])fs.copyFileSync(`native-host/reward-tests/${name}.test.mjs`,`${base}/tests/${name}.test.mjs`);
process.exit(spawnSync(process.execPath,['--test',...tests],{stdio:'inherit'}).status??1);
