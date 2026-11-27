/**
 * Synthèse des effets sonores et du fond musical (100 % générés par nos soins : aucun droit tiers).
 * Déterministe (graine fixe) : régénérer donne exactement les mêmes fichiers.
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { HUMEURS, type Humeur } from "../schema/episode";

export const SR = 48000;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Filtre biquad (RBJ) dont la fréquence peut varier dans le temps. */
class Biquad {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  constructor(private type: "lp" | "hp" | "bp") {}
  set(freq: number, q = 0.707) {
    const w = (2 * Math.PI * Math.min(freq, SR * 0.45)) / SR;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let b0: number, b1: number, b2: number;
    if (this.type === "lp") {
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
    } else if (this.type === "hp") {
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
    } else {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
    }
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
  }
  process(x: number) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

function normalize(buf: Float32Array, peak = 0.89) {
  let m = 0;
  for (const v of buf) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < buf.length; i++) buf[i] = (buf[i] / m) * peak;
  return buf;
}

/** Écrit un WAV PCM 16 bits stéréo (même signal sur les deux canaux, ou deux canaux fournis). */
export function writeWav(file: string, left: Float32Array, right: Float32Array = left) {
  const n = left.length;
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([h, data]));
}

function whoosh(dur: number, f0: number, f1: number, seed: number) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const r = rng(seed);
  const bp = new Biquad("bp");
  const hp = new Biquad("hp");
  hp.set(120);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = f0 * Math.pow(f1 / f0, t < 0.6 ? t / 0.6 : 1 - (t - 0.6) / 0.4 * 0.35);
    if (i % 32 === 0) bp.set(f, 1.4);
    const env = Math.sin(Math.PI * Math.pow(t, 0.8)) ** 2;
    out[i] = hp.process(bp.process(r() * 2 - 1)) * env;
  }
  return normalize(out, 0.8);
}

function pop() {
  const n = Math.round(0.14 * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 300 + 700 * Math.exp(-t * 55);
    ph += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 38) * (t < 0.002 ? t / 0.002 : 1);
  }
  return normalize(out, 0.85);
}

function ding() {
  const n = Math.round(1.1 * SR);
  const out = new Float32Array(n);
  const partials: Array<[number, number, number]> = [
    [1318.5, 1, 4.2],
    [1975.5, 0.45, 5.5],
    [2637, 0.22, 7],
    [659.25, 0.25, 3.2],
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (const [f, a, d] of partials) v += a * Math.sin(2 * Math.PI * f * t) * Math.exp(-t * d);
    out[i] = v * (t < 0.004 ? t / 0.004 : 1);
  }
  return normalize(out, 0.7);
}

function clic(seed: number) {
  const n = Math.round(0.03 * SR);
  const out = new Float32Array(n);
  const r = rng(seed);
  const bp = new Biquad("bp");
  bp.set(3800, 2.2);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = bp.process(r() * 2 - 1) * Math.exp(-t * 260);
  }
  return normalize(out, 0.75);
}

function impact(seed: number) {
  const n = Math.round(0.7 * SR);
  const out = new Float32Array(n);
  const r = rng(seed);
  const lp = new Biquad("lp");
  lp.set(900);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 42 + 70 * Math.exp(-t * 18);
    ph += (2 * Math.PI * f) / SR;
    const body = Math.sin(ph) * Math.exp(-t * 6.5);
    const noise = lp.process(r() * 2 - 1) * Math.exp(-t * 30) * 0.6;
    out[i] = body + noise;
  }
  return normalize(out, 0.9);
}

/**
 * Fond musical ambiant discret (boucle ~32 s, 100 BPM) : nappes douces + pulsation légère.
 * Pensé pour être mixé très bas sous la voix (et atténué automatiquement quand elle parle).
 */
