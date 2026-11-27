/**
 * « Dans cette ville, tout le monde s'appelle Alex… » — décors fixes en blocs (ombrage cuit par face). Cinq lieux éloignés
 * les uns des autres (Decor n'affiche que celui où se trouve la caméra) :
 *   VILLE   (0, 0, 0)       avenue solaire, pavillons identiques turquoise et moutarde, boulangerie, place et mairie
 *   NUIT    (0, 0, 600)     LA MÊME ville, dessinée une seconde fois (teintée de nuit, lampadaires orange)
 *   CLASSE  (-400, 0, 0)    salle de classe : trente pupitres alignés, tableau noir, fenêtres sur le soleil
 *   COUR    (400, 0, 0)     cour de l'école et cantine en plein air (rangées de tables identiques)
 *   SOUS    (0, 0, 1200)    sous-sol de la mairie : palier, escalier, hall glacé de cabines de verre à perte de vue
 */
import * as THREE from "three";
import { Batisseur, versMonde, type V3 } from "../../geo";
import { maisonSimple } from "../../minuit/monde";

export const VILLE: V3 = [0, 0, 0];
export const NUIT: V3 = [0, 0, 600];
export const CLASSE: V3 = [-400, 0, 0];
export const COUR: V3 = [400, 0, 0];
export const SOUS: V3 = [0, 0, 1200];

const add = (o: V3, p: V3): V3 => [o[0] + p[0], o[1] + p[1], o[2] + p[2]];
/** Passe un point local d'un lieu au monde. */
export const N = (p: V3): V3 => add(NUIT, p);
export const CL = (p: V3): V3 => add(CLASSE, p);
export const CO = (p: V3): V3 => add(COUR, p);
export const SS = (p: V3): V3 => add(SOUS, p);

// ------------------------------------------------------------------ Palette (identique d'une scène à l'autre)
export const COUL = {
  mur: "#18C2B3", // turquoise saturé
  toit: "#F0A91C", // jaune moutarde
  moutarde: "#F0A91C",
  jaune: "#FFC61A",
  gazon: ["#58CC4B", "#4DBF44"],
  route: "#7D8699",
  trottoir: "#ECE4CE",
  pierre: "#F1E6C4",
};

// ------------------------------------------------------------------ Ville : avenue, pavillons identiques
export type MaisonDef = { p: V3; ry: number; porteX: number; cote: 1 | -1 };
const ZH = [55, 40, 25, 10, -5, -20, -35, -50, -65];
export const BOULANGERIE_Z = 25;
export const MAISONS: MaisonDef[] = [
  ...ZH.map((z): MaisonDef => ({ p: [-19.5, 0, z], ry: Math.PI / 2, porteX: -2.2, cote: 1 })),
  ...ZH.filter((z) => z !== BOULANGERIE_Z).map((z): MaisonDef => ({ p: [19.5, 0, z], ry: -Math.PI / 2, porteX: 2.2, cote: -1 })),
];
/** Fenêtres des pavillons (repère local) : x, largeur — pour les faire briller la nuit. */
export const FENETRE_X = (md: MaisonDef) => -md.porteX * 0.7;
export const LAMPES: V3[] = [];
for (let z = 58; z > -80; z -= 21) {
  LAMPES.push([-9.6, 0, z], [9.6, 0, z - 10.5]);
}
export const MAIRIE_Z = -134;
LAMPES.push([-20, 0, -92], [20, 0, -100], [-20, 0, -110], [20, 0, -118]);
export const PLACE = { cx: 0, cz: -100, pas: 3.0 };
/** Case (i, j) du carré de 12 × 12 de la place (cent quarante-quatre Alex). */
export const caseFormation = (i: number, j: number): V3 => [PLACE.cx + (i - 5.5) * PLACE.pas, 0, PLACE.cz + (j - 5.5) * PLACE.pas];
export const SIGNE = { p: [0, 12.4, MAIRIE_Z + 6.58] as V3, w: 15, h: 4.4 };
export const PORTE_MAIRIE: V3 = [0, 0, MAIRIE_Z + 8.2];
export const BOUL = { x: 19.5, z: BOULANGERIE_Z };

