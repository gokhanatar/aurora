"""Matching Engine — frekans eşleştirme teknikleri.

1. Cent uzaklığı (perde algısı)          cents = 1200·log2(f1/f2)
2. Oktav eşdeğerliği                      f ~ f·2^k  → octave class
3. Rasyonel oran eşleştirme               f1/f2 ≈ n/d (Stern–Brocot / sürekli kesir)
4. Harmonik eşleştirme                    f1 = k·f2 veya ortak harmonik (LCM benzeri)
5. Spektral tepe eşleştirme               ölçülen tepe ↔ hedef Hz (tolerans cent)
6. Sekans eşleştirme (DTW)                iki frekans dizisi arasında hizalanmış uzaklık
7. Desen parmak izi benzerliği            chladni.similarity / mask IoU
8. Kümeleme                               feature vector → k-means (numpy)
"""
from __future__ import annotations

from fractions import Fraction
from math import gcd, log2

import numpy as np

from .math_analysis import REFERENCE_RATIOS, cents, octave_reduce


# 1–2 ---------------------------------------------------------------------

def cent_match(f1: float, f2: float, tolerance_cents: float = 8.0, octave_equivalent: bool = False) -> dict:
    a, b = (octave_reduce(f1), octave_reduce(f2)) if octave_equivalent else (f1, f2)
    c = cents(a, b)
    if octave_equivalent:
        c = min(c, 1200 - c)
    return {"f1": f1, "f2": f2, "cents": round(c, 3), "match": c <= tolerance_cents,
            "octave_equivalent": octave_equivalent}


def octave_class(f: float, precision: int = 4) -> float:
    return round(octave_reduce(f), precision)


# 3 -------------------------------------------------------------------------

def rational_match(f1: float, f2: float, max_denominator: int = 16, tolerance_cents: float = 8.0) -> dict:
    """f1/f2 oranına en yakın basit kesir ve cent hatası. Sürekli kesir (Fraction.limit_denominator)."""
    if f1 <= 0 or f2 <= 0:
        raise ValueError("frequencies must be positive")
    x = f1 / f2
    fr = Fraction(x).limit_denominator(max_denominator)
    err = cents(x, float(fr)) if fr > 0 else float("inf")
    label = next((k for k, (n, d) in REFERENCE_RATIOS.items()
                  if Fraction(n, d) == fr or Fraction(d, n) == fr), None)
    return {"ratio": f"{fr.numerator}:{fr.denominator}", "value": float(fr), "error_cents": round(err, 3),
            "match": err <= tolerance_cents, "reference_label": label, "complexity": fr.numerator + fr.denominator}


# 4 -------------------------------------------------------------------------

def harmonic_match(f1: float, f2: float, max_harmonic: int = 16, tolerance_cents: float = 8.0) -> dict:
    """f1 ≈ k·f2 veya f2 ≈ k·f1; ayrıca en küçük ortak harmonik (p·f1 ≈ q·f2)."""
    best = None
    for p in range(1, max_harmonic + 1):
        for q in range(1, max_harmonic + 1):
            err = cents(p * f1, q * f2)
            if err <= tolerance_cents and (best is None or p + q < best["p"] + best["q"]):
                best = {"p": p, "q": q, "common_hz": round(p * f1, 3), "error_cents": round(err, 3)}
    direct = None
    for k in range(1, max_harmonic + 1):
        if cents(f1, k * f2) <= tolerance_cents:
            direct = {"f1_is_harmonic_of_f2": k}
            break
        if cents(f2, k * f1) <= tolerance_cents:
            direct = {"f2_is_harmonic_of_f1": k}
            break
    return {"direct": direct, "common_harmonic": best, "match": bool(direct or best)}


# 5 -------------------------------------------------------------------------

def spectral_match(peaks: list[tuple[float, float]], targets: list[float], tolerance_cents: float = 15.0) -> list[dict]:
    """Ölçülen (hz, mag) tepeleri hedef frekanslarla eşler; her hedef için en yakın tepe."""
    out = []
    for t in targets:
        cand = [(cents(p, t), p, m) for p, m in peaks if p > 0]
        if not cand:
            out.append({"target": t, "peak": None, "match": False})
            continue
        c, p, m = min(cand)
        out.append({"target": t, "peak_hz": round(p, 3), "magnitude": round(m, 4),
                    "error_cents": round(c, 3), "match": c <= tolerance_cents})
    return out


# 6 -------------------------------------------------------------------------

def dtw_distance(seq_a: list[float], seq_b: list[float], metric: str = "cents") -> float:
    """Dynamic Time Warping — farklı uzunluktaki iki frekans dizisi arasında hizalanmış uzaklık."""
    if not seq_a or not seq_b:
        return float("inf")
    def d(x: float, y: float) -> float:
        if metric == "cents":
            if x <= 0 or y <= 0:
                return 0.0 if x == y else 2400.0
            return abs(1200 * log2(x / y))
        return abs(x - y)
    n, m = len(seq_a), len(seq_b)
    D = np.full((n + 1, m + 1), np.inf)
    D[0, 0] = 0.0
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            D[i, j] = d(seq_a[i - 1], seq_b[j - 1]) + min(D[i - 1, j], D[i, j - 1], D[i - 1, j - 1])
    return float(D[n, m] / (n + m))


def interval_profile(seq: list[float]) -> list[float]:
    """Sekansın 'gramer'i: ardışık geçişlerin cent değerleri (işaretli)."""
    return [round(1200 * log2(b / a), 3) if a > 0 and b > 0 else 0.0 for a, b in zip(seq, seq[1:])]


def sequence_match(seq_a: list[float], seq_b: list[float], tolerance: float = 50.0) -> dict:
    dist = dtw_distance(seq_a, seq_b)
    pa, pb = interval_profile(seq_a), interval_profile(seq_b)
    prof = dtw_distance([1000 + x for x in pa], [1000 + x for x in pb], metric="abs") if pa and pb else float("inf")
    return {"dtw_cents": round(dist, 3), "interval_profile_distance": round(prof, 3),
            "match": dist <= tolerance, "transposition_invariant_match": prof <= tolerance}


# 8 -------------------------------------------------------------------------

def kmeans(X: np.ndarray, k: int = 3, iters: int = 50, seed: int = 0) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    X = np.asarray(X, dtype=float)
    C = X[rng.choice(len(X), size=min(k, len(X)), replace=False)]
    labels = np.zeros(len(X), dtype=int)
    for _ in range(iters):
        dist = ((X[:, None, :] - C[None, :, :]) ** 2).sum(axis=2)
        new = dist.argmin(axis=1)
        if np.array_equal(new, labels) and _ > 0:
            break
        labels = new
        for j in range(len(C)):
            if np.any(labels == j):
                C[j] = X[labels == j].mean(axis=0)
    return labels, C


def cluster_frequencies(freqs: list[float], k: int = 3, seed: int = 0) -> dict[int, list[float]]:
    from .discovery import feature_vector
    X = np.stack([feature_vector(f) for f in freqs])
    X = (X - X.mean(axis=0)) / (X.std(axis=0) + 1e-9)
    labels, _ = kmeans(X, k, seed=seed)
    out: dict[int, list[float]] = {}
    for f, l in zip(freqs, labels):
        out.setdefault(int(l), []).append(f)
    return out


def match_report(f1: float, f2: float) -> dict:
    return {"cents": cent_match(f1, f2), "cents_octave": cent_match(f1, f2, octave_equivalent=True),
            "rational": rational_match(f1, f2), "harmonic": harmonic_match(f1, f2)}
