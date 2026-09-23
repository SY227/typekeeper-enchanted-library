"""Verify static server payloads without pretending this is a browser navigation test."""
from pathlib import Path
from urllib.request import urlopen,Request
from urllib.error import HTTPError
import json,hashlib,subprocess,time,socket,sys
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'dist/build-manifest.json').read_text())
def audit(command,port):
 proc=subprocess.Popen(command,cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  base=f'http://127.0.0.1:{port}'
  for _ in range(40):
   try:urlopen(base,timeout=1).close();break
   except Exception:time.sleep(.05)
  checks=[]
  for row in manifest['files']:
   with urlopen(base+'/'+row['path'],timeout=3) as response:
    data=response.read();mime=response.headers.get_content_type()
    ok=hashlib.sha256(data).hexdigest()==row['sha256'] and len(data)==row['bytes']
    if row['path'].endswith('.js'):ok=ok and mime in ['text/javascript','application/javascript']
    if row['path'].endswith('.mp3'):ok=ok and mime=='audio/mpeg'
    checks.append({'path':row['path'],'passed':ok,'mime':mime,'bytes':len(data)})
  with urlopen(Request(base+'/',method='HEAD')) as response:head=response.status==200 and response.read()==b''
  try:urlopen(base+'/definitely-not-a-game-asset');missing=False
  except HTTPError as error:missing=error.code==404
  return {'command':command,'filesChecked':len(checks),'allPayloadHashesMatch':all(x['passed'] for x in checks),'headOK':head,'missing404':missing,'checks':checks}
 finally:proc.terminate();proc.wait(timeout=5)
# Each check gets its own unoccupied loopback port.
def freeport():
 with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]
node_port,python_port=freeport(),freeport()
result={'scope':'HTTP bytes, MIME, HEAD, 404 only. This is not browser HTTP execution.','node':audit(['node','scripts/serve.mjs','--port',str(node_port)],node_port),'python':audit([sys.executable,'scripts/server.py','--port',str(python_port)],python_port)}
(ROOT/'docs/qa').mkdir(parents=True,exist_ok=True)
(ROOT/'docs/qa/http-integrity.json').write_text(json.dumps(result,indent=2))
assert all(result[k]['allPayloadHashesMatch'] and result[k]['headOK'] and result[k]['missing404'] for k in ['node','python'])
print('Node and Python servers: every build-manifest payload matches; MIME, HEAD, and 404 checks pass.')
