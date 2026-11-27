/**
 * « Dans cette ville, tout le monde s'appelle Alex… » — personnages (habitants) et événements calés sur les mots.
 * Repères [scène, mot] : voir histoires/recits/prenom-unique.json (scène 1 = indice 0).
 * Tous les « Alex » portent EXACTEMENT le même t-shirt jaune (seuls les cheveux et la taille varient un peu) ;
 * Noé est le seul en bleu, roux et en bataille ; le maire, le professeur, la boulangère et la maîtresse sont reconnaissables
 * mais gardent l'étiquette « ALEX ».
 */
import type { V3 } from "../../geo";
import type { Tenue } from "../../avatar";
import { type Etape, type Habitant, type Mode, duree } from "../../ville/foule";
import { BOUL, MAIRIE_Z, NUIT, SOUS, caseFormation } from "./monde";

type Mot = (s: number, k: number) => number;

// ------------------------------------------------------------------ Tenues
const JAUNE = "#FFC81E";
const PANTALON = "#34415E";
const BASKET = "#F4F4F0";
const CHEV = ["#3A2A1E", "#D8B25A", "#1F1F24", "#7A4E2D"];
const PEAU = ["#E6B98F", "#D9AE8B"];
export const tenueAlex = (i: number): Tenue => ({ genre: "figurant", peau: PEAU[i % 2], haut: JAUNE, bas: PANTALON, chaussures: BASKET, cheveux: CHEV[i % 4] });
export const echelleAlex = (i: number) => 0.97 + (i % 3) * 0.03;
export const T_NOE: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#2F6BFF", bas: PANTALON, chaussures: BASKET, cheveux: "#D4561C" };
export const T_MAIRE: Tenue = { genre: "figurant", peau: "#DDB08A", haut: "#6A6E78", bas: "#4A4D56", chaussures: "#1A1A1F", cheveux: "#9A9A9A", lunettes: "#B8C4D8" };
export const T_PROF: Tenue = { genre: "figurant", peau: "#D9AE8B", haut: "#8A5A33", bas: "#4B3A2A", chaussures: "#2A2A30", cheveux: "#8A8A8A", lunettes: "#CFCFD6" };
export const T_BOULANGERE: Tenue = { genre: "figurant", peau: "#E6B98F", haut: JAUNE, bas: PANTALON, chaussures: BASKET, cheveux: "#6B3F22", longs: "#6B3F22", tablier: "#FFFFFF", bandeau: "#FFFFFF" };
export const T_MAITRESSE: Tenue = { genre: "figurant", peau: "#E3B58C", haut: JAUNE, bas: "#6E4BA0", chaussures: "#2A2A30", cheveux: "#4A2E1E", longs: "#4A2E1E", robe: "#6E4BA0" };

/** Étiquette portée par un personnage (selon son identifiant). */
export const nomDe = (id: string) => (id.startsWith("noe") ? "NOÉ" : "ALEX");

// ------------------------------------------------------------------ Événements
export function evenements(mot: Mot): Record<string, number> {
  return {
    cri: mot(1, 4) - 0.05, // « Alex ! »
    tourne: mot(1, 8) - 0.14, // les trente têtes se tournent d'un bloc
    noeTourne: mot(1, 11) - 0.05, // Noé se retourne et regarde les visages
    noeChercheA: mot(2, 15) - 0.15, // Noé se retourne pour chercher les absents
    noeChercheB: mot(2, 19) + 0.9,
    retour: mot(1, 16) - 0.1, // la classe se remet face au tableau
    compte0: mot(1, 28) - 0.08, // le compteur démarre sur « cent »
    compte1: mot(1, 30) + 0.12, // ... et s'arrête sur 144
    mardi: mot(2, 0) - 0.1,
    jeudi: mot(2, 6) - 0.1,
    voisinDisp: mot(2, 5) - 0.05,
    maitDisp: mot(2, 9),
    maireDoor: mot(3, 6) - 0.28, // le maire pousse la porte de la mairie
    reveil: mot(3, 27) + 0.02, // le sosie ouvre les yeux
    surprend: mot(4, 3), // le maire surgit
    plaque: mot(4, 28) - 0.04, // la plaque s'allume : « NOÉ »
    visage: mot(5, 7) - 0.06, // « visage »
    mains: mot(5, 8),
    copie0: mot(5, 16) - 0.04, // Noé fait de nouveau face à la vitre
    givre0: mot(5, 0) + 0.4, // le givre de la vitre se dissipe : « Dedans, un garçon dormait »
    givre1: mot(5, 2) + 0.2,
    prenom: mot(5, 12),
    copie: mot(5, 18),
  };
}

