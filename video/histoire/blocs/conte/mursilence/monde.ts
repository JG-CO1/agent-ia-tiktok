/**
 * « Mur du silence » — décors fixes en blocs (ombrage cuit par face) et briques du mur (données animées).
 * Trois lieux éloignés de plus de 400 unités (Decor n'affiche que celui où se trouve la caméra) :
 *   SALON    (0, 0, 0)      salon-cuisine : cuisine à l'ouest (x < 0), escalier à l'est (x > 0), table de petit-déjeuner coupée par le
 *                           mur (axe x = 0, épaisseur 1,8, de z = -7 à 7). Au fond du mur, DANS son épaisseur, le canapé de maman.
 *   CHAMBRE  (-600, 0, 0)   la chambre d'Adam : lit, bureau, dessin de la famille ; le mur la traverse et perce le plafond
 *   RUE      (600, 0, 0)    rue du quartier : maisons, trottoirs, et de grands murs gris qui dépassent des toits
 * Repères : un adulte mesure ≈ 3 unités ; assise de chaise à 0,55 ; table à 1,35.
 */
import * as THREE from "three";
import { Batisseur, type V3 } from "../../geo";
import { maisonSimple } from "../../minuit/monde";

export const SALON: V3 = [0, 0, 0];
export const CHAMBRE: V3 = [-600, 0, 0];
export const RUE: V3 = [600, 0, 0];

export const SW = 10; // demi-largeur du salon (x)
export const SD = 7; // demi-profondeur (z)
export const SH = 6; // hauteur sous plafond
export const EP = 1.8; // épaisseur du mur (x)
export const HB = 0.5; // hauteur d'une assise de briques
export const LB = 14 / 12; // pas des briques le long de z
export const NC = 12; // assises (12 × 0,5 = 6 = plafond)
export const TABLE = { x: 3.4, z0: 2.7, z1: 4.5, h: 1.35 };
export const ASSISE = 0.55;
export const SOFA_Z = -2.5; // maman, au milieu du canapé

const add = (o: V3, p: V3): V3 => [o[0] + p[0], o[1] + p[1], o[2] + p[2]];
export const CH = (p: V3): V3 => add(CHAMBRE, p);
export const RU = (p: V3): V3 => add(RUE, p);

// ------------------------------------------------------------------ Palette (identique d'un lieu à l'autre)
export const COUL = {
  peinture: "#E6D8BC",
  lambris: "#4E7C80",
  crepi: "#F1E8D6",
  parquet: "#B07C4F",
  parquetLigne: "#8F6038",
  plafond: "#EFE7D6",
  bois: "#B98A57",
  boisSombre: "#7A5230",
  brique: ["#7E8896", "#8A94A2", "#727C8A", "#939DAA", "#6B7684", "#848E9C", "#7A8593", "#8D8590"],
  mortier: "#2C323C",
  canape: "#A9573A",
  coussin: "#C26C48",
};

// ------------------------------------------------------------------ Outils
const ext = (b: Batisseur, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: string, lum = 1) =>
  b.boite([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], c, undefined, lum);
/** Boîte à cheval sur l'axe du mur : coupée en deux (ouest, est) pour que chaque moitié ait sa teinte. */
const fend = (O: Batisseur, E: Batisseur, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: string, lum = 1) => {
  if (x1 <= 0) return ext(O, x0, x1, y0, y1, z0, z1, c, lum);
  if (x0 >= 0) return ext(E, x0, x1, y0, y1, z0, z1, c, lum);
  ext(O, x0, 0, y0, y1, z0, z1, c, lum);
  ext(E, 0, x1, y0, y1, z0, z1, c, lum);
};

function chaise(b: Batisseur, x: number, z: number, dos: 1 | -1) {
  ext(b, x - 0.7, x + 0.7, ASSISE - 0.16, ASSISE, z - 0.65, z + 0.65, "#8A5E38");
  for (const sx of [-0.62, 0.62]) for (const sz of [-0.57, 0.57]) ext(b, x + sx - 0.07, x + sx + 0.07, 0, ASSISE - 0.16, z + sz - 0.07, z + sz + 0.07, "#6B4528");
  ext(b, x + dos * 0.62 - 0.07, x + dos * 0.62 + 0.07, ASSISE, 1.9, z - 0.65, z + 0.65, "#8A5E38");
  for (const dz of [-0.45, 0, 0.45]) ext(b, x + dos * 0.62 - 0.05, x + dos * 0.62 + 0.05, ASSISE + 0.5, 1.8, z + dz - 0.05, z + dz + 0.05, "#6B4528");
}

function cadreFenetreZ(b: Batisseur, x0: number, x1: number, y0: number, y1: number, z: number) {
  // cadre de fenêtre dans un mur de normale z (face intérieure en z)
  const c = COUL.crepi;
  ext(b, x0 - 0.15, x1 + 0.15, y1, y1 + 0.2, z - 0.25, z + 0.25, c);
  ext(b, x0 - 0.3, x1 + 0.3, y0 - 0.15, y0, z - 0.25, z + 0.45, c);
  ext(b, x0 - 0.15, x0, y0, y1, z - 0.25, z + 0.25, c);
  ext(b, x1, x1 + 0.15, y0, y1, z - 0.25, z + 0.25, c);
  ext(b, (x0 + x1) / 2 - 0.05, (x0 + x1) / 2 + 0.05, y0, y1, z - 0.1, z + 0.1, c);
  ext(b, x0, x1, (y0 + y1) / 2 - 0.05, (y0 + y1) / 2 + 0.05, z - 0.1, z + 0.1, c);
}

