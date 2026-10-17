import {spawnSync} from 'node:child_process';
import {mkdirSync,copyFileSync,readFileSync,writeFileSync} from 'node:fs';
const result=spawnSync(process.execPath,['node_modules/expo/bin/cli','export','--platform','web','--output-dir','../dist/client'],{cwd:process.cwd()+'/native-app',stdio:'inherit'});
if(result.status) process.exit(result.status);
mkdirSync('dist/server',{recursive:true}); mkdirSync('dist/.openai',{recursive:true});
copyFileSync('native-host/worker.mjs','dist/server/index.js');
copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
const p='dist/client/index.html';
writeFileSync(p,readFileSync(p,'utf8').replace('</head>','<style>body{background:#eef0f3!important}#root{max-width:520px;margin:auto;background:white;box-shadow:0 0 60px #142c4a15;min-height:100dvh}</style></head>'));
