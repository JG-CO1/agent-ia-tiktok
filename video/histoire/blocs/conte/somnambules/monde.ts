/**
 * La ville des somnambules — décors fixes (blocs, ombrage cuit par face). Quatre lieux éloignés les uns des autres
 * (la caméra ne voit que celui où elle se trouve) :
 *   VILLE    (0, 0, 0)     avenue nocturne bordée de douze maisons dont les portes vont s'ouvrir
 *   MONT     (400, 0, 0)   sentier, montagne, entrée du tunnel, rocher où se cacher
 *   MAISON   (-400, 0, 0)  chambre du narrateur (fenêtre sur la rue) ; salon des souvenirs à +60 en x
 *   TUNNEL   (0, 0, 400)   galerie creusée, bois de soutènement, mur de terre, porte métallique
 */
import * as THREE from "three";
import { Batisseur, versMonde, type V3 } from "../../geo";
import { K, arbre, buisson, lampadaire, maisonSimple, sapin } from "../../minuit/monde";

export const VILLE: V3 = [0, 0, 0];
export const MONT: V3 = [400, 0, 0];
export const MAISON: V3 = [-400, 0, 0];
export const SALON: V3 = [-340, 0, 0];
export const TUNNEL: V3 = [0, 0, 400];
const SOL = 0.3;

export type MaisonDef = { p: V3; ry: number; mur: string; toit: string; porteC: string; porteX: number };
const m = (x: number, z: number, cote: 1 | -1, mur: string, toit: string, porteC: string): MaisonDef => ({ p: [x, 0, z], ry: cote > 0 ? Math.PI / 2 : -Math.PI / 2, mur, toit, porteC, porteX: cote > 0 ? -2.2 : 2.2 });
// côté gauche (x < 0) : façade vers +x ; côté droit (x > 0) : façade vers -x
export const MAISONS: MaisonDef[] = [
  ...[34, 18, 2, -14, -30, -46].map((z, i) => m(-10.5, z, 1, ["#C9B79B", "#AEB9C9", "#D2C2A3", "#B7C7B0", "#C4AEB2", "#CDBFA0"][i], ["#5A3B30", "#3B4A63", "#5E4A3A", "#3E5446", "#4E3B4F", "#4F4136"][i], ["#5E7F5A", "#7A4A35", "#3A526B", "#7C4636", "#4E6B7A", "#6B3F3F"][i])),
  ...[34, 18, 2, -14, -30, -46].map((z, i) => m(10.5, z, -1, ["#D4C5A8", "#B8B2C4", "#C7B9A4", "#AFC0BE", "#CDB6A6", "#BFC4A8"][i], ["#4A3A55", "#5B3D38", "#37505C", "#5D4636", "#3F3F5E", "#55443A"][i], ["#6B3F3F", "#3A526B", "#5E7F5A", "#7A4A35", "#6B3F3F", "#3A526B"][i])),
];
/** Porte d'une maison dans le monde : [x, y, z] du seuil et lacet de la façade. */
export const seuil = (md: MaisonDef, dz = 0): V3 => versMonde(md.p, md.ry, [md.porteX, 0, dz]);

export type Zones = { ville: THREE.BufferGeometry; mont: THREE.BufferGeometry; maison: THREE.BufferGeometry; salon: THREE.BufferGeometry; tunnel: THREE.BufferGeometry };

function rochers(b: Batisseur, c: V3, n: number, s: number, couleur = "#4B4F5C") {
  for (let i = 0; i < n; i++) {
    const a = i * 2.4;
    b.boite([c[0] + Math.sin(a) * s * 0.9, c[1] + 0.6 * s, c[2] + Math.cos(a * 1.3) * s * 0.7], [s * (1.2 + (i % 3) * 0.3), s * (1 + (i % 2) * 0.5), s * (1.1 + ((i + 1) % 3) * 0.25)], couleur, [0, a, 0], 0.9 + (i % 3) * 0.1);
  }
}
function arbreMort(b: Batisseur, x: number, z: number, s = 1) {
  b.boite([x, 1.6 * s, z], [0.4 * s, 3.2 * s, 0.4 * s], "#2C2622");
  b.boite([x + 0.5 * s, 2.7 * s, z], [1.2 * s, 0.22 * s, 0.22 * s], "#2C2622", [0, 0, 0.5]);
  b.boite([x - 0.5 * s, 3.1 * s, z], [1.1 * s, 0.2 * s, 0.2 * s], "#2C2622", [0, 0, -0.6]);
  b.boite([x, 3.6 * s, z + 0.3 * s], [0.9 * s, 0.18 * s, 0.18 * s], "#2C2622", [0.5, 0, 0.2]);
}

