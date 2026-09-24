# Typekeeper: Enchanted Library — v3.1 mechanics and QA report

**23 September 2026 · ruleset `typekeeper-3.1.0` · full browser build and editable source**

## Decision and scope

The mechanics iteration is implemented and passes the automated gates below. Artwork,
character-expression assets, music, layout CSS, chapter names, and branding are preserved.
This is a complete playable web release candidate, not a certified Steam executable, human
playtest result, AAA certification, or prediction of commercial/viral success.

The uploaded v3.0 ZIP was the implementation baseline. Changes target rule fairness,
difficulty continuity, useful spell feedback, safe retry/resume, and comparable local scores.
They are deliberate new rules, not measurements of either historical YouTube recording.
No new art, soundtrack, accounts, monetization, or unrelated features were added.

## Executed validation

| Gate | Observed result |
|---|---|
| Logic, storage, input policies, rules and property tests | **174 passed / 0 failed** |
| Main browser interaction suite | **45 passed / 0 failed** |
| Audio/editorial/resume regression suite | **24 passed / 0 failed** |
| New mechanics browser suite | **27 passed / 0 failed** |
| Unhandled application JavaScript errors in browser suites | **0** |
| Isolated chapter calibration | **432 / 432 completed**: 48 chapters × 3 paces × 3 seeds, with declared calibration agents |
| Campaign calibration | **60 v3.1 attempts**, including slower agents that correctly lose; all outcomes retained |
| Baseline comparison | **60 attempts** on the unmodified uploaded v3.0 engine using the same agent assumptions |
| High-pressure / no-starter-book scenarios | **42 terminated correctly**: 38 completions, 4 ordinary losses, no timeout |
| Resource-assisted Endless reliability | **3 / 3 passed**; each completed chapters 49–200 and entered 201 |
| Preserved content verification | **52 files byte-identical** in the declared art/audio/style/content scope |
| HTTP integrity | Each Node/Python server returned all **37** manifest-listed payloads with matching hashes; MIME, HEAD and 404 passed |
| Preserved audio integrity | Two runtime stems and full mix decoded; stereo/equal-duration checks passed, no clipped samples |
| Clean ZIP extraction and rebuild | PASS: 39 / 39 generated outputs byte-identical; offline install, 174 tests, syntax and build passed |

The 270 logic/browser cases are automated test cases, not 270 independent players. The
logic suite includes 250 seeded adversarial sessions within one property test, numerical
bounds, repeated-input/terminal-state guards, and bounded replay storage. Counts are not
inflated by treating every assertion or simulated frame as a separate test case.

## Defects fixed and behavior deliberately changed

| Area | v3.0 problem or risk | v3.1 outcome |
|---|---|---|
| Difficulty | Abrupt vocabulary-bank jumps compounded increasing arrival pressure | Continuous vocabulary mixture and length ceiling; stable per-chapter speed and separate pace calibration |
| Spawn fairness | Candidate positioning/retries could create avoidable conflicts or redraw rewards | Free-span placement with separation; pending candidate retained; no active exact duplicate words |
| Empty field | Clearing fast could leave an unnecessary ordinary wait | Ordinary next-arrival wait capped at 0.65 seconds after clearing; trial breathing interval preserved |
| End of chapter | Cards could spawn beyond what the remaining quota needed | Stop extra arrivals while enough live cards can finish the quota; clear terminal transition once |
| Item distribution | Pure rolls could make powers uneven across short samples | Shuffled four-spell cycles, short scheduled gaps, preference for remaining non-full types |
| Spell combination | SLOW time expired while ICE made it ineffective | SLOW queues visibly during ICE and retains its full remaining duration |
| Timer expiry | A whole frame could use the wrong modifier when an effect ended mid-tick | Integrate frozen, slowed and normal fractions inside the same tick |
| Readiness | A stocked but unusable book could advertise an action | FIRE/WIND display STORED when they cannot affect anything; READY means actionable |
| Rapid effects | Multiple spell/streak labels could overlap | Latest spell owns the central banner; queued SLOW is labeled; inactive SLOW orbit suppressed |
| Near-miss input | A just-landed or just-burned word could immediately receive another typo penalty | 0.35-second acknowledgement guard; original miss still counts, no score/progress refund |
| Retry | Bookmarks did not reproduce the same opening; failure could remove the only safe resume point | Deterministic chapter opening with seed/bag/score/books/pile, available from chapter 1; retry cannot farm failed-attempt points |
| Practice | Stars and campaign advancement were conflated in some paths | Practice can award mastery on an unlocked chapter without unlocking the next campaign chapter |
| Score comparison | Different practice chapters and rulesets could share a board | Chapter-specific practice records; old-rule totals stay in Legacy |
| Endless exit | Voluntary exit could lose a legitimate partial result | Retired Endless result saved once, explicitly not a victory |
| Focus and menus | Tab/selection or competing modal actions could lose an input or reset progress | Restore typing and replacement selection, guard existing bookmarks, keep covered controls inactive |
| Save recovery | Invalid stored data or version mixing could silently lose provenance | Preserve corrupt bytes in bounded recovery storage; read old keys without overwriting them; legacy totals cannot claim a new-ruleset best |

