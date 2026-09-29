import { RULESET_VERSION, PREVIOUS_RULESET_VERSION } from './rules.js?v=3.6.4-8959ae504cb14f7f';

/** Score Chase always compares the number shown in SCORE: the running total.
 * Campaign totals are indexed by reached chapter AND starting chapter. They must
 * never be reconstructed by adding unrelated per-chapter personal bests.
 * Practice has one chapter; Endless is one continuous run, not a per-wave target.
 */
export const SCORE_CHASE_LIMIT = 512;
const chasePaces = ['classic','relaxed','maniac'];
const chaseModes = ['campaign','practice','endless'];
const chaseInteger = (v,min=0,max=1e12) => Number.isSafeInteger(v)&&v>=min&&v<=max;
export function scoreChaseScope(run={}) {
 return {ruleset:run.scoreRuleset??run.ruleset??RULESET_VERSION,pace:run.pace,mode:run.mode,
  startLevel:run.startLevel??1,chapter:run.mode==='endless'?0:(run.chapter??run.level)};
}
export function scoreChaseKey(scope={}) {
 const {ruleset,pace,mode,startLevel,chapter}=scope;
 if(typeof ruleset!=='string'||!/^[-.\w]{1,64}$/.test(ruleset)||!chasePaces.includes(pace)||!chaseModes.includes(mode)||!chaseInteger(startLevel,1,10000))return null;
 if(mode==='endless'?chapter!==0||startLevel<49:!chaseInteger(chapter,1,48)||startLevel>chapter||mode==='practice'&&startLevel!==chapter)return null;
 return `running-v1|${ruleset}|${pace}|${mode}|${startLevel}|${chapter}`;
}
export function sanitizeScoreChaseRecord(input,{allowPrevious=false}={}) {
 // Historical scores may be kept on import, never promoted into current targets.
 const allowed=input?.ruleset===RULESET_VERSION||(allowPrevious&&input?.ruleset===PREVIOUS_RULESET_VERSION);
 if(!input||input.metric!=='running-total'||!scoreChaseKey(input)||!allowed||!chaseInteger(input.score))return null;
 return {...scoreChaseScope(input),metric:'running-total',score:input.score};
}
export function scoreChaseDescription(scope) {
 const pace={classic:'Classic',relaxed:'Relaxed',maniac:'Maniac'}[scope.pace]||'Classic';
 if(scope.mode==='endless')return `${pace} Endless running score. Best is locked at the start of this run.`;
 const chapter=String(scope.chapter).padStart(2,'0');
 return scope.mode==='practice'?`${pace} Practice, Chapter ${chapter}. Best is locked at the start of this attempt.`:
  `${pace} Campaign running total at Chapter ${chapter}, starting at Chapter ${String(scope.startLevel).padStart(2,'0')}. Best is locked on entering this chapter.`;
}
/** Only a contiguous, single-run checkpoint can recover historical running totals.
 * Missing, partial or inconsistent history is not guessed, including legacy saves.
 */
export function checkpointScoreChaseRecords(cp) {
 if(!cp||cp.ruleset!==RULESET_VERSION||cp.mode!=='campaign'||!chaseInteger(cp.startLevel,1,48)||!chaseInteger(cp.nextLevel,2,48)||!chaseInteger(cp.score)||!Array.isArray(cp.stageHistory))return [];
 const count=cp.nextLevel-cp.startLevel;
 if(count<=0||cp.stageHistory.length!==count)return [];
 let total=0;const rows=[];
 for(let i=0;i<count;i++) {
  const row=cp.stageHistory[i];
  if(row?.level!==cp.startLevel+i||row.ruleset!==RULESET_VERSION||!chaseInteger(row.stageScore))return [];
  total+=row.stageScore;if(!chaseInteger(total))return [];
  const record=sanitizeScoreChaseRecord({...scoreChaseScope({...cp,level:row.level}),score:total,metric:'running-total'});
  if(!record)return [];rows.push(record);
 }
 return total===cp.score?rows:[];
}

/** A frozen, presentation-only target. No storage reads or writes during play.
 * sync/restore may show a beaten record, but never replay its celebration.
 */
export class ScoreChase {
 constructor(){this.reset();}
 reset(){this.scope=null;this.key=null;this.best=null;this.value=0;this.beaten=false;this.enabled=false;}
 begin(scope,best,current=0) {
  this.scope=Object.freeze({...scope});this.key=scoreChaseKey(scope);
  this.enabled=!!this.key&&scope.ruleset===RULESET_VERSION;
  this.best=this.enabled&&best?.metric==='running-total'&&scoreChaseKey(best)===this.key&&chaseInteger(best?.score)?best.score:null;
  this.value=chaseInteger(current)?current:0;
  this.beaten=this.best!==null&&this.value>this.best;
  return this.snapshot();
 }
 observe(current,{award=false}={}) {
  if(!chaseInteger(current))return {...this.snapshot(),celebrate:false};
  const increased=current>this.value,justBeaten=this.enabled&&this.best!==null&&!this.beaten&&current>this.best;
  this.value=current;if(justBeaten)this.beaten=true;
  return {...this.snapshot(),celebrate:justBeaten&&increased&&award};
 }
 snapshot(){
  const state=!this.enabled?'legacy':this.best===null?'first':this.beaten?'beaten':this.best>0&&this.value>=this.best*.9?'near':'tracking';
  return {scope:this.scope,key:this.key,best:this.best,value:this.value,state,delta:this.best===null?0:Math.max(0,this.value-this.best)};
 }
}
