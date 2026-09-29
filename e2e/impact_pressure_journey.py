#!/usr/bin/env python3
"""Normal-clock overload/recovery observation. The initial fixture enters Practice
chapter 12; subsequent words, pressure, points and resources are model-earned.
Keyboard agent deliberately waits for misses, then types; not a human playtest.
"""
from pathlib import Path
import json,time,hashlib
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
R=Path(__file__).resolve().parents[1];O=R/'qa360';O.mkdir(exist_ok=True)
rows=[];errs=[];shots=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
 page=b.new_page(viewport={'width':1366,'height':768},record_video_dir=str(O/'video'),record_video_size={'width':1366,'height':768});page.on('pageerror',lambda e:errs.append(str(e)));page.set_default_timeout(5000)
 page.set_content(inline_fixture(R));page.wait_for_function('!!window.__TM_TEST__');page.evaluate("()=>{const t=__TM_TEST__;t.setSettings({motion:true,music:true,sfx:true,muted:false,hints:false,resumeCountdown:false});t.start(16112,12,'practice');}")
 initial=page.evaluate('()=>__TM_TEST__.snapshot()');start=time.monotonic();typing=False;peak=0;words=0;firstPressure=False
 while time.monotonic()-start<38:
  s=page.evaluate('()=>{const t=__TM_TEST__;return {model:t.snapshot(),visual:t.visual(),ink:t.renderer.readability};}')
  m=s['model'];peak=max(peak,m['danger']);rows.append({'wall':round(time.monotonic()-start,3),'phase':m['phase'],'danger':m['danger'],'score':m['score'],'correct':m['correct'],'missed':m['missed'],'words':len(m['words']),'stack':s['visual']['impact']['pile'],'arrivals':s['visual']['arrivals']})
  if errs:raise AssertionError(errs)
  if m['danger']>=75 and not typing:
   typing=True;page.screenshot(path=str(O/'natural-pressure.png'));shots.append('natural-pressure.png')
  if m['phase']!='playing':break
  if typing and m['words']:
   w=max(m['words'],key=lambda w:w['y']);page.locator('#typing-input').focus();page.keyboard.type(w['text'],delay=45);page.keyboard.press('Enter');words+=1
  page.wait_for_timeout(65)
 final=page.evaluate('()=>__TM_TEST__.snapshot()');page.screenshot(path=str(O/'natural-recovery.png'));shots.append('natural-recovery.png')
 report={'version':'3.6.2','scope':__doc__,'shippingSHA256':hashlib.sha256((R/'PLAY.html').read_bytes()).hexdigest(),'browser':b.version,'seconds':round(time.monotonic()-start,2),'initial':initial,'peakDanger':peak,'keyboardSubmissions':words,'last':final,'observations':rows,'screenshots':shots,'pageErrors':errs,'passed':peak>=75 and final['missed']>0 and final['correct']>0 and not errs}
 (O/'natural-pressure-journey.json').write_text(json.dumps(report,indent=2));video=page.video;page.context.close();video.save_as(str(O/'natural-pressure-journey.webm'));video.delete();b.close()
 print(json.dumps({k:v for k,v in report.items() if k!='observations'}),flush=True);assert report['passed'],report
