import numpy as np
from aurora import chladni, discovery, experiment, sequence, stats, textmining
from aurora.corpus import Corpus
from aurora.models import Condition, Outcome
from aurora.scoring import candidate_score, rank_candidates


def test_sequence_fingerprint_deterministic():
    a = sequence.build([432, 528, 639], [5, 8, 13])
    b = sequence.build([432, 528, 639], [5, 8, 13])
    assert a.stimulus_id == b.stimulus_id and a.total_seconds == 26 * 60 + 1.0
    assert set(sequence.protocol_set([432, 528, 639])) == {"A_forward", "B_reversed_durations", "C_single", "D_random", "E_silence"}


def test_corpus_and_scoring():
    c = Corpus.load()
    assert "greek" in c.civilizations()
    s = c.common_structure()
    assert 7 in s["shared_numbers"] and 12 in s["shared_numbers"]
    sc = candidate_score(432, c)
    assert sc["experimental_score"] is None and "warning" in sc
    assert sc["historical_score"] == 0.0  # speculative → penalized to zero
    assert candidate_score(27, c)["historical_score"] > 0
    assert rank_candidates([432, 517.3], c)[0]["frequency_hz"] == 432


def test_blinding_and_randomization():
    conds = [Condition(x, x, None) for x in "ABCD"]
    t = experiment.make_trials("S", "P1", conds, 7, repetitions=2)
    assert len(t) == 8 and [x.order_index for x in t] == list(range(8))
    assert experiment.randomized_order(list("ABCD"), 7) == experiment.randomized_order(list("ABCD"), 7)
    labels = experiment.blinded_labels(list("ABCD"), 7)
    assert sorted(labels.values()) == list("ABCD")
    prereg = experiment.preregistration("calm", conds, "rule", "bonferroni", True)
    assert prereg["ready"] is True
    assert experiment.preregistration("aura", conds, None, None, False)["ready"] is False


def test_stats_null_data(tmp_path):
    import random
    rng = random.Random(1)
    conds = [Condition(x, x, None) for x in "ABCD"]
    trials = experiment.make_trials("S", "P1", conds, 1, repetitions=6)
    done = []
    for t in trials:
        pre = Outcome(5, 5, 5)
        post = Outcome(5 + rng.gauss(0, 1), 5 + rng.gauss(0, 1), 5 + rng.gauss(0, 1))
        done.append(experiment.record(t, pre, post))
    p = experiment.write_trials_csv(tmp_path / "t.csv", done)
    back = experiment.read_trials_csv(p)
    r = stats.analyze_study(back, "calm", "D")
    assert r["comparisons"] == 3 and len(r["conditions"]) == 4
    for row in r["conditions"]:
        if not row["is_control"]:
            assert row["p_adjusted"] >= row["p_value"]
            assert stats.evidence_grade(row, False) in {"null", "weak_signal", "discovery", "insufficient"}


def test_chladni_sim_and_fingerprint():
    m1, m2 = chladni.simulate(528), chladni.simulate(528)
    assert np.array_equal(m1, m2)
    fp = chladni.fingerprint(m1)
    assert 0 <= fp.symmetry <= 1 and fp.node_count >= 0
    assert chladni.similarity(fp, fp) == 1.0
    assert chladni.similarity(fp, chladni.fingerprint(chladni.simulate(97))) < 1.0
    mask = chladni.image_to_mask(np.random.RandomState(0).rand(64, 64) * 255)
    assert mask.shape == (64, 64)
    assert len(chladni.resonance_map(100, 200, 50)) == 3


def test_discovery():
    hist = discovery.evolve([432, 528, 639], generations=2, seed=1)
    assert len(hist) == 2 and hist[-1]["label"] == "exploratory"
    assert all(20 <= f <= 20000 for f in hist[-1]["population"])
    assert isinstance(discovery.anomalies([100, 200, 300, 400, 7919.5], 0.5), list)
    assert len(discovery.scan(100, 200, 100, 5)) <= 5


def test_textmining():
    r = textmining.mine("one two three four. seven days, twelve tribes, 40 days and 27.")
    assert {1, 2, 3, 4, 7, 12, 40, 27} <= set(r["explicit_numbers"])
    assert 0 < textmining.shuffled_baseline("1 2 3 4 8 9 27", trials=10)["p_empirical"] <= 1


def test_matching():
    from aurora import matching
    assert matching.cent_match(432, 864, octave_equivalent=True)["match"]
    assert not matching.cent_match(432, 864)["match"]
    r = matching.rational_match(648, 432)
    assert r["ratio"] == "3:2" and r["reference_label"] == "fifth" and r["match"]
    h = matching.harmonic_match(1056, 528)
    assert h["direct"] == {"f1_is_harmonic_of_f2": 2}
    sm = matching.spectral_match([(528.2, 1.0), (1056.1, 0.5)], [528, 1056, 700])
    assert sm[0]["match"] and sm[1]["match"] and not sm[2]["match"]
    assert matching.dtw_distance([432, 528, 639], [432, 528, 639]) == 0
    assert matching.sequence_match([432, 528, 639], [864, 1056, 1278])["transposition_invariant_match"]
    cl = matching.cluster_frequencies([100, 101, 500, 501, 900, 901], k=3)
    assert sum(len(v) for v in cl.values()) == 6


def test_power():
    from aurora import power
    # Güç n ile artar ve etki büyüklüğü ile artar (monotonluk)
    assert power.power_two_sample(5, 1.0, 3, sims=800) < power.power_two_sample(30, 1.0, 3, sims=800)
    assert power.power_two_sample(15, 0.5, 3, sims=800) < power.power_two_sample(15, 2.0, 3, sims=800)
    # Sıfır etkide güç ≈ alfa (yanlış pozitif oranı kontrollü)
    assert power.power_two_sample(20, 0.0, 3, sims=1500) < 0.05
    # Plan tutarlı: küçük etki daha büyük n ister
    small = power.plan(4, effect_d=0.5)
    large = power.plan(4, effect_d=1.5)
    assert small["n_per_condition"] > large["n_per_condition"]
    assert small["comparisons"] == 3 and small["total_trials"] == small["n_per_condition"] * 4
    # n=5 gibi küçük örneklemde saptanabilir etki büyüktür
    assert power.detectable_effect(5, 3, sims=800) is None or power.detectable_effect(5, 3, sims=800) >= 1.5