function arbreCube(b: Batisseur, x: number, z: number, s: number, c1 = "#33B84A", c2 = "#47CC5C") {
  b.boite([x, 0.9 * s, z], [0.55 * s, 1.8 * s, 0.55 * s], "#8A5A36");
  b.boite([x, 2.9 * s, z], [2.3 * s, 2.3 * s, 2.3 * s], c1);
  b.boite([x + 0.2 * s, 4.3 * s, z - 0.1 * s], [1.4 * s, 1.2 * s, 1.4 * s], c2);
}
function haie(b: Batisseur, x: number, z: number, l: number, h = 1.0) {
  b.boite([x, h / 2, z], [0.9, h, l], "#2AAE48");
  b.boite([x, h + 0.05, z], [0.7, 0.12, l - 0.2], "#3CC95C");
}
function ombreSol(b: Batisseur, x: number, z: number, sx: number, sz: number, c = "#2F9A3E") {
  b.boite([x, 0.045, z], [sx, 0.03, sz], c);
}

function lampadaire(b: Batisseur, p: V3) {
  const s = p[0] < 0 ? 1 : -1;
  b.boite([p[0], 0.25, p[2]], [0.6, 0.5, 0.6], "#2B3A4A");
  b.cylindre([p[0], 0.4, p[2]], 0.13, 5.7, "#33475C", 8);
  b.boite([p[0] + s * 0.7, 6.05, p[2]], [1.6, 0.16, 0.2], "#33475C");
  b.boite([p[0] + s * 1.35, 5.85, p[2]], [0.7, 0.22, 0.45], "#2B3A4A");
  b.boite([p[0] + s * 1.35, 5.66, p[2]], [0.5, 0.1, 0.32], "#FFF3C4");
}

function boulangerie(b: Batisseur) {
  // façade tournée vers -x, à droite de l'avenue
  b.dans([BOUL.x, 0, BOUL.z], -Math.PI / 2, () => {
    const w = 11.5;
    const d = 8.5;
    const h = 5.0;
    b.boite([0, 0.15, -d / 2], [w + 0.3, 0.3, d + 0.3], "#E9E4D6");
    b.boite([0, h / 2 + 0.15, -d / 2], [w, h - 0.3, d], COUL.mur);
    b.pignon([0, h, -d / 2], w, 2.4, d, COUL.mur);
    for (const s of [-1, 1]) b.boite([s * (w / 4 + 0.3), h + 1.15, -d / 2], [w / 2 + 1.4, 0.3, d + 1.1], COUL.toit, [0, 0, -s * 0.38]);
    // grande vitrine et porte (la porte est à x = +3.4 : côté de la sortie)
    b.boite([-1.6, 2.3, 0.02], [5.6, 2.6, 0.1], "#BFE4F5");
    b.boite([-1.6, 3.7, 0.04], [5.9, 0.16, 0.16], "#FFFFFF");
    b.boite([-1.6, 0.95, 0.04], [5.9, 0.16, 0.16], "#FFFFFF");
    b.boite([-4.5, 2.3, 0.04], [0.16, 2.9, 0.16], "#FFFFFF");
    b.boite([1.3, 2.3, 0.04], [0.16, 2.9, 0.16], "#FFFFFF");
    b.boite([3.4, 1.7, 0.06], [1.7, 3.1, 0.14], COUL.toit);
    b.boite([3.4, 1.9, 0.14], [1.1, 1.4, 0.04], "#BFE4F5");
    // étal : baguettes et pains dans la vitrine
    b.boite([-1.6, 1.15, -0.5], [5.2, 0.2, 1.4], "#8A5A36");
    for (let i = 0; i < 7; i++) b.boite([-3.7 + i * 0.7, 1.45, -0.5], [0.34, 0.34, 1.0], "#D99A4A", [0, 0, 0.2 * (i % 3 - 1)]);
    // auvent rayé moutarde / blanc
    for (let i = 0; i < 12; i++) b.boite([-5.5 + (i + 0.5) * (11 / 12), 4.05, 1.0], [11 / 12, 0.16, 2.2], i % 2 ? "#FFFFFF" : COUL.toit, [0.28, 0, 0]);
    b.boite([0, 2.35, 3.6], [8, 0.02, 0.02], COUL.mur); // (repère invisible)
    b.boite([0, 0.07, 3.2], [9, 0.14, 6.4], "#F2EBD7");
  });
}

