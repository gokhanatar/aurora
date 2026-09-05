# ARCHITECTURE — AURORA

- **App adı:** AURORA — Frequency Discovery
- **Bundle ID:** org.auroraproject.app
- **Stack:** Capacitor 6 + React 18 + Vite 5 + TypeScript; react-i18next; Web Audio API; Canvas 2D; Dexie yok → basit IndexedDB repo (`app/src/data/repo.ts`)
- **Motor:** Python 3.11+ paketi `engine/aurora` (numpy, scipy; opsiyonel pillow, scikit-learn)
- **Auth / Ödeme:** yok (v1)
- **i18n:** `app/src/i18n/{tr,en}.json` — primary tr

## Dizin
```
.
├── ARCHITECTURE.md
├── docs/            DESIGN, PLAN, DATA_MODEL, EXPERIMENT_PROTOCOL, CORPUS
├── engine/          Python araştırma motoru
│   ├── aurora/      models, math_analysis, acoustics, scoring, sequence,
│   │                experiment, stats, chladni, discovery, corpus, cli
│   ├── data/corpus.json
│   ├── configs/example_experiment.json
│   └── tests/
├── app/             Capacitor + React
│   └── src/
│       ├── audio/      engine.ts (Web Audio), analyser.ts
│       ├── core/       math.ts, scoring.ts, sequence.ts, stats.ts, chladni.ts, discovery.ts, corpus.ts
│       ├── data/       repo.ts (IndexedDB), types.ts, seed.ts
│       ├── screens/    Home, Analyze, Library, Sequence, Experiment, Journal, Lab
│       ├── components/ WaveformCanvas, SpectrumCanvas, ChladniCanvas, DnaBars, Badge, ...
│       └── i18n/       tr.json, en.json, index.ts
└── scripts/         setup.sh, engine-demo.sh, build-app.sh
```

## Veri akışı
```
corpus.json ─► candidates ─► analyze (math/ratio/harmonic) ─► score
                                 │
sequence builder ─► stimulus fingerprint ─► Web Audio render ─► blind trial
                                 │                                  │
                          chladni sim (SIMULATION)          pre/post ─► stats (Δ, CI, d, Bonferroni)
camera ─► pattern fingerprint (REAL) ─► pattern db ─► similarity      │
                                                             discovery (evolution/anomaly) ─► new candidates
```

## Komutlar
```
bash scripts/setup.sh          # python venv + npm install
bash scripts/engine-demo.sh    # motor demo (analyze/compare/tone/sequence/chladni/stats)
cd engine && pytest
cd app && npm run dev | npm test | npm run build && npx cap sync
```
