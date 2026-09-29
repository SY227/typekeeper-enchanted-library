/** Authored spell economy. Counts actual card arrivals, never elapsed time or skill.
 * Carried between chapters and serialized at safe chapter boundaries.
 * A scheduled card is an opportunity: the player must still type it to earn a book.
 */
export const ECONOMY_VERSION=1;
export function economyRules(level){
 const n=Math.max(1,Math.floor(Number(level)||1));
 const [minGap,maxGap]=n<=6?[8,11]:n<=12?[8,10]:n<=24?[7,10]:[6,9];
 return {minGap,maxGap,trial:n%6===0,trialFirstBy:4,trialGap:8};
}
export function validEconomy(e){
 return !!(e&&e.version===ECONOMY_VERSION&&Number.isInteger(e.untilNext)&&e.untilNext>=1&&e.untilNext<=11
  &&Number.isSafeInteger(e.opportunities)&&e.opportunities>=0&&e.opportunities<=1e9&&typeof e.tutorialDone==='boolean');
}
export function createEconomy(level=1,mode='campaign'){
 const introductory=level===1&&mode==='campaign';
 return {version:ECONOMY_VERSION,untilNext:introductory?6:economyRules(level).minGap,opportunities:0,tutorialDone:!introductory};
}
/** Trial opportunities replace the next ordinary drop; they never add free stock.
 * Idempotent so normal progression and Continue/Retry share exactly the same opening.
 */
export function prepareEconomy(e,level){
 const cfg=economyRules(level);
 if(cfg.trial)e.untilNext=Math.min(e.untilNext,cfg.trialFirstBy);
 return e;
}
export function restoreEconomy(e,level){
 // Older saves did not record this schedule. Initialize conservatively once;
 // subsequent saves preserve it. Never pretend to recover the original sequence.
 const restored=validEconomy(e)?{...e}:{version:ECONOMY_VERSION,untilNext:economyRules(level).minGap,opportunities:0,tutorialDone:true};
 return prepareEconomy(restored,level);
}
export function nextSpellGap(level,random){
 const cfg=economyRules(level);
 return cfg.trial?cfg.trialGap:cfg.minGap+Math.floor(random()*(cfg.maxGap-cfg.minGap+1));
}
