/**
 * « J'étais l'ange gardien de ma petite sœur… » — décors fixes en blocs (ombrage cuit par face) et ombres portées
 * simulées (parallélogrammes sombres posés au sol, soleil bas venu de l'ouest). Trois lieux éloignés les uns des autres
 * (la caméra ne voit que celui où elle se trouve) :
 *   RUE      (0, 0, 0)       rue ensoleillée : maisons pastel, passage piéton, école au fond (+z)
 *   CHAMBRE  (-400, 0, 0)    chambre d'Emma : lit, table de chevet (bocal), fenêtre sur le fond (z = -5)
 *   GARE     (0, 0, 800)     ancienne gare : rails le long de z, route le long de x, quai et bâtiment à l'est (+x)
 */
import * as THREE from "three";
import { Batisseur, type V3 } from "../../geo";
import { arbre, buisson, cloture, lampadaire, maisonSimple, sapin, voiture } from "../../minuit/monde";

export const RUE: V3 = [0, 0, 0];
export const CH: V3 = [-400, 0, 0];
export const GZ = 800;

export type Zones = { rue: THREE.BufferGeometry; rueOmbres: THREE.BufferGeometry; chambre: THREE.BufferGeometry; gare: THREE.BufferGeometry; gareOmbres: THREE.BufferGeometry };

// ------------------------------------------------------------------ Rue
export const Z_PIETON = 12; // passage piéton
export const Z_MAISON_EMMA = -30; // maison d'Emma (côté est) : la porte est en z + 2,2
export const X_TROTTOIR = 5.65; // axe des trottoirs
const SOL_T = 0.1; // dessus des trottoirs
const SOL_R = 0.03; // dessus de la chaussée

const MURS_O = ["#F3D9A8", "#BFDDE6", "#F2B9B0", "#CFE6B5", "#F4E4A6", "#D8C6EC", "#F5CFA0", "#B9DCCB", "#F0C7D8", "#E3D6B6"];
const MURS_E = ["#F2C9A8", "#C9E0F2", "#F3E2A0", "#E9B8C6", "#BFE3C0", "#EBD7B0", "#C8CCEC", "#F4D6B8", "#B7DDD6", "#F1E0B4"];
const TOITS = ["#B5523C", "#3F6A9E", "#8E4B37", "#476E56", "#9C6A3C", "#5A4A78", "#B5523C", "#3F6A9E", "#8E4B37", "#476E56"];
const PORTES = ["#3F6A9E", "#B5523C", "#477D5C", "#D3A53C", "#7A4A78"];
const ZS_MAISONS = [-78, -62, -46, -30, -14, 2, 18, 34, 50, 66];

/** Soleil bas venu de l'ouest : les ombres s'allongent vers +x et un peu vers +z. */
const OMBRE_DX = 1;
const OMBRE_DZ = 0.3;
function ombreRect(o: Batisseur, x0: number, z0: number, z1: number, L: number, y = 0.12) {
  o.quad([x0, y, z0], [x0, y, z1], [x0 + L * OMBRE_DX, y, z1 + L * OMBRE_DZ], [x0 + L * OMBRE_DX, y, z0 + L * OMBRE_DZ], "#101830");
}

