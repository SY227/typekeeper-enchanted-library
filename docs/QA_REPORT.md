# Typekeeper: Enchanted Library — v3.2.1 balance and QA report

**23 September 2026 · ruleset `typekeeper-3.2.1` · complete browser build and editable source**

## Decision and scope

The requested focused balance update is implemented: a more readable opening, scarce
spells, two-charge stock limits, carried drop schedules, and authored trial opportunities.
The uploaded **v3.2 ZIP** is the exact implementation and comparison baseline. All prior
art, music, pressure layering, renderer/VFX, layout CSS, chapter/vocabulary data and core
spell strengths are preserved. This is an authored variant, not measured original Typing
Maniac constants, a native Steam build, or a human-tested/AAA-certified release.

The most important qualification: **slower opening words do not make the whole game
easier.** The much smaller supply of rescue tools makes later no-retry campaigns less
forgiving. Both completions and losses are retained in the comparison below. No target
win rate, recommended human WPM, retention outcome, or commercial success is claimed.

## Final engineering gates

| Gate | Observed result |
|---|---|
| Unmodified uploaded v3.2 logic baseline | **210 passed / 0 failed** |
| Final logic / storage / rules / property suite | **275 passed / 0 failed**; 65 additional cases |
| Main UI / input | **45 passed / 0 failed** |
| Mechanics | **27 passed / 0 failed** |
| Audio / editorial / resume | **24 passed / 0 failed** |
| Adaptive music / shimmer / score feedback | **33 passed / 0 failed** |
| New economy / migration / trial integration | **26 passed / 0 failed** |
| Total browser checks | **155 passed / 0 failed**, with zero unhandled application JavaScript exceptions |
| Supply-policy audit | **100 current + 100 baseline campaigns**; 4,800 scheduled chapters per version |
| Finite-speed campaign comparison | **75 current + 75 baseline attempts**; all outcomes retained |
| Isolated chapters | **432/432 completed** with declared calibration agents, 48 × 3 paces × 3 seeds |
| WIND policy sensitivity | 90 current attempts; 45 repeat the primary reactive profiles intentionally |
| High-pressure / no-starter cases | **42/42 terminate**, 16 completions and 26 ordinary losses; no timeout |
| Resource-assisted Endless reliability | **3/3 passed**, chapters 49–200 completed and 201 entered |
| Existing content preservation | **73/73 files byte-identical** in the explicit preservation scope |
| Local HTTP payload checks | **42 payloads per server**, Node and Python: hashes, MIME, HEAD and 404 passed |
| Audio decode / mix regression | Four original stems and tested pressure mixes passed signal / clipping checks |
| Backup-first update helper | **6/6 disposable-filesystem scenarios passed** |
| Clean ZIP extraction / offline install / test / check / rebuild | **PASS — 44/44 generated outputs byte-identical** |

The 275 logic and 155 browser cases are tests, not independent people. Assertions,
frames, simulated chapters and iterations are not relabeled as separate human testers.
The original regression tests that pinned the old cap, tutorial gifts or speeds were
updated only for those approved intentional rule changes. The final passing run includes
all retained rule/audio/input checks, not just the new economy suite.

## Exact balance policy

Campaign already began with no stored books in the baseline; this remains true. What
changed is its four-card tutorial gift sequence: the **sixth actual arrival is now an
ICE opportunity**, which must be typed to earn it. The first twelve arrival slots contain
one power instead of four in a clean chapter-one run. Extra arrivals after misses can
naturally lead to additional scheduled opportunities; the stage is not artificially
capped at one reward regardless of duration.

Capacity is **two per type, eight total**. FIRE still clears all active cards without
awarding points/progress/books; WIND resets danger fully; ICE lasts six seconds and
SLOW eight. ICE/SLOW queuing and all no-waste protections remain unchanged. Practice
and Endless retain their separate one-per-type training/starter kits and record modes.

Ordinary new gaps are **8–11** cards at chapters 1–6, **8–10** at 7–12, **7–10** at
13–24 and **6–9** from 25. Existing gaps carry across ordinary chapter boundaries;
there is no fresh reward countdown merely for pressing Next. A missed or burned spell
card is a lost opportunity, not an automatic grant or immediate replacement reward.

Each sixth chapter, including Endless, brings the next scheduled opportunity into
its first four arrivals, then uses eight-arrival gaps for that trial. This adjusts the
same schedule instead of adding free inventory. The first two trial choices favor ICE
then WIND only when that type remains in the fair bag and is below capacity. All four
types still occur once per completed four-opportunity bag. This is not a guarantee of
survival or proof that random outcomes cannot affect a player.

| Classic chapter | v3.2 base falling speed | v3.2.1 | Change |
|---|---:|---:|---:|
| 1 | 36.00 | 30.60 | −15% |
| 3 | 45.00 | 40.50 | −10% |
| 6 | 58.00 | 55.10 | −5% |
| 12 | 76.00 | 76.00 | unchanged |
| 24 | 99.00 | 99.00 | unchanged |
| 36 | 116.00 | 118.32 | +2% |
| 48 | 132.00 | 135.96 | +3% |