// ------------------------------------------------------------------ Aides
const dep = (id: string, tenue: Tenue, graine: number, etapes: Etape[], extra: Partial<Habitant> = {}): Habitant => ({ id, tenue, graine, etapes, ...extra });
const point = (t: number, p: V3, mode: Mode = "debout", extra: Partial<Etape> = {}): Etape => ({ t, p, mode, ...extra });
const add = (o: V3, p: V3): V3 => [o[0] + p[0], o[1] + p[1], o[2] + p[2]];

/** Ligne brisée à vitesse constante. */
function chemin(id: string, tenue: Tenue, graine: number, t0: number, v: number, pts: V3[], mode: Mode, modeFin: Mode, extra: Partial<Habitant> = {}, ryFin?: number, emotion?: Etape["emotion"]): Habitant {
  const etapes: Etape[] = [{ t: t0, p: pts[0], mode, emotion }];
  let t = t0;
  for (let i = 1; i < pts.length; i++) {
    t += duree(pts[i - 1], pts[i], v);
    etapes.push({ t, p: pts[i], mode: i === pts.length - 1 ? modeFin : mode, emotion, ry: i === pts.length - 1 ? ryFin : undefined });
  }
  return { id, tenue, etapes, graine, ...extra };
}

export const LANES = [-7.7, -5.8, -3.9, -2.0, 2.0, 3.9, 5.8, 7.7];
export const RANGEES = 19;

