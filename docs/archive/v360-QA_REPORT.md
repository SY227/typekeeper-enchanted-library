# Typekeeper v3.6.0 — Impact Pass
## Upgrade, internal production review and executed QA · 27 September 2026

以使用者已接受的 **v3.5.2 — Score Chase** 完整 ZIP 直接升級；不是退回 v3.4.0。
本次集中在擊鍵／落墨、漏字落紙、成功消字與得分的因果回饋。保留最新分數追逐、
紙堆儀表與 WIND 留白、48 關、難度與法術經濟。這是實際程式實作、內部視覺檢查和
已執行的自動測試；不是外部 AAA 工作室、IGN、真人 QA 團隊或平台認證。

## 1. Shipped changes

**Typing machine:** changed letters produce a bounded 95ms mechanical response;
Backspace has a distinct 105ms erase treatment. Enter returns the carriage over
160ms from its actual offset; the next letter interrupts it immediately. Alternating
hands, keytops, roller/lever and strike move locally. The real input, caret,
selection and hit area do not move. No screen shake and no animation input lock.

**Ink / target:** matched prefixes have stronger ink plus an underline. Every valid
common-prefix candidate remains readable; the word Enter would actually save gets four stronger paper-corner brackets. Exact
words take priority over longer prefixes; y/id ordering inside each set is unchanged. Full exact match has a small paper-edge
check that remains ready until Enter or an edit. No new targeting rule or auto-submit.
A currently typed card is not carried away by decorative shelf-arrival motion.

**Miss / pressure:** a missed word folds from its last drawn pose to the real desk
stack in 300ms. Contact compresses the stack briefly and triggers one quiet paper
landing cue; the immediate miss sound remains separate. The newest settled missed
word is printed on the top page. The numeric meter reflects true danger immediately.
A wrong submission still adds 2% but does not invent a named missed sheet. The stack
is a symbolic representation of total danger, not a simulation of one sheet per %.

The physical stack stays in the pocket between input and SLOW. Lower papers remain
narrow; upper papers can widen only above the input. The right edge is bounded and
clipped away from controls. WIND cancels the pile, in-flight paper and pending
landing sounds together, while keeping the typed buffer. Pause freezes movement;
Reduced Motion gives an immediate static equivalent. Existing meter/WIND geometry
and labels are unchanged.

**Saved-word reward:** correct score/progress is still awarded immediately by the
model. Release copies last-painted x/y/scale/angle. Ordinary paper clears in 250ms,
then disappears; late fragments do not remain as another readable target. Existing
word-origin point labels now last 440ms, cap at six, and suppress themselves rather
than cover another live word. Pickup trails and their book destinations remain.
Score Chase stays exact, frozen-target, mode/pace/scope aware; no second HUD was added.

**VFX:** short shelf contact shadows connect arrivals to their source. FIRE retains
its book-to-card filaments and local char seam, with fewer/smaller flame curls. There
is no new cross-screen fire wall. ICE lettering protection and gameplay duration
are unchanged. The central reading field stays clear rather than acquiring furniture.

See `IMPACT_SPEC.md` for implementation limits and acceptance contracts.

## 2. Internal review decisions (not fictional reviewer endorsements)

| Lens | Finding / decision |
|---|---|
| Input/UX | Native input is unchanged; Enter and the next word never wait for animation. Shared-prefix selection now has both shape and ink signals. |
| Readability | Six materials retain complete single-line text. Point labels yield to live words. Tiny layouts are safe-fitting checks, not a mobile-support claim. |
| World / VFX | Stack contact, machine response and local paper release carry the upgrade; no additional chapter decoration or new gameplay system. |
| Layout | An early wider pile conflicted with the input safety region. Geometry was narrowed below the paper and upper expansion delayed; numeric guards and visual captures were rerun. |
| Sound | One contact cue and mute/pause/WIND cancellation tested. Long-session subjective mix/comfort remains untested by human listeners. |
| Product | The accepted Score Chase and spacing are preserved. No speculative market score, revenue forecast or promise of player retention is attached to this release. |

Current rendered captures were visually inspected for ready/matching ink, physical
landing, twelve-card pressure, laptop/small-window layout and paper-local fire. Some
are deliberately constructed state fixtures. `qa360/visual-review.json` records
six direct visual observations and their capture hashes. The separately recorded normal-clock
journeys below are actual generator/keyboard executions, not posed gameplay claims.

## 3. Executed gates on the exact runtime

