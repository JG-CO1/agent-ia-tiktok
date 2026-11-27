/**
 * Animations programmées de la ville : ballon (rebonds physiques, tir, retombée), poses de dribble / course /
 * tir / danse / invitation. Aucune dépendance React : testable seul.
 * Convention des bras (bible « blocs ») : x > 0 = bras vers l'arrière, x < 0 = vers l'avant, x ≈ -π = bras levés.
 */
import type { V3 } from "../geo";
import { HANCHE, melPose, poseDebout, poseMarche, type Membre, type Pose } from "../avatar";
import { borne, entre, mel } from "../maths";
import { G, R_BALLE } from "./lieux";

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });

// ------------------------------------------------------------------ Ballon : un cycle de dribble
/** Hauteurs du centre du ballon : contact avec le sol, lâché par la main, sommet (main levée). */
export const Y_SOL = R_BALLE;
export const Y_LACHE = 0.72;
export const Y_HAUT = 1.2;

/**
 * Ballon de dribble à la progression `u` (0 → 1) entre deux impacts au sol : remontée libre, la main le prend
 * et l'accompagne vers le haut, le repousse, il retombe en accélérant et frappe le sol à u = 1.
 */
export function cycleDribble(u: number): { y: number; main: boolean } {
  const k = borne(u);
  if (k < 0.22) {
    const s = k / 0.22;
    return { y: Y_SOL + (Y_LACHE - Y_SOL) * (1 - (1 - s) * (1 - s)), main: false };
  }
  if (k < 0.5) {
    const s = (k - 0.22) / 0.28;
    return { y: Y_LACHE + (Y_HAUT - Y_LACHE) * Math.sin((s * Math.PI) / 2), main: true };
  }
  if (k < 0.78) {
    const s = (k - 0.5) / 0.28;
    return { y: Y_HAUT - (Y_HAUT - Y_LACHE) * (1 - Math.cos((s * Math.PI) / 2)), main: true };
  }
  const s = (k - 0.78) / 0.22;
  return { y: Y_LACHE - (Y_LACHE - Y_SOL) * s * s, main: false };
}

