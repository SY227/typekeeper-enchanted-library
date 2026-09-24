# v3.2.1 resource and pacing specification

## Design intent
Readable typing is the first defense. Books provide occasional, powerful decisions.
Supply is reduced, not secretly adjusted to keep every player at a chosen inventory level.
This is an authored interpretation of the requested feel, not an original Typing Maniac
constant extracted from footage. The supplied v3.2 code is the implementation baseline.

## Starting state and limits
Campaign already began with zero stored charges in v3.2; this behavior is preserved.
Its forced third/sixth/ninth/eleventh-card set is removed. Card six now offers ICE once.
An opportunity grants nothing until its word is submitted successfully. Missing it does
not restart onboarding or guarantee another immediate reward.

Capacity is two per type. Overflow still awards the word's ordinary points/progress,
without a third charge or hidden reserve. FIRE and WIND keep their full effects. ICE
still lasts six seconds; SLOW still lasts eight unfrozen seconds at 42% fall speed.
No global cooldown, mana meter, spell crafting or monetization is introduced.

Practice and Endless keep one of each type at the start, in their separate record modes.
An empty campaign cannot accidentally inherit those starter kits.

## Opportunity schedule

| Chapter where the next gap is drawn | Ordinary gap in successful arrivals |
|---|---:|
| 1–6 | 8–11 |
| 7–12 | 8–10 |
| 13–24 | 7–10 |
| 25 onward | 6–9 |

These numbers include the next spell card; they are not a number of ordinary cards plus
an extra spell. The first campaign exception is card six. Gap choice is seeded. A gap
carries across normal chapter transitions even when the next band has a different range.
Do not reset the countdown at every chapter: that recreated the original supply excess.

Every sixth chapter uses trial scheduling, including Endless. On entry it brings the
already scheduled next spell within the first four cards (or leaves it sooner if due).
After that the trial gap is eight arrivals. It is a replacement schedule, never a free
or additive book. The five-card wave pattern and its rest duration are unchanged.

Types come from a seeded four-item bag. Only remaining entries are eligible; the first
campaign spell prefers ICE, trial opportunity one prefers ICE and two prefers WIND,
when that type is still due and its shelf is not full. Otherwise the normal not-full
preference applies. Every complete four-opportunity cycle contains all four types.
This bounds type droughts without asserting that all player deaths are preventable.

## Atomic spawn commitment
A new candidate reserves text/type/width and a prospective power bag. Spatial blocking
keeps that exact candidate for retry, but does not consume a bag entry or advance the
counter. Actual entry commits one step exactly once. A pending card discarded at chapter
clear leaves its bag entry available. Existing cards, collection animations and audio
callbacks never own the schedule.

ICE freezes the arrival clock; SLOW scales its advance. No arrivals means no progress
toward another opportunity. FIRE consumes a charge and removes cards; it neither awards
those cards' resources nor redraws the scheduled next one. No bonus stock is generated
by pause, retry, a full shelf, repeated Enter or chapter transitions.

## Pacing
The previous v3.2 arrival intervals, quotas, vocabulary mixture, miss penalties, star
thresholds, trial wave/rest multipliers and three difficulty multipliers are untouched.
Only the base fall-speed knots change:

| Chapter | v3.2 Classic speed | v3.2.1 Classic speed | Difference |
|---|---:|---:|---:|
| 1 | 36 | 30.60 | −15% |
| 3 | 45 | 40.50 | −10% |
| 6 | 58 | 55.10 | −5% |
| 12 | 76 | 76.00 | Same |
| 24 | 99 | 99.00 | Same |
| 36 | 116 | 118.32 | +2% |
| 48 | 132 | 135.96 | +3% |

Values are logical pixels/second, interpolated between knots. Relaxed and Maniac keep
their 0.68× and 1.22× speed factors. Endless continues from the new final knot with
+0.65 per chapter and the existing 170 base-speed cap. There is no mid-flight or
performance-dependent acceleration. Scarcer resources make the later campaign less
forgiving despite a gentler opening; simulated losses are retained in the audit.

## Checkpoints and migration
`economy` contains `{version:1, untilNext, opportunities, tutorialDone}`. A boundary
checkpoint carries this alongside the remaining bag. Restoring a trial applies the
same idempotent first-wave rule as uninterrupted progression. Retry reproduces the
same new-ruleset opening instead of accumulating score/books from failed attempts.

Current checkpoints reject missing/invalid schedules and inventory above two. Earlier
checkpoints allow the previously legal third charge, then normalize to two, retaining
the original bytes in the read-only old storage key. They receive a conservative new
schedule once; they cannot reconstruct a schedule that v3.2 did not store. Their
scoring provenance remains Legacy. The new key does not overwrite v3.2.

## Preserved player feedback
The existing stock layout now shows two pips, sourced from the same capacity constant
as the simulation. Help text says two. Stock acquisition glow is canceled when a shelf
becomes empty or a new run begins, so an empty shelf cannot falsely appear collectible
or ready due to an old animation. Actual active-spell/ready indicators remain intact.
All music layers, typography, artwork, character expressions and sound generation are
byte-identical to v3.2. No permanent instructions or prototype labels have been added.

## Validation interpretation
The schedule audit runs 100 no-cast, instant-input campaigns to isolate supply. Its
4,800 chapters are not timed human sessions. Finite-speed campaign agents and the
432 isolated chapters use separately declared typing/acquisition/error assumptions.
Additional WIND-threshold comparisons expose strategy sensitivity without recommending
one threshold as universally optimal. Headless browser checks validate actual DOM,
keyboard, inventory and migration paths, not human enjoyment or real-device performance.