function mairie(b: Batisseur) {
  b.dans([0, 0, MAIRIE_Z], 0, () => {
    const pierre = COUL.pierre;
    // corps du bâtiment, ailes, socle
    b.boite([0, 7.0, -9], [44, 14, 18], pierre);
    b.boite([0, 0.5, 0.5], [46, 1.0, 3], "#E7DDBA");
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const x = s * (9.5 + k * 4.8);
        b.boite([x, 3.4, 0.04], [2.4, 3.0, 0.14], "#2E7FA8");
        b.boite([x, 3.4, 0.1], [2.8, 0.16, 0.16], "#FFFFFF");
        b.boite([x, 8.6, 0.04], [2.4, 3.0, 0.14], "#2E7FA8");
        b.boite([x, 8.6, 0.1], [2.8, 0.16, 0.16], "#FFFFFF");
      }
    }
    // portique : dalle haute (porte le panneau à diodes), colonnes, escalier
    b.boite([0, 12.4, 3.4], [26, 5.2, 6.2], pierre);
    b.boite([0, 15.3, 3.4], [27, 0.7, 6.8], "#E7DDBA");
    b.pignon([0, 15.65, 3.4], 27.6, 3.2, 6.6, COUL.toit);
    for (let i = 0; i < 8; i++) {
      const x = -10.5 + i * 3;
      b.boite([x, 4.9, 5.4], [1.1, 9.8, 1.1], "#FFFFFF");
      b.boite([x, 0.25, 5.4], [1.5, 0.5, 1.5], "#E7DDBA");
      b.boite([x, 9.9, 5.4], [1.5, 0.4, 1.5], "#E7DDBA");
    }
    for (let i = 0; i < 4; i++) b.boite([0, 0.2 + i * 0.4, 7.2 - i * 0.9 + 0.8], [20, 0.4, 1.6], i % 2 ? "#F3EAD0" : "#E7DDBA");
    // double porte turquoise (au fond du portique)
    b.boite([0, 3.1, 0.2], [5.6, 6.2, 0.3], COUL.mur);
    b.boite([0, 3.1, 0.38], [0.14, 6.2, 0.1], "#0E9488");
    b.boite([-1.3, 3.3, 0.4], [0.3, 0.3, 0.12], "#F0A91C");
    b.boite([1.3, 3.3, 0.4], [0.3, 0.3, 0.12], "#F0A91C");
    b.boite([0, 6.5, 0.2], [6.6, 0.5, 0.5], "#FFFFFF");
    // tour de l'horloge
    b.boite([0, 20.5, -7], [7, 10, 7], pierre);
    b.boite([0, 25.8, -7], [8, 0.8, 8], "#E7DDBA");
    b.cone([0, 26.2, -7], 5.9, 7.5, COUL.toit, 4, Math.PI / 4);
    b.boite([0, 21.5, -3.45], [4.2, 4.2, 0.2], "#FFFFFF");
    b.boite([0, 21.5, -3.3], [3.6, 3.6, 0.14], "#F7F2E4");
    b.boite([0, 21.6, -3.2], [0.18, 1.5, 0.1], "#18202A");
    b.boite([0.55, 21.5, -3.2], [1.1, 0.18, 0.1], "#18202A");
    // mâts et drapeaux tricolores
    for (const s of [-1, 1]) {
      const x = s * 18.5;
      b.cylindre([x, 0.5, 6.5], 0.12, 11, "#B9C2CC", 8);
      b.boite([x + s * 0, 11.5, 6.5], [0.3, 0.3, 0.3], "#F0A91C");
      for (const [i, c] of [[0, "#2442C8"], [1, "#FFFFFF"], [2, "#E03232"]] as Array<[number, string]>) b.boite([x - s * (0.35 + i * 0.7), 9.4, 6.5], [0.7, 2.4, 0.08], c);
    }
  });
}

function place(b: Batisseur) {
  // la place dallée, où les cent quarante-quatre se rangent chaque matin
  b.boite([0, 0.03, -104], [64, 0.1, 58], "#F0E8D2");
  b.boite([0, 0.03, -104], [60, 0.12, 54], "#F7F0DC");
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      const [x, , z] = caseFormation(i, j);
      b.boite([x, 0.1, z], [2.5, 0.04, 2.5], (i + j) % 2 ? "#B8ECE6" : "#9DE2DB");
    }
  }
}

