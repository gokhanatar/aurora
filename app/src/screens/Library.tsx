import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { deriveFrequency } from "../core/math";
import { scoreFrequency } from "../core/scoring";
import { CIVILIZATIONS, NUMBERS, civilizationOf, corpusStats, seedCandidates, summarizeCivilization } from "../data/corpus";
import { candidates } from "../data/repo";
import type { Candidate, HypothesisStatus, Origin } from "../data/types";
import { Badge, Note } from "../components/Common";

const STATUSES: HypothesisStatus[] = ["candidate", "tested", "validated", "rejected"];
const ORIGINS: Array<Origin | "all"> = ["all", "popular", "derived", "user", "discovery"];

export const Library = ({ onPick }: { onPick: (hz: number) => void }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"candidates" | "corpus">("candidates");
  const stats = useMemo(corpusStats, []);

  return (
    <div>
      <div className="row between">
        <h1 style={{ margin: 0 }}>{t("library.title")}</h1>
        <span className="muted">{t("library.civilizations", { count: stats.civilizations })}</span>
      </div>
      <div className="subtabs" style={{ marginTop: 10 }}>
        <button className={tab === "candidates" ? "active" : ""} onClick={() => setTab("candidates")}>{t("library.candidatesTab")}</button>
        <button className={tab === "corpus" ? "active" : ""} onClick={() => setTab("corpus")}>{t("library.corpusTab")}</button>
      </div>
      {tab === "candidates" ? <Candidates onPick={onPick} /> : <CorpusBrowser onPick={onPick} />}
    </div>
  );
};

