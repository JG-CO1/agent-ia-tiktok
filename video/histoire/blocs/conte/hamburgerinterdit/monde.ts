/**
 * « Hamburger interdit » — décors fixes en blocs (ombrage cuit par face). Quatre lieux éloignés (≥ 400 unités) :
 *   RUE      (0, 0, 0)      grand-rue rétro « diner américain » années 50 au crépuscule : façades rose / turquoise / moutarde,
 *                           auvents rayés, damiers, voitures arrondies, école avec policiers, grande enseigne au bout
 *   CUISINE  (-400, 0, 0)   cuisine-salle à manger pastel : table à quatre assiettes (une de trop), horloge, fenêtre néon
 *   GRENIER  (400, 0, 0)    grenier sous les toits : malles, manteau sur son portant, rais de lumière ambrée
 *   SALON    (0, 0, 400)    salon : canapé, table basse où repose l'album, mur de cadres
 * Chaque zone est construite en plusieurs « niveaux de décoloration » (0 = couleurs pop, 3 = presque gris) : la palette
 * se désature à mesure que le narrateur comprend.
 */
import * as THREE from "three";
import { Batisseur, versMonde, type V3 } from "../../geo";

export type Lieu = "rue" | "cuisine" | "grenier" | "salon";
export const RUE: V3 = [0, 0, 0];
export const CUISINE: V3 = [-400, 0, 0];
export const GRENIER: V3 = [400, 0, 0];
export const SALON: V3 = [0, 0, 400];
export const NIVEAUX = [0, 0.4, 0.7, 0.93];

// ------------------------------------------------------------------ Palette pop et décoloration
export const POP = {
  rose: "#FF6FA5", roseP: "#FFB3CF", turq: "#2FD3C4", turqP: "#9BE9E0", mout: "#F6B81E", moutP: "#FFDC7A", cerise: "#E0223D",
  creme: "#FFF1D6", noir: "#1B1B22", blanc: "#FAFAFA", marine: "#1F2F66", lilas: "#C9B5E8",
};
const memoGris = new Map<string, string>();
/** Mélange une couleur avec son gris de même luminance : `g` = 0 (pop) à 1 (gris). */
export function gris(hex: string, g: number): string {
  if (g <= 0) return hex;
  const cle = `${hex}|${g}`;
  let r = memoGris.get(cle);
  if (!r) {
    const c = new THREE.Color(hex);
    const l = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
    c.r += (l - c.r) * g;
    c.g += (l - c.g) * g;
    c.b += (l - c.b) * g;
    r = `#${c.getHexString()}`;
    memoGris.set(cle, r);
  }
  return r;
}
/** Bâtisseur dont toutes les couleurs passent par le niveau de décoloration. */
class Bat extends Batisseur {
  g = 0;
  override geo(g: THREE.BufferGeometry, couleur: string, local?: THREE.Matrix4, lum = 1) {
    super.geo(g, gris(couleur, this.g), local, lum);
  }
}

// ------------------------------------------------------------------ RUE : plan des boutiques (données pures, partagées avec le décor dynamique)
export const XF = 13.5; // plan des façades
export type Boutique = {
  cote: -1 | 1;
  zc: number;
  w: number;
  h: number;
  mur: string;
  bande: string;
  auv: [string, string];
  nom: string;
  neon: string;
  /** vitrine : [x local, largeur] ; porte : x local */
  fen: Array<[number, number]>;
  porte: number;
};
export const BOUTIQUES: Boutique[] = [
  { cote: -1, zc: 44, w: 16, h: 8.4, mur: POP.roseP, bande: POP.turq, auv: [POP.turq, "#FFFFFF"], nom: "BEAUTÉ", neon: "#36F2E0", fen: [[-3.5, 5]], porte: 3.5 },
  { cote: -1, zc: 26, w: 16, h: 8.8, mur: "#8EE8DC", bande: POP.rose, auv: [POP.rose, "#FFFFFF"], nom: "MILK BAR", neon: "#FF4FA3", fen: [[-3.5, 5]], porte: 3.5 },
  { cote: -1, zc: 8, w: 18, h: 9.2, mur: POP.rose, bande: "#FFFFFF", auv: [POP.turq, "#FFFFFF"], nom: "DINER", neon: "#FFE04A", fen: [[-4.5, 7]], porte: 3 },
  { cote: -1, zc: -12, w: 18, h: 8.6, mur: "#F6C645", bande: POP.cerise, auv: [POP.cerise, "#FFFFFF"], nom: "CAFÉ", neon: "#FF4FA3", fen: [[-4.5, 6]], porte: 3.5 },
  { cote: -1, zc: -30, w: 16, h: 9.0, mur: POP.creme, bande: POP.rose, auv: [POP.rose, POP.turq], nom: "GLACES", neon: "#36F2E0", fen: [[-3.5, 5]], porte: 3.5 },
  { cote: -1, zc: -48, w: 16, h: 8.4, mur: "#FF7A8C", bande: "#FFFFFF", auv: [POP.mout, "#FFFFFF"], nom: "HOT-DOGS", neon: "#FFE04A", fen: [[-3.5, 5]], porte: 3.5 },
  { cote: -1, zc: -66, w: 16, h: 9.0, mur: POP.turqP, bande: POP.mout, auv: [POP.mout, "#FFFFFF"], nom: "DISQUES", neon: "#FF4FA3", fen: [[-3.5, 5]], porte: 3.5 },
  { cote: 1, zc: 44, w: 16, h: 8.8, mur: POP.moutP, bande: POP.turq, auv: [POP.turq, "#FFFFFF"], nom: "PHARMA", neon: "#36F2E0", fen: [[3.5, 5]], porte: -3.5 },
  { cote: 1, zc: 26, w: 16, h: 9.2, mur: POP.roseP, bande: POP.cerise, auv: [POP.cerise, "#FFFFFF"], nom: "JUKEBOX", neon: "#FFE04A", fen: [[3.5, 5]], porte: -3.5 },
  { cote: 1, zc: 8, w: 18, h: 8.6, mur: POP.turqP, bande: POP.rose, auv: [POP.rose, "#FFFFFF"], nom: "PIZZA", neon: "#FF4FA3", fen: [[4.5, 6]], porte: -3.5 },
  { cote: 1, zc: -12, w: 18, h: 9.4, mur: "#FFFFFF", bande: POP.turq, auv: [POP.mout, "#FFFFFF"], nom: "CINÉ", neon: "#FF4FA3", fen: [[4.5, 5]], porte: -3.5 },
  { cote: 1, zc: -66, w: 16, h: 8.4, mur: POP.lilas, bande: POP.mout, auv: [POP.mout, "#FFFFFF"], nom: "GARAGE", neon: "#FFE04A", fen: [[3.5, 5]], porte: -3.5 },
];
/** Repère local d'une boutique → monde (x local = largeur, z local = vers la rue). */
export const vm = (b: Pick<Boutique, "cote" | "zc">, p: V3): V3 => versMonde([b.cote < 0 ? -XF : XF, 0, b.zc], b.cote < 0 ? Math.PI / 2 : -Math.PI / 2, p);
export const ryFacade = (cote: -1 | 1) => (cote < 0 ? Math.PI / 2 : -Math.PI / 2);

