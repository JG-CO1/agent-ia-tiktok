/** Squelette « mursilence » : à remplacer par la mise en scène plan par plan. */
import type { PlanGen } from "../../types";
import { P, viser } from "../cam";

export const PLANS: PlanGen[] = [
  P("s01p1", "Plan provisoire", 0, 0, () => ({ cam: viser([0, 3, 10], [0, 2, 0], 50), brouillard: ["#101020", 20, 80], fx: { vignette: 0.5 } })),
];
