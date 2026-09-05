"""Plaka fiziği testleri — Kirchhoff–Love ölçekleme yasaları ve levha bağımlılığı."""
from __future__ import annotations

import numpy as np

from aurora import chladni as c

STEEL = {"material": "steel", "size_cm": 20.0, "thickness_mm": 1.0, "boundary": "free"}


def test_scaling_laws():
    """f ∝ h ve f ∝ 1/L² — ince plaka teorisinin temel ölçeklemesi."""
    thin = c.modal_frequency(2, 3, STEEL)
    thick = c.modal_frequency(2, 3, {**STEEL, "thickness_mm": 2.0})
    assert abs(thick / thin - 2.0) < 0.01                 # kalınlık ×2 → frekans ×2

    big = c.modal_frequency(2, 3, {**STEEL, "size_cm": 40.0})
    assert abs(thin / big - 4.0) < 0.01                   # kenar ×2 → frekans ÷4


def test_material_matters():
    f_steel = c.modal_frequency(2, 3, STEEL)
    f_alu = c.modal_frequency(2, 3, {**STEEL, "material": "aluminum"})
    f_glass = c.modal_frequency(2, 3, {**STEEL, "material": "glass"})
    assert len({round(f_steel), round(f_alu), round(f_glass)}) == 3


def test_same_frequency_different_plate_different_mode():
    """Projenin en önemli fiziksel gerçeği: desen frekansa değil levhaya bağlıdır."""
    assert c.mode_numbers(528, STEEL) != c.mode_numbers(528, {**STEEL, "size_cm": 30.0})


def test_boundary_condition_stiffens():
    free = c.modal_frequency(2, 3, STEEL)
    clamped = c.modal_frequency(2, 3, {**STEEL, "boundary": "clamped"})
    assert clamped > free


def test_resonance_proximity():
    r = c.resonances(STEEL, 100, 2000)[0]
    assert c.resonance_proximity(r["hz"], STEEL) > 0.99   # tam rezonansta 1
    assert c.resonance_proximity(r["hz"] * 1.3, STEEL) < 0.5


def test_simulation_deterministic_and_sparse():
    m1 = c.simulate(528, 64, plate=STEEL)
    assert np.array_equal(m1, c.simulate(528, 64, plate=STEEL))
    d = float(m1.mean())
    assert 0 < d < 0.5                                   # düğüm çizgileri var ama her yer değil
    fp = c.fingerprint(m1)
    assert 0 <= fp.symmetry <= 1 and fp.node_count >= 0


def test_dominant_mode_is_nearest_resonance():
    r = c.resonances(STEEL, 200, 1200)[2]
    assert c.mode_numbers(r["hz"], STEEL) == (r["m"], r["n"])


def test_excited_modes_weighting():
    """Rezonansta o mod(lar) baskın; rezonans dışında hepsi zayıflar."""
    r = c.resonances(STEEL, 200, 1200)[3]
    on = c.excited_modes(r["hz"], STEEL)
    assert on[0]["weight"] == 1.0

    # Rezonans dışında hiçbir mod tam uyarılmaz
    off = c.excited_modes(r["hz"] * 1.15, STEEL)
    assert off[0]["weight"] == 1.0                       # normalize edilmiş
    assert off[1]["weight"] < 0.9                        # ama modlar ayrışır


def test_degenerate_modes_share_a_frequency():
    """Kare levhada (m,n) ve (n,m) benzeri mod çiftleri aynı frekansa düşer.

    Serbest kenarda λ ∝ (m−½)² + (n−½)²; 0.5² + 3.5² = 2.5² + 2.5² olduğu için
    (1,4) ve (3,3) dejeneredir. Gerçek Chladni desenlerinin karmaşıklığı büyük ölçüde
    bu eşzamanlı uyarılan modların süperpozisyonundan gelir.
    """
    f14 = c.modal_frequency(1, 4, STEEL)
    f33 = c.modal_frequency(3, 3, STEEL)
    assert abs(f14 - f33) < 0.1

    modes = c.excited_modes(f14, STEEL, keep=3)
    fully_excited = [m for m in modes if m["weight"] > 0.99]
    assert len(fully_excited) >= 2                       # iki mod birden tam rezonansta
