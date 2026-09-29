import fs from 'node:fs/promises';
import path from 'node:path';
import { Script } from 'node:vm';
const modules=['build-info.js','game/random.js','game/assets.js','data/campaign.js','game/pressure.js','game/controls.js','game/rules.js','data/words.js','game/economy.js','game/model.js','game/clock.js','game/chapter-records.js','game/score-chase.js','game/storage.js','audio/mix.js','audio/audio.js','ui/icons.js','ui/score-rollup.js','ui/contextual-guidance.js','ui/layout.js','ui/campaign-entry.js','ui/journey.js','render/book-leaf.js','render/imperial-scroll.js','render/presentation.js','render/chapter-art.js','render/elemental-art.js','render/classic-renderer.js','render/impact.js','render/atrium.js','render/renderer.js','main.js'];
const mime={'.webp':'image/webp','.svg':'image/svg+xml','.wav':'audio/wav','.mp3':'audio/mpeg','.json':'application/json'};
/** Creates a genuine, no-fetch, non-module, single-file playable build. No prototype shims. */
export async function standalone(root){
 const assets={};
 for(const name of await fs.readdir(path.join(root,'public/assets'))){
  const p=path.join(root,'public/assets',name);if((await fs.stat(p)).isFile())assets[`assets/${name}`]=`data:${mime[path.extname(p)]||'application/octet-stream'};base64,${(await fs.readFile(p)).toString('base64')}`;
 }
 const scripts=[];
 const emitted=new Set();
 for(const name of modules){
  const content=await fs.readFile(path.join(root,'src',name),'utf8');
  for(const match of content.matchAll(/\bfrom\s*['"](\.\.?\/[^'"]+\.js)['"]/g)){
   const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1]));
   if(!emitted.has(dependency))throw new Error(`Standalone dependency missing or out of order: ${name} needs ${dependency}`);
  }
  emitted.add(name);
 }
 for(const module of modules){let code=await fs.readFile(path.join(root,'src',module),'utf8');code=code.replace(/^import .*?;\s*$/gm,'').replace(/\bexport (?=(?:const|class|function|let)\b)/g,'');scripts.push(code);}
 let html=await fs.readFile(path.join(root,'index.html'),'utf8');
 html=html.replace(/<link[^>]*>/g,'').replace(/<script>if\(location.protocol==='file:'\)[\s\S]*?<\/script>/,'').replace('<script type="module" src="src/main.js"></script>','');
 html=html.replace(/src="(assets\/[^" ]+)"/g,(_,p)=>`src="${assets[p]||p}"`);
 const css=await fs.readFile(path.join(root,'src/styles.css'),'utf8');
 html=html.replace('</head>',`<link rel="icon" href="${assets['assets/favicon.svg']}"><style>${css}</style></head>`);
 const code=`globalThis.__TM_EMBEDDED_ASSETS__=Object.freeze(${JSON.stringify(assets)});\n${scripts.join('\n')}`;
 new Script(code,{filename:'Typekeeper embedded bundle'});
 html=html.replace('</body>',`<script>${code.replace(/<\/script/gi,'<\\/script')}</script></body>`);
 await fs.writeFile(path.join(root,'PLAY.html'),html);
 console.log(`Standalone PLAY.html: ${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MiB. All art, music and code embedded.`);
}
