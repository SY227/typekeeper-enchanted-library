/** Isolate the value of saving WIND. Both synthetic agents use identical typing,
 * acquisition delay/error assumptions; only the WIND threshold differs (38 vs 70).
 * Higher survival is not an instruction that 70 is optimal for human players.
 */
import {simulate,profiles} from './playtest-simulation.mjs';
import fs from 'node:fs/promises';
const rows=[];
for(const pace of ['relaxed','classic','maniac'])for(const profile of profiles.slice(1,4))for(const seed of [17,419,2026,9203,65521])for(const strategy of ['reactive','conserve']){
 const r=simulate({pace,profile,seed,strategy,campaign:true});if(r.timeout)throw new Error('Unexpected timeout');rows.push(r);
}
const summary=[];
for(const pace of ['relaxed','classic','maniac'])for(const profile of profiles.slice(1,4))for(const strategy of ['reactive','conserve']){
 const group=rows.filter(r=>r.pace===pace&&r.profile===profile.id&&r.strategy===strategy);
 const stages=group.map(r=>r.stageReached).sort((a,b)=>a-b);
 summary.push({pace,wpm:profile.wpm,strategy,windThreshold:strategy==='conserve'?70:38,completed:group.filter(r=>r.completed).length,runs:group.length,medianChapter:stages[2],range:[stages[0],stages.at(-1)],meanWinds:group.reduce((n,r)=>n+r.casts.wind,0)/group.length});
}
const result={scope:'90 synthetic campaigns. Same typing profiles and seeds; WIND activation threshold is the only decision-policy change. Retries disabled. All losses retained. Not a human optimal-play recommendation.',summary,runs:rows};
await fs.writeFile('docs/qa/resource-strategy-audit.json',JSON.stringify(result,null,2));console.table(summary);
