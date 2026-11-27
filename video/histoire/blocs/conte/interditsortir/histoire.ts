/** Squelette « interditsortir » : personnages et événements calés sur les mots. */
import type { Habitant } from "../../ville/foule";

type Mot = (scene: number, k: number) => number;
export function evenements(_mot: Mot): Record<string, number> {
  return {};
}
export function habitants(_mot: Mot): Habitant[] {
  return [];
}
