/**
 * « La fenêtre de minuit » — le quartier, construit une seule fois et identique d'un plan à l'autre
 * (bible visuelle : histoires/scripts-chatgpt/fenetre-de-minuit.md).
 *
 * Repère : x vers la droite, y vers le haut, z vers le spectateur. La rue arrive du premier plan (+z) et
 * débouche sur une petite place ronde. Autour de la place : la maison du narrateur (gauche), la maison B
 * (au fond, au centre) et la maison C de la vieille dame (droite). Les deux fenêtres se font face.
 */
import * as THREE from "three";
import { Batisseur, versMonde, type V3 } from "../geo";

// ------------------------------------------------------------------ Repères du quartier
export const SOL = 0.3; // plancher des maisons au-dessus du terrain
const THETA = (58 * Math.PI) / 180;
const R_FACADE = 11.6;

export type Repere = { o: V3; ry: number };
/** Maison C : la vieille dame (à droite de la place). */
export const MAISON_C: Repere = { o: [R_FACADE * Math.sin(THETA), 0, -R_FACADE * Math.cos(THETA)], ry: -THETA };
/** Maison J : le narrateur (à gauche de la place, en face de la maison C). */
export const MAISON_J: Repere = { o: [-R_FACADE * Math.sin(THETA), 0, -R_FACADE * Math.cos(THETA)], ry: THETA };
/** Maison B : au fond de la place, face à la rue. */
export const MAISON_B: Repere = { o: [0, 0, -13.4], ry: 0 };

export const C = (p: V3): V3 => versMonde(MAISON_C.o, MAISON_C.ry, p);
export const J = (p: V3): V3 => versMonde(MAISON_J.o, MAISON_J.ry, p);
export const B = (p: V3): V3 => versMonde(MAISON_B.o, MAISON_B.ry, p);

/** Ouvertures réelles (coordonnées locales de la maison, y depuis le terrain). */
export const FEN_C = { x0: -0.8, x1: 2.8, y0: SOL + 1.0, y1: SOL + 3.3 };
export const FEN_J = { x0: 0.3, x1: 3.5, y0: SOL + 1.25, y1: SOL + 3.25 };
export const PORTE_C_X = -3.3;
export const PORTE_J_X = -2.6;
/** Fenêtre jaune de la maison B (locale). */
export const FEN_B = { x: 1.5, y: SOL + 2.3, w: 2.3, h: 1.9 };

/** Horloge de rue (au bord de la place, devant la maison B) : pied du poteau et centre du cadran. */
export const HORLOGE: V3 = [-4.2, 0, -9.6]; // hors de la ligne de vue entre les deux fenêtres
export const HORLOGE_CADRAN_Y = 4.15;
/** Lampadaires : pied, et lacet du bras (vers la chaussée). */
export const LAMPADAIRES: Array<{ p: V3; ry: number }> = [
  { p: [-6.95, 0, 3.4], ry: Math.atan2(6.95, -3.4) },
  { p: [6.95, 0, 3.4], ry: Math.atan2(-6.95, -3.4) },
  { p: [8.0, 0, -0.4], ry: Math.atan2(-8.0, 0.4) }, // à droite de la maison C
  { p: [-3.95, 0, 21], ry: Math.PI / 2 },
  { p: [3.95, 0, 35], ry: -Math.PI / 2 },
];
export const TETE_LAMPADAIRE = 4.55;

// Meubles et accessoires repérés (coordonnées locales)
export const SALON = {
  dame: [1.05, SOL, -3.1] as V3, // assise sur le canapé, face à la fenêtre
  assise: SOL + 0.44, // dessus des coussins
  table: [0.2, SOL + 1.0, -1.0] as V3, // centre du plateau
  bougie: [0.2, SOL + 1.0, -0.92] as V3, // pied du bougeoir
  photo: [-1.72, SOL + 2.3, -0.36] as V3, // centre du cadre (mur de la fenêtre, côté pièce)
};
export const CHAMBRE = {
  bureau: [1.9, SOL + 1.1, -0.8] as V3, // dessus du bureau
  lampe: [2.9, SOL + 1.1, -0.78] as V3, // pied de la lampe
  reveil: [2.3, SOL + 0.8, -7.25] as V3, // sur la table de nuit, afficheur tourné vers la pièce
  interrupteur: [-0.84, SOL + 1.8, -1.9] as V3, // sur la cloison, à droite de la porte de la chambre (plaque tournée vers +x)
  joueur: [1.2, SOL, -2.6] as V3, // debout face à la fenêtre
  joueurInterrupteur: [0.97, SOL, -1.9] as V3, // bras droit tendu vers l'interrupteur
};
/** Perron du narrateur (dalle gris clair devant la porte bleue) et paillasson. */
export const PERRON_J = { centre: [PORTE_J_X, SOL, 1.25] as V3, w: 3.4, d: 2.5 };

// ------------------------------------------------------------------ Couleurs (bible visuelle)
const K = {
  herbe: "#55A84B",
  herbe2: "#4D9C45",
  route: "#555B65",
  trottoir: "#929292",
  bordure: "#A9A9A9",
  ligne: "#E3C84A",
  colline: "#3D7A48",
  colline2: "#356E45",
  tronc: "#6B4A2F",
  feuille: "#43844B",
  feuille2: "#4F9A57",
  lampadaire: "#646464",
  blanc: "#EFEDE6",
  socle: "#8D8A84",
  vitre: "#29323C",
  A: "#D8C6A6",
  Bm: "#D5D5D5",
  Cm: "#D8C7A8",
  Jm: "#64758A",
  porteC: "#76523B",
  porteJ: "#3A526B",
  or: "#D5AF55",
};

// ------------------------------------------------------------------ Pièces réutilisables
function toitPignon(b: Batisseur, w: number, d: number, h: number, mur: string, toit: string, hr = w * 0.36) {
  // pignon (mur) + deux pans épais qui débordent
  b.pignon([0, h, -d / 2], w, hr, d, mur);
  const deb = 0.55;
  const ep = 0.22;
  const demi = w / 2 + deb;
  const a = Math.atan2(hr, w / 2);
  const L = demi / Math.cos(a) + 0.12;
  for (const s of [-1, 1]) {
    const cx = (s * demi) / 2;
    const cy = h + hr - (demi / 2) * Math.tan(a) + ep / 2 / Math.cos(a) + 0.02;
    b.boite([cx, cy, -d / 2], [L, ep, d + 1.1], toit, [0, 0, -s * a]);
  }
  b.boite([0, h + hr + 0.16, -d / 2], [0.34, 0.2, d + 1.14], toit, undefined, 0.86);
}

