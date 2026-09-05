/** Power — deney başlamadan önce güç/örneklem hesabı (engine/aurora/power.py eşleniği).
 *
 * Neden: n=5 ile d=1.8 gibi büyük bir gerçek etki bile Bonferroni sonrası anlamlı çıkmaz.
 * Yetersiz güçle yürütülen bir çalışma "etki yok" sonucunu desteklemez.
 */
import { tCdf } from "./stats";

/** Box–Muller ile deterministik normal örnek (tohumlu). */
const mulberry = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const normal = (rng: () => number, mean: number) => {
  const u = Math.max(rng(), 1e-12);
  return mean + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
};

const meanOf = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;
const varOf = (x: number[]) => {
  const m = meanOf(x);
  return x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1);
};

/** Welch t + Bonferroni altında gerçek etkiyi yakalama olasılığı (simülasyon). */
export const powerTwoSample = (n: number, effectD: number, comparisons = 1, alpha = 0.05, sims = 600, seed = 0): number => {
  if (n < 2) return 0;
  const rng = mulberry(seed);
  let hits = 0;
  for (let s = 0; s < sims; s++) {
    const a = Array.from({ length: n }, () => normal(rng, effectD));
    const b = Array.from({ length: n }, () => normal(rng, 0));
    const va = varOf(a) / n, vb = varOf(b) / n;
    const t = (meanOf(a) - meanOf(b)) / Math.sqrt(va + vb);
    const df = (va + vb) ** 2 / (va ** 2 / (n - 1) + vb ** 2 / (n - 1));
    const p = 2 * (1 - tCdf(Math.abs(t), df));
    if (Math.min(1, p * Math.max(1, comparisons)) < alpha) hits++;
  }
  return hits / sims;
};

/** Hedef güç için koşul başına gereken deneme sayısı. */
export const requiredN = (effectD: number, comparisons = 1, targetPower = 0.8, alpha = 0.05): number | null => {
  for (let n = 4; n <= 200; n += n < 40 ? 1 : 5) {
    if (powerTwoSample(n, effectD, comparisons, alpha, 400, n) >= targetPower) return n;
  }
  return null;
};

/** Verilen n ile saptanabilecek en küçük etki (MDE). */
export const detectableEffect = (n: number, comparisons = 1, targetPower = 0.8, alpha = 0.05): number | null => {
  for (let d = 0.2; d <= 4.0; d += 0.1) {
    if (powerTwoSample(n, d, comparisons, alpha, 400, Math.round(d * 10)) >= targetPower) return Math.round(d * 10) / 10;
  }
  return null;
};

export interface PowerPlan {
  conditions: number;
  comparisons: number;
  nPerCondition: number;
  totalTrials: number;
  totalHours: number;
  detectableD: number | null;
  powerAtTarget: number;
  adequate: boolean;
}

/** Kullanıcının seçtiği tasarımın gücünü değerlendirir. */
export const evaluateDesign = (conditions: number, repetitions: number, minutesPerTrial: number, targetD = 0.8): PowerPlan => {
  const comparisons = Math.max(1, conditions - 1);
  const powerAtTarget = powerTwoSample(repetitions, targetD, comparisons, 0.05, 400, 11);
  return {
    conditions,
    comparisons,
    nPerCondition: repetitions,
    totalTrials: conditions * repetitions,
    totalHours: Math.round((conditions * repetitions * minutesPerTrial) / 6) / 10,
    detectableD: detectableEffect(repetitions, comparisons),
    powerAtTarget,
    adequate: powerAtTarget >= 0.8,
  };
};