// ------------------------------------------------------------------ Salon
export const FEN_O = { x0: -9.2, x1: -6.4, y0: 2.2, y1: 5.0 }; // fenêtre du fond, à l'ouest
export const FEN_E = { x0: 2.8, x1: 6.2, y0: 2.2, y1: 5.0 }; // fenêtre du fond, à l'est
export const FEN_CUISINE = { z0: 3.3, z1: 5.5, y0: 2.9, y1: 4.7 }; // fenêtre de la cuisine (mur ouest)
export const ETAGERE = { x: -3.8, z: -6.55, photo: [-3.8, 3.62, -6.61] as V3 };
export const HORLOGE: V3 = [8.2, 4.6, -6.86];
export const LAMPE_O: V3 = [-2.3, 4.9, 3.6];
export const LAMPE_E: V3 = [2.3, 4.9, 3.6];
export const ESC = { x0: 7.6, x1: 10, z0: -1.5, pas: 0.8, n: 8, haut: 0.45 };

function salonCommun(O: Batisseur, E: Batisseur) {
  // sol : parquet, lames
  fend(O, E, -SW, SW, -0.1, 0.1, -SD, SD, COUL.parquet);
  for (let z = -6.3; z < 7; z += 1.4) fend(O, E, -SW, SW, 0.1, 0.12, z - 0.02, z + 0.02, COUL.parquetLigne);
  for (let x = -9; x <= 9; x += 3.1) if (Math.abs(x) > 1.2) ext(x < 0 ? O : E, x - 0.02, x + 0.02, 0.1, 0.12, -SD, SD, COUL.parquetLigne);
  // plafond, murs
  fend(O, E, -SW - 0.5, SW + 0.5, SH, SH + 0.4, -SD - 0.5, SD + 0.5, COUL.plafond);
  ext(O, -SW - 0.5, -SW, 0, SH, -SD - 0.5, SD + 0.5, COUL.peinture);
  ext(E, SW, SW + 0.5, 0, SH, -SD - 0.5, SD + 0.5, COUL.peinture);
  fend(O, E, -SW - 0.5, SW + 0.5, 0, SH, SD, SD + 0.5, COUL.peinture);
  // lambris et plinthes (faces intérieures)
  const L = 1.6;
  ext(O, -SW, -SW + 0.08, 0, L, -SD, SD, COUL.lambris);
  ext(O, -SW, -SW + 0.14, L, L + 0.1, -SD, SD, COUL.crepi);
  ext(E, SW - 0.08, SW, 0, L, -SD, SD, COUL.lambris);
  ext(E, SW - 0.14, SW, L, L + 0.1, -SD, SD, COUL.crepi);
  fend(O, E, -SW, SW, 0, L, SD - 0.08, SD, COUL.lambris);
  fend(O, E, -SW, SW, L, L + 0.1, SD - 0.14, SD, COUL.crepi);
  // mur du fond (z = -7) percé de deux fenêtres
  const F: Array<[Batisseur, { x0: number; x1: number; y0: number; y1: number }]> = [[O, FEN_O], [E, FEN_E]];
  ext(O, -SW - 0.5, FEN_O.x0, 0, SH, -SD - 0.5, -SD, COUL.peinture);
  ext(O, FEN_O.x1, 0, 0, SH, -SD - 0.5, -SD, COUL.peinture);
  ext(E, 0, FEN_E.x0, 0, SH, -SD - 0.5, -SD, COUL.peinture);
  ext(E, FEN_E.x1, SW + 0.5, 0, SH, -SD - 0.5, -SD, COUL.peinture);
  for (const [b, f] of F) {
    ext(b, f.x0, f.x1, 0, f.y0, -SD - 0.5, -SD, COUL.peinture);
    ext(b, f.x0, f.x1, f.y1, SH, -SD - 0.5, -SD, COUL.peinture);
    cadreFenetreZ(b, f.x0, f.x1, f.y0, f.y1, -SD + 0.1);
    ext(b, f.x0, f.x1, f.y0, f.y1, -SD - 0.3, -SD - 0.2, "#10183A", 1.4); // fond de l'ouverture (la vitre dynamique est dans Decor)
  }
  ext(O, -SW, FEN_O.x0, 0, L, -SD, -SD + 0.08, COUL.lambris);
  ext(O, FEN_O.x1, 0, 0, L, -SD, -SD + 0.08, COUL.lambris);
  ext(E, 0, FEN_E.x0, 0, L, -SD, -SD + 0.08, COUL.lambris);
  ext(E, FEN_E.x1, SW, 0, L, -SD, -SD + 0.08, COUL.lambris);
  // plinthe
  fend(O, E, -SW, SW, 0, 0.25, -SD, -SD + 0.12, COUL.crepi);
  ext(O, -SW, -SW + 0.12, 0, 0.25, -SD, SD, COUL.crepi);
  ext(E, SW - 0.12, SW, 0, 0.25, -SD, SD, COUL.crepi);
}

