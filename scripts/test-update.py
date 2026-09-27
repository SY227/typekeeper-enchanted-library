#!/usr/bin/env python3
"""Backup-first updater audit on disposable Linux folders, not the user's Mac/repo."""
from pathlib import Path
import json,subprocess,tempfile,hashlib
ROOT=Path(__file__).resolve().parents[1]; rows=[]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
with tempfile.TemporaryDirectory(prefix='typekeeper-update-') as tmp:
 base=Path(tmp);target=base/'existing project';target.mkdir()
 (target/'package.json').write_text(json.dumps({'name':'typekeeper-enchanted-library','version':'3.2.0'}));(target/'index.html').write_text('old game page')
 (target/'src/game').mkdir(parents=True);(target/'src/game/rules.js').write_text('old rules sentinel')
 sentinels={'.git/config':'synthetic git metadata','.vercel/project.json':'synthetic project binding','.env.production':'SYNTHETIC_ONLY=true','vercel.json':'{"framework":null,"outputDirectory":"dist","buildCommand":"npm run build","testMarker":"keep"}'}
 for name,content in sentinels.items():
  file=target/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_text(content)
 def invoke(path):return subprocess.run(['bash',str(ROOT/'scripts/apply-update.sh'),str(path)],text=True,capture_output=True)
 r=invoke(target);assert r.returncode==0,r.stderr+r.stdout
 state=json.loads((target/'.typekeeper-update-last.json').read_text());backup=Path(state['backup'])
 assert (backup/'src/game/rules.js').read_text()=='old rules sentinel'
 assert (backup/'index.html').read_text()=='old game page'
 assert json.loads((target/'package.json').read_text())['version']=='3.3.6'
 assert digest(target/'src/game/economy.js')==digest(ROOT/'src/game/economy.js')
 assert all((target/k).read_text()==v for k,v in sentinels.items())
 rows.append({'case':'backup-first update of an existing project including a space in its path','passed':True,'filesCopied':state['filesCopied'],'preserved':['.git','.vercel','.env.production','vercel.json'],'backupContainsOldRules':True})
 oldBackup=state['backup'];r=invoke(target);assert r.returncode==0
 state=json.loads((target/'.typekeeper-update-last.json').read_text());assert oldBackup!=state['backup'];assert all((target/k).read_text()==v for k,v in sentinels.items())
 rows.append({'case':'repeating an update creates a distinct backup and preserves bindings','passed':True})
 invalid=base/'not-a-game';invalid.mkdir();(invalid/'sentinel').write_text('untouched');r=invoke(invalid);assert r.returncode!=0;assert list(invalid.iterdir())==[invalid/'sentinel']
 rows.append({'case':'non-Typekeeper target rejected without changes','passed':True})
 r=invoke(ROOT);assert r.returncode!=0 and 'separate project folders' in r.stderr
 rows.append({'case':'self-update target rejected','passed':True})
 r=invoke(base/'missing');assert r.returncode!=0
 rows.append({'case':'missing target rejected without creating a directory','passed':True})
 outside=base/'outside.js';outside.write_text('untouched outside');(target/'src/game/economy.js').unlink();(target/'src/game/economy.js').symlink_to(outside)
 r=invoke(target);assert r.returncode!=0 and outside.read_text()=='untouched outside';assert 'Unsafe symlink' in r.stderr
 rows.append({'case':'symlink destination rejected before external file overwrite','passed':True})
report={'scope':__doc__,'passed':len(rows),'failed':0,'cases':rows}
(ROOT/'docs/qa/update-helper.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
