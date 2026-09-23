# Typekeeper 3.0 — release changes

## Identity and editorial pass

New game identity: **Typekeeper: Enchanted Library**. Removed the website masthead, footer, local-first/account slogans, edition labels, persistent shortcut strip, typing prompt duplication, visible rank/character commentary and other prototype copy. Updated the favicon, live title, typewriter nameplate, chapter finale, save filenames and launcher labels. Remaining historical identifiers are deliberately internal compatibility keys/ruleset IDs.

The default playfield focuses on score, current chapter, streak, paper pile and spells. WPM, accuracy and personal best are optional in Detailed HUD. Instructions, expanded scoring, local-data notices and production notes belong in their relevant menus/docs rather than around the game.

## Sound

Replaced the short synthesized v2 background loop with **Lanterns & Letters**, an original 40-bar, 90 BPM, two-stem score. Scene-based mixing changes warmth/rhythm without changing tempo or restarting the loop. Added separate master/music/effects levels, audio-only Settings tab, full-output mute, smooth gain ramps, background suspension, failure isolation and bounded effects voices. Success/resume/rescue cues share the score's D-major palette.

## Interaction and polish

Tabbed Audio/Gameplay/Display settings, quieter parchment menus, themed keyboard focus, short modal transitions, optional 3-beat resume count, and a first-use typing hint that retires after success. Spells keep their number keys and readiness pulse; cast hints appear only for first acquisition when hints are enabled. UI generation guards prevent held/rapid Enter from skipping into the next screen. Covered controls become inert under dialogs. Deferred autofocus no longer steals focus after a player has already navigated within a newly opened menu.

Pause preserves the current word, caret and selected range. Losing focus during a countdown cancels it and leaves play paused. Returning to the tab never silently resumes falling words. A later WIND rescue, chapter completion and defeat continue to use the existing registered expression assets.

## Data and compatibility

Non-destructive v2 save migration into a Typekeeper storage key; old preferences are respected. Separate music/effects gains are validated on import. Chapter-boundary bookmarks now retain the visual paper pile, not only its percentage; legacy bookmarks reconstruct a matching pile if needed. Malformed pile arrays are rejected. V2 score rules remain unchanged to avoid silently mixing incompatible records.

## Content retained

48 chapters across eight wings, 144 possible stars per difficulty, eight archive trials, three difficulties, practice, post-campaign Endless, 746-word bank, safe spell casting, bounded texture cache and local record filters. This is a polish pass on the supplied game, not a replacement with an unrelated engine demo.

See QA_REPORT.md for actual test results; public device/hosting/listening gates remain separate.
