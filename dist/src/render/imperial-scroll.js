/** One geometry contract for the scroll artwork, badge, text layout and tests.
 * All coordinates below are in the same TOP-LEFT material coordinate system.
 * The renderer translates the material's centre exactly once. No gameplay state.
 */
export const SCROLL = Object.freeze({
 version:'336', height:60, pad:16, minWidth:112, maxWidth:708,
 rodCentre:10, rodHalfWidth:6.5, pageInset:17,
 textInset:28, badgeCentre:42, badgeRadius:12, badgeTextGap:10,
 horizontalInkGuard:1.5
});
const ELEMENTS=new Set(['fire','ice','slow','wind']);
export function scrollInsets(kind){
 const badge=ELEMENTS.has(kind);
 return Object.freeze({left:badge?SCROLL.badgeCentre+SCROLL.badgeRadius+SCROLL.badgeTextGap:SCROLL.textInset,right:SCROLL.textInset,badge});
}
export function scrollGeometry(width,height=60){
 const w=Number.isFinite(width)?Math.max(SCROLL.minWidth,width):SCROLL.minWidth;
 const h=Number.isFinite(height)?Math.max(SCROLL.height,height):SCROLL.height;
 return Object.freeze({width:w,height:h,centreY:h/2,
  pageLeft:SCROLL.pageInset,pageRight:w-SCROLL.pageInset,
  leftRod:SCROLL.rodCentre,rightRod:w-SCROLL.rodCentre,
  leftRodInner:SCROLL.rodCentre+SCROLL.rodHalfWidth,
  rightRodInner:w-SCROLL.rodCentre-SCROLL.rodHalfWidth,
  badgeX:SCROLL.badgeCentre,badgeY:h/2,badgeRadius:SCROLL.badgeRadius,
  inkLeft:SCROLL.textInset,inkRight:w-SCROLL.textInset,
  minY:-7,maxY:h+8,pad:SCROLL.pad});
}
const PALETTES={
 normal:{face:'#f5e5bf',edge:'#cbb182',shade:'#d8bf8f',rule:'#987846',cord:'#745033',gem:'#896533'},
 fire:{face:'#f8e3be',edge:'#d1a179',shade:'#e1ba8c',rule:'#993e29',cord:'#a73728',gem:'#813124'},
 ice:{face:'#edf4ee',edge:'#a5c7c7',shade:'#cee1d9',rule:'#477b89',cord:'#397889',gem:'#315f77'},
 slow:{face:'#f7e8bd',edge:'#d2b96d',shade:'#e4cf94',rule:'#9a7838',cord:'#a77935',gem:'#806125'},
 wind:{face:'#f1e9f2',edge:'#c0accb',shade:'#d6c7dc',rule:'#886891',cord:'#72578d',gem:'#685077'},
 bonus:{face:'#30394b',edge:'#837552',shade:'#202a3c',rule:'#b89a60',cord:'#5a5471',gem:'#293447'}
};
export const SCROLL_PALETTES=Object.freeze(Object.fromEntries(Object.entries(PALETTES).map(([k,v])=>[k,Object.freeze(v)])));
export function scrollPalette(kind){return SCROLL_PALETTES[kind]||SCROLL_PALETTES.normal;}
function round(c,x,y,w,h,r=2){c.beginPath();c.roundRect(x,y,w,h,r);}
function gradient(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [at,color] of stops)g.addColorStop(at,color);return g;}
function disk(c,x,y,r,fill,stroke=null){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.7;c.stroke();}}
export function scrollPaperPath(width,height){
 const g=scrollGeometry(width,height),p=new Path2D(),x=g.pageLeft,y=4,w=g.pageRight-x,h=g.height-8;
 p.moveTo(x,y+1.6);p.bezierCurveTo(x+w*.28,y-.7,x+w*.72,y+.8,x+w,y);
 p.lineTo(x+w,y+h);p.bezierCurveTo(x+w*.7,y+h-1,x+w*.3,y+h+1.2,x,y+h-1);p.closePath();return p;
}
/** Cached, resolution-independent artwork. No words are baked into the material.
 * Narrow turned brass rollers, etched shafts, silk brocade and short tied cords.
 */
