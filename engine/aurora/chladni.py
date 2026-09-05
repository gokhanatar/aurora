"""Chladni Engine — gerçek plaka fiziği (Kirchhoff–Love) + görüntü parmak izi.

Simülasyon artık kaba bir yaklaşım değil, levha parametrelerinden (malzeme, kalınlık,
boyut, sınır koşulu) türetilen modal analizdir. Yine de 'simulation' etiketi taşır:
gerçek bir levhada kenar tutuşu, uyarım noktası ve malzeme homojensizliği deseni değiştirir.
""" 
from __future__ import annotations

from dataclasses import asdict

import numpy as np

from .models import PatternFingerprint, PatternRecord


# ---------- PLAKA FİZİĞİ (Kirchhoff–Love) ----------
#
# ÖNEMLİ: Chladni deseni frekansın tek başına fonksiyonu DEĞİLDİR. Aynı 528 Hz farklı
# levhada tamamen farklı desen verir. Deseni belirleyen: malzeme (E, ρ, ν), kalınlık h,
# kenar uzunluğu L, sınır koşulu ve uyarım noktası.
#
#   D = E·h³ / (12(1−ν²))                      plaka eğilme sertliği
#   f(m,n) = λ(m,n)/(2π) · √(D / (ρ·h·L⁴))     modal frekans

MATERIALS: dict[str, dict[str, float]] = {
    "steel":    {"E": 200e9, "rho": 7850, "nu": 0.30},
    "aluminum": {"E":  69e9, "rho": 2700, "nu": 0.33},
    "brass":    {"E": 100e9, "rho": 8500, "nu": 0.34},
    "glass":    {"E":  70e9, "rho": 2500, "nu": 0.22},
}

DEFAULT_PLATE = {"material": "steel", "size_cm": 20.0, "thickness_mm": 1.0, "boundary": "free"}
DAMPING = 0.006          # gerçek metal levhalarda tipik sönüm oranı


def flexural_rigidity(material: str, thickness_m: float) -> float:
    m = MATERIALS.get(material, MATERIALS["steel"])
    return m["E"] * thickness_m ** 3 / (12 * (1 - m["nu"] ** 2))


def lambda_mn(m: int, n: int, boundary: str) -> float:
    """Boyutsuz frekans parametresi. simply_supported analitik; diğerleri Ritz yaklaşımı."""
    if boundary == "simply_supported":
        return np.pi ** 2 * (m * m + n * n)
    shift = 0.5 if boundary == "clamped" else -0.5
    me, ne = max(0.5, m + shift), max(0.5, n + shift)
    return np.pi ** 2 * (me * me + ne * ne)


def modal_frequency(m: int, n: int, plate: dict | None = None) -> float:
    p = {**DEFAULT_PLATE, **(plate or {})}
    mat = MATERIALS.get(p["material"], MATERIALS["steel"])
    h, L = p["thickness_mm"] / 1000.0, p["size_cm"] / 100.0
    D = flexural_rigidity(p["material"], h)
    return float(lambda_mn(m, n, p["boundary"]) / (2 * np.pi) * np.sqrt(D / (mat["rho"] * h * L ** 4)))


def excited_modes(freq_hz: float, plate: dict | None = None, max_order: int = 12,
                  keep: int = 6) -> list[dict]:
    """Sürülen frekansta uyarılan modlar (Lorentz rezonans tepkisi ile ağırlıklı)."""
    if freq_hz <= 0:
        return []
    out = []
    for m in range(1, max_order + 1):
        for n in range(m, max_order + 1):
            fi = modal_frequency(m, n, plate)
            if not np.isfinite(fi) or fi <= 0:
                continue
            r = freq_hz / fi
            w = 1.0 / np.sqrt((1 - r * r) ** 2 + (2 * DAMPING * r) ** 2)
            out.append({"m": m, "n": n, "hz": fi, "weight": float(w)})
    top = sorted(out, key=lambda x: -x["weight"])[:keep]
    mx = top[0]["weight"] if top else 1.0
    return [{**x, "weight": x["weight"] / mx} for x in top]


def mode_numbers(freq_hz: float, plate: dict | None = None) -> tuple[int, int]:
    """Sürülen frekansa en yakın rezonans modu."""
    modes = excited_modes(freq_hz, plate, keep=1)
    return (modes[0]["m"], modes[0]["n"]) if modes else (1, 2)


