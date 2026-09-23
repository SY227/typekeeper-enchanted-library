#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then exec python3 scripts/server.py --open; fi
if command -v node >/dev/null 2>&1; then exec node scripts/serve.mjs --open; fi
printf 'Python 3 or Node.js is required for the local server. No package installation is needed.\n'