// ------------------------------------------------------------------ Ville
function ville(b: Batisseur) {
  b.boite([0, -0.5, -20], [600, 1, 600], "#2F4A3A");
  b.boite([0, -0.07, -25], [8, 0.2, 170], "#5B5F68");
  for (const s of [-1, 1]) {
    b.boite([s * 4.9, 0.07, -25], [1.8, 0.14, 170], "#8B8F99");
    b.boite([s * 4.0, 0.08, -25], [0.14, 0.16, 170], "#A5A9B3", undefined, 1.1);
  }
  for (const md of MAISONS) {
    b.dans(md.p, md.ry, () => {
      maisonSimple(b, { w: 9, d: 7.5, h: 4.4, mur: md.mur, toit: md.toit, porteX: md.porteX, porteC: md.porteC, fen: [{ x: -md.porteX * 0.7, w: 2.2 }], volets: md.toit, cheminee: -md.porteX });
      b.boite([md.porteX, 0.05, 3.2], [1.5, 0.08, 4.6], "#7C7F88");
      buisson(b, [-md.porteX * 1.8, 0, 0.8], 0.8);
    });
  }
  for (let z = 52; z > -88; z -= 16) {
    lampadaire(b, [-5.6, 0, z], Math.PI / 2);
    lampadaire(b, [5.6, 0, z - 8], -Math.PI / 2);
  }
  const arbres: Array<[number, number]> = [[-18, 40], [19, 28], [-22, 6], [22, -8], [-19, -22], [20, -38], [-23, -50], [22, -58], [-16, 52], [17, 50]];
  arbres.forEach(([x, z], i) => (i % 3 === 2 ? arbreMort(b, x, z, 1.3) : arbre(b, x, z, 1.1, i)));
  for (const [x, z] of [[-34, -70], [34, -74], [-40, 20], [42, 10], [-30, -100], [30, -104]] as Array<[number, number]>) sapin(b, x, z, 1.7);
  // la montagne au bout de l'avenue, énorme et noire
  b.cone([-40, -0.2, -170], 70, 80, "#262B38", 7, 0.3);
  b.cone([30, -0.2, -190], 90, 105, "#20242F", 7, 0.9);
  b.cone([100, -0.2, -160], 60, 62, "#2A2F3D", 7, 0.1);
  b.cone([-120, -0.2, -140], 55, 58, "#2A2F3D", 7, 0.6);
}

