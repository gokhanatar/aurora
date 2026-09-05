import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_PLATE, dominantMode, fingerprint, grayToMask, resonanceMap, resonanceProximity, resonances, similarity, simulatePlate, type BoundaryCondition, type Plate } from "../core/chladni";
import { anomalies, evolve, scan } from "../core/discovery";
import { candidates, patterns, uid } from "../data/repo";
import type { PatternFingerprint, PatternRecord } from "../data/types";
import { Badge, KV, LabelInfo, Note, Warn, fmt } from "../components/Common";
import { ChladniCanvas, Scatter } from "../components/Viz";

const SIZE = 96;

export const Lab = ({ hz }: { hz: number }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"chladni" | "resonance" | "discovery">("chladni");
  return (
    <div>
      <h1>{t("lab.title")}</h1>
      <div className="subtabs">
        {(["chladni", "resonance", "discovery"] as const).map((k) => <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{t(`lab.${k}`)}</button>)}
      </div>
      {tab === "chladni" && <ChladniLab hz={hz} />}
      {tab === "resonance" && <Resonance />}
      {tab === "discovery" && <Discovery />}
    </div>
  );
};

const FP = ({ f }: { f: PatternFingerprint }) => {
  const { t } = useTranslation();
  return (<>
    <div className="kv"><span><LabelInfo text={t("lab.symmetry")} term="symmetry" /></span><span>{fmt(f.symmetry, 3)}</span></div>
    <KV k={t("lab.radial")} v={fmt(f.radialSymmetry, 3)} />
    <div className="kv"><span><LabelInfo text={t("lab.complexity")} term="complexity" /></span><span>{fmt(f.complexity, 3)}</span></div>
    <KV k={t("lab.density")} v={fmt(f.density, 3)} />
    <div className="kv"><span><LabelInfo text={t("lab.nodes")} term="node" /></span><span>{f.nodeCount}</span></div>
    <KV k={t("lab.angle")} v={`${f.dominantAngleDeg}°`} />
  </>);
};

