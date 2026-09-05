"""Experiment Engine — randomizasyon, körleme, trial kaydı, preregistration."""
from __future__ import annotations

import csv
import json
import random
import uuid
from dataclasses import asdict, replace
from datetime import datetime, timezone
from pathlib import Path

from .models import OUTCOME_FIELDS, Condition, Outcome, Trial

PREREG_KEYS = (
    "primary_outcome_defined_before_data",
    "primary_comparison_defined_before_data",
    "randomization_defined_before_data",
    "blinding_defined_before_data",
    "exclusion_rules_defined_before_data",
    "multiple_comparison_plan_defined",
    "analysis_code_frozen_before_unblinding",
)


def blinded_labels(condition_ids: list[str], seed: int) -> dict[str, str]:
    """Gerçek koşul → katılımcıya gösterilen anonim etiket (A, B, C…)."""
    rng = random.Random(seed ^ 0x5EED)
    letters = [chr(ord("A") + i) for i in range(len(condition_ids))]
    rng.shuffle(letters)
    return dict(zip(condition_ids, letters))


def randomized_order(condition_ids: list[str], seed: int) -> list[str]:
    rng = random.Random(seed)
    items = list(condition_ids)
    rng.shuffle(items)
    return items


def latin_square_orders(condition_ids: list[str]) -> list[list[str]]:
    """Sıra etkisini dengelemek için döngüsel Latin kare."""
    n = len(condition_ids)
    return [[condition_ids[(i + j) % n] for j in range(n)] for i in range(n)]


def make_trials(study_id: str, participant_id: str, conditions: list[Condition], seed: int,
                repetitions: int = 1) -> list[Trial]:
    trials: list[Trial] = []
    idx = 0
    for r in range(repetitions):
        for cid in randomized_order([c.condition_id for c in conditions], seed + r):
            trials.append(Trial(str(uuid.uuid4()), study_id, participant_id, cid, idx, seed))
            idx += 1
    return trials


def record(trial: Trial, pre: Outcome, post: Outcome, notes: str = "") -> Trial:
    return replace(trial, pre=pre, post=post, notes=notes)


def trial_effect(trial: Trial) -> dict[str, float | None]:
    if trial.pre is None or trial.post is None:
        return {f"{k}_change": None for k in OUTCOME_FIELDS}
    return {f"{k}_change": v for k, v in trial.pre.delta(trial.post).items()}


def preregistration(primary_outcome: str | None, conditions: list[Condition] | None,
                    exclusion_rules: str | None, correction: str | None, frozen: bool) -> dict:
    checks = {
        "primary_outcome_defined_before_data": primary_outcome in OUTCOME_FIELDS,
        "primary_comparison_defined_before_data": bool(conditions) and len(conditions) >= 2,
        "randomization_defined_before_data": True,
        "blinding_defined_before_data": True,
        "exclusion_rules_defined_before_data": bool(exclusion_rules),
        "multiple_comparison_plan_defined": correction in {"bonferroni", "holm", "none_prespecified"},
        "analysis_code_frozen_before_unblinding": frozen,
    }
    return {**checks, "ready": all(checks.values()),
            "frozen_at": datetime.now(timezone.utc).isoformat() if frozen else None}


def _flat(t: Trial) -> dict:
    row = {"trial_id": t.trial_id, "study_id": t.study_id, "participant_id": t.participant_id,
           "condition_id": t.condition_id, "order_index": t.order_index, "seed": t.seed, "notes": t.notes}
    for k in OUTCOME_FIELDS:
        row[f"pre_{k}"] = getattr(t.pre, k) if t.pre else ""
        row[f"post_{k}"] = getattr(t.post, k) if t.post else ""
    return row


def write_trials_csv(path: str | Path, trials: list[Trial]) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = [_flat(t) for t in trials]
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()) if rows else ["trial_id"])
        w.writeheader()
        w.writerows(rows)
    return path


def read_trials_csv(path: str | Path) -> list[Trial]:
    out: list[Trial] = []
    with Path(path).open(encoding="utf-8") as f:
        for r in csv.DictReader(f):
            def outcome(prefix: str) -> Outcome | None:
                vals = {k: r.get(f"{prefix}_{k}", "") for k in OUTCOME_FIELDS}
                if any(v == "" for v in (vals["energy"], vals["calm"], vals["focus"])):
                    return None
                return Outcome(**{k: float(v) if v != "" else 5.0 for k, v in vals.items()})
            out.append(Trial(r["trial_id"], r["study_id"], r["participant_id"], r["condition_id"],
                             int(r["order_index"]), int(r["seed"]), outcome("pre"), outcome("post"),
                             r.get("notes", "")))
    return out


def write_study_json(path: str | Path, study: dict) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(study, indent=2, ensure_ascii=False), encoding="utf-8")
    return path
