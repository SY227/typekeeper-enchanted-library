#!/usr/bin/env python3
"""Normal-clock automated keyboard journey, not a human playtest. No forced words, accelerated model ticks or awarded progress."""
from pathlib import Path
import sys,json,time,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa364';OUT.mkdir(exist_ok=True)
sys.path.insert(0,str(ROOT/'e2e'));from inline_fixture import inline_fixture
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
 page=b.new_page(viewport={'width':1366,'height':768},record_video_dir=str(OUT/'video'),record_video_size={'width':1366,'height':768});page.set_default_timeout(5000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(inline_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__',timeout=15000)
 page.evaluate("()=>{const t=__TM_TEST__;t.setSettings({motion:true,hints:true,music:true,sfx:true,muted:false,resumeCountdown:false});t.start(83718,1);window.lifeLog=[];}")
 started=time.monotonic();lastTime=-1;frozenSince=None;actions=0;history=[];seen13=False;level=0
 while time.monotonic()-started<170:
  s=page.evaluate('()=>({...__TM_TEST__.snapshot(),clock:__TM_TEST__.model.spawnClock,audio:__TM_TEST__.audioState().musicStatus,screen:document.querySelector("#screen-layer").innerText.slice(0,80)})')
  if s['level']!=level:
   level=s['level'];print('level',level,'at',round(time.monotonic()-started,1),'audio',s['audio'],flush=True);history.append(s)
  if errors:print('ERRORS',errors,flush=True);break
  if s['phase']=='level-clear':
   page.wait_for_timeout(980);page.locator('[data-action="next"]').click();continue
  if level>=7:break
  if s['time']==lastTime and s['phase']=='playing':
   frozenSince=frozenSince or time.monotonic()
   if time.monotonic()-frozenSince>3:print('FROZEN',s,flush=True);break
  else:frozenSince=None
  lastTime=s['time']
  if level==5 and s['progress']==13 and not seen13:
   seen13=True;print('LEVEL 5:13/14',s,flush=True);page.screenshot(path=str(OUT/'live-5-13.png'))
  if s['phase']=='playing' and s['words']:
   # All input through real keyboard, no direct complete or forced clock advancement.
   word=sorted(s['words'],key=lambda w:-w['y'])[0]
   if word['y']>188:
    page.locator('#typing-input').focus();page.keyboard.type(word['text'],delay=25);page.keyboard.press('Enter');actions+=1
  page.wait_for_timeout(45)
 final=page.evaluate('()=>__TM_TEST__.snapshot()')
 report={'version':'3.6.4','scope':__doc__,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'browser':b.version,'seconds':round(time.monotonic()-started,2),'wordsTyped':actions,'passed5_13':seen13,'last':final,'levels':history,'pageerrors':errors}
 (OUT/'live-journey.json').write_text(json.dumps(report,indent=2));page.screenshot(path=str(OUT/'live-end.png'));print(json.dumps({k:v for k,v in report.items() if k!='levels'}),flush=True)
 assert seen13 and final['level']>=7 and not errors, report
 video=page.video;page.context.close();video.save_as(str(OUT/'normal-clock-journey.webm'));video.delete();b.close()
