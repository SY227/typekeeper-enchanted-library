#!/bin/bash
set -e
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  exec python3 scripts/server.py --open
elif command -v node >/dev/null 2>&1; then
  exec node scripts/serve.mjs --open
else
  printf '\nThis launcher needs Python 3 or Node.js. Neither was found.\nOpen PLAY.html directly to play without Python or Node.\n'
  read -r -p 'Press Return to close.'
fi
