# Typekeeper: Enchanted Library — v3.5.1
## Breathing Room

A complete, editable upgrade of the supplied **v3.5.0 full app**. This release
separates the paper-pile instrument from WIND, gives every book a coherent status /
key / cover / caption hierarchy, and checks the rest of the interface for spacing,
readability and actual keyboard/pointer usability. It is not a patch.

## Play

Extract the entire archive. The simplest offline option is **PLAY.html**: all code,
illustrations and sound are embedded. No account, API key, network connection or
package installation is required to play.

On Mac, for the normal locally served edition:

```bash
cd "$HOME/Downloads"
unzip -o "Typekeeper_Enchanted_Library_v3.5.1_Full_App.zip"
cd "Typekeeper_Enchanted_Library_v3_5_1"
bash START_MAC.command
```

The launcher and browser title must identify **v3.5.1**. Windows and Linux launchers
are included. The launcher needs Python 3 or Node 20+, checks the delivered build,
and uses port 4355 or the next free port. It does not kill an existing server.
Do not double-click the modular `index.html`; use its server or a static web host.

**Keep your save:** stop the previous server with Control+C to reuse the same
address. A different port, protocol, browser or local-file URL can mean a different
storage origin. Use **Records → Export save** before updating, then Import save
where needed. The existing save key, ruleset, scores and migration code are
unchanged. If the browser forbids storage, the game says so and offers export;
it does not silently promise persistence.

## Changes you can see

- **Separate instrument and book zones.** PAPER PILE stays on one line. Its bottle,
  percentage and caption form one unit, well above the book headers. RESCUE replaces
  the ordinary WIND status only when WIND is actually usable; no second overlapping
  instruction is drawn.
- **Book controls are organized, not squeezed.** A full-width readiness label sits
  at the top of each cover, below the last live word's path. Brass number tabs,
  duration, stock, spell name and short command have separate positions. Covers,
  cast origins and the typing paper retain their original centers.
- **Help uses the clear center desk.** Hover/focus descriptions no longer cover
  words, WIND or the meter. Keyboard focus wins over a parked mouse. The first
  earned ICE hint uses the same area; an important notification postpones its
  visible teaching window instead of consuming it behind another message.
- **The top HUD is readable.** Chapter context and quota copy are larger. Trial
  status moves above incoming scrolls. Long scores fit their own column instead
  of running into the chapter ribbon. Main typing cards remain unchanged.
- **Dialogs keep their content and controls.** Larger useful targets, deliberate
  row spacing, a full-width practice-chapter filter and readable secondary text.
  Filter/tab changes retain focus. Help's disclosure participates in keyboard
  navigation. Save notices appear in the dialog flow instead of covering actions.
  Parchment corner decorations no longer create a horizontal scroll range.
- **All v3.5 features remain.** Honest star explanations; correctly scoped PBs;
  combo milestones at 8/16/.../64; first Enter guidance; eight wing identities;
  object-bound FIRE; ICE lettering protection; skippable, reduced-motion-aware
  campaign ending; and original adaptive music.

Nothing in this release changes the authored difficulty, spawn timing, quotas,
score curves, star thresholds, vocabulary, 48 chapters, two-book capacity,
zero-stock start, sixth-card ICE opportunity or randomized New Game / Retry.
There is no login, new currency, leaderboard or multiplayer dependency.

## Controls

Type a falling word, then **Enter**. **1 / 2 / 3 / 4** use FIRE / ICE / SLOW / WIND;
clicking a book or its caption uses the same protected action. **Escape** pauses.
FIRE earns no points, books or quota progress. ICE freezes words for six seconds;
SLOW lasts eight seconds and waits while ICE is active. WIND empties the paper
pile but leaves falling words alone. How to play contains the full rules.

## Source, build and deployment

```bash
npm ci
npm test
npm run check
npm run build
```

There are no runtime npm dependencies. The prebuilt `dist/` folder can be hosted
as a static app. Existing Vercel and Netlify configuration is retained. This
package has not been pushed to, or tested on, your live deployment.

`UPDATE_EXISTING_MAC.command` and `scripts/apply-update.sh` provide the existing
backup-first update path. They preserve Git/Vercel bindings and environment files;
read the script and back up your save before using it on your project.

## QA and limitations

See **docs/QA_REPORT.md** for executed checks, exact shipping hashes, initial
failures and remaining external verification. **qa351/** contains current results;
**docs/archive/** and **qa350/** are historical, not fresh test evidence.
The browser harnesses require Python Playwright and a Chromium executable; this
is a development requirement only, not a requirement to play.

The tests include actual rendered geometry, key/pointer handlers, all-chapter
boundaries, model campaigns, save import/export, release payloads and fresh ZIP
reproduction. A small portrait / short-window layout check proves safe fitting,
not a touch-screen typing-game experience. Comfortable play still needs a physical
keyboard and adequate display size. Dialogs scroll in shorter windows rather
than shrinking everything to unreadable text.

Linux/Chromium automation is not human playtesting, macOS/Windows/Safari testing,
Steam approval or independent AAA certification. The human/device test plan is
included in docs/HUMAN_DEVICE_QA.md. All editable art and audio source material is
retained; no new third-party fonts, accounts or services were added.
