/**
 * « Chaque fois que je regarde mon téléphone… » — bande son : nappe froide, notifications douces (« tiloup »), battement de
 * cœur dans les gros plans, whoosh de saut de temps qui monte jusqu'à chaque flash, horloge qui s'emballe, SILENCE NET à
 * l'extinction de l'écran, puis la rue de 2085 (vent, voitures qui survolent, pas), piano de mélancolie quand la vieille dame
 * apparaît, écran qui se rallume, choc froid sur le texte, porte qui se ferme, et plus rien.
 * Tous les instants viennent des mots (data.mot) ou des événements : jamais de temps fixes. La voix reste prioritaire.
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../../decoupage";
import type { Son } from "../../minuit/sons";
import type { PlanGen } from "../../types";
import type { DonneesConte } from "../lib";
import { B, C, boucle, hit, repete, valides } from "../sonslib";
import { VOITURES } from "./histoire";

const T = (n: string) => `sfx/telephone/${n}.wav`;

/** Boucle qui démarre en fondu et s'arrête NET à `t1` (silence voulu). */
function bouclePuisCoupe(src: string, t0: number, t1: number, volume: number, fade = 1.6): Son {
  const d = Math.max(0.2, t1 - t0);
  return { src, t: Math.max(0, t0), volume, duree: d, boucle: true, enveloppe: [[0, 0], [Math.min(fade, d / 2), 1], [Math.max(d - 0.04, d / 2), 1], [d, 0]] };
}

export function sonsTelephone(_r: RecitBlocs, m: Minutage, _p: PlanMinute<PlanGen>[], d: DonneesConte): Son[] {
  const ev = d.ev;
  const mot = d.mot;
  const fin = d.finNarration;
  const total = Math.max(m.duree, m.dureeMin ?? 0);
  const s: Son[] = [];

  // --- ambiance : nappe froide jusqu'au silence de l'écran qui s'éteint ; la même, plus basse, quand il se rallume
  s.push(bouclePuisCoupe(T("nappe"), 0, ev.eteint, 0.3));
  s.push(boucle(T("nappe"), ev.rallume - 0.2, fin + 0.05, 0.26, 1.2));
  s.push(bouclePuisCoupe(C("drone-b"), 0, ev.eteint, 0.1, 2.0));
  // la rue de 2085 : vent doux, houle lointaine ; mélancolie dorée quand la vieille dame apparaît
  s.push(boucle(B("vent"), ev.porteOuv - 0.2, fin + 0.05, 0.07, 1.2));
  s.push(boucle(C("drone-c"), ev.porteOuv + 0.4, ev.rallume, 0.12, 1.5));
  s.push(hit(B("piano"), ev.dame + 0.4, 0.3, 10.5));
  s.push(hit(B("piano"), mot(5, 13) - 0.4, 0.2, 5.5));

  // --- scène 1 : le pouce glisse, la notification tombe, il répond, premier battement
  s.push(...repete(T("swipe"), 0.35, ev.notif0 - 0.1, 0.5, 0.16, 0.3));
  s.push(hit(T("notif"), ev.notif0, 0.4, 1.2));
  s.push(...repete(C("coeur"), mot(0, 6), ev.rep0, 1.1, 0.34, 1.0));
  for (let k = 0; k < 4; k++) s.push(hit(T("tap"), ev.rep0 + 0.3 * k + 0.12, 0.3, 0.2));
  s.push(hit(T("swipe"), ev.b1 - 0.5, 0.2, 0.3));

  // --- les battements : le whoosh monte et atteint son sommet à l'instant du flash
  [ev.b1, ev.b2, ev.b3, ev.b4, ev.b5].forEach((tb, i) => {
    s.push(hit(T("saut"), tb - 0.55, i === 0 ? 0.5 : 0.62, 1.3));
    s.push(hit(C("choc"), tb, 0.22, 1.4));
  });
  // --- scène 2 : la sœur grandit, nouveau message, papa grisonne, le pouce n'arrête pas
  s.push(hit(T("notif"), ev.notif2, 0.4, 1.2));
  s.push(...repete(C("coeur"), mot(1, 10), mot(1, 16), 0.9, 0.38, 1.0));
  s.push(...repete(C("coeur"), mot(1, 23), mot(2, 0), 0.8, 0.4, 1.0));
  s.push(...repete(T("swipe"), mot(1, 31), mot(2, 0), 0.5, 0.16, 0.3));

  // --- scène 3 : la vidéo de trente secondes, le fauteuil vide, l'horloge qui s'emballe
  s.push(...repete(T("swipe"), ev.video0 + 0.4, ev.b5 - 0.8, 0.9, 0.1, 0.3));
  s.push(...repete(C("coeur"), mot(2, 12), ev.spin0, 0.75, 0.42, 1.0));
  s.push(hit(T("tictac"), ev.spin0 - 0.1, 0.5, 3.3));
  s.push(hit(C("choc"), mot(2, 12), 0.3, 1.4));

  // --- scène 4 : l'écran s'éteint (silence net), la porte, la course, les voitures
  s.push(hit(T("ecran-off"), ev.eteint, 0.6, 0.6));
  s.push(hit(C("grincement"), ev.porteOuv - 0.05, 0.32, 1.6));
  s.push(...repete(B("pas"), ev.porteOuv + 0.4, ev.porteOuv + 1.55, 0.27, 0.16, 0.3));
  s.push(hit(T("porte"), ev.porteFerme + 0.45, 0.5, 1.4));
  for (const [tC, , , , ci] of VOITURES) {
    const t0 = tC - 1.3;
    if (t0 > ev.porteOuv && t0 < fin - 0.4) s.push(hit(T("survol"), t0, 0.2 + 0.03 * (ci % 3), 2.6));
  }
  s.push(...repete(B("pas"), mot(3, 12), mot(3, 15), 0.45, 0.05, 0.4));
  s.push(...repete(B("pas"), mot(3, 17) + 0.2, mot(4, 0) - 0.3, 0.6, 0.09, 0.5));

  // --- scène 5 : la vieille dame, les yeux de sa sœur
  s.push(hit(C("halo"), ev.dame, 0.3, 4));
  s.push(hit(C("coeur"), mot(4, 0), 0.4, 1.0));
  s.push(...repete(C("coeur"), mot(4, 17), ev.rallume, 0.85, 0.4, 1.0));
  s.push(hit(C("choc"), mot(4, 17), 0.35, 1.4));

  // --- scène 6 : l'écran se rallume tout seul, le texte, la dame tourne le dos, la porte, le noir
  s.push(hit(T("ecran-on"), ev.rallume - 0.1, 0.55, 1.7));
  s.push(hit(T("notif"), ev.rallume + 0.1, 0.3, 1.2));
  s.push(hit(C("choc"), ev.msg, 0.55, 1.4));
  s.push(hit(C("drone-a"), ev.msg, 0.28, 6));
  s.push(...repete(B("pas"), ev.dameTourne + 0.7, ev.porte2 + 0.4, 0.8, 0.06, 0.6));
  s.push(hit(C("grincement"), ev.porte2, 0.3, 1.6));
  s.push(hit(T("porte"), ev.porteClose - 0.12, 0.72, 1.4));
  // le noir : un dernier choc sourd, puis plus rien
  s.push(hit(C("choc"), fin + 0.0, 0.85, 2.2));
  void total;
  return valides(s);
}
