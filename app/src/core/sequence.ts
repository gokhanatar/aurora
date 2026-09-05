/** Sequence Engine — frekans + süre + sıra + tekrar → stimulus fingerprint */
import type { Stimulus, Step, WaveformKind } from "../data/types";

const hash = (s: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, "0");
};

export const fingerprint = (steps: Step[], gapS: number, repetitions: number, waveform: WaveformKind, amplitude: number): string =>
  "STM-" + hash(JSON.stringify({ steps, gapS, repetitions, waveform, amplitude }));

export const totalSeconds = (s: Pick<Stimulus, "steps" | "gapS" | "repetitions">): number =>
  (s.steps.reduce((a, x) => a + x.durationS, 0) + s.gapS * Math.max(0, s.steps.length - 1)) * s.repetitions;

export const buildStimulus = (
  freqs: number[],
  minutes: number[],
  opts: Partial<Pick<Stimulus, "gapS" | "repetitions" | "waveform" | "amplitude" | "name">> = {},
): Stimulus => {
  if (freqs.length !== minutes.length) throw new Error("freqs and minutes must have equal length");
  if (minutes.some((m) => m <= 0)) throw new Error("durations must be positive");
  const steps = freqs.map((hz, i) => ({ hz, durationS: minutes[i] * 60 }));
  const gapS = opts.gapS ?? 0.5;
  const repetitions = opts.repetitions ?? 1;
  const waveform = opts.waveform ?? "sine";
  const amplitude = Math.min(opts.amplitude ?? 0.15, 0.2);
  return { id: fingerprint(steps, gapS, repetitions, waveform, amplitude), name: opts.name ?? "", steps, gapS, repetitions, waveform, amplitude };
};

const mulberry = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const protocolSet = (freqs: number[], minutes = [5, 8, 13], seed = 0, lo = 100, hi = 1000): Record<string, Stimulus> => {
  const rng = mulberry(seed);
  const mins = freqs.map((_, i) => minutes[i % minutes.length]);
  const total = mins.reduce((a, b) => a + b, 0);
  return {
    A_forward: buildStimulus(freqs, mins, { name: "A" }),
    B_reversed: buildStimulus(freqs, [...mins].reverse(), { name: "B" }),
    C_single: buildStimulus([freqs[0]], [total], { name: "C" }),
    D_random: buildStimulus(freqs.map(() => Math.round((lo + rng() * (hi - lo)) * 100) / 100), mins, { name: "D" }),
    E_silence: buildStimulus(freqs.map(() => 0), mins, { name: "E" }),
  };
};
