# Typekeeper: Enchanted Library — v3.5.1 UI revision & QA

**Breathing Room · 27 September 2026**  
Built from the supplied complete v3.5.0 release. This is an implemented UI/UX
revision with executed automated QA, not a real AAA studio/IGN review, platform
approval, human playtest or blanket guarantee of defect-free play.

## 1. 修正重點 / what changed

**PAPER PILE 與 WIND 已重新分區，而唔係縮細文字掩蓋重疊。**
儀表有自己完整單行標籤；四本魔法書嘅狀態、熱鍵、庫存、名稱及說明分開。
RESCUE 只會取代 WIND 本身嘅狀態，唔會再疊住 READY 或按鍵。

Important follow-on fixes were implemented, rather than stopping at the reported
caption collision:

- Book status rows sit below the last live falling word. The brass key is a
  separate spine tab. The original covers, anchors and cast locations stay intact.
- Hover/keyboard help and first usable ICE guidance occupy the clear central desk,
  not the word lane, meter, other book labels, or input paper. Notifications have
  priority; first-ICE teaching time waits while a higher-priority notice is visible.
- The upper chapter/quota text is more legible. Trial status is outside the chapter
  ribbon and above incoming words. Long scores scale locally rather than colliding.
- Utility controls and important dialog actions are larger. Settings/Records/map
  filters retain keyboard focus on rerender. Native details/summary participates
  in the dialog's Tab/Shift-Tab cycle.
- Dialogs wrap and scroll vertically in short windows. A decorative parchment
  pseudo-element previously added horizontal overflow to every dialog; it now stays
  inside its box. Export/import success or errors are inline, not over action buttons.
- Locked chapter tiles no longer repeat LOCKED twice. Wing header spacing and
  result/finale action layouts were checked without adding screens or new mechanics.

`docs/UI_SPACING_SPEC.md` records the design contracts and internal production
review lenses (UX, interaction, readability, art, implementation and QA). These
are our decisions, not fabricated comments from named studios or reviewers.

## 2. Measured spacing — actual transformed browser rectangles

Baseline is re-rendered from the **unaltered provided v3.5.0 ZIP**. Units are CSS
pixels after stage scaling. The old measurement ends at the WIND brass key; the
new measurement ends at the nearest WIND status row, with the key safely below it.
Negative values mean overlap. Exact rectangles are in
`qa351/baseline-ui-measurements.json` and `qa351/spacing-comparison.json`.

| Browser viewport | v3.5.0 caption → key | v3.5.1 caption → status |
|---|---:|---:|
| 1920×1080 | 16.6px | 89.0px |
| 1366×768 | 9.2px | 61.0px |
| 1280×720 | 7.8px | 56.0px |
| 1024×600 | -13.6px | 43.5px |
| 800×600 | -13.6px | 43.5px |
| 960×540 | -13.4px | 38.0px |
| 640×480 | -11.9px | 33.6px |

At 1366×768, the original high-pressure RESCUE badge also crossed the WIND key.
The new rescue uses the existing status row, so there is no second badge to collide.
The meter is outside the word lane; all four readiness rows start after the lowest
still-live scroll. The typing field, word dimensions, simulation boundaries, desk,
character and book-image positions have not been redesigned.

## 3. Executed gates on the exact current runtime

| Gate | Completed result |
|---|---:|
| Node logic / state / saves / layout contracts / regression tests | **616 passed / 0 failed** |
| Named browser checks, both shipping formats | **352 passed / 0 failed** |
| Unhandled page exceptions in completed browser suites | **0** |
| Last-word / spell / trial boundary matrix | **23,040 passed / 0 failed** |
| Complete deterministic model campaigns | **12/12 reached chapter 48** |
| Complete rendered campaigns through actual input/result handlers | **2/2 reached chapter 48** |
| All-spell chapter-ending fixtures, inside rendered suite coverage | **96 passed** |
| Native launcher / payload / version / cache / collision checks | **7 passed** |
| Backup-first updater / preservation / rejection checks | **6 passed** |
| Immutable v3.5.0 foundation-file hashes, included in Node count | **83 matched** |

Browser checks by suite (not humans and not extra independent player samples):

