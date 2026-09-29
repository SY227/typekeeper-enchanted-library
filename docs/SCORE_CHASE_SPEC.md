# Score Chase — v3.5.2 production specification

## Purpose and non-goals

Give the player a meaningful personal target without adding gameplay decisions,
modal interruptions or another HUD panel. Keep the accepted v3.5.1 design and
spell/meter spacing. This is not a leaderboard or a deterministic ghost competitor.
Random word sequences and existing scoring remain as before.

## Scope, number and storage

The primary number is always `model.score`, the cumulative total. It is not
`score - stageStartScore`. Comparing that total to `chapterBests.stageScore` in a
later campaign chapter would be a misleading target; this release explicitly
prevents that mismatch.

A best is keyed by
`running-v1 | ruleset | pace | mode | startLevel | chapter`.
Campaign indexes cumulative totals at the reached chapter; Practice indexes one
chapter; Endless uses chapter 0 to represent the whole continuous run. Different
starting chapters cannot share campaign or Endless totals. An earlier-rule save
shows EARLIER RULES instead of borrowing current-rule scores.

`ScoreChase.begin` reads a cloned validated record once and freezes the scope.
The reference is not updated by points, result persistence, settings changes,
importing another save, or another tab. Campaign begins a fresh scope on entering
the next chapter. Endless keeps its target across waves. A retry/new attempt
snapshots the newly saved best. Continue restores the chapter-start score and
locks its corresponding target without replaying an already-earned celebration.

`scoreChaseBests` is additive to the existing version-3 save and same storage key.
The collection is bounded at 512 entries. Values are safe integers, nonnegative,
maximum 1e12; keys and current ruleset are validated. Higher scores merge
monotonically. Invalid input cannot inject a mismatched target. Store writes occur
at completed chapters / finished runs, never every frame or every keystroke.
Clearing scores clears records, chapterBests and scoreChaseBests; stars and chapter
unlock progression are preserved. Explicitly cleared records cannot be recreated
from a remaining checkpoint during later reload.

Existing proven records can seed a target immediately. A legacy checkpoint can
seed cumulative chapter totals only if its single-run history is contiguous, its
rules match and the sum exactly equals that checkpoint's score. Separate chapter
maxima are never summed. Practice chapter PBs, and campaign starting-chapter PBs,
are comparable to the visible total; later campaign chapter subtotals are not.
FIRST RUN is an honest missing-reference state, not a claim about lifetime play.

## Visual hierarchy and spacing

The existing SCORE region becomes a compact etched brass / dark-green grouping.
Native 1200×900 stage: x238, y33, width184, height102, padding8. The text keeps its
previous x246 anchor. The neighboring chapter ribbon begins at x444, so the score
panel leaves 22 native pixels of separation. It ends above incoming word cards.
Neither the PAPER PILE instrument nor any book, label, cast origin or word geometry
moves. Main score retains the largest type; the subordinate best is never removed
by focused-HUD mode.

Main scores use exact locale-formatted integers and tabular numeric features.
Measured local fit applies only to long numbers, not the entire stage. The
secondary line aims for 12 CSS pixels on ordinary laptop layouts, with local
fitting for extreme digit counts. Very small portrait screens are tested for
non-overlap only, not promised as a comfortable input platform.

The accessible description spells out the active mode/pace, reached chapter,
start point and original frozen target. After NEW BEST replaces the visual
baseline with a delta, that original baseline remains in the description/title.
There is no per-score aria-live announcement or focus transfer.

## State machine

| Condition | Visible subordinate line | Extra response |
|---|---|---|
| No valid comparison | FIRST RUN | No false first-point record celebration |
| Current below 90% of positive best | BEST n | Neutral hierarchy |
| 90% through an exact tie | BEST n | Subtle static emphasis; no countdown or negative delta |
| Current strictly exceeds target | NEW BEST +delta | One event on the first earned crossing |
| Earlier scoring rules | EARLIER RULES | No current-rule comparison |

A real recorded zero is valid; it is not mistaken for a missing record. The
tracker's crossed state is latched for the attempt. Synchronization/restoration
may show a beaten state but never replays a congratulation. A tie is not a record.
Game-over headings use the same frozen reference: FIRST SCORE RECORDED for no
reference, a scoped new-best label when exceeded, otherwise ordinary ending text.
They no longer compare an arbitrary all-run best from another chapter.

## Motion, audio and interruption policy

Ordinary correct-word scoring gets a 130ms, 0.8px upward ease; the exact integer
changes immediately. There is no score-count tween, repeated scale/pop or floating
number added by this feature. First live crossing gets one 650ms etched-light
sweep, one accessible announcement and a quiet two-note synthesized cue using the
existing audio manager's cancellable score group. No audio assets are replaced.

When Reduced Motion is enabled, both movements are removed and static textual
state remains. High Contrast preserves both numbers and the NEW BEST wording.
Mute/SFX-off, navigation and background transitions cancel score audio; hiding or
leaving the play view cancels score animation. No deferred PB fanfare is queued.
If crossing occurs on a completion bonus / last-word clear, the already-existing
chapter, wing or finale presentation wins: the score state updates without a
second competing celebration.

## Engineering boundaries and review

Gameplay/model/rules/economy/campaign/vocabulary/input/timing code and original
art/audio files are pinned against the supplied v3.5.1 hashes. The presentation
version literal changes, but the renderer is otherwise unchanged. New scope /
persistence logic, existing HUD markup/CSS/main event wiring and build metadata
are the intended changes. No external analytics or network access is added.

The design review checks are implemented as testable contracts: same metric,
frozen target, distinct pace/mode/chapter/start/rules, single celebration edge,
no false first-run record, accurate result copy, no focus or input loss, laptop
readability, long-value fit, unchanged neighboring UI, cancellation and save
migration. Actual human enjoyment and device certification remain separate work.

See docs/QA_REPORT.md for measured/executed evidence, not assumed outcomes.
