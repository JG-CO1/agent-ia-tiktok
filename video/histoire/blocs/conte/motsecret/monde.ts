/**
 * « Le mot secret » — décors fixes en blocs, avec lumière « cuite » dans la géométrie : chaque dalle de plancher,
 * chaque panneau de mur et chaque meuble reçoit sa couleur d'un petit calcul d'éclairage (lampe ambrée du salon,
 * veilleuse de la chambre, lune par les fenêtres avec leurs croisillons, rayons bloqués par les meubles et les murs).
 * Résultat : ombres dures, flaques de lumière, contraste bleu nuit / ambre, sans aucune lumière réelle.
 *
 * Deux lieux éloignés l'un de l'autre (la caméra ne voit que celui où elle se trouve) :
 *   MAISON  (0, 0, 0)    salon-entrée (porte d'entrée au sud, z = +8), couloir (vers -z), chambre du petit frère
 *   PERRON  (400, 0, 0)  façade, perron et jardin brumeux vus de l'extérieur
 * Repère : +z = vers la porte d'entrée (dehors), -z = vers le fond de la maison ; +x = est (fenêtre du salon).
 */
import * as THREE from "three";
import { Batisseur, type V3 } from "../../geo";
import { sapin } from "../../minuit/monde";

export const H = 4.6;
export const PERRON: V3 = [400, 0, 0];

type R = { a: V3; b: V3 };
export const SALON_R: R = { a: [-7, 0, -3], b: [7, H, 8] };
export const COULOIR_R: R = { a: [-1.3, 0, -14], b: [1.3, H, -3.3] };
export const CHAMBRE_R: R = { a: [-5, 0, -23], b: [5, H, -14.3] };

/** Porte d'entrée : ouverture dans le mur sud du salon (x de -4,5 à -2,5, hauteur 3,5). Gond à l'est, serrure à l'ouest. */
export const PORTE = { x0: -4.5, x1: -2.5, h: 3.5, z: 8.0 };
/** Lampe de salon (ambre) et veilleuse (étoile) de la chambre. */
export const LAMPE: V3 = [-2.75, 2.75, -2.45];
export const VEILLEUSE: V3 = [-1.85, 2.2, -22.0];
/** Trappe de cave sous le tapis : centre (x, z), côté, charnière au nord. */
export const TRAPPE = { x: 3.3, z: 1.5, t: 2.2 };
export const TAPIS = { x0: 0.6, x1: 6.0, z0: -0.9, z1: 3.9 };
/** Lit du petit frère (long côté contre le mur ouest) et rabat de couverture. */
export const LIT = { x0: -4.9, x1: -2.3, z0: -22.6, z1: -16.4, dessous: 1.15, matelas: 1.7 };
/** Horloge murale sur le mur sud. */
export const HORLOGE: V3 = [1.0, 3.5, 7.9];
/** Fenêtres (lune). */
export const FEN_SALON = { plan: 7.0, u0: 1.0, u1: 4.4, y0: 1.3, y1: 3.7 };
export const FEN_COULOIR = { plan: 1.3, u0: -8.9, u1: -7.3, y0: 1.8, y1: 3.5 };
export const FEN_CHAMBRE = { plan: -23.0, u0: 0.6, u1: 3.4, y0: 1.4, y1: 3.9 };

// ------------------------------------------------------------------ Éclairage cuit
type RGB = [number, number, number];
const norm = (v: V3): V3 => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const dans = (p: V3, r: R) => p[0] >= r.a[0] && p[0] <= r.b[0] && p[1] >= r.a[1] && p[1] <= r.b[1] && p[2] >= r.a[2] && p[2] <= r.b[2];

/** Le segment [a, b] traverse-t-il la boîte ? (méthode des plans parallèles) */
function coupe(a: V3, b: V3, o: R): boolean {
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 3; i++) {
    const d = b[i] - a[i];
    if (Math.abs(d) < 1e-9) {
      if (a[i] < o.a[i] || a[i] > o.b[i]) return false;
    } else {
      let u = (o.a[i] - a[i]) / d;
      let v = (o.b[i] - a[i]) / d;
      if (u > v) [u, v] = [v, u];
      t0 = Math.max(t0, u);
      t1 = Math.min(t1, v);
      if (t0 > t1) return false;
    }
  }
  return true;
}

/** Boîtes qui arrêtent la lumière des lampes : murs, canapé, lit, armoire… */
const OCC: R[] = [
  { a: [-7.3, 0, -3.3], b: [-1.3, H, -3.0] },
  { a: [1.3, 0, -3.3], b: [7.3, H, -3.0] },
  { a: [-1.6, 0, -14.3], b: [-1.3, H, -3.3] },
  { a: [1.3, 0, -14.3], b: [1.6, H, -3.3] },
  { a: [-5.3, 0, -14.3], b: [-1.0, H, -14.0] },
  { a: [1.0, 0, -14.3], b: [5.3, H, -14.0] },
  { a: [1.9, 0, -2.9], b: [5.9, 1.9, -1.0] }, // canapé
  { a: [LIT.x0, LIT.dessous - 0.1, LIT.z0], b: [LIT.x1, 2.0, LIT.z1] }, // lit (le dessous reste dans l'ombre)
  { a: [3.9, 0, -19.5], b: [5.0, 4.0, -16.4] }, // armoire
  { a: [-2.4, 0, -22.7], b: [-1.3, 1.3, -21.6] }, // table de chevet
];

