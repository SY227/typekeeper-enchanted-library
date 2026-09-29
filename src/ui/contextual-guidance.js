/** Context-only guidance. Display time advances only while useful and visible. */
export class ContextualGuidance {
 constructor({word=false,ice=false}={}){this.word=word===true;this.ice=ice===true;this.iceSeconds=0;}
 savedWord(){const changed=!this.word;this.word=true;return changed;}
 castIce(){const changed=!this.ice;this.ice=true;return changed;}
 update({enabled=true,playing=false,visible=true,exactMatch=false,iceReady=false,dt=0}={}){
  const usable=enabled&&playing&&visible;
  const enter=usable&&!this.word&&exactMatch;
  const offer=usable&&!this.ice&&iceReady;
  let changed=false;
  if(offer){this.iceSeconds+=Math.max(0,Math.min(.1,Number(dt)||0));if(this.iceSeconds>=6){this.ice=true;changed=true;}}
  return {enter,ice:offer&&!this.ice,changed};
 }
 snapshot(){return {word:this.word,ice:this.ice};}
}
export function readableHudSizes(scale){
 const s=Number.isFinite(scale)&&scale>0?scale:1;
 // Target 14 CSS px on laptop sizes. Cap tiny windows; do not grow forever.
 return {label:Math.min(23,Math.max(15,14/s)),cue:Math.min(25,Math.max(16,15/s)),key:Math.min(29,Math.max(21,17/s))};
}
