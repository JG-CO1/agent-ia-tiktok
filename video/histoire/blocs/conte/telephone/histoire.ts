/**
 * « Chaque fois que je regarde mon téléphone… » — personnages et événements, tous calés sur les mots du récit.
 * Repères [scène, mot] : voir histoires/recits/telephone.json (scène 1 = indice 0).
 *  - Noa (15 ans, ne vieillit JAMAIS), Lila (3 âges), papa (3 états), grand-mère, la vieille Lila : personnages
 *    « scénarisés » (clés de pose + fenêtres de présence) : chaque âge est un personnage distinct, de mêmes couleurs de base ;
 *  - passants de 2085 et Noa dans la rue : habitants du moteur (marche, course).
 */
import type { V3 } from "../../geo";
import { type Pose, type Tenue, melPose, poseAssise, poseDebout } from "../../avatar";
import type { Emotion } from "../../textures";
import { type Acteur, type Etape, type Habitant, duree, evaluer } from "../../ville/foule";
import { borne, lisse, mel } from "../../maths";
import { CH, CH_W, PERRON_Y, PORTE_CH, SA } from "./monde";

type Mot = (s: number, k: number) => number;

export const T_NOA: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#1F5240", bas: "#27303F", chaussures: "#E6E6EE", cheveux: "#4A3022" };
export const T_LILA1: Tenue = { genre: "figurant", peau: "#F0C8A0", haut: "#F6F0E4", bas: "#F2C230", chaussures: "#B8483C", cheveux: "#6A3B1E", tablier: "#F2C230" };
export const T_LILA2: Tenue = { genre: "figurant", peau: "#F0C8A0", haut: "#F2C230", bas: "#3C4F7A", chaussures: "#F6F0E4", cheveux: "#6A3B1E" };
export const T_LILA3: Tenue = { genre: "dame", peau: "#E8C8A4", haut: "#5B4A6E", bas: "#4A4458", chaussures: "#2A2A30", cheveux: "#F0F0F0", bas2: "#B3A398" };
const T_PAPA = (cheveux: string): Tenue => ({ genre: "figurant", peau: "#D9AE8B", haut: "#3E6EA8", bas: "#2E3340", chaussures: "#16161A", cheveux });
export const T_GM: Tenue = { genre: "dame", peau: "#E2BC98", haut: "#7B6AA0", bas: "#4A4458", chaussures: "#3A2E2A", cheveux: "#EDEDED", bas2: "#B3A398", lunettes: "#CFCFD6" };

const mb = (x = 0, z = 0, pli = 0) => ({ x, z, pli });

// ------------------------------------------------------------------ Événements : chaque instant est calculé sur un mot
export function evenements(mot: Mot): Record<string, number> {
  return {
    notif0: mot(0, 4) + 0.05, // « regarde » : la notification tombe
    rep0: mot(0, 19) - 0.05, // « en » : il répond
    b1: mot(0, 24) + 0.45, // premier battement : 2025 → 2026
    b2: mot(1, 7) - 0.1, // « devenue » : Lila grandit
    notif2: mot(1, 14), // « autre message »
    b3: mot(1, 16), // « et » : papa grisonne
    b4: mot(1, 22) - 0.12, // « blancs » : papa a les cheveux blancs
    video0: mot(2, 0) - 0.1, // la vidéo de trente secondes
    b5: mot(2, 10) + 0.05, // « vide » : le fauteuil
    spin0: mot(2, 15), // « pendant que je regarde l'écran… »
    spin1: mot(2, 24) - 0.1,
    eteint: mot(3, 1) + 0.12, // « éteint le téléphone »
    porteOuv: mot(3, 4) - 0.12, // « et j'ai couru dehors »
    porteFerme: mot(3, 4) + 0.8,
    dame: mot(3, 15) - 0.3, // la vieille dame apparaît sur le perron
    rallume: mot(5, 3) - 0.05, // « rallumé »
    msg: mot(5, 8), // « Plus personne ne t'attend. »
    dameTourne: mot(5, 13) + 0.05,
    porte2: mot(5, 14) + 0.2, // elle ouvre la porte
    dameEntre: mot(5, 19),
    porte3: mot(5, 20) - 0.05, // la porte se ferme
    porteClose: mot(5, 20) + 0.45,
  };
}

