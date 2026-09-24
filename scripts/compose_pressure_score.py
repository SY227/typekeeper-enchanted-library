#!/usr/bin/env python3
"""Original v3.2 pressure arrangement for Lanterns & Letters.
Preserves the v3.0 theme byte-for-byte. Two 40-bar mono runtime stems share its
90-BPM clock and D-major / B-minor harmony. No third-party samples or services.
Lossless masters, an event score, MIDI, and a pressure/relief listening preview
are reproducible with the declared audio requirements and ffmpeg.
"""
from pathlib import Path
import json,hashlib,subprocess
import numpy as np
import soundfile as sf
from scipy.signal import butter,sosfilt
import mido
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets';MASTER=ROOT/'asset-source/music'
SR=32000;BPM=90;BEAT=60/BPM;N=round(40*4*BEAT*SR);LENGTH=N/SR
rng=np.random.default_rng(230932);events=[];cache={}
tension=np.zeros(N,dtype=np.float32);urgency=np.zeros_like(tension)
A=[(38,[62,66,69,73,76]),(42,[61,64,69,74]),(35,[59,62,66,69,73]),(33,[57,62,66,69]),(31,[59,62,66,69]),(33,[61,64,69,71]),(42,[62,66,69,74]),(33,[61,64,66,69])]
B=[(40,[59,62,66,71]),(33,[61,64,69,74]),(38,[62,66,69,73]),(35,[59,62,66,73]),(31,[59,62,67,69]),(42,[57,62,66,69]),(40,[59,62,66,71]),(33,[61,64,67,71])]
progression=A+A+B+B+A

def instrument(note,beats,kind):
 key=(note,beats,kind)
 if key in cache:return cache[key]
 duration=beats*BEAT;t=np.arange(max(1,round(duration*SR)),dtype=np.float32)/SR
 f=440*2**((note-69)/12)
 release=np.minimum(1,np.maximum(0,(duration-t)/.06))**2
 if kind=='strings':
  y=np.zeros_like(t)
  for k in range(1,9):
   amp=(1/k**1.3)*np.exp(-k/9)
   for detune in [-.0023,.0017]:
    y+=amp*.5*np.sin(2*np.pi*f*k*(1+detune)*t+.05*np.sin(2*np.pi*4.1*t))
  y*=np.minimum(1,t/.023)*np.exp(-t/ .24)*release*.45
 elif kind=='felt':
  y=(np.sin(2*np.pi*f*t)*np.exp(-t/ .36)+.25*np.sin(2*np.pi*f*2.001*t)*np.exp(-t/ .12))
  y*=np.minimum(1,t/.007)*release*.5
 elif kind=='pulse':
  y=(np.sin(2*np.pi*f*t)+.15*np.sin(2*np.pi*f*2*t))*np.exp(-t*7)
  y*=np.minimum(1,t/.007)*release*.6
 elif kind=='clock':
  y=(np.sin(2*np.pi*1350*t)+.4*np.sin(2*np.pi*2160*t))*np.exp(-t*100)*np.minimum(1,t/.0015)*.11
 elif kind=='brush':
  noise=rng.normal(0,1,len(t)).astype(np.float32)
  y=sosfilt(butter(2,[1800,6200],btype='bandpass',fs=SR,output='sos'),noise)*np.exp(-t*50)*np.minimum(1,t/.004)*.15
 elif kind=='air':
  y=np.zeros_like(t)
  for detune in [-.0015,.0018]:
   for k in [1,2,3,4]:y+=np.sin(2*np.pi*f*k*(1+detune)*t)*(.17/k**1.7)
  y*=np.minimum(1,t/.35)*np.minimum(1,(duration-t)/.35)*(.86+.14*np.sin(2*np.pi*3*t))
 else:raise ValueError(kind)
 y=np.asarray(y,dtype=np.float32);cache[key]=y;return y

def add(stem,n,at,beats,kind,gain):
 y=instrument(n,beats,kind)*gain
 start=round((at*BEAT+rng.uniform(-.002,.002))*SR)%N
 take=min(len(y),N-start);stem[start:start+take]+=y[:take]
 if take<len(y):stem[:len(y)-take]+=y[take:]
 events.append(dict(stem='pressure' if stem is tension else 'urgency',voice=kind,note=n,beat=at,duration=beats,gain=gain))

for bar,(root,chord) in enumerate(progression):
 at=bar*4
 # Compact bowed ostinato; accents mark the pulse rather than fight keystrokes.
 pattern=[0,2,1,2,0,3,1,2]
 for j,idx in enumerate(pattern):
  add(tension,chord[idx]-12,at+j*.5,.63,'strings',.17 if j%2 else .22)
  if j in [1,3,5,7]:add(tension,chord[(idx+1)%len(chord)],at+j*.5,.36,'felt',.055)
 for off in [0,2]:add(tension,root,at+off,1.45,'pulse',.17)
 for j in range(4):add(tension,0,at+j,.15,'clock',.11 if j%2 else .08)
 # Sustained upper extensions draw the harmony slightly darker as the pile grows.
 add(tension,chord[-1]-12,at,4.5,'air',.12)
 # Critical layer has double-time articulation, not an off-key sped-up recording.
 for j in range(16):
  idx=[0,2,1,3,1,2,0,2][j%8]
  add(urgency,chord[idx],at+j*.25,.34,'strings',.11 if j%4 else .17)
 for j in range(4):
  add(urgency,root,at+j,.32,'pulse',.19 if j%2==0 else .12)
  add(urgency,root+12,at+j+.21,.25,'pulse',.068)
 for j in range(8):add(urgency,0,at+j*.5,.15,'brush',.22 if j%2 else .12)
 if bar%4==3:
  for j,n in enumerate([chord[0],chord[1],chord[2],chord[3]]):add(urgency,n,at+2+j*.45,.65,'felt',.078)

