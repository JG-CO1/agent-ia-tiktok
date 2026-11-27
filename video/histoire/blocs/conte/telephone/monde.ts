/**
 * « Chaque fois que je regarde mon téléphone… » — décors fixes en blocs (ombrage cuit par face). Quatre lieux, à plus de
 * 400 unités les uns des autres (la caméra ne voit que celui où elle se trouve) :
 *   CHAMBRE (-500, 0, 0)  la chambre de Noa (lit, bureau, posters, fenêtre sur la rue de 2025) + couloir chaud derrière la porte
 *   SALON   ( 500, 0, 0)  le salon (canapé, télé éteinte, horloge, fauteuil de grand-mère, fenêtre au couchant)
 *   RUE     (   0, 0, 0)  la rue de 2085 : route le long de l'axe x, maisons au nord (front en z = 0, perron de Noa en x = 0), au sud
 */
import * as THREE from "three";
import { Batisseur, type V3 } from "../../geo";
import { K, arbre, buisson, fenetrePleine, lampadaire, maisonSimple, sapin, toitPignon, voiture } from "../../minuit/monde";

export const CH: V3 = [-500, 0, 0];
export const SA: V3 = [500, 0, 0];
export const CH_W = 4.2;
export const CH_Z = 4.6;
export const CH_H = 3.6;
export const SA_W = 5.5;
export const SA_Z = 4.8;
export const SA_H = 3.6;
/** fenêtre de la chambre (mur du fond, z = -CH_Z) */
export const FEN_CH = { x0: -1.7, x1: 1.7, y0: 1.2, y1: 3.1 };
/** porte de la chambre (mur de droite, x = +CH_W, face au lit) : z entre z0 et z1 ; le couloir chaud est derrière */
export const PORTE_CH = { z0: 0.5, z1: 3.3, h: 3.0 };
/** fenêtre du salon (mur de droite, x = +SA_W) : z relatifs à SA */
export const FEN_SA = { z0: -2.2, z1: 0.6, y0: 1.2, y1: 3.1 };
/** niveau de l'assise du lit, du canapé, du fauteuil */
export const LIT_Y = 0.52;
/** perron de la maison de Noa (rue) : haut du palier */
export const PERRON_Y = 0.3;
export const ROUTE_Z = 14;

export type Zones = {
  chambre: THREE.BufferGeometry;
  couloir: THREE.BufferGeometry;
  salon: THREE.BufferGeometry;
  rue: THREE.BufferGeometry;
  /** voitures de 2085 (une géométrie par couleur) */
  voitures: Record<string, THREE.BufferGeometry>;
  /** voiture de 2025, bien carrée (vue par la fenêtre de la chambre) */
};

// ------------------------------------------------------------------ Outils
function affiche(b: Batisseur, o: V3, sens: 1 | -1, w: number, h: number, fond: string, motif: Array<[number, number, number, number, string]>) {
  // affiche contre un mur dont la normale est ±x : (z, y) = centre, motif = [dz, dy, largeur, hauteur, couleur]
  b.boite([o[0], o[1], o[2]], [0.05, h, w], fond);
  b.boite([o[0] + sens * 0.01, o[1], o[2]], [0.07, h - 0.12, w - 0.12], fond, undefined, 1.08);
  for (const [dz, dy, ww, hh, c] of motif) b.boite([o[0] + sens * 0.05, o[1] + dy, o[2] + dz], [0.05, hh, ww], c, undefined, 1.15);
}

/** Cadre contre un mur dont la normale est ±x. */
function cadreX(b: Batisseur, p: V3, w: number, h: number, couleur: string) {
  b.boite(p, [0.08, h + 0.16, w + 0.16], "#3A2A20");
  b.boite([p[0] - 0.03, p[1], p[2]], [0.06, h, w], couleur);
}

