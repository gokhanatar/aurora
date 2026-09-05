# AURORA — ANA PLAN (MASTER PLAN)

> Ancient Numerical Harmonics & Human Response
> **"İnanca göre değil, veriye göre frekans keşfet."**
>
> Bu belge projenin tek referansıdır: amaç, mimari, matematik, frekans üretimi, eşleştirme teknikleri,
> deney tasarımı, istatistik, Chladni, keşif motoru, uygulama kullanımı, script sistemi, yol haritası.

---

## 0. İÇİNDEKİLER

1. Amaç ve hipotezler
2. Bilimsel ilkeler (değişmez kurallar)
3. Sistem mimarisi ve dizin yapısı
4. Veri modeli ve kanıt seviyeleri
5. Antik kaynak veri seti (corpus)
6. Matematik motoru — tüm formüller
7. Frekans üretimi (Frequency Generator)
8. Ses motoru (Audio Engine) — dalga formları ve sentez
9. Spektral analiz (FFT, tepe bulma, özellik vektörü)
10. Frekans eşleştirme teknikleri (Matching Engine)
11. Sekans motoru (frekans + süre + sıra + tekrar)
12. Puanlama (AURORA Score / DNA)
13. Deney motoru (randomizasyon, körleme, önkayıt)
14. İstatistik motoru (Δ, CI, d, p, düzeltme, kanıt derecesi)
14.5 **Güç analizi (Power Engine) — deney başlamadan önce**
15. Chladni motoru (simülasyon + gerçek görüntü + parmak izi)
16. Keşif motoru (evrimsel arama, anomali, tarama, frekans grameri)
17. Metin madenciliği (v2)
18. Uygulama kullanım kılavuzu (ekran ekran)
19. Script sistemi — CLI komut referansı ve otomasyon akışları
20. Test ve doğrulama
21. Güvenlik
22. Yol haritası (Faz 0–3)
23. Sözlük

---

## 1. AMAÇ VE HİPOTEZLER

### 1.1 Çıkış noktası (sohbetten)
"432/528 Hz denedim, işe yaramadı. Belki gizli bir sistem var: antik metinlerde sayı → oran → frekans → sıra → süre şeklinde bir kod. Belki tek bir frekans değil, art arda farklı frekansları farklı sürelerde dinlemek gerekiyor. AI bu 'özel' frekansı bulabilir mi? Chladni desenleri ile frekansları eşleştirebilir miyiz?"

### 1.2 İki ayrı soru (birbirine karıştırılmaz)
| # | Soru | Türü | Nasıl cevaplanır |
|---|---|---|---|
| Q1 | Antik sayı/oran/tekrar yapılarında tesadüften beklenmeyen matematiksel düzen var mı? | tarihsel + matematiksel | corpus + ratio matching + shuffled baseline |
| Q2 | Bu yapılardan türeyen frekans+sıra+süre protokolleri, kontrol koşullarından ayrılan ölçülebilir etki üretiyor mu? | deneysel | kör randomize deney + istatistik + replikasyon |

### 1.3 Test edilebilir hipotezler
- **H1 (tek frekans):** Belirli bir Hz (ör. 528) sessizlik/rastgele kontrolünden farklı `calm_change` üretir.
- **H2 (sekans / "frekans grameri"):** Etki tek taşıyıcıdan değil `frekans + oran + sıra + süre + tekrar` kombinasyonundan gelir; aynı frekansların farklı sıralaması farklı sonuç verir.
- **H3 (süre):** 5-8-13 dk (Fibonacci komşuluğu) ile 13-8-5 dk aynı frekanslarda farklı sonuç verir.
- **H4 (Chladni):** Aynı fiziksel düzenekte aynı frekans tekrar üretilebilir desen verir (within-frequency similarity yüksek); oktav ilişkili frekanslar (432/864) benzer desen verir.
- **H5 (davranış zinciri):** ses → ruh hâli → davranış → fırsat algısı → gözlenen sonuç ("şans") zinciri günlük verisinde izlenebilir.
- **H0 (sıfır):** Hiçbir koşul kontrolden ayrılmaz. **Bu da geçerli bir sonuçtur ve kaydedilir.**

---

## 2. BİLİMSEL İLKELER (DEĞİŞMEZ)

1. **AI hakem değil, araçtır.** Hiçbir modül "şifalı", "enerjisi yüksek", "aurayı yükseltir" demez.
2. **Kanıt seviyesi etiketi zorunlu:** `direct / derived / interpretive / speculative`.
3. **"Kodu bulup metni ona uydurmak" yasak.** Önce hipotez, sonra veri; karıştırılmış (shuffled) baseline ile karşılaştırma.
4. **Frekans ≠ tek sayı.** Stimulus = frekans + süre + sıra + geçiş + tekrar + dalga formu + genlik.
5. **Gerçek ≠ Simülasyon.** Chladni: `SIMULATION` ve `REAL MEASUREMENT` ayrı etiket, ayrı kayıt.
6. **Körleme.** Katılımcı koşulun gerçek Hz'ini deney bitene kadar görmez (A/B/C/D).
7. **Önkayıt (preregistration).** Primary outcome, koşullar, tekrar, dışlama, düzeltme → veri toplamadan önce dondurulur.
8. **Çoklu karşılaştırma.** Bonferroni/Holm; Discovery seti → Validation seti; validation olmadan "keşif" etiketi kalır.
9. **p tek başına başarı değil.** Etki büyüklüğü + %95 güven aralığı zorunlu.
10. **Sonuç ne çıkarsa çıksın kaydedilir.** "432 → etki yok" da bir bulgudur.
11. **Güvenlik.** 20–20 000 Hz, genlik ≤ 0.2, ultrason yok, tıbbi iddia yok.

---

## 3. SİSTEM MİMARİSİ

```
                          ┌─────────────────────────────┐
                          │       ANTİK KAYNAKLAR       │  corpus.json (provenance + evidence_level)
                          └──────────────┬──────────────┘
                                         ↓
                    ┌──────────── NUMBER / RATIO ENGINE ────────────┐
                    │  sayı → çarpan → oran → cent → oktav sınıfı   │
                    └──────────────┬────────────────────────────────┘
                                   ↓
             ┌──────── FREQUENCY GENERATOR ────────┐      ┌──── DISCOVERY AI ────┐
             │ base × n/d, 2^k kaydırma, aile      │ ←──→ │ evolve / anomaly /   │
             └──────────────┬─────────────────────┘      │ scan / grammar       │
                            ↓                             └──────────────────────┘
             ┌──────── SEQUENCE ENGINE ────────────┐
             │ frekans + süre + sıra + tekrar → STM-fingerprint │
             └──────────────┬─────────────────────┘
                            ↓
     ┌──── AUDIO ENGINE ────┐   ┌──── SPECTRAL ────┐   ┌──── CHLADNI ────┐
     │ sine/tri/sq/saw/AM/  │ → │ FFT, peaks,      │   │ sim (n,m) /     │
     │ binaural/sweep → WAV │   │ features, match  │   │ real image → FP │
     └──────────┬───────────┘   └──────────────────┘   └────────┬────────┘
                ↓                                                ↓
     ┌──── EXPERIMENT ENGINE ────┐                    ┌── PATTERN DB ──┐
     │ prereg, randomize, blind, │                    │ similarity, IoU│
     │ pre/post, journal         │                    └────────────────┘
     └──────────┬────────────────┘
                ↓
     ┌──── STATISTICS ENGINE ────┐
     │ Δ, SD, CI, Welch t, d,    │ → evidence_grade → DISCOVERY / VALIDATION → replikasyon
     │ Bonferroni/Holm, Spearman │
     └───────────────────────────┘
```

