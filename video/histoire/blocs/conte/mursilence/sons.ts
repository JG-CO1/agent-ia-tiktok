/**
 * « Mur du silence » — bande son : silence habité (ton de pièce, tic-tac de l'horloge qui s'arrête à l'effondrement), briques qui se posent
 * (cascade du premier plan, vagues par scène, mini-mur de la rue), grattement de la main de Lina, battement lent du mur (un cœur
 * qui s'installe et grossit), murmure indistinct derrière les briques, brique qui tombe au ralenti, effondrement, puis nappe chaude
 * qui s'ouvre, carillon doré, tasse posée, pas qui courent, étreinte, et fondu en douceur (aucun choc final : la fin est chaude).
 * Tous les instants viennent des mots ou des événements : jamais de temps fixes. La voix reste prioritaire (volumes bas).
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { B, C, boucle, hit, repete, valides } from "../sonslib";
import { PERIODE_COEUR } from "./monde";

const M = (n: string) => `sfx/mursilence/${n}.wav`;
const CLAC = ["clac-a", "clac-b", "clac-c"];

export function sonsMursilence(_r: RecitBlocs, m: Minutage, _p: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev;
  const mot = d.mot;
  const fin = d.finNarration;
  void m;
  const s: Son[] = [];

  // --- ambiances : ton de pièce tout du long, tic-tac jusqu'à l'effondrement, rue de quartier, froid de la nuit
  s.push(boucle(M("piece"), 0, fin + 0.1, 0.2, 0.6));
  s.push(boucle(M("tictac"), 0.1, 1.55, 0.3, 0.1));
  s.push(boucle(M("tictac"), 4.1, ev.effondre - 0.05, 0.3, 0.3));
  s.push(boucle(M("rue"), 1.4, 4.2, 0.22, 0.2));
  s.push(boucle(C("drone-c"), ev.nuit0 + 0.2, ev.effondre + 0.3, 0.14, 1.4));
  s.push(boucle(C("drone-b"), ev.lueur0, ev.tombe + 1.2, 0.1, 1.2));

  // --- scène 1 : les briques se posent en vague (premier plan), le mini-mur de la rue, « cessent » : le silence tombe
  s.push(hit(M("cascade"), ev.v0 - 0.08, 0.6, 2.2));
  for (let j = 0; j < 8; j++) s.push(hit(M(CLAC[j % 3]), ev.rue1 + 0.05 + j * 0.115, 0.4, 0.4));
  s.push(hit(C("choc"), ev.rue1, 0.28, 2.2));
  s.push(hit(M("tasse"), mot(0, 22), 0.16, 0.9));
  s.push(hit(C("choc"), mot(0, 26), 0.22, 2.2)); // « la disparition de maman » sur la photo
  s.push(boucle(C("drone-b"), mot(0, 24) - 0.2, mot(1, 0) + 0.4, 0.14, 0.4));

  // --- scène 2 : vagues de briques sur la table, grattement des doigts de Lina
  for (const [t0, k] of [[ev.vA, 7], [ev.vB, 6], [ev.vC, 6]] as Array<[number, number]>) s.push(...Array.from({ length: k }, (_, i) => hit(M(CLAC[i % 3]), t0 + 0.12 + i * 0.18, 0.34, 0.4)));
  s.push(hit(M("tasse"), mot(1, 3) - 0.1, 0.22, 0.9));
  s.push(hit(M("gratte"), mot(1, 24), 0.4, 1.0), hit(M("gratte"), mot(1, 28) - 0.1, 0.42, 1.0), hit(M("gratte"), mot(1, 30), 0.38, 1.0));

  // --- scène 3 : « Un soir » (vague), l'oreille contre le mur, murmure indistinct, premier battement
  s.push(...Array.from({ length: 5 }, (_, i) => hit(M(CLAC[i % 3]), ev.vD + 0.1 + i * 0.2, 0.3, 0.4)));
  s.push(hit(M("gratte"), ev.linaOreille - 0.2, 0.3, 1.0));
  s.push(boucle(M("murmure-mur"), mot(2, 5), ev.tombe - 0.2, 0.2, 1.0));
  s.push(boucle(M("murmure-mur"), mot(2, 11), mot(2, 15), 0.14, 0.5));
  s.push(...repete(B("pas"), ev.adamVa, ev.adamArrive, 0.38, 0.26, 0.5));
  s.push(hit(C("choc"), ev.bat0, 0.3, 2.2));

  // --- le cœur du mur : un battement tous les 1,7 s, qui grossit de scène en scène, puis se tait quand le mur tombe
  for (let t = ev.bat0; t < ev.effondre - 0.05; t += PERIODE_COEUR) {
    const v = t < ev.vE ? 0.5 : t < ev.vF ? 0.62 : 0.78;
    s.push(hit(M("battement"), t - 0.02, v, 1.7));
  }

  // --- scène 4 : les mots gravés apparaissent, les trois mots-clés, vague de briques
  s.push(...Array.from({ length: 5 }, (_, i) => hit(M(CLAC[i % 3]), ev.vE + 0.1 + i * 0.2, 0.28, 0.4)));
  s.push(hit(C("carillon"), mot(3, 10) + 0.05, 0.1, 3.4), hit(C("carillon"), mot(3, 13) + 0.05, 0.1, 3.4), hit(C("carillon"), mot(3, 16) + 0.05, 0.14, 3.4));
  s.push(hit(C("choc"), mot(3, 20), 0.26, 2.2));

  // --- scène 5 : le courage, le dernier cri du mur, la brique qui tombe (REVELATION 1), papa qui marche vers le mur, les larmes
  s.push(...Array.from({ length: 5 }, (_, i) => hit(M(CLAC[i % 3]), ev.vF + 0.1 + i * 0.2, 0.26, 0.4)));
  s.push(hit(B("souffle"), mot(4, 2), 0.3, 1.0));
  s.push(hit(M("gratte"), ev.secousse, 0.3, 1.0));
  s.push(hit(M("brique-tombe"), ev.tombe - 0.17, 0.95, 3.4));
  s.push(...repete(B("pas"), ev.papaLeve, ev.papaArrive, 0.36, 0.26, 0.5));
  s.push(hit(C("choc"), ev.larmes, 0.22, 2.2));
  s.push(hit(B("souffle"), mot(4, 25), 0.22, 1.0));
  s.push(hit(C("carillon"), mot(4, 28), 0.18, 3.4));

  // --- scène 6 : l'effondrement (REVELATION 2), la lumière dorée, maman (REVELATION 3), la course, l'étreinte, la nappe chaude
  s.push(hit(M("effondrement"), ev.effondre - 0.1, 0.7, 6.0));
  s.push(hit(C("choc"), ev.effondre + 0.28, 0.5, 2.2));
  s.push(hit(M("nappe-chaude"), ev.effondre + 0.6, 0.34, fin + 0.15 - (ev.effondre + 0.6)));
  s.push(hit(C("carillon"), ev.effondre + 1.3, 0.22, 3.4));
  s.push(hit(M("souffle-chaud"), ev.maman0 - 0.12, 0.3, 1.4));
  s.push(hit(C("carillon"), ev.maman0, 0.26, 3.4));
  s.push(hit(C("coeur"), ev.maman0 + 0.1, 0.34, 1.0));
  s.push(...repete(B("pas"), ev.courent, ev.courent + 1.2, 0.22, 0.3, 0.4));
  s.push(hit(M("tasse"), mot(5, 16) - 0.1, 0.34, 0.9));
  s.push(hit(C("halo"), ev.etreinte + 0.3, 0.2, 4.0));
  s.push(hit(C("carillon"), ev.jamais, 0.22, 3.4));
  return valides(s);
}
