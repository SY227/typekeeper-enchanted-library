# Typekeeper: Enchanted Library — v3.5.2 Score Chase
## Upgrade & executed QA report · 27 September 2026

Built directly from the supplied **v3.5.1 — Breathing Room** full ZIP. This is a
complete game upgrade, not a patch, actual studio/IGN endorsement, independent
AAA certification or guarantee of no defects. All results below are current-build
executions; historical evidence is not added to the counts.

## 1. 實作摘要 / what changed

左上角沿用現有 SCORE 區域，大字仍然係累積總分，下面顯示鎖定嘅 BEST。
冇可比較紀錄時顯示 FIRST RUN；真正超越先顯示 NEW BEST +差額。平手唔會
慶祝，首次建立分數亦唔會誤叫破紀錄。接近目標只有輕微強調；突破先有一次
短促光紋與音型。冇增加另一個 HUD 框、登入、排行榜或玩法系統。

**The important metric correction:** campaign SCORE is cumulative across chapters.
It must not be compared with a later chapter's score subtotal. Campaign bests are
scoped to cumulative totals at the same reached chapter and starting chapter;
Practice compares the same practice chapter; Endless compares its continuous run.
All also require the same pace and scoring rules. Each campaign entry / practice
attempt locks its target; Endless does not retarget at a new wave. Original score,
word sequences, quotas, stars and resources remain unchanged.

The existing save key/version remains. New validated records are additive and
bounded. Proven historical run records and contiguous same-run checkpoint history
can recover a reference; separate chapter maxima are never added. FIRST RUN may
therefore appear on an old chapter without a provable comparable cumulative score.
Clearing scores also clears PB targets while keeping stars and unlock progression.
Game-over text now uses the same frozen target as play, rather than an unrelated
all-run best; no record means FIRST SCORE RECORDED, not a false new-record claim.

## 2. Presentation and UX contracts

Main number: exact locale-formatted total, never a count-up approximation. Best:
secondary line, visible in both focused and detailed HUD. The original best stays
frozen, including while the store is updated at clear/game-over. After exceeding,
the delta remains relative to that original value; the original target stays in
the accessible scope description/title. Ties receive no record event.

The compact etched panel reuses the left-side text anchor and ends above incoming
words. Measured current transformed browser geometry:

| Viewport | Score panel → chapter gap | PAPER PILE caption → WIND status | Normal BEST effective font |
|---|---:|---:|---:|
| 1920×1080 | 26.0px | 89.0px | 15.4px |
| 1366×768 | 18.4px | 61.0px | 12.0px |
| 1024×600 | 14.3px | 43.5px | 12.0px |
| 800×600 | 14.3px | 43.5px | 12.0px |
| 640×480 | 11.3px | 33.6px | 9.8px |

These are measured CSS pixels, not an accessibility certification. Extreme values
fit locally without increasing panel width. Tiny portrait layouts establish safe
fitting only, not comfortable phone/touch play. The original meter/book geometry,
first-ICE desk hint, word cards, trial zone, chapter panel and menus are retained.

A live crossing produces one 650ms etched-light sweep and a short two-note cue.
Ordinary points produce a 130ms sub-pixel lift. Reduced Motion removes movement;
High Contrast retains explicit text. No per-point live announcement or focus
change occurs. Mute, SFX-off, background and navigation cancellation are honored.
Completion/bonus crossings update the score state silently so the existing
chapter/wing/finale presentation takes priority over an extra fanfare.

## 3. Executed release gates

| Gate | Current result |
|---|---:|
| Node logic / saves / presentation / regression | **655 passed / 0 failed** |
| Named browser checks across both formats | **428 passed / 0 failed** |
| Unhandled errors in completed browser suites | **0** |
| Final-word / spell / trial model boundary cases | **23,040 passed / 0 failed** |
| Complete model campaigns | **12/12 reached chapter 48** |
| Complete rendered campaign journeys | **2/2 reached chapter 48** |
| Launcher / release / corruption rejection | **7 passed** |
| Backup-first updater / preservation / rejection | **6 passed** |
| Unchanged baseline foundation sources/assets | **83 matched** |

Named browser breakdown (one named check may cover multiple fixtures):

