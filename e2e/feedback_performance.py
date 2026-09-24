#!/usr/bin/env python3
"""Controlled 12-card browser profile with four-layer music and real typing
feedback. Diagnostic fixtures hold positions and replenish cards; scores/Enter,
renderer, DOM and synthesis are shipping code. Not a human run or device benchmark.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from inline_fixture import inline_fixture
import argparse,json,hashlib,statistics
ROOT=Path(__file__).resolve().parents[1]
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--executable');args=ap.parse_args();errors=[]
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
  if args.executable:opts['executable_path']=args.executable
  browser=p.chromium.launch(**opts);page=browser.new_page(viewport={'width':1440,'height':1040});page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_fixture(ROOT));page.wait_for_function('!!window.__TM_TEST__');page.locator('[data-action="start"]').click();page.wait_for_function("__TM_TEST__.audioState().musicStatus==='ready'",timeout=20000)
  page.evaluate("()=>{const t=__TM_TEST__;t.start(990,24,'practice');t.freeze(true);t.model.words=[];t.model.spawnClock=100;t.model.danger=95;t.model.inventory={fire:2,ice:2,slow:2,wind:2};let i=0;for(const y of [208,311,414,523])for(const x of [350,603,861])t.word(['WONDER','LIBRARY','ARCHIVE','CRYSTAL','LANTERN','WHISPER','STORY','MAGIC','SHIMMER','GARDEN','RHYTHM','SILVER'][i++],i%4===0?'bonus':'normal',x,y);t.flush();}")
  page.wait_for_timeout(4000)
  samples=page.evaluate('''()=>new Promise(resolve=>{
   const t=__TM_TEST__,values=[];let n=0,prev,letter=0;
   function sample(now){
    if(prev!==undefined)values.push({dt:now-prev,draw:t.renderer.stats.drawMs,words:t.model.words.length,particles:t.renderer.particles.length,gleams:t.renderer.gleams.length,voices:t.audio.voiceCount,noise:t.audio.noiseCount});prev=now;
    if(n%6===0){const w=t.model.words[0];if(w){letter++;if(letter<=w.text.length)t.model.setBuffer(w.text.slice(0,letter));else{t.model.submit();t.model.progress=0;letter=0;t.word(w.text,w.kind,w.x,w.y);}t.flush();}}
    if(n++<600)requestAnimationFrame(sample);else resolve(values);
   }requestAnimationFrame(sample);
  })''')
  durations=[s['dt'] for s in samples];draw=[s['draw'] for s in samples];ordered=sorted(durations)
  result={'scope':__doc__,'shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'browser':browser.version,'viewport':{'width':1440,'height':1040},'frameIntervals':len(samples),'averageFPS':round(1000/statistics.mean(durations),2),'medianFrameMs':statistics.median(durations),'p95FrameMs':ordered[int(.95*(len(ordered)-1))],'maxFrameMs':max(durations),'medianCanvasDrawMs':statistics.median(draw),'pressure':95,'audioSources':page.evaluate('__TM_TEST__.audioState().sources'),'peakParticles':max(s['particles'] for s in samples),'peakGleams':max(s['gleams'] for s in samples),'peakToneVoices':max(s['voices'] for s in samples),'peakNoiseVoices':max(s['noise'] for s in samples),'cardRange':[min(s['words'] for s in samples),max(s['words'] for s in samples)],'unhandledErrors':errors,'samples':samples}
  (ROOT/'docs/qa/feedback-performance.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='samples'},indent=2));assert not errors
  # A separate readable composition. Pressure and its animated meter settle before input.
  page.evaluate("()=>{const t=__TM_TEST__;t.start(712,12,'practice');t.freeze(true);t.setSettings({hints:false});t.model.words=[];t.model.spawnClock=100;t.model.score=24680;t.model.progress=13;t.model.streak=15;t.model.danger=83;t.model.pile=[{x:340,angle:.04},{x:510,angle:-.06},{x:720,angle:.05},{x:840,angle:-.04}];[['WONDER','normal',355,245],['STORIES','ice',765,315],['LIBRARY','normal',545,430],['CRYSTAL','bonus',819,525]].forEach(w=>t.word(...w));t.flush();}")
  page.wait_for_timeout(850);page.locator('#typing-input').fill('LIBRA');page.evaluate('__TM_TEST__.flush()');page.locator('#stage').screenshot(path=str(ROOT/'docs/screenshots/20-v32-pressure-gameplay.png'))
  page.keyboard.press('4');page.wait_for_timeout(450);page.locator('#stage').screenshot(path=str(ROOT/'docs/screenshots/21-v32-wind-relief.png'))
  page.evaluate("()=>{const t=__TM_TEST__;t.start(712,6,'campaign');t.freeze(true);t.model.words=[];t.model.spawnClock=100;t.model.stageTime=24;t.model.time=24;t.model.stageCharacters=124;t.model.correctCharacters=420;t.model.score=3200;t.model.progress=t.model.config.quota-1;t.model.stageCorrect=t.model.config.quota-1;t.word('BOOK');t.flush();}")
  page.locator('#typing-input').fill('BOOK');page.keyboard.press('Enter');page.wait_for_timeout(550);page.locator('#stage').screenshot(path=str(ROOT/'docs/screenshots/22-v32-score-ceremony.png'))
  page.wait_for_timeout(750);page.locator('#stage').screenshot(path=str(ROOT/'docs/screenshots/24-v32-score-final.png'))
  browser.close()
if __name__=='__main__':main()
