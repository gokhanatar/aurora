import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { spearman } from "../core/stats";
import { journal, stimuli } from "../data/repo";
import { JOURNAL_COUNT_KEYS, type JournalEntry, type Stimulus } from "../data/types";
import { SECTIONS, downloadCsv, downloadExport, importData, journalToCsv, parseExport, type Section } from "../data/transfer";
import { LabelInfo, Note, Warn, fmt } from "../components/Common";
import { Scatter } from "../components/Viz";

const today = () => new Date().toISOString().slice(0, 10);
const blank = (date: string): JournalEntry => ({
  date, mood: 5, energy: 5, new_opportunity: 0, positive_interaction: 0, business_lead: 0,
  unexpected_positive_event: 0, goal_completion: 0, social_interaction: 0, protocolId: null,
});

/** Etiketli kaydırıcı — uçlarda ne anlama geldiği yazılı, sayı ikincil. */
const FeelSlider = ({ label, value, onChange, lo, mid, hi }: {
  label: string; value: number; onChange: (v: number) => void; lo: string; mid: string; hi: string;
}) => (
  <div className="feel">
    <div className="row between">
      <span className="feel-label">{label}</span>
      <span className="feel-value mono">{value}</span>
    </div>
    <input type="range" min={0} max={10} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    <div className="row between feel-scale">
      <span>{lo}</span><span>{mid}</span><span>{hi}</span>
    </div>
  </div>
);

/** Sayaç — artı/eksi düğmeli, klavye açmadan. */
const Counter = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="counter">
    <span className="counter-label">{label}</span>
    <div className="counter-ctl">
      <button className="btn small" onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0}>−</button>
      <span className="mono counter-num">{value}</span>
      <button className="btn small" onClick={() => onChange(value + 1)}>+</button>
    </div>
  </div>
);

