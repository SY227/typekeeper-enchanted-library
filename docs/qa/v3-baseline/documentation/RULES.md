# Typekeeper — implemented rules

Ruleset ID: `library-edition-2.0.0`. These are authored and tested implementation decisions, not recovered numerical rules from the inaccessible YouTube recordings.

## Input and target resolution

The shared input accepts A–Z and is case-normalized, with a 24-character limit. Native caret/selection editing is retained; Space is not submit. Enter submits once; auto-repeat submissions are ignored. An exact match removes the lowest matching card. When a falling word is literally FIRE/ICE/SLOW/WIND, exact-word resolution takes priority over a typed command. Quick-cast digits are unambiguous and cast directly without changing the buffer or selection. Browser modifier shortcuts and IME composition are excluded. Pasting is intentionally disabled during gameplay.

## Cards, scoring, and failure

Each ordinary manual completion awards `round(length × 10 × multiplier)`. Dark cards double that award. The multiplier is `min(3, 1 + floor(currentStreak/8) × 0.25)`, including the word just completed. A correct card increments the stage quota; burning cards does not. Wrong submitted input adds 2 percentage points of pile, clears the buffer, and breaks the streak. A landed card adds `8 + 0.8 × length` percentage points; a dark card multiplies that by 1.5. The run ends at 100%.

Accuracy is correct submitted words divided by correct plus wrong submissions; misses are tracked separately. WPM is correctly submitted characters / 5 / active minutes. Stage WPM and accuracy use stage-local counters, not the run averages. These definitions are shown honestly; they are not a standardized typing-test certification.

## Four spells

Up to three books per spell. Matching a colored falling card adds its book immediately; the flight into inventory is visual feedback, not a delayed logical grant. Spell animations do not award duplicate inventory or points.

| Spell | Key | Effect |
|---|---|---|
| FIRE | 1 | Remove all currently falling cards. No points, quota progress, or harvested books. Future scheduled cards still spawn. |
| ICE | 2 | Freeze cards and the spawn countdown for 6 simulation seconds. Typing remains available. |
| SLOW | 3 | For 8 simulation seconds, cards move at 42% speed and the spawn countdown runs at 70% speed. |
| WIND | 4 | Clear the pile/LIMIT to zero, clear drawn fallen paper, and show a short relief reaction. |

Per-power anti-doublecast cooldown: 0.22 seconds. No inventory is consumed for an active ICE/SLOW recast, FIRE with no cards, WIND with zero pile, or a missing book. ICE and SLOW can coexist; their durations both run on simulation time. Pausing freezes those durations. Stage clear removes timed effects but retains unused books and pile pressure.

READY means a book is stocked and not currently active; contextually useless casts are protected by the no-waste rules. All readiness information remains visible when glow animation is off.

## Character reactions

| Pile | Face |
|---|---|
| 0–<25% | Calm |
| 25–<50% | Focused |
| 50–<75% | Worried |
| 75–<90% | Alarmed |
| 90–<100% | Critical |
| Game over | Defeated |
| Stage clear | Celebration |

Normal crossfade is roughly 0.2 seconds; reduced motion makes state swaps immediate. A WIND rescue briefly celebrates for 1.4 seconds before returning to the current pressure face. Defeat overrides relief. New runs reset relief and transient effects. At 50% or greater, available WIND gets an explicit **PRESS 4** rescue hint. High-pressure visual effects are local and do not rapidly strobe the whole screen.

## Campaign progression

Eight wings × six chapters = 48 authored named chapters. Stages 6, 12, 18, 24, 30, 36, 42, and 48 are archive trials. A standard stage's quota is `min(42, 12 + floor((stage-1)/2))`; trial stages add four before the cap. Trials change arrival rhythm: four short intervals at 0.83×, then a breathing interval at 1.8×. All intervals also receive seeded ±6% variation.

Classic stage 1 speed is 28 logical pixels/second and stage 48 speed is 97.56. Each stage adds 1.48. Base arrival interval falls from 2.35 seconds to 0.9165 across the campaign, by 0.0305 per stage. The available falling distance is 476 logical pixels. Placement retries avoid newly arrived overlapping cards. A failed placement waits 0.22 seconds. At most 12 cards may be active; the engine does not exceed that limit to force an impossible pile.

Relaxed multiplies movement by 0.73 and base interval by 1.2. Maniac multiplies movement by 1.24 and interval by 0.84. These are separate record/progression categories, not hidden mid-run adaptive difficulty.

Early stages favor short words. The middle campaign mixes more medium words; long-word share increases later. Ordinary random colored-card chance is 19%, with additional guaranteed scheduled spell cards. Dark cards begin at stage 7, with chance `min(16%, 4.5% + stage × 0.22%)`. The first stage explicitly introduces all four spell types; after early scheduling, every sixth spawned card is a guaranteed cycling spell type.

Every clear awards `stage × 100` points, plus 250 for a perfect stage. Gold (3 stars) requires zero misses and wrong submissions; silver (2) allows up to two misses and three wrong submissions; other successful clears get bronze (1). Best earned grade/score/WPM/accuracy is retained per stage and pace.

## Bookmarks and game modes

Campaign starts at stage 1 without spells. Stage clear writes a bookmark for the **next stage**, including score, inventory, pile pressure, and cumulative statistics. Timed effects and the field are cleared. The resumed next stage starts a fresh seeded spawn sequence; this is not frame-exact mid-stage replay restoration. Death clears the current run bookmark. Starting a fresh expedition replaces it; mastery and records remain.

Practice is one unlocked stage with one book per type. It creates a separate practice result. It cannot unlock expedition stages; it can improve the grade of a stage already completed in the expedition. Practice replay stays at the same stage. The UI does not pretend practice scores are campaign scores.

Completing stage 48 writes a victory result and unlocks Endless. Endless starts a new independent run at stage 49 with one book per type. Its later movement caps at 145 Classic pixels/second and arrival interval bottoms out at 0.65 seconds. Endless replay stays in Endless. The first 48-stage campaign has a definite completion, not an endlessly relabeled level count.

## Local records

Today uses local midnight. Last 7 days is a rolling seven-day cutoff. All time has no cutoff. Each view shows up to ten results from up to 200 stored records. Pace and run type remain separate; V1 data is archived, never silently compared against v2 scores. Import validates values and merges duplicate records rather than evaluating replay code. These saves are user-editable and not authenticated competitive scores.


## V3 presentation and save additions

UI uses chapter terminology. The underlying balance remains the v2 ruleset for record compatibility. Optional resume countdown holds the model paused until it ends; Escape/focus loss cancels it. Word selection is restored on resume. Bookmarks now retain/reconstruct the visual pile as well as danger. New sound settings and Typekeeper-key migration do not change score or spell timing.