| Suite | Standalone | Modules |
|---|---:|---:|
| score-chase | 38 | 38 |
| clarity-mastery | 19 | 19 |
| chapter-art | 19 | 19 |
| scroll-repair | 19 | 19 |
| book-leaf | 26 | 26 |
| single-row | 19 | 19 |
| ui-spacing | 62 | 62 |
| flow-browser | 12 | 12 |

The boundary matrix is 48 chapters × 3 paces × 8 seeds × 20 scenarios. The
rendered journeys use the real model, keyboard/result handlers, earned spells and
sampled native rendering with accelerated stepping. The 96 spell/ending fixtures
are coverage inside those named flow suites, not 96 extra human play sessions.

## 4. New Score Chase checks

**38 per format**, exercising shipping DOM/input/audio/model. Controlled fixtures
are used for provable records and extreme states; they are not called player runs.

- Correct first/zero/ordinary/90-percent/tie/exceeded states; frozen target despite
  writes/imports; one event only; exact +30 crossing and later-growing delta.
- Campaign cumulative-versus-subtotal protection; separate start/chapter/mode/pace/
  ruleset scopes; Practice Retry, Campaign Retry and Continue; Endless waves/retire.
- Real Enter handler, maintained text focus, no per-point announcement flood,
  bonus/clear persistence, real first-score result copy and matching defeat scope.
- Reduced-motion toggles during a pulse; high contrast; mute and no delayed replay;
  pause/resume and next-run settings that must not alter the active target.
- Save export/import/reload serialization, monotonic higher-record merge, older
  proven data, malformed and mismatched keys, bounded history, storage denial,
  global top-100 pruning, deletion without losing stars or resurrecting targets.
- Twelve viewport sizes × four score states, including extreme long integers;
  actual text ranges, adjacent ribbon/word bounds and retained pile/WIND clearance.
  Viewports: 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768, 1024×600,
  800×600, 960×540, 640×480, 2560×1080, 768×1024, 360×640.

The inherited UI suite also rechecks all book states, tooltip priority, first-ICE
context, modal scrolling/focus, save controls, all chapter names, long scores,
small-window endings and instrument/book separation on these exact bytes.

## 5. Normal-clock journey and performance sample

The automated real-keyboard journey typed **82 words in 111.52
wall-clock seconds**, naturally passing chapter 5's **13/14 → 14/14**, completing
the chapter-6 trial and reaching chapter 7. It used normal requestAnimationFrame
timing, actual key events and audio, no forced words, no accelerated model clock
and no awarded progress. **Zero page exceptions.** It is not a human playtest.
Evidence: `qa352/live-journey.json` and command log.

A controlled 12-card / 95%-pressure scene with four music layers and real typing
feedback sampled **600 frame intervals**: **56.25 FPS average**,
**33.3ms p95**, **1.2ms median CPU-side Canvas draw**,
maximum frame interval **33.5ms**. This is a Linux/headless sample, not
worst-case combined elemental VFX, input latency or actual GPU/device performance.
Raw intervals/source counts remain in `qa352/feedback-performance.json`.

A separate serial comparison used the unchanged v3.5.1 baseline and this candidate under the same harness: baseline 59.21 FPS / 16.8ms p95; candidate repeat 58.83 FPS / 16.8ms p95. These single samples do not establish a real-device regression or performance guarantee. The original 56.25 FPS candidate result above is retained, not replaced by a better repeat. See performance-comparison.json for all sample identities.

## 6. Actual transport, save origin and external limits

The main browser suites execute shipping PLAY.html through in-memory transport and
shipping modular dist through Blob modules. Only transport/asset URLs and the
existing explicitly local diagnostic guard are adapted. Simulation, UI handlers,
DOM, rendering and audio are not replaced. Native Node and Python HTTP payloads
were separately fetched and verified against the distribution manifest, including
all **56 manifest-listed files**, MIME/cache headers, HEAD and missing-file 404s.

Additional unchanged-runtime browser navigation attempts:

- **http-modules — UNVERIFIED**: Page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR at http://127.0.0.1:4592/
- **file-standalone — UNVERIFIED**: Page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR at file:///mnt/data/score_chase/Typekeeper_Enchanted_Library_v3_5_2/PLAY.html

