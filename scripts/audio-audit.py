#!/usr/bin/env python3
"""Signal/format audit of the actual shipped score. Not a human listening test."""
from pathlib import Path
import subprocess,json,hashlib,re
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1];rows=[]
for name in ['lanterns-hearth','lanterns-motion','lanterns-and-letters']:
 p=ROOT/'asset-source/music'/f'{name}.flac';data,sr=sf.read(p,dtype='float32',always_2d=True)
 mp3=(ROOT/'asset-source/music' if name=='lanterns-and-letters' else ROOT/'public/assets')/f'{name}.mp3'
 decoded=subprocess.run(['ffmpeg','-v','error','-i',str(mp3),'-f','f32le','-ac','2','-ar',str(sr),'-'],check=True,capture_output=True).stdout
 lossy=np.frombuffer(decoded,dtype='<f4').reshape(-1,2)
 row={'name':name,'sourceRate':sr,'channels':data.shape[1],'sourceFrames':len(data),'decodedMP3Frames':len(lossy),'durationSeconds':len(data)/sr,'sourcePeakDBFS':round(float(20*np.log10(np.max(abs(data)))),3),'decodedMP3PeakDBFS':round(float(20*np.log10(np.max(abs(lossy)))),3),'sourceClippedSamples':int(np.sum(abs(data)>=1)),'decodedMP3ClippedSamples':int(np.sum(abs(lossy)>=1)),'sourceLoopEndpointDifference':float(np.max(abs(data[0]-data[-1]))),'decodedMP3LoopEndpointDifference':float(np.max(abs(lossy[0]-lossy[-1]))),'mp3Bytes':mp3.stat().st_size,'sha256':hashlib.sha256(mp3.read_bytes()).hexdigest()}
 row['passed']=data.shape[1]==2 and sr==32000 and len(data)==len(lossy) and not row['sourceClippedSamples'] and not row['decodedMP3ClippedSamples']
 rows.append(row)
ebur=subprocess.run(['ffmpeg','-hide_banner','-i',str(ROOT/'asset-source/music/lanterns-and-letters.flac'),'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True).stderr
(ROOT/'docs/qa/music-loudness.txt').write_text(ebur)
summary=ebur[ebur.rfind('Summary:'):]
metric=lambda pattern:float(re.search(pattern,summary).group(1))
report={'scope':'File decode, format, sample count, sample peaks and loop endpoints only. Does not certify subjective music quality, device output or a human listening pass.','fullMixEBUR128':{'integratedLUFS':metric(r'I:\s+([-\d.]+) LUFS'),'loudnessRangeLU':metric(r'LRA:\s+([-\d.]+) LU'),'truePeakDBFS':metric(r'Peak:\s+([-\d.]+) dBFS'),'method':'ffmpeg ebur128=peak=true on source FLAC; raw output music-loudness.txt'},'allPassed':all(r['passed'] for r in rows),'files':rows}
(ROOT/'docs/qa/audio-integrity.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if not report['allPassed']:raise SystemExit(1)
