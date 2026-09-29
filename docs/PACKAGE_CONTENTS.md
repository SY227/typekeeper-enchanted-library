# Full source release contents

The game is not a patch: it includes the entire 48-chapter app, original editable
art/audio masters under asset-source, runtime assets under public/assets, source,
self-contained PLAY.html, production dist, launch/update tools and all executable
tests plus their necessary immutable fixtures.

To avoid shipping hundreds of megabytes of duplicated old screenshots and logs,
root qa350/qa351/qa352/qa360/qa362 directories and superseded docs/screenshots and
historical execution archives are not repeated. Original historical text design
notes are retained with their version labels. No game asset or chapter is removed.

Current qa364 contains test commands, reports, logs, a current normal-clock video,
source-diff and preservation evidence. Large test screenshots are supplied as WebP
previews; screenshot-index.json lists their original filenames and hashes. Native
baseline PNGs required by tests remain unmodified in tests/fixtures. Gameplay
assets and frozen runtime files are not recompressed.