Values are logical pixels per simulation second. Knots interpolate continuously;
Relaxed and Maniac retain their original multipliers. Arrival intervals, vocabulary
mixture, quotas, trial rest intervals, scoring, miss penalties, and star thresholds
are unchanged. `DIFFICULTY_TABLE.md` has all 48 derived rows. No speed/reward change
reacts to performance, score or danger; there is no hidden dynamic difficulty.

## Related correctness / player-feedback fixes

A blocked spawn used to be able to alter the reward bag before its card appeared.
The candidate now stages its proposed bag and commits it only on successful placement.
Canceling or changing chapters before placement cannot spend a nonexistent reward.
The actual-arrival countdown and bag are copied into chapter-boundary checkpoints.
New-ruleset Retry restores the same opening and never keeps failed-attempt earnings.

Stock pips and help now use the actual two-charge limit. A pickup glow is canceled
when its shelf empties or a new run begins; scarce empty books cannot inherit false
readiness from a previous run. Existing ready/active/queued labels, timers, shortcuts,
text-selection preservation and safety guards remain. No new permanent instruction
bar, footer, store message or edition label was added.

## Measured supply reduction

This deliberately narrow audit uses **100 seeds per version**, immediate correct
input and no casting. It bypasses typing time to isolate resource scheduling; it is
not a player model. Figures are mean opportunities per indicated chapter segment,
not items per minute, guaranteed inventory, or telemetry from real people.

| Chapters | Uploaded v3.2 | v3.2.1 | Reduction |
|---|---:|---:|---:|
| 1 | 4.00 | 1.00 | 75.0% |
| 1–3 | 8.94 | 3.93 | 56.0% |
| 1–6 | 17.97 | 8.92 | 50.4% |
| 7–12 | 19.79 | 11.97 | 39.5% |
| 13–24 | 50.81 | 30.27 | 40.4% |
| 25–36 | 65.42 | 43.20 | 34.0% |
| 37–48 | 80.03 | 52.84 | 34.0% |

The first six chapters offer about **50% fewer opportunities** in that test, and
chapter one's first twelve arrivals offer **75% fewer**. High-skill players who do
not need books can still fill the eight-charge shelf. The implementation does not
silently discard earned resources or force inventory into an arbitrary target range.

## Finite-speed campaign comparison — losses included

The real model runs at 60 Hz. Agents enter letters then Enter, include 0.12–0.32-second
word-acquisition delays, and have 1.2–6% wrong-submission probability depending on
profile. They prioritize the visible card closest to landing and use a declared
reactive spell policy. Matching seeds/profile assumptions are used for both actual
models; changed random-call ordering does not promise identical word sequences.
Campaign retries are disabled so one full-pile loss ends an attempt.

Agents know visible strings perfectly and do not model reading, attention, learning,
fatigue, musical enjoyment, frustration, memory, hardware or willingness to replay.
Their WPM numbers are **not human minimum requirements or recommended difficulty
labels**. Five seeds per row is a calibration sample, not population inference.

| Pace | Agent WPM | v3.2 completed | v3.2.1 completed | Median chapter reached: old → new | Mean held charges: old → new |
|---|---:|---:|---:|---:|---:|
| Relaxed | 25 | 0/5 | 0/5 | 10 → 8 | 7.07 → 3.20 |
| Relaxed | 40 | 0/5 | 0/5 | 25 → 20 | 8.88 → 5.64 |
| Relaxed | 60 | 5/5 | 3/5 | 48 → 48 | 10.10 → 6.22 |
| Relaxed | 90 | 5/5 | 5/5 | 48 → 48 | 11.76 → 7.72 |
| Relaxed | 120 | 5/5 | 5/5 | 48 → 48 | 11.79 → 7.77 |
| Classic | 25 | 0/5 | 0/5 | 7 → 4 | 3.01 → 0.83 |
| Classic | 40 | 0/5 | 0/5 | 15 → 11 | 6.19 → 3.00 |
| Classic | 60 | 0/5 | 0/5 | 28 → 21 | 7.94 → 4.95 |
| Classic | 90 | 5/5 | 1/5 | 48 → 45 | 9.49 → 5.70 |
| Classic | 120 | 5/5 | 5/5 | 48 → 48 | 11.62 → 7.46 |
| Maniac | 25 | 0/5 | 0/5 | 5 → 4 | 2.17 → 0.19 |
| Maniac | 40 | 0/5 | 0/5 | 11 → 8 | 4.79 → 1.96 |
| Maniac | 60 | 0/5 | 0/5 | 19 → 15 | 6.71 → 3.80 |
| Maniac | 90 | 0/5 | 0/5 | 37 → 28 | 7.95 → 5.24 |
| Maniac | 120 | 5/5 | 1/5 | 48 → 46 | 9.90 → 5.69 |

For example, Classic/90 changes from 5/5 completions to 1/5, while its mean held
stock falls from 9.49 to 5.70. This is evidence that the removed safety net matters,
not evidence that the new late game is ideal for every player. Human testing should
particularly check the first failure, chapter 6, and later runs with no WIND.

