"""Power Engine — deney BAŞLAMADAN önce gereken örneklem büyüklüğünü hesaplar.

Neden gerekli: n=5 ile d=1.8 gibi büyük bir gerçek etki bile Bonferroni sonrası anlamlı çıkmaz
(güç ~%30). Yetersiz güçle yürütülen bir çalışma "etki yok" sonucunu kanıt sanma hatasına yol açar.
Önkayıt bu yüzden hedef etki büyüklüğünü ve gücü içermelidir.
"""
from __future__ import annotations

import numpy as np
from scipy import stats as sps

DEFAULT_ALPHA = 0.05
DEFAULT_POWER = 0.80


def power_two_sample(n: int, effect_d: float, comparisons: int = 1, alpha: float = DEFAULT_ALPHA,
                     sims: int = 4000, seed: int = 0) -> float:
    """Welch t + Bonferroni düzeltmesi altında gerçek `effect_d` etkisini yakalama olasılığı.

    Simülasyon tabanlıdır: analitik formüller Welch df ve çoklu karşılaştırmayı birlikte
    kapsamadığı için, gerçekte kullanılan analiz hattının aynısı çalıştırılır.
    """
    if n < 2:
        return 0.0
    rng = np.random.default_rng(seed)
    a = rng.normal(effect_d, 1.0, (sims, n))
    b = rng.normal(0.0, 1.0, (sims, n))
    _, p = sps.ttest_ind(a, b, axis=1, equal_var=False)
    return float(np.mean(np.minimum(1.0, p * max(1, comparisons)) < alpha))


def required_n(effect_d: float, comparisons: int = 1, target_power: float = DEFAULT_POWER,
               alpha: float = DEFAULT_ALPHA, max_n: int = 400, sims: int = 2000) -> int | None:
    """Hedef güce ulaşmak için koşul başına gereken deneme sayısı."""
    for n in range(4, max_n + 1):
        if power_two_sample(n, effect_d, comparisons, alpha, sims) >= target_power:
            return n
    return None


def detectable_effect(n: int, comparisons: int = 1, target_power: float = DEFAULT_POWER,
                      alpha: float = DEFAULT_ALPHA, sims: int = 2000) -> float | None:
    """Verilen n ile hedef güçte saptanabilecek en küçük etki büyüklüğü (MDE)."""
    for d in np.arange(0.1, 4.01, 0.1):
        if power_two_sample(n, float(d), comparisons, alpha, sims) >= target_power:
            return round(float(d), 2)
    return None


def plan(conditions: int, effect_d: float = 0.8, target_power: float = DEFAULT_POWER,
         minutes_per_trial: float = 10.0, alpha: float = DEFAULT_ALPHA) -> dict:
    """Bir çalışma için tam örneklem planı: n, toplam deneme, süre, MDE tablosu."""
    if conditions < 2:
        raise ValueError("at least 2 conditions (including a control) are required")
    k = conditions - 1
    n = required_n(effect_d, k, target_power, alpha)
    total = n * conditions if n else None
    return {
        "conditions": conditions,
        "comparisons": k,
        "alpha": alpha,
        "correction": "bonferroni",
        "target_effect_d": effect_d,
        "target_power": target_power,
        "n_per_condition": n,
        "total_trials": total,
        "total_hours": round(total * minutes_per_trial / 60, 1) if total else None,
        "note": "An underpowered study cannot support a 'no effect' conclusion. "
                "Fix n before collecting data; report the minimum detectable effect either way.",
    }


def power_table(ns: list[int], ds: list[float], comparisons: int = 3,
                alpha: float = DEFAULT_ALPHA) -> list[dict]:
    """n × d güç tablosu (önkayıt belgesine eklenir)."""
    return [{"n_per_condition": n,
             **{f"d={d}": round(power_two_sample(n, d, comparisons, alpha), 3) for d in ds}}
            for n in ns]