// ------------------------------------------------------------------ Montagne et tunnel
function montagne(b: Batisseur) {
  const [X] = MONT;
  b.boite([X, -0.5, 0], [500, 1, 500], "#38483A");
  // sentier de terre
  b.boite([X, 0.04, 8], [7, 0.08, 78], "#6A5A44");
  b.boite([X, 0.05, -22], [10, 0.1, 6], "#5A4C3A");
  // falaise et tunnel : deux piliers, linteau en rondins, bouche noire
  b.boite([X, 11, -33], [60, 22, 14], "#4F5360");
  b.boite([X - 24, 6, -26], [14, 12, 9], "#555967", [0, 0.2, 0]);
  b.boite([X + 24, 7, -27], [14, 14, 9], "#555967", [0, -0.25, 0]);
  b.boite([X - 5.6, 4.2, -27], [2.6, 8.4, 3], "#5E6371");
  b.boite([X + 5.6, 4.2, -27], [2.6, 8.4, 3], "#5E6371");
  b.boite([X, 8.8, -27], [14.2, 1.8, 3.4], "#5E6371");
  b.boite([X - 4.2, 3.6, -25.6], [0.6, 7.4, 0.6], "#5B4026");
  b.boite([X + 4.2, 3.6, -25.6], [0.6, 7.4, 0.6], "#5B4026");
  b.boite([X, 7.5, -25.6], [9.4, 0.6, 0.6], "#5B4026");
  b.boite([X, 3.8, -30], [8.2, 7.6, 7], "#020203"); // la bouche du tunnel : noir absolu
  b.boite([X, 0.04, -30], [8, 0.1, 8], "#26201A");
  // la montagne derrière
  b.cone([X - 30, -0.2, -90], 70, 70, "#3B3F4C", 7, 0.2);
  b.cone([X + 28, -0.2, -100], 80, 88, "#343845", 7, 0.8);
  b.cone([X + 90, -0.2, -60], 50, 52, "#3F4351", 7, 0.4);
  b.cone([X - 100, -0.2, -50], 52, 50, "#3F4351", 7, 0.1);
  // terre excavée près de la bouche, rochers, rocher de cachette
  for (const [dx, dz, s] of [[-9, -22, 1.2], [8.5, -21, 1.0], [-12, -18, 0.8], [11, -17, 0.9]] as Array<[number, number, number]>) b.boite([X + dx, 0.35 * s, dz], [3 * s, 0.7 * s, 2 * s], "#4A3B2B", [0, dx, 0]);
  b.boite([X + 8.2, 1.4, -19.5], [3.6, 2.8, 3], "#4D515F", [0, 0.3, 0]); // le grand rocher
  b.boite([X + 9.6, 0.8, -17.6], [2.2, 1.6, 2], "#555967", [0, 0.9, 0]);
  rochers(b, [X + 16, 0, 6], 5, 1.6);
  rochers(b, [X - 17, 0, -6], 4, 1.8);
  for (const [dx, dz] of [[-14, 24], [15, 18], [-16, 4], [18, -4], [-20, -14]] as Array<[number, number]>) arbreMort(b, X + dx, dz, 1.2);
  for (const [dx, dz] of [[-24, 30], [26, 26], [-32, 10], [34, 2]] as Array<[number, number]>) sapin(b, X + dx, dz, 1.6);
  // poteaux à lanterne de part et d'autre de la bouche
  for (const s of [-1, 1]) {
    b.boite([X + s * 7.4, 1.6, -22], [0.2, 3.2, 0.2], "#4A3622");
    b.boite([X + s * 7.0, 3.2, -22], [0.9, 0.16, 0.16], "#4A3622");
  }
}

