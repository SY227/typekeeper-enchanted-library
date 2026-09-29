# Open Atrium — central environment revision

## Brief and baseline

The user found the translucent green screen behind the words unnatural and asked
for a targeted redesign without losing the existing game. The baseline is the
supplied complete v3.6.2 ZIP, not an earlier prototype or reconstructed project.
This is a production-style internal design review, not independent studio staff
or IGN certification.

## Art decision

**Reveal architecture, do not replace one slab with another.**

The previous `GameRenderer.roomLayer()` painted a large four-sided manuscript:
a green fill, thin outline, horizontal ruling, margin line, binding dots and ring.
Those objects are removed from the live environment painter. The underlying
library already contains receding shelves and a curved gallery. Reusing that
painting avoids a new art style, a perspective mismatch or an engine migration.

The center becomes dark charcoal-teal with a very gentle warm lift, not grey-white
fog. Near shelves, brass fittings, character, desk and parchment still carry the
warmth and detail. Pale scrolls remain the most legible high-value objects.

Do not add furniture, a focal symbol, a portal, a hard spotlight shape, animated
fog sheets, a grid, or more particles in the reading lane. Existing chapter props,
lantern responses, ICE edges and FIRE effects remain as authored.

## Implementation

`src/render/atrium.js` samples only the original local `library.webp` at the logical
1200 × 900 stage alignment and prepares a 1200 × 790 matte. A smooth elliptical
feather has zero slope and curvature at its ends; it is a mask, not a visible oval
object. Outside it, the replacement layer is fully transparent.

The color transfer retains 28% of the original channel deviation from luminance
in the center, with broad, low-amplitude warm lantern bounce. The backdrop's
high-contrast variant uses the existing 0.74 background brightness policy.
Lettering is not filtered, blurred or color-graded: it is rendered later on its
original opaque scroll material. Nothing is drawn over the game text or HUD.

Two matte surfaces (normal/high contrast) are prepared under the existing loading
screen. The bounded atlas retains 7,584,000 bitmap bytes in total. The pre-existing
two-entry chapter scene cache remains bounded independently. No per-frame pixel
readback, filter pass, RNG, animation timer or new network fetch is introduced.
A custom unreadable source image falls back to the original room, never a new slab.

Tools actually used: the game's JavaScript/Canvas 2D pipeline, Python, Playwright
and Chromium. Unreal and Blender were not used; no 3D-engine conversion is claimed.

## Deliberate scope limits

Unchanged byte-for-byte: main UI handlers, CSS, layout constants, gameplay/data/
storage/scoring modules, all original public assets and editable artwork/music.
Renderer edits are limited to the atmosphere import, instance, loading-time
preparation, and the background portion of roomLayer. Word/character/machine/
impact/spell methods and their draw order remain untouched. Release identity,
build dependency order, current QA runners and documentation change as required.

The removed painter is preserved only in a test fixture for exact differential
checks. Existing baseline checksums are not replaced with arbitrary new values.
Tests reconstruct the exact old renderer from the explicitly permitted delta and
require its original hash, while separately testing the new atmosphere's behavior.

## Internal design review

| Lens | Decision and check |
|---|---|
| Cohesion | Use the original perspective and brushwork; remove the manuscript silhouette rather than reducing its opacity. |
| Readability | Keep the chamber low-contrast; no blur or color transfer touches parchment, ink or targeting. |
| Attention | No moving haze, extra target, central light beam, or new icon competing with falling words. |
| Spatial continuity | The curved gallery/receding shelves stay visible above and between scrolls; no rectangular top/bottom seam. |
| Existing UX | Above-book status strips, PAPER PILE/WIND spacing, score/BEST and fresh-journey controls remain unchanged. |
| Accessibility | Static treatment also works in reduced motion; high contrast dims the backdrop without depending on animation. |
| Performance | Build two reusable surfaces while loading; never process their pixels per key, frame or chapter. |

The judgment that this treatment is more visually coherent is an internal visual
assessment, not evidence of higher sales, retention, accessibility certification
or a completed human preference study. Actual moving gameplay and pressure tests
are included alongside controlled comparison scenes.