/** Instants d'impact du ballon : ancres (mots HUSS) puis remplissage régulier (un rebond toutes les ~0,52 s). */
export function remplirImpacts(ancres: number[], debut: number, fin: number, pas = 0.52): number[] {
  const tous = [...new Set([debut, ...ancres.filter((a) => a > debut && a < fin), fin])].sort((a, b) => a - b);
  // deux impacts à moins de 0,2 s l'un de l'autre se fondent en un seul (on garde le plus tardif, sauf le tout premier)
  const pts: number[] = [];
  for (const t of tous) {
    if (!pts.length) pts.push(t);
    else if (t - pts[pts.length - 1] >= 0.2) pts.push(t);
    else if (t === fin) {
      if (pts.length > 1) pts[pts.length - 1] = t;
      else pts.push(t);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const g = pts[i + 1] - pts[i];
    const n = Math.max(1, Math.round(g / pas));
    for (let j = 0; j < n; j++) out.push(pts[i] + (g * j) / n);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Progression u dans le cycle de dribble à l'instant T, ou null hors de la liste d'impacts. */
export function uDribble(impacts: number[], T: number): { u: number; i: number; dt: number } | null {
  if (!impacts.length || T < impacts[0] || T >= impacts[impacts.length - 1]) return null;
  let lo = 0;
  let hi = impacts.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (impacts[mid] <= T) lo = mid;
    else hi = mid;
  }
  const dt = impacts[lo + 1] - impacts[lo];
  return { u: (T - impacts[lo]) / dt, i: lo, dt };
}

// ------------------------------------------------------------------ Ballon : tir, panier, retombée
export type BalleSim = { p: V3; vitesse: V3 };

/**
 * Trajectoire du ballon après le lâcher : parabole jusqu'au centre de l'anneau (atteint à `duree`), puis chute
 * à travers le filet et rebonds amortis (e = 0,62) qui ramènent le ballon vers `retour` (la main du joueur).
 * Renvoie la position à l'instant `t` (secondes depuis le lâcher) et les instants de contact avec le sol.
 */
export function trajetPanier(depart: V3, anneau: V3, duree: number, retour: V3, nbRebonds = 3) {
  const vx = (anneau[0] - depart[0]) / duree;
  const vz = (anneau[2] - depart[2]) / duree;
  const vy = (anneau[1] - depart[1] + 0.5 * G * duree * duree) / duree;
  // après l'anneau : on simule les rebonds pas à pas (pas de 1/240 s, déterministe)
  let y = anneau[1];
  let v = vy - G * duree;
  let t = duree;
  const sols: number[] = [];
  const dtp = 1 / 240;
  const pts: Array<{ t: number; y: number }> = [];
  while (sols.length < nbRebonds && t < duree + 12) {
    v -= G * dtp;
    y += v * dtp;
    t += dtp;
    if (y <= R_BALLE) {
      y = R_BALLE;
      v = -v * 0.62;
      sols.push(t);
    }
    pts.push({ t, y });
  }
  const tFin = sols[sols.length - 1];
  const apres = (tt: number) => {
    // y(t) échantillonné ; x, z glissent vers `retour` entre l'anneau et le dernier contact
    const idx = Math.min(pts.length - 1, Math.max(0, Math.round((tt - duree) / dtp) - 1));
    const k = borne((tt - duree) / (tFin - duree));
    const e = k * k * (3 - 2 * k);
    return [mel(anneau[0], retour[0], e), pts[idx]?.y ?? R_BALLE, mel(anneau[2], retour[2], e)] as V3;
  };
  const position = (tt: number): V3 => {
    if (tt <= duree) return [depart[0] + vx * tt, depart[1] + vy * tt - 0.5 * G * tt * tt, depart[2] + vz * tt];
    return apres(Math.min(tt, tFin));
  };
  return { position, sols, tFin, vy };
}

// ------------------------------------------------------------------ Cinématique inverse d'un bras (plan y-z)
const L1 = 0.4; // épaule → coude
const L2 = 0.5; // coude → bout de la main
/**
 * Bras qui amène le bout de la main en `cible` (y, z dans le repère de l'avatar, sol = 0), pour un bassin à `yBassin`
 * et un torse penché de `torse`. Coude plié vers l'avant.
 */
export function brasVers(cibleY: number, cibleZ: number, yBassin: number, torse: number): Membre {
  const sy = yBassin + 0.9 * Math.cos(torse);
  const sz = 0.9 * Math.sin(torse);
  let du = sy - cibleY; // vers le bas
  let db = sz - cibleZ; // vers l'arrière
  let D = Math.hypot(du, db);
  const Dmin = Math.abs(L1 - L2) + 0.03;
  const Dmax = L1 + L2 - 0.02;
  if (D > Dmax) {
    du *= Dmax / D;
    db *= Dmax / D;
    D = Dmax;
  }
  if (D < Dmin) {
    du *= Dmin / Math.max(D, 1e-3);
    db *= Dmin / Math.max(D, 1e-3);
    D = Dmin;
  }
  const gamma = Math.acos(borne((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2), -1, 1));
  const pli = -(Math.PI - gamma);
  const th1 = Math.atan2(db, du) - Math.atan2(L2 * Math.sin(pli), L1 + L2 * Math.cos(pli));
  return mb(th1 - torse, 0.05, pli);
}

/** Position du ballon, dans le repère de l'avatar, quand il le dribble de la main droite. */
export const BALLE_LOCALE = { x: -0.7, z: 0.66 };

/**
 * Pose de dribble : jambes fléchies, torse penché, bras droit qui suit le ballon (cinématique inverse), bras gauche
 * en protection. `u` = progression dans le cycle (0 = impact au sol).
 */
export function poseDribble(T: number, u: number, graine = 0): { pose: Pose; yBalle: number } {
  const c = cycleDribble(u);
  const torse = 0.3;
  const y = -0.16 + 0.05 * Math.cos(u * Math.PI * 2);
  const yBassin = HANCHE + y;
  const mainY = Math.max(c.y, Y_LACHE) + R_BALLE * 0.92;
  const droit = brasVers(mainY, BALLE_LOCALE.z, yBassin, torse);
  const flex = 0.55 + 0.1 * Math.cos(u * Math.PI * 2);
  const pose: Pose = {
    y,
    torse,
    tete: [Math.sin(T * 0.9 + graine) * 0.08, 0.22],
    jambeG: mb(-0.5, 0.1, flex),
    jambeD: mb(-0.28, 0.12, flex * 0.8),
    brasG: mb(-0.7, 0.42, -0.9),
    brasD: droit,
  };
  return { pose, yBalle: c.y };
}

// ------------------------------------------------------------------ Tir
/**
 * Tir à `k` ∈ [0, 1] : 0 = ballon aux hanches, 0,35 = flexion maximale, 0,6 = détente et lâcher, 1 = réception.
 * Renvoie la pose, le décalage vertical des pieds (saut) et la position du ballon tenu dans le repère de l'avatar.
 */
export function poseTir(k: number): { pose: Pose; saut: number; balle: [number, number, number] | null } {
  const flexion = Math.sin(Math.PI * borne(k / 0.45)) * (k < 0.45 ? 1 : 0);
  const detente = entre(k, 0.4, 0.62);
  const retombe = entre(k, 0.78, 1);
  const saut = Math.sin(Math.PI * entre(k, 0.5, 0.95)) * 0.55;
  const brasX = mel(-1.1, -2.85, detente) + retombe * 0.9;
  const pli = mel(-1.6, -0.12, detente);
  const pose: Pose = {
    y: -0.3 * flexion,
    torse: 0.14 * flexion - 0.08 * detente,
    tete: [0, mel(0.05, -0.38, detente)],
    jambeG: mb(-0.2 - 0.8 * flexion, 0.06, 1.0 * flexion),
    jambeD: mb(-0.2 - 0.8 * flexion, 0.06, 1.0 * flexion),
    brasG: mb(brasX, 0.22, pli),
    brasD: mb(brasX, -0.22, pli),
  };
  // ballon tenu entre les mains (avant le lâcher)
  const yb = mel(1.35, 4.05, detente) - 0.3 * flexion;
  const zb = mel(0.62, 0.45, detente);
  return { pose, saut, balle: k < 0.62 ? [0, yb, zb] : null };
}

/** Joie après le panier : bras levés, petits sauts. */
export function poseJoie(T: number, k = 1): Pose {
  const b = Math.abs(Math.sin(T * 6.5));
  return {
    y: -0.04 + b * 0.12,
    torse: -0.1,
    tete: [Math.sin(T * 3) * 0.1, -0.3],
    jambeG: mb(-0.1 + b * 0.2, 0.05, b * 0.3),
    jambeD: mb(-0.1 - b * 0.2, 0.05, b * 0.3),
    brasG: mb(-2.9 * k, 0.45, -0.1),
    brasD: mb(-2.9 * k + Math.sin(T * 9) * 0.2, -0.45, -0.1),
  };
}

// ------------------------------------------------------------------ Course, danse, invitation
export function poseCourse(phase: number): Pose {
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  return {
    y: Math.abs(c) * 0.12 - 0.05,
    torse: 0.28,
    tete: [0, 0.05],
    jambeG: mb(-s * 1.05, 0, Math.max(0, -c) * 1.3),
    jambeD: mb(s * 1.05, 0, Math.max(0, c) * 1.3),
    brasG: mb(s * 1.0, 0.1, -0.95),
    brasD: mb(-s * 1.0, 0.1, -0.95),
  };
}

/** Danse de fête : rebond sur le rythme (`phase` = 2π par temps), bras alternés en l'air. */
export function poseDanse(T: number, phase: number, variante = 0): Pose {
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  const v = variante % 3;
  if (v === 1) {
    // saut, bras levés ensemble
    const h = Math.abs(s);
    return { y: h * 0.28 - 0.04, torse: -0.05, tete: [s * 0.15, 0], jambeG: mb(-0.1, 0.05, h * 0.6), jambeD: mb(-0.1, 0.05, h * 0.6), brasG: mb(-2.7 + c * 0.25, 0.5, -0.2), brasD: mb(-2.7 - c * 0.25, -0.5, -0.2) };
  }
  if (v === 2) {
    // déhanché : un bras en l'air, l'autre sur la hanche
    return { y: Math.abs(s) * 0.1 - 0.04, torse: s * 0.06, tete: [c * 0.25, 0], jambeG: mb(s * 0.35, 0.12, Math.max(0, s) * 0.5), jambeD: mb(-s * 0.35, 0.12, Math.max(0, -s) * 0.5), brasG: mb(-2.5 + s * 0.4, 0.3, -0.3), brasD: mb(-0.4, -0.5, -1.4) };
  }
  return { y: Math.abs(s) * 0.12 - 0.05, torse: 0.04, tete: [s * 0.2, 0], jambeG: mb(s * 0.4, 0.1, Math.max(0, s) * 0.55), jambeD: mb(-s * 0.4, 0.1, Math.max(0, -s) * 0.55), brasG: mb(-1.9 + s * 0.7, 0.55, -0.5), brasD: mb(-1.9 - s * 0.7, -0.55, -0.5) };
}

/** Marche « fête » : marche normale, bras en l'air, léger rebond. */
export function poseMarcheFete(phase: number): Pose {
  const p = poseMarche(phase, 1.05);
  const s = Math.sin(phase);
  p.brasG = mb(-2.1 + s * 0.45, 0.5, -0.3);
  p.brasD = mb(-2.1 - s * 0.45, -0.5, -0.3);
  return p;
}

/** Il appelle quelqu'un : une main en porte-voix, l'autre fait un grand geste. */
export function poseAppel(T: number): Pose {
  const s = Math.sin(T * 7);
  return {
    y: 0,
    torse: -0.04,
    tete: [0, -0.1],
    jambeG: mb(-0.05, 0.08, 0),
    jambeD: mb(0.05, 0.08, 0),
    brasG: mb(-2.5 + s * 0.35, 0.65, -0.2),
    brasD: mb(-1.75, -0.2, -1.55),
  };
}

/** Il invite à venir : bras tendu qui fait signe. */
export function poseInvite(T: number): Pose {
  const s = Math.sin(T * 8);
  return { y: 0, torse: 0, tete: [0, 0], jambeG: mb(-0.05, 0.08, 0), jambeD: mb(0.05, 0.08, 0), brasG: mb(-1.4 + s * 0.5, 0.5, -0.6), brasD: mb(-0.15, 0.06, -0.1) };
}

/** Haussement d'épaules / bras écartés (« je ne comprends pas »). */
export function poseHausse(T: number): Pose {
  const s = Math.sin(T * 2.2) * 0.05;
  return { y: 0, torse: 0, tete: [0, 0.1], jambeG: mb(-0.04, 0.06, 0), jambeD: mb(0.04, 0.06, 0), brasG: mb(-0.6 + s, 0.95, -0.9), brasD: mb(-0.6 - s, -0.95, -0.9) };
}

export { melPose, poseDebout, poseMarche };