function porte(b: Batisseur, x: number, couleur: string, opts: { marche?: boolean; auvent?: string } = {}) {
  const y0 = SOL;
  b.boite([x, y0 + 1.5, 0.03], [1.86, 3.12, 0.1], K.blanc); // encadrement
  b.boite([x, y0 + 1.45, 0.07], [1.5, 2.9, 0.12], couleur);
  b.boite([x, y0 + 2.15, 0.14], [1.06, 0.95, 0.03], couleur, undefined, 1.16); // panneaux
  b.boite([x, y0 + 0.82, 0.14], [1.06, 1.05, 0.03], couleur, undefined, 1.16);
  b.boite([x + 0.52, y0 + 1.42, 0.2], [0.16, 0.16, 0.14], K.or); // poignée
  if (opts.auvent) {
    b.boite([x, y0 + 3.45, 0.55], [2.5, 0.14, 1.2], opts.auvent, [0.16, 0, 0]);
    b.boite([x - 1.05, y0 + 3.2, 0.3], [0.1, 0.36, 0.6], K.blanc);
    b.boite([x + 1.05, y0 + 3.2, 0.3], [0.1, 0.36, 0.6], K.blanc);
  }
  // lanterne murale (éteinte)
  b.boite([x + 1.25, y0 + 2.35, 0.14], [0.22, 0.34, 0.22], "#3B3B42");
  b.boite([x + 1.25, y0 + 2.33, 0.2], [0.14, 0.2, 0.14], "#B9B49A");
}

/** Encadrement extérieur d'une fenêtre (x0..x1, y0..y1) + appui. */
function cadreFenetre(b: Batisseur, f: { x0: number; x1: number; y0: number; y1: number }, croisillons: boolean, volets?: string) {
  const w = f.x1 - f.x0;
  const h = f.y1 - f.y0;
  const cx = (f.x0 + f.x1) / 2;
  const cy = (f.y0 + f.y1) / 2;
  const e = 0.2;
  b.boite([cx, f.y1 + e / 2, 0.06], [w + 2 * e, e, 0.16], K.blanc);
  b.boite([cx, f.y0 - e / 2, 0.06], [w + 2 * e, e, 0.16], K.blanc);
  b.boite([f.x0 - e / 2, cy, 0.06], [e, h, 0.16], K.blanc);
  b.boite([f.x1 + e / 2, cy, 0.06], [e, h, 0.16], K.blanc);
  b.boite([cx, f.y0 - e - 0.05, 0.16], [w + 2 * e + 0.3, 0.12, 0.36], K.blanc, undefined, 0.94); // appui
  if (croisillons) b.boite([cx, f.y0 + h * 0.8, -0.12], [w, 0.1, 0.1], K.blanc); // une seule traverse haute
  if (volets) {
    b.boite([f.x0 - e - 0.36, cy, 0.05], [0.6, h + 0.1, 0.1], volets);
    b.boite([f.x1 + e + 0.36, cy, 0.05], [0.6, h + 0.1, 0.1], volets);
    for (const s of [f.x0 - e - 0.36, f.x1 + e + 0.36]) for (let i = 0; i < 4; i++) b.boite([s, f.y0 + 0.3 + (i * (h - 0.5)) / 3, 0.11], [0.46, 0.06, 0.03], volets, undefined, 0.8);
  }
}

/** Fenêtre « pleine » (vitre sombre) pour les maisons sans intérieur. */
function fenetrePleine(b: Batisseur, x: number, y: number, w: number, h: number, volets?: string) {
  const f = { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 };
  b.boite([x, y, 0.02], [w, h, 0.08], K.vitre);
  cadreFenetre(b, f, false, volets);
  b.boite([x, y, 0.08], [0.09, h, 0.06], K.blanc);
  b.boite([x, y + h * 0.12, 0.08], [w, 0.09, 0.06], K.blanc);
}

function buisson(b: Batisseur, p: V3, s = 1, couleur = K.feuille) {
  b.boite([p[0], p[1] + 0.42 * s, p[2]], [1.3 * s, 0.84 * s, 0.9 * s], couleur);
  b.boite([p[0] + 0.25 * s, p[1] + 0.92 * s, p[2]], [0.7 * s, 0.4 * s, 0.6 * s], K.feuille2);
}

function jardiniere(b: Batisseur, x: number, y: number, w: number) {
  b.boite([x, y, 0.34], [w, 0.26, 0.36], "#7A5236");
  const fleurs = ["#E0546B", "#F2C230", "#F08A3C", "#E86BA5", "#FFFFFF"];
  const n = Math.round(w / 0.42);
  for (let i = 0; i < n; i++) {
    const fx = x - w / 2 + 0.21 + i * (w / n);
    b.boite([fx, y + 0.22, 0.34], [0.3, 0.2, 0.3], K.feuille2);
    b.boite([fx, y + 0.38, 0.34 + (i % 2 ? 0.05 : -0.04)], [0.17, 0.17, 0.17], fleurs[i % fleurs.length]);
  }
}

function arbre(b: Batisseur, x: number, z: number, s = 1, ry = 0.3) {
  b.dans([x, 0, z], ry, () => {
    b.boite([0, 1.0 * s, 0], [0.55 * s, 2.0 * s, 0.55 * s], K.tronc);
    b.boite([0, 3.0 * s, 0], [2.5 * s, 2.3 * s, 2.5 * s], K.feuille);
    b.boite([0.25 * s, 4.45 * s, -0.15 * s], [1.6 * s, 1.5 * s, 1.6 * s], K.feuille2);
    b.boite([-1.15 * s, 2.6 * s, 0.6 * s], [1.0 * s, 1.1 * s, 1.0 * s], K.feuille2);
  });
}

function sapin(b: Batisseur, x: number, z: number, s = 1) {
  b.boite([x, 0.5 * s, z], [0.45 * s, 1.0 * s, 0.45 * s], K.tronc);
  b.cone([x, 0.8 * s, z], 1.55 * s, 2.2 * s, "#356E45", 6, 0.3);
  b.cone([x, 2.0 * s, z], 1.2 * s, 2.0 * s, "#3D7A48", 6, 0.8);
  b.cone([x, 3.1 * s, z], 0.8 * s, 1.7 * s, "#46894F", 6, 0.1);
}

