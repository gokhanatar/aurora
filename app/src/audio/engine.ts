/** Web Audio motoru — çok katmanlı (aynı anda N frekans), sekans oynatma, analyser.
 *
 * Katman mantığı: her katmanın kendi osilatör + kazanç düğümü vardır; hepsi ortak bir master
 * kazanca karışır. Böylece 432 + 528 + 639 Hz aynı anda çalınabilir ve her katman ayrı
 * sessize alınabilir.
 *
 * Güvenlik: master kazanç MAX_GAIN'i (0.2) aşamaz. Katman sayısı arttıkça her katman
 * 1/√N ile ölçeklenir — aksi hâlde toplam sinyal klipslenir (bozulur ve gürültü üretir).
 */
import type { Stimulus, WaveformKind } from "../data/types";
import { clampHz, isRenderable } from "../core/math";

export const MAX_GAIN = 0.2;
const FADE = 0.02;

export interface Layer {
  id: string;
  hz: number;
  waveform: WaveformKind;
  /** 0–1 göreli ağırlık */
  level: number;
  muted: boolean;
}

interface LayerNodes {
  osc: OscillatorNode;
  gain: GainNode;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private nodes = new Map<string, LayerNodes>();
  private seqTimer: number | null = null;
  private listeners = new Set<() => void>();

  layers: Layer[] = [];
  playing = false;
  amplitude = 0.15;
  progress = 0;

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 8192;                 // düşük frekansları da ayırmak için geniş pencere
      this.analyser.smoothingTimeConstant = 0.6;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit(): void {
    this.listeners.forEach((f) => f());
  }

  get sampleRate(): number {
    return this.ctx?.sampleRate ?? 48000;
  }