type Lampe = { p: V3; c: RGB; k: number; r: number; libre?: boolean };
/** Applique d'entrée (ambre) et lueur froide du verre dépoli de la porte. */
export const APPLIQUE: V3 = [-0.9, 3.1, 7.7];
export const VERRE: V3 = [-3.5, 2.6, 7.7];
const LAMPES: Lampe[] = [
  { p: LAMPE, c: [1.25, 0.72, 0.3], k: 1.9, r: 4.4 },
  { p: APPLIQUE, c: [1.2, 0.7, 0.3], k: 1.15, r: 3.6 },
  { p: VERRE, c: [0.42, 0.6, 1.0], k: 1.0, r: 3.4 },
  { p: VEILLEUSE, c: [1.1, 0.84, 0.44], k: 1.7, r: 4.0 },
  // lueur basse qui glisse sous le lit (sans quoi le dessous reste noir et le « rien » ne se voit pas)
  { p: [-1.0, 0.7, -19.2], c: [1.0, 0.78, 0.45], k: 1.9, r: 4.0, libre: true },
];
type Fen = { axe: 0 | 2; plan: number; u0: number; u1: number; y0: number; y1: number; d: V3; salle: R; croix: [number, number] };
const FENS: Fen[] = [
  { axe: 0, plan: FEN_SALON.plan, u0: FEN_SALON.u0, u1: FEN_SALON.u1, y0: FEN_SALON.y0, y1: FEN_SALON.y1, d: norm([-0.85, -0.45, -0.12]), salle: SALON_R, croix: [(FEN_SALON.u0 + FEN_SALON.u1) / 2, (FEN_SALON.y0 + FEN_SALON.y1) / 2] },
  { axe: 0, plan: FEN_COULOIR.plan, u0: FEN_COULOIR.u0, u1: FEN_COULOIR.u1, y0: FEN_COULOIR.y0, y1: FEN_COULOIR.y1, d: norm([-0.9, -0.3, 0.2]), salle: COULOIR_R, croix: [(FEN_COULOIR.u0 + FEN_COULOIR.u1) / 2, (FEN_COULOIR.y0 + FEN_COULOIR.y1) / 2] },
  { axe: 2, plan: FEN_CHAMBRE.plan, u0: FEN_CHAMBRE.u0, u1: FEN_CHAMBRE.u1, y0: FEN_CHAMBRE.y0, y1: FEN_CHAMBRE.y1, d: norm([0.05, -0.5, 0.85]), salle: CHAMBRE_R, croix: [(FEN_CHAMBRE.u0 + FEN_CHAMBRE.u1) / 2, (FEN_CHAMBRE.y0 + FEN_CHAMBRE.y1) / 2] },
];
const LUNE: RGB = [0.42, 0.56, 1.0];
const AMBIANT = (p: V3): RGB => (dans(p, COULOIR_R) ? [0.09, 0.12, 0.27] : dans(p, CHAMBRE_R) ? [0.2, 0.25, 0.42] : [0.11, 0.14, 0.31]);

/** Fraction de lune qui atteint le point `p` (0 à 1) : traverse le vitrage sans toucher les croisillons. */
function lune(p: V3, n: V3): number {
  let m = 0;
  for (const f of FENS) {
    if (!dans(p, f.salle)) continue;
    const dn = -(n[0] * f.d[0] + n[1] * f.d[1] + n[2] * f.d[2]);
    if (dn <= 0.02) continue;
    const s = (p[f.axe] - f.plan) / f.d[f.axe];
    if (s <= 0) continue;
    const q: V3 = [p[0] - f.d[0] * s, p[1] - f.d[1] * s, p[2] - f.d[2] * s];
    const u = f.axe === 0 ? q[2] : q[0];
    if (u < f.u0 || u > f.u1 || q[1] < f.y0 || q[1] > f.y1) continue;
    if (Math.abs(u - f.croix[0]) < 0.09 || Math.abs(q[1] - f.croix[1]) < 0.09) continue;
    m = Math.max(m, Math.min(1, 0.45 + dn));
  }
  return m;
}

/** Lumière reçue au point `p` (normale `n`), en facteur de couleur. `occ` : tester les ombres portées. */
export function eclairage(p: V3, n: V3 = [0, 1, 0], occ = true, sub = false): RGB {
  const amb = AMBIANT(p);
  let ao = 1;
  const salle = [SALON_R, COULOIR_R, CHAMBRE_R].find((r) => dans(p, r));
  if (salle) {
    const dm = Math.min(p[0] - salle.a[0], salle.b[0] - p[0], p[2] - salle.a[2], salle.b[2] - p[2]);
    ao = 0.58 + 0.42 * Math.min(1, Math.max(0, dm) / 1.6);
    const dv = Math.min(p[1], salle.b[1] - p[1]);
    ao *= 0.8 + 0.2 * Math.min(1, dv / 1.2);
  }
  const rgb: RGB = [amb[0] * ao, amb[1] * ao, amb[2] * ao];
  for (const l of LAMPES) {
    const dv: V3 = [l.p[0] - p[0], l.p[1] - p[1], l.p[2] - p[2]];
    const d = Math.hypot(...dv);
    const dif = (n[0] * dv[0] + n[1] * dv[1] + n[2] * dv[2]) / d;
    if (dif <= 0) continue;
    if (occ && !l.libre && OCC.some((o) => coupe(p, l.p, o) && !dans(p, o))) continue;
    const a = (l.k * (0.3 + 0.7 * dif)) / (1 + (d / l.r) ** 2) ** 2;
    rgb[0] += l.c[0] * a;
    rgb[1] += l.c[1] * a;
    rgb[2] += l.c[2] * a;
  }
  let m: number;
  if (sub) {
    // 4 sous-échantillons : bord de la tache de lune un peu adouci
    m = 0;
    for (const [dx, dz] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) m += lune([p[0] + dx, p[1], p[2] + dz], n) / 4;
  } else m = lune(p, n);
  rgb[0] += LUNE[0] * m * 0.85;
  rgb[1] += LUNE[1] * m * 0.85;
  rgb[2] += LUNE[2] * m * 0.85;
  return rgb;
}