// ------------------------------------------------------------------ Chambre
function chambre(b: Batisseur) {
  const [X] = CH;
  const W = CH_W;
  const Z = CH_Z;
  const H = CH_H;
  const mur = "#6E7EAA";
  b.boite([X, 0.04, 0], [W * 2, 0.08, Z * 2], "#8A6A48"); // parquet
  for (let i = -3; i <= 3; i++) b.boite([X + i * 1.2, 0.09, 0], [0.05, 0.02, Z * 2], "#5B4630");
  b.boite([X, H + 0.1, 0], [W * 2 + 0.6, 0.2, Z * 2 + 0.6], "#3A4260"); // plafond
  b.boite([X - W - 0.15, H / 2, 0], [0.3, H, Z * 2 + 0.6], mur);
  // plinthes (le mur de droite, percé de la porte, est fait plus bas)
  b.boite([X - W + 0.03, 0.12, 0], [0.06, 0.24, Z * 2], "#D8D4CA");
  b.boite([X + W - 0.03, 0.12, (-Z + PORTE_CH.z0) / 2], [0.06, 0.24, Z + PORTE_CH.z0], "#D8D4CA");
  b.boite([X + W - 0.03, 0.12, (Z + PORTE_CH.z1) / 2], [0.06, 0.24, Z - PORTE_CH.z1], "#D8D4CA");
  // mur du côté +z, plein
  b.boite([X, H / 2, Z + 0.15], [W * 2 + 0.6, H, 0.3], mur);
  // mur de droite (x = +W) percé de la porte, en face du lit : la famille s'y tient, dans la lumière du couloir
  const P = PORTE_CH;
  const xr = X + W + 0.15;
  b.boite([xr, H / 2, (-Z - 0.3 + P.z0) / 2], [0.3, H, P.z0 + Z + 0.3], mur);
  b.boite([xr, H / 2, (P.z1 + Z + 0.3) / 2], [0.3, H, Z + 0.3 - P.z1], mur);
  b.boite([xr, (P.h + H) / 2, (P.z0 + P.z1) / 2], [0.3, H - P.h, P.z1 - P.z0], mur);
  b.boite([X + W - 0.05, P.h / 2, P.z0 - 0.08], [0.46, P.h, 0.16], "#E9E2D2");
  b.boite([X + W - 0.05, P.h / 2, P.z1 + 0.08], [0.46, P.h, 0.16], "#E9E2D2");
  b.boite([X + W - 0.05, P.h + 0.08, (P.z0 + P.z1) / 2], [0.46, 0.16, P.z1 - P.z0 + 0.32], "#E9E2D2");
  // la toise : traits de croissance à côté de la porte (jaune = Lila, bleu = Noa)
  for (let i = 0; i < 9; i++) {
    const y = 0.7 + i * 0.22;
    b.boite([X + W - 0.02, y, P.z0 - 0.5], [0.03, 0.045, i % 2 ? 0.34 : 0.5], "#F2C230", undefined, 1.2);
    if (i < 6) b.boite([X + W - 0.02, y + 0.1, P.z0 - 0.95], [0.03, 0.04, 0.4], "#5B9BE6", undefined, 1.1);
  }
  // mur du fond (z = -Z) percé de la fenêtre
  const zf = -Z - 0.15;
  const f = FEN_CH;
  b.boite([X + (-W + f.x0) / 2 - 0.15, H / 2, zf], [W + f.x0 + 0.3, H, 0.3], mur);
  b.boite([X + (W + f.x1) / 2 + 0.15, H / 2, zf], [W - f.x1 + 0.3, H, 0.3], mur);
  b.boite([X, f.y0 / 2, zf], [f.x1 - f.x0, f.y0, 0.3], mur);
  b.boite([X, (f.y1 + H) / 2, zf], [f.x1 - f.x0, H - f.y1, 0.3], mur);
  b.boite([X, f.y0 - 0.08, zf + 0.14], [f.x1 - f.x0 + 0.5, 0.16, 0.5], "#E4DFD2");
  b.boite([X, f.y1 + 0.1, zf + 0.05], [f.x1 - f.x0 + 0.4, 0.2, 0.3], "#E4DFD2");
  b.boite([X, (f.y0 + f.y1) / 2, zf], [0.1, f.y1 - f.y0, 0.1], "#E4DFD2");
  b.boite([X, (f.y0 + f.y1) / 2 + 0.2, zf], [f.x1 - f.x0, 0.1, 0.1], "#E4DFD2");
  // rideaux
  b.boite([X - 2.15, 2.15, zf + 0.35], [0.8, 2.9, 0.2], "#8A3F52");
  b.boite([X + 2.15, 2.15, zf + 0.35], [0.8, 2.9, 0.2], "#8A3F52");
  // lit (bas, contre le mur de gauche, tête côté couloir) : dessus du matelas à LIT_Y
  const bx = X - 2.8;
  b.boite([bx, 0.2, 2.3], [2.3, 0.3, 4.6], "#6B4A2F");
  b.boite([bx, LIT_Y - 0.14, 2.3], [2.15, 0.28, 4.4], "#E4E8F2");
  b.boite([bx, 0.9, 4.1], [1.3, 0.22, 0.8], "#F4F4F4"); // oreiller
  b.boite([bx, LIT_Y + 0.08, 1.5], [2.2, 0.2, 2.9], "#2F7D6E"); // couette
  b.boite([bx + 0.62, LIT_Y + 0.2, 0.3], [0.9, 0.06, 0.5], "#245F55");
  b.boite([bx, 1.25, 4.5], [2.3, 1.6, 0.18], "#6B4A2F"); // tête de lit
  // table de chevet + réveil éteint
  b.boite([X - 1.1, 0.45, 4.1], [0.7, 0.9, 0.7], "#5B4026");
  b.boite([X - 1.1, 1.0, 4.1], [0.34, 0.2, 0.2], "#1A1A1E");
  // posters
  affiche(b, [X - W + 0.02, 2.35, 2.2], 1, 1.7, 2.2, "#14304A", [[0, 0.5, 0.9, 0.9, "#F5D76E"], [-0.45, -0.6, 0.14, 0.14, "#FFFFFF"], [0.4, -0.2, 0.1, 0.1, "#FFFFFF"], [0.1, -0.7, 0.5, 0.2, "#2C6C8E"]]);
  affiche(b, [X - W + 0.02, 2.4, 0.2], 1, 1.2, 1.7, "#1A1A22", [[0, 0.1, 0.34, 1.0, "#F2F2F2"], [0, 0.72, 0.34, 0.3, "#E0453A"], [-0.3, -0.5, 0.2, 0.4, "#E0453A"], [0.3, -0.5, 0.2, 0.4, "#E0453A"]]);
  affiche(b, [X + W - 0.02, 2.3, -2.3], -1, 1.8, 1.4, "#E98A3C", [[-0.3, -0.2, 0.9, 0.9, "#F7C873"], [0.4, -0.35, 0.8, 0.6, "#8C3B2A"], [0.1, -0.45, 0.5, 0.3, "#5B2A20"]]);
  // bureau contre le mur du côté +z + chaise + ordinateur éteint
  b.boite([X + 1.6, 0.86, 4.0], [2.8, 0.12, 1.2], "#7A5A3A");
  for (const dx of [0.3, 2.9]) for (const dz of [3.5, 4.4]) b.boite([X + dx, 0.43, dz], [0.12, 0.86, 0.12], "#4A3622");
  b.boite([X + 1.0, 1.05, 4.0], [0.6, 0.26, 0.8], "#2A2D36"); // portable fermé
  b.boite([X + 2.4, 1.12, 3.9], [0.24, 0.26, 0.24], "#E9E2D2"); // tasse
  b.boite([X + 1.6, 2.4, 4.45], [2.4, 0.06, 0.5], "#5B4026"); // étagère
  for (let i = 0; i < 6; i++) b.boite([X + 0.7 + i * 0.36, 2.65, 4.45], [0.2, 0.5 - (i % 3) * 0.08, 0.4], ["#B6483C", "#3F6FA6", "#E2B53A", "#4B9B6A", "#7A4FA0", "#D98A3C"][i]);
  b.boite([X + 1.6, 0.55, 3.0], [0.8, 0.1, 0.8], "#3A3A44"); // chaise : assise
  b.boite([X + 1.6, 1.1, 2.6], [0.8, 1.0, 0.1], "#3A3A44");
  for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]] as Array<[number, number]>) b.boite([X + 1.6 + dx, 0.25, 3.0 + dz], [0.08, 0.5, 0.08], "#26262C");
  // tapis, armoire, plante
  b.boite([X + 0.4, 0.075, -0.2], [3.4, 0.04, 3.0], "#7A3F6C");
  b.boite([X + 0.4, 0.1, -0.2], [2.6, 0.03, 2.2], "#9A5A86");
  b.boite([X + 3.2, 1.8, -3.8], [1.7, 3.6, 1.0], "#3F2F22");
  b.boite([X + 3.2, 1.8, -3.28], [0.04, 3.0, 0.04], "#2A1E15");
  b.boite([X - 3.5, 0.3, -3.6], [0.6, 0.6, 0.6], "#A5603A");
  b.boite([X - 3.5, 0.85, -3.6], [0.8, 0.7, 0.8], "#3E8B4A");
  b.boite([X - 3.4, 1.35, -3.5], [0.5, 0.5, 0.5], "#4FA25A");
  // dehors : la rue de 2025 vue par la fenêtre (maisons d'en face, voitures carrées, lampadaire)
  b.boite([X, -0.5, -40], [400, 1, 120], "#3E6B45");
  b.boite([X, -0.06, -14], [140, 0.2, 7], "#555A63");
  b.boite([X, 0.06, -10.2], [140, 0.14, 1.6], "#9A9EA8");
  for (let i = -5; i <= 5; i++) {
    const x = X + i * 12;
    b.dans([x, 0, -26], 0, () => maisonSimple(b, { w: 9, d: 7.5, h: 4.4, mur: ["#CDB89A", "#AEB9C9", "#D2C2A3"][(i + 5) % 3], toit: ["#5A3B30", "#3B4A63", "#5E4A3A"][(i + 5) % 3], porteX: 2.2, porteC: "#5E7F5A", fen: [{ x: -1.6, w: 2.2 }], volets: "#3B4A63", cheminee: -2.4 }));
  }
  for (const dx of [-30, -8, 16, 34]) arbre(b, X + dx, -17.5, 1.1, dx);
  voiture(b, [X - 7, 0.02, -15.8], Math.PI / 2, "#9A2F2F");
  voiture(b, [X + 11, 0.02, -12.2], -Math.PI / 2, "#5E6B7A");
  voiture(b, [X + 2.5, 0.02, -15.8], Math.PI / 2, "#C9C2B2");
  lampadaire(b, [X - 3.2, 0, -10.4], Math.PI);
  lampadaire(b, [X + 14, 0, -10.4], Math.PI);
  b.cone([X - 80, -0.2, -120], 60, 60, "#2F3A55", 7, 0.3);
  b.cone([X + 70, -0.2, -130], 70, 70, "#27324D", 7, 0.8);
}

