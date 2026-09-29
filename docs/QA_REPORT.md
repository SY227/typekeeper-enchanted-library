# Typekeeper v3.6.4 — Bound & Balanced
## Production polish, compatibility, and executed QA

29 September 2026. This report records actual implementation, internal visual/code
review and automated execution. It is not an independent AAA/IGN review, a human
study, platform certification, a guarantee of perfection or a promise of Steam success.

## 1. Exact source and change boundary

The sole app baseline is the user's attached
`Typekeeper_Enchanted_Library_v3.6.3_Full_App_RELEASE_FIXED(1).zip`.
SHA-256: `3072350734dac0defce2d7d9b5fc79ca8379a36058b0096a7a038e14476d0758`.
It passed archive CRC and the baseline's actual **806 Node tests** before editing.
This is not a reconstruction from another conflicting v3.6.3 variant.

The app is now **3.6.4 / bound-and-balanced-364**. It retains the original storage
key, all 48 chapters, spells, audio, vocabulary, main UI, typewriter animation,
Open Atrium background, above-book captions and Paper Pile/Wind geometry.

Six existing application source files change, plus one new material module.
**86 source/art/audio files are byte-identical** in the src/public/asset-source
preservation scan. See `qa364/source-preservation.json` and
`qa364/application-diff.patch`. No engine replacement or new runtime dependency.

## 2. Stage quotas: no thirteen-word requirement

Only Chapters **3 and 4** change: **13 → 14 correct words**, in every pace and in
both Campaign and Practice. All other stage quotas stay as authored. First-wing
completion is now **84 words**, rather than 82. Stage number 13 and interim
progress 13/14 are deliberately not removed.

All 48 chapter HUD denominators were checked in all three paces. Unit coverage
checks levels 1–10,000. Actual keyboard cases confirm the thirteenth submission
keeps the changed chapter running, and the fourteenth clears it once. FIRE still
cannot score, collect burned books or advance the chapter. Stage selection and
HUD share the authoritative model quota; there is no cosmetic denominator hack.

## 3. Art and UX revision

The first wing's right-hand open book now has a supported wooden lectern, slightly
asymmetric perspective, curved pages, layered page edges, a shadowed gutter, warm
aged paper, manuscript marks, a restrained cloth bookmark and darker leather.
The feet visibly meet the shelf. Related volumes use curved spines, quiet leather
grain and worn bands instead of flat bright blocks. Other bound folios inherit the
material treatment within their original shelf footprints.

The texture noise is locally seeded, deterministic and independent of gameplay
randomness. Material detail is painted into the existing room cache, not rebuilt
on each keystroke. Ninety-six chapter traversals retained at most two cached scene
layers. The background itself is unchanged.

A same-scene room-layer pixel comparison measured **20,660 changed pixels** in
approved shelf areas; **zero changed pixels in the live-word corridor** and zero
outside the declared art masks. This is one controlled comparison, not a claim
that every possible animation frame is pixel-identical.

Internal visual review inspected the first-wing before/after detail, full scene,
eight wing representative captures, pressure/spell states and legibility. The
principal improvement is physical support and material coherence, not more VFX.
No screen shake, extra UI panels or new moving background effects were added.

## 4. Scores and saves

Quota changes create different scoring opportunities. New attempts use ruleset
`typekeeper-3.6.4`; prior `typekeeper-3.2.1` profiles remain historical.

Existing unlocks, best stars and scoped score history survive load, export and
import. Historical chapter PBs and running-total PBs remain stored under their
original keys. New Score Chase comparisons cannot silently mix those profiles.
Older continued checkpoints retain original score provenance and display
**EARLIER RULES**. A Fresh Journey uses the current profile and may show FIRST RUN
where no comparable new-profile record exists; that is not data loss.

The migration fixture was produced by the actual supplied baseline code. It covers
all three paces, 72 historical chapter PB entries, 36 running-total PB entries,
previously earned access and three deliberately identical-date/score/seed records.
The last case exposed a genuine import defect: record identity omitted difficulty.
Difficulty is now part of the deduplication key. Tests verify that all three records
survive and repeated imports do not create duplicates.

Storage failure, wrong/future profiles, invalid records, collection limits, repeated
migration, old legacy-score retention, safe restart and Practice not overwriting
Continue are covered. There is no account/cloud migration or multi-device claim.

## 5. Executed current-build gates

| Gate | Result |
|---|---:|
| Node logic, preservation, migration and rendering tests | **854 passed / 0 failed** |
| Browser checks, both formats | **720 passed / 0 failed** |
| New production-polish browser checks, included above | **64 passed** |
| Last-word / spell / Trial boundary matrix | **23,040 passed / 0 failed** |
| Complete model campaigns through Chapter 48 | **12 completed** |
| Complete rendered campaigns through Chapter 48 | **2 completed** |
| Native launcher/cache/payload/corruption checks | **7 passed** |
| Backup-first updater cases | **6 passed** |
| Filtered deployment-input build | **Pass; 62 identical runtime outputs** |

