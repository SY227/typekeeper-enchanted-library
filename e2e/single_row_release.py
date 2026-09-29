#!/usr/bin/env python3
"""v3.6.4 shipping standalone and ES-module browser regression suite.
Controlled fixtures are clearly separated from user-input journeys. One Python
process observes actual Canvas fillText calls, not only helper return values.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
from module_fixture import module_fixture
import argparse,json,subprocess,hashlib,time
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa364';SHOTS=ROOT/'docs/screenshots/v3.6.4'

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--executable',default='/usr/bin/chromium');ap.add_argument('--mode',choices=['standalone','modules'],default='standalone');args=ap.parse_args()
 OUT.mkdir(exist_ok=True,parents=True);SHOTS.mkdir(exist_ok=True,parents=True);rows=[];errors=[];evidence={}
 corpus=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {WORD_BANK} from './src/data/words.js';console.log(JSON.stringify(Object.values(WORD_BANK).flat()))"],cwd=ROOT,text=True))
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=args.executable,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=b.new_page(viewport={'width':1366,'height':768},device_scale_factor=1);page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(8000)
  page.set_content(inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__')
  def api(s):return page.evaluate('(()=>{const t=__TM_TEST__;'+s+'})()')
  def snap():return api('return t.snapshot();')
  def run(level=1):
   api(f"t.setSettings({{motion:false,hints:false,resumeCountdown:false,sfx:false,music:false,muted:true,pace:'classic'}});t.start(415,{level});t.freeze(true);t.model.words=[];t.model.spawnClock=100;t.flush();")
  def check(name,fn):
   started=time.monotonic()
   try:fn();row={'name':name,'status':'PASS','seconds':round(time.monotonic()-started,3)}
   except Exception as e:
    row={'name':name,'status':'FAIL','error':repr(e),'seconds':round(time.monotonic()-started,3)}
    page.screenshot(path=str(OUT/f'single-row-failure-{args.mode}-{len(rows)+1}.png'))
   rows.append(row);print(row,flush=True)
  def identity():
   assert api('return t.info.version;')=='3.6.4';assert 'v3.6.4' in page.title();assert page.locator('html').get_attribute('data-build')=='3.6.4'
   assert api('return t.info.buildTag;')=='bound-and-balanced-364'
  check('Shipping document, running engine and browser title identify v3.6.4',identity)
  def full_matrix(width,height,dpr=1):
   page.set_viewport_size({'width':width,'height':height});run(48)
   r=page.evaluate(r'''async words=>{
    const t=__TM_TEST__,r=t.renderer,canvas=document.createElement('canvas');canvas.width=800;canvas.height=140;const c=canvas.getContext('2d',{willReadFrequently:true});
    const fill=c.fillText.bind(c);let log=[];c.fillText=(text,x,y,max)=>{log.push({text,x,y,max,font:c.font});fill(text,x,y,max);};
    let tested=0,minPixels=Infinity,maxWidth=0,fail=[];
    for(const text of words)for(const kind of ['normal','fire','ice','slow','wind','bonus']){
     const w={id:90001,text,kind,width:112},l=r.layout(w);c.clearRect(0,0,800,140);c.save();c.translate(400,70);log=[];
     t.model.buffer=text.slice(0,Math.max(1,text.length-2));r.paintCard(c,w,l,{matching:true,selected:true});c.restore();
     const textCalls=log.filter(x=>/[A-Z]/.test(x.text));
     if(l.lines.length!==1||l.lines[0].text!==text||l.textWidth>l.textMaxWidth+.01||!textCalls.length||textCalls.some(d=>d.text!==text||d.y!==0))fail.push({text,kind,l,log});
     minPixels=Math.min(minPixels,l.fontSize*r.cssScale);maxWidth=Math.max(maxWidth,l.width);tested++;
     // Flush/yield between batches: exhaustive coverage must not enqueue thousands
     // of transient texture snapshots in one artificial browser frame.
     if(tested%36===0){c.getImageData(0,0,800,140);await new Promise(requestAnimationFrame);}
    }
    t.model.buffer='';return {tested,fail:fail.slice(0,5),failCount:fail.length,minEffectivePixels:minPixels,maxCardWidth:maxWidth,scale:r.cssScale};
   }''',corpus)
   evidence.setdefault('matrix',[]).append({'viewport':[width,height],**r});assert r['tested']==len(corpus)*6;assert not r['failCount'],r['fail'];assert r['minEffectivePixels']>=22
  for wh in [(1366,768),(1920,1080),(1280,720),(1024,768)]:check(f'Actual Canvas calls: every {len(corpus)} word × 6 skins at {wh[0]}×{wh[1]}',lambda wh=wh:full_matrix(*wh))
  def badlayout():
   run();r=api(r"""const r=t.renderer,c=r.ctx,w={id:1,text:'BIOLUMINESCENT',kind:'normal',width:400};const l={...r.layout(w),lines:[{text:'BIO',x:0,y:-16},{text:'LUMINESCENT',x:0,y:16}]};const calls=[],orig=c.fillText;c.fillText=function(text,x,y,max){calls.push({text,x,y});return orig.call(this,text,x,y,max)};r.paintCard(c,w,l);c.fillText=orig;return calls;""")
   assert r and all(x['text']=='BIOLUMINESCENT' and x['y']==0 for x in r)
  check('Renderer rejects multi-row output even with an obsolete two-row cached layout',badlayout)
  def edgecase():
   run();r=api("const r=t.renderer;return ['normal','fire','ice','slow','wind','bonus'].map(kind=>{const l=r.layout({text:'W'.repeat(24),width:410,kind});return {text:l.text,rows:l.lines.length,fits:l.textWidth<=l.textMaxWidth+.01,width:l.width};});")
   assert all(x['rows']==1 and x['text']=='W'*24 and x['fits'] and x['width']<=708 for x in r)
  check('24 widest custom glyphs never split, truncate, or overflow the card',edgecase)
  def long_entry():
   run();api("t.word('BIOLUMINESCENT','ice',600,320);t.flush();");input=page.locator('#typing-input');input.fill('BIOLUMIN');input.press_sequentially('ESCENT');assert snap()['buffer']=='BIOLUMINESCENT' and snap()['correct']==0
   page.wait_for_timeout(60);r=api('return t.visual().readability;');assert r[0]['lines']==['BIOLUMINESCENT'];page.keyboard.press('Enter');assert snap()['correct']==1 and snap()['inventory']['ice']==1
  check('Native keyboard completes the entire long word before Enter resolves it once',long_entry)
  def editing():
   run();api("t.word('UNDERSTANDING','wind');t.flush();");inp=page.locator('#typing-input');inp.fill('UNDERXTANDING');inp.evaluate('(e)=>e.setSelectionRange(5,6)');page.keyboard.type('S');assert snap()['buffer']=='UNDERSTANDING'
   inp.evaluate('(e)=>e.setSelectionRange(3,8)');api('t.model.inventory.ice=1;t.flush();');page.keyboard.press('2');assert inp.evaluate('(e)=>[e.selectionStart,e.selectionEnd]')==[3,8];assert snap()['buffer']=='UNDERSTANDING';page.keyboard.press('Enter');assert snap()['correct']==1
  check('Long-word editing, selection and quick magic preserve the single-line input',editing)
  def newgames():
   run();seeds=[];seq=[]
   for i in range(20):
    api('t.show("menu");t.show("new-confirm");');page.locator('[data-action="fresh-start"]').click();api('t.freeze(true);');seeds.append(snap()['seed']);seq.append(api('const words=[];for(let j=0;j<12;j++){t.model.words=[];t.model.spawn();words.push(t.model.words[0].text);}return words;'))
   assert len(set(seeds))==20 and len({tuple(s)for s in seq})==20;assert all(x[:4]!=['INK','TALE','BOOK','PAGE'] for x in seq);evidence['realNewGameOpenings']=seq[:5]
  check('20 actual New game button journeys produce distinct randomized openings',newgames)
  def retries():
   run();before=api('const a=[];for(let j=0;j<12;j++){t.model.words=[];t.model.spawn();a.push(t.model.words[0].text);}return a;');old=snap()['wordSeed']
   api('t.model.words=[];t.model.danger=99;t.model.score=99999;t.model.inventory.fire=2;t.flush();');page.locator('#typing-input').fill('QQQQ');page.keyboard.press('Enter');page.locator('[data-action="retry-chapter"]').wait_for();page.locator('[data-action="retry-chapter"]').click();s=snap()
   assert s['score']==0 and s['danger']==0 and all(v==0 for v in s['inventory'].values());assert s['wordSeed']!=old
   after=api('const a=[];for(let j=0;j<12;j++){t.model.words=[];t.model.spawn();a.push(t.model.words[0].text);}return a;');assert before!=after;evidence['retry']={'before':before,'after':after}
  check('Actual defeat → Retry changes words without keeping failed score or free spells',retries)
  def continue_same():
   run();api('t.model.retryChapter(t.model.checkpoint(),77812);t.store.setCheckpoint(t.model.checkpoint());');first=api('const a=[];for(let j=0;j<12;j++){t.model.words=[];t.model.spawn();a.push(t.model.words[0].text);}return a;');api('t.show("menu");');page.locator('[data-action="continue"]').click();api('t.freeze(true);');second=api('const a=[];for(let j=0;j<12;j++){t.model.words=[];t.model.spawn();a.push(t.model.words[0].text);}return a;');assert first==second
  check('Continue reproduces the current attempt; only a deliberate Retry rerolls vocabulary',continue_same)
  def low_high():
   for motion in [False,True]:
    for contrast in [False,True]:
     for danger in [0,52,95]:
      run(48);api(f't.setSettings({{motion:{str(motion).lower()},contrast:{str(contrast).lower()}}});t.model.danger={danger};t.word("CONSTELLATION","fire",600,320);t.model.inventory.ice=1;t.flush();');page.keyboard.type('CONST');page.keyboard.press('2');page.wait_for_timeout(260);r=api('return t.visual().readability;');assert r and all(x['lines']==['CONSTELLATION'] for x in r)
   evidence['states']=12
  check('Single-row words survive pressure, ICE, high contrast and reduced-motion settings',low_high)
  def transition():
   run();api("t.model.progress=t.model.config.quota-1;t.word('EXTRAORDINARY');t.flush();");page.locator('#typing-input').fill('EXTRAORDINARY');page.keyboard.press('Enter');page.locator('[data-action="next"]').wait_for();page.locator('[data-action="next"]').click();api('t.freeze(true);t.model.spawn();t.flush();');page.wait_for_timeout(80);assert snap()['level']==2;assert all(len(x['lines'])==1 for x in api('return t.visual().readability;'))
  check('Chapter completion and next chapter do not restore an older wrapping renderer',transition)
  def screenshot():
   for width,height in [(1366,768),(1920,1080)]:
    page.set_viewport_size({'width':width,'height':height});run(36);api("t.setSettings({motion:false});t.model.score=8240;t.model.streak=12;t.model.danger=28;t.model.words=[];['BIOLUMINESCENT','EXTRAORDINARY','UNDERSTANDING','CONSTELLATION'].forEach((s,i)=>t.word(s,['normal','fire','ice','wind'][i],600,226+i*117));t.flush();");page.locator('#typing-input').fill('EXTRA');page.wait_for_timeout(150);page.mouse.move(4,4);page.screenshot(path=str(SHOTS/f'single-row-{width}-{args.mode}.png'));assert all(len(x['lines'])==1 for x in api('return t.visual().readability;'))
  check('Captured actual game frames show complete long words at 1366 and 1920 widths',screenshot)
  # Full shipping production guard is checked in a fresh page, without debug edits.
  def guard():
   q=b.new_page();q.set_content(inline_fixture(ROOT,diagnostics=False) if args.mode=='standalone' else module_fixture(ROOT,diagnostics=False));q.wait_for_selector('[data-action="start"]');assert q.evaluate('typeof window.__TM_TEST__')=='undefined';assert 'v3.6.4' in q.title();q.close()
  check('Normal production export exposes no test seam',guard)
  def retina():
   q=b.new_page(viewport={'width':1366,'height':768},device_scale_factor=2);q.on('pageerror',lambda e:errors.append(str(e)))
   q.set_content(inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT));q.wait_for_function('!!window.__TM_TEST__');q.evaluate("(()=>{const t=__TM_TEST__;t.setSettings({motion:false,hints:false,muted:true});t.start(778);t.freeze(true);t.model.words=[];['BIOLUMINESCENT','EXTRAORDINARY','UNDERSTANDING','CONSTELLATION'].forEach((s,i)=>t.word(s,'normal',600,220+i*114));t.flush();})()");q.wait_for_timeout(100)
   v=q.evaluate('__TM_TEST__.visual().readability');assert len(v)==4 and all(x['lines']==[x['text']] for x in v);assert q.evaluate('devicePixelRatio')==2;q.close()
  check('DPR 2 Retina-style scaling retains one row for full long words',retina)
  def stale_guard():
   q=b.new_page();h=inline_fixture(ROOT,diagnostics=False) if args.mode=='standalone' else module_fixture(ROOT,diagnostics=False)
   h=h.replace('name="typekeeper-version" content="3.6.4"','name="typekeeper-version" content="3.3.1"');q.set_content(h);q.wait_for_selector('text=Mixed game files detected');assert q.locator('[data-action="start"]').count()==0;q.close()
  check('Fault injection: mixed HTML/JS release identity stops launch with an explicit error',stale_guard)
  check('No unhandled browser errors occurred' ,lambda:(_ for _ in ()).throw(AssertionError(errors)) if errors else None)
  report={'version':'3.6.4','mode':args.mode+' in-memory browser fixture','browser':b.version,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'tests':rows,'passed':sum(x['status']=='PASS' for x in rows),'failed':sum(x['status']=='FAIL' for x in rows),'unhandledErrors':errors,'evidence':evidence};(OUT/f'single-row-{args.mode}.json').write_text(json.dumps(report,indent=2));b.close()
 if report['failed']:raise SystemExit(1)
if __name__=='__main__':main()
