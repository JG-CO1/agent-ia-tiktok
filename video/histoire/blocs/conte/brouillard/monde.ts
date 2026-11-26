/**
 * « Chaque jeudi, quelque chose vient nous chercher… » — décors fixes en blocs (ombrage cuit par face).
 * Trois lieux éloignés les uns des autres (la caméra ne voit que celui où elle se trouve) :
 *   VILLE    (0, 0, 0)     avenue cubique noyée de brouillard, maisons, la maison à étage du narrateur (à gauche)
 *   CHAMBRE  (-400, 0, 0)  chambre à l'étage (fenêtre sur la rue, 5,2 plus bas) ; la rue et ses toits sont dans `dehors`
 *   PORTE    (400, 0, 0)   façade de la même maison, perron, allée, grille et rue (flashbacks du père et du médecin)
 */
import * as THREE from "three";
import { Batisseur, type V3 } from "../../geo";
import { K, SOL, arbre, buisson, cloture, fenetrePleine, lampadaire, maisonSimple, sapin, toitPignon, voiture } from "../../minuit/monde";

export const VILLE: V3 = [0, 0, 0];
export const CHAMBRE: V3 = [-400, 0, 0];
export const PORTE: V3 = [400, 0, 0];
/** Hauteur du plancher de la chambre au-dessus de la rue. */
export const ETAGE = 5.2;
/** Dimensions de la chambre (demi-largeur, demi-profondeur, hauteur) et fenêtre (repère chambre, x centré). */
export const CH = { W: 4.2, Z: 4.6, H: 3.6 };
export const FEN = { x0: -1.9, x1: 1.9, y0: 1.0, y1: 3.2 };
/** Plan de la vitre (z) dans la chambre. */
export const VITRE_Z = -CH.Z - 0.15;
/** Maison du narrateur dans la ville : façade (plan x = −10,5), maison tournée vers +x. */
export const N_VILLE = { p: [-10.5, 0, -8] as V3, ry: Math.PI / 2 };
/** Fenêtre de la chambre vue de la rue : position locale dans le repère de la façade. */
export const N_FEN = { x: 2.4, w: 3.8, h: 2.2, y: ETAGE + 2.1 };

export type MaisonV = { p: V3; ry: number; mur: string; toit: string; porteC: string; porteX: number; fenX: number; fenW: number };
const mv = (x: number, z: number, cote: 1 | -1, mur: string, toit: string, porteC: string): MaisonV => ({ p: [x, 0, z], ry: cote > 0 ? Math.PI / 2 : -Math.PI / 2, mur, toit, porteC, porteX: cote > 0 ? -2.2 : 2.2, fenX: cote > 0 ? 1.54 : -1.54, fenW: 2.2 });
const MURS = ["#C9B79B", "#AEB9C9", "#D2C2A3", "#B7C7B0", "#C4AEB2", "#CDBFA0", "#B9B4C6", "#C2BFA6"];
const TOITS = ["#5A3B30", "#3B4A63", "#5E4A3A", "#3E5446", "#4E3B4F", "#4F4136", "#3F3F5E", "#55443A"];
const PORTES = ["#5E7F5A", "#7A4A35", "#3A526B", "#7C4636", "#4E6B7A", "#6B3F3F"];
/** Les maisons « simples » de l'avenue (celle du narrateur est à part). Gauche : façade vers +x ; droite : façade vers −x. */
export const MAISONS_V: MaisonV[] = [
  ...[38, 22, 6, -26, -42, -58, -74, -90].map((z, i) => mv(-10.5, z, 1, MURS[i % 8], TOITS[i % 8], PORTES[i % 6])),
  ...[38, 22, 6, -10, -26, -42, -58, -74, -90].map((z, i) => mv(10.5, z, -1, MURS[(i + 3) % 8], TOITS[(i + 5) % 8], PORTES[(i + 2) % 6])),
];
/** Instants (ordre d'extinction) : chaque maison éteint sa lumière à son tour. */
export const ORDRE_EXTINCTION = [4, 11, 1, 8, 14, 0, 6, 12, 3, 9, 16, 2, 7, 13, 5, 10, 15];

