/**
 * Sons propres à « Dans cette ville, tout le monde s'appelle Alex… » : murmure de ville ensoleillée (boucle), pas de foule
 * parfaitement synchronisés, cloche d'école, « hey » grave de foule (non parlé), claquement des trente têtes qui se retournent,
 * bourdonnement froid du sous-sol (boucle), soupir de cabine qui s'ouvre, bips du panneau à diodes, givre qui se dissipe,
 * plaque qui s'allume, respiration lente derrière la vitre (boucle). 100 % synthétisés (déterministes, aucun échantillon externe).
 * Générés par `npx tsx scripts/gen-sfx-prenomunique.ts` dans video/public/sfx/prenomunique/.
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
const sin = (f: number, t: number, ph = 0) => Math.sin(TAU * f * t + ph);
function norm(b: Float32Array, peak: number) {
  let m = 0;
  for (const v of b) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] = (b[i] / m) * peak;
  return b;
}
/** Bruit passe-bande (filtre à variable d'état), fréquence centrale variable dans le temps. */
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
function fonduBoucle(b: Float32Array, s = 0.25) {
  const n = Math.round(s * SR);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    b[i] *= k;
    b[b.length - 1 - i] *= k;
  }
  return b;
}
const gauss = (f: number, c: number, w: number) => Math.exp(-(((f - c) / w) ** 2));