### 3.1 İki uygulama katmanı
| Katman | Teknoloji | Görev |
|---|---|---|
| `engine/` | Python 3.11+, numpy, scipy (ops. pillow, sklearn) | Araştırma motoru, CLI, batch analiz, WAV üretimi, CSV istatistik |
| `app/` | Capacitor 6 + React 18 + Vite + TS, react-i18next, Web Audio, Canvas, IndexedDB | Mobil uygulama (iOS/Android): oynatma, görselleştirme, kör deney, günlük, kamera |

Her motor modülünün TS eşleniği vardır (aynı formüller, aynı sonuç):

| Python | TypeScript |
|---|---|
| `aurora/math_analysis.py` | `src/core/math.ts` |
| `aurora/matching.py` | `src/core/matching.ts` |
| `aurora/scoring.py` | `src/core/scoring.ts` |
| `aurora/sequence.py` | `src/core/sequence.ts` |
| `aurora/stats.py` | `src/core/stats.ts` |
| `aurora/chladni.py` | `src/core/chladni.ts` |
| `aurora/discovery.py` | `src/core/discovery.ts` |
| `aurora/corpus.py` + `data/corpus.json` | `src/data/corpus.ts` (aynı JSON import) |
| `aurora/acoustics.py` | `src/audio/engine.ts` (Web Audio) |
| `aurora/experiment.py` | `src/screens/Experiment.tsx` (makeTrials, prereg) |
| `aurora/power.py` | `src/core/power.ts` |

> Eşdeğerlik `scripts/parity.sh` ile doğrulanır: 19 referans değer iki motorda birebir aynı çıkmalıdır.

### 3.2 Dizin
```
.
├── ARCHITECTURE.md
├── docs/  DESIGN.md · PLAN.md · MASTER_PLAN.md · DATA_MODEL.md · EXPERIMENT_PROTOCOL.md
├── engine/
│   ├── aurora/ models math_analysis acoustics scoring sequence experiment stats power chladni discovery corpus matching textmining cli
│   ├── data/corpus.json      configs/{example_experiment,sequence_protocols,pilot_stage1,pilot_stage2}.json
│   ├── tests/                out/ (üretilen WAV/CSV)
│   └── pyproject.toml
├── app/
│   ├── src/ i18n/ core/ audio/ data/ components/ screens/ test/
│   ├── capacitor.config.ts   package.json  vite.config.ts
├── scripts/ setup.sh · engine-demo.sh · build-app.sh · pilot.sh · parity.sh · parity/
└── app/{ios,android}/  (Capacitor platformları)
```

---

## 4. VERİ MODELİ VE KANIT SEVİYELERİ

### 4.1 Kanıt seviyeleri
| Seviye | Anlam | Örnek | Puan cezası |
|---|---|---|---|
| `direct` | Birincil kaynakta açıkça geçer | Timaios 1,2,3,4,8,9,27; 2:1 oktav | 0 |
| `derived` | Belgelenmiş ilişkiden matematiksel türev | 432 × 3/2 = 648 | −5 |
| `interpretive` | Sonraki yorum / sayarak bulunan | 108 japa, gematria 26 | −15 |
| `speculative` | Birincil kaynak desteği olmayan modern iddia | "528 Hz DNA onarır" | −30 |

### 4.2 Hipotez durumu
`candidate → tested → validated | rejected`
`validated` yalnızca **validation setinde replikasyon** sonrası.

### 4.3 Tablolar (docs/DATA_MODEL.md)
`sources, numbers, ratios, frequencies/candidates, stimuli, studies, trials, results, journal, patterns`

### 4.4 Provenance kaydı (her sayı için)
```
Number: 27
Source: GRK-TIM (Plato, Timaeus 35b–36b)
Extraction: explicit
Evidence: direct
─────
Frequency: 576 Hz
Origin: derived
Formula: 432 × 4/3
Source ratio: R-4-3 (fourth)
```
Böylece "576 antik metinde Hz olarak geçiyor" gibi bir hata oluşamaz.

---

## 5. ANTİK KAYNAK VERİ SETİ (corpus.json)

| Uygarlık | Kaynak | Sayılar | Seviye |
|---|---|---|---|
| Yunan | Pisagorcu gelenek (Philolaus, Archytas, Nicomachus) | 1,2,3,4 (tetraktys=10), 9:8 | direct |
| Yunan | Platon, Timaios 35b–36b | 1,2,3,4,8,9,27; 256:243 leimma | direct |
| Mezopotamya | 60'lık sistem | 60, 12, 6, 360 | direct/derived |
| Mezopotamya | ETCSL tapınak ilahileri | 7 (tekrar) | interpretive |
| Mısır | Pyramid Texts (MÖ 2350–2150) | 4, 9 (Ennead) | interpretive/direct |
| Mısır | Book of the Dead, Spell 125 | 42 | direct (counted) |
| Mısır | Sistrum, Harper's Songs | 3 | interpretive |
| Vedik | Rigveda, Gayatri (RV 3.62.10) | 24 (3×8), 10 mandala, 3 (AUM) | direct/interpretive |
| Vedik | Nāṭyaśāstra, japa | 7 svara, 22 śruti, 108 | direct/interpretive |
| İbrani | Tanah | 7, 12, 40, 70 | direct |
| İbrani | Gematria | 26 (YHWH), 18 (chai) | interpretive |
| Modern | Solfeggio / 432 hareketi | 174…963, 432, 528 | speculative |

**Uygarlıklar arası ortak sayılar (tanımlayıcı):** 3, 4, 7, 9, 10, 12. Bu ortaklık "gizli frekans kodu" kanıtı değildir; yalnızca adaylık gerekçesidir.

**Referans oran eşleşmeleri (direct sayılardan):** 2:1, 3:2, 4:3, 9:8, 5:4, 6:5 vb. — `aurora corpus structure`.

