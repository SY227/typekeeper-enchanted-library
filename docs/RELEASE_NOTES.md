# 3.3.6 — Scroll artwork / overlap repair

Based on the actual delivered 3.3.5 build. Narrow engraved brass end pieces, silk
paper shading, outer-edge tied cords and an inset spell seal replace the faulty
scroll skin. Artwork, badge and full-word lettering now share one coordinate system.
Words remain single-line and size to their actual measured ink. Title cards use the
same renderer as gameplay; IMAGINE is moved slightly left to avoid the character.

Fixed the four-coordinate WIND cubic call that could throw when motion was enabled.
Added source-version and standalone-dependency build guards. No balance, vocabulary,
randomness, save, soundtrack, resource, keybinding, HUD or account changes.

See QA_REPORT.md and qa336/ for the measured before-case, current checks, real
renderer captures and explicit platform-testing limits. Old records remain current.
