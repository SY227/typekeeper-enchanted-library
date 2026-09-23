# Optional Unreal / Blender authoring handoff

**These two scripts are supplied source helpers, not tools used to render or test the delivered game.** Neither application is installed in the delivery environment. Python syntax was checked; application execution was not. They are deliberately outside the normal build. The complete tested app remains browser-native Canvas 2D.

## Blender expression-review scene

`blender/create_expression_review.py` creates a fresh orthographic scene containing the seven registered expression PNGs as emissive 2D planes. Each expression occupies 24 timeline frames. It saves a new timestamped `.blend` and renders one PNG per expression, with embedded artwork and transparency. This is an editable review/paintover bridge, not a 3D character rig.

On a Mac with Blender installed at the conventional location, from the project root:

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python tools/blender/create_expression_review.py
```

The script writes only under `tools/blender/output/<timestamp>/`. The existing game assets are not replaced. Review the resulting images before any manual export back into `asset-source/expressions/`.

## Unreal artwork import

Enable Unreal's **Python Editor Script Plugin**, open the intended project, then execute `unreal/import_artwork.py` using the editor's Python-script command. It imports the two illustration masters and seven expression PNGs into a **new timestamped** `/Game/Typekeeper_Imports/...` folder. Existing content is not overwritten. This changes the currently open Unreal project's Content directory only when you explicitly run it.

This is **not an Unreal port**: there is no packaged Unreal executable, game Blueprint, native simulation, `.uproject`, or streaming backend in this handoff. An Unreal game runtime would be a separate project. The built-in Pixel Streaming route described by Epic runs Unreal on a host and sends frames/input through a browser; that is not the offline static deployment model of this release.

## Documentation consulted / compatibility boundary

Epic's own sample demonstrates `AssetImportTask` and `AssetToolsHelpers.get_asset_tools().import_asset_tasks`. The versioned 5.6 API documents these properties; the user's exact editor build was not tested. Blender's documented scene/material/render operators inform the helper; its actual installed-version behavior remains unverified.

- Epic sample: https://github.com/EpicGames/PythonSamples/blob/main/scripts/ImportExport/Asset_Import_task.py
- Epic AssetImportTask: https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/AssetImportTask?application_version=5.6
- Epic Pixel Streaming: https://dev.epicgames.com/documentation/unreal-engine/pixel-streaming-in-unreal-engine
- Blender Python API: https://docs.blender.org/api/current/

Do not count either helper as executed validation or advertise the shipped browser game as built in Unreal or Blender.
