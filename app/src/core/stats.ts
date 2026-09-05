/** Statistics Engine — Δ, %95 CI, Welch t, Cohen d, Bonferroni. p tek başına başarı ölçütü değildir. */
import type { OutcomeKey, Trial } from "../data/types";

export interface ConditionStats {
  conditionId: string;
  n: number;
  meanChange: number;
  sd: number | null;
  ci95: [number, number] | null;
  cohenD: number | null;
  p: number | null;
  pAdjusted: number | null;
  isControl: boolean;
}

const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;
const variance = (x: number[]) => {
  const m = mean(x);
  return x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1);
};

/** Öğrenci t dağılımı kritik değeri (iki yönlü α=0.05) — küçük df için tablo, büyük için normal yaklaşım */
const T975: Record<number, number> = { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 12: 2.179, 15: 2.131, 20: 2.086, 25: 2.06, 30: 2.042, 40: 2.021, 60: 2.0, 120: 1.98 };
export const tCrit = (df: number): number => {
  if (df <= 0) return NaN;
  const keys = Object.keys(T975).map(Number).sort((a, b) => a - b);
  for (const k of keys) if (df <= k) return T975[k];
  return 1.96;
};

/** Düzenli gama fonksiyonu tabanlı t-dağılımı CDF (Abramowitz–Stegun yakl. yerine sayısal integral) */
export const tCdf = (t: number, df: number): number => {
  // Student t CDF via incomplete beta: I_x(df/2, 1/2), x = df/(df+t²)
  const x = df / (df + t * t);
  const ib = incompleteBeta(x, df / 2, 0.5);
  return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
};

const logGamma = (z: number): number => {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
};

const incompleteBeta = (x: number, a: number, b: number): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(x, a, b)) / a;
  return 1 - (bt * betacf(1 - x, b, a)) / b;
};

const betacf = (x: number, a: number, b: number): number => {
  const MAXIT = 200, EPS = 3e-14, FPMIN = 1e-300;
  let c = 1, d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
};

/** Welch t-testi, iki yönlü p */
export const welch = (a: number[], b: number[]): { t: number; df: number; p: number } => {
  const va = variance(a) / a.length, vb = variance(b) / b.length;
  const t = (mean(a) - mean(b)) / Math.sqrt(va + vb);
  const df = (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1));
  const p = 2 * (1 - tCdf(Math.abs(t), df));
  return { t, df, p: Math.min(1, Math.max(0, p)) };
};

export const cohenD = (a: number[], b: number[]): number => {
  const pooled = Math.sqrt(((a.length - 1) * variance(a) + (b.length - 1) * variance(b)) / (a.length + b.length - 2));
  return pooled > 0 ? (mean(a) - mean(b)) / pooled : 0;
};

export const bonferroni = (p: number, k: number) => Math.min(1, p * Math.max(1, k));

export const changesByCondition = (trials: Trial[], outcome: OutcomeKey): Record<string, number[]> => {
  const out: Record<string, number[]> = {};
  for (const t of trials) {
    if (!t.pre || !t.post) continue;
    (out[t.conditionId] ??= []).push(t.post[outcome] - t.pre[outcome]);
  }
  return out;
};

export const analyzeStudy = (trials: Trial[], outcome: OutcomeKey, controlId: string): { comparisons: number; conditions: ConditionStats[] } => {
  const groups = changesByCondition(trials, outcome);
  const ctrl = groups[controlId] ?? [];
  const k = Math.max(1, Object.keys(groups).length - 1);
  const conditions = Object.entries(groups).map(([cid, x]): ConditionStats => {
    const n = x.length;
    const m = n ? mean(x) : NaN;
    const sd = n > 1 ? Math.sqrt(variance(x)) : null;
    const ci: [number, number] | null = sd !== null ? [m - (tCrit(n - 1) * sd) / Math.sqrt(n), m + (tCrit(n - 1) * sd) / Math.sqrt(n)] : null;
    let d: number | null = null, p: number | null = null;
    if (cid !== controlId && n > 1 && ctrl.length > 1) {
      d = cohenD(x, ctrl);
      p = welch(x, ctrl).p;
    }
    return { conditionId: cid, n, meanChange: m, sd, ci95: ci, cohenD: d, p, pAdjusted: p === null ? null : bonferroni(p, k), isControl: cid === controlId };
  });
  return { comparisons: k, conditions };
};

export const evidenceGrade = (r: ConditionStats, replicated = false): "insufficient" | "null" | "weak_signal" | "discovery" | "validated" => {
  if (r.n < 5 || r.pAdjusted === null || r.cohenD === null) return "insufficient";
  if (r.pAdjusted < 0.05 && Math.abs(r.cohenD) >= 0.5) return replicated ? "validated" : "discovery";
  if (r.pAdjusted < 0.1 && Math.abs(r.cohenD) >= 0.3) return "weak_signal";
  return "null";
};

/** Spearman ρ — sıra etkisi ve günlük korelasyonu için */
export const spearman = (x: number[], y: number[]): number | null => {
  if (x.length < 3 || x.length !== y.length) return null;
  const rank = (v: number[]) => {
    const idx = v.map((val, i) => ({ val, i })).sort((a, b) => a.val - b.val);
    const r = new Array<number>(v.length);
    for (let i = 0; i < idx.length; ) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1].val === idx[i].val) j++;
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) r[idx[k].i] = avg;
      i = j + 1;
    }
    return r;
  };
  const rx = rank(x), ry = rank(y);
  const mx = mean(rx), my = mean(ry);
  const num = rx.reduce((s, v, i) => s + (v - mx) * (ry[i] - my), 0);
  const den = Math.sqrt(rx.reduce((s, v) => s + (v - mx) ** 2, 0) * ry.reduce((s, v) => s + (v - my) ** 2, 0));
  return den === 0 ? 0 : num / den;
};
