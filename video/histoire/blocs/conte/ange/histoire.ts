/**
 * « J'étais l'ange gardien de ma petite sœur… » — personnages et événements, tous calés sur les mots du récit.
 * Repères [scène, mot] : histoires/recits/ange-gardien.json (scène 1 = indice 0) ; index : scripts/mots.ts ange-gardien.
 *
 * Lieux : RUE (sauvetage du piéton, chemin de l'école), CHAMBRE d'Emma, GARE (passage à niveau, quai et banc).
 * Le narrateur (grand frère, mort) est un fantôme : translucide, invisible des vivants sauf d'Emma.
 */
import type { V3 } from "../../geo";
import type { Tenue } from "../../avatar";
import { type Etape, type Habitant, type Mode, duree } from "../../ville/foule";
import { CH, GZ, X_TROTTOIR, Z_MAISON_EMMA, Z_PIETON, BANC } from "./monde";

type Mot = (s: number, k: number) => number;

// ------------------------------------------------------------------ Tenues
export const T_EMMA: Tenue = { genre: "figurant", peau: "#F2CBA4", haut: "#F4A6B8", bas: "#FBEFE4", chaussures: "#B5523C", cheveux: "#8A5230", longs: "#8A5230", robe: "#F4A6B8", bandeau: "#F2C230" };
export const T_FRERE: Tenue = { genre: "figurant", peau: "#F0CDB0", haut: "#6F9CF2", bas: "#4F6FC2", chaussures: "#F2F2F2", cheveux: "#3A3A4A" };
export const T_MAMAN: Tenue = { genre: "figurant", peau: "#E3B58C", haut: "#D9776A", bas: "#4B5A7A", chaussures: "#3A2E2A", cheveux: "#5A3A22", longs: "#5A3A22", robe: "#D9776A" };
export const T_PIETON: Tenue = { genre: "figurant", peau: "#D9AE8B", haut: "#3F7A6A", bas: "#3A3F52", chaussures: "#2A2A30", cheveux: "#2A2A2A", sac: "#C9453B" };
const PEAU = ["#E6B98F", "#C99873", "#D9AE8B", "#B58463", "#F0C8A0"];
const CHEV = ["#3A2A1E", "#C9A15A", "#252525", "#7A3B22", "#9A9A9A"];
const HAUT = ["#E0B04A", "#6CB07A", "#C9786A", "#7A8EC9", "#B58AC9", "#E8E0C8"];
const BAS = ["#4A5A7A", "#6A5A4A", "#3F4A58", "#7A6A5A"];
const passant = (i: number): Tenue => ({ genre: "figurant", peau: PEAU[i % 5], haut: HAUT[i % 6], bas: BAS[i % 4], chaussures: "#2A2A30", cheveux: CHEV[(i * 3) % 5], ...(i % 3 === 0 ? { casquette: "#C9453B" } : {}), ...(i % 4 === 1 ? { robe: HAUT[i % 6], longs: CHEV[(i * 3) % 5] } : {}) });

/** Habitant qui suit une ligne brisée à vitesse constante. */
function chemin(id: string, tenue: Tenue, graine: number, t0: number, v: number, pts: V3[], mode: Mode, extra: Partial<Habitant> = {}, emotion?: Etape["emotion"], modeFin: Mode = mode): Habitant {
  const etapes: Etape[] = [];
  let t = t0;
  etapes.push({ t, p: pts[0], mode, emotion });
  for (let i = 1; i < pts.length; i++) {
    t += duree(pts[i - 1], pts[i], v);
    etapes.push({ t, p: pts[i], mode: i === pts.length - 1 ? modeFin : mode, emotion });
  }
  return { id, tenue, etapes, graine, ...extra };
}

export const VIT_TRAIN = 26; // u/s
export const L_TRAIN = 38;

