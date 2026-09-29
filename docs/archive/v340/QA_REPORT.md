# Typekeeper: Enchanted Library — v3.4.0 release and QA report

**27 September 2026 · application 3.4.0 · preserved balance ruleset typekeeper-3.2.1**

## Scope and baseline

Built directly from the accepted full **v3.3.6 ZIP**, not from the broken v3.3.4/3.3.5
packages. The two requested changes are (1) slight chapter-specific cosmetics
matching each existing title and (2) richer FIRE and ICE presentation. The repaired
imperial scrolls, word text, inset magic seals, randomized game openings, difficulty,
economy and gameplay flow are preserved. This is a complete browser test release,
not a human playtest or independent AAA/platform certification.

## Chapter cosmetics — all 48, not just eight wings

`src/render/chapter-art.js` defines a frozen profile for every existing chapter.
Each profile is keyed to the real campaign ID/title and specifies a side-shelf
still-life, auxiliary bound-volume inlay, restrained architectural wash and ambient
accent. A scene cache keyed only to the wing would accidentally reuse the earlier
chapter's art: it is now keyed to the chapter and contrast setting, capped at two
cached scene layers. All 48 produced distinct native pixel hashes in both builds.

Examples: **Rain on Glass** adds the rain/condensation window; **The Eleventh Hour**
shows a clock at eleven; **The Frozen Seal** gets an iced seal; **Kindling** has a
warm brazier; **Constellations** uses an astral pattern; **One Last Candle** uses a
single candle. Changes sit on shelf margins and small props, not in the word lane.
There are no new obstacles, quotas, platforms, screens or gameplay mechanics.
`docs/CHAPTER_ART_SPEC.md` documents the exact 48-title mapping. Endless reuses the
final profile to keep rendering and cache growth bounded.

## FIRE and ICE

**FIRE:** a layered rising front with irregular flame tongues, warm local light,
bright hot-paper edges, progressive char, curling local fire and fine ash. The
cast cue lasts 0.65 presentation seconds. Removed cards transition into ash;
FIRE still earns no score, books or quota progress, and the game still schedules
replacement words normally. Live words are drawn after the effect layer.

**ICE:** faceted crystal growth on columns, shelf lips, lamp shades and scroll ends,
followed by a held frozen state and a 0.7-second layered thaw. The existing
six-second freeze remains the gameplay authority. The clear central ink corridor
is excluded from the frost texture; 360 actual raster intersections found no frost
pixels crossing protected lettering. Decorative motion freezes with ICE and slows
with SLOW, but text input remains immediate. Queued SLOW retains its full duration.

The new `ElementalArt` texture cache is limited to 48 entries / 12 MiB, with static
art cached rather than redrawn into a new texture every frame. Existing word
textures keep their separate bounded cache. Reduced-motion mode keeps static
chapter identity and readable status, without decorative flames, moving shards or
thaw motion. High-contrast mode and independent sound/music preferences are retained.

## Reference access: not viewed

The requested YouTube link was attempted through web access and runtime requests.
The web fetch returned a cache miss; watch-page/oEmbed runtime requests failed DNS.
Available plugin discovery did not supply a connected frame-analysis capability.
**The moving frames and audio were not inspected.** No timings, visual details or
sounds are asserted as observations of that video. These flame and ice treatments
are original designs using the user's direction and the actual Typekeeper code.
The soundtrack/SFX implementation and recordings were not replaced. Raw attempts:
`qa340/reference-attempt.json`; explanation: `docs/REFERENCE_ACCESS_340.md`.

## Executed automated gates

