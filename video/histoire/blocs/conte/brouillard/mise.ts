/** Branchement de la vidéo « brouillard » sur le moteur (données) : habitants du moteur + personnages scénarisés. */
import type { Minutage, RecitBlocs } from "../../decoupage";
import { preparerConte, type DonneesConte } from "../lib";
import { acteurHabitant, evaluerScript, evenements, habitants, scripts } from "./histoire";

export const IDS_SCRIPT = ["nar", "bm"];
export const IDS_ACTEURS = ["nar", "bm", "pere", "med"];

export const preparer = (r: RecitBlocs, m: Minutage): DonneesConte => {
  const d = preparerConte(r, m, { habitants, evenements });
  const index = new Map(d.habitants.map((h) => [h.id, h]));
  const sc = scripts(d.mot, d.ev);
  return {
    ...d,
    acteur: (id, T) => {
      const s = sc[id];
      if (s) return evaluerScript(s, T);
      const h = index.get(id);
      return h ? acteurHabitant(h, T, d.ev) : null;
    },
  };
};