// ------------------------------------------------------------------ Poses propres à cette vidéo
/** Assis, les deux mains sur le téléphone tenu devant la poitrine, tête penchée (bras calculés par cinématique directe). */
export function poseTelAssis(T: number, h: number, g = 0): Pose {
  const p = poseAssise(T, h);
  const r = Math.sin(T * 1.6 + g) * 0.012;
  p.torse = -0.06;
  p.tete = [Math.sin(T * 0.5 + g) * 0.04, 0.22];
  p.brasG = mb(-0.775 + r, -0.605, -0.718);
  p.brasD = mb(-0.768 - r, -0.606, -0.73);
  p.jambeG = mb(-1.45, 0.04, 1.3);
  p.jambeD = mb(-1.45, -0.04, 1.3);
  return p;
}
/** Assis, immobile, regard fixe (le monde défile) : bras sur les genoux. */
export function poseAssisFige(T: number, h: number, g = 0): Pose {
  const p = poseAssise(T, h);
  p.tete = [Math.sin(T * 0.4 + g) * 0.03, 0.05];
  return p;
}
/** Debout, qui salue de la main droite. */
export function poseSalue(T: number): Pose {
  return { y: 0, torse: 0, tete: [0, 0], jambeG: mb(-0.05, 0.06), jambeD: mb(0.05, 0.06), brasG: mb(-0.04, 0.06), brasD: mb(-2.5 + Math.sin(T * 7) * 0.22, -0.2, -0.3) };
}
/** Debout, une main sur l'encadrement de la porte. */
export function poseAppuye(T: number, g = 0): Pose {
  const r = Math.sin(T * 1.3 + g) * 0.02;
  return { y: 0, torse: 0.02, tete: [0.04, 0.02], jambeG: mb(-0.05, 0.07), jambeD: mb(0.1, 0.07), brasG: mb(-0.1 + r, 0.08, -0.1), brasD: mb(-0.85, -0.15, -0.95) };
}
/** Debout, voûtée, appuyée sur une canne tenue de la main droite (un peu devant elle). */
export function poseCanne(T: number, g = 0): Pose {
  const r = Math.sin(T * 1.1 + g) * 0.02;
  return { y: -0.02, torse: 0.14, tete: [Math.sin(T * 0.35 + g) * 0.05, 0.1], jambeG: mb(-0.04, 0.07), jambeD: mb(0.04, 0.07), brasG: mb(-0.1 + r, 0.08, -0.15), brasD: mb(-0.45, -0.1, -0.3) };
}
/** Debout, le téléphone éteint pendu au bout du bras, tête basse puis relevée. */
export function poseTelPendu(T: number, g = 0): Pose {
  const r = Math.sin(T * 1.4 + g) * 0.02;
  return { y: 0, torse: 0.05, tete: [Math.sin(T * 0.5 + g) * 0.05, 0.08], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(-0.1 + r, 0.08, -0.1), brasD: mb(-0.22, -0.12, -0.55) };
}
/** Debout, le téléphone relevé devant lui, tenu d'une main (le message s'affiche). */
export function poseTelLeve(T: number, g = 0): Pose {
  const r = Math.sin(T * 1.8 + g) * 0.01;
  return { y: 0, torse: 0.04, tete: [0, 0.24], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(-0.1, 0.08, -0.1), brasD: mb(-1.0 + r, -0.16, -1.15) };
}

// ------------------------------------------------------------------ Personnages scénarisés
type Cle = { t: number; p: V3; ry: number; rx?: number; pose: (T: number) => Pose; emotion: Emotion; objet?: string; fondu?: number };
export type Script = { tenue: Tenue; echelle: number; graine: number; sansClin?: boolean; cles: Cle[]; presence: Array<[number, number]> };
const FIN = 999;

