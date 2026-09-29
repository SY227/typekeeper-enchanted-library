# Typekeeper: Enchanted Library — v3.5.0 release / QA report

**27 September 2026 · Clarity, Mastery & Homecoming**  
Built directly from the supplied v3.4.0 full ZIP. Application3.5.0 retains balance
ruleset `typekeeper-3.2.1` and the existing save key. No independent studio, IGN,
platform certification or human-study endorsement is claimed.

## What shipped

Shared-rule star explanations; submission accuracy plus missed/wrong counts;
contextual first Enter and earned ICE guidance; actual multiplier-driven visual
and audio cues; legible control labels; true scoped chapter-PB/mastery highlights;
eight wing landmarks and restoration moments; a campaign-only, skippable chapter48
homecoming with static reduced-motion equivalent; object-origin FIRE; short
cancel-safe wing/finale motifs. Existing gameplay, scarcity and four music stems
are retained. Full source, editable masters, runtime assets, dist, embedded PLAY,
launchers, updater, tests and evidence are included.

Implementation details and acceptance mapping: `docs/IMPLEMENTATION.md`.

## Executed gates — this release, not inherited pass counts

| Gate | Result |
|---|---:|
| Node logic / state / storage / presentation / differential regression | **515 passed / 0 failed** |
| New clarity / mastery / contextual guidance / ending browser suite | **19 per format · 38 total** |
| Chapter / elemental art browser suite | **19 per format · 38 total** |
| Imperial scroll / lettering raster browser suite | **19 per format · 38 total** |
| Material / caption / input / contrast browser suite | **26 per format · 52 total** |
| Single-row / dictionary / randomness browser suite | **19 per format · 38 total** |
| Integrated full-game browser flow suite | **12 per format · 24 total** |
| **Distinct named browser checks** | **228 passed / 0 failed** |
| Unhandled page exceptions in completed suites | **0** |
| Last-word model boundary cases (48 × 3 paces × 8 seeds × 20 scenarios) | **23,040 passed / 0 failed** |
| Complete model-level synthetic campaigns | **12/12 reached all 48 chapters** |
| Complete rendered synthetic campaigns | **2/2 reached all 48 chapters** |
| Animated ending / combined-spell fixtures inside flow tests | **96 chapter endings** |
| Non-destructive launcher / integrity / occupied-port cases | **7 passed** |
| Backup-first updater cases on disposable folders | **6 passed** |
| Actual Node and Python HTTP payload checks | **54 files each: exact hashes, MIME, no-store, HEAD, 404** |
| Original source / runtime asset / editable-master hashes preserved | **72 byte-identical files** |

Both formats means shipping embedded PLAY.html and shipping ES modules. Per-pixel,
per-word, per-tick and chapter-ending subcases are coverage inside tests, not extra
people or extra named browser checks. Reports all identify the shipping SHA.
`qa350/release-summary.json` enumerates the suites; raw named results/logs are nearby.

### The review's concrete defects

The actual result at three missed words / zero wrong submissions shows **one star,
100% submission accuracy, Missed words3, Wrong submissions0**, followed by
“For two stars, miss1 fewer word.” A separate test combines both deficits and
verifies both are explained. All count pairs0..30 use the same medal authority.

The score, stamp and audio agree at8/16/64. There is no upgrade at5/15/63/72;
actual maximum multiplier is×3 at64. Wrong input resets the presentation and
Continue restores the multiplier without replaying the earned event.

Native keyboard input demonstrates an exact-word Enter cue without auto-submit;
the actual sixth generated card is the first ICE opportunity. The usable charge
teaches key2 without focus theft, free inventory or paused-time expiration.

A real +120 scoped PB is reported using the old value. Returning from the chapter
map does not re-award it. Practice cannot overwrite/claim a campaign PB; tied
attempts do not celebrate. Old independent aggregate maxima are not treated as
one coherent run or invented replay provenance.

All seven intermediate wing transitions reach the correct next chapter. The
chapter48 finale runs its natural4.2 seconds, lights all eight seals and presents
choices. Enter/Escape/click, held-key guard, cancellation, hidden-time suspension,
SFX-off, mute and static reduced-motion paths are covered. Practice48 and Endless
never claim the campaign ending.

### Authoritative baseline preservation

The original v3.4.0 model dependency graph is retained byte-for-byte in the
**test-only** `tests/fixtures/baseline340/` with independent original hashes.
Old and new models run identical genuine spawns, submissions, errors, pauses and
normally earned spells across all48 chapters and all three paces. Snapshots,
score, resources, timing, chapter history, checkpoint and replay agree. Tests
ignore only the new presentation notification and correct-event annotation.
All authored rules, power metadata and pace configurations are also compared
numerically. Changed UI/audio/storage/render code is not falsely labelled
byte-identical. The72-file hash gate covers only actually untouched files.

### Normal-speed input journey

