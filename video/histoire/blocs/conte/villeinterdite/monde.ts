/**
 * « Ville interdite » — décors fixes en blocs (ombrage cuit par face, soleil rasant venu de l'ouest : la lampe de chevet).
 *
 * TOUT est posé sur une table d'enfant (le spectateur ne doit pas le comprendre avant la révélation) :
 *   VILLE   plateau de la ville (x -72..72, z -48..58, dessus à y = 0) : rues, place, maisons en blocs de bois peints, boulangerie (pas
 *           A puis pas B : la main la déplace), maison de Léo (creuse, fenêtre), sirène, barrière « SORTIE INTERDITE », trappe de cave.
 *   TABLE   le plateau de bois (x -240..240, z -170..62, dessus à y = -0,3) et son rebord arrondi à z = 62, ses pieds, les jouets géants
 *           (crayons, gommes, cubes de l'alphabet), la boîte à jouets (compartiments) et la lampe de chevet (le « soleil »).
 *   CAVE    diorama à x = -450 : cellier, escalier de la trappe, tunnel à tuyaux, échelle vers la lumière.
 * Chambre : plancher à y = -150, murs à rayures très hauts (x ±520, z -430..520).
 */
import * as THREE from "three";
import { Batisseur, type V3 } from "../../geo";

// ------------------------------------------------------------------ Repères
export const BOARD = { x0: -72, x1: 72, z0: -48, z1: 58 };
export const BORD_Z = 62; // bord avant de la table
export const Y_TABLE = -0.3;
export const Y_SOL = -150;
export const TABLE = { x0: -240, x1: 240, z0: -170, z1: 62 };
export const CAVE: V3 = [-450, 0, 0];

/** Pas (emplacements) de la boulangerie : A (d'origine) puis B (10 m plus loin, à l'ouest). Centre du bâtiment (x, z). */
export const BOUL = { w: 18, d: 14, A: [-20, -13.5] as [number, number], B: [-38.5, -13.5] as [number, number], h: 8 };
/** Maison de Léo : centre, façade tournée vers +x (l'avenue). Fenêtre : z du centre. */
export const LEO_MAISON = { x: -11, z: 40, w: 12, d: 10, h: 7, fenetreZ: 42, fenetreY: 1.3, porteZ: 36 };
export const TRAPPE: V3 = [-11, 0, 50];
export const TRAPPE2: V3 = [-16, 0, 54.6];
/** Position de Léo au rebord de la table (x) : les plans du bord se calent dessus. */
export const LEO_BORD_X = -8.6;
export const SIRENE_POS: V3 = [7.5, 0, -7.5];
export const HAUT_SIRENE = 15;
export const BARRIERE_Z = 54;
export const PLACE: V3 = [0, 0, 0];
/** Boîte à jouets : centre, dimensions, compartiments (2 rangées de 6). */
export const BOITE = { x: 124, z: -16, w: 48, d: 28, h: 2.8, plancher: 0.9 };
export const CELLULES: V3[] = [];
for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) CELLULES.push([BOITE.x - BOITE.w / 2 + 5.4 + k * 7.44, BOITE.plancher, BOITE.z + (r === 0 ? 6.4 : -6.4)]);
export const LAMPE: V3 = [-300, 0, -40];
export const OEIL: V3 = [-2, 64, 100];

// ------------------------------------------------------------------ Bâtisseur à soleil rasant (contraste fort, ombre froide / lumière chaude)
const SOLEIL = new THREE.Vector3(-0.77, 0.51, 0.36).normalize();
const coul = new Map<string, THREE.Color>();
const lin = (hex: string) => {
  let c = coul.get(hex);
  if (!c) coul.set(hex, (c = new THREE.Color(hex)));
  return c;
};
class BatSoleil extends (Batisseur as unknown as new (i?: boolean) => any) {
  geo(g: THREE.BufferGeometry, couleur: string, local?: THREE.Matrix4, lum = 1) {
    const M: THREE.Matrix4 = local ? this.m.clone().multiply(local) : this.m;
    const p = g.getAttribute("position");
    const c = lin(couleur);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const d = new THREE.Vector3();
    const n = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i).applyMatrix4(M);
      b.fromBufferAttribute(p, i + 1).applyMatrix4(M);
      d.fromBufferAttribute(p, i + 2).applyMatrix4(M);
      n.crossVectors(e1.subVectors(b, a), e2.subVectors(d, a)).normalize();
      const s = Math.max(0, n.dot(SOLEIL));
      const k = (0.5 + 0.66 * s + 0.12 * Math.max(0, n.y)) * lum * 1.1;
      const r = c.r * k * (0.84 + 0.22 * s);
      const gg = c.g * k * (0.9 + 0.1 * s);
      const bb = c.b * k * (1.12 - 0.3 * s);
      this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, d.x, d.y, d.z);
      this.col.push(r, gg, bb, r, gg, bb, r, gg, bb);
    }
  }
}
export const nouveauBat = (): Batisseur => new BatSoleil() as unknown as Batisseur;

