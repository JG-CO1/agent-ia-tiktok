/**
 * Sons propres à « Dans cette ville, chaque fois qu'on dit ton prénom, tu gagnes un euro… » : tintement de pièce, cascade et explosion
 * de pièces, « ding » du compteur (court, doux), cri bref de copain (voyelle, non parlé), foule qui chante en voyelles (boucle),
 * rugissement du stade (boucle), jingle de radio (boucle), basse des haut-parleurs (boucle à 2,2 coups/s), flash d'appareil photo,
 * caisse enregistreuse, fanfare de luxe, mer (boucle), ville ensoleillée (boucle), vent sec de ville morte (boucle), chute du silence,
 * compteur qui se fige, pièce qui tourne et s'immobilise. 100 % synthétisés (déterministes, aucun échantillon externe).
 * Générés par `npx tsx scripts/gen-sfx-prenomargent.ts` dans video/public/sfx/prenomargent/.
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

/** Un tintement de pièce : quatre partiels inharmoniques, attaque nette, queue courte (ou longue). */
function tinte(f0: number, dur: number, decay: number, gain = 1): Float32Array {
  const b = buf(dur);
  const parts: Array<[number, number]> = [[1, 1], [1.5, 0.55], [2.02, 0.4], [2.76, 0.25], [4.1, 0.12]];
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    let v = 0;
    for (const [k, a] of parts) v += sin(f0 * k, t) * a * Math.exp(-t * decay * (0.6 + 0.4 * k));
    b[i] = v * Math.min(1, t * 900) * gain;
  }
  return b;
}

/** Voix de foule (voyelles, non parlée) : `n` voix désaccordées, formants qui passent de « a » à « i » puis « é » à chaque syllabe. */
function foule(L: number, n: number, graine: number, f0min: number, f0max: number, syll = 0.65): Float32Array {
  const out = buf(L);
  const r = rng(graine);
  const voy: Array<[number, number]> = [[760, 1200], [330, 2300], [450, 2000], [520, 940]];
  for (let v = 0; v < n; v++) {
    const f0 = f0min + r() * (f0max - f0min);
    const vib = 4.6 + r() * 1.6;
    const ph = r() * syll;
    const dec = r() * 0.06;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const u = (t + ph) / syll;
      const k = Math.floor(u);
      const fr = u - k;
      const [f1, f2] = voy[(k + v) % 3 === 0 ? 0 : (k + v) % 3 === 1 ? 1 : 2];
      const gate = Math.min(1, fr / 0.12) * (fr > 0.82 ? Math.max(0.35, 1 - (fr - 0.82) * 3.6) : 1);
      const f = f0 * (1 + 0.012 * Math.sin(TAU * vib * t + v) + (v % 2 ? 0.02 : -0.01) * (1 - fr) * 0);
      let s = 0;
      for (let h = 1; h <= 18; h++) {
        const fh = f * h;
        const amp = (gauss(fh, f1, 170) + 0.6 * gauss(fh, f2, 300) + 0.05) / Math.sqrt(h);
        s += sin(fh, t, v + h) * amp;
      }
      out[i] += s * gate * (0.12 + 0.03 * Math.sin(t * 0.7 + dec));
    }
  }
  return out;
}

