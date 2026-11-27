/**
 * Sons propres à « Le mot secret » : coups sur du bois (porte d'entrée), coups sourds sous le plancher, tic-tac de
 * l'horloge (boucle), craquement du plancher, grincement lent de la trappe, froissement de la couverture, cliquetis
 * de la chaîne de sécurité. 100 % synthétisés (déterministes, aucun échantillon externe).
 * Générés par `npx tsx scripts/gen-sfx-motsecret.ts` dans video/public/sfx/motsecret/.
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
/** Bruit passe-bande (filtre à variable d'état) : centre(t) en Hz, facteur de qualité q, enveloppe env(t). */
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
const attaque = (t: number, a: number) => Math.min(1, t / a);

export function genererMotsecret(dir: string) {
  const out = (n: string, b: Float32Array, peak: number) => writeWav(path.join(dir, `${n}.wav`), norm(b, peak));

  // --- coup sur du bois (la porte) : claquement sec + corps de bois autour de 180 Hz, 0,7 s
  {
    const b = buf(0.7);
    const bruit = bande(0.7, 3, (t) => 1400 - 900 * Math.min(1, t * 14), 1.4, (t) => attaque(t, 0.0015) * Math.exp(-t * 55));
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      const corps = (sin(182, t) * 0.7 + sin(268, t) * 0.35 + sin(391, t) * 0.18) * Math.exp(-t * 17) * attaque(t, 0.002);
      b[i] = corps + bruit[i] * 1.1;
    }
    out("frappe-bois", b, 0.95);
  }

  // --- coup sourd sous le plancher : grosse caisse de bois, très grave, longue queue (1,1 s)
  {
    const b = buf(1.1);
    const bruit = bande(1.1, 8, (t) => 260, 0.9, (t) => attaque(t, 0.004) * Math.exp(-t * 22));
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      const f = 62 + 40 * Math.exp(-t * 18);
      const corps = (sin(f, t) * 1.0 + sin(f * 2.01, t) * 0.25) * Math.exp(-t * 6.5) * attaque(t, 0.003);
      b[i] = corps + bruit[i] * 0.7;
    }
    out("coup-sol", b, 0.95);
  }

  // --- horloge : tic puis toc (boucle de 2 s, un tic toutes les secondes)
  {
    const b = buf(2);
    const tic = (f: number, g: number) => {
      const s = buf(0.12);
      const n = bande(0.12, f, () => f * 6, 3, (t) => attaque(t, 0.0008) * Math.exp(-t * 70));
      for (let i = 0; i < s.length; i++) {
        const t = i / SR;
        s[i] = n[i] * 0.9 + sin(f, t) * Math.exp(-t * 60) * 0.5;
      }
      return [s, g] as const;
    };
    const [a, ga] = tic(1250, 1);
    const [c, gc] = tic(930, 0.8);
    ajouter(b, a, 0.0, ga);
    ajouter(b, c, 1.0, gc);
    out("tic-tac", b, 0.8);
  }

  // --- craquement de plancher : bande étroite qui glisse + petits claquements du bois (1,3 s)
  {
    const b = bande(1.3, 14, (t) => 230 + 420 * Math.sin(t * 5.5) ** 2 + 180 * t, 14, (t) => Math.sin((Math.PI * t) / 1.3) ** 1.5 * (0.5 + 0.5 * Math.abs(Math.sin(t * 23))));
    const r = rng(77);
    for (let k = 0; k < 7; k++) {
      const t0 = 0.1 + r() * 1.0;
      const pop = bande(0.05, 90 + k, () => 600 + r() * 500, 4, (t) => Math.exp(-t * 90));
      ajouter(b, pop, t0, 0.9);
    }
    out("craquement", b, 0.8);
  }

  // --- trappe : grincement lent et grave (charnières rouillées), puis soupir d'air froid (2,8 s)
  {
    const L = 2.8;
    const b = buf(L);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      const f = 70 + 90 * (t / L) ** 1.4 + 14 * Math.sin(t * 9);
      ph += (TAU * f) / SR;
      const scie = ((ph / TAU) % 1) * 2 - 1;
      const env = attaque(t, 0.25) * Math.min(1, (L - t) / 0.7) * (0.55 + 0.45 * Math.sin(t * 11 + 1) ** 2);
      b[i] = (scie * 0.5 + Math.sin(ph * 2.01) * 0.25) * env;
    }
    const air = bande(L, 31, (t) => 900 + 1600 * (t / L), 1.6, (t) => attaque(t, 0.5) * Math.min(1, (L - t) / 0.6) * 0.55);
    for (let i = 0; i < b.length; i++) b[i] += air[i];
    out("trappe", b, 0.8);
  }

  // --- froissement d'une couverture épaisse (0,9 s)
  {
    const b = bande(0.9, 41, (t) => 1800 + 1200 * Math.sin(t * 13), 0.8, (t) => Math.sin((Math.PI * t) / 0.9) ** 1.2 * (0.35 + 0.65 * Math.abs(Math.sin(t * 29 + Math.sin(t * 7)))));
    out("froissement", b, 0.7);
  }

  // --- chaîne de sécurité : cliquetis de maillons (0,8 s)
  {
    const b = buf(0.8);
    const r = rng(5);
    for (let k = 0; k < 9; k++) {
      const t0 = k * 0.07 + r() * 0.04;
      const f = 2400 + r() * 2200;
      const n = Math.round(0.12 * SR);
      const s = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        s[i] = (sin(f, t) + sin(f * 2.31, t) * 0.5) * Math.exp(-t * 38) * attaque(t, 0.0005);
      }
      ajouter(b, s, t0, 0.6 * (1 - k * 0.07));
    }
    out("chaine", b, 0.55);
  }
  return ["frappe-bois", "coup-sol", "tic-tac", "craquement", "trappe", "froissement", "chaine"].map((n) => `${n}.wav`);
}