function alea(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
const pick = <T,>(l: T[], i: number): T => l[Math.floor(alea(i) * l.length) % l.length];
export const MURS = ["#D9482F", "#F0BC2E", "#62B8EE", "#92D24E", "#F6E8C8", "#F08266", "#45A6BC"];
const TOITS = ["#C0432E", "#2F6DB8", "#E0A12E", "#46954B", "#8A55A8", "#D9693A"];
const clair = (hex: string, k = 0.35) => `#${new THREE.Color(hex).lerp(new THREE.Color("#FFFFFF"), k).getHexString()}`;
const sombre = (hex: string, k = 0.35) => `#${new THREE.Color(hex).lerp(new THREE.Color("#000000"), k).getHexString()}`;

// ------------------------------------------------------------------ Maisons
type Lot = { x: number; z: number; ry: number; w: number; d: number; h: number; mur: string; toit: string; fait: 0 | 1; i: number };
function fenetre(b: Batisseur, ferme: boolean, allume: boolean, mur: string, volet: string) {
  b.boite([0, 0, 0.05], [2.0, 2.4, 0.12], "#F7F1E2");
  if (ferme) {
    b.boite([-0.47, 0, 0.14], [0.9, 2.0, 0.1], volet);
    b.boite([0.47, 0, 0.14], [0.9, 2.0, 0.1], volet);
    for (const y of [-0.5, 0, 0.5]) b.boite([0, y, 0.2], [1.9, 0.06, 0.04], sombre(volet, 0.45));
    b.boite([0, 0, 0.21], [0.07, 2.0, 0.04], sombre(volet, 0.45));
  } else {
    b.boite([0, 0, 0.1], [1.72, 2.06, 0.08], allume ? "#FFD27A" : "#26324F", undefined, allume ? 2.6 : 1);
    b.boite([0, 0, 0.16], [1.8, 0.1, 0.06], "#F7F1E2");
    b.boite([0, 0, 0.16], [0.1, 2.1, 0.06], "#F7F1E2");
  }
  b.boite([0, -1.28, 0.22], [2.4, 0.2, 0.5], "#F7F1E2");
  void mur;
}
function toitFait(b: Batisseur, base: number, w: number, d: number, rh: number, toit: string, mur: string) {
  // faîtage le long de z : pignon à l'avant et à l'arrière (triangle de la couleur du mur)
  b.pignon([0, base, 0], w + 1.2, rh, d + 1.2, toit);
  b.pignon([0, base, 0], w, rh * 0.84, d + 1.7, clair(mur, 0.1));
}
function maison(b: Batisseur, o: Lot) {
  const { w, d, h, mur, toit, i } = o;
  const volet = pick(["#2F6B3A", "#8C2F1B", "#2E5A8C", "#6B4A2F"], i * 1.9);
  b.dans([o.x, 0, o.z], o.ry, () => {
    b.boite([0, 0.35, 0], [w + 0.5, 0.7, d + 0.5], "#8D7C66");
    b.boite([0, 0.7 + h / 2, 0], [w, h, d], mur);
    if (h > 5.6) b.boite([0, 0.7 + h * 0.5, 0], [w + 0.3, 0.3, d + 0.3], clair(mur, 0.5));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.boite([sx * (w / 2), 0.7 + h / 2, sz * (d / 2)], [0.5, h, 0.5], clair(mur, 0.45));
    const rh = Math.min(w, d) * 0.42 + 0.7;
    if (o.fait === 0) toitFait(b, 0.7 + h, w, d, rh, toit, mur);
    else b.dans([0, 0, 0], Math.PI / 2, () => toitFait(b, 0.7 + h, d, w, rh, toit, mur));
    // cheminée
    const cx = o.fait === 0 ? w * 0.28 : 0;
    const cz = o.fait === 0 ? -d * 0.18 : -d * 0.2;
    b.boite([cx, 0.7 + h + rh * 0.55 + 0.6, cz], [1.2, 2.6, 1.2], "#9A4B38");
    b.boite([cx, 0.7 + h + rh * 0.55 + 2.0, cz], [1.5, 0.3, 1.5], "#6C3A2C");
    // façade avant (+z) : porte + fenêtres ; deux étages
    const nf = Math.max(2, Math.floor(w / 4.2));
    const portePos = Math.floor(alea(i * 3.3) * nf);
    for (let k = 0; k < nf; k++) {
      const x = -w / 2 + (w / nf) * (k + 0.5);
      if (k === portePos) {
        b.boite([x, 2.35, d / 2 + 0.08], [1.9, 3.3, 0.2], "#6B4226");
        b.boite([x, 2.35, d / 2 + 0.2], [1.5, 2.9, 0.06], "#7E4F2E");
        b.boite([x + 0.55, 2.2, d / 2 + 0.28], [0.18, 0.18, 0.1], "#E3B84A");
        b.boite([x, 0.85, d / 2 + 0.8], [2.6, 0.3, 1.4], "#B9AC98");
      } else {
        const ferme = alea(i * 5.1 + k) > 0.22;
        b.dans([x, 2.65, d / 2], 0, () => fenetre(b, ferme, !ferme && alea(i + k) > 0.5, mur, volet));
      }
      if (h > 5.6) b.dans([x, 6.0, d / 2], 0, () => fenetre(b, alea(i * 2.7 + k) > 0.2, alea(i * 7 + k) > 0.6, mur, volet));
    }
    // côtés : une fenêtre par étage
    for (const s of [-1, 1]) {
      b.dans([s * (w / 2), 2.65, 0], s * (Math.PI / 2), () => fenetre(b, true, false, mur, volet));
      if (h > 5.6) b.dans([s * (w / 2), 6.0, 0], s * (Math.PI / 2), () => fenetre(b, true, false, mur, volet));
    }
  });
}

type Rang = { front: number; sens: 0 | 1; xa: number; xb: number; d: number };
const RANGS: Rang[] = [
  { front: -30.2, sens: 0, xa: 6.5, xb: 71, d: 8 },
  { front: -21.8, sens: 1, xa: 6.5, xb: 71, d: 7.4 },
  { front: -6.5, sens: 0, xa: 12.5, xb: 71, d: 7.4 },
  { front: 6.5, sens: 1, xa: 12.5, xb: 71, d: 7.4 },
  { front: 21.8, sens: 0, xa: 6.5, xb: 71, d: 7.4 },
  { front: 30.2, sens: 1, xa: 6.5, xb: 71, d: 7.6 },
];
/** Emprise (rectangle monde) réservée : pas A et B de la boulangerie, maison de Léo, sirène, fontaine. */
const RESERVES: Array<[number, number, number, number]> = [
  [BOUL.A[0] - BOUL.w / 2 - 1, BOUL.A[1] - BOUL.d / 2 - 1, BOUL.A[0] + BOUL.w / 2 + 1, BOUL.A[1] + BOUL.d / 2 + 1],
  [BOUL.B[0] - BOUL.w / 2 - 1, BOUL.B[1] - BOUL.d / 2 - 1, BOUL.B[0] + BOUL.w / 2 + 1, BOUL.B[1] + BOUL.d / 2 + 1],
  [LEO_MAISON.x - LEO_MAISON.d / 2 - 1.5, LEO_MAISON.z - LEO_MAISON.w / 2 - 1.5, LEO_MAISON.x + LEO_MAISON.d / 2 + 1.5, LEO_MAISON.z + LEO_MAISON.w / 2 + 1.5],
];
export const LOTS: Lot[] = [];
(function remplir() {
  let n = 0;
  for (const cote of [-1, 1]) {
    for (const r of RANGS) {
      let x = r.xa + alea(n * 1.3) * 1.5;
      while (true) {
        const w = 8.2 + alea(n * 2.9 + 1) * 4.2;
        if (x + w > r.xb) break;
        const cx = x + w / 2;
        const zc = r.sens === 0 ? r.front - r.d / 2 : r.front + r.d / 2;
        const X = cote * cx;
        const ry = r.sens === 0 ? 0 : Math.PI;
        const x0 = X - w / 2 - 0.5;
        const x1 = X + w / 2 + 0.5;
        const z0 = zc - r.d / 2 - 0.5;
        const z1 = zc + r.d / 2 + 0.5;
        const libre = RESERVES.every((q) => x1 < q[0] || x0 > q[2] || z1 < q[1] || z0 > q[3]);
        if (libre) {
          LOTS.push({ x: X, z: zc, ry, w, d: r.d, h: alea(n * 4.7) > 0.45 ? 6.6 : 5.0, mur: pick(MURS, n * 1.17 + 3), toit: pick(TOITS, n * 2.31 + 1), fait: alea(n * 6.3) > 0.5 ? 0 : 1, i: n });
        }
        n++;
        x += w + 0.9 + alea(n * 3.1) * 0.8;
      }
    }
  }
})();

// ------------------------------------------------------------------ Mobilier de rue
function arbre(b: Batisseur, x: number, z: number, s: number, i: number) {
  b.cylindre([x, 0, z], 0.38 * s, 2.4 * s, "#6B4A2F", 6);
  const v = pick(["#5FA83A", "#7BC043", "#4E9A3E", "#8FCB52"], i);
  b.boule([x, 3.7 * s, z], [2.2 * s, 2.0 * s, 2.2 * s], v, 0, i);
  b.boule([x + 0.8 * s, 4.8 * s, z - 0.4 * s], [1.5 * s, 1.4 * s, 1.5 * s], clair(v, 0.12), 0, i + 1);
}
function sapin(b: Batisseur, x: number, z: number, s: number) {
  b.cylindre([x, 0, z], 0.3 * s, 1.2 * s, "#5A3B22", 6);
  b.cone([x, 1.0 * s, z], 1.9 * s, 3.2 * s, "#2F7A47", 7);
  b.cone([x, 2.8 * s, z], 1.4 * s, 2.8 * s, "#3A8F52", 7);
  b.cone([x, 4.3 * s, z], 0.9 * s, 2.2 * s, "#4AA562", 7);
}
export const LAMPADAIRES: V3[] = [];
for (let x = -63; x <= 63; x += 14) if (Math.abs(x) > 9 && !(x > -50 && x < -9 && x % 28 !== 0)) LAMPADAIRES.push([x, 0, x % 28 === 0 ? 5.9 : -5.9]);
for (let z = -42; z <= 52; z += 14) if (!(z > 34 && z < 50 && z % 28 !== 0)) LAMPADAIRES.push([z % 28 === 0 ? 5.5 : -5.5, 0, z]);
function lampadaire(b: Batisseur, p: V3) {
  b.cylindre([p[0], 0, p[2]], 0.2, 6.4, "#33333D", 6);
  b.boite([p[0], 0.5, p[2]], [0.9, 1.0, 0.9], "#33333D");
  b.boite([p[0], 6.9, p[2]], [1.1, 1.3, 1.1], "#FFE3A0", undefined, 2.4);
  b.boite([p[0], 7.7, p[2]], [1.4, 0.3, 1.4], "#33333D");
}

// ------------------------------------------------------------------ Sol de la ville (tuiles 1 × 1, ombres portées des maisons au soleil couchant)
type Boite2 = [number, number, number, number, number]; // x0 z0 x1 z1 hauteur
function emprises(): Boite2[] {
  const out: Boite2[] = [];
  for (const l of LOTS) {
    const sw = l.ry === 0 || l.ry === Math.PI;
    const hx = (sw ? l.w : l.d) / 2;
    const hz = (sw ? l.d : l.w) / 2;
    out.push([l.x - hx, l.z - hz, l.x + hx, l.z + hz, l.h + 2.6]);
  }
  out.push([BOUL.A[0] - 9, BOUL.A[1] - 7, BOUL.A[0] + 9, BOUL.A[1] + 7, 8.6]);
  out.push([LEO_MAISON.x - LEO_MAISON.d / 2, LEO_MAISON.z - LEO_MAISON.w / 2, LEO_MAISON.x + LEO_MAISON.d / 2, LEO_MAISON.z + LEO_MAISON.w / 2, 9]);
  return out;
}
function enOmbre(cx: number, cz: number, E: Boite2[]): boolean {
  for (const e of E) {
    const L = e[4];
    for (let t = 0.08; t <= 1.001; t += 0.12) {
      // on remonte vers le soleil (ouest, un peu au sud) d'une longueur t * 1,5 * hauteur
      const px = cx - t * L * 1.5;
      const pz = cz + t * L * 0.7;
      if (px > e[0] && px < e[2] && pz > e[1] && pz < e[3]) return true;
    }
  }
  return false;
}
function typeTuile(x: number, z: number): "route" | "trottoir" | "place" | "pas" | "herbe" | "bord" | "cave" {
  const r = Math.hypot(x, z);
  if (r < 10.2) return "place";
  for (const A of [BOUL.A, BOUL.B]) if (Math.abs(x - A[0]) < BOUL.w / 2 + 0.5 && Math.abs(z - A[1]) < BOUL.d / 2 + 0.5) return "pas";
  for (const T of [TRAPPE, TRAPPE2]) if (x > T[0] - 1.8 && x < T[0] + 1.8 && z > T[2] - 1.3 && z < T[2] + 1.3) return "cave";
  const route = Math.abs(z) < 5 || Math.abs(x) < 4.5 || Math.abs(z - 26) < 3 || Math.abs(z + 26) < 3;
  if (route) return "route";
  const trot = Math.abs(Math.abs(z) - 6.25) < 1.25 && Math.abs(z) < 7.5 ? true : Math.abs(Math.abs(x) - 5.75) < 1.25 ? true : Math.abs(Math.abs(z - 26) - 4.2) < 1.2 || Math.abs(Math.abs(z + 26) - 4.2) < 1.2;
  if (trot) return "trottoir";
  if (z > BOARD.z1 - 2.2) return "bord";
  return "herbe";
}
const COUL_SOL: Record<string, string[]> = {
  route: ["#9C8D78", "#A39481"],
  trottoir: ["#D8CBAE", "#CFC1A3"],
  place: ["#E8DCC0", "#DED1B3"],
  pas: ["#E9D9B2", "#E0CFA4"],
  herbe: ["#7DBA45", "#74B03F", "#86C34E"],
  bord: ["#8FC653", "#86BD4A"],
  cave: ["#18120E", "#18120E"],
};

export type VilleG = { sol: THREE.BufferGeometry };
export function construireVille(): THREE.BufferGeometry {
  const b = nouveauBat();
  const E = emprises();
  // sol
  for (let x = BOARD.x0; x < BOARD.x1; x++) {
    for (let z = BOARD.z0; z < BOARD.z1; z++) {
      const t = typeTuile(x + 0.5, z + 0.5);
      const l = COUL_SOL[t];
      let c = l[(Math.abs(x) + Math.abs(z)) % l.length];
      let lum = 1.25;
      if (t !== "cave" && enOmbre(x + 0.5, z + 0.5, E)) {
        c = sombre(c, 0.34);
        lum = 1.0;
      }
      b.quad([x, 0, z], [x, 0, z + 1], [x + 1, 0, z + 1], [x + 1, 0, z], c, lum);
    }
  }
  // tranche du plateau (0,3 d'épaisseur : le plateau est posé sur la table)
  b.boite([0, Y_TABLE / 2, BOARD.z1 + 0.1], [BOARD.x1 - BOARD.x0, 0.3, 0.2], "#6B4A2F");
  // marquage : bande centrale pointillée des deux grandes rues
  for (let x = -70; x < 70; x += 4) if (Math.abs(x) > 10.5 && x % 8 === 0) b.boite([x + 1, 0.04, 0], [2, 0.06, 0.25], "#F2E2A0", undefined, 1.2);
  for (let z = -46; z < 56; z += 4) if (Math.abs(z) > 10.5 && z % 8 === 0 && z < 50) b.boite([0, 0.04, z + 1], [0.25, 0.06, 2], "#F2E2A0", undefined, 1.2);
  // maisons
  for (const l of LOTS) maison(b, l);
  // arbres et sapins (jardins du fond, bords, places)
  let n = 0;
  for (let z = 40; z < 56; z += 4.2) for (let x = -66; x < 68; x += 7.7) {
    n++;
    const px = x + alea(n) * 4;
    const pz = z + alea(n + 9) * 2.6;
    if (Math.abs(px) < 7 || (px > LEO_MAISON.x - 8 && px < LEO_MAISON.x + 8 && pz > LEO_MAISON.z - 8)) continue;
    if (alea(n * 1.7) > 0.45) arbre(b, px, pz, 0.8 + alea(n * 3) * 0.5, n);
    else sapin(b, px, pz, 0.9 + alea(n * 5) * 0.4);
  }
  for (let z = -46; z < -39; z += 3.6) for (let x = -68; x < 70; x += 6.1) {
    n++;
    const px = x + alea(n) * 3;
    if (Math.abs(px) < 7) continue;
    if (alea(n * 2.3) > 0.5) arbre(b, px, z + alea(n + 4) * 2, 0.9 + alea(n * 3) * 0.5, n);
    else sapin(b, px, z + alea(n + 4) * 2, 1.0 + alea(n * 5) * 0.4);
  }
  // entre les maisons de la place : arbres d'agrément
  for (const p of [[-8.5, 8.5], [8.5, 8.5], [-8.5, -8.5], [10, -2.5], [-10, 2.5]]) arbre(b, p[0], p[1], 0.9, n++);
  for (const p of LAMPADAIRES) lampadaire(b, p);

  // fontaine de la place
  b.cylindre([0, 0, 0], 3.6, 0.9, "#CFC8B8", 14);
  b.cylindre([0, 0.9, 0], 3.0, 0.1, "#5CB8E8", 14);
  b.cylindre([0, 0, 0], 0.55, 2.8, "#CFC8B8", 8);
  b.cylindre([0, 2.6, 0], 1.7, 0.45, "#CFC8B8", 12);
  b.cylindre([0, 3.0, 0], 1.3, 0.08, "#5CB8E8", 12);
  b.cylindre([0, 3.0, 0], 0.18, 1.1, "#9ADBFF", 6);

  // tour de la sirène
  const [sx, , sz] = SIRENE_POS;
  b.boite([sx, 1.3, sz], [3.2, 2.6, 3.2], "#8F8672");
  b.boite([sx, 2.8, sz], [3.6, 0.4, 3.6], "#A9A08A");
  b.boite([sx, HAUT_SIRENE / 2 + 1.4, sz], [0.9, HAUT_SIRENE - 2.4, 0.9], "#5B5B66");
  for (const dz of [-0.8, 0.8]) b.boite([sx, HAUT_SIRENE / 2 + 1.4, sz + dz], [1.4, HAUT_SIRENE - 2.4, 0.15], "#7A7A86");
  b.boite([sx, HAUT_SIRENE - 0.7, sz], [2.4, 0.5, 2.4], "#3F3F48");

  // barrière « sortie interdite » au bout de l'avenue
  for (const s of [-1, 1]) {
    b.boite([s * 6.2, 3.8, BARRIERE_Z], [0.7, 7.6, 0.7], "#F4EFE2");
    b.boite([s * 6.2, 7.3, BARRIERE_Z], [0.9, 0.5, 0.9], "#D1332B");
  }
  for (let k = 0; k < 8; k++) b.boite([-4.2 + k * 1.2, 1.8, BARRIERE_Z - 0.05], [0.6, 0.55, 0.3], k % 2 ? "#F4EFE2" : "#D1332B");
  for (let k = 0; k < 8; k++) b.boite([-4.2 + k * 1.2, 3.4, BARRIERE_Z - 0.05], [0.6, 0.55, 0.3], k % 2 ? "#D1332B" : "#F4EFE2");
  b.boite([0, 5.5, BARRIERE_Z + 0.05], [12.6, 3.4, 0.25], "#8A7A66");

  // trappes de la cave : un vantail ouvert, charnière au nord
  for (const T of [TRAPPE, TRAPPE2]) {
    b.boite([T[0], 0.2 + 0.94 * 1.35, T[2] - 1.3 - 0.34 * 1.35], [3.2, 0.22, 2.7], "#7A5230", [-2.79, 0, 0]);
    b.boite([T[0], 0.3, T[2] + 1.45], [3.8, 0.6, 0.5], "#5A3B22");
    b.boite([T[0], 0.3, T[2] - 1.45], [3.8, 0.6, 0.5], "#5A3B22");
    b.boite([T[0] - 1.9, 0.3, T[2]], [0.5, 0.6, 2.9], "#5A3B22");
    b.boite([T[0] + 1.9, 0.3, T[2]], [0.5, 0.6, 2.9], "#5A3B22");
  }

  // pas de la boulangerie : un liseré plus clair
  for (const A of [BOUL.A, BOUL.B]) {
    b.boite([A[0], 0.04, A[1] + BOUL.d / 2 + 0.7], [BOUL.w + 0.8, 0.06, 0.4], "#B9AC98");
  }
  // fleurs dans des bacs sur le pas B vide
  for (const dx of [-6, 6]) {
    b.boite([BOUL.B[0] + dx, 0.5, BOUL.B[1] + 4], [1.4, 1.0, 1.4], "#8C5A36");
    b.boule([BOUL.B[0] + dx, 1.4, BOUL.B[1] + 4], [0.9, 0.7, 0.9], "#E94F7A", 0, n++);
  }
  return b.construire();
}

// ------------------------------------------------------------------ Maison de Léo (creuse : fenêtre, intérieur)
export function construireMaisonLeo(): THREE.BufferGeometry {
  const b = nouveauBat();
  const { x, z, w, d, h } = LEO_MAISON;
  const mur = "#5DB5EA";
  const toit = "#A8392C";
  b.dans([x, 0, z], Math.PI / 2, () => {
    // repère local : +z = façade (vers l'avenue), x local = -(z monde - centre)
    const hx = w / 2;
    const hz = d / 2;
    const ep = 0.7;
    b.boite([0, 0.35, 0], [w + 0.5, 0.7, d + 0.5], "#8D7C66");
    b.boite([0, 0.8, 0], [w - 0.2, 0.2, d - 0.2], "#B88A58"); // plancher intérieur
    // murs : arrière, côtés
    b.boite([0, 0.7 + h / 2, -hz + ep / 2], [w, h, ep], mur);
    b.boite([-hx + ep / 2, 0.7 + h / 2, 0], [ep, h, d], mur);
    b.boite([hx - ep / 2, 0.7 + h / 2, 0], [ep, h, d], mur);
    // intérieur : papier crème, plinthe, cadres, étagère
    b.boite([0, 0.7 + h / 2, -hz + ep + 0.05], [w - 2 * ep, h - 0.4, 0.1], "#F3E3BE");
    b.boite([0, 1.2, -hz + ep + 0.15], [w - 2 * ep, 0.8, 0.12], "#8C5A36");
    b.boite([-3.4, 4.6, -hz + ep + 0.2], [2.0, 1.4, 0.12], "#8C5A36");
    b.boite([-3.4, 4.6, -hz + ep + 0.27], [1.7, 1.1, 0.06], "#9AD1F0");
    b.boite([2.6, 4.2, -hz + ep + 0.25], [3.0, 0.2, 0.7], "#6B4A2F");
    for (let k = 0; k < 5; k++) b.boite([1.4 + k * 0.55, 4.9, -hz + ep + 0.35], [0.4, 1.0 - (k % 2) * 0.2, 0.45], pick(["#D1332B", "#2F6B3A", "#EDB92E", "#2E5A8C"], k * 3.1));
    b.boite([4.0, 2.2, -hz + ep + 0.7], [1.4, 3.0, 1.2], "#8C5A36"); // coffre
    // façade : pièces autour de la fenêtre (x local -4.4..0.4) et de la porte (x local 3.1..4.9)
    const fz = hz - ep / 2;
    const fy0 = LEO_MAISON.fenetreY;
    const fy1 = fy0 + 4.0;
    const seg = (x0: number, x1: number, y0: number, y1: number) => b.boite([(x0 + x1) / 2, 0.7 + (y0 + y1) / 2, fz], [x1 - x0, y1 - y0, ep], mur);
    seg(-hx, -4.4, 0, h);
    seg(-4.4, 0.4, 0, fy0);
    seg(-4.4, 0.4, fy1, h);
    seg(0.4, 3.1, 0, h);
    seg(3.1, 4.9, 3.4, h);
    seg(4.9, hx, 0, h);
    // encadrement de la fenêtre + appui
    b.boite([-2, 0.7 + fy0, hz + 0.1], [5.4, 0.25, 1.0], "#F7F1E2");
    b.boite([-4.55, 0.7 + (fy0 + fy1) / 2, hz + 0.05], [0.3, 4.3, 0.9], "#F7F1E2");
    b.boite([0.55, 0.7 + (fy0 + fy1) / 2, hz + 0.05], [0.3, 4.3, 0.9], "#F7F1E2");
    b.boite([-2, 0.7 + fy1 + 0.1, hz + 0.05], [5.4, 0.3, 0.9], "#F7F1E2");
    // volets ouverts de chaque côté
    b.boite([-5.0, 0.7 + (fy0 + fy1) / 2, hz + 0.45], [0.2, 4.0, 0.9], "#2F6B3A", [0, 0.5, 0]);
    b.boite([1.1, 0.7 + (fy0 + fy1) / 2, hz + 0.45], [0.2, 4.0, 0.9], "#2F6B3A", [0, -0.5, 0]);
    // porte fermée
    b.boite([4.0, 0.7 + 1.7, hz - 0.1], [1.8, 3.4, 0.35], "#6B4226");
    b.boite([4.5, 0.7 + 1.6, hz + 0.12], [0.18, 0.18, 0.1], "#E3B84A");
    b.boite([4.0, 0.85, hz + 0.8], [2.6, 0.3, 1.4], "#B9AC98");
    // plafond + toit
    b.boite([0, 0.7 + h, 0], [w, 0.3, d], "#CFC2A0");
    toitFait(b, 0.7 + h, w, d, Math.min(w, d) * 0.42 + 0.7, toit, mur);
    b.boite([w * 0.28, 0.7 + h + 3.4, -d * 0.18], [1.2, 2.6, 1.2], "#9A4B38");
    // fenêtres latérales fermées
    for (const s of [-1, 1]) b.dans([s * (w / 2), 4.2, 0], s * (Math.PI / 2), () => fenetre(b, true, false, mur, "#2F6B3A"));
    // lit à gauche de la pièce
    b.boite([-4.2, 1.5, -2.2], [2.0, 0.9, 3.2], "#E8D9B6");
    b.boite([-4.2, 2.1, -2.2], [1.9, 0.3, 3.0], "#E0453B");
  });
  return b.construire();
}

// ------------------------------------------------------------------ Boulangerie (repère local : centre du pas, façade +z, ouverte devant)
export function construireBoulangerie(): THREE.BufferGeometry {
  const b = nouveauBat();
  const w = BOUL.w;
  const d = BOUL.d;
  const hw = w / 2;
  const hd = d / 2;
  const h = BOUL.h;
  const ep = 0.7;
  const mur = "#E9B66A";
  // dalle + carrelage damier
  b.boite([0, 0.25, 0], [w + 0.4, 0.5, d + 0.4], "#8D7C66");
  for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) b.quad([-hw + i * 2, 0.52, -hd + j * 2], [-hw + i * 2, 0.52, -hd + j * 2 + 2], [-hw + i * 2 + 2, 0.52, -hd + j * 2 + 2], [-hw + i * 2 + 2, 0.52, -hd + j * 2], (i + j) % 2 ? "#F1E3C4" : "#B65A3C", 1.15);
  // murs : arrière, côtés
  b.boite([0, h / 2, -hd + ep / 2], [w, h, ep], mur);
  b.boite([-hw + ep / 2, h / 2, 0], [ep, h, d], mur);
  b.boite([hw - ep / 2, h / 2, 0], [ep, h, d], mur);
  // intérieur : lambris, étagères de pain
  b.boite([0, 1.5, -hd + ep + 0.08], [w - 2 * ep, 2.8, 0.14], "#8C5A36");
  b.boite([0, 5.2, -hd + ep + 0.05], [w - 2 * ep, 5.2, 0.1], "#F3E3BE");
  for (const y of [3.6, 5.4]) {
    b.boite([-3.4, y, -hd + ep + 0.7], [8.2, 0.25, 1.4], "#6B4A2F");
    for (let k = 0; k < 7; k++) b.boule([-6.6 + k * 1.05, y + 0.55, -hd + ep + 0.7], [0.5, 0.42, 0.55], pick(["#D7954A", "#C47F35", "#E0A860"], k + y), 0, k);
  }
  // fenêtre ronde au fond + four en pierre (coin droit)
  b.boite([5.0, 1.3, -hd + 2.2], [4.6, 2.6, 3.6], "#7A5A44");
  b.cylindre([5.0, 2.6, -hd + 2.2], 2.1, 1.2, "#8E6A50", 10, 1.0);
  b.boite([5.0, 1.15, -hd + 4.1], [2.4, 1.6, 0.2], "#2B1710");
  b.boite([5.0, 1.0, -hd + 4.2], [1.9, 1.0, 0.1], "#FF8A2A", undefined, 2.6);
  // table de pétrissage au centre (dessus à 1,4)
  b.boite([0, 1.75, -0.2], [6.4, 0.3, 2.6], "#B58A5A");
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.boite([sx * 2.9, 1.2, -0.2 + sz * 1.0], [0.4, 1.4, 0.4], "#7A5230");
  b.boite([0.2, 2.1, -0.1], [1.7, 0.4, 1.2], "#F2DFB4"); // pâte
  b.boite([-2.0, 2.0, 0.3], [1.3, 0.16, 0.4], "#8C5A36"); // rouleau
  // sacs de farine et paniers de baguettes à gauche
  for (const [px, pz] of [[-7.2, -1.8], [-7.2, 0.2]]) b.boite([px, 0.5 + 0.9, pz], [1.8, 1.8, 1.7], "#F4EFE2");
  b.boite([-7.0, 0.5 + 2.6, -1.0], [1.6, 0.6, 1.6], "#F4EFE2");
  for (let k = 0; k < 6; k++) b.boite([-6.6 + k * 0.28, 0.5 + 1.6, 4.5], [0.22, 2.2, 0.22], "#D7954A", [0.12, 0, 0.1]);
  b.boite([-6.0, 0.5 + 0.5, 4.5], [1.8, 1.0, 1.2], "#8C5A36");
  // façade : piliers, linteau à enseigne, auvent rayé
  for (const s of [-1, 1]) b.boite([s * (hw - 0.9), h / 2, hd - 0.4], [1.8, h, 0.8], mur);
  b.boite([0, h - 1.05, hd - 0.3], [w, 2.1, 0.8], "#8C2F1B");
  b.boite([0, 5.15, hd - 0.2], [w - 3.4, 0.4, 0.5], "#6B4A2F");
  // auvent : bandes alternées inclinées
  for (let k = 0; k < 10; k++) b.boite([-8.1 + k * 1.8, 5.4, hd + 0.9], [1.8, 0.22, 2.4], k % 2 ? "#F4EFE2" : "#D1332B", [0.32, 0, 0]);
  // toit plat à corniche
  b.boite([0, h + 0.25, 0], [w + 0.8, 0.5, d + 0.8], "#7A3B2A");
  b.boite([0, h + 0.7, 0], [w, 0.5, d], "#A8392C");
  // lampe suspendue
  b.boite([0, 6.7, 1.4], [0.12, 1.4, 0.12], "#333");
  b.boite([0, 6.0, 1.4], [0.9, 0.5, 0.9], "#FFE3A0", undefined, 2.6);
  return b.construire();
}

