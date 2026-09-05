"""Corpus — antik kaynak, sayı ve oran veri seti (provenance + kanıt seviyesi)."""
from __future__ import annotations

import json
from pathlib import Path

from .math_analysis import derive_frequency, match_reference_ratios

DEFAULT_PATH = Path(__file__).resolve().parent.parent / "data" / "corpus.json"


class Corpus:
    def __init__(self, data: dict):
        self.sources = {s["source_id"]: s for s in data.get("sources", [])}
        self.numbers = data.get("numbers", [])
        self.ratios = data.get("ratios", [])
        self.popular = data.get("popular_modern_claims", [])

    @classmethod
    def load(cls, path: str | Path = DEFAULT_PATH) -> "Corpus":
        return cls(json.loads(Path(path).read_text(encoding="utf-8")))

    def numbers_equal(self, value: float) -> list[dict]:
        if not float(value).is_integer():
            return []
        return [n for n in self.numbers if n["value"] == int(value)]

    def by_civilization(self, civ: str) -> list[dict]:
        ids = {sid for sid, s in self.sources.items() if s["civilization"] == civ}
        return [n for n in self.numbers if n["source_id"] in ids]

    def civilizations(self) -> list[str]:
        return sorted({s["civilization"] for s in self.sources.values()})

    def values(self, min_level: str = "interpretive") -> list[int]:
        order = ["direct", "derived", "interpretive", "speculative"]
        lim = order.index(min_level)
        return sorted({n["value"] for n in self.numbers if order.index(n["evidence_level"]) <= lim})

    def common_structure(self, tolerance_cents: float = 8.0) -> dict:
        """Uygarlıklar arası ortak sayılar ve referans oranlara uyan çiftler."""
        per_civ = {c: {n["value"] for n in self.by_civilization(c)} for c in self.civilizations()}
        shared = {}
        for v in sorted(set().union(*per_civ.values())):
            civs = [c for c, vals in per_civ.items() if v in vals]
            if len(civs) >= 2:
                shared[v] = civs
        matches = match_reference_ratios(self.values("direct"), tolerance_cents)
        return {"shared_numbers": shared, "ratio_matches": matches,
                "note": "Shared occurrence is descriptive; it is not evidence of a hidden frequency code."}

    def candidates(self, base_hz: float = 432.0, lo: float = 100.0, hi: float = 1000.0) -> list[dict]:
        """Sayıları ve oranları frekans adaylarına dönüştürür — hepsi 'derived'/'candidate' etiketli."""
        out: list[dict] = []
        for n in self.numbers:
            v = n["value"]
            f = float(v)
            while f < lo:
                f *= 2
            while f > hi:
                f /= 2
            out.append({"hz": round(f, 3), "origin": "derived", "formula": f"{v} × 2^k → [{lo:g},{hi:g}]",
                        "source_ids": [n["source_id"]], "evidence_level": "derived",
                        "hypothesis_status": "candidate", "number_id": n["number_id"]})
        for r in self.ratios:
            f = derive_frequency(base_hz, r["numerator"], r["denominator"], lo, hi)
            out.append({"hz": round(f, 3), "origin": "derived",
                        "formula": f"{base_hz:g} × {r['numerator']}/{r['denominator']}",
                        "source_ids": r["source_ids"], "evidence_level": "derived",
                        "hypothesis_status": "candidate", "ratio_id": r["ratio_id"]})
        seen, uniq = set(), []
        for c in sorted(out, key=lambda c: c["hz"]):
            if c["hz"] not in seen:
                seen.add(c["hz"])
                uniq.append(c)
        return uniq
