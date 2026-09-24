import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'dist');
await import('./manifest.mjs');
await fs.rm(dest,{recursive:true,force:true});await fs.mkdir(dest,{recursive:true});
await fs.copyFile(path.join(root,'index.html'),path.join(dest,'index.html'));
await fs.cp(path.join(root,'src'),path.join(dest,'src'),{recursive:true});
await fs.cp(path.join(root,'public'),dest,{recursive:true});
const list=[];
async function walk(dir){for(const item of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())await walk(p);else{const bytes=await fs.readFile(p);list.push({path:path.relative(dest,p).split(path.sep).join('/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}}
await walk(dest);
await fs.writeFile(path.join(dest,'build-manifest.json'),JSON.stringify({version:'3.2.0',files:list},null,2));
console.log(`Built ${list.length} local files; ${(list.reduce((n,p)=>n+p.bytes,0)/1024/1024).toFixed(2)} MiB. No CDN or network build dependency.`);
const {standalone}=await import('./standalone.mjs');
await standalone(root);
