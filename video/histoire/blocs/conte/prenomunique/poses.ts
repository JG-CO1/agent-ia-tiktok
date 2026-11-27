/**
 * Poses propres à « Prénom unique » (mêmes conventions que conte/poses.ts : bras x < 0 = vers l'avant, torse > 0 = penché,
 * tête : [lacet, tangage > 0 = vers le bas]).
 */
import { poseAssise, poseDebout, type Membre, type Pose } from "../../avatar";

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });

/** Dormeur debout dans sa cabine : bras le long du corps, tête légèrement penchée, respiration très lente. */
export function poseDormeur(T: number, g = 0): Pose {
  const r = Math.sin(T * 0.8 + g) * 0.012;
  return { y: 0, torse: 0.02, tete: [0, 0.2 + r * 2], jambeG: mb(0, 0.05), jambeD: mb(0, 0.05), brasG: mb(r, 0.06), brasD: mb(-r, 0.06) };
}
/** Élève assis au pupitre, mains posées ; `lacet` = tête tournée (π = regarde derrière lui), `tang` = tête baissée. */
export function poseEleve(T: number, lacet = 0, tang = 0.3, g = 0): Pose {
  const p = poseAssise(T, 1.18);
  p.tete = [lacet, tang];
  p.torse = 0.06 + Math.sin(T * 0.5 + g) * 0.01;
  return p;
}
/** Même élève, torse pivoté vers l'arrière (pour qu'il regarde derrière lui sans casser le cou). */
export function poseEleveRaide(T: number, lacet: number, g = 0): Pose {
  const p = poseAssise(T, 1.18);
  p.tete = [lacet, 0];
  p.torse = 0.02 + Math.sin(T * 0.5 + g) * 0.006;
  return p;
}
/** Mange à la cantine : tout le monde au même rythme, la cuillère monte et descend. */
export function poseMange(T: number): Pose {
  const p = poseAssise(T, 1.18);
  const k = Math.max(0, Math.sin(T * 2.6));
  p.tete = [0, 0.22 + 0.1 * k];
  p.torse = 0.12;
  p.brasD = mb(-0.9 - 0.75 * k, -0.15, -0.9 - 0.6 * k);
  p.brasG = mb(-0.55, 0.1, -0.7);
  return p;
}
/** Les deux mains devant le visage : il se regarde les mains (elles tremblent). */
export function poseMains(T: number, g = 0): Pose {
  const r = Math.sin(T * 14 + g) * 0.035;
  return { y: 0, torse: 0.1, tete: [0, 0.38], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(-1.45 + r, -0.4, -0.55), brasD: mb(-1.45 - r, -0.4, -0.55) };
}
/** Le bras droit tendu vers le fond de la salle, tête haute (le maire désigne la dernière cabine). */
export function poseDesigne(T: number): Pose {
  return { y: 0, torse: 0, tete: [0, -0.04], jambeG: mb(-0.05, 0.08), jambeD: mb(0.05, 0.08), brasD: mb(-1.58 + Math.sin(T * 2) * 0.02, -0.05, 0), brasG: mb(-0.05, 0.08, -0.1) };
}
/** Le professeur crie (une main en porte-voix, l'autre sur la hanche). */
export function poseCrie(T: number): Pose {
  const s = Math.sin(T * 9) * 0.05;
  return { y: 0, torse: -0.05, tete: [0, -0.12], jambeG: mb(-0.05, 0.08), jambeD: mb(0.05, 0.08), brasD: mb(-2.05 + s, -0.05, -1.7), brasG: mb(-0.2, 0.25, -0.5) };
}
/** Debout, bras ballants, regard fixe (la foule en rang). */
export const poseRang = (T: number, g = 0): Pose => ({ ...poseDebout(T * 0.3, g * 0), tete: [0, 0] });
/** Noé tétanisé : bras serrés, épaules raides, respiration courte. */
export function poseGele(T: number): Pose {
  const r = Math.sin(T * 8) * 0.03;
  return { y: r * 0.5, torse: 0.06 + r, tete: [0, 0.05], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(-0.15, 0.12, -0.1), brasD: mb(-0.15, -0.12, -0.1) };
}
