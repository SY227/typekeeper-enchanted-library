/** Valid-state spawn liveness at the end of every chapter.
 * Controlled boundary fixtures, not human players or claims about playability.
 * Invokes the shipped model unchanged. Each case must earn its last point using
 * the normal buffer/submit path, then reach the following chapter or the finale.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const arg=process.argv.slice(2);const root=path.resolve(arg[arg.indexOf('--root')+1]);
const out=path.resolve(arg.includes('--out')?arg[arg.indexOf('--out')+1]:'flow-model-results.json');
const {GameModel}=await import(pathToFileURL(path.join(root,'src/game/model.js')));
const {RULES,FIELD}=await import(pathToFileURL(path.join(root,'src/game/rules.js')));
const cases=['empty','fire','ice','slow','wind','fire-ice','ice-fire','slow-ice','ice-slow','fire-ice-slow-wind','slow-fire-ice-wind','final-miss','fire-pause','ice-pause','slow-pause','late-after-fire','late-after-miss','double-ice','double-slow','ice-expiry-edge'];
const rows=[];let ticks=0,seconds=0;const begin=performance.now();
const snapshot=m=>({...m.snapshot(),spawnClock:m.spawnClock,pendingSpawn:m.pendingSpawn,spawned:m.spawnedThisLevel});
function advance(m,n=1){for(let i=0;i<n;i++){m.step();ticks++;seconds+=RULES.step;assert(Number.isFinite(m.spawnClock),'nonfinite spawn timer');for(const w of m.words){assert(Number.isFinite(w.x)&&Number.isFinite(w.y)&&Number.isFinite(w.width),'invalid live word');assert(w.text.length>0,'empty word');}m.drainEvents();}}
function until(m,fn,max=45){let n=0;while(!fn()&&m.phase==='playing'&&n++<Math.ceil(max/RULES.step))advance(m);assert(fn(),JSON.stringify(snapshot(m)));return n*RULES.step;}
function verify({level,pace,seed,name}){
 const m=new GameModel();m.start({level,pace,seed});m.drainEvents();const quota=m.config.quota;
 // Legal checkpoint-like state immediately before the last accepted word.
 m.progress=quota-1;m.stageCorrect=quota-1;m.correct=quota-1;m.score=5000;m.danger=25;
 m.inventory={fire:2,ice:2,slow:2,wind:2};
 let lastText='',earlyWait=0;
 if(name!=='empty'){
  until(m,()=>m.words.length===1,4);lastText=m.words[0].text;
  if(['final-miss','late-after-miss'].includes(name)){
   m.words[0].y=FIELD.bottom-.01;advance(m);assert.equal(m.words.length,0);
  }else if(name==='double-ice'){
   assert(m.cast('fire'));assert(m.cast('ice'));earlyWait+=until(m,()=>m.effects.ice===0,7);
   assert(m.cast('ice'));
  }else if(name==='double-slow'){
   assert(m.cast('slow'));assert(m.cast('fire'));earlyWait+=until(m,()=>m.effects.slow===0,9);
   // Another valid slow cast while preserving the original active replacement.
   assert(m.cast('slow'));
  }else if(name==='ice-expiry-edge'){
   assert(m.cast('fire'));assert(m.cast('ice'));m.effects.ice=RULES.step/2;
  }else{
   for(const p of name.split('-'))if(['fire','ice','slow','wind'].includes(p))assert(m.cast(p),p);
   
  }
  if(name.startsWith('late-')){m.setBuffer(lastText);assert.equal(m.submit(),'late');assert.equal(m.progress,quota-1);}
  if(name.includes('pause')){
   m.pause('qa');const before=JSON.stringify(snapshot(m));advance(m,120);assert.equal(JSON.stringify(snapshot(m)),before,'pause changed state');m.resume();
  }
 }
 const start=m.time;
 // ICE intentionally stops both the empty board and generation until it expires.
 const wait=until(m,()=>m.words.length>0&&m.effects.ice===0,30);
 assert.equal(m.phase,'playing');assert.equal(m.progress,quota-1);assert(m.words.length<=1,'extra final-card population');
 const w=m.words[0];m.setBuffer(w.text);assert.equal(m.submit(),'word');assert.equal(m.phase,'level-clear');assert.equal(m.progress,quota);
 assert.equal(m.stageHistory.filter(s=>s.level===level).length,1);
 let following=0;
 if(level<48){assert(m.nextLevel());assert.equal(m.level,level+1);following=until(m,()=>m.words.length>0,4);assert(m.words.length>0);}
 else{assert(m.finishCampaign()?.victory);assert.equal(m.nextLevel(),false);}
 return {level,pace,seed,scenario:name,status:'PASS',lastWordWait:+(wait+earlyWait).toFixed(3),nextChapterWait:+following.toFixed(3)};
}
for(const pace of ['relaxed','classic','maniac'])for(let level=1;level<=48;level++)for(const seed of [1,17,419,2026,65521,83718,123456,0xffffffff])for(const name of cases){
 try{rows.push(verify({level,pace,seed,name}));}catch(e){rows.push({level,pace,seed,scenario:name,status:'FAIL',error:e.message});}
}
const boundaryRows=rows.length;await fs.writeFile(out+'.boundary.json',JSON.stringify({checks:rows.length,failures:rows.filter(r=>r.status==='FAIL'),rows},null,2));
// Black-box repeated full campaigns, including actual random spawns, scarce earned
// spells, timed freeze/slow and voluntary wait. Any no-spawn state has a deadline.
const campaigns=[];
for(const pace of ['relaxed','classic','maniac'])for(const seed of [9,377,9991,775533]){
 const m=new GameModel();m.start({seed,pace});let dwell=0,maxGap=0,clears=0,steps=0,actions=0;
 while(m.phase!=='game-over'&&steps++<700000){
  if(m.phase==='level-clear'){clears++;if(m.level===48)break;m.nextLevel();dwell=0;}
  advance(m);
  if(m.phase==='playing'&&!m.words.length&&m.effects.ice===0){dwell+=RULES.step;maxGap=Math.max(maxGap,dwell);const allowed=Math.max(6,m.config.interval*(m.config.trial?1.8:1)/RULES.slowSpawnFactor+.2);assert(dwell<allowed,JSON.stringify({dwell,allowed,snapshot:snapshot(m),scenario:'full-campaign',seed,pace}));}else dwell=0;
  if(m.words.length&&steps%12===0){
   if(m.inventory.fire>0&&actions%27===0)m.cast('fire','qa');
   else{if(m.inventory.ice>0&&actions%13===0)m.cast('ice','qa');if(m.inventory.slow>0&&actions%17===0)m.cast('slow','qa');const w=m.words[0];m.setBuffer(w.text);m.submit();}actions++;
  }
 }
 campaigns.push({pace,seed,completed:clears===48,chapters:clears,phase:m.phase,level:m.level,steps,maxEmptyGap:+maxGap.toFixed(3),casts:m.casts});
}
const report={scope:'Shipping v3.6.0 model with unchanged typekeeper-3.2.1 gameplay rules; controlled end-of-chapter fixtures plus full deterministic campaign liveness.',boundaryChecks:boundaryRows,passed:rows.filter(r=>r.status==='PASS').length,failed:rows.filter(r=>r.status==='FAIL').length,scenarios:cases.length,seeds:8,paces:3,chapters:48,maxLastWordWait:Math.max(...rows.filter(r=>r.status==='PASS').map(r=>r.lastWordWait)),campaigns,ticks,simulatedSeconds:Math.round(seconds),wallSeconds:+((performance.now()-begin)/1000).toFixed(3),rows};
await fs.writeFile(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,rows:undefined},null,2));assert.equal(report.failed,0);assert(campaigns.every(c=>c.completed));
