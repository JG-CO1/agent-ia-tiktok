/**
 * « Mur du silence » — personnages (habitants) et événements calés sur les mots.
 * Repères [scène, mot] : voir histoires/recits/mur-silence.json (scène 1 = indice 0 ; `npx tsx scripts/mots.ts mur-silence`).
 * Apparences FIXES : Adam (13 ans, sweat bleu marine, cheveux bruns à mèche), Lina (7 ans, salopette jaune, couettes, lapin en peluche),
 * papa (barbe courte, pull gris, dos voûté), maman (longs cheveux bruns, cardigan vert), passants de la rue.
 * Repère du salon : mur le long de z à x = 0 ; l'ouest (x < 0) est la cuisine et papa, l'est (x > 0) l'escalier, Adam et Lina.
 */
import type { V3 } from "../../geo";
import type { Tenue } from "../../avatar";
import { type Etape, type Habitant, duree } from "../../ville/foule";
import { ASSISE, CHAMBRE, J_TROU, LB, RUE, SOFA_Z, TABLE } from "./monde";

type Mot = (s: number, k: number) => number;

// ------------------------------------------------------------------ Tenues
export const T_ADAM: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#1D2B5E", bas: "#2F3B52", chaussures: "#EDEDED", cheveux: "#3A2A1E" };
export const T_LINA: Tenue = { genre: "figurant", peau: "#EDC29A", haut: "#F4EBD9", bas: "#F2C230", chaussures: "#C2552E", cheveux: "#5B3A22" };
export const T_PAPA: Tenue = { genre: "figurant", peau: "#DDB08A", haut: "#7A808A", bas: "#34383F", chaussures: "#1A1A1F", cheveux: "#2B2118" };
export const T_MAMAN: Tenue = { genre: "figurant", peau: "#EDC29A", haut: "#3F8A5B", bas: "#7A5A3E", chaussures: "#3A2A1E", cheveux: "#4A2E1E", longs: "#4A2E1E" };
export const T_HOMME: Tenue = { genre: "figurant", peau: "#D9AE8B", haut: "#D9702E", bas: "#2F3B52", chaussures: "#1A1A1F", cheveux: "#2B2118" };
export const T_FEMME: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#B83A3A", bas: "#3A3F4C", chaussures: "#1A1A1F", cheveux: "#1F1A17", longs: "#1F1A17" };
export const T_PASSANT1: Tenue = { genre: "figurant", peau: "#C99A72", haut: "#4E8F8A", bas: "#3A3F4C", chaussures: "#EDEDED", cheveux: "#1F1A17" };
export const T_PASSANT2: Tenue = { genre: "figurant", peau: "#EDC29A", haut: "#D9A63A", bas: "#5A4A56", chaussures: "#2A2A30", cheveux: "#7A4E2D", longs: "#7A4E2D" };
export const T_PASSANT3: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#6E4BA0", bas: "#2F3B52", chaussures: "#1A1A1F", cheveux: "#8A8A8A" };
export const E_LINA = 0.72;
export const E_ADAM = 0.92;
export const E_PAPA = 1.04;
export const E_MAMAN = 0.98;

// ------------------------------------------------------------------ Lieux et postes (repère monde)
export const EST = Math.PI / 2; // regarde vers +x
export const OUEST = -Math.PI / 2;
export const ZT = (TABLE.z0 + TABLE.z1) / 2;
export const H_ASSIS = 0.78;
export const SIEGE_PAPA: V3 = [-3.9, 0, ZT];
export const SIEGE_ADAM: V3 = [3.9, 0, ZT];
export const Z_TROU = 1.75; // la brique qui tombe est à cette hauteur sur z (voir genererMur)
export const MUR_X = 0.9; // faces du mur
export const MAMAN_P: V3 = [0.05, 0, SOFA_Z];
export const H_CANAPE = 0.85;
export const ADAM_AU_MUR: V3 = [MUR_X + 0.4, 0, Z_TROU];
export const LINA_AU_MUR: V3 = [2.0, 0, -1.8];
const LINA_OREILLE_X = 1.3;

