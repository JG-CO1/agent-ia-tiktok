/**
 * Géométrie fixe de la ville « In This Town » : style capture de jeu en blocs (aplats saturés, ombrage cuit par face,
 * aucune lumière réelle). Quatre zones fusionnées, teintées séparément par le décor :
 *  - ext     : rue, maisons, arbres, collines, lampadaires (teinte de nuit)
 *  - terrain : terrain de basket bleu et orange, paniers, clôture, projecteurs (éclairé)
 *  - fete    : maison de fête, guirlandes, banderoles, enceintes, ballons, piste de danse (éclairée de couleurs)
 *  - etoiles : voûte étoilée
 */
import * as THREE from "three";
import { Batisseur, type V3 } from "../geo";
import { K, arbre, buisson, etoiles, fenetrePleine, lampadaire, porte, sapin, toitPignon, maisonSimple, voiture } from "../minuit/monde";
import { FENETRES_FETE, FETE, GUIRLANDES, H_PANIER, H_PROJECTEUR, LAMPADAIRES, MAISONS, PANIER_A, PANIER_B, POTEAUX_FETE, PROJECTEURS, RUE, TERRAIN, TERRAIN_BORDS, ENCEINTES, guirlande } from "./lieux";

const BLEU = "#1689E8";
const ORANGE = "#F49A32";
const BLANC = "#F4F4F4";
const HERBE = "#55B94D";
const ROUTE = "#777777";

function rue(b: Batisseur) {
  const z0 = RUE.zDebut;
  const z1 = RUE.zFin;
  const L = z0 - z1;
  const zc = (z0 + z1) / 2;
  b.boite([0, -0.07, zc], [RUE.demiLargeur * 2, 0.2, L], ROUTE);
  for (const s of [-1, 1]) {
    b.boite([s * 4.15, 0.07, zc], [1.3, 0.14, L], K.trottoir);
    b.boite([s * 3.54, 0.07, zc], [0.1, 0.15, L], K.bordure, undefined, 1.15);
  }
  for (let z = z0 - 2; z > z1 + 2; z -= 3.6) b.boite([0, 0.04, z], [0.22, 0.02, 1.7], K.ligne);
}

function maisons(b: Batisseur) {
  for (const m of MAISONS) {
    b.dans(m.p, m.ry, () => {
      maisonSimple(b, { w: m.w, d: m.d, h: m.h, mur: m.mur, toit: m.toit, porteX: m.porteX, porteC: m.porteC, fen: m.fen, volets: m.volets, cheminee: m.cheminee });
      if (Math.abs(m.p[0]) < 12) b.boite([m.porteX, 0.05, 3.3], [1.4, 0.08, 4.8], "#9C9C9C");
      buisson(b, [-m.porteX * 1.7, 0, 0.8], 0.8);
    });
  }
  // deux voitures garées
  voiture(b, [RUE.trottoirD - 0.2 + 1.6, 0.03, 20], 0, "#D0453C");
  voiture(b, [RUE.trottoirG + 0.2 - 1.6, 0.03, -33], Math.PI, "#3D7BD9");
}

function vegetation(b: Batisseur) {
  const arbres: Array<[number, number, number]> = [
    [-6.4, 28, 1.0], [6.6, 22, 1.1], [-24, 30, 1.0], [-26, -16, 1.15], [18, 6, 1.1], [17, -30, 1.0], [-18, -34, 1.2], [-24, 20, 1.0],
    [16, 38, 1.0], [-18, 44, 1.1], [18, -8, 1.0], [11.5, -47, 1.0], [-11.5, -50, 1.0], [-40, 6, 1.1], [30, 12, 1.1], [32, -24, 1.0],
  ];
  arbres.forEach(([x, z, s], i) => (i % 4 === 3 ? sapin(b, x, z, s * 1.25) : arbre(b, x, z, s, i * 0.7)));
  for (const [x, z] of [[-40, -30], [36, -36], [-46, 20], [44, 22], [-30, -60], [28, -62], [0, -120], [-52, -80], [50, -84]] as Array<[number, number]>) sapin(b, x, z, 1.7);
  // collines géométriques (bords de la carte)
  const collines: Array<[number, number, number, number, string]> = [
    [-90, -120, 56, 24, K.colline], [-20, -150, 70, 30, K.colline2], [70, -140, 62, 26, K.colline], [130, -110, 52, 22, K.colline2],
    [-150, -70, 56, 24, K.colline2], [-140, 30, 50, 20, K.colline], [140, 20, 48, 20, K.colline], [-120, 110, 56, 24, K.colline2], [110, 120, 54, 22, K.colline],
  ];
  collines.forEach(([x, z, r, h, c], i) => b.cone([x, -0.2, z], r, h, c, 7, i * 0.5));
}

