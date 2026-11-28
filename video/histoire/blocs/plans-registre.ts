/** Plans (mise en scène caméra + actions) de chaque mise en scène : module sans React, utilisable par les scripts. */
import type { PlanGen } from "./types";
import { PLANS as PLANS_MINUIT } from "./minuit/plans";
import { episodeDe } from "./ville/episodes/registre";
import { PLANS as PLANS_SOMNAMBULES } from "./conte/somnambules/plans";
import { PLANS as PLANS_ANGE } from "./conte/ange/plans";
import { PLANS as PLANS_MOTSECRET } from "./conte/motsecret/plans";
import { PLANS as PLANS_TELEPHONE } from "./conte/telephone/plans";
import { PLANS as PLANS_MESSAGES } from "./conte/messages/plans";
import { PLANS as PLANS_PRENOMUNIQUE } from "./conte/prenomunique/plans";
import { PLANS as PLANS_INTERDITSORTIR } from "./conte/interditsortir/plans";
import { PLANS as PLANS_HAMBURGERINTERDIT } from "./conte/hamburgerinterdit/plans";
import { PLANS as PLANS_VILLEINTERDITE } from "./conte/villeinterdite/plans";
import { PLANS as PLANS_MURSILENCE } from "./conte/mursilence/plans";
import { PLANS as PLANS_PRENOMARGENT } from "./conte/prenomargent/plans";
import { PLANS as PLANS_BROUILLARD } from "./conte/brouillard/plans";

/** `miseEnScene` : « minuit » ou « ville » ; `episode` : nom de l'épisode de la ville (par défaut l'identifiant du récit). */
export function plansDe(miseEnScene?: string, episode?: string): PlanGen[] {
  const nom = miseEnScene ?? "minuit";
  if (nom === "minuit") return PLANS_MINUIT as unknown as PlanGen[];
  if (nom === "ville") return episodeDe(episode).plans;
  if (nom === "somnambules") return PLANS_SOMNAMBULES;
  if (nom === "ange") return PLANS_ANGE;
  if (nom === "brouillard") return PLANS_BROUILLARD;
  if (nom === "villeinterdite") return PLANS_VILLEINTERDITE;
  if (nom === "mursilence") return PLANS_MURSILENCE;
  if (nom === "prenomargent") return PLANS_PRENOMARGENT;
  if (nom === "prenomunique") return PLANS_PRENOMUNIQUE;
  if (nom === "interditsortir") return PLANS_INTERDITSORTIR;
  if (nom === "hamburgerinterdit") return PLANS_HAMBURGERINTERDIT;
  if (nom === "motsecret") return PLANS_MOTSECRET;
  if (nom === "telephone") return PLANS_TELEPHONE;
  if (nom === "messages") return PLANS_MESSAGES;
  throw new Error(`Mise en scène inconnue : « ${nom} » (connues : minuit, ville, somnambules, ange, brouillard, motsecret, telephone, messages, prenomunique, interditsortir, hamburgerinterdit, villeinterdite, mursilence, prenomargent)`);
}
