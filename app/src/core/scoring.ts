/** Exploratory score — şeffaf ağırlıklar. Terapötik/metafizik kanıt DEĞİLDİR. */
import { analyzeFrequency } from "./math";
import type { CorpusNumber, EvidenceLevel } from "../data/types";

const CENTS_TIGHT = 8;
const CENTS_LOOSE = 25;
const EVIDENCE_PENALTY: Record<EvidenceLevel, number> = { direct: 0, derived: 5, interpretive: 15, speculative: 30 };
const ORDER: EvidenceLevel[] = ["direct", "derived", "interpretive", "speculative"];

export interface Score {
  hz: number;
  math: number;
  historical: number;
  exploratory: number;
  corpusHits: CorpusNumber[];
  experimental: number | null;
  replication: number | null;
}

export const mathematicalScore = (hz: number): number => {
  const a = analyzeFrequency(hz);
  let s = 0;
  if (a.integer) s += 5;
  if (a.factorization.length) s += Math.max(0, 10 - 2 * new Set(a.factorization).size);
  const best = a.ratios[0].errorCents;
  if (best <= CENTS_TIGHT) s += 25;
  else if (best <= CENTS_LOOSE) s += 10;
  return Math.min(s, 40);
};

export const historicalScore = (sourceCount: number, directNumeric: boolean, level: EvidenceLevel): number =>
  Math.max(0, Math.min(30, sourceCount * 5) + (directNumeric ? 10 : 0) - EVIDENCE_PENALTY[level]);

export const scoreFrequency = (hz: number, corpus: CorpusNumber[]): Score => {
  const hits = Number.isInteger(hz) ? corpus.filter((n) => n.value === hz) : [];
  let historical = 0;
  if (hits.length) {
    const best = hits.reduce((b, h) => (ORDER.indexOf(h.evidenceLevel) < ORDER.indexOf(b.evidenceLevel) ? h : b));
    historical = historicalScore(new Set(hits.map((h) => h.sourceId)).size, hits.some((h) => h.extraction === "explicit"), best.evidenceLevel);
  }
  const math = mathematicalScore(hz);
  return { hz, math, historical, exploratory: math + historical, corpusHits: hits, experimental: null, replication: null };
};