// ------------------------------------------------------------------ Pièces
export type Etage = { w: number; d: number; h1: number; h2: number; mur: string; toit: string; porteX: number; porteC: string; ouverte: boolean; hautes: Array<{ x: number; w: number }>; basses: Array<{ x: number; w: number }>; volets?: string };
const EP = 0.3;
/** Maison à étage (façade en z = 0, tournée vers +z). `ouverte` : la porte est un trou noir (le vantail est dynamique). */
export function maisonEtage(b: Batisseur, o: Etage) {
  const { w, d, h1, h2 } = o;
  const H = h1 + h2;
  const hm = H - SOL;
  const ym = SOL + hm / 2;
  b.boite([0, SOL / 2, -d / 2], [w + 0.3, SOL, d + 0.3], K.socle);
  b.boite([0, ym, -d + EP / 2], [w, hm, EP], o.mur);
  b.boite([-w / 2 + EP / 2, ym, -d / 2], [EP, hm, d - 2 * EP], o.mur);
  b.boite([w / 2 - EP / 2, ym, -d / 2], [EP, hm, d - 2 * EP], o.mur);
  if (o.ouverte) {
    const g0 = o.porteX - 0.78;
    const g1 = o.porteX + 0.78;
    const hp = SOL + 3.1;
    b.boite([(-w / 2 + g0) / 2, ym, -EP / 2], [g0 + w / 2, hm, EP], o.mur);
    b.boite([(g1 + w / 2) / 2, ym, -EP / 2], [w / 2 - g1, hm, EP], o.mur);
    b.boite([o.porteX, (hp + H) / 2, -EP / 2], [g1 - g0, H - hp, EP], o.mur);
    b.boite([o.porteX, SOL + 1.55, -1.7], [1.5, 3.1, 2.8], "#050508"); // le vestibule : noir
    b.boite([o.porteX, SOL + 0.02, -1.7], [1.5, 0.04, 2.8], "#0A0A10");
    // chambranle
    b.boite([o.porteX, hp + 0.12, 0.06], [1.9, 0.24, 0.2], K.blanc);
    b.boite([g0 - 0.1, SOL + 1.55, 0.06], [0.2, 3.1, 0.2], K.blanc);
    b.boite([g1 + 0.1, SOL + 1.55, 0.06], [0.2, 3.1, 0.2], K.blanc);
  } else {
    b.boite([0, ym, -EP / 2], [w, hm, EP], o.mur);
    b.boite([o.porteX, SOL + 1.5, 0.03], [1.86, 3.12, 0.1], K.blanc);
    b.boite([o.porteX, SOL + 1.45, 0.07], [1.5, 2.9, 0.12], o.porteC);
    b.boite([o.porteX, SOL + 2.15, 0.14], [1.06, 0.95, 0.03], o.porteC, undefined, 1.16);
    b.boite([o.porteX, SOL + 0.82, 0.14], [1.06, 1.05, 0.03], o.porteC, undefined, 1.16);
    b.boite([o.porteX + 0.52, SOL + 1.42, 0.2], [0.16, 0.16, 0.14], K.or);
  }
  b.boite([0, h1, 0.05], [w + 0.3, 0.3, 0.3], K.blanc); // corniche entre les étages
  toitPignon(b, w, d, H, o.mur, o.toit);
  b.boite([o.porteX, SOL / 2 + 0.0, 0.9], [2.6, SOL, 1.8], K.bordure);
  b.boite([o.porteX, SOL / 2 - 0.1, 1.9], [2.2, SOL * 0.6, 0.8], K.bordure);
  for (const f of o.basses) fenetrePleine(b, f.x, SOL + 2.3, f.w, 1.9, o.volets);
  for (const f of o.hautes) fenetrePleine(b, f.x, h1 + 2.1, f.w, 2.2, o.volets);
  b.boite([-w * 0.3, H + 2.2, -d * 0.62], [0.9, 2.6, 0.9], "#8A5240");
  b.boite([-w * 0.3, H + 3.56, -d * 0.62], [1.1, 0.16, 1.1], "#6E3F32");
}

