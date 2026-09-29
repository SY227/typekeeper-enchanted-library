# Typekeeper: Enchanted Library — v3.6.0
## Impact Pass

A complete, editable upgrade of the accepted **v3.5.2 — Score Chase** game.
Typewriter taps and carriage return, stronger matching-prefix ink and target
brackets, contact-synchronized missed paper, and compact word-origin releases now
form one readable feedback chain. Score Chase, the cleaned-up HUD, 48 chapters,
all input/scoring rules and every original illustration/music asset remain.
This is the full game, not a patch.

## What changed

- Changed letters actuate alternating hands, keytops and a short mechanical strike.
  Return and Backspace have distinct bounded responses; they never delay input.
- Matching text gains dark green ink. Only the word Enter would save gets strong corner brackets. A complete word takes
  priority over a lower longer prefix, with a small ready check, not auto-save.
- A missed scroll folds down onto the desk stack. The existing penalty/meter is
  immediate; visual growth and one quiet landing thump resolve at contact.
- Upper paper leaves can grow left above the input, never into the real text field,
  SLOW button or PAPER PILE/WIND labels. WIND cancels incoming debris immediately.
- Accepted words keep their actual last-rendered position, angle and scale. Ordinary
  paper releases in 250ms; small points emerge locally and never cover another word.
- FIRE retains its source-book/target connection and char seam, with shorter,
  less repetitive flame curls. ICE and its lettering protection are untouched.

Reduced Motion cancels moving feedback without removing the static targeting or
pressure information. No screen shake, new room, spell, account, score multiplier,
extra HUD, auto-submission, or new runtime dependency has been added.

## Play

Extract the entire ZIP. Open **PLAY.html** for the self-contained offline edition:
code, illustrations, music and sounds are embedded. No account, API key, package
installation or network connection is needed to play.

For the locally served edition on Mac:

```bash
cd "$HOME/Downloads"
unzip -o "Typekeeper_Enchanted_Library_v3.6.0_Full_App.zip"
cd "Typekeeper_Enchanted_Library_v3_6_0"
bash START_MAC.command
```

The browser title and launcher should show **v3.6.0**. Windows and Linux launchers
are also included. The server launcher requires Python 3 or Node 20+, verifies the
prebuilt payload and uses port 4355 or the next free port. It does not kill an old
server. Do not double-click the modular index.html; use its server or a static host.

**Protect your save:** use **Records → Export save** before changing versions,
URLs, ports, protocols, browsers or local-file locations. Stop the old local server
with Control+C to reuse its address. Import the exported save when needed. The
save key and ruleset remain unchanged; the existing validated best-score
collection is preserved. When persistence is unavailable the app says so, and export still works.

## What Score Chase does

The existing score territory contains only three levels of information:

    SCORE
    1,240
    ◇ BEST 1,580

- **FIRST RUN:** no proven comparable recorded score yet. It does not display a
  fake BEST 0 or celebrate every point as a record.
- **BEST 1,580:** the reference is fixed for the current attempt. At 90% it receives
  a restrained emphasis, without another progress bar or a negative delta.
- **NEW BEST +30:** the exact running score remains the largest number. The delta
  is measured against the original 1,580, not against an ever-moving saved value.
  Tying a record does not count as exceeding it.

A real crossing during live play gets one small etched-light sweep and a short,
quiet two-note cue. Normal scoring has a 130ms sub-pixel lift, not rolling or
inaccurate score digits. Reduced Motion removes movement; sound/mute settings and
page-background cancellation are respected. Focus stays on typing. A record
crossed only by a chapter-completion bonus updates the text without competing
with the existing chapter/wing/finale presentation.

**The big SCORE is still the cumulative running score.** It has not been silently
changed into a chapter-only subtotal:

| Mode | Valid comparison | Target locks |
|---|---|---|
| Campaign | Running total reached at the same chapter, starting at the same chapter, same pace/ruleset | When entering that chapter |
| Practice | Same chapter, practice mode, pace and ruleset | At the start of the attempt |
| Endless | Same continuous Endless mode/start, pace and ruleset | At the start of the run, not each wave |

Saved chapter subtotals from different runs are **never added together**. Existing
practice records and complete single-run history are used when their provenance
proves the comparison. Otherwise the first newly recorded attempt establishes the
reference. This is why an old late-campaign save may initially show FIRST RUN even
though it has stars or an unrelated best score. FIRST RUN means first comparable
score, not necessarily the player's first time seeing the chapter.

Retry, Continue, next chapter, export/import, existing records and game-over text
use the same comparison rules. Changing the preferred pace in Settings during a
run does not change that run's active target. Clear local scores removes score
records and both PB collections, but keeps unlocked chapters, stars and settings.

## Preserved game and controls

Type a falling word, then press **Enter**. **1 / 2 / 3 / 4** cast FIRE / ICE / SLOW /
WIND. **Escape** pauses. FIRE earns no score, books or quota progress; ICE freezes
for six seconds; SLOW lasts eight seconds and queues behind ICE; WIND clears the
paper pile, not the word field. How to play includes the complete rules.

There is no change to difficulty, vocabulary, spawn timing, quotas, the 48-chapter
campaign, score multipliers, stars, spell economy, zero-stock opening, the sixth
card's ICE opportunity, randomized New Game / Retry, or save progression. No new
leaderboard, login, backend, extra HUD panel, currency or multiplayer was added.

## Source, build and deployment

```bash
npm ci
npm test
npm run check
npm run build
```

There are no runtime npm dependencies. `dist/` is ready for static hosting. Existing
Vercel / Netlify configuration and backup-first update helpers are retained. This
handoff has **not** changed or deployed your live project. The update helpers
preserve Git/Vercel bindings and environment files; review them before applying.

`src/render/impact.js` owns pure mechanical/target/stack contracts; the renderer
consumes them without changing gameplay. `docs/IMPACT_SPEC.md` explains the
implementation and acceptance tests. `src/game/score-chase.js` contains the pure scope/snapshot logic. `storage.js`
validates and stores comparable records; `main.js` owns the presentation event;
`styles.css` styles the existing score area. `docs/SCORE_CHASE_SPEC.md` records the
contracts and design choices. All original editable art and audio masters remain.
No third-party font files or runtime services have been added.

## QA and limitations

**docs/QA_REPORT.md** and **qa360/** describe tests actually executed on this build,
including original failed iterations, exact hashes and remaining external checks.
Earlier `qa350/`, `qa351/`, `qa352/` and `docs/archive/` results are historical, not new passes.
Any compressed QA screenshot previews have an explicit original-path index.

The automated browser harnesses require Python Playwright and Chromium; these are
only development requirements. Small/portrait viewport checks establish fitting,
not phone/touch playability. Comfortable play needs a keyboard and sufficient
screen space. Real Mac/Windows browsers, human enjoyment, subjective extended
listening and live hosting must not be inferred from Linux/Chromium automation.
This is not independent AAA certification or platform approval.
