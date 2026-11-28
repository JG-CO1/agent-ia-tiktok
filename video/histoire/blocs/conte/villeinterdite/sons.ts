/**
 * « Ville interdite » — bande son : sirène lointaine qui se tait net, pas sourds des géants (basse) qui accompagnent les ombres, vent au bord de la
 * table, grondement du sol à l'arrivée de la main, craquements de bois, « toc » des pièces posées, froissement de la boîte où l'on range les disparus,
 * pétrissage de la boulangère (calme absurde), silence net avant l'œil, souffle d'enfant et battement qui montent sous la révélation.
 * La voix reste prioritaire (volumes bas, impacts brefs).
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { B, C, boucle, hit, repete, valides } from "../sonslib";

const V = (n: string) => `sfx/villeinterdite/${n}.wav`;

export function sonsVilleinterdite(_r: RecitBlocs, m: Minutage, _p: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev;
  const mot = d.mot;
  const fin = d.finNarration;
  const total = Math.max(m.duree, m.dureeMin ?? 0);
  const s: Son[] = [];

  // --- scène 1 : sirène, grondement des géants, passants qui courent, pince, silence net
  s.push(boucle(V("sirene"), 0, ev.sirFin + 0.3, 0.2, 0.4));
  s.push(boucle(C("drone-a"), 0, mot(1, 0) + 0.4, 0.16, 1.0));
  s.push(boucle(B("vent"), 0, mot(2, 0), 0.07, 1.0));
  for (const t of [0.35, 1.95, 3.6, 5.2, 6.7]) s.push(hit(V("pas-geant"), t, 0.55, 1.6));
  s.push(...repete(B("pas"), 0.1, 2.8, 0.26, 0.1, 0.3));
  s.push(...repete(B("pas"), 0.3, 2.6, 0.31, 0.08, 0.3));
  s.push(hit(V("whoosh"), ev.leve - 0.95, 0.5, 1.2));
  s.push(hit(C("choc"), ev.leve + 0.1, 0.45, 2.2));
  s.push(hit(C("halo"), ev.leve + 0.1, 0.18, 3));

  // --- scène 2 : les adultes, Léo qui regarde la rue, il se glisse jusqu'à la trappe
  s.push(boucle(C("drone-b"), mot(1, 0), mot(2, 0) + 0.3, 0.17, 1.2));
  s.push(...repete(C("coeur"), mot(1, 21), mot(1, 25), 0.9, 0.3, 1.0));
  s.push(...repete(B("pas"), ev.sortLeo, ev.sortLeo + 1.3, 0.3, 0.13, 0.3));
  s.push(...repete(C("coeur"), mot(1, 28), mot(2, 0) - 0.1, 0.8, 0.34, 1.0));

  // --- scène 3 : cave (pas sur le bois, goutte, tunnel) puis le bord de la table
  s.push(boucle(C("drone-c"), mot(2, 0), mot(2, 8) + 0.2, 0.2, 0.8));
  s.push(...repete(B("pas"), mot(2, 0) - 0.1, mot(2, 0) + 0.95, 0.22, 0.2, 0.3));
  s.push(hit(C("goutte"), mot(2, 5) + 0.1, 0.4, 0.6), hit(C("goutte"), mot(2, 7) + 0.15, 0.3, 0.6));
  s.push(...repete(B("pas"), mot(2, 6), mot(2, 8) - 0.1, 0.19, 0.18, 0.25));
  s.push(boucle(V("vent-bord"), mot(2, 8) - 0.3, ev.main0 - 0.2, 0.2, 0.9));
  s.push(...repete(B("pas"), mot(2, 8), mot(2, 12) - 0.2, 0.31, 0.1, 0.3));
  s.push(hit(C("halo"), mot(2, 18), 0.25, 3));
  s.push(...repete(C("coeur"), mot(2, 19), mot(2, 26), 0.9, 0.3, 1.0));
  s.push(boucle(C("drone-b"), mot(2, 23), ev.secousse0 + 0.1, 0.17, 1.0));

  // --- scène 4 : le sol tremble, la main descend, saisit, soulève, pose ; la boulangère pétrit sans rien remarquer
  s.push(boucle(V("grondement"), ev.secousse0 - 0.15, ev.sort1 + 0.3, 0.22, 0.6));
  for (let t = ev.secousse0; t < ev.saisit; t += 0.42) s.push(hit(V("pas-geant"), t, 0.32 + 0.4 * ((t - ev.secousse0) / (ev.saisit - ev.secousse0)), 1.6));
  s.push(hit(V("whoosh"), ev.main0 + 0.05, 0.45, 1.2));
  s.push(hit(V("craquement"), ev.saisit + 0.05, 0.6, 1.8), hit(C("choc"), ev.saisit + 0.1, 0.5, 2.2));
  s.push(hit(V("craquement"), ev.leve0, 0.55, 1.8));
  s.push(hit(V("whoosh"), ev.va0 + 0.2, 0.35, 1.2));
  s.push(boucle(V("petrissage"), mot(3, 20) - 0.15, ev.pose1 + 1.6, 0.18, 0.3));
  s.push(hit(V("toc"), ev.pose1, 0.7, 0.8), hit(C("choc"), ev.pose1, 0.38, 2.2), hit(V("craquement"), ev.pose1 + 0.05, 0.3, 1.8));
  s.push(hit(V("whoosh"), ev.sort0 + 0.2, 0.4, 1.2));
  s.push(boucle(C("drone-a"), ev.sort0, mot(4, 0) + 0.2, 0.1, 0.8));

  // --- scène 5 : « j'ai compris » ; la boîte ; les adultes calmes ; l'habitant qui tombe
  s.push(boucle(V("nappe-calme"), mot(4, 0), mot(4, 22), 0.12, 1.2));
  s.push(hit(V("whoosh"), ev.range0 - 0.15, 0.45, 1.2));
  s.push(hit(V("froissement"), ev.range1 - 0.45, 0.4, 1.4));
  s.push(hit(V("toc"), ev.range1 + 0.05, 0.65, 0.8));
  s.push(hit(V("whoosh"), ev.range1 + 0.2, 0.3, 1.2));
  s.push(boucle(V("vent-bord"), ev.marcheSort0 - 0.3, mot(5, 0) - 0.4, 0.14, 0.6));
  s.push(...repete(B("pas"), ev.marcheSort0, ev.chute0 - 0.1, 0.34, 0.12, 0.3));
  s.push(hit(V("chute"), ev.chute0, 0.45, 2.4));

  // --- scène 6 : silence net, puis l'œil ; souffle, battement, tension ; paupière ; noir
  s.push(boucle(V("tension"), ev.oeil0 - 0.1, total, 0.2, 0.8));
  s.push(boucle(V("souffle"), ev.oeil0 + 0.5, total, 0.16, 0.8));
  s.push(hit(C("choc"), ev.oeil0, 0.6, 2.2));
  s.push(hit(V("grondement"), ev.oeil0 + 0.05, 0.2, 4));
  s.push(...repete(C("coeur"), ev.oeil0 + 0.8, fin, 0.62, 0.3, 1.0));
  s.push(hit(V("paupiere"), ev.clin1, 0.4, 0.5), hit(V("paupiere"), ev.clin2, 0.45, 0.5), hit(V("paupiere"), ev.clin3 + 0.2, 0.55, 0.6));
  s.push(hit(V("grondement"), ev.gronde - 0.1, 0.2, 3));
  s.push(hit(C("choc"), fin - 0.1, 0.3, 2.2));
  return valides(s);
}
