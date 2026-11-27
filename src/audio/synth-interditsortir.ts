/**
 * Sons propres à « Interdit de sortir » : sirène (boucle montante/descendante), sirène lointaine, vent de vallée (boucle), pas sur pierre,
 * chaîne, porte scellée qui gémit, grande porte qui s'ouvre, écho de la vallée, fusée, explosion, crépitement d'étincelles, nappe finale
 * ouverte (boucle). 100 % synthétisés (déterministes, aucun échantillon externe).
 * Générés par `npx tsx scripts/gen-sfx-interditsortir.ts` dans video/public/sfx/interditsortir/.
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
const TAU = Math.PI * 2;
const buf = (sec: number) => new Float32Array(Math.round(sec * SR));
function norm(b: Float32Array, peak: number) {
  let m = 0;
  for (const v of b) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] = (b[i] / m) * peak;
  return b;
}
/** Bruit filtré passe-bande (fréquence centrale variable). */
function bande(sec: number, seed: number, centre: (t: number) => number, q: number, env: (t: number) => number) {
  const b = buf(sec);
  const r = rng(seed);
  let lp = 0;
  let bp = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const f = 2 * Math.sin((Math.PI * Math.min(centre(t), SR * 0.45)) / SR);
    const x = r() * 2 - 1;
    lp += f * bp;
    const hp = x - lp - bp / q;
    bp += f * hp;
    b[i] = bp * env(t);
  }
  return b;
}
function ajouter(dst: Float32Array, src: Float32Array, a: number, gain = 1) {
  const o = Math.round(a * SR);
  for (let i = 0; i < src.length && o + i < dst.length; i++) dst[o + i] += src[i] * gain;
}
function fonduBoucle(b: Float32Array, s = 0.3) {
  const n = Math.round(s * SR);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    b[i] *= k;
    b[b.length - 1 - i] *= k;
  }
  return b;
}
const enveloppe = (t: number, a: number, d: number) => Math.min(1, t / a) * Math.exp(-t * d);

/** Sirène d'alerte : glissando 380 → 920 Hz puis retour, harmoniques, trémolo, 8 s (deux cycles de 4 s). */
function sirene(sec: number, grain: number) {
  const b = buf(sec);
  let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const cyc = (t % 4) / 4;
    const k = cyc < 0.5 ? cyc * 2 : 2 - cyc * 2;
    const f = 380 + 540 * (k * k * (3 - 2 * k));
    ph += (TAU * f) / SR;
    const v = Math.sin(ph) + 0.55 * Math.sin(2 * ph + 0.4) + 0.3 * Math.sin(3 * ph) + 0.15 * Math.sin(5 * ph);
    b[i] = Math.tanh(v * grain) * (0.8 + 0.2 * Math.sin(TAU * 6 * t));
  }
  return b;
}