function cuisine(O: Batisseur) {
  const x1 = -SW + 1.6;
  // meubles bas continus + plan de travail
  ext(O, -SW, x1, 0, 2.05, 0.2, 5.5, "#DCD5C4");
  ext(O, -SW, x1 + 0.12, 2.05, 2.2, 0.15, 5.55, COUL.bois);
  for (let z = 0.6; z < 5.4; z += 0.9) ext(O, x1, x1 + 0.03, 0.5, 1.8, z - 0.38, z + 0.38, "#EFE9DA");
  for (let z = 0.6; z < 5.4; z += 0.9) ext(O, x1 + 0.03, x1 + 0.05, 1.7, 1.78, z - 0.12, z + 0.12, "#5B5348");
  // évier (sous la fenêtre) et robinet
  ext(O, -SW + 0.15, x1 - 0.1, 2.2, 2.24, 3.45, 5.3, "#9FA7AE");
  ext(O, -SW + 0.2, x1 - 0.2, 2.22, 2.3, 3.55, 5.2, "#3D4650");
  ext(O, -SW + 0.2, -SW + 0.35, 2.2, 3.0, 4.3, 4.45, "#B8C0C8");
  ext(O, -SW + 0.2, -SW + 0.9, 2.95, 3.05, 4.3, 4.45, "#B8C0C8");
  // cuisinière + hotte
  ext(O, -SW + 0.1, x1, 2.2, 2.3, 1.2, 2.6, "#26282E");
  for (const [dx, dz] of [[0.4, 0.35], [0.4, 1.05], [1.1, 0.35], [1.1, 1.05]]) ext(O, -SW + 0.1 + dx - 0.2, -SW + 0.1 + dx + 0.2, 2.3, 2.34, 1.2 + dz - 0.2, 1.2 + dz + 0.2, "#101114");
  ext(O, -SW, -SW + 1.2, 4.3, 4.9, 1.1, 2.7, "#B1B6BC");
  ext(O, -SW, -SW + 0.5, 4.9, 6.0, 1.5, 2.3, "#B1B6BC");
  // placards hauts
  ext(O, -SW, -SW + 0.9, 3.7, 5.3, 0.15, 1.05, "#E4DCC8");
  ext(O, -SW, -SW + 0.9, 3.7, 5.3, 2.75, 3.3, "#E4DCC8");
  ext(O, -SW, -SW + 0.9, 3.7, 5.3, 5.55, 6.85, "#E4DCC8");
  // fenêtre de la cuisine (mur ouest) : cadre
  const f = FEN_CUISINE;
  ext(O, -SW, -SW + 0.2, f.y1, f.y1 + 0.2, f.z0 - 0.2, f.z1 + 0.2, COUL.crepi);
  ext(O, -SW, -SW + 0.2, f.y0 - 0.12, f.y0, f.z0 - 0.3, f.z1 + 0.3, COUL.crepi);
  ext(O, -SW, -SW + 0.2, f.y0, f.y1, f.z0 - 0.16, f.z0, COUL.crepi);
  ext(O, -SW, -SW + 0.2, f.y0, f.y1, f.z1, f.z1 + 0.16, COUL.crepi);
  ext(O, -SW, -SW + 0.14, f.y0, f.y1, (f.z0 + f.z1) / 2 - 0.05, (f.z0 + f.z1) / 2 + 0.05, COUL.crepi);
  // frigo (coin avant-ouest)
  ext(O, -SW + 0.1, -SW + 1.9, 0, 4.7, 5.8, 6.9, "#D8DDE0");
  ext(O, -SW + 1.9, -SW + 1.96, 2.9, 3.9, 5.9, 6.0, "#7A838C");
  ext(O, -SW + 1.9, -SW + 1.96, 0.8, 1.8, 5.9, 6.0, "#7A838C");
  ext(O, -SW + 1.88, -SW + 1.92, 2.8, 2.86, 5.8, 6.9, "#8F979E");
}

function etagere(O: Batisseur) {
  const x0 = -5.6;
  const x1 = -2.0;
  const z0 = -SD;
  const z1 = -SD + 0.62;
  const bois = "#6B4528";
  ext(O, x0 - 0.08, x0 + 0.08, 0, 5.3, z0, z1, bois);
  ext(O, x1 - 0.08, x1 + 0.08, 0, 5.3, z0, z1, bois);
  for (const y of [0.1, 1.5, 2.9, 4.3, 5.25]) ext(O, x0, x1, y, y + 0.12, z0, z1, bois);
  ext(O, x0, x1, 0, 5.3, z0, z0 + 0.06, "#4A2E18");
  // livres (rangées de blocs colorés)
  const CL = ["#9C3B32", "#2F5D8C", "#D9A63A", "#3F7A55", "#7A4A8A", "#C8C2B0", "#B5562F"];
  let x = x0 + 0.2;
  for (let i = 0; i < 9; i++) {
    const w = 0.22 + ((i * 7) % 4) * 0.05;
    const h = 0.9 + ((i * 5) % 4) * 0.12;
    ext(O, x, x + w, 0.22, 0.22 + h, z0 + 0.1, z0 + 0.52, CL[i % CL.length]);
    x += w + 0.03;
  }
  x = x0 + 1.45;
  for (let i = 0; i < 6; i++) {
    const w = 0.24 + ((i * 3) % 3) * 0.05;
    ext(O, x, x + w, 1.62, 1.62 + 0.85 + (i % 3) * 0.1, z0 + 0.1, z0 + 0.5, CL[(i + 2) % CL.length]);
    x += w + 0.03;
  }
  x = x0 + 0.25;
  for (let i = 0; i < 7; i++) {
    const w = 0.24 + ((i * 5) % 3) * 0.05;
    ext(O, x, x + w, 4.42, 4.42 + 0.8 + (i % 2) * 0.1, z0 + 0.1, z0 + 0.5, CL[(i + 4) % CL.length]);
    x += w + 0.03;
  }
  // plante en pot (étagère du milieu, à gauche)
  ext(O, x0 + 0.3, x0 + 0.85, 1.62, 2.05, z0 + 0.12, z0 + 0.52, "#B5562F");
  ext(O, x0 + 0.35, x0 + 0.8, 2.05, 2.5, z0 + 0.17, z0 + 0.47, "#3F9A55");
  ext(O, x0 + 0.2, x0 + 0.95, 2.4, 2.7, z0 + 0.1, z0 + 0.55, "#4FB468");
  // cadre de la photo de maman (étagère du milieu) : l'image dynamique est posée devant
  const [px] = ETAGERE.photo;
  ext(O, px - 0.5, px + 0.5, 3.02, 4.22, z0 + 0.24, z0 + 0.34, "#E2C27A");
  ext(O, px - 0.42, px + 0.42, 3.1, 4.14, z0 + 0.34, z0 + 0.36, "#FFFFFF");
  // bougie éteinte et vase à côté
  ext(O, x1 - 0.8, x1 - 0.5, 2.92, 3.4, z0 + 0.2, z0 + 0.5, "#F2E6C8");
  ext(O, x1 - 0.7, x1 - 0.6, 3.4, 3.5, z0 + 0.32, z0 + 0.38, "#2B2118");
}

