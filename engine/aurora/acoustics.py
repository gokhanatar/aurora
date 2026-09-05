"""Ses üretimi ve spektral analiz (numpy/scipy)."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import find_peaks

from .models import Stimulus

MAX_AMPLITUDE = 0.2   # güvenlik sınırı


def _envelope(n: int, sr: int, attack_s: float = 0.02, release_s: float = 0.08) -> np.ndarray:
    env = np.ones(n)
    a, r = min(n, int(sr * attack_s)), min(n, int(sr * release_s))
    if a:
        env[:a] = np.linspace(0, 1, a, endpoint=False)
    if r:
        env[-r:] = np.linspace(1, 0, r, endpoint=False)
    return env


def _clamp_amp(amplitude: float) -> float:
    if amplitude < 0:
        raise ValueError("amplitude must be >= 0")
    return min(amplitude, MAX_AMPLITUDE)


def waveform(kind: str, phase: np.ndarray) -> np.ndarray:
    """phase: 2π f t. Desteklenen: sine, triangle, square, saw."""
    if kind == "sine":
        return np.sin(phase)
    x = (phase / (2 * np.pi)) % 1.0
    if kind == "triangle":
        return 4 * np.abs(x - 0.5) - 1
    if kind == "square":
        return np.where(x < 0.5, 1.0, -1.0)
    if kind == "saw":
        return 2 * x - 1
    raise ValueError(f"unknown waveform: {kind}")


def tone(freq_hz: float, duration_s: float, sr: int = 48000, amplitude: float = 0.15,
         kind: str = "sine") -> np.ndarray:
    if freq_hz <= 0 or duration_s <= 0:
        raise ValueError("frequency and duration must be positive")
    n = int(round(duration_s * sr))
    t = np.arange(n) / sr
    x = _clamp_amp(amplitude) * waveform(kind, 2 * np.pi * freq_hz * t)
    return x * _envelope(n, sr)


def silence(duration_s: float, sr: int = 48000) -> np.ndarray:
    return np.zeros(int(round(max(0.0, duration_s) * sr)))


def harmonic_tone(freq_hz: float, duration_s: float, harmonic_amps: list[float],
                  sr: int = 48000, amplitude: float = 0.15) -> np.ndarray:
    if not harmonic_amps:
        raise ValueError("harmonic_amps cannot be empty")
    n = int(round(duration_s * sr))
    t = np.arange(n) / sr
    x = np.zeros(n)
    for k, a in enumerate(harmonic_amps, start=1):
        x += float(a) * np.sin(2 * np.pi * freq_hz * k * t)
    peak = np.max(np.abs(x))
    if peak > 0:
        x = x / peak * _clamp_amp(amplitude)
    return x * _envelope(n, sr)


def binaural(carrier_hz: float, beat_hz: float, duration_s: float, sr: int = 48000,
             amplitude: float = 0.15) -> np.ndarray:
    """İki kanal: sol carrier, sağ carrier+beat. Shape (n, 2)."""
    left = tone(carrier_hz, duration_s, sr, amplitude)
    right = tone(carrier_hz + beat_hz, duration_s, sr, amplitude)
    return np.stack([left, right], axis=1)


def amplitude_modulated(freq_hz: float, mod_hz: float, duration_s: float, sr: int = 48000,
                        amplitude: float = 0.15, depth: float = 0.5) -> np.ndarray:
    n = int(round(duration_s * sr))
    t = np.arange(n) / sr
    carrier = np.sin(2 * np.pi * freq_hz * t)
    mod = 1 - depth + depth * (0.5 + 0.5 * np.sin(2 * np.pi * mod_hz * t))
    return _clamp_amp(amplitude) * carrier * mod * _envelope(n, sr)


def sweep(f0: float, f1: float, duration_s: float, sr: int = 48000, amplitude: float = 0.15) -> np.ndarray:
    from scipy.signal import chirp
    n = int(round(duration_s * sr))
    t = np.arange(n) / sr
    return _clamp_amp(amplitude) * chirp(t, f0, duration_s, f1, method="logarithmic") * _envelope(n, sr)


def render_stimulus(stim: Stimulus) -> np.ndarray:
    parts: list[np.ndarray] = []
    for _ in range(stim.repetitions):
        for i, step in enumerate(stim.steps):
            if step.hz <= 0:
                parts.append(silence(step.duration_s, stim.sample_rate))
            else:
                parts.append(tone(step.hz, step.duration_s, stim.sample_rate, stim.amplitude, stim.waveform))
            if i < len(stim.steps) - 1:
                parts.append(silence(stim.gap_s, stim.sample_rate))
    return np.concatenate(parts) if parts else np.zeros(0)


def write_wav(path: str | Path, samples: np.ndarray, sr: int = 48000) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
    wavfile.write(path, sr, pcm)
    return path


def read_wav(path: str | Path) -> tuple[int, np.ndarray]:
    sr, x = wavfile.read(path)
    if x.ndim == 2:
        x = x.mean(axis=1)
    x = x.astype(np.float64)
    if np.issubdtype(np.asarray(x).dtype, np.floating) and np.max(np.abs(x)) > 1:
        x /= np.max(np.abs(x))
    elif np.max(np.abs(x)) > 1:
        x /= 32768.0
    return int(sr), x


def spectrum(samples: np.ndarray, sr: int = 48000) -> tuple[np.ndarray, np.ndarray]:
    x = np.asarray(samples, dtype=np.float64)
    if x.size == 0:
        return np.zeros(0), np.zeros(0)
    y = np.fft.rfft(x * np.hanning(len(x)))
    freq = np.fft.rfftfreq(len(x), 1 / sr)
    mag = np.abs(y)
    if mag.max() > 0:
        mag = mag / mag.max()
    return freq, mag


def dominant_frequencies(samples: np.ndarray, sr: int = 48000, count: int = 10,
                         min_hz: float = 20, max_hz: float = 20000) -> list[tuple[float, float]]:
    freq, mag = spectrum(samples, sr)
    if freq.size == 0:
        return []
    mask = (freq >= min_hz) & (freq <= max_hz)
    peaks, _ = find_peaks(mag[mask], distance=max(1, int(len(freq) / 2000)), height=0.01)
    if peaks.size == 0:
        return []
    mf, ff = mag[mask][peaks], freq[mask][peaks]
    order = np.argsort(mf)[::-1][:count]
    return [(float(ff[i]), float(mf[i])) for i in order]


def audio_features(samples: np.ndarray, sr: int = 48000) -> dict[str, float]:
    """ML için özellik vektörü: F0, harmonik oranları, spektral centroid/bandwidth, RMS, crest."""
    x = np.asarray(samples, dtype=np.float64)
    if x.ndim == 2:
        x = x.mean(axis=1)
    if x.size == 0:
        return {}
    freq, mag = spectrum(x, sr)
    power = mag ** 2
    total = power.sum() or 1.0
    centroid = float((freq * power).sum() / total)
    bandwidth = float(np.sqrt(((freq - centroid) ** 2 * power).sum() / total))
    rms = float(np.sqrt(np.mean(x ** 2)))
    peak = float(np.max(np.abs(x))) or 1e-12
    doms = dominant_frequencies(x, sr, count=8)
    f0 = doms[0][0] if doms else 0.0
    h2 = h3 = 0.0
    if f0 > 0:
        for f, m in doms:
            r = f / f0
            if abs(r - 2) < 0.05:
                h2 = m
            elif abs(r - 3) < 0.05:
                h3 = m
    silence_ratio = float(np.mean(np.abs(x) < 1e-4))
    return {
        "fundamental_hz": round(f0, 3), "harmonic_2": round(h2, 4), "harmonic_3": round(h3, 4),
        "spectral_centroid": round(centroid, 3), "spectral_bandwidth": round(bandwidth, 3),
        "rms": round(rms, 5), "crest_factor": round(peak / (rms or 1e-12), 3),
        "duration_s": round(len(x) / sr, 3), "silence_ratio": round(silence_ratio, 4),
    }
