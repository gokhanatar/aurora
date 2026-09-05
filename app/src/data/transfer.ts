/** Veri aktarımı — tüm kayıtları tek dosyaya çıkarma ve geri yükleme.
 *
 * Amaç: kullanıcı kendi verisini yedekleyebilsin, başkasına gönderebilsin ve
 * başkasından gelen veriyi kendi cihazına alabilsin.
 *
 * Dosya biçimi: düz JSON (`.aurora.json`). Okunabilir ve elle incelenebilir olması
 * kasıtlıdır — kimse kendi verisinin içinde ne olduğunu merak etmek zorunda kalmasın.
 * İçe aktarma her zaman BİRLEŞTİRİR (merge), asla sessizce silmez.
 */
import { candidates, journal, patterns, stimuli, studies, trials } from "./repo";
import type { Candidate, JournalEntry, PatternRecord, Stimulus, Study, Trial } from "./types";

export const EXPORT_VERSION = 1;

export interface AuroraExport {
  format: "aurora-export";
  version: number;
  exportedAt: string;
  app: string;
  counts: Record<string, number>;
  data: {
    candidates: Candidate[];
    stimuli: Stimulus[];
    studies: Study[];
    trials: Trial[];
    journal: JournalEntry[];
    patterns: PatternRecord[];
  };
}

export type Section = keyof AuroraExport["data"];
export const SECTIONS: Section[] = ["journal", "trials", "studies", "stimuli", "candidates", "patterns"];

/** Tüm veriyi (veya seçilen bölümleri) tek bir nesneye toplar. */
export const buildExport = async (sections: Section[] = SECTIONS): Promise<AuroraExport> => {
  const want = new Set(sections);
  const data: AuroraExport["data"] = {
    candidates: want.has("candidates") ? await candidates.all() : [],
    stimuli: want.has("stimuli") ? await stimuli.all() : [],
    studies: want.has("studies") ? await studies.all() : [],
    trials: want.has("trials") ? await trials.all() : [],
    journal: want.has("journal") ? await journal.all() : [],
    patterns: want.has("patterns") ? await patterns.all() : [],
  };
  return {
    format: "aurora-export",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    app: "AURORA",
    counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
    data,
  };
};

export const exportFilename = (): string => `aurora-${new Date().toISOString().slice(0, 10)}.aurora.json`;

/** Dosyayı indirir (tarayıcı) — mobilde paylaş sayfası açılır. */
export const downloadExport = async (sections?: Section[]): Promise<{ name: string; bytes: number }> => {
  const payload = await buildExport(sections);
  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const name = exportFilename();

  const file = typeof File !== "undefined" ? new File([blob], name, { type: "application/json" }) : null;
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: unknown) => Promise<void> };
  if (file && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "AURORA" });
      return { name, bytes: blob.size };
    } catch {
      /* paylaşım iptal edildi → indirmeye düş */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return { name, bytes: blob.size };
};

export interface ImportResult {
  added: Record<string, number>;
  skipped: Record<string, number>;
  total: number;
}

/** Bir JSON metnini doğrular. Geçersizse anlaşılır bir hata fırlatır. */
export const parseExport = (text: string): AuroraExport => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("invalidJson");
  }
  const p = parsed as Partial<AuroraExport>;
  if (!p || p.format !== "aurora-export" || !p.data) throw new Error("notAuroraFile");
  if (typeof p.version !== "number" || p.version > EXPORT_VERSION) throw new Error("newerVersion");
  return p as AuroraExport;
};

const KEY_OF: Record<Section, string> = {
  candidates: "id", stimuli: "id", studies: "id", trials: "id", journal: "date", patterns: "id",
};

/**
 * İçe aktarma — BİRLEŞTİRİR.
 *
 * `overwrite=false` (varsayılan): aynı kimlikli kayıt varsa dokunulmaz, atlanır.
 * `overwrite=true`: gelen kayıt mevcut olanın üzerine yazar.
 * Hiçbir durumda mevcut veriler silinmez.
 */
export const importData = async (payload: AuroraExport, sections: Section[] = SECTIONS, overwrite = false): Promise<ImportResult> => {
  const repos = { candidates, stimuli, studies, trials, journal, patterns };
  const added: Record<string, number> = {};
  const skipped: Record<string, number> = {};

  for (const sec of sections) {
    const incoming = (payload.data[sec] ?? []) as unknown as Array<Record<string, unknown>>;
    if (!Array.isArray(incoming) || incoming.length === 0) {
      added[sec] = 0;
      skipped[sec] = 0;
      continue;
    }
    const repo = repos[sec] as { all: () => Promise<unknown[]>; put: (x: never) => Promise<unknown> };
    const key = KEY_OF[sec];
    const existing = new Set(((await repo.all()) as Array<Record<string, unknown>>).map((x) => String(x[key])));
    let a = 0, sk = 0;
    for (const item of incoming) {
      const id = String(item[key] ?? "");
      if (!id) { sk++; continue; }
      if (existing.has(id) && !overwrite) { sk++; continue; }
      await repo.put(item as never);
      existing.add(id);
      a++;
    }
    added[sec] = a;
    skipped[sec] = sk;
  }
  return { added, skipped, total: Object.values(added).reduce((x, y) => x + y, 0) };
};

/** Günlüğü tablo programlarında açmak için CSV. */
export const journalToCsv = (entries: JournalEntry[]): string => {
  const cols: Array<keyof JournalEntry> = [
    "date", "mood", "energy", "new_opportunity", "positive_interaction", "business_lead",
    "unexpected_positive_event", "goal_completion", "social_interaction", "protocolId",
  ];
  const head = cols.join(",");
  const body = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => cols.map((c) => JSON.stringify(e[c] ?? "")).join(","))
    .join("\n");
  return `${head}\n${body}\n`;
};

export const downloadCsv = (csv: string, name: string): void => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};