function ville(b: Batisseur) {
  // sol : pelouse géante, route, trottoirs
  b.boite([0, -0.5, -40], [520, 1, 520], "#4FBF4A");
  b.boite([0, 0.0, -40], [18, 0.12, 280], COUL.route);
  for (const s of [-1, 1]) {
    b.boite([s * 9.3, 0.1, -40], [0.7, 0.2, 280], "#F7F7F2");
    b.boite([s * 11.6, 0.07, -40], [3.8, 0.14, 280], COUL.trottoir);
    b.boite([s * 13.7, 0.12, -40], [0.4, 0.22, 280], "#F7F7F2");
  }
  for (let z = 60; z > -78; z -= 7) b.boite([0, 0.1, z], [0.4, 0.04, 3.6], "#FFD23F");
  // bandes d'herbe tondue, avec leur ombre portée courte
  for (let z = 62; z > -76; z -= 5) {
    for (const s of [-1, 1]) b.boite([s * 16.6, 0.04, z - 2.5], [5.9, 0.04, 5], COUL.gazon[(Math.round(z / 5) + (s > 0 ? 1 : 0)) % 2 === 0 ? 0 : 1]);
  }
  // pavillons identiques
  for (const md of MAISONS) {
    b.dans(md.p, md.ry, () => {
      maisonSimple(b, { w: 9, d: 7.5, h: 4.4, mur: COUL.mur, toit: COUL.toit, porteX: md.porteX, porteC: COUL.moutarde, fen: [{ x: FENETRE_X(md), w: 2.2 }], volets: COUL.moutarde, cheminee: -md.porteX });
      b.boite([md.porteX, 0.1, 4.3], [1.6, 0.14, 5.4], "#F2EBD7"); // allée
      for (const s of [-1, 1]) b.boite([md.porteX + s * 1.25, 0.4, 4.3], [0.8, 0.8, 5.0], "#2AAE48");
    });
    // l'ombre dure de midi, courte, sur la pelouse : côté -z de chaque pavillon
    ombreSol(b, md.p[0] + md.cote * 2.0, md.p[2] - 5.6 + 0, 7, 1.4);
  }
  boulangerie(b);
  ombreSol(b, BOUL.x - 2.5, BOUL.z - 6.6, 7, 1.6);
  // arbres en cubes, une rangée au cordeau devant chaque côté, et haies
  for (const z of [62, 47, 32, 17, 2, -13, -28, -43, -58, -73]) {
    for (const s of [-1, 1]) {
      arbreCube(b, s * 14.6, z - 0.1, 0.62);
      ombreSol(b, s * 14.6 + 0.6, z - 1.4, 1.8, 1.4);
    }
  }
  for (const s of [-1, 1]) for (let z = 58; z > -76; z -= 15) haie(b, s * 13.9, z - 7.5, 6);
  for (const p of LAMPES) lampadaire(b, p);
  // portique « Bienvenue » au-dessus de l'avenue
  for (const s of [-1, 1]) {
    b.boite([s * 10.2, 4.4, 22], [0.7, 8.8, 0.7], "#33475C");
    b.boite([s * 10.2, 0.2, 22], [1.4, 0.4, 1.4], "#33475C");
  }
  b.boite([0, 9.2, 22], [21.4, 0.8, 0.7], "#33475C");
  place(b);
  mairie(b);
  // collines pâles à l'horizon
  for (const [x, z, r, h] of [[-120, -230, 90, 34], [60, -250, 110, 46], [160, -190, 70, 26], [-220, -150, 80, 30], [240, -60, 90, 30], [-250, 20, 80, 26], [250, 90, 80, 30]] as Array<[number, number, number, number]>) b.cone([x, -0.2, z], r, h, "#6FC48A", 7, x);
}

// ------------------------------------------------------------------ Salle de classe
export const CLASSE_DIM = { W: 6, D: 7, H: 4.8 };
export const COLS = [-3.9, -2.34, -0.78, 0.78, 2.34, 3.9];
export const RANGS = [-3.4, -1.65, 0.1, 1.85, 3.6];
/** Les trente sièges (x, z locaux), rangée par rangée ; l'élève k regarde vers -z (le tableau). */
export const SIEGES: Array<[number, number]> = RANGS.flatMap((z) => COLS.map((x): [number, number] => [x, z]));
export const SIEGE_NOE = 4 * 6 + 4; // dernière rangée, côté fenêtres : personne derrière lui
export const SIEGE_VOISIN = 4 * 6 + 5; // juste à côté, contre l'allée des fenêtres
export const TABLEAU = { p: [0, 2.8, -CLASSE_DIM.D + 0.22] as V3, w: 7.2, h: 3.15 };

