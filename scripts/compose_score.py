#!/usr/bin/env python3
"""Typekeeper • Lanterns & Letters. Deterministic original 40-bar score at 90 BPM.
No sampled recordings or third-party instrument assets. Modal synthesis, authored
melody/harmony, seeded humanization, stereo early reflections and a circular tail.
Requires numpy, scipy, soundfile, mido and ffmpeg. Generates two phase-aligned MP3 stems,
listening mix, lossless source masters, MIDI arrangement and a provenance manifest.
"""
from pathlib import Path
import json, subprocess, hashlib
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve
import mido
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets'; MASTER=ROOT/'asset-source/music'
OUT.mkdir(parents=True,exist_ok=True); MASTER.mkdir(parents=True,exist_ok=True)
SR=32000; BPM=90; BEAT=60/BPM; BARS=40; LENGTH=BARS*4*BEAT; N=round(LENGTH*SR)
RNG=np.random.default_rng(270922)
base=np.zeros((N,2),np.float32); motion=np.zeros_like(base)
events=[]

def freq(n): return 440*2**((n-69)/12)
def envelope(t,attack,release,duration):
    return (1-np.exp(-t/max(.002,attack)))*np.minimum(1,np.maximum(0,(duration-t)/max(.02,release)))**1.5

def voice(note,duration,kind):
    t=np.arange(round(duration*SR),dtype=np.float32)/SR; f=freq(note)
    if kind=='piano':
        # Soft tine/felt voice. Inharmonic high partials decay faster than the body.
        y=np.zeros_like(t)
        for k,a,d in [(1,1,2.6),(2,.36,1.5),(3,.18,.9),(4,.055,.42),(5,.025,.18)]:
            y+=a*np.sin(2*np.pi*f*(k+(.0003*k*k if k>1 else 0))*t)*np.exp(-t/d)
        y*=envelope(t,.009,.2,duration)*.44
    elif kind=='pluck':
        y=sum((1/(k**1.65))*np.sin(2*np.pi*f*k*t+.1*k)*np.exp(-t*(1.7+k*.7)) for k in range(1,7))
        y*=envelope(t,.006,.18,duration)*.55
    elif kind=='bell':
        y=(np.sin(2*np.pi*f*t)*np.exp(-t/1.45)+.23*np.sin(2*np.pi*f*2.006*t)*np.exp(-t/.6)+.07*np.sin(2*np.pi*f*3.99*t)*np.exp(-t/.22))
        y*=envelope(t,.008,.3,duration)*.42
    elif kind=='pad':
        y=np.zeros_like(t)
        for d in [-.002,0,.0023]:
            y+=(np.sin(2*np.pi*f*(1+d)*t)+.22*np.sin(2*np.pi*f*2*(1+d)*t)+.08*np.sin(2*np.pi*f*3*(1+d)*t))/3
        y*=envelope(t,.52,1.0,duration)*.35
    elif kind=='bass':
        y=(np.sin(2*np.pi*f*t)+.18*np.sin(2*np.pi*f*2*t)*np.exp(-t*4)+.07*np.sin(2*np.pi*f*3*t)*np.exp(-t*7))
        y*=envelope(t,.012,.17,duration)*np.exp(-t*1.15)*.62
    elif kind=='brush':
        noise=RNG.standard_normal(len(t)).astype(np.float32)
        y=sosfilt(butter(2,[2200,8500],btype='bandpass',fs=SR,output='sos'),noise)*np.exp(-t*38)*.12
        y*=envelope(t,.003,.02,duration)
    elif kind=='tap':
        y=np.sin(2*np.pi*(110*t-38*t*t))*np.exp(-t*25)*.26
        y*=envelope(t,.002,.03,duration)
    else: raise ValueError(kind)
    return y.astype(np.float32)

CACHE={}
def add(buf,n,at,beats,kind,gain=.2,pan=0,human=.008):
    duration=max(.1,beats*BEAT); key=(n,round(duration,5),kind)
    if kind in ('brush','tap'): y=voice(n,duration,kind)
    else:
        if key not in CACHE: CACHE[key]=voice(n,duration,kind)
        y=CACHE[key]
    t=(at*BEAT+RNG.uniform(-human,human))%LENGTH; start=round(t*SR)%N
    # Circular write provides natural reverb/instrument sustain at the loop seam.
    gains=np.sqrt([(1-pan)/2,(1+pan)/2])*gain
    arr=y[:,None]*gains[None,:]; count=min(len(arr),N-start)
    buf[start:start+count]+=arr[:count]
    if count<len(arr): buf[:len(arr)-count]+=arr[count:]
    if kind not in ('brush','tap'):events.append(dict(note=n,beat=at,duration=beats,voice=kind,gain=round(gain,4),stem='hearth' if buf is base else 'motion'))

