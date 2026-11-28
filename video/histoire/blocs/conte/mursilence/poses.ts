/**
 * « Mur du silence » — poses propres au récit (mêmes conventions que conte/poses.ts : bras x < 0 = vers l'avant, x ≈ -π = levés ;
 * torse > 0 = penché en avant ; tête [lacet, tangage], tangage > 0 = regard baissé).
 */
import { poseAssise, poseDebout, type Membre, type Pose } from "../../avatar";
import { mel } from "../../maths";

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });

/** Assis à la table, voûté, regard dans l'assiette, les avant-bras sur la table (papa, Adam au petit-déjeuner). */
export function poseMorne(T: number, h: number, g = 0, tang = 0.34): Pose {
  const p = poseAssise(T, h);
  const r = Math.sin(T * 1.1 + g) * 0.03;
  p.torse = 0.2;
  p.tete = [Math.sin(T * 0.3 + g) * 0.08, tang + r];
  p.brasG = mb(-1.0, 0.1, -0.8);
  p.brasD = mb(-1.0, -0.1, -0.8);
  return p;
}
/** Idem, la tasse portée à la bouche (k = 0 posée, 1 à la bouche). */
export function poseTasse(T: number, h: number, g: number, k: number, tang = 0.3): Pose {
  const p = poseMorne(T, h, g, tang);
  p.brasD = mb(mel(-1.0, -1.35, k), -0.1, mel(-0.8, -2.3, k));
  p.tete = [0, mel(tang, 0.05, k)];
  return p;
}
/** Debout face au mur, une main à plat sur les briques (la petite sœur qui les touche sans cesse). */
export function poseMurMain(T: number, g = 0): Pose {
  const s = Math.sin(T * 2.1 + g) * 0.05;
  return { y: 0, torse: 0.08, tete: [0.18, 0.02], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasD: mb(-1.5 + s, -0.04, -0.04), brasG: mb(-0.2, 0.08, -0.2) };
}
/** L'oreille contre le mur : tête tournée de 90° (l'oreille touche les briques), les deux mains à plat. */
export function poseOreille(T: number, g = 0): Pose {
  const s = Math.sin(T * 1.4 + g) * 0.02;
  return { y: -0.03, torse: 0.26, tete: [1.42, 0.04 + s], jambeG: mb(-0.35, 0.05, 0.1), jambeD: mb(0.1, 0.05), brasD: mb(-1.95, -0.2, -0.1), brasG: mb(-1.5, 0.2, -0.25) };
}
/** Penché pour lire de près les mots gravés, une main près de la brique. */
export function poseExamine(T: number, g = 0): Pose {
  const s = Math.sin(T * 1.2 + g) * 0.03;
  return { y: -0.02, torse: 0.3, tete: [0.1, 0.22 + s], jambeG: mb(-0.2, 0.05, 0.1), jambeD: mb(0.1, 0.05), brasD: mb(-1.7, -0.12, -0.3), brasG: mb(-0.15, 0.1, -0.2) };
}
/** Adam qui parle au mur : poitrail gonflé puis les mains serrées contre lui. */
export function poseParle(T: number, k = 1): Pose {
  const s = Math.sin(T * 3) * 0.015;
  return { y: 0, torse: mel(0.02, 0.12, k), tete: [0, mel(-0.02, 0.1, k) + s], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(mel(0, -0.9, k), -0.3 * k, mel(-0.2, -1.7, k)), brasD: mb(mel(0, -0.9, k), 0.3 * k, mel(-0.2, -1.7, k)) };
}
/** Papa debout, dos voûté, bras ballants (tête baissée ou relevée selon `tang`). */
export function poseAccable(T: number, tang = 0.3, g = 0): Pose {
  const r = Math.sin(T * 1.3 + g) * 0.02;
  return { y: 0, torse: 0.2, tete: [0, tang + r], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(0.1, 0.1, -0.15), brasD: mb(0.1, -0.1, -0.15) };
}
/** Papa, la main contre le mur à hauteur de la brèche (il touche l'endroit où la brique est tombée). */
export function poseMainBreche(T: number, k = 1, tang = 0): Pose {
  const p = poseAccable(T, tang);
  p.torse = mel(0.2, 0.08, k);
  p.brasD = mb(mel(0.1, -1.95, k), -0.1, mel(-0.15, -0.1, k));
  return p;
}
/** Assise, tasse de thé à deux mains (maman), regard dans la tasse (`tang`) ou levé. */
export function poseThe(T: number, h: number, tang = 0.22, lacet = 0): Pose {
  const p = poseAssise(T, h);
  const r = Math.sin(T * 1.2) * 0.02;
  p.torse = 0.04;
  p.tete = [lacet, tang + r];
  p.brasD = mb(-1.2, -0.12, -1.65);
  p.brasG = mb(-0.8, 0.12, -1.2);
  return p;
}
/** Assise, bras grands ouverts (maman accueille ses enfants). */
export function poseOuvre(T: number, h: number, k: number): Pose {
  const p = poseThe(T, h, 0.0);
  p.brasD = mb(mel(-1.2, -1.45, k), mel(-0.12, -0.95, k), mel(-1.65, -0.2, k));
  p.brasG = mb(mel(-0.8, -1.45, k), mel(0.12, 0.95, k), mel(-1.2, -0.2, k));
  return p;
}
/** Assise, serre ses enfants contre elle. */
export function poseSerreAssise(T: number, h: number): Pose {
  const p = poseAssise(T, h);
  p.torse = 0.06;
  p.tete = [0, 0.08 + Math.sin(T * 1.5) * 0.02];
  p.brasD = mb(-1.1, 0.4, -1.25);
  p.brasG = mb(-1.1, -0.4, -1.25);
  return p;
}
/** Penché en avant, bras refermés autour d'un enfant ou de maman (étreinte debout). */
export function poseEtreinte(T: number, g = 0, penche = 0.5): Pose {
  const r = Math.sin(T * 1.7 + g) * 0.02;
  return { y: -0.03, torse: penche + r, tete: [0.1, 0.35], jambeG: mb(-0.3, 0.06, 0.2), jambeD: mb(0.1, 0.06), brasG: mb(-1.35, -0.35, -0.9), brasD: mb(-1.35, 0.35, -0.9) };
}
/** Dispute muette entre deux passants : une main qui désigne, l'autre sur la hanche. */
export function poseDispute(T: number, g = 0): Pose {
  const s = Math.sin(T * 5 + g);
  return { y: 0, torse: 0.04, tete: [0, 0.02], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasD: mb(-1.35 + s * 0.2, -0.1, -0.4), brasG: mb(-0.3, 0.3, -1.2) };
}
/** Bras croisés, de dos (les passants ne se parlent plus). */
export function poseCroise(T: number): Pose {
  return { ...poseDebout(T, 0.3), tete: [0.2, 0.18], brasG: mb(-1.05, -0.5, -1.9), brasD: mb(-1.05, 0.5, -1.9) };
}
/** Debout de face, la main droite tendue sur le côté contre le mur (Lina qui longe les briques sans cesse). */
export function poseMurCote(T: number, g = 0): Pose {
  const s = Math.sin(T * 2.3 + g) * 0.05;
  return { y: 0, torse: 0.05, tete: [-0.15, 0.02], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasD: mb(0.0, 1.32 + s, -0.08), brasG: mb(-0.15, 0.1, -0.2) };
}
