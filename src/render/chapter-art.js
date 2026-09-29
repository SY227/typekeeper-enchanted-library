import { CAMPAIGN } from '../data/campaign.js';
import { roomForChapter } from './presentation.js';

/** Authored, cosmetic-only still lifes, keyed to the actual campaign title.
 * These do not touch the word RNG, word list, field, difficulty, or game clock.
 * All decoration is clipped to shelves/margins, never the live-word corridor.
 */
const chapterDesigns = [
 ['First Light','dawn','candle','sun','#eed29a','A dawn window and the first reading lamp.'],
 ['Ink & Paper','scribe','quill','folio','#cab484','A quill, ink bottle and ruled manuscript.'],
 ['A Quiet Rhythm','metronome','pendulum','score','#b3c4ae','A steady brass metronome and quiet staff lines.'],
 ['The First Spark','spark','brazier','ember','#e7b275','One ember protected under a glass bell.'],
 ['Between the Lines','ruled','folio','quill','#d1c2a2','An open ruled folio with paired margin marks.'],
 ['The Opening Bell','bell','bell','sun','#e6c991','A suspended opening bell and sunrise engraving.'],
 ['Emerald Leaves','leaves','branch','leaf','#9ebda1','A pressed emerald specimen and fresh leaves.'],
 ['A Growing Tale','shoot','plant','folio','#b5c695','A young potted shoot beside an unfinished folio.'],
 ['Branches of Thought','branches','branch','branch','#aac8b2','A branching herbarium and brass tree diagram.'],
 ['Rain on Glass','rain','window','drop','#9fcbc9','Cool condensation and rain confined to side windows.'],
 ['Hidden Blossoms','blossom','plant','flower','#dac7ba','Small pale blossoms emerging between leaves.'],
 ['The Garden Gate','gate','arch','leaf','#bad59d','A wrought garden gate under a climbing vine.'],
 ['Golden Gears','gears','gear','gear','#e0bd7a','A meshed clockwork mechanism with warm brass teeth.'],
 ['A Measured Beat','beat','metronome','clock','#cabb98','A metronome with a measured pendulum arc.'],
 ['Pendulum Pages','pendulum','pendulum','folio','#dfc792','A tall brass pendulum beside marked pages.'],
 ['Stolen Seconds','hourglass','hourglass','key','#b9b6a2','A fine hourglass and a concealed winding key.'],
 ['The Eleventh Hour','eleven','clock','moon','#c7b2a0','An eleven-o’clock face in late amber light.'],
 ['The Clock Strikes','strikes','bellclock','gear','#ead6a4','A twelve-o’clock clock and its striking bell.'],
 ['Silver Breath','breath','window','snow','#bbd9df','Silver condensation at the edges of cold glass.'],
 ['Crystal Margins','crystal','crystal','snow','#bbdbeb','Faceted crystals and narrow frosted margin marks.'],
 ['The Still Page','still','folio','seal','#cddde2','A sealed, motionless winter manuscript.'],
 ['Winter Whispers','whisper','branch','snow','#b6cedf','Bare silver twigs and a few shelf-side snow specks.'],
 ['Cold Precision','precision','compass','clock','#b2d3db','An engraved compass and fine icy calibration ticks.'],
 ['The Frozen Seal','frozenseal','seal','crystal','#cee7ef','A crystalline seal on a chilled book.'],
 ['Kindling','kindling','brazier','ember','#d3a16e','A low brazier with stacked kindling.'],
 ['Letters of Flame','flame','folio','flame','#e6b27f','A firelit illuminated folio and flame engraving.'],
 ['The Warmest Ink','warmink','quill','ember','#dfb884','A copper ink bottle catching hearth light.'],
 ['Firelight Fables','fables','candle','folio','#edcb90','A cluster of reading candles beside a fable.'],
 ['Under Pressure','pressure','gauge','gear','#c8a77f','A brass pressure gauge with a small copper coil.'],
 ['The Burning Chapter','burning','folio','flame','#e2a36e','A char-edged volume with a banked ember.'],
 ['Starlit Script','starlit','folio','star','#bcbbe2','Silver script and a star etched into the shelf.'],
 ['The Long View','telescope','telescope','moon','#b7b5d7','A small brass telescope and distant moon.'],
 ['Celestial Signs','celestial','orrery','star','#c8bcd9','A celestial astrolabe with engraved signs.'],
 ['Orbiting Ideas','orbit','orrery','orbit','#b8c5e2','Interlocking orbital rings and a companion planet.'],
 ['Constellations','constellations','constellation','star','#c8c9ea','A linked constellation diagram under violet light.'],
 ['The Starfall Trial','starfall','constellation','comet','#d6c9eb','A small meteor trail inside the side atlas.'],
 ['After Hours','afterhours','clock','moon','#9aaec3','A midnight clock and dim indigo shelf light.'],
 ['Secret Passages','passage','arch','key','#a0b6c2','A partly lit passage and an old keyhole.'],
 ['Velvet Shadows','velvet','curtain','moon','#b4a1bc','Folded velvet drapery in muted plum.'],
 ['The Lost Manuscript','lost','scroll','seal','#bcb4a0','A tied manuscript recovered from the vault.'],
 ['One Last Candle','lastcandle','candle','smoke','#d6bd90','One low candle, with the second shelf deliberately dark.'],
 ['The Midnight Key','midnightkey','key','moon','#a8bfd7','An ornate key and a small midnight moon.'],
 ['The Final Volume','finalvolume','folio','laurel','#deca96','A gilded final volume held in a laurel frame.'],
 ['Pages Without End','infinity','scroll','infinity','#dbceaa','An unending paper ribbon and infinity inlay.'],
 ['A Thousand Voices','voices','volumes','star','#cec9b0','A choir of small volumes with different bindings.'],
 ['The Master Scribe','masterscribe','quill','laurel','#e8d5a4','A ceremonial quill, ink and an earned laurel.'],
 ['The Last Word','lastword','seal','folio','#e0d4b9','One sealed page, with unusually quiet shelf detail.'],
 ['The Typekeeper','typekeeper','crest','laurel','#f0d49b','A complete laurel, keeper’s crest and open final volume.']
];
if(chapterDesigns.length!==CAMPAIGN.length)throw new Error('Chapter artwork must cover the campaign.');
export const CHAPTER_ART = Object.freeze(chapterDesigns.map(([title,id,prop,inlay,accent,description],i)=>{
 if(CAMPAIGN[i].title!==title)throw new Error(`Chapter artwork/title mismatch at ${i+1}: ${title}`);
 return Object.freeze({level:i+1,title,id,prop,inlay,accent,description,wing:CAMPAIGN[i].wing,trial:CAMPAIGN[i].trial,variant:i%6,seed:9317+i*977});
}));
export function chapterArtForLevel(level){
 const n=Math.max(1,Math.floor(Number(level)||1));
 return CHAPTER_ART[Math.min(CHAPTER_ART.length-1,n-1)];
}
const caRGBA=(hex,a)=>`rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${a})`;
function caRR(c,x,y,w,h,r=3){c.beginPath();c.roundRect(x,y,w,h,r);}
function caLine(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function caStar(c,x,y,size,color){c.save();c.strokeStyle=color;c.lineWidth=.9;caLine(c,x-size,y,x+size,y);caLine(c,x,y-size,x,y+size);c.restore();}
function caMetal(c,x,w,a){const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#51402e');g.addColorStop(.3,a);g.addColorStop(.48,'#efdbad');g.addColorStop(.66,a);g.addColorStop(1,'#665037');return g;}
function caGlow(c,x,y,r,color,alpha){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,caRGBA(color,alpha));g.addColorStop(1,caRGBA(color,0));c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function caBook(c,x,y,w,h,color,angle=0){
 c.save();c.translate(x,y);c.rotate(angle);c.fillStyle='#151a15';caRR(c,-w/2,-h,w,h,3);c.fill();
 const g=c.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'#18241d');g.addColorStop(.2,color);g.addColorStop(.65,color);g.addColorStop(1,'#243429');c.fillStyle=g;c.fill();c.strokeStyle='#ac93624d';c.lineWidth=.8;c.stroke();
 c.fillStyle='#d2ba89';c.globalAlpha=.65;c.fillRect(-w/2+3,-h+8,w-6,1);c.fillRect(-w/2+3,-9,w-6,1);c.restore();
}
function caLeaf(c,x,y,size,angle,color){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();c.moveTo(-size,0);c.quadraticCurveTo(0,-size*.85,size,0);c.quadraticCurveTo(0,size*.6,-size,0);c.fill();c.strokeStyle='#d3e6bb55';c.lineWidth=.6;caLine(c,-size*.75,0,size*.8,0);c.restore();}
function caCrystal(c,x,y,w,h,accent){
 const g=c.createLinearGradient(x-w/2,y-h,x+w/2,y);g.addColorStop(0,'#ecfaffc7');g.addColorStop(.28,caRGBA(accent,.7));g.addColorStop(.63,'#43839580');g.addColorStop(1,'#17373f');
 c.fillStyle=g;c.beginPath();c.moveTo(x-w/2,y-h*.7);c.lineTo(x,y-h);c.lineTo(x+w/2,y-h*.68);c.lineTo(x+w/2,y-5);c.lineTo(x,y+3);c.lineTo(x-w/2,y-5);c.closePath();c.fill();c.strokeStyle='#d8f2fbc0';c.lineWidth=.7;c.stroke();caLine(c,x,y-h,x,y+2);caLine(c,x-w/2,y-h*.7,x+w/2,y-h*.68);
}
function caGear(c,x,y,r,accent){
 c.save();c.translate(x,y);c.fillStyle=caMetal(c,-r,2*r,accent);c.beginPath();for(let i=0;i<64;i++){const a=i*Math.PI/32,rr=r*(i%4<2?1:.88);i?c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):c.moveTo(rr,0);}c.closePath();c.fill();c.strokeStyle='#342b1a';c.lineWidth=1;c.stroke();c.fillStyle='#1b302c';c.beginPath();c.arc(0,0,r*.67,0,Math.PI*2);c.fill();c.strokeStyle=accent;c.lineWidth=2;for(let i=0;i<6;i++){const a=i*Math.PI/3;caLine(c,Math.cos(a)*r*.2,Math.sin(a)*r*.2,Math.cos(a)*r*.67,Math.sin(a)*r*.67);}c.beginPath();c.arc(0,0,r*.16,0,Math.PI*2);c.stroke();c.restore();
}
function caCandle(c,x,y,h,accent,unlit=false){
 c.fillStyle='#baab82';caRR(c,x-8,y-h,16,h,3);c.fill();c.fillStyle='#e8d6a7';c.fillRect(x-5,y-h+4,3,h-8);c.strokeStyle='#63533b';c.lineWidth=1;caLine(c,x,y-h,x,y-h-6);
 c.fillStyle=caMetal(c,x-23,46,accent);c.beginPath();c.ellipse(x,y+4,23,5,0,0,Math.PI*2);c.fill();
 if(!unlit){caGlow(c,x,y-h-12,38,accent,.2);c.fillStyle='#ebc984';c.beginPath();c.moveTo(x,y-h-24);c.bezierCurveTo(x+3,y-h-12,x+9,y-h-3,x,y-h-5);c.bezierCurveTo(x-7,y-h-7,x-3,y-h-14,x,y-h-24);c.fill();c.fillStyle='#fff0ba';c.beginPath();c.ellipse(x,y-h-10,2.1,4.4,0,0,Math.PI*2);c.fill();}
}
function caFolio(c,accent,variant,closed=false){
 c.save();c.rotate(-.08);c.fillStyle='#243c30';caRR(c,-46,-23,92,83,3);c.fill();c.strokeStyle=accent;c.lineWidth=.9;c.stroke();
 if(closed){c.strokeRect(-40,-17,80,71);caStar(c,0,17,14,accent);}
 else{
  const g=c.createLinearGradient(-41,0,41,0);g.addColorStop(0,'#b7a787');g.addColorStop(.45,'#dfd0a9');g.addColorStop(.5,'#7e7256');g.addColorStop(.56,'#e0d3b4');g.addColorStop(1,'#bbab83');c.fillStyle=g;c.beginPath();c.moveTo(-41,-19);c.quadraticCurveTo(-20,-24,0,-12);c.quadraticCurveTo(21,-24,41,-19);c.lineTo(41,54);c.quadraticCurveTo(19,49,0,60);c.quadraticCurveTo(-19,49,-41,54);c.closePath();c.fill();
  c.strokeStyle='#6f674c77';c.lineWidth=.8;for(let y=-5;y<49;y+=7){caLine(c,-34,y,-6,y+4);caLine(c,6,y+4,32-(Math.abs(y)%3)*3,y);}
  if(variant==='burning'||variant==='flame'){c.strokeStyle='#623924';c.lineWidth=3;caLine(c,-41,-18,-41,54);caLine(c,40,-19,40,54);caGlow(c,-27,50,28,'#e19548',.23);}
 }
 c.restore();
}
function caSymbol(c,type,a,v=0){
 c.strokeStyle=a;c.lineWidth=1.2;
 if(['sun','star','snow','comet','ember','flame','smoke'].includes(type)){
  if(type==='sun'){c.beginPath();c.arc(0,0,11,0,Math.PI*2);c.stroke();for(let i=0;i<12;i++){let t=i*Math.PI/6;caLine(c,Math.cos(t)*15,Math.sin(t)*15,Math.cos(t)*20,Math.sin(t)*20);}}
  else if(type==='snow'){for(let i=0;i<6;i++){const t=i*Math.PI/3;c.save();c.rotate(t);caLine(c,0,0,0,-23);caLine(c,0,-14,6,-20);caLine(c,0,-14,-6,-20);c.restore();}}
  else if(type==='star'||type==='comet'){const pts=[[0,-16],[4,-4],[16,0],[4,4],[0,16],[-4,4],[-16,0],[-4,-4]];c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.stroke();if(type==='comet'){caLine(c,-24,-16,-3,-4);caLine(c,-26,-7,-7,0);}}
  else {c.beginPath();c.moveTo(0,-21);c.bezierCurveTo(15,-4,18,11,0,19);c.bezierCurveTo(-16,12,-14,0,-4,-4);c.quadraticCurveTo(-4,8,2,10);c.quadraticCurveTo(9,3,0,-21);c.stroke();}
 }else if(type==='moon'){c.beginPath();c.arc(0,0,19,.6,5.7);c.bezierCurveTo(0,-9,-7,10,16,11);c.stroke();}
 else if(type==='key'){c.beginPath();c.arc(0,-11,9,0,Math.PI*2);c.stroke();caLine(c,0,-2,0,23);caLine(c,0,20,10,20);caLine(c,0,13,7,13);}
 else if(type==='leaf'||type==='flower'){caLeaf(c,0,0,21,-.65,caRGBA(a,.42));if(type==='flower')for(let i=0;i<5;i++){const t=i*Math.PI*.4;c.fillStyle=caRGBA('#e2c3cf',.8);c.beginPath();c.ellipse(Math.cos(t)*9,Math.sin(t)*9,8,4,t,0,Math.PI*2);c.fill();}}
 else if(type==='drop'){c.beginPath();c.moveTo(0,-24);c.bezierCurveTo(-25,9,-12,24,0,24);c.bezierCurveTo(12,24,25,9,0,-24);c.stroke();}
 else if(type==='gear'){caGear(c,0,0,21,a);}
 else if(type==='clock'){c.beginPath();c.arc(0,0,22,0,Math.PI*2);c.stroke();caLine(c,0,0,-8,-13);caLine(c,0,0,0,-18);}
 else if(type==='orbit'){for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,25,10,i*Math.PI/3,0,Math.PI*2);c.stroke();}}
 else if(type==='infinity'){c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-34,-39,-38,37,0,0);c.bezierCurveTo(38,-37,34,39,0,0);c.stroke();}
 else if(type==='laurel'){for(const dir of [-1,1]){c.beginPath();c.moveTo(0,22);c.quadraticCurveTo(dir*28,5,dir*12,-23);c.stroke();for(let i=0;i<5;i++)caLeaf(c,dir*(15+Math.sin(i)*3),17-i*8,7,dir*(.8+i*.07),caRGBA(a,.7));}}
 else if(type==='quill'){c.beginPath();c.moveTo(-14,25);c.quadraticCurveTo(8,-26,24,-24);c.quadraticCurveTo(28,-5,-6,14);c.stroke();caLine(c,-14,25,21,-21);}
 else if(type==='folio'||type==='score'){c.strokeRect(-23,-19,46,38);caLine(c,0,-19,0,19);for(let i=0;i<4;i++){caLine(c,-18,-10+i*7,-5,-8+i*7);caLine(c,5,-8+i*7,18,-10+i*7);}}
 else if(type==='seal'){c.beginPath();c.arc(0,0,21,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,16,0,Math.PI*2);c.stroke();caStar(c,0,0,9,a);}
 else if(type==='branch'){caLine(c,0,24,0,-23);for(let i=0;i<5;i++){const y=13-i*8,dir=i%2?1:-1;caLine(c,0,y,dir*15,y-11);caLeaf(c,dir*14,y-10,8,dir*.65,caRGBA(a,.55));}}
 else if(type==='crystal'){caCrystal(c,0,24,27,49,a);}
 else if(type==='pendulum'){caLine(c,0,-23,0,17);c.beginPath();c.arc(0,18,8,0,Math.PI*2);c.stroke();}
 else {caStar(c,0,0,17,a);}
}
function caProp(c,profile){
 const {prop,id,accent:a,variant}=profile;
 c.strokeStyle=a;c.lineWidth=1;
 if(prop==='candle'){
  if(id==='fables'){caCandle(c,-25,55,52,a);caCandle(c,25,56,70,a);caCandle(c,0,64,37,a);}
  else {if(id==='dawn'){c.strokeStyle=caRGBA(a,.23);c.beginPath();c.arc(0,-16,35,Math.PI,0);c.lineTo(35,42);c.moveTo(-35,-16);c.lineTo(-35,42);c.stroke();}caCandle(c,0,64,id==='lastcandle'?32:75,a);}
 }else if(prop==='quill'){
  c.fillStyle=caMetal(c,-22,44,a);caRR(c,-22,28,44,30,5);c.fill();c.fillStyle='#142726';caRR(c,-15,20,30,13,3);c.fill();c.strokeStyle=caRGBA(a,.9);c.lineWidth=1.2;
  caLine(c,0,33,33,-64);c.beginPath();c.moveTo(6,5);c.quadraticCurveTo(-9,-45,32,-66);c.quadraticCurveTo(41,-28,6,5);c.fillStyle='#dcd7b8';c.fill();caLine(c,6,5,32,-66);c.strokeStyle='#80938a88';for(let i=0;i<9;i++)caLine(c,9+i*2,0-i*6,22+i*1.4,-14-i*5);
  c.fillStyle='#cebb92';c.save();c.translate(-24,69);c.rotate(.05);c.fillRect(-24,-7,65,11);c.restore();
 }else if(['folio','scroll','volumes','crest','seal'].includes(prop)){
  if(prop==='volumes'){for(let i=0;i<5;i++)caBook(c,-34+i*17,64,15,65+(i%3)*16,['#56665a','#635574','#8b7450'][i%3],(i-2)*.015);}
  else if(prop==='scroll'){c.save();c.rotate(-.16);const g=c.createLinearGradient(-40,0,40,0);g.addColorStop(0,'#a38c63');g.addColorStop(.2,'#dfcfaa');g.addColorStop(.8,'#e2d3b0');g.addColorStop(1,'#a58a60');c.fillStyle=g;c.fillRect(-36,-35,72,92);c.fillStyle=caMetal(c,-45,90,a);caRR(c,-45,-39,90,9,4);c.fill();caRR(c,-45,53,90,9,4);c.fill();c.strokeStyle='#927d5955';for(let i=0;i<8;i++)caLine(c,-23,-20+i*9,23-(i%2)*12,-20+i*9);c.strokeStyle='#704841';caLine(c,-40,12,40,12);c.restore();}
  else if(prop==='seal'){caFolio(c,a,id,true);c.save();c.translate(0,15);c.scale(1.2,1.2);caSymbol(c,id==='frozenseal'?'snow':'seal',a);c.restore();}
  else {caFolio(c,a,id);if(prop==='crest'){c.save();c.translate(0,-43);caSymbol(c,'laurel',a);c.restore();}}
 }else if(prop==='bell'||prop==='bellclock'){
  if(prop==='bellclock'){c.save();c.translate(0,26);c.scale(.74,.74);caProp(c,{...profile,prop:'clock',id:'strikes'});c.restore();}
  c.fillStyle=caMetal(c,-40,80,a);c.beginPath();c.moveTo(-12,-43);c.bezierCurveTo(-35,-38,-25,-9,-41,7);c.quadraticCurveTo(0,18,41,7);c.bezierCurveTo(25,-9,35,-38,12,-43);c.closePath();c.fill();c.strokeStyle='#d9c491';c.lineWidth=.8;c.stroke();c.beginPath();c.ellipse(0,7,40,5,0,0,Math.PI*2);c.stroke();c.fillStyle=a;c.beginPath();c.arc(0,16,5,0,Math.PI*2);c.fill();caLine(c,0,-43,0,-62);
 }else if(['metronome','pendulum'].includes(prop)){
  c.fillStyle='#3b342a';c.beginPath();c.moveTo(-35,69);c.lineTo(-17,-63);c.lineTo(17,-63);c.lineTo(35,69);c.closePath();c.fill();c.strokeStyle='#b79b67';c.stroke();c.fillStyle='#162723';c.fillRect(-11,-49,22,103);c.strokeStyle=a;caLine(c,0,-49,0,40);for(let i=0;i<7;i++)caLine(c,-8,-40+i*11,8,-40+i*11);c.fillStyle=caMetal(c,-20,40,a);c.beginPath();c.arc(0,45,15,0,Math.PI*2);c.fill();
 }else if(prop==='clock'||prop==='gauge'){
  const y=-5;c.fillStyle=caMetal(c,-48,96,a);c.beginPath();c.arc(0,y,47,0,Math.PI*2);c.fill();c.fillStyle='#1c302b';c.beginPath();c.arc(0,y,39,0,Math.PI*2);c.fill();c.strokeStyle=caRGBA(a,.65);c.lineWidth=1;
  for(let i=0;i<60;i++){const t=i*Math.PI/30,rr=i%5?35:31;caLine(c,Math.sin(t)*rr,y-Math.cos(t)*rr,Math.sin(t)*37,y-Math.cos(t)*37);}
  let hour=id==='eleven'?11:id==='afterhours'?0:id==='strikes'?12:9;const ha=hour*Math.PI/6;c.strokeStyle='#ead7a3';c.lineWidth=2;caLine(c,0,y,Math.sin(ha)*24,y-Math.cos(ha)*24);caLine(c,0,y,prop==='gauge'?24:0,prop==='gauge'?y-14:y-32);c.fillStyle=a;c.beginPath();c.arc(0,y,3,0,Math.PI*2);c.fill();c.fillStyle='#4a4331';c.fillRect(-17,42,34,8);c.fillStyle=caMetal(c,-33,66,a);c.fillRect(-33,52,66,7);
 }else if(prop==='hourglass'){
  for(const x of [-30,30]){c.fillStyle=caMetal(c,x-3,6,a);c.fillRect(x-3,-52,6,109);}c.strokeStyle='#d4dfd181';c.lineWidth=1;c.beginPath();c.moveTo(-24,-47);c.bezierCurveTo(-28,-10,-2,-12,-2,0);c.bezierCurveTo(-3,12,-27,16,-24,48);c.lineTo(24,48);c.bezierCurveTo(27,16,3,12,2,0);c.bezierCurveTo(2,-12,28,-10,24,-47);c.closePath();c.fillStyle='#9ab6b319';c.fill();c.stroke();c.fillStyle='#d9c08a';c.beginPath();c.moveTo(-19,45);c.quadraticCurveTo(0,26,19,45);c.closePath();c.fill();caLine(c,0,-25,0,29);for(const y of [-58,55]){c.fillStyle=caMetal(c,-38,76,a);caRR(c,-38,y,76,7,3);c.fill();}
 }else if(prop==='gear'){
  caGear(c,-12,-13,37,a);caGear(c,29,33,24,a);caGear(c,-35,50,16,a);
 }else if(prop==='compass'){
  c.save();c.translate(0,12);c.beginPath();c.arc(0,0,44,0,Math.PI*2);c.fillStyle='#263e40';c.fill();c.strokeStyle=a;c.stroke();for(let i=0;i<8;i++){c.save();c.rotate(i*Math.PI/4);c.beginPath();c.moveTo(0,-36);c.lineTo(5,-4);c.lineTo(0,0);c.lineTo(-5,-4);c.closePath();c.fillStyle=i%2?'#668990':a;c.fill();c.restore();}c.restore();
 }else if(prop==='crystal'){
  caGlow(c,0,13,52,a,.12);caCrystal(c,-25,61,26,83,a);caCrystal(c,1,64,35,126,a);caCrystal(c,29,62,23,71,a);
 }else if(prop==='window'){
  c.strokeStyle=caRGBA(a,.6);c.lineWidth=2;c.beginPath();c.moveTo(-43,64);c.lineTo(-43,-28);c.arc(0,-28,43,Math.PI,0);c.lineTo(43,64);c.closePath();c.fillStyle=caRGBA(a,.08);c.fill();c.stroke();caLine(c,0,-70,0,64);caLine(c,-42,-2,42,-2);caLine(c,-42,35,42,35);
  c.strokeStyle=caRGBA(a,.18);c.lineWidth=1;for(let i=0;i<9;i++){let x=-34+i*8,y=-32+(i%3)*29;caLine(c,x,y,x-2,y+22);}
 }else if(prop==='branch'||prop==='plant'){
  c.strokeStyle=caRGBA(a,.55);c.lineWidth=2;c.beginPath();c.moveTo(0,54);c.bezierCurveTo(-7,17,10,-23,0,-55);c.stroke();
  for(let i=0;i<(id==='shoot'?4:8);i++){const side=i%2?1:-1,y=40-i*12,x=side*(17+(i%3)*4);caLine(c,2,y+6,x,y-9);caLeaf(c,x,y-9,id==='whisper'?6:12,side*.55,caRGBA(a,id==='whisper'?.25:.55));if(id==='blossom'&&i%2){c.save();c.translate(x+4,y-14);c.scale(.34,.34);caSymbol(c,'flower','#dfb9cc');c.restore();}}
  if(prop==='plant'){const g=c.createLinearGradient(-29,0,29,0);g.addColorStop(0,'#503e2c');g.addColorStop(.4,'#967557');g.addColorStop(1,'#4c3a2c');c.fillStyle=g;c.beginPath();c.moveTo(-29,40);c.lineTo(29,40);c.lineTo(22,70);c.lineTo(-22,70);c.closePath();c.fill();c.fillStyle='#c4aa7266';c.fillRect(-30,39,60,4);}
 }else if(prop==='arch'){
  c.strokeStyle=a;c.lineWidth=3;c.beginPath();c.moveTo(-44,66);c.lineTo(-44,-19);c.arc(0,-19,44,Math.PI,0);c.lineTo(44,66);c.stroke();c.lineWidth=1;
  if(id==='gate'){for(let x=-32;x<=32;x+=16){caLine(c,x,-18,x,63);c.beginPath();c.arc(x,-23,5,0,Math.PI*2);c.stroke();}for(const y of [9,50])caLine(c,-42,y,42,y);c.save();c.translate(-42,-50);c.scale(.9,.9);caSymbol(c,'branch',a);c.restore();}
  else{c.fillStyle='#081919c0';c.fillRect(-34,-17,61,80);c.fillStyle=caRGBA(a,.18);c.beginPath();c.moveTo(26,-18);c.lineTo(39,-9);c.lineTo(39,61);c.lineTo(26,64);c.closePath();c.fill();caGlow(c,33,55,32,a,.07);}
 }else if(prop==='brazier'){
  if(id==='spark'){c.strokeStyle='#e3d1ad55';c.lineWidth=1;c.beginPath();c.moveTo(-36,49);c.lineTo(-36,-9);c.arc(0,-9,36,Math.PI,0);c.lineTo(36,49);c.stroke();caGlow(c,0,29,35,a,.25);c.save();c.translate(0,27);c.scale(.5,.5);caSymbol(c,'flame',a);c.restore();}
  else {c.fillStyle=caMetal(c,-40,80,a);c.beginPath();c.ellipse(0,41,40,17,0,0,Math.PI);c.closePath();c.fill();c.strokeStyle=a;c.lineWidth=2;caLine(c,-25,51,-31,70);caLine(c,25,51,31,70);c.fillStyle='#5c4130';for(let i=0;i<4;i++){c.save();c.translate((i-1.5)*14,35+(i%2)*5);c.rotate((i-1.5)*.2);c.fillRect(-12,-3,24,6);c.restore();}caGlow(c,0,28,42,'#d58b4a',.24);}
 }else if(prop==='telescope'){
  c.strokeStyle='#8b7957';c.lineWidth=3;caLine(c,0,23,-27,69);caLine(c,0,23,32,69);caLine(c,0,23,3,72);c.save();c.rotate(-.35);c.fillStyle=caMetal(c,-44,88,a);caRR(c,-44,-18,88,25,5);c.fill();c.strokeStyle='#ead4a275';c.stroke();c.fillStyle='#162a2b';c.beginPath();c.ellipse(-43,-5,5,14,0,0,Math.PI*2);c.fill();c.restore();
 }else if(prop==='orrery'||prop==='constellation'){
  if(prop==='orrery'){c.save();c.translate(0,0);c.strokeStyle=caRGBA(a,.7);for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,46,17+i*7,i*.65,0,Math.PI*2);c.stroke();}c.fillStyle=caMetal(c,-9,18,a);c.beginPath();c.arc(0,0,9,0,Math.PI*2);c.fill();c.fillStyle='#a5bccc';c.beginPath();c.arc(40,9,4,0,Math.PI*2);c.fill();caLine(c,0,43,0,64);caLine(c,-26,65,26,65);c.restore();}
  else{c.fillStyle='#142c3766';caRR(c,-47,-55,94,118,6);c.fill();c.strokeStyle=caRGBA(a,.3);c.stroke();const pts=[[-30,-25],[-5,-44],[26,-20],[35,11],[2,32],[-27,48],[-30,-25]];c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();for(const[x,y]of pts.slice(0,-1))caStar(c,x,y,3,a);}
 }else if(prop==='key'){
  c.save();c.rotate(.18);c.strokeStyle=caMetal(c,-22,44,a);c.lineWidth=4;c.beginPath();c.arc(0,-35,20,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,-35,12,0,Math.PI*2);c.stroke();caLine(c,0,-15,0,65);caLine(c,0,58,22,58);caLine(c,0,42,16,42);c.restore();
 }else if(prop==='curtain'){
  for(let i=0;i<8;i++){const x=-48+i*12;const g=c.createLinearGradient(x,0,x+12,0);g.addColorStop(0,'#272233');g.addColorStop(.42,caRGBA(a,.42));g.addColorStop(1,'#252431');c.fillStyle=g;c.beginPath();c.moveTo(x,-64);c.lineTo(x+12,-64);c.quadraticCurveTo(x+5,0,x+10,62);c.quadraticCurveTo(x+6,75,x,63);c.closePath();c.fill();}c.strokeStyle='#b89d6155';c.lineWidth=2;caLine(c,-50,-63,50,-63);
 }
}
/** Called into an offscreen room layer: no per-frame texture generation. */
export function paintChapterDecoration(c,profile){
 const room=roomForChapter(profile.level),a=profile.accent;
 c.save();
 // Gentle chapter-specific values stay at the architectural edges.
 for(const [x,w]of [[28,184],[991,174]]){const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,caRGBA(a,.008));g.addColorStop(.52,caRGBA(a,.066));g.addColorStop(1,caRGBA(a,.009));c.fillStyle=g;c.fillRect(x,164,w,489);}
 // Existing upper books retained in silhouette, with the chapter's material.
 for(let i=0;i<3;i++)caBook(c,91+i*32,386,23+i%2*8,84+(i%3)*12,caRGBA(a,.37),(i-1)*.025);
 // Cabinet backing makes the still life look mounted rather than a HUD label.
 c.save();c.beginPath();c.rect(65,418,137,178);c.clip();
 const back=c.createRadialGradient(136,511,18,136,511,105);back.addColorStop(0,'#102c24b0');back.addColorStop(.55,'#102c2490');back.addColorStop(1,'#102c2400');c.fillStyle=back;c.fillRect(66,419,136,176);
 c.strokeStyle=caRGBA(room.wash,.20);c.lineWidth=.8;caLine(c,79,586,194,586);
 c.translate(136,505);c.globalAlpha=.91;caProp(c,profile);c.restore();
 // A persistent wing landmark anchors the journey; chapter still lifes remain left.
 paintWingLandmark(c,profile);
 // A fine local motif near the manuscript margin: never behind actual letters.
 c.save();c.beginPath();c.rect(214,195,15,432);c.clip();c.globalAlpha=.12;c.translate(217,320+profile.variant*22);c.scale(.58,.58);caSymbol(c,profile.inlay,a);c.restore();
 c.restore();
}
/** Small ambient accents. time is the already frozen/slowed world presentation time. */
export function paintChapterMotion(c,profile,time,motion=true){
 if(!motion)return;
 const {id,accent:a}=profile;
 c.save();c.beginPath();c.rect(74,421,120,170);c.clip();
 if(['rain','breath','whisper'].includes(id)){
  c.strokeStyle=caRGBA(a,id==='rain'?.24:.13);c.lineWidth=.7;
  for(let i=0;i<(id==='rain'?12:5);i++){const x=93+(i*23)%83,y=424+((time*(id==='rain'?16:5)+i*31)%148);caLine(c,x,y,x-1.5,y+(id==='rain'?9:2));}
 }else if(['kindling','flame','warmink','fables','burning','spark'].includes(id)){
  const strength=.025+(.5+.5*Math.sin(time*2))*.018;caGlow(c,132,543,55,a,strength);
  for(let i=0;i<3;i++){const k=(time*.17+i*.31)%1;c.globalAlpha=Math.sin(k*Math.PI)*.26;c.fillStyle='#eeb778';c.fillRect(119+i*11+Math.sin(k*5+i)*5,554-k*47,1.2,1.8);}
 }else if(['starfall','starlit','constellations','orbit','celestial'].includes(id)){
  for(let i=0;i<5;i++){const alpha=.16+Math.sin(time*.6+i)**2*.15;c.globalAlpha=alpha;caStar(c,91+(i*23)%93,446+(i*31)%120,1.5,a);}
 }else if(['dawn','lastcandle','afterhours'].includes(id)){
  caGlow(c,135,profile.id==='lastcandle'?542:472,43,a,.025+Math.sin(time*1.7)**2*.018);
 }
 c.restore();
}

