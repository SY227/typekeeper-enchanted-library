#!/usr/bin/env python3
"""Score Chase: shipping DOM, input handlers, audio and model. Controlled fixtures
exercise record provenance and extreme HUD states; not human enjoyment research.
Transport adapts only assets/module URLs and the existing explicit debug guard.
"""
from pathlib import Path
import sys,json,argparse,time,traceback,hashlib
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
from module_fixture import module_fixture
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--mode',choices=['standalone','modules'],default='standalone');args=ap.parse_args()
OUT=ROOT/'qa362';OUT.mkdir(exist_ok=True);SHOTS=OUT/'score-chase-screenshots';SHOTS.mkdir(exist_ok=True)
rows=[];errors=[];evidence={'geometry':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
 page=browser.new_page(viewport={'width':1366,'height':768});page.set_default_timeout(9000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT));page.wait_for_function('!!window.__TM_TEST__')
 def api(code):return page.evaluate('(()=>{const t=__TM_TEST__,m=t.model;'+code+'})()')
 def check(name,fn):
  t=time.monotonic()
  try:fn();assert not errors,errors;row={'name':name,'status':'PASS','seconds':round(time.monotonic()-t,3)}
  except Exception as e:
   row={'name':name,'status':'FAIL','seconds':round(time.monotonic()-t,3),'error':str(e),'trace':traceback.format_exc()}
   try:page.screenshot(path=str(SHOTS/f'failure-{len(rows)+1}-{args.mode}.png'))
   except:pass
  rows.append(row);print(json.dumps(row),flush=True)
 def setup(best=None,mode='campaign',level=1,pace='classic',motion=False,audible=False):
  page.mouse.move(2,2)
  page.evaluate('''o=>{const t=__TM_TEST__;t.show('menu');t.store.data.records=[];t.store.data.chapterBests={};t.store.data.scoreChaseBests={};t.store.data.checkpoints={};t.audio.cueLog=[];t.setSettings({pace:o.pace,motion:o.motion,hints:false,music:false,sfx:o.audible,muted:!o.audible,contrast:false,detailedHUD:false,resumeCountdown:false});if(o.best!==null)t.store.recordScoreChase({ruleset:t.info.ruleset,pace:o.pace,mode:o.mode,level:o.level,startLevel:o.level,score:o.best});t.start(73853,o.level,o.mode);t.freeze(true);t.model.words=[];t.flush();}''',dict(best=best,mode=mode,level=level,pace=pace,motion=motion,audible=audible))
 def type_word(word='BOOK'):
  api('m.words=[];t.word('+json.dumps(word)+',"normal",600,300);t.flush();')
  page.locator('#typing-input').fill(word);page.keyboard.press('Enter')
 def state():return api('return t.scoreChase.snapshot();')
 def assert_eq(a,b):assert a==b,(a,b)
 def screenshot(name):page.screenshot(path=str(SHOTS/f'{name}-{args.mode}.png'))
 def set_score(n):api(f'm.score={n};t.flush();')
 def identity():
  assert 'v3.6.2' in page.title();assert_eq(api('return t.info.version;'),'3.6.2');setup();assert_eq(page.locator('#score-panel').count(),1);assert page.locator('#score-chase-line').is_visible();assert_eq(page.locator('#score-value').inner_text(),'0')
 check('Current runtime: one integrated score panel, visible even in focused HUD',identity)
 def first():
  setup();type_word();assert_eq(state()['state'],'first');assert_eq(page.locator('#best-label').inner_text(),'FIRST RUN');assert page.locator('#best-value').is_hidden();assert not api('return document.querySelector("#score-panel").classList.contains("record-pulse");');assert_eq(api('return Object.keys(t.store.data.scoreChaseBests).length;'),0)
 check('First run remains FIRST RUN after scoring; no fake zero target or premature save',first)
 def baseline():
  setup(1580);set_score(1240);assert_eq(page.locator('#score-value').inner_text(),'1,240');assert_eq(page.locator('#best-value').inner_text(),'1,580');api('t.store.recordScoreChase({pace:m.pace,mode:m.mode,level:m.level,startLevel:m.startLevel,score:9000});t.flush();');assert_eq(state()['best'],1580);assert_eq(page.locator('#best-value').inner_text(),'1,580')
 check('Running total and frozen baseline remain exact when stored best changes mid-attempt',baseline)
 def near_tie():
  setup(40);set_score(35);assert_eq(state()['state'],'tracking');set_score(36);assert_eq(state()['state'],'near');set_score(0);type_word();assert_eq(state()['value'],40);assert_eq(state()['state'],'near');assert_eq(page.locator('#best-label').inner_text(),'BEST')
 check('90 percent is a soft state; equal score is not a record',near_tie)
 def breakthrough():
  setup(1580,motion=True,audible=True);page.evaluate('async()=>{await __TM_TEST__.audio.unlock();}');set_score(1570);type_word();assert_eq(state()['value'],1610);assert_eq(state()['best'],1580);assert_eq(page.locator('#best-label').inner_text(),'NEW BEST');assert_eq(page.locator('#best-value').inner_text(),'+30');assert_eq(page.locator('#typing-input').input_value(),'');assert page.locator('#typing-input').evaluate('(e)=>e===document.activeElement');assert api('return document.querySelector("#score-panel").classList.contains("record-pulse");');assert_eq(api('return t.audio.snapshot().cues.filter(c=>c.name==="personal-best").length;'),1)
  type_word('TALE');assert_eq(state()['best'],1580);assert_eq(api('return t.audio.snapshot().cues.filter(c=>c.name==="personal-best").length;'),1);page.wait_for_timeout(760);assert not api('return document.querySelector("#score-panel").classList.contains("record-pulse");');screenshot('new-best')
 check('Real Enter crossing: +30, one restrained pulse/sound, frozen target and uninterrupted typing',breakthrough)
 def zero():
  setup(0);assert_eq(page.locator('#best-value').inner_text(),'0');type_word();assert_eq(page.locator('#best-label').inner_text(),'NEW BEST')
 check('A genuine recorded zero is distinguishable from no record',zero)
 def reduced():
  setup(30,motion=False);type_word();assert_eq(page.locator('#best-label').inner_text(),'NEW BEST');assert not api('return document.querySelector("#score-panel").classList.contains("record-pulse");');assert_eq(page.locator('#score-value').evaluate('(e)=>e.getAnimations().length'),0);api('t.setSettings({contrast:true});');assert_eq(page.locator('#best-label').inner_text(),'NEW BEST');screenshot('reduced-high-contrast')
 check('Reduced motion removes movement; high contrast keeps explicit NEW BEST text',reduced)
 def cancel_motion():
  setup(30,motion=True);type_word();api('t.setSettings({motion:false});');assert_eq(page.locator('#score-value').evaluate('(e)=>e.getAnimations().length'),0);assert not api('return document.querySelector("#score-panel").classList.contains("record-pulse");')
 check('Changing reduced motion during a live celebration cancels score motion immediately',cancel_motion)
 def pause_resume():
  setup(30,motion=True,audible=True);page.evaluate('async()=>await __TM_TEST__.audio.unlock()');type_word();before=state();page.keyboard.press('Escape');page.wait_for_timeout(300);page.locator('[data-action=resume]').click();assert_eq(state(),before);assert_eq(api('return t.audio.snapshot().cues.filter(c=>c.name==="personal-best").length;'),1);assert not api('return document.querySelector("#score-panel").classList.contains("record-pulse");')
 check('Pause/resume preserves frozen target and does not replay its celebration',pause_resume)
 def settings():
  setup(2000);set_score(1500);page.keyboard.press('Escape');api('t.show("settings");t.setSettings({pace:"maniac",detailedHUD:true});t.flush();');assert_eq(state()['scope']['pace'],'classic');assert_eq(state()['best'],2000);api('t.show("back");');page.wait_for_timeout(300);api('t.show("resume");');assert_eq(state()['best'],2000);assert page.locator('#score-chase-line').is_visible()
 check('Next-run difficulty settings and detailed HUD do not retarget an active Classic run',settings)
 def mute():
  setup(30,motion=True,audible=True);page.evaluate('async()=>await __TM_TEST__.audio.unlock()');type_word();api('t.setSettings({muted:true});');page.wait_for_timeout(80);assert_eq(api('return [...t.audio.handles].filter(h=>h.group==="score").length;'),0);api('t.setSettings({muted:false});');type_word();assert_eq(api('return t.audio.snapshot().cues.filter(c=>c.name==="personal-best").length;'),1)
 check('Mute cancels pending record sound; unmute never replays or duplicates it',mute)
 def chapter_total():
  setup(12500,level=12);api('m.stageStartScore=10000;m.score=12400;t.flush();');assert_eq(page.locator('#score-value').inner_text(),'12,400');assert_eq(page.locator('#best-value').inner_text(),'12,500');assert 'Campaign running total at Chapter 12' in page.locator('#score-scope').inner_text()
 check('A nonzero chapter opening does not turn running SCORE into the chapter subtotal',chapter_total)
 def bonus():
  setup(200,motion=False);api('m.progress=m.config.quota-1;m.stageCorrect=m.progress;m.stageMissed=3;m.score=150;t.flush();');type_word();assert_eq(api('return m.phase;'),'level-clear');assert state()['value']>200;assert_eq(state()['state'],'beaten');assert_eq(state()['best'],200);assert_eq(api('return t.store.scoreChaseBest(t.scoreChase.scope).score;'),state()['value']);assert_eq(page.locator('#missed-count').inner_text(),'3');screenshot('bonus-clear')
 check('Real final-word + chapter bonus is reflected and saved; original star explanation stays intact',bonus)
 def first_clear():
  setup(None,mode='practice',level=4);api('m.progress=m.config.quota-1;m.stageCorrect=m.progress;t.flush();');type_word();assert_eq(state()['state'],'first');score=state()['value'];assert_eq(api('return t.store.scoreChaseBest(t.scoreChase.scope).score;'),score);api('t.show("restart");t.freeze(true);t.flush();');assert_eq(state()['best'],score);assert_eq(state()['value'],0);assert_eq(state()['state'],'tracking')
 check('First clear records the score without moving its target; practice Retry picks up the saved best',first_clear)
 def next_chapter():
  setup(1000);api('t.store.recordScoreChase({pace:m.pace,mode:m.mode,startLevel:1,level:2,score:3000});m.progress=m.config.quota-1;m.stageCorrect=m.progress;t.flush();');type_word();total=state()['value'];api('t.show("next");t.freeze(true);t.flush();');assert_eq(state()['scope']['chapter'],2);assert_eq(state()['best'],3000);assert_eq(state()['value'],total);assert_eq(api('return m.stageStartScore;'),total)
 check('Campaign Next keeps accumulated score and captures the next chapter’s own frozen total target',next_chapter)
 def retry_loss():
  setup(30);type_word();before=state()['value'];api('m.danger=99;m.setBuffer("MISTAKE");m.submit();t.flush();t.skipOutcome();');assert_eq(api('return m.phase;'),'game-over');api('t.show("retry-chapter");t.freeze(true);t.flush();');assert_eq(state()['best'],before);assert_eq(state()['value'],0);assert_eq(state()['state'],'tracking')
 check('Campaign game-over commits only the ended attempt; Retry restores score and refreshes the target',retry_loss)
 def first_defeat():
  setup();type_word();api('m.danger=99;m.setBuffer("MISTAKE");m.submit();t.flush();t.skipOutcome();');assert_eq(page.locator('#screen-layer .eyebrow').inner_text(),'FIRST SCORE RECORDED');assert 'A NEW' not in page.locator('#screen-layer').inner_text()
 check('First game-over records a score instead of claiming to beat a nonexistent personal best',first_defeat)
 def scoped_defeat():
  setup(30);api('t.store.add({pace:"classic",mode:"campaign",startLevel:1,level:20,score:999999});');type_word();api('m.danger=99;m.setBuffer("MISTAKE");m.submit();t.flush();t.skipOutcome();');assert_eq(page.locator('#screen-layer .eyebrow').inner_text(),'A NEW BEST AT CHAPTER 01');assert_eq(state()['best'],30)
 check('Game-over uses the same frozen chapter scope, not an unrelated high total from another chapter',scoped_defeat)

 def endless():
  setup(12000,mode='endless',level=49);api('m.score=2000;m.clearLevel();t.flush();t.skipOutcome();t.show("next");t.freeze(true);t.flush();');assert_eq(api('return m.level;'),50);assert_eq(state()['best'],12000);assert_eq(state()['scope']['chapter'],0);assert_eq(state()['scope']['startLevel'],49);assert state()['value']>2000
 check('Endless keeps one target across wave transitions, not a moving per-wave target',endless)
 def endless_retire():
  setup(None,mode='endless',level=49);set_score(2500);api('m.time=20;t.show("menu");');best=api('return t.store.scoreChaseBest({ruleset:t.info.ruleset,pace:"classic",mode:"endless",chapter:0,startLevel:49}).score;');assert_eq(best,2500);api('t.start(763,49,"endless");t.freeze(true);t.flush();');assert_eq(state()['best'],2500)
 check('Retiring Endless saves the running target for the next run',endless_retire)
 def legacy():
  setup(1200);api('let cp=t.store.checkpoint("classic");cp.ruleset="typekeeper-3.2.0";cp.score=3200;t.store.setCheckpoint(cp);t.show("continue");t.freeze(true);t.flush();');assert_eq(page.locator('#best-label').inner_text(),'EARLIER RULES');assert page.locator('#best-value').is_hidden();assert_eq(page.locator('#score-value').inner_text(),'3,200')
 check('Continuing an earlier ruleset shows its score but never compares to current-rule PBs',legacy)
 def continued():
  setup(1000);api('m.clearLevel();t.flush();t.skipOutcome();t.show("menu");t.store.recordScoreChase({pace:"classic",mode:"campaign",startLevel:1,level:2,score:2300});t.show("continue");t.freeze(true);t.flush();');assert_eq(state()['scope']['chapter'],2);assert_eq(state()['best'],2300);assert_eq(state()['value'],api('return m.score;'))
 check('Continue captures the checkpoint chapter, pace and actual cumulative score without replay',continued)
 def import_locked():
  setup(1000);api('const d=JSON.parse(t.store.exportData());const k=Object.keys(d.scoreChaseBests)[0];d.scoreChaseBests[k].score=5000;t.store.importData(d);t.flush();');assert_eq(state()['best'],1000);api('t.show("restart");t.freeze(true);t.flush();');assert_eq(state()['best'],5000)
 check('Save import cannot retarget a live chase; the next attempt sees the imported higher best',import_locked)
 def no_clock_mutation():
  setup(1000);before=api('return JSON.stringify(m.snapshot());');page.set_viewport_size({'width':1024,'height':600});page.wait_for_timeout(90);api('t.setSettings({contrast:true,detailedHUD:true});t.flush();');assert_eq(api('return JSON.stringify(m.snapshot());'),before)
 check('Score layout, resizing and contrast changes leave the complete model snapshot untouched',no_clock_mutation)
 def no_live_spam():
  setup(2000);api('document.querySelector("#announcer").textContent="unchanged";');type_word();assert_eq(page.locator('#announcer').inner_text(),'unchanged');assert_eq(page.locator('#score-panel').get_attribute('aria-live'),None);assert page.locator('#score-panel').get_attribute('aria-describedby')=='score-scope'
 check('Score ticks do not spam the live region; static accessible scope and one record announcement',no_live_spam)
 def geometry(w,h):
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(90)
  for kind in ['first','tracking','beaten','long']:
   setup(None if kind=='first' else 999999999999 if kind=='long' else 1580)
   set_score(1000000000000 if kind=='long' else 1700 if kind=='beaten' else 1240)
   api('m.danger=95;t.flush();')
   result=page.evaluate('''()=>{const rect=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,sw:e.scrollWidth,cw:e.clientWidth,sh:e.scrollHeight,ch:e.clientHeight}};const range=s=>{const e=document.querySelector(s),r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();return {x:b.x,right:b.right,y:b.y,bottom:b.bottom};};return {panel:rect('#score-panel'),number:rect('#score-value'),line:rect('#score-chase-line'),chapter:rect('.chapter-panel'),stage:rect('#stage'),caption:rect('.meter-caption'),wind:rect('#ready-wind'),valueText:range('#score-value'),bestText:range('#score-chase-line'),font:parseFloat(getComputedStyle(document.querySelector('#score-chase-line')).fontSize)}}''')
   panel=result['panel'];scale=result['stage']['w']/1200
   assert panel['right']<=result['chapter']['x']-5*scale,(kind,result)
   assert panel['bottom']<=result['stage']['y']+142*scale,(kind,result)
   for key in ['valueText','bestText']:
    r=result[key];assert r['x']>=panel['x']-1 and r['right']<=panel['right']+1 and r['bottom']<=panel['bottom']+1,(kind,key,result)
   assert result['wind']['y']-result['caption']['bottom']>30*scale,result
   assert result['number']['sw']<=result['number']['cw']+1,(kind,result)
   assert result['line']['sw']<=result['line']['cw']+1,(kind,result)
   evidence['geometry'].append({'viewport':[w,h],'state':kind,**result})
  if (w,h) in [(1366,768),(1024,600),(800,600),(1920,1080)]:
   setup(1580);set_score(1240);api('t.word("AMBER","ice",550,380);t.word("QUILL","normal",800,235);t.flush();');screenshot(f'best-{w}x{h}')
 for w,h in [(1920,1080),(1440,900),(1366,768),(1280,720),(1024,768),(1024,600),(800,600),(960,540),(640,480),(2560,1080),(768,1024),(360,640)]:
  check(f'Viewport {w}×{h}: first/best/new-best/extreme scores fit, chapter and WIND spacing intact',lambda w=w,h=h:geometry(w,h))
 def exact_details():
  page.set_viewport_size({'width':1366,'height':768});setup(1580);set_score(1700);assert 'Previous best 1,580 points.' in page.locator('#score-scope').inner_text();assert_eq(page.locator('#best-value').inner_text(),'+120');assert_eq(page.locator('#score-value').inner_text(),'1,700');assert page.locator('#typing-input').is_enabled();screenshot('score-chase-final')
 check('Final beat state retains original target in accessible scope and does not block input',exact_details)
 report={'version':'3.6.2','mode':args.mode,'scope':__doc__,'browser':browser.version,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'passed':sum(r['status']=='PASS' for r in rows),'failed':sum(r['status']=='FAIL' for r in rows),'tests':rows,'evidence':evidence,'unhandledErrors':errors}
 (OUT/f'score-chase-{args.mode}.json').write_text(json.dumps(report,indent=2));browser.close()
 print(f"SCORE CHASE {args.mode}: {report['passed']} passed, {report['failed']} failed",flush=True)
 sys.exit(1 if report['failed'] or errors else 0)
