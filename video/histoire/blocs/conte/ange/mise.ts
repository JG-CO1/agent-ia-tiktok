/** Branchement de la vidéo « ange » sur le moteur (données). */
import type { Minutage, RecitBlocs } from "../../decoupage";
import { preparerConte } from "../lib";
import { evenements, habitants } from "./histoire";

export const preparer = (r: RecitBlocs, m: Minutage) => preparerConte(r, m, { habitants, evenements });
