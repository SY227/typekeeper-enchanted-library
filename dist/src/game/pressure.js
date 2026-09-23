/** Expression thresholds and readable cues are deliberate v2 design decisions. */
export const PRESSURE_STATES=Object.freeze([
  {key:'calm',min:0,label:'COMPOSED',color:'#b5d7b4',line:'One word at a time.'},
  {key:'focused',min:25,label:'FOCUSED',color:'#e0d6a0',line:'Keep an eye on the lowest words.'},
  {key:'worried',min:50,label:'WORRIED',color:'#e7bd7d',line:'The paper pile is growing.'},
  {key:'alarmed',min:75,label:'ALARMED',color:'#e9a37d',line:'A little magic would help.'},
  {key:'critical',min:90,label:'CRITICAL',color:'#f5a39b',line:'Cast WIND [4] to clear the pile!'}
]);
export function pressureState(danger,phase='playing') {
  if(phase==='game-over')return {key:'defeated',min:100,label:'OVERWHELMED',color:'#d4abb1',line:'Take a breath. Begin again.'};
  if(phase==='level-clear'||phase==='victory')return {key:'celebrate',min:0,label:'CHAPTER SAVED',color:'#ead69c',line:'Beautifully written.'};
  const value=Math.max(0,Math.min(100,Number(danger)||0));
  return [...PRESSURE_STATES].reverse().find(p=>value>=p.min)||PRESSURE_STATES[0];
}
