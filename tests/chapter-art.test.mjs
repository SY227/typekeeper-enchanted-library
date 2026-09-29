import {productionBaselineBytes} from './production-baseline.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { CAMPAIGN } from '../src/data/campaign.js';
import { CHAPTER_ART, chapterArtForLevel, paintChapterDecoration, paintChapterMotion } from '../src/render/chapter-art.js';
import { ElementalArt, ELEMENTAL_LIMITS, elementalEnvelope, frozenArtStrength } from '../src/render/elemental-art.js';
import { GameModel } from '../src/game/model.js';
function strictContext(){
 let depth=0;const calls=[];
 const value={save(){depth++;},restore(){assert(depth>0,'unbalanced restore');depth--;},createLinearGradient(...args){assert.equal(args.length,4);assert(args.every(Number.isFinite));return {addColorStop(at,color){assert(at>=0&&at<=1);assert.equal(typeof color,'string');}};},createRadialGradient(...args){assert.equal(args.length,6);assert(args.every(Number.isFinite));assert(args[2]>=0&&args[5]>=0);return {addColorStop(){}};},bezierCurveTo(...args){assert.equal(args.length,6);assert(args.every(Number.isFinite));},quadraticCurveTo(...args){assert.equal(args.length,4);assert(args.every(Number.isFinite));},arc(...args){assert(args.length>=5);assert(args.slice(0,5).every(Number.isFinite));assert(args[2]>=0);},ellipse(...args){assert(args.length>=7);assert(args.slice(0,7).every(Number.isFinite));assert(args[2]>=0&&args[3]>=0);},get depth(){return depth;}};
 return new Proxy(value,{get:(o,k)=>k in o?o[k]:(...args)=>{calls.push(k);assert(args.every(v=>typeof v!=='number'||Number.isFinite(v)),`${k}: nonfinite coordinate`);},set:(o,k,v)=>{if(['globalAlpha','lineWidth'].includes(k)){assert(Number.isFinite(v),`${k}: finite`);if(k==='globalAlpha')assert(v>=0&&v<=1);}o[k]=v;return true;}});
}
for(const stage of CAMPAIGN)test(`Chapter ${stage.level}: ${stage.title} has its own named, title-aligned cosmetic profile`,()=>{
 const a=chapterArtForLevel(stage.level);assert.equal(a.title,stage.title);assert.equal(a.level,stage.level);assert.equal(a.wing,stage.wing);assert.equal(a.trial,stage.trial);assert.equal(typeof a.prop,'string');assert(a.description.length>20);assert.match(a.accent,/^#[0-9a-f]{6}$/i);assert(Object.isFrozen(a));
 const c=strictContext();paintChapterDecoration(c,a);assert.equal(c.depth,0);for(const t of [0,.1,3.5,600]){paintChapterMotion(c,a,t,true);assert.equal(c.depth,0);}
});
test('Exactly 48 unique cosmetic IDs correspond to the existing 48 campaign titles',()=>{assert.equal(CHAPTER_ART.length,48);assert.equal(new Set(CHAPTER_ART.map(a=>a.id)).size,48);assert.deepEqual(CHAPTER_ART.map(a=>a.title),CAMPAIGN.map(a=>a.title));assert(Object.isFrozen(CHAPTER_ART));});
test('Endless and invalid low chapter requests reuse bounded profiles rather than allocate unbounded art',()=>{assert.equal(chapterArtForLevel(99999),CHAPTER_ART[47]);for(const n of [0,-9,NaN,undefined,''])assert.equal(chapterArtForLevel(n),CHAPTER_ART[0]);});
test('Reduced motion removes chapter ambient drawing, not chapter identity',()=>{let calls=0;const c=new Proxy({},{get:()=>()=>{calls++;}});for(const art of CHAPTER_ART)paintChapterMotion(c,art,300,false);assert.equal(calls,0);assert.equal(chapterArtForLevel(10).title,'Rain on Glass');});
test('All native-path argument counts remain valid for FIRE and ICE across the complete cast envelope',()=>{const a=new ElementalArt();a.flameTexture=()=>({width:112,height:176});const c=strictContext();for(const p of [0,.001,.05,.17,.33,.5,.75,.99,1,1.5]){a.drawFireCast(c,{t:p*.65,life:.65});a.drawIceCast(c,{t:p*.65,life:.65});assert.equal(c.depth,0);}});
test('FIRE and ICE destruction draw valid, balanced paths at onset, peak and completion',()=>{const a=new ElementalArt();a.flameTexture=()=>({width:112,height:176});a.cardFrostTexture=()=>({width:544,height:184});const c=strictContext();for(const width of [112,260,708])for(const p of [0,.01,.08,.159,.16,.42,.9,1]){const l={width,height:60},d={t:p*.58,life:.58,seed:2};a.drawBurn(c,d,{},l);a.drawShatter(c,d,{},l);assert.equal(c.depth,0);}});
test('Elemental cast envelope never returns nonfinite or unbounded intensity',()=>{for(const t of [-9,0,.01,.12,.32,.65,5,NaN,Infinity])for(const life of [0,.65,1])for(const v of Object.values(elementalEnvelope(t,life)))assert(Number.isFinite(v)&&v>=0&&v<=1);});
test('Freeze entry, hold, thaw and reduced-motion state are bounded',()=>{for(const remaining of [0,.001,.6,5.9,6,NaN,Infinity])for(const age of [0,.1,.3,1,NaN])for(const thaw of [0,.1,.7])for(const motion of [false,true]){const v=frozenArtStrength(remaining,age,thaw,motion);assert(Number.isFinite(v)&&v>=0&&v<=1);}assert.equal(frozenArtStrength(0,1,0),0);assert.equal(frozenArtStrength(0,1,.7,false),0);assert.equal(frozenArtStrength(6,0,0,false),.85);});
test('Elemental cache obeys byte and entry budgets under many surface widths',()=>{const a=new ElementalArt();for(let i=0;i<220;i++){a.retain(String(i),()=>({width:820,height:190}));assert(a.bytes<=ELEMENTAL_LIMITS.cacheBytes);assert(a.cache.size<=ELEMENTAL_LIMITS.cacheEntries);}const im=a.retain('final',()=>({width:80,height:20}));assert.equal(a.retain('final',()=>{throw new Error('not cached');}),im);});
test('48 room profiles and VFX calculations do not advance either model random stream',()=>{const a=new GameModel(),b=new GameModel();a.start({seed:123,wordSeed:736});b.start({seed:123,wordSeed:736});for(let n=1;n<180;n++){chapterArtForLevel(n);elementalEnvelope(n/200);frozenArtStrength(6-n*.01,n*.01,0);}for(let n=0;n<60;n++){a.words=[];b.words=[];a.spawn();b.spawn();assert.deepEqual(a.snapshot(),b.snapshot());}});
test('3.5 preservation: original assets, economy, RNG, controls and scroll geometry are byte-identical',()=>{
 const expected=JSON.parse(fs.readFileSync(new URL('./fixtures/v340-unchanged.json',import.meta.url)));
 for(const [p,hash] of Object.entries(expected))assert.equal(createHash('sha256').update(productionBaselineBytes(p,fs.readFileSync(new URL('../'+p,import.meta.url)))).digest('hex'),hash,p);
});
test('Standalone builder includes both new presentation dependencies before the renderer',()=>{const s=fs.readFileSync(new URL('../scripts/standalone.mjs',import.meta.url),'utf8');for(const name of ['chapter-art.js','elemental-art.js']){assert(s.includes(`'render/${name}'`));assert(s.indexOf(`'render/${name}'`)<s.indexOf("'render/renderer.js'"));}});
