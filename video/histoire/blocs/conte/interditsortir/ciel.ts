/** Ciel et brouillard d'« Interdit de sortir » : le crépuscule orange-rouge descend lentement vers le bleu nuit (fonction du temps). */
import { mel } from "../../maths";

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgb = (c: [number, number, number]) => `#${((1 << 24) | (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2])).toString(16).slice(1)}`;
const melC = (a: string, b: string, k: number) => {
  const x = hex(a);
  const y = hex(b);
  return rgb([mel(x[0], y[0], k), mel(x[1], y[1], k), mel(x[2], y[2], k)]);
};
/** [phase, horizon, milieu, zénith] */
const CLES: Array<[number, string, string, string]> = [
  [0.0, "#FF8444", "#D4506E", "#4A2F66"],
  [0.5, "#E5586A", "#8A3F7E", "#2A2358"],
  [1.0, "#2B3C73", "#1A2658", "#080C24"],
];
/** Phase du jour (0 = soleil bas et rouge, 1 = nuit bleue). */
export const phase = (T: number) => Math.min(1, Math.max(0, T / 46));
export function couleursCiel(ph: number): { h: string; m: string; t: string } {
  const i = ph < CLES[1][0] ? 0 : 1;
  const a = CLES[i];
  const b = CLES[i + 1];
  const k = (ph - a[0]) / (b[0] - a[0]);
  return { h: melC(a[1], b[1], k), m: melC(a[2], b[2], k), t: melC(a[3], b[3], k) };
}
/** Couleur du brouillard (brume basse de la vallée) à l'instant T. */
export function couleurBrume(T: number): string {
  const c = couleursCiel(phase(T));
  return melC(c.h, c.m, 0.3);
}
export const hexMel = melC;
