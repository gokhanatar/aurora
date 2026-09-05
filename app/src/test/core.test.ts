import { describe, expect, it } from "vitest";
import { analyzeFrequency, cents, deriveFrequency, factorize, frequencyFamily, octaveReduce } from "../core/math";
import { centMatch, dtwDistance, harmonicMatch, rationalMatch, sequenceMatch, spectralMatch } from "../core/matching";
import { mathematicalScore, scoreFrequency } from "../core/scoring";
import { buildStimulus, protocolSet, totalSeconds } from "../core/sequence";
import { analyzeStudy, bonferroni, evidenceGrade, spearman, welch } from "../core/stats";
import { DEFAULT_PLATE, dominantMode, fingerprint, modalFrequency, modeNumbers, resonanceProximity, resonances, similarity, simulate, simulatePlate, type Plate } from "../core/chladni";
import { anomalies, evolve, scan } from "../core/discovery";
import { detectableEffect, evaluateDesign, powerTwoSample, requiredN } from "../core/power";
import { BANDS, SPECTRUM_HI, SPECTRUM_LO, bandOf, isRenderable } from "../core/math";
import { randomFrequencies, randomFrequency } from "../core/random";
import { journalToCsv, parseExport, type AuroraExport } from "../data/transfer";
import { NUMBERS, seedCandidates, sharedNumbers } from "../data/corpus";
import type { Trial } from "../data/types";

describe("math", () => {
  it("factorizes 432 = 2^4·3^3 and 528", () => {
    expect(factorize(432)).toEqual([2, 2, 2, 2, 3, 3, 3]);
    expect(factorize(528)).toEqual([2, 2, 2, 2, 3, 11]);
  });
  it("octave/cents/derive", () => {
    expect(octaveReduce(864)).toBe(1.6875);
    expect(cents(880, 440)).toBeCloseTo(1200, 6);
    expect(deriveFrequency(432, 3, 2)).toBe(648);
    expect(frequencyFamily(432).fourth).toBe(576);
  });
  it("notes", () => {
    expect(analyzeFrequency(440).note440).toBe("A4");
    expect(analyzeFrequency(432).note432).toBe("A4");
    expect(analyzeFrequency(528).digitalRoot).toBe(6);
  });
});

describe("matching", () => {
  it("cent + octave", () => {
    expect(centMatch(432, 864).match).toBe(false);
    expect(centMatch(432, 864, 8, true).match).toBe(true);
  });
  it("rational 648:432 = 3:2 fifth", () => {
    const r = rationalMatch(648, 432);
    expect(r.ratio).toBe("3:2");
    expect(r.referenceLabel).toBe("fifth");
  });
  it("harmonic", () => {
    expect(harmonicMatch(1056, 528).direct).toEqual({ kind: "f1_of_f2", k: 2 });
    expect(spectralMatch([[528.2, 1]], [528, 700])[1].match).toBe(false);
  });
  it("dtw + transposition invariance", () => {
    expect(dtwDistance([432, 528, 639], [432, 528, 639])).toBe(0);
    expect(sequenceMatch([432, 528, 639], [864, 1056, 1278]).transpositionInvariantMatch).toBe(true);
  });
});

describe("scoring/corpus", () => {
  it("speculative → historical 0; direct number > 0", () => {
    expect(scoreFrequency(432, NUMBERS).historical).toBe(0);
    expect(scoreFrequency(27, NUMBERS).historical).toBeGreaterThan(0);
    expect(mathematicalScore(432)).toBeLessThanOrEqual(40);
  });
  it("shared numbers include 7 and 12; seeds unique", () => {
    const v = sharedNumbers().map((s) => s.value);
    expect(v).toContain(7);
    expect(v).toContain(12);
    const c = seedCandidates();
    expect(new Set(c.map((x) => x.hz)).size).toBe(c.length);
  });
});