function tableEtChaises(O: Batisseur, E: Batisseur) {
  const t = TABLE;
  fend(O, E, -t.x, t.x, t.h - 0.15, t.h, t.z0, t.z1, COUL.bois);
  fend(O, E, -t.x - 0.04, t.x + 0.04, t.h - 0.22, t.h - 0.15, t.z0 - 0.04, t.z1 + 0.04, "#8A5E38");
  for (const sx of [-1, 1]) for (const z of [t.z0 + 0.14, t.z1 - 0.14]) ext(sx < 0 ? O : E, sx * (t.x - 0.2) - 0.11, sx * (t.x - 0.2) + 0.11, 0, t.h - 0.22, z - 0.11, z + 0.11, "#8A5E38");
  const zc = (t.z0 + t.z1) / 2;
  chaise(O, -3.85, zc, -1);
  chaise(E, 3.85, zc, 1);
  // vaisselle : assiettes, tasses, pain, bol, verre
  const plat = (b: Batisseur, x: number, z: number, r: number, c: string) => ext(b, x - r, x + r, t.h, t.h + 0.05, z - r, z + r, c);
  plat(O, -2.35, zc, 0.5, "#F4F1E8");
  plat(O, -2.35, zc, 0.32, "#E9E3D2");
  ext(O, -2.45, -2.1, t.h + 0.05, t.h + 0.12, zc - 0.2, zc + 0.15, "#D9A55A"); // tartine
  ext(O, -2.95, -2.65, t.h, t.h + 0.34, zc + 0.5, zc + 0.8, "#6F7A86"); // tasse de café de papa
  plat(E, 2.35, zc, 0.5, "#F4F1E8");
  ext(E, 2.2, 2.6, t.h + 0.05, t.h + 0.22, zc - 0.2, zc + 0.2, "#4D7FC4"); // bol d'Adam
  ext(E, 2.75, 2.97, t.h, t.h + 0.4, zc - 0.7, zc - 0.48, "#CFE6F5"); // verre
  ext(O, -1.3, -0.95, t.h, t.h + 0.2, zc + 0.5, zc + 0.85, "#C98B3B"); // pot de confiture
  ext(E, 1.1, 1.6, t.h, t.h + 0.22, zc - 0.5, zc - 0.05, "#E0B067"); // corbeille de pain
  // suspensions
  for (const [x, c] of [[-2.3, "#E8A33A"], [2.3, "#E8A33A"]] as Array<[number, string]>) {
    const b = x < 0 ? O : E;
    ext(b, x - 0.03, x + 0.03, 5.2, SH, zc - 0.03, zc + 0.03, "#2B2118");
    ext(b, x - 0.55, x + 0.55, 4.55, 5.2, zc - 0.55, zc + 0.55, c);
    ext(b, x - 0.25, x + 0.25, 4.5, 4.55, zc - 0.25, zc + 0.25, "#FFE9A6", 1.5);
  }
}

function escalier(E: Batisseur) {
  const { x0, x1, z0, pas, n, haut } = ESC;
  for (let k = 0; k < n; k++) {
    const za = z0 + k * pas;
    ext(E, x0, x1, 0, haut * (k + 1), za, za + pas, k % 2 ? "#B98A57" : "#A5754A");
    ext(E, x0, x1, haut * (k + 1), haut * (k + 1) + 0.03, za, za + pas, "#C99A63");
  }
  const zl = z0 + n * pas; // palier
  ext(E, x0, x1, 0, haut * n, zl, SD, "#8A6240");
  ext(E, x0, x1, haut * n, haut * n + 0.05, zl, SD, "#C99A63");
  // garde-corps : montants et main courante inclinée
  const long = Math.hypot(haut * n, n * pas);
  const ang = -Math.atan2(haut * n - haut, n * pas);
  for (let k = 0; k <= n; k += 2) {
    const z = z0 + k * pas + 0.1;
    ext(E, x0 - 0.04, x0 + 0.1, haut * Math.min(k + 1, n), haut * Math.min(k + 1, n) + 1.7, z - 0.07, z + 0.07, "#6B4528");
  }
  E.boite([x0 + 0.03, haut + 1.7 + (haut * (n - 1)) / 2, z0 + (n * pas) / 2], [0.14, 0.14, long], "#6B4528", [ang, 0, 0]);
  ext(E, x0 - 0.04, x0 + 0.1, haut * n, haut * n + 1.7, zl, zl + 0.14, "#6B4528");
  ext(E, x0 - 0.04, x0 + 0.1, haut * n + 1.6, haut * n + 1.74, zl, SD, "#6B4528");
  // trémie noire au plafond, au-dessus du palier
  ext(E, x0, x1, SH - 0.04, SH, 3.6, SD, "#0A0A10");
}

