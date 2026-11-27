/** Poses propres à « brouillard » (le socle commun ne les a pas) : même convention que conte/poses.ts. */
import { poseAssise, type Membre, type Pose } from "../../avatar";
import { mel } from "../../maths";

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });

/** Ferme la fenêtre : les deux bras levés devant lui, mains à hauteur du loquet. */
export function poseFerme(T: number): Pose {
  const r = Math.sin(T * 3) * 0.06;
  return { y: 0, torse: 0.08, tete: [0, -0.1], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(-2.35 + r, 0.12, -0.25), brasD: mb(-2.35 - r, -0.12, -0.25) };
}
/** Accroupi derrière le rideau, les deux mains sur la bouche : il retient son souffle. */
export function poseCacheSouffle(T: number): Pose {
  const r = Math.sin(T * 2.2) * 0.02;
  return { y: -0.5, torse: 0.5, tete: [0, 0.1], jambeG: mb(-1.8, 0, 2.3), jambeD: mb(-1.8, 0, 2.3), brasG: mb(-1.55 + r, -0.75, -0.7), brasD: mb(-1.55 - r, -0.75, -0.7) };
}
/** Accroupi, à bout de souffle : épaules qui montent et descendent, mains à la gorge. */
export function poseCacheHalete(T: number): Pose {
  const r = Math.sin(T * 10);
  return { y: -0.5 + r * 0.02, torse: 0.55 + r * 0.05, tete: [0, 0.15], jambeG: mb(-1.8, 0, 2.3), jambeD: mb(-1.8, 0, 2.3), brasG: mb(-1.1, 0.2, -1.6), brasD: mb(-0.9, -0.2, -1.6) };
}
/** L'inhalateur porté à la bouche (bras droit), l'autre main sur la poitrine. */
export function poseInhale(T: number): Pose {
  const r = Math.sin(T * 9);
  return { y: -0.45 + r * 0.02, torse: 0.5, tete: [0, 0.18], jambeG: mb(-1.8, 0, 2.3), jambeD: mb(-1.8, 0, 2.3), brasG: mb(-0.9, 0.2, -1.4), brasD: mb(-1.9, -0.7, 0) };
}
/** Assis dans le lit (jambes tendues sous la couverture), mains crispées sur la couverture. */
export function poseAssisLit(T: number): Pose {
  const r = Math.sin(T * 1.3) * 0.02;
  return { y: 0, torse: 0.04, tete: [0, 0.05], jambeG: mb(-1.5, 0.05, 0), jambeD: mb(-1.5, -0.05, 0), brasG: mb(-0.55 + r, 0.2, -0.5), brasD: mb(-0.55 - r, -0.2, -0.5) };
}
/** Assis dans le lit, à bout de souffle : buste qui se soulève, mains à la gorge. */
export function poseAssisLitHalete(T: number): Pose {
  const r = Math.sin(T * 10);
  return { y: r * 0.025, torse: 0.18 + r * 0.06, tete: [0, 0.14], jambeG: mb(-1.5, 0.05, 0), jambeD: mb(-1.5, -0.05, 0), brasG: mb(-1.1, 0.2, -1.55), brasD: mb(-0.95, -0.2, -1.55) };
}
/** Assis dans le lit, la bouche couverte par une main qui n'est pas la sienne : bras ballants. */
export function poseAssisLitBloque(T: number): Pose {
  const r = Math.sin(T * 5) * 0.03;
  return { y: 0, torse: 0.02, tete: [0, 0.02], jambeG: mb(-1.5, 0.05, 0), jambeD: mb(-1.5, -0.05, 0), brasG: mb(-0.35 + r, 0.3, -0.2), brasD: mb(-0.35 - r, -0.3, -0.2) };
}
/** Allongé sur le dos, tête tournée vers le côté (regard fixe sur la chaise). */
export function poseAllongeTete(lacet: number): Pose {
  return { y: 0, torse: 0, tete: [lacet, 0], jambeG: mb(0), jambeD: mb(0), brasG: mb(0.05, 0.1), brasD: mb(0.05, -0.1) };
}
/** Assise sur la chaise, mains jointes sur les genoux, tête tournée vers la fenêtre. */
export function poseAssiseVeille(T: number, h = 1.15, lacet = 0): Pose {
  const p = poseAssise(T, h);
  p.tete = [lacet + Math.sin(T * 0.3) * 0.04, 0.02];
  p.brasG = mb(-0.85, -0.1, -1.0);
  p.brasD = mb(-0.85, 0.1, -1.0);
  return p;
}
/** Se penche vers l'enfant, une main ferme sur sa bouche, l'autre bras qui l'entoure. `x, z, pli` : bras gauche (calculés pour toucher la bouche). */
export function poseBouche(T: number, g: { x: number; z: number; pli: number; torse: number }): Pose {
  const r = Math.sin(T * 1.4) * 0.015;
  return { y: -0.02, torse: g.torse, tete: [0, -0.5], jambeG: mb(-0.35, 0.06, 0.15), jambeD: mb(0.15, 0.06, 0.05), brasG: mb(g.x + r, g.z, g.pli), brasD: mb(-0.9, -0.2, -1.0) };
}
/** Debout, les bras ballants, un peu voûtée (apaisée, fatiguée). */
export function poseApaisee(T: number): Pose {
  const r = Math.sin(T * 1.3) * 0.03;
  return { y: 0, torse: 0.12, tete: [Math.sin(T * 0.5) * 0.1, 0.12], jambeG: mb(-0.05, 0.06), jambeD: mb(0.05, 0.06), brasG: mb(-0.2 + r, 0.12, -0.3), brasD: mb(-0.5 - r, -0.12, -0.9) };
}
/** Explique : une main qui accompagne la parole. */
export function poseExplique(T: number): Pose {
  const k = (Math.sin(T * 2.4) + 1) / 2;
  return { y: 0, torse: 0.1, tete: [Math.sin(T * 0.7) * 0.15, 0.08], jambeG: mb(-0.05, 0.06), jambeD: mb(0.05, 0.06), brasG: mb(-0.2, 0.1, -0.2), brasD: mb(mel(-1.0, -1.3, k), -0.3, mel(-1.2, -0.9, k)) };
}
/** Le médecin : debout, très droit, une main tient la clé à hauteur de poitrine, l'autre la mallette. */
export function poseMedecin(T: number): Pose {
  const r = Math.sin(T * 1.2) * 0.02;
  return { y: 0, torse: -0.03, tete: [0, 0.03], jambeG: mb(-0.03, 0.06), jambeD: mb(0.03, 0.06), brasG: mb(-0.05 + r, 0.07), brasD: mb(-1.25, -0.2, -1.55) };
}
