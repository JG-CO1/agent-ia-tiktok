/**
 * « Dans cette ville, personne n'a le droit de sortir depuis trois ans… » — personnages et événements, tous calés sur les mots.
 * Repères [scène, mot] : histoires/recits/interdit-sortir.json (scène 1 = indice 0) ; index : scripts/mots.ts interdit-sortir.
 * Lieux : EXT (ville A en z > 0, vallée, ville jumelle B = miroir exact de A : z' = -66 - z), TOUR (intérieur), CUISINE.
 * Les habitants de B sont les « jumeaux » de ceux de A (mêmes tenues, positions miroir, lacet π − ry).
 */
import type { V3 } from "../../geo";
import { type Pose, type Tenue, melPose, poseDebout } from "../../avatar";
import type { Emotion } from "../../textures";
import { type Acteur, type Etape, type Habitant, type Mode, duree } from "../../ville/foule";
import { borne, lisse, mel } from "../../maths";
import { poseAssis as poseAssisBase } from "../poses";
import { CUISINE, GATE_X, HW, PLAT_Y, SOMMET_ECHELLE, TOUR_INT, ZB, ECHELLE_X, posMarche, mir, ryMir } from "./monde";
import { poseAbattu, poseBaisse, poseEchelle, poseJumelles, posePancarte, posePanique, posePenche, poseParle, poseSigne, poseSursaut, poseTient } from "./poses";

type Mot = (s: number, k: number) => number;

// ------------------------------------------------------------------ Tenues (apparence FIXE)
const COIFFE_GRIS = "#8E8E96";
/** Le narrateur : manteau rouge brique, bonnet gris (dessiné par le décor), jumelles de cuivre. */
export const T_NARR: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#A5432C", bas: "#3E3A46", chaussures: "#2A2A30", cheveux: "#4A3022", manteau: "#8E3624" };
/** Le garçon d'en face : EXACTEMENT la même silhouette, manteau vert, même bonnet gris. */
export const T_JUMEAU: Tenue = { ...T_NARR, haut: "#3F7A4A", manteau: "#2F6038" };
/** Le père : manteau bleu, barbe (dessinée par le décor), regard fatigué. */
export const T_PERE: Tenue = { genre: "figurant", peau: "#D9AE8B", haut: "#35568E", bas: "#2E2E3A", chaussures: "#2A2A30", cheveux: "#3A2A20", manteau: "#2D4A7C" };
export { COIFFE_GRIS };

const PEAU = ["#E6B98F", "#C99873", "#D9AE8B", "#B58463", "#F0C8A0"];
const CHEV = ["#3A2A1E", "#C9A15A", "#252525", "#7A3B22", "#9A9A9A", "#5B3A8C"];
const MANT = ["#6B5A48", "#4F5A6B", "#6E4F4F", "#5A6E55", "#7A6A55", "#4B4B5A"];
const MANT2 = ["#574A3B", "#3F4958", "#5B4141", "#485A45", "#665846", "#3E3E4B"];
/** Habitant de la ville fermée : manteau terne, masque de tissu (dessiné par le décor). */
const habitant = (i: number): Tenue => ({
  genre: "figurant",
  peau: PEAU[i % 5],
  haut: MANT[i % 6],
  bas: "#3A3440",
  chaussures: "#2A2A30",
  cheveux: CHEV[(i * 5) % 6],
  manteau: MANT2[i % 6],
  ...(i % 4 === 1 ? { capuche: "#4A4038" } : {}),
  ...(i % 5 === 2 ? { feutre: "#2A2420" } : {}),
});
const FETE_HAUT = ["#E0B04A", "#C9453B", "#4F9A6A", "#4F7ACB", "#C96AA0", "#E8E0C8"];
/** Habitants du souvenir (il y a trois ans) : couleurs de fête, visages découverts. */
const festif = (i: number): Tenue => ({
  genre: "figurant",
  peau: PEAU[(i + 2) % 5],
  haut: FETE_HAUT[i % 6],
  bas: ["#4A5A7A", "#6A5A4A", "#3F4A58"][i % 3],
  chaussures: "#2A2A30",
  cheveux: CHEV[(i * 3) % 6],
  ...(i % 3 === 1 ? { robe: FETE_HAUT[i % 6], longs: CHEV[(i * 3) % 6] } : {}),
});
export const MASQUES = ["#DCD3BF", "#BFB8A8", "#A9A9B3", "#D2C7B0"];

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
/** Le jumeau d'un habitant de A dans la ville B (positions miroir, lacet π − ry). */
function jumeau(h: Habitant, id: string, dt = 0): Habitant {
  return { ...h, id, etapes: h.etapes.map((e) => ({ ...e, t: e.t + dt, p: mir(e.p), ry: e.ry === undefined ? undefined : ryMir(e.ry) })) };
}
const P = (x: number, z: number, y = 0): V3 => [x, y, z];