/** Lampadaires : x = ±8.8, tous les 16 en z. */
export const LAMPES: Array<{ p: V3; cote: -1 | 1 }> = [];
for (let z = 48; z >= -56; z -= 16) {
  LAMPES.push({ p: [-8.8, 0, z], cote: -1 });
  LAMPES.push({ p: [8.8, 0, z - 8], cote: 1 });
}
export const HAUT_LAMPE = 7.4;
/** Enseigne géante au bout de la rue. */
export const GEANTE = { p: [0, 16.6, -60] as V3, w: 16, h: 17 };
/** École (à droite, en retrait) et table des policiers. */
export const ECOLE = { x0: 22, zc: -38, porteZ: -38 };
export const TABLE_POLICE: V3 = [16.6, 0, -36.6];
export const BANDEAUX_Z = [30, -6];
export const VOITURES: Array<{ p: V3; ry: number; c: string }> = [
  { p: [-5.9, 0, 38], ry: 0, c: POP.rose },
  { p: [-5.9, 0, 27], ry: Math.PI, c: POP.turq },
  { p: [-5.9, 0, -20], ry: 0, c: POP.creme },
  { p: [5.9, 0, 34], ry: Math.PI, c: POP.mout },
  { p: [5.9, 0, 6], ry: 0, c: POP.cerise },
  { p: [5.9, 0, -14], ry: Math.PI, c: POP.rose },
  { p: [-5.9, 0, -44], ry: Math.PI, c: POP.mout },
  { p: [5.9, 0, -46], ry: 0, c: POP.turq },
];

function voiture50(b: Bat, p: V3, ry: number, coul: string) {
  b.dans(p, ry, () => {
    b.boite([0, 0.95, 0], [2.4, 0.85, 5.2], coul);
    b.boule([0, 1.3, 1.85], [1.18, 0.42, 1.35], coul, 1);
    b.boule([0, 1.3, -1.9], [1.18, 0.42, 1.2], coul, 1);
    b.boite([0, 1.78, -0.15], [2.1, 0.6, 2.3], "#BFE8F2");
    b.boule([0, 2.15, -0.15], [1.08, 0.36, 1.4], "#FFF8EA", 1);
    b.boite([0, 1.55, -0.15], [2.4, 0.16, 2.5], "#FFF8EA");
    for (const s of [-1, 1]) {
      b.boite([s * 1.22, 1.0, 0], [0.06, 0.2, 5.0], "#E8EEF2"); // baguette chromée
      b.boite([s * 0.9, 1.0, -2.55], [0.7, 0.25, 0.35], "#E8EEF2");
      b.boite([s * 0.7, 1.35, 2.62], [0.5, 0.3, 0.1], "#FFF4C0");
      b.boite([s * 1.0, 1.7, -2.55], [0.18, 0.7, 0.9], coul); // ailerons
      for (const z of [-1.6, 1.7]) {
        b.boite([s * 1.1, 0.55, z], [0.4, 1.1, 1.1], "#17171C");
        b.boite([s * 1.3, 0.55, z], [0.06, 0.62, 0.62], "#FFFFFF");
      }
    }
    b.boite([0, 0.62, 2.75], [2.5, 0.28, 0.3], "#E8EEF2");
    b.boite([0, 0.62, -2.75], [2.5, 0.28, 0.3], "#E8EEF2");
  });
}
function lampe50(b: Bat, x: number, z: number, cote: -1 | 1) {
  b.cylindre([x, 0, z], 0.22, HAUT_LAMPE, POP.turq, 6);
  b.boite([x, 0.45, z], [0.7, 0.9, 0.7], POP.turq);
  b.boite([x, HAUT_LAMPE + 0.05, z], [0.7, 0.2, 0.7], POP.noir);
  b.boite([x, HAUT_LAMPE + 0.6, z], [0.6, 0.9, 0.6], "#FFF1B8");
  b.boite([x, HAUT_LAMPE + 1.2, z], [0.8, 0.2, 0.8], POP.noir);
  b.boite([x - cote * 0.35, 5.4, z], [0.08, 0.1, 0.3], POP.noir);
}

