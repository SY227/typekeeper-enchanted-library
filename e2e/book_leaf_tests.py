#!/usr/bin/env python3
"""Folio/usage-line regression tests on actual shipping bytes in Chromium.
Two supported fixtures: embedded PLAY.html or dist ES modules loaded from Blob URLs.
Only existing diagnostic access and local asset/import URLs are adapted. No gameplay
or painting implementation is replaced. This is not a live Vercel/device test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
from module_fixture import module_fixture
import argparse,json,hashlib,time,base64
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/qa';SHOTS=ROOT/'docs/screenshots/v3.3.6'
LABELS={'fire':'Clear words','ice':'Freeze words','slow':'Slow words','wind':'Clear pile'}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--executable',default='/usr/bin/chromium');ap.add_argument('--mode',choices=['standalone','modules'],default='standalone');a=ap.parse_args()
 OUT.mkdir(exist_ok=True,parents=True);SHOTS.mkdir(exist_ok=True,parents=True);rows=[];errors=[];evidence={}
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path=a.executable,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=b.new_page(viewport={'width':1366,'height':768});page.set_default_timeout(7000);page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_fixture(ROOT) if a.mode=='standalone' else module_fixture(ROOT));page.wait_for_function('!!window.__TM_TEST__')
  def api(s):return page.evaluate('(()=>{const t=__TM_TEST__;'+s+'})()')
  def snap():return api('return t.snapshot();')
  def run(level=8):
   api(f"t.setSettings({{pace:'classic',motion:false,music:false,sfx:false,muted:true,hints:false,spellPulse:true,contrast:false,detailedHUD:false,resumeCountdown:false}});t.start(521,{level},'practice');t.freeze(true);t.model.words=[];t.model.spawnClock=100;t.model.inventory={{fire:2,ice:2,slow:2,wind:2}};t.model.danger=38;t.word('LIBRARY','normal',550,335);t.flush();")
  def check(name,fn):
   start=time.monotonic()
   try:fn();row={'name':name,'status':'PASS','seconds':round(time.monotonic()-start,3)}
   except Exception as e:
    row={'name':name,'status':'FAIL','error':repr(e),'seconds':round(time.monotonic()-start,3)}
    try:page.screenshot(path=str(OUT/f'folio-failure-{a.mode}-{len(rows)+1}.png'),timeout=2500)
    except Exception:pass
   rows.append(row);print(row,flush=True)
  def identity():
   assert api('return t.info.version;')=='3.3.6';assert api('return t.info.buildTag;')=='scroll-layout-repair-336'
   assert page.title().endswith('v3.3.6');assert api('return t.info.ruleset;')=='typekeeper-3.2.1'
  check('Shipping title and running folio renderer identify the new 3.3.6 release',identity)
  def captions():
   run();assert page.locator('.spell-use').count()==4
   for i,(power,label) in enumerate(LABELS.items(),1):
    e=page.locator(f'#use-{power}');assert e.is_visible();assert e.locator('.spell-use-label').inner_text()==label;assert e.locator('kbd').inner_text()==str(i)
    assert e.locator('.sr-only').last.inner_text().endswith('click this book.');assert f'use-{power}' in page.locator('#spell-'+power).get_attribute('aria-describedby')
   assert page.locator('.site-footer').count()==0 and page.locator('.typing-hint').count()==0
  check('Exactly four persistent usage lines explain each spell and its existing key',captions)
  def viewport(w,h):
   page.set_viewport_size({'width':w,'height':h});run();page.wait_for_timeout(90)
   v=page.evaluate('''()=>{const stage=document.querySelector('#stage').getBoundingClientRect();return [...document.querySelectorAll('.spell-slot')].map(slot=>{const label=slot.querySelector('.spell-use'),cmd=slot.querySelector('.spell-command'),text=slot.querySelector('.spell-use-label'),book=slot.querySelector('.spell-book'),a=slot.querySelector('.spell-aura');const l=label.getBoundingClientRect(),c=cmd.getBoundingClientRect(),t=text.getBoundingClientRect(),b=book.getBoundingClientRect(),halo=a.getBoundingClientRect();const range=new Range();range.selectNodeContents(text);return {power:slot.dataset.power,x:l.x,y:l.y,w:l.width,h:l.height,stageBottom:stage.bottom,titleBottom:c.bottom,bookBottom:b.bottom,haloBottom:halo.bottom,textRects:range.getClientRects().length,overflow:label.scrollWidth>label.clientWidth,textRight:t.right,right:l.right,font:getComputedStyle(label).fontSize,whiteSpace:getComputedStyle(text).whiteSpace};});}''')
   evidence.setdefault('viewports',[]).append({'size':[w,h],'captions':v})
   assert len(v)==4
   for d in v:
    assert not d['overflow'],d;assert d['textRects']==1 and d['whiteSpace']=='nowrap',d
    assert d['y']>=d['titleBottom'] and d['y']+d['h']<d['stageBottom']-3,d
    assert d['textRight']<=d['right']+.5,d;assert d['haloBottom']<=d['bookBottom']+1,d
   assert v[0]['x']+v[0]['w']<v[1]['x'] and v[2]['x']+v[2]['w']<v[3]['x']
  for wh in [(1366,768),(1920,1080),(1280,720),(1024,768)]:check(f'Usage-line fit and original halo size at {wh[0]}×{wh[1]}',lambda wh=wh:viewport(*wh))
  def keys(power,key,via):
   run();input=page.locator('#typing-input');input.fill('LIBRA');input.evaluate('(e)=>e.setSelectionRange(1,4)');before=snap()
   if via=='key':page.keyboard.press(key)
   else:page.locator(f'#use-{power} .spell-use-label').click()
   after=snap();assert after['inventory'][power]==before['inventory'][power]-1
   assert after['buffer']=='LIBRA';assert input.evaluate('(e)=>[e.selectionStart,e.selectionEnd]')==[1,4]
   assert page.evaluate("document.activeElement.id")=='typing-input';assert after['score']==before['score']
   if power=='fire':assert len(after['words'])==0
   if power=='ice':assert after['effects']['ice']>5.5
   if power=='slow':assert after['effects']['slow']>7.5
   if power=='wind':assert after['danger']==0
  for i,p in enumerate(LABELS,1):
   for via in ['key','caption click']:check(f'{p.upper()} via {via}: one cast, no buffer or selection loss',lambda p=p,i=i,via=via:keys(p,str(i),'key'if via=='key'else'click'))
  def empty():
   run();api('t.model.inventory={fire:0,ice:0,slow:0,wind:0};t.flush();');before=snap()
   for p in LABELS:
    box=page.locator(f'#use-{p} .spell-use-label').bounding_box();page.mouse.click(box['x']+box['width']/2,box['y']+box['height']/2)
   after=snap();assert after['score']==before['score'] and after['danger']==before['danger'];assert all(v==0 for v in after['inventory'].values())
   assert page.locator('.spell-use:visible').count()==4
  check('Empty inventory keeps the hint visible without gifting or consuming a charge',empty)
  def no_waste():
   run();api('t.model.words=[];t.model.danger=0;t.flush();')
   
   for p in ['fire','wind']:
    box=page.locator(f'#use-{p}').bounding_box();page.mouse.click(box['x']+box['width']/2,box['y']+box['height']/2)
   s=snap();assert s['inventory']['fire']==2 and s['inventory']['wind']==2
   assert page.locator('#ready-fire').inner_text()=='STORED' and page.locator('#ready-wind').inner_text()=='STORED'
  check('STORED FIRE and WIND retain no-waste protections with the new captions',no_waste)
  def combo():
   run();page.keyboard.press('2');page.keyboard.press('3');assert page.locator('#ready-slow').inner_text()=='QUEUED'
   assert page.locator('#use-slow .spell-use-label').inner_text()=='Slow words';assert snap()['inventory']['ice']==1 and snap()['inventory']['slow']==1
  check('Active and queued spell timers do not replace, cover or relabel usage captions',combo)
  def pause():
   run();page.locator('#typing-input').fill('LIB');page.keyboard.press('Escape');before=snap();assert page.locator('#play-hud').get_attribute('inert')is not None
   page.keyboard.press('1');after=snap();assert before['inventory']==after['inventory'] and after['buffer']=='LIB'
   page.keyboard.press('Escape');assert page.evaluate('document.activeElement.id')=='typing-input'
  check('Pause keeps the whole inventory inert and resumes native typing correctly',pause)
  def quiet():
   run();
   for motion,contrast in [(False,False),(True,False),(False,True),(True,True)]:
    api(f't.setSettings({{motion:{str(motion).lower()},contrast:{str(contrast).lower()}}});t.model.danger=95;t.flush();')
    r=page.locator('.spell-use').evaluate_all('(els)=>els.map(e=>({visible:e.getBoundingClientRect().height>0,animation:getComputedStyle(e).animationName,color:getComputedStyle(e).color}))')
    assert all(x['visible'] and x['animation']=='none'for x in r)
    if contrast:assert all(x['color']=='rgb(255, 241, 206)'for x in r),r
  check('Subtle lines remain readable and non-animated in pressure/contrast/reduced-motion states',quiet)
  def cache_and_text():
   run();r=api('''const r=t.renderer,initial=JSON.stringify(t.snapshot());const checks=[];
   for(const kind of ['normal','fire','ice','slow','wind','bonus'])for(const width of [112,230,410,708]){
    const a=r.cardTexture(width,kind,60),b=r.cardTexture(width,kind,60);const c=a.getContext('2d'),p=c.getImageData(0,0,a.width,a.height).data;let alpha=0;for(let i=3;i<p.length;i+=4)alpha+=p[i]>0?1:0;
    checks.push({kind,width,reused:a===b,canvas:[a.width,a.height],pixels:alpha});}
   return {checks,modelSame:initial===JSON.stringify(t.snapshot()),bytes:r.textureBytes,count:r.textures.size};''')
   assert r['modelSame'];assert all(x['reused']and x['canvas']==[(x['width']+32)*2,184]and x['pixels']>2000 for x in r['checks']);assert r['bytes']<=32*1024*1024 and r['count']<=96;evidence['textures']=r
  check('All six folio skins at four widths cache correctly without touching gameplay state',cache_and_text)
  def distinct():
   run();r=api("return ['normal','fire','ice','slow','wind','bonus'].map(kind=>t.renderer.cardTexture(270,kind,60).toDataURL());")
   assert len(set(r))==6
  check('Six material skins render distinct actual pixels, not just distinct metadata',distinct)
  def cache_cap():
   run();r=api('''const r=t.renderer;for(let i=0;i<155;i++)r.cardTexture(112+i*3,['normal','fire','ice','slow','wind','bonus'][i%6],60);return {size:r.textures.size,bytes:r.textureBytes};''')
   assert r['size']<=96 and r['bytes']<=32*1024*1024;evidence['cacheCap']=r
  check('A 155-width texture churn remains within the existing cache/memory budgets',cache_cap)
  def effects():
   run();api('t.setSettings({motion:true});t.model.words=[];');
   for i,kind in enumerate(['normal','fire','ice','slow','wind','bonus']):
    api(f"t.model.words=[];t.word('BOOK','{kind}',550,325);t.flush();");page.locator('#typing-input').fill('BOOK');page.keyboard.press('Enter');page.wait_for_timeout(35)
   page.wait_for_timeout(700);v=api('return t.visual();');assert v['deaths']==0 and v['arrivals']==0;assert snap()['correct']==6
  check('Typed folio leaves retain six material death paths and clean up after animation',effects)
  def long_prefix():
   run();api("t.model.words=[];t.word('BIOLUMINESCENT','normal',600,260);t.word('CONSTELLATION','ice',600,405);t.flush();")
   inp=page.locator('#typing-input');inp.fill('BIOLUMINESCEN');page.keyboard.press('Backspace');page.keyboard.type('NT');assert snap()['buffer']=='BIOLUMINESCENT'
   page.wait_for_timeout(100);v=api('return t.visual().readability;');assert all(x['lines']==[x['text']]for x in v);page.keyboard.press('Enter');assert snap()['correct']==1
  check('Full long-word entry and prefix ink remain one row on the new folio skin',long_prefix)
  def shots():
   for w,h in [(1366,768),(1920,1080)]:
    page.set_viewport_size({'width':w,'height':h});run(12)
    api("t.model.words=[];t.model.inventory={fire:1,ice:1,slow:1,wind:1};t.model.score=8240;t.model.streak=12;t.model.danger=28;[['LIBRARY','normal',445,245],['FABLE','fire',810,245],['ENCHANTED','ice',775,355],['CLOCKWORK','slow',440,395],['WONDER','wind',447,533],['CONSTELLATION','bonus',795,512]].forEach(w=>t.word(...w));t.flush();")
    page.locator('#typing-input').fill('ENCH');page.mouse.move(3,3);page.wait_for_timeout(160)
    # Wait out the genuine unavailable-storage toast in the in-memory fixture.
    page.wait_for_function("!document.querySelector('#toast').classList.contains('visible')",timeout=7000)
    page.screenshot(path=str(SHOTS/f'folio-gameplay-{w}-{a.mode}.png'))
   data=api('''const r=t.renderer,can=document.createElement('canvas');can.width=1160;can.height=590;const c=can.getContext('2d');c.fillStyle='#142820';c.fillRect(0,0,1160,590);
   ['normal','fire','ice','slow','wind','bonus'].forEach((kind,i)=>{const w={id:9000+i,text:['LIBRARY','EMBER','CRYSTAL','CLOCKWORK','WHISPER','CONSTELLATION'][i],kind,width:kind==='bonus'?480:420};const l=r.layout(w);c.save();c.translate(290+(i%2)*580,110+Math.floor(i/2)*185);r.paintCard(c,w,l);c.restore();});return can.toDataURL('image/png');''')
   (SHOTS/f'folio-materials-{a.mode}.png').write_bytes(base64.b64decode(data.split(',')[1]))
  check('Actual-app screenshots and the actual six-skin renderer sheet are captured',shots)
  def no_errors():assert not errors,errors
  check('No unhandled browser JavaScript errors during the suite',no_errors)
  report={'version':'3.3.6','scope':__doc__,'mode':a.mode,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'browser':b.version,'passed':sum(x['status']=='PASS'for x in rows),'failed':sum(x['status']=='FAIL'for x in rows),'unhandledErrors':errors,'tests':rows,'evidence':evidence}
  (OUT/f'book-leaf-{a.mode}.json').write_text(json.dumps(report,indent=2));b.close()
 if report['failed']:raise SystemExit(1)
if __name__=='__main__':main()
