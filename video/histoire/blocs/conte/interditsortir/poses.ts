/**
 * Poses propres à « Interdit de sortir » (même convention que conte/poses.ts : bras x < 0 = vers l'avant, x ≈ −π = levés,
 * pli < 0 = coude replié vers l'épaule ; torse > 0 = penché en avant ; tête : [lacet, tangage > 0 = vers le bas]).
 */
import { poseAssise, poseDebout, type Membre, type Pose } from "../../avatar";

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });

/** Jumelles collées aux yeux : les deux mains au niveau du visage, coudes écartés. */
export function poseJumelles(T: number, g = 0): Pose {
  const r = Math.sin(T * 2.2 + g) * 0.012;
  return { y: 0, torse: -0.02, tete: [Math.sin(T * 0.7 + g) * 0.025, -0.02], jambeG: mb(-0.04, 0.08), jambeD: mb(0.04, 0.08), brasG: mb(-1.9 + r, -0.5, -1.2), brasD: mb(-1.9 - r, -0.5, -1.2) };
}
/** Tient un objet devant la poitrine à deux mains (jumelles baissées, regard au loin). */
export function poseTient(T: number, g = 0): Pose {
  const r = Math.sin(T * 1.5 + g) * 0.015;
  return { y: 0, torse: 0.03, tete: [0, 0.05], jambeG: mb(-0.05, 0.08), jambeD: mb(0.05, 0.08), brasG: mb(-1.2 + r, -0.4, -0.55), brasD: mb(-1.2 - r, -0.4, -0.55) };
}
/** Fait de grands signes d'une main (le bras droit levé qui balaie de gauche à droite). */
export function poseSigne(T: number): Pose {
  const s = Math.sin(T * 8.5);
  return { y: 0, torse: 0, tete: [0, -0.06], jambeG: mb(-0.05, 0.08), jambeD: mb(0.05, 0.08), brasG: mb(0.08, 0.07, -0.05), brasD: mb(-2.75, -0.35 + s * 0.4, -0.25) };
}
/** Les deux bras tendus vers le haut, tenant une pancarte au-dessus de la tête. */
export function posePancarte(T: number): Pose {
  const r = Math.sin(T * 3) * 0.015;
  return { y: 0, torse: -0.06, tete: [0, -0.12], jambeG: mb(-0.05, 0.1), jambeD: mb(0.05, 0.1), brasG: mb(-2.95 + r, 0.2, -0.08), brasD: mb(-2.95 - r, 0.2, -0.08) };
}
/** Se penche pour ramasser (la pancarte posée au pied du parapet). */
export function posePenche(): Pose {
  return { y: -0.1, torse: 0.85, tete: [0, 0.3], jambeG: mb(-0.2, 0.08, 0.3), jambeD: mb(-0.2, 0.08, 0.3), brasG: mb(-0.9, 0.1, -0.1), brasD: mb(-0.9, -0.1, -0.1) };
}
/** Grimpe à l'échelle : bras alternés tendus vers le haut, jambes alternées. */
export function poseEchelle(T: number): Pose {
  const s = Math.sin(T * 7);
  return { y: 0, torse: 0.05, tete: [0, -0.35], jambeG: mb(-0.2 - Math.max(0, s) * 0.9, 0, 0.3 + Math.max(0, s) * 0.9), jambeD: mb(-0.2 - Math.max(0, -s) * 0.9, 0, 0.3 + Math.max(0, -s) * 0.9), brasG: mb(-2.5 + s * 0.45, 0.15, -0.2), brasD: mb(-2.5 - s * 0.45, 0.15, -0.2) };
}
/** Assis, les épaules tombées, les yeux baissés (le père qui n'ose pas répondre). */
export function poseAbattu(T: number, h = 1.15): Pose {
  const p = poseAssise(T, h);
  return { ...p, torse: 0.2, tete: [0, 0.62] };
}
/** Assis, la tête relevée, un bras posé sur la table (il parle). */
export function poseParle(T: number, h = 1.15): Pose {
  const p = poseAssise(T, h);
  return { ...p, torse: 0.06, tete: [Math.sin(T * 1.1) * 0.06, 0.02], brasD: mb(-0.95, 0.15, -0.7 + Math.sin(T * 3) * 0.03) };
}
/** Sursaute / se fige : bras écartés, tête redressée. */
export function poseSursaut(T: number): Pose {
  const r = Math.sin(T * 14) * 0.02;
  return { y: 0.02, torse: -0.12, tete: [0, -0.1], jambeG: mb(-0.15, 0.14), jambeD: mb(0.15, 0.14), brasG: mb(-0.5 + r, 0.7, -0.4), brasD: mb(-0.5 - r, 0.7, -0.4) };
}
/** Regard fixe, bras le long du corps (garde, habitant résigné). */
export function poseGuet(T: number, g = 0): Pose {
  const p = poseDebout(T, g);
  return { ...p, tete: [Math.sin(T * 0.3 + g) * 0.15, 0] };
}
/** Les mains sur la tête (panique de la foule). */
export function posePanique(T: number, g = 0): Pose {
  const r = Math.sin(T * 12 + g) * 0.05;
  return { y: 0.02, torse: 0.1, tete: [Math.sin(T * 4 + g) * 0.25, -0.05], jambeG: mb(-0.2, 0.1), jambeD: mb(0.2, 0.1), brasG: mb(-2.5 + r, -0.1, -1.1), brasD: mb(-2.5 - r, -0.1, -1.1) };
}

/** Jumelles baissées au bout des bras, devant le ventre (le regard stupéfait reste libre). */
export function poseBaisse(T: number, g = 0): Pose {
  const r = Math.sin(T * 1.5 + g) * 0.015;
  return { y: 0, torse: 0.02, tete: [0, 0.0], jambeG: mb(-0.05, 0.08), jambeD: mb(0.05, 0.08), brasG: mb(-0.55 + r, -0.2, -0.75), brasD: mb(-0.55 - r, -0.2, -0.75) };
}
