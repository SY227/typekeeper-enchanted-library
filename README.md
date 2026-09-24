# Typekeeper: Enchanted Library

**Version 3.2.1 · 23 September 2026 · readable opening, scarce spells**

A focused balance update built from the supplied **v3.2** full-app ZIP. The complete
48-chapter game, its artwork, soundtrack, adaptive music, typing effects, scoring,
mastery, practice, Endless, and layout are retained. This package includes the editable
source, local assets and masters, prebuilt `dist/`, standalone `PLAY.html`, tests,
audits and backup-first update helper. No account, API key, CDN, or engine is needed.

## Play

Open `PLAY.html`, or launch `START_MAC.command` / `START_WINDOWS.bat`. On Linux use
`bash START_LINUX.sh`. The HTTP launchers need an existing Python 3.9+ or Node 20+;
the standalone HTML needs neither. Closing/reopening and actual platform QA are
separate from the automated in-memory browser tests recorded here.

```bash
cd "$HOME/Downloads" &&
unzip -o "Typekeeper_Enchanted_Library_v3.2.1_Full_App.zip" &&
cd "Typekeeper_Enchanted_Library_v3_2_1" &&
bash START_MAC.command
```

Stop an older local server with Control+C to reuse its address. Keep the same browser
and domain to find its saved progress. The separate new folder leaves prior builds intact.

## Update the existing GitHub + Vercel project

**Export a game save first.** The updater backs up game files before copying and preserves
`.git`, `.vercel`, environment files and your existing `vercel.json`. It does not push,
authorize accounts, deploy, change repository visibility, or touch remote projects.
By default, the existing project is the `v3_1` folder used in the earlier setup; its
folder name need not match the new version inside it.

```bash
bash "$HOME/Downloads/Typekeeper_Enchanted_Library_v3_2_1/scripts/apply-update.sh" "$HOME/Downloads/Typekeeper_Enchanted_Library_v3_1" &&
cd "$HOME/Downloads/Typekeeper_Enchanted_Library_v3_1" &&
npm test &&
npm run build &&
git add . &&
git commit -m "Typekeeper v3.2.1: gentler opening and scarce spells" &&
git push
```

Use your existing Git integration for deployment, or explicitly deploy from that same
linked folder with `npx vercel@latest deploy --prod --yes`. Do not create another project
or attach a different domain just to apply this balance update. This archive does not
claim that a production deployment has already been performed.

The helper accepts another existing Typekeeper path as its argument. Backups go to
`Typekeeper_Backups` beside that project. `UPDATE_EXISTING_MAC.command` calls the same
helper. Synthetic filesystem/update tests are included; these are not on-device Mac tests.

## Balance changes

- Campaign still begins with **zero books**. The four forced tutorial powers are replaced
  by **one ICE opportunity on card six**, earned only by typing that card.
- **Two charges per spell** (eight total), with two matching stock pips. No change to the
  strength of FIRE/WIND, six-second ICE, or eight-second SLOW.
- Ordinary opportunity gaps: chapters 1–6 **8–11 cards**; 7–12 **8–10**; 13–24 **7–10**;
  25 onward **6–9**. An already drawn gap carries across ordinary chapter boundaries.
- Trials bring the next opportunity into their first four cards, then use gaps of eight.
  They replace, rather than add to, the ordinary schedule. This also applies to Endless
  trials. Collection is still required; no books are automatically granted.
- Every four scheduled powers cover all four types. Trial preferences favor ICE, then
  WIND, only when still present in the remaining bag and below capacity. No change is
  driven by score, typing performance or the current paper pile.
- Chapters 1–3 fall **10–15% slower**, 4–6 **5–10% slower**, and 7–12 smoothly return to
  v3.2. Chapter 24 matches v3.2; 36 is 2% faster and 48 is 3% faster. Arrival intervals,
  vocabulary mix, quotas and trial rests are unchanged.
- A blocked spawn no longer consumes a reward-bag entry before it actually enters.
  Empty shelves/new runs cannot inherit a stale pickup glow.

A good typist who does not need spells can still fill the shelf. This build does not
secretly remove earned resources or change the rules to force a target inventory level.

## Save migration

The new key is `typekeeper-enchanted-library-v3.2.1`. Previous v3.2/v3.1/v3/v2/v1 keys
are read-only migration sources. Preferences, earned stars, chapter unlocks and valid
campaign bookmarks are retained. A carried third charge is trimmed to the new two-charge
limit; it is not turned into a score bonus or a hidden reserve. Original saved bytes
remain under the older key, and an exported pre-update save remains useful as a backup.

Old scores and continued old-rule totals remain **Legacy**. Begin a new campaign for
current-version records. A v3.2 bookmark did not contain the new reward countdown, so
that countdown is initialized conservatively once; subsequent checkpoints preserve it
and the bag exactly for retry/continue. Original v3.2 word/drop sequences are not promised.
Practice and Endless retain their separate one-per-type starter kits and record modes.

## Controls and presentation

Type a displayed word, then **Enter**. Backspace and normal selection/cursor editing work.
**1 FIRE · 2 ICE · 3 SLOW · 4 WIND**, including numpad, cast without changing the typed word.
Escape pauses. The result total can be clicked to skip its count-up. Full-word shine is
feedback only; it does not auto-submit. Music, adaptive tension, effects, mute, reduced
motion and typing shimmer retain their existing settings and behavior.

## Reproduce the engineering checks

Node-only checks need no package download:

```bash
npm ci --offline --ignore-scripts --no-audit --no-fund
npm test
npm run check
npm run build
npm run test:balance
npm run test:economy
npm run test:endurance
node scripts/resource-strategy-audit.mjs
python3 scripts/test-update.py
```

For a paired comparison, pass the extracted v3.2 directory to
`node scripts/playtest-simulation.mjs --baseline /path/to/v3.2` and
`node scripts/economy-audit.mjs --baseline /path/to/v3.2`. The former deliberately
uses the exact baseline model rather than applying new rules to a relabeled run.

Browser tests require the optional `e2e/requirements.txt` dependencies and Chromium.
The conventional HTTP main suite is `python3 e2e/browser_tests.py`. In a managed
environment that blocks local browser navigation, `--inline` exercises the real
standalone export in memory. The other suites explicitly use that in-memory fixture.
They enable only the existing diagnostic access guard; they do not replace the rules.

```bash
python3 e2e/browser_tests.py --inline
python3 e2e/mechanics_tests.py
python3 e2e/polish_tests.py
python3 e2e/pressure_tests.py
python3 e2e/economy_tests.py
python3 e2e/feedback_performance.py
```

`--executable /path/to/chromium` selects an already installed Chromium. Separate HTTP
integrity and audio signal checks are `python3 scripts/http-audit.py` and
`python3 scripts/pressure-audio-audit.py` (the audio check needs its optional numeric
libraries and FFmpeg). Music/art generation is optional: existing exports ship locally.

## Evidence and remaining work

`docs/QA_REPORT.md` reports the actual final tests, simulations and limitations.
`docs/ECONOMY.md` defines the resource policy; `docs/DIFFICULTY_TABLE.md` contains every
chapter's derived numbers. Raw current evidence is in `docs/qa/`; older results are
explicitly archived below `docs/qa/v3.2-baseline/` and other versioned subfolders.
No font binaries, new backend, telemetry, account system or monetization is added.

This is a tested browser build, not a claim of human enjoyment validation, native Steam
packaging, original-game numerical parity, cross-device certification or viral success.
Actual human sessions, long-session listening, device/browser persistence, and an owner-run
production-domain smoke test remain necessary. See `docs/RELEASE_CHECKLIST.md`.
