/** Branchement de « telephone » sur le moteur : habitants du moteur (Noa dans la rue, passants) + personnages scénarisés. */
import type { Minutage, RecitBlocs } from "../../decoupage";
import { melPose } from "../../avatar";
import { type Acteur, evaluer } from "../../ville/foule";
import { entre, lisse } from "../../maths";
import { preparerConte, type DonneesConte } from "../lib";
import { IDS_PASSANTS, IDS_SCRIPTS, evaluerScript, evenements, habitants, poseTelLeve, scripts } from "./histoire";

export const IDS_ACTEURS = [...IDS_SCRIPTS, "noaR", ...IDS_PASSANTS];

export const preparer = (r: RecitBlocs, m: Minutage): DonneesConte => {
  const d = preparerConte(r, m, { habitants, evenements });
  const index = new Map(d.habitants.map((h) => [h.id, h]));
  const sc = scripts(d.mot, d.ev);
  const ev = d.ev;
  return {
    ...d,
    acteur: (id, T): Acteur | null => {
      const s = sc[id];
      if (s) return evaluerScript(s, T);
      const h = index.get(id);
      if (!h) return null;
      const a = evaluer(h, T, 0);
      if (!a) return null;
      // Noa, dans la rue : quand l'écran se rallume, il relève le téléphone devant lui
      if (id === "noaR" && T > ev.rallume - 0.5) {
        const k = lisse(entre(T, ev.rallume - 0.5, ev.rallume + 0.2));
        return { ...a, pose: melPose(a.pose, poseTelLeve(T, 0.3), k), objet: "tel1" };
      }
      return a;
    },
  };
};
