#!/usr/bin/env bash
# Motor demo: analiz → eşleştirme → ton → sekans → spektrum → chladni → çalışma → istatistik
set -euo pipefail
cd "$(dirname "$0")/../engine" && . .venv/bin/activate
mkdir -p out
aurora analyze 528 | head -30
aurora match 648 432
aurora tone 528 --seconds 3 --output out/528.wav
aurora analyze-audio out/528.wav | head -12
aurora sequence 432 528 639 --minutes 0.05 0.05 0.05 --output out/seq.wav | head -8
aurora chladni 528 --output out/chl528.png
aurora corpus structure | head -20
aurora make-study --config configs/example_experiment.json --repetitions 3 --seed 42 --freeze --output out/trials.csv
aurora simulate-trials out/trials.csv
aurora stats out/trials.csv --outcome calm --control D | head -40
aurora evolve 432 528 639 --generations 2 | tail -20
echo "✓ demo tamam → engine/out/"
