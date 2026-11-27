/**
 * Contrat commun des mises en scène « blocs » (minuit, huss, …) : un récit désigne sa mise en scène par
 * `mise_en_scene`, le moteur (Blocs.tsx, scripts/histoire.ts) ne connaît que ces types.
 */
import type { Cam } from "./maths";
import type { Repere } from "./decoupage";

/** Contexte d'un plan à une image donnée. `data` = ce que la mise en scène a préparé à partir du minutage (voix). */
export type CtxGen = {
  /** progression du plan, 0 → 1 */
  p: number;
  /** secondes depuis le début du plan */
  t: number;
  /** durée du plan */
  d: number;
  /** temps global (s) */
  T: number;
  frame: number;
  /** instant (en secondes depuis le début du plan) où commence le mot `k` de la scène courante du plan */
  mot: (k: number) => number;
  data: any;
};
export type EtatGen = { cam: Cam } & Record<string, any>;
export type PlanGen = Repere & { titre: string; etat: (c: CtxGen) => EtatGen };
