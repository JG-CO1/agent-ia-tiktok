/**
 * « Tout ce que j'envoie par message devient réel… » — décors fixes en blocs (ombrage cuit par face), univers pastel
 * saturé qui se fait réécrire par les messages. Quatre lieux éloignés les uns des autres (la caméra ne voit que celui
 * où elle se trouve) :
 *   RUE      (0, 0, 0)       rue de quartier (maisons pastel, boulangerie et maison de Mme Lopes = édifices dynamiques),
 *                            en deux états : normal et ROSE (sol caramel, tout est bonbon)
 *   CHAMBRE  (-400, 0, 0)    chambre de Sam, fenêtre sur la rue (z = -5) ; la rue vue de la fenêtre est dans `dehors`
 *   VIDE     (0, 0, 800)     le vide blanc de la conversation : fil de bulles géantes (colonne verticale), plateforme du haut
 */
import * as THREE from "three";
import { Batisseur, type V3 } from "../../geo";
import { arbreVoxel, lampadaire, maisonSimple, cloture } from "./aides";

export const CH: V3 = [-400, 0, 0];
export const VIDE: V3 = [0, 0, 800];

// ------------------------------------------------------------------ Repères
export const ROOM = { W: 4.5, Z: 5, H: 4.2 };
/** Fenêtre de la chambre (repère chambre : x relatif à CH[0]). */
export const FEN = { x0: -1.2, x1: 2.4, y0: 1.2, y1: 3.5 };
export const VITRE_Z = -ROOM.Z - 0.15;

export const SOL_T = 0.12; // dessus des trottoirs
export const X_TROT = 5.8; // axe des trottoirs
export const X_MAISON = 14; // plan des façades (x = ±14)
export const Z_BOUL = -16; // boulangerie (côté est)
export const Z_LOPES = 16; // maison de Mme Lopes (côté ouest)
export const KENNEL: V3 = [-11.4, 0, 22.2];
export const GAZON_LOPES: V3 = [-10.5, 0, 18.5];

/** Hauteur du haut du fil (plateforme où se tient Sam). */
export const Y_TOP = 100;
/** Bulles de la conversation (bas = récent, haut = ancien). */
export type BulleDef = { y: number; cote: -1 | 1; texte: string; type: "bleue" | "grise" | "verte"; w: number; h: number; lignes?: number; z?: number; lisible?: boolean };
export const FIL: BulleDef[] = (() => {
  const t: BulleDef[] = [
    { y: 8, cote: -1, texte: "Un seul message peut être supprimé.", type: "grise", w: 13.5, h: 4.4, lisible: true },
    { y: 14.8, cote: -1, texte: "Impossible.", type: "grise", w: 8, h: 3.2, lisible: true },
    { y: 21.4, cote: 1, texte: "Tout redevient comme avant.", type: "bleue", w: 13, h: 4.4, lisible: true },
    { y: 28.2, cote: 1, texte: "Le chien de ma voisine est guéri.", type: "bleue", w: 13.5, h: 4.4, lisible: true },
    { y: 35, cote: 1, texte: "Il pleut des bonbons.", type: "bleue", w: 11, h: 3.4, lisible: true },
  ];
  // plus haut : le fil des vieux messages (lignes grises, illisibles), de plus en plus anciens
  const lignes = [2, 1, 3, 2, 1, 2, 3, 1, 2, 2, 1, 3, 2, 1];
  let y = 42;
  for (let i = 0; i < 14; i++) {
    const ln = lignes[i];
    const h = 2.4 + ln * 1.1;
    t.push({ y, cote: i % 3 === 1 ? -1 : 1, texte: "", type: i % 3 === 1 ? "grise" : i % 4 === 0 ? "verte" : "bleue", w: 8 + ((i * 5) % 6), h, lignes: ln, lisible: false });
    y += h + 2.6;
    if (y > Y_TOP - 9) break;
  }
  return t;
})();

// ------------------------------------------------------------------ Types
export type Zones = {
  chambre: THREE.BufferGeometry;
  dehors: THREE.BufferGeometry;
  rue: THREE.BufferGeometry;
  rueRose: THREE.BufferGeometry;
  ombres: THREE.BufferGeometry;
  ombresRose: THREE.BufferGeometry;
  vide: THREE.BufferGeometry;
};

