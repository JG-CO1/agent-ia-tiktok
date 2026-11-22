/** État complet d'une image de « La fenêtre de minuit » : caméra, lumières, personnages, accessoires. */
import type { V3 } from "../geo";
import type { Cam } from "../maths";
import type { Pose, Teinte } from "../avatar";
import type { Emotion } from "../textures";

export type Tenu =
  | { type: "enveloppe"; p: V3; r: V3; rabat: number; photo: number; lettre?: number }
  | { type: "photo"; p: V3; r: V3 }
  | { type: "lettre"; p: V3; r: V3 };

export type EtatActeur = {
  p: V3;
  ry: number;
  pose: Pose;
  emotion: Emotion;
  /** teinte de la zone où il se trouve (sinon : celle de l'extérieur à l'heure courante) */
  teinte?: Teinte;
  tenu?: Tenu | null;
};

export type Etat = {
  cam: Cam;
  heure: "nuit" | "aube";
  /** lampadaires allumés (éteints à minuit : c'est la règle de la ville) */
  lampadaires: boolean;
  /** fenêtre jaune de la maison B (23 h 50) */
  fenB: boolean;
  /** heure de l'horloge de rue, en minutes par rapport à minuit (-1 = 23:59, 0 = 00:00) */
  horloge: number;
  /** trotteuse rouge (0 à 60) ; absente si non précisée */
  secondes?: number;
  salon: {
    /** 0 = noir, 1 = éclairé à la bougie */
    lumiere: number;
    meubles: boolean;
    /** taille de la flamme (0 = éteinte) */
    flamme: number;
    /** filet de fumée après l'extinction (0 → 1) */
    fumee: number;
  };
  chambre: {
    lampe: boolean;
    /** fenêtre du narrateur : 0 = fermée, 1 = grande ouverte */
    ouverture: number;
    reveil: string;
  };
  joueur: EtatActeur | null;
  dame: EtatActeur | null;
  /** deux petits avatars sur un trottoir éloigné (plan d'ouverture) */
  figurants: boolean;
  /** enveloppe posée sur le paillasson du narrateur */
  enveloppeAuSol: boolean;
};

// Teintes de zone (facteurs linéaires appliqués aux couleurs d'aplat)
export const T_NUIT: Teinte = [0.3, 0.38, 0.75];
export const T_AUBE: Teinte = [1.04, 0.93, 0.92];
/** Les personnages sont un peu plus clairs que le décor la nuit, pour rester lisibles (hoodie noir). */
export const T_NUIT_ACTEUR: Teinte = [0.5, 0.58, 0.95];
export const T_BOUGIE: Teinte = [0.98, 0.74, 0.44];
export const T_NOIR: Teinte = [0.035, 0.045, 0.11];
export const T_CHAMBRE_NUIT: Teinte = [0.17, 0.21, 0.46];
export const T_CHAMBRE_LAMPE: Teinte = [1.2, 1.0, 0.7];
export const T_INTERIEUR_AUBE: Teinte = [0.62, 0.6, 0.62];

export const melTeinte = (a: Teinte, b: Teinte, k: number): Teinte => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
