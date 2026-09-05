from aurora.math_analysis import (analyze_frequency, cents, derive_frequency, digital_root, factorize,
                                  frequency_family, is_prime, match_reference_ratios, octave_reduce)


def test_prime():
    assert is_prime(2) and is_prime(13) and not is_prime(1) and not is_prime(15)


def test_factorize():
    assert factorize(12) == (2, 2, 3)
    assert factorize(432) == (2, 2, 2, 2, 3, 3, 3)  # 432 = 2^4 · 3^3
    assert factorize(528) == (2, 2, 2, 2, 3, 11)


def test_octave_and_cents():
    assert octave_reduce(864) == 1.6875
    assert cents(440, 440) == 0
    assert abs(cents(880, 440) - 1200) < 1e-9


def test_derive():
    assert derive_frequency(432, 3, 2) == 648
    assert derive_frequency(432, 4, 3) == 576
    fam = frequency_family(432)
    assert fam["octave"] == 864 and fam["fifth"] == 648


def test_analyze_notes():
    a = analyze_frequency(440)
    assert a.nearest_note_440 == "A4"
    assert analyze_frequency(432).nearest_note_432 == "A4"
    assert digital_root(528) == 6
    assert a.evidence["healing_claim"] is False


def test_ratio_matching():
    m = match_reference_ratios([1, 2, 3, 4, 8, 9, 27])
    labels = {x["reference"] for x in m}
    assert {"octave", "fifth", "fourth", "major_second"} <= labels