const tmp = new THREE.Color();
/** Couleur d'aplat `hex` multipliée par la lumière. */
export function teindre(hex: string, rgb: RGB, g = 1): string {
  tmp.set(hex);
  tmp.r = Math.min(1.25, tmp.r * rgb[0] * g);
  tmp.g = Math.min(1.25, tmp.g * rgb[1] * g);
  tmp.b = Math.min(1.25, tmp.b * rgb[2] * g);
  tmp.r = Math.min(1, tmp.r);
  tmp.g = Math.min(1, tmp.g);
  tmp.b = Math.min(1, tmp.b);
  return `#${tmp.getHexString()}`;
}

// ------------------------------------------------------------------ Constructeur
class Mk {
  b = new Batisseur(true);

  /** Plancher : dalles de 0,5, couleur par `base(x, z)`. */
  sol(x0: number, z0: number, x1: number, z1: number, base: (x: number, z: number) => string, y = 0.04, cell = 0.5) {
    const nx = Math.round((x1 - x0) / cell);
    const nz = Math.round((z1 - z0) / cell);
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const xa = x0 + i * cell;
        const za = z0 + j * cell;
        const cx = xa + cell / 2;
        const cz = za + cell / 2;
        const l = eclairage([cx, 0.06, cz], [0, 1, 0], true, true);
        const planche = 0.9 + 0.1 * (((i * 3 + Math.floor(j / 3)) % 3) / 2);
        this.b.quad([xa, y, za], [xa, y, za + cell], [xa + cell, y, za + cell], [xa + cell, y, za], teindre(base(cx, cz), l, planche));
      }
  }

  plafond(r: R, couleur: string) {
    const cell = 1;
    const nx = Math.round((r.b[0] - r.a[0]) / cell);
    const nz = Math.round((r.b[2] - r.a[2]) / cell);
    const y = r.b[1];
    const xs = (r.b[0] - r.a[0]) / nx;
    const zs = (r.b[2] - r.a[2]) / nz;
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const xa = r.a[0] + i * xs;
        const za = r.a[2] + j * zs;
        const l = eclairage([xa + xs / 2, y - 0.05, za + zs / 2], [0, -1, 0], false);
        this.b.quad([xa, y, za], [xa + xs, y, za], [xa + xs, y, za + zs], [xa, y, za + zs], teindre(couleur, l));
      }
  }

  /**
   * Mur : plan `ax` à la position `pos`, épaisseur `ep`, de `u0` à `u1` (autre axe horizontal) et `y0` à `y1`.
   * `n` : sens de la normale intérieure. `trous` : ouvertures [u0, u1, y0, y1]. `base(y)` : couleur selon la hauteur.
   */
  mur(ax: "x" | "z", pos: number, u0: number, u1: number, y0: number, y1: number, n: 1 | -1, base: (y: number) => string, trous: Array<[number, number, number, number]> = [], ep = 0.3) {
    const us = new Set<number>();
    const ys = new Set<number>([y0, y1, 1.4, 2.6, 3.6]);
    for (let u = u0; u < u1; u += 1) us.add(+u.toFixed(3));
    us.add(u1);
    for (const t of trous) {
      us.add(t[0]);
      us.add(t[1]);
      ys.add(t[2]);
      ys.add(t[3]);
    }
    const U = [...us].filter((u) => u >= u0 && u <= u1).sort((a, b) => a - b);
    const Y = [...ys].filter((y) => y >= y0 && y <= y1).sort((a, b) => a - b);
    for (let i = 0; i < U.length - 1; i++)
      for (let j = 0; j < Y.length - 1; j++) {
        const uc = (U[i] + U[i + 1]) / 2;
        const yc = (Y[j] + Y[j + 1]) / 2;
        if (trous.some((t) => uc > t[0] && uc < t[1] && yc > t[2] && yc < t[3])) continue;
        const du = U[i + 1] - U[i];
        const dy = Y[j + 1] - Y[j];
        const P: V3 = ax === "z" ? [uc, yc, pos + n * (ep / 2 + 0.05)] : [pos + n * (ep / 2 + 0.05), yc, uc];
        const N: V3 = ax === "z" ? [0, 0, n] : [n, 0, 0];
        const l = eclairage(P, N, true, true);
        const c = teindre(base(yc), l);
        if (ax === "z") this.b.boite([uc, yc, pos], [du, dy, ep], c);
        else this.b.boite([pos, yc, uc], [ep, dy, du], c);
      }
  }

  /** Meuble : boîte éclairée sur sa face haute (découpée en tranches de 1,2 si elle est longue). */
  bloc(p: V3, s: V3, base: string, g = 1, rot?: V3) {
    const nx = Math.max(1, Math.round(s[0] / 1.2));
    const nz = Math.max(1, Math.round(s[2] / 1.2));
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const cx = p[0] - s[0] / 2 + ((i + 0.5) * s[0]) / nx;
        const cz = p[2] - s[2] / 2 + ((j + 0.5) * s[2]) / nz;
        const l = eclairage([cx, p[1] + s[1] / 2 + 0.06, cz], [0, 1, 0], true);
        // face verticale : mélange avec la lumière à mi-hauteur
        const m = eclairage([cx, p[1], cz], [0, 1, 0], true);
        const mix: RGB = [(l[0] + m[0]) / 2, (l[1] + m[1]) / 2, (l[2] + m[2]) / 2];
        this.b.boite([cx, p[1], cz], [s[0] / nx, s[1], s[2] / nz], teindre(base, mix, g), rot);
      }
  }

  /** Objet lumineux ou très petit : couleur d'aplat, sans calcul. */
  brut(p: V3, s: V3, couleur: string, rot?: V3, lum = 1) {
    this.b.boite(p, s, couleur, rot, lum);
  }
}