# Voiced extended harmony. A warm D-major world with a B-minor / G-major bridge.
A=[(38,[62,66,69,73,76]),(42,[61,64,69,74]),(35,[59,62,66,69,73]),(33,[57,62,66,69]),(31,[59,62,66,69]),(33,[61,64,69,71]),(42,[62,66,69,74]),(33,[61,64,66,69])]
B=[(40,[59,62,66,71]),(33,[61,64,69,74]),(38,[62,66,69,73]),(35,[59,62,66,73]),(31,[59,62,67,69]),(42,[57,62,66,69]),(40,[59,62,66,71]),(33,[61,64,67,71])]
progression=A+A+B+B+A
# Deliberately written two-bar melodic cells; rest space is part of the arrangement.
melody=[
 [(0,78,.75),(1,81,.45),(1.5,83,.45),(2,81,.85),(3.25,78,.5)],
 [(.25,76,.7),(1.25,74,1.35),(3,76,.6)],
 [(0,78,.8),(1.25,81,.45),(2,78,.7),(3,76,.7)],
 [(.5,74,1.35),(2.5,73,.8)],
 [(0,74,.8),(1.25,78,.65),(2.25,81,1.1)],
 [(.25,83,.65),(1.25,81,.65),(2.25,76,1.05)],
 [(0,78,.8),(1.25,76,.65),(2.25,74,1.3)],
 [(.25,73,.7),(1.5,76,.7),(3,69,.7)]
]
bridge=[[(0,78,1.2),(1.5,76,.7),(2.75,74,.8)],[(.25,73,.7),(1.5,76,1.5)],[(0,78,.6),(1,81,.75),(2.25,85,1.25)],[(.5,83,1),(2,81,.75),(3.25,78,.5)],[(0,79,.8),(1.25,78,.65),(2.25,74,1.25)],[(.25,78,.85),(1.5,76,1.3)],[(0,74,.75),(1.25,76,.75),(2.5,78,.95)],[(.5,76,1.2),(2.5,73,1)]]
for bar,(root,chord) in enumerate(progression):
    at=bar*4; section=bar//8
    # Rolled, quiet left-hand piano with voice leading, never thick block stabs.
    for i,n in enumerate(chord[:4]):add(base,n-12,at+i*.032,3.9,'piano',.105+(.02 if i==0 else 0),-.28+i*.13)
    for n in chord[:3]:add(base,n-12,at,5.2,'pad',.024,(-.7 if n%2 else .7),0)
    # Rounded bass and a repeating nylon ostinato underpin the melody.
    add(base,root,at,1.6,'bass',.15,0)
    add(base,root+12,at+2.4,1.25,'bass',.075,0)
    arp=[0,2,1,3,2,1]
    for j,idx in enumerate(arp):
        beat=.5+j*.5
        if section==3 and j in (2,4):continue
        add(base,chord[idx],at+beat,1.25,'pluck',.068 if j%2 else .085,.2+.1*(j%2))
    motif=(bridge if section in (2,3) else melody)[bar%8]
    for j,(offset,n,dur) in enumerate(motif):
        # Answer phrases alternate between the felt tine and a muted music-box timbre.
        kind='piano' if section in (0,2,4) else 'bell'
        octave=-12 if section==3 else 0
        add(base,n+octave,at+offset,dur+1.0,kind,.17 if kind=='piano' else .155,-.12)
        if section==4 and bar%4==2 and j==0:add(base,n-12,at+offset,dur+1,'bell',.05,.48)
    # Phase-aligned gameplay layer. Soft groove rather than an alarm at high pressure.
    for off in (0,2):add(motion,36,at+off,.25,'tap',.23,0)
    for k in range(8):add(motion,0,at+k*.5,.18,'brush',.18 if k%2 else .115,.25 if k%2 else -.25)
    for j,off in enumerate((.75,1.75,2.75,3.5)):
        n=chord[[1,2,3,2][j]]
        add(motion,n,at+off,.7,'bell',.056+(.016 if section==4 else 0),-.48 if j%2 else .48)
    if bar%4==3:
        for j,n in enumerate([chord[2],chord[1],chord[0]]):add(motion,n+12,at+2.75+j*.375,1.3,'pluck',.048,.15+j*.18)

