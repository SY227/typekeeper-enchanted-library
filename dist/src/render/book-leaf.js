/** Cached folio materials, not gameplay geometry. No fonts or remote assets.
 * Decoration stays at the perimeter; the single-line ink corridor is untouched.
 */
export const FOLIO_PALETTES=Object.freeze(Object.fromEntries(Object.entries({
 normal:{cover:'#345447',spine:'#23392f',gold:'#b99b60',face:'#fff3d5',shade:'#e1c894',edge:'#c0a779',ink:'#82724f'},
 fire:{cover:'#84422b',spine:'#48291e',gold:'#c89259',face:'#ffedcf',shade:'#dcac77',edge:'#97663e',ink:'#9e6e45'},
 ice:{cover:'#447e8b',spine:'#254c58',gold:'#a7c9c8',face:'#f1fbf6',shade:'#c9e3e2',edge:'#92b8bb',ink:'#789698'},
 slow:{cover:'#856b33',spine:'#534421',gold:'#d4b56c',face:'#fff3cf',shade:'#e4cc89',edge:'#b7a264',ink:'#958050'},
 wind:{cover:'#6d5d86',spine:'#41334f',gold:'#b8a1c4',face:'#f7f0fa',shade:'#dfcfe8',edge:'#ad94b8',ink:'#918097'},
 bonus:{cover:'#544253',spine:'#29272e',gold:'#d0b478',face:'#46454f',shade:'#292c36',edge:'#706251',ink:'#cab584'}
}).map(([name,palette])=>[name,Object.freeze(palette)])));
export function folioPalette(kind){return FOLIO_PALETTES[kind]||FOLIO_PALETTES.normal;}
export function folioMetrics(width,height=60){
 const w=Number.isFinite(width)?Math.max(112,width):112,h=Number.isFinite(height)?Math.max(60,height):60;
 return Object.freeze({width:w,height:h,gutter:11,topRule:8,bottomRule:h-8,foreEdge:w-7,leafCount:3,pad:16});
}
/** Local coordinates in the existing width × height material rectangle. */
export function folioOutline(width,height){
 const p=new Path2D();
 p.moveTo(9,3);p.bezierCurveTo(width*.35,.5,width*.76,2,width-14,2);
 p.quadraticCurveTo(width-4,2,width-3,12);
 p.bezierCurveTo(width-1,height*.44,width-3,height*.78,width-5,height-6);
 p.quadraticCurveTo(width*.65,height-2,15,height-4);
 p.quadraticCurveTo(8,height-4,8,height-12);
 p.bezierCurveTo(10,height*.56,7,18,9,3);p.closePath();return p;
}