/** Couloir chaud derrière la porte de la chambre (mur de droite) : de la lumière orange qui déborde. */
function couloir(b: Batisseur) {
  const [X] = CH;
  const P = PORTE_CH;
  const zc = (P.z0 + P.z1) / 2;
  const w = 6.4;
  const x0 = X + CH_W + 0.3;
  const L = 4.0;
  b.boite([x0 + L / 2, 0.04, zc], [L, 0.08, w], "#B88B5A");
  b.boite([x0 + L / 2, 3.5, zc], [L, 0.2, w], "#E8D5B5");
  b.boite([x0 + L / 2, 1.75, zc - w / 2], [L, 3.5, 0.2], "#E9C48A");
  b.boite([x0 + L / 2, 1.75, zc + w / 2], [L, 3.5, 0.2], "#E9C48A");
  b.boite([x0 + L, 1.75, zc], [0.2, 3.5, w], "#F0CC92");
  cadreX(b, [x0 + L - 0.15, 2.1, zc - 1.2], 1.1, 0.8, "#C7584A");
  cadreX(b, [x0 + L - 0.15, 2.0, zc + 1.4], 0.8, 1.1, "#6FA0C8");
  b.boite([x0 + L - 0.5, 0.3, zc], [0.5, 0.6, 1.8], "#6B4A2F"); // commode
  b.boite([x0 + 0.4, 0.9, zc + 2.7], [0.3, 1.8, 0.5], "#7A5A3A"); // porte-manteau
  b.boite([x0 + 0.62, 1.7, zc + 2.7], [0.14, 0.8, 0.4], "#4C6FA8");
}