// ------------------------------------------------------------------ Événements (instants, en secondes)
export function evenements(mot: Mot): Record<string, number> {
  return {
    cut1: mot(3, 0) - 0.06, // l'éclairage passe du coucher de soleil au crépuscule (coupe de plan)
    cut2: mot(4, 17) - 0.06, // …puis à la nuit (le souvenir de la fête)
    sirFin: mot(1, 0) + 0.2, // la sirène se tait à la fin de la scène 1
    sir2: mot(5, 2) - 0.2, // « ils ont cru à une attaque » : les deux sirènes hurlent en même temps
    sir2Fin: mot(5, 26) + 0.4,
    montePlat: mot(1, 22), // il arrive sur la plateforme avec les jumelles
    jumHaut: mot(2, 0) - 0.3, // il porte les jumelles aux yeux (« De l'autre côté… »)
    jumBas: mot(2, 31) + 0.2, // « …sur moi. » : il les baisse, stupéfait
    jumeauApp: mot(2, 20) + 0.15, // le garçon d'en face est sur sa tour (« même tour »)
    jumeauBas: mot(3, 0) - 0.1, // il baisse ses jumelles : « Un garçon de mon âge »
    signe0: mot(3, 5), // il fait signe
    penche0: mot(3, 9) - 0.05, // il se baisse pour prendre la pancarte
    pancarte0: mot(3, 11) - 0.2, // la pancarte monte (« il a levé une pancarte »)
    pancarteLue: mot(3, 15), // « DANGER : NE SORTEZ PAS » : lisible
    pancarteFin: mot(4, 0) - 0.1,
    baisseYeux: mot(4, 7) - 0.05, // le père baisse les yeux
    parle: mot(4, 11), // le père parle
    fusee0: mot(4, 17) - 0.15, // la fusée part
    boum: mot(4, 21), // « a explosé »
    crois: mot(4, 26), // « On a cru à une attaque » : les deux villes s'effraient
    lumieres: mot(5, 8) + 0.05, // les deux villes s'illuminent (« le même soir »)
    jum2: mot(5, 20) - 0.2, // les deux garçons relèvent leurs jumelles (« depuis trois ans »)
    danger: mot(5, 24), // « le danger »
    nous: mot(5, 26), // « c'est nous »
    ouvre: mot(5, 28) - 0.1, // la porte commence à s'ouvrir sur « ouvrirais »
    fin: mot(5, 33) + 0.3,
  };
}