// ------------------------------------------------------------------ Chambre de Sam (repère monde = CH + local)
function chambre(b: Batisseur) {
  const [X] = CH;
  const { W, Z, H } = ROOM;
  const mur = "#BFDCFF";
  const mur2 = "#FFE9A8";
  b.boite([X, 0.04, 0], [W * 2, 0.08, Z * 2], "#EDC98F"); // parquet
  for (let i = -4; i <= 4; i++) b.boite([X + i, 0.09, 0], [0.04, 0.02, Z * 2], "#CFA063");
  b.boite([X, H + 0.1, 0], [W * 2 + 0.6, 0.2, Z * 2 + 0.6], "#FFFFFF");
  b.boite([X - W - 0.15, H / 2, 0], [0.3, H, Z * 2 + 0.6], mur);
  b.boite([X + W + 0.15, H / 2, 0], [0.3, H, Z * 2 + 0.6], mur2);
  b.boite([X, H / 2, Z + 0.15], [W * 2 + 0.6, H, 0.3], mur2);
  // mur du fond (z = -Z) percé de la fenêtre
  const zf = -Z - 0.15;
  const f = FEN;
  b.boite([X + (-W + f.x0) / 2 - 0.15, H / 2, zf], [W + f.x0 + 0.3, H, 0.3], mur);
  b.boite([X + (W + f.x1) / 2 + 0.15, H / 2, zf], [W - f.x1 + 0.3, H, 0.3], mur);
  b.boite([X + (f.x0 + f.x1) / 2, f.y0 / 2, zf], [f.x1 - f.x0, f.y0, 0.3], mur);
  b.boite([X + (f.x0 + f.x1) / 2, (f.y1 + H) / 2, zf], [f.x1 - f.x0, H - f.y1, 0.3], mur);
  const cx = X + (f.x0 + f.x1) / 2;
  b.boite([cx, f.y0 - 0.08, zf + 0.14], [f.x1 - f.x0 + 0.5, 0.16, 0.55], "#FFFFFF");
  b.boite([cx, f.y1 + 0.1, zf + 0.05], [f.x1 - f.x0 + 0.4, 0.2, 0.3], "#FFFFFF");
  // (pas de croisillons : on voit la rue d'un seul tenant)
  // rideaux jaunes
  b.boite([cx - 2.15, 2.5, zf + 0.4], [0.8, 3.4, 0.2], "#FFC93C");
  b.boite([cx + 2.15, 2.5, zf + 0.4], [0.8, 3.4, 0.2], "#FFC93C");
  b.boite([cx, 4.0, zf + 0.4], [5.4, 0.2, 0.3], "#C98A3A");
  // plinthes
  for (const [x, z, sx, sz] of [[0, -Z + 0.05, W * 2, 0.1], [0, Z - 0.05, W * 2, 0.1], [-W + 0.05, 0, 0.1, Z * 2], [W - 0.05, 0, 0.1, Z * 2]] as Array<[number, number, number, number]>) b.boite([X + x, 0.2, z], [sx, 0.3, sz], "#FFFFFF");
  // lit contre le mur de gauche, tête vers la fenêtre
  b.boite([X - 3.3, 0.45, -2.3], [2.7, 0.5, 5.2], "#FF9F5A");
  b.boite([X - 3.3, 0.86, -2.2], [2.5, 0.34, 5.0], "#FFFFFF");
  b.boite([X - 3.3, 1.16, -4.0], [1.7, 0.26, 0.95], "#FFF6F0");
  b.boite([X - 3.3, 1.1, -0.5], [2.5, 0.24, 2.9], "#5FA8FF");
  for (const [dx, dz] of [[-0.6, -0.9], [0.5, -0.1], [-0.2, 0.7]] as Array<[number, number]>) b.boite([X - 3.3 + dx, 1.24, -0.5 + dz], [0.34, 0.04, 0.34], "#FFE066");
  b.boite([X - 3.3, 1.5, -4.95], [2.7, 2.0, 0.2], "#FF9F5A");
  b.boite([X - 3.3, 0.95, 0.35], [2.7, 0.9, 0.2], "#FF9F5A");
  // étagère au-dessus du lit (livres colorés)
  b.boite([X - W + 0.35, 3.0, -2.0], [0.7, 0.1, 3.6], "#C98A3A");
  for (let k = 0; k < 7; k++) b.boite([X - W + 0.4, 3.35, -3.5 + k * 0.5], [0.4, 0.55 + (k % 3) * 0.1, 0.36], ["#FF5C7A", "#3FA2FF", "#FFD23F", "#5AD18F", "#B07CFF", "#FF9F5A", "#FFFFFF"][k]);
  // bureau contre le mur de droite + écran + lampe + chaise
  b.boite([X + W - 0.9, 1.5, -2.7], [1.6, 0.14, 3.2], "#E5B26E");
  for (const dz of [-1.3, 1.3]) b.boite([X + W - 0.9, 0.75, -2.7 + dz], [1.4, 1.5, 0.16], "#C98A3A");
  b.boite([X + W - 0.6, 1.7, -2.8], [0.5, 0.3, 0.9], "#8895A8"); // clavier
  b.boite([X + W - 0.4, 2.7, -2.8], [0.16, 1.5, 2.2], "#2A3347"); // écran
  b.boite([X + W - 0.47, 2.7, -2.8], [0.04, 1.3, 2.0], "#5FA8FF");
  b.boite([X + W - 1.2, 1.78, -4.1], [0.14, 0.6, 0.14], "#6B7A8F");
  b.boite([X + W - 1.2, 2.15, -4.1], [0.6, 0.3, 0.6], "#FFF2A8");
  b.boite([X + 2.2, 1.05, -2.6], [1.1, 0.14, 1.1], "#FF5C7A"); // chaise
  b.boite([X + 2.7, 1.7, -2.6], [0.14, 1.2, 1.1], "#FF5C7A");
  for (const [dx, dz] of [[-0.4, -0.4], [0.4, 0.4], [0.4, -0.4], [-0.4, 0.4]] as Array<[number, number]>) b.boite([X + 2.2 + dx, 0.5, -2.6 + dz], [0.1, 1.0, 0.1], "#6B7A8F");
  // tapis rond (carré en blocs) + coussins
  b.boite([X + 0.2, 0.08, 1.6], [4.6, 0.04, 3.6], "#FF8FB8");
  b.boite([X + 0.2, 0.1, 1.6], [3.6, 0.04, 2.6], "#FFD0E4");
  // posters sur les murs de droite et du fond
  b.boite([X + W - 0.04, 2.9, 1.6], [0.06, 1.4, 1.0], "#FF5C7A");
  b.boite([X + W - 0.07, 2.9, 1.6], [0.06, 1.0, 0.7], "#FFF2A8");
  b.boite([X + W - 0.04, 2.6, 3.3], [0.06, 1.0, 1.4], "#5AD18F");
  b.boite([X - 3.4, 3.0, -4.84], [1.4, 1.0, 0.06], "#B07CFF");
  // plante et ours en peluche
  b.boite([X + 3.9, 0.35, 3.6], [0.7, 0.7, 0.7], "#FF7A5A");
  b.boite([X + 3.9, 1.0, 3.6], [1.0, 0.7, 1.0], "#5AD18F");
  b.boite([X + 3.9, 1.6, 3.6], [0.6, 0.5, 0.6], "#7DE3A8");
  b.boite([X - 3.3, 1.45, 0.0], [0.9, 0.8, 0.8], "#C98A5A");
  b.boite([X - 3.3, 2.0, 0.0], [0.7, 0.6, 0.6], "#C98A5A");
  // porte (mur avant, côté gauche)
  b.boite([X - 2.2, 2.0, Z - 0.02], [1.6, 4.0, 0.08], "#FF8FB8");
}