| Browser suite | Offline | Modules |
|---|---:|---:|
| production-polish | 32 | 32 |
| atrium | 37 | 37 |
| restart | 51 | 51 |
| ui-spacing | 62 | 62 |
| score-chase | 38 | 38 |
| impact | 26 | 26 |
| clarity-mastery | 19 | 19 |
| chapter-art | 19 | 19 |
| scroll-repair | 19 | 19 |
| book-leaf | 26 | 26 |
| single-row | 19 | 19 |
| flow-browser | 12 | 12 |

The 854 tests retain all 806 baseline tests plus 48 new cases. The immutable old
reference sources/hashes remain. Exact reverse-delta guards account only for the
explicit quota/migration/art changes; unrelated edits still fail the old pins.
No failed test is hidden by skipping it or replacing the original oracle hash.

The 720 browser checks use real shipped game/DOM/input/rendering code. The 23,040
boundary cases are 48 chapters × 3 paces × 8 seeds × 20 scenarios, not 23,040 humans.
Full campaign stress agents advance the model clock and sample rendering; they
are separate from the normal-clock real-keyboard recording below.

Viewports: 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768, 1024×600,
800×600, 960×540, 640×480, 2560×1080, 768×1024 and 360×640. Portrait/small
checks prove containment and accessible actions, not touch-gameplay suitability.
Retained stress cases include 12 simultaneous cards and 95% pressure; new bindery
layout cases also cover six-card pressure scenes, four spells, High Contrast and
Reduced Motion. Headless timing under concurrent automation is not an end-user FPS
benchmark. Static cache rebuilds happen at scene changes, not per-key/per-frame.

## 6. Real-time keyboard observations

A new normal-clock, real-keyboard-events run typed **84 words**, naturally cleared
both changed chapters and the first wing, passed the Chapter 5 13/14 boundary and
entered Chapter 7 with no page errors. It used no injected score, fabricated word
spawns, direct clear call or accelerated game clock. It remains an automated agent.
Video is silent and cannot validate perceived audio quality.

Current results, recordings and command exits are in `qa364/live-journey.json`,
`qa364/normal-clock-journey.webm` and `qa364/live-commands.json`. A separate normal-clock Chapter 12 run naturally accumulated **7 misses and
90.8% pressure**, then completed the chapter with **21 correct words** through
22 keyboard submissions, without page errors. Its actual observations are in
`qa364/natural-pressure-journey.json`.

## 7. Corrections found during production

Early test attempts retained old version/rules/whole-file identity assumptions;
these were corrected only for the explicit revision. A new test initially used a
wrong inactive-submit expectation (`ignored` instead of null); it was fixed. New
save coverage found the cross-pace record deduplication defect, which was fixed in
the app. A chapter-map harness initially targeted chapter 12 without switching to
its wing, then used an ambiguous wing selector; it now clicks the actual wing
button. These were harness issues, not bypassed game failures.

Initial live recording could not launch because Playwright's bundled encoder was
missing. Its download was blocked by DNS. The installed system FFmpeg 7.1.5 was
used for video encoding; the successful later run is recorded. Only the encoder
path changed, not gameplay. Initial failure logs remain in development-attempts.

## 8. Deployment/package hygiene

`.vercelignore` excludes tests/QA, editable masters and the offline bundle from a
CLI upload. A local build using only deployment inputs was executed and produced
all **62 identical** dist/PLAY outputs. This is not a live Vercel deployment.
The full ZIP still includes all game source, masters and tests. Old duplicate QA
images/videos are omitted; current screenshot previews are WebP with original
hashes mapped in `qa364/screenshot-index.json`. Runtime art is not recompressed.

## 9. Scope limitations

Node 22.16.0, npm 10.9.2, Python 3.13.5, Chromium 144.0.7559.96, Linux.
Native Chromium navigation to the local origin returned ERR_BLOCKED_BY_ADMINISTRATOR.
Browser suites therefore use the documented in-memory PLAY.html/Blob-module
transport. Save UI tests use an explicit localStorage-shaped in-memory adapter.
They exercise serialization/import/export logic, not durable storage on a real
hosted origin or across actual browser profiles. Native server responses and
launcher behavior are checked outside browser navigation.

The Mac shell launcher is exercised under Linux Bash, not Finder. Windows/macOS,
Safari/Firefox/Edge, actual keyboard/audio devices, human comfort/readability,
long-session listening, live hosting and Steam installation remain external checks.
No independent AAA staff, IGN critics or human test panel participated.

## 10. Fresh complete-archive gate

See `qa364/fresh-extraction.json` and the accompanying final archive verification
for the executed clean-extraction checks. Runtime files are frozen before this
gate; only evidence/documentation/checksums may be added afterward.


### Final clean-extraction result — PASS

The completed candidate full ZIP passed CRC and every per-file checksum, was
extracted to a new empty directory, and ran offline npm ci, **854 Node tests**,
syntax validation and a full production rebuild successfully. All **62 runtime
outputs were byte-identical** afterward. Both new production browser suites passed
again (**64 repeat checks**, not added to 720), followed by the seven launcher and
six updater checks. Exact commands and exits are in fresh-extraction.json.

Only final QA/documentation and checksums were added after this gate. The final
user-facing archive was then tested again for CRC, every per-file checksum and all
62 frozen runtime hashes. Its SHA-256 is supplied in the separate archive
verification JSON to avoid a self-referential archive hash.