| Gate | Result |
|---|---:|
| Node logic, presentation, saves, preservation and regression | **692 passed / 0 failed** |
| Distinct named browser checks, both shipping formats | **480 passed / 0 failed** |
| Unhandled application exceptions in completed browser suites | **0** |
| Final-word / spell / trial boundary cases | **23,040 passed / 0 failed** |
| Deterministic model campaigns | **12/12 completed all 48 chapters** |
| Full rendered campaigns | **2/2 completed all 48 chapters** |
| Native launcher / version / cache / corrupt-file rejection | **7 passed** |
| Backup-first updater on disposable synthetic folders | **6 passed** |
| Preserved v3.5.2 core / Score Chase / CSS / original assets | **83 byte-identical files** |

| Browser suite | Standalone | Modules |
|---|---:|---:|
| impact | 26 | 26 |
| score-chase | 38 | 38 |
| clarity-mastery | 19 | 19 |
| chapter-art | 19 | 19 |
| scroll-repair | 19 | 19 |
| book-leaf | 26 | 26 |
| single-row | 19 | 19 |
| ui-spacing | 62 | 62 |
| flow-browser | 12 | 12 |

The 23,040 matrix is 48 chapters × 3 paces × 8 seeds × 20 scenarios. Full rendered
campaign agents use actual model/input/result handlers, normally earned spells,
accelerated stepping and sampled native rendering. The 96 spell/ending fixtures are
coverage inside the flow suites, not additional players. Pixel combinations and
simulation ticks are not counted as independent human sessions.

The new impact suite has **26 named checks per format**. It exercises native input,
common prefixes, Backspace, complete-ready waiting, carriage interruption, exact
point award, current draw-pose release, wrong-vs-missed-vs-late input, real modeled
miss/contact, WIND cancellation, pause/resume, reduced motion/high contrast, ICE
without input freezing, FIRE without points, transient caps, live-word/point-label
occlusion, 72 native ink layouts, six desktop pressure sizes, eight danger values,
menu resets, mute/unmute without stale replay, the earned sixth-card ICE rule,
exact BOOK versus lower BOOKCASE, and batched input/Enter target consistency.
Existing suites recheck Score Chase states/scopes/serialization, all book states,
modal focus/scrolling, all chapter titles, long words, long scores and
**12 viewport sizes** in the retained UI/score suites.

## 4. Real-clock execution evidence

**Opening campaign:** 82 words typed through actual keyboard events
in **113.61 wall-clock seconds**. It naturally crossed chapter5's
13/14 → 14/14 boundary, completed chapter6 and entered chapter7. Music/SFX and
ordinary requestAnimationFrame timing were enabled. No forced spawns, model-clock
acceleration or awarded quota/points. Zero page exceptions. Video is a Playwright
screen recording without an audio track, not a human playtest or recorded audio review.

**Overload / recovery:** a separate starting fixture enters the game's ordinary
Practice chapter12. The agent then waits for natural misses and uses real keyboard
input against normally generated words. No subsequent pressure, points, words or
resources are injected. Practice uses its ordinary model-defined starting inventory.
It reached **76.0% danger**, had **6 actual misses**,
and made **21 keyboard submissions** in
**35.38 seconds**; final phase: **level-clear**.
An earlier medium-pressure observation from the superseded pre-exact-target
candidate is retained in the historical archive; it is not a final-build pass.
These are scripted agents, not evidence that players find this satisfying or easy.

Evidence: `qa360/live-journey.json`, `normal-clock-journey.webm`,
`qa360/natural-pressure-journey.json/.webm`. Historical observation:
`docs/archive/qa360-pre-exact-target/natural-medium-pressure-journey.json`.

## 5. Performance sample, not a hardware guarantee

At 1440×1040, the controlled 12-card / 95%-danger / four-music-layer scene sampled
600 frame intervals with real typing effects: **58.35 average FPS**,
**16.8ms p95**, **1.2ms median CPU-side Canvas draw**,
maximum frame interval **33.4ms**. No page exceptions.

A separate serialized sample of unchanged v3.5.2 under the same harness measured
59.31 FPS / 16.8ms p95 /
1.0ms median Canvas draw. These two samples do not establish
causal performance equivalence, real-device input latency, worst-case simultaneous
FIRE/ICE cost or low-end GPU compatibility. Raw intervals are retained.

## 6. Preservation, setup failures and external limits

`tests/fixtures/v352-impact-preserved.json` pins all declared preserved files.
The actual game model/rules/economy/timers/controls/vocabulary/campaign/score-chase/
storage/CSS/UI geometry and original art/music assets have not been rewritten.
Renderer/presentation state, audio event treatment, main-frame cue wiring, release
identity and standalone build order are intentional changes. No runtime dependency,
font binary, telemetry, account, network API or Steam integration is added.

