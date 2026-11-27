/**
 * La ville des somnambules — mise en scène plan par plan (récit : histoires/recits/somnambules.json).
 * Chaque plan démarre sur un mot [scène, mot]. Caméra dynamique : travellings, zooms, plans serrés sur les yeux,
 * suivis, orbites ; brouillard, vignette, flash et noir final réglés plan par plan.
 */
import type { PlanGen } from "../../types";
import { D, P, PI, entre, faceA, freine, lisse, mel, mel3, orb, plus, pos, rel, secousse, tete, trav, viser, type V3 } from "../cam";
import type { EtatConte } from "../lib";
import { MAISON, MONT, SALON, PORTE_Z } from "./monde";

const [X] = MONT;
const [XM] = MAISON;
const [XS] = SALON;
const FOG = {
  ville: ["#0B1230", 28, 140] as [string, number, number],
  aube: ["#C98B70", 24, 130] as [string, number, number],
  mont: ["#0A1024", 34, 170] as [string, number, number],
  chambre: ["#0E1432", 26, 70] as [string, number, number],
  salon: ["#2A1C12", 20, 60] as [string, number, number],
  tunnel: ["#0C0805", 10, 64] as [string, number, number],
};
const S = (cam: ReturnType<typeof viser>, brouillard: [string, number, number], vignette = 0.5, extra: Partial<EtatConte> = {}): EtatConte => ({ cam, brouillard, fx: { vignette }, ...extra });

