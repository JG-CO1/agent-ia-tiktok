/**
 * Données de la mise en scène « ville », calculées une fois par rendu à partir du minutage de la voix :
 * instants des rebonds (calés sur les HUSS), du tir et du panier, grille de la musique de fête, habitants.
 * Si on change le texte ou la voix, tout se recale seul. Ce qui dépend du texte vient de l'épisode (episode.ts).
 */
import { tempsMot, type Minutage, type RecitBlocs } from "../decoupage";
import type { V3 } from "../geo";
import { versMonde } from "../geo";
import { BALLE_LOCALE, remplirImpacts, trajetPanier } from "./anim";
import { type Acteur, type Habitant, type Etape, evaluer, duree } from "./foule";
import type { EpisodeVille } from "./episode";
import { fetard } from "./tenues";
import { DEPART, PANIER_A, PERIODE, RUE, RY_VERS_A, feteMonde } from "./lieux";

export type TirData = {
  /** début de la prise de balle (le ballon monte à la main) */
  prise: number;
  /** début de la flexion du tir */
  debut: number;
  /** durée du geste (k = 0 → 1) */
  duree: number;
  lache: number;
  panier: number;
  trajet: ReturnType<typeof trajetPanier>;
  /** dernier impact avant la prise de balle */
  dernierImpact: number;
  /** instant où le ballon, revenu au joueur, reprend son dribble */
  retour: number;
  depart: V3;
};

export type DonneesVille = {
  ep: EpisodeVille;
  mot: (scene: number, k: number) => number;
  /** début de chaque « HUSS » prononcé */
  huss: number[];
  /** impacts du ballon au sol : avant le tir, puis après son retour (rien pendant le tir) */
  impacts: { avant: number[]; apres: number[] };
  tir: TirData;
  beat0: number;
  habitants: Habitant[];
  acteur: (id: string, T: number) => Acteur | null;
  fin: number;
};

/** Le ballon dans la main droite du joueur à `yBalle`, en repère monde. */
export function balleMain(p: V3, ry: number, y: number): V3 {
  return versMonde([p[0], 0, p[2]], ry, [BALLE_LOCALE.x, y, BALLE_LOCALE.z]);
}

// ------------------------------------------------------------------ Foule de la ville (indépendante du texte)
const cote = (i: number) => (i % 2 ? 1 : -1);

/** Un marcheur : va de `depart` à `arrivee` en passant par `relais`, puis danse. */
export function marcheur(id: string, tenue: Habitant["tenue"], graine: number, depart: V3, tDepart: number, v: number, mode: "marche" | "fete", arrivee: V3, relais: V3[] = []): Habitant {
  const etapes: Etape[] = [];
  let t = tDepart;
  let p = depart;
  etapes.push({ t, p, mode });
  for (const r of [...relais, arrivee]) {
    t += duree(p, r, v);
    etapes.push({ t, p: r, mode });
    p = r;
  }
  etapes[etapes.length - 1] = { ...etapes[etapes.length - 1], mode: "danse" };
  return { id, tenue, etapes, graine };
}

/** Places de danse devant la maison de fête (repère local de la fête), où les arrivants s'installent. */
const PLACES: Array<[number, number]> = [[-13, 15], [13, 15], [-5.5, 19], [5.5, 19], [-9, 22], [9, 22], [0, 24], [-15, 10], [15, 10], [-2.5, 15], [2.5, 12.5], [-11, 18], [11, 18], [-7, 12.5], [7, 12.5]];

