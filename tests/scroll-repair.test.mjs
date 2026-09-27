import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SCROLL,scrollGeometry,scrollInsets,scrollPalette,SCROLL_PALETTES} from '../src/render/imperial-scroll.js';
import {readableCardLayout} from '../src/render/presentation.js';
import {WORD_BANK} from '../src/data/words.js';
import {GameRenderer} from '../src/render/renderer.js';
import {GameModel} from '../src/game/model.js';
const measure=(text,size)=>({width:text.length*size*.8,actualBoundingBoxLeft:.6,actualBoundingBoxRight:text.length*size*.8+.9});
const corpus=Object.values(WORD_BANK).flat();
for(const kind of ['normal','fire','ice','slow','wind','bonus'])test(`${kind}: the ink, emblem and drawn hardware have separate safe regions for every authored word`,()=>{
 const insets=scrollInsets(kind);
 for(const scale of [.65,.72,.83555556,1,1.18,2])for(const text of corpus){
  const l=readableCardLayout(text,410,kind,scale,measure),g=scrollGeometry(l.width,l.height);
  assert(l.inkLeft>=l.safeLeft);assert(l.inkRight<=l.safeRight);
  assert(l.inkLeft+l.width/2>g.leftRodInner+8);
  assert(l.inkRight+l.width/2<g.rightRodInner-8);
  assert.equal(l.lines.length,1);assert.equal(l.lines[0].text,text);assert.equal(l.baseline,0);
  if(insets.badge){
   assert(g.badgeX-g.badgeRadius>=g.pageLeft+10);
   assert(g.badgeX-g.badgeRadius>g.leftRodInner+10);
   assert(l.inkLeft+l.width/2>=g.badgeX+g.badgeRadius+SCROLL.badgeTextGap);
   assert.equal(g.badgeY,l.height/2);
  }
 }
});
for(const text of ['INK','I','WONDER','STORY','IMAGINE','BIOLUMINESCENT'])test(`${text}: short and long scrolls fit their actual content, not the old model width`,()=>{
 for(const kind of ['normal','fire','bonus']){
  const a=readableCardLayout(text,112,kind,.835,measure),b=readableCardLayout(text,700,kind,.835,measure);
  assert.deepEqual(a,b);const inset=scrollInsets(kind),used=a.inkRight-a.inkLeft;
  assert(a.width<=Math.max(SCROLL.minWidth,Math.ceil(used+inset.left+inset.right+SCROLL.horizontalInkGuard*2)));
 }
});
test('Extreme 24-W custom cards remain single-line with a protected crest and both rollers',()=>{
 for(const kind of ['normal','fire','ice','slow','wind','bonus']){
  const l=readableCardLayout('W'.repeat(24),900,kind,.65,measure);
  assert(l.width<=708);assert(l.inkLeft>=l.safeLeft);assert(l.inkRight<=l.safeRight);assert.equal(l.lines.length,1);
 }
});
test('Ink overhangs are accounted for rather than relying only on advance width',()=>{
 const l=readableCardLayout('IMAGINE',112,'normal',1,()=>({width:150,actualBoundingBoxLeft:3,actualBoundingBoxRight:155}));
 assert.equal(l.inkRight-l.inkLeft,158);assert(l.textX-l.safeLeft>=3);assert(l.safeRight-(l.textX+155)>=0);
});
test('Geometry remains frozen and defaults invalid dimensions safely',()=>{
 for(const bad of [NaN,Infinity,-3,0]){
  const g=scrollGeometry(bad);assert(Object.isFrozen(g));assert(g.width>=112);assert.equal(g.height,60);
 }
 assert(Object.isFrozen(SCROLL));assert(Object.isFrozen(SCROLL_PALETTES));assert.equal(scrollPalette('missing'),SCROLL_PALETTES.normal);
});
test('The ornament and tassels fit inside the pre-existing texture padding',()=>{
 const g=scrollGeometry(240);assert(g.minY>-g.pad);assert(g.maxY<g.height+g.pad);
});
test('Native WIND paths use all six cubic coordinates while FIRE/ICE/SLOW also draw without invalid parameters',()=>{
 const c=new Proxy({bezierCurveTo:(...args)=>{assert.equal(args.length,6);assert(args.every(Number.isFinite));},createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 const r={settings:{motion:true},frost(){}};
 for(const power of ['fire','ice','slow','wind'])for(const t of [0,.1,.325,.649,.65])GameRenderer.prototype.drawSpell.call(r,c,{power,t,life:.65});
});
test('Reduced-motion casting emits no animated drawing calls',()=>{
 let calls=0;const c=new Proxy({}, {get:()=>()=>{calls++;}});
 for(const power of ['fire','ice','slow','wind'])GameRenderer.prototype.drawSpell.call({settings:{motion:false}},c,{power,t:.2,life:.65});
 assert.equal(calls,0);
});
test('Sizing repeated scrolls does not mutate game state or advance either random stream',()=>{
 const a=new GameModel(),b=new GameModel();a.start({seed:3434,wordSeed:778});b.start({seed:3434,wordSeed:778});
 for(let i=0;i<1000;i++)readableCardLayout(corpus[i%corpus.length],112,['normal','ice'][i%2],.835,measure);
 for(let i=0;i<30;i++){a.words=[];b.words=[];a.spawn();b.spawn();assert.deepEqual(a.snapshot(),b.snapshot());}
});
test('Standalone compiler includes scroll dependency before its consumers and checks the assembled script',()=>{
 const s=fs.readFileSync(new URL('../scripts/standalone.mjs',import.meta.url),'utf8');
 assert(s.indexOf("'render/imperial-scroll.js'")<s.indexOf("'render/presentation.js'"));assert(s.includes('new Script(code'));
 assert(s.includes('Standalone dependency missing or out of order'));
});
test('Build rejects inconsistent HTML/application/package identity before exporting',()=>{
 const s=fs.readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');assert(s.includes('metaVersion!==APP_VERSION'));assert(s.includes('packageVersion!==APP_VERSION'));
});
