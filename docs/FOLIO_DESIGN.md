# Folio material / caption specification

The object is a horizontal bound folio leaf, not a vertically oriented whole book
that would force the letters to wrap. Its cloth hinge, gilt head/tail marks, paper
block and curled fore-edge provide book cues around one uninterrupted text lane.

Implementation: `src/render/book-leaf.js` defines immutable palettes, safe metrics
and a curved page outline. `GameRenderer.cardTexture` constructs/cache-renders the
skin at twice logical resolution. The existing text painter remains unchanged.
Layout, world positions, priorities and PRNG state are not written by this code.

## Protected reading lane

Canvas source extent remains `(width + 32) × (height + 32)` at 2× raster resolution,
including 16 logical pixels of existing shadow padding. Normal glyphs begin at least
15px inside the material rectangle; the gutter ends before that lane. Top/bottom
ruling sits outside the character band. Element-stamp space is unchanged. The text
layout, not the artwork, still decides card width and the fallback fit for extreme
custom strings. There is no letter-breaking path in the texture or painter.

The six palettes are ordinary ivory/green cloth, burnt umber, frost/aqua, warm amber,
pale lavender, and a dark gilt bonus leaf. The new surface automatically participates
in existing card arrival, prefix, selection, destruction, missed-page and score
feedback without changing their logical consequences.

## Spell usage line

Each existing spell button contains a `spell-use` line below its name. A tiny `kbd`
digit plus short function label communicates the shortcut. Tooltips keep expanded
information. The caption is steady/non-animated, uses the existing sans-serif stack,
and inherits the button hit action rather than adding another nested button.

Each line has a 19px logical line-height, 12.5px logical label size and no wrapping.
Its added 23px block height is compensated in READY-aura and tooltip anchoring.
Screen-reader text includes “Press” and “You can also click this book.”

The word font is not reduced for this addition. No new font files or downloaded
artwork are introduced. Real-app screenshots and per-viewport caption bounds are
saved by `e2e/book_leaf_tests.py`.
