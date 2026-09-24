#!/usr/bin/env python3
"""v3.1 controlled mechanics/browser regressions against the built PLAY.html.
Real browser/input handlers; model setup and the simulation clock are controlled
through the existing, explicitly enabled in-memory diagnostic seam.
No mock implementation replaces any shipping rule or renderer.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
import hashlib
import argparse,json,time
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/qa';OUT.mkdir(parents=True,exist_ok=True)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--executable');args=ap.parse_args()
 shippingHash=hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest();rows=[];errors=[]
 with sync_playwright() as p:
  options={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
  if args.executable:options['executable_path']=args.executable
  browser=p.chromium.launch(**options);ctx=browser.new_context(viewport={'width':1440,'height':1040})
  page=ctx.new_page();page.set_default_timeout(5000);page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__')
  def api(js):return page.evaluate('(()=>{const t=__TM_TEST__;'+js+'})()')
  def state():return api('return t.snapshot();')
  def btn(a):return page.locator(f'#screen-layer [data-action="{a}"]').first
  def run(level=1,mode='campaign'):
   api(f"t.setSettings({{pace:'classic',sfx:false,music:false,resumeCountdown:false,motion:true,hints:false,muted:true}});t.start(877,{level},{json.dumps(mode)});t.freeze(true);t.model.spawnClock=100;t.model.words=[];t.flush();")
  def word(text='BOOK',kind='normal',y=300):return api(f"return t.word({json.dumps(text)},{json.dumps(kind)},550,{y});")
  def enter(text):page.locator('#typing-input').fill(text);page.locator('#typing-input').press('Enter')
  def clear():
   api("t.model.words=[];t.model.progress=t.model.config.quota-1;t.model.stageCorrect=t.model.config.quota-1;t.word('BOOK');t.flush();");enter('BOOK')
  def check(name,fn):
   at=time.time()
   try:fn();r={'name':name,'status':'PASS','seconds':round(time.time()-at,3)}
   except Exception as e:
    r={'name':name,'status':'FAIL','error':str(e),'seconds':round(time.time()-at,3)}
    try:page.screenshot(path=str(OUT/f'mechanics-failure-{len(rows)+1}.png'),timeout=5000)
    except Exception:pass
   rows.append(r);print(r['status'],name,r.get('error',''),flush=True)
  def ruleset():assert api('return t.info.ruleset;')=='typekeeper-3.2.0'
  check('Built browser contains the new versioned mechanics, not the v3 bundle',ruleset)
  def stored():
   run();api('t.model.inventory.fire=2;t.model.inventory.wind=1;t.flush();')
   for name in ['fire','wind']:
    assert page.locator('#ready-'+name).inner_text()=='STORED'
    assert 'cast-ready' not in page.locator('#spell-'+name).get_attribute('class')
    assert page.locator('#spell-'+name).get_attribute('aria-disabled')=='true'
   word();api('t.model.danger=12;t.flush();')
   for name in ['fire','wind']:assert page.locator('#ready-'+name).inner_text()=='READY'
  check('Book availability distinguishes STORED from actionable READY',stored)
  def queued():
   run();word();api('t.model.inventory.ice=2;t.model.inventory.slow=2;t.flush();')
   page.keyboard.press('2');page.keyboard.press('3');api('t.advance(3);')
   assert state()['effects']['slow']==8
   assert page.locator('#ready-slow').inner_text()=='QUEUED'
   assert 'SLOW · QUEUED' in page.locator('#effect-status').inner_text()
   assert '8.0s'==page.locator('#timer-slow').inner_text()
   assert 'Queued until ICE ends' in page.locator('#spell-slow').get_attribute('aria-label')
   page.keyboard.press('3');assert state()['inventory']['slow']==1
   api('t.advance(3.2);');assert page.locator('#ready-slow').inner_text()=='ACTIVE'
   assert 7.7<state()['effects']['slow']<7.9
  check('ICE plus SLOW queues visibly, rejects recast, then starts the saved duration',queued)
  def queued_pause():
   run();word();api('t.model.inventory.ice=t.model.inventory.slow=1;t.flush();');page.keyboard.press('3');page.keyboard.press('2');page.keyboard.press('Escape');before=state();api('t.advance(30);');assert state()==before;btn('resume').click();assert page.locator('#ready-slow').inner_text()=='QUEUED'
  check('Pause and resume preserve queued spells and their exact timers',queued_pause)
  def late():
   run();word(y=647.9);page.locator('#typing-input').fill('BOOK');api('t.advance(1/60);');danger=state()['danger'];page.keyboard.press('Enter')
   assert state()['missed']==1 and state()['wrong']==0 and state()['danger']==danger
   assert 'Just missed' in page.locator('#toast').inner_text();assert page.locator('#typing-input').input_value()==''
  check('Real Enter immediately after landing applies no second typo penalty',late)
  def late_expired():
   run();word(y=647.9);api('t.advance(.5);');danger=state()['danger'];enter('BOOK');assert state()['wrong']==1 and state()['danger']==danger+2
  check('The late-entry guard does not turn into permanent forgiveness',late_expired)
  def fire_input():
   run();word();api('t.model.inventory.fire=1;t.model.spawnClock=.01;t.flush();');page.locator('#typing-input').fill('BOOK');page.keyboard.press('1');assert page.locator('#typing-input').input_value()=='BOOK';page.keyboard.press('Enter');assert state()['wrong']==0;assert 'Already cleared' in page.locator('#toast').inner_text();api('t.advance(.4);');assert state()['words']==[]
  check('FIRE preserves typing and its cleared target is not penalized on immediate Enter',fire_input)
  def refocus():
   run();page.locator('#typing-input').fill('TA');page.locator('#spell-fire').focus();page.keyboard.type('LE');assert page.locator('#typing-input').input_value()=='TALE';assert state()['buffer']=='TALE'
  check('Typing after Tab lands on a spell returns to the word without dropping a letter',refocus)
  def refocus_selection():
   run();page.locator('#typing-input').fill('STXY');page.locator('#typing-input').evaluate('(e)=>e.setSelectionRange(2,3)');page.locator('#spell-ice').focus();page.keyboard.type('OR');assert page.locator('#typing-input').input_value()=='STORY'
  check('Returning from a spell with selected text preserves replacement editing',refocus_selection)
  def empty_flow():
   run();word();api('t.model.spawnClock=2.35;');enter('BOOK');assert abs(api('return t.model.spawnClock;')-.65)<1e-6;api('t.advance(.7);');assert state()['words']
  check('An empty playfield refills promptly after a correct word',empty_flow)
  def trial_rest():
   run(6);api('t.model.spawnClock=0;for(let i=0;i<5;i++){t.model.words=[];t.model.spawnClock=0;t.model.step();}t.flush();')
   assert 'BREATHE' in page.locator('#trial-indicator').inner_text();word('INK');enter('INK');assert state()['trialRest']
  check('Archive trial rest is signposted in the existing wave indicator',trial_rest)
  def quota():
   run();api('t.model.progress=t.model.config.quota-1;t.model.spawnClock=0;');word();api('t.advance(.2);');assert len(state()['words'])==1;enter('BOOK');assert state()['phase']=='level-clear';assert len(state()['words'])==0
  check('Final-word quota drains cleanly without spawning disposable extra cards',quota)
  def retry_initial():
   run();api('t.model.danger=99;');enter('TYPO');assert btn('retry-chapter').is_visible();assert api('return t.store.checkpoint("classic").retries;')==1
   btn('retry-chapter').click();assert state()['phase']=='playing' and state()['level']==1 and state()['score']==0 and state()['danger']==0 and state()['retries']==1
  check('Chapter-one failure offers Retry rather than forcing a fresh campaign',retry_initial)
  def retry_checkpoint():
   run();api('t.model.stageTime=10;t.model.time=10;t.model.danger=40;t.model.inventory.ice=2;');clear();cp=api('return t.store.checkpoint("classic");');btn('next').click();api('t.advance(.7);');original=state()['words'];enter(original[0]['text']);api('t.model.danger=99;');enter('TYPO');count=api('return t.store.records.length;');btn('retry-chapter').click()
   assert state()['score']==cp['score'] and state()['danger']==cp['danger'] and state()['inventory']==cp['inventory'];assert state()['retries']==1
   api('t.advance(.7);');assert state()['words']==original;assert api('return t.store.records.length;')==count
  check('Retry restores chapter resources and the identical opening word, without score farming',retry_checkpoint)
  def confirmation():
   run();api('t.model.danger=99;');enter('TYPO');cp=api('return t.store.checkpoint("classic");');btn('records').click();btn('start').click();assert page.get_by_role('heading',name='Start a new game?').is_visible();assert api('return t.store.checkpoint("classic");')==cp
   page.keyboard.press('Escape');assert btn('continue').is_visible()
  check('Play from post-defeat Records cannot silently replace the retry bookmark',confirmation)
  def continue_guide():
   run();api('t.show("menu");');cp=api('return t.store.checkpoint("classic");');btn('how').click();assert btn('continue').is_visible();btn('continue').click();assert state()['level']==cp['nextLevel'] and state()['phase']=='playing'
  check('How to play respects an existing Continue bookmark',continue_guide)
  def terminal():
   run(48);clear();score=state()['score'];api('t.show("next");t.show("next");');assert state()['level']==48 and state()['phase']=='level-clear' and state()['score']==score;assert btn('endless').is_visible()
  check('Finale rejects repeated next-chapter actions rather than leaking into chapter 49',terminal)
  def practice_scope():
   run(2,'practice');clear();api("t.store.add({score:999999,level:12,startLevel:12,pace:'classic',mode:'practice'});t.show('records');")
   page.locator('#records-mode').select_option('practice');assert page.locator('#records-chapter').input_value()=='2';assert '999,999' not in page.locator('.record-table').inner_text()
   page.locator('#records-chapter').select_option('12');assert '999,999' in page.locator('.record-table').inner_text()
  check('Practice records compare only the selected chapter',practice_scope)
  def mastery_reload():
   run();api("t.store.data.progress.classic={unlocked:1,stages:{}};t.start(5,1,'practice');t.freeze(true);");clear()
   assert api('return t.store.progress().stages[1].medal;')==3;assert api('return t.store.progress().stages[1].campaignClear;') is False;assert api('return t.store.progress().unlocked;')==1
   data=api('return t.store.exportData();');api('t.store.data.progress.classic={unlocked:1,stages:{}};');page.evaluate('(s)=>__TM_TEST__.store.importData(JSON.parse(s))',data);assert api('return t.store.progress().unlocked;')==1
   api("t.show('map');");assert '0 / 48 chapters complete' in page.locator('.atlas-total').inner_text()
  check('Practice stars survive save import without unlocking an uncleared campaign chapter',mastery_reload)
  def legacy():
   run();api("t.store.clearRecords();t.model.scoreRuleset='library-edition-2.0.0';t.model.score=990000;t.model.danger=99;");enter('TYPO');assert 'NEW PERSONAL BEST' not in page.locator('#screen-layer').inner_text();assert 'Legacy' in page.locator('#screen-layer').inner_text()
   btn('records').click();page.locator('#records-mode').select_option('campaign');assert page.locator('.empty-records').is_visible();page.locator('#records-mode').select_option('legacy');assert '990,000' in page.locator('.record-table').inner_text()
  check('Continued old-rule scores are clearly archived instead of claiming a new-rule best',legacy)
  def retire():
   run(49,'endless');word('INK');enter('INK');api('t.advance(.5);');score=state()['score'];before=api('return t.store.records.length;');page.keyboard.press('Escape');btn('quit').click();assert 'retired Endless run' in page.locator('#screen-layer').inner_text();btn('menu').click()
   assert api('return t.store.records.length;')==before+1;assert api('return t.store.records.some(r=>r.mode==="endless"&&r.retired&&r.score==='+str(score)+');')
   api('t.show("menu");');assert api('return t.store.records.length;')==before+1
  check('Ending Endless voluntarily records the score exactly once as retired',retire)
  def unavailable_save():
   run();clear();assert 'Export your save to keep your progress.' in page.locator('.fine-print').inner_text()
  check('A storage-blocked browser does not falsely claim chapter progress was persisted',unavailable_save)
  def held_next():
   run();clear();page.wait_for_timeout(300);btn('next').focus();page.keyboard.down('Enter');page.keyboard.down('Enter');page.keyboard.up('Enter');assert state()['level']==2 and state()['wrong']==0
  check('Holding Enter across a chapter transition does not advance twice or add a typo',held_next)
  def back_settings():
   run();word('ARCHIVE');page.locator('#typing-input').fill('ARC');page.keyboard.press('Escape');snapshot=state();btn('settings').click();page.locator('[data-settings-tab="gameplay"]').click();page.get_by_label('Difficulty',exact=True).select_option('maniac');btn('back').click();btn('resume').click()
   assert state()['pace']=='classic';assert state()['words']==snapshot['words'];assert state()['buffer']=='ARC';assert api('return t.settings().pace;')=='maniac'
  check('Changing next-run difficulty in a paused menu never changes the active board',back_settings)
  def feedback_banner():
   run();word();api('t.model.inventory.ice=t.model.inventory.slow=1;t.flush();');page.keyboard.press('2');page.keyboard.press('3')
   labels=api("const c=t.renderer.ctx,old=c.fillText,seen=[];c.fillText=function(text,...args){if(/CAST|QUEUED|WORD STREAK/.test(text))seen.push(text);return old.call(this,text,...args)};t.renderer.floaters.push({x:600,y:220,text:'8 WORD STREAK',color:'#fff',large:true,t:0,life:1.4});t.renderer.frame(performance.now()+100,1);c.fillText=old;return seen;")
   assert labels==['SLOW  QUEUED'],labels
  check('Concurrent spells and streaks share one non-overlapping feedback banner',feedback_banner)
  def typography_layout():
   run(36);api("t.model.inventory={fire:2,ice:1,slow:2,wind:1};t.model.danger=57;t.model.score=28460;t.model.progress=20;t.model.streak=16;t.model.pile=[{x:360,angle:.04},{x:630,angle:-.03},{x:830,angle:.05}];[['WHISPER','normal',370,222],['ARCHIVE','ice',800,300],['WONDER','normal',520,410],['CRYSTAL','bonus',790,520]].forEach(a=>t.word(...a));t.flush();")
   page.locator('#typing-input').fill('WON');page.keyboard.press('2');page.keyboard.press('3');page.wait_for_timeout(400)
   page.locator('#stage').screenshot(path=str(ROOT/'docs/screenshots/14-mechanics-gameplay.png'),animations='disabled',timeout=10000)
   assert page.locator('#viewport').bounding_box()['width']<=1440
  check('Unchanged playfield layout renders queued spell feedback without overflow',typography_layout)
  check('No unhandled JavaScript exceptions in the mechanics browser audit',lambda: (_ for _ in ()).throw(AssertionError(errors)) if errors else None)
  report={'shippingSHA256':shippingHash,'version':'3.2.0','scope':'Shipping standalone HTML in Chromium memory. State/clock setup uses explicit diagnostics. Real input, view and rule code. No HTTP/file navigation or human participants.','browser':browser.version,'passed':sum(r['status']=='PASS' for r in rows),'failed':sum(r['status']=='FAIL' for r in rows),'unhandledErrors':errors,'tests':rows}
  (OUT/'mechanics-browser-results.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k] for k in ['browser','passed','failed']},indent=2),flush=True);browser.close()
  if report['failed']:raise SystemExit(1)
if __name__=='__main__':main()
