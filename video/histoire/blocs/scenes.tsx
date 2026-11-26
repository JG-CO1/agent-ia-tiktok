/**
 * Registre des mises en scène « blocs ». Pour en ajouter une : un dossier (décor, plans, sons), une ligne ici,
 * une ligne dans plans-registre.ts, puis `"mise_en_scene": "<nom>"` dans le récit.
 */
import React from "react";
import type { Minutage, PlanMinute, RecitBlocs } from "./decoupage";
import type { PlanGen } from "./types";
import type { Son } from "./minuit/sons";
import { MondeMinuit, cielMinuit } from "./minuit";
import { sonsMinuit } from "./minuit/sons";
import { MondeVille, cielVille } from "./ville/Decor";
import { sonsVille } from "./ville/sons";
import { preparerVille } from "./ville/donnees";
import { episodeDe } from "./ville/episodes/registre";

export type MiseEnScene = {
  Monde: React.FC<{ e: any; frame: number; data: any }>;
  ciel: (e: any) => string;
  sons: (recit: RecitBlocs, m: Minutage, plans: PlanMinute<PlanGen>[], data: any) => Son[];
  /** calculs faits une fois par rendu à partir du minutage (instants des rebonds, trajets de la foule…) */
  preparer?: (recit: RecitBlocs, m: Minutage) => any;
};

export const SCENES: Record<string, MiseEnScene> = {
  minuit: { Monde: ({ e, frame }) => <MondeMinuit e={e} frame={frame} />, ciel: cielMinuit, sons: (r, m, p) => sonsMinuit(r, m, p as any) },
  ville: { Monde: MondeVille, ciel: cielVille, sons: sonsVille, preparer: (r, m) => preparerVille(r, m, episodeDe(r.episode ?? r.id)) },
};

export function sceneDe(nom?: string): MiseEnScene {
  const s = SCENES[nom ?? "minuit"];
  if (!s) throw new Error(`Mise en scène inconnue : « ${nom} »`);
  return s;
}
