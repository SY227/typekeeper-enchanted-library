"""OPTIONAL / NOT EXECUTED IN DELIVERY ENVIRONMENT.
Imports PNG masters into a NEW timestamped Unreal content folder.
Requires an open project and Python Editor Script Plugin. It DOES NOT create a
playable Unreal game, map, Blueprint, or Pixel Streaming service.
Run via Unreal's Tools > Execute Python Script, or its Python console.
"""
from pathlib import Path
from datetime import datetime, timezone
import json
try:
 import unreal
except ImportError as exc:
 raise SystemExit('Run this optional import inside Unreal Editor with its Python plugin enabled.') from exc
ROOT=Path(__file__).resolve().parents[2]
files=[ROOT/'asset-source/library-master.png',ROOT/'asset-source/typist-master.png']
files+=sorted((ROOT/'asset-source/expressions').glob('*.png'))
for file in files:
 if not file.is_file():raise FileNotFoundError(str(file))
stamp=datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S_%f')
destination=f'/Game/Typekeeper_Imports/Import_{stamp}'
tasks=[]
for file in files:
 task=unreal.AssetImportTask()
 task.set_editor_property('filename',str(file))
 task.set_editor_property('destination_path',destination)
 task.set_editor_property('automated',True)
 task.set_editor_property('replace_existing',False)
 task.set_editor_property('save',True)
 tasks.append(task)
unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks(tasks)
report=[]
for task in tasks:
 paths=list(task.get_editor_property('imported_object_paths'))
 report.append({'source':task.get_editor_property('filename'),'imported':paths})
 if not paths:unreal.log_warning('No import result: '+task.get_editor_property('filename'))
unreal.log('Typekeeper artwork import: '+destination)
unreal.log(json.dumps(report,indent=2))
