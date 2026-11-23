/**
 * Bruitages des histoires « blocs » (vent, tic-tac, interrupteur, souffle de bougie, pas, coups à la porte,
 * papier, piano discret) : 100 % synthétisés par nos soins, déterministes. Voir histoires/scripts-chatgpt (§ 5).
 */
import path from "node:path";
import { SR, writeWav } from "./synth";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const buf = (sec: number) => new Float32Array(Math.round(sec * SR));
function norm(b: Float32Array, peak: number) {
  let m = 0;
  for (const v of b) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] = (b[i] / m) * peak;
  return b;
}
/** Bruit filtré passe-bas à un pôle (fréquence de coupure variable). */
function bruit(sec: number, seed: number, coupe: (t: number) => number, env: (t: number) => number) {
  const b = buf(sec);
  const r = rng(seed);
  let y = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const a = 1 - Math.exp((-2 * Math.PI * coupe(t)) / SR);
    y += a * (r() * 2 - 1 - y);
    b[i] = y * env(t);
  }
  return b;
}
function ajouter(dst: Float32Array, src: Float32Array, a: number, gain = 1) {
  const o = Math.round(a * SR);
  for (let i = 0; i < src.length && o + i < dst.length; i++) dst[o + i] += src[i] * gain;
}
const coup = (f: number, dur: number, seed: number) => {
  const b = bruit(dur, seed, () => 900, (t) => Math.exp(-t * 45) * 0.5);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    b[i] += Math.sin(2 * Math.PI * (f + 60 * Math.exp(-t * 30)) * t) * Math.exp(-t * 22);
  }
  return b;
};
function note(midi: number, dur: number) {
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const b = buf(dur);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    let v = 0;
    for (let h = 1; h <= 5; h++) v += (Math.sin(2 * Math.PI * f * h * (1 + 0.0004 * h * h) * t) / (h * h)) * Math.exp(-t * (1.1 + h * 0.7));
    b[i] = v * Math.min(1, t / 0.012);
  }
  return b;
}

export function genererBlocs(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));
  // vent nocturne (boucle de 8 s, fondu de bouclage)
  const vent = bruit(8, 11, (t) => 320 + 180 * Math.sin((2 * Math.PI * t) / 8) + 90 * Math.sin((2 * Math.PI * t) / 2.7), (t) => (0.6 + 0.4 * Math.sin((2 * Math.PI * t) / 4 + 1)) * Math.min(1, t / 0.4, (8 - t) / 0.4));
  out("vent", vent, 0.5);
  // tic (aiguille) et « toc » de minuit
  out("tic", bruit(0.05, 3, () => 5000, (t) => Math.exp(-t * 160)), 0.6);
  out("toc", coup(220, 0.25, 4), 0.7);
  // interrupteur
  const inter = buf(0.12);
  ajouter(inter, bruit(0.04, 5, () => 6000, (t) => Math.exp(-t * 200)), 0);
  ajouter(inter, coup(600, 0.06, 6), 0.03, 0.5);
  out("interrupteur", inter, 0.8);
  // souffle : la bougie s'éteint
  out("souffle", bruit(0.45, 7, (t) => 1800 * Math.exp(-t * 4) + 300, (t) => Math.sin(Math.PI * Math.min(1, t / 0.45)) ** 2), 0.6);
  // trois coups à la porte
  const porte = buf(1.1);
  [0.02, 0.32, 0.62].forEach((t, i) => ajouter(porte, coup(140 + i * 6, 0.22, 20 + i), t));
  out("coups", porte, 0.85);
  // pas (4 pas feutrés)
  const pas = buf(1.4);
  [0, 0.34, 0.68, 1.02].forEach((t, i) => ajouter(pas, bruit(0.12, 30 + i, () => 500, (x) => Math.exp(-x * 40)), t));
  out("pas", pas, 0.5);
  // papier / enveloppe
  const papier = buf(0.7);
  for (let i = 0; i < 9; i++) ajouter(papier, bruit(0.06, 40 + i, () => 7000, (t) => Math.exp(-t * 70)), 0.03 + i * 0.07 + (i % 3) * 0.01, 0.5 + (i % 2) * 0.5);
  out("papier", papier, 0.5);
  // piano discret (la mineur → fa → do → dernière note), 10 s
  const piano = buf(10.5);
  const motif: Array<[number, number]> = [[57, 0], [64, 0.7], [69, 1.4], [72, 2.1], [53, 3.0], [60, 3.7], [65, 4.4], [69, 5.1], [48, 6.0], [55, 6.7], [64, 7.4], [69, 8.4]];
  for (const [m, t] of motif) ajouter(piano, note(m, 3.2), t, m < 56 ? 0.8 : 0.6);
  out("piano", piano, 0.6);
  return ["vent", "tic", "toc", "interrupteur", "souffle", "coups", "pas", "papier", "piano"];
}
