/**
 * « Hamburger interdit » — personnages et événements (calés sur les mots du récit ; scène 1 = indice 0).
 * Chaque personnage garde EXACTEMENT la même tenue d'un plan à l'autre ; un même rôle a plusieurs identifiants selon le lieu
 * (narrateur de la rue, de la cuisine, du grenier…) avec une fenêtre d'existence : ainsi pas de téléportation visible.
 */
import type { V3 } from "../../geo";
import type { Tenue } from "../../avatar";
import { lisse } from "../../maths";
import { type Acteur, type Etape, type Habitant, type Mode, duree, evaluer } from "../../ville/foule";
import { CUISINE, GRENIER, PORTANT, SALON, SIEGES, TABLE_POLICE } from "./monde";
import * as P from "./poses";

type Mot = (s: number, k: number) => number;
const Y = 0.1; // niveau des trottoirs et de la cour
const [KX] = CUISINE;
const [GX] = GRENIER;
const [, , SZ] = SALON;

// ------------------------------------------------------------------ Tenues (apparence FIXE)
export const T_NARR: Tenue = { genre: "figurant", peau: "#EBC09A", haut: "#E0243E", bas: "#2F4A8C", chaussures: "#FFFFFF", cheveux: "#8A5A3A" };
export const T_MERE: Tenue = { genre: "figurant", peau: "#F0C8A0", haut: "#2FD3C4", bas: "#1FA89A", robe: "#2FD3C4", chaussures: "#C2283C", cheveux: "#5A3A28", bandeau: "#FF6FA5" };
export const T_PERE: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#6FB6E8", bas: "#3C3C48", chaussures: "#1B1B22", cheveux: "#3A2A1E" };
export const T_LEA: Tenue = { genre: "figurant", peau: "#EBC09A", haut: "#F6B81E", bas: "#F6B81E", robe: "#F6B81E", chaussures: "#E0223D", cheveux: "#3A2418" };
const PEAU = ["#E6B98F", "#C99873", "#EBC09A", "#B58463", "#F0C8A0"];
const T_POL = (i: number): Tenue => ({ genre: "figurant", peau: PEAU[(i * 2 + 1) % 5], haut: "#1F2F66", bas: "#1F2F66", chaussures: "#101014", cheveux: "#3A2A1E", casquette: "#1F2F66", manteau: "#1F2F66" });
const POP_HAUT = ["#FF6FA5", "#F6B81E", "#2FD3C4", "#FFFFFF", "#E0223D", "#C9B5E8"];
const POP_BAS = ["#FFFFFF", "#3C3C48", "#1F2F66", "#FF6FA5", "#2FD3C4", "#3C3C48"];
const T_PASSANT = (i: number): Tenue => ({
  genre: "figurant",
  peau: PEAU[i % 5],
  haut: POP_HAUT[i % 6],
  bas: POP_BAS[i % 6],
  chaussures: "#1B1B22",
  cheveux: ["#2A1C14", "#C9A15A", "#252525", "#7A3B22", "#9A9A9A"][i % 5],
  ...(i % 4 === 0 ? { bandeau: "#F6B81E" } : i % 4 === 1 ? { casquette: "#E0223D" } : i % 4 === 2 ? { robe: POP_HAUT[i % 6] } : { echarpe: "#E0223D" }),
});
const SAC = ["#E0223D", "#2FD3C4", "#F6B81E", "#FF6FA5"];
const T_ECOLIER = (i: number): Tenue => ({ genre: "figurant", peau: PEAU[(i + 2) % 5], haut: ["#6FB6E8", "#FF8FBA", "#FFDC7A", "#9BE9E0"][i % 4], bas: "#1F2F66", chaussures: "#FFFFFF", cheveux: ["#2A1C14", "#C9A15A", "#7A3B22", "#252525"][i % 4], sac: SAC[i % 4] });

