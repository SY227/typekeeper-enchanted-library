#!/usr/bin/env python3
"""Fresh Journey: actual shipping UI/input/renderer in both build formats.
Controlled saved-game fixtures and a fault-injectable in-memory storage adapter.
The adapter exercises save/reload code paths, not a real hosted localStorage origin.
No human playtest, native-device or external studio certification is implied.
"""
from pathlib import Path
import argparse,hashlib,json,time,traceback
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
from module_fixture import module_fixture
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--mode',choices=['standalone','modules'],default='standalone');args=p.parse_args()
OUT=ROOT/'qa362';SHOTS=OUT/'restart-screenshots';SHOTS.mkdir(parents=True,exist_ok=True)
rows=[];errors=[];evidence={};KEY='typekeeper-enchanted-library-v3.2.1'
def fixture(seed=None):
 html=inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT)
 data={} if seed is None else {KEY:json.dumps(seed)}
 script='''<script>globalThis.__qaStorageData=new Map(Object.entries(SEED));globalThis.__qaStorageWrites=[];globalThis.__qaStorageDeny=false;Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>__qaStorageData.get(k)||null,setItem:(k,v)=>{if(__qaStorageDeny)throw new Error('QA simulated storage denial');__qaStorageData.set(k,String(v));__qaStorageWrites.push({key:k,value:String(v)});},removeItem:k=>__qaStorageData.delete(k)}});</script>'''.replace('SEED',json.dumps(data))
 return html.replace('<head>','<head>'+script,1)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1366,'height':768});page.set_default_timeout(7000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(fixture());page.wait_for_function('!!window.__TM_TEST__');page.wait_for_timeout(80)
 def api(code):return page.evaluate('(()=>{const t=__TM_TEST__,m=t.model,s=t.store;'+code+'})()')
 empty=api('return s.data;')
 def setup(pace='classic',cleared=11,cp=True,done=False):
  page.mouse.move(1,1)
  page.evaluate('''o=>{const t=__TM_TEST__,s=t.store,m=t.model;t.show('menu');s.data=structuredClone(o.empty);__qaStorageDeny=false;__qaStorageData.clear();__qaStorageWrites=[];
  t.setSettings({pace:o.pace,motion:false,muted:true,music:false,sfx:false,hints:false,resumeCountdown:false});
  for(let i=1;i<=(o.done?48:o.cleared);i++)s.completeStage(o.pace,{level:i,medal:3,stageScore:1000+i,wpm:80,accuracy:100,ruleset:t.info.ruleset});
  if(o.cleared||o.done){s.add({pace:o.pace,mode:'campaign',startLevel:1,level:6,score:9200,accuracy:96,wpm:70,ruleset:t.info.ruleset});s.recordScoreChase({pace:o.pace,mode:'campaign',startLevel:1,level:1,score:1580});s.recordChapter(o.pace,'practice',{level:5,stageScore:2500,medal:3,wpm:90,accuracy:100,words:14,wrong:0,missed:0,seconds:20,ruleset:t.info.ruleset},{seed:31});}
  if(o.cp){t.start(777,1);m.level=Math.min(48,o.cleared+1);m.score=o.cleared?12500:0;m.danger=o.cleared?25:0;m.prepareStage();s.setCheckpoint(m.checkpoint());}
  t.freeze(true);t.show('menu');s.save();__qaStorageWrites=[];
  }''',dict(empty=empty,pace=pace,cleared=cleared,cp=cp,done=done))
  page.wait_for_timeout(45)
 def data():return api('return s.data;')
 def permanent():return api('return {progress:s.data.progress,records:s.data.records,chapterBests:s.data.chapterBests,scoreChaseBests:s.data.scoreChaseBests,settings:s.data.settings};')
 def action(name):return page.locator(f'[data-action="{name}"]')
 def click(name):action(name).click();page.wait_for_timeout(35)
 def view():return page.locator('#screen-layer').get_attribute('data-screen')
 def snap():return api('return m.snapshot();')
 def shot(name):page.screenshot(path=str(SHOTS/f'{name}-{args.mode}.png'))
 def check(name,fn):
  st=time.monotonic()
  try:fn();assert not errors,errors;row={'name':name,'status':'PASS','seconds':round(time.monotonic()-st,3)}
  except Exception as e:
   row={'name':name,'status':'FAIL','error':str(e),'trace':traceback.format_exc(),'seconds':round(time.monotonic()-st,3)}
   try:shot('failure-'+str(len(rows)+1))
   except:pass
  rows.append(row);print(json.dumps(row),flush=True)
 def fresh():
  setup(cleared=0,cp=False);assert action('start').inner_text().startswith('Play');assert action('new-confirm').count()==0;click('start');assert snap()['level']==1;assert view()=='playing';assert api('return Object.values(m.inventory).every(x=>x===0);')
 check('New player retains one-click Play; no unsolicited popup or duplicate restart',fresh)
 def returning():
  setup();assert action('continue').count()==1;assert action('new-confirm').count()==1;assert action('new-confirm').inner_text()=='Start from Chapter 1';assert '12' in page.locator('.continue-detail').inner_text();assert action('new-confirm').evaluate('(e)=>e.closest(".menu-actions")!==null');assert page.evaluate('document.activeElement.dataset.action')=='continue';shot('returning-main-menu')
 check('Returning player sees Continue first and an explicit Chapter 1 option in the main actions',returning)
 def confirmation():
  setup();before=data();click('new-confirm');assert data()==before;assert 'Chapter 12' in page.locator('#fresh-run-change').inner_text();assert 'mastery stars and best scores' in page.locator('#fresh-progress-kept').inner_text();assert page.evaluate('document.activeElement.dataset.action')=='cancel-fresh';assert api('return __qaStorageWrites.length;')==0;shot('restart-confirmation')
 check('Confirmation names the replaced checkpoint, explains what stays, and defaults to cancel',confirmation)
 for how in ['button','escape','close','enter']:
  def cancel(how=how):
   setup();before=data();click('new-confirm')
   if how=='button':action('cancel-fresh').filter(has_text='Keep current').click()
   elif how=='close':page.locator('.close-button').click()
   elif how=='escape':page.keyboard.press('Escape')
   else:page.wait_for_timeout(300);page.keyboard.press('Enter')
   page.wait_for_timeout(65);assert view()=='menu';assert data()==before;assert page.evaluate('document.activeElement.dataset.action')=='new-confirm';assert api('return __qaStorageWrites.length;')==0
  check(f'Cancel by {how} keeps every save byte and restores focus to the entry choice',cancel)
 def tabcycle():
  setup();click('new-confirm');assert page.evaluate('document.activeElement.dataset.action')=='cancel-fresh';page.keyboard.press('Tab');assert page.locator('.close-button').evaluate('(e)=>e===document.activeElement');page.keyboard.press('Shift+Tab');assert page.evaluate('document.activeElement.dataset.action')=='cancel-fresh';page.keyboard.press('Escape')
 check('Confirmation traps keyboard focus and never defaults Enter to the destructive action',tabcycle)
 for pace in ['classic','relaxed','maniac']:
  def restart(pace=pace):
   setup(pace);before=permanent();oldcp=data()['checkpoints'][pace];click('new-confirm');click('fresh-start');api('t.freeze(true);');state=snap();assert state['level']==1 and state['score']==0 and state['danger']==0;assert api('return m.mode;')=='campaign';assert api('return m.startLevel;')==1;assert state['pace']==pace;assert state['seed']!=oldcp['seed'];assert all(x==0 for x in state['inventory'].values());assert permanent()==before;assert data()['checkpoints'][pace]['nextLevel']==1;assert page.locator('#typing-input').evaluate('(e)=>e===document.activeElement');assert api('return t.scoreChase.snapshot().best;')==1580
  check(f'{pace}: actual confirm starts Chapter 1, resets only the attempt and retains all collections/BEST',restart)
 def atomic():
  setup();click('new-confirm');api('__qaStorageWrites=[];');click('fresh-start');writes=api('return __qaStorageWrites.filter(x=>x.key==="'+KEY+'").map(x=>JSON.parse(x.value));');assert len(writes)==1;assert writes[0]['checkpoints']['classic']['nextLevel']==1;assert writes[0]['progress']['classic']['unlocked']==12;evidence['atomicCheckpointWrites']=len(writes)
 check('Actual confirmation makes one complete checkpoint write with no deletion window',atomic)
 def double():
  setup();click('new-confirm');click('fresh-start');old=snap();api('t.show("fresh-start");t.show("fresh-start");');assert snap()==old
 check('Duplicate or stale fresh-start events cannot restart an already-running campaign',double)
 def cancelled_stale():
  setup();before=data();click('new-confirm');page.keyboard.press('Escape');api('t.show("fresh-start");');assert data()==before and view()=='menu'
 check('A stale confirmation after cancellation is inert',cancelled_stale)
 def continue_old():
  setup();before=data()['checkpoints']['classic'];click('continue');assert snap()['level']==12 and snap()['score']==before['score'];assert api('return m.seed;')==before['seed'];assert data()['checkpoints']['classic']==before
 check('Continue still resumes the exact old chapter/score/seed without starting over',continue_old)
 def menu_continue_new():
  setup();click('new-confirm');click('fresh-start');api('t.show("menu");');assert page.locator('.continue-detail').inner_text().startswith('01');assert 'First Light' in page.locator('.continue-detail').inner_text();click('continue');assert snap()['level']==1 and snap()['score']==0
 check('After starting again, main-menu Continue clearly points to Chapter 1',menu_continue_new)
 def later_chapter():
  setup();click('new-confirm');click('fresh-start');before=data()['checkpoints']['classic'];api('t.show("menu");');click('map');assert page.locator('[data-stage="12"]').is_enabled();page.locator('[data-stage="12"]').click();assert api('return m.mode;')=='practice';assert snap()['level']==12;assert data()['checkpoints']['classic']==before;api('t.show("menu");');click('continue');assert snap()['level']==1;shot('fresh-journey-running')
 check('Restart → Chapters → Chapter 12 practice → Continue returns to the fresh campaign, with no relock',later_chapter)
 def locked():
  setup();click('new-confirm');click('fresh-start');api('t.show("menu");t.show("map");');page.locator('[data-wing="2"]').click();assert page.locator('[data-stage="13"]').is_disabled();assert data()['progress']['classic']['unlocked']==12;shot('later-chapters-still-unlocked')
 check('Starting again preserves existing unlocks but does not unlock unearned chapters',locked)
 def early_clear():
  setup();click('new-confirm');click('fresh-start');api('m.stageMissed=3;m.stageWrong=4;m.clearLevel();t.flush();t.skipOutcome();');d=data();assert d['progress']['classic']['unlocked']==12;assert d['progress']['classic']['stages']['1']['medal']==3;assert d['checkpoints']['classic']['nextLevel']==2;click('next');assert snap()['level']==2
 check('Replaying Chapter 1 with worse mastery advances the new checkpoint without downgrading old stars',early_clear)
 def practice_clear():
  setup();click('new-confirm');click('fresh-start');cp=data()['checkpoints']['classic'];api('t.show("menu");t.show("map");');page.locator('[data-stage="12"]').click();api('m.clearLevel();t.flush();t.skipOutcome();');assert data()['checkpoints']['classic']==cp;click('restart');assert api('return m.mode;')=='practice';assert snap()['level']==12;assert data()['checkpoints']['classic']==cp
 check('Late-chapter practice clear/retry never replaces the restarted campaign checkpoint',practice_clear)
 def completed():
  setup(cleared=48,done=True,cp=False);assert action('continue').count()==0;assert action('new-confirm').count()==1;assert action('endless').is_visible();click('new-confirm');assert 'will be replaced' not in page.locator('#fresh-run-change').inner_text();assert action('cancel-fresh').filter(has_text='Not now').count()==1;click('fresh-start');assert snap()['level']==1;assert data()['progress']['classic']['unlocked']==48;api('t.show("menu");');assert action('endless').is_visible();click('map');assert page.locator('[data-stage="48"]').is_enabled();page.locator('[data-stage="48"]').click();assert api('return m.mode;')=='practice';assert data()['checkpoints']['classic']['nextLevel']==1
 check('Completed campaign without a checkpoint can restart while all 48 chapters and Endless stay unlocked',completed)
 def cp48():
  setup(cleared=47);click('new-confirm');assert 'Chapter 48' in page.locator('#fresh-run-change').inner_text();click('fresh-start');assert data()['progress']['classic']['unlocked']==48
 check('A saved Chapter 48 run is replaced only after explicit confirmation, never its unlocks',cp48)
 def otherpace():
  setup();api('const base=m.checkpoint();for(const p of ["relaxed","maniac"]){t.setSettings({pace:p});t.start(771,3);s.setCheckpoint(m.checkpoint());}t.setSettings({pace:"classic"});t.show("menu");');before={k:v for k,v in data()['checkpoints'].items() if k!='classic'};click('new-confirm');click('fresh-start');assert {k:v for k,v in data()['checkpoints'].items() if k!='classic'}==before
 check('Restarting Classic leaves Relaxed and Maniac checkpoints untouched',otherpace)
 def change_pace():
  setup();click('settings');page.locator('[data-settings-tab="gameplay"]').click();page.locator('#pace-select').select_option('relaxed');page.get_by_role('button',name='Done',exact=True).click();page.wait_for_timeout(60);assert action('start').count()==1;assert action('new-confirm').count()==0;click('start');assert snap()['pace']=='relaxed';assert data()['checkpoints']['classic']['nextLevel']==12
 check('Entry choices follow the selected difficulty without affecting another difficulty’s progress',change_pace)
 def stale_pace():
  setup();before=data()['checkpoints'];click('new-confirm');api('t.setSettings({pace:"relaxed"});');click('fresh-start');assert view()=='menu';assert data()['checkpoints']==before
 check('An obsolete confirmation cannot silently restart a different difficulty',stale_pace)
 def from_over():
  setup();click('continue');api('m.danger=99;m.setBuffer("WRONGWORD");m.submit();t.flush();t.skipOutcome();');assert view()=='game-over';before=data();click('new-confirm');action('cancel-fresh').filter(has_text='Keep current').click();assert view()=='game-over';assert data()==before;assert action('retry-chapter').is_visible()
 check('Cancel from game-over returns to that result, retaining Retry and avoiding duplicate records',from_over)
 def from_records():
  setup();click('continue');page.locator('#typing-input').fill('BO');page.keyboard.press('Escape');api('t.show("records");');click('start');assert view()=='new-confirm';page.keyboard.press('Escape');assert view()=='records';click('back');assert view()=='pause';click('resume');assert page.locator('#typing-input').input_value()=='BO';assert snap()['level']==12
 check('Cancel from Records restores the originating screen and live paused input, not the menu',from_records)
 def multiple():
  setup();before=permanent();seeds=[]
  for i in range(5):
   click('new-confirm');click('fresh-start');seeds.append(snap()['seed']);assert permanent()==before;api('t.show("menu");')
  assert len(set(seeds))==5;evidence['restartSeeds']=seeds
 check('Five fresh journeys retain lifetime data and produce distinct randomized attempts',multiple)
 def export_import():
  setup();click('new-confirm');click('fresh-start');before=data();api('t.show("menu");t.show("records");')
  with page.expect_download() as dl:click('export-save')
  path=OUT/f'export-after-restart-{args.mode}.json';dl.value.save_as(str(path));exported=json.loads(path.read_text());assert exported['checkpoints']['classic']['nextLevel']==1;assert exported['progress']['classic']['unlocked']==12
  # A full app reinitialization from serialized storage, with the explicit memory adapter.
  other=b.new_page(viewport={'width':1366,'height':768});other.on('pageerror',lambda e:errors.append(str(e)));other.set_content(fixture(exported));other.wait_for_function('!!window.__TM_TEST__');assert other.locator('.continue-detail').inner_text().startswith('01');assert other.evaluate('__TM_TEST__.store.progress().unlocked')==12;assert other.evaluate('__TM_TEST__.store.data.chapterBests')==before['chapterBests'];other.locator('[data-action="continue"]').click();assert other.evaluate('__TM_TEST__.model.level')==1;other.close()
  setup(cleared=0,cp=False);click('records');page.locator('#save-file').set_input_files(str(path));page.wait_for_function('__TM_TEST__.store.progress().unlocked===12');click('back');assert page.locator('.continue-detail').inner_text().startswith('01');assert data()['chapterBests']==before['chapterBests'];assert data()['scoreChaseBests']==before['scoreChaseBests']
 check('Real export/import and full app relaunch from a serialized adapter preserve new checkpoint and old mastery',export_import)
 def legacy_import():
  setup();old=data();old.pop('chapterBests');old.pop('scoreChaseBests');path=OUT/f'old-style-save-{args.mode}.json';path.write_text(json.dumps(old));setup(cleared=0,cp=False);click('records');page.locator('#save-file').set_input_files(str(path));page.wait_for_function('__TM_TEST__.store.progress().unlocked===12');click('back');assert action('new-confirm').is_visible();click('new-confirm');click('fresh-start');assert data()['progress']['classic']['unlocked']==12
 check('Older compatible saves without the newer PB collections still expose safe restart',legacy_import)
 def invalid_import():
  setup();before=data();click('records');page.locator('#save-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"version":999}'});page.wait_for_timeout(80);assert data()==before;assert page.locator('#dialog-notice').is_visible()
 check('Invalid save import neither resets existing progress nor changes Continue',invalid_import)
 def denied():
  setup();old=api('return __qaStorageData.get("'+KEY+'");');before=permanent();api('__qaStorageDeny=true;');click('new-confirm');click('fresh-start');assert snap()['level']==1;assert permanent()==before;assert not api('return s.available;');assert api('return __qaStorageData.get("'+KEY+'");')==old;assert 'saving is unavailable' in page.locator('#toast').inner_text();api('__qaStorageDeny=false;')
 check('Save denial is disclosed; old persisted bytes survive and current-session unlocks remain usable',denied)
 def modal_still():
  setup();click('new-confirm');before=snap();page.wait_for_timeout(260);assert snap()==before;assert page.locator('#typing-input').is_disabled();page.keyboard.press('Escape')
 check('No clock, score or spell state moves while the restart question is open',modal_still)
 def no_modifiers():
  setup();click('new-confirm');before=data();page.keyboard.down('Control');page.keyboard.press('Escape');page.keyboard.up('Control');assert view()=='new-confirm' and data()==before;page.keyboard.press('Escape')
 check('Modified Escape does not accidentally accept or cancel the question',no_modifiers)
 def layout(w,h,complete=False):
  page.set_viewport_size({'width':w,'height':h});setup(cleared=47 if complete else 11,done=complete);page.wait_for_timeout(50)
  dims=page.locator('.menu-panel').evaluate('(e)=>({w:e.clientWidth,sw:e.scrollWidth,h:e.clientHeight,sh:e.scrollHeight})');assert dims['sw']<=dims['w']+1,dims
  for selector in ['[data-action="continue"]','[data-action="new-confirm"]','[data-action="map"]','[data-action="records"]','[data-action="how"]','[data-action="settings"]','[data-action="about"]']:
   el=page.locator(selector);el.scroll_into_view_if_needed();assert el.evaluate('''e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===e||e.contains(h);}'''),selector
  click('new-confirm');assert page.locator('.modal').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1');btn=action('fresh-start');btn.scroll_into_view_if_needed();assert btn.evaluate('''e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===e||e.contains(h);}''')
  if (w,h) in [(1366,768),(800,600)]:shot(f'confirmation-{w}x{h}'+('-complete' if complete else ''))
  evidence.setdefault('viewports',[]).append({'width':w,'height':h,'completedCampaign':complete,'menu':dims});page.keyboard.press('Escape')
 for w,h in [(1920,1080),(1440,900),(1366,768),(1280,720),(1024,768),(1024,600),(800,600),(960,540),(640,480),(2560,1080),(768,1024),(360,640)]:
  check(f'Returning menu and confirmation fit and hit-test at {w}×{h}',lambda w=w,h=h:layout(w,h))
 for w,h in [(1366,768),(1024,600),(800,600)]:check(f'Completed campaign menu retains every action at {w}×{h}',lambda w=w,h=h:layout(w,h,True))
 def contrast():
  page.set_viewport_size({'width':1366,'height':768});setup();api('t.setSettings({contrast:true,motion:false});');click('new-confirm');assert page.locator('#stage').get_attribute('class').find('high-contrast')>=0;assert 'Your library stays unlocked.' in page.locator('#fresh-progress-kept').inner_text();shot('higher-contrast-confirm');click('fresh-start');assert page.locator('#score-value').inner_text()=='0'
 check('High contrast and reduced motion retain the same readable and safe restart path',contrast)
 def labels():
  page.set_viewport_size({'width':1366,'height':768});setup();click('continue');api('m.words=[];m.inventory={fire:2,ice:2,slow:2,wind:2};m.danger=95;t.word("BOOK");t.flush();');page.wait_for_timeout(80)
  bounds=page.evaluate('''()=>['fire','ice','slow','wind'].map(p=>{const key=p==='wind'?'rescue-hint':'ready-'+p,l=document.getElementById(key).getBoundingClientRect(),b=document.querySelector('#spell-'+p+' .spell-book').getBoundingClientRect();return {power:p,labelBottom:l.bottom,bookTop:b.top,gap:b.top-l.bottom};})''');assert all(v['gap']>0 for v in bounds),bounds;evidence['aboveBookLabels']=bounds;shot('above-book-labels-retained')
 check('Last requested READY/RESCUE placement remains above, not on top of, the book art',labels)
 b.close()
report={'version':'3.6.2','scope':__doc__,'mode':args.mode,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'tests':rows,'passed':sum(x['status']=='PASS'for x in rows),'failed':sum(x['status']=='FAIL'for x in rows),'pageerrors':errors,'evidence':evidence}
(OUT/f'restart-{args.mode}.json').write_text(json.dumps(report,indent=2));print(json.dumps({'passed':report['passed'],'failed':report['failed'],'pageerrors':errors}));raise SystemExit(1 if report['failed'] or errors else 0)
