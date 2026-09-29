/** Original procedural FIRE / ICE artwork, not recovered frames from a video.
 * Surfaces are cached, particles bounded, and every animation is presentation-only.
 */
export const ELEMENTAL_LIMITS=Object.freeze({cacheBytes:12*1024*1024,cacheEntries:48,fireDuration:.65,iceDuration:6,thawDuration:.7});
const eaClamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const eaSmooth=(v)=>{const t=eaClamp(v);return t*t*(3-2*t);};
const eaColor=(hex,a)=>`rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${eaClamp(a)})`;
function eaCanvas(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c;}
function eaRand(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function eaPath(c,points){c.beginPath();for(let i=0;i<points.length;i++){const [x,y]=points[i];i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();}
function eaGlow(c,x,y,r,color,alpha){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,eaColor(color,alpha));g.addColorStop(1,eaColor(color,0));c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
export function elementalEnvelope(t,life=.65){
 const p=eaClamp(life>0?t/life:1);
 return Object.freeze({progress:p,attack:eaSmooth(p/.17),body:Math.sin(Math.PI*p)**.65,release:1-eaSmooth((p-.62)/.38)});
}
export function frozenArtStrength(remaining,age=1,thaw=0,motion=true){
 if(remaining>0)return motion?Math.max(.3,eaClamp(age/.28))*(.82+.18*eaClamp(remaining/.6)):.85;
 return motion?eaClamp(thaw/ELEMENTAL_LIMITS.thawDuration):0;
}
function eaShard(c,x,y,w,h,angle=0,alpha=1){
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);
 const pts=[[0,-h],[-w*.48,-h*.58],[-w*.34,0],[w*.28,h*.06],[w*.48,-h*.54]];
 const g=c.createLinearGradient(-w*.5,-h,w*.5,0);g.addColorStop(0,'#ebffff');g.addColorStop(.3,'#b1e5f5d0');g.addColorStop(.56,'#558faab8');g.addColorStop(.8,'#a6d7ebb0');g.addColorStop(1,'#28566e88');c.fillStyle=g;eaPath(c,pts);c.fill();c.strokeStyle='#e6ffffaa';c.lineWidth=.8;c.stroke();
 c.fillStyle='#e9ffff60';eaPath(c,[[0,-h],[-w*.48,-h*.58],[0,-h*.53],[w*.28,h*.06]]);c.fill();c.strokeStyle='#ebffffb5';c.lineWidth=.7;c.beginPath();c.moveTo(0,-h);c.lineTo(0,-h*.53);c.lineTo(w*.28,h*.06);c.stroke();c.restore();
}
function eaBranch(c,x,y,length,angle,depth=2){
 c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(0,0);c.lineTo(length,0);c.stroke();
 if(depth>0){for(const f of [.36,.64,.83]){const len=length*(1-f)*.66;eaBranch(c,length*f,0,len,-.68,depth-1);eaBranch(c,length*f,0,len,.68,depth-1);}}c.restore();
}
export class ElementalArt {
 constructor(){this.cache=new Map();this.bytes=0;}
 retain(key,make){
  if(this.cache.has(key)){const item=this.cache.get(key);this.cache.delete(key);this.cache.set(key,item);return item;}
  const im=make();this.cache.set(key,im);this.bytes+=im.width*im.height*4;
  while(this.cache.size>ELEMENTAL_LIMITS.cacheEntries||this.bytes>ELEMENTAL_LIMITS.cacheBytes){const k=this.cache.keys().next().value,o=this.cache.get(k);this.bytes-=o.width*o.height*4;this.cache.delete(k);}
  return im;
 }
 flameTexture(variant=0){return this.retain(`flame/${variant%4}`,()=>{
  const im=eaCanvas(112,176),c=im.getContext('2d'),v=variant%4;
  eaGlow(c,56,125,49,'#ef6614',.20);
  const tongue=(scale,stops,alpha)=>{
   c.save();c.translate(48,164);c.scale(scale,scale);c.globalAlpha=alpha;
   const g=c.createLinearGradient(0,-151,0,0);for(const[at,color]of stops)g.addColorStop(at,color);c.fillStyle=g;
   c.beginPath();c.moveTo(-23,0);c.bezierCurveTo(-48,-35,-9,-63,-26,-101);c.bezierCurveTo(-8,-94,1,-71,0,-62);c.bezierCurveTo(18,-91,19,-124,9-v*4,-151);c.bezierCurveTo(48,-117,27,-77,32,-55);c.bezierCurveTo(46,-75,46,-75,48,-91);c.bezierCurveTo(64,-40,36,-3,18,0);c.closePath();c.fill();c.restore();
  };
  tongue(1,[[0,'#ec572020'],[.23,'#e86318b0'],[.57,'#ef721bf0'],[.88,'#ffb744'],[1,'#db7f2320']],.94);
  tongue(.74,[[0,'#ffc74a80'],[.25,'#ffad28dd'],[.68,'#ffcc64'],[1,'#ffcd6620']],.99);
  tongue(.43,[[0,'#ffe3a088'],[.5,'#fff0b2'],[.86,'#fff5cc'],[1,'#ffdb8620']],.97);
  return im;
 });}
 frozenRoomTexture(){return this.retain('frozen-room',()=>{
  const im=eaCanvas(1200,790),c=im.getContext('2d'),r=eaRand(63091);
  // All opaque ice lives OUTSIDE the word corridor (x=226..978).
  for(const [x,dir]of [[218,-1],[984,1]]){
   const g=c.createLinearGradient(x-dir*3,0,x+dir*56,0);g.addColorStop(0,'#c1ecfa24');g.addColorStop(.2,'#579fb827');g.addColorStop(1,'#2e6e9900');c.fillStyle=g;c.fillRect(Math.min(x-dir*3,x+dir*56),168,59,501);
   for(let i=0;i<11;i++){const y=183+i*45+r()*16,w=6+r()*13,h=14+r()*39;eaShard(c,x+dir*(4+r()*20),y,w,h,dir*(-.05+r()*.62),.45+r()*.25);}
   c.strokeStyle='#c9e7fa99';c.lineWidth=.72;for(let i=0;i<17;i++)eaBranch(c,x,177+i*28,15+r()*24,dir<0?Math.PI:0,2);
  }
  for(const [x,dir]of [[238,1],[962,-1]]){
   eaGlow(c,x,169,48,'#9bd9f1',.16);for(let i=0;i<6;i++)eaShard(c,x+dir*i*11,165+i*.4,8,18+(6-i)*4,-dir*(.3+i*.09),.58);
   c.strokeStyle='#bde4f182';c.lineWidth=.8;eaBranch(c,x,156,72,dir<0?Math.PI:0,2);
  }
  // Ice on brass lamp shades makes the freeze legible in peripheral vision.
  for(const x of [228,987]){
   const g=c.createLinearGradient(0,112,0,171);g.addColorStop(0,'#e0fcff70');g.addColorStop(1,'#86cae921');c.fillStyle=g;c.beginPath();c.moveTo(x-20,117);c.lineTo(x+17,114);c.lineTo(x+19,158);c.lineTo(x-16,161);c.closePath();c.fill();for(let i=0;i<5;i++)eaShard(c,x-16+i*8,167,3,8+(i%3)*3,Math.PI,.65);
  }
  // Short frozen shelf lip rather than an opaque blue rectangle over the board.
  for(const [x,w]of [[63,130],[1007,128]]){c.fillStyle='#cff0fa4d';c.fillRect(x,390,w,3);for(let i=0;i<9;i++)eaShard(c,x+8+i*13,396,3.5,5+(i%4)*3,Math.PI,.72);}
  return im;
 });}
 cardFrostTexture(width,height=60){return this.retain(`card-frost/${Math.ceil(width)}/${height}`,()=>{
  const im=eaCanvas((width+32)*2,(height+32)*2),c=im.getContext('2d');c.scale(2,2);c.translate(16,16);const r=eaRand(Math.ceil(width)*3137);
  // Silk top/bottom and rods only; the entire ±22px central ink band is untouched.
  c.strokeStyle='#e5fbff';c.lineWidth=.9;
  for(const y of [5,height-5]){
   c.beginPath();c.moveTo(18,y);for(let x=22;x<width-18;x+=5)c.lineTo(x,y+(r()-.5)*1.8);c.stroke();
   for(let x=24;x<width-22;x+=15){const len=1+r()*.8;c.strokeStyle='#efffff';c.beginPath();c.moveTo(x,y);c.lineTo(x+2,y+(y<height/2?len:-len));c.lineTo(x+4,y);c.stroke();}
  }
  for(const x of [10,width-10]){c.fillStyle='#c4e7f17a';c.fillRect(x-3,6,6,height-12);c.strokeStyle='#e5fcffc9';c.lineWidth=.8;c.beginPath();c.moveTo(x-3,5);c.lineTo(x+3,height-4);c.stroke();}
  return im;
 });}
 drawFrozenRoom(c,remaining,age,thaw,motion){
  const strength=frozenArtStrength(remaining,age,thaw,motion);if(strength<=0)return;
  c.save();c.globalAlpha*=strength;
  const im=this.frozenRoomTexture();
  if(remaining<=0&&motion){const p=eaClamp(1-thaw/.7);c.globalAlpha*=1-p*.35;c.beginPath();c.rect(0,110+p*540,1200,680);c.clip();c.translate(0,p*p*25);}
  c.drawImage(im,0,0);c.restore();
 }
 drawFrozenCard(c,l,strength=.9){
  c.save();c.globalAlpha*=eaClamp(strength);c.drawImage(this.cardFrostTexture(l.width,l.height),-l.width/2-16,-l.height/2-16,l.width+32,l.height+32);c.restore();
 }
 drawFireCast(c,spell){
  const env=elementalEnvelope(spell.t,spell.life),p=env.progress;if(p<=0||p>=1)return;
  const targets=Array.isArray(spell.targets)?spell.targets.slice(0,12):[];
  c.save();
  // A short, warm ignition at the FIRE book, not a wall swept over the board.
  const source={x:146,y:740};eaGlow(c,source.x,source.y,51,'#ffb367',env.body*.24);
  for(let i=0;i<targets.length;i++){
   const t=targets[i];if(!Number.isFinite(t.x)||!Number.isFinite(t.y))continue;
   const reach=eaSmooth(p/.28),x=source.x+(t.x-source.x)*reach,y=source.y+(t.y-source.y)*reach-Math.sin(reach*Math.PI)*42;
   // Fine ember filaments connect caster and object. They fade before arrivals resume.
   c.globalAlpha=env.body*(1-eaSmooth((p-.24)/.39))*.34;c.strokeStyle='#dda365';c.lineWidth=1.05;
   c.beginPath();c.moveTo(source.x,source.y);c.quadraticCurveTo(source.x+(x-source.x)*.36,y+62,x,y);c.stroke();
   eaGlow(c,t.x,t.y+18,Math.min(90,Math.max(45,(t.width||130)*.28)),'#ed9138',env.body*.12);
   for(let j=0;j<3;j++){
    const q=eaClamp(reach-j*.06),xx=source.x+(t.x-source.x)*q,yy=source.y+(t.y-source.y)*q-Math.sin(q*Math.PI)*42;
    c.globalAlpha=env.body*(1-p)*(.65-j*.14);c.fillStyle=j?'#eda864':'#ffe5b3';c.beginPath();c.ellipse(xx,yy,1.1,2.4,-.45,0,Math.PI*2);c.fill();
   }
  }
  c.restore();
 }
 drawIceCast(c,spell){
  const env=elementalEnvelope(spell.t,spell.life),p=env.progress;if(p<=0||p>=1)return;
  c.save();c.globalAlpha=env.body*.72;
  // Freeze arrives through the architectural corners, then settles for the 6s effect.
  for(const [x,dir]of [[212,-1],[990,1]]){
   for(let i=0;i<7;i++){const y=210+i*68,reach=eaSmooth((p-i*.025)/.44);eaShard(c,x+dir*(i%2?5:11),y,10+reach*6,16+reach*(23+i%3*9),dir*.2,reach*.7);}
   eaGlow(c,x,368,55,'#a6e9ff',env.body*.12);
  }
  c.strokeStyle='#dffaff';c.lineWidth=1;for(const [x,dir]of [[237,1],[963,-1]]){c.beginPath();c.moveTo(x,158);c.lineTo(x+dir*113*p,158+Math.sin(p*Math.PI)*2);c.stroke();}
  c.restore();
 }
 drawBurn(c,d,im,l){
  const p=eaClamp(d.t/d.life),w=l.width,h=l.height,draw=()=>c.drawImage(im,-w/2-16,-h/2-16,w+32,h+32);
  const y=h/2+13-p*(h+37),points=[];
  // Irregular advancing char line consumes the page from the bottom up.
  for(let i=0;i<=30;i++){const x=-w/2-16+(w+32)*i/30;points.push([x,y+Math.sin(i*2.83+d.seed)*3+Math.sin(i*.53)*4]);}
  c.save();
  eaGlow(c,0,y,Math.min(84,w*.35),'#eea24c',Math.sin(p*Math.PI)*.13);
  c.globalAlpha=Math.min(1,(1-p)*3);
  c.save();c.beginPath();c.moveTo(-w/2-16,-h/2-16);c.lineTo(w/2+16,-h/2-16);for(let i=points.length-1;i>=0;i--)c.lineTo(...points[i]);c.closePath();c.clip();draw();c.restore();
  if(p>.06&&p<.92){
   c.save();c.beginPath();c.rect(-w/2-15,-h/2-9,w+30,h+18);c.clip();c.strokeStyle='#2d2019';c.lineWidth=6;c.beginPath();points.forEach(([x,yy],i)=>i?c.lineTo(x,yy):c.moveTo(x,yy));c.stroke();c.strokeStyle='#a35e2d';c.lineWidth=3;c.stroke();
   c.strokeStyle='#ffd497';c.lineWidth=1.05;c.stroke();
   // Curl highlights cling to the ragged boundary, rather than to the whole card.
   c.strokeStyle='#ead0a39c';c.lineWidth=.65;for(let i=2;i<points.length-2;i+=4){const [xx,yy]=points[i];c.beginPath();c.moveTo(xx-3,yy-2);c.quadraticCurveTo(xx,yy-6,xx+6,yy-3);c.stroke();}c.restore();
  }
  const flames=Math.max(3,Math.min(7,Math.ceil(w/51)));
  for(let i=0;i<flames;i++){const x=-w*.42+(w*.84)*i/(flames-1),fh=16+Math.sin(p*14+i*2)*6;c.globalAlpha=Math.sin(p*Math.PI)*.58;c.drawImage(this.flameTexture(i),x-9,y-fh,18,fh+8);}
  for(let i=0;i<12;i++){const a=i*2.39,drift=p*p;c.globalAlpha=(1-p)*.67;c.fillStyle=i%3===0?'#ffd27c':i%2?'#3d3129':'#ad7342';c.save();c.translate(Math.cos(a)*w*.4-drift*37,y-p*28+Math.sin(a)*9);c.rotate(a+p*.8);c.fillRect(-1.5,-1,3+(i%2),1.7);c.restore();}c.restore();
 }
 drawShatter(c,d,im,l){
  const p=eaClamp(d.t/d.life),w=l.width,h=l.height,draw=()=>c.drawImage(im,-w/2-16,-h/2-16,w+32,h+32);
  c.save();
  if(p<.16){draw();this.drawFrozenCard(c,l,1);c.strokeStyle='#c7efffaa';c.lineWidth=.8;c.beginPath();c.moveTo(-w*.25,-23);c.lineTo(-w*.05,-3);c.lineTo(w*.12,2);c.lineTo(w*.25,20);c.stroke();}
  else{
   const q=(p-.16)/.84;
   for(let i=0;i<6;i++){
    const x0=-w/2-12+(w+24)*i/6,x1=-w/2-12+(w+24)*(i+1)/6,dx=(i-2.5)*q*8,dy=q*q*(75+(i%2)*23);
    c.save();c.translate(dx,dy);c.rotate((i-2.5)*q*.1);c.globalAlpha=(1-q)**.7;
    eaPath(c,[[x0,-h/2-9],[x1,-h/2-9],[x1-4,-3],[x1+3,h/2+9],[x0-2,h/2+9],[x0+4,2]]);c.clip();draw();
    // Frost is drawn inside each fragment, not as source-atop over the entire scene.
    c.fillStyle='#d6f8ff35';c.fillRect(x0-5,-h/2-9,x1-x0+13,h+18);c.strokeStyle='#e6ffffe8';c.lineWidth=1;eaPath(c,[[x0,-h/2-9],[x1,-h/2-9],[x1-4,-3],[x1+3,h/2+9]]);c.stroke();c.restore();
   }
   for(let i=0;i<5;i++)eaShard(c,(i-2)*15+Math.sin(i)*q*20,q*q*98+10,3.5,8+(i%3)*5,(i-2)*q*.8,(1-q)*.55);
  }
  c.restore();
 }
 snapshot(){return {entries:this.cache.size,bytes:this.bytes,limit:ELEMENTAL_LIMITS.cacheBytes};}
}