describe("sequence", () => {
  it("deterministic fingerprint and duration", () => {
    const a = buildStimulus([432, 528, 639], [5, 8, 13]);
    expect(a.id).toBe(buildStimulus([432, 528, 639], [5, 8, 13]).id);
    expect(totalSeconds(a)).toBe(26 * 60 + 1);
    expect(Object.keys(protocolSet([432, 528, 639]))).toHaveLength(5);
  });
});

describe("stats", () => {
  const mk = (cid: string, deltas: number[]): Trial[] =>
    deltas.map((d, i) => ({ id: `${cid}${i}`, studyId: "S", conditionId: cid, orderIndex: i, pre: { energy: 5, calm: 5, focus: 5, motivation: 5, sleepiness: 5, restlessness: 5 }, post: { energy: 5, calm: 5 + d, focus: 5, motivation: 5, sleepiness: 5, restlessness: 5 }, notes: "", startedAt: null, endedAt: null }));
  it("welch/bonferroni/grade", () => {
    const trials = [...mk("A", [2, 3, 2.5, 3, 2]), ...mk("CTRL", [0, 0.5, -0.5, 0, 0.2])];
    const r = analyzeStudy(trials, "calm", "CTRL");
    const a = r.conditions.find((c) => c.conditionId === "A")!;
    expect(a.p!).toBeLessThan(0.01);
    expect(a.cohenD!).toBeGreaterThan(2);
    expect(evidenceGrade(a)).toBe("discovery");
    expect(bonferroni(0.02, 3)).toBeCloseTo(0.06);
    expect(welch([1, 2, 3], [1, 2, 3]).p).toBeCloseTo(1, 5);
  });
  it("spearman", () => {
    expect(spearman([1, 2, 3, 4], [1, 2, 3, 4])).toBeCloseTo(1);
    expect(spearman([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1);
  });
});

describe("chladni/discovery", () => {
  it("deterministic sim, fingerprint bounds", () => {
    const m = simulate(528, 64);
    expect(m).toEqual(simulate(528, 64));
    const f = fingerprint(m, 64);
    expect(f.symmetry).toBeGreaterThan(0.5);
    expect(similarity(f, f)).toBe(1);
    expect(modeNumbers(528)[0]).toBeLessThan(modeNumbers(528)[1]);
  });
  it("evolve within audible; scan/anomalies shape", () => {
    const h = evolve([432, 528, 639], null, 2);
    expect(h[1].population.every((x) => x >= 20 && x <= 20000)).toBe(true);
    expect(scan(100, 200, 100, 5).length).toBeLessThanOrEqual(5);
    expect(Array.isArray(anomalies([100, 200, 300, 400, 7919.5]))).toBe(true);
  });
});

describe("power", () => {
  it("power increases with n and with effect size", () => {
    expect(powerTwoSample(5, 1.0, 3, 0.05, 300)).toBeLessThan(powerTwoSample(30, 1.0, 3, 0.05, 300));
    expect(powerTwoSample(15, 0.5, 3, 0.05, 300)).toBeLessThan(powerTwoSample(15, 2.0, 3, 0.05, 300));
  });
  it("false positive rate stays near alpha under the null", () => {
    expect(powerTwoSample(20, 0, 3, 0.05, 600)).toBeLessThan(0.06);
  });
  it("flags the underpowered n=5 design and suggests a larger n", () => {
    const weak = evaluateDesign(4, 5, 10);
    expect(weak.adequate).toBe(false);
    expect(weak.comparisons).toBe(3);
    expect(weak.totalTrials).toBe(20);
    const strong = evaluateDesign(2, 40, 10);
    expect(strong.powerAtTarget).toBeGreaterThan(weak.powerAtTarget);
  });
  it("smaller effects require larger samples", () => {
    const nSmall = requiredN(0.5, 1);
    const nLarge = requiredN(1.5, 1);
    expect(nSmall!).toBeGreaterThan(nLarge!);
  });
  it("minimum detectable effect shrinks as n grows", () => {
    const mde10 = detectableEffect(10, 2);
    const mde30 = detectableEffect(30, 2);
    expect(mde10!).toBeGreaterThan(mde30!);
  });
});


describe("plate physics (Chladni)", () => {
  const steel: Plate = { material: "steel", sizeCm: 20, thicknessMm: 1, boundary: "free" };

  it("modal frequency follows the Kirchhoff-Love scaling laws", () => {
    // f ∝ h  (kalınlık iki katına çıkınca frekans iki katına çıkar)
    const thin = modalFrequency(2, 3, steel);
    const thick = modalFrequency(2, 3, { ...steel, thicknessMm: 2 });
    expect(thick / thin).toBeCloseTo(2, 1);
    // f ∝ 1/L²  (kenar iki katına çıkınca frekans dörtte bire iner)
    const big = modalFrequency(2, 3, { ...steel, sizeCm: 40 });
    expect(thin / big).toBeCloseTo(4, 0);
  });

  it("the same frequency gives a different mode on a different plate", () => {
    const onSteel = modeNumbers(528, steel);
    const onBigger = modeNumbers(528, { ...steel, sizeCm: 30 });
    expect(onSteel).not.toEqual(onBigger);       // desen frekansa değil levhaya bağlı
  });

  it("material changes the resonance frequency", () => {
    const fSteel = modalFrequency(2, 3, steel);
    const fAlu = modalFrequency(2, 3, { ...steel, material: "aluminum" });
    expect(Math.abs(fSteel - fAlu)).toBeGreaterThan(1);
  });

  it("proximity peaks exactly at a resonance and falls away from it", () => {
    const r = resonances(steel, 100, 2000)[0];
    expect(resonanceProximity(r.hz, steel)).toBeCloseTo(1, 1);
    expect(resonanceProximity(r.hz * 1.3, steel)).toBeLessThan(0.5);
  });

  it("boundary condition shifts the spectrum", () => {
    const free = modalFrequency(2, 3, steel);
    const clamped = modalFrequency(2, 3, { ...steel, boundary: "clamped" });
    expect(clamped).toBeGreaterThan(free);        // ankastre kenar levhayı sertleştirir
  });

  it("simulation stays deterministic and produces nodal lines", () => {
    const m1 = simulatePlate(528, steel, 64);
    expect(m1).toEqual(simulatePlate(528, steel, 64));
    const density = m1.reduce((a: number, b) => a + b, 0) / m1.length;
    expect(density).toBeGreaterThan(0);           // kum var
    expect(density).toBeLessThan(0.5);            // ama her yeri kaplamıyor
    expect(similarity(fingerprint(m1, 64), fingerprint(m1, 64))).toBe(1);
  });

  it("dominant mode is the closest resonance", () => {
    const r = resonances(steel, 200, 1200)[2];
    const d = dominantMode(r.hz, steel);
    expect(d).not.toBeNull();
    expect(d!.m).toBe(r.m);
    expect(d!.n).toBe(r.n);
  });

  it("legacy simulate() still works with the default plate", () => {
    expect(simulate(528, 48)).toEqual(simulatePlate(528, DEFAULT_PLATE, 48));
  });
});

describe("frequency spectrum bands", () => {
  it("covers infrasound through ultrasound", () => {
    expect(SPECTRUM_LO).toBeLessThan(20);
    expect(SPECTRUM_HI).toBeGreaterThan(20000);
    expect(bandOf(5).id).toBe("infrasound");
    expect(bandOf(100).id).toBe("bass");
    expect(bandOf(528).id).toBe("midrange");
    expect(bandOf(8000).id).toBe("treble");
    expect(bandOf(30000).id).toBe("ultrasound");
  });

  it("marks inaudible bands honestly", () => {
    expect(bandOf(5).audible).toBe(false);
    expect(bandOf(30000).audible).toBe(false);
    expect(bandOf(440).audible).toBe(true);
    expect(BANDS.every((b) => b.lo < b.hi)).toBe(true);
  });

  it("respects the Nyquist limit", () => {
    expect(isRenderable(20000, 48000)).toBe(true);
    expect(isRenderable(30000, 48000)).toBe(false);   // 48 kHz cihazda üst sınır 24 kHz
    expect(isRenderable(30000, 96000)).toBe(true);
  });
});

describe("random frequency", () => {
  it("stays inside the requested range", () => {
    for (let i = 0; i < 200; i++) {
      const f = randomFrequency(100, 1000);
      expect(f).toBeGreaterThanOrEqual(100);
      expect(f).toBeLessThanOrEqual(1000);
    }
  });

  it("is genuinely random — no repeats, not snapped to round numbers", () => {
    const draws = Array.from({ length: 100 }, () => randomFrequency(100, 1000));
    expect(new Set(draws).size).toBeGreaterThan(95);          // neredeyse hepsi farklı
    const integers = draws.filter((f) => Number.isInteger(f)).length;
    expect(integers).toBeLessThan(5);                          // ondalıklı, "özel sayı" değil
  });

  it("log scale spreads draws across octaves, linear does not", () => {
    const below = (xs: number[]) => xs.filter((f) => f < 2000).length / xs.length;
    const log = Array.from({ length: 400 }, () => randomFrequency(20, 20000, "log"));
    const lin = Array.from({ length: 400 }, () => randomFrequency(20, 20000, "linear"));
    expect(below(log)).toBeGreaterThan(0.4);                   // log: alt oktavlar da temsil edilir
    expect(below(lin)).toBeLessThan(0.2);                      // linear: tiz bölgeye yığılır
  });

  it("returns the requested count, sorted, and clamps absurd counts", () => {
    const three = randomFrequencies(3, 200, 800);
    expect(three).toHaveLength(3);
    expect([...three].sort((a, b) => a - b)).toEqual(three);
    expect(randomFrequencies(999, 200, 800).length).toBeLessThanOrEqual(16);
    expect(randomFrequencies(0, 200, 800).length).toBe(1);
  });

  it("handles a reversed or degenerate range without crashing", () => {
    const f = randomFrequency(1000, 100);                      // ters verilmiş
    expect(f).toBeGreaterThanOrEqual(100);
    expect(f).toBeLessThanOrEqual(1000);
    expect(randomFrequency(440, 440)).toBe(440);
  });
});

describe("data transfer", () => {
  const sample = (): AuroraExport => ({
    format: "aurora-export", version: 1, exportedAt: "2026-01-01T00:00:00.000Z", app: "AURORA",
    counts: {}, data: {
      candidates: [], stimuli: [], studies: [], trials: [], patterns: [],
      journal: [
        { date: "2026-01-01", mood: 7, energy: 6, new_opportunity: 1, positive_interaction: 2, business_lead: 0, unexpected_positive_event: 1, goal_completion: 0, social_interaction: 3, protocolId: null },
        { date: "2026-01-02", mood: 4, energy: 3, new_opportunity: 0, positive_interaction: 0, business_lead: 0, unexpected_positive_event: 0, goal_completion: 1, social_interaction: 1, protocolId: "STM-X" },
      ],
    },
  });

  it("rejects files that are not AURORA exports, with a clear reason", () => {
    expect(() => parseExport("not json at all")).toThrow("invalidJson");
    expect(() => parseExport('{"hello":"world"}')).toThrow("notAuroraFile");
    expect(() => parseExport(JSON.stringify({ ...sample(), version: 99 }))).toThrow("newerVersion");
  });

  it("accepts a valid export round-trip", () => {
    const parsed = parseExport(JSON.stringify(sample()));
    expect(parsed.data.journal).toHaveLength(2);
    expect(parsed.format).toBe("aurora-export");
  });

  it("writes journal CSV with a header and one row per entry", () => {
    const csv = journalToCsv(sample().data.journal);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("date");
    expect(lines[0]).toContain("mood");
    expect(lines).toHaveLength(3);                              // başlık + 2 kayıt
    expect(lines[1]).toContain("2026-01-01");
  });

  it("sorts CSV rows by date regardless of input order", () => {
    const reversed = [...sample().data.journal].reverse();
    const lines = journalToCsv(reversed).trim().split("\n");
    expect(lines[1]).toContain("2026-01-01");
    expect(lines[2]).toContain("2026-01-02");
  });
});