export function ambientBed(seconds = 32) {
  const n = Math.round(seconds * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const bpm = 100;
  const beat = 60 / bpm;
  // Progression : Am - F - C - G (2 mesures chacune)
  const chords = [
    [57, 60, 64, 69],
    [53, 57, 60, 65],
    [48, 55, 60, 64],
    [55, 59, 62, 67],
  ];
  const barLen = beat * 4 * 2;
  const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
  const lpL = new Biquad("lp");
  const lpR = new Biquad("lp");
  const r = rng(99);
  const phases = new Float64Array(16).map(() => r() * Math.PI * 2);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const ci = Math.floor(t / barLen) % chords.length;
    const tc = (t % barLen) / barLen;
    const xfade = Math.min(1, tc * 6) * Math.min(1, (1 - tc) * 6);
    let vL = 0;
    let vR = 0;
    chords[ci].forEach((m, k) => {
      const f = midi(m);
      const det = 1 + (k % 2 ? 0.0021 : -0.0018);
      const a = Math.sin(2 * Math.PI * f * t + phases[k]) + 0.35 * Math.sin(2 * Math.PI * f * 2 * det * t + phases[k + 4]);
      vL += a * (k % 2 ? 0.8 : 1);
      vR += a * (k % 2 ? 1 : 0.8);
    });
    // basse sur les temps
    const bassM = chords[ci][0] - 12;
    const tb = t % beat;
    const bass = Math.sin(2 * Math.PI * midi(bassM) * t) * Math.exp(-tb * 5) * 0.9;
    // pulsation « tick » douce sur les croches
    const t8 = t % (beat / 2);
    const tick = (r() * 2 - 1) * Math.exp(-t8 * 90) * 0.05;
    if (i % 64 === 0) {
      const cut = 900 + 500 * Math.sin((2 * Math.PI * t) / 16);
      lpL.set(cut, 0.8);
      lpR.set(cut * 1.03, 0.8);
    }
    L[i] = lpL.process(vL * 0.16 * xfade) + bass * 0.22 + tick;
    R[i] = lpR.process(vR * 0.16 * xfade) + bass * 0.22 + tick;
  }
  // fondu de bouclage
  const fade = Math.round(0.05 * SR);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    L[i] *= g;
    R[i] *= g;
    L[n - 1 - i] *= g;
    R[n - 1 - i] *= g;
  }
  normalize(L, 0.7);
  normalize(R, 0.7);
  return { L, R };
}


interface MoodSpec {
  bpm: number;
  /** Accords en notes MIDI (une mesure chacun). */
  chords: number[][];
  /** Brillance du pad (Hz de coupure de base). */
  cutoff: number;
  /** Intensité de la pulsation rythmique (kick/hat) en fin de montée. */
  drive: number;
  /** Motif d'arpège : pas de croche (0..7) joués. */
  arp: number[];
  /** Désaccord des voix (chorus). */
  detune: number;
}

const MOODS: Record<Humeur, MoodSpec> = {
  mysterieuse: { bpm: 84, chords: [[57, 60, 64], [55, 58, 62], [53, 57, 60], [52, 56, 59]], cutoff: 700, drive: 0.35, arp: [0, 3, 5], detune: 0.003 },
  energique: { bpm: 124, chords: [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]], cutoff: 1500, drive: 1, arp: [0, 1, 2, 3, 4, 5, 6, 7], detune: 0.002 },
  inspirante: { bpm: 96, chords: [[48, 55, 60, 64], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]], cutoff: 1100, drive: 0.6, arp: [0, 2, 4, 6], detune: 0.0025 },
  legere: { bpm: 110, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]], cutoff: 1800, drive: 0.45, arp: [0, 2, 3, 5, 6], detune: 0.0015 },
  tension: { bpm: 100, chords: [[45, 52, 57], [44, 51, 56], [43, 50, 55], [44, 51, 56]], cutoff: 520, drive: 0.8, arp: [0, 4], detune: 0.004 },
};

/**
 * Piste musicale dirigée (≈ 64 s) : elle évolue au lieu de boucler un fond uniforme.
 *   0–8 s   intro : pad seul, filtre fermé
 *   8–24 s  l'arpège entre, le filtre s'ouvre
 *   24–40 s la pulsation s'installe (selon l'humeur)
 *   40–52 s montée (bruit filtré qui s'élève), puis relâchement bref
 *   52–64 s retombée apaisée (permet de finir sur le CTA)
 * Original (synthèse additive, graine fixe) : aucun droit tiers.
 */
