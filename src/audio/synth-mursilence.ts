/**
 * Sons propres à « Mur du silence » : silence habité (ton de pièce, tic-tac d'horloge), briques qui se posent (clac sourd, cascade
 * accélérée), battement lent du mur (deux coups très graves), murmure indistinct derrière les briques, grattement de la main sur
 * la brique, chute de brique au ralenti, effondrement (grondement, avalanche de briques, poussière), tasse de thé, souffle de
 * maman, nappe chaude qui s'ouvre (accord majeur), rue de quartier. 100 % synthétisés (déterministes, aucun échantillon externe).
 * Générés par `npx tsx scripts/gen-sfx-mursilence.ts` dans video/public/sfx/mursilence/.
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
/** Bruit passe-bas (coupure variable) × enveloppe. */
function bruit(sec: number, seed: number, coupe: (t: number) => number, env: (t: number) => number) {
  const b = buf(sec);
  const r = rng(seed);
  let y = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    y += (1 - Math.exp((-TAU * coupe(t)) / SR)) * (r() * 2 - 1 - y);
    b[i] = y * env(t);
  }
  return b;
}
/** Bruit passe-bande (deux pôles). */
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
const expo = (t: number, d: number) => Math.exp(-t / d);
const att = (t: number, a: number) => Math.min(1, t / a);
function fondu(b: Float32Array, entree = 0.01, sortie = 0.05) {
  const n = Math.round(entree * SR);
  const m = Math.round(sortie * SR);
  for (let i = 0; i < n && i < b.length; i++) b[i] *= i / n;
  for (let i = 0; i < m && i < b.length; i++) b[b.length - 1 - i] *= i / m;
  return b;
}

/** Un « clac » de brique qui se pose : toc sec de pierre sur pierre + corps grave. */
function clac(seed: number, hauteur = 1, duree = 0.32) {
  const b = buf(duree);
  const n = bruit(duree, seed, (t) => 3200 * hauteur * expo(t, 0.03) + 500, (t) => expo(t, 0.028) * att(t, 0.001));
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    b[i] = n[i] * 0.9 + sin(150 * hauteur, t) * expo(t, 0.06) * 0.7 + sin(310 * hauteur, t, 1) * expo(t, 0.035) * 0.3;
  }
  return fondu(b, 0.0005, 0.02);
}

