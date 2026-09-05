"""Exploratory score — şeffaf, önceden kaydedilebilir ağırlıklar.

UYARI: Bu puan terapötik/metafizik etki kanıtı DEĞİLDİR. Sadece araştırma adaylarını sıralar.
Experimental + Replication olmadan hiçbir aday 'validated' olamaz.
"""
from __future__ import annotations

from .corpus import Corpus
from .math_analysis import analyze_frequency

CENTS_TIGHT, CENTS_LOOSE = 8.0, 25.0
EVIDENCE_PENALTY = {"direct": 0.0, "derived": 5.0, "interpretive": 15.0, "speculative": 30.0}
WARNING = "Exploratory ranking; not evidence of therapeutic or metaphysical efficacy."


def mathematical_score(freq: float) -> float:
    a = analyze_frequency(freq)
    score = 0.0
    if a.integer:
        score += 5.0                                   # yeniden üretilebilirlik (küçük katkı)
    if a.factorization:
        score += max(0.0, 10.0 - 2.0 * len(set(a.factorization)))   # düşük karmaşıklık
    best = a.notable_ratios[0]
    if best.error_cents <= CENTS_TIGHT:
        score += 25.0
    elif best.error_cents <= CENTS_LOOSE:
        score += 10.0
    return min(score, 40.0)


def historical_score(source_count: int, direct_numeric: bool, evidence_level: str) -> float:
    base = min(30.0, source_count * 5.0) + (10.0 if direct_numeric else 0.0)
    return max(0.0, base - EVIDENCE_PENALTY.get(evidence_level, 30.0))


def historical_from_corpus(freq: float, corpus: Corpus) -> tuple[float, list[dict]]:
    """Frekans tam sayıysa corpus'ta aynı sayıyı arar; en iyi kanıt seviyesiyle puanlar."""
    hits = corpus.numbers_equal(freq)
    if not hits:
        return 0.0, []
    order = ["direct", "derived", "interpretive", "speculative"]
    best = min(hits, key=lambda h: order.index(h["evidence_level"]))
    direct = any(h["extraction"] == "explicit" for h in hits)
    return historical_score(len({h["source_id"] for h in hits}), direct, best["evidence_level"]), hits


def candidate_score(freq: float, corpus: Corpus | None = None, source_count: int = 0,
                    direct_numeric: bool = False, evidence_level: str = "speculative") -> dict:
    math_s = mathematical_score(freq)
    hits: list[dict] = []
    if corpus is not None:
        hist_s, hits = historical_from_corpus(freq, corpus)
    else:
        hist_s = historical_score(source_count, direct_numeric, evidence_level)
    return {
        "frequency_hz": freq,
        "mathematical_score": round(math_s, 3),
        "historical_score": round(hist_s, 3),
        "exploratory_score": round(math_s + hist_s, 3),
        "corpus_hits": [h["number_id"] for h in hits],
        "experimental_score": None,
        "replication_score": None,
        "warning": WARNING,
    }


def rank_candidates(freqs: list[float], corpus: Corpus | None = None) -> list[dict]:
    return sorted((candidate_score(f, corpus) for f in freqs),
                  key=lambda r: r["exploratory_score"], reverse=True)