function divers(O: Batisseur, E: Batisseur) {
  // horloge (cadre) au mur du fond, côté est
  const [hx, hy, hz] = HORLOGE;
  ext(E, hx - 1.1, hx + 1.1, hy - 1.1, hy + 1.1, hz - 0.06, hz + 0.1, "#6B4528");
  // plante dans le coin du fond (est)
  ext(E, 8.4, 9.4, 0, 0.9, -6.4, -5.4, "#B5562F");
  ext(E, 8.6, 9.2, 0.9, 2.3, -6.2, -5.6, "#3F9A55");
  ext(E, 8.2, 9.6, 1.9, 2.9, -6.6, -5.2, "#4FB468");
  // tapis sous la table (ouest et est)
  fend(O, E, -4.6, 4.6, 0.1, 0.13, 1.9, 5.3, "#7E3B3B");
  fend(O, E, -4.4, 4.4, 0.13, 0.15, 2.1, 5.1, "#A24F45");
  // lampadaire d'angle (est) près de l'escalier
  ext(E, 6.0, 6.1, 0, 4.0, 0.7, 0.8, "#2B2118");
  ext(E, 5.55, 6.55, 3.7, 4.5, 0.4, 1.1, "#E8D2A0");
  ext(E, 5.8, 6.3, 3.65, 3.7, 0.55, 0.95, "#FFE9A6", 1.5);
  // porte d'entrée sur le mur de façade (ouest), repère de la maison
  ext(O, -7.8, -5.6, 0, 4.4, SD - 0.12, SD, "#6B4528");
  ext(O, -7.7, -5.7, 0.2, 4.3, SD - 0.16, SD - 0.12, "#8A5E38");
  ext(O, -6.0, -5.9, 2.0, 2.3, SD - 0.2, SD - 0.14, "#D9A63A");
  // ombres portées « cuites » au sol : bandes sombres le long du mur (côté est : l'ombre de la lampe de l'ouest)
  ext(E, 0.9, 2.5, 0.12, 0.125, -SD, SD, "#5A4328", 0.55);
  ext(O, -1.3, -0.9, 0.12, 0.125, -SD, SD, "#5A4328", 0.65);
}

/** Canapé de maman, tapis, lampadaire, tasse : tout est DANS l'épaisseur du mur (invisible tant que les briques sont là). */
function nook(N: Batisseur) {
  const sz0 = -4.2;
  const sz1 = -0.9;
  // tapis (déborde du mur des deux côtés, comme une trace de la pièce cachée)
  ext(N, -2.3, 2.3, 0.1, 0.14, -4.9, -0.2, "#8E3B3B");
  ext(N, -2.1, 2.1, 0.14, 0.16, -4.7, -0.4, "#C9A15A");
  ext(N, -1.9, 1.9, 0.16, 0.18, -4.5, -0.6, "#8E3B3B");
  // canapé : plinthe, assise, dossier, accoudoirs (il fait face à l'est)
  ext(N, -0.85, 0.5, 0.1, 0.4, sz0, sz1, "#6E3A26");
  ext(N, -0.55, 0.5, 0.4, 0.62, sz0 + 0.3, sz1 - 0.3, COUL.coussin);
  ext(N, -0.85, -0.5, 0.4, 1.9, sz0, sz1, COUL.canape);
  ext(N, -0.55, -0.45, 0.8, 1.7, sz0 + 0.4, sz1 - 0.4, "#C9805C");
  for (const [z0, z1] of [[sz0, sz0 + 0.32], [sz1 - 0.32, sz1]] as Array<[number, number]>) ext(N, -0.85, 0.5, 0.4, 1.15, z0, z1, COUL.canape);
  // plaid sur l'accoudoir sud et sur les genoux de maman
  ext(N, -0.2, 0.5, 1.15, 1.22, sz1 - 0.32, sz1 - 0.02, "#EFE6D2");
  ext(N, 0.18, 0.78, 0.98, 1.06, SOFA_Z - 0.55, SOFA_Z + 0.55, "#EFE6D2");
  ext(N, 0.2, 0.76, 1.06, 1.1, SOFA_Z - 0.55, SOFA_Z + 0.55, "#B8483E", 1.1);
  // lampadaire (au nord du canapé), abat-jour lumineux
  ext(N, 0.1, 0.2, 0.1, 4.0, -4.7, -4.6, "#2B2118");
  ext(N, -0.2, 0.5, 3.4, 4.3, -5.05, -4.25, "#F0D398");
  ext(N, -0.05, 0.35, 3.35, 3.4, -4.9, -4.4, "#FFE9A6", 1.6);
  // table d'appoint au sud avec une pile de livres
  ext(N, -0.3, 0.5, 0.1, 1.25, -0.8, -0.2, "#7A5230");
  ext(N, -0.2, 0.4, 1.25, 1.5, -0.7, -0.3, "#C8C2B0");
  // cadre au mur du fond de la niche (une photo de famille, côté ouest du canapé)
  ext(N, -0.88, -0.84, 2.3, 3.3, SOFA_Z - 0.5, SOFA_Z + 0.5, "#E2C27A");
}

// ------------------------------------------------------------------ Briques du mur
export type Brique = {
  id: number;
  /** colonne (z) et assise (y) */
  i: number;
  j: number;
  p: V3;
  s: V3;
  teinte: string;
  /** instant d'arrivée (hors de portée = présente d'emblée) et de chute (jamais = 1e9) */
  ta: number;
  tf: number;
  v: V3;
  w: V3;
  /** gravité propre (la brique qui tombe en ralenti) */
  g: number;
  /** reste au sol (gravats) ou se dissout en poussière après l'impact */
  reste: boolean;
  /** instant d'impact au sol (calculé) */
  tl: number;
  /** destination finale du lacet */
  lacet: number;
  /** instant où la brique commence à frémir avant de tomber */
  fr?: number;
  /** phrase gravée sur les faces est / ouest */
  grave?: [string | null, string | null];
};
const alea = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** Nombre d'assises présentes d'emblée à la position z. */
export function assisesInitiales(zc: number): number {
  if (zc <= -0.5) return NC;
  const s = Math.min(1, (zc + 0.5) / 7.5);
  const H = 1.7 + 4.3 * Math.pow(1 - s, 3);
  return Math.min(NC, Math.max(4, Math.round(H / HB)));
}
export type VaguesMur = { v0: number; vagues: number[]; effondre: number; tombe: number; zTrou: number; secousse: number };
export const J_TROU = 4; // assise de la brique qui tombe (y 2,0 – 2,5 : hauteur des yeux)