// ------------------------------------------------------------------ Salon
function salon(b: Batisseur) {
  const [X] = SA;
  const W = SA_W;
  const Z = SA_Z;
  const H = SA_H;
  const mur = "#D6B88C";
  b.boite([X, 0.04, 0], [W * 2, 0.08, Z * 2], "#9A7048");
  for (let i = -4; i <= 4; i++) b.boite([X + i * 1.2, 0.09, 0], [0.05, 0.02, Z * 2], "#6E4F32");
  b.boite([X, H + 0.1, 0], [W * 2 + 0.6, 0.2, Z * 2 + 0.6], "#E6D9C0");
  b.boite([X - W - 0.15, H / 2, 0], [0.3, H, Z * 2 + 0.6], mur);
  b.boite([X, H / 2, -Z - 0.15], [W * 2 + 0.6, H, 0.3], mur);
  b.boite([X, H / 2, Z + 0.15], [W * 2 + 0.6, H, 0.3], mur);
  // mur de droite percé de la fenêtre (z0..z1 relatifs)
  const f = FEN_SA;
  const xr = X + W + 0.15;
  b.boite([xr, H / 2, (-Z - 0.3 + f.z0) / 2], [0.3, H, f.z0 + Z + 0.3], mur);
  b.boite([xr, H / 2, (Z + 0.3 + f.z1) / 2], [0.3, H, Z + 0.3 - f.z1], mur);
  b.boite([xr, f.y0 / 2, (f.z0 + f.z1) / 2], [0.3, f.y0, f.z1 - f.z0], mur);
  b.boite([xr, (f.y1 + H) / 2, (f.z0 + f.z1) / 2], [0.3, H - f.y1, f.z1 - f.z0], mur);
  b.boite([X + W - 0.12, f.y0 - 0.08, (f.z0 + f.z1) / 2], [0.5, 0.16, f.z1 - f.z0 + 0.5], "#F0EADC");
  b.boite([X + W - 0.05, (f.y0 + f.y1) / 2, (f.z0 + f.z1) / 2], [0.1, f.y1 - f.y0, 0.1], "#F0EADC");
  b.boite([X + W - 0.05, f.y1 + 0.08, (f.z0 + f.z1) / 2], [0.3, 0.16, f.z1 - f.z0 + 0.4], "#F0EADC");
  b.boite([X + W - 0.4, 2.15, f.z0 - 0.55], [0.2, 2.9, 0.8], "#B9533F");
  b.boite([X + W - 0.4, 2.15, f.z1 + 0.55], [0.2, 2.9, 0.8], "#B9533F");
  for (const s of [-1, 1]) b.boite([X + s * (W - 0.03), 0.12, 0], [0.06, 0.24, Z * 2], "#F0EADC");
  // tapis
  b.boite([X, 0.075, 0.6], [6.2, 0.04, 4.2], "#8E4B3C");
  b.boite([X, 0.1, 0.6], [5.0, 0.03, 3.0], "#B7694F");
  // meuble télé (mur du fond)
  b.boite([X - 0.2, 0.4, -4.3], [3.2, 0.8, 0.8], "#5B4026");
  b.boite([X - 0.2, 1.62, -4.5], [2.9, 1.6, 0.16], "#0B0C10");
  b.boite([X - 0.2, 1.62, -4.4], [2.7, 1.42, 0.06], "#181B24");
  b.boite([X - 0.2, 0.9, -4.3], [0.8, 0.12, 0.3], "#2A2A30");
  // horloge murale (le cadran et les aiguilles sont dynamiques)
  b.boite([X - 0.2, 3.0, -4.7], [1.34, 1.34, 0.1], "#3A2A20");
  // canapé (mur du côté +z), face à la télé : assise à y = LIT_Y + 0.0
  const sx = X - 0.3;
  b.boite([sx, 0.3, 3.5], [3.4, 0.6, 1.5], "#4F6A8C");
  b.boite([sx, 0.62, 3.35], [3.2, 0.24, 1.2], "#5E7BA0");
  b.boite([sx, 1.2, 4.2], [3.4, 1.3, 0.4], "#4F6A8C");
  for (const s of [-1, 1]) b.boite([sx + s * 1.75, 0.55, 3.6], [0.28, 0.9, 1.5], "#425A78");
  b.boite([sx - 1.05, 0.95, 3.9], [0.7, 0.6, 0.2], "#E2B53A", [0.2, 0.2, 0]);
  // table basse, tasses, livres
  b.boite([X - 0.3, 0.42, 1.0], [1.9, 0.1, 1.0], "#6B4A2F");
  for (const [dx, dz] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]] as Array<[number, number]>) b.boite([X - 0.3 + dx, 0.2, 1.0 + dz], [0.1, 0.4, 0.1], "#4A3622");
  b.boite([X - 0.7, 0.58, 1.0], [0.3, 0.22, 0.3], "#E9E2D2");
  b.boite([X + 0.1, 0.52, 0.9], [0.5, 0.1, 0.4], "#3F6FA6");
  // fauteuil de grand-mère : au fond à droite, tourné vers la télé (coin), pouf devant
  b.dans([X + 3.3, 0, -0.9], -Math.PI * 0.75, () => {
    b.boite([0, 0.28, 0], [1.5, 0.56, 1.4], "#8E4638"); // assise
    b.boite([0, 0.66, 0.05], [1.2, 0.2, 1.1], "#A55546"); // coussin
    b.boite([0, 1.25, -0.62], [1.5, 1.7, 0.3], "#8E4638"); // dossier
    b.boite([0, 1.78, -0.55], [0.7, 0.4, 0.14], "#EDE6D8"); // dentelle
    for (const s of [-1, 1]) b.boite([s * 0.78, 0.62, 0.02], [0.26, 0.8, 1.3], "#7A3A2E");
    b.boite([0, 0.2, 1.3], [0.9, 0.4, 0.8], "#6B2F26"); // pouf
  });
  // étagère de gauche, photos de famille, lampe sur pied, plante
  b.boite([X - W + 0.4, 1.9, -1.2], [0.7, 3.8, 3.0], "#5B4026");
  for (let i = 0; i < 4; i++) b.boite([X - W + 0.42, 0.7 + i * 0.85, -1.2], [0.64, 0.1, 2.9], "#7A5A3A");
  for (let i = 0; i < 5; i++) b.boite([X - W + 0.45, 1.05, -2.3 + i * 0.5], [0.4, 0.4, 0.4], ["#B6483C", "#3F6FA6", "#E2B53A", "#4B9B6A", "#7A4FA0"][i]);
  for (let i = 0; i < 3; i++) cadrePhoto(b, [X - W + 0.45, 2.1, -2.0 + i * 0.9], ["#E9C27F", "#9CC3E0", "#E9A9A0"][i]);
  b.boite([X + 4.7, 0.9, 1.6], [0.1, 1.8, 0.1], "#2A2A30");
  b.boite([X + 4.7, 1.9, 1.6], [0.7, 0.5, 0.7], "#F5D9A0", undefined, 1.3);
  b.boite([X + 4.7, 0.05, 1.6], [0.5, 0.1, 0.5], "#2A2A30");
  b.boite([X - 4.4, 0.3, 3.9], [0.6, 0.6, 0.6], "#A5603A");
  b.boite([X - 4.4, 0.95, 3.9], [0.9, 0.9, 0.9], "#3E8B4A");
}

