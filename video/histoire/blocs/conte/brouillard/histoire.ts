/**
 * « Chaque jeudi, quelque chose vient nous chercher… » — personnages, créature et événements, tous calés sur les mots.
 * Repères [scène, mot] : voir histoires/recits/brouillard.json (scène 1 = indice 0).
 *  - père et médecin : habitants du moteur (marche, arrêts) ;
 *  - narrateur et belle-mère : personnages « scénarisés » (clés de pose, voir `SCRIPTS`) ;
 *  - créature : état calculé (`creatureEtat`), pas de liste d'étapes.
 */
import type { V3 } from "../../geo";
import { type Pose, type Tenue, melPose } from "../../avatar";
import type { Emotion } from "../../textures";
import { type Acteur, type Habitant, evaluer } from "../../ville/foule";
import { borne, entre, lisse, mel } from "../../maths";
import { poseAllonge } from "../poses";
import { CHAMBRE, ETAGE, PORTE } from "./monde";
import { ECHELLE_CREATURE, PAS, type EtatCreature } from "./creature";
import { poseApaisee, poseAssisLit, poseAssisLitBloque, poseAssisLitHalete, poseAssiseVeille, poseBouche, poseCacheHalete, poseCacheSouffle, poseExplique, poseFerme, poseInhale, poseMedecin, poseAllongeTete } from "./poses";

type Mot = (s: number, k: number) => number;
const [XC] = CHAMBRE;
const [PX] = PORTE;
export const BX = XC - 3.0; // axe du lit
export const FOND = -13; // z de la rue vue de la fenêtre (axe de marche de la créature)

export const T_NARR: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#8DA0C8", bas: "#6F7FA6", chaussures: "#3A3A44", cheveux: "#4A3022" };
export const T_BM: Tenue = { genre: "figurant", peau: "#E3B58C", haut: "#7A4C66", bas: "#3A2E45", chaussures: "#241C24", cheveux: "#2A1C14", longs: "#2A1C14", robe: "#6A3F58" };
export const T_PERE: Tenue = { genre: "figurant", peau: "#D9AE8B", haut: "#4B5160", bas: "#2B2E36", chaussures: "#16161A", cheveux: "#2A2A2A", manteau: "#2E323C", feutre: "#1C1C22" };
export const T_MED: Tenue = { genre: "figurant", peau: "#DDB490", haut: "#E4E9F0", bas: "#2B2F3A", chaussures: "#121216", cheveux: "#6C6C78", manteau: "#F1F2F5", lunettes: "#D4D6DC" };

/** Chaque événement est un instant (s) calculé sur un mot. */
export function evenements(mot: Mot): Record<string, number> {
  return {
    cvArrive: mot(1, 0) + 0.3, // la créature atteint la maison (« chez toi » vient de finir)
    lum0: mot(1, 8), // première maison qui s'éteint
    ferme0: mot(1, 10) + 0.15, // le rideau commence à se fermer (« fermer les fenêtres »)
    ferme1: mot(1, 13),
    tombe: mot(1, 25), // l'inhalateur lui échappe (« jamais »)
    passe: 18.0, // la créature passe au droit de la fenêtre (centre)
    rideauOuvre: mot(2, 8),
    goutte1: mot(3, 3) - 0.05,
    goutte2: mot(3, 4),
    goutte3: mot(3, 6) - 0.05,
    mainApparait: mot(3, 10) + 0.1, // « créature » : la main grise sort du brouillard
    mainColle: mot(3, 12), // « là »
    bmArrive: mot(3, 21) + 0.1,
    bouche: mot(3, 25) + 0.15, // la main se pose sur sa bouche
    mainPart: mot(4, 20), // « Le monstre a fini par partir »
    lumiere: mot(4, 26), // la lumière revient
    perePart: mot(2, 0) - 0.3,
    brumeMur: mot(2, 8),
    mainPorte0: mot(5, 4),
    mainPorte1: mot(5, 11),
    porteInvite: mot(5, 13),
    invFin: mot(5, 16) - 0.06,
    porteDeverr: mot(5, 26), // « déverrouillée »
    cle: mot(5, 33), // « clé »
    medecin: mot(5, 36) + 0.1,
    medecinTourne: mot(5, 36),
    sourire: mot(5, 39) - 0.3,
    fin: mot(5, 44) + 0.4,
  };
}