export function habitants(mot: Mot): Habitant[] {
  const ev = evenements(mot);
  const out: Habitant[] = [];

  // ---------------- VILLE, JOUR (scène 1) : la foule des Alex en marche, tous en phase (même pas, même vitesse)
  let n = 0;
  for (let r = 0; r < RANGEES; r++) {
    for (const x of LANES) {
      const i = n++;
      const z0 = 34 - r * 6;
      out.push(dep(`m${i}`, tenueAlex(i), 0, [point(-2, [x, 0, z0 - 6], "marche", { emotion: "neutre" }), point(18, [x, 0, z0 + 54], "marche", { emotion: "neutre" })], { echelle: echelleAlex(i), sansClin: true }));
    }
  }
  // Noé, immobile dans l'allée centrale, tout seul en bleu
  out.push(dep("noeV", T_NOE, 0.3, [point(-1, [0, 0, -24], "debout", { ry: 0, emotion: "neutre" }), point(7.2, [0, 0, -24], "debout", { ry: 0, emotion: "inquiet" })], { echelle: 0.9 }));
  // le maire (sur le perron de la mairie), la boulangère (devant sa boutique)
  out.push(dep("maireV", T_MAIRE, 1.1, [point(-1, [0, 1.6, MAIRIE_Z + 3.4], "debout", { ry: 0, emotion: "neutre" })], { echelle: 1.08, sansClin: false }));
  out.push(dep("boulV", T_BOULANGERE, 2.1, [point(-1, [BOUL.x - 4.0, 0.14, BOUL.z + 3.6], "debout", { ry: -Math.PI / 2, emotion: "neutre" })], { echelle: 1.0 }));

  // ---------------- PLACE : cent quarante-quatre Alex rangés en carré (scène 2) ; Noé, à l'écart, regarde
  const FORM = 15;
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      const k = i * 12 + j;
      out.push(dep(`f${k}`, tenueAlex(k), 0, [point(FORM, caseFormation(i, j), "debout", { ry: Math.PI, emotion: "vide" })], { echelle: echelleAlex(k), sansClin: true }));
    }
  }
  out.push(dep("noeP", T_NOE, 0.9, [point(FORM, [-21, 0, -83], "debout", { ry: 0.6, emotion: "inquiet" })], { echelle: 0.9 }));

  // ---------------- NUIT (scène 4) : le maire entre à la mairie, Noé le suit à distance
  const porteN = add(NUIT, [0, 1.6, MAIRIE_Z + 0.9]);
  const tArr = ev.maireDoor + 0.3;
  const trajet: V3[] = [add(NUIT, [0, 0, MAIRIE_Z + 18]), add(NUIT, [0, 0, MAIRIE_Z + 8.6]), add(NUIT, [0, 1.6, MAIRIE_Z + 3.4]), porteN];
  const dTot = trajet.slice(1).reduce((s, p, i) => s + duree(trajet[i], p, 3.1), 0);
  out.push(chemin("maireN", T_MAIRE, 1.7, tArr - dTot, 3.1, trajet, "marche", "marche", { echelle: 1.08 }));
  const dN: V3[] = [add(NUIT, [3.2, 0, MAIRIE_Z + 31]), add(NUIT, [1.6, 0, MAIRIE_Z + 19]), add(NUIT, [0.4, 0, MAIRIE_Z + 13.2])];
  const dTotN = dN.slice(1).reduce((s, p, i) => s + duree(dN[i], p, 3.1), 0);
  out.push(chemin("noeN", T_NOE, 0.6, tArr + 0.2 - dTotN, 3.1, dN, "marche", "cache", { echelle: 0.9 }, 0, "inquiet"));

  // ---------------- SOUS-SOL : escalier (le maire descend, Noé le suit), puis Noé devant les cabines
  const H = (x: number, y: number, z: number): V3 => add(SOUS, [x, y, z]);
  const tM = ev.maireDoor + 0.2;
  out.push(
    dep("maireSS", T_MAIRE, 1.9, [
      point(tM, H(1.4, 3.6, 15.0), "marche"),
      point(tM + duree(H(0, 0, 15.0), H(0, 0, 12.5), 2.8), H(1.4, 3.6, 12.5), "marche"),
      point(tM + duree(H(0, 0, 15.0), H(0, 0, 12.5), 2.8) + 3.0, H(1.4, 0.0, 4.4), "marche"),
      point(tM + duree(H(0, 0, 15.0), H(0, 0, 12.5), 2.8) + 3.0 + duree(H(0, 0, 4.4), H(0, 0, -9), 3.1), H(0, 0, -9), "debout", { ry: Math.PI, emotion: "neutre" }),
    ], { echelle: 1.08 }),
  );
  out.push(
    dep("noeSS", T_NOE, 0.8, [
      point(tM + 0.7, H(2.2, 3.6, 21.0), "marche", { emotion: "inquiet" }),
      point(tM + 0.7 + duree(H(0, 0, 21), H(0, 0, 16.5), 2.8), H(2.6, 3.6, 16.5), "cache", { ry: Math.PI, emotion: "effraye" }),
    ], { echelle: 0.9 }),
  );
  // Noé devant la cabine du voisin (dès « Dans l'une, mon voisin dormait »)
  out.push(dep("noeCab", T_NOE, 0.2, [point(mot(4, 0) - 0.2, H(-1.6, 0, -35.0), "debout", { ry: -Math.PI / 2, emotion: "effraye" })], { echelle: 0.9 }));
  // le maire revient dans l'allée, derrière Noé
  out.push(
    dep("maire2", T_MAIRE, 2.7, [
      point(ev.surprend - 3.4, H(0.4, 0, -22), "marche", { emotion: "neutre" }),
      point(ev.surprend + 0.0, H(0.6, 0, -31.2), "debout", { ry: Math.PI, emotion: "colere" }),
      point(ev.surprend + 4.0, H(0.6, 0, -31.2), "debout", { ry: Math.PI, emotion: "neutre" }),
    ], { echelle: 1.08 }),
  );
  // le maire et Noé au bout de l'allée (Noé regarde la dernière cabine)
  out.push(dep("noeFond", T_NOE, 0.4, [point(mot(5, 0) - 0.2, H(-1.2, 0.55, -100.6), "debout", { ry: Math.PI, emotion: "inquiet" }), point(mot(5, 4), H(-1.2, 0.55, -100.6), "debout", { ry: Math.PI, emotion: "effraye" }), point(mot(5, 8), H(-1.2, 0.55, -100.6), "debout", { ry: Math.PI, emotion: "effraye" })], { echelle: 0.9 }));
  return out;
}
export { MAIRIE_Z };
