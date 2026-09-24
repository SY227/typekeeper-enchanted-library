import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'public/assets'),manifest=[];
for(const name of (await fs.readdir(dir)).sort()){
 if(name==='manifest.json')continue;
 const bytes=await fs.readFile(path.join(dir,name));
 manifest.push({id:name.replace(/\.[^.]+$/,''),path:'assets/'+name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),provenance:name.startsWith('typist-')?'Registered expression derivative of the supplied v1 typist master; deterministic Python/OpenCV paintover':name==='library.webp'||name==='typist.webp'?'V1 generated illustration / manual cutout master retained':'Original procedural vector artwork, texture, or synthesized audio',status:'shipped'});
}
// v3.2 adds two original, synchronized pressure stems; prior art and score are retained.
await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify({version:'3.2.0',assets:manifest},null,2)+'\n');
console.log(`Manifest verified: ${manifest.length} local assets.`);