def _shape(m: int, n: int, X: np.ndarray, Y: np.ndarray, boundary: str) -> np.ndarray:
    if boundary == "simply_supported":
        return np.sin(m * np.pi * X) * np.sin(n * np.pi * Y)
    if boundary == "clamped":
        f = lambda k, t: (1 - np.cos(2 * np.pi * k * t)) / 2
        return f(m, X) * f(n, Y) * np.sin(m * np.pi * X) * np.sin(n * np.pi * Y)
    return (np.cos(m * np.pi * X) * np.cos(n * np.pi * Y)
            - np.cos(n * np.pi * X) * np.cos(m * np.pi * Y))


def displacement_field(freq_hz: float, plate: dict | None = None, size: int = 128) -> np.ndarray:
    """Levha yüzeyinin yer değiştirme alanı (uyarılan modların süperpozisyonu)."""
    p = {**DEFAULT_PLATE, **(plate or {})}
    modes = excited_modes(freq_hz, p)
    x = np.linspace(0, 1, size)
    X, Y = np.meshgrid(x, x)
    field = np.zeros((size, size))
    for md in modes:
        field += md["weight"] * _shape(md["m"], md["n"], X, Y, p["boundary"])
    mx = np.abs(field).max()
    return field / mx if mx > 0 else field


def simulate(freq_hz: float, size: int = 128, threshold: float = 0.06,
             plate: dict | None = None) -> np.ndarray:
    """Kum maskesi: kum, yer değiştirmenin sıfıra yakın olduğu düğüm çizgilerinde birikir."""
    return (np.abs(displacement_field(freq_hz, plate, size)) < threshold).astype(np.uint8)


def resonances(plate: dict | None = None, lo: float = 20, hi: float = 20000,
               max_order: int = 12) -> list[dict]:
    """Bu levhanın gerçek rezonans frekansları — desenin en net göründüğü noktalar."""
    out = [{"m": m, "n": n, "hz": modal_frequency(m, n, plate)}
           for m in range(1, max_order + 1) for n in range(m, max_order + 1)]
    return sorted([x for x in out if lo <= x["hz"] <= hi], key=lambda x: x["hz"])


def resonance_proximity(freq_hz: float, plate: dict | None = None) -> float:
    """Sürülen frekans bir rezonansa ne kadar yakın? 1 = tam rezonans, 0 = uzak."""
    modes = excited_modes(freq_hz, plate, keep=1)
    if not modes:
        return 0.0
    c = abs(1200 * np.log2(freq_hz / modes[0]["hz"]))
    return float(max(0.0, 1 - c / 200))


def plate_field(n: int, m: int, size: int = 128, L: float = 1.0) -> np.ndarray:
    """Tek modun şekil fonksiyonu (geriye dönük uyum; ikon üretimi bunu kullanır)."""
    x = np.linspace(0, L, size)
    X, Y = np.meshgrid(x, x)
    return _shape(n, m, X / L, Y / L, "free")


# ---------- FINGERPRINT ----------

def _mirror_score(a: np.ndarray, b: np.ndarray) -> float:
    return float(1.0 - np.mean(np.abs(a.astype(float) - b.astype(float))))


