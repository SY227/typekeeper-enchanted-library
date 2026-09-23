# Typekeeper: Enchanted Library

**Version 3.1.0 · 23 September 2026 — mechanics and player-experience pass**

A complete browser-native typing game: 48 chapters, eight library wings, four spells, reactive character expressions, a chapter atlas, local records, and an original layered soundtrack. This is the full source-and-assets handoff, not a screenshot prototype or a download wrapper.

## Play

Extract the archive. Open **PLAY.html** in a desktop browser for the self-contained edition. It includes all game code, artwork and music; no account, engine, API key, npm installation or server is needed for this edition. Browser handling of local-file saves varies; the local server is the recommended path for a stable storage origin.

For the normal website, double-click **START_MAC.command** or **START_WINDOWS.bat**. The launcher uses an already-installed Python 3 or Node.js. On Linux, run `bash START_LINUX.sh`. Python 3.9+ or Node 20+ is expected; Python 3.13.5 and Node 22.16.0 were used in the delivery environment.

### Mac Terminal

Download the ZIP to Downloads, then:

```bash
cd "$HOME/Downloads" && \
unzip -o "Typekeeper_Enchanted_Library_v3.1_Full_App.zip" && \
cd "Typekeeper_Enchanted_Library_v3_1" && \
bash START_MAC.command
```

The server binds only to 127.0.0.1, starting at port 4173. A busy port causes it to try the next available port. Keep that terminal open while playing; **Control+C** stops it. To use a fixed alternative port explicitly:

```bash
python3 scripts/server.py --port 8090 --open
```

Do not double-click the source `index.html` or `dist/index.html`: those editions use ES modules and need HTTP. Use `PLAY.html` for direct opening.

## Upgrading from v3.0 / v2

The archive extracts to **Typekeeper_Enchanted_Library_v3_1**, leaving the old
folder intact. Stop the old local server first, then reuse the same address,
port and browser profile. **Export the old save before removing anything.**

The new key is `typekeeper-enchanted-library-v3.1`. It reads valid v3, v2 and v1
saves when no current save exists. Original keys are never overwritten or deleted.
Settings, unlocked chapters, earned stars and valid campaign bookmarks are kept.
Old score totals go to **Records → Legacy**, because pacing and spells changed.
An old bookmarked campaign can continue under the new mechanics, but its final
mixed-version total stays in Legacy. A fresh run earns current-ruleset records.
New-rule practice records are also filtered by the chapter attempted.

Migration cannot cross browser profiles or addresses. For a different origin,
use **Records → Export save** in the old app, then **Import save** here. Local-file
storage behavior varies by browser, so the local server is recommended. A corrupt
stored save is preserved in a bounded `-recovery` key before falling back to an
intact older save; it is not silently discarded. Save import is local, not cloud sync.

Previous audio settings are retained. Music is not recomposed in this release.

## Controls

| Input | Action |
|---|---|
| Letters + Enter | Type and submit a falling word |
| Backspace / cursor / selection | Edit the current word |
| 1 / 2 / 3 / 4 | FIRE / ICE / SLOW / WIND |
| Click a glowing spell book | Cast without losing the typed word |
| Spell name + Enter | Alternate way to cast a stored spell |
| Escape | Pause; resume or return from menus |
| Speaker icon | Mute/unmute **all** audio |

Keyboard shortcuts preserve the buffer and selection. Holding Enter or a spell key does not repeat the action. Colored word cards earn spell books; books glow when ready. An active ICE/SLOW recast, empty-field FIRE and empty-pile WIND do not waste stock. Instructions and scoring details live in **How to play**, not permanently around the playfield.

## Music

**Lanterns & Letters** is an original 40-bar, 90 BPM instrumental loop, approximately 1:47 long. The hearth stem carries the piano-like lead, plucked figures, soft bells, bass and pads. A synchronized motion stem adds light percussion and answering notes during play and trials. Menu, pause, results and gameplay mix the same ongoing audio clock instead of restarting a short loop.

Music begins after a player gesture. Settings provide master, music and effects levels. Background focus loss suspends audio and pauses play. Missing/blocked audio never stops the game. Both stems, a listening MP3, lossless FLAC masters, MIDI arrangement and deterministic composition script are included. See `docs/MUSIC_PRODUCTION.md` for provenance and measured audio properties.

## Mechanics changes

All 48 chapters have a continuous speed/vocabulary curve, with separate Relaxed,
Classic and Maniac tuning. Empty-field waits shorten after a quick clear without
changing the speed of already falling cards. Special cards use shuffled four-spell
cycles; there are no rolls repeatedly redrawn because a spawn lane is blocked.

