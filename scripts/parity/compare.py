"""Python ↔ TypeScript eşdeğerlik karşılaştırması."""
import json
import sys

py = json.load(open(sys.argv[1]))
ts = json.load(open(sys.argv[2]))


def norm(v):
    if isinstance(v, dict):
        if "f1_is_harmonic_of_f2" in v:
            return ("f1_of_f2", v["f1_is_harmonic_of_f2"])
        if "f2_is_harmonic_of_f1" in v:
            return ("f2_of_f1", v["f2_is_harmonic_of_f1"])
        if "kind" in v:
            return (v["kind"], v["k"])
    if isinstance(v, float):
        return round(v, 6)
    if isinstance(v, list):
        return [norm(x) for x in v]
    return v


bad = [(k, norm(py[k]), norm(ts.get(k))) for k in py if norm(py[k]) != norm(ts.get(k))]
print(f"{len(py)} değer karşılaştırıldı")
for k, a, b in bad:
    print(f"  ✗ {k}: py={a}  ts={b}")
print("✓ PYTHON ↔ TYPESCRIPT EŞDEĞER" if not bad else f"✗ {len(bad)} FARK BULUNDU")
sys.exit(1 if bad else 0)