const papier = (y: number, haut: string, bas: string) => (y < 1.4 ? bas : haut);

// ------------------------------------------------------------------ Salon et entrée
function salon(m: Mk) {
  const { a, b } = SALON_R;
  // plancher (le tapis est dynamique : le sol dessous reste du parquet)
  m.sol(a[0], a[2], b[0], b[2], () => "#8A6340");
  m.plafond(SALON_R, "#B8AE9C");
  const haut = "#A9A8A6";
  const bas = "#554638";
  const pp = (y: number) => papier(y, haut, bas);
  // mur sud (porte d'entrée), mur nord (ouverture du couloir), mur est (fenêtre), mur ouest
  const trouPorte: [number, number, number, number] = [PORTE.x0, PORTE.x1, 0, PORTE.h];
  m.mur("z", 8.15, -7.3, 7.3, 0, H, -1, pp, [trouPorte]);
  m.mur("z", -3.15, -7.3, 7.3, 0, H, 1, pp, [[-1.3, 1.3, 0, 3.7]]);
  m.mur("x", 7.15, -3.3, 8.3, 0, H, -1, pp, [[FEN_SALON.u0, FEN_SALON.u1, FEN_SALON.y0, FEN_SALON.y1]]);
  m.mur("x", -7.15, -3.3, 8.3, 0, H, 1, pp);
  // encadrements : porte, passage du couloir, fenêtre
  const blanc = "#CFC6B4";
  const cadre = (p: V3, s: V3) => m.bloc(p, s, blanc, 0.9);
  cadre([PORTE.x0 - 0.12, PORTE.h / 2, 7.95], [0.24, PORTE.h, 0.2]);
  cadre([PORTE.x1 + 0.12, PORTE.h / 2, 7.95], [0.24, PORTE.h, 0.2]);
  cadre([(PORTE.x0 + PORTE.x1) / 2, PORTE.h + 0.12, 7.95], [PORTE.x1 - PORTE.x0 + 0.5, 0.24, 0.2]);
  cadre([-1.42, 1.85, -2.9], [0.24, 3.7, 0.2]);
  cadre([1.42, 1.85, -2.9], [0.24, 3.7, 0.2]);
  cadre([0, 3.82, -2.9], [2.9, 0.24, 0.2]);
  const f = FEN_SALON;
  cadre([6.9, f.y0 - 0.1, (f.u0 + f.u1) / 2], [0.2, 0.2, f.u1 - f.u0 + 0.4]);
  cadre([6.9, f.y1 + 0.1, (f.u0 + f.u1) / 2], [0.2, 0.2, f.u1 - f.u0 + 0.4]);
  cadre([6.9, (f.y0 + f.y1) / 2, f.u0 - 0.1], [0.2, f.y1 - f.y0, 0.2]);
  cadre([6.9, (f.y0 + f.y1) / 2, f.u1 + 0.1], [0.2, f.y1 - f.y0, 0.2]);
  cadre([6.92, (f.y0 + f.y1) / 2, (f.u0 + f.u1) / 2], [0.14, f.y1 - f.y0, 0.16]);
  cadre([6.92, (f.y0 + f.y1) / 2, (f.u0 + f.u1) / 2], [0.14, 0.16, f.u1 - f.u0]);
  // plinthe et cimaise
  // (la plinthe du mur sud s'arrête de part et d'autre de la porte : le jour sous la porte doit rester visible)
  for (const [x, z, sx, sz] of [[-5.75, 7.9, 2.5, 0.1], [2.25, 7.9, 9.5, 0.1], [0, -2.9, 14, 0.1], [-6.9, 2.5, 0.1, 11], [6.9, 2.5, 0.1, 11]] as Array<[number, number, number, number]>) m.bloc([x, 0.18, z], [sx, 0.36, sz], "#CFC6B4", 0.85);
  // seuil de la porte, paillasson
  m.bloc([-3.5, 0.06, 6.4], [2.2, 0.04, 1.3], "#3A3F4A");
  // canapé contre le mur nord
  m.bloc([3.9, 0.5, -1.95], [4.2, 1.0, 1.7], "#7A3340");
  m.bloc([3.9, 1.5, -2.75], [4.2, 1.6, 0.5], "#6A2C38");
  m.bloc([1.95, 0.95, -1.95], [0.4, 1.9, 1.7], "#6A2C38");
  m.bloc([5.85, 0.95, -1.95], [0.4, 1.9, 1.7], "#6A2C38");
  for (const x of [2.9, 4.0, 5.0]) m.bloc([x, 1.12, -1.75], [1.0, 0.26, 1.2], "#8A3E4C");
  // cadres au-dessus du canapé
  m.bloc([3.0, 3.3, -2.92], [1.4, 1.0, 0.06], "#3A2A1E");
  m.bloc([3.0, 3.3, -2.88], [1.1, 0.7, 0.05], "#8FA0B8");
  m.bloc([4.9, 3.0, -2.92], [0.9, 1.2, 0.06], "#3A2A1E");
  m.bloc([4.9, 3.0, -2.88], [0.62, 0.92, 0.05], "#B8A078");
  // commode de la lampe (ouvre sur le couloir)
  m.bloc([-2.75, 0.8, -2.45], [1.9, 1.6, 0.9], "#4F3623");
  m.bloc([-2.75, 0.85, -1.99], [0.06, 1.2, 0.04], "#2A1C12");
  m.bloc([-2.75, 1.66, -2.45], [2.05, 0.1, 1.0], "#5B4029");
  // bibliothèque contre le mur est (au nord de la fenêtre)
  m.bloc([6.55, 1.9, -1.45], [0.8, 3.8, 2.6], "#4A3322");
  for (let i = 0; i < 4; i++) {
    const y = 0.9 + i * 0.85;
    m.bloc([6.45, y, -1.45], [0.6, 0.08, 2.4], "#6B4A30");
    for (let k = 0; k < 6; k++) m.bloc([6.45, y + 0.3, -2.4 + k * 0.38], [0.4, 0.5 + ((k * 7 + i) % 3) * 0.08, 0.28], ["#7A3B3B", "#3B5A7A", "#8A7A3B", "#4A6B4A", "#6B4A7A", "#7A6B5B"][(k + i * 2) % 6]);
  }
  // escalier contre le mur ouest, qui monte vers le nord et se perd dans le noir
  for (let i = 0; i < 16; i++) {
    const z = 6.2 - i * 0.56;
    const top = 0.25 * (i + 1);
    m.bloc([-6.0, top / 2, z], [1.8, top, 0.56], i % 2 ? "#6E5038" : "#785840");
  }
  // rampe : poteaux et main courante inclinée
  for (let i = 0; i < 16; i += 3) m.bloc([-5.0, 0.25 * (i + 1) + 0.7, 6.2 - i * 0.56], [0.12, 1.4, 0.12], "#3C2A1C");
  m.brut([-5.0, 0.25 * 8 + 1.4, 6.2 - 7.5 * 0.56], [0.12, 0.12, 9.2], "#2A1C12", [Math.atan2(0.25, 0.56), 0, 0]);
  // patère et manteaux près de la porte
  m.bloc([-6.0, 3.1, 7.88], [2.2, 0.2, 0.18], "#3C2A1C");
  for (const x of [-6.8, -6.0, -5.2]) m.bloc([x, 3.0, 7.7], [0.1, 0.1, 0.3], "#B8A47A");
  m.bloc([-6.8, 2.1, 7.5], [0.7, 1.8, 0.4], "#2A2E3E");
  m.bloc([-6.0, 2.2, 7.5], [0.7, 1.6, 0.4], "#4A3A32");
  m.bloc([-5.2, 2.0, 7.5], [0.6, 2.0, 0.35], "#2E3A32");
  // chaussures, plante
  m.bloc([-5.2, 0.15, 7.3], [1.3, 0.3, 0.5], "#2A221C");
  m.bloc([6.2, 0.45, 7.2], [0.8, 0.9, 0.8], "#7A4A32");
  for (const [dx, dy, dz, ry] of [[0, 1.4, 0, 0.3], [0.5, 1.9, 0.2, 1.1], [-0.4, 2.2, -0.1, 2.0], [0.1, 2.6, 0.3, 0.7]] as Array<[number, number, number, number]>) m.bloc([6.2 + dx, dy, 7.2 + dz], [1.1, 0.5, 0.4], "#2F5A3A", 1, [0, ry, 0.4]);
  // horloge murale : boîtier, cadran crème, graduations, aiguilles à 2 h
  const [hx, hy, hz] = HORLOGE;
  m.bloc([hx, hy, hz + 0.0], [1.5, 1.5, 0.16], "#3C2A1C");
  m.brut([hx, hy, hz - 0.09], [1.2, 1.2, 0.04], "#E6DCC4");
  for (let k = 0; k < 12; k++) {
    const an = (k * Math.PI) / 6;
    m.brut([hx - Math.sin(an) * 0.5, hy + Math.cos(an) * 0.5, hz - 0.12], [k % 3 === 0 ? 0.08 : 0.04, k % 3 === 0 ? 0.14 : 0.08, 0.02], "#1A1410", [0, 0, an]);
  }
  m.brut([hx, hy + 0.22, hz - 0.13], [0.06, 0.44, 0.02], "#14100C"); // minutes : 12
  m.brut([hx - 0.19, hy + 0.11, hz - 0.13], [0.07, 0.3, 0.02], "#14100C", [0, 0, Math.PI / 3]); // heure : 2
  // lustre éteint
  m.brut([0, H - 0.12, 3], [0.9, 0.24, 0.9], "#2A2A2E");
}