function rue(b: Batisseur, o: Batisseur) {
  // sol, chaussée, trottoirs
  b.boite([0, -0.5, -20], [760, 1, 760], "#78B35E");
  b.boite([0, -0.02, 0], [8.4, 0.1, 560], "#5B5F6A");
  for (let z = -260; z < 260; z += 6) b.boite([0, SOL_R + 0.01, z], [0.22, 0.02, 2.6], "#EDE6C8");
  for (const s of [-1, 1]) {
    b.boite([s * X_TROTTOIR, SOL_T / 2, 0], [2.9, SOL_T, 560], "#CFCABD");
    b.boite([s * 4.25, SOL_T / 2 + 0.01, 0], [0.22, SOL_T + 0.02, 560], "#E6E1D3");
    for (let z = -260; z < 260; z += 2.4) b.boite([s * X_TROTTOIR, SOL_T + 0.003, z], [2.9, 0.006, 0.05], "#B5B0A2"); // joints de dalles
    b.boite([s * 8.6, 0.01, 0], [2.6, 0.04, 560], "#8CC572"); // pelouse devant les maisons (plus claire)
  }
  // passage piéton
  for (let x = -3.6; x <= 3.7; x += 1.2) b.boite([x, SOL_R + 0.012, Z_PIETON], [0.66, 0.02, 3.2], "#F6F2E6");
  for (const s of [-1, 1]) b.boite([s * 4.6, SOL_R + 0.01, Z_PIETON + 2.1], [0.2, 0.02, 0.2], "#E8A83A");

  // maisons : deux rangées, façades vers la rue
  ZS_MAISONS.forEach((z, i) => {
    for (const cote of [1, -1] as const) {
      const ouest = cote > 0;
      const ry = ouest ? Math.PI / 2 : -Math.PI / 2;
      const porteX = ouest ? -2.2 : 2.2;
      const mur = (ouest ? MURS_O : MURS_E)[i];
      const toit = TOITS[(i + (ouest ? 0 : 3)) % 10];
      b.dans([cote * 10.5, 0, z], ry, () => {
        maisonSimple(b, { w: 9, d: 7.5, h: 4.4, mur, toit, porteX, porteC: PORTES[(i + (ouest ? 1 : 3)) % 5], fen: [{ x: -porteX * 0.7, w: 2.2 }], volets: toit, cheminee: -porteX });
        b.boite([porteX, 0.1, 3.0], [1.5, 0.08, 4.2], "#B8B4A8"); // allée
        buisson(b, [-porteX * 1.8, 0, 0.9], 0.8, "#4F9A57");
        // petits massifs de fleurs
        for (let k = 0; k < 4; k++) b.boite([-porteX * 1.2 + (k - 1.5) * 0.5, 0.18, 1.1], [0.3, 0.3, 0.3], ["#E0546B", "#F2C230", "#E86BA5", "#FFFFFF"][(i + k) % 4]);
      });
      // clôture blanche sur le devant (la porte d'Emma reste ouverte : le portillon)
      const xc = cote * 7.35;
      const zPorte = ouest ? z - 2.2 : z + 2.2;
      cloture(b, [xc, 0, z - 4.4], [xc, 0, zPorte - 0.9]);
      cloture(b, [xc, 0, zPorte + 0.9], [xc, 0, z + 4.4]);
      // ombre portée de la maison sur le trottoir et la rue (côté ouest seulement : le soleil vient de l'ouest)
      if (ouest) ombreRect(o, -10.5, z - 4.5, z + 4.5, 7.4);
    }
  });
  // lampadaires, arbres, ombres des arbres
  for (let z = -90; z <= 90; z += 30) {
    lampadaire(b, [-7.0, 0, z], Math.PI / 2);
    lampadaire(b, [7.0, 0, z + 15], -Math.PI / 2);
    o.quad([-7.0, 0.12, z - 0.15], [-7.0, 0.12, z + 0.15], [-7.0 + 5.8, 0.12, z + 0.15 + 1.7], [-7.0 + 5.8, 0.12, z - 0.15 + 1.7], "#101830");
  }
  for (let z = -86; z <= 90; z += 16) {
    arbre(b, -7.9, z + 8, 1.15, z);
    arbre(b, 7.9, z, 1.15, z + 2);
    o.boule([-7.9 + 3.4, 0.12, z + 8 + 1.0], [2.6, 0.01, 2.0], "#101830");
    o.boule([7.9 + 3.4, 0.12, z + 1.0], [2.6, 0.01, 2.0], "#101830");
  }
  // voitures garées (le long des trottoirs)
  voiture(b, [-3.1, 0, -6], 0, "#D9524A");
  voiture(b, [3.1, 0, 42], Math.PI, "#4A83C9");
  o.boule([-3.1 + 2.0, 0.12, -6 + 0.5], [1.9, 0.01, 2.2], "#101830");
  o.boule([3.1 + 2.0, 0.12, 42 + 0.5], [1.9, 0.01, 2.2], "#101830");
  // bancs et boîte aux lettres
  for (const [x, z] of [[6.2, 24], [-6.2, -20]] as Array<[number, number]>) {
    b.boite([x, 0.62, z], [0.5, 0.1, 2.4], "#8A5A36");
    b.boite([x + Math.sign(x) * 0.28, 1.0, z], [0.1, 0.62, 2.4], "#8A5A36");
    for (const dz of [-1, 1]) b.boite([x, 0.32, z + dz], [0.36, 0.6, 0.12], "#2E2E34");
  }
  // l'école, au bout de la rue (+z)
  b.boite([0, 5.2, 112], [46, 10.4, 18], "#C96F4D");
  b.boite([0, 10.7, 112], [48, 0.8, 19.6], "#6B4A3C");
  b.boite([0, 1.0, 102.9], [46.4, 2.0, 0.4], "#E8D9B8");
  b.boite([0, 6.0, 102.8], [46.2, 0.5, 0.3], "#F0E6D2");
  b.boite([0, 13.0, 110], [11, 15, 11], "#D07A55");
  b.pignon([0, 20.5, 110], 12.6, 5.0, 11.6, "#D07A55");
  b.boite([0, 14.6, 104.2], [5.2, 5.2, 0.4], "#F6F2E6"); // horloge
  b.boite([0, 14.6, 104.0], [4.4, 4.4, 0.4], "#FFFFFF");
  b.boite([0.0, 15.2, 103.8], [0.18, 1.6, 0.1], "#2A2A30");
  b.boite([0.5, 14.5, 103.8], [1.2, 0.18, 0.1], "#2A2A30");
  b.boite([0, 2.6, 103.0], [4.4, 5.2, 0.4], "#3F6A9E"); // porte
  b.boite([0, 2.6, 102.8], [4.0, 4.8, 0.2], "#4B7AB5");
  for (const x of [-18, -12, -6, 6, 12, 18]) for (const y of [3.4, 7.8]) {
    b.boite([x, y, 102.9], [3.0, 2.6, 0.3], "#F0E6D2");
    b.boite([x, y, 102.75], [2.5, 2.1, 0.3], "#9FC5E0");
    b.boite([x, y, 102.6], [0.12, 2.1, 0.2], "#F0E6D2");
  }
  cloture(b, [-23, 0, 94], [-3, 0, 94]);
  cloture(b, [3, 0, 94], [23, 0, 94]);
  b.boite([-12, 4.5, 99], [0.2, 9, 0.2], "#B9B9C0"); // mât et fanion
  b.boite([-10.6, 8.2, 99], [2.8, 1.5, 0.1], "#F2C230");
  // collines et montagnes au loin (douces, bleutées)
  b.cone([-60, -0.2, -250], 90, 62, "#8CB09B", 7, 0.3);
  b.cone([40, -0.2, -270], 110, 84, "#7DA3AE", 7, 0.9);
  b.cone([140, -0.2, -230], 70, 48, "#8FB5A0", 7, 0.1);
  b.cone([-170, -0.2, -210], 70, 50, "#86AE98", 7, 0.5);
  b.cone([-90, -0.2, 260], 90, 55, "#8CB09B", 7, 0.2);
  b.cone([90, -0.2, 270], 100, 70, "#7DA3AE", 7, 0.7);
  for (const [x, z] of [[-30, -120], [34, -126], [-44, -150], [46, -160], [-30, 150], [40, 160]] as Array<[number, number]>) sapin(b, x, z, 1.8);
}

