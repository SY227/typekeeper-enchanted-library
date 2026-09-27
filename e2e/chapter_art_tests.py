#!/usr/bin/env python3
"""Current 3.4.0 chapter/elemental presentation integration in shipping code.
In-memory transport enables only the existing diagnostic seam. It is not an actual
Mac, human-playability, HTTP-browser or independently certified studio test.
"""
from pathlib import Path
import argparse,base64,hashlib,json,time,sys
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
from module_fixture import module_fixture
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa340';OUT.mkdir(exist_ok=True)
SHOTS=ROOT/'docs/screenshots/v3.4.0';SHOTS.mkdir(parents=True,exist_ok=True)
a=argparse.ArgumentParser();a.add_argument('--mode',choices=['standalone','modules'],default='standalone');a.add_argument('--executable',default='/usr/bin/chromium');args=a.parse_args()
rows=[];errors=[];evidence={}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=args.executable,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1366,'height':768});page.set_default_timeout(12000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__')
 def api(code):return page.evaluate('(()=>{const t=__TM_TEST__,m=t.model,r=t.renderer;'+code+'})()')
 def start(level=1,motion=True):
  page.evaluate('''o=>{const t=__TM_TEST__;t.setSettings({motion:o.motion,contrast:false,music:false,sfx:false,muted:true,hints:false,resumeCountdown:false});t.start(9331,o.level);t.freeze(true);t.model.words=[];t.model.inventory={fire:2,ice:2,slow:2,wind:2};t.flush();}''',{'level':level,'motion':motion})
 def words():api("[['LIBRARY','normal',425,254],['EMBER','fire',820,254],['CLOCKWORK','slow',427,382],['CRYSTAL','ice',820,382],['WONDER','wind',405,518],['CONSTELLATION','bonus',810,518]].forEach(a=>t.word(...a));t.flush();")
 def check(name,fn):
  st=time.monotonic()
  try:fn();assert not errors,errors;row={'name':name,'status':'PASS','seconds':round(time.monotonic()-st,3)}
  except Exception as e:
   row={'name':name,'status':'FAIL','error':repr(e),'seconds':round(time.monotonic()-st,3)}
   page.screenshot(path=str(OUT/f'failure-chapter-{args.mode}-{len(rows)}.png'))
  rows.append(row);print(json.dumps(row),flush=True)
 def identity():
  assert api('return t.info.version;')=='3.4.0';assert page.title().endswith('v3.4.0');assert api('return t.info.ruleset;')=='typekeeper-3.2.1'
  q=b.new_page();e=[];q.on('pageerror',lambda x:e.append(str(x)));q.set_content(inline_fixture(ROOT,False) if args.mode=='standalone' else module_fixture(ROOT,False));q.wait_for_selector('[data-action="start"]');assert q.evaluate('typeof __TM_TEST__')=='undefined';assert not e;q.close()
 check('Source/HTML/runtime identity and exact non-diagnostic startup both succeed',identity)
 def all_stages():
  start();result=page.evaluate('''async()=>{const t=__TM_TEST__,m=t.model,r=t.renderer,seen=[];const hash=bytes=>{let h=2166136261;for(let i=0;i<bytes.length;i+=4)h=Math.imul(h^bytes[i]^bytes[i+1]^bytes[i+2]^bytes[i+3],16777619);return(h>>>0).toString(16);};
   for(let level=1;level<=48;level++){t.start(8821,level);t.freeze(true);t.model.words=[];t.flush();const before=JSON.stringify(m.snapshot()),layer=r.roomLayer();const ctx=layer.getContext('2d',{willReadFrequently:true});const pixels=ctx.getImageData(62,253,1075,342).data;
    seen.push({level,title:m.info.title,art:r.visualSnapshot().chapterArt,artTitle:r.visualSnapshot().chapterArtTitle,hash:hash(pixels),unchanged:before===JSON.stringify(m.snapshot()),cache:r.sceneCache.size});if(level%4===0)await new Promise(requestAnimationFrame);
   }return seen;}''')
  assert len(result)==48;assert len({v['hash']for v in result})==48;assert len({v['art']for v in result})==48
  assert all(v['title']==v['artTitle'] and v['unchanged'] and v['cache']<=2 for v in result),result
  evidence['chapters']=result
 check('All 48 actual chapter titles have distinct rasterized scenery; scene cache stays bounded',all_stages)
 def sequence():
  start(5);api('m.progress=m.config.quota-1;m.words=[];t.word("FINAL","normal",550,280);t.flush();');page.locator('#typing-input').fill('FINAL');page.keyboard.press('Enter');api('t.skipOutcome();');page.locator('[data-action="next"]').click();page.wait_for_timeout(70)
  assert api('return t.visual().chapterArtTitle;')=='The Opening Bell';assert api('return m.level;')==6
  api("t.show('menu');t.show('continue');");assert api('return t.visual().chapterArtTitle;')=='The Opening Bell';assert api('return m.level;')==6
 check('Real chapter-5 completion, Next and saved Continue select the right chapter artwork',sequence)
 def revisit():
  hashes=[]
  for lev in [1,10,17,24,28,35,41,48,1]:
   start(lev);value=api("const layer=r.roomLayer();return {level:m.level,id:r.visualSnapshot().chapterArt,hash:layer.toDataURL('image/png').slice(-500),cache:r.sceneCache.size};")
   assert value['cache']<=2;hashes.append(value)
  assert hashes[0]['id']==hashes[-1]['id'] and hashes[0]['hash']==hashes[-1]['hash'];evidence['revisit']=hashes
 check('Revisiting chapters restores their deterministic cosmetics without stale wing layers',revisit)
 def cast(power,key):
  start(19);words();api('m.danger=55;t.flush();');inp=page.locator('#typing-input');inp.fill('LIB');inp.evaluate('(e)=>e.setSelectionRange(1,3)');before=api('return m.snapshot();');page.keyboard.press(key);page.wait_for_timeout(210);after=api('return m.snapshot();')
  assert after['inventory'][power]==before['inventory'][power]-1;assert after['score']==before['score'];assert inp.input_value()=='LIB';assert inp.evaluate('(e)=>[e.selectionStart,e.selectionEnd]')==[1,3]
  if power=='fire':assert len(after['words'])==0 and after['progress']==before['progress']
  if power=='ice':assert after['effects']['ice']==6
  if power=='wind':assert after['danger']==0
  page.wait_for_timeout(550);assert not errors
 for power,key in [('fire','1'),('ice','2'),('slow','3'),('wind','4')]:check(f'{power.upper()} actual keyboard cast preserves input/selection and authoritative rules',lambda p=power,k=key:cast(p,k))
 def freeze_holds():
  start(10);words();page.keyboard.press('2');v0=api('return {words:m.words.map(w=>[w.x,w.y]),world:r.worldTime};');page.wait_for_timeout(300);v1=api('return {words:m.words.map(w=>[w.x,w.y]),world:r.worldTime};');assert v1==v0
  page.keyboard.press('3');assert api('return m.effects.slow;')==8
  api('t.advance(5.9);');assert api('return m.effects.ice;')>0;assert api('return m.effects.slow;')==8
  api('t.advance(.2);');assert api('return m.effects.ice;')==0;assert api('return m.effects.slow;')<8;assert api('return r.frostEcho;')>0
  page.wait_for_timeout(820);assert api('return r.frostEcho;')==0;assert api('return r.worldTime;')>v1['world']
 check('ICE freezes drift as well as words; queued SLOW waits, thaw clears and movement resumes',freeze_holds)
 def frost_ink():
  start();data=page.evaluate('''async()=>{const t=__TM_TEST__,r=t.renderer;let count=0,fail=[];const mask=document.createElement('canvas');mask.width=1550;mask.height=200;const m=mask.getContext('2d',{willReadFrequently:true});
   const texts=['I','INK','WONDER','STORY','CLOCKWORK','EXTRAORDINARY','UNDERSTANDING','CONSTELLATION','BIOLUMINESCENT','W'.repeat(24)];
   for(const scale of [.72,.83555556,1.18]){r.setViewport(scale);for(const kind of ['normal','fire','ice','slow','wind','bonus'])for(const text of texts){const l=r.layout({text,kind,width:112});const tex=r.elemental.cardFrostTexture(l.width,l.height),fx=tex.getContext('2d',{willReadFrequently:true}),f=fx.getImageData(0,0,tex.width,tex.height).data;
     m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,1550,200);m.setTransform(2,0,0,2,(l.width+32),(l.height+32));m.font=`700 ${l.fontSize}px Georgia, serif`;m.textAlign='left';m.textBaseline='middle';m.fillStyle='#fff';m.fillText(text,l.textX,0,l.textMaxWidth);const ink=m.getImageData(0,0,tex.width,tex.height).data;let overlap=0;
     for(let i=3;i<f.length;i+=4)if(f[i]>24&&ink[i]>24)overlap++;
     if(overlap)fail.push({text,kind,scale,overlap});count++;if(count%30===0)await new Promise(requestAnimationFrame);
    }}return {count,fail};}''')
  assert data['count']==180;assert not data['fail'],data['fail'];evidence['iceInk']=data
 check('180 native raster masks prove frozen-card decoration never covers the word lettering',frost_ink)
 def animations():
  start();result=api('''const c=document.createElement('canvas');c.width=1200;c.height=900;const x=c.getContext('2d');let count=0;for(const power of ['fire','ice','slow','wind'])for(let i=0;i<=64;i++){r.drawSpell(x,{power,t:.65*i/64,life:.65});count++;}return {count,cache:r.elemental.snapshot()};''');assert result['count']==260;evidence['spellSampling']=result
  api("for(const kind of ['fire','ice','normal','slow','wind','bonus']){r.addDeath({id:26,text:'EXTRAORDINARY',kind,x:580,y:320,width:112},kind);}t.flush();")
  for _ in range(4):page.wait_for_timeout(190)
  assert api('return r.deaths.length;')==0;assert not errors
 check('260 native spell animation samples and all six destruction paths render and finish',animations)
 def pause():
  start();words();page.keyboard.press('2');page.wait_for_timeout(90);page.keyboard.press('Escape');v=api('return {age:r.iceAge,world:r.worldTime,fx:r.spells.map(s=>s.t),m:m.snapshot()};');page.wait_for_timeout(180);assert api('return {age:r.iceAge,world:r.worldTime,fx:r.spells.map(s=>s.t),m:m.snapshot()};')==v
  page.locator('[data-action="resume"]').click();page.wait_for_timeout(110);assert api('return r.iceAge;')>v['age']
 check('Pause freezes new FIRE/ICE timelines and resumes them without consuming game time',pause)
 def reduced():
  start(24);words();page.keyboard.press('2');api('t.setSettings({motion:false,contrast:true});');page.wait_for_timeout(140)
  w=api('return t.visual();');assert all(len(x['lines'])==1 for x in w['readability']);assert w['chapterArtTitle']=='The Frozen Seal';world=w['worldTime'];page.wait_for_timeout(150);assert api('return r.worldTime;')==world
  assert api('return r.deaths.length+r.arrivals.length+r.particles.length;')==0
  page.keyboard.press('1');page.wait_for_timeout(100);assert api('return m.words.length;')==0
  api('t.setSettings({motion:true});t.start(991,1);t.freeze(true);');assert api('return m.effects.ice;')==0;assert api('return r.frostEcho;')==0
 check('Reduced motion/high contrast keep chapter identity and word ink without particle or drift animation',reduced)
 def reset_state():
  for action in ['new','menu','retry']:
   start(5);words();page.keyboard.press('2');page.keyboard.press('1');page.wait_for_timeout(40)
   if action=='menu':api("t.show('menu');t.start(114,2);")
   elif action=='retry':
    api("m.danger=100;m.checkGameOver();t.flush();t.skipOutcome();");page.locator('[data-action="retry-chapter"]').click()
   else:api('t.start(715,3);')
   api('t.freeze(true);t.flush();');assert api('return r.deaths.length;')==0;assert api('return r.frostEcho;')==0;assert api('return m.effects.ice;')==0
 check('Menu, New game and Retry clear transient frost/flames rather than carrying them into another run',reset_state)
 def bounded():
  start();d=page.evaluate('''async()=>{const t=__TM_TEST__,r=t.renderer,before=JSON.stringify(t.snapshot());for(let i=0;i<190;i++){r.elemental.cardFrostTexture(112+(i*13)%590,60);if(i%24===0)await new Promise(requestAnimationFrame);}return {...r.elemental.snapshot(),same:before===JSON.stringify(t.snapshot())};}''')
  assert d['entries']<=48 and d['bytes']<=12*1024*1024 and d['same'];evidence['elementalCache']=d
 check('190 varying freeze-card surfaces stay within the 12 MiB/48-entry effect cache budget',bounded)
 def screenshots():
  page.wait_for_function('!document.querySelector("#toast").classList.contains("visible")',timeout=8000)
  for wh in [(1366,768),(1920,1080)]:
   page.set_viewport_size({'width':wh[0],'height':wh[1]})
   for level in [1,10,17,24,28,35,41,48]:
    start(level);words();page.locator('#typing-input').fill('CRY');page.mouse.move(1,1);page.wait_for_timeout(280)
    assert api('return t.visual().readability.every(w=>w.lines.length===1);');page.screenshot(path=str(SHOTS/f'chapter-{level:02d}-{wh[0]}-{args.mode}.png'))
  page.set_viewport_size({'width':1366,'height':768});start(25);words();page.keyboard.press('1');page.wait_for_timeout(175);page.screenshot(path=str(SHOTS/f'fire-{args.mode}.png'));page.wait_for_timeout(650)
  start(19);words();page.keyboard.press('2');page.wait_for_timeout(320);page.screenshot(path=str(SHOTS/f'ice-{args.mode}.png'))
 check('Actual chapter comparison and FIRE/ICE captures at laptop and 1080p sizes',screenshots)
 def longword():
  start(24);api("t.word('BIOLUMINESCENT','ice',600,320);t.flush();");page.keyboard.press('2');page.locator('#typing-input').fill('BIOLUMINESCENT');assert api('return m.correct;')==0;page.keyboard.press('Enter');assert api('return m.correct;')==1
  api("t.word('UNDERSTANDING','fire',600,320);t.flush();");page.locator('#typing-input').fill('UNDERXTANDING');page.locator('#typing-input').evaluate('(e)=>e.setSelectionRange(5,6)');page.keyboard.type('S');page.keyboard.press('Enter');assert api('return m.correct;')==2
 check('Full long-word entry, selected-letter correction and Enter work inside the new ICE visuals',longword)
 def finalgap():
  start(5);api('m.words=[];m.progress=13;m.stageCorrect=13;m.danger=40;m.spawnClock=.4;t.flush();t.freeze(false);');page.keyboard.press('4')
  page.wait_for_function('__TM_TEST__.model.words.length===1',timeout=4000);word=api('return m.words[0].text;');page.locator('#typing-input').fill(word);page.keyboard.press('Enter');assert api('return m.phase;')=='level-clear';api('t.skipOutcome();');page.locator('[data-action="next"]').click();assert api('return m.level;')==6
 check('Real RAF still generates and accepts level 5’s final word after WIND; chapter 6 opens',finalgap)
 check('Completed suite has no unhandled JavaScript exceptions',lambda:(_ for _ in ()).throw(AssertionError(errors)) if errors else None)
 report={'version':'3.4.0','mode':args.mode,'scope':__doc__,'browser':b.version,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'tests':rows,'passed':sum(r['status']=='PASS'for r in rows),'failed':sum(r['status']=='FAIL'for r in rows),'errors':errors,'evidence':evidence}
 (OUT/f'chapter-art-{args.mode}.json').write_text(json.dumps(report,indent=2));b.close()
 if report['failed']:raise SystemExit(1)
