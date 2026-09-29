#!/usr/bin/env python3
"""Preserved Typekeeper v3 UI/audio regressions against the current shipping export.
Uses explicit in-memory diagnostics, not HTTP or file:// navigation.
Install e2e/requirements.txt and run with --executable /path/to/chromium as needed.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
import hashlib
import argparse,json,time
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/qa';SHOTS=ROOT/'docs/screenshots'

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--executable');args=ap.parse_args()
 OUT.mkdir(parents=True,exist_ok=True);SHOTS.mkdir(parents=True,exist_ok=True)
 shippingHash=hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest();rows=[];errors=[]
 with sync_playwright() as p:
  launch={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
  if args.executable:launch['executable_path']=args.executable
  browser=p.chromium.launch(**launch);context=browser.new_context(viewport={'width':1440,'height':1040},device_scale_factor=1)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(7000)
  page.set_content(inline_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__')
  def api(js):return page.evaluate('(()=>{const t=window.__TM_TEST__;'+js+'})()')
  def state():return api('return t.snapshot();')
  def audio():return api('return t.audioState();')
  def button(a):return page.locator(f'#screen-layer [data-action="{a}"]').first
  def menu():api("t.show('menu');t.audio.setBackground(false);")
  def run(level=1,freeze=True):
   api(f"t.setSettings({{pace:'classic',motion:true,resumeCountdown:true,muted:false,hints:true,music:true,sfx:true,volume:.8,musicVolume:.5,sfxVolume:.65}});t.audio.setBackground(false);t.start(404,{level},'practice');t.freeze({str(freeze).lower()});t.model.words=[];t.model.spawnClock=100;t.flush();")
  def settings(tab='audio'):
   api("t.show('settings');");page.locator(f'[data-settings-tab="{tab}"]').click()
  def value(key,v):page.locator(f'#{key}-range').evaluate('(el,v)=>{el.value=String(v);el.dispatchEvent(new Event("input",{bubbles:true}));}',v)
  def typeword(text):page.locator('#typing-input').focus();page.keyboard.type(text);page.keyboard.press('Enter')
  def check(name,fn):
   t=time.time()
   try:fn();row={'name':name,'status':'PASS','seconds':round(time.time()-t,3)}
   except Exception as e:
    row={'name':name,'status':'FAIL','error':str(e),'seconds':round(time.time()-t,3)}
    try:page.screenshot(path=str(OUT/f'polish-failure-{len(rows)+1}.png'))
    except Exception:pass
   rows.append(row);print(row['status'],name,row.get('error',''),flush=True)
  def branding():
   assert page.title()=='Typekeeper: Enchanted Library — v3.6.2'
   text=page.locator('body').inner_text().upper()
   for removed in ['FOXFORGE PLAYROOM','LOCAL-FIRST','NO ACCOUNT','STORYKEEPER EDITION','TYPE + ENTER','TYPING MANIAC']:
    assert removed not in text,removed
   assert page.locator('.title-lockup h1').inner_text()=='TYPEKEEPER';assert page.locator('body > header, body > footer').count()==0
   assert page.locator('.title-subtitle').inner_text()=='ENCHANTED LIBRARY'
  check('Branding: no prototype masthead, footers, edition labels or shortcut banner',branding)
  def gesture():
   assert audio()['state']=='uninitialized'
   button('settings').click();page.wait_for_function("window.__TM_TEST__.audioState().musicStatus==='ready'",timeout=16000)
   a=audio();assert a['state']=='running';assert a['sources']==4;assert a['music'] and a['sfx'];assert a['output']>0
   api('window.__initialSources=t.audio.sources.slice();window.__scoreStart=t.audio.startedAt;')
  check('Real first click unlocks original music without autoplay overrides',gesture)
  def decoded():
   a=audio();assert 106.6<a['loopDuration']<106.7
   assert api('return t.audio.buffers.every((b,i)=>b.numberOfChannels===(i<2?2:1));')
   assert api('return t.audio.buffers.every(b=>b.getChannelData(0).some(x=>Math.abs(x)>.01));')
   assert a['decodedBytes']<140*1024*1024
  check('Four authored stems decode, contain signal and share the authored loop duration',decoded)
  def scene():
   menu();page.wait_for_timeout(1000);m=audio()['stemGains'][1]
   run();page.wait_for_timeout(1600);g=audio()['stemGains'][1]
   run(6);page.wait_for_timeout(1600);t=audio()['stemGains'][1]
   assert m<g<t and t>.85
   assert api('return t.audio.sources.every((s,i)=>s===window.__initialSources[i])&&t.audio.startedAt===window.__scoreStart;')
  check('Menu, gameplay and trial mixes change without restarting synchronized stems',scene)
  def muting():
   page.locator('#sound-button').click();page.wait_for_timeout(600);assert audio()['muted'] and audio()['output']<.0001
   assert page.locator('#sound-button').get_attribute('aria-label')=='Unmute audio'
   page.locator('#sound-button').click();page.wait_for_timeout(400);assert not audio()['muted'] and audio()['output']>.75
  check('Single mute button silences both music and effects and restores output',muting)
  def separatelevels():
   menu();settings();value('musicVolume',27);value('sfxVolume',83);value('volume',62);api("t.audio.tone(160,4,'sine',.001);");page.wait_for_timeout(2400)
   a=audio();assert abs(a['output']-.62)<.01,a;assert abs(a['fxGain']-.83*.19)<.01,a;assert abs(a['musicGain']-.27*.75*.82)<.01,a
   assert page.locator('#musicVolume-output').inner_text()=='27%'
  check('Independent master, music and effects sliders reach separate buses with a quiet probe tone',separatelevels)
  def sfx_off():
   page.locator('[data-toggle="sfx"]').click();page.wait_for_timeout(600)
   assert not audio()['sfx'];assert audio()['fxGain']<.001,audio();assert audio()['musicGain']>.1,audio()
   page.locator('[data-toggle="sfx"]').click()
  check('Disabling typewriter effects leaves the music playing',sfx_off)
  def music_off():
   page.locator('[data-toggle="music"]').click();page.wait_for_timeout(2800)
   assert audio()['musicGain']<.001;assert audio()['fxGain']>.1
   page.locator('[data-toggle="music"]').click();page.wait_for_timeout(1600)
   assert audio()['musicGain']>.1;assert audio()['sources']==4
  check('Music toggle fades rather than resetting playback or disabling effects',music_off)
  def transitions():
   for _ in range(8):menu();settings('display');settings('gameplay');settings('audio')
   assert audio()['sources']==4;assert api('return t.audio.sources.every((s,i)=>s===window.__initialSources[i]);')
  check('Repeated modal transitions do not duplicate music sources',transitions)
  def pausemix():
   run();api("t.word('ARCHIVE');");page.keyboard.press('Escape');page.wait_for_timeout(2200)
   assert state()['phase']=='paused';assert audio()['scene']=='pause';assert audio()['stemGains'][1]<.03;assert audio()['musicGain']<.10
   assert page.locator('#play-hud').evaluate('(el)=>el.inert');assert page.locator('.utility-controls').evaluate('(el)=>el.inert')
   button('settings').click();assert audio()['scene']=='pause' and state()['phase']=='paused'
   button('back').click()
  check('Pause and nested Settings freeze play, soften music, and make obscured controls inert',pausemix)
  def countdown():
   run(freeze=False);api("t.word('LIBRARY','normal',560,230);");page.keyboard.press('Escape');y=state()['words'][0]['y']
   button('resume').click();assert page.locator('.resume-count').is_visible();assert state()['phase']=='paused'
   page.wait_for_timeout(800);assert state()['words'][0]['y']==y
   page.wait_for_function("window.__TM_TEST__.snapshot().phase==='playing'");page.wait_for_timeout(100)
   assert state()['words'][0]['y']>y;assert page.locator('#typing-input').is_enabled()
  check('Resume countdown holds the simulation still before returning control',countdown)
  def cancel():
   run();page.keyboard.press('Escape');button('resume').click();page.keyboard.press('Escape');page.wait_for_timeout(1800)
   assert state()['phase']=='paused';assert page.locator('#screen-layer').get_attribute('data-screen')=='pause'
  check('Escape cancels a pending countdown without accidental resume',cancel)
  def blur():
   run();page.keyboard.press('Escape');button('resume').click();page.evaluate("window.dispatchEvent(new Event('blur'))")
   page.wait_for_timeout(500);assert audio()['background'];assert audio()['state']=='suspended';assert state()['phase']=='paused'
   page.evaluate("window.dispatchEvent(new Event('focus'))");page.wait_for_timeout(1500);assert not audio()['background'];assert state()['phase']=='paused'
  check('Focus loss cancels countdown, suspends audio and requires deliberate gameplay resume',blur)
  def selection():
   run();page.keyboard.type('STORY');page.locator('#typing-input').evaluate('(el)=>el.setSelectionRange(1,4)')
   page.keyboard.press('Escape');button('resume').click();page.wait_for_function("window.__TM_TEST__.snapshot().phase==='playing'")
   assert page.locator('#typing-input').input_value()=='STORY';assert page.locator('#typing-input').evaluate('(el)=>[el.selectionStart,el.selectionEnd]')==[1,4]
  check('Countdown restores the exact word, cursor and selected range',selection)
  def immediate():
   run();api('t.setSettings({resumeCountdown:false});');page.keyboard.press('Escape');button('resume').click()
   assert state()['phase']=='playing';assert page.locator('.resume-count').count()==0
  check('Countdown preference provides immediate resume when disabled',immediate)
  def hints():
   run();api("t.renderer.guide.word=false;t.setSettings({hints:true});t.model.words=[];t.model.spawn();t.flush();");first=state()['words'][0]['text'];assert page.locator('#typing-input').get_attribute('placeholder')==first;typeword(first);api('t.flush();');assert page.locator('#typing-input').get_attribute('placeholder')==''
   run();api('t.setSettings({hints:false});');assert page.locator('#onboarding-hint').is_hidden()
  check('First-use typing hint retires on success and respects its preference',hints)
  def focusedhud():
   menu();settings('display');api('t.setSettings({detailedHUD:false});');page.locator('[data-toggle="detailedHUD"]').click()
   assert api('return t.settings().detailedHUD;');api('t.start(10);t.freeze(true);');assert page.locator('.side-stats .stat-block').first.is_visible()
   api('t.setSettings({detailedHUD:false});');assert page.locator('.side-stats .stat-block').first.is_hidden();assert page.locator('.streak-stat').is_hidden()
  check('Focused HUD removes secondary numbers; detailed HUD can restore them',focusedhud)
  def reduced():
   run();api('t.setSettings({motion:false,spellPulse:false});t.model.inventory.ice=1;t.flush();')
   assert page.locator('#spell-ice').evaluate('(el)=>getComputedStyle(el.querySelector(".spell-book")).animationName')=='none'
   assert page.locator('#ready-ice').inner_text()=='READY';page.keyboard.press('Escape');button('resume').click();assert state()['phase']=='playing'
  check('Reduced motion removes decorative animation without hiding ready states',reduced)
  def voices():
   run();api("for(let i=0;i<100;i++){t.audio.tone(220,.04);t.audio.noise(.02);}window.__voicePeak=[t.audio.voiceCount,t.audio.noiseCount];")
   assert api('return window.__voicePeak[0]<=32&&window.__voicePeak[1]<=12;');page.wait_for_timeout(600)
   assert api('return t.audio.voiceCount===0&&t.audio.noiseCount===0;')
  check('Burst effects respect voice limits and disconnect after playback',voices)
  def failure():
   other=context.new_page();other.on('pageerror',lambda e:errors.append(str(e)));other.set_content(inline_fixture(ROOT));other.wait_for_function('!!window.__TM_TEST__')
   other.evaluate("()=>{window.__TM_TEST__.audio.readAsset=async()=>{throw new Error('QA: music unavailable')};}")
   other.locator('[data-action="start"]').click();other.wait_for_function("window.__TM_TEST__.audioState().musicStatus==='failed'")
   assert other.evaluate("window.__TM_TEST__.snapshot().phase==='playing'")
   other.evaluate("window.__TM_TEST__.freeze(true);window.__TM_TEST__.word('INK');")
   other.locator('#typing-input').fill('INK');other.keyboard.press('Enter');assert other.evaluate('window.__TM_TEST__.snapshot().correct')==1
   other.keyboard.press('Escape');other.locator('[data-action="settings"]').click();assert 'Music unavailable' in other.locator('#audio-status').inner_text()
   other.close();page.bring_to_front();api('t.audio.setBackground(false);')
  check('Injected missing music failure reports honestly while typing remains playable',failure)
  def no_context():
   other=context.new_page();other.set_content(inline_fixture(ROOT));other.wait_for_function('!!window.__TM_TEST__');other.evaluate('window.AudioContext=undefined;window.webkitAudioContext=undefined;')
   other.locator('[data-action="start"]').click();assert other.evaluate('window.__TM_TEST__.snapshot().phase')=='playing'
   assert other.evaluate('window.__TM_TEST__.audioState().musicStatus')=='unsupported';other.close();page.bring_to_front();api('t.audio.setBackground(false);')
  check('AudioContext-unavailable environment still starts gameplay',no_context)
  def snapshotclean():
   menu();page.wait_for_timeout(6000);page.locator('#stage').screenshot(path=str(SHOTS/'10-typekeeper-title.png'))
   run(18);api("t.model.inventory={fire:2,ice:1,slow:2,wind:1};t.model.score=18420;t.model.progress=15;t.model.streak=18;t.model.danger=38;t.model.pile=[{x:340,angle:.04},{x:560,angle:-.06},{x:740,angle:.03}];[['LANTERN','normal',330,225],['WONDER','ice',625,305],['ARCHIVE','normal',475,397],['WHISPER','normal',870,236],['MELODY','normal',805,465]].forEach(w=>t.word(...w));t.flush();")
   page.wait_for_timeout(650);page.locator('#stage').screenshot(path=str(SHOTS/'11-typekeeper-gameplay.png'))
   page.keyboard.press('Escape');settings('audio');page.wait_for_timeout(500);page.locator('#stage').screenshot(path=str(SHOTS/'12-typekeeper-audio.png'))
   menu();button('map').click();page.wait_for_timeout(500);page.locator('#stage').screenshot(path=str(SHOTS/'13-typekeeper-chapters.png'))
  check('Final title, gameplay, Audio settings and chapter atlas render into captures',snapshotclean)
  def standalone():
   other=context.new_page();other.set_content(inline_fixture(ROOT,diagnostics=False));other.wait_for_selector('.title-lockup');assert not other.evaluate('!!window.__TM_TEST__');assert other.locator('[data-action="start"]').is_visible();other.close()
  check('Unmodified production PLAY.html exposes no controlled test seam',standalone)
  check('No unhandled application errors during polish audit',lambda: (_ for _ in ()).throw(AssertionError(errors)) if errors else None)
  report={'shippingSHA256':shippingHash,'scope':'Embedded shipping PLAY.html, diagnostics enabled only in memory. Fault-injection tests identified explicitly. No HTTP/file navigation or real Safari/device certification.','browser':browser.version,'passed':sum(r['status']=='PASS' for r in rows),'failed':sum(r['status']=='FAIL' for r in rows),'audioSample':audio(),'unhandledErrors':errors,'tests':rows}
  (OUT/'polish-results-chromium.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k] for k in ['passed','failed','browser']},indent=2),flush=True);browser.close()
  if report['failed']:raise SystemExit(1)
if __name__=='__main__':main()
