#!/usr/bin/env bash
# AURORA kurulum: Python motoru + uygulama
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/engine"
[ -d .venv ] || python3 -m venv .venv
. .venv/bin/activate
pip -q install -e ".[dev,image]"
python -m pytest -q
cd "$ROOT/app"
npm install --no-audit --no-fund
npm test
echo "✓ AURORA kurulumu tamam"