function boiteAuxLettres(b: Batisseur, p: V3, ry: number) {
  b.dans(p, ry, () => {
    b.boite([0, 0.65, 0], [0.14, 1.3, 0.14], "#5A5A5F");
    b.boite([0, 1.42, 0], [0.5, 0.42, 0.78], "#8E949C");
    b.boite([0, 1.66, 0], [0.5, 0.1, 0.78], "#A4AAB2");
    b.boite([0.28, 1.5, 0.2], [0.05, 0.3, 0.08], "#D0453C"); // petit drapeau
    b.boite([0, 1.42, 0.4], [0.36, 0.26, 0.02], "#6F757D");
  });
}

function cloture(b: Batisseur, a: V3, c: V3) {
  const dx = c[0] - a[0];
  const dz = c[2] - a[2];
  const L = Math.hypot(dx, dz);
  const ry = Math.atan2(-dz, dx);
  b.dans(a, ry, () => {
    b.boite([L / 2, 0.38, 0], [L, 0.1, 0.07], K.blanc);
    b.boite([L / 2, 0.86, 0], [L, 0.1, 0.07], K.blanc);
    const n = Math.max(2, Math.round(L / 0.42));
    for (let i = 0; i <= n; i++) {
      const x = (L * i) / n;
      b.boite([x, 0.6, 0.03], [0.2, 1.2, 0.07], K.blanc);
      b.boite([x, 1.24, 0.03], [0.12, 0.12, 0.07], K.blanc);
    }
  });
}

function voiture(b: Batisseur, p: V3, ry: number, couleur: string) {
  b.dans(p, ry, () => {
    b.boite([0, 0.62, 0], [1.9, 0.62, 4.1], couleur);
    b.boite([0, 1.2, -0.25], [1.7, 0.6, 2.2], couleur, undefined, 0.9);
    b.boite([0, 1.22, 0.9], [1.5, 0.46, 0.08], "#BFD8EE"); // pare-brise
    b.boite([0, 1.22, -1.4], [1.5, 0.46, 0.08], "#BFD8EE");
    for (const s of [-1, 1]) {
      b.boite([s * 0.86, 1.22, -0.25], [0.04, 0.44, 1.8], "#BFD8EE");
      for (const z of [-1.3, 1.3]) {
        b.boite([s * 0.9, 0.36, z], [0.3, 0.72, 0.72], "#1B1B1F");
        b.boite([s * 1.06, 0.36, z], [0.04, 0.34, 0.34], "#8F949B");
      }
      b.boite([s * 0.62, 0.7, 2.06], [0.42, 0.2, 0.05], "#F4EBC0"); // phares (éteints)
      b.boite([s * 0.62, 0.7, -2.06], [0.42, 0.2, 0.05], "#B5352E");
    }
    b.boite([0, 0.42, 2.08], [1.94, 0.2, 0.1], "#3A3D44");
    b.boite([0, 0.42, -2.08], [1.94, 0.2, 0.1], "#3A3D44");
  });
}

function lampadaire(b: Batisseur, p: V3, ry: number) {
  b.dans(p, ry, () => {
    b.boite([0, 0.2, 0], [0.42, 0.4, 0.42], "#55555A");
    b.cylindre([0, 0.4, 0], 0.11, TETE_LAMPADAIRE - 0.2, K.lampadaire, 8);
    b.boite([0, TETE_LAMPADAIRE + 0.22, 0.55], [0.16, 0.14, 1.3], K.lampadaire);
    b.boite([0, TETE_LAMPADAIRE + 0.14, 1.1], [0.5, 0.2, 0.8], "#56565B");
  });
}

function horlogeDeRue(b: Batisseur) {
  b.dans(HORLOGE, 0, () => {
    b.boite([0, 0.22, 0], [0.6, 0.44, 0.6], "#3F4046");
    b.cylindre([0, 0.44, 0], 0.13, HORLOGE_CADRAN_Y - 1.2, "#4A4B52", 8);
    b.boite([0, HORLOGE_CADRAN_Y - 0.82, 0], [0.6, 0.14, 0.6], "#3F4046");
    // boîtier cubique à quatre cadrans + petit toit
    b.boite([0, HORLOGE_CADRAN_Y, 0], [1.5, 1.5, 1.5], "#34363D");
    b.boite([0, HORLOGE_CADRAN_Y + 0.84, 0], [1.74, 0.18, 1.74], "#2A2C32");
    b.boite([0, HORLOGE_CADRAN_Y + 0.98, 0], [1.1, 0.12, 1.1], "#2A2C32");
    b.boite([0, HORLOGE_CADRAN_Y + 1.12, 0], [0.16, 0.22, 0.16], K.or);
  });
}

type Simple = { w: number; d: number; h: number; mur: string; toit: string; porteX: number; porteC: string; fen: Array<{ x: number; w: number; h?: number }>; volets?: string; cheminee?: number; hr?: number };
/** Maison sans intérieur (figurante) : façade en z = 0, tournée vers +z. */
function maisonSimple(b: Batisseur, o: Simple) {
  b.boite([0, SOL / 2, -o.d / 2], [o.w + 0.3, SOL, o.d + 0.3], K.socle);
  b.boite([0, SOL + (o.h - SOL) / 2, -o.d / 2], [o.w, o.h - SOL, o.d], o.mur);
  toitPignon(b, o.w, o.d, o.h, o.mur, o.toit, o.hr);
  porte(b, o.porteX, o.porteC);
  b.boite([o.porteX, SOL / 2, 0.75], [2.4, SOL, 1.5], K.bordure);
  for (const f of o.fen) fenetrePleine(b, f.x, SOL + 2.3, f.w, f.h ?? 1.9, o.volets);
  // œil-de-bœuf du grenier
  b.boite([0, o.h + (o.hr ?? o.w * 0.36) * 0.36, 0.03], [1.0, 1.0, 0.1], K.blanc);
  b.boite([0, o.h + (o.hr ?? o.w * 0.36) * 0.36, 0.06], [0.72, 0.72, 0.1], K.vitre);
  if (o.cheminee !== undefined) {
    b.boite([o.cheminee, o.h + 2.0, -o.d * 0.62], [0.9, 2.6, 0.9], "#9B5A45");
    b.boite([o.cheminee, o.h + 3.36, -o.d * 0.62], [1.1, 0.16, 1.1], "#7C4636");
  }
}

