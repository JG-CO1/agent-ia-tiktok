/**
 * « Tout ce que j'envoie par message devient réel… » — personnages et événements, tous calés sur les mots du récit.
 * Repères [scène, mot] : histoires/recits/messages.json (scène 1 = indice 0) ; index : scripts/mots.ts messages.
 *  - passants et Yanis (dehors) : habitants du moteur (marche, arrêts) ;
 *  - Sam, Mme Lopes, Yanis, les parents : personnages « scénarisés » (clés de pose, voir `scripts`).
 * Lieux : CHAMBRE (x ≈ −400), RUE (origine), VIDE (z ≈ 800).
 */
import type { V3 } from "../../geo";
import { type Pose, type Tenue, melPose, poseDebout, poseMarche } from "../../avatar";
import type { Emotion } from "../../textures";
import { type Acteur, type Etape, type Habitant, type Mode, duree, evaluer } from "../../ville/foule";
import { borne, lisse, mel } from "../../maths";
import { CH, GAZON_LOPES, VIDE, Y_TOP } from "./monde";
import { poseFige, poseInquiete, poseJoie, poseLeve, poseMains, poseTel, poseTelPanique, poseTete, poseTend } from "./poses";

type Mot = (s: number, k: number) => number;

// ------------------------------------------------------------------ Tenues
export const T_SAM: Tenue = { genre: "figurant", peau: "#F0CDB0", haut: "#FF8A2B", bas: "#3F5AA8", chaussures: "#F5F5F5", cheveux: "#1B1A22" };
export const T_YANIS: Tenue = { genre: "figurant", peau: "#C99873", haut: "#9B5BE8", bas: "#2E3550", chaussures: "#FFFFFF", cheveux: "#2A1E18", casquette: "#22C3B5" };
export const T_LOPES: Tenue = { genre: "dame", peau: "#E8BE98", haut: "#F58FB0", bas: "#7A5A8A", chaussures: "#6A4A3A", cheveux: "#C8C8D0", bas2: "#C9A9D0" };
export const T_MAMAN: Tenue = { genre: "figurant", peau: "#E3B58C", haut: "#E86A7A", bas: "#5A4A8A", chaussures: "#3A2E2A", cheveux: "#3A2418", longs: "#3A2418", robe: "#E86A7A" };
export const T_PAPA: Tenue = { genre: "figurant", peau: "#D9AE8B", haut: "#4B7AB8", bas: "#2E3A5A", chaussures: "#2A2A30", cheveux: "#2A2420" };
const PEAU = ["#E6B98F", "#C99873", "#D9AE8B", "#B58463", "#F0C8A0"];
const CHEV = ["#3A2A1E", "#C9A15A", "#252525", "#7A3B22", "#9A9A9A"];
const HAUT = ["#FFD23F", "#5AD18F", "#FF7A8A", "#7AA8FF", "#C99AFF", "#FFFFFF"];
const BAS = ["#4A5A7A", "#6A5A4A", "#3F4A58", "#7A6A5A"];
const passant = (i: number): Tenue => ({ genre: "figurant", peau: PEAU[i % 5], haut: HAUT[i % 6], bas: BAS[i % 4], chaussures: "#2A2A30", cheveux: CHEV[(i * 3) % 5], ...(i % 3 === 0 ? { casquette: "#FF5C7A" } : {}), ...(i % 4 === 1 ? { robe: HAUT[i % 6], longs: CHEV[(i * 3) % 5] } : {}) });

// ------------------------------------------------------------------ Repères de mise en scène
const [X] = CH;
const [VX, , VZ] = VIDE;
/** Sam dans la chambre : debout face à la fenêtre (le téléphone est tenu à deux mains devant sa poitrine). */
export const SAM_CH: V3 = [X + 0.2, 0, 0.3];
/** Sam à la fenêtre. */
export const SAM_FEN: V3 = [X + 0.7, 0, -3.5];
/** Yanis dehors, sur le trottoir d'en face. */
export const YANIS: V3 = [X + 1.6, 0, -11.6];
/** Sam dans la rue (devant le jardin de Mme Lopes), et pendant « Moi, je m'en souvenais ». */
export const SAM_R1: V3 = [-1.4, 0, -2.6];
export const SAM_R2: V3 = [-4.8, 0, 12.4];
/** Mme Lopes dans son jardin. */
export const LOPES: V3 = [-11.0, 0, 16.2];
/** Le haut du fil : Sam, les parents. */
export const SAM_V: V3 = [VX + 3.4, Y_TOP, VZ + 12];
export const MAMAN: V3 = [VX - 6.4, Y_TOP, VZ - 4.2];
export const PAPA: V3 = [VX - 3.0, Y_TOP, VZ - 4.2];

