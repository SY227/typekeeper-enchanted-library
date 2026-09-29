#!/usr/bin/env python3
"""v3.6.4 shipping-code integration: authored quotas, bindery, and historical saves.
Uses the documented in-memory transport and an explicit storage adapter because
native browser-origin navigation is blocked here. Not real-device/human QA.
"""
from pathlib import Path
import argparse,base64,io,json,time,traceback,hashlib
from PIL import Image
import numpy as np
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
from module_fixture import module_fixture
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--mode',choices=['standalone','modules'],default='standalone');p.add_argument('--executable',default='/usr/bin/chromium');args=p.parse_args()
OUT=ROOT/'qa364';SHOTS=OUT/'polish-screenshots';SHOTS.mkdir(parents=True,exist_ok=True)
rows=[];errors=[];evidence={};OLD=json.loads((ROOT/'tests/fixtures/v363-save-for-364.json').read_text())
VP=[(1920,1080),(1440,900),(1366,768),(1280,720),(1024,768),(1024,600),(800,600),(960,540),(640,480),(2560,1080),(768,1024),(360,640)]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.executable,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport=dict(width=1366,height=768));page.set_default_timeout(18000);page.on('pageerror',lambda e:errors.append(str(e)))
 html=inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT)
 storage='''<script>const testStorage=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>testStorage.get(k)||null,setItem:(k,v)=>testStorage.set(k,String(v))}});</script>'''
 page.set_content(html.replace('<head>','<head>'+storage));page.wait_for_function('!!window.__TM_TEST__');page.wait_for_timeout(1500)
 def api(s):return page.evaluate('(()=>{const t=__TM_TEST__,m=t.model,r=t.renderer,s=t.store;'+s+'})()')
 initial=api('return s.data;')
 def reset(level=1,pace='classic',danger=0,contrast=False):
  page.mouse.move(1,1)
  page.evaluate('''o=>{const t=__TM_TEST__;t.store.data=structuredClone(o.initial);t.store.save();t.setSettings({pace:o.pace,motion:false,music:false,sfx:false,hints:false,muted:true,resumeCountdown:false,contrast:o.contrast});t.start(4392,o.level);t.freeze(true);t.model.words=[];t.model.danger=o.danger;t.renderer.shownDanger=o.danger;t.model.inventory={fire:1,ice:1,slow:1,wind:1};t.flush();}''',dict(initial=initial,level=level,pace=pace,danger=danger,contrast=contrast))
 def words():api("[['LIBRARY','normal',415,245],['EMBER','fire',820,245],['CLOCKWORK','slow',435,370],['CRYSTAL','ice',820,370],['WONDER','wind',414,516],['CONSTELLATION','bonus',800,516]].forEach(w=>t.word(...w));t.flush();")
 def shot(name):page.screenshot(path=str(SHOTS/f'{name}-{args.mode}.png'))
 def check(name,fn):
  start=time.monotonic()
  try:fn();assert not errors,errors;row={'name':name,'status':'PASS','seconds':round(time.monotonic()-start,3)}
  except Exception as e:
   row={'name':name,'status':'FAIL','seconds':round(time.monotonic()-start,3),'error':str(e),'trace':traceback.format_exc()}
   try:shot('failure-'+str(len(rows)+1))
   except Exception:pass
  rows.append(row);print(json.dumps(row),flush=True)
 def identity():
  assert page.title().endswith('v3.6.4');assert api('return t.info.version;')=='3.6.4';assert api('return t.info.ruleset;')=='typekeeper-3.6.4';assert api('return t.info.buildTag;')=='bound-and-balanced-364'
 check('Shipped document, running model and build tag all identify the new quota release',identity)
 def quotas():
  result=page.evaluate('''async()=>{const t=__TM_TEST__,out=[];for(const pace of ['classic','relaxed','maniac']){t.setSettings({pace,motion:false,music:false,sfx:false});for(let level=1;level<=48;level++){t.start(41,level);t.freeze(true);t.flush();out.push({pace,level,quota:t.model.config.quota,text:document.querySelector('#progress-value').textContent});if(level%6===0)await new Promise(requestAnimationFrame);}}return out;}''')
  assert len(result)==144
  for row in result:
   assert row['quota']!=13;assert row['text'].strip().endswith('/ '+str(row['quota']))
   if row['level'] in [3,4]:assert row['quota']==14
   if row['level'] in [1,2]:assert row['quota']==12
  evidence['quotaMatrix']=result
 check('All 48 chapter HUD denominators agree with the model in all three paces; none is 13',quotas)
 for pace in ['classic','relaxed','maniac']:
  for level in [3,4]:
   def final_word(pace=pace,level=level):
    reset(level,pace)
    for i in range(14):
     api("m.words=[];t.word('BOOK','normal',550,260);t.flush();")
     page.locator('#typing-input').fill('BOOK');page.keyboard.press('Enter')
     assert api('return m.progress;')==i+1
     if i==12:
      assert api('return m.phase;')=='playing';assert page.locator('#progress-value').inner_text()=='13 / 14'
      if pace=='classic':shot(f'chapter-{level}-awaits-fourteenth-word')
    assert api('return m.phase;')=='level-clear';assert api('return m.lastClear.words;')==14
    assert api('return m.stageHistory.length;')==1
   check(f'{pace} chapter {level}: real Enter at word 13 keeps playing; word 14 clears exactly once',final_word)
 def raster_scope():
  reset();png=api('return r.roomLayer().toDataURL("image/png");')
  current=np.array(Image.open(io.BytesIO(base64.b64decode(png.split(',')[1]))).convert('RGBA'))
  baseline=np.array(Image.open(ROOT/'tests/fixtures/v363-reading-room.png').convert('RGBA'))
  change=np.any(current!=baseline,axis=2);allowed=np.zeros(change.shape,dtype=bool)
  allowed[217:392,998:1149]=True;allowed[249:405,60:206]=True;allowed[418:597,65:203]=True
  outside=int(np.count_nonzero(change&~allowed));center=int(np.count_nonzero(change[172:648,226:978]));right=int(np.count_nonzero(change[217:392,998:1149]))
  evidence['rasterScope']={'changedPixels':int(change.sum()),'outsideApprovedShelfAreas':outside,'insideLiveWordCorridor':center,'changedRightBookPixels':right}
  assert outside==0 and center==0 and right>4000,evidence['rasterScope'];words();shot('reading-room-polished')
 check('Real room-layer pixels change only in the shelf art; live-word corridor remains byte-identical',raster_scope)
 def deterministic():
  reset();a=api('return r.roomLayer().toDataURL();');api('r.sceneCache.clear();');b=api('return r.roomLayer().toDataURL();');assert a==b
  before=api('return m.snapshot();');api('r.sceneCache.clear();r.roomLayer();');assert api('return m.snapshot();')==before
 check('Regenerating aged paper/leather produces identical pixels without moving either model RNG',deterministic)
 def cache():
  reset();before=api('return m.snapshot();')
  data=page.evaluate('''async()=>{const t=__TM_TEST__,r=t.renderer,out=[];for(let i=0;i<96;i++){t.model.level=i%48+1;const start=performance.now();r.roomLayer();out.push({level:t.model.level,ms:performance.now()-start,entries:r.sceneCache.size,backdrop:r.atrium.snapshot().builds});if(i%4===0)await new Promise(requestAnimationFrame);}return out;}''')
  assert all(x['entries']<=2 and x['backdrop']==2 for x in data);evidence['sceneCache']={'samples':96,'maxEntries':max(x['entries']for x in data),'medianBuildMs':round(float(np.median([x['ms']for x in data])),2),'maxBuildMs':round(max(x['ms']for x in data),2)}
 check('Repeated traversal of every wing keeps the existing two-layer cache bounded',cache)
 for w,h in VP:
  def viewport(w=w,h=h):
   page.set_viewport_size(dict(width=w,height=h));page.wait_for_timeout(70);reset(3,danger=95);words();page.locator('#typing-input').fill('CRY');page.wait_for_timeout(50)
   geo=api('''const box=q=>{const b=document.querySelector(q).getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom};};return {stage:box('#stage'),score:box('#score-panel'),chapter:box('.chapter-panel'),paper:box('.typing-dock'),labels:[...document.querySelectorAll('.spell-status')].length,cards:r.visualSnapshot().readability};''')
   assert geo['stage']['x']>=-1 and geo['stage']['right']<=w+1;assert geo['score']['right']<geo['chapter']['x'];assert geo['paper']['right']<=geo['stage']['right'];assert all(len(c['lines'])==1 for c in geo['cards']);assert page.locator('#progress-value').inner_text()=='0 / 14'
   evidence.setdefault('viewports',[]).append({'width':w,'height':h,'cards':len(geo['cards'])})
   if (w,h) in [(1920,1080),(1366,768),(1024,600),(800,600)]:shot(f'polish-pressure-{w}x{h}')
  check(f'{w}x{h}: fourteen-word HUD, targeting, paper input and score retain their layout under pressure',viewport)
 def accessibility():
  page.set_viewport_size(dict(width=1366,height=768));reset(1,contrast=True);words();api('t.setSettings({motion:false,contrast:true});t.flush();');shot('reading-room-high-contrast');assert api('return r.atrium.snapshot().builds;')==2
 check('High contrast and reduced motion retain the physical book without new background animation',accessibility)
 def old_import():
  reset();api('t.show("records");');page.locator('#save-file').set_input_files({'name':'v363.json','mimeType':'application/json','buffer':json.dumps(OLD).encode()});page.wait_for_timeout(160)
  for name in ['chapterBests','scoreChaseBests']:assert api('return s.data.'+name+';')==OLD[name]
  assert len(api('return s.records;'))==3;api('t.show("menu");');page.locator('[data-action="continue"]').click();api('t.freeze(true);');assert api('return m.level;')==3;assert api('return m.config.quota;')==14;assert page.locator('#best-label').inner_text()=='EARLIER RULES';shot('continued-earlier-score-profile')
 check('Actual file import retains old PBs and displays the continued old run as EARLIER RULES',old_import)
 def restart_preserves():
  old_import();before=api('return {progress:s.data.progress,chapterBests:s.data.chapterBests,scoreChaseBests:s.data.scoreChaseBests};');api('t.show("menu");');page.locator('[data-action="new-confirm"]').click();page.locator('[data-action="fresh-start"]').click();api('t.freeze(true);');assert api('return m.level;')==1;assert api('return m.scoreRuleset;')=='typekeeper-3.6.4';assert page.locator('#best-label').inner_text()=='FIRST RUN';after=api('return {progress:s.data.progress,chapterBests:s.data.chapterBests,scoreChaseBests:s.data.scoreChaseBests};');assert before==after
  cp=api('return s.checkpoint();');api('t.show("menu");t.show("map");');page.locator('button[data-wing="1"]').click();page.locator('[data-stage="12"]').click();assert api('return m.level;')==12;assert api('return s.checkpoint();')==cp
 check('After migration, Fresh Journey preserves all unlocks/PBs and later chapter Practice does not overwrite Continue',restart_preserves)
 def exported():
  api('t.show("records");')
  with page.expect_download() as event:page.locator('[data-action="export-save"]').click()
  data=json.loads(Path(event.value.path()).read_text());assert data['appVersion']=='3.6.4';assert data['chapterBests']==OLD['chapterBests'];assert data['scoreChaseBests']==OLD['scoreChaseBests'];assert data['progress']['classic']['unlocked']==13
  evidence['oldSaveExport']={'appVersion':data['appVersion'],'historicalChapterBests':len(data['chapterBests']),'historicalRunningBests':len(data['scoreChaseBests']),'keptRecords':len(data['records'])}
 check('Actual download/export preserves historical score collections and earned chapter access',exported)
 for power,key in [('fire','1'),('ice','2'),('slow','3'),('wind','4')]:
  def spell(power=power,key=key):
   reset(1,danger=76);words();page.locator('#typing-input').focus();page.keyboard.press(key);assert api('return m.casts.'+power+';')==1
   if power=='fire':assert api('return m.progress;')==0
   elif power=='ice':assert api('return m.effects.ice;')>0
   elif power=='slow':assert api('return m.effects.slow;')>0
   else:assert api('return m.danger;')==0
   page.wait_for_timeout(90);shot('book-with-'+power)
  check(f'{power.upper()} keeps its original action/resource behavior beside the new shelf artwork',spell)
 def clean_start():
  q=browser.new_page();qe=[];q.on('pageerror',lambda e:qe.append(str(e)));source=inline_fixture(ROOT,False) if args.mode=='standalone' else module_fixture(ROOT,False);q.set_content(source);q.wait_for_selector('[data-action="start"]');assert q.evaluate('typeof __TM_TEST__')=='undefined';assert q.title().endswith('v3.6.4');assert not qe;q.close()
 check('Unmodified production document starts without exposing the diagnostic API',clean_start)
 report={'version':'3.6.4','mode':args.mode,'scope':__doc__,'browser':browser.version,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'passed':sum(x['status']=='PASS'for x in rows),'failed':sum(x['status']=='FAIL'for x in rows),'tests':rows,'pageerrors':errors,'evidence':evidence}
 (OUT/f'production-polish-{args.mode}.json').write_text(json.dumps(report,indent=2));browser.close();assert report['failed']==0,report
