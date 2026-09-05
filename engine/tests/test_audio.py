import numpy as np
from aurora import acoustics, sequence


def test_tone_length_and_safety():
    x = acoustics.tone(432, 1.0, 48000, amplitude=0.9)
    assert len(x) == 48000
    assert np.max(np.abs(x)) <= acoustics.MAX_AMPLITUDE + 1e-9


def test_waveforms():
    for k in ("sine", "triangle", "square", "saw"):
        assert acoustics.tone(200, 0.1, kind=k).shape == (4800,)


def test_dominant_frequency():
    x = acoustics.tone(528, 2.0, 48000)
    f, m = acoustics.dominant_frequencies(x, 48000, count=1)[0]
    assert abs(f - 528) < 1.0 and m > 0.9


def test_render_stimulus_duration():
    stim = sequence.build([432, 0, 528], [0.01, 0.01, 0.01], gap_s=0.1)
    x = acoustics.render_stimulus(stim)
    assert abs(len(x) / 48000 - stim.total_seconds) < 0.01


def test_features():
    f = acoustics.audio_features(acoustics.harmonic_tone(300, 1.0, [1, 0.5, 0.25]))
    assert abs(f["fundamental_hz"] - 300) < 1 and f["harmonic_2"] > 0.3