/** Chaque événement est un instant (s) calculé sur un mot. */
export function evenements(mot: Mot): Record<string, number> {
  return {
    envoi: mot(0, 0) + 0.5, // le pouce touche « envoyer » : la bulle jaillit
    bubFly: mot(0, 19) - 0.2, // la bulle quitte la pièce vers la fenêtre
    eclat: mot(0, 22) + 0.05, // elle éclate contre la vitre : « bonbons. »
    candy0: mot(0, 22) + 0.2, // première sphère de bonbon
    pluie0: mot(0, 24), // la pluie s'installe
    rose: mot(0, 28), // la rue se réécrit (vague rose)
    boul0: mot(1, 11) - 0.1, // la boulangerie se dissout
    tape3: mot(2, 0) + 0.1, // Sam tape « Le chien… »
    bub3: mot(2, 2) + 0.1, // la bulle apparaît
    gueri: mot(2, 9) + 0.15, // « guéri. » : la bulle éclate au-dessus du chien
    bondit: mot(2, 12) - 0.05,
    maison0: mot(2, 18) - 0.05, // la maison de la voisine s'efface
    voisine0: mot(2, 20) - 0.1, // elle s'efface avec sa maison
    tape4: mot(3, 2) - 0.05,
    envoi4: mot(3, 8) + 0.2,
    rep1: mot(3, 10) + 0.2, // première bulle grise : « Réponse »
    imp: mot(3, 13) - 0.1, // « Impossible. »
    rep2: mot(3, 14) - 0.1, // « Un seul message… »
    monte0: mot(3, 22) - 0.05, // il remonte la conversation
    haut: mot(4, 0) - 0.05,
    parents: mot(4, 9) - 0.35,
    pan: mot(4, 24) - 0.05, // le panneau « Supprimer ce message ? »
    pixel0: mot(5, 3) - 0.1, // les mains se pixellisent
    vision0: mot(5, 12) - 0.1, // « tout redevient normal » : la rue d'avant
    vision1: mot(5, 15) - 0.05,
    bouton0: mot(5, 15) - 0.2, // le bouton enfle
  };
}

// ------------------------------------------------------------------ Personnages scénarisés
type Cle = { t: number; p: V3; ry: number; pose: (T: number) => Pose; emotion: Emotion; objet?: string; fondu?: number; marche?: boolean };
type Script = { tenue: Tenue; echelle: number; graine: number; cles: Cle[]; presence?: Array<[number, number]>; fantome?: boolean; sansClin?: boolean };
const PHASE_PAR_UNITE = 2.86;
const mel3 = (a: V3, b: V3, k: number): V3 => [mel(a[0], b[0], k), mel(a[1], b[1], k), mel(a[2], b[2], k)];
const angle = (a: number, b: number, k: number) => {
  let d = (b - a) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return a + d * k;
};
const lacetVers = (de: V3, vers: V3) => Math.atan2(vers[0] - de[0], vers[2] - de[2]);

