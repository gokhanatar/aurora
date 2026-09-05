"""Statistics Engine — etki büyüklüğü, CI, eşleştirilmiş test, çoklu karşılaştırma düzeltmesi."""
from __future__ import annotations

from math import sqrt

import numpy as np
from scipy import stats as sps

from .models import Trial


def changes_by_condition(trials: list[Trial], outcome: str) -> dict[str, np.ndarray]:
    out: dict[str, list[float]] = {}
    for t in trials:
        if t.pre is None or t.post is None:
            continue
        out.setdefault(t.condition_id, []).append(getattr(t.post, outcome) - getattr(t.pre, outcome))
    return {k: np.asarray(v, dtype=float) for k, v in out.items()}


def mean_ci(x: np.ndarray, alpha: float = 0.05) -> tuple[float, float, float]:
    n = len(x)
    m = float(np.mean(x)) if n else float("nan")
    if n < 2:
        return m, float("nan"), float("nan")
    se = float(np.std(x, ddof=1)) / sqrt(n)
    h = sps.t.ppf(1 - alpha / 2, n - 1) * se
    return m, m - h, m + h


def cohen_d(a: np.ndarray, b: np.ndarray) -> float:
    if len(a) < 2 or len(b) < 2:
        return float("nan")
    pooled = sqrt(((len(a) - 1) * np.var(a, ddof=1) + (len(b) - 1) * np.var(b, ddof=1)) / (len(a) + len(b) - 2))
    return float((np.mean(a) - np.mean(b)) / pooled) if pooled > 0 else 0.0


def bonferroni(p: float, k: int) -> float:
    return min(1.0, p * max(1, k))


def holm(pvals: dict[str, float]) -> dict[str, float]:
    items = sorted(pvals.items(), key=lambda kv: kv[1])
    m = len(items)
    adjusted, running = {}, 0.0
    for i, (k, p) in enumerate(items):
        running = max(running, (m - i) * p)
        adjusted[k] = min(1.0, running)
    return adjusted


def analyze_study(trials: list[Trial], outcome: str, control_id: str,
                  correction: str = "bonferroni") -> dict:
    """Her koşul için: n, mean Δ, SD, %95 CI, kontrol ile Welch t, Cohen's d, düzeltilmiş p."""
    groups = changes_by_condition(trials, outcome)
    if control_id not in groups:
        raise ValueError(f"control condition {control_id!r} has no completed trials")
    ctrl = groups[control_id]
    k = max(1, len(groups) - 1)
    rows, raw_p = {}, {}
    for cid, x in groups.items():
        m, lo, hi = mean_ci(x)
        row = {"condition_id": cid, "n": int(len(x)), "mean_change": round(m, 4),
               "sd": round(float(np.std(x, ddof=1)), 4) if len(x) > 1 else None,
               "ci95": [round(lo, 4), round(hi, 4)], "cohen_d_vs_control": None, "p_value": None,
               "p_adjusted": None, "is_control": cid == control_id}
        if cid != control_id and len(x) > 1 and len(ctrl) > 1:
            t, p = sps.ttest_ind(x, ctrl, equal_var=False)
            row["cohen_d_vs_control"] = round(cohen_d(x, ctrl), 4)
            row["p_value"] = round(float(p), 5)
            raw_p[cid] = float(p)
        rows[cid] = row
    if correction == "holm":
        adj = holm(raw_p)
    else:
        adj = {cid: bonferroni(p, k) for cid, p in raw_p.items()}
    for cid, p in adj.items():
        rows[cid]["p_adjusted"] = round(p, 5)
    return {"outcome": outcome, "control_id": control_id, "correction": correction,
            "comparisons": k, "conditions": list(rows.values()),
            "note": "Effect sizes and CIs are reported; p-values alone are not a success criterion. "
                    "Results in the discovery set require replication in a validation set."}


def order_effect(trials: list[Trial], outcome: str) -> dict:
    """Sıra indeksi ile Δ arasında Spearman korelasyonu (sıra etkisi kontrolü)."""
    xs, ys = [], []
    for t in trials:
        if t.pre is not None and t.post is not None:
            xs.append(t.order_index)
            ys.append(getattr(t.post, outcome) - getattr(t.pre, outcome))
    if len(xs) < 3:
        return {"rho": None, "p": None, "n": len(xs)}
    rho, p = sps.spearmanr(xs, ys)
    return {"rho": round(float(rho), 4), "p": round(float(p), 5), "n": len(xs)}


def evidence_grade(row: dict, replicated: bool) -> str:
    """Kanıt derecesi: sadece istatistik + replikasyon. 'healing' kategorisi yok."""
    if row.get("n", 0) < 5:
        return "insufficient"
    p_adj, d = row.get("p_adjusted"), row.get("cohen_d_vs_control")
    if p_adj is None or d is None:
        return "insufficient"
    if p_adj < 0.05 and abs(d) >= 0.5:
        return "validated" if replicated else "discovery"
    if p_adj < 0.10 and abs(d) >= 0.3:
        return "weak_signal"
    return "null"
