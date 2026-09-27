import { SCROLL, scrollGeometry, scrollInsets, paintScrollMaterial } from './imperial-scroll.js';
import { ClassicRenderer } from './classic-renderer.js';
import { pressureState } from '../game/pressure.js';
import { POWER_META, POWERS, RULES, FIELD, mulberry32 } from '../game/rules.js';
import { musicDirection, smoothBand } from '../audio/mix.js';
import { BOOK_ANCHORS, PAPER_ANCHOR, roomForChapter, presentationTarget, readableCardLayout, resolveVisualPositions, visualClamp, visualEase } from './presentation.js';

function visRR(c,x,y,w,h,r=3){c.beginPath();c.roundRect(x,y,w,h,r);}
function visOff(w,h){const a=document.createElement('canvas');a.width=Math.ceil(w);a.height=Math.ceil(h);return a;}
function visLerp(a,b,t){return a+(b-a)*t;}
function visRGBA(hex,a){return `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${a})`;}
function visStar(c,x,y,r,color,alpha=1){
 c.save();c.globalAlpha*=alpha;c.strokeStyle=color;c.lineWidth=1.2;c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke();c.restore();
}

/** The v3.2.1 model is unchanged. All new timing, positions, paper and lighting below
 * are expendable presentation state; disabling motion never changes an outcome. */