/** Toutes les briques du mur du salon, avec leurs instants d'arrivée, de chute et leur destin. */
export function genererMur(v: VaguesMur): Brique[] {
  const out: Brique[] = [];
  let id = 0;
  // brique du trou : la plus proche de zTrou à l'assise J_TROU
  for (let j = 0; j < NC; j++) {
    const dec = (j % 2) * 0.5;
    for (let i = 0; i < 13; i++) {
      const zc0 = -SD + (i + 0.5 - dec) * LB;
      let zc = zc0;
      let lon = LB;
      if (i === 0 && dec) {
        zc = -SD + (0.5 * LB) / 2;
        lon = LB * 0.5;
      }
      if (i === 12 && !dec) continue;
      if (i === 12 && dec) {
        lon = LB * 0.5;
        zc = SD - lon / 2;
      }
      const n0 = assisesInitiales(zc);
      const r = alea(id * 3 + 1);
      const r2 = alea(id * 5 + 7);
      const r3 = alea(id * 11 + 3);
      let ta = -1e3;
      if (j >= n0) {
        const q = j - n0;
        const m = NC - n0;
        const w = Math.min(5, Math.floor((q * 6) / m));
        const dans = q - Math.ceil((w * m) / 6);
        ta = v.vagues[w] + 0.13 * Math.max(0, dans) + 0.05 * Math.abs(zc - 3) + r * 0.05;
      } else if (j >= n0 - 2 && zc > 0.4) {
        // l'« accéléré » du premier plan : les trois dernières assises arrivent en vague, du bord du salon vers le fond
        ta = v.v0 + (SD - zc) * 0.1 + (j - (n0 - 2)) * 0.12 + r * 0.02;
      }
      const dist = Math.abs(zc - v.zTrou);
      const tf = v.effondre + 0.1 * dist + 0.04 * (NC - j) + r2 * 0.08;
      const sens = r3 < 0.5 ? 1 : -1;
      const hautY = j * HB + HB / 2;
      const vx = sens * (1.4 + r * 2.6 + (hautY > 3 ? 0.8 : 0));
      const b: Brique = {
        id,
        i,
        j,
        p: [0, hautY, zc],
        s: [EP, HB - 0.05, lon - 0.06],
        teinte: COUL.brique[Math.floor(r2 * COUL.brique.length) % COUL.brique.length],
        ta,
        tf,
        v: [vx, 1 + r2 * 1.5, (r - 0.5) * 2.4],
        w: [(r2 - 0.5) * 7, (r - 0.5) * 3, (r3 - 0.5) * 8],
        g: 17,
        reste: false,
        tl: 0,
        lacet: (r3 - 0.5) * 0.8,
      };
      out.push(b);
      id++;
    }
  }
  // la brique qui tombe : assise J_TROU, la plus proche de zTrou
  const trou = out.filter((b) => b.j === J_TROU).sort((a, b) => Math.abs(a.p[2] - v.zTrou) - Math.abs(b.p[2] - v.zTrou))[0];
  trou.tf = v.tombe;
  trou.v = [1.1, 0.5, 0.2];
  trou.w = [0.5, 0.3, 1.6];
  trou.g = 5.2;
  trou.lacet = 0.12;
  trou.grave = ["maman me manque", "à moi aussi"];
  trou.fr = v.secousse;
  trou.teinte = "#8F9BAB";
  // calcul des impacts et du destin de chaque brique
  for (const b of out) {
    const yF = b.s[1] / 2 + 0.02;
    const y0 = b.p[1];
    // y0 + vy t - g t²/2 = yF
    const a = b.g / 2;
    const bb = -b.v[1];
    const cc = yF - y0;
    const disc = bb * bb - 4 * a * cc;
    b.tl = b.tf + (disc > 0 ? (-bb + Math.sqrt(disc)) / (2 * a) : 0.1);
    const dur = b.tl - b.tf;
    const xFin = b.p[0] + b.v[0] * dur;
    const zFin = b.p[2] + b.v[2] * dur;
    const couloir = zFin > -4.9 && zFin < 3.2 && Math.abs(xFin) < 3.8;
    b.reste = b !== trou && !couloir && alea(b.id * 17 + 5) < 0.5;
    if (b === trou) b.reste = true;
  }
  // trois briques choisies : « pardon », « reste », « je t'aime » (cadrées de près par la caméra)
  const choisie = (j: number, z: number) => out.filter((b) => b.j === j).sort((a, b) => Math.abs(a.p[2] - z) - Math.abs(b.p[2] - z))[0];
  const pardon = choisie(7, 0.9);
  const reste = choisie(7, -0.4);
  const taime = choisie(6, -1.4);
  pardon.grave = ["pardon", null];
  reste.grave = ["reste", null];
  taime.grave = ["je t'aime", null];
  // phrases gravées : environ une brique sur quatre à l'est (visible côté Adam), moins à l'ouest
  const phrases = ["pardon", "reste", "je t'aime", "pourquoi", "reviens", "merci", "j'ai peur", "écoute-moi", "tu me manques", "désolé", "parle-moi", "je suis là", "reste avec nous", "je t'attends", "excuse-moi", "viens", "je sais", "pas toi", "je t'en veux", "demain peut-être"];
  let k = 0;
  for (const b of out) {
    if (b === trou || b === pardon || b === reste || b === taime) continue;
    if (b.j < 2 || b.j > 10) continue;
    const e = alea(b.id * 13 + 2) < 0.3 ? phrases[k++ % phrases.length] : null;
    const o = alea(b.id * 19 + 4) < 0.2 ? phrases[(k + 7) % phrases.length] : null;
    if (e || o) b.grave = [e, o];
  }
  return out;
}

