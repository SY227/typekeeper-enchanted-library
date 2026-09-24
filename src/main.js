import { asset } from './game/assets.js';
import { GameModel } from './game/model.js';
import { FixedClock } from './game/clock.js';
import { LocalStore } from './game/storage.js';
import { POWERS, POWER_META, PACES, RULES, RULESET_VERSION, normalizeInput, levelRules, wordCardWidth } from './game/rules.js';
import { CAMPAIGN, CAMPAIGN_LENGTH, WINGS, stageInfo, rankForStage } from './data/campaign.js';
import { pressureState } from './game/pressure.js';
import { powerForKey } from './game/controls.js';
import { WORD_COUNT } from './data/words.js';
import { GameRenderer } from './render/renderer.js';
import { GameAudio } from './audio/audio.js';
import { icon, ornament } from './ui/icons.js';
import { ScoreRollup } from './ui/score-rollup.js';

const $=id=>document.getElementById(id);
const stage=$('stage'),viewport=$('viewport'),screen=$('screen-layer'),typing=$('typing-input');
let localStorageAccess;try{localStorageAccess=window.localStorage;}catch{}
const store=new LocalStore(localStorageAccess),model=new GameModel(),clock=new FixedClock();
let settings=store.settings;
try{if(!localStorageAccess?.getItem('typekeeper-enchanted-library-v3.2')&&!localStorageAccess?.getItem('typekeeper-enchanted-library-v3.1')&&!localStorageAccess?.getItem('typekeeper-enchanted-library-v3')&&!localStorageAccess?.getItem('typing-maniac-library-v2')&&!localStorageAccess?.getItem('typing-maniac-library-v1')&&matchMedia('(prefers-reduced-motion: reduce)').matches)settings.motion=false;}catch{}
const renderer=new GameRenderer($('game-canvas'),model,settings),audio=new GameAudio(settings);
const audioMessage=status=>status==='degraded'?'Adaptive layers unavailable. The main theme still plays.':status==='failed'?'Music unavailable. The game remains playable.':status==='unsupported'?"Audio isn't available in this browser.":'';
audio.onStatus=status=>{const el=$('audio-status');if(el)el.textContent=audioMessage(status);};
let loaded=false,view='loading',returnView='menu',composing=false,lastHud=0,toastTimer=0;
let lastBest=0,quitReturn='pause',freezeSimulation=false,screenGeneration=0,runRecorded=false,mapWing=0;
let recordFilter=settings.pace,recordPeriod='all',recordMode='campaign',recordChapter=1;
let settingsTab='audio',resumeTimer=null,resumeGeneration=0,screenEntered=0,chapterTimer=null;
const learnedSpells=new Set();
const scoreRollup=new ScoreRollup();
let tallyMedal=0,lastTallyId='',scoreEmphasis=null;
let pauseSelection=[0,0];
const format=n=>Math.max(0,Math.round(Number(n)||0)).toLocaleString('en-US');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stars=n=>`<span class="medal-stars" aria-label="${n} of 3 stars">${[1,2,3].map(i=>`<span class="${i<=n?'earned':''}">✦</span>`).join('')}</span>`;
const modeLabel=m=>({campaign:'Campaign',practice:'Practice',endless:'Endless',legacy:'Legacy'}[m]||'Campaign');