export function lampadairesGeo(b: Batisseur) {
  for (const l of LAMPADAIRES) lampadaire(b, l.p, l.ry);
}

// ------------------------------------------------------------------ Terrain
function terrain(b: Batisseur) {
  const { cx, cz, w, l } = TERRAIN;
  const bd = TERRAIN_BORDS;
  // sol : bordure orange, surface de jeu bleue
  b.boite([cx, 0.02, cz], [w, 0.04, l], ORANGE);
  b.boite([cx, 0.045, cz], [w - 2.4, 0.03, l - 2.4], BLEU);
  // zones (raquettes) orange, cercle central, lignes blanches
  const y = 0.065;
  const lg = 0.13;
  const x0 = cx - (w - 2.4) / 2;
  const x1 = cx + (w - 2.4) / 2;
  const z0 = cz - (l - 2.4) / 2;
  const z1 = cz + (l - 2.4) / 2;
  for (const s of [-1, 1]) {
    const zc = s < 0 ? z0 + 3.0 : z1 - 3.0;
    b.boite([cx, y, zc], [5.0, 0.02, 6.0], ORANGE);
    b.boite([cx, y + 0.012, zc], [4.7, 0.02, 5.7], "#F8AE55");
    const zl = s < 0 ? z0 + 6.0 : z1 - 6.0;
    b.boite([cx, y + 0.02, zl], [5.0, 0.02, lg], BLANC);
    for (const sx of [-1, 1]) b.boite([cx + sx * 2.5, y + 0.02, zc], [lg, 0.02, 6.0], BLANC);
    b.disque([cx, y + 0.02, zl - s * 1.9], 1.9, BLANC, 28);
    b.disque([cx, y + 0.03, zl - s * 1.9], 1.72, "#F8AE55", 28);
  }
  b.boite([cx, y + 0.02, z0], [x1 - x0, 0.02, lg], BLANC);
  b.boite([cx, y + 0.02, z1], [x1 - x0, 0.02, lg], BLANC);
  b.boite([x0, y + 0.02, cz], [lg, 0.02, z1 - z0], BLANC);
  b.boite([x1, y + 0.02, cz], [lg, 0.02, z1 - z0], BLANC);
  b.boite([cx, y + 0.02, cz], [x1 - x0, 0.02, lg], BLANC);
  b.disque([cx, y + 0.02, cz], 2.1, BLANC, 32);
  b.disque([cx, y + 0.03, cz], 1.93, BLEU, 32);
  b.disque([cx, y + 0.04, cz], 0.3, ORANGE, 12);

  // paniers : poteau derrière la ligne de fond, bras, panneau blanc à carré orange
  for (const [pan, s] of [[PANIER_A, -1], [PANIER_B, 1]] as Array<[V3, number]>) {
    const zp = pan[2] + s * 1.5; // panneau, un peu derrière l'anneau
    const zpole = zp + s * 1.35;
    b.cylindre([pan[0], 0, zpole], 0.17, H_PANIER + 0.6, "#4B4E58", 8);
    b.boite([pan[0], H_PANIER + 0.35, (zp + zpole) / 2], [0.22, 0.22, Math.abs(zpole - zp) + 0.2], "#4B4E58");
    b.boite([pan[0], H_PANIER + 0.55, zp], [3.4, 2.2, 0.16], BLANC);
    b.boite([pan[0], H_PANIER + 0.25, zp - s * 0.1], [1.3, 0.9, 0.05], ORANGE);
    b.boite([pan[0], H_PANIER + 0.25, zp - s * 0.13], [1.0, 0.62, 0.05], "#FFFFFF");
    b.boite([pan[0], H_PANIER - 0.0, (pan[2] + zp) / 2], [0.12, 0.12, Math.abs(zp - pan[2])], ORANGE); // attache de l'anneau
    b.boite([pan[0], 0.45, zpole], [0.6, 0.9, 0.6], "#C94F3A"); // protection au pied du poteau
  }

  // clôture basse : fond, côtés ; côté rue avec une ouverture
  const post = (x: number, z: number) => b.boite([x, 0.7, z], [0.12, 1.4, 0.12], "#8E949C");
  const run = (xa: number, za: number, xb: number, zb: number) => {
    const L = Math.hypot(xb - xa, zb - za);
    const n = Math.max(1, Math.round(L / 3));
    for (let i = 0; i <= n; i++) post(xa + ((xb - xa) * i) / n, za + ((zb - za) * i) / n);
    const ry = Math.atan2(-(zb - za), xb - xa);
    b.boite([(xa + xb) / 2, 1.38, (za + zb) / 2], [L, 0.1, 0.1], "#A6ACB4", [0, ry, 0]);
    b.boite([(xa + xb) / 2, 0.8, (za + zb) / 2], [L, 0.05, 0.05], "#A6ACB4", [0, ry, 0]);
  };
  const fx0 = bd.x0 - 0.5;
  const fx1 = bd.x1 + 0.5;
  const fz0 = bd.z0 - 0.5;
  const fz1 = bd.z1 + 0.5;
  run(fx0, fz0, fx0, fz1);
  run(fx0, fz0, fx1, fz0);
  run(fx0, fz1, fx1, fz1);
  run(fx1, fz0, fx1, cz - 2.0);
  run(fx1, cz + 2.0, fx1, fz1);

  // projecteurs : quatre poteaux
  for (const p of PROJECTEURS) {
    b.cylindre([p[0], 0, p[2]], 0.15, H_PROJECTEUR, "#5A5D68", 8);
    b.boite([p[0], H_PROJECTEUR + 0.2, p[2]], [1.9, 0.7, 0.35], "#43464F");
  }

  // sac, bouteille, banc : le décor raconte l'entraînement
  b.boite([bd.x0 + 1.3, 0.4, cz + 1.4], [1.0, 0.8, 0.55], "#D0453C");
  b.boite([bd.x0 + 1.3, 0.85, cz + 1.4], [0.5, 0.1, 0.4], "#2B2F45");
  b.cylindre([bd.x0 + 2.4, 0.04, cz + 1.2], 0.14, 0.5, "#58B6E8", 8);
  b.boite([bd.x0 - 1.4, 0.45, cz + 4], [0.6, 0.9, 3.4], "#8A5F3C");
  b.boite([bd.x0 - 1.7, 1.0, cz + 4], [0.12, 0.7, 3.4], "#8A5F3C");
}

