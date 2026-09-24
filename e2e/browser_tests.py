#!/usr/bin/env python3
"""Typekeeper v3.1 real-browser audit. Install optional requirements in e2e/.
Default: serve and test the actual HTTP build. --inline: test the embedded PLAY.html
with the local diagnostic guard explicitly enabled, for managed browsers that block
localhost. This fallback does NOT certify HTTP module loading or file:// navigation.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
import hashlib
import argparse,json,time,statistics,subprocess,urllib.request,sys
ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/'docs/qa'; REPORT.mkdir(exist_ok=True,parents=True)
SHOTS=ROOT/'docs/screenshots'; SHOTS.mkdir(exist_ok=True,parents=True)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--inline',action='store_true');ap.add_argument('--executable');ap.add_argument('--browser',choices=['chromium','firefox','webkit'],default='chromium');ap.add_argument('--url',default='http://127.0.0.1:4173');args=ap.parse_args()
 shippingHash=hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest();results=[];errors=[];server=None;perf={}
 if not args.inline:
  try:urllib.request.urlopen(args.url,timeout=1)
  except Exception:
   server=subprocess.Popen(['node','scripts/serve.mjs','--port','4173'],cwd=ROOT,stdout=subprocess.DEVNULL);time.sleep(.5)
 try:
  with sync_playwright() as p:
   opts={'headless':True}
   if args.executable:opts['executable_path']=args.executable
   if args.browser=='chromium':opts['args']=['--no-sandbox','--disable-dev-shm-usage']
   browser=getattr(p,args.browser).launch(**opts);ctx=browser.new_context(viewport={'width':1440,'height':1040},device_scale_factor=1,accept_downloads=True)
   page=ctx.new_page();page.set_default_timeout(4500);page.on('pageerror',lambda e:errors.append(str(e)))
   if args.inline:page.set_content(inline_fixture(ROOT),wait_until='load')
   else:page.goto(args.url+'/?test=1',wait_until='networkidle')
   page.wait_for_function('!!window.__TM_TEST__');page.wait_for_timeout(450)
   def api(js):return page.evaluate('(()=>{const t=window.__TM_TEST__;'+js+'})()')
   def snap():return api('return t.snapshot();')
   def run(level=1,mode='campaign',freeze=True):
    api(f"t.setSettings({{pace:'classic',motion:true,spellPulse:true,sfx:false,contrast:false,resumeCountdown:false,muted:false}});t.audio.setBackground(false);t.start(123,{level},{json.dumps(mode)});t.freeze({str(freeze).lower()});t.model.words=[];t.model.spawnClock=100;t.flush();")
   def word(text='BOOK',kind='normal',x=550,y=330):return api(f'return t.word({json.dumps(text)},{json.dumps(kind)},{x},{y});')
   def typeword(text):
    page.locator('#typing-input').focus();page.locator('#typing-input').press_sequentially(text,delay=1);page.keyboard.press('Enter')
   def button(action):return page.locator(f'#screen-layer [data-action="{action}"]')
   def shot(name):
    print('SCREENSHOT',name,flush=True)
    page.wait_for_timeout(350);page.locator('#stage').screenshot(path=str(SHOTS/(name+'.png')),animations='disabled',timeout=10000)
   def check(name,fn):
    at=time.time()
    try:fn();r={'name':name,'status':'PASS','seconds':round(time.time()-at,3)}
    except Exception as e:
     r={'name':name,'status':'FAIL','error':str(e),'seconds':round(time.time()-at,3)}
     try:page.screenshot(path=str(REPORT/f'failure-{len(results)+1}.png'))
     except Exception:pass
    results.append(r);print(r['status'],name,r.get('error',''),flush=True)
   def finish_stage():
    api("t.model.words=[];t.model.progress=t.model.config.quota-1;t.model.stageCorrect=t.model.config.quota-1;t.word('BOOK');t.flush();")
    typeword('BOOK')
   def menu():api("t.show('menu');")

   def test_menu():
    assert button('start').is_visible();assert button('map').is_visible();assert page.locator('#loading').is_hidden()
    assert api('return t.info.stages;')==48;assert api('return t.info.dictionaryWords;')==746
   check('Production title loads all artwork and accessible primary controls',test_menu)
   shot('01-title')
   def guide():
    button('how').click();assert page.locator('.power-guide-item').count()==4
    assert page.locator('.guide-hotkey').all_inner_texts()==['1','2','3','4']
    button('start').click();assert snap()['phase']=='playing';assert page.locator('#typing-input').evaluate('(e)=>document.activeElement===e')
   check('Instructions visibly explain all quick-cast keys and start keyboard play',guide)
   def normalization():
    run();word();page.keyboard.type('book');assert snap()['buffer']=='BOOK';assert len(snap()['words'])==1
    page.keyboard.press('Enter');assert snap()['score']==40;assert snap()['correct']==1;assert page.locator('#score-value').inner_text()=='40'
   check('Lowercase typing, live matching, Enter submission, and score HUD',normalization)
   def editing():
    run();word('STORY');page.keyboard.type('STXY');page.locator('#typing-input').evaluate('(e)=>e.setSelectionRange(2,3)');page.keyboard.type('OR');assert snap()['buffer']=='STORY'
    page.keyboard.press('Backspace');page.keyboard.type('R');page.keyboard.press('Enter');assert snap()['correct']==1
   check('Caret selection and Backspace preserve native word editing',editing)
   def enter_repeat():
    run();word();page.keyboard.type('BOOK');page.keyboard.down('Enter');page.keyboard.down('Enter');page.keyboard.up('Enter');assert snap()['score']==40;assert snap()['wrong']==0
   check('Repeated Enter does not duplicate completion or score',enter_repeat)
   def wrong():
    run();word();typeword('TYPO');assert snap()['danger']==2;assert snap()['wrong']==1;assert snap()['buffer']==''
   check('Invalid submission applies one visible two-percent penalty',wrong)
   def rapid():
    run()
    for i in range(10):word('INK');typeword('INK')
    assert snap()['correct']==10;assert snap()['wrong']==0;assert snap()['streak']==10
   check('Rapid real keyboard sequence does not drop or double submissions',rapid)
   def books():
    run()
    for text,power in [('FABLE','fire'),('FROST','ice'),('CLOCK','slow'),('BREEZE','wind')]:word(text,power);typeword(text)
    word('INK');api('t.model.danger=15;t.flush();')
    for power in ['fire','ice','slow','wind']:
     slot=page.locator('#spell-'+power);assert 'cast-ready' in slot.get_attribute('class');assert 'just-ready' in slot.get_attribute('class')
     assert page.locator('#ready-'+power).inner_text()=='READY';assert page.locator('#count-'+power).inner_text()=='1'
     assert slot.get_attribute('aria-keyshortcuts') in ['1','2','3','4']
   check('All four collected spell books gain stock, READY labels, and acquisition animation',books)
   def hotkeys():
    for key,power in [('1','fire'),('2','ice'),('3','slow'),('4','wind')]:
     run();word();api('t.model.inventory={fire:2,ice:2,slow:2,wind:2};t.model.danger=65;t.flush();')
     page.keyboard.type('STORY');page.locator('#typing-input').evaluate('(e)=>e.setSelectionRange(1,3)');page.keyboard.press(key)
     assert snap()['inventory'][power]==1;assert snap()['buffer']=='STORY';assert page.locator('#typing-input').input_value()=='STORY'
     assert page.locator('#typing-input').evaluate('(e)=>[e.selectionStart,e.selectionEnd]')==[1,3]
   check('Keys 1–4 cast each spell once and preserve partial word and selected range',hotkeys)
   def numpad():
    run();word();api('t.model.inventory.ice=2;t.flush();');page.keyboard.type('BO');page.keyboard.press('Numpad2');assert snap()['effects']['ice']==6;assert snap()['buffer']=='BO'
   check('Numeric keypad uses the same quick-cast bindings',numpad)
   def repeated_digit():
    run();word();api('t.model.inventory.ice=3;t.flush();');page.keyboard.down('2');page.keyboard.down('2');page.keyboard.up('2');assert snap()['inventory']['ice']==2
   check('Held spell shortcut consumes only one book',repeated_digit)
   def modified_digit():
    run();word();api('t.model.inventory.ice=2;t.flush();');page.locator('#typing-input').dispatch_event('keydown',{'key':'2','code':'Digit2','ctrlKey':True});assert snap()['inventory']['ice']==2
    page.locator('#typing-input').dispatch_event('keydown',{'key':'@','code':'Digit2','shiftKey':True});assert snap()['inventory']['ice']==2
   check('Browser modifier shortcuts do not activate spells',modified_digit)
   def click_cast():
    run();word();api('t.model.inventory.fire=2;t.flush();');page.keyboard.type('LIB');page.locator('#spell-fire').click();assert not snap()['words'];assert snap()['buffer']=='LIB';assert snap()['inventory']['fire']==1
    assert page.locator('#typing-input').evaluate('(e)=>document.activeElement===e')
   check('Clicking a spell casts and returns focus without erasing input',click_cast)
   def unavailable():
    run();page.keyboard.type('BOOK');page.keyboard.press('2');assert snap()['buffer']=='BOOK';assert snap()['inventory']['ice']==0;assert snap()['wrong']==0;assert page.locator('#toast').inner_text()
   check('Empty inventory produces feedback without a penalty or lost word',unavailable)
   def no_waste():
    run();api('t.model.inventory.fire=2;t.model.inventory.wind=2;t.flush();');page.keyboard.press('1');page.keyboard.press('4');assert snap()['inventory']['fire']==2;assert snap()['inventory']['wind']==2
   check('Empty-field FIRE and empty-pile WIND do not waste inventory',no_waste)
   def ice():
    run();word();api('t.model.inventory.ice=2;t.flush();');page.keyboard.press('2');assert page.locator('#ready-ice').inner_text()=='ACTIVE';assert '6.0' in page.locator('#timer-ice').inner_text()
    y=snap()['words'][0]['y'];api('t.advance(1);');assert snap()['words'][0]['y']==y;page.keyboard.press('2');assert snap()['inventory']['ice']==1
    api('t.advance(5.1);');assert page.locator('#ready-ice').inner_text()=='READY';assert 'cast-ready' in page.locator('#spell-ice').get_attribute('class')
   check('ICE freezes, shows countdown, rejects active recast, and returns to READY',ice)
   def slow():
    run();word();api('t.model.inventory.slow=2;t.model.spawnClock=9;t.flush();');y=snap()['words'][0]['y'];speed=snap()['words'][0]['speed'];page.keyboard.press('3');api('t.advance(1);')
    assert abs(snap()['words'][0]['y']-y-speed*.42)<.1;assert api('return t.model.spawnClock;')>8.2
    assert page.locator('#ready-slow').inner_text()=='ACTIVE';page.keyboard.press('3');assert snap()['inventory']['slow']==1
   check('SLOW reduces movement and arrivals while displaying active time',slow)
   def pressure():
    run()
    for value,state in [(0,'calm'),(25,'focused'),(50,'worried'),(75,'alarmed'),(90,'critical')]:
     api(f't.model.danger={value};t.flush();');page.wait_for_timeout(250)
     assert page.locator('#stage').get_attribute('data-pressure')==state;assert api('return t.performance().expression;')==state
   check('Five live paper-pile bands drive distinct Storykeeper expression assets',pressure)
   def wind():
    run();api('t.model.danger=95;t.model.inventory.wind=1;t.flush();');assert page.locator('#rescue-hint').is_visible();assert '4' in page.locator('#rescue-hint').inner_text()
    page.keyboard.type('WON');page.keyboard.press('4');assert snap()['danger']==0;assert snap()['buffer']=='WON';assert page.locator('#rescue-hint').is_hidden()
    page.wait_for_timeout(1800);assert api('return t.performance().expression;')=='calm'
   check('Critical WIND rescue hint, pile clearance, relief, and recovery are synchronized',wind)
   def reduced():
    run();api('t.model.inventory.ice=1;t.model.danger=80;t.setSettings({motion:false,spellPulse:false});t.flush();');page.wait_for_timeout(250)
    assert api('return t.performance().expression;')=='alarmed';assert 'no-spell-pulse' in page.locator('#stage').get_attribute('class')
    assert page.locator('#ready-ice').inner_text()=='READY';assert page.locator('#spell-ice .spell-aura').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
   check('Reduced motion removes ready animation without removing status or expressions',reduced)
   def pause():
    run();word();api('t.model.inventory.ice=1;t.flush();');page.keyboard.press('2');page.keyboard.type('BO');page.keyboard.press('Escape');s=snap();api('t.advance(10);');assert snap()['effects']==s['effects'];assert snap()['time']==s['time'];assert snap()['phase']=='paused'
    page.keyboard.press('Escape');assert snap()['phase']=='playing';assert snap()['buffer']=='BO'
   check('Escape pause preserves word, falling state, and magic timers',pause)
   def focusloss():
    run();page.evaluate('window.dispatchEvent(new Event("blur"))');assert snap()['phase']=='paused';assert 'while you were away' in page.locator('#screen-layer').inner_text()
   check('Window focus loss pauses safely with an explicit resume action',focusloss)
   def collision():
    run();api('t.model.inventory.fire=1;t.flush();');word('FIRE');typeword('FIRE');assert snap()['correct']==1;assert snap()['inventory']['fire']==1
   check('Typed FIRE resolves a real FIRE word before attempting a spell command',collision)
   def chapter():
    run();api('t.model.stageTime=20;t.model.time=20;t.model.inventory.wind=2;t.model.danger=31;t.flush();');finish_stage();assert snap()['phase']=='level-clear'
    assert page.locator('.medal-stars .earned').count()==3;assert api('return t.store.checkpoint("classic").nextLevel;')==2
    assert api('return t.store.progress("classic").stages[1].medal;')==3;assert snap()['pressure']=='celebrate';page.wait_for_timeout(300);assert api('return t.performance().expression;')=='celebrate'
    score=snap()['score'];button('next').click();assert snap()['level']==2;assert snap()['danger']==31;assert snap()['inventory']['wind']==2;assert snap()['score']==score;assert snap()['phase']=='playing'
   check('Stage completion awards stars, celebrates, bookmarks, and carries resources',chapter)
   def bookmark():
    run();api('t.model.score=450;t.model.danger=42;t.model.inventory.ice=2;t.model.time=18;t.model.stageTime=18;');finish_stage();score=snap()['score'];menu();assert button('continue').is_visible();button('continue').click()
    assert snap()['level']==2;assert snap()['score']==score;assert snap()['danger']==42;assert snap()['inventory']['ice']==2
   check('Continue restores a real stage-boundary bookmark rather than resetting the run',bookmark)
   def confirm_bookmark():
    menu();cp=api('return t.store.checkpoint("classic");');assert cp is not None
    button('records').click();button('start').click();assert page.get_by_role('heading',name='Start a new game?').is_visible()
    page.keyboard.press('Escape');assert api('return t.store.checkpoint("classic");')==cp;assert button('continue').is_visible()
   check('Starting over from records protects an existing bookmark with confirmation',confirm_bookmark)
   def atlas():
    menu();button('map').click();assert page.locator('.wing-tabs button').count()==8;assert page.locator('.stage-tile').count()==6
    assert not page.locator('[data-stage="1"]').is_disabled();assert page.locator('[data-stage="6"]').is_disabled()
    page.locator('[data-wing="7"]').click();assert 'Eternal' in page.locator('.wing-heading').inner_text();assert page.locator('.stage-tile[disabled]').count()==6
    page.keyboard.press('Escape');assert page.locator('#screen-layer').get_attribute('data-screen')=='menu'
   check('Eight-wing atlas shows medals, stage requirements, and genuine locked stages',atlas)
   def practice():
    menu();button('map').click();page.locator('[data-wing="0"]').click();page.locator('[data-stage="1"]').click();api('t.freeze(true);t.model.spawnClock=100;');assert snap()['mode']=='practice';assert all(v==1 for v in snap()['inventory'].values())
    unlocked=api('return t.store.progress("classic").unlocked;');finish_stage();assert api('return t.store.progress("classic").unlocked;')==unlocked;assert button('next').count()==0
    assert api('return t.store.records.some(r=>r.mode==="practice");');button('restart').click();assert snap()['mode']=='practice';assert snap()['level']==1
   check('Atlas practice grants a starter kit and stores a separate one-stage result',practice)
   def trial():
    run(6);assert page.locator('#trial-indicator').is_visible();assert 'TRIAL' in page.locator('#trial-indicator').inner_text();assert snap()['info']['trial']
   check('Archive trials visibly label their wave-based stage rule',trial)
   def final():
    run(48);finish_stage();assert page.get_by_role('heading',name='The library is yours.').is_visible();assert api('return t.store.records.some(r=>r.mode==="campaign"&&r.victory);')
    button('endless').click();assert snap()['level']==49;assert snap()['mode']=='endless';assert snap()['score']==0
   check('Stage 48 has a campaign finale and unlocks a separate endless run',final)
   def defeat():
    run();word();typeword('BOOK');api('t.model.danger=99;');before=api('return t.store.records.length;');typeword('WRONG');assert snap()['phase']=='game-over';page.wait_for_timeout(300);assert api('return t.performance().expression;')=='defeated'
    api('t.flush();t.flush();');assert api('return t.store.records.length;')==before+1;button('retry-chapter').click();assert snap()['level']==1;assert snap()['danger']==0;assert snap()['score']==0;assert all(v==0 for v in snap()['inventory'].values())
   check('Defeat expression, single result save, and clean restart are connected',defeat)
   def settings_test():
    menu();button('settings').click();page.locator('[data-settings-tab=display]').click();page.get_by_role('switch',name='Ambient animation',exact=True).click();assert 'reduced-motion' in page.locator('#stage').get_attribute('class')
    page.get_by_role('switch',name='Spell-ready pulse',exact=True).click();assert 'no-spell-pulse' in page.locator('#stage').get_attribute('class')
    page.locator('[data-settings-tab=gameplay]').click();page.get_by_label('Difficulty',exact=True).select_option('relaxed');button('back').last.click();button('start').click();assert snap()['pace']=='relaxed';api('t.setSettings({pace:"classic",motion:true,spellPulse:true});')
   check('Settings keep pulse and animation controls independent and apply pace to new runs',settings_test)
   def focus_trap():
    menu();button('settings').click();button('back').last.focus();page.keyboard.press('Tab');assert page.get_by_role('button',name='Close',exact=True).evaluate('(e)=>document.activeElement===e');page.keyboard.press('Shift+Tab');assert button('back').last.evaluate('(e)=>document.activeElement===e')
   check('Modal keyboard focus cycles within the visible controls',focus_trap)
   def audio_test():
    run();api('t.setSettings({sfx:true});');page.locator('#sound-button').click();assert api('return t.audioState().muted;') is True;page.locator('#sound-button').click();assert api('return t.audioState().muted;') is False;page.wait_for_function('__TM_TEST__.audioState().state === \"running\"');assert api('return t.audioState().state;')=='running'
   check('Gesture-unlocked sound bus obeys mute and unmute controls',audio_test)
   def records():
    menu();button('records').click();assert 'LOCAL' in page.locator('#screen-layer').inner_text().upper();page.locator('#records-mode').select_option('practice');assert page.locator('.record-table tbody tr').count()>=1
    page.locator('[data-period="today"]').click();assert page.locator('[data-period="today"]').get_attribute('aria-pressed')=='true'
    page.locator('#records-mode').select_option('campaign');page.locator('[data-period="week"]').click();assert page.locator('.record-table tbody tr').count()>=1
   check('Hall of records filters real scores by mode, pace, and time period',records)
   def export_import():
    with page.expect_download() as pending:button('export-save').click()
    download=pending.value;target=REPORT/'test-save.json';download.save_as(str(target));data=json.loads(target.read_text());assert data['version']==3
    before=api('return t.store.records.length;');page.locator('#save-file').set_input_files(str(target));page.wait_for_timeout(300);assert api('return t.store.records.length;')==before;assert 'imported' in page.locator('#toast').inner_text()
   check('Save export and file-input import round-trip without duplicate records',export_import)
   def malformed_import():
    page.locator('#save-file').set_input_files({'name':'broken.json','mimeType':'application/json','buffer':b'{not JSON'});page.wait_for_timeout(200);assert 'error' in page.locator('#toast').get_attribute('class')
   check('Malformed save file produces a contained error without losing current data',malformed_import)
   def clear_records():
    count=api('return t.store.records.length;');button('clear-records').click();button('records').click();assert api('return t.store.records.length;')==count
    progress=api('return t.store.progress("classic");');button('clear-records').click();button('confirm-clear').click();assert api('return t.store.records.length;')==0;assert api('return t.store.progress("classic");')==progress
   check('Destructive score clear requires confirmation and leaves mastery progress intact',clear_records)
   def imported_new_session():
    save=(REPORT/'test-save.json').read_text();new=ctx.new_page()
    if args.inline:new.set_content(inline_fixture(ROOT),wait_until='load')
    else:new.goto(args.url+'/?test=1',wait_until='networkidle')
    new.wait_for_function('!!window.__TM_TEST__');new.evaluate('(s)=>{__TM_TEST__.store.importData(JSON.parse(s));__TM_TEST__.show("records");}',save)
    assert new.evaluate('__TM_TEST__.store.records.length')>0;assert new.evaluate('__TM_TEST__.store.progress("classic").stages[1].medal')==3;new.close();page.bring_to_front()
   check('Exported save restores genuine records and stars in a fresh document',imported_new_session)
   def responsive():
    menu();page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(150);r=page.evaluate('({w:document.documentElement.scrollWidth,v:innerWidth,r:document.querySelector("#viewport").getBoundingClientRect().toJSON()})');assert r['w']<=r['v'];assert abs(r['r']['width']/r['r']['height']-4/3)<.01;page.set_viewport_size({'width':1440,'height':1040})
   check('Narrow viewport preserves the 4:3 composition without horizontal overflow',responsive)
   def fit_cards():
    run();values=api("const words=['CLOCKWORK','EXTRAORDINARY','INTERNATIONAL','MOMENTUM','WONDER','WILLOW','MMWW'];let out=[];for(const text of words){for(const kind of ['normal','fire']){t.word(text,kind);let w=t.model.words.at(-1);const c=t.renderer.ctx;c.font=`bold ${text.length>15?22:text.length>12?24:27}px Georgia`;out.push({text,kind,measured:c.measureText(text).width,width:w.width});}}return out;")
    assert all(x['measured']+22+(26 if x['kind']=='fire' else 0)<=x['width'] for x in values),values
   check('Wide word cards retain measurable text padding with live serif typography',fit_cards)
   def restart_expression():
    run();api("t.model.danger=90;t.model.inventory.wind=1;t.cast('wind');t.start(321);t.freeze(true);t.flush();");page.wait_for_timeout(250);assert api('return t.performance().expression;')=='calm'
   check('A new run clears WIND relief and every previous facial reaction',restart_expression)
   def endless_restart():
    run(49,'endless');api('t.model.danger=99;');typeword('WRONG');button('restart').click();assert snap()['mode']=='endless';assert snap()['level']==49;assert snap()['score']==0
   check('An endless-mode restart remains endless rather than changing game modes',endless_restart)
   def texture_budget():
    run();usage=api("for(let width=112;width<=410;width+=3){for(const kind of ['normal','fire','ice','slow','wind','bonus'])t.renderer.cardTexture(width,kind);}return t.performance();");assert usage['textureCache']<=96;assert usage['textureBytes']<=32*1024*1024
   check('Long-session word-card texture cache remains within a 32 MiB budget',texture_budget)
   def no_errors():assert not errors,errors
   check('No unhandled application JavaScript errors during the interaction audit',no_errors)

   # Performance: real renderer with 12 synthetic simultaneous cards, two effects.
   run(24);api('t.model.spawnClock=100;t.model.inventory.ice=1;t.model.inventory.slow=1;t.model.danger=76;t.setSettings({motion:true,sfx:false});')
   for i in range(12):word(['LIBRARY','WONDER','ARCHIVE','STORIES'][i%4],['normal','fire','ice','slow','wind','bonus'][i%6],325+(i%4)*170,225+(i//4)*138)
   api("t.cast('ice');t.cast('slow');t.freeze(false);")
   page.wait_for_timeout(2000) # Warm textures/layout before the declared steady-state sample.
   perf=page.evaluate('''() => new Promise(resolve=>{const frame=[],draw=[];let last=performance.now();function loop(now){frame.push(now-last);last=now;draw.push(__TM_TEST__.performance().drawMs);if(frame.length<180)requestAnimationFrame(loop);else resolve({frameMs:frame,drawMs:draw});}requestAnimationFrame(loop);})''')
   print('PERFORMANCE SAMPLE RECEIVED',len(perf['frameMs']),flush=True)
   perf['averageFPS']=round(1000/statistics.mean(perf['frameMs'][1:]),2);perf['p95FrameMs']=round(sorted(perf['frameMs'][1:])[int(179*.95)],2);perf['medianDrawMs']=round(statistics.median(perf['drawMs']),2)
   # Produce only actual running-application screenshots with clearly controlled scenes.
   run(18);api("t.setSettings({motion:true,contrast:false});t.model.score=24780;t.model.progress=13;t.model.danger=78;t.model.time=292;t.model.correct=230;t.model.correctCharacters=1390;t.model.wrong=6;t.model.streak=18;t.model.bestStreak=27;t.model.inventory={fire:2,ice:2,slow:1,wind:2};t.model.words=[];t.model.pile=Array.from({length:7},(_,i)=>({id:i,x:290+i*93,angle:(i%3-1)*.04}));t.flush();")
   for w,k,x,y in [('WHISPER','normal',412,235),('GARDEN','normal',763,282),('MYSTERY','bonus',586,357),('FABLE','fire',340,439),('CRYSTAL','ice',808,438),('WONDER','normal',553,535),('MEMORY','wind',836,590)]:word(w,k,x,y)
   page.locator('#typing-input').fill('WON');page.wait_for_timeout(4400);shot('02-gameplay-ready')
   page.keyboard.press('2');page.wait_for_timeout(200);shot('03-ice-active')
   api('t.model.effects={ice:0,slow:0};t.model.danger=95;t.flush();');page.wait_for_timeout(800);shot('04-critical')
   menu();api("for(let n=1;n<=18;n++)t.store.completeStage('classic',{level:n,medal:n%5===0?2:3,stageScore:1500+n*80,wpm:42+n,accuracy:98});t.show('map');");page.locator('[data-wing="2"]').click();shot('05-atlas')
   menu();api("t.show('how');");shot('06-guide');menu();api("t.show('settings');");shot('07-settings')
   run(18);api('t.model.score=24600;t.model.stageTime=56;t.model.time=300;t.model.stageCharacters=285;');finish_stage();shot('08-stage-clear')
   menu();api("t.store.importData("+(REPORT/'test-save.json').read_text()+");t.show('records');");page.locator('#records-mode').select_option('campaign');shot('09-records')
   report={'shippingSHA256':shippingHash,'date':time.strftime('%Y-%m-%d',time.gmtime()),'mode':'embedded PLAY.html; diagnostic guard enabled in memory' if args.inline else 'HTTP ES-module build','browser':args.browser,'browserVersion':browser.version,'viewport':{'width':1440,'height':1040},'tests':results,'passed':sum(r['status']=='PASS' for r in results),'failed':sum(r['status']=='FAIL' for r in results),'pageErrors':errors,'performance':{**perf,'warmupSeconds':2,'sampleFrames':180},'limits':['Synthetic controlled states are used for deterministically testing transitions and screenshots.','Headless performance is not a guarantee on real Macs, phones, or all GPUs.','Browser navigation to localhost/file URLs may be unavailable; inline mode does not validate these launch paths.','A fresh-document save import is tested; in inline mode actual browser localStorage persistence is not available.']}
   (REPORT/f'browser-results-{args.browser}.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k] for k in ['mode','browserVersion','passed','failed']},indent=2));print('PERFORMANCE',perf['averageFPS'],perf['p95FrameMs'],perf['medianDrawMs'])
   browser.close()
 finally:
  if server:server.terminate()
 return 1 if any(r['status']=='FAIL' for r in results) else 0
if __name__=='__main__':sys.exit(main())