type Creuse = { w: number; d: number; h: number; mur: string; toit: string; porteX: number; porteC: string; fen: { x0: number; x1: number; y0: number; y1: number }; piece: { x0: number; x1: number }; murInt: string; solInt: string; croisillons: boolean; auvent?: string; cheminee?: number };
const EP = 0.3; // épaisseur des murs
/** Maison avec une vraie pièce visible par la fenêtre : `ext` reçoit la coque, `int` le revêtement intérieur. */
function maisonCreuse(ext: Batisseur, int: Batisseur, o: Creuse) {
  const { w, d, h, fen } = o;
  ext.boite([0, SOL / 2, -d / 2], [w + 0.3, SOL, d + 0.3], K.socle);
  const hm = h - SOL;
  const ym = SOL + hm / 2;
  ext.boite([0, ym, -d + EP / 2], [w, hm, EP], o.mur); // fond
  ext.boite([-w / 2 + EP / 2, ym, -d / 2], [EP, hm, d - 2 * EP], o.mur);
  ext.boite([w / 2 - EP / 2, ym, -d / 2], [EP, hm, d - 2 * EP], o.mur);
  // façade percée
  const gx = (-w / 2 + fen.x0) / 2;
  ext.boite([gx, ym, -EP / 2], [fen.x0 + w / 2, hm, EP], o.mur);
  ext.boite([(fen.x1 + w / 2) / 2, ym, -EP / 2], [w / 2 - fen.x1, hm, EP], o.mur);
  ext.boite([(fen.x0 + fen.x1) / 2, (SOL + fen.y0) / 2, -EP / 2], [fen.x1 - fen.x0, fen.y0 - SOL, EP], o.mur);
  ext.boite([(fen.x0 + fen.x1) / 2, (fen.y1 + h) / 2, -EP / 2], [fen.x1 - fen.x0, h - fen.y1, EP], o.mur);
  ext.boite([0, h + 0.06, -d / 2], [w, 0.12, d], o.mur);
  toitPignon(ext, w, d, h + 0.12, o.mur, o.toit);
  porte(ext, o.porteX, o.porteC, { auvent: o.auvent });
  cadreFenetre(ext, fen, o.croisillons);
  if (o.cheminee !== undefined) {
    ext.boite([o.cheminee, h + 2.1, -d * 0.6], [0.9, 2.8, 0.9], "#9B5A45");
    ext.boite([o.cheminee, h + 3.56, -d * 0.6], [1.1, 0.16, 1.1], "#7C4636");
  }
  // œil-de-bœuf
  ext.boite([0, h + w * 0.13, 0.03], [1.05, 1.05, 0.1], K.blanc);
  ext.boite([0, h + w * 0.13, 0.06], [0.76, 0.76, 0.1], K.vitre);

  // --- revêtement intérieur de la pièce
  const { x0, x1 } = o.piece;
  const z0 = -d + EP;
  const z1 = -EP;
  const pw = x1 - x0;
  const pd = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const e = 0.05;
  int.boite([cx, SOL + 0.02, cz], [pw, 0.04, pd], o.solInt);
  int.boite([cx, h - 0.03, cz], [pw, 0.06, pd], "#E9E2D3");
  int.boite([cx, ym, z0 + e / 2], [pw, hm, e], o.murInt);
  int.boite([x0 + e / 2, ym, cz], [e, hm, pd], o.murInt);
  int.boite([x1 - e / 2, ym, cz], [e, hm, pd], o.murInt);
  int.boite([(x0 + fen.x0) / 2, ym, z1 - e / 2], [fen.x0 - x0, hm, e], o.murInt);
  int.boite([(fen.x1 + x1) / 2, ym, z1 - e / 2], [x1 - fen.x1, hm, e], o.murInt);
  int.boite([(fen.x0 + fen.x1) / 2, (SOL + fen.y0) / 2, z1 - e / 2], [fen.x1 - fen.x0, fen.y0 - SOL, e], o.murInt);
  int.boite([(fen.x0 + fen.x1) / 2, (fen.y1 + h) / 2, z1 - e / 2], [fen.x1 - fen.x0, h - fen.y1, e], o.murInt);
  // tableau de la fenêtre (épaisseur du mur) et appui intérieur
  int.boite([(fen.x0 + fen.x1) / 2, fen.y0 - 0.03, z1 - 0.16], [fen.x1 - fen.x0 + 0.3, 0.08, 0.34], K.blanc);
  // plinthes
  const pl = "#6F5741";
  int.boite([cx, SOL + 0.14, z0 + 0.08], [pw, 0.2, 0.06], pl);
  int.boite([x0 + 0.08, SOL + 0.14, cz], [0.06, 0.2, pd], pl);
  int.boite([x1 - 0.08, SOL + 0.14, cz], [0.06, 0.2, pd], pl);
  int.boite([(x0 + fen.x0) / 2, SOL + 0.14, z1 - 0.08], [fen.x0 - x0, 0.2, 0.06], pl);
  int.boite([(fen.x1 + x1) / 2, SOL + 0.14, z1 - 0.08], [x1 - fen.x1, 0.2, 0.06], pl);
  int.boite([(fen.x0 + fen.x1) / 2, SOL + 0.14, z1 - 0.08], [fen.x1 - fen.x0, 0.2, 0.06], pl);
}