// ------------------------------------------------------------------ Table, jouets géants, boîte, lampe, chambre (une seule géométrie, vertex colors)
function prisme(b: Batisseur, a: V3, v: V3, rayon: number, coulFut: string, pointe: boolean, coulBout = "#E8C48A", coulMine = "#D1332B") {
  // crayon hexagonal : `a` = base, `v` = vecteur vers la pointe (longueur = |v|)
  const L = Math.hypot(v[0], v[1], v[2]);
  const dir = new THREE.Vector3(...v).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 6).toNonIndexed();
  const lc = pointe ? L - rayon * 3.4 : L;
  const M = new THREE.Matrix4().compose(new THREE.Vector3(a[0] + (dir.x * lc) / 2, a[1] + (dir.y * lc) / 2, a[2] + (dir.z * lc) / 2), q, new THREE.Vector3(rayon, lc, rayon));
  b.geo(cyl, coulFut, M);
  if (pointe) {
    const cone = new THREE.CylinderGeometry(0.16, 1, 1, 6).toNonIndexed();
    const lt = rayon * 3.4 * 0.78;
    const base = new THREE.Vector3(a[0] + dir.x * lc, a[1] + dir.y * lc, a[2] + dir.z * lc);
    b.geo(cone, coulBout, new THREE.Matrix4().compose(base.clone().addScaledVector(dir, lt / 2), q, new THREE.Vector3(rayon, lt, rayon)));
    const mine = new THREE.CylinderGeometry(0.01, 1, 1, 6).toNonIndexed();
    const lm = rayon * 3.4 * 0.22;
    b.geo(mine, coulMine, new THREE.Matrix4().compose(base.clone().addScaledVector(dir, lt + lm / 2 - 0.02), q, new THREE.Vector3(rayon * 0.16, lm, rayon * 0.16)));
  }
}
export function construirePiece(): THREE.BufferGeometry {
  const b = nouveauBat();
  const bois = "#9A6A3C";
  // rebord arrondi (demi-cylindre) tout le long de l'avant, et sur les côtés (boîtes)
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 14).toNonIndexed();
  const largeur = TABLE.x1 - TABLE.x0;
  b.geo(cyl, "#B5834F", new THREE.Matrix4().compose(new THREE.Vector3(0, -1.6, BORD_Z - 1.6), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), new THREE.Vector3(1.6, largeur, 1.6)));
  b.boite([0, -5.2, BORD_Z - 0.9], [largeur, 6.4, 1.8], "#9A6A3C");
  b.boite([0, -9.0, BORD_Z - 4], [largeur - 8, 2.4, 10], "#6E4A2A");
  b.boite([TABLE.x0 - 0.9, -4.5, (TABLE.z0 + TABLE.z1) / 2], [1.8, 9, TABLE.z1 - TABLE.z0], bois);
  b.boite([TABLE.x1 + 0.9, -4.5, (TABLE.z0 + TABLE.z1) / 2], [1.8, 9, TABLE.z1 - TABLE.z0], bois);
  b.boite([0, -4.5, TABLE.z0 - 0.9], [largeur, 9, 1.8], bois);
  // pieds
  for (const [px, pz] of [[TABLE.x0 + 14, TABLE.z1 - 16], [TABLE.x1 - 14, TABLE.z1 - 16], [TABLE.x0 + 14, TABLE.z0 + 16], [TABLE.x1 - 14, TABLE.z0 + 16]]) {
    b.boite([px, (-9 + Y_SOL) / 2, pz], [14, -Y_SOL - 9, 14], "#8A5C32");
    b.boite([px, Y_SOL + 6, pz], [17, 12, 17], "#6E4A2A");
  }
  // chambre : plinthes et grand miroir de lumière de la fenêtre
  const L = 1040;
  for (const [cx, cz, sx, sz] of [[0, -430, L, 3], [0, 520, L, 3], [-520, 45, 3, 950], [520, 45, 3, 950]] as Array<[number, number, number, number]>) {
    b.boite([cx, Y_SOL + 9, cz + (cz === -430 ? 1.5 : cz === 520 ? -1.5 : 0)], [sx + (sx === L ? 0 : 6), 18, sz + (sz === 950 ? 0 : 6)], "#F4F0E6", undefined, 1.4);
    b.boite([cx, Y_SOL + 19, cz + (cz === -430 ? 3 : cz === 520 ? -3 : 0)], [sx + (sx === L ? 0 : 10), 3, sz + (sz === 950 ? 0 : 10)], "#FFFFFF", undefined, 1.4);
  }
  // crayons : un couché rouge, un couché vert, un debout bleu (la « tour »)
  prisme(b, [-210, 5.2, -118], [150, 0, 8], 5.2, "#D1332B", true);
  prisme(b, [90, 5.2, -148], [-110, 0, 40], 5.2, "#3FA45B", true, "#E8C48A", "#2E7A43");
  prisme(b, [-186, 0, -66], [0, 98, 0], 6.2, "#2F6FD8", true, "#E8C48A", "#2F6FD8");
  b.cylindre([-186, 22, -66], 6.45, 4.5, "#F4EFE2", 6);
  b.cylindre([-186, 60, -66], 6.45, 4.5, "#F4EFE2", 6);
  // gommes
  b.boite([-66, 4.5, -102], [26, 9, 14], "#F2A7B8");
  b.boite([-66, 4.5, -102], [12, 9.4, 14.4], "#3F6FC0");
  b.boite([60, 3.4, -84], [18, 6.8, 11], "#F4F0E6");
  b.boite([60, 3.4, -84], [9, 7.2, 11.4], "#C9453B");
  // cubes de l'alphabet (corps colorés ; les lettres sont des plans texturés dans le décor dynamique)
  for (const c of CUBES) b.boite(c.p, [c.s, c.s, c.s], c.coul);
  // boîte à jouets (parois, plancher, compartiments, couvercle ouvert)
  const bx = BOITE.x;
  const bz = BOITE.z;
  const bw = BOITE.w;
  const bd = BOITE.d;
  const bh = BOITE.h;
  b.boite([bx, BOITE.plancher / 2, bz], [bw, BOITE.plancher, bd], "#C58B4A");
  b.boite([bx, bh / 2, bz + bd / 2 - 0.6], [bw, bh, 1.2], "#D9A25A");
  b.boite([bx, bh / 2, bz - bd / 2 + 0.6], [bw, bh, 1.2], "#D9A25A");
  b.boite([bx - bw / 2 + 0.6, bh / 2, bz], [1.2, bh, bd], "#D9A25A");
  b.boite([bx + bw / 2 - 0.6, bh / 2, bz], [1.2, bh, bd], "#D9A25A");
  for (const dy of [bh - 0.5]) {
    b.boite([bx, dy, bz + bd / 2 - 0.3], [bw + 0.4, 1.0, 1.8], "#C9453B");
    b.boite([bx, dy, bz - bd / 2 + 0.3], [bw + 0.4, 1.0, 1.8], "#C9453B");
    b.boite([bx - bw / 2 + 0.3, dy, bz], [1.8, 1.0, bd + 0.4], "#C9453B");
    b.boite([bx + bw / 2 - 0.3, dy, bz], [1.8, 1.0, bd + 0.4], "#C9453B");
  }
  // cloisons : une entre chaque paire de cellules (aux limites calées sur CELLULES) + une médiane
  for (let k = 0; k < 5; k++) b.boite([CELLULES[k][0] + 3.72, 1.9, bz], [0.5, 2.0, bd - 2.4], "#B27A3F");
  b.boite([bx, 1.9, bz], [bw - 2.4, 2.0, 0.5], "#B27A3F");
  // couvercle ouvert à la verticale, dans le prolongement de la paroi du fond (l'étiquette est collée sur sa face intérieure)
  b.boite([bx, bh + 7.2, bz - bd / 2 + 0.6], [bw + 0.4, 14.4, 1.2], "#C58B4A");
  b.boite([bx, bh + 14.6, bz - bd / 2 + 0.6], [bw + 0.8, 0.9, 1.5], "#C9453B");
  // lampe de chevet : table de nuit, pied, abat-jour (lumineux)
  b.boite([LAMPE[0], -75, LAMPE[2]], [90, 150, 90], "#7A5A44");
  b.boite([LAMPE[0], -2, LAMPE[2]], [96, 4, 96], "#8E6A50");
  b.cylindre([LAMPE[0], 1, LAMPE[2]], 14, 6, "#C9453B", 12, 16);
  b.cylindre([LAMPE[0], 7, LAMPE[2]], 4, 38, "#E8D9B6", 8);
  return b.construire();
}
export const CUBES: Array<{ p: V3; s: number; coul: string; lettres: string[] }> = [
  { p: [170, 7, -112], s: 14, coul: "#E0453B", lettres: ["A", "B", "C", "D"] },
  { p: [186, 7, -112], s: 14, coul: "#3F7FD8", lettres: ["E", "F", "G", "H"] },
  { p: [178, 7, -128], s: 14, coul: "#EDB92E", lettres: ["I", "J", "K", "L"] },
  { p: [178, 21, -118], s: 14, coul: "#4FA95A", lettres: ["M", "N", "O", "P"] },
  { p: [150, 7, -134], s: 14, coul: "#C96AA0", lettres: ["1", "2", "3", "4"] },
];