// ------------------------------------------------------------------ Personnages scénarisés
type Cle = { t: number; p: V3; ry: number; rx?: number; pose: (T: number) => Pose; emotion: Emotion; objet?: string; fondu?: number };
type Script = { tenue: Tenue; echelle: number; graine: number; sansClin?: boolean; cles: Cle[]; presence: Array<[number, number]> };
const PRES_VIDE: Array<[number, number]> = [];

/** Bras gauche de la belle-mère pour atteindre la bouche (calculé hors ligne : voir tools/solveur dans le rapport). */
export const BOUCHE_BM = { x: -3.0, z: 0.2, pli: 0, torse: 0.75 };
export const POS_BM_BOUCHE: V3 = [BX + 0.55, 0, 3.2];
export const RY_BM_BOUCHE = Math.PI;
export const POS_GARCON_LIT: V3 = [BX - 0.35, 0.51, 2.3];

export function scripts(mot: Mot, ev: Record<string, number>): Record<string, Script> {
  const WP: V3 = [XC + 0.5, 0, -3.85];
  const LIT: V3 = [BX, 1.3, 0.02];
  const CHAISE: V3 = [XC - 1.2, 0, 0.45];
  const nar: Cle[] = [
    { t: mot(1, 9) - 3, p: WP, ry: Math.PI, pose: poseFerme, emotion: "inquiet" },
    { t: mot(1, 14) - 0.1, p: [XC + 0.9, 0, -3.85], ry: 0, pose: poseCacheSouffle, emotion: "inquiet", fondu: 0.4 },
    { t: mot(1, 17), p: [XC + 0.9, 0, -3.85], ry: 0, pose: poseCacheHalete, emotion: "effraye", fondu: 0.3 },
    { t: mot(1, 21), p: [XC + 0.9, 0, -3.85], ry: 0, pose: poseInhale, emotion: "effraye", objet: "inhalateur", fondu: 0.3 },
    { t: ev.tombe - 0.05, p: [XC + 0.9, 0, -3.85], ry: 0, pose: poseCacheHalete, emotion: "effraye", objet: "", fondu: 0.2 },
    { t: mot(2, 9), p: LIT, ry: Math.PI, rx: -Math.PI / 2, pose: () => poseAllonge(), emotion: "inquiet", fondu: 0.3 },
    { t: mot(2, 23), p: LIT, ry: Math.PI, rx: -Math.PI / 2, pose: () => poseAllonge(), emotion: "effraye", fondu: 0.35 },
    { t: mot(3, 0) - 0.6, p: LIT, ry: Math.PI, rx: -Math.PI / 2, pose: () => poseAllonge(), emotion: "dort", fondu: 0.5 },
    { t: mot(3, 7), p: LIT, ry: Math.PI, rx: -Math.PI / 2, pose: () => poseAllonge(), emotion: "surpris", fondu: 0.1 },
    { t: mot(3, 9) - 0.1, p: POS_GARCON_LIT, ry: Math.PI, rx: 0, pose: poseAssisLit, emotion: "effraye", fondu: 0.5 },
    { t: mot(3, 13), p: POS_GARCON_LIT, ry: Math.PI, rx: 0, pose: poseAssisLitHalete, emotion: "effraye", fondu: 0.3 },
    { t: ev.bouche, p: POS_GARCON_LIT, ry: Math.PI, rx: 0, pose: poseAssisLitBloque, emotion: "effraye", fondu: 0.25 },
    { t: mot(4, 14), p: POS_GARCON_LIT, ry: Math.PI, rx: 0, pose: poseAssisLitBloque, emotion: "larmes", fondu: 0.3 },
    { t: ev.mainPart, p: POS_GARCON_LIT, ry: Math.PI, rx: 0, pose: poseAssisLit, emotion: "apaise", fondu: 0.6 },
  ];
  const bm: Cle[] = [
    { t: 20.0, p: CHAISE, ry: Math.PI, pose: (T) => poseAssiseVeille(T, 1.17, 0), emotion: "attente" },
    { t: mot(2, 28), p: CHAISE, ry: Math.PI, pose: (T) => poseAssiseVeille(T, 1.17, 0.12), emotion: "attente", fondu: 0.6 },
    { t: ev.bmArrive, p: [BX + 0.55, 0, 4.2], ry: Math.PI, pose: poseApaisee, emotion: "inquiet" },
    { t: ev.bouche - 0.5, p: POS_BM_BOUCHE, ry: RY_BM_BOUCHE, pose: (T) => poseBouche(T, BOUCHE_BM), emotion: "inquiet", fondu: 0.5 },
    { t: mot(4, 14), p: POS_BM_BOUCHE, ry: RY_BM_BOUCHE, pose: (T) => poseBouche(T, BOUCHE_BM), emotion: "triste", fondu: 0.3 },
    { t: ev.mainPart + 0.6, p: CHAISE, ry: Math.PI + 0.35, pose: (T) => poseAssiseVeille(T, 1.17, 0.3), emotion: "apaise", fondu: 0.7 },
    { t: mot(5, 0), p: CHAISE, ry: Math.PI + 0.35, pose: (T) => ({ ...poseAssiseVeille(T, 1.17, 0), brasD: poseExplique(T).brasD }), emotion: "apaise", fondu: 0.4 },
  ];
  return {
    nar: { tenue: T_NARR, echelle: 0.82, graine: 0.3, cles: nar, presence: [[mot(1, 10) - 0.25, mot(2, 0) + 0.05], [20.0, mot(5, 5)]] },
    bm: { tenue: T_BM, echelle: 1.0, graine: 1.2, cles: bm, presence: [[20.0, mot(3, 0) - 0.05], [ev.bmArrive, mot(5, 5)]] },
  };
}

