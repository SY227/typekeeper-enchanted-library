import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {APP_VERSION,BUILD_TAG} from '../src/build-info.js';
import {RULESET_VERSION,PREVIOUS_RULESET_VERSION,levelRules,RULES,PACES} from '../src/game/rules.js';
import {levelRules as priorRules} from './fixtures/baseline340/src/game/rules.js';
import {GameModel} from '../src/game/model.js';
import {LocalStore} from '../src/game/storage.js';
import {scoreChaseScope,scoreChaseKey,sanitizeScoreChaseRecord,SCORE_CHASE_LIMIT,ScoreChase} from '../src/game/score-chase.js';
import {chapterRecordKey} from '../src/game/chapter-records.js';
import {paintBoundFolio,paintLeatherSpine,BINDERY} from '../src/render/library-bindery.js';
import {productionBaselineBytes} from './production-baseline.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
const legacy=()=>JSON.parse(read('tests/fixtures/v363-save-for-364.json'));
const KEY='typekeeper-enchanted-library-v3.2.1';
function memory(raw=null){const data=new Map(raw?[[KEY,JSON.stringify(raw)]]:[]);return {data,getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};}
function model(level=1,pace='classic'){const m=new GameModel();m.start({level,pace,seed:9371,wordSeed:31});return m;}
function saveOne(m){let loops=0;while(!m.words.length&&loops++<600)m.step();assert(m.words.length);m.setBuffer(m.words[0].text);assert.equal(m.submit(),'word');}
for(const pace of Object.keys(PACES)){
 test(`${pace}: no campaign or Endless quota is 13 through level 10,000`,()=>{for(let n=1;n<=10000;n++){const q=levelRules(n,pace).quota;assert.notEqual(q,13);assert(Number.isInteger(q)&&q>=12&&q<=42);}});
 test(`${pace}: exactly chapters 3 and 4 gain one word; speed, arrival, trial and special rates unchanged`,()=>{const changed=[];for(let n=1;n<=1000;n++){const a=priorRules(n,pace),b=levelRules(n,pace);assert.deepEqual({...b,quota:a.quota},a);if(a.quota!==b.quota){changed.push(n);assert.equal(a.quota,13);assert.equal(b.quota,14);}}assert.deepEqual(changed,[3,4]);});
 for(const n of [3,4]){
  test(`${pace}, chapter ${n}: 13 correct submissions do not clear; only the fourteenth clears once`,()=>{const m=model(n,pace);for(let k=0;k<13;k++)saveOne(m);assert.equal(m.phase,'playing');assert.equal(m.progress,13);assert.equal(m.config.quota,14);assert.equal(m.stageHistory.length,0);saveOne(m);assert.equal(m.phase,'level-clear');assert.equal(m.stageHistory.length,1);assert.equal(m.stageHistory[0].words,14);assert.equal(m.stageHistory[0].ruleset,RULESET_VERSION);assert.equal(m.submit(),null);});
  test(`${pace}, chapter ${n}: FIRE clears paper, never counts toward the new 14-word target`,()=>{const m=model(n,pace);for(let k=0;k<12;k++)saveOne(m);m.inventory.fire=1;while(!m.words.length)m.step();assert(m.cast('fire'));assert.equal(m.progress,12);saveOne(m);assert.equal(m.phase,'playing');saveOne(m);assert.equal(m.phase,'level-clear');assert.equal(m.progress,14);});
 }
 test(`${pace}: migrated checkpoint uses quota 14 but keeps old score provenance and exact saved resources`,()=>{const old=legacy(),s=new LocalStore(memory(old)),cp=s.checkpoint(pace),m=model();assert(cp);m.restoreCheckpoint(cp);assert.equal(m.config.quota,14);assert.equal(m.score,1600);assert.equal(m.danger,18);assert.deepEqual(m.inventory,old.checkpoints[pace].inventory);assert.equal(m.scoreRuleset,PREVIOUS_RULESET_VERSION);const c=new ScoreChase();c.begin(scoreChaseScope(m),null,m.score);assert.equal(c.snapshot().state,'legacy');assert.equal(s.progress(pace).unlocked,13);});
 test(`${pace}: starting fresh preserves stars, unlocks and all historical scoped scores`,()=>{const old=legacy(),s=new LocalStore(memory(old)),before=structuredClone(s.data);const m=model(1,pace);s.setCheckpoint(m.checkpoint());assert.equal(s.checkpoint(pace).ruleset,RULESET_VERSION);assert.deepEqual(s.data.progress,before.progress);assert.deepEqual(s.data.records,before.records);assert.deepEqual(s.data.chapterBests,before.chapterBests);assert.deepEqual(s.data.scoreChaseBests,before.scoreChaseBests);assert.equal(s.scoreChaseBest(scoreChaseScope(m)),null);});
}
test('First wing has 84 required words, exactly two more than its prior 82',()=>{assert.equal(Array.from({length:6},(_,i)=>levelRules(i+1).quota).reduce((a,b)=>a+b),84);});
test('Every new scope is versioned while the browser storage key remains unchanged',()=>{assert.equal(RULESET_VERSION,'typekeeper-3.6.4');assert.equal(PREVIOUS_RULESET_VERSION,'typekeeper-3.2.1');assert.match(read('src/game/storage.js').toString(),/const KEY='typekeeper-enchanted-library-v3\.2\.1'/);});
test('Old chapter bests and running bests survive two real serializer reloads without silently disappearing',()=>{const raw=memory(legacy()),first=new LocalStore(raw);for(let i=0;i<2;i++){first.save();const s=new LocalStore(raw);assert.deepEqual(s.data.chapterBests,legacy().chapterBests);assert.deepEqual(s.data.scoreChaseBests,legacy().scoreChaseBests);assert.equal(s.data.records.length,3);assert(s.data.records.every(r=>r.mode==='legacy'&&r.ruleset===PREVIOUS_RULESET_VERSION));first.importData(JSON.parse(s.exportData()));}});
test('Historical 3.6.3 scopes are opt-in import-only; normal new-record writes still reject them',()=>{const r={ruleset:PREVIOUS_RULESET_VERSION,pace:'classic',mode:'campaign',startLevel:1,chapter:3,metric:'running-total',score:500};assert.equal(sanitizeScoreChaseRecord(r),null);assert(sanitizeScoreChaseRecord(r,{allowPrevious:true}));assert.equal(sanitizeScoreChaseRecord({...r,ruleset:'foreign'},{allowPrevious:true}),null);const s=new LocalStore(memory());assert.equal(s.recordScoreChase({...r,level:3}),false);});
test('Old PB cannot act as the target for a new quota profile, including after export/import',()=>{const s=new LocalStore(memory(legacy()));const scope=scoreChaseScope({pace:'classic',mode:'practice',startLevel:3,level:3});assert.equal(s.scoreChaseBest(scope),null);assert(s.recordScoreChase({...scope,score:700}));const copy=new LocalStore(memory());copy.importData(JSON.parse(s.exportData()));assert.equal(copy.scoreChaseBest(scope).score,700);assert(Object.keys(copy.data.scoreChaseBests).some(k=>k.includes(PREVIOUS_RULESET_VERSION)));});
test('Current and historical same-chapter records coexist without replacing each other',()=>{const s=new LocalStore(memory(legacy()));const old=s.chapterBest('classic','practice',3,PREVIOUS_RULESET_VERSION);const stage={level:3,medal:2,stageScore:222,accuracy:95,wpm:40,words:14,ruleset:RULESET_VERSION};assert.equal(s.recordChapter('classic','practice',stage).status,'first');assert.deepEqual(s.chapterBest('classic','practice',3,PREVIOUS_RULESET_VERSION),old);assert.equal(s.chapterBest('classic','practice',3).score,222);});
test('Legacy best in mastery summary survives subsequent current clears and serialization',()=>{const s=new LocalStore(memory(legacy()));const old=s.progress().stages[3].score;const stage={level:3,medal:1,stageScore:100,wpm:22,accuracy:75,ruleset:RULESET_VERSION};s.completeStage('classic',stage);assert.equal(s.progress().stages[3].legacyScore,old);s.completeStage('classic',{...stage,stageScore:150});const reread=new LocalStore(s.storage);assert.equal(reread.progress().stages[3].legacyScore,old);assert.equal(reread.progress().stages[3].medal,3);assert.equal(reread.progress().unlocked,13);});
test('Earlier records cannot fill the current-score budget and prevent a new PB',()=>{const s=new LocalStore(memory()),rows={};let count=0;for(let st=1;st<=48&&count<SCORE_CHASE_LIMIT;st++)for(let ch=st;ch<=48&&count<SCORE_CHASE_LIMIT;ch++){const r={ruleset:PREVIOUS_RULESET_VERSION,pace:'classic',mode:'campaign',startLevel:st,chapter:ch,metric:'running-total',score:++count};rows[scoreChaseKey(r)]=r;}s.importData({version:3,scoreChaseBests:rows});assert.equal(Object.keys(s.data.scoreChaseBests).length,SCORE_CHASE_LIMIT);assert(s.recordScoreChase({pace:'classic',mode:'campaign',startLevel:1,level:3,score:100}));assert.equal(Object.keys(s.data.scoreChaseBests).length,SCORE_CHASE_LIMIT+1);});
test('Malformed legacy keys and unsupported future rule tags are not accepted',()=>{const s=new LocalStore(memory());const r={ruleset:PREVIOUS_RULESET_VERSION,pace:'classic',mode:'campaign',startLevel:1,chapter:3,metric:'running-total',score:100};s.importData({version:3,scoreChaseBests:{wrong:r,[scoreChaseKey({...r,ruleset:'foreign'})]:{...r,ruleset:'foreign'}}});assert.deepEqual(s.data.scoreChaseBests,{});});
test('Denied save writes preserve original v3.6.3 bytes while keeping in-session progress',()=>{const raw=memory(legacy()),before=raw.getItem(KEY),s=new LocalStore(raw);raw.setItem=()=>{throw Error('denied');};s.setCheckpoint(model().checkpoint());assert.equal(raw.getItem(KEY),before);assert.equal(s.available,false);assert.equal(s.progress().unlocked,13);});
function recordedContext(){
 const ops=[],stack=[],state={globalAlpha:1,lineWidth:1};
 return new Proxy(state,{
  get(o,k){
   if(k==='ops')return ops;
   if(k==='depth')return stack.length;
   if(k in o)return o[k];
   if(k==='save')return()=>{stack.push({...state});ops.push(['save']);};
   if(k==='restore')return()=>{assert(stack.length);Object.assign(state,stack.pop());ops.push(['restore']);};
   if(k==='createLinearGradient'||k==='createRadialGradient')return(...a)=>{
    assert(a.every(Number.isFinite));ops.push([k,...a]);
    return {addColorStop(t,s){assert(t>=0&&t<=1);ops.push(['stop',t,s]);}};
   };
   return(...a)=>{assert(a.every(v=>typeof v!=='number'||Number.isFinite(v)),String(k));ops.push([String(k),...a]);};
  },
  set(o,k,v){
   if(k==='globalAlpha')assert(Number.isFinite(v)&&v>=0&&v<=1);
   if(k==='lineWidth')assert(v>=0&&Number.isFinite(v));
   o[k]=v;return true;
  }
 });
}
for(const stand of [false,true])for(const closed of [false,true])test(`Bindery geometry is finite, deterministic and state-balanced: stand=${stand}, closed=${closed}`,()=>{const a=recordedContext(),b=recordedContext();paintBoundFolio(a,{stand,closed});paintBoundFolio(b,{stand,closed});assert.equal(a.depth,0);assert.deepEqual(a.ops,b.ops);assert(a.ops.length>100);});
for(const w of [15,23,31,86])test(`Leather spine ${w}px retains state and uses deterministic material marks`,()=>{const c=recordedContext();paintLeatherSpine(c,0,0,w,90);assert.equal(c.depth,0);assert(c.ops.some(x=>x[0]==='clip'));});
test('Book support meets the shelf rather than floating; no per-frame animation or network used',()=>{assert.equal(BINDERY.shelfY,82);const source=read('src/render/library-bindery.js').toString();assert(!/Math\.random|Date\.now|fetch\(|setInterval|requestAnimationFrame/.test(source));assert(source.includes('function lectern'));assert(source.includes('function pagePoint'));assert(source.includes('function manuscript'));});
test('Bindery cannot advance either game random stream or change live-word input',()=>{const a=model(3),b=model(3);paintBoundFolio(recordedContext(),{stand:true});for(let i=0;i<50;i++){a.words=[];b.words=[];a.spawn();b.spawn();assert.deepEqual(a.snapshot(),b.snapshot());}});
test('App/package/lock/index/presentation identity agree on the shipped version',()=>{assert.equal(APP_VERSION,'3.6.4');assert.equal(BUILD_TAG,'bound-and-balanced-364');for(const name of ['package.json','package-lock.json'])assert.equal(JSON.parse(read(name)).version,APP_VERSION);assert(read('index.html').toString().includes('v'+APP_VERSION));assert(read('src/render/presentation.js').toString().includes(`PRESENTATION_VERSION='${APP_VERSION}'`));});
test('Original preservation hashes remain strict outside the exact approved source hunks',()=>{const patches=JSON.parse(read('tests/fixtures/production364-deltas.json'));for(const [file,p] of Object.entries(patches)){const normalized=productionBaselineBytes(file,read(file));assert.equal(createHash('sha256').update(normalized).digest('hex'),p.beforeSHA256);assert.throws(()=>productionBaselineBytes(file,Buffer.concat([read(file),Buffer.from('\n// unrelated change\n')])));}});
test('Standalone dependency graph includes book materials before chapter art',()=>{const text=read('scripts/standalone.mjs').toString();assert(text.indexOf("'render/library-bindery.js'")<text.indexOf("'render/chapter-art.js'"));});

test('Save import never deduplicates different difficulties with the same timestamp/score/seed',()=>{const s=new LocalStore(memory());const rows=['classic','relaxed','maniac'].map(pace=>({pace,mode:'campaign',startLevel:1,level:3,score:1000,date:1780000000000,seed:99,ruleset:RULESET_VERSION}));s.importData({version:3,records:rows});s.importData({version:3,records:rows});assert.equal(s.records.length,3);assert.equal(new Set(s.records.map(r=>r.pace)).size,3);});