// ------------------------------------------------------------------ La rue vue de la fenêtre de Sam (z < -5,3)
function dehors(b: Batisseur) {
  const [X] = CH;
  b.boite([X, -0.5, -60], [400, 1, 120], "#7FD36B"); // pelouse
  b.boite([X, 0.0, -13], [400, 0.12, 3.2], "#D8D2C4"); // trottoir près
  b.boite([X, -0.02, -18], [400, 0.1, 8.2], "#8C93A6"); // route
  for (let x = -60; x < 60; x += 6) b.boite([X + x, 0.04, -18], [2.6, 0.02, 0.22], "#FFF6D0");
  b.boite([X, 0.0, -23.2], [400, 0.12, 3.2], "#D8D2C4"); // trottoir loin
  cloture(b, [X - 60, 0, -9.6], [X - 2.4, 0, -9.6]);
  cloture(b, [X + 2.4, 0, -9.6], [X + 60, 0, -9.6]);
  const MURS = ["#FFD6A8", "#BFE0FF", "#FFF0A0", "#FFB8D0", "#C6F0C0", "#E0CCFF", "#FFD0B0"];
  const TOITS = ["#E8604C", "#4C7FC9", "#C9804C", "#4CA878", "#8A62C9", "#E8604C", "#4C7FC9"];
  for (let i = -3; i <= 3; i++) {
    const x = X + i * 15.5;
    b.dans([x, 0, -29], 0, () => {
      maisonSimple(b, { w: 9.4, d: 7.5, h: 4.6, mur: MURS[(i + 3) % 7], toit: TOITS[(i + 3) % 7], porteX: i % 2 ? -2.2 : 2.2, porteC: "#3F6A9E", fen: [{ x: i % 2 ? 1.6 : -1.6, w: 2.3 }], volets: TOITS[(i + 4) % 7], cheminee: 1.6 });
    });
    arbreVoxel(b, x + 6.4, -25.6, 1.0, "#3FB36A", "#5AD18F");
  }
  for (const x of [-20, 20]) arbreVoxel(b, X + x, -8.0, 1.1, "#3FB36A", "#5AD18F");
  b.cone([X - 80, -0.2, -150], 110, 70, "#9ED0C0", 7, 0.3);
  b.cone([X + 40, -0.2, -170], 140, 96, "#8DBBE0", 7, 0.9);
  b.cone([X + 150, -0.2, -140], 80, 52, "#A3D6BE", 7, 0.1);
}