export function moodTrack(humeur: Humeur, seconds = 64) {
  const m = MOODS[humeur];
  const n = Math.round(seconds * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const beat = 60 / m.bpm;
  const bar = beat * 4;
  const midi = (k: number) => 440 * Math.pow(2, (k - 69) / 12);
  const r = rng(1000 + HUMEURS.indexOf(humeur));
  const lpL = new Biquad("lp");
  const lpR = new Biquad("lp");
  const hat = new Biquad("hp");
  const riser = new Biquad("bp");
  hat.set(7000, 0.7);
  const phases = new Float64Array(16).map(() => r() * Math.PI * 2);
  const smooth = (a: number, b: number, t: number) => {
    const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
    return x * x * (3 - 2 * x);
  };
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const ci = Math.floor(t / bar) % m.chords.length;
    const ch = m.chords[ci];
    const tc = (t % bar) / bar;
    const xf = Math.min(1, tc * 8) * Math.min(1, (1 - tc) * 8);
    // plan de la progression
    const open = smooth(4, 28, t) * (1 - 0.55 * smooth(50, 60, t));
    const groove = smooth(22, 30, t) * (1 - smooth(50, 56, t));
    const build = smooth(40, 51, t) * (1 - smooth(51, 52.5, t));
    if (i % 64 === 0) {
      const cut = m.cutoff * (0.45 + 1.4 * open + 0.6 * build);
      lpL.set(cut, 0.9);
      lpR.set(cut * 1.04, 0.9);
      riser.set(500 + 5500 * build * build, 2.2);
    }
    let vL = 0;
    let vR = 0;
    ch.forEach((k, j) => {
      const f = midi(k);
      const det = 1 + (j % 2 ? m.detune : -m.detune);
      const a = Math.sin(2 * Math.PI * f * t + phases[j]) + 0.3 * Math.sin(2 * Math.PI * f * 2 * det * t + phases[j + 5]);
      vL += a * (j % 2 ? 0.8 : 1);
      vR += a * (j % 2 ? 1 : 0.8);
    });
    // arpège (croches), absent en intro
    const e8 = beat / 2;
    const step = Math.floor(t / e8) % 8;
    let arp = 0;
    if (m.arp.includes(step)) {
      const te = t % e8;
      const k = ch[(step + ci) % ch.length] + 12;
      arp = Math.sin(2 * Math.PI * midi(k) * t) * Math.exp(-te * 9) * 0.35 * smooth(8, 16, t) * (1 - 0.5 * smooth(52, 60, t));
    }
    // basse + « kick » sur les temps pendant la phase de groove
    const tb = t % beat;
    const bass = Math.sin(2 * Math.PI * midi(ch[0] - 12) * t) * Math.exp(-tb * 4) * 0.8;
    const kick = Math.sin(2 * Math.PI * (48 + 90 * Math.exp(-tb * 28)) * tb) * Math.exp(-tb * 9) * m.drive * groove * 0.9;
    const t8 = t % e8;
    const tick = hat.process((r() * 2 - 1) * Math.exp(-t8 * 70)) * 0.12 * m.drive * groove;
    // montée : bruit filtré qui s'élève
    const rise = riser.process(r() * 2 - 1) * build * 0.45;
    L[i] = lpL.process(vL * 0.14 * xf * (0.55 + 0.45 * open)) + arp * 0.5 + bass * 0.2 + kick * 0.34 + tick + rise;
    R[i] = lpR.process(vR * 0.14 * xf * (0.55 + 0.45 * open)) + arp * 0.5 + bass * 0.2 + kick * 0.34 + tick + rise;
  }
  const fade = Math.round(0.05 * SR);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    L[i] *= g;
    R[i] *= g;
    L[n - 1 - i] *= g;
    R[n - 1 - i] *= g;
  }
  normalize(L, 0.7);
  normalize(R, 0.7);
  return { L, R };
}


// ------------------------------------------------------------------ sons de la personnalité d'Ecto
/** Fumée : souffle grave et long, qui monte et retombe. */
function fumee() {
  const n = Math.round(1.8 * SR);
  const out = new Float32Array(n);
  const r = rng(21);
  const bp = new Biquad("bp");
  const lp = new Biquad("lp");
  lp.set(2600);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    if (i % 48 === 0) bp.set(1500 - 700 * t, 0.55);
    const env = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.75)), 1.6) * (0.85 + 0.15 * Math.sin(i / SR * 9));
    out[i] = lp.process(bp.process(r() * 2 - 1)) * env;
  }
  return normalize(out, 0.7);
}

