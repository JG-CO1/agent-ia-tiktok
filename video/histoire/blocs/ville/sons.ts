/**
 * Habillage sonore de « huss » : rebonds de ballon calés sur les impacts, souffle synthétique sous chaque HUSS,
 * filet au panier, crissement et atterrissage du tir, murmure de foule, vent, musique de fête lointaine dont les
 * temps tombent sur ceux de la danse (et du ballon pendant « La basse »). La musique baisse sous les HUSS.
 */
import type { Minutage, PlanMinute, RecitBlocs } from "../decoupage";
import type { Son } from "../minuit/sons";
import type { PlanGen } from "../types";
import type { DonneesVille } from "./donnees";
import { PERIODE } from "./lieux";

const S = (n: string) => `sfx/ville/${n}.wav`;

export function sonsVille(_recit: RecitBlocs, m: Minutage, _plans: PlanMinute<PlanGen>[], d: DonneesVille): Son[] {
  const sons: Son[] = [];
  const fin = Math.max(m.duree, 61.5);

  // --- rebonds du ballon
  for (const t of [...d.impacts.avant, ...d.impacts.apres]) sons.push({ src: S("rebond"), t: Math.max(0, t - 0.012), volume: 0.5, duree: 0.45 });
  d.tir.trajet.sols.forEach((s, i) => sons.push({ src: S("rebond"), t: d.tir.lache + s - 0.012, volume: 0.42 - i * 0.1, duree: 0.45 }));

  // --- le tir : crissement à la flexion, atterrissage, filet
  sons.push({ src: S("crissement"), t: d.tir.debut + 0.05, volume: 0.22, duree: 0.45 });
  sons.push({ src: S("atterrissage"), t: d.tir.debut + d.tir.duree * 0.93, volume: 0.3, duree: 0.35 });
  sons.push({ src: S("filet"), t: d.tir.panier - 0.03, volume: 0.5, duree: 0.55 });

  // --- souffle sous chaque HUSS (la voix reste au premier plan)
  for (const t of d.huss) sons.push({ src: S("huss"), t: Math.max(0, t - 0.02), volume: 0.2, duree: 0.36 });

  // --- ambiances : foule lointaine et vent de nuit, sur toute la durée
  sons.push({ src: S("foule"), t: 0, volume: 0.1, duree: fin, boucle: true, enveloppe: [[0, 0], [1, 1], [fin - 1.5, 1], [fin, 0]] });
  sons.push({ src: "sfx/blocs/vent.wav", t: 0, volume: 0.05, duree: fin, boucle: true, enveloppe: [[0, 0], [1, 1], [fin - 1.5, 1], [fin, 0]] });

  // --- musique de fête : début décalé pour que ses temps tombent sur la grille (beat0 + k × PERIODE)
  const debut = d.beat0 - Math.floor(d.beat0 / PERIODE) * PERIODE;
  // niveau relatif de la musique : points [repère du texte, volume] de l'épisode, interpolés linéairement
  const pts = d.ep.musique.niveaux.map(([r, v]) => [d.mot(r[0], r[1]), v] as [number, number]);
  const niveau = (t: number) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * (t - pts[i - 1][0])) / Math.max(1e-6, pts[i][0] - pts[i - 1][0]);
    return pts[pts.length - 1][1];
  };
  const baisse = (t: number) => {
    let f = 1;
    for (const h of d.huss) {
      const k = t < h - 0.15 ? 1 : t < h + 0.05 ? 1 - (0.65 * (t - (h - 0.15))) / 0.2 : t < h + 0.55 ? 0.35 : t < h + 0.8 ? 0.35 + (0.65 * (t - (h + 0.55))) / 0.25 : 1;
      f = Math.min(f, k);
    }
    return f;
  };
  const longueur = fin - debut;
  const env: Array<[number, number]> = [];
  for (let t = 0; t <= longueur; t += 0.1) {
    const T = t + debut;
    env.push([t, niveau(T) * baisse(T) * Math.min(1, T / 1.2, (fin - T) / 1.5)]);
  }
  sons.push({ src: S("fete"), t: debut, volume: 0.36, duree: longueur, boucle: true, enveloppe: env });

  return sons.filter((s) => s.t >= 0 && (s.duree ?? 1) > 0.05);
}
