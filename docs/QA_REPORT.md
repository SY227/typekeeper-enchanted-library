# Typekeeper: Enchanted Library — v3.6.2
## A Fresh Journey · Upgrade and executed QA

28 September 2026. This report documents implemented behavior, internal production
review and executed automation. It is not actual independent AAA/IGN staff review,
a human study, Steam certification, real-device certification or a no-bugs guarantee.

## 玩家最重要嘅改動

主選單 Continue 下方新增 **Start from Chapter 1**。確認後重新開始本次旅程，
但 **已解鎖章節、星級、最高分同其他難度進度全部保留**。之後仍可以用
**Chapters** 選擇已解鎖章節練習，練習唔會取代新旅程嘅 Continue 位置。

取消、Escape 或關閉確認畫面唔會改存檔；預設鍵盤焦點落喺安全嘅取消選項。
只替換目前難度嘅 Continue 檢查點，唔係 Reset progress。新玩家仍然一按 Play
就開始；已通關玩家重新開局後，48 章同 Endless 亦唔會重新上鎖。

## 1. Scope and provenance

Available full baseline: supplied **v3.6.0 Full App** ZIP, SHA-256
`b365782d99f7a0f62d787a85607802adc3d83f54fa07122b36819b6ea45100d7`.
The later **v3.6.1 above-book label preview** was provided, but no full v3.6.1
source archive was available. Its approved compact status-row treatment is
reapplied to the available full source. This is not described as a byte-identical
v3.6.1 source baseline. The newly attached Review_Evidence ZIP is supplementary
critique evidence, not the game source.

Intentional runtime changes: fresh-journey helper, main menu/confirmation handlers,
append-only menu/confirmation CSS, compact above-book status geometry and release
identity. Source changes are listed in `qa362/source-changes.json` and the exact
source diff is in `qa362/implementation-diff.patch`.

The original model, rules, pace/difficulty curves, vocabulary, campaign, economy,
manual Enter, timing, star rules, storage schema, Score Chase scope, audio,
word/character/impact rendering, public game assets and editable masters remain.
**85 original foundation source/assets are byte-identical.** Original
CSS and layout integrity checks are retained with only their explicitly approved
append-only/one-value delta normalized; original reference hashes are not replaced.

## 2. User experience and safety

| Situation | Actual behavior |
|---|---|
| Brand-new player | Original one-click Play, no unnecessary confirmation. |
| Returning player with checkpoint | Continue first; checkpoint chapter shown; Start from Chapter 1 directly beneath. |
| Earned progress without checkpoint | Start from Chapter 1 is the primary choice, no invalid Continue. |
| Confirm restart | Names the replaced chapter and retained unlocks/stars/bests before starting. |
| Cancel / Escape / Close | No saved-data writes; originating screen, focus and paused input restored. |
| Confirm twice / stale event | Guard prevents a second reset or wrong-pace launch. |
| New attempt | Level 1, zero score/pressure/inventory, fresh randomized seed; one checkpoint replacement. |
| Later Chapter selection | Existing Practice mode, original unlocks intact, campaign Continue unchanged. |
| Worse performance on replay | Previously earned best stars/unlocks are not downgraded. |
| Storage failure | Last successfully saved bytes survive; memory session and explicit export warning remain. |

Returning-menu controls and confirmation use the original paper/brass styling.
No extra HUD, new gameplay, scoring change, monetization, login, account or Steam
wrapper is introduced. Internal review prioritized discoverability, honest
consequences, safe keyboard defaults and minimal change to the approved game.

## 3. Current-build automated gates

| Gate | Result |
|---|---:|
| Node logic, storage, presentation, preservation and regression tests | **807 passed / 0 failed** |
| Named browser checks across both build formats | **582 passed / 0 failed** |
| Unhandled page exceptions in those completed suites | **0** |
| Last-word / spell / trial boundary matrix | **23,040 passed / 0 failed** |
| Complete model campaigns | **12/12 complete through Chapter 48** |
| Complete rendered campaign journeys | **2/2 complete through Chapter 48** |
| Native launcher/payload/version/collision/corruption checks | **7 passed** |
| Backup-first updater checks | **6 passed** |
| Preserved original foundation files | **85 matched** |

| Browser suite | Standalone | Modules |
|---|---:|---:|
| restart | 51 | 51 |
| ui-spacing | 62 | 62 |
| score-chase | 38 | 38 |
| impact | 26 | 26 |
| clarity-mastery | 19 | 19 |
| chapter-art | 19 | 19 |
| scroll-repair | 19 | 19 |
| book-leaf | 26 | 26 |
| single-row | 19 | 19 |
| flow-browser | 12 | 12 |

The boundary matrix is 48 chapters × 3 paces × 8 seeds × 20 scenarios. Rendered
campaign agents use real model/input/result handlers and normally earned spells,
with accelerated stepping and sampled native rendering. Animated ending fixtures
are coverage inside those named flow checks, not additional people or sessions.
No earlier report's pass total is substituted for a run of this build.

## 4. Fresh Journey test detail

