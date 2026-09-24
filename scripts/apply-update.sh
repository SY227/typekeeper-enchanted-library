#!/bin/bash
set -euo pipefail
SOURCE="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-$HOME/Downloads/Typekeeper_Enchanted_Library_v3_1}"
command -v python3 >/dev/null 2>&1 || { printf 'Python 3 is required for the backup-first updater. The standalone PLAY.html needs no installation.\n'; exit 1; }
python3 - "$SOURCE" "$TARGET" <<'PY'
from pathlib import Path
import datetime,json,shutil,sys
source=Path(sys.argv[1]).resolve();target=Path(sys.argv[2]).expanduser().resolve()
if not target.is_dir():raise SystemExit(f'Existing project not found: {target}\nExtract the new ZIP and run its launcher to play in a separate folder instead.')
if target==source or target in source.parents or source in target.parents:raise SystemExit('Source and target must be separate project folders; nothing was changed.')
try:identity=json.loads((target/'package.json').read_text()).get('name')
except (ValueError,OSError):identity=None
if identity!='typekeeper-enchanted-library' or not (target/'index.html').is_file():raise SystemExit('Target is not an existing Typekeeper project. Nothing was changed.')
def protected(path):
 return any(p in {'.git','.vercel','node_modules','__pycache__','.DS_Store'} or p.startswith('.env') or p.startswith('.typekeeper-update-') or p.endswith('.pyc') for p in path.parts)
files=[]
for file in source.rglob('*'):
 rel=file.relative_to(source)
 if protected(rel) or not file.is_file():continue
 if file.is_symlink():raise SystemExit(f'Symlink found in release: {rel}. Nothing was changed.')
 dest=target/rel
 if rel.as_posix()=='vercel.json' and dest.exists():continue
 if dest.is_symlink() or not dest.resolve().is_relative_to(target):raise SystemExit(f'Unsafe symlink destination: {rel}. Nothing was changed.')
 files.append((file,dest))
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
backup=target.parent/'Typekeeper_Backups'/f'{target.name}_{stamp}'
backup.parent.mkdir(parents=True,exist_ok=True)
print(f'Backing up game files to: {backup}',flush=True)
shutil.copytree(target,backup,symlinks=True,ignore=lambda folder,names:[n for n in names if protected(Path(n))])
try:
 for file,dest in files:
  dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,dest)
except OSError as error:
 raise SystemExit(f'Update stopped: {error}\nYour complete pre-update game backup remains at {backup}. Do not deploy until restored or rerun.')
(target/'.typekeeper-update-last.json').write_text(json.dumps({'version':'3.2.0','backup':str(backup),'filesCopied':len(files)},indent=2)+'\n')
print(f'Updated {len(files)} files in: {target}')
print('Preserved .git, .vercel, environment files and your existing vercel.json. No remote writes were made.')
print('Run npm test and npm run build in that folder, then commit and push when ready.')
PY
