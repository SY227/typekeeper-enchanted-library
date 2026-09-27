import { asset } from '../game/assets.js?v=3.4.0-cbb049170ccf1a33';
import { MUSIC_STEMS, MUSIC_LOOP_SECONDS, musicDirection } from './mix.js?v=3.4.0-cbb049170ccf1a33';

/** Original phase-aligned score + bounded procedural foley.
 * Music follows pile pressure, never drives simulation time or changes word speed.
 * The original stereo theme is preserved; two centered pressure stems add articulation.
 */
export class GameAudio {
 constructor(settings){
  this.settings=settings;this.context=null;this.master=null;this.output=null;
  this.musicBus=null;this.filter=null;this.stemGains=[];this.sources=[];this.buffers=[];
  this.status='idle';this.loadPromise=null;this.active=false;this.background=false;
  this.scene='menu';this.pressure=0;this.direction=musicDirection();
  this.lastKey=-Infinity;this.lastUI=-Infinity;this.lastFailure=0;this.lastTally=-Infinity;
  this.voiceCount=0;this.noiseCount=0;this.backgroundTimer=null;this.startedAt=0;
  this.handles=new Set();this.noiseCache=new Map();this.keyIndex=0;this.cueLog=[];
 }
 async unlock(){
  try{
   if(!this.context){
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context){this.status='unsupported';this.onStatus?.(this.status);return;}
    this.context=new Context({latencyHint:'interactive'});
    this.output=this.context.createGain();this.output.gain.value=0;
    const limiter=this.context.createDynamicsCompressor();
    limiter.threshold.value=-7;limiter.knee.value=8;limiter.ratio.value=4;limiter.attack.value=.003;limiter.release.value=.12;
    this.master=this.context.createGain();this.master.connect(limiter);
    this.musicBus=this.context.createGain();this.musicBus.gain.value=0;
    this.filter=this.context.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=13000;
    this.musicBus.connect(this.filter);this.filter.connect(limiter);limiter.connect(this.output);this.output.connect(this.context.destination);
   }
   if(!this.background)await this.context.resume();
   this.active=true;this.apply();if(this.settings.music)this.loadMusic();
  }catch{this.active=false;}
 }
 setSettings(settings){this.settings=settings;this.apply();}
 setScene(scene){if(scene!==this.scene)this.stopScore();this.scene=scene;this.apply();}
 setPressure(value){
  const next=Number.isFinite(value)?Math.max(0,Math.min(100,value)):0;
  if(Math.abs(next-this.pressure)<.001)return;
  const falling=next<this.pressure;this.pressure=next;this.applyDirection(falling?.27:.55);
 }
 setBackground(value){
  this.background=Boolean(value);clearTimeout(this.backgroundTimer);if(this.background)this.stopScore();this.apply();
  if(this.background&&this.context)this.backgroundTimer=setTimeout(()=>{if(this.background)this.context.suspend().catch(()=>{});},180);
  else if(this.context&&this.active)this.context.resume().catch(()=>{});
 }
 ramp(parameter,value,tau=.12){
  if(!parameter||!this.context)return;
  const now=this.context.currentTime;
  // cancelAndHold preserves continuity during rapid pressure changes (e.g. WIND).
  if(parameter.cancelAndHoldAtTime)parameter.cancelAndHoldAtTime(now);
  else{const current=parameter.value;parameter.cancelScheduledValues(now);parameter.setValueAtTime(current,now);}
  parameter.setTargetAtTime(value,now,tau);
 }
 applyDirection(tau=.55){
  this.direction=musicDirection(this.scene,this.pressure,this.settings.adaptiveMusic!==false);
  for(let i=0;i<this.stemGains.length;i++)if(this.stemGains[i])this.ramp(this.stemGains[i].gain,this.direction.stems[i],tau);
 }
 apply(){
  if(!this.context)return;
  const s=this.settings;
  this.ramp(this.output.gain,s.muted||this.background?0:s.volume,.045);
  this.ramp(this.master.gain,s.sfx?s.sfxVolume*.19:0,.025);
  const paused=this.scene==='pause';
  const sceneGain=paused?.22:this.scene==='over'?.32:this.scene==='clear'?.64:this.scene==='menu'?.82:1;
  this.ramp(this.musicBus.gain,s.music?s.musicVolume*.75*sceneGain:0,.4);
  this.ramp(this.filter.frequency,paused?2200:13000,.35);this.applyDirection();
  if(s.music&&this.active&&!this.loadPromise&&!['ready','degraded'].includes(this.status)&&(this.status!=='failed'||performance.now()-this.lastFailure>10000))this.loadMusic();
 }
 async readAsset(path){
  const url=asset(path);
  if(url.startsWith('data:')){const encoded=url.slice(url.indexOf(',')+1);return Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)).buffer;}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw new Error('Audio file unavailable');return await response.arrayBuffer();}finally{clearTimeout(timer);}
 }
 loadMusic(){
  if(this.loadPromise||['ready','degraded'].includes(this.status)||!this.context)return this.loadPromise;
  this.status='loading';this.onStatus?.(this.status);
  this.loadPromise=(async()=>{
   try{
    const results=await Promise.allSettled(MUSIC_STEMS.map(async name=>this.context.decodeAudioData(await this.readAsset(`assets/${name}.mp3`))));
    if(results[0].status!=='fulfilled'||results[1].status!=='fulfilled')throw new Error('Main score unavailable');
    this.buffers=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
    const loopEnd=Math.min(MUSIC_LOOP_SECONDS,...this.buffers.map(b=>b.duration));
    const start=this.context.currentTime+.06;this.startedAt=start;
    results.forEach((result,i)=>{
     if(result.status!=='fulfilled')return;
     const source=this.context.createBufferSource(),gain=this.context.createGain();
     source.buffer=result.value;source.loop=true;source.loopStart=0;source.loopEnd=loopEnd;gain.gain.value=0;
     source.connect(gain);gain.connect(this.musicBus);source.start(start);
     this.sources.push(source);this.stemGains[i]=gain;
    });
    this.status=results.every(r=>r.status==='fulfilled')?'ready':'degraded';this.apply();
   }catch{
    this.status='failed';this.lastFailure=performance.now();
    for(const source of this.sources){try{source.stop();source.disconnect();}catch{}}
    for(const g of this.stemGains)g?.disconnect();this.sources=[];this.stemGains=[];this.buffers=[];
   }finally{this.loadPromise=null;this.onStatus?.(this.status);}
  })();return this.loadPromise;
 }
 suspendMusic(){this.setScene('pause');}
 resumeMusic(){this.apply();}
 allowed(){return !!(this.context&&this.active&&this.settings.sfx&&!this.settings.muted&&!this.background);}
 noteCue(name){this.cueLog.push({name,time:this.context?.currentTime||0});if(this.cueLog.length>48)this.cueLog.shift();}
 connectVoice(source,gain,extras,group,counter,when,stop){
  const handle={source,gain,group};this.handles.add(handle);
  source.onended=()=>{source.disconnect();gain.disconnect();for(const node of extras)node.disconnect();this.handles.delete(handle);this[counter]=Math.max(0,this[counter]-1);};
  source.start(when);if(stop!==undefined)source.stop(stop);
 }
 tone(frequency,duration=.18,type='sine',gain=.5,delay=0,options={}){
  if(!this.allowed()||this.voiceCount>=32||!Number.isFinite(frequency)||frequency<=0)return;
  this.voiceCount++;
  try{
   const now=this.context.currentTime+Math.max(0,delay),o=this.context.createOscillator(),g=this.context.createGain();
   o.type=type;o.frequency.setValueAtTime(frequency,now);
   if(options.endFrequency)o.frequency.exponentialRampToValueAtTime(options.endFrequency,now+duration);
   g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),now+.005);g.gain.exponentialRampToValueAtTime(.0001,now+duration);
   o.connect(g);const extra=[];
   if(options.pan&&this.context.createStereoPanner){const pan=this.context.createStereoPanner();pan.pan.value=options.pan;g.connect(pan);pan.connect(this.master);extra.push(pan);}else g.connect(this.master);
   this.connectVoice(o,g,extra,options.group||'fx','voiceCount',now,now+duration+.025);
  }catch{this.voiceCount=Math.max(0,this.voiceCount-1);}
 }
 noise(duration=.05,gain=.35,filter=1700,options={}){
  if(!this.allowed()||this.noiseCount>=12)return;this.noiseCount++;
  try{
   const ctx=this.context,n=Math.max(1,Math.floor(ctx.sampleRate*duration)),variant=(this.keyIndex++)%4,key=`${n}/${variant}/${options.sustain?1:0}`;
   let buf=this.noiseCache.get(key);
   if(!buf){
    buf=ctx.createBuffer(1,n,ctx.sampleRate);const data=buf.getChannelData(0);let seed=49297+variant*1237,pink=0;
    for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=seed/2147483648-1;pink=.83*pink+.17*white;data[i]=(.6*white+.65*pink)*Math.exp(-i/n*(options.sustain?2.8:6))*Math.min(1,i/48);}
    this.noiseCache.set(key,buf);if(this.noiseCache.size>24)this.noiseCache.delete(this.noiseCache.keys().next().value);
   }
   const source=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter(),now=ctx.currentTime+(options.delay||0);
   source.buffer=buf;f.type='lowpass';f.frequency.setValueAtTime(filter,now);
   if(options.endFilter)f.frequency.exponentialRampToValueAtTime(options.endFilter,now+duration);
   g.gain.value=gain;source.connect(f);f.connect(g);g.connect(this.master);
   this.connectVoice(source,g,[f],options.group||'fx','noiseCount',now);
  }catch{this.noiseCount=Math.max(0,this.noiseCount-1);}
 }
 bell(note,level=.23,delay=0,group='fx',pan=0){
  const f=440*2**((note-69)/12);
  this.tone(f,.31,'sine',level,delay,{group,pan});this.tone(f*2.003,.15,'sine',level*.19,delay,{group,pan});
 }
 key(match=false,complete=false){
  const t=performance.now();if(t-this.lastKey<28)return;this.lastKey=t;
  this.noteCue(complete?'word-ready':match?'matched-key':'key');
  this.noise(.024,.28,3100);this.tone(165+(this.keyIndex%5)*11,.031,'triangle',.18);
  if(match)this.tone(870+(this.keyIndex%4)*24,.043,'sine',.034);
  if(complete)this.bell(86,.065,0,'fx',.12);
 }
 ui(){const t=performance.now();if(t-this.lastUI<60)return;this.lastUI=t;this.tone(430,.045,'sine',.09);this.noise(.016,.06,2000);}
 stopScore(){
  for(const h of this.handles)if(h.group==='score'){
   try{const now=this.context.currentTime;h.gain.gain.cancelScheduledValues(now);h.gain.gain.setTargetAtTime(.0001,now,.006);h.source.stop(now+.03);}catch{}
  }
  this.lastTally=-Infinity;
 }
 tallyTick(progress){
  if(!this.allowed())return;const now=this.context.currentTime;
  if(now-this.lastTally<.045)return;this.lastTally=now;this.noteCue('score-tick');
  this.noise(.019,.085,3600,{group:'score'});
  this.tone(580+Math.min(1,Math.max(0,progress))*290,.038,'sine',.13,0,{group:'score'});
 }
 tallyComplete(medal=0){
  if(!this.allowed())return;this.noteCue('score-finish');
  this.noise(.063,.21,1150,{group:'score'});
  this.bell(74,.2,0,'score');
  for(let i=0;i<Math.min(3,medal);i++)this.bell([78,81,86][i],.2,.11+i*.12,'score',-.18+i*.18);
 }
 play(event){
  if(event.type==='input'&&event.changed&&!event.erased)this.key(!!event.target,event.complete);
  if(event.type==='input'&&event.changed&&event.erased){const now=performance.now();if(now-(this.lastErase||0)>35){this.lastErase=now;this.noteCue('paper-erase');this.noise(.028,.10,3500,{endFilter:1800});}}
  if(event.type==='correct'){
   this.noteCue(event.word.kind==='bonus'?'bonus-word':'word-saved');
   const note=[74,78,81,83][Math.floor(Math.max(0,event.streak-1)/4)%4];
   this.noise(.045,.21,2600);this.tone(240,.038,'triangle',.14);
   this.bell(note,event.word.kind==='bonus'?.34:.25,0,'fx',Math.max(-.3,Math.min(.3,(event.word.x-600)/1500)));
   if(event.word.kind==='bonus')this.bell(note+12,.12,.05);
   if(event.collected){this.noteCue('book-collected');this.noise(.14,.18,3400);this.bell(86,.14,.09);this.bell(90,.1,.16);}
   if(event.streak>0&&event.streak%8===0){this.noteCue('streak');[78,81,86].forEach((n,i)=>this.bell(n,.13,.075+i*.065));}
  }
  if(event.type==='pressure'&&['alarmed','critical'].includes(event.state?.key)){
   this.noteCue('pressure-warning');const critical=event.state.key==='critical';
   this.tone(critical?146.83:196,.22,'sine',.16);this.tone(critical?220:293.66,.18,'sine',.1,.16);
  }
  if(event.type==='wrong'){this.noteCue('wrong');this.bell(69,.11);this.noise(.031,.12,950);}
  if(event.type==='miss'){this.noteCue('paper-impact');this.noise(.17,.55,1700,{endFilter:460});this.tone(102,.14,'sine',.3,0,{endFrequency:62});}
  if(event.type==='unavailable')this.tone(240,.07,'sine',.13);
  if(event.type==='power'){
   const p=event.power;this.noteCue(`spell-${p}`);
   if(p==='fire'){this.noise(.58,.8,450,{endFilter:4800,sustain:true});this.noise(.15,.35,4100,{delay:.08});this.tone(68,.43,'sine',.42,0,{endFrequency:42});}
   if(p==='ice'){this.noise(.32,.23,6300,{endFilter:1700});[86,93,98].forEach((n,i)=>this.bell(n,.23,i*.055,'fx',(i-1)*.28));}
   if(p==='slow'){[81,78,74].forEach((n,i)=>this.bell(n,.22,i*.12));this.tone(293.66,.6,'sine',.12,0,{endFrequency:146.83});}
   if(p==='wind'){this.noise(.7,.58,750,{endFilter:6200,sustain:true});this.bell(78,.2,.12);this.bell(81,.17,.2);this.bell(86,.12,.29);}
  }
  if(event.type==='effect-end'){this.noteCue(`end-${event.power}`);this.bell(event.power==='ice'?90:81,.065);this.noise(.12,.09,3200);}
  if(['start','next-level','resume'].includes(event.type)){this.noteCue('page-turn');this.noise(.15,.19,1700,{endFilter:4300});this.bell(74,.12,.025);}
  if(event.type==='level-clear'){this.noteCue('chapter-clear');this.noise(.19,.2,1900);this.bell(81,.13,.02);}
  if(event.type==='game-over'){this.noteCue('run-over');[74,69,66,62].forEach((n,i)=>this.bell(n,.18,i*.15));}
 }
 snapshot(){return {state:this.context?.state||'uninitialized',sfx:this.settings.sfx,music:this.settings.music,adaptive:this.settings.adaptiveMusic!==false,muted:this.settings.muted,musicStatus:this.status,scene:this.scene,pressure:this.pressure,tension:this.direction.tension,urgency:this.direction.urgency,targets:this.direction.stems,background:this.background,sources:this.sources.length,output:this.output?.gain.value??0,musicGain:this.musicBus?.gain.value??0,fxGain:this.master?.gain.value??0,stemGains:this.stemGains.map(n=>n?.gain.value??0),loopDuration:this.sources[0]?.loopEnd||0,decodedBytes:this.buffers.reduce((n,b)=>n+b.length*b.numberOfChannels*4,0),voices:this.voiceCount,noiseVoices:this.noiseCount,noiseCache:this.noiseCache.size,cues:this.cueLog.map(x=>({...x}))};}
}
