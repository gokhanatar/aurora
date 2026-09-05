/** Discovery — evrimsel arama + anomali. AI hakem değil; yalnızca ADAY üretir (candidate). */
import { AUDIBLE_HI, AUDIBLE_LO, analyzeFrequency } from "./math";
import { mathematicalScore } from "./scoring";

const mulberry = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const featureVector = (hz: number): number[] => {
  const a = analyzeFrequency(hz);
  return [
    Math.log2(hz),
    a.factorization.length ? new Set(a.factorization).size : 0,
    (a.digitalRoot ?? 0) / 9,
    a.ratios[0].errorCents / 600,
    a.prime ? 1 : 0,
    mathematicalScore(hz) / 40,
  ];
};

const wrap = (f: number) => {
  let x = f;
  while (x > AUDIBLE_HI) x /= 2;
  while (x < AUDIBLE_LO) x *= 2;
  return x;
};

export const mutate = (hz: number, rng: () => number, maxCents = 15): number => hz * 2 ** ((rng() * 2 - 1) * maxCents / 1200);

export const combine = (a: number, b: number, rng: () => number): number => {
  const r = rng();
  if (r < 1 / 3) return wrap(Math.sqrt(a * b));
  if (r < 2 / 3) return wrap(a * (b / a) ** [0.5, 1.5, 2 / 3, 3 / 2][Math.floor(rng() * 4)]);
  return wrap(a + b);
};

export interface Generation { generation: number; population: number[]; label: "measured" | "exploratory" }

export const evolve = (population: number[], fitness: Record<number, number> | null, generations = 3, keep = 6, children = 12, seed = 0): Generation[] => {
  const rng = mulberry(seed);
  let pop = [...new Set(population.map((f) => Math.round(f * 1000) / 1000))].sort((a, b) => a - b);
  const fit = (f: number) => (fitness && f in fitness ? fitness[f] : mathematicalScore(f) / 40);
  const out: Generation[] = [];
  for (let g = 0; g < generations; g++) {
    const ranked = [...pop].sort((a, b) => fit(b) - fit(a)).slice(0, keep);
    const next = new Set(ranked);
    let guard = 0;
    while (next.size < keep + children && guard++ < 1000) {
      if (rng() < 0.6) next.add(Math.round(mutate(ranked[Math.floor(rng() * ranked.length)], rng) * 1000) / 1000);
      else {
        const a = ranked[Math.floor(rng() * ranked.length)], b = ranked[Math.floor(rng() * ranked.length)];
        next.add(Math.round(combine(a, b, rng) * 1000) / 1000);
      }
    }
    pop = [...next].sort((a, b) => a - b);
    out.push({ generation: g + 1, population: pop, label: fitness ? "measured" : "exploratory" });
  }
  return out;
};

export const anomalies = (freqs: number[], z = 1.5): Array<{ hz: number; distance: number }> => {
  if (freqs.length < 4) return [];
  const X = freqs.map(featureVector);
  const dim = X[0].length;
  const mu = Array.from({ length: dim }, (_, j) => X.reduce((s, r) => s + r[j], 0) / X.length);
  const sd = Array.from({ length: dim }, (_, j) => Math.sqrt(X.reduce((s, r) => s + (r[j] - mu[j]) ** 2, 0) / X.length) + 1e-9);
  const dist = X.map((r) => Math.sqrt(r.reduce((s, v, j) => s + ((v - mu[j]) / sd[j]) ** 2, 0)));
  const m = dist.reduce((a, b) => a + b, 0) / dist.length;
  const s = Math.sqrt(dist.reduce((a, b) => a + (b - m) ** 2, 0) / dist.length);
  return freqs.map((hz, i) => ({ hz, distance: dist[i] })).filter((r) => r.distance > m + z * s);
};

export const scan = (lo: number, hi: number, stepCents = 50, top = 20) => {
  const out: Array<{ hz: number; score: number }> = [];
  for (let f = lo; f <= hi; f *= 2 ** (stepCents / 1200)) {
    const hz = Math.round(f * 1000) / 1000;
    out.push({ hz, score: mathematicalScore(hz) });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, top);
};
