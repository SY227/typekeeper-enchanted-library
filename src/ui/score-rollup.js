/** Presentation only. Scores are committed before this animation starts. */
export class ScoreRollup {
 constructor(){this.active=false;this.value=0;this.lastTick=-1;}
 start(from,to,now,{duration=1050,reduced=false}={}){
  this.from=Math.max(0,Math.round(Number(from)||0));this.to=Math.max(this.from,Math.round(Number(to)||0));
  this.duration=Math.max(1,Number(duration)||1050);this.started=now;this.lastTick=-1;
  this.active=!reduced&&this.to>this.from;this.value=this.active?this.from:this.to;return this.value;
 }
 step(now){
  if(!this.active)return {value:this.value,tick:false,done:false,progress:1};
  const progress=Math.max(0,Math.min(1,(now-this.started)/this.duration)),eased=1-(1-progress)**3;
  this.value=Math.min(this.to,this.from+Math.round((this.to-this.from)*eased));
  const index=Math.floor(progress*18),tick=index>this.lastTick&&progress<.98;
  this.lastTick=index;const done=progress===1;if(done){this.active=false;this.value=this.to;}
  return {value:this.value,tick,done,progress};
 }
 finish(){const wasActive=this.active;this.active=false;this.value=this.to??this.value;return {value:this.value,done:wasActive};}
 cancel(){this.active=false;}
}