def finish(x,target_rms,peak_limit):
 y=sosfilt(butter(2,65,'highpass',fs=SR,output='sos'),x)
 y=sosfilt(butter(2,6200,'lowpass',fs=SR,output='sos'),y)
 wet=y.copy()
 for sec,g in [(.057,.12),(.111,.08),(.187,.045),(.317,.018)]:wet+=np.roll(y,round(sec*SR))*g
 y=np.tanh(wet*1.3)/1.3
 y*=min(target_rms/max(1e-8,float(np.sqrt(np.mean(y*y)))),peak_limit/max(1e-8,float(abs(y).max())))
 fade=round(.006*SR);a=np.linspace(0,1,fade);y[-fade:]=y[-fade:]*(1-a)+y[0]*a
 return y.astype(np.float32)
tension=finish(tension,.079,.35);urgency=finish(urgency,.063,.29)
info={}
for name,data in [('lanterns-pressure',tension),('lanterns-urgency',urgency)]:
 flac=MASTER/(name+'.flac');sf.write(flac,data,SR,subtype='PCM_16')
 output=OUT/(name+'.mp3')
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(flac),'-ac','1','-c:a','libmp3lame','-b:a','96k','-metadata','title=Lanterns & Letters — '+name.split('-')[-1].title(),'-metadata','artist=Typekeeper','-metadata','comment=Original synthesized pressure arrangement. No external samples.',str(output)],check=True)
 info[name]={'channels':1,'sampleRate':SR,'samples':len(data),'seconds':len(data)/SR,'peak':float(abs(data).max()),'rms':float(np.sqrt(np.mean(data*data))),'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}
# A 40-second listening demonstration using the exact shipped themes and authored curves.
hearth,_=sf.read(MASTER/'lanterns-hearth.flac');motion,_=sf.read(MASTER/'lanterns-motion.flac')
dur=40;count=SR*dur;timeline=np.arange(count)/SR
pressure=np.interp(timeline,[0,5,11,18,25,31,32,34,40],[0,0,40,65,85,98,98,0,0])
band=lambda d,a,b: (lambda t:t*t*(3-2*t))(np.clip((d-a)/(b-a),0,1))
t=band(pressure,20,90);u=band(pressure,65,100)
preview=hearth[:count]*(1-.24*t-.06*u)[:,None]+motion[:count]*(.65+.12*t)[:,None]+tension[:count,None]*t[:,None]*.84+urgency[:count,None]*u[:,None]*.76
preview*=.75;preview[:int(.08*SR)]*=np.linspace(0,1,int(.08*SR))[:,None];preview[-int(.6*SR):]*=np.linspace(1,0,int(.6*SR))[:,None]
previewfile=MASTER/'pressure-and-relief-preview.flac';sf.write(previewfile,preview,SR,subtype='PCM_16')
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(previewfile),'-c:a','libmp3lame','-b:a','192k',str(MASTER/'pressure-and-relief-preview.mp3')],check=True)
# Exact note events for editing; browser plays the rendered audio, not General MIDI.
mid=mido.MidiFile(ticks_per_beat=480);tr=mido.MidiTrack();mid.tracks.append(tr);tr.append(mido.MetaMessage('set_tempo',tempo=mido.bpm2tempo(BPM),time=0))
for channel,kind in enumerate(['strings','felt','pulse','air']):
 tr=mido.MidiTrack();mid.tracks.append(tr);tr.append(mido.MetaMessage('track_name',name=kind,time=0));tr.append(mido.Message('program_change',program={'strings':45,'felt':4,'pulse':38,'air':89}[kind],channel=channel,time=0));seq=[]
 for e in events:
  if e['voice']==kind:seq += [(round(e['beat']*480),True,e),(round((e['beat']+e['duration'])*480),False,e)]
 prev=0
 for tick,on,e in sorted(seq,key=lambda a:(a[0],a[1])):
  tr.append(mido.Message('note_on' if on else 'note_off',note=e['note'],velocity=min(100,max(1,round(e['gain']*380))) if on else 0,channel=channel,time=max(0,tick-prev)));prev=tick
mid.save(MASTER/'pressure-arrangement.mid')
manifest={'version':'3.2.0','title':'Lanterns & Letters — pressure arrangement','bpm':BPM,'bars':40,'meter':'4/4','harmony':'Same authored D major / B minor progression as the preserved theme','stems':info,'sourceSamples':'None. Deterministic original synthesis.','preview':'40 seconds: calm → building → critical → WIND-like relief. Demonstration, not captured gameplay.','notes':len(events)}
(MASTER/'pressure-score.json').write_text(json.dumps(manifest,indent=2)+'\n');(MASTER/'pressure-arrangement.json').write_text(json.dumps(events,indent=2)+'\n');print(json.dumps(manifest,indent=2))
