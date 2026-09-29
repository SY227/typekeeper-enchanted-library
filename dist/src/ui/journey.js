import { WINGS } from '../data/campaign.js?v=3.6.3-447ce8d517d13011';
export const WING_MARKS=Object.freeze([
 {id:'folio',name:'Reading Room',path:'M5 9Q12 6 20 10Q28 6 35 9V30Q28 27 20 31Q12 27 5 30ZM20 10V31M9 14L16 14M24 14L31 14M9 19L16 19M24 19L31 19'},
 {id:'leaf',name:'Glasshouse',path:'M10 31Q11 13 31 7Q32 28 10 31ZM10 31L27 12M18 23L16 17M22 19L27 21'},
 {id:'clock',name:'Clockwork Hall',path:'M20 5A15 15 0 1 1 19.99 5ZM20 9V12M31 20H28M20 31V28M9 20H12M20 13V20L27 24'},
 {id:'crystal',name:'Frost Archive',path:'M20 4L32 15L29 29L20 36L11 29L8 15ZM20 4V36M8 15L20 20L32 15M11 29L20 20L29 29'},
 {id:'ember',name:'Ember Stacks',path:'M20 4C28 17 14 18 26 26C32 22 31 16 30 14C42 32 24 38 20 35C5 35 4 23 11 14C11 22 15 23 16 19C18 15 21 10 20 4Z'},
 {id:'orbit',name:'Astral Gallery',path:'M5 21C5 11 35 11 35 21C35 31 5 31 5 21ZM13 6C23 3 34 33 25 36C15 39 4 9 13 6ZM20 17A4 4 0 1 1 19.99 17'},
 {id:'key',name:'Midnight Vault',path:'M17 6A8 8 0 1 1 16.99 6ZM17 11A3 3 0 1 1 16.99 11M17 22V36M17 29H28V34M17 25H24'},
 {id:'quill',name:'Eternal Library',path:'M9 34L28 10M13 28Q6 19 19 10L34 4Q35 21 23 26L13 28ZM17 22L26 22M21 17L30 16M8 36H29'}
].map(Object.freeze));
export function wingMark(wing,classes=''){
 const mark=WING_MARKS[Math.max(0,Math.min(7,(Number(wing)||1)-1))];
 return `<svg class="wing-mark ${classes}" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${mark.path}"/></svg>`;
}
export function chapterJourney(mode,level){
 if(mode!=='campaign'||!Number.isInteger(level)||level<1||level>48||level%6!==0)return null;
 const index=level/6-1,finale=level===48,w=WINGS[index];
 return {kind:finale?'finale':'wing',wing:index+1,level,title:finale?'You are the Typekeeper.':`${WING_MARKS[index].name} restored.`,subtitle:finale?'Every story has a keeper. These stories have you.':w.story,detail:finale?'48 chapters · eight wings · one library':`Chapters ${String(level-5).padStart(2,'0')}–${String(level).padStart(2,'0')} saved`,color:w.color};
}
export function completedWings(progress){
 return WINGS.map((_,i)=>Array.from({length:6},(_,j)=>progress?.stages?.[i*6+j+1]?.campaignClear===true).every(Boolean));
}
export function journeySealsHTML(earned=0,{animate=false,finale=false}={}){
 return `<div class="journey-seals ${animate?'animated-seals':''}" aria-label="${earned} of 8 wings restored">${WINGS.map((w,i)=>`<span class="journey-seal ${i<earned&&(!animate||!finale&&i<earned-1)?'lit':''}" data-journey-seal="${i+1}" style="--seal-color:${w.color}" title="${w.name}">${wingMark(i+1)}<small>${w.seal}</small></span>`).join('')}</div>`;
}
