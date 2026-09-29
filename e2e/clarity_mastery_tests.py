#!/usr/bin/env python3
"""3.5 clarity/mastery/homecoming browser integration.
Actual shipping HTML or ES modules via in-memory transport; only the existing
localhost diagnostic guard and asset/import locations are adapted. Controlled
chapter-ending fixtures are explicitly not human campaigns. No fake game, draw,
DOM, audio or save implementations. about:blank disallows native localStorage;
persistence is covered separately by the actual LocalStore tests with adapters.
"""
from pathlib import Path
import argparse,json,hashlib,time,sys
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
from module_fixture import module_fixture
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa362';OUT.mkdir(exist_ok=True)
SHOTS=OUT/'screenshots';SHOTS.mkdir(exist_ok=True)
a=argparse.ArgumentParser();a.add_argument('--mode',choices=['standalone','modules'],default='standalone');a.add_argument('--executable',default='/usr/bin/chromium');args=a.parse_args()
rows=[];errors=[];evidence={}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=args.executable,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1366,'height':768});page.set_default_timeout(8000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__')
 def api(code):return page.evaluate('(()=>{const t=__TM_TEST__,m=t.model,r=t.renderer;'+code+'})()')
 def start(level=1,mode='campaign',motion=True):
  page.evaluate('o=>{const t=__TM_TEST__;t.setSettings({pace:"classic",motion:o.motion,hints:true,music:false,sfx:false,muted:true,resumeCountdown:false,contrast:false});t.start(4771,o.level,o.mode);t.freeze(true);t.flush();}',{'level':level,'mode':mode,'motion':motion})
 def typeword(text):page.locator('#typing-input').fill(text);page.keyboard.press('Enter')
 def finish(level=1,mode='campaign',missed=0,wrong=0,base=2400,motion=True):
  start(level,mode,motion)
  page.evaluate('o=>{const t=__TM_TEST__,m=t.model;m.words=[];m.progress=m.config.quota-1;m.stageCorrect=m.progress;m.correct=m.progress;m.stageMissed=o.missed;m.missed=o.missed;m.stageWrong=o.wrong;m.wrong=o.wrong;m.stageTime=32;m.time=32;m.stageCharacters=180;m.correctCharacters=180;m.score=o.base;m.stageStartScore=0;t.word("FINAL");t.flush();}',{'missed':missed,'wrong':wrong,'base':base})
  typeword('FINAL')
 def result():api('t.skipOutcome();');page.wait_for_function('document.querySelector("#screen-layer").dataset.screen==="level-clear"')
 def shot(name):page.screenshot(path=str(SHOTS/f'{name}-{args.mode}.png'))
 def check(name,fn):
  before=time.monotonic()
  try:fn();assert not errors,errors;row={'name':name,'status':'PASS','seconds':round(time.monotonic()-before,3)}
  except Exception as e:
   row={'name':name,'status':'FAIL','error':repr(e),'seconds':round(time.monotonic()-before,3)}
   try:shot(f'failure-clarity-{len(rows)+1}')
   except Exception:pass
  rows.append(row);print(json.dumps(row),flush=True)
 def identity():
  assert api('return t.info.version;')=='3.6.2';assert api('return t.info.ruleset;')=='typekeeper-3.2.1'
  assert api('return t.info.buildTag;')=='fresh-journey-362'
  assert page.locator('#enter-save-hint').is_hidden();assert page.locator('#first-ice-hint').is_hidden()
 check('3.5 identity and clean first-load contextual prompts',identity)
 def first_enter():
  page.locator('[data-action="start"]').click();api('t.freeze(true);t.advance(.8);')
  text=api('return m.words[0].text;');before=api('return m.correct;')
  page.locator('#typing-input').fill(text[:-1]);page.wait_for_timeout(100);assert page.locator('#enter-save-hint').is_hidden()
  page.locator('#typing-input').fill(text);page.wait_for_timeout(140);assert page.locator('#enter-save-hint').is_visible()
  assert api('return m.correct;')==before;assert 'ENTER' in page.locator('#enter-save-hint').inner_text();shot('first-enter-context')
  page.keyboard.press('Enter');assert api('return m.correct;')==before+1;assert page.locator('#enter-save-hint').is_hidden()
  start();api('t.advance(.8);');page.locator('#typing-input').fill(api('return m.words[0].text;'));page.wait_for_timeout(140);assert page.locator('#enter-save-hint').is_hidden()
 check('First exact word reveals ENTER · SAVE; no auto-submit, focus theft or repeat tutorial',first_enter)
 def first_ice():
  start();draws=[]
  page.wait_for_function('!document.querySelector("#toast").classList.contains("visible")',timeout=4500)
  for n in range(6):
   api('let i=0;while(!m.words.length&&i++<300)t.advance(1/60);')
   w=api('return m.words[0];');draws.append({'text':w['text'],'kind':w['kind']});typeword(w['text'])
  assert draws[5]['kind']=='ice';assert api('return m.inventory.ice;')==1
  page.wait_for_timeout(100);assert page.locator('#first-ice-hint').is_visible();assert page.evaluate('document.activeElement.id')=='typing-input';shot('first-earned-ice')
  page.keyboard.press('Escape');assert page.locator('#first-ice-hint').is_hidden();page.wait_for_timeout(260);page.locator('[data-action="resume"]').click();page.wait_for_timeout(100);assert page.locator('#first-ice-hint').is_visible()
  api('t.setSettings({hints:false});t.flush();');assert page.locator('#first-ice-hint').is_hidden();api('t.setSettings({hints:true});t.flush();');assert page.locator('#first-ice-hint').is_visible()
  page.keyboard.press('2');assert api('return m.effects.ice;')==6;assert page.locator('#first-ice-hint').is_hidden();evidence['firstSixCards']=draws
 check('The genuine sixth-card ICE opportunity teaches only when ready and preserves scarce economy',first_ice)
 def star_misses():
  finish(missed=3,wrong=0,motion=False);assert page.locator('#missed-count').inner_text()=='3';assert page.locator('#wrong-count').inner_text()=='0'
  assert page.locator('.medal-stars').get_attribute('aria-label')=='1 of 3 stars'
  assert '100%' in page.locator('.result-grid').inner_text();assert 'SUBMISSION ACCURACY' in page.locator('.result-grid').inner_text()
  assert page.locator('#star-guidance').inner_text()=='For two stars, miss 1 fewer word.';shot('clear-100pct-three-misses')
 check('One star / 100% result explicitly shows three misses and the exact next-star requirement',star_misses)
 def both_deficits():
  finish(missed=5,wrong=6,motion=False);assert page.locator('#star-guidance').inner_text()=='For two stars, miss 3 fewer words and make 3 fewer wrong submissions.'
  assert page.locator('#chapter-achievement').count()==0
 check('Both miss and wrong-submission deficits are explained; no fake improvement is shown',both_deficits)
 def stars_and_score():
  finish(level=1,missed=2,wrong=1,motion=False);assert 'First 2-star clear' in page.locator('#chapter-achievement').inner_text()
  finish(level=1,missed=0,wrong=0,motion=False);assert 'First 3-star clear' in page.locator('#chapter-achievement').inner_text()
  prior=api('return t.store.chapterBest("classic","campaign",1);')
  finish(level=1,base=2520,motion=False);assert 'Chapter best +120 points' in page.locator('#chapter-achievement').inner_text()
  assert 'Classic · Campaign · Chapter 01' in page.locator('#chapter-achievement').inner_text()
  current=api('return t.store.chapterBest("classic","campaign",1);');assert current['score']==prior['score']+120
  assert current['wordSeed']==api('return m.wordSeed;');shot('chapter-personal-best')
  saved=api('return JSON.stringify(t.store.data);');api('t.show("map");t.show("back");');assert api('return JSON.stringify(t.store.data);')==saved
  assert 'Chapter best +120 points' in page.locator('#chapter-achievement').inner_text()
 check('Real star gains and +120 scoped PB appear once using previous values, including return from map',stars_and_score)
 def compare_modes():
  before=api('return t.store.chapterBest("classic","campaign",1);');finish(level=1,mode='practice',base=4000,motion=False)
  text=page.locator('#chapter-achievement').inner_text();assert 'Chapter score recorded' in text and 'Practice' in text
  assert api('return t.store.chapterBest("classic","campaign",1);')==before
  finish(level=1,mode='practice',base=4000,motion=False);assert page.locator('#chapter-achievement').count()==0
 check('Practice attempts cannot beat or relabel a campaign PB; a tied repeat does not celebrate',compare_modes)
 def multiplier():
  readings=[]
  for n in [5,8,15,16,63,64,72]:
   start();api(f'm.words=[];m.streak={n-1};r.milestone=0;r.streakBeat=0;t.audio.cueLog=[];t.word("BOOK");t.flush();');typeword('BOOK');page.wait_for_timeout(40)
   data=api('return {streak:m.streak,multiplier:m.multiplier,milestone:r.milestone,sound:t.audio.cueLog.filter(x=>x.name==="streak").length};')
   upgrade=n in [8,16,64];assert data['sound']==int(upgrade);assert data['milestone']==(n if upgrade else 0);assert data['multiplier']==min(3,1+(n//8)*.25);readings.append(data)
   if n==16:shot('multiplier-16-exact')
  api('m.setBuffer("ZZZINVALID");m.submit();t.flush();');assert api('return r.milestone;')==0;assert api('return m.multiplier;')==1
  evidence['multiplierBoundaries']=readings
 check('8/16/64 model milestones, sound and visual stamp agree; 5/15/63/72 do not falsely celebrate',multiplier)
 def restore():
  start(5);api('const cp=m.checkpoint();cp.streak=16;cp.bestStreak=16;t.store.setCheckpoint(cp);t.show("menu");t.audio.cueLog=[];t.show("continue");t.freeze(true);t.flush();')
  assert api('return m.multiplier;')==1.5;assert api('return r.milestone;')==0;assert api('return t.audio.cueLog.filter(x=>x.name==="streak").length;')==0
 check('Continue preserves an existing multiplier without re-awarding its animation or sound',restore)
 def readable():
  readings=[]
  for w,h in [(1280,720),(1366,768),(1920,1080),(1024,600)]:
   page.set_viewport_size({'width':w,'height':h});start(6);api('m.words=[];m.inventory={fire:2,ice:2,slow:2,wind:2};m.danger=40;t.word("BIOLUMINESCENT","ice");t.flush();');page.wait_for_timeout(150)
   d=page.evaluate('''()=>{const scale=document.querySelector('#stage').getBoundingClientRect().width/1200;return {scale,size:[innerWidth,innerHeight],labels:[...document.querySelectorAll('.spell-ready,.spell-command,.book-count,.spell-use,.trial-indicator')].map(e=>({name:e.className,font:parseFloat(getComputedStyle(e).fontSize)*scale,overflow:e.scrollWidth>e.clientWidth})),usage:[...document.querySelectorAll('.spell-use')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,bottom:r.bottom,overflow:e.scrollWidth>e.clientWidth};})};}''')
   # Above-book state captions intentionally use the approved fixed 16px logical type.
   # Existing keys/counts/commands remain at their original >=14px effective contract.
   assert all(abs(x['font']-16*d['scale'])<.1 if 'spell-ready' in x['name'] else x['font']>=13.9 for x in d['labels']),d
   assert not any(x['overflow']for x in d['usage']),d
   assert d['usage'][0]['right']<d['usage'][1]['x'];assert d['usage'][2]['right']<d['usage'][3]['x'];readings.append(d)
   assert api('return t.visual().readability.every(w=>w.lines.length===1);');shot(f'readability-{w}x{h}')
  evidence['readability']=readings;page.set_viewport_size({'width':1366,'height':768})
 check('14px effective keys/counts and approved compact above-book captions; single-line words at four viewport sizes',readable)
 def wing_results():
  values=[]
  for lev in [6,12,18,24,30,36,42]:
   finish(level=lev);assert page.locator('#screen-layer').get_attribute('data-screen')=='scene-wing';assert page.locator('.journey-seal').count()==8
   page.wait_for_timeout(110);assert page.evaluate('document.activeElement.dataset.action')=='skip-ceremony'
   assert page.locator('#play-hud').get_attribute('inert')is not None
   if lev==18:page.wait_for_timeout(500);shot('clockwork-restored')
   page.keyboard.press('Enter');assert page.locator('#screen-layer').get_attribute('data-screen')=='level-clear'
   assert page.locator('.wing-reward').is_visible();values.append({'level':lev,'title':page.locator('.wing-reward strong').inner_text()})
   page.wait_for_timeout(270);page.locator('[data-action="next"]').click();assert api('return m.level;')==lev+1;assert api('return m.phase;')=='playing'
  evidence['wingRewards']=values
 check('All seven intermediate wings celebrate, keyboard-skip safely and continue to the correct next chapter',wing_results)
 def finale():
  finish(level=48);assert page.locator('#screen-layer').get_attribute('data-screen')=='scene-finale';page.wait_for_timeout(2600)
  assert page.locator('.journey-seal.lit').count()==8;assert 'You are the Typekeeper.' in page.locator('.journey-copy').inner_text();shot('finale-all-seals')
  page.wait_for_function('document.querySelector("#screen-layer").dataset.screen==="level-clear"',timeout=5500)
  assert page.locator('#modal-title').inner_text()=='The library is yours.';assert page.locator('.journey-seal.lit').count()==8
  assert page.locator('[data-action="endless"]').is_visible();assert page.locator('[data-action="map"]').is_visible();shot('finale-results')
  page.locator('[data-action="endless"]').click();assert api('return m.mode;')=='endless';assert api('return m.level;')==49
 check('Campaign 48 plays the complete four-second finale, lights all eight seals and opens Endless',finale)
 def wrong_modes():
  for mode,lev in [('practice',48),('endless',49)]:
   finish(level=lev,mode=mode);assert page.locator('#screen-layer').get_attribute('data-screen')=='scene-clear';assert page.locator('.journey-overlay').count()==0;result()
   assert page.locator('.wing-reward').count()==0;assert page.locator('.journey-seals').count()==0;assert page.locator('#modal-title').inner_text()!='The library is yours.'
 check('Practice 48 and Endless never trigger or claim the campaign ending',wrong_modes)
 def reduced():
  finish(level=48,motion=False);assert page.locator('#screen-layer').get_attribute('data-screen')=='level-clear';assert api('return t.outcomeCue.active;')is False
  assert page.locator('.journey-seal.lit').count()==8;assert api('return r.ceremony;')is None;assert api('return t.audioState().journeyPlaying;')is False;shot('finale-reduced-motion')
  page.keyboard.press('Tab');assert page.evaluate('document.activeElement.closest("#screen-layer")!==null')
 check('Reduced motion immediately presents a static complete ending with usable keyboard navigation',reduced)
 def skip_and_cancel():
  finish(level=48);page.wait_for_timeout(150);page.evaluate('document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",repeat:true,bubbles:true,cancelable:true}))');assert page.locator('#screen-layer').get_attribute('data-screen')=='scene-finale'
  page.keyboard.press('Escape');assert page.locator('#screen-layer').get_attribute('data-screen')=='level-clear'
  api('t.show("menu");');page.wait_for_timeout(4500);assert page.locator('#screen-layer').get_attribute('data-screen')=='menu';assert api('return r.ceremony;')is None
  finish(level=12);page.locator('.journey-skip').click();assert page.locator('#screen-layer').get_attribute('data-screen')=='level-clear'
 check('Held Enter does not skip; Escape/button skip once and old ceremonies cannot reopen a later menu',skip_and_cancel)
 def hidden():
  finish(level=48);page.wait_for_timeout(160);page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));')
  elapsed=api('return t.outcomeCue.elapsed;');page.wait_for_timeout(350);assert api('return t.outcomeCue.elapsed;')==elapsed
  page.evaluate('delete document.hidden;document.dispatchEvent(new Event("visibilitychange"));');page.wait_for_timeout(160);assert api('return t.outcomeCue.elapsed;')>elapsed;result()
 check('Visibility-change fixture suspends ceremony time and resumes without progressing gameplay',hidden)
 def sound():
  start(48);api('t.setSettings({music:true,sfx:true,muted:false});');page.locator('#typing-input').click();api('t.audio.unlock();')
  page.wait_for_function('__TM_TEST__.audioState().state==="running"',timeout=10000)
  api('m.words=[];m.progress=m.config.quota-1;m.stageCorrect=m.progress;t.audio.cueLog=[];t.word("FINAL");t.flush();');typeword('FINAL');page.wait_for_timeout(150)
  a=api('return t.audioState();');assert a['journeyPlaying'];assert a['journeyVoices']>0;assert api('return t.audio.cueLog.some(x=>x.name==="library-homecoming");')
  result();page.wait_for_timeout(140);assert api('return t.audioState().journeyVoices;')==0;assert not api('return t.audioState().journeyPlaying;');evidence['finaleAudio']=a
  start(6);api('t.setSettings({sfx:false,music:true,muted:false});m.words=[];m.progress=m.config.quota-1;m.stageCorrect=m.progress;t.word("FINAL");t.flush();');typeword('FINAL')
  assert not api('return t.audioState().journeyPlaying;');assert page.locator('.journey-overlay').is_visible();result()
 check('Actual WebAudio finale motif schedules and cancels cleanly; independent SFX-off keeps the visual reward',sound)
 def fire_ice():
  print('  elemental fixture: start FIRE',flush=True)
  start(25);api('m.words=[];m.inventory={fire:2,ice:2,slow:2,wind:2};[["BOOK","normal",460,290],["GARDEN","fire",810,350],["BIOLUMINESCENT","ice",580,440]].forEach(w=>t.word(...w));t.flush();')
  page.locator('#typing-input').fill('BOOK');before=api('return m.score;');page.keyboard.press('1');page.wait_for_timeout(170);shot('fire-object-bound');assert api('return m.score;')==before;assert api('return m.words.length;')==0
  assert page.locator('#typing-input').input_value()=='BOOK';print('  elemental fixture: advance replacement',flush=True);api('t.advance(1.2);');assert api('return m.words.length;')>0;print('  elemental fixture: start ICE',flush=True)
  start(24);api('m.words=[];m.inventory.ice=1;t.word("BIOLUMINESCENT","ice",620,345);t.flush();');page.keyboard.press('2');page.wait_for_timeout(270);shot('ice-readable');print('  elemental fixture: type frozen word',flush=True);typeword('BIOLUMINESCENT');assert api('return m.correct;')==1
 check('Object-bound FIRE preserves input and replacement rules; frozen long words remain typable',fire_ice)
 def save_export():
  j=api('return JSON.parse(t.store.exportData());');assert j['appVersion']=='3.6.2';assert j['version']==3
  assert any(x.get('wordSeed')is not None for x in j['chapterBests'].values());assert all(k.startswith('typekeeper-3.2.1|')for k in j['chapterBests'])
  assert api('return t.store.progress("classic").stages[48].campaignClear;')is True
  evidence['saveScopes']=sorted(j['chapterBests'])
 check('Actual export contains compatible save schema, correctly scoped PBs and genuine word seeds',save_export)
 report={'version':'3.6.2','mode':args.mode,'scope':__doc__,'browser':browser.version,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'tests':rows,'passed':sum(x['status']=='PASS'for x in rows),'failed':sum(x['status']=='FAIL'for x in rows),'unhandledErrors':errors,'evidence':evidence}
 (OUT/f'clarity-mastery-{args.mode}.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items()if k not in ['tests','evidence']},indent=2));browser.close()
 if report['failed']or errors:raise SystemExit(1)