The 432 isolated checks use Practice's retained one-per-type kit and selected calibration
profiles. Completing those checks is not the same as completing a zero-stock-start
campaign continuously. The additional 90-attempt strategy audit changes only the
WIND activation threshold from 38 to 70; 45 reactive runs repeat primary profiles
intentionally. Relaxed/60 improves from 3/5 to 4/5 in that small sample; Classic/90
remains 1/5. No universally optimal WIND threshold is inferred.

The three Endless soaks deliberately inject resources to reach late states and exercise
lifecycles. They each complete 152 chapters (49–200); they do not prove fair players can
or should reach chapter 201. High-pressure scenarios retain the 26 ordinary losses
rather than redefining them as an engine failure or hiding them.

## Browser / performance boundary

All five final browser reports identify this shipping standalone HTML SHA-256:

`20fc008eb03457a471d8d327637897c629d9644331232a0242934cea854c9c4d`

Chromium **144.0.7559.96**, Linux, headless. The final stress sample holds twelve
cards and high pile pressure while exercising actual typing/Enter effects and all
four music stems for 600 frame intervals at 1440 × 1040:

- Average frame rate: **58.54 FPS**.
- 95th-percentile frame interval: **16.8 ms**.
- Median Canvas draw time: **0.70 ms**.
- Largest sampled interval: **50.0 ms**.
- Unhandled JavaScript errors: **0**.

This is a short controlled benchmark, not a promise of locked 60 FPS or real keyboard
latency on every machine. Its fixtures replenish/hold cards to maintain load. Canvas
draw time is CPU work, not end-to-end input latency. The unchanged audio architecture
still decodes four long stems; actual device memory and listening tests remain open.

This environment denied local browser navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`.
No policy/security setting was bypassed. Browser tests therefore execute the **real
shipping HTML in memory**, enabling only the existing diagnostic-access guard for
controlled state setup. Input, DOM, renderer, audio, simulation and import/export code
are not replaced. Actual Node/Python HTTP response bytes are tested separately; that
does not certify browser HTTP navigation, real-domain storage, or the deployed Vercel
instance. Screenshots are actual-app controlled captures, not a human run or concept art.

## Save continuity and safe update

The new storage key is `typekeeper-enchanted-library-v3.2.1`. Previous keys are read-only
sources. Settings, valid bookmarks, unlocks and mastery migrate. An old legal third
charge is **trimmed to two** during migration; no bonus or hidden reserve is created.
Original older-key bytes are not overwritten, and exporting a save before updating is
recommended. Invalid current schedules are rejected instead of silently trusted.

A v3.2 bookmark did not contain this reward countdown, so migration initializes a
conservative schedule once; it cannot reconstruct unstored data. New checkpoints retain
it for deterministic Continue/Retry. Old scores and continued old-rule totals remain
Legacy. A fresh campaign creates current-version records.

The updater was exercised on disposable Linux folders for spaces in paths, backups,
reruns, Git/Vercel/env preservation, invalid targets, self-target and unsafe symlink
rejection (six scenarios). It does not push or deploy anything. This is not an executed
Mac update, authentication test, or mutation of the user's real repository.

## Package integrity and reproduction

`clean-extraction.json` records an actual fresh preflight ZIP extraction followed by
successful offline `npm ci`, 275 tests, syntax checking and rebuilding. Every one of
**44 outputs** (all of `dist/` including its build manifest, plus `PLAY.html`) matches
the tested working export byte-for-byte. Final reporting/checksum-only changes do not
alter those runtime outputs. `SHA256SUMS.txt` lists shipped paths excluding itself.

The preservation record compares 73 explicit files to the uploaded archive: all art/
audio masters and exports, renderer, audio logic, CSS, page, chapter/vocabulary content,
input utilities, Vercel config and ignore rules. Asset-manifest version 3.2.0 is intentional;
these assets are not newly generated. Game/build/save metadata are 3.2.1. No font binaries,
credentials, node_modules or vendor engine binaries are bundled.

Normal reproduction:

```bash
npm ci --offline --ignore-scripts --no-audit --no-fund
npm test
npm run check
npm run build
npm run test:balance
npm run test:economy
npm run test:endurance
node scripts/resource-strategy-audit.mjs
python3 scripts/test-update.py
```

For paired runs, add `--baseline` and the path to an extracted unmodified v3.2 to the
campaign and economy audit scripts. Browser suites need optional Playwright/Chromium
dependencies as documented in README. Audio generation is not required to run/build.
Raw per-seed outcomes and final browser reports are in `docs/qa/`; earlier evidence is
archived under explicitly versioned subdirectories rather than presented as new results.

## Remaining release gates

Human beginner/intermediate/expert playtesting, actual Windows/Mac/browser persistence,
long-session listening, real refresh-rate/resolution compatibility, and an owner-run
production-domain smoke test remain **NOT RUN here**. There is no certified Steam
executable, online/shared leaderboard, cross-device save backend, or Valve approval.
The core decision now needs observation from people: does the softer opening teach
typing, and does spending a rare spell feel valuable rather than merely punitive?