function rochersLointains(b: Batisseur, y: number, cx: number, z: number) {
  b.cone([cx - 70, y - 0.2, z], 70, 62, "#3A4256", 7, 0.3);
  b.cone([cx + 30, y - 0.2, z - 20], 90, 88, "#323A4E", 7, 0.9);
  b.cone([cx + 120, y - 0.2, z + 10], 60, 50, "#3D4559", 7, 0.1);
  b.cone([cx - 150, y - 0.2, z + 20], 55, 52, "#3D4559", 7, 0.6);
}
function arbreMort(b: Batisseur, x: number, y: number, z: number, s = 1) {
  b.boite([x, y + 1.6 * s, z], [0.4 * s, 3.2 * s, 0.4 * s], "#201C1E");
  b.boite([x + 0.5 * s, y + 2.7 * s, z], [1.2 * s, 0.22 * s, 0.22 * s], "#201C1E", [0, 0, 0.5]);
  b.boite([x - 0.5 * s, y + 3.1 * s, z], [1.1 * s, 0.2 * s, 0.2 * s], "#201C1E", [0, 0, -0.6]);
  b.boite([x, y + 3.6 * s, z + 0.3 * s], [0.9 * s, 0.18 * s, 0.18 * s], "#201C1E", [0.5, 0, 0.2]);
}

// ------------------------------------------------------------------ VILLE
function ville(b: Batisseur) {
  b.boite([0, -0.5, -40], [700, 1, 700], "#27322E");
  b.boite([0, -0.07, -50], [9, 0.2, 280], "#464A54");
  b.boite([0, 0.0, -50], [0.18, 0.12, 280], "#6B6F52"); // ligne centrale pâle
  for (const s of [-1, 1]) {
    b.boite([s * 5.5, 0.07, -50], [2.2, 0.14, 280], "#7D818C");
    b.boite([s * 4.5, 0.08, -50], [0.14, 0.16, 280], "#9A9EA8", undefined, 1.1);
  }
  const maison = (md: MaisonV) =>
    b.dans(md.p, md.ry, () => {
      maisonSimple(b, { w: 9, d: 7.5, h: 4.4, mur: md.mur, toit: md.toit, porteX: md.porteX, porteC: md.porteC, fen: [{ x: md.fenX, w: md.fenW }], volets: md.toit, cheminee: -md.porteX });
      b.boite([md.porteX, 0.05, 3.2], [1.5, 0.08, 4.6], "#6C6F78");
      buisson(b, [-md.porteX * 1.8, 0, 0.8], 0.8);
    });
  MAISONS_V.forEach(maison);
  // la maison du narrateur : deux étages, la plus haute de la rue
  b.dans(N_VILLE.p, N_VILLE.ry, () => {
    maisonEtage(b, { w: 9, d: 7.5, h1: ETAGE, h2: 3.6, mur: "#BFA98E", toit: "#40394A", porteX: -2.2, porteC: "#3A526B", ouverte: false, hautes: [{ x: -2.4, w: 2.2 }], basses: [{ x: 2.4, w: 2.4 }], volets: "#40394A" });
    buisson(b, [4.0, 0, 0.9], 0.9);
  });
  // lampadaires éteints, clôtures, voitures abandonnées, arbres morts
  for (let z = 50; z > -130; z -= 16) {
    lampadaire(b, [-6.6, 0, z], Math.PI / 2);
    lampadaire(b, [6.6, 0, z - 8], -Math.PI / 2);
  }
  voiture(b, [3.2, 0, 14], 0.05, "#5B6B86");
  voiture(b, [-3.0, 0, -22], Math.PI - 0.06, "#7A4A43");
  voiture(b, [3.4, 0, -64], 0.1, "#4A5A52");
  for (const [x, z] of [[-18, 40], [19, 28], [-22, 6], [22, -8], [-19, -22], [20, -38], [-23, -50], [22, -58], [-16, 52], [17, 50], [-20, -70], [21, -84]] as Array<[number, number]>) (Math.abs(z) % 3 < 1.5 ? arbreMort(b, x, 0, z, 1.4) : arbre(b, x, z, 1.1, z));
  for (const [x, z] of [[-34, -70], [34, -74], [-40, 20], [42, 10], [-30, -100], [30, -104], [-38, -130]] as Array<[number, number]>) sapin(b, x, z, 1.7);
  rochersLointains(b, 0, 0, -230);
}