// ------------------------------------------------------------------ Habitants
export function habitants(mot: Mot): Habitant[] {
  const ev = evenements(mot);
  const out: Habitant[] = [];
  const [X0] = TOUR_INT;
  const [XC] = CUISINE;

  // ---------------- VILLE A : les habitants masqués rentrent en courant (scène 1) puis la place se vide
  const dep = (i: number, x: number, z: number, x1: number, z1: number, t0: number, v = 6.8) => {
    const h = chemin(`r${i}`, habitant(i), i * 1.37, t0, v, [P(x, z), P(x1, z1)], "course", { echelle: 0.96 + (i % 4) * 0.05 }, "course", "effraye");
    out.push(h);
    // le même, qui disparaît derrière la maison la plus proche puis ne revient pas
  };
  dep(0, -46, 9, 6, 15, 0.1);
  dep(1, -44, 12, 8, 19, 0.6);
  dep(2, -47, 15, 9, 24, 1.1);
  dep(3, -42, 8, 4, 30, 1.7);
  dep(4, 3, 11, -56, 14, 0.3);
  dep(5, 6, 14, -54, 19, 0.9);
  dep(6, 0, 9, -58, 26, 1.4);
  dep(7, -2, 17, -57, 33, 2.2);
  dep(8, -22, 38, -22, 80, 0.2);
  dep(9, -25, 36, -26, 90, 0.9);
  dep(10, -19, 35, -17, 100, 1.5);
  dep(11, -30, 30, -33, 70, 2.6);
  // l'homme masqué qui regarde le mur (« dehors, l'air serait empoisonné »)
  out.push({ id: "rA", tenue: habitant(3), graine: 2.1, echelle: 1.05, etapes: [{ t: 0, p: P(-30.5, 8.2), mode: "debout", ry: 0.18, emotion: "inquiet" }] });
  // gardes sur la muraille (patrouille lente, lanterne à la main, masqués)
  const garde = (i: number, x0: number, x1: number, t0: number): Habitant => chemin(`gA${i}`, habitant(i + 20), i * 0.9, t0, 1.1, [P(x0, 0.4, HW), P(x1, 0.4, HW)], "lanterne", { echelle: 1.04 }, "lanterne", "resolu");
  const gardes = [garde(0, -64, -36, -4), garde(1, 14, 40, -8), garde(2, 50, 28, -6)];
  for (const g of gardes) g.etapes[0].objet = "lanterne";
  out.push(...gardes);
  out.push({ id: "gAvallee", tenue: habitant(25), graine: 4.4, echelle: 1.04, clinRapide: true, etapes: [{ t: 0, p: P(9, -1.4, HW), mode: "lanterne", ry: Math.PI, objet: "lanterne", emotion: "resolu" }] });

  // ---------------- VILLE B : la ville jumelle, mêmes habitants aux mêmes endroits (miroir)
  const A = [...out];
  for (const h of A) if (h.id.startsWith("r") && h.id !== "rA") out.push(jumeau(h, `B${h.id}`, ev.crois + 1.6));
  out.push(jumeau(A.find((h) => h.id === "gAvallee")!, "gBvallee"));
  for (const g of A.filter((h) => h.id.startsWith("gA") && h.id !== "gAvallee")) out.push(jumeau(g, g.id.replace("gA", "gB")));

  // ---------------- Le narrateur dans la rue (scène 2)
  out.push({ id: "n1", tenue: T_NARR, graine: 0.5, echelle: 0.84, etapes: [{ t: mot(1, 0) - 0.05, p: P(-20, 14), mode: "debout", ry: Math.PI / 2, emotion: "inquiet" }] });
  // …puis il se faufile vers la vieille tour et disparaît dans son porche
  out.push({
    id: "n2",
    tenue: T_NARR,
    graine: 0.8,
    echelle: 0.84,
    etapes: [
      { t: mot(1, 13) - 0.2, p: P(2.2, 12.5), mode: "marche", emotion: "inquiet" },
      { t: mot(1, 13) + 0.75, p: P(0.2, 6.4), mode: "marche", emotion: "inquiet" },
      { t: mot(1, 13) + 1.0, p: P(0, 3.6), mode: "marche", emotion: "inquiet" },
    ],
  });
  // …dans l'escalier en colimaçon
  const t4 = mot(1, 15) - 0.04;
  const i0 = 3;
  out.push({ id: "nT", tenue: T_NARR, graine: 1.1, echelle: 0.84, etapes: Array.from({ length: 6 }, (_, k) => ({ t: t4 + k * 0.32, p: posMarche(i0 + k), mode: "marche" as Mode, emotion: "resolu" as Emotion })) });
  // …à l'échelle de la trappe
  const t5 = mot(1, 18) - 0.05;
  out.push({
    id: "nE",
    tenue: T_NARR,
    graine: 1.5,
    echelle: 0.84,
    etapes: [
      { t: t5 - 0.4, p: [ECHELLE_X - 0.5, SOMMET_ECHELLE, 0], mode: "marche", ry: Math.PI / 2, emotion: "resolu" },
      { t: t5, p: [ECHELLE_X - 0.5, SOMMET_ECHELLE, 0], mode: "marche", ry: Math.PI / 2, emotion: "resolu" },
      { t: t5 + 0.95, p: [ECHELLE_X - 0.38, SOMMET_ECHELLE + 4.55, 0], mode: "marche", ry: Math.PI / 2, emotion: "resolu" },
    ],
  });
  // …et sur la plateforme (jumelles)
  const posN: V3 = [0, PLAT_Y + 0.08, -6.0];
  out.push({ id: "n3", tenue: T_NARR, graine: 1.9, echelle: 0.84, etapes: [{ t: mot(1, 22) - 0.1, p: posN, mode: "debout", ry: Math.PI, emotion: "resolu" }] });
  // le garçon d'en face : même silhouette, même place, vue de l'autre côté (miroir exact)
  const posJ = mir(posN);
  out.push({ id: "tb", tenue: T_JUMEAU, graine: 1.9, echelle: 0.84, etapes: [{ t: ev.jumeauApp, p: posJ, mode: "debout", ry: 0, emotion: "curieux" }] });

  // ---------------- Le narrateur court jusqu'à la maison (scène 5)
  out.push({
    id: "n5",
    tenue: T_NARR,
    graine: 2.3,
    echelle: 0.84,
    etapes: [
      { t: mot(4, 0) - 0.3, p: P(3, 16), mode: "course", emotion: "effraye" },
      { t: mot(4, 0) + 0.35, p: P(-6, 22), mode: "course", emotion: "effraye" },
      { t: mot(4, 0) + 1.55, p: P(-22, 32), mode: "course", emotion: "effraye" },
    ],
  });

  // ---------------- CUISINE : le père et le narrateur
  out.push({ id: "pere", tenue: T_PERE, graine: 3.1, echelle: 1.06, etapes: [{ t: mot(4, 4) - 0.2, p: [XC, 0, -2.35], mode: "assis", ry: 0, h: 1.15, emotion: "triste" }] });
  out.push({
    id: "n4",
    tenue: T_NARR,
    graine: 2.7,
    echelle: 0.84,
    etapes: [
      { t: mot(4, 4) - 0.2, p: [XC + 2.0, 0, 5.7], mode: "marche", ry: Math.PI, emotion: "effraye" },
      { t: mot(4, 4) + 0.55, p: [XC + 1.1, 0, 1.0], mode: "marche", ry: -2.8, emotion: "effraye" },
      { t: mot(4, 4) + 0.8, p: [XC + 1.1, 0, 1.0], mode: "debout", ry: -2.8, emotion: "effraye" },
    ],
  });

  // ---------------- Souvenir (il y a trois ans) : la foule de la fête, sans masque, danse puis s'enfuit
  const centre: V3 = [-22, 0, 20];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + (i % 3) * 0.3;
    const r = 4 + (i % 4) * 2.6;
    const p: V3 = [centre[0] + Math.cos(a) * r, 0, centre[2] + Math.sin(a) * r * 0.9];
    const fuite: V3 = [centre[0] + Math.cos(a) * 34, 0, centre[2] + Math.abs(Math.sin(a)) * 40 + 8];
    const t0 = ev.fusee0 - 0.4;
    const ry = Math.atan2(centre[0] - 6 - p[0], 2 - p[2]); // ils regardent vers le ciel au-dessus de la muraille
    out.push({
      id: `f${i}`,
      tenue: festif(i),
      graine: i * 1.7,
      variante: i,
      echelle: 0.9 + (i % 4) * 0.06,
      etapes: [
        { t: t0, p, mode: "danse", ry, emotion: "sourire" },
        { t: ev.boum - 0.02, p, mode: "danse", ry, emotion: "surpris" },
        { t: ev.boum + 0.12, p, mode: "course", emotion: "effraye" },
        { t: ev.boum + 1.9 + (i % 3) * 0.2, p: fuite, mode: "course", emotion: "effraye" },
      ],
    });
  }
  void XC;
  void X0;
  void GATE_X;
  void ZB;
  return out;
}

