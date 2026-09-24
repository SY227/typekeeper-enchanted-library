# Typekeeper: Enchanted Library — v3.2 release and QA report

**23 September 2026 · ruleset `typekeeper-3.2.0` · complete browser build + source**

## Scope and decision

Implemented directly from `Typekeeper_Enchanted_Library_v3.1_Full_App(1).zip`, using
the user's actual playtest feedback: the difficulty grew too slowly, pressure should
be audible, and typing/spell/score feedback should feel more satisfying.

This is a complete playable web release candidate. It is not a human-tested AAA
certification, native Steam package, market forecast or claim of exact video parity.
The new reference's moving frames/audio could not be accessed; additions interpret
the user's descriptions and the actual supplied code, not invented observations.

## Implemented changes

| Area | v3.1 finding | v3.2 change |
|---|---|---|
| Opening pace | Classic started at 28 px/s with 2.35-second ordinary arrivals; only +1.28 px/s per chapter | Author-controlled knots start at 36 px/s / 1.90s, reaching 58 / 1.50s at chapter 6 and 76 / 1.30s at chapter 12 |
| Vocabulary | First four chapters stayed in the shortest bank | Medium words begin entering chapter 2; continuous length/mix changes; same dictionary |
| Pressure score | Two stems varied by screen/trial, not actual pile | Two added original layers follow smooth pile-dependent gain curves, phase-aligned with retained theme |
| Recovery | WIND relieved the meter and character, not the musical tension | Faster musical release toward calm, without restarting/pitching the score or erasing typed input |
| Typing feedback | Basic completion effects and generic key tones | Local matching ink glints, full-word-ready sound, paper sheen and small score sparks; Enter still mandatory |
| Sound palette | Short generic synth cues | Mechanical variants, paper foley, separate book/bonus/streak, four spells, natural expiry and page transitions |
| Scoring ceremony | Final total appeared immediately | Short bounded bonus count + ticks/seal, committed score unchanged; skip/Next never waits |
| Clarity/performance | Large streaks could cross live cards; HUD rewrote unchanged text/markup repeatedly | Suppress overlapping banner; preserve unchanged HUD nodes, reducing avoidable update work |
| Preferences | Existing audio/motion controls | Independent adaptive-score and typing-shimmer switches, retaining all prior mute/volume settings |
| Migration/update | Prior save key and local deployment folder | New key/ruleset, read-only legacy migration, backup-first updater preserving Git/Vercel/env config |

No original art or original musical master/runtime stem was replaced. Fifty-two
specified assets/layout/content/config files are byte-identical, and all three
word-bank arrays deep-equal the baseline (746 entries). The unchanged-file audit
has an explicit scope; it does not claim unchanged rules, CSS or audio code.

## Executed engineering checks

| Gate | Result |
|---|---|
| Logic/rules/storage/presentation tests | **210 passed / 0 failed** |
| Main browser regression | **45 passed / 0 failed** |
| Previous audio/editorial regression | **24 passed / 0 failed** |
| Previous mechanics regression | **27 passed / 0 failed** |
| New pressure/audio/shine/tally integration | **33 passed / 0 failed** |
| Total logic + browser cases | **339 passed**; software checks, not independent players |
| Unhandled application JS exceptions in those audits | **0** |
| Isolated stage simulations | **432/432 completed**, 48 stages × 3 paces × 3 seeds with declared profiles |
| New full campaign simulations | **75**, all outcomes retained, including deliberate difficulty losses |
| Uploaded v3.1 comparison | **75**, same synthetic agent definitions and seeds |
| High-pressure / no-starter-book scenarios | **42 ended correctly**: 18 clears and 24 ordinary losses; no timeout |
| Assisted Endless lifecycle soaks | **3 passed**, chapters 49–200 completed on each pace, entering 201 |
| New music regeneration | **9 files byte-identical** using the included recipe/environment |
| Music decode/mixes | **4 stems + 7 static pressure mixes**; aligned frames, finite signal, no clipped samples |
| Actual synthesized SFX offline render | **20 seconds**, stereo, finite signal, zero clipped samples |
| Node and Python HTTP servers | **41 payloads each** match hashes; MIME/HEAD/404 checks pass |
| Backup-first updater | **4 scratch-folder scenarios passed**; protected files retained |
| Clean archive extraction / offline npm install / tests / syntax / build | **Passed; all 43 generated outputs byte-identical** |

The 210-test count includes prior adversarial/property cases rather than expanding
every assertion, frame or seeded inner run into a new named test. No human subjects
participated in these automated audits. The user's prior first-hand pacing report
is separate evidence and motivated the earlier difficulty curve.

## Balance: earlier pressure, not guaranteed completion

Campaign profiles: 25/40/60/90/120 WPM; reading/target-acquisition delays of
0.32/0.26/0.20/0.15/0.12 seconds; wrong-submission probabilities of
6%/4.5%/3%/2%/1.2% per word. Five seeds per profile and difficulty. Agents see the
exact visible strings, target the nearest landing, type character-by-character,
press Enter and use reactive spells. No campaign retries are used in this audit.
They do not model comprehension, distraction, learning, fatigue or enjoyment.

| Profile | v3.1 campaigns cleared | v3.2 campaigns cleared | v3.2 median chapter reached | Range |
|---|---|---|---:|---|
| Relaxed / 40 WPM agent | 5/5 | 0/5 | 25 | 23–26 |
| Relaxed / 60 WPM agent | 5/5 | 5/5 | 48 | 48–48 |
| Classic / 40 WPM agent | 0/5 | 0/5 | 15 | 14–16 |
| Classic / 60 WPM agent | 5/5 | 0/5 | 28 | 24–29 |
| Classic / 90 WPM agent | 5/5 | 5/5 | 48 | 48–48 |
| Maniac / 90 WPM agent | 5/5 | 0/5 | 37 | 35–38 |
| Maniac / 120 WPM agent | 5/5 | 5/5 | 48 | 48–48 |

