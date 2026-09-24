/** Repeatable lifecycle/soak checks. These are deliberately omniscient bots,
 * not difficulty predictions. All movement, rewards and transitions are real.
 */
import {GameModel} from '../src/game/model.js';
import {RULES,POWERS,mulberry32} from '../src/game/rules.js';
import {simulate,profiles} from './playtest-simulation.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const rows=[];
for(const pace of ['relaxed','classic','maniac']){
 const m=new GameModel();m.start({pace,seed:9744,level:49,mode:'endless'});
 const random=mulberry32(81619);let guard=0,peak=0,steps=0;
 while(m.level<201&&guard++<60*40000){
  m.drainEvents();
  if(m.phase==='level-clear'){assert.equal(m.nextLevel(),true);continue;}
  if(m.phase!=='playing')throw new Error(`Unexpected terminal state: ${pace} ${m.level}`);
  if(steps%80===0&&m.words.length){const w=m.words[0];m.setBuffer(w.text);m.submit();}
  // Exercise every power, including ICE/SLOW queuing, during the long run.
  if(steps%311===0){m.inventory.ice=1;m.cast('ice','soak');m.inventory.slow=1;m.cast('slow','soak');}
  if(steps%947===0&&m.words.length>1){m.inventory.fire=1;m.cast('fire','soak');}
  if(m.danger>25){m.inventory.wind=1;m.cast('wind','soak');}
  if(steps%503===0){m.pause();const before=m.snapshot();m.step(.1);assert.deepEqual(m.snapshot(),before);m.resume();}
  m.step(RULES.step);steps++;
  peak=Math.max(peak,m.words.length);
  assert.ok(m.words.length<=12&&m.score>=0&&Number.isFinite(m.time));
  assert.ok(POWERS.every(p=>m.inventory[p]>=0&&m.inventory[p]<=RULES.inventoryCapacity));
  assert.ok(m.effects.slow<=8&&m.effects.ice<=6&&m.danger<=100);
 }
 assert.equal(m.level,201);assert.ok(m.replay.length<=100000);
 rows.push({pace,kind:'resource-assisted reliability soak, not a fair player',chaptersCompleted:m.stageHistory.length,lastChapter:m.level,seconds:Math.round(m.time),steps,peakWords:peak,replayEvents:m.replay.length,truncated:m.replayTruncated,score:m.score,passed:true});
}
const scenarios=[];
for(const pace of ['relaxed','classic','maniac'])for(const level of [1,6,12,24,36,42,48])for(const strategy of ['none','reactive']){
 const r=simulate({pace,level,strategy,seed:7181,profile:profiles[pace==='relaxed'?1:pace==='classic'?2:3],initialDanger:60,starterBooks:0});
 assert.ok(!r.timeout,'No scenario may hang');assert.ok(r.score>=0&&Number.isFinite(r.seconds));
 scenarios.push(r);
}
const data={scope:'Three controlled long-run soaks, with injected spell inventory to reach chapter 201 and exercise every spell, plus 42 simulated-player high-pressure/no-starter-book cases. Deliberate player losses are valid outcomes, not failed assertions.',soaks:rows,stressScenarios:scenarios};
await fs.writeFile('docs/qa/endurance-audit.json',JSON.stringify(data,null,2));console.table(rows);console.log('High-pressure scenarios',scenarios.length,'all terminated normally; wins',scenarios.filter(r=>r.completed).length);