// ------------------------------------------------------------------ Événements
export function evenements(mot: Mot): Record<string, number> {
  const flip0 = mot(4, 5);
  return {
    s4: mot(3, 0) - 0.1,
    s6: mot(5, 0) - 0.1,
    fouille: mot(0, 22),
    sort: mot(0, 25) + 0.15,
    cloche: mot(0, 27) + 0.1,
    detourne: mot(1, 4) - 0.05,
    couverts: mot(1, 16) + 0.1,
    vide: mot(1, 18),
    pars: mot(1, 21),
    entre: mot(2, 0),
    emb: mot(2, 6),
    compare: mot(2, 11) - 0.1,
    papier: mot(2, 15) + 0.1,
    flashLue: mot(2, 21),
    chaud: mot(2, 23),
    assiettes: mot(3, 10),
    ouvre: mot(4, 2) - 0.12,
    flip0,
    flip1: flip0 + 0.43,
    flip2: flip0 + 0.86,
    flip3: flip0 + 1.29,
    leve: mot(4, 12) + 0.15,
    retourne: mot(4, 18) - 0.05,
    t1a: mot(4, 22),
    t1b: mot(4, 28) + 0.35,
    t2a: mot(4, 29),
    t2b: mot(4, 30) + 0.55,
    fb0: mot(5, 5) - 0.06,
    mord: mot(5, 6) + 0.05,
    eff0: mot(5, 6) + 0.6,
    eff1: mot(5, 6) + 1.9,
    retour: mot(5, 16) - 0.06,
    burger: mot(5, 19),
    hesite: mot(5, 26),
  };
}

// ------------------------------------------------------------------ Aides
function chemin(id: string, tenue: Tenue, graine: number, t0: number, v: number, pts: V3[], mode: Mode, extra: Partial<Habitant> = {}): Habitant {
  const etapes: Etape[] = [{ t: t0, p: pts[0], mode }];
  let t = t0;
  for (let i = 1; i < pts.length; i++) {
    t += duree(pts[i - 1], pts[i], v);
    etapes.push({ t, p: pts[i], mode });
  }
  return { id, tenue, etapes, graine, ...extra };
}
const vers = (a: V3, b: V3) => Math.atan2(b[0] - a[0], b[2] - a[2]);
const fixe = (id: string, tenue: Tenue, graine: number, echelle: number, etapes: Etape[], extra: Partial<Habitant> = {}): Habitant => ({ id, tenue, graine, echelle, etapes, ...extra });

/** Fenêtres d'existence : en dehors, le personnage n'est pas dessiné (coupe de plan, jamais de pop à l'écran). */
export function fenetres(ev: Record<string, number>, mot: Mot, fin: number): Record<string, [number, number]> {
  const f: Record<string, [number, number]> = {};
  const s2 = mot(1, 0);
  const cuis0 = mot(1, 11) - 0.1;
  for (const id of ["nRue"]) f[id] = [s2 - 0.6, cuis0];
  for (const id of ["pa0", "pa1", "pa2", "pa3"]) f[id] = [s2 - 0.7, cuis0];
  for (const id of ["pol0", "pol1", "pol2", "ecF", "ec0", "ec1", "ec2"]) f[id] = [0, s2 + 0.2];
  for (let i = 0; i < 5; i++) f[`w${i}`] = [0, ev.retour - 0.05];
  for (const id of ["mere", "pere", "nCuis"]) f[id] = [cuis0, mot(2, 0) + 0.1];
  f.nGren = [mot(2, 0) - 1.2, mot(3, 5) + 0.1];
  for (const id of ["mere2", "pere2", "nCuis2"]) f[id] = [mot(3, 0) - 0.1, mot(4, 0)];
  f.nSalon = [mot(4, 0) - 0.5, mot(5, 0) + 0.05];
  f.nFb = [ev.fb0, ev.retour];
  f.lea = [ev.fb0, ev.retour];
  f.nFin = [ev.retour, fin + 5];
  return f;
}

