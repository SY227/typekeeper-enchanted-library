# Typekeeper: Enchanted Library — 3.0 release report

**22 September 2026 · production build and source handoff**

## Results

| Check | Actual result |
|---|---|
| Node logic/storage/rules/polish regressions | **109 passed, 0 failed** |
| Main browser interaction regressions | **45 passed, 0 failed** |
| New editorial/audio/resume polish regressions | **24 passed, 0 failed** |
| Unhandled application JavaScript errors in those browser audits | **0** |
| Node and Python static-server checks | All **37** payload hashes match on each server; MIME, HEAD and missing-file behavior pass |
| Clean ZIP extraction → offline install → tests → syntax → build | All commands passed; **39** generated outputs byte-identical |
| Art recipe regenerated in a clean directory | **22** public asset/manifest files byte-identical |
| Audio file checks | Both runtime stems and full listening mix decode; stereo, equal frame counts, no clipped samples |
| Synthetic balance audit | **36** seeded runs using the actual shipping model |

The 178 automated logic/browser checks are not 178 human play sessions. Browser tests use controlled inputs/states and include explicit error injection for unavailable music and unsupported audio. The balance agents spell perfectly and have defined typing budgets; they are not predictions of a player's ability.

## What was exercised

The title and clean menu, removal of prototype labels, all spell keys and clicks, held-key protection, ordinary/dark word handling, partial typing and selections, active-spell timers and no-waste behavior, expressive pressure bands, WIND relief, transitions, campaign completion, practice/Endless restarts, chapter mastery and bookmarks, record filtering, save import/export, invalid data handling, high-pressure views and bounded card textures.

New polish checks also exercise first-gesture audio, real stereo decoding, synchronized music nodes, menu/game/trial mix changes without restarting, master mute, independent mixer buses, music/SFX toggles, repeated menus, pause mix, inert covered UI, countdown freezing/cancellation, focus loss, selection restoration, first-use hints, HUD preference, reduced motion, short-effects voice cleanup and audio-failure isolation. A quiet probe tone keeps the effects branch active when testing its actual gain automation. Unsupported/missing audio tests are deliberately injected conditions, not claims of an observed network outage.

## Measured performance

Chromium **144.0.7559.96**, Linux headless, a 1440 × 1040 browser viewport, one controlled scene with 12 cards and ICE/SLOW active. After a two-second warmup, 180 animation-frame callbacks were collected; the initial offset was excluded from frame-interval statistics.

- Average frame rate: **59.67 FPS**.
- 95th-percentile frame interval: **16.7 ms**.
- Median Canvas drawing time: **0.5 ms**.

This is a short controlled sample, not a guarantee across Macs, phones, GPUs, browsers or long sessions. The music remains at two persistent buffer sources across scene changes. Its decoded buffers occupied approximately 71.8 MiB in the tested context. Word-card texture cache tests enforce 96 entries / 32 MiB.

## Original score

**Lanterns & Letters**: 40 bars, 90 BPM, 4/4, D major, approximately **106.67 seconds**. The two phase-aligned MP3 stems are composed/synthesized from the supplied original arrangement; no third-party sampled music is included. The score changes mix by scene, never by restarting on each modal.

The full lossless listening mix measured **−14.7 LUFS integrated**, **2.3 LU** loudness range and **−2.7 dBFS** true peak with ffmpeg. FLAC loop endpoints match; decoded MP3 endpoints have small lossy differences, documented numerically in audio-integrity.json. Both runtime files decode to the same sample count; no source or decoded samples clip. These tests do not establish subjective musical quality or replace real listening tests.

## Build and reproducibility

The static payload contains **37** manifest-listed files totaling **5.52 MiB**, plus its build manifest. **PLAY.html is 7.61 MiB** and embeds all game code, artwork and music. Music decoding/loading begins after a gesture rather than blocking the first menu render.

A candidate archive was unpacked into a separate directory. Offline npm install, 109 tests, syntax checks and rebuild passed. The 38 dist files and standalone HTML—39 outputs total—matched the tested build byte-for-byte. Art export was independently rerun from the included masters and matched all 22 public asset/manifest files. No font binaries, node_modules, API secrets or paid runtime dependencies are packaged.

The final archive changes documentation and screenshot compression only after the clean-runtime comparison; final packaging verifies every included file against SHA256SUMS.txt. The full source and audio masters are part of the handoff.

## Exact validation boundary

The managed browser blocks localhost/file URL navigation. Browser tests therefore execute the exported PLAY.html in memory; only the existing diagnostic guard is enabled for controlled tests. The production export is also checked without that guard and exposes no test seam. Separately, actual Node/Python HTTP servers return the expected bytes, MIME types, HEAD responses and 404s. Those two facts must not be combined into a claim that browser HTTP navigation or the Mac double-click path was tested here.

Save serialization, validation, migration and a fresh-document import are tested. Real browser storage persistence across closing/reopening a hosted page remains a device/origin-specific check. The embedded test document has no normal persistent origin.

Actual Safari, Firefox, Edge, physical Mac/Windows keyboard and audio devices, live hosting, phone keyboard ergonomics, and human playtest/listening sign-off remain **not tested here**. The game is desktop physical-keyboard-first, not an accessibility-certified typing curriculum or phone-first adaptation. The title/asset identity has not undergone a commercial clearance review. Online/global competitive rankings are not part of this local game.

The longer reference video's moving frames/audio were unavailable. No original music/transitions/tempo parity is certified; the new score interprets the user's requested relaxing, rhythmic mood. The runtime remains browser-native Canvas 2D/JavaScript, not an executed Unreal/Blender game build.

## Reproduce

```bash
npm ci --offline --ignore-scripts --no-audit --no-fund
npm test
npm run check
npm run build
python3 scripts/http-audit.py
# Optional browser tooling must be installed first:
python3 -m pip install -r e2e/requirements.txt
python3 -m playwright install chromium
python3 e2e/browser_tests.py             # actual HTTP mode on a normal local machine
python3 e2e/polish_tests.py              # embedded export, explicit diagnostic fixture
```

Managed-environment equivalent: `python3 e2e/browser_tests.py --inline --executable /usr/bin/chromium` followed by `python3 e2e/polish_tests.py --executable /usr/bin/chromium`. Raw reports are in `docs/qa/`; current compressed running-app screenshots are in `docs/screenshots/`. Audio regeneration/audit has separately listed authoring dependencies.