// ------------------------------------------------------------------ CHAMBRE (intérieur)
function chambre(b: Batisseur) {
  const [X] = CHAMBRE;
  const { W, Z, H } = CH;
  b.boite([X, 0.04, 0], [W * 2, 0.08, Z * 2], "#6A4E36");
  for (let i = -3; i <= 3; i++) b.boite([X + i * 1.2, 0.09, 0], [0.05, 0.02, Z * 2], "#4B3825");
  b.boite([X, H + 0.1, 0], [W * 2 + 0.6, 0.2, Z * 2 + 0.6], "#262A3A");
  const mur = "#4D5B7C";
  b.boite([X - W - 0.15, H / 2, 0], [0.3, H, Z * 2 + 0.6], mur);
  b.boite([X + W + 0.15, H / 2, 0], [0.3, H, Z * 2 + 0.6], mur);
  b.boite([X, H / 2, Z + 0.15], [W * 2 + 0.6, H, 0.3], mur);
  b.boite([X, 0.2, Z - 0.02], [W * 2, 0.4, 0.06], "#2F3850"); // plinthe
  // mur du fond percé de la fenêtre
  const zf = VITRE_Z;
  const f = FEN;
  b.boite([X + (-W + f.x0) / 2 - 0.15, H / 2, zf], [W + f.x0 + 0.3, H, 0.3], mur);
  b.boite([X + (W + f.x1) / 2 + 0.15, H / 2, zf], [W - f.x1 + 0.3, H, 0.3], mur);
  b.boite([X, f.y0 / 2, zf], [f.x1 - f.x0, f.y0, 0.3], mur);
  b.boite([X, (f.y1 + H) / 2, zf], [f.x1 - f.x0, H - f.y1, 0.3], mur);
  // cadre, appui, montants
  b.boite([X, f.y0 - 0.08, zf + 0.15], [f.x1 - f.x0 + 0.5, 0.16, 0.6], "#D6D2C8");
  b.boite([X, f.y1 + 0.1, zf + 0.06], [f.x1 - f.x0 + 0.4, 0.2, 0.34], "#D6D2C8");
  b.boite([X + f.x0 - 0.1, (f.y0 + f.y1) / 2, zf + 0.05], [0.2, f.y1 - f.y0, 0.34], "#D6D2C8");
  b.boite([X + f.x1 + 0.1, (f.y0 + f.y1) / 2, zf + 0.05], [0.2, f.y1 - f.y0, 0.34], "#D6D2C8");
  b.boite([X, (f.y0 + f.y1) / 2, zf], [0.1, f.y1 - f.y0, 0.1], "#D6D2C8");
  b.boite([X, (f.y0 + f.y1) / 2 + 0.25, zf], [f.x1 - f.x0, 0.1, 0.1], "#D6D2C8");
  // tringle à rideaux
  b.boite([X, 3.45, -3.15], [W * 2 - 0.4, 0.07, 0.07], "#2A2018");
  // lit contre le mur de gauche, tête côté porte (+z)
  const BX = X - 3.0;
  b.boite([BX, 0.35, 0.3], [2.3, 0.7, 4.7], "#5B3F2A");
  b.boite([BX, 0.9, 0.3], [2.1, 0.4, 4.5], "#D8DCE8");
  b.boite([BX, 1.27, -0.7], [2.18, 0.36, 2.5], "#3D5A9C"); // couverture (tire sur les jambes)
  b.boite([BX, 1.28, 1.95], [1.3, 0.22, 0.9], "#F2F2F2"); // oreiller
  b.boite([BX, 1.05, 2.7], [2.3, 1.2, 0.2], "#5B3F2A"); // tête de lit (basse : on se penche par-dessus)
  b.boite([BX, 0.85, -2.05], [2.3, 1.0, 0.16], "#5B3F2A"); // pied de lit
  // chaise de la belle-mère (assise 0,9), tournée vers la fenêtre
  const CX = X - 1.2;
  b.boite([CX, 0.88, 0.45], [0.95, 0.14, 0.95], "#6B4A2F");
  b.boite([CX, 1.55, 0.95], [0.95, 1.2, 0.12], "#6B4A2F");
  for (const dx of [-0.38, 0.38]) for (const dz of [0.0, 0.9]) b.boite([CX + dx, 0.43, dz], [0.12, 0.86, 0.12], "#4A3622");
  // table de chevet + lampe (éteinte)
  b.boite([X - 1.55, 0.55, 2.45], [0.8, 1.1, 0.8], "#5B4026");
  b.boite([X - 1.55, 1.18, 2.45], [0.9, 0.08, 0.9], "#4A3622");
  b.boite([X - 1.55, 1.42, 2.45], [0.14, 0.4, 0.14], "#2A2A30");
  b.boite([X - 1.55, 1.82, 2.45], [0.55, 0.45, 0.55], "#B8AE96");
  // bureau, tapis, armoire, étagère, cadre
  b.boite([X + 3.5, 0.9, 0.8], [1.3, 0.18, 2.6], "#5B4026");
  for (const dz of [-0.4, 2.0]) for (const dx of [2.95, 4.0]) b.boite([X + dx, 0.45, dz], [0.14, 0.9, 0.14], "#4A3622");
  b.boite([X + 0.4, 0.07, 0.6], [3.2, 0.04, 2.4], "#7A3B4A");
  b.boite([X + 3.4, 1.9, 3.7], [1.8, 3.8, 1.1], "#3F2F22");
  b.boite([X + 2.25, 1.55, Z - 0.1], [1.7, 3.1, 0.14], "#4A3622"); // porte
  b.boite([X + 1.55, 1.5, Z - 0.2], [0.18, 0.18, 0.12], "#D5AF55");
  b.boite([X + 3.9, 2.4, -1.4], [0.06, 1.0, 1.5], "#4A3622");
  b.boite([X + 3.87, 2.4, -1.4], [0.03, 0.8, 1.3], "#6F6A5C");
  b.boite([X - 3.97, 2.6, -1.0], [0.06, 0.9, 1.3], "#4A3622");
  for (const [dx, dz, c] of [[-3.0, -3.3, "#B2403C"], [-2.4, -3.5, "#3F7FB0"], [-3.3, -2.7, "#D8B23C"]] as Array<[number, number, string]>) b.boite([X + dx, 0.2, dz], [0.4, 0.4, 0.4], c, [0, dx * 3, 0]); // cubes de jouets
}