// ------------------------------------------------------------------ Le quartier (zone extérieure)
function quartier(ext: Batisseur, salon: Batisseur, chambre: Batisseur) {
  // terrain
  ext.boite([0, -0.5, -40], [900, 1, 900], K.herbe);
  // place ronde + rue
  ext.disque([0, 0.03, 0], 7.06, K.route);
  ext.boite([0, -0.07, 70], [6.4, 0.2, 130], K.route);
  const ouv = Math.asin(3.2 / 7);
  ext.anneau([0, 0, 0], 7, 8.3, 0.14, K.trottoir, K.bordure, ouv);
  for (const s of [-1, 1]) {
    ext.boite([s * 3.85, 0.07, 70.6], [1.3, 0.14, 128.8], K.trottoir);
    ext.boite([s * 3.24, 0.07, 70.6], [0.1, 0.15, 128.8], K.bordure, undefined, 1.15);
  }
  for (let z = 9.5; z < 132; z += 3.6) ext.boite([0, 0.04, z], [0.22, 0.02, 1.7], K.ligne);
  // petit terre-plein central avec un massif (repère visuel de la place)
  ext.cylindre([0, 0.03, 0], 1.25, 0.2, K.bordure, 10);
  ext.cylindre([0, 0.23, 0], 1.05, 0.06, K.herbe2, 10);
  ext.boite([0, 0.5, 0], [0.9, 0.5, 0.9], K.feuille);
  for (const [fx, fz, fc] of [[0.55, 0.1, "#E0546B"], [-0.5, 0.3, "#F2C230"], [0.1, -0.6, "#FFFFFF"], [-0.3, -0.45, "#E86BA5"], [0.35, 0.6, "#F08A3C"]] as Array<[number, number, string]>) ext.boite([fx, 0.36, fz], [0.2, 0.2, 0.2], fc);

  // ---- maison C (vieille dame)
  ext.dans(MAISON_C.o, MAISON_C.ry, () => {
    salon.dans(MAISON_C.o, MAISON_C.ry, () => {
      maisonCreuse(ext, salon, { w: 10, d: 8, h: 4.6, mur: K.Cm, toit: "#A5483C", porteX: PORTE_C_X, porteC: K.porteC, fen: FEN_C, piece: { x0: -4.7, x1: 4.7 }, murInt: "#D8C7A8", solInt: "#987A5C", croisillons: true, auvent: "#A5483C", cheminee: 2.9 });
    });
    // perron, allée grise, boîte aux lettres, clôture blanche à droite, massifs
    ext.boite([PORTE_C_X, SOL / 2, 0.8], [2.6, SOL, 1.6], K.bordure);
    ext.boite([PORTE_C_X, 0.2, 1.75], [2.0, 0.14, 0.4], K.bordure, undefined, 0.92);
    ext.boite([PORTE_C_X, 0.05, 2.9], [1.5, 0.08, 2.4], "#9C9C9C");
    ext.boite([PORTE_C_X, SOL + 0.03, 0.7], [1.3, 0.05, 0.8], "#7C5A3E"); // paillasson
    buisson(ext, [3.9, 0, 0.9], 1.0);
    buisson(ext, [-0.95, 0, 0.75], 0.8, K.feuille2);
    jardiniere(ext, 1.0, FEN_C.y0 - 0.5, 3.2);
    cloture(ext, [5.2, 0, 0.2], [5.2, 0, 3.0]);
    cloture(ext, [5.2, 0, 3.0], [3.7, 0, 3.3]);
  });
  boiteAuxLettres(ext, C([-4.75, 0, 3.75]), MAISON_C.ry);

  // ---- maison J (narrateur)
  ext.dans(MAISON_J.o, MAISON_J.ry, () => {
    chambre.dans(MAISON_J.o, MAISON_J.ry, () => {
      maisonCreuse(ext, chambre, { w: 10, d: 8, h: 4.6, mur: K.Jm, toit: "#39445A", porteX: PORTE_J_X, porteC: K.porteJ, fen: FEN_J, piece: { x0: -0.9, x1: 4.7 }, murInt: "#64758A", solInt: "#8B6F52", croisillons: false, auvent: "#39445A", cheminee: -2.9 });
    });
    ext.boite([-1.0, SOL + 2.1, -4], [0.2, 4.2, 7.4], "#3A4150"); // cloison (dos de la chambre)
    ext.boite([PERRON_J.centre[0], SOL / 2, PERRON_J.centre[2]], [PERRON_J.w, SOL, PERRON_J.d], "#B9B9B4"); // perron gris clair
    ext.boite([PERRON_J.centre[0], 0.2, PERRON_J.centre[2] + PERRON_J.d / 2 + 0.2], [2.4, 0.14, 0.4], "#B9B9B4", undefined, 0.92);
    ext.boite([PORTE_J_X, 0.05, 3.6], [1.5, 0.08, 1.8], "#9C9C9C");
    ext.boite([PORTE_J_X, SOL + 0.03, 0.72], [1.5, 0.05, 0.9], "#6E5A46"); // paillasson
    buisson(ext, [-4.55, 0, 0.8], 0.75);
    buisson(ext, [4.45, 0, 0.8], 0.85, K.feuille2);
    jardiniere(ext, 1.9, FEN_J.y0 - 0.5, 3.0);
  });
  boiteAuxLettres(ext, J([0.9, 0, 4.05]), MAISON_J.ry);

  // ---- maison B (au fond) : la fenêtre jaune de 23 h 50 est posée par le décor dynamique
  ext.dans(MAISON_B.o, MAISON_B.ry, () => {
    maisonSimple(ext, { w: 9, d: 8, h: 4.7, mur: K.Bm, toit: "#4B6791", porteX: -2.2, porteC: "#8A4B3A", fen: [{ x: FEN_B.x, w: FEN_B.w, h: FEN_B.h }], volets: "#4B6791", cheminee: 2.6 });
    ext.boite([-2.2, 0.05, 2.9], [1.5, 0.08, 3.0], "#9C9C9C");
    buisson(ext, [-4.0, 0, 0.8], 0.8);
    buisson(ext, [3.9, 0, 0.85], 0.9, K.feuille2);
    jardiniere(ext, FEN_B.x, FEN_B.y - FEN_B.h / 2 - 0.5, 2.2);
  });

  // ---- maisons figurantes (rue du premier plan + second rang)
  const figurantes: Array<{ p: V3; ry: number; o: Simple }> = [
    { p: [-7.6, 0, 17.5], ry: Math.PI / 2, o: { w: 9, d: 7.5, h: 4.4, mur: K.A, toit: "#7A4A35", porteX: 2.2, porteC: "#5E7F5A", fen: [{ x: -1.6, w: 2.2 }], volets: "#5E7F5A", cheminee: -2.4 } },
    { p: [7.6, 0, 17.5], ry: -Math.PI / 2, o: { w: 9, d: 7.5, h: 4.4, mur: "#A9B7C7", toit: "#5B4A7C", porteX: -2.2, porteC: "#E8E2D2", fen: [{ x: 1.6, w: 2.2 }], volets: "#5B4A7C" } },
    { p: [-7.6, 0, 30.5], ry: Math.PI / 2, o: { w: 9, d: 7.5, h: 4.4, mur: "#E3D2C0", toit: "#3F6E5C", porteX: -2.2, porteC: "#7C4636", fen: [{ x: 1.6, w: 2.2 }], volets: "#3F6E5C" } },
    { p: [7.6, 0, 30.5], ry: -Math.PI / 2, o: { w: 9, d: 7.5, h: 4.4, mur: "#D9C9A8", toit: "#8E4B3C", porteX: 2.2, porteC: "#3F5C7A", fen: [{ x: -1.6, w: 2.2 }], volets: "#3F5C7A", cheminee: 2.4 } },
    { p: [-7.6, 0, 43.5], ry: Math.PI / 2, o: { w: 9, d: 7.5, h: 4.4, mur: "#BFC9D2", toit: "#6B3F3F", porteX: 2.2, porteC: "#6B3F3F", fen: [{ x: -1.6, w: 2.2 }] } },
    { p: [7.6, 0, 43.5], ry: -Math.PI / 2, o: { w: 9, d: 7.5, h: 4.4, mur: "#E6DCC6", toit: "#4B6791", porteX: -2.2, porteC: "#4B6791", fen: [{ x: 1.6, w: 2.2 }] } },
    // second rang, derrière la place
    { p: [-17.5, 0, -24], ry: 0.5, o: { w: 9, d: 7.5, h: 4.4, mur: K.A, toit: "#6B4A7C", porteX: 2.2, porteC: "#7C4636", fen: [{ x: -1.6, w: 2.2 }] } },
    { p: [17.5, 0, -25], ry: -0.5, o: { w: 9, d: 7.5, h: 4.4, mur: "#CFE0C0", toit: "#8E4B3C", porteX: -2.2, porteC: "#5B4634", fen: [{ x: 1.6, w: 2.2 }] } },
    { p: [-34, 0, -8], ry: 1.2, o: { w: 9, d: 7.5, h: 4.4, mur: "#E9B8A0", toit: "#3F6E5C", porteX: 2.2, porteC: "#5B4634", fen: [{ x: -1.6, w: 2.2 }] } },
    { p: [34, 0, -9], ry: -1.2, o: { w: 9, d: 7.5, h: 4.4, mur: "#BFC9D2", toit: "#7A4A35", porteX: -2.2, porteC: "#5B4634", fen: [{ x: 1.6, w: 2.2 }] } },
  ];
  for (const m of figurantes) {
    ext.dans(m.p, m.ry, () => {
      maisonSimple(ext, m.o);
      ext.boite([m.o.porteX, 0.05, 2.0], [1.4, 0.08, 2.6], "#9C9C9C");
      buisson(ext, [-m.o.porteX * 1.7, 0, 0.8], 0.8);
    });
  }

  // ---- mobilier urbain
  horlogeDeRue(ext);
  ext.boite([HORLOGE[0], 0.03, HORLOGE[2]], [2.2, 0.08, 2.2], K.trottoir);
  for (const l of LAMPADAIRES) lampadaire(ext, l.p, l.ry);
  // banc près de l'horloge
  ext.dans([2.3, 0.14, -7.75], -0.28, () => {
    ext.boite([0, 0.55, 0], [2.0, 0.1, 0.6], "#8A5F3C");
    ext.boite([0, 0.95, -0.27], [2.0, 0.5, 0.1], "#8A5F3C");
    for (const s of [-0.85, 0.85]) ext.boite([s, 0.28, 0], [0.12, 0.56, 0.56], "#3F4046");
  });
  voiture(ext, [-2.05, 0.03, 27.5], Math.PI, "#D0453C");
  voiture(ext, [2.05, 0.03, 40], 0, "#3D7BD9");
  voiture(ext, [-11.8, 0.03, 11.2], Math.PI / 2 + 0.05, "#E8B93A");
  ext.boite([-9.5, 0.04, 11.2], [10, 0.08, 3.0], "#9C9C9C"); // allée de garage

  // ---- végétation
  const arbres: Array<[number, number, number]> = [
    [-6.9, -13.6, 1.05],
    [7.2, -13.9, 0.95],
    [-19.5, -2.2, 1.15],
    [19.8, -1.2, 1.1],
    [-13.5, 6.6, 0.95],
    [13.6, 6.9, 1.0],
    [-14.5, 24.2, 1.1],
    [14.6, 24.0, 0.95],
    [-14.2, 37.2, 1.0],
    [14.4, 37.4, 1.1],
    [-25, -17, 1.2],
    [26, -16, 1.1],
    [-9, -28, 1.15],
    [9.5, -29.5, 1.0],
    [0, -27, 0.9],
    [-27, 6, 1.0],
    [27, 8, 1.05],
    [-30, 22, 1.1],
    [31, 24, 1.0],
  ];
  arbres.forEach(([x, z, s], i) => (i % 4 === 3 ? sapin(ext, x, z, s * 1.25) : arbre(ext, x, z, s, i * 0.7)));
  for (const [x, z] of [[-22, -32], [23, -34], [-40, -20], [41, -22], [-12, -40], [13, -42], [0, -46], [-48, -4], [49, -2], [-52, 20], [52, 22]] as Array<[number, number]>) sapin(ext, x, z, 1.6);

  // ---- collines géométriques au loin
  const collines: Array<[number, number, number, number, string]> = [
    [-70, -95, 46, 20, K.colline],
    [-20, -120, 60, 26, K.colline2],
    [45, -105, 52, 22, K.colline],
    [100, -90, 44, 19, K.colline2],
    [-120, -70, 48, 21, K.colline2],
    [-110, 10, 40, 17, K.colline],
    [112, 5, 42, 18, K.colline],
    [150, -50, 50, 22, K.colline2],
    [-160, -30, 52, 23, K.colline],
  ];
  collines.forEach(([x, z, r, h, c], i) => ext.cone([x, -0.2, z], r, h, c, 7, i * 0.5));
}