// ------------------------------------------------------------------ Événements
const dist2 = (a: V3, b: V3, v = 3) => Math.hypot(b[0] - a[0], b[2] - a[2]) / v;
export function evenements(mot: Mot): Record<string, number> {
  const adamVa = mot(2, 16) - 0.35;
  const coinA: V3 = [SIEGE_ADAM[0], 0, Z_TROU];
  const papaLeve = mot(4, 9) + 0.05;
  return {
    adamVa,
    adamArrive: adamVa + dist2(SIEGE_ADAM, coinA) + dist2(coinA, ADAM_AU_MUR),
    adamRecule: mot(3, 0) - 0.1,
    adamAvance: mot(3, 7),
    adamParle: mot(3, 20),
    papaArrive: papaLeve + dist2(SIEGE_PAPA, [-MUR_X - 1.25, 0, Z_TROU]),
    linaVa: mot(3, 24) - 0.1,
    linaOreille: mot(2, 3),
    v0: 0.1,
    vA: mot(1, 8) - 0.1, // « Alors le mur monte »
    vB: mot(1, 12) - 0.1, // « brique après brique »
    vC: mot(1, 15) - 0.05, // « et il sépare déjà… »
    vD: mot(2, 0) + 0.2, // « Un soir »
    vE: mot(3, 1) + 0.6, // « de près »
    vF: mot(4, 0) + 0.1, // « Alors j'ai pris mon courage »
    nuit0: mot(2, 0) - 0.5, // le jour baisse
    nuit1: mot(2, 0) + 0.9,
    bat0: mot(2, 21) + 0.08, // « un battement » : premier battement du mur
    lueur0: mot(3, 0), // la lueur dorée filtre entre les briques
    grave0: mot(3, 4) - 0.15, // « gravés » : les mots apparaissent
    secousse: mot(4, 9) + 0.1, // la brique frémit (« me manque »)
    tombe: mot(4, 13) - 0.1, // « brique » : elle se détache
    papaTete: mot(4, 7) + 0.25, // « Papa, » : il relève la tête
    papaLeve, // il se lève et marche vers le mur
    larmes: mot(4, 19), // « larmes »
    effondre: mot(5, 2) - 0.12, // « s'est effondré »
    maman0: mot(5, 7) - 0.1, // « maman » : elle lève les yeux
    courent: mot(5, 11) + 0.35, // Adam et Lina courent vers elle
    etreinte: mot(5, 16) + 0.3, // « à nous attendre »
    jamais: mot(5, 19), // « Elle n'avait jamais disparu »
    rue0: mot(0, 8), // « deux personnes » : le premier mur de la rue
    rue1: mot(0, 11), // « cessent » : les deux se tournent le dos
    chambre0: mot(0, 21),
  };
}

// ------------------------------------------------------------------ Aides
const dep = (id: string, tenue: Tenue, graine: number, echelle: number, etapes: Etape[], extra: Partial<Habitant> = {}): Habitant => ({ id, tenue, graine, echelle, etapes, ...extra });
const pt = (t: number, p: V3, mode: Etape["mode"], ry: number | undefined, emotion: Etape["emotion"], extra: Partial<Etape> = {}): Etape => ({ t, p, mode, ry, emotion, ...extra });
const ch = (x: number, z: number): V3 => [CHAMBRE[0] + x, 0, z];
const ru = (x: number, z: number): V3 => [RUE[0] + x, 0, z];
void LB;
void ASSISE;
void J_TROU;

