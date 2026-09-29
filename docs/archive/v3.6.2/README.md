# Typekeeper: Enchanted Library — v3.6.2
## A Fresh Journey

A complete, offline-playable game with an explicit **Start from Chapter 1**
choice for returning players. It starts a new campaign attempt, not a new save
profile. All earned chapter unlocks, mastery stars and recorded best scores stay.
The original Impact Pass, Score Chase, spell economy, 48-chapter campaign, art,
audio and controls are retained.

## Continue, begin again, or revisit a chapter

| Choice | What happens |
|---|---|
| **Continue** | Resume the saved start of the current campaign chapter, as before. |
| **Start from Chapter 1** | After confirmation, begin with a fresh score, empty spell books and no paper pressure. Only this difficulty's Continue point is replaced. |
| **Chapters** | Play any previously unlocked chapter in the existing Practice mode. Practice does not replace your campaign Continue point. |

The restart choice sits directly below Continue in the familiar main-menu panel.
The confirmation identifies the saved chapter being replaced and explicitly
states what is kept. **Keep current journey** is the safe default keyboard focus;
Escape or Close cancels without writing a save. Returning players who completed
the campaign can also start again; all 48 chapters and The Infinite Archive remain
available. Brand-new players still get one-click **Play** without an extra dialog.

Example: you have unlocked Chapter 12. Start again and Continue becomes Chapter 1.
You may still select Chapter 12 from Chapters; returning to Continue takes you
back to the new campaign. Replaying a chapter with fewer stars never downgrades
its existing best mastery. Other difficulties' Continue points are untouched.

**This is not Reset progress.** There is no new account, profile, erasure button,
new currency, gameplay mechanic, score rule or difficulty change.

## Play

Extract the **entire ZIP**. Open **PLAY.html** for the self-contained offline game.
All assets are embedded; playing that edition needs no install, account or API key.
For a locally served Mac session:

```bash
cd "$HOME/Downloads"
unzip -o "Typekeeper_Enchanted_Library_v3.6.2_Full_App.zip"
cd "Typekeeper_Enchanted_Library_v3_6_2"
bash START_MAC.command
```

Check that the browser title and launcher say **v3.6.2**. Windows and Linux launchers
are included. The server launcher needs Python 3 or Node 20+, serves the prebuilt
files and uses port 4355 or the next free port. It does not stop your previous
server. Do not open the modular index.html directly; serve it or use PLAY.html.

**Protect your save:** before changing a URL, port, browser or local-file location,
use **Records → Export save**. Stop an old server with Control+C to reuse its
address. Import the exported file when necessary. The save key and ruleset are
unchanged, but browser storage belongs to its origin; a new origin cannot magically
read the old one's progress. If saving is unavailable, the game warns you and
Records → Export save still provides a backup.

## Everything kept in the game

Type a falling word and press **Enter**; **1 / 2 / 3 / 4** cast FIRE / ICE / SLOW /
WIND. **Escape** pauses. Restart still begins with zero inventory; the sixth-card
ICE opportunity, random New Game/Retry and deterministic Continue remain.
FIRE does not award score, books or chapter progress. The existing 48 chapters,
three paces, original word bank, pressure formula, timing, spell durations,
mastery rules, character feedback, paper landings and finale are unchanged.

The current running SCORE stays cumulative. BEST remains scoped to the comparable
mode/pace/ruleset and locks for each chapter/run. Starting again retains previous
proven bests; **FIRST RUN** means no comparable score is recorded, not necessarily
that you have never played that chapter. Practice and Endless retain separate
record scopes. See docs/SCORE_CHASE_SPEC.md.

The previously requested READY/COLLECT/ACTIVE captions sit above the spell books
with a small gap, not across their cover art. Original book positions, input area,
Score Chase panel and paper meter are unchanged.

## Source and baseline

The accessible full source is the supplied **v3.6.0 Full App** ZIP. The subsequently
approved v3.6.1 above-book-caption preview was available, but no v3.6.1 full source
ZIP was available in this session. This build preserves the v3.6.0 game and
reapplies that small caption treatment before adding the fresh-journey option.
It does not claim a byte-for-byte v3.6.1 baseline. The newly supplied
Typekeeper_v3.6.0_Review_Evidence(1).zip is review evidence, not an application.

## Development

```bash
npm ci --offline
npm test
npm run check
npm run build
```

No runtime npm dependency is required. Both prebuilt editions, source, original
art/audio assets and editable masters, static-hosting configuration, launchers,
backup-first updater and tests are included. This handoff does not deploy or
modify any live Vercel site or Git repository.

`src/ui/campaign-entry.js` decides the menu choices without mutating data.
`src/main.js` handles confirmation/cancellation and replaces a validated checkpoint
in one full save write. The existing game model, storage schema and PB rules are
not redesigned. `docs/FRESH_JOURNEY_SPEC.md` maps the behavior and review criteria.

## QA and limits

**docs/QA_REPORT.md** and **qa362/** describe tests executed on this build, including
failed/superseded attempts. Older qa350/qa351/qa352/qa360 results are historical.
No count of inherited logs is presented as a new test run. Browser automation
requires Python Playwright and Chromium only for development.

The environment is Linux/headless Chromium. Native HTTP/file browser navigation
is blocked here; browser suites run the shipping offline document in memory or
shipping ES modules through Blob transport. New persistence scenarios use an
explicit, fault-injectable in-memory storage adapter and actual LocalStore code;
they do not certify localStorage on a real hosted origin. Real Mac/Windows/Safari,
human first-time-player studies and subjective audio testing remain external.
Internal production-review lenses are not actual AAA studio, IGN or Valve approval.