function fit(){
 const vv=window.visualViewport;
 const aw=Math.max(240,Math.min(window.innerWidth,vv?.width||window.innerWidth)-16);
 const ah=Math.max(180,(vv?.height||window.innerHeight)-16);
 const width=Math.min(1440,aw,ah*4/3);
 viewport.style.width=`${width}px`;viewport.style.height=`${width*.75}px`;
 stage.style.transform=`scale(${width/1200})`;
 renderer.resize(Math.min(2,(window.devicePixelRatio||1)*width/1200));
}
window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
function applySettings(){
 stage.classList.toggle('reduced-motion',!settings.motion);
 stage.classList.toggle('no-spell-pulse',!settings.spellPulse);
 stage.classList.toggle('high-contrast',settings.contrast);
 stage.classList.toggle('focused-hud',!settings.detailedHUD);
 renderer.setSettings(settings);audio.setSettings(settings);store.update(settings);
 $('sound-button').innerHTML=icon(settings.muted?'mute':'sound');
 $('sound-button').setAttribute('aria-label',settings.muted?'Unmute audio':'Mute all audio');
 $('sound-button').setAttribute('title',settings.muted?'Unmute audio':'Mute all audio');
 $('sound-button').setAttribute('aria-pressed',String(settings.muted));
 if(!settings.hints)$('onboarding-hint').hidden=true;
}
function toast(text,error=false,duration=2900){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').className=`visible${error?' error':''}`;toastTimer=setTimeout(()=>{$('toast').className='';},duration);}
function announce(text){$('announcer').textContent=text;}
function focusGame(){if(model.phase==='playing'){typing.disabled=false;typing.focus({preventScroll:true});}}
function pulse(name){const dock=$('typing-dock');dock.classList.remove(name);void dock.offsetWidth;dock.classList.add(name);setTimeout(()=>dock.classList.remove(name),270);}
function setScreen(name,html=''){
 scoreRollup.cancel();audio.stopScore();
 view=name;screenEntered=performance.now();const generation=++screenGeneration;screen.dataset.screen=name;screen.innerHTML=html;
 $('play-hud').inert=Boolean(html);document.querySelector('.utility-controls').inert=Boolean(screen.querySelector('[role=dialog]'));
 stage.dataset.view=name;
 audio.setScene(name==='playing'?(model.info.trial?'trial':'play'):name==='pause'||name==='countdown'?'pause':name==='level-clear'?'clear':name==='game-over'?'over':model.phase==='paused'?'pause':'menu');
 typing.disabled=model.phase!=='playing';$('pause-button').hidden=!['playing','paused'].includes(model.phase);$('play-hud').hidden=model.phase==='menu';
 for(const p of POWERS)$(`spell-${p}`)?.setAttribute('tabindex',model.phase==='playing'?'0':'-1');
 if(html)requestAnimationFrame(()=>{if(generation===screenGeneration&&!screen.contains(document.activeElement))(screen.querySelector('[data-autofocus]')||screen.querySelector('button'))?.focus({preventScroll:true});});
}
const closeButton=(action='back')=>`<button class="close-button" data-action="${action}" aria-label="Close">${icon('close')}</button>`;
const modal=(body,classes='')=>`<div class="modal-scrim"><section class="modal parchment ${classes}" role="dialog" aria-modal="true" aria-labelledby="modal-title">${body}</section></div>`;
const primary=(label,action,extra='')=>`<button class="game-button" data-action="${action}" ${extra}>${label}${icon('arrow')}</button>`;
const secondary=(label,action,extra='')=>`<button class="game-button secondary" data-action="${action}" ${extra}>${label}</button>`;
function rememberReturn(){returnView=model.phase==='menu'?'menu':model.phase==='level-clear'?'level-clear':model.phase==='game-over'?'game-over':'pause';}
function wingAtmosphere(){stage.style.setProperty('--wing-color',model.info.color);stage.dataset.wing=String(model.info.wing);}
function showMenu(){
 clearTimeout(resumeTimer);resumeGeneration++;clearTimeout(chapterTimer);
 $('chapter-reveal').className='';$('onboarding-hint').hidden=true;
 if(model.phase!=='menu'){model.reset();renderer.reset();clock.reset();}
 typing.value='';audio.setPressure(0);$('toast').className='';stage.dataset.pressure='calm';stage.dataset.wing='1';
 const progress=store.progress(settings.pace),cp=store.checkpoint(settings.pace);
 const done=!!progress.stages[48]&&progress.stages[48].campaignClear!==false;
 setScreen('menu',`<section class="title-scene" aria-label="Main menu">
  <div class="title-lockup"><div class="keeper-crest" aria-hidden="true">${icon('quill')}</div><h1>TYPEKEEPER</h1><p class="title-subtitle">ENCHANTED LIBRARY</p></div>
  <div class="menu-panel parchment"><div class="menu-actions">
   ${primary(cp?'Continue':'Play',cp?'continue':'start','data-autofocus')}
   ${cp?`<span class="continue-detail">${String(cp.nextLevel).padStart(2,'0')} · ${esc(stageInfo(cp.nextLevel).title)}</span>`:''}
   ${secondary('Chapters','map')}${secondary('Records','records')}${secondary('How to play','how')}
   ${done?secondary('The Infinite Archive','endless'):''}
  </div><div class="menu-links"><button class="text-button" data-action="settings">${icon('gear')} Settings</button><button class="text-button" data-action="about">Credits</button>${cp?'<button class="text-button" data-action="new-confirm">New game</button>':''}</div></div>
 </section>`);
 audio.resumeMusic();
}
function chapterReveal(){
 stage.classList.remove('chapter-enter');void stage.offsetWidth;stage.classList.add('chapter-enter');
}
function beginPresentation(){
 lastTallyId='';runRecorded=false;lastBest=store.best(model.pace,model.mode,model.startLevel);clock.reset();typing.value=model.buffer;setScreen('playing');wingAtmosphere();renderHud();focusGame();audio.unlock();
 chapterReveal();
 $('onboarding-hint').hidden=!(settings.hints&&model.level===1&&model.correct===0);
 announce(`${model.mode==='practice'?'Practice. ':''}Chapter ${model.level}. ${model.info.title}. ${model.info.trial?'Archive trial. ':''}Magic shortcuts: 1 fire, 2 ice, 3 slow, 4 wind.`);
}
function start(seed,level=1,mode='campaign'){
 const array=new Uint32Array(1);try{crypto.getRandomValues(array);}catch{array[0]=Date.now();}
 if(mode==='campaign')store.clearCheckpoint(settings.pace);
 model.start({seed:seed??array[0],pace:settings.pace,level,mode});
 if(mode==='practice'||mode==='endless')for(const p of POWERS)model.inventory[p]=1;
 if(mode==='campaign')store.setCheckpoint(model.checkpoint());
 beginPresentation();
 
}
function continueRun(){const cp=store.checkpoint(settings.pace);if(!cp){showMenu();return;}model.restoreCheckpoint(cp);beginPresentation();}
function showHow(){
 rememberReturn();
 setScreen('how',modal(`${closeButton()}<h2 id="modal-title">How to play</h2>
 <div class="tutorial-steps"><div class="tutorial-step"><span class="step-num">01</span><h3>Type</h3><p>Type a falling word. Press <kbd>ENTER</kbd> to save it. Backspace corrects a typo.</p></div><div class="tutorial-step"><span class="step-num">02</span><h3>Prioritize</h3><p>Save the lowest words first. Missed words fill the paper pile. At 100%, the run ends.</p></div><div class="tutorial-step"><span class="step-num">03</span><h3>Cast</h3><p>Colored words earn spells. Press <kbd>1</kbd>–<kbd>4</kbd> or click a glowing book. Your typed word stays intact.</p></div></div>
 <div class="power-guide">${POWERS.map(p=>`<div class="power-guide-item"><span class="guide-hotkey">${POWER_META[p].key}</span><img src="${asset(`assets/book-${p}.svg`)}" alt=""><h3>${POWER_META[p].name}</h3><p>${POWER_META[p].description}</p></div>`).join('')}</div>
 <details class="rules-details"><summary>Scoring & mastery</summary><p>Every 8 correct words raises your multiplier, up to ×3. Dark cards score double. A wrong submission adds 2% to the pile. FIRE clears words without score or chapter progress.</p><p>Three stars: no misses or wrong submissions. Two stars: no more than 2 misses and 3 wrong submissions. ICE pauses SLOW’s timer so both spells keep their full value. Store up to three of each spell. A spell that cannot help is not consumed. Missing a word still costs pile pressure, but submitting it within 0.35 seconds of landing does not add a second penalty.</p></details>
 <div class="modal-actions">${primary(model.phase==='menu'?(store.checkpoint(settings.pace)?'Continue':'Play'):'Back',model.phase==='menu'?(store.checkpoint(settings.pace)?'continue':'start'):'back','data-autofocus')}</div>`,'wide'));
}
function showPause(reason='manual'){
 if(!['playing','paused'].includes(model.phase))return;
 clearTimeout(resumeTimer);resumeGeneration++;
 if(model.phase==='playing')pauseSelection=[typing.selectionStart??model.buffer.length,typing.selectionEnd??model.buffer.length];
 model.pause(reason);typing.value=model.buffer;
 setScreen('pause',modal(`<div class="modal-seal">${icon('pause')}</div><h2 id="modal-title">Paused</h2>${reason==='focus'?'<p>Paused while you were away.</p>':''}<div class="pause-summary"><div>CHAPTER<strong>${String(model.level).padStart(2,'0')}</strong></div><div>SCORE<strong>${format(model.score)}</strong></div><div>PILE<strong>${Math.round(model.danger)}%</strong></div></div><div class="modal-actions stacked">${primary('Resume','resume','data-autofocus')}${secondary('Settings','settings')}${secondary('How to play','how')}${secondary('Main menu','quit')}</div>`,'compact'));
}
function resume(){
 if(model.phase!=='paused')return;
 const finish=()=>{model.resume();clock.reset();typing.value=model.buffer;setScreen('playing');audio.resumeMusic();focusGame();try{typing.setSelectionRange(...pauseSelection);}catch{};};
 if(!settings.resumeCountdown||!settings.motion){finish();return;}
 const token=++resumeGeneration;let n=3;
 const tick=()=>{if(token!==resumeGeneration||model.phase!=='paused')return;if(n===0){finish();return;}
 setScreen('countdown',`<div class="resume-scrim"><div class="resume-count" role="status" aria-label="Resuming in ${n}">${n}</div></div>`);n--;resumeTimer=setTimeout(tick,520);};tick();
}
function showSettings(tab=settingsTab){
 rememberReturn();settingsTab=['audio','gameplay','display'].includes(tab)?tab:'audio';
 const toggle=(key,title,desc='')=>`<div class="setting-row"><div><strong>${title}</strong>${desc?`<p>${desc}</p>`:''}</div><button class="toggle" role="switch" aria-label="${title}" aria-checked="${settings[key]}" data-toggle="${key}">${settings[key]?'ON':'OFF'}</button></div>`;
 const slider=(key,title)=>`<div class="setting-row"><strong>${title}</strong><div class="range-wrap"><input id="${key}-range" data-volume="${key}" aria-label="${title}" type="range" min="0" max="100" value="${Math.round(settings[key]*100)}"><output id="${key}-output">${Math.round(settings[key]*100)}%</output></div></div>`;
 let body='';
 if(settingsTab==='audio')body=`${slider('volume','Master volume')}${slider('musicVolume','Music volume')}${slider('sfxVolume','Effects volume')}${toggle('music','Music')}${toggle('adaptiveMusic','Pressure-responsive music','The score grows more urgent as the paper pile rises.')}${toggle('sfx','Typewriter & spells')}<div class="now-playing"><span>ORIGINAL SCORE</span><strong>Lanterns & Letters</strong><small id="audio-status">${audioMessage(audio.status)}</small></div>`;
 if(settingsTab==='gameplay')body=`<div class="setting-row"><div><strong>Difficulty</strong><p>Applies to your next run.</p></div><select id="pace-select" aria-label="Difficulty">${Object.entries(PACES).map(([k,v])=>`<option value="${k}" ${k===settings.pace?'selected':''}>${v.label}</option>`).join('')}</select></div>${toggle('resumeCountdown','Resume countdown','A short countdown before words move again.')}${toggle('hints','First-use hints','A brief introduction to typing and newly collected spells.')}<p class="settings-note">Each difficulty has separate chapter progress and records.</p>`;
 if(settingsTab==='display')body=`${toggle('motion','Ambient animation')}${toggle('typingShimmer','Typing shimmer','Small ink sparks and a gleam on completed words.')}${toggle('spellPulse','Spell-ready pulse')}${toggle('contrast','Higher contrast')}${toggle('detailedHUD','Detailed HUD','Show WPM, accuracy, and your personal best.')}`;
 setScreen('settings',modal(`${closeButton()}<h2 id="modal-title">Settings</h2><nav class="settings-tabs" aria-label="Settings sections">${[['audio','Audio'],['gameplay','Gameplay'],['display','Display']].map(([k,v])=>`<button data-settings-tab="${k}" aria-pressed="${settingsTab===k}" class="${settingsTab===k?'selected':''}">${v}</button>`).join('')}</nav><div class="settings-body">${body}</div><div class="modal-actions">${primary('Done','back','data-autofocus')}</div>`,'settings-modal'));
}
function showMap(wing=mapWing){
 rememberReturn();mapWing=Math.max(0,Math.min(7,Number(wing)||0));const progress=store.progress(settings.pace),w=WINGS[mapWing],total=Object.values(progress.stages).reduce((n,s)=>n+s.medal,0);
 setScreen('map',modal(`${closeButton()}<div class="eyebrow">${PACES[settings.pace].label.toUpperCase()}</div><h2 id="modal-title">Chapters</h2><div class="atlas-total"><span>${Object.values(progress.stages).filter(s=>s.campaignClear!==false).length} / 48 chapters complete</span><span>✦ ${total} / 144 stars</span></div><nav class="wing-tabs" aria-label="Library wings">${WINGS.map((a,i)=>`<button data-wing="${i}" aria-label="${a.name}" aria-pressed="${i===mapWing}" class="${i===mapWing?'selected':''}"><span>${a.seal}</span>${a.name.replace('The ','')}</button>`).join('')}</nav><div class="wing-heading"><span class="wing-seal">${w.seal}</span><div><h3>${w.name}</h3><p>${w.story}</p></div></div><div class="stage-grid">${CAMPAIGN.slice(mapWing*6,mapWing*6+6).map(s=>{const record=progress.stages[s.level],unlocked=s.level<=progress.unlocked,cfg=levelRules(s.level,settings.pace);return `<button class="stage-tile ${record?'cleared':''} ${s.trial?'trial':''}" data-stage="${s.level}" ${unlocked?'':'disabled'} aria-label="Chapter ${s.level}: ${s.title}${unlocked?', practice':', locked'}"><span class="stage-index">${String(s.level).padStart(2,'0')}</span><span class="tile-title">${s.title}</span><span class="tile-meta">${unlocked?`${cfg.quota} WORDS · ${s.trial?'ARCHIVE TRIAL':'STANDARD'}`:'LOCKED'}</span>${record?stars(record.medal):`<span class="stage-status">${unlocked?'PRACTICE':'LOCKED'}</span>`}</button>`;}).join('')}</div><p class="fine-print">Select an unlocked chapter to practice.</p><div class="modal-actions">${primary(store.checkpoint(settings.pace)?'Continue':'Play',store.checkpoint(settings.pace)?'continue':'start','data-autofocus')}</div>`,'atlas'));
}
function showRecords(){
 rememberReturn();const rows=store.filteredRecords({pace:recordFilter,mode:recordMode,period:recordPeriod,chapter:recordMode==='practice'?recordChapter:null}).slice(0,10);
 const table=rows.length?`<div class="record-scroll"><table class="record-table"><thead><tr><th>RANK</th><th>SCORE</th><th>CHAPTER</th><th>WPM</th><th>ACCURACY</th><th>DATE</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td><span class="rank-medal rank-${i+1}">${i+1}</span></td><td><strong>${format(r.score)}</strong>${r.victory?'<span class="record-crown">COMPLETE</span>':''}${r.retries?`<span class="record-crown">${format(r.retries)} RETRIES</span>`:''}${r.retired?'<span class="record-crown">RETIRED</span>':''}</td><td>${r.level}</td><td>${format(r.wpm)}</td><td>${format(r.accuracy)}%</td><td>${esc(new Date(r.date).toLocaleDateString(undefined,{month:'short',day:'numeric'}))}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-records">${icon('book')}<h3>A fresh page.</h3><p>No completed runs in this view yet.</p></div>`;
 setScreen('records',modal(`${closeButton()}<div class="eyebrow">LOCAL RECORDS</div><h2 id="modal-title">Records</h2><div class="record-filter" aria-label="Record period">${[['today','Today'],['week','Last 7 days'],['all','All time']].map(([v,l])=>`<button data-period="${v}" class="${v===recordPeriod?'active':''}" aria-pressed="${v===recordPeriod}">${l}</button>`).join('')}</div><div class="record-selects"><label>Pace <select id="records-pace">${Object.entries(PACES).map(([v,p])=>`<option value="${v}" ${v===recordFilter?'selected':''}>${p.label}</option>`).join('')}</select></label><label>Run type <select id="records-mode">${['campaign','practice','endless','legacy'].map(v=>`<option value="${v}" ${v===recordMode?'selected':''}>${modeLabel(v)}</option>`).join('')}</select></label>${recordMode==='practice'?`<label>Chapter <select id="records-chapter">${CAMPAIGN.map(c=>`<option value="${c.level}" ${c.level===recordChapter?'selected':''}>${String(c.level).padStart(2,'0')} · ${esc(c.title)}</option>`).join('')}</select></label>`:''}</div>${table}<div class="modal-actions">${primary('Play','start','data-autofocus')}${secondary('Export save','export-save')}${secondary('Import save','import-save')}</div><input type="file" id="save-file" accept="application/json,.json" hidden><p class="fine-print">${store.available?'Saved in this browser. Export to keep a backup.':'Browser storage is unavailable. Export to keep your progress.'}</p>${store.records.length?'<button class="text-button" data-action="clear-records">Clear local scores</button>':''}`,'wide'));
}
function showClear(event=model.lastClear){
 if(!event)return;typing.value='';const info=model.info,next=stageInfo(model.level+1),isFinal=model.level===48&&model.mode==='campaign';
 const stageAcc=event.accuracy??model.stageAccuracy,stageWpm=event.wpm??model.stageWpm;
 setScreen('level-clear',modal(`<div class="chapter-medallion ${info.trial?'trial-medallion':''}"><span>${isFinal?'✦':info.seal}</span></div><div class="eyebrow">${isFinal?'THE EXPEDITION IS COMPLETE':`CHAPTER ${String(model.level).padStart(2,'0')}`}</div><h2 id="modal-title">${isFinal?'The library is yours.':event.perfect?'Perfect chapter':info.trial?'Trial complete':'Chapter complete'}</h2>${stars(event.medal||1)}<p>${isFinal?'All 48 chapters complete. The Infinite Archive awaits.':event.perfect?'No missed words. No incorrect submissions.':`${info.title}`}</p><div class="result-score" aria-label="${format(model.score)} points"><span id="result-score-value" aria-hidden="true">${format(model.score)}</span><small>${modeLabel(model.mode).toUpperCase()} SCORE</small></div><div class="bonus-tag">CHAPTER BONUS <strong>+${format(event.bonus)}</strong>${event.perfect?' · PERFECT':''}</div><div class="result-grid"><div><strong>${format(event.words??model.stageCorrect)}</strong><span>WORDS SAVED</span></div><div><strong>${stageWpm}</strong><span>WPM</span></div><div><strong>${stageAcc}%</strong><span>ACCURACY</span></div></div>${!isFinal&&model.mode!=='practice'?`<div class="next-preview"><span>NEXT ${String(model.level+1).padStart(2,'0')}</span><strong>${next.title}</strong><small>${next.trial?'ARCHIVE TRIAL':next.wingName}</small></div>`:''}<div class="modal-actions">${isFinal?primary('The Infinite Archive','endless','data-autofocus'):model.mode==='practice'?primary('Practice again','restart','data-autofocus'):primary('Next chapter','next','data-autofocus')}${secondary('Main menu','menu')}</div><p class="fine-print">${isFinal?(store.available?'Campaign complete. Progress saved.':'Campaign complete. Export your save to keep it.') :model.mode==='campaign'?(store.available?'Progress saved.':'Export your save to keep your progress.'):model.mode==='endless'?'Endless run in progress.':'Practice complete.'}</p>`));
 beginScoreTally(`clear/${model.seed}/${model.level}/${model.score}`,model.score-(event.bonus||0),model.score,event.medal||1);
 announce(`Chapter ${model.level} saved. ${event.medal} stars. ${isFinal?'Expedition complete.':''}`);
}
function showOver(result=model.lastResult){
 if(!result)return;typing.value='';audio.suspendMusic();
 const best=result.ruleset===RULESET_VERSION&&result.score>lastBest;
 setScreen('game-over',modal(`<div class="modal-seal">${icon('quill')}</div><div class="eyebrow">${best?'A NEW PERSONAL BEST':'THE END OF THE RUN'}</div><h2 id="modal-title">Run complete</h2><p>The paper pile is full.</p><div class="result-score" aria-label="${format(result.score)} points"><span id="result-score-value" aria-hidden="true">${format(result.score)}</span><small>${modeLabel(result.mode).toUpperCase()} POINTS</small></div><div class="result-grid"><div><strong>${result.level}</strong><span>CHAPTER REACHED</span></div><div><strong>${result.wpm}</strong><span>WORDS / MIN</span></div><div><strong>${result.accuracy}%</strong><span>ACCURACY</span></div></div><div class="run-breakdown"><span>Words saved <b>${format(result.words)}</b></span><span>Best streak <b>${format(result.streak)}</b></span><span>Mastery stars <b>${format(result.medals)}</b></span></div><div class="modal-actions stacked">${primary(model.mode==='campaign'&&store.checkpoint(model.pace)?'Retry chapter':'Try again',model.mode==='campaign'&&store.checkpoint(model.pace)?'retry-chapter':'restart','data-autofocus')}${model.mode==='campaign'?secondary('New game','new-confirm'):''}${secondary('Records','records')}${secondary('Main menu','menu')}</div><p class="fine-print">${result.ruleset!==RULESET_VERSION?'This continued run is kept in Legacy records.':store.available?'Your chapter unlocks and stars are saved.':'Export your save from Records to keep your progress.'}</p>`));
 beginScoreTally(`over/${model.seed}/${model.level}/${result.score}`,0,result.score,0);
 announce(`Run over. ${result.score} points. Chapter ${result.level}.`);
}
function beginScoreTally(id,from,to,medal){
 if(lastTallyId===id)return;
 lastTallyId=id;tallyMedal=medal;
 const el=$('result-score-value');if(!el)return;
 el.textContent=format(scoreRollup.start(from,to,performance.now(),{duration:medal?1050:900,reduced:!settings.motion}));
 el.classList.toggle('counting',scoreRollup.active);
 // Scores and stars are saved already; this is a short, interruptible ceremony.
 if(scoreRollup.active)screen.querySelector('.medal-stars')?.classList.add('awaiting-score');
}
function finishScoreTally(sound=true){
 const el=$('result-score-value');if(!el)return;
 const result=scoreRollup.finish();el.textContent=format(result.value);el.classList.remove('counting');el.classList.add('settled');
 const starsEl=screen.querySelector('.medal-stars');starsEl?.classList.remove('awaiting-score');starsEl?.classList.add('score-awarded');
 if(sound)audio.tallyComplete(tallyMedal);
}
function updateScoreTally(now){
 if(!scoreRollup.active)return;
 const el=$('result-score-value');if(!el){scoreRollup.cancel();return;}
 const result=scoreRollup.step(now);el.textContent=format(result.value);
 if(result.tick)audio.tallyTick(result.progress);
 if(result.done)finishScoreTally();
}
screen.addEventListener('click',e=>{if(e.target.closest('#result-score-value')&&scoreRollup.active)finishScoreTally();});
function showAbout(){
 rememberReturn();setScreen('about',modal(`${closeButton()}<div class="credits-crest">${icon('quill')}</div><h2 id="modal-title">Typekeeper</h2><p class="credits-subtitle">Enchanted Library</p><div class="credits-list"><span>CREATED BY</span><strong>FoxForge Studio</strong><span>ORIGINAL MUSIC</span><strong>Lanterns & Letters</strong><span>WITH THANKS</span><strong>To every keeper of stories.</strong></div><div class="modal-actions">${primary('Back','back','data-autofocus')}</div>`,'compact'));
}
function goBack(){if(returnView==='menu')showMenu();else if(returnView==='level-clear')showClear();else if(returnView==='game-over')showOver();else showPause();}
function showQuit(){
 quitReturn=model.phase==='level-clear'?'level-clear':'pause';const cp=store.checkpoint(model.pace);
 setScreen('quit',modal(`${closeButton('cancel-quit')}<h2 id="modal-title">Return to the main menu?</h2><p>${model.mode==='campaign'&&cp?`Continue returns to the start of Chapter ${cp.nextLevel}. ${model.phase==='level-clear'?'The completed chapter is already saved.':'Only progress since this chapter began is discarded.'}`:model.mode==='endless'?'Your current score will be recorded as a retired Endless run.':'This practice attempt will end. Previously earned stars are kept.'}</p><div class="modal-actions stacked">${primary('Keep playing','cancel-quit','data-autofocus')}${secondary('Main menu','menu')}</div>`,'compact'));
}
function downloadJSON(content,name){const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function perform(action){
 if(!loaded)return;
 switch(action){
  case 'start':if(store.checkpoint(settings.pace))perform('new-confirm');else start();break;
  case 'fresh-start':start();break;
  case 'continue':continueRun();break;
  case 'retry-chapter':{const cp=store.checkpoint(model.pace);if(cp&&cp.seed===model.seed){model.restoreCheckpoint(cp);beginPresentation();}break;}
  case 'restart':start(undefined,model.mode==='practice'?model.startLevel:model.mode==='endless'?49:1,model.mode);break;
  case 'endless':if(store.progress(settings.pace).stages[48]&&store.progress(settings.pace).stages[48].campaignClear!==false)start(undefined,49,'endless');else toast('Complete all 48 chapters to unlock the Infinite Archive.');break;
  case 'menu':if(model.mode==='endless'&&model.phase!=='menu'&&model.phase!=='game-over'&&!runRecorded&&model.time>0){store.add(model.retire());runRecorded=true;}showMenu();break;
  case 'how':showHow();break;
  case 'settings':showSettings();break;
  case 'records':showRecords();break;
  case 'map':showMap(Math.floor((store.progress(settings.pace).unlocked-1)/6));break;
  case 'about':showAbout();break;
  case 'resume':resume();break;
  case 'back':goBack();break;
  case 'next':if(model.phase==='level-clear'&&model.nextLevel()){clock.reset();typing.value='';setScreen('playing');wingAtmosphere();renderHud();focusGame();audio.resumeMusic();chapterReveal();}break;
  case 'quit':showQuit();break;
  case 'cancel-quit':quitReturn==='level-clear'?showClear():showPause();break;
  case 'new-confirm':setScreen('new-confirm',modal(`<div class="eyebrow">A FRESH BEGINNING</div><h2 id="modal-title">Start a new game?</h2><p>Your current run will be replaced. Chapter unlocks, stars, and records stay saved.</p><div class="modal-actions">${secondary('Cancel','menu','data-autofocus')}${primary('New game','fresh-start')}</div>`,'compact'));break;
  case 'export-replay':downloadJSON(JSON.stringify(model.exportReplay(),null,2),`typekeeper-replay-${model.seed}.json`);toast('Replay exported. It contains the in-game words and commands you typed.');break;
  case 'export-save':downloadJSON(store.exportData(),'Typekeeper_Save.json');toast('Save exported.');break;
  case 'import-save':$('save-file')?.click();break;
  case 'clear-records':setScreen('clear-records',modal(`<div class="eyebrow">LOCAL SCORES</div><h2 id="modal-title">Clear records?</h2><p>Records will be deleted. Chapter progress and settings stay saved.</p><div class="modal-actions">${secondary('Keep records','records','data-autofocus')}${primary('Clear scores','confirm-clear')}</div>`,'compact'));break;
  case 'confirm-clear':store.clearRecords();showRecords();break;
 }
}
screen.addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target||target.disabled)return;
 audio.unlock();audio.ui();
 if(target.dataset.action)perform(target.dataset.action);
 if(target.dataset.settingsTab)showSettings(target.dataset.settingsTab);
 if(target.dataset.toggle){const key=target.dataset.toggle;settings[key]=!settings[key];applySettings();audio.unlock();target.setAttribute('aria-checked',String(settings[key]));target.textContent=settings[key]?'ON':'OFF';}
 if(target.dataset.period){recordPeriod=target.dataset.period;showRecords();}
 if(target.dataset.wing!==undefined)showMap(Number(target.dataset.wing));
 if(target.dataset.stage){const n=Number(target.dataset.stage);if(n<=store.progress(settings.pace).unlocked)start(undefined,n,'practice');}
});
screen.addEventListener('change',async e=>{
 if(e.target.id==='pace-select'){settings.pace=e.target.value;applySettings();}
 if(e.target.id==='records-pace'){recordFilter=e.target.value;showRecords();}
 if(e.target.id==='records-mode'){recordMode=e.target.value;if(recordMode==='practice')recordChapter=model.mode==='practice'?model.startLevel:1;showRecords();}
 if(e.target.id==='records-chapter'){recordChapter=Number(e.target.value);showRecords();}
 if(e.target.id==='save-file'){
  const file=e.target.files?.[0];if(!file)return;
  try{if(file.size>2*1024*1024)throw new Error('Save files must be smaller than 2 MB.');store.importData(JSON.parse(await file.text()));settings=store.settings;applySettings();showRecords();toast('Save imported.');}catch(error){toast(error.message||'That save could not be imported.',true,4500);}
 }
});
screen.addEventListener('input',e=>{const key=e.target.dataset.volume;if(['volume','musicVolume','sfxVolume'].includes(key)){settings[key]=Number(e.target.value)/100;$(key+'-output').textContent=e.target.value+'%';applySettings();}});
screen.addEventListener('keydown',e=>{
 if(e.key==='Enter'&&(e.repeat||performance.now()-screenEntered<260)){e.preventDefault();return;}
 if(e.key==='Tab'){
  const items=[...screen.querySelectorAll('button:not([disabled]),select,input:not([hidden]),a[href]')].filter(el=>el.offsetParent!==null),first=items[0],last=items.at(-1);if(!first)return;
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
function quickCast(power,source='hotkey'){
 if(model.phase!=='playing')return false;
 const selection=[typing.selectionStart,typing.selectionEnd],text=typing.value;
 const ok=model.cast(power,source);processEvents();renderHud();focusGame();typing.value=text;try{typing.setSelectionRange(...selection);}catch{}
 return ok;
}
typing.addEventListener('compositionstart',()=>{composing=true;});
typing.addEventListener('compositionend',()=>{composing=false;model.setBuffer(typing.value);typing.value=model.buffer;});
typing.addEventListener('input',()=>{if(composing||model.phase!=='playing')return;const raw=typing.value,pos=typing.selectionStart??raw.length;model.setBuffer(raw);typing.value=model.buffer;const cursor=normalizeInput(raw.slice(0,pos)).length;try{typing.setSelectionRange(cursor,cursor);}catch{}});
typing.addEventListener('keydown',e=>{
 if(e.metaKey||e.ctrlKey||e.altKey||composing||e.isComposing)return;
 if(e.key==='Enter'){e.preventDefault();if(e.repeat)return;model.submit();typing.value=model.buffer;processEvents();renderHud();}
 if(e.key===' ')e.preventDefault();
});
typing.addEventListener('paste',e=>{e.preventDefault();toast('Paste is disabled during play.');});
window.addEventListener('keydown',e=>{
 if(model.phase==='playing'&&document.activeElement!==typing&&!composing&&!e.isComposing&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&/^[a-zA-Z]$/.test(e.key)){e.preventDefault();const a=typing.selectionStart??model.buffer.length,b=typing.selectionEnd??a;const text=model.buffer.slice(0,a)+e.key+model.buffer.slice(b);focusGame();model.setBuffer(text);typing.value=model.buffer;const caret=Math.min(a+1,typing.value.length);typing.setSelectionRange(caret,caret);return;}
 if(model.phase==='playing'&&!composing&&!e.isComposing){
  const power=powerForKey(e);if(power){e.preventDefault();e.stopPropagation();quickCast(power);return;}
  // Held shortcut keys never type digits or consume an additional book.
  if(e.repeat&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&/^(Digit|Numpad)[1-4]$/.test(e.code)){e.preventDefault();return;}
 }
 if(e.key!=='Escape'||e.repeat||e.metaKey||e.ctrlKey)return;
 if(model.phase==='playing'){e.preventDefault();showPause();}
 else if(view==='pause'){e.preventDefault();resume();}
 else if(view==='countdown'){e.preventDefault();showPause();}
 else if(['how','settings','about','records','map'].includes(view)){e.preventDefault();goBack();}
 else if(view==='quit'){e.preventDefault();perform('cancel-quit');}
 else if(view==='new-confirm'){e.preventDefault();showMenu();}
 else if(view==='clear-records'){e.preventDefault();showRecords();}
},true);
stage.addEventListener('pointerdown',e=>{if(model.phase==='playing'&&!e.target.closest('button,input,select'))focusGame();});
$('pause-button').innerHTML=icon('pause');$('fullscreen-button').innerHTML=icon('fullscreen');
$('pause-button').addEventListener('click',()=>{if(model.phase==='paused')resume();else if(model.phase==='playing')showPause();});
$('sound-button').addEventListener('click',()=>{settings.muted=!settings.muted;applySettings();audio.unlock();focusGame();});
$('fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Use your browser’s fullscreen command.');}catch{toast('Fullscreen was blocked. The game still works in this window.');}fit();focusGame();});
document.addEventListener('fullscreenchange',()=>{$('fullscreen-button').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');fit();});
function pauseForFocus(){audio.setBackground(true);if(model.phase==='playing'||view==='countdown')showPause('focus');}
window.addEventListener('focus',()=>audio.setBackground(false));
window.addEventListener('blur',pauseForFocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseForFocus();else audio.setBackground(false);});
document.addEventListener('pointerdown',()=>audio.unlock(),{once:true});
document.addEventListener('keydown',()=>audio.unlock(),{once:true});

function buildInventory(){
 $('spell-inventory').innerHTML=POWERS.map(p=>`<button type="button" class="spell-slot" data-power="${p}" id="spell-${p}" aria-keyshortcuts="${POWER_META[p].key}" aria-describedby="tip-${p}" aria-label="${p}: no books yet" aria-disabled="true"><span class="spell-aura" aria-hidden="true"></span><span class="spell-keycap" aria-hidden="true">${POWER_META[p].key}</span><span class="spell-ready" id="ready-${p}">COLLECT</span><img class="spell-book" src="${asset(`assets/book-${p}.svg`)}" alt=""><span class="book-count" id="count-${p}">0</span><span class="spell-command">${POWER_META[p].name}</span><span class="spell-stock" id="stock-${p}" aria-hidden="true"><i></i><i></i><i></i></span><span class="spell-tip" id="tip-${p}" role="tooltip"><b>${POWER_META[p].name} · ${POWER_META[p].key}</b>${POWER_META[p].detail}</span><span class="spell-timer" id="timer-${p}" aria-hidden="true"></span></button>`).join('');
 for(const p of POWERS){$(`spell-${p}`).addEventListener('pointerdown',e=>{if(model.phase==='playing')e.preventDefault();});$(`spell-${p}`).addEventListener('click',()=>quickCast(p,'button'));}
}
let previousStock={fire:0,ice:0,slow:0,wind:0},lastPressureKey='';
// Avoid reparsing unchanged HUD markup on every frame/key; keep live node identity.
function setText(id,value){const el=$(id),text=String(value);if(el.textContent!==text)el.textContent=text;}
function setHTML(id,value){const el=$(id);if(el.innerHTML!==value)el.innerHTML=value;}
function renderHud(){
 audio.setPressure(model.danger);
 if(model.phase==='menu')return;
 setText('score-value',format(model.score));setText('best-value',format(store.best(model.pace,model.mode,model.startLevel)));
 setText('chapter-label',`${model.mode==='practice'?'PRACTICE · ':''}CHAPTER ${String(model.level).padStart(2,'0')}`);
 setText('chapter-name',model.info.title);$('chapter-fill').style.width=`${Math.min(100,model.progress/model.config.quota*100)}%`;setText('progress-value',`${model.progress} / ${model.config.quota}`);
 setText('wing-name',model.info.wingName);setText('rank-value',rankForStage(model.level));
 $('trial-indicator').hidden=!model.info.trial;setText('trial-indicator',model.trialRest?'TRIAL · BREATHE':`TRIAL · WAVE ${Math.max(1,Math.ceil(model.spawnedThisLevel/5))}`);
 setText('wpm-value',String(model.wpm));setHTML('accuracy-value',`${model.accuracy}<small>%</small>`);setText('streak-value',String(model.streak));setText('multiplier-value',`×${model.multiplier}`);
 document.querySelector('.streak-stat').classList.toggle('charged',model.streak>=8);
 const meter=Math.round(model.danger);$('limit-fill').style.height=`${model.danger}%`;setHTML('limit-value',`${meter}<small>%</small>`);$('limit-instrument').classList.toggle('danger',meter>=50);$('limit-instrument').classList.toggle('critical',meter>=90);$('limit-instrument').setAttribute('aria-label',`Paper pile limit ${meter} percent`);
 const pressure=model.pressure;stage.dataset.pressure=pressure.key;$('character-status').dataset.state=pressure.key;setText('character-mood',pressure.label);$('character-status').style.setProperty('--pressure-color',pressure.color);
 const rescue=model.danger>=50&&model.inventory.wind>0&&model.phase==='playing';$('rescue-hint').hidden=!rescue;setText('rescue-hint',model.danger>=90?'PRESS 4 · RESCUE':'PRESS 4 · CLEAR PILE');$(`spell-wind`).classList.toggle('rescue',rescue);
 for(const p of POWERS){
  const status=model.spellStatus(p),count=status.count,active=status.remaining>0,queued=status.state==='queued',slot=$(`spell-${p}`),ready=status.ready;
  setText(`count-${p}`,String(count));slot.classList.toggle('available',count>0);slot.classList.toggle('cast-ready',ready);slot.classList.toggle('effect-active',active);slot.setAttribute('aria-disabled',String(!ready||model.phase!=='playing'));
  slot.setAttribute('aria-label',`${POWER_META[p].name}, shortcut ${POWER_META[p].key}. ${queued?`Queued until ICE ends. ${Math.ceil(model.effects[p])} seconds saved.`:active?`Active, ${Math.ceil(model.effects[p])} seconds remaining.`:ready?`${count} books ready.`:count?`${count} books stored. ${status.reason==='empty-pile'?'The pile is empty.':status.reason==='empty-field'?'No falling words to clear.':'Available during play.'}`:'No books yet. Collect a colored word.'}`);
  setText(`ready-${p}`,queued?'QUEUED':active?'ACTIVE':ready?'READY':count?'STORED':'COLLECT');setText(`timer-${p}`,active?`${model.effects[p].toFixed(1)}s`:'');
  slot.style.setProperty('--effect-progress',active?String(model.effects[p]/(p==='ice'?RULES.iceDuration:RULES.slowDuration)):0);
  [...$(`stock-${p}`).children].forEach((el,i)=>el.classList.toggle('filled',i<count));
  if(count>previousStock[p]){slot.classList.remove('just-ready');void slot.offsetWidth;slot.classList.add('just-ready');setTimeout(()=>slot.classList.remove('just-ready'),1800);}previousStock[p]=count;
 }
 setHTML('effect-status',['ice','slow'].filter(p=>model.effects[p]>0).map(p=>`<span class="effect-chip" style="color:${POWER_META[p].color}"><img src="${asset(`assets/icon-${p}.svg`)}" alt="">${p==='slow'&&model.effects.ice>0?'SLOW · QUEUED':p.toUpperCase()}<b>${model.effects[p].toFixed(1)}s</b></span>`).join(''));
 const power=model.buffer.toLowerCase();setText('typing-label',POWERS.includes(power)&&!model.words.some(w=>w.text===model.buffer)?`CAST ${power.toUpperCase()}`:'');$('typing-label').hidden=!$('typing-label').textContent;
 if(lastPressureKey!==pressure.key){lastPressureKey=pressure.key;announce(`Typekeeper ${pressure.label.toLowerCase()}. Paper pile ${meter} percent.`);}
}
function processEvents(){
 const events=model.drainEvents();renderer.handle(events);
 for(const e of events){
  audio.setPressure(model.danger);audio.play(e);
  if(e.type==='correct'){
   if(settings.motion){scoreEmphasis?.cancel();scoreEmphasis=$('score-value').animate([{transform:'scale(1)'},{transform:'scale(1.045)',offset:.3},{transform:'scale(1)'}],{duration:190,easing:'ease-out'});}
   pulse('success');$('onboarding-hint').hidden=true;if(e.collected&&settings.hints&&!learnedSpells.has(e.word.kind)){learnedSpells.add(e.word.kind);toast(`${POWER_META[e.word.kind].name} collected · shortcut ${POWER_META[e.word.kind].key}`,false,2000);}}
  if(e.type==='late'){toast(e.reason==='fire'?'Already cleared.':'Just missed.',false,1200);}
  if(e.type==='wrong'){pulse('invalid');toast(`No match · +2%`,true,1800);}
  if(e.type==='unavailable'){
   const msg=e.reason==='active'?`${POWER_META[e.power].name} is active.`:e.reason==='empty-field'?'Nothing to clear.':e.reason==='empty-pile'?'The pile is empty.':e.reason==='cooldown'?'One cast at a time.':`No ${POWER_META[e.power].name} spells.`;
   toast(msg,false,2000);
  }
  if(e.type==='power'){const slot=$(`spell-${e.power}`);slot.classList.remove('casting');void slot.offsetWidth;slot.classList.add('casting');setTimeout(()=>slot.classList.remove('casting'),480);}
  if(e.type==='level-clear'){
   if(model.mode==='campaign'){store.completeStage(model.pace,e);if(model.level<48)store.setCheckpoint(model.checkpoint());else if(model.level===48){store.clearCheckpoint(model.pace);if(!runRecorded){store.add(model.finishCampaign());runRecorded=true;}}}
   if(model.mode==='practice'){store.completeStage(model.pace,e,false);if(!runRecorded){const result=model.result({victory:false});store.add(result);model.lastResult=result;runRecorded=true;}}
   showClear(e);
  }
  if(e.type==='game-over'){if(model.mode==='campaign')store.markFailure(model.pace,model.seed,model.level);if(!runRecorded){store.add(e.result);runRecorded=true;}showOver(e.result);}
 }
}
function animate(now){const alpha=clock.advance(now,dt=>{if(!freezeSimulation)model.step(dt);},model.phase==='playing');processEvents();renderer.frame(now,alpha);updateScoreTally(now);if(now-lastHud>80){renderHud();lastHud=now;}requestAnimationFrame(animate);}
async function init(){
 buildInventory();applySettings();fit();
 try{await Promise.all([renderer.load(),$('library-background').decode()]);loaded=true;$('loading').hidden=true;showMenu();requestAnimationFrame(animate);installDiagnostics();if(!store.available)toast('Progress cannot be saved in this browser. Use Records → Export save.',true,5000);}
 catch(error){console.error(error);$('loading').innerHTML=`<div class="load-error"><h2>The library could not open.</h2><p>${esc(error.message||'An asset could not be loaded.')}</p><p>Open PLAY.html, or use the included START_MAC.command / START_WINDOWS.bat launcher.</p><button class="game-button" id="retry-load">Try again</button></div>`;$('retry-load')?.addEventListener('click',()=>location.reload());}
}
function installDiagnostics(){
 // Diagnostic seam is restricted to explicit local test URLs. Never enabled in PLAY.html by default.
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname)||new URLSearchParams(location.search).get('test')!=='1')return;
 window.__TM_TEST__={model,renderer,store,clock,snapshot:()=>model.snapshot(),start:(seed=123,level=1,mode='campaign')=>start(seed,level,mode),freeze:(v=true)=>{freezeSimulation=v;},flush:()=>{processEvents();renderHud();},setSettings:s=>{settings={...settings,...s};applySettings();},cast:quickCast,
 word:(text,kind='normal',x=580,y=320)=>{const w={id:model.nextId++,text:normalizeInput(text),kind,x,y,previousY:y,speed:model.config.speed,width:wordCardWidth(text,kind),phase:1};model.words.push(w);return w.id;},
 advance:seconds=>{for(let i=0;i<Math.round(seconds/RULES.step);i++)model.step(RULES.step);processEvents();renderHud();},show:perform,
 performance:()=>({...renderer.stats,particles:renderer.particles.length,textureCache:renderer.textures.size,textureBytes:renderer.textureBytes,expression:renderer.expressionKey}),audioState:()=>audio.snapshot(),audio,scoreRollup,settings:()=>({...settings}),info:{ruleset:RULESET_VERSION,dictionaryWords:WORD_COUNT,stages:48,renderer:'Canvas2D',offlineAssets:true}};
}
init();
