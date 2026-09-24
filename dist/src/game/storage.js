import { RULESET_VERSION, POWERS } from './rules.js';
const KEY='typekeeper-enchanted-library-v3.2';
const OLD_KEYS=['typekeeper-enchanted-library-v3.1','typekeeper-enchanted-library-v3','typing-maniac-library-v2','typing-maniac-library-v1'];
const PACE_NAMES=['classic','relaxed','maniac'];
export const DEFAULT_SETTINGS=Object.freeze({sfx:true,music:true,adaptiveMusic:true,typingShimmer:true,muted:false,motion:true,spellPulse:true,contrast:false,detailedHUD:false,hints:true,resumeCountdown:true,pace:'classic',volume:.8,musicVolume:.5,sfxVolume:.65});
const saneNumber=(n,min=0,max=1e12)=>Number.isFinite(n)&&n>=min&&n<=max;
function emptyProgress(){return Object.fromEntries(PACE_NAMES.map(p=>[p,{unlocked:1,stages:{}}]));}
function sameRecord(r){return `${r.date}/${r.score}/${r.seed}/${r.ruleset}/${r.mode}/${r.startLevel}`;}
/** Local-only saves. Original v3/v2 keys are never deleted or overwritten by migration. */
export class LocalStore {
 constructor(storage){
  this.storage=storage;this.available=Boolean(storage);
  this.data={version:3,settings:{...DEFAULT_SETTINGS},records:[],progress:emptyProgress(),checkpoints:{}};
  this.load();
 }
 load(){
  for(const key of [KEY,...OLD_KEYS]){
   let raw;try{raw=this.storage?.getItem(key);}catch{this.available=false;return;}
   if(!raw)continue;
   try{this.importData(JSON.parse(raw),false);if(key!==KEY)this.save();return;}
   catch{
    // Preserve invalid bytes before any later save. Recovery is bounded to one
    // key per version; a malformed current save does not hide an intact v3 save.
    try{this.storage?.setItem(`${key}-recovery`,raw);}catch{this.available=false;return;}
   }
  }
 }
 importData(parsed,persist=true){
  if(!parsed||![1,2,3].includes(parsed.version))throw new Error('This is not a supported Typekeeper save.');
  const settings=parsed.settings||{};
  for(const key of Object.keys(DEFAULT_SETTINGS)){
   if(typeof DEFAULT_SETTINGS[key]==='boolean'&&typeof settings[key]==='boolean')this.data.settings[key]=settings[key];
  }
  if(PACE_NAMES.includes(settings.pace))this.data.settings.pace=settings.pace;
  for(const key of ['volume','musicVolume','sfxVolume'])if(saneNumber(settings[key],0,1))this.data.settings[key]=settings[key];
  if(Array.isArray(parsed.records)){
   const ids=new Set(this.data.records.map(sameRecord));
   const rows=parsed.records.filter(r=>r&&saneNumber(r.score)&&saneNumber(r.level,1,10000)&&saneNumber(r.date,0,Date.now()+86400000)&&PACE_NAMES.includes(r.pace)).slice(0,200);
   for(const input of rows){
    const r=this.sanitizeRecord(input),id=sameRecord(r);
    if(!ids.has(id)){this.data.records.push(r);ids.add(id);}
   }
   this.sortRecords();
  }
  for(const pace of PACE_NAMES){
   const incoming=parsed.progress?.[pace];if(!incoming)continue;
   for(const [key,row] of Object.entries(incoming.stages||{})){
    const level=Number(key);if(!Number.isInteger(level)||level<1||level>48||!row||!saneNumber(row.medal,1,3))continue;
    const previous=this.data.progress[pace].stages[level];
    const sanitized={campaignClear:row.campaignClear!==false,medal:Math.floor(row.medal),score:saneNumber(row.score)?row.score:0,wpm:saneNumber(row.wpm,0,1000)?row.wpm:0,accuracy:saneNumber(row.accuracy,0,100)?row.accuracy:0,ruleset:typeof row.ruleset==='string'?row.ruleset.slice(0,64):'library-edition-2.0.0'};
    if(!previous)this.data.progress[pace].stages[level]=sanitized;
    else if(previous.ruleset===sanitized.ruleset){
     for(const field of ['medal','score','wpm','accuracy'])previous[field]=Math.max(previous[field]||0,sanitized[field]);previous.campaignClear=previous.campaignClear||sanitized.campaignClear;
    }else if(sanitized.ruleset===RULESET_VERSION){
     this.data.progress[pace].stages[level]={...sanitized,campaignClear:previous.campaignClear||sanitized.campaignClear,medal:Math.max(previous.medal,sanitized.medal),legacyScore:previous.score};
    }else {previous.medal=Math.max(previous.medal,sanitized.medal);previous.campaignClear=previous.campaignClear||sanitized.campaignClear;}
   }
   let unlocked=1;while(unlocked<48&&this.data.progress[pace].stages[unlocked]?.campaignClear)unlocked++;
   this.data.progress[pace].unlocked=unlocked;
  }
  for(const pace of PACE_NAMES){
   const cp=parsed.checkpoints?.[pace];
   if(this.validCheckpoint(cp)&&cp.pace===pace)this.data.checkpoints[pace]=this.normalizeCheckpoint(cp);
  }
  if(persist)this.save();return true;
 }
 sanitizeRecord(input){
  const ruleset=typeof input.ruleset==='string'?input.ruleset.slice(0,64):'library-edition-1.0.0';
  const originalMode=['campaign','practice','endless','legacy'].includes(input.mode)?input.mode:'legacy';
  const row={score:input.score,level:input.level,date:input.date,pace:input.pace,ruleset,
   mode:ruleset===RULESET_VERSION?originalMode:'legacy',legacyMode:input.legacyMode||originalMode,
   victory:!!input.victory,retired:!!input.retired};
  for(const key of ['words','streak','missed','seconds','medals','cleared','seed','burned','retries'])row[key]=saneNumber(input[key])?input[key]:0;
  row.startLevel=saneNumber(input.startLevel,1,10000)?input.startLevel:1;
  row.wpm=saneNumber(input.wpm,0,1000)?input.wpm:0;row.accuracy=saneNumber(input.accuracy,0,100)?input.accuracy:0;
  return row;
 }
 normalizeCheckpoint(cp){
  const c=structuredClone(cp);
  if(c.version===2){c.version=3;c.ruleset=c.ruleset||'library-edition-2.0.0';}
  c.powerBag=Array.isArray(c.powerBag)?c.powerBag:[];
  c.retries=saneNumber(c.retries)?c.retries:0;c.burned=saneNumber(c.burned)?c.burned:0;
  c.casts=Object.fromEntries(POWERS.map(p=>[p,saneNumber(c.casts?.[p])?c.casts[p]:0]));
  return c;
 }
 validCheckpoint(c){
  return !!(c&&[2,3].includes(c.version)&&PACE_NAMES.includes(c.pace)&&c.mode==='campaign'
   &&Number.isInteger(c.nextLevel)&&c.nextLevel>=(c.version===2?2:1)&&c.nextLevel<=48
   &&saneNumber(c.score)&&saneNumber(c.danger,0,99.999)&&saneNumber(c.seed,0,4294967295)
   &&(c.version===2||typeof c.ruleset==='string'&&c.ruleset.length<=64)
   &&POWERS.every(p=>Number.isInteger(c.inventory?.[p])&&c.inventory[p]>=0&&c.inventory[p]<=3)
   &&(c.powerBag===undefined||Array.isArray(c.powerBag)&&c.powerBag.length<=4&&new Set(c.powerBag).size===c.powerBag.length&&c.powerBag.every(p=>POWERS.includes(p)))
   &&Array.isArray(c.stageHistory)&&c.stageHistory.length<=48&&c.stageHistory.every(r=>r&&saneNumber(r.level,1,48)&&saneNumber(r.medal,1,3))
   &&['time','correct','wrong','missed','correctCharacters','bestStreak','streak','startLevel'].every(k=>saneNumber(c[k]))
   &&(c.nextId===undefined||Number.isInteger(c.nextId)&&c.nextId>0&&c.nextId<=1e9)
   &&(c.retries===undefined||saneNumber(c.retries))&&(c.burned===undefined||saneNumber(c.burned))
   &&(c.pile===undefined||Array.isArray(c.pile)&&c.pile.length<=45&&c.pile.every(p=>p&&Number.isFinite(p.x)&&p.x>=0&&p.x<=1200&&Number.isFinite(p.angle)&&Math.abs(p.angle)<=Math.PI)));
 }
 save(){try{this.storage?.setItem(KEY,JSON.stringify(this.data));this.available=Boolean(this.storage);}catch{this.available=false;}}
 update(settings){
  for(const k of Object.keys(DEFAULT_SETTINGS)){
   if(typeof DEFAULT_SETTINGS[k]==='boolean'&&typeof settings[k]==='boolean')this.data.settings[k]=settings[k];
  }
  if(PACE_NAMES.includes(settings.pace))this.data.settings.pace=settings.pace;
  for(const key of ['volume','musicVolume','sfxVolume'])if(saneNumber(settings[key],0,1))this.data.settings[key]=settings[key];
  this.save();
 }
 sortRecords(){
  this.data.records.sort((a,b)=>b.score-a.score||(a.retries||0)-(b.retries||0)||b.date-a.date);
  // Old high totals cannot evict all current records after a balance revision.
  this.data.records=[...this.data.records.filter(r=>r.ruleset===RULESET_VERSION).slice(0,100),...this.data.records.filter(r=>r.ruleset!==RULESET_VERSION).slice(0,100)];
 }
 add(result){const row=this.sanitizeRecord({mode:'campaign',ruleset:RULESET_VERSION,...result,date:Date.now()});this.data.records.push(row);this.sortRecords();this.save();return row;}
 completeStage(pace,stage,unlock=true){
  if(!PACE_NAMES.includes(pace)||stage.level<1||stage.level>48)return;
  const data=this.data.progress[pace],old=data.stages[stage.level];
  const accessible=stage.level<=data.unlocked;
  if(!unlock&&!old&&!accessible)return;
  const ruleset=stage.ruleset||RULESET_VERSION,same=old?.ruleset===ruleset;
  data.stages[stage.level]={campaignClear:unlock||(old?old.campaignClear!==false:false),medal:Math.max(old?.medal||0,stage.medal),score:Math.max(same?old.score:0,stage.stageScore),wpm:Math.max(same?old.wpm:0,stage.wpm),accuracy:Math.max(same?old.accuracy:0,stage.accuracy),ruleset,...(!same&&old?{legacyScore:old.score}:{})};
  if(unlock)data.unlocked=Math.max(data.unlocked,Math.min(48,stage.level+1));
  this.save();
 }
 get records(){return [...this.data.records];}
 get settings(){return {...this.data.settings};}
 progress(pace='classic'){return structuredClone(this.data.progress[pace]||this.data.progress.classic);}
 checkpoint(pace='classic'){const cp=this.data.checkpoints[pace];return this.validCheckpoint(cp)?structuredClone(cp):null;}
 setCheckpoint(cp){if(this.validCheckpoint(cp)){this.data.checkpoints[cp.pace]=this.normalizeCheckpoint(cp);this.save();return true;}return false;}
 markFailure(pace,seed,level){
  const cp=this.checkpoint(pace);
  if(cp&&cp.seed===seed&&cp.nextLevel===level){cp.retries=(cp.retries||0)+1;this.setCheckpoint(cp);return true;}
  return false;
 }
 clearCheckpoint(pace){delete this.data.checkpoints[pace];this.save();}
 best(pace='classic',mode='campaign',chapter=null){
  return this.data.records.filter(r=>r.pace===pace&&r.mode===mode&&r.ruleset===RULESET_VERSION&&(mode!=='practice'||chapter===null||r.startLevel===chapter)).reduce((n,r)=>Math.max(n,r.score),0);
 }
 filteredRecords({pace='classic',mode='campaign',period='all',chapter=null,now=Date.now()}={}){
  const since=period==='today'?new Date(new Date(now).setHours(0,0,0,0)).getTime():period==='week'?now-7*86400000:0;
  return this.data.records.filter(r=>(pace==='all'||r.pace===pace)&&(mode==='all'||r.mode===mode)&&r.date>=since&&(mode!=='practice'||chapter===null||r.startLevel===chapter)).sort((a,b)=>b.score-a.score||(a.retries||0)-(b.retries||0)||b.date-a.date);
 }
 exportData(){return JSON.stringify({...this.data,game:'Typekeeper: Enchanted Library',appVersion:'3.2.0',exportedAt:new Date().toISOString()},null,2);}
 clearRecords(){this.data.records=[];this.save();}
}