export function habitants(mot: Mot): Habitant[] {
  const ev = evenements(mot);
  const out: Habitant[] = [];

  // ---------------- RUE : passants qui marchent (pop), puis le narrateur et les adultes qui détournent le regard
  const marcheurs: Array<[number, number, number]> = [[10.7, 52, -1], [-11.0, -70, 1], [11.3, 10, -1], [-10.4, 62, -1], [10.5, -90, 1]];
  marcheurs.forEach(([x, z0, sens], i) => out.push(chemin(`w${i}`, T_PASSANT(i + 6), i * 1.3, 0, 2.4, [[x, Y, z0], [x, Y, z0 + sens * 150]], "marche")));
  const nRue: V3 = [-10.2, Y, 12.5];
  const spots: V3[] = [[-6.9, 0.03, 14.3], [-6.7, 0.03, 10.9], [-8.7, Y, 15.8], [-8.7, Y, 9.4]];
  const parts: V3[] = [[-2.0, 0.03, 22], [-2.5, 0.03, 3], [-9.6, Y, 36], [3.0, 0.03, 12.5]];
  spots.forEach((p, i) => {
    out.push(
      fixe(`pa${i}`, T_PASSANT(i), i * 0.9 + 0.3, 1.0, [
        { t: -1, p, mode: "debout", ry: 0.5 + i, emotion: "neutre" },
        { t: mot(1, 0) - 0.3, p, mode: "debout", ry: vers(p, nRue), emotion: "attente" },
        { t: ev.detourne, p, mode: "debout", ry: vers(nRue, p) + (i % 2 ? 0.5 : -0.4), emotion: "neutre" },
        { t: ev.detourne + 0.5, p, mode: "marche", ry: vers(nRue, p) },
        { t: ev.detourne + 0.5 + duree(p, parts[i], 2.4), p: parts[i], mode: "debout" },
      ]),
    );
  });
  out.push(
    fixe("nRue", T_NARR, 0.7, 0.84, [
      { t: -1, p: nRue, mode: "debout", ry: Math.PI / 2, emotion: "curieux" },
      { t: mot(1, 4), p: nRue, mode: "debout", ry: Math.PI / 2, emotion: "inquiet" },
      { t: mot(1, 8), p: nRue, mode: "debout", ry: Math.PI / 2, emotion: "triste" },
    ]),
  );

  // ---------------- ÉCOLE : policiers à képi, écoliers fouillés
  const [tx, , tz] = TABLE_POLICE;
  out.push(
    fixe("pol0", T_POL(0), 0.4, 1.05, [{ t: -1, p: [tx + 1.9, Y, tz - 0.9], mode: "debout", ry: -Math.PI / 2, emotion: "resolu" }]),
    fixe("pol1", T_POL(1), 1.4, 1.05, [{ t: -1, p: [tx + 1.9, Y, tz + 1.4], mode: "debout", ry: -Math.PI / 2, emotion: "sinistre" }]),
    fixe("pol2", T_POL(2), 2.4, 1.05, [{ t: -1, p: [XG, Y, -43.2], mode: "debout", ry: -Math.PI / 2, emotion: "resolu" }]),
    fixe("ecF", T_ECOLIER(0), 0.9, 0.8, [{ t: -1, p: [tx - 2.0, Y, tz - 0.9], mode: "debout", ry: Math.PI / 2, emotion: "inquiet" }]),
  );
  for (let i = 0; i < 3; i++) out.push(fixe(`ec${i}`, T_ECOLIER(i + 1), i * 1.1, 0.8, [{ t: -1, p: [tx - 2.1 + (i % 2) * 0.5, Y, tz + 0.9 + i * 1.5], mode: "debout", ry: Math.PI, emotion: i === 1 ? "triste" : "neutre" }]));

  // ---------------- CUISINE (scène 2) : la mère mange, le père aussi, le narrateur interroge puis sort
  const siege = (p: V3, dz = 0): V3 => [p[0], 0, p[2] + dz];
  out.push(
    fixe("mere", T_MERE, 0.2, 1.0, [
      { t: -1, p: siege(SIEGES.mere, 0.15), mode: "assis", ry: 0, h: 1.5, emotion: "neutre", objet: "couverts" },
      { t: ev.couverts, p: siege(SIEGES.mere, 0.15), mode: "assis", ry: 0, h: 1.5, emotion: "inquiet", objet: "" },
      { t: ev.vide, p: siege(SIEGES.mere, 0.15), mode: "assis", ry: 0, h: 1.5, emotion: "vide", objet: "" },
    ]),
    fixe("pere", T_PERE, 0.9, 1.0, [{ t: -1, p: siege(SIEGES.pere, 0.15), mode: "assis", ry: 0, h: 1.5, emotion: "neutre", objet: "couverts" }]),
  );
  const pn: V3 = [KX + 3.9, 0, 0.2];
  const porte: V3 = [KX + 6.6, 0, 2.5];
  out.push(
    fixe("nCuis", T_NARR, 0.3, 0.84, [
      { t: -1, p: pn, mode: "debout", ry: vers(pn, SIEGES.mere), emotion: "inquiet" },
      { t: ev.vide, p: pn, mode: "debout", ry: vers(pn, SIEGES.mere), emotion: "triste" },
      { t: ev.pars, p: pn, mode: "debout", ry: vers(pn, porte), emotion: "resolu" },
      { t: ev.pars + duree(pn, porte, 3.3), p: porte, mode: "debout", ry: vers(pn, porte), emotion: "resolu" },
    ]),
  );

  // ---------------- GRENIER (scène 3) : le narrateur, le manteau
  const [PX, , PZ] = PORTANT;
  const devantManteau: V3 = [PX + 0.55, 0, PZ + 1.55];
  const cote: V3 = [PX + 1.75, 0, PZ + 1.3];
  const dep: V3 = [GX + 1.4, 0, 2.2];
  out.push(
    fixe("nGren", T_NARR, 0.5, 0.84, [
      { t: mot(2, 0) - 1.2, p: dep, mode: "marche", emotion: "curieux" },
      { t: mot(2, 0) - 1.2 + duree(dep, devantManteau, 2.6), p: devantManteau, mode: "debout", ry: vers(devantManteau, [PX + 0.4, 0, PZ - 0.5]), emotion: "curieux" },
      { t: ev.compare, p: devantManteau, mode: "marche", ry: vers(devantManteau, cote), emotion: "surpris" },
      { t: ev.compare + duree(devantManteau, cote, 2.6), p: cote, mode: "debout", ry: 0.45, emotion: "surpris", objet: "" },
      { t: ev.papier, p: cote, mode: "debout", ry: 0.3, emotion: "inquiet", objet: "" },
      { t: ev.chaud, p: cote, mode: "debout", ry: 0.3, emotion: "effraye", objet: "" },
      { t: mot(3, 0), p: cote, mode: "debout", ry: 0.3, emotion: "surpris", objet: "" },
    ]),
  );

  // ---------------- CUISINE (scène 4) : trois assis, une assiette de trop, la mère debout qui ne comprend pas
  const m2: V3 = [KX + 3.9, 0, 0.9];
  out.push(
    fixe("mere2", T_MERE, 1.2, 1.0, [
      { t: -1, p: m2, mode: "debout", ry: -1.59, emotion: "neutre" },
      { t: mot(3, 19), p: m2, mode: "debout", ry: -1.59, emotion: "curieux" },
      { t: mot(3, 22), p: m2, mode: "debout", ry: -1.59, emotion: "vide" },
    ]),
    fixe("pere2", T_PERE, 1.9, 1.0, [
      { t: -1, p: siege(SIEGES.pere, 0.15), mode: "assis", ry: 0, h: 1.5, emotion: "neutre" },
      { t: mot(3, 19), p: siege(SIEGES.pere, 0.15), mode: "assis", ry: 0, h: 1.5, emotion: "vide" },
    ]),
    fixe("nCuis2", T_NARR, 1.5, 0.84, [
      { t: -1, p: siege(SIEGES.narr, -0.1), mode: "assis", ry: Math.PI, h: 1.82, emotion: "inquiet" },
      { t: mot(3, 12), p: siege(SIEGES.narr, -0.1), mode: "assis", ry: Math.PI, h: 1.82, emotion: "surpris" },
      { t: mot(3, 25), p: siege(SIEGES.narr, -0.1), mode: "assis", ry: Math.PI, h: 1.82, emotion: "triste" },
    ]),
  );

  // ---------------- SALON (scène 5) : il feuillette l'album debout derrière la table basse
  const ns: V3 = [0, 0, SZ - 0.35];
  out.push(
    fixe("nSalon", T_NARR, 0.6, 0.84, [
      { t: -1, p: ns, mode: "debout", ry: 0, emotion: "curieux" },
      { t: ev.flip0, p: ns, mode: "debout", ry: 0, emotion: "inquiet" },
      { t: ev.leve, p: ns, mode: "debout", ry: 0, emotion: "surpris" },
      { t: ev.retourne, p: ns, mode: "debout", ry: 0, emotion: "larmes" },
    ]),
  );

  // ---------------- SOUVENIR (scène 6) : le petit narrateur de huit ans et Léa, à la table de la cuisine
  out.push(
    fixe("nFb", T_NARR, 2.1, 0.66, [
      { t: -1, p: siege(SIEGES.narr, -0.1), mode: "assis", ry: Math.PI, h: 2.35, emotion: "sourire" },
      { t: ev.eff0, p: siege(SIEGES.narr, -0.1), mode: "assis", ry: Math.PI, h: 2.35, emotion: "vide" },
    ]),
    fixe("lea", T_LEA, 2.6, 0.58, [
      { t: -1, p: siege(SIEGES.enfant, -0.05), mode: "assis", ry: Math.PI, h: 2.2, emotion: "sourire" },
      { t: ev.eff0, p: siege(SIEGES.enfant, -0.05), mode: "assis", ry: Math.PI, h: 2.2, emotion: "surpris" },
    ]),
  );

  // ---------------- PRÉSENT (fin) : le narrateur dans la rue décolorée, un burger dans la main
  out.push(
    fixe("nFin", T_NARR, 3.1, 0.84, [
      { t: -1, p: [0, 0.03, 6.0], mode: "debout", ry: 0, emotion: "triste", objet: "" },
      { t: mot(5, 23), p: [0, 0.03, 6.0], mode: "debout", ry: 0, emotion: "larmes", objet: "" },
    ]),
  );
  return out;
}
const XG = 13.8;