type Etat = { p: V3; ry: number; rx: number; pose: Pose; emotion: Emotion; objet?: string };
function etatCle(c: Cle, T: number): Etat {
  return { p: c.p, ry: c.ry, rx: c.rx ?? 0, pose: c.pose(T), emotion: c.emotion, objet: c.objet };
}
const mel3 = (a: V3, b: V3, k: number): V3 => [mel(a[0], b[0], k), mel(a[1], b[1], k), mel(a[2], b[2], k)];
/** Évalue un personnage scénarisé : clé active, fondu depuis la précédente. */
export function evaluerScript(s: Script, T: number): Acteur | null {
  if (s.presence.length && !s.presence.some(([a, b]) => T >= a && T <= b)) return null;
  let i = -1;
  for (let k = 0; k < s.cles.length; k++) if (s.cles[k].t <= T) i = k;
  if (i < 0) return null;
  const cur = etatCle(s.cles[i], T);
  let e = cur;
  const f = s.cles[i].fondu ?? 0;
  if (i > 0 && f > 0 && T < s.cles[i].t + f) {
    const prev = etatCle(s.cles[i - 1], T);
    const k = lisse(borne((T - s.cles[i].t) / f));
    e = { p: mel3(prev.p, cur.p, k), ry: mel(prev.ry, cur.ry, k), rx: mel(prev.rx, cur.rx, k), pose: melPose(prev.pose, cur.pose, k), emotion: cur.emotion, objet: k < 0.5 ? prev.objet : cur.objet };
  }
  // l'objet tenu : celui de la dernière clé qui en précise un
  let objet = e.objet;
  if (objet === undefined) for (let k = i; k >= 0; k--) if (s.cles[k].objet !== undefined) { objet = s.cles[k].objet; break; }
  return { p: e.p, ry: e.ry, rx: e.rx, pose: e.pose, emotion: e.emotion, tenue: s.tenue, graine: s.graine, echelle: s.echelle, fantome: false, sansClin: !!s.sansClin, clinRapide: false, objet: objet || undefined };
}

