#!/usr/bin/env python3
"""Standard-library-only launcher for the prebuilt game. Python 3.9+; no pip install."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Timer
import argparse, webbrowser, sys, json, hashlib
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg'}
    def end_headers(self):
        self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');super().end_headers()
    def log_message(self,format,*args):
        if args and str(args[1] if len(args)>1 else '') not in ['200','304']:
            super().log_message(format,*args)
def main():
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=4355);p.add_argument('--open',action='store_true');a=p.parse_args()
    if not 1024 <= a.port <= 65535:p.error('--port must be between 1024 and 65535')
    root=Path(__file__).resolve().parents[1]/'dist'
    if not (root/'index.html').exists():sys.exit('Missing dist/index.html. Run npm run build, or extract the full archive.')
    try:
        manifest=json.loads((root/'build-manifest.json').read_text())
        expected=json.loads((root.parent/'package.json').read_text())['version']
        if manifest['version']!=expected:raise ValueError('Version mismatch')
        if len(manifest['files'])<20:raise ValueError('Incomplete manifest')
        for item in manifest['files']:
            file=(root/item['path']).resolve()
            if root.resolve() not in file.parents:raise ValueError('Unsafe build path')
            data=file.read_bytes()
            if len(data)!=item['bytes'] or hashlib.sha256(data).hexdigest()!=item['sha256']:
                raise ValueError('Mixed/damaged file: '+item['path'])
    except (OSError,ValueError,KeyError) as error:
        sys.exit(f'Build verification failed: {error}. Re-extract the FULL ZIP or run npm run build.')
    server=None
    for port in range(a.port,min(a.port+11,65536)):
        try:server=ThreadingHTTPServer(('127.0.0.1',port),partial(Handler,directory=str(root)));break
        except OSError:continue
    if server is None:sys.exit('Could not find a free local port. Try --port 8090.')
    url=f"http://127.0.0.1:{port}/?build={manifest['buildId']}"
    print(f'\nTypekeeper: Enchanted Library v{manifest["version"]}\nBuild: {manifest["buildId"]}\nFolder: {root}\n{url}\nNo installation, login, or API key is needed.\nPress Ctrl+C to stop.\n',flush=True)
    if a.open:Timer(.5,lambda:webbrowser.open(url)).start()
    try:server.serve_forever()
    except KeyboardInterrupt:print('\nLibrary closed.')
    finally:server.server_close()
if __name__=='__main__':main()