export function genererMursilence(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));
  const L = 16;

  // --- ton de pièce (boucle 16 s) : souffle très bas, bourdonnement de frigo, quelques craquements de maison
  const piece = bruit(L, 5, () => 260, () => 0.05);
  const rp = rng(11);
  for (let i = 0; i < piece.length; i++) {
    const t = i / SR;
    piece[i] += sin(100, t) * 0.012 * (0.7 + 0.3 * sin(0.25, t)) + sin(200, t, 0.5) * 0.004;
  }
  for (let g = 0; g < 5; g++) {
    const t0 = 1.2 + rp() * (L - 2.5);
    ajouter(piece, bande(0.3, 70 + g, () => 700 + rp() * 400, 3, (t) => expo(t, 0.06) * 0.2), t0);
  }
  out("piece", piece, 0.4);

  // --- horloge : tic puis toc (boucle de 2 s, un coup par seconde)
  const tt = buf(2);
  for (const [t0, f, a] of [[0, 1900, 1], [1, 1450, 0.85]] as Array<[number, number, number]>) {
    const c = buf(0.12);
    for (let i = 0; i < c.length; i++) {
      const t = i / SR;
      c[i] = (sin(f, t) * 0.5 + sin(f * 2.7, t) * 0.25) * expo(t, 0.012) + (Math.sin(i * 12.9898) * 0.5) * expo(t, 0.004);
    }
    ajouter(tt, c, t0, a);
  }
  out("tictac", tt, 0.5);

  // --- brique posée, trois variantes ; cascade de briques en vague accélérée (les trois premières secondes du film)
  out("clac-a", clac(21, 1.0), 0.8);
  out("clac-b", clac(22, 0.82), 0.8);
  out("clac-c", clac(23, 1.18), 0.8);
  const cas = buf(2.2);
  const rc = rng(77);
  let tc = 0;
  for (let k = 0; k < 26; k++) {
    ajouter(cas, clac(100 + k, 0.8 + rc() * 0.5, 0.28), tc, 0.55 + rc() * 0.45);
    tc += 0.14 * Math.pow(0.93, k) + rc() * 0.03;
  }
  out("cascade", cas, 0.8);

  // --- battement du mur (1,7 s exactement : deux coups très graves, le second plus faible)
  const bat = buf(1.7);
  for (const [t0, a, f] of [[0.0, 1, 52], [0.3, 0.7, 64]] as Array<[number, number, number]>) {
    const c = buf(0.7);
    for (let i = 0; i < c.length; i++) {
      const t = i / SR;
      c[i] = (sin(f * (1 + 0.5 * expo(t, 0.07)), t) * 0.9 + sin(f * 2, t) * 0.25 * expo(t, 0.05)) * expo(t, 0.16) * att(t, 0.012);
    }
    ajouter(bat, c, t0, a);
    ajouter(bat, bruit(0.25, 9, () => 260, (t) => expo(t, 0.05) * 0.25), t0, a);
  }
  out("battement", bat, 0.95);

  // --- murmure indistinct (boucle 16 s) : deux voix chuchotées, syllabes lentes, formants qui glissent
  const mu = buf(L);
  for (let v = 0; v < 2; v++) {
    const w = bande(L, 31 + v, (t) => 520 + 380 * sin(0.0625 * (1 + v), t, v) + 260 * sin(0.4375, t, v * 2), 2.2, (t) => 0.5 * Math.max(0, sin(0.25 + 0.0625 * v, t, v)) ** 2 * (0.6 + 0.4 * sin(2.0 + v * 0.5, t)));
    ajouter(mu, w, 0);
  }
  out("murmure-mur", mu, 0.5);

  // --- main qui frotte la brique (grain sec)
  out("gratte", fondu(bande(1.0, 41, (t) => 1700 + 900 * sin(3, t), 1.6, (t) => 0.55 * (0.5 + 0.5 * sin(9, t, 1)) * Math.sin((Math.PI * t) / 1.0)), 0.04, 0.1), 0.5);

  // --- brique qui tombe au ralenti (3,4 s) : frottement de pierre qui se détache, long vol grave, choc sourd à 1,15 s, gravats
  const tb = buf(3.4);
  ajouter(tb, bande(1.1, 51, (t) => 260 + 420 * t, 1.8, (t) => 0.5 * Math.sin((Math.PI * t) / 1.1)), 0);
  for (let i = 0; i < tb.length; i++) {
    const t = i / SR;
    if (t > 0.4 && t < 1.2) tb[i] += sin(70 - 18 * (t - 0.4), t) * 0.12 * Math.sin((Math.PI * (t - 0.4)) / 0.8);
  }
  const imp = buf(1.4);
  for (let i = 0; i < imp.length; i++) {
    const t = i / SR;
    imp[i] = (sin(46 * (1 + 0.6 * expo(t, 0.05)), t) * 1.0 + sin(92, t) * 0.4 * expo(t, 0.08)) * expo(t, 0.22) * att(t, 0.004);
  }
  ajouter(imp, bruit(0.5, 52, (t) => 2600 * expo(t, 0.04) + 300, (t) => expo(t, 0.05) * 0.8), 0);
  ajouter(tb, imp, 1.15);
  for (let k = 0; k < 6; k++) ajouter(tb, clac(60 + k, 0.7 + k * 0.08, 0.25), 1.5 + k * 0.13 + (k % 2) * 0.05, 0.28 - k * 0.03);
  ajouter(tb, bruit(1.6, 53, () => 5200, (t) => expo(t, 0.5) * 0.06), 1.4);
  out("brique-tombe", tb, 0.95);

  // --- effondrement (6 s) : grondement montant puis avalanche de briques, poussière qui siffle et retombe
  const ef = buf(6);
  ajouter(ef, bruit(5.6, 61, (t) => 120 + 160 * Math.sin((Math.PI * Math.min(1, t / 2.2)) / 2), (t) => 0.9 * att(t, 0.35) * expo(Math.max(0, t - 1.6), 1.6)), 0);
  const rf = rng(63);
  for (let k = 0; k < 90; k++) {
    const t0 = 0.12 + rf() * rf() * 2.6 + k * 0.012;
    ajouter(ef, clac(200 + k, 0.55 + rf() * 0.9, 0.3), t0, (0.25 + rf() * 0.75) * expo(Math.max(0, t0 - 0.9), 1.4));
  }
  for (const [t0, a] of [[0.35, 1], [0.75, 0.85], [1.15, 0.7], [1.7, 0.5]] as Array<[number, number]>) {
    const c = buf(1.2);
    for (let i = 0; i < c.length; i++) {
      const t = i / SR;
      c[i] = (sin(40 * (1 + 0.5 * expo(t, 0.06)), t) + sin(83, t) * 0.4 * expo(t, 0.1)) * expo(t, 0.2) * att(t, 0.003);
    }
    ajouter(ef, c, t0, a);
  }
  ajouter(ef, bande(5.0, 64, (t) => 6200 - 2600 * Math.min(1, t / 4), 0.8, (t) => 0.1 * att(t, 0.6) * expo(t, 2.0)), 0.6);
  out("effondrement", ef, 0.95);

  // --- tasse de thé posée sur sa soucoupe, souffle de maman
  const ta = buf(0.9);
  for (let i = 0; i < ta.length; i++) {
    const t = i / SR;
    ta[i] = (sin(3150, t) * 0.5 + sin(4720, t, 1) * 0.35 + sin(6830, t, 2) * 0.15) * expo(t, 0.12) * att(t, 0.001);
  }
  out("tasse", fondu(ta, 0.001, 0.08), 0.6);
  out("souffle-chaud", fondu(bande(1.3, 71, (t) => 700 + 700 * Math.sin((Math.PI * t) / 1.3), 1.4, (t) => 0.7 * Math.sin((Math.PI * t) / 1.3) ** 2), 0.05, 0.2), 0.5);

  // --- nappe chaude qui s'ouvre (10 s) : accord de la majeur étoffé, attaque lente, scintillement doré
  const na = buf(10);
  const notes: Array<[number, number]> = [[110, 0.5], [164.8, 0.4], [220, 0.45], [277.2, 0.34], [329.6, 0.3], [415.3, 0.18], [440, 0.16], [554.4, 0.1]];
  for (let i = 0; i < na.length; i++) {
    const t = i / SR;
    const montee = Math.min(1, t / 3.2) ** 1.6;
    const ouvert = Math.min(1, t / 6);
    let v = 0;
    for (const [f, a] of notes) v += (sin(f, t) * 0.6 + sin(f * 2.003, t) * 0.18 * ouvert + sin(f * 0.997, t, 1) * 0.25) * a;
    const vib = 1 + 0.2 * sin(5.2, t);
    v += sin(880, t) * 0.05 * ouvert * vib + sin(1318.5, t, 1) * 0.035 * ouvert * (0.6 + 0.4 * sin(0.7, t));
    na[i] = v * montee * (0.85 + 0.15 * sin(0.3, t));
  }
  out("nappe-chaude", fondu(na, 0.2, 1.2), 0.5);

  // --- rue de quartier (boucle 16 s) : souffle de vent, grondement de ville lointain, rares oiseaux
  const ru = bruit(L, 81, () => 700, () => 0.06);
  ajouter(ru, bruit(L, 82, () => 120, () => 0.07), 0);
  const rr = rng(83);
  for (let g = 0; g < 9; g++) {
    const t0 = 0.5 + rr() * (L - 1.5);
    const f0 = 3000 + rr() * 1500;
    const n = Math.round(0.14 * SR);
    for (let i = 0; i < n; i++) {
      const j = Math.round(t0 * SR) + i;
      if (j < ru.length) ru[j] += sin(f0 * (1 + 0.35 * Math.sin((Math.PI * i) / n)), i / SR) * Math.sin((Math.PI * i) / n) * 0.05;
    }
  }
  out("rue", ru, 0.4);
  return ["piece", "tictac", "clac-a", "clac-b", "clac-c", "cascade", "battement", "murmure-mur", "gratte", "brique-tombe", "effondrement", "tasse", "souffle-chaud", "nappe-chaude", "rue"];
}