// ------------------------------------------------------------------ La rue (état normal / rose)
type Pal = { herbe: string; herbe2: string; route: string; ligne: string; trot: string; bord: string; arbre1: string; arbre2: string; murs: string[]; toits: string[]; portes: string[]; colline: string[]; ombre: string; fleurs: string[] };
const PAL_N: Pal = {
  herbe: "#7FD36B", herbe2: "#8FE07A", route: "#8C93A6", ligne: "#FFF6D0", trot: "#E3DED2", bord: "#F4F0E6", arbre1: "#3FB36A", arbre2: "#5AD18F",
  murs: ["#FFD6A8", "#BFE0FF", "#FFF0A0", "#FFB8D0", "#C6F0C0", "#E0CCFF", "#FFD0B0", "#BDEFE6", "#FFE0A0", "#CFE0FF"],
  toits: ["#E8604C", "#4C7FC9", "#C9804C", "#4CA878", "#8A62C9", "#E8604C", "#4C7FC9", "#C9804C", "#4CA878", "#8A62C9"],
  portes: ["#3F6A9E", "#E8604C", "#3FA878", "#E8B03C", "#8A62C9"],
  colline: ["#9ED0C0", "#8DBBE0", "#A3D6BE"], ombre: "#2A3A7A", fleurs: ["#FF5C7A", "#FFD23F", "#FF8FB8", "#FFFFFF"],
};
const PAL_R: Pal = {
  herbe: "#FF9EC8", herbe2: "#FFB3D6", route: "#C98A5C", ligne: "#FFE9B8", trot: "#FFC6DE", bord: "#FFE3F0", arbre1: "#FF6FB5", arbre2: "#FFA3D3",
  murs: ["#FF9AC4", "#FFB3A0", "#E8A0FF", "#FFD0E4", "#FF8FB8", "#D9B3FF", "#FFC2A0", "#FFA0D8", "#FFB0C8", "#F0A8FF"],
  toits: ["#E8308C", "#B040E0", "#FF7A5A", "#E84080", "#9040D0", "#E8308C", "#B040E0", "#FF7A5A", "#E84080", "#9040D0"],
  portes: ["#B040E0", "#FF5A8A", "#7A4AE0", "#FFB020", "#E8308C"],
  colline: ["#FFB3D6", "#E8A8FF", "#FFC8A8"], ombre: "#6A1A5A", fleurs: ["#FFFFFF", "#FFE066", "#FFFFFF", "#B8F0FF"],
};

const ZS = [-96, -80, -64, -48, -32, -16, 0, 16, 32, 48, 64, 80, 96];

