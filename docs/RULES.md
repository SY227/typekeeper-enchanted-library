> **v3.3.2 superseding note:** all letters of one word now stay on one row.
> Any older wrapping description below is historical. New game and Retry use fresh
> vocabulary; Continue preserves the current saved attempt. App metadata is 3.3.2;
> balance constants remain the v3.2.1 ruleset. See RELEASE_NOTES.md and QA_REPORT.md
> for current behavior and newly executed evidence.

# Typekeeper 3.2.1 — implemented rules
Ruleset `typekeeper-3.2.1`. These are authored rules for this adaptation, not recovered
constants from an inaccessible historical gameplay video.

## Input
English A–Z, uppercase normalization, 24-character input limit. Native selection/caret
editing is preserved. Enter submits once; held Enter does not repeat. An exact live
match resolves the lowest matching card, before considering FIRE/ICE/SLOW/WIND as
commands. Number keys/numpad 1–4 cast directly without changing input or selection.
Browser shortcuts and IME composition are excluded. Space does not submit; gameplay
paste is disabled. Typing after focus moves to a game utility returns to the word.

For 0.35 active simulation seconds after a card lands or is burned, one exact submission
of that removed card is acknowledged without an additional typo penalty. Its original
miss, danger and loss of streak remain. No points/progress are granted or refunded.
A live exact word still takes priority. This protection cannot revive a game-over state.

## Scoring and pressure
Manual card score = round(length × 10 × multiplier × darkFactor).
Multiplier = min(3, 1 + floor(currentStreak/8) × 0.25), including the current success.
Dark factor is 2 for bonus cards, otherwise 1. Wrong submitted words add 2 percentage
points of pile and reset the streak. Landing adds 8 + 0.8 × word length; dark-card
landing multiplies this by 1.5. The pile is capped at 100, which ends the attempt.
FIRE neither scores nor advances a chapter nor harvests burned books.

Accuracy means correct submitted words / (correct + wrong submissions); misses are
separate. WPM means correct characters / 5 / active minutes. Stage results use
stage-local counters. Neither is a standardized typing-test certification.

## Spells
Maximum two stored books of each type. Collection is logically immediate; the book
flight is feedback only. Inventory overflow still permits the ordinary completion score.

| Key | Spell | Implemented effect |
|---|---|---|
| 1 | FIRE | Clear all active cards without score/progress/harvest; next spawn waits at least 0.70 simulation seconds. |
| 2 | ICE | Stop falling cards and the spawn clock for 6 simulation seconds; typing continues. |
| 3 | SLOW | 8 unfrozen simulation seconds at 42% falling speed and 70% spawn-clock rate. Its timer waits behind ICE. |
| 4 | WIND | Clear pile pressure and drawn paper; it does not remove falling cards. |

Cooldown is 0.22 seconds per power. Recasting active/queued ICE or SLOW, FIRE on an
empty field, WIND on an empty pile, or an empty inventory does not consume stock.
READY requires an actionable cast while playing, not merely a stocked shelf. STORED,
ACTIVE, QUEUED and COLLECT describe the other states. Pausing freezes all rule timers.
At chapter completion, active effects expire but unused books and pile carry forward.

## Spawn and difficulty
The authored course has 48 chapters, with a trial every sixth chapter. Quota is
min(42, 12 + floor((chapter−1)/2) + (trial ? 4 : 0)). Trial intervals follow four
0.83× intervals then a 1.8× rest; the rest is visible as BREATHE. There is no random
interval jitter in this ruleset.

For chapters 1–48, interpolate these Classic [chapter, speed, ordinary interval]
knots: [1,30.6,1.90], [3,40.5,1.70], [6,55.1,1.50], [12,76,1.30], [24,99,1.12],
[36,118.32,1.02], [48,135.96,0.96]. Speed is logical pixels/second; interval is active
simulation seconds. Relaxed multiplies speed by 0.68 and interval by 1.60.
Maniac multiplies speed by 1.22 and interval by 0.78. Falling distance is 476 pixels.
After a full-board manual clear, ordinary empty-field wait is capped at 0.65 seconds.
Existing cards never accelerate in response to skill or pile percentage. Trial rests
are not shortened. Chapter start/finish is the only place the ordinary base changes.

Endless speed rises from 135.96 by 0.65 per subsequent chapter, capped at 170 before
pace scaling. Base interval decreases by 0.003 per chapter, with a 0.78-second floor.
The change from chapter 48 to 49 is continuous. Quotas cap at 42. At most twelve cards
can be active.

Placement uses free horizontal spans with a 10-pixel margin and a 76-pixel spawn-neighbor
vertical band. A blocked card's chosen word/power is kept for a retry, not rerolled.
No more live cards spawn than the remaining quota. Recent words are de-prioritized;
authored live duplicate text is excluded.

Short/medium/long probabilities interpolate between chapter knots:
1: 100/0/0; 3: 85/15/0; 6: 60/40/0; 12: 31/63/6; 24: 10/66/24;
36: 6/60/34; 48: 5/52/43 percent. Word length cap = min(16, 5 + floor(chapter/2)).
The same 746-word vocabulary is retained.

