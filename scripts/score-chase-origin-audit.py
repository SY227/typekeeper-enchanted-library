#!/usr/bin/env python3
"""Attempt unchanged shipping game on native HTTP and file URLs. Controlled saved
record fixture tests browser persistence, not a human-earned personal record.
A transport failure is reported as an environment limit, not counted as a pass.
"""
from pathlib import Path
import json,subprocess,time,urllib.request,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa362';OUT.mkdir(exist_ok=True)
rows=[]
KEY='typekeeper-enchanted-library-v3.2.1'
record={'ruleset':'typekeeper-3.2.1','pace':'classic','mode':'campaign','startLevel':1,'chapter':1,'metric':'running-total','score':1580}
fixture={'version':3,'settings':{'muted':True,'music':False,'sfx':False,'resumeCountdown':False},'scoreChaseBests':{'running-v1|typekeeper-3.2.1|classic|campaign|1|1':record}}
log=(OUT/'origin-server.log').open('w')
server=subprocess.Popen(['node','scripts/serve.mjs','--port','4592'],cwd=ROOT,stdout=log,stderr=subprocess.STDOUT)
try:
 for _ in range(60):
  try:
   with urllib.request.urlopen('http://127.0.0.1:4592/release.json',timeout=.2)as r:
    version=json.loads(r.read());assert version['version']=='3.6.2';break
  except OSError:time.sleep(.1)
 else:raise RuntimeError('Native server did not become ready')
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for name,url in [('http-modules','http://127.0.0.1:4592/'),('file-standalone',(ROOT/'PLAY.html').as_uri())]:
   context=browser.new_context(viewport={'width':1366,'height':768});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(12000)
   result={'name':name,'url':url,'unchangedRuntime':True,'controlledSaveFixture':fixture,'steps':[]}
   try:
    response=page.goto(url,wait_until='load',timeout=20000)
    page.wait_for_function('document.querySelector("#loading").hidden',timeout=20000)
    assert 'v3.6.2' in page.title();result['steps'].append('Unchanged shipping game loaded')
    assert not page.evaluate('Boolean(window.__TM_TEST__)');result['steps'].append('Production diagnostic seam absent')
    page.evaluate('(x)=>localStorage.setItem(x.key,JSON.stringify(x.save))',{'key':KEY,'save':fixture})
    page.reload(wait_until='load');page.wait_for_function('document.querySelector("#loading").hidden')
    # Use ordinary button handler, no injected game model or diagnostics.
    button=page.locator('[data-action="start"]')
    if button.count()==0:button=page.locator('[data-action="fresh-start"]')
    assert button.count()==1, page.locator('#screen-layer').inner_text()
    button.click();page.wait_for_timeout(180)
    assert page.locator('#best-value').inner_text()=='1,580';assert page.locator('#score-value').inner_text()=='0'
    assert page.locator('#typing-input').is_visible();result['steps'].append('Browser reload and actual Play button recover scoped BEST 1,580')
    page.keyboard.press('Escape');page.reload(wait_until='load');page.wait_for_function('document.querySelector("#loading").hidden')
    persisted=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
    assert persisted['scoreChaseBests'][next(iter(fixture['scoreChaseBests']))]['score']==1580
    result['steps'].append('Second browser reload preserves saved target')
    assert not errors,errors;result['status']='PASS'
    page.screenshot(path=str(OUT/f'{name}-native.png'))
   except Exception as e:
    result['status']='UNVERIFIED';result['error']=str(e);result['pageerrors']=errors
   rows.append(result);print(json.dumps(result),flush=True);context.close()
  browser.close()
finally:
 server.terminate()
 try:server.wait(timeout=5)
 except subprocess.TimeoutExpired:server.kill();server.wait()
 log.close()
(OUT/'native-origin.json').write_text(json.dumps({'version':'3.6.2','scope':__doc__,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'checks':rows,'passed':sum(x['status']=='PASS' for x in rows),'unverified':sum(x['status']!='PASS'for x in rows)},indent=2))
