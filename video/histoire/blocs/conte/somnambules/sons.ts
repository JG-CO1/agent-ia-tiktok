/**
 * La ville des somnambules — bande son : drone grave sur toute la durée, grillons dehors, vent, pas lents des
 * somnambules, battements de cœur dans les gros plans, grincement des douze portes à l'instant exact où elles
 * s'ouvrent, chocs de révélation, coups de pioche synchronisés sur l'animation, clang du métal, trois coups,
 * murmure du prénom, puis coupure nette au noir.
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { B, C, boucle, hit, repete, valides } from "../sonslib";

export function sonsSomnambules(_r: RecitBlocs, m: Minutage, _p: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev;
  const mot = d.mot;
  const fin = d.finNarration;
  const total = Math.max(m.duree, m.dureeMin ?? 0);
  const s: Son[] = [];

  // --- ambiance : drone sur toute la durée (coupé net au noir), grillons dehors, vent
  s.push(boucle(C("drone-a"), 0, fin + 0.04, 0.3, 1.5));
  s.push(boucle(C("grillons"), 0, mot(5, 0) - 0.4, 0.11, 1.0));
  s.push(boucle(B("vent"), 0, mot(5, 0), 0.06, 1.2));

  // --- scène 1 : les portes (un grincement collectif, un grondement), pas lents, cœur dans le gros plan des yeux
  s.push(hit(C("grincement"), ev.ouv - 0.05, 0.55, 1.7), hit(C("grincement"), ev.ouv + 0.12, 0.3, 1.7), hit(C("grincement"), ev.ouv + 0.24, 0.25, 1.7));
  s.push(hit(C("choc"), ev.ouv + 0.05, 0.35, 2.2));
  s.push(...repete(B("pas"), ev.ouv + 0.8, mot(0, 17), 1.4, 0.1, 1.4));
  s.push(...repete(C("coeur"), mot(0, 17), mot(0, 24), 1.0, 0.5, 1.0));
  s.push(hit(C("choc"), mot(0, 17), 0.3, 2.2));

  // --- scène 2 : la file marche, le jour se lève
  s.push(...repete(B("pas"), mot(1, 0), mot(1, 14), 1.4, 0.16, 1.4));
  s.push(...repete(B("pas"), mot(1, 14), mot(1, 27), 1.4, 0.12, 1.4));
  s.push(hit(C("choc"), mot(1, 7), 0.4, 2.2));

  // --- scène 3 : cœur sous les draps, le professeur arrive, révélation « il clignait des yeux »
  s.push(...repete(C("coeur"), mot(2, 0), mot(2, 8), 1.1, 0.35, 1.0));
  s.push(...repete(B("pas"), mot(2, 8), mot(2, 16), 0.9, 0.1, 0.9));
  s.push(hit(C("choc"), mot(2, 21), 0.75, 2.2));

  // --- scène 4 : la poussée
  s.push(...repete(B("pas"), ev.pousse - 1.9, ev.pousse, 0.2, 0.22, 0.2));
  s.push(hit(C("choc"), ev.pousse, 0.95, 2.2), hit(C("clang"), ev.pousse + 0.45, 0.25, 2.4));

  // --- scène 5 : la sœur, le souvenir
  s.push(hit(C("coeur"), mot(4, 0), 0.4, 1.0));
  s.push(hit(C("choc"), mot(4, 11), 0.4, 2.2));
  s.push(hit(C("goutte"), ev.perd, 0.45, 0.6));
  s.push(...repete(C("coeur"), mot(4, 31), mot(5, 0), 0.9, 0.45, 1.0));

  // --- scène 6 : on creuse (chaque coup tombe quand la pioche touche la terre), le métal, trois coups, le prénom
  const tD = mot(5, 0) - 0.3;
  for (const g of [0.3, 1.4]) {
    for (let k = 0; ; k++) {
      const t = (1.5 * Math.PI - g + 2 * Math.PI * k) / 8.2;
      if (t > ev.frappe - 0.05) break;
      if (t > tD) s.push(hit(C("pioche-terre"), t, 0.4, 0.6));
    }
  }
  s.push(hit(C("clang"), ev.frappe, 1.0, 2.4), hit(C("choc"), ev.frappe, 0.5, 2.2));
  for (let k = 0; k < 8; k++) s.push(hit(C("pioche-terre"), ev.frappe + 0.2 + ((k * 5) % 9) * 0.1, 0.3, 0.6));
  s.push(hit(C("frappe-metal"), ev.toc1, 1.0, 1.0), hit(C("frappe-metal"), ev.toc2, 1.0, 1.0), hit(C("frappe-metal"), ev.toc3, 1.0, 1.0));
  s.push(hit(C("choc"), ev.toc1, 0.45, 2.2));
  s.push(hit(C("murmure"), mot(5, 27) + 0.1, 0.65, 1.9));
  s.push(hit(C("grincement"), ev.poignee, 0.35, 1.7));
  s.push(...repete(C("coeur"), mot(5, 31), fin, 0.8, 0.6, 1.0));
  // le noir : un dernier choc sourd, puis plus rien
  s.push(hit(C("choc"), fin + 0.0, 0.85, 2.2));
  void total;
  return valides(s);
}