const POSTE_NOA: V3 = [CH[0] - 1.92, 0, 1.9]; // assis au bord du lit, tourné vers +x
const H_LIT = 0.8; // hauteur du bassin au-dessus du sol (échelle 1) : dessus du matelas + une demi-cuisse
const POSTE_CANAPE: V3 = [SA[0] - 0.3, 0, 3.4];
const H_CANAPE = 1.02;
export const POSTE_PORTE: V3 = [CH[0] + CH_W - 0.6, 0, (PORTE_CH.z0 + PORTE_CH.z1) / 2]; // dans l'embrasure, en face de Noa
export const FAUTEUIL: V3 = [SA[0] + 3.3, 0, -0.9];
const RY_FAUTEUIL = -Math.PI * 0.75;
export const H_FAUTEUIL = 1.0;

export function scripts(mot: Mot, ev: Record<string, number>): Record<string, Script> {
  const fin = mot(5, 24) + 0.6;
  const noa: Cle[] = [
    { t: -1, p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "neutre", objet: "tel2" },
    { t: mot(0, 6), p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "inquiet", objet: "tel2" },
    { t: mot(0, 10), p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "triste", objet: "tel2" },
    { t: mot(0, 19), p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "curieux", objet: "tel2" },
    { t: ev.b1, p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "surpris", objet: "tel2" },
    { t: ev.b1 + 0.9, p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "inquiet", objet: "tel2" },
    { t: ev.b2, p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "surpris", objet: "tel2" },
    { t: mot(1, 10), p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "effraye", objet: "tel2" },
    { t: mot(1, 13), p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "inquiet", objet: "tel2" },
    { t: ev.b4, p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "effraye", objet: "tel2" },
    { t: mot(1, 23), p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "triste", objet: "tel2" },
    { t: mot(1, 28), p: POSTE_NOA, ry: Math.PI / 2, pose: (T) => poseTelAssis(T, H_LIT, 0), emotion: "triste", objet: "tel2" },
    // salon : sur le canapé, face à la télé éteinte
    { t: ev.video0 - 0.6, p: POSTE_CANAPE, ry: Math.PI, pose: (T) => poseTelAssis(T, H_CANAPE, 1), emotion: "neutre", objet: "tel2" },
    { t: ev.b5, p: POSTE_CANAPE, ry: Math.PI, pose: (T) => poseTelAssis(T, H_CANAPE, 1), emotion: "surpris", objet: "tel2" },
    { t: mot(2, 12), p: POSTE_CANAPE, ry: Math.PI, pose: (T) => poseTelAssis(T, H_CANAPE, 1), emotion: "effraye", objet: "tel2" },
    { t: mot(2, 17), p: POSTE_CANAPE, ry: Math.PI, pose: (T) => poseTelAssis(T, H_CANAPE, 1), emotion: "larmes", objet: "tel2" },
    { t: ev.eteint - 0.1, p: POSTE_CANAPE, ry: Math.PI, pose: (T) => poseTelAssis(T, H_CANAPE, 1), emotion: "triste", objet: "tel2" },
    { t: ev.eteint + 0.5, p: POSTE_CANAPE, ry: Math.PI, pose: (T) => poseAssisFige(T, H_CANAPE, 1), emotion: "resolu", objet: "tel1" },
  ];
  const lilaPose = (T: number) => poseSalue(T);
  const lila1: Cle[] = [
    { t: mot(0, 6), p: [POSTE_PORTE[0], 0, POSTE_PORTE[2] - 0.7], ry: -Math.PI / 2, pose: lilaPose, emotion: "sourire" },
    { t: ev.b2 - 0.8, p: [POSTE_PORTE[0], 0, POSTE_PORTE[2] - 0.7], ry: -Math.PI / 2, pose: (T) => poseDebout(T, 0.3), emotion: "sourire" },
  ];
  const lila2: Cle[] = [
    { t: ev.b2, p: [POSTE_PORTE[0], 0, POSTE_PORTE[2] - 0.7], ry: -Math.PI / 2, pose: (T) => poseDebout(T, 0.9), emotion: "neutre" },
    { t: mot(1, 12), p: [POSTE_PORTE[0], 0, POSTE_PORTE[2] - 0.7], ry: -Math.PI / 2, pose: (T) => poseAppuye(T, 0.5), emotion: "inquiet" },
  ];
  const papa = (): Cle[] => [
    { t: mot(1, 13) - 0.1, p: [POSTE_PORTE[0] + 0.1, 0, POSTE_PORTE[2] + 0.75], ry: -Math.PI / 2, pose: (T) => poseAppuye(T, 1.4), emotion: "neutre" },
    { t: mot(1, 20), p: [POSTE_PORTE[0] + 0.1, 0, POSTE_PORTE[2] + 0.75], ry: -Math.PI / 2, pose: (T) => poseAppuye(T, 1.4), emotion: "triste" },
  ];
  const gm: Cle[] = [
    { t: ev.video0 - 0.7, p: FAUTEUIL, ry: RY_FAUTEUIL, pose: (T) => ({ ...poseAssise(T, H_FAUTEUIL), tete: [0.15 + Math.sin(T * 0.4) * 0.06, 0.1] }), emotion: "apaise" },
  ];
  const dame: Cle[] = [
    { t: ev.dame, p: [0.0, PERRON_Y, 1.2], ry: 0, pose: (T) => poseCanne(T, 0.4), emotion: "apaise", objet: "canne" },
    { t: mot(4, 17), p: [0.0, PERRON_Y, 1.2], ry: 0, pose: (T) => poseCanne(T, 0.4), emotion: "larmes", objet: "canne" },
    { t: ev.dameTourne, p: [0.0, PERRON_Y, 1.2], ry: 0, pose: (T) => poseCanne(T, 0.4), emotion: "apaise", objet: "canne" },
    { t: ev.dameTourne + 0.55, p: [0.0, PERRON_Y, 1.2], ry: Math.PI, pose: (T) => poseCanne(T, 0.4), emotion: "apaise", objet: "canne", fondu: 0.5 },
    { t: ev.porte2 + 0.2, p: [0.0, PERRON_Y, 1.2], ry: Math.PI, pose: (T) => poseCanne(T, 0.4), emotion: "apaise", objet: "canne" },
    { t: ev.porte2 + 0.9, p: [0.0, PERRON_Y, -0.5], ry: Math.PI, pose: (T) => poseCanne(T + 1, 0.4), emotion: "apaise", objet: "canne", fondu: 0.7 },
    { t: ev.porte2 + 1.4, p: [0.0, PERRON_Y, -1.6], ry: Math.PI, pose: (T) => poseCanne(T + 1, 0.4), emotion: "apaise", objet: "canne", fondu: 0.5 },
  ];
  return {
    noa: { tenue: T_NOA, echelle: 0.95, graine: 0.3, cles: noa, presence: [[0, ev.eteint + 1.5]] },
    lila1: { tenue: T_LILA1, echelle: 0.75, graine: 0.7, cles: lila1, presence: [[mot(0, 6), ev.b2]] },
    lila2: { tenue: T_LILA2, echelle: 0.92, graine: 1.1, cles: lila2, presence: [[ev.b2, mot(2, 0)]] },
    papa1: { tenue: T_PAPA("#1E1A1A"), echelle: 1.1, graine: 1.7, cles: papa(), presence: [[mot(1, 13) - 0.1, ev.b3]] },
    papa2: { tenue: T_PAPA("#8E8E94"), echelle: 1.1, graine: 1.7, cles: papa(), presence: [[ev.b3, ev.b4]] },
    papa3: { tenue: T_PAPA("#F0F0F0"), echelle: 1.1, graine: 1.7, cles: papa(), presence: [[ev.b4, mot(2, 0)]] },
    gm: { tenue: T_GM, echelle: 1.0, graine: 2.3, cles: gm, presence: [[ev.video0 - 0.7, ev.b5]] },
    lila3: { tenue: T_LILA3, echelle: 0.92, graine: 0.7, cles: dame, presence: [[ev.dame, fin + 3]] },
  };
}
/** Personnages scénarisés, dans l'ordre de dessin. */
export const IDS_SCRIPTS = ["noa", "lila1", "lila2", "papa1", "papa2", "papa3", "gm", "lila3"];

