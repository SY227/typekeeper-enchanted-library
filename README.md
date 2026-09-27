# Typekeeper: Enchanted Library — v3.4.0

A complete browser game built from the accepted v3.3.6 release. This update adds
48 title-specific chapter treatments and new FIRE / ICE presentation. It retains
the corrected imperial scroll cards, single-line words, randomized new games and
retries, the v3.2.1 difficulty/economy, existing music, scores, and save compatibility.

## Play on Mac

Extract the whole ZIP and run its actual launcher:

```bash
cd "$HOME/Downloads" &&
unzip -o "Typekeeper_Enchanted_Library_v3.4.0_Full_App.zip" &&
cd "$HOME/Downloads/Typekeeper_Enchanted_Library_v3_4_0" &&
bash START_MAC.command
```

The tab must read **Typekeeper: Enchanted Library — v3.4.0**. The launcher verifies
prebuilt file hashes, prints the served folder and build identity, and opens the
correct address. It uses port 4355 or the next available port, never kills another
process, and needs either installed Python 3 or Node 20+.

Stop your previous local server with Control+C first to reuse the same address and
browser saves. Records → Export/Import save carries progress to a different
browser, host name, or port. No account or API key is required.

For an embedded no-server edition, open **PLAY.html**. Do not double-click the
modular **index.html**: it is intended for the included server or a web host.
Windows and Linux launchers are also supplied; their OS-specific user experience
is not represented as tested on Windows or macOS hardware.

## What changes

Every campaign chapter has a title-linked shelf still-life, an auxiliary bound-volume
inlay and restrained architectural light/ambient variation. Examples include Rain
on Glass, a clock at eleven for The Eleventh Hour, a warm brazier for Kindling,
constellations, and one candle for One Last Candle. Same library layout and HUD;
no extra gameplay obstacles. The complete 48-title mapping is in
`docs/CHAPTER_ART_SPEC.md`. Endless reuses the final chapter's appearance.

FIRE now has a layered rising flame front, curling tongues, hot-paper edges, char
and fine ash. ICE grows faceted crystals on the room margins, shades and scroll
ends, holds while the existing six-second freeze is active, then thaws in layers.
The lettering corridor is kept free of frost. Reduced motion retains static visual
identity and readable status without decorative animation.

The supplied YouTube reference could not be viewed in this environment. These are
original visual designs, not claimed copies of its unseen frames or audio. See
`docs/REFERENCE_ACCESS_340.md` for the actual access attempts.

## What is deliberately unchanged

- Same Enter-to-submit input, caret/editing and selection-preserving keys 1–4.
- Same 48 titles, chapter quotas, three paces, speed curve, trial rests and scoring.
- Same zero-stock campaign opening, two-charge capacity, scarcity and spell duration.
- Same randomized New game / Retry; Continue resumes the saved attempt.
- Same imperial scroll geometry, letter-safe regions and inset magic crests.
- Same original illustration assets, character, soundtrack and sound implementation.
- Same current save key / balance ruleset `typekeeper-3.2.1`; no score reset.
- WIND still clears only missed paper. FIRE still grants no points or chapter progress.

## Source, build and deployment

`src/` contains editable ES-module code. `public/assets/` holds runtime illustrations
and audio; `asset-source/` keeps the original editable masters. `dist/` is the
prebuilt modular website. PLAY.html embeds all runtime code/assets/music. There is
no network dependency in ordinary gameplay and no build-time package dependency.

```bash
npm ci --offline --ignore-scripts --no-audit --no-fund
npm test
npm run check
npm run build
```

Build checks reject mixed HTML/package/JS versions and fingerprint every relative
JS import. The included Vercel configuration builds with `npm run build` and serves
`dist/`. The ZIP does not link to or modify any hosting account.

The backup-first updater can copy into an **existing** Typekeeper project while
preserving `.git`, `.vercel`, environment files and an existing vercel.json:

```bash
bash scripts/apply-update.sh "/absolute/path/to/your/existing/typekeeper-project"
```

Use the exact folder that exists on your computer; the updater refuses a missing
or unrelated project. Source and target must be separate. No remote push/deploy is
performed by this helper.

## Reproduce QA

Tests need Python Playwright and an installed Chromium executable. These are QA
dependencies, not requirements for players.

```bash
npm test
python3 e2e/chapter_art_tests.py --executable /usr/bin/chromium
python3 e2e/chapter_art_tests.py --mode modules --executable /usr/bin/chromium
python3 e2e/scroll_repair_tests.py --executable /usr/bin/chromium
python3 e2e/scroll_repair_tests.py --mode modules --executable /usr/bin/chromium
python3 e2e/single_row_release.py --executable /usr/bin/chromium
python3 e2e/single_row_release.py --mode modules --executable /usr/bin/chromium
python3 e2e/book_leaf_tests.py --executable /usr/bin/chromium
python3 e2e/book_leaf_tests.py --mode modules --executable /usr/bin/chromium
node qa340/flow_audit.mjs --root . --out qa340/flow-model-repeat.json
python3 qa340/browser_flow.py --root . --mode standalone --out qa340 --executable /usr/bin/chromium
python3 qa340/browser_flow.py --root . --mode modules --out qa340 --executable /usr/bin/chromium
python3 scripts/release-audit.py
python3 scripts/test-update.py
```

Use the appropriate installed browser path on your OS. Browser loading in this QA
environment is documented in the report; these are actual Canvas/DOM/input/audio
implementations, not a mock game. Current run evidence is under `qa340/`. Baseline
reports retained under `docs/archive/` are historical, not current pass counts.

See **docs/QA_REPORT.md** for completed gates, exact build hashes, initial harness
failures, device limitations and fresh-ZIP verification. This is a testable browser
release candidate, not an independently certified AAA or Valve-approved release.
