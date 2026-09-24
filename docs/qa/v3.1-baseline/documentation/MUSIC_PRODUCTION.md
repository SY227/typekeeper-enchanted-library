# Lanterns & Letters — music handoff

## Composition

Original authored melody, harmonic voicings and arrangement. 40 bars, 4/4, 90 BPM, D major, **106.6667 seconds**. Five eight-bar sections alternate an initial motif, a timbral answer, a contrasting passage, a quieter bridge and the return. The arrangement has 896 tonal events plus synthesized taps/brushes. Seeded microtiming and stereo placement provide variation without changing the loop length.

The intended mood is warm, focused and gently rhythmic rather than urgent or cinematic bombast. Tonal pressure does not accelerate the score or add an alarm track. This is a synthesized production with original musical material, not a recorded orchestra, external commercial track, or recovered soundtrack from the source video. A human listening/mix review remains appropriate before a public launch.

## Files

- `public/assets/lanterns-hearth.mp3`: lead/harmony, plucks, soft bells, pads and bass.
- `public/assets/lanterns-motion.mp3`: light rhythm and answer figures.
- `asset-source/music/lanterns-and-letters.mp3`: full listening mix.
- Three FLAC files in that folder: lossless 32 kHz / 16-bit stereo masters.
- `lanterns-and-letters.mid`: editable five-instrument tonal arrangement. This does not include the synthesized brush/tap percussion or custom synthesis timbres.
- `arrangement.json`: full tonal event data, including stem assignment.
- `score.json`: timing, provenance, signal statistics and runtime audio hashes.
- `scripts/compose_score.py`: deterministic synthesis and export recipe.

No third-party recordings, instrument sample packs, SoundFonts or font binaries are bundled. The custom instruments are generated mathematically by the supplied recipe. MIDI program suggestions are only a starting point for re-orchestration.

## Mixing and integration

The two decoded stems start at the same AudioContext time and share one loop end. Scene changes automate gain on the existing nodes; they do not repeatedly construct new players. The ongoing music remains at 90 BPM.

Menu uses restrained rhythmic support; normal gameplay raises that layer; archive trials raise it slightly further. Paused play reduces the score level and low-pass cutoff. Completion/defeat settle the music; new gameplay restores the mix. A short output ramp, effects/music buses and compressor keep transitions controlled. The sound icon gates the whole output, not just key clicks.

New-player defaults are 80% master, 50% music and 65% effects. Bus trim and scene gain also apply, so these percentages are not a calibrated acoustic loudness specification. Existing v2 mute/music preferences are retained.

Music loads after a gesture, with no external requests in PLAY.html. Both MP3 files total about 4.1 MiB compressed. Decoding in the tested Chromium context resampled them to 44.1 kHz: approximately 71.8 MiB of decoded buffers. Active music nodes remain at two during ordinary menu/play changes. Background loss ramps output off and suspends the context; re-entry keeps gameplay paused.

## Signal checks

The full lossless listening mix measured **−14.7 LUFS integrated**, **2.3 LU loudness range** and **−2.7 dBFS true peak** using ffmpeg ebur128. Runtime mix levels are lower and scene-dependent. These engineering measurements are not a substitute for listening on headphones, speakers and target devices. The final four milliseconds are seam-smoothed; source sustain and reflections wrap circularly. Browser decoder loop checks and exported signal checks are recorded under `docs/qa/`.

## Regeneration and replacement

```bash
python3 -m pip install -r scripts/audio-requirements.txt
# ffmpeg with libmp3lame must also be installed on the authoring computer.
npm run audio
npm run build
```

Dependency installation is optional and not part of playing the game. For re-orchestration, deliver phase-aligned, same-length stereo stems and update the loop duration in `src/audio/audio.js` if the arrangement length changes. Preserve the two runtime filenames or update that module. Replace the listening mix and provenance metadata too. Do not add copyrighted music without the relevant rights.

## Reference boundary

The user supplied https://www.youtube.com/watch?v=O1b81SRshpE as a mood reference. Its moving frames/audio were not accessible in the delivery environment. No claim is made that this score matches the original tempo, instruments, melody, or mix. This score interprets the user's requested relaxing, engaging atmosphere.
