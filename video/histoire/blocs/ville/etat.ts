/** État d'une image de la mise en scène « huss » : seule la caméra change d'un plan à l'autre (le joueur, le ballon et la foule sont des fonctions du temps). */
import type { Cam } from "../maths";
import type { Teinte } from "../avatar";

export type EtatVille = { cam: Cam; /** plan sans foule (gros plans où elle gênerait) */ sansFoule?: boolean };

// Teintes de zone (facteurs linéaires appliqués aux couleurs d'aplat) : nuit bleue, terrain éclairé, fête colorée
export const T_EXT: Teinte = [0.44, 0.52, 0.86];
export const T_TERRAIN: Teinte = [1.0, 1.02, 1.1];
export const T_FETE: Teinte = [0.98, 0.9, 1.08];
export const T_ACTEUR_RUE: Teinte = [0.7, 0.76, 1.0];
export const T_ACTEUR_TERRAIN: Teinte = [1.02, 1.02, 1.06];
export const T_ACTEUR_FETE: Teinte = [1.04, 0.96, 1.08];
