import { asset } from '../game/assets.js';

/** Original two-stem score and synthesized feedback. No remote audio service.
 * One audio clock keeps both stems aligned; scene changes only automate gains.
 * Loading, autoplay, and decode failures never affect the game simulation.
 */
export class GameAudio {
  constructor(settings) {
    this.settings=settings;this.context=null;this.master=null;this.output=null;
    this.musicBus=null;this.filter=null;this.stemGains=[];this.sources=[];this.buffers=[];
    this.status='idle';this.loadPromise=null;this.active=false;this.background=false;
    this.scene='menu';this.lastKey=0;this.lastUI=0;this.lastFailure=0;
    this.voiceCount=0;this.noiseCount=0;this.backgroundTimer=null;this.startedAt=0;
  }
  async unlock() {
    try {
      if(!this.context) {
        const Context=window.AudioContext||window.webkitAudioContext;
        if(!Context){this.status='unsupported';this.onStatus?.(this.status);return;}
        this.context=new Context({latencyHint:'interactive'});
        this.output=this.context.createGain();this.output.gain.value=0;
        const limiter=this.context.createDynamicsCompressor();
        limiter.threshold.value=-7;limiter.knee.value=8;limiter.ratio.value=4;
        limiter.attack.value=.003;limiter.release.value=.12;
        this.master=this.context.createGain();this.master.connect(limiter);
        this.musicBus=this.context.createGain();this.musicBus.gain.value=0;
        this.filter=this.context.createBiquadFilter();this.filter.type='lowpass';
        this.filter.frequency.value=13000;this.musicBus.connect(this.filter);
        this.filter.connect(limiter);limiter.connect(this.output);this.output.connect(this.context.destination);
      }
      if(!this.background)await this.context.resume();
      this.active=true;this.apply();
      if(this.settings.music)this.loadMusic();
    } catch { this.active=false; }
  }
  setSettings(settings){this.settings=settings;this.apply();}
  setScene(scene){this.scene=scene;this.apply();}
  setBackground(value){
    this.background=Boolean(value);clearTimeout(this.backgroundTimer);this.apply();
    if(this.background&&this.context)this.backgroundTimer=setTimeout(()=>{if(this.background)this.context.suspend().catch(()=>{});},180);
    else if(this.context&&this.active)this.context.resume().catch(()=>{});
  }
  ramp(parameter,value,tau=.12){if(!parameter||!this.context)return;const now=this.context.currentTime;parameter.cancelScheduledValues(now);parameter.setTargetAtTime(value,now,tau);}
  apply(){
    if(!this.context)return;
    const s=this.settings;
    this.ramp(this.output.gain,s.muted||this.background?0:s.volume,.045);
    this.ramp(this.master.gain,s.sfx?s.sfxVolume*.19:0,.025);
    const paused=this.scene==='pause';
    const sceneGain=paused?.22:this.scene==='over'?.32:this.scene==='clear'?.64:this.scene==='menu'?.82:1;
    this.ramp(this.musicBus.gain,s.music?s.musicVolume*.75*sceneGain:0,.4);
    this.ramp(this.filter.frequency,paused?2200:13000,.35);
    const pulse={menu:.16,play:.65,trial:.92,pause:0,clear:.18,over:0}[this.scene]??.16;
    if(this.stemGains.length){this.ramp(this.stemGains[0].gain,1,.4);this.ramp(this.stemGains[1].gain,pulse,.65);}
    if(s.music&&this.active&&!this.loadPromise&&this.status!=='ready'&&(this.status!=='failed'||performance.now()-this.lastFailure>10000))this.loadMusic();
  }
  async readAsset(path){
    const url=asset(path);
    if(url.startsWith('data:')){const encoded=url.slice(url.indexOf(',')+1);return Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)).buffer;}
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);
    try{const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw new Error('Audio file unavailable');return await response.arrayBuffer();}finally{clearTimeout(timer);}
  }
  loadMusic(){
    if(this.loadPromise||this.status==='ready'||!this.context)return this.loadPromise;
    this.status='loading';this.onStatus?.(this.status);
    this.loadPromise=(async()=>{
      try{
        const names=['lanterns-hearth','lanterns-motion'];
        this.buffers=await Promise.all(names.map(async name=>this.context.decodeAudioData(await this.readAsset(`assets/${name}.mp3`))));
        const loopEnd=Math.min(106.6666666667,...this.buffers.map(b=>b.duration));
        const start=this.context.currentTime+.06;this.startedAt=start;
        this.buffers.forEach(buffer=>{
          const source=this.context.createBufferSource(),gain=this.context.createGain();
          source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=loopEnd;
          gain.gain.value=0;source.connect(gain);gain.connect(this.musicBus);
          source.start(start);this.sources.push(source);this.stemGains.push(gain);
        });
        this.status='ready';this.apply();
      }catch(error){this.status='failed';this.lastFailure=performance.now();this.buffers=[];}
      finally{this.loadPromise=null;this.onStatus?.(this.status);}
    })();return this.loadPromise;
  }
  suspendMusic(){this.setScene('pause');}
  resumeMusic(){this.apply();}
  ui(){const t=performance.now();if(t-this.lastUI<60)return;this.lastUI=t;this.tone(430,.045,'sine',.09);this.noise(.016,.06,2000);}
  snapshot(){return {state:this.context?.state||'uninitialized',sfx:this.settings.sfx,music:this.settings.music,muted:this.settings.muted,musicStatus:this.status,scene:this.scene,background:this.background,sources:this.sources.length,output:this.output?.gain.value??0,musicGain:this.musicBus?.gain.value??0,fxGain:this.master?.gain.value??0,stemGains:this.stemGains.map(n=>n.gain.value),loopDuration:this.sources[0]?.loopEnd||0,decodedBytes:this.buffers.reduce((n,b)=>n+b.length*b.numberOfChannels*4,0)};}
  tone(frequency,duration=.18,type='sine',gain=.5,delay=0){
    if(!this.context||!this.settings.sfx||this.settings.muted||this.background||!this.active)return;
    if(this.voiceCount>=32)return;this.voiceCount++;
    try{const now=this.context.currentTime+delay,o=this.context.createOscillator(),g=this.context.createGain();o.type=type;o.frequency.setValueAtTime(frequency,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),now+.005);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);g.connect(this.master);o.start(now);o.stop(now+duration+.025);o.onended=()=>{o.disconnect();g.disconnect();this.voiceCount=Math.max(0,this.voiceCount-1);};}catch{this.voiceCount=Math.max(0,this.voiceCount-1);}
  }
  noise(duration=.05,gain=.35,filter=1700){
    if(!this.context||!this.settings.sfx||this.settings.muted||this.background||!this.active)return;
    if(this.noiseCount>=12)return;this.noiseCount++;
    try{const ctx=this.context,n=Math.floor(ctx.sampleRate*duration),buf=ctx.createBuffer(1,n,ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/n*6);const source=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();source.buffer=buf;f.type='lowpass';f.frequency.value=filter;g.gain.value=gain;source.connect(f);f.connect(g);g.connect(this.master);source.start();source.onended=()=>{source.disconnect();f.disconnect();g.disconnect();this.noiseCount=Math.max(0,this.noiseCount-1);};}catch{this.noiseCount=Math.max(0,this.noiseCount-1);}
  }
  key(){const t=performance.now();if(t-this.lastKey<28)return;this.lastKey=t;this.noise(.024,.25,2200);this.tone(155+Math.random()*50,.026,'triangle',.18);}
  play(event){
    if(event.type==='input'&&event.added)this.key();
    if(event.type==='correct'){this.tone(740,.18,'sine',.34);this.tone(1110,.26,'sine',.12,.02);this.noise(.03,.12,3200);if(event.collected)this.tone(1480,.35,'sine',.2,.09);}
    if(event.type==='pressure'&&['worried','alarmed','critical'].includes(event.state?.key)){this.tone(event.state.key==='critical'?165:220,.22,'sine',.15);}
    if(event.type==='wrong'){this.tone(130,.12,'triangle',.35);this.noise(.04,.17,700);}
    if(event.type==='miss'){this.noise(.15,.55,900);this.tone(82,.14,'triangle',.2);}
    if(event.type==='unavailable')this.tone(240,.09,'sine',.18);
    if(event.type==='power'){
      const p=event.power;
      if(p==='fire'){this.noise(.65,.6,1700);this.tone(80,.45,'triangle',.5);}
      if(p==='ice'){[783,1174,1568].forEach((f,i)=>this.tone(f,.7,'sine',.25,i*.07));}
      if(p==='slow'){[440,330,220].forEach((f,i)=>this.tone(f,.4,'sine',.28,i*.11));}
      if(p==='wind'){this.noise(.7,.3,2300);this.tone(587.33,.5,'sine',.2);this.tone(880,.55,'sine',.15,.12);}
    }
    if(['start','next-level','resume'].includes(event.type)){this.tone(587.33,.2,'sine',.3);this.tone(880,.25,'sine',.24,.1);}
    if(event.type==='level-clear'){[587.33,739.99,880,1174.66].forEach((f,i)=>this.tone(f,.65,'sine',.35,i*.12));}
    if(event.type==='game-over'){[440,369.99,293.66,220].forEach((f,i)=>this.tone(f,.65,'sine',.32,i*.2));}
  }
}
