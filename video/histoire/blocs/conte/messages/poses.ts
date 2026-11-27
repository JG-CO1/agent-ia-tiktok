/**
 * Poses propres à « messages » (le socle commun ne les a pas) : même convention que conte/poses.ts
 * (bras x < 0 = vers l'avant, x ≈ −π = levés ; torse > 0 = penché ; tête : [lacet, tangage > 0 = vers le bas]).
 * Les angles des bras ont été calculés par cinématique inverse (mains aux points voulus).
 */
import { poseDebout, type Membre, type Pose } from "../../avatar";

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });

/** Tient le téléphone à deux mains devant la poitrine, regarde l'écran (la main de saisie vibre). */
export function poseTel(T: number, g = 0): Pose {
  const r = Math.sin(T * 7 + g) * 0.025;
  return { y: 0, torse: 0.04, tete: [0, 0.3], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(-1.45 + r, -0.35, 0), brasD: mb(-1.45 - r, -0.35, 0) };
}
/** Pianote frénétiquement (paniqué) : mêmes bras, tremblement plus fort, torse penché. */
export function poseTelPanique(T: number, g = 0): Pose {
  const r = Math.sin(T * 17 + g) * 0.07;
  return { y: Math.sin(T * 13) * 0.02, torse: 0.16, tete: [Math.sin(T * 5) * 0.12, 0.4], jambeG: mb(-0.1, 0.07), jambeD: mb(0.1, 0.07), brasG: mb(-1.45 + r, -0.35, 0), brasD: mb(-1.45 - r, -0.35, 0) };
}
/** Les deux mains devant le visage : il se regarde les mains (elles tremblent). */
export function poseMains(T: number, g = 0): Pose {
  const r = Math.sin(T * 14 + g) * 0.035;
  return { y: 0, torse: 0.1, tete: [0, 0.38], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(-1.45 + r, -0.4, -0.55), brasD: mb(-1.45 - r, -0.4, -0.55) };
}
/** Les mains sur la tête (panique). */
export function poseTete(T: number): Pose {
  const r = Math.sin(T * 9) * 0.04;
  return { y: 0, torse: 0.1, tete: [Math.sin(T * 3) * 0.2, -0.05], jambeG: mb(-0.1, 0.07), jambeD: mb(0.1, 0.07), brasG: mb(-2.45 + r, -0.1, -1.15), brasD: mb(-2.45 - r, -0.1, -1.15) };
}
/** Debout, bras ballants, tête levée vers quelque chose d'immense. */
export function poseLeve(T: number, g = 0, haut = -0.5): Pose {
  const p = poseDebout(T, g);
  return { ...p, tete: [Math.sin(T * 0.5 + g) * 0.05, haut], brasG: mb(-0.2, 0.06, -0.1), brasD: mb(-0.2, -0.06, -0.1) };
}
/** Tend le bras droit vers le bouton, la main gauche serrée contre la poitrine. */
export function poseTend(T: number): Pose {
  const r = Math.sin(T * 15) * 0.045;
  return { y: -0.02, torse: 0.1, tete: [0, 0.12], jambeG: mb(-0.1, 0.07), jambeD: mb(0.1, 0.07), brasD: mb(-1.55 + r, -0.12, -0.1), brasG: mb(-1.1, -0.55, -1.4) };
}
/** Bras en l'air (joie) : saute de joie. */
export function poseJoie(T: number, g = 0): Pose {
  const s = Math.abs(Math.sin(T * 6 + g));
  return { y: s * 0.12, torse: -0.05, tete: [0, -0.1], jambeG: mb(-0.2 * s, 0.1), jambeD: mb(0.2 * s, 0.1), brasG: mb(-2.7 + Math.sin(T * 8) * 0.15, 0.35, -0.15), brasD: mb(-2.7 - Math.sin(T * 8) * 0.15, -0.35, -0.15) };
}
/** Inquiète : mains jointes devant la poitrine, tête penchée vers le chien. */
export function poseInquiete(T: number, g = 0): Pose {
  const r = Math.sin(T * 1.6 + g) * 0.02;
  return { y: 0, torse: 0.1, tete: [0, 0.3], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(-1.05 + r, -0.35, -1.25), brasD: mb(-1.05 - r, -0.35, -1.25) };
}
/** Debout figé, bras ballants (le monde est en train de l'effacer). */
export function poseFige(T: number, g = 0): Pose {
  return { ...poseDebout(T, g), tete: [0, 0.05], brasG: mb(0.1, 0.1, -0.05), brasD: mb(0.1, -0.1, -0.05) };
}
