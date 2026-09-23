/** Synthetic typing-agent audit, NOT human usability validation.
 * Agent has perfect spelling, .18s target acquisition, literal keystroke budget,
 * urgency-first targeting and rational spell use. Uses the actual shipping model.
 */
import {GameModel} from '../src/game/model.js';
import {levelRules,RULES} from '../src/game/rules.js';
import {dictionaryForLevel} from '../src/data/words.js';
import fs from 'node:fs/promises';
const rows=[];
for(const pace of ['relaxed','classic','maniac'])for(const wpm of [25,40,60,80])for(const seed of [13,123,2026]){
 const m=new GameModel();m.start({seed,pace});let task=null,nextDecision=0,completed=false;let start=performance.now();
 for(let steps=0;steps<60*12000;steps++){
  m.drainEvents();
  if(m.phase==='level-clear'){
   if(m.level===48){completed=true;break;}m.nextLevel();task=null;nextDecision=m.time+.25;
  }
  if(m.phase==='game-over')break;
  if(m.inventory.wind&&m.danger>=40)m.cast('wind','agent');
  const lowest=Math.max(0,...m.words.map(w=>w.y));
  if(m.words.length>=5&&m.inventory.ice&&!m.effects.ice)m.cast('ice','agent');
  if(m.words.length>=4&&m.inventory.slow&&!m.effects.slow)m.cast('slow','agent');
  if(m.words.length>=7&&lowest>590&&m.inventory.fire){m.cast('fire','agent');task=null;}
  if(task&&!m.words.some(w=>w.id===task.id)){task=null;nextDecision=m.time+.18;}
  if(!task&&m.words.length&&m.time>=nextDecision){
   const w=[...m.words].sort((a,b)=>b.y-a.y)[0];task={id:w.id,text:w.text,done:m.time+.18+(w.text.length+1)/(wpm*5/60)};
  }
  if(task&&m.time>=task.done){m.setBuffer(task.text);m.submit();task=null;nextDecision=m.time+.03;}
  m.step(RULES.step);
 }
 rows.push({pace,typingWpm:wpm,seed,completed,stageReached:m.level,score:m.score,misses:m.missed,seconds:Math.round(m.time),casts:m.casts,wallMs:Math.round(performance.now()-start)});
}
const byCondition=[];
for(const pace of ['relaxed','classic','maniac'])for(const wpm of [25,40,60,80]){
 const r=rows.filter(x=>x.pace===pace&&x.typingWpm===wpm);byCondition.push({pace,typingWpm:wpm,completed:r.filter(x=>x.completed).length,runs:r.length,stageRange:[Math.min(...r.map(x=>x.stageReached)),Math.max(...r.map(x=>x.stageReached))],medianStage:r.map(x=>x.stageReached).sort((a,b)=>a-b)[1]});
}
const levels=Array.from({length:48},(_,i)=>{
 const cfg=levelRules(i+1,'classic');let chars=0;for(let j=0;j<1000;j++){const bank=dictionaryForLevel(i+1,()=>((j*137)%997)/997);chars+=bank[(j*71)%bank.length].length;}
 return {stage:i+1,fallSpeed:cfg.speed,spawnInterval:cfg.interval,quota:cfg.quota,trial:cfg.trial,timeToFloor:Math.round(476/cfg.speed*100)/100,approxMeanWordLength:Math.round(chars/10)/100};
});
const report={method:'Deterministic synthetic perfect-spelling agent, real shipping model; urgency-first targeting, acquisition delay, keystroke budget, and spell strategy. Not observed human performance or a prediction of any player ability.',byCondition,runs:rows,classicStageTable:levels};
await fs.mkdir('docs/qa',{recursive:true});await fs.writeFile('docs/qa/balance-audit.json',JSON.stringify(report,null,2));console.table(byCondition);