/** Tension : grondement qui monte (deux voix désaccordées + souffle), coupé net au sommet. */
function tension() {
  const n = Math.round(1.3 * SR);
  const out = new Float32Array(n);
  const r = rng(22);
  const hp = new Biquad("hp");
  hp.set(1800);
  let p1 = 0;
  let p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = 80 * Math.pow(5.2, t);
    p1 += (2 * Math.PI * f) / SR;
    p2 += (2 * Math.PI * f * 1.012) / SR;
    const saw = (ph: number) => (((ph / (2 * Math.PI)) % 1) * 2 - 1) * 0.5 + Math.sin(ph) * 0.5;
    const trem = 0.78 + 0.22 * Math.sin(i / SR * (9 + 22 * t));
    const env = Math.pow(t, 1.5) * (t > 0.96 ? (1 - t) / 0.04 : 1);
    out[i] = (saw(p1) + saw(p2)) * 0.5 * env * trem + hp.process(r() * 2 - 1) * 0.25 * Math.pow(t, 2.5);
  }
  return normalize(out, 0.82);
}

/** Agacement : « grrh » bref et sec (grondement vibré + souffle). */
function agacement() {
  const n = Math.round(0.4 * SR);
  const out = new Float32Array(n);
  const r = rng(23);
  const bp = new Biquad("bp");
  bp.set(2400, 1.1);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 105 - 30 * t + 9 * Math.sin(t * 58);
    ph += (2 * Math.PI * f) / SR;
    const saw = ((ph / (2 * Math.PI)) % 1) * 2 - 1;
    const env = (t < 0.01 ? t / 0.01 : 1) * Math.exp(-t * 6.5);
    out[i] = (saw * 0.6 + bp.process(r() * 2 - 1) * 0.55) * env;
  }
  return normalize(out, 0.85);
}

/** Flammes : grondement grave et crépitements. */
function flamme() {
  const n = Math.round(1.6 * SR);
  const out = new Float32Array(n);
  const r = rng(24);
  const lp = new Biquad("lp");
  lp.set(520);
  const hp = new Biquad("hp");
  hp.set(3200);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.min(1, t / 0.08) * (t > 0.82 ? (1 - t) / 0.18 : 1);
    const rumble = lp.process(r() * 2 - 1) * (0.6 + 0.4 * Math.sin(i / SR * 13 + 1)) * 1.6;
    const crackle = r() < 0.0016 ? hp.process((r() * 2 - 1) * 6) : hp.process(0) * 0.8;
    out[i] = (rumble + crackle * 1.4) * env;
  }
  return normalize(out, 0.75);
}

/** Lancer : whoosh lourd. */
function lancerSon() {
  const base = whoosh(0.45, 260, 3400, 25);
  const n = base.length;
  for (let i = 0; i < n; i++) base[i] *= 1 + 0.5 * Math.sin((Math.PI * i) / n);
  return normalize(base, 0.9);
}

/** Verre brisé : choc sec puis éclats cristallins en cascade. */
function verre() {
  const n = Math.round(1.7 * SR);
  const out = new Float32Array(n);
  const r = rng(26);
  const hp = new Biquad("hp");
  hp.set(1500);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] += hp.process(r() * 2 - 1) * Math.exp(-t * 70) * 1.3 + Math.sin(2 * Math.PI * 70 * t) * Math.exp(-t * 18) * 0.8;
  }
  for (let k = 0; k < 26; k++) {
    const t0 = Math.floor((0.02 + Math.pow(r(), 1.7) * 1.0) * SR);
    const f = 2200 + r() * 6800;
    const dec = 14 + r() * 40;
    const amp = 0.18 + r() * 0.32;
    for (let i = t0; i < Math.min(n, t0 + Math.round(0.45 * SR)); i++) {
      const t = (i - t0) / SR;
      out[i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * dec) * amp;
    }
  }
  return normalize(out, 0.9);
}

