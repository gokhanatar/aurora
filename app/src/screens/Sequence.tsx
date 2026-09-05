import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { audio } from "../audio/engine";
import { intervalProfile } from "../core/matching";
import { buildStimulus, protocolSet, totalSeconds } from "../core/sequence";
import { stimuli } from "../data/repo";
import type { Stimulus, WaveformKind } from "../data/types";
import { Warn, fmt } from "../components/Common";

interface Row { hz: string; min: string }
const WAVES: WaveformKind[] = ["sine", "triangle", "square", "sawtooth"];

export const Sequence = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([{ hz: "432", min: "5" }, { hz: "528", min: "8" }, { hz: "639", min: "13" }]);
  const [gap, setGap] = useState(0.5);
  const [rep, setRep] = useState(1);
  const [wave, setWave] = useState<WaveformKind>("sine");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<Stimulus[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => audio.subscribe(() => { setProgress(audio.progress); if (!audio.playing) setPlaying(null); }), []);
  useEffect(() => { void stimuli.all().then(setSaved); }, []);

  const freqs = rows.map((r) => Number(r.hz.replace(",", ".")) || 0);
  const mins = rows.map((r) => Number(r.min.replace(",", ".")) || 0);
  const valid = rows.length > 0 && mins.every((m) => m > 0);
  const stim = valid ? buildStimulus(freqs, mins, { gapS: gap, repetitions: rep, waveform: wave, name }) : null;

  const apply = (s: Stimulus) => { setRows(s.steps.map((x) => ({ hz: String(x.hz), min: String(x.durationS / 60) }))); setGap(s.gapS); setRep(s.repetitions); setWave(s.waveform); };
  const tpl = (key: keyof ReturnType<typeof protocolSet>) => apply(protocolSet([432, 528, 639])[key]);
  const save = async () => { if (stim) { await stimuli.put(stim); setSaved(await stimuli.all()); } };
  const play = (s: Stimulus) => {
    if (playing === s.id) { audio.stop(); setPlaying(null); return; }
    setPlaying(s.id);
    audio.playStimulus(s, undefined, () => setPlaying(null));
  };
  const stopAll = () => { audio.panic(); setPlaying(null); };
  const del = async (id: string) => { await stimuli.remove(id); setSaved(await stimuli.all()); };

  return (
    <div>
      <h1>{t("sequence.title")}</h1>
      <div className="card">
        <h3>{t("sequence.templates")}</h3>
        <div className="chips">
          <button className="chip" onClick={() => tpl("A_forward")}>{t("sequence.tplForward")}</button>
          <button className="chip" onClick={() => tpl("B_reversed")}>{t("sequence.tplReverse")}</button>
          <button className="chip" onClick={() => tpl("C_single")}>{t("sequence.tplSingle")}</button>
          <button className="chip" onClick={() => tpl("D_random")}>{t("sequence.tplRandom")}</button>
          <button className="chip" onClick={() => tpl("E_silence")}>{t("sequence.tplSilence")}</button>
        </div>
      </div>
      <div className="card">
        <h3>{t("sequence.steps")}</h3>
        {rows.map((r, i) => (
          <div key={i} className="row" style={{ marginBottom: 6 }}>
            <span className="muted" style={{ width: 20 }}>{i + 1}</span>
            <input value={r.hz} inputMode="decimal" placeholder={t("common.hz")} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, hz: e.target.value } : x)))} style={{ flex: 2 }} />
            <input value={r.min} inputMode="decimal" placeholder={t("common.minutes")} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, min: e.target.value } : x)))} style={{ flex: 1 }} />
            <button className="btn small danger" onClick={() => setRows(rows.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <button className="btn small" onClick={() => setRows([...rows, { hz: "0", min: "1" }])}>+ {t("sequence.addStep")}</button>
        <div className="grid3" style={{ marginTop: 8 }}>
          <div><label>{t("sequence.gap")}</label><input type="number" step={0.1} value={gap} onChange={(e) => setGap(Number(e.target.value))} /></div>
          <div><label>{t("sequence.repetitions")}</label><input type="number" min={1} value={rep} onChange={(e) => setRep(Math.max(1, Number(e.target.value)))} /></div>
          <div><label>{t("common.waveform")}</label><select value={wave} onChange={(e) => setWave(e.target.value as WaveformKind)}>{WAVES.map((w) => <option key={w} value={w}>{t(`common.waveforms.${w}`)}</option>)}</select></div>
        </div>
        {stim && (
          <>
            <div className="kv"><span>{t("sequence.total")}</span><span>{fmt(totalSeconds(stim) / 60, 1)} {t("common.minutes")}</span></div>
            <div className="kv"><span>{t("sequence.fingerprint")}</span><span>{stim.id}</span></div>
            <div className="kv"><span>{t("sequence.intervals")}</span><span>{intervalProfile(freqs).map((c) => fmt(c, 0)).join(" · ") || "—"}</span></div>
            <div className="row" style={{ marginTop: 8 }}>
              <input placeholder={t("sequence.name")} value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1 }} />
              <button className="btn primary" onClick={save}>{t("common.save")}</button>
              <button className="btn" onClick={() => play(stim)}>{playing === stim.id ? "■" : "▶"}</button>
              {playing && <button className="btn small danger" onClick={stopAll}>{t("home.panic")}</button>}
            </div>
          </>
        )}
        <Warn k="warnings.safety" />
      </div>
      <div className="card">
        <h3>{t("sequence.saved")}</h3>
        {saved.length === 0 && <div className="muted">{t("common.empty")}</div>}
        {saved.map((s) => (
          <div key={s.id} className="list-item">
            <div onClick={() => apply(s)} style={{ flex: 1 }}>
              <div>{s.name || s.id}</div>
              <div className="muted mono">{s.steps.map((x) => (x.hz ? `${x.hz}` : t("sequence.silence"))).join(" → ")} · {s.steps.map((x) => x.durationS / 60).join("-")} {t("common.minutes")} · ×{s.repetitions}</div>
              {playing === s.id && <div className="progress"><div style={{ width: `${progress * 100}%` }} /></div>}
            </div>
            <button className="btn small" onClick={() => play(s)}>{playing === s.id ? "■" : "▶"}</button>
            <button className="btn small danger" onClick={() => del(s.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
};