function classe(b: Batisseur) {
  const { W, D, H } = CLASSE_DIM;
  b.dans(CLASSE, 0, () => {
    b.boite([0, 0.05, 0], [W * 2, 0.1, D * 2], "#D9AA62");
    for (let i = -3; i <= 3; i++) b.boite([i * 1.5, 0.11, 0], [0.05, 0.02, D * 2], "#B88A4C");
    b.boite([0, H + 0.1, 0], [W * 2 + 0.6, 0.2, D * 2 + 0.6], "#F4F1E6");
    for (let z = -5; z <= 5; z += 3.3) b.boite([0, H - 0.02, z], [3.2, 0.06, 1.0], "#FFFFFF", undefined, 1.6);
    const mur = "#F8E7A6";
    b.boite([-W - 0.15, H / 2, 0], [0.3, H, D * 2 + 0.6], mur);
    b.boite([W + 0.15, H / 2, 0], [0.3, H, D * 2 + 0.6], mur);
    b.boite([0, H / 2, D + 0.15], [W * 2 + 0.6, H, 0.3], mur);
    b.boite([0, H / 2, -D - 0.15], [W * 2 + 0.6, H, 0.3], mur);
    // soubassement turquoise
    for (const [x, z, sx, sz] of [[-W + 0.01, 0, 0.05, D * 2], [W - 0.01, 0, 0.05, D * 2], [0, D - 0.01, W * 2, 0.05], [0, -D + 0.01, W * 2, 0.05]] as Array<[number, number, number, number]>) b.boite([x, 0.55, z], [sx, 1.1, sz], COUL.mur);
    // fenêtres sur le côté droit : plein soleil
    for (const z of [-4.2, 0, 4.2]) {
      b.boite([W - 0.02, 2.9, z], [0.06, 2.1, 2.7], "#CFEBFF", undefined, 1.8);
      b.boite([W - 0.06, 2.9, z], [0.1, 2.3, 0.14], "#FFFFFF");
      b.boite([W - 0.06, 3.95, z], [0.1, 0.14, 2.9], "#FFFFFF");
      b.boite([W - 0.06, 1.85, z], [0.1, 0.14, 2.9], "#FFFFFF");
      b.boite([W - 0.06, 2.9, z - 1.4], [0.1, 2.3, 0.14], "#FFFFFF");
      b.boite([W - 0.06, 2.9, z + 1.4], [0.1, 2.3, 0.14], "#FFFFFF");
      // tache de soleil au sol (parallélogramme étiré)
      b.quad([W - 0.2, 0.12, z - 1.2], [W - 0.2, 0.12, z + 1.2], [W - 4.4, 0.12, z + 2.8], [W - 4.4, 0.12, z + 0.4], "#FFF1B8", 1.35);
    }
    // tableau noir (cadre), estrade et bureau du professeur
    b.boite([0, 2.8, -D + 0.1], [TABLEAU.w + 0.5, TABLEAU.h + 0.4, 0.14], "#7A5232");
    b.boite([0, 0.12, -D + 1.0], [9, 0.24, 2.0], "#C99358");
    b.boite([-3.4, 1.1, -D + 1.4], [2.6, 0.12, 1.1], "#9A6A3E");
    b.boite([-3.4, 0.55, -D + 1.4], [2.4, 1.1, 0.9], "#7C5230");
    // porte du fond, horloge, affiches identiques
    b.boite([-4.2, 2.0, D - 0.03], [1.8, 4.0, 0.1], COUL.mur);
    b.boite([-4.2, 2.0, D - 0.1], [1.9, 4.1, 0.06], "#FFFFFF");
    b.boite([4.3, 3.9, D - 0.05], [1.1, 1.1, 0.1], "#FFFFFF");
    b.boite([4.3, 3.9, D - 0.1], [0.9, 0.9, 0.06], "#F7F2E4");
    for (let i = 0; i < 4; i++) b.boite([-W + 0.08, 2.4 + (i % 2) * 1.1, -4.6 + i * 2.6], [0.06, 0.9, 0.7], i % 2 ? COUL.toit : "#FFFFFF");
    // pupitres et chaises, au cordeau
    for (const [x, z] of SIEGES) {
      b.boite([x, 1.16, z - 0.62], [1.16, 0.08, 0.84], "#F0C26A");
      b.boite([x, 1.12, z - 0.62], [1.2, 0.04, 0.88], COUL.mur);
      for (const dx of [-0.5, 0.5]) for (const dz of [-0.9, -0.3]) b.boite([x + dx, 0.58, z + dz], [0.06, 1.16, 0.06], "#9AA5B4");
      b.boite([x, 0.74, z + 0.02], [0.9, 0.08, 0.78], COUL.mur);
      b.boite([x, 1.18, z + 0.46], [0.9, 0.78, 0.08], COUL.mur);
    }
  });
}

