/**
 * Sons propres à « J'étais l'ange gardien de ma petite sœur… » : oiseaux du matin (boucle), cloche du passage à
 * niveau, crissement de pneus, crayon sur le couvercle, tintement de plume, souffle de lumière dorée.
 * 100 % synthétisés (déterministes, aucun échantillon externe). Générés par `npx tsx scripts/gen-sfx-ange.ts`
 * dans video/public/sfx/ange/.
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

export function genererAnge(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));

  // --- oiseaux du matin (boucle de 16 s) : gazouillis aigus, glissandos courts, quelques trilles
  const L = 16;
  const oi = buf(L);
  const r = rng(11);
  for (let g = 0; g < 46; g++) {
    const t0 = r() * (L - 1.2);
    const f0 = 2600 + r() * 2200;
    const sens = r() > 0.5 ? 1 : -1;
    const n = 3 + Math.floor(r() * 4);
    const trille = r() > 0.6;
    for (let k = 0; k < n; k++) {
      const d = 0.05 + r() * 0.05;
      const ts = t0 + k * (trille ? 0.075 : 0.13);
      const m = Math.round(d * SR);
      const j0 = Math.round(ts * SR);
      for (let i = 0; i < m && j0 + i < oi.length; i++) {
        const t = i / SR;
        const f = f0 * (1 + sens * 0.25 * (t / d)) * (1 + 0.06 * k * sens);
        oi[j0 + i] += sin(f, t) * Math.sin((Math.PI * i) / m) ** 1.5 * 0.2 * (0.6 + 0.4 * sin(55, t));
      }
    }
  }
  // fondu aux bords pour un bouclage sans clic
  for (let i = 0; i < oi.length; i++) oi[i] *= Math.min(1, i / (0.3 * SR), (oi.length - i) / (0.3 * SR));
  out("oiseaux", oi, 0.5);

  // --- cloche du passage à niveau : ding métallique (deux partiels inharmoniques), 1,2 s
  const cl = buf(1.2);
  for (let i = 0; i < cl.length; i++) {
    const t = i / SR;
    cl[i] = (sin(1180, t) * 0.7 + sin(1180 * 2.76, t) * 0.4 + sin(1180 * 5.4, t) * 0.18 + sin(590, t) * 0.25) * Math.exp(-t * 4.6);
  }
  out("cloche", cl, 0.7);

  // --- crissement de pneus (freinage brusque) : bruit passe-bande glissant, 1,1 s
  const fr = bande(1.1, 5, (t) => 1500 + 900 * Math.sin(t * 22) * Math.exp(-t * 2) + 600 * Math.exp(-t * 3), 6, (t) => Math.min(1, t * 12) * Math.exp(-t * 2.4));
  out("freinage", fr, 0.8);

  // --- crayon / feutre sur le couvercle : frottements courts (0,9 s)
  const cr = bande(0.9, 9, (t) => 3400 + 700 * Math.sin(t * 31), 3, (t) => (0.35 + 0.65 * Math.abs(Math.sin(t * 17))) * Math.min(1, t * 20) * Math.min(1, (0.9 - t) * 14));
  out("crayon", cr, 0.55);

  // --- tintement de plume : trois partiels en verre, queue de 2,6 s
  const tp = buf(2.6);
  for (const [t0, f, a] of [[0, 1568, 1], [0.12, 2093, 0.7], [0.26, 2637, 0.5], [0.42, 3136, 0.34]] as Array<[number, number, number]>) {
    const n = Math.round(1.9 * SR);
    const s = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      s[i] = (sin(f, t) + sin(f * 2.003, t) * 0.25) * Math.exp(-t * 2.2) * a * Math.min(1, t * 400);
    }
    ajouter(tp, s, t0, 0.5);
  }
  out("plume", tp, 0.6);

  // --- souffle de lumière : bruit filtré qui monte puis un accord doux qui s'ouvre (1,8 s)
  const so = bande(1.8, 21, (t) => 500 + 4200 * (t / 1.8) ** 1.6, 1.4, (t) => Math.sin((Math.PI * t) / 1.8) ** 1.5);
  for (let i = 0; i < so.length; i++) {
    const t = i / SR;
    so[i] = so[i] * 1.0 + (sin(523, t) + sin(784, t) * 0.8 + sin(1046, t) * 0.5) * 0.18 * Math.sin((Math.PI * t) / 1.8) ** 2;
  }
  out("eclat", so, 0.7);
  return ["oiseaux", "cloche", "freinage", "crayon", "plume", "eclat"].map((n) => `${n}.wav`);
}
