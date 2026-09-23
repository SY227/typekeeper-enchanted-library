"""Reproducible local exports for the Typekeeper asset kit.
The two master PNGs are generated illustration / manually masked derivatives;
vector spell books, glyphs, and paper texture are authored by this script.
The score has its own composer script; the quill favicon is an SVG master.
No third-party images or fonts are fetched.
"""
from pathlib import Path
import math, random, shutil, json, hashlib
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'public/assets'; S=ROOT/'asset-source'
A.mkdir(parents=True,exist_ok=True);S.mkdir(exist_ok=True)
# Masters are provided in the package; initial asset creation sources are local.
bgmaster=S/'library-master.png'
if not bgmaster.exists():
 raise FileNotFoundError('Missing asset-source/library-master.png. Restore it from the full archive.')
Image.open(bgmaster).convert('RGB').save(A/'library.webp',quality=92,method=6)
charpath=S/'typist-master.png'
if not charpath.exists():
 raise FileNotFoundError('Missing asset-source/typist-master.png. Restore it from the full archive.')
Image.open(charpath).save(A/'typist.webp',lossless=True,method=6)
# Authoring paths for the four spell emblems, using a common 64x64 coordinate system.
glyphs={
 'fire':'<path d="M34 5C40 20 21 24 32 36C35 31 42 26 40 18C59 37 55 57 32 60C8 58 10 38 21 28C19 39 25 43 25 43C17 25 33 23 34 5Z" fill="url(#glow)" stroke="#ffe1a1" stroke-width="1.6"/><path d="M33 36C34 45 23 46 29 55C43 55 43 43 33 36Z" fill="#fff2be"/>',
 'ice':'<g fill="none" stroke="#d9fbff" stroke-width="3.4" stroke-linecap="round"><path d="M32 5V59M9 18L55 46M9 46L55 18M24 11L32 19L40 11M24 53L32 45L40 53M10 28L21 26L20 15M44 49L43 38L54 36M10 36L21 38L20 49M44 15L43 26L54 28"/></g><circle cx="32" cy="32" r="4" fill="#fff"/>',
 'slow':'<g fill="none" stroke="#fff0b9" stroke-width="3" stroke-linecap="round"><path d="M15 8H49M15 56H49M19 9C18 24 24 26 30 32C23 37 18 42 19 55M45 9C46 24 40 26 34 32C41 37 46 42 45 55"/></g><path d="M22 17H42L32 28ZM22 51L32 39L42 51Z" fill="#ffdc77"/><path d="M32 28V40" stroke="#fff1ad" stroke-width="2"/>',
 'wind':'<g fill="none" stroke="#e4dcff" stroke-width="4" stroke-linecap="round"><path d="M8 30H42C57 30 57 10 44 10C37 10 34 16 37 20M5 38H49C62 38 59 55 49 54M12 46H29C40 46 40 61 30 59M12 21H25"/></g>'
}
colors={'fire':('#ba4827','#56201d','#ffbe65'),'ice':('#247d8c','#123d4a','#9cf4ff'),'slow':('#927224','#453016','#ffeaa0'),'wind':('#635095','#2c2447','#d7bfff')}
for name,(c,d,l) in colors.items():
 glyph=glyphs[name]
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="166" viewBox="0 0 128 166"><defs><linearGradient id="cover" x2="1" y2="1"><stop stop-color="{c}"/><stop offset=".55" stop-color="{d}"/><stop offset="1" stop-color="{c}"/></linearGradient><linearGradient id="gold" x2=".7" y2="1"><stop stop-color="#fae1a3"/><stop offset=".4" stop-color="#97703b"/><stop offset=".65" stop-color="#e4bf74"/><stop offset="1" stop-color="#6c4926"/></linearGradient><radialGradient id="glow"><stop stop-color="#fff1a6"/><stop offset="1" stop-color="{l}"/></radialGradient><filter id="shadow" x="-.3" y="-.3" width="1.6" height="1.6"><feDropShadow dx="0" dy="6" stdDeviation="4" flood-opacity=".55"/></filter><pattern id="leather" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0L2 2M3 4L5 3" stroke="#fff" stroke-opacity=".065" stroke-width=".6"/></pattern></defs><g filter="url(#shadow)"><path d="M18 8L104 5L116 14V150L29 158L14 149V19Z" fill="#251b15"/><path d="M102 11L114 17V145L28 153V144L102 135Z" fill="#ccb485"/><path d="M30 146L110 138M30 149L110 142" stroke="#826540" stroke-width="1"/><path d="M17 12L102 6V139L17 149Q9 147 10 139V21Q10 14 17 12Z" fill="url(#cover)" stroke="#281b13" stroke-width="2"/><path d="M18 13L27 12V146L17 148Z" fill="#000" opacity=".24"/><path d="M29 11L99 9V136L29 143Z" fill="url(#leather)"/><path d="M32 17L95 14V130L32 136Z" fill="none" stroke="url(#gold)" stroke-width="1.4"/><path d="M37 22L90 19V126L37 131Z" fill="none" stroke="{l}" stroke-opacity=".25"/><path d="M16 36L26 34M16 42L26 40M16 115L26 113M16 121L26 119" stroke="url(#gold)" stroke-width="3"/><path d="M30 13L42 12L30 26ZM96 12L85 13L96 26ZM31 138L44 136L31 124ZM96 132L83 134L96 121Z" fill="url(#gold)"/><path d="M64 39L88 70L64 104L40 72Z" fill="#09090d" opacity=".2" stroke="{l}" stroke-width=".6"/><g transform="translate(38 45) scale(.82)">{glyph}</g><path d="M47 115H82M51 119H77" stroke="url(#gold)" stroke-width="1"/></g></svg>'''
 (S/f'book-{name}.svg').write_text(svg)
 (A/f'book-{name}.svg').write_text(svg)
 # Also export a small standalone glyph for DOM; avoid relying on font glyphs.
 icon=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="glow"><stop stop-color="#fff1a6"/><stop offset="1" stop-color="{l}"/></radialGradient></defs>{glyph}</svg>'
 (A/f'icon-{name}.svg').write_text(icon)
# Stable paper texture (generated, not sampled from a third-party game).
rng=np.random.default_rng(17)
a=np.zeros((192,384,3),dtype=np.uint8)
for i,base in enumerate([246,234,195]):
 a[:,:,i]=np.clip(base+rng.normal(0,1.6,(192,384)),0,255)
Image.fromarray(a).save(A/'paper.webp',quality=90)
# Keep the exact approved quill mark through repeatable asset builds.
shutil.copyfile(S/'favicon.svg', A/'favicon.svg')
# The production score is authored separately: python3 scripts/compose_score.py