function rue(b: Batisseur, o: Batisseur, rose: boolean) {
  const P = rose ? PAL_R : PAL_N;
  b.boite([0, -0.5, 0], [760, 1, 760], P.herbe); // terrain
  b.boite([0, -0.02, 0], [8.4, 0.1, 560], P.route);
  for (let z = -260; z < 260; z += 6) b.boite([0, 0.04, z], [0.22, 0.02, 2.6], P.ligne);
  for (const s of [-1, 1]) {
    b.boite([s * X_TROT, SOL_T / 2, 0], [3.0, SOL_T, 560], P.trot);
    b.boite([s * 4.2, SOL_T / 2 + 0.01, 0], [0.22, SOL_T + 0.02, 560], P.bord);
    for (let z = -260; z < 260; z += 2.4) b.boite([s * X_TROT, SOL_T + 0.003, z], [3.0, 0.006, 0.05], rose ? "#E89AC0" : "#C8C2B2");
    b.boite([s * 10.6, 0.01, 0], [4.6, 0.04, 560], P.herbe2); // pelouse devant les maisons
  }
  // passage piéton
  for (let x = -3.6; x <= 3.7; x += 1.2) b.boite([x, 0.045, 6], [0.66, 0.02, 3.2], rose ? "#FFE9F4" : "#FFFFFF");
  if (rose) {
    // flaques de caramel luisantes sur la chaussée
    for (const [x, z, w, d] of [[-1.8, -6, 2.8, 1.6], [2.2, 10, 2.2, 3.4], [-0.8, 28, 3.4, 1.4], [1.6, -30, 2.4, 2.8], [-2.4, 44, 2.0, 2.6], [0.4, -52, 3.0, 1.4]] as Array<[number, number, number, number]>) {
      b.boite([x, 0.05, z], [w, 0.02, d], "#E8A36A");
      b.boite([x + 0.2, 0.06, z - 0.1], [w * 0.5, 0.02, d * 0.4], "#FFC890");
    }
  }
  // maisons des deux côtés (la boulangerie et la maison de Mme Lopes sont des édifices dynamiques)
  ZS.forEach((z, i) => {
    for (const cote of [1, -1] as const) {
      const ouest = cote > 0;
      if (ouest && z === Z_LOPES) continue;
      if (!ouest && z === Z_BOUL) continue;
      const ry = ouest ? Math.PI / 2 : -Math.PI / 2;
      const porteX = ouest ? -2.2 : 2.2;
      const k = (i + (ouest ? 0 : 4)) % 10;
      b.dans([-cote * X_MAISON, 0, z], ry, () => {
        maisonSimple(b, { w: 9, d: 7.5, h: 4.4, mur: P.murs[k], toit: P.toits[k], porteX, porteC: P.portes[k % 5], fen: [{ x: -porteX * 0.7, w: 2.2 }], volets: P.toits[(k + 3) % 10], cheminee: -porteX });
        b.boite([porteX, 0.1, 4.0], [1.5, 0.08, 6.4], rose ? "#FFC0D8" : "#D8D2C4"); // allée
      });
      // petits massifs de fleurs devant chaque maison
      for (let q = 0; q < 4; q++) b.boite([-cote * (X_MAISON - 2.2) + (q % 2) * 0.5, 0.2, z - 1.4 + (q - 1.5) * 0.5], [0.3, 0.3, 0.3], P.fleurs[(i + q) % 4]);
      // clôture sur le devant de la parcelle (la porte reste ouverte : le portillon)
      const xc = -cote * 8.2;
      const zPorte = z + 2.2;
      cloture(b, [xc, 0, z - 7.2], [xc, 0, zPorte - 0.9]);
      cloture(b, [xc, 0, zPorte + 0.9], [xc, 0, z + 7.2]);
      // ombre portée de la maison (côté ouest : soleil de l'ouest, l'ombre tombe sur le jardin, le trottoir et la rue)
      if (ouest) {
        const x0 = -X_MAISON;
        o.quad([x0, 0.12, z - 4.5], [x0, 0.12, z + 4.5], [x0 + 9, 0.12, z + 4.5 + 2.2], [x0 + 9, 0.12, z - 4.5 + 2.2], P.ombre);
      }
    }
  });
  // lampadaires, arbres
  for (let z = -90; z <= 90; z += 30) {
    lampadaire(b, [-7.0, 0, z], Math.PI / 2);
    lampadaire(b, [7.0, 0, z + 15], -Math.PI / 2);
  }
  for (let z = -92; z <= 92; z += 16) {
    if (Math.abs(z + 8 - Z_LOPES) > 8) {
      arbreVoxel(b, -9.0, z + 8, 1.2, P.arbre1, P.arbre2);
      o.boule([-9.0 + 3.6, 0.12, z + 8 + 1.2], [2.8, 0.01, 2.0], P.ombre);
    }
    if (Math.abs(z - Z_BOUL) > 8) {
      arbreVoxel(b, 9.0, z, 1.2, P.arbre1, P.arbre2);
      o.boule([9.0 + 3.6, 0.12, z + 1.2], [2.8, 0.01, 2.0], P.ombre);
    }
  }
  // la niche du chien (jardin de Mme Lopes) : toit en blocs, entrée sombre, gamelle
  b.dans(KENNEL, Math.PI / 2, () => {
    b.boite([0, 0.7, 0], [1.9, 1.4, 2.0], rose ? "#FFB3C8" : "#E8A66A");
    b.boite([0, 1.7, 0], [2.2, 0.3, 2.4], rose ? "#E8308C" : "#C0503C");
    b.boite([0, 2.1, 0], [1.5, 0.3, 1.8], rose ? "#E8308C" : "#C0503C");
    b.boite([0, 0.62, 1.01], [0.9, 1.1, 0.06], "#2A1A14");
    b.boite([0, 1.28, 1.01], [0.9, 0.16, 0.06], "#2A1A14");
  });
  b.boite([-9.0, 0.14, 22.9], [0.7, 0.2, 0.7], "#3F6AD0"); // gamelle
  // collines pastel au loin
  const C = P.colline;
  b.cone([-60, -0.2, -250], 90, 62, C[0], 7, 0.3);
  b.cone([60, -0.2, -270], 110, 84, C[1], 7, 0.9);
  b.cone([150, -0.2, -230], 70, 48, C[2], 7, 0.1);
  b.cone([-170, -0.2, -210], 70, 50, C[1], 7, 0.5);
  b.cone([-90, -0.2, 260], 90, 55, C[0], 7, 0.2);
  b.cone([90, -0.2, 270], 100, 70, C[2], 7, 0.7);
}

