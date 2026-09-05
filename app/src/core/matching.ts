/** Frekans eşleştirme teknikleri — engine/aurora/matching.py ile aynı mantık. */
import { REFERENCE_RATIOS, cents, octaveReduce } from "./math";

export interface CentMatch { cents: number; match: boolean; octaveEquivalent: boolean }
export interface RationalMatch { ratio: string; value: number; errorCents: number; match: boolean; referenceLabel: string | null; complexity: number }
export interface HarmonicMatch { direct: { kind: "f1_of_f2" | "f2_of_f1"; k: number } | null; common: { p: number; q: number; commonHz: number; errorCents: number } | null; match: boolean }

/** 1–2. Cent uzaklığı; oktav eşdeğerliği ile çevrimsel mesafe */
export const centMatch = (f1: number, f2: number, tol = 8, octaveEquivalent = false): CentMatch => {
  let c = octaveEquivalent ? cents(octaveReduce(f1), octaveReduce(f2)) : cents(f1, f2);
  if (octaveEquivalent) c = Math.min(c, 1200 - c);
  return { cents: c, match: c <= tol, octaveEquivalent };
};

/** Sürekli kesir ile payda sınırlı en iyi rasyonel yaklaşım (Fraction.limit_denominator eşdeğeri). */
export const limitDenominator = (x: number, maxDen = 16): [number, number] => {
  let best: [number, number] = [Math.round(x), 1];
  let bestErr = Math.abs(x - best[0]);
  for (let d = 1; d <= maxDen; d++) {
    const n = Math.round(x * d);
    const err = Math.abs(x - n / d);
    if (n > 0 && err < bestErr - 1e-12) {
      best = [n, d];
      bestErr = err;
    }
  }
  const g = gcd(best[0], best[1]);
  return [best[0] / g, best[1] / g];
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** 3. Rasyonel oran eşleştirme */
export const rationalMatch = (f1: number, f2: number, maxDen = 16, tol = 8): RationalMatch => {
  const x = f1 / f2;
  const [n, d] = limitDenominator(x, maxDen);
  const err = cents(x, n / d);
  const label =
    Object.entries(REFERENCE_RATIOS).find(([, [rn, rd]]) => (rn === n && rd === d) || (rn === d && rd === n))?.[0] ?? null;
  return { ratio: `${n}:${d}`, value: n / d, errorCents: err, match: err <= tol, referenceLabel: label, complexity: n + d };
};

/** 4. Harmonik eşleştirme: f1 ≈ k·f2 / ortak harmonik p·f1 ≈ q·f2 */
export const harmonicMatch = (f1: number, f2: number, maxH = 16, tol = 8): HarmonicMatch => {
  let direct: HarmonicMatch["direct"] = null;
  for (let k = 1; k <= maxH && !direct; k++) {
    if (cents(f1, k * f2) <= tol) direct = { kind: "f1_of_f2", k };
    else if (cents(f2, k * f1) <= tol) direct = { kind: "f2_of_f1", k };
  }
  let common: HarmonicMatch["common"] = null;
  for (let p = 1; p <= maxH; p++)
    for (let q = 1; q <= maxH; q++) {
      const err = cents(p * f1, q * f2);
      if (err <= tol && (!common || p + q < common.p + common.q)) common = { p, q, commonHz: p * f1, errorCents: err };
    }
  return { direct, common, match: Boolean(direct || common) };
};

/** 5. Spektral tepe ↔ hedef eşleştirme */
export const spectralMatch = (peaks: Array<[number, number]>, targets: number[], tol = 15) =>
  targets.map((t) => {
    const cand = peaks.filter(([p]) => p > 0).map(([p, m]) => ({ c: cents(p, t), p, m })).sort((a, b) => a.c - b.c)[0];
    return cand ? { target: t, peakHz: cand.p, magnitude: cand.m, errorCents: cand.c, match: cand.c <= tol } : { target: t, match: false };
  });

/** 6. DTW — iki frekans dizisi arasında hizalanmış cent uzaklığı (uzunluk normalize) */
export const dtwDistance = (a: number[], b: number[], metric: "cents" | "abs" = "cents"): number => {
  if (!a.length || !b.length) return Infinity;
  const d = (x: number, y: number) => {
    if (metric === "abs") return Math.abs(x - y);
    if (x <= 0 || y <= 0) return x === y ? 0 : 2400;
    return Math.abs(1200 * Math.log2(x / y));
  };
  const D = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(Infinity));
  D[0][0] = 0;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      D[i][j] = d(a[i - 1], b[j - 1]) + Math.min(D[i - 1][j], D[i][j - 1], D[i - 1][j - 1]);
  return D[a.length][b.length] / (a.length + b.length);
};

/** Sekans 'grameri': ardışık geçişlerin işaretli cent değerleri */
export const intervalProfile = (seq: number[]): number[] =>
  seq.slice(1).map((b, i) => (seq[i] > 0 && b > 0 ? 1200 * Math.log2(b / seq[i]) : 0));

export const sequenceMatch = (a: number[], b: number[], tol = 50) => {
  const dtw = dtwDistance(a, b);
  const pa = intervalProfile(a).map((x) => 1000 + x);
  const pb = intervalProfile(b).map((x) => 1000 + x);
  const prof = pa.length && pb.length ? dtwDistance(pa, pb, "abs") : Infinity;
  return { dtwCents: dtw, intervalProfileDistance: prof, match: dtw <= tol, transpositionInvariantMatch: prof <= tol };
};

/** 7. Parmak izi benzerliği (0–1) — enerji benzerliği DEĞİL, geometrik benzerlik */
export const vectorSimilarity = (va: number[], vb: number[]): number => {
  const dist = Math.sqrt(va.reduce((s, x, i) => s + (x - vb[i]) ** 2, 0));
  return Math.max(0, 1 - dist / Math.sqrt(va.length));
};