const ChladniLab = ({ hz: initial }: { hz: number }) => {
  const { t } = useTranslation();
  const [hz, setHz] = useState(initial);
  const [mask, setMask] = useState<Uint8Array | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [plate, setPlate] = useState<Plate & { excitation: string }>({ ...DEFAULT_PLATE, excitation: "center" });
  const [saved, setSaved] = useState<PatternRecord[]>([]);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { void patterns.all().then((p) => setSaved(p.sort((a, b) => b.createdAt - a.createdAt))); }, []);

  // Desen levha parametrelerinden hesaplanır — frekans tek başına yeterli değildir.
  const simMask = useMemo(() => simulatePlate(hz, plate, SIZE), [hz, plate]);
  const simFp = useMemo(() => fingerprint(simMask, SIZE), [simMask]);
  const mode = useMemo(() => dominantMode(hz, plate), [hz, plate]);
  const proximity = useMemo(() => resonanceProximity(hz, plate), [hz, plate]);
  const plateResonances = useMemo(() => resonances(plate, 20, 4000).slice(0, 12), [plate]);
  const realFp = mask ? fingerprint(mask, SIZE) : null;

  const onFile = (f: File) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = SIZE; c.height = SIZE;
      const ctx = c.getContext("2d")!;
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, SIZE, SIZE);
      const d = ctx.getImageData(0, 0, SIZE, SIZE).data;
      const gray = new Uint8ClampedArray(SIZE * SIZE);
      for (let i = 0; i < SIZE * SIZE; i++) gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
      setMask(grayToMask(gray, SIZE));
      setThumb(c.toDataURL("image/jpeg", 0.6));
    };
    img.src = URL.createObjectURL(f);
  };
  const save = async () => {
    if (!realFp) return;
    await patterns.put({ id: uid("CHL"), hz, kind: "real", fingerprint: realFp, plate, thumbnail: thumb, createdAt: Date.now() });
    setSaved((await patterns.all()).sort((a, b) => b.createdAt - a.createdAt));
  };
  const sameHz = saved.filter((p) => Math.abs(p.hz - hz) < 0.5);
  const within = sameHz.length >= 2 ? sameHz.slice(1).reduce((s, p) => s + similarity(sameHz[0].fingerprint, p.fingerprint), 0) / (sameHz.length - 1) : null;

  return (<>
    <div className="card">
      <div className="field"><label>{t("home.frequency")}</label><input type="number" value={hz} onChange={(e) => setHz(Math.max(1, Number(e.target.value)))} /></div>
      <div className="grid2">
        <div><div className="row between"><span className="muted">{t("lab.chladni")}</span><Badge kind="simulation" /></div><ChladniCanvas hz={hz} size={SIZE} height={150} mask={simMask} /></div>
        <div><div className="row between"><span className="muted">{t("lab.pickImage")}</span><Badge kind="real" /></div>
          {mask ? <ChladniCanvas hz={hz} size={SIZE} height={150} mask={mask} /> : <div className="viz" style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}><button className="btn" onClick={() => file.current?.click()}>📷</button></div>}
          <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} /></div>
      </div>
      {mask && <button className="btn small" onClick={() => file.current?.click()} style={{ marginTop: 6 }}>{t("lab.pickImage")}</button>}
    </div>
    <div className="card">
      <h3>{t("lab.fingerprint")} — <Badge kind={realFp ? "real" : "simulation"} /></h3>
      <FP f={realFp ?? simFp} />
      {realFp && <KV k={t("lab.vsSim")} v={`${Math.round(similarity(realFp, simFp) * 100)}%`} />}
      {within !== null && <KV k={t("lab.withinFreq")} v={`${Math.round(within * 100)}%`} />}
      <Warn k="warnings.simulation" />
    </div>
    {/* Levha parametreleri — desen BUNLARDAN hesaplanır, frekanstan değil */}
    <div className="card">
      <h3><LabelInfo text={t("lab.plate")} term="plateEffect" /></h3>
      <Note>{t("lab.plateWarning")}</Note>
      <div className="grid2">
        <div><label><LabelInfo text={t("lab.material")} term="resonance" /></label>
          <select value={plate.material} onChange={(e) => setPlate({ ...plate, material: e.target.value })}>
            {["steel", "aluminum", "brass", "glass"].map((m) => <option key={m} value={m}>{t(`lab.materials.${m}`)}</option>)}
          </select></div>
        <div><label>{t("lab.boundary")}</label>
          <select value={plate.boundary} onChange={(e) => setPlate({ ...plate, boundary: e.target.value as BoundaryCondition })}>
            {(["free", "clamped", "simply_supported"] as BoundaryCondition[]).map((b) => <option key={b} value={b}>{t(`lab.boundaries.${b}`)}</option>)}
          </select></div>
        <div><label>{t("lab.size")}</label><input type="number" step={1} value={plate.sizeCm} onChange={(e) => setPlate({ ...plate, sizeCm: Math.max(1, Number(e.target.value)) })} /></div>
        <div><label>{t("lab.thickness")}</label><input type="number" step={0.1} value={plate.thicknessMm} onChange={(e) => setPlate({ ...plate, thicknessMm: Math.max(0.1, Number(e.target.value)) })} /></div>
      </div>
      <h3 style={{ marginTop: 10 }}><LabelInfo text={t("lab.physics")} term="mode" /></h3>
      <KV k={t("home.mode")} v={mode ? `(${mode.m}, ${mode.n})` : "—"} />
      <KV k={t("lab.resonanceNear")} v={mode ? `${fmt(mode.hz, 1)} ${t("common.hz")}` : "—"} />
      <div className="kv">
        <span><LabelInfo text={t("lab.proximity")} term="resonance" /></span>
        <span style={{ color: proximity > 0.5 ? "var(--ok)" : "var(--warn)" }}>{Math.round(proximity * 100)}%</span>
      </div>
      {proximity < 0.3 && <Warn k="lab.offResonance" />}
      <h3 style={{ marginTop: 10 }}>{t("lab.resonanceList")}</h3>
      <div className="chips">
        {plateResonances.map((r) => (
          <button key={`${r.m}-${r.n}`} className={`chip ${Math.abs(r.hz - hz) < 1 ? "active" : ""}`} onClick={() => setHz(Math.round(r.hz * 10) / 10)}>
            {r.hz.toFixed(0)} <span className="muted">({r.m},{r.n})</span>
          </button>
        ))}
      </div>
      {realFp && <button className="btn primary" onClick={save} style={{ marginTop: 10 }}>{t("common.save")}</button>}
    </div>
    <div className="card">
      <h3>{t("lab.patterns")}</h3>
      {saved.length === 0 && <div className="muted">{t("common.empty")}</div>}
      {saved.map((p) => (
        <div key={p.id} className="list-item">
          {p.thumbnail && <img src={p.thumbnail} width={44} height={44} style={{ borderRadius: 8 }} />}
          <div style={{ flex: 1 }}><div className="mono">{p.hz} {t("common.hz")} <Badge kind={p.kind} /></div><div className="muted">{p.plate.sizeCm}cm · {p.plate.thicknessMm}mm · {t(`lab.materials.${p.plate.material}`)} · sym {fmt(p.fingerprint.symmetry)} · cx {fmt(p.fingerprint.complexity)}</div></div>
          {realFp && <span className="mono">{Math.round(similarity(realFp, p.fingerprint) * 100)}%</span>}
          <button className="btn small danger" onClick={async () => { await patterns.remove(p.id); setSaved(saved.filter((x) => x.id !== p.id)); }}>×</button>
        </div>
      ))}
    </div>
  </>);
};