/** Façade d'une boutique (repère local : x = largeur, z = vers la rue). */
function boutique(b: Bat, o: Boutique) {
  const { w, h } = o;
  const d = 10;
  b.dans([o.cote < 0 ? -XF : XF, 0, o.zc], ryFacade(o.cote), () => {
    b.boite([0, h / 2, -d / 2], [w, h, d], o.mur);
    b.boite([0, 0.2, 0.15], [w + 0.4, 0.4, 0.3], "#6A6275"); // soubassement
    // damier noir et blanc au sol devant la boutique
    for (let i = 0; i < Math.floor(w); i++) for (let j = 0; j < 2; j++) b.boite([-w / 2 + 0.5 + i, 0.11, 0.5 + j], [1, 0.04, 1], (i + j) % 2 ? "#F2F2F2" : "#202028");
    // vitrines : cadre chromé, intérieur chaud
    for (const [x, ww] of o.fen) {
      b.boite([x, 2.6, 0.05], [ww + 0.5, 3.3, 0.14], "#E8EEF2");
      b.boite([x, 2.6, 0.12], [ww, 2.9, 0.1], "#FFE6A8");
      b.boite([x, 1.0, 0.1], [ww + 0.5, 0.7, 0.2], o.auv[0]); // bas de vitrine
    }
    // porte
    b.boite([o.porte, 2.15, 0.06], [2.2, 4.3, 0.16], "#E8EEF2");
    b.boite([o.porte, 2.1, 0.14], [1.7, 3.9, 0.1], o.auv[0]);
    b.boite([o.porte + 0.5, 2.0, 0.22], [0.12, 0.5, 0.1], "#E8EEF2");
    // auvent rayé incliné (onze lames)
    const n = Math.max(8, Math.round(w / 1.4));
    for (let i = 0; i < n; i++) b.boite([-w / 2 + ((i + 0.5) * w) / n, 4.95, 1.25], [w / n, 0.14, 2.6], i % 2 ? o.auv[1] : o.auv[0], [0.27, 0, 0]);
    for (let i = 0; i < n; i++) b.boite([-w / 2 + ((i + 0.5) * w) / n, 4.35, 2.38], [w / n, 0.55, 0.1], i % 2 ? o.auv[1] : o.auv[0]);
    // bandeau d'enseigne et corniche
    b.boite([0, 6.1, 0.1], [w, 1.6, 0.2], o.bande);
    b.boite([0, h + 0.3, 0.15], [w + 0.5, 0.6, 0.6], o.auv[0]);
    b.boite([0, h + 0.75, -0.3], [w * 0.9, 0.3, 0.2], "#FFFFFF");
    // petites fenêtres de l'étage
    for (let i = -1; i <= 1; i += 2) {
      b.boite([i * w * 0.27, 7.7, 0.05], [2.4, 1.2, 0.12], "#E8EEF2");
      b.boite([i * w * 0.27, 7.7, 0.1], [2.0, 0.9, 0.1], "#6A5A8A");
    }
  });
}

