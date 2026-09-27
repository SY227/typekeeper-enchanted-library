#!/usr/bin/env python3
"""Release payload, cache graph and launcher checks on Linux. Not a macOS GUI test."""
from pathlib import Path
import json,hashlib,re,subprocess,tempfile,shutil,socket,time,urllib.request,os,ast
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'docs/qa';out.mkdir(exist_ok=True,parents=True);rows=[]
def check(name,fn):
 try:fn();row={'name':name,'status':'PASS'}
 except Exception as e:row={'name':name,'status':'FAIL','error':repr(e)}
 rows.append(row);print(row,flush=True)
manifest=json.loads((ROOT/'dist/build-manifest.json').read_text());build=manifest['buildId']
def graph():
 for p in (ROOT/'dist/src').rglob('*.js'):
  for relative in re.findall(r'\bfrom\s*[\'"](\.\.?/[^\'"]+)[\'"]',p.read_text()):
   assert relative.endswith('?v='+build),(p,relative)
   assert (p.parent/relative.split('?')[0]).resolve().is_file(),relative
 assert ('src/main.js?v='+build) in (ROOT/'dist/index.html').read_text()
 assert ('src/styles.css?v='+build) in (ROOT/'dist/index.html').read_text()
 assert json.loads((ROOT/'dist/release.json').read_text())['version']=='3.3.6'
check('Every static JS dependency and CSS entry carries the current content fingerprint',graph)
def integrity():
 assert manifest['version']=='3.3.6'
 for p in manifest['files']:
  b=(ROOT/'dist'/p['path']).read_bytes();assert len(b)==p['bytes'] and hashlib.sha256(b).hexdigest()==p['sha256'],p['path']
check('All prebuilt payloads match the distributed build manifest',integrity)
def grammar():
 for f in ['scripts/server.py','scripts/test-update.py']:
  ast.parse((ROOT/f).read_text(),feature_version=(3,9))
 for f in ['START_MAC.command','START_LINUX.sh','scripts/apply-update.sh']:
  subprocess.run(['bash','-n',str(ROOT/f)],check=True)
check('Launchers parse as Bash and server/updater scripts parse under Python 3.9 grammar',grammar)
def launcher(collision=False):
 blocker=None
 if collision:
  blocker=socket.socket();blocker.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);blocker.bind(('127.0.0.1',4355));blocker.listen(1)
 port=4356 if collision else 4355
 env={**os.environ,'BROWSER':'/bin/true'}
 with tempfile.TemporaryDirectory() as cwd:
  p=subprocess.Popen(['bash',str(ROOT/'START_MAC.command')],cwd=cwd,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
  try:
   result=None
   for _ in range(90):
    if p.poll() is not None:raise AssertionError(p.stdout.read())
    try:
     with urllib.request.urlopen(f'http://127.0.0.1:{port}/release.json',timeout=.1)as r:
      assert r.headers['Cache-Control']=='no-store';result=json.loads(r.read());break
    except (OSError,ValueError):time.sleep(.05)
   assert result and result['buildId']==build
  finally:
   p.terminate();log=p.communicate(timeout=5)[0];(out/('launcher-collision.log'if collision else'launcher-default.log')).write_text(log)
   if blocker:blocker.close()
  assert 'v3.3.6' in log and str(ROOT/'dist') in log
check('Actual START_MAC.command from an unrelated working directory serves v3.3.6 on its new port',launcher)
check('An occupied default port cannot silently reopen the old game',lambda:launcher(True))
def reject_mixed(kind):
 with tempfile.TemporaryDirectory()as tmp:
  root=Path(tmp)/'game';root.mkdir();shutil.copytree(ROOT/'dist',root/'dist');shutil.copytree(ROOT/'scripts',root/'scripts');shutil.copytree(ROOT/'src',root/'src');shutil.copy2(ROOT/'package.json',root/'package.json')
  bad=root/'dist/src/render/presentation.js';bad.write_text(bad.read_text()+'\n// a stale or damaged artifact\n')
  cmd=['python3','scripts/server.py'] if kind=='python'else['node','scripts/serve.mjs']
  p=subprocess.run(cmd,cwd=root,text=True,capture_output=True,timeout=10)
  assert p.returncode!=0;assert 'Mixed/damaged' in p.stderr+p.stdout
check('Python launcher rejects a mixed/corrupted prebuilt renderer before serving it',lambda:reject_mixed('python'))
check('Node launcher rejects a mixed/corrupted prebuilt renderer before serving it',lambda:reject_mixed('node'))
report={'scope':__doc__,'version':'3.3.6','buildId':build,'tests':rows,'passed':sum(x['status']=='PASS'for x in rows),'failed':sum(x['status']=='FAIL'for x in rows)};(out/'release-audit.json').write_text(json.dumps(report,indent=2));assert report['failed']==0