/** Frekans adayları — corpus türevleri, popüler iddialar, kullanıcı ve keşif adayları. */
const Candidates = ({ onPick }: { onPick: (hz: number) => void }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<Candidate[]>([]);
  const [origin, setOrigin] = useState<Origin | "all">("all");
  const [custom, setCustom] = useState("");

  const load = async () => {
    let all = await candidates.all();
    if (all.length === 0) {
      all = seedCandidates();
      await Promise.all(all.map((c) => candidates.put(c)));
    }
    setItems(all.sort((a, b) => a.hz - b.hz));
  };
  useEffect(() => { void load(); }, []);

  const setStatus = async (c: Candidate, status: HypothesisStatus) => {
    await candidates.put({ ...c, status });
    await load();
  };
  const addCustom = async () => {
    const hz = Number(custom.replace(",", "."));
    if (!Number.isFinite(hz) || hz <= 0) return;
    await candidates.put({ id: `USR-${Date.now()}`, hz, origin: "user", evidenceLevel: "speculative", status: "candidate", sourceIds: [], createdAt: Date.now() });
    setCustom("");
    await load();
  };

  const shown = items.filter((c) => origin === "all" || c.origin === origin);

  return (
    <>
      <div className="chips" style={{ marginBottom: 8 }}>
        {ORIGINS.map((o) => (
          <button key={o} className={`chip ${origin === o ? "active" : ""}`} onClick={() => setOrigin(o)}>
            {o === "all" ? t("common.all") : t(`badges.${o}`)}
          </button>
        ))}
      </div>
      <div className="row" style={{ marginBottom: 8 }}>
        <input placeholder={t("library.addCustom")} value={custom} onChange={(e) => setCustom(e.target.value)} inputMode="decimal" style={{ flex: 1 }} />
        <button className="btn" onClick={addCustom}>{t("common.add")}</button>
      </div>
      <div className="card">
        {shown.length === 0 && <div className="muted">{t("common.empty")}</div>}
        {shown.map((c) => {
          const s = scoreFrequency(c.hz, NUMBERS);
          const civ = c.sourceIds[0] ? civilizationOf(c.sourceIds[0]) : null;
          return (
            <div key={c.id} className="list-item">
              <div onClick={() => onPick(c.hz)} style={{ flex: 1 }}>
                <div className="mono" style={{ fontSize: 16 }}>{c.hz.toFixed(3)} {t("common.hz")}</div>
                <div>
                  <Badge kind={c.evidenceLevel} /><Badge kind={c.origin} /><Badge kind={c.status} />
                  {civ && <span className="muted">{t(`library.civ.${civ}`, { defaultValue: civ })}</span>}
                </div>
                {c.formula && <div className="muted">{t("library.formula")}: {c.formula}</div>}
                <div className="muted">M {s.math.toFixed(0)} · H {s.historical.toFixed(0)}</div>
              </div>
              <select value={c.status} onChange={(e) => setStatus(c, e.target.value as HypothesisStatus)} style={{ width: 110 }}>
                {STATUSES.map((s2) => <option key={s2} value={s2}>{t(`badges.${s2}`)}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </>
  );
};

/** Corpus tarayıcısı — hangi sayı hangi kaynaktan, hangi kanıt seviyesiyle geldi. */
const CorpusBrowser = ({ onPick }: { onPick: (hz: number) => void }) => {
  const { t } = useTranslation();
  const [civ, setCiv] = useState<string>(CIVILIZATIONS[0] ?? "greek");
  const summary = useMemo(() => summarizeCivilization(civ), [civ]);

  /** Sayıyı duyulabilir aralığa oktav kaydırarak frekansa çevirir — her zaman 'türev'. */
  const toFrequency = (value: number) => {
    let f = value;
    while (f < 100) f *= 2;
    while (f > 1000) f /= 2;
    onPick(Math.round(f * 1000) / 1000);
  };

  return (
    <>
      <Note>{t("library.corpusIntro")}</Note>

      <div className="chips" style={{ marginBottom: 10 }}>
        {CIVILIZATIONS.map((c) => (
          <button key={c} className={`chip ${civ === c ? "active" : ""}`} onClick={() => setCiv(c)}>
            {t(`library.civ.${c}`, { defaultValue: c })}
          </button>
        ))}
      </div>

      {summary.sources.map((src) => {
        const nums = summary.numbers.filter((n) => n.sourceId === src.sourceId);
        return (
          <div key={src.sourceId} className="card">
            <h3 style={{ marginTop: 0 }}>{src.title}</h3>
            <div className="kv"><span>{t("library.dateRange")}</span><span style={{ fontFamily: "inherit" }}>{src.dateRange}</span></div>
            <div className="kv"><span>{t("library.citation")}</span><span style={{ fontFamily: "inherit", textAlign: "right", flex: 1, marginLeft: 12 }}>{src.citation}</span></div>

            {nums.length > 0 && (
              <>
                <h3>{t("library.numbersFrom")}</h3>
                {nums.map((n) => (
                  <div key={n.numberId} className="list-item">
                    <div style={{ flex: 1 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <span className="mono" style={{ fontSize: 17, color: "var(--accent)" }}>{n.value}</span>
                        <Badge kind={n.evidenceLevel} />
                        <span className="muted" style={{ fontSize: 11 }}>{t(`library.extractions.${n.extraction}`)}</span>
                      </div>
                      <div className="muted">{n.context}</div>
                    </div>
                    <button className="btn small" onClick={() => toFrequency(n.value)}>♪</button>
                  </div>
                ))}
              </>
            )}

            {summary.ratios.filter((r) => r.sourceIds.includes(src.sourceId)).map((r) => (
              <div key={r.ratioId} className="list-item">
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="mono" style={{ fontSize: 15, color: "var(--accent2)" }}>{r.numerator}:{r.denominator}</span>
                    <Badge kind={r.evidenceLevel} />
                  </div>
                  <div className="muted">{r.label}</div>
                </div>
                <button className="btn small" onClick={() => onPick(Math.round(deriveFrequency(432, r.numerator, r.denominator) * 1000) / 1000)}>♪</button>
              </div>
            ))}
          </div>
        );
      })}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>{t("library.wrongEntry")}</h3>
        <div className="muted">{t("library.wrongEntryHelp")}</div>
      </div>
    </>
  );
};
