"""Python referans değerleri — TS motoruyla eşdeğerlik doğrulaması için."""
import json

from aurora import chladni, sequence
from aurora.corpus import Corpus
from aurora.matching import cent_match, dtw_distance, harmonic_match, rational_match, sequence_match
from aurora.math_analysis import analyze_frequency, cents, derive_frequency, frequency_family, octave_reduce
from aurora.scoring import candidate_score, mathematical_score

c = Corpus.load()
a = analyze_frequency(528)
print(json.dumps({
    "octave_reduce_864": octave_reduce(864),
    "cents_880_440": cents(880, 440),
    "derive_432_3_2": derive_frequency(432, 3, 2),
    "family_432_fourth": frequency_family(432)["fourth"],
    "factorization_432": list(analyze_frequency(432).factorization),
    "note440_528": a.nearest_note_440,
    "digital_root_528": a.digital_root,
    "closest_ratio_528": [a.notable_ratios[0].label, round(a.notable_ratios[0].error_cents, 6)],
    "math_score_432": mathematical_score(432),
    "math_score_528": mathematical_score(528),
    "hist_score_432": candidate_score(432, c)["historical_score"],
    "hist_score_27": candidate_score(27, c)["historical_score"],
    "rational_648_432": rational_match(648, 432)["ratio"],
    "harmonic_1056_528": harmonic_match(1056, 528)["direct"],
    "cent_match_432_864_oct": cent_match(432, 864, octave_equivalent=True)["match"],
    "dtw_same": dtw_distance([432, 528, 639], [432, 528, 639]),
    "seq_transpose": sequence_match([432, 528, 639], [864, 1056, 1278])["transposition_invariant_match"],
    "chladni_mode_528": list(chladni.mode_numbers(528)),
    "modal_f_2_3_steel": round(chladni.modal_frequency(2, 3), 4),
    "modal_f_2_3_alu": round(chladni.modal_frequency(2, 3, {"material": "aluminum"}), 4),
    "modal_f_thick2": round(chladni.modal_frequency(2, 3, {"thickness_mm": 2.0}), 4),
    "resonance_prox_528": round(chladni.resonance_proximity(528), 4),
    "mode_528_big_plate": list(chladni.mode_numbers(528, {"size_cm": 30.0})),
    "stim_total_5_8_13": sequence.build([432, 528, 639], [5, 8, 13]).total_seconds,
}, indent=1))
