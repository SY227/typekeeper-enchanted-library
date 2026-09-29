#!/usr/bin/env python3
"""Actual Canvas ink/margin oracle + title, six materials and animated spell regressions.
Runs unmodified game drawing code in standalone / ES-module in-memory fixtures.
Fixture differences are transport URLs + existing diagnostics guard, not rendering.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
from module_fixture import module_fixture
import argparse,json,time,hashlib,base64,subprocess
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa364';SHOTS=ROOT/'docs/screenshots/v3.6.4'

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--mode',choices=['standalone','modules'],default='standalone');ap.add_argument('--executable',default='/usr/bin/chromium');a=ap.parse_args()
 OUT.mkdir(parents=True,exist_ok=True);SHOTS.mkdir(parents=True,exist_ok=True);rows=[];errors=[];evidence={}
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=a.executable,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=b.new_page(viewport={'width':1366,'height':768});page.set_default_timeout(12000);page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_fixture(ROOT) if a.mode=='standalone' else module_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__')
  def api(code):return page.evaluate('(()=>{const t=__TM_TEST__;'+code+'})()')
  def run(level=12):api(f"t.setSettings({{motion:false,hints:false,resumeCountdown:false,music:false,sfx:false,muted:true}});t.start(735,{level});t.freeze(true);t.model.words=[];t.model.spawnClock=100;t.model.danger=0;t.flush();")
  def check(name,fn):
   t=time.monotonic()
   try:fn();row={'name':name,'status':'PASS','seconds':round(time.monotonic()-t,3)}
   except Exception as e:
    row={'name':name,'status':'FAIL','error':repr(e),'seconds':round(time.monotonic()-t,3)}
    page.screenshot(path=str(OUT/f'repair-failure-{a.mode}-{len(rows)+1}.png'))
   rows.append(row);print(json.dumps(row),flush=True)
  def identity():
   assert 'v3.6.4' in page.title();assert api('return t.info.version;')=='3.6.4';assert api('return t.info.buildTag;')=='bound-and-balanced-364'
  check('Both shipping identity and initialized renderer are v3.6.4',identity)
  def title():
   api('t.setSettings({motion:false,hints:false,muted:true});t.show("menu");')
   data=api('''const r=t.renderer,orig=r.paintCard,seen=[];
   r.paintCard=function(c,w,l,opts){seen.push({text:w.text,kind:w.kind,width:l.width,inkLeft:l.inkLeft+l.width/2,inkRight:l.inkRight+l.width/2,safeLeft:l.safeLeft+l.width/2,safeRight:l.safeRight+l.width/2});return orig.call(this,c,w,l,opts);};
   try{r.frame(performance.now(),1);}finally{r.paintCard=orig;}return seen;''')
   assert {s['text'] for s in data}=={'WONDER','STORY','IMAGINE'}
   for d in data:assert d['inkLeft']>=28 and d['inkRight']<=d['width']-28,d
   evidence['actualTitleCards']=data
   page.wait_for_function('!document.querySelector("#toast").classList.contains("visible")',timeout=7000);page.mouse.move(1,1)
   page.screenshot(path=str(SHOTS/f'title-1366-{a.mode}.png'))
  check('The actual title painter keeps WONDER / STORY / IMAGINE inside both rollers',title)
  def ink_matrix(wh,dpr=1):
   page.set_viewport_size({'width':wh[0],'height':wh[1]});run()
   data=page.evaluate(r'''async()=>{
    const t=__TM_TEST__,r=t.renderer,can=document.createElement('canvas'),mask=document.createElement('canvas');can.width=900;can.height=160;mask.width=900;mask.height=160;
    const c=can.getContext('2d',{willReadFrequently:true}),m=mask.getContext('2d',{willReadFrequently:true});const orig=c.fillText.bind(c);let calls=[],icons=[],badges=[],count=0,fail=[];
    const draw=c.drawImage.bind(c);c.drawImage=function(image,...args){if(Object.values(r.assets).includes(image)&&args.length===4)icons.push(args);return draw(image,...args);};
    c.fillText=function(text,x,y,max){let mm=c.measureText(text);calls.push({text,x,y,font:c.font,left:x-mm.actualBoundingBoxLeft,right:x+mm.actualBoundingBoxRight});
      m.save();m.setTransform(c.getTransform());m.font=c.font;m.textAlign=c.textAlign;m.textBaseline=c.textBaseline;m.fillStyle='#fff';m.fillText(text,x,y,max);m.restore();return orig(text,x,y,max);};
    const words=['I','INK','WONDER','STORY','IMAGINE','CLOCKWORK','BIOLUMINESCENT','EXTRAORDINARY','UNDERSTANDING','CONSTELLATION','W'.repeat(24)];
    for(const kind of ['normal','fire','ice','slow','wind','bonus'])for(const text of words)for(const selected of [false,true]){
     const w={id:847,text,kind,width:112},l=r.layout(w);calls=[];icons=[];m.clearRect(0,0,900,160);c.clearRect(0,0,900,160);
     c.save();c.translate(450,80);t.model.buffer=selected?text.slice(0,Math.max(1,text.length-1)):'';r.paintCard(c,w,l,{matching:selected,selected});c.restore();
     const bytes=m.getImageData(0,0,900,160).data;let min=900,max=-1,top=160,bottom=0,n=0;
     for(let y=0;y<160;y++)for(let x=0;x<900;x++)if(bytes[(y*900+x)*4+3]>24){min=Math.min(min,x);max=Math.max(max,x);top=Math.min(top,y);bottom=Math.max(bottom,y);n++;}
     const ok=calls.length>0&&calls.every(q=>q.text===text&&q.y===0)&&n>0&&min>=Math.floor(450+l.safeLeft)&&max<=Math.ceil(450+l.safeRight)&&top>=80-l.height/2+7&&bottom<=80+l.height/2-7;
     if(!ok)fail.push({text,kind,selected,l,calls,pixels:{min,max,top,bottom,n}});
     if(['fire','ice','slow','wind'].includes(kind)){
      const actual=icons.at(-1),left=actual?.[0]+l.width/2,right=left+actual?.[2];
      if(!actual||Math.abs(actual[0]+actual[2]/2+l.width/2-42)>.01||Math.abs(actual[1]+actual[3]/2)>.01||left<=17||right>=l.inkLeft+l.width/2)fail.push({text,kind,actual,left,right});
     }
     count++;if(count%44===0)await new Promise(requestAnimationFrame);
    }
    t.model.buffer='';return {count,fail:fail.slice(0,4),failCount:fail.length,scale:r.cssScale};
   }''')
   assert data['failCount']==0,data['fail'];assert data['count']==132;evidence.setdefault('rasterMatrix',[]).append({'viewport':wh,**data})
  for wh in [(1366,768),(1920,1080),(1280,720),(1024,768)]:check(f'Rasterized letter pixels avoid rods / medallions, full words at {wh[0]}×{wh[1]}',lambda wh=wh:ink_matrix(wh))
  def badge():
   run();d=api('''const r=t.renderer;return ['fire','ice','slow','wind'].map(kind=>{const can=r.cardTexture(240,kind,60),c=can.getContext('2d');const sample=(x,y)=>Array.from(c.getImageData((x+16)*2,(y+16)*2,1,1).data);return {kind,centre:sample(42,30),outside:sample(42,-5),ring:sample(30,30)};});''')
   assert all(x['centre'][3]==255 and x['outside'][3]<60 for x in d),d;evidence['sealPixels']=d
  check('Inset seal is centred on the parchment, with no stray medallion above its edge',badge)
  def game_capture():
   for w,h in [(1366,768),(1920,1080)]:
    page.set_viewport_size({'width':w,'height':h});run(12)
    api("t.model.score=8240;t.model.streak=12;t.model.danger=28;t.model.inventory={fire:1,ice:1,slow:1,wind:1};[['LIBRARY','normal',417,229],['EMBER','fire',815,229],['CLOCKWORK','slow',425,376],['CRYSTAL','ice',810,335],['WONDER','wind',440,542],['CONSTELLATION','bonus',784,500]].forEach(a=>t.word(...a));t.flush();")
    page.locator('#typing-input').fill('CRY');page.mouse.move(2,2);page.wait_for_timeout(120)
    assert all(len(v['lines'])==1 for v in api('return t.visual().readability;'))
    page.screenshot(path=str(SHOTS/f'gameplay-{w}-{a.mode}.png'))
   data=api('''const r=t.renderer,c=document.createElement('canvas');c.width=1200;c.height=620;const x=c.getContext('2d');x.fillStyle='#12231f';x.fillRect(0,0,1200,620);r.model.buffer='';r.setViewport(.835);
   ['normal','fire','ice','slow','wind','bonus'].forEach((kind,i)=>{const word={id:990+i,kind,text:['WONDER','EMBER','CRYSTAL','CLOCKWORK','WHISPER','CONSTELLATION'][i],width:112};x.save();x.translate(i%2?860:285,90+Math.floor(i/2)*210);x.scale(1.2,1.2);r.paintCard(x,word,r.layout(word));x.restore();});return c.toDataURL('image/png');''')
   (SHOTS/f'materials-{a.mode}.png').write_bytes(base64.b64decode(data.split(',')[1]))
  check('Actual gameplay and all six material variants captured at laptop and 1080p sizes',game_capture)
  def long_word():
   run();api("t.word('BIOLUMINESCENT','ice',600,320);t.flush();")
   inp=page.locator('#typing-input');inp.fill('BIOLUMINESCENT');assert api('return t.snapshot().correct;')==0
   page.keyboard.press('Enter');assert api('return t.snapshot().correct;')==1
   api("t.word('UNDERSTANDING','wind',600,320);t.flush();");inp.fill('UNDERXTANDING');inp.evaluate('(e)=>e.setSelectionRange(5,6)');page.keyboard.type('S');assert api('return t.snapshot().buffer;')=='UNDERSTANDING'
  check('Complete one-row word entry, selection edits, and Enter behavior remain intact',long_word)
  def animated_cast(power,key):
   run();api("t.setSettings({motion:true});t.model.danger=55;t.model.inventory={fire:2,ice:2,slow:2,wind:2};t.word('LIBRARY','normal',600,380);t.flush();")
   inp=page.locator('#typing-input');inp.fill('LIB');inp.evaluate('(e)=>e.setSelectionRange(1,3)');before=api('return t.snapshot();');page.keyboard.press(key)
   # Exercise the visible animation at several times, not only the disabled-motion path.
   page.wait_for_timeout(150);after=api('return t.snapshot();');assert after['inventory'][power]==before['inventory'][power]-1;assert after['buffer']=='LIB';assert inp.evaluate('(e)=>[e.selectionStart,e.selectionEnd]')==[1,3]
   if power=='wind':assert after['danger']==0
   if power=='fire':assert len(after['words'])==0
   if power=='ice':assert after['effects']['ice']>0
   if power=='slow':assert after['effects']['slow']>0
   page.wait_for_timeout(650);assert not errors,errors
  for power,key in [('fire','1'),('ice','2'),('slow','3'),('wind','4')]:check(f'{power.upper()} with motion enabled: native animation, stock and preserved input',lambda p=power,k=key:animated_cast(p,k))
  def direct_spell():
   run();d=api('''const r=t.renderer,c=document.createElement('canvas');c.width=1200;c.height=900;const x=c.getContext('2d');r.settings.motion=true;let count=0;
   for(const power of ['fire','ice','slow','wind'])for(const f of [0,.05,.25,.5,.8,.99,1]){r.drawSpell(x,{power,t:.65*f,life:.65});count++;}return count;''');assert d==28
  check('All four native Canvas spell drawing paths render 28 onset/mid/end states',direct_spell)
  def modifiers():
   run();api("t.model.inventory={fire:1,ice:1,slow:1,wind:1};t.word('CONSTELLATION','fire',600,350);t.flush();")
   page.locator('#typing-input').fill('CONST');page.keyboard.press('2');page.keyboard.press('3');assert page.locator('#ready-slow').inner_text()=='QUEUED'
   page.keyboard.press('Escape');assert api('return t.snapshot().phase;')=='paused';page.keyboard.press('1');assert api('return t.snapshot().inventory.fire;')==1;page.keyboard.press('Escape');assert api('return t.snapshot().buffer;')=='CONST'
  check('Queued SLOW, pause inertness and selection-safe resume survive the visual repair',modifiers)
  def reduced():
   run();api("t.model.inventory.ice=1;t.model.danger=95;t.word('EXTRAORDINARY','ice',600,300);t.flush();t.setSettings({motion:false,contrast:true});")
   page.keyboard.type('EXTRA');page.keyboard.press('2');page.wait_for_timeout(80);v=api('return t.visual().readability;');assert len(v)==1 and v[0]['lines']==['EXTRAORDINARY'];assert not errors
  check('High contrast, high pressure and reduced motion retain legible one-row content',reduced)
  def cache():
   run();d=api('''const before=JSON.stringify(t.snapshot()),r=t.renderer;for(let i=0;i<170;i++)r.cardTexture(112+(i*7)%570,['normal','fire','ice','slow','wind','bonus'][i%6]);return {count:r.textures.size,bytes:r.textureBytes,same:before===JSON.stringify(t.snapshot())};''');assert d['count']<=96 and d['bytes']<=32*1024*1024 and d['same'];evidence['textureCache']=d
  check('Scroll material churn remains bounded and does not change model or vocabulary state',cache)
  def production():
   q=b.new_page();e=[];q.on('pageerror',lambda x:e.append(str(x)));q.set_content(inline_fixture(ROOT,False) if a.mode=='standalone' else module_fixture(ROOT,False));q.wait_for_selector('[data-action="start"]');assert q.evaluate('typeof __TM_TEST__')=='undefined';assert not e;q.close()
  check('Exact production startup succeeds without the diagnostic seam',production)
  check('No unhandled JavaScript exceptions in the completed repair suite',lambda:(_ for _ in ()).throw(AssertionError(errors)) if errors else None)
  out={'version':'3.6.4','mode':a.mode,'browser':b.version,'scope':__doc__,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'tests':rows,'passed':sum(r['status']=='PASS' for r in rows),'failed':sum(r['status']=='FAIL' for r in rows),'unhandledErrors':errors,'evidence':evidence}
  (OUT/f'scroll-repair-{a.mode}.json').write_text(json.dumps(out,indent=2));b.close()
 if out['failed']:raise SystemExit(1)
if __name__=='__main__':main()
