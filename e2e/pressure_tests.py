#!/usr/bin/env python3
"""v3.2 pressure/audio/feedback integration audit. Executes shipping PLAY.html in
Chromium memory, with only the existing diagnostic access guard enabled. State
fixtures are controlled, actual DOM, input, audio, model and renderer run unchanged.
This is not human listening, native-device, or HTTP ES-module certification.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
import argparse,hashlib,json,time
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/qa';SHOTS=ROOT/'docs/screenshots'

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--executable');args=ap.parse_args()
 OUT.mkdir(parents=True,exist_ok=True);SHOTS.mkdir(parents=True,exist_ok=True)
 rows=[];errors=[];evidence={};sha=hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest()
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
  if args.executable:opts['executable_path']=args.executable
  browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1440,'height':1040},device_scale_factor=1)
  page=ctx.new_page();page.set_default_timeout(7000);page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__')
  def api(js):return page.evaluate('(()=>{const t=__TM_TEST__;'+js+'})()')
  def state():return api('return t.snapshot();')
  def audio():return api('return t.audioState();')
  def cues():return [x['name'] for x in audio()['cues']]
  def btn(a):return page.locator(f'#screen-layer [data-action="{a}"]').first
  def run(level=1,mode='practice'):
   api(f"t.setSettings({{pace:'classic',motion:true,typingShimmer:true,adaptiveMusic:true,resumeCountdown:false,hints:false,muted:false,music:true,sfx:true,volume:.7,musicVolume:.52,sfxVolume:.65}});t.audio.setBackground(false);t.start(712,{level},{json.dumps(mode)});t.freeze(true);t.model.words=[];t.model.spawnClock=100;t.flush();t.audio.cueLog=[];")
  def word(text='LIBRARY',kind='normal',x=560,y=350):return api(f'return t.word({json.dumps(text)},{json.dumps(kind)},{x},{y});')
  def typeword(text):page.locator('#typing-input').fill(text);page.locator('#typing-input').press('Enter')
  def pressure(v):api(f't.model.danger={v};t.flush();')
  def clear(mode='campaign'):
   run(6,mode);api("t.model.stageTime=24;t.model.time=24;t.model.score=3200;t.model.progress=t.model.config.quota-1;t.model.stageCorrect=t.model.config.quota-1;t.word('BOOK');t.flush();");typeword('BOOK')
  def check(name,fn):
   at=time.time()
   try:fn();r={'name':name,'status':'PASS','seconds':round(time.time()-at,3)}
   except Exception as e:
    r={'name':name,'status':'FAIL','error':repr(e),'seconds':round(time.time()-at,3)}
    try:page.screenshot(path=str(OUT/f'pressure-failure-{len(rows)+1}.png'),timeout=5000)
    except Exception:pass
   rows.append(r);print(r['status'],name,r.get('error',''),flush=True)
  def unlock():
   assert audio()['state']=='uninitialized';btn('settings').click()
   page.wait_for_function("__TM_TEST__.audioState().musicStatus==='ready'",timeout=20000)
   a=audio();assert a['sources']==4 and a['state']=='running'
   evidence['decodedAudio']=a
   api('window.__v32Sources=t.audio.sources.slice();window.__v32MusicStart=t.audio.startedAt;')
  check('User gesture unlocks four local music layers with no autoplay override',unlock)
  def phase():
   run();v=api('return t.audio.sources.map(s=>({end:s.loopEnd,start:s.loopStart,rate:s.playbackRate.value,loop:s.loop}));')
   assert len(v)==4 and all(abs(s['end']-106.6666667)<.002 and s['loop'] and s['rate']==1 for s in v)
   assert api('return t.audio.buffers.map(b=>b.numberOfChannels);')==[2,2,1,1]
   assert audio()['decodedBytes']<140*1024*1024
  check('New layers share the original 90-BPM cycle without pitch or phase resets',phase)
  def curve():
   run();values=[]
   for d in [0,20,40,65,85,98]:pressure(d);values.append(audio())
   evidence['pressureTargets']=[{k:v[k] for k in ['pressure','tension','urgency','targets']} for v in values]
   assert values[0]['targets'][2:]==[0,0] and values[1]['targets'][2:]==[0,0]
   assert values[2]['targets'][2]>0 and values[2]['targets'][3]==0
   assert values[-1]['targets'][2]>.8 and values[-1]['targets'][3]>.7
   assert all(b['targets'][2]>=a['targets'][2] and b['targets'][3]>=a['targets'][3] for a,b in zip(values,values[1:]))
   page.wait_for_timeout(1900);assert audio()['stemGains'][2]>.70 and audio()['stemGains'][3]>.62
   assert api('return t.audio.sources.every((s,i)=>s===window.__v32Sources[i])&&t.audio.startedAt===window.__v32MusicStart;')
  check('Pile percentage drives continuous audible pressure/urgency gains on the same sources',curve)
  def actualmiss():
   run();pressure(52);word('BOOK',y=647.99);api('t.advance(.05);')
   a=audio();assert state()['missed']==1 and a['pressure']==state()['danger'] and a['pressure']>60
   assert 'paper-impact' in cues() and a['tension']>.5
  check('A real falling-card impact, not just a fixture setter, increases the music pressure',actualmiss)
  def wind():
   run();word();pressure(97);api('t.model.inventory.wind=1;t.flush();');page.wait_for_timeout(1700)
   before=audio()['stemGains'][3];page.locator('#typing-input').fill('LIB');page.keyboard.press('4');page.wait_for_timeout(900)
   a=audio();assert state()['danger']==0 and state()['buffer']=='LIB'
   assert a['targets'][2:]==[0,0] and a['stemGains'][3]<before*.08
   assert 'spell-wind' in cues() and api('return t.audio.sources.every((s,i)=>s===window.__v32Sources[i]);')
  check('WIND clears danger, preserves current typing, and releases tension without restarting music',wind)
  def constant_speed():
   run(12);word();s=state()['words'][0]['speed'];pressure(96);assert state()['words'][0]['speed']==s
   api('t.setSettings({adaptiveMusic:false});');assert audio()['targets'][2:]==[0,0] and state()['words'][0]['speed']==s
   page.keyboard.press('Escape');btn('settings').click();assert page.locator('[data-toggle="adaptiveMusic"]').get_attribute('aria-checked')=='false'
   page.locator('[data-toggle="adaptiveMusic"]').click();assert api('return t.settings().adaptiveMusic;') is True
  check('Adaptive music switch works without altering difficulty, stock, or active card speeds',constant_speed)
  def pauses():
   run(6);pressure(98);page.keyboard.press('Escape');a=audio();assert a['scene']=='pause' and a['targets'][2:]==[0,0]
   before=state();page.wait_for_timeout(650);assert state()==before;btn('resume').click();assert audio()['scene']=='trial' and audio()['targets'][3]>.7
   api('t.model.clearLevel();t.flush();');assert audio()['scene']=='clear' and audio()['targets'][2:]==[0,0]
  check('Pause and chapter results remove tension; resume restores the actual current pressure',pauses)
  def inputprefix():
   run();w=word();page.keyboard.type('LIB',delay=65);api('t.flush();')
   assert state()['buffer']=='LIB' and state()['correct']==0
   assert api(f'return t.renderer.keyGlints.has({w});') and 'matched-key' in cues()
  check('Matching letters create local ink glints and delicate matched-key cues',inputprefix)
  def wordready():
   run();word();page.keyboard.type('LIBRARY',delay=45);api('t.flush();')
   assert state()['correct']==0 and len(state()['words'])==1 and state()['score']==0
   assert 'word-ready' in cues();page.keyboard.press('Enter');assert state()['correct']==1 and not state()['words']
   assert 'word-saved' in cues() and api('return t.renderer.gleams.length;')>0
  check('Fully typed word glows but still requires Enter; saving emits one scored resolution',wordready)
  def nomatch():
   run();word();page.keyboard.type('Z');api('t.flush();')
   assert api('return t.renderer.keyGlints.size;')==0 and state()['wrong']==0
   assert 'matched-key' not in cues();page.keyboard.press('Enter');assert state()['wrong']==1 and 'wrong' in cues()
  check('Wrong intermediate letters stay unpenalized, without a false success shine',nomatch)
  def edits():
   run();word();page.keyboard.type('LIB');api('t.flush();t.audio.cueLog=[];');page.keyboard.press('Backspace');api('t.flush();')
   assert not any(c in cues() for c in ['key','matched-key','word-ready'])
   page.locator('#typing-input').fill('LZR');api('t.flush();t.audio.cueLog=[];t.audio.lastKey=-Infinity;');page.locator('#typing-input').fill('LIB');api('t.flush();')
   assert 'matched-key' in cues()
  check('Backspace is quiet; replacement text gets fresh, accurate matching feedback',edits)
  def shinyoff():
   run();api('t.setSettings({typingShimmer:false});');word();page.keyboard.type('LIBRARY',delay=35);page.keyboard.press('Enter');api('t.flush();')
   assert state()['correct']==1 and api('return t.renderer.gleams.length+t.renderer.keyGlints.size;')==0
   assert 'word-saved' in cues()
  check('Typing shimmer can be disabled independently of normal sound and scoring',shinyoff)
  def motionoff():
   run();api('t.setSettings({motion:false});');word('BOOK','wind');typeword('BOOK');pressure(78);page.keyboard.press('4');api('t.flush();')
   assert api('return t.renderer.gleams.length+t.renderer.keyGlints.size+t.renderer.particles.length+t.renderer.flights.length;')==0
   assert state()['danger']==0 and 'spell-wind' in cues()
  check('Reduced motion suppresses sparks, book flights and WIND paper animation, not rescue',motionoff)
  def rewardcues():
   run();word('BOOK','ice');typeword('BOOK');assert 'book-collected' in cues() and state()['inventory']['ice']==2
   api('t.model.streak=7;');word('CRYSTAL','bonus');typeword('CRYSTAL')
   assert 'bonus-word' in cues() and 'streak' in cues() and state()['streak']==8
  check('Spell acquisition, dark bonus cards and eight-word streaks have distinct reward cues',rewardcues)
  def eachspell():
   for power,key in [('fire','1'),('ice','2'),('slow','3'),('wind','4')]:
    run();word();pressure(40);page.keyboard.press(key)
    assert 'spell-'+power in cues(),(power,cues())
  check('All four real quick-casts trigger their distinct original spell sound palettes',eachspell)
  def endcues():
   run();api('t.model.effects.ice=.05;t.model.effects.slow=.12;t.advance(.07);');assert cues().count('end-ice')==1 and 'end-slow' not in cues()
   api('t.advance(.3);t.advance(.3);');assert cues().count('end-ice')==1 and cues().count('end-slow')==1
  check('Natural ICE then queued SLOW expiry creates one subtle return cue each',endcues)
  def pressurewarn():
   run();pressure(74);word('BOOK',y=647.99);api('t.advance(.05);');assert cues().count('pressure-warning')==1
   api('t.advance(.2);t.advance(.2);');assert cues().count('pressure-warning')==1
  check('Danger warning cues occur on band entry, not every frame or repeated percentage',pressurewarn)
  def countup():
   clear();total=state()['score'];opening=int(page.locator('#result-score-value').inner_text().replace(',',''));assert opening<total
   values=[opening]
   for _ in range(5):page.wait_for_timeout(240);values.append(int(page.locator('#result-score-value').inner_text().replace(',','')))
   assert values==sorted(values) and values[-1]==total and state()['score']==total
   assert 2<=cues().count('score-tick')<=19 and cues().count('score-finish')==1
   assert 'score-awarded' in page.locator('.medal-stars').get_attribute('class')
   assert page.locator('.result-score').get_attribute('aria-label')==f'{total:,} points'
   evidence['scoreTally']={'values':values,'committedScore':total,'ticks':cues().count('score-tick'),'finishes':cues().count('score-finish')}
  check('Result score counts upward with bounded ticks; saved score is authoritative from the start',countup)
  def skipcount():
   clear();page.locator('#result-score-value').click();total=state()['score'];assert int(page.locator('#result-score-value').inner_text().replace(',',''))==total
   page.locator('#result-score-value').click();page.wait_for_timeout(1200);assert cues().count('score-finish')==1
  check('Clicking the tally skips its animation without duplicate sound, score, or medals',skipcount)
  def nextfast():
   clear();assert api('return t.scoreRollup.active;');btn('next').click();assert state()['phase']=='playing' and state()['level']==7
   page.wait_for_timeout(180);assert not api('return t.scoreRollup.active;')
   assert api('return [...t.audio.handles].filter(h=>h.group==="score").length;')==0
   before=cues().count('score-finish');page.wait_for_timeout(1100);assert cues().count('score-finish')==before
  check('Next chapter is immediately usable and cancels all old score-tally voices',nextfast)
  def returncount():
   clear();api('t.show("settings");');btn('back').click();assert state()['phase']=='level-clear'
   assert not api('return t.scoreRollup.active;') and int(page.locator('#result-score-value').inner_text().replace(',',''))==state()['score']
  check('Returning to a finished results screen does not replay the score ceremony',returncount)
  def reducedcount():
   run(6,'campaign');api("t.setSettings({motion:false});t.model.score=1000;t.model.progress=t.model.config.quota-1;t.word('BOOK');t.flush();");typeword('BOOK')
   assert not api('return t.scoreRollup.active;') and int(page.locator('#result-score-value').inner_text().replace(',',''))==state()['score']
   assert 'score-tick' not in cues()
  check('Reduced-motion results expose the exact final score without counting animation',reducedcount)
  def mutedcount():
   run();api("t.setSettings({muted:true});t.model.progress=t.model.config.quota-1;t.word('BOOK');t.flush();");typeword('BOOK');page.wait_for_timeout(1200)
   assert 'score-tick' not in cues() and 'score-finish' not in cues() and audio()['output']<.0001
  check('Global mute also silences the new tally clicks and medal seal',mutedcount)
  def resourcebounds():
   run();api("for(let i=0;i<200;i++){t.audio.play({type:'correct',word:{kind:'bonus',x:500},streak:8});t.audio.noise(.02+i%5*.01,.05);}window.__peak32=t.audioState();")
   peak=api('return window.__peak32;');assert peak['voices']<=32 and peak['noiseVoices']<=12 and peak['noiseCache']<=24
   page.wait_for_timeout(1100);assert audio()['voices']==0 and audio()['noiseVoices']==0 and api('return t.audio.handles.size;')==0
   evidence['fxResourcePeak']={k:peak[k] for k in ['voices','noiseVoices','noiseCache']}
  check('Dense reward bursts stay within 32 tones/12 noise voices and fully disconnect',resourcebounds)
  def particlebounds():
   run();api("for(let i=0;i<60;i++){t.renderer.handle([{type:'correct',word:{id:i,text:'WORD',kind:'normal',x:550,y:300,width:140},streak:1,points:40},{type:'power',power:'wind'}]);}")
   assert api('return t.renderer.gleams.length;')<=24 and api('return t.renderer.particles.length;')<=180
  check('Repeated completions and rescues keep the shimmer and particle pools bounded',particlebounds)
  def banner():
   run();word('WHISPER','normal',600,199)
   labels=api("const c=t.renderer.ctx,old=c.fillText,seen=[];c.fillText=function(text,...args){if(/WORD STREAK/.test(text))seen.push(text);return old.call(this,text,...args)};t.renderer.floaters.push({x:600,y:220,text:'8 WORD STREAK',color:'#fff',large:true,t:0,life:1.4});t.renderer.frame(performance.now()+10,1);c.fillText=old;return seen;")
   assert not labels
  check('A large streak celebration never covers an active word underneath it',banner)
  def ramp():
   speeds=[]
   for level in [1,3,6,12]:run(level);speeds.append(api('return t.model.config.speed;'))
   assert speeds==[36,45,58,76];evidence['openingSpeeds']=speeds
  check('Actual shipping model uses the earlier chapter 1/3/6/12 difficulty ramp',ramp)
  def degraded():
   other=ctx.new_page();other.on('pageerror',lambda e:errors.append(str(e)));other.set_content(inline_fixture(ROOT));other.wait_for_function('!!window.__TM_TEST__')
   other.evaluate("()=>{const a=__TM_TEST__.audio,read=a.readAsset.bind(a);a.readAsset=p=>/pressure|urgency/.test(p)?Promise.reject(new Error('QA optional layer missing')):read(p);}")
   other.locator('[data-action="start"]').click();other.wait_for_function("__TM_TEST__.audioState().musicStatus==='degraded'",timeout=20000)
   assert other.evaluate('__TM_TEST__.audioState().sources')==2 and other.evaluate('__TM_TEST__.snapshot().phase')=='playing'
   other.evaluate("__TM_TEST__.freeze(true);__TM_TEST__.word('INK');");other.locator('#typing-input').fill('INK');other.keyboard.press('Enter');assert other.evaluate('__TM_TEST__.snapshot().correct')==1
   other.keyboard.press('Escape');other.locator('[data-action="settings"]').click();assert 'main theme still plays' in other.locator('#audio-status').inner_text()
   other.close();page.bring_to_front();api('t.audio.setBackground(false);')
  check('Missing optional tension stems degrade gracefully to the original playable score',degraded)
  def pausesound():
   run();pressure(90);page.evaluate("window.dispatchEvent(new Event('blur'))");page.wait_for_timeout(350)
   assert audio()['state']=='suspended' and audio()['background'] and state()['phase']=='paused'
   page.evaluate("window.dispatchEvent(new Event('focus'))");page.wait_for_timeout(100);assert state()['phase']=='paused' and not audio()['background']
  check('Tab loss suspends the expanded audio graph and never resumes falling words automatically',pausesound)
  def cleanprod():
   other=ctx.new_page();other.set_content(inline_fixture(ROOT,diagnostics=False));other.wait_for_selector('.title-lockup')
   assert not other.evaluate('!!window.__TM_TEST__');other.close();page.bring_to_front();api('t.audio.setBackground(false);')
  check('Production HTML still hides every audit/control hook',cleanprod)
  def stablehud():
   run();word();api('window.__limitSmall=document.querySelector("#limit-value small");window.__accuracySmall=document.querySelector("#accuracy-value small");for(let i=0;i<20;i++)t.flush();')
   assert api('return window.__limitSmall===document.querySelector("#limit-value small")&&window.__accuracySmall===document.querySelector("#accuracy-value small");')
  check('Unchanged live HUD nodes survive repeated frames and keys without markup replacement',stablehud)
  def screenshots():
   run(12);page.wait_for_timeout(5300)
   api("t.model.score=24680;t.model.progress=13;t.model.streak=15;t.model.danger=83;t.model.inventory={fire:2,ice:2,slow:1,wind:1};t.model.pile=[{x:340,angle:.04},{x:510,angle:-.06},{x:720,angle:.05},{x:840,angle:-.04}];[['WONDER','normal',355,245],['STORIES','ice',765,315],['LIBRARY','normal',545,430],['CRYSTAL','bonus',819,525]].forEach(w=>t.word(...w));t.flush();")
   page.locator('#typing-input').fill('LIBRA');api('t.flush();');page.locator('#stage').screenshot(path=str(SHOTS/'20-v32-pressure-gameplay.png'))
   page.keyboard.press('4');page.wait_for_timeout(450);page.locator('#stage').screenshot(path=str(SHOTS/'21-v32-wind-relief.png'))
   clear();page.wait_for_timeout(600);page.locator('#stage').screenshot(path=str(SHOTS/'22-v32-score-ceremony.png'))
   api('t.show("settings");');page.wait_for_timeout(450);page.locator('#stage').screenshot(path=str(SHOTS/'23-v32-adaptive-audio.png'))
  check('Live pressure, WIND relief, score tally and audio controls render as captured screens',screenshots)
  check('No unhandled application JavaScript errors in the new integration audit',lambda: (_ for _ in ()).throw(AssertionError(errors)) if errors else None)
  report={'version':'3.2.0','shippingSHA256':sha,'scope':__doc__,'browser':browser.version,'viewport':{'width':1440,'height':1040},'passed':sum(r['status']=='PASS' for r in rows),'failed':sum(r['status']=='FAIL' for r in rows),'tests':rows,'evidence':evidence,'unhandledErrors':errors}
  (OUT/'pressure-browser-results.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k] for k in ['browser','passed','failed']},indent=2),flush=True);browser.close()
  if report['failed']:raise SystemExit(1)
if __name__=='__main__':main()