const Resonance = () => {
  const { t } = useTranslation();
  const [lo, setLo] = useState(100), [hi, setHi] = useState(1000), [step, setStep] = useState(10);
  const [plate, setPlate] = useState<Plate>(DEFAULT_PLATE);
  const [rows, setRows] = useState<ReturnType<typeof resonanceMap>>([]);
  const [saved, setSaved] = useState<PatternRecord[]>([]);
  useEffect(() => { void patterns.all().then(setSaved); }, []);
  const modal = useMemo(() => resonances(plate, lo, hi), [plate, lo, hi]);
  return (
    <div className="card">
      <Note>{t("lab.plateWarning")}</Note>
      <div className="grid2">
        <div><label>{t("lab.material")}</label>
          <select value={plate.material} onChange={(e) => setPlate({ ...plate, material: e.target.value })}>
            {["steel", "aluminum", "brass", "glass"].map((m) => <option key={m} value={m}>{t(`lab.materials.${m}`)}</option>)}
          </select></div>
        <div><label>{t("lab.boundary")}</label>
          <select value={plate.boundary} onChange={(e) => setPlate({ ...plate, boundary: e.target.value as BoundaryCondition })}>
            {(["free", "clamped", "simply_supported"] as BoundaryCondition[]).map((b) => <option key={b} value={b}>{t(`lab.boundaries.${b}`)}</option>)}
          </select></div>
        <div><label>{t("lab.size")}</label><input type="number" value={plate.sizeCm} onChange={(e) => setPlate({ ...plate, sizeCm: Math.max(1, Number(e.target.value)) })} /></div>
        <div><label>{t("lab.thickness")}</label><input type="number" step={0.1} value={plate.thicknessMm} onChange={(e) => setPlate({ ...plate, thicknessMm: Math.max(0.1, Number(e.target.value)) })} /></div>
      </div>
      <div className="grid3" style={{ marginTop: 8 }}>
        <div><label>{t("lab.lo")}</label><input type="number" value={lo} onChange={(e) => setLo(Number(e.target.value))} /></div>
        <div><label>{t("lab.hi")}</label><input type="number" value={hi} onChange={(e) => setHi(Number(e.target.value))} /></div>
        <div><label>{t("lab.step")}</label><input type="number" value={step} onChange={(e) => setStep(Math.max(1, Number(e.target.value)))} /></div>
      </div>
      <button className="btn primary" onClick={() => setRows(resonanceMap(lo, hi, step, plate))} style={{ margin: "8px 0" }}>{t("lab.scan")}</button>
      <div className="row between"><span className="muted">{t("lab.resonance")}</span><Badge kind="simulation" /></div>
      <Scatter
        points={[...rows.map((r) => ({ x: r.hz, y: r.complexity })), ...saved.map((p) => ({ x: p.hz, y: p.fingerprint.complexity, hl: true }))]}
        xLabel={t("common.hz")} yLabel={t("lab.complexity")} line />
      <h3>{t("lab.resonanceList")}</h3>
      <div className="chips">
        {modal.slice(0, 16).map((r) => <span key={`${r.m}-${r.n}`} className="chip mono">{r.hz.toFixed(0)} ({r.m},{r.n})</span>)}
      </div>
      <Warn k="warnings.simulation" />
    </div>
  );
};

