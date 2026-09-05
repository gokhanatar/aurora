export type EvidenceLevel = "direct" | "derived" | "interpretive" | "speculative";
export type HypothesisStatus = "candidate" | "tested" | "validated" | "rejected";
export type Origin = "popular" | "derived" | "user" | "discovery";
export type WaveformKind = "sine" | "triangle" | "square" | "sawtooth";
export type MeasurementKind = "simulation" | "real";
export type OutcomeKey = "energy" | "calm" | "focus" | "motivation" | "sleepiness" | "restlessness";
export const OUTCOME_KEYS: OutcomeKey[] = ["energy", "calm", "focus", "motivation", "sleepiness", "restlessness"];

export interface CorpusSource { sourceId: string; civilization: string; dateRange: string; title: string; citation: string }
export interface CorpusNumber { numberId: string; sourceId: string; value: number; context: string; extraction: "explicit" | "counted" | "computed"; evidenceLevel: EvidenceLevel }
export interface CorpusRatio { ratioId: string; numerator: number; denominator: number; label: string; sourceIds: string[]; evidenceLevel: EvidenceLevel }

export interface Candidate {
  id: string;
  hz: number;
  origin: Origin;
  evidenceLevel: EvidenceLevel;
  status: HypothesisStatus;
  formula?: string;
  sourceIds: string[];
  createdAt: number;
}

export interface Step { hz: number; durationS: number }
export interface Stimulus { id: string; name: string; steps: Step[]; gapS: number; repetitions: number; waveform: WaveformKind; amplitude: number }

export type Outcome = Record<OutcomeKey, number>;

export interface Condition { conditionId: string; label: string; stimulusId: string | null; kind: "stimulus" | "silence_control" | "random_control" }

export interface Study {
  id: string;
  primaryOutcome: OutcomeKey;
  conditions: Condition[];
  repetitions: number;
  seed: number;
  exclusionRule: string;
  correction: "bonferroni";
  frozenAt: number | null;
  unblindedAt: number | null;
  /** Dondurma anındaki güç analizi — sonuçlar yorumlanırken zorunlu bağlam. */
  design: { detectableD: number | null; powerAtTarget: number; totalTrials: number } | null;
  set: "discovery" | "validation";
  createdAt: number;
}

export interface Trial {
  id: string;
  studyId: string;
  conditionId: string;
  orderIndex: number;
  pre: Outcome | null;
  post: Outcome | null;
  notes: string;
  startedAt: number | null;
  endedAt: number | null;
}

export interface JournalEntry {
  date: string; // YYYY-MM-DD
  mood: number;
  energy: number;
  new_opportunity: number;
  positive_interaction: number;
  business_lead: number;
  unexpected_positive_event: number;
  goal_completion: number;
  social_interaction: number;
  protocolId: string | null;
}
export const JOURNAL_COUNT_KEYS = ["new_opportunity", "positive_interaction", "business_lead", "unexpected_positive_event", "goal_completion", "social_interaction"] as const;

export interface PatternFingerprint { symmetry: number; radialSymmetry: number; complexity: number; density: number; nodeCount: number; dominantAngleDeg: number }
export interface PatternRecord {
  id: string;
  hz: number;
  kind: MeasurementKind;
  fingerprint: PatternFingerprint;
  /** Deseni belirleyen fiziksel parametreler — bunlar olmadan bir Chladni kaydı yorumlanamaz. */
  plate: { material: string; sizeCm: number; thicknessMm: number; boundary: string; excitation: string };
  thumbnail: string | null; // data URL (küçük)
  createdAt: number;
}
