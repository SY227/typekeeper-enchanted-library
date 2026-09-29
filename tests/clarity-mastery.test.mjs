import test from 'node:test';
import assert from 'node:assert/strict';
import {GameModel} from '../src/game/model.js';
import {LocalStore} from '../src/game/storage.js';
import {RULES,RULESET_VERSION,streakMultiplier,scoreForWord,COMBO_RULES,wordCardWidth} from '../src/game/rules.js';
import {MEDAL_RULES,medalForStage,medalFeedback} from '../src/data/campaign.js';
import {chapterRecordKey,sanitizeChapterRecord,chapterAchievement} from '../src/game/chapter-records.js';
import {ContextualGuidance,readableHudSizes} from '../src/ui/contextual-guidance.js';
import {chapterJourney,completedWings,journeySealsHTML,WING_MARKS} from '../src/ui/journey.js';
import {OutcomeCue} from '../src/render/presentation.js';
import {GameAudio} from '../src/audio/audio.js';
import {WING_LANDMARKS,wingLandmarkForLevel} from '../src/render/chapter-art.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))};};
const run=()=>{const m=new GameModel();m.start({seed:7161,wordSeed:2991});m.drainEvents();return m;};
function add(m,text='BOOK',kind='normal'){const w={id:m.nextId++,text,kind,x:560,y:300,previousY:300,speed:30,width:wordCardWidth(text,kind)};m.words.push(w);return w;}
function correct(m,text='BOOK'){if(m.phase==='level-clear')m.nextLevel();add(m,text);m.setBuffer(text);m.submit();return m.drainEvents();}
const row=(patch={})=>({level:1,ruleset:RULESET_VERSION,stageScore:320,score:320,medal:2,wpm:48,accuracy:97,missed:1,wrong:1,seconds:40,...patch});
const provenance={seed:17,wordSeed:83291,sequenceVersion:2};