// ------------------------------------------------------------------ Couloir
function couloir(m: Mk) {
  const { a, b } = COULOIR_R;
  m.sol(a[0], a[2], b[0], b[2], (x) => (Math.abs(x) < 0.55 ? "#6A2630" : "#7A5538"));
  m.plafond(COULOIR_R, "#A8A090");
  const pp = (y: number) => papier(y, "#8E9A86", "#4E5A48");
  m.mur("x", -1.45, -14.3, -3.3, 0, H, 1, pp, [], 0.3);
  const f = FEN_COULOIR;
  m.mur("x", 1.45, -14.3, -3.3, 0, H, -1, pp, [[f.u0, f.u1, f.y0, f.y1]]);
  m.mur("z", -14.075, -1.6, 1.6, 0, H, 1, pp, [[-1.0, 1.0, 0, 3.5]], 0.15);
  const blanc = "#CFC6B4";
  const cadre = (p: V3, s: V3) => m.bloc(p, s, blanc, 0.9);
  // fenêtre
  cadre([1.35, f.y0 - 0.08, (f.u0 + f.u1) / 2], [0.2, 0.16, f.u1 - f.u0 + 0.3]);
  cadre([1.35, f.y1 + 0.08, (f.u0 + f.u1) / 2], [0.2, 0.16, f.u1 - f.u0 + 0.3]);
  cadre([1.35, (f.y0 + f.y1) / 2, (f.u0 + f.u1) / 2], [0.14, f.y1 - f.y0, 0.12]);
  cadre([1.35, (f.y0 + f.y1) / 2, (f.u0 + f.u1) / 2], [0.14, 0.12, f.u1 - f.u0]);
  // portes fermées (mur ouest à z = -5,6 ; mur est à z = -11) et cadres photo
  for (const [x, z, s] of [[-1.3, -5.6, 1] as const, [1.3, -11.0, -1] as const]) {
    m.bloc([x + 0.06 * s, 1.75, z], [0.1, 3.5, 1.4], "#5A3B26");
    m.bloc([x + 0.12 * s, 1.75, z], [0.05, 2.9, 1.0], "#6A4630");
    m.bloc([x + 0.14 * s, 1.7, z + 0.5], [0.08, 0.14, 0.14], "#B8A47A");
  }
  for (const [x, y, z, s] of [[-1.28, 2.6, -9.2, 1], [-1.28, 2.4, -11.8, 1], [1.28, 2.5, -5.2, -1], [1.28, 2.7, -13.0, -1]] as Array<[number, number, number, number]>) {
    m.bloc([x, y, z], [0.1, 1.0, 0.8], "#2A1C12");
    m.bloc([x + 0.04 * s, y, z], [0.05, 0.76, 0.56], "#B8A88A");
  }
  // console et lampe éteinte près de l'entrée du couloir, lustre éteint
  m.bloc([-1.0, 0.8, -4.4], [0.6, 1.6, 1.6], "#4A3322");
  m.brut([0, H - 0.1, -8], [0.6, 0.2, 0.6], "#2A2A2E");
  // plinthes
  m.bloc([-1.25, 0.18, -8.65], [0.1, 0.36, 10.7], blanc, 0.85);
  m.bloc([1.25, 0.18, -8.65], [0.1, 0.36, 10.7], blanc, 0.85);
  // encadrement de la porte de la chambre
  cadre([-1.12, 1.75, -13.95], [0.24, 3.5, 0.2]);
  cadre([1.12, 1.75, -13.95], [0.24, 3.5, 0.2]);
  cadre([0, 3.62, -13.95], [2.5, 0.24, 0.2]);
}

