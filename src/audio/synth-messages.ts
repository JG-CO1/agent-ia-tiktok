/**
 * Sons propres à « Tout ce que j'envoie par message devient réel… » : pop d'envoi, ding de réception, ding grave du système,
 * touche de clavier, pluie de bonbons cristalline (boucle), boîte à musique pastel (boucle), balayage « annuler » (descendant),
 * balayage de réécriture (montant), crépitement de pixels, éclat de bulle, montée de tension, souffle, whoosh de la remontée,
 * aboiement joyeux, nappe blanche finale (boucle). 100 % synthétisés (déterministes, aucun échantillon externe).
 * Générés par `npx tsx scripts/gen-sfx-messages.ts` dans video/public/sfx/messages/.
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
/** Boucle sans clic : fondus d'entrée/sortie de 0,25 s. */
function fonduBoucle(b: Float32Array, s = 0.25) {
  const n = Math.round(s * SR);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    b[i] *= k;
    b[b.length - 1 - i] *= k;
  }
  return b;
}

export function genererMessages(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));

  // --- pop d'envoi : bulle qui jaillit (glissando montant très bref + clic doux), 0,5 s
  const pop = buf(0.5);
  for (let i = 0; i < pop.length; i++) {
    const t = i / SR;
    const f = 360 + 1500 * (1 - Math.exp(-t * 38));
    pop[i] = sin(f, t) * Math.exp(-t * 14) * Math.min(1, t * 900) + sin(f * 2, t) * 0.18 * Math.exp(-t * 24);
  }
  out("pop", pop, 0.8);

  // --- ding de réception : deux notes de verre (do6 – sol6), 1,6 s
  const ding = buf(1.6);
  ajouter(ding, note(1046.5, 1.4, 3.4), 0, 0.8);
  ajouter(ding, note(1568, 1.4, 3.0), 0.11, 0.7);
  out("ding", ding, 0.7);

  // --- ding grave du système (réponse grise) : deux notes descendantes un peu sèches, 1,3 s
  const dingbas = buf(1.3);
  ajouter(dingbas, note(392, 1.1, 4.2, [[1, 1], [2.0, 0.5], [3.0, 0.25]]), 0, 0.9);
  ajouter(dingbas, note(294, 1.1, 4.0, [[1, 1], [2.0, 0.5], [3.0, 0.25]]), 0.13, 0.9);
  out("dingbas", dingbas, 0.7);

  // --- touche de clavier : clic sec, 0,12 s
  const tic = bande(0.12, 3, () => 2400, 2.4, (t) => Math.exp(-t * 60) * Math.min(1, t * 2000));
  for (let i = 0; i < tic.length; i++) tic[i] += sin(190, i / SR) * Math.exp((-i / SR) * 70) * 0.4;
  out("tic", tic, 0.55);

  // --- pluie de bonbons (boucle 16 s) : milliers de petits tintements de verre aigus, quelques sphères plus graves
  const L = 16;
  const bo = buf(L);
  const r = rng(77);
  for (let g = 0; g < 520; g++) {
    const t0 = r() * (L - 0.5);
    const f = 2400 + r() * 4200 + (r() > 0.9 ? -1200 : 0);
    const a = 0.1 + r() * 0.5;
    const d = 22 + r() * 40;
    const n = Math.round(0.35 * SR);
    const j0 = Math.round(t0 * SR);
    for (let i = 0; i < n && j0 + i < bo.length; i++) {
      const t = i / SR;
      bo[j0 + i] += (sin(f, t) + sin(f * 2.76, t) * 0.25) * Math.exp(-t * d) * a * 0.1;
    }
  }
  const fond = bande(L, 5, () => 6500, 0.9, () => 0.012);
  for (let i = 0; i < bo.length; i++) bo[i] += fond[i];
  out("bonbons", fonduBoucle(bo, 0.4), 0.55);

  // --- boîte à musique pastel (boucle 16 s) : arpège doux en do majeur, tempo 100, sol aigu qui scintille
  const bm = buf(L);
  const gamme = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 880, 698.46, 1046.5, 880, 659.25, 783.99];
  const pas = 0.3;
  for (let k = 0; k * pas < L - 0.6; k++) {
    const f = gamme[k % gamme.length] * (k % 16 === 12 ? 1.5 : 1);
    ajouter(bm, note(f, 1.0, 5.2, [[1, 1], [2.0, 0.22], [3.99, 0.1]], 0.002), k * pas, 0.45);
    if (k % 4 === 0) ajouter(bm, note(f / 2, 1.2, 3.2, [[1, 1], [2.0, 0.15]], 0.004), k * pas, 0.35);
  }
  out("boite", fonduBoucle(bm, 0.3), 0.5);

  // --- balayage « annuler » (descendant) : bruit filtré qui s'écrase + sinus qui tombe + crépitement final, 1,8 s
  const un = buf(1.8);
  const bn = bande(1.8, 9, (t) => 7000 * Math.exp(-t * 2.1) + 400, 1.6, (t) => Math.min(1, t * 20) * Math.exp(-t * 1.1));
  for (let i = 0; i < un.length; i++) {
    const t = i / SR;
    un[i] = bn[i] * 1.1 + sin(1400 * Math.exp(-t * 2.4) + 120, t) * 0.22 * Math.exp(-t * 1.6);
  }
  const rg = rng(31);
  for (let k = 0; k < 40; k++) {
    const t0 = 0.15 + rg() * 1.5;
    ajouter(un, bande(0.03, 100 + k, () => 3000 + rg() * 4000, 2, (t) => Math.exp(-t * 120)), t0, 0.35 * (1 - t0 / 1.9));
  }
  out("undo", un, 0.75);

  // --- balayage de réécriture (montant) : la rue qui se redessine, 1,8 s
  const re = buf(1.8);
  const bn2 = bande(1.8, 13, (t) => 300 + 6500 * (t / 1.8) ** 1.7, 1.4, (t) => Math.sin((Math.PI * t) / 1.8) ** 1.3);
  for (let i = 0; i < re.length; i++) {
    const t = i / SR;
    re[i] = bn2[i] + (sin(220 + 1900 * (t / 1.8) ** 2, t) * 0.18 + sin(660 + 2600 * (t / 1.8) ** 2, t) * 0.1) * Math.sin((Math.PI * t) / 1.8) ** 1.5;
  }
  out("reecriture", re, 0.7);

  // --- crépitement de pixels (glitch) : rafale de clics numériques, 1,3 s
  const gl = buf(1.3);
  const rr = rng(55);
  for (let k = 0; k < 120; k++) {
    const t0 = rr() * 1.15;
    const dur = 0.004 + rr() * 0.02;
    const f = 800 + rr() * 6000;
    const m = Math.round(dur * SR);
    const j0 = Math.round(t0 * SR);
    for (let i = 0; i < m && j0 + i < gl.length; i++) gl[j0 + i] += (Math.sign(sin(f, i / SR)) * (0.3 + rr() * 0.4)) * (1 - i / m) * (1 - t0 / 1.6);
  }
  out("glitch", gl, 0.45);

  // --- éclat de bulle : bruit brillant + accord de verre qui s'ouvre, 1,5 s
  const ec = buf(1.5);
  const be = bande(1.5, 21, (t) => 900 + 5200 * Math.exp(-t * 3), 1.2, (t) => Math.min(1, t * 80) * Math.exp(-t * 3.4));
  for (let i = 0; i < ec.length; i++) ec[i] = be[i];
  ajouter(ec, note(1318.5, 1.2, 3.6), 0.02, 0.5);
  ajouter(ec, note(1975.5, 1.2, 3.2), 0.06, 0.4);
  ajouter(ec, note(2637, 1.2, 3.0), 0.1, 0.3);
  out("eclat", ec, 0.7);

  // --- montée de tension (6 s) : bruit qui monte, quinte tendue qui se désaccorde, légère pulsation
  const mo = buf(6);
  const bm2 = bande(6, 41, (t) => 200 + 3800 * (t / 6) ** 2.2, 1.1, (t) => (t / 6) ** 1.6);
  for (let i = 0; i < mo.length; i++) {
    const t = i / SR;
    const k = (t / 6) ** 1.8;
    mo[i] = bm2[i] * 0.9 + (sin(110 + 70 * k, t) + sin(165 + 110 * k + 3 * k * k, t) * 0.8 + sin(440 + 400 * k, t) * 0.25) * 0.22 * k * (0.85 + 0.15 * Math.sin(TAU * (2 + 8 * k) * t));
  }
  out("montee", mo, 0.7);

  // --- souffle : inspiration retenue, 1,9 s
  out("souffle", bande(1.9, 61, (t) => 1100 + 700 * Math.sin((Math.PI * t) / 1.9), 0.9, (t) => Math.sin((Math.PI * t) / 1.9) ** 2), 0.6);

  // --- whoosh de remontée (vertige) : très large bande qui monte, 2,6 s
  const wh = bande(2.6, 71, (t) => 250 + 5200 * (t / 2.6) ** 2, 0.7, (t) => Math.sin((Math.PI * Math.min(1, t / 2.6) ** 0.8) * 0.9) ** 1.2);
  for (let i = 0; i < wh.length; i++) wh[i] += sin(180 + 900 * (i / SR / 2.6) ** 2, i / SR) * 0.12 * Math.min(1, i / SR / 1.3);
  out("whoosh", wh, 0.7);

  // --- aboiement joyeux : deux « ouaf » courts (formants), 0,9 s
  const ab = buf(0.9);
  for (const t0 of [0.05, 0.42]) {
    const n = Math.round(0.28 * SR);
    const s = new Float32Array(n);
    const rb = rng(Math.round(t0 * 100));
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const f0 = 330 - 160 * t / 0.28 + 40;
      const ex = (Math.sign(sin(f0, t)) * 0.5 + sin(f0, t) * 0.5) * (1 + 0.15 * (rb() - 0.5));
      s[i] = ex * Math.exp(-t * 11) * Math.min(1, t * 200) * (0.7 + 0.3 * sin(900 + 600 * Math.exp(-t * 10), t));
    }
    ajouter(ab, s, t0, 0.8);
  }
  out("aboi", ab, 0.7);

  // --- nappe blanche (boucle 16 s) : quinte et octave sans tierce, battements lents, souffle aigu
  const na = buf(L);
  for (let i = 0; i < na.length; i++) {
    const t = i / SR;
    na[i] = (sin(110, t) * 0.5 + sin(165.2, t) * 0.4 + sin(220.4, t) * 0.3 + sin(329.8, t) * 0.14 + sin(658, t) * 0.05) * (0.7 + 0.3 * Math.sin((TAU * t) / 8)) + sin(1760 + 4 * Math.sin((TAU * t) / 4), t) * 0.015;
  }
  const air = bande(L, 83, () => 4200, 0.8, () => 0.02);
  for (let i = 0; i < na.length; i++) na[i] += air[i];
  out("nappe", fonduBoucle(na, 1.0), 0.5);

  return ["pop", "ding", "dingbas", "tic", "bonbons", "boite", "undo", "reecriture", "glitch", "eclat", "montee", "souffle", "whoosh", "aboi", "nappe"].map((n) => `${n}.wav`);
}
