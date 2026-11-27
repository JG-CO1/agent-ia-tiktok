/**
 * Le temps qui saute : chaque coup d'œil au téléphone est un « battement » (flash cyan, le jour et la nuit défilent en
 * éclair, l'année change). Tout est calculé à partir des instants des mots (`ev`) : jamais de temps fixes.
 */
import { entre, lisse, mel } from "../../maths";

/** Instants des battements (le flash est au maximum à cet instant ; les changements d'apparence se font à cet instant). */
export const battements = (ev: Record<string, number>): number[] => [ev.b1, ev.b2, ev.b3, ev.b4, ev.b5];

/** Année affichée à chaque palier, et heure de la journée (0–24) où le jour se stabilise après chaque battement. */
const ANNEES = [2025, 2026, 2031, 2045, 2058, 2071];
const HEURES = [19.3, 19.4, 16.6, 17.9, 20.3, 17.6];
/** Durée du saut (s). */
export const SAUT = 0.55;

/** Flash cyan d'un battement : montée rapide jusqu'à l'instant, retombée en ~0,45 s (0..1). */
export function eclat(T: number, tb: number): number {
  return entre(T, tb - 0.12, tb) * (1 - lisse(entre(T, tb + 0.04, tb + 0.5)));
}
export function eclatTotal(T: number, ev: Record<string, number>): number {
  let a = 0;
  for (const tb of battements(ev)) a = Math.max(a, eclat(T, tb));
  return a;
}

/** Année affichée sur l'écran (entier) : le compteur défile à chaque battement, puis file jusqu'à 2085 pendant « le monde continue sans moi ». */
export function annee(T: number, ev: Record<string, number>): number {
  let a = ANNEES[0];
  battements(ev).forEach((tb, i) => {
    a = mel(a, ANNEES[i + 1], lisse(entre(T, tb, tb + SAUT)));
  });
  const fin = lisse(entre(T, ev.spin0, ev.spin1));
  a = mel(a, 2085, fin);
  return Math.floor(a + 0.0001);
}

/**
 * Heure de la journée (0–24, modulo) vue de la chambre ou du salon : lente dérive du soir, un jour complet qui défile
 * en 0,55 s à chaque battement (puis on se stabilise à l'heure du palier), accélération folle pendant la scène 3.
 */
export function heure(T: number, ev: Record<string, number>): number {
  let h = HEURES[0] + 0.012 * T;
  battements(ev).forEach((tb, i) => {
    const k = lisse(entre(T, tb, tb + SAUT));
    h += k * (24 + HEURES[i + 1] - HEURES[i]);
  });
  const acc = entre(T, ev.spin0, ev.spin1);
  h += 24 * 3.2 * acc * acc * (3 - 2 * acc) * 0.9 + 24 * 0.8 * acc;
  return ((h % 24) + 24) % 24;
}

// ------------------------------------------------------------------ Ciel selon l'heure
const STOPS: Array<[number, string]> = [
  [0, "#070B1E"],
  [4.5, "#0B1233"],
  [5.6, "#3A3B6E"],
  [6.4, "#E58A5B"],
  [7.6, "#9CC6EA"],
  [12, "#7FC4F2"],
  [16, "#86BDE8"],
  [17.4, "#F2A15A"],
  [18.6, "#F0764A"],
  [19.5, "#8B4C7E"],
  [20.5, "#2C2C5E"],
  [22, "#0E1230"],
  [24, "#070B1E"],
];
const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const vers = (r: number, g: number, b: number) => `#${[r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")).join("")}`;
export function cielHeure(h: number): string {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [h0, c0] = STOPS[i];
    const [h1, c1] = STOPS[i + 1];
    if (h >= h0 && h <= h1) {
      const k = (h - h0) / (h1 - h0);
      const a = hex(c0);
      const b = hex(c1);
      return vers(mel(a[0], b[0], k), mel(a[1], b[1], k), mel(a[2], b[2], k));
    }
  }
  return STOPS[0][1];
}
/** Lumière du soleil à l'heure h : intensité 0..1, couleur chaude près de l'horizon, et hauteur (−1..1). */
export function soleil(h: number): { lum: number; couleur: string; haut: number } {
  const haut = Math.sin(((h - 6) / 12) * Math.PI); // soleil levé entre 6 h et 18 h
  const lum = Math.max(0, Math.min(1, haut * 1.6));
  const chaud = 1 - Math.max(0, Math.min(1, haut * 2.2));
  const nuit = haut < 0 ? Math.min(1, -haut * 3) : 0;
  const a = hex("#FFF3D0");
  const o = hex("#FF8A3C");
  const c = hex("#6C86D8");
  const base = [mel(a[0], o[0], chaud), mel(a[1], o[1], chaud), mel(a[2], o[2], chaud)];
  return { lum: haut > -0.12 ? Math.max(lum, 0.18 * (1 - nuit)) : 0.12, couleur: haut > 0 ? vers(base[0], base[1], base[2]) : vers(mel(o[0], c[0], nuit), mel(o[1], c[1], nuit), mel(o[2], c[2], nuit)), haut };
}
