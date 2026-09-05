<div align="center">

# AURORA

**Ancient Numerical Harmonics & Human Response**

*Discover frequencies by data, not by belief.*

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-2dd4bf.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-73%20passing-34d399.svg)](#running-the-tests)
[![Engine: Python](https://img.shields.io/badge/engine-Python%203.11%2B-3776ab.svg)](engine/)
[![App: Capacitor](https://img.shields.io/badge/app-React%20%2B%20Capacitor-a78bfa.svg)](app/)

</div>

---

## What this is

People have claimed for decades that certain frequencies — 432 Hz, 528 Hz, the "Solfeggio"
set — do something to the human body or mind. The claims are everywhere. The evidence is not.

AURORA does not argue with those claims. **It tests them.**

It is a complete research instrument: it derives frequency candidates from documented ancient
number systems, generates the audio, runs blinded randomised self-experiments, computes the
statistics honestly, and simulates Chladni plate patterns from real physics. Whatever the data
says — including *"nothing here"* — gets recorded.

> **If 432 Hz turns out to do nothing, this project will say so.**
> That is the point. A tool that can only confirm is not a tool.

---

## 🙋 We need people. All kinds of people.

This is a small project trying to answer a question that is bigger than it. **We want to take
it to a completely different level, and that needs many hands.** There is a place here for you
whatever you know how to do:

### If you want to help without writing code
- **Run the experiment on yourself.** Install the app, do a blinded pilot, log 30 days.
  Export your `.aurora.json` and open a [Data Contribution issue](../../issues/new?template=data-contribution.yml).
  A single person's data is anecdote; a hundred people's data is a dataset.
- **Build a Chladni plate and photograph it.** A metal plate, a speaker, fine sand.
  Real measurements are worth more than any simulation — and we have almost none.
- **Tell us where the app confused you.** Honestly. Every "I didn't understand this button"
  is a real bug.
- **Translate it.** Two languages so far (Turkish, English). Every additional language brings
  in people whose data we currently cannot reach.

### If you know physics or engineering
The plate model is Kirchhoff–Love thin-plate theory with a Ritz approximation for free edges.
It is *good*, not *right*. Excitation point, real edge clamping, material inhomogeneity, sand
grain mass — none of it is modelled. If plate vibration is your field, this code needs you.

### If you know statistics
The power engine exists because an early pilot design would have missed a real effect of
d = 1.84. There is more to fix: we want a Bayesian hierarchical model for per-person response,
proper sequential analysis, and a replication registry. If you have ever rolled your eyes at
someone's p-value, please come argue with ours.

### If you write code
Python engine, TypeScript app, both tested. Good first issues are labelled. The two engines are
kept numerically identical and there is a script that proves it.

### If you know history or ancient languages
The corpus contains 45 numbers from 12 sources, each tagged with an evidence level. Some of
those tags are almost certainly wrong. Sumerian, Egyptian, Vedic and Hebrew sources are
represented thinly and by translation. **Correcting one bad citation is a real contribution** —
and whole civilisations are missing. See [docs/CORPUS_GUIDE.md](docs/CORPUS_GUIDE.md).

**No contribution here is too small, and none of it requires permission. Open an issue.**

---

## The rules this project will not break

These are enforced in code, not just written down.

| Rule | How it is enforced |
|---|---|
| **AI does not get a vote.** No module ever calls a frequency "healing" or "high-energy". | `experimental` and `replication` scores stay `null` until human trial data exists |
| **Every number carries its evidence level.** `direct` → `derived` → `interpretive` → `speculative` | Every corpus entry and derived candidate is tagged and shown with a badge |
| **Simulation is never dressed up as measurement.** | Chladni patterns are labelled `SIMULATION` or `REAL MEASUREMENT`, stored separately |
| **You do not know what you are listening to.** | Conditions show as A/B/C/D; the real Hz is hidden until unblinding |
| **The analysis plan is frozen before the data.** | 7-item preregistration checklist gates the "Freeze & start" button |
| **Underpowered studies cannot claim "no effect".** | Live power panel; minimum detectable effect stored with every study and shown with its results |
| **Multiple comparisons are corrected.** | Bonferroni/Holm; discovery set and validation set are separate |
| **A null result is a result.** | Recorded and reported like any other |

---

## What it actually does

### Frequency analysis
Prime factors, digital root, octave class, cent distance to the Pythagorean ratios
(2:1, 3:2, 4:3, 9:8 …), harmonic series, nearest note at both A4 = 440 and A4 = 432.

### Frequency matching — 12 techniques
Cent distance · octave equivalence · rational-ratio approximation (continued fractions) ·
harmonic relation · common harmonic · spectral peak matching · DTW sequence alignment ·
transposition-invariant interval profile · pattern fingerprint similarity · mask IoU ·
k-means clustering · anomaly detection.

### Audio, from infrasound to ultrasound
**0.1 Hz – 96 kHz** in five bands. Sine, triangle, square, sawtooth, harmonic stacks, binaural,
AM, log sweeps. Play any number of frequencies simultaneously — amplitude is normalised by
`1/√N` so stacking never clips. Inaudible and non-renderable bands are labelled honestly
instead of being hidden.

### Chladni plates — real physics
Not a decorative pattern generator. Kirchhoff–Love plate theory with material constants,
thickness, edge length and boundary condition:

```
D      = E·h³ / (12(1−ν²))
f(m,n) = λ(m,n)/(2π) · √(D / (ρ·h·L⁴))
```

Verified scaling laws: double the thickness → double the frequency; double the edge → quarter
the frequency. Modes superpose with a Lorentzian resonance response, which reproduces **mode
degeneracy** — on a 20 cm steel plate, (1,4) and (3,3) both land on 749.8 Hz and are excited
together. That is where the complexity of real Chladni figures comes from.

**The same 528 Hz gives a different pattern on a different plate.** The app says so on screen.

### Blinded experiments
Preregistration → seeded randomisation → blinded labels → pre/post ratings on six measures →
Welch's t, Cohen's d, 95% CI, Bonferroni → evidence grade → validation set.

### 30-day journal
Turns "my luck changed" into something countable: opportunities, interactions, leads,
unexpected positive events. Correlation is computed and immediately labelled as not causation.

### Your data is yours
Everything stays on your device. One button exports all of it as readable JSON — back it up,
send it to a friend, or contribute it here. Import merges; it never silently deletes.

---

## The corpus

45 numbers from 12 sources across five civilisations, each with provenance and an evidence level.

| Civilisation | Sources | Example numbers |
|---|---|---|
| Greek | Pythagorean tradition, Plato's *Timaeus* 35b–36b | 1, 2, 3, 4, 8, 9, 27; ratios 2:1, 3:2, 4:3, 9:8, 256:243 |
| Mesopotamian | Sexagesimal system, Sumerian temple hymns (ETCSL) | 60, 12, 6, 360, 7 |
| Egyptian | Pyramid Texts, Book of the Dead spell 125, sistrum | 42, 9 (Ennead), 4, 3 |
| Vedic | Rigveda, Gayatri metre, Nāṭyaśāstra | 24, 10, 7 svara, 22 śruti, 108 |
| Hebrew | Tanakh counts, gematria | 7, 12, 40, 70, 26, 18 |

Modern claims (174–963 Hz, 432 Hz) are in the corpus too — tagged `speculative`, scoring zero
historical points. They are candidates, not premises.

> **Ancient texts contain numbers, not hertz.** Hertz is a modern unit, standardised long after
> every source here was written. Every conversion to frequency is tagged `derived` and shows
> its formula.

**Five civilisations is a start, not a map.** We are actively looking for Chinese (the twelve
*lülü* pipes, *sanfen sunyi fa*), Persian/Islamic (al-Farabi, al-Urmawi's 17-tone division),
Mesoamerican (Tzolk'in, Haab', the Calendar Round), Roman (Boethius), Japanese *gagaku*,
Javanese *slendro*/*pelog* and Yoruba Ifá. Browse what is there in **Library → Corpus**, then
see [docs/CORPUS_GUIDE.md](docs/CORPUS_GUIDE.md) or the
[open call](../../discussions/3).

---

## Getting started

```bash
git clone <this-repository-url>
cd aurora
bash scripts/setup.sh          # Python venv + npm install + tests
```

### Research engine

```bash
cd engine && source .venv/bin/activate

aurora analyze 528                          # full mathematical profile
aurora match 648 432                        # → 3:2, "fifth", 0.0 cents error
aurora corpus structure                     # numbers shared across civilisations
aurora chladni 528 --output pattern.png     # plate simulation
aurora power --conditions 4 --effect 0.8    # how many trials do you actually need?
aurora tone 528 --seconds 20 --output t.wav
aurora stats trials.csv --outcome calm --control D
```

### App

```bash
cd app
npm run dev                    # browser
npm run build && npx cap sync  # iOS / Android
```

### Running the tests

```bash
cd engine && pytest            # 34 tests — physics, statistics, blinding, pipeline
cd app && npm test             # 39 tests — maths, matching, power, transfer
bash scripts/parity.sh         # proves both engines compute identical values
```

---

## Repository layout

```
engine/          Python research engine
  aurora/        math · acoustics · matching · scoring · sequence · experiment
                 stats · power · chladni · discovery · corpus · textmining · cli
  data/          corpus.json — sources, numbers, ratios with provenance
  configs/       preregistered study designs
app/             Capacitor + React + TypeScript
  src/core/      TypeScript twins of the engine modules
  src/screens/   Home · Analyze · Library · Sequence · Experiment · Journal · Lab
docs/            RESEARCH_PROTOCOL · CORPUS_GUIDE · MASTER_PLAN · DESIGN · DATA_MODEL
scripts/         setup · pilot · parity · engine-demo · build-app
```

`docs/RESEARCH_PROTOCOL.md` (English) covers the experimental design, power analysis and
statistics. `docs/MASTER_PLAN.md` is the full reference — every formula and design decision,
currently in Turkish; a translation is a very welcome contribution.

---

## Honest limitations

- **Sample size is the wall.** Detecting d = 0.5 across four conditions needs ~350 trials.
  One person cannot do this alone. This is the main reason the project needs other people.
- **The plate model is incomplete.** It ignores excitation point, real clamping, material
  inhomogeneity and the mass of the sand itself.
- **Self-reported measures are noisy.** Physiological data (HRV) is planned, not built.
- **Blinding is imperfect.** Different frequencies sound different; you cannot fully blind a
  person to pitch. Silence and random-frequency controls address part of this, not all of it.
- **No claim of therapeutic effect is made anywhere**, and none should be inferred. This is
  not a medical device and produces no medical advice.

---

## Safety

Amplitude is capped at 0.2 in code. Use headphones at a comfortable level. Do not use this
project for treating any condition. If a sound is uncomfortable, stop.

---

## License

[MIT](LICENSE) — use it, fork it, publish results from it. If it helps you, we would like to
hear about it in [Discussions](../../discussions).

---

<div align="center">

**Discover frequencies by data, not by belief.**

*Contributions of every kind are welcome. Especially the kind you think is too small to matter.*

</div>
