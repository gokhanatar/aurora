"""Discovery AI — evrimsel frekans arama + anomali tespiti (numpy only, deterministik seed).

AI hakem değildir: yalnızca önceden tanımlı endpoint üzerinden ölçülen veriden veya
tanımlayıcı özelliklerden yeni ADAY üretir. Adaylar insan deneyi olmadan 'candidate' kalır.
"""
from __future__ import annotations

import random
from math import log2

import numpy as np

from .math_analysis import AUDIBLE_HI, AUDIBLE_LO, analyze_frequency, cents
from .scoring import mathematical_score

MUTATION_CENTS = 15.0


def feature_vector(freq: float) -> np.ndarray:
    a = analyze_frequency(freq)
    best = a.notable_ratios[0]
    return np.asarray([
        log2(freq),
        len(set(a.factorization)) if a.factorization else 0.0,
        (a.digital_root or 0) / 9.0,
        best.error_cents / 600.0,
        1.0 if a.prime else 0.0,
        mathematical_score(freq) / 40.0,
    ], dtype=float)


def mutate(freq: float, rng: random.Random, max_cents: float = MUTATION_CENTS) -> float:
    return freq * 2 ** (rng.uniform(-max_cents, max_cents) / 1200.0)


def combine(a: float, b: float, rng: random.Random) -> float:
    """Geometrik ortalama, oran türevi veya toplam — rastgele bir kombinasyon operatörü."""
    op = rng.choice(("geo", "ratio", "sum"))
    if op == "geo":
        f = (a * b) ** 0.5
    elif op == "ratio":
        f = a * (b / a) ** rng.choice((0.5, 1.5, 2 / 3, 3 / 2))
    else:
        f = a + b
    while f > AUDIBLE_HI:
        f /= 2
    while f < AUDIBLE_LO:
        f *= 2
    return f


def evolve(population: list[float], fitness: dict[float, float] | None = None, generations: int = 5,
           keep: int = 6, children: int = 12, seed: int = 0) -> list[dict]:
    """fitness: {hz: ölçülen etki} (deneyden). Yoksa yalnızca matematiksel skor kullanılır — bu durumda
    çıktı 'exploratory' etikettir."""
    rng = random.Random(seed)
    pop = sorted({round(float(f), 3) for f in population})
    history = []
    for g in range(generations):
        def fit(f: float) -> float:
            if fitness and f in fitness:
                return fitness[f]
            return mathematical_score(f) / 40.0
        ranked = sorted(pop, key=fit, reverse=True)[:keep]
        new: set[float] = set(ranked)
        while len(new) < keep + children:
            if rng.random() < 0.6:
                new.add(round(mutate(rng.choice(ranked), rng), 3))
            else:
                a, b = rng.sample(ranked, 2) if len(ranked) > 1 else (ranked[0], ranked[0])
                new.add(round(combine(a, b, rng), 3))
        pop = sorted(new)
        history.append({"generation": g + 1, "population": pop,
                        "label": "measured" if fitness else "exploratory"})
    return history


def anomalies(freqs: list[float], z_threshold: float = 2.0) -> list[dict]:
    """Özellik uzayında çoğunluktan olağandışı ayrılan adaylar (z-score, Öklid)."""
    if len(freqs) < 4:
        return []
    X = np.stack([feature_vector(f) for f in freqs])
    mu, sd = X.mean(axis=0), X.std(axis=0) + 1e-9
    Z = (X - mu) / sd
    dist = np.linalg.norm(Z, axis=1)
    thr = dist.mean() + z_threshold * dist.std()
    return [{"hz": f, "distance": round(float(d), 3), "anomaly": bool(d > thr)}
            for f, d in zip(freqs, dist) if d > thr]


def scan(lo: float, hi: float, step_cents: float = 50.0, top: int = 20) -> list[dict]:
    """Aralığı cent adımlarıyla tarar, matematiksel skoru en yüksek adayları verir (exploratory)."""
    out, f = [], lo
    while f <= hi:
        out.append({"hz": round(f, 3), "mathematical_score": mathematical_score(round(f, 3))})
        f *= 2 ** (step_cents / 1200.0)
    return sorted(out, key=lambda r: r["mathematical_score"], reverse=True)[:top]


def sequence_transitions(protocols: list[list[float]], responses: list[float]) -> dict[str, float]:
    """'Frequency grammar' araştırması: geçiş (f_i → f_j) başına ortalama yanıt."""
    acc: dict[str, list[float]] = {}
    for seq, r in zip(protocols, responses):
        for a, b in zip(seq, seq[1:]):
            acc.setdefault(f"{a:g}->{b:g}", []).append(r)
    return {k: round(float(np.mean(v)), 4) for k, v in sorted(acc.items(), key=lambda kv: -np.mean(kv[1]))}
