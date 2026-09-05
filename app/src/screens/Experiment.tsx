import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { audio } from "../audio/engine";
import { evaluateDesign, requiredN } from "../core/power";
import { buildStimulus, totalSeconds } from "../core/sequence";
import { analyzeStudy, evidenceGrade, spearman } from "../core/stats";
import { stimuli, studies, trials as trialRepo, uid } from "../data/repo";
import { OUTCOME_KEYS, type Condition, type Outcome, type OutcomeKey, type Stimulus, type Study, type Trial } from "../data/types";
import { Rating, Warn, fmt } from "../components/Common";

const mulberry = (seed: number) => () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = <T,>(xs: T[], rng: () => number): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const blank = (): Outcome => ({ energy: 5, calm: 5, focus: 5, motivation: 5, sleepiness: 5, restlessness: 5 });

/** Randomize sıra + anonim etiket (A,B,C…). Gerçek stimulus sadece unblind sonrası görünür. */
export const makeTrials = (study: Study): Trial[] => {
  const rng = mulberry(study.seed);
  const out: Trial[] = [];
  for (let r = 0; r < study.repetitions; r++)
    for (const c of shuffle(study.conditions, rng)) out.push({ id: uid("TRL"), studyId: study.id, conditionId: c.conditionId, orderIndex: out.length, pre: null, post: null, notes: "", startedAt: null, endedAt: null });
  return out;
};

export const prereg = (study: Partial<Study>) => ({
  primary_outcome_defined_before_data: OUTCOME_KEYS.includes(study.primaryOutcome as OutcomeKey),
  primary_comparison_defined_before_data: (study.conditions?.length ?? 0) >= 2 && !!study.conditions?.some((c) => c.kind !== "stimulus"),
  randomization_defined_before_data: true,
  blinding_defined_before_data: true,
  exclusion_rules_defined_before_data: !!study.exclusionRule,
  multiple_comparison_plan_defined: study.correction === "bonferroni",
  analysis_code_frozen_before_unblinding: !!study.frozenAt,
});

