/**
 * Épisode « huss-001 » — « Dans cette ville, tout le monde sort faire la fête… sauf moi » (récit : histoires/recits/huss-001.json).
 * Les repères [scène, mot] renvoient au texte du récit ; si le texte change, on adapte ces repères et les plans.
 */
import type { V3 } from "../../../geo";
import { versMonde } from "../../../geo";
import type { EpisodeVille } from "../../episode";
import { type Habitant, duree } from "../../foule";
import { marcheur } from "../../donnees";
import { DEPART, MAISONS, RUE, feteMonde } from "../../lieux";
import { TENUE_BOULANGER, TENUE_FACTEUR, TENUE_MAIRE, TENUE_POLICIER, fetard } from "../../tenues";
import { PLANS } from "./plans";

const VOISIN_A = fetard(0);
const VOISIN_B = fetard(1);
const VOISIN_C = fetard(2);

function secondaires(mot: (s: number, k: number) => number, _beat0: number): Habitant[] {
  const out: Habitant[] = [];

  // --- le maire, sur la piste de danse : chapeau pointu (scène 7, « Même le maire… »)
  out.push({ id: "maire", tenue: TENUE_MAIRE, graine: 0.3, variante: 1, etapes: [{ t: -1000, p: feteMonde([-1.6, 0, 6.2]), mode: "danse", ry: 0.4 }] });

  // --- le facteur (scène 2, mot 13) : il longe le trottoir droit avec son courrier
  const tF = mot(1, 13);
  const a: V3 = [4.0, 0, 26];
  const z1: V3 = [4.0, 0, -52];
  const dest: V3 = feteMonde([3.5, 0, 9]);
  out.push({
    id: "facteur",
    tenue: TENUE_FACTEUR,
    graine: 1.1,
    courrier: true,
    etapes: [
      { t: tF - 7, p: a, mode: "marche" },
      { t: tF - 7 + duree(a, z1, 2.9), p: z1, mode: "marche" },
      { t: tF - 7 + duree(a, z1, 2.9) + duree(z1, dest, 2.9), p: dest, mode: "danse" },
    ],
  });

  // --- les trois voisins (scène 5) : le premier s'arrête au bord du terrain pour crier à son voisin
  const tCri = mot(4, 8) - 0.35;
  const arret: V3 = [-5.7, 0, DEPART[2]];
  const depV0: V3 = [-4.5, 0, 24];
  const tDepV = tCri - duree(depV0, arret, 2.9);
  const partV0 = mot(5, 10);
  const route: V3 = [-4.6, 0, -50];
  const dV0 = feteMonde([-4, 0, 14]);
  out.push({
    id: "voisin0",
    tenue: VOISIN_A,
    graine: 0.2,
    etapes: [
      { t: tDepV - 1.2, p: depV0, mode: "fete" },
      { t: tCri, p: arret, mode: "fete" },
      { t: tCri + 0.3, p: arret, mode: "appel", ry: -Math.PI / 2 },
      { t: mot(4, 14), p: arret, mode: "invite", ry: -Math.PI / 2 },
      { t: mot(4, 22) - 0.2, p: arret, mode: "hausse", ry: -Math.PI / 2 },
      { t: partV0, p: arret, mode: "hausse", ry: -Math.PI / 2 },
      { t: partV0 + duree(arret, route, 3.3), p: route, mode: "fete" },
      { t: partV0 + duree(arret, route, 3.3) + duree(route, dV0, 3.3), p: dV0, mode: "danse" },
    ],
  });
  [VOISIN_B, VOISIN_C].forEach((tn, j) => {
    const dep: V3 = [-3.6 - j * 1.1, 0, 30 + j * 2.4];
    const fin: V3 = [-4.2 + j * 0.9, 0, -50];
    out.push(marcheur(`voisin${j + 1}`, tn, 3 + j, dep, tCri - 3.2 + j * 0.9, 2.9, "fete", feteMonde([-7 + j * 14, 0, 17]), [fin]));
  });

  // --- boulanger et policier (scène 7) : ils sortent de leur maison en dansant
  const porte = (i: number): V3 => versMonde(MAISONS[i].p, MAISONS[i].ry, [MAISONS[i].porteX, 0, 3.1]);
  const pB = porte(3);
  out.push(marcheur("boulanger", TENUE_BOULANGER, 2.1, pB, mot(6, 0) - 0.4, 3.0, "fete", feteMonde([4.5, 0, 8]), [[RUE.trottoirD - 1.0, 0, pB[2]], [RUE.trottoirD - 1.0, 0, -54]]));
  const pP = porte(8);
  out.push(marcheur("policier", TENUE_POLICIER, 2.6, pP, mot(6, 9) - 0.6, 3.0, "fete", feteMonde([-4.5, 0, 8]), [[RUE.trottoirG + 1.0, 0, pP[2]], [RUE.trottoirG + 1.0, 0, -54]]));
  return out;
}

export const EPISODE: EpisodeVille = {
  id: "huss-001",
  plans: PLANS,
  tir: { dernierHuss: [10, 8], lache: [10, 10], panier: [10, 11] },
  musique: {
    rebondsDe: [7, 6],
    ancre: [8, 0],
    // la fête est lointaine, monte avec « La ville » (scène 7), éclate sur « La basse » (scènes 8 et 9), puis s'éloigne
    niveaux: [[[6, 0], 0.55], [[7, 0], 1.0], [[8, 0], 1.0], [[9, 0], 0.7]],
  },
  regards: {
    fete: [[[1, 5], [1, 13]], [[6, 0], [6, 16]], [[9, 0], [9, 8]], [[11, 0], [11, 3]]],
    rue: [[4, 7], [5, 10]],
  },
  secondaires,
};
