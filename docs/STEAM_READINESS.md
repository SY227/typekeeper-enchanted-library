# Steam-oriented experience audit and remaining release gates
Research access date: 23 September 2026. This document supports the mechanics iteration;
it is not a launch forecast, sales estimate, a Steam submission or a full market study.

## What current sources actually show
Valve requires store presence and product build review before release. Its build review
checks startup on the advertised supported systems and implementation of advertised
features. It asks that screenshots show gameplay rather than concept/marketing imagery. [S1]

Valve's Steam Playtest supports a separate child appID for controlled external testing.
It is a suitable route for later real-player testing; no Playtest was created or run here. [S2]

The current Type Shogun store description emphasizes difficulty choice and free practice;
Keyboard Rush's developer page emphasizes distinct skill levels/practice and replayable
typing play. These are product/developer claims, not evidence of sales, retention or any
universal winning formula. [S3, S4]

## Our design inference for Typekeeper (not a statement by those sources)
Retain the game's own library identity rather than copy another genre. Prioritize a readable
first chapter, no unexplained difficulty cliffs, useful spell information, skill-appropriate
paces, safe retry/continue, and honest score comparison. Keep expert pressure without making
an early learner repeat half an hour merely to practice a late chapter. Avoid adding accounts,
retention tricks or interface clutter during a mechanics-only pass.

The synthetic audit is an engineering screen for bottlenecks, not evidence of viral potential.
Different products, visibility, price, launch timing and real-player response still matter;
none was measured or predicted for Typekeeper in this task.

## Proposed human protocol — NOT YET EXECUTED
Recruit players with varied measured typing ability, including actual first-time players.
Use normal controls and do not show developer diagnostics. Proposed sessions:
1. Unassisted first 10 minutes: can the player start, submit, identify a spell and recover?
2. Representative chapter/trial blocks: 5–7, 11–13, 23–25, 35–37, 46–48 at their chosen pace.
3. Interrupt/resume/retry: background the window during a spell, retry after failure, quit a
   partial chapter, restore the bookmark, export/import between the intended installations.
4. Extended session: repeated music loops, fatigue/readability, score motivation and whether
   the player voluntarily chooses another chapter. Ask why; do not substitute bot wins.

Log confusion, accidental casts, unreadable overlaps, exact loss causes, restart abandonment,
completion time including menus, and qualitative reasons for continuing/stopping. Any actual
completion/retention thresholds should be agreed before the human test, not invented afterward.

## Distribution checklist — still open
- Package and test an actual desktop build for each intended supported OS. The supplied
  dist/ and PLAY.html are a web build, not that installer or depot.
- Configure the Steam application, depots, launch options, store page and content survey.
- Implement and test any Steam-specific features that will be advertised; none is claimed
  here. In particular, local JSON scores are not Steam leaderboards or Cloud sync.
- Verify hardware/keyboard focus, full-screen, Alt-Tab, display scaling, audio devices,
  safe upgrades, save paths and uninstall/reinstall behavior on actual target machines.
- Do not advertise full gamepad/Deck compatibility for this keyboard-first game without a
  designed and validated input path. Accessibility improvements are not certification.
- Use only genuine current gameplay/store claims, complete provenance review, then submit
  the near-final store presence and build for Valve review. [S1]
- Run the proposed external human test, potentially through Steam Playtest. [S2]

## Primary sources
[S1] Valve, Review Process — https://partner.steamgames.com/doc/store/review_process
[S2] Valve, Steam Playtest — https://partner.steamgames.com/doc/features/playtest
[S3] Type Shogun, developer-supplied Steam page — https://store.steampowered.com/app/4918280/Type_Shogun/
[S4] Keyboard Rush, developer site — https://keyboardrush.com/
