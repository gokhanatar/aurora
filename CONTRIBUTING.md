# Contributing to AURORA

**Every kind of contribution counts here, and the non-code ones may matter most.**

The hard limit on this project is not code quality — it is data. Detecting a moderate effect
(d = 0.5) across four conditions needs roughly 350 trials. One person cannot produce that.
That is why the most valuable thing you can give is often not a pull request.

---

## Ways to contribute

### 1. Contribute your experiment data

This is the bottleneck. If you run a blinded pilot and log your results:

1. In the app: **Journal → Export → Download everything (.json)**
2. Open the [Data Contribution issue template](../../issues/new?template=data-contribution.yml)
3. Attach the file and describe your setup

**Before you send anything, open the file and read it.** It is plain JSON exactly so you can.
Remove anything you do not want public. Never include names, locations or health details in
free-text notes.

What makes data useful:
- The preregistration was frozen before you started
- You did not know which condition you were listening to
- You logged both the good days and the flat ones
- Null results are included — **especially** null results

### 2. Contribute Chladni measurements

We have plate physics and almost no real photographs to check it against.

You need: a metal plate, a speaker or vibration source, fine sand. Photograph the pattern,
record **material, edge length, thickness, boundary condition and excitation point** — a
pattern without those parameters cannot be interpreted.

Repeat the same frequency five times: within-frequency similarity is a real test of
reproducibility, and nobody has run it here yet.

### 3. Improve the physics

`engine/aurora/chladni.py` and `app/src/core/chladni.ts` implement Kirchhoff–Love thin-plate
theory with a Ritz approximation for free edges. Known gaps:

- Excitation point and direction are not modelled
- Real edge clamping is idealised
- Material inhomogeneity, temperature, sand grain mass are ignored
- Circular and rectangular plates are not implemented (only square)

If plate vibration is your field, this module needs you more than it needs a refactor.

### 4. Improve the statistics

Current: Welch's t, Cohen's d, 95% CI, Bonferroni/Holm, simulation-based power analysis.

Wanted:
- Bayesian hierarchical model for per-person response (different people may respond differently)
- Sequential analysis so a study can stop early with control of the error rate
- A replication registry linking discovery findings to their validation attempts

### 5. Improve the corpus

`engine/data/corpus.json` — 45 numbers, 12 sources, each with an evidence level.

Some of those evidence levels are probably wrong. Sumerian, Egyptian and Vedic sources are
represented thinly and through translation. **Correcting one bad citation is a genuine
contribution.** Cite a primary source or a scholarly edition; "a website said so" is not one.

Rules for corpus entries:
- `direct` — the number appears explicitly in a primary source
- `derived` — mathematically derived from a documented relationship (show the formula)
- `interpretive` — a later interpretation, or counted rather than stated
- `speculative` — a modern claim with no primary-source support

Ancient texts contain **numbers, not hertz**. Never tag a Hz value as `direct`.

### 6. Translate

`app/src/i18n/tr.json` and `en.json` — 392 keys, currently Turkish and English.

Copy `en.json`, translate, register it in `app/src/i18n/index.ts`. The glossary section
(38 plain-language definitions) matters most: it is what makes the app usable by someone who
has never heard the word "cent".

### 7. Report what confused you

If a screen made no sense, that is a bug. Say so plainly in an issue. "I clicked Add layer and
had no idea what happened" was real user feedback that led to the entire Home screen being
rewritten.

---

## Development

```bash
bash scripts/setup.sh          # venv + npm install + full test suite
```

### Before opening a pull request

```bash
cd engine && pytest            # 34 tests
cd app && npm test             # 39 tests
cd app && npx tsc --noEmit     # type check
bash scripts/parity.sh         # both engines must agree
```

**`scripts/parity.sh` is not optional.** The Python engine and the TypeScript app implement the
same formulas twice, and 24 reference values are checked to be identical. If you change a
formula in one, change it in the other.

### Code conventions

- Comments explain **why**, not what. If a formula is non-obvious, cite the reasoning.
- Every user-visible string goes through i18n. No hardcoded text, in any language.
- New scientific logic needs a test that would fail if the logic were wrong.
- Keep the safety caps: amplitude ≤ 0.2, frequency within 0.1 Hz – 96 kHz.

### The rules that are not negotiable

These are what make the project worth anything. A pull request that weakens one will be
declined regardless of how good the code is:

1. No module claims a frequency is "healing", "energetic" or otherwise effective
2. Evidence levels are never dropped or upgraded without a source
3. Simulation is never presented as measurement
4. Blinding is never bypassed for convenience
5. Preregistration cannot be edited after data collection starts
6. Underpowered results are never reported as "no effect" without the MDE alongside

---

## Issues and discussions

- **Bug** — something behaves incorrectly
- **Data contribution** — you have experiment or Chladni data to share
- **Corpus correction** — a number, source or evidence level is wrong
- **Idea / question** — open a [Discussion](../../discussions) instead

There is no CLA and no gatekeeping. If you are unsure whether something is worth raising,
raise it.