// ------------------------------------------------------------------ Retouches : poses et objets pilotés par le temps
type Retouche = (T: number, a: Acteur) => Acteur | null;
const avec = (a: Acteur, pose: Pose, extra: Partial<Acteur> = {}): Acteur => ({ ...a, pose, ...extra });

export function retouches(mot: Mot, ev: Record<string, number>): Record<string, Retouche> {
  const r: Record<string, Retouche> = {};
  // le narrateur disparaît dans le porche de la tour
  r.n2 = (T, a) => (T > mot(1, 13) + 1.05 ? null : a);
  // la montée à l'échelle
  r.nE = (T, a) => (T < mot(1, 18) - 0.05 ? a : avec(a, poseEchelle(T)));
  r.nT = (T, a) => (T > mot(1, 18) - 0.05 ? null : a);
  // le narrateur sur la plateforme : jumelles de cuivre (tenues en main, puis aux yeux, puis baissées)
  r.n3 = (T, a) => {
    const tient = poseTient(T, 0.4);
    const yeux = poseJumelles(T, 0.4);
    const k = lisse(borne((T - ev.jumHaut) / 0.6));
    const bas = lisse(borne((T - ev.jumBas) / 0.5));
    const haut2 = lisse(borne((T - ev.jum2) / 0.6));
    if (T < ev.jumHaut) return avec(a, tient, { objet: "jumellesMain", emotion: T < ev.jumHaut - 0.2 ? "resolu" : "curieux" });
    const baisse = poseBaisse(T, 0.4);
    if (T < ev.jumBas) return avec(a, melPose(tient, yeux, k), { objet: k > 0.55 ? "jumelles" : "jumellesMain", emotion: "curieux" });
    if (T < ev.jum2) return avec(a, melPose(yeux, baisse, bas), { objet: bas > 0.5 ? "jumellesBas" : "jumelles", emotion: T < ev.pancarteLue + 2.2 ? "surpris" : "effraye" });
    if (T < ev.nous) return avec(a, melPose(baisse, yeux, haut2), { objet: haut2 > 0.5 ? "jumelles" : "jumellesBas", emotion: "inquiet" });
    return avec(a, melPose(yeux, baisse, lisse(borne((T - ev.nous) / 0.4))), { objet: T > ev.nous + 0.2 ? "jumellesBas" : "jumelles", emotion: "triste" });
  };
  // le garçon d'en face : jumelles, puis les baisse, fait signe, se penche, lève la pancarte, puis relève les jumelles
  r.tb = (T, a) => {
    const yeux = poseJumelles(T, 1.3);
    const tient = poseTient(T, 1.3);
    const signe = poseSigne(T);
    const penche = posePenche();
    const pan = posePancarte(T);
    if (T < ev.jumeauBas) return avec(a, yeux, { objet: "jumelles", emotion: "curieux" });
    if (T < ev.signe0 - 0.1) return avec(a, melPose(yeux, tient, lisse(borne((T - ev.jumeauBas) / 0.45))), { objet: "jumellesMain", emotion: "sourire" });
    if (T < ev.penche0) return avec(a, melPose(tient, signe, lisse(borne((T - (ev.signe0 - 0.1)) / 0.3))), { objet: "", emotion: "sourire" });
    if (T < ev.pancarte0) return avec(a, melPose(signe, penche, lisse(borne((T - ev.penche0) / 0.4))), { objet: "", emotion: "inquiet" });
    if (T < ev.pancarteFin) return avec(a, melPose(penche, pan, lisse(borne((T - ev.pancarte0) / 0.5))), { objet: "", emotion: "inquiet" });
    if (T < ev.jum2) return avec(a, melPose(pan, tient, lisse(borne((T - ev.pancarteFin) / 0.5))), { objet: "jumellesMain", emotion: "triste" });
    if (T < ev.nous) return avec(a, melPose(tient, yeux, lisse(borne((T - ev.jum2) / 0.6))), { objet: T > ev.jum2 + 0.3 ? "jumelles" : "jumellesMain", emotion: "inquiet" });
    return avec(a, melPose(yeux, tient, lisse(borne((T - ev.nous) / 0.4))), { objet: T > ev.nous + 0.2 ? "jumellesMain" : "jumelles", emotion: "triste" });
  };
  // le père : assis, abattu, puis il parle
  r.pere = (T, a) => {
    const abattu = poseAbattu(T);
    const parle = poseParle(T);
    const normal = poseAssisBase(T, 1.15, 3.1);
    if (T < ev.baisseYeux) return avec(a, normal, { emotion: "triste" });
    if (T < ev.parle) return avec(a, melPose(normal, abattu, lisse(borne((T - ev.baisseYeux) / 0.5))), { emotion: "triste" });
    return avec(a, melPose(abattu, parle, lisse(borne((T - ev.parle) / 0.5))), { emotion: "triste" });
  };
  // le narrateur dans la cuisine : sursaut à l'entrée puis immobile
  r.n4 = (T, a) => (T > mot(4, 4) + 0.8 ? avec(a, poseSursaut(T), { emotion: "inquiet" }) : a);
  // la foule du souvenir : les mains sur la tête en fuyant
  for (let i = 0; i < 14; i++) {
    r[`f${i}`] = (T, a) => (T >= ev.boum - 0.02 && T < ev.boum + 0.12 ? avec(a, posePanique(T, i)) : a);
  }
  // le narrateur qui court dans la rue : la course normale du moteur suffit
  void poseDebout;
  void mel;
  return r;
}