// ------------------------------------------------------------------ Mur statique (chambre, rue) : briques fusionnées dans une géométrie
export function murStatique(b: Batisseur, o: { p: V3; ry: number; longueur: number; hauteur: number; epaisseur: number; seed?: number; couleurs?: string[]; mortier?: string; pas?: number; assise?: number }) {
  const pas = o.pas ?? 1.1;
  const hb = o.assise ?? HB;
  const cl = o.couleurs ?? COUL.brique;
  const nc = Math.ceil(o.hauteur / hb);
  b.dans(o.p, o.ry, () => {
    b.boite([0, o.hauteur / 2, 0], [o.epaisseur - 0.12, o.hauteur, o.longueur], o.mortier ?? COUL.mortier);
    for (let j = 0; j < nc; j++) {
      const dec = (j % 2) * 0.5;
      for (let i = 0; ; i++) {
        let z0 = -o.longueur / 2 + (i - dec) * pas;
        let z1 = z0 + pas;
        z0 = Math.max(z0, -o.longueur / 2);
        z1 = Math.min(z1, o.longueur / 2);
        if (z0 >= o.longueur / 2 - 0.05) break;
        if (z1 - z0 < 0.2) continue;
        const r = alea((o.seed ?? 0) + i * 31 + j * 17);
        b.boite([0, j * hb + hb / 2, (z0 + z1) / 2], [o.epaisseur, hb - 0.05, z1 - z0 - 0.06], cl[Math.floor(r * cl.length) % cl.length]);
      }
    }
  });
}

// ------------------------------------------------------------------ Chambre d'Adam
export const CH_W = 6;
export const CH_D = 5;
export const CH_H = 5;
export const MUR_CH_X = 2.6;
function chambre(b: Batisseur) {
  const c = CHAMBRE;
  const X = (x: number) => c[0] + x;
  b.boite([c[0], -0.05, 0], [CH_W * 2, 0.1, CH_D * 2], "#9B6B44");
  for (let z = -4.4; z < 5; z += 1.1) b.boite([c[0], 0.07, z], [CH_W * 2, 0.02, 0.04], "#7A5230");
  // plafond : deux dalles de part et d'autre du mur qui le traverse
  b.boite([X(-2.5), CH_H + 0.2, 0], [7.6, 0.4, CH_D * 2 + 0.6], "#E9E2D2");
  b.boite([X(5.1), CH_H + 0.2, 0], [2.4, 0.4, CH_D * 2 + 0.6], "#E9E2D2");
  const mur = "#7E9AC4";
  b.boite([X(-CH_W - 0.15), CH_H / 2, 0], [0.3, CH_H, CH_D * 2 + 0.6], mur);
  b.boite([X(CH_W + 0.15), CH_H / 2, 0], [0.3, CH_H, CH_D * 2 + 0.6], mur);
  b.boite([c[0], CH_H / 2, CH_D + 0.15], [CH_W * 2 + 0.6, CH_H, 0.3], mur);
  // mur du fond avec fenêtre
  const zf = -CH_D - 0.15;
  b.boite([X(-4.6), CH_H / 2, zf], [2.6, CH_H, 0.3], mur);
  b.boite([X(4.6), CH_H / 2, zf], [2.6, CH_H, 0.3], mur);
  b.boite([c[0], 0.9, zf], [6.6, 1.8, 0.3], mur);
  b.boite([c[0], 4.4, zf], [6.6, 1.2, 0.3], mur);
  b.boite([c[0], 3.0, zf + 0.12], [6.7, 0.12, 0.3], "#F1E8D6");
  b.boite([c[0], 1.84, zf + 0.12], [6.9, 0.16, 0.5], "#F1E8D6");
  for (const x of [-3.3, 0, 3.3]) b.boite([X(x), 2.4, zf + 0.1], [0.14, 2.4, 0.2], "#F1E8D6");
  b.boite([c[0], 2.4, zf - 0.1], [6.6, 2.4, 0.1], "#10183A", undefined, 1.4);
  // plinthes
  b.boite([X(-CH_W + 0.06), 0.15, 0], [0.12, 0.3, CH_D * 2], "#F1E8D6");
  b.boite([c[0], 0.15, CH_D - 0.06], [CH_W * 2, 0.3, 0.12], "#F1E8D6");
  // lit (à l'ouest, tête contre le fond) : cadre, matelas, couette, oreiller
  const bx = X(-4.2);
  b.boite([bx, 0.35, -2.0], [3.0, 0.5, 5.6], "#6B4528");
  b.boite([bx, 0.75, -2.0], [2.8, 0.4, 5.4], "#EAF0F8");
  b.boite([bx, 0.98, -1.2], [2.9, 0.16, 3.7], "#24366B");
  b.boite([bx, 1.12, -1.2], [2.85, 0.1, 3.6], "#2E4585");
  b.boite([bx, 1.05, -4.3], [1.5, 0.3, 0.9], "#FFFFFF");
  b.boite([bx, 1.7, -4.75], [3.0, 2.2, 0.2], "#6B4528");
  // bureau et chaise (est, devant la fenêtre)
  b.boite([X(1.4), 1.35, -4.2], [3.4, 0.16, 1.4], "#B98A57");
  for (const dx of [-1.5, 1.5]) b.boite([X(1.4 + dx), 0.65, -4.2], [0.14, 1.3, 1.2], "#8A5E38");
  b.boite([X(0.6), 1.58, -4.4], [0.9, 0.3, 0.6], "#2A2D36");
  b.boite([X(1.9), 1.62, -4.5], [0.4, 0.4, 0.4], "#E8A33A"); // petite lampe de bureau
  b.boite([X(1.9), 1.95, -4.5], [0.6, 0.3, 0.6], "#E8A33A");
  // dessin de la famille au mur de gauche : cadre (le dessin est dessiné dans Decor)
  b.boite([X(-CH_W + 0.1), 3.3, 1.9], [0.1, 2.5, 3.3], "#F1E8D6");
  // tapis rond et peluche
  b.boite([X(-1.5), 0.08, 1.8], [3.2, 0.05, 3.2], "#C25A4A");
  b.boite([X(-1.5), 0.1, 1.8], [2.4, 0.05, 2.4], "#E8A33A");
  // le mur du silence : traverse la chambre le long de z et perce le plafond
  murStatique(b, { p: [X(MUR_CH_X), 0, 0], ry: 0, longueur: CH_D * 2 + 0.6, hauteur: CH_H + 2.4, epaisseur: EP, seed: 9 });
  // gravats et poussière de plâtre au sol autour de la trémie
  for (const [x, z, s] of [[1.4, -1.6, 0.5], [4.3, 1.2, 0.4], [4.0, -2.9, 0.35], [1.2, 3.1, 0.45]] as Array<[number, number, number]>) b.boite([X(x), s / 2, z], [s, s, s], "#D8D2C4", [0.2, 0.5, 0.1]);
}