function rue(b: Bat) {
  // terrain, chaussée, trottoirs
  b.boite([0, -0.6, -40], [900, 1, 900], "#4A2E66");
  b.boite([0, -0.08, -40], [16.4, 0.22, 420], "#3C3A52");
  for (let z = 60; z > -130; z -= 6) b.boite([0, 0.04, z], [0.32, 0.06, 2.8], "#F6E27A");
  for (const s of [-1, 1]) {
    b.boite([s * 10.9, 0.0, -40], [5.6, 0.2, 420], "#E6B9D2");
    b.boite([s * 8.1, 0.04, -40], [0.34, 0.24, 420], "#FFFFFF");
    for (let z = 60; z > -130; z -= 4) b.boite([s * 10.9, 0.1, z], [5.6, 0.03, 0.12], "#C98FB0"); // joints de dalle
  }
  for (const bt of BOUTIQUES) boutique(b, bt);
  // fond de rue : bâtiments bas continus et collines violettes
  for (const s of [-1, 1]) {
    for (let z = -88; z > -150; z -= 20) b.boite([s * (XF + 5), 4 + (z % 3) * 0.4, z], [10, 8 + ((z * 7) % 5) * 0.3, 18], s < 0 ? POP.turqP : POP.roseP);
  }
  b.cone([-60, -0.2, -190], 90, 70, "#5A3A86", 7, 0.3);
  b.cone([40, -0.2, -210], 110, 86, "#4C2F78", 7, 0.9);
  b.cone([130, -0.2, -170], 80, 56, "#64449A", 7, 0.1);
  b.cone([-150, -0.2, -160], 70, 50, "#64449A", 7, 0.6);
  // voitures et lampadaires
  for (const v of VOITURES) voiture50(b, v.p, v.ry, v.c);
  for (const l of LAMPES) lampe50(b, l.p[0], l.p[2], l.cote);
  // enseigne géante : deux pieds, caisson sombre
  const [gx, gy, gz] = GEANTE.p;
  for (const s of [-1, 1]) {
    b.boite([gx + s * 4.2, 4.5, gz - 0.2], [1.0, 9.0, 1.0], POP.turq);
    b.boite([gx + s * 4.2, 9.0, gz - 0.2], [1.5, 0.4, 1.5], POP.noir);
  }
  b.boite([gx, gy, gz - 0.5], [GEANTE.w + 0.8, GEANTE.h + 0.8, 0.8], "#120820");
  b.boite([gx, gy + GEANTE.h / 2 + 0.5, gz - 0.5], [GEANTE.w + 1.2, 0.5, 1.0], POP.rose);
  b.boite([gx, gy - GEANTE.h / 2 - 0.4, gz - 0.5], [GEANTE.w + 1.2, 0.5, 1.0], POP.rose);
  // clôture de l'école (piquets turquoise / blancs) avec le portail ouvert, école, mât, cour
  const zPortail: [number, number] = [-41, -35];
  for (let z = -22; z > -54; z -= 1.2) {
    if (z < zPortail[0] + 0.6 && z > zPortail[1] - 0.6) continue;
    b.boite([XF + 0.3, 1.5, z], [0.25, 3.0, 0.4], ((z * 10) | 0) % 2 ? "#FFFFFF" : POP.turq);
  }
  b.boite([XF + 0.3, 2.6, -31.5], [0.2, 0.3, 19], POP.turq);
  b.boite([XF + 0.3, 2.6, -45.5], [0.2, 0.3, 17], POP.turq);
  for (const z of [zPortail[0], zPortail[1]]) {
    b.boite([XF + 0.3, 2.4, z], [0.9, 4.8, 0.9], POP.rose);
    b.boite([XF + 0.3, 5.0, z], [1.1, 0.4, 1.1], POP.mout);
  }
  b.boite([(XF + 50) / 2, 0.0, -38], [50 - XF, 0.2, 40], "#CFC3E0"); // cour
  const E = ECOLE;
  b.boite([E.x0 + 9, 5, E.zc], [18, 10, 32], "#FFE08A");
  b.boite([E.x0 + 9, 10.3, E.zc], [19, 0.7, 33], POP.turq);
  b.boite([E.x0 - 0.2, 0.2, E.zc], [1.4, 0.4, 7], "#FFFFFF");
  b.boite([E.x0 - 0.05, 2.3, E.zc], [0.3, 4.6, 4.6], "#E8EEF2");
  b.boite([E.x0 - 0.12, 2.2, E.zc], [0.2, 4.2, 4.0], POP.marine);
  for (const dz of [-11, -6.5, 6.5, 11]) for (const y of [2.6, 6.6]) {
    b.boite([E.x0 - 0.05, y, E.zc + dz], [0.3, 2.2, 2.4], "#E8EEF2");
    b.boite([E.x0 - 0.1, y, E.zc + dz], [0.2, 1.8, 2.0], y > 5 ? "#6A5A8A" : "#FFE6A8");
  }
  b.cylindre([E.x0 - 4, 0, -26], 0.22, 14, "#E8EEF2", 6);
  b.boite([E.x0 - 4 + 0.1, 12.5, -26 + 1.4], [0.1, 1.6, 2.8], POP.cerise);
  // table des policiers (pieds chromés, plateau damier)
  const [tx, , tz] = TABLE_POLICE;
  b.boite([tx, 1.8, tz], [1.7, 0.16, 3.2], "#F2F2F2");
  b.boite([tx, 1.76, tz], [1.76, 0.08, 3.26], "#2FD3C4");
  for (const dz of [-1.4, 1.4]) for (const dx of [-0.7, 0.7]) b.boite([tx + dx, 0.9, tz + dz], [0.14, 1.8, 0.14], "#E8EEF2");
  // poubelles, bouche d'incendie, bancs
  for (const [x, z] of [[-9.6, 18], [9.8, -4], [-9.8, -22], [9.6, 40]] as Array<[number, number]>) {
    b.cylindre([x, 0.3, z], 0.55, 1.6, "#9AA0B4", 8);
    b.cylindre([x, 1.9, z], 0.6, 0.18, "#6C7288", 8);
  }
  for (const [x, z] of [[-10.2, 33], [10.2, 18]] as Array<[number, number]>) {
    b.cylindre([x, 0.3, z], 0.32, 1.3, POP.cerise, 8);
    b.boite([x, 1.65, z], [0.9, 0.3, 0.5], POP.cerise);
  }
}

// ------------------------------------------------------------------ CUISINE
const [KX] = CUISINE;
export const K_W = 7;
export const K_Z = 5.5;
export const K_H = 6.6;
export const TABLE_Y = 2.2;
export const SIEGES = {
  mere: [KX - 1.6, 0, -2.35] as V3,
  pere: [KX + 1.6, 0, -2.35] as V3,
  narr: [KX - 1.6, 0, 2.35] as V3,
  enfant: [KX + 1.6, 0, 2.35] as V3,
};
export const PLAQUES: V3[] = [[KX - 1.6, TABLE_Y + 0.14, -0.85], [KX + 1.6, TABLE_Y + 0.14, -0.85], [KX - 1.6, TABLE_Y + 0.14, 0.85], [KX + 1.6, TABLE_Y + 0.14, 0.85]];
export const HORLOGE: V3 = [KX - 1.6, 3.55, -K_Z + 0.2];
export const LAMPE_CUISINE: V3 = [KX, 3.9, 0];
export const FEN_CUISINE = { x0: KX + 2.4, x1: KX + 5.6, y0: 1.9, y1: 4.1 };

