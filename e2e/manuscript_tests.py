#!/usr/bin/env python3
"""Shipping v3.3.1 standalone browser tests; controlled inputs, not human playtests.
The diagnostic guard only is enabled by inline_fixture. No model/render/audio
function is replaced. Local HTTP navigation is blocked in the authoring environment.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
import argparse,json,time,hashlib
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/qa';SHOTS=ROOT/'docs/screenshots/v3.3.1'

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--executable');args=ap.parse_args();OUT.mkdir(exist_ok=True);SHOTS.mkdir(parents=True,exist_ok=True)
 rows=[];errors=[];evidence={}
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
  if args.executable:opts['executable_path']=args.executable
  browser=p.chromium.launch(**opts);page=browser.new_page(viewport={'width':1366,'height':768},device_scale_factor=1)
  page.set_default_timeout(6500);page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__')
  def api(js):return page.evaluate('(()=>{const t=__TM_TEST__;'+js+'})()')
  def snap():return api('return t.snapshot();')
  def visual():return api('return t.visual();')
  def btn(a):return page.locator(f'#screen-layer [data-action="{a}"]').first
  def run(level=1,mode='campaign'):
   api(f"t.setSettings({{pace:'classic',music:false,sfx:false,hints:false,muted:true,motion:true,detailedHUD:false,typingShimmer:true,spellPulse:true,resumeCountdown:false}});t.audio.setBackground(false);t.start(188,{level},{json.dumps(mode)});t.freeze(true);t.model.words=[];t.model.spawnClock=100;t.flush();")
  def word(text='LIBRARY',kind='normal',x=550,y=340):return api(f'return t.word({json.dumps(text)},{json.dumps(kind)},{x},{y});')
  def enter(text):page.locator('#typing-input').fill(text);page.locator('#typing-input').press('Enter')
  def ready_result():page.locator('#result-score-value').wait_for(state='visible')
  def clear():api("t.model.words=[];t.model.progress=t.model.config.quota-1;t.word('INK');t.flush();");enter('INK')
  def check(name,fn):
   at=time.monotonic()
   try:fn();row={'name':name,'status':'PASS','seconds':round(time.monotonic()-at,3)}
   except Exception as e:
    row={'name':name,'status':'FAIL','error':repr(e),'seconds':round(time.monotonic()-at,3)}
    try:page.screenshot(path=str(OUT/f'manuscript-failure-{len(rows)+1}.png'),timeout=5000)
    except Exception:pass
   rows.append(row);print(row['status'],name,row.get('error',''),flush=True)
  def identity():
   assert api('return t.info.version;')=='3.4.0';assert api('return t.info.ruleset;')=='typekeeper-3.2.1'
   assert btn('start').is_visible();assert page.get_by_role('heading',name='TYPEKEEPER',exact=True).is_visible()
  check('Version 3.3.1 opens with the retained 3.2.1 scoring and economy ruleset',identity)
  def input_surface():
   run();b=page.locator('#typing-input').bounding_box();stage=page.locator('#stage').bounding_box();y=(b['y']-stage['y'])/(stage['width']/1200)
   assert 735<=y<=757;assert page.locator('#typing-input').count()==1;assert page.locator('#onboarding-hint').is_hidden();assert page.locator('.typing-hint').count()==0
   assert page.locator('#typing-input').evaluate('(e)=>getComputedStyle(e).color')=='rgb(37, 61, 50)'
  check('One real native input sits on the machine paper, not a bottom search field',input_surface)
  def typed_paper():
   run();word('LIBRARY');page.locator('#typing-input').fill('LIBRA');api('t.flush();');assert snap()['correct']==0
   page.locator('#typing-input').press_sequentially('RY');assert snap()['buffer']=='LIBRARY';page.keyboard.press('Enter');assert snap()['correct']==1
  check('Complete typed words remain on the paper until Enter commits them once',typed_paper)
  def pointer_selection():
   run();word();page.locator('#typing-input').fill('LIBRARY');page.locator('#typing-input').evaluate('(e)=>e.setSelectionRange(1,4)')
   api('t.model.inventory.ice=1;t.flush();');page.keyboard.press('2');assert page.locator('#typing-input').evaluate('(e)=>[e.selectionStart,e.selectionEnd]')==[1,4]
   assert snap()['buffer']=='LIBRARY';page.keyboard.press('Enter');assert snap()['correct']==1
  check('Paper-surface selection survives quick magic and normal Enter submission',pointer_selection)
  def incorrect_prefix():
   run();word();page.locator('#typing-input').fill('XYZ');api('t.flush();')
   assert 'mistype' in page.locator('#typing-dock').get_attribute('class');assert snap()['wrong']==0 and snap()['danger']==0
   page.keyboard.press('Enter');assert snap()['wrong']==1 and snap()['danger']==2
   assert page.locator('.pressure-vignette').evaluate('(e)=>getComputedStyle(e).boxShadow')=='none'
  check('A wrong prefix produces local paper feedback without a premature penalty or red flash',incorrect_prefix)
  def erase():
   run();word();api('t.setSettings({sfx:true,muted:false});t.audio.unlock();t.audio.cueLog=[];');page.locator('#typing-input').fill('LIBR');page.keyboard.press('Backspace');api('t.flush();')
   assert snap()['buffer']=='LIB';assert 'paper-erase' in [c['name'] for c in api('return t.audioState().cues;')]
  check('Backspace edits the real buffer and triggers a short paper-erase cue',erase)
  def material_frames():
   for kind in ['normal','fire','ice','slow','wind','bonus']:
    run();word('ARCHIVE',kind);page.locator('#typing-input').fill('ARCHIVE');page.keyboard.press('Enter');v=visual()
    assert v['deaths']==1;assert api('return t.renderer.deaths[0].kind;')==kind
    assert snap()['correct']==1;assert snap()['inventory'].get(kind,0)==(1 if kind in ['fire','ice','slow','wind'] else 0)
  check('Each card material resolves once into its own destruction sequence',material_frames)
  def normal_life():
   run();word('BOOK');enter('BOOK');assert abs(api('return t.renderer.deaths[0].life;')-.32)<.0001
   page.wait_for_timeout(400);assert visual()['deaths']==0
  check('Normal paper tears for 320 ms and is then released from memory',normal_life)
  def shelf_spawn():
   run();api('t.model.spawn();t.flush();');v=visual();assert v['spawns']==1
   origin=api('return [...t.renderer.spawns.values()][0];');assert origin['from']['x'] in [181,1017] and abs(origin['life']-.21)<.0001
   page.wait_for_timeout(270);assert visual()['spawns']==0
  check('Cards have a 210-ms shelf-origin entrance, without delaying the game model',shelf_spawn)
  def high_entry():
   run();api('t.model.danger=85;t.model.spawn();t.flush();');assert abs(api('return [...t.renderer.spawns.values()][0].life;')-.18)<.0001
   speed=snap()['words'][0]['speed'];assert speed==api('return t.model.config.speed;')
  check('High-pressure entrance animation shortens without changing fall speed',high_entry)
  def intro_resolve():
   run();api('t.model.spawn();t.flush();');w=snap()['words'][0];enter(w['text']);assert snap()['correct']==1;assert visual()['spawns']==0
  check('Immediate typing during an entrance cannot leave an orphaned spawn animation',intro_resolve)
  def miss_lands():
   run();word('FABLE','normal',740,647.99);api('t.advance(.05);');assert snap()['missed']==1 and snap()['danger']>0
   assert visual()['arrivals']==1 and api('return t.model.pile.at(-1).text;')=='FABLE'
   page.wait_for_timeout(380);assert visual()['arrivals']==0;assert api('return t.renderer.shownDanger;')>0
  check('Missed paper travels to the physical pile and remains tied to actual danger',miss_lands)
  def wind_only_pile():
   run();word('VISIBLE');api('t.model.danger=72;t.model.inventory.wind=1;t.flush();');before=snap()['words'];page.keyboard.press('4')
   assert snap()['words']==before;assert snap()['danger']==0;assert api('return t.renderer.shownDanger;')==0
   assert 'spell-wind' in [x['name'] for x in api('return t.audioState().cues;')]
  check('WIND clears only accumulated misses, never steals live words or typing progress',wind_only_pile)
  def fire_no_rewards():
   run();word('TREASURE','ice');word('BOOK','normal',800,450);api('t.model.inventory.fire=1;t.flush();');page.keyboard.press('1')
   assert snap()['words']==[] and snap()['score']==0 and snap()['inventory']['ice']==0
   assert api('return t.renderer.deaths.every(d=>d.kind==="fire");') and visual()['deaths']==2
  check('FIRE burns every removed material without points, progress, or collected books',fire_no_rewards)
  def ice_still():
   run();word();api('t.model.inventory.ice=1;t.flush();');page.keyboard.press('2');a=visual()['worldTime'];page.wait_for_timeout(200);b=visual()['worldTime'];assert a==b
   assert snap()['effects']['ice']==6;page.locator('#typing-input').fill('LIBRARY');page.keyboard.press('Enter');assert snap()['correct']==1
  check('ICE stops decorative room/card drift while typing stays responsive',ice_still)
  def queued():
   run();word();api('t.model.inventory.ice=t.model.inventory.slow=1;t.flush();');page.keyboard.press('2');page.keyboard.press('3')
   assert page.locator('#ready-slow').inner_text()=='QUEUED';api('t.advance(3);');assert snap()['effects']['slow']==8
   assert page.locator('#effect-status').is_hidden()
  check('SLOW remains banked under ICE and its queued status appears only on the book',queued)
  def thaw():
   run();word();api('t.model.inventory.ice=1;t.flush();');page.keyboard.press('2');api('t.advance(6.05);');assert snap()['effects']['ice']==0
   assert api('return t.renderer.frostEcho;')>0;page.wait_for_timeout(800);assert api('return t.renderer.frostEcho;')==0
  check('Natural thaw leaves a bounded frost-drop echo rather than an abrupt blue flash',thaw)
  def book_open():
   run();word();api('t.model.inventory.ice=1;t.flush();');page.keyboard.press('2')
   assert page.locator('#spell-ice .spell-book').evaluate('(e)=>getComputedStyle(e).animationName')=='cover-open'
   assert page.locator('#count-ice').inner_text()=='0/2';assert page.locator('#spell-ice .book-leaves').evaluate('(e)=>getComputedStyle(e).animationName')=='leaves-open'
  check('A cast presses the key, opens the cover 15 degrees, and lights the inner leaves',book_open)
  def hud():
   run();assert page.locator('.side-stats').is_hidden();assert page.locator('#limit-instrument').bounding_box()['height']<170
   api('t.setSettings({detailedHUD:true});');assert page.locator('.side-stats').is_visible();assert page.locator('#streak-value').is_visible()
  check('Default HUD keeps streak as a seal; numerical streak, WPM and accuracy stay optional',hud)
  def paper_guidance():
   run();api('t.setSettings({hints:true});t.renderer.guide.word=false;t.model.spawn();t.flush();');first=snap()['words'][0]['text'];assert page.locator('#typing-input').get_attribute('placeholder')==first
   enter(first);api('t.flush();');assert visual()['guide']['word'] and page.locator('#typing-input').get_attribute('placeholder')==''
   api('t.show("menu");t.start(19);t.freeze(true);t.model.spawn();t.flush();');assert page.locator('#typing-input').get_attribute('placeholder')==''
  check('First-word guidance is a ghost on the paper and retires after successful typing',paper_guidance)
  def ice_guidance():
   run();api('t.setSettings({hints:true});t.renderer.guide.ice=false;');word('AMBER','ice');enter('AMBER')
   assert visual()['guide']['ice'];assert api('return t.renderer.glance.x;')==278;assert api('return t.renderer.glanceTime;')>0
   assert 'collected' not in page.locator('#toast').inner_text().lower()
  check('First ICE reward guides the eye toward its book without a tutorial popup',ice_guidance)
  def render_pure():
   run(36);word('ARCHIVE');word('CLOCKWORK','ice',670,352);before=snap();api('for(let i=0;i<100;i++)t.renderer.frame(performance.now()+i/60,1);');assert snap()==before
  check('100 presentation frames cannot mutate the authoritative gameplay snapshot',render_pure)
  def pressure_light():
   run();values=[]
   for danger in [0,20,40,65,85,98]:
    api(f't.model.danger={danger};t.flush();');page.wait_for_timeout(30);v=visual()['light'];a=api('return t.audioState();');assert abs(v['tension']-a['tension'])<1e-9 and abs(v['urgency']-a['urgency'])<1e-9;values.append(v)
   evidence['lightCurve']=values
  check('Scene lighting uses the same continuous tension and urgency curves as the score',pressure_light)
  def no_strobe():
   run();api('t.model.danger=84;t.flush();');page.wait_for_timeout(250);assert api('return t.renderer.pressureDip;')==0
   api('t.model.danger=88;t.flush();');page.wait_for_timeout(35);assert api('return t.renderer.pressureDip;')==0
  check('An 80-percent threshold cue is one restrained dip, not a repeating strobe',no_strobe)
  for chapter,name in [(1,'Reading Room'),(7,'Glasshouse'),(13,'Clockwork Hall'),(19,'Frost Archive'),(25,'Ember Stacks'),(31,'Astral Gallery'),(37,'Midnight Vault'),(43,'Eternal Library')]:
   def room(chapter=chapter,name=name):
    run(chapter,'practice');page.wait_for_timeout(50);assert visual()['room']==name;assert visual()['roomCache']<=2
   check(f'Chapter {chapter} selects {name} dressing without changing the field',room)
  def paused_still():
   run();word('TEST');page.locator('#typing-input').fill('TE');page.keyboard.press('Escape');a=visual()['worldTime'];saved=snap();page.wait_for_timeout(200);assert visual()['worldTime']==a;assert snap()['words']==saved['words'];btn('resume').click();assert snap()['buffer']=='TE'
  check('Pause freezes the physical room, word motion and current paper input',paused_still)
  def victory_scene():
   run();clear();assert snap()['phase']=='level-clear';assert page.locator('#screen-layer').get_attribute('data-screen')=='scene-clear'
   assert api('return t.store.checkpoint("classic").nextLevel;')==2;assert page.locator('#typing-input').is_disabled();ready_result();assert page.locator('#screen-layer').get_attribute('data-screen')=='level-clear'
  check('Chapter closure returns a book to the shelf after committing score and save once',victory_scene)
  def defeat_scene():
   run();api('t.model.danger=99;t.flush();');word('FABLE','normal',700,647.99);api('t.advance(.05);')
   assert snap()['phase']=='game-over' and visual()['ceremony']['kind']=='defeat';assert not page.locator('#result-score-value').count()
   n=api('return t.store.records.length;');ready_result();api('t.flush();t.flush();');assert api('return t.store.records.length;')==n
  check('Defeat performs a 1.2-second jam/light/pile sequence before showing results once',defeat_scene)
  def skip_scene():
   run();clear();page.keyboard.press('Enter');assert snap()['level']==1;assert page.locator('#screen-layer').get_attribute('data-screen')=='level-clear';assert not api('return t.outcomeCue.active;')
   page.keyboard.press('Enter');assert snap()['level']==1
  check('Enter skips the ceremony but cannot also advance the new results screen',skip_scene)
  def held_enter():
   run();word('BOOK');api('t.model.progress=t.model.config.quota-1;');page.locator('#typing-input').fill('BOOK');page.keyboard.down('Enter');page.keyboard.down('Enter');page.keyboard.up('Enter');assert snap()['level']==1;ready_result();assert snap()['level']==1
  check('Held Enter through the final word never fast-forwards two transitions',held_enter)
  def cancel_scene():
   run();clear();api('t.show("menu");');page.wait_for_timeout(1200);assert snap()['phase']=='menu';assert page.locator('#screen-layer').get_attribute('data-screen')=='menu'
  check('Leaving during a ceremony cancels it; no timer can reopen an old result',cancel_scene)
  def reduced_scene():
   run();api('t.setSettings({motion:false});');clear();assert page.locator('#screen-layer').get_attribute('data-screen')=='level-clear';assert not api('return t.outcomeCue.active;')
  check('Reduced motion bypasses the scene ceremony and exposes results immediately',reduced_scene)
  def reduced_all():
   run();api('t.setSettings({motion:false});');word('FABLE','ice');enter('FABLE');v=visual();assert v['deaths']==0 and v['particles']==0 and v['arrivals']==0;assert page.locator('#ready-ice').inner_text()=='READY'
  check('Reduced motion removes debris and travel while preserving readable spell state',reduced_all)
  def bounded():
   run();api("for(let i=0;i<65;i++)t.renderer.handle([{type:'correct',word:{id:i,text:'BOOK',kind:'normal',x:500,y:300,width:140},points:40,streak:1},{type:'power',power:'wind'}]);")
   v=visual();assert v['deaths']<=18 and v['particles']<=180 and api('return t.renderer.floaters.length;')<=20
   page.wait_for_timeout(1900);v=visual();assert v['deaths']==0 and v['particles']==0
  check('Burst feedback stays bounded and releases expired paper and particles',bounded)
  for width,height in [(1366,768),(1920,1080)]:
   def resolution(width=width,height=height):
    page.set_viewport_size({'width':width,'height':height});run(36,'practice')
    for t,k,x,y in [('CLOCKWORK','ice',410,240),('EXTRAORDINARY','wind',772,335),('LIBRARY','normal',420,464),('PARALLEL','bonus',779,579)]:word(t,k,x,y)
    api('t.flush();');page.wait_for_timeout(150);v=visual();assert len(v['readability'])==4
    assert all(w['effectivePixels']>=23.49 for w in v['readability'])
    assert all(''.join(w['lines'])==w['text'] for w in v['readability'])
    assert all(w['x']-w['width']/2>=225.9 and w['x']+w['width']/2<=978.1 for w in v['readability'])
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    evidence[f'{width}x{height}']=v['readability']
   check(f'Actual {width}×{height} layout keeps complete words above 23.5 CSS pixels',resolution)
  def screenshot_set():
   page.set_viewport_size({'width':1366,'height':768});run(7,'practice');api("t.model.danger=32;t.model.score=8420;t.model.streak=10;t.model.inventory={fire:1,ice:1,slow:0,wind:1};t.flush();")
   for a in [('LANTERN','normal',402,242),('CLOCKWORK','ice',772,334),('PARCHMENT','normal',448,447),('EXTRAORDINARY','wind',765,562)]:word(*a)
   page.locator('#typing-input').fill('PAR');api('t.flush();');page.wait_for_timeout(700);page.screenshot(path=str(SHOTS/'01-gameplay-1366.png'))
   page.set_viewport_size({'width':1920,'height':1080});page.wait_for_timeout(250);page.screenshot(path=str(SHOTS/'02-gameplay-1080.png'))
   api('t.model.danger=91;t.flush();');page.wait_for_timeout(500);page.screenshot(path=str(SHOTS/'03-critical.png'))
   page.keyboard.press('2');page.wait_for_timeout(200);page.screenshot(path=str(SHOTS/'04-ice.png'))
   page.keyboard.press('4');page.wait_for_timeout(110);page.screenshot(path=str(SHOTS/'05-wind.png'))
   api('t.show("menu");');page.wait_for_timeout(450);page.screenshot(path=str(SHOTS/'06-title.png'))
  check('Gameplay, pressure, ICE, WIND and title screens render into actual browser captures',screenshot_set)
  check('No unhandled application exceptions in the manuscript audit',lambda:None if not errors else (_ for _ in ()).throw(AssertionError(errors)))
  report={'version':'3.4.0','ruleset':'typekeeper-3.2.1','source':'v3.2.1 ZIP; not the earlier v3.3.0 draft','mode':__doc__,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'browser':browser.version,'passed':sum(x['status']=='PASS' for x in rows),'failed':sum(x['status']=='FAIL' for x in rows),'pageErrors':errors,'tests':rows,'evidence':evidence}
  (OUT/'manuscript-browser-results.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k]for k in ['passed','failed','pageErrors']},indent=2));browser.close()
  if report['failed'] or errors:raise SystemExit(1)
if __name__=='__main__':main()
