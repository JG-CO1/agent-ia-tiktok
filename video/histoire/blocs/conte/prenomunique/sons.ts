/**
 * « Dans cette ville, tout le monde s'appelle Alex… » — bande son : murmure de ville ensoleillée et pas de foule en phase
 * (même cadence que l'animation de marche), cloche d'école, « hey » grave de foule quand le professeur crie, claquement des
 * trente têtes qui se retournent, bips du panneau à diodes jusqu'à 144, silence tendu de la classe (drone grave), nuit aux grillons,
 * bourdonnement froid du sous-sol, soupir de cabine au réveil du sosie, chocs aux trois révélations (sosie, plaque « NOÉ »,
 * visage identique), givre qui se dissipe, cœur, respiration derrière la vitre, puis coupure nette au noir.
 * Tous les instants viennent des mots ou des événements : jamais de temps fixes. La voix reste prioritaire (volumes bas).
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { B, C, boucle, hit, repete, valides } from "../sonslib";

const P = (n: string) => `sfx/prenomunique/${n}.wav`;

export function sonsPrenomunique(_r: RecitBlocs, m: Minutage, _p: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev;
  const mot = d.mot;
  const fin = d.finNarration;
  const s: Son[] = [];
  const tArr = ev.maireDoor;

  // --- ambiances
  // ville ensoleillée : scène 1, cantine et place (tant que la caméra est dehors, en plein jour)
  s.push(boucle(P("ville-jour"), 0, ev.cri - 0.6, 0.22, 0.8));
  s.push(boucle(P("ville-jour"), mot(1, 16) - 0.2, ev.mardi - 0.3, 0.2, 0.6));
  // classe : un murmure étouffé ; le drone grave s'installe dès « Pourtant » et ne lâche plus
  s.push(boucle(C("murmure"), ev.cri - 0.8, ev.retour + 0.2, 0.05, 0.3));
  s.push(boucle(C("drone-a"), ev.mardi, tArr - 0.1, 0.16, 1.4));
  // nuit : grillons, puis le froid du sous-sol prend la suite sans interruption
  s.push(boucle(C("grillons"), tArr - 2.2, tArr + 0.4, 0.1, 0.4));
  s.push(boucle(P("bourdon"), tArr - 0.1, fin + 0.04, 0.26, 0.5));
  s.push(boucle(C("drone-a"), mot(3, 24), fin + 0.04, 0.2, 1.2));
  // tension : houle pendant la course vers le fond, puis le silence doré de la plaque
  s.push(boucle(C("drone-c"), mot(4, 17) - 0.2, ev.plaque + 0.1, 0.22, 0.4));

  // --- scène 1 : pas de foule en phase (marche : 3 u/s, un pas tous les 0,366 s, premier appui à t = -2 + 0,183 s)
  for (let k = 0; ; k++) {
    const t = -2 + 0.183 + 0.366 * k;
    if (t > 9.15) break;
    if (t >= 0.05) s.push(hit(P("pas"), t, 0.34, 0.5));
  }
  s.push(hit(C("choc"), mot(0, 20) - 0.05, 0.18, 2.2)); // « sauf moi »
  s.push(hit(C("coeur"), mot(0, 25) - 0.1, 0.3, 1.0));

  // --- scène 2 : cloche, cri, claquement des têtes, regards, cantine, compteur
  s.push(hit(P("cloche"), mot(1, 0) - 0.15, 0.28, 2.4));
  s.push(hit(P("hey"), ev.cri, 0.8, 1.0));
  s.push(hit(P("claque"), ev.tourne + 0.04, 0.8, 0.6));
  s.push(hit(P("hey"), ev.tourne + 0.04, 0.5, 1.0));
  s.push(hit(C("choc"), ev.tourne + 0.04, 0.4, 2.2));
  s.push(...repete(C("coeur"), ev.noeTourne, ev.retour, 0.9, 0.34, 1.0));
  s.push(hit(P("claque"), ev.retour + 0.05, 0.4, 0.6));
  s.push(...repete(B("tic"), mot(1, 16), mot(1, 22), 0.54, 0.12, 0.2)); // cuillères en cadence (cantine)
  s.push(...repete(P("tic-led"), ev.compte0, ev.compte1, 0.04, 0.18, 0.1));
  s.push(hit(P("valide"), ev.compte1, 0.4, 0.9), hit(C("choc"), ev.compte1, 0.3, 2.2));

  // --- scène 3 : disparitions (soupir étouffé), cœur
  s.push(hit(P("soupir"), ev.voisinDisp, 0.28, 1.8), hit(C("goutte"), ev.voisinDisp + 0.05, 0.3, 0.6));
  s.push(hit(P("soupir"), ev.maitDisp, 0.28, 1.8), hit(C("goutte"), ev.maitDisp + 0.05, 0.3, 0.6));
  s.push(...repete(C("coeur"), mot(2, 15), mot(3, 0), 1.0, 0.36, 1.0));

  // --- scène 4 : la porte de la mairie, pas sur la pierre, tintement des cabines, cœur du réveil
  s.push(hit(C("grincement"), tArr - 0.05, 0.5, 1.6));
  s.push(...repete(B("pas"), tArr + 0.3, tArr + 3.4, 0.55, 0.22, 0.8));
  s.push(hit(C("choc"), mot(3, 8), 0.3, 2.2)); // « Des cabines de verre »
  s.push(hit(C("carillon"), mot(3, 16), 0.12, 3.4)); // « Alex » sur la plaque
  s.push(...repete(C("coeur"), mot(3, 17), mot(3, 25), 1.1, 0.34, 1.0));
  s.push(...repete(C("coeur"), mot(3, 25), ev.reveil, 0.6, 0.5, 1.0));
  // RÉVÉLATION 1 : le sosie ouvre les yeux
  s.push(hit(C("choc"), ev.reveil, 0.95, 2.2), hit(P("soupir"), ev.reveil, 0.7, 1.8));
  s.push(...repete(P("tic-led"), ev.reveil + 0.3, mot(4, 0), 0.38, 0.1, 0.1));
  s.push(...repete(C("coeur"), ev.reveil + 0.4, mot(4, 4), 0.55, 0.5, 1.0));

  // --- scène 5 : le maire surgit, « Les vrais dorment… », course vers le fond, la plaque
  s.push(hit(C("choc"), ev.surprend, 0.8, 2.2));
  s.push(hit(C("clang"), ev.surprend + 0.1, 0.15, 2.4));
  s.push(boucle(B("vent"), mot(4, 17) - 0.15, mot(4, 22), 0.3, 0.5));
  // RÉVÉLATION 2 : la plaque s'allume « NOÉ »
  s.push(hit(P("plaque"), ev.plaque, 0.65, 1.3), hit(C("choc"), ev.plaque, 0.9, 2.2));
  s.push(hit(C("coeur"), ev.plaque + 0.5, 0.5, 1.0));

  // --- scène 6 : le givre se dissipe, le visage, les mains, le prénom, la respiration, le noir
  s.push(hit(P("givre"), ev.givre0 - 0.2, 0.5, 1.8), hit(C("halo"), ev.givre0 - 0.2, 0.18, 4));
  s.push(...repete(C("coeur"), mot(5, 2), ev.visage, 0.8, 0.5, 1.0));
  // RÉVÉLATION 3 : « Il avait mon visage » — le même visage, deux fois
  s.push(hit(C("choc"), ev.visage, 1.0, 2.2), hit(C("clang"), ev.visage + 0.02, 0.2, 2.4));
  s.push(...repete(C("coeur"), ev.visage + 0.3, fin - 0.3, 0.72, 0.62, 1.0));
  s.push(hit(B("souffle"), ev.mains, 0.3, 0.5));
  s.push(hit(C("choc"), ev.prenom, 0.3, 2.2));
  s.push(boucle(P("respire"), ev.copie0, fin + 0.04, 0.26, 0.6));
  s.push(hit(C("murmure"), ev.copie0 + 0.2, 0.3, 1.9));
  // le noir : un dernier choc sourd, puis plus rien
  s.push(hit(C("choc"), fin + 0.0, 0.85, 2.2));
  void m;
  return valides(s);
}