An additional run used the ordinary requestAnimationFrame clock and actual keyboard
events, with music/SFX on, no forced spawns, no accelerated ticks and no awarded
progress. It typed **82 words in 114.14 wall-clock seconds**, passed
**chapter5:13/14 → 14/14**, completed the first wing/trial and entered chapter7.
No page exceptions occurred. This is automated input, not a human play session.
Evidence: `qa350/live-journey.json`, `live-normal-journey.log` and `live-*` captures.

### Performance samples — measured, not a hardware promise

Controlled scene:12 cards,95% paper pressure,4 music sources, actual typing feedback,
600 frame intervals,1440×1040, Linux/headless Chromium144. Positions were held and
cards replenished by the documented fixture; shipping draw/audio/input functions
were not replaced.

| Condition | Average FPS | p95 frame interval | Median Canvas CPU draw |
|---|---:|---:|---:|
| Alongside other QA work | 55.9 | 33.3ms | 1.0ms |
| Separate isolated repeat | 58.83 | 16.8ms | 1.0ms |

Both samples are retained (`performance-concurrent.json`, `performance-isolated.json`).
The repeat does not erase the slower observation. These are not worst-case FIRE/ICE
benchmarks, input-to-photon latency measurements, actual Retina device tests or a
steady60FPS guarantee. There were no unhandled page exceptions in either sample.
Actual WebAudio scheduling/cancellation was exercised; nobody is claimed to have
completed a20–30 minute subjective headphone review.

## Failures and interrupted attempts retained

Initial baseline tests passed436/436 before editing. The first upgrade run caught
old version literals and whole-source preservation contracts; those were replaced
with explicit intentional-change scope and a new immutable baseline differential
gate, not a fabricated claim that changed code was unchanged.

Browser inspection found a real narrow-laptop caption overflow; its available
width and compact duplicate-key handling were fixed. High-contrast colour was
restored to the accepted ink value. Old SLOW text expectations were updated to the
new visible caption. An early new-test pair incorrectly assumed a checkpoint
return value and cue-log field name; only those test assumptions were corrected.

Large dictionary raster batches could exceed the environment window/native Canvas
work queue. The harness now yields and flushes smaller batches without reducing
the full746-word ×6-skin ×4-viewport matrix. A combined command was terminated by
the tool time limit and Playwright reported EPIPE; that interrupted run is not a
pass. Completed separate repeats passed. Initial logs/reports remain under
`qa350/development-attempts/` and `qa350/initial-regression/`.

No production error is excused merely because a test timed out. Only completed,
current-SHA suites are counted above.

## Transport, storage and human/device limits

Environment: Node22.16.0, Python3.13.5, Chromium144.0.7559.96, Linux. Browser navigation
to loopback HTTP, routed HTTPS and local-file URLs returned **ERR_BLOCKED_BY_ADMINISTRATOR**.
Suites therefore use actual embedded HTML in an in-memory page and actual modular
code through Blob imports. Adaptations are asset/import locations and the existing
local diagnostic guard; engine, renderer, DOM, audio and handlers are shipping code.
The production export is separately checked not to expose the diagnostic seam.

The in-memory origin cannot use real localStorage. Its visible export-save warning
is not hidden in evidence. Storage sanitization, backward compatibility and
round-trip logic are tested with the actual LocalStore plus storage adapters;
real-origin browser save continuity still needs a device/deployed-origin check.
Node/Python HTTP byte delivery and launchers are tested separately, not portrayed
as browser navigation. The Mac Bash launcher ran on Linux, not in Finder.

**Not executed:** external new-player recruitment, human48-chapter playthrough,
retention study, native Mac/Windows/Safari/Firefox/Edge matrix, actual hardware input
latency, live Vercel validation and extended subjective audio listening.
`docs/HUMAN_DEVICE_QA.md` supplies the remaining protocol without checked-off fiction.

## Fresh-package gate

The candidate full ZIP was CRC-checked and extracted into a new empty folder. Offline installation, all **515 Node tests**, syntax checking and production rebuild passed. All **56 runtime outputs**, including dist and PLAY.html, matched the candidate bytes exactly. The new clarity/mastery browser suite was repeated in both formats from that extraction (**38 repeated checks**, zero failures/errors). These repeats are not added to the 228 named checks. The final archive changes only documentation/evidence/checksums after this verification, not runtime bytes. Final CRC and the per-file manifest are checked again after packaging. Evidence: `qa350/fresh-extraction.json`, `fresh-*.log` and `fresh-clarity-*.json`.

## Exact runtime identity

- Application: **3.5.0**
- Build: **3.5.0-f894a49bc7800157**
- Tag: **clarity-mastery-homecoming-350**
- Ruleset: **typekeeper-3.2.1**
- PLAY.html SHA256: `44f51dbdf37ce4c8dff1d2bb2320c3d22e4842a1b3acda9b70f2308b94b469e0`
- Source/current evidence: `qa350/`. Historical documentation: `docs/archive/`.
- Current screenshots are compressed WebP representations of native PNG captures;
  this reduces package size only. Original app assets/masters are untouched.