// ------------------------------------------------------------------ Cour et cantine en plein air
export const TABLES_COUR = [-2.5, -7.5, -12.5];
function cour(b: Batisseur) {
  b.dans(COUR, 0, () => {
    b.boite([0, -0.5, -10], [220, 1, 220], "#4FBF4A");
    b.boite([0, 0.04, -4], [64, 0.1, 40], "#EBDDB0");
    for (let i = -7; i <= 7; i++) b.boite([i * 4, 0.1, -4], [0.12, 0.02, 40], "#D2C08A");
    for (let k = -4; k <= 4; k++) b.boite([0, 0.1, -4 + k * 4.4], [64, 0.02, 0.12], "#D2C08A");
    // l'école, derrière : même turquoise, même moutarde
    b.boite([0, 5, -26], [46, 10, 8], COUL.mur);
    b.boite([0, 10.4, -26], [48, 0.8, 9], COUL.toit);
    for (let i = 0; i < 9; i++) {
      const x = -19 + i * 4.75;
      b.boite([x, 5.6, -21.9], [2.2, 2.5, 0.14], "#CFEBFF", undefined, 1.4);
      b.boite([x, 5.6, -21.8], [2.5, 0.12, 0.12], "#FFFFFF");
      b.boite([x, 2.2, -21.9], [1.5, 2.2, 0.14], COUL.toit);
    }
    b.boite([0, 7.9, -21.8], [8, 1.5, 0.14], "#FFFFFF");
    // tables de cantine : trois rangées identiques ; seule la table de Noé est à l'écart
    for (const z of TABLES_COUR) {
      for (const x of [-9.5, 9.5]) {
        b.boite([x, 1.25, z], [14, 0.14, 1.9], "#F0C26A");
        b.boite([x, 1.18, z], [14.1, 0.06, 2.0], COUL.mur);
        for (const s of [-1, 1]) {
          b.boite([x, 0.74, z + s * 1.55], [14, 0.12, 0.7], "#F0C26A");
          for (const dx of [-6.5, 0, 6.5]) b.boite([x + dx, 0.37, z + s * 1.55], [0.14, 0.74, 0.14], "#9AA5B4");
        }
      }
    }
    // la table solitaire de Noé
    b.boite([-14.5, 1.25, 5.6], [3.0, 0.14, 1.9], "#F0C26A");
    b.boite([-14.5, 0.62, 5.6], [0.18, 1.24, 0.18], "#9AA5B4");
    b.boite([-14.5, 0.74, 7.2], [3.0, 0.12, 0.7], "#F0C26A");
    for (const dx of [-1.1, 1.1]) b.boite([-14.5 + dx, 0.37, 7.2], [0.14, 0.74, 0.14], "#9AA5B4");
    // arbres au cordeau, clôture
    for (let i = -6; i <= 6; i += 2) arbreCube(b, i * 5, 16, 0.7);
    for (let i = -7; i <= 7; i++) b.boite([i * 4, 0.55, 17.6], [0.3, 1.1, 0.3], "#FFFFFF");
    b.boite([0, 0.9, 17.6], [60, 0.14, 0.14], "#FFFFFF");
    for (const [x, z, r, h] of [[-90, -90, 60, 24], [80, -100, 70, 30]] as Array<[number, number, number, number]>) b.cone([x, -0.2, z], r, h, "#6FC48A", 7, x);
  });
}

