/** Plans (mise en scène caméra + actions) de chaque mise en scène : module sans React, utilisable par les scripts. */
import type { PlanGen } from "./types";
import { PLANS as PLANS_MINUIT } from "./minuit/plans";
import { episodeDe } from "./ville/episodes/registre";

/** `miseEnScene` : « minuit » ou « ville » ; `episode` : nom de l'épisode de la ville (par défaut l'identifiant du récit). */
export function plansDe(miseEnScene?: string, episode?: string): PlanGen[] {
  const nom = miseEnScene ?? "minuit";
  if (nom === "minuit") return PLANS_MINUIT as unknown as PlanGen[];
  if (nom === "ville") return episodeDe(episode).plans;
  throw new Error(`Mise en scène inconnue : « ${nom} » (connues : minuit, ville)`);
}
