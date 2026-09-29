#!/usr/bin/env python3
"""Verify actual loopback HTTP bytes/headers separately from browser transport."""
from pathlib import Path
import subprocess,time,hashlib,json,urllib.request,urllib.error
root=Path(__file__).resolve().parents[1];out=root/'qa360';out.mkdir(exist_ok=True)
manifest=json.loads((root/'dist/build-manifest.json').read_text());results=[]
for kind,cmd,port in [('node',['node','scripts/serve.mjs','--port','4491'],4491),('python',['python3','scripts/server.py','--port','4492'],4492)]:
 with (out/f'http-{kind}.log').open('w')as log:
  proc=subprocess.Popen(cmd,cwd=root,stdout=log,stderr=subprocess.STDOUT)
  try:
   for i in range(60):
    try:
     urllib.request.urlopen(f'http://127.0.0.1:{port}/release.json',timeout=.2).close();break
    except OSError:time.sleep(.05)
   else:raise RuntimeError('Server did not start')
   files=[]
   for row in manifest['files']:
    with urllib.request.urlopen(f'http://127.0.0.1:{port}/'+row['path'],timeout=5)as response:
     data=response.read();assert hashlib.sha256(data).hexdigest()==row['sha256'],row['path'];assert len(data)==row['bytes'];assert response.headers['Cache-Control']=='no-store';assert response.headers['X-Content-Type-Options']=='nosniff'
     if row['path'].endswith('.js'):assert 'javascript' in response.headers['Content-Type']
     files.append(row['path'])
   with urllib.request.urlopen(urllib.request.Request(f'http://127.0.0.1:{port}/index.html',method='HEAD'))as response:assert not response.read();assert int(response.headers['Content-Length'])==(root/'dist/index.html').stat().st_size
   try:urllib.request.urlopen(f'http://127.0.0.1:{port}/definitely-missing.js');raise AssertionError('Missing resource was not a 404')
   except urllib.error.HTTPError as e:assert e.code==404
   results.append({'server':kind,'files':len(files),'hashes':'all match','cacheControl':'no-store','MIME':'JS valid','HEAD':'pass','missing':'404'})
  finally:proc.terminate();proc.wait(timeout=5)
report={'scope':__doc__,'version':'3.6.2','buildId':manifest['buildId'],'results':results};(out/'http-payloads.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
