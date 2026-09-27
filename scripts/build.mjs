import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import { APP_VERSION, BUILD_TAG } from '../src/build-info.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'dist');
const sourceHTML=await fs.readFile(path.join(root,'index.html'),'utf8');
const metaVersion=sourceHTML.match(/name="typekeeper-version" content="([^"]+)"/)?.[1];
const packageVersion=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8')).version;
if(metaVersion!==APP_VERSION||packageVersion!==APP_VERSION||!sourceHTML.includes(`— v${APP_VERSION}</title>`)){
 throw new Error(`Mixed SOURCE release identity: app ${APP_VERSION}, HTML ${metaVersion}, package ${packageVersion}. Fix before building.`);
}

await import('./manifest.mjs');
const sources=[];
async function collect(dir){for(const item of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,item.name);if(item.isDirectory())await collect(p);else sources.push([path.relative(root,p),await fs.readFile(p)]);}}
await collect(path.join(root,'src'));
const fingerprint=createHash('sha256');
for(const [p,bytes]of sources)fingerprint.update(p).update(bytes);
fingerprint.update(await fs.readFile(path.join(root,'index.html')));
const buildId=`${APP_VERSION}-${fingerprint.digest('hex').slice(0,16)}`;
await fs.rm(dest,{recursive:true,force:true});await fs.mkdir(dest,{recursive:true});
await fs.cp(path.join(root,'src'),path.join(dest,'src'),{recursive:true});
await fs.cp(path.join(root,'public'),dest,{recursive:true});
// Every relative JS import gets the SAME content fingerprint. Cache-busting only
// the entry script would still allow an old presentation.js to wrap the words.
for(const [name]of sources){if(!name.endsWith('.js'))continue;const p=path.join(dest,name);let s=await fs.readFile(p,'utf8');
 s=s.replace(/(\bfrom\s*['"])(\.\.?\/[^'"]+\.js)(['"])/g,`$1$2?v=${buildId}$3`);
 await fs.writeFile(p,s);
}
let html=await fs.readFile(path.join(root,'index.html'),'utf8');
html=html.replace(/(src|href)="(src\/[^"?]+\.(?:js|css))"/g,`$1="$2?v=${buildId}"`);
await fs.writeFile(path.join(dest,'index.html'),html);
await fs.writeFile(path.join(dest,'release.json'),JSON.stringify({version:APP_VERSION,buildId,tag:BUILD_TAG,wordRows:1,randomizedNewRuns:true},null,2)+'\n');
const list=[];
async function walk(dir){for(const item of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,item.name);if(item.isDirectory())await walk(p);else{const bytes=await fs.readFile(p);list.push({path:path.relative(dest,p).split(path.sep).join('/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}}
await walk(dest);
await fs.writeFile(path.join(dest,'build-manifest.json'),JSON.stringify({version:APP_VERSION,buildId,files:list},null,2)+'\n');
console.log(`Built ${list.length} local files; ${(list.reduce((n,p)=>n+p.bytes,0)/1024/1024).toFixed(2)} MiB. Build ${buildId}`);
const {standalone}=await import('./standalone.mjs');await standalone(root);
