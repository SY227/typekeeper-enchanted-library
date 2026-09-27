import test from 'node:test';
import assert from 'node:assert/strict';
import {OutcomeCue, presentationTarget, readableCardLayout, resolveVisualPositions, roomForChapter, ROOM_PROFILES, PRESENTATION_VERSION} from '../src/render/presentation.js';
import {FIELD, levelRules, RULES, RULESET_VERSION} from '../src/game/rules.js';
import {WINGS} from '../src/data/campaign.js';
import {GameModel} from '../src/game/model.js';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const measure=(s,size)=>[...s].reduce((sum,c)=>sum+(c==='W'?.99:c==='I'?.38:.71)*size,0);
test('Application 3.4.0 retains the 3.2.1 gameplay ruleset and resource capacity',()=>{
 assert.equal(PRESENTATION_VERSION,'3.4.0');assert.equal(RULESET_VERSION,'typekeeper-3.2.1');assert.equal(RULES.inventoryCapacity,2);assert.equal(RULES.iceDuration,6);assert.equal(RULES.slowDuration,8);
});
test('Source hashes preserve economy, rules, dictionary, clock and campaign; model randomness is intentionally revised',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('./fixtures/v321-preserved.json',import.meta.url)));
 for(const item of manifest){if(item.path==='src/game/model.js')continue;assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+item.path,import.meta.url))).digest('hex'),item.sha256,item.path);}
});
for(const [start,end,index]of [[1,6,0],[7,12,1],[13,18,2],[19,24,3],[25,30,4],[31,36,5],[37,42,6],[43,48,7]]){
 test(`Room state ${index+1} follows campaign chapters ${start}–${end}`,()=>{for(let n=start;n<=end;n++){assert.equal(roomForChapter(n),ROOM_PROFILES[index]);assert.equal(roomForChapter(n).props.length,2);}assert.ok(WINGS[index].name.includes(roomForChapter(start).name));});
}
test('Endless reuses the final room rather than generating unbounded stage textures',()=>{assert.equal(roomForChapter(9999),ROOM_PROFILES[7]);});
test('Visual prefix target is the same lowest-y, lowest-ID candidate as the model',()=>{
 const words=[{id:6,text:'BOOK',y:210},{id:2,text:'BOOKCASE',y:290},{id:1,text:'BOOK',y:290}];
 assert.equal(presentationTarget(words,'BO').id,1);assert.equal(presentationTarget(words,'BOO').id,1);assert.equal(presentationTarget(words,'BOOKC').id,2);assert.equal(presentationTarget(words,''),null);assert.equal(presentationTarget(words,'XYZ'),null);
});
test('Target selection never reorders the live model array',()=>{const words=Object.freeze([{id:9,text:'TALE',y:2},{id:8,text:'TAKE',y:5}]);presentationTarget(words,'TA');assert.deepEqual(words.map(w=>w.id),[9,8]);});
for(const scale of [.72,.8355555556,1.18])test(`Words stay readable at presentation scale ${scale}`,()=>{
 for(const text of ['INK','CLOCKWORK','EXTRAORDINARY','BOOKKEEPER','MANUSCRIPT','INTERNATIONAL']){
  const l=readableCardLayout(text,300,'normal',scale,measure);assert.ok(l.fontSize*scale>=23.49);assert.equal(l.lines.map(x=>x.text).join(''),text);assert.equal(l.lines.length,1);assert.ok(l.lines.every(x=>x.width<=l.width-26+.001));assert.ok(l.lines.every((x,i)=>x.start===l.lines.slice(0,i).reduce((n,y)=>n+y.text.length,0)));
 }
});
test('EXTRAORDINARY remains one complete string and never splits into rows',()=>{const l=readableCardLayout('EXTRAORDINARY',280,'wind',.835,measure);assert.deepEqual(l.lines.map(x=>x.text),['EXTRAORDINARY']);});
test('Physical-text material layouts leave room for all four element icons',()=>{for(const kind of ['fire','ice','slow','wind']){const l=readableCardLayout('LANTERN',228,kind,.835,measure);assert.ok(l.lines[0].x>=-l.width/2+43);}});
test('Display-only collision resolution never changes y, speed, text or source coordinates',()=>{
 const words=[{id:1,text:'BOOK',x:500,y:300,speed:30},{id:2,text:'TALE',x:505,y:315,speed:30}],before=JSON.stringify(words);
 const layouts=new Map(words.map(w=>[w.id,{width:160,height:60}]));const poses=resolveVisualPositions(words,layouts,FIELD.left,FIELD.right);
 assert.ok(Math.abs(poses.get(1).x-poses.get(2).x)>=167);assert.equal(poses.get(1).y,300);assert.equal(JSON.stringify(words),before);
});
test('Display separation clamps complete card edges inside the playfield',()=>{
 const words=[{id:1,x:5,y:250},{id:2,x:1200,y:300}],layouts=new Map(words.map(w=>[w.id,{width:300,height:78}]));
 for(const p of resolveVisualPositions(words,layouts,FIELD.left,FIELD.right).values()){assert.ok(p.x-p.width/2>=FIELD.left);assert.ok(p.x+p.width/2<=FIELD.right);}
});
test('Defeat ceremony lasts 1.2 presentation seconds and completes exactly once',()=>{
 const cue=new OutcomeCue();cue.start('defeat',{score:42});let result=null;for(let i=0;i<23;i++)assert.equal(cue.step(.05),null);result=cue.step(.05);assert.deepEqual(result,{kind:'defeat',payload:{score:42}});assert.equal(cue.step(.05),null);assert.equal(cue.finish(),null);
});
test('Chapter closure lasts less than a second and is independently skippable',()=>{const q=new OutcomeCue();q.start('clear',{chapter:1});assert.equal(q.duration,.88);assert.equal(q.finish().kind,'clear');assert.equal(q.active,false);});
test('Hidden-page time does not consume the ceremony',()=>{const q=new OutcomeCue();q.start('defeat',{});for(let i=0;i<100;i++)q.step(.05,false);assert.equal(q.elapsed,0);assert.equal(q.progress,0);});
test('Canceling a ceremony prevents stale UI callbacks after retry or menu',()=>{const q=new OutcomeCue();q.start('clear',{});q.step(.05);q.cancel();assert.equal(q.step(100),null);assert.equal(q.finish(),null);});
test('Reduced-motion ceremonies complete immediately without simulated game time',()=>{const q=new OutcomeCue();q.start('defeat',{score:1},false);assert.equal(q.duration,0);assert.equal(q.step(0).payload.score,1);});
test('Long frame gaps cannot create a giant catch-up through the outcome presentation',()=>{const q=new OutcomeCue();q.start('clear',{});q.step(100);assert.equal(q.elapsed,.05);});
test('Ceremony payload and progress never award a second model score',()=>{const m=new GameModel();m.start();m.score=100;const q=new OutcomeCue();q.start('clear',{score:m.score});for(let i=0;i<40;i++)q.step(.05);assert.equal(m.score,100);assert.equal(m.phase,'playing');});
test('Presentation layout and effects do not change the authored 48-stage pace curve',()=>{for(const pace of ['relaxed','classic','maniac'])for(let n=1;n<=48;n++){const c=levelRules(n,pace);assert.ok(c.speed>0);assert.ok(c.interval>0);assert.ok(c.quota>=12);}});
