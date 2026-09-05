# Corpus Guide

*How the number corpus works, and how to add to it.*

The corpus is the historical foundation of this project. Its credibility rests entirely on one
thing: **every number carries an honest account of where it came from.** A corpus entry that
overstates its evidence is worse than no entry at all.

---

## The core distinction

> **Ancient texts contain numbers. They do not contain hertz.**

Hertz is a modern unit — cycles per second, standardised long after every source in this
corpus was written. When Plato's *Timaeus* gives the series 1, 2, 3, 4, 8, 9, 27, that is a
series of numbers. Turning 27 into 432 Hz (27 × 2⁴) is *our* arithmetic, not Plato's.

Every such conversion is tagged `derived` and displays its formula. **Never tag a Hz value as
`direct`.** No exceptions.

---

## Evidence levels

| Level | Meaning | Example | Score penalty |
|---|---|---|---|
| `direct` | The number appears explicitly in a primary source | Timaeus 35b–36b states 1, 2, 3, 4, 8, 9, 27 | 0 |
| `derived` | Mathematically derived from a documented relationship — **show the formula** | 432 × 3/2 = 648 | −5 |
| `interpretive` | A later interpretation, or counted rather than stated | 108 beads in the japa tradition | −15 |
| `speculative` | A modern claim with no primary-source support | "528 Hz repairs DNA" | −30 |

`speculative` entries score **zero** historical points. They are in the corpus as candidates to
be tested, never as premises to build on.

### Extraction methods

| Method | Meaning |
|---|---|
| `explicit` | The number is written in the text |
| `counted` | Obtained by counting things in the source (42 assessors, 10 mandalas) |
| `computed` | Calculated from other values in the source (1+2+3+4 = 10) |

A `counted` number is rarely `direct` — counting involves a decision about what to count.

---

## Entry format

```json
{
  "number_id": "N-GRK-27",
  "source_id": "GRK-TIM",
  "value": 27,
  "context": "World-Soul: triple series 1,3,9,27",
  "extraction": "explicit",
  "evidence_level": "direct"
}
```

Sources:

```json
{
  "source_id": "GRK-TIM",
  "civilization": "greek",
  "date_range": "c. 360 BCE",
  "title": "Plato, Timaeus 35b–36b (World-Soul division)",
  "language": "Ancient Greek",
  "provenance": "Primary text, standard editions",
  "citation": "Plato, Timaeus 35b–36b"
}
```

Ratios:

```json
{
  "ratio_id": "R-3-2",
  "numerator": 3,
  "denominator": 2,
  "label": "fifth",
  "source_ids": ["GRK-PYTH", "GRK-TIM"],
  "derivation": "explicit in Pythagorean harmonics",
  "evidence_level": "direct"
}
```

---

## What makes a good citation

**Acceptable:**
- A primary source with a locator — *Plato, Timaeus 35b–36b*
- A standard scholarly edition — *Burnet, Oxford Classical Texts*
- An academic reference work — *Stanford Encyclopedia of Philosophy*, *Jewish Encyclopedia*
- A recognised corpus project — *ETCSL (Oxford)*
- A museum catalogue for material objects — *The Met, sistrum*

**Not acceptable:**
- "A website said so"
- A YouTube video
- A book about sacred geometry with no primary citations
- Another wiki that cites nothing

If a claim only exists in modern esoteric literature, it can still enter the corpus — as
`speculative`, honestly labelled. That is what the Solfeggio entries are.

---

## Adding a civilisation

The corpus began with five. There are many more with documented number–music relationships.
Strong candidates:

| Civilisation | What to look for | Starting points |
|---|---|---|
| **Chinese** | The 12 *lülü* pitch pipes; *sanfen sunyi fa* (三分损益法), the "subtract and add one third" method alternating ×2/3 and ×4/3; 81 as the *huangzhong* pipe number | *Lüshi Chunqiu*, *Huainanzi*, *Book of Han* treatise on music |
| **Persian / Islamic** | Al-Farabi's ratio systems; Safi al-Din al-Urmawi's 17-tone division; the Ikhwan al-Safa epistle on music | *Kitāb al-Mūsīqā al-Kabīr*; *Kitāb al-Adwār* |
| **Mesoamerican** | 260-day Tzolk'in, 365-day Haab', the 52-year Calendar Round, vigesimal 20, 13 | Dresden Codex; Long Count inscriptions |
| **Roman** | Transmission of Greek ratios into the Latin tradition | Boethius, *De institutione musica* |
| **Japanese** | *Gagaku* 12 pitches, *ritsu* and *ryo* scales | Court music treatises |
| **Javanese** | *Slendro* (5) and *pelog* (7) — **important:** these are famously *not* simple integer ratios and vary between gamelan sets. That fact is itself worth recording | Ethnomusicological field measurements |
| **African** | Yoruba Ifá divination: 16 principal *odu*, 256 total | Ethnographic literature |

### Be sceptical in proportion to the appeal

Some traditions attract far more modern invention than others. "Celtic sacred numerology" and
"Atlantean frequencies" are overwhelmingly twentieth-century creations. If you cannot find a
primary source, the honest entry is `speculative` — or no entry.

**A civilisation represented by three well-cited `direct` numbers is worth more than one
padded with thirty `speculative` ones.**

---

## Things that would improve what is already here

The existing corpus has known weaknesses. Fixing any of them is a real contribution:

- **Mesopotamian** entries rely on the sexagesimal system and a general characterisation of
  ETCSL hymns. Specific hymns with specific repetition counts would be much stronger.
- **Egyptian** numbers come through translation. The 42 assessors of Book of the Dead spell
  125 are solid; the sistrum's "three rods" is an object count that varies by artefact.
- **Vedic** śruti (22) and svara (7) are well attested, but 108 is `interpretive` and its
  origin is genuinely disputed.
- **Hebrew** gematria values are computed correctly, but whether the biblical text *uses*
  gematria systematically is not established — the Jewish Encyclopedia is explicit about this.
- **Greek** is the best-supported section, and even there the attribution to Pythagoras
  personally is reconstructed from much later sources.

---

## How to submit

1. Open a [Corpus correction issue](../../issues/new?template=corpus-correction.yml), or
2. Edit `engine/data/corpus.json` directly and open a pull request

Either way, include the citation. Say plainly what is certain and what is not — a note like
*"scholarly consensus is divided on this"* makes an entry more valuable, not less.

### Checks before submitting

```bash
cd engine && source .venv/bin/activate
python -c "import json; json.load(open('data/corpus.json'))"   # valid JSON
pytest                                                          # corpus tests pass
aurora corpus summary                                           # counts look right
aurora corpus structure                                         # shared numbers across civilisations
```

The app reads the same file, so a corpus change is immediately visible in
**Library → Corpus** without any additional work.

---

## What the corpus is *not*

It is not a list of sacred numbers. It is not evidence that ancient people knew about
frequencies. It is a catalogue of numbers that appear in documented sources, each carrying an
honest statement of how firmly it rests on that source — so that anything built on top of it
can be traced back and checked.

Numbers shared across civilisations (3, 4, 7, 9, 10, 12) are shown in the app as a
**descriptive** observation. Small integers recur across cultures for ordinary reasons: body
parts, lunar cycles, counting systems. Shared occurrence is a reason to look, never a
conclusion.
