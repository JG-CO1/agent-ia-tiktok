/**
 * Sons propres à « Chaque fois que je regarde mon téléphone… » : nappe froide bouclable, notification douce (« tiloup »),
 * saut de temps (whoosh qui monte jusqu'au flash), horloge qui s'emballe, extinction de l'écran, rallumage, porte qui se
 * ferme, survol des voitures de 2085, glissement du pouce, frappe sur l'écran.
 * 100 % synthétisés (déterministes, aucun échantillon externe). Générés par `npx tsx scripts/gen-sfx-telephone.ts`
 * dans video/public/sfx/telephone/.
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
/** Bruit passe-bande à fréquence variable (filtre à variables d'état) × enveloppe. */
function bande(sec: number, seed: number, centre: (t: number) => number, q: number, env: (t: number) => number) {
  const b = buf(sec);
  const r = rng(seed);
  let lp = 0;
  let bp = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const f = 2 * Math.sin((Math.PI * Math.min(centre(t), SR * 0.4)) / SR);
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
const ease = (x: number) => x * x * (3 - 2 * x);

export function genererTelephone(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));

  // --- nappe froide (boucle de 16 s, sans clic : toutes les fréquences et modulations tombent juste sur 16 s)
  {
    const L = 16;
    const n = buf(L);
    const fq = (f: number) => Math.round(f * L) / L;
    const parts: Array<[number, number, number]> = [
      [110, 0.55, 1],
      [164.81, 0.36, 2],
      [220, 0.3, 3],
      [277.18, 0.16, 4],
      [329.63, 0.2, 5],
      [440, 0.1, 6],
      [659.26, 0.05, 7],
    ];
    for (let i = 0; i < n.length; i++) {
      const t = i / SR;
      let v = 0;
      for (const [f, a, k] of parts) {
        const lfo = 0.65 + 0.35 * sin(k / L, t, k * 1.7);
        v += (sin(fq(f * 1.003), t) + sin(fq(f * 0.997), t, 1.3)) * 0.5 * a * lfo;
      }
      n[i] = v * (0.8 + 0.2 * sin(1 / L, t));
    }
    out("nappe", n, 0.6);
  }

  // --- notification : « tiloup » doux (deux notes de cloche de verre), 1,1 s
  {
    const n = buf(1.1);
    for (const [t0, f, a] of [[0, 988, 1], [0.15, 1319, 0.85]] as Array<[number, number, number]>) {
      const m = Math.round(0.95 * SR);
      const s = new Float32Array(m);
      for (let i = 0; i < m; i++) {
        const t = i / SR;
        s[i] = (sin(f, t) + sin(f * 2.003, t) * 0.18 + sin(f * 3.01, t) * 0.06) * Math.exp(-t * 5.2) * Math.min(1, t * 600) * a;
      }
      ajouter(n, s, t0, 0.6);
    }
    out("notif", n, 0.55);
  }

  // --- saut de temps : whoosh qui monte jusqu'à 0,55 s (le flash), puis scintillement qui retombe, 1,2 s
  {
    const P = 0.55;
    const w = bande(1.2, 7, (t) => (t < P ? 260 * Math.pow(2, 5 * (t / P)) : 7500 * Math.exp(-(t - P) * 3)), 1.6, (t) => (t < P ? Math.pow(t / P, 2.2) : Math.exp(-(t - P) * 6)) * 1.0);
    for (let i = 0; i < w.length; i++) {
      const t = i / SR;
      if (t < P) w[i] += sin(220 * Math.pow(2, 3.2 * (t / P)), t) * 0.07 * Math.pow(t / P, 2);
      else {
        const d = t - P;
        w[i] += (sin(2093, t) * 0.16 + sin(3136, t) * 0.1 + sin(4186, t) * 0.06) * Math.exp(-d * 4.5) + sin(58, d) * 0.5 * Math.exp(-d * 7) * Math.min(1, d * 300);
      }
    }
    out("saut", w, 0.7);
  }

  // --- horloge qui s'emballe : tic-tac de plus en plus rapide pendant 3,2 s
  {
    const n = buf(3.2);
    const r = rng(3);
    let t = 0.05;
    let k = 0;
    let dt = 0.62;
    while (t < 3.1) {
      const m = Math.round(0.045 * SR);
      const s = new Float32Array(m);
      const f = k % 2 ? 1700 : 2300;
      for (let i = 0; i < m; i++) {
        const u = i / SR;
        s[i] = ((r() * 2 - 1) * 0.5 + sin(f, u)) * Math.exp(-u * 150) * Math.min(1, u * 2000);
      }
      ajouter(n, s, t, 0.9);
      k++;
      dt = Math.max(0.065, dt * 0.88);
      t += dt;
    }
    out("tictac", n, 0.6);
  }

  // --- écran qui s'éteint : bloup descendant et sec, 0,5 s
  {
    const n = buf(0.5);
    let ph = 0;
    for (let i = 0; i < n.length; i++) {
      const t = i / SR;
      const f = 1300 * Math.exp(-t * 14) + 70;
      ph += (TAU * f) / SR;
      n[i] = Math.sin(ph) * Math.exp(-t * 11) * Math.min(1, t * 800);
    }
    const r = rng(5);
    for (let i = 0; i < Math.round(0.004 * SR); i++) n[i] += (r() * 2 - 1) * 0.6;
    out("ecran-off", n, 0.7);
  }

  // --- écran qui se rallume : souffle qui monte, accord glacé, 1,6 s
  {
    const n = bande(1.6, 9, (t) => 1500 + 5000 * Math.min(1, t / 0.5), 1.8, (t) => Math.min(1, t / 0.45) * Math.exp(-Math.max(0, t - 0.45) * 3.6) * 0.5);
    for (let i = 0; i < n.length; i++) {
      const t = i / SR;
      const a = Math.min(1, t / 0.12) * Math.exp(-Math.max(0, t - 0.12) * 2.4);
      n[i] += (sin(1319, t) * 0.5 + sin(1976, t) * 0.34 + sin(2637, t) * 0.22 + sin(110, t) * 0.4) * a * 0.5;
    }
    out("ecran-on", n, 0.65);
  }

  // --- porte qui se ferme : choc sourd, bois qui résonne, loquet, 1,3 s
  {
    const n = buf(1.3);
    const r = rng(11);
    let lp = 0;
    for (let i = 0; i < n.length; i++) {
      const t = i / SR;
      lp += (1 - Math.exp((-TAU * 700) / SR)) * (r() * 2 - 1 - lp);
      const thump = sin(70 * Math.exp(-t * 3) + 38, t) * Math.exp(-t * 9) * 1.0;
      const bois = (sin(176, t) * 0.4 + sin(263, t) * 0.25 + sin(418, t) * 0.12) * Math.exp(-t * 11);
      const souffle = lp * Math.exp(-t * 18) * 1.4;
      n[i] = (thump + bois + souffle) * Math.min(1, t * 900);
    }
    for (let i = 0; i < Math.round(0.35 * SR); i++) {
      const t = i / SR;
      const k = Math.round(0.14 * SR) + i;
      n[k] += (sin(2900, t) * 0.5 + (r() * 2 - 1) * 0.25) * Math.exp(-t * 90);
    }
    out("porte", n, 0.75);
  }

  // --- voiture de 2085 qui survole la rue : bruit filtré avec effet Doppler, pic à 1,3 s, 2,6 s
  {
    const L = 2.6;
    const P = 1.3;
    const w = bande(L, 13, (t) => 1300 - 850 * ease(Math.min(1, t / L)), 0.9, (t) => Math.exp(-((t - P) * (t - P)) / 0.28) * 1.0);
    for (let i = 0; i < w.length; i++) {
      const t = i / SR;
      const env = Math.exp(-((t - P) * (t - P)) / 0.35);
      w[i] += sin(190 - 80 * ease(t / L), t) * 0.5 * env + sin(380 - 160 * ease(t / L), t) * 0.2 * env;
    }
    out("survol", w, 0.6);
  }

  // --- glissement du pouce sur l'écran : petit souffle qui monte, 0,28 s
  out("swipe", bande(0.28, 17, (t) => 1800 + 2600 * (t / 0.28), 2.4, (t) => Math.sin((Math.PI * t) / 0.28) ** 1.6), 0.4);

  // --- frappe sur l'écran : petit clic doux, 0,12 s
  {
    const n = buf(0.12);
    const r = rng(19);
    for (let i = 0; i < n.length; i++) {
      const t = i / SR;
      n[i] = (sin(1500, t) * 0.7 + (r() * 2 - 1) * 0.3) * Math.exp(-t * 70) * Math.min(1, t * 3000);
    }
    out("tap", n, 0.4);
  }
  return ["nappe", "notif", "saut", "tictac", "ecran-off", "ecran-on", "porte", "survol", "swipe", "tap"].map((n) => `${n}.wav`);
}
