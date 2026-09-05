"""Matematiksel özellikler: sayı teorisi, oranlar, cent uzaklığı, nota eşleme.

Bu modül yalnızca *tanımlayıcı* özellik üretir; tarihsel ya da terapötik iddia taşımaz.
"""
from __future__ import annotations

from math import log2

from .models import FrequencyAnalysis, RatioFeature

# Antik Yunan müzik teorisinde belgelenmiş oranlar (Pisagorcu gelenek, Platon Timaios).
REFERENCE_RATIOS: dict[str, tuple[int, int]] = {
    "unison": (1, 1),
    "octave": (2, 1),
    "fifth": (3, 2),
    "fourth": (4, 3),
    "major_second": (9, 8),
    "major_third_just": (5, 4),
    "minor_third_just": (6, 5),
    "major_sixth_just": (5, 3),
    "minor_seventh_harmonic": (7, 4),
}

NOTE_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
AUDIBLE_LO, AUDIBLE_HI = 20.0, 20000.0


def is_prime(n: int) -> bool:
    if n < 2:
        return False
    if n % 2 == 0:
        return n == 2
    p = 3
    while p * p <= n:
        if n % p == 0:
            return False
        p += 2
    return True


def factorize(n: int) -> tuple[int, ...]:
    n = abs(int(n))
    if n < 2:
        return ()
    out: list[int] = []
    p = 2
    while p * p <= n:
        while n % p == 0:
            out.append(p)
            n //= p
        p += 1 if p == 2 else 2
    if n > 1:
        out.append(n)
    return tuple(out)


def digit_sum(n: int) -> int:
    return sum(int(c) for c in str(abs(n)))


def digital_root(n: int) -> int:
    n = abs(n)
    return 0 if n == 0 else 1 + (n - 1) % 9


def octave_reduce(freq: float, low: float = 1.0) -> float:
    """freq'i [low, 2*low) aralığına oktav kaydırarak indirger."""
    if freq <= 0:
        raise ValueError("frequency must be positive")
    while freq < low:
        freq *= 2
    while freq >= 2 * low:
        freq /= 2
    return freq


def cents(a: float, b: float) -> float:
    """a ile b arasındaki mutlak perde farkı (cent)."""
    if a <= 0 or b <= 0:
        raise ValueError("frequencies must be positive")
    return abs(1200.0 * log2(a / b))


def nearest_note(freq: float, a4: float = 440.0) -> str:
    midi = round(69 + 12 * log2(freq / a4))
    return f"{NOTE_NAMES[midi % 12]}{midi // 12 - 1}"


def reference_ratio_features(freq: float, base: float = 1.0) -> tuple[RatioFeature, ...]:
    """Oktav indirgenmiş frekansın referans oranlara cent uzaklığı (küçükten büyüğe)."""
    f = octave_reduce(freq / base)
    feats = []
    for label, (n, d) in REFERENCE_RATIOS.items():
        target = octave_reduce(n / d)
        feats.append(RatioFeature(n, d, target, cents(f, target), label))
    return tuple(sorted(feats, key=lambda r: r.error_cents))


def harmonics(freq: float, count: int = 8) -> tuple[float, ...]:
    return tuple(freq * k for k in range(1, count + 1))


def analyze_frequency(freq: float) -> FrequencyAnalysis:
    if freq <= 0:
        raise ValueError("frequency must be > 0")
    integer = float(freq).is_integer()
    n = int(round(freq)) if integer else None
    return FrequencyAnalysis(
        frequency_hz=float(freq),
        octave_class_hz=octave_reduce(freq),
        nearest_note_440=nearest_note(freq, 440.0),
        nearest_note_432=nearest_note(freq, 432.0),
        integer=integer,
        prime=is_prime(n) if n is not None else None,
        factorization=factorize(n) if n is not None else (),
        digit_sum=digit_sum(n) if n is not None else None,
        digital_root=digital_root(n) if n is not None else None,
        harmonics=harmonics(freq),
        notable_ratios=reference_ratio_features(freq),
        evidence={"interpretation": "descriptive mathematical features only",
                  "historical_claim": False, "healing_claim": False},
    )


def derive_frequency(base_hz: float, numerator: int, denominator: int,
                     lo: float = AUDIBLE_LO, hi: float = AUDIBLE_HI) -> float:
    """base × n/d, sonra duyulabilir aralığa oktav kaydırma."""
    if base_hz <= 0 or numerator <= 0 or denominator <= 0:
        raise ValueError("all inputs must be positive")
    f = base_hz * numerator / denominator
    while f < lo:
        f *= 2
    while f > hi:
        f /= 2
    return f


def frequency_family(base_hz: float, ratios: dict[str, tuple[int, int]] | None = None) -> dict[str, float]:
    """Bir taban frekanstan referans oranlarla frekans ailesi üretir (ör. 432 → 648, 576, 864)."""
    ratios = ratios or REFERENCE_RATIOS
    return {label: derive_frequency(base_hz, n, d) for label, (n, d) in ratios.items()}


def ratios_between(numbers: list[int]) -> list[tuple[int, int, int, int]]:
    """Sayı listesindeki tüm çiftler için sadeleştirilmiş oranlar: (a, b, num, den)."""
    from math import gcd
    out = []
    for i, a in enumerate(numbers):
        for b in numbers[i + 1:]:
            if a <= 0 or b <= 0:
                continue
            hi_, lo_ = max(a, b), min(a, b)
            g = gcd(hi_, lo_)
            out.append((a, b, hi_ // g, lo_ // g))
    return out


def match_reference_ratios(numbers: list[int], tolerance_cents: float = 8.0) -> list[dict]:
    """Sayı çiftlerinden çıkan oranların referans oranlara yakınlığı (oktav indirgenmiş)."""
    matches = []
    for a, b, num, den in ratios_between(numbers):
        x = octave_reduce(num / den)
        for label, (rn, rd) in REFERENCE_RATIOS.items():
            err = cents(x, octave_reduce(rn / rd))
            if err <= tolerance_cents:
                matches.append({"a": a, "b": b, "ratio": f"{num}:{den}", "reference": label,
                                "error_cents": round(err, 3)})
    return matches
