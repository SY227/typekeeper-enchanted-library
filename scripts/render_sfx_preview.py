#!/usr/bin/env python3
"""Render a labeled SFX listening reel using the actual shipping GameAudio class.
Requires Python Playwright + Chromium + ffmpeg. OfflineAudioContext renders the
procedural cues, not sampled sounds from the reference video. A local diagnostic
fixture exposes GameAudio without changing its synthesis methods. The preview's
key rate limiter is reset at each deliberately scheduled offline keystroke because
OfflineAudioContext advances faster than the real wall-clock input guard.
"""
from pathlib import Path
import sys, argparse, base64, hashlib, json, subprocess
import numpy as np
import soundfile as sf
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'e2e'))
from inline_fixture import inline_fixture

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--executable');args=ap.parse_args()
 dest=ROOT/'asset-source/audio';dest.mkdir(parents=True,exist_ok=True)
 events=[]
 def cue(at,label,event):events.append({'at':at,'label':label,'event':event})
 for i in range(7):cue(.4+i*.13,'typing',{'type':'input','changed':True,'erased':False,'target':{'id':1},'complete':i==6})
 cue(1.5,'word saved',{'type':'correct','word':{'kind':'normal','x':500},'streak':3})
 cue(2.7,'dark word and streak',{'type':'correct','word':{'kind':'bonus','x':630},'streak':8})
 cue(4,'book collected',{'type':'correct','word':{'kind':'ice','x':780},'streak':9,'collected':True})
 cue(5.5,'FIRE',{'type':'power','power':'fire'})
 cue(7,'ICE',{'type':'power','power':'ice'})
 cue(8.5,'SLOW',{'type':'power','power':'slow'})
 cue(10,'WIND',{'type':'power','power':'wind'})
 cue(11.5,'paper miss',{'type':'miss'})
 cue(12.4,'invalid submission',{'type':'wrong'})
 cue(13.3,'critical band entry',{'type':'pressure','state':{'key':'critical'}})
 cue(14.5,'natural ICE expiry',{'type':'effect-end','power':'ice'})
 cue(15.4,'chapter clear',{'type':'level-clear'})
 for i in range(17):cue(15.8+i*.059,'score count',{'tally':i/17})
 cue(16.9,'three-star score seal',{'seal':3})
 cue(18.2,'next page',{'type':'next-level'})
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
  if args.executable:opts['executable_path']=args.executable
  b=p.chromium.launch(**opts);page=b.new_page();page.set_content(inline_fixture(ROOT));page.wait_for_function('!!window.__TM_TEST__')
  data=page.evaluate('''async (events)=>{
   const ctx=new OfflineAudioContext(2,44100*20,44100);
   const a=new __TM_TEST__.audio.constructor({sfx:true,music:false,muted:false,volume:.8,sfxVolume:.65,musicVolume:.5,adaptiveMusic:true});
   a.context=ctx;a.active=true;a.output=ctx.createGain();a.output.gain.value=0;
   const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-7;limiter.knee.value=8;limiter.ratio.value=4;limiter.attack.value=.003;limiter.release.value=.12;
   a.master=ctx.createGain();a.master.connect(limiter);a.musicBus=ctx.createGain();a.musicBus.gain.value=0;
   a.filter=ctx.createBiquadFilter();a.filter.type='lowpass';a.filter.frequency.value=13000;
   a.musicBus.connect(a.filter);a.filter.connect(limiter);limiter.connect(a.output);a.output.connect(ctx.destination);a.apply();
   const pending=events.map(item=>ctx.suspend(item.at).then(()=>{
    a.lastKey=-Infinity;
    if('tally' in item.event)a.tallyTick(item.event.tally);
    else if('seal' in item.event)a.tallyComplete(item.event.seal);
    else a.play(item.event);
    return ctx.resume();
   }));
   const rendered=await ctx.startRendering();await Promise.all(pending);
   const inter=new Float32Array(rendered.length*2),l=rendered.getChannelData(0),r=rendered.getChannelData(1);
   for(let i=0;i<rendered.length;i++){inter[i*2]=l[i];inter[i*2+1]=r[i];}
   const bytes=new Uint8Array(inter.buffer);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
   return {base64:btoa(binary),sampleRate:rendered.sampleRate,frames:rendered.length,cues:a.snapshot().cues};
  }''',events);b.close()
 samples=np.frombuffer(base64.b64decode(data.pop('base64')),dtype='<f4').reshape(-1,2)
 assert np.isfinite(samples).all() and np.max(np.abs(samples))<1
 sf.write(dest/'Typekeeper_SFX_Preview.flac',samples,44100,subtype='PCM_24')
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(dest/'Typekeeper_SFX_Preview.flac'),'-codec:a','libmp3lame','-b:a','160k',str(dest/'Typekeeper_SFX_Preview.mp3')],check=True)
 report={'source':'Actual shipping GameAudio synthesis and mix, OfflineAudioContext scheduled listening reel; not gameplay or human listening','shippingSHA256':hashlib.sha256((ROOT/'PLAY.html').read_bytes()).hexdigest(),'seconds':20,'sampleRate':44100,'channels':2,'peak':float(np.max(np.abs(samples))),'rms':float(np.sqrt(np.mean(samples**2))),'clippedSamples':int((np.abs(samples)>=1).sum()),'events':events,'renderedCues':data['cues']}
 (dest/'SFX_Preview_Cue_Sheet.json').write_text(json.dumps(report,indent=2));(ROOT/'docs/qa/sfx-offline-render.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k] for k in ['seconds','peak','rms','clippedSamples']}))
if __name__=='__main__':main()
