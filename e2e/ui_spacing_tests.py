#!/usr/bin/env python3
"""v3.6.4 Breathing Room: rendered UI geometry and real input regression.
Shipping standalone/Blob modules; no substitute UI, model, audio or DOM handlers.
Controlled test stock and end-of-chapter fixtures are not human play sessions.
The in-memory transport has no persistent browser origin; actual save import /
export is exercised, native storage and OS/browser certification are not claimed.
"""
from pathlib import Path
import argparse,hashlib,json,time,sys,traceback
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
from module_fixture import module_fixture
ROOT=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--mode',choices=['standalone','modules'],default='standalone');a.add_argument('--executable',default='/usr/bin/chromium');args=a.parse_args()
OUT=ROOT/'qa364';OUT.mkdir(exist_ok=True);SHOTS=OUT/'ui-screenshots';SHOTS.mkdir(exist_ok=True)
rows=[];errors=[];evidence={'hud':[],'dialogs':[]}
rect_js='''(sel)=>{let e=document.querySelector(sel);if(!e)return null;let s=getComputedStyle(e),r=e.getBoundingClientRect();if(!e.getClientRects().length||e.hidden||s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return null;return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,sw:e.scrollWidth,cw:e.clientWidth,sh:e.scrollHeight,ch:e.clientHeight,text:e.textContent.trim(),font:parseFloat(s.fontSize)};}'''
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=args.executable,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1366,'height':768});page.set_default_timeout(6500);page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__')
 def api(code):return page.evaluate('(()=>{const t=__TM_TEST__,m=t.model,r=t.renderer;'+code+'})()')
 def rect(sel):return page.evaluate(rect_js,sel)
 def shot(name):page.screenshot(path=str(SHOTS/f'{name}-{args.mode}.png'))
 def clear_pointer():page.mouse.move(1,1)
 def start(level=1,mode='campaign',motion=False,contrast=False,stock=2,danger=0):
  clear_pointer()
  page.evaluate('''o=>{let t=__TM_TEST__,m=t.model;t.setSettings({motion:o.motion,contrast:o.contrast,hints:false,muted:true,music:false,sfx:false,resumeCountdown:false,pace:'classic'});t.start(385170,o.level,o.mode);t.freeze(true);m.words=[];m.danger=o.danger;for(let p of ['fire','ice','slow','wind'])m.inventory[p]=o.stock;t.word('WONDER','normal',580,330);t.flush();}''',dict(level=level,mode=mode,motion=motion,contrast=contrast,stock=stock,danger=danger))
 def resize(w,h):page.set_viewport_size(dict(width=w,height=h));page.wait_for_timeout(80)
 def finish(level=1,mode='campaign',motion=False,missed=3,wrong=0,base=12340):
  start(level,mode,motion)
  page.evaluate('''o=>{let t=__TM_TEST__,m=t.model;m.words=[];m.progress=m.config.quota-1;m.stageCorrect=m.progress;m.correct=m.progress;m.stageMissed=o.missed;m.stageWrong=o.wrong;m.missed=o.missed;m.wrong=o.wrong;m.stageTime=34;m.stageCharacters=180;m.time=34;m.score=o.base;m.stageStartScore=0;t.word('FINAL');t.flush();}''',dict(missed=missed,wrong=wrong,base=base))
  page.locator('#typing-input').fill('FINAL');page.keyboard.press('Enter');page.wait_for_timeout(50)
 def open_menu(name):api('t.show("menu");');api('t.show('+json.dumps(name)+');') if name!='menu' else None;page.wait_for_timeout(100)
 def check(name,fn):
  started=time.monotonic()
  try:fn();assert not errors,errors;row={'name':name,'status':'PASS','seconds':round(time.monotonic()-started,3)}
  except Exception as e:
   row={'name':name,'status':'FAIL','error':repr(e),'trace':traceback.format_exc(),'seconds':round(time.monotonic()-started,3)}
   try:shot(f'failure-{len(rows)+1}')
   except:pass
  rows.append(row);print(json.dumps(row),flush=True)
 def identity():
  assert api('return t.info.version;')=='3.6.4';assert 'v3.6.4' in page.title()
  assert api('return m.config===undefined||m.info!==undefined;')
 check('Shipping version and initialized diagnostics identify v3.6.4',identity)
 def first_ice_zone():
  clear_pointer();api('t.setSettings({motion:false,muted:true,hints:true,resumeCountdown:false});t.start(385170);t.freeze(true);t.flush();')
  for _ in range(6):
   api('let steps=0;while(!m.words.length&&steps++<300)t.advance(1/60);')
   word=api('return m.words[0].text;');page.locator('#typing-input').fill(word);page.keyboard.press('Enter')
  assert api('return m.inventory.ice;')==1
  # No-storage notice is genuine in this transport. The cue must wait, rather
  # than count down invisibly or appear over that message.
  if rect('#toast'):assert rect('#first-ice-hint') is None
  page.wait_for_function('!document.querySelector("#toast").classList.contains("visible")',timeout=4500)
  page.wait_for_function('!document.querySelector("#first-ice-hint").hidden')
  cue=rect('#first-ice-hint');dock=rect('#typing-dock');st=rect('#stage');scale=st['w']/1200
  assert cue['y']>dock['bottom']+8*scale and cue['bottom']<st['bottom']-8*scale,(cue,dock)
  page.locator('#spell-wind').hover();assert rect('#tip-wind') is None
  shot('first-ice-clear-desk');page.keyboard.press('2');assert rect('#first-ice-hint') is None
  assert api('return m.effects.ice;')==6
 check('First genuinely earned ICE waits for notifications and teaches in the clear desk, never over live words',first_ice_zone)
 def hud(w,h,danger,stock,contrast=False):
  resize(w,h);start(6,stock=stock,danger=danger,contrast=contrast);page.wait_for_timeout(90)
  st=rect('#stage');scale=st['w']/1200;cap=rect('.meter-caption');bottle=rect('#limit-instrument');dock=rect('#typing-dock')
  assert cap and cap['text']=='PAPER PILE';assert cap['sw']<=cap['cw']+1,cap
  assert cap['h']<cap['font']*1.26*scale+1,cap # exactly one caption line
  statuses=[]
  for power in ['fire','ice','slow','wind']:
   sel='#rescue-hint' if power=='wind' and danger>=50 and stock else '#ready-'+power
   status=rect(sel);key=rect('#spell-'+power+' .spell-keycap');command=rect('#spell-'+power+' .spell-command');use=rect('#use-'+power);count=rect('#count-'+power)
   assert status and key and command and use and count,(power,status,key)
   assert status['sw']<=status['cw']+1,(power,status)
   assert use['sw']<=use['cw']+1,(power,use)
   assert status['bottom']<=key['y']+0.5,(power,status,key)
   assert key['bottom']<count['y'],(power,key,count)
   assert count['bottom']<command['y']+1,(power,count,command)
   assert command['bottom']<=use['y']+0.5,(power,command,use)
   assert use['bottom']<=st['bottom']-3*scale,(power,use,st)
   # Latest requested caption is ABOVE its book instead of on the cover.
   # Its text must clear live word INK; the blank scroll frame is not an input zone.
   book=rect('#spell-'+power+' .spell-book')
   assert status['bottom']<=book['y']+0.1,(power,status,book)
   assert status['y']>=st['y']+660*scale-0.1,(power,status)
   statuses.append({'power':power,'status':status,'key':key,'use':use})
  wind=statuses[-1]['status'];gap=wind['y']-cap['bottom']
  assert gap>=40*scale,{'gap':gap,'scale':scale,'cap':cap,'wind':wind}
  assert cap['x']>=st['x']+978*scale,cap
  assert rect('#rescue-hint') is not None if danger>=50 and stock else rect('#rescue-hint') is None
  if danger>=50 and stock:assert rect('#ready-wind') is None
  # Trial status is in the top HUD, above the top of a newly arriving word.
  trial=rect('#trial-indicator');assert trial['bottom']<=st['y']+142*scale-8*scale,(trial,scale)
  buttons=page.locator('.utility-controls .icon-button');br=[rect('#'+buttons.nth(i).get_attribute('id')) for i in range(buttons.count())]
  for x,y in zip(br,br[1:]):assert x['right']+6*scale<=y['x']
  assert all(x['right']<=st['right']-10*scale for x in br)
  assert page.locator('#limit-instrument').get_attribute('aria-valuenow')==str(danger)
  if h>=720 and w>=960:assert all(x['w']>=35.5 and x['h']>=35.5 for x in br)
  evidence['hud'].append({'viewport':[w,h],'danger':danger,'stock':stock,'contrast':contrast,'scale':scale,'pileToWindPx':round(gap,3),'caption':cap,'statuses':statuses,'utility':br})
  if (w,h) in [(1366,768),(800,600),(1280,720)] and danger in [0,95]:shot(f'hud-{w}x{h}-{danger}')
 # Deliberate low-height/portrait tests establish safe fitting, not phone-game support.
 sizes=[(1920,1080),(1440,900),(1366,768),(1280,720),(1024,768),(1024,600),(800,600),(960,540),(640,480),(2560,1080),(768,1024),(360,640)]
 for w,h in sizes:
  for danger,stock in [(0,0),(95,2)]:check(f'HUD {w}×{h}, pile {danger}%, stock {stock}: separated status, key, caption and safe field',lambda w=w,h=h,d=danger,s=stock:hud(w,h,d,s))
 check('High-contrast 720p HUD preserves spacing and equivalent rescue information',lambda:hud(1280,720,95,2,True))
 def rescue_states():
  resize(1366,768);start(danger=49);assert rect('#rescue-hint') is None
  api('m.danger=50;t.flush();');assert rect('#rescue-hint');assert rect('#ready-wind') is None
  page.keyboard.press('4');assert api('return m.danger;')==0;assert rect('#rescue-hint') is None
  api('m.danger=95;t.flush();');assert rect('#rescue-hint') is None # cooldown is not "ready"
  api('t.advance(1.2);m.danger=95;t.flush();');assert rect('#rescue-hint')
  api('m.inventory.wind=0;t.flush();');assert rect('#rescue-hint') is None;assert rect('#ready-wind')['text']=='COLLECT'
 check('Rescue has one home and never requests unavailable, cooling-down or empty WIND',rescue_states)
 def spell_states():
  resize(800,600);start(6);page.locator('#typing-input').fill('WON')
  page.keyboard.press('2');page.keyboard.press('3');assert 'ACTIVE' in page.locator('#ready-ice').inner_text();assert 'QUEUED' in page.locator('#ready-slow').inner_text()
  for p in ['ice','slow']:
   d=rect('#ready-'+p);k=rect('#spell-'+p+' .spell-keycap');assert d['sw']<=d['cw']+1 and d['bottom']<k['y']
  assert page.locator('#typing-input').input_value()=='WON';shot('queued-slow-600p')
  page.keyboard.press('Escape');assert rect('#rescue-hint') is None
  page.wait_for_timeout(300);page.locator('[data-action=resume]').click();assert page.locator('#typing-input').input_value()=='WON'
 check('ICE active / SLOW queued labels fit at 600p and pause/resume preserves the typed buffer',spell_states)
 def bottom_word():
  resize(1366,768);start();api('m.words=[];t.word("ICEBOUND","normal",300,647.9);t.word("EMBER","normal",895,647.9);t.flush();');page.wait_for_timeout(120)
  st=rect('#stage');s=st['w']/1200
  ink=api("const c=document.createElement('canvas').getContext('2d');return r.readability.map(w=>{c.font=`700 ${w.fontSize}px Georgia, serif`;c.textBaseline='middle';return {id:w.id,bottom:w.y+c.measureText(w.text).actualBoundingBoxDescent};});")
  assert ink
  assert min(rect('#ready-'+p)['y'] for p in ['ice','slow'])>st['y']+max(w['bottom'] for w in ink)*s+1*s
  evidence['lastWordInk']=ink
  shot('last-live-card-safe-zone')
 check('Last live ICE/SLOW lettering remains clear of the above-cover book status tabs',bottom_word)
 def tooltips():
  resize(1366,768);start();page.wait_for_timeout(3050) # let the genuine no-storage notification expire
  for power in ['fire','ice','slow','wind']:
   page.locator('#typing-input').focus();page.locator('#spell-'+power).hover();page.wait_for_timeout(90)
   tip=rect('#tip-'+power);dock=rect('#typing-dock');assert tip,(power,tip)
   st=rect('#stage');s=st['w']/1200
   assert tip['y']>=dock['bottom']+8*s,(tip,dock)
   assert tip['x']>=st['x']+340*s and tip['right']<=st['x']+855*s
   assert tip['bottom']<=st['bottom']-8*s,(tip,st)
   assert tip['sw']<=tip['cw']+1 and tip['sh']<=tip['ch']+1,tip
  shot('wind-context-desk')
  # Real keyboard focus has priority over a parked pointer on another book.
  page.keyboard.press('Shift');page.locator('#spell-fire').focus();page.keyboard.press('Tab') # ICE: focus-visible from keyboard
  page.locator('#spell-wind').hover();page.wait_for_timeout(80)
  tips=[x for p in ['fire','ice','slow','wind'] if (x:=rect('#tip-'+p))]
  assert len(tips)==1,tips;assert page.evaluate('document.activeElement.id')=='spell-ice'
  page.keyboard.press('B');assert page.evaluate('document.activeElement.id')=='typing-input';assert page.locator('#typing-input').input_value().endswith('B')
 check('All four hover descriptions use the clear center desk; keyboard focus wins over pointer',tooltips)
 def notice():
  start();page.locator('#typing-input').dispatch_event('paste');page.wait_for_timeout(70)
  assert page.locator('#toast').is_visible();assert 'Paste is disabled' in page.locator('#toast').inner_text()
  page.locator('#spell-wind').hover();assert rect('#tip-wind') is None
  page.keyboard.press('Escape');assert rect('#toast') is None
  open_menu('records');page.locator('#save-file').set_input_files({'name':'broken.json','mimeType':'application/json','buffer':b'{"no":"save"}'})
  page.wait_for_function('!document.querySelector("#dialog-notice").hidden')
  n=rect('#dialog-notice');a=rect('.modal-actions');assert n['bottom']+3<=a['y'],(n,a)
  assert page.locator('#dialog-notice').get_attribute('role')=='status';shot('import-error-inline')
  with page.expect_download() as d:page.locator('[data-action=export-save]').click()
  file=Path(d.value.path());saved=json.loads(file.read_text());assert saved['appVersion']=='3.6.4'
  assert 'Save exported.' in page.locator('#dialog-notice').inner_text()
  page.locator('#save-file').set_input_files({'name':'valid.json','mimeType':'application/json','buffer':file.read_bytes()});page.wait_for_function('document.querySelector("#dialog-notice").textContent==="Save imported."')
 check('Context notices never stack over help or dialog actions; real invalid/valid save import and export',notice)
 def dialog_metrics(name):
  page.wait_for_timeout(320)
  vals=page.evaluate('''()=>{let e=document.querySelector('.modal'),r=e.getBoundingClientRect(),s=document.querySelector('#stage').getBoundingClientRect();return {screen:document.querySelector('#screen-layer').dataset.screen,modal:{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,sw:e.scrollWidth,cw:e.clientWidth},stage:{x:s.x,y:s.y,right:s.right,bottom:s.bottom},overflow:[...e.querySelectorAll('button,select,.setting-row,.record-selects,.stage-tile,.performance-summary,.mastery-explanation,.wing-heading,.journey-seals')].filter(x=>x.getClientRects().length&&x.scrollWidth>x.clientWidth+1).map(x=>({cls:x.className,id:x.id,sw:x.scrollWidth,cw:x.clientWidth,text:x.textContent.slice(0,70)}))};}''')
  m,s=vals['modal'],vals['stage'];assert m['x']>=s['x']+1 and m['right']<=s['right']-1,vals
  assert m['y']>=s['y']+1 and m['bottom']<=s['bottom']-1,vals
  assert m['sw']<=m['cw']+1,vals;assert not vals['overflow'],vals
  # Every visible action remains reachable by its actual scroller and point-hit test.
  buttons=page.locator('.modal button:not([disabled])')
  for i in range(buttons.count()):
   e=buttons.nth(i)
   if not e.is_visible():continue
   e.scroll_into_view_if_needed();bounds=e.bounding_box();assert bounds
   good=e.evaluate('''e=>{let r=e.getBoundingClientRect(),hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);return e===hit||e.contains(hit);}''')
   assert good,{'name':name,'button':e.inner_text(),'bounds':bounds}
  page.locator('.modal').evaluate('e=>e.scrollTop=0')
  evidence['dialogs'].append({'label':name,**vals})
 def simple_dialog(name,w,h):
  resize(w,h);open_menu(name);dialog_metrics(name);shot(f'{name}-{w}x{h}')
 for w,h in [(1366,768),(1024,600),(640,480)]:
  for name in ['settings','how','about','records','map']:check(f'{name} dialog {w}×{h}: readable flow, scrollable actions and no control clipping',lambda n=name,w=w,h=h:simple_dialog(n,w,h))
 def settings_tabs():
  resize(1280,720);open_menu('settings')
  for tab in ['display','gameplay','audio']:
   page.locator('[data-settings-tab='+tab+']').click();page.wait_for_timeout(90)
   assert page.evaluate('document.activeElement.dataset.settingsTab')==tab
   dialog_metrics('settings-'+tab)
  # A native toggle keeps focus; a native slider and select remain operable.
  page.locator('[data-settings-tab=display]').click();tog=page.locator('[data-toggle=contrast]');tog.click();assert tog.get_attribute('aria-checked')=='true';assert page.evaluate('document.activeElement.dataset.toggle')=='contrast';tog.click()
  shot('settings-display-focus')
 check('Settings tabs preserve focus, all three layouts fit, and toggles remain actual controls',settings_tabs)
 def filters():
  resize(1024,600);open_menu('records')
  for pid,val in [('records-mode','practice'),('records-chapter','17'),('records-pace','maniac')]:
   page.locator('#'+pid).focus();page.locator('#'+pid).select_option(val);page.wait_for_timeout(90)
   assert page.evaluate('document.activeElement.id')==pid;assert page.locator('#'+pid).input_value()==val
  page.locator('[data-period=week]').click();page.wait_for_timeout(90);assert page.evaluate('document.activeElement.dataset.period')=='week'
  dialog_metrics('records-long-chapter-filter');shot('records-practice-600p')
 check('Records filters keep focus and long chapter titles have a full-width native selector',filters)
 def populated_records():
  api('for(let i=0;i<10;i++)t.store.add({ruleset:"typekeeper-3.6.4",score:987654321-i*108,level:48,words:2100,wpm:115,accuracy:99.8,pace:"classic",mode:"campaign",startLevel:1,date:Date.now()-i*1000,seed:i+1,streak:76,retries:0});')
  open_menu('records');page.locator('#records-pace').select_option('classic');page.locator('#records-mode').select_option('campaign');page.locator('[data-period=all]').click()
  assert page.locator('.record-table tbody tr').count()==10
  dialog_metrics('records-ten-large-scores');shot('records-populated')
  page.locator('[data-action=clear-records]').click();dialog_metrics('clear-records-confirm');page.locator('[data-action=records]').click();assert page.locator('.record-table tbody tr').count()==10
 check('Ten populated large-score records stay within table cells; cancelling clear preserves records',populated_records)
 def wings():
  resize(1366,768)
  api('for(let i=1;i<=48;i++)t.store.data.progress.classic.stages[i]={medal:i%3+1,score:4200,wpm:78,accuracy:95,ruleset:"typekeeper-3.6.4",campaignClear:true};t.store.data.progress.classic.unlocked=48;t.setSettings({pace:"classic"});')
  open_menu('map')
  for wing in range(8):
   page.locator('button[data-wing="'+str(wing)+'"]').click();page.wait_for_timeout(80)
   assert page.evaluate('document.activeElement.dataset.wing')==str(wing)
   assert page.locator('.stage-tile').count()==6;assert page.locator('.mastery-note').count()==6
   dialog_metrics('mastered-wing-'+str(wing+1))
  shot('mastery-final-wing')
 check('All eight restored wing tabs preserve focus and all 48 mastery tiles fit without duplicate locked text',wings)
 def trap():
  resize(1280,720);open_menu('how');summary=page.locator('summary');summary.focus();page.wait_for_timeout(300);page.keyboard.press('Enter');assert page.locator('details').get_attribute('open') is not None
  dialog_metrics('expanded-rules');shot('how-expanded')
  ids=page.evaluate('''()=>[...document.querySelectorAll('.modal button:not([disabled]),.modal select,.modal input:not([hidden]),.modal a[href],.modal summary')].filter(e=>e.offsetParent!==null).map(e=>e.tagName);''');assert 'SUMMARY' in ids
  first=page.locator('.modal button:not([disabled])').first;first.focus();page.keyboard.press('Shift+Tab');assert page.evaluate('document.querySelector(".modal").contains(document.activeElement)')
  for _ in range(12):page.keyboard.press('Tab');assert page.evaluate('document.querySelector(".modal").contains(document.activeElement)')
  page.keyboard.press('Escape');assert page.locator('.modal').count()==0
 check('Expanded How-to remains scrollable; native summary, Tab / Shift-Tab and Escape respect the modal',trap)
 def pause_quit():
  resize(1024,600);start();page.locator('#typing-input').fill('WON');page.locator('#pause-button').click();dialog_metrics('pause')
  page.locator('[data-action=quit]').click();dialog_metrics('quit');page.locator('.game-button[data-action=cancel-quit]').click();assert page.locator('#modal-title').inner_text()
  page.wait_for_timeout(300);page.locator('[data-action=resume]').click();assert page.locator('#typing-input').input_value()=='WON'
  page.keyboard.press('Escape');page.locator('[data-action=quit]').click();page.locator('[data-action=menu]').click();api('t.show("new-confirm");');dialog_metrics('new-game-confirm');shot('new-game-confirm')
 check('Pause / quit / cancel / fresh-start confirmation have reachable actions and preserve input',pause_quit)
 for w,h in [(1366,768),(1280,720),(1024,600),(640,480)]:
  def outcomes(w=w,h=h):
   resize(w,h);finish(missed=3,wrong=0);assert page.locator('#missed-count').inner_text()=='3';assert '100%' in page.locator('.result-grid').inner_text();dialog_metrics('one-star-'+str(h));shot('one-star-'+str(h))
   finish(48,motion=False,missed=0);assert page.locator('#modal-title').inner_text()=='The library is yours.';assert page.locator('.journey-seal.lit').count()==8;dialog_metrics('finale-'+str(h));shot('finale-result-'+str(h))
  check(f'One-star explanation and eight-seal finale at {w}×{h}: no text clipping, all actions reachable',outcomes)
 def finale_motion():
  resize(1280,720);finish(48,motion=True,missed=0);assert page.locator('.journey-overlay').count()==1;page.wait_for_timeout(550);s=rect('.journey-skip');dock=rect('#typing-dock');assert s['y']>dock['bottom'];shot('finale-ceremony')
  page.locator('.journey-skip').click();assert page.locator('#modal-title').inner_text()=='The library is yours.'
  finish(48,'practice',motion=True,missed=0);assert page.locator('.journey-overlay').count()==0;api('t.skipOutcome();');dialog_metrics('practice48');assert page.locator('.journey-seals').count()==0
 check('Animated finale can be skipped at 720p; practice 48 retains ordinary results',finale_motion)
 def gameover():
  resize(800,600);start(5);api('m.score=987654321;m.danger=100;m.checkGameOver();t.flush();t.skipOutcome();');page.wait_for_timeout(80)
  assert api('return m.phase;')=='game-over';dialog_metrics('game-over');shot('game-over-600p')
  page.locator('[data-action=retry-chapter]').click();assert api('return m.level;')==5;assert api('return m.phase;')=='playing';assert api('return m.score;')==0
 check('Long-score game-over and retry at 600p remain operable and restart the same chapter',gameover)
 def responsive_state():
  start(17);api('m.danger=95;m.streak=16;m.words=[];t.word("MECHANISM","ice",590,270);t.flush();');page.locator('#typing-input').fill('MECHA');before=api('return JSON.stringify(m.snapshot());')
  for w,h in [(2560,1080),(640,480),(768,1024),(1920,1080)]:resize(w,h);assert api('return JSON.stringify(m.snapshot());')==before
  assert page.locator('#typing-input').input_value()=='MECHA';assert api('return m.multiplier;')==1.5
 check('Live resize / orientation changes alter only layout, never rules, word positions or typed progress',responsive_state)
 def chapter_copy():
  for w,h in [(1366,768),(1024,600)]:
   resize(w,h)
   for level in range(1,49):
    start(level,mode='practice');page.wait_for_timeout(20)
    title=rect('#chapter-name');quota=rect('.chapter-progress');ribbon=rect('.chapter-panel');st=rect('#stage');scale=st['w']/1200
    assert title['sw']<=title['cw']+1,(level,title)
    assert quota['sw']<=quota['cw']+1,(level,quota)
    # Clip-path rises by 8% in the middle. Text must fit within that boundary.
    assert quota['bottom']<ribbon['y']+ribbon['h']*.92-1*scale,(level,quota,ribbon)
    if h>=720:assert quota['font']*scale>=10.9
  api('m.score=999999999999;t.setSettings({detailedHUD:true});t.flush();')
  score=rect('#score-value');panel=rect('.score-panel');chapter=rect('.chapter-panel')
  assert score['sw']<=score['cw']+1,(score,panel)
  assert panel['right']<chapter['x'];shot('long-score-practice-header')
 check('All 48 chapter titles, practice prefixes and readable quotas fit; a trillion-scale score stays separate',chapter_copy)
 def dpr():
  q=browser.new_page(viewport=dict(width=1440,height=900),device_scale_factor=2);q.on('pageerror',lambda e:errors.append(str(e)))
  q.set_content(inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT),wait_until='load');q.wait_for_function('!!window.__TM_TEST__')
  q.evaluate('''()=>{let t=__TM_TEST__;t.setSettings({motion:false,muted:true});t.start(991);t.freeze(true);t.model.danger=95;t.model.inventory.wind=1;t.flush();}''');q.wait_for_timeout(100)
  cap=q.evaluate(rect_js,'.meter-caption');ready=q.evaluate(rect_js,'#rescue-hint');st=q.evaluate(rect_js,'#stage');scale=st['w']/1200
  # The approved above-book row replaces the former on-cover baseline.
  assert ready['y']-cap['bottom']>=40*scale,(cap,ready,scale)
  cover=q.evaluate(rect_js,'#spell-wind .spell-book');assert ready['bottom']<cover['y'],(ready,cover)
  q.screenshot(path=str(SHOTS/f'retina-dpr2-{args.mode}.png'));q.close()
 check('DPR 2 rendering retains measured CSS gaps; browser emulation is not a Retina hardware certification',dpr)
 report={'version':'3.6.4','mode':args.mode,'scope':__doc__,'browser':browser.version,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'passed':sum(x['status']=='PASS'for x in rows),'failed':sum(x['status']=='FAIL'for x in rows),'tests':rows,'evidence':evidence,'unhandledErrors':errors}
 (OUT/f'ui-spacing-{args.mode}.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items()if k not in ['tests','evidence']},indent=2));browser.close()
 if report['failed'] or errors:raise SystemExit(1)
