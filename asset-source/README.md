# Editable production source

`library-master.png` and `typist-master.png` are the retained v1 illustration masters. Four book SVGs contain editable vector artwork. `library-nocturne-master.wav` is the synthesized music master; its source recipe is in `scripts/create_assets.py`.

`expressions/` contains seven aligned PNGs, the review contact sheet, and `rig.json`. The shared frame is 438×420. The variants are generated from one master through controlled deformation/inpainting/paintover in `scripts/create_expressions.py`. The browser separates upper and lower portions of that registered artwork for light motion and expression blending. This is a 2D cutout system, not a full 3D facial rig.

The ordinary game/build does not require these optional asset-generation libraries. To regenerate exports, install `scripts/asset-requirements.txt`, run `npm run assets`, then `npm run build`. Regeneration overwrites derived exports; back up edited sources first.

No font files, original publisher sprites, extracted YouTube frames, or externally downloaded game sounds are included. Optional Blender review / Unreal import scripts live in `tools/` and were not executed in the delivery environment.
