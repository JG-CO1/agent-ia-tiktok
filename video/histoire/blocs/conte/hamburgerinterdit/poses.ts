/** « Hamburger interdit » — poses propres à cette mise en scène (bras et torse seulement : le reste vient du moteur). */
import type { Membre, Pose } from "../../avatar";
import { mel } from "../../maths";

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });
export type Retouche = Partial<Pose>;

/** Le policier fouille un cartable posé devant lui : torse penché, mains qui farfouillent. */
export const fouille = (T: number): Retouche => ({ y: -0.04, torse: 0.5, tete: [0, 0.32], brasG: mb(-1.15 + 0.14 * Math.sin(T * 9), 0.15, -0.55), brasD: mb(-1.25 + 0.14 * Math.cos(T * 8), -0.15, -0.5) });
/** Il brandit sa prise d'une main. */
export const brandit = (): Retouche => ({ torse: 0, tete: [0, -0.1], brasD: mb(-1.75, -0.2, -0.45), brasG: mb(-0.1, 0.1, -0.1) });
/** Mains posées sur la table (policier qui veille sa prise). */
export const surTable = (): Retouche => ({ torse: 0.2, tete: [0, 0.1], brasG: mb(-1.0, 0.1, -0.9), brasD: mb(-1.0, -0.1, -0.9) });
/** Mange : la fourchette fait l'aller-retour vers la bouche (assis). */
export const mange = (T: number, g = 0): Retouche => {
  const k = (Math.sin(T * 4.6 + g) + 1) / 2;
  return { brasD: mb(mel(-0.85, -1.15, k), -0.1, mel(-0.9, -2.15, k)), brasG: mb(-0.85, 0.1, -0.85), tete: [0, 0.1 + 0.08 * k] };
};
/** Pose ses couverts : les mains reviennent sur la table. */
export const poseCouverts = (): Retouche => ({ brasD: mb(-0.9, -0.12, -0.8), brasG: mb(-0.9, 0.12, -0.8), tete: [0, 0.05] });
/** Lit un papier tenu à deux mains devant lui. */
export const lit = (): Retouche => ({ torse: 0.05, tete: [0, 0.12], brasG: mb(-1.0, 0.18, -1.35), brasD: mb(-1.0, -0.18, -1.35) });
/** Tire un objet de la poche d'un manteau (main droite devant lui). */
export const tire = (k: number): Retouche => ({ torse: 0.12 * (1 - k), brasD: mb(mel(-0.95, -1.5, k), -0.12, mel(-0.35, -0.8, k)), brasG: mb(-0.1, 0.1, -0.1), tete: [0, 0.2] });
/** Burger dans la main droite, bras plié devant lui. */
export const burgerMain = (T: number): Retouche => ({ torse: 0.04, tete: [0, 0.18], brasD: mb(-1.2, -0.12, -0.5 + Math.sin(T * 1.3) * 0.03), brasG: mb(0.03, 0.08, -0.05) });
/** Le burger monte lentement vers la bouche (k = 0 → 1). */
export const versBouche = (k: number): Retouche => ({ torse: 0.04, tete: [0, 0.14], brasD: mb(mel(-1.2, -1.5, k), -0.15, mel(-0.5, -1.9, k)), brasG: mb(0.03, 0.08, -0.05) });
/** Enfant qui mord dans son burger tenu à deux mains. */
export const mord = (k: number): Retouche => ({ torse: 0.1, tete: [0, mel(0.0, 0.25, k)], brasG: mb(mel(-1.1, -1.35, k), 0.25, mel(-1.55, -1.9, k)), brasD: mb(mel(-1.1, -1.35, k), -0.25, mel(-1.55, -1.9, k)) });
/** Tient une photo à deux mains, un peu plus bas que le visage. */
export const tientPhoto = (): Retouche => ({ torse: 0.06, tete: [0, 0.16], brasG: mb(-0.95, 0.2, -1.25), brasD: mb(-0.95, -0.2, -1.25) });
/** Feuillette : une main à plat sur l'album, l'autre qui tourne les pages. */
export const feuillette = (T: number): Retouche => ({ torse: 0.2, tete: [0, 0.3], brasG: mb(-0.9, 0.1, -0.7), brasD: mb(-1.1 + 0.1 * Math.sin(T * 7), -0.1, -0.6) });
/** Bras croisés : mère qui ne comprend pas, main sur la bouche. */
export const mainBouche = (): Retouche => ({ torse: 0.03, tete: [0.2, 0.18], brasD: mb(-1.0, -0.3, -2.1), brasG: mb(-0.5, 0.2, -1.6) });