/** One legible physical landmark per wing, cached with the chapter's scene layer.
 * Bounded to the upper-right shelf: no part crosses the live word corridor.
 */
export const WING_LANDMARKS=Object.freeze([
 {id:'reading-folio',prop:'folio',motif:'sun'},
 {id:'glasshouse-tree',prop:'plant',motif:'leaf'},
 {id:'clockwork-engine',prop:'gear',motif:'clock'},
 {id:'frost-monolith',prop:'crystal',motif:'snow'},
 {id:'ember-hearth',prop:'brazier',motif:'flame'},
 {id:'astral-orrery',prop:'orrery',motif:'star'},
 {id:'midnight-key',prop:'key',motif:'moon'},
 {id:'eternal-crest',prop:'crest',motif:'laurel'}
].map(Object.freeze));
export function wingLandmarkForLevel(level){return WING_LANDMARKS[Math.max(0,Math.min(7,Math.floor(((Number(level)||1)-1)/6)))];}
export function paintWingLandmark(c,profile){
 const landmark=wingLandmarkForLevel(profile.level),room=roomForChapter(profile.level),a=room.wash;
 c.save();c.beginPath();c.rect(998,217,150,174);c.clip();
 // A recessed cabinet, a contact shadow, and light from the real right-hand lamp.
 const recess=c.createRadialGradient(1071,313,18,1071,313,105);recess.addColorStop(0,'#0b201dcc');recess.addColorStop(1,'#0b201d00');c.fillStyle=recess;c.fillRect(998,217,150,174);
 c.fillStyle='#100e0d75';c.beginPath();c.ellipse(1070,382,51,6,-.025,0,Math.PI*2);c.fill();
 const wash=c.createRadialGradient(1023,250,0,1023,250,147);wash.addColorStop(0,caRGBA(room.lamp,.11));wash.addColorStop(1,caRGBA(room.lamp,0));c.fillStyle=wash;c.fillRect(998,217,150,174);
 c.save();c.translate(1070,307);c.globalAlpha=.94;c.shadowColor='#030d0ca0';c.shadowBlur=4;c.shadowOffsetX=3;c.shadowOffsetY=3;
 caProp(c,{...profile,prop:landmark.prop,id:landmark.id,accent:a});c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;
 // Distinct secondary silhouettes are physically related, not floating HUD glyphs.
 if(landmark.prop==='plant'){c.strokeStyle=caRGBA('#e3e5cd',.18);c.lineWidth=1;c.beginPath();c.moveTo(-49,72);c.lineTo(-49,-20);c.arc(0,-20,49,Math.PI,0);c.lineTo(49,72);c.stroke();}
 if(landmark.prop==='brazier'){c.save();c.translate(0,17);c.scale(.9,.9);caSymbol(c,'flame','#edb26b');c.restore();}
 if(landmark.prop==='key'){c.strokeStyle=caRGBA(a,.27);c.lineWidth=2;c.beginPath();c.arc(0,-16,48,Math.PI,0);c.lineTo(48,71);c.moveTo(-48,-16);c.lineTo(-48,71);c.stroke();}
 c.restore();
 // Fine age/patina and shelf grain: deterministic and generated once, not per frame.
 c.strokeStyle=caRGBA(a,.08);c.lineWidth=.6;
 for(let i=0;i<11;i++){const y=376+(i%3)*3,x=1012+(i*19)%114;caLine(c,x,y,Math.min(1137,x+13),y+.8);}
 c.strokeStyle='#c3a06a55';c.lineWidth=1;caLine(c,1006,389,1140,389);c.restore();
}
