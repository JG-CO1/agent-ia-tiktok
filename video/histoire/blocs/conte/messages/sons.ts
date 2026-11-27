/**
 * « Tout ce que j'envoie par message devient réel… » — bande son : boîte à musique pastel (monde « réel »), pop d'envoi, ding
 * de réception, pluie de bonbons cristalline, balayages « annuler » à chaque disparition, aboiement, crépitement de pixels,
 * ding grave du système, remontée vertigineuse, silence net avant le twist, nappe blanche et cœur sur la fin.
 * Tous les instants viennent des mots (data.mot) ou des événements : jamais de temps fixes. La voix reste prioritaire.
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { C, boucle, hit, repete, valides } from "../sonslib";

const M = (n: string) => `sfx/messages/${n}.wav`;

export function sonsMessages(_r: RecitBlocs, m: Minutage, _p: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev;
  const mot = d.mot;
  const fin = Math.max(m.duree, m.dureeMin ?? 0);
  const s: Son[] = [];
  const silence0 = mot(5, 0) - 0.3; // le silence net avant « C'était moi »

  // --- ambiances : boîte à musique tant que le monde est joyeux, pad triste quand il se défait, houle pendant la remontée,
  //     menace avant la révélation, puis le silence, la nappe blanche et le cœur
  s.push(boucle(M("boite"), 0, ev.boul0 + 0.6, 0.15, 0.6));
  s.push(boucle(C("drone-b"), ev.boul0 - 0.4, ev.monte0 + 0.6, 0.2, 1.4));
  s.push(boucle(C("drone-c"), ev.monte0 - 0.3, ev.haut + 1.6, 0.3, 0.8));
  s.push(boucle(C("drone-a"), mot(4, 15), silence0, 0.2, 1.2));
  s.push(boucle(M("nappe"), mot(5, 1), fin - 0.2, 0.2, 0.8));
  // la pluie de bonbons tombe sur toute la rue rose
  s.push(boucle(M("bonbons"), ev.candy0 - 0.2, ev.monte0 + 0.3, 0.16, 0.8));

  // --- scène 1 : pop d'envoi, ding, éclat contre la vitre, première sphère, la rue se réécrit
  s.push(hit(M("pop"), ev.envoi, 0.5, 0.6));
  s.push(hit(M("ding"), ev.envoi + 0.55, 0.3, 1.6));
  s.push(hit(M("eclat"), ev.eclat - 0.04, 0.5, 1.5));
  s.push(hit(M("glitch"), ev.eclat, 0.2, 1.3));
  s.push(hit(M("ding"), ev.candy0 + 0.85, 0.2, 1.6)); // la première sphère touche le sol
  s.push(hit(M("reecriture"), ev.rose - 0.15, 0.5, 1.8));
  s.push(hit(C("choc"), ev.rose + 1.0, 0.25, 2.2));

  // --- scène 2 : la boulangerie se défait bloc par bloc
  s.push(hit(M("undo"), ev.boul0 - 0.05, 0.6, 1.8));
  s.push(hit(M("glitch"), ev.boul0 + 0.2, 0.3, 1.3));
  s.push(hit(C("goutte"), mot(1, 14) + 0.1, 0.18, 1.2));
  s.push(...repete(C("coeur"), mot(1, 19), mot(1, 22) + 0.9, 0.95, 0.35, 1.0));

  // --- scène 3 : touches, bulle, ding, éclat, aboiements, la maison s'efface
  s.push(...repete(M("tic"), ev.tape3, ev.gueri - 0.25, 0.085, 0.18, 0.15));
  s.push(hit(M("pop"), ev.bub3, 0.4, 0.6));
  s.push(hit(M("ding"), ev.bub3 + 0.35, 0.22, 1.6));
  s.push(hit(M("eclat"), ev.gueri - 0.03, 0.5, 1.5));
  s.push(hit(M("aboi"), ev.gueri + 0.25, 0.5, 0.9));
  s.push(hit(M("aboi"), ev.bondit + 0.2, 0.4, 0.9));
  s.push(hit(M("undo"), ev.maison0 - 0.05, 0.6, 1.8));
  s.push(hit(M("glitch"), ev.maison0 + 0.3, 0.3, 1.3));
  s.push(hit(M("undo"), ev.voisine0 - 0.1, 0.45, 1.8));
  s.push(hit(C("choc"), mot(2, 26), 0.35, 2.2));

  // --- scène 4 : panique, touches, bulle envoyée, réponses du système, remontée
  s.push(...repete(C("coeur"), mot(3, 0), ev.imp, 0.55, 0.4, 0.8));
  s.push(...repete(M("tic"), ev.tape4 + 0.1, ev.envoi4 - 0.1, 0.075, 0.2, 0.15));
  s.push(hit(M("pop"), ev.envoi4, 0.4, 0.6));
  s.push(hit(M("dingbas"), ev.rep1, 0.4, 1.3));
  s.push(hit(M("dingbas"), ev.imp, 0.5, 1.3));
  s.push(hit(C("choc"), ev.imp, 0.4, 2.2));
  s.push(hit(M("dingbas"), ev.rep2, 0.5, 1.3));
  s.push(hit(M("montee"), ev.monte0 - 0.4, 0.4, 6));
  s.push(hit(M("whoosh"), ev.monte0, 0.55, 2.6));
  s.push(hit(M("whoosh"), mot(3, 26) - 0.3, 0.45, 2.6));

  // --- scène 5 : arrivée en haut, parents, message d'il y a quinze ans, panneau
  s.push(hit(C("choc"), ev.haut + 0.1, 0.55, 2.2));
  s.push(hit(C("halo"), ev.parents - 0.2, 0.4, 4));
  s.push(hit(M("ding"), mot(4, 18), 0.3, 1.6));
  s.push(...repete(C("coeur"), mot(4, 17), silence0, 0.9, 0.45, 1.0));
  s.push(hit(M("pop"), ev.pan, 0.5, 0.6));
  s.push(hit(M("dingbas"), ev.pan + 0.05, 0.45, 1.3));
  s.push(hit(C("choc"), ev.pan, 0.35, 2.2));
  // silence net avant le twist : seul le cœur, qui reprend sur « moi »
  // --- scène 6 : pixels, souffle, vision de la rue d'avant, bouton qui enfle
  s.push(hit(C("choc"), mot(5, 1), 0.5, 2.2));
  s.push(...repete(C("coeur"), mot(5, 1) + 0.6, fin - 0.3, 0.8, 0.55, 1.0));
  s.push(hit(M("glitch"), ev.pixel0, 0.35, 1.3));
  s.push(hit(M("souffle"), mot(5, 4) - 0.3, 0.35, 1.9));
  s.push(hit(M("reecriture"), ev.vision0 - 0.1, 0.45, 1.8));
  s.push(hit(C("carillon"), ev.vision0 + 0.2, 0.3, 3.4));
  s.push(hit(M("undo"), ev.vision1 - 0.1, 0.5, 1.8));
  s.push(hit(M("montee"), ev.bouton0 - 0.3, 0.45, 6));
  s.push(hit(C("drone-a"), ev.bouton0 - 0.2, 0.3, 4));
  // le noir : un dernier choc sourd, puis plus rien
  s.push(hit(C("choc"), d.finNarration + 0.05, 0.7, 2.2));
  return valides(s);
}
