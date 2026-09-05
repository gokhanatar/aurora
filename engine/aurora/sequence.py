"""Sequence Engine — frekans + süre + sıra + tekrar → akustik protokol (stimulus fingerprint)."""
from __future__ import annotations

import hashlib
import json
import random
from dataclasses import asdict

from .models import Step, Stimulus

FIBONACCI_MIN = (5, 8, 13)
POPULAR = (174, 285, 396, 417, 432, 528, 639, 741, 852, 963)


def fingerprint(steps: list[Step], gap_s: float, repetitions: int, waveform: str, amplitude: float) -> str:
    payload = json.dumps({"steps": [asdict(s) for s in steps], "gap": gap_s, "rep": repetitions,
                          "wave": waveform, "amp": amplitude}, sort_keys=True)
    return "STM-" + hashlib.sha1(payload.encode()).hexdigest()[:10].upper()


def build(freqs: list[float], minutes: list[float], gap_s: float = 0.5, repetitions: int = 1,
          waveform: str = "sine", amplitude: float = 0.15) -> Stimulus:
    if len(freqs) != len(minutes):
        raise ValueError("freqs and minutes must have equal length")
    if any(m <= 0 for m in minutes):
        raise ValueError("durations must be positive")
    steps = [Step(float(f), float(m) * 60.0) for f, m in zip(freqs, minutes)]
    return Stimulus(fingerprint(steps, gap_s, repetitions, waveform, amplitude), tuple(steps),
                    gap_s, repetitions, waveform, amplitude)


def protocol_set(freqs: list[float], minutes: list[float] = list(FIBONACCI_MIN), seed: int = 0,
                 lo: float = 100.0, hi: float = 1000.0) -> dict[str, Stimulus]:
    """Karşılaştırma seti: A ileri, B ters süre, C tek frekans, D rastgele frekans, E sessizlik."""
    rng = random.Random(seed)
    n = len(freqs)
    mins = list(minutes)[:n] if len(minutes) >= n else [minutes[i % len(minutes)] for i in range(n)]
    total = sum(mins)
    return {
        "A_forward": build(freqs, mins),
        "B_reversed_durations": build(freqs, list(reversed(mins))),
        "C_single": build([freqs[0]], [total]),
        "D_random": build([round(rng.uniform(lo, hi), 2) for _ in range(n)], mins),
        "E_silence": build([0.0] * n, mins),
    }


def permutations_of(freqs: list[float], minutes: list[float]) -> list[Stimulus]:
    from itertools import permutations
    return [build(list(p), minutes) for p in permutations(freqs)]


def to_json(stim: Stimulus) -> dict:
    return {"stimulus_id": stim.stimulus_id, "sequence": [s.hz for s in stim.steps],
            "durations": [s.duration_s for s in stim.steps], "gap_s": stim.gap_s,
            "repetitions": stim.repetitions, "waveform": stim.waveform, "amplitude": stim.amplitude,
            "sample_rate": stim.sample_rate, "total_seconds": stim.total_seconds}
