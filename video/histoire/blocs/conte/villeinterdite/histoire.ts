/**
 * « Dans cette ville, personne n'a le droit de sortir depuis l'arrivée des géants… » — personnages et événements, tous calés sur les mots.
 * Repères [scène, mot] : histoires/recits/ville-interdite.json (scène 1 = indice 0) ; index : scripts/mots.ts ville-interdite.
 * Tout se passe sur UNE table : la ville (plateau y = 0), la boîte à jouets, le bord (z = 62) ; la cave est un diorama à x = -450.
 */
import type { V3 } from "../../geo";
import { type Pose, type Tenue, melPose, poseDebout } from "../../avatar";
import type { Emotion } from "../../textures";
import { type Acteur, type Etape, type Habitant, type Mode, duree } from "../../ville/foule";
import { borne, entre, freine, lisse, mel } from "../../maths";
import { BOUL, BORD_Z, CELLIER, CELLULES, LEO_BORD_X, LEO_MAISON, TRAPPE, TRAPPE2, TUNNEL, Y_TABLE } from "./monde";
import { poseAvertit, poseBord, poseChute, poseHaut, poseMalaxe, poseRange, poseRecule, poseSouleve } from "./poses";

type Mot = (s: number, k: number) => number;

// ------------------------------------------------------------------ Tenues (apparence FIXE)
export const T_LEO: Tenue = { genre: "figurant", peau: "#EDBB92", haut: "#F4C430", bas: "#3C5E98", chaussures: "#2A2A30", cheveux: "#7B5230" };
export const T_BOUL: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#6FA8DC", bas: "#5B4A3A", chaussures: "#3A2A20", cheveux: "#4A3022", tablier: "#FFFFFF" };
export const T_FACT: Tenue = { genre: "figurant", peau: "#D9AE8B", haut: "#E8821E", bas: "#2E3A58", chaussures: "#2A2A30", cheveux: "#3A2A1E", casquette: "#2A4A7A", sac: "#8C5A2B" };
const ADULTES: Tenue[] = [
  { genre: "figurant", peau: "#D9AE8B", haut: "#C8452F", bas: "#3A3A48", chaussures: "#2A2A30", cheveux: "#2A1E16", feutre: "#5A4632" },
  { genre: "figurant", peau: "#E6B98F", haut: "#2E6FB5", bas: "#4A4038", chaussures: "#2A2A30", cheveux: "#9A9A9A" },
  { genre: "figurant", peau: "#C99873", haut: "#4F9A6A", robe: "#4F9A6A", longs: "#5B3A8C", bas: "#3A3440", chaussures: "#2A2A30", cheveux: "#5B3A8C" },
  { genre: "figurant", peau: "#F0C8A0", haut: "#E8B22A", bas: "#3F4A58", chaussures: "#2A2A30", cheveux: "#C9A15A", lunettes: "#1B1B22" },
];
const GILETS = ["#C8452F", "#2E6FB5", "#4F9A6A", "#7A8BA8", "#8E5BB5", "#3FA0A8", "#D96A8A"];
const PEAUX = ["#E6B98F", "#C99873", "#D9AE8B", "#B58463", "#F0C8A0"];
const CHEV = ["#3A2A1E", "#C9A15A", "#252525", "#7A3B22", "#9A9A9A", "#5B3A8C"];
const villageois = (i: number): Tenue => ({ genre: "figurant", peau: PEAUX[i % 5], haut: GILETS[i % 7], bas: ["#3A3A48", "#4A4038", "#3F4A58"][i % 3], chaussures: "#2A2A30", cheveux: CHEV[(i * 5) % 6], ...(i % 4 === 1 ? { feutre: "#4A3A2A" } : {}) });

// ------------------------------------------------------------------ Aides
function chemin(id: string, tenue: Tenue, graine: number, t0: number, v: number, pts: V3[], mode: Mode, extra: Partial<Habitant> = {}, modeFin: Mode = mode, emotion?: Emotion): Habitant {
  const etapes: Etape[] = [];
  let t = t0;
  etapes.push({ t, p: pts[0], mode, emotion });
  for (let i = 1; i < pts.length; i++) {
    t += duree(pts[i - 1], pts[i], v);
    etapes.push({ t, p: pts[i], mode: i === pts.length - 1 ? modeFin : mode, emotion });
  }
  return { id, tenue, etapes, graine, ...extra };
}
const P3 = (x: number, z: number, y = 0): V3 => [x, y, z];