  /** Osilatör düğümlerini `layers` durumuyla eşitler. */
  private sync(): void {
    const ctx = this.ensure();
    const now = ctx.currentTime;

    for (const [id, n] of this.nodes) {
      if (!this.layers.some((l) => l.id === id)) {
        n.gain.gain.setTargetAtTime(0, now, FADE);
        const { osc } = n;
        window.setTimeout(() => { try { osc.stop(); } catch { /* zaten durdu */ } }, 250);
        this.nodes.delete(id);
      }
    }

    const audibleCount = this.layers.filter((l) => !l.muted && l.hz > 0 && isRenderable(l.hz, this.sampleRate)).length;
    const norm = Math.sqrt(Math.max(1, audibleCount));

    for (const l of this.layers) {
      let n = this.nodes.get(l.id);
      if (!n) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain).connect(this.master!);
        osc.start();
        n = { osc, gain };
        this.nodes.set(l.id, n);
      }
      n.osc.type = l.waveform;
      if (l.hz > 0 && isRenderable(l.hz, this.sampleRate)) n.osc.frequency.setTargetAtTime(clampHz(l.hz), now, 0.005);
      const usable = !l.muted && l.hz > 0 && isRenderable(l.hz, this.sampleRate);
      n.gain.gain.setTargetAtTime(this.playing && usable ? l.level / norm : 0, now, FADE);
    }

    this.master!.gain.setTargetAtTime(this.playing ? Math.min(MAX_GAIN, Math.max(0, this.amplitude)) : 0, now, FADE);
  }

  setLayers(layers: Layer[]): void {
    this.layers = layers;
    this.sync();
    this.emit();
  }

  addLayer(hz: number, waveform: WaveformKind = "sine", level = 1): Layer {
    const layer: Layer = {
      id: `L${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      hz, waveform, level, muted: false,
    };
    this.layers = [...this.layers, layer];
    this.sync();
    this.emit();
    return layer;
  }

  updateLayer(id: string, patch: Partial<Omit<Layer, "id">>): void {
    this.layers = this.layers.map((l) => (l.id === id ? { ...l, ...patch } : l));
    this.sync();
    this.emit();
  }

  removeLayer(id: string): void {
    this.layers = this.layers.filter((l) => l.id !== id);
    this.sync();
    this.emit();
  }

  setAmplitude(a: number): void {
    this.amplitude = Math.min(MAX_GAIN, Math.max(0, a));
    this.sync();
    this.emit();
  }

  /** Tek frekanslı hızlı oynatma — ilk katmanı bu frekansa alır, diğerlerini korur. */
  play(hz: number, waveform: WaveformKind = "sine", amplitude = 0.15): void {
    this.amplitude = Math.min(MAX_GAIN, Math.max(0, amplitude));
    this.playing = true;
    if (this.layers.length === 0) this.layers = [{ id: "L0", hz, waveform, level: 1, muted: false }];
    else this.layers = this.layers.map((l, i) => (i === 0 ? { ...l, hz, waveform } : l));
    this.sync();
    this.emit();
  }

  /** Mevcut katmanları çalar (çok katmanlı mod). */
  start(): void {
    this.playing = true;
    this.sync();
    this.emit();
  }

  setFrequency(hz: number): void {
    if (this.layers.length) this.updateLayer(this.layers[0].id, { hz });
  }

  /** Durdur. `immediate` ile kısa rampa sonrası kazanç KESİN sıfırlanır.
   *
   *  Neden gerekli: `setTargetAtTime` üstel bir yaklaşımdır — matematiksel olarak hiçbir
   *  zaman tam sıfıra inmez, bu yüzden "durdurdum ama hâlâ çok hafif ses var" durumu oluşur.
   *  Burada rampa bittikten sonra `cancelScheduledValues` + `setValueAtTime(0)` ile kesiyoruz.
   */
  stop(immediate = true): void {
    if (this.seqTimer !== null) {
      window.clearTimeout(this.seqTimer);
      this.seqTimer = null;
    }
    this.playing = false;
    this.progress = 0;
    this.sync();
    if (immediate && this.ctx && this.master) {
      const ctx = this.ctx, master = this.master;
      const nodes = [...this.nodes.values()];
      window.setTimeout(() => {
        if (this.playing) return;                      // bu arada tekrar başlatıldıysa dokunma
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(0, now);
        for (const n of nodes) {
          n.gain.gain.cancelScheduledValues(now);
          n.gain.gain.setValueAtTime(0, now);
        }
      }, FADE * 1000 * 4);
    }
    this.emit();
  }

  /** Her şeyi anında sustur ve osilatörleri kapat (panik butonu). */
  panic(): void {
    if (this.seqTimer !== null) {
      window.clearTimeout(this.seqTimer);
      this.seqTimer = null;
    }
    this.playing = false;
    this.progress = 0;
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(0, now);
    }
    for (const [, n] of this.nodes) {
      try {
        n.gain.gain.cancelScheduledValues(this.ctx!.currentTime);
        n.gain.gain.setValueAtTime(0, this.ctx!.currentTime);
        n.osc.stop();
      } catch { /* zaten durdu */ }
    }
    this.nodes.clear();
    this.emit();
  }

  /** Sekans oynatma — kör deneyde Hz UI'ya gösterilmez. */
  playStimulus(stim: Stimulus, onStep?: (index: number, hz: number) => void, onDone?: () => void, speed = 1): void {
    this.stop(false);   // hard-stop yok: hemen ardından yeniden başlatılacak
    const plan: Array<{ hz: number; ms: number; idx: number }> = [];
    for (let r = 0; r < stim.repetitions; r++)
      stim.steps.forEach((s, i) => {
        plan.push({ hz: s.hz, ms: (s.durationS * 1000) / speed, idx: i });
        if (i < stim.steps.length - 1) plan.push({ hz: 0, ms: (stim.gapS * 1000) / speed, idx: -1 });
      });
    const total = plan.reduce((a, p) => a + p.ms, 0) || 1;
    let elapsed = 0;
    const run = (k: number) => {
      if (k >= plan.length) {
        this.stop();
        onDone?.();
        return;
      }
      const p = plan[k];
      this.amplitude = stim.amplitude;
      this.playing = true;
      this.layers = [{ id: "SEQ", hz: p.hz, waveform: stim.waveform, level: 1, muted: p.hz <= 0 }];
      this.sync();
      if (p.idx >= 0) onStep?.(p.idx, p.hz);
      this.progress = elapsed / total;
      this.emit();
      elapsed += p.ms;
      this.seqTimer = window.setTimeout(() => run(k + 1), p.ms);
    };
    run(0);
  }

  waveform(out: Float32Array<ArrayBuffer>): boolean {
    if (!this.analyser) return false;
    this.analyser.getFloatTimeDomainData(out);
    return true;
  }

  spectrum(out: Uint8Array<ArrayBuffer>): { ok: boolean; binHz: number } {
    if (!this.analyser || !this.ctx) return { ok: false, binHz: 0 };
    this.analyser.getByteFrequencyData(out);
    return { ok: true, binHz: this.ctx.sampleRate / this.analyser.fftSize };
  }

  get fftBins(): number {
    return this.analyser?.frequencyBinCount ?? 4096;
  }
}

export const audio = new AudioEngine();
