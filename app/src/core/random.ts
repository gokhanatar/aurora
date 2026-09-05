/** Gerçek rastgele frekans üretimi.
 *
 * "Pure random": hiçbir listeden, hazır kümeden ya da tohumdan seçim yapılmaz.
 * `crypto.getRandomValues` ile kriptografik kalitede rastgelelik kullanılır —
 * `Math.random()` gibi tahmin edilebilir bir üretece dayanmaz ve tekrarlanamaz.
 *
 * Üretilen sayı tam sayıya yuvarlanmaz: 417.382 Hz gibi ondalıklı değerler çıkar.
 * Bu kasıtlıdır — "özel sayı" ön yargısını (432, 528 gibi) tamamen dışarıda bırakır.
 */
import { SPECTRUM_HI, SPECTRUM_LO } from "./math";

/** [0,1) aralığında kriptografik rastgele sayı. */
const rand01 = (): number => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  }
  return Math.random();
};

export type RandomScale = "log" | "linear";

/**
 * Aralıkta tek bir rastgele frekans.
 *
 * `log` ölçek varsayılandır: insan işitmesi logaritmiktir, bu yüzden 20–20 000 Hz
 * aralığında düz (linear) çekim sayıların %90'ını tiz bölgeye yığar. Log çekim
 * her oktava eşit şans verir.
 */
export const randomFrequency = (lo = SPECTRUM_LO, hi = SPECTRUM_HI, scale: RandomScale = "log", decimals = 3): number => {
  const a = Math.max(SPECTRUM_LO, Math.min(lo, hi));
  const b = Math.min(SPECTRUM_HI, Math.max(lo, hi));
  if (!(a > 0) || !(b > 0) || a === b) return Math.round(a * 10 ** decimals) / 10 ** decimals;
  const u = rand01();
  const v = scale === "log" ? a * (b / a) ** u : a + u * (b - a);
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

/** Birden fazla rastgele frekans (birbirinden bağımsız, sıralı döndürülür). */
export const randomFrequencies = (count: number, lo?: number, hi?: number, scale: RandomScale = "log", decimals = 3): number[] =>
  Array.from({ length: Math.max(1, Math.min(16, Math.trunc(count))) }, () => randomFrequency(lo, hi, scale, decimals)).sort((x, y) => x - y);

export interface RangePreset {
  id: string;
  lo: number;
  hi: number;
}

export const RANGE_PRESETS: RangePreset[] = [
  { id: "rangeAudible", lo: 20, hi: 20000 },
  { id: "rangeMusical", lo: 100, hi: 1000 },
  { id: "rangeSolfeggio", lo: 174, hi: 963 },
  { id: "rangeFull", lo: SPECTRUM_LO, hi: SPECTRUM_HI },
];
