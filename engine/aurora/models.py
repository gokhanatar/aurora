"""Veri modelleri. Hiçbir alan 'şifa' veya 'enerji' iddiası taşımaz."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

EvidenceLevel = Literal["direct", "derived", "interpretive", "speculative"]
HypothesisStatus = Literal["candidate", "tested", "validated", "rejected"]
MeasurementKind = Literal["simulation", "real"]


@dataclass(frozen=True)
class RatioFeature:
    numerator: int
    denominator: int
    ratio: float
    error_cents: float
    label: str


@dataclass(frozen=True)
class FrequencyAnalysis:
    frequency_hz: float
    octave_class_hz: float
    nearest_note_440: str
    nearest_note_432: str
    integer: bool
    prime: bool | None
    factorization: tuple[int, ...]
    digit_sum: int | None
    digital_root: int | None
    harmonics: tuple[float, ...]
    notable_ratios: tuple[RatioFeature, ...]
    evidence: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class Step:
    hz: float          # 0 = sessizlik
    duration_s: float


@dataclass(frozen=True)
class Stimulus:
    stimulus_id: str
    steps: tuple[Step, ...]
    gap_s: float = 0.5
    repetitions: int = 1
    waveform: str = "sine"
    amplitude: float = 0.15
    sample_rate: int = 48000

    @property
    def total_seconds(self) -> float:
        one = sum(s.duration_s for s in self.steps) + self.gap_s * max(0, len(self.steps) - 1)
        return one * self.repetitions


@dataclass(frozen=True)
class Condition:
    condition_id: str
    label: str
    stimulus: Stimulus | None      # None = sessizlik kontrolü
    kind: str = "stimulus"         # stimulus | silence_control | random_control | music_control


@dataclass(frozen=True)
class Outcome:
    energy: float
    calm: float
    focus: float
    motivation: float = 5.0
    sleepiness: float = 5.0
    restlessness: float = 5.0

    def delta(self, other: "Outcome") -> dict[str, float]:
        return {k: getattr(other, k) - getattr(self, k) for k in OUTCOME_FIELDS}


OUTCOME_FIELDS = ("energy", "calm", "focus", "motivation", "sleepiness", "restlessness")


@dataclass(frozen=True)
class Trial:
    trial_id: str
    study_id: str
    participant_id: str
    condition_id: str
    order_index: int
    seed: int
    pre: Outcome | None = None
    post: Outcome | None = None
    notes: str = ""


@dataclass(frozen=True)
class PatternFingerprint:
    symmetry: float
    radial_symmetry: float
    complexity: float
    density: float
    node_count: int
    dominant_angle_deg: float

    def as_vector(self) -> tuple[float, ...]:
        return (self.symmetry, self.radial_symmetry, self.complexity,
                self.density, min(self.node_count, 64) / 64.0, self.dominant_angle_deg / 180.0)


@dataclass(frozen=True)
class PatternRecord:
    pattern_id: str
    hz: float
    kind: MeasurementKind
    fingerprint: PatternFingerprint
    plate: dict[str, Any] = field(default_factory=dict)
    image_ref: str | None = None
