# Typekeeper v3.3.6 — Scroll repair and validation

**26 September 2026 (Los Angeles) · app 3.3.6 · gameplay ruleset typekeeper-3.2.1**

## What failed in the delivered 3.3.5 build

The user's screenshot was reproduced with the actual prior ZIP. Its card layout
started ordinary words about 15 logical pixels from the nominal left edge, while
its rollers and cords extended to approximately 33 pixels. The right side had the
same mismatch. Consequently the words were single-line but intersected the scroll
ends. The earlier tests for one full string on one baseline did not detect this.

The seal backing was also painted at a different origin from the live magic glyph.
This was an artwork/layout defect, not a user setup problem and not a reason to tell
the user to open another folder. `qa336/baseline-reproduction.json` records the
native browser measurements for WONDER, STORY and IMAGINE in 3.3.5.

A separate animated WIND path in that original package invoked `bezierCurveTo` with
four arguments instead of six. The old shipping build was exercised in Chromium
and threw a native TypeError. The corrected path is now tested with motion enabled.

## Repair

The new `imperial-scroll.js` owns a shared geometry contract. Both the cached artwork
and the live text/icon painter use it. A measured ink region includes glyph
side-bearings and overhangs, not just nominal string advance width. Rollers, silk
seams, medallions and text have explicitly separated horizontal regions.

The scroll ends are narrow engraved brass shafts with stepped fittings and pointed
finials, replacing the round knob-like ends. Layered silk, quiet woven borders and
short outer-edge tied cords retain the imperial-scroll direction. The magic crest
is centred inside its seal. Width follows the measured content, so safety margins
are not implemented as a large blank rectangle. Text stays one full horizontal row.

The same painter is used for menu and live cards, including matching-prefix ink.
Menu scrolls are opaque. IMAGINE shifts slightly left to keep its correctly sized
scroll off the character. The rest of the menu, game HUD and controls are unchanged.

The three-line build/version inconsistency from the earlier hotfix cannot be
silently rebuilt now: build checks reject differing source HTML, package and app
versions, and the standalone compiler validates dependency order and parses its
assembled script. These supplement, not replace, actual browser startup tests.

## Completed gates in the working build

| Gate | Result |
|---|---|
| Node logic, layout, state, storage and build-contract tests | **377 passed / 0 failed** |
| New scroll-repair suite, standalone | **19 passed** |
| New scroll-repair suite, ES modules | **19 passed** |
| Existing single-line/randomness suite, standalone | **19 passed** |
| Existing single-line/randomness suite, ES modules | **19 passed** |
| Existing material/caption/input suite, standalone | **26 passed** |
| Existing material/caption/input suite, ES modules | **26 passed** |
| Named browser checks total | **128 passed / 0 failed** |
| Unhandled JS exceptions in those completed browser suites | **0** |
| Release integrity/launcher/occupied-port/corruption cases | **7 passed** |
| Backup-first updater cases | **6 passed** |
| Syntax and production build | **Passed** |
| Existing asset/audio/core-source files compared to actual v3.3.5 ZIP | **77 byte-identical** |

These are named automated checks, not people, human playtest hours or studio
certification. The 377 count includes inherited regressions plus 21 new checks.
No new full campaign-balance sweep is claimed for this visual-only repair.

### Coverage relevant to the user's screenshot

The new tests observe the actual title renderer drawing WONDER, STORY and IMAGINE,
then check their ink bounds against the real hardware and paper regions. The failure
in the old release is retained as a measured before-case rather than guessed away.

The full dictionary is still exercised in **35,808 word/material/viewport/format
combinations**: 746 words, six skins, four viewport sizes, two build formats. Actual
Canvas text calls must be complete strings at baseline zero. A supplied obsolete
two-row layout cannot reinstate wrapping. New-game and Retry randomization and
Continue's saved-attempt behavior are rechecked through the actual controls.

An additional **1,056 rasterized ink cases** test short words, all three menu words,
long words and a 24-W custom stress string, with and without prefix highlighting,
on all six materials and at four viewport sizes in both build formats. Actual
rasterized lettering must stay inside the protected region. The icon drawing calls
must place the glyph at the centre of the inset medallion, away from the side rods
and from the first letter. A separate material-pixel check rules out the earlier
stray backing at the top edge.

