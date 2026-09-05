#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../app"
npm run build
if [ -d ios ] || [ -d android ]; then npx cap sync; else echo "ilk kez: npx cap add ios && npx cap add android"; fi
echo "✓ build tamam → app/dist"