function cadrePhoto(b: Batisseur, p: V3, c: string) {
  b.boite(p, [0.06, 0.62, 0.56], "#3A2A20");
  b.boite([p[0] + 0.03, p[1], p[2]], [0.05, 0.5, 0.44], c, undefined, 1.1);
}

// ------------------------------------------------------------------ Rue de 2085
const VIVES = ["#E5338E", "#18C5B8", "#FFC21A", "#8A4DFF", "#FF6B3A", "#3AA0FF", "#7CD64A"];
function maison2085(b: Batisseur, x: number, z: number, ry: number, i: number) {
  const mur = ["#E9B7A0", "#9ED7C6", "#F2D27A", "#B5A8E8", "#F2A08A", "#8FC3EE"][i % 6];
  const toit = ["#2E3A5C", "#3B2E5C", "#2A4A5C", "#4A2E4A"][i % 4];
  b.dans([x, 0, z], ry, () => {
    maisonSimple(b, { w: 11, d: 9, h: 5, mur, toit, porteX: i % 2 ? -2.6 : 2.6, porteC: VIVES[i % VIVES.length], fen: [{ x: i % 2 ? 2.2 : -2.2, w: 2.6 }], volets: toit, cheminee: i % 2 ? -3.4 : 3.4 });
    // panneaux solaires sur le toit
    b.boite([-2.2, 6.4, -3.4], [3.6, 0.12, 2.4], "#16224A", [0.4, 0, 0], 1.3);
    b.boite([2.2, 6.4, -3.4], [3.6, 0.12, 2.4], "#16224A", [0.4, 0, 0], 1.3);
    // enseigne lumineuse au-dessus de la porte
    b.boite([i % 2 ? -2.6 : 2.6, 4.1, 0.2], [2.0, 0.5, 0.12], ["#FF4FA3", "#2EE6D6", "#FFD23A"][i % 3], undefined, 1.6);
  });
}
function lampadaire2085(b: Batisseur, x: number, z: number, cote: 1 | -1) {
  b.boite([x, 0.15, z], [0.5, 0.3, 0.5], "#4A5068");
  b.cylindre([x, 0.3, z], 0.1, 4.6, "#7A84A6", 8, 0.07);
  b.boite([x, 4.9, z + cote * 0.5], [0.12, 0.12, 1.1], "#7A84A6");
  b.boule([x, 4.8, z + cote * 1.05], [0.55, 0.55, 0.55], "#BFF7FF", 1);
}
/** Lampadaires de 2085 (x, z, côté) : jamais devant la maison de Noa. */
export const LAMPES: Array<[number, number, 1 | -1]> = Array.from({ length: 11 }, (_, i) => -103 + i * 22).flatMap((x) => [[x, 9.2, 1], [x + 11, 18.9, -1]] as Array<[number, number, 1 | -1]>);
function ruePaysage(b: Batisseur) {
  b.boite([0, -0.5, 10], [600, 1, 240], "#4C7A45");
  b.boite([0, 0.07, 8], [400, 0.14, 4], "#C2BBAA"); // trottoir nord
  b.boite([0, 0.07, 20], [400, 0.14, 4], "#C2BBAA"); // trottoir sud
  b.boite([0, 0.0, ROUTE_Z], [400, 0.12, 8], "#3E4150");
  for (let x = -120; x <= 120; x += 6) b.boite([x, 0.07, ROUTE_Z], [3, 0.02, 0.18], "#F3E7B8");
  b.boite([0, 0.1, 10.1], [400, 0.14, 0.22], "#D9D4C6");
  b.boite([0, 0.1, 17.9], [400, 0.14, 0.22], "#D9D4C6");
  // maisons du nord (face à +z) : la maison de Noa est faite à part
  const nord = [-96, -76, -56, -36, -18, 18, 36, 56, 76, 96];
  nord.forEach((x, i) => maison2085(b, x, 0, 0, i));
  // maisons du sud (face à -z), un peu plus loin
  [-84, -62, -40, -18, 4, 26, 48, 70, 92].forEach((x, i) => maison2085(b, x, 31, Math.PI, i + 3));
  // arbres, haies, lampadaires de 2085
  for (const [x, z, cote] of LAMPES) lampadaire2085(b, x, z, cote);
  for (const [x, z] of [[-27, 7.4], [27, 7.4], [-45, 19.6], [45, 19.6], [-66, 7.4], [66, 7.4], [10, 19.6], [-12, 19.6]] as Array<[number, number]>) arbre(b, x, z, 1.5, x);
  for (const [x, z] of [[-15, 4.5], [15, 4.5], [-24, 4.5], [26, 4.5]] as Array<[number, number]>) buisson(b, [x, 0, z], 1.4);
  // bannières et affiches lumineuses
  for (const [x, c] of [[-50, "#FF4FA3"], [-8, "#2EE6D6"], [30, "#FFD23A"], [62, "#8A4DFF"]] as Array<[number, string]>) {
    b.boite([x, 7.3, ROUTE_Z - 2.2], [4.0, 1.2, 0.12], c, undefined, 1.7);
    b.cylindre([x - 2.1, 0, ROUTE_Z - 2.2], 0.08, 7.4, "#7A84A6", 6);
    b.cylindre([x + 2.1, 0, ROUTE_Z - 2.2], 0.08, 7.4, "#7A84A6", 6);
  }
  // collines au loin
  b.cone([-130, -0.2, -90], 90, 70, "#5A6E8C", 7, 0.3);
  b.cone([40, -0.2, -120], 110, 90, "#4E6283", 7, 0.8);
  b.cone([170, -0.2, -80], 80, 60, "#5A6E8C", 7, 0.1);
  for (const [x, z] of [[-60, -30], [-30, -24], [30, -26], [64, -30], [100, -22]] as Array<[number, number]>) sapin(b, x, z, 2.2);
}
/** La maison de Noa : devenue ancienne, un peu défraîchie, un perron couvert. Façade en z = 0, tournée vers +z. */
function maisonNoa(b: Batisseur) {
  const w = 14;
  const d = 12;
  const h = 5.2;
  const mur = "#C9B79B";
  const SOL = 0.3;
  b.boite([0, SOL / 2, -d / 2], [w + 0.3, SOL, d + 0.3], K.socle);
  // façade percée de la porte (x ∈ [-1, 1], y ∈ [SOL, SOL + 3.1])
  const hm = h - SOL;
  b.boite([-4.0, SOL + hm / 2, -0.15], [6.0 + 0.0, hm, 0.3], mur); // x ∈ [-7, -1]
  b.boite([4.0, SOL + hm / 2, -0.15], [6.0, hm, 0.3], mur);
  b.boite([0, SOL + 3.1 + (hm - 3.1) / 2, -0.15], [2.0, hm - 3.1, 0.3], mur);
  b.boite([0, SOL + hm / 2, -d + 0.15], [w, hm, 0.3], mur);
  b.boite([-w / 2 + 0.15, SOL + hm / 2, -d / 2], [0.3, hm, d - 0.6], mur);
  b.boite([w / 2 - 0.15, SOL + hm / 2, -d / 2], [0.3, hm, d - 0.6], mur);
  toitPignon(b, w, d, h, mur, "#5B4636", 3.6);
  // intérieur sombre derrière la porte
  b.boite([0, SOL + 1.6, -1.2], [1.9, 3.2, 2.0], "#05060A");
  // cadre de porte + auvent + poteaux + rambarde
  b.boite([-1.1, SOL + 1.6, 0.05], [0.2, 3.3, 0.3], "#EDE6D8");
  b.boite([1.1, SOL + 1.6, 0.05], [0.2, 3.3, 0.3], "#EDE6D8");
  b.boite([0, SOL + 3.3, 0.05], [2.4, 0.2, 0.3], "#EDE6D8");
  // perron : palier (z ∈ [0, 2.2]) à la hauteur du seuil, deux marches
  b.boite([0, SOL / 2, 1.2], [5.0, SOL, 2.4], "#A39D92");
  b.boite([0, 0.1, 2.9], [5.0, 0.2, 1.0], "#8F897F");
  b.boite([0, 0.06, 3.7], [5.0, 0.12, 0.7], "#7C776E");
  // auvent
  b.boite([0, SOL + 3.9, 1.4], [5.6, 0.2, 3.0], "#5B4636", [0.08, 0, 0]);
  for (const s of [-1, 1]) {
    b.boite([s * 2.5, SOL + 1.9, 2.5], [0.22, 3.8, 0.22], "#EDE6D8");
    b.boite([s * 2.5, SOL + 0.55, 1.3], [0.1, 0.9, 2.4], "#EDE6D8"); // rambarde
    b.boite([s * 2.5, SOL + 0.98, 1.3], [0.16, 0.1, 2.5], "#EDE6D8");
  }
  b.boite([0, SOL + 0.55, 2.5], [0.1, 0.5, 0.1], "#EDE6D8");
  // fenêtres de chaque côté (vitres allumées : une teinte chaude)
  for (const x of [-4.2, 4.2]) {
    fenetrePleine(b, x, SOL + 2.3, 2.6, 1.9, "#5B4636");
    b.boite([x, SOL + 2.3, 0.07], [2.4, 1.7, 0.04], "#F4C97A", undefined, 1.5);
  }
  // une jardinière, une boîte aux lettres, des herbes folles
  b.boite([-3.6, 0.4, 3.8], [1.4, 0.5, 0.5], "#7A5236");
  b.boite([-3.6, 0.82, 3.8], [1.2, 0.35, 0.4], "#4FA25A");
  b.boite([4.6, 0.45, 3.4], [0.5, 0.9, 0.5], "#4FA25A");
  b.boite([-6.4, 0.5, 2.6], [1.0, 1.0, 1.0], "#3E8B4A");
  // vigne sur le coin de la façade
  for (let i = 0; i < 7; i++) b.boite([6.6, 0.8 + i * 0.7, 0.08 + (i % 2) * 0.06], [0.5, 0.5, 0.12], i % 2 ? "#3E8B4A" : "#4FA25A");
  // allée jusqu'à la rue
  b.boite([0, 0.05, 5.4], [3.0, 0.1, 6.0], "#B9B3A6");
}

