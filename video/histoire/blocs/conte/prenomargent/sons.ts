/**
 * « Prénom = argent » — bande son : rue ensoleillée, cris des copains et tintement de pièce à chaque « Maxime ! », « ding » du compteur
 * en rafale, billets, stade vide puis stade en liesse, basse des haut-parleurs et jingle de radio, foule qui chante en voyelles,
 * explosion de pièces sur la façade de la banque, mer et fanfare à la propriété, pas vers la boulangerie, caisse, chute du silence à
 * « rien à vous vendre », vent sec de la ville ruinée, pièces qui filent des portefeuilles, silence total quand plus personne ne dit le
 * prénom, compteur qui se fige, pièce qui tourne et s'immobilise, puis le noir. Tous les instants viennent des mots ou des événements :
 * jamais de temps fixes. La voix reste prioritaire (volumes bas, impacts brefs).
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { B, C, boucle, hit, repete, valides } from "../sonslib";

const P = (n: string) => `sfx/prenomargent/${n}.wav`;

export function sonsPrenomargent(_r: RecitBlocs, _m: Minutage, plans: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev as Record<string, any>;
  const mot = d.mot;
  const fin = d.finNarration;
  const s: Son[] = [];
  const debutPlan = (id: string) => plans.find((p) => p.def.id === id)?.debut ?? 0;
  const tToits = debutPlan("s03p1");
  const tRue2 = debutPlan("s03p5");

  // ---------------------------------------------------------------- ambiances
  s.push(boucle(P("ville"), 0, ev.riche + 0.1, 0.2, 0.5)); // rue ensoleillée (scènes 1 et 2)
  s.push(boucle(B("vent"), ev.riche, ev.chanteStade, 0.28, 0.2)); // stade vide
  s.push(boucle(P("stade"), ev.chanteStade - 0.1, tToits + 0.05, 0.36, 0.15)); // stade en liesse
  s.push(boucle(P("basse"), ev.hpOn, tRue2 + 0.05, 0.4, 0.2)); // haut-parleurs sur les toits
  s.push(boucle(P("foule"), tToits, tRue2 + 0.05, 0.12, 0.3)); // chant diffusé, lointain
  s.push(boucle(P("radio"), ev.onAir, tRue2 + 0.05, 0.2, 0.2)); // jingle de la radio
  // la rue entière chante : du « Maxime » de la radio jusqu'à « rien à vous vendre »
  s.push(boucle(P("foule"), tRue2 - 0.05, ev.rien - 0.05, 0.3, 0.2));
  s.push(boucle(P("ville"), tRue2, ev.rien - 0.05, 0.08, 0.3));
  s.push(boucle(C("drone-a"), ev.hypno - 0.5, ev.rien - 0.05, 0.16, 1.2)); // l'hypnose s'installe
  s.push(boucle(P("mer"), debutPlan("s04p1"), debutPlan("s04p4") + 0.05, 0.3, 0.2)); // villa et yacht
  // ville ruinée : vent sec, chant monotone, bourdon ; puis le silence total
  s.push(boucle(P("vent"), ev.ruine, fin + 0.04, 0.3, 0.4));
  s.push(boucle(P("foule"), ev.ruine + 0.1, ev.stop, 0.2, 0.5));
  s.push(boucle(C("drone-a"), ev.ruine, ev.stop, 0.18, 0.5));
  s.push(boucle(C("drone-b"), ev.stop + 0.1, fin + 0.04, 0.2, 1.4)); // nappe vide

  // ---------------------------------------------------------------- scène 1 : un cri, une pièce, un ding
  (ev.crisS1 as number[]).forEach((t0, i) => {
    s.push(hit(P("cri"), t0 + 0.02, 0.45, 0.6));
    s.push(hit(P("piece"), t0 + 0.2, 0.3, 0.9));
    s.push(hit(P("ding"), (ev.arrivees as number[])[i], 0.28, 0.4));
  });

  // ---------------------------------------------------------------- scène 2 : cris en rafale, billets, stade
  (ev.crisS2 as number[]).forEach((t0, i) => {
    s.push(hit(P("cri"), t0 + 0.02, 0.3, 0.6));
    if (i % 2 === 0) s.push(hit(P("piece"), t0 + 0.25, 0.22, 0.9));
  });
  s.push(...repete(P("ding"), ev.paliers0 + 0.1, ev.riche, 0.42, 0.12, 0.4));
  s.push(hit(B("papier"), ev.noteA, 0.35, 1.2), hit(P("ding"), ev.noteA + 0.2, 0.3, 0.4));
  s.push(hit(B("papier"), ev.noteB, 0.4, 1.2), hit(P("pluie"), ev.noteB + 0.1, 0.18, 3.2), hit(P("ding"), ev.noteB + 0.25, 0.3, 0.4));
  s.push(hit(P("fanfare"), ev.riche + 0.05, 0.22, 1.7)); // « J'ai loué un stade »
  s.push(hit(P("pluie"), ev.pluie, 0.3, 3.2));
  for (const t of [ev.chanteStade + 0.35, ev.chanteStade + 0.9, mot(1, 26) + 0.2, mot(1, 28)]) s.push(hit(P("flash"), t, 0.22, 0.5));

  // ---------------------------------------------------------------- scène 3 : toits, radio, compteur qui explose
  s.push(hit(C("choc"), ev.hpOn, 0.3, 2.2));
  s.push(hit(P("onair"), ev.onAir, 0.4, 0.5));
  s.push(...repete(P("ding"), mot(2, 0) + 0.2, ev.explose, 0.34, 0.09, 0.4));
  s.push(hit(P("pluie"), tRue2 + 0.2, 0.28, 3.2), hit(P("pluie"), mot(2, 20), 0.34, 3.2));
  s.push(hit(P("explosion"), ev.explose - 0.04, 0.8, 1.8), hit(C("choc"), ev.explose - 0.02, 0.45, 2.2));

  // ---------------------------------------------------------------- scène 4 : villa, yacht, château, pas, caisse, silence
  s.push(hit(P("fanfare"), debutPlan("s04p3"), 0.26, 1.7));
  s.push(...repete(B("pas"), 25.2, 28.6, 0.5, 0.14, 0.7)); // Maxime marche vers la boulangerie
  s.push(hit(P("caisse"), mot(3, 20) + 0.05, 0.25, 1.3));
  s.push(hit(P("tombe"), ev.rien - 0.1, 0.8, 1.8), hit(C("choc"), ev.rien - 0.05, 0.4, 2.2)); // « rien » : le silence tombe
  s.push(hit(C("goutte"), ev.rien + 0.9, 0.3, 0.8));

  // ---------------------------------------------------------------- scène 5 : portefeuilles vides, pièces qui s'envolent
  s.push(hit(C("goutte"), ev.plat, 0.32, 0.8));
  s.push(...repete(P("piece"), ev.vole, ev.stop - 0.2, 0.17, 0.1, 0.9));
  s.push(...repete(P("ding"), ev.vole, ev.stop - 0.2, 0.32, 0.09, 0.4));
  s.push(hit(C("choc"), mot(4, 15) - 0.05, 0.5, 2.2));
  s.push(hit(C("choc"), mot(4, 19) - 0.05, 0.32, 2.2));
  s.push(...repete(C("coeur"), mot(4, 14), ev.stop, 0.8, 0.3, 1.0));

  // ---------------------------------------------------------------- scène 6 : le silence, le compteur figé, la pièce, le noir
  s.push(hit(P("tombe"), ev.stop, 0.9, 1.8), hit(C("choc"), ev.stop, 0.45, 2.2)); // « et plus personne »
  s.push(hit(P("fige"), ev.fige, 0.38, 1.2));
  s.push(hit(P("piece-tombe"), debutPlan("s06p8") - 0.05, 0.4, 2.6));
  s.push(hit(C("choc"), fin, 0.5, 2.2));
  void ev.fin;
  return valides(s);
}
