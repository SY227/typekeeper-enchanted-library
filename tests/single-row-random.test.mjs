import test from 'node:test';
import assert from 'node:assert/strict';
import {GameModel} from '../src/game/model.js';
import {LocalStore} from '../src/game/storage.js';
import {WORD_BANK,banksForLevel} from '../src/data/words.js';
import {readableCardLayout} from '../src/render/presentation.js';
import {GameRenderer} from '../src/render/renderer.js';
import {RULES,POWERS} from '../src/game/rules.js';
import {freshRunSeed} from '../src/game/random.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const words=Object.values(WORD_BANK).flat();
const measure=(text,size)=>[...text].reduce((n,c)=>n+(c==='W'?1.13:c==='I'?.44:.82)*size,0);
const draw=(m,n=12)=>Array.from({length:n},()=>{m.words=[];assert.equal(m.spawn(),true);return structuredClone(m.words[0]);});
const textRun=(m,n=12)=>draw(m,n).map(w=>w.text);
for(const scale of [.5,.65,.72,.8355555556,1,1.18,1.5,2])test(`All ${words.length} authored words × 6 materials remain complete single rows at scale ${scale}`,()=>{
 for(const text of words)for(const kind of ['normal',...POWERS,'bonus']){
  const l=readableCardLayout(text,410,kind,scale,measure);
  assert.equal(l.lines.length,1);assert.equal(l.lines[0].text,text);assert.equal(l.baseline,0);assert.equal(l.height,60);
  assert.ok(l.textWidth<=l.textMaxWidth+.001);assert.ok(l.width<=708);assert.equal(l.textX,l.lines[0].x);
  assert.ok(Object.isFrozen(l)&&Object.isFrozen(l.lines));
 }
});
test('24 widest glyphs fit card bounds instead of wrapping or clipping',()=>{for(const kind of ['normal',...POWERS]){const l=readableCardLayout('W'.repeat(24),900,kind,.65,measure);assert.ok(l.textWidth<=l.width-(kind==='normal'?30:60)+.001);assert.equal(l.lines.length,1);assert.equal(l.text,'W'.repeat(24));}});
test('Renderer ignores an obsolete two-line layout and paints only the complete canonical word',()=>{
 const draws=[],base=readableCardLayout('EXTRAORDINARY',300,'normal',.84,measure);
 const layout={...base,lines:[{text:'EXTRA',x:0,y:-14},{text:'ORDINARY',x:0,y:14}]};
 const context=new Proxy({fillText:(text,x,y)=>draws.push({text,x,y}),measureText:text=>({width:text.length*19})},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const fake={cardTexture:()=>({}),model:{buffer:'EXTRA',effects:{ice:0}},keyGlints:new Map(),settings:{motion:false},assets:{}};
 GameRenderer.prototype.paintCard.call(fake,context,{id:1,text:'EXTRAORDINARY',kind:'normal'},layout,{matching:true});
 assert.ok(draws.length>=1);assert.ok(draws.every(d=>d.text==='EXTRAORDINARY'&&d.y===0));
});
test('New runs use non-repeating consecutive entropy seeds, including same-tick fallback',()=>{
 const repeated={getRandomValues:a=>{a[0]=123;return a}};let last;for(let i=0;i<100;i++){const seed=freshRunSeed(repeated);assert.notEqual(seed,last);last=seed;}
 const fallback=new Set(Array.from({length:200},()=>freshRunSeed(null)));assert.equal(fallback.size,200);
});
test('100 default new runs do not reuse one seed or the INK/TALE/BOOK/PAGE opening',()=>{
 const seeds=new Set(),openings=new Set();for(let i=0;i<100;i++){const m=new GameModel();m.start();seeds.add(m.seed);const s=textRun(m,8).join('/');assert.ok(!s.startsWith('INK/TALE/BOOK/PAGE'));openings.add(s);}assert.equal(seeds.size,100);assert.equal(openings.size,100);
});
test('200 explicit run seeds produce 200 different twelve-word openings',()=>{
 const signatures=new Set(),first=new Set();for(let seed=0;seed<200;seed++){const m=new GameModel();m.start({seed});const s=textRun(m);signatures.add(s.join('/'));first.add(s[0]);}assert.equal(signatures.size,200);assert.ok(first.size>100);
});
for(const level of [1,2,6,12,24,36,48,49,200])test(`Chapter ${level}: random words use authored pools, no active duplicate or recent repeat`,()=>{
 const m=new GameModel();m.start({seed:42,level});const bank=new Set(Object.values(banksForLevel(level)).flat()),history=[];
 for(let i=0;i<200;i++){m.words=[];m.spawn();const w=m.words[0];assert.ok(bank.has(w.text));assert.ok(!history.slice(-9).includes(w.text));history.push(w.text);}
 m.words=[];m.recentWords=[];for(let i=0;i<10;i++){m.spawn();for(const w of m.words)w.y+=90;}assert.equal(new Set(m.words.map(w=>w.text)).size,m.words.length);
});
test('Fixed seed plus word seed still reproduces the complete word and item sequence',()=>{
 const a=new GameModel(),b=new GameModel();a.start({seed:81,wordSeed:912,level:24});b.start({seed:81,wordSeed:912,level:24});assert.deepEqual(draw(a,100),draw(b,100));
});
for(const pace of ['relaxed','classic','maniac'])test(`${pace}: retry draws new words but restores score, danger, books, pacing and item schedule`,()=>{
 const m=new GameModel();m.start({seed:42,pace,level:12});m.score=3200;m.danger=28;m.inventory.ice=1;m.inventory.wind=2;const cp=m.checkpoint(),before=draw(m,20);
 m.score=999999;m.danger=99;m.inventory.fire=2;m.retryChapter(cp,71);const opening=m.snapshot();
 assert.equal(opening.score,3200);assert.equal(opening.danger,28);assert.deepEqual(opening.inventory,cp.inventory);assert.equal(opening.seed,cp.seed);assert.notEqual(opening.wordSeed,cp.wordSeed);
 const after=draw(m,20);assert.notDeepEqual(after.map(w=>w.text),before.map(w=>w.text));assert.deepEqual(after.map(w=>w.kind),before.map(w=>w.kind));assert.deepEqual(after.map(w=>w.speed),before.map(w=>w.speed));
});
test('Repeated retries cannot accumulate failed-attempt earnings',()=>{const m=new GameModel();m.start({seed:25});const cp=m.checkpoint();for(let i=0;i<100;i++){m.score+=1000;m.inventory.ice=2;m.retryChapter(cp,i+900);assert.equal(m.score,0);assert.equal(m.inventory.ice,0);assert.equal(m.danger,0);}});
test('Continue restores the same vocabulary attempt, including a saved retry',()=>{
 const m=new GameModel();m.start({seed:44,level:6});const store=new LocalStore(memory());m.retryChapter(m.checkpoint(),515);const cp=m.checkpoint();assert.equal(store.setCheckpoint(cp),true);
 const before=draw(m,30),next=new GameModel();next.restoreCheckpoint(store.checkpoint());assert.deepEqual(draw(next,30),before);
});
test('Export/import preserves randomized vocabulary provenance without changing balance version',()=>{
 const a=new LocalStore(memory()),m=new GameModel();m.start({seed:22,wordSeed:8822});a.setCheckpoint(m.checkpoint());const payload=JSON.parse(a.exportData());assert.equal(payload.appVersion,'3.6.4');assert.equal(payload.checkpoints.classic.sequenceVersion,2);const b=new LocalStore(memory());b.importData(payload);assert.equal(b.checkpoint().wordSeed,8822);
});
test('Older bookmarks without vocabulary metadata retain legacy opener on Continue, but Retry randomizes',()=>{
 const m=new GameModel();m.start({seed:73,sequenceVersion:1});const cp=m.checkpoint();delete cp.wordSeed;delete cp.sequenceVersion;
 const old=draw(m,20),n=new GameModel();n.restoreCheckpoint(cp);assert.deepEqual(draw(n,20),old);assert.deepEqual(old.slice(0,4).map(w=>w.text),['INK','TALE','BOOK','PAGE']);n.retryChapter(cp,991);assert.notDeepEqual(draw(n,20).map(w=>w.text),old.map(w=>w.text));
});
test('Malformed vocabulary bookmark metadata is rejected',()=>{const m=new GameModel();m.start({seed:19});const cp=m.checkpoint(),s=new LocalStore(memory());for(const override of [{wordSeed:-1},{wordSeed:2**32},{wordSeed:NaN},{sequenceVersion:3},{wordSeed:undefined,sequenceVersion:2}])assert.equal(s.validCheckpoint({...cp,...override}),false);});
test('Renderer/readability calculations never advance the word RNG or change the model',()=>{
 const m=new GameModel();m.start({seed:90});const expected=new GameModel();expected.start({seed:90});for(let i=0;i<500;i++)readableCardLayout('UNDERSTANDING',300,'normal',.83,measure);assert.deepEqual(draw(m,100),draw(expected,100));
});
test('Word randomness cannot inject stock, shorten spell durations, or alter the sparse tutorial',()=>{
 for(let seed=0;seed<100;seed++){const m=new GameModel();m.start({seed});assert.ok(POWERS.every(p=>m.inventory[p]===0));const w=draw(m,12);assert.equal(w[5].kind,'ice');assert.equal(w.filter(w=>POWERS.includes(w.kind)).length,1);}assert.equal(RULES.inventoryCapacity,2);assert.equal(RULES.iceDuration,6);assert.equal(RULES.slowDuration,8);
});