| Gate | Result |
|---|---|
| Node logic, state, rendering contracts, saves and regression tests | **436 passed / 0 failed** |
| New chapter/elemental browser suite — standalone / modules | **19 / 19 passed** |
| Existing scroll geometry/raster suite — standalone / modules | **19 / 19 passed** |
| Existing single-row/randomness suite — standalone / modules | **19 / 19 passed** |
| Existing material/caption/input suite — standalone / modules | **26 / 26 passed** |
| Integrated full-game flow suite — standalone / modules | **12 / 12 passed** |
| Total named browser checks | **190 passed / 0 failed** |
| Unhandled JS exceptions in completed browser suites | **0** |
| Last-word model boundary matrix | **23,040 passed / 0 failed** |
| Full model-level liveness campaigns | **12/12 reached all 48 chapters** |
| Full rendered campaigns | **2/2 completed all 48 chapters** |
| Animated all-spell chapter-ending fixtures | **96 endings passed** |
| Launcher, version, occupied-port and corrupt-file cases | **7 passed** |
| Backup-first updater cases | **6 passed** |
| Existing assets/core-source files compared with delivered v3.3.6 | **77 byte-identical** |

These are distinct layers of software testing. Pixel combinations, simulated ticks
and 96 chapter endings are coverage inside tests, not hundreds of extra people or
human play sessions. Current report JSONs carry this shipping SHA; inherited results
are not counted. `qa340/release-summary.json` enumerates the named browser suites.

### New art / spell-specific checks

- Every chapter ID/title mapping, 48 unique native scene pixel signatures, and the
  two-scene cache limit in both formats.
- Native Canvas cast onset/middle/expiry samples: **260 states per format**, all four
  spells; every material's destruction path and transient cleanup.
- **360 frost/ink raster cases:** ten short, long and custom words, six scroll skins,
  three scales and two formats. Rasterized letters and the frost texture have zero
  intersecting alpha pixels in the protected region.
- Actual 1–4 key casts preserve the current buffer, caret selection and stock rules.
- ICE freezes word and decorative drift; SLOW queues; thaw completes; input and
  replacement spawning continue afterward. Pause does not consume spell timers.
- 190-width texture churn respects cache limits. Restart, menu and chapter changes
  clear transient effects rather than carrying a stale FIRE/ICE overlay forward.
- Reduced motion, contrast, real native input/Enter and production boot without the
  diagnostic seam are explicitly exercised.

### Previous visual fixes remain covered

All **35,808 word/material/viewport/build combinations** are rechecked using actual
Canvas `fillText` calls: 746 words × six materials × four viewports × two builds.
Each draw contains the full canonical word at one baseline. Obsolete two-row cached
layouts cannot resurrect wrapping. Inset seal/rod/letter clearances also remain
covered by the existing **1,056 rasterized ink cases**. Menus and gameplay use the
same painter. Viewports include 1366×768, 1920×1080, 1280×720 and 1024×768, plus a
separate DPR 2 fixture. Captions remain clickable and below their magic books.

### Whole-game flow and the reported level-5 stall

The final-word matrix is **48 chapters × 3 paces × 8 seeds × 20 scenarios**. It covers
an empty board one word short of quota, FIRE, ICE, SLOW, WIND, combinations, missed
last words, late Enter, pause/resume and expiry boundaries. The last word must be
created by the shipped model and submitted, then the next chapter must spawn again.
No script awards the missing word or finishes the chapter on the player's behalf.
Intentional trial rests and frozen-time delays are not treated as stalls.

Two continuous rendered campaigns use actual input/result handlers and normally
earned spells, with accelerated stepping and sampled native rendering. Both finish
chapter 48. A separate fixture tests all four spell combinations at every chapter
ending in each format; another real requestAnimationFrame check confirms that the
clock and spawning still run after the stress sequence. These are automated
integration tests, not 48-chapter human playability claims.

An additional normal-speed browser journey used actual keyboard events, ordinary
requestAnimationFrame timing, music and effects enabled, with **no forced spawns or
clock acceleration**. It typed **82 words in 109.84 wall-clock seconds**, passed
**level 5: 13/14 → 14/14**, completed the chapter-six trial and reached chapter seven.
There were no page exceptions. Its 13/14 empty-board capture had an ordinary
0.6-second pending arrival and progressed naturally. Evidence: `live-journey.json`.

Additional timed agents ran **75 campaigns: 18 completions and 57 ordinary losses**,
plus **432 completed isolated chapter cases**, with no timeouts. No balance change
was made to force a higher win rate. The unchanged model is not a claim that this
synthetic player distribution predicts retention, fun or sales.

