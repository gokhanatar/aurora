"""AURORA CLI — python -m aurora.cli <command> ..."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import acoustics, chladni, discovery, experiment, matching, power, sequence, stats, textmining
from .corpus import Corpus
from .math_analysis import analyze_frequency, frequency_family
from .models import Condition, Outcome
from .scoring import candidate_score, rank_candidates


def _p(obj) -> None:
    print(json.dumps(obj, indent=2, ensure_ascii=False, default=str))


def cmd_analyze(a):
    r = analyze_frequency(a.frequency)
    _p({"frequency_hz": r.frequency_hz, "octave_class_hz": round(r.octave_class_hz, 6),
        "note_a440": r.nearest_note_440, "note_a432": r.nearest_note_432, "integer": r.integer,
        "prime": r.prime, "factorization": list(r.factorization), "digit_sum": r.digit_sum,
        "digital_root": r.digital_root, "harmonics": list(r.harmonics),
        "closest_ratios": [{"label": x.label, "ratio": f"{x.numerator}:{x.denominator}",
                            "error_cents": round(x.error_cents, 3)} for x in r.notable_ratios[:5]],
        "score": candidate_score(a.frequency, Corpus.load()),
        "family": {k: round(v, 3) for k, v in frequency_family(a.frequency).items()}})


def cmd_compare(a):
    _p(rank_candidates(a.frequencies, Corpus.load()))


def cmd_tone(a):
    x = acoustics.tone(a.frequency, a.seconds, a.sample_rate, a.amplitude, a.waveform)
    print("Wrote", acoustics.write_wav(a.output, x, a.sample_rate))


def cmd_sequence(a):
    mins = a.minutes or [5.0] * len(a.frequencies)
    if len(mins) == 1 and len(a.frequencies) > 1:
        mins = [mins[0] / len(a.frequencies)] * len(a.frequencies)
    stim = sequence.build(a.frequencies, mins, a.gap, a.repetitions, a.waveform, a.amplitude)
    _p(sequence.to_json(stim))
    if a.output:
        print("Wrote", acoustics.write_wav(a.output, acoustics.render_stimulus(stim), stim.sample_rate))


def cmd_protocols(a):
    _p({k: sequence.to_json(v) for k, v in sequence.protocol_set(a.frequencies, a.minutes, a.seed).items()})


def cmd_analyze_audio(a):
    sr, x = acoustics.read_wav(a.input)
    _p({"sample_rate": sr, "samples": int(len(x)),
        "dominant": [{"hz": round(f, 3), "magnitude": round(m, 4)} for f, m in acoustics.dominant_frequencies(x, sr)],
        "features": acoustics.audio_features(x, sr)})


def cmd_corpus(a):
    c = Corpus.load(a.path) if a.path else Corpus.load()
    if a.what == "structure":
        _p(c.common_structure())
    elif a.what == "candidates":
        _p(c.candidates(a.base))
    elif a.what == "numbers":
        _p(c.numbers)
    else:
        _p({"civilizations": c.civilizations(), "sources": len(c.sources), "numbers": len(c.numbers),
            "ratios": len(c.ratios)})


def cmd_chladni(a):
    mask = chladni.simulate(a.frequency, a.size)
    fp = chladni.fingerprint(mask)
    n, m = chladni.mode_numbers(a.frequency)
    _p({"hz": a.frequency, "kind": "simulation", "mode": [n, m], "fingerprint": fp.__dict__})
    if a.output:
        try:
            from PIL import Image
            Image.fromarray((mask * 255).astype("uint8")).save(a.output)
            print("Wrote", a.output)
        except ImportError:
            print("pillow yok — PNG yazılamadı (pip install pillow)", file=sys.stderr)


def cmd_pattern(a):
    gray = chladni.load_image_gray(a.image)
    mask = chladni.image_to_mask(gray)
    rec = chladni.record_from_mask(a.id or f"CHL-{int(a.frequency):06d}", a.frequency, mask, "real",
                                   {"shape": a.shape, "size_cm": a.size_cm, "material": a.material}, a.image)
    out = chladni.record_to_dict(rec)
    if a.compare_sim:
        out["similarity_to_simulation"] = round(chladni.similarity(rec.fingerprint,
                                                                   chladni.fingerprint(chladni.simulate(a.frequency))), 4)
    _p(out)


def cmd_resonance_map(a):
    _p(chladni.resonance_map(a.lo, a.hi, a.step))


def cmd_make_study(a):
    conds = [Condition("A", "A", None, "stimulus"), Condition("B", "B", None, "stimulus"),
             Condition("C", "C", None, "stimulus"), Condition("D", "D", None, "silence_control")]
    if a.config:
        cfg = json.loads(Path(a.config).read_text(encoding="utf-8"))
        conds = [Condition(c["condition_id"], c.get("label", c["condition_id"]), None, c.get("type", "stimulus"))
                 for c in cfg["conditions"]]
    trials = experiment.make_trials(a.study_id, a.participant, conds, a.seed, a.repetitions)
    path = experiment.write_trials_csv(a.output, trials)
    _p({"trials": len(trials), "csv": str(path), "blinded_labels": experiment.blinded_labels([c.condition_id for c in conds], a.seed),
        "preregistration": experiment.preregistration(a.primary, conds, a.exclusion, a.correction, a.freeze)})


def cmd_stats(a):
    trials = experiment.read_trials_csv(a.csv)
    _p({"study": stats.analyze_study(trials, a.outcome, a.control, a.correction),
        "order_effect": stats.order_effect(trials, a.outcome)})


def cmd_simulate_trials(a):
    """Demo: sahte veri üretir (null etki). Gerçek analiz için kullanılmaz."""
    import random
    rng = random.Random(a.seed)
    trials = experiment.read_trials_csv(a.csv)
    done = []
    for t in trials:
        pre = Outcome(*(rng.uniform(3, 7) for _ in range(6)))
        post = Outcome(*(getattr(pre, k) + rng.gauss(0, 1) for k in ("energy", "calm", "focus", "motivation", "sleepiness", "restlessness")))
        done.append(experiment.record(t, pre, post, "SIMULATED NULL DATA"))
    print("Wrote", experiment.write_trials_csv(a.csv, done))


def cmd_evolve(a):
    _p(discovery.evolve(a.frequencies, None, a.generations, seed=a.seed))


def cmd_anomalies(a):
    _p(discovery.anomalies(a.frequencies, a.z))


def cmd_scan(a):
    _p(discovery.scan(a.lo, a.hi, a.step_cents, a.top))


def cmd_match(a):
    _p(matching.match_report(a.f1, a.f2))


def cmd_match_sequence(a):
    _p(matching.sequence_match(a.a, a.b))


def cmd_power(a):
    _p({"plan": power.plan(a.conditions, a.effect, a.target_power, a.minutes),
        "minimum_detectable_effect_at_n": {str(n): power.detectable_effect(n, a.conditions - 1) for n in a.table_n},
        "power_table": power.power_table(a.table_n, [0.5, 0.8, 1.0, 1.5, 2.0], a.conditions - 1)})


def cmd_mine(a):
    text = Path(a.file).read_text(encoding="utf-8")
    _p({"mining": textmining.mine(text), "baseline": textmining.shuffled_baseline(text)})


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(prog="aurora", description="AURORA Frequency Discovery Engine")
    sub = p.add_subparsers(dest="command", required=True)

    s = sub.add_parser("analyze"); s.add_argument("frequency", type=float); s.set_defaults(func=cmd_analyze)
    s = sub.add_parser("compare"); s.add_argument("frequencies", nargs="+", type=float); s.set_defaults(func=cmd_compare)

    s = sub.add_parser("tone"); s.add_argument("frequency", type=float)
    s.add_argument("--seconds", type=float, default=20); s.add_argument("--waveform", default="sine")
    s.add_argument("--sample-rate", type=int, default=48000); s.add_argument("--amplitude", type=float, default=0.15)
    s.add_argument("--output", default="out/tone.wav"); s.set_defaults(func=cmd_tone)

    s = sub.add_parser("sequence"); s.add_argument("frequencies", nargs="+", type=float)
    s.add_argument("--minutes", nargs="*", type=float); s.add_argument("--gap", type=float, default=0.5)
    s.add_argument("--repetitions", type=int, default=1); s.add_argument("--waveform", default="sine")
    s.add_argument("--amplitude", type=float, default=0.15); s.add_argument("--output"); s.set_defaults(func=cmd_sequence)

    s = sub.add_parser("protocols"); s.add_argument("frequencies", nargs="+", type=float)
    s.add_argument("--minutes", nargs="*", type=float, default=[5, 8, 13]); s.add_argument("--seed", type=int, default=0)
    s.set_defaults(func=cmd_protocols)

    s = sub.add_parser("analyze-audio"); s.add_argument("input"); s.set_defaults(func=cmd_analyze_audio)

    s = sub.add_parser("corpus"); s.add_argument("what", choices=["summary", "structure", "candidates", "numbers"], nargs="?", default="summary")
    s.add_argument("--base", type=float, default=432.0); s.add_argument("--path"); s.set_defaults(func=cmd_corpus)

    s = sub.add_parser("chladni"); s.add_argument("frequency", type=float); s.add_argument("--size", type=int, default=128)
    s.add_argument("--output"); s.set_defaults(func=cmd_chladni)

    s = sub.add_parser("pattern"); s.add_argument("image"); s.add_argument("--frequency", type=float, required=True)
    s.add_argument("--id"); s.add_argument("--shape", default="square"); s.add_argument("--size-cm", type=float, default=20)
    s.add_argument("--material", default="steel"); s.add_argument("--compare-sim", action="store_true"); s.set_defaults(func=cmd_pattern)

    s = sub.add_parser("resonance-map"); s.add_argument("--lo", type=float, default=100); s.add_argument("--hi", type=float, default=1000)
    s.add_argument("--step", type=float, default=10); s.set_defaults(func=cmd_resonance_map)

    s = sub.add_parser("make-study"); s.add_argument("--study-id", default="AURORA-PILOT-001"); s.add_argument("--participant", default="P001")
    s.add_argument("--seed", type=int, default=42); s.add_argument("--repetitions", type=int, default=3); s.add_argument("--config")
    s.add_argument("--primary", default="calm"); s.add_argument("--exclusion", default="incomplete pre/post excluded")
    s.add_argument("--correction", default="bonferroni"); s.add_argument("--freeze", action="store_true")
    s.add_argument("--output", default="out/trials.csv"); s.set_defaults(func=cmd_make_study)

    s = sub.add_parser("stats"); s.add_argument("csv"); s.add_argument("--outcome", default="calm")
    s.add_argument("--control", default="D"); s.add_argument("--correction", default="bonferroni"); s.set_defaults(func=cmd_stats)

    s = sub.add_parser("simulate-trials"); s.add_argument("csv"); s.add_argument("--seed", type=int, default=0); s.set_defaults(func=cmd_simulate_trials)

    s = sub.add_parser("evolve"); s.add_argument("frequencies", nargs="+", type=float)
    s.add_argument("--generations", type=int, default=3); s.add_argument("--seed", type=int, default=0); s.set_defaults(func=cmd_evolve)
    s = sub.add_parser("anomalies"); s.add_argument("frequencies", nargs="+", type=float); s.add_argument("--z", type=float, default=1.5); s.set_defaults(func=cmd_anomalies)
    s = sub.add_parser("scan"); s.add_argument("--lo", type=float, default=100); s.add_argument("--hi", type=float, default=1000)
    s.add_argument("--step-cents", type=float, default=50); s.add_argument("--top", type=int, default=20); s.set_defaults(func=cmd_scan)
    s = sub.add_parser("match"); s.add_argument("f1", type=float); s.add_argument("f2", type=float); s.set_defaults(func=cmd_match)
    s = sub.add_parser("match-sequence"); s.add_argument("--a", nargs="+", type=float, required=True)
    s.add_argument("--b", nargs="+", type=float, required=True); s.set_defaults(func=cmd_match_sequence)
    s = sub.add_parser("power"); s.add_argument("--conditions", type=int, default=4)
    s.add_argument("--effect", type=float, default=0.8); s.add_argument("--target-power", type=float, default=0.80)
    s.add_argument("--minutes", type=float, default=10.0)
    s.add_argument("--table-n", nargs="*", type=int, default=[5, 10, 15, 20, 30])
    s.set_defaults(func=cmd_power)
    s = sub.add_parser("mine"); s.add_argument("file"); s.set_defaults(func=cmd_mine)

    args = p.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