// ------------------------------------------------------------------ Événements (instants, en secondes)
export function evenements(mot: Mot): Record<string, number> {
  const leve = mot(0, 24) + 0.35; // le facteur est soulevé
  const saisit = mot(3, 10) - 0.05;
  const leve0 = mot(3, 13) + 0.3;
  const va1 = mot(3, 20) + 0.25;
  const pose1 = va1 + 0.1 + 0.65;
  const lache = pose1 + 0.15;
  return {
    sirFin: mot(1, 0) + 0.9, // la sirène s'éteint après la disparition
    leve, // soulevé par la pince
    ombreSol0: leve - 1.0,
    finRue: mot(1, 0) + 0.3, // plus de passants dans la rue
    fenetre0: mot(1, 0) - 0.7, // Léo à la fenêtre
    fenetre1: mot(1, 25) - 0.1, // il quitte la fenêtre
    sortLeo: mot(1, 25) - 0.06,
    apparLeo2: mot(1, 25) - 1.0,
    resolu: mot(1, 12) + 0.2,
    secousse0: mot(3, 2) - 0.1, // le sol tremble
    main0: mot(3, 5) - 0.25, // la main apparaît dans le ciel
    saisit,
    ferme1: saisit + 0.7,
    leve0,
    leve1: leve0 + 0.65,
    va0: mot(3, 14) + 0.2,
    va1,
    pose0: va1 + 0.1,
    pose1,
    lache,
    sort0: lache + 0.55,
    sort1: lache + 1.55,
    soir0: mot(4, 9) - 0.3, // « le soir » : la lumière baisse, la lampe rougeoie
    soir1: mot(4, 9) + 0.7,
    range0: mot(4, 9) - 0.05, // la pince range un disparu dans la boîte
    range1: mot(4, 13) + 0.3,
    marcheSort0: mot(4, 22) - 0.35, // un habitant « sort » de la ville
    chute0: mot(4, 27) - 0.1, // …et tombe de la table
    oeil0: mot(5, 4) - 0.28, // l'œil s'ouvre
    clin1: mot(5, 7) - 0.05,
    gronde: mot(5, 12),
    clin2: mot(5, 20) + 0.05,
    clin3: mot(5, 29) + 0.1, // clignement lent avant le noir
    fin: mot(5, 35) + 0.35,
  };
}

// ------------------------------------------------------------------ Boulangerie et main : positions pilotées par le temps (partagées avec le décor)
export function boulPos(T: number, ev: Record<string, number>) {
  const lift = lisse(entre(T, ev.leve0, ev.leve1));
  const move = lisse(entre(T, ev.va0, ev.va1));
  const bas = lisse(entre(T, ev.pose0, ev.pose1));
  const k = lift * (1 - bas);
  const tr = T > ev.secousse0 && T < ev.leve0 ? Math.sin(T * 63) * 0.07 * Math.min(1, (T - ev.secousse0) * 2) : 0;
  return { x: mel(BOUL.A[0], BOUL.B[0], move) + tr, y: 7.5 * k + Math.abs(tr) * 0.4, z: BOUL.A[1], rz: Math.sin(T * 5.1) * 0.035 * k, rx: Math.sin(T * 3.7) * 0.022 * k };
}
export function mainEtat(T: number, ev: Record<string, number>): { visible: boolean; p: V3; curl: number } {
  const b = boulPos(T, ev);
  const arrive = freine(entre(T, ev.main0, ev.saisit));
  const sortie = lisse(entre(T, ev.sort0, ev.sort1));
  const y = b.y + 9.05 + 72 * (1 - arrive) + 72 * sortie;
  const x = b.x + 16 * (1 - arrive) + 14 * sortie;
  const curl = lisse(entre(T, ev.saisit, ev.ferme1)) * (1 - lisse(entre(T, ev.lache, ev.lache + 0.5)));
  return { visible: T > ev.main0 - 0.05 && T < ev.sort1 + 0.1, p: [x, y, b.z], curl };
}
/** Pince qui range le facteur : de haut en bas dans la case 5 de la boîte. */
export const CASE_FACTEUR = 5;
export function rangement(T: number, ev: Record<string, number>): { visible: boolean; p: V3; ouv: number } {
  const c = CELLULES[CASE_FACTEUR];
  const k = lisse(entre(T, ev.range0, ev.range1));
  const sort = lisse(entre(T, ev.range1, ev.range1 + 0.5));
  const y = mel(26, c[1] + 1.8, k) + 40 * sort;
  return { visible: T > ev.range0 - 0.1 && T < ev.range1 + 0.6, p: [c[0], y, c[2]], ouv: sort };
}
/** Le facteur soulevé par la pince : position de sa taille. */
export function leveFacteur(T: number, ev: Record<string, number>): { visible: boolean; p: V3; ouv: number } {
  const dt = T - ev.leve;
  const y = dt > 0 ? 38 * (dt / 0.95) ** 2 : 0;
  const pa = ev.leve - 0.5;
  const descend = lisse(entre(T, ev.leve - 0.75, ev.leve));
  return { visible: T > pa - 0.3 && T < ev.leve + 1.4, p: [FACT_FIN[0], mel(60, 1.7, descend) + y, FACT_FIN[2]], ouv: 1 - descend };
}
const FACT_FIN: V3 = [2.5, 0, -2.0];

