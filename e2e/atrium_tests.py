#!/usr/bin/env python3
"""Open Atrium: shipping renderer/input with controlled scenes, not human QA.
The browser runs actual standalone / dist modules via documented in-memory
transport. No artwork, UI, gameplay, scoring or rendering function is replaced.
"""
from pathlib import Path
import argparse,json,time,hashlib,traceback
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
from module_fixture import module_fixture
ROOT=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--mode',choices=['standalone','modules'],default='standalone');args=a.parse_args()
OUT=ROOT/'qa363';SHOTS=OUT/'atrium-screenshots';SHOTS.mkdir(parents=True,exist_ok=True)
rows=[];errors=[];evidence={}
VP=[(1920,1080),(1440,900),(1366,768),(1280,720),(1024,768),(1024,600),(800,600),(960,540),(640,480),(2560,1080),(768,1024),(360,640)]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1366,'height':768});page.set_default_timeout(12000);page.on('pageerror',lambda e:errors.append(str(e)))
 source=inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT)
 page.set_content(source);page.wait_for_function('!!window.__TM_TEST__');page.wait_for_timeout(5100)
 def api(s):return page.evaluate('(()=>{const t=__TM_TEST__,m=t.model,r=t.renderer;'+s+'})()')
 def start(level=1,danger=0,contrast=False,motion=False):
  page.mouse.move(1,1)
  page.evaluate('''o=>{const t=__TM_TEST__,m=t.model;t.setSettings({motion:o.motion,contrast:o.contrast,music:false,sfx:false,muted:true,hints:false,resumeCountdown:false,pace:'classic'});t.start(36391,o.level);t.freeze(true);m.words=[];m.danger=o.danger;m.inventory={fire:2,ice:2,slow:2,wind:2};const r=t.renderer;r.shownDanger=o.danger;t.flush();}''',dict(level=level,danger=danger,contrast=contrast,motion=motion))
 def words():api("[['LIBRARY','normal',415,245],['EMBER','fire',820,245],['CLOCKWORK','slow',435,370],['CRYSTAL','ice',820,370],['WONDER','wind',414,516],['CONSTELLATION','bonus',800,516]].forEach(a=>t.word(...a));t.flush();")
 def shot(name):page.screenshot(path=str(SHOTS/f'{name}-{args.mode}.png'))
 def check(name,f):
  st=time.monotonic()
  try:f();assert not errors,errors;row={'name':name,'status':'PASS','seconds':round(time.monotonic()-st,3)}
  except Exception as e:
   row={'name':name,'status':'FAIL','error':str(e),'trace':traceback.format_exc(),'seconds':round(time.monotonic()-st,3)}
   try:shot('failure-'+str(len(rows)+1))
   except:pass
  rows.append(row);print(json.dumps(row),flush=True)
 def identity():
  assert page.title().endswith('v3.6.3');assert api('return t.info.version;')=='3.6.3';assert api('return t.info.ruleset;')=='typekeeper-3.2.1'
  q=b.new_page();qe=[];q.on('pageerror',lambda e:qe.append(str(e)))
  q.set_content(inline_fixture(ROOT,False) if args.mode=='standalone' else module_fixture(ROOT,False));q.wait_for_selector('[data-action="start"]');assert q.evaluate('typeof __TM_TEST__')=='undefined';assert not qe;q.close()
 check('Matching 3.6.3 identity and exact non-diagnostic startup',identity)
 def prewarmed():
  d=api('return r.atrium.snapshot();');assert d['entries']==2 and d['builds']==2 and d['status']=='ready';assert d['bytes']==7584000;evidence['prewarmed']=d
 check('Both bounded atmosphere surfaces are built under loading, before the first key',prewarmed)
 def protected():
  start();d=api('''const a=r.atrium.surfaces.get(false),p=a.getContext('2d').getImageData(0,0,1200,790).data;let leaks=0,opaque=0;for(let y=0;y<790;y++)for(let x=0;x<1200;x++){const v=p[(y*1200+x)*4+3];if((x<=212||x>=988||y<=54||y>=742)&&v)leaks++;if(v===255)opaque++;}return {leaks,opaque};''');assert d['leaks']==0 and d['opaque']>10000;evidence['protectedPixels']=d
 check('Actual raster leaves near shelves, columns, desk and all four stage edges untouched',protected)
 def feather():
  d=api('''const a=r.atrium.surfaces.get(false),p=a.getContext('2d').getImageData(0,0,1200,790).data,at=(x,y)=>p[(y*1200+x)*4+3];let stepX=0,stepY=0;for(let x=1;x<1200;x++)stepX=Math.max(stepX,Math.abs(at(x,398)-at(x-1,398)));for(let y=1;y<790;y++)stepY=Math.max(stepY,Math.abs(at(600,y)-at(600,y-1)));return {stepX,stepY,oldTopJump:Math.abs(at(600,136)-at(600,135)),oldBottomJump:Math.abs(at(600,675)-at(600,674))};''');assert max(d.values())<=4;evidence['feather']=d
 check('Feather is continuous in actual pixels; the old sheet top/bottom no longer forms an alpha edge',feather)
 def room_detail():
  d=api('''const src=document.getElementById('library-background'),a=document.createElement('canvas');a.width=1200;a.height=790;const c=a.getContext('2d');c.drawImage(src,0,0,1200,900);const s=c.getImageData(0,0,1200,790).data,n=r.atrium.surfaces.get(false).getContext('2d').getImageData(0,0,1200,790).data;let oldC=0,newC=0,sumA=0,sumB=0,aa=0,bb=0,ab=0,k=0;for(let y=245;y<545;y+=3)for(let x=450;x<750;x+=3){const i=(y*1200+x)*4,la=.2126*s[i]+.7152*s[i+1]+.0722*s[i+2],lb=.2126*n[i]+.7152*n[i+1]+.0722*n[i+2];oldC+=Math.max(s[i],s[i+1],s[i+2])-Math.min(s[i],s[i+1],s[i+2]);newC+=Math.max(n[i],n[i+1],n[i+2])-Math.min(n[i],n[i+1],n[i+2]);sumA+=la;sumB+=lb;aa+=la*la;bb+=lb*lb;ab+=la*lb;k++;}return {samples:k,oldChroma:oldC/k,newChroma:newC/k,originalLuma:sumA/k,newLuma:sumB/k,correlation:(k*ab-sumA*sumB)/Math.sqrt((k*aa-sumA*sumA)*(k*bb-sumB*sumB))};''')
  assert d['newChroma']<d['oldChroma']*.45;assert d['correlation']>.97;assert d['newLuma']<d['originalLuma']+6;evidence['artTransfer']=d
 check('Original painted depth survives while central green saturation is reduced, without a bright haze',room_detail)
 def contrast_grade():
  d=api('''const a=r.atrium.surfaces.get(false).getContext('2d').getImageData(550,300,100,150).data,b=r.atrium.surfaces.get(true).getContext('2d').getImageData(550,300,100,150).data;let bright=0,alpha=0;for(let i=0;i<a.length;i+=4){if(b[i]>a[i]||b[i+1]>a[i+1]||b[i+2]>a[i+2])bright++;if(a[i+3]!==b[i+3])alpha++;}return {bright,alpha};''');assert d=={'bright':0,'alpha':0}
 check('High contrast darkens background pixels without altering the feather boundary',contrast_grade)
 def chapters():
  d=page.evaluate('''async()=>{const t=__TM_TEST__,r=t.renderer,results=[];for(let level=1;level<=48;level++){for(const contrast of [false,true]){t.setSettings({contrast,motion:false});t.start(900,level);t.freeze(true);t.model.words=[];const before=JSON.stringify(t.snapshot());const a=r.roomLayer();const p=a.getContext('2d').getImageData(233,136,735,538).data;let h=2166136261;for(let i=0;i<p.length;i+=29)h=Math.imul(h^p[i],16777619);results.push({level,contrast,unchanged:before===JSON.stringify(t.snapshot()),cache:r.sceneCache.size,atr:r.atrium.snapshot(),hash:(h>>>0).toString(16)});}if(level%3===0)await new Promise(requestAnimationFrame);}return results;}''')
  assert len(d)==96 and all(v['unchanged'] and v['cache']<=2 and v['atr']['builds']==2 for v in d);assert len({v['hash'] for v in d if not v['contrast']})==1;evidence['chapters']=d
 check('All 48 chapters and both contrast settings share a calm center without changing simulation or growing caches',chapters)
 def no_new_panel():
  assert page.locator('#stage > canvas').count()==1
  assert api('return r.sceneCache.size;')<=2
  assert page.locator('#typing-input').count()==1
 check('No extra DOM screen, extra input field or duplicate UI canvas is introduced',no_new_panel)
 def live_readback():
  start(motion=True);words()
  d=page.evaluate('''()=>new Promise(resolve=>{const p=CanvasRenderingContext2D.prototype,old=p.getImageData;let reads=0,n=0;p.getImageData=function(...a){reads++;return old.apply(this,a);};function step(){if(++n===60){p.getImageData=old;resolve({reads,frames:n,atlas:__TM_TEST__.renderer.atrium.snapshot()});}else requestAnimationFrame(step);}requestAnimationFrame(step);})''')
  assert d['reads']==0 and d['atlas']['builds']==2;evidence['frameReadback']=d
 check('60 live rendered frames perform zero pixel readbacks after loading',live_readback)
 def toggles():
  start();before=api('return m.snapshot();');d=page.evaluate('''async()=>{const t=__TM_TEST__,r=t.renderer;for(let i=0;i<120;i++){t.setSettings({contrast:!!(i%2)});r.roomLayer();if(i%12===0)await new Promise(requestAnimationFrame);}return r.atrium.snapshot();}''');assert api('return m.snapshot();')==before;assert d['entries']==2 and d['builds']==2;evidence['toggleCache']=d
 check('120 accessibility toggles reuse the same two surfaces and preserve the current run',toggles)
 for w,h in VP:
  def viewport(w=w,h=h):
   page.set_viewport_size(dict(width=w,height=h));page.wait_for_timeout(70);start(35,95);words();page.locator('#typing-input').fill('CRY');page.wait_for_timeout(100)
   d=api('''const box=s=>{const e=document.querySelector(s),b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom};};return {cards:r.visualSnapshot().readability,score:box('.score-panel'),chapter:box('.chapter-panel'),paper:box('.typing-dock'),stage:box('#stage'),canvas:[r.canvas.width,r.canvas.height],cache:r.atrium.snapshot()};''')
   assert all(len(c['lines'])==1 for c in d['cards']);assert d['score']['right']<d['chapter']['x'];assert d['stage']['x']>=-1 and d['stage']['right']<=w+1;assert d['paper']['right']<=d['stage']['right'];assert d['cache']['builds']==2
   evidence.setdefault('viewports',[]).append(dict(width=w,height=h,**d))
   if (w,h) in [(1366,768),(1920,1080),(800,600)]:shot(f'pressure-{w}x{h}')
  check(f'{w}x{h}: high-pressure words and existing HUD fit without a new panel or overlap',viewport)
 def keyboard():
  page.set_viewport_size(dict(width=1366,height=768));start();api("t.word('BOOK','normal',465,260);t.word('BOOKCASE','normal',740,430);t.flush();");inp=page.locator('#typing-input');inp.fill('BOOX');page.keyboard.press('Backspace');page.keyboard.type('K');assert api('return m.buffer;')=='BOOK';page.keyboard.press('Enter');assert api("return m.words.map(w=>w.text);")==['BOOKCASE'];assert api('return m.correct;')==1;assert inp.input_value()==''
 check('Real input, Backspace and exact-word priority still work over the open chamber',keyboard)
 for power,key in [('fire','1'),('ice','2'),('slow','3'),('wind','4')]:
  def cast(power=power,key=key):
   start(24,82,motion=True);words();inp=page.locator('#typing-input');inp.fill('LIB');inp.evaluate('(e)=>e.setSelectionRange(1,3)');before=api('return m.snapshot();');page.keyboard.press(key);page.wait_for_timeout(150);after=api('return m.snapshot();');assert inp.input_value()=='LIB';assert inp.evaluate('(e)=>[e.selectionStart,e.selectionEnd]')==[1,3];assert after['score']==before['score'];assert after['inventory'][power]==before['inventory'][power]-1
   if power=='fire':assert len(after['words'])==0
   if power=='ice':assert after['effects']['ice']==6
   if power=='wind':assert after['danger']==0
   shot(f'{power}-in-open-room');page.wait_for_timeout(680)
  check(f'{power.upper()}: actual keyboard cast, input selection, score and resources are unchanged',cast)
 def frozen():
  start(24,60,motion=True);words();page.keyboard.press('2');page.keyboard.press('3');api('t.advance(5.8);');assert api('return m.effects.slow;')==8;assert api('return m.effects.ice;')>0;api('t.advance(.4);');assert api('return m.effects.ice;')==0;assert api('return m.effects.slow;')<8
 check('ICE expiry and queued SLOW keep their original timing against the new background',frozen)
 def pause():
  start(12,75,motion=True);words();page.keyboard.press('2');page.keyboard.press('Escape');a=api('return {model:m.snapshot(),world:r.worldTime,atlas:r.atrium.snapshot()};');page.wait_for_timeout(200);assert api('return {model:m.snapshot(),world:r.worldTime,atlas:r.atrium.snapshot()};')==a;page.locator('[data-action="resume"]').click();assert api('return m.phase;')=='playing'
 check('Pause and resume preserve simulation, partial effects and static atmosphere',pause)
 def static():
  start(19,90,True);words();a=api('return r.roomLayer().toDataURL();');page.wait_for_timeout(180);assert api('return r.roomLayer().toDataURL();')==a;shot('reduced-motion-high-contrast')
 check('Reduced motion retains a static readable environment, with no moving mist or light sweep',static)
 def stress():
  start(42,95,motion=True);api("let i=0;for(const y of [205,306,407,508])for(const x of [350,600,850])t.word(['WONDER','LIBRARY','ARCHIVE','CRYSTAL','LANTERN','WHISPER','STORY','MAGIC','SHIMMER','GARDEN','RHYTHM','SILVER'][i++],i%4===0?'bonus':'normal',x,y);t.flush();")
  page.locator('#typing-input').fill('ARCH');page.wait_for_timeout(250);d=api('return r.visualSnapshot();');assert len(d['readability'])==12 and all(len(c['lines'])==1 for c in d['readability']);shot('twelve-card-pressure')
 check('Twelve live cards at 95 percent paper pressure remain single-row and readable',stress)
 def first_frame():
  start();begin=api('return r.atrium.snapshot().builds;');page.locator('#typing-input').fill('INK');assert api('return r.atrium.snapshot().builds;')==begin;assert api('return m.buffer;')=='INK'
 check('The first keystroke does not rebuild or synchronously process backdrop pixels',first_frame)
 def cold():
  d=api('''const a=new r.atrium.constructor(),src=document.getElementById('library-background'),start=performance.now();a.layerFor(src,false);a.layerFor(src,true);return {milliseconds:performance.now()-start,...a.snapshot()};''');assert d['entries']==2 and d['builds']==2;evidence['coldBuildSample']=d
 check('A fresh atmosphere instance builds exactly two bounded surfaces; cold cost is recorded',cold)
 def missing():
  d=api("const a=new r.atrium.constructor();const layer=a.layerFor({complete:false,naturalWidth:0},false);return {layer,...a.snapshot()};");assert d['layer'] is None and d['entries']==0
 check('Unavailable original art cannot create a substitute rectangle or throw from the atmosphere',missing)
 def clear():
  start(5);api("m.words=[];m.progress=m.config.quota-1;m.stageCorrect=m.progress;t.word('FINAL','normal',590,335);t.flush();");page.locator('#typing-input').fill('FINAL');page.keyboard.press('Enter');assert api('return m.phase;')=='level-clear';api('t.skipOutcome();');page.locator('[data-action="next"]').click();assert api('return m.level;')==6;assert api('return r.atrium.snapshot().builds;')==2
 check('The final word clears Chapter 5 and opens Chapter 6 without an atmosphere rebuild',clear)
 def showcase():
  start(1);words();api('m.score=12450;t.flush();');page.locator('#typing-input').fill('CLOCK');page.wait_for_timeout(110);shot('open-atrium-gameplay')
  for lev in [1,10,17,24,28,35,41,48]:
   start(lev);api("t.word('WONDER','normal',444,307);t.word('CRYSTAL','ice',786,431);t.flush();");page.locator('#typing-input').fill('WON');page.wait_for_timeout(70);shot(f'chapter-{lev:02d}')
 check('Actual rendered chapter and gameplay previews use the shipping painter',showcase)
 check('Completed Open Atrium suite has zero unhandled page exceptions',lambda:None)
 report={'version':'3.6.3','mode':args.mode,'scope':__doc__,'browser':b.version,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'tests':rows,'passed':sum(x['status']=='PASS' for x in rows),'failed':sum(x['status']=='FAIL' for x in rows),'errors':errors,'evidence':evidence}
 (OUT/f'atrium-{args.mode}.json').write_text(json.dumps(report,indent=2)+'\n');b.close()
 raise SystemExit(bool(report['failed']))
