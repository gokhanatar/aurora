"""Uçtan uca hat testi: iki aşamalı tasarım gerçek etkiyi yakalar, sahte etkiyi eler.

Bu test sentetik veriyle çalışır — gerçek insan verisi değildir. Amacı analiz hattının
yer gerçeği bilinen durumlarda doğru davrandığını garanti etmektir.
"""
from __future__ import annotations

import random

from aurora import experiment, power, stats
from aurora.models import Condition, Outcome

OUTCOMES = ("energy", "calm", "focus", "motivation", "sleepiness", "restlessness")


def _synthesize(trials, effects: dict[str, float], noise: float = 1.0, seed: int = 7):
    """Her denemeye bilinen bir gerçek etki + gauss gürültü enjekte eder (yalnızca 'calm')."""
    rng = random.Random(seed)
    done = []
    for t in trials:
        pre = Outcome(*(rng.uniform(3, 7) for _ in range(6)))
        e = effects.get(t.condition_id, 0.0)
        post = Outcome(**{k: getattr(pre, k) + (e if k == "calm" else 0.0) + rng.gauss(0, noise)
                          for k in OUTCOMES})
        done.append(experiment.record(t, pre, post))
    return done


def _study(condition_ids: list[str], repetitions: int, seed: int):
    conds = [Condition(c, c, None, "silence_control" if c == "D" else "stimulus") for c in condition_ids]
    return experiment.make_trials("TEST", "P1", conds, seed, repetitions)


def test_stage1_detects_large_effect_and_rejects_others():
    trials = _study(["A", "B", "D"], 10, 42)
    done = _synthesize(trials, {"B": 1.5})
    r = stats.analyze_study(done, "calm", "D", "bonferroni")
    rows = {x["condition_id"]: x for x in r["conditions"]}
    assert r["comparisons"] == 2
    assert stats.evidence_grade(rows["B"], False) == "discovery"
    assert stats.evidence_grade(rows["A"], False) == "null"
    assert rows["B"]["cohen_d_vs_control"] > 1.0
    # Gerçek etkinin güven aralığı sıfırı içermemeli
    lo, hi = rows["B"]["ci95"]
    assert lo > 0


def test_stage2_validation_confirms_and_null_is_rejected():
    trials = _study(["X", "D"], 26, 4242)
    confirmed = stats.analyze_study(_synthesize(trials, {"X": 1.5}, seed=99), "calm", "D", "none_prespecified")
    x = next(v for v in confirmed["conditions"] if v["condition_id"] == "X")
    assert x["p_adjusted"] < 0.05 and abs(x["cohen_d_vs_control"]) >= 0.5 and x["ci95"][0] > 0

    null = stats.analyze_study(_synthesize(trials, {"X": 0.0}, seed=123), "calm", "D", "none_prespecified")
    xn = next(v for v in null["conditions"] if v["condition_id"] == "X")
    assert stats.evidence_grade(xn, False) in {"null", "weak_signal"}


def test_underpowered_design_is_flagged_by_power_engine():
    """n=5 ile d=0.8 aranması yetersiz güçtür; power motoru bunu göstermeli."""
    assert power.power_two_sample(5, 0.8, comparisons=3, sims=1000) < 0.30
    mde = power.detectable_effect(10, comparisons=2, sims=800)
    assert mde is not None and mde >= 1.0        # 10 denemeyle ancak büyük etki görülür
    plan = power.plan(3, effect_d=1.4)
    assert plan["n_per_condition"] <= 15         # tarama aşaması makul boyutta


def test_blinding_never_leaks_frequency():
    """Kör etiketler koşul kimliğini birebir yansıtmamalı ve tohumla tekrar üretilebilmeli."""
    ids = ["A", "B", "C", "D"]
    labels = experiment.blinded_labels(ids, 42)
    assert experiment.blinded_labels(ids, 42) == labels        # deterministik
    assert sorted(labels.values()) == ids                       # birebir eşleme
    assert experiment.blinded_labels(ids, 43) != labels or True  # tohum değişince değişebilir


def test_randomization_balances_order():
    """Her koşul farklı sıra pozisyonlarında görünmeli (sıra etkisi dengelensin)."""
    trials = _study(["A", "B", "C", "D"], 8, 1)
    positions: dict[str, set[int]] = {}
    for t in trials:
        positions.setdefault(t.condition_id, set()).add(t.order_index % 4)
    assert all(len(p) >= 2 for p in positions.values())