export const Experiment = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"setup" | "session" | "results">("setup");
  const [study, setStudy] = useState<Study | null>(null);
  const [allTrials, setAllTrials] = useState<Trial[]>([]);
  const [protocols, setProtocols] = useState<Stimulus[]>([]);
  // setup form
  const [primary, setPrimary] = useState<OutcomeKey>("calm");
  const [chosen, setChosen] = useState<string[]>([]);
  const [rep, setRep] = useState(3);
  const [seed, setSeed] = useState(42);
  const [exclusion, setExclusion] = useState("");
  // session
  const [pre, setPre] = useState<Outcome>(blank());
  const [post, setPost] = useState<Outcome>(blank());
  const [phase, setPhase] = useState<"pre" | "listen" | "post">("pre");
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState(0);

  const load = async () => {
    const st = (await studies.all()).sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
    setStudy(st);
    setAllTrials(st ? (await trialRepo.all()).filter((x) => x.studyId === st.id).sort((a, b) => a.orderIndex - b.orderIndex) : []);
    setProtocols(await stimuli.all());
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => audio.subscribe(() => setProgress(audio.progress)), []);

  const draft: Partial<Study> = { primaryOutcome: primary, conditions: [...chosen.map((id, i) => ({ conditionId: String(i + 1), label: "", stimulusId: id, kind: "stimulus" as const })), { conditionId: "CTRL", label: "", stimulusId: null, kind: "silence_control" as const }], exclusionRule: exclusion, correction: "bonferroni", frozenAt: null };
  const checks = prereg(draft);
  const ready = Object.entries(checks).filter(([k]) => k !== "analysis_code_frozen_before_unblinding").every(([, v]) => v);

  // Güç analizi: tasarım dondurulmadan ÖNCE hesaplanır — yetersiz güç kullanıcıya gösterilir.
  const trialMinutes = useMemo(() => {
    const picked = protocols.filter((p) => chosen.includes(p.id));
    if (!picked.length) return 10;
    return Math.round(picked.reduce((s, p) => s + totalSeconds(p), 0) / picked.length / 60) || 10;
  }, [protocols, chosen]);
  const design = useMemo(
    () => (chosen.length ? evaluateDesign(chosen.length + 1, rep, trialMinutes) : null),
    [chosen.length, rep, trialMinutes],
  );
  const suggested = useMemo(() => (chosen.length ? requiredN(0.8, chosen.length) : null), [chosen.length]);

  const freeze = async () => {
    const conds: Condition[] = draft.conditions!;
    const rng = mulberry(seed ^ 0x5eed);
    const letters = shuffle(conds.map((_, i) => String.fromCharCode(65 + i)), rng);
    const st: Study = { id: uid("STD"), primaryOutcome: primary, conditions: conds.map((c, i) => ({ ...c, label: letters[i] })), repetitions: rep, seed, exclusionRule: exclusion, correction: "bonferroni", frozenAt: Date.now(), unblindedAt: null, set: "discovery", createdAt: Date.now(),
      design: design ? { detectableD: design.detectableD, powerAtTarget: design.powerAtTarget, totalTrials: design.totalTrials } : null };
    await studies.put(st);
    await Promise.all(makeTrials(st).map((x) => trialRepo.put(x)));
    await load();
    setTab("session");
  };

  const current = allTrials.find((x) => !x.post);
  const cond = current && study ? study.conditions.find((c) => c.conditionId === current.conditionId) : undefined;
  const stimFor = (c: Condition | undefined): Stimulus | null => {
    if (!c) return null;
    if (c.kind === "silence_control") return buildStimulus([0], [10], { name: "silence" });
    return protocols.find((p) => p.id === c.stimulusId) ?? null;
  };
  const listen = () => {
    const s = stimFor(cond);
    if (!s) return;
    setPhase("listen");
    audio.playStimulus(s, undefined, () => setPhase("post"));
  };
  const saveTrial = async () => {
    if (!current) return;
    await trialRepo.put({ ...current, pre, post, notes, startedAt: current.startedAt ?? Date.now(), endedAt: Date.now() });
    setPre(blank()); setPost(blank()); setNotes(""); setPhase("pre");
    await load();
  };
  const unblind = async () => { if (study) { await studies.put({ ...study, unblindedAt: Date.now() }); await load(); } };

  const results = useMemo(() => {
    if (!study) return null;
    const done = allTrials.filter((x) => x.pre && x.post);
    if (!done.some((x) => x.conditionId === "CTRL")) return null;
    return analyzeStudy(done, study.primaryOutcome, "CTRL");
  }, [study, allTrials]);
  const order = useMemo(() => {
    if (!study) return null;
    const done = allTrials.filter((x) => x.pre && x.post);
    return spearman(done.map((x) => x.orderIndex), done.map((x) => x.post![study.primaryOutcome] - x.pre![study.primaryOutcome]));
  }, [study, allTrials]);
  const labelOf = (cid: string) => study?.conditions.find((c) => c.conditionId === cid)?.label ?? cid;
  const hzOf = (cid: string) => { const s = stimFor(study?.conditions.find((c) => c.conditionId === cid)); return s ? s.steps.map((x) => x.hz || "0").join("→") : "—"; };

  return (
    <div>
      <h1>{t("experiment.title")}</h1>
      <div className="subtabs">
        {(["setup", "session", "results"] as const).map((k) => <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{t(`experiment.${k}`)}</button>)}
      </div>

      {tab === "setup" && (
        <div className="card">
          <div className="field"><label>{t("experiment.primary")}</label>
            <select value={primary} onChange={(e) => setPrimary(e.target.value as OutcomeKey)}>{OUTCOME_KEYS.map((k) => <option key={k} value={k}>{t(`experiment.outcomes.${k}`)}</option>)}</select></div>
          <div className="field"><label>{t("experiment.conditions")} ({t("experiment.control")} +)</label>
            {protocols.length === 0 && <div className="muted">{t("common.empty")}</div>}
            <div className="chips">{protocols.map((p) => <button key={p.id} className={`chip ${chosen.includes(p.id) ? "active" : ""}`} onClick={() => setChosen(chosen.includes(p.id) ? chosen.filter((x) => x !== p.id) : [...chosen, p.id])}>{p.name || p.id}</button>)}</div></div>
          <div className="grid2">
            <div><label>{t("experiment.repetitions")}</label><input type="number" min={1} value={rep} onChange={(e) => setRep(Math.max(1, Number(e.target.value)))} /></div>
            <div><label>{t("common.seed")}</label><input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} /></div>
          </div>
          <div className="field"><label>{t("experiment.exclusion")}</label><input value={exclusion} onChange={(e) => setExclusion(e.target.value)} /></div>
          <div className="field"><label>{t("experiment.correction")}</label><input value="bonferroni" readOnly /></div>

          {design && (
            <>
              <h3>{t("experiment.powerTitle")}</h3>
              <div className="kv"><span>{t("experiment.totalTrials")}</span><span>{design.totalTrials}</span></div>
              <div className="kv"><span>{t("experiment.totalHours")}</span><span>{design.totalHours}</span></div>
              <div className="kv"><span>{t("experiment.detectableD")}</span><span>{design.detectableD === null ? "> 4.0" : fmt(design.detectableD, 1)}</span></div>
              <div className="kv"><span>{t("experiment.power")} (d=0.8)</span>
                <span style={{ color: design.adequate ? "var(--ok)" : "var(--warn)" }}>{Math.round(design.powerAtTarget * 100)}%</span></div>
              {!design.adequate && (
                <>
                  <Warn k="experiment.underpowered" />
                  {suggested && <div className="kv"><span>{t("experiment.suggestN")}</span><span>{suggested}</span></div>}
                </>
              )}
            </>
          )}

          <h3>{t("experiment.prereg")}</h3>
          {Object.entries(checks).map(([k, v]) => <div key={k} className="kv"><span>{t(`experiment.prereg_items.${k}`)}</span><span style={{ color: v ? "var(--ok)" : "var(--warn)" }}>{v ? "✓" : "○"}</span></div>)}
          <button className="btn primary" disabled={!ready} onClick={freeze} style={{ marginTop: 10 }}>{t("experiment.freeze")}</button>
          <Warn k="warnings.blind" />
        </div>
      )}

      {tab === "session" && (
        <div className="card">
          {!study && <div className="muted">{t("experiment.noStudy")}</div>}
          {study && !current && <div className="muted">{t("experiment.allDone")}</div>}
          {study && current && cond && (
            <>
              <div className="row between"><div>{t("experiment.trial")} {current.orderIndex + 1} {t("experiment.of")} {allTrials.length}</div><div className="hz" style={{ fontSize: 28 }}>{t("experiment.condition")} {cond.label}</div></div>
              <div className="muted">{t("common.hz")}: {t("experiment.hiddenHz")}</div>
              {phase === "pre" && (<>
                <h3>{t("experiment.pre")}</h3>
                {OUTCOME_KEYS.map((k) => <Rating key={k} label={t(`experiment.outcomes.${k}`)} value={pre[k]} onChange={(v) => setPre({ ...pre, [k]: v })} />)}
                <button className="btn primary" onClick={listen} style={{ marginTop: 8 }}>▶ {t("experiment.listen")}</button>
              </>)}
              {phase === "listen" && (<>
                <div className="center" style={{ padding: 20 }}>{t("experiment.listening")}</div>
                <div className="progress"><div style={{ width: `${progress * 100}%` }} /></div>
                <button className="btn" onClick={() => { audio.panic(); setPhase("post"); }}>{t("common.next")}</button>
              </>)}
              {phase === "post" && (<>
                <h3>{t("experiment.post")}</h3>
                {OUTCOME_KEYS.map((k) => <Rating key={k} label={t(`experiment.outcomes.${k}`)} value={post[k]} onChange={(v) => setPost({ ...post, [k]: v })} />)}
                <div className="field"><label>{t("experiment.notes")}</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
                <button className="btn primary" onClick={saveTrial}>{t("experiment.saveTrial")}</button>
              </>)}
            </>
          )}
        </div>
      )}

      {tab === "results" && (
        <div className="card">
          {!study && <div className="muted">{t("experiment.noStudy")}</div>}
          {study && !results && <div className="muted">{t("common.empty")}</div>}
          {study && results && (<>
            <table><thead><tr><th>{t("experiment.condition")}</th><th>{t("experiment.n")}</th><th>{t("experiment.meanChange")}</th><th>{t("experiment.ci")}</th><th>{t("experiment.d")}</th><th>{t("experiment.pAdj")}</th></tr></thead>
              <tbody>{results.conditions.map((r) => (
                <tr key={r.conditionId}><td>{labelOf(r.conditionId)}{study.unblindedAt ? ` (${hzOf(r.conditionId)})` : ""}</td><td>{r.n}</td><td>{fmt(r.meanChange)}</td><td>{r.ci95 ? `${fmt(r.ci95[0], 1)}…${fmt(r.ci95[1], 1)}` : "—"}</td><td>{fmt(r.cohenD)}</td><td>{fmt(r.pAdjusted, 3)}</td></tr>
              ))}</tbody></table>
            {results.conditions.filter((r) => !r.isControl).map((r) => <div key={r.conditionId} className="kv"><span>{labelOf(r.conditionId)} · {t("experiment.grade")}</span><span>{t(`experiment.grades.${evidenceGrade(r)}`)}</span></div>)}
            <div className="kv"><span>{t("experiment.orderEffect")}</span><span>{fmt(order)}</span></div>
            {study.design && (
              <>
                <div className="kv"><span>{t("experiment.detectableD")}</span><span>{study.design.detectableD === null ? "> 4.0" : fmt(study.design.detectableD, 1)}</span></div>
                <div className="kv"><span>{t("experiment.power")} (d=0.8)</span>
                  <span style={{ color: study.design.powerAtTarget >= 0.8 ? "var(--ok)" : "var(--warn)" }}>{Math.round(study.design.powerAtTarget * 100)}%</span></div>
                {study.design.powerAtTarget < 0.8 && <Warn k="experiment.underpowered" />}
              </>
            )}
            <Warn k="warnings.multiple" values={{ k: results.comparisons }} />
            {!study.unblindedAt && !current && <button className="btn" onClick={unblind} style={{ marginTop: 8 }}>{t("experiment.unblind")}</button>}
          </>)}
          {study && <button className="btn small" style={{ marginTop: 10 }} onClick={async () => { await Promise.all(allTrials.map((x) => trialRepo.remove(x.id))); await studies.remove(study.id); await load(); setTab("setup"); }}>{t("experiment.newStudy")}</button>}
        </div>
      )}
    </div>
  );
};
