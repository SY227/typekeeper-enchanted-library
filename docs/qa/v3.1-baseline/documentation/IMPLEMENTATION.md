# Typekeeper 3.1 runtime and build
Browser-native Canvas2D + HTML/CSS + JavaScript ES modules. No engine migration.

Game version 3.1.0; ruleset typekeeper-3.1.0; save schema 3. Product identity is unchanged.
Runtime changes are restricted to model/rules/storage/vocabulary, input/transition wiring,
and two renderer feedback guards. Styles, index layout, soundtrack code, all images,
registered expression assets, chapter content and icons are byte-identical to the upload.

GameModel owns every word outcome, timer, inventory, score and transition. FixedClock
steps at 60 Hz and bounds catch-up after stalls; the renderer interpolates positions.
ICE/SLOW expiry is integrated within a tick so a partial expiry does not lose or grant
an extra full tick. A chapter-specific seed and checkpointed item bag reproduce new-rule
chapter starts. Pending blocked spawns keep their chosen content. Replay input is bounded
at 100,000 events and explicitly marked truncated beyond that; export is not a replay UI.

LocalStore owns versioned migration, ruleset separation, chapter-scoped practice records,
mastery/campaign-clear distinction, checkpoints and corruption recovery. Old keys are never
mutated. No run depends on the network, browser persistence or successful audio decoding.

Renderer feedback arbitrates a single concurrent cast/streak banner. Queued SLOW does not
draw its active orbit. Its art, materials, geometry, camera, typography and visual effects
otherwise remain the same. Assets and logical state stay separate.

Build scripts use Node's standard library. dist contains the normal ES-module site.
PLAY.html embeds that same source/styles/media for direct opening; it is not a different
simplified game. The diagnostic seam requires an explicit local test URL, and tests can
enable it only in their in-memory fixture. Ordinary PLAY.html does not expose it.

Server payload integrity and browser runtime execution are reported separately: this
managed Chromium blocks localhost/file URL navigation. The independent HTTP audit checks
both Node/Python servers against all manifest hashes and appropriate MIME/HEAD/404 behavior.
A successful byte audit is not misrepresented as browser HTTP execution.