// ------------------------------------------------------------------ Retouches : lacets lissés, poses sur mesure, fenêtres d'existence
function ecart(a: number, b: number) {
  const d = (((b - a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  return d;
}
function lacetLisse(h: Habitant, T: number, a: Acteur): number {
  const e = h.etapes;
  let i = -1;
  for (let k = 0; k < e.length; k++) if (T >= e[k].t) i = k;
  if (i < 1) return a.ry;
  const s = e[i];
  const pr = e[i - 1];
  if (s.ry === undefined || T - s.t > 0.55 || Math.hypot(s.p[0] - pr.p[0], s.p[2] - pr.p[2]) > 0.05) return a.ry;
  const prev = evaluer(h, s.t - 0.001, 0);
  if (!prev) return a.ry;
  return prev.ry + ecart(prev.ry, s.ry) * lisse((T - s.t) / 0.55);
}

/** Applique les retouches à l'acteur évalué par le moteur (null = pas présent). */
export function retouche(h: Habitant, T: number, a: Acteur, ev: Record<string, number>, win: [number, number] | undefined): Acteur | null {
  if (win && (T < win[0] || T > win[1])) return null;
  const id = h.id;
  const r: Acteur = { ...a, ry: lacetLisse(h, T, a) };
  const pose = (p: P.Retouche) => {
    r.pose = { ...r.pose, ...p };
  };
  const g = h.graine;
  if (id === "pol0") {
    if (T >= ev.fouille && T < ev.sort) pose(P.fouille(T));
    else if (T >= ev.sort && T < ev.cloche) {
      pose(P.brandit());
      r.objet = "burger";
    } else if (T >= ev.cloche) pose(P.surTable());
    r.emotion = T >= ev.sort ? "resolu" : "colere";
  }
  if (id === "pol1") pose({ torse: 0, tete: [Math.sin(T * 0.8) * 0.5, 0] });
  if (id === "mere") {
    if (T < ev.couverts) pose(P.mange(T, g));
    else pose(P.poseCouverts());
  }
  if (id === "pere") pose(P.mange(T, g + 1));
  if (id === "nGren") {
    const k = Math.min(1, Math.max(0, (T - ev.emb) / 0.7));
    if (T >= ev.emb - 0.45 && T < ev.compare) {
      pose(P.tire(k));
      r.objet = T >= ev.emb ? "emballage" : "";
    } else if (T >= ev.compare && T < ev.papier) {
      r.objet = "emballage";
      pose({ brasD: { x: -0.6, z: -0.3, pli: -1.2 }, tete: [0.15, 0.1] });
    } else if (T >= ev.papier) {
      pose(P.lit());
      r.objet = "";
    }
  }
  if (id === "mere2") {
    if (T >= ev.assiettes) pose({ torse: 0.05, tete: [0, 0.3 + (T > ev.assiettes + 2.0 ? 0.1 : 0)] });
    if (T >= ev.assiettes + 2.0) pose(P.mainBouche());
  }
  if (id === "nSalon") {
    if (T < ev.leve) pose(P.feuillette(T));
    else pose(P.tientPhoto());
  }
  if (id === "nFb") {
    const k = Math.min(1, Math.max(0, (T - (ev.mord - 0.25)) / 0.3));
    if (T < ev.mord + 0.35) pose(P.mord(k));
    else pose({ torse: 0.04, tete: [0, 0.0] });
  }
  if (id === "nFin") {
    if (T < ev.hesite - 0.4) pose(P.burgerMain(T));
    else pose(P.versBouche(Math.min(1, (T - (ev.hesite - 0.4)) / 1.8)));
  }
  return r;
}
