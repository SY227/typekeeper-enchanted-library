# Typekeeper: Enchanted Library — v3.6.3
## Open Atrium · Implemented revision and executed QA

A focused central-environment update to the supplied v3.6.2 full game. This report
records implemented work, automated testing and internal visual inspection. It is
not an independent AAA/IGN review, a human playtest, native-platform approval or a
claim that no bugs exist.

## 1. What changed

The large translucent green manuscript behind the words is removed, including its
outline, horizontal ruling, binding dots, margin and ring. It is not simply made
more transparent, and is not replaced with another visible panel.

The original painted receding shelves and curved upper gallery now supply the
room's depth. A softly feathered, desaturated charcoal-teal grade with restrained
warm lantern bounce harmonizes the reading space with the surrounding wood/brass.
Scrolls remain high-contrast parchment objects floating in the room. No new central
furniture, moving haze, screen shake, HUD or gameplay system is added.

Normal and high-contrast backdrop surfaces are prepared during loading and reused.
The title/menu keeps its original art treatment. Word cards, lettering, impact
feedback, character, spell effects, audio, input geometry and HUD positions remain.

Implementation and internal design-review decisions: `docs/OPEN_ATRIUM_SPEC.md`.
Tools actually used: JavaScript/Canvas 2D, Python, Playwright and Chromium. No Unreal
or Blender conversion, generated 3D scene or outside studio endorsement is claimed.

## 2. Preservation

**88 original source/art/audio files are byte-identical** to v3.6.2,
including main UI handlers, CSS, layout, gameplay/data/storage/scoring, public game
assets and editable original masters. Additional exact-delta tests verify that the
renderer changes only its atmosphere import, instance, loading preparation and
roomLayer background block. Original baseline hashes are retained.

The 48 chapters, difficulty, resources, manual Enter, spell durations, star rules,
Score Chase scopes, Endless, finale, and Start from Chapter 1 with retained unlocks
are unchanged. Ruleset is `typekeeper-3.2.1`; save key is
`typekeeper-enchanted-library-v3.2.1`. Export a save before changing browser/origin/
port/file URL and import it at the new location as necessary.

## 3. Current-build completed gates

| Gate | Result |
|---|---:|
| Node logic / preservation / storage / rendering contracts | **909 passed / 0 failed** |
| Named browser checks across both shipping formats | **656 passed / 0 failed** |
| New Open Atrium named checks, included above | **74 passed** |
| Unhandled page exceptions in completed suites | **0** |
| Final-word / spell / trial boundary matrix | **23,040 passed** |
| Complete model campaigns through Chapter 48 | **12 completed** |
| Full rendered campaign flows through real input/result handlers | **2 completed** |
| Native launcher / payload / version / corruption cases | **7 passed** |
| Backup-first updater cases | **6 passed** |

| Browser suite | Standalone | Modules |
|---|---:|---:|
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
| atrium | 37 | 37 |

The boundary matrix is 48 chapters × 3 paces × 8 seeds × 20 controlled scenarios.
Rendered full campaigns use accelerated model stepping and sampled native drawing.
They are not human play sessions. State combinations/raster masks within a named
check are coverage, not inflated additional tester or case counts.

Raw commands, exit codes and durations: `qa363/regression-commands.json`,
`additional-commands.json`, and `logs/`. Older evidence is not added to these counts.

## 4. Focused environment and UX evidence

The new suite checks the actual compiled standalone and modular application:

- All 48 chapters with normal/high contrast, unchanged simulation snapshots and
  bounded chapter/atmosphere caches. Existing chapter identities remain distinct.
- Actual atlas raster containment and smooth alpha falloff, including the old
  manuscript's top and bottom coordinates; no hard replacement edge.
- Original artwork's local luminance variation preserved while central chroma is
  reduced. In the sampled central region, before/after chroma averages were
  **27.75 / 5.83**
  channel units; luminance correlation was **0.9983**.
  These are implementation measurements, not human readability-study results.
- **60 live rendered frames with zero per-frame pixel readbacks** after loading.
- **120 contrast toggles** without atlas growth or game-state changes. Two retained
  surfaces total **7,584,000 bitmap bytes (about 7.23 MiB)**; this is the new atlas,
  not a claim about total application memory. Existing scene caches stay bounded.
- 12 viewport sizes: 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768,
  1024×600, 800×600, 960×540, 640×480, 2560×1080, 768×1024, 360×640.
  Tiny/portrait checks establish containment only, not comfortable touch play.
- Twelve live cards at 95% paper pressure; six scroll materials; prefix input,
  Backspace, exact-word Enter priority; all four spells through keyboard handlers;
  ICE expiry/queued SLOW; preserved input selection; pause/resume and reduced motion.
- The first key and Chapter 5→6 transition do not trigger atmosphere construction.
- Non-diagnostic startup, missing-source safe behavior and actual rendered previews.

The focused cold-build sample took **96.5 ms**
for both atmosphere surfaces in headless Chromium. The live game performs this
under its existing loading screen. This is one environment sample, not a hardware
loading-time guarantee.

## 5. Moving gameplay evidence