// ------------------------------------------------------------------ Habitants
export function habitants(mot: Mot): Habitant[] {
  const ev = evenements(mot);
  const out: Habitant[] = [];

  // ---------------- Scène 1 : la rue en panique (passants qui courent vers chez eux)
  const cour = (i: number, t0: number, pts: V3[], v: number, extra: Partial<Habitant> = {}) =>
    out.push(chemin(`r${i}`, villageois(i), i * 1.7, t0, v, pts, "course", { echelle: 0.96 + (i % 3) * 0.04, ...extra }, "course", "effraye"));
  cour(0, -1.0, [P3(-58, -1.8), P3(-8, -1.8), P3(-3.2, -14), P3(-3.2, -44)], 6.6);
  cour(1, 0.2, [P3(6, 2.2), P3(30, 2.2), P3(68, 2.2)], 6.8);
  cour(2, 0.0, [P3(-3.2, 46), P3(-3.2, 14), P3(-14, 3.0)], 6.5);
  cour(3, 0.5, [P3(-62, 26.5), P3(-6, 26.5), P3(3.2, 40)], 6.7);
  cour(4, 0.0, [P3(66, -26.5), P3(8, -26.5), P3(3.0, -10)], 6.5);
  cour(5, 0.8, [P3(-14, 3.6), P3(-46, 3.6)], 6.0, { echelle: 0.8 });
  cour(6, 0.4, [P3(1.8, -34), P3(1.8, -8), P3(14, -2.4)], 6.8);
  cour(7, 1.2, [P3(3.4, 8), P3(3.4, 44)], 6.6);
  // le facteur (orange, sacoche) : s'arrête, lève la tête, est soulevé
  const dist = Math.hypot(FACT_FIN[0] - -10, FACT_FIN[2] - -2.0);
  const tArr = ev.leve - 0.5;
  out.push({ id: "v0", tenue: T_FACT, graine: 0.9, echelle: 1.02, etapes: [{ t: tArr - dist / 4.2, p: P3(-10, -2.0), mode: "marche", emotion: "inquiet" }, { t: tArr, p: FACT_FIN, mode: "debout", ry: Math.PI / 2, emotion: "inquiet" }, { t: ev.leve - 0.12, p: FACT_FIN, mode: "debout", ry: Math.PI / 2, emotion: "surpris" }, { t: ev.leve, p: FACT_FIN, mode: "debout", ry: Math.PI / 2, emotion: "effraye" }] });

  // ---------------- La boulangère (pétrit, sereine) : sa position suit la boulangerie
  out.push({ id: "boul", tenue: T_BOUL, graine: 2.2, echelle: 1.0, sansClin: false, etapes: [{ t: -2, p: [BOUL.A[0] + 0.4, 0.52, BOUL.A[1] - 1.9], mode: "debout", ry: 0, emotion: "apaise" }] });

  // ---------------- Scène 2 : les adultes (visages graves) sur la place, Léo à la fenêtre
  const ad: Array<[number, number, number, Emotion]> = [[-3.6, 8.2, 0, "inquiet"], [-1.0, 9.8, 0, "resolu"], [1.6, 8.6, 0, "triste"], [4.2, 10.0, 0, "inquiet"]];
  ad.forEach(([x, z, ry, em], i) => out.push({ id: `a${i + 1}`, tenue: ADULTES[i], graine: i * 1.9 + 0.3, echelle: 1.02 + i * 0.01, etapes: [{ t: ev.fenetre0 - 0.4, p: P3(x, z), mode: "debout", ry, emotion: em }] }));
  const { x: lx, z: lz } = LEO_MAISON;
  const fen: V3 = [lx + 1.5, 0.9, LEO_MAISON.fenetreZ];
  out.push({
    id: "leo1",
    tenue: T_LEO,
    graine: 3.3,
    echelle: 0.8,
    etapes: [
      { t: ev.fenetre0, p: fen, mode: "debout", ry: Math.PI / 2, emotion: "inquiet" },
      { t: ev.resolu, p: fen, mode: "debout", ry: Math.PI / 2, emotion: "curieux" },
      { t: mot(1, 21), p: fen, mode: "debout", ry: Math.PI / 2, emotion: "resolu" },
    ],
  });
  // …puis Léo se glisse hors de la maison jusqu'à la trappe de la cave
  out.push({
    id: "leo2",
    tenue: T_LEO,
    graine: 3.7,
    echelle: 0.8,
    etapes: [
      { t: ev.apparLeo2, p: P3(-5.0, 47.2), mode: "debout", ry: -Math.PI / 2, emotion: "inquiet" },
      { t: ev.sortLeo, p: P3(-5.0, 47.2), mode: "marche", emotion: "inquiet" },
      { t: ev.sortLeo + 1.25, p: P3(TRAPPE[0] + 2.4, 49.4), mode: "marche", emotion: "inquiet" },
      { t: ev.sortLeo + 1.4, p: P3(TRAPPE[0] + 2.4, 49.4), mode: "debout", ry: 0, emotion: "resolu" },
    ],
  });

  // ---------------- Scène 3 : la cave (escalier, tunnel) puis le bord de la table
  const x0 = CELLIER.x0;
  out.push({
    id: "leo3",
    tenue: T_LEO,
    graine: 4.1,
    echelle: 0.8,
    etapes: [
      { t: mot(2, 0) - 0.9, p: [x0 + 3.3, 5.15, -1.0], mode: "debout", ry: Math.PI / 2, emotion: "inquiet" },
      { t: mot(2, 0) - 0.15, p: [x0 + 3.3, 5.15, -1.0], mode: "marche", emotion: "inquiet" },
      { t: mot(2, 0) + 0.75, p: [x0 + 8.05, 0.9, -1.0], mode: "marche", emotion: "inquiet" },
      { t: mot(2, 0) + 0.95, p: [x0 + 9.4, 0, -1.0], mode: "marche", emotion: "inquiet" },
    ],
  });
  const l4 = chemin("leo4", T_LEO, 4.4, mot(2, 6) - 0.1, 6.2, [[TUNNEL.x0 + 1.5, 0, 0], [TUNNEL.x1 - 2.5, 0, 0]], "course", { echelle: 0.8 }, "course", "effraye");
  l4.etapes.unshift({ t: mot(2, 6) - 0.9, p: [TUNNEL.x0 + 1.5, 0, 0], mode: "debout", ry: Math.PI / 2, emotion: "effraye" });
  out.push(l4);
  // le bord : il sort près de la barrière, marche jusqu'au rebord du plateau
  out.push({
    id: "leo5",
    tenue: T_LEO,
    graine: 4.8,
    echelle: 0.8,
    etapes: [
      { t: mot(2, 8) - 1.0, p: P3(TRAPPE2[0] + 2.6, TRAPPE2[2] + 0.4), mode: "debout", ry: 0, emotion: "inquiet" },
      { t: mot(2, 8) - 0.2, p: P3(TRAPPE2[0] + 2.6, TRAPPE2[2] + 0.4), mode: "marche", emotion: "inquiet" },
      { t: mot(2, 8) + 0.9, p: P3(LEO_BORD_X, 56.8), mode: "marche", emotion: "inquiet" },
      { t: mot(2, 12) - 0.2, p: [LEO_BORD_X, Y_TABLE, BORD_Z - 2.2], mode: "marche", emotion: "inquiet" },
      { t: mot(2, 12) + 0.15, p: [LEO_BORD_X, Y_TABLE, BORD_Z - 2.2], mode: "debout", ry: 0, emotion: "surpris" },
    ],
  });

  // ---------------- Scène 5 : les adultes, calmes, au pied de la barrière ; un habitant qui « sort »
  const bpos: Array<[number, number, Emotion]> = [[-2.6, 50.4, "apaise"], [-0.4, 51.8, "triste"], [1.8, 50.8, "apaise"], [4.4, 52.0, "triste"]];
  bpos.forEach(([x, z, em], i) => out.push({ id: `b${i + 1}`, tenue: ADULTES[(i + 1) % 4], graine: i * 2.3 + 1.1, echelle: 1.02, etapes: [{ t: mot(4, 0) - 0.8, p: P3(x, z), mode: "debout", ry: Math.PI, emotion: em }] }));
  const sx = 3.5;
  out.push({
    id: "sort",
    tenue: villageois(5),
    graine: 5.7,
    echelle: 1.0,
    etapes: [
      { t: mot(4, 0) - 0.8, p: P3(sx, 56.4), mode: "debout", ry: 0, emotion: "neutre" },
      { t: ev.marcheSort0, p: P3(sx, 56.4), mode: "debout", ry: 0, emotion: "neutre" },
      { t: ev.chute0, p: [sx, Y_TABLE, BORD_Z - 0.6], mode: "marche", emotion: "neutre" },
    ],
  });
  // le facteur rangé (apparaît dans la pince au moment du rangement), puis huit autres disparus immobiles
  out.push({ id: "d0", tenue: T_FACT, graine: 0.9, echelle: 0.92, sansClin: true, etapes: [{ t: ev.range0 - 0.2, p: [CELLULES[CASE_FACTEUR][0], CELLULES[CASE_FACTEUR][1], CELLULES[CASE_FACTEUR][2]], mode: "debout", ry: 0, emotion: "vide" }] });
  let n = 1;
  CELLULES.forEach((c, k) => {
    if (k === CASE_FACTEUR || k === 4 || k === 11 || k === 8) return;
    out.push({ id: `d${n}`, tenue: n % 3 === 0 ? ADULTES[n % 4] : villageois(n + 2), graine: n * 1.3, echelle: n % 4 === 2 ? 0.78 : 0.92, sansClin: true, etapes: [{ t: -3, p: [c[0], c[1], c[2]], mode: "debout", ry: 0, emotion: "vide" }] });
    n++;
  });
  return out;
}