Chapter one's sixth card is one earned ICE opportunity; there is no four-spell giveaway.
Ordinary spell gaps (counting successful arrivals, including the next spell) are 8–11
in chapters 1–6, 8–10 in 7–12, 7–10 in 13–24, and 6–9 from 25 onward. Previously drawn
gaps carry into ordinary next chapters. Pausing, empty-field waiting and failed spawn
placement do not advance this counter. No automatic inventory refill occurs at a boundary.

For every sixth chapter, including Endless trials, the remaining wait is shortened to
at most four arrivals. Subsequent trial opportunities are eight arrivals apart. This
replaces the ordinary schedule; it is not an additional stream. A sooner due drop is
not postponed. Typing is required; missed/burned spell cards grant no replacement book.

A shuffled bag covers all four powers before refill, preferring a not-full shelf among
remaining entries. The campaign introduction prefers ICE; the first two trial opportunities
prefer ICE and WIND respectively, only when the preferred type is still in the current
bag and not full. Preferences never skip an outstanding type or grant extra charges.
Stock and timing never depend on danger, score or measured typing skill.

A blocked candidate retains its word, type and prospective bag, without committing the
bag/countdown. Actual entry commits it once. If canceled at chapter clear, the reserved
reward is not consumed. Dark chance remains min(0.14, (chapter−6) × 0.0033) from chapter
7, on cards not designated as spells. See ECONOMY.md for migration and boundary cases.

## Completion, retries and modes
Every clear grants chapter × 100 points, plus 250 for no misses/incorrect submissions.
Three stars require zero misses/incorrect submissions. Two allow at most two misses
and three incorrect submissions. Other successful clears receive one star.

Campaign starts at one without books. Chapter starts/clears produce boundary checkpoints;
mid-chapter positions are deliberately not serialized. Each chapter uses a hash of the
campaign seed and chapter number for its random stream. Checkpoints keep the reward bag and the persistent economy countdown,
next card ID, score, resources, pressure, drawn pile and accumulated statistics.
Continue/retry reproduces a new-ruleset chapter's opening exactly rather than rerolling it.
Death retains the opening bookmark, increments its retry count and records that failed
attempt. Retry rolls back failed-attempt gains; it does not farm score. Starting a new
campaign is explicit and requires confirmation when replacing an existing bookmark.

Practice starts at an unlocked chapter with one book of each type. It saves a one-chapter
result and can improve mastery without advancing campaign unlocks. Chapter comparisons
are separate. Campaign 48 is terminal, saves one victory and unlocks Endless. Endless
starts an independent run at 49 with one book of each type. Death or voluntary retirement
records it once; retirement does not claim victory.

## Saves and records
Schema 3; current storage key `typekeeper-enchanted-library-v3.2.1`. v3.2/v3.1/v3/v2/v1 keys are
read-only migration sources. Old scores are Legacy, not current competitive totals.
An old checkpoint runs the new mechanics, but its carried old-rule score remains Legacy.
Old stock of three is capped at two. A missing old reward schedule is initialized once
to the stage minimum ordinary gap (at most four for a trial), with the tutorial marked
complete. Current-version checkpoints must carry a valid schedule and legal two-charge stock.
Mastery stars/unlocks and preferences are preserved. No online service or cross-origin
sync is implied. Corrupt storage is quarantined before fallback; failed storage writes
remain visible. Export/import is the backup route.

At most 100 current and 100 legacy records are kept; each view shows its top ten.
Pace, mode, period and (for practice) chapter filters remain separate. Ties prefer fewer
recorded retries, then recent date. Today means local midnight; Last 7 days is rolling.
The local records/save files remain editable, not anti-cheat-secured Steam rankings.


## Preserved v3.2 vocabulary and presentation
The same 746 dictionary entries are used. Medium/long mixture knots are:
[1,0,0], [3,0.15,0], [6,0.40,0], [12,0.63,0.06], [24,0.66,0.24],
[36,0.60,0.34], [48,0.52,0.43]. Short weight is the remainder. The maximum
length is min(16, 5 + floor(chapter/2)); an empty filtered bank falls back to a
shorter bank. Introductory INK/TALE/BOOK/PAGE behavior remains.

Music pressure is separate from simulation. With smoothstep s(d,a,b), the new
tension scalar is s(pile,20,90) and urgency is s(pile,65,100), during play/trials
only. Targets: hearth=1−0.24t−0.06u; motion=min(1,sceneMotion+0.12t);
pressure=0.84t; urgency=0.76u. No pitch/tempo change, damage, or score effect is
caused by these gains. Lowering danger uses a faster 0.27-second exponential time
constant; ordinary rises use 0.55 seconds. Turning adaptive music off removes
only the new two layers and their balancing changes.

Input effects never submit or score. Enter remains mandatory. A result tally runs
for 1.05 seconds on chapter completion (0.90 seconds after defeat), is skippable,
and never delays Next/retry. Scores and medals are committed before the first
animation frame. Switching screens cancels tally sound nodes. Reduced motion
shows the final value immediately. Particle, glint, texture and sound pools are bounded.
