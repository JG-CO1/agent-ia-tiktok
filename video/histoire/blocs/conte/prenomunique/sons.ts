/** Squelette « prenomunique » : bande son à écrire. */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";

export function sonsPrenomunique(_r: RecitBlocs, _m: Minutage, _p: PlanMinute<PlanGen>[], _d: DonneesConte): Son[] {
  return [];
}
