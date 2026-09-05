# AURORA — Research Protocol

*English reference for contributors. The Turkish originals in this folder carry the same content.*

## The two questions, kept separate

| # | Question | Type | Answered by |
|---|---|---|---|
| Q1 | Do ancient number/ratio/repetition structures contain mathematical order beyond chance? | historical + mathematical | corpus + ratio matching + shuffled baseline |
| Q2 | Do frequency + order + duration protocols derived from them produce a measurable effect distinguishable from control? | experimental | blinded randomised trial + statistics + replication |

**These are never merged.** A positive answer to Q1 says nothing about Q2.

## Testable hypotheses

- **H1 (single frequency)** — a specific Hz produces `calm_change` different from silence/random control
- **H2 (sequence grammar)** — the effect comes from `frequency + ratio + order + duration + repetition`, not a single carrier; reordering the same frequencies changes the outcome
- **H3 (duration)** — 5-8-13 min differs from 13-8-5 min with identical frequencies
- **H4 (Chladni)** — the same frequency on the same physical rig reproduces its pattern; octave-related frequencies (432/864) produce related patterns
- **H5 (behaviour chain)** — sound → mood → behaviour → opportunity exposure → observed outcome is traceable in journal data
- **H0** — no condition separates from control. **This is a valid result and gets recorded.**

## Power analysis — mandatory before data collection

An early pilot design would have **missed a real effect of d = 1.84** (n = 5, three
comparisons, Bonferroni → p = 0.063). That is why power analysis is now a gate, not a
suggestion.

```bash
aurora power --conditions 3 --effect 1.4    # screening stage
aurora power --conditions 2 --effect 0.8    # validation stage
```

Power at α = 0.05, Bonferroni k = 3 (simulation):

| n per condition | d=0.5 | d=0.8 | d=1.0 | d=1.5 | d=2.0 |
|---:|---:|---:|---:|---:|---:|
| 5 | 4% | 8% | 12% | 30% | 54% |
| 10 | 8% | 23% | 37% | 76% | 95% |
| 20 | 19% | 51% | 73% | 98% | 100% |
| 30 | 30% | 72% | 91% | 100% | 100% |

Sample size for 80% power:

| Target d | n/condition (k=3) | Total (4 conditions) | Time at 10 min/trial |
|---:|---:|---:|---:|
| 0.5 | 88 | 352 | ~70 h |
| 0.8 | 35 | 140 | ~23 h |
| 1.0 | 23 | 92 | ~18 h |
| 1.5 | 11 | 44 | ~8 h |

**Fewer conditions beat more conditions.** Same power, far less time:

| Design | comparisons | n/condition (d=0.8) | Total time |
|---|---:|---:|---:|
| 4 conditions | 3 | 35 | 23 h |
| **2 conditions** | **1** | **26** | **8.7 h** |

This is the numerical reason "let us test 10,000 frequencies" defeats itself: every extra
condition raises the multiple-comparison penalty.

## Two-stage pilot

**Stage 1 — screening.** 3 conditions × 10 trials = 30. MDE ≈ d 1.4.
Deliberately underpowered for small effects; a null here means *"no large effect"*, nothing more.

**Stage 2 — validation.** The winning condition vs silence, 2 × 26 = 52 trials.
Single comparison, so no Bonferroni penalty; 80% power at d = 0.8.

Success requires **all three**: p < 0.05 **and** |d| ≥ 0.5 **and** the 95% CI excludes zero.

```bash
bash scripts/pilot.sh power     # power tables
bash scripts/pilot.sh audio     # generate the WAV files
bash scripts/pilot.sh stage1    # 30 randomised blinded trials
bash scripts/pilot.sh stage2    # 52-trial validation
```

## Preregistration checklist

All eight must pass before a study can start:

1. Primary outcome defined before data
2. Primary comparison defined before data
3. Randomisation defined
4. Blinding defined
5. Exclusion rules written
6. Multiple-comparison plan defined
7. Analysis frozen before unblinding
8. **Power analysis done; target effect and MDE recorded**

## Randomisation and blinding

```
order  = shuffle(conditions, seed + repetition)     # different order each repetition
labels = shuffle(A,B,C,…, seed ^ 0x5EED)            # real condition → anonymous letter
```

The participant sees "Condition B". The real Hz is not rendered to the UI until the study is
unblinded. Volume is equal across conditions.

## Measures

Pre and post, 0–10: energy · calm · focus · motivation · sleepiness · restlessness.
`change = post − pre`. Physiological measures (HR, HRV, sleep) are planned, not built.

## Statistics

```
95% CI    = mean ± t(0.975, n−1) · SE
Welch t   = (m₁−m₂)/√(s₁²/n₁ + s₂²/n₂),  Welch–Satterthwaite df
Cohen d   = (m₁−m₂)/s_pooled
Bonferroni: p_adj = min(1, p·k)
Order effect: Spearman ρ(order_index, Δ)
```

| n | p_adj | \|d\| | grade |
|---|---|---|---|
| <5 | — | — | insufficient |
| ≥5 | <0.05 | ≥0.5 | discovery → validated after replication |
| ≥5 | <0.10 | ≥0.3 | weak signal |
| ≥5 | otherwise | — | null |

## Chladni measurements

Record with every photograph: **material · edge length · thickness · boundary condition ·
excitation point and direction · amplitude · temperature**. A pattern without these cannot be
interpreted — the same 528 Hz gives a different pattern on a different plate.

Useful experiments nobody has run here yet:
- Same Hz × 5 repeats → within-frequency similarity (reproducibility)
- 527 / 529 / 530 / 531 Hz → is the change continuous or does it jump at resonances?
- 432 vs 864 Hz → the octave–pattern hypothesis

## Measuring "luck"

Predefined countable events: new opportunity · positive interaction · business lead ·
unexpected positive event · goal completion · social interaction, plus mood and energy.

Chain: exposure → mood → behaviour → opportunity exposure → observed outcome.
Correlation is computed and labelled as not causation, every time.

## Safety

20 Hz – 20 kHz for listening (wider range generated for analysis only), amplitude ≤ 0.2,
no prolonged high SPL, no therapeutic protocol, no medical claims.
