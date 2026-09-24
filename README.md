# Typekeeper: Enchanted Library

**Version 3.2.0 · 23 September 2026 · faster pacing and pressure-responsive feedback**

Built directly from the supplied v3.1 archive. This full browser game includes its
source, 48 chapters, eight wings, three difficulties, four spells, expressive
Typekeeper, mastery, practice, Endless, original music, tests and local launchers.
No account, API key, CDN, game-engine installation or runtime package download is needed.

## Play

Extract the archive and open `PLAY.html`, or double-click `START_MAC.command` /
`START_WINDOWS.bat` for the prebuilt website at a local HTTP address. On Linux use
`bash START_LINUX.sh`. The server launchers use an existing Python 3.9+ or Node 20+.
The standalone HTML needs neither. Real Safari/Windows/macOS testing remains a release gate.

```bash
cd "$HOME/Downloads"
unzip -o "Typekeeper_Enchanted_Library_v3.2_Full_App.zip"
cd "Typekeeper_Enchanted_Library_v3_2"
bash START_MAC.command
```

Stop an earlier local server with Control+C to reuse its origin and existing saves.
The separate v3.2 directory leaves the earlier release intact.

## Update your existing GitHub + Vercel project

The included updater copies v3.2 into your existing v3.1 project **after making a
local backup of its game files**. It preserves `.git`, `.vercel`, environment files,
and your existing `vercel.json`. It never deletes a repository, force-pushes, logs
in, changes account settings, or deploys by itself. Backups live beside your project
under `Typekeeper_Backups`. Export a game save before updating.

```bash
bash "$HOME/Downloads/Typekeeper_Enchanted_Library_v3_2/scripts/apply-update.sh" "$HOME/Downloads/Typekeeper_Enchanted_Library_v3_1"
cd "$HOME/Downloads/Typekeeper_Enchanted_Library_v3_1"
npm test
npm run build
git add .
git commit -m "Typekeeper v3.2: faster pace and adaptive feedback"
git push
```

The updater accepts another existing Typekeeper path as its first argument. If your
Git integration is connected, the push should trigger the existing Vercel project.
This update was tested on synthetic local folders, **not your actual Mac/repository**.
No remote GitHub/Vercel change was performed in preparing this archive.

A new Vercel import uses Framework **Other**, Build `npm run build`, Output `dist`,
Install `npm ci`, and repository root. Keep using your established production domain;
save storage is origin-specific. New random preview URLs have separate storage.

## What's different in 3.2

- **Earlier challenge:** authored speed/arrival knots bring pressure forward, and
  medium words start entering chapter 2. No skill-based mid-word rubber banding.
- **Pressure music:** two original synchronized layers enter smoothly as the pile
  rises; urgent double-time articulation grows above 65%. WIND releases them quickly.
  The original theme, tempo and original two stems are retained, not sped up.
- **Typing feel:** small matching-letter glints, full-word-ready chime, a paper sheen
  on completion, and short gold score sparks. Enter is still required.
- **Foley:** varied mechanical keys, weighted paper impacts, separate bonus/book/streak
  rewards, distinct spell cues, natural effect endings and page turns.
- **Results:** a short interruptible bonus count with restrained tick/seal sounds.
  Points and stars are saved first. Next/retry never waits for the animation.
- **Quiet alternatives:** independent pressure-music and typing-shimmer switches;
  global mute, per-bus levels and reduced motion remain honored.

The artwork, chapter names, HTML composition, four spells, item capacities, scoring
formula, star requirements, trial rests, retry safeguards and no-waste protections
are preserved. A large streak label now yields to live words rather than covering them.

## Controls

Type a displayed word and press **Enter**. Backspace and normal cursor/selection editing
work. Number keys/numpad **1 FIRE · 2 ICE · 3 SLOW · 4 WIND** cast without replacing your
buffer. Spell names plus Enter also work when no exact live word takes precedence.
Escape pauses. Clicking the result total skips its count-up. No auto-submit was added.

FIRE burns cards without granting points, books or chapter progress. ICE freezes cards
and arrivals for six active seconds. SLOW saves eight seconds of 42%-speed falling,
waiting behind ICE. WIND clears the accumulated paper pile. Empty/unavailable casts
never waste stock. Up to three books of each spell can be stored.

## Saves and records

3.2 writes `typekeeper-enchanted-library-v3.2` and reads previous v3.1/v3/v2/v1 keys
without rewriting those older keys. Settings, chapter unlocks, stars and valid bookmarks
migrate. Prior scores move to **Legacy** because the pace changed. A resumed old-rule
run keeps its score provenance in Legacy; a fresh expedition earns current records.

Old mute/music preferences are retained. Pressure music and typing shimmer are on by
default unless subsequently disabled. Audio unlocks on interaction. After tab/focus
loss, music is suspended and gameplay requires deliberate resume.

All progress and records remain in the player's browser; there is no global leaderboard
or account sync. Storage-blocked/private contexts can lose data. Export/import is
available in Records. A new domain is a new save origin; import an exported save there.

## Build and test

Node 20+; tested here with Node 22.16.0. The main project has no npm dependencies.

```bash
npm ci --offline --ignore-scripts --no-audit --no-fund
npm test
npm run check
npm run build
npm run test:balance
npm run test:endurance
```

`npm run dev` serves source; `npm start` serves the prebuilt `dist` folder. Python
Playwright/Chromium are optional authoring dependencies for browser audits:

```bash
python3 -m pip install -r e2e/requirements.txt
python3 -m playwright install chromium
python3 e2e/browser_tests.py --inline
python3 e2e/polish_tests.py
python3 e2e/mechanics_tests.py
python3 e2e/pressure_tests.py
python3 e2e/feedback_performance.py
```

Each browser script accepts `--executable /absolute/path/to/chromium`. The execution
environment used for this delivery blocks local browser navigation; these audits
execute the real shipping standalone HTML in memory with only its diagnostic access
guard enabled. Separate Node/Python HTTP payload checks verify bytes and MIME types,
not browser HTTP execution. Do not treat this as Safari, Windows, Steam Deck or
installation/save-persistence validation on physical hardware.

## Audio authoring and previews

`asset-source/music/pressure-and-relief-preview.mp3` is a 40-second **authored
listening demonstration** of the new pressure layers and release, not gameplay audio.
`asset-source/audio/Typekeeper_SFX_Preview.mp3` is a 20-second reel rendered through
the actual GameAudio synthesis in OfflineAudioContext; its cue sheet is included.
Both previews are optional files outside the normal deployed payload.

The original theme remains under `asset-source/music/lanterns-and-letters.*`.
Additional pressure/urgency FLAC masters, MIDI, event JSON and generation code are
included. Rebuild additions with `npm run audio:pressure` then `npm run build`.
See `docs/MUSIC_PRODUCTION.md` for Python/ffmpeg dependencies and mixing details.
No third-party audio samples or font files are bundled.

## Evidence and release boundary

`docs/QA_REPORT.md` records the actual test results, assumptions, unresolved gates
and file preservation. Raw current evidence is in `docs/qa`; historic results are
under `docs/qa/v3.1-baseline`. `docs/RULES.md` and `docs/DIFFICULTY_TABLE.md` define
the actual numerical behavior. `SHA256SUMS.txt` covers the delivered package.

The latest reference video was not accessible for frame/audio inspection. Additions
are original interpretations of the user's described pressure, shine and score sounds,
not verified source-video parity. No human fun/retention/music test, Steam package,
Valve approval, Unreal port, or commercial/viral success is claimed.