The artwork and layout have not been redesigned to solve these issues. Rule-dependent words
such as QUEUED, STORED, Retry chapter and the trial breathing indicator appear in existing UI.
The scoring formula, chapter quotas, miss/typo penalties, star thresholds, four powers, 48
chapter names, eight wings and three pace choices remain; pace/spawn changes still make old
scores non-comparable, which is why this release versions records.

## Difficulty calibration: what the evidence does and does not mean

The audit executes the real game model at 60 Hz. Agents type one letter at a time, then
press Enter; they include a reading/target-acquisition delay and a probability of a wrong
submission. They select the visible card nearest to landing and may use reactive spells.
They have perfect knowledge of visible strings, no future-spawn knowledge, and do not model
human comprehension, attention, fatigue, learning, frustration, enjoyment or retention.
A simulated WPM setting is **not** a recommended or required real-player typing speed.

Campaign profiles use 25/40/60/90 WPM, 0.32/0.26/0.20/0.15-second acquisition delay,
and 6%/4.5%/3%/2% wrong-submission probability per word, respectively. Five seeds per
profile/pace yield 60 attempts; campaign retries are disabled in this audit. Isolated
chapter tests use the 40-WPM Relaxed, 60-WPM Classic and 90-WPM Maniac profiles, three
seeds each, and the same one-book-per-type starter kit provided by actual Practice.

| Reference synthetic agent | Uploaded v3.0 campaigns completed | v3.1 campaigns completed |
|---|---|---|
| Relaxed / 40 WPM / 4.5% wrong words | 0 / 5 | 5 / 5 |
| Classic / 60 WPM / 3% wrong words | 0 / 5 | 5 / 5 |
| Maniac / 90 WPM / 2% wrong words | 4 / 5 | 5 / 5 |

The full matrix is retained, including losses. For example, the Classic 40-WPM profile
still ends between chapters 28–34 and the Maniac 60-WPM profile between 43–47. The change
removes measured cliffs; it does not make every difficulty completable by every agent.
An intermediate Relaxed tuning failed an isolated late-stage case, so its arrival interval
factor was eased from 1.50 to 1.60 and the complete sweep rerun. All final results use 1.60.

The final 60 campaign plus 432 isolated attempts represent approximately **35.44 hours
of simulated game time**, accelerated in code—not that amount of human or wall-clock QA.
The three Endless soaks inject extra spell inventory to reach late states. They are
reliability exercises, not proof that players can or should reach chapter 201.

See `DIFFICULTY_TABLE.md` for all 48 derived speed/arrival/quota/word-length rows and
`qa/playtest-simulation.json`, `qa/baseline-simulation.json`, and `qa/endurance-audit.json`
for every seed, outcome, assumption and scenario. `RULES.md` is the actual new ruleset.