Viewports: **1366×768, 1920×1080, 1280×720, 1024×768**. The existing single-row suite
also runs a DPR 2 fixture. Captured material sheets call the same shipping renderer;
they are not new concept artwork.

Every spell is exercised with motion ON through the actual keyboard, keeping the
current text and selected range. A further native Canvas pass samples all four
spell painters at onset, middle and end (28 states). Queued SLOW, pause inertness,
reduced motion, high contrast, usage captions, all six destruction paths and bounded
texture caches are rechecked.

## Preservation and packaging

The actual prior ZIP is the preservation baseline. The existing game model, random
seed logic, speed/economy rules, input policies, save implementation, word bank,
campaign, audio implementation, styles and original asset files are not changed.
Four compared source files change (build identity, main's version message,
presentation geometry and renderer); `imperial-scroll.js` is new. Build/QA/docs
scripts are updated separately. `qa336/preservation.json` lists the exact scope.

Old repeated screenshots and generated report copies were removed from the package
to avoid carrying release-history bulk. Full source, original editable art/music
masters, runtime assets, prebuilt dist, standalone PLAY, launchers and tests remain.
The old README is explicitly marked as historical. Current evidence is in qa336.

## Performance observations — not a 60 FPS guarantee

The full 12-card/high-pressure/four-layer-music/typing-feedback sample measured
**52.03 FPS**, with a **33.3 ms p95** interval in headless Chromium. A separate short
same-environment static-card comparison measured **46.26 FPS for 3.3.5** and
**56.25 FPS for 3.3.6**, with median Canvas CPU draw times of approximately **1.1 ms**
and **1.0 ms**, respectively. These samples use different feedback activity and
have environmental variability; neither is used to promise an improvement on the
user's hardware. All raw samples are retained. Input-to-display latency and actual
Mac/Safari/Windows frame pacing are not measured here.

## Environment and limits

Chromium 144.0.7559.96 on Linux; Node 22.16.0; Python Playwright. Browser navigation to
loopback and a controlled test origin was attempted and returned
ERR_BLOCKED_BY_ADMINISTRATOR. Tests therefore use the existing in-memory standalone
and Blob-module fixtures. Only asset/import transport and the diagnostic access
guard are adapted. Game mechanics, drawing code, native Canvas, DOM/input events
and audio implementations are not replaced.

Actual Node/Python HTTP payloads and launchers are tested separately. The Mac Bash
launcher is executed on Linux, not by double-clicking Finder. Actual Mac Chrome,
Safari, Windows hardware, live Vercel deployment, human aesthetic review and player
retention testing remain outside this run. This is not an independently certified
AAA or Steam-approved release.

During development the initial embedded build omitted the new scroll module, which
the startup smoke test caught as a missing reference. The compiler dependency guard
was added and both build formats re-tested. One inherited expected-version regex was
updated for 3.3.6. An inherited claim that the whole painter was byte-identical to a
much older version was replaced with direct text/geometry/raster checks; its expected
hash was not simply rewritten to conceal changed artwork.

## Fresh-package verification

The CRC-checked candidate was extracted into a new empty folder. Offline install,
all **377 tests**, syntax checks and rebuild passed. **All 51 runtime outputs were
byte-identical**, including PLAY.html and the complete dist tree. Both new repair
suites passed again (**38 repeated checks**) and the launcher audit passed again
(**7 repeated checks**). The new source-version fault injection was rejected before
export. Repeated cases are not added to the named browser total. The outer script
time limit interrupted the final launcher invocation; that audit was completed in
a separate call, followed by another runtime hash comparison. Exact evidence:
`qa336/fresh-package.json`.

## Reproduce

```bash
npm ci --offline --ignore-scripts --no-audit --no-fund
npm test
npm run check
npm run build
python3 e2e/scroll_repair_tests.py --executable /usr/bin/chromium
python3 e2e/scroll_repair_tests.py --mode modules --executable /usr/bin/chromium
python3 e2e/single_row_release.py --executable /usr/bin/chromium
python3 e2e/single_row_release.py --mode modules --executable /usr/bin/chromium
python3 scripts/release-audit.py
```

Use the installed Chromium path on another OS. Normal play does not need QA tools.

**Build:** `3.3.6-31b6fcc67e9c4a2c`

**PLAY.html SHA-256:** `a6be0555cc22bdd7370a587bdfd2bc5492918014584da6b9d0a3f56140dc8c62`
