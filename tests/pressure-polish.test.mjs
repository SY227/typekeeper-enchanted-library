import test from 'node:test';
import assert from 'node:assert/strict';
import {GameModel} from '../src/game/model.js';
import {levelRules,PACE_CURVE,RULESET_VERSION,FIELD,RULES} from '../src/game/rules.js';
import {wordDistribution,banksForLevel} from '../src/data/words.js';
import {LocalStore} from '../src/game/storage.js';
import {musicDirection,MUSIC_LOOP_SECONDS,MUSIC_STEMS} from '../src/audio/mix.js';
import {ScoreRollup} from '../src/ui/score-rollup.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))};};
const run=(level=1)=>{const m=new GameModel();m.start({seed:17,level});m.words=[];m.spawnClock=100;return m;};
const word=(m,text='LIBRARY',y=350)=>{const w={id:m.nextId++,text,kind:'normal',x:500,y,previousY:y,speed:m.config.speed,width:210,phase:0};m.words.push(w);return w;};
for(const level of [1,3,6,12,24,36,48])test(`chapter ${level}: the earlier pressure curve is pinned`,()=>{
 const k=PACE_CURVE.find(a=>a[0]===level),c=levelRules(level);assert.equal(c.speed,k[1]);assert.equal(c.interval,k[2]);
 assert.ok(c.speed>28+(level-1)*1.28);assert.ok(c.interval<2.35-(level-1)*.018);
});
test('second chapter introduces medium words; the first chapter keeps its short onboarding words',()=>{assert.equal(wordDistribution(1).medium,0);assert.ok(wordDistribution(2).medium>0);assert.ok(banksForLevel(2).medium.some(w=>w.length===6));});
test('all 48 vocabulary distributions are positive, normalized, and length-bounded',()=>{for(let n=1;n<=48;n++){const d=Object.values(wordDistribution(n));assert.ok(d.every(p=>p>=0&&p<=1));assert.ok(Math.abs(d.reduce((a,b)=>a+b,0)-1)<1e-12);assert.ok(Object.values(banksForLevel(n)).flat().every(w=>w.length<=Math.min(16,5+Math.floor(n/2))));}});
test('early speed changes are explicit between chapters; no within-card rubber banding',()=>{const m=run(6),w=word(m),speed=w.speed;m.danger=95;m.setBuffer('LIB');m.step();assert.equal(w.speed,speed);assert.equal(m.config.speed,55.1);});
test('chapter 48 into Endless does not reset difficulty downward',()=>{const a=levelRules(48),b=levelRules(49);assert.ok(b.speed>a.speed&&b.speed/a.speed<1.01);assert.ok(b.interval<a.interval);});
test('music adds no tension in calm play and builds continuously through danger',()=>{
 for(const scene of ['play','trial']){let prior=[0,0];for(let d=0;d<=100;d++){const p=musicDirection(scene,d);assert.ok(p.tension>=prior[0]&&p.urgency>=prior[1]);prior=[p.tension,p.urgency];assert.ok(p.stems.every(v=>Number.isFinite(v)&&v>=0&&v<=1));}
 assert.equal(musicDirection(scene,20).tension,0);assert.equal(musicDirection(scene,65).urgency,0);assert.equal(musicDirection(scene,100).urgency,1);}
});
test('adaptive layers can be disabled without changing the baseline scene groove',()=>{const a=musicDirection('play',95,false),b=musicDirection('play',0,true);assert.deepEqual(a.stems,b.stems);});
for(const scene of ['menu','pause','clear','over'])test(`${scene}: high pile never leaves critical layers playing over a modal`,()=>{const d=musicDirection(scene,99);assert.equal(d.tension,0);assert.equal(d.urgency,0);assert.equal(d.stems[2],0);assert.equal(d.stems[3],0);});
test('music rejects invalid pressure and clamps out-of-range numbers',()=>{for(const x of [NaN,Infinity,undefined,'90'])assert.equal(musicDirection('play',x).danger,0);assert.equal(musicDirection('play',-8).danger,0);assert.equal(musicDirection('play',900).danger,100);});
test('all four stems use one exact original music-cycle duration',()=>{assert.equal(MUSIC_STEMS.length,4);assert.equal(MUSIC_LOOP_SECONDS,40*4*60/90);});
test('near-boundary pressure changes cannot cause abrupt target jumps',()=>{for(let d=1;d<100;d++){const a=musicDirection('play',d-.01),b=musicDirection('play',d+.01);assert.ok(Math.abs(a.tension-b.tension)<.002);assert.ok(Math.abs(a.urgency-b.urgency)<.002);}});
test('input sparkle targets the lowest eligible prefix without auto-submitting',()=>{const m=run();word(m,'LIBRARY',250);const target=word(m,'LITERAL',420);m.drainEvents();m.setBuffer('LI');const e=m.drainEvents()[0];assert.equal(e.target.id,target.id);assert.equal(e.added,2);assert.equal(e.complete,false);assert.equal(m.correct,0);});
test('full-word ready cue is feedback only until Enter',()=>{const m=run();word(m);m.drainEvents();m.setBuffer('LIBRARY');const e=m.drainEvents()[0];assert.equal(e.complete,true);assert.equal(m.words.length,1);assert.equal(m.score,0);m.submit();assert.equal(m.correct,1);});
test('wrong prefixes get no match sparkle and no extra penalty',()=>{const m=run();word(m);m.drainEvents();m.setBuffer('Z');const e=m.drainEvents()[0];assert.equal(e.target,null);assert.equal(m.danger,0);assert.equal(m.wrong,0);});
test('same-length replacement emits a new key event; unchanged input does not',()=>{const m=run();word(m);m.setBuffer('LZ');m.drainEvents();m.setBuffer('LI');assert.equal(m.drainEvents()[0].changed,true);m.setBuffer('LI');assert.equal(m.drainEvents()[0].changed,false);});
test('backspace does not trigger a new typing-ready sound',()=>{const m=run();word(m);m.setBuffer('LIB');m.drainEvents();m.setBuffer('LI');assert.equal(m.drainEvents()[0].erased,true);});
test('ICE and queued SLOW each emit exactly one natural ending',()=>{const m=run();m.effects.ice=.01;m.effects.slow=.02;m.drainEvents();for(let i=0;i<10;i++)m.step();const events=m.drainEvents().filter(e=>e.type==='effect-end');assert.deepEqual(events.map(e=>e.power),['ice','slow']);});
test('pause suspends effect-end events and spell lifetime',()=>{const m=run();m.effects.ice=.01;m.pause();m.drainEvents();for(let i=0;i<20;i++)m.step();assert.equal(m.effects.ice,.01);assert.equal(m.drainEvents().length,0);});
test('clearing a chapter cancels effects without false expiration cues',()=>{const m=run();m.effects.ice=4;m.effects.slow=6;m.drainEvents();m.clearLevel();for(let i=0;i<10;i++)m.step();assert.equal(m.drainEvents().filter(e=>e.type==='effect-end').length,0);});
test('score tally is monotone, bounded, and finishes at the authoritative total',()=>{const s=new ScoreRollup();s.start(700,1550,0);let v=700,ticks=0,done=0;for(let t=0;t<1300;t+=16){const p=s.step(t);assert.ok(p.value>=v&&p.value<=1550);v=p.value;if(p.tick)ticks++;if(p.done)done++;}assert.equal(v,1550);assert.equal(done,1);assert.ok(ticks<=19);});
test('large totals finish in the same time rather than counting each point',()=>{const a=new ScoreRollup(),b=new ScoreRollup();a.start(0,10,0);b.start(0,9e11,0);assert.equal(a.step(1050).done,true);assert.equal(b.step(1050).done,true);});
test('slow-frame tally never schedules a backlog of ticks',()=>{const s=new ScoreRollup();s.start(0,10000,0);s.step(0);const a=s.step(900);assert.equal(typeof a.tick,'boolean');const b=s.step(5000);assert.equal(b.tick,false);assert.equal(b.done,true);});
test('tally skip completes once; a canceled tally cannot leak a completion',()=>{const s=new ScoreRollup();s.start(0,800,0);assert.equal(s.finish().done,true);assert.equal(s.finish().done,false);s.start(0,900,0);s.cancel();assert.equal(s.step(2000).done,false);});
test('reduced motion displays the final score immediately',()=>{const s=new ScoreRollup();assert.equal(s.start(100,200,0,{reduced:true}),200);assert.equal(s.active,false);assert.equal(s.step(500).tick,false);});
test('score presentation cannot mutate game totals or earn duplicate points',()=>{const m=run();word(m);m.setBuffer('LIBRARY');m.submit();m.clearLevel();const score=m.score,s=new ScoreRollup();s.start(score-m.stageBonus,score,0);for(let t=0;t<2000;t+=16)s.step(t);assert.equal(m.score,score);assert.equal(m.stageHistory.length,1);});
test('v3.1 storage migrates into v3.2.1 without rewriting the old key',()=>{
 const raw=memory(),old=JSON.stringify({version:3,settings:{music:true,volume:.31},records:[{score:1000,level:3,date:Date.now(),pace:'classic',mode:'campaign',ruleset:'typekeeper-3.1.0'}]});raw.setItem('typekeeper-enchanted-library-v3.1',old);const s=new LocalStore(raw);assert.equal(raw.getItem('typekeeper-enchanted-library-v3.1'),old);assert.ok(raw.getItem('typekeeper-enchanted-library-v3.2.1'));assert.equal(s.settings.volume,.31);assert.equal(s.settings.adaptiveMusic,true);assert.equal(s.records[0].mode,'legacy');
});
test('adaptive music and shimmer preferences persist without changing score rules',()=>{const raw=memory(),s=new LocalStore(raw);s.update({adaptiveMusic:false,typingShimmer:false});const b=new LocalStore(raw);assert.equal(b.settings.adaptiveMusic,false);assert.equal(b.settings.typingShimmer,false);assert.equal(RULESET_VERSION,'typekeeper-3.2.1');});