export function construireTelephone(): Zones {
  const c = new Batisseur(true);
  chambre(c);
  const co = new Batisseur(true);
  couloir(co);
  const s = new Batisseur(true);
  salon(s);
  const r = new Batisseur(false);
  ruePaysage(r);
  r.dans([0, 0, 0], 0, () => maisonNoa(r));
  const voitures: Record<string, THREE.BufferGeometry> = {};
  for (const col of VIVES) voitures[col] = voiture2085(col);
  return { chambre: c.construire(), couloir: co.construire(), salon: s.construire(), rue: r.construire(), voitures };
}

/** Voiture de 2085 : formes arrondies (bulles), couleurs vives, sans roues (elle flotte). Origine au sol, avant = +z. */
function voiture2085(couleur: string): THREE.BufferGeometry {
  const b = new Batisseur(false);
  b.boule([0, 0.75, 0], [1.05, 0.55, 2.4], couleur, 1);
  b.boule([0, 1.15, -0.2], [0.8, 0.5, 1.2], "#BFF2FF", 1);
  b.boule([0, 0.62, 1.5], [0.9, 0.3, 0.7], couleur, 1);
  b.boule([0, 0.62, -1.5], [0.9, 0.3, 0.7], couleur, 1);
  b.boite([0, 0.28, 0], [1.5, 0.12, 3.4], "#1B2236");
  return b.construire();
}
export const COULEURS_VOITURES = VIVES;
