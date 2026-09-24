/** Pure, testable music direction. No random changes or gameplay authority. */
export const MUSIC_LOOP_SECONDS=40*4*60/90;
export const MUSIC_STEMS=Object.freeze(['lanterns-hearth','lanterns-motion','lanterns-pressure','lanterns-urgency']);
export function smoothBand(value,low,high){const t=Math.max(0,Math.min(1,(value-low)/(high-low)));return t*t*(3-2*t);}
export function musicDirection(scene='menu',danger=0,adaptive=true){
 const d=Number.isFinite(danger)?Math.max(0,Math.min(100,danger)):0;
 const live=scene==='play'||scene==='trial';
 const tension=live&&adaptive?smoothBand(d,20,90):0;
 const urgency=live&&adaptive?smoothBand(d,65,100):0;
 const pulse={menu:.16,play:.65,trial:.92,pause:0,clear:.18,over:0}[scene]??.16;
 return {danger:d,tension,urgency,stems:[1-tension*.24-urgency*.06,Math.min(1,pulse+tension*.12),tension*.84,urgency*.76]};
}