| Suite | Standalone | Modular |
|---|---:|---:|
| clarity-mastery | 19 | 19 |
| chapter-art | 19 | 19 |
| scroll-repair | 19 | 19 |
| book-leaf | 26 | 26 |
| single-row | 19 | 19 |
| flow-browser | 12 | 12 |
| ui-spacing | 62 | 62 |

The 23,040 matrix is 48 chapters × 3 paces × 8 seeds × 20 boundary scenarios.
The rendered campaign agents use the shipping model, input/result handlers and
normally earned spells, with accelerated stepping and sampled native rendering.
The 96 ending fixtures are **coverage inside** the named flow suites, not 96
additional people, campaigns, or separate browser checks.

## 4. New UI/UX coverage

The new UI suite has **62 named checks per format**, including:

- 12 viewport sizes, each at empty stock / zero pressure and stocked / 95% pressure:
  1920×1080, 1440×900, 1366×768, 1280×720, 1024×768, 1024×600, 800×600,
  960×540, 640×480, 2560×1080, 768×1024 and 360×640. Portrait/tiny checks establish
  safe fitting, **not** phone/touch-game support or good readability at every tiny size.
- Caption/status/key separation; final-word/header clearance; incoming-word/Trial
  clearance; high-contrast layout; actual meter accessibility value; bounded hit areas.
- Rescue threshold, real WIND use, cooldown, empty stock, active ICE and queued SLOW;
  pause/resume without losing partial input.
- Six normally spawned/typed opening words earning first ICE. A real notice hides
  the cue temporarily; once visible it occupies the clear desk, and key2 uses ICE.
- Every book tooltip, keyboard-focus priority over pointer hover, shared context
  bounds and interference with notification/tutorial states.
- Five dialog types across three viewport sizes. Actual text overflow, action
  scrolling, element center hit-testing, close/done/cancel and keyboard traversal.
- Settings tabs/toggles, Records mode/pace/chapter filters, long records, cancel clear;
  actual save export download and valid/invalid import with inline messages.
- All eight map wings/48 mastery entries; expanded rules/details/summary; cancel quit,
  New Game confirmation, pause behavior, chapter results, finale and game-over retry.
- All48 chapter titles and practice prefixes; a very large score; resizing without
  changing the serialized model; DPR2 emulation (not real Retina hardware).

Some tests intentionally create controlled stock, danger, end-of-chapter, maximum
score or unlocked-map fixtures. These establish UI-state coverage; they are not
misrepresented as human-earned sessions.

## 5. Normal-clock keyboard journey and performance sample

A separate real-time automated keyboard run typed **82 words in
111.58 wall-clock seconds**, naturally passed chapter5's **13/14 → 14/14**,
completed chapter6 and entered chapter7. It used ordinary requestAnimationFrame
clocking, audio enabled, actual keyboard events, no forced word spawns, no clock
acceleration and no awarded progress. No page exceptions were recorded.
Evidence: `qa351/live-journey.json` and its command log.

The controlled performance sample kept 12 cards, 95% pressure, four music sources
and real typing feedback for **600 frame intervals** at
1440×1040: **58.63 average FPS**, **16.8 ms p95
frame interval**, **1.0 ms median CPU-side Canvas draw**,
with a **50.0 ms maximum interval**. This is a headless Linux
sample, **not** a worst-case combined-FIRE/ICE guarantee, input-latency measure,
mobile result or native GPU/device benchmark. Full raw intervals are retained in
`qa351/feedback-performance.json`.

## 6. Preservation

`tests/fixtures/v350-ui-preserved.json` pins **83 original files**. All game/data/audio
source modules and original public assets / editable masters in that fixture remain
byte-identical. UI/layout/main wiring, presentation version metadata, build scripts,
current tests and release metadata change. There is no rebalance, new spell,
automatic submission, altered sixth-card ICE opportunity, fixed Retry sequence,
new account or external runtime dependency.

The same save key and ruleset (`typekeeper-3.2.1`) remain. A new browser, file URL,
HTTP origin or port has a separate browser storage namespace, regardless of game
version. Export a save before switching; import it through Records when needed.

## 7. Failed attempts, fixes and limits

