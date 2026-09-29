/** Library Edition v2 authored campaign. These are design values, not video measurements. */
export const CAMPAIGN_LENGTH = 48;
export const WINGS = Object.freeze([
  {name:'The Reading Room',subtitle:'Find your rhythm',color:'#9bc8a5',seal:'I',story:'Every great story begins with a single word.',titles:['First Light','Ink & Paper','A Quiet Rhythm','The First Spark','Between the Lines','The Opening Bell']},
  {name:'The Glasshouse',subtitle:'Let your focus grow',color:'#9ed4ba',seal:'II',story:'Past the window, a thousand stories are beginning to bloom.',titles:['Emerald Leaves','A Growing Tale','Branches of Thought','Rain on Glass','Hidden Blossoms','The Garden Gate']},
  {name:'The Clockwork Hall',subtitle:'Make every second count',color:'#e4c27b',seal:'III',story:'The clocks do not hurry. They simply ask you to keep up.',titles:['Golden Gears','A Measured Beat','Pendulum Pages','Stolen Seconds','The Eleventh Hour','The Clock Strikes']},
  {name:'The Frost Archive',subtitle:'Keep a cool head',color:'#9edce7',seal:'IV',story:'Beneath the frost, old words are waiting to be heard.',titles:['Silver Breath','Crystal Margins','The Still Page','Winter Whispers','Cold Precision','The Frozen Seal']},
  {name:'The Ember Stacks',subtitle:'Turn pressure into purpose',color:'#f2ad7a',seal:'V',story:'A spark of courage is all it takes to light the way.',titles:['Kindling','Letters of Flame','The Warmest Ink','Firelight Fables','Under Pressure','The Burning Chapter']},
  {name:'The Astral Gallery',subtitle:'Reach beyond the familiar',color:'#bcb8ed',seal:'VI',story:'The shelves end here. The imagination does not.',titles:['Starlit Script','The Long View','Celestial Signs','Orbiting Ideas','Constellations','The Starfall Trial']},
  {name:'The Midnight Vault',subtitle:'Trust your instincts',color:'#b1c7e8',seal:'VII',story:'Some stories reveal themselves only in the quiet of midnight.',titles:['After Hours','Secret Passages','Velvet Shadows','The Lost Manuscript','One Last Candle','The Midnight Key']},
  {name:'The Eternal Library',subtitle:'Become the Typekeeper',color:'#f0d59a',seal:'VIII',story:'You have saved the stories. Now write the ending.',titles:['The Final Volume','Pages Without End','A Thousand Voices','The Master Scribe','The Last Word','The Typekeeper']}
]);
export function stageInfo(level) {
  const n=Math.max(1,Math.floor(Number(level)||1));
  if(n>CAMPAIGN_LENGTH)return {level:n,wing:9,wingName:'The Endless Shelf',wingStage:n-CAMPAIGN_LENGTH,title:`Beyond the binding · ${n-CAMPAIGN_LENGTH}`,subtitle:'The story goes on',color:'#d5b2ef',seal:'∞',story:'There is always another story.',trial:n%6===0,endless:true};
  const index=Math.floor((n-1)/6),w=WINGS[index];
  return {level:n,wing:index+1,wingName:w.name,wingStage:(n-1)%6+1,title:w.titles[(n-1)%6],subtitle:w.subtitle,color:w.color,seal:w.seal,story:w.story,trial:n%6===0,endless:false};
}
export const CAMPAIGN = Object.freeze(Array.from({length:CAMPAIGN_LENGTH},(_,i)=>Object.freeze(stageInfo(i+1))));
export const MEDAL_RULES=Object.freeze([
 Object.freeze({medal:3,missed:0,wrong:0}),Object.freeze({medal:2,missed:2,wrong:3})
]);
export function medalForStage({missed=0,wrong=0}) {return MEDAL_RULES.find(r=>missed<=r.missed&&wrong<=r.wrong)?.medal||1;}
/** A next-star explanation, not a second implementation of the scoring rules. */
export function medalFeedback(stage={}) {
 const missed=Math.max(0,Math.floor(Number(stage.missed)||0)),wrong=Math.max(0,Math.floor(Number(stage.wrong)||0));
 const medal=medalForStage({missed,wrong}),next=MEDAL_RULES.find(r=>r.medal===medal+1);
 if(!next)return {medal,missed,wrong,next:null,missesToAvoid:0,wrongToAvoid:0,message:'Three stars: no missed words or wrong submissions.'};
 const missesToAvoid=Math.max(0,missed-next.missed),wrongToAvoid=Math.max(0,wrong-next.wrong),parts=[];
 if(missesToAvoid)parts.push(`miss ${missesToAvoid} fewer ${missesToAvoid===1?'word':'words'}`);
 if(wrongToAvoid)parts.push(`make ${wrongToAvoid} fewer wrong ${wrongToAvoid===1?'submission':'submissions'}`);
 return {medal,missed,wrong,next:next.medal,missesToAvoid,wrongToAvoid,message:`For ${next.medal===2?'two':'three'} stars, ${parts.join(' and ')}.`};
}
export function rankForStage(level=1) {
  return ['Apprentice','Page Keeper','Wordsmith','Archivist','Spell Scribe','Master Typist','Lorekeeper','Typekeeper'][Math.min(7,Math.max(0,Math.floor((level-1)/6)))];
}
