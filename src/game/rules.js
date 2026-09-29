/** Versioned, authored rules. No claim of exact numerical parity with the reference videos. */
import { stageInfo } from '../data/campaign.js';
export const RULESET_VERSION = 'typekeeper-3.6.4';
export const PREVIOUS_RULESET_VERSION = 'typekeeper-3.2.1';
export const WIDTH=1200, HEIGHT=900;
export const FIELD=Object.freeze({left:226,right:978,top:172,bottom:648});
export const POWERS=Object.freeze(['fire','ice','slow','wind']);
export const POWER_META=Object.freeze({
 fire:{name:'FIRE',key:'1',color:'#ef8959',description:'Burn every falling word.',detail:'Instantly clears falling cards. No score, progress, or books from burned cards.'},
 ice:{name:'ICE',key:'2',color:'#8bdfed',description:'Freeze the field for 6 seconds.',detail:'Stops falling cards and new arrivals. Type freely while time is frozen.'},
 slow:{name:'SLOW',key:'3',color:'#edd17b',description:'Create 8 seconds of breathing room.',detail:'Cards fall at 42% speed; arrivals slow to 70%. Waits safely while ICE is active; no duration is lost.'},
 wind:{name:'WIND',key:'4',color:'#bdacf2',description:'Sweep the paper pile back to zero.',detail:'Clears the LIMIT meter and restores the Typekeeper’s composure.'}
});
export const RULES=Object.freeze({step:1/60,inventoryCapacity:2,iceDuration:6,slowDuration:8,slowFactor:.42,slowSpawnFactor:.7,maxActive:12,bufferLimit:24,missBase:8,missPerLetter:.8,invalidPenalty:2,darkMissFactor:1.5,fireAwardsScore:false,powerCollection:'immediate',commandPriority:'lowest-exact-word-first',transition:'clear-field-keep-danger-and-inventory-reset-timed-effects',spellCooldown:.22,lateSubmissionWindow:.35,emptyFieldDelay:.65,fireRecovery:.7,replayLimit:100000});
export const PACES=Object.freeze({
 relaxed:{label:'Relaxed',speed:.68,interval:1.6,caption:'Room to find your rhythm.'},
 classic:{label:'Classic',speed:1,interval:1,caption:'Find your rhythm, then hold the line.'},
 maniac:{label:'Maniac',speed:1.22,interval:.78,caption:'For very quick fingers.'}
});
/** Author-controlled knots: an earlier challenge, not performance-based rubber banding.
 * A card's speed never changes mid-flight when a chapter advances or danger rises. */
export const PACE_CURVE=Object.freeze([
 Object.freeze([1,30.6,1.90]),Object.freeze([3,40.5,1.70]),Object.freeze([6,55.1,1.50]),
 Object.freeze([12,76,1.30]),Object.freeze([24,99,1.12]),
 Object.freeze([36,118.32,1.02]),Object.freeze([48,135.96,.96])
]);
export function levelRules(level,pace='classic') {
 const n=Math.max(1,Math.floor(Number(level)||1)), p=PACES[pace]||PACES.classic, info=stageInfo(n);
 const finalSpeed=PACE_CURVE.at(-1)[1];
 let baseSpeed=finalSpeed,interval=.96;
 for(let i=1;i<PACE_CURVE.length;i++)if(n<=PACE_CURVE[i][0]){
  const a=PACE_CURVE[i-1],b=PACE_CURVE[i],t=Math.max(0,(n-a[0])/(b[0]-a[0]));
  baseSpeed=a[1]+(b[1]-a[1])*t;interval=a[2]+(b[2]-a[2])*t;break;
 }
 if(n>48){baseSpeed=Math.min(170,finalSpeed+(n-48)*.65);interval=Math.max(.78,.96-(n-48)*.003);}
 // Only the two previously 13-word chapters change. Keep the authored curve.
 const authoredQuota=Math.min(42,12+Math.floor((n-1)/2)+(info.trial?4:0));
 return {quota:authoredQuota===13?14:authoredQuota,speed:baseSpeed*p.speed,interval:interval*p.interval,specialChance:.2,darkChance:n>=7?Math.min(.14,(n-6)*.0033):0,trial:info.trial};
}
export function normalizeInput(value){return String(value).toUpperCase().replace(/[^A-Z]/g,'').slice(0,RULES.bufferLimit);}
export function mulberry32(seed){let state=seed>>>0;return()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const COMBO_RULES=Object.freeze({step:8,increment:.25,cap:3});
export function streakMultiplier(streak){return Math.min(COMBO_RULES.cap,1+Math.floor(streak/COMBO_RULES.step)*COMBO_RULES.increment);}
export function scoreForWord(text,kind,streak){return Math.round(text.length*10*streakMultiplier(streak)*(kind==='bonus'?2:1));}

/** Conservative serif glyph advances: the simulation does not require a canvas. */
export function wordCardWidth(text,kind='normal'){
 const advances={A:.76,B:.73,C:.76,D:.8,E:.7,F:.65,G:.81,H:.81,I:.42,J:.52,K:.8,L:.7,M:1.02,N:.82,O:.83,P:.69,Q:.83,R:.8,S:.66,T:.76,U:.82,V:.79,W:1.06,X:.8,Y:.8,Z:.71};
 const size=text.length>15?22:text.length>12?24:27;
 const width=[...text].reduce((n,c)=>n+(advances[c]||.83)*size,0)+36+(POWERS.includes(kind)?26:0);
 return Math.max(112,Math.min(410,Math.ceil(width)));
}

/** Each chapter gets its own reproducible stream; save/quit never rerolls it. */
export function chapterSeed(seed,level) {
 let x=(seed>>>0)^Math.imul(level>>>0,0x9e3779b9);
 x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);
 return (x^(x>>>16))>>>0;
}
