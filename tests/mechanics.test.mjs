import test from 'node:test';
import assert from 'node:assert/strict';
import {GameModel} from '../src/game/model.js';
import {LocalStore} from '../src/game/storage.js';
import {RULES,FIELD,POWERS,chapterSeed,levelRules,RULESET_VERSION,mulberry32,wordCardWidth} from '../src/game/rules.js';
import {wordDistribution,banksForLevel} from '../src/data/words.js';
import {FixedClock} from '../src/game/clock.js';
const run=(options={})=>{const m=new GameModel();m.start({seed:733,...options});m.drainEvents();return m;};
const add=(m,text='BOOK',kind='normal',y=300,x=550)=>{const w={id:m.nextId++,text,kind,y,x,previousY:y,speed:m.config.speed,width:wordCardWidth(text,kind),phase:0};m.words.push(w);return w;};
const input=(m,text)=>{m.setBuffer(text);return m.submit();};
const advance=(m,seconds)=>{for(let n=0;n<Math.round(seconds*60);n++)m.step();};
const clear=m=>{while(m.phase==='playing'){add(m);input(m,'BOOK');}return m.lastClear;};
const memory=()=>{const values=new Map();return{values,getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};};
const row=(level=1,extra={})=>({level,medal:3,stageScore:300,wpm:40,accuracy:100,ruleset:RULESET_VERSION,...extra});