export const Journal = () => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entry, setEntry] = useState<JournalEntry>(blank(today()));
  const [protocols, setProtocols] = useState<Stimulus[]>([]);
  const [metric, setMetric] = useState<keyof Omit<JournalEntry, "date" | "protocolId">>("mood");
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"today" | "history" | "data">("today");
  // Aktarım durumu
  const [picked, setPicked] = useState<Section[]>([...SECTIONS]);
  const [overwrite, setOverwrite] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const all = (await journal.all()).sort((a, b) => a.date.localeCompare(b.date));
    setEntries(all);
    const t0 = all.find((e) => e.date === today());
    setEntry(t0 ?? blank(today()));
    setSaved(Boolean(t0));
    setProtocols(await stimuli.all());
  };
  useEffect(() => { void load(); }, []);

  const save = async () => {
    await journal.put(entry);
    setSaved(true);
    await load();
  };

  const points = entries.map((e, i) => ({ x: i + 1, y: Number(e[metric]), hl: Boolean(e.protocolId) }));

  /** Maruziyet (gün t) → ertesi gün (t+1) toplam sayılabilir olay. */
  const corr = useMemo(() => {
    const xs: number[] = [], ys: number[] = [];
    for (let i = 0; i + 1 < entries.length; i++) {
      xs.push(entries[i].protocolId ? 1 : 0);
      ys.push(JOURNAL_COUNT_KEYS.reduce((s, k) => s + entries[i + 1][k], 0));
    }
    return spearman(xs, ys);
  }, [entries]);

  const doExport = async () => {
    try {
      const { name } = await downloadExport(picked);
      setMsg({ kind: "ok", text: t("journal.exported", { name }) });
    } catch {
      setMsg({ kind: "err", text: t("journal.importFailed") });
    }
  };

  const doExportCsv = () => {
    downloadCsv(journalToCsv(entries), `aurora-journal-${today()}.csv`);
    setMsg({ kind: "ok", text: t("journal.exported", { name: `aurora-journal-${today()}.csv` }) });
  };

  const onFile = async (f: File) => {
    try {
      const payload = parseExport(await f.text());
      const res = await importData(payload, picked, overwrite);
      await load();
      setMsg(res.total > 0
        ? { kind: "ok", text: t("journal.importDone", { count: res.total }) }
        : { kind: "ok", text: t("journal.importNothing") });
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      const key = code === "invalidJson" ? "errInvalidJson" : code === "notAuroraFile" ? "errNotAuroraFile" : code === "newerVersion" ? "errNewerVersion" : "importFailed";
      setMsg({ kind: "err", text: t(`journal.${key}`) });
    }
  };

  return (
    <div>
      <div className="row between">
        <h1 style={{ margin: 0 }}>{t("journal.title")}</h1>
        <span className="muted">{t("journal.streak", { count: entries.length })}</span>
      </div>

      <div className="subtabs" style={{ marginTop: 10 }}>
        {(["today", "history", "data"] as const).map((k) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => { setTab(k); setMsg(null); }}>
            {k === "today" ? t("journal.today") : k === "history" ? t("journal.history") : t("journal.export")}
          </button>
        ))}
      </div>

      {/* ---------- BUGÜN ---------- */}
      {tab === "today" && (
        <>
          <div className="card">
            <div className="row between">
              <h3 style={{ margin: 0 }}>{t("journal.howWasIt")}</h3>
              <span className="muted mono">{entry.date}</span>
            </div>
            <Note>{t("journal.moodHelp")}</Note>
            <FeelSlider label={t("journal.fields.mood")} value={entry.mood} onChange={(v) => setEntry({ ...entry, mood: v })}
              lo={t("journal.moodLow")} mid={t("journal.moodMid")} hi={t("journal.moodHigh")} />
            <FeelSlider label={t("journal.fields.energy")} value={entry.energy} onChange={(v) => setEntry({ ...entry, energy: v })}
              lo={t("journal.energyLow")} mid={t("journal.energyMid")} hi={t("journal.energyHigh")} />
          </div>

          <div className="card">
            <h3>{t("journal.countsTitle")}</h3>
            <Note>{t("journal.countsHelp")}</Note>
            {JOURNAL_COUNT_KEYS.map((k) => (
              <Counter key={k} label={t(`journal.fields.${k}`)} value={entry[k]} onChange={(v) => setEntry({ ...entry, [k]: v })} />
            ))}
          </div>

          <div className="card">
            <h3>{t("journal.listenedTitle")}</h3>
            <Note>{t("journal.listenedHelp")}</Note>
            <select value={entry.protocolId ?? ""} onChange={(e) => setEntry({ ...entry, protocolId: e.target.value || null })}>
              <option value="">{t("common.none")}</option>
              {protocols.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
            </select>
            <button className="btn primary play-btn" onClick={save}>
              {saved ? `✓ ${t("journal.savedToday")}` : t("common.save")}
            </button>
          </div>
        </>
      )}

      {/* ---------- GEÇMİŞ ---------- */}
      {tab === "history" && (
        <div className="card">
          <div className="row between">
            <h3 style={{ margin: 0 }}>{t("journal.chart")}</h3>
            <select value={metric} onChange={(e) => setMetric(e.target.value as typeof metric)} style={{ width: "auto" }}>
              {(["mood", "energy", ...JOURNAL_COUNT_KEYS] as const).map((k) => (
                <option key={k} value={k}>{t(`journal.fields.${k}`)}</option>
              ))}
            </select>
          </div>
          {entries.length === 0 ? (
            <div className="muted" style={{ padding: "16px 0" }}>{t("journal.noEntries")}</div>
          ) : (
            <>
              <Scatter points={points} xLabel={t("journal.days")} yLabel={t(`journal.fields.${metric}`)} line />
              <div className="kv">
                <span><LabelInfo text={t("journal.correlation")} term="pValue" /></span>
                <span>{fmt(corr)}</span>
              </div>
              <Warn k="warnings.correlation" />
            </>
          )}
        </div>
      )}

      {/* ---------- VERİ AKTARIMI ---------- */}
      {tab === "data" && (
        <>
          <div className="card">
            <h3>{t("journal.exportTitle")}</h3>
            <Note>{t("journal.exportHelp")}</Note>
            <div className="chips" style={{ marginBottom: 10 }}>
              {SECTIONS.map((sec) => (
                <button key={sec} className={`chip ${picked.includes(sec) ? "active" : ""}`}
                  onClick={() => setPicked((p) => (p.includes(sec) ? p.filter((x) => x !== sec) : [...p, sec]))}>
                  {t(`journal.sections.${sec}`)}
                </button>
              ))}
            </div>
            <button className="btn primary" onClick={doExport} disabled={!picked.length}>⬇ {t("journal.exportJson")}</button>
            <button className="btn" onClick={doExportCsv} disabled={!entries.length} style={{ marginTop: 8 }}>⬇ {t("journal.exportCsv")}</button>
          </div>

          <div className="card">
            <h3>{t("journal.importTitle")}</h3>
            <Note>{t("journal.importHelp")}</Note>
            <label className="row" style={{ gap: 8, alignItems: "center", marginBottom: 10 }}>
              <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} style={{ width: "auto" }} />
              <span className="muted">{t("journal.importOverwrite")}</span>
            </label>
            <button className="btn primary" onClick={() => fileRef.current?.click()}>⬆ {t("journal.importPick")}</button>
            <input ref={fileRef} type="file" accept=".json,application/json" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
          </div>

          {msg && <div className={`card ${msg.kind === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}
        </>
      )}
    </div>
  );
};