## Browser and performance evidence

Tested browser: Chromium **144.0.7559.96** on Linux, headless, viewport
1440 × 1040. The gameplay sample contains 12 cards and active spell states. After two
seconds of warmup, 180 animation-frame callbacks were sampled, excluding the initial
offset from frame-interval statistics.

- Average frame rate: **59.34 FPS**.
- 95th-percentile frame interval: **16.8 ms**.
- Median Canvas draw time: **0.5 ms**.

One frame in this short sample was 50 ms; the average is not a guarantee of perfectly
uniform frames. Draw time is CPU-side Canvas work, not end-to-end keyboard latency.
No actual Mac, Windows device, Steam Deck, Safari, Firefox or Edge performance is certified.

The managed environment blocks browser navigation to localhost/file URLs. Browser tests
therefore run the **shipping standalone HTML in memory**. Only the existing diagnostic
access guard is enabled in the fixture for controlled states. Actual model, render, DOM,
keyboard, focus and audio code executes; no gameplay functions are replaced. A separate
production-guard check verifies that the shipped export does not expose the test seam.
Node/Python server payload checks are separate and do not prove browser HTTP execution.

Migration/import/export and hostile storage inputs are exercised. Real same-origin browser
persistence across closing/reopening an installed page still requires target-device tests.
The screenshots are controlled actual-app captures, not a human run or generated concept.
Original audio passed the regression suite without being recomposed or remastered here.

All three browser reports identify the tested shipping PLAY.html hash:
`0942687689893ed4d7500ca09ae32ccb737b6ef6cc4ad634e723c0098ad702ce`

## Preservation, packaging and reproduction

The checksum preservation scope comprises all 24 `asset-source/` files, all 22
`public/assets/` files, and six retained layout/audio/icon/campaign/pressure source files.
`qa/preservation-audit.json` lists each path and SHA-256. The asset-manifest version remains
3.0.0 intentionally: these are exactly the existing assets, not newly produced artwork.
Game/build/save metadata is 3.1.0. Six runtime modules contain the mechanics changes.

The package includes the full editable source, original art and music masters, tests,
standalone PLAY.html, prebuilt dist/, local launchers, raw audit evidence and documentation.
No runtime package download, account or API key is required. Fonts are not bundled.

Reproduce core gates with:

```bash
npm ci --offline --ignore-scripts --no-audit --no-fund
npm test
npm run check
npm run build
npm run test:balance
npm run test:endurance
```

Browser tests additionally need the declared Python/Playwright dependencies and a browser.
See README.md for normal HTTP mode and the explicitly documented inline fixture used here.
Old v3 reports are archived under `qa/v3-baseline/`; they are not the new release's results.
Current test logs, tool versions, HTTP/audio audits and rebuild comparison live under `qa/`.
Final file hashes are in `SHA256SUMS.txt` (that checksum file excludes itself).

## Save continuity and remaining release gates

v3.1 uses a new storage key and reads earlier keys without modifying them. Settings,
mastery and valid campaign bookmarks migrate. An older bookmarked campaign can continue,
but a carried old-rule score stays Legacy; start a fresh expedition for current records.
Practice boards compare the same chapter. Retry restores the opening score rather than
accumulating failed attempts. Export a save before changing folders/origins.

Automated engineering gates pass. **Human first-time/intermediate/expert playtesting,
long-session listening, actual target-device compatibility/save persistence, and Steam
packaging/integration/review remain open.** No human participants took part in this audit.
Those limits are explicit in `RELEASE_CHECKLIST.md` and `STEAM_READINESS.md`.

Current official Steam sources and developer examples are separated from design inference
in STEAM_READINESS.md. No sales, conversion, retention or viral-success result was measured.
This build is not represented as having Steam achievements, Cloud, authenticated shared
leaderboards, a tested native installer, Valve approval, or an executed Unreal/Blender port.
