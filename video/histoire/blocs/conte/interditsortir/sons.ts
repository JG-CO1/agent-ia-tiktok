/**
 * « Interdit de sortir » — bande son : sirène (qui hurle puis se tait net), vent de vallée, pas sur la pierre, chaîne et porte scellée,
 * écho de la vallée aux révélations, cœur dans les gros plans, fusée et explosion du souvenir, silence net avant le twist,
 * double sirène en miroir, bourdon tendu, puis grande porte qui s'ouvre sur une nappe finale ouverte. La voix reste prioritaire
 * (volumes bas, impacts brefs).
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { B, C, boucle, hit, repete, valides } from "../sonslib";

const I = (n: string) => `sfx/interditsortir/${n}.wav`;

export function sonsInterditsortir(_r: RecitBlocs, m: Minutage, _p: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev;
  const mot = d.mot;
  const fin = d.finNarration;
  const total = Math.max(m.duree, m.dureeMin ?? 0);
  const s: Son[] = [];

  // --- ambiance : vent de vallée sur presque toute la durée, drones qui changent de couleur avec les scènes
  s.push(boucle(I("vent-vallee"), 0, mot(4, 4) - 0.2, 0.1, 1.2));
  s.push(boucle(I("vent-vallee"), mot(4, 17), mot(5, 0) - 0.1, 0.06, 0.6));
  s.push(boucle(I("vent-vallee"), mot(5, 3), total, 0.09, 1.2));
  s.push(boucle(C("drone-a"), 0, mot(1, 0) + 0.4, 0.17, 1.0));
  s.push(boucle(C("drone-b"), mot(1, 0), mot(2, 0) + 0.3, 0.18, 1.2));
  s.push(boucle(C("drone-c"), mot(2, 0), mot(3, 0) + 0.3, 0.2, 1.2));
  s.push(boucle(C("drone-a"), mot(3, 0), mot(4, 0) + 0.4, 0.2, 1.2));
  s.push(boucle(C("drone-b"), mot(4, 0), mot(4, 17) - 0.2, 0.2, 1.0));
  // (souvenir de la fête : le drone se retire, la nuit est presque silencieuse jusqu'à la fusée)
  // silence net avant le twist : plus rien de 46,9 s au premier mot de la scène 6
  s.push(boucle(C("drone-a"), mot(5, 2), mot(5, 20) + 0.4, 0.2, 0.8));
  s.push(boucle(I("tension"), mot(5, 19), ev.ouvre + 0.1, 0.2, 1.0));

  // --- scène 1 : la sirène hurle, les gens courent, la porte est scellée
  s.push(boucle(I("sirene"), 0, ev.sirFin + 0.25, 0.3, 0.5));
  s.push(...repete(I("pas-pierre"), 0.2, 3.6, 0.19, 0.09, 0.4));
  s.push(...repete(I("pas-pierre"), 0.5, 3.2, 0.23, 0.07, 0.4));
  s.push(hit(C("choc"), 0.1, 0.35, 2.2));
  s.push(hit(I("chaine"), mot(0, 12) + 0.35, 0.5, 1.6), hit(I("chaine"), mot(0, 17) - 0.05, 0.55, 1.6));
  s.push(hit(I("porte-scellee"), mot(0, 17), 0.4, 2.4));
  s.push(hit(C("choc"), mot(0, 17), 0.5, 2.2));
  s.push(hit(I("echo"), mot(0, 24), 0.25, 4.5));

  // --- scène 2 : la rue, le porche, l'escalier, l'échelle, les jumelles
  s.push(...repete(B("pas"), mot(1, 13) - 0.1, mot(1, 13) + 1.0, 0.27, 0.16, 0.3));
  s.push(...repete(B("pas"), mot(1, 15), mot(1, 18), 0.3, 0.17, 0.3));
  s.push(...repete(B("pas"), mot(1, 18), mot(1, 22), 0.42, 0.12, 0.4));
  s.push(...repete(C("coeur"), mot(1, 22), mot(2, 0) - 0.3, 1.0, 0.35, 1.0));

  // --- scène 3 : la vallée, la ville jumelle, le garçon d'en face
  s.push(hit(I("echo"), mot(2, 6), 0.4, 4.5));
  s.push(hit(C("choc"), mot(2, 6), 0.5, 2.2));
  s.push(hit(C("choc"), mot(2, 15), 0.28, 2.2), hit(C("choc"), mot(2, 17), 0.28, 2.2), hit(C("choc"), mot(2, 19), 0.3, 2.2));
  s.push(hit(C("choc"), ev.jumeauApp + 0.55, 0.65, 2.2));
  s.push(...repete(C("coeur"), mot(2, 21), mot(3, 0), 0.85, 0.45, 1.0));
  s.push(hit(C("halo"), mot(2, 25), 0.25, 3));

  // --- scène 4 : signe, pancarte (révélation), stupeur
  s.push(hit(I("echo"), ev.pancarte0, 0.3, 4.5));
  s.push(hit(C("choc"), ev.pancarteLue - 0.1, 0.9, 2.2));
  s.push(...repete(C("coeur"), mot(3, 23), mot(4, 0) - 0.2, 0.8, 0.55, 1.0));

  // --- scène 5 : courir, la maison, la photo, le souvenir (fusée, explosion), les deux villes s'effraient
  s.push(...repete(B("pas"), mot(4, 0) - 0.3, mot(4, 4) - 0.2, 0.2, 0.2, 0.25));
  s.push(hit(C("goutte"), mot(4, 12), 0.35, 0.6));
  s.push(hit(C("carillon"), ev.fusee0 - 0.3, 0.18, 3));
  s.push(hit(I("fusee"), ev.fusee0, 0.55, 1.6));
  s.push(hit(I("explosion"), ev.boum, 1.0, 3.4));
  s.push(hit(C("choc"), ev.boum, 0.5, 2.2));
  s.push(...repete(I("pas-pierre"), ev.boum + 0.2, ev.boum + 1.9, 0.14, 0.08, 0.3));
  s.push(boucle(I("sirene-loin"), ev.crois, mot(5, 0) + 0.3, 0.18, 0.8));
  s.push(hit(C("choc"), ev.crois, 0.5, 2.2));

  // --- scène 6 : les deux villes en miroir, le silence, la porte
  s.push(boucle(I("sirene"), ev.sir2, ev.sir2Fin + 0.3, 0.26, 0.4));
  s.push(boucle(I("sirene-loin"), ev.sir2 + 1.3, ev.sir2Fin + 0.3, 0.2, 0.4));
  s.push(hit(I("chaine"), mot(5, 0) + 0.3, 0.3, 1.6));
  s.push(hit(C("choc"), ev.lumieres - 0.1, 0.55, 2.2));
  s.push(hit(I("echo"), mot(5, 11), 0.3, 4.5));
  s.push(hit(C("clang"), mot(5, 15), 0.14, 2.4));
  s.push(...repete(C("coeur"), mot(5, 23), ev.ouvre, 0.8, 0.55, 1.0));
  s.push(hit(I("porte-ouvre"), ev.ouvre, 0.75, 4));
  s.push(boucle(I("nappe-finale"), ev.ouvre - 0.8, total, 0.34, 1.1));
  s.push(hit(C("choc"), fin, 0.25, 2.2));
  return valides(s);
}
