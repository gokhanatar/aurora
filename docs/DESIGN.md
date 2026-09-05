# AURORA — Ürün Tasarımı

> Ancient Numerical Harmonics & Human Response
> **"İnanca göre değil, veriye göre frekans keşfet."**

## 1. Ne işe yarar?

AURORA, "şifa/özel frekans" iddialarını (432, 528, Solfeggio, antik sayılar…) doğru kabul etmek yerine
**test edilebilir hipotezlere** çeviren bir araştırma uygulamasıdır. Kullanıcı:

1. Herhangi bir frekansı **analiz eder** (matematik, oran, harmonik, nota, Chladni simülasyonu).
2. Antik kaynaklardan (Pisagor, Platon, Sümer, Mısır, Vedik, İbrani) gelen sayılardan **aday frekanslar ve sekanslar üretir**.
3. Bu adayları **kör, randomize** kişisel deneylerde dinler; öncesi/sonrası puan verir.
4. 30 günlük **günlük** tutar ("şansım açıldı" hissini ölçülebilir olaylara çevirir).
5. Sonuçları **istatistiksel** olarak görür: etki büyüklüğü, güven aralığı, çoklu karşılaştırma uyarısı.
6. Fiziksel Chladni deneyi fotoğrafını çekip **desen parmak izi** çıkarır ve frekansla eşleştirir.
7. Keşif motoru (evrimsel + anomali) yeni aday üretir → tekrar test.

### Tasarım ilkeleri (sohbetten çıkan, değişmez)

| İlke | Uygulamada karşılığı |
|---|---|
| AI hakem değil, araçtır | Hiçbir ekranda "şifalı/enerjisi yüksek" yazmaz; sadece ölçülen özellik ve etki |
| Kanıt seviyesi etiketi | Her sayı/frekans: `DIRECT / DERIVED / INTERPRETIVE / SPECULATIVE` |
| Gerçek ≠ Simülasyon | Chladni: `SIMULATION` ve `REAL MEASUREMENT` rozetleri ayrı |
| Körleme | Deney sırasında koşul adı "A/B/C/D"; gerçek Hz deney bitene kadar gizli |
| Önceden kayıt | Deney başlatmadan primary outcome + koşullar dondurulur (preregistration) |
| Çoklu karşılaştırma | Discovery / Validation seti ayrımı; Bonferroni uyarısı |
| Frekans ≠ tek sayı | Stimulus = frekans + süre + sıra + geçiş + tekrar + waveform |
| Güvenlik | Amplitüd sınırı, 20–20 000 Hz, ultrason yok, tıbbi iddia yok |

## 2. Ekranlar (mobil, alt sekme + stack)

```
┌ Tabs ─────────────────────────────────────────────────────┐
│ Home │ Library │ Sequence │ Experiment │ Journal │ Lab      │
└───────────────────────────────────────────────────────────┘
```

### 2.1 Home — Frekans Kartı
```
┌───────────────────────────────┐
│       AURORA FREQUENCY        │
│          528.000 Hz           │  ← büyük sayı, slider + input
│       ╭──────────────╮        │
│       │   CHLADNI    │        │  ← canlı simülasyon (SIMULATION rozeti)
│       │   PATTERN    │        │
│       ╰──────────────╯        │
│  Waveform  ~~/\/\/\/\~~       │  ← canvas, gerçek zamanlı
│  Spectrum  ▂▃▂▅▂████▂▃▂▂      │  ← AnalyserNode FFT
│  Math  ████████  Hist ██      │  ← AURORA DNA barları
│  [▶ Play] [Analyze] [+Library]│
└───────────────────────────────┘
```
- Web Audio `OscillatorNode` (sine/triangle/square/saw), gain ≤ 0.2, 20 ms fade.
- Waveform: `AnalyserNode.getFloatTimeDomainData`; Spectrum: `getByteFrequencyData`.
- Chladni simülasyonu: kare levha modal formülü `cos(nπx/L)cos(mπy/L) − cos(mπx/L)cos(nπy/L)`; (n, m) frekanstan türetilir. **Her zaman SIMULATION etiketi.**