test('Star explanation shares the actual thresholds, including both simultaneous deficits',()=>{
 assert.deepEqual(MEDAL_RULES,[{medal:3,missed:0,wrong:0},{medal:2,missed:2,wrong:3}]);
 const a=medalFeedback({missed:3,wrong:0});assert.equal(a.medal,1);assert.equal(a.next,2);assert.equal(a.message,'For two stars, miss 1 fewer word.');
 const b=medalFeedback({missed:5,wrong:6});assert.equal(b.message,'For two stars, miss 3 fewer words and make 3 fewer wrong submissions.');
 const c=medalFeedback({missed:2,wrong:3});assert.equal(c.medal,2);assert.equal(c.next,3);assert.equal(c.missesToAvoid,2);assert.equal(c.wrongToAvoid,3);
});
test('Every generated next-star instruction actually reaches that star when fulfilled',()=>{
 for(let missed=0;missed<=30;missed++)for(let wrong=0;wrong<=30;wrong++){
  const f=medalFeedback({missed,wrong});assert.equal(f.medal,medalForStage({missed,wrong}));
  if(f.next)assert.equal(medalForStage({missed:missed-f.missesToAvoid,wrong:wrong-f.wrongToAvoid}),f.next);
  else assert.equal(f.medal,3);
 }
});
test('100% submission accuracy with three misses remains one star, not a new scoring rule',()=>{
 const m=run();m.stageMissed=3;m.missed=3;m.progress=m.config.quota-1;m.stageCorrect=m.progress;correct(m);
 assert.equal(m.lastClear.accuracy,100);assert.equal(m.lastClear.medal,1);assert.equal(m.lastClear.missed,3);assert.equal(m.lastClear.wrong,0);
 assert.equal(medalFeedback(m.lastClear).missesToAvoid,1);
});
test('Eight real multiplier upgrades occur at 8..64, never at 5/15 or after cap',()=>{
 const m=run(),notices=[];
 for(let n=1;n<=80;n++){
  const events=correct(m);const upgrades=events.filter(e=>e.type==='multiplier-up');notices.push(...upgrades);
  assert.equal(m.multiplier,Math.min(3,1+Math.floor(n/8)*.25));
  assert.equal(upgrades.length,n%8===0&&n<=64?1:0);
  if(upgrades.length){assert.equal(upgrades[0].streak,n);assert.equal(upgrades[0].multiplier,m.multiplier);assert.equal(upgrades[0].previous,m.multiplier-.25);}
 }
 assert.deepEqual(notices.map(e=>e.streak),[8,16,24,32,40,48,56,64]);
});
for(const n of [8,16,64])test(`Authoritative ${n-1} → ${n} event and word points agree`,()=>{
 const m=run();m.streak=n-1;const before=m.score;const events=correct(m);const ev=events.find(e=>e.type==='multiplier-up');
 assert.equal(ev.multiplier,streakMultiplier(n));assert.equal(m.score-before,scoreForWord('BOOK','normal',n));
});
test('Wrong input resets the multiplier; next correct input does not invent a level-up',()=>{
 const m=run();m.streak=40;m.setBuffer('ZZZUNKNOWN');m.submit();assert.equal(m.streak,0);assert.equal(m.multiplier,1);m.drainEvents();
 assert.equal(correct(m).some(e=>e.type==='multiplier-up'),false);
});
test('Restoring an existing streak/checkpoint emits no spurious multiplier upgrade',()=>{
 const a=run();while(a.phase==='playing')correct(a);const cp=a.checkpoint();cp.streak=16;cp.bestStreak=16;
 const b=run();b.restoreCheckpoint(cp);assert.equal(b.multiplier,1.5);assert.equal(b.drainEvents().some(e=>e.type==='multiplier-up'),false);
});
test('Audio milestone reacts to one model event, not its own correct-word modulus',()=>{
 const audio=new GameAudio({muted:true,sfx:false,music:false});
 audio.play({type:'correct',word:{text:'BOOK',kind:'normal',x:600},streak:8,collected:false});
 assert.equal(audio.cueLog.filter(e=>e.name==='streak').length,0);
 audio.play({type:'multiplier-up',streak:8,multiplier:1.25});assert.equal(audio.cueLog.filter(e=>e.name==='streak').length,1);
});
test('Record keys isolate all 288 pace/mode/chapter combinations and the ruleset',()=>{
 const keys=new Set();for(const pace of ['classic','relaxed','maniac'])for(const mode of ['campaign','practice'])for(let level=1;level<=48;level++)keys.add(chapterRecordKey({pace,mode,level}));
 assert.equal(keys.size,288);assert.notEqual(chapterRecordKey({level:1}),chapterRecordKey({level:1,ruleset:'other-1'}));
 for(const x of [{level:0},{level:49},{level:1.5},{level:1,mode:'endless'},{level:1,pace:'unknown'},{level:1,ruleset:'<script>'}])assert.equal(chapterRecordKey(x),null);
});
test('Chapter PB captures the previous atomic attempt before updating',()=>{
 const s=new LocalStore(memory()),first=s.recordChapter('classic','campaign',row(),provenance);assert.equal(first.status,'first');assert.equal(first.previous,null);
 const next=s.recordChapter('classic','campaign',row({stageScore:440,wpm:37,accuracy:91,medal:1,missed:4}),provenance);
 assert.equal(next.status,'improved');assert.equal(next.delta,120);assert.equal(next.previous.score,320);assert.equal(next.previous.wpm,48);
 const best=s.chapterBest('classic','campaign',1);assert.equal(best.score,440);assert.equal(best.wpm,37);assert.equal(best.accuracy,91);assert.equal(best.medal,1);assert.equal(best.wordSeed,83291);
 next.previous.score=99999;next.current.score=99999;best.score=99999;assert.equal(s.chapterBest('classic','campaign',1).score,440);
});
test('Ties/lower scores never mix WPM, accuracy or medal maxima into the score-best attempt',()=>{
 const s=new LocalStore(memory());s.recordChapter('classic','campaign',row(),provenance);
 assert.equal(s.recordChapter('classic','campaign',row({wpm:99,accuracy:100,medal:3}),provenance).status,'unchanged');
 assert.equal(s.recordChapter('classic','campaign',row({stageScore:100,wpm:120,accuracy:100}),provenance).status,'unchanged');
 const b=s.chapterBest('classic','campaign',1);assert.equal(b.wpm,48);assert.equal(b.accuracy,97);assert.equal(b.medal,2);
});
test('Practice, different pace and other chapter cannot beat a campaign chapter PB',()=>{
 const s=new LocalStore(memory());s.recordChapter('classic','campaign',row(),provenance);
 for(const [p,m,l]of [['relaxed','campaign',1],['classic','practice',1],['classic','campaign',2]]){
  const res=s.recordChapter(p,m,row({level:l,stageScore:1000}),provenance);assert.equal(res.status,'first');
 }
 assert.equal(s.chapterBest('classic','campaign',1).score,320);
 assert.equal(s.recordChapter('classic','endless',row({level:49}),provenance).status,'untracked');
 assert.equal(s.recordChapter('classic','campaign',row({ruleset:'typekeeper-3.2.0'}),provenance).status,'untracked');
});
test('Old saves preserve settings, mastery and checkpoints without inventing scoped PBs',()=>{
 const raw=memory(),m=run();const a=new LocalStore(raw);a.completeStage('classic',row());a.setCheckpoint(m.checkpoint());
 const old=JSON.parse(a.exportData());delete old.chapterBests;const s=new LocalStore(memory());s.importData(old);
 assert.equal(s.progress().stages[1].score,320);assert.equal(s.chapterBest('classic','campaign',1),null);
 assert.deepEqual(s.checkpoint(),a.checkpoint());assert.deepEqual(s.settings,a.settings);
});
test('Scoped save round trip retains actual word sequence provenance',()=>{
 const a=new LocalStore(memory());a.recordChapter('classic','practice',row(),provenance);
 const b=new LocalStore(memory());b.importData(JSON.parse(a.exportData()));assert.deepEqual(b.chapterBest('classic','practice',1),a.chapterBest('classic','practice',1));
});
test('Malformed or unscoped imports are rejected instead of promoted to a trusted PB',()=>{
 for(const patch of [{ruleset:undefined},{mode:undefined},{pace:undefined},{score:NaN},{score:-1},{level:1.5},{medal:7}])assert.equal(sanitizeChapterRecord({...row(),pace:'classic',mode:'campaign',...patch}),null);
 const s=new LocalStore(memory());const valid={...row(),pace:'classic',mode:'campaign'};
 s.importData({version:3,chapterBests:{'typekeeper-3.2.1|classic|campaign|1':{...valid,level:2},'__proto__':valid}});
 assert.equal(Object.keys(s.data.chapterBests).length,0);
});
test('Missing random provenance stays missing, not a fabricated seed or sequence version',()=>{
 const r=sanitizeChapterRecord({...row(),pace:'classic',mode:'campaign'});for(const k of ['seed','wordSeed','sequenceVersion'])assert.equal(k in r,false);
});
test('Mastery improvement has priority; unchanged attempts receive no fake celebration',()=>{
 const x=chapterAchievement({previousMedal:1,stage:row(),comparison:{status:'improved',delta:120}});assert.equal(x.kind,'mastery');assert.match(x.title,/First 2-star/);
 assert.equal(chapterAchievement({previousMedal:3,stage:row(),comparison:{status:'unchanged'}}),null);
 const y=chapterAchievement({previousMedal:3,stage:row(),comparison:{status:'improved',delta:120},paceLabel:'Classic',modeLabel:'Practice'});assert.match(y.title,/\+120/);assert.match(y.detail,/Practice/);
});
test('ENTER guidance is exact-match only and disappears after first actual save',()=>{
 const g=new ContextualGuidance();assert.equal(g.update({playing:true,exactMatch:false}).enter,false);
 assert.equal(g.update({playing:true,exactMatch:true}).enter,true);g.savedWord();assert.equal(g.update({playing:true,exactMatch:true}).enter,false);
 assert.equal(new ContextualGuidance(g.snapshot()).update({playing:true,exactMatch:true}).enter,false);
});
test('ICE hint waits for a usable spell and six visible active seconds, not wall time',()=>{
 const g=new ContextualGuidance();for(let i=0;i<150;i++){g.update({playing:false,iceReady:true,dt:.05});g.update({playing:true,iceReady:false,dt:.05});g.update({playing:true,iceReady:true,visible:false,dt:.05});}
 assert.equal(g.iceSeconds,0);assert.equal(g.ice,false);for(let i=0;i<119;i++)g.update({playing:true,iceReady:true,dt:.05});
 assert.equal(g.ice,false);for(let i=0;i<3;i++)g.update({playing:true,iceReady:true,dt:.05});assert.equal(g.ice,true);
 assert.equal(g.update({playing:true,iceReady:true}).ice,false);
});
test('Hint toggle and pause hide prompts without consuming their learning window',()=>{
 const g=new ContextualGuidance();for(const opts of [{enabled:false},{playing:false},{visible:false}]){
  const h=g.update({playing:true,exactMatch:true,iceReady:true,dt:.05,...opts});assert.equal(h.enter,false);assert.equal(h.ice,false);assert.equal(g.iceSeconds,0);
 }
 g.castIce();assert.equal(g.update({playing:true,iceReady:true}).ice,false);
});
test('Laptop helper labels meet the proposed 14 CSS-pixel target without changing word geometry',()=>{
 for(const s of [.7822,.83555556,1,1.18]){const x=readableHudSizes(s);assert(x.label*s>=13.99);assert(x.cue*s>=14.99);assert(x.key*s>=16.99);}
 for(const s of [0,NaN,Infinity,-1,.1])for(const v of Object.values(readableHudSizes(s)))assert(Number.isFinite(v)&&v>0&&v<=29);
});
test('Journey metadata exists at exactly eight campaign boundaries, never practice/endless',()=>{
 let count=0;for(let level=1;level<=75;level++)for(const mode of ['campaign','practice','endless']){
  const j=chapterJourney(mode,level);if(j){count++;assert.equal(mode,'campaign');assert.equal(level%6,0);assert.equal(j.kind,level===48?'finale':'wing');}
 }
 assert.equal(count,8);assert.equal(chapterJourney('campaign',6.5),null);
});
test('Restored wing markers require all six campaign clears, not practice-only stars',()=>{
 const progress={stages:{}};for(let n=1;n<=6;n++)progress.stages[n]={medal:3,campaignClear:n!==4};
 assert.equal(completedWings(progress)[0],false);progress.stages[4].campaignClear=true;assert.deepEqual(completedWings(progress),[true,false,false,false,false,false,false,false]);
});
test('Eight distinct small seals and landmarks reuse bounded identities beyond the campaign',()=>{
 assert.equal(WING_MARKS.length,8);assert.equal(new Set(WING_MARKS.map(x=>x.path)).size,8);assert.equal(WING_LANDMARKS.length,8);
 for(let n=1;n<=48;n++)assert.equal(wingLandmarkForLevel(n),WING_LANDMARKS[Math.floor((n-1)/6)]);
 assert.equal(wingLandmarkForLevel(999),WING_LANDMARKS[7]);assert.equal((journeySealsHTML(8).match(/data-journey-seal=/g)||[]).length,8);
});
for(const kind of ['wing','finale'])test(`${kind} ceremony is bounded, pausable, skippable, cancel-safe and motion-optional`,()=>{
 const cue=new OutcomeCue();cue.start(kind,{level:kind==='finale'?48:6});const seconds=cue.duration;
 for(let i=0;i<100;i++)assert.equal(cue.step(.05,false),null);assert.equal(cue.progress,0);
 let result;for(let i=0;i<Math.ceil(seconds/.05)+2;i++){const r=cue.step(.05);if(r)result=r;}assert.equal(result.kind,kind);assert.equal(cue.finish(),null);
 cue.start(kind,{});assert.equal(cue.finish().kind,kind);assert.equal(cue.finish(),null);
 cue.start(kind,{});cue.cancel();assert.equal(cue.step(1),null);
 cue.start(kind,{},false);assert.equal(cue.duration,0);assert.equal(cue.finish().kind,kind);
});
