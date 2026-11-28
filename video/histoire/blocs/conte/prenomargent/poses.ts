/**
 * Poses propres à « Prénom = argent » (mêmes conventions que conte/poses.ts : bras x < 0 = vers l'avant, x ≈ -π = levés,
 * z > 0 = écarté ; torse > 0 = penché en avant ; tête : [lacet, tangage > 0 = vers le bas]).
 */
import { poseAssise, poseDebout, type Membre, type Pose } from "../../avatar";
import { mel } from "../../maths";

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });

/** Il crie un prénom : une main en porte-voix, l'autre poing serré, tête en arrière. */
export function poseCrie(T: number, g = 0): Pose {
  const s = Math.sin(T * 11 + g) * 0.06;
  return { y: 0, torse: -0.08, tete: [0, -0.18], jambeG: mb(-0.05, 0.1), jambeD: mb(0.05, 0.1), brasD: mb(-2.05 + s, -0.05, -1.75), brasG: mb(-0.25, 0.3, -0.6) };
}
/** Il chante les bras levés, qui balancent (foule joyeuse). */
export function poseChante(T: number, g = 0): Pose {
  const s = Math.sin(T * 5.2 + g);
  return { y: Math.abs(s) * 0.07, torse: -0.05, tete: [0.12 * s, -0.2], jambeG: mb(-0.05, 0.1), jambeD: mb(0.05, 0.1), brasG: mb(-2.75 + 0.25 * s, 0.35, -0.15), brasD: mb(-2.75 - 0.25 * s, -0.35, -0.15) };
}
/** Hypnotisé qui chante : bras ballants, léger balancement, tête relevée (aucune vie dans le geste). */
export function poseTransporte(T: number, g = 0): Pose {
  const s = Math.sin(T * 2.4 + g);
  return { y: 0, torse: 0, tete: [0.1 * s, -0.16], jambeG: mb(0.04 * s, 0.07), jambeD: mb(-0.04 * s, 0.07), brasG: mb(0.08 * s, 0.1), brasD: mb(-0.08 * s, 0.1) };
}
/** Il tient son portefeuille ouvert devant la poitrine, les deux mains dessous. */
export function poseMontreVide(T: number, g = 0): Pose {
  const s = Math.sin(T * 2.4 + g);
  return { y: 0, torse: 0.04, tete: [0.08 * s, -0.12], jambeG: mb(0.03 * s, 0.07), jambeD: mb(-0.03 * s, 0.07), brasG: mb(-1.05, -0.5, -1.15), brasD: mb(-1.05, 0.5, -1.15) };
}
/** Debout, accablé : bras morts, torse penché, tête basse. */
export function poseAffaisse(T: number, g = 0): Pose {
  const r = Math.sin(T * 1.2 + g) * 0.01;
  return { y: -0.04, torse: 0.22, tete: [0, 0.4], jambeG: mb(-0.1 + r, 0.06), jambeD: mb(0.1 - r, 0.06), brasG: mb(0.15, 0.04, -0.05), brasD: mb(0.15, -0.04, -0.05) };
}
/** Il tend un billet : le bras droit tendu devant, paume en bas. */
export function poseDonne(k: number): Pose {
  return { y: 0, torse: 0.06, tete: [0, 0.02], jambeG: mb(-0.05, 0.08), jambeD: mb(0.05, 0.08), brasD: mb(mel(-0.8, -1.5, k), -0.1, mel(-0.5, -0.08, k)), brasG: mb(-0.1, 0.08, -0.1) };
}
/** Elle repousse l'argent : une main ouverte devant, l'autre qui écarte le billet, tête qui dit non. */
export function poseRefuse(T: number): Pose {
  const s = Math.sin(T * 7);
  return { y: 0, torse: -0.04, tete: [0.35 * s, 0.05], jambeG: mb(-0.05, 0.08), jambeD: mb(0.05, 0.08), brasD: mb(-1.6, -0.15, -0.5 + 0.1 * s), brasG: mb(-1.2, 0.25, -0.9) };
}
/** Poche retournée : bras le long du corps, mains aux hanches, épaules basses, tête qui s'incline (fauché). */
export function poseFauche(T: number): Pose {
  const r = Math.sin(T * 1.6) * 0.02;
  return { y: -0.03, torse: 0.1, tete: [0.1, 0.2], jambeG: mb(-0.04, 0.08), jambeD: mb(0.04, 0.08), brasG: mb(0.05 + r, 0.32, -0.1), brasD: mb(0.05 - r, -0.32, -0.1) };
}
/** Bras en V, poitrine en avant : le roi de la fête. */
export function poseTriomphe(T: number): Pose {
  const s = Math.sin(T * 3);
  return { y: 0, torse: -0.1, tete: [0, -0.15], jambeG: mb(-0.05, 0.2), jambeD: mb(0.05, 0.2), brasG: mb(-0.3 + 0.08 * s, 2.25, -0.1), brasD: mb(-0.3 - 0.08 * s, -2.25, -0.1) };
}
/** Mains posées sur la balustrade : immobile, tête qui balaye lentement la ville. */
export function poseBalcon(T: number, g = 0): Pose {
  return { y: 0, torse: 0.12, tete: [Math.sin(T * 0.5 + g) * 0.3, 0.12], jambeG: mb(-0.04, 0.08), jambeD: mb(0.04, 0.08), brasG: mb(-0.95, 0.12, -0.5), brasD: mb(-0.95, -0.12, -0.5) };
}
/** DJ : une main sur le casque, l'autre à la console, tête qui dodeline (assis). */
export function poseDJ(T: number): Pose {
  const p = poseAssise(T, 1.2);
  const s = Math.sin(T * 6);
  p.tete = [0.1 * s, -0.05];
  p.torse = 0.12;
  p.brasG = mb(-2.2, -0.15, -1.9);
  p.brasD = mb(-1.15 + 0.15 * s, -0.1, -0.6);
  return p;
}
/** Fan de stade debout (gradin) qui lève les bras en rythme. */
export function poseFan(T: number, g = 0): Pose {
  return poseChante(T, g);
}
/** Joie de Maxime : bras levés en V (le visage reste dégagé). */
export function poseJoie(T: number, g = 0): Pose {
  const s = Math.sin(T * 6 + g);
  return { y: Math.abs(s) * 0.08, torse: -0.05, tete: [0, -0.12], jambeG: mb(-0.05, 0.12), jambeD: mb(0.05, 0.12), brasG: mb(-0.2 + 0.15 * s, 2.35, -0.1), brasD: mb(-0.2 - 0.15 * s, -2.35, -0.1) };
}
export { poseDebout };
