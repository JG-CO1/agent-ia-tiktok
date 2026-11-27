/**
 * Sons de la mise en scène « huss » (rebond de ballon, filet, crissement de baskets, souffle HUSS, foule, musique de
 * fête lointaine à 120 BPM) : 100 % synthétisés par nos soins, déterministes, aucun échantillon externe.
 * Générés par `npx tsx scripts/gen-sfx-ville.ts` dans video/public/sfx/ville/.
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
/** Bruit passe-bas à un pôle (coupure variable) multiplié par une enveloppe. */
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
/** Bruit passe-haut (bruit moins son passe-bas) : cymbales, filet. */
function bruitHaut(sec: number, seed: number, coupe: (t: number) => number, env: (t: number) => number) {
  const b = buf(sec);
  const r = rng(seed);
  let y = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const a = 1 - Math.exp((-2 * Math.PI * coupe(t)) / SR);
    const x = r() * 2 - 1;
    y += a * (x - y);
    b[i] = (x - y) * env(t);
  }
  return b;
}
function ajouter(dst: Float32Array, src: Float32Array, a: number, gain = 1, circulaire = false) {
  const o = Math.round(a * SR);
  for (let i = 0; i < src.length; i++) {
    const j = o + i;
    if (j < dst.length) dst[j] += src[i] * gain;
    else if (circulaire) dst[j % dst.length] += src[i] * gain;
  }
}

/** Rebond de ballon sur un terrain : « boum » grave qui descend + claque sèche. */
function rebond(): Float32Array {
  const b = bruit(0.42, 5, () => 2400, (t) => Math.exp(-t * 55) * 0.7);
  let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const f = 70 + 95 * Math.exp(-t * 38);
    ph += (2 * Math.PI * f) / SR;
    b[i] += Math.sin(ph) * Math.exp(-t * 17) * 1.1;
    b[i] += Math.sin(2 * Math.PI * 310 * t) * Math.exp(-t * 60) * 0.18;
  }
  return norm(b, 0.9);
}

