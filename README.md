# Typekeeper: Enchanted Library — v3.6.3
## Open Atrium

A focused visual refinement of the supplied **v3.6.2 — A Fresh Journey** game.
The translucent, ruled green manuscript behind falling words is gone. The original
painted library now provides the depth: receding shelves, a curved upper gallery,
soft neutral air and restrained lantern bounce. No new gameplay mechanic or HUD.

## Play

Extract the **entire** ZIP. Open `PLAY.html` for the self-contained offline game,
or run `bash START_MAC.command` on macOS / `START_WINDOWS.bat` on Windows.
The browser title and the launcher's version must read **3.6.3**.

For development (Node 20 or later):

```sh
npm ci
npm test
npm run check
npm run build
npm start
```

`dist/` is the prebuilt static website. `PLAY.html` embeds the same application,
art and audio without external network dependencies. Build configuration for the
existing Vercel/Netlify workflows is retained. This is not a native Steam executable.

## What changed

Only the central environment treatment: remove the manuscript sheet, its border,
ruled lines, binding marks and ring; replace it with a feathered color treatment
of the original painted chamber. Actual background structure stays visible.
No rectangular replacement, extra furniture, busy particle fog or new panel.

The normal and high-contrast treatments are cached during loading, not calculated
on every key or frame. The word cards, lettering, prefix ink, spells, score panel,
book status labels, input paper and all their positions remain unchanged.
The title/menu retains its original background treatment.

## Your game and progress remain intact

The 48 chapters, difficulty, resource scarcity, manual Enter, spells, scoring,
stars, Score Chase scopes, Endless and the final homecoming are unchanged.
Returning players still have **Continue**, **Start from Chapter 1**, and
**Chapters**. Restarting the current journey does not erase unlocked chapters,
stars or personal bests.

The save key remains `typekeeper-enchanted-library-v3.2.1`.
Before changing your browser, site address, port or local-file location, use
**Records → Export save**. Import that backup from Records at the new location.
A new browser storage origin cannot automatically read the previous origin's save.

## Evidence and editable implementation

- `docs/OPEN_ATRIUM_SPEC.md`: art direction, exact scope, implementation and design review.
- `docs/QA_REPORT.md`: executed current-release checks and explicit limitations.
- `qa363/`: current logs, numeric evidence, captures and fresh-extraction results.
- `src/render/atrium.js`: editable feather/color/cache implementation.
- `tests/atrium.test.mjs` and `e2e/atrium_tests.py`: focused regression coverage.
- All original public game art/audio and editable masters are retained.

Browser tests use Playwright + Chromium. `npm run test:atrium` tests the offline
build; `npm run test:atrium:modules` tests the modular build via documented
in-memory transport. This environment's native HTTP/file browser navigation is
restricted; native desktop browsers and human playtest results are not claimed.

Historical reports/captures remain clearly identified by their older version.
QA screenshot previews can be WebP-compressed; runtime game artwork is unchanged.
