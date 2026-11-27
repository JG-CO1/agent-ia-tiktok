/**
 * Sons propres à « Dans cette ville, les hamburgers sont interdits… » : néon qui grésille (boucle) et clic de clignotement,
 * jukebox lointain de style années 50 (boucle), sifflet de policier, cloche de verre, cliquetis de couverts, horloge (boucle),
 * balayage « effacement » (descendant, doux), croc dans le hamburger, page d'album qui se tourne, nappe mélancolique (boucle),
 * ambiance de rue au crépuscule (boucle) et souffle du grenier (boucle). 100 % synthétisés (déterministes, aucun échantillon externe).
 * Générés par `npx tsx scripts/gen-sfx-hamburgerinterdit.ts` dans video/public/sfx/hamburgerinterdit/.
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
/** Bruit passe-bande à fréquence variable (filtre à variables d'état). */
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
/** Note de type cloche / verre : partiels, décroissance exponentielle. */
function note(f: number, sec: number, decay: number, partiels: Array<[number, number]> = [[1, 1], [2.01, 0.3], [3.02, 0.12]], attaque = 0.003) {
  const n = buf(sec);
  for (let i = 0; i < n.length; i++) {
    const t = i / SR;
    let v = 0;
    for (const [m, a] of partiels) v += sin(f * m, t) * a;
    n[i] = v * Math.exp(-t * decay) * Math.min(1, t / attaque);
  }
  return n;
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
/** Filtre passe-bas à un pôle (son « lointain »). */
function passeBas(b: Float32Array, fc: number) {
  const a = 1 - Math.exp((-TAU * fc) / SR);
  let y = 0;
  for (let i = 0; i < b.length; i++) {
    y += a * (b[i] - y);
    b[i] = y;
  }
  return b;
}

export function genererHamburgerinterdit(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));
  const L = 16;

  // --- néon qui grésille (boucle 6 s) : ronflement du transformateur (100 Hz et harmoniques) + crépitements
  const ne = buf(6);
  const rn = rng(11);
  for (let i = 0; i < ne.length; i++) {
    const t = i / SR;
    ne[i] = (sin(100, t) * 0.5 + sin(200, t) * 0.32 + sin(300, t) * 0.16 + sin(600, t) * 0.07) * (0.8 + 0.2 * sin(0.7, t));
  }
  const buzz = bande(6, 13, () => 3200, 1.1, () => 0.05);
  for (let i = 0; i < ne.length; i++) ne[i] += buzz[i];
  for (let k = 0; k < 26; k++) {
    const t0 = rn() * 5.6;
    ajouter(ne, bande(0.04 + rn() * 0.05, 100 + k, () => 2500 + rn() * 3500, 1.6, (t) => Math.exp(-t * 55)), t0, 0.5 + rn() * 0.6);
  }
  out("neon", fonduBoucle(ne, 0.3), 0.5);

  // --- clic de clignotement : deux craquements secs et un « tonk » grave, 0,35 s
  const cl = buf(0.35);
  ajouter(cl, bande(0.05, 3, () => 3200, 1.8, (t) => Math.exp(-t * 70)), 0, 0.9);
  ajouter(cl, bande(0.04, 4, () => 4200, 1.8, (t) => Math.exp(-t * 90)), 0.09, 0.7);
  for (let i = 0; i < cl.length; i++) cl[i] += sin(110, i / SR) * Math.exp((-i / SR) * 30) * 0.5;
  out("neon-clic", cl, 0.6);

  // --- jukebox lointain (boucle 16 s) : do – la mineur – fa – sol, arpèges tendres filtrés, tempo 84
  const ju = buf(L);
  const accords: Array<[number, number, number]> = [[261.63, 329.63, 392], [220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]];
  const pas = 60 / 84 / 2;
  for (let k = 0; k * pas < L - 0.8; k++) {
    const ac = accords[Math.floor(k / 8) % 4];
    const f = ac[[0, 1, 2, 1, 0, 2, 1, 2][k % 8]] * (k % 8 === 7 ? 2 : 1);
    ajouter(ju, note(f, 1.0, 4.0, [[1, 1], [2.0, 0.3], [3.0, 0.12]], 0.004), k * pas, 0.5);
    if (k % 8 === 0) ajouter(ju, note(ac[0] / 2, 2.4, 1.4, [[1, 1], [2.0, 0.2]], 0.01), k * pas, 0.5);
  }
  passeBas(ju, 1900);
  for (let i = 0; i < ju.length; i++) ju[i] *= 0.8 + 0.2 * sin(5.2, i / SR); // léger tremolo
  out("jukebox", fonduBoucle(ju, 0.6), 0.5);

  // --- sifflet de policier : deux coups de sifflet à bille (sinus aigu, roulement), 0,9 s
  const si = buf(0.9);
  for (const [t0, d] of [[0.02, 0.3], [0.4, 0.42]] as Array<[number, number]>) {
    const n = Math.round(d * SR);
    const s = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const f = 2750 + 90 * Math.sin(TAU * 5 * t);
      s[i] = (sin(f, t) * 0.7 + sin(f * 2, t) * 0.12) * (0.65 + 0.35 * Math.sin(TAU * 42 * t)) * Math.min(1, t * 120) * Math.min(1, (d - t) * 60);
    }
    ajouter(si, s, t0, 0.8);
  }
  ajouter(si, bande(0.9, 5, () => 3400, 2.0, (t) => 0.05 * Math.min(1, t * 30)), 0, 0.5);
  out("sifflet", si, 0.55);

  // --- cloche de verre : tonk grave de la base + tintement de verre qui s'éteint, 1,8 s
  const cc = buf(1.8);
  for (let i = 0; i < cc.length; i++) cc[i] = sin(140, i / SR) * Math.exp((-i / SR) * 28) * 0.9;
  ajouter(cc, note(1760, 1.6, 3.4, [[1, 1], [2.32, 0.5], [4.1, 0.25]]), 0.01, 0.55);
  ajouter(cc, note(2640, 1.4, 4.2, [[1, 1], [2.7, 0.3]]), 0.015, 0.35);
  out("cloche", cc, 0.7);

  // --- cliquetis de couverts : fourchette et couteau posés sur l'assiette, 0,9 s
  const co = buf(0.9);
  ajouter(co, note(3300, 0.5, 11, [[1, 1], [1.5, 0.5], [2.4, 0.4], [3.7, 0.2]], 0.001), 0, 0.7);
  ajouter(co, note(2700, 0.5, 13, [[1, 1], [1.6, 0.5], [2.5, 0.3]], 0.001), 0.17, 0.55);
  ajouter(co, bande(0.06, 8, () => 5000, 2, (t) => Math.exp(-t * 60)), 0, 0.5);
  ajouter(co, bande(0.2, 9, () => 900, 1.4, (t) => Math.exp(-t * 30)), 0.0, 0.3); // assiette
  out("couverts", co, 0.7);

  // --- horloge (boucle 2 s) : tic puis toc, secs et discrets
  const ho = buf(2);
  for (const [t0, f] of [[0, 1900], [1, 1350]] as Array<[number, number]>) {
    ajouter(ho, bande(0.05, 20 + t0, () => f, 2.2, (t) => Math.exp(-t * 80)), t0, 0.9);
    ajouter(ho, note(f / 3, 0.12, 40, [[1, 1], [2.1, 0.3]], 0.001), t0, 0.5);
  }
  out("horloge", fonduBoucle(ho, 0.02), 0.6);

  // --- effacement : balayage descendant doux (bruit qui s'éteint) + arpège de verre descendant, 2,6 s
  const ef = buf(2.6);
  const be = bande(2.6, 31, (t) => 6500 * Math.exp(-t * 1.6) + 300, 1.3, (t) => Math.min(1, t * 8) * Math.exp(-t * 0.9) * 0.6);
  for (let i = 0; i < ef.length; i++) ef[i] = be[i];
  [2637, 2093, 1760, 1318.5, 1046.5, 880, 659.25, 523.25].forEach((f, k) => ajouter(ef, note(f, 1.3, 3.2, [[1, 1], [2.01, 0.25]]), 0.05 + k * 0.17, 0.45 * (1 - k * 0.07)));
  for (let i = 0; i < ef.length; i++) ef[i] += sin(1200 * Math.exp(-(i / SR) * 1.0) + 90, i / SR) * 0.14 * Math.min(1, i / SR / 0.4) * Math.exp(-(i / SR) * 0.8);
  out("efface", ef, 0.65);

  // --- croc : on mord dans le hamburger (craquement de la croûte), 0,5 s
  const cr = buf(0.5);
  ajouter(cr, bande(0.18, 41, (t) => 3600 - 2000 * t / 0.18, 1.3, (t) => Math.exp(-t * 20)), 0, 0.9);
  ajouter(cr, bande(0.1, 42, () => 1600, 1.2, (t) => Math.exp(-t * 35)), 0.07, 0.7);
  ajouter(cr, bande(0.12, 43, () => 2600, 1.4, (t) => Math.exp(-t * 28)), 0.15, 0.5);
  for (let i = 0; i < cr.length; i++) cr[i] += sin(95, i / SR) * Math.exp((-i / SR) * 24) * 0.45;
  out("croc", cr, 0.7);

  // --- page d'album qui se tourne : un froissement bref qui monte, 0,38 s
  out("page", bande(0.38, 51, (t) => 1300 + 4800 * (t / 0.38) ** 1.4, 0.9, (t) => Math.min(1, t * 40) * Math.exp(-t * 7) * 0.9), 0.55);

  // --- nappe mélancolique (boucle 16 s) : la mineur, deux notes de verre qui reviennent
  const na = buf(L);
  for (let i = 0; i < na.length; i++) {
    const t = i / SR;
    na[i] = (sin(110, t) * 0.5 + sin(130.8, t) * 0.34 + sin(164.8, t) * 0.34 + sin(220, t) * 0.2 + sin(329.6, t) * 0.07) * (0.75 + 0.25 * Math.sin((TAU * t) / 8));
  }
  const air = bande(L, 61, () => 3000, 0.8, () => 0.012);
  for (let i = 0; i < na.length; i++) na[i] += air[i];
  for (const [t0, f] of [[1.5, 659.25], [4.8, 587.33], [8.6, 523.25], [12.2, 493.88], [14.2, 440]] as Array<[number, number]>) ajouter(na, note(f, 2.6, 1.7, [[1, 1], [2.0, 0.18]], 0.02), t0, 0.25);
  out("nappe-triste", fonduBoucle(na, 1.0), 0.5);

  // --- ambiance de rue au crépuscule (boucle 12 s) : grondement lointain, passage de voiture, léger bourdonnement
  const vi = buf(12);
  const gro = bande(12, 71, () => 180, 0.6, (t) => 0.07 * (0.7 + 0.3 * Math.sin((TAU * t) / 6)));
  for (let i = 0; i < vi.length; i++) vi[i] = gro[i] + sin(60, i / SR) * 0.03;
  for (const t0 of [2.8, 8.4]) ajouter(vi, bande(2.4, Math.round(t0 * 10), (t) => 400 + 700 * Math.sin((Math.PI * t) / 2.4), 0.9, (t) => Math.sin((Math.PI * t) / 2.4) ** 2 * 0.12), t0, 1);
  out("ville", fonduBoucle(passeBas(vi, 1400), 0.6), 0.45);

  // --- souffle du grenier (boucle 12 s) : vent sous les tuiles, craquement de charpente
  const gr = bande(12, 81, (t) => 420 + 260 * Math.sin((TAU * t) / 6), 1.2, (t) => 0.09 * (0.7 + 0.3 * Math.sin((TAU * t) / 4 + 1)));
  const rg = rng(7);
  for (const t0 of [3.1, 8.7]) ajouter(gr, bande(0.5, Math.round(t0 * 10), (t) => 180 + 80 * Math.sin(t * 20), 6, (t) => Math.sin((Math.PI * t) / 0.5) * 0.2), t0, 1 + rg() * 0.1);
  out("grenier", fonduBoucle(gr, 0.6), 0.4);

  return ["neon", "neon-clic", "jukebox", "sifflet", "cloche", "couverts", "horloge", "efface", "croc", "page", "nappe-triste", "ville", "grenier"].map((n) => `${n}.wav`);
}
