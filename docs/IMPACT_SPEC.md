# v3.6.0 — Impact Pass: production contract

Direct source: the user's accepted v3.5.2 full ZIP. This is a feedback/presentation
upgrade, not a new simulation, physics engine, meta-game or redesign. Product and
visual judgments in this document are internal design decisions, not comments by
actual named studios or IGN employees.

## Critique disposition

The supplied critique described v3.4.0. We did not revert to that version. Running
score visibility, frozen/scoped BEST, star explanations, contextual Enter/ICE,
wing/finale moments, and the PAPER PILE/WIND spacing are already present in v3.5.2
and are retained. The next investment is how immediate actions read in motion.

## Mechanical input

`MachineResponse` keeps key/erase/return clocks, alternating hand and carriage
position, independently of the model. A changed non-erasing input has a 95ms
response. Backspace uses 105ms. Submission returns the existing offset in 160ms;
a new character immediately interrupts it. No keyboard event waits for animation.
The surrounding roller, lever, keytops and short strike move. The real native
input remains at its existing position with its caret, selection and hit area.
The maximum logical rail travel is 15.84px for the 24-character buffer. No camera
shake, page shake or movement of the chapter/score panels.

## Ink and targeting

Full exact-word matches take priority, matching the existing Enter rule; within exact matches or incomplete prefixes, the original y/id order stays authoritative. All matching prefixes receive ink;
only the selected candidate has four strong corner brackets. Completing the word
adds a small paper-edge check. The state persists until Enter, edit or loss of the
actual target. There is no new target-lock mechanic, no target arrow and no auto-fire.
Every glyph remains one complete string on one baseline. Brackets live within the
paper edge, outside lettering; color is supplemented by shape. Existing high
contrast and reduced-motion modes retain static feedback. An already typed target
is not carried away by its optional shelf-arrival transform.

## Missed paper and pressure

Logical danger is still immediate and exact. A missed scroll flies from its last
painted pose to the desk pocket over 300ms. Its rendering flattens to the real top
sheet width; pending paper is not misrepresented as a newly saved word. On contact,
the stack compresses briefly (240ms response), records the actual missed text, and
emits one presentation-only landing cue. The first failure sound is immediate;
the lower thump is tied to actual contact, not a timer unrelated to the animation.
Multiple near-simultaneous contacts are sound-throttled, never outcome-throttled.

The stack is a symbolic visual of total danger, not one paper per percentage point.
Wrong submission keeps the original 2% cost; it does not invent a named missed word.
At most 31 visible layers are drawn. Right edge is held at logical x857; lower
sheets remain narrow to protect the input ending at x789. Only sheets whose bottom
lies above the input may extend left. A final clip protects input/SLOW controls.
Maximum top is below the live-card lane. The instrument and all book hit areas stay
in their accepted v3.5.1/3.5.2 locations.

WIND zeroes the model immediately and cancels pending paper, its queued sound and
stack compression. Pausing freezes render clocks; a new game clears them. Reduced
Motion shows the pressure without flying paper or mechanical compression. No fake
physics changes the miss cost, floor line, word speed or recovery power.

## Saved words and local reward

Accepted words are removed/awarded immediately by the unchanged model. Their
presentation copies the last painted x/y/scale/angle so fast input during arrival
does not snap the release back to a different location. Ordinary paper releases
in 250ms: initial ink/center seam, then short paper fragments. After the first brief
phase fragments no longer display a second readable target. Element pickup trails
still reach the correct existing book. FIRE retains zero score and progress.

Existing small `+points` labels now have a 440ms lifetime, capped to six concurrent
labels. They originate at the cleared word and are suppressed if they would cover
live text. The HUD score is exact immediately, never delayed until a label arrives.
Score Chase, its frozen target, tie handling and rare personal-best effect are not
reimplemented here. No new RPG damage numbers or score dashboard are added.

## World integration and VFX

Shelf origin flashes gain a short contact shadow and paper/spine lines, confined
to the existing side-shelf positions. FIRE keeps the v3.5.0 object-origin filaments
and char seam; repeating flame curls are shorter and quieter. The ICE room/card
frost geometry, six-second freeze and queued SLOW behavior remain unchanged.
Live words draw after scene/transient effects. Blank central reading space is
preserved rather than filled with furniture or particle noise.

## Acceptance gates

Automated: actual keyboard/Backspace/Enter, shared prefixes, exact-ready waiting,
new input during return, true source pose, miss/contact timing, WIND cancellation,
wrong/late distinction, paused/reduced/muted states, twelve-card pressure, all six
materials, complete word bounds, bounded debris, six desktop pressure layouts,
existing Score Chase/UI/migration/rules/48-chapter regressions and fresh ZIP rebuild.

Pending external evaluation: new-player interpretation, perceived tactile quality,
subjective prolonged audio fatigue, actual Mac/Windows/Safari/GPU hardware and live
hosting. These are not made into fictional pass counts. A normal-clock automated
keyboard video is execution evidence, not a human testimonial. See QA_REPORT.md.

## Final target-consistency repair

An inherited edge case selected lower BOOKCASE while Enter saved upper BOOK.
`impactTarget` now reflects exact-match Enter precedence, with the old y/id order
inside each candidate set. `impactFeedbackEvents` normalizes display/audio metadata
without modifying the game model, including batched input/resolution and excluding
future spawns. Prefix brackets, ready sound and actual save now agree. The original
model source remains byte-identical. Tests include this exact counterexample.