**51 new named browser checks per format (102 total)**, plus unit and preservation
checks, execute the actual shipping handlers/renderer with controlled save fixtures.

Coverage includes all three paces; Chapter 1/12/48 and completed-campaign states;
Continue before and after restart; exact retained collections; one complete save
write without a delete window; cancelled/stale/double confirmations; cross-pace
checkpoint protection; randomized seeds; old compatible saves; missing legacy PB
collections; import rejection; real JSON export/import; reload through a freshly
initialized app; simulated persistence denial; live paused text; returns from
Records/results; Practice/Retry not overwriting campaign Continue; all 48 unlocks
and Endless after replaying a finished campaign; keyboard focus loop and shortcuts;
12 viewport sizes and high-contrast/reduced-motion states.

Viewports: 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768, 1024×600,
800×600, 960×540, 640×480, 2560×1080, 768×1024 and 360×640. Small/portrait
cases establish safe containment/action reachability, not phone/touch playability.

At 1366×768, the compact status row's measured gap above the book element was:
**FIRE 1.53px, ICE 4.36px, SLOW 1.53px, WIND 4.36px** in the controlled ready state. Other UI checks exercise state captions,
actual lettering clearance, tooltips, meter separation, active spells and DPI2
emulation. Emulation is not a real Retina-device test.

## 5. What the storage tests do and do not prove

The new browser harness explicitly installs a **fault-injectable in-memory
localStorage-shaped adapter** before loading the shipping document. It exercises
the real LocalStore serializer, import/merge/validation paths and new confirmation
handler. Reinitializing the app from the captured save demonstrates state recovery
through those code paths. It does **not** certify native persistence on a hosted
origin, real browser-profile recovery, cross-tab concurrency or cloud storage.

The checkpoint is replaced through the existing validator in one complete JSON
write. Permanent collections are not cleared. If the adapter rejects a write,
the old serialized bytes remain and the new attempt can run in memory with a
warning. No filesystem-atomic or multi-device-sync claim is made.

## 6. Failed attempts and corrections retained

Initial unit runs caught obsolete expected version text and immutable CSS/layout
contracts after the declared above-book change. The original reference hashes
remain; narrowly scoped normalization applies only to approved changes.
An initial restart browser case used an ambiguous Settings Back/Done locator; it
was corrected to the actual Done button without changing game behavior.

The old UI/clarity suites initially expected on-cover labels: a 60px DPI2 meter
gap and a dynamic 14px effective state-caption font. Those do not describe the
separately approved above-book strip. Assertions now verify the new exact 16px
logical caption size, above-cover separation and actual low-word ink clearance;
key/count/command readability requirements remain. One early long UI attempt was
interrupted before completion; it is not counted as a pass. Logs include the
original failures, timeout and corrected final runs rather than hiding them.

Native browser HTTP/file navigation attempts returned
**ERR_BLOCKED_BY_ADMINISTRATOR**. `qa362/native-origin.json` records these as
UNVERIFIED, not passes. The normal suites use in-memory shipping PLAY.html or
Blob transport for the shipped ES modules, adapting only transport/asset URLs
and the explicit local diagnostic guard. Actual game/DOM/input/audio code is not
replaced. Native server payload/launcher checks run separately outside browser
navigation. No live Vercel site was changed or tested.

## 7. Environment and remaining external checks

Node **22.16.0**, Python **3.13.5**, headless Chromium **144.0.7559.96**, Linux.
The Mac shell launcher is executed under Linux Bash, not double-clicked in Finder.
Real Windows/macOS/Safari/Firefox/Edge, actual browser-origin localStorage across
upgrades, human usability/comfort, long listening sessions and Steam installation
remain external checks. Automated agents and test fixtures are not an AAA QA team
of people. Original old videos and reports stay labeled under historical folders.

## 8. Exact release

- Version: **3.6.2 — A Fresh Journey**
- Build: **3.6.2-04b297ea546ad828**
- Tag: **fresh-journey-362**
- Ruleset: **typekeeper-3.2.1**
- Save key: **typekeeper-enchanted-library-v3.2.1** (unchanged)
- PLAY.html SHA-256: `5a2350faf462c12a197b093645951b80553c25756f1f875ed9406df97ef8e5a3`
- Runtime outputs: **60** (all dist files plus PLAY.html)

`qa362/runtime-freeze.json` pins runtime bytes and `qa362/release-summary.json`
enumerates current suites. Current-only screenshot previews may be compressed to
WebP; `qa362/screenshot-index.json` maps original PNG paths/hashes to previews.
This changes QA images only, never game art or the frozen runtime.

### Fresh extraction gate

Candidate packaging and the fresh-extraction gate are pending. This draft is not
a claim that the final archive has passed them. The completed release replaces
this paragraph with actual extraction/rebuild and repeat-test evidence.


## 9. Practical save protection

Before switching browser/origin/file location, export a real save from Records.
Keep the same local server address where possible; otherwise import that save in
the new build. Merely sharing a save-key name does not let one browser origin read
another's data. Then choose Continue, restart from Chapter 1, or Chapters as needed.
