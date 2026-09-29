/** Open Atrium — a static, feathered grade of the ORIGINAL painted chamber.
 * No new plane, border, rules, texture grid, blur, moving haze or gameplay state.
 * Pixels on the foreground shelves/columns/desk are never replaced. Native word
 * cards, text, effects and HUD are drawn later and do not pass through this grade.
 */
export const ATRIUM = Object.freeze({width:1200,height:790,cx:600,cy:398,rx:388,ry:344,inner:.48,saturation:.28,contrastBrightness:.74,maxSurfaces:2});
const atClamp = (v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
const atSmooth = v=>{const t=atClamp(v);return t*t*t*(t*(t*6-15)+10);};
/** C2-continuous feather: both the slope and curvature vanish at the boundary. */
export function atriumMask(x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y))return 0;
 const q=Math.hypot((x-ATRIUM.cx)/ATRIUM.rx,(y-ATRIUM.cy)/ATRIUM.ry);
 return 1-atSmooth((q-ATRIUM.inner)/(1-ATRIUM.inner));
}
/** The color transfer preserves the painter's architecture rather than replacing
 * it with a procedural room. Lantern bounce is broad, static and low intensity. */
export function atriumColor(red,green,blue,x,y,contrast=false){
 const l=.2126*red+.7152*green+.0722*blue,s=ATRIUM.saturation;
 const depth=Math.exp(-(((x-596)/295)**2+((y-429)/286)**2));
 const left=Math.exp(-(((x-304)/151)**2+((y-239)/263)**2));
 const right=Math.exp(-(((x-902)/155)**2+((y-241)/260)**2));
 const bounce=(left+right)*3.4,air=depth*2.0;
 const b=contrast?ATRIUM.contrastBrightness:1;
 return [atClamp(((l+(red-l)*s)*1.035+air+bounce)*b,0,255),
  atClamp(((l+(green-l)*s)*.995+air*.87+bounce*.72)*b,0,255),
  atClamp(((l+(blue-l)*s)*.985+air*.73+bounce*.43)*b,0,255)];
}
export class AtriumBackdrop {
 constructor(){this.surfaces=new Map();this.source=null;this.sourceKey='';this.builds=0;this.status='unprepared';}
 layerFor(source,contrast=false){
  if(!source?.complete||!source.naturalWidth||!source.naturalHeight){this.status='waiting-for-original-art';return null;}
  const key=`${source.currentSrc||source.src}/${source.naturalWidth}/${source.naturalHeight}`;
  if(this.source!==source||this.sourceKey!==key){this.surfaces.clear();this.source=source;this.sourceKey=key;}
  const mode=!!contrast;
  if(!this.surfaces.has(mode)){
   const canvas=document.createElement('canvas');canvas.width=ATRIUM.width;canvas.height=ATRIUM.height;
   const c=canvas.getContext('2d',{willReadFrequently:true});
   // The shipped original is 4:3, aligned to the unchanged 1200x900 stage.
   c.drawImage(source,0,0,1200,900);
   let image;
   try{image=c.getImageData(0,0,ATRIUM.width,ATRIUM.height);}catch(_){
    // A non-readable custom artwork must not break gameplay. Leave the original
    // CSS room visible; do not reinstate an opaque or rectangular fallback.
    this.status='original-art-fallback';this.surfaces.set(mode,null);return null;
   }
   const d=image.data;
   for(let y=0;y<ATRIUM.height;y++)for(let x=0;x<ATRIUM.width;x++){
    const i=(y*ATRIUM.width+x)*4,mask=atriumMask(x,y);
    if(mask<=0){d[i]=0;d[i+1]=0;d[i+2]=0;d[i+3]=0;continue;}
    const rgb=atriumColor(d[i],d[i+1],d[i+2],x,y,mode);
    d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];d[i+3]=Math.round(mask*255);
   }
   c.putImageData(image,0,0);this.surfaces.set(mode,canvas);this.builds++;
  }
  const layer=this.surfaces.get(mode);
  if(layer)this.status='ready';
  return layer;
 }
 paint(ctx,source,contrast=false){
  const layer=this.layerFor(source,contrast);
  if(layer){ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(layer,0,0);ctx.restore();}
 }
 snapshot(){return {style:'open-atrium',status:this.status,builds:this.builds,entries:this.surfaces.size,bytes:[...this.surfaces.values()].reduce((n,c)=>n+(c?c.width*c.height*4:0),0)};}
}