### Performance sample

The controlled scene held **12 cards, 95% paper pressure, four music layers** and
real typing feedback for 600 frame intervals. It measured **59.60 FPS average**,
**16.8 ms p95 frame interval**, and **0.9 ms median CPU-side Canvas
draw time** in headless Chromium. This is not a worst-case FIRE/ICE guarantee,
input-latency measurement or actual Mac/Windows hardware benchmark. Raw frame
samples and audio source counts are preserved in `feedback-performance.json`.

## Preservation and packaging

`tests/fixtures/v336-core-preserved.json` independently pins the unchanged baseline
files. All existing runtime illustration/audio assets, editable masters, model,
randomness, economy, rules, controls, storage, vocabulary, campaign, audio code,
styles and imperial-scroll geometry in that fixture retain identical bytes. New
modules are original additions. Renderer wiring and release/build metadata change.
The same save key and ruleset keep v3.3.6 records current, not moved to Legacy.

The full handoff includes source, editable original masters, audio, public assets,
prebuilt dist, embedded PLAY.html, launchers, updater, current tests and raw QA.
Old duplicate screenshots were removed or archived outside this distributable;
curated current screenshots are compressed to WebP inside the ZIP. Full-resolution
PNG previews are delivered separately. No new font or account/backend dependency.

## Findings and limits, without hiding the failed attempts

Initial checks rejected the prior expected-version literals and a fake test context
that did not yet supply the new elemental renderer. Test fixtures were updated for
the new APIs; preservation fixtures and actual raster contracts were not rewritten
to conceal visual defects. The initial logs are retained. A reset test inspected
queued model events before flushing; its oracle was corrected without changing the
game. Several monolithic long browser harness attempts exceeded the tool window or
queued too much native draw work. The completed campaign harness yields in small
batches and flushes Canvas work; those interrupted attempts are not counted as
passes. See the `*-initial*` and `*-interrupted*` logs in qa340.

Actual navigation of the current build to loopback HTTP was attempted and returned
**ERR_BLOCKED_BY_ADMINISTRATOR**. Browser suites therefore execute the shipping
standalone HTML in memory and modular build through Blob-module transport. Only
transport/asset locations and the existing diagnostic guard are adapted; game,
render, input, DOM and audio functions are not replaced. Actual Node/Python HTTP
payload delivery and launchers are verified separately with hashes/MIME/HEAD/404.

Environment: Node v22.16.0, Chromium 144.0.7559.96 on Linux, Python Playwright. The
Mac Bash launcher is run under Linux, not double-clicked in Finder. Actual Mac
Chrome/Safari, Windows, real Retina hardware, live Vercel, human enjoyment and
extended listening remain external checks. A tested browser ZIP is not Steam/Valve
approval or independent AAA certification.

## Exact build

- Application: **3.4.0**
- Build: **3.4.0-cbb049170ccf1a33**
- Tag: **chapter-atmospheres-elemental-340**
- Shipping PLAY.html SHA-256: `807353f018d9fb05a29ee2a829ba26f521ade4aa7ebacb7ca185504236552381`
- Current evidence: `qa340/`; prior documentation: `docs/archive/`.

## Fresh-package gate

The actual candidate full ZIP was CRC-checked and extracted into a new empty folder.
Offline install, all **436 Node tests**, syntax validation and production rebuild
passed. **All 53 runtime outputs were byte-identical**, including the complete dist
tree and PLAY.html. Both new chapter/elemental browser suites passed again from the
extraction (**38 repeated checks**, zero exceptions), followed by **7 launcher checks**
and **6 updater cases**. These repeats are not added to the 190 named browser total.
After those runs every runtime hash was compared again. The final handoff adds only
documentation, evidence and checksums to those verified bytes. Archive CRC, exact
root directory and runtime hashes are verified again after final packaging.
Evidence: `qa340/fresh-extraction.json` and `fresh-*` logs / JSON.