// ------------------------------------------------------------------ Maison de fête
function fete(b: Batisseur) {
  const { w, d, h } = FETE;
  const mur = "#EDE3F3";
  const toit = "#7A3FA0";
  b.dans(FETE.o, FETE.ry, () => {
    // piste de danse devant la maison (dalles qui alternent deux violets) + dallage de l'entrée
    for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) b.boite([-16 + 2 * i + 1, 0.04, 3.5 + 3.2 * j], [1.96, 0.06, 3.16], (i + j) % 2 ? "#6B3C99" : "#8A55B8");
    // corps de la maison + ailes
    b.boite([0, 0.15, -d / 2], [w + 0.6, 0.3, d + 0.6], "#9B9B9B");
    b.boite([0, h / 2 + 0.15, -d / 2], [w, h - 0.3, d], mur);
    toitPignon(b, w, d, h, mur, toit, 4.6);
    for (const s of [-1, 1]) {
      b.boite([s * 14, 2.9, -4], [8, 5.8, 8], s < 0 ? "#F3D9E6" : "#D9E8F5");
      b.boite([s * 14, 6.0, -4], [8.6, 0.5, 8.6], toit);
      for (const y of [2.6]) fenetrePleine(b, s * 14, y, 2.4, 2.0);
    }
    // fenêtres : cadre blanc + vitre sombre (la couleur qui clignote est posée par le décor)
    for (const f of FENETRES_FETE) {
      b.boite([f.x, f.y, 0.02], [f.w + 0.5, f.h + 0.5, 0.1], BLANC);
      b.boite([f.x, f.y, 0.07], [f.w, f.h, 0.08], "#2A1B3A");
    }
    // porte et perron : marches, colonnes, auvent
    porte(b, 0, "#F2B63D");
    b.boite([0, 0.45, 2.4], [7.2, 0.3, 4.6], "#B8B2BC");
    b.boite([0, 0.2, 5.0], [8.4, 0.3, 1.4], "#A9A3AD");
    for (const x of [-3.4, 3.4]) b.boite([x, 2.6, 4.2], [0.5, 4.2, 0.5], BLANC);
    b.boite([0, 4.9, 2.4], [8.2, 0.4, 5.2], toit);
    // enceintes géantes de part et d'autre du perron
    for (const e of ENCEINTES) {
      b.boite([e[0] + Math.sign(e[0]) * 2.6, 1.6, e[2]], [2.6, 3.2, 1.9], "#1E1E26");
    }
    // poteaux de guirlandes
    for (const p of POTEAUX_FETE) b.cylindre([p[0], 0, p[2]], 0.14, 7.6, "#6B4A2F", 8);
    // banderoles : petits fanions de couleur (losanges) sur les guirlandes
    const COL = ["#E0546B", "#F5D142", "#3D8BE8", "#43B58A", "#F08A3C", "#B86BE0"];
    GUIRLANDES.forEach(([a, c, n, sag], gi) => {
      guirlande(a, c, n, sag).forEach((p, i) => {
        if (i % 2 === 0) return;
        b.boite([p[0], p[1] - 0.38, p[2]], [0.55, 0.55, 0.05], COL[(i + gi) % COL.length], [0, 0, Math.PI / 4]);
      });
    });
    // grandes banderoles verticales de chaque côté de la porte
    b.boite([-5.2, 5.4, 0.12], [0.9, 3.0, 0.06], "#E0546B");
    b.boite([5.2, 5.4, 0.12], [0.9, 3.0, 0.06], "#3D8BE8");
    b.boite([-5.2, 3.7, 0.15], [0.9, 0.5, 0.06], "#F5D142");
    b.boite([5.2, 3.7, 0.15], [0.9, 0.5, 0.06], "#F5D142");
    // ballons : trois bouquets
    const BAL: Array<[number, number, string[]]> = [
      [-6.4, 5.6, ["#E0546B", "#F5D142", "#3D8BE8"]],
      [6.6, 5.9, ["#43B58A", "#B86BE0", "#F08A3C"]],
      [-10.5, 4.0, ["#3D8BE8", "#E0546B", "#F5D142"]],
      [10.7, 4.0, ["#F5D142", "#43B58A", "#E0546B"]],
    ];
    for (const [x, z, cs] of BAL) {
      b.cylindre([x, 0.3, z], 0.04, 2.4, "#DDDDDD", 4);
      cs.forEach((c, i) => b.boule([x + (i - 1) * 0.55, 3.0 + (i % 2) * 0.35, z + (i === 1 ? 0.2 : -0.1)], [0.5, 0.62, 0.5], c, 1));
    }
  });
}

export type Zones = { ext: THREE.BufferGeometry; terrain: THREE.BufferGeometry; fete: THREE.BufferGeometry; etoiles: THREE.BufferGeometry };

/** Construit toutes les zones fixes (une fois par page). */
export function construireVille(): Zones {
  const ext = new Batisseur(false);
  ext.boite([0, -0.5, -40], [900, 1, 900], HERBE);
  rue(ext);
  maisons(ext);
  vegetation(ext);
  lampadairesGeo(ext);
  const t = new Batisseur(false);
  terrain(t);
  const f = new Batisseur(false);
  fete(f);
  return { ext: ext.construire(), terrain: t.construire(), fete: f.construire(), etoiles: etoiles() };
}