// ------------------------------------------------------------------ Chambre d'Emma (repère local = monde − CH)
export const TABLE_CHEVET: V3 = [CH[0] - 1.0, 1.12, -3.9]; // dessus de la table de chevet : le bocal y est posé
export const FENETRE = { x0: -0.4, x1: 3.2, y0: 1.3, y1: 3.5 };
function chambre(b: Batisseur) {
  const [X] = CH;
  const W = 4.5;
  const Z = 5;
  const H = 4.2;
  const mur = "#F6D9B8";
  b.boite([X, 0.04, 0], [W * 2, 0.08, Z * 2], "#D9AE72"); // parquet
  for (let i = -4; i <= 4; i++) b.boite([X + i * 1.0, 0.09, 0], [0.04, 0.02, Z * 2], "#B88B52");
  b.boite([X, H + 0.1, 0], [W * 2 + 0.6, 0.2, Z * 2 + 0.6], "#FFF3DC");
  b.boite([X - W - 0.15, H / 2, 0], [0.3, H, Z * 2 + 0.6], mur);
  b.boite([X + W + 0.15, H / 2, 0], [0.3, H, Z * 2 + 0.6], mur);
  b.boite([X, H / 2, Z + 0.15], [W * 2 + 0.6, H, 0.3], mur);
  // mur du fond (z = -Z) percé de la fenêtre
  const zf = -Z - 0.15;
  const f = FENETRE;
  b.boite([X + (-W + f.x0) / 2 - 0.15, H / 2, zf], [W + f.x0 + 0.3, H, 0.3], mur);
  b.boite([X + (W + f.x1) / 2 + 0.15, H / 2, zf], [W - f.x1 + 0.3, H, 0.3], mur);
  b.boite([X + (f.x0 + f.x1) / 2, f.y0 / 2, zf], [f.x1 - f.x0, f.y0, 0.3], mur);
  b.boite([X + (f.x0 + f.x1) / 2, (f.y1 + H) / 2, zf], [f.x1 - f.x0, H - f.y1, 0.3], mur);
  const cx = X + (f.x0 + f.x1) / 2;
  b.boite([cx, f.y0 - 0.08, zf + 0.14], [f.x1 - f.x0 + 0.5, 0.16, 0.55], "#FFFFFF");
  b.boite([cx, f.y1 + 0.1, zf + 0.05], [f.x1 - f.x0 + 0.4, 0.2, 0.3], "#FFFFFF");
  b.boite([cx, (f.y0 + f.y1) / 2, zf], [0.1, f.y1 - f.y0, 0.1], "#FFFFFF");
  b.boite([cx, (f.y0 + f.y1) / 2 + 0.2, zf], [f.x1 - f.x0, 0.1, 0.1], "#FFFFFF");
  // rideaux pastel
  b.boite([cx - 2.3, 2.5, zf + 0.4], [0.8, 3.4, 0.2], "#F4A6B8");
  b.boite([cx + 2.3, 2.5, zf + 0.4], [0.8, 3.4, 0.2], "#F4A6B8");
  b.boite([cx, 4.0, zf + 0.4], [5.6, 0.2, 0.3], "#B98A5A");
  // plinthes
  for (const [x, z, sx, sz] of [[0, -Z + 0.05, W * 2, 0.1], [0, Z - 0.05, W * 2, 0.1], [-W + 0.05, 0, 0.1, Z * 2], [W - 0.05, 0, 0.1, Z * 2]] as Array<[number, number, number, number]>) b.boite([X + x, 0.2, z], [sx, 0.3, sz], "#FFF6E8");
  // lit contre le mur de gauche, tête vers la fenêtre
  b.boite([X - 3.3, 0.45, -2.3], [2.7, 0.5, 5.2], "#E5C79A");
  b.boite([X - 3.3, 0.86, -2.2], [2.5, 0.34, 5.0], "#FFFFFF");
  b.boite([X - 3.3, 1.16, -4.0], [1.7, 0.26, 0.95], "#FFF6F0"); // oreiller
  b.boite([X - 3.3, 1.1, -0.5], [2.5, 0.24, 2.9], "#8FB7E0"); // couverture
  for (const [dx, dz] of [[-0.6, -0.9], [0.5, -0.1], [-0.2, 0.7]] as Array<[number, number]>) b.boite([X - 3.3 + dx, 1.24, -0.5 + dz], [0.34, 0.04, 0.34], "#FFE08A"); // étoiles
  b.boite([X - 3.3, 1.5, -4.95], [2.7, 2.0, 0.2], "#E5C79A"); // tête de lit
  b.boite([X - 3.3, 0.95, 0.35], [2.7, 0.9, 0.2], "#E5C79A"); // pied de lit
  // table de chevet + lampe
  b.boite([X - 1.0, 0.55, -3.9], [1.3, 1.1, 1.3], "#C99660");
  b.boite([X - 1.0, 0.6, -3.25], [1.1, 0.04, 0.04], "#A87A48");
  b.boite([X - 1.0, 0.75, -3.25], [0.5, 0.06, 0.06], "#A87A48");
  b.boite([X - 1.0, 1.14, -3.9], [1.4, 0.06, 1.4], "#E0B382");
  b.boite([X - 0.45, 1.5, -4.4], [0.14, 0.7, 0.14], "#B9B9C0");
  b.boite([X - 0.45, 2.0, -4.4], [0.6, 0.4, 0.6], "#FFE9A8");
  // tapis
  b.boite([X + 0.6, 0.08, 0.9], [4.4, 0.04, 3.4], "#F4B6C6");
  b.boite([X + 0.6, 0.1, 0.9], [3.6, 0.04, 2.6], "#FFD9E2");
  // étagère à droite (livres et jouets)
  b.boite([X + 4.1, 1.9, -1.2], [0.8, 3.8, 3.6], "#C99660");
  for (let i = 0; i < 4; i++) {
    b.boite([X + 3.95, 0.8 + i * 0.9, -1.2], [0.5, 0.1, 3.4], "#E0B382");
    for (let k = 0; k < 6; k++) b.boite([X + 3.9, 1.15 + i * 0.9, -2.5 + k * 0.52 + (i % 2) * 0.1], [0.32, 0.55 + (k % 3) * 0.08, 0.34], ["#E0546B", "#4A83C9", "#F2C230", "#6CB07A", "#9A6AC9", "#F08A3C"][(k + i) % 6]);
  }
  // ours en peluche sur le tapis, cubes
  b.boite([X + 1.6, 0.55, 2.2], [0.9, 0.9, 0.8], "#B98A5A");
  b.boite([X + 1.6, 1.2, 2.2], [0.7, 0.6, 0.6], "#B98A5A");
  b.boite([X + 1.35, 1.55, 2.2], [0.22, 0.22, 0.2], "#B98A5A");
  b.boite([X + 1.85, 1.55, 2.2], [0.22, 0.22, 0.2], "#B98A5A");
  for (const [dx, dz, c] of [[-0.6, 2.6, "#F2C230"], [-0.1, 2.9, "#4A83C9"], [-0.9, 3.1, "#E0546B"]] as Array<[number, number, string]>) b.boite([X + dx, 0.3, dz], [0.5, 0.5, 0.5], c, [0, dx, 0]);
  // armoire côté porte, porte de la chambre
  b.boite([X - 3.6, 2.0, 3.9], [2.2, 4.0, 1.5], "#D9B07C");
  b.boite([X - 3.6, 2.0, 3.12], [0.06, 3.6, 0.06], "#B98A5A");
  b.boite([X + 2.8, 1.95, Z - 0.05], [1.8, 3.8, 0.1], "#C99660");
  b.boite([X + 2.2, 1.9, Z - 0.16], [0.16, 0.16, 0.12], "#D5AF55");
  // dessins aux murs (une plume dorée, un soleil, une maison)
  b.boite([X + W - 0.05, 2.8, 2.4], [0.1, 1.3, 1.0], "#FFFFFF");
  b.boite([X + W - 0.12, 2.8, 2.4], [0.06, 1.1, 0.8], "#FFF2B8");
  b.boite([X + W - 0.18, 2.8, 2.4], [0.04, 0.9, 0.2], "#F2C230", [0.3, 0, 0]);
  b.boite([X - W + 0.05, 2.9, 2.4], [0.1, 1.1, 1.4], "#FFFFFF");
  b.boite([X - W + 0.12, 2.9, 2.4], [0.06, 0.9, 1.2], "#BFE3F2");
  b.boite([X - W + 0.17, 2.9, 2.4], [0.04, 0.5, 0.5], "#F2C230");
  b.boite([X + 1.0, 3.5, Z - 0.1], [1.2, 0.8, 0.1], "#FFFFFF");
  b.boite([X + 1.0, 3.5, Z - 0.17], [1.0, 0.6, 0.06], "#F4A6B8");
  // lampe de plafond (lanterne en papier)
  b.boite([X, 3.65, 0], [1.2, 0.9, 1.2], "#FFE9B8");
  b.boite([X, 4.1, 0], [0.12, 0.3, 0.12], "#B9B9C0");
  // dehors : le jardin, la rue et le ciel par la fenêtre
  b.boite([X, -0.5, -60], [400, 1, 100], "#78B35E");
  for (let i = -3; i <= 3; i++) {
    const x = X + i * 14;
    b.dans([x, 0, -34], 0, () => maisonSimple(b, { w: 9, d: 7.5, h: 4.4, mur: MURS_O[(i + 5) % 10], toit: TOITS[(i + 5) % 10], porteX: 2.2, porteC: "#3F6A9E", fen: [{ x: -1.6, w: 2.2 }], volets: "#3F6A9E", cheminee: -2.4 }));
  }
  for (const dx of [-26, -9, 11, 27]) arbre(b, X + dx, -18, 1.3, dx);
  b.cone([X - 70, -0.2, -130], 70, 48, "#8CB09B", 7, 0.3);
  b.cone([X + 60, -0.2, -140], 80, 60, "#7DA3AE", 7, 0.8);
}

