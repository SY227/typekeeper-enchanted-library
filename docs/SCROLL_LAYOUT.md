# v3.3.6 — One scroll / one safe content region

All material coordinates are top-left local coordinates until the renderer centres
the card. The old renderer mixed the material origin, glyph origin and seal origin.

The card's logical height is 60. Cached surfaces retain the existing 16 px padded
border on each side. The turned finials extend 7 px above/below the nominal body;
they remain fully inside the texture. Decorative cords are outside the ink region.

Both rollers have a centre 10 px from the end and maximum half-width 6.5 px.
The parchment starts 17 px from the end. Normal lettering reserves 28 px at each
end; those margins include the hardware, rather than being extra blank paper.

Spell cards add an inset medallion centred at x=42, y=30 with radius=12. Its left
edge is 13 px inside the parchment edge, and its right edge is followed by a 10 px
minimum text gap. Right-hand text clearance is the same 28 px as ordinary scrolls.

Both the artwork and icon overlay use `scrollGeometry`. Text layout uses the same
constants through `scrollInsets`. Native glyph overhangs are included, with a small
antialiasing safety allowance. Word width is calculated from that content, not a
stale menu/model rectangle. Ordinary dictionary words retain their size; only
exceptional over-width test strings use fit-down within the fixed maximum width.

The gameplay seed, random stream, world collision positions and speed are not
changed by these measurements. Existing presentation-only x separation still uses
the actual visual width. All word lettering is one canonical string at baseline 0.

Title art uses this same painter; it is not a second special-case card renderer.
The ordinary scene and all four magic books, captions and controls are retained.

## Visual treatment

Narrow chased brass shafts, stepped gilt fittings and pointed finials replace the
large round end pieces. Layered silk shading, a restrained woven border, tied cords
and a centred seal are cached once per size/material/contrast state. The six palettes
remain normal ivory, fire, ice, slow amber, wind lavender and dark bonus parchment.
No imported fonts, new soundtrack, video effects or external graphics service is used.

The current PNG captures come from this actual Canvas renderer. They are not an
illustration of a design that has yet to be implemented.
