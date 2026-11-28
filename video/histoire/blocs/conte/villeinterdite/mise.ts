/** Branchement de « villeinterdite » sur le moteur : habitants du moteur + retouches de poses et de positions pilotées par le temps. */
import type { Minutage, RecitBlocs } from "../../decoupage";
import { evaluer } from "../../ville/foule";
import { preparerConte, type DonneesConte } from "../lib";
import { evenements, habitants, retouches } from "./histoire";

export const preparer = (r: RecitBlocs, m: Minutage): DonneesConte => {
  const d = preparerConte(r, m, { habitants, evenements });
  const index = new Map(d.habitants.map((h) => [h.id, h]));
  const ret = retouches(d.mot, d.ev);
  return {
    ...d,
    acteur: (id, T) => {
      const h = index.get(id);
      if (!h) return null;
      const a = evaluer(h, T, 0);
      if (!a) return null;
      const f = ret[id];
      return f ? f(T, a) : a;
    },
  };
};
