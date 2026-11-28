/** Poses propres à « Ville interdite » (mêmes conventions que conte/poses.ts : bras x < 0 = vers l'avant, tête [lacet, tangage > 0 = vers le bas]). */
import { poseDebout, type Membre, type Pose } from "../../avatar";

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });

/** Pincé par la taille et soulevé : bras en l'air qui s'agitent, jambes qui pédalent. */
export function poseSouleve(T: number): Pose {
  const s = Math.sin(T * 14);
  const c = Math.cos(T * 11);
  return { y: 0, torse: -0.12, tete: [0, -0.2], jambeG: mb(0.5 * s, 0.12, 0.7), jambeD: mb(-0.5 * s, 0.12, 0.7), brasG: mb(-2.7 + 0.25 * c, 0.5, -0.1), brasD: mb(-2.6 - 0.25 * c, -0.5, -0.1) };
}
/** Pétrit : debout derrière la table, torse penché, deux mains qui poussent et reviennent. */
export function poseMalaxe(T: number): Pose {
  const k = Math.sin(T * 6.2);
  return { y: -0.04, torse: 0.3, tete: [0, -0.18], jambeG: mb(-0.1, 0.08), jambeD: mb(0.1, 0.08), brasG: mb(-1.05 - 0.34 * k, 0.1, -0.35), brasD: mb(-1.05 + 0.34 * k, -0.1, -0.35) };
}
/** Chute libre : corps cambré, bras écartés qui battent. */
export function poseChute(T: number): Pose {
  const s = Math.sin(T * 17);
  return { y: 0, torse: -0.2, tete: [0, -0.3], jambeG: mb(0.35 + 0.2 * s, 0.35, 0.3), jambeD: mb(-0.2 - 0.2 * s, -0.35, 0.3), brasG: mb(-2.3 + 0.4 * s, 1.0, -0.2), brasD: mb(-2.3 - 0.4 * s, -1.0, -0.2) };
}
/** Regarde vers le haut, bouche bée : tête renversée, bras ballants un peu en arrière. */
export function poseHaut(T: number): Pose {
  return { ...poseDebout(T, 1.2), tete: [0, -0.6], torse: -0.08, brasG: mb(0.15, 0.25), brasD: mb(0.15, -0.25) };
}
/** Penché au bord du vide : torse en avant, tête baissée, bras légèrement écartés pour l'équilibre. */
export function poseBord(T: number): Pose {
  const r = Math.sin(T * 1.6) * 0.04;
  return { y: -0.04, torse: 0.2, tete: [0, 0.5], jambeG: mb(-0.05, 0.1), jambeD: mb(0.05, 0.1), brasG: mb(-0.3 + r, 0.55, -0.3), brasD: mb(-0.3 - r, -0.55, -0.3) };
}
/** Recule d'effroi : torse en arrière, mains devant la poitrine. */
export function poseRecule(T: number): Pose {
  const r = Math.sin(T * 9) * 0.04;
  return { y: -0.02, torse: -0.15, tete: [0, -0.1], jambeG: mb(0.25, 0.1, 0.1), jambeD: mb(-0.3, 0.1, 0.1), brasG: mb(-1.2 + r, 0.3, -1.1), brasD: mb(-1.2 - r, -0.3, -1.1) };
}
/** Raide, immobile, les yeux grands ouverts (rangé dans la boîte). */
export function poseRange(): Pose {
  return { y: 0, torse: 0, tete: [0, 0], jambeG: mb(0, 0.04), jambeD: mb(0, 0.04), brasG: mb(0, 0.06), brasD: mb(0, 0.06) };
}
/** Lève un doigt qui répète la consigne. */
export function poseAvertit(T: number): Pose {
  const r = Math.sin(T * 5) * 0.12;
  return { y: 0, torse: 0.04, tete: [0, 0.02], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(0.05, 0.06), brasD: mb(-1.55 + r, -0.2, -1.1) };
}
