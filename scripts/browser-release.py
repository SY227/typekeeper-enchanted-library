#!/usr/bin/env python3
"""Run the 3.5 release browser suites. Requires Python Playwright + Chromium.
This uses actual release code with in-memory test transport, not a human playtest.
"""
from pathlib import Path
import argparse,json,subprocess,sys,time
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser()
p.add_argument('--mode',choices=['standalone','modules','both'],default='both')
p.add_argument('--executable',default='/usr/bin/chromium')
a=p.parse_args();rows=[]
for mode in (['standalone','modules'] if a.mode=='both' else [a.mode]):
 for suite in ['clarity_mastery_tests','chapter_art_tests','scroll_repair_tests','book_leaf_tests','single_row_release','flow_tests']:
  cmd=[sys.executable,str(root/'e2e'/f'{suite}.py'),'--mode',mode,'--executable',a.executable]
  if suite=='flow_tests':cmd+=['--root',str(root),'--out',str(root/'qa360')]
  print('\n=== '+suite+' / '+mode+' ===',flush=True);start=time.monotonic()
  result=subprocess.run(cmd,cwd=root)
  rows.append({'suite':suite,'mode':mode,'exit':result.returncode,'seconds':round(time.monotonic()-start,2)})
  if result.returncode:
   print('Release gate failed. Inspect the suite output; do not count this as a pass.',file=sys.stderr);break
 if rows[-1]['exit']:break
out=root/'qa360';out.mkdir(exist_ok=True);(out/'browser-release-repeat.json').write_text(json.dumps(rows,indent=2)+'\n')
raise SystemExit(int(any(x['exit'] for x in rows)))