type Etat = { p: V3; ry: number; rx: number; pose: Pose; emotion: Emotion; objet?: string };
const etatCle = (c: Cle, T: number): Etat => ({ p: c.p, ry: c.ry, rx: c.rx ?? 0, pose: c.pose(T), emotion: c.emotion, objet: c.objet });
const mel3 = (a: V3, b: V3, k: number): V3 => [mel(a[0], b[0], k), mel(a[1], b[1], k), mel(a[2], b[2], k)];
/** Évalue un personnage scénarisé : clé active, fondu depuis la précédente. */
export function evaluerScript(s: Script, T: number): Acteur | null {
  if (s.presence.length && !s.presence.some(([a, b]) => T >= a && T < b)) return null;
  let i = -1;
  for (let k = 0; k < s.cles.length; k++) if (s.cles[k].t <= T) i = k;
  if (i < 0) return null;
  const cur = etatCle(s.cles[i], T);
  let e = cur;
  const f = s.cles[i].fondu ?? 0;
  if (i > 0 && f > 0 && T < s.cles[i].t + f) {
    const prev = etatCle(s.cles[i - 1], T);
    const k = lisse(borne((T - s.cles[i].t) / f));
    e = { p: mel3(prev.p, cur.p, k), ry: mel(prev.ry, cur.ry, k), rx: mel(prev.rx, cur.rx, k), pose: melPose(prev.pose, cur.pose, k), emotion: cur.emotion, objet: cur.objet };
  }
  let objet = e.objet;
  if (objet === undefined) for (let k = i; k >= 0; k--) if (s.cles[k].objet !== undefined) { objet = s.cles[k].objet; break; }
  return { p: e.p, ry: e.ry, rx: e.rx, pose: e.pose, emotion: e.emotion, tenue: s.tenue, graine: s.graine, echelle: s.echelle, fantome: false, sansClin: !!s.sansClin, clinRapide: false, objet: objet || undefined };
}

