/** Chladni — gerçek plaka fiziği (Kirchhoff–Love ince plaka teorisi).
 *
 * ÖNEMLİ FİZİKSEL GERÇEK: Bir Chladni deseni frekansın tek başına fonksiyonu DEĞİLDİR.
 * Aynı 528 Hz, farklı levhada tamamen farklı desen verir. Deseni belirleyen:
 *   malzeme (E, ρ, ν) · kalınlık h · kenar uzunluğu L · sınır koşulu · uyarım noktası
 *
 * Bu yüzden burada "frekans → desen" değil, "levha + frekans → rezonans modu" hesaplanır:
 *   1. Levha parametrelerinden plaka sertliği D ve modal frekanslar f(m,n) bulunur
 *   2. Verilen frekansa en yakın mod(lar) seçilir
 *   3. Rezonansa yakınlığa göre modlar ağırlıklı toplanır (gerçek levha da böyle davranır)
 *   4. Düğüm çizgileri (|w| ≈ 0) kum birikim bölgeleridir
 *
 * Kaynak denklem (serbest kenarlı kare plaka, Ritz yaklaşımı):
 *   f(m,n) = (λ(m,n) / 2π) · √(D / (ρ·h·L⁴)),   D = E·h³ / (12(1−ν²))
 */
import type { PatternFingerprint } from "../data/types";
import { vectorSimilarity } from "./matching";

/** Malzeme sabitleri: E = Young modülü (Pa), rho = yoğunluk (kg/m³), nu = Poisson oranı. */
export interface Material {
  E: number;
  rho: number;
  nu: number;
}

export const MATERIALS: Record<string, Material> = {
  steel: { E: 200e9, rho: 7850, nu: 0.30 },
  aluminum: { E: 69e9, rho: 2700, nu: 0.33 },
  brass: { E: 100e9, rho: 8500, nu: 0.34 },
  glass: { E: 70e9, rho: 2500, nu: 0.22 },
};

export type BoundaryCondition = "free" | "clamped" | "simply_supported";

export interface Plate {
  material: keyof typeof MATERIALS | string;
  /** Kenar uzunluğu (cm) */
  sizeCm: number;
  /** Kalınlık (mm) */
  thicknessMm: number;
  boundary: BoundaryCondition;
}

export const DEFAULT_PLATE: Plate = { material: "steel", sizeCm: 20, thicknessMm: 1, boundary: "free" };

/** Plaka eğilme sertliği D = E·h³ / (12(1−ν²)) */
export const flexuralRigidity = (mat: Material, thicknessM: number): number =>
  (mat.E * thicknessM ** 3) / (12 * (1 - mat.nu ** 2));

/**
 * Boyutsuz frekans parametresi λ(m,n). Sınır koşuluna göre değişir.
 *
 * - simply_supported: analitik tam çözüm  λ = π²(m² + n²)
 * - clamped / free: Ritz yaklaşımı — kenar koşulu etkin dalga sayısını kaydırır.
 *   (Serbest kenar için Leissa'nın kare plaka tablolarına yaklaşan ampirik düzeltme.)
 */
export const lambdaMN = (m: number, n: number, boundary: BoundaryCondition): number => {
  if (boundary === "simply_supported") return Math.PI ** 2 * (m * m + n * n);
  // Ankastre ve serbest kenarda etkin dalga sayısı yarım dalga kadar kayar.
  const shift = boundary === "clamped" ? 0.5 : -0.5;
  const me = Math.max(0.5, m + shift);
  const ne = Math.max(0.5, n + shift);
  return Math.PI ** 2 * (me * me + ne * ne);
};

/** (m,n) modunun rezonans frekansı (Hz). */
export const modalFrequency = (m: number, n: number, plate: Plate): number => {
  const mat = MATERIALS[plate.material] ?? MATERIALS.steel;
  const h = plate.thicknessMm / 1000;
  const L = plate.sizeCm / 100;
  const D = flexuralRigidity(mat, h);
  return (lambdaMN(m, n, plate.boundary) / (2 * Math.PI)) * Math.sqrt(D / (mat.rho * h * L ** 4));
};

export interface Mode {
  m: number;
  n: number;
  hz: number;
  /** Sürülen frekansa göreli genlik (rezonans yakınlığı) */
  weight: number;
}

/** Sönüm oranı — gerçek metal levhalarda tipik olarak %0.1–1. */
const DAMPING = 0.006;

/**
 * Sürülen frekansta uyarılan modlar. Gerçek bir levha tek modda değil, rezonansa
 * yakınlıkla ağırlıklanmış mod süperpozisyonunda titreşir (Lorentz tepkisi):
 *   A(f) = 1 / √[(1 − (f/fᵢ)²)² + (2ζ·f/fᵢ)²]
 */