// ------------------------------------------------------------------ Chambre du narrateur (et la rue derrière la fenêtre)
export const FENETRE = { x0: -1.7, x1: 1.7, y0: 1.2, y1: 3.1 };
function chambre(b: Batisseur) {
  const [X] = MAISON;
  const W = 4.2;
  const Z = 4.6;
  const H = 3.6;
  b.boite([X, 0.04, 0], [W * 2, 0.08, Z * 2], "#6A4E36"); // parquet
  for (let i = -3; i <= 3; i++) b.boite([X + i * 1.2, 0.09, 0], [0.05, 0.02, Z * 2], "#4B3825");
  b.boite([X, H + 0.1, 0], [W * 2 + 0.6, 0.2, Z * 2 + 0.6], "#2A2E3F"); // plafond
  const mur = "#4D5B7C";
  b.boite([X - W - 0.15, H / 2, 0], [0.3, H, Z * 2 + 0.6], mur);
  b.boite([X + W + 0.15, H / 2, 0], [0.3, H, Z * 2 + 0.6], mur);
  b.boite([X, H / 2, Z + 0.15], [W * 2 + 0.6, H, 0.3], mur);
  // mur du fond (z = -Z) percé de la fenêtre
  const zf = -Z - 0.15;
  const f = FENETRE;
  b.boite([X + (-W + f.x0) / 2 - 0.15, H / 2, zf], [W + f.x0 + 0.3, H, 0.3], mur);
  b.boite([X + (W + f.x1) / 2 + 0.15, H / 2, zf], [W - f.x1 + 0.3, H, 0.3], mur);
  b.boite([X, (f.y0 + 0) / 2, zf], [f.x1 - f.x0, f.y0, 0.3], mur);
  b.boite([X, (f.y1 + H) / 2, zf], [f.x1 - f.x0, H - f.y1, 0.3], mur);
  // cadre et appui
  b.boite([X, f.y0 - 0.08, zf + 0.12], [f.x1 - f.x0 + 0.5, 0.16, 0.5], "#D6D2C8");
  b.boite([X, f.y1 + 0.1, zf + 0.05], [f.x1 - f.x0 + 0.4, 0.2, 0.3], "#D6D2C8");
  b.boite([X, (f.y0 + f.y1) / 2, zf], [0.1, f.y1 - f.y0, 0.1], "#D6D2C8");
  b.boite([X, (f.y0 + f.y1) / 2 + 0.2, zf], [f.x1 - f.x0, 0.1, 0.1], "#D6D2C8");
  // rideaux
  b.boite([X - 2.25, 2.1, zf + 0.35], [0.7, 2.9, 0.2], "#7A3B4A");
  b.boite([X + 2.25, 2.1, zf + 0.35], [0.7, 2.9, 0.2], "#7A3B4A");
  // lit contre le mur de gauche, pied vers la fenêtre
  b.boite([X - 2.6, 0.45, 0.4], [2.3, 0.5, 4.6], "#6B4A2F");
  b.boite([X - 2.6, 0.82, 0.5], [2.1, 0.32, 4.3], "#D8DCE8");
  b.boite([X - 2.6, 1.05, -1.1], [1.3, 0.2, 0.85], "#F2F2F2");
  b.boite([X - 2.6, 1.08, 1.4], [2.1, 0.22, 2.4], "#3D5A9C");
  b.boite([X - 2.6, 1.3, 2.8], [2.3, 1.7, 0.2], "#6B4A2F"); // tête de lit côté porte
  // table de chevet + bougie, bureau, tapis, armoire
  b.boite([X - 3.7, 0.5, -1.6], [0.9, 1.0, 0.9], "#5B4026");
  b.boite([X + 3.5, 0.9, 1.5], [1.4, 0.18, 2.6], "#5B4026");
  for (const dz of [0.4, 2.6]) for (const dx of [2.9, 4.0]) b.boite([X + dx, 0.45, dz], [0.14, 0.9, 0.14], "#4A3622");
  b.boite([X + 1.0, 0.07, 0.6], [3.0, 0.04, 2.2], "#7A3B4A");
  b.boite([X + 3.6, 1.9, 3.8], [1.6, 3.8, 1.0], "#3F2F22");
  b.boite([X, 1.9, Z - 0.05], [1.5, 3.1, 0.1], "#4A3622"); // porte (côté intérieur)
  b.boite([X + 0.5, 1.8, Z - 0.12], [0.16, 0.16, 0.12], "#D5AF55");
  // dehors : la rue sous la lune (le trottoir, la chaussée, les maisons d'en face)
  b.boite([X, -0.5, -40], [400, 1, 120], "#2F4A3A");
  b.boite([X, -0.06, -14], [140, 0.2, 7], "#5B5F68");
  b.boite([X, 0.06, -10.2], [140, 0.14, 1.6], "#8B8F99");
  for (let i = -5; i <= 5; i++) {
    const x = X + i * 12;
    b.dans([x, 0, -26], 0, () => maisonSimple(b, { w: 9, d: 7.5, h: 4.4, mur: ["#C9B79B", "#AEB9C9", "#D2C2A3"][(i + 5) % 3], toit: ["#5A3B30", "#3B4A63", "#5E4A3A"][(i + 5) % 3], porteX: 2.2, porteC: "#5E7F5A", fen: [{ x: -1.6, w: 2.2 }], volets: "#3B4A63", cheminee: -2.4 }));
  }
  for (const dx of [-30, -8, 16, 34]) arbre(b, X + dx, -17.5, 1.1, dx);
  b.cone([X - 80, -0.2, -120], 60, 60, "#262B38", 7, 0.3);
  b.cone([X + 70, -0.2, -130], 70, 70, "#20242F", 7, 0.8);
}