// ------------------------------------------------------------------ Habitants du moteur : le père et le médecin
export function habitants(mot: Mot): Habitant[] {
  const ev = evenements(mot);
  const out: Habitant[] = [];
  const v = 3.3;
  const z1 = 90;
  out.push({
    id: "pere",
    tenue: T_PERE,
    graine: 0.6,
    echelle: 1.08,
    etapes: [
      { t: ev.perePart - 0.9, p: [PX + 0.1, 0, -1.4], mode: "marche", ry: 0, emotion: "resolu" },
      { t: ev.perePart - 0.9 + (z1 + 1.4) / v, p: [PX + 0.1, 0, z1], mode: "marche" },
    ],
  });
  const tm = mot(5, 14);
  out.push({
    id: "med",
    tenue: T_MED,
    graine: 1.7,
    echelle: 1.06,
    etapes: [
      { t: tm, p: [PX, 0, 2.7], mode: "lanterne", ry: Math.PI, objet: "cle+mallette", emotion: "neutre" },
      { t: ev.medecin, p: [PX, 0, 2.7], mode: "lanterne", ry: 0, emotion: "neutre" },
      { t: ev.sourire, p: [PX, 0, 2.7], mode: "lanterne", ry: 0, emotion: "sinistre" },
    ],
  });
  return out;
}
/** Présence (instants où l'on peut voir le personnage) et retouches des habitants du moteur. */
export const PRESENCE_HAB: Record<string, (ev: Record<string, number>) => Array<[number, number]>> = {
  pere: (ev) => [[ev.perePart, ev.perePart + 4.0]],
  med: (ev) => [[ev.porteDeverr - 0.2, 999]],
};
export function retoucher(id: string, a: Acteur, T: number, ev: Record<string, number>): Acteur {
  if (id === "med") {
    const k = lisse(entre(T, ev.medecinTourne, ev.medecinTourne + 0.7));
    return { ...a, ry: mel(Math.PI, 0, k), pose: { ...poseMedecin(T), tete: [0, 0.03] } };
  }
  return a;
}
export function acteurHabitant(h: Habitant, T: number, ev: Record<string, number>): Acteur | null {
  const pres = PRESENCE_HAB[h.id]?.(ev);
  if (pres && !pres.some(([a, b]) => T >= a && T <= b)) return null;
  const a = evaluer(h, T, 0);
  return a ? retoucher(h.id, a, T, ev) : null;
}

// ------------------------------------------------------------------ La créature
const clampT = (T: number, a: number, b: number) => Math.min(b, Math.max(a, T));