The normal-clock automated keyboard journey typed **82 words in
114.18 seconds**, naturally passing Chapter 5's 13/14→14/14 boundary,
completing the Chapter 6 trial and reaching Chapter 7. No forced
word spawns, awarded progress or accelerated clock were used in that journey.

A separate Chapter 12 Practice agent let words naturally fall, reached
**76% pressure**, then used **21 keyboard
submissions** to recover. It recorded **6 misses** and finished in
phase **level-clear**. Initial chapter selection is explicit; subsequent
pressure and scores are model-earned. Both journeys recorded zero page exceptions.

Videos: `qa363/normal-clock-journey.webm` and
`qa363/natural-pressure-journey.webm`. Playwright recordings are silent captures,
not subjective listening tests. Controlled demonstration screenshots are separately
identified; they are not represented as human-earned runs or marketing test data.

## 6. Performance sample

The same inherited harness ran serially against unmodified v3.6.2 runtime and this
candidate: 12 cards, 95% pressure, four music layers, real typing feedback and
600 frame intervals in Linux headless Chromium.

| Sample | Average FPS | p95 frame interval | Median CPU Canvas draw |
|---|---:|---:|---:|
| v3.6.2 baseline | 55.90 | 33.30 ms | 1.30 ms |
| v3.6.3 candidate | 55.47 | 33.30 ms | 1.30 ms |

Raw intervals are retained in `performance-baseline.json` and
`performance-candidate.json`. These single-run samples do not establish native GPU
performance, input-to-photon latency, worst-case combined-spell frame rate, or a
performance gain. Warm rendering still reuses one cached chapter layer per frame.

## 7. Visual review and limits

Before/after comparison scenes use the same original art and word arrangements.
Internal visual inspection checks coherent room perspective, absence of the ruled
screen, readable scroll materials, no extra focal distraction, all spell states,
and preserved HUD/book/pressure spacing at desktop and small-laptop sizes.

Native browser HTTP/file navigation was attempted and returned
`ERR_BLOCKED_BY_ADMINISTRATOR`; those attempts are **unverified**, not passing
native-navigation tests. Suites load the actual shipping `PLAY.html` in memory or
actual dist modules through Blob transport. Only transport/asset URLs and the
existing diagnostic guard are adapted. Game/UI/renderer/audio are not replaced.
Some save tests use a declared fault-injectable in-memory storage adapter; they do
not certify native localStorage on a live site. Node/Python payload, launchers and
build hashes are tested separately.

Environment: Node 22.16.0, Python 3.13.5, Chromium 144.0.7559.96, Linux.
No macOS/Windows/Safari/Firefox/Edge physical-device, prolonged subjective audio,
real-user preference/retention, Steam installation or live Vercel validation is
claimed. The existing human/device QA plan remains unexecuted.

## 8. Failed attempts and evidence integrity

The initial Node run failed one stale title-version regular expression. That
expectation was updated from v3.6.2 to v3.6.3; the original failure log is retained.
The first two video attempts could not start because Playwright's FFmpeg binary was absent. The installed system FFmpeg was linked at the expected tool-cache path, and both entire normal-clock journeys were rerun successfully. Original failed logs and followup command results are retained. No game code changed for that tool repair. The updater's receipt now reads the version from package.json rather than recording an old literal; its six cases were rerun.

No gameplay/asset baseline hash was rewritten to conceal a mismatch. Any additional
initial harness failures are retained with their correction notes in this folder;
only completed current-build final suites count as passes.

## 9. Exact runtime

- Application: **3.6.3 — Open Atrium**
- Build ID: **3.6.3-447ce8d517d13011**
- Shipping PLAY.html SHA-256: `9734786aba6ddd133fff64a54df6310d6234dd02df07c394f6b95e6388997266`
- Runtime files: **61** (dist tree plus PLAY.html)
- Supplied baseline ZIP SHA-256: `690409379f3649f1541684718cdd81e7e03826b7ccc5003e40b7ed6f4ce7e3ee`
- Runtime hashes: `qa363/runtime-freeze.json`

All original runtime art/audio and editable masters are retained. QA-only screenshot
previews may be compressed to WebP with original-path/hash indexes; that does not
change the runtime. Documentation and packaging checksums are refreshed separately.

## 10. Fresh extraction gate

The complete candidate ZIP was CRC-checked, verified against its per-file SHA-256
manifest, then extracted to a new empty directory. Offline `npm ci`, all **909
Node tests**, syntax validation and a production rebuild passed. **61 runtime
outputs were byte-identical** before/after rebuilding and after every fresh check.

Fresh extraction browser repeats: Open Atrium, Fresh Journey, UI spacing and Score
Chase in both formats — **376 passing repeated checks**. These repeats are not
added to the 656 named browser checks above. The 7 launcher and 6 updater cases
also passed again. Full commands and logs: `qa363/fresh-extraction.json` and
`qa363/fresh-logs/`. Candidate ZIP SHA-256: `e813fce1705696b9b5801ebf4d3d836ed6e30500356f2b87d1530155aa0904e8`.

Only QA evidence, documentation and packaging checksums are added after this gate;
no runtime changes follow it. Final ZIP CRC, per-file checksums and all runtime
hashes are verified again. The final ZIP's own hash is supplied externally to
avoid a self-referential archive checksum.