// ------------------------------------------------------------------ CAVE : cellier + tunnel + échelle (diorama à x = -450)
export const CELLIER = { x0: -460, x1: -442, z0: -7, z1: 7, h: 7.4 };
export const TUNNEL = { x0: -442, x1: -396, hz: 2.9, h: 5.6 };
export function construireCave(): THREE.BufferGeometry {
  const b = nouveauBat();
  const { x0, x1, z0, z1, h } = CELLIER;
  const pierre = ["#6E5F4C", "#7A6A55", "#5F5242"];
  // cellier : sol, murs en pierres alternées, plafond, ouverture de l'escalier
  b.boite([(x0 + x1) / 2, -0.3, 0], [x1 - x0 + 2, 0.6, z1 - z0 + 2], "#4A3E32");
  for (let r = 0; r < 6; r++) {
    for (let k = 0; k < 14; k++) {
      const xx = x0 + 0.6 + k * 1.3 + (r % 2) * 0.65;
      if (xx > x1 + 0.2) continue;
      b.boite([xx, 0.6 + r * 1.2, z0 - 0.3], [1.28, 1.18, 0.7], pierre[(k + r) % 3]);
      b.boite([xx, 0.6 + r * 1.2, z1 + 0.3], [1.28, 1.18, 0.7], pierre[(k + r + 1) % 3]);
    }
    for (let k = 0; k < 11; k++) {
      const zz = z0 + 0.6 + k * 1.3 + (r % 2) * 0.65;
      if (zz > z1) continue;
      b.boite([x0 - 0.3, 0.6 + r * 1.2, zz], [0.7, 1.18, 1.28], pierre[(k + r) % 3]);
      if (Math.abs(zz) > TUNNEL.hz) b.boite([x1 + 0.3, 0.6 + r * 1.2, zz], [0.7, 1.18, 1.28], pierre[(k + r + 2) % 3]);
    }
  }
  // mur est : au-dessus de l'arche du tunnel
  b.boite([x1 + 0.3, TUNNEL.h + (h - TUNNEL.h) / 2, 0], [0.7, h - TUNNEL.h, 2 * TUNNEL.hz], pierre[0]);
  // plafond avec trou de l'escalier (côté ouest)
  b.boite([(x0 + 8 + x1) / 2, h + 0.3, 0], [x1 - x0 - 8, 0.6, z1 - z0 + 1.2], "#4A3E32");
  b.boite([x0 + 4, h + 0.3, -4.6], [8, 0.6, 3.6], "#4A3E32");
  b.boite([x0 + 4, h + 0.3, 4.6], [8, 0.6, 3.6], "#4A3E32");
  // escalier de bois de la trappe (monte vers l'ouest au nord du cellier) : marche k, dessus à 0,9 + 0,85 k
  for (let k = 0; k < 8; k++) {
    const yk = 0.9 + 0.85 * k;
    b.boite([x0 + 1.4 + (7 - k) * 0.95, yk / 2, -1.0], [0.95, yk, 2.6], k % 2 ? "#8A5C32" : "#7A5230");
    b.boite([x0 + 1.4 + (7 - k) * 0.95, yk + 0.04, -1.0], [0.95, 0.1, 2.66], "#A0713F");
  }
  // objets du cellier : tonneaux, caisses, étagère de bocaux
  for (const [px, pz] of [[x1 - 2.2, z1 - 2.0], [x1 - 4.4, z1 - 1.6]]) b.cylindre([px, 0, pz], 1.2, 2.2, "#8A5C32", 10);
  for (const [px, pz, s] of [[x1 - 2.4, z0 + 2.0, 1.8], [x1 - 2.4, z0 + 4.0, 1.5], [x0 + 10, z1 - 1.8, 2.0]] as Array<[number, number, number]>) b.boite([px, s / 2, pz], [s, s, s], "#A0713F");
  b.boite([x0 + 8.5, 3.0, z1 - 0.8], [6.0, 0.3, 1.2], "#6B4A2F");
  b.boite([x0 + 8.5, 4.6, z1 - 0.8], [6.0, 0.3, 1.2], "#6B4A2F");
  for (let k = 0; k < 6; k++) b.boite([x0 + 6.4 + k * 0.85, 3.45, z1 - 0.8], [0.5, 0.8, 0.5], pick(["#E0453B", "#EDB92E", "#4FA95A"], k * 1.7));
  // tunnel : sol, parois, plafond voûté en boîtes, tuyaux, caisses, flaque
  const { x0: t0, x1: t1, hz: tz, h: th } = TUNNEL;
  b.boite([(t0 + t1) / 2, -0.3, 0], [t1 - t0, 0.6, 2 * tz + 2], "#4A3E32");
  for (let r = 0; r < 5; r++) {
    for (let k = 0; k < 36; k++) {
      const xx = t0 + 0.7 + k * 1.3 + (r % 2) * 0.65;
      if (xx > t1) continue;
      b.boite([xx, 0.6 + r * 1.2, -tz - 0.3], [1.28, 1.18, 0.7], pierre[(k + r) % 3]);
      b.boite([xx, 0.6 + r * 1.2, tz + 0.3], [1.28, 1.18, 0.7], pierre[(k + 2 * r) % 3]);
    }
  }
  b.boite([(t0 + t1) / 2, th + 0.3, 0], [t1 - t0, 0.6, 2 * tz + 2], "#4A3E32");
  b.boite([t1 + 0.4, th / 2, 0], [0.8, th, 2 * tz + 1.6], "#5F5242");
  // tuyaux le long de la paroi gauche (-z), à deux hauteurs, avec vannes
  b.geo(new THREE.CylinderGeometry(0.28, 0.28, t1 - t0, 8).rotateZ(Math.PI / 2).toNonIndexed(), "#B5651D", new THREE.Matrix4().makeTranslation((t0 + t1) / 2, 3.9, -tz + 0.5));
  b.geo(new THREE.CylinderGeometry(0.2, 0.2, t1 - t0, 8).rotateZ(Math.PI / 2).toNonIndexed(), "#8A8F99", new THREE.Matrix4().makeTranslation((t0 + t1) / 2, 3.1, -tz + 0.45));
  b.geo(new THREE.CylinderGeometry(0.34, 0.34, t1 - t0, 8).rotateZ(Math.PI / 2).toNonIndexed(), "#5B6B8A", new THREE.Matrix4().makeTranslation((t0 + t1) / 2, 4.9, tz - 0.6));
  for (let x = t0 + 6; x < t1 - 4; x += 9) {
    b.boite([x, 3.9, -tz + 0.5], [0.5, 0.7, 0.5], "#6E3A12");
    b.boite([x, 4.45, -tz + 0.5], [0.12, 0.12, 0.9], "#D1332B");
    b.boite([x, 4.6, -tz + 0.5], [0.9, 0.12, 0.12], "#D1332B");
  }
  for (const [px, pz, s] of [[t0 + 12, tz - 0.9, 1.6], [t0 + 26, -tz + 1.1, 1.4], [t0 + 27.6, -tz + 1.0, 1.1]] as Array<[number, number, number]>) b.boite([px, s / 2, pz], [s, s, s], "#A0713F");
  b.boite([t0 + 20, 0.04, 0.6], [4.5, 0.06, 2.2], "#2C3E55", undefined, 1.4);
  // échelle au fond, vers la trappe de lumière
  for (const s of [-1, 1]) b.boite([t1 - 1.2, 3.0, s * 0.5], [0.16, 6.2, 0.16], "#8A5C32");
  for (let k = 0; k < 7; k++) b.boite([t1 - 1.2, 0.8 + k * 0.8, 0], [0.12, 0.12, 1.0], "#8A5C32");
  return b.construire();
}