export function scripts(mot: Mot, ev: Record<string, number>): Record<string, Script> {
  const cap = lacetVers;
  // ---- Sam
  const sam: Cle[] = [
    // la chambre : il tape, la bulle jaillit, il la regarde flotter, elle s'envole et éclate contre la vitre
    { t: 0, p: SAM_CH, ry: Math.PI, pose: (T) => poseTel(T), emotion: "curieux" },
    { t: ev.envoi, p: SAM_CH, ry: Math.PI, pose: (T) => poseTel(T), emotion: "surpris", fondu: 0.1 },
    { t: ev.envoi + 1.6, p: SAM_CH, ry: Math.PI, pose: (T) => poseTel(T), emotion: "inquiet", fondu: 0.3 },
    { t: mot(0, 8) - 0.15, p: SAM_CH, ry: Math.PI, pose: (T) => poseLeve(T, 0, 0.12), emotion: "curieux", fondu: 0.2 },
    { t: mot(0, 12) - 0.2, p: SAM_CH, ry: Math.PI, pose: (T) => poseTel(T), emotion: "curieux", fondu: 0.25 },
    { t: ev.bubFly, p: SAM_CH, ry: Math.PI, pose: (T) => poseLeve(T, 0, -0.35), emotion: "surpris", fondu: 0.3 },
    { t: ev.eclat + 0.6, p: SAM_FEN, ry: Math.PI, pose: (T) => poseFige(T), emotion: "surpris", marche: true },
    // la rue (rose) : « Moi, je m'en souvenais » devant la boulangerie qui n'est plus
    { t: ev.rose - 0.2, p: [-1.6, 0, 5.2], ry: Math.PI + 0.4, pose: (T) => poseFige(T, 1.2), emotion: "surpris" },
    { t: mot(1, 0) - 0.1, p: SAM_R1, ry: Math.PI + 0.25, pose: (T) => poseFige(T, 1.2), emotion: "inquiet" },
    { t: mot(1, 19) - 0.1, p: SAM_R1, ry: Math.PI + 0.25, pose: (T) => poseFige(T, 1.2), emotion: "inquiet", fondu: 0.2 },
    { t: mot(1, 19) + 0.15, p: SAM_R1, ry: 2.28, pose: (T) => poseFige(T, 1.2), emotion: "inquiet", fondu: 0.7 },
    { t: mot(1, 21) + 0.3, p: SAM_R1, ry: 2.28, pose: (T) => poseFige(T, 1.2), emotion: "effraye", fondu: 0.4 },
    // le jardin de Mme Lopes : il tape « Le chien… », la bulle, le chien guéri, la maison disparaît
    { t: mot(2, 0) - 0.06, p: SAM_R2, ry: -Math.PI / 2, pose: (T) => poseTel(T, 0.4), emotion: "resolu" },
    { t: ev.gueri, p: SAM_R2, ry: -Math.PI / 2, pose: (T) => poseTel(T, 0.4), emotion: "sourire", fondu: 0.2 },
    { t: ev.bondit, p: SAM_R2, ry: -Math.PI / 2, pose: (T) => poseJoie(T, 0.4), emotion: "sourire", fondu: 0.25 },
    { t: mot(2, 18), p: SAM_R2, ry: -Math.PI / 2, pose: (T) => poseFige(T, 0.4), emotion: "surpris", fondu: 0.3 },
    { t: mot(2, 24), p: SAM_R2, ry: -Math.PI / 2, pose: (T) => poseFige(T, 0.4), emotion: "effraye", fondu: 0.3 },
    // panique : il tape « Tout redevient comme avant. »
    { t: mot(3, 0) - 0.06, p: SAM_R2, ry: -Math.PI / 2, pose: (T) => poseTete(T), emotion: "effraye" },
    { t: ev.tape4, p: SAM_R2, ry: -Math.PI / 2, pose: (T) => poseTelPanique(T, 0.4), emotion: "effraye", fondu: 0.2 },
    { t: ev.rep1, p: SAM_R2, ry: -Math.PI / 2, pose: (T) => poseTel(T, 0.4), emotion: "surpris", fondu: 0.2 },
    { t: ev.imp, p: SAM_R2, ry: -Math.PI / 2, pose: (T) => poseTete(T), emotion: "effraye", fondu: 0.25 },
    { t: mot(3, 19), p: SAM_R2, ry: -Math.PI / 2, pose: (T) => poseFige(T, 0.4), emotion: "larmes", fondu: 0.3 },
    // le haut du fil
    { t: ev.haut - 0.8, p: SAM_V, ry: Math.PI, pose: (T) => poseLeve(T, 0.2, -0.55), emotion: "surpris" },
    { t: mot(4, 17), p: SAM_V, ry: Math.PI, pose: (T) => poseLeve(T, 0.2, -0.3), emotion: "inquiet", fondu: 0.5 },
    { t: ev.pan, p: SAM_V, ry: Math.PI, pose: (T) => poseLeve(T, 0.2, 0.02), emotion: "effraye", fondu: 0.4 },
    { t: mot(5, 0) - 0.2, p: SAM_V, ry: Math.PI, pose: (T) => poseFige(T, 0.2), emotion: "vide", fondu: 0.3 },
    { t: mot(5, 3), p: SAM_V, ry: Math.PI, pose: (T) => poseMains(T), emotion: "effraye", fondu: 0.35 },
    { t: mot(5, 7), p: SAM_V, ry: Math.PI, pose: (T) => poseTend(T), emotion: "larmes", fondu: 0.5 },
    { t: mot(5, 15), p: SAM_V, ry: Math.PI, pose: (T) => poseTend(T), emotion: "triste", fondu: 0.3 },
    { t: mot(5, 17) - 0.05, p: SAM_V, ry: Math.PI, pose: (T) => poseTend(T), emotion: "resolu", fondu: 0.4 },
  ];
  // ---- Yanis (sur le trottoir d'en face, téléphone à la main)
  const yan: Cle[] = [
    { t: 0, p: YANIS, ry: 0, pose: (T) => ({ ...poseDebout(T, 0.8), brasD: { x: -1.7, z: -0.25, pli: -0.2 }, tete: [0, 0.3] }), emotion: "curieux", objet: "msg_tel" },
    { t: ev.candy0 + 0.3, p: YANIS, ry: 0, pose: (T) => ({ ...poseDebout(T, 0.8), brasD: { x: -1.7, z: -0.25, pli: -0.2 }, tete: [0, -0.55] }), emotion: "surpris", fondu: 0.25 },
    { t: ev.candy0 + 1.4, p: YANIS, ry: 0, pose: (T) => ({ ...poseJoie(T, 0.8), tete: [0, -0.5] }), emotion: "sourire", fondu: 0.2 },
  ];
  // ---- Mme Lopes : inquiète près du chien, folle de joie, puis s'efface avec sa maison
  const lop: Cle[] = [
    { t: 0, p: LOPES, ry: cap(LOPES, [-9.4, 0, 20.8]), pose: (T) => poseInquiete(T, 0.3), emotion: "inquiet" },
    { t: ev.gueri, p: LOPES, ry: cap(LOPES, [-9.4, 0, 20.8]), pose: (T) => poseInquiete(T, 0.3), emotion: "surpris", fondu: 0.2 },
    { t: ev.bondit + 0.15, p: LOPES, ry: cap(LOPES, [-9.4, 0, 20.8]), pose: (T) => poseJoie(T, 0.3), emotion: "sourire", fondu: 0.2 },
    { t: ev.voisine0 - 0.5, p: LOPES, ry: 0.5, pose: (T) => poseFige(T, 0.3), emotion: "sourire", fondu: 0.4 },
  ];
  // ---- Les parents (souvenir d'il y a quinze ans, silhouettes translucides)
  const mam: Cle[] = [{ t: ev.parents - 0.5, p: MAMAN, ry: 0.55, pose: (T) => ({ ...poseTel(T, 2.0), tete: [0.1, 0.2] }), emotion: "apaise" }];
  const pap: Cle[] = [{ t: ev.parents - 0.5, p: PAPA, ry: -0.7, pose: (T) => ({ ...poseDebout(T, 0.6), tete: [-0.15, 0.15] }), emotion: "sourire" }];
  return {
    sam: { tenue: T_SAM, echelle: 0.95, graine: 0.4, cles: sam },
    yanis: { tenue: T_YANIS, echelle: 0.95, graine: 1.1, cles: yan, presence: [[0, ev.pluie0 + 3]] },
    lopes: { tenue: T_LOPES, echelle: 0.98, graine: 0.7, cles: lop, presence: [[0, ev.voisine0 + 0.9]] },
    maman: { tenue: T_MAMAN, echelle: 1.0, graine: 1.4, cles: mam, fantome: true, sansClin: true },
    papa: { tenue: T_PAPA, echelle: 1.05, graine: 2.0, cles: pap, fantome: true, sansClin: true },
  };
}

