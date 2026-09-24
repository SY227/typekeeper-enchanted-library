# Lanterns & Letters — v3.2 adaptive audio handoff

## Preserved material
The v3.1 original 40-bar, 90-BPM, D-major theme and both stereo runtime stems are
byte-identical. The previous full mix/MIDI/FLAC masters and original composition
script remain. There is no sampled audio from Typing Maniac, external commercial
recording, SoundFont, sample library or font binary in this delivery.

## New authored layers
`lanterns-pressure` adds bowed/staccato ostinato, felt answering figures, harmonic
extensions, soft low pulse and clock-like taps. `lanterns-urgency` uses double-time
articulation, paired bass pulses and brushed accents. Both follow the retained
A+A+B+B+A harmony and exact 106.666667-second loop. Together they contain 2,080
authored note/percussion events. These are mathematical synthesis, not live instruments.

New runtime files: `public/assets/lanterns-pressure.mp3` and `lanterns-urgency.mp3`.
They are mono 32-kHz / 96-kbps layers beneath the stereo main theme to limit memory.
Lossless FLAC masters, event JSON, cue/measurement metadata and editable MIDI are in
`asset-source/music`; their generator is `scripts/compose_pressure_score.py`.
The stereo main music is unchanged. MIDI timbres are only suggestions, not embedded samples.

## Runtime direction
All four BufferSources start at one AudioContext time and share the original loop
end. Gain automation changes the arrangement without restarting its phrase. Tempo
and playback rate remain unchanged. Above 20% pile the pressure part grows with
smoothstep interpolation, becoming full by 90%. Above 65%, urgency grows toward
100%. Existing hearth/motion parts rebalance moderately, instead of merely making
the entire mix louder. The audible distinction is denser articulation and tone.

WIND lowers danger immediately and releases layers with a faster 0.27-second
exponential time constant. Rising pressure uses 0.55 seconds. Pause/menus/results
remove the extra tension and retain the appropriate base scene mix. Turning off
Pressure-responsive music preserves the original two-part scene arrangement.

Master/music/effects sliders and mute still apply; focus loss suspends the entire
context. Original-theme loading failure is contained; missing optional pressure
layers fall back to the original score, with an honest message in Audio settings.
Four sources and their decoded buffers persist; they do not multiply on screen changes.
At the audited 44.1-kHz browser decode, buffers total 112,895,976 bytes (~107.7 MiB).
This is greater than v3.1 and should be profiled on actual target hardware.

## Sound design
GameAudio produces actual procedural foley: mechanical click/body variants, subtle
prefix sparkle, full-word-ready cue (no submission), card-resolution bell/carriage,
book flutter, dark-card/streak reward, paper crumple/thud, contained typo, distinct
fire/ice/slow/wind textures, natural expiry and page turns. Alarm/critical entry gets
a restrained single warning cue, not repeated sirens on every frame.

Transient resources cap at 32 tones, 12 noise players and 24 cached noise buffers.
Sources disconnect on completion. Score count voices have a separate group so Next,
retry or leaving a result screen can cancel them. The count-up uses at most 19 visual
tick opportunities with an additional 45-ms audio spacing guard; it never schedules
one sound for every score point. Scores and medals are committed before playback.

## Listening files and evidence
- `pressure-and-relief-preview.mp3`: an authored 40-second mix demonstration moving
  from calm to critical and back. Not a capture from a play session.
- `asset-source/audio/Typekeeper_SFX_Preview.mp3`: a 20-second reel rendered through
  the shipping GameAudio class in OfflineAudioContext. Its JSON cue sheet identifies
  each sound. It is not a human playthrough or source-video sample.
- `docs/qa/pressure-audio-integrity.json`: actual file decode, frame alignment, seam
  step, peak/RMS and seven static pressure mixes. No clipped samples in those checks.
- `docs/qa/sfx-offline-render.json`: rendered SFX signal checks and exact shipping hash.

No human headphone/speaker listening pass was conducted here. Engineering signal
checks do not establish AAA audio quality, fatigue tolerance or perfect auditory balance.

## Regenerate

```bash
python3 -m pip install -r scripts/audio-requirements.txt
npm run audio:pressure
npm run build
python3 scripts/render_sfx_preview.py --executable /path/to/chromium
python3 scripts/pressure-audio-audit.py
```

ffmpeg with libmp3lame is needed for generation; Playwright/Chromium for the SFX reel.
These are authoring tools only. Playing/building with the supplied assets needs none.
To commission an instrumental replacement, retain exact loop length/harmony and
phase alignment, then update provenance; do not silently change only one stem's tempo.

## Reference boundary
The user linked https://www.youtube.com/watch?v=fWnkhDlnGE8&t=266s, describing
pressure-dependent tension, shining words, typing sounds and score counting. Watch,
embed and metadata access did not provide usable footage/audio here. The additions
interpret those descriptions and the attached source; no original tempo, sound,
timestamped event or scoring presentation is asserted as directly observed.
