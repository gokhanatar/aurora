# AURORA — Uygulama Planı

## Faz 0 — Temel (bu oturum) ✅
- [x] ChatGPT sohbeti okundu, gereksinimler çıkarıldı
- [x] docs/DESIGN.md, PLAN.md, ARCHITECTURE.md, EXPERIMENT_PROTOCOL.md, DATA_MODEL.md
- [x] engine/ Python paketi: math, acoustics, scoring, sequence, experiment, stats, chladni, discovery, corpus, cli + testler
- [x] engine/data/corpus.json — Mezopotamya + Mısır + Yunan + Vedik + İbrani ana veri seti (kanıt seviyeli)
- [x] app/ Capacitor + React + Vite + TS iskeleti, i18n (tr/en), 7 ekran, Web Audio, Canvas görselleştirme, IndexedDB/localStorage repo
- [x] scripts/ setup, demo, build

## Faz 1 — Altyapı ✅ + Pilot yürütme
- [x] **Güç motoru** (`aurora power`, `core/power.ts`) — tasarım kararlarını veriye bağladı
- [x] **İki aşamalı pilot tasarımı**: S1 tarama 3×10 (MDE d≈1.4), S2 doğrulama 2×26 (d=0.8 → %80 güç)
- [x] iOS + Android platformları, ikon/splash (528 Hz Chladni modundan), Privacy Manifest, targetSdk 36, offline (INTERNET izni yok)
- [x] Python ↔ TypeScript eşdeğerlik doğrulaması (`scripts/parity.sh`, 19 değer)
- [x] Uçtan uca hat testi: gerçek etki yakalanıyor, sahte etki eleniyor
- [ ] Pilot oturumlarının yürütülmesi: `bash scripts/pilot.sh stage1` (30 deneme)
- [ ] Journal 30 gün
- [ ] Engine: `aurora stats` ile CSV analizi; app içi sonuç ekranı ile çapraz kontrol
- [ ] Chladni düzeneği (20×20 cm çelik levha, hoparlör/şok uyarıcı) → 10 fotoğraf → fingerprint doğrulaması

## Faz 2 — v2 Motorlar
- [ ] Ancient Text Engine (PDF/OCR → sayı madenciliği, `engine/aurora/textmining.py` iskeleti)
- [ ] Bayesian hierarchical model (PyMC) — kişi bazlı etki
- [ ] Physiological ingest (Apple Health HRV export CSV)
- [ ] Pattern clustering (görüntü embedding → k-means) ve octave-pattern hipotezi testi

## Faz 3 — Platform
- [ ] Çok katılımcılı çalışma (anonim id, sunucu), Discovery/Validation seti otomasyonu
- [ ] Replication registry ve evidence grade
- [ ] Store yayını: `/deploy` (bundle id: `org.auroraproject.app`)

## Başarı kriterleri
- Tüm metinler i18n'den; testler yeşil (`pytest`, `vitest`); `npm run build` başarılı; `npx cap sync` çalışır
- Deney ekranı koşul Hz'ini unblind'a kadar göstermez (test edildi)
- Hiçbir ekranda terapötik/metafizik iddia yok