export function habitants(mot: Mot): Habitant[] {
  const ev = evenements(mot);
  const out: Habitant[] = [];
  const marche = (a: V3, b: V3, v = 3) => duree(a, b, v);

  // ---------------- PAPA : assis à l'ouest, dos voûté, puis il se lève et va au mur quand Adam parle
  const aMur: V3 = [-MUR_X - 1.25, 0, Z_TROU];
  const tPapa = ev.papaLeve;
  const tArrivePapa = tPapa + marche(SIEGE_PAPA, aMur);
  const cote: V3 = [-1.3, 0, 0.3];
  const sofaPapa: V3 = [1.55, 0, -0.7];
  const tPapaVa = mot(5, 11) + 0.55;
  out.push(
    dep("papa", T_PAPA, 0.7, E_PAPA, [
      pt(-1, SIEGE_PAPA, "assis", EST, "triste", { h: H_ASSIS }),
      pt(tPapa, SIEGE_PAPA, "assis", EST, "triste", { h: H_ASSIS }),
      pt(tArrivePapa, aMur, "debout", EST, "triste"),
      pt(ev.larmes - 0.1, aMur, "debout", EST, "triste"),
      pt(ev.larmes, aMur, "debout", EST, "larmes"),
      pt(mot(4, 26), aMur, "debout", EST, "triste"),
      pt(mot(4, 29), aMur, "debout", EST, "apaise"),
      pt(ev.effondre + 0.2, aMur, "debout", EST, "surpris"),
      pt(tPapaVa - 0.3, aMur, "debout", EST, "larmes"),
      pt(tPapaVa, aMur, "marche", undefined, "larmes"),
      pt(tPapaVa + marche(aMur, cote), cote, "marche", undefined, "larmes"),
      pt(tPapaVa + marche(aMur, cote) + marche(cote, sofaPapa), sofaPapa, "debout", EST, "larmes"),
      pt(ev.etreinte + 1.2, sofaPapa, "serre", EST, "larmes"),
    ]),
  );

  // ---------------- ADAM : assis à l'est ; va écouter le mur ; se tient près du mur ; parle ; court vers maman
  const tAdamVa = ev.adamVa;
  const coin: V3 = [SIEGE_ADAM[0], 0, Z_TROU];
  const dAdam1 = marche(SIEGE_ADAM, coin) + marche(coin, ADAM_AU_MUR);
  const apres: V3 = [2.2, 0, Z_TROU];
  const tAdamRecule = mot(3, 0) - 0.1;
  const proche: V3 = [MUR_X + 0.62, 0, Z_TROU];
  const tAdamAvance = mot(3, 7);
  const parle: V3 = [3.6, 0, Z_TROU];
  const tAdamTresProche = mot(4, 0) + 0.2;
  const courseA: V3[] = [[3.4, 0, 0.1], [1.55, 0, SOFA_Z + 0.55]];
  const tCourse = ev.courent;
  const tCourse1 = tCourse + marche(parle, courseA[0], 5.6);
  const tCourse2 = tCourse1 + marche(courseA[0], courseA[1], 5.6);
  out.push(
    dep("adam", T_ADAM, 0.3, E_ADAM, [
      pt(-1, SIEGE_ADAM, "assis", OUEST, "triste", { h: H_ASSIS }),
      pt(mot(1, 0), SIEGE_ADAM, "assis", OUEST, "triste", { h: H_ASSIS }),
      pt(mot(1, 8), SIEGE_ADAM, "assis", OUEST, "triste", { h: H_ASSIS }),
      pt(tAdamVa, SIEGE_ADAM, "assis", OUEST, "attente", { h: H_ASSIS }),
      pt(tAdamVa + marche(SIEGE_ADAM, coin), coin, "marche", undefined, "attente"),
      pt(tAdamVa + dAdam1, ADAM_AU_MUR, "debout", OUEST, "attente"),
      pt(tAdamRecule, ADAM_AU_MUR, "debout", OUEST, "attente"),
      pt(tAdamRecule + 0.6, apres, "marche", undefined, "curieux"),
      pt(tAdamRecule + 0.6 + marche(ADAM_AU_MUR, apres), apres, "debout", OUEST, "curieux"),
      pt(tAdamAvance, apres, "debout", OUEST, "curieux"),
      pt(tAdamAvance + marche(apres, proche, 2), proche, "debout", OUEST, "curieux"),
      pt(mot(3, 20), proche, "debout", OUEST, "triste"),
      pt(mot(3, 20) + 0.5, parle, "marche", undefined, "triste"),
      pt(mot(3, 20) + 0.5 + marche(proche, parle, 2.2), parle, "debout", OUEST, "triste"),
      pt(tAdamTresProche, parle, "debout", OUEST, "inquiet"),
      pt(mot(4, 3), parle, "debout", OUEST, "resolu"),
      pt(mot(4, 8) - 0.1, parle, "debout", OUEST, "triste"),
      pt(mot(4, 11), parle, "debout", OUEST, "larmes"),
      pt(mot(4, 28), parle, "debout", OUEST, "apaise"),
      pt(ev.effondre + 0.1, parle, "debout", OUEST, "surpris"),
      pt(ev.maman0 + 0.4, parle, "debout", OUEST, "larmes"),
      pt(tCourse, parle, "course", undefined, "larmes"),
      pt(tCourse1, courseA[0], "course", undefined, "larmes"),
      pt(tCourse2, courseA[1], "debout", OUEST, "larmes"),
      pt(ev.etreinte + 0.3, courseA[1], "serre", OUEST, "sourire"),
    ]),
  );

  // ---------------- LINA : au mur côté est (elle le touche sans cesse), oreille contre les briques, puis près d'Adam
  const lz = [-1.8, -3.2, -1.8, -2.5];
  const tL = [mot(1, 23) - 0.5, mot(1, 27), mot(1, 29), mot(2, 3)];
  const versAdam: V3 = [3.1, 0, 0.55];
  const tLinaVa = mot(3, 24) - 0.1;
  const tLinaRuns = ev.courent + 0.25;
  const lc1: V3 = [1.9, 0, 0.1];
  const lc2: V3 = [1.3, 0, SOFA_Z - 0.75];
  out.push(
    dep("lina", T_LINA, 1.1, E_LINA, [
      pt(-1, [LINA_AU_MUR[0], 0, lz[0]], "debout", OUEST, "curieux"),
      pt(tL[0], [LINA_AU_MUR[0], 0, lz[0]], "debout", OUEST, "curieux"),
      pt(tL[1], [LINA_AU_MUR[0], 0, lz[1]], "debout", OUEST, "curieux"),
      pt(tL[2], [LINA_AU_MUR[0], 0, lz[2]], "debout", OUEST, "attente"),
      pt(tL[3], [LINA_OREILLE_X, 0, lz[3]], "debout", OUEST, "attente"),
      pt(mot(2, 17), [LINA_OREILLE_X, 0, lz[3]], "debout", OUEST, "attente"),
      pt(tLinaVa, [LINA_OREILLE_X, 0, lz[3]], "debout", OUEST, "curieux"),
      pt(tLinaVa + 0.4, [LINA_OREILLE_X, 0, lz[3]], "marche", undefined, "curieux"),
      pt(tLinaVa + 0.4 + marche([LINA_OREILLE_X, 0, lz[3]], versAdam, 2.6), versAdam, "debout", OUEST, "curieux"),
      pt(ev.larmes, versAdam, "debout", OUEST, "inquiet"),
      pt(mot(4, 28), versAdam, "debout", OUEST, "sourire"),
      pt(ev.effondre + 0.1, versAdam, "debout", OUEST, "surpris"),
      pt(tLinaRuns, versAdam, "course", undefined, "effraye"),
      pt(tLinaRuns + marche(versAdam, lc1, 5.2), lc1, "course", undefined, "sourire"),
      pt(tLinaRuns + marche(versAdam, lc1, 5.2) + marche(lc1, lc2, 5.2), lc2, "debout", OUEST, "sourire"),
      pt(ev.etreinte + 0.5, lc2, "serre", OUEST, "sourire"),
    ]),
  );

  // ---------------- MAMAN : assise sur le canapé, cachée DANS le mur, depuis le début (la tasse de thé à la main)
  out.push(
    dep("maman", T_MAMAN, 0.9, E_MAMAN, [
      { t: -1, p: MAMAN_P, mode: "assis", ry: EST, emotion: "apaise", h: H_CANAPE, objet: "tasseThe" },
      { t: ev.effondre + 1.0, p: MAMAN_P, mode: "assis", ry: EST, emotion: "attente", h: H_CANAPE, objet: "tasseThe" },
      { t: ev.maman0, p: MAMAN_P, mode: "assis", ry: EST, emotion: "surpris", h: H_CANAPE, objet: "tasseThe" },
      { t: mot(5, 10), p: MAMAN_P, mode: "assis", ry: EST, emotion: "larmes", h: H_CANAPE, objet: "tasseThe" },
      { t: mot(5, 16) - 0.05, p: MAMAN_P, mode: "assis", ry: EST, emotion: "sourire", h: H_CANAPE, objet: "" },
    ]),
  );

  // ---------------- CHAMBRE : Adam regarde le dessin de la famille (« depuis trois ans »)
  out.push(
    dep("adamCh", T_ADAM, 0.5, E_ADAM, [
      pt(-1, ch(-3.6, 1.9), "debout", OUEST, "triste"),
      pt(mot(0, 25), ch(-3.6, 1.9), "debout", OUEST, "triste"),
    ]),
  );

  // ---------------- RUE : deux personnes qui ne se parlent plus ; des passants
  const rA: V3 = ru(-1.9, -4.7);
  const rB: V3 = ru(1.9, -4.7);
  out.push(dep("rA", T_HOMME, 0.2, 1.0, [pt(-1, rA, "debout", EST, "colere"), pt(ev.rue1, rA, "debout", OUEST, "triste")]));
  out.push(dep("rB", T_FEMME, 0.8, 0.96, [pt(-1, rB, "debout", OUEST, "colere"), pt(ev.rue1, rB, "debout", EST, "triste")]));
  // passants : trois marcheurs sur les trottoirs
  const w1a = ru(-34, -2.6);
  const w1b = ru(34, -2.6);
  out.push(dep("w1", T_PASSANT1, 0.4, 1.0, [pt(-4, w1a, "marche", undefined, "neutre"), pt(-4 + marche(w1a, w1b, 2.8), w1b, "marche", undefined, "neutre")]));
  const w2a = ru(30, -2.0);
  const w2b = ru(-30, -2.0);
  out.push(dep("w2", T_PASSANT2, 1.4, 0.96, [pt(-1, w2a, "marche", undefined, "neutre"), pt(-1 + marche(w2a, w2b, 2.8), w2b, "marche", undefined, "neutre")]));
  const w3a = ru(-6, 7.7);
  const w3b = ru(46, 7.7);
  out.push(dep("w3", T_PASSANT3, 2.2, 1.0, [pt(-1, w3a, "marche", undefined, "neutre"), pt(-1 + marche(w3a, w3b, 2.8), w3b, "marche", undefined, "neutre")]));
  const w4a = ru(40, 7.9);
  const w4b = ru(-30, 7.9);
  out.push(dep("w4", T_HOMME, 3.3, 0.94, [pt(-3, w4a, "marche", undefined, "neutre"), pt(-3 + marche(w4a, w4b, 2.8), w4b, "marche", undefined, "neutre")]));
  return out;
}
