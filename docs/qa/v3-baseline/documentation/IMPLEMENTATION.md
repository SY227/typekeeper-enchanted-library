# Runtime and build architecture

The supplied v2 was upgraded in-place at the module level. Runtime: Canvas 2D, HTML/CSS and JavaScript ES modules. Rendering remains layered; word text, scores, controls, spell stock and meters are live, not painted into a screenshot.

`src/game/model.js` is the independent fixed-step simulation. `clock.js` supplies 60 Hz simulation time and render interpolation. `rules.js`, `controls.js`, `pressure.js` and `src/data/` separate rules/content from drawing. Renderer caches are bounded and dynamic textures are discarded as needed. `main.js` owns screen transitions, input focus, audio scenes and persistence hooks. `LocalStore` validates schemas and recovers from unavailable browser storage.

Game package version: **3.0.0**. Save payload schema: **2**, deliberately retained for backward-compatible import/export. Balance ruleset ID: **library-edition-2.0.0**, retained because score/fall/power rules are unchanged from v2. Product names are not used as ruleset compatibility switches.

New persistence key: `typekeeper-enchanted-library-v3`. When missing, the previous v2 key is read, validated and copied without modifying the legacy value. V1 score imports stay in their own records category. A hosting origin/port change needs save export/import; localStorage is not cross-origin sync.

Audio uses two decoded AudioBufferSourceNode loops and one shared clock. A master output follows a compressor fed by separate effect/music buses. Music gain and a low-pass filter vary by scene. Silent/unsupported/failing audio never stops model updates. Settings do not rebuild music sources. Short voice/noise limits prevent unbounded feedback allocations.

The build has no npm dependencies. `scripts/build.mjs` copies source and public assets into dist and records hashes. `standalone.mjs` embeds the same modules/styles/assets as data into PLAY.html. Both editions use the same model, renderer and music; the embedded version is not a simplified fallback.

`__TM_TEST__` exists only behind an explicit localhost + test query check in the normal source. It is not exposed by default in PLAY.html or normal production navigation. The managed-browser test fixture enables that existing seam in memory; it does not replace game rules or fabricate results.

The Node/Python local servers bind to loopback and can open the user's browser. Their payloads are independently hash/MIME checked. Their browser-launch behavior on actual Mac/Windows remains a separate environment-specific check.

No Unreal runtime, Blender render, cloud service, paid API, AI inference, external font or streaming server is needed. Optional authoring helpers are outside the build and are not claimed as executed tools for this release.
