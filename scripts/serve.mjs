import { verifyRelease } from './verify-release.mjs';
import { APP_VERSION } from '../src/build-info.js';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),source=args.includes('--source');
const root=source?project:path.join(project,'dist');
const portIndex=args.indexOf('--port');let port=portIndex>=0?Number(args[portIndex+1]):4355;
if(!Number.isInteger(port)||port<1024||port>65535){console.error('Use a port between 1024 and 65535.');process.exit(1);}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.wav':'audio/wav','.mp3':'audio/mpeg','.ico':'image/x-icon'};
try{await fs.access(path.join(root,'index.html'));}catch{console.error('No prebuilt app found. Run npm run build first.');process.exit(1);}
const verified=source?{buildId:'source-'+APP_VERSION}:await verifyRelease(project);
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Method not allowed');return;}
  const raw=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(raw.includes('\0'))throw new Error('Invalid path');
  const relative=raw==='/'?'index.html':raw.replace(/^\/+/,''),base=source&&relative.startsWith('assets/')?path.join(project,'public'):root;
  const file=path.resolve(base,relative);
  if(!file.startsWith(base+path.sep)&&file!==base){res.writeHead(403);res.end('Forbidden');return;}
  const stat=await fs.stat(file);if(!stat.isFile())throw new Error('Not a file');const data=await fs.readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
let attempts=0;
server.on('error',err=>{if(err.code==='EADDRINUSE'&&attempts++<10){port++;server.listen(port,'127.0.0.1');}else{console.error(err.message);process.exit(1);}});
server.on('listening',()=>{
 const url=`http://127.0.0.1:${port}/?build=${verified.buildId}`;console.log(`\nTypekeeper: Enchanted Library v${APP_VERSION}\nBuild: ${verified.buildId}\nFolder: ${root}\n${url}\nServing ${source?'editable source':'prebuilt dist'} locally. Ctrl+C stops the server.\n`);
 if(args.includes('--open')){
  const cmd=process.platform==='darwin'?'open':process.platform==='win32'?'cmd':'xdg-open';const params=process.platform==='win32'?['/c','start','',url]:[url];
  const child=spawn(cmd,params,{stdio:'ignore',detached:true});child.on('error',()=>console.log('Open the URL above in your browser.'));child.unref();
 }
});
server.listen(port,'127.0.0.1');