export const excitedModes = (hz: number, plate: Plate, maxOrder = 12, keep = 6): Mode[] => {
  if (hz <= 0) return [];
  const modes: Mode[] = [];
  for (let m = 1; m <= maxOrder; m++)
    for (let n = m; n <= maxOrder; n++) {
      const fi = modalFrequency(m, n, plate);
      if (!Number.isFinite(fi) || fi <= 0) continue;
      const r = hz / fi;
      const weight = 1 / Math.sqrt((1 - r * r) ** 2 + (2 * DAMPING * r) ** 2);
      modes.push({ m, n, hz: fi, weight });
    }
  const top = modes.sort((a, b) => b.weight - a.weight).slice(0, keep);
  const max = top[0]?.weight || 1;
  return top.map((x) => ({ ...x, weight: x.weight / max }));
};

/** Sürülen frekansa en yakın tek mod (özet gösterim için). */
export const dominantMode = (hz: number, plate: Plate = DEFAULT_PLATE): Mode | null => excitedModes(hz, plate, 12, 1)[0] ?? null;

/** Bir modun şekil fonksiyonu (sınır koşuluna göre). */
const shape = (m: number, n: number, x: number, y: number, boundary: BoundaryCondition): number => {
  if (boundary === "simply_supported") {
    return Math.sin(m * Math.PI * x) * Math.sin(n * Math.PI * y);
  }
  if (boundary === "clamped") {
    // Ankastre kenar: kenarlarda hem yer değiştirme hem eğim sıfır
    const f = (k: number, t: number) => (1 - Math.cos(2 * Math.PI * k * t)) / 2;
    return f(m, x) * f(n, y) * Math.sin(m * Math.PI * x) * Math.sin(n * Math.PI * y);
  }
  // Serbest kenar (klasik Chladni levhası): kosinüs tabanı, simetrik/antisimetrik birleşim
  return (
    Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y) -
    Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y)
  );
};

/** Sürülen frekansta levha yüzeyinin yer değiştirme alanı (süperpozisyon). */
export const displacementField = (hz: number, plate: Plate, size: number): Float32Array => {
  const modes = excitedModes(hz, plate);
  const out = new Float32Array(size * size);
  if (!modes.length) return out;
  for (let j = 0; j < size; j++) {
    const y = j / (size - 1);
    for (let i = 0; i < size; i++) {
      const x = i / (size - 1);
      let v = 0;
      for (const md of modes) v += md.weight * shape(md.m, md.n, x, y, plate.boundary);
      out[j * size + i] = v;
    }
  }
  let max = 0;
  for (let i = 0; i < out.length; i++) max = Math.max(max, Math.abs(out[i]));
  if (max > 0) for (let i = 0; i < out.length; i++) out[i] /= max;
  return out;
};

/**
 * Kum maskesi: kum, yer değiştirmenin sıfıra yakın olduğu düğüm çizgilerinde birikir.
 * Eşik levha genliğine bağlıdır — güçlü uyarımda çizgiler incelir.
 */
export const simulatePlate = (hz: number, plate: Plate = DEFAULT_PLATE, size = 128, threshold = 0.06): Uint8Array => {
  const field = displacementField(hz, plate, size);
  const mask = new Uint8Array(size * size);
  for (let i = 0; i < field.length; i++) mask[i] = Math.abs(field[i]) < threshold ? 1 : 0;
  return mask;
};

/** Geriye dönük uyum: varsayılan levha ile eski çağrı biçimi. */
export const simulate = (hz: number, size = 128, threshold = 0.06): Uint8Array =>
  simulatePlate(hz, DEFAULT_PLATE, size, threshold);

/** Eski API — artık gerçek modal hesaptan gelir. */
export const modeNumbers = (hz: number, plate: Plate = DEFAULT_PLATE): [number, number] => {
  const d = dominantMode(hz, plate);
  return d ? [d.m, d.n] : [1, 2];
};

/** Bu levhanın rezonans frekansları — desenin en net göründüğü noktalar. */
export const resonances = (plate: Plate = DEFAULT_PLATE, lo = 20, hi = 20000, maxOrder = 12): Mode[] => {
  const out: Mode[] = [];
  for (let m = 1; m <= maxOrder; m++)
    for (let n = m; n <= maxOrder; n++) {
      const hz = modalFrequency(m, n, plate);
      if (hz >= lo && hz <= hi) out.push({ m, n, hz, weight: 1 });
    }
  return out.sort((a, b) => a.hz - b.hz);
};

/** Sürülen frekans bir rezonansa ne kadar yakın? 1 = tam rezonans, 0 = uzak. */
export const resonanceProximity = (hz: number, plate: Plate = DEFAULT_PLATE): number => {
  const d = dominantMode(hz, plate);
  if (!d) return 0;
  const cents = Math.abs(1200 * Math.log2(hz / d.hz));
  return Math.max(0, 1 - cents / 200);         // 200 cent uzakta sıfıra iner
};