export class GameRenderer extends ClassicRenderer {
 constructor(canvas,model,settings){
  super(canvas,model,settings);
  this.cssScale=1;this.sceneCache=new Map();this.cardLayouts=new Map();this.poses=new Map();
  this.spawns=new Map();this.arrivals=[];this.deaths=[];this.bookFlashes=[];this.inkMarks=[];
  this.motionTime=0;this.worldTime=0;this.poseTime=0;this.strike=0;this.recoil=0;this.erase=0;this.hand=0;this.streakBeat=0;
  this.milestone=0;this.glance=null;this.glanceTime=0;this.warmEcho=0;this.frostEcho=0;this.windEcho=0;
  this.pressureDip=0;this.pressureArmed=true;this.shownDanger=0;this.ceremony=null;
  this.guide={word:false,ice:false,targetId:null};this.randomFX=mulberry32(891331);
  this.particleCap=180;this.readability=[];this.outcomeProgress=0;
 }
 setViewport(scale){if(Math.abs(scale-this.cssScale)>.0001){this.cssScale=scale;this.cardLayouts.clear();}}
 setSettings(s){
  super.setSettings(s);
  this.cardLayouts?.clear();
  if(!s.motion){this.spawns?.clear();this.deaths=[];this.arrivals=[];this.bookFlashes=[];this.inkMarks=[];this.windEcho=0;this.pressureDip=0;}
  if(!s.hints&&this.guide)this.guide.targetId=null;
 }
 reset(){
  super.reset();this.spawns?.clear();this.poses?.clear();this.arrivals=[];this.deaths=[];this.bookFlashes=[];this.inkMarks=[];
  this.strike=0;this.recoil=0;this.erase=0;this.streakBeat=0;this.milestone=0;this.glance=null;this.glanceTime=0;
  this.warmEcho=0;this.frostEcho=0;this.windEcho=0;this.shownDanger=this.model.danger||0;
  this.pressureDip=0;this.pressureArmed=true;this.ceremony=null;if(this.guide)this.guide.targetId=null;
 }
 layout(w){
  const key=`${w.text}/${w.width}/${w.kind}/${this.cssScale.toFixed(4)}`;
  let out=this.cardLayouts.get(key);if(out)return out;
  const c=this.ctx;
  out=readableCardLayout(w.text,w.width,w.kind,this.cssScale,(text,size)=>{c.font=`700 ${size}px Georgia, serif`;return c.measureText(text);});
  if(this.cardLayouts.size>=80)this.cardLayouts.delete(this.cardLayouts.keys().next().value);
  this.cardLayouts.set(key,out);return out;
 }
 /** The same geometry defines paper, rollers, inset crest and text. */
 cardTexture(width,kind,height=60){
  const key=`imperial336/${Math.ceil(width)}/${height}/${kind}/${this.settings.contrast}`;
  if(this.textures.has(key)){const a=this.textures.get(key);this.textures.delete(key);this.textures.set(key,a);return a;}
  const im=visOff((width+32)*2,(height+32)*2),c=im.getContext('2d');c.scale(2,2);c.translate(16,16);
  paintScrollMaterial(c,width,height,kind,this.assets.paper,this.settings.contrast);
  this.textures.set(key,im);this.textureBytes+=im.width*im.height*4;
  while(this.textures.size>96||this.textureBytes>this.textureBudget){const first=this.textures.keys().next().value,old=this.textures.get(first);this.textureBytes-=old.width*old.height*4;this.textures.delete(first);}
  return im;
 }
 roomLayer(){
  const info=roomForChapter(this.model.level),key=`${info.name}/${this.settings.contrast}`;
  if(this.sceneCache.has(key))return this.sceneCache.get(key);
  const im=visOff(1200,790),c=im.getContext('2d'),r=mulberry32(713);
  // An unbound manuscript; translucent dark-green paper keeps the room and the
  // bright live slips separate in value. No opaque ivory rectangle or UI card.
  c.save();c.beginPath();c.moveTo(233,136);c.bezierCurveTo(446,121,745,134,968,135);c.lineTo(968,675);c.quadraticCurveTo(601,687,233,674);c.closePath();
  const g=c.createLinearGradient(228,135,980,688);g.addColorStop(0,visRGBA(info.paper,.53));g.addColorStop(.46,visRGBA(info.paper,.39));g.addColorStop(1,'#142b296f');c.fillStyle=g;c.shadowColor='#0008';c.shadowBlur=15;c.fill();c.shadowBlur=0;
  c.strokeStyle=visRGBA(info.wash,.22);c.lineWidth=1;c.stroke();c.clip();
  c.strokeStyle=visRGBA(info.wash,.075);c.lineWidth=.7;
  for(let y=161;y<680;y+=24){c.beginPath();c.moveTo(255,y);c.bezierCurveTo(465,y+3,756,y-1,950,y+1);c.stroke();}
  c.strokeStyle=visRGBA(info.wash,.14);c.beginPath();c.moveTo(268,140);c.lineTo(268,673);c.stroke();
  for(let i=0;i<740;i++){const x=235+r()*728,y=141+r()*536;c.fillStyle=visRGBA(r()>.5?'#ead6a3':'#051613',.04+r()*.035);c.fillRect(x,y,1+r()*5,.5);}
  c.strokeStyle=visRGBA('#bbaa71',.055);c.lineWidth=4;c.beginPath();c.ellipse(836,535,44,40,.3,0,Math.PI*1.8);c.stroke();
  for(let i=0;i<5;i++){c.fillStyle='#081d1b90';c.beginPath();c.arc(246,178+i*109,1.4,0,Math.PI*2);c.fill();}
  c.restore();
  // Small shelves and props are confined to the sides, outside text space.
  for(const side of [0,1]){
   const x=side?1003:52;c.fillStyle='#221b18';c.fillRect(x,389,143,9);c.fillRect(x,606,143,10);c.fillStyle='#94703d';c.fillRect(x,389,143,1);c.fillRect(x,606,143,1);
  }
  this.drawStaticProps(c,info);
  this.sceneCache.set(key,im);if(this.sceneCache.size>2)this.sceneCache.delete(this.sceneCache.keys().next().value);
  return im;
 }
 drawStaticProps(c,room){
  const [a,b]=room.props;
  const book=(x,y,w,h,color,tilt=0)=>{c.save();c.translate(x,y);c.rotate(tilt);c.fillStyle='#100d0b99';visRR(c,-w/2-2,-h-2,w+4,h+6,2);c.fill();const g=c.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'#342d26');g.addColorStop(.2,color);g.addColorStop(1,'#28231c');c.fillStyle=g;visRR(c,-w/2,-h,w,h,2);c.fill();c.strokeStyle='#d8bc7666';c.strokeRect(-w/2+3,-h+7,w-6,2);c.strokeRect(-w/2+3,-10,w-6,2);c.restore();};
  book(91,386,28,94,'#435647',-.04);book(123,385,23,110,'#776445',.04);book(155,386,33,86,'#514251',-.035);
  for(let i=0;i<6;i++)book(1013+i*21,386,17,73+(i%3)*8,room.wash,i%2?.01:-.02);
  c.save();c.lineWidth=1.3;c.strokeStyle=visRGBA(room.wash,.64);c.fillStyle='#172b28';
  if(['gear','orrery'].includes(a)){
   for(const [cx,cy,rad] of [[126,491,39],[169,553,22]]){c.beginPath();c.arc(cx,cy,rad,0,Math.PI*2);c.stroke();c.beginPath();c.arc(cx,cy,rad-6,0,Math.PI*2);c.stroke();for(let k=0;k<12;k++){const t=k*Math.PI/6;c.beginPath();c.moveTo(cx+Math.cos(t)*(rad-4),cy+Math.sin(t)*(rad-4));c.lineTo(cx+Math.cos(t)*(rad+4),cy+Math.sin(t)*(rad+4));c.stroke();}}
  }else if(a==='vine'){
   c.strokeStyle='#9db59c77';c.lineWidth=2;c.beginPath();c.moveTo(136,404);c.bezierCurveTo(108,469,170,508,134,580);c.stroke();
   for(let k=0;k<8;k++){const y=420+k*22,x=135+Math.sin(k)*10;c.fillStyle=k%2?'#7c9b6377':'#799d8570';c.beginPath();c.ellipse(x+(k%2?12:-12),y,17,6,k%2?-.55:.55,0,Math.PI*2);c.fill();}
   c.fillStyle='#473b2d';visRR(c,104,574,64,28,5);c.fill();
  }else if(a==='frost'){
   this.frost(c,90,422,104,157,.5,1);
  }else if(a==='brazier'){
   c.fillStyle='#302823';c.beginPath();c.ellipse(132,569,42,18,0,0,Math.PI);c.fill();c.stroke();c.fillRect(107,572,5,30);c.fillRect(152,572,5,30);
  }else if(a==='key'){
   c.beginPath();c.arc(123,451,19,0,Math.PI*2);c.moveTo(123,470);c.lineTo(123,552);c.lineTo(143,552);c.moveTo(123,539);c.lineTo(140,539);c.stroke();
  }else{
   book(125,602,74,96,room.wash,-.1);c.fillStyle=visRGBA(room.wash,.6);c.font='24px Georgia';c.textAlign='center';c.fillText(a==='laurel'?'❧':'✦',128,551);
  }
  if(['glass','frost','crystal'].includes(b)){
   c.fillStyle='#90c5d61a';visRR(c,1024,424,84,120,40);c.fill();c.strokeStyle='#bee5e83b';c.stroke();c.strokeStyle='#ddf8ed33';for(let i=0;i<6;i++){const x=1037+i*12;c.beginPath();c.moveTo(x,446+i%3*7);c.lineTo(x-2,469+i%2*13);c.stroke();}
  }else if(b==='cinder'){
   c.fillStyle='#352c24';visRR(c,1026,449,76,27,5);c.fill();c.strokeStyle='#ba8c5455';c.stroke();for(let i=0;i<7;i++){c.fillStyle=i%2?'#965d3a':'#cc936058';c.fillRect(1034+i*9,456+(i%2)*5,6,4);}
  }else if(b==='stars'){
   const pts=[[1019,460],[1080,432],[1108,474],[1061,526],[1027,509]];c.strokeStyle='#bba9e252';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();for(const [x,y]of pts)visStar(c,x,y,4,'#dfd5f2',.7);
  }else if(b==='seal'){
   c.strokeStyle='#b89757';c.beginPath();c.arc(1072,485,41,0,Math.PI*2);c.stroke();c.beginPath();c.arc(1072,485,35,0,Math.PI*2);c.stroke();c.fillStyle='#cfb77c';c.font='33px Georgia';c.textAlign='center';c.fillText('VIII',1072,497);
  }
  c.restore();
 }
 frost(c,x,y,w,h,alpha=1,amount=1){
  c.save();c.globalAlpha*=alpha;c.strokeStyle='#c4e6ef';c.lineWidth=.85;
  for(let i=0;i<9;i++){
   const yy=y+i*h/9,xx=x+(i%2?w:0),dir=i%2?-1:1;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+dir*19*amount,yy+14);c.lineTo(xx+dir*7*amount,yy+34);c.moveTo(xx+dir*13*amount,yy+10);c.lineTo(xx+dir*27*amount,yy+8);c.moveTo(xx+dir*16*amount,yy+21);c.lineTo(xx+dir*31*amount,yy+28);c.stroke();
  }c.restore();
 }
 handle(events){
  for(const e of events){
   if(e.type==='start'){this.reset();continue;}
   if(e.type==='next-level'){this.reset();continue;}
   if(e.type==='spawn'){
    const left=e.word.x<600,origin={x:left?181:1017,y:238+(e.word.id%3)*39};
    if(this.settings.motion){this.spawns.set(e.word.id,{from:origin,t:0,life:this.model.danger>80?.18:.21});this.bookFlashes.push({x:origin.x,y:origin.y,t:0,life:.24,dir:left?1:-1,color:POWER_META[e.word.kind]?.color||'#e1c88a'});}
    if(this.settings.hints&&!this.guide.word&&this.model.level===1){this.guide.targetId=e.word.id;}
   }
   if(e.type==='input'&&e.changed){
    if(e.erased){this.erase=.12;continue;}
    this.strike=.09;this.typing=1;this.hand^=1;
    if(!e.target&&e.text&&this.settings.motion){this.reaction=.2;this.inkMarks.push({t:0,life:.22,seed:e.tick||this.hand});}
    if(e.target&&this.settings.motion&&this.settings.typingShimmer!==false){this.keyGlints.set(e.target.id,{at:this.motionTime,length:e.text.length,complete:e.complete});if(this.keyGlints.size>12)this.keyGlints.delete(this.keyGlints.keys().next().value);}
   }
   if(e.type==='correct'){
    this.recoil=.12;this.strike=.08;this.guide.word=true;this.guide.targetId=null;
    if(e.streak%5===0){this.milestone=e.streak;this.streakBeat=.64;}
    const pose=this.poses.get(e.word.id);const w={...e.word,x:pose?.x??e.word.x,y:pose?.y??e.word.y};
    this.keyGlints.delete(e.word.id);this.spawns.delete(e.word.id);
    if(this.settings.motion){this.addDeath(w,e.word.kind);this.emitParticles(w.x,w.y,e.streak>=10?7:4,POWER_META[w.kind]?.color||'#e3cf9e',w.kind==='ice'?'ice':w.kind==='fire'?'ember':'paper');}
    this.floaters.push({x:w.x,y:w.y,text:`+${e.points}`,color:'#efdca8',t:0,life:.72});if(this.floaters.length>20)this.floaters.shift();
    if(this.settings.motion&&this.settings.typingShimmer!==false){this.gleams.push({word:w,t:0,life:.3});if(this.gleams.length>24)this.gleams.shift();}
    if(e.collected){
     if(this.settings.motion){this.flights.push({power:e.word.kind,x:w.x,y:w.y,t:0,life:.5});if(this.flights.length>10)this.flights.shift();}
     if(e.word.kind==='ice'&&this.settings.hints&&!this.guide.ice){this.guide.ice=true;this.glance=BOOK_ANCHORS.ice;this.glanceTime=1.25;}
    }
   }
   if(e.type==='wrong'){
    this.reaction=.24;this.recoil=.07;this.milestone=0;this.streakBeat=0;
    if(this.settings.motion)this.inkMarks.push({t:0,life:.3,seed:e.tick});
   }
   if(e.type==='miss'){
    const pose=this.poses.get(e.word.id);this.spawns.delete(e.word.id);this.keyGlints.delete(e.word.id);this.reaction=.15;
    if(this.settings.motion){const target=this.pilePoint(this.model.danger,e.word.id);this.arrivals.push({word:{...e.word,x:pose?.x??e.word.x,y:Math.min(FIELD.bottom,pose?.y??e.word.y)},target,t:0,life:.32});if(this.arrivals.length>12)this.arrivals.shift();}
   }
   if(e.type==='power'){
    this.spells.push({power:e.power,t:0,life:.65});if(this.spells.length>8)this.spells.shift();
    if(e.power==='fire'){
     this.warmEcho=1.5;
     for(const w of e.removed||[]){const p=this.poses.get(w.id);if(this.settings.motion)this.addDeath({...w,x:p?.x??w.x,y:p?.y??w.y},'fire');this.spawns.delete(w.id);this.keyGlints.delete(w.id);}
    }
    if(e.power==='ice')this.frostEcho=0;
    if(e.power==='wind'){
     this.relief=1.15;this.windEcho=1.1;this.arrivals=[];this.shownDanger=0;
     if(this.settings.motion)for(let i=0;i<24;i++){const dest=this.pilePoint(80,i),r=this.randomFX;this.particles.push({x:dest.x,y:dest.y+i*3,vx:-170-r()*270,vy:-40-r()*60,t:0,life:.5+r()*.45,color:'#dfcd9f',size:3+r()*5,angle:r()*4,spin:-2-r()*3,kind:'paper'});}
    }
   }
   if(e.type==='effect-end'&&e.power==='ice'){this.frostEcho=.7;if(this.settings.motion){this.emitParticles(224,364,5,'#d3edf4','ice');this.emitParticles(980,364,5,'#d3edf4','ice');}}
   if(e.type==='level-clear'){this.guide.targetId=null;this.streakBeat=.75;this.ceremony={kind:'clear',progress:0,level:this.model.level};}
   if(e.type==='game-over'){this.guide.targetId=null;this.ceremony={kind:'defeat',progress:0};}
  }
  if(this.inkMarks.length>6)this.inkMarks.splice(0,this.inkMarks.length-6);
  if(this.particles.length>this.particleCap)this.particles.splice(0,this.particles.length-this.particleCap);
 }
 addDeath(w,kind){
  const life=kind==='normal'?.32:kind==='fire'?.58:kind==='ice'?.55:kind==='wind'?.48:.46;
  this.deaths.push({word:w,kind,t:0,life,seed:w.id%5});if(this.deaths.length>18)this.deaths.shift();
 }
 pilePoint(danger,id=0){
  const d=visualClamp(danger/100),height=Math.max(0,d*142),x=808+Math.sin(id*3.17)*23;
  return {x,y:810-height};
 }
 frame(now,interpolation=1){
  const begin=performance.now(),dt=this.lastTime?Math.min(.05,Math.max(0,(now-this.lastTime)/1000)):0;this.lastTime=now;
  const paused=this.model.phase==='paused'||document.hidden,fxdt=paused?0:dt;
  this.time+=fxdt;this.motionTime+=this.settings.motion?fxdt:0;
  const worldRate=this.model.effects.ice>0?0:this.model.effects.slow>0?.42:1;
  this.worldTime+=this.settings.motion?fxdt*worldRate:0;
  this.expressionBlend=Math.min(1,this.expressionBlend+fxdt*6);this.relief=Math.max(0,this.relief-fxdt);this.typing=Math.max(0,this.typing-fxdt*8);
  for(const name of ['reaction','strike','recoil','erase','streakBeat','glanceTime','warmEcho','frostEcho','windEcho','pressureDip'])this[name]=Math.max(0,this[name]-fxdt);
  if(this.model.danger<70)this.pressureArmed=true;
  if(this.model.danger>=80&&this.pressureArmed){this.pressureArmed=false;if(this.settings.motion)this.pressureDip=.18;}
  const c=this.ctx;c.setTransform(this.ratio,0,0,this.ratio,0,0);c.clearRect(0,0,1200,900);
  const menu=this.model.phase==='menu';
  if(!menu)c.drawImage(this.roomLayer(),0,0);
  this.drawRoomMotion(c,menu);
  c.drawImage(this.desk,0,792,1200,114);
  if(menu){this.drawMenuScene(c);for(const[i,p]of POWERS.entries())if(this.assets[p])c.drawImage(this.assets[p],115+i*95,756,78,101);}
  else{
   this.drawCharacter(c,600,864,340);this.drawPile(c);this.drawMachinePaper(c);
   this.updateEffects(c,fxdt);
   this.drawWords(c,interpolation);
   this.drawWordFloats(c);
   this.drawStreakSeal(c);
   this.drawCeremony(c);
  }
  if(menu)this.advanceTransient(fxdt);
  this.stats.frames++;if(now-this.fpsTime>=1000){this.stats.fps=Math.round(this.stats.frames*1000/(now-this.fpsTime));this.stats.frames=0;this.fpsTime=now;}
  this.stats.drawMs=performance.now()-begin;
 }
 drawMenuScene(c){
  this.drawCharacter(c,397,786,402);
  // Same three decorative words; IMAGINE is moved slightly left so its measured
  // scroll does not cover the character. These use the SAME painter as gameplay.
  const cards=[{text:'WONDER',x:351,y:371,phase:1,kind:'normal'},
   {text:'STORY',x:567,y:432,phase:2.5,kind:'normal'},
   {text:'IMAGINE',x:205,y:544,phase:4,kind:'normal'}];
  for(const w of cards){const t=this.settings.motion?this.time:0;this.drawCard(c,{...w,width:112,y:w.y+Math.sin(t*.55+w.phase)*7},1,false);}
  const g=c.createRadialGradient(398,753,2,398,753,210);g.addColorStop(0,'#d39b3a16');g.addColorStop(1,'#d39b3a00');c.fillStyle=g;c.fillRect(188,543,420,243);
 }
 drawRoomMotion(c,menu){
  const room=roomForChapter(menu?1:this.model.level),d=menu?0:this.model.danger;
  const direction=musicDirection('play',d,true),t=direction.tension,u=direction.urgency;
  this.lightDirection={tension:t,urgency:u};
  const frost=this.model.effects.ice>0?Math.min(1,this.model.effects.ice/.8):this.frostEcho/.7;
  const wind=this.windEcho,slow=this.model.effects.slow>0&&this.model.effects.ice<=0;
  for(const [i,x]of [228,987].entries()){
   const swing=this.settings.motion?Math.sin(this.worldTime*.8+i)*.016:0;
   const color=frost>0?'#b7e7f8':this.warmEcho>0?'#ffae65':d>=80?'#c3d5a1':d>=50?'#ecdfbd':room.lamp;
   const strength=.17+t*.075+Math.min(.2,this.warmEcho*.3);
   c.save();c.translate(x,141);c.rotate(swing+(wind>0?-.045*wind:0));
   const light=c.createRadialGradient(0,0,2,0,0,80);light.addColorStop(0,visRGBA(color,strength*(this.pressureDip>0?.55:1)));light.addColorStop(1,visRGBA(color,0));c.fillStyle=light;c.fillRect(-80,-80,160,160);
   // Small foreground brass shade and flame; rear painted library does not move.
   c.strokeStyle='#b18b5066';c.lineWidth=1.3;c.beginPath();c.moveTo(-14,-16);c.quadraticCurveTo(0,-23,14,-16);c.moveTo(-15,22);c.quadraticCurveTo(0,28,15,22);c.stroke();
   c.globalAlpha=.35+t*.08;c.fillStyle=color;c.beginPath();c.ellipse(wind>0?-7*wind:0,2,3,13,-.08-wind*.35,0,Math.PI*2);c.fill();c.restore();
   if(frost>0)this.frost(c,x-19,112,38,51,frost*.6,.7);
  }
  if(!menu){
   // Light falls onto the margins, never washes out live word text.
   for(const x of [220,930]){const g=c.createLinearGradient(x,0,x+55,0);g.addColorStop(0,visRGBA(room.lamp,.015+t*.045));g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(x,150,55,540);}
   if(frost>0)this.frost(c,228,163,742,499,frost*.5,1);
   const count=Math.min(34,room.dust+Math.floor(t*10));
   if(this.settings.motion){
    for(let i=0;i<count;i++){const m=this.motes[i],y=(m.y-this.worldTime*m.v%1000+1000)%1000-50,x=m.x+Math.sin(this.worldTime*.18+m.phase)*8;
     // Keep the main text area especially quiet; dust hugs the shelf margins.
     if(x>284&&x<921&&y>150&&y<660)continue;
     c.globalAlpha=.08+Math.sin(this.worldTime*.7+m.phase)**2*.12;c.fillStyle=room.wash;c.beginPath();c.arc(x,y,m.s,0,Math.PI*2);c.fill();
    }c.globalAlpha=1;
   }
   if(slow||room.props.includes('pendulum')){
    const clock=slow?this.worldTime*.9:this.worldTime*1.8,angle=this.settings.motion?Math.sin(clock)*.28:0;
    c.save();c.translate(151,467);c.rotate(angle);c.strokeStyle='#d3b375b0';c.lineWidth=1.6;c.beginPath();c.moveTo(0,0);c.lineTo(0,89);c.stroke();const g=c.createRadialGradient(-3,88,1,0,94,13);g.addColorStop(0,'#e0c590');g.addColorStop(1,'#6e512a');c.fillStyle=g;c.beginPath();c.arc(0,94,12,0,Math.PI*2);c.fill();c.restore();
   }
   if(room.props.includes('brazier')){
    c.save();const g=c.createRadialGradient(132,552,2,132,552,58);g.addColorStop(0,'#e8a45c45');g.addColorStop(1,'#d27d3800');c.fillStyle=g;c.fillRect(73,493,118,118);
    for(let i=0;i<4;i++){const size=12+(this.settings.motion?Math.sin(this.worldTime*3+i)*3:0);c.fillStyle=i%2?'#efbd7855':'#d7874a80';c.beginPath();c.moveTo(109+i*13,564);c.quadraticCurveTo(119+i*13,562-size*2,126+i*13,564);c.fill();}c.restore();
   }
   if(room.props.includes('lantern')||room.props.includes('candle')){
    c.fillStyle='#c9b380';visRR(c,1063,471,17,69,3);c.fill();c.strokeStyle='#6b5235';c.stroke();const glow=c.createRadialGradient(1072,465,1,1072,465,45);glow.addColorStop(0,'#f6d09a50');glow.addColorStop(1,'#f6d09a00');c.fillStyle=glow;c.fillRect(1027,420,90,90);c.fillStyle='#edd8a0';c.beginPath();c.ellipse(1072,464,2.5,8,0,0,Math.PI*2);c.fill();
   }
   // Stage mastery is a shelf detail. No new HUD numeral or collectible currency.
   const completed=Math.max(0,Math.min(6,(this.model.level-1)%6));for(let i=0;i<6;i++)visStar(c,1015+i*20,406,i<completed?3:1.5,i<completed?'#ead395':'#665f4a',.65);
  }
  for(const f of this.bookFlashes){const p=visualClamp(f.t/f.life),pull=Math.sin(p*Math.PI)*6;c.save();c.translate(f.x+f.dir*pull,f.y);c.fillStyle=visRGBA(f.color,(1-p)*.46);visRR(c,-7,-30,14,60,2);c.fill();c.strokeStyle=visRGBA(f.color,(1-p)*.8);c.stroke();c.restore();}
 }
 drawCharacter(c,x,bottom,height){
  if(this.model.phase==='menu'){super.drawCharacter(c,x,bottom,height);return;}
  const pressure=pressureState(this.model.danger,this.model.phase);
  let desired=pressure.key;
  if(this.model.phase==='game-over')desired='defeated';
  else if(this.model.phase==='level-clear')desired='celebrate';
  else if(this.relief>0)desired='celebrate';
  else if(this.model.danger<50&&this.streakBeat>0)desired=this.milestone>=10?'celebrate':'focused';
  if(desired!==this.expressionKey){this.expressionFrom=this.expressionKey;this.expressionKey=desired;this.expressionBlend=this.settings.motion?0:1;}
  const im=this.assets['face-'+desired]||this.assets.typist,old=this.assets['face-'+this.expressionFrom]||im;if(!im)return;
  const scale=height/420,target=this.glanceTime>0?this.glance:presentationTarget(this.model.words,this.model.buffer);
  const look=target?visualClamp((target.x-600)/400,-1,1):0;
  const m=this.settings.motion&&this.model.phase!=='paused',tap=m?this.strike/.09:0,recoil=m?Math.sin(visualClamp(this.recoil/.12)*Math.PI)*2:0;
  const bob=m?Math.sin(this.worldTime*1.6)*.6:0;
  c.save();c.translate(x,bottom+recoil);c.scale(scale,scale);
  // Torso and machine remain stable while the head is articulated independently.
  c.drawImage(im,0,265,438,155,-219,-155,438,155);
  c.save();c.translate(m?look*2.6:0,-155+bob);c.rotate(m?(look*.007+this.windEcho*-.012):0);
  if(this.expressionBlend<1){c.globalAlpha=1-this.expressionBlend;c.drawImage(old,0,0,438,274,-219,-265,438,274);c.globalAlpha=this.expressionBlend;}
  c.drawImage(im,0,0,438,274,-219,-265,438,274);c.globalAlpha=1;c.restore();
  // Replace the motivational lettering in the supplied master with the game plate.
  const g=c.createLinearGradient(-68,-67,68,-11);g.addColorStop(0,'#2a251d');g.addColorStop(.5,'#171a17');g.addColorStop(1,'#302419');c.fillStyle=g;visRR(c,-69,-68,138,53,3);c.fill();
  c.fillStyle='#d8ba7a';c.font='bold 10px Georgia';c.textAlign='center';c.fillText('TYPEKEEPER',0,-46);c.fillStyle='#95805b';c.font='9px Georgia';c.fillText('◆',0,-28);
  c.restore();
  // Original painted hands, positioned on the extended carriage. Alternating taps
  // are 90 ms and never interfere with native input or the model's clock.
  const ly=790+(m&&this.hand===0?tap*2:0),ry=790+(m&&this.hand===1?tap*2:0);
  c.save();c.strokeStyle='#b7ac99';c.lineWidth=13;c.lineCap='round';c.beginPath();c.moveTo(486,774);c.quadraticCurveTo(450,796,397,800);c.moveTo(714,774);c.quadraticCurveTo(750,796,803,800);c.stroke();
  c.drawImage(im,66,302,51,28,369,ly,42,23);c.drawImage(im,321,302,51,28,789,ry,42,23);c.restore();
  if(this.model.danger>=50){
   const drops=this.model.danger>=90?3:this.model.danger>=75?2:1;
   for(let i=0;i<drops;i++){const k=m?(this.motionTime*.75+i*.27)%1:.45;c.save();c.globalAlpha=m?Math.sin(k*Math.PI)*.7:.65;c.fillStyle='#a9dee1';const dx=660+i*9,dy=676+k*26;c.beginPath();c.moveTo(dx,dy-5);c.quadraticCurveTo(dx+6,dy+8,dx,dy+8);c.quadraticCurveTo(dx-6,dy+8,dx,dy-5);c.fill();c.restore();}
  }
 }
 drawMachinePaper(c){
  const a=PAPER_ANCHOR,carriage=visualClamp(this.model.buffer.length,0,24)*.22,shift=this.settings.motion?-carriage:0;
  c.save();c.translate(shift,this.settings.motion?this.recoil*13:0);
  c.fillStyle='#0f1514';visRR(c,a.x-16,a.y+a.height-2,a.width+32,14,6);c.fill();c.strokeStyle='#a1804e';c.lineWidth=1.2;c.stroke();c.strokeStyle='#4c5952';c.beginPath();c.moveTo(a.x-7,a.y+a.height+1);c.lineTo(a.x+a.width+7,a.y+a.height+1);c.stroke();
  for(const x of [a.x-12,a.x+a.width+12]){c.fillStyle='#b59355';c.fillRect(x-2,a.y+a.height-3,4,16);c.fillStyle='#262321';c.fillRect(x-6,a.y+a.height+2,12,6);}
  if(this.settings.motion&&this.strike>0){const x=a.x+Math.min(a.width-20,20+this.model.buffer.length*7);visStar(c,x,a.y+a.height+3,4,'#ffe2a0',this.strike/.09);}
  if(this.settings.motion&&this.erase>0){c.strokeStyle=`rgba(227,211,166,${this.erase/.12*.8})`;for(let i=0;i<3;i++){c.beginPath();c.moveTo(a.x+22+i*5,a.y+a.height+3);c.lineTo(a.x+24+i*5,a.y+a.height-2);c.stroke();}}
  c.restore();
 }
 drawPile(c){
  const target=this.model.danger,descending=target<this.shownDanger;
  if(descending)this.shownDanger=target;else this.shownDanger+=(target-this.shownDanger)*.22;
  const d=visualClamp(this.shownDanger/100);if(d<.005)return;
  const count=Math.ceil(d*49),height=d*142,defeat=this.ceremony?.kind==='defeat'?this.ceremony.progress:0;
  c.save();c.shadowColor='#03090888';c.shadowBlur=3;
  for(let i=0;i<count;i++){
   const k=i/Math.max(1,count-1),x=806+Math.sin(i*9.2)*12-defeat*k*66,y=811-k*height;
   c.save();c.translate(x,y);c.rotate(Math.sin(i*2.31)*.045);const width=126+Math.sin(i*1.4)*16+defeat*20;
   c.fillStyle=i%3===0?'#b7a47e':i%3===1?'#d7c59c':'#e4d4ad';visRR(c,-width/2,-4,width,10,1);c.fill();c.shadowBlur=0;c.strokeStyle='#79694866';c.lineWidth=.7;c.beginPath();c.moveTo(-width/2+6,-1);c.lineTo(width/2-6,-1);c.stroke();c.restore();
  }
  // Actual missed text appears on the top sheet, not invented HUD statistics.
  const text=this.model.pile.at(-1)?.text||'',pt=this.pilePoint(this.shownDanger);
  c.save();c.translate(pt.x-defeat*66,pt.y-3);c.rotate(-.06);c.fillStyle='#ead9b1';visRR(c,-71,-13,142,26,1);c.fill();c.shadowBlur=0;c.fillStyle='#82704e';c.font='10px Georgia';c.textAlign='center';c.fillText(text,0,4);c.strokeStyle='#9c885c66';c.beginPath();c.moveTo(-56,8);c.lineTo(55,8);c.stroke();c.restore();c.restore();
 }
 drawStreakSeal(c){
  const n=this.model.streak;if(n<1)return;
  const level=Math.min(3,Math.floor(n/5)),beat=this.settings.motion&&this.streakBeat>0?Math.sin(this.streakBeat/.64*Math.PI)*.04:0;
  c.save();c.translate(380,815);c.scale(1+beat,1+beat);
  const g=c.createRadialGradient(-6,-6,1,0,0,22);g.addColorStop(0,level>=2?'#c59151':'#98563e');g.addColorStop(1,level>=2?'#644a2b':'#512d27');c.fillStyle=g;c.shadowColor='#0006';c.shadowBlur=3;
  c.beginPath();for(let i=0;i<30;i++){const a=i*Math.PI/15,r=21+(i%2?1.5:0);i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.shadowBlur=0;
  c.strokeStyle='#ecc98777';c.lineWidth=.85;c.beginPath();c.arc(0,0,16,0,Math.PI*2);c.stroke();
  c.fillStyle='#ecd7a4';c.font='20px Georgia';c.textAlign='center';c.fillText(level===0?'·':level===1?'I':level===2?'II':'III',0,7);c.restore();
 }
 drawWords(c,interpolation){
  const words=this.model.words.map(w=>({...w,y:w.previousY+(w.y-w.previousY)*interpolation}));
  const layouts=new Map(words.map(w=>[w.id,this.layout(w)]));
  const resolved=resolveVisualPositions(words,layouts,FIELD.left,FIELD.right);
  this.readability=[];const ids=new Set(words.map(w=>w.id));
  for(const id of this.poses.keys())if(!ids.has(id))this.poses.delete(id);
  const target=presentationTarget(this.model.words,this.model.buffer);
  // Selected card is painted last, but priority remains model y/id, not draw order.
  words.sort((a,b)=>(a.id===target?.id?1:0)-(b.id===target?.id?1:0));
  for(const w of words){
   const destination=resolved.get(w.id),s=this.spawns.get(w.id),l=layouts.get(w.id);
   let x=destination.x,y=w.y,scale=1,angle=0;
   if(s&&this.settings.motion){const p=visualClamp(s.t/s.life),t=visualEase(p);x=visLerp(s.from.x,destination.x,t);y=visLerp(s.from.y,w.y,t)-Math.sin(Math.PI*p)*10;scale=.82+.18*t+.018*Math.sin(p*Math.PI);angle=(1-p)*(s.from.x<600?-.13:.13);}
   if(this.settings.motion)angle+=Math.sin(this.worldTime*.6+(w.phase||0))*.008;
   const matching=!!this.model.buffer&&w.text.startsWith(this.model.buffer),selected=w.id===target?.id;
   this.poses.set(w.id,{x,y,width:l.width,height:l.height,scale,angle});
   if(this.guide.targetId===w.id&&!this.guide.word&&this.settings.hints){c.save();c.strokeStyle='#e6d19777';c.lineWidth=1;c.beginPath();c.ellipse(x,y,l.width/2+15,l.height/2+9,0,0,Math.PI*2);c.stroke();c.restore();}
   c.save();c.translate(x,y);c.rotate(angle+(selected&&this.settings.motion?-.012:0));c.scale(scale,scale);this.paintCard(c,w,l,{matching,selected});c.restore();
   this.readability.push({id:w.id,text:w.text,fontSize:l.fontSize,effectivePixels:l.fontSize*this.cssScale,width:l.width,height:l.height,lines:l.lines.map(x=>x.text),x,y});
  }
 }
 drawCard(c,w,alpha=1,live=false){ // compatibility for menu and classic audit calls
  const size=Math.max(29,Math.min(36,23.5/Math.max(.5,this.cssScale)));this.ctx.font=`700 ${size}px Georgia, serif`;const display={...w,width:Math.max(w.width,this.ctx.measureText(w.text).width+32)};
  const l=this.layout(display);c.save();c.translate(w.x,w.y);c.globalAlpha=alpha;this.paintCard(c,display,l,{matching:false,selected:false,live});c.restore();
 }
 paintCard(c,w,l,{matching=false,selected=false}={}){
  const tex=this.cardTexture(l.width,w.kind,l.height),h=l.height,width=l.width;
  c.drawImage(tex,-width/2-16,-h/2-16,width+32,h+32);
  if(matching){c.strokeStyle=selected?'#486d55':'#84937a';c.lineWidth=selected?1.6:1;c.strokeRect(-width/2+SCROLL.pageInset+3,-h/2+6,width-(SCROLL.pageInset+3)*2,h-12);}
  const dark=w.kind==='bonus',prefix=matching?this.model.buffer:'';
  c.font=`700 ${l.fontSize}px Georgia, serif`;c.textAlign='left';c.textBaseline='middle';
  // Hard rendering invariant: ONE complete string on ONE baseline. No loop over
  // rows, no letter slicing into lines. Even malformed cached layouts cannot
  // resurrect the removed multi-row renderer.
  const text=String(w.text),x=l.textX,baseline=0;
  c.fillStyle=dark?'#f0dfb6':'#3d3022';c.fillText(text,x,baseline,l.textMaxWidth);
  if(prefix){
   const pw=Math.min(l.textMaxWidth,c.measureText(text.slice(0,prefix.length)).width);
   c.save();c.beginPath();c.rect(x-1,-h/2,pw+1,h);c.clip();
   c.fillStyle=dark?'#e8fff0':'#163e34';c.fillText(text,x,baseline,l.textMaxWidth);c.restore();
   c.fillStyle=dark?'#b6d7be':'#547963';c.fillRect(x,l.fontSize*.49,pw,1.1);
  }
  const glint=this.keyGlints.get(w.id);
  if(glint&&matching&&this.settings.motion&&this.settings.typingShimmer!==false){
   const k=(this.motionTime-glint.at)/.18;
   if(k<1){const edge=x+Math.min(l.textMaxWidth,c.measureText(text.slice(0,prefix.length)).width);visStar(c,edge,l.fontSize*.5,glint.complete?5:3.5,'#698568',1-k);}else this.keyGlints.delete(w.id);
  }
  if(POWER_META[w.kind]){
   const g=scrollGeometry(width,h),x=-width/2+g.badgeX,y=-h/2+g.badgeY;
   if(this.assets[w.kind+'-icon'])c.drawImage(this.assets[w.kind+'-icon'],x-6.5,y-8.5,13,17);
  }
  if(dark){visStar(c,width/2-27,h/2-10,2.4,'#dbbd7a');}
  if(this.model.effects.ice>0){this.frost(c,-width/2+4,-h/2+2,width-8,h-4,.35,.25);}
 }
 drawWordFloats(c){
  for(const f of this.floaters){
   if(f.large)continue;const p=visualClamp(f.t/f.life),y=f.y-26-(this.settings.motion?p*28:0);
   // Never put a points label on another live card's text.
   if(this.readability.some(w=>Math.abs(w.x-f.x)<w.width/2+34&&Math.abs(w.y-y)<w.height/2+15))continue;
   c.save();c.globalAlpha=this.settings.motion?(1-p)*.95:.95;c.textAlign='center';c.font='bold 22px Georgia';c.fillStyle=f.color;c.shadowColor='#092420';c.shadowBlur=4;c.fillText(f.text,f.x,y);c.restore();
  }
 }
 deathTile(d){
  if(d.tile)return d.tile;const l=this.layout(d.word),im=visOff((l.width+32)*2,(l.height+32)*2),cx=im.getContext('2d');
  cx.scale(2,2);cx.translate((l.width+32)/2,(l.height+32)/2);this.paintCard(cx,d.word,l);d.tile=im;d.layout=l;return im;
 }
 drawDeath(c,d){
  const p=visualClamp(d.t/d.life),im=this.deathTile(d),l=d.layout,w=l.width,h=l.height;
  const draw=()=>c.drawImage(im,-w/2-16,-h/2-16,w+32,h+32);
  c.save();c.translate(d.word.x,d.word.y);
  if(d.kind==='normal'||d.kind==='bonus'){
   const split=3+d.seed%3,fall=Math.max(0,(p-.1)/.9);
   if(p<.16){draw();c.strokeStyle='#403c32';c.lineWidth=1.5;c.beginPath();c.moveTo(0,-17);c.lineTo(0,13);c.stroke();visStar(c,0,0,8,'#fef7da',1-p/.16);}
   else for(let i=0;i<split;i++){
    c.save();c.translate((i-(split-1)/2)*fall*18,fall*fall*96+(i%2)*fall*14);c.rotate((i-(split-1)/2)*fall*.2);c.globalAlpha=(1-fall)**.5;
    const x0=-w/2-16+(w+32)*i/split,x1=-w/2-16+(w+32)*(i+1)/split;
    c.beginPath();c.moveTo(x0,-h/2-16);c.lineTo(x1,-h/2-16);c.lineTo(x1-3,-2);c.lineTo(x1+3,h/2+16);c.lineTo(x0,h/2+16);c.lineTo(x0-3,2);c.closePath();c.clip();draw();c.restore();
   }
  }else if(d.kind==='fire'){
   const radius=p*(w*.73+h*.24),outer=Math.hypot(w,h);
   c.save();c.globalAlpha=Math.min(1,(1-p)*2);c.beginPath();c.rect(-w/2-16,-h/2-16,w+32,h+32);c.arc(0,0,Math.max(1,radius),0,Math.PI*2,true);c.clip('evenodd');draw();
   c.strokeStyle='#4b2b1b';c.lineWidth=9;c.beginPath();c.arc(0,0,radius+3,0,Math.PI*2);c.stroke();c.strokeStyle='#dc9a56';c.lineWidth=1.7;c.stroke();c.restore();
   for(let i=0;i<8;i++){const a=i*2.4+d.seed;c.globalAlpha=1-p;c.fillStyle=i%2?'#72533a':'#ae7a49';c.fillRect(Math.cos(a)*Math.min(radius,outer*.3)-p*32,Math.sin(a)*18-p*20,2,1.5);}
  }else if(d.kind==='ice'){
   if(p<.18){draw();this.frost(c,-w/2,-h/2,w,h,p/.18*.9,1);}
   else for(let i=0;i<5;i++){
    const q=(p-.18)/.82,x0=-w/2+(w*i/5),x1=-w/2+w*(i+1)/5;
    c.save();c.translate((i-2)*q*14,q*q*89);c.rotate((i-2)*q*.12);c.globalAlpha=1-q;
    c.beginPath();c.moveTo(x0,-h/2-9);c.lineTo(x1,-h/2-9);c.lineTo(x1+5,h/2+10);c.lineTo(x0-6,h/2+10);c.closePath();c.clip();draw();c.globalCompositeOperation='source-atop';c.fillStyle='#bdedf647';c.fillRect(-w/2-10,-h/2-10,w+20,h+20);c.restore();
   }
  }else if(d.kind==='slow'){
   c.globalAlpha=1-p;c.translate(0,p*30);c.scale(1-p*.05,Math.max(.04,1-p*.94));draw();
   c.fillStyle='#55432366';c.fillRect(-w/2+10,-h/2+10,w-20,h-20);
  }else if(d.kind==='wind'){
   c.translate(p*p*125,-Math.sin(p*Math.PI)*14);c.rotate(p*.28);c.scale(1-p*.4,1-p*.16);c.globalAlpha=1-p;draw();
  }
  c.restore();
 }
 updateEffects(c,dt){
  for(const d of this.deaths)this.drawDeath(c,d);
  for(const a of this.arrivals){
   const p=visualEase(a.t/a.life),l=this.layout(a.word),x=visLerp(a.word.x,a.target.x,p),y=visLerp(a.word.y,a.target.y,p),s=visLerp(1,.56,p);
   c.save();c.translate(x,y);c.rotate(-.04*p);c.scale(s,visLerp(1,.28,p));c.globalAlpha=1-p*.16;this.paintCard(c,a.word,l);c.restore();
  }
  for(const g of this.gleams){
   const p=visualClamp(g.t/g.life),w=g.word,l=this.layout(w);c.save();c.globalAlpha=(1-p)*.4;c.strokeStyle=POWER_META[w.kind]?.color||'#dec78e';c.lineWidth=1;c.beginPath();c.moveTo(w.x-l.width/2,w.y-l.height/2);c.lineTo(w.x+l.width/2,w.y-l.height/2);c.stroke();c.restore();
  }
  for(const p of this.particles){
   const age=visualClamp(p.t/p.life);c.save();c.globalAlpha=(1-age)**1.5;c.translate(p.x,p.y);c.rotate(p.angle);c.fillStyle=p.color;
   if(p.kind==='paper')c.fillRect(-p.size,-p.size*.4,p.size*2,p.size*.8);
   else if(p.kind==='ice'){c.strokeStyle=p.color;c.lineWidth=.8;c.strokeRect(-p.size/2,-p.size/2,p.size,p.size);}
   else {c.beginPath();c.arc(0,0,p.size*.5,0,Math.PI*2);c.fill();}c.restore();
  }
  for(const f of this.flights){const p=visualEase(f.t/f.life),to=BOOK_ANCHORS[f.power],x=visLerp(f.x,to.x,p),y=visLerp(f.y,to.y,p)-Math.sin(p*Math.PI)*60;
   if(this.assets[f.power]){c.save();c.translate(x,y);c.rotate((1-p)*-.18);c.drawImage(this.assets[f.power],-16,-23,32,43);c.restore();}
  }
  for(const s of this.spells)this.drawSpell(c,s);
  this.advanceTransient(dt);
 }
 advanceTransient(dt){
  for(const a of this.arrivals)a.t+=dt;
  for(const d of this.deaths)d.t+=dt;
  for(const f of this.floaters)f.t+=dt;
  for(const f of this.flights)f.t+=dt;
  for(const g of this.gleams)g.t+=dt;
  for(const b of this.bookFlashes)b.t+=dt;
  for(const s of this.spells)s.t+=dt;
  for(const b of this.inkMarks)b.t+=dt;
  for(const[id,s]of this.spawns){s.t+=this.model.effects.ice>0?0:dt;if(s.t>=s.life||!this.model.words.some(w=>w.id===id))this.spawns.delete(id);}
  for(const p of this.particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.kind==='ember'?-20:80)*dt;p.angle+=p.spin*dt;}
  this.deaths=this.deaths.filter(d=>d.t<d.life);this.arrivals=this.arrivals.filter(a=>a.t<a.life);this.floaters=this.floaters.filter(f=>f.t<f.life);this.flights=this.flights.filter(f=>f.t<f.life);this.gleams=this.gleams.filter(g=>g.t<g.life);this.bookFlashes=this.bookFlashes.filter(b=>b.t<b.life);this.spells=this.spells.filter(s=>s.t<s.life);this.inkMarks=this.inkMarks.filter(b=>b.t<b.life);this.particles=this.particles.filter(p=>p.t<p.life);
 }
 drawSpell(c,s){
  if(!this.settings.motion)return;const p=visualClamp(s.t/s.life),a=Math.sin(p*Math.PI);
  c.save();
  if(s.power==='fire'){
   const sweep=visualEase(p),y=686-sweep*520;
   c.globalAlpha=.12+.16*a;const warm=c.createRadialGradient(600,524,30,600,524,470);warm.addColorStop(0,'#ffca7240');warm.addColorStop(1,'#ff9a2a00');c.fillStyle=warm;c.fillRect(176,138,848,570);
   for(let band=0;band<3;band++){
    c.globalAlpha=(.5-band*.11)*a;c.strokeStyle=band===0?'#ffd08a':band===1?'#ff9f46':'#8a3b22';c.lineWidth=band===0?2.2:band===1?5.5:10;c.beginPath();
    for(let x=224;x<=976;x+=16){const yy=y+Math.sin(x*.052+p*11+band*.75)*(5+band*2)+(band-1)*3;x===224?c.moveTo(x,yy):c.lineTo(x,yy);}c.stroke();
   }
   for(let i=0;i<16;i++){const q=(i/15),px=250+q*700,py=y-8-Math.sin(q*10+p*13)*16;c.globalAlpha=(1-q*.35)*a*.65;c.fillStyle=i%3===0?'#ffe3a2':i%2?'#ff9d4e':'#813620';c.beginPath();c.arc(px,py,1.5+((i%4)*.6),0,Math.PI*2);c.fill();}
  }else if(s.power==='wind'){
   c.globalAlpha=.28*a;c.strokeStyle='#efe7fb';c.lineWidth=1.6;
   for(let i=0;i<6;i++){const y=622+i*24,lead=1120-p*165+i*8;c.beginPath();c.moveTo(lead,y);c.bezierCurveTo(924,y-44,612,y+16,358,y-10);c.bezierCurveTo(280,y-18,205,y-25,126-p*38,y-34);c.stroke();}
   for(let i=0;i<10;i++){const q=i/10;c.globalAlpha=.22*a*(1-q*.5);c.fillStyle='#f1e6fb';c.fillRect(910-p*470-q*170,604+i*8,7,1.4);}
  }else if(s.power==='ice'){
   const alpha=(1-p)*.52;this.frost(c,216,156,768,512,alpha,1.05);
   c.globalAlpha=.18*a;c.fillStyle='#dff7ff';for(let i=0;i<10;i++){const x=268+i*70,y=194+(i%4)*92;c.beginPath();c.arc(x,y,2+(i%3),0,Math.PI*2);c.fill();}
   c.globalAlpha=.22*a;c.strokeStyle='#eafcff';c.lineWidth=1.1;c.strokeRect(224,163,752,498);
  }else if(s.power==='slow'){
   c.globalAlpha=(1-p)*.22;const amber=c.createRadialGradient(150,560,8,150,560,58);amber.addColorStop(0,'#f3d69eaa');amber.addColorStop(1,'#d4ab5500');c.fillStyle=amber;c.fillRect(88,496,126,126);
   for(let r=0;r<3;r++){c.globalAlpha=(.26-r*.05)*(1-p);c.strokeStyle=r===0?'#f2d08c':'#a57c36';c.lineWidth=1.4+r*.6;c.beginPath();c.ellipse(151,560,18+p*12+r*7,20+p*12+r*7,0,0,Math.PI*2);c.stroke();}
   c.globalAlpha=(1-p)*.15;c.fillStyle='#d6b77d';c.fillRect(226,154,744,506);
  }
  c.restore();
 }
 drawCeremony(c){
  const cue=this.ceremony;if(!cue)return;const p=visualClamp(cue.progress);
  if(cue.kind==='defeat'){
   const dim=smoothBand(p,.1,.85);c.save();
   const shade=c.createRadialGradient(596,671,50,596,671,650);shade.addColorStop(0,`rgba(2,10,9,${dim*.12})`);shade.addColorStop(.65,`rgba(2,10,9,${dim*.68})`);shade.addColorStop(1,`rgba(2,10,9,${dim*.8})`);c.fillStyle=shade;c.fillRect(0,0,1200,900);
   const one=c.createRadialGradient(228,141,2,228,141,83);one.addColorStop(0,visRGBA('#d4b775',.1*dim));one.addColorStop(1,'#d4b77500');c.fillStyle=one;c.fillRect(144,57,168,168);
   c.strokeStyle=visRGBA('#302719',.48*dim);c.lineWidth=1.7;for(let i=0;i<4;i++){c.beginPath();c.moveTo(447+i*78,753);c.lineTo(456+i*78,767);c.lineTo(449+i*78,779);c.stroke();}c.restore();
  }else{
   const fly=smoothBand(p,.2,.86),x=visLerp(600,1066,fly),y=visLerp(452,307,fly)-Math.sin(fly*Math.PI)*62,scale=visLerp(1,.28,fly),close=smoothBand(p,0,.28);
   c.save();c.translate(x,y);c.rotate(fly*-.13);c.scale(scale,scale);c.globalAlpha=p>.92?1-(p-.92)/.08:1;
   c.shadowColor='#08171090';c.shadowBlur=14;c.fillStyle='#183d31';visRR(c,-56,-58,112,123,4);c.fill();c.shadowBlur=0;c.strokeStyle='#c6a96a';c.lineWidth=2;c.stroke();c.fillStyle='#e5d3a6';c.fillRect(-49,-53,Math.max(5,94*(1-close)),109);c.fillStyle='#294f3c';c.fillRect(-50,-54,100*close,113);c.strokeStyle='#c8ad7133';c.strokeRect(-43,-46,85,97);c.fillStyle='#d9c187';c.font='29px Georgia';c.textAlign='center';c.fillText(String(cue.level||this.model.level).padStart(2,'0'),0,10);c.restore();
   if(p>.67)visStar(c,1065,274,6,'#f3d797',Math.sin((p-.67)/.33*Math.PI));
  }
 }
 visualSnapshot(){return {room:roomForChapter(this.model.level).name,roomCache:this.sceneCache.size,layouts:this.cardLayouts.size,spawns:this.spawns.size,deaths:this.deaths.length,arrivals:this.arrivals.length,particles:this.particles.length,textureBytes:this.textureBytes,light:this.lightDirection,readability:this.readability,guide:{...this.guide},ceremony:this.ceremony?{...this.ceremony}:null,worldTime:this.worldTime,strike:this.strike,hand:this.hand};}
}
