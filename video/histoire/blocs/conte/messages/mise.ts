/** Branchement de « messages » sur le moteur : passants (habitants du moteur) + personnages scénarisés (Sam, Mme Lopes…). */
import type { Minutage, RecitBlocs } from "../../decoupage";
import { evaluer } from "../../ville/foule";
import { preparerConte, type DonneesConte } from "../lib";
import { evaluerScript, evenements, habitants, scripts } from "./histoire";

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
      return h ? evaluer(h, T, 0) : null;
    },
  };
};
