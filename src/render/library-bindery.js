/** Reading-room bindery: authored Canvas materials, not an interactive HUD.
 * All marks use a local deterministic stream. Painted into the existing bounded
 * scene cache; never animated, never fed by the gameplay random generator.
 */
export const BINDERY = Object.freeze({version:'1.0',shelfY:82,folioWidth:108,folioHeight:129});
const TAU=Math.PI*2;
function rand(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function path(c,pts){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function line(c,x,y,xx,yy){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
function grain(c,seed,count,x,y,w,h,light=false){
 const r=rand(seed);
 for(let i=0;i<count;i++){
  c.fillStyle=light?`rgba(239,210,161,${.025+r()*.075})`:`rgba(48,26,15,${.025+r()*.09})`;
  c.fillRect(x+r()*w,y+r()*h,.15+r()*.6,.2+r()*1.5);
 }
}
function gradient(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [t,color] of stops)g.addColorStop(t,color);return g;}
function shadow(c,x,y,rx,ry,alpha=.6){
 c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);
 g.addColorStop(0,`rgba(13,9,6,${alpha})`);g.addColorStop(.48,`rgba(13,9,6,${alpha*.6})`);g.addColorStop(1,'rgba(13,9,6,0)');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
}
function lectern(c){
 // Two visible wood supports and a foot physically meet the existing shelf.
 shadow(c,2,81,59,7,.7);
 c.fillStyle='#302018';path(c,[[21,4],[27,6],[42,79],[36,80]]);c.fill();
 c.fillStyle=gradient(c,-34,40,19,80,[[0,'#69472d'],[.45,'#463022'],[1,'#291d17']]);
 path(c,[[-32,26],[-24,27],[-30,78],[-37,79]]);c.fill();
 path(c,[[8,37],[16,36],[20,78],[13,79]]);c.fill();
 c.strokeStyle='#b285484a';c.lineWidth=.65;line(c,-31,29,-35,75);line(c,12,40,17,75);
 c.fillStyle=gradient(c,0,73,0,83,[[0,'#967044'],[.2,'#694729'],[.55,'#473121'],[1,'#211713']]);
 path(c,[[-45,75],[42,73],[49,77],[45,82],[-47,82],[-50,79]]);c.fill();
 c.strokeStyle='#c59e6155';c.lineWidth=.6;line(c,-44,76,41,74);
 c.strokeStyle='#21190f55';for(let i=0;i<5;i++)line(c,-38+i*11,79,6+i*8,78.5);
}
function pagePoint(side,u,v){
 const left=side<0;
 const a=left?[-46,-32]:[0,-23], b=left?[0,-23]:[45,-44];
 const d=left?[-44,44]:[0,58], e=left?[0,58]:[47,31];
 const tx=a[0]+(b[0]-a[0])*u,ty=a[1]+(b[1]-a[1])*u;
 const bx=d[0]+(e[0]-d[0])*u,by=d[1]+(e[1]-d[1])*u;
 return [tx+(bx-tx)*v,ty+(by-ty)*v-Math.sin(Math.PI*u)*(left?3.8:4.8)];
}
function pagePath(c,side,offset=0){
 c.beginPath();
 for(let i=0;i<=16;i++){const p=pagePoint(side,i/16,0);i?c.lineTo(p[0],p[1]+offset):c.moveTo(p[0],p[1]+offset);}
 for(let i=1;i<=16;i++){const p=pagePoint(side,1,i/16);c.lineTo(p[0],p[1]+offset);}
 for(let i=15;i>=0;i--){const p=pagePoint(side,i/16,1);c.lineTo(p[0],p[1]+offset);}
 c.closePath();
}
function pageLine(c,side,u1,u2,v,alpha=.38){
 c.strokeStyle=`rgba(68,46,28,${alpha})`;c.lineWidth=.48;c.beginPath();
 for(let i=0;i<=8;i++){const p=pagePoint(side,u1+(u2-u1)*i/8,v);i?c.lineTo(...p):c.moveTo(...p);}c.stroke();
}
function manuscript(c,side){
 const rng=rand(side<0?73427:51359);
 // A rubric and irregular word-shaped ink clusters instead of ruled notebook lines.
 for(let row=0;row<14;row++){
  const v=.19+row*.048,first=side<0&&row<3?.37:.13;
  let u=first;
  while(u<.84){const length=.045+rng()*.11,end=Math.min(.85,u+length);pageLine(c,side,u,end,v,.26+rng()*.19);u=end+.025+rng()*.035;}
 }
 if(side<0){
  const p=pagePoint(-1,.14,.2);c.save();c.translate(...p);c.transform(.83,.16,-.02,.9,0,0);
  c.fillStyle='#753c2cb0';c.fillRect(0,-2,7,11);c.strokeStyle='#d0b37599';c.lineWidth=.6;c.strokeRect(.8,-1.1,5.4,9.2);
  c.strokeStyle='#c2a572';line(c,2,0,5,0);line(c,3.5,0,3.5,6);c.restore();
 }else{
  const p=pagePoint(1,.51,.15);c.save();c.translate(...p);c.scale(1,.82);c.rotate(-.2);
  c.strokeStyle='#8063428c';c.lineWidth=.5;c.beginPath();c.arc(0,0,4.2,0,TAU);c.stroke();
  for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,Math.cos(a)*5.5,Math.sin(a)*5.5,Math.cos(a)*7,Math.sin(a)*7);}c.restore();
 }
}
function page(c,side){
 // Slightly different leaf values make both surfaces read as separate planes.
 for(let i=5;i>=1;i--){pagePath(c,side,i*.62);c.fillStyle=i%2?'#9a7b52':'#b49a6c';c.fill();}
 pagePath(c,side);c.save();c.clip();
 c.fillStyle=side<0?
 gradient(c,-47,-25,3,5,[[0,'#b49b70'],[.16,'#c9b385'],[.58,'#d9c69b'],[.83,'#c4ad80'],[1,'#756246']]):
 gradient(c,0,-15,49,-25,[[0,'#79664c'],[.14,'#c0aa7f'],[.48,'#d6c39b'],[.81,'#c9b88f'],[1,'#a89268']]);
 c.fillRect(-52,-51,107,119);
 const light=c.createRadialGradient(-24,-36,1,-24,-36,118);light.addColorStop(0,'#f4ce8f24');light.addColorStop(1,'#573c270e');c.fillStyle=light;c.fillRect(-52,-51,107,119);
 grain(c,side<0?9981:2893,1150,-48,-46,98,114);grain(c,side<0?151:321,700,-48,-46,98,114,true);
 // Local stains are low contrast; the central reading cards remain the brightest paper.
 const rng=rand(side<0?541:188);
 for(let i=0;i<22;i++){const p=pagePoint(side,.08+rng()*.84,.05+rng()*.88);c.fillStyle=`rgba(109,76,35,${.018+rng()*.04})`;c.beginPath();c.ellipse(p[0],p[1],.4+rng()*1.6,.35+rng()*1.3,0,0,TAU);c.fill();}
 manuscript(c,side);c.restore();
 // Edge highlight is broken and warm, not a uniform cream outline.
 c.strokeStyle='#ecdbaf5c';c.lineWidth=.6;c.beginPath();for(let i=0;i<11;i++){const p=pagePoint(side,i/13,0);i?c.lineTo(...p):c.moveTo(...p);}c.stroke();
 for(let i=1;i<5;i++){c.strokeStyle=i%2?'#6f56363c':'#ead6a333';c.lineWidth=.45;c.beginPath();for(let j=0;j<=10;j++){const p=pagePoint(side,j/10,1);j?c.lineTo(p[0],p[1]+i*.53):c.moveTo(p[0],p[1]+i*.53);}c.stroke();}
}
export function paintBoundFolio(c,{closed=false,stand=false,seed=5193}={}){
 c.save();c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;
 if(stand)lectern(c);
 c.rotate(-.045);
 if(closed){
  c.save();c.translate(0,57);paintLeatherSpine(c,0,0,86,92,'#493124',-.09,true);c.restore();c.restore();return;
 }
 // Uneven leather boards beneath the paper are visibly thick, with rounded wear.
 const cover=[[-51,-35],[-22,-36],[0,-25],[48,-48],[53,-43],[54,38],[4,66],[-49,51]];
 shadow(c,4,58,56,12,.5);path(c,cover);c.fillStyle=gradient(c,-45,-38,47,62,[[0,'#61452b'],[.3,'#4d3827'],[.55,'#30291f'],[1,'#37271d']]);c.fill();
 c.save();c.clip();grain(c,seed,1350,-55,-52,113,123,true);grain(c,seed+61,1200,-55,-52,113,123);c.restore();
 c.strokeStyle='#ad8b4b7a';c.lineWidth=.65;line(c,-49,-31,-47,47);line(c,-47,49,1,62);line(c,4,62,51,36);
 page(c,-1);page(c,1);
 // Binding gutter, headband, and a narrow fabric bookmark connect both pages.
 c.strokeStyle='#564530c9';c.lineWidth=1.2;c.beginPath();c.moveTo(0,-23);c.bezierCurveTo(-1,-1,1,31,0,59);c.stroke();
 c.strokeStyle='#ead3a57a';c.lineWidth=.5;line(c,-1.5,-19,-1,54);
 c.fillStyle='#784438';path(c,[[1,51],[4,51],[8,70],[4,67],[2,71]]);c.fill();c.strokeStyle='#c58c665c';c.lineWidth=.5;line(c,3,54,5.5,66);
 if(stand){c.fillStyle=gradient(c,0,57,0,68,[[0,'#a77e45'],[.3,'#745032'],[1,'#302016']]);path(c,[[-49,53],[-43,52],[3,65],[51,39],[53,43],[4,69]]);c.fill();}
 c.restore();
}
export function paintLeatherSpine(c,x,y,w,h,color='#514432',angle=0,cover=false){
 c.save();c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;c.translate(x,y);c.rotate(angle);
 shadow(c,1,1,w*.62,4,.45);
 const x0=-w/2;
 c.beginPath();c.moveTo(x0+2,-h+1);c.quadraticCurveTo(x0+w*.48,-h-1,x0+w-1,-h+1);c.lineTo(x0+w,0);c.quadraticCurveTo(0,2,x0,0);c.closePath();
 c.fillStyle=gradient(c,x0,0,x0+w,0,[[0,'#211d16'],[.1,color],[.23,'#796140'],[.39,color],[.81,color],[1,'#211e19']]);c.fill();
 c.save();c.clip();grain(c,Math.round(w*997+h*31),Math.ceil(w*h*.23),x0,-h,w,h,true);grain(c,1739,Math.ceil(w*h*.12),x0,-h,w,h);
 c.fillStyle=gradient(c,0,-h,0,0,[[0,'#e2ac6535'],[.4,'#35231900'],[1,'#08080730']]);c.fillRect(x0,-h,w,h);
 c.restore();
 const bands=cover?[-h+7,-7]:[-h+9,-h*.68,-h*.3,-7];
 for(const yy of bands){c.fillStyle='#15130e8c';c.fillRect(x0+1,yy,w-2,2);c.fillStyle='#b08d504f';c.fillRect(x0+1,yy-.8,w-2,.85);}
 c.strokeStyle='#caaa6266';c.lineWidth=.5;
 if(cover){c.strokeRect(x0+7,-h+10,w-14,h-20);c.strokeRect(x0+10,-h+13,w-20,h-26);c.beginPath();c.ellipse(0,-h*.51,12,17,0,0,TAU);c.stroke();}
 else{for(let i=0;i<3;i++)line(c,x0+w*.33,-h*.54+i*3,x0+w*.73,-h*.54+i*3);}
 c.strokeStyle='#dac0803a';line(c,x0+2,-h+3,x0+2,-3);c.restore();
}
