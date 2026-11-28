/**
 * « Prénom = argent » — décors fixes en blocs (ombrage cuit par face). Cinq lieux éloignés (Decor n'affiche que celui de la caméra) :
 *   RUE    (0, 0, 0)      rue commerçante ensoleillée : boutiques à auvents, banque à écran, boulangerie ouverte, podium doré
 *   RUINE  (0, 0, 600)    LA MÊME rue, dessaturée : rideaux baissés, panneaux « FERMÉ », papiers au sol, ciel sale
 *   STADE  (-400, 0, 0)   stade : gradins en blocs, pelouse, scène dorée, écran géant, banderoles
 *   TOITS  (400, 0, 0)    toits de la ville : tours, haut-parleurs, studio de radio vitré
 *   PROP   (0, 0, -600)   propriété : château d'or (balcon), villa et piscine, yacht au ponton, la ville au loin (vive ou grise)
 * Les couleurs passent par K() : la même construction donne la version vive ou la version « poussière » (l'or reste de l'or).
 */
import * as THREE from "three";
import { Batisseur, versMonde, type V3 } from "../../geo";

export const RUE: V3 = [0, 0, 0];
export const RUINE: V3 = [0, 0, 600];
export const STADE: V3 = [-400, 0, 0];
export const TOITS: V3 = [400, 0, 0];
export const PROP: V3 = [0, 0, -600];

const add = (o: V3, p: V3): V3 => [o[0] + p[0], o[1] + p[1], o[2] + p[2]];
export const RU = (p: V3): V3 => add(RUINE, p);
export const ST = (p: V3): V3 => add(STADE, p);
export const TO = (p: V3): V3 => add(TOITS, p);
export const PR = (p: V3): V3 => add(PROP, p);