Original v3.5.2 passed its own **655 Node tests** before work began. Pre-final candidate
runs rejected stale version/preservation expectations; those contracts were scoped
to the intentional visual/audio changes, not used to hide a model alteration. A
subsequent geometry test rejected upper paper width expanding too early near input;
the code was fixed and all six-size/new browser and retained UI tests rerun. The
machine's zero pose was normalized to avoid a negative-zero serialization mismatch.
The old 320ms optional presentation check now explicitly expects the approved 250ms
release. Earlier failed logs remain labeled; they are not counted as final passes.
During final review a real inherited target inconsistency was reproduced: upper
BOOK was saved by Enter while lower BOOKCASE remained the selected prefix. The first
fresh gate was stopped and its evidence archived under
`docs/archive/qa360-pre-exact-target/`; none of those passes are used for this final
runtime. A read-only presentation/audio adapter fixes exact-match precedence and
batched event consistency. The game model remains unchanged. New Node and browser
counterexamples were added, then all listed suites, real-clock captures and the
fresh ZIP gate were rerun on the new SHA. See `exact-target-before.json`.

The first video run did not launch because Playwright's expected encoder was absent.
The installed system FFmpeg was exposed at its expected tool path, then the complete
normal-clock run was repeated successfully. No encoder binary is included in the app.
The failed setup log is retained as `docs/archive/qa360-pre-exact-target/live_journey-initial-video-tool-missing.log`.
An initial browser-close recording also ended before its encoder finalized the WebM.
That footage is not shipped: its size/hash/failure is recorded in
`docs/archive/qa360-pre-exact-target/video-initial-incomplete.json`. Capture was changed to close the browser context,
await video save and only then close the browser. Both new recordings were repeated
and checked with FFprobe plus a complete FFmpeg decode; `final-videos.json` records
the result. This fixes the recording harness, not game logic.

Native **HTTP and file URL navigation** of this exact build was attempted; both were
blocked with `ERR_BLOCKED_BY_ADMINISTRATOR`. Main suites therefore execute shipping
PLAY.html in memory and shipping modules via Blob transport, adapting asset URLs
and the existing local diagnostic guard only. Model/render/DOM/input/audio functions
are not replaced. Real Node/Python HTTP delivery and launchers are tested separately.
Blocked navigation is **unverified**, never a passing persistence/device test.

Environment: Node22.16.0, Chromium144.0.7559.96, Python Playwright, Linux; videos use
installed FFmpeg. The Mac launcher ran in Linux Bash, not by Finder double-click.
Real Mac/Windows/Safari/Firefox/Edge/GPU hardware, live Vercel, persistent localStorage
on the user's deployed origin, human first-time-player research and prolonged
subjective listening remain external checks. `HUMAN_DEVICE_QA.md` is a plan.
No AAA/IGN/Valve certification or defect-free guarantee is claimed.

## 7. Exact runtime and packaging

- Version: **3.6.0 — Impact Pass**
- Build: **3.6.0-4f4b9cffef2ba0ea**
- Ruleset: **typekeeper-3.2.1**
- PLAY.html SHA-256: `e67d83bdfe00337a92746cbe858c4e73c0f04002aa3dde4d28c10aedcc6d7287`
- Frozen runtime outputs: **59**
- Supplied v3.5.2 ZIP SHA-256: `ab1b7d34951a090fec04e614879e2b433a0a44c5928f49e2f5418dd61fe2ebd0`
- Current evidence: `qa360/`. `qa350/`, `qa351/`, `qa352/` and `docs/archive/` are historical.

Complete source, original assets/editable masters, dist, PLAY.html, launchers, safe
updater, tests, reports and execution evidence are included. QA-only PNG captures
may be converted to WebP; the screenshot index retains original and distributed
hashes and paths. Runtime art assets are not changed by documentation compression.

<!-- FRESH_GATE_START -->
### Fresh full-ZIP extraction gate — PASS

The complete candidate ZIP was CRC-checked and validated against every entry in
its full per-file SHA-256 manifest, then extracted to a new empty directory. Clean
**offline npm ci**, **692 Node tests**, syntax checks and the production rebuild
passed. All **59 runtime outputs** matched the frozen shipping hashes
before and after rebuild.

From the fresh extraction, the impact (26×2), Score Chase (38×2) and UI-spacing
(62×2) suites passed again: **252 repeated browser checks / zero failures**.
The native launcher checks (7) and safe-updater cases (6) passed again. These repeats
are not added to the 480 distinct named browser checks. The runtime hashes were
compared one last time after these tests.

Evidence: `qa360/fresh-extraction.json`, `fresh-commands.json`, six fresh browser
JSONs and command logs. The candidate archive hash is retained. Only documentation,
QA evidence and checksums were added afterward; no runtime code changed. The final
archive is CRC-checked, its complete file manifest validated, and all frozen runtime
hashes checked again. The external archive-verification JSON identifies that final ZIP.
<!-- FRESH_GATE_END -->
