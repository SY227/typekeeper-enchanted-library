/** UI-only geometry. Nothing here changes the 1200 × 900 simulation or word lane.
 * Book centers, paper anchor, character and authored rules remain unchanged.
 * All HUD text is measured in the transformed stage, not the outer window.
 */
export const HUD_LAYOUT = Object.freeze({
 pile: Object.freeze({x:1005,y:438,width:156,bottle:82}),
 bookTop:688, statusTop:-28, keyTop:35,
 context: Object.freeze({x:350,y:812,width:500,height:76}),
});
export function interfaceSizes(scale){
 const s=Number.isFinite(scale)&&scale>0?scale:1;
 const fit=(px,min,max)=>Math.min(max,Math.max(min,px/s));
 return Object.freeze({
  body:fit(13,16,21), small:fit(11,13,18), control:fit(36,44,58),
  utility:fit(36,42,58), tooltip:fit(13,15,21),
 });
}
/** The short caption supplements, never contradicts, the full rules in How to play. */
export const SPELL_CONTEXT=Object.freeze({
 fire:'Burns all falling words. No points, progress or books are awarded.',
 ice:'Freezes words and arrivals for 6 seconds. You can keep typing.',
 slow:'Slows words for 8 seconds. Waits safely while ICE is active.',
 wind:'Clears the paper pile to 0%. Falling words stay on the field.',
});
