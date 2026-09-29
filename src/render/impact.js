/** Impact Pass — bounded presentation state only. No simulation, RNG, score or
 * input authority. Times are seconds; drawing and sound consume the same landing. */
export const IMPACT = Object.freeze({key:.095,erase:.105,return:.16,landing:.30,settle:.24,normalClear:.25,points:.44,arrivals:12,deaths:18,pointsCap:6});
const impactClamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
export function impactEnvelope(remaining,duration){const t=impactClamp(remaining/duration);return Math.sin(t*Math.PI/2);}
export class MachineResponse {
 constructor(){this.reset();}
 reset(){this.key=0;this.erase=0;this.returning=0;this.returnFrom=0;this.carriage=0;this.hand=0;this.lastLength=0;this.lastTarget=null;}
 input(event,motion=true){
  if(!event.changed)return;
  this.lastLength=String(event.text||'').length;this.lastTarget=event.target?.id??null;
  if(!motion){this.key=this.erase=this.returning=0;this.carriage=0;return;}
  this.returning=0;this.carriage=impactClamp(this.lastLength,0,24)*.66;
  if(event.erased){this.erase=IMPACT.erase;this.key=0;}else{this.key=IMPACT.key;this.erase=0;this.hand^=1;}
 }
 submit(motion=true){this.returnFrom=this.carriage;this.returning=motion?IMPACT.return:0;this.carriage=0;this.lastLength=0;this.lastTarget=null;}
 step(dt,motion=true){if(!motion){this.reset();return;}const d=impactClamp(dt,0,.05);for(const k of ['key','erase','returning'])this[k]=Math.max(0,this[k]-d);}
 pose(motion=true){if(!motion)return {tap:0,erase:0,returning:0,shift:0,hand:this.hand};return {tap:impactEnvelope(this.key,IMPACT.key),erase:impactEnvelope(this.erase,IMPACT.erase),returning:Math.sin(impactClamp(this.returning/IMPACT.return)*Math.PI),shift:-(this.carriage+this.returnFrom*(this.returning/IMPACT.return)**2)||0,hand:this.hand};}
}
/** Stack occupies the desk pocket between the real input and SLOW. Upper leaves
 * may grow left only ABOVE the input. Right edge never enters the spell hit area. */
export function pileLeaf(danger,layer=1){
 const d=impactClamp(danger/100),k=impactClamp(layer),y=811-d*112*k;
 const width=58+Math.min(42,Math.max(0,728-y)*1.5);
 return {x:857-width/2,y,width,height:20,angle:Math.sin(Math.round(k*31)*2.31)*.018};
}
export function targetTreatment(word,buffer,selected,contrast=false){
 const matches=!!buffer&&word.text.startsWith(buffer),complete=matches&&word.text===buffer;
 return {matches,complete,selected:matches&&selected,weight:matches?(selected?2.4:1):0,
  ink:word.kind==='bonus'?'#e6fff0':contrast?'#002d1b':'#0d563e',
  edge:word.kind==='bonus'?'#e8d398':contrast?'#10281d':complete?'#274f35':'#4b6c51'};
}
/** Store a last-painted source, including spawn transforms, so a saved/missed
 * card cannot snap back to its logical spawn coordinate on the very next frame. */
export function impactSource(word,pose){return {...word,x:pose?.x??word.x,y:pose?.y??word.y,visualScale:pose?.scale??1,visualAngle:pose?.angle??0};}
export function pendingPaperPressure(arrivals){return arrivals.reduce((n,a)=>n+(Number.isFinite(a.pressure)?a.pressure:0),0);}

/** Exactly mirror what Enter will accept: full-word matches first; otherwise
 * keep the original lowest-y/id prefix focus. Read-only presentation selection. */
export function impactTarget(words,buffer){
 if(!buffer)return null;
 const exact=words.filter(w=>w.text===buffer),pool=exact.length?exact:words.filter(w=>w.text.startsWith(buffer));
 return pool.sort((a,b)=>b.y-a.y||a.id-b.id)[0]||null;
}
/** Model input events historically previewed the lowest prefix even when another
 * complete word would be saved by Enter. Normalize feedback only, never the model.
 * Reconstruct words resolved later in a batched event drain; exclude later spawns. */
export function impactFeedbackEvents(events,words){
 return events.map((event,index)=>{
  if(event.type!=='input')return event;
  const future=events.slice(index+1),unborn=new Set(future.filter(e=>e.type==='spawn').map(e=>e.word.id));
  const pool=new Map(words.filter(w=>!unborn.has(w.id)).map(w=>[w.id,w]));
  for(const e of future){
   if(['correct','miss'].includes(e.type)&&e.word&&!unborn.has(e.word.id))pool.set(e.word.id,e.word);
   if(e.type==='power')for(const w of e.removed||[])if(!unborn.has(w.id))pool.set(w.id,w);
  }
  if(event.target&&!pool.has(event.target.id)&&!unborn.has(event.target.id))pool.set(event.target.id,event.target);
  const target=impactTarget([...pool.values()],event.text);
  return {...event,target:target?{...target}:null,complete:!!target&&target.text===event.text};
 });
}
