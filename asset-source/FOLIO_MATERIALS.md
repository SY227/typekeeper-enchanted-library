# v3.3.3 procedural folio artwork

Editable masters for the new card surfaces are the Canvas geometry and palettes in:
  src/render/book-leaf.js
  GameRenderer.cardTexture in src/render/renderer.js

They are rendered locally into bounded 2× texture caches, not downloaded images.
The existing paper grain in public/assets/paper.webp is reused unchanged. Live words
remain native text in paintCard; the artwork contains no baked word/score/label.
Existing audio, character, environment and spell-book assets remain byte-identical.

The material sheet under docs/screenshots/v3.3.3 is captured from the actual renderer,
not an image-generation mockup or proof of human playtesting.
