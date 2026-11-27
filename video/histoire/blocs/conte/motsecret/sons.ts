/**
 * « Le mot secret » — bande son : drone grave et vent sur toute la durée, horloge qui tic-taque dans le salon, bois qui
 * craque, trois coups sur la porte (chaîne qui tinte, poussière), clé, tissu, murmures, pas étouffés, cœur qui s'accélère,
 * froissement de la couverture, puis le silence pesant de « Personne » rompu par trois coups SOURDS sous le plancher,
 * le tapis qui glisse, la trappe qui grince, le murmure venu d'en bas, et une coupure nette au noir.
 * Tous les instants viennent des mots (d.mot) ou des événements : jamais de temps fixes. Volumes bas sous la voix.
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { B, C, boucle, hit, repete, valides } from "../sonslib";

const M = (n: string) => `sfx/motsecret/${n}.wav`;

export function sonsMotsecret(_r: RecitBlocs, _m: Minutage, _p: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev;
  const mot = d.mot;
  const fin = d.finNarration;
  const s: Son[] = [];

  // --- ambiance : drone grave (il se tait sur « Personne »), vent de nuit, horloge dans le salon
  const silenceDe = mot(4, 12) - 0.15;
  const silenceA = mot(4, 13) + 0.05;
  s.push(boucle(C("drone-a"), 0, silenceDe, 0.27, 1.5));
  s.push(boucle(C("drone-a"), silenceA, fin + 0.04, 0.3, 0.25));
  s.push(boucle(B("vent"), 0, fin, 0.05, 1.5));
  s.push(boucle(B("vent"), mot(1, 0) - 0.1, mot(1, 4) + 0.3, 0.1, 0.4)); // dehors, avant les coups
  s.push(boucle(M("tic-tac"), 0, mot(3, 5), 0.11, 0.8));
  s.push(boucle(M("tic-tac"), ev.cut, fin, 0.1, 0.3));

  // --- scène 1 : bois qui craque, le mot murmuré, cœur
  s.push(hit(M("craquement"), mot(0, 10) + 0.2, 0.15, 1.4));
  s.push(...repete(C("coeur"), mot(0, 20), mot(1, 0) - 0.2, 0.95, 0.32, 0.95));

  // --- scène 2 : trois coups (le bois, la chaîne, la poussière), poignée, ombre sous la porte, murmure derrière le verre
  for (const t of [ev.toc1, ev.toc2, ev.toc3]) {
    s.push(hit(M("frappe-bois"), t - 0.02, 0.85, 0.8));
    s.push(hit(M("chaine"), t + 0.03, 0.35, 0.8));
  }
  s.push(hit(C("choc"), ev.toc1, 0.3, 2.2));
  s.push(hit(C("grincement"), ev.poignee, 0.3, 1.8));
  s.push(hit(C("halo"), ev.ombre, 0.3, 4));
  s.push(hit(C("murmure"), mot(1, 22) - 0.1, 0.5, 2.2));
  s.push(...repete(C("coeur"), mot(1, 7), mot(1, 26), 0.9, 0.3, 0.9));

  // --- scène 3 : la clé, le tissu, le cœur qui accélère
  s.push(hit(C("cle"), ev.cle - 0.1, 0.7, 1.5));
  s.push(hit(M("froissement"), ev.saisit - 0.25, 0.3, 1.0));
  s.push(hit(C("choc"), ev.saisit, 0.35, 2.2));
  s.push(hit(M("craquement"), mot(2, 19), 0.14, 1.4));
  s.push(...repete(C("coeur"), mot(2, 12), mot(3, 0), 0.78, 0.42, 0.78));
  s.push(hit(C("murmure"), mot(2, 15) + 0.1, 0.4, 2.2));

  // --- scène 4 : le narrateur file dans le couloir, chuchotements, pas, bois, cœur affolé
  s.push(hit(C("choc"), mot(3, 0), 0.38, 2.2));
  s.push(...repete(B("pas"), ev.marcheNarr, mot(3, 9), 0.3, 0.12, 0.3));
  s.push(hit(M("craquement"), mot(3, 8), 0.16, 1.4));
  s.push(hit(C("murmure"), mot(3, 17), 0.5, 2.2));
  s.push(hit(C("murmure"), mot(3, 27), 0.45, 2.2));
  s.push(...repete(B("pas"), ev.marchePapa, ev.marchePapa + 6.0, 0.3, 0.08, 0.3));
  s.push(...repete(C("coeur"), mot(3, 9), mot(4, 12) - 0.1, 0.62, 0.5, 0.62));
  s.push(hit(M("craquement"), mot(3, 24), 0.16, 1.4));

  // --- scène 5 : la couverture, le silence, puis trois coups sourds sous le plancher
  s.push(hit(M("froissement"), ev.souleve - 0.1, 0.6, 1.2));
  s.push(...repete(C("coeur"), mot(4, 12) - 0.1, mot(4, 13) + 0.2, 0.9, 0.55, 0.9));
  for (const t of [ev.tok1, ev.tok2, ev.tok3]) {
    s.push(hit(M("coup-sol"), t - 0.03, 1.0, 1.2));
    s.push(hit(C("choc"), t, 0.45, 2.2));
  }
  s.push(hit(C("clang"), ev.tok1 + 0.08, 0.1, 1.2));
  s.push(hit(M("craquement"), ev.tok3 + 0.3, 0.3, 1.4));
  s.push(...repete(C("coeur"), ev.tok3 + 0.5, mot(5, 0), 0.7, 0.6, 0.7));

  // --- scène 6 : le tapis glisse, la voix monte, la trappe grince, lumière pâle, silence net
  s.push(hit(M("froissement"), ev.tapis, 0.55, 1.2));
  s.push(hit(M("froissement"), ev.tapis + 0.55, 0.4, 1.2));
  s.push(hit(C("murmure"), mot(5, 7), 0.6, 2.2));
  s.push(hit(M("trappe"), ev.trappe, 0.7, 2.9));
  s.push(hit(C("halo"), ev.trappe, 0.32, 4));
  s.push(boucle(C("drone-c"), ev.trappe, fin + 0.04, 0.24, 1.0));
  s.push(...repete(C("coeur"), mot(5, 9), fin, 0.62, 0.55, 0.62));
  s.push(hit(C("choc"), fin, 0.8, 2.2));
  return valides(s);
}
