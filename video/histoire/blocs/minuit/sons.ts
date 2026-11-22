/**
 * Habillage sonore de « La fenêtre de minuit » (script § 5) : calé sur les plans et les mots, jamais sur des
 * temps fixes. Vent nocturne discret, tic-tac puis top de minuit, clic de l'interrupteur, souffle de la bougie
 * suivi d'un silence, pas, trois coups à la porte, papier, et piano seulement après la découverte de l'enveloppe.
 * Sons synthétisés par `npx tsx scripts/gen-sfx-blocs.ts` (video/public/sfx/blocs/).
 */
import { tempsMot, type Minutage, type PlanMinute, type RecitBlocs } from "../decoupage";
import type { PlanDef } from "./plans";

export type Son = {
  src: string;
  /** début (s) */
  t: number;
  volume: number;
  /** durée de lecture (s) */
  duree?: number;
  boucle?: boolean;
  /** enveloppe de volume : [seconde depuis le début du son, facteur] */
  enveloppe?: Array<[number, number]>;
};

const S = (n: string) => `sfx/blocs/${n}.wav`;

export function sonsMinuit(recit: RecitBlocs, m: Minutage, plans: PlanMinute<PlanDef>[]): Son[] {
  const mot = (scene: number, k: number) => tempsMot(recit, m, scene, k);
  const plan = (id: string) => plans.find((p) => p.def.id === id);
  const sons: Son[] = [];
  const fin = plans[plans.length - 1].fin;
  // vent : toute la nuit, coupé net quand la fenêtre devient noire (silence voulu), léger à l'aube
  const noir = mot(7, 8);
  const aube = plan("s09p1")?.debut ?? noir + 2;
  sons.push({ src: S("vent"), t: 0, volume: 0.09, duree: noir, boucle: true, enveloppe: [[0, 0], [0.8, 1], [Math.max(1, noir - 0.05), 1], [noir, 0]] });
  sons.push({ src: S("vent"), t: aube, volume: 0.05, duree: fin - aube, boucle: true, enveloppe: [[0, 0], [1, 1], [fin - aube - 1, 1], [fin - aube, 0]] });
  // minuit (scène 2 et dernière nuit) : tic-tac puis top
  for (const [id, scene, k] of [["s02p1", 1, 3], ["s10p7", 9, 36]] as Array<[string, number, number]>) {
    const p = plan(id);
    if (!p) continue;
    const top = id === "s02p1" ? p.debut + Math.min((p.fin - p.debut) * 0.78, Math.max((p.fin - p.debut) * 0.5, mot(scene, k) - p.debut)) : p.debut + Math.min(p.fin - p.debut - 0.6, Math.max(0.5, mot(scene, k) - p.debut));
    for (let i = 1; i <= 5; i++) if (top - i * 0.17 > p.debut) sons.push({ src: S("tic"), t: top - i * 0.17, volume: 0.22, duree: 0.2 });
    sons.push({ src: S("toc"), t: top, volume: 0.35, duree: 0.5 });
  }
  sons.push({ src: S("interrupteur"), t: mot(6, 5), volume: 0.5, duree: 0.4 });
  sons.push({ src: S("souffle"), t: mot(7, 5) - 0.05, volume: 0.3, duree: 0.6 });
  const p92 = plan("s09p2");
  if (p92) {
    sons.push({ src: S("pas"), t: p92.debut, volume: 0.18, duree: Math.max(0.3, Math.min(1.4, mot(8, 6) - 0.12 - p92.debut)) });
    sons.push({ src: S("coups"), t: Math.max(p92.debut + 0.5, mot(8, 6) - 0.12) + 0.2, volume: 0.5, duree: 1.2 });
  }
  const p103 = plan("s10p3");
  if (p103) sons.push({ src: S("papier"), t: p103.debut + 0.1, volume: 0.3, duree: 0.8 });
  // piano : seulement après la découverte de l'enveloppe, puis une reprise sur la question finale
  const p105 = plan("s10p5");
  if (p105) sons.push({ src: S("piano"), t: p105.debut, volume: 0.14, duree: 10.5 });
  const p109 = plan("s10p9");
  if (p109) sons.push({ src: S("piano"), t: Math.max(p109.debut, (p105?.debut ?? 0) + 9.5), volume: 0.14, duree: Math.max(1, fin - p109.debut) });
  return sons.filter((s) => s.t >= 0 && (s.duree ?? 1) > 0.05);
}
