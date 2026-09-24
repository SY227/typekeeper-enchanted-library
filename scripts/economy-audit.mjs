/** Deterministic opportunity audit, not human playtesting.
 * An instant perfect typist never casts: tests scheduled supply and legal inventory
 * ceilings separately from timing/survival. Paired campaign simulations have their
 * own explicit finite-speed player model in playtest-simulation.mjs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { GameModel } from '../src/game/model.js';
import { POWERS, RULES, RULESET_VERSION } from '../src/game/rules.js';
import { economyRules } from '../src/game/economy.js';
const args=process.argv.slice(2);
const baseline=args.includes('--baseline')?args[args.indexOf('--baseline')+1]:null;
const OldModel=baseline?(await import(pathToFileURL(path.resolve(baseline,'src/game/model.js')))).GameModel:null;
function audit(Model,seed){
 const m=new Model();m.start({seed,pace:'classic'});const stages=[];let offered=0,earned=0,overflow=0;
 for(let chapter=1;chapter<=48;chapter++){
  const row={chapter,trial:m.config.trial,quota:m.config.quota,openingStock:{...m.inventory},opportunities:[],earned:0,overflow:0};
  while(m.phase==='playing'){
   assert.equal(m.spawn(),true);const w=m.words[0];
   if(POWERS.includes(w.kind)){offered++;row.opportunities.push({card:m.spawnedThisLevel,power:w.kind});}
   m.setBuffer(w.text);m.submit();
   for(const e of m.drainEvents())if(e.type==='correct'){
    if(e.collected){earned++;row.earned++;}if(e.overflow){overflow++;row.overflow++;}
   }
   if(Model===GameModel)assert.ok(Object.values(m.inventory).every(n=>n<=RULES.inventoryCapacity));
  }
  row.endingStock={...m.inventory};stages.push(row);if(chapter<48)assert.equal(m.nextLevel(),true);
 }
 assert.equal(offered,earned+overflow);return{seed,offered,earned,overflow,stages};
}
const current=[],prior=[];
for(let seed=1;seed<=100;seed++){current.push(audit(GameModel,seed));if(OldModel)prior.push(audit(OldModel,seed));}
const summary=[];
for(const [lo,hi] of [[1,1],[1,3],[1,6],[7,12],[13,24],[25,36],[37,48]]){
 const stats=runs=>{if(!runs.length)return null;const rows=runs.flatMap(r=>r.stages.filter(s=>s.chapter>=lo&&s.chapter<=hi));return{meanOpportunitiesPerCourse:rows.reduce((n,r)=>n+r.opportunities.length,0)/runs.length,opportunitiesPer100Cards:100*rows.reduce((n,r)=>n+r.opportunities.length,0)/rows.reduce((n,r)=>n+r.quota,0),minPerChapter:Math.min(...rows.map(r=>r.opportunities.length)),maxPerChapter:Math.max(...rows.map(r=>r.opportunities.length))};};
 const next=stats(current),old=stats(prior);
 summary.push({chapters:[lo,hi],current:next,baseline:old,reductionPct:old?100*(1-next.meanOpportunitiesPerCourse/old.meanOpportunitiesPerCourse):null});
}
for(const run of current){
 assert.deepEqual(run.stages[0].opportunities,[{card:6,power:'ice'}]);
 for(const stage of run.stages.filter(r=>r.trial)){
  assert.ok(stage.opportunities[0].card<=4);
  for(let i=1;i<stage.opportunities.length;i++)assert.equal(stage.opportunities[i].card-stage.opportunities[i-1].card,8);
 }
 const powers=run.stages.flatMap(r=>r.opportunities.map(p=>p.power));
 for(let i=0;i+3<powers.length;i+=4)assert.equal(new Set(powers.slice(i,i+4)).size,4);
}
const pairedEarly=[];
try{
 const now=JSON.parse(await fs.readFile('docs/qa/playtest-simulation.json','utf8'));
 const old=JSON.parse(await fs.readFile('docs/qa/baseline-simulation.json','utf8'));
 for(const pace of ['relaxed','classic','maniac'])for(const profile of ['steady','fluent','expert']){
  const select=d=>d.runs.filter(r=>r.pace===pace&&r.profile===profile&&r.stageRows.some(s=>s.level===6));
  const a=select(now),b=select(old);const seeds=a.map(r=>r.seed).filter(s=>b.some(r=>r.seed===s));
  const sample=(rows)=>{
   const s=rows.filter(r=>seeds.includes(r.seed)).flatMap(r=>r.stageRows.filter(s=>s.level<=6));
   return {runs:seeds.length,booksOffered:s.reduce((n,r)=>n+r.booksOffered,0)/Math.max(1,seeds.length),timeWeightedMeanHeld:s.reduce((n,r)=>n+r.meanHeld*r.seconds,0)/Math.max(.01,s.reduce((n,r)=>n+r.seconds,0))};
  };
  pairedEarly.push({pace,profile,seeds,current:sample(a),baseline:sample(b)});
 }
}catch{}
const report={ruleset:RULESET_VERSION,scope:'100 seeded perfect-input no-cast campaigns for supply scheduling only, compared with uploaded v3.2 when --baseline is supplied. This agent bypasses typing time; it is not a difficulty or enjoyment model. Separate finite-speed campaign comparisons are labeled explicitly.',seeds:100,currentChapters:4800,baselineChapters:prior.length*48,summary,pairedFiniteSpeedFirstSixChapters:pairedEarly,current,baseline:prior};
await fs.mkdir('docs/qa',{recursive:true});await fs.writeFile('docs/qa/economy-audit.json',JSON.stringify(report,null,2));
console.table(summary.map(r=>({chapters:r.chapters.join('–'),new:r.current.meanOpportunitiesPerCourse,old:r.baseline?.meanOpportunitiesPerCourse,reduction:r.reductionPct?.toFixed(1)+'%'})));
console.log('All scheduled opportunity/cycle/cap invariants passed over',report.currentChapters,'current chapters.');
