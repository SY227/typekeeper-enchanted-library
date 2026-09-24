/** Synthetic playtest. No human participants; no inferred retention or virality.
 * Same player model can run against an imported baseline. Uses live game rules.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { GameModel } from '../src/game/model.js';
import { RULES, RULESET_VERSION, FIELD, levelRules, mulberry32 } from '../src/game/rules.js';
import { wordDistribution, banksForLevel } from '../src/data/words.js';
const args=process.argv.slice(2);
const baseline=args.includes('--baseline')?args[args.indexOf('--baseline')+1]:null;
const quick=args.includes('--quick');
const Model=baseline?(await import(pathToFileURL(path.resolve(baseline,'src/game/model.js')))).GameModel:GameModel;
export const profiles=[
 {id:'developing',wpm:25,acquire:.32,error:.06},
 {id:'steady',wpm:40,acquire:.26,error:.045},
 {id:'fluent',wpm:60,acquire:.20,error:.03},
 {id:'expert',wpm:90,acquire:.15,error:.02},
 {id:'virtuoso',wpm:120,acquire:.12,error:.012}
];
export function simulate({ModelClass=GameModel,pace='classic',profile=profiles[2],seed=17,level=1,campaign=false,strategy='reactive',perfect=false,initialDanger=0,starterBooks=1}){
 const m=new ModelClass();m.start({seed,pace,level,mode:campaign?'campaign':'practice'});
 if(!campaign)for(const p of ['fire','ice','slow','wind'])m.inventory[p]=starterBooks;
 m.danger=initialDanger;
 const r=mulberry32(seed^0x32d18afe),dt=1/60;
 let task=null,nextDecision=.15,lastSpell=-1,completed=false,steps=0,peakWords=0,stageRows=[],earlyDeaths=0;
 const economy={opportunities:0,earned:0,overflow:0,missedBooks:0,burnedBooks:0,peakHeld:0,heldSeconds:0,emptySeconds:0,fullSeconds:0,windPressures:[],perPower:Object.fromEntries(['fire','ice','slow','wind'].map(p=>[p,{offered:0,earned:0,overflow:0}]))};
 let stageStartEconomy={opportunities:0,earned:0,overflow:0,heldSeconds:0,emptySeconds:0};
 function collectEvents(){
  for(const e of m.drainEvents()){
   const power=e.word?.kind,isPower=!!economy.perPower[power];
   if(e.type==='spawn'&&isPower){economy.opportunities++;economy.perPower[power].offered++;}
   if(e.type==='correct'&&e.collected){economy.earned++;economy.perPower[power].earned++;}
   if(e.type==='correct'&&e.overflow){economy.overflow++;economy.perPower[power].overflow++;}
   if(e.type==='miss'&&isPower)economy.missedBooks++;
   if(e.type==='power'&&e.power==='fire')economy.burnedBooks+=e.removed.filter(w=>!!economy.perPower[w.kind]).length;
  }
 }
 const limit=campaign?14000:260;
 while(m.time<limit){
  collectEvents();
  if(m.phase==='level-clear'){
   stageRows.push({level:m.level,seconds:Math.round(m.stageTime*100)/100,missed:m.stageMissed,wrong:m.stageWrong,burned:m.stageBurned||0,danger:Math.round(m.danger),booksOffered:economy.opportunities-stageStartEconomy.opportunities,booksEarned:economy.earned-stageStartEconomy.earned,booksOverflow:economy.overflow-stageStartEconomy.overflow,meanHeld:Math.round((economy.heldSeconds-stageStartEconomy.heldSeconds)/Math.max(.01,m.stageTime)*100)/100,emptyFraction:Math.round((economy.emptySeconds-stageStartEconomy.emptySeconds)/Math.max(.01,m.stageTime)*100)/100,endHeld:Object.values(m.inventory).reduce((a,b)=>a+b,0)});
   stageStartEconomy={...economy};
   if(!campaign||m.level===48){completed=true;break;}
   m.nextLevel();task=null;nextDecision=m.time+.22;
  }
  if(m.phase==='game-over')break;
  if(strategy!=='none'&&m.time-lastSpell>.26){
   let power=null;
   const dangerWords=m.words.filter(w=>(FIELD.bottom-w.y)/w.speed<1.6),lowest=Math.max(0,...m.words.map(w=>w.y));
   if(m.inventory.wind&&m.danger>=(strategy==='conserve'?70:38))power='wind';
   else if(m.inventory.ice&&!m.effects.ice&&(m.words.length>=4||dangerWords.length>=2))power='ice';
   else if(m.inventory.slow&&!m.effects.slow&&(m.words.length>=3&&!m.effects.ice||strategy==='expert'&&m.words.length>=4))power='slow';
   else if(m.inventory.fire&&!m.effects.ice&&dangerWords.length>=2&&m.words.length>=3)power='fire';
   const preCastDanger=m.danger;
   if(power&&m.cast(power,'simulation')){if(power==='wind')economy.windPressures.push(Math.round(preCastDanger*100)/100);lastSpell=m.time;if(power==='fire'){task=null;m.setBuffer('',false);nextDecision=m.time+.2;}}
  }
  if(task&&!m.words.some(w=>w.id===task.id)){task=null;m.setBuffer('',false);nextDecision=m.time+.25;}
  if(!task&&m.words.length&&m.time>=nextDecision){
   const w=[...m.words].sort((a,b)=>(FIELD.bottom-a.y)/a.speed-(FIELD.bottom-b.y)/b.speed)[0];
   const typo=!perfect&&r()<profile.error;
   const text=typo?'Z'+w.text.slice(1):w.text;
   task={id:w.id,text,index:0,next:m.time+profile.acquire,rate:60/(profile.wpm*5)*(1+(r()-.5)*.12)};
  }
  if(task&&m.time>=task.next){
   if(task.index<task.text.length){task.index++;m.setBuffer(task.text.slice(0,task.index),false);task.next+=task.rate;}
   else {m.submit(false);task=null;nextDecision=m.time+.035;}
  }
  const beforeTime=m.time;
  m.step(dt);steps++;peakWords=Math.max(peakWords,m.words.length);
  const elapsed=m.time-beforeTime,held=Object.values(m.inventory).reduce((a,b)=>a+b,0);
  economy.peakHeld=Math.max(economy.peakHeld,held);economy.heldSeconds+=held*elapsed;
  if(held===0)economy.emptySeconds+=elapsed;
  if(['fire','ice','slow','wind'].every(p=>m.inventory[p]>=(baseline?3:RULES.inventoryCapacity)))economy.fullSeconds+=elapsed;
 }
 collectEvents();
 economy.meanHeld=Math.round(economy.heldSeconds/Math.max(.01,m.time)*100)/100;
 economy.emptyFraction=Math.round(economy.emptySeconds/Math.max(.01,m.time)*1000)/1000;
 economy.endHeld=Object.values(m.inventory).reduce((a,b)=>a+b,0);
 return {economy,pace,profile:profile.id,typingWpm:profile.wpm,errorProbabilityPerWord:perfect?0:profile.error,strategy,seed,startLevel:level,campaign,completed,stageReached:m.level,score:m.score,missed:m.missed,wrong:m.wrong,seconds:Math.round(m.time),peakWords,casts:m.casts,stageRows,timeout:m.time>=limit};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
const started=performance.now(),runs=[];
for(const pace of ['relaxed','classic','maniac'])for(const profile of profiles)for(const seed of (quick?[17]:[17,419,2026,9203,65521])){
 runs.push(simulate({ModelClass:Model,pace,profile,seed,campaign:true}));
}
const summary=[];
for(const pace of ['relaxed','classic','maniac'])for(const profile of profiles){
 const group=runs.filter(r=>r.pace===pace&&r.profile===profile.id),stages=group.map(r=>r.stageReached).sort((a,b)=>a-b);
 summary.push({pace,wpm:profile.wpm,errorPct:profile.error*100,completed:group.filter(r=>r.completed).length,runs:group.length,medianStage:stages[Math.floor(stages.length/2)],range:[stages[0],stages.at(-1)],meanHeld:Math.round(group.reduce((n,r)=>n+r.economy.meanHeld,0)/group.length*100)/100,medianSeconds:group.map(r=>r.seconds).sort((a,b)=>a-b)[Math.floor(group.length/2)]});
}
const sweeps=[];
if(!baseline&&!quick){
 for(const pace of ['relaxed','classic','maniac'])for(let level=1;level<=48;level++)for(const seed of [11,997,4001]){
  const profile=profiles[pace==='relaxed'?2:pace==='classic'?3:4];
  sweeps.push(simulate({pace,level,seed,profile,campaign:false}));
 }
}
const table=Array.from({length:48},(_,i)=>{
 const level=i+1,mix=wordDistribution(level),banks=banksForLevel(level);
 const mean=Object.keys(mix).reduce((sum,key)=>sum+mix[key]*banks[key].reduce((n,w)=>n+w.length,0)/banks[key].length,0);
 return {level,wordMix:mix,meanLetters:Math.round(mean*100)/100,...Object.fromEntries(['relaxed','classic','maniac'].map(p=>{const c=levelRules(level,p);return [p,{speed:c.speed,interval:c.interval,quota:c.quota,trial:c.trial,secondsToFloor:476/c.speed,nominalKeystrokeWpm:(mean+1)*12/c.interval}];}))};
});
const output=baseline?'baseline-simulation':quick?'simulation-quick':'playtest-simulation';
const report={kind:'Synthetic agents, not human subjects',date:new Date().toISOString().slice(0,10),model:baseline?'uploaded v3.2 baseline':RULESET_VERSION,assumptions:{tickHz:60,targetSelection:'earliest landing; perfect knowledge of visible word strings, imperfect timed input',errors:'Independent wrong submission probability per word, not per character',acquisitionDelay:'0.12–0.32 seconds per word',spells:'reactive rules, .26 second spacing, no future spawn knowledge',retries:'disabled for campaign audits; first full-pile loss ends run',limits:'Does not model reading comprehension, fatigue, hardware, enjoyment, learning, attention, or retention. Not a human WPM recommendation.'},summary,runs,chapterSweeps:sweeps,stageTable:baseline?null:table,wallSeconds:Math.round((performance.now()-started)/1000)};
await fs.mkdir('docs/qa',{recursive:true});await fs.writeFile(`docs/qa/${output}.json`,JSON.stringify(report,null,2));console.table(summary);console.log('Runs',runs.length,'chapter sweeps',sweeps.length,'wall seconds',report.wallSeconds);

}