/** Portes du salon (côté pièce) : elles font partie des murs et restent quand la maison est vide. */
function portesSalon(m: Batisseur) {
  const F = SOL;
  m.dans(MAISON_C.o, MAISON_C.ry, () => {
    m.boite([2.7, F + 1.5, -7.66], [1.76, 3.1, 0.08], K.blanc);
    m.boite([2.7, F + 1.45, -7.62], [1.44, 2.9, 0.1], "#76523B");
    m.boite([2.2, F + 1.4, -7.54], [0.14, 0.14, 0.1], K.or);
    m.boite([PORTE_C_X, F + 1.5, -0.37], [1.76, 3.1, 0.06], K.blanc);
    m.boite([PORTE_C_X, F + 1.45, -0.4], [1.44, 2.9, 0.08], "#76523B");
    m.boite([PORTE_C_X - 0.5, F + 1.4, -0.47], [0.14, 0.14, 0.1], K.or);
  });
}

// ------------------------------------------------------------------ Salon de la vieille dame (meubles : disparaissent au matin)
function meublesSalon(m: Batisseur) {
  const F = SOL;
  m.dans(MAISON_C.o, MAISON_C.ry, () => {
    // tapis
    m.boite([1.0, F + 0.05, -2.4], [4.4, 0.03, 3.6], "#C9B48A");
    m.boite([1.0, F + 0.07, -2.4], [3.9, 0.03, 3.1], "#8E4B4B");
    // canapé brun (face à la fenêtre)
    const sx = 1.6;
    const sz = SALON.dame[2];
    m.boite([sx, F + 0.16, sz - 0.15], [2.7, 0.32, 1.0], "#74513B");
    m.boite([sx - 0.62, F + 0.38, sz - 0.1], [1.18, 0.14, 0.86], "#8A6147");
    m.boite([sx + 0.62, F + 0.38, sz - 0.1], [1.18, 0.14, 0.86], "#8A6147");
    m.boite([sx, F + 0.72, sz - 0.78], [2.7, 1.2, 0.3], "#74513B");
    m.boite([sx - 1.5, F + 0.42, sz - 0.2], [0.32, 0.84, 1.1], "#6A4934");
    m.boite([sx + 1.5, F + 0.42, sz - 0.2], [0.32, 0.84, 1.1], "#6A4934");
    m.boite([sx + 0.7, F + 0.74, sz - 0.52], [0.7, 0.56, 0.2], "#B88A5A"); // coussin
    // petite table carrée près de la fenêtre
    const [tx, ty, tz] = SALON.table;
    m.boite([tx, ty - 0.045, tz], [0.95, 0.09, 0.95], "#765A42");
    for (const a of [-1, 1]) for (const c of [-1, 1]) m.boite([tx + a * 0.38, F + (ty - F - 0.09) / 2, tz + c * 0.38], [0.09, ty - F - 0.09, 0.09], "#6A4F3A");
    m.boite([tx, ty + 0.012, tz], [0.6, 0.02, 0.6], "#E8DFD0"); // napperon
    // rideaux violets + tringle
    for (const x of [FEN_C.x0 + 0.24, FEN_C.x1 - 0.24]) {
      m.boite([x, F + 2.2, -0.5], [0.58, 2.9, 0.12], "#75617D");
      m.boite([x, F + 2.2, -0.56], [0.2, 2.9, 0.04], "#665370");
    }
    m.boite([1.0, F + 3.7, -0.5], [4.4, 0.09, 0.09], "#4A3B2E");
    // bibliothèque (mur de gauche vu de l'intérieur)
    m.boite([4.4, F + 1.4, -4.6], [0.5, 2.8, 2.0], "#6B4A32");
    const livres = ["#B5352E", "#3D6FA8", "#E3C84A", "#4F9A57", "#8A5F9C", "#D98A3C"];
    for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) m.boite([4.12, F + 0.45 + r * 0.66, -5.4 + i * 0.3], [0.1, 0.42 - (i % 3) * 0.05, 0.24], livres[(i + r) % livres.length]);
    // commode + radio + plante (mur du fond)
    m.boite([-1.6, F + 0.5, -7.3], [2.0, 1.0, 0.7], "#7A5A40");
    m.boite([-2.05, F + 0.62, -6.94], [0.7, 0.3, 0.03], "#8E6B4C");
    m.boite([-1.15, F + 0.62, -6.94], [0.7, 0.3, 0.03], "#8E6B4C");
    m.boite([-2.05, F + 0.3, -6.94], [0.7, 0.3, 0.03], "#8E6B4C");
    m.boite([-1.15, F + 0.3, -6.94], [0.7, 0.3, 0.03], "#8E6B4C");
    m.boite([-2.1, F + 1.2, -7.3], [0.7, 0.4, 0.34], "#A5483C");
    m.boite([-2.1, F + 1.2, -7.12], [0.3, 0.24, 0.02], "#E9E2D3");
    m.cylindre([-0.95, F + 1.0, -7.3], 0.2, 0.3, "#C9825B", 8);
    m.boule([-0.95, F + 1.62, -7.3], [0.38, 0.42, 0.38], K.feuille2, 0, 0.4);
    // tableau au fond (paysage en aplats)
    m.boite([0.4, F + 2.7, -7.66], [1.7, 1.2, 0.08], "#5B4634");
    m.boite([0.4, F + 2.85, -7.61], [1.46, 0.66, 0.02], "#8EC8EC");
    m.boite([0.4, F + 2.4, -7.61], [1.46, 0.36, 0.02], "#55A84B");
    m.boite([0.8, F + 2.86, -7.6], [0.3, 0.3, 0.02], "#FFF1B5");
    // lampadaire de salon (éteint)
    m.cylindre([-4.1, F, -7.0], 0.24, 0.08, "#3F4046", 8);
    m.cylindre([-4.1, F + 0.08, -7.0], 0.05, 2.5, "#3F4046", 6);
    m.cylindre([-4.1, F + 2.5, -7.0], 0.42, 0.56, "#B5A98A", 8, 0.26);
    // fauteuil (coin droit vu de l'intérieur) et plante
    m.boite([-3.6, F + 0.3, -3.6], [1.1, 0.6, 1.1], "#5E7F5A");
    m.boite([-4.05, F + 0.85, -3.6], [0.26, 1.1, 1.1], "#557354");
    m.boite([-3.6, F + 0.62, -3.05], [1.1, 0.5, 0.2], "#557354");
    m.boite([-3.6, F + 0.62, -4.15], [1.1, 0.5, 0.2], "#557354");
    m.cylindre([4.15, F, -1.0], 0.3, 0.5, "#C9825B", 8);
    m.boule([4.15, F + 1.0, -1.0], [0.55, 0.62, 0.55], K.feuille, 0, 0.2);
    m.boule([4.05, F + 1.55, -1.05], [0.36, 0.4, 0.36], K.feuille2, 0, 0.9);
    // cadre de la photo du fils (la photo elle-même est posée par le décor dynamique)
    const [px, py, pz] = SALON.photo;
    m.boite([px, py, pz], [0.92, 1.14, 0.08], "#5B4634");
    m.boite([px, py, pz - 0.035], [0.74, 0.96, 0.03], "#EFE6D2");
  });
}

