# v3.4.0 implementation

The baseline v3.3.6 game model is unchanged. `src/render/chapter-art.js` maps the
existing CAMPAIGN into 48 frozen title-specific visual profiles; it does not advance
or access gameplay randomness. `src/render/elemental-art.js` owns capped Canvas
textures and original FIRE/ICE drawings. `renderer.js` composes these with the
existing manuscript/typewriter/scroll renderer. The live canonical text painter and
imperial-scroll geometry remain the source of truth for letter and crest bounds.

Chapter scenes are keyed to chapter+contrast and capped at two entries. Elemental
textures are capped at 48 entries /12MiB. Motion uses the existing paused/frozen/
slowed presentation clocks; effects have no authority over score, spawning or saves.

The standalone compiler explicitly orders both new modules after their dependencies.
Source HTML, APP_VERSION and package.json must agree before building. Dist module
imports carry one content fingerprint. Launchers validate all prebuilt hashes and
choose the next free local port without killing an existing server.

Complete preservation list: qa340/preservation.json. Current QA: QA_REPORT.md.
Historical implementation documents are under archive/ and not current claims.
