# v3.6.2 — Fresh Journey production specification

## Intent

A returning player should not have to hunt for the old footer-level New game
link or erase their save to replay the campaign. Continue remains the default
choice. Starting from Chapter 1 is a deliberate new attempt, not a reset of earned
content. Existing chapter selection remains Practice, not a new campaign-skip mode.

## State and UI contracts

- No saved attempt/progress: Play starts Chapter 1 directly.
- Valid checkpoint: Continue first, checkpoint chapter below it, then a full-width
  secondary Start from Chapter 1 action above Chapters/Records/How to play.
- Progress but no checkpoint (including completed campaign): Start from Chapter 1
  is the primary action. No meaningless Continue and no duplicate restart action.
- Decisions are per selected pace; unlocked content in another pace does not
  manufacture a checkpoint here.
- Restart dialog explicitly names the old checkpoint when one exists. It explains
  preservation of unlocks, mastery stars and best scores. A storage-denial notice
  describes session-only saving without claiming persistence.
- Cancel is default focus. Escape, Close and Keep current journey/Not now return to
  the originating screen and restore focus, without save writes. Paused text stays.
- Start has a one-shot view/intent guard. Duplicate clicks and stale confirmations
  cannot restart live gameplay. A changed pace invalidates the pending intent.
- The actual model starts Campaign level 1, score 0, danger 0, zero inventory,
  fresh word seed. It replaces this pace's checkpoint through setCheckpoint() once;
  no clearCheckpoint() deletion followed by a separate write.
- All progress, stars, run records, chapter PBs, Score Chase PBs and settings stay.
  Other pace checkpoints stay. Practice never changes the campaign checkpoint.
- Existing max-merging protects old mastery if a replay performs worse.
- A storage fault preserves the last successfully persisted bytes. The game can
  continue in memory with an explicit export warning; it does not claim an atomic
  filesystem guarantee or multi-device conflict resolution.

## Existing presentation

No game-space redesign. The returning-player menu is slightly tighter and bounded
inside the original parchment panel; completed campaign actions remain reachable.
The confirmation uses existing type, paper, brass, spacing and focus conventions.
Small viewport checks enforce containment/scrolling, not touchscreen support.

Above-book labels reproduce the separately requested v3.6.1 preview from the
available v3.6.0 source: statusTop=-28, fixed 18px logical strip/16px logical type.
Book anchors, pile meter and input remain unchanged. Exact transformed gaps are
verified in qa362. The label protects actual low-word lettering; decorative blank
scroll edges may share vertical space and are not asserted to be separated.
All other key/count/command readability contracts remain unchanged.

## Scope and implementation

Added ui/campaign-entry.js, main-menu and confirmation wiring, append-only CSS,
minimal status-row geometry, version/build metadata and dedicated tests.
No model/storage/scoring/economy/audio/character/word painter/Score Chase changes.
The immutable baseline fixture retains 85 original source and asset hashes.
Earlier immutable CSS/layout fixtures retain their original hashes; a narrowly
scoped adapter strips only this documented appended CSS and statusTop delta.
It cannot normalize unrelated changes.

## Internal production/critique review decisions

| Lens | Decision / evidence expected |
|---|---|
| UX clarity | Continue dominates; restart is visible, explicitly Chapter 1, never called Reset save. |
| Player trust | Consequences named before confirmation; retained progress spelled out; safe default. |
| Interaction | Keyboard loop, Escape, close, origin return, double activation and paused input exercised. |
| Save integrity | Only one current-pace checkpoint replacement; exact preservation of permanent data and other paces. |
| Art direction | Reuse existing menu and modal; preserve gameplay screenshots apart from approved book captions. |
| Regression | Existing Score Chase, impact, mastery, art, scrolls, labels and full flow suites run again. |

These are internal review criteria and observed checks, not quotes or evaluations
from independent studio staff or IGN. Automated agents are not human testers.

## External acceptance still needed

On the user's normal browser origin, export a real save, run the upgraded build at
the same origin, cancel once, confirm once, reload, then select an unlocked later
chapter and return to Continue. Repeat on intended Windows/Mac browsers. Observe
first-time users to validate discoverability; no human success percentages are
claimed by this build.
