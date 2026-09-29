#!/usr/bin/env python3
"""Spawn liveness through shipping Canvas, keyboard handlers, results and clocks.
Fixtures only enable the existing diagnostics seam and provide in-memory transport.
Boundary cases use legal constructed states; full campaign uses the actual model.
"""
from pathlib import Path
import sys,json,time,argparse,hashlib
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--root',required=True);ap.add_argument('--mode',choices=['standalone','modules'],default='standalone');ap.add_argument('--out',required=True);ap.add_argument('--executable',default='/usr/bin/chromium');args=ap.parse_args()
ROOT=Path(args.root).resolve();OUT=Path(args.out).resolve();OUT.mkdir(exist_ok=True,parents=True)
sys.path.insert(0,str(ROOT/'e2e'));from inline_fixture import inline_fixture
from module_fixture import module_fixture
rows=[];errors=[];evidence={}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=args.executable,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
 page=b.new_page(viewport={'width':1366,'height':768});page.set_default_timeout(12000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:print('BROWSER',m.text,flush=True) if m.type=='log' and m.text.startswith('QA ') else None)
 page.set_content(inline_fixture(ROOT) if args.mode=='standalone' else module_fixture(ROOT),wait_until='load');page.wait_for_function('!!window.__TM_TEST__')
 def api(code):return page.evaluate('(()=>{const t=__TM_TEST__,m=t.model;'+code+'})()')
 def boundary(level=5):
  api(f"t.setSettings({{motion:true,hints:false,pace:'classic',music:false,sfx:false,muted:true,resumeCountdown:false}});t.start(67131,{level});t.freeze(true);m.progress=m.config.quota-1;m.stageCorrect=m.progress;m.correct=m.progress;m.score=5000;m.words=[];m.danger=25;m.inventory={{fire:2,ice:2,slow:2,wind:2}};m.spawnClock=.6;t.flush();")
 def key(k):page.locator('#typing-input').focus();page.keyboard.press(k)
 def await_model_word(limit=16):
  result=api(f"let waited=0;while(m.phase==='playing'&&!m.words.length&&waited<{limit}){{t.advance(.1);waited+=.1;}}return {{waited,snapshot:m.snapshot(),spawnClock:m.spawnClock}};")
  assert result['snapshot']['words'],result
  evidence.setdefault('observedReplacementWaits',[]).append(round(result['waited'],3))
 def finish_word():
  word=api("return m.words[0]?.text;");assert word
  page.locator('#typing-input').fill(word);page.keyboard.press('Enter');assert api("return m.phase;")=='level-clear'
  api('t.skipOutcome();');assert page.locator('[data-action="next"]').is_visible()
  page.locator('[data-action="next"]').click();api('t.advance(.85);');assert api('return m.words.length;')>0
 def check(name,fn):
  start=time.monotonic()
  try:fn();assert not errors,errors;row={'name':name,'status':'PASS','seconds':round(time.monotonic()-start,3)}
  except Exception as e:
   row={'name':name,'status':'FAIL','error':repr(e),'seconds':round(time.monotonic()-start,3)}
   page.screenshot(path=str(OUT/f'flow-failure-{args.mode}-{len(rows)+1}.png'))
  rows.append(row);print(json.dumps(row),flush=True)
 def identity():assert api('return t.info.version;')=='3.6.2';assert 'v3.6.2' in page.title()
 check('Exact shipping v3.6.2 starts, with matching runtime identity',identity)
 def wind_empty():
  boundary();before=api('return m.tick;');api('t.freeze(false);');key('4')
  page.wait_for_function('__TM_TEST__.model.words.length===1',timeout=4000)
  after=api('return m.snapshot();');assert after['tick']>before;assert after['danger']==0;assert after['progress']==13
  page.wait_for_timeout(320);evidence['level5Wind']={'beforeTick':before,'afterTick':after['tick'],'word':after['words'][0]['text']}
  page.screenshot(path=str(OUT/f'level5-final-word-{args.mode}.png'));api('t.freeze(true);');finish_word()
 check('Level 5 at 13/14: WIND on an empty field does not stop real RAF; final word and level 6 follow',wind_empty)
 def fire_final():
  boundary();api('t.advance(.8);');prior=api('return m.score;');key('1');assert api('return m.words.length;')==0;assert api('return m.progress;')==13
  await_model_word();assert api('return m.words.length;')==1;assert api('return m.score;')==prior;finish_word()
 check('FIRE destroys the last candidate without progress; its replacement permits completion',fire_final)
 def freeze_empty():
  boundary();key('2');api('t.advance(5.95);');assert api('return m.words.length;')==0;assert api('return m.effects.ice>0;')
  api('t.advance(.8);');assert api('return m.words.length;')==1;finish_word()
 check('An empty field under ICE resumes generation after the real six-second expiry',freeze_empty)
 def queued_slow():
  boundary();key('2');key('3');key('4');assert api('return m.effects.slow;')==8
  api('t.advance(5.95);');assert api('return m.effects.slow;')==8;assert api('return m.words.length;')==0
  api('t.advance(1.2);');assert api('return m.words.length;')==1;assert api('return m.effects.slow;')<8;finish_word()
 check('ICE + queued SLOW + WIND on the final gap resumes and completes without extra rewards',queued_slow)
 def slow_fire():
  boundary();api('t.advance(.8);');key('3');key('1');key('4');await_model_word();assert api('return m.words.length;')==1;finish_word()
 check('SLOW + FIRE + WIND respects recovery timing and still spawns the final replacement',slow_fire)
 def miss_last():
  boundary();api('t.advance(.8);m.words[0].y=647.99;t.advance(1/60);');assert api('return m.missed;')==1;assert api('return m.progress;')==13
  api('t.advance(2.3);');assert api('return m.words.length;')==1;finish_word()
 check('Missing the final word keeps 13/14, then replaces it; no silent quota consumption',miss_last)
 def paused_final():
  boundary();key('2');key('Escape');snap=api('return m.snapshot();');api('t.advance(12);');assert api('return m.snapshot();')==snap
  page.locator('[data-action="resume"]').click();assert api('return m.phase;')=='playing';api('t.advance(7.0);');assert api('return m.words.length;')==1;finish_word()
 check('Pause on an empty frozen field consumes neither time nor spawn opportunity; Resume recovers',paused_final)
 def restore_retry():
  api("t.start(8702,5);t.freeze(true);t.flush();window.savedStart=t.store.checkpoint('classic');")
  api("m.score+=999;m.danger=99;m.progress=13;m.words=[];m.checkGameOver();m.setBuffer('TYPO');m.submit();t.flush();t.skipOutcome();")
  assert api("return m.phase;")=='game-over';assert page.locator('[data-action="retry-chapter"]').is_visible()
  page.locator('[data-action="retry-chapter"]').click();api('t.advance(.8);');assert api('return m.level;')==5;assert api('return m.progress;')==0;assert api('return m.score;')==0;assert api('return m.words.length;')==1
  api("t.show('menu');t.show('continue');t.advance(.8);");assert api('return m.words.length;')>0
 check('Retry after a 13/14 loss and Continue both restore a functioning generator and opening state',restore_retry)
 def all_ends():
  result=page.evaluate('''async()=>{const t=__TM_TEST__,m=t.model,r=t.renderer,inp=document.querySelector('#typing-input');let count=0;const states=[];
   for(let level=1;level<=48;level++){
    t.start(132*level,level);t.freeze(true);m.progress=m.config.quota-1;m.stageCorrect=m.progress;m.words=[];m.inventory={fire:2,ice:2,slow:2,wind:2};m.danger=55;
    t.advance(.8);t.cast('fire');t.cast('ice');t.cast('slow');t.cast('wind');
    // Frame each effect, not just disabled-motion state checks.
    for(let frame=0;frame<12;frame++){r.frame(performance.now()+frame*50,1);await new Promise(requestAnimationFrame);}
    let wait=0;while(!m.words.length&&wait<16){t.advance(.1);wait+=.1;}if(!m.words.length)throw new Error('No last word in chapter '+level+': '+JSON.stringify(m.snapshot()));
    inp.value=m.words[0].text;inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));
    if(m.phase!=='level-clear')throw new Error('Chapter not complete '+level);
    // Sample ceremony progress explicitly, then use the genuine skip/next controls.
    if(r.ceremony)r.ceremony.progress=.45;r.frame(performance.now()+100,1);t.skipOutcome();
    if(level<48){document.querySelector('[data-action="next"]').click();t.advance(.85);if(m.level!==level+1||!m.words.length)throw new Error('No next chapter '+level);}
    states.push({chapter:level,status:'PASS'});count++;await new Promise(requestAnimationFrame);
   }
   return {count,states};}''')
  assert result['count']==48;evidence['allChapterEndings']=result
 check('All 48 animated endings with four-spell combination, final entry, and next-stage/finale UI',all_ends)
 def entire_campaign():
  api("t.start(987336,1);t.freeze(true);t.flush();window.__flowRun={completed:[],steps:0,actions:0,virtual:performance.now(),gap:0,maxGap:0,done:false};")
  result=None
  # Bounded batches flush Canvas command buffers. A single artificial, thousands-
  # of-frames evaluation can pin GPU resources that normal paced play presents.
  for batch in range(600):
   result=page.evaluate('''async()=>{const t=__TM_TEST__,m=t.model,r=t.renderer,inp=document.querySelector('#typing-input'),f=window.__flowRun;
    try{for(let j=0;j<80&&!f.done;j++){
     f.steps++;t.advance(.1);f.virtual+=100;
     if(f.steps%6===0){r.frame(f.virtual,1);r.ctx.getImageData(0,0,1,1);}
     if(m.phase==='playing'&&!m.words.length&&m.effects.ice===0){f.gap+=.1;f.maxGap=Math.max(f.maxGap,f.gap);if(f.gap>12)throw new Error('No-spawn liveness deadline');}else f.gap=0;
     if(m.phase==='playing'&&m.words.length&&f.steps%3===0){
      const word=[...m.words].sort((a,b)=>b.y-a.y)[0];
      if(m.inventory.fire&&f.actions%27===0)t.cast('fire');
      else{if(m.inventory.ice&&f.actions%13===0)t.cast('ice');if(m.inventory.slow&&f.actions%17===0)t.cast('slow');
       inp.value=word.text;inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));}
      f.actions++;
     }
     if(m.phase==='level-clear'){f.completed.push(m.level);if(r.ceremony)r.ceremony.progress=.65;r.frame(f.virtual+=50,1);t.skipOutcome();if(m.level===48){f.done=true;break;}document.querySelector('[data-action="next"]').click();}
     if(m.phase==='game-over')throw new Error('Unexpected loss in fast-response campaign');
     if(f.steps%12===0)await new Promise(requestAnimationFrame);
    }return {...f,snapshot:f.done?m.snapshot():{level:m.level,phase:m.phase}};
    }catch(e){return {...f,error:e.message,stack:e.stack,snapshot:m.snapshot()};}
   }''')
   assert not result.get('error'),result
   if batch%20==0:print('FLOW_BATCH',batch,result['snapshot']['level'],result['steps'],flush=True)
   if result['done']:break
  evidence['renderedCampaign']=result;assert result['done'],result;assert result['completed']==list(range(1,49));assert result['snapshot']['phase']=='level-clear'
  page.screenshot(path=str(OUT/f'full-campaign-complete-{args.mode}.png'))
 check('Complete 48-chapter campaign with sampled native frames, actual input/UI handlers and earned FIRE/ICE/SLOW, no spawn bypass',entire_campaign)
 def real_heartbeat_after_stress():
  boundary();api('t.freeze(false);');first=api('return m.tick;');page.wait_for_timeout(1500);later=api('return m.tick;');assert later>first+20;assert api('return m.words.length;')>0
 check('Normal RAF and real-time generator remain alive after all chapter stress cases',real_heartbeat_after_stress)
 b.close()
report={'version':'3.6.2','mode':args.mode,'play_sha256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'scope':__doc__,'tests':rows,'passed':sum(r['status']=='PASS' for r in rows),'failed':sum(r['status']=='FAIL' for r in rows),'unhandledErrors':errors,'evidence':evidence}
(OUT/f'flow-browser-{args.mode}.json').write_text(json.dumps(report,indent=2));assert report['failed']==0 and not errors