/** État de la créature dans un lieu (« ville », « chambre » = la rue vue d'en haut, « porte »), ou null si elle n'y est pas. */
export function creatureEtat(lieu: "ville" | "chambre" | "porte", T: number, ev: Record<string, number>): EtatCreature | null {
  const S = ECHELLE_CREATURE;
  if (lieu === "ville") {
    if (T > ev.cvArrive + 4) return null;
    const x0 = 0.6;
    const z0 = -58;
    const x1 = -1.8;
    const z1 = -10.2;
    const Tm = clampT(T, 0, ev.cvArrive);
    const k = Tm / ev.cvArrive;
    const dist = Math.hypot(x1 - x0, z1 - z0) * k;
    const x = mel(x0, x1, k);
    const z = mel(z0, z1, k);
    const marche = 1 - lisse(entre(T, ev.cvArrive - 0.1, ev.cvArrive + 0.6));
    const tourne = lisse(entre(T, ev.cvArrive + 0.1, ev.cvArrive + 1.6));
    const ry = mel(Math.atan2(x1 - x0, z1 - z0), -Math.PI / 2, tourne);
    const ecoute = lisse(entre(T, 3.4, 4.2)) * (1 - lisse(entre(T, 7.4, 8.4)));
    const tete: [number, number] = [ecoute * 0.55 * Math.sin((T - 3.6) * 1.15) + tourne * 0.1, 0.08 + ecoute * 0.12 * Math.sin((T - 3.6) * 0.9) - tourne * 0.3];
    return { x, z, ry, phi: dist / PAS, marche, tete, s: S };
  }
  if (lieu === "chambre") {
    const y = -ETAGE;
    const V = 5.5;
    const tArr = ev.mainApparait - 0.9; // s'arrête devant la maison
    const xH = XC + 6;
    const face = Math.atan2(XC + 0.9 - xH, VITRE_ZMONDE - FOND);
    const cible = (k: number): { cible: V3; k: number } => ({ cible: [XC + 1.1 + 0.3 * Math.sin((T - ev.mainColle) * 0.7), 2.75 - 0.08 * clampT(T - ev.mainColle, 0, 8), VITRE_ZMONDE - 0.62], k });
    // passage devant la fenêtre (scène 2) : marche vers −x, centre au droit de la fenêtre à `passe`
    if (T < ev.passe + 3.5) {
      const x = XC + V * (ev.passe - T);
      return { x, z: FOND, y, ry: -Math.PI / 2, phi: (V * T) / PAS, marche: 1, tete: [0.25 * Math.sin(T * 1.1), 0.1], s: S };
    }
    // retour : arrive par la droite, s'arrête devant la fenêtre, tourne la tête vers la vitre, tend la main
    if (T < ev.mainPart) {
      const attente = T >= tArr;
      const x = attente ? xH : xH + V * (tArr - T);
      const tourne = lisse(entre(T, tArr, tArr + 0.8));
      return {
        x,
        z: FOND,
        y,
        ry: mel(-Math.PI / 2, face, tourne),
        phi: (V * Math.min(T, tArr)) / PAS,
        marche: attente ? 1 - lisse(entre(T, tArr, tArr + 0.5)) : 1,
        tete: [0.1 * Math.sin(T * 0.8), -0.3 + 0.06 * Math.sin(T * 1.9)],
        bras: cible(lisse(entre(T, ev.mainApparait, ev.mainColle + 0.2))),
        s: S,
      };
    }
    // départ : retire la main, fait demi-tour et s'éloigne vers +x
    const t = T - ev.mainPart;
    const tourne = lisse(entre(t, 0.3, 1.2));
    return {
      x: xH + V * Math.max(0, t - 0.9),
      z: FOND,
      y,
      ry: mel(face, Math.PI / 2, tourne),
      phi: (V * tArr) / PAS + (V * Math.max(0, t - 0.9)) / PAS,
      marche: lisse(entre(t, 0.7, 1.2)),
      tete: [0.2 * Math.sin(T), -0.1],
      bras: cible(1 - lisse(entre(t, 0, 0.9))),
      s: S,
    };
  }
  // porte : silhouette qui attend dans la rue, face à la maison (souvenir du père)
  if (T < ev.perePart - 1 || T > ev.perePart + 4.5) return null;
  const k = entre(T, ev.perePart, ev.perePart + 3.5);
  return { x: PX - 3, z: 26, ry: Math.PI, phi: 0, marche: 0, tete: [0.15 * Math.sin(T * 0.9) + 0 * k, -0.1], s: S };
}
export const VITRE_ZMONDE = -4.75;

/** Instants des pas lourds (le pied touche le sol) dans un intervalle. */
export function pasCreature(lieu: "ville" | "chambre" | "porte", ev: Record<string, number>, t0: number, t1: number): number[] {
  const out: number[] = [];
  let prev: number | null = null;
  const dt = 1 / 120;
  for (let T = t0; T <= t1; T += dt) {
    const c = creatureEtat(lieu, T, ev);
    if (!c || c.marche < 0.6) {
      prev = null;
      continue;
    }
    const q = Math.floor((c.phi - Math.PI / 2) / Math.PI);
    if (prev !== null && q > prev) out.push(T);
    prev = q;
  }
  return out;
}

/** Tremblement (0..1) de la vitre selon les pas de la créature et les chocs de la main. */
const cachePas = new WeakMap<object, number[]>();
export function tremblement(T: number, ev: Record<string, number>, lieu: "ville" | "chambre"): number {
  let pas = cachePas.get(ev);
  if (!pas) {
    pas = [...pasCreature("ville", ev, 0, ev.cvArrive + 1), ...pasCreature("chambre", ev, 15, ev.passe + 3)];
    cachePas.set(ev, pas);
  }
  let a = 0;
  for (const t of pas) if (T >= t && T < t + 1.4) a += Math.exp(-(T - t) * 4.5);
  if (lieu === "chambre") {
    for (const t of [ev.mainColle, ev.mainColle + 1.7, ev.mainColle + 3.1]) if (T >= t && T < t + 1.2) a += 1.4 * Math.exp(-(T - t) * 5);
    if (T > ev.mainColle && T < ev.mainPart) a += 0.25 + 0.2 * Math.sin(T * 3.1);
  }
  return Math.min(1.6, a);
}