Initial iterations are kept in `qa351/` and `qa351/iterations/`, not counted as final
passes. The standalone module pack initially lacked the new layout module in its
explicit order; that was corrected. A real 134px book aura violated the inherited
cover-boundary check; the aura was fixed to124px rather than weakening the check.
The dialog horizontal-overflow defect was fixed in CSS. Some initial test locators
were ambiguous, and an ACTIVE-status oracle expected the wrong label; the harness
was corrected to target the real control/state. First-ICE tests now wait for actual
higher-priority notices to clear instead of pretending hidden instruction time is
visible. Final tests use the frozen shipping bytes below.

An early attempt to run **four Chromium harnesses concurrently** exhausted the
shared **4GiB container memory limit**. Those interrupted/crashed attempts are
excluded. The final browser run was serialized; all16 final commands completed
with exit0. Raw resource evidence and interrupted logs are retained. This neither
hides the attempts nor claims the single game itself was a four-browser load.

Browser navigation to actual loopback HTTP was attempted and returned
**ERR_BLOCKED_BY_ADMINISTRATOR**. The suites therefore execute shipping PLAY.html
in memory and the modular dist via Blob-module transport. Only transport, asset
locations and the existing local diagnostic guard are adapted; the actual game,
renderer, DOM, input and audio functions are not replaced. Native Node/Python HTTP
payloads, manifest hashes, MIME/cache/HEAD/404 behavior and launchers were checked
separately. Actual live Vercel deployment was **not** exercised.

The origin-less test document cannot certify native localStorage persistence.
The game correctly reports unavailable persistence; real export/import and the
serialization/migration/storage adapter logic are tested. Reload/persistence on a
real browser origin remains a device/deployment check.

Environment: **Node22.16.0; Chromium144.0.7559.96; Python Playwright; Linux**.
The Mac launcher was executed under Linux Bash, not double-clicked in Finder.
No real Mac/Windows/Safari/Firefox/Edge devices, human first-time-player study,
long-duration subjective listening, live hosting, platform approval or independent
AAA certification is claimed. `docs/HUMAN_DEVICE_QA.md` remains an unexecuted plan.

## 8. Exact build and reproducibility

- Application: **3.5.1 — Breathing Room**
- Build ID: **3.5.1-cede4396e07379e3**
- Tag: **breathing-room-ui-351**
- Ruleset: **typekeeper-3.2.1**
- PLAY.html SHA-256: `5d2eaee3614277d65e83e35724948bae767c004c31ad9c568c984f14c877acda`
- Runtime: **57 outputs** (56 files under dist plus PLAY.html)
- Current evidence: `qa351/release-summary.json`, `runtime-freeze.json`, suite JSONs,
  logs, numeric rectangles and `docs/screenshots/v3.5.1/` previews.

<!-- FRESH_GATE_START -->
### Fresh ZIP extraction gate — PASS

The actual candidate full ZIP was CRC-checked, validated against its complete
per-file SHA-256 manifest, and extracted into a new empty directory. Offline clean
install, **616 Node tests**, syntax validation and production build all passed.
**All57 runtime outputs were byte-identical** before and after the rebuild.

Both new UI suites ran again from that extraction: **62 standalone + 62 modular
checks passed**, with zero unhandled page exceptions. These **124 repeats** are
not added to the352 named browser checks above. The **7 launcher** and **6 updater**
cases passed again. Runtime hashes were compared once more after all fresh tests.

The final handoff adds only current documentation/evidence/checksums to those
verified runtime bytes. After final packaging the complete archive's CRC,
per-file manifest and all57 frozen runtime hashes are verified again. No runtime
code changes follow the fresh-extraction gate.

Evidence: `qa351/fresh-extraction.json`, `fresh-ui-standalone.json`,
`fresh-ui-modules.json`, fresh command logs and release/updater reports.
The fresh gate records the candidate archive SHA for provenance; the final ZIP
hash changes only because the completed evidence and report are then included.
<!-- FRESH_GATE_END -->

The full app handoff contains source, original assets and editable masters, audio,
prebuilt dist, offline PLAY.html, launchers, backup-first updater, current tests and
raw numeric QA/logs. Current curated screenshots are documentation-only WebP
previews; original application imagery is not recompressed. The full23,040-row
matrix is losslessly gzipped beside its summary. Duplicate historical screenshots
and interpreter caches are omitted, not passed off as new evidence.