### 2.2 Analyze (Home → Analyze)
Kartlar: Tam sayı / asal / çarpanlar / rakam toplamı / dijital kök; en yakın nota (A4=440 ve A4=432 ikisi de); referans oranlara **cent** uzaklığı (2:1, 3:2, 4:3, 9:8, 5:4, 6:5); harmonik serisi (1x–8x); oktav sınıfı; corpus'ta geçen sayılar (kanıt seviyesi rozetli); **Exploratory Score** (Math + Historical) ve uyarı metni.

### 2.3 Library — Aday Kütüphanesi
Liste: popüler adaylar (174…963, 432), corpus türevi adaylar (432×3/2=648 vb.), kullanıcı adayları, Discovery'den gelenler. Filtre: kaynak / kanıt seviyesi / puan. Her satır: Hz, DNA mini-bar, kaynak rozeti, `hypothesis_status` (candidate / tested / validated / rejected).

### 2.4 Sequence Builder — Akustik Protokol
Adımlar: frekans + süre (dk) + geçiş boşluğu; tekrar sayısı; waveform. Hazır şablonlar: `A: 432→528→639 / 5-8-13 dk`, `B: ters`, `C: tek frekans`, `D: rastgele`, `E: sessizlik`. JSON fingerprint gösterilir, kaydedilir, oynatılır.

### 2.5 Experiment — Kör Deney
1. **Kurulum (preregistration):** primary outcome (calm/energy/focus), koşullar (protokoller), tekrar sayısı, tohum. "Dondur" → değiştirilemez.
2. **Oturum:** Koşul "B" (Hz gizli) → pre 0–10 (enerji, huzur, odak, motivasyon, uykululuk, huzursuzluk) → dinle → post → not.
3. **Sonuçlar (unblind):** koşul bazlı ortalama Δ, %95 CI, Cohen's d, eşleştirilmiş test, Bonferroni uyarısı; discovery/validation etiketi.

### 2.6 Journal — 30 Gün
Günlük: mood, energy, new_opportunity, positive_interaction, business_lead, unexpected_positive_event, goal_completion, social_interaction + o gün dinlenen protokol. Grafik: gün × metrik; korelasyon (exposure vs. sonraki gün davranış) — "nedensellik değil" uyarısı.

### 2.7 Lab — Chladni Analyzer & Discovery
- **Chladni Analyzer:** kamera/galeri → gri → eşik → desen izolasyonu → fingerprint (simetri, radyal simetri, karmaşıklık, yoğunluk, düğüm sayısı, baskın açı) → Hz + levha parametreleri (şekil, boyut, kalınlık, malzeme, uyarım noktası) ile kaydet → benzerlik karşılaştırma (%). Rozet: **REAL MEASUREMENT**.
- **Resonance Map:** frekans × pattern_complexity scatter.
- **Discovery:** evrimsel arama (mutasyon ± cent, kombinasyon), anomali (z-score) → yeni aday listesi → Library'ye "candidate" olarak ekle.

## 3. Görsel dil
- Koyu zemin (#0B0F19), aurora degrade vurgu (teal→mor), monospace sayı (Hz), yumuşak kartlar.
- Rozet renkleri: DIRECT yeşil, DERIVED mavi, INTERPRETIVE sarı, SPECULATIVE gri; SIMULATION mor, REAL turkuaz.
- Tüm metinler `src/i18n/tr.json` + `en.json` (hardcoded string yok).

## 4. Kapsam dışı (v1)
Bulut senkron, hesap, HRV/Apple Watch entegrasyonu (v2), gerçek zamanlı çok kullanıcılı çalışma, PDF/OCR antik metin motoru (v2, Python tarafında iskelet var).
