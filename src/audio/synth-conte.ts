/**
 * Sons des récits sombres (somnambules, ange gardien, brouillard) : drones d'ambiance bouclables, grillons, cœur,
 * chocs de révélation, grincements, coups de métal, pioche, murmure, goutte, train, carillon doré, souffle d'asthme,
 * pas de géant, corne de brume… 100 % synthétisés ici, déterministes, aucun échantillon externe.
 * Générés par `npx tsx scripts/gen-sfx-conte.ts` dans video/public/sfx/conte/.
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
const TAU = Math.PI * 2;
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
/** Bruit passe-bande (deux pôles) : souffles, murmures. */
function bande(sec: number, seed: number, centre: (t: number) => number, q: number, env: (t: number) => number) {
  const b = buf(sec);
  const r = rng(seed);
  let lp = 0;
  let bp = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const f = 2 * Math.sin((Math.PI * centre(t)) / SR);
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
const sin = (f: number, t: number, ph = 0) => Math.sin(TAU * f * t + ph);
const saw = (f: number, t: number) => 2 * ((f * t) % 1) - 1;
/** Réverbération simplifiée : peigne de retards. */
function echo(b: Float32Array, retards: number[], gain = 0.35) {
  const o = new Float32Array(b.length);
  o.set(b);
  retards.forEach((d, k) => {
    const n = Math.round(d * SR);
    const g = Math.pow(gain, k + 1);
    for (let i = n; i < b.length; i++) o[i] += b[i - n] * g;
  });
  return o;
}

export function genererConte(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));
  const L = 16; // durée des boucles (s) : toutes les fréquences sont des multiples de 1/16 Hz → bouclage parfait

  // --- grillons de nuit (boucle)
  const gr = buf(L);
  const r = rng(3);
  for (let g = 0; g < 70; g++) {
    const t0 = r() * (L - 1);
    const f = 4300 + Math.round(r() * 8) * 62.5;
    const n = Math.round((0.16 + r() * 0.1) * SR);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const j = Math.round(t0 * SR) + i;
      if (j < gr.length) gr[j] += sin(f, t) * Math.max(0, sin(34, t)) ** 2 * Math.sin((Math.PI * i) / n) * 0.35;
    }
  }
  out("grillons", gr, 0.35);

  // --- drones d'ambiance (bouclables) : a = somnambules (grave menaçant), b = ange (pad triste), c = brouillard (houle)
  const drone = (notes: Array<[number, number]>, lfo: number, haut: number[], vib = 0.002) => {
    const b = buf(L);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      let v = 0;
      for (const [f, a] of notes) v += (saw(f, t) * 0.35 + sin(f, t) * 0.65 + sin(f * 2.0001, t) * 0.12) * a;
      const m = 0.65 + 0.35 * sin(lfo, t);
      for (const h of haut) v += sin(h + vib * h * sin(0.25, t), t) * 0.05 * (0.5 + 0.5 * sin(0.125, t, h));
      b[i] = v * m;
    }
    return b;
  };
  out("drone-a", drone([[55, 0.5], [55.5, 0.4], [82.5, 0.3], [116.5625, 0.12]], 0.125, [466.0, 440.0, 1396.9], 0.003), 0.5);
  out("drone-b", drone([[110, 0.3], [164.5, 0.25], [220, 0.28], [329.5, 0.14], [247, 0.12]], 0.0625, [880, 1318.5, 1760], 0.0012), 0.42);
  out("drone-c", drone([[41, 0.6], [41.5, 0.5], [61.5, 0.3], [87.25, 0.15]], 0.1875, [370, 392, 1108], 0.004), 0.5);

  // --- cœur qui bat (deux coups)
  const coeur = buf(1.0);
  for (const [t0, a] of [[0, 1], [0.27, 0.75]] as Array<[number, number]>) {
    const n = Math.round(0.3 * SR);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      coeur[Math.round(t0 * SR) + i] += sin(52 + 30 * Math.exp(-t * 25), t) * Math.exp(-t * 14) * a;
    }
  }
  out("coeur", coeur, 0.85);

  // --- choc de révélation : impact grave + déchirure métallique + queue réverbérée
  const choc = buf(2.2);
  for (let i = 0; i < choc.length; i++) {
    const t = i / SR;
    choc[i] = sin(38 + 60 * Math.exp(-t * 18), t) * Math.exp(-t * 3.4) + (sin(310, t) + sin(467, t) * 0.7 + sin(1180, t) * 0.4) * Math.exp(-t * 6) * 0.22;
  }
  ajouter(choc, bruit(0.6, 5, (t) => 3000 * Math.exp(-t * 7) + 200, (t) => Math.exp(-t * 9)), 0, 0.7);
  out("choc", echo(choc, [0.09, 0.17], 0.4), 0.95);

  // --- grincement de porte
  const gri = buf(1.6);
  for (let i = 0; i < gri.length; i++) {
    const t = i / SR;
    const f = 150 + 260 * Math.pow(t / 1.6, 1.3) + 14 * sin(9, t);
    gri[i] = (saw(f, t) * 0.6 + sin(f * 2.01, t) * 0.3) * Math.sin((Math.PI * t) / 1.6) ** 0.8 * 0.6;
  }
  ajouter(gri, bruit(1.6, 8, () => 900, (t) => 0.1 * Math.sin((Math.PI * t) / 1.6)), 0, 1);
  out("grincement", gri, 0.6);

  // --- coups de métal creux (porte)
  const frappe = buf(1.0);
  for (let i = 0; i < frappe.length; i++) {
    const t = i / SR;
    frappe[i] = (sin(96, t) * 1.0 + sin(212, t) * 0.7 + sin(418, t) * 0.5 + sin(905, t) * 0.4 + sin(1372, t) * 0.25) * Math.exp(-t * 7.5);
  }
  ajouter(frappe, bruit(0.05, 9, () => 5000, (t) => Math.exp(-t * 90)), 0, 0.5);
  out("frappe-metal", echo(frappe, [0.05, 0.11], 0.3), 0.9);

  // --- pioche sur du métal : clang brillant et long
  const clang = buf(2.4);
  for (let i = 0; i < clang.length; i++) {
    const t = i / SR;
    clang[i] = (sin(702, t) * 1 + sin(1496, t) * 0.8 + sin(2371, t) * 0.55 + sin(3340, t) * 0.4 + sin(4733, t) * 0.25) * Math.exp(-t * 3.1);
  }
  ajouter(clang, bruit(0.08, 12, () => 7000, (t) => Math.exp(-t * 70)), 0, 0.8);
  out("clang", echo(clang, [0.07, 0.16], 0.45), 0.95);

  // --- pioche dans la terre : choc sourd + gravillons
  const terre = bruit(0.5, 14, (t) => 1100 * Math.exp(-t * 14) + 120, (t) => Math.exp(-t * 16) * 0.9);
  for (let i = 0; i < terre.length; i++) terre[i] += sin(64 + 40 * Math.exp(-(i / SR) * 30), i / SR) * Math.exp(-(i / SR) * 14);
  ajouter(terre, bruit(0.3, 15, () => 3500, (t) => Math.exp(-t * 11) * 0.25), 0.04, 1);
  out("pioche-terre", terre, 0.8);

  // --- murmure d'une voix qui prononce un nom (souffle à formants mobiles)
  const mur = buf(1.8);
  const sy = [[0.05, 0.4, 520, 1500], [0.55, 0.95, 380, 1100], [1.05, 1.55, 640, 1750]];
  for (const [a, z, f1, f2] of sy) {
    const d = z - a;
    ajouter(mur, bande(d, 20 + a * 10, (t) => f1 + (f2 - f1) * (t / d), 7, (t) => Math.sin((Math.PI * t) / d) ** 1.5), a, 1);
    ajouter(mur, bande(d, 30 + a * 10, (t) => f2 * 1.5 + 300 * t, 9, (t) => Math.sin((Math.PI * t) / d) ** 2 * 0.5), a, 1);
  }
  out("murmure", echo(mur, [0.13, 0.27], 0.5), 0.55);

  // --- goutte sur une vitre
  const gt = buf(0.5);
  for (let i = 0; i < gt.length; i++) {
    const t = i / SR;
    gt[i] = sin(1350 - 520 * Math.min(1, t * 9), t) * Math.exp(-t * 26) + sin(2700, t) * Math.exp(-t * 60) * 0.3;
  }
  out("goutte", echo(gt, [0.08], 0.3), 0.7);

  // --- train qui passe (grondement, rail qui claque) et son klaxon
  const tr = buf(8);
  for (let i = 0; i < tr.length; i++) {
    const t = i / SR;
    const env = Math.exp(-Math.pow((t - 4.2) / 1.5, 2));
    tr[i] = sin(46 + 14 * env, t) * env * 0.7 + sin(69, t) * env * 0.4;
  }
  ajouter(tr, bruit(8, 21, (t) => 500 + 700 * Math.exp(-Math.pow((t - 4.2) / 1.6, 2)), (t) => Math.exp(-Math.pow((t - 4.2) / 1.9, 2)) * 0.8), 0, 1);
  for (let k = 0; k < 56; k++) {
    const t0 = 1.2 + k * 0.12;
    const env = Math.exp(-Math.pow((t0 - 4.2) / 1.6, 2));
    ajouter(tr, bruit(0.06, 40 + k, () => 2200, (t) => Math.exp(-t * 60)), t0, env * 0.55);
  }
  out("train", tr, 0.9);
  const kl = buf(2.4);
  for (let i = 0; i < kl.length; i++) {
    const t = i / SR;
    const e = Math.min(1, t / 0.06) * Math.min(1, (2.4 - t) / 0.5);
    kl[i] = (saw(311.1, t) * 0.5 + saw(392, t) * 0.5 + sin(622, t) * 0.25) * e;
  }
  out("klaxon", echo(kl, [0.18], 0.3), 0.7);

  // --- carillon doré (cloche + arpège scintillant) et halo (nappe de voix pures)
  const car = buf(3.4);
  for (const [t0, f] of [[0, 880], [0.16, 1318.5], [0.32, 1760], [0.5, 2637], [0.7, 3520]] as Array<[number, number]>) {
    const n = Math.round(2.6 * SR);
    for (let i = 0; i < n && Math.round(t0 * SR) + i < car.length; i++) {
      const t = i / SR;
      car[Math.round(t0 * SR) + i] += (sin(f, t) + sin(f * 2.76, t) * 0.35 + sin(f * 5.4, t) * 0.12) * Math.exp(-t * 2.2) * 0.4;
    }
  }
  out("carillon", echo(car, [0.12, 0.27], 0.5), 0.8);
  const halo = buf(4);
  for (let i = 0; i < halo.length; i++) {
    const t = i / SR;
    const e = Math.sin((Math.PI * t) / 4) ** 2;
    let v = 0;
    for (const f of [440, 554.4, 659.3, 880, 1108.7]) v += sin(f * (1 + 0.003 * sin(5.5, t, f)), t) * 0.25;
    halo[i] = v * e;
  }
  out("halo", echo(halo, [0.2, 0.4], 0.4), 0.7);

  // --- souffle d'asthmatique (inspiration sifflante, expiration courte), boucle de 3,2 s
  const as = buf(3.2);
  ajouter(as, bande(1.2, 51, (t) => 2300 + 500 * t, 14, (t) => Math.sin((Math.PI * t) / 1.2) ** 1.3), 0.1, 0.8);
  ajouter(as, bande(1.2, 52, () => 900, 3, (t) => Math.sin((Math.PI * t) / 1.2) ** 1.3 * 0.6), 0.1, 0.8);
  ajouter(as, bande(0.9, 53, () => 1200, 2.5, (t) => Math.sin((Math.PI * t) / 0.9) ** 1.5), 1.7, 0.9);
  out("asthme", as, 0.6);

  // --- pas de géant, corne de brume
  const pas = buf(1.4);
  for (let i = 0; i < pas.length; i++) {
    const t = i / SR;
    pas[i] = sin(34 + 20 * Math.exp(-t * 14), t) * Math.exp(-t * 4.2);
  }
  ajouter(pas, bruit(0.9, 61, () => 220, (t) => Math.exp(-t * 6) * 0.8), 0, 1);
  out("pas-lourd", pas, 0.95);
  const co = buf(4.5);
  for (let i = 0; i < co.length; i++) {
    const t = i / SR;
    const e = Math.min(1, t / 0.5) * Math.min(1, (4.5 - t) / 1.4);
    co[i] = (saw(98, t) * 0.4 + sin(98, t) * 0.7 + sin(196.2, t) * 0.2) * e * (0.85 + 0.15 * sin(3, t));
  }
  out("corne", echo(co, [0.3, 0.6], 0.45), 0.7);

  // --- voiture qui freine, trousseau de clés
  const vo = buf(3.0);
  for (let i = 0; i < vo.length; i++) {
    const t = i / SR;
    const e = Math.exp(-Math.pow((t - 1.2) / 0.7, 2));
    vo[i] = (saw(70 + 90 * e, t) * 0.3 + sin(140 + 180 * e, t) * 0.4) * e;
  }
  ajouter(vo, bruit(3, 71, () => 2500, (t) => Math.exp(-Math.pow((t - 1.2) / 0.8, 2)) * 0.3), 0, 1);
  ajouter(vo, bande(0.9, 72, (t) => 2100 + 500 * t, 20, (t) => Math.min(1, t * 8) * Math.exp(-t * 2.5) * 0.9), 1.2, 1);
  out("voiture", vo, 0.8);
  const cle = buf(0.9);
  for (let k = 0; k < 6; k++) {
    const f = 2400 + k * 410;
    const t0 = k * 0.07;
    for (let i = 0; i < Math.round(0.5 * SR); i++) {
      const t = i / SR;
      const j = Math.round(t0 * SR) + i;
      if (j < cle.length) cle[j] += (sin(f, t) + sin(f * 2.4, t) * 0.4) * Math.exp(-t * 9) * 0.3;
    }
  }
  out("cle", cle, 0.7);
  return ["grillons", "drone-a", "drone-b", "drone-c", "coeur", "choc", "grincement", "frappe-metal", "clang", "pioche-terre", "murmure", "goutte", "train", "klaxon", "carillon", "halo", "asthme", "pas-lourd", "corne", "voiture", "cle"];
}
