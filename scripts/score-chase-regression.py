#!/usr/bin/env python3
"""Serial regression on built shipping bytes; one Chromium process at a time."""
from pathlib import Path
import subprocess,json,time,sys,hashlib
root=Path(__file__).resolve().parents[1];out=root/'qa360';out.mkdir(exist_ok=True)
commands=[]
for suite in ['clarity_mastery_tests','chapter_art_tests','scroll_repair_tests','book_leaf_tests','single_row_release','ui_spacing_tests']:
 for mode in ['standalone','modules']:
  commands.append((f'{suite}-{mode}',['python3',f'e2e/{suite}.py','--mode',mode]))
for mode in ['standalone','modules']:
 commands.append((f'flow-{mode}',['python3','e2e/flow_tests.py','--root',str(root),'--mode',mode,'--out',str(out)]))
commands.extend([
 ('performance',['python3','e2e/feedback_performance.py','--executable','/usr/bin/chromium']),
 ('http-payload',['python3','scripts/http-payload-audit.py']),
 ('launcher',['python3','scripts/release-audit.py']),
 ('updater',['python3','scripts/test-update.py']),
])
rows=[]
for label,command in commands:
 before=time.monotonic();print('START',label,flush=True)
 with (out/f'{label}.log').open('w') as log:
  try:r=subprocess.run(command,cwd=root,stdout=log,stderr=subprocess.STDOUT,timeout=420);code=r.returncode
  except subprocess.TimeoutExpired:code=124
 rows.append({'label':label,'command':command,'returncode':code,'seconds':round(time.monotonic()-before,3)})
 (out/'regression-commands.json').write_text(json.dumps({'shippingSHA256':hashlib.sha256((root/'PLAY.html').read_bytes()).hexdigest(),'commands':rows},indent=2))
 print('DONE',label,code,rows[-1]['seconds'],flush=True)
print('FAILURES',sum(r['returncode']!=0 for r in rows),flush=True)
sys.exit(1 if any(r['returncode'] for r in rows) else 0)