// ------------------------------------------------------------------ CHAMBRE (dehors : la rue, 5,2 plus bas)
function dehors(b: Batisseur) {
  const [X] = CHAMBRE;
  const y0 = -ETAGE;
  b.boite([X, y0 - 0.5, -70], [900, 1, 260], "#27322E");
  b.boite([X, y0 - 0.07, -13], [900, 0.2, 8], "#464A54");
  b.boite([X, y0 + 0.0, -13], [900, 0.12, 0.2], "#6B6F52");
  b.boite([X, y0 + 0.07, -7.0], [900, 0.14, 4.4], "#7D818C");
  b.boite([X, y0 + 0.08, -9.1], [900, 0.16, 0.16], "#9A9EA8");
  b.boite([X, y0 + 0.07, -19.2], [900, 0.14, 3.2], "#7D818C");
  // maisons du même côté : façades dans le prolongement du mur (z = −4,75)
  const fz = -CH.Z - 0.25;
  const murs = ["#9C8F78", "#8F96A6", "#A49A82", "#8E9B8C", "#A08D90"];
  for (let i = 0; i < 12; i++) {
    const cx = X + (i < 6 ? -(8.5 + i * 11) : 8.5 + (i - 6) * 11);
    const hh = 6.4 + (i % 3) * 0.8;
    b.boite([cx, y0 + hh / 2, fz - 3.5], [10, hh, 7], murs[i % 5]);
    b.boite([cx, y0 + hh + 1.2, fz - 3.5], [10.6, 2.4, 7.6], TOITS[i % 8]);
    for (const dx of [-2.6, 2.6]) b.boite([cx + dx, y0 + 2.6, fz + 0.04], [2.0, 1.8, 0.1], "#1D2430");
  }
  // la maison du narrateur sous la fenêtre (mur et rez-de-chaussée)
  b.boite([X, y0 / 2 + 0.0, fz - 3.5], [9.4, ETAGE, 7], "#BFA98E");
  b.boite([X - 2.4, y0 + 2.6, fz + 0.04], [2.4, 1.9, 0.1], "#1D2430");
  b.boite([X + 2.2, y0 + 1.5, fz + 0.06], [1.5, 3.0, 0.12], "#3A526B");
  b.boite([X, 0.12, fz + 0.04], [9.6, 0.3, 0.4], K.blanc);
  // de l'autre côté de la rue : un rang de maisons (toits sous le niveau de la fenêtre)
  for (let i = -8; i <= 8; i++) {
    const x = X + i * 15;
    b.dans([x, y0, -27], 0, () => maisonSimple(b, { w: 9, d: 7.5, h: 4.4, mur: MURS[(i + 8) % 8], toit: TOITS[(i + 8) % 8], porteX: 2.2, porteC: PORTES[(i + 8) % 6], fen: [{ x: -1.6, w: 2.2 }], volets: TOITS[(i + 8) % 8], cheminee: -2.4 }));
  }
  for (let i = -6; i <= 6; i++) {
    lampadaire(b, [X + i * 16, y0, -8.4], Math.PI / 2);
    if (i % 3 === 0) arbreMort(b, X + i * 16 + 6, y0, -20.5, 1.4);
  }
  voiture(b, [X + 22, y0, -11.2], Math.PI / 2, "#5B6B86");
  voiture(b, [X - 31, y0, -14.8], -Math.PI / 2, "#7A4A43");
  rochersLointains(b, y0, X, -150);
}