export function genererVille(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));

  out("rebond", rebond(), 0.9);

  // filet qui claque : souffle aigu court, filtré vers le grave
  out("filet", bruitHaut(0.5, 7, (t) => 3500 - 2300 * Math.min(1, t * 4), (t) => Math.sin(Math.PI * Math.min(1, t / 0.45)) ** 1.5 * Math.exp(-t * 3)), 0.6);

  // crissement de baskets : deux petits cris aigus
  const cris = buf(0.42);
  for (const [t0, f0, f1] of [[0.0, 1700, 2500], [0.2, 1500, 2300]] as Array<[number, number, number]>) {
    const n = Math.round(0.14 * SR);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const f = f0 + ((f1 - f0) * i) / n;
      ph += (2 * Math.PI * f) / SR;
      const v = (Math.sin(ph) + 0.5 * Math.sin(2 * ph + 0.4) + 0.25 * Math.sin(3 * ph)) * Math.sin(Math.PI * (i / n)) ** 1.2;
      cris[Math.round(t0 * SR) + i] += v * 0.5;
    }
  }
  out("crissement", cris, 0.45);

  // atterrissage : choc sourd sur le terrain
  out("atterrissage", (() => {
    const b = bruit(0.3, 11, () => 700, (t) => Math.exp(-t * 40) * 0.8);
    for (let i = 0; i < b.length; i++) b[i] += Math.sin(2 * Math.PI * (82 + 40 * Math.exp(-(i / SR) * 30)) * (i / SR)) * Math.exp(-(i / SR) * 20);
    return b;
  })(), 0.7);

  // souffle « HUSS » : expiration courte et ronde
  out("huss", bruit(0.34, 13, (t) => 3200 * Math.exp(-t * 7) + 650, (t) => Math.min(1, t / 0.035) * Math.exp(-t * 9)), 0.55);

  // murmure de foule lointaine (boucle de 8 s, bords fondus)
  const foule = bruit(8, 17, (t) => 520 + 260 * Math.sin((2 * Math.PI * t) / 8) + 140 * Math.sin((2 * Math.PI * t) / 2.3), (t) => (0.65 + 0.35 * Math.sin((2 * Math.PI * t) / 4 + 0.7)) * Math.min(1, t / 0.5, (8 - t) / 0.5));
  out("foule", foule, 0.5);

  // musique de fête (2 mesures à 120 BPM = 4 s exactes, bouclable à l'échantillon près)
  const BEAT = 0.5;
  const musique = buf(8 * BEAT);
  const pas = (i: number) => i * BEAT;
  for (let i = 0; i < 8; i++) {
    // grosse caisse sur chaque temps
    const kick = buf(0.4);
    let ph = 0;
    for (let k = 0; k < kick.length; k++) {
      const t = k / SR;
      ph += (2 * Math.PI * (48 + 130 * Math.exp(-t * 28))) / SR;
      kick[k] = Math.sin(ph) * Math.exp(-t * 9);
    }
    ajouter(musique, kick, pas(i), 1.0, true);
    // clap sur les temps 2 et 4
    if (i % 2 === 1) ajouter(musique, bruit(0.2, 20 + i, () => 2200, (t) => Math.exp(-t * 26) * 0.55), pas(i), 0.8, true);
    // charleston sur les contretemps
    ajouter(musique, bruitHaut(0.09, 30 + i, () => 7000, (t) => Math.exp(-t * 55)), pas(i) + BEAT / 2, 0.22, true);
    ajouter(musique, bruitHaut(0.05, 50 + i, () => 8000, (t) => Math.exp(-t * 90)), pas(i), 0.1, true);
  }
  // basse : une note par croche, la mineur → fa → do → sol
  const racines = [45, 45, 41, 41, 48, 48, 43, 43];
  for (let i = 0; i < 8; i++) {
    for (const [dec, midi] of [[0.5, racines[i]], [0.75, racines[i] + 12]] as Array<[number, number]>) {
      const f = 440 * Math.pow(2, (midi - 69) / 12);
      const n = buf(0.24);
      for (let k = 0; k < n.length; k++) {
        const t = k / SR;
        const saw = 2 * ((t * f) % 1) - 1;
        n[k] = (saw * 0.6 + Math.sin(2 * Math.PI * f * t) * 0.6) * Math.exp(-t * 8) * Math.min(1, t / 0.006);
      }
      ajouter(musique, n, pas(i) + (dec === 0.5 ? 0 : BEAT / 2), dec === 0.5 ? 0.55 : 0.3, true);
    }
  }
  // accords en contretemps (accord à trois notes, timbre carré adouci)
  const accords: number[][] = [[69, 72, 76], [65, 69, 72], [72, 76, 79], [67, 71, 74]];
  for (let m = 0; m < 2; m++) {
    for (const [i] of [[0.5], [2.5]] as Array<[number]>) {
      const accord = accords[(m * 2 + (i > 1 ? 1 : 0)) % 4];
      const n = buf(0.3);
      for (const midi of accord) {
        const f = 440 * Math.pow(2, (midi - 69) / 12);
        for (let k = 0; k < n.length; k++) {
          const t = k / SR;
          n[k] += (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * 3 * f * t)) * Math.exp(-t * 10) * 0.12;
        }
      }
      ajouter(musique, n, (m * 4 + i) * BEAT, 1, true);
    }
  }
  // « lointain » : passe-bas léger (la fête est à l'autre bout de la rue)
  let y = 0;
  const a = 1 - Math.exp((-2 * Math.PI * 3200) / SR);
  for (let i = 0; i < musique.length; i++) {
    y += a * (musique[i] - y);
    musique[i] = y;
  }
  out("fete", musique, 0.8);

  return ["rebond", "filet", "crissement", "atterrissage", "huss", "foule", "fete"];
}