// ------------------------------------------------------------------ Habitants du moteur : Noa dans la rue, passants de 2085
const VIVES = ["#E5338E", "#18C5B8", "#FFC21A", "#8A4DFF", "#FF6B3A", "#3AA0FF", "#7CD64A"];
const PASSANTS: Tenue[] = [
  { genre: "figurant", peau: "#C99873", haut: "#FF4FA3", bas: "#1C2B4A", chaussures: "#FFFFFF", cheveux: "#2EE6D6", bandeau: "#FFD23A" },
  { genre: "figurant", peau: "#F0C8A0", haut: "#FFD23A", bas: "#5B2BC9", chaussures: "#1A1A22", cheveux: "#1A1A22", casquette: "#2EE6D6" },
  { genre: "figurant", peau: "#B58463", haut: "#3AA0FF", bas: "#F3F3F3", chaussures: "#E5338E", cheveux: "#F5F5F5", manteau: "#E5338E", lunettes: "#BFF7FF" },
  { genre: "figurant", peau: "#E6B98F", haut: "#7CD64A", bas: "#2A2A3A", chaussures: "#FF6B3A", cheveux: "#FF6B3A", echarpe: "#FFFFFF" },
  { genre: "figurant", peau: "#D9AE8B", haut: "#8A4DFF", bas: "#FFD23A", chaussures: "#FFFFFF", cheveux: "#3A2A1E", chapeau: "#FF4FA3" },
  { genre: "figurant", peau: "#F0C8A0", haut: "#FFFFFF", bas: "#18C5B8", chaussures: "#8A4DFF", cheveux: "#8A4DFF", capuche: "#FF6B3A" },
  { genre: "figurant", peau: "#C99873", haut: "#18C5B8", bas: "#FF4FA3", chaussures: "#1A1A22", cheveux: "#252525", casquette: "#FFC21A" },
];
/** Passant qui traverse l'écran à vitesse constante : atteint x = 0 à l'instant `tC`. */
function passant(id: string, i: number, tC: number, sens: 1 | -1, z: number, v: number, echelle = 1): Habitant {
  const L = 140;
  const t0 = tC - L / v;
  const pts: V3[] = [[-sens * L, 0, z], [sens * L, 0, z]];
  const etapes: Etape[] = [
    { t: t0, p: pts[0], mode: "marche" },
    { t: tC + L / v, p: pts[1], mode: "marche" },
  ];
  return { id, tenue: PASSANTS[i % PASSANTS.length], etapes, graine: i * 1.7, echelle };
}