A failed or blocked native navigation is not a passing native-browser test.
Successful controlled-save reload, when recorded above, establishes only that
exact browser/origin path, not every platform or human-earned record persistence.
In-memory/Blob suites alone cannot certify localStorage on a deployed origin.

Environment: Node v22.16.0, Python 3.13.5, Chromium 144.0.7559.96, Linux. The Mac
launcher was run under Linux Bash, not double-clicked in Finder. Real Mac, Windows,
Safari, Firefox, Edge, Retina/GPU hardware, prolonged subjective audio listening,
first-time-user study, live Vercel and Steam/Valve approval remain unverified.
The original `docs/HUMAN_DEVICE_QA.md` is still a plan, not completed research.

## 7. Scope preservation, failed iterations and packaging

New pure scope/tracker module; additive save validation; existing HUD/main wiring;
release identity/build order; focused tests and documentation. Game model, rules,
economy, controls, timers, campaign, vocabulary, UI layout geometry, renderer art
and original audio source/assets are unchanged. The original presentation module
changes only its version literal. `tests/fixtures/v351-score-chase-preserved.json`
pins 83 untouched files; a separate assertion checks that sole literal change.
No new runtime dependency, font binary, external service or telemetry was added.

Initial failures are retained, not counted as final passes: stale expected release
literals/build tags; a test calling a nonexistent helper rather than the real
clear-level path; a missing fixture hash; and accumulated audio diagnostic history
between tests. The fixtures were corrected to exercise the real paths and isolate
the diagnostic observation history, without replacing audio/gameplay functions.
Early browser passes were superseded after tightening the panel-to-chapter gap and
making game-over copy use the same target. Interrupted/superseded runs and original
logs are kept as such. Every final named suite above matches the shipping SHA.
Browser suites are serialized rather than creating multiple simultaneous load
instances and misrepresenting that as normal gameplay.

The full package retains source, original art/audio masters, public assets, both
playable builds, launchers, update helper, tests, logs and numeric evidence. QA-only
PNG screenshots may be compressed to WebP previews in the handoff; an explicit
screenshot index retains their original paths/hashes. Game assets are not changed
by this preview compression. Historical QA remains labeled separately.

## 8. Exact current runtime

- Version: **3.5.2 — Score Chase**
- Build: **3.5.2-da6909e7c1861337**
- Tag: **score-chase-352**
- Ruleset: **typekeeper-3.2.1**
- PLAY.html SHA-256: `ed3fd19385c13d069c35b644d542028dd6046b7d28bbb8aef8831863e6f7b044`
- Runtime outputs: **58** (57 files under dist including its manifest, plus PLAY.html)
- Supplied v3.5.1 ZIP SHA-256: `411db5e5cd59fd62890915611f10e3504bf08717048b1f7a8806bf33e24b7462`
- `qa352/runtime-freeze.json` pins all runtime bytes.

<!-- FRESH_GATE_START -->
### Fresh full-ZIP extraction gate — PASS

The actual full candidate ZIP was CRC-checked, validated against its complete
per-file SHA-256 manifest and extracted to a new empty directory. Clean offline
`npm ci`, all **655 Node tests**, syntax validation and production rebuild passed.
**All 58 runtime outputs are byte-identical** to the frozen release before and
after the rebuild.

From that extraction, the new Score Chase suite passed **38 standalone + 38
modular checks**; the UI-spacing suite passed **62 standalone + 62 modular checks**.
These **200 repeats** are not added to the 428 named browser checks above. The
**7 launcher** and **6 updater** checks also passed again. Runtime hashes were
compared once more after all fresh tests. Native Unix launcher mode bits are set
in the ZIP; running them on a real Mac/Windows desktop still needs device testing.

After this gate only current documentation, evidence and checksums were added;
no runtime code changed. The final ZIP is verified again for CRC, its complete
file manifest and all 58 frozen runtime hashes. The final artifact checksum is
also supplied in the external archive-verification JSON.

Evidence: `qa352/fresh-extraction.json`, fresh command logs and four fresh browser
reports. The candidate ZIP hash is recorded there; the final ZIP additionally
contains this completed report and the fresh evidence.
<!-- FRESH_GATE_END -->