export function genererInterditsortir(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));
  const fait: string[] = [];

  // --- sirène (boucle 8 s) et sirène lointaine (adoucie, filtrée)
  const s1 = fonduBoucle(sirene(8, 1.6), 0.25);
  out("sirene", s1, 0.9);
  const loin = sirene(8, 1.0);
  let lp = 0;
  for (let i = 0; i < loin.length; i++) {
    lp += 0.07 * (loin[i] - lp);
    loin[i] = lp;
  }
  out("sirene-loin", fonduBoucle(loin, 0.25), 0.8);
  fait.push("sirene", "sirene-loin");

  // --- vent de vallée (boucle 16 s) : souffle bas qui gonfle et siffle, vague lente
  const L = 16;
  const vent = bande(L, 11, (t) => 380 + 260 * Math.sin(TAU * t / 8) + 120 * Math.sin(TAU * t / 3.1), 1.4, (t) => 0.55 + 0.45 * Math.sin(TAU * (t / 8) + 1));
  const sifflement = bande(L, 13, (t) => 1500 + 500 * Math.sin(TAU * t / 5.3), 9, (t) => 0.12 * (0.5 + 0.5 * Math.sin(TAU * t / 6.1)));
  for (let i = 0; i < vent.length; i++) vent[i] += sifflement[i];
  out("vent-vallee", fonduBoucle(vent, 0.5), 0.8);
  fait.push("vent-vallee");

  // --- pas sur la pierre : claquement sec + résonance sourde, 0,35 s
  const pas = bande(0.35, 21, () => 1200, 1.8, (t) => Math.exp(-t * 38));
  for (let i = 0; i < pas.length; i++) {
    const t = i / SR;
    pas[i] += Math.sin(TAU * 110 * t) * Math.exp(-t * 26) * 0.6;
  }
  out("pas-pierre", pas, 0.8);
  fait.push("pas-pierre");

  // --- chaîne qui cliquette : une grappe de petits chocs métalliques, 1,6 s
  const chaine = buf(1.6);
  const r = rng(31);
  for (let k = 0; k < 26; k++) {
    const t0 = r() * 1.2;
    const f = 1800 + r() * 2600;
    const n = Math.round(0.14 * SR);
    const j0 = Math.round(t0 * SR);
    for (let i = 0; i < n && j0 + i < chaine.length; i++) {
      const t = i / SR;
      chaine[j0 + i] += (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2.7 * t)) * Math.exp(-t * 38) * (0.3 + r() * 0.5);
    }
  }
  out("chaine", chaine, 0.75);
  fait.push("chaine");

  // --- porte scellée qui gémit (poussée du vent) : glissando grave, craquements, 2,4 s
  const gem = buf(2.4);
  let ph = 0;
  for (let i = 0; i < gem.length; i++) {
    const t = i / SR;
    const f = 95 + 40 * Math.sin(TAU * 1.3 * t) + 25 * t;
    ph += (TAU * f) / SR;
    const e = Math.sin(Math.PI * Math.min(1, t / 2.4)) ** 1.5;
    gem[i] = (Math.sin(ph) + 0.6 * Math.sin(2.01 * ph) + 0.4 * Math.sin(3.02 * ph)) * e * 0.6;
  }
  const crack = bande(2.4, 41, () => 700, 3, (t) => (Math.sin(TAU * 11 * t) > 0.85 ? 0.7 : 0.03));
  for (let i = 0; i < gem.length; i++) gem[i] += crack[i] * 0.5;
  out("porte-scellee", gem, 0.8);
  fait.push("porte-scellee");

  // --- grande porte qui s'ouvre : chaînes qui tombent, grincement long, grondement de pierre, 4 s
  const ouv = buf(4);
  ajouter(ouv, chaine, 0, 0.9);
  const gr = buf(3.4);
  ph = 0;
  for (let i = 0; i < gr.length; i++) {
    const t = i / SR;
    const f = 70 + 70 * (t / 3.4) + 18 * Math.sin(TAU * 2.2 * t);
    ph += (TAU * f) / SR;
    const e = Math.min(1, t / 0.4) * Math.min(1, (3.4 - t) / 0.8);
    gr[i] = (Math.sin(ph) + 0.7 * Math.sin(2.02 * ph) + 0.5 * Math.sin(3.05 * ph) + 0.3 * Math.sin(4.1 * ph)) * e * 0.5;
  }
  ajouter(ouv, gr, 0.3, 1);
  ajouter(ouv, bande(3.4, 51, (t) => 160 + 60 * t, 2, (t) => Math.min(1, t / 0.5) * Math.min(1, (3.4 - t) / 0.6) * 0.8), 0.3, 0.7);
  const boom = buf(1.5);
  for (let i = 0; i < boom.length; i++) {
    const t = i / SR;
    boom[i] = Math.sin(TAU * (52 - 14 * t) * t) * Math.exp(-t * 3.2);
  }
  ajouter(ouv, boom, 0.1, 0.9);
  out("porte-ouvre", ouv, 0.85);
  fait.push("porte-ouvre");

  // --- écho de la vallée : un coup sourd répété, de plus en plus lointain et feutré, 4,5 s
  const echo = buf(4.5);
  for (let k = 0; k < 5; k++) {
    const t0 = k * 0.78;
    const g = Math.pow(0.5, k);
    const c = buf(1.0);
    for (let i = 0; i < c.length; i++) {
      const t = i / SR;
      c[i] = (Math.sin(TAU * (190 - 80 * k * 0.1) * t) * Math.exp(-t * (9 + k * 3)) + (rng(i + k)() * 2 - 1) * Math.exp(-t * 40) * 0.2);
    }
    ajouter(echo, c, t0, g);
  }
  out("echo", echo, 0.7);
  fait.push("echo");

  // --- fusée : sifflement montant, 1,4 s (puis le décor déclenche l'explosion)
  const fus = bande(1.5, 61, (t) => 700 + 3800 * (t / 1.4) ** 1.6, 6, (t) => Math.min(1, t / 0.2) * (t < 1.4 ? 0.8 : 0));
  out("fusee", fus, 0.7);
  fait.push("fusee");

  // --- explosion de feu d'artifice : boum grave + éclat large + traîne de crépitements, 3,4 s
  const ex = buf(3.4);
  for (let i = 0; i < ex.length; i++) {
    const t = i / SR;
    ex[i] = Math.sin(TAU * (78 - 40 * Math.min(1, t * 2)) * t) * Math.exp(-t * 2.4) * 0.95;
  }
  ajouter(ex, bande(3.4, 71, (t) => 3000 * Math.exp(-t * 1.6) + 400, 1.2, (t) => Math.exp(-t * 3)), 0, 1.0);
  const cr = rng(72);
  for (let k = 0; k < 90; k++) {
    const t0 = 0.15 + cr() * 2.6;
    const f = 2500 + cr() * 4500;
    const n = Math.round(0.05 * SR);
    const j0 = Math.round(t0 * SR);
    for (let i = 0; i < n && j0 + i < ex.length; i++) ex[j0 + i] += Math.sin(TAU * f * (i / SR)) * Math.exp(-(i / SR) * 90) * 0.25 * Math.exp(-t0 * 0.7);
  }
  out("explosion", ex, 0.95);
  fait.push("explosion");

  // --- nappe finale ouverte (boucle 16 s) : accord majeur large, lent, lumineux
  const nap = buf(16);
  const notes = [110, 164.81, 220, 277.18, 329.63, 440];
  for (let i = 0; i < nap.length; i++) {
    const t = i / SR;
    let v = 0;
    notes.forEach((f, k) => {
      v += Math.sin(TAU * f * t + Math.sin(TAU * 0.13 * t + k)) * (0.5 + 0.5 * Math.sin(TAU * (0.08 + 0.02 * k) * t + k * 1.7)) / (1 + k * 0.35);
    });
    nap[i] = v * 0.4;
  }
  out("nappe-finale", fonduBoucle(nap, 1.5), 0.7);
  fait.push("nappe-finale");

  // --- silence tendu : bourdon très grave qui monte (boucle 16 s), pour la fin du twist
  const tens = buf(16);
  for (let i = 0; i < tens.length; i++) {
    const t = i / SR;
    tens[i] = (Math.sin(TAU * 55 * t) + 0.6 * Math.sin(TAU * 82.4 * t + 1) + 0.3 * Math.sin(TAU * 58 * t)) * (0.4 + 0.3 * Math.sin(TAU * 0.25 * t));
  }
  out("tension", fonduBoucle(tens, 1.5), 0.6);
  fait.push("tension");
  return fait;
}
