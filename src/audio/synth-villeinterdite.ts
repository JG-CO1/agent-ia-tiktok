/**
 * Sons propres à « Ville interdite » : sirène d'alerte lointaine (boucle), pas de géant (basse), grondement sourd (boucle), craquement
 * de bois, « toc » d'une pièce de bois posée, froissement de carton, souffle d'enfant lointain (boucle), nappe de tension (boucle),
 * vent au bord de la table (boucle), froissement d'air d'une grosse main, paupière qui se ferme, sifflement de chute,
 * pétrissage de pâte, tintement d'une ampoule. 100 % synthétisés (déterministes, aucun échantillon externe).
 * Générés par `npx tsx scripts/gen-sfx-villeinterdite.ts` dans video/public/sfx/villeinterdite/.
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
function passeBas(b: Float32Array, k: number) {
  let lp = 0;
  for (let i = 0; i < b.length; i++) {
    lp += k * (b[i] - lp);
    b[i] = lp;
  }
  return b;
}

/** Sirène d'alerte : glissando 380 → 920 Hz puis retour, harmoniques, trémolo (deux cycles de 4 s). */
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

export function genererVilleinterdite(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));
  const fait: string[] = [];

  // --- sirène lointaine (boucle 8 s), adoucie
  const s = passeBas(sirene(8, 1.2), 0.09);
  out("sirene", fonduBoucle(s, 0.25), 0.85);
  fait.push("sirene");

  // --- pas de géant : coup sourd très grave + traîne de rumeur, 1,6 s
  const pg = buf(1.6);
  for (let i = 0; i < pg.length; i++) {
    const t = i / SR;
    pg[i] = (Math.sin(TAU * (46 - 18 * Math.min(1, t * 2)) * t) * Math.exp(-t * 3.4) + 0.5 * Math.sin(TAU * 31 * t) * Math.exp(-t * 2.2)) * Math.min(1, t / 0.01);
  }
  ajouter(pg, bande(1.6, 5, (t) => 120 + 60 * Math.exp(-t * 3), 1.1, (t) => Math.exp(-t * 4.2) * 0.9), 0, 0.8);
  out("pas-geant", pg, 0.95);
  fait.push("pas-geant");

  // --- grondement sourd (boucle 8 s) : tremblement du sol
  const gr = buf(8);
  for (let i = 0; i < gr.length; i++) {
    const t = i / SR;
    gr[i] = (Math.sin(TAU * 38 * t + 1.4 * Math.sin(TAU * 0.5 * t)) + 0.6 * Math.sin(TAU * 57 * t) + 0.4 * Math.sin(TAU * 24 * t)) * (0.65 + 0.35 * Math.sin(TAU * 7 * t));
  }
  ajouter(gr, bande(8, 9, () => 90, 0.9, (t) => 0.5 + 0.5 * Math.sin(TAU * t / 2.7)), 0, 0.7);
  out("grondement", fonduBoucle(gr, 0.5), 0.9);
  fait.push("grondement");

  // --- craquement de bois : trois claquements secs qui s'espacent + gémissement, 1,6 s
  const cq = buf(1.6);
  const r = rng(17);
  for (const [t0, f, g] of [[0.02, 640, 1], [0.21, 520, 0.7], [0.55, 760, 0.55], [0.98, 430, 0.4]] as Array<[number, number, number]>) {
    const n = Math.round(0.16 * SR);
    const j0 = Math.round(t0 * SR);
    for (let i = 0; i < n && j0 + i < cq.length; i++) {
      const t = i / SR;
      cq[j0 + i] += ((r() * 2 - 1) * 0.6 + Math.sin(TAU * f * t)) * Math.exp(-t * 34) * g;
    }
  }
  ajouter(cq, bande(1.6, 3, (t) => 220 + 160 * Math.sin(TAU * 1.4 * t), 5, (t) => Math.sin((Math.PI * t) / 1.6) * 0.25), 0, 1);
  out("craquement", cq, 0.85);
  fait.push("craquement");

  // --- « toc » d'une pièce de bois posée : claquement mat + résonance, 0,5 s
  const tc = buf(0.5);
  for (let i = 0; i < tc.length; i++) {
    const t = i / SR;
    tc[i] = (Math.sin(TAU * 310 * t) * Math.exp(-t * 26) + 0.7 * Math.sin(TAU * 620 * t) * Math.exp(-t * 40) + (r() * 2 - 1) * Math.exp(-t * 90) * 0.5) * Math.min(1, t / 0.002);
  }
  out("toc", tc, 0.9);
  fait.push("toc");

  // --- froissement de carton : grains secs irréguliers, 1,3 s
  const fr = bande(1.3, 21, (t) => 2800 + 1400 * Math.sin(TAU * 3 * t), 1.2, (t) => (Math.sin(TAU * 17 * t) * Math.sin(TAU * 7.3 * t) > 0.15 ? 0.9 : 0.12) * Math.min(1, t / 0.05) * Math.min(1, (1.3 - t) / 0.2));
  out("froissement", fr, 0.7);
  fait.push("froissement");

  // --- souffle d'enfant lointain (boucle 6 s) : inspiration puis expiration, filtrés
  const sf = buf(6);
  ajouter(sf, bande(3, 31, (t) => 600 + 500 * Math.sin((Math.PI * t) / 3), 0.8, (t) => Math.sin((Math.PI * t) / 3) ** 1.6), 0, 1);
  ajouter(sf, bande(3, 33, (t) => 500 - 150 * (t / 3), 0.8, (t) => Math.sin((Math.PI * t) / 3) ** 1.2 * 0.8), 3, 1);
  out("souffle", fonduBoucle(passeBas(sf, 0.3), 0.6), 0.8);
  fait.push("souffle");

  // --- nappe de tension (boucle 16 s) : cluster grave, battement lent
  const nt = buf(16);
  const notes = [55, 58.27, 82.41, 87.31, 110, 116.54];
  for (let i = 0; i < nt.length; i++) {
    const t = i / SR;
    let v = 0;
    notes.forEach((f, k) => {
      v += Math.sin(TAU * f * t + Math.sin(TAU * (0.11 + k * 0.03) * t) * 1.2) * (0.5 + 0.5 * Math.sin(TAU * (0.07 + k * 0.021) * t + k));
    });
    nt[i] = v / notes.length;
  }
  out("tension", fonduBoucle(nt, 1.0), 0.8);
  fait.push("tension");

  // --- vent au bord de la table (boucle 12 s) : souffle large + sifflement dans le vide
  const vt = bande(12, 41, (t) => 300 + 220 * Math.sin(TAU * t / 6) + 90 * Math.sin(TAU * t / 2.3), 1.3, (t) => 0.55 + 0.45 * Math.sin(TAU * t / 6 + 1));
  const sv = bande(12, 43, (t) => 1700 + 600 * Math.sin(TAU * t / 4.1), 10, (t) => 0.1 * (0.5 + 0.5 * Math.sin(TAU * t / 5)));
  for (let i = 0; i < vt.length; i++) vt[i] += sv[i];
  out("vent-bord", fonduBoucle(vt, 0.5), 0.8);
  fait.push("vent-bord");

  // --- air déplacé par une grosse main / une pince : whoosh grave, 1 s
  const wh = bande(1.0, 51, (t) => 250 + 900 * Math.sin((Math.PI * t) / 1.0), 0.9, (t) => Math.sin((Math.PI * t) / 1.0) ** 1.4);
  out("whoosh", wh, 0.8);
  fait.push("whoosh");

  // --- paupière : choc mou et humide, 0,4 s
  const pp = buf(0.4);
  for (let i = 0; i < pp.length; i++) {
    const t = i / SR;
    pp[i] = (Math.sin(TAU * 78 * t) * Math.exp(-t * 12) + (r() * 2 - 1) * Math.exp(-t * 30) * 0.35) * Math.min(1, t / 0.004);
  }
  out("paupiere", passeBas(pp, 0.35), 0.85);
  fait.push("paupiere");

  // --- chute : sifflement qui descend, vent qui s'éloigne, 2,2 s
  const ch = buf(2.2);
  let ph = 0;
  for (let i = 0; i < ch.length; i++) {
    const t = i / SR;
    ph += (TAU * (1100 - 760 * (t / 2.2))) / SR;
    ch[i] = Math.sin(ph) * 0.35 * Math.min(1, t / 0.05) * Math.exp(-t * 0.9);
  }
  ajouter(ch, bande(2.2, 61, (t) => 900 - 500 * (t / 2.2), 1.5, (t) => Math.exp(-t * 1.1) * Math.min(1, t / 0.1)), 0, 0.9);
  out("chute", ch, 0.8);
  fait.push("chute");

  // --- pétrissage : coups mous réguliers, 2 s (boucle)
  const pe = buf(2);
  for (let k = 0; k < 6; k++) {
    const t0 = k * 0.333;
    const n = Math.round(0.22 * SR);
    const j0 = Math.round(t0 * SR);
    for (let i = 0; i < n && j0 + i < pe.length; i++) {
      const t = i / SR;
      pe[j0 + i] += (Math.sin(TAU * (90 - 30 * t) * t) * Math.exp(-t * 18) + (r() * 2 - 1) * Math.exp(-t * 40) * 0.25) * (0.7 + 0.3 * (k % 2));
    }
  }
  out("petrissage", fonduBoucle(passeBas(pe, 0.4), 0.05), 0.8);
  fait.push("petrissage");

  // --- nappe calme et douce (boucle 16 s) : accord ouvert très bas en volume, pour les adultes qui savent
  const nc = buf(16);
  for (let i = 0; i < nc.length; i++) {
    const t = i / SR;
    nc[i] = (Math.sin(TAU * 130.81 * t) + 0.7 * Math.sin(TAU * 196 * t) + 0.5 * Math.sin(TAU * 246.94 * t + Math.sin(TAU * 0.2 * t))) * (0.6 + 0.4 * Math.sin(TAU * t / 8));
  }
  out("nappe-calme", fonduBoucle(nc, 1.2), 0.7);
  fait.push("nappe-calme");

  return fait;
}