// Pacing and readability are asserted independently of the player bot.
for(const pace of ['relaxed','classic','maniac']){
 test(`${pace}: all 48 chapters stay within smooth speed and interval bounds`,()=>{
  for(let n=2;n<=48;n++){const a=levelRules(n-1,pace),b=levelRules(n,pace);assert.ok(b.speed>a.speed&&b.speed/a.speed<1.05);assert.ok(b.interval<a.interval&&a.interval/b.interval<1.02);assert.ok(b.quota>=12&&b.quota<=42);}
 });
 test(`${pace}: all spawned ordinary and power cards remain fully readable and non-overlapping`,()=>{
  for(let level=1;level<=48;level++){
   const m=run({level,pace});m.danger=0;
   for(let tick=0;tick<1800;tick++){
    m.step();m.drainEvents();if(m.phase!=='playing')break;
    for(let i=0;i<m.words.length;i++){
     const a=m.words[i];assert.ok(a.x-a.width/2>=FIELD.left-1e-6&&a.x+a.width/2<=FIELD.right+1e-6);
     for(const b of m.words.slice(i+1))assert.ok(Math.abs(a.y-b.y)>=70||Math.abs(a.x-b.x)>=(a.width+b.width)/2+9.9);
    }
    if(tick%110===0&&m.words.length)input(m,m.words[0].text);
   }
  }
 });
}
test('vocabulary mixture is normalized at every campaign and endless chapter',()=>{for(let n=1;n<501;n++){const mix=wordDistribution(n);assert.ok(Object.values(mix).every(v=>v>=0&&v<=1));assert.ok(Math.abs(Object.values(mix).reduce((a,b)=>a+b)-1)<1e-10);}});
test('no abrupt dictionary mix switch remains at 5, 13, 25 or 37',()=>{for(const n of [5,13,25,37]){const a=wordDistribution(n-1),b=wordDistribution(n);for(const k of Object.keys(a))assert.ok(Math.abs(a[k]-b[k])<.06);}});
test('newly introduced words obey their chapter length cap',()=>{for(let n=1;n<=48;n++)for(const bank of Object.values(banksForLevel(n)))assert.ok(bank.every(w=>w.length<=Math.min(16,5+Math.floor((n-1)/3))));});
test('a fast clear shortens empty-field downtime without changing falling speed',()=>{const m=run();m.spawnClock=2.3;add(m);input(m,'BOOK');assert.equal(m.spawnClock,RULES.emptyFieldDelay);assert.equal(m.config.speed,levelRules(1).speed);});
test('empty-field acceleration never interrupts a trial breathing interval',()=>{const m=run({level:6});m.trialRest=true;m.spawnClock=3;add(m);input(m,'BOOK');assert.equal(m.spawnClock,3);});
test('trial spawns follow five-word waves with a visible breathing interval',()=>{const m=run({level:6});for(let n=1;n<=5;n++){m.words=[];m.spawnClock=0;m.step();assert.equal(m.spawnedThisLevel,n);}assert.equal(m.trialRest,true);assert.ok(Math.abs(m.spawnClock-m.config.interval*1.8)<1e-9);});
test('no surplus cards are spawned when the board already contains the remaining quota',()=>{const m=run();m.progress=m.config.quota-1;add(m);assert.equal(m.spawn(),false);});
test('a final-word completion clears exactly once with no stranded next-stage timers',()=>{const m=run();m.progress=m.config.quota-1;const w=add(m);m.effects={ice:2,slow:3};input(m,'BOOK');m.complete(w);assert.equal(m.drainEvents().filter(e=>e.type==='level-clear').length,1);assert.deepEqual(m.effects,{ice:0,slow:0});});
test('active text duplicates do not occur in authored spawns',()=>{const m=run({level:48});for(let i=0;i<120;i++){for(const w of m.words)w.y=380;m.spawn();assert.equal(new Set(m.words.map(w=>w.text)).size,m.words.length);if(m.words.length>6)m.words.shift();}});
test('blocked spawn preserves the exact next card rather than rerolling its reward',()=>{const m=run({level:48});add(m,'WWWWWWWWWW','normal',FIELD.top,360);add(m,'WWWWWWWWWW','normal',FIELD.top,700);assert.equal(m.spawn(),false);const pending={...m.pendingSpawn};for(let n=0;n<30;n++)assert.equal(m.spawn(),false);assert.deepEqual(m.pendingSpawn,pending);m.words=[];assert.equal(m.spawn(),true);assert.equal(m.words[0].text,pending.text);assert.equal(m.words[0].kind,pending.kind);});
test('a shuffled power cycle includes all four spells before repeating',()=>{const m=run({level:20});for(let cycle=0;cycle<40;cycle++)assert.deepEqual(new Set(Array.from({length:4},()=>m.takePower())),new Set(POWERS));});
test('power selection prefers a not-full shelf inside the remaining bag',()=>{const m=run();m.powerBag=['ice','fire','wind'];m.inventory.ice=3;assert.equal(m.takePower(),'fire');assert.deepEqual(m.powerBag,['ice','wind']);});
test('full shelves never inflate inventory on collection',()=>{const m=run();m.inventory.ice=3;add(m,'SNOW','ice');input(m,'SNOW');assert.equal(m.inventory.ice,3);assert.equal(m.drainEvents().find(e=>e.type==='correct').overflow,true);});
test('guaranteed first-chapter spells retain their familiar onboarding order',()=>{const m=run(),powers=[];for(let i=0;i<12;i++){m.words=[];assert.equal(m.spawn(),true);if(POWERS.includes(m.words[0].kind))powers.push(m.words[0].kind);}assert.deepEqual(powers,['fire','ice','slow','wind']);});
test('empty FIRE and WIND are STORED rather than falsely actionable READY',()=>{const m=run();m.inventory.fire=m.inventory.wind=1;assert.equal(m.spellStatus('fire').state,'stored');assert.equal(m.spellStatus('wind').state,'stored');add(m);m.danger=2;assert.equal(m.spellStatus('fire').ready,true);assert.equal(m.spellStatus('wind').ready,true);});
test('readiness reflects per-spell cooldown as well as inventory',()=>{const m=run();m.inventory.fire=2;add(m);m.cast('fire');add(m);assert.equal(m.spellStatus('fire').reason,'cooldown');advance(m,.3);assert.equal(m.spellStatus('fire').ready,true);});
test('SLOW cast before ICE retains every unspent second while frozen',()=>{const m=run();m.inventory.slow=m.inventory.ice=1;m.cast('slow');advance(m,1);m.cast('ice');const remaining=m.effects.slow;advance(m,5);assert.ok(Math.abs(m.effects.slow-remaining)<1e-9);assert.equal(m.spellStatus('slow').state,'queued');});
test('SLOW cast during ICE is queued without consuming duration',()=>{const m=run();m.inventory.slow=m.inventory.ice=1;m.cast('ice');advance(m,1);m.cast('slow');advance(m,3);assert.equal(m.effects.slow,8);assert.equal(m.spellStatus('slow').state,'queued');});
test('a second queued SLOW does not consume a second book',()=>{const m=run();m.inventory.slow=2;m.inventory.ice=1;m.cast('ice');m.cast('slow');advance(m,1);assert.equal(m.cast('slow'),false);assert.equal(m.inventory.slow,1);});
test('ICE ending within a tick applies only the remaining unfrozen fraction',()=>{const m=run();m.spawnClock=99;const w=add(m);m.effects.ice=.025;m.effects.slow=8;m.step(.1);assert.ok(Math.abs(w.y-300-w.speed*.075*RULES.slowFactor)<1e-9);assert.ok(Math.abs(m.effects.slow-7.925)<1e-9);});
test('SLOW expiry integrates slowed and normal motion within the same tick',()=>{const m=run();m.spawnClock=99;const w=add(m);m.effects.slow=.025;m.step(.1);assert.ok(Math.abs(w.y-300-w.speed*(.025*RULES.slowFactor+.075))<1e-9);});
test('pause freezes queued spells and spell readiness',()=>{const m=run();m.inventory.slow=m.inventory.ice=1;m.cast('ice');m.cast('slow');m.pause();const before=m.snapshot();advance(m,15);assert.deepEqual(m.snapshot(),before);});
test('FIRE guarantees a short recovery instead of an immediate replacement spawn',()=>{const m=run();m.inventory.fire=1;add(m);m.spawnClock=.01;m.cast('fire');assert.equal(m.spawnClock,RULES.fireRecovery);advance(m,.4);assert.equal(m.words.length,0);});
test('WIND clears only pressure; it never silently removes falling cards',()=>{const m=run();const w=add(m);m.danger=95;m.inventory.wind=1;m.cast('wind');assert.equal(m.words[0].id,w.id);assert.equal(m.danger,0);assert.equal(m.score,0);});
test('a just-landed exact submission has one miss penalty, not miss plus typo',()=>{const m=run();m.spawnClock=99;add(m,'BOOK','normal',FIELD.bottom-.01);m.step();const danger=m.danger;assert.equal(input(m,'BOOK'),'late');assert.equal(m.missed,1);assert.equal(m.wrong,0);assert.equal(m.danger,danger);assert.equal(m.progress,0);});
test('late-submission protection expires after the declared grace window',()=>{const m=run();m.spawnClock=99;add(m,'BOOK','normal',FIELD.bottom-.01);m.step();advance(m,.4);assert.equal(input(m,'BOOK'),'wrong');assert.equal(m.wrong,1);});
test('the same expired word cannot repeatedly trigger late protection',()=>{const m=run();m.spawnClock=99;add(m,'BOOK','normal',FIELD.bottom-.01);m.step();input(m,'BOOK');assert.equal(input(m,'BOOK'),'wrong');});
test('a still-live duplicate wins over the recently landed copy',()=>{const m=run();m.spawnClock=99;add(m,'BOOK','normal',FIELD.bottom-.01);add(m,'BOOK','normal',300);m.step();assert.equal(input(m,'BOOK'),'word');assert.equal(m.correct,1);assert.equal(m.missed,1);});
test('a recently FIRE-cleared typed word does not create a phantom typo penalty',()=>{const m=run();m.inventory.fire=1;add(m);m.setBuffer('BOOK');m.cast('fire','hotkey');assert.equal(m.submit(),'late');assert.equal(m.danger,0);assert.equal(m.score,0);});
test('late protection cannot rescue an already terminal full-pile result',()=>{const m=run();m.spawnClock=99;m.danger=99;add(m,'BOOK','normal',FIELD.bottom-.01);m.step();input(m,'BOOK');assert.equal(m.phase,'game-over');assert.equal(m.score,0);});
test('chapter RNG is independent from how many earlier frames were simulated',()=>{assert.equal(chapterSeed(733,7),chapterSeed(733,7));assert.notEqual(chapterSeed(733,7),chapterSeed(733,8));});
test('uninterrupted next chapter and restored bookmark produce identical cards',()=>{const a=run();clear(a);const cp=a.checkpoint();a.nextLevel();const b=run();b.restoreCheckpoint(cp);for(let n=0;n<10;n++){a.words=[];b.words=[];a.spawn();b.spawn();assert.deepEqual(a.words,b.words);}assert.deepEqual(a.inventory,b.inventory);});
test('chapter-boundary bookmark includes the pending power cycle',()=>{const a=run();a.powerBag=['wind','slow'];clear(a);const b=run();b.restoreCheckpoint(a.checkpoint());assert.deepEqual(b.powerBag,['wind','slow']);});
test('mid-chapter state cannot masquerade as a safe chapter bookmark',()=>{const m=run();advance(m,1);assert.equal(m.checkpoint(),null);});
test('first chapter can be bookmarked before a single word arrives',()=>{const m=run(),s=new LocalStore(memory());assert.equal(s.setCheckpoint(m.checkpoint()),true);assert.equal(s.checkpoint().nextLevel,1);});
test('failed chapter retains its opening score and stock, recording retry count',()=>{const m=run(),s=new LocalStore(memory());m.inventory.ice=1;s.setCheckpoint(m.checkpoint());m.score=150;m.inventory.ice=0;m.danger=100;m.checkGameOver();s.markFailure(m.pace,m.seed,m.level);m.restoreCheckpoint(s.checkpoint());assert.equal(m.score,0);assert.equal(m.inventory.ice,1);assert.equal(m.retries,1);assert.equal(m.danger,0);});
test('retry increments cannot corrupt another expedition or chapter',()=>{const m=run(),s=new LocalStore(memory());s.setCheckpoint(m.checkpoint());assert.equal(s.markFailure('classic',0,1),false);assert.equal(s.markFailure('classic',m.seed,2),false);assert.equal(s.checkpoint().retries,0);});
test('repeating a failed chapter cannot double-award its previous earned score',()=>{const m=run(),s=new LocalStore(memory());s.setCheckpoint(m.checkpoint());for(let i=0;i<2;i++){add(m);input(m,'BOOK');s.markFailure(m.pace,m.seed,m.level);m.restoreCheckpoint(s.checkpoint());assert.equal(m.score,0);}clear(m);assert.equal(m.stageHistory.length,1);assert.equal(m.retries,2);});
test('campaign final clear cannot advance into chapter 49',()=>{const m=run({level:48});clear(m);assert.equal(m.nextLevel(),false);assert.equal(m.level,48);assert.equal(m.checkpoint(),null);});
test('practice completion cannot advance into a multi-chapter practice score',()=>{const m=run({mode:'practice',level:18});clear(m);assert.equal(m.nextLevel(),false);assert.equal(m.level,18);});
test('endless can progress without receiving a false campaign victory',()=>{const m=run({mode:'endless',level:49});clear(m);assert.equal(m.finishCampaign(),null);assert.equal(m.nextLevel(),true);assert.equal(m.level,50);});
test('campaign victory cannot be declared in the middle of chapter 48',()=>{const m=run({level:48});assert.equal(m.finishCampaign(),null);clear(m);assert.equal(m.finishCampaign().victory,true);});
test('retirement snapshots retain a voluntary finish distinction',()=>{const m=run({mode:'endless',level:49});advance(m,1);const r=m.retire();assert.equal(r.retired,true);assert.equal(r.victory,false);assert.equal(r.mode,'endless');});
test('practice mastery on an unlocked chapter saves without unlocking another chapter',()=>{const raw=memory(),s=new LocalStore(raw);s.completeStage('classic',row(),false);assert.equal(s.progress().stages[1].medal,3);assert.equal(s.progress().unlocked,1);assert.equal(new LocalStore(raw).progress().unlocked,1);});
test('practice cannot generate stars on a locked chapter',()=>{const s=new LocalStore(memory());s.completeStage('classic',row(10),false);assert.equal(s.progress().stages[10],undefined);});
test('campaign clear after practice can unlock the next chapter',()=>{const raw=memory(),s=new LocalStore(raw);s.completeStage('classic',row(),false);s.completeStage('classic',row());assert.equal(new LocalStore(raw).progress().unlocked,2);});
test('practice best score is chapter-specific, not simply the longest chapter',()=>{const s=new LocalStore(memory());s.add({score:200,level:1,startLevel:1,pace:'classic',mode:'practice'});s.add({score:9900,level:48,startLevel:48,pace:'classic',mode:'practice'});assert.equal(s.best('classic','practice',1),200);assert.equal(s.filteredRecords({mode:'practice',chapter:1}).length,1);});
test('old rulesets remain in Legacy and cannot become a current personal best',()=>{const s=new LocalStore(memory());s.add({score:50000,level:48,pace:'classic',ruleset:'library-edition-2.0.0',mode:'campaign'});assert.equal(s.best(),0);assert.equal(s.filteredRecords().length,0);assert.equal(s.filteredRecords({mode:'legacy'}).length,1);});
test('a migrated in-progress expedition keeps its original scoring provenance',()=>{const m=run(),cp=m.checkpoint();cp.version=2;cp.nextLevel=2;delete cp.ruleset;const s=new LocalStore(memory());s.setCheckpoint(cp);m.restoreCheckpoint(s.checkpoint());s.add(m.result());assert.equal(s.records[0].mode,'legacy');});
test('v3 migration does not overwrite or delete the original saved bytes',()=>{const raw=memory(),source=JSON.stringify({version:2,settings:{music:false},records:[{score:100,level:2,pace:'classic',date:Date.now(),ruleset:'library-edition-2.0.0',mode:'campaign'}]});raw.setItem('typekeeper-enchanted-library-v3',source);const s=new LocalStore(raw);assert.equal(s.settings.music,false);assert.equal(s.records[0].mode,'legacy');assert.equal(raw.getItem('typekeeper-enchanted-library-v3'),source);assert.ok(raw.getItem('typekeeper-enchanted-library-v3.1'));});
test('corrupt power bags and nonfinite checkpoint identifiers are rejected',()=>{const s=new LocalStore(memory()),cp=run().checkpoint();for(const patch of [{powerBag:['ice','ice']},{powerBag:['not-a-power']},{nextId:Infinity},{retries:-1},{retries:NaN}])assert.equal(s.validCheckpoint({...cp,...patch}),false);});
test('actual completed-stage score replaces only the comparable ruleset best',()=>{const s=new LocalStore(memory());s.importData({version:2,progress:{classic:{stages:{1:{medal:3,score:99999,wpm:99,accuracy:100}}}}});s.completeStage('classic',row());assert.equal(s.progress().stages[1].score,300);assert.equal(s.progress().stages[1].legacyScore,99999);assert.equal(s.progress().stages[1].medal,3);});
test('paused application settings reject invalid volume and difficulty values',()=>{const s=new LocalStore(memory());s.update({volume:NaN,musicVolume:Infinity,pace:'nightmare',music:'on'});assert.equal(s.settings.volume,.8);assert.equal(s.settings.musicVolume,.5);assert.equal(s.settings.pace,'classic');assert.equal(s.settings.music,true);});
test('nonfinite and zero deltas cannot poison the game clock',()=>{const m=run(),before=m.snapshot();for(const dt of [NaN,Infinity,-Infinity,-1,0])m.step(dt);assert.deepEqual(m.snapshot(),before);});
test('long-session replay memory is bounded and truncation is explicit',()=>{const m=run();for(let i=0;i<RULES.replayLimit+20;i++)m.record('input','A');assert.equal(m.replay.length,RULES.replayLimit);assert.equal(m.exportReplay().truncated,true);});
test('renderer frame rate cannot change a fixed-tick authored run',()=>{
 const sessions=[];
 for(const hz of [30,60,120,144]){const m=run(),clock=new FixedClock();let steps=0;clock.advance(0,()=>{});for(let i=1;i<=hz*10;i++)clock.advance(i*1000/hz,dt=>{m.step(dt);steps++;});sessions.push({m,steps});}
 const min=Math.min(...sessions.map(s=>s.steps));
 // The last accumulator can differ by one tick due to floating-point frame times.
 for(const {m,steps} of sessions)assert.ok(Math.abs(steps-min)<=1&&Math.abs(m.time-min/60)<=1/60+1e-9);
});
test('250 seeded adversarial sessions retain finite state, terminal uniqueness and stock bounds',()=>{
 for(let seed=1;seed<=250;seed++){
  const m=run({seed,level:1+seed%48}),r=mulberry32(seed);let terminal=0;
  for(let tick=0;tick<1800;tick++){
   if(r()<.01)m.pause();if(r()<.08)m.resume();
   if(r()<.08&&m.words.length)input(m,r()<.12?'NOTAMATCH':m.words[Math.floor(r()*m.words.length)].text);
   if(r()<.02){const p=POWERS[Math.floor(r()*4)];m.cast(p,'fuzz');}
   m.step();for(const e of m.drainEvents())if(e.type==='game-over')terminal++;
   assert.ok(Number.isFinite(m.score)&&Number.isFinite(m.time)&&Number.isFinite(m.danger));assert.ok(m.danger>=0&&m.danger<=100);
   assert.ok(Object.values(m.inventory).every(n=>Number.isInteger(n)&&n>=0&&n<=3));
   assert.equal(new Set(m.words.map(w=>w.id)).size,m.words.length);assert.ok(terminal<=1);
  }
 }
});
test('merging new-rule practice medals cannot revoke an old-rule campaign clear',()=>{const mem=memory(),s=new LocalStore(mem);s.importData({version:3,progress:{classic:{stages:{1:row(1,{ruleset:'library-edition-2.0.0',campaignClear:true})}}}});s.importData({version:3,progress:{classic:{stages:{1:row(1,{campaignClear:false})}}}});assert.equal(s.progress().stages[1].campaignClear,true);assert.equal(s.progress().unlocked,2);});
test('corrupt current save is quarantined and a valid untouched v3 save is recovered',()=>{const mem=memory();mem.setItem('typekeeper-enchanted-library-v3.1','{bad');const old=JSON.stringify({version:2,settings:{music:false},records:[]});mem.setItem('typekeeper-enchanted-library-v3',old);const s=new LocalStore(mem);assert.equal(s.settings.music,false);assert.equal(mem.getItem('typekeeper-enchanted-library-v3.1-recovery'),'{bad');assert.equal(mem.getItem('typekeeper-enchanted-library-v3'),old);assert.equal(JSON.parse(mem.getItem('typekeeper-enchanted-library-v3.1')).version,3);});
