/** Matematiksel özellikler — engine/aurora/math_analysis.py ile birebir. Tanımlayıcı; iddia taşımaz. */

export const REFERENCE_RATIOS: Record<string, [number, number]> = {
  unison: [1, 1],
  octave: [2, 1],
  fifth: [3, 2],
  fourth: [4, 3],
  major_second: [9, 8],
  major_third_just: [5, 4],
  minor_third_just: [6, 5],
  major_sixth_just: [5, 3],
  minor_seventh_harmonic: [7, 4],
};

/** İnsan işitme aralığı — ses üretiminin "duyulabilir" bandı. */
export const AUDIBLE_LO = 20;
export const AUDIBLE_HI = 20000;

/** Uygulamanın çalışabildiği tam aralık: infrasound → ultrasound.
 *  Alt sınır 0.1 Hz (10 saniyede bir salınım), üst sınır 96 kHz (48 kHz örnekleme × 2 Nyquist).
 *  Duyulamayan bantlar da üretilir ve analiz edilir; ancak hoparlör/kulaklık çoğunu
 *  fiziksel olarak basamaz — bu yüzden her banda dürüst bir uyarı iliştirilir. */
export const SPECTRUM_LO = 0.1;
export const SPECTRUM_HI = 96000;

export type BandId = "infrasound" | "bass" | "midrange" | "treble" | "ultrasound";

export interface Band {
  id: BandId;
  lo: number;
  hi: number;
  /** Kulakla duyulabilir mi? */
  audible: boolean;
  /** Tipik tüketici donanımı bu bandı basabilir mi? */
  reproducible: boolean;
}

export const BANDS: Band[] = [
  { id: "infrasound", lo: 0.1, hi: 20, audible: false, reproducible: false },
  { id: "bass", lo: 20, hi: 250, audible: true, reproducible: true },
  { id: "midrange", lo: 250, hi: 4000, audible: true, reproducible: true },
  { id: "treble", lo: 4000, hi: 20000, audible: true, reproducible: true },
  { id: "ultrasound", lo: 20000, hi: 96000, audible: false, reproducible: false },
];

export const bandOf = (hz: number): Band =>
  BANDS.find((b) => hz >= b.lo && hz < b.hi) ?? BANDS[hz < 0.1 ? 0 : BANDS.length - 1];
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export interface RatioFeature {
  label: string;
  numerator: number;
  denominator: number;
  errorCents: number;
}

export interface FrequencyAnalysis {
  hz: number;
  octaveClass: number;
  note440: string;
  note432: string;
  integer: boolean;
  prime: boolean | null;
  factorization: number[];
  digitSum: number | null;
  digitalRoot: number | null;
  harmonics: number[];
  ratios: RatioFeature[];
}

export const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let p = 3; p * p <= n; p += 2) if (n % p === 0) return false;
  return true;
};

export const factorize = (n0: number): number[] => {
  let n = Math.abs(Math.trunc(n0));
  if (n < 2) return [];
  const out: number[] = [];
  for (let p = 2; p * p <= n; p += p === 2 ? 1 : 2) {
    while (n % p === 0) {
      out.push(p);
      n = n / p;
    }
  }
  if (n > 1) out.push(n);
  return out;
};

export const digitSum = (n: number): number =>
  String(Math.abs(n)).split("").reduce((a, c) => a + Number(c), 0);

export const digitalRoot = (n: number): number => (n === 0 ? 0 : 1 + ((Math.abs(n) - 1) % 9));

export const octaveReduce = (f: number, low = 1): number => {
  if (f <= 0) throw new Error("frequency must be positive");
  let x = f;
  while (x < low) x *= 2;
  while (x >= 2 * low) x /= 2;
  return x;
};

/** |1200·log2(a/b)| */
export const cents = (a: number, b: number): number => Math.abs(1200 * Math.log2(a / b));

export const nearestNote = (f: number, a4 = 440): string => {
  const midi = Math.round(69 + 12 * Math.log2(f / a4));
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
};

export const referenceRatioFeatures = (f: number): RatioFeature[] => {
  const x = octaveReduce(f);
  return Object.entries(REFERENCE_RATIOS)
    .map(([label, [n, d]]) => ({ label, numerator: n, denominator: d, errorCents: cents(x, octaveReduce(n / d)) }))
    .sort((a, b) => a.errorCents - b.errorCents);
};

export const harmonics = (f: number, count = 8): number[] => Array.from({ length: count }, (_, k) => f * (k + 1));

export const analyzeFrequency = (hz: number): FrequencyAnalysis => {
  if (hz <= 0) throw new Error("frequency must be > 0");
  const integer = Number.isInteger(hz);
  const n = integer ? hz : null;
  return {
    hz,
    octaveClass: octaveReduce(hz),
    note440: nearestNote(hz, 440),
    note432: nearestNote(hz, 432),
    integer,
    prime: n === null ? null : isPrime(n),
    factorization: n === null ? [] : factorize(n),
    digitSum: n === null ? null : digitSum(n),
    digitalRoot: n === null ? null : digitalRoot(n),
    harmonics: harmonics(hz),
    ratios: referenceRatioFeatures(hz),
  };
};

/** base × n/d → duyulabilir aralığa oktav kaydırma */
export const deriveFrequency = (base: number, n: number, d: number, lo = AUDIBLE_LO, hi = AUDIBLE_HI): number => {
  if (base <= 0 || n <= 0 || d <= 0) throw new Error("all inputs must be positive");
  let f = (base * n) / d;
  while (f < lo) f *= 2;
  while (f > hi) f /= 2;
  return f;
};

export const frequencyFamily = (base: number): Record<string, number> =>
  Object.fromEntries(Object.entries(REFERENCE_RATIOS).map(([k, [n, d]]) => [k, deriveFrequency(base, n, d)]));

/** Osilatöre gönderilecek değeri güvenli tam aralığa sıkıştırır (duyulabilir bandla sınırlı DEĞİL). */
export const clampHz = (hz: number): number => Math.min(SPECTRUM_HI, Math.max(SPECTRUM_LO, hz));

/** Web Audio örnekleme hızına göre gerçekten üretilebilir mi? (Nyquist sınırı) */
export const isRenderable = (hz: number, sampleRate = 48000): boolean => hz > 0 && hz < sampleRate / 2;
