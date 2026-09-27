#!/bin/bash
set -euo pipefail
exec bash "$(dirname "$0")/scripts/apply-update.sh" "${1:-$HOME/Downloads/Typekeeper_Enchanted_Library_v3_1}"