// ------------------------------------------------------------------ Sous-sol : palier, escalier, hall glacé
export const HALL = { demi: 7.5, aisle: 3.0, devant: 3.2, cabX: 4.9, pas: 4.4, n: 20, z0: -6, hauteur: 8.6, fond: -112 };
export const BOUT: V3 = [0, 0, -104]; // la dernière cabine, marquée « Noé »
export type CabineDef = { p: V3; ry: number; k: number };
/** Cabines (repère local du hall) : rangée gauche (k pair) face à +x, rangée droite (k impair) face à -x. */
export const CABINES: CabineDef[] = [];
for (let i = 0; i < HALL.n; i++) {
  const z = HALL.z0 - i * HALL.pas;
  CABINES.push({ p: [-HALL.devant, 0, z], ry: Math.PI / 2, k: 2 * i });
  CABINES.push({ p: [HALL.devant, 0, z], ry: -Math.PI / 2, k: 2 * i + 1 });
}
/** Position (hall, local) de l'occupant d'une cabine : au milieu, 1,7 derrière la vitre. */
export const occupant = (c: CabineDef): V3 => {
  const p = versMonde(c.p, c.ry, [0, 0, -1.7]);
  return [p[0], 0.5, p[2]];
};
/** Indices (dans CABINES) du voisin endormi et de son sosie (cabines voisines, rangée gauche). */
export const CAB_VOISIN = 2 * 6; // z = -6 - 6*4.4 = -32.4
export const CAB_SOSIE = 2 * 7; // z = -36.8
export const palierZ = 22.5;