export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « À 3 heures du matin, tout le monde sort de chez soi en dormant… »
  P("s01p1", "Vue aérienne de la ville plongée dans l'obscurité, descente lente au-dessus de l'avenue", 0, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([4, 64, 74], [2, 34, 34], k), mel3([0, 0, -10], [0, 2, -34], k), 62), ["#101A3E", 40, 260], 0.5);
  }),
  P("s01p2", "Toutes les portes s'ouvrent ensemble, des deux côtés de l'avenue : les somnambules en sortent et s'éloignent en file (plan bas au centre de la rue)", 0, 11, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.5, 2.5, 18], [0.2, 2.7, 10], k), [0, 2.0, -26], mel(60, 56, k)), ["#101A3E", 40, 240], 0.5);
  }),
  P("s01p3", "GROS PLAN sur les yeux grands ouverts du narrateur, réveillé dans son lit (« Mais moi, j'étais réveillé… »)", 0, 17, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([XM - 2.6, 3.7, 1.6], [XM - 2.6, 3.0, 0.9], k), [XM - 2.6, 1.5, -0.35], mel(36, 30, k), 0.5, 0.3), FOG.chambre, 0.6);
  }),

  P("s01p4", "Recul derrière lui : à travers la vitre, la file des somnambules défile sous la lune (« pourquoi il ne fallait pas regarder »)", 0, 22, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([XM + 1.0, 2.5, 0.2], [XM + 1.6, 2.6, 2.6], k), [XM, 2.1, -11], 54), FOG.chambre, 0.55);
  }),

  // ======================= SCÈNE 2 — « Chaque nuit, ils marchaient jusqu'à la montagne… »
  P("s02p1", "File interminable de somnambules sous la lune : travelling latéral qui suit la marche", 1, 0, (c) => {
    const z = 20 - 1.7 * c.t;
    return S(viser([X - 13, 3.0, z + 4], [X + 1, 1.7, z - 4], 60), FOG.mont, 0.5);
  }),
  P("s02p2", "GROS PLAN sur le visage d'un somnambule : regard vide, jamais un clignement", 1, 7, (c) => S(faceA(c, "mw0", [3.6, 2.9], 2.4, 0.15, 36, 2.4, 0.4), FOG.mont, 0.6)),
  P("s02p3", "Travelling arrière : derrière la file, la montagne et l'entrée du tunnel se révèlent", 1, 10, (c) => {
    const k = freine(c.p);
    const a = pos(c, "mw0");
    return S(viser(mel3([a[0] + 0.6, 2.8, a[2] + 3], [X + 7, 13, a[2] + 52], k), mel3([X, 3, -28], [X, 9, -32], k), mel(54, 62, k), 0.5, 0.44), FOG.mont, 0.55);
  }),
  P("s02p4", "Aube : la file remonte l'avenue vers les maisons (« Au lever du soleil, ils retournaient dans leurs lits »)", 1, 14, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.8, 2.0, -40], [1.0, 2.3, -30], k), [0, 2.2, 0], 52), FOG.aube, 0.4, { ciel: "#D9926F", ambiance: "aube" });
  }),
  P("s02p5", "GROS PLAN sur la main d'un somnambule : de la terre sous les ongles", 1, 23, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "rw9", [mel(-1.7, -1.4, k), 2.15, 2.6]), rel(c, "rw9", [-0.68, 1.75, 0.95]), 28), FOG.aube, 0.45, { ciel: "#D9926F", ambiance: "aube" });
  }),

  // ======================= SCÈNE 3 — « Pendant des semaines, j'ai fait semblant de dormir… »
  P("s03p1", "Le narrateur fait semblant de dormir, un œil qui s'entrouvre : poussée lente vers le lit", 2, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([XM - 1.4, 2.7, 4.0], [XM - 2.0, 2.1, 2.6], k), [XM - 2.6, 1.6, 0.2], 50), FOG.chambre, 0.62);
  }),
  P("s03p2", "Sur la montagne, le professeur arrive avec sa lanterne le long de la file (vu depuis les rochers)", 2, 8, (c) => {
    const p = pos(c, "prof");
    return S(viser([X + 13.4, 2.3, -11 + (1 - lisse(c.p)) * 2], plus(p, [0, 2.2, 0]), 50), FOG.mont, 0.55);
  }),
  P("s03p3", "Plan moyen : le professeur surveille les autres, son faisceau de lanterne balaie la file", 2, 15, (c) => S(viser(rel(c, "prof", [mel(-2.8, -2.2, lisse(c.p)), 2.5, 3.0]), rel(c, "prof", [0.3, 2.3, 0.4]), 42), FOG.mont, 0.55)),
  P("s03p4", "EXTRÊME GROS PLAN sur les yeux du professeur : il cligne (« Lui, il clignait des yeux »)", 2, 21, (c) => S(faceA(c, "prof", [3.4, 2.4], 2.7, 0.1, 24, 2.7, 0.44), FOG.mont, 0.65)),

  // ======================= SCÈNE 4 — « J'ai compris que certains étaient réveillés depuis le début… »
  P("s04p1", "Plan large : parmi les somnambules, des veilleurs à lanterne qui clignent des yeux", 3, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([X - 17, 7, 24], [X - 15, 6, 10], k), [X, 1.8, mel(8, 2, k)], 56), FOG.mont, 0.5);
  }),
  P("s04p2", "Orbite autour d'un veilleur : ils surveillent ceux qui découvrent le secret", 3, 9, (c) => S(orb(plus(pos(c, "veil1"), [0, 2.0, 0]), [6.6, 4.4], [0.5, 1.7], [2.8, 2.2], lisse(c.p), 52), FOG.mont, 0.55)),
  P("s04p3", "Depuis la cachette du narrateur : le professeur s'approche de la bouche du tunnel, sa lanterne grandit", 3, 17, (c) => {
    const k = lisse(c.p);
    return S(viser([X + 12.9, 2.2, mel(-15.0, -15.6, k)], plus(pos(c, "prof"), [0, 2.0, 0]), 50), FOG.mont, 0.6);
  }),
  P("s04p4", "Une silhouette jaillit du tunnel et pousse le professeur : chute, la lanterne roule au sol (secousse)", 3, 24, (c) => {
    const ev = D(c).ev;
    const dt = c.T - ev.pousse;
    const sh = dt > 0 && dt < 0.5 ? secousse(c.T, 0.22 * (1 - dt / 0.5)) : ([0, 0, 0] as V3);
    const k = lisse(c.p);
    const cam = viser(plus(mel3([X + 10, 2.4, -4.5], [X + 8, 2.0, -8.5], k), sh), [X + 2.4, 1.6, -18], 52);
    return S(cam, FOG.mont, 0.55, { fx: { vignette: 0.55, flash: ["#FFFFFF", dt > 0 && dt < 0.12 ? 0.35 * (1 - dt / 0.12) : 0] } });
  }),

  // ======================= SCÈNE 5 — « C'était ma grande sœur… »
  P("s05p1", "Visage de la grande sœur, éclairé par la lanterne au sol : c'est elle", 4, 0, (c) => S(faceA(c, "soeur", [3.6, 2.7], 2.4, 0, 34, 2.4, 0.4), FOG.mont, 0.55)),
  P("s05p2", "Face-à-face entre le frère et la sœur, à l'écart de la file, sous la lune", 4, 4, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([X + 11.4, 2.3, -1.6], [X + 11.4, 2.45, -3.0], k), [X + 11.4, 2.0, -8.0], 52), FOG.mont, 0.5);
  }),
  P("s05p3", "GROS PLAN sur ses yeux : elle est réveillée depuis six ans", 4, 11, (c) => S(faceA(c, "soeur", [2.8, 2.2], 2.5, 0, 30, 2.4, 0.42), FOG.mont, 0.6)),
  P("s05p4", "Souvenir : le salon, chaud ; deux enfants face à face, qui se fixent sans cligner (concours de regards)", 4, 21, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([XS + 4.3, 3.2, 3.9], [XS + 3.7, 2.9, 3.3], k), [XS - 0.3, 1.9, -0.3], 72), FOG.salon, 0.55, { fx: { vignette: 0.55, teinte: ["#FFB066", 0.38] } });
  }),
  P("s05p5", "Souvenir : la grande sœur cligne la première, exprès, et laisse gagner son frère", 4, 26, (c) => {
    const k = lisse(c.p);
    return S(viser([XS + mel(1.1, 0.7, k), 2.55, 0.2], rel(c, "kidS", [0, 2.35, 0]), 34), FOG.salon, 0.55, { fx: { vignette: 0.55, teinte: ["#FFB066", 0.38] } });
  }),
  P("s05p6", "Retour à la montagne : le frère, stupéfait, comprend", 4, 31, (c) => S(faceA(c, "nMont", [3.0, 2.5], 2.5, 1.3, 34, 2.4, 0.4), FOG.mont, 0.55)),
  P("s05p7", "EXTRÊME GROS PLAN : ses yeux grands ouverts, qui ne clignent plus (« ne jamais cligner des yeux »)", 4, 34, (c) => S(faceA(c, "nMont", [1.7, 1.35], 2.15, 1.4, 26, 2.15, 0.45), FOG.mont, 0.65)),

  // ======================= SCÈNE 6 — « Cette nuit-là, elle m'a aidé à creuser… »
  P("s06p1", "Dans le tunnel, les deux enfants creusent à la pioche, éclairés par les lanternes (travelling d'approche)", 5, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.3, 3.3, 380], [0.4, 3.0, 372], k), [0, 3.1, 361], 54), FOG.tunnel, 0.55);
  }),
  P("s06p2", "La pioche frappe quelque chose de métallique : étincelle, secousse (zoom sur l'outil, vu de profil)", 5, 7, (c) => {
    const ev = D(c).ev;
    const dt = c.T - ev.frappe;
    const sh = dt > 0 && dt < 0.5 ? secousse(c.T, 0.2 * (1 - dt / 0.5)) : ([0, 0, 0] as V3);
    const k = lisse(c.p);
    return S(viser(plus(mel3([-3.9, 2.4, 366.4], [-3.4, 2.4, 365.4], k), sh), [-0.2, 2.5, 361.9], mel(52, 44, k)), FOG.tunnel, 0.6, { fx: { vignette: 0.6, flash: ["#FFF3D2", dt > 0 && dt < 0.16 ? 0.7 * (1 - dt / 0.16) : 0] } });
  }),
  P("s06p3", "Une porte : la paroi de terre tombe, l'immense porte de métal apparaît (recul)", 5, 16, (c) => {
    const k = freine(c.p);
    return S(viser(mel3([0, 3.0, 368.5], [0, 4.8, 385], k), [0, 3.6, 360.4], mel(52, 58, k)), FOG.tunnel, 0.55);
  }),
  P("s06p4", "Trois coups derrière la porte : elle vibre, la caméra tremble (contre-plongée)", 5, 19, (c) => {
    const ev = D(c).ev;
    const t = c.T;
    let amp = 0;
    for (const tk of [ev.toc1, ev.toc2, ev.toc3]) if (t > tk && t < tk + 0.45) amp = Math.max(amp, 0.2 * (1 - (t - tk) / 0.45));
    const k = lisse(c.p);
    return S(viser(plus(mel3([0.2, 1.3, 372.5], [0, 1.7, 369.4], k), secousse(t, amp)), [0, 3.8, 360.4], 56), FOG.tunnel, 0.6);
  }),
  P("s06p5", "Gros plan sur la poignée qui bouge lentement (« une voix a prononcé mon prénom »)", 5, 24, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([1.0, 5.9, 367.6], [1.5, 5.5, 366.4], k), [1.9, 3.2, 360.9], mel(42, 34, k), 0.5, 0.45), FOG.tunnel, 0.65);
  }),
  P("s06p6", "Le narrateur, terrorisé, de profil : « Comment connaissait-elle mon prénom ? » — noir brutal", 5, 31, (c) => {
    const d = D(c);
    const noir = lisse(entre(c.T, d.finNarration - 0.02, d.finNarration + 0.14));
    return S(viser(rel(c, "nTun", [2.3, 2.5, 1.7]), tete(c, "nTun"), mel(38, 32, lisse(c.p)), 0.5, 0.42), FOG.tunnel, 0.7, { fx: { vignette: 0.7, noir } });
  }),
];
void PI;
void PORTE_Z;
