# v3.3.1 implementation

The v3.2.1 model/rules/economy remain unchanged. `src/render/presentation.js` contains
pure display contracts: eight room profiles, readable measured word wrapping, target
selection consistent with the model, visual separation, and a cancelable one-slot outcome
cue. `src/render/renderer.js` extends the retained renderer helpers in
`src/render/classic-renderer.js`; dynamic paper, character, pile, room lights and effects
are drawn on one Canvas. Original images/music remain local assets.

`src/main.js` moves the one real native input to the paper, manages learned visual cues,
quiet HUD/book states, and result scenes after model persistence. `src/styles.css` gives
existing controls diegetic styling without adding permanent panels. `src/audio/audio.js`
adds small erase and failed-submit cues without recomposing the soundtrack.

Application/build/export metadata is 3.3.1. Gameplay storage/ruleset stays 3.2.1. Native
module and standalone builds originate from the same modules. The standalone bundler's
explicit module order includes presentation, retained helpers and new renderer. Build
outputs include matching payload hashes. Source can be built without network packages.

See PRESENTATION_SPEC.md, QA_REPORT.md and docs/qa/release-gates.json for behavior and
measured validation. This is browser-native, not an executed Unreal/Blender port.