def fingerprint(mask: np.ndarray) -> PatternFingerprint:
    """İkili maske (1 = kum) → sayısal parmak izi."""
    m = (np.asarray(mask) > 0).astype(np.uint8)
    if m.ndim != 2 or m.size == 0:
        raise ValueError("mask must be a non-empty 2D array")
    h, w = m.shape
    s = min(h, w)
    m = m[:s, :s]
    sym_lr = _mirror_score(m, m[:, ::-1])
    sym_ud = _mirror_score(m, m[::-1, :])
    sym_diag = _mirror_score(m, m.T)
    symmetry = (sym_lr + sym_ud + sym_diag) / 3.0
    radial = (_mirror_score(m, np.rot90(m, 1)) + _mirror_score(m, np.rot90(m, 2))) / 2.0
    density = float(m.mean())
    # karmaşıklık: kenar yoğunluğu (komşu farkı)
    edges = np.abs(np.diff(m.astype(int), axis=0)).sum() + np.abs(np.diff(m.astype(int), axis=1)).sum()
    complexity = float(min(1.0, edges / (2.0 * s * s * 0.25)))
    # düğüm sayısı: satır ortasındaki ve sütun ortasındaki geçişler
    mid_r, mid_c = m[s // 2, :], m[:, s // 2]
    node_count = int(np.sum(np.diff(mid_r.astype(int)) == 1) + np.sum(np.diff(mid_c.astype(int)) == 1))
    # baskın açı: gradient yönlerinin ağırlıklı histogramı
    gy, gx = np.gradient(m.astype(float))
    mag = np.hypot(gx, gy)
    ang = (np.degrees(np.arctan2(gy, gx)) % 180.0)
    hist, bins = np.histogram(ang, bins=18, range=(0, 180), weights=mag)
    dominant = float(bins[int(np.argmax(hist))] + 5.0) if mag.sum() > 0 else 0.0
    return PatternFingerprint(round(symmetry, 4), round(radial, 4), round(complexity, 4),
                              round(density, 4), node_count, round(dominant, 1))


def similarity(a: PatternFingerprint, b: PatternFingerprint) -> float:
    """0–1 arası görüntü/matematiksel desen benzerliği (enerji benzerliği DEĞİL)."""
    va, vb = np.asarray(a.as_vector()), np.asarray(b.as_vector())
    return float(max(0.0, 1.0 - np.linalg.norm(va - vb) / np.sqrt(len(va))))


def mask_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Piksel bazlı IoU (aynı boyuta yeniden örneklenir)."""
    a, b = (np.asarray(a) > 0), (np.asarray(b) > 0)
    s = min(a.shape[0], b.shape[0])
    ia = np.linspace(0, a.shape[0] - 1, s).astype(int)
    ib = np.linspace(0, b.shape[0] - 1, s).astype(int)
    a2, b2 = a[np.ix_(ia, ia)], b[np.ix_(ib, ib)]
    union = np.logical_or(a2, b2).sum()
    return float(np.logical_and(a2, b2).sum() / union) if union else 1.0


# ---------- REAL IMAGE ----------

def image_to_mask(gray: np.ndarray, threshold: float | None = None) -> np.ndarray:
    """Gri görüntü (0–255 veya 0–1) → kum maskesi. Kum açık renkli varsayılır (Otsu benzeri eşik)."""
    g = np.asarray(gray, dtype=float)
    if g.max() > 1.0:
        g = g / 255.0
    if threshold is None:
        # basit Otsu
        hist, edges = np.histogram(g, bins=64, range=(0, 1))
        total = g.size
        best_t, best_var = 0.5, -1.0
        w0 = 0.0
        sum_all = float((hist * ((edges[:-1] + edges[1:]) / 2)).sum())
        sum0 = 0.0
        for i, c in enumerate(hist):
            w0 += c
            if w0 == 0 or w0 == total:
                continue
            sum0 += c * ((edges[i] + edges[i + 1]) / 2)
            m0, m1 = sum0 / w0, (sum_all - sum0) / (total - w0)
            var = w0 * (total - w0) * (m0 - m1) ** 2
            if var > best_var:
                best_var, best_t = var, edges[i + 1]
        threshold = best_t
    return (g >= threshold).astype(np.uint8)


def load_image_gray(path: str) -> np.ndarray:
    try:
        from PIL import Image
    except ImportError as e:  # pragma: no cover
        raise RuntimeError("pip install pillow — görüntü analizi için gerekli") from e
    return np.asarray(Image.open(path).convert("L"), dtype=float)


def record_from_mask(pattern_id: str, hz: float, mask: np.ndarray, kind: str,
                     plate: dict | None = None, image_ref: str | None = None) -> PatternRecord:
    return PatternRecord(pattern_id, hz, kind, fingerprint(mask), plate or {}, image_ref)  # type: ignore[arg-type]


def resonance_map(lo: float, hi: float, step: float = 1.0, size: int = 64) -> list[dict]:
    """SIMULATION taraması: frekans → complexity/node_count. Rezonans bölgelerini görselleştirmek için."""
    out = []
    f = lo
    while f <= hi:
        fp = fingerprint(simulate(f, size))
        n, m = mode_numbers(f)
        out.append({"hz": round(f, 3), "mode": [n, m], "complexity": fp.complexity,
                    "node_count": fp.node_count, "kind": "simulation"})
        f += step
    return out


def record_to_dict(r: PatternRecord) -> dict:
    return {"pattern_id": r.pattern_id, "hz": r.hz, "kind": r.kind, "plate": r.plate,
            "image_ref": r.image_ref, "fingerprint": asdict(r.fingerprint)}
