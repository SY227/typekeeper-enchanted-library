import { FIELD, POWERS, RULES, RULESET_VERSION, levelRules, mulberry32, chapterSeed, normalizeInput, scoreForWord, wordCardWidth, PACES } from './rules.js';
import { CAMPAIGN_LENGTH, stageInfo, medalForStage } from '../data/campaign.js';
import { pressureState } from './pressure.js';
import { dictionaryForLevel } from '../data/words.js';

/** Deterministic game simulation. No artwork, sound or UI callback owns game state.
 * Every word has exactly one outcome. All timers use active simulation seconds.
 */
export class GameModel {
 constructor(){this.reset();}
 reset({seed=128947,pace='classic',level=1,mode='campaign'}={}) {
  this.seed=seed>>>0;this.pace=PACES[pace]?pace:'classic';
  this.level=Math.max(1,Math.min(10000,Math.floor(Number(level))||1));
  this.mode=['campaign','practice','endless'].includes(mode)?mode:'campaign';
  this.startLevel=this.level;this.phase='menu';this.previousPhase='playing';
  this.score=0;this.progress=0;this.danger=0;this.buffer='';this.time=0;this.tick=0;this.nextId=1;
  this.words=[];this.pile=[];this.events=[];this.replay=[];this.replayTruncated=false;
  this.inventory=Object.fromEntries(POWERS.map(p=>[p,0]));
  this.effects={ice:0,slow:0};this.cooldowns=Object.fromEntries(POWERS.map(p=>[p,0]));
  this.streak=0;this.bestStreak=0;this.correct=0;this.wrong=0;this.missed=0;
  this.correctCharacters=0;this.keystrokes=0;this.burned=0;this.retries=0;
  this.stageHistory=[];this.powerBag=[];this.lastPressure='calm';
  this.casts=Object.fromEntries(POWERS.map(p=>[p,0]));
  this.lastResult=null;this.lastClear=null;this.scoreRuleset=RULESET_VERSION;
  this.prepareStage();
 }
 prepareStage() {
  this.random=mulberry32(chapterSeed(this.seed,this.level));
  this.recentWords=[];this.recentResolved=[];this.pendingSpawn=null;
  this.spawnClock=.65;this.spawnedThisLevel=0;this.specialAt=2;this.trialRest=false;
  this.stageWrong=0;this.stageMissed=0;this.stageCorrect=0;this.stageBonus=0;
  this.stageTime=0;this.stageStartScore=this.score;this.stageCharacters=0;this.stageBurned=0;
  this.progress=0;this.buffer='';this.words=[];this.effects={ice:0,slow:0};
  this.cooldowns=Object.fromEntries(POWERS.map(p=>[p,0]));
 }
 get info(){return stageInfo(this.level);}
 get pressure(){return pressureState(this.danger,this.phase);}
 get stageWpm(){return this.stageTime>1?Math.round(this.stageCharacters/5/(this.stageTime/60)):0;}
 get stageAccuracy(){return this.stageCorrect+this.stageWrong?Math.round(100*this.stageCorrect/(this.stageCorrect+this.stageWrong)):100;}
 get config(){
  const key=`${this.level}/${this.pace}`;
  if(this._configKey!==key){this._configKey=key;this._config=levelRules(this.level,this.pace);}
  return this._config;
 }
 get accuracy(){return this.correct+this.wrong?Math.round(100*this.correct/(this.correct+this.wrong)):100;}
 get wpm(){return this.time>1?Math.round(this.correctCharacters/5/(this.time/60)):0;}
 get multiplier(){return Math.min(3,1+Math.floor(this.streak/8)*.25);}
 emit(type,data={}){this.events.push({type,tick:this.tick,...data});}
 drainEvents(){const events=this.events;this.events=[];return events;}
 record(type,value){
  if(this.replay.length<RULES.replayLimit)this.replay.push({tick:this.tick,type,value});
  else this.replayTruncated=true;
 }
 start(options={}){
  this.reset(options);this.phase='playing';
  this.record('start',{seed:this.seed,pace:this.pace,level:this.level,mode:this.mode});this.emit('start');
 }
 setBuffer(raw,record=true){
  if(this.phase!=='playing')return;
  const previous=this.buffer,normalized=normalizeInput(raw),added=Math.max(0,normalized.length-previous.length);
  this.keystrokes+=added;this.buffer=normalized;
  if(record)this.record('input',normalized);
  const target=normalized?this.words.filter(w=>w.text.startsWith(normalized)).sort((a,b)=>b.y-a.y||a.id-b.id)[0]:null;
  this.emit('input',{added,changed:normalized!==previous,erased:normalized.length<previous.length,text:normalized,complete:!!target&&target.text===normalized,target:target?{...target}:null});
 }
 submit(record=true){
  if(this.phase!=='playing'||!this.buffer)return null;
  const text=this.buffer;if(record)this.record('submit',text);this.buffer='';
  const candidates=this.words.filter(w=>w.text===text).sort((a,b)=>b.y-a.y||a.id-b.id);
  if(candidates.length){this.complete(candidates[0]);return 'word';}
  const power=text.toLowerCase();
  if(POWERS.includes(power))return this.cast(power)?'power':'empty-power';
  // A target that landed during Enter must not cause a second, unrelated penalty.
  // It remains a miss: no refunded danger, score, accuracy or chapter progress.
  const recent=this.recentResolved.findIndex(w=>w.text===text&&this.time-w.time<=RULES.lateSubmissionWindow);
  if(recent>=0){const resolved=this.recentResolved.splice(recent,1)[0];this.emit('late',{text,reason:resolved.reason});return 'late';}
  this.wrong++;this.stageWrong++;this.streak=0;
  this.danger=Math.min(100,this.danger+RULES.invalidPenalty);
  this.emit('wrong',{text});this.checkGameOver();return 'wrong';
 }
 complete(word){
  if(this.phase!=='playing'||!this.words.some(w=>w.id===word.id))return;
  this.words=this.words.filter(w=>w.id!==word.id);
  this.correct++;this.stageCorrect++;this.progress++;this.streak++;
  this.bestStreak=Math.max(this.streak,this.bestStreak);
  this.correctCharacters+=word.text.length;this.stageCharacters+=word.text.length;
  const points=scoreForWord(word.text,word.kind,this.streak);this.score+=points;
  let collected=false;
  if(POWERS.includes(word.kind)&&this.inventory[word.kind]<RULES.inventoryCapacity){this.inventory[word.kind]++;collected=true;}
  this.emit('correct',{word:{...word},points,collected,overflow:POWERS.includes(word.kind)&&!collected,streak:this.streak});
  if(this.progress>=this.config.quota)this.clearLevel();
  else if(!this.words.length&&!this.trialRest)this.spawnClock=Math.min(this.spawnClock,RULES.emptyFieldDelay);
 }
 spellStatus(power){
  const count=this.inventory[power]||0,remaining=this.effects[power]||0;
  if(remaining>0)return {ready:false,state:power==='slow'&&this.effects.ice>0?'queued':'active',reason:'active',remaining,count};
  if(!count)return {ready:false,state:'empty',reason:'empty',remaining:0,count};
  const reason=this.cooldowns[power]>0?'cooldown':power==='fire'&&!this.words.length?'empty-field':power==='wind'&&this.danger===0?'empty-pile':null;
  return {ready:!reason&&this.phase==='playing',state:reason?'stored':'ready',reason,remaining:0,count};
 }
 cast(power,source='command'){
  if(this.phase!=='playing'||!POWERS.includes(power))return false;
  const status=this.spellStatus(power);
  if(!status.ready){this.emit('unavailable',{power,reason:status.reason});return false;}
  this.inventory[power]--;this.casts[power]++;this.cooldowns[power]=RULES.spellCooldown;
  if(source!=='command')this.record('cast',{power,source});
  const removed=power==='fire'?this.words.map(w=>({...w})):[];
  if(power==='fire'){
   for(const w of removed)this.rememberResolved(w,'fire');
   this.burned+=removed.length;this.stageBurned+=removed.length;this.words=[];
   this.spawnClock=Math.max(this.spawnClock,RULES.fireRecovery);
  }
  if(power==='ice')this.effects.ice=RULES.iceDuration;
  if(power==='slow')this.effects.slow=RULES.slowDuration;
  if(power==='wind'){this.danger=0;this.pile=[];}
  this.emit('power',{power,removed});this.checkPressure();return true;
 }
 rememberResolved(word,reason){
  this.recentResolved=this.recentResolved.filter(w=>this.time-w.time<=RULES.lateSubmissionWindow);
  this.recentResolved.push({text:word.text,time:this.time,reason});
  if(this.recentResolved.length>RULES.maxActive)this.recentResolved.shift();
 }
 pickWord(){
  if(this.level===1&&this.spawnedThisLevel<4)return ['INK','TALE','BOOK','PAGE'][this.spawnedThisLevel];
  const bank=dictionaryForLevel(this.level,this.random);
  const active=new Set(this.words.map(w=>w.text));
  const available=bank.filter(w=>!active.has(w)&&!this.recentWords.includes(w));
  const pool=available.length?available:bank.filter(w=>!active.has(w));
  return (pool.length?pool:bank)[Math.floor(this.random()*(pool.length||bank.length))];
 }
 takePower(){
  if(!this.powerBag.length){
   this.powerBag=[...POWERS];
   for(let i=this.powerBag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.powerBag[i],this.powerBag[j]]=[this.powerBag[j],this.powerBag[i]];}
  }
  // Prefer a not-full shelf, but do not change drops in response to danger/score.
  let index=this.powerBag.findIndex(p=>this.inventory[p]<RULES.inventoryCapacity);
  if(index<0)index=0;
  return this.powerBag.splice(index,1)[0];
 }
 spawn(){
  if(this.phase!=='playing'||this.words.length>=RULES.maxActive||this.words.length>=this.config.quota-this.progress)return false;
  if(!this.pendingSpawn){
   const text=this.pickWord(),forced={2:'fire',5:'ice',8:'slow',10:'wind'};
   let kind='normal';
   if(this.level===1&&forced[this.spawnedThisLevel])kind=forced[this.spawnedThisLevel];
   else if((this.level>1||this.spawnedThisLevel>10)&&this.spawnedThisLevel>=this.specialAt)kind=this.takePower();
   else if(this.random()<this.config.darkChance)kind='bonus';
   if(POWERS.includes(kind))this.specialAt=this.spawnedThisLevel+4+Math.floor(this.random()*3);
   this.pendingSpawn={text,kind,width:wordCardWidth(text,kind),phase:this.random()*Math.PI*2,laneRoll:this.random()};
  }
  const pending=this.pendingSpawn,width=pending.width;
  // Compute actual free intervals; random retry failure cannot reroll a power/word.
  let spans=[[FIELD.left+width/2,FIELD.right-width/2]];
  for(const w of this.words.filter(w=>w.y<FIELD.top+76)){
   const low=w.x-(w.width+width)/2-10,high=w.x+(w.width+width)/2+10;
   spans=spans.flatMap(([a,b])=>high<=a||low>=b?[[a,b]]:[[a,Math.min(b,low)],[Math.max(a,high),b]].filter(([u,v])=>v-u>.01));
  }
  const total=spans.reduce((sum,[a,b])=>sum+b-a,0);if(!total)return false;
  let distance=pending.laneRoll*total,x=spans[0][0];
  for(const [a,b] of spans){if(distance<=b-a){x=a+distance;break;}distance-=b-a;}
  const word={id:this.nextId++,text:pending.text,kind:pending.kind,x,y:FIELD.top,previousY:FIELD.top,speed:this.config.speed,width,phase:pending.phase};
  this.pendingSpawn=null;this.words.push(word);this.spawnedThisLevel++;
  this.recentWords.push(word.text);if(this.recentWords.length>9)this.recentWords.shift();
  this.emit('spawn',{word:{...word}});return true;
 }
 step(dt=RULES.step){
  if(this.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(.1,dt);this.tick++;this.time+=dt;this.stageTime+=dt;
  for(const p of POWERS)this.cooldowns[p]=Math.max(0,this.cooldowns[p]-dt);
  // Integrate expiry boundaries exactly. SLOW's remaining duration is banked
  // throughout ICE, including when ICE expires partway through this tick.
  const hadIce=this.effects.ice>0,hadSlow=this.effects.slow>0;
  const frozenSeconds=Math.min(dt,this.effects.ice),unfrozen=dt-frozenSeconds;
  this.effects.ice=Math.max(0,this.effects.ice-dt);
  const slowedSeconds=Math.min(unfrozen,this.effects.slow),normalSeconds=unfrozen-slowedSeconds;
  this.effects.slow=Math.max(0,this.effects.slow-unfrozen);
  if(hadIce&&this.effects.ice===0)this.emit('effect-end',{power:'ice'});
  if(hadSlow&&this.effects.slow===0)this.emit('effect-end',{power:'slow'});
  const travel=slowedSeconds*RULES.slowFactor+normalSeconds;
  const spawnTime=slowedSeconds*RULES.slowSpawnFactor+normalSeconds;
  if(spawnTime>0){
   this.spawnClock-=spawnTime;
   if(this.spawnClock<=0){
    if(this.spawn()){
     this.trialRest=this.config.trial&&this.spawnedThisLevel%5===0;
     this.spawnClock=this.config.interval*(this.config.trial?(this.trialRest?1.8:.83):1);
    }else this.spawnClock=.1;
   }
  }
  const landed=[];
  for(const word of this.words){word.previousY=word.y;word.y+=word.speed*travel;if(word.y>=FIELD.bottom)landed.push(word);}
  for(const word of landed.sort((a,b)=>b.y-a.y||a.id-b.id)){
   if(this.phase!=='playing')break;
   this.words=this.words.filter(w=>w.id!==word.id);
   this.rememberResolved(word,'miss');this.missed++;this.stageMissed++;this.streak=0;
   this.danger=Math.min(100,this.danger+(RULES.missBase+word.text.length*RULES.missPerLetter)*(word.kind==='bonus'?RULES.darkMissFactor:1));
   this.pile.push({id:word.id,x:word.x,kind:word.kind,text:word.text,angle:(word.id%7-3)*.055});
   if(this.pile.length>45)this.pile.shift();this.emit('miss',{word:{...word}});this.checkGameOver();
  }
 }
 checkPressure(){const state=this.pressure;if(state.key!==this.lastPressure){const previous=this.lastPressure;this.lastPressure=state.key;this.emit('pressure',{state:{...state},previous});}}
 clearLevel(){
  if(this.phase!=='playing')return;
  const perfect=this.stageMissed===0&&this.stageWrong===0;
  this.stageBonus=this.level*100+(perfect?250:0);this.score+=this.stageBonus;
  this.words=[];this.pendingSpawn=null;this.buffer='';this.effects={ice:0,slow:0};this.phase='level-clear';
  const medal=medalForStage({missed:this.stageMissed,wrong:this.stageWrong});
  this.lastClear={level:this.level,bonus:this.stageBonus,perfect,medal,words:this.stageCorrect,wrong:this.stageWrong,missed:this.stageMissed,burned:this.stageBurned,wpm:this.stageWpm,accuracy:this.stageAccuracy,seconds:Math.round(this.stageTime),stageScore:this.score-this.stageStartScore,ruleset:this.scoreRuleset};
  this.stageHistory.push({...this.lastClear});this.emit('level-clear',{...this.lastClear});
 }
 nextLevel(record=true){
  if(this.phase!=='level-clear'||this.mode==='practice'||(this.mode==='campaign'&&this.level>=CAMPAIGN_LENGTH))return false;
  if(record)this.record('next-level',this.level+1);this.level++;this.prepareStage();this.phase='playing';this.emit('next-level');return true;
 }
 pause(reason='manual'){if(this.phase==='playing'){this.phase='paused';this.record('pause',reason);this.emit('pause',{reason});}}
 resume(){if(this.phase==='paused'){this.phase='playing';this.record('resume',true);this.emit('resume');}}
 result(extra={}){
  return {score:this.score,level:this.level,words:this.correct,accuracy:this.accuracy,wpm:this.wpm,streak:this.bestStreak,missed:this.missed,burned:this.burned,retries:this.retries,seconds:Math.round(this.time),pace:this.pace,seed:this.seed,ruleset:this.scoreRuleset,mode:this.mode,startLevel:this.startLevel,cleared:this.stageHistory.length,medals:this.stageHistory.reduce((n,s)=>n+s.medal,0),...extra};
 }
 checkGameOver(){
  this.checkPressure();if(this.danger<100||this.phase!=='playing')return;
  this.phase='game-over';this.danger=100;this.buffer='';this.effects={ice:0,slow:0};
  this.lastResult=this.result();this.emit('game-over',{result:{...this.lastResult}});
 }
 /** Only chapter-boundary state may be resumed. Never serializes a half-played board. */
 checkpoint(){
  const clear=this.phase==='level-clear';
  if(!clear&&(this.stageTime!==0||this.progress!==0||this.words.length))return null;
  if(this.mode!=='campaign'||(clear&&this.level>=48))return null;
  return {version:3,ruleset:this.scoreRuleset,nextLevel:this.level+(clear?1:0),seed:this.seed,nextId:this.nextId,pace:this.pace,mode:this.mode,startLevel:this.startLevel,score:this.score,danger:this.danger,inventory:{...this.inventory},powerBag:[...this.powerBag],pile:this.pile.map(p=>({...p})),time:this.time,correct:this.correct,wrong:this.wrong,missed:this.missed,correctCharacters:this.correctCharacters,bestStreak:this.bestStreak,streak:this.streak,burned:this.burned,retries:this.retries,stageHistory:this.stageHistory.map(s=>({...s})),casts:{...this.casts}};
 }
 restoreCheckpoint(c){
  this.start({seed:c.seed,pace:c.pace,level:c.nextLevel,mode:c.mode});
  for(const k of ['score','danger','time','correct','wrong','missed','correctCharacters','bestStreak','streak','startLevel','burned','retries','nextId'])if(Number.isFinite(c[k]))this[k]=c[k];
  this.inventory={...this.inventory,...c.inventory};this.powerBag=(c.powerBag||[]).filter(p=>POWERS.includes(p));
  this.pile=(Array.isArray(c.pile)?c.pile:[]).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.angle)).slice(-45).map(p=>({...p}));
  if(!this.pile.length&&this.danger>0)for(let i=0;i<Math.ceil(this.danger/10);i++)this.pile.push({id:-i-1,x:270+(i%8)*86,kind:'normal',text:'',angle:(i%5-2)*.025});
  this.stageHistory=(c.stageHistory||[]).map(s=>({...s}));this.casts={...this.casts,...c.casts};this.stageStartScore=this.score;
  this.scoreRuleset=c.ruleset||'library-edition-2.0.0';this.record('restore-checkpoint',structuredClone(c));this.checkPressure();
 }
 finishCampaign(){if(this.phase!=='level-clear'||this.mode!=='campaign'||this.level!==48)return null;this.lastResult=this.result({victory:true});return this.lastResult;}
 retire(){this.lastResult=this.result({victory:false,retired:true});return this.lastResult;}
 exportReplay(){return {ruleset:RULESET_VERSION,seed:this.seed,pace:this.pace,truncated:this.replayTruncated,events:this.replay.map(e=>({...e}))};}
 snapshot(){return {phase:this.phase,level:this.level,score:this.score,progress:this.progress,quota:this.config.quota,danger:this.danger,buffer:this.buffer,time:this.time,tick:this.tick,pace:this.pace,mode:this.mode,pressure:this.pressure.key,info:{...this.info},streak:this.streak,bestStreak:this.bestStreak,correct:this.correct,wrong:this.wrong,missed:this.missed,burned:this.burned,retries:this.retries,wpm:this.wpm,accuracy:this.accuracy,inventory:{...this.inventory},effects:{...this.effects},trialRest:this.trialRest,words:this.words.map(w=>({...w}))};}
}
