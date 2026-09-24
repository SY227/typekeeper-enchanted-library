# v3.2.1 implementation map

Native Canvas 2D / JavaScript ES modules; no npm runtime dependency or engine port.
The uploaded v3.2 is the exact baseline. Changes are scoped to the approved scarcity /
pace policy, its persistence and related inventory feedback. No new account, analytics,
online leaderboard, monetization, art or soundtrack feature has been added.

| Module | Responsibility / change |
|---|---|
| `src/game/economy.js` | New pure policy: count actual arrivals, carry gaps, prepare trial opportunities, serialize/restore schedule. |
| `src/game/rules.js` | Two-charge cap and revised falling-speed knots; all spell strengths and other rule constants retained. |
| `src/game/model.js` | Commit bag/countdown only when candidate enters; earned rewards, checkpoint economy, clamped restore. |
| `src/game/storage.js` | v3.2.1 key, old read-only migrations, current schedule validation, Legacy score provenance. |
| `src/main.js` | Two capacity pips/help, new preference key, cancel stale acquisition effects on empty shelves/new runs. |
| `src/audio/`, `src/render/`, `src/styles.css`, `index.html` | Preserved byte-for-byte; no redesign, recomposition or new effect. |
| `src/data/` | All chapter names, quotas through rules, vocabulary and selection mixtures retained. |
| `scripts/standalone.mjs` | New economy dependency included before model in the embedded export. |
| `scripts/build.mjs` | New game build version; local assets and source generate `dist/` and `PLAY.html`. |
| `scripts/apply-update.sh` | Same backup-first local workflow; preserves Git, Vercel and environment configuration. |
| `scripts/economy-audit.mjs` | Supply-only seeded comparison; not a player difficulty model. |
| `scripts/playtest-simulation.mjs` | Finite-speed agents with explicit error/acquisition assumptions and resource telemetry. |
| `scripts/resource-strategy-audit.mjs` | Compare two WIND policies; same seeds/typing, no claim of optimal human strategy. |
| `tests/economy.test.mjs`, `e2e/economy_tests.py` | New rule and real-UI integration coverage. |

Per-frame scores and transitions remain independent of animation completion. A blocked
spawn stages its proposed bag but cannot spend it until placement succeeds. Replacing a
chapter discards a pending candidate without changing the carried bag. Reward frequency
never reacts to WPM, score, or danger. Trial preparation is idempotent on Continue/Retry.

The asset manifest remains **3.2.0** because the original assets are unchanged; game,
package, build and current save metadata are **3.2.1**. `docs/qa/preservation-audit.json`
is the exact 73-file checksum scope, including masters, exports, original audio/rendering,
CSS, full page and campaign/word content. Only the slot count/help and related feedback
lifecycle in `main.js` intentionally change visible UI behavior.

Four decoded stems still use about 107.7 MiB at 44.1 kHz, as in the baseline. This update
does not claim to optimize that unchanged audio architecture. Device memory/performance
and long-session listening require owner/human tests. HTTP file checks are separate from
in-memory Chromium interaction. See `QA_REPORT.md` for final evidence and limitations.
