# v3.2 implementation map

Native Canvas 2D / JavaScript ES modules with no npm runtime dependencies. The
existing browser architecture was preserved; no Unreal/Blender port was executed.

- `src/game/rules.js`: v3.2 knot-based pace plus retained item/input/scoring constants.
- `src/data/words.js`: unchanged word-bank arrays; earlier continuous level mixtures.
- `src/game/model.js`: authoritative simulation; enriched input/expiry events only.
- `src/game/storage.js`: v3.2 key, backward reads and score provenance.
- `src/audio/mix.js`: pure bounded scene/pressure direction, same loop clock.
- `src/audio/audio.js`: four-stem gain automation, bounded foley and cancelable tally.
- `src/ui/score-rollup.js`: display-only monotone count-up; no score authority.
- `src/main.js`: events/controls, switches, result count and scene transitions.
- `src/render/renderer.js`: capped local glints/sheens; large text avoids live cards.
- `src/styles.css`: retained CSS plus local score/medal feedback rules.
- `scripts/compose_pressure_score.py`: deterministic pressure/urgency synthesis.
- `scripts/render_sfx_preview.py`: OfflineAudioContext reel of actual procedural cues.
- `scripts/apply-update.sh`: backup-first local copy; preserves Git/Vercel/env configuration.

Build creates `dist` and fully embedded `PLAY.html`. UI words/scores remain live text,
not baked images. Per-frame model data never depends on an animation ending. Every
old spelling, score, item, retry and transition safeguard is regression tested.

Four decoded stems intentionally trade extra memory (~107.7 MiB at 44.1 kHz) for
continuous phase-aligned layering. Profiling on mobile/actual target browsers remains
open. Static file delivery is tested separately from inline Chromium interaction.
