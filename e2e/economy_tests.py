#!/usr/bin/env python3
"""v3.2.1 economy integration. Executes shipping PLAY.html in Chromium memory;
only the existing diagnostic access guard is enabled. Keyboard, DOM, input, renderer,
serialization, import/export and simulation are the actual application. Controlled
clocks/cards are fixtures, not human play or certified HTTP/platform testing.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
import argparse, hashlib, json, time
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'docs/qa'; SHOTS=ROOT/'docs/screenshots'

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--executable');args=ap.parse_args()
 OUT.mkdir(parents=True,exist_ok=True); SHOTS.mkdir(parents=True,exist_ok=True)
 rows=[];errors=[];evidence={}
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
  if args.executable:opts['executable_path']=args.executable
  browser=p.chromium.launch(**opts);page=browser.new_page(viewport={'width':1440,'height':1040},accept_downloads=True)
  page.set_default_timeout(6500);page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__')
  def api(js):return page.evaluate('(()=>{const t=__TM_TEST__;'+js+'})()')
  def snap():return api('return t.snapshot();')
  def btn(action):return page.locator(f'#screen-layer [data-action="{action}"]').first
  def run(level=1,mode='campaign'):
   api(f"t.setSettings({{pace:'classic',music:false,sfx:false,hints:false,muted:true,resumeCountdown:false,motion:true}});t.start(176,{level},{json.dumps(mode)});t.freeze(true);t.model.words=[];t.model.spawnClock=100;t.flush();")
  def enter(text):page.locator('#typing-input').fill(text);page.locator('#typing-input').press('Enter')
  def spawn():return api("t.model.words=[];t.model.spawn();t.flush();return {...t.model.words.at(-1)};")
  def clear():api("t.model.words=[];t.model.progress=t.model.config.quota-1;t.word('BOOK');t.flush();");enter('BOOK');page.locator('#result-score-value').wait_for(state='visible')
  def check(name,fn):
   at=time.time()
   try:fn();row={'name':name,'status':'PASS','seconds':round(time.time()-at,3)}
   except Exception as e:
    row={'name':name,'status':'FAIL','error':repr(e),'seconds':round(time.time()-at,3)}
    try:page.screenshot(path=str(OUT/f'economy-failure-{len(rows)+1}.png'))
    except Exception:pass
   rows.append(row);print(row['status'],name,row.get('error',''),flush=True)

  def version():assert api('return t.info.ruleset;')=='typekeeper-3.2.1'
  check('The shipped HTML contains the new economy module and correct ruleset',version)
  def empty():
   run();assert list(snap()['inventory'].values())==[0,0,0,0]
   for power in ['fire','ice','slow','wind']:
    assert page.locator('#stock-'+power+' i').count()==2
    assert page.locator('#ready-'+power).inner_text()=='COLLECT'
    assert page.locator('#count-'+power).inner_text()=='0/2'
  check('Fresh campaign renders zero books and exactly two capacity pips per spell',empty)
  def five():
   run()
   for _ in range(5):assert spawn()['kind']=='normal'
   assert list(snap()['inventory'].values())==[0,0,0,0]
  check('The first five actual card opportunities contain no tutorial resource flood',five)
  def first_book():
   run()
   for _ in range(6):w=spawn()
   assert w['kind']=='ice';assert snap()['inventory']['ice']==0
   enter(w['text']);assert snap()['inventory']['ice']==1
   assert page.locator('#ready-ice').inner_text()=='READY'
   assert 'just-ready' in page.locator('#spell-ice').get_attribute('class')
   assert page.locator('#stock-ice i.filled').count()==1
  check('The sixth card must be typed to earn ICE, with the preserved glow and readiness feedback',first_book)
  def quickcast():
   page.locator('#typing-input').fill('STORY');page.locator('#typing-input').evaluate('(e)=>e.setSelectionRange(1,3)');page.keyboard.press('2')
   assert snap()['inventory']['ice']==0;assert snap()['effects']['ice']==6;assert snap()['buffer']=='STORY'
   assert page.locator('#typing-input').evaluate('(e)=>[e.selectionStart,e.selectionEnd]')==[1,3]
  check('A scarce ICE charge still quick-casts for six seconds without losing typed selection',quickcast)
  def one():
   run();out=[]
   for _ in range(12):out.append(spawn()['kind'])
   assert [v for v in out if v!='normal']==['ice'];assert snap()['economy']['opportunities']==1
  check('Chapter-one spawn schedule contains one spell, not all four',one)
  def capacity():
   run()
   for _ in range(3):api("t.word('SNOW','ice');t.flush();");enter('SNOW')
   assert snap()['inventory']['ice']==2;assert snap()['correct']==3
   assert page.locator('#stock-ice i.filled').count()==2;assert page.locator('#count-ice').inner_text()=='2/2'
  check('Third pickup awards word points but cannot create a third charge or pip',capacity)
  def castcap():
   page.keyboard.press('2');assert snap()['inventory']['ice']==1
   assert page.locator('#stock-ice i.filled').count()==1
   page.keyboard.press('2');assert snap()['inventory']['ice']==1
  check('Capacity pips decrement correctly and an active recast does not waste the remaining charge',castcap)
  def power_strength():
   run();api("t.model.inventory={fire:1,ice:1,slow:1,wind:1};t.model.danger=91;t.word('BOOK');t.flush();")
   page.keyboard.press('3');page.keyboard.press('2');assert snap()['effects']=={'ice':6,'slow':8}
   assert page.locator('#ready-slow').inner_text()=='QUEUED'
   page.keyboard.press('4');assert snap()['danger']==0
   page.keyboard.press('1');assert not snap()['words'];assert snap()['progress']==0
  check('All four spell strengths and ICE/SLOW queuing remain unchanged',power_strength)
  def carry():
   run();api('t.model.economy.untilNext=3;t.model.economy.tutorialDone=true;t.model.inventory.wind=1;t.flush();');clear();btn('next').click()
   assert snap()['level']==2;assert snap()['economy']['untilNext']==3;assert snap()['inventory']['wind']==1
   assert spawn()['kind']=='normal';assert spawn()['kind']=='normal';assert spawn()['kind']!='normal'
  check('Next chapter carries the countdown and unused books rather than restarting the gift schedule',carry)
  def trial():
   run(5);api('t.model.economy.untilNext=10;');clear();btn('next').click();assert snap()['level']==6
   special=[]
   for i in range(1,21):
    if spawn()['kind'] in ['fire','ice','slow','wind']:special.append(i)
   assert special==[4,12,20];assert list(snap()['inventory'].values())==[0,0,0,0]
  check('Trial puts an earned opportunity in its first wave and every eight cards, with no free charges',trial)
  def pending():
   run(12);api('t.model.economy.untilNext=1;');assert spawn()['kind'] in ['fire','ice','slow','wind']
   before=snap()['economy'];api('t.model.inventory.fire=1;t.flush();');page.keyboard.press('1');assert snap()['economy']==before
  check('FIRE cannot farm replacement spells or reset the sparse schedule',pending)
  def pause():
   run();api("t.word('BOOK');t.flush();");page.locator('#typing-input').fill('BO');page.keyboard.press('Escape');before=snap()
   api('t.advance(10);');assert snap()==before;btn('resume').click();assert snap()['buffer']=='BO'
  check('Pause and resume preserve the economy counter and partial word',pause)
  def retry():
   run();first=[]
   for _ in range(6):first.append(spawn())
   api("t.model.score=999;t.model.inventory.ice=2;t.model.danger=99;t.flush();");enter('ZZZZ');btn('retry-chapter').wait_for(state='visible');btn('retry-chapter').click()
   assert snap()['score']==0;assert list(snap()['inventory'].values())==[0,0,0,0]
   second=[spawn() for _ in range(6)];assert [w['text'] for w in first]!=[w['text'] for w in second];assert [w['kind'] for w in first]==[w['kind'] for w in second]
  check('Retry changes vocabulary, retains the sixth-card reward, and cannot keep failed-attempt score or stock',retry)
  def practice():
   run(1,'practice');assert list(snap()['inventory'].values())==[1,1,1,1]
   assert snap()['mode']=='practice';assert snap()['economy']['tutorialDone']
  check('Practice retains its separately scored training kit, without a campaign tutorial reset',practice)
  def endless():
   run(49,'endless');assert list(snap()['inventory'].values())==[1,1,1,1]
   assert snap()['level']==49;assert api('return t.model.config.speed;')>135.96
  check('Endless keeps its independent starter kit and continues the late speed curve',endless)
  def endless_trial():
   run(54,'endless');special=[]
   for i in range(1,21):
    if spawn()['kind'] in ['fire','ice','slow','wind']:special.append(i)
   assert special==[4,12,20];assert list(snap()['inventory'].values())==[1,1,1,1]
  check('Endless trials use the same earned first-wave opportunities without extra free stock',endless_trial)
  def speed():
   expected={1:30.6,3:40.5,6:55.1,12:76,24:99,36:118.32,48:135.96}
   for n,speed in expected.items():
    run(n);w=spawn();assert abs(w['speed']-speed)<1e-8
   evidence['classicKnots']=expected
  check('Real spawned cards use the approved gentle-opening and late-chapter speeds',speed)
  def guide():
   run();api('t.show("how");');page.locator('.rules-details summary').click();text=page.locator('.rules-details').inner_text()
   assert 'Store up to two of each spell.' in text;assert 'Store up to three' not in text
  check('How to play communicates the actual two-charge limit without extra screen clutter',guide)
  def import_old():
   run(5);cp=api('return t.model.checkpoint();');cp['ruleset']='typekeeper-3.2.0';cp.pop('economy');cp['inventory']={'fire':3,'ice':3,'slow':2,'wind':1}
   payload={'version':3,'settings':{'volume':.34,'music':False},'checkpoints':{'classic':cp},'records':[{'score':12345,'level':5,'date':int(time.time()*1000),'pace':'classic','mode':'campaign','ruleset':'typekeeper-3.2.0'}]}
   api('t.show("records");');page.locator('#save-file').set_input_files({'name':'v32-save.json','mimeType':'application/json','buffer':json.dumps(payload).encode()})
   page.wait_for_function('__TM_TEST__.store.settings.volume===.34')
   got=api('return t.store.checkpoint("classic");');assert got['inventory']=={'fire':2,'ice':2,'slow':2,'wind':1};assert got['economy']['tutorialDone']
   page.locator('#records-mode').select_option('legacy');assert '12,345' in page.locator('.record-table').inner_text()
  check('Actual file import keeps prior scores in Legacy and migrates 3.2 books into the two-charge cap',import_old)
  def resume_old():
   api('t.show("menu");');btn('continue').click();assert snap()['inventory']['ice']==2
   assert api('return t.model.scoreRuleset;')=='typekeeper-3.2.0'
  check('Continuing a migrated run uses the new economy while retaining Legacy scoring provenance',resume_old)
  def export_new():
   api('t.show("records");')
   with page.expect_download() as dl:btn('export-save').click()
   data=json.loads(Path(dl.value.path()).read_text());assert data['appVersion']=='3.4.0'
   assert 'economy' in data['checkpoints']['classic'];assert data['checkpoints']['classic']['inventory']['ice']==2
  check('Real save export includes the sparse schedule and correct build version',export_new)
  def fresh():
   api('t.show("menu");t.show("new-confirm");');btn('fresh-start').click();api('t.freeze(true);')
   assert list(snap()['inventory'].values())==[0,0,0,0];assert api('return t.model.scoreRuleset;')=='typekeeper-3.2.1';assert snap()['economy']['untilNext']==6
  check('New game after migration starts empty under current scoring rules',fresh)
  def empty_glow():
   run();api("t.word('SNOW','ice');t.flush();");enter('SNOW');assert 'just-ready' in page.locator('#spell-ice').get_attribute('class')
   run();assert 'just-ready' not in page.locator('#spell-ice').get_attribute('class')
  check('A new empty campaign cannot inherit a previous run’s acquisition glow',empty_glow)
  def spent_glow():
   run();api("t.word('SNOW','ice');t.flush();");enter('SNOW');page.keyboard.press('2')
   assert snap()['inventory']['ice']==0;assert 'just-ready' not in page.locator('#spell-ice').get_attribute('class')
   assert page.locator('#ready-ice').inner_text()=='ACTIVE'
  check('Spending the last book clears acquisition glow while retaining the ACTIVE indicator',spent_glow)
  def noerrors():assert not errors,errors
  check('No unhandled JavaScript exceptions in the economy/browser audit',noerrors)

  # A controlled, genuine chapter-one capture with the actual sixth-card reward.
  run();api('t.model.spawnClock=.65;')
  for _ in range(5):
   w=api("let limit=0;while(!t.model.words.length&&limit++<1200)t.model.step();t.flush();return {...t.model.words[0]};")
   enter(w['text'])
  api("let limit=0;while(t.model.spawnedThisLevel<8&&limit++<1800)t.model.step();t.flush();")
  page.wait_for_timeout(350);page.locator('#stage').screenshot(path=str(SHOTS/'25-v321-sparse-opening.png'))
  evidence['openingSnapshot']=snap()
  evidence['audioSourceRetained']='Audio regression suites run separately; no audio re-authoring in this build.'
  report={'version':'3.2.1','scope':__doc__,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'browser':browser.version,'passed':sum(r['status']=='PASS' for r in rows),'failed':sum(r['status']=='FAIL' for r in rows),'unhandledErrors':errors,'tests':rows,'evidence':evidence}
  (OUT/'economy-browser-results.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k] for k in ['passed','failed','browser','unhandledErrors']},indent=2));browser.close()
  if report['failed'] or errors:raise SystemExit(1)
if __name__=='__main__':main()
