/** Corpus — engine/data/corpus.json'un uygulama içi kopyası (build sırasında aynı JSON import edilir). */
import raw from "../../../engine/data/corpus.json";
import type { CorpusNumber, CorpusRatio, CorpusSource, Candidate, EvidenceLevel } from "./types";
import { deriveFrequency } from "../core/math";

interface RawCorpus {
  sources: Array<{ source_id: string; civilization: string; date_range: string; title: string; citation: string }>;
  numbers: Array<{ number_id: string; source_id: string; value: number; context: string; extraction: string; evidence_level: string }>;
  ratios: Array<{ ratio_id: string; numerator: number; denominator: number; label: string; source_ids: string[]; evidence_level: string }>;
  popular_modern_claims: Array<{ hz: number; claimed_purpose: string; evidence_level: string }>;
}
const data = raw as unknown as RawCorpus;

export const SOURCES: CorpusSource[] = data.sources.map((s) => ({ sourceId: s.source_id, civilization: s.civilization, dateRange: s.date_range, title: s.title, citation: s.citation }));
export const NUMBERS: CorpusNumber[] = data.numbers.map((n) => ({ numberId: n.number_id, sourceId: n.source_id, value: n.value, context: n.context, extraction: n.extraction as CorpusNumber["extraction"], evidenceLevel: n.evidence_level as EvidenceLevel }));
export const RATIOS: CorpusRatio[] = data.ratios.map((r) => ({ ratioId: r.ratio_id, numerator: r.numerator, denominator: r.denominator, label: r.label, sourceIds: r.source_ids, evidenceLevel: r.evidence_level as EvidenceLevel }));
export const POPULAR = data.popular_modern_claims;

export const sourceById = (id: string) => SOURCES.find((s) => s.sourceId === id);
export const civilizationOf = (sourceId: string) => sourceById(sourceId)?.civilization ?? "modern";

/** Corpus'ta temsil edilen tüm uygarlıklar (alfabetik). */
export const CIVILIZATIONS: string[] = [...new Set(SOURCES.map((s) => s.civilization))].sort();

/** Bir uygarlığın kaynakları, sayıları ve oranları — Kütüphane tarayıcısı için. */
export interface CivilizationSummary {
  civilization: string;
  sources: CorpusSource[];
  numbers: CorpusNumber[];
  ratios: CorpusRatio[];
  evidenceCounts: Record<EvidenceLevel, number>;
}

export const summarizeCivilization = (civ: string): CivilizationSummary => {
  const sources = SOURCES.filter((s) => s.civilization === civ);
  const ids = new Set(sources.map((s) => s.sourceId));
  const numbers = NUMBERS.filter((n) => ids.has(n.sourceId));
  const counts: Record<EvidenceLevel, number> = { direct: 0, derived: 0, interpretive: 0, speculative: 0 };
  for (const n of numbers) counts[n.evidenceLevel]++;
  return {
    civilization: civ,
    sources,
    numbers: numbers.sort((a, b) => a.value - b.value),
    ratios: RATIOS.filter((r) => r.sourceIds.some((id) => ids.has(id))),
    evidenceCounts: counts,
  };
};

/** Corpus'un tamamı hakkında sayım — README ve Kütüphane başlığı için. */
export const corpusStats = () => ({
  civilizations: CIVILIZATIONS.length,
  sources: SOURCES.length,
  numbers: NUMBERS.length,
  ratios: RATIOS.length,
});

/** Uygarlıklar arası ortak sayılar (tanımlayıcı; 'gizli kod' kanıtı değil). */
export const sharedNumbers = (): Array<{ value: number; civilizations: string[] }> => {
  const map = new Map<number, Set<string>>();
  for (const n of NUMBERS) (map.get(n.value) ?? map.set(n.value, new Set()).get(n.value)!).add(civilizationOf(n.sourceId));
  return [...map.entries()].filter(([, c]) => c.size >= 2).map(([value, c]) => ({ value, civilizations: [...c].sort() })).sort((a, b) => a.value - b.value);
};

/** Corpus → türev aday frekanslar (hepsi derived/candidate). */
export const seedCandidates = (baseHz = 432, lo = 100, hi = 1000): Candidate[] => {
  const now = Date.now();
  const out: Candidate[] = [];
  for (const p of POPULAR) out.push({ id: `POP-${p.hz}`, hz: p.hz, origin: "popular", evidenceLevel: "speculative", status: "candidate", sourceIds: ["MOD-SOLF"], createdAt: now });
  for (const n of NUMBERS) {
    if (n.sourceId === "MOD-SOLF") continue;
    let f = n.value;
    while (f < lo) f *= 2;
    while (f > hi) f /= 2;
    out.push({ id: `NUM-${n.numberId}`, hz: Math.round(f * 1000) / 1000, origin: "derived", evidenceLevel: "derived", status: "candidate", formula: `${n.value} × 2^k`, sourceIds: [n.sourceId], createdAt: now });
  }
  for (const r of RATIOS) {
    const f = deriveFrequency(baseHz, r.numerator, r.denominator, lo, hi);
    out.push({ id: `RAT-${r.ratioId}`, hz: Math.round(f * 1000) / 1000, origin: "derived", evidenceLevel: "derived", status: "candidate", formula: `${baseHz} × ${r.numerator}/${r.denominator}`, sourceIds: r.sourceIds, createdAt: now });
  }
  const seen = new Set<number>();
  return out.filter((c) => (seen.has(c.hz) ? false : (seen.add(c.hz), true))).sort((a, b) => a.hz - b.hz);
};
