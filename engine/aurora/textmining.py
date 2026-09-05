"""Number Mining Engine (v2 iskeleti) — düz metinden sayı, tekrar ve oran çıkarımı.

PDF/OCR bu sürümde yok; girdi düz metindir. Çıkan her sayı 'counted' veya 'explicit' etiketiyle
kaydedilir; yorum eklenmez.
"""
from __future__ import annotations

import re
from collections import Counter

from .math_analysis import match_reference_ratios

WORD_NUMBERS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
    "ten": 10, "twelve": 12, "forty": 40, "seventy": 70, "hundred": 100,
    "bir": 1, "iki": 2, "üç": 3, "dört": 4, "beş": 5, "altı": 6, "yedi": 7, "sekiz": 8, "dokuz": 9,
    "on": 10, "oniki": 12, "kırk": 40, "yetmiş": 70, "yüz": 100,
}


def explicit_numbers(text: str) -> list[int]:
    nums = [int(x) for x in re.findall(r"\b\d{1,6}\b", text)]
    words = [WORD_NUMBERS[w] for w in re.findall(r"[a-zçğıöşü]+", text.lower()) if w in WORD_NUMBERS]
    return nums + words


def repetition_counts(text: str, min_len: int = 4, top: int = 20) -> list[tuple[str, int]]:
    words = [w for w in re.findall(r"[a-zçğıöşü]+", text.lower()) if len(w) >= min_len]
    return Counter(words).most_common(top)


def structure(text: str) -> dict:
    lines = [l for l in text.splitlines() if l.strip()]
    return {"line_count": len(lines), "word_count": len(re.findall(r"\w+", text)),
            "line_lengths": [len(l.split()) for l in lines][:200]}


def mine(text: str) -> dict:
    nums = explicit_numbers(text)
    uniq = sorted(set(nums))
    return {
        "explicit_numbers": uniq,
        "number_frequency": dict(Counter(nums).most_common(30)),
        "repetitions": repetition_counts(text),
        "structure": structure(text),
        "ratio_matches": match_reference_ratios([n for n in uniq if 0 < n < 10000][:60]),
        "extraction": "explicit|counted",
        "note": "Counting is not decoding. Statistical control against shuffled text is required "
                "before any 'code' claim.",
    }


def shuffled_baseline(text: str, seed: int = 0, trials: int = 50) -> dict:
    """Gerçek metindeki oran eşleşme sayısını, sayıları karıştırılmış metinle karşılaştırır."""
    import random
    nums = [n for n in set(explicit_numbers(text)) if 0 < n < 10000][:60]
    real = len(match_reference_ratios(nums))
    rng = random.Random(seed)
    lo, hi = (min(nums), max(nums)) if nums else (1, 100)
    base = [len(match_reference_ratios([rng.randint(lo, hi) for _ in nums])) for _ in range(trials)]
    exceed = sum(1 for b in base if b >= real)
    return {"real_matches": real, "baseline_mean": sum(base) / max(1, len(base)),
            "p_empirical": (exceed + 1) / (trials + 1), "n": len(nums)}
