/**
 * Plan de la ville « In This Town » (repère : x vers la droite, z vers la caméra de départ, y vers le haut ; 1 unité ≈ 0,3 m).
 * Tout ce qui est réutilisable d'une vidéo à l'autre est ici : la rue, le terrain de basket, la maison de fête,
 * les maisons. Un avatar debout mesure ~3 ; un panier est à 5.
 *
 *            z = -78  [ MAISON DE FÊTE ]            (au bout de la rue, visible de partout)
 *                         |  rue (x = 0, largeur 7)
 *   [maisons gauche]      |      [maisons droite]
 *   [ TERRAIN  x -21..-7 ]|
 *            z = +70  (début de la rue)
 */
import type { V3 } from "../geo";
import { versMonde } from "../geo";

export const R_BALLE = 0.3;
export const G = 16; // gravité (unités/s²), réglée pour un ballon « de jeu » un peu léger

// ---------------------------------------------------------------- Rue
export const RUE = { x: 0, demiLargeur: 3.5, zDebut: 72, zFin: -56, trottoirG: -4.6, trottoirD: 4.6 };

// ---------------------------------------------------------------- Terrain de basket (bleu et orange)
export const TERRAIN = { cx: -14, cz: 6, w: 14, l: 26 };
export const TERRAIN_BORDS = { x0: TERRAIN.cx - TERRAIN.w / 2, x1: TERRAIN.cx + TERRAIN.w / 2, z0: TERRAIN.cz - TERRAIN.l / 2, z1: TERRAIN.cz + TERRAIN.l / 2 };
export const H_PANIER = 5.0;
export const R_ANNEAU = 0.62;
/** centre de chaque anneau (A : côté fête / B : côté opposé) */
export const PANIER_A: V3 = [TERRAIN.cx, H_PANIER, TERRAIN_BORDS.z0 + 1.0];
export const PANIER_B: V3 = [TERRAIN.cx, H_PANIER, TERRAIN_BORDS.z1 - 1.0];
/** là où s'entraîne le personnage principal, face au panier A */
export const DEPART: V3 = [TERRAIN.cx + 0.8, 0, 3.6];
export const RY_VERS_A = Math.PI; // lacet d'un avatar qui regarde vers -z (la fête, le panier A)

// ---------------------------------------------------------------- Maison de fête
export const FETE = { o: [0, 0, -80] as V3, ry: 0, w: 20, d: 12, h: 8 };
/** fenêtres de la maison de fête (repère local, façade en z = 0) : x, y, largeur, hauteur */
export const FENETRES_FETE: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: -7.5, y: 2.6, w: 2.6, h: 2.2 },
  { x: -3.4, y: 2.6, w: 2.6, h: 2.2 },
  { x: 3.4, y: 2.6, w: 2.6, h: 2.2 },
  { x: 7.5, y: 2.6, w: 2.6, h: 2.2 },
  { x: -7.5, y: 6.0, w: 2.6, h: 2.0 },
  { x: -2.5, y: 6.0, w: 2.6, h: 2.0 },
  { x: 2.5, y: 6.0, w: 2.6, h: 2.0 },
  { x: 7.5, y: 6.0, w: 2.6, h: 2.0 },
];
export const feteMonde = (p: V3): V3 => versMonde(FETE.o, FETE.ry, p);
/** enceintes de la maison de fête (repère local) */
export const ENCEINTES: V3[] = [[-6.2, 0, 3.4], [6.2, 0, 3.4]];
/** guirlandes : de chaque poteau (repère local de la fête) vers le toit */
export const POTEAUX_FETE: V3[] = [[-13.5, 0, 9], [13.5, 0, 9], [-13.5, 0, -2], [13.5, 0, -2]];

