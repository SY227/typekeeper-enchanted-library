#!/usr/bin/env python3
"""Decode every music layer and test static pressure mixes; not subjective listening."""
from pathlib import Path
import hashlib,json,subprocess
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'docs/qa';rows=[];stems=[]
names=['lanterns-hearth','lanterns-motion','lanterns-pressure','lanterns-urgency']
for i,name in enumerate(names):
 source,sr=sf.read(ROOT/f'asset-source/music/{name}.flac',dtype='float32',always_2d=True)
 path=ROOT/f'public/assets/{name}.mp3'
 buf=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac','2','-ar','32000','-'],check=True,capture_output=True).stdout
 data=np.frombuffer(buf,dtype='<f4').reshape(-1,2)
 info={'file':str(path.relative_to(ROOT)),'sourceChannels':source.shape[1],'sampleRate':sr,'frames':len(data),'sourceFrames':len(source),'seconds':len(data)/32000,'sourcePeak':float(np.max(abs(source))),'mp3Peak':float(np.max(abs(data))),'sourceRMS':float(np.sqrt(np.mean(source**2))),'mp3RMS':float(np.sqrt(np.mean(data**2))),'mp3ClippedSamples':int((abs(data)>=1).sum()),'sourceSeamStep':float(np.max(abs(source[-1]-source[0]))),'mp3SeamStep':float(np.max(abs(data[-1]-data[0]))),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
 info['passed']=np.isfinite(data).all().item() and sr==32000 and len(data)==len(source) and source.shape[1]==(2 if i<2 else 1) and info['mp3ClippedSamples']==0
 rows.append(info);stems.append(data)
lengths=[len(x) for x in stems];assert len(set(lengths))==1
mixes=[]
def smooth(v,lo,hi):
 t=np.clip((v-lo)/(hi-lo),0,1);return t*t*(3-2*t)
for danger in [0,25,50,75,90,98,100]:
 t=smooth(danger,20,90);u=smooth(danger,65,100)
 weights=[1-.24*t-.06*u,min(1,.65+.12*t),.84*t,.76*u]
 data=sum(s*w for s,w in zip(stems,weights))
 mixes.append({'danger':danger,'gains':weights,'preMusicBusPeak':float(np.max(abs(data))),'preMusicBusRMS':float(np.sqrt(np.mean(data**2))),'clippedSamples':int((abs(data)>=1).sum())})
report={'scope':'Actual MP3 decode and static CLASSIC gameplay mixes before music/master bus trim, scene mix, or compressor. No subjective music/device listening certification.','allPassed':all(r['passed'] for r in rows) and all(x['clippedSamples']==0 for x in mixes),'files':rows,'pressureMixes':mixes,'sourceBuffersAt32000HzBytes':sum(x['sourceFrames']*x['sourceChannels']*4 for x in rows)}
(out/'pressure-audio-integrity.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));assert report['allPassed']
