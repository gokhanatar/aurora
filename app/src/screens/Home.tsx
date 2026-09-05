import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { audio } from "../audio/engine";
import { SPECTRUM_HI, SPECTRUM_LO, analyzeFrequency, bandOf, isRenderable } from "../core/math";
import { scoreFrequency } from "../core/scoring";
import { RANGE_PRESETS, randomFrequencies } from "../core/random";
import { NUMBERS } from "../data/corpus";
import { candidates, uid } from "../data/repo";
import type { WaveformKind } from "../data/types";
import { Badge, DnaBars, LabelInfo, Note, Warn } from "../components/Common";
import { ChladniCanvas, SpectrumCanvas, WaveformCanvas } from "../components/Viz";

const PRESETS = [174, 285, 396, 417, 432, 528, 639, 741, 852, 963];
const WAVES: WaveformKind[] = ["sine", "triangle", "square", "sawtooth"];

/** Listedeki bir frekans satırı. Metin olarak tutulur ki yazarken serbestçe düzenlenebilsin. */
interface Row {
  id: string;
  text: string;
  on: boolean;
}

const newRow = (hz: number | string): Row => ({ id: uid("F"), text: String(hz), on: true });
const parseHz = (t: string): number => {
  const v = Number(t.replace(",", "."));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

const BandTag = ({ hz }: { hz: number }) => {
  const { t } = useTranslation();
  const band = bandOf(hz);
  const renderable = isRenderable(hz, audio.sampleRate);
  if (band.audible && renderable) return null;
  return <span className="band-tag inaudible">{!band.audible ? t(`home.bands.${band.id}`) : t("home.notRenderable")}</span>;
};

export const Home = ({ hz, setHz, onAnalyze }: { hz: number; setHz: (v: number) => void; onAnalyze: () => void }) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([newRow(hz || 528)]);
  const [wave, setWave] = useState<WaveformKind>("sine");
  const [amp, setAmp] = useState(0.15);
  const [playing, setPlaying] = useState(audio.playing);
  /** Analiz ve görsellerin gösterdiği satır (varsayılan: ilk açık satır). */
  const [focusId, setFocusId] = useState<string | null>(null);
  // Rastgele üretici
  const [rndOpen, setRndOpen] = useState(false);
  const [rndCount, setRndCount] = useState(3);
  const [rndLo, setRndLo] = useState(100);
  const [rndHi, setRndHi] = useState(1000);
  const [lastRoll, setLastRoll] = useState<number[] | null>(null);

  useEffect(() => audio.subscribe(() => setPlaying(audio.playing)), []);

  const active = useMemo(
    () => rows.filter((r) => r.on && parseHz(r.text) > 0).map((r) => ({ ...r, hz: parseHz(r.text) })),
    [rows],
  );
  const focus = active.find((r) => r.id === focusId) ?? active[0] ?? null;
  const focusHz = focus?.hz ?? 0;

  /** Çalarken liste değişirse ses anında güncellenir — durdurup başlatmak gerekmez. */
  useEffect(() => {
    if (playing) audio.setLayers(active.map((r) => ({ id: r.id, hz: r.hz, waveform: wave, level: 1, muted: false })));
  }, [active, wave, playing]);

  /** Seçili frekansı Analiz ekranıyla paylaş. */
  useEffect(() => {
    if (focusHz > 0 && focusHz !== hz) setHz(focusHz);
  }, [focusHz]);

  const a = focusHz > 0 ? analyzeFrequency(focusHz) : null;
  const s = focusHz > 0 ? scoreFrequency(focusHz, NUMBERS) : null;
  const band = focusHz > 0 ? bandOf(focusHz) : null;

  const play = () => {
    if (playing) {
      audio.panic();
      return;
    }
    if (!active.length) return;
    audio.setAmplitude(amp);
    audio.setLayers(active.map((r) => ({ id: r.id, hz: r.hz, waveform: wave, level: 1, muted: false })));
    audio.start();
  };

  const setText = (id: string, text: string) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, text } : r)));
  const toggleRow = (id: string) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, on: !r.on } : r)));
  const remove = (id: string) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  const add = () => setRows((rs) => [...rs, newRow("")]);

  /** Hazır frekans çipi: listede yoksa ekler, varsa çıkarır. */
  const togglePreset = (p: number) =>
    setRows((rs) => {
      const hit = rs.find((r) => parseHz(r.text) === p);
      if (hit) return rs.length > 1 ? rs.filter((r) => r.id !== hit.id) : rs;
      const cleaned = rs.filter((r) => r.text.trim() !== "");
      return [...cleaned, newRow(p)];
    });

  const roll = (mode: "replace" | "append") => {
    const gen = randomFrequencies(rndCount, rndLo, rndHi);
    setLastRoll(gen);
    const made = gen.map((f) => newRow(f));
    setRows((rs) => (mode === "replace" ? made : [...rs.filter((r) => r.text.trim() !== ""), ...made]));
    setFocusId(made[0]?.id ?? null);
  };

  const addLibrary = () =>
    focusHz > 0 &&
    candidates.put({ id: uid("USR"), hz: focusHz, origin: "user", evidenceLevel: "speculative", status: "candidate", sourceIds: [], createdAt: Date.now() });

  return (
    <div>
      {/* ---------- FREKANS LİSTESİ ---------- */}
      <div className="card accent">
        <div className="row between">
          <h3 style={{ margin: 0 }}>{t("home.frequencies")}</h3>
          <span className="muted">{t("home.activeCount", { count: active.length })}</span>
        </div>
        <Note>{t("home.simpleHint")}</Note>

        {rows.map((r) => {
          const v = parseHz(r.text);
          return (
            <div key={r.id} className={`freq-row ${r.on ? "" : "off"} ${focus?.id === r.id ? "focus" : ""}`}>
              <button className="chk" onClick={() => toggleRow(r.id)} aria-label={t("home.enable")}>{r.on ? "●" : "○"}</button>
              <input
                className="mono freq-input"
                value={r.text}
                inputMode="decimal"
                placeholder={t("home.typeHz")}
                onChange={(e) => setText(r.id, e.target.value)}
                onFocus={() => setFocusId(r.id)}
              />
              <span className="unit">{t("common.hz")}</span>
              {v > 0 && <BandTag hz={v} />}
              <button className="btn small danger" onClick={() => remove(r.id)} disabled={rows.length === 1}>×</button>
            </div>
          );
        })}

        <button className="btn small" onClick={add} style={{ marginTop: 8 }}>+ {t("home.addFrequency")}</button>

        <div className="chips" style={{ marginTop: 10 }}>
          {PRESETS.map((p) => (
            <button key={p} className={`chip ${rows.some((r) => parseHz(r.text) === p) ? "active" : ""}`} onClick={() => togglePreset(p)}>{p}</button>
          ))}
        </div>

        <button className="btn small" onClick={() => setRndOpen((v) => !v)} style={{ marginTop: 10 }}>
          🎲 {t("home.random")}
        </button>
        {rndOpen && (
          <div className="random-box">
            <Note>{t("home.randomHint")}</Note>
            <div className="grid3">
              <div><label>{t("home.howMany")}</label><input type="number" min={1} max={16} value={rndCount} onChange={(e) => setRndCount(Math.max(1, Math.min(16, Number(e.target.value))))} /></div>
              <div><label>{t("home.rangeLo")}</label><input type="number" value={rndLo} onChange={(e) => setRndLo(Number(e.target.value))} /></div>
              <div><label>{t("home.rangeHi")}</label><input type="number" value={rndHi} onChange={(e) => setRndHi(Number(e.target.value))} /></div>
            </div>
            <label style={{ marginTop: 6 }}>{t("home.quickRanges")}</label>
            <div className="chips">
              {RANGE_PRESETS.map((p) => (
                <button key={p.id} className={`chip ${rndLo === p.lo && rndHi === p.hi ? "active" : ""}`} onClick={() => { setRndLo(p.lo); setRndHi(p.hi); }}>
                  {t(`home.${p.id}`)}
                </button>
              ))}
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn primary small" onClick={() => roll("replace")}>🎲 {t("home.replaceList")}</button>
              <button className="btn small" onClick={() => roll("append")}>+ {t("home.appendList")}</button>
            </div>
            {lastRoll && <div className="kv"><span>{t("home.lastRoll")}</span><span>{lastRoll.map((f) => f.toFixed(3)).join(" · ")}</span></div>}
            <div className="muted" style={{ marginTop: 4, fontSize: 11 }}>{t("home.seedNote")}</div>
          </div>
        )}

        <button className={`btn ${playing ? "danger" : "primary"} play-btn`} onClick={play} disabled={!active.length}>
          {playing ? `■ ${t("common.stop")}` : `▶ ${t("home.playAll", { count: active.length })}`}
        </button>

        <div className="row" style={{ marginTop: 10 }}>
          <div>
            <label><LabelInfo text={t("common.waveform")} term="waveform" /></label>
            <select value={wave} onChange={(e) => setWave(e.target.value as WaveformKind)} style={{ width: "auto" }}>
              {WAVES.map((w) => <option key={w} value={w}>{t(`common.waveforms.${w}`)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label><LabelInfo text={`${t("common.amplitude")} ${amp.toFixed(2)}`} term="amplitude" /></label>
            <input type="range" min={0.02} max={0.2} step={0.01} value={amp}
              onChange={(e) => { const v = Number(e.target.value); setAmp(v); audio.setAmplitude(v); }} />
          </div>
        </div>

        {band && !band.audible && <Warn k="warnings.inaudibleBand" />}
        {focusHz > 0 && !isRenderable(focusHz, audio.sampleRate) && <Warn k="warnings.notRenderableHint" />}
        <Warn k="warnings.safety" />
      </div>

      {/* ---------- İNCE AYAR ---------- */}
      {focus && (
        <div className="card">
          <div className="row between">
            <h3 style={{ margin: 0 }}>{t("home.tuning")}</h3>
            <span className="mono" style={{ color: "var(--accent)" }}>{focusHz.toFixed(2)} {t("common.hz")}</span>
          </div>
          <input
            type="range"
            min={Math.log2(SPECTRUM_LO)}
            max={Math.log2(SPECTRUM_HI)}
            step={0.001}
            value={Math.log2(Math.max(SPECTRUM_LO, focusHz))}
            onChange={(e) => setText(focus.id, String(Math.round(2 ** Number(e.target.value) * 100) / 100))}
          />
          <div className="row between muted" style={{ fontSize: 11 }}>
            <span>0.1 Hz</span>
            <span>{t(`home.bands.${bandOf(focusHz).id}`)}</span>
            <span>96 kHz</span>
          </div>
        </div>
      )}

      {/* ---------- ANALİZ ---------- */}
      {a && s && (
        <div className="card">
          <div className="row between">
            <h3 style={{ margin: 0 }}>{t("home.dna")}</h3>
            <span className="muted mono">{focusHz.toFixed(2)} {t("common.hz")} · {a.note440}</span>
          </div>
          <DnaBars rows={[
            { label: t("home.math"), value: s.math, max: 40 },
            { label: t("home.historical"), value: s.historical, max: 40 },
            { label: t("home.experimental"), value: s.experimental, max: 100 },
            { label: t("home.replication"), value: s.replication, max: 100 },
          ]} />
          <Warn k="warnings.exploratory" />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={onAnalyze}>{t("home.analyze")}</button>
            <button className="btn" onClick={addLibrary}>{t("home.addLibrary")}</button>
          </div>
        </div>
      )}

      {/* ---------- GÖRSELLEŞTİRME ---------- */}
      <div className="card">
        <h3><LabelInfo text={t("home.waveform")} term="waveform" /></h3>
        <WaveformCanvas hz={focusHz} />
        <h3><LabelInfo text={t("home.spectrum")} term="spectrum" /></h3>
        <SpectrumCanvas hz={focusHz} />
        {active.length > 1 && <Note>{t("home.spectrumMulti", { list: active.map((r) => r.hz).join(" + ") })}</Note>}
      </div>

      {/* ---------- CHLADNI ---------- */}
      {focusHz > 0 && (
        <div className="card">
          <div className="row between">
            <h3><LabelInfo text={t("home.chladni")} term="chladni" /></h3>
            <Badge kind="simulation" />
          </div>
          <ChladniCanvas hz={focusHz} />
          <Note>{t("glossary.plateEffect")}</Note>
        </div>
      )}
    </div>
  );
};