// ------------------------------------------------------------------ Chambre du petit frère
function chambre(m: Mk) {
  const { a, b } = CHAMBRE_R;
  const tapis = (x: number, z: number) => Math.hypot(x - 0.4, z + 18.6) < 2.1;
  m.sol(a[0], a[2], b[0], b[2], (x, z) => (tapis(x, z) ? "#5C7FC0" : "#8A6340"));
  m.plafond(CHAMBRE_R, "#B0B4C4");
  const pp = (y: number) => papier(y, "#8FA6CA", "#566C9A");
  const f = FEN_CHAMBRE;
  m.mur("x", -5.15, -23.3, -14.0, 0, H, 1, pp);
  m.mur("x", 5.15, -23.3, -14.0, 0, H, -1, pp);
  m.mur("z", -23.15, -5.3, 5.3, 0, H, 1, pp, [[f.u0, f.u1, f.y0, f.y1]]);
  m.mur("z", -14.225, -5.3, 5.3, 0, H, -1, pp, [[-1.0, 1.0, 0, 3.5]], 0.15);
  const blanc = "#D6D2C6";
  const cadre = (p: V3, s: V3) => m.bloc(p, s, blanc, 0.9);
  // fenêtre au nord : cadre, croisillons
  cadre([(f.u0 + f.u1) / 2, f.y0 - 0.08, -22.95], [f.u1 - f.u0 + 0.5, 0.16, 0.3]);
  cadre([(f.u0 + f.u1) / 2, f.y1 + 0.08, -22.95], [f.u1 - f.u0 + 0.5, 0.16, 0.3]);
  cadre([f.u0 - 0.08, (f.y0 + f.y1) / 2, -22.95], [0.16, f.y1 - f.y0, 0.3]);
  cadre([f.u1 + 0.08, (f.y0 + f.y1) / 2, -22.95], [0.16, f.y1 - f.y0, 0.3]);
  cadre([(f.u0 + f.u1) / 2, (f.y0 + f.y1) / 2, -22.98], [0.14, f.y1 - f.y0, 0.14]);
  cadre([(f.u0 + f.u1) / 2, (f.y0 + f.y1) / 2, -22.98], [f.u1 - f.u0, 0.14, 0.14]);
  // rideaux
  m.bloc([f.u0 - 0.55, 2.8, -22.8], [0.7, 3.4, 0.2], "#8A4A5A");
  m.bloc([f.u1 + 0.55, 2.8, -22.8], [0.7, 3.4, 0.2], "#8A4A5A");
  // encadrement de la porte (côté chambre)
  cadre([-1.12, 1.75, -14.35], [0.24, 3.5, 0.2]);
  cadre([1.12, 1.75, -14.35], [0.24, 3.5, 0.2]);
  cadre([0, 3.62, -14.35], [2.5, 0.24, 0.2]);
  // lit contre le mur ouest : cadre sur pieds (le dessous reste libre), matelas, oreiller, couverture bleue étoilée
  for (const x of [LIT.x0 + 0.1, LIT.x1 - 0.1]) for (const z of [LIT.z0 + 0.1, LIT.z1 - 0.1]) m.bloc([x, 0.55, z], [0.2, 1.1, 0.2], "#5B4026");
  m.bloc([(LIT.x0 + LIT.x1) / 2, LIT.dessous + 0.1, (LIT.z0 + LIT.z1) / 2], [LIT.x1 - LIT.x0, 0.2, LIT.z1 - LIT.z0], "#6B4A2F");
  m.bloc([(LIT.x0 + LIT.x1) / 2, LIT.dessous + 0.45, (LIT.z0 + LIT.z1) / 2], [LIT.x1 - LIT.x0 - 0.1, 0.5, LIT.z1 - LIT.z0 - 0.1], "#E4E8F2");
  m.bloc([(LIT.x0 + LIT.x1) / 2, LIT.matelas - 0.02, -18.4], [LIT.x1 - LIT.x0 - 0.1, 0.3, 3.9], "#3E5AA6");
  m.bloc([(LIT.x0 + LIT.x1) / 2, LIT.matelas + 0.06, -17.0], [LIT.x1 - LIT.x0 - 0.5, 0.06, 0.12], "#F2D45C");
  m.bloc([(LIT.x0 + LIT.x1) / 2, LIT.matelas + 0.04, -19.5], [0.14, 0.04, 0.14], "#F2D45C");
  m.bloc([(LIT.x0 + LIT.x1) / 2, LIT.matelas + 0.1, -22.0], [1.5, 0.3, 0.9], "#F2F2F6");
  m.bloc([(LIT.x0 + LIT.x1) / 2, 2.2, LIT.z0 - 0.05], [LIT.x1 - LIT.x0, 2.0, 0.2], "#6B4A2F"); // tête de lit
  // sous le lit : rien du tout (le « Personne » doit se voir : parquet nu)
  // table de chevet + veilleuse en étoile
  m.bloc([-1.85, 0.6, -22.1], [1.0, 1.2, 1.0], "#5B4026");
  m.bloc([-1.85, 1.24, -22.1], [1.1, 0.08, 1.1], "#6B4A2F");
  // armoire et coffre à jouets, étagère
  m.bloc([4.45, 2.0, -17.9], [1.1, 4.0, 3.2], "#4F3A28");
  m.bloc([3.88, 2.0, -17.9], [0.04, 3.6, 0.06], "#2A1C12");
  m.bloc([2.8, 0.55, -15.0], [1.5, 1.1, 1.0], "#8A4A32");
  m.bloc([2.8, 1.12, -15.0], [1.6, 0.1, 1.1], "#6A3A28");
  m.bloc([4.7, 2.6, -21.4], [0.6, 0.1, 2.4], "#6B4A2F");
  for (let k = 0; k < 4; k++) m.bloc([4.6, 2.95, -22.3 + k * 0.6], [0.4, 0.5, 0.4], ["#C94B3B", "#F2C94C", "#4B8AC9", "#4BA86B"][k]);
  // jouets au sol : cubes
  m.bloc([1.9, 0.2, -15.9], [0.4, 0.4, 0.4], "#C94B3B", 1, [0, 0.4, 0]);
  m.bloc([-0.6, 0.2, -19.7], [0.4, 0.4, 0.4], "#4B8AC9", 1, [0, 1.1, 0]);
  m.bloc([-0.2, 0.2, -20.2], [0.4, 0.4, 0.4], "#F2C94C", 1, [0, 0.2, 0]);
  m.bloc([-0.4, 0.55, -19.95], [0.4, 0.4, 0.4], "#4BA86B", 1, [0, 0.8, 0]);
  // « l'ami » : dessin d'enfant au crayon sur le mur du fond, au-dessus de la tête de lit
  const dx = -0.9;
  const dz = -22.95;
  m.bloc([dx, 2.7, dz + 0.04], [2.8, 3.0, 0.06], "#D8CDB0");
  m.bloc([dx, 2.7, dz + 0.07], [2.6, 2.8, 0.03], "#E6DCC2");
  const crayon = "#1A1A22";
  m.brut([dx + 0.5, 2.5, dz + 0.1], [0.34, 1.7, 0.04], crayon); // corps immense et fin
  m.brut([dx + 0.5, 3.6, dz + 0.1], [0.42, 0.46, 0.04], crayon); // tête
  m.brut([dx + 0.05, 2.9, dz + 0.1], [0.9, 0.08, 0.04], crayon, [0, 0, 0.5]); // bras gauche
  m.brut([dx + 1.0, 2.8, dz + 0.1], [0.9, 0.08, 0.04], crayon, [0, 0, -0.55]); // bras droit
  m.brut([dx + 0.4, 1.5, dz + 0.1], [0.08, 1.0, 0.04], crayon, [0, 0, 0.05]);
  m.brut([dx + 0.62, 1.5, dz + 0.1], [0.08, 1.0, 0.04], crayon, [0, 0, -0.05]);
  m.brut([dx - 0.65, 1.7, dz + 0.1], [0.3, 0.38, 0.04], "#E0B040"); // le petit : Tom, en jaune
  m.brut([dx - 0.65, 1.3, dz + 0.1], [0.34, 0.5, 0.04], "#E0B040");
  m.brut([dx - 0.3, 1.5, dz + 0.1], [0.5, 0.06, 0.04], "#E0B040", [0, 0, 0.25]); // la main donnée à l'ami
  m.brut([dx + 0.5, 3.6, dz + 0.12], [0.07, 0.07, 0.03], "#E6DCC2"); // pas d'yeux : deux trous blancs
  m.brut([dx + 0.68, 3.6, dz + 0.12], [0.07, 0.07, 0.03], "#E6DCC2");
  // plinthe
  m.bloc([-5.0, 0.18, -18.65], [0.1, 0.36, 8.7], blanc, 0.85);
  m.bloc([5.0, 0.18, -18.65], [0.1, 0.36, 8.7], blanc, 0.85);
}