type Etat = { p: V3; ry: number; pose: Pose; emotion: Emotion; objet?: string };
/** Évalue un personnage scénarisé : clé active, fondu depuis la précédente, marche vers la clé suivante si elle le demande. */
export function evaluerScript(s: Script, T: number): Acteur | null {
  if (s.presence && !s.presence.some(([a, b]) => T >= a && T <= b)) return null;
  let i = -1;
  for (let k = 0; k < s.cles.length; k++) if (s.cles[k].t <= T) i = k;
  if (i < 0) return null;
  const cur = s.cles[i];
  const suiv = s.cles[i + 1];
  let e: Etat = { p: cur.p, ry: cur.ry, pose: cur.pose(T), emotion: cur.emotion, objet: cur.objet };
  if (suiv?.marche) {
    const k = borne((T - cur.t) / (suiv.t - cur.t));
    const dist = Math.hypot(suiv.p[0] - cur.p[0], suiv.p[2] - cur.p[2]);
    const ry = lacetVers(cur.p, suiv.p);
    let pose = poseMarche(dist * k * PHASE_PAR_UNITE);
    const reste = suiv.t - T;
    if (reste < 0.3) pose = melPose(pose, suiv.pose(T), 1 - reste / 0.3);
    e = { p: mel3(cur.p, suiv.p, k), ry: reste < 0.4 ? angle(ry, suiv.ry, 1 - reste / 0.4) : ry, pose, emotion: cur.emotion, objet: cur.objet };
  } else {
    const f = cur.fondu ?? 0;
    if (i > 0 && f > 0 && T < cur.t + f) {
      const k = lisse(borne((T - cur.t) / f));
      const pv = s.cles[i - 1];
      e = { p: mel3(pv.p, cur.p, k), ry: angle(pv.ry, cur.ry, k), pose: melPose(pv.pose(T), cur.pose(T), k), emotion: cur.emotion, objet: cur.objet };
    }
  }
  let objet = e.objet;
  if (objet === undefined) for (let k = i; k >= 0; k--) if (s.cles[k].objet !== undefined) { objet = s.cles[k].objet; break; }
  return { p: e.p, ry: e.ry, rx: 0, pose: e.pose, emotion: e.emotion, tenue: s.tenue, graine: s.graine, echelle: s.echelle, fantome: !!s.fantome, sansClin: !!s.sansClin, clinRapide: false, objet: objet || undefined };
}
export const IDS_SCRIPT = ["sam", "yanis", "lopes", "maman", "papa"];