// ------------------------------------------------------------------ Chambre du narrateur
function meublesChambre(m: Batisseur) {
  const F = SOL;
  m.dans(MAISON_J.o, MAISON_J.ry, () => {
    // tapis
    m.boite([1.9, F + 0.05, -3.6], [3.0, 0.03, 2.4], "#DAD6CB");
    m.boite([1.9, F + 0.07, -3.6], [2.6, 0.03, 2.0], "#3F5D8A");
    // bureau sous la fenêtre
    const [bx, by, bz] = CHAMBRE.bureau;
    m.boite([bx, by - 0.05, bz], [3.0, 0.1, 0.98], "#77553B");
    m.boite([bx - 1.42, F + (by - F - 0.1) / 2, bz], [0.1, by - F - 0.1, 0.9], "#6B4C35");
    m.boite([bx + 1.42, F + (by - F - 0.1) / 2, bz], [0.1, by - F - 0.1, 0.9], "#6B4C35");
    m.boite([bx + 0.95, by - 0.42, bz], [0.84, 0.62, 0.9], "#6B4C35");
    m.boite([bx + 0.95, by - 0.28, bz - 0.46], [0.7, 0.22, 0.03], "#8A6548");
    m.boite([bx + 0.95, by - 0.56, bz - 0.46], [0.7, 0.22, 0.03], "#8A6548");
    m.boite([bx + 0.95, by - 0.28, bz - 0.49], [0.16, 0.05, 0.04], K.or);
    m.boite([bx + 0.95, by - 0.56, bz - 0.49], [0.16, 0.05, 0.04], K.or);
    // livres et tasse sur le bureau
    m.boite([bx - 0.9, by + 0.06, bz + 0.05], [0.62, 0.1, 0.44], "#B5352E", [0, 0.2, 0]);
    m.boite([bx - 0.88, by + 0.15, bz + 0.05], [0.56, 0.08, 0.4], "#E9E2D3", [0, 0.05, 0]);
    m.cylindre([bx - 0.2, by, bz + 0.1], 0.1, 0.2, "#E9E2D3", 8);
    // pied et tige de la lampe (l'abat-jour est dynamique)
    const [lx, ly, lz] = CHAMBRE.lampe;
    m.cylindre([lx, ly, lz], 0.2, 0.07, "#2E2E36", 8);
    m.cylindre([lx, ly + 0.07, lz], 0.045, 0.52, "#2E2E36", 6);
    // boîtier du réveil (l'affichage est dynamique)
    const [rx, ryy, rz] = CHAMBRE.reveil;
    m.boite([rx, ryy + 0.17, rz], [0.72, 0.34, 0.24], "#1D1E24");
    // interrupteur mural (plaque sur la cloison, près de la porte de la chambre)
    const [ix, iy, iz] = CHAMBRE.interrupteur;
    m.boite([ix + 0.01, iy, iz], [0.05, 0.44, 0.32], "#ECE9E1");
    // rideaux bleu foncé + tringle
    for (const x of [FEN_J.x0 + 0.16, FEN_J.x1 - 0.16]) {
      m.boite([x, F + 2.3, -0.5], [0.5, 2.7, 0.12], "#2E4064");
      m.boite([x, F + 2.3, -0.56], [0.18, 2.7, 0.04], "#263654");
    }
    m.boite([1.9, F + 3.7, -0.5], [4.1, 0.09, 0.09], "#2A2C32");
    // lit (à gauche vu de l'intérieur)
    m.boite([3.72, F + 0.22, -5.7], [1.8, 0.44, 3.7], "#5B4634");
    m.boite([3.72, F + 0.55, -5.7], [1.68, 0.24, 3.56], "#EFEDE6");
    m.boite([3.72, F + 0.6, -5.2], [1.74, 0.26, 2.5], "#697080");
    m.boite([3.72, F + 0.76, -7.05], [1.2, 0.2, 0.6], "#FFFFFF");
    m.boite([3.72, F + 0.9, -7.6], [1.8, 1.5, 0.14], "#5B4634");
    // table de nuit
    m.boite([2.3, F + 0.4, -7.3], [0.8, 0.8, 0.7], "#6B4C35");
    m.boite([2.3, F + 0.5, -6.94], [0.6, 0.26, 0.03], "#8A6548");
    // armoire (cloison de droite vue de l'intérieur)
    m.boite([-0.5, F + 1.5, -5.9], [0.7, 3.0, 2.2], "#6B5540");
    m.boite([-0.14, F + 1.5, -5.9], [0.03, 2.8, 0.04], "#4F3E2E");
    m.boite([-0.12, F + 1.5, -5.72], [0.06, 0.3, 0.06], K.or);
    m.boite([-0.12, F + 1.5, -6.08], [0.06, 0.3, 0.06], K.or);
    // porte de la chambre (cloison)
    m.boite([-0.86, F + 1.5, -3.5], [0.06, 3.1, 1.76], K.blanc);
    m.boite([-0.83, F + 1.45, -3.5], [0.08, 2.9, 1.44], "#C9C2B5");
    m.boite([-0.76, F + 1.4, -2.95], [0.1, 0.14, 0.14], K.or);
    // affiches et étagère (mur du fond)
    m.boite([1.2, F + 2.6, -7.66], [1.3, 1.7, 0.04], "#22304F");
    m.boite([1.2, F + 2.85, -7.63], [0.7, 0.7, 0.02], "#F2C230");
    m.boite([1.2, F + 2.1, -7.63], [0.9, 0.16, 0.02], "#E9E2D3");
    m.boite([4.66, F + 2.9, -4.4], [0.04, 1.2, 1.6], "#A5483C");
    m.boite([4.63, F + 2.9, -4.4], [0.02, 0.5, 0.9], "#F4E9D0");
    m.boite([4.45, F + 2.2, -6.6], [0.4, 0.07, 1.6], "#6B4C35");
    m.boite([4.45, F + 2.42, -6.2], [0.26, 0.36, 0.26], "#E3C84A");
    m.boite([4.45, F + 2.38, -6.8], [0.3, 0.28, 0.5], "#3D6FA8");
  });
}

