/**
 * Synthèse des effets sonores et du fond musical (100 % générés par nos soins : aucun droit tiers).
 * Déterministe (graine fixe) : régénérer donne exactement les mêmes fichiers.
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

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

/** Génère tous les sons dans `dir` (video/public/sfx) et le fond musical dans `musicDir`. */
export function generateAll(dir: string, musicDir: string) {
  writeWav(path.join(dir, "whoosh.wav"), whoosh(0.5, 400, 5200, 1));
  writeWav(path.join(dir, "swoosh-bas.wav"), whoosh(0.6, 180, 1600, 2));
  writeWav(path.join(dir, "pop.wav"), pop());
  writeWav(path.join(dir, "ding.wav"), ding());
  writeWav(path.join(dir, "clic.wav"), clic(3));
  writeWav(path.join(dir, "impact.wav"), impact(4));
  const bed = ambientBed(32);
  const wav = path.join(musicDir, "ambiance-studio.wav");
  writeWav(wav, bed.L, bed.R);
  // AAC : 10x plus léger dans le dépôt, lu nativement par Remotion
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-c:a", "aac", "-b:a", "160k", path.join(musicDir, "ambiance-studio.m4a")]);
  fs.rmSync(wav);
  return ["whoosh", "swoosh-bas", "pop", "ding", "clic", "impact", "musique/ambiance-studio"];
}
