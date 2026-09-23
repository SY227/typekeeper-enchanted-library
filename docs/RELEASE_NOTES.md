# Typekeeper 3.1.0 — mechanics and player-experience release notes
23 September 2026. Basis: the attached v3.0 source archive, not assumed unseen video behavior.

## Preserved
Artwork, registered character expressions, music masters/runtime stems, sound system,
layout CSS, chapter names, eight-wing atlas, title, menus' visual style and all
48 chapters remain. The original score formula, Enter submission, four spell keys,
pressure thresholds, stars, three pace categories and local-only operation remain.
No extra marketing banners, account gates, tutorials over the playfield or new
monetization systems were added.

## Pacing and fairness
- Replace abrupt vocabulary-bank switches with interpolated short/medium/long mixes.
  New word lengths enter under a chapter-dependent cap; the dictionary is unchanged.
- Classic fall speed rises 28 → 88.16 logical pixels/second across chapters 1–48.
  Normal arrival interval decreases 2.35 → 1.504 seconds. See DIFFICULTY_TABLE.md.
- Relaxed uses 0.68× motion and 1.60× arrival interval; Maniac uses 1.22× / 0.78×.
  No hidden skill detection or mid-word acceleration changes those settings.
- Quick clears trim only empty-field downtime. Trial breathing intervals are protected.
- Trial waves retain four quicker intervals followed by a longer rest; the existing
  wave indicator now says BREATHE during that rest.
- Spawn placement uses actual free spans. A blocked card retains its word and reward
  instead of rerolling, and the game does not spawn surplus cards beyond the remaining quota.
- Active duplicate words are excluded from authored spawns. A shuffled four-spell bag
  limits reward droughts; full shelves are avoided when another remaining type is available.

## Items and feedback
- ICE banks SLOW's duration. SLOW says QUEUED and its countdown does not run while frozen.
- Empty-field FIRE / zero-pile WIND say STORED, not actionable READY; no stock is wasted.
- FIRE leaves a short minimum recovery before the next arrival, retaining the typed word.
- A just-landed or just-burned target submitted within 0.35 seconds does not cause an
  additional typo. Misses still count and apply full pile pressure. Nothing is auto-completed.
- Concurrent cast/streak banners share one readable location; golden SLOW motion is
  not shown as active while that effect is queued. Illustrations and typography are unchanged.
- Resuming typing after keyboard focus moves to a spell restores editing, including selection.

## Runs, retries and saves
- Campaign starts save a chapter-one checkpoint. Failure keeps the chapter-opening bookmark
  and offers Retry chapter. Retry restores score/resources and the same seeded card stream;
  it does not award failed-attempt points twice. Prior retry count is retained with results.
- All 48 chapter transitions and campaign/practice/Endless terminal conditions are guarded.
- Completing an unlocked practice chapter can earn stars without advancing campaign unlocks.
  The atlas completion count now distinguishes practice mastery from campaign clears.
- Ending Endless from the pause menu records its current result once, as retired.
- Practice score views are chapter-specific. Old ruleset records are explicitly Legacy.
- Imported medals cannot revoke a previously earned campaign clear. Corrupt stored bytes
  are retained in recovery storage, and old valid saves remain available to migration.
- Storage-unavailable messages no longer claim progress has been durably saved.

## Scope
This is a complete, prebuilt browser release candidate plus editable source and assets.
The automated evidence is in QA_REPORT.md. Steam installation, real target hardware,
human difficulty/fun testing and commercial release approval are not represented as done.