export type Zones = { ext: THREE.BufferGeometry; salon: THREE.BufferGeometry; salonMeubles: THREE.BufferGeometry; chambre: THREE.BufferGeometry; etoiles: THREE.BufferGeometry };

/** Construit toutes les zones fixes du quartier (une fois par page). */
export function construireMonde(): Zones {
  const ext = new Batisseur(false);
  const salon = new Batisseur(true);
  const chambre = new Batisseur(true);
  const meubles = new Batisseur(true);
  quartier(ext, salon, chambre);
  portesSalon(salon);
  meublesSalon(meubles);
  meublesChambre(chambre);
  return { ext: ext.construire(), salon: salon.construire(), salonMeubles: meubles.construire(), chambre: chambre.construire(), etoiles: etoiles() };
}

/** Étoiles : petits carrés blancs posés sur une voûte lointaine (dessin fixe). */
function etoiles(): THREE.BufferGeometry {
  const pos: number[] = [];
  const rnd = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const R = 380;
  for (let i = 0; i < 230; i++) {
    const az = rnd(i) * Math.PI * 2;
    const el = 0.06 + rnd(i + 500) * 1.15;
    const c = new THREE.Vector3(R * Math.cos(el) * Math.sin(az), R * Math.sin(el), -R * Math.cos(el) * Math.cos(az));
    const s = 1.1 + rnd(i + 900) * 1.5;
    const n = c.clone().normalize();
    const u = new THREE.Vector3(0, 1, 0).cross(n).normalize().multiplyScalar(s);
    const v = n.clone().cross(u).normalize().multiplyScalar(s);
    const p = [c.clone().sub(u).sub(v), c.clone().add(u).sub(v), c.clone().add(u).add(v), c.clone().sub(u).add(v)];
    for (const k of [0, 1, 2, 0, 2, 3]) pos.push(p[k].x, p[k].y, p[k].z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}
