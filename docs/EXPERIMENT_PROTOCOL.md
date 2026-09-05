# AURORA — Deney Protokolü (Preregistration şablonu)

## Temel sorular
1. Eski uygarlıkların sayı/oran/tekrar yapılarında, tesadüften beklenmeyecek matematiksel düzen var mı? (tarihsel/matematiksel soru)
2. Bu yapılardan türetilen frekans + sıra + süre protokolleri, kontrol koşullarından ayrılan öznel/fizyolojik etki üretiyor mu? (deneysel soru)

İki soru **ayrı** raporlanır.

## Koşullar (örnek AURORA-PILOT-001)
| Koşul | İçerik | Süre |
|---|---|---|
| A | 432 Hz sine | 10 dk |
| B | 528 Hz sine | 10 dk |
| C | 639 Hz sine | 10 dk |
| D | Sessizlik (kontrol) | 10 dk |
| E (ops.) | Rastgele frekans (kontrol) | 10 dk |
| F (ops.) | Ambient müzik (kontrol) | 10 dk |

Sekans protokolleri: `A: 432→528→639 / 5-8-13 dk`, `B: 13-8-5 ters`, `C: tek`, `D: rastgele`, `E: sessizlik`.

## Randomizasyon & körleme
- Her oturumda koşul sırası tohumlu (seed) karıştırılır; katılımcı yalnızca "Koşul B" görür.
- Ses seviyesi tüm koşullarda eşit (gain 0.15, kulaklık).
- Aynı saat, aynı ortam, kulaklık.

## Ölçüm
Pre / Post (0–10): energy, calm, focus, motivation, sleepiness, restlessness. `change = post − pre`.
Fizyolojik (v2): HR, HRV, uyku, hareket, solunum.

## Primary / Secondary
- Primary: `calm_change` (deney başlamadan dondurulur)
- Secondary: energy_change, focus_change

## İstatistik
- Koşul başına ortalama Δ, SD, %95 CI (t), Cohen's d (kontrol D'ye göre), eşleştirilmiş t-testi
- Çoklu karşılaştırma: Bonferroni (k = koşul − 1)
- p tek başına başarı kriteri değildir; etki büyüklüğü + CI raporlanır
- **Discovery seti** → finalist → **Validation seti**; validation geçmeden "keşif" etiketi kalır

## Güç analizi (ZORUNLU — veri toplamadan önce)

```bash
aurora power --conditions 3 --effect 1.4    # Aşama 1: tarama
aurora power --conditions 2 --effect 0.8    # Aşama 2: doğrulama
```

| Tasarım | k | n/koşul | Toplam | MDE | Güç (d=0.8) |
|---|---:|---:|---:|---:|---:|
| Aşama 1 tarama (A/B/D) | 2 | 10 | 30 | d≈1.4 | %23 (bilinçli düşük) |
| Aşama 2 doğrulama (X/D) | 1 | 26 | 52 | d≈0.8 | %80 |

**Neden iki aşama:** 4 koşullu tek aşamalı tasarım d=0.8 için koşul başına 35 deneme
(toplam 23 saat) ister. İki aşamalı tasarım aynı kararı ~14 saatte verir: önce ucuz tarama,
sonra yalnızca öne çıkan koşul için tam güçlü doğrulama.

**Kural:** Yetersiz güçlü çalışma "etki yok" sonucunu **desteklemez**. Aşama 1'de null
çıkması yalnızca "d≈1.4'ten büyük etki yok" demektir. Her raporda MDE belirtilir.

Uygulamada bu hesap Deney → Kurulum ekranında canlıdır; %80 altında uyarı gösterilir ve
güç bilgisi `Study.design` içinde saklanarak Sonuçlar ekranında tekrar gösterilir.

## Preregistration checklist
- [ ] primary outcome önceden tanımlandı
- [ ] primary karşılaştırma önceden tanımlandı
- [ ] randomizasyon tanımlandı
- [ ] körleme tanımlandı
- [ ] dışlama kuralları tanımlandı
- [ ] çoklu karşılaştırma planı tanımlandı
- [ ] analiz kodu unblind öncesi donduruldu
- [ ] **güç analizi yapıldı; hedef etki büyüklüğü ve MDE kayıtlı**

## "Şans" ölçümü (30 gün günlük)
Önceden tanımlı sayılabilir olaylar: new_opportunity, positive_interaction, business_lead, unexpected_positive_event, goal_completion, social_interaction + mood/energy. Zincir: exposure → mood → behavior → opportunity exposure → observed outcome. Korelasyon ≠ nedensellik.

## Chladni
Gerçek ölçüm kaydı: frekans, levha şekli/boyutu/kalınlığı/malzemesi, sınır koşulu, uyarım noktası/yönü, genlik, sıcaklık, görüntü, fingerprint. Aynı frekans × 5 tekrar → within-frequency similarity; 527/529/530/531 Hz → rezonans süreksizliği; 432 vs 864 → oktav-desen hipotezi.

## Güvenlik
20–20 000 Hz, gain ≤ 0.2, uzun süreli yüksek SPL yok, tıbbi tedavi iddiası yok.