// ------------------------------------------------------------------ PORTE (la façade, le perron, la rue)
function facade(b: Batisseur) {
  const [X] = PORTE;
  b.boite([X, -0.5, 20], [700, 1, 520], "#27322E");
  // allée, perron, grille
  b.boite([X, 0.05, 8.4], [2.4, 0.1, 15.2], "#656873");
  b.boite([X, 0.04, 17.4], [7, 0.1, 5], "#656873");
  // la maison (le vantail de la porte est dynamique)
  b.dans([X, 0, 0], 0, () => {
    maisonEtage(b, { w: 9, d: 7.5, h1: ETAGE, h2: 3.6, mur: "#BFA98E", toit: "#40394A", porteX: 0, porteC: "#3A526B", ouverte: true, hautes: [{ x: -2.4, w: 2.2 }, { x: 2.4, w: 3.8 }], basses: [{ x: -2.9, w: 2.2 }, { x: 2.9, w: 2.2 }], volets: "#40394A" });
    buisson(b, [-2.6, 0, 1.3], 0.9);
    buisson(b, [2.7, 0, 1.3], 0.9);
    // lanterne murale (l'ampoule est dynamique)
    b.boite([1.55, SOL + 2.75, 0.2], [0.26, 0.4, 0.26], "#2F2F36");
    b.boite([1.55, SOL + 2.4, 0.2], [0.14, 0.12, 0.14], "#2F2F36");
  });
  cloture(b, [X - 20, 0, 14], [X - 1.7, 0, 14]);
  cloture(b, [X + 1.7, 0, 14], [X + 20, 0, 14]);
  b.boite([X - 1.55, 0.7, 14], [0.3, 1.4, 0.3], "#CFCBC0");
  b.boite([X + 1.55, 0.7, 14], [0.3, 1.4, 0.3], "#CFCBC0");
  // voisins
  for (const dx of [-18, 18, -36, 36]) b.dans([X + dx, 0, 0], 0, () => maisonSimple(b, { w: 9, d: 7.5, h: 4.4, mur: MURS[(dx + 40) % 8], toit: TOITS[(dx + 40) % 8], porteX: 2.2, porteC: PORTES[(dx + 40) % 6], fen: [{ x: -1.6, w: 2.2 }], volets: TOITS[(dx + 40) % 8], cheminee: -2.4 }));
  // la rue
  b.boite([X, -0.07, 30], [700, 0.2, 9], "#464A54");
  b.boite([X, 0.0, 30], [700, 0.12, 0.2], "#6B6F52");
  b.boite([X, 0.07, 24.2], [700, 0.14, 3.0], "#7D818C");
  b.boite([X, 0.07, 35.8], [700, 0.14, 3.0], "#7D818C");
  for (let i = -5; i <= 5; i++) {
    b.dans([X + i * 15, 0, 48], Math.PI, () => maisonSimple(b, { w: 9, d: 7.5, h: 4.4, mur: MURS[(i + 8) % 8], toit: TOITS[(i + 8) % 8], porteX: 2.2, porteC: PORTES[(i + 8) % 6], fen: [{ x: -1.6, w: 2.2 }], volets: TOITS[(i + 8) % 8], cheminee: -2.4 }));
    lampadaire(b, [X + i * 16 + 4, 0, 23.6], 0);
    if (i % 2 === 0) arbreMort(b, X + i * 16 - 5, 0, 16, 1.3);
  }
  boiteLettres(b, [X + 2.6, 0, 13]);
  voiture(b, [X + 14, 0, 28], Math.PI / 2, "#5B6B86");
  for (const [dx, dz] of [[-30, 70], [34, 74], [-40, 90]] as Array<[number, number]>) sapin(b, X + dx, dz, 1.7);
  rochersLointains(b, 0, X, 170);
}
function boiteLettres(b: Batisseur, p: V3) {
  b.boite([p[0], 0.65, p[2]], [0.14, 1.3, 0.14], "#4E4E54");
  b.boite([p[0], 1.42, p[2]], [0.5, 0.42, 0.78], "#7B8088");
}

export type Zones = { ville: THREE.BufferGeometry; chambre: THREE.BufferGeometry; dehors: THREE.BufferGeometry; porte: THREE.BufferGeometry };
export function construireBrouillard(): Zones {
  const v = new Batisseur(false);
  ville(v);
  const c = new Batisseur(true);
  chambre(c);
  const d = new Batisseur(false);
  dehors(d);
  const p = new Batisseur(false);
  facade(p);
  return { ville: v.construire(), chambre: c.construire(), dehors: d.construire(), porte: p.construire() };
}
void sapin;