function chaise(b: Bat, x: number, z: number, ry: number, coul: string, petite = false) {
  const s = petite ? 0.78 : 1;
  b.dans([x, 0, z], ry, () => {
    b.boite([0, 1.2 * s, 0], [1.3 * s, 0.22, 1.3 * s], coul);
    b.boite([0, 1.5 * s, -0.62 * s], [1.3 * s, 1.7 * s, 0.16], coul);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.boite([sx * 0.55 * s, 0.55 * s, sz * 0.55 * s], [0.1, 1.1 * s, 0.1], "#E8EEF2");
  });
  if (petite) b.boite([x, 1.0 * s + 0.4, z], [1.0, 0.1, 1.0], "#F6B81E"); // le coussin moutarde
}
function pieceBase(b: Bat, W: number, Z: number, H: number, sol: (b: Bat) => void, haut: string, bas: string, plafond: string, frise: string, X0: number, Z0 = 0) {
  sol(b);
  b.boite([X0, H + 0.1, Z0], [W * 2 + 0.6, 0.2, Z * 2 + 0.6], plafond);
  for (const [x, z, sx, sz] of [[-W - 0.15, 0, 0.3, Z * 2 + 0.6], [W + 0.15, 0, 0.3, Z * 2 + 0.6], [0, Z + 0.15, W * 2 + 0.6, 0.3]] as Array<[number, number, number, number]>) {
    b.boite([X0 + x, H / 2, Z0 + z], [sx, H, sz], haut);
    b.boite([X0 + x, 0.95, Z0 + z], [sx + 0.04, 1.9, sz + 0.04], bas);
    b.boite([X0 + x, 1.95, Z0 + z], [sx + 0.08, 0.14, sz + 0.08], frise);
  }
  b.boite([X0, 0.12, Z0 - Z], [W * 2, 0.24, 0.4], "#FFFFFF"); // plinthe
}
function cuisine(b: Bat) {
  const W = K_W;
  const Z = K_Z;
  const H = K_H;
  pieceBase(b, W, Z, H, (b2) => {
    for (let i = 0; i < W * 2; i++) for (let j = 0; j < Z * 2; j++) b2.boite([KX - W + 0.5 + i, 0.04, -Z + 0.5 + j], [1, 0.08, 1], (i + j) % 2 ? "#F4F0EA" : "#25252E");
  }, "#FFC3D8", "#43D6C6", "#FFF1D6", "#FFFFFF", KX);
  // mur du fond (z = -Z) percé de la fenêtre
  const f = FEN_CUISINE;
  const zf = -Z - 0.15;
  const mur = "#FFC3D8";
  b.boite([(KX - W + f.x0) / 2 - 0.15, H / 2, zf], [f.x0 - (KX - W) + 0.3, H, 0.3], mur);
  b.boite([(f.x1 + KX + W) / 2 + 0.15, H / 2, zf], [KX + W - f.x1 + 0.3, H, 0.3], mur);
  b.boite([(f.x0 + f.x1) / 2, f.y0 / 2, zf], [f.x1 - f.x0, f.y0, 0.3], mur);
  b.boite([(f.x0 + f.x1) / 2, (f.y1 + H) / 2, zf], [f.x1 - f.x0, H - f.y1, 0.3], mur);
  b.boite([KX - W + 2.5, 0.95, zf + 0.03], [W * 0.36, 1.9, 0.34], "#43D6C6");
  // cadre de fenêtre et appui
  for (const [x, y, sx, sy] of [[(f.x0 + f.x1) / 2, f.y0, f.x1 - f.x0 + 0.4, 0.16], [(f.x0 + f.x1) / 2, f.y1, f.x1 - f.x0 + 0.4, 0.16], [f.x0, (f.y0 + f.y1) / 2, 0.16, f.y1 - f.y0], [f.x1, (f.y0 + f.y1) / 2, 0.16, f.y1 - f.y0], [(f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2, 0.1, f.y1 - f.y0]] as Array<[number, number, number, number]>) b.boite([x, y, zf + 0.1], [sx, sy, 0.2], "#FFFFFF");
  // rideaux rose bonbon
  b.boite([f.x0 - 0.45, 3.0, zf + 0.35], [0.8, 2.6, 0.18], POP.rose);
  b.boite([f.x1 + 0.45, 3.0, zf + 0.35], [0.8, 2.6, 0.18], POP.rose);
  // plan de travail turquoise, évier, cuisinière, placards roses, réfrigérateur arrondi crème
  b.boite([KX - W + 0.9, 1.0, -1.2], [1.8, 2.0, 7.4], "#43D6C6");
  b.boite([KX - W + 0.9, 2.05, -1.2], [2.0, 0.14, 7.6], "#FFFFFF");
  for (const z of [-3.6, -1.2, 1.2]) b.boite([KX - W + 1.82, 1.0, z], [0.06, 1.7, 2.2], "#2FB8AA");
  b.boite([KX - W + 0.9, 2.14, 0.4], [1.2, 0.1, 1.5], "#C9D4DC"); // évier
  b.boite([KX - W + 0.9, 2.3, 0.4], [0.2, 0.45, 0.2], "#E8EEF2");
  b.boite([KX - W + 0.9, 3.8, -1.6], [1.0, 1.3, 5.2], POP.roseP);
  for (const z of [-3.6, -1.6, 0.4]) b.boite([KX - W + 1.42, 3.8, z], [0.06, 1.1, 1.8], "#FF8FBA");
  b.boite([KX - W + 1.0, 1.05, 3.6], [1.9, 2.1, 2.0], "#FFF8EA"); // cuisinière
  for (const [dx, dz] of [[-0.35, 3.2], [0.35, 3.2], [-0.35, 4.0], [0.35, 4.0]]) b.boite([KX - W + 1.0 + dx, 2.18, dz], [0.5, 0.06, 0.5], "#25252E");
  b.boite([KX - W + 1.9, 1.0, 3.6], [0.06, 0.9, 1.5], "#25252E");
  b.boite([KX + W - 1.3, 2.4, -3.7], [2.2, 4.8, 2.4], "#FFF8EA"); // frigo
  b.boite([KX + W - 1.3, 3.45, -2.48], [2.0, 0.05, 0.06], "#9AA0B4");
  b.boite([KX + W - 2.38, 3.6, -2.4], [0.1, 1.2, 0.14], "#E8EEF2");
  b.boite([KX + W - 2.38, 1.9, -2.4], [0.1, 0.9, 0.14], "#E8EEF2");
  // porte de sortie dans le mur de droite (vers l'escalier)
  b.boite([KX + W + 0.02, 2.0, 2.5], [0.4, 4.0, 2.5], "#12081C");
  b.boite([KX + W - 0.1, 4.15, 2.5], [0.3, 0.3, 2.9], "#FFFFFF");
  for (const dz of [-1.35, 1.35]) b.boite([KX + W - 0.1, 2.0, 2.5 + dz], [0.3, 4.0, 0.2], "#FFFFFF");
  // table : plateau, nappe en carreaux rouge et blanc, pied central chromé
  b.boite([KX, TABLE_Y, 0], [5.8, 0.16, 3.2], "#FFFFFF");
  for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) b.boite([KX - 2.75 + i * 0.5, TABLE_Y + 0.09, -1.25 + j * 0.5], [0.5, 0.03, 0.5], (i + j) % 2 ? "#FFFFFF" : "#E0223D");
  b.boite([KX, TABLE_Y / 2, 0], [0.4, TABLE_Y, 0.4], "#E8EEF2");
  b.boite([KX, 0.1, 0], [2.0, 0.2, 0.9], "#E8EEF2");
  // chaises (rose) et chaise d'enfant moutarde
  chaise(b, SIEGES.mere[0], SIEGES.mere[2] - 0.2, 0, POP.rose);
  chaise(b, SIEGES.pere[0], SIEGES.pere[2] - 0.2, 0, POP.rose);
  chaise(b, SIEGES.narr[0], SIEGES.narr[2] + 0.2, Math.PI, POP.rose);
  chaise(b, SIEGES.enfant[0], SIEGES.enfant[2] + 0.1, Math.PI, POP.mout, true);
  // assiettes (blanches, bord turquoise) et couverts : quatre
  for (const p of PLAQUES) {
    b.cylindre([p[0], p[1], p[2]], 0.64, 0.07, POP.turq, 12);
    b.cylindre([p[0], p[1] + 0.07, p[2]], 0.5, 0.05, "#FFFFFF", 12);
    b.boite([p[0] - 0.92, p[1] + 0.03, p[2]], [0.12, 0.04, 0.7], "#C9D4DC");
    b.boite([p[0] + 0.92, p[1] + 0.03, p[2]], [0.12, 0.04, 0.7], "#C9D4DC");
  }
  // buffet pop sous la fenêtre côté gauche : bocal à biscuits, théière
  b.boite([KX - 3.5, 0.9, -K_Z + 0.9], [1.6, 1.8, 1.4], "#FFE08A");
  b.boite([KX - 3.5, 2.05, -K_Z + 0.9], [1.7, 0.12, 1.5], "#FFFFFF");
  b.cylindre([KX - 3.8, 2.1, -K_Z + 0.9], 0.3, 0.7, "#FF6FA5", 8);
  b.cylindre([KX - 3.1, 2.1, -K_Z + 0.9], 0.26, 0.5, POP.turq, 8);
}

