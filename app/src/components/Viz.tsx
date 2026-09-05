import { useEffect, useRef } from "react";
import { audio } from "../audio/engine";
import { DEFAULT_PLATE, modeNumbers, simulatePlate, type Plate } from "../core/chladni";

const useCanvas = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[], animate: boolean) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    const loop = () => {
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== w * dpr || c.height !== h * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, w, h);
      if (animate) raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
};

/** Gerçek zamanlı dalga formu (AnalyserNode). Ses yoksa teorik sinüs çizer. */
export const WaveformCanvas = ({ hz, height = 90 }: { hz: number; height?: number }) => {
  const buf = useRef(new Float32Array(new ArrayBuffer(2048 * 4)));
  const ref = useCanvas(
    (ctx, w, h) => {
      ctx.fillStyle = "#0a0e18";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#2dd4bf";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const live = audio.playing && audio.waveform(buf.current);
      const n = 1024;
      for (let i = 0; i < n; i++) {
        const y = live ? buf.current[i] * 3 : 0.6 * Math.sin((2 * Math.PI * hz * i) / 48000 * 8);
        const px = (i / n) * w, py = h / 2 - y * (h / 2 - 4);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    },
    [hz],
    true,
  );
  return <canvas ref={ref} className="viz" style={{ height }} />;
};

/** FFT spektrumu (log-x). Ses yoksa hedef Hz ve harmoniklerini işaretler. */
export const SpectrumCanvas = ({ hz, height = 90, maxHz = 8000 }: { hz: number; height?: number; maxHz?: number }) => {
  const buf = useRef(new Uint8Array(new ArrayBuffer(2048)));
  const ref = useCanvas(
    (ctx, w, h) => {
      ctx.fillStyle = "#0a0e18";
      ctx.fillRect(0, 0, w, h);
      const lo = 20;
      const xOf = (f: number) => (Math.log(f / lo) / Math.log(maxHz / lo)) * w;
      const { ok, binHz } = audio.playing ? audio.spectrum(buf.current) : { ok: false, binHz: 0 };
      if (ok) {
        ctx.fillStyle = "#a78bfa";
        const bins = buf.current.length;
        for (let i = 1; i < bins; i++) {
          const f = i * binHz;
          if (f < lo || f > maxHz) continue;
          const x0 = xOf(f), x1 = xOf((i + 1) * binHz);
          const v = buf.current[i] / 255;
          ctx.fillRect(x0, h - v * (h - 4), Math.max(1, x1 - x0), v * (h - 4));
        }
      } else {
        for (let k = 1; k <= 6; k++) {
          const f = hz * k;
          if (f > maxHz) break;
          ctx.fillStyle = k === 1 ? "#2dd4bf" : "#4b5563";
          const bh = (h - 6) / k;
          ctx.fillRect(xOf(f) - 1.5, h - bh, 3, bh);
        }
      }
      ctx.strokeStyle = "#2dd4bf";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xOf(Math.max(lo, hz)), 0);
      ctx.lineTo(xOf(Math.max(lo, hz)), h);
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [hz, maxHz],
    true,
  );
  return <canvas ref={ref} className="viz" style={{ height }} />;
};

/** Chladni deseni. `mask` verilmezse verilen levhayla (yoksa varsayılan) simüle edilir.
 *
 *  Kare desen kare bir alana çizilir: kanvas oranı 1:1 olmadığında desen kırpılmaz,
 *  ortalanır ve çevresi levha gövdesi olarak boyanır.
 */
export const ChladniCanvas = ({ hz, size = 128, height = 220, mask, plate }: {
  hz: number; size?: number; height?: number; mask?: Uint8Array; plate?: Plate;
}) => {
  const ref = useCanvas(
    (ctx, w, h) => {
      const m = mask ?? simulatePlate(hz, plate ?? DEFAULT_PLATE, size);
      const img = ctx.createImageData(size, size);
      for (let i = 0; i < size * size; i++) {
        const sand = m[i] === 1;
        img.data[i * 4] = sand ? 236 : 22;        // kum: sıcak açık ton
        img.data[i * 4 + 1] = sand ? 240 : 30;
        img.data[i * 4 + 2] = sand ? 214 : 46;    // levha: koyu metalik
        img.data[i * 4 + 3] = 255;
      }
      const off = document.createElement("canvas");
      off.width = size;
      off.height = size;
      off.getContext("2d")!.putImageData(img, 0, 0);

      // Arka plan: levha gövdesiyle aynı ton, böylece kare dışı boşluk kesik durmaz
      ctx.fillStyle = "#16202e";
      ctx.fillRect(0, 0, w, h);

      const pad = 8;
      const s = Math.min(w, h) - pad * 2;         // kare alan, kenar boşluklu
      const x0 = (w - s) / 2;
      const y0 = (h - s) / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(off, x0, y0, s, s);

      // Levha kenarı — desenin nerede bittiğini görünür kılar
      ctx.strokeStyle = "#39465c";
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, s - 1, s - 1);

      const [n, mm] = modeNumbers(hz, plate ?? DEFAULT_PLATE);
      ctx.fillStyle = "#8b95ad";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(`(${n}, ${mm})`, x0 + 4, y0 + s - 5);
    },
    [hz, size, mask, plate],
    false,
  );
  return <canvas ref={ref} className="viz" style={{ height }} />;
};

/** Basit scatter/line chart — grafik verisi (x, y). */
export const Scatter = ({ points, height = 160, xLabel, yLabel, line = false }: { points: Array<{ x: number; y: number; hl?: boolean }>; height?: number; xLabel: string; yLabel: string; line?: boolean }) => {
  const ref = useCanvas(
    (ctx, w, h) => {
      ctx.fillStyle = "#0a0e18";
      ctx.fillRect(0, 0, w, h);
      if (!points.length) return;
      const pad = 28;
      const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
      const x0 = Math.min(...xs), x1 = Math.max(...xs) || 1, y0 = Math.min(0, ...ys), y1 = Math.max(...ys) || 1;
      const X = (x: number) => pad + ((x - x0) / (x1 - x0 || 1)) * (w - pad - 8);
      const Y = (y: number) => h - pad + 8 - ((y - y0) / (y1 - y0 || 1)) * (h - pad - 12);
      ctx.strokeStyle = "#1f2a40";
      ctx.beginPath();
      ctx.moveTo(pad, 4);
      ctx.lineTo(pad, h - pad + 8);
      ctx.lineTo(w - 4, h - pad + 8);
      ctx.stroke();
      if (line) {
        ctx.strokeStyle = "#a78bfa";
        ctx.beginPath();
        points.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y))));
        ctx.stroke();
      }
      for (const p of points) {
        ctx.fillStyle = p.hl ? "#fbbf24" : "#2dd4bf";
        ctx.beginPath();
        ctx.arc(X(p.x), Y(p.y), p.hl ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#8b95ad";
      ctx.font = "10px system-ui";
      ctx.fillText(xLabel, w - pad - 40, h - 4);
      ctx.save();
      ctx.translate(10, pad + 40);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
      ctx.fillText(String(Math.round(x0)), pad, h - pad + 20);
      ctx.fillText(String(Math.round(x1)), w - 30, h - pad + 20);
      ctx.fillText(y1.toFixed(1), 2, 12);
    },
    [points],
    false,
  );
  return <canvas ref={ref} className="viz" style={{ height }} />;
};
