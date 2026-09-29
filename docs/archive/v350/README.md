# Typekeeper: Enchanted Library — v3.5.0
## Clarity, Mastery & Homecoming

A complete upgrade of the supplied **v3.4.0 full app**. The same library, character,
48 chapters, typing controls and scarce rescue magic now communicate learning,
progress and completion more clearly. This is the full editable app, not a patch.

## Play

Extract the complete ZIP. On Mac:

```bash
cd "$HOME/Downloads"
unzip -o "Typekeeper_Enchanted_Library_v3.5.0_Full_App.zip"
cd "Typekeeper_Enchanted_Library_v3_5_0"
bash START_MAC.command
```

The tab and launcher must say **v3.5.0**. The launcher checks the prebuilt files and
prints the exact folder/address. It uses port 4355 or the next available port;
it never terminates another process. Python 3 or Node 20+ is needed for the server.

Alternatively, open **PLAY.html** for the self-contained no-server edition. No
account, API key, internet connection or package installation is needed to play.
Do not double-click the modular `index.html`; use its server or a web host.
Windows and Linux launchers are also included.

**Keep your save:** stop the previous local server with Control+C before opening
this release to reuse its address. Same-origin saves retain the existing key and
ruleset. Records → Export save / Import save moves progress between addresses,
ports, browsers or local files. Some browsers restrict storage for local files;
the game reports unavailable storage instead of pretending it saved. Export a
backup before replacing an older installation. Existing scores are not reset.

## What is upgraded

**Results that explain themselves.** Submission accuracy is explicitly labelled.
Missed words and wrong submissions are shown separately, followed by the exact
next-star requirement. Both shortfalls are stated when necessary. The result and
the medal award share the same rule definitions; no score or star threshold changed.

**One coherent combo signal.** Every actual multiplier increase drives the visual
stamp, sound and feedback together: 8, 16, …, 64 correct words. The stamp shows the
actual multiplier, capped at ×3. Continuing an existing run does not replay an
upgrade. Five-word milestones no longer impersonate multiplier changes.

**Small, timely guidance.** The first fully matched word reveals `ENTER · SAVE`
on the existing input paper. It goes away after a successful submission. The
first genuinely earned, usable ICE charge shows the key-2 hint near its book.
Pause and hidden tabs do not consume its teaching window. Hints can be disabled.
No auto-submit, free spells, forced tutorial screen or new control scheme.

**Readable controls, unchanged stage.** Hotkeys, spell readiness/counts, captions,
trial text and relevant timers scale for laptop legibility. At narrow heights the
redundant second hotkey is omitted; the main key remains visible. Main word cards
remain large and single-line. The 4:3 stage, desk and minimal HUD are retained.

**A real reason to be pleased with a result.** Results highlight one genuine
improvement: a higher mastery rating or a chapter score PB. Score comparisons are
scoped to ruleset, pace, mode and chapter and capture the old value before updating.
A record stores the score, WPM and accuracy of one real attempt. Older independent
maxima are not fabricated into one run. First comparable attempts establish a
baseline; ties and worse runs do not announce an improvement. The chapter map
makes unearned mastery stars and restored wings clearer.

**Eight distinct places and a proper homecoming.** Each wing has a recognisable
shelf landmark, while all 48 title-linked treatments remain. Campaign chapters
6/12/18/24/30/36/42 have brief wing-restoration moments. Chapter 48 has a dedicated
four-second homecoming: the last book returns, eight seals light, the character
makes a subtle celebration and an original short musical motif resolves the trip.
Enter, Escape or the visible Continue button skips to results, never into another
chapter. Reduced motion uses a static reward immediately. Practice 48 and Endless
do not trigger the campaign ending. The final result offers Endless, chapters
and the main menu rather than automatically starting another run.

**Magic attached to the world.** FIRE originates at its book, reaches the actual
removed cards and resolves through paper-edge light, char and ash, instead of a
large screen-wide flame wall. ICE retains its clear lettering corridor. New wing
and ending sound motifs reuse the existing synthesis palette, respect sound/music
preferences and are cancelled on skip, leave, mute or visibility loss.

## Deliberately preserved

Enter-to-submit; selection/caret-safe keys 1–4; all 48 chapter titles and quotas;
three paces; the difficulty curve; randomized New game / Retry; deterministic
Continue; campaign opening with zero stock; first ICE opportunity on card six;
two-charge capacity; six-second ICE; eight-second SLOW and queued spell handling;
scoring and medal formulas; FIRE granting no score or quota; WIND clearing only
missed paper; original illustrations, character assets, four music stems and
editable masters; the existing save key and ruleset `typekeeper-3.2.1`.

No accounts, multiplayer, daily tasks, equipment trees, additional spells,
leaderboard or unimplemented ghost UI were added.

## Source, build and deploy

- `src/`: editable application ES modules and CSS.
- `public/assets/`: complete runtime art/audio. `asset-source/`: original masters.
- `dist/`: complete prebuilt modular website. `PLAY.html`: embedded offline edition.
- `tests/`, `e2e/`, `qa350/`: reproducible tests and current release evidence.
- `docs/`: changes, implementation, QA limits and remaining human/device checks.

There are no build-time package dependencies:

```bash
npm ci --offline --ignore-scripts --no-audit --no-fund
npm test
npm run check
npm run build
```

The Vercel configuration builds with `npm run build` and serves `dist/`. This
package does not log into, push to or deploy any hosting account.

To update an existing local checkout while keeping `.git`, `.vercel`, environment
files and its existing `vercel.json`, use its exact path:

```bash
bash scripts/apply-update.sh "/absolute/path/to/your/existing/typekeeper-project"
```

The updater refuses unrelated/missing/self/symlink targets and makes a backup
first. Source and target must be different folders. Do not guess a destination.

## Reproduce validation

```bash
npm test
npm run check
npm run test:flow
python3 scripts/browser-release.py --executable /usr/bin/chromium
python3 e2e/live_journey.py
python3 e2e/feedback_performance.py --executable /usr/bin/chromium
python3 scripts/release-audit.py
python3 scripts/test-update.py
```

Browser tests require Python Playwright and an installed Chromium binary. Supply
its actual path on your OS. `--mode standalone` or `--mode modules` selects one
format. These dependencies are for testing, not playing. The normal-clock journey
currently uses `/usr/bin/chromium`; adjust its executable for a different system.

Read `docs/QA_REPORT.md` for what actually ran and what did not. Browser fixtures
load shipping code through embedded HTML / Blob-module transport because ordinary
browser navigation is blocked in this environment. They do not substitute the game
engine, renderer, DOM or audio. Automated fixtures are not human play sessions,
retention evidence, platform approval or independent AAA certification.
