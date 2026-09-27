# Typekeeper: Enchanted Library — v3.3.6

Scroll-art and text-clearance repair, built from the actual full v3.3.5 package.
The title screen and gameplay share the same corrected renderer. Gameplay rules,
randomized new attempts, music, saves, controls and the rest of the UI are retained.

## Run the prebuilt game

Stop the previous local Typekeeper server with Control+C to reuse its address.
Download the ZIP to Downloads, then on macOS:

```bash
cd "$HOME/Downloads" &&
unzip -o "Typekeeper_Enchanted_Library_v3.3.6_Full_App.zip" &&
cd "$HOME/Downloads/Typekeeper_Enchanted_Library_v3_3_6" &&
bash START_MAC.command
```

The launcher verifies the shipped files, then prints the folder, version, build ID
and URL. It starts at port **4355**, or the next free port. The browser tab must say
**Typekeeper: Enchanted Library — v3.3.6**. Nothing kills an existing process.
Use the printed new URL rather than refreshing an unrelated older server.

The Mac launcher uses installed Python 3, or installed Node.js as a fallback.
No package installation, account or API key is required for normal play.
Windows/Linux launchers and a self-contained `PLAY.html` are also included.

```bash
open "$HOME/Downloads/Typekeeper_Enchanted_Library_v3_3_6/PLAY.html"
```

## What this corrects

The former material put its rollers and cords inside the area the layout reserved
for letters. Single-line tests missed the fact that the words overlapped decoration.
The seal background and glyph also used different origins.

`src/render/imperial-scroll.js` now defines one coordinate system for:
- the paper and both narrow engraved brass rollers;
- the inset spell medallion and its centred glyph;
- the protected full-word ink region, including native font overhangs.

Cards size around the measured content instead of borrowing unrelated model widths.
Decorative cords/tassels stay outside the content region. Words remain complete and
single-line; normal content widens before an exceptional oversized test string fits
down. The same contract is checked on the real title cards and during gameplay.

The three menu scrolls are now opaque. IMAGINE is shifted slightly left so the wider
correctly padded scroll does not cover the character. The menu controls are unchanged.
A separate native Canvas error in WIND's inherited animated path was also repaired.
Spell strengths, timers, particle settings and other effects are not rebalanced.

## Preserved controls and saves

Type a word and press Enter. Keys **1–4** cast FIRE / ICE / SLOW / WIND without
changing your word or selection. The existing subtle captions beneath the books
are preserved. FIRE clears active words; WIND clears only the missed-paper pile.

New game and Retry retain randomized vocabulary. Continue restores the saved attempt.
The v3.2.1 balance rules and storage key remain current: zero campaign starting spells,
two-charge capacity per spell, scarce early drops, and the same speed curve.
Scores do not move to Legacy just because the scroll art changed.

Browser storage is scoped to its address. Reusing the same browser and server port
retains progress. Use Records → Export save / Import save when moving between an
old address, another computer, another browser, or the standalone file.

## Full source and static deployment

`src/` contains editable game and procedural artwork source. `public/assets/` and
`asset-source/` retain all runtime art/audio and editable original masters. `dist/`
is the complete prebuilt modular website; `PLAY.html` is the embedded edition.
No font binaries or external content services have been introduced.

```bash
npm ci --offline --ignore-scripts --no-audit --no-fund
npm test
npm run check
npm run build
```

The build now rejects inconsistent source version tags and missing/out-of-order
standalone module dependencies before exporting, and syntax-checks the assembled
embedded script. Startup integrity verification remains enabled.

The existing Vercel configuration uses `npm run build` and the `dist` output directory.
This ZIP does not create, connect, or deploy a remote project by itself.

## QA reproduction

Current evidence is under `docs/qa336/`. See `docs/QA_REPORT.md` for actual results
and testing limits; historical claims are not counted as new tests.

```bash
python3 e2e/scroll_repair_tests.py --executable /usr/bin/chromium
python3 e2e/scroll_repair_tests.py --mode modules --executable /usr/bin/chromium
python3 e2e/single_row_release.py --executable /usr/bin/chromium
python3 e2e/single_row_release.py --mode modules --executable /usr/bin/chromium
python3 scripts/release-audit.py
```

Browser tests need `e2e/requirements.txt` and an installed Chromium; substitute its
actual executable path on another OS. These fixtures execute the shipping drawing,
input, audio and game code. Only transport URLs and the existing diagnostic guard
are adapted. They do not certify an actual Mac/Safari or live Vercel installation.

## Existing linked project

`bash scripts/apply-update.sh /absolute/path/to/your/existing/Typekeeper/project`
backs up the target and preserves `.git`, `.vercel`, `.env*`, `node_modules`, and an
existing `vercel.json`. A missing target is rejected. Use the separate-folder launcher
above when your old linked folder no longer exists. No remote writes are made.