// ---------- PARMAK İZİ ----------

const mirrorScore = (a: Uint8Array, s: number, map: (i: number, j: number) => [number, number]): number => {
  let diff = 0;
  for (let j = 0; j < s; j++)
    for (let i = 0; i < s; i++) {
      const [i2, j2] = map(i, j);
      diff += Math.abs(a[j * s + i] - a[j2 * s + i2]);
    }
  return 1 - diff / (s * s);
};

export const fingerprint = (mask: Uint8Array, size: number): PatternFingerprint => {
  const s = size;
  const symmetry = (mirrorScore(mask, s, (i, j) => [s - 1 - i, j]) + mirrorScore(mask, s, (i, j) => [i, s - 1 - j]) + mirrorScore(mask, s, (i, j) => [j, i])) / 3;
  const radialSymmetry = (mirrorScore(mask, s, (i, j) => [s - 1 - j, i]) + mirrorScore(mask, s, (i, j) => [s - 1 - i, s - 1 - j])) / 2;
  let ones = 0, edges = 0;
  for (let j = 0; j < s; j++)
    for (let i = 0; i < s; i++) {
      const v = mask[j * s + i];
      ones += v;
      if (i + 1 < s) edges += Math.abs(v - mask[j * s + i + 1]);
      if (j + 1 < s) edges += Math.abs(v - mask[(j + 1) * s + i]);
    }
  let nodes = 0;
  const mid = Math.floor(s / 2);
  for (let i = 1; i < s; i++) {
    if (mask[mid * s + i] - mask[mid * s + i - 1] === 1) nodes++;
    if (mask[i * s + mid] - mask[(i - 1) * s + mid] === 1) nodes++;
  }
  const hist = new Array<number>(18).fill(0);
  let magSum = 0;
  for (let j = 1; j < s - 1; j++)
    for (let i = 1; i < s - 1; i++) {
      const gx = (mask[j * s + i + 1] - mask[j * s + i - 1]) / 2;
      const gy = (mask[(j + 1) * s + i] - mask[(j - 1) * s + i]) / 2;
      const mag = Math.hypot(gx, gy);
      if (mag === 0) continue;
      hist[Math.min(17, Math.floor((((Math.atan2(gy, gx) * 180) / Math.PI + 180) % 180) / 10))] += mag;
      magSum += mag;
    }
  return {
    symmetry,
    radialSymmetry,
    complexity: Math.min(1, edges / (2 * s * s * 0.25)),
    density: ones / (s * s),
    nodeCount: nodes,
    dominantAngleDeg: magSum > 0 ? hist.indexOf(Math.max(...hist)) * 10 + 5 : 0,
  };
};

export const fingerprintVector = (f: PatternFingerprint): number[] => [
  f.symmetry, f.radialSymmetry, f.complexity, f.density, Math.min(f.nodeCount, 64) / 64, f.dominantAngleDeg / 180,
];

export const similarity = (a: PatternFingerprint, b: PatternFingerprint): number =>
  vectorSimilarity(fingerprintVector(a), fingerprintVector(b));

/** Gri (0–255) → Otsu eşiği ile kum maskesi. */
export const grayToMask = (gray: Uint8ClampedArray | number[], size: number): Uint8Array => {
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < size * size; i++) hist[gray[i] | 0]++;
  const total = size * size;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];
  let w0 = 0, sum0 = 0, best = 128, bestVar = -1;
  for (let t = 0; t < 256; t++) {
    w0 += hist[t];
    if (w0 === 0 || w0 === total) continue;
    sum0 += t * hist[t];
    const m0 = sum0 / w0, m1 = (sumAll - sum0) / (total - w0);
    const v = w0 * (total - w0) * (m0 - m1) ** 2;
    if (v > bestVar) { bestVar = v; best = t; }
  }
  const out = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) out[i] = gray[i] >= best ? 1 : 0;
  return out;
};

/** Rezonans haritası — bu levhanın gerçek modal frekansları işaretlenir. */
export const resonanceMap = (lo: number, hi: number, step: number, plate: Plate = DEFAULT_PLATE, size = 48) => {
  const rows: Array<{ hz: number; mode: [number, number]; complexity: number; nodeCount: number; proximity: number }> = [];
  for (let f = lo; f <= hi; f += step) {
    const fp = fingerprint(simulatePlate(f, plate, size), size);
    rows.push({ hz: f, mode: modeNumbers(f, plate), complexity: fp.complexity, nodeCount: fp.nodeCount, proximity: resonanceProximity(f, plate) });
  }
  return rows;
};