// ------------------------------------------------------------------ Salon des souvenirs (concours de regards)
function salon(b: Batisseur) {
  const [X] = SALON;
  const W = 5;
  const Z = 4.6;
  const H = 3.6;
  b.boite([X, 0.04, 0], [W * 2, 0.08, Z * 2], "#8A6A48");
  b.boite([X, H + 0.1, 0], [W * 2 + 0.6, 0.2, Z * 2 + 0.6], "#D9CDB8");
  const mur = "#C8A478";
  for (const [x, z, sx, sz] of [[-W - 0.15, 0, 0.3, Z * 2 + 0.6], [W + 0.15, 0, 0.3, Z * 2 + 0.6], [0, -Z - 0.15, W * 2 + 0.6, 0.3], [0, Z + 0.15, W * 2 + 0.6, 0.3]] as Array<[number, number, number, number]>) b.boite([X + x, H / 2, z], [sx, H, sz], mur);
  b.boite([X, 0.07, 0], [5.6, 0.04, 4.4], "#8E4B3C"); // tapis
  // table ronde carrée, deux chaises face à face
  b.boite([X, 1.5, 0], [2.6, 0.18, 2.2], "#5B4026");
  for (const dx of [-1.1, 1.1]) for (const dz of [-0.9, 0.9]) b.boite([X + dx, 0.75, dz], [0.16, 1.5, 0.16], "#4A3622");
  for (const s of [-1, 1]) {
    b.boite([X, 0.8, s * 2.2], [1.3, 0.16, 1.1], "#6B4A2F");
    b.boite([X, 1.6, s * 2.75], [1.3, 1.6, 0.14], "#6B4A2F");
    for (const dx of [-0.55, 0.55]) for (const dz of [-0.45, 0.45]) b.boite([X + dx, 0.4, s * 2.2 + dz], [0.12, 0.8, 0.12], "#4A3622");
  }
  // canapé, étagère, cadre, lampe
  b.boite([X - 3.6, 0.6, -2.6], [1.6, 1.2, 3.4], "#7A4A3A");
  b.boite([X - 4.3, 1.4, -2.6], [0.4, 1.4, 3.4], "#7A4A3A");
  b.boite([X + 4.4, 1.8, -2.2], [0.7, 3.6, 3.2], "#4A3622");
  for (let i = 0; i < 4; i++) b.boite([X + 4.1, 0.7 + i * 0.85, -2.2], [0.3, 0.12, 3.0], "#6B4A2F");
  b.boite([X, 2.3, -Z + 0.05], [2.2, 1.5, 0.1], "#4A3622");
  b.boite([X, 2.3, -Z + 0.1], [1.9, 1.2, 0.06], "#C9B38A");
}

// ------------------------------------------------------------------ Galerie creusée et porte métallique
export const PORTE_Z = 360;
function tunnel(b: Batisseur) {
  const [, , Z0] = TUNNEL;
  const L = 44;
  const zc = Z0 - L / 2 + 4;
  b.boite([0, -0.05, zc], [9, 0.1, L], "#3A2E22");
  b.boite([-5.6, 3.6, zc], [2.4, 7.2, L], "#3E3128");
  b.boite([5.6, 3.6, zc], [2.4, 7.2, L], "#3E3128");
  b.boite([0, 7.5, zc], [13, 1.2, L], "#2E241C");
  for (let z = Z0 + 1; z > PORTE_Z + 2; z -= 5) {
    b.boite([-4.1, 3.4, z], [0.5, 6.8, 0.5], "#6B4A2F");
    b.boite([4.1, 3.4, z], [0.5, 6.8, 0.5], "#6B4A2F");
    b.boite([0, 6.9, z], [8.7, 0.5, 0.5], "#6B4A2F");
  }
  // gravats sur le sol, brouettes de terre
  for (const [x, z, s] of [[-3, 388, 1.3], [3.2, 380, 1.1], [-3.4, 372, 1.0], [3, 366, 0.9]] as Array<[number, number, number]>) b.boite([x, 0.4 * s, z], [2.2 * s, 0.8 * s, 1.6 * s], "#4A3B2B", [0, x, 0]);
  // le fond : la porte de métal, son cadre, ses rivets, sa poignée
  const zp = PORTE_Z;
  b.boite([0, 3.6, zp - 0.8], [11, 7.2, 1.4], "#2E241C");
  b.boite([0, 3.6, zp - 0.1], [7.6, 7.6, 0.9], "#39424C");
  b.boite([0, 3.3, zp + 0.3], [6.2, 6.6, 0.4], "#6B7886");
  for (const dx of [-2.6, 0, 2.6]) for (const dy of [0.6, 2.2, 3.8, 5.4]) b.boite([dx, dy, zp + 0.55], [0.3, 0.3, 0.2], "#8C98A6");
  b.boite([0, 3.3, zp + 0.55], [0.18, 6.4, 0.12], "#4C5660");
}

export function construireSomnambules(): Zones {
  const v = new Batisseur(false);
  ville(v);
  const mo = new Batisseur(false);
  montagne(mo);
  const c = new Batisseur(true);
  chambre(c);
  const s = new Batisseur(true);
  salon(s);
  const t = new Batisseur(true);
  tunnel(t);
  return { ville: v.construire(), mont: mo.construire(), maison: c.construire(), salon: s.construire(), tunnel: t.construire() };
}
void K;