def finish(audio):
    # Short warm room: stereo taps plus sparse exponential reverberation, circular.
    dry=sosfilt(butter(2,45,'highpass',fs=SR,output='sos'),audio,axis=0)
    wet=np.zeros_like(dry)
    rng=np.random.default_rng(8)
    for sec,gain in [(.041,.08),(.073,.065),(.113,.052),(.173,.044),(.249,.032),(.353,.02)]:
        wet+=np.roll(dry[:,::-1],round(sec*SR),axis=0)*gain
    for i in range(34):
        sec=.13+i*.041+rng.uniform(0,.017)
        wet+=np.roll(dry,round(sec*SR),axis=0)*(.009*np.exp(-sec/ .8))
    y=dry+wet
    y=sosfilt(butter(2,10500,'lowpass',fs=SR,output='sos'),y,axis=0)
    # Soft headroom-preserving saturation. Shared scale maintains stem balance.
    return (np.tanh(y*1.3)/1.3).astype(np.float32)
base=finish(base);motion=finish(motion)
combined=base+motion*.7
scale=.73/max(.01,float(np.max(np.abs(combined))))
base*=scale;motion*=scale;combined=(base+motion*.7)
# Smooth only the final 4 ms to the opening sample; the circular sustain handles the rest.
for data in [base,motion,combined]:
    nfade=round(.004*SR);r=np.linspace(0,1,nfade,dtype=np.float32)[:,None]
    data[-nfade:]=data[-nfade:]*(1-r)+data[0:1]*r
for name,data in [('lanterns-hearth',base),('lanterns-motion',motion),('lanterns-and-letters',combined)]:
    flac=MASTER/(name+'.flac');sf.write(flac,data,SR,subtype='PCM_16')
    destination=(OUT if name!='lanterns-and-letters' else MASTER)/(name+'.mp3')
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(flac),'-c:a','libmp3lame','-b:a','160k','-metadata','title=Lanterns & Letters','-metadata','artist=Typekeeper','-metadata','comment=Original score. Synthesized instruments; no external samples.',str(destination)],check=True)
# MIDI source is included for a composer/DAW handoff; it describes the arrangement,
# not a promise that a General MIDI instrument sounds like the custom synthesizer.
mid=mido.MidiFile(ticks_per_beat=480);tempo=mido.MidiTrack();mid.tracks.append(tempo);tempo.append(mido.MetaMessage('set_tempo',tempo=mido.bpm2tempo(BPM),time=0))
programs={'piano':4,'pluck':24,'bell':11,'pad':89,'bass':32}
for channel,(kind,program) in enumerate(programs.items()):
    tr=mido.MidiTrack();mid.tracks.append(tr);tr.append(mido.MetaMessage('track_name',name=kind,time=0));tr.append(mido.Message('program_change',program=program,channel=channel,time=0));notes=[]
    for e in events:
        if e['voice']!=kind:continue
        on=round(e['beat']*480);off=round((e['beat']+e['duration'])*480)
        notes.extend([(on,1,e),(off,0,e)])
    previous=0
    for tick,on,e in sorted(notes,key=lambda item:(item[0],item[1])):
        tr.append(mido.Message('note_on' if on else 'note_off',note=e['note'],velocity=max(1,min(110,round(e['gain']*360))) if on else 0,channel=channel,time=max(0,tick-previous)));previous=tick
mid.save(MASTER/'lanterns-and-letters.mid')
manifest={'title':'Lanterns & Letters','bpm':BPM,'meter':'4/4','key':'D major','bars':BARS,'durationSeconds':LENGTH,'sampleRate':SR,'channels':2,'composition':'Original authored melody, voicings and arrangement. Deterministic synthesized instruments.','sourceSamples':'None','loopStart':0,'loopEnd':LENGTH,'stems':['lanterns-hearth.mp3','lanterns-motion.mp3'],'peakDBFS':round(float(20*np.log10(np.max(np.abs(combined)))),2),'rmsDBFS':round(float(20*np.log10(np.sqrt(np.mean(combined**2)))),2),'notes':len(events),'sha256':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in OUT.glob('lanterns-*.mp3')}}
(MASTER/'score.json').write_text(json.dumps(manifest,indent=2)+'\n');(MASTER/'arrangement.json').write_text(json.dumps(events,indent=2)+'\n');print(json.dumps(manifest,indent=2))
