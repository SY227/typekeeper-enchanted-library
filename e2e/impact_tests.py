#!/usr/bin/env python3
"""Impact Pass integration. Shipping renderer, native keyboard and model; test seams
only construct controlled states and freeze model time. Not human playtesting."""
from pathlib import Path
import argparse,json,time,traceback,hashlib
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
from module_fixture import module_fixture
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--mode',choices=['standalone','modules'],default='standalone');args=ap.parse_args()
OUT=ROOT/'qa364';OUT.mkdir(exist_ok=True);SHOTS=OUT/'impact-screenshots';SHOTS.mkdir(exist_ok=True)
rows=[];errors=[];evidence={}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
 page=b.new_page(viewport={'width':1366,'height':768});page.set_default_timeout(10000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT));page.wait_for_function('!!window.__TM_TEST__');page.wait_for_timeout(100)
 def api(code):return page.evaluate('(()=>{const t=__TM_TEST__,m=t.model,r=t.renderer;'+code+'})()')
 def setup(motion=True,danger=0,sound=False):
  page.evaluate('''o=>{const t=__TM_TEST__;t.show('menu');t.setSettings({motion:o.motion,pace:'classic',contrast:false,hints:false,music:false,sfx:o.sound,muted:!o.sound,resumeCountdown:false});t.start(98173);t.freeze(true);t.model.words=[];t.model.danger=o.danger;t.model.inventory={fire:2,ice:2,slow:2,wind:2};t.audio.cueLog=[];t.flush();}''',dict(motion=motion,danger=danger,sound=sound))
  page.mouse.move(1,1)
 def words():api("t.word('CLOCKWORK','normal',480,350);t.word('CLOISTER','bonus',785,235);t.word('STORY','ice',770,492);t.flush();")
 def fill(text):page.locator('#typing-input').fill(text);api('t.flush();')
 def enter(text):fill(text);page.keyboard.press('Enter');api('t.flush();')
 def shot(name):page.screenshot(path=str(SHOTS/f'{name}-{args.mode}.png'))
 def check(name,fn):
  st=time.monotonic()
  try:fn();assert not errors,errors;row={'name':name,'status':'PASS','seconds':round(time.monotonic()-st,3)}
  except Exception as e:
   row={'name':name,'status':'FAIL','error':str(e),'trace':traceback.format_exc(),'seconds':round(time.monotonic()-st,3)}
   try:shot(f'failure-{len(rows)+1}')
   except:pass
  rows.append(row);print(json.dumps(row),flush=True)
 def identity():
  assert api('return t.info.version;')=='3.6.4';assert page.title().endswith('v3.6.4');assert api('return t.info.ruleset;')=='typekeeper-3.6.4'
  assert api('return Object.values(m.inventory).every(n=>n===0);')
 check('Current 3.6.4 identity, retained ruleset and zero-stock campaign start',identity)
 def target():
  setup();words();fill('CLO');page.wait_for_timeout(30);v=api('return r.readability;');sel=[w for w in v if w['selected']];assert len(sel)==1 and sel[0]['text']=='CLOCKWORK';assert len([w for w in v if w['matching']])==2;assert api('return m.score;')==0;shot('matching-prefix')
 check('Common prefix inks both candidates but brackets only the model-priority target',target)
 def retarget():
  setup();words();fill('CLOI');page.wait_for_timeout(30);assert api('return r.readability.find(w=>w.selected).text;')=='CLOISTER';page.keyboard.press('Backspace');api('t.flush();');page.wait_for_timeout(30);assert api('return r.readability.find(w=>w.selected).text;')=='CLOCKWORK';assert page.locator('#typing-input').input_value()=='CLO';assert api('return m.wrong+m.missed;')==0
 check('Native Backspace corrects and retargets shared prefixes without an error penalty',retarget)
 def exact_priority():
  setup(sound=True);api("t.word('BOOK','normal',470,260);t.word('BOOKCASE','normal',760,490);t.flush();");page.evaluate('async()=>await __TM_TEST__.audio.unlock()');fill('BO');page.wait_for_timeout(35);assert api('return r.readability.find(w=>w.selected).text;')=='BOOKCASE'
  page.keyboard.type('OK',delay=50);api('t.flush();');page.wait_for_timeout(35);assert api('return r.readability.find(w=>w.selected).text;')=='BOOK';assert api('return r.readability.find(w=>w.selected).complete;');assert api('return t.audio.snapshot().cues.some(c=>c.name==="word-ready");');shot('exact-word-priority')
  page.keyboard.press('Enter');api('t.flush();');assert api('return m.score;')==40;assert api('return m.words.map(w=>w.text);')==['BOOKCASE'];assert api('return r.lastImpact.id;')==1
 check('Exact BOOK wins over lower BOOKCASE for brackets, ready sound and the unchanged Enter result',exact_priority)
 def batch_exact():
  setup(sound=True);api("t.word('BOOK','normal',470,260);t.word('BOOKCASE','normal',760,490);t.flush();");api("m.setBuffer('BOOK');m.submit();t.flush();");assert api('return m.score;')==40;assert api('return m.words[0].text;')=='BOOKCASE';assert api('return r.lastImpact.points;')==40;assert not errors
 check('Batched input/Enter feedback resolves the real saved word without changing the model outcome',batch_exact)

 def ready():
  setup();words();fill('CLOCKWORK');page.wait_for_timeout(350);assert api('return m.words.length;')==3;v=api('return r.readability.find(w=>w.selected);');assert v['complete'];assert api('return m.score;')==0;shot('ready-to-save')
 check('Complete ink/check mark stays ready until Enter; no auto-submit or score delay',ready)
 def mechanical():
  setup();words();fill('C');a=api('return {key:r.machine.key,hand:r.machine.hand,shift:r.machine.pose().shift};');assert a['key']>0;assert a['shift']==-.66
  fill('CL');b0=api('return {key:r.machine.key,hand:r.machine.hand,shift:r.machine.pose().shift};');assert b0['hand']!=a['hand'];assert b0['shift']==-1.32
  page.keyboard.press('Backspace');api('t.flush();');assert api('return r.machine.erase;')>0;page.wait_for_timeout(180);assert api('return r.machine.erase+r.machine.key;')==0;evidence['mechanical']={'first':a,'second':b0}
 check('Real changed input alternates mechanical taps; native erase has a distinct bounded response',mechanical)
 def origin():
  setup();words();fill('CLOCKWORK');page.wait_for_timeout(40)
  before=api('return {...r.poses.get(m.words.find(w=>w.text==="CLOCKWORK").id)};');page.keyboard.press('Enter');api('t.flush();');after=api('return {source:r.lastImpact,death:r.deaths[0]?.word,score:m.score,progress:m.progress,returning:r.machine.returning};')
  assert after['score']==90 and after['progress']==1;assert abs(after['source']['x']-before['x'])<.01;assert abs(after['source']['y']-before['y'])<.01;assert after['death']['visualScale']==before['scale'];assert after['returning']>0;assert page.locator('#typing-input').evaluate('(e)=>document.activeElement===e')
  evidence['source']=after;page.wait_for_timeout(55);shot('word-origin-release');page.wait_for_timeout(490);assert api('return r.deaths.length+r.floaters.length;')==0
 check('Enter awards exact points immediately; release keeps last-painted origin, scale and keyboard focus',origin)
 def readytyping():
  setup();words();enter('CLOCKWORK');fill('ST');assert api('return m.buffer;')=='ST';assert api('return r.machine.returning;')==0;assert api('return m.progress;')==1
 check('Typing the next word interrupts carriage return without locking or losing input',readytyping)
 def mismatch():
  setup();words();fill('XYZ');page.wait_for_timeout(30);assert not api('return r.readability.some(w=>w.matching||w.selected);');page.keyboard.press('Enter');api('t.flush();');assert api('return m.danger;')==2;assert api('return r.arrivals.length;')==0;assert api('return m.pile.length;')==0;assert api('return m.wrong;')==1
 check('Wrong submission stays a 2% error; no fake missed-word flight or random target',mismatch)
 def miss():
  setup(danger=58,sound=True);words();page.evaluate('async()=>await __TM_TEST__.audio.unlock()');page.wait_for_timeout(180)
  before=api('return m.score;');api('const w=m.words.find(w=>w.text==="CLOCKWORK");w.y=647.999;w.previousY=w.y;t.advance(1/60);')
  v=api('return {count:r.arrivals.length,danger:m.danger,top:m.pile.at(-1)?.text,life:r.arrivals[0]?.life};');assert v['count']==1 and v['top']=='CLOCKWORK';assert abs(v['danger']-73.2)<.001;assert v['life']==.30
  page.wait_for_timeout(130);shot('miss-in-flight');page.wait_for_timeout(560)
  v=api('return {arrivals:r.arrivals.length,top:r.lastPileText,shown:r.shownDanger,cues:t.audio.snapshot().cues.map(x=>x.name),score:m.score};');assert v['arrivals']==0 and v['top']=='CLOCKWORK';assert abs(v['shown']-73.2)<.05;assert v['score']==before;assert v['cues'].count('paper-impact')==1 and v['cues'].count('paper-settle')==1;shot('paper-landing');evidence['miss']=v
 check('A real missed word lands, settles once and preserves the exact miss cost; landing foley follows contact',miss)
 def pause():
  setup();words();api('m.words[0].y=647.999;t.advance(1/60);');page.keyboard.press('Escape');page.wait_for_timeout(70)
  before=api('return {m:m.snapshot(),a:r.arrivals.map(a=>a.t),machine:r.machine.pose(),shown:r.shownDanger};');page.wait_for_timeout(250);after=api('return {m:m.snapshot(),a:r.arrivals.map(a=>a.t),machine:r.machine.pose(),shown:r.shownDanger};');assert before==after
  page.locator('[data-action=resume]').click();page.wait_for_timeout(450);assert api('return r.arrivals.length;')==0
 check('Pause freezes the physical landing, machine and stack; Resume finishes once without lost model time',pause)
 def wind():
  setup(danger=64,sound=True);words();page.evaluate('async()=>await __TM_TEST__.audio.unlock()');api('m.words[0].y=647.999;t.advance(1/60);');fill('ST');page.keyboard.press('4');api('t.flush();');assert api('return m.danger;')==0;assert api('return r.arrivals.length+r.pileImpulse+r.shownDanger;')==0;assert page.locator('#typing-input').input_value()=='ST';page.wait_for_timeout(500);assert api('return r.lastPileText;')=='';assert not api('return t.audio.snapshot().cues.some(c=>c.name==="paper-settle");')
 check('WIND cancels in-flight paper and pending landing sound without clearing the typed buffer',wind)
 def reduced():
  setup(danger=62);words();api('m.words[0].y=647.999;t.advance(1/60);');api('t.setSettings({motion:false,contrast:true});');fill('STORY');page.wait_for_timeout(110);assert api('return r.arrivals.length+r.deaths.length+r.machine.key+r.pileImpulse;')==0;assert abs(api('return r.shownDanger;')-77.2)<.001;assert api('return r.readability.find(w=>w.selected).complete;');shot('reduced-high-contrast')
 check('Reduced motion cancels moving effects immediately while retaining ink, selection and physical pressure',reduced)
 def freezetype():
  setup();words();page.keyboard.press('2');api('t.flush();');before=api('return m.words.map(w=>[w.id,w.x,w.y]);');fill('C');assert api('return r.machine.key;')>0;page.wait_for_timeout(150);assert api('return m.words.map(w=>[w.id,w.x,w.y]);')==before;enter('CLOCKWORK');assert api('return m.progress;')==1;assert api('return m.effects.ice;')==6
 check('ICE freezes world movement, never the typing machine, input or scoring',freezetype)
 def fire():
  setup();words();fill('ST');page.keyboard.press('1');api('t.flush();');assert api('return m.score+m.progress;')==0;assert api('return m.words.length;')==0;assert api('return r.deaths.length;')==3;assert api('return r.floaters.length;')==0;assert page.locator('#typing-input').input_value()=='ST';page.wait_for_timeout(90);shot('paper-edge-fire');page.wait_for_timeout(700);assert api('return r.deaths.length;')==0
 check('FIRE uses paper-local burns, earns no score/progress and keeps the existing input',fire)
 def late():
  setup();words();api('m.words[0].y=647.999;t.advance(1/60);');before=api('return m.danger;');enter('CLOCKWORK');assert api('return m.danger;')==before;assert api('return m.score;')==0;assert api('return r.arrivals.length;')==1;assert api('return r.deaths.length;')==0
 check('Late Enter remains a single miss; feedback cannot refund, duplicate or double-penalize it',late)
 def particles():
  setup();api('''for(let i=0;i<90;i++)r.handle([{type:'correct',word:{id:i,text:'BOOK',kind:'normal',x:500,y:300,width:112},points:40,streak:1}]);''');v=api('return {points:r.floaters.length,deaths:r.deaths.length,particles:r.particles.length};');assert v['points']<=6 and v['deaths']<=18 and v['particles']<=180;page.wait_for_timeout(1400);assert api('return r.floaters.length+r.deaths.length+r.particles.length;')==0;evidence['caps']=v
 check('Stress burst stays inside six score labels, 18 releases and the retained 180-particle budget',particles)
 def floats():
  setup(motion=False);words();result=api('''const c=document.createElement('canvas').getContext('2d'),out=[];const original=c.fillText.bind(c);c.fillText=(...a)=>{out.push(a[0]);original(...a)};r.drawWords(c,1);r.floaters=[{x:480,y:363,text:'+99',color:'#fff',t:0,life:.44}];r.drawWordFloats(c);return out.filter(s=>s==='+99');''');assert result==[]
 check('Word-origin score labels are suppressed instead of covering a live word',floats)
 def stages():
  setup();data=api('''const c=document.createElement('canvas').getContext('2d'),rows=[];for(const kind of ['normal','fire','ice','slow','wind','bonus'])for(const text of ['BOOK','CLOCKWORK','CONSTELLATION','W'.repeat(24)])for(const scale of [.65,.83555556,1.18]){r.setViewport(scale);m.buffer=text.slice(0,2);const w={id:8,text,kind,width:112},l=r.layout(w),seen=[],old=c.fillText.bind(c);c.fillText=(...a)=>{seen.push(a);old(...a)};r.paintCard(c,w,l,{matching:true,selected:true});c.fillText=old;rows.push({kind,text,scale,complete:seen.filter(a=>a[0]===text).length>=2,baselines:seen.filter(a=>a[0]===text).map(a=>a[2]),guard:l.inkLeft>=l.safeLeft&&l.inkRight<=l.safeRight});}return rows;''');assert len(data)==72;assert all(v['complete'] and v['guard'] and set(v['baselines'])=={0} for v in data);evidence['ink']=data;api('r.setViewport(document.querySelector("#stage").getBoundingClientRect().width/1200);')
 check('72 native ink layouts retain complete single-row words and protected glyph bounds on all materials',stages)
 def pressure_sizes():
  geometry=[]
  for width,height in [(1920,1080),(1366,768),(1280,720),(1024,600),(800,600),(640,480)]:
   page.set_viewport_size({'width':width,'height':height});setup(motion=False,danger=95);words();api("m.pile=[{id:90,text:'CLOCKWORK'}];t.flush();");fill('CLO');page.wait_for_timeout(70)
   g=api('''const st=document.querySelector('#stage').getBoundingClientRect(),s=st.width/1200;const b=e=>{const z=document.querySelector(e).getBoundingClientRect();return {x:(z.x-st.x)/s,y:(z.y-st.y)/s,w:z.width/s,h:z.height/s}};return {pile:r.visualSnapshot().impact.pile,input:b('#typing-dock'),slow:b('#spell-slow'),score:b('#score-panel'),chapter:b('.chapter-panel'),view:[innerWidth,innerHeight]};''')
   assert g['pile']['x']+g['pile']['width']/2+4<g['slow']['x'];assert g['score']['x']+g['score']['w']<g['chapter']['x'];geometry.append(g);shot(f'high-pressure-{width}x{height}')
  evidence['geometry']=geometry;page.set_viewport_size({'width':1366,'height':768})
 check('High-pressure play at six desktop sizes keeps pile/input/SLOW/Score Chase separation',pressure_sizes)
 def thresholds():
  setup(motion=False);words();values=[]
  for d in [0,2,25,50,75,90,95,100]:
   api(f'm.danger={d};t.flush();');page.wait_for_timeout(35);v=api('return {shown:r.shownDanger,pressure:m.pressure.key,geometry:r.visualSnapshot().impact.pile};');assert abs(v['shown']-d)<.001;values.append(v)
  evidence['pressure']=values
 check('Pressure 0→100 maps monotonically to the physical stack without changing meter thresholds',thresholds)
 def resets():
  setup();words();api('m.words[0].y=647.999;t.advance(1/60);');fill('ST');api('t.show("menu");t.start(88,2);t.freeze(true);t.flush();');assert api('return r.arrivals.length+r.deaths.length+r.machine.key+r.pileImpulse;')==0;assert api('return r.lastImpact;') is None
 check('Menu/new run clears mechanical, target and landing residue without replaying previous events',resets)
 def mute():
  setup(danger=44,sound=True);words();page.evaluate('async()=>await __TM_TEST__.audio.unlock()');api('m.words[0].y=647.999;t.advance(1/60);t.setSettings({muted:true});');page.wait_for_timeout(500);assert not api('return t.audio.snapshot().cues.some(c=>c.name==="paper-settle");');api('t.setSettings({muted:false});');page.wait_for_timeout(90);assert not api('return t.audio.snapshot().cues.some(c=>c.name==="paper-settle");')
 check('Muting before contact drops landing sound; unmute does not replay a stale cue',mute)
 def collision():
  setup();api("for(let row=0;row<4;row++)for(let col=0;col<3;col++)t.word(['BOOK','LAMP','TALE'][col]+['A','B','C','D'][row],col===1?'bonus':'normal',350+col*242,220+row*105);m.danger=95;t.flush();");fill('BOOK');page.wait_for_timeout(60)
  v=api('return r.readability;');assert len(v)==12;assert len([w for w in v if w['selected']])==1
  for i,a in enumerate(v):
   for bb in v[i+1:]:assert abs(a['x']-bb['x'])>=(a['width']+bb['width'])/2 or abs(a['y']-bb['y'])>=(a['height']+bb['height'])/2
  shot('twelve-card-stress');before=api('return m.snapshot();');api('r.frame(performance.now()+16,1);');assert api('return m.snapshot();')==before
 check('Twelve-card readable stress scene preserves target uniqueness and never lets render effects mutate the model',collision)
 def firstice():
  setup();api('m.inventory={fire:0,ice:0,slow:0,wind:0};t.flush();')
  kinds=[]
  for i in range(6):
   api('m.words=[];m.spawn();t.flush();');kinds.append(api('return m.words[0].kind;'));enter(api('return m.words[0].text;'))
  assert kinds[:5]==['normal']*5 and kinds[5]=='ice';assert api('return m.inventory.ice;')==1
 check('Normally earned sixth opening card is still ICE; feedback does not manufacture resources',firstice)
 report={'version':'3.6.4','mode':args.mode,'runtimeSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'passed':sum(x['status']=='PASS' for x in rows),'failed':sum(x['status']=='FAIL' for x in rows),'checks':rows,'errors':errors,'evidence':evidence,'limits':'Controlled browser fixtures, native keyboard and Canvas. No human/device certification.'}
 (OUT/f'impact-{args.mode}.json').write_text(json.dumps(report,indent=2))
 b.close()
print(json.dumps({'passed':report['passed'],'failed':report['failed']}),flush=True)
sys_exit=0 if report['failed']==0 and not errors else 1
raise SystemExit(sys_exit)