// ------------------------------------------------------------------ Retouches : poses et positions pilotées par le temps
type Retouche = (T: number, a: Acteur) => Acteur | null;
const avec = (a: Acteur, pose: Pose, extra: Partial<Acteur> = {}): Acteur => ({ ...a, pose, ...extra });

export function retouches(mot: Mot, ev: Record<string, number>): Record<string, Retouche> {
  const r: Record<string, Retouche> = {};
  for (let i = 0; i <= 7; i++) r[`r${i}`] = (T, a) => (T > ev.finRue ? null : a);
  // le facteur : lève la tête, puis est soulevé par la pince
  r.v0 = (T, a) => {
    if (T > ev.leve + 1.0) return null;
    if (T < ev.leve - 0.5) return a;
    if (T < ev.leve) return avec(a, melPose(a.pose, poseHaut(T), lisse(borne((T - (ev.leve - 0.5)) / 0.25))));
    const dt = T - ev.leve;
    const y = 38 * (dt / 0.95) ** 2;
    return avec(a, poseSouleve(T), { p: [a.p[0], y, a.p[2]], emotion: "effraye" });
  };
  // la boulangère suit sa boulangerie et pétrit sans cesse
  r.boul = (T, a) => {
    const b = boulPos(T, ev);
    return avec(a, poseMalaxe(T), { p: [b.x + 0.4, 0.52 + b.y, b.z - 1.9], emotion: T > ev.va0 - 0.2 && T < ev.pose1 + 0.2 ? "apaise" : "apaise", rx: 0 });
  };
  // les adultes : consigne répétée (doigt levé), puis hors champ
  for (let i = 1; i <= 4; i++) r[`a${i}`] = (T, a) => (T > mot(2, 0) - 0.2 ? null : i === 1 && T > mot(1, 5) - 0.2 && T < mot(1, 12) ? avec(a, poseAvertit(T)) : i === 3 && T > mot(1, 9) && T < mot(1, 12) ? avec(a, poseAvertit(T + 1)) : a);
  r.leo1 = (T, a) => (T > ev.fenetre1 ? null : a);
  r.leo2 = (T, a) => (T > mot(2, 0) - 0.1 ? null : a);
  r.leo3 = (T, a) => (T > mot(2, 6) + 0.1 ? null : a);
  r.leo4 = (T, a) => (T > mot(2, 8) - 0.05 ? null : a);
  // le bord : il se penche sur le vide, regarde au loin, recule quand le sol tremble, se retourne vers l'œil
  r.leo5 = (T, a) => {
    const bord = a.p[2] > BORD_Z - 4 && T > mot(2, 12);
    if (T < mot(2, 12) + 0.1) return a;
    if (T < mot(2, 18)) return avec(a, poseDebout(T, 1.1), { emotion: "surpris" });
    if (T < mot(2, 23)) return avec(a, melPose(poseDebout(T, 1.1), poseBord(T), lisse(borne((T - mot(2, 18)) / 0.35))), { emotion: "effraye" });
    if (T < ev.secousse0 + 0.2) return avec(a, melPose(poseBord(T), poseDebout(T, 1.1), lisse(borne((T - mot(2, 23)) / 0.4))), { emotion: "surpris" });
    if (T < mot(4, 0)) {
      const k = lisse(borne((T - (ev.secousse0 + 0.2)) / 0.35));
      return avec(a, melPose(poseDebout(T, 1.1), poseRecule(T), k), { ry: mel(0, Math.PI, k), emotion: "effraye" });
    }
    if (T < mot(5, 0)) return avec(a, melPose(poseRecule(T), poseDebout(T, 1.1), lisse(borne((T - mot(4, 0)) / 0.5))), { ry: Math.PI, emotion: T > mot(4, 2) ? "resolu" : "surpris" });
    const k = lisse(borne((T - mot(5, 0)) / 0.5));
    void bord;
    return avec(a, melPose(poseDebout(T, 1.1), poseHaut(T), k), { ry: mel(Math.PI, 0, lisse(borne((T - mot(5, 0)) / 0.45))), emotion: T > ev.oeil0 ? "effraye" : "surpris" });
  };
  // l'habitant qui sort : tombe de la table
  r.sort = (T, a) => {
    if (T < ev.chute0) return a;
    const dt = T - ev.chute0;
    if (dt > 1.6) return null;
    return avec(a, poseChute(T), { p: [a.p[0] + 0.5 * dt, Y_TABLE - 0.5 * 85 * dt * dt, BORD_Z - 0.6 + 2.0 * dt], rx: -2.4 * dt, emotion: "effraye" });
  };
  // les disparus : raides, yeux ouverts, immobiles ; le facteur est déposé par la pince
  const fige = (T: number, a: Acteur) => avec(a, poseRange(), { emotion: "vide" });
  for (let i = 0; i <= 12; i++) if (i !== 0) r[`d${i}`] = (T, a) => fige(T, a);
  r.d0 = (T, a) => {
    if (T < ev.range0) return null;
    const c = CELLULES[CASE_FACTEUR];
    const k = lisse(entre(T, ev.range0, ev.range1));
    return avec(a, T < ev.range1 ? poseSouleve(T * 0.4) : poseRange(), { p: [c[0], mel(26, c[1], k), c[2]], emotion: T < ev.range1 ? "effraye" : "vide" });
  };
  return r;
}
