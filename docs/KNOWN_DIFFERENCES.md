> **v3.5.1 addendum:** See [UI_SPACING_SPEC.md](UI_SPACING_SPEC.md) for this release’s UI-only changes and [QA_REPORT.md](QA_REPORT.md) for current evidence. The material below describes retained systems or earlier decisions.

# Scope and remaining validation

This is the supplied Typekeeper browser game upgraded in-place, not a remake of
Typing Maniac, a new engine, or an independently certified AAA product.

The same accepted illustrated library and typing flow are retained. New landmarks
and FIRE integration are procedural Canvas art layered into that scene; the finale
uses existing character assets with a subtle pose/hand movement, not a newly
rendered cinematic or a fully rigged character.

The release is English-language as before. The Chinese production brief was not
interpreted as a request to translate the whole game or change vocabulary.

A personal best is a real same-scope chapter score, not a ghost, network ranking
or proof that randomized word sequences had identical difficulty. No leaderboard
or cross-seed speed-race fairness is implied. Historic aggregate maxima are not
converted to fabricated atomic runs.

Testing was on Linux/Chromium with actual shipping embedded/Blob-module code.
The environment blocks browser navigation, so HTTP payload/server checks are
separate from DOM/Canvas/input/audio checks. Native desktop browser/device,
real-origin browser storage, long-session listening and external human playtests
remain validation tasks. See HUMAN_DEVICE_QA.md and QA_REPORT.md.

Local-file storage behaviour varies by browser. Use Records → Export/Import save
for a portable backup and reuse the same hosted/local-server address for automatic
save continuity. No account or cloud save has been silently added.
