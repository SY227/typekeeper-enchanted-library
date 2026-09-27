import { asset } from '../game/assets.js';
import { pressureState } from '../game/pressure.js';
import { WIDTH, HEIGHT, FIELD, POWER_META, POWERS, RULES, mulberry32 } from '../game/rules.js';

const GOLD='#d4aa5d';
const targets={fire:{x:146,y:768},ice:{x:278,y:768},slow:{x:922,y:768},wind:{x:1054,y:768}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=(t)=>1-Math.pow(1-clamp(t,0,1),3);
function rr(c,x,y,w,h,r=6){c.beginPath();c.roundRect(x,y,w,h,r);}
function offscreen(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}

/** Retained texture caches + one native 2D canvas, at bounded physical resolution.
 * This renderer deliberately has no authority over the deterministic model.
 */
export class ClassicRenderer {
  constructor(canvas, model, settings) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});if(!this.ctx)throw new Error('Canvas 2D is unavailable.');
    this.model=model;this.settings=settings;this.assets={};this.textures=new Map();this.textureBytes=0;this.textureBudget=32*1024*1024;this.particles=[];this.floaters=[];this.flights=[];this.spells=[];this.gleams=[];this.keyGlints=new Map();
    this.time=0;this.lastTime=0;this.typing=0;this.reaction=0;this.ratio=1;this.menuBlend=1;this.particleCap=180;
    this.expressionKey='calm';this.expressionFrom='calm';this.expressionBlend=1;this.relief=0;this.stats={frames:0,fps:60,drawMs:0};this.fpsTime=0;
    const r=mulberry32(123123);
    this.motes=Array.from({length:34},()=>({x:r()*1200,y:r()*900,s:.5+r()*1.5,v:3+r()*8,phase:r()*7}));
    this.makeDesk();
  }
  async load() {
    const entries=[['typist','typist.webp'],...['calm','focused','worried','alarmed','critical','defeated','celebrate'].map(p=>['face-'+p,'typist-'+p+'.webp']),['paper','paper.webp'],...POWERS.flatMap(p=>[[p,`book-${p}.svg`],[`${p}-icon`,`icon-${p}.svg`]])];
    await Promise.all(entries.map(async([key,path])=>{
      const img=new Image();img.src=asset(`assets/${path}`);
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error(`Could not load ${path}. Serve the app over HTTP.`));});
      this.assets[key]=img;
    }));
  }
  resize(ratio){this.ratio=clamp(ratio,.65,2);this.canvas.width=Math.round(WIDTH*this.ratio);this.canvas.height=Math.round(HEIGHT*this.ratio);}
  setSettings(settings){this.settings=settings;if(!settings.motion){this.particles=[];this.gleams=[];this.keyGlints.clear();this.flights=[];}if(settings.typingShimmer===false){this.gleams=[];this.keyGlints.clear();}}
  reset(){this.particles=[];this.floaters=[];this.flights=[];this.spells=[];this.gleams=[];this.keyGlints=new Map();this.typing=0;this.reaction=0;this.relief=0;this.expressionKey="calm";this.expressionFrom="calm";this.expressionBlend=1;}
  makeDesk(){
    const im=offscreen(1200,114),c=im.getContext('2d');
    const g=c.createLinearGradient(0,0,0,114);g.addColorStop(0,'#70482c');g.addColorStop(.06,'#bc8650');g.addColorStop(.12,'#39271c');g.addColorStop(.45,'#493025');g.addColorStop(1,'#1a1613');
    c.fillStyle=g;c.fillRect(0,0,1200,114);
    const r=mulberry32(34);c.lineWidth=.55;
    for(let i=0;i<180;i++){c.strokeStyle=r()>.5?'#f1c48416':'#08030324';c.beginPath();const y=r()*114;c.moveTo(0,y);c.bezierCurveTo(400,y+r()*6,800,y-r()*6,1200,y);c.stroke();}
    c.fillStyle='#dfb76b';c.fillRect(0,4,1200,1);c.fillStyle='#a0753e';c.fillRect(0,11,1200,1);
    for(const x of [28,170,1030,1172]){c.fillStyle='#19130e';c.beginPath();c.arc(x,29,5,0,Math.PI*2);c.fill();c.fillStyle='#b18c52';c.beginPath();c.arc(x-1,28,3,0,Math.PI*2);c.fill();}
    this.desk=im;
  }
  cardTexture(width,kind){
    const key=`${width}:${kind}:${this.settings.contrast}`;
    if(this.textures.has(key)){const cached=this.textures.get(key);this.textures.delete(key);this.textures.set(key,cached);return cached;}
    const pad=16,h=60,s=2,im=offscreen((width+pad*2)*s,(h+pad*2)*s),c=im.getContext('2d');c.scale(s,s);c.translate(pad,pad);
    const dark=kind==='bonus',power=POWER_META[kind];
    const color=dark?'#b9b2c4':power?.color;
    const tint={fire:['#ffe1c7','#f4c3a8','#d59671'],ice:['#e3f6fa','#c3e8ed','#94bdc7'],slow:['#fff3bf','#f5e09b','#cbb569'],wind:['#eee5fc','#d4c6ed','#a397c3']}[kind];
    const path=new Path2D();path.moveTo(2,3);path.lineTo(width-17,1);path.lineTo(width-2,13);path.lineTo(width-1,54);path.lineTo(width-8,56);path.lineTo(width-28,55);path.lineTo(width-54,57);path.lineTo(4,56);path.lineTo(1,50);path.lineTo(2,23);path.closePath();
    c.shadowColor='#0009';c.shadowBlur=9;c.shadowOffsetY=5;c.fillStyle=dark?'#36333c':'#eee0b8';c.fill(path);c.shadowColor='transparent';
    const g=c.createLinearGradient(0,0,width,60);g.addColorStop(0,dark?'#48444e':this.settings.contrast?'#fffaf0':tint?.[0]||'#fff0cb');g.addColorStop(.55,dark?'#292931':this.settings.contrast?'#ffffff':tint?.[1]||'#f5e6bc');g.addColorStop(1,dark?'#3c3841':tint?.[2]||'#d7be88');c.fillStyle=g;c.fill(path);
    c.save();c.clip(path);c.globalAlpha=dark?.025:.18;if(this.assets.paper)c.drawImage(this.assets.paper,0,0,width,60);c.restore();
    c.strokeStyle=color||'#b4975c';c.lineWidth=power?2.4:1;c.stroke(path);
    c.strokeStyle=dark?'#b0a08b55':'#fffae49c';c.lineWidth=1;c.beginPath();c.moveTo(5,6);c.lineTo(width-20,4);c.stroke();
    c.beginPath();c.moveTo(width-17,1);c.lineTo(width-18,15);c.lineTo(width-2,13);c.closePath();c.fillStyle=dark?'#67606a':'#e1c590';c.fill();c.strokeStyle='#70593155';c.stroke();
    if(power){c.fillStyle=color;c.globalAlpha=.45;c.fillRect(7,9,3,40);c.globalAlpha=1;}
    this.textures.set(key,im);this.textureBytes+=im.width*im.height*4;
    while(this.textures.size>96||this.textureBytes>this.textureBudget){const oldest=this.textures.keys().next().value,old=this.textures.get(oldest);this.textureBytes-=old.width*old.height*4;this.textures.delete(oldest);}
    return im;
  }
  emitParticles(x,y,count,color,kind='spark'){
    if(!this.settings.motion)return;
    for(let i=0;i<count&&this.particles.length<this.particleCap;i++){
      const a=Math.random()*Math.PI*2,s=25+Math.random()*100;
      this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-35,life:.45+Math.random()*.7,t:0,color,size:1+Math.random()*3,angle:Math.random()*6,spin:(Math.random()-.5)*8,kind});
    }
  }
  handle(events){
    for(const e of events){
      if(e.type==='start'){this.reset();continue;}
      if(e.type==='input'&&e.changed&&!e.erased){
        this.typing=1;
        if(e.target&&this.settings.motion&&this.settings.typingShimmer!==false){
          this.keyGlints.set(e.target.id,{at:this.time,length:e.text.length,complete:e.complete});
          if(this.keyGlints.size>RULES.maxActive)this.keyGlints.delete(this.keyGlints.keys().next().value);
        }
      }
      if(e.type==='correct'){
        this.keyGlints.delete(e.word.id);
        if(this.settings.motion&&this.settings.typingShimmer!==false){
          this.gleams.push({word:{...e.word},t:0,life:.4,streak:e.streak});
          if(this.gleams.length>24)this.gleams.shift();
        }
        this.typing=1.3;const color=POWER_META[e.word.kind]?.color||'#f9dea0';
        this.emitParticles(e.word.x,e.word.y,12,color);
        this.floaters.push({x:e.word.x,y:e.word.y,text:`+${e.points}`,color,t:0,life:.85});
        this.floaters.push({x:e.word.x,y:e.word.y,word:e.word,t:0,life:.23});
        if(e.collected&&this.settings.motion)this.flights.push({power:e.word.kind,x:e.word.x,y:e.word.y,t:0,life:.54});
        if(e.streak>0&&e.streak%8===0)this.floaters.push({x:600,y:220,text:`${e.streak} WORD STREAK`,color:'#f6dc97',t:0,life:1.4,large:true});
      }
      if(e.type==='wrong'){this.reaction=.7;this.emitParticles(600,820,6,'#e87a62');}
      if(e.type==='miss'){this.reaction=.5;this.emitParticles(e.word.x,FIELD.bottom,7,'#d8c49b','paper');}
      if(e.type==='power'){
        if(e.power==='wind')this.relief=1.4;
        this.spells.push({power:e.power,t:0,life:e.power==='fire'?1.1:1.4});
        if(e.power==='fire')for(const w of e.removed)this.emitParticles(w.x,w.y,16,'#ffb46a','ember');
        if(e.power==='wind'){
          for(let i=0;i<38&&this.settings.motion&&this.particles.length<this.particleCap;i++)this.particles.push({x:170+Math.random()*850,y:670+Math.random()*94,vx:150+Math.random()*250,vy:-40-Math.random()*100,life:1.2+Math.random()*.6,t:0,color:'#f6e8bc',size:4+Math.random()*8,angle:Math.random()*7,spin:Math.random()*8,kind:'paper'});
        }
        if(e.power==='ice')this.emitParticles(600,360,35,'#a9edff','ice');
        if(e.power==='slow')this.emitParticles(600,430,26,'#ffe095');
      }
      if(e.type==='level-clear'){this.emitParticles(600,280,65,'#efd28d');}
    }
  }
  frame(now, interpolation=1){
    const begin=performance.now(),dt=this.lastTime?Math.min(.05,(now-this.lastTime)/1000):0;this.lastTime=now;this.time+=dt;
    this.expressionBlend=Math.min(1,this.expressionBlend+dt*5);this.relief=Math.max(0,this.relief-dt);this.typing=Math.max(0,this.typing-dt*6);this.reaction=Math.max(0,this.reaction-dt*3);
    const c=this.ctx;c.setTransform(this.ratio,0,0,this.ratio,0,0);c.clearRect(0,0,WIDTH,HEIGHT);
    const isMenu=this.model.phase==='menu';
    this.drawAtmosphere(c);
    if(isMenu){this.drawMenuScene(c);}else{
      this.drawPile(c);this.drawCharacter(c,600,829,307);this.drawWords(c,interpolation);
      this.drawTimedEffects(c);this.drawDeadline(c);
    }
    c.drawImage(this.desk,0,786,1200,114);
    if(isMenu){ // Foreground book grouping helps frame the real menu, never substitutes for its controls.
      for(const [i,p] of POWERS.entries()){const x=155+i*95;c.save();c.translate(x,816);c.rotate((i-1.5)*.025);if(this.assets[p])c.drawImage(this.assets[p],-43,-66,86,111);c.restore();}
    }
    this.updateEffects(c,dt);
    this.stats.frames++;if(now-this.fpsTime>=1000){this.stats.fps=Math.round(this.stats.frames*1000/(now-this.fpsTime));this.stats.frames=0;this.fpsTime=now;}
    this.stats.drawMs=performance.now()-begin;
  }
  star(c,x,y,size,color,alpha=1){
    c.save();c.globalAlpha=alpha;c.fillStyle=color;c.shadowColor=color;c.shadowBlur=size*1.8;
    c.beginPath();c.moveTo(x,y-size);c.quadraticCurveTo(x+size*.18,y-size*.18,x+size,y);
    c.quadraticCurveTo(x+size*.18,y+size*.18,x,y+size);c.quadraticCurveTo(x-size*.18,y+size*.18,x-size,y);
    c.quadraticCurveTo(x-size*.18,y-size*.18,x,y-size);c.fill();c.restore();
  }
  drawAtmosphere(c){
    if(!this.settings.motion)return;
    for(const m of this.motes){
      const y=(m.y-this.time*m.v%1000+1000)%1000-50,x=m.x+Math.sin(this.time*.22+m.phase)*18;
      c.globalAlpha=.08+(Math.sin(this.time+m.phase)+1)*.09;c.fillStyle='#f5dba0';c.beginPath();c.arc(x,y,m.s,0,Math.PI*2);c.fill();
    }
    c.globalAlpha=1;
    // The two lamp glows are small and localized; no full-screen bloom.
    for(const x of [228,987]){
      const g=c.createRadialGradient(x,139,5,x,139,57);g.addColorStop(0,`rgba(255,191,96,${.05+Math.sin(this.time*2.7+x)*.01})`);g.addColorStop(1,'rgba(255,171,72,0)');c.fillStyle=g;c.fillRect(x-57,82,114,114);
    }
  }
  drawMenuScene(c){
    this.drawCharacter(c,397,786,402);
    const cards=[{text:'WONDER',x:351,y:371,phase:1,kind:'normal'},{text:'STORY',x:567,y:432,phase:2.5,kind:'normal'},{text:'IMAGINE',x:236,y:544,phase:4,kind:'normal'}];
    for(const w of cards){const t=this.settings.motion?this.time:0;this.drawCard(c,{...w,width:w.text.length*17+36,y:w.y+Math.sin(t*.55+w.phase)*7},.84,false);}
    // Hero pool of warm light at the edge of the desk.
    const g=c.createRadialGradient(398,753,2,398,753,210);g.addColorStop(0,'#d39b3a16');g.addColorStop(1,'#d39b3a00');c.fillStyle=g;c.fillRect(188,543,420,243);
  }
  drawCharacter(c,x,bottom,height){
    const desired=this.model.phase==='menu'?'calm':this.model.phase==='game-over'?'defeated':this.relief>0?'celebrate':pressureState(this.model.danger,this.model.phase).key;
    if(desired!==this.expressionKey){this.expressionFrom=this.expressionKey;this.expressionKey=desired;this.expressionBlend=this.settings.motion?0:1;}
    const im=this.assets['face-'+this.expressionKey]||this.assets.typist;if(!im)return;const old=this.assets['face-'+this.expressionFrom]||im;const scale=height/420,width=438*scale;
    const motion=this.settings.motion;
    const stress=this.model.phase==='playing'?this.model.danger/100:0;
    const bob=motion?Math.sin(this.time*(1.8+stress*2))*(.9+stress*.8)-this.typing*1.6:0;
    const tilt=motion?Math.sin(this.time*1.15)*.003+Math.sin(this.time*70)*this.typing*.005:0;
    c.save();c.translate(x,bottom);c.scale(scale,scale);
    // A stable lower body and gently articulated head share one painted master.
    c.drawImage(im,0,264,438,156,-219,-156,438,156);
    c.save();c.translate(0,-156+bob);c.rotate(tilt+this.reaction*.006+(this.expressionKey==='defeated'?.045:0));
    if(this.expressionBlend<1){c.globalAlpha=1-this.expressionBlend;c.drawImage(old,0,0,438,274,-219,-264,438,274);c.globalAlpha=this.expressionBlend;}
    c.drawImage(im,0,0,438,274,-219,-264,438,274);c.globalAlpha=1;
    if(stress>=.5){for(let i=0;i<(stress>=.9?3:stress>=.75?2:1);i++){const k=motion?(this.time*.7+i*.35)%1:.45,dx=81+i*11,dy=-232+k*36;const g=c.createLinearGradient(dx,dy-6,dx+4,dy+6);g.addColorStop(0,'#d1fbffe0');g.addColorStop(1,'#59b3d5bb');c.fillStyle=g;c.globalAlpha=motion?Math.sin(k*Math.PI)*.9:.8;c.beginPath();c.moveTo(dx,dy-7);c.bezierCurveTo(dx-6,dy,dx-5,dy+7,dx,dy+7);c.bezierCurveTo(dx+5,dy+7,dx+6,dy,dx,dy-7);c.fill();c.globalAlpha=1;}}
    c.restore();
    // Original plate replaces the concept's baked motivational lettering.
    const g=c.createLinearGradient(-65,-65,65,-4);g.addColorStop(0,'#29231d');g.addColorStop(.5,'#171916');g.addColorStop(1,'#2d2318');c.fillStyle=g;rr(c,-68,-66,137,53,2);c.fill();
    c.fillStyle='#dfba77';c.font='bold 10px Georgia';c.textAlign='center';c.fillText('TYPEKEEPER',0,-43);c.font='9px Georgia';c.fillStyle='#baa176';c.fillText('◆',0,-28);
    // Live type on the paper follows the current input, with a moving carriage tick.
    if(this.model.phase!=='menu'){
      c.save();c.beginPath();c.rect(-86,-129,168,22);c.clip();c.fillStyle='#52402a';c.font='bold 10px Georgia';c.textAlign='left';
      c.fillText(this.model.buffer,-79,-116);c.fillStyle='#8c6635';c.fillRect(-80+Math.min(24,this.model.buffer.length)*6,-114,5,1);c.restore();
    }
    c.restore();
  }
  drawPile(c){
    const pile=this.model.pile;if(!pile.length)return;
    for(let i=0;i<pile.length;i++){
      const p=pile[i],y=746-Math.floor(i/8)*7,x=clamp(p.x,245,955);
      c.save();c.translate(x,y);c.rotate(p.angle);c.globalAlpha=.87;c.fillStyle=i%2?'#bdad89':'#d8c8a5';c.shadowColor='#0007';c.shadowBlur=2;rr(c,-40,-7,80,14,1);c.fill();c.shadowBlur=0;c.strokeStyle='#77684d66';c.lineWidth=.6;c.beginPath();c.moveTo(-32,-3);c.lineTo(23,-3);c.moveTo(-32,1);c.lineTo(31,1);c.stroke();c.restore();
    }
  }
  drawDeadline(c){
    c.save();const alpha=this.model.danger>=70?.3:.1;c.strokeStyle=`rgba(223,190,132,${alpha})`;c.setLineDash([1,8]);c.beginPath();c.moveTo(FIELD.left,FIELD.bottom+39);c.lineTo(FIELD.right,FIELD.bottom+39);c.stroke();c.restore();
  }
  drawWords(c,interpolation){
    // The authoritative word positions remain untouched; interpolation is presentation only.
    for(const w of this.model.words){const y=w.previousY+(w.y-w.previousY)*interpolation;this.drawCard(c,{...w,y},1,true);}
  }
  drawCard(c,w,alpha=1,live=true){
    const width=w.width,texture=this.cardTexture(width,w.kind);
    const matching=live&&this.model.buffer&&w.text.startsWith(this.model.buffer);
    const angle=this.settings.motion?Math.sin(this.time*.65+w.phase)*.013:0;
    c.save();c.translate(w.x,w.y);c.rotate(angle);c.globalAlpha=alpha;
    if(matching){c.shadowColor='#a8f2df';c.shadowBlur=12;c.strokeStyle='#a8f2df';c.lineWidth=2;rr(c,-width/2-2,-32,width+4,61,3);c.stroke();c.shadowBlur=0;}
    if(live&&w.y>565&&!matching){c.shadowColor='#e47348';c.shadowBlur=8;c.strokeStyle='#dc885d99';c.lineWidth=1;rr(c,-width/2-1,-31,width+2,61,3);c.stroke();c.shadowBlur=0;}
    c.drawImage(texture,-width/2-16,-30-16,width+32,92);
    const power=POWER_META[w.kind],isDark=w.kind==='bonus';
    const fontSize=w.text.length>15?22:w.text.length>12?24:27;
    c.font=`700 ${fontSize}px Georgia, serif`;c.textAlign='left';c.textBaseline='middle';
    const textWidth=c.measureText(w.text).width;const tx=-textWidth/2+(power?9:0);
    c.fillStyle=isDark?'#fff1d6':'#312b22';c.fillText(w.text,tx,0);
    if(matching){c.fillStyle=isDark?'#95e8d7':'#147764';c.fillText(this.model.buffer,tx,0);c.fillStyle='#21816b';c.fillRect(tx,19,c.measureText(this.model.buffer).width,1.4);}
    const glint=this.keyGlints.get(w.id);
    if(live&&matching&&glint&&this.settings.motion&&this.settings.typingShimmer!==false){
      const elapsed=this.time-glint.at,k=elapsed/.22;
      if(k<1){
        const typedWidth=c.measureText(this.model.buffer).width;
        const edge=tx+typedWidth;
        c.save();c.globalAlpha=(1-k)*.7;c.strokeStyle='#effff6';c.lineWidth=1.3;c.shadowColor='#93f9db';c.shadowBlur=8;
        c.beginPath();c.moveTo(tx,20);c.lineTo(edge,20);c.stroke();c.restore();
        this.star(c,edge,18-5*k,glint.complete?6.5:4.5,'#d6fff2',(1-k)*.9);
        if(glint.complete)this.star(c,width/2-9,-23,7,'#fff0b1',(1-k)*.8);
      }else this.keyGlints.delete(w.id);
    }
    if(power&&this.assets[`${w.kind}-icon`]){c.save();c.fillStyle={fire:'#aa502d',ice:'#276879',slow:'#856b25',wind:'#645082'}[w.kind];c.beginPath();c.arc(-width/2+23,0,12,0,Math.PI*2);c.fill();c.drawImage(this.assets[`${w.kind}-icon`],-width/2+14,-10,18,21);c.restore();}
    if(isDark){c.fillStyle='#d7b475';c.font='11px Georgia';c.textAlign='right';c.fillText('✦',width/2-9,18);}
    c.restore();
  }
  drawTimedEffects(c){
    if(this.model.effects.ice>0){
      const opacity=Math.min(1,this.model.effects.ice/1.2);c.save();c.globalAlpha=.55*opacity;
      c.strokeStyle='#98ddec';c.lineWidth=1.2;
      for(const side of [FIELD.left-12,FIELD.right+12]){
        for(let j=0;j<10;j++){const y=140+j*48,dir=side<600?1:-1;c.beginPath();c.moveTo(side,y-12);c.lineTo(side+dir*7,y);c.lineTo(side,y+23);c.moveTo(side+dir*7,y);c.lineTo(side+dir*19,y+9);c.stroke();}
      }
      c.globalAlpha=.035*opacity;c.fillStyle='#a0e8ff';c.fillRect(FIELD.left,110,FIELD.right-FIELD.left,560);c.restore();
    }
    if(this.model.effects.slow>0&&this.model.effects.ice<=0&&this.settings.motion){
      c.save();c.globalAlpha=.13;c.strokeStyle='#e6c655';c.lineWidth=1;
      for(let i=0;i<2;i++){c.beginPath();c.ellipse(600,409,315+i*12,252+i*13,this.time*.035,0,Math.PI*2);c.stroke();}c.restore();
    }
  }
  updateEffects(c,dt){
    for(const g of this.gleams){
      g.t+=dt;const p=clamp(g.t/g.life,0,1),w=g.word;
      c.save();c.translate(w.x,w.y);c.globalAlpha=(1-p)*.62;
      c.strokeStyle=POWER_META[w.kind]?.color||'#ffe4a1';c.lineWidth=1.8;c.shadowColor=c.strokeStyle;c.shadowBlur=13;
      rr(c,-w.width/2-3-p*7,-32-p*4,w.width+6+p*14,61+p*8,5);c.stroke();c.shadowBlur=0;
      // A narrow paper sheen, not a full-screen flash or obscuring bloom.
      c.save();rr(c,-w.width/2,-30,w.width,56,3);c.clip();
      const x=-w.width/2+(w.width+70)*p,shine=c.createLinearGradient(x-45,0,x+15,0);
      shine.addColorStop(0,'#ffebad00');shine.addColorStop(.64,'#fff5d1');shine.addColorStop(1,'#ffebad00');
      c.fillStyle=shine;c.fillRect(x-45,-30,60,56);c.restore();
      this.star(c,(p-.5)*w.width,-29,7*(1-p),'#fff6cd',1-p);c.restore();
      // Two fine credit sparks arc toward the score; the HUD updates immediately.
      for(let i=0;i<2;i++){
        const k=clamp(p-i*.075,0,1),x=w.x+(322-w.x)*k,y=w.y+(79-w.y)*k-Math.sin(k*Math.PI)*55;
        this.star(c,x,y,(i?2:3)*(1-k)+1,'#e9ce8c',Math.sin(k*Math.PI)*.65);
      }
    }
    this.gleams=this.gleams.filter(g=>g.t<g.life);
    for(const p of this.particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.kind==='ember'?-25:55)*dt;p.angle+=p.spin*dt;
      c.save();c.globalAlpha=Math.pow(Math.max(0,1-p.t/p.life),1.3);c.translate(p.x,p.y);c.rotate(p.angle);c.fillStyle=p.color;
      if(p.kind==='paper'){c.fillRect(-p.size,-p.size*.5,p.size*2,p.size);}
      else if(p.kind==='ice'){c.strokeStyle=p.color;c.lineWidth=1;c.beginPath();c.moveTo(-p.size*2,0);c.lineTo(p.size*2,0);c.moveTo(0,-p.size*2);c.lineTo(0,p.size*2);c.stroke();}
      else{c.beginPath();c.moveTo(0,-p.size*1.7);c.lineTo(p.size*.5,0);c.lineTo(0,p.size*1.7);c.lineTo(-p.size*.5,0);c.fill();}c.restore();
    }
    this.particles=this.particles.filter(p=>p.t<p.life);
    for(const f of this.floaters){f.t+=dt;const progress=f.t/f.life;
      // A celebration must never obscure a word the player is trying to read.
      if(f.large&&(this.spells.some(s=>s.t<s.life)||this.model.words.some(w=>Math.abs(w.x-f.x)<w.width/2+180&&Math.abs(w.y-(f.y-20-progress*43))<45)))continue;
      c.save();c.globalAlpha=Math.max(0,1-progress);
      if(f.word){c.translate(f.x,f.y);c.scale(1+progress*.1,1+progress*.1);c.rotate(progress*.06);this.drawCard(c,{...f.word,x:0,y:0},1-progress,false);}
      else{c.textAlign='center';c.font=`${f.large?'bold 26':'bold 27'}px Georgia`;c.fillStyle=f.color;c.shadowColor='#0b1c19';c.shadowBlur=5;c.fillText(f.text,f.x,f.y-20-progress*43);}c.restore();
    }this.floaters=this.floaters.filter(f=>f.t<f.life);
    for(const f of this.flights){f.t+=dt;const p=ease(f.t/f.life),target=targets[f.power],x=f.x+(target.x-f.x)*p,y=f.y+(target.y-f.y)*p-Math.sin(Math.PI*p)*100;
      c.save();c.translate(x,y);c.rotate((1-p)*-.3);c.globalAlpha=1;if(this.assets[f.power])c.drawImage(this.assets[f.power],-22,-30,44,57);c.restore();
    }this.flights=this.flights.filter(f=>f.t<f.life);
    for(const s of this.spells){s.t+=dt;this.drawSpell(c,s);}this.spells=this.spells.filter(s=>s.t<s.life);
  }
  drawSpell(c,s){
    const p=clamp(s.t/s.life,0,1),a=Math.sin(p*Math.PI);c.save();
    if(this.settings.motion){
      if(s.power==='fire'){
        const y=685-ease(p)*520;c.globalAlpha=a*.64;
        const grad=c.createLinearGradient(0,y,0,y+125);grad.addColorStop(0,'#ffdf98');grad.addColorStop(.3,'#e96726bb');grad.addColorStop(1,'#c6341100');
        c.fillStyle=grad;c.beginPath();c.moveTo(210,y+125);
        for(let x=210;x<=990;x+=20){c.quadraticCurveTo(x-4,y+Math.sin(x*.097+p*14)*16+40,x,y+Math.sin(x*.048+p*17)*28);}
        c.lineTo(990,y+125);c.closePath();c.fill();
      }
      if(s.power==='wind'){
        c.strokeStyle='#d0c4ff';c.lineWidth=2;c.globalAlpha=a*.6;
        for(let i=0;i<6;i++){const y=400+i*45;c.beginPath();c.moveTo(150+p*200,y+50);c.bezierCurveTo(410,y-80,700,y+90,1060,y-20-p*40);c.stroke();}
      }
      if(s.power==='ice'||s.power==='slow'){
        c.strokeStyle=POWER_META[s.power].color;c.globalAlpha=(1-p)*.6;c.lineWidth=2;
        c.beginPath();c.arc(600,395,45+p*280,0,Math.PI*2);c.stroke();
      }
    }
    // Concurrent casts keep their effects, but share one readable banner.
    // A queued SLOW must never be depicted as already slowing the board.
    if(this.spells.at(-1)===s){
      c.globalAlpha=a;c.textAlign='center';c.shadowColor='#091714';c.shadowBlur=15;c.fillStyle=POWER_META[s.power].color;c.font='bold 23px Georgia';
      c.fillText(POWER_META[s.power].name+(s.power==='slow'&&this.model.effects.ice>0?'  QUEUED':'  CAST'),600,204);
    }c.restore();
  }
}