---

## 6. MATEMATİK MOTORU — FORMÜLLER

### 6.1 Sayı teorisi
- **Asal test:** deneme bölme, `p ≤ √n`.
- **Asal çarpanlar:** `432 = 2⁴·3³`, `528 = 2⁴·3·11`, `639 = 3²·71`, `741 = 3·13·19`, `852 = 2²·3·71`, `963 = 3²·107`.
- **Rakam toplamı:** `ds(n) = Σ digits`; **dijital kök:** `dr(n) = 1 + (n−1) mod 9` (n>0). Örn. `dr(528)=6`, `dr(432)=9`, `dr(639)=9`.
- **Çarpan karmaşıklığı:** `|{farklı asal}|` → düşük karmaşıklık = basit tam sayı ilişkileri.

### 6.2 Oktav eşdeğerliği
```
octave_reduce(f) = f · 2^k  öyle ki  1 ≤ f·2^k < 2
octave_class(f)  = octave_reduce(f)          (ör. 528 → 1.03125, 432 → 1.6875, 864 → 1.6875)
```
Aynı oktav sınıfı = aynı perde sınıfı (432 ≡ 864 ≡ 216).

### 6.3 Cent (perde uzaklığı)
```
cents(f1, f2) = 1200 · log2(f1 / f2)
1 oktav = 1200¢, 1 yarım ses (ET) = 100¢, algısal eşik ≈ 5–8¢
```
Örnek: `cents(528, 523.25)` = 15.6¢ (528, C5=523.25'ten 15.6¢ tiz).

### 6.4 Nota eşleme
```
midi = round(69 + 12·log2(f / A4))
nota = NAMES[midi mod 12] + (⌊midi/12⌋ − 1)
```
A4 = 440 (standart) ve A4 = 432 (alternatif) iki ayrı sütun; 432 = A4 (A4=432), 528 = C5 (her ikisinde).

### 6.5 Referans oranlar (Pisagorcu + saf entonasyon)
| Etiket | Oran | Cent |
|---|---|---|
| unison | 1:1 | 0 |
| octave | 2:1 | 1200 |
| fifth | 3:2 | 701.955 |
| fourth | 4:3 | 498.045 |
| major_second | 9:8 | 203.910 |
| major_third_just | 5:4 | 386.314 |
| minor_third_just | 6:5 | 315.641 |
| major_sixth_just | 5:3 | 884.359 |
| minor_seventh_harmonic | 7:4 | 968.826 |
| leimma (Timaios) | 256:243 | 90.225 |

**Oran uzaklığı:** `err = cents(octave_reduce(f), octave_reduce(n/d))`, tüm referanslar için, küçükten büyüğe.

### 6.6 Sayı çiftlerinden oran çıkarma
```
for (a,b) in pairs(numbers): g = gcd(a,b); ratio = (max/g):(min/g)
match if cents(octave_reduce(ratio), octave_reduce(ref)) ≤ 8¢
```
Örn. Timaios {1,2,3,4,8,9,27} → 2:1, 3:2, 4:3, 9:8, 27:8 (=27:8 → oktav indirgenince 27:16 = 905.9¢, Pisagorcu büyük altılı).

### 6.7 Harmonik seri
```
h_k = k · f0,  k = 1..8
528 → 528, 1056, 1584, 2112, 2640, 3168, 3696, 4224
```
Harmonikler arası oranlar: 2:1, 3:2, 4:3, 5:4, 6:5 … (doğal referans oranların kaynağı budur).

### 6.8 Timaios dizileri
Çift dizi `1,2,4,8` (2ⁿ) ve üçlü dizi `1,3,9,27` (3ⁿ). Aralarındaki oranlar: aritmetik/harmonik ortalamalarla 3:2 ve 4:3 dolduruluyor (Timaios 36a). Bu, `ratios_between` ile otomatik çıkarılır.

---

## 7. FREKANS ÜRETİMİ (FREQUENCY GENERATOR)

### 7.1 Sayıdan frekansa (2ᵏ kaydırma)
```
f = N · 2^k   öyle ki  lo ≤ f ≤ hi   (varsayılan 100–1000 Hz)
27  → 27·2⁴ = 432        (! 27 → 432, Timaios'un en büyük sayısı)
108 → 108·2² = 432
7   → 7·2⁶  = 448
12  → 12·2⁵ = 384
40  → 40·2³ = 320
42  → 42·2³ = 336
```
> Not: `27·16 = 432` ve `108·4 = 432` matematiksel olarak doğrudur; **bu antik metinlerin 432 Hz bildiği anlamına gelmez** (Hz modern birimdir). Etiket: `derived`.

### 7.2 Oran ailesi
```
family(base) = { label: base · n/d  → duyulabilir aralığa 2^k }
family(432): octave 864, fifth 648, fourth 576, major_second 486, major_third 540, minor_third 518.4, sixth 720, seventh 756
family(528): 1056, 792, 704, 594, 660, 633.6, 880, 924
```

### 7.3 Aday üretim kaynakları
| Kaynak | Etiket | Örnek |
|---|---|---|
| Popüler iddialar | popular / speculative | 174…963 |
| Corpus sayıları × 2ᵏ | derived | 27→432, 42→336 |
| Corpus oranları × base | derived | 432×3/2=648 |
| Kullanıcı | user | 417.37 |
| Discovery (evolve/scan/anomaly) | discovery | 431.8, 529.1 |

### 7.4 Sınırlar
`20 ≤ f ≤ 20 000 Hz`; ultrason üretilmez; uygulamada slider logaritmik (`log2` ölçekli).

---

## 8. SES MOTORU (AUDIO ENGINE)

### 8.1 Dalga formları
```
sine:      x(t) = A·sin(2πft)
triangle:  x = 4·|φ − 0.5| − 1,   φ = (ft) mod 1
square:    x = sign(0.5 − φ)
saw:       x = 2φ − 1
harmonic:  x = Σ a_k · sin(2π k f t), normalize → A
AM:        x = A·sin(2πft) · [1 − m + m·(0.5 + 0.5·sin(2π f_m t))]
binaural:  L = sin(2πft), R = sin(2π(f+Δ)t)      (Δ = beat Hz)
sweep:     logaritmik chirp f0 → f1
silence:   zeros
```
Zarf: 20 ms attack, 80 ms release (tıklama önleme). **A ≤ 0.2** (MAX_AMPLITUDE) — kod seviyesinde kilit.

### 8.2 Python (WAV)
`aurora tone 528 --seconds 20 --waveform sine --output out/528.wav` → 48 kHz, 16-bit PCM.
`render_stimulus(stim)` sekansı adım + boşluk + tekrar ile birleştirir.

### 8.2b Frekans aralığı — infrasesten ultrasese
| Bant | Aralık | Duyulur mu | Not |
|---|---|---|---|
| İnfrases | 0.1 – 20 Hz | hayır | Titreşim olarak hissedilebilir; normal hoparlör basamaz |
| Bas | 20 – 250 Hz | evet | |
| Orta | 250 – 4 000 Hz | evet | İnsan sesi ve çoğu müzik burada |
| Tiz | 4 – 20 kHz | evet | |
| Ultrases | 20 – 96 kHz | hayır | Nyquist sınırı: 48 kHz cihazda üst tavan 24 kHz |

Uygulama tüm aralığı üretir ve analiz eder; duyulamayan/üretilemeyen bantlarda
**dürüst uyarı** gösterir (`isRenderable`, `bandOf`). Slider logaritmiktir.

### 8.2c Çok katmanlı ses (frekans yığma)
Her katmanın kendi osilatör + kazanç düğümü vardır, hepsi ortak master'a karışır:
```
LIVE katmanı  → slider'ın sürdüğü canlı frekans (silinemez)
+ katman      → o anki frekansı SABİTLER (slider artık etkilemez)
```
**Genlik normalizasyonu:** N katman için her biri `1/√N` ile ölçeklenir — aksi hâlde
toplam sinyal klipslenir (bozulur, gürültü üretir). Master kazanç yine ≤ 0.2.

Örnek: 432 + 528 + 639 Hz aynı anda → akor benzeri yapı; her katman ayrı sessize alınabilir.

### 8.2d Kesin durdurma
`setTargetAtTime` **üstel** bir yaklaşımdır; matematiksel olarak hiçbir zaman tam sıfıra inmez.
Bu, "durdurdum ama hâlâ çok hafif ses var" sorununa yol açar. Çözüm:
```
stop()   → kısa rampa, ardından cancelScheduledValues + setValueAtTime(0)
panic()  → anında sustur, osilatörleri kapat, düğümleri temizle
```
Panik butonu Ana, Sekans ve Deney ekranlarında bulunur.

### 8.3 Uygulama (Web Audio)
`OscillatorNode → GainNode → AnalyserNode → destination`
- `setTargetAtTime` ile yumuşak frekans/genlik geçişi
- `playStimulus()` zamanlayıcı ile adımları oynatır; kör deneyde Hz callback UI'ya gösterilmez
- `AnalyserNode.fftSize = 4096` → waveform (`getFloatTimeDomainData`) + spektrum (`getByteFrequencyData`)

### 8.4 Her stimulus ayrı koşuldur
"528 Hz sine" ≠ "528 Hz içeren müzik" ≠ "528 Hz kare dalga". Waveform, genlik, süre, harmonik içerik kayda girer; parmak izi (STM-…) değişir.

---

## 9. SPEKTRAL ANALİZ

```
x[n] · hann[n] → rFFT → |X[k]|,  f_k = k · sr / N
normalize: |X| / max|X|
peaks: find_peaks(|X|, distance, height=0.01) → ilk 10 (büyüklüğe göre)
```
**Özellik vektörü (ML için):**
```
[ fundamental_hz, harmonic_2, harmonic_3, spectral_centroid, spectral_bandwidth,
  rms, crest_factor, duration_s, silence_ratio ]
spectral_centroid = Σ f·P / Σ P,  bandwidth = sqrt(Σ (f−c)²·P / Σ P),  crest = peak/rms
```
Kullanım: üretilen WAV'ın gerçekten 528 Hz olduğunu doğrulamak (`aurora analyze-audio out/528.wav` → 528.0 Hz, mag 1.0).

---

## 10. FREKANS EŞLEŞTİRME TEKNİKLERİ (MATCHING ENGINE)

| # | Teknik | Formül / Yöntem | Ne için | Komut |
|---|---|---|---|---|
| 1 | **Cent uzaklığı** | `c = |1200·log2(f1/f2)|`, eşleşme `c ≤ 8¢` | İki frekans algısal olarak aynı mı | `aurora match f1 f2` |
| 2 | **Oktav eşdeğerliği** | `c' = min(c, 1200−c)` oktav indirgenmiş | 432 ≡ 864 ≡ 216 | `match` (cents_octave) |
| 3 | **Rasyonel oran** | `f1/f2 ≈ n/d`, payda ≤ 16 (sürekli kesir / `Fraction.limit_denominator`), hata cent, referans etiketi, karmaşıklık `n+d` | 648:432 → 3:2 "fifth" | `match` (rational) |
| 4 | **Harmonik ilişki** | `f1 ≈ k·f2` veya ortak harmonik `p·f1 ≈ q·f2` (min p+q) | 1056 = 2×528; 432 ve 648 → 2·648=3·432=1296 | `match` (harmonic) |
| 5 | **Spektral tepe eşleştirme** | Ölçülen tepe ↔ hedef Hz, tolerans 15¢ | Kayıt/hoparlör gerçekten hedefi üretiyor mu | `spectral_match(peaks, targets)` |
| 6 | **Sekans DTW** | Dynamic Time Warping, cent metriği, `(n+m)` normalize | Farklı uzunlukta protokoller benzer mi | `aurora match-sequence --a … --b …` |
| 7 | **Geçiş profili (transpozisyon-bağımsız)** | `Δ_i = 1200·log2(f_{i+1}/f_i)`; DTW profil üzerinde | 432→528→639 ile 864→1056→1278 aynı "gramer" | `match-sequence` |
| 8 | **Desen parmak izi benzerliği** | `1 − ‖v_a − v_b‖ / √dim`, v = [sym, radial, complexity, density, nodes/64, angle/180] | Chladni A ↔ B (%87 gibi) | `aurora pattern --compare-sim` |
| 9 | **Maske IoU** | `|A∩B| / |A∪B|` (yeniden örnekleme) | Piksel bazlı desen benzerliği | `chladni.mask_similarity` |
| 10 | **Özellik-uzayı kümeleme** | k-means (numpy), z-normalize feature vector | 100 000 aday → küme; 432→Pattern 17 gibi | `matching.cluster_frequencies` |
| 11 | **Anomali** | z-score Öklid uzaklığı > μ + zσ | Çoğunluktan ayrılan aday | `aurora anomalies …` |
| 12 | **Corpus sayı eşleme** | tam sayı = corpus value | Tarihsel puan | `scoring.historical_from_corpus` |

**Eşik önerileri:** algısal 5–8¢, kayıt doğrulama 15¢, sekans 50¢, desen benzerliği ≥ 0.8 "aynı mod".

**Uygulamada:** Analyze ekranı → "Eşleştirme" kartı (1–4), Lab → Chladni (8, 9), Lab → Discovery (10, 11), Sequence → geçiş profili (7).

---

## 11. SEKANS MOTORU

### 11.1 Stimulus tanımı
```json
{ "sequence": [432, 528, 639], "durations": [300, 480, 780], "gap_s": 0.5,
  "repetitions": 1, "waveform": "sine", "amplitude": 0.15, "sample_rate": 48000 }
→ stimulus_id = "STM-" + sha1(payload)[:10]      (deterministik parmak izi)
total_seconds = (Σ dur + gap·(n−1)) · repetitions = 1561 s
```

### 11.2 Karşılaştırma seti (her hipotez için 5 koşul)
| Koşul | İçerik | Test ettiği şey |
|---|---|---|
| A_forward | 432→528→639 / 5-8-13 dk | hipotez |
| B_reversed | aynı frekans, 13-8-5 dk | süre sırası |
| C_single | 432 × 26 dk | sekans mı tek frekans mı |
| D_random | rastgele 3 frekans (100–1000) / 5-8-13 | frekansın kendisi |
| E_silence | sessizlik / 5-8-13 | genel dinleme/oturma etkisi |

`aurora protocols 432 528 639 --minutes 5 8 13 --seed 0`

### 11.3 Permütasyon
n frekans → n! sıralama (`permutations_of`). 3 frekans = 6 protokol; süre permütasyonuyla 36.

---

## 12. PUANLAMA (AURORA SCORE)

```
mathematical_score (0–40):
  +5  tam sayı
  +max(0, 10 − 2·|farklı asal|)
  +25 en yakın referans oran ≤ 8¢ | +10 ≤ 25¢

historical_score (0–40):
  min(30, 5·kaynak sayısı) + (10 if explicit) − ceza(evidence_level)

exploratory_score = math + historical            ← yalnızca sıralama
experimental_score = NULL (deney gerekli)
replication_score  = NULL (validation gerekli)
```
Örnekler: 432 → M 13 + H 0 (speculative → 0) = 13; 27 → M 5+8+… ; 528 → M 5+4=9, H 0.
**Hiçbir puan "şifa" anlamına gelmez** — her çıktıda `warning` alanı vardır.

AURORA DNA (uygulama Home): Math / Historical / Acoustic / Experimental / Replication çubukları.

---

## 13. DENEY MOTORU

### 13.1 Önkayıt kontrol listesi (7 madde, hepsi ✓ olmadan "Dondur" pasif)
1. primary outcome tanımlı (`calm|energy|focus|motivation|sleepiness|restlessness`)
2. birincil karşılaştırma tanımlı (≥2 koşul, ≥1 kontrol)
3. randomizasyon tanımlı (tohumlu shuffle)
4. körleme tanımlı (A/B/C etiketleri; Hz gizli)
5. dışlama kuralları yazılı
6. çoklu karşılaştırma planı (bonferroni)
7. analiz kodu unblind öncesi donmuş (`frozen_at`)

### 13.2 Randomizasyon
```
order = shuffle(conditions, seed + repetition_index)      # her tekrar farklı sıra
labels = shuffle(A,B,C,…, seed ^ 0x5EED)                  # gerçek koşul → anonim harf
latin_square(n) → n sıra, her koşul her pozisyonda 1 kez  # sıra etkisi dengeleme
```

### 13.3 Oturum akışı
`PRE (6 × 0–10) → DİNLE (Hz gizli, ilerleme çubuğu) → POST (6 × 0–10) → not → kaydet`
`change = post − pre`

### 13.4 Discovery / Validation
```
10 000 aday → 8 000 discovery → 50 finalist → 500 validation trial → 10 confirmed
```
Discovery setinde "keşif" → validation setinde replikasyon → "validated".

### 13.5 Fizyolojik (v2)
HR, HRV (RMSSD), uyku, hareket, solunum, deri iletkenliği — Apple Health CSV import.

---

## 14. İSTATİSTİK MOTORU

```
Koşul başına Δ = post − pre (primary outcome)
mean, SD (ddof=1), SE = SD/√n
%95 CI = mean ± t_{0.975, n−1} · SE
Welch t (koşul vs kontrol): t = (m1−m2)/√(s1²/n1 + s2²/n2),  df Welch–Satterthwaite
Cohen d = (m1−m2) / s_pooled,  s_pooled = √[((n1−1)s1² + (n2−1)s2²)/(n1+n2−2)]
Bonferroni: p_adj = min(1, p·k),  k = koşul sayısı − 1
Holm: sıralı p_(i) · (m − i + 1), kümülatif max
Sıra etkisi: Spearman ρ (order_index, Δ)
Günlük: Spearman ρ (exposure_t, Σ olay_{t+1})
```
**Kanıt derecesi**
| n | p_adj | |d| | derece |
|---|---|---|---|
| <5 | — | — | insufficient |
| ≥5 | <0.05 | ≥0.5 | discovery (replikasyon varsa validated) |
| ≥5 | <0.10 | ≥0.3 | weak_signal |
| ≥5 | aksi | — | null |

Uygulamada `stats.ts`: t-CDF düzenli tamamlanmamış beta ile (Lanczos gamma), Python'da `scipy.stats`.

---

## 14.5 GÜÇ ANALİZİ (POWER ENGINE) — deney BAŞLAMADAN önce

> Bu bölüm Faz 1 uygulamasında eklendi. Sebebi somut bir bulgu: **n=5 ile d=1.84 gibi
> çok büyük bir gerçek etki bile Bonferroni sonrası p=0.063'te kaldı** — yani yakalanamadı.

### 14.5.1 Neden zorunlu
Yetersiz güçle yürütülen çalışma iki yönde de yanıltır:
- Gerçek etki varsa kaçırılır → yanlışlıkla "etki yok" denir
- "Etki yok" sonucu **kanıt sanılır** → oysa hiçbir şey gösterilmemiştir

Bu yüzden `preregistration` artık hedef etki büyüklüğü ve gücü de içermelidir.

### 14.5.2 Güç tablosu (Welch t + Bonferroni k=3, α=0.05, simülasyon)
| n/koşul | d=0.5 | d=0.8 | d=1.0 | d=1.5 | d=2.0 |
|---:|---:|---:|---:|---:|---:|
| 5 | 4% | 8% | 12% | 30% | 54% |
| 10 | 8% | 23% | 37% | 76% | 95% |
| 15 | 14% | 37% | 58% | 94% | 100% |
| 20 | 19% | 51% | 73% | 98% | 100% |
| 30 | 30% | 72% | 91% | 100% | 100% |

### 14.5.3 %80 güç için gereken örneklem
| Hedef d | n/koşul (k=3) | Toplam (4 koşul) | Süre (10 dk/deneme) |
|---:|---:|---:|---:|
| 0.5 | 88 | 352 | ~70 saat |
| 0.8 | 35 | 140 | ~23 saat |
| 1.0 | 23 | 92 | ~18 saat |
| 1.5 | 11 | 44 | ~8 saat |

### 14.5.4 Kritik tasarım sonucu: az koşul > çok koşul
| Tasarım | k | n/koşul (d=0.8, %80) | Toplam süre |
|---|---:|---:|---:|
| 4 koşul | 3 | 35 | 23 saat |
| 3 koşul | 2 | 21 (d=1.0) | 10.5 saat |
| **2 koşul** | **1** | **26** | **8.7 saat** |

> Aynı güç için 2 koşullu tasarım 4 koşulludan **2.7 kat** daha ekonomiktir.
> Bu, "10 000 frekans test edelim" fikrinin neden istatistiksel olarak kendini
> baltaladığının sayısal kanıtıdır: her ek koşul çoklu karşılaştırma cezasını artırır.

### 14.5.5 API
```python
power.power_two_sample(n, effect_d, comparisons, alpha, sims)  # yakalama olasılığı
power.required_n(effect_d, comparisons, target_power)          # gereken n
power.detectable_effect(n, comparisons, target_power)          # MDE
power.plan(conditions, effect_d, target_power, minutes)        # tam plan
```
```bash
aurora power --conditions 4 --effect 0.8 --table-n 5 10 20 35
```
Uygulamada: Deney → Kurulum ekranında canlı güç paneli; %80 altında **kırmızı uyarı** ve
önerilen tekrar sayısı. Güç bilgisi `Study.design` içinde saklanır ve Sonuçlar ekranında
tekrar gösterilir — böylece "etki yok" sonucu bağlamsız okunamaz.

---

## 15. CHLADNI MOTORU — GERÇEK PLAKA FİZİĞİ

### 15.1 En önemli fiziksel gerçek
> **Bir Chladni deseni frekansın tek başına fonksiyonu DEĞİLDİR.**
> Aynı 528 Hz, farklı levhada tamamen farklı desen verir.

Deseni belirleyen: **malzeme** (E, ρ, ν) · **kalınlık** h · **kenar uzunluğu** L ·
**sınır koşulu** · **uyarım noktası**. Bu yüzden sistem "frekans → desen" değil,
**"levha + frekans → rezonans modu"** hesaplar.

### 15.2 Kirchhoff–Love ince plaka denklemleri
```
D      = E·h³ / (12(1−ν²))                    plaka eğilme sertliği
f(m,n) = λ(m,n)/(2π) · √(D / (ρ·h·L⁴))        modal frekans

λ(m,n) = π²(m² + n²)                          basit mesnetli (analitik)
λ(m,n) = π²((m±½)² + (n±½)²)                  serbest/ankastre (Ritz yaklaşımı)
```

**Ölçekleme yasaları** (testlerle doğrulanmıştır):
| Değişiklik | Frekans etkisi |
|---|---|
| Kalınlık ×2 | frekans ×2 (f ∝ h) |
| Kenar ×2 | frekans ÷4 (f ∝ 1/L²) |
| Çelik → Alüminyum | √(E/ρ) oranında değişir |
| Serbest → Ankastre | artar (kenar levhayı sertleştirir) |

### 15.3 Mod süperpozisyonu (Lorentz tepkisi)
Gerçek levha tek modda değil, rezonansa yakınlıkla ağırlıklanmış **mod toplamında** titreşir:
```
A(f) = 1 / √[(1 − (f/fᵢ)²)² + (2ζ·f/fᵢ)²]      ζ = 0.006 (tipik metal sönümü)
w(x,y) = Σᵢ A(fᵢ) · φᵢ(x,y)
kum → |w| < eşik  (düğüm çizgileri)
```

### 15.4 Mod dejenerasyonu
Kare levhada birden fazla mod **aynı frekansa** düşebilir. Örnek (20 cm çelik, 1 mm, serbest):
```
(1,4) → 749.8 Hz     0.5² + 3.5² = 12.5
(3,3) → 749.8 Hz     2.5² + 2.5² = 12.5
```
İkisi de tam rezonansta uyarılır ve süperpoze olur. **Gerçek Chladni desenlerinin
karmaşıklığı ve güzelliği büyük ölçüde buradan gelir** — kod bunu üretir.

### 15.5 Örnek: 20 cm çelik 1 mm levha rezonansları
```
(1,1)   30 Hz   (1,2)  150 Hz   (2,2)  270 Hz   (1,3)  390 Hz
(2,3)  510 Hz   (1,4)  750 Hz   (3,3)  750 Hz   (2,4)  870 Hz
```
528 Hz bu levhada (2,3) moduna %70 yakınlıktadır — desen oluşur ama en net değildir.
963 Hz ise hiçbir rezonansa yakın değildir; **gerçek düzenekte kum belirgin desen oluşturmaz**
ve uygulama bunu açıkça uyarır.

### 15.6 Gerçek görüntü (REAL MEASUREMENT)
```
kamera → kare kırpma → 96×96 gri → Otsu eşiği → kum maskesi
```
Parmak izi: simetri · radyal simetri · karmaşıklık · yoğunluk · düğüm sayısı · baskın açı.
Her kayıt levha parametreleriyle birlikte saklanır — **parametresiz bir Chladni kaydı
yorumlanamaz**.

### 15.7 Doğruluk sınırı (dürüst beyan)
Model şunları kapsar: malzeme, kalınlık, boyut, sınır koşulu, mod süperpozisyonu, sönüm.
Kapsamadıkları: uyarım noktasının konumu, levhanın gerçek tutuş noktaları, malzeme
homojensizliği, kum tanesi boyutu/kütlesi, hava sürüklenmesi, sıcaklık.
Bu yüzden simülasyon **SIMULATION** etiketini korur; gerçek ölçüm **REAL MEASUREMENT**'tir.

---

## 16. KEŞİF MOTORU (DISCOVERY AI)

### 16.1 Evrimsel arama
```
Gen 0: [432, 528, 639, 741, 852, 963]
fitness(f) = ölçülen etki (varsa)  |  mathematical_score/40 (yoksa → "exploratory")
seç: en iyi keep=6
mutasyon: f · 2^(U(−15,15)/1200)      (±15¢)
kombinasyon: √(a·b) | a·(b/a)^{½,1½,⅔,3/2} | a+b   → 20–20 000 Hz'e katla
children=12 → Gen k+1 → tekrar
```
Fitness ancak **deney verisinden** gelirse "measured"; aksi hâlde sadece matematiksel keşif.

### 16.2 Anomali
Feature vector `[log2 f, |asal|, dr/9, cent_err/600, prime, math/40]` → z-normalize → Öklid → `> μ + 1.5σ` anomali.

### 16.3 Tarama
`f_{i+1} = f_i · 2^(step¢/1200)` (50¢ adım) → matematik puanı en yüksek 20.

### 16.4 Frekans grameri
`sequence_transitions(protocols, responses)` → geçiş (f_i→f_j) başına ortalama yanıt. "Yanıtı yüksek protokollerde ortak geçişler hangileri?" — `528→639→432` gibi bir protokolün validation'da tutup tutmadığını gösterir.

### 16.5 ML yol haritası
Logistic Regression → Random Forest → Gradient Boosting → Bayesian Hierarchical (kişi bazlı) → Anomaly Detection → Ranking. Hepsi `experimental` sütununu besler, hiçbiri hakem değildir.

---

## 17. METİN MADENCİLİĞİ (v2 iskeleti — `textmining.py`)
```
explicit_numbers: \b\d{1,6}\b + sayı kelimeleri (en/tr)
repetition_counts: kelime tekrarları (≥4 harf)
structure: satır/kelime/satır uzunlukları
ratio_matches: sayı çiftleri → referans oran
shuffled_baseline: aynı aralıkta rastgele sayılarla 50 deneme → p_empirical
```
Kural: **Sayma ≠ çözme.** Baseline'ı geçmeyen eşleşme "kod" değildir.

---

## 18. UYGULAMA KULLANIM KILAVUZU

### 18.1 Ana (Home) — yukarıdan aşağı
1. **Frekans kartı:** büyük Hz, bant etiketi (İnfrases/Bas/Orta/Tiz/Ultrases + duyulabilirlik),
   logaritmik slider (0.1 Hz – 96 kHz), sayı girişi, hazır çipler (174…963).
2. **▶ Oynat · + Katman ekle · Tümünü sustur** (panik). Dalga biçimi ve genlik (her ikisinde ? açıklaması).
3. **AURORA DNA** — ekranın üst yarısında, kaydırmadan görünür: Matematik / Tarihsel /
   Deneysel / Tekrar çubukları + notalar (A4=440 ve 432) + "keşif puanı etki kanıtı değildir" uyarısı.
4. **Katmanlar:** LIVE katmanı slider'ı takip eder; eklenen katmanlar sabit kalır.
   Her katman ayrı sessize alınabilir/silinebilir. Toplam frekans yığını altta özetlenir.
5. **Dalga formu + Spektrum** (gerçek zamanlı AnalyserNode).
6. **Chladni** (SIMULATION rozeti) + "desen levhaya bağlıdır" notu.

### 18.2 Analiz
Sayı teorisi kartı → harmonikler → referans oran cent tablosu → frekans ailesi → corpus eşleşmeleri (rozetli) → keşif puanı (uyarılı) → **Eşleştirme** (başka frekans gir: cent, oktav-cent, rasyonel oran, harmonik, ortak harmonik).

### 18.3 Kütüphane
İlk açılışta corpus'tan tohumlanır (popüler + türev). Filtre: origin. Satır → Home'a yükler. Durum seçici: candidate/tested/validated/rejected. Özel frekans ekle.

### 18.4 Sekans
Şablon çipleri (A–E) → adım tablosu (Hz, dk; 0 = sessizlik) → boşluk, tekrar, dalga → toplam süre, STM parmak izi, geçiş profili (cent) → Kaydet / ▶ oynat (ilerleme çubuğu).

### 18.5 Deney
- **Kurulum:** primary outcome; kayıtlı protokollerden koşul seç (+ sessizlik kontrolü otomatik); tekrar; tohum; dışlama kuralı; 7 maddelik önkayıt listesi → **Dondur ve başlat**.
- **Oturum:** "Koşul B" (Hz: gizli) → Öncesi 6 puan → Dinle → Sonrası 6 puan → not → kaydet. Tüm denemeler bitene kadar.
- **Sonuçlar:** tablo (n, Ort Δ, %95 GA, Cohen d, p düz.), kanıt derecesi, sıra etkisi ρ, Bonferroni uyarısı → **Körlüğü kaldır** (yalnızca tüm denemeler bitince) → koşul → Hz görünür.

### 18.6 Günlük
Bugün: ruh hâli, enerji (0–10) + 6 sayılabilir olay + dinlenen protokol → kaydet. Grafik (metrik seç; protokol günleri sarı). Maruziyet → ertesi gün olay korelasyonu (ρ) + "nedensellik değil" uyarısı.

### 18.7 Lab
- **Chladni:** Hz gir → sol simülasyon (levha parametrelerinden hesaplanır), sağ fotoğraf
  (kamera/galeri) → gerçek parmak izi, simülasyona benzerlik %, aynı-Hz tekrar benzerliği.
  **Levha paneli:** malzeme · kenar koşulu · boyut · kalınlık → mod (m,n), en yakın rezonans,
  rezonansa yakınlık %, bu levhanın rezonans listesi (dokununca o frekansa gider).
  Rezonanstan uzaksa uyarı: "gerçek düzenekte kum belirgin desen oluşturmayabilir".
- **Rezonans Haritası:** alt/üst/adım → tara → complexity(f) çizgisi + gerçek ölçüm noktaları.
- **Keşif:** başlangıç popülasyonu, nesil → evrimsel arama → çipler (anomali vurgulu) → dokun → kütüphaneye "discovery/candidate". Tarama tablosu.

### 18.8 Dil
Sağ üst "Dil: TR/EN" — tüm metinler `src/i18n/tr.json` / `en.json`.

---

## 19. SCRIPT SİSTEMİ

### 19.1 Kurulum
```bash
bash scripts/setup.sh          # engine venv + pip install -e ".[dev,image]"; app npm install
```

### 19.2 CLI referansı (`cd engine && source .venv/bin/activate`)
| Komut | Ne yapar |
|---|---|
| `aurora analyze 528` | sayı teorisi, notalar, harmonikler, referans oran cent'leri, corpus puanı, aile |
| `aurora compare 432 528 639 741` | keşif puanına göre sıralama |
| `aurora match 648 432` | 4 eşleştirme tekniği raporu |
| `aurora match-sequence --a 432 528 639 --b 864 1056 1278` | DTW + geçiş profili |
| `aurora tone 528 --seconds 20 --waveform sine --output out/528.wav` | WAV üret |
| `aurora sequence 432 528 639 --minutes 5 8 13 --output out/seq.wav` | protokol WAV + JSON |
| `aurora protocols 432 528 639 --minutes 5 8 13 --seed 0` | A–E karşılaştırma seti |
| `aurora analyze-audio out/528.wav` | FFT tepeleri + özellik vektörü |
| `aurora corpus [summary\|structure\|candidates\|numbers] --base 432` | veri seti, ortak yapı, türev adaylar |
| `aurora chladni 528 --output out/chl528.png` | simülasyon + parmak izi (+PNG) |
| `aurora pattern foto.jpg --frequency 528 --compare-sim` | gerçek görüntü parmak izi |
| `aurora resonance-map --lo 100 --hi 1000 --step 10` | complexity(f) |
| `aurora make-study --config configs/example_experiment.json --repetitions 3 --seed 42 --freeze --output out/trials.csv` | randomize + kör trial CSV + önkayıt |
| `aurora simulate-trials out/trials.csv` | DEMO sahte null veri |
| `aurora stats out/trials.csv --outcome calm --control D` | Δ, CI, d, p, düzeltme, sıra etkisi |
| `aurora evolve 432 528 639 --generations 3` | evrimsel adaylar |
| `aurora anomalies 100 200 300 400 7919.5` | anomali |
| `aurora scan --lo 100 --hi 1000 --step-cents 50 --top 20` | tarama |
| `aurora power --conditions 4 --effect 0.8` | güç analizi: gereken n, MDE, güç tablosu |
| `aurora mine metin.txt` | sayı madenciliği + shuffled baseline |

### 19.3 Otomasyon akışları
**Pilot çalışma (`scripts/pilot.sh [stage1|stage2|audio|power]`):**
```
power        → güç analizi tabloları (tasarım kararını verir)
audio        → 432/528 Hz 10 dk WAV + protokol JSON
stage1       → tarama: 3 koşul × 10 tekrar = 30 kör deneme (MDE d≈1.4)
  [insan oturumları → CSV doldur → aurora stats … --control D]
stage2       → doğrulama: kazanan koşul vs sessizlik, 2 × 26 = 52 deneme (d=0.8'de %80 güç)
  başarı ölçütü: p<0.05 ∧ |d|≥0.5 ∧ %95 GA ∌ 0  →  'validated'
```

**Motor eşdeğerliği (`scripts/parity.sh`):**
```
Python referans (19 değer) ↔ TypeScript referans → birebir karşılaştırma
```
**Chladni taraması:**
```
for f in 20..2000: chladni f → PNG + fingerprint → resonance-map → CSV
```
**Keşif döngüsü:**
```
corpus candidates → compare → evolve → anomalies → seç 20 → make-study → stats → fitness → evolve (measured)
```

### 19.4 Uygulama
```bash
cd app && npm run dev            # tarayıcıda
npm test                         # vitest (core)
npm run build && npx cap sync    # iOS/Android
npx cap open ios | android
```

---

## 20. TEST VE DOĞRULAMA
- `engine/tests/` — 25 test: sayı teorisi, oktav/cent, türev, oran eşleme, ses güvenlik sınırı, FFT doğrulama (528 → 528±1), stimulus süresi, parmak izi determinizmi, randomizasyon/körleme, önkayıt, null-veri istatistiği, evrim aralık kontrolü, eşleştirme (3:2, harmonik, DTW, transpozisyon), madencilik, güç motoru monotonluğu, **uçtan uca hat testi** (`test_pipeline.py`: enjekte edilen gerçek etki 'discovery' çıkar, sahte etki 'null' elenir, yetersiz güç işaretlenir, körleme sızdırmaz, randomizasyon sırayı dengeler).
- `app/src/test/` — 19 vitest: math, matching, sequence, stats, chladni, discovery, power (432 → 2⁴·3³; 648/432 → 3:2; DTW 0; n=5 tasarımı 'yetersiz güç' işaretlenir).
- `scripts/parity.sh` — Python ↔ TypeScript 19 referans değer birebir eşdeğer.
- Manuel: Deney ekranında Hz'in unblind öncesi görünmediği; her metnin i18n'den geldiği (`grep -r "\"[A-ZÇĞİÖŞÜ][a-z]" src/screens` boş).

## 21. GÜVENLİK
Genlik kilidi (0.2) hem Python hem Web Audio'da; kulaklık uyarısı; 20–20 kHz; uzun süreli yüksek SPL yok; tıbbi tedavi/teşhis iddiası yok; veriler cihazda (IndexedDB), bulut yok.

## 22. YOL HARİTASI
| Faz | İçerik | Durum |
|---|---|---|
| 0 | Dokümanlar, motor (11 modül + CLI + 19 test), uygulama (7 ekran, i18n), scriptler | ✓ |
| 1 | Güç motoru, iki aşamalı pilot (S1 tarama 3×10, S2 doğrulama 2×26), platformlar (iOS+Android), ikon/splash, gizlilik, eşdeğerlik doğrulaması | ✓ |
| 1b | Pilot oturumlarının yürütülmesi (insan verisi), 30 gün günlük, Chladni düzeneği fotoğrafları | — |
| 2 | Ancient Text Engine (PDF/OCR), Bayesian hierarchical, HRV import, desen kümeleme, oktav-desen testi | — |
| 3 | Çok katılımcılı platform, Discovery/Validation otomasyonu, replikasyon kaydı, store yayını (`/deploy`, org.auroraproject.app) | — |

## 22.5 TERİM AÇIKLAMA SİSTEMİ (uygulama içi)

Uygulamada her teknik terimin yanında bir **(?)** simgesi vardır; dokununca sade bir
açıklama açılır. 38 terim iki dilde tanımlıdır (`i18n → glossary`):

| Grup | Terimler |
|---|---|
| Ses | genlik, frekans, dalga biçimi, harmonik, oktav, oktav sınıfı, spektrum, FFT, katman |
| Aralık | infrases, ultrases, Nyquist |
| Müzik/matematik | cent, oran, dijital kök, asal |
| Chladni | chladni, düğüm, rezonans, mod, **levha etkisi**, simetri, karmaşıklık |
| Deney | körleme, önkayıt, birincil ölçüt, randomizasyon, kontrol |
| İstatistik | Cohen d, p değeri, güven aralığı, Bonferroni, güç, MDE |
| Kanıt | kanıt seviyesi, keşif puanı, simülasyon, DTW |

Örnek (genlik): *"Sesin gücü — ne kadar yüksek çaldığı. 0 = sessiz, 0.2 = güvenli üst
sınır. Frekansı (perdeyi) değiştirmez, sadece şiddetini."*

---

## 23. SÖZLÜK
**Cent** 1/100 yarım ses · **Oktav sınıfı** 2ᵏ ile [1,2)'ye indirgenmiş değer · **Stimulus** frekans+süre+sıra+tekrar+dalga+genlik paketi · **Önkayıt** veri öncesi dondurulmuş analiz planı · **Körleme** katılımcının koşulu bilmemesi · **Bonferroni** p·k düzeltmesi · **Cohen d** standardize etki büyüklüğü · **DTW** dizi hizalama uzaklığı · **Chladni** titreşen levhada kum düğüm deseni · **Discovery/Validation** keşif ve doğrulama veri setleri · **Evidence level** direct/derived/interpretive/speculative.
