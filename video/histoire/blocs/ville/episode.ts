/**
 * Contrat d'un « épisode » de la ville : tout ce qui change d'une vidéo à l'autre. Le moteur (lieux, décor, joueur,
 * foule, caméra, sons, sous-titres) ne change pas : pour une nouvelle vidéo, on écrit un récit (histoires/recits/*.json)
 * et un épisode (video/histoire/blocs/ville/episodes/<nom>/), puis on l'inscrit dans episodes/registre.ts.
 */
import type { PlanGen } from "../types";
import type { Habitant } from "./foule";

/** Repère dans le texte : [indice de scène, indice du mot dans la scène] (0 pour le premier). */
export type Rep = [number, number];

export type EpisodeVille = {
  id: string;
  /** les plans : caméra (et seulement elle) de chaque coupe, chacun démarrant sur un mot */
  plans: PlanGen[];
  /** le tir final : dernier HUSS avant la prise de balle, mot du lâcher (« Et… »), mot du panier */
  tir: { dernierHuss: Rep; lache: Rep; panier: Rep };
  /** musique de fête : les rebonds se calent sur sa grille à partir de `rebondsDe`, un temps tombe sur `ancre` ; niveaux = [repère, volume relatif] (interpolés) */
  musique: { rebondsDe: Rep; ancre: Rep; niveaux: Array<[Rep, number]> };
  /** fenêtres où le joueur relève la tête vers la fête, et où il tourne la tête vers la rue */
  regards: { fete: Array<[Rep, Rep]>; rue: [Rep, Rep] };
  /** personnages secondaires nommés (facteur, voisins, métiers…) : leurs trajets dépendent des mots du texte */
  secondaires: (mot: (scene: number, k: number) => number, beat0: number) => Habitant[];
};