// ------------------------------------------------------------------ Couleurs
let SAT = 1;
function mixGris(hex: string, s: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  const f = (v: number, k = 0) => Math.max(0, Math.min(255, Math.round(l + (v - l) * s + k)));
  return `#${[f(r, -2), f(g, 0), f(b, 4)].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
/** Couleur filtrée par la saturation courante (1 = vive). */
export const K = (hex: string) => (SAT >= 0.999 ? hex : mixGris(hex, SAT));
/** Désature une couleur (personnages) : k = 0 inchangée, 1 grise. */
export const gris = (hex: string, k: number) => (k <= 0.01 ? hex : mixGris(hex, 1 - k));

export const COUL = {
  or: "#FFC21A",
  orClair: "#FFE27A",
  orFonce: "#D99A00",
  emeraude: "#0FB36B",
  emeraudeF: "#08874F",
  rouge: "#C4122F",
  rougeF: "#8E0B22",
  magenta: "#E4208C",
  violet: "#6B2BD9",
  creme: "#FFF1CF",
  orange: "#FF7A1A",
  bleu: "#1E88E5",
  route: "#4B4A5C",
  trottoir: "#F4E3B8",
  trottoirOmbre: "#CDB98A",
  vitre: "#7FD8FF",
};

// ------------------------------------------------------------------ Rue : boutiques
export type Boutique = { x: number; z: number; nom: string; mur: string; accent: string; h: number; w?: number; special?: "banque" | "boulangerie" };
export const BOUTIQUES: Boutique[] = [
  { x: -11.5, z: 54, nom: "ÉPICERIE", mur: "#0FB36B", accent: "#FFD23F", h: 9 },
  { x: -11.5, z: 37, nom: "BIJOUX", mur: "#E4208C", accent: "#FFD23F", h: 10 },
  { x: -11.5, z: 20, nom: "CAFÉ", mur: "#FF7A1A", accent: "#2B1A10", h: 9 },
  { x: -11.5, z: 1, nom: "BANQUE", mur: "#FFF1CF", accent: "#0F6E45", h: 13, w: 20, special: "banque" },
  { x: -11.5, z: -19, nom: "PHARMACIE", mur: "#16A34A", accent: "#FFFFFF", h: 9 },
  { x: -11.5, z: -36, nom: "FLEURS", mur: "#FF5CA8", accent: "#FFFFFF", h: 10 },
  { x: -11.5, z: -53, nom: "BOUCHERIE", mur: "#C4122F", accent: "#FFE9B0", h: 9 },
  { x: -11.5, z: -70, nom: "CHAUSSURES", mur: "#6B2BD9", accent: "#FFD23F", h: 10 },
  { x: 11.5, z: 54, nom: "LIBRAIRIE", mur: "#1E6FE0", accent: "#FFE9B0", h: 10 },
  { x: 11.5, z: 38, nom: "CRÊPES", mur: "#FFB300", accent: "#6B2BD9", h: 9 },
  { x: 11.5, z: 22, nom: "BOULANGERIE", mur: "#C4122F", accent: "#FFD23F", h: 10, special: "boulangerie" },
  { x: 11.5, z: 5, nom: "FROMAGERIE", mur: "#F4B400", accent: "#FFFFFF", h: 9 },
  { x: 11.5, z: -11, nom: "JOUETS", mur: "#11A98E", accent: "#FFD23F", h: 10 },
  { x: 11.5, z: -27, nom: "OPTICIEN", mur: "#E4208C", accent: "#FFFFFF", h: 9 },
  { x: 11.5, z: -43, nom: "POISSONS", mur: "#0E86D4", accent: "#FFFFFF", h: 10 },
  { x: 11.5, z: -59, nom: "TABAC", mur: "#8E0B22", accent: "#FFD23F", h: 9 },
];
export const BOUL = BOUTIQUES.find((b) => b.special === "boulangerie")!;
export const BANQUE = BOUTIQUES.find((b) => b.special === "banque")!;
export const LAMPES_RUE: V3[] = [];
for (const z of [48, 28, 10, -10, -30, -50, -68]) LAMPES_RUE.push([-7.6, 0, z], [7.6, 0, z - 10]);
export const POUBELLES: V3[] = [[-8.4, 0, 31], [8.4, 0, 14], [-8.6, 0, -24], [8.4, 0, -47]];
export const PODIUM: V3 = [0, 0, -66];

/** Repère local d'une boutique (x local le long de la façade, z local vers la rue) → monde. */
export const ryBoutique = (b: Boutique) => (b.x < 0 ? Math.PI / 2 : -Math.PI / 2);
export const localBoutique = (b: Boutique, p: V3): V3 => versMonde([b.x, 0, b.z], ryBoutique(b), p);

function vitrine(b: Batisseur, w: number, accent: string, ferme: boolean, special?: string) {
  const vw = special === "banque" ? 12 : 7.6;
  const vx = special === "banque" ? -1.4 : -1.8;
  b.boite([vx, 2.3, 0.03], [vw, 2.9, 0.12], ferme ? K("#9FB4C4") : K(COUL.vitre), undefined, ferme ? 0.8 : 1.45);
  b.boite([vx, 3.82, 0.07], [vw + 0.3, 0.2, 0.2], K("#FFFFFF"));
  b.boite([vx, 0.88, 0.07], [vw + 0.3, 0.2, 0.2], K("#FFFFFF"));
  b.boite([vx - vw / 2, 2.35, 0.07], [0.2, 3.1, 0.2], K("#FFFFFF"));
  b.boite([vx + vw / 2, 2.35, 0.07], [0.2, 3.1, 0.2], K("#FFFFFF"));
  if (special !== "banque") for (let i = 1; i < 3; i++) b.boite([vx - vw / 2 + (vw * i) / 3, 2.35, 0.07], [0.1, 3.0, 0.12], K("#FFFFFF"));
  // porte
  const px = special === "banque" ? 6.6 : 4.6;
  b.boite([px, 1.75, 0.05], [2.2, 3.5, 0.16], K(accent));
  b.boite([px, 2.0, 0.14], [1.5, 2.1, 0.05], ferme ? K("#9FB4C4") : K(COUL.vitre), undefined, ferme ? 0.8 : 1.4);
  if (ferme) {
    // rideau métallique baissé sur la vitrine et la porte
    const x0 = vx - vw / 2 - 0.1;
    const x1 = px + 1.2;
    for (let i = 0; i < 12; i++) b.boite([(x0 + x1) / 2, 0.45 + i * 0.32, 0.3], [x1 - x0, 0.28, 0.12], i % 2 ? K("#8E9AA8") : K("#7C8896"));
    b.boite([(x0 + x1) / 2, 4.26, 0.32], [x1 - x0 + 0.2, 0.3, 0.3], K("#5C6672"));
  }
}

function boutique(b: Batisseur, o: Boutique, ferme: boolean) {
  const w = o.w ?? 14;
  const d = 11;
  b.dans([o.x, 0, o.z], ryBoutique(o), () => {
    b.boite([0, o.h / 2, -d / 2], [w, o.h, d], K(o.mur));
    b.boite([0, 0.22, 0.12], [w + 0.2, 0.44, 0.5], K("#EADFC4"));
    // bandeau d'enseigne et corniche
    b.boite([0, 5.35, 0.16], [w - 0.4, 1.7, 0.42], K(o.accent === "#FFFFFF" ? o.mur : "#17131F"));
    b.boite([0, o.h + 0.28, -d / 2 + 0.3], [w + 0.7, 0.56, d + 0.6], K("#FFF7E0"));
    b.boite([0, o.h - 0.5, 0.2], [w + 0.3, 0.3, 0.5], K(o.accent));
    // étage : fenêtres et jardinières
    if (o.h > 8.5) {
      const n = o.special === "banque" ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * (w / n);
        b.boite([x, 7.6, 0.03], [2.0, 2.2, 0.1], ferme ? K("#9FB4C4") : K(COUL.vitre), undefined, 1.4);
        b.boite([x, 7.6, 0.08], [2.4, 0.18, 0.16], K("#FFFFFF"));
        b.boite([x, 6.45, 0.35], [2.4, 0.45, 0.6], K("#7A4A28"));
        b.boite([x, 6.85, 0.35], [2.2, 0.3, 0.5], ferme ? K("#5C7A52") : K("#2CD16A"));
      }
    }
    if (o.special !== "boulangerie") {
      vitrine(b, w, o.accent, ferme, o.special);
      // auvent rayé
      const n = o.special === "banque" ? 14 : 10;
      const aw = o.special === "banque" ? w - 2 : w - 1;
      for (let i = 0; i < n; i++) b.boite([-aw / 2 + (i + 0.5) * (aw / n), 4.05, 1.5], [aw / n, 0.14, 3.0], i % 2 ? K("#FFFFFF") : K(o.special === "banque" ? "#0F6E45" : o.accent === "#FFFFFF" ? "#17131F" : o.accent), [0.3, 0, 0]);
    }
  });
}

/** Boulangerie à façade grande ouverte : comptoir, vitrine réfrigérée, étagères au fond. */
function boulangerie(b: Batisseur, o: Boutique, ferme: boolean) {
  const w = 14;
  const d = 11;
  b.dans([o.x, 0, o.z], ryBoutique(o), () => {
    b.boite([0, 0.22, 0.12], [w + 0.2, 0.44, 0.5], K("#EADFC4"));
    // coque : fond, côtés, toit, corniche
    b.boite([0, o.h / 2, -d + 0.2], [w, o.h, 0.4], K(o.mur));
    for (const s of [-1, 1]) b.boite([s * (w / 2 - 0.2), o.h / 2, -d / 2], [0.4, o.h, d], K(o.mur));
    b.boite([0, o.h - 1.2, -d / 2], [w, 2.4, d], K(o.mur));
    b.boite([0, 5.35, 0.16], [w - 0.4, 1.7, 0.42], K("#17131F"));
    b.boite([0, o.h + 0.28, -d / 2 + 0.3], [w + 0.7, 0.56, d + 0.6], K("#FFF7E0"));
    b.boite([0, o.h - 0.5, 0.2], [w + 0.3, 0.3, 0.5], K(o.accent));
    // intérieur : sol damier, murs crème
    for (let i = 0; i < 14; i++) for (let j = 0; j < 5; j++) b.boite([-6.5 + i * 1.0, 0.45, -1.2 - j * 1.9], [1.0, 0.04, 1.9], (i + j) % 2 ? K("#FFF3D6") : K("#E8B98A"));
    b.boite([0, 3.3, -d + 0.45], [w - 0.8, 5.8, 0.1], K("#FFE9B8"));
    // étagères : planches et montants (le pain est dessiné à part, il disparaît)
    for (let k = 0; k < 4; k++) b.boite([0, 1.2 + k * 1.15, -d + 1.3], [w - 2.0, 0.14, 1.5], K("#9A6A3E"));
    for (const x of [-6, -2, 2, 6]) b.boite([x, 2.6, -d + 1.3], [0.2, 3.9, 1.5], K("#7A4A28"));
    b.boite([0, 5.35, -d + 1.0], [w - 2, 0.3, 1.2], K("#7A4A28"));
    // comptoir
    b.boite([0, 0.9, -3.4], [11.0, 1.4, 1.5], K("#C4122F"));
    b.boite([0, 1.66, -3.4], [11.4, 0.16, 1.9], K("#FFE9B8"));
    b.boite([0, 1.2, -2.62], [11.0, 0.9, 0.05], K("#FFD23F"));
    // caisse enregistreuse et balance
    b.boite([-3.6, 2.1, -3.4], [1.3, 0.8, 0.9], K("#2B2B33"));
    b.boite([-3.6, 2.6, -3.62], [1.0, 0.5, 0.1], K("#3EE08A"), [0.4, 0, 0]);
    b.boite([3.9, 2.0, -3.4], [1.0, 0.6, 0.8], K("#C9CED8"));
    // auvent rayé
    for (let i = 0; i < 14; i++) b.boite([-6.5 + (i + 0.5) * (13 / 14), 4.05, 1.6], [13 / 14, 0.14, 3.2], i % 2 ? K("#FFFFFF") : K("#C4122F"), [0.3, 0, 0]);
    // la vitre de la grande baie est remplacée par un cadre
    for (const x of [-6.6, 6.6]) b.boite([x, 2.3, 0.05], [0.3, 4.2, 0.3], K("#FFFFFF"));
    b.boite([0, 4.3, 0.05], [13.5, 0.3, 0.3], K("#FFFFFF"));
    if (ferme) for (let i = 0; i < 12; i++) b.boite([0, 0.45 + i * 0.32, 0.3], [13, 0.28, 0.12], i % 2 ? K("#8E9AA8") : K("#7C8896"));
  });
}

/** Étagères de la boulangerie : positions locales (monde) des pains. */
export function positionsPains(): Array<{ p: V3; k: number }> {
  const out: Array<{ p: V3; k: number }> = [];
  let n = 0;
  for (let t = 0; t < 4; t++) {
    for (let i = 0; i < 9; i++) {
      const x = -5.6 + i * 1.38;
      out.push({ p: localBoutique(BOUL, [x, 1.34 + t * 1.15, -11 + 1.3]), k: n++ });
    }
  }
  return out;
}

function lampadaire(b: Batisseur, p: V3) {
  const s = p[0] < 0 ? 1 : -1;
  b.boite([p[0], 0.3, p[2]], [0.8, 0.6, 0.8], K("#0B5A3A"));
  b.cylindre([p[0], 0.5, p[2]], 0.15, 5.9, K("#0F7A4E"), 8);
  b.boite([p[0] + s * 0.6, 6.15, p[2]], [1.4, 0.16, 0.2], K("#0F7A4E"));
  b.boite([p[0] + s * 1.2, 5.85, p[2]], [0.7, 0.9, 0.7], "#FFC21A", undefined, 1.0);
  b.boite([p[0] + s * 1.2, 5.4, p[2]], [0.5, 0.1, 0.5], K("#FFF3C4"), undefined, 1.8);
  b.boite([p[0] + s * 1.2, 6.45, p[2]], [0.5, 0.3, 0.5], "#FFC21A");
}
function arbreCube(b: Batisseur, x: number, z: number, s: number, ferme: boolean) {
  b.boite([x, 0.35, z], [1.4, 0.7, 1.4], K("#B8742E"));
  b.boite([x, 0.7 + 0.9 * s, z], [0.5 * s, 1.8 * s, 0.5 * s], K("#7A4A28"));
  if (ferme) {
    b.boite([x + 0.4, 2.6 * s, z], [0.18, 1.4, 0.18], K("#7A4A28"), [0, 0, -0.8]);
    b.boite([x - 0.4, 2.8 * s, z], [0.18, 1.2, 0.18], K("#7A4A28"), [0, 0, 0.8]);
    return;
  }
  b.boite([x, 3.2 * s, z], [2.4 * s, 2.2 * s, 2.4 * s], K("#22C55E"));
  b.boite([x + 0.2 * s, 4.6 * s, z - 0.1 * s], [1.5 * s, 1.2 * s, 1.5 * s], K("#4ADE80"));
}
function fanions(b: Batisseur, z: number) {
  const n = 22;
  const cols = ["#C4122F", "#FFC21A", "#0FB36B", "#E4208C", "#FF7A1A", "#1E88E5"];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = -10.6 + 21.2 * u;
    const y = 9.0 - 1.4 * Math.sin(Math.PI * u);
    b.boite([x, y, z], [0.45, 0.7, 0.06], cols[i % cols.length], [0, 0, 0.1 * (i % 2 ? 1 : -1)]);
  }
  b.boite([0, 9.2, z], [21.4, 0.05, 0.05], "#2B2B33");
}

/** Hauteur des collines, immeubles lointains, bouts de rue. */
function horizon(b: Batisseur, ferme: boolean) {
  b.boite([0, 7, 76], [40, 14, 10], K("#FFB300"));
  b.boite([-16, 9, 76], [16, 18, 10], K("#E4208C"));
  b.boite([16, 8, 76], [16, 16, 10], K("#0E86D4"));
  b.boite([0, 14.4, 76], [42, 0.8, 11], K("#FFF7E0"));
  // l'hôtel de ville et sa tour au fond (-z)
  b.boite([0, 7, -96], [34, 14, 14], K("#FFF1CF"));
  b.boite([0, 18, -96], [10, 22, 10], K("#FFF1CF"));
  b.cone([0, 29, -96], 7.6, 8, K("#C4122F"), 4, Math.PI / 4);
  b.boite([0, 18.5, -90.8], [6.4, 6.4, 0.3], K("#FFFFFF"));
  b.boite([0, 18.5, -90.6], [5.6, 5.6, 0.2], K("#F7F2E4"));
  b.boite([0, 19.0, -90.4], [0.25, 2.2, 0.15], "#18202A");
  b.boite([0.8, 18.5, -90.4], [1.6, 0.25, 0.15], "#18202A");
  for (const [x, z, r, h, c] of [[-120, -170, 80, 30, "#34C06A"], [90, -190, 100, 40, "#2FB863"], [200, -80, 80, 30, "#34C06A"], [-220, -60, 90, 34, "#2FB863"], [-210, 90, 90, 30, "#34C06A"], [210, 100, 80, 30, "#2FB863"], [0, 220, 110, 44, "#34C06A"]] as Array<[number, number, number, number, string]>) b.cone([x, -0.2, z], r, h, K(c), 7, x);
  void ferme;
}

function podium(b: Batisseur) {
  const [x, , z] = PODIUM;
  b.cylindre([x, 0.1, z], 5.2, 0.7, COUL.or, 20);
  b.cylindre([x, 0.8, z], 4.2, 0.5, COUL.orClair, 20);
  b.cylindre([x, 1.3, z], 3.2, 0.4, COUL.or, 20);
  for (const s of [-1, 1]) {
    b.boite([x + s * 4.6, 2.4, z + 2.6], [0.5, 4.8, 0.5], COUL.orFonce);
    b.boite([x + s * 4.6, 5.0, z + 2.6], [0.9, 0.9, 0.9], COUL.or, undefined, 1.2);
  }
}

function rue(b: Batisseur, ferme: boolean) {
  // sol : grande esplanade verte, chaussée, trottoirs
  b.boite([0, -0.5, -10], [520, 1, 400], K("#37C26A"));
  b.boite([0, 0.0, -10], [14.4, 0.2, 190], K(COUL.route));
  for (let z = 70; z > -92; z -= 8) b.boite([0, 0.12, z], [0.5, 0.04, 3.8], K("#FFD23F"));
  for (const s of [-1, 1]) {
    b.boite([s * 7.3, 0.12, -10], [0.5, 0.26, 190], K("#FFFFFF"));
    b.boite([s * 9.4, 0.1, -10], [4.0, 0.2, 190], K(COUL.trottoir));
    for (let z = 74; z > -94; z -= 3) b.boite([s * 9.4, 0.205, z], [3.9, 0.02, 0.06], K("#E2CE9C"));
    b.boite([s * 11.45, 0.1, -10], [0.4, 0.22, 190], K("#FFFFFF"));
  }
  // passage piéton
  for (const z of [14, -20]) for (let i = 0; i < 9; i++) b.boite([-5.6 + i * 1.4, 0.115, z], [0.8, 0.03, 3.0], K("#FFFFFF"));
  // ombres dures de midi : le côté droit jette son ombre sur la rue
  if (!ferme) {
    for (const bt of BOUTIQUES.filter((q) => q.x > 0)) {
      b.boite([9.6, 0.215, bt.z - 1.6], [3.8, 0.02, 14.2], K(COUL.trottoirOmbre));
      b.boite([6.4, 0.125, bt.z - 1.6], [1.6, 0.02, 14.2], K("#3B3A4A"));
    }
  }
  for (const bt of BOUTIQUES) {
    if (bt.special === "boulangerie") boulangerie(b, bt, ferme);
    else boutique(b, bt, ferme);
  }
  for (const p of LAMPES_RUE) lampadaire(b, p);
  for (const z of [34, 8, -30, -52]) {
    arbreCube(b, -8.4, z - 4, 0.62, ferme);
    arbreCube(b, 8.4, z + 6, 0.62, ferme);
  }
  // poubelles
  for (const p of POUBELLES) {
    b.cylindre([p[0], 0.2, p[2]], 0.5, 1.2, K("#0F7A4E"), 8);
    b.boite([p[0], 1.45, p[2]], [1.1, 0.12, 1.1], K("#0B5A3A"));
  }
  podium(b);
  horizon(b, ferme);
  if (!ferme) for (const z of [32, -8, -44]) fanions(b, z);
  else {
    // la ville vide : papiers, un journal, un caddie renversé
    for (let i = 0; i < 70; i++) {
      const u = Math.sin(i * 12.9898) * 43758.5453;
      const f = u - Math.floor(u);
      const v = Math.sin(i * 78.233) * 12345.6789;
      const g = v - Math.floor(v);
      const x = (f - 0.5) * 20;
      const z = 60 - g * 140;
      b.boite([x, Math.abs(x) > 7.3 ? 0.225 : 0.13, z], [0.5 + f * 0.5, 0.02, 0.4 + g * 0.5], i % 3 ? K("#E8E4D8") : K("#B8B4A8"), [0, i, 0]);
    }
    b.boite([-3.4, 0.5, -16], [1.2, 0.8, 0.8], K("#9AA5B3"), [0.2, 0.4, 0.5]);
    b.boite([4.2, 0.4, 28], [1.1, 0.7, 0.8], K("#9AA5B3"), [0.1, 0.9, -0.4]);
  }
}

// ------------------------------------------------------------------ Stade
export const SITE = { demiL: 28, demiZ: 48, rangs: 15, pasRang: 2.4, hauteurRang: 1.15, front: 32 };
export const ECRAN = { p: [0, 31, -92] as V3, w: 40, h: 20 };
export type Fan = { p: V3; ry: number; k: number };
export const FANS: Fan[] = [];
function genererFans() {
  let k = 0;
  const { rangs, pasRang, hauteurRang } = SITE;
  for (let r = 0; r < rangs; r++) {
    const top = 1.4 + r * hauteurRang;
    for (const s of [-1, 1]) {
      const x = s * (SITE.front + r * pasRang + 0.5);
      for (let z = -46; z <= 46; z += 2.1) FANS.push({ p: [x, top, z + ((k * 7) % 5) * 0.12], ry: s > 0 ? -Math.PI / 2 : Math.PI / 2, k: k++ });
    }
    for (const s of [-1, 1]) {
      const z = s * (SITE.demiZ + 6 + r * pasRang + 0.5);
      for (let x = -27; x <= 27; x += 2.1) FANS.push({ p: [x + ((k * 3) % 4) * 0.1, top - 0.0, z], ry: s > 0 ? Math.PI : 0, k: k++ });
    }
  }
}
genererFans();
export const BANNIERES: Array<{ p: V3; ry: number; fond: string; encre: string; w: number; h: number }> = [];
for (let i = 0; i < 9; i++) {
  const z = -40 + i * 10;
  BANNIERES.push({ p: [SITE.front + 6.4 * 2.4 - 0.2 - 8.5, 9.0, z], ry: -Math.PI / 2, fond: i % 3 === 0 ? "#C4122F" : i % 3 === 1 ? "#0FB36B" : "#E4208C", encre: "#FFD23F", w: 3.6, h: 7.2 });
  BANNIERES.push({ p: [-(SITE.front + 6.4 * 2.4 - 0.2 - 8.5), 9.0, z + 5], ry: Math.PI / 2, fond: i % 3 === 0 ? "#6B2BD9" : i % 3 === 1 ? "#C4122F" : "#0FB36B", encre: "#FFD23F", w: 3.6, h: 7.2 });
}

function stade(b: Batisseur) {
  const { rangs, pasRang, hauteurRang, demiZ, front } = SITE;
  b.boite([0, -0.5, 0], [520, 1, 520], K("#8BA86A"));
  b.boite([0, 0.04, 0], [76, 0.1, 124], "#C0392B"); // piste
  b.boite([0, 0.12, 0], [60, 0.2, 100], "#2FB85A"); // pelouse
  for (let i = -6; i <= 6; i++) b.boite([0, 0.235, i * 7.6], [58, 0.02, 3.8], i % 2 ? "#37C860" : "#29A64F");
  const bl = "#FFFFFF";
  b.boite([0, 0.255, 0], [56, 0.02, 0.4], bl);
  for (const s of [-1, 1]) {
    b.boite([s * 28, 0.255, 0], [0.4, 0.02, 96], bl);
    b.boite([0, 0.255, s * 48], [56, 0.02, 0.4], bl);
    b.boite([0, 0.255, s * 38], [28, 0.02, 0.3], bl);
    b.boite([s * 14, 0.255, s * 43], [0.3, 0.02, 10], bl);
  }
  b.disque([0, 0.26, 0], 10, bl, 40);
  b.disque([0, 0.27, 0], 9.6, "#2FB85A", 40);
  // buts
  for (const s of [-1, 1]) {
    for (const x of [-3.6, 3.6]) b.boite([x, 1.3, s * 48.6], [0.3, 2.6, 0.3], "#FFFFFF");
    b.boite([0, 2.6, s * 48.6], [7.5, 0.3, 0.3], "#FFFFFF");
  }
  // scène centrale dorée (Maxime y chante son prénom)
  b.cylindre([0, 0.2, 0], 7.2, 1.3, COUL.or, 24);
  b.cylindre([0, 1.5, 0], 6.2, 0.25, COUL.orClair, 24);
  b.cylindre([0, 1.75, 0], 4.6, 0.15, COUL.emeraude, 24);
  // gradins : une marche par rang (hauteur croissante), bandes de couleur par secteur
  for (let r = 0; r < rangs; r++) {
    const top = 1.4 + r * hauteurRang;
    const col = r % 2 ? "#D49A00" : "#B8122E";
    for (const s of [-1, 1]) {
      const x = s * (front + r * pasRang + 0.5);
      b.boite([x, top / 2, 0], [pasRang, top, 96], col);
      b.boite([x - s * (pasRang / 2 - 0.05), top - 0.04, 0], [0.12, 0.08, 96], r % 2 ? "#FFE27A" : "#FF5A6E");
    }
    for (const s of [-1, 1]) {
      const z = s * (demiZ + 6 + r * pasRang + 0.5);
      b.boite([0, top / 2, z], [56, top, pasRang], r % 2 ? "#0FB36B" : "#0A7F4E");
    }
  }
  // séparations de secteurs et rampes
  for (const s of [-1, 1]) for (let z = -40; z <= 40; z += 20) b.boite([s * (front + rangs * pasRang / 2), 8.4, z], [rangs * pasRang, 0.4, 0.5], "#FFFFFF", undefined, 1.1);
  // mur de fond, panneaux publicitaires au bord de la pelouse
  for (const s of [-1, 1]) {
    b.boite([s * (front + rangs * pasRang + 0.6), 12, 0], [1.2, 24, 100], "#4B3A8C");
    b.boite([s * (front - 0.8), 0.7, 0], [0.4, 1.4, 96], "#FFFFFF");
    for (let z = -44; z <= 44; z += 8) b.boite([s * (front - 1.05), 0.7, z], [0.2, 1.0, 7.4], z % 16 === 0 ? "#E4208C" : "#FFC21A");
    b.boite([0, 0.7, s * (demiZ + 4.4)], [60, 1.4, 0.4], "#FFFFFF");
    b.boite([0, 12, s * (demiZ + 6 + rangs * pasRang + 0.6)], [60, 24, 1.2], "#4B3A8C");
  }
  // pylônes d'éclairage
  for (const [x, z] of [[-60, -78], [60, -78], [-60, 78], [60, 78]] as Array<[number, number]>) {
    b.cylindre([x, 0, z], 1.1, 44, "#9AA5B3", 8);
    b.boite([x, 46, z], [8, 5, 1.2], "#F4F1EA", undefined, 1.8);
    for (let i = 0; i < 4; i++) b.boite([x - 3 + i * 2, 46, z + (z > 0 ? -0.7 : 0.7)], [1.4, 1.6, 0.2], "#FFFFFF", undefined, 2.4);
  }
  // pylônes de l'écran géant
  for (const s of [-1, 1]) b.boite([s * 21, 15, ECRAN.p[2] - 1.5], [1.6, 30, 1.6], "#2B2B33");
  b.boite([0, 40.8, ECRAN.p[2] - 1.5], [44, 1.4, 1.6], "#2B2B33");
  b.boite([0, 20.6, ECRAN.p[2] - 0.7], [ECRAN.w + 1.6, ECRAN.h + 1.6, 1.0], "#17131F");
  b.boite([0, 30.5, ECRAN.p[2] - 0.7], [ECRAN.w + 1.6, ECRAN.h + 1.6, 1.0], "#17131F");
  // collines lointaines
  for (const [x, z, r, h] of [[-200, -200, 110, 40], [200, -180, 120, 44], [-210, 160, 100, 36], [180, 200, 110, 40]] as Array<[number, number, number, number]>) b.cone([x, -0.2, z], r, h, K("#6FC48A"), 7, x);
}

// ------------------------------------------------------------------ Toits : tours, haut-parleurs, studio de radio
export const ETUDE = { roof: 28, cx: 0, cz: 0, w: 15, d: 10 };
export type Tour = { x: number; z: number; w: number; d: number; h: number; c: string };
export const TOURS: Tour[] = [
  { x: 0, z: 0, w: 30, d: 26, h: 28, c: "#6B2BD9" },
  { x: -42, z: -6, w: 22, d: 22, h: 22, c: "#E4208C" },
  { x: 40, z: 10, w: 22, d: 24, h: 33, c: "#0E86D4" },
  { x: -6, z: 44, w: 26, d: 20, h: 24, c: "#FF7A1A" },
  { x: 4, z: -46, w: 26, d: 20, h: 20, c: "#0FB36B" },
  { x: 62, z: -30, w: 18, d: 18, h: 26, c: "#C4122F" },
];
export type Enceinte = { p: V3; ry: number; s: number };
export const ENCEINTES: Enceinte[] = [];
for (const t of TOURS) {
  const hx = t.w / 2 - 1.4;
  const hz = t.d / 2 - 1.4;
  for (const [x, z, ry] of [[-hx, hz, -Math.PI / 4], [hx, hz, Math.PI / 4], [-hx, -hz, (-3 * Math.PI) / 4], [hx, -hz, (3 * Math.PI) / 4], [0, hz, 0], [0, -hz, Math.PI]] as Array<[number, number, number]>) {
    if (t === TOURS[0] && Math.abs(x) < 8) continue; // le studio occupe le centre de ce toit
    ENCEINTES.push({ p: [t.x + x, t.h + 6.2, t.z + z], ry, s: t === TOURS[0] ? 1.15 : 1 });
  }
}
function toits(b: Batisseur, verre: Batisseur) {
  b.boite([0, -0.5, 0], [800, 1, 800], K("#3C3552"));
  // la ville en dessous : blocs colorés de toutes tailles
  const cols = ["#FFB300", "#E4208C", "#0FB36B", "#FF7A1A", "#1E88E5", "#C4122F", "#6B2BD9", "#11A98E"];
  for (let i = 0; i < 90; i++) {
    const u = Math.sin(i * 12.9898) * 43758.5453;
    const f = u - Math.floor(u);
    const v = Math.sin(i * 78.233) * 12345.6789;
    const g = v - Math.floor(v);
    const x = (f - 0.5) * 300;
    const z = (g - 0.5) * 300;
    if (TOURS.some((t) => Math.abs(x - t.x) < t.w / 2 + 6 && Math.abs(z - t.z) < t.d / 2 + 6)) continue;
    const h = 4 + ((i * 7) % 11);
    b.boite([x, h / 2, z], [9 + (i % 4) * 2, h, 9 + ((i + 2) % 4) * 2], K(cols[i % cols.length]));
    b.boite([x, h + 0.2, z], [10 + (i % 4) * 2, 0.4, 10 + ((i + 2) % 4) * 2], K("#FFF1CF"));
  }
  for (let i = -8; i <= 8; i++) {
    b.boite([i * 18, 0.05, 0], [3, 0.1, 340], K("#2B2B33"));
    b.boite([0, 0.05, i * 18], [340, 0.1, 3], K("#2B2B33"));
  }
  for (const t of TOURS) {
    b.boite([t.x, t.h / 2, t.z], [t.w, t.h, t.d], K(t.c));
    b.boite([t.x, t.h + 0.35, t.z], [t.w + 1.0, 0.7, t.d + 1.0], K("#FFF1CF"));
    b.boite([t.x, t.h + 0.9, t.z], [t.w - 1.6, 0.5, t.d - 1.6], K("#B7ADC4")); // dalle du toit
    // rangées de fenêtres
    for (let y = 4; y < t.h - 2; y += 4) {
      for (const s of [-1, 1]) {
        for (let k = -2; k <= 2; k++) {
          b.boite([t.x + s * (t.w / 2 + 0.03), y, t.z + k * (t.d / 5)], [0.08, 1.9, 2.4], K(COUL.vitre), undefined, 1.4);
          b.boite([t.x + k * (t.w / 5), y, t.z + s * (t.d / 2 + 0.03)], [2.4, 1.9, 0.08], K(COUL.vitre), undefined, 1.4);
        }
      }
    }
    // garde-corps
    for (const s of [-1, 1]) {
      b.boite([t.x + s * (t.w / 2 - 0.4), t.h + 1.6, t.z], [0.18, 0.9, t.d - 0.8], K("#FFC21A"));
      b.boite([t.x, t.h + 1.6, t.z + s * (t.d / 2 - 0.4)], [t.w - 0.8, 0.9, 0.18], K("#FFC21A"));
    }
  }
  // haut-parleurs : mât, caisson noir (la face est dessinée à part)
  for (const e of ENCEINTES) {
    b.dans(e.p, e.ry, () => {
      const s = e.s;
      b.cylindre([0, -6.0, 0], 0.18 * s, 6.0, "#2B2B33", 6);
      b.boite([0, 0.6 * s, -0.05], [3.6 * s, 3.6 * s, 1.5 * s], "#0B0B10");
      b.boite([0, 2.55 * s, -0.05], [3.0 * s, 0.3 * s, 1.3 * s], "#E4208C", undefined, 1.2);
    });
  }
  // le studio de radio, sur la grande tour : sol, murs pleins, régie, micro, fauteuil ; les vitres vont dans `verre`
  const e = ETUDE;
  const y0 = e.roof + 1.15;
  b.dans([e.cx, y0, e.cz], 0, () => {
    b.boite([0, -0.05, 0], [e.w + 0.6, 0.3, e.d + 0.6], "#17131F");
    b.boite([0, 0.12, 0], [e.w, 0.1, e.d], "#6B2BD9");
    b.boite([0, 5.5, 0], [e.w + 0.8, 0.5, e.d + 0.8], "#17131F"); // plafond
    b.boite([0, 5.8, 0], [e.w - 2, 0.3, e.d - 2], "#E4208C");
    // fond (côté -z) : mousse acoustique
    b.boite([0, 2.8, -e.d / 2 + 0.1], [e.w, 5.4, 0.3], "#1B1230");
    for (let i = 0; i < 10; i++) for (let j = 0; j < 3; j++) b.boite([-6.4 + i * 1.42, 1.4 + j * 1.5, -e.d / 2 + 0.34], [1.2, 1.2, 0.3], (i + j) % 2 ? "#E4208C" : "#4B1B9A");
    // montants d'angle
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.boite([sx * (e.w / 2), 2.8, sz * (e.d / 2)], [0.4, 5.4, 0.4], "#FFC21A");
    // régie : grand bureau en U, console lumineuse
    b.boite([0, 0.55, 1.9], [8.0, 1.0, 1.6], "#2B2B33");
    b.boite([0, 1.08, 1.9], [8.4, 0.16, 1.9], "#FFC21A");
    for (let i = 0; i < 14; i++) b.boite([-3.5 + i * 0.54, 1.22, 1.8], [0.26, 0.12, 0.9], i % 3 === 0 ? "#3EE08A" : i % 3 === 1 ? "#FFC21A" : "#E4208C", undefined, 2);
    b.boite([-3.4, 1.5, 2.3], [1.4, 0.7, 0.1], "#12B76A", [-0.3, 0, 0], 1.8); // écran
    // bras de micro, filtre anti-pop
    b.boite([1.2, 2.3, 1.5], [0.12, 2.4, 0.12], "#9AA5B3", [0, 0, 0.3]);
    b.cylindre([0.9, 2.9, 1.1], 0.28, 0.5, "#17131F", 10);
    b.boite([0.9, 3.2, 1.25], [0.7, 0.7, 0.06], "#F4F1EA", [0.4, 0, 0]);
    // fauteuil (le DJ tourne le dos au fond et regarde la ville)
    b.boite([0, 0.9, -0.6], [1.5, 0.3, 1.4], "#E4208C");
    b.boite([0, 1.7, -1.3], [1.5, 1.6, 0.3], "#E4208C");
    b.cylindre([0, 0.15, -0.6], 0.2, 0.7, "#2B2B33", 8);
    // bandes lumineuses
    b.boite([0, 5.2, 0], [e.w - 1.4, 0.1, 0.3], "#FFFFFF", undefined, 2.4);
  });
  // vitres du studio
  const v = (p: V3, s: V3) => verre.boite(p, s, "#CDF4FF");
  verre.dans([e.cx, y0, e.cz], 0, () => {
    v([0, 2.7, e.d / 2], [e.w, 5.2, 0.06]);
    v([-e.w / 2, 2.7, 0], [0.06, 5.2, e.d]);
    v([e.w / 2, 2.7, 0], [0.06, 5.2, e.d]);
  });
}

// ------------------------------------------------------------------ Propriété : château d'or, villa, yacht, ville lointaine
export const CHATEAU = { z: 58, balconY: 14.2, balconZ: 63 };
export const VILLA: V3 = [-120, 0, 40];
export const YACHT: V3 = [138, 0, 40];
export const VILLE_LOIN: V3 = [0, 0, 330];
function chateau(b: Batisseur) {
  const or = "#F2BE2C";
  const orC = "#FFD54A";
  b.dans([0, 0, 0], 0, () => {
    // corps principal
    b.boite([0, 12, 45], [60, 24, 26], or);
    for (let y = 3; y < 24; y += 4) b.boite([0, y, CHATEAU.z + 0.06], [60.2, 0.5, 0.2], orC);
    b.boite([0, 0.6, 45], [62, 1.2, 28], "#D9A21B");
    // créneaux
    for (let x = -29; x <= 29; x += 3) b.boite([x, 25, CHATEAU.z - 0.4], [1.6, 2.0, 1.4], orC);
    for (let x = -29; x <= 29; x += 3) b.boite([x, 25, 32.4], [1.6, 2.0, 1.4], orC);
    // donjon central
    b.boite([0, 24, 46], [22, 26, 20], or);
    for (let y = 8; y < 36; y += 4) b.boite([0, y, 46 + 10.06], [22.2, 0.5, 0.2], orC);
    for (let x = -10; x <= 10; x += 2.5) b.boite([x, 38, 55.5], [1.4, 1.8, 1.2], orC);
    b.cone([0, 37, 46], 17, 16, K(COUL.magenta), 4, Math.PI / 4);
    b.cylindre([0, 52.5, 46], 0.18, 7, "#2B2B33", 6);
    b.boite([1.6, 57.5, 46], [3.2, 2, 0.1], K(COUL.rouge));
    // tours d'angle
    for (const [x, z, h] of [[-31, CHATEAU.z, 38], [31, CHATEAU.z, 38], [-31, 32, 46], [31, 32, 46]] as Array<[number, number, number]>) {
      b.cylindre([x, 0, z], 6.2, h, or, 12);
      for (let y = 5; y < h; y += 5) b.cylindre([x, y, z], 6.4, 0.5, orC, 12);
      b.cylindre([x, h, z], 7.2, 1.2, orC, 12);
      b.cone([x, h + 1.2, z], 8.2, 13, K(COUL.magenta), 10, 0);
      b.boule([x, h + 15, z], [1.1, 1.1, 1.1], "#FFE27A", 1);
      for (let k = 0; k < 3; k++) b.boite([x, 12 + k * 9, z + 6.25], [1.6, 3.2, 0.2], "#2B3A6B", undefined, 1.3);
    }
    // portail et perron
    b.boite([0, 5, CHATEAU.z + 0.02], [10, 10, 0.5], "#4A2A10");
    b.boite([0, 10.6, CHATEAU.z + 0.1], [11, 1.2, 0.8], orC);
    b.boite([0, 5, CHATEAU.z + 0.3], [9.4, 9.6, 0.1], "#7A4A28");
    b.boite([0, 5.0, CHATEAU.z + 0.4], [0.16, 9.6, 0.1], "#FFC21A");
    for (let i = 0; i < 6; i++) b.boite([0, 0.2 + i * 0.22, CHATEAU.z + 1.8 + (5 - i) * 0.9], [18 - i * 1.4, 0.44, 1.0], i % 2 ? "#FFF1CF" : "#EAD9A6");
    // fenêtres
    for (const y of [8.5, 17.5]) {
      for (const x of [-22, -16, -10, 10, 16, 22]) {
        b.boite([x, y, CHATEAU.z + 0.03], [2.2, 3.6, 0.1], "#2B3A6B", undefined, 1.4);
        b.boite([x, y + 2.2, CHATEAU.z + 0.1], [2.8, 0.7, 0.16], orC);
        b.boite([x, y, CHATEAU.z + 0.1], [0.14, 3.6, 0.14], orC);
      }
    }
    // balcon : dalle, balustrade, portes-fenêtres derrière
    const bz = CHATEAU.balconZ;
    b.boite([0, CHATEAU.balconY - 0.3, bz - 0.5], [15, 0.7, 8], orC);
    b.boite([0, CHATEAU.balconY - 1.7, bz - 0.5], [14, 2.1, 7], "#D9A21B");
    for (const x of [-6, 6]) b.boite([x, CHATEAU.balconY - 5, bz + 1.5], [0.9, 8.8, 0.9], orC);
    for (let i = -7; i <= 7; i++) b.boite([i * 0.97, CHATEAU.balconY + 0.55, bz + 3.3], [0.22, 1.0, 0.22], "#FFE9A6");
    b.boite([0, CHATEAU.balconY + 1.2, bz + 3.3], [15, 0.28, 0.5], "#FFF1CF");
    for (const s of [-1, 1]) {
      b.boite([s * 7.2, CHATEAU.balconY + 0.55, bz - 0.5], [0.4, 1.0, 7.6], "#FFE9A6");
      b.boite([s * 7.2, CHATEAU.balconY + 1.2, bz - 0.5], [0.5, 0.28, 8], "#FFF1CF");
    }
    b.boite([0, CHATEAU.balconY + 3.2, CHATEAU.z + 0.08], [7, 6.4, 0.2], "#17131F");
    b.boite([-1.8, CHATEAU.balconY + 3.2, CHATEAU.z + 0.2], [3.2, 6.0, 0.12], "#3A4A8A", undefined, 1.3);
    b.boite([1.8, CHATEAU.balconY + 3.2, CHATEAU.z + 0.2], [3.2, 6.0, 0.12], "#3A4A8A", undefined, 1.3);
    // drapeaux
    for (const s of [-1, 1]) {
      b.cylindre([s * 31, 51, CHATEAU.z], 0.15, 6, "#2B2B33", 6);
      b.boite([s * 31 + 1.4, 55, CHATEAU.z], [2.8, 1.8, 0.1], K(COUL.rouge));
    }
  });
}

function prop(b: Batisseur, grise: boolean) {
  // pelouse en bandes, allée de gravier, fontaine
  b.boite([0, -0.5, 100], [900, 1, 700], K("#0FA64A"));
  for (let i = -8; i < 12; i++) b.boite([0, 0.02, i * 12 + 60], [300, 0.04, 6], K("#17B856"));
  b.boite([0, 0.06, 98], [14, 0.1, 80], K("#F2E3BC"));
  b.boite([0, 0.07, 150], [14, 0.1, 180], K("#F2E3BC"));
  b.cylindre([0, 0.1, 100], 7.5, 1.1, K("#FFF1CF"), 20);
  b.cylindre([0, 1.1, 100], 6.4, 0.2, K("#1EA6F0"), 20);
  b.cylindre([0, 0.5, 100], 1.0, 4.4, K("#FFF1CF"), 8);
  b.cylindre([0, 4.7, 100], 3.0, 0.6, K("#FFF1CF"), 12);
  chateau(b);
  // haies et allée d'arbres
  for (const s of [-1, 1]) {
    for (let z = 74; z < 240; z += 12) {
      b.boite([s * 9.0, 1.4, z], [1.6, 2.8, 1.6], K("#7A4A28"));
      b.boite([s * 9.0, 4.4, z], [4.2, 3.6, 4.2], K("#22C55E"));
      b.boite([s * 9.0, 6.6, z], [2.8, 1.6, 2.8], K("#4ADE80"));
    }
    b.boite([s * 16, 0.7, 86], [1.6, 1.4, 22], K("#0B8E3E"));
  }
  // villa moderne à gauche
  b.dans(VILLA, 0.35, () => {
    b.boite([0, 4, 0], [34, 8, 16], K("#FFFFFF"));
    b.boite([-6, 11, -1], [20, 6, 12], K("#F4F1EA"));
    b.boite([0, 8.2, 3], [38, 0.7, 24], K("#E8E2D0"));
    b.boite([-6, 14.2, 3], [26, 0.7, 18], K("#E8E2D0"));
    for (let i = -3; i <= 3; i++) b.boite([i * 4.6, 3.6, 8.04], [3.8, 5.0, 0.1], K("#48C2FF"), undefined, 1.5);
    for (let i = -2; i <= 2; i++) b.boite([-6 + i * 4.6, 11, 5.04], [3.8, 3.6, 0.1], K("#48C2FF"), undefined, 1.5);
    b.boite([-12, 1.0, 22], [16, 0.5, 20], K("#F2E3BC"));
    b.boite([-12, 1.12, 22], [11, 0.3, 14], K("#18B6E8"), undefined, 1.5); // piscine
    b.boite([-12, 1.0, 11.0], [16, 0.5, 4], K("#F2E3BC"));
    for (let i = 0; i < 3; i++) b.boite([-3, 1.4, 8 + i * 2.2], [1.4, 0.4, 0.8], COUL.or);
    b.boite([6, 1.2, 10], [3.0, 0.2, 5], K("#B8742E"));
    // palmiers
    for (const [x, z] of [[8, 14], [-26, 12], [-26, 22], [10, 22]] as Array<[number, number]>) {
      b.boite([x, 3.4, z], [0.7, 6.8, 0.7], K("#8A5A36"), [0, 0, 0.1]);
      for (let k = 0; k < 6; k++) b.boite([x + Math.cos(k * 1.05) * 1.6, 7.0, z + Math.sin(k * 1.05) * 1.6], [3.4, 0.2, 0.9], K("#18B65A"), [0, -k * 1.05, 0.25]);
    }
  });
  // mer, plage, ponton, yacht
  b.boite([90, 0.0, 40], [14, 0.14, 400], K("#F5E3A8"));
  b.boite([300, -0.25, 40], [420, 0.3, 560], K("#0E8FE0"));
  for (let i = 0; i < 18; i++) b.boite([120 + i * 14, -0.05, -120 + ((i * 53) % 280)], [8, 0.04, 0.6], K("#7FD0FF"));
  b.boite([110, 0.5, 40], [34, 0.6, 3.6], K("#9A6A3E"));
  for (let i = 0; i < 9; i++) b.boite([96 + i * 3.8, 0.1, 40], [0.4, 1.0, 3.8], K("#7A4A28"));
  b.dans(YACHT, 0, () => {
    // coque tournée vers -x (flanc visible depuis le ponton), longueur le long de z
    b.boite([0, 1.6, 0], [10, 3.2, 42], "#FFFFFF");
    b.boite([0, 2.4, 0], [10.2, 0.5, 42], COUL.or);
    b.boite([0, 0.1, 0], [8.6, 0.6, 38], K("#13355E"));
    b.boite([0, 1.6, -22.5], [7, 3.2, 6], "#FFFFFF", [0, 0.55, 0]);
    b.boite([0, 1.6, -22.5], [7, 3.2, 6], "#FFFFFF", [0, -0.55, 0]);
    b.boite([0, 1.6, 21.5], [9, 3.2, 3], "#FFFFFF");
    b.boite([0, 4.4, 2], [8.2, 2.6, 24], "#FFFFFF");
    b.boite([0, 5.8, 2], [8.6, 0.4, 25], COUL.or);
    b.boite([0, 7.2, 4], [6.4, 2.6, 16], "#FFFFFF");
    b.boite([0, 8.7, 4], [6.8, 0.4, 17], COUL.or);
    for (let i = 0; i < 8; i++) b.boite([-4.16, 4.4, -8 + i * 3], [0.08, 1.2, 2.2], K("#2B3A6B"), undefined, 1.4);
    for (let i = 0; i < 5; i++) b.boite([-3.4, 7.2, -2 + i * 3], [0.08, 1.2, 2.2], K("#2B3A6B"), undefined, 1.4);
    b.boite([0, 9.2, -2], [0.4, 3.4, 0.4], "#2B2B33");
    b.boite([0, 10.9, -2], [3.4, 0.3, 0.3], "#2B2B33");
    b.cylindre([0, 8.9, 10], 0.2, 7, "#9AA5B3", 6);
    b.boite([1.1, 15, 10], [2.2, 1.4, 0.1], COUL.magenta);
    // jacuzzi sur le pont arrière
    b.boite([0, 5.9, 12.5], [4.4, 0.5, 4.4], "#FFFFFF");
    b.boite([0, 6.2, 12.5], [3.6, 0.2, 3.6], K("#48C2FF"), undefined, 1.6);
  });
  // la ville au loin : blocs vifs ou gris
  b.dans(VILLE_LOIN, 0, () => {
    const cols = ["#FFB300", "#E4208C", "#0FB36B", "#FF7A1A", "#1E88E5", "#C4122F", "#6B2BD9", "#11A98E"];
    for (let i = 0; i < 64; i++) {
      const x = ((i % 8) - 3.5) * 24 + ((i * 7) % 5);
      const z = (Math.floor(i / 8) - 3.5) * 22 + ((i * 3) % 4);
      const h = 7 + ((i * 11) % 17);
      b.boite([x, h / 2, z], [14 + (i % 3) * 3, h, 12 + (i % 4) * 2], K(cols[i % cols.length]));
      b.boite([x, h + 0.25, z], [15 + (i % 3) * 3, 0.5, 13 + (i % 4) * 2], K("#FFF1CF"));
    }
    b.boite([0, 0.04, 0], [240, 0.1, 5], K("#2B2B33"));
    b.boite([0, 0.04, 0], [5, 0.1, 240], K("#2B2B33"));
    // la tour de l'horloge, au milieu
    b.boite([0, 18, 0], [10, 36, 10], K("#FFF1CF"));
    b.cone([0, 36, 0], 7.6, 8, K("#C4122F"), 4, Math.PI / 4);
  });
  for (const [x, z, r, h] of [[-300, 500, 120, 44], [300, 560, 130, 50], [-420, 200, 110, 40], [0, 700, 140, 54]] as Array<[number, number, number, number]>) b.cone([x, -0.2, z], r, h, K("#34C06A"), 7, x);
  void grise;
}

// ------------------------------------------------------------------ Assemblage
export type Zones = {
  rue: THREE.BufferGeometry;
  ruine: THREE.BufferGeometry;
  stade: THREE.BufferGeometry;
  toits: THREE.BufferGeometry;
  toitsVerre: THREE.BufferGeometry;
  propVive: THREE.BufferGeometry;
  propGrise: THREE.BufferGeometry;
};
export function construirePrenomargent(): Zones {
  SAT = 1;
  const r = new Batisseur(false);
  rue(r, false);
  SAT = 0.18;
  const u = new Batisseur(false);
  rue(u, true);
  SAT = 1;
  const s = new Batisseur(false);
  stade(s);
  const t = new Batisseur(false);
  const tv = new Batisseur(true);
  toits(t, tv);
  const pv = new Batisseur(false);
  prop(pv, false);
  SAT = 0.08;
  const pg = new Batisseur(false);
  prop(pg, true);
  SAT = 1;
  return { rue: r.construire(), ruine: u.construire(), stade: s.construire(), toits: t.construire(), toitsVerre: tv.construire(), propVive: pv.construire(), propGrise: pg.construire() };
}