export function habitants(mot: Mot): Habitant[] {
  const ev = evenements(mot);
  const out: Habitant[] = [];
  // Noa dans la rue : sort de chez lui en courant, s'arrête sur le trottoir, regarde autour de lui, puis marche vers le perron
  const tSort = ev.porteOuv + 0.35;
  const aPied = (t: number, p: V3, mode: "course" | "marche" | "debout", ry?: number, emotion?: Emotion, objet?: string): Etape => ({ t, p, mode, ry, emotion, objet });
  const D1: V3 = [0.0, PERRON_Y, 0.6];
  const D2: V3 = [0.2, 0, 9.4];
  const tArr = tSort + duree(D1, D2, 6.5);
  out.push({
    id: "noaR",
    tenue: T_NOA,
    graine: 0.3,
    echelle: 0.95,
    etapes: [
      aPied(tSort, D1, "course", undefined, "effraye", "tel1"),
      aPied(tArr, D2, "debout", undefined, "surpris"),
      aPied(tArr + 0.9, D2, "debout", 0.5, "surpris"),
      aPied(mot(3, 8) + 0.1, D2, "debout", -0.6, "effraye"),
      aPied(mot(3, 12) + 0.4, D2, "debout", 0.4, "surpris"),
      aPied(mot(3, 15) + 0.35, D2, "debout", Math.PI, "effraye"),
      aPied(mot(3, 17) + 0.1, D2, "debout", Math.PI, "inquiet"),
      aPied(mot(4, 0) - 0.4, [0.2, 0, 6.2], "marche", Math.PI, "inquiet"),
      aPied(mot(4, 0) + 0.2, [0.2, 0, 6.2], "debout", Math.PI, "inquiet"),
      aPied(mot(4, 13), [0.2, 0, 6.2], "debout", Math.PI, "effraye"),
      aPied(mot(4, 17), [0.2, 0, 6.2], "debout", Math.PI, "vide"),
      aPied(ev.rallume, [0.2, 0, 6.2], "debout", Math.PI, "surpris"),
      aPied(ev.msg + 0.4, [0.2, 0, 6.2], "debout", Math.PI, "triste"),
      aPied(ev.msg + 1.5, [0.2, 0, 6.2], "debout", Math.PI, "larmes"),
    ],
  });
  // passants : en deux sens, sur les deux trottoirs
  const tC = [35.5, 35.95, 36.15, 38.0, 39.0, 34.8, 40.6, 42.4, 44.6, 46.0];
  const cfg: Array<[number, 1 | -1, number, number, number]> = [
    [0, 1, 7.4, 3.0, 1.0],
    [1, 1, 7.0, 3.0, 1.0],
    [2, -1, 7.8, 3.2, 1.0],
    [3, -1, 18.8, 3.1, 1.0],
    [4, 1, 19.2, 2.4, 0.8],
    [5, 1, 8.2, 3.4, 1.0],
    [6, -1, 19.6, 3.0, 1.0],
    [0, -1, 9.8, 3.1, 1.0],
    [3, 1, 9.7, 3.3, 1.0],
    [5, -1, 19.0, 3.0, 1.0],
  ];
  cfg.forEach(([i, s, z, v, e], k) => out.push(passant(`pass${k}`, i, tC[k], s, z, v, e)));
  return out;
}
export const IDS_PASSANTS = Array.from({ length: 10 }, (_, k) => `pass${k}`);

/** Voitures de 2085 : [instant où elle passe en x = 0, sens, z (voie), vitesse, couleur]. */
export const VOITURES: Array<[number, 1 | -1, number, number, number]> = [
  [30.0, -1, 12.2, 13, 6],
  [33.9, 1, 15.9, 13, 0],
  [34.1, -1, 12.1, 12, 1],
  [34.9, 1, 15.6, 15, 2],
  [35.9, -1, 12.4, 13, 3],
  [38.5, 1, 15.9, 12, 4],
  [41.0, -1, 12.2, 14, 5],
  [44.0, 1, 15.8, 13, 6],
  [47.0, -1, 12.3, 12, 0],
  [50.0, 1, 15.9, 13, 2],
];
void VIVES;
void evaluer;