export function genererPrenomargent(dir: string) {
  const out = (nom: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${nom}.wav`), norm(b, peak));
  const L = 16;

  // --- tintement d'une pièce (0,9 s) et ding du compteur (0,3 s)
  out("piece", tinte(2637, 0.9, 6.5), 0.7);
  const ding = buf(0.32);
  for (let i = 0; i < ding.length; i++) {
    const t = i / SR;
    ding[i] = (sin(1568, t) * 0.7 + sin(2349, t) * 0.35 + sin(3136, t) * 0.12) * Math.exp(-t * 13) * Math.min(1, t * 400);
  }
  out("ding", ding, 0.55);

  // --- cascade de pièces (3,2 s) et explosion (1,8 s)
  const pluie = buf(3.2);
  const rp = rng(11);
  for (let g = 0; g < 90; g++) {
    const t0 = rp() * 2.8;
    ajouter(pluie, tinte(2200 + rp() * 2800, 0.5, 9 + rp() * 6), t0, 0.12 + rp() * 0.12);
  }
  out("pluie", pluie, 0.7);
  const expl = buf(1.8);
  const re = rng(21);
  ajouter(expl, bande(0.5, 5, (t) => 6000 - 5000 * t, 0.8, (t) => Math.min(1, t * 40) * Math.exp(-t * 7) * 0.9), 0, 0.8);
  for (let i = 0; i < Math.round(0.6 * SR); i++) {
    const t = i / SR;
    expl[i] += sin(70 - 30 * Math.min(1, t * 2), t) * Math.exp(-t * 6) * 0.9;
  }
  for (let g = 0; g < 110; g++) {
    const t0 = re() * 1.0;
    ajouter(expl, tinte(2000 + re() * 3200, 0.55, 8 + re() * 6), t0 + 0.02, 0.1 + re() * 0.12);
  }
  out("explosion", expl, 0.9);

  // --- cri bref d'un copain : voyelle « é » qui retombe, 0,5 s
  const cri = buf(0.5);
  for (let i = 0; i < cri.length; i++) {
    const t = i / SR;
    const f0 = 230 - 50 * Math.min(1, t * 2);
    const u = Math.min(1, t / 0.3);
    const f1 = 330 + 350 * u;
    const f2 = 2200 - 900 * u;
    let s = 0;
    for (let h = 1; h <= 26; h++) {
      const fh = f0 * h * (1 + 0.01 * Math.sin(TAU * 6 * t));
      s += sin(fh, t, h) * (gauss(fh, f1, 160) + 0.55 * gauss(fh, f2, 300) + 0.04) / Math.sqrt(h);
    }
    cri[i] = s * Math.min(1, t / 0.02) * Math.exp(-Math.max(0, t - 0.1) * 5);
  }
  out("cri", cri, 0.75);

  // --- foule qui chante en voyelles (boucle 16 s), rugissement du stade (boucle 16 s)
  out("foule", fonduBoucle(foule(L, 7, 5, 120, 210), 0.5), 0.7);
  const stade = foule(L, 11, 9, 110, 230, 0.7);
  const roar = bande(L, 31, (t) => 900 + 400 * Math.sin(t * 0.8), 0.5, (t) => 0.05 + 0.03 * Math.sin(t * 1.3));
  for (let i = 0; i < stade.length; i++) stade[i] += roar[i];
  const rs = rng(77);
  for (let g = 0; g < 8; g++) {
    const t0 = rs() * (L - 1.5);
    const f0 = 2900 + rs() * 700;
    const n = Math.round(0.9 * SR);
    const w = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      w[i] = sin(f0 * (1 + 0.04 * Math.sin(TAU * 5 * t)), t) * Math.sin((Math.PI * i) / n) ** 2 * 0.05;
    }
    ajouter(stade, w, t0);
  }
  out("stade", fonduBoucle(stade, 0.5), 0.75);

  // --- jingle de radio (boucle 8 s, 120 bpm) : « Ma-xi-me » en do-mi-sol, basse, charleston
  const rad = buf(8);
  const note = (f: number, t0: number, d: number, g: number) => {
    const n = Math.round(d * SR);
    const w = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const sq = Math.sign(sin(f, t)) * 0.5 + sin(f * 2, t) * 0.25;
      w[i] = sq * Math.min(1, t * 120) * Math.exp(-t * 3.5) * g;
    }
    ajouter(rad, w, t0);
  };
  const mel = [523.25, 659.25, 783.99, 659.25, 523.25, 659.25, 880, 783.99];
  for (let bar = 0; bar < 4; bar++) {
    for (let k = 0; k < 4; k++) note(mel[(bar * 4 + k) % mel.length] * (bar === 3 ? 1.122 : 1), bar * 2 + k * 0.5, 0.42, 0.45);
    for (let k = 0; k < 4; k++) note((bar % 2 ? 98 : 130.8) * 0.5, bar * 2 + k * 0.5, 0.4, 0.5);
    for (let k = 0; k < 8; k++) ajouter(rad, bande(0.08, 40 + k, () => 8000, 1.4, (t) => Math.exp(-t * 60) * 0.5), bar * 2 + k * 0.25, 0.35);
  }
  out("radio", fonduBoucle(rad, 0.05), 0.6);

  // --- basse des haut-parleurs (boucle de 10 coups à 2,2 coups/s)
  const per = 1 / 2.2;
  const basse = buf(per * 10);
  for (let k = 0; k < 10; k++) {
    const o = Math.round(k * per * SR);
    for (let i = 0; i < Math.round(0.4 * SR) && o + i < basse.length; i++) {
      const t = i / SR;
      basse[o + i] += sin(52 + 68 * Math.exp(-t * 28), t) * Math.exp(-t * 9) * Math.min(1, t * 700) * 0.9;
    }
  }
  out("basse", basse, 0.8);

  // --- flash d'appareil photo : déclic et sifflement de recharge (0,45 s)
  const fl = buf(0.45);
  ajouter(fl, bande(0.04, 3, () => 3500, 1.2, (t) => Math.exp(-t * 90)), 0, 1.0);
  for (let i = 0; i < Math.round(0.36 * SR); i++) {
    const t = i / SR;
    fl[Math.round(0.03 * SR) + i] += sin(2200 + 4200 * t, t) * Math.exp(-t * 7) * 0.22;
  }
  out("flash", fl, 0.6);

  // --- caisse enregistreuse (1,3 s) : tiroir, clochette « ka-tching »
  const ca = buf(1.3);
  ajouter(ca, bande(0.25, 9, (t) => 700 + 1400 * t, 1.1, (t) => Math.min(1, t * 60) * Math.exp(-t * 11)), 0, 0.9);
  ajouter(ca, tinte(2093, 1.0, 4.2), 0.18, 0.7);
  ajouter(ca, tinte(3136, 0.8, 5), 0.22, 0.35);
  out("caisse", ca, 0.65);

  // --- fanfare de luxe (1,6 s) : cuivres sur accord majeur
  const fa = buf(1.6);
  for (const f of [261.6, 329.6, 392, 523.3]) {
    for (let i = 0; i < fa.length; i++) {
      const t = i / SR;
      let s = 0;
      for (let h = 1; h <= 8; h++) s += sin(f * h * (1 + 0.003 * Math.sin(TAU * 5 * t)), t) / h;
      fa[i] += s * Math.min(1, t / 0.09) * Math.exp(-Math.max(0, t - 0.9) * 3.5) * 0.18;
    }
  }
  out("fanfare", fa, 0.5);

  // --- la mer (boucle 16 s) et la ville ensoleillée (boucle 16 s)
  const mer = bande(L, 3, (t) => 520 + 260 * Math.sin(TAU * t / 8), 0.7, (t) => 0.06 + 0.05 * Math.pow(Math.sin((Math.PI * ((t % 6.4) / 6.4))), 2));
  out("mer", fonduBoucle(mer, 0.5), 0.5);
  const vil = bande(L, 7, () => 650, 0.55, () => 0.05);
  const rv = rng(17);
  for (let g = 0; g < 70; g++) {
    const t0 = rv() * (L - 0.5);
    const f = 260 + rv() * 700;
    const d = 0.1 + rv() * 0.18;
    ajouter(vil, bande(d + 0.05, 100 + g, () => f, 2.4, (t) => Math.sin(Math.PI * Math.min(1, t / d)) ** 2 * 0.07), t0);
  }
  for (let g = 0; g < 14; g++) {
    const t0 = 0.4 + rv() * (L - 1.2);
    const f0 = 3200 + rv() * 1600;
    const n = Math.round(0.16 * SR);
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      c[i] = sin(f0 * (1 + 0.4 * Math.sin((Math.PI * t) / 0.16)), t) * Math.sin((Math.PI * i) / n) ** 2 * 0.06;
    }
    ajouter(vil, c, t0);
  }
  out("ville", fonduBoucle(vil, 0.5), 0.5);

  // --- vent sec de la ville morte (boucle 16 s) : souffle, sifflement ténu, papiers qui frottent
  const vent = bande(L, 13, (t) => 380 + 240 * Math.sin(TAU * t / 6.4) + 120 * Math.sin(TAU * t / 2.3), 0.9, (t) => 0.09 + 0.05 * Math.sin(TAU * t / 5.1));
  const sif = bande(L, 17, (t) => 1500 + 300 * Math.sin(TAU * t / 3.7), 7, (t) => 0.04 + 0.03 * Math.sin(TAU * t / 4.3));
  for (let i = 0; i < vent.length; i++) vent[i] += sif[i];
  const rw = rng(41);
  for (let g = 0; g < 14; g++) ajouter(vent, bande(0.12, 200 + g, () => 3000 + rw() * 2000, 1.5, (t) => Math.exp(-t * 28) * 0.05), rw() * (L - 0.3));
  out("vent", fonduBoucle(vent, 0.5), 0.55);

  // --- chute du silence (1,8 s) : un « whoomp » grave qui aspire tout
  const ti = buf(1.8);
  for (let i = 0; i < ti.length; i++) {
    const t = i / SR;
    ti[i] = sin(62 - 20 * Math.min(1, t), t) * Math.exp(-t * 2.3) * Math.min(1, t * 300) * 0.9;
  }
  ajouter(ti, bande(0.9, 6, (t) => 2200 * Math.exp(-t * 4), 0.8, (t) => Math.exp(-t * 5) * 0.4), 0, 0.7);
  out("tombe", ti, 0.85);

  // --- compteur qui se fige (1,2 s) : bip plat qui s'éteint net, puis ronflement d'écran
  const fi = buf(1.2);
  for (let i = 0; i < fi.length; i++) {
    const t = i / SR;
    fi[i] = sin(440, t) * (t < 0.45 ? 0.5 : Math.exp(-(t - 0.45) * 14) * 0.5) * Math.min(1, t * 400) + sin(120, t) * Math.exp(-t * 3) * 0.12;
  }
  out("fige", fi, 0.5);

  // --- pièce qui tourne puis s'immobilise (2,6 s) : tintements de plus en plus rapprochés
  const pt = buf(2.6);
  let tt = 0;
  let pas = 0.5;
  let f = 2400;
  while (tt < 2.2 && pas > 0.035) {
    ajouter(pt, tinte(f, 0.35, 9), tt, 0.5 + 0.5 * (1 - tt / 2.6));
    tt += pas;
    pas *= 0.74;
    f -= 25;
  }
  ajouter(pt, tinte(1900, 0.7, 12), 2.2, 0.35);
  out("piece-tombe", pt, 0.6);

  // --- bip de l'enseigne « ON AIR » (0,4 s)
  const on = buf(0.4);
  for (let i = 0; i < on.length; i++) {
    const t = i / SR;
    on[i] = (sin(1000, t) * (t < 0.18 ? 0.5 : 0) + sin(120, t) * 0.15 * Math.exp(-t * 6)) * Math.min(1, t * 500);
  }
  ajouter(on, bande(0.03, 4, () => 2400, 1.2, (t) => Math.exp(-t * 100)), 0, 0.4);
  out("onair", on, 0.5);

  return ["piece", "ding", "pluie", "explosion", "cri", "foule", "stade", "radio", "basse", "flash", "caisse", "fanfare", "mer", "ville", "vent", "tombe", "fige", "piece-tombe", "onair"].map((n) => `${n}.wav`);
}
