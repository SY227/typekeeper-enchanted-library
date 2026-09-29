# v3.5.1 — UI spacing contracts

The layout is still a 1200 × 900 logical stage scaled into the available viewport.
The simulation field remains x226…978 and y172…648. `src/ui/layout.js` owns the
UI-only instrument, readiness/key and context-well geometry. No scrolling game
field, resized word lane, repositioned character or remapped cast origin.

## Four safe zones

1. **Pressure instrument:** x1005, y438, width156. Bottle82, compact cap21 and body91,
   separate percent32 and full-width single-line caption. The caption belongs to
   the bottle rather than to WIND. Native `role=meter` and percentage text remain.
2. **Book interaction:** covers begin at y688 and retain x90/222/865/997. Readiness
   begins y684, after a final live scroll ends at y678. Number tabs begin y723.
   Counts, remaining time, title and command occupy independent rows/regions.
   The aura is bounded to124 logical pixels; it never expands with longer labels.
3. **Context well:** x350, y812, width500, height≤76. This is below the typing paper
   and between the book groups. Only transient help appears here. Priority is
   notification → first ICE guidance → keyboard-focused book → hovered book.
4. **Upper HUD:** the chapter ribbon ends at y137 before arriving word tops at142;
   Trial copy at y99 is outside the centered chapter ribbon. Quotas stay single-line.
   A score-only font fit keeps large scores out of the adjacent chapter panel.

The image of a book is unchanged and still casts from its original point. The
number is a spine tab rather than a squeezed neighbor of COLLECT or QUEUED. A
WIND rescue state replaces the same status row; it never creates another label
between the pressure bottle and the book. Cooldowns, empty stock and paused games
cannot invite an unusable rescue.

## Typography / input targets

HUD key information targets14 CSS pixels at laptop sizes with a bounded logical
size. Modal body text targets13 CSS pixels; less important copy targets11. Main
utility buttons target36 CSS pixels, subject to a safe cap in tiny viewports.
These are internal targets, not an accessibility certification. Tiny windows keep
geometry safe rather than magnifying text indefinitely. The duplicate shortcut in
the lower command is omitted on compact stages; the brass shortcut remains.

Dialogs keep the original parchment language. Larger controls, reliable wrapping
and vertical scrolling are preferred to shrinking all text. Filters are two columns
by purpose, with practice chapters spanning the full row. The scrollable parchment
ornament stays inside its box; no invisible pseudo-element widens the scroll area.
All modal actions must be reachable by the scroller and hit-test correctly at center.

## Keyboard / announcements

Tab/Shift-Tab remain inside modal controls, including native details/summary.
Filter/tab/wing rerenders preserve the invoking control's focus. Typing and selected
letters survive pause and spell use. A parked pointer cannot overlay a keyboard
help description. Save import errors and export success are inline live messages.
A toast never floats over a dialog or ending action. First ICE teaching time does
not advance while a higher-priority notice hides the cue.

## Internal production review applied

These are our design/QA decisions, not attributed statements by a real studio or
review outlet.

| Lens | Finding | Revision / acceptance |
|---|---|---|
| UX | PAPER PILE appeared to belong to WIND; tiny gaps worsened on short screens | Group the instrument and separate all book status rows; measure actual transformed rectangles |
| Interaction | RESCUE duplicated the status and collided with the key | Replace the WIND row only when usable; test threshold, cooldown, empty stock, pause |
| Readability | Important quota copy and small controls were too subtle | Larger useful text/targets; all48 titles and long-score fixtures |
| Gameplay clarity | Low cards could cross book headers; arriving cards crossed Trial text | Place status below the last live card and Trial above the incoming corridor |
| Context | Hover/cue/help could obscure other content | A shared clear-desk well with explicit priority and visible-only tutorial time |
| UI engineering | Dialog ornaments created horizontal overflow; filters lost focus | Constrain ornaments; retain control identity; native scroll and key traversal tests |
| Art | Expanded readiness halos threatened the caption hierarchy | Fixed cover-sized aura; original assets, palette and effect origins preserved |
| QA | Large automation totals do not prove native-device usability | Record exact environment, failures and pending device/human checks; no certification claim |