/** Poof : apparition d'un accessoire (petit pop soufflé + tintement). */
function poof() {
  const n = Math.round(0.55 * SR);
  const out = new Float32Array(n);
  const r = rng(27);
  const bp = new Biquad("bp");
  bp.set(3300, 0.9);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 520 * Math.exp(-t * 9) + 150;
    ph += (2 * Math.PI * f) / SR;
    let v = Math.sin(ph) * Math.exp(-t * 20) * 0.8 + bp.process(r() * 2 - 1) * Math.exp(-t * 12) * 0.5;
    for (const [k, fq] of [1760, 2217, 2637].entries()) {
      const tt = t - 0.04 - k * 0.045;
      if (tt > 0) v += Math.sin(2 * Math.PI * fq * tt) * Math.exp(-tt * 16) * 0.22;
    }
    out[i] = v;
  }
  return normalize(out, 0.8);
}

/** Gorgée : deux « glou » graves. */
function gorgee() {
  const n = Math.round(0.55 * SR);
  const out = new Float32Array(n);
  const lp = new Biquad("lp");
  lp.set(900);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const bump = (c: number, w: number) => Math.exp(-Math.pow((t - c) / w, 2));
    const e = bump(0.12, 0.05) + 0.8 * bump(0.32, 0.055);
    const f = 300 - 520 * (t % 0.2) * 0.6 + 40 * Math.sin(t * 80);
    ph += (2 * Math.PI * Math.max(90, f)) / SR;
    out[i] = lp.process(Math.sin(ph) * e);
  }
  return normalize(out, 0.7);
}

/** Soupir : longue expiration apaisante. */
function soupir() {
  const n = Math.round(1.5 * SR);
  const out = new Float32Array(n);
  const r = rng(29);
  const bp = new Biquad("bp");
  const lp = new Biquad("lp");
  lp.set(2200);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    if (i % 64 === 0) bp.set(1100 - 350 * t, 0.7);
    const env = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.55)), 1.4);
    out[i] = lp.process(bp.process(r() * 2 - 1)) * env;
  }
  return normalize(out, 0.6);
}

/** Écrit les sons de la personnalité d'Ecto dans `dir` (n'écrase rien d'autre). */
export function generatePerso(dir: string) {
  const defs: Array<[string, Float32Array]> = [
    ["fumee", fumee()],
    ["tension", tension()],
    ["agacement", agacement()],
    ["flamme", flamme()],
    ["lancer", lancerSon()],
    ["verre", verre()],
    ["poof", poof()],
    ["gorgee", gorgee()],
    ["soupir", soupir()],
  ];
  for (const [nom, buf] of defs) writeWav(path.join(dir, `${nom}.wav`), buf);
  return defs.map(([n]) => n);
}

/** Génère tous les sons dans `dir` (video/public/sfx) et le fond musical dans `musicDir`. */
export function generateAll(dir: string, musicDir: string) {
  writeWav(path.join(dir, "whoosh.wav"), whoosh(0.5, 400, 5200, 1));
  writeWav(path.join(dir, "swoosh-bas.wav"), whoosh(0.6, 180, 1600, 2));
  writeWav(path.join(dir, "pop.wav"), pop());
  writeWav(path.join(dir, "ding.wav"), ding());
  writeWav(path.join(dir, "clic.wav"), clic(3));
  writeWav(path.join(dir, "impact.wav"), impact(4));
  generatePerso(dir);
  const bed = ambientBed(32);
  const wav = path.join(musicDir, "ambiance-studio.wav");
  writeWav(wav, bed.L, bed.R);
  // AAC : 10x plus léger dans le dépôt, lu nativement par Remotion
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-c:a", "aac", "-b:a", "160k", path.join(musicDir, "ambiance-studio.m4a")]);
  fs.rmSync(wav);
  const done = ["whoosh", "swoosh-bas", "pop", "ding", "clic", "impact", "fumee", "tension", "agacement", "flamme", "lancer", "verre", "poof", "gorgee", "soupir", "musique/ambiance-studio"];
  for (const h of HUMEURS) {
    const t = moodTrack(h);
    const w = path.join(musicDir, `${h}.wav`);
    writeWav(w, t.L, t.R);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", w, "-c:a", "aac", "-b:a", "160k", path.join(musicDir, `${h}.m4a`)]);
    fs.rmSync(w);
    done.push(`musique/${h}`);
  }
  return done;
}
