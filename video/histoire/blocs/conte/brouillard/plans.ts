/** SQUELETTE à remplacer : plans de la vidéo « brouillard ». */
import type { PlanGen } from "../../types";
import { P, viser } from "../cam";

export const PLANS: PlanGen[] = [P("br01p1", "plan provisoire", 0, 0, () => viser([0, 3, 10], [0, 2, 0], 55))];
