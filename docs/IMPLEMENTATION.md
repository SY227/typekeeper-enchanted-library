> **v3.5.1 addendum:** See [UI_SPACING_SPEC.md](UI_SPACING_SPEC.md) for this release’s UI-only changes and [QA_REPORT.md](QA_REPORT.md) for current evidence. The material below describes retained systems or earlier decisions.

# v3.5.0 implementation map

Built on the supplied v3.4.0 full source, not on a re-created prototype.

| Review item | Implementation | Verification |
|---|---|---|
| 100% accuracy with one star | `campaign.js` exports immutable medal limits and `medalFeedback`; `main.js:showClear` shows submission accuracy, misses, wrong submissions and exact deficit(s). | 0..30 count matrix; actual result at 3 misses / 0 wrong / 100%; both-deficit browser case. |
| Unified combo | `rules.js:streakMultiplier` is used by scoring and model getter. `model.js:submit` emits `multiplier-up` only when the multiplier rises. Renderer/audio consume that event. | Model 1..80 correct words; 5/8/15/16/63/64/72 browser checks; wrong-submit reset; checkpoint restore no re-award. |
| Contextual guidance | `ui/contextual-guidance.js`, `main.js:renderGuidance`, existing input-paper and ICE-book elements. Learned flags share the existing guidance storage. | Exact vs partial match, native Enter, genuine sixth spawn, hint toggle, pause, spell use, finite teaching window. |
| Legibility | `readableHudSizes`, CSS variables applied on resize; compact-label mode suppresses only duplicate hotkey. | Four viewport sizes, >=14 CSS px for relevant labels, caption geometry, long-word input, DPR2. |
| Honest progress | `game/chapter-records.js`, `LocalStore.recordChapter`, `processEvents` prior-value capture. One scoped atomic attempt, old mastery separately retained. | Strict import scope, no invented seed, no cross-mode PB, higher-star priority, +120 score, tied-repeat and map-return cases. |
| Journey | `ui/journey.js` has eight seal silhouettes, campaign-only boundary routing. `OutcomeCue` owns short cancellable timing. Result menu remains the familiar parchment. | Seven wing transitions; natural 4.2s finale; Enter/Escape/click/repeat-key; invisible tab; reduced motion; practice/endless exclusion. |
| Wing art | `chapter-art.js:WING_LANDMARKS/paintWingLandmark` composes eight lit shelf landmarks outside the word corridor. All 48 title profiles remain. | 48 chapter profiles and distinct rendered scene signatures; bounded two-scene cache. |
| FIRE | `elemental-art.js` / presentation emit local book-to-card traces and burn each removed card's own paper geometry. No large front across live text. | Input retained, no score/quota gain, replacement words arrive, existing raster/geometry protection. |
| Sound | `GameAudio.journey`, voice group `journey`, short synthesized wing/finale motifs and controlled ducking. | Actual WebAudio scheduling/cancellation and independent SFX-off browser fixtures; not a human mix review. |

## Invariants

Balance ruleset and save key remain `typekeeper-3.2.1`. Local save schema stays v3
with additive `chapterBests`. Old v3 progress/mastery, checkpoint and records load
normally. Missing `chapterBests` simply means no comparable chapter score yet.
Missing historical random provenance stays missing; it is not converted to zero.

The baseline reference in `tests/fixtures/baseline340/` contains the original
v3.4.0 model dependency graph, with original SHA256 values. It is test-only, not
another runtime or an alternate engine. Differential tests run old and new models
on identical real spawns/actions for all 48 chapters and three paces, compare
snapshots, scoring, chapter history, checkpoint and replay, and exclude only the
new presentation event/annotation. Numerical rules are compared directly.

`tests/fixtures/v340-unchanged.json` pins 72 unchanged runtime/source/master files.
The changed renderer, audio, storage, campaign helper, model event plumbing and
main UI are intentionally NOT asserted byte-identical. Their behaviour is tested.
Historical whole-source fixtures remain historical; they were not overwritten to
make new functionality appear unchanged.

## Comparison policy

Mastery means the best star rating in the existing pace/chapter collection,
including both campaign and practice, as before. A chapter-score PB is separately
scoped to current ruleset + pace + mode + chapter. Its complete row is the best-score
attempt; WPM and accuracy in that row belong to that attempt, not independent maxima.
Only an increased score replaces the row. First attempt creates a baseline.

Results show a newly earned mastery rating first, otherwise an improved scoped
score, otherwise the newly established baseline. Nothing claims a record on a tie
or lower performance. Returning from the chapter map does not re-process the clear.
No result says a practice score beat a campaign score.

## Presentation lifecycle

A campaign multiple-of-six clear queues a wing reward; chapter48 queues the finale.
Other modes receive their normal clear. The engine stays at level-clear throughout
and waits for the player's existing Next/Endless action. The new presentation never
calls a fake complete-level method or awards additional magic/points.

Enter/Escape or the visible button completes only the current presentation once.
Held key repeats do not double-submit. Screen focus is moved into the presentation;
play controls are inert until results/gameplay return. Hidden tabs pause timing and
stop sound. Changing screen cancels renderer/audio state. Reduced motion bypasses
animated presentation and directly shows the same static result and earned seals.

## Remaining work that requires people/hardware

No external participants were recruited. No native Mac, Windows, Safari/Firefox/
Edge, hardware input latency, 20–30 minute headphone mix evaluation or live Vercel
session was available in this execution. The manual protocol is in
`HUMAN_DEVICE_QA.md`; unchecked gates are not presented as completed.
