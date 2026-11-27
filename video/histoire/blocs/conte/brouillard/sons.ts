/**
 * « Chaque jeudi, quelque chose vient nous chercher… » — bande son : houle de brouillard (drone-c) sur toute la durée,
 * pas lourds synchronisés sur la foulée de la créature, souffle sifflant de l'asthmatique tant qu'il manque d'air, cœur,
 * trois gouttes sur la vitre à l'instant exact où elles frappent, chocs de révélation, silence qui pèse pendant les
 * souvenirs, clé, serrure, grincement de la porte, choc final sur le sourire du médecin.
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { B, C, boucle, hit, repete, valides } from "../sonslib";
import { pasCreature } from "./histoire";

export function sonsBrouillard(_r: RecitBlocs, m: Minutage, _p: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev;
  const mot = d.mot;
  const fin = d.finNarration;
  const total = Math.max(m.duree, m.dureeMin ?? 0);
  const s: Son[] = [];

  // --- ambiance : houle de brouillard, plus basse pendant le souvenir du père (le silence qui pèse), vent lointain
  s.push(boucle(C("drone-c"), 0, mot(2, 0) + 0.6, 0.36, 1.2));
  s.push(boucle(C("drone-c"), mot(2, 0) - 0.4, mot(3, 0) + 0.8, 0.17, 1.2));
  s.push(boucle(C("drone-c"), mot(3, 0) - 0.4, total, 0.34, 1.2));
  s.push(boucle(B("vent"), 0, total, 0.07, 1.5));
  s.push(boucle(C("drone-a"), mot(5, 14), total, 0.26, 1.5));

  // --- scène 1 : la créature traverse le brouillard ; pas lourds de plus en plus proches, la vitre tremble
  s.push(hit(C("corne"), 0.6, 0.3, 4));
  for (const t of pasCreature("ville", ev, 0, ev.cvArrive + 0.6)) s.push(hit(C("pas-lourd"), t, 0.3 + 0.55 * Math.min(1, t / ev.cvArrive), 1.6));
  s.push(...repete(C("coeur"), mot(0, 20), mot(1, 0), 1.0, 0.3, 1.0));

  // --- scène 2 : le noir se fait, il retient son souffle, l'asthme, l'inhalateur tombe, la créature passe
  s.push(hit(C("choc"), ev.lum0 + 0.4, 0.3, 2.2));
  s.push(...repete(C("coeur"), mot(1, 14), mot(2, 0), 0.8, 0.5, 1.0));
  s.push(boucle(C("asthme"), mot(1, 17), mot(2, 0) - 0.05, 0.5, 0.4));
  s.push(hit(C("clang"), ev.tombe + 0.3, 0.22, 2.4), hit(C("clang"), ev.tombe + 0.52, 0.1, 2.4), hit(B("toc"), ev.tombe + 0.7, 0.15, 1));
  for (const t of pasCreature("chambre", ev, 15.5, ev.passe + 0.5)) s.push(hit(C("pas-lourd"), t, 0.7, 1.6));
  s.push(hit(C("choc"), mot(1, 27), 0.45, 2.2));

  // --- scène 3 : le souvenir du père, presque muet
  s.push(hit(C("murmure"), mot(2, 4), 0.45, 1.9));
  s.push(hit(C("corne"), ev.brumeMur, 0.38, 4));
  s.push(...repete(C("coeur"), mot(2, 23), mot(3, 0), 1.2, 0.3, 1.0));

  // --- scène 4 : trois gouttes, la main grise, l'étouffement, la main humaine
  for (const t of [ev.goutte1, ev.goutte2, ev.goutte3]) s.push(hit(C("goutte"), t, 0.85, 0.7));
  s.push(hit(C("choc"), ev.mainColle, 0.95, 2.2));
  for (const t of [ev.mainColle + 1.7, ev.mainColle + 3.1]) s.push(hit(C("frappe-metal"), t, 0.3, 1.0));
  for (const t of pasCreature("chambre", ev, ev.mainApparait - 1.6, ev.mainApparait - 0.5)) s.push(hit(C("pas-lourd"), t, 0.45, 1.6));
  s.push(...repete(C("coeur"), mot(3, 9), ev.bouche, 0.6, 0.6, 1.0));
  s.push(boucle(C("asthme"), mot(3, 13), ev.bouche + 0.05, 0.6, 0.4));
  s.push(hit(C("choc"), ev.bouche, 0.6, 2.2));

  // --- scène 5 : la main reste, le monstre s'éloigne, la lumière revient
  s.push(...repete(C("coeur"), ev.bouche + 0.8, ev.mainPart, 1.1, 0.35, 1.0));
  for (const t of pasCreature("chambre", ev, ev.mainPart, ev.mainPart + 2.6)) s.push(hit(C("pas-lourd"), t, 0.5, 1.6));
  s.push(hit(C("halo"), ev.lumiere, 0.32, 3));

  // --- scène 6 : la porte que la créature ne peut ouvrir, la serrure, la clé, le médecin
  s.push(hit(C("frappe-metal"), ev.mainPorte0 + 0.95, 0.14, 1.0), hit(C("frappe-metal"), ev.mainPorte0 + 1.35, 0.14, 1.0), hit(C("frappe-metal"), ev.mainPorte0 + 1.7, 0.12, 1.0));
  s.push(hit(C("choc"), ev.mainPorte0 + 0.1, 0.35, 2.2));
  s.push(hit(C("grincement"), ev.porteInvite + 0.2, 0.5, 1.7));
  s.push(hit(C("cle"), ev.porteDeverr - 0.05, 0.45, 1.5), hit(C("grincement"), ev.porteDeverr + 0.2, 0.25, 1.7));
  s.push(hit(C("cle"), ev.cle - 0.05, 0.85, 1.5));
  s.push(...repete(C("coeur"), mot(5, 27), fin, 0.8, 0.6, 1.0));
  s.push(hit(C("grincement"), ev.medecin - 0.2, 0.35, 1.7));
  // le choc de la révélation finale, sur le sourire
  s.push(hit(C("choc"), mot(5, 39) - 0.03, 1.0, 2.4));
  return valides(s);
}
