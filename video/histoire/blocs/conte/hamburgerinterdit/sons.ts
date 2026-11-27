/**
 * « Hamburger interdit » — bande son : néon qui grésille et clignote, jukebox lointain, sifflets de policier, cloche de verre,
 * tic-tac de l'horloge (qui se tait quand la mère regarde l'assiette), grincement du grenier, froissement du papier, pages de
 * l'album, crayon, « effacement » (balayage descendant doux), croc, cœur, nappe mélancolique finale, puis coupure nette au noir.
 * Tous les instants viennent des mots (data.mot) ou des événements : jamais de temps fixes. La voix reste prioritaire.
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { B, C, boucle, hit, repete, valides } from "../sonslib";

const H = (n: string) => `sfx/hamburgerinterdit/${n}.wav`;
const A = (n: string) => `sfx/ange/${n}.wav`;

export function sonsHamburgerinterdit(_r: RecitBlocs, m: Minutage, _p: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev;
  const mot = d.mot;
  const fin = d.finNarration;
  void m;
  const s: Son[] = [];

  // --- scène 1 : la ville rétro, néons qui grésillent, jukebox au loin
  s.push(boucle(H("ville"), 0, mot(1, 4), 0.2, 0.5));
  s.push(boucle(H("jukebox"), 0.2, mot(1, 4) + 0.2, 0.09, 0.8));
  s.push(boucle(H("neon"), 0, 6.2, 0.08, 0.3));
  for (const [t0, t1] of [[0.36, 0.46], [0.7, 0.77], [1.02, 1.06]]) s.push(hit(H("neon-clic"), t0 - 0.02, 0.35, 0.4), hit(H("neon-clic"), t1 - 0.02, 0.3, 0.4));
  s.push(hit(C("choc"), 0.18, 0.4, 2.2));
  s.push(hit(H("sifflet"), mot(0, 9) + 0.05, 0.2, 1.0));
  s.push(hit(H("sifflet"), ev.fouille - 0.1, 0.32, 1.0));
  s.push(hit(H("sifflet"), ev.sort + 0.05, 0.26, 1.0));
  s.push(hit(H("cloche"), ev.cloche - 0.03, 0.5, 1.8), hit(C("choc"), ev.cloche, 0.3, 2.2));

  // --- scène 2 : on lui répond par le silence ; cuisine, tic-tac, couverts, regard vide
  s.push(hit(C("murmure"), ev.detourne, 0.5, 1.9));
  s.push(boucle(C("drone-b"), mot(1, 5), mot(2, 0) + 0.6, 0.15, 1.4));
  s.push(boucle(H("horloge"), mot(1, 11) - 0.1, mot(2, 0), 0.22, 0.4));
  s.push(hit(H("couverts"), ev.couverts, 0.5, 1.0));
  s.push(hit(C("choc"), ev.vide - 0.05, 0.3, 2.2));
  s.push(...repete(C("coeur"), ev.vide, ev.pars, 0.9, 0.3, 1.0));
  s.push(...repete(B("pas"), ev.pars + 0.1, ev.pars + 1.5, 0.45, 0.22, 0.5));

  // --- scène 3 : grenier, grincements, froissements, le papier, flash, cœur
  s.push(boucle(H("grenier"), mot(2, 0) - 0.1, mot(3, 5), 0.26, 0.8));
  s.push(hit(C("grincement"), mot(2, 0) + 0.1, 0.3, 1.7), hit(C("grincement"), mot(2, 3) + 0.2, 0.2, 1.7));
  s.push(hit(B("papier"), ev.emb, 0.4, 1.2));
  s.push(hit(B("papier"), ev.papier, 0.5, 1.2));
  s.push(boucle(C("drone-a"), ev.papier, mot(3, 5) + 0.3, 0.2, 0.8));
  s.push(hit(C("choc"), ev.flashLue, 0.6, 2.2));
  s.push(...repete(C("coeur"), ev.flashLue + 0.4, mot(3, 5), 0.8, 0.4, 1.0));

  // --- scène 4 : quatre assiettes pour trois ; le tic-tac s'arrête quand la mère regarde l'assiette
  s.push(boucle(H("ville"), mot(3, 4), mot(3, 19), 0.0001, 0.2));
  s.push(boucle(H("horloge"), mot(3, 5), mot(3, 19) - 0.05, 0.2, 0.3));
  s.push(hit(C("choc"), ev.assiettes, 0.35, 2.2));
  s.push(...repete(C("coeur"), mot(3, 19) + 0.2, mot(4, 0), 1.0, 0.28, 1.0));

  // --- scène 5 : album, pages, crayon, photo
  s.push(boucle(H("nappe-triste"), mot(4, 0) - 0.2, ev.t2b + 1.0, 0.24, 1.0));
  s.push(hit(H("page"), ev.ouvre, 0.4, 0.5));
  for (const t of [ev.flip0, ev.flip1, ev.flip2, ev.flip3]) s.push(hit(H("page"), t, 0.45, 0.5));
  s.push(hit(C("choc"), mot(4, 12), 0.3, 2.2));
  s.push(...repete(C("coeur"), mot(4, 12) + 0.3, mot(5, 0), 0.9, 0.35, 1.0));
  s.push(hit(B("papier"), ev.retourne, 0.35, 1.2));
  s.push(hit(A("crayon"), ev.t1a, 0.3, Math.max(0.6, ev.t1b - ev.t1a)));
  s.push(hit(A("crayon"), ev.t2a, 0.3, Math.max(0.6, ev.t2b - ev.t2a)));
  s.push(hit(C("choc"), ev.t1b - 0.35, 0.5, 2.2));
  s.push(hit(C("choc"), ev.t2a + 0.2, 0.5, 2.2));

  // --- scène 6 : le manteau, le souvenir sépia, l'effacement, la rue décolorée
  s.push(hit(C("choc"), mot(5, 0), 0.65, 2.2), hit(C("drone-a"), mot(5, 0), 0.3, 3.0));
  s.push(boucle(H("jukebox"), ev.fb0, ev.mord + 0.2, 0.16, 0.3));
  s.push(boucle(H("horloge"), ev.fb0, ev.mord, 0.14, 0.3));
  s.push(hit(H("croc"), ev.mord, 0.6, 0.6));
  s.push(hit(H("efface"), ev.eff0 - 0.1, 0.6, 2.8));
  s.push(hit(C("halo"), ev.eff0, 0.25, 3.0));
  s.push(boucle(H("nappe-triste"), ev.retour - 0.3, fin + 0.05, 0.3, 1.2));
  s.push(boucle(B("vent"), ev.retour, fin, 0.07, 1.0));
  s.push(...repete(C("coeur"), ev.burger, fin + 0.0, 0.8, 0.5, 1.0));
  // le noir : un dernier choc sourd, puis plus rien
  s.push(hit(C("choc"), fin + 0.0, 0.8, 2.2));
  return valides(s);
}
