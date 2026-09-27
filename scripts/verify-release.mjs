import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {APP_VERSION} from '../src/build-info.js';
export async function verifyRelease(project){
 const root=path.join(project,'dist'),manifest=JSON.parse(await fs.readFile(path.join(root,'build-manifest.json'),'utf8'));
 if(manifest.version!==APP_VERSION)throw new Error(`Wrong prebuilt version: ${manifest.version}; expected ${APP_VERSION}. Run npm run build or re-extract the FULL ZIP.`);
 if(!Array.isArray(manifest.files)||manifest.files.length<20)throw new Error('Incomplete build manifest. Re-extract the FULL ZIP.');
 for(const item of manifest.files){
  const file=path.resolve(root,item.path);
  if(!file.startsWith(root+path.sep))throw new Error('Unsafe release path.');
  const bytes=await fs.readFile(file);
  if(bytes.length!==item.bytes||createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw new Error(`Mixed/damaged game file: ${item.path}. Run npm run build or re-extract the FULL ZIP.`);
 }
 return manifest;
}