// ------------------------------------------------------------------ GRENIER
const [GX] = GRENIER;
export const G_W = 8;
export const G_Z0 = -6.5;
export const G_Z1 = 7.5;
export const FENETRE_GRENIER: V3 = [GX, 5.0, G_Z0 + 0.1];
export const PORTANT: V3 = [GX - 2.4, 0, -2.2];
export const MALLES: Array<{ p: V3; ry: number; s: V3 }> = [
  { p: [GX + 5.2, 0, -3.8], ry: 0.2, s: [3.4, 2.0, 2.0] },
  { p: [GX + 3.0, 0, -5.0], ry: -0.1, s: [2.4, 1.5, 1.6] },
  { p: [GX - 5.6, 0, 2.5], ry: 0.4, s: [3.0, 1.8, 1.8] },
  { p: [GX + 5.5, 0, 3.0], ry: -0.3, s: [2.6, 1.6, 1.8] },
];
function grenier(b: Bat) {
  const W = G_W;
  const zc = (G_Z0 + G_Z1) / 2;
  const L = G_Z1 - G_Z0;
  // plancher en lattes
  for (let i = 0; i < 16; i++) b.boite([GX - W + 0.5 + i, 0.04, zc], [0.96, 0.08, L], i % 2 ? "#8A6240" : "#7C5736");
  // murs bas (genoux) et pentes du toit (dalles inclinées), pignons
  const th = Math.atan2(6.5, W);
  const Lp = Math.hypot(W, 6.5) + 0.8;
  for (const s of [-1, 1]) {
    b.boite([GX + s * (W + 0.15), 1.0, zc], [0.3, 2.0, L + 0.6], "#5B4128");
    b.boite([GX + s * (W / 2 - 0.1), 5.45, zc], [Lp, 0.3, L + 0.6], "#4A3320", [0, 0, -s * th]);
    // chevrons visibles
    for (let z = G_Z0 + 0.8; z <= G_Z1; z += 2.1) b.boite([GX + s * (W / 2 - 0.2), 5.2, z], [Lp - 0.4, 0.34, 0.3], "#8B6238", [0, 0, -s * th]);
  }
  b.boite([GX, 8.4, zc], [0.5, 0.4, L + 0.6], "#8B6238"); // faîtage
  b.pignon([GX, 2.0, G_Z0 - 0.2], 2 * W + 0.6, 6.5, 0.4, "#5B4128");
  b.pignon([GX, 2.0, G_Z1 + 0.2], 2 * W + 0.6, 6.5, 0.4, "#5B4128");
  // poutres transversales
  for (const z of [-4.2, -0.4, 3.4, 6.6]) {
    b.boite([GX, 6.4, z], [2 * W - 3.2, 0.4, 0.4], "#8B6238");
    for (const s of [-1, 1]) b.boite([GX + s * 1.8, 7.2, z], [0.3, 2.2, 0.3], "#8B6238", [0, 0, -s * 0.5]);
  }
  // fenêtre du pignon : cadre et vitre éblouissante
  b.boite([GX, 5.0, G_Z0 + 0.05], [3.0, 3.0, 0.3], "#3A2A18");
  b.boite([GX, 5.0, G_Z0 + 0.25], [2.5, 2.5, 0.1], "#FFE2A8");
  b.boite([GX, 5.0, G_Z0 + 0.32], [0.14, 2.5, 0.1], "#3A2A18");
  b.boite([GX, 5.0, G_Z0 + 0.32], [2.5, 0.14, 0.1], "#3A2A18");
  // porte d'entrée de l'escalier (mur de façade z = G_Z1)
  b.boite([GX + 5.0, 2.0, G_Z1 - 0.1], [2.8, 4.0, 0.3], "#2A1A10");
  b.boite([GX + 5.0, 2.0, G_Z1 - 0.25], [2.2, 3.7, 0.2], "#12081C");
  // portant à manteau (pied + montant + patères)
  const [px, , pz] = PORTANT;
  b.boite([px, 0.15, pz], [1.8, 0.3, 1.8], "#5B4128");
  b.boite([px, 1.4, pz - 0.5], [0.22, 2.8, 0.22], "#5B4128");
  b.boite([px, 2.82, pz - 0.5], [1.9, 0.16, 0.16], "#5B4128");
  // malles à sangles de laiton
  for (const m of MALLES) {
    b.dans(m.p, m.ry, () => {
      b.boite([0, m.s[1] / 2, 0], m.s, "#7A4A2A");
      b.boite([0, m.s[1] + 0.2, 0], [m.s[0] + 0.1, 0.4, m.s[2] + 0.1], "#8A5A34");
      for (const dx of [-m.s[0] * 0.3, m.s[0] * 0.3]) b.boite([dx, m.s[1] / 2 + 0.1, 0], [0.2, m.s[1] + 0.5, m.s[2] + 0.14], "#B8924A");
      b.boite([0, m.s[1] * 0.6, m.s[2] / 2 + 0.06], [0.4, 0.4, 0.12], "#D5AF55");
    });
  }
  // cartons, meuble sous un drap, tapis roulé, cheval à bascule, lampe, miroir
  for (const [x, z, s, r] of [[-4.6, -4.8, 1.4, 0.2], [-3.2, -5.2, 1.0, -0.3], [-6.4, -3.6, 1.6, 0.1], [6.2, 5.4, 1.2, 0.5], [-6.0, 5.6, 1.3, 0]] as Array<[number, number, number, number]>) {
    b.boite([GX + x, 0.7 * s, z], [1.4 * s, 1.4 * s, 1.4 * s], "#B08A5A", [0, r, 0]);
    b.boite([GX + x, 1.45 * s, z], [1.5 * s, 0.1, 1.5 * s], "#9A7544", [0, r, 0]);
  }
  b.boite([GX - 5.6, 1.4, -1.2], [2.6, 2.8, 2.0], "#CFC9C0", [0, 0.2, 0]); // meuble sous un drap
  b.boule([GX - 5.6, 3.0, -1.2], [1.4, 0.6, 1.1], "#D9D3CA", 0, 0.2);
  b.boite([GX - 5.0, 0.3, 4.6], [0.7, 0.6, 3.0], "#9A4A52", [0, 1.2, 0]); // tapis roulé
  b.boite([GX + 1.4, 1.4, -5.3], [0.14, 2.8, 2.0], "#C9D4DC"); // miroir
  b.boite([GX + 1.4, 1.4, -5.3], [0.2, 3.0, 2.2], "#5B4128");
  b.boite([GX + 1.4, 1.4, -5.22], [0.12, 2.6, 1.8], "#9FB4C8");
  b.cylindre([GX - 7.0, 0, -5.0], 0.4, 3.4, "#5B4128", 6);
  b.boite([GX - 7.0, 3.7, -5.0], [1.1, 0.8, 1.1], "#E8D4A0");
}