function foule(): Habitant[] {
  const out: Habitant[] = [];
  // les fêtards déjà sur la pelouse de la maison de fête
  const sur: Array<[number, number]> = [[-8, 6], [-5, 9.5], [-2.8, 5], [2.8, 6.5], [5.2, 9], [8.4, 5.5], [-10.5, 11], [-6.5, 13.5], [0.5, 11.5], [6.8, 13.2], [10.5, 10], [-3.2, 16], [3.6, 16.5], [-12.5, 5], [12.5, 6]];
  sur.forEach(([x, z], i) => {
    const p = feteMonde([x, 0, z]);
    out.push({ id: `fetard${i}`, tenue: fetard(i + 2), graine: i * 1.7, variante: i, etapes: [{ t: -1000, p, mode: "danse", ry: Math.atan2(-x * 0.4, -3) + Math.PI + (i % 3) * 0.2 }] });
  });
  // habitants qui marchent vers la fête (arrivée progressive : ils prennent les places de danse)
  for (let i = 0; i < 16; i++) {
    const x = cote(i) * (RUE.trottoirD - 0.7 - (i % 3) * 0.4);
    const v = 2.7 + ((i * 37) % 9) / 10;
    const [px, pz] = PLACES[i % PLACES.length];
    out.push(marcheur(`marcheur${i}`, fetard(i + 3, i % 4 !== 3), i * 2.3 + 0.5, [x, 0, 66], -32 + i * 3.6, v, i % 3 === 0 ? "marche" : "fete", feteMonde([px, 0, pz]), [[x * 0.8, 0, -58]]));
  }
  return out;
}

/** Instants (début) des mots « HUSS » du minutage. */
function trouverHuss(m: Minutage): number[] {
  return m.mots.filter((w) => /^huss[!.,]*$/i.test(w.texte.trim())).map((w) => w.debut);
}

export function preparerVille(recit: RecitBlocs, m: Minutage, ep: EpisodeVille): DonneesVille {
  const mot = (s: number, k: number) => tempsMot(recit, m, s, k);
  const rep = (r: [number, number]) => mot(r[0], r[1]);
  const huss = trouverHuss(m);
  const fin = Math.max(m.duree, 61.5);

  // --- le tir : dernier HUSS, « Et… » (lâcher), « panier »
  const ECART_IMPACT = 0.1; // le ballon touche le sol ~0,1 s après le début du souffle
  const panier = rep(ep.tir.panier) + 0.04;
  const lacheVoulu = rep(ep.tir.lache) + 0.18;
  const vol = Math.min(1.5, Math.max(0.85, panier - lacheVoulu));
  const lache = panier - vol;
  const dernierImpact = rep(ep.tir.dernierHuss) + ECART_IMPACT; // le dernier rebond avant le tir
  const duree = 1.55;
  const debut = Math.max(dernierImpact + 0.32, lache - 0.62 * duree);
  const departPos: V3 = [DEPART[0], 0.55 + 4.0, DEPART[2] - 0.45];
  const retourPos = balleMain(DEPART, RY_VERS_A, 0.3);
  const trajet = trajetPanier(departPos, PANIER_A, vol, retourPos, 3);
  const retour = lache + trajet.sols[trajet.sols.length - 1];

  // --- grille de la musique : un temps tombe sur l'ancre, les rebonds s'y calent depuis `rebondsDe`
  const beat0 = rep(ep.musique.ancre) + ECART_IMPACT;
  const nBeats = Math.max(0, Math.floor((beat0 - rep(ep.musique.rebondsDe)) / PERIODE));
  const grille: number[] = [];
  for (let k = nBeats; k >= 0; k--) grille.push(beat0 - k * PERIODE);

  // --- impacts du dribble : avant le tir (ancres = HUSS + grille de la musique), puis après le retour du ballon
  const ancresAvant = [...huss.map((t) => t + ECART_IMPACT), ...grille].filter((t) => t < dernierImpact - 0.2);
  const avant = remplirImpacts(ancresAvant.concat([dernierImpact]), 0, dernierImpact);
  const ancresApres = huss.filter((t) => t > retour + 0.4).map((t) => t + ECART_IMPACT);
  const apres = remplirImpacts(ancresApres, retour, Math.max(fin + 1, (ancresApres[ancresApres.length - 1] ?? retour) + 1.5));

  const habitants = [...foule(), ...ep.secondaires(mot, beat0)];
  const index = new Map(habitants.map((h) => [h.id, h]));
  return {
    ep,
    mot,
    huss,
    impacts: { avant, apres },
    tir: { prise: dernierImpact, debut, duree, lache, panier, trajet, dernierImpact, retour, depart: departPos },
    beat0,
    habitants,
    acteur: (id, T) => {
      const h = index.get(id);
      return h ? evaluer(h, T, beat0) : null;
    },
    fin,
  };
}