// ------------------------------------------------------------------ Perron (extérieur, vu de dehors)
function perron(): THREE.BufferGeometry {
  const b = new Batisseur(false);
  const [X] = PERRON;
  b.boite([X, -0.5, -10], [600, 1, 640], "#1F2D33"); // jardin sombre
  b.boite([X - 3.5, 0.02, 14], [3.0, 0.08, 20], "#5A5F68"); // allée dallée
  for (let z = 6; z < 24; z += 2.2) b.boite([X - 3.5, 0.07, z], [2.8, 0.06, 0.1], "#3E434C");
  // façade : bardage gris-bleu, ouverture de la porte, fenêtre
  const mur = "#7384A2";
  b.boite([X - 9.75, 3.0, 0], [10.5, 6.0, 0.6], mur); // gauche de la porte
  b.boite([X + 3.25, 3.0, 0], [11.5, 6.0, 0.6], mur); // droite de la porte
  b.boite([X - 3.5, 4.75, 0], [2.0, 2.5, 0.6], mur);
  for (let y = 0.6; y < 6; y += 0.6) {
    if (y > 3.8) b.boite([X - 1.5, y, 0.33], [26, 0.05, 0.04], "#5E6C88");
    else {
      b.boite([X - 9.8, y, 0.33], [10.4, 0.05, 0.04], "#5E6C88");
      b.boite([X + 3.3, y, 0.33], [11.4, 0.05, 0.04], "#5E6C88");
    }
  }
  // le perron : plancher, deux marches, auvent soutenu par deux poteaux
  b.boite([X - 3.5, 0.25, 2.2], [8.2, 0.5, 4.4], "#6A5444");
  b.boite([X - 3.5, 0.12, 5.1], [6.0, 0.24, 1.2], "#5E4A3C");
  b.boite([X - 3.5, 0.5, 2.2], [8.4, 0.1, 4.6], "#7A6454");
  b.boite([X - 3.5, 6.1, 2.1], [9.0, 0.3, 4.8], "#3E3236");
  for (const dx of [-7.4, 0.4]) b.boite([X + dx, 3.1, 4.3], [0.3, 6.0, 0.3], "#CFC6B4");
  b.boite([X - 7.0, 1.0, 4.3], [0.1, 1.0, 0.1], "#CFC6B4");
  // encadrement, seuil, boîte aux lettres, lanterne de porte (éteinte)
  const blanc = "#CFC6B4";
  b.boite([X + PORTE.x0 - 0.12, 1.75, 0.35], [0.24, 3.5, 0.2], blanc);
  b.boite([X + PORTE.x1 + 0.12, 1.75, 0.35], [0.24, 3.5, 0.2], blanc);
  b.boite([X - 3.5, 3.62, 0.35], [2.7, 0.24, 0.2], blanc);
  b.boite([X - 3.5, 0.55, 0.45], [2.4, 0.1, 0.5], "#7A6454");
  b.boite([X - 1.4, 3.6, 0.45], [0.4, 0.7, 0.4], "#14161C");
  b.boite([X + 1.6, 2.0, 0.45], [0.7, 0.5, 0.3], "#3C4048");
  // fenêtre à volets de la façade (éteinte)
  b.boite([X - 9.5, 2.9, 0.34], [2.6, 2.4, 0.1], "#10131C");
  b.boite([X - 9.5, 2.9, 0.4], [0.1, 2.4, 0.1], blanc);
  b.boite([X - 9.5, 2.9, 0.4], [2.6, 0.1, 0.1], blanc);
  b.boite([X - 11.2, 2.9, 0.4], [0.8, 2.6, 0.08], "#3B4A63");
  b.boite([X - 7.8, 2.9, 0.4], [0.8, 2.6, 0.08], "#3B4A63");
  // toit de la maison derrière, haies, lampadaire éteint, sapins et arbres nus dans la brume
  b.boite([X, 8.2, -3], [26, 2.4, 9], "#2A2430");
  b.boite([X, 10, -4], [20, 2.0, 6], "#241F2A");
  for (const [dx, dz, s] of [[-14, 7, 1.6], [-10, 8.5, 1.1], [7, 8, 1.4], [11, 7.5, 1.8], [-6.7, 7.8, 0.9]] as Array<[number, number, number]>) b.boule([X + dx, 0.9 * s, dz], [1.6 * s, 1.0 * s, 1.3 * s], "#1F3A2A", 0);
  b.boite([X + 8.5, 3.5, 12], [0.26, 7, 0.26], "#1A1C22"); // lampadaire éteint
  b.boite([X + 8.1, 7.0, 12], [1.1, 0.2, 0.2], "#1A1C22");
  b.boite([X + 7.7, 6.8, 12], [0.5, 0.3, 0.4], "#2E3036");
  for (const [dx, dz, s] of [[-26, 16, 1.8], [-34, -4, 2.0], [26, 18, 1.7], [34, 0, 2.1], [-20, 36, 1.6], [18, 40, 1.8], [0, 52, 2.2], [-8, 60, 2.0]] as Array<[number, number, number]>) sapin(b, X + dx, dz, s);
  // clôture basse
  for (let x = -22; x <= 18; x += 1.6) if (Math.abs(x + 3.5) > 2.2) b.boite([X + x, 0.6, 20], [0.14, 1.2, 0.14], "#3A3F4A");
  b.boite([X - 2, 0.9, 20], [40, 0.1, 0.1], "#3A3F4A");
  return b.construire();
}

export type Zones = { maison: THREE.BufferGeometry; perron: THREE.BufferGeometry };

export function construireMotsecret(): Zones {
  const m = new Mk();
  salon(m);
  couloir(m);
  chambre(m);
  return { maison: m.b.construire(), perron: perron() };
}
