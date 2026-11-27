/**
 * « J'étais l'ange gardien… » — bande son : pad triste (drone-b) sur toute la durée, oiseaux le jour, carillon et halo à
 * chaque lumière dorée, voiture/klaxon/freinage au sauvetage, cloche du passage à niveau, train et corne à la gare,
 * piano discret après la révélation, crayon sur le couvercle, silence qui se creuse sur le dernier mot.
 * Tous les instants viennent des mots (data.mot) ou des événements : jamais de temps fixes.
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { B, C, boucle, hit, repete, valides } from "../sonslib";
import { VIT_TRAIN } from "./histoire";

const A = (n: string) => `sfx/ange/${n}.wav`;

export function sonsAnge(_r: RecitBlocs, m: Minutage, _p: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev;
  const mot = d.mot;
  const fin = Math.max(m.duree, m.dureeMin ?? 0);
  const s: Son[] = [];

  // --- ambiance : pad triste continu, oiseaux dehors (rue, gare, matin du quai)
  s.push(boucle(C("drone-b"), 0, fin, 0.24, 2.0));
  s.push(boucle(A("oiseaux"), 0, mot(0, 25) - 0.2, 0.13, 0.8));
  s.push(boucle(A("oiseaux"), mot(1, 31) + 0.9, mot(3, 16) + 1.0, 0.12, 1.0));
  s.push(boucle(A("oiseaux"), mot(5, 17) - 0.2, fin - 0.5, 0.1, 1.5));
  s.push(boucle(B("vent"), mot(3, 0), mot(4, 0), 0.05, 1.2));

  // --- scène 1 : la voiture, le klaxon, le freinage, puis la lumière dorée (halo, carillon, choc sourd)
  s.push(hit(C("voiture"), ev.sauve - 1.5, 0.5, 3));
  s.push(hit(C("klaxon"), ev.sauve - 0.85, 0.55, 2.4));
  s.push(hit(A("freinage"), ev.sauve - 0.62, 0.55, 1.2));
  s.push(hit(C("halo"), ev.sauve - 1.5, 0.75, 4));
  s.push(hit(C("carillon"), ev.sauve + 0.08, 0.6, 3.4));
  s.push(hit(C("choc"), ev.sauve + 0.05, 0.4, 2.2));
  s.push(hit(A("plume"), ev.plumeTombe + 0.9, 0.5, 2.6));
  s.push(hit(A("eclat"), mot(0, 24) + 0.35, 0.3, 1.8)); // transition vers la chambre

  // --- scène 2 : pas d'Emma, plumes qui tintent sur la table, silhouette lumineuse
  s.push(...repete(B("pas"), mot(1, 8), ev.pose, 0.45, 0.07, 0.45));
  s.push(hit(A("plume"), ev.pose, 0.38, 2.6));
  s.push(hit(C("halo"), ev.silhouette - 0.2, 0.5, 4));
  s.push(hit(C("carillon"), ev.silhouette + 0.05, 0.28, 3.4));

  // --- scène 3 : les pas des enfants et de leur mère
  s.push(...repete(B("pas"), mot(2, 0), mot(2, 26), 0.8, 0.07, 1.0));

  // --- scène 4 : cloche du passage à niveau, corne et grondement du train, flash doré
  for (let t = ev.barr - 0.7; t < ev.train1 + 0.3; t += 0.42) s.push(hit(A("cloche"), t, 0.2, 1.2));
  s.push(hit(C("corne"), mot(3, 16) + 0.1, 0.5, 4.5));
  s.push(hit(C("train"), ev.train1 - 4.0, 0.9, 8));
  s.push(hit(C("klaxon"), ev.flashG - 1.2, 0.5, 2.4));
  s.push(hit(C("halo"), ev.flashG - 1.6, 0.85, 4));
  s.push(hit(C("carillon"), ev.flashG + 0.05, 0.7, 3.4));
  s.push(hit(C("choc"), ev.flashG + 0.0, 0.55, 2.2));
  s.push(hit(A("eclat"), ev.flashG - 0.3, 0.45, 1.8));

  // --- scène 5 : cœur qui s'affole, la plume, puis le piano à la révélation
  s.push(hit(A("plume"), mot(4, 6), 0.4, 2.6));
  s.push(...repete(C("coeur"), mot(4, 10), mot(4, 22), 1.0, 0.3, 1.0));
  s.push(hit(C("halo"), ev.revele - 0.3, 0.45, 4));
  s.push(hit(B("piano"), mot(4, 30) - 0.2, 0.42, 10.5));

  // --- scène 6 : flashback, le train frappe (flash blanc), le silence, l'ange gardien, la treizième plume
  s.push(hit(C("train"), ev.train2 - 4.0, 0.9, 8));
  s.push(hit(C("corne"), ev.train2 - 2.8, 0.55, 4.5));
  s.push(hit(C("choc"), ev.train2 - 0.05, 1.0, 2.2));
  s.push(hit(C("clang"), ev.train2 + 0.02, 0.35, 2.4));
  s.push(...repete(A("cloche"), ev.train2 - 3.2, ev.train2 - 0.2, 0.42, 0.18, 1.2));
  s.push(hit(C("halo"), ev.ange - 0.6, 0.7, 4));
  s.push(hit(C("carillon"), ev.ange + 0.1, 0.6, 3.4));
  s.push(hit(B("piano"), mot(5, 29) + 1.2, 0.34, 10.5));
  s.push(hit(A("plume"), ev.depose + 0.8, 0.6, 2.6));
  s.push(hit(B("toc"), ev.couvercle + 0.3, 0.45, 1));
  s.push(hit(A("crayon"), ev.ecrit, 0.55, 0.9));
  s.push(hit(C("halo"), ev.disparait - 0.6, 0.85, 4));
  s.push(hit(C("carillon"), ev.disparait + 0.1, 0.7, 3.4));
  s.push(hit(A("eclat"), ev.disparait, 0.5, 1.8));
  s.push(hit(A("plume"), ev.disparait + 1.0, 0.45, 2.6));
  void VIT_TRAIN;
  return valides(s);
}
