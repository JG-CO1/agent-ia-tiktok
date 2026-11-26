/** Aides communes pour composer la bande son d'un récit sombre (boucles avec fondus, événements ponctuels). */
import type { Son } from "../minuit/sons";

export const C = (n: string) => `sfx/conte/${n}.wav`;
export const B = (n: string) => `sfx/blocs/${n}.wav`;

/** Boucle de `t0` à `t1` avec fondus d'entrée et de sortie. */
export function boucle(src: string, t0: number, t1: number, volume: number, fade = 1.2): Son {
  const d = Math.max(0.2, t1 - t0);
  return { src, t: Math.max(0, t0), volume, duree: d, boucle: true, enveloppe: [[0, 0], [Math.min(fade, d / 2), 1], [Math.max(d - fade, d / 2), 1], [d, 0]] };
}
/** Événement ponctuel. */
export const hit = (src: string, t: number, volume: number, duree = 3): Son => ({ src, t: Math.max(0, t), volume, duree });
/** Répète un son court toutes les `pas` secondes entre t0 et t1 (pas, cœur, souffle). */
export function repete(src: string, t0: number, t1: number, pas: number, volume: number, duree = pas): Son[] {
  const out: Son[] = [];
  for (let t = t0; t < t1; t += pas) out.push(hit(src, t, volume, duree));
  return out;
}
export const valides = (s: Son[]) => s.filter((x) => x.t >= 0 && (x.duree ?? 1) > 0.05);
