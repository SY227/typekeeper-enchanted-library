# Typekeeper 3.1 — implemented rules
Ruleset `typekeeper-3.1.0`. These are authored rules for this adaptation, not recovered
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
Maximum three stored books of each type. Collection is logically immediate; the book
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

For chapters 1–48: Classic speed = 28 + 1.28 × (chapter−1); ordinary interval =
2.35 − 0.018 × (chapter−1). Relaxed multiplies speed by 0.68 and interval by 1.60.
Maniac multiplies speed by 1.22 and interval by 0.78. Falling distance is 476 pixels.
After a full-board manual clear, ordinary empty-field wait is capped at 0.65 seconds.
Existing cards never accelerate in response to typing skill. Trial rests are not shortened.

Endless speed rises from the chapter-48 base by 1.05 per subsequent chapter, capped
at 145 before pace scaling. Base interval decreases by 0.009 per Endless chapter,
with a 0.85-second floor. Quotas cap at 42. Up to twelve cards can be active.

Placement uses free horizontal spans with a 10-pixel margin and a 76-pixel spawn-neighbor
vertical band. A blocked card's chosen word/power is kept for a retry, not rerolled.
No more live cards spawn than the remaining quota. Recent words are de-prioritized;
authored live duplicate text is excluded.

Short/medium/long probabilities interpolate between chapter knots:
1: 100/0/0; 4: 100/0/0; 12: 55/45/0; 24: 20/70/10;
36: 10/65/25; 48: 8/60/32 percent. Word length cap = min(16, 5 + floor((chapter−1)/3)).
The same 746-word vocabulary is retained.

Chapter one's third, sixth, ninth and eleventh cards introduce FIRE, ICE, SLOW and WIND.
Later chapters first schedule a special at the third card, then after gaps of 4–6
successfully spawned cards. A shuffled bag covers all four powers before refill.
The bag prefers a not-full shelf among its remaining entries, without changing drops
in response to pile pressure or score. Dark chance starts at chapter 7 as
min(0.14, (chapter−6) × 0.0033), applying when a scheduled special is not chosen.

## Completion, retries and modes
Every clear grants chapter × 100 points, plus 250 for no misses/incorrect submissions.
Three stars require zero misses/incorrect submissions. Two allow at most two misses
and three incorrect submissions. Other successful clears receive one star.

Campaign starts at one without books. Chapter starts/clears produce boundary checkpoints;
mid-chapter positions are deliberately not serialized. Each chapter uses a hash of the
campaign seed and chapter number for its random stream. Checkpoints keep the reward bag,
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
Schema 3; current storage key `typekeeper-enchanted-library-v3.1`. v3/v2/v1 keys are
read-only migration sources. Old scores are Legacy, not current competitive totals.
An old checkpoint runs the new mechanics, but its carried old-rule score remains Legacy.
Mastery stars/unlocks and preferences are preserved. No online service or cross-origin
sync is implied. Corrupt storage is quarantined before fallback; failed storage writes
remain visible. Export/import is the backup route.

At most 100 current and 100 legacy records are kept; each view shows its top ten.
Pace, mode, period and (for practice) chapter filters remain separate. Ties prefer fewer
recorded retries, then recent date. Today means local midnight; Last 7 days is rolling.
The local records/save files remain editable, not anti-cheat-secured Steam rankings.