// ------------------------------------------------------------------ Rue
export const RUE_MAISONS: Array<{ x: number; coul: string; toit: string; h: number }> = [
  { x: -30, coul: "#D9C7A3", toit: "#8A4B3A", h: 5.2 },
  { x: -17, coul: "#B9CFC3", toit: "#6B4A3A", h: 4.6 },
  { x: -4, coul: "#E2B99A", toit: "#7A3F32", h: 5.4 },
  { x: 9, coul: "#C6CFE0", toit: "#5A4A56", h: 4.8 },
  { x: 22, coul: "#E8D5A8", toit: "#8A4B3A", h: 5.2 },
  { x: 35, coul: "#BFD3B0", toit: "#6B4A3A", h: 5.0 },
];
export const RUE_MURS: Array<{ x: number; z: number; l: number; h: number }> = [
  { x: -23, z: -26, l: 15, h: 34 },
  { x: 3, z: -42, l: 18, h: 52 },
  { x: 27, z: -30, l: 14, h: 40 },
  { x: -50, z: -56, l: 20, h: 60 },
  { x: -10.5, z: -16, l: 3.8, h: 15 }, // un mur qui pousse entre deux jardins, tout près
];
function rue(b: Batisseur) {
  const o = RUE;
  b.boite([o[0], -0.5, o[2] - 10], [320, 1, 220], "#6F8F5A");
  b.boite([o[0], 0.0, o[2] + 1], [300, 0.12, 11], "#59606B");
  for (let x = -140; x < 140; x += 6) b.boite([o[0] + x, 0.08, o[2] + 1], [2.6, 0.04, 0.3], "#E8D58A");
  for (const z of [-5.2, 7.2]) b.boite([o[0], 0.1, o[2] + z], [300, 0.2, 2.8], "#D8D0BE");
  b.boite([o[0], 0.05, o[2] - 6], [300, 0.1, 0.5], "#C9C2B0");
  // maisons du côté nord
  for (const m of RUE_MAISONS) {
    b.dans(add(o, [m.x, 0, -13]), 0, () => {
      maisonSimple(b, { w: 9, d: 7.5, h: m.h, mur: m.coul, toit: m.toit, porteX: 2.2, porteC: "#6B4528", fen: [{ x: -2.2, w: 2.2 }], volets: "#4E7C80", cheminee: -2.2 });
    });
    b.boite([o[0] + m.x, 0.15, o[2] - 7.7], [9.4, 0.3, 4], "#CDBF9F");
  }
  // grands murs gris qui dépassent des toits
  RUE_MURS.forEach((m, k) => murStatique(b, { p: add(o, [m.x, 0, m.z]), ry: Math.PI / 2, longueur: m.l, hauteur: m.h, epaisseur: 3, seed: 40 + k * 7, assise: 1, pas: 1.8 }));
  // arbres et lampadaires
  for (const x of [-34, -21, -8, 6, 19, 31]) {
    b.boite([o[0] + x, 1.0, o[2] - 6.7], [0.5, 2.0, 0.5], "#6B4528");
    b.boite([o[0] + x, 3.0, o[2] - 6.7], [2.4, 2.2, 2.4], "#4E8F4A");
    b.boite([o[0] + x + 0.2, 4.3, o[2] - 6.8], [1.5, 1.2, 1.5], "#5BA356");
  }
  for (const x of [-26, -2, 14, 28]) {
    b.boite([o[0] + x, 2.6, o[2] + 6.6], [0.25, 5.2, 0.25], "#33475C");
    b.boite([o[0] + x, 5.3, o[2] + 6.2], [0.3, 0.3, 1.0], "#33475C");
    b.boite([o[0] + x, 5.1, o[2] + 5.8], [0.5, 0.2, 0.5], "#FFF3C4", undefined, 1.5);
  }
}

// ------------------------------------------------------------------ Assemblage
export type Zones = { ouest: THREE.BufferGeometry; est: THREE.BufferGeometry; nook: THREE.BufferGeometry; chambre: THREE.BufferGeometry; rue: THREE.BufferGeometry };
export function construireMursilence(): Zones {
  const O = new Batisseur(true);
  const E = new Batisseur(true);
  salonCommun(O, E);
  cuisine(O);
  etagere(O);
  tableEtChaises(O, E);
  escalier(E);
  divers(O, E);
  const N = new Batisseur(true);
  nook(N);
  const C = new Batisseur(true);
  chambre(C);
  const R = new Batisseur(false);
  rue(R);
  return { ouest: O.construire(), est: E.construire(), nook: N.construire(), chambre: C.construire(), rue: R.construire() };
}

// ------------------------------------------------------------------ Battement du mur (cœur lent) et lueur dorée entre les briques
export const PERIODE_COEUR = 1.7;
/** Impulsion du battement (deux coups rapprochés) : 0 à 1,2. */
export function coeur(T: number, t0: number): number {
  if (T < t0) return 0;
  const ph = (T - t0) % PERIODE_COEUR;
  const g = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
  return g(ph, 0.06, 0.075) + 0.75 * g(ph, 0.36, 0.075);
}
