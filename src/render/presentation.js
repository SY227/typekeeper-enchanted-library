import { SCROLL, scrollInsets } from './imperial-scroll.js';
/** Presentation-only contracts. Nothing here writes to the gameplay model. */
export const PRESENTATION_VERSION='3.6.3';
export const BOOK_ANCHORS=Object.freeze({fire:{x:146,y:757},ice:{x:278,y:757},slow:{x:922,y:757},wind:{x:1054,y:757}});
export const PAPER_ANCHOR=Object.freeze({x:411,y:746,width:378,height:53});
export const ROOM_PROFILES=Object.freeze([
 {name:'Reading Room',wash:'#bd9b59',paper:'#355048',lamp:'#ffcf80',props:['folio','candle'],dust:18},
 {name:'Glasshouse',wash:'#86b9a1',paper:'#314f49',lamp:'#daf2bf',props:['vine','glass'],dust:14},
 {name:'Clockwork Hall',wash:'#c8a96b',paper:'#4a4d3e',lamp:'#f5cb83',props:['gear','pendulum'],dust:30},
 {name:'Frost Archive',wash:'#b3d8e4',paper:'#304b54',lamp:'#d3f1ff',props:['frost','crystal'],dust:8},
 {name:'Ember Stacks',wash:'#d28759',paper:'#454739',lamp:'#ffa96b',props:['brazier','cinder'],dust:18},
 {name:'Astral Gallery',wash:'#ada2d9',paper:'#3a4454',lamp:'#d7cff4',props:['orrery','stars'],dust:20},
 {name:'Midnight Vault',wash:'#7995b5',paper:'#283d49',lamp:'#bfd7ed',props:['key','lantern'],dust:8},
 {name:'Eternal Library',wash:'#d8bd7a',paper:'#4b5140',lamp:'#ffe3a0',props:['laurel','seal'],dust:22}
]);
export function visualClamp(v,lo=0,hi=1){return Math.max(lo,Math.min(hi,Number.isFinite(v)?v:lo));}
export function visualEase(v){const t=visualClamp(v);return 1-(1-t)**3;}
export function roomForChapter(chapter){return ROOM_PROFILES[Math.min(7,Math.max(0,Math.floor(((Number(chapter)||1)-1)/6)))];}
export function presentationTarget(words,buffer){
 if(!buffer)return null;
 return words.filter(w=>w.text.startsWith(buffer)).sort((a,b)=>b.y-a.y||a.id-b.id)[0]||null;
}
/** A single complete word on one baseline. Card width grows before text scales. */
export function readableCardLayout(text,width,kind,cssScale,measure){
 const value=String(text??''),insets=scrollInsets(kind);
 const scale=Number.isFinite(cssScale)&&cssScale>0?cssScale:1;
 const baseSize=Math.max(29,Math.min(36,23.6/Math.max(.5,scale)));
 const padding=insets.left+insets.right,maxWidth=SCROLL.maxWidth;
 let fontSize=baseSize;
 const bounds=size=>{
  const m=measure(value,size);
  if(typeof m==='number')return {advance:m,inkLeft:0,inkRight:m,span:m};
  const advance=Number.isFinite(m.width)?m.width:0;
  const inkLeft=Math.min(0,Number.isFinite(m.actualBoundingBoxLeft)?-m.actualBoundingBoxLeft:0);
  const inkRight=Math.max(advance,Number.isFinite(m.actualBoundingBoxRight)?m.actualBoundingBoxRight:advance);
  return {advance,inkLeft,inkRight,span:inkRight-inkLeft};
 };
 let metrics=bounds(fontSize);
 const room=maxWidth-padding-SCROLL.horizontalInkGuard*2;
 if(metrics.span>room){fontSize*=room/Math.max(1,metrics.span)*.999;metrics=bounds(fontSize);}
 // Width follows actual glyphs + the drawn hardware. The old model width is a
 // spawn-spacing hint, NOT permission to place text under the decorative rollers.
 const visualWidth=Math.min(maxWidth,Math.max(SCROLL.minWidth,Math.ceil(metrics.span+padding+SCROLL.horizontalInkGuard*2)));
 const safeLeft=-visualWidth/2+insets.left,safeRight=visualWidth/2-insets.right;
 const free=safeRight-safeLeft-metrics.span;
 const x=safeLeft+free/2-metrics.inkLeft;
 const line=Object.freeze({text:value,start:0,width:metrics.advance,x,y:0});
 return Object.freeze({text:value,fontSize,width:visualWidth,height:60,textX:x,baseline:0,
  textWidth:metrics.advance,textMaxWidth:safeRight-x,
  inkLeft:x+metrics.inkLeft,inkRight:x+metrics.inkRight,safeLeft,safeRight,
  badgeX:insets.badge?-visualWidth/2+SCROLL.badgeCentre:null,badgeRadius:SCROLL.badgeRadius,
  lines:Object.freeze([line])});
}
/** Only cosmetic x separation; world y/speed/priority never changes. */
export function resolveVisualPositions(words,layouts,left,right){
 const positions=new Map(),ordered=[...words].sort((a,b)=>b.y-a.y||a.id-b.id);
 for(const w of ordered){
  const l=layouts.get(w.id),half=l.width/2;
  const desired=visualClamp(w.x,left+half,right-half);
  const conflicts=[...positions.values()].filter(p=>Math.abs(w.y-p.y)<(l.height+p.height)/2+5);
  const candidates=[desired,...conflicts.flatMap(p=>[p.x-(p.width+l.width)/2-7,p.x+(p.width+l.width)/2+7])]
    .map(x=>visualClamp(x,left+half,right-half));
  const cost=x=>conflicts.reduce((n,p)=>n+Math.max(0,(p.width+l.width)/2+7-Math.abs(x-p.x))*200,0)+Math.abs(x-desired);
  candidates.sort((a,b)=>cost(a)-cost(b));
  positions.set(w.id,{x:candidates[0],y:w.y,width:l.width,height:l.height,offset:candidates[0]-w.x});
 }
 return positions;
}
/** One slot, explicit completion, cancel-safe; no setTimeout callback can reopen UI. */
export class OutcomeCue {
 constructor(){this.cancel();}
 start(kind,payload,motion=true){this.kind=kind;this.payload=payload;this.elapsed=0;this.duration=motion?(kind==='finale'?4.2:kind==='wing'?2.1:kind==='defeat'?1.2:.88):0;this.active=true;}
 get progress(){return this.duration?visualClamp(this.elapsed/this.duration):1;}
 step(dt,visible=true){if(!this.active||!visible)return null;this.elapsed+=Math.max(0,Math.min(.05,dt||0));return this.elapsed>=this.duration?this.finish():null;}
 finish(){if(!this.active)return null;const result={kind:this.kind,payload:this.payload};this.cancel();return result;}
 cancel(){this.active=false;this.kind=null;this.payload=null;this.elapsed=0;this.duration=0;}
}