export function genererPrenomunique(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));
  const L = 16;

  // --- murmure de ville ensoleillée (boucle 16 s) : souffle large, babil lointain, quelques oiseaux
  const vj = bande(L, 7, () => 650, 0.55, () => 0.05);
  const rb = rng(21);
  for (let g = 0; g < 70; g++) {
    const t0 = rb() * (L - 0.5);
    const f = 260 + rb() * 700;
    const d = 0.1 + rb() * 0.18;
    const s = bande(d + 0.05, 100 + g, () => f, 2.4, (t) => Math.sin((Math.PI * Math.min(1, t / d)) ** 1) ** 2 * 0.07);
    ajouter(vj, s, t0);
  }
  for (let g = 0; g < 16; g++) {
    const t0 = 0.4 + rb() * (L - 1.2);
    const f0 = 3200 + rb() * 1600;
    const n = Math.round(0.16 * SR);
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const f = f0 * (1 + 0.4 * Math.sin((Math.PI * t) / 0.16)) ;
      c[i] = sin(f, t) * Math.sin((Math.PI * i) / n) ** 2 * 0.06;
    }
    ajouter(vj, c, t0);
  }
  out("ville-jour", fonduBoucle(vj, 0.5), 0.5);

  // --- pas de foule en phase : un seul « boum » net (tous au même instant) + traînée de semelles, 0,45 s
  const pas = buf(0.45);
  for (let v = 0; v < 8; v++) {
    const dec = v * 0.0035;
    for (let i = 0; i < Math.round(0.4 * SR); i++) {
      const t = i / SR;
      if (t < dec) continue;
      const u = t - dec;
      pas[i] += (sin(72 - 28 * Math.min(1, u * 9), u) * Math.exp(-u * 20) * 0.9 + sin(150, u) * Math.exp(-u * 40) * 0.3) * 0.14;
    }
  }
  const sem = bande(0.45, 31, () => 1500, 1.1, (t) => Math.exp(-t * 36) * Math.min(1, t * 300) * 0.9);
  for (let i = 0; i < pas.length; i++) pas[i] += sem[i] * 0.5;
  out("pas", pas, 0.85);

  // --- cloche d'école (2,4 s) : sonnerie électrique, deux notes en alternance rapide
  const cl = buf(2.4);
  for (let i = 0; i < cl.length; i++) {
    const t = i / SR;
    const gate = t < 1.9 ? (Math.sin(TAU * 18 * t) > 0 ? 1 : 0.15) : 0;
    const f = Math.sin(TAU * 9 * t) > 0 ? 1850 : 1970;
    cl[i] = (sin(f, t) * 0.7 + sin(f * 2.76, t) * 0.18 + sin(f * 4.1, t) * 0.07) * gate * Math.min(1, t * 200) * (t > 1.7 ? Math.max(0, 1 - (t - 1.7) / 0.2) : 1);
  }
  out("cloche", cl, 0.6);

  // --- « hey » grave de foule (non parlé) : harmoniques d'une voix grave, formants qui glissent, trois voix désaccordées, 0,95 s
  const hey = buf(0.95);
  for (const f0 of [112, 119, 126, 106]) {
    for (let i = 0; i < hey.length; i++) {
      const t = i / SR;
      const u = Math.min(1, t / 0.5);
      const f1 = 520 - 220 * u;
      const f2 = 1700 + 600 * u;
      const env = Math.min(1, t / 0.03) * Math.exp(-Math.max(0, t - 0.08) * 3.8);
      let v = 0;
      for (let h = 1; h <= 28; h++) {
        const fr = f0 * h * (1 + 0.012 * Math.sin(TAU * 5 * t));
        const amp = (gauss(fr, f1, 160) + 0.55 * gauss(fr, f2, 280) + 0.1 * gauss(fr, 3200, 700)) / Math.sqrt(h);
        v += sin(fr, t, h) * amp;
      }
      hey[i] += v * env * 0.12;
    }
  }
  out("hey", hey, 0.75);

  // --- claquement synchronisé des trente têtes (0,55 s) : trente « tocs » à 3 ms d'écart, froissement de tissu
  const cq = buf(0.55);
  const rq = rng(9);
  for (let v = 0; v < 30; v++) {
    const dec = rq() * 0.03;
    const f = 1500 + rq() * 1200;
    ajouter(cq, bande(0.12, 200 + v, () => f, 1.6, (t) => Math.exp(-t * 55) * Math.min(1, t * 900)), dec, 0.18);
    for (let i = 0; i < Math.round(0.12 * SR); i++) {
      const t = i / SR;
      const j = Math.round((dec + t) * SR);
      if (j < cq.length) cq[j] += sin(150 + 30 * rq(), t) * Math.exp(-t * 28) * 0.12;
    }
  }
  ajouter(cq, bande(0.5, 77, () => 3200, 0.8, (t) => Math.exp(-t * 7) * 0.5), 0.02, 0.2);
  out("claque", cq, 0.8);

  // --- bourdonnement froid du sous-sol (boucle 16 s) : 50 Hz et harmoniques qui battent, ronflement de néon, air
  const bo = buf(L);
  for (let i = 0; i < bo.length; i++) {
    const t = i / SR;
    bo[i] = (sin(50, t) * 0.5 + sin(100.7, t) * 0.34 + sin(151.2, t) * 0.18 + sin(201.9, t) * 0.1 + sin(300.5, t) * 0.04) * (0.8 + 0.2 * Math.sin((TAU * t) / 8));
  }
  const ne = bande(L, 91, () => 5200, 2.8, (t) => 0.02 * (0.6 + 0.4 * Math.sin(TAU * 100 * t) ** 2));
  const air = bande(L, 93, (t) => 1500 + 400 * Math.sin((TAU * t) / 6), 0.5, () => 0.035);
  for (let i = 0; i < bo.length; i++) bo[i] += ne[i] + air[i];
  out("bourdon", fonduBoucle(bo, 0.6), 0.5);

  // --- soupir de cabine (1,8 s) : jet d'air pneumatique qui retombe + « clonk » grave
  const so = bande(1.8, 41, (t) => 3400 * Math.exp(-t * 1.7) + 700, 0.9, (t) => Math.min(1, t * 60) * Math.exp(-t * 2.2));
  for (let i = 0; i < so.length; i++) {
    const t = i / SR;
    so[i] += sin(92, t) * Math.exp(-t * 14) * 0.45 + sin(46, t) * Math.exp(-t * 9) * 0.3;
  }
  out("soupir", so, 0.75);

  // --- bip de diode (0,06 s) et validation du compteur (0,9 s)
  const tic = buf(0.06);
  for (let i = 0; i < tic.length; i++) {
    const t = i / SR;
    tic[i] = Math.sign(sin(2350, t)) * 0.4 * Math.exp(-t * 70) * Math.min(1, t * 1500) + sin(2350, t) * 0.4 * Math.exp(-t * 70);
  }
  out("tic-led", tic, 0.6);
  const va = buf(0.9);
  for (let i = 0; i < va.length; i++) {
    const t = i / SR;
    va[i] = sin(1760, t) * Math.exp(-t * 6) * Math.min(1, t * 400) + (t > 0.12 ? sin(2349, t - 0.12) * Math.exp(-(t - 0.12) * 5) * Math.min(1, (t - 0.12) * 400) : 0);
  }
  out("valide", va, 0.55);

  // --- givre qui se dissipe (1,8 s) : scintillements de verre, balayage aigu descendant
  const gi = bande(1.8, 51, (t) => 9000 * Math.exp(-t * 1.1) + 1800, 1.4, (t) => Math.min(1, t * 8) * Math.exp(-t * 1.6) * 0.8);
  const rg = rng(65);
  for (let g = 0; g < 14; g++) {
    const t0 = rg() * 1.3;
    const f = 2600 + rg() * 5200;
    for (let i = 0; i < Math.round(0.4 * SR); i++) {
      const t = i / SR;
      const j = Math.round((t0 + t) * SR);
      if (j < gi.length) gi[j] += (sin(f, t) + sin(f * 2.4, t) * 0.3) * Math.exp(-t * 14) * 0.12;
    }
  }
  out("givre", gi, 0.55);

  // --- plaque qui s'allume (1,3 s) : bourdon électrique qui monte, « tchak » sec, impact grave
  const pl = buf(1.3);
  for (let i = 0; i < pl.length; i++) {
    const t = i / SR;
    const f = 100 + 60 * Math.min(1, t * 5);
    let v = 0;
    for (let h = 1; h <= 12; h++) v += sin(f * h, t) / h;
    pl[i] = v * Math.exp(-t * 3.2) * Math.min(1, t * 100) * 0.3 + sin(55, t) * Math.exp(-t * 6) * 0.9;
  }
  ajouter(pl, bande(0.1, 5, () => 3000, 1.2, (t) => Math.exp(-t * 60)), 0.0, 0.5);
  out("plaque", pl, 0.8);

  // --- respiration lente derrière la vitre (boucle 6 s) : inspiration puis expiration, très douce
  const re = bande(6, 81, (t) => 650 + 250 * Math.sin((TAU * t) / 3), 0.7, (t) => Math.max(0, Math.sin((TAU * t) / 3 - 0.4)) ** 1.5 * 0.12);
  out("respire", fonduBoucle(re, 0.3), 0.5);

  return ["ville-jour", "pas", "cloche", "hey", "claque", "bourdon", "soupir", "tic-led", "valide", "givre", "plaque", "respire"].map((n) => `${n}.wav`);
}
