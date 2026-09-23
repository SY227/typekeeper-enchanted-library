# Public release sign-off

The complete build is supplied. This checklist separates completed automated gates from public-launch validation that needs the intended devices and people.

## Completed in this handoff

- [x] New identity and editorial cleanup applied to the actual game.
- [x] 109 logic/storage/rules/polish tests.
- [x] 45 main interaction and 24 new audio/UX browser checks, no unhandled application errors.
- [x] Source and standalone builds generated; all assets and original music bundled locally.
- [x] Node/Python server payload and MIME checks.
- [x] Clean extraction, offline install, rebuild and runtime-byte comparison.
- [x] Asset-source regeneration and byte comparison.
- [x] Stereo decode, headroom/sample clipping and loop-data checks.
- [x] Synthetic difficulty scenarios executed and labeled as simulations.
- [x] Final archive checksums, missing-file check and no-font-file audit.

## Before public commercial release

- [ ] Play actual installed Safari on the intended Mac; verify physical keyboard focus, high-DPI display, audio unlock, full-screen, and save persistence after quitting/reopening.
- [ ] Test the actual hosting origin in intended Chrome/Edge/Firefox versions, including new-player loading and saved-game migration.
- [ ] Listen on headphones and speakers across several complete score loops; approve tone, repetition, percussion balance and effects/music levels.
- [ ] Run human first-time, intermediate and expert sessions across early, middle, trial and endgame chapters; tune based on observations rather than synthetic WPM alone.
- [ ] Confirm the intended mobile/tablet support scope; test virtual-keyboard layout before advertising phone play.
- [ ] Review name/logo/asset provenance for the intended commercial release; make no original-publisher affiliation claim.
- [ ] Verify same-origin upgrade/export/import on the actual prior installed build and retain a backup.

Optional, not required for this local game: authenticated shared rankings, a native engine port, a store wrapper, or exact footage parity. They are not silently represented as completed features.
