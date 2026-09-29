# Typekeeper: Enchanted Library · v3.6.4
## Bound & Balanced

A little focus. A little magic. Save falling words with a magical typewriter.

## Play
Extract the entire ZIP. Run `bash START_MAC.command` on macOS, `START_WINDOWS.bat`
on Windows, or `bash START_LINUX.sh` on Linux. The launcher serves the supplied
production `dist/` and opens the game. Alternatively open `PLAY.html` directly for
an offline, self-contained edition. Do not double-click the modular `index.html`.

Node 20+ users can run `npm ci` and `npm start`. The Python launcher uses Python 3.9+.

## This release
- Chapter 3 and Chapter 4 now require **14 words**, not 13. Other quotas, fall speeds,
  spell economics, manual Enter, star criteria and the 48-chapter structure remain.
- The first wing's open book now rests on a wooden lectern with shaped pages,
  layered edges, leather binding, a cloth marker and localized warm shadows.
  Shelf-bound volumes use restrained leather grain and curved spines.
- Existing progress, stars and recorded best-score history survive. Fresh attempts
  use scoring profile `typekeeper-3.6.4`; previous `typekeeper-3.2.1` results remain
  historical and cannot masquerade as comparable new-profile bests. An older
  continued attempt is marked **EARLIER RULES**, not silently relabeled.
- Import deduplication now distinguishes difficulty: same date, score and seed in
  different paces are not mistaken for one record.
- Background, HUD, Score Chase layout, above-book captions, typewriter feedback,
  input position and Paper Pile/Wind spacing are retained.

## Progress protection
Use **Records → Export save** in the old version before changing the folder,
browser or hosting origin. Import it in this version as needed. The save key is
unchanged, but browsers isolate storage by origin. Starting from Chapter 1 replaces
only that pace's Continue checkpoint; previously unlocked chapters remain available
through Chapters/Practice. Earlier scores remain in the historical collections.

## Development and deployment
```sh
npm ci
npm test
npm run check
npm run build
```
`vercel.json` builds with `npm run build` and publishes `dist/`. `.vercelignore`
keeps the editable masters, offline bundle and QA evidence out of the upload;
it does not remove them from this full source release. Never stage a parent/home
repository by accident. Verify the repository root and origin before committing.

Browser suites require Python Playwright and Chromium. Run `npm run test:production`
and `npm run test:production:modules` for the new release gates; `npm run test:e2e`
runs the retained browser suites. See `docs/QA_REPORT.md` for executed evidence,
transport limitations and platform checks still outstanding. Automated testing and
internal visual review are not independent AAA staff or human playtesting.

## Package
All game source, original editable art/audio, production assets, launchers, full
campaign, tests and current evidence are included. Redundant historical screenshot
and video collections are omitted; see `docs/PACKAGE_CONTENTS.md`. No fonts or
additional graphics engine are required.