**These WPM numbers describe synthetic agents, not recommended/required human typing
speeds.** The new version deliberately challenges slower profiles earlier. It is
not presented as a universally easier game. A retry, better power timing, choosing
Relaxed or human learning changes outcomes, none of which these fixed agents predict.

Isolated-stage calibration uses 60-WPM Relaxed, 90-WPM Classic and 120-WPM Maniac
agents, three seeds per stage and the normal Practice starter kit. The complete
campaign matrix still retains slower profiles and losses; no failed player outcome
was deleted to produce a favorable completion claim. New campaign plus isolated
runs represent about **25.91 hours of simulated game time**, accelerated in code.
Assisted Endless soaks inject spells; they test reliability, not attainable player skill.

## Audio and scoring correctness

The original 90-BPM / 40-bar theme is retained. Four BufferSources start together
and share the same loop; no pitch or transport reset is tied to danger. Pressure
builds above 20%; urgency articulation enters above 65%. Targets are continuous
smoothstep curves. WIND's fall uses a faster gain release; music direction never
changes card speed or scoring. New layers can be disabled independently.

The browser checks real quick-casts, gain targets, source identity, natural effect
end cues, failure fallback, global mute and focus suspension. Missing optional stems
fall back to the original two-source theme rather than blocking play. Actual browser
decode used 112,895,976 bytes (~107.7 MiB); target-device memory profiling remains open.

SFX resources cap at 32 tones, 12 noise players and 24 cached noise buffers. Dense
reward bursts are exercised and nodes disconnect. Score voices have a separate
cancelable group. The test reads already-committed model totals while the visual
counter rises, verifies monotonic/final values, one seal, early skip/Next, return to
results, and reduced-motion/muted operation. The ceremony cannot grant extra points.

The SFX listening reel uses the shipping GameAudio class through OfflineAudioContext.
Its measured peak is 0.066051; no clipped samples. The 40-second music preview
is an authored pressure/release demonstration, **not captured gameplay or the original
video's audio**. Signal measurements are not subjective listening approval.

## Browser/performance evidence and limits

Tested: Chromium 144.0.7559.96 on Linux, 1440 × 1040 viewport. The final dedicated
stress profile holds 12 cards at 95% pile, keeps four score layers active, and exercises
real input events, completion feedback and card replenishment through diagnostics.
It is not a human run. After four seconds of warmup, 600 frame intervals:

- Mean **57.97 FPS**.
- 95th-percentile frame interval **16.8 ms**; worst **50.0 ms**.
- Median CPU-side Canvas draw time **0.80 ms**.
- Peak transient counts in that profile: 24 particles, 1 completion gleam,
  13 tone voices and 1 noise voice; no unhandled errors.

Earlier v3.2 pre-HUD-optimization samples are preserved separately, including their
lower frame rates; their shipping hashes differ from the final build. Main browser
regression ran concurrently with other browsers and its embedded short timing sample
is **not** the isolated performance claim above. Headless timing is not a guarantee
of 60 FPS, equal latency or smoothness on the user's real machine.

The environment blocks browser navigation to localhost/file URLs. Interaction tests
run the actual shipping PLAY.html in memory; only the existing diagnostic access
guard is enabled. No game functions are mocked. Node/Python HTTP byte tests are
separate; they do not prove real browser ES-module loading. Physical Mac/Windows,
Safari/Firefox/Edge, live Vercel deployment, audio hardware, alternate refresh rates
and durable same-origin storage after close/reopen still need direct tests.

All four final interaction reports and the sound/performance audits identify:
`210747d8917a45334b7b20b36540e139bfcd0d1cf670fca7d2edadb106f423da`

## Package, migration and reproduction

Full source, prebuilt `dist`, embedded `PLAY.html`, old and new audio masters,
illustration masters, tests, raw evidence and launchers are included. No accounts,
API keys, external runtime downloads, sample libraries or font binaries are needed.
SHA256SUMS.txt identifies delivered files; historical v3.1 reports are under
`docs/qa/v3.1-baseline` and must not be mistaken for this release's results.

3.2 reads v3.1/v3/v2/v1 data without modifying those older keys. Unlocks, stars,
preferences and valid bookmarks migrate. Older scores and continued mixed-rule
totals remain Legacy; a fresh expedition earns current records. Continue uses the
new rules, not a promise of identical old-version word placement. Export a save
before changing versions/origins. Keeping the existing production domain is important.

The updater backs up local game files before copying. It retains .git, .vercel,
.env files and existing vercel.json, refuses bad/self targets, and makes no remote
write. Its tests used synthetic folders, not the user's actual Mac/repository.

Core commands: `npm ci --offline --ignore-scripts --no-audit --no-fund`, `npm test`,
`npm run check`, `npm run build`, `npm run test:balance`, `npm run test:endurance`.
Browser tests use the optional dependencies/commands in README.md. Audio regeneration
has its own optional Python/ffmpeg requirements. Ordinary play does not require them.

## Remaining release gates

Human pacing/fun and long-session music listening; actual target-device compatibility,
resource/latency checks and durable saves; production-domain smoke testing after the
owner deploys; and, for a commercial Steam launch, native packaging, rights/claims,
platform integration and review. No human retention, sales, viral success or certification
was measured. This archive completes the requested browser update, not those other gates.