// ------------------------------------------------------------------ Habitants du moteur : les passants de la rue
function ligne(id: string, tenue: Tenue, graine: number, x: number, zA: number, tA: number, zB: number, v: number, echelle = 1): Habitant {
  const pA: V3 = [x, 0.12, zA];
  const pB: V3 = [x, 0.12, zB];
  const etapes: Etape[] = [
    { t: tA, p: pA, mode: "marche" as Mode, emotion: "neutre" },
    { t: tA + duree(pA, pB, v), p: pB, mode: "marche" as Mode, emotion: "neutre" },
  ];
  return { id, tenue, etapes, graine, echelle };
}

export function habitants(_mot: Mot): Habitant[] {
  const out: Habitant[] = [];
  // passants indifférents (ils ne regrettent rien) : ils marchent d'un bout à l'autre de la rue pendant toute la vidéo
  out.push(ligne("pA", passant(2), 0.5, 5.6, -40, 6.6, 90, 2.2, 1.0));
  out.push(ligne("pB", passant(1), 1.1, -5.7, 30, 5.0, -90, 2.3, 0.97));
  out.push(ligne("pC", passant(4), 1.9, 5.3, 40, 0, -80, 2.0, 1.03));
  out.push(ligne("pD", passant(5), 0.8, 4.7, -50, 0, 90, 2.4, 0.9));
  out.push(ligne("pE", passant(3), 2.3, 5.9, -90, 0, 90, 2.1, 1.0));
  out.push(ligne("pF", passant(7), 1.4, -5.4, 100, 0, -90, 2.2, 0.95));
  out.push(ligne("pG", passant(6), 0.2, 5.5, 70, 12.0, -90, 2.3, 1.0));
  out.push(ligne("pH", passant(9), 2.8, -5.9, -70, 4.0, 90, 2.0, 1.02));
  return out;
}
export const IDS_PASSANTS = ["pA", "pB", "pC", "pD", "pE", "pF", "pG", "pH"];

export { evaluer };
void GAZON_LOPES;