// ------------------------------------------------------------------ Gare abandonnée (repère local, z = monde − GZ)
export const RAILS_X = 0.85;
export const X_QUAI = 3.4; // bord du quai (côté rails)
export const H_QUAI = 0.1; // quai bas : les personnages assis (y = 0) restent à la bonne hauteur
export const BANC: V3 = [6.0, 0.95, -20]; // centre de l'assise du banc (dessus de l'assise à y = 0,95), assise tournée vers -x
function mauvaisesHerbes(b: Batisseur, x: number, z: number, n: number, graine: number) {
  const couleurs = ["#6E9A44", "#8CB04F", "#A9B85A", "#5E8A3E", "#C0B866"];
  for (let i = 0; i < n; i++) {
    const a = (graine + i) * 2.399;
    const r = 0.25 + ((graine * 7 + i * 13) % 10) * 0.07;
    const h = 0.6 + ((graine + i * 5) % 7) * 0.22;
    b.boite([x + Math.cos(a) * r * 2.2, h / 2, z + Math.sin(a) * r * 2.2], [0.12, h, 0.12], couleurs[(graine + i) % 5], [Math.sin(a) * 0.25, a, Math.cos(a) * 0.25]);
  }
}
function gare(b: Batisseur, o: Batisseur) {
  const RB = "#8A5A3A";
  b.boite([0, -0.5, -120], [900, 1, 900], "#94AB5E"); // herbe jaunie
  for (const [x, z, s] of [[-30, -60, 9], [40, 20, 11], [-60, 30, 8], [70, -90, 10], [-40, -130, 12]] as Array<[number, number, number]>) b.boite([x, 0.02, z], [s, 0.04, s * 0.8], "#A9B96A");
  // route le long de x
  b.boite([0, -0.02, 0], [320, 0.1, 6.4], "#5B5F6A");
  for (let x = -150; x < 150; x += 7) b.boite([x, SOL_R + 0.01, 0], [2.8, 0.02, 0.2], "#E6DFC0");
  for (const s of [-1, 1]) {
    b.boite([0, SOL_T / 2, s * 4.9], [320, SOL_T, 3.2], "#C8C3B5");
    b.boite([0, SOL_T / 2 + 0.01, s * 3.25], [320, SOL_T + 0.02, 0.2], "#DAD5C5");
    for (let x = -150; x < 150; x += 2.6) b.boite([x, SOL_T + 0.003, s * 4.9], [0.05, 0.006, 3.2], "#A9A496");
  }
  // voie ferrée le long de z : ballast, traverses, rails rouillés
  b.boite([0, 0.0, -110], [4.8, 0.12, 440], "#9C9484");
  for (let z = -320; z < 104; z += 0.95) b.boite([0, 0.15, z], [3.3, 0.1, 0.38], "#5E4838");
  for (const s of [-1, 1]) {
    b.boite([s * RAILS_X, 0.3, -110], [0.16, 0.2, 440], RB);
    b.boite([s * RAILS_X, 0.42, -110], [0.1, 0.05, 440], "#B27A4C");
  }
  b.boite([0, 0.14, 0], [4.4, 0.1, 6.4], "#7A6650"); // platelage du passage à niveau
  for (let k = -3; k <= 3; k++) b.boite([0, 0.2, k * 0.9], [4.4, 0.02, 0.06], "#5E4838");
  // poteaux fixes du passage à niveau (les bras mobiles sont dessinés dans Decor)
  for (const [x, z] of [[-4.8, 4.0], [4.8, -4.0], [-4.8, -4.9], [4.8, 4.9]] as Array<[number, number]>) {
    b.boite([x, 0.4, z], [0.6, 0.8, 0.6], "#8F8F96");
    b.boite([x, 1.6, z], [0.32, 3.2, 0.32], "#EDEAE0");
    b.boite([x, 1.0, z], [0.34, 0.5, 0.34], "#C9453B");
    b.boite([x, 2.4, z], [0.34, 0.5, 0.34], "#C9453B");
    b.boite([x, 3.45, z], [0.9, 0.45, 0.45], "#3B3B42");
  }
  // panneau de passage à niveau (croix de Saint-André) et panneau rouillé de la gare
  b.boite([-7.4, 1.8, 6.4], [0.2, 3.6, 0.2], "#8F8F96");
  b.boite([-7.4, 3.6, 6.4], [2.6, 0.2, 0.2], "#F2F2F2", [0, 0, 0.7]);
  b.boite([-7.4, 3.6, 6.4], [2.6, 0.2, 0.2], "#F2F2F2", [0, 0, -0.7]);
  b.boite([-7.4, 3.6, 6.35], [2.7, 0.3, 0.12], "#C9453B", [0, 0, 0.7]);
  b.boite([-7.4, 3.6, 6.35], [2.7, 0.3, 0.12], "#C9453B", [0, 0, -0.7]);
  b.boite([-11.5, 1.6, -8], [0.2, 3.2, 0.2], "#6A5A4A");
  b.boite([-11.5, 3.2, -8], [3.6, 1.4, 0.2], "#7A5A3A");
  b.boite([-11.5, 3.2, -8.12], [3.3, 1.1, 0.1], "#C9B58A");
  b.boite([-11.5, 3.4, -8.2], [2.6, 0.12, 0.06], "#8A7A5A");
  b.boite([-11.5, 3.05, -8.2], [1.8, 0.12, 0.06], "#8A7A5A");
  b.boite([-11.5, 2.4, -8.0], [0.14, 0.9, 0.12], "#7A5A3A", [0, 0, 0.4]);
  // quai (côté est), arête jaunie, fissures, bordure
  b.boite([(X_QUAI + 9.8) / 2, H_QUAI / 2, -25], [9.8 - X_QUAI, H_QUAI, 36], "#BDB6A6");
  b.boite([X_QUAI + 0.35, H_QUAI + 0.01, -25], [0.4, 0.02, 36], "#D9C23B");
  for (let z = -42; z < -8; z += 2.6) b.boite([6.6, H_QUAI + 0.012, z], [6, 0.02, 0.05], "#9C9686");
  b.boite([(X_QUAI + 9.8) / 2, 0.45, -7.5], [9.8 - X_QUAI, 0.9, 1.0], "#BDB6A6", [-0.5, 0, 0]); // rampe
  // bâtiment de la gare (abandonné : volets cloués, toit éventré)
  b.dans([16, 0, -26], -Math.PI / 2, () => {
    b.boite([0, 0.15, -6], [24.4, 0.3, 12.4], "#8D8A84");
    b.boite([0, 2.4, -6], [24, 4.8, 12], "#D7CDB5");
    for (const x of [-9, -3, 3, 9]) {
      b.boite([x, 2.8, 0.1], [2.4, 2.8, 0.2], "#4A3A2E");
      for (let k = 0; k < 4; k++) b.boite([x, 1.6 + k * 0.7, 0.24], [2.6, 0.22, 0.12], "#8A6A44", [0, 0, k % 2 ? 0.04 : -0.04]);
    }
    b.boite([0, 2.3, 0.15], [2.6, 4.2, 0.3], "#4A3A2E");
    b.boite([0, 2.2, 0.32], [2.8, 0.3, 0.1], "#8A6A44", [0, 0, 0.6]);
    b.boite([0, 2.2, 0.32], [2.8, 0.3, 0.1], "#8A6A44", [0, 0, -0.6]);
    b.pignon([0, 4.8, -6], 25, 4.2, 13.4, "#D7CDB5");
    const toit = "#7B4A3A";
    for (const s of [-1, 1]) {
      b.boite([s * 6.4, 6.55, -6], [13.8, 0.3, 13.4], toit, [0, 0, -s * 0.318]);
    }
    // trous dans le toit (poutres apparentes)
    b.boite([-3.2, 6.5, -4], [3.4, 0.5, 3.6], "#1F1A16", [0, 0, 0.318]);
    for (let k = 0; k < 4; k++) b.boite([-3.2 + (k - 1.5) * 0.9, 6.9, -4], [0.12, 0.12, 4], "#5A4030", [0, 0, 0.318]);
    b.boite([8, 8.2, -9], [1.1, 2.6, 1.1], "#A66A52");
    b.boite([0, 5.4, 0.3], [6.2, 1.1, 0.2], "#6A5A4A"); // enseigne vide
    b.boite([0, 5.4, 0.45], [5.6, 0.7, 0.1], "#C9B58A");
  });
  // auvent du quai (poteaux, poutre, toit à moitié effondré)
  for (const z of [-40, -30, -20, -12]) b.boite([8.6, 2.2, z], [0.3, 4.4, 0.3], "#4F5F58");
  b.boite([8.6, 4.5, -26], [0.4, 0.3, 30], "#4F5F58");
  b.boite([6.4, 4.8, -32], [4.8, 0.2, 18], "#6E7D74", [0, 0, 0.12]);
  b.boite([6.4, 4.1, -15], [4.8, 0.2, 5], "#6E7D74", [0.0, 0, 0.5]); // pan tombé
  // banc, lampadaire rouillé, horloge arrêtée
  b.boite([BANC[0], BANC[1] - 0.05, BANC[2]], [1.0, 0.1, 4.0], "#8A5A36");
  b.boite([BANC[0] + 0.55, BANC[1] + 0.5, BANC[2]], [0.1, 0.9, 4.0], "#8A5A36");
  for (const dz of [-1.7, 1.7]) b.boite([BANC[0], BANC[1] / 2 - 0.05, BANC[2] + dz], [0.8, BANC[1] - 0.1, 0.12], "#3A3A40");
  b.boite([5.0, H_QUAI + 2.0, -35], [0.2, 4.0, 0.2], "#6E5A4A");
  b.boite([5.0, H_QUAI + 4.1, -35], [0.9, 0.3, 0.9], "#5A4A3A");
  b.boite([7.6, H_QUAI + 1.6, -38], [0.14, 3.2, 0.14], "#5A4A3A");
  b.boite([7.6, H_QUAI + 3.4, -38], [1.5, 1.5, 0.3], "#E8E0C8");
  b.boite([7.6, H_QUAI + 3.4, -38.2], [1.2, 1.2, 0.1], "#FFFFFF");
  b.boite([7.6, H_QUAI + 3.55, -38.3], [0.08, 0.5, 0.06], "#2A2A30");
  b.boite([7.9, H_QUAI + 3.35, -38.3], [0.5, 0.08, 0.06], "#2A2A30");
  // poteaux télégraphiques le long de la voie et lignes
  for (let z = -300; z < 80; z += 34) {
    b.boite([-7.5, 4.2, z], [0.26, 8.4, 0.26], "#6A5A4A");
    b.boite([-7.5, 7.6, z], [2.4, 0.2, 0.2], "#6A5A4A");
    o.quad([-7.5, 0.12, z - 0.13], [-7.5, 0.12, z + 0.13], [-7.5 + 7.5, 0.12, z + 0.13 + 2.2], [-7.5 + 7.5, 0.12, z - 0.13 + 2.2], "#101830");
  }
  // herbes folles : bords de la voie, fissures, quai, bâtiment
  let g = 1;
  for (let z = -140; z < 80; z += 7.5) {
    mauvaisesHerbes(b, -2.9 + ((g * 3) % 5) * 0.12, z, 3, g++);
    mauvaisesHerbes(b, 2.7 + ((g * 3) % 5) * 0.1, z + 2, 3, g++);
  }
  for (const [x, z] of [[-6.4, 4.6], [-9, 4.2], [6.5, 4.6], [10, 5.0], [-12, -4.6], [8, -4.6], [4.2, -10], [4.5, -34], [9.2, -8.4], [11.2, -14], [-5.1, 5.6]] as Array<[number, number]>) mauvaisesHerbes(b, x, z, 6, g++);
  for (let z = -42; z < -9; z += 5) mauvaisesHerbes(b, 3.9 + (z % 3) * 0.1, z, 2, g++);
  // arbres et collines au loin
  for (const [x, z] of [[-24, -40], [-38, -90], [-26, 40], [30, -80], [44, -50], [46, 30], [-50, -120], [58, -130]] as Array<[number, number]>) arbre(b, x, z, 1.5, x);
  for (const [x, z] of [[-60, -20], [64, 0], [-70, -70], [78, -100]] as Array<[number, number]>) sapin(b, x, z, 2.0);
  b.cone([-90, -0.2, -300], 130, 70, "#86AAB0", 7, 0.3);
  b.cone([60, -0.2, -330], 150, 96, "#7699A8", 7, 0.9);
  b.cone([200, -0.2, -250], 100, 60, "#86AAB0", 7, 0.1);
  b.cone([-230, -0.2, -230], 100, 56, "#7FA6A8", 7, 0.5);
  b.cone([-60, -0.2, 160], 100, 48, "#86AAB0", 7, 0.2);
  b.cone([110, -0.2, 170], 110, 60, "#7699A8", 7, 0.6);
}

export function construireAnge(): Zones {
  const r = new Batisseur(false);
  const ro = new Batisseur(false);
  rue(r, ro);
  const c = new Batisseur(true);
  chambre(c);
  const g = new Batisseur(false);
  const go = new Batisseur(false);
  g.dans([0, 0, GZ], 0, () => go.dans([0, 0, GZ], 0, () => gare(g, go)));
  return { rue: r.construire(), rueOmbres: ro.construire(), chambre: c.construire(), gare: g.construire(), gareOmbres: go.construire() };
}