// ------------------------------------------------------------------ Le vide blanc : plateforme du haut (dalle à une seule face : invisible par-dessous) et marches du premier message
function vide(b: Batisseur) {
  const [vx, , vz] = VIDE;
  const x0 = vx - 32;
  const x1 = vx + 32;
  const z0 = vz - 16;
  const z1 = vz + 60;
  const y = Y_TOP;
  const e = 1.6;
  // dessus (vu d'en haut seulement) puis tranche sur les trois côtés visibles depuis le fil
  b.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], "#E6F0FF");
  b.quad([x1, y - e, z1], [x1, y, z1], [x0, y, z1], [x0, y - e, z1], "#9CC4FF");
  b.quad([x1, y - e, z0], [x1, y, z0], [x1, y, z1], [x1, y - e, z1], "#9CC4FF");
  b.quad([x0, y - e, z1], [x0, y, z1], [x0, y, z0], [x0, y - e, z0], "#9CC4FF");
  for (let i = -7; i <= 7; i++) b.boite([vx + i * 4, y + 0.02, vz + 22], [0.08, 0.04, 76], "#C5DBFF");
  for (let j = -9; j <= 9; j++) b.boite([vx, y + 0.02, vz + 22 + j * 4], [64, 0.04, 0.08], "#C5DBFF");
  // socle de la première bulle (le message d'il y a quinze ans) : marches bleues
  b.boite([vx, y + 0.5, vz - 7], [30, 1.0, 3.0], "#7FB6FF");
  b.boite([vx, y + 1.2, vz - 8.4], [27, 1.4, 1.2], "#5FA0FF");
}

export function construireMessages(): Zones {
  const ch = new Batisseur(true);
  chambre(ch);
  const de = new Batisseur(false);
  dehors(de);
  const r1 = new Batisseur(false);
  const o1 = new Batisseur(false);
  rue(r1, o1, false);
  const r2 = new Batisseur(false);
  const o2 = new Batisseur(false);
  rue(r2, o2, true);
  const vi = new Batisseur(false);
  vide(vi);
  return { chambre: ch.construire(), dehors: de.construire(), rue: r1.construire(), rueRose: r2.construire(), ombres: o1.construire(), ombresRose: o2.construire(), vide: vi.construire() };
}