const Discovery = () => {
  const { t } = useTranslation();
  const [seedPop, setSeedPop] = useState("432, 528, 639, 741, 852, 963");
  const [gens, setGens] = useState(3);
  const [out, setOut] = useState<number[]>([]);
  const [anom, setAnom] = useState<Array<{ hz: number; distance: number }>>([]);
  const [lo, setLo] = useState(100), [hi, setHi] = useState(1000);
  const [scanned, setScanned] = useState<Array<{ hz: number; score: number }>>([]);
  const parse = () => seedPop.split(/[,\s]+/).map(Number).filter((x) => x > 0);
  const add = async (hz: number) => { await candidates.put({ id: uid("DSC"), hz, origin: "discovery", evidenceLevel: "speculative", status: "candidate", formula: "evolve/scan", sourceIds: [], createdAt: Date.now() }); };
  return (<>
    <div className="card">
      <h3>{t("lab.evolve")}</h3>
      <div className="field"><label>{t("lab.seedPop")}</label><input value={seedPop} onChange={(e) => setSeedPop(e.target.value)} /></div>
      <div className="row"><div style={{ flex: 1 }}><label>{t("lab.generations")}</label><input type="number" min={1} max={10} value={gens} onChange={(e) => setGens(Number(e.target.value))} /></div>
        <button className="btn primary" onClick={() => { const h = evolve(parse(), null, gens); setOut(h[h.length - 1].population); setAnom(anomalies(h[h.length - 1].population, 1.5)); }}>{t("lab.evolve")}</button></div>
      {out.length > 0 && <div className="chips" style={{ marginTop: 8 }}>{out.map((f) => <button key={f} className={`chip ${anom.some((a) => a.hz === f) ? "active" : ""}`} onClick={() => add(f)}>{f.toFixed(2)}</button>)}</div>}
      {anom.length > 0 && <div className="muted" style={{ marginTop: 6 }}>{t("lab.anomaly")}: {anom.map((a) => a.hz.toFixed(2)).join(", ")}</div>}
      <div className="muted" style={{ marginTop: 6 }}>{t("lab.toLibrary")} → tap</div>
      <Warn k="warnings.exploratory" />
    </div>
    <div className="card">
      <h3>{t("lab.scan")}</h3>
      <div className="grid2"><div><label>{t("lab.lo")}</label><input type="number" value={lo} onChange={(e) => setLo(Number(e.target.value))} /></div><div><label>{t("lab.hi")}</label><input type="number" value={hi} onChange={(e) => setHi(Number(e.target.value))} /></div></div>
      <button className="btn" onClick={() => setScanned(scan(lo, hi, 25, 20))} style={{ marginTop: 8 }}>{t("lab.scan")}</button>
      {scanned.length > 0 && <table style={{ marginTop: 8 }}><thead><tr><th>{t("common.hz")}</th><th>{t("home.math")}</th></tr></thead><tbody>{scanned.map((r) => <tr key={r.hz} onClick={() => add(r.hz)}><td className="mono">{r.hz}</td><td>{r.score}</td></tr>)}</tbody></table>}
    </div>
  </>);
};