function sousSol(b: Batisseur, verre: Batisseur) {
  const { demi, hauteur } = HALL;
  b.dans(SOUS, 0, () => {
    // sol blanc-bleuté, carreaux, ligne cyan au centre
    b.boite([0, -0.05, -45], [demi * 2, 0.1, 160], "#A9CBD5");
    for (let z = 20; z > -112; z -= 4) b.boite([0, 0.01, z], [demi * 2, 0.02, 0.07], "#6F98A6");
    b.boite([0, 0.03, -45], [0.35, 0.03, 160], "#4FD0E4", undefined, 1.7);
    for (const s of [-1, 1]) b.boite([s * 3.1, 0.03, -45], [0.12, 0.03, 160], "#4FD0E4", undefined, 1.5);
    // murs, plafond, bandes de néon
    b.boite([0, hauteur + 0.15, -45], [demi * 2 + 0.6, 0.3, 160], "#7FA9B6");
    for (const s of [-1, 1]) {
      b.boite([s * (demi + 0.15), hauteur / 2, -45], [0.3, hauteur, 160], "#4F8FA6");
      b.boite([s * (demi - 0.05), 2.4, -45], [0.1, 0.3, 160], "#7FEFFF", undefined, 2.0);
      b.boite([s * (demi - 0.05), 5.2, -45], [0.1, 0.18, 160], "#7FEFFF", undefined, 1.6);
      b.boite([s * (demi - 0.2), 1.0, -45], [0.2, 2.0, 160], "#2F6F86");
    }
    for (let z = 6; z > -112; z -= 8) {
      for (const x of [-3.6, 3.6]) b.boite([x, hauteur - 0.2, z], [0.5, 0.12, 4.6], "#FFFFFF", undefined, 2.4);
      b.boite([0, hauteur - 0.05, z], [14, 0.1, 0.18], "#B8D8E0");
    }
    // mur du fond, avec sa niche pour la dernière cabine
    b.boite([0, hauteur / 2, HALL.fond], [demi * 2 + 0.6, hauteur, 0.6], "#3F7D94");
    b.boite([0, 0.15, BOUT[2] + 0.2], [8.4, 0.3, 8.4], "#C9E3EA");
    b.boite([0, 0.4, BOUT[2] + 0.2], [7.2, 0.3, 7.2], "#EAF7FA");
    b.boite([0, 4.5, HALL.fond + 0.35], [6.4, 7.6, 0.1], "#E8C766", undefined, 1.1);

    // palier et escalier
    b.boite([0, 3.45, 17.4], [demi * 2, 0.3, 10], "#C3DDE5");
    b.boite([0, 1.7, 17.4], [demi * 2 - 0.4, 3.4, 9.8], "#7FA9B6");
    for (let i = 0; i < 8; i++) {
      const y = 3.6 - 0.45 * (i + 1);
      b.boite([0, y / 2, 11.5 - i], [5.6, Math.max(0.1, y), 1.0], i % 2 ? "#EAF7FA" : "#C8E2EA");
      if (y > 0.2) b.boite([0, y + 0.02, 11.0 - i], [5.6, 0.04, 0.1], "#7FEFFF", undefined, 1.5);
    }
    for (const s of [-1, 1]) {
      b.boite([s * 2.95, 3.0, 8.0], [0.2, 0.14, 9.6], "#B5C8D0", [0.38, 0, 0]);
      b.boite([s * 2.95, 1.5, 8.0], [0.16, 3.0, 0.16], "#B5C8D0");
    }
    // mur du palier : porte d'entrée (le maire arrive de la rue)
    b.boite([-4.4, 6.1, palierZ], [6.4, 5.4, 0.5], "#4F8FA6");
    b.boite([4.4, 6.1, palierZ], [6.4, 5.4, 0.5], "#4F8FA6");
    b.boite([0, 7.7, palierZ], [2.4, 2.2, 0.5], "#4F8FA6");
    b.boite([0, 5.1, palierZ + 0.4], [2.4, 3.0, 0.1], "#FFB44A", undefined, 1.25); // la rue éclairée par les lampadaires, dehors

    // cabines : socle, montants, cadre supérieur, fond lumineux ; les vitres vont dans la géométrie translucide
    const cabine = (c: CabineDef, special = false) => {
      b.dans(c.p, c.ry, () => {
        // repère local : +z = devant (côté allée), x = largeur
        b.boite([0, 0.2, -1.7], [3.6, 0.4, 3.6], "#B7D0D8");
        b.boite([0, 0.45, -1.7], [3.4, 0.1, 3.2], "#BFE6EE");
        b.boite([0, 3.9, -1.7], [3.6, 0.32, 3.6], "#B7D0D8");
        for (const sx of [-1, 1]) for (const sz of [0, -3.4]) b.boite([sx * 1.62, 2.1, sz + 0.0 - 0.1], [0.16, 3.5, 0.16], "#8FB2BE");
        b.boite([0, 2.2, -3.5], [3.2, 3.2, 0.14], special ? "#FFE9A6" : "#5FE4FF", undefined, special ? 1.5 : 1.5); // fond lumineux
        b.boite([0, 4.5, 0.0], [3.0, 0.8, 0.14], "#0E2A36");
        b.boite([1.1, 3.98, 0.1], [0.3, 0.12, 0.1], special ? "#FFC21A" : "#5CFFB0", undefined, 2);
      });
      const v = (p: V3, s: V3) => verre.boite(p, s, "#CDF4FF");
      verre.dans(c.p, c.ry, () => {
        v([0, 2.2, 0.02], [3.4, 3.3, 0.05]);
        v([-1.7, 2.2, -1.7], [0.05, 3.3, 3.3]);
        v([1.7, 2.2, -1.7], [0.05, 3.3, 3.3]);
      });
    };
    CABINES.forEach((c) => b.dans([0, 0, 0], 0, () => cabine(c)));
    // La dernière cabine, face au hall
    b.dans([0, 0, 0], 0, () => {
      b.dans([BOUT[0], 0, BOUT[2] + 2.0], 0, () => {
        b.boite([0, 0.2, -1.7], [3.8, 0.4, 3.8], "#F4FBFD");
        b.boite([0, 3.9, -1.7], [3.8, 0.32, 3.8], "#F4FBFD");
        for (const sx of [-1, 1]) for (const sz of [0, -3.4]) b.boite([sx * 1.72, 2.1, sz - 0.1], [0.16, 3.5, 0.16], "#C0D2D8");
        b.boite([0, 2.2, -3.5], [3.4, 3.2, 0.14], "#F2D98A", undefined, 1.15);
        b.boite([0, 4.5, 0.0], [3.2, 0.8, 0.14], "#0A0704");
      });
    });
    verre.dans([BOUT[0], 0, BOUT[2] + 2.0], 0, () => {
      verre.boite([0, 2.2, 0.02], [3.6, 3.3, 0.05], "#CDF4FF");
      verre.boite([-1.8, 2.2, -1.7], [0.05, 3.3, 3.3], "#CDF4FF");
      verre.boite([1.8, 2.2, -1.7], [0.05, 3.3, 3.3], "#CDF4FF");
    });
  });
}

// ------------------------------------------------------------------ Assemblage
export type Zones = { ville: THREE.BufferGeometry; classe: THREE.BufferGeometry; cour: THREE.BufferGeometry; sous: THREE.BufferGeometry; verre: THREE.BufferGeometry };
export function construirePrenomunique(): Zones {
  const v = new Batisseur(false);
  ville(v);
  const c = new Batisseur(true);
  classe(c);
  const q = new Batisseur(false);
  cour(q);
  const s = new Batisseur(true);
  const verre = new Batisseur(true);
  sousSol(s, verre);
  return { ville: v.construire(), classe: c.construire(), cour: q.construire(), sous: s.construire(), verre: verre.construire() };
}
void versMonde;
