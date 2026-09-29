# Typekeeper: Enchanted Library — v3.5.2
## Score Chase

A complete, editable upgrade of the accepted **v3.5.1 — Breathing Room** game.
The upper-left SCORE panel now shows the exact running score above a frozen,
correctly scoped personal best. Existing gameplay, chapter art, audio assets,
book positions, PAPER PILE / WIND clearance and the rest of the interface remain.
This is the full game, not a patch.

## Play

Extract the entire ZIP. Open **PLAY.html** for the self-contained offline edition:
code, illustrations, music and sounds are embedded. No account, API key, package
installation or network connection is needed to play.

For the locally served edition on Mac:

```bash
cd "$HOME/Downloads"
unzip -o "Typekeeper_Enchanted_Library_v3.5.2_Full_App.zip"
cd "Typekeeper_Enchanted_Library_v3_5_2"
bash START_MAC.command
```

The browser title and launcher should show **v3.5.2**. Windows and Linux launchers
are also included. The server launcher requires Python 3 or Node 20+, verifies the
prebuilt payload and uses port 4355 or the next free port. It does not kill an old
server. Do not double-click the modular index.html; use its server or a static host.

**Protect your save:** use **Records → Export save** before changing versions,
URLs, ports, protocols, browsers or local-file locations. Stop the old local server
with Control+C to reuse its address. Import the exported save when needed. The
save key and ruleset remain unchanged; this version adds a validated best-score
collection. When persistence is unavailable the app says so, and export still works.

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

`src/game/score-chase.js` contains the pure scope/snapshot logic. `storage.js`
validates and stores comparable records; `main.js` owns the presentation event;
`styles.css` styles the existing score area. `docs/SCORE_CHASE_SPEC.md` records the
contracts and design choices. All original editable art and audio masters remain.
No third-party font files or runtime services have been added.

## QA and limitations

**docs/QA_REPORT.md** and **qa352/** describe tests actually executed on this build,
including original failed iterations, exact hashes and remaining external checks.
Earlier `qa350/`, `qa351/` and `docs/archive/` results are historical, not new passes.
Any compressed QA screenshot previews have an explicit original-path index.

The automated browser harnesses require Python Playwright and Chromium; these are
only development requirements. Small/portrait viewport checks establish fitting,
not phone/touch playability. Comfortable play needs a keyboard and sufficient
screen space. Real Mac/Windows browsers, human enjoyment, subjective extended
listening and live hosting must not be inferred from Linux/Chromium automation.
This is not independent AAA certification or platform approval.
