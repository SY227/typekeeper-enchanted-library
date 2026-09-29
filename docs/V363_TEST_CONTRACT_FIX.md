# Typekeeper v3.6.3 — Release test contract correction

The v3.6.3 Open Atrium runtime was correct, but seven test assertions still pinned the previous v3.6.2 application identity and one preservation test still required the renderer to be byte-identical to v3.6.2 even though Open Atrium intentionally changes renderer integration.

Corrections:
- v3.6.3 app/presentation/export/title expectations now assert 3.6.3.
- the build tag assertion now expects `open-atrium-363`.
- the historical presentation normalization test now normalizes 3.6.3 back to its preserved 3.5.1 baseline before hashing.
- the Fresh Journey preservation loop excludes `src/render/renderer.js`, the intentionally changed Open Atrium integration file; dedicated Atrium tests cover the new renderer path.

No gameplay, balance, save schema, assets, or runtime source were changed by this correction.

Executed after correction:
- `npm test`: 806 passed / 0 failed
- `npm run check`: passed
- `npm run build`: passed