// ------------------------------------------------------------------ SALON
const [, , SZ] = SALON;
export const S_W = 7;
export const S_Z = 5.5;
export const S_H = 7.0;
export const TABLE_BASSE: V3 = [0, 1.25, SZ + 1.3];
export const CADRES_Z = SZ - S_Z + 0.25;
export const CANAPE: V3 = [0, 0, SZ - 3.7];
function salon(b: Bat) {
  const W = S_W;
  const Z = S_Z;
  const H = S_H;
  pieceBase(b, W, Z, H, (b2) => {
    b2.boite([0, 0.04, SZ], [W * 2, 0.08, Z * 2], "#C48A5A");
    for (let i = 0; i < 14; i++) b2.boite([-W + 0.5 + i, 0.09, SZ], [0.04, 0.02, Z * 2], "#8A5A34");
    // tapis à motif losanges turquoise / rose
    for (let i = 0; i < 10; i++) for (let j = 0; j < 7; j++) b2.boite([-4.5 + 0.5 + i, 0.1, SZ - 1.8 + j * 0.9 + 0.4], [1, 0.03, 0.9], (i + j) % 2 ? POP.turq : "#FF8FBA");
  }, "#FFE08A", "#7FE3D8", "#FFF1D6", "#FFFFFF", 0, SZ);
  // mur du fond (z = SZ - Z) : lambris et cadres (les photos sont dessinées par le décor dynamique)
  b.boite([0, H / 2, SZ - Z - 0.15], [W * 2 + 0.6, H, 0.3], "#FFE08A");
  b.boite([0, 0.95, SZ - Z - 0.12], [W * 2, 1.9, 0.34], "#7FE3D8");
  b.boite([0, 1.95, SZ - Z - 0.1], [W * 2, 0.14, 0.4], "#FFFFFF");
  // canapé rose (assise + dossier + accoudoirs)
  const [cx, , cz] = CANAPE;
  b.boite([cx, 0.65, cz], [6.2, 1.3, 2.4], POP.rose);
  b.boite([cx, 1.9, cz - 1.0], [6.2, 2.0, 0.5], "#FF5C9A");
  b.boite([cx - 3.05, 1.2, cz], [0.5, 1.9, 2.4], "#FF5C9A");
  b.boite([cx + 3.05, 1.2, cz], [0.5, 1.9, 2.4], "#FF5C9A");
  for (const dx of [-1.4, 1.4]) b.boite([cx + dx, 1.45, cz + 0.1], [2.5, 0.3, 2.0], "#FF8FBA");
  b.boite([cx - 2.2, 2.0, cz - 0.5], [0.9, 0.9, 0.35], POP.mout, [0.2, 0.3, 0.2]); // coussins
  b.boite([cx + 2.2, 2.0, cz - 0.5], [0.9, 0.9, 0.35], POP.turq, [0.2, -0.3, -0.2]);
  // table basse : plateau crème, pieds fuselés turquoise
  const [tx, ty, tz] = TABLE_BASSE;
  b.boite([tx, ty, tz], [4.6, 0.18, 2.8], "#FFF1D6");
  b.boite([tx, ty + 0.1, tz], [4.7, 0.05, 2.9], "#FFFFFF");
  for (const dx of [-1.9, 1.9]) for (const dz of [-1.0, 1.0]) b.boite([tx + dx, ty / 2, tz + dz], [0.16, ty, 0.16], POP.turq);
  // fauteuil à gauche, console de télévision à droite (écran éteint), lampadaire, étagère
  b.boite([-5.0, 0.8, SZ + 0.6], [2.2, 1.6, 2.2], POP.turq, [0, 0.9, 0]);
  b.boite([-5.5, 1.9, SZ + 0.1], [1.2, 2.2, 2.2], "#1FB8AA", [0, 0.9, 0]);
  b.boite([5.8, 1.0, SZ + 0.2], [1.6, 2.0, 3.4], "#C48A5A");
  b.boite([5.8, 2.6, SZ + 0.2], [1.4, 1.5, 2.2], "#E8EEF2");
  b.boite([5.62, 2.6, SZ + 0.2], [0.12, 1.1, 1.8], "#2A2A34");
  b.cylindre([5.6, 0, SZ - 3.2], 0.12, 5.2, "#E8EEF2", 6);
  b.boite([5.6, 5.1, SZ - 3.2], [1.0, 0.8, 1.0], "#FFF1B8");
  b.boite([-6.4, 2.4, SZ - 2.2], [0.7, 4.8, 3.6], "#C48A5A"); // bibliothèque
  for (let i = 0; i < 4; i++) b.boite([-6.1, 0.9 + i * 1.1, SZ - 2.2], [0.5, 0.1, 3.4], "#8A5A34");
}

// ------------------------------------------------------------------ Constructions mémorisées
const cache = new Map<string, THREE.BufferGeometry>();
/** Géométrie d'un lieu au niveau de décoloration `niv` (0 à 3). */
export function zone(lieu: Lieu, niv: number): THREE.BufferGeometry {
  const cle = `${lieu}|${niv}`;
  let g = cache.get(cle);
  if (!g) {
    const b = new Bat(lieu !== "rue");
    b.g = NIVEAUX[niv] ?? 0;
    if (lieu === "rue") rue(b);
    else if (lieu === "cuisine") cuisine(b);
    else if (lieu === "grenier") grenier(b);
    else salon(b);
    g = b.construire();
    cache.set(cle, g);
  }
  return g;
}