SLOW keeps its full remaining duration while ICE is active. A stocked but useless
FIRE/WIND book says STORED instead of flashing READY. Simultaneous spell/streak
feedback no longer prints overlapping words in the same location. The game still
requires Enter; missing a word is not refunded, but immediate submission of that
just-landed word has a 0.35-second guard against an additional typo penalty.

Campaign death offers **Retry chapter** from the stored chapter-opening score,
books and pile. Retrying restores the same seeded opening rather than rerolling
it. Failed-attempt points do not accumulate into the retry. Practice can earn
stars on an unlocked chapter without secretly unlocking the campaign's next one.
Endless can be ended from the pause menu and its score is recorded as retired.

## Source workflow

No npm packages are required by the game or its build:

```bash
npm ci --offline --ignore-scripts --no-audit --no-fund
npm test
npm run check
npm run dev
```

`npm run dev` serves the source using the included Node server. Stop it with Control+C. Rebuild and preview:

```bash
npm run build
npm run preview
```

The build recreates **dist/** and **PLAY.html**. Node scripts use only the standard library. Network access is not required for this build. The runtime has no font CDN, telemetry, ads or remote music dependency.

Optional art exports use `scripts/asset-requirements.txt` and `npm run assets`. Optional soundtrack regeneration uses `scripts/audio-requirements.txt`, ffmpeg with libmp3lame, and `npm run audio`. Neither is needed to play or to rebuild using the included assets. The full custom sound is in FLAC; MIDI is an editable arrangement, not a guarantee of matching timbres in another synthesizer.

### Reproduce the mechanics audits

```bash
npm test
npm run test:balance
npm run test:endurance
```

The balance audit runs synthetic agents, not human playtests. It writes the raw
60 campaign attempts and 432 isolated chapter attempts to `docs/qa/`.
A comparison can use a separately extracted v3.0 baseline:

```bash
node scripts/playtest-simulation.mjs --baseline /absolute/path/to/v3/project
```

Optional browser checks need the packages in `e2e/requirements.txt` and an installed
Playwright browser. Normal HTTP execution should be preferred on your machine:

```bash
python3 -m pip install -r e2e/requirements.txt
python3 -m playwright install chromium
npm run test:e2e
npm run test:polish
npm run test:mechanics
```

`test:polish` and `test:mechanics` explicitly load the standalone file in browser
memory. `test:e2e -- --inline` is the managed-browser fallback, not HTTP coverage.
All three accept `--executable /path/to/chromium`. Diagnostics are enabled only in
the test fixture, never in an ordinary launch of PLAY.html.

## Contents

| Path | Purpose |
|---|---|
| PLAY.html | Embedded, standalone game |
| dist/ | Production static site ready to upload to a static host |
| src/ | Complete editable model, rendering, UI, audio and data modules |
| public/assets/ | Local runtime artwork, spell vectors, expressions and two MP3 stems |
| asset-source/ | Illustration masters, expression assets/rig, vector masters, soundtrack source |
| scripts/ | Build, static servers, asset/audio generation and audits |
| tests/ | Node logic, storage, rules and polish regressions |
| e2e/ | Optional Playwright browser audit scripts |
| docs/ | Current rules, release notes, music, evidence and release checks |
| tools/ | Optional, unexecuted Blender/Unreal **artwork** review/import helpers |

## Hosting

Upload the **contents of dist/** to a static web host, keeping relative paths intact. Vercel and Netlify configuration files are included. This is a browser-native Canvas 2D game, not an Unreal executable, streaming service, or authenticated multiplayer service. Records are genuinely local to the browser.

## Validation and release boundary

Read **docs/QA_REPORT.md** and **docs/RELEASE_CHECKLIST.md**. Automated checks cover the shipped logic, embedded Chromium interaction and audio, HTTP payload integrity and clean rebuilding. The managed browser does not allow local HTTP/file URL navigation; embedded interaction tests and server integrity checks are separate. This handoff does not certify actual macOS Safari, mobile keyboard ergonomics, live hosting, human difficulty testing, commercial identity clearance, or studio-quality listening approval. A Steam desktop package, depot configuration, any advertised Steamworks features, and Valve review are separate release gates; see `docs/STEAM_READINESS.md`.

The longer reference video's moving frames/audio could not be accessed. The score is newly authored to the requested relaxing, rhythmic mood, not a copy or verified reconstruction of that recording.
