import { RULESET_VERSION } from './rules.js?v=3.6.3-447ce8d517d13011';
const chapterPaces=['classic','relaxed','maniac'];
const chapterModes=['campaign','practice'];
const chapterFinite=(n,max=1e12)=>Number.isFinite(n)&&n>=0&&n<=max;
export function chapterRecordKey({ruleset=RULESET_VERSION,pace='classic',mode='campaign',level}={}){
 if(!chapterPaces.includes(pace)||!chapterModes.includes(mode)||!Number.isInteger(level)||level<1||level>48||typeof ruleset!=='string'||!ruleset.length||ruleset.length>64||!/^[-.\w]+$/.test(ruleset))return null;
 return `${ruleset}|${pace}|${mode}|${level}`;
}
/** One real attempt: score/WPM/accuracy in this row all belong to that attempt. */
export function sanitizeChapterRecord(row){
 if(!row||typeof row.ruleset!=='string'||!chapterPaces.includes(row.pace)||!chapterModes.includes(row.mode)||!chapterRecordKey(row)||!chapterFinite(row.score)||!Number.isInteger(row.medal)||row.medal<1||row.medal>3)return null;
 const result={ruleset:row.ruleset,pace:row.pace,mode:row.mode,level:row.level,score:row.score,medal:row.medal};
 for(const [key,max]of [['wpm',1000],['accuracy',100],['missed',1e9],['wrong',1e9],['seconds',1e9]])result[key]=chapterFinite(row[key],max)?row[key]:0;
 // Missing random provenance stays missing: never invent a replay seed.
 for(const key of ['seed','wordSeed'])if(Number.isInteger(row[key])&&chapterFinite(row[key],4294967295))result[key]=row[key];
 if([1,2].includes(row.sequenceVersion))result.sequenceVersion=row.sequenceVersion;
 return result;
}
export function chapterAchievement({previousMedal=0,stage,comparison,paceLabel='Classic',modeLabel='Campaign'}={}){
 const scope=`${paceLabel} · ${modeLabel} · Chapter ${String(stage.level).padStart(2,'0')}`;
 if(stage.level<=48&&stage.medal>previousMedal)return {kind:'mastery',title:previousMedal?`First ${stage.medal}-star clear`:`${stage.medal===3?'A perfect first clear':'First chapter clear'}`,detail:`${stage.medal} of 3 mastery stars · ${paceLabel}`,scope};
 if(comparison?.status==='improved')return {kind:'score',title:`Chapter best +${Math.round(comparison.delta).toLocaleString('en-US')} points`,detail:scope,scope};
 if(comparison?.status==='first')return {kind:'first',title:'Chapter score recorded',detail:scope,scope};
 return null;
}
