#!/usr/bin/env bash
# AURORA-PILOT-001 — iki aşamalı, güç analizine göre boyutlandırılmış kişisel pilot.
#
#   Aşama 1 (tarama):    3 koşul × 10 deneme = 30 deneme, MDE d≈1.4
#   Aşama 2 (doğrulama): 2 koşul × 26 deneme = 52 deneme, d=0.8'de %80 güç
#
# Kullanım:  bash scripts/pilot.sh [stage1|stage2|audio|power]
set -euo pipefail
cd "$(dirname "$0")/../engine" && . .venv/bin/activate
OUT=out/pilot; mkdir -p "$OUT"
CMD="${1:-stage1}"

case "$CMD" in
  power)
    echo "── Güç analizi ──"
    aurora power --conditions 3 --effect 1.4 --table-n 5 10 15 20 26 35
    aurora power --conditions 2 --effect 0.8 --table-n 10 20 26 35
    ;;

  audio)
    echo "── Ses dosyaları (10 dk, 48 kHz) ──"
    for f in 432 528; do
      [ -f "$OUT/${f}hz_10min.wav" ] || aurora tone "$f" --seconds 600 --output "$OUT/${f}hz_10min.wav"
    done
    aurora protocols 432 528 639 --minutes 5 8 13 --seed 7 > "$OUT/protocols.json"
    echo "  Sessizlik kontrolü: uygulama içinde üretilir (WAV gerekmez)."
    du -sh "$OUT"
    ;;

  stage1)
    echo "── AŞAMA 1: tarama (3 koşul × 10 tekrar) ──"
    aurora make-study --study-id AURORA-PILOT-001-S1 --config configs/pilot_stage1.json \
      --repetitions 10 --seed 42 --primary calm \
      --exclusion "Eksik pre/post dışlanır; %80 altı süre dışlanır; günde en fazla 2 deneme" \
      --freeze --output "$OUT/stage1_trials.csv"
    echo
    echo "→ $OUT/stage1_trials.csv hazır (30 randomize kör deneme)."
    echo "→ Oturumları uygulamadan veya CSV'yi elle doldurarak tamamla, sonra:"
    echo "     aurora stats $OUT/stage1_trials.csv --outcome calm --control D"
    echo "→ UYARI: Aşama 1 yalnızca d≈1.4+ etkileri yakalar. 'Etki yok' sonucu KANIT DEĞİLDİR."
    ;;

  stage2)
    echo "── AŞAMA 2: doğrulama (2 koşul × 26 tekrar) ──"
    echo "   Ön koşul: Aşama 1 tamamlanmış ve unblind edilmiş olmalı."
    aurora make-study --study-id AURORA-PILOT-001-S2 --config configs/pilot_stage2.json \
      --repetitions 26 --seed 4242 --primary calm \
      --exclusion "Eksik pre/post dışlanır; %80 altı süre dışlanır; günde en fazla 2 deneme" \
      --correction none_prespecified --freeze --output "$OUT/stage2_trials.csv"
    echo
    echo "→ $OUT/stage2_trials.csv hazır (52 deneme, tek karşılaştırma)."
    echo "→ Başarı ölçütü: p<0.05 VE |d|>=0.5 VE %95 GA sıfırı içermiyor."
    ;;

  *) echo "Kullanım: pilot.sh [stage1|stage2|audio|power]"; exit 1 ;;
esac
