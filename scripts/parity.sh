#!/usr/bin/env bash
# Python motoru ile TypeScript motorunun aynı formülleri aynı sonuçla ürettiğini doğrular.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/engine" && . .venv/bin/activate
python "$ROOT/scripts/parity/py_ref.py" > /tmp/aurora_py_ref.json
cd "$ROOT/app"
npx vite-node "$ROOT/scripts/parity/ts_ref.mjs" > /tmp/aurora_ts_ref.json
cd "$ROOT/engine"
python "$ROOT/scripts/parity/compare.py" /tmp/aurora_py_ref.json /tmp/aurora_ts_ref.json
