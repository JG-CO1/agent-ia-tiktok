/** Branchement de « Hamburger interdit » sur le moteur : personnages retouchés (lacets lissés, poses, fenêtres d'existence). */
import type { Minutage, RecitBlocs } from "../../decoupage";
import { evaluer } from "../../ville/foule";
import { preparerConte } from "../lib";
import { evenements, fenetres, habitants, retouche } from "./histoire";

export const preparer = (r: RecitBlocs, m: Minutage) => {
  const d = preparerConte(r, m, { habitants, evenements });
  const win = fenetres(d.ev, d.mot, d.finNarration);
  const index = new Map(d.habitants.map((h) => [h.id, h]));
  d.acteur = (id, T) => {
    const h = index.get(id);
    if (!h) return null;
    const a = evaluer(h, T, 0);
    return a ? retouche(h, T, a, d.ev, win[id]) : null;
  };
  return d;
};