export function evenements(mot: Mot): Record<string, number> {
  const sauve = mot(0, 20); // « dorée » : flash du sauvetage
  const flashG = mot(3, 26); // « dorée » : flash à la gare
  return {
    sauve,
    plumeTombe: sauve + 0.35,
    pose: mot(1, 14), // le bocal est posé sur la table de chevet
    silhouette: mot(1, 22), // la silhouette lumineuse derrière Emma
    barr: mot(3, 13) + 0.1, // les barrières commencent à descendre
    flashG,
    train1: flashG + 0.36, // l'avant du train atteint le passage à niveau
    barrUp: mot(4, 5) + 0.3, // les barrières se relèvent
    murmure: mot(4, 22),
    revele: mot(4, 22), // la caméra révèle le fantôme
    flashback: mot(5, 0) - 0.06,
    train2: mot(5, 11) + 0.45, // flash blanc : le train frappe (flashback)
    ange: mot(5, 29), // « ange » : auréole et ailes
    depose: mot(5, 35) - 0.1, // la plume descend vers le bocal
    couvercle: mot(5, 38), // « plume » : le couvercle se pose
    ecrit: mot(5, 39) - 0.05, // l'écriture « Mon frère »
    disparait: mot(5, 41) + 0.1, // le frère disparaît dans la lumière
  };
}