// ---------------------------------------------------------------- Maisons (toutes tournées vers la rue sauf précision)
export type MaisonDef = { p: V3; ry: number; w: number; d: number; h: number; mur: string; toit: string; porteX: number; porteC: string; fen: Array<{ x: number; w: number }>; volets?: string; cheminee?: number };
const PI2 = Math.PI / 2;
const m = (p: V3, ry: number, mur: string, toit: string, porteC: string, cote: 1 | -1, cheminee?: number): MaisonDef => ({
  p,
  ry,
  w: 9,
  d: 7.5,
  h: 4.4,
  mur,
  toit,
  porteX: cote * 2.2,
  porteC,
  fen: [{ x: -cote * 1.6, w: 2.2 }],
  volets: toit,
  cheminee,
});
export const MAISONS: MaisonDef[] = [
  // côté droit (x > 0), façade vers -x
  m([9.6, 0, 30], -PI2, "#E3D2C0", "#7A4A35", "#5E7F5A", 1, -2.4),
  m([9.6, 0, 13], -PI2, "#A9B7C7", "#5B4A7C", "#E8E2D2", -1),
  m([9.6, 0, -5], -PI2, "#D9C9A8", "#8E4B3C", "#3F5C7A", 1, 2.4),
  m([9.6, 0, -23], -PI2, "#CFE0C0", "#3F6E5C", "#7C4636", -1),
  m([9.6, 0, -41], -PI2, "#E6DCC6", "#4B6791", "#4B6791", 1),
  // côté gauche (x < 0), façade vers +x : avant et après le terrain
  m([-9.6, 0, 36], PI2, "#BFC9D2", "#6B4A7C", "#7C4636", 1),
  m([-9.6, 0, 54], PI2, "#E3D2C0", "#3F6E5C", "#5E7F5A", -1, -2.4),
  m([-9.6, 0, -22], PI2, "#D8C7A8", "#A5483C", "#3F5C7A", 1, 2.4),
  m([-9.6, 0, -40], PI2, "#A9B7C7", "#7A4A35", "#E8E2D2", -1),
  // second rang, derrière le terrain
  m([-34, 0, -4], PI2, "#E9B8A0", "#3F6E5C", "#5B4634", 1),
  m([-34, 0, 14], PI2, "#BFC9D2", "#7A4A35", "#5B4634", -1),
  m([-34, 0, 32], PI2, "#D9C9A8", "#8E4B3C", "#5B4634", 1),
  m([22, 0, 22], -PI2, "#CFE0C0", "#6B3F3F", "#5B4634", 1),
  m([22, 0, -14], -PI2, "#E3D2C0", "#4B6791", "#5B4634", -1),
  m([22, 0, -50], -PI2, "#A9B7C7", "#8E4B3C", "#5B4634", 1),
];

export const LAMPADAIRES: Array<{ p: V3; ry: number }> = [];
for (let z = 60; z >= -48; z -= 18) {
  LAMPADAIRES.push({ p: [RUE.trottoirD + 0.4, 0, z], ry: -PI2 });
  LAMPADAIRES.push({ p: [RUE.trottoirG - 0.4, 0, z - 9], ry: PI2 });
}
/** projecteurs du terrain (poteaux aux quatre coins) */
export const PROJECTEURS: V3[] = [
  [TERRAIN_BORDS.x0 - 0.8, 0, TERRAIN_BORDS.z0 - 0.8],
  [TERRAIN_BORDS.x1 + 0.8, 0, TERRAIN_BORDS.z0 - 0.8],
  [TERRAIN_BORDS.x0 - 0.8, 0, TERRAIN_BORDS.z1 + 0.8],
  [TERRAIN_BORDS.x1 + 0.8, 0, TERRAIN_BORDS.z1 + 0.8],
];
export const H_PROJECTEUR = 9.5;

// ---------------------------------------------------------------- Musique de la fête
export const BPM = 120;
export const PERIODE = 60 / BPM;

/** Points d'une guirlande (parabole) entre `a` et `c` : n points, affaissement `sag`. */
export function guirlande(a: V3, c: V3, n: number, sag: number): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    out.push([a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k - sag * 4 * k * (1 - k), a[2] + (c[2] - a[2]) * k]);
  }
  return out;
}
/** Les guirlandes de la fête (repère local) : [début, fin, nombre, affaissement] */
export const GUIRLANDES: Array<[V3, V3, number, number]> = [
  [[-13.5, 7.4, 9], [-10.2, 8.6, 0.2], 12, 0.9],
  [[13.5, 7.4, 9], [10.2, 8.6, 0.2], 12, 0.9],
  [[-13.5, 7.4, 9], [13.5, 7.4, 9], 24, 1.4],
  [[-13.5, 6.4, -2], [-10.2, 8.6, 0.2], 10, 0.8],
  [[13.5, 6.4, -2], [10.2, 8.6, 0.2], 10, 0.8],
];