export function paintScrollMaterial(c,width,height,kind,paperImage,contrast=false){
 const g=scrollGeometry(width,height),p=scrollPalette(kind),dark=kind==='bonus';
 const page=scrollPaperPath(width,height),face=contrast&&!dark?'#fff7df':p.face;
 c.save();
 // Paper shadows and two laminated edges establish depth without a big flat box.
 c.shadowColor='#050b0a85';c.shadowOffsetY=4;c.shadowBlur=7;
 c.fillStyle=p.edge;c.save();c.translate(0,1.5);c.fill(page);c.restore();c.shadowColor='transparent';
 c.fillStyle=gradient(c,0,3,0,height-3,[[0,p.shade],[.18,face],[.47,face],[1,p.shade]]);c.fill(page);
 c.save();c.clip(page);
 if(paperImage){c.globalAlpha=dark?.065:.14;c.drawImage(paperImage,g.pageLeft,2,g.pageRight-g.pageLeft,height-4);c.globalAlpha=1;}
 // Lamplight highlight, limited to the centre of the actual silk.
 c.fillStyle=gradient(c,g.pageLeft,0,g.pageRight,0,[[0,'#5b391d30'],[.07,'#fff9e110'],[.48,'#fff8d315'],[.92,'#fff9e10a'],[1,'#5b391d38']]);c.fillRect(g.pageLeft,3,g.pageRight-g.pageLeft,height-6);
 c.strokeStyle=p.rule;c.lineWidth=.7;c.globalAlpha=dark?.65:.52;
 for(const y of [7,height-7]){c.beginPath();c.moveTo(g.pageLeft+2,y);c.lineTo(g.pageRight-2,y);c.stroke();}
 c.globalAlpha=dark?.32:.23;c.lineWidth=.5;
 // Woven Greek-key/cloud rhythm stays in the top/bottom margin, out of the ink.
 for(const y of [9.3,height-9.3])for(let x=g.pageLeft+9;x<g.pageRight-11;x+=15){
  const dir=y<height/2?1:-1;
  c.beginPath();c.moveTo(x,y);c.lineTo(x+6,y);c.lineTo(x+6,y+2*dir);c.lineTo(x+3,y+2*dir);c.lineTo(x+3,y+4*dir);c.stroke();
 }
 c.globalAlpha=1;
 // Rolled silk seam. It ends before either the badge or the ink-safe rectangle.
 for(const x of [g.pageLeft,g.pageRight-6]){
  c.fillStyle=gradient(c,x,0,x+6,0,[[0,p.edge],[.5,face],[1,p.shade]]);c.fillRect(x,4,6,height-8);
  c.strokeStyle=dark?'#b69b6350':'#fff9e7b0';c.lineWidth=.75;c.beginPath();c.moveTo(x+2,6);c.lineTo(x+2,height-6);c.stroke();
 }
 c.restore();
 c.strokeStyle=p.edge;c.lineWidth=.65;c.stroke(page);
 // Metal is always warm brass; element identity is in the silk, cord and inset seal.
 const rod=(x,side)=>{
  const gold=gradient(c,x-6,0,x+6,0,[[0,'#49301b'],[.17,'#92632c'],[.39,'#e5bd6e'],[.51,'#f8e3a7'],[.63,'#b58a45'],[.88,'#735020'],[1,'#402914']]);
  c.save();c.shadowColor='#24180865';c.shadowBlur=2;c.shadowOffsetY=1;
  c.fillStyle=gold;round(c,x-4.8,5,9.6,height-10,2.2);c.fill();c.shadowColor='transparent';
  c.strokeStyle='#4c351dcc';c.lineWidth=.7;c.stroke();
  // Chased vine cut into the shaft; alternating curved leaves, not a pill-shaped bar.
  c.strokeStyle='#584023b0';c.lineWidth=.65;c.beginPath();c.moveTo(x,18);c.bezierCurveTo(x-3,25,x+3,34,x,43);c.stroke();
  for(let i=0;i<4;i++){
   const y=21+i*5.5,s=i%2?1:-1;c.beginPath();c.moveTo(x,y+3);c.quadraticCurveTo(x+s*4,y+2,x+s*2.5,y-2);c.quadraticCurveTo(x+s*.3,y-1,x,y+3);c.stroke();
   c.strokeStyle='#f2d48b85';c.beginPath();c.moveTo(x+s*.7,y+2);c.quadraticCurveTo(x+s*2.8,y+1,x+s*2,y-1);c.stroke();c.strokeStyle='#584023b0';
  }
  const finial=(at,flip)=>{
   c.save();c.translate(x,at);c.scale(1,flip);
   const capGold=gradient(c,-6,0,6,0,[[0,'#573919'],[.3,'#bc8f45'],[.47,'#ffe7a6'],[.58,'#d8af63'],[1,'#60411c']]);
   c.fillStyle=capGold;c.beginPath();c.moveTo(-3,0);c.lineTo(-3,-2);c.quadraticCurveTo(-3.8,-4,0,-7);c.quadraticCurveTo(3.8,-4,3,-2);c.lineTo(3,0);c.closePath();c.fill();c.strokeStyle='#7a5729';c.lineWidth=.6;c.stroke();
   c.fillStyle=capGold;round(c,-5,-.5,10,2.8,1);c.fill();round(c,-6.5,3,13,2.2,.9);c.fill();round(c,-5.7,6.1,11.4,1.5,.5);c.fill();
   c.strokeStyle='#f7dea099';c.lineWidth=.6;for(const yy of [0,3.8,6.5]){c.beginPath();c.moveTo(-4.5,yy);c.lineTo(4.5,yy);c.stroke();}
   c.restore();
  };
  finial(0,1);finial(height,-1);
  // Two restrained knots with individually shaded turns.
  for(const y of [12,height-13]){
   for(let n=0;n<3;n++){
    c.strokeStyle=n===1?p.cord:'#4a2622';c.lineWidth=1.5;c.beginPath();c.moveTo(x-5.2,y+n*1.6);c.quadraticCurveTo(x,y+2+n*1.6,x+5.2,y+.5+n*1.6);c.stroke();
    c.strokeStyle=dark?'#af8b7460':'#eaa07955';c.lineWidth=.5;c.beginPath();c.moveTo(x-4.5,y+.3+n*1.6);c.lineTo(x+1,y+1.1+n*1.6);c.stroke();
   }
  }
  // Cord and short tassel lie on the OUTER edge, never across a word or badge.
  const tx=x+side*7;
  c.strokeStyle=p.cord;c.lineWidth=1.1;c.beginPath();c.moveTo(x+side*4,height-12);c.quadraticCurveTo(tx+side*1.5,height-7,tx,height-2);c.stroke();
  disk(c,tx,height-1,1.4,'#b59553');
  c.fillStyle=p.cord;c.beginPath();c.moveTo(tx-.6,height+.3);c.lineTo(tx-2.2,height+6);c.quadraticCurveTo(tx,height+7,tx+2.2,height+6);c.lineTo(tx+.6,height+.3);c.closePath();c.fill();
  c.strokeStyle='#e5b07660';c.lineWidth=.5;c.beginPath();c.moveTo(tx-.3,height+1);c.lineTo(tx-1,height+6);c.moveTo(tx+.5,height+1);c.lineTo(tx+1.2,height+6);c.stroke();
  c.restore();
 };
 rod(g.leftRod,-1);rod(g.rightRod,1);
 if(scrollInsets(kind).badge){
  const x=g.badgeX,y=g.badgeY,r=g.badgeRadius;
  c.shadowColor='#4b291d38';c.shadowBlur=2;c.shadowOffsetY=1;
  disk(c,x,y,r,gradient(c,x-r,y-r,x+r,y+r,[[0,'#79552d'],[.27,'#e4c47a'],[.45,'#fff0b7'],[.73,'#ad8142'],[1,'#5c3a20']]));c.shadowColor='transparent';
  disk(c,x,y,r-2,p.gem,'#f3d495a0');
  c.strokeStyle='#ffffff25';c.lineWidth=.8;c.beginPath();c.arc(x,y,r-3.4,Math.PI*1.03,Math.PI*1.87);c.stroke();
 }
 c.restore();
}