export function habitants(mot: Mot): Habitant[] {
  const ev = evenements(mot);
  const out: Habitant[] = [];
  const [X] = CH;
  const SOL_T = 0.1;
  const SOL_R = 0.03;

  // ======================================================= RUE — scène 1 : le sauvetage
  // le piéton traverse en regardant ailleurs ; la voiture arrive ; la lumière dorée le met sur le trottoir
  const tPieton = ev.sauve - 3.7;
  out.push({
    id: "pieton",
    tenue: T_PIETON,
    graine: 1.3,
    echelle: 1.0,
    etapes: [
      { t: -1, p: [-5.65, SOL_T, Z_PIETON], mode: "debout", ry: Math.PI / 2, emotion: "neutre" },
      { t: tPieton, p: [-5.65, SOL_T, Z_PIETON], mode: "marche", emotion: "neutre" },
      { t: ev.sauve - 0.95, p: [1.0, SOL_R, Z_PIETON], mode: "debout", ry: 0, emotion: "effraye" },
      { t: ev.sauve + 0.1, p: [1.0, SOL_R, Z_PIETON], mode: "debout", ry: 0, emotion: "effraye" },
      { t: ev.sauve + 0.14, p: [6.3, SOL_T, Z_PIETON + 0.9], mode: "debout", ry: -Math.PI / 2 - 0.35, emotion: "surpris" },
      { t: ev.sauve + 2.3, p: [6.3, SOL_T, Z_PIETON + 0.9], mode: "debout", ry: -Math.PI / 2 - 0.35, emotion: "apaise" },
    ],
  });
  // les passants (la rue est vivante) : deux témoins de la scène, puis des promeneurs
  out.push({ id: "temoin1", tenue: passant(2), graine: 2.2, echelle: 0.95, etapes: [{ t: -1, p: [6.9, SOL_T, Z_PIETON + 4.2], mode: "debout", ry: -Math.PI / 2, emotion: "neutre" }, { t: ev.sauve - 0.9, p: [6.9, SOL_T, Z_PIETON + 4.2], mode: "debout", ry: -Math.PI / 2, emotion: "effraye" }, { t: ev.sauve + 0.6, p: [6.9, SOL_T, Z_PIETON + 4.2], mode: "debout", ry: -Math.PI / 2, emotion: "surpris" }] });
  out.push(chemin("promeneur1", passant(1), 0.7, 0, 2.2, [[-5.7, SOL_T, -40], [-5.7, SOL_T, 120]], "marche", { echelle: 0.98 }));
  out.push(chemin("promeneur2", passant(4), 1.1, 0, 2.0, [[5.4, SOL_T, 90], [5.4, SOL_T, -90]], "marche", { echelle: 1.02 }));
  out.push(chemin("promeneur3", passant(5), 1.9, 0, 2.4, [[-6.1, SOL_T, 70], [-6.1, SOL_T, -70]], "marche", { echelle: 0.9 }));
  out.push(chemin("promeneur4", passant(3), 0.4, 0, 2.3, [[-6.6, SOL_T, -90], [-6.6, SOL_T, 60]], "marche", { echelle: 1.0 }));

  // ======================================================= CHAMBRE — scènes 1 et 2
  const tE0 = mot(0, 25) - 0.5;
  const pT: V3 = [X - 1.45, 0, -2.45]; // devant la table de chevet
  const pF: V3 = [X + 0.6, 0, -1.5]; // devant la fenêtre
  const ryT = Math.atan2(-1.0 - -1.45, -3.9 - -2.45); // regard vers la table
  out.push({
    id: "emma",
    tenue: T_EMMA,
    graine: 0.6,
    echelle: 0.72,
    etapes: [
      { t: tE0, p: [X + 1.4, 0, -0.8], mode: "debout", ry: 0, objet: "ange_bocal", emotion: "sourire" },
      { t: mot(1, 8) - 0.1, p: [X + 1.4, 0, -0.8], mode: "debout", ry: 0, objet: "ange_bocal", emotion: "sourire" },
      { t: ev.pose, p: pT, mode: "debout", ry: ryT, objet: "ange_bocal", emotion: "sourire" },
      { t: ev.pose + 0.35, p: pT, mode: "debout", ry: ryT, objet: "", emotion: "sourire" },
      { t: ev.pose + 0.9, p: [pT[0] + 0.1, 0, pT[2] + 0.1], mode: "debout", ry: ryT, objet: "", emotion: "apaise" },
      { t: ev.silhouette - 0.3, p: pF, mode: "debout", ry: 0, emotion: "curieux" },
      { t: ev.silhouette + 1.4, p: pF, mode: "debout", ry: 0, emotion: "sourire" },
    ],
  });
  // le narrateur (fantôme) : apparaît dans la lumière de la fenêtre, derrière sa sœur
  out.push({
    id: "frereCh",
    tenue: T_FRERE,
    graine: 0.9,
    echelle: 0.9,
    fantome: true,
    etapes: [
      { t: mot(1, 26) - 0.05, p: [X + 2.0, 0, -3.3], mode: "debout", ry: 0.35, emotion: "curieux" },
      { t: mot(1, 31), p: [X + 2.0, 0, -3.3], mode: "debout", ry: 0.35, emotion: "sourire" },
      { t: mot(2, 0), p: [X + 2.0, 0, -3.3], mode: "debout", ry: 0.35, emotion: "apaise" },
    ],
  });

  // ======================================================= RUE — scène 3 : le chemin de l'école
  const xPorte = 10.5;
  const zPorte = Z_MAISON_EMMA + 2.2;
  const tK = mot(2, 0) - 1.0; // ils sortent de la maison
  const trajet = (decalage: number, x: number): V3[] => [[xPorte, SOL_T, zPorte + decalage], [7.6, SOL_T, zPorte + decalage], [x, SOL_T, zPorte + decalage], [x, SOL_T, 70]];
  const marche = (id: string, tenue: Tenue, graine: number, t0: number, pts: V3[], extra: Partial<Habitant>, emotion: Etape["emotion"]): Habitant => {
    const h = chemin(id, tenue, graine, t0, 2.5, pts, "marche", extra, emotion);
    // dernier tronçon : la marche continue au-delà de la scène
    return h;
  };
  out.push(marche("emmaR", T_EMMA, 0.6, tK, trajet(0, X_TROTTOIR), { echelle: 0.72 }, "sourire"));
  out.push(marche("frereR", T_FRERE, 0.9, tK + 0.15, trajet(-0.55, 4.7), { echelle: 0.9, fantome: true }, "sourire"));
  out.push(marche("maman", T_MAMAN, 1.4, tK + 2.0, trajet(0.1, X_TROTTOIR + 0.3), { echelle: 1.0 }, "inquiet"));

  // ======================================================= GARE — scène 4 : le passage à niveau
  const G = (x: number, y: number, z: number): V3 => [x, y, GZ + z];
  const zE = 1.5; // Emma marche à droite de la route (z = 1,5)
  const tBar = ev.barr - 0.1;
  void tBar;
  const tArr = mot(3, 17) + 0.1; // elle s'arrête au milieu des rails
  const vE = 3.0;
  const xArr = -0.3;
  const xDep = -30;
  out.push({
    id: "emmaG",
    tenue: T_EMMA,
    graine: 0.6,
    echelle: 0.72,
    etapes: [
      { t: tArr - (xArr - xDep) / vE, p: G(xDep, SOL_R, zE), mode: "marche", emotion: "curieux" },
      { t: tArr, p: G(xArr, SOL_R, zE), mode: "debout", ry: Math.PI, emotion: "neutre" },
      { t: mot(3, 20), p: G(xArr, SOL_R, zE), mode: "debout", ry: Math.PI, emotion: "effraye" },
      { t: ev.flashG + 0.1, p: G(xArr, SOL_R, zE), mode: "debout", ry: Math.PI, emotion: "effraye" },
      // la lumière la dépose sur le trottoir (téléportation cachée par le flash)
      { t: ev.flashG + 0.14, p: G(-3.7, 0.1, 4.7), mode: "debout", ry: 2.87, emotion: "surpris", objet: "ange_plume" },
      { t: mot(4, 5), p: G(-3.7, 0.1, 4.7), mode: "debout", ry: 2.87, emotion: "effraye", objet: "ange_plume" },
      { t: mot(4, 10), p: G(-3.7, 0.1, 4.7), mode: "debout", ry: 2.87, emotion: "effraye", objet: "ange_plume" },
      { t: mot(4, 15), p: G(-3.7, 0.1, 4.7), mode: "debout", ry: 2.87, emotion: "triste", objet: "ange_plume" },
      { t: mot(4, 20), p: G(-3.7, 0.1, 4.7), mode: "debout", ry: 2.87, emotion: "larmes", objet: "ange_plume" },
      { t: mot(4, 31) + 0.3, p: G(-3.7, 0.1, 4.7), mode: "debout", ry: 2.87, emotion: "larmes", objet: "ange_plume" },
    ],
  });
  // le frère : à la traîne, puis court vers sa sœur ; il reste au bord de la route après le flash
  const xF = -2.7;
  const tCourse = mot(3, 19);
  const xF0 = xF - 9.6;
  out.push({
    id: "frereG",
    tenue: T_FRERE,
    graine: 0.9,
    echelle: 0.9,
    fantome: true,
    etapes: [
      { t: tCourse - 5.8, p: G(-24, SOL_R, 0.6), mode: "marche", emotion: "sourire" },
      { t: tCourse - 1.0, p: G(xF0, SOL_R, 0.6), mode: "marche", emotion: "inquiet" },
      { t: tCourse - 0.05, p: G(xF0, SOL_R, 0.6), mode: "course", ry: Math.PI / 2, emotion: "effraye" },
      { t: ev.flashG - 0.05, p: G(xF, SOL_R, 1.1), mode: "course", emotion: "effraye" },
      { t: ev.flashG + 0.5, p: G(xF, SOL_R, 1.1), mode: "debout", ry: -0.27, emotion: "surpris" },
      { t: mot(4, 5), p: G(xF, SOL_R, 1.1), mode: "debout", ry: -0.27, emotion: "inquiet" },
      { t: mot(4, 22), p: G(xF, SOL_R, 1.1), mode: "debout", ry: -0.27, emotion: "inquiet" },
      { t: mot(4, 27), p: G(xF, SOL_R, 1.1), mode: "debout", ry: -0.27, emotion: "apaise" },
    ],
  });

  // ======================================================= GARE — scène 6 : le flashback (trois ans plus tôt)
  const t0 = ev.flashback;
  const tHit = ev.train2;
  // Emma à 4 ans : elle marche vers les rails et s'y arrête, figée devant le train
  out.push({
    id: "emma3",
    tenue: T_EMMA,
    graine: 1.6,
    echelle: 0.52,
    etapes: [
      { t: t0 - 3.5, p: G(-12, SOL_R, zE), mode: "marche", emotion: "curieux" },
      { t: t0 + 0.9, p: G(-0.3, SOL_R, zE), mode: "debout", ry: Math.PI, emotion: "neutre" },
      { t: tHit - 2.4, p: G(-0.3, SOL_R, zE), mode: "debout", ry: Math.PI, emotion: "effraye" },
      // poussée : projetée sur le trottoir (côté ouest)
      { t: tHit - 1.05, p: G(-0.3, SOL_R, zE), mode: "debout", ry: Math.PI, emotion: "effraye" },
      { t: tHit - 0.65, p: G(-2.7, 0.1, 4.9), mode: "tombe", ry: Math.PI, emotion: "effraye" },
      { t: tHit + 0.1, p: G(-2.7, 0.1, 4.9), mode: "tombe", ry: Math.PI, emotion: "effraye" },
      { t: tHit + 0.18, p: G(-2.7, 0.1, 4.9), mode: "debout", ry: Math.PI / 2, emotion: "larmes" },
    ],
  });
  // le frère vivant (≈ 9 ans), venu du quai (côté est) : court, pousse sa sœur vers l'ouest, reste sur les rails face au train
  out.push({
    id: "frere3",
    tenue: T_FRERE,
    graine: 2.1,
    echelle: 0.78,
    etapes: [
      { t: t0 - 3.5, p: G(10, SOL_R, zE + 0.4), mode: "debout", ry: -Math.PI / 2, emotion: "sourire" },
      { t: tHit - 2.2, p: G(10, SOL_R, zE + 0.4), mode: "debout", ry: -Math.PI / 2, emotion: "effraye" },
      { t: tHit - 1.15, p: G(0.4, SOL_R, zE), mode: "pousse", ry: -Math.PI / 2, emotion: "resolu" },
      { t: tHit - 0.3, p: G(0.4, SOL_R, zE), mode: "debout", ry: Math.PI, emotion: "resolu" },
      { t: tHit + 0.06, p: G(0.4, SOL_R, zE), mode: "debout", ry: Math.PI, emotion: "resolu" },
      { t: tHit + 0.1, p: G(0.4, -40, zE), mode: "debout", ry: Math.PI, emotion: "resolu" },
    ],
  });

  // ======================================================= GARE — retour au présent : le banc du quai
  const xBanc = BANC[0] - 0.05;
  const zEm = BANC[2] + 0.9;
  const tPres = mot(5, 17) - 0.3;
  out.push({
    id: "emmaF",
    tenue: T_EMMA,
    graine: 0.6,
    echelle: 0.72,
    etapes: [
      { t: tPres, p: G(xBanc, 0, zEm), mode: "assis", ry: -Math.PI / 2, h: 1.55, emotion: "triste" },
      { t: mot(5, 20), p: G(xBanc, 0, zEm), mode: "assis", ry: -Math.PI / 2, h: 1.55, emotion: "sourire" },
      { t: ev.ange, p: G(xBanc, 0, zEm), mode: "assis", ry: -Math.PI / 2, h: 1.55, emotion: "larmes" },
      { t: ev.depose, p: G(xBanc, 0, zEm), mode: "assis", ry: -Math.PI / 2, h: 1.55, emotion: "triste" },
      { t: ev.disparait, p: G(xBanc, 0, zEm), mode: "assis", ry: -Math.PI / 2, h: 1.55, emotion: "larmes" },
      { t: ev.disparait + 1.4, p: G(xBanc, 0, zEm), mode: "assis", ry: -Math.PI / 2, h: 1.55, emotion: "apaise" },
    ],
  });
  out.push({
    id: "frereF",
    tenue: T_FRERE,
    graine: 0.9,
    echelle: 0.9,
    fantome: true,
    etapes: [
      { t: tPres, p: G(7.45, 0.1, BANC[2] + 0.9), mode: "debout", ry: -Math.PI / 2, emotion: "apaise" },
      { t: ev.ange, p: G(7.45, 0.1, BANC[2] + 0.9), mode: "debout", ry: -Math.PI / 2, emotion: "sourire" },
      { t: ev.disparait, p: G(7.45, 0.1, BANC[2] + 0.9), mode: "debout", ry: -Math.PI / 2, emotion: "apaise" },
    ],
  });
  return out;
}
