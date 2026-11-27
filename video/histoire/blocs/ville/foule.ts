/**
 * Habitants d'une mise en scène « blocs » : chacun suit une liste d'étapes (instant, lieu, attitude). Entre deux étapes
 * éloignées, il marche à vitesse constante ; sinon il garde l'attitude de l'étape. Tout est déterministe (fonction du
 * temps), donc identique d'un plan à l'autre et d'un rendu à l'autre. Utilisé par la ville (huss) et les récits sombres.
 */
import type { V3 } from "../geo";
import type { Emotion } from "../textures";
import { type Pose, type Tenue, melPose, poseDebout, poseMarche } from "../avatar";
import { borne, mel } from "../maths";
import { poseAppel, poseDanse, poseHausse, poseInvite, poseMarcheFete, poseCourse } from "./anim";
import { poseAllonge, poseAssis, poseCache, poseCreuse, poseHalete, poseLanterne, posePousse, poseRetient, poseSerre, poseSomnambule, poseSomnambuleMarche, poseTombe, poseVeille, poseMontre } from "../conte/poses";
import { PERIODE } from "./lieux";

export type Mode =
  | "marche" | "fete" | "course" | "danse" | "appel" | "invite" | "hausse" | "debout"
  | "somnambule" | "creuse" | "tombe" | "cache" | "lanterne" | "pousse" | "assis" | "allonge" | "halete" | "retient" | "veille" | "montre" | "serre";
export type Etape = {
  t: number;
  p: V3;
  mode: Mode;
  /** lacet imposé à l'arrêt (sinon celui du dernier déplacement) */
  ry?: number;
  emotion?: Emotion;
  /** objet tenu à partir de cette étape (voir conte/objets.tsx) */
  objet?: string;
  /** hauteur de l'assise (mode « assis ») ou du lit (mode « allonge ») */
  h?: number;
};
export type Habitant = {
  id: string;
  tenue: Tenue;
  etapes: Etape[];
  graine: number;
  variante?: number;
  courrier?: boolean;
  /** 1 = adulte ; ~0,8 = enfant */
  echelle?: number;
  fantome?: boolean;
  sansClin?: boolean;
  clinRapide?: boolean;
};
export type Acteur = {
  p: V3;
  ry: number;
  pose: Pose;
  emotion: Emotion;
  tenue: Tenue;
  graine: number;
  courrier?: boolean;
  echelle: number;
  fantome: boolean;
  sansClin: boolean;
  clinRapide: boolean;
  objet?: string;
  /** bascule du corps (chute, allongé) */
  rx: number;
};

const EMOTION: Record<Mode, Emotion> = {
  marche: "neutre", fete: "sourire", course: "effraye", danse: "sourire", appel: "surpris", invite: "sourire", hausse: "curieux", debout: "neutre",
  somnambule: "vide", creuse: "resolu", tombe: "effraye", cache: "inquiet", lanterne: "resolu", pousse: "colere", assis: "neutre", allonge: "dort", halete: "effraye", retient: "inquiet", veille: "resolu", montre: "neutre", serre: "triste",
};

export const VITESSE_MARCHE = 3.0;
const PHASE_PAR_UNITE = 2.86; // même relation que poseMarche dans les autres mises en scène

function poseArret(mode: Mode, T: number, beat0: number, h: Habitant, e: Etape): Pose {
  const ph = (2 * Math.PI * (T - beat0)) / PERIODE + h.graine;
  switch (mode) {
    case "danse": return poseDanse(T, ph, h.variante ?? h.graine);
    case "appel": return poseAppel(T);
    case "invite": return poseInvite(T);
    case "hausse": return poseHausse(T);
    case "somnambule": return poseSomnambule(T, h.graine);
    case "creuse": return poseCreuse(T, h.graine);
    case "tombe": return poseTombe();
    case "cache": return poseCache(T, h.graine);
    case "lanterne": return poseLanterne(T, h.graine);
    case "pousse": return posePousse();
    case "assis": return poseAssis(T, e.h ?? 1.3, h.graine);
    case "allonge": return poseAllonge();
    case "halete": return poseHalete(T);
    case "retient": return poseRetient();
    case "veille": return poseVeille(T, h.graine);
    case "montre": return poseMontre(T);
    case "serre": return poseSerre();
    default: return poseDebout(T, h.graine);
  }
}

/** Position et attitude d'un habitant à l'instant T (null s'il n'est pas encore là). */
export function evaluer(h: Habitant, T: number, beat0: number): Acteur | null {
  const e = h.etapes;
  if (!e.length || T < e[0].t) return null;
  let i = e.length - 1;
  for (let k = 0; k < e.length - 1; k++) {
    if (T >= e[k].t && T < e[k + 1].t) {
      i = k;
      break;
    }
  }
  const a = e[i];
  const b = e[i + 1];
  // objet tenu : celui de la dernière étape qui en précise un
  let objet: string | undefined;
  for (let k = i; k >= 0; k--) if (e[k].objet !== undefined) { objet = e[k].objet || undefined; break; }
  const base = { tenue: h.tenue, graine: h.graine, courrier: h.courrier, echelle: h.echelle ?? 1, fantome: !!h.fantome, sansClin: !!h.sansClin, clinRapide: !!h.clinRapide, objet };
  // cap : celui du dernier déplacement avant l'étape i (ou imposé)
  let ry = a.ry ?? 0;
  if (a.ry === undefined) {
    for (let k = i; k >= 0; k--) {
      const n = e[k + 1] ?? e[k];
      const dx = n.p[0] - e[k].p[0];
      const dz = n.p[2] - e[k].p[2];
      if (k < e.length - 1 && Math.hypot(dx, dz) > 0.05) {
        ry = Math.atan2(dx, dz);
        break;
      }
    }
  }
  const y0 = a.mode === "allonge" || a.mode === "assis" ? 0 : a.p[1];
  if (b) {
    const dx = b.p[0] - a.p[0];
    const dz = b.p[2] - a.p[2];
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05) {
      const k = borne((T - a.t) / (b.t - a.t));
      const p: V3 = [mel(a.p[0], b.p[0], k), mel(a.p[1], b.p[1], k), mel(a.p[2], b.p[2], k)];
      const cap = Math.atan2(dx, dz);
      const marche = dist * k * PHASE_PAR_UNITE;
      const vitesse = dist / (b.t - a.t);
      let pose: Pose;
      if (a.mode === "course" || vitesse > 4.6) pose = poseCourse(dist * k * PHASE_PAR_UNITE * 0.78);
      else if (a.mode === "fete") pose = poseMarcheFete(marche);
      else if (a.mode === "somnambule") pose = poseSomnambuleMarche(marche);
      else if (a.mode === "lanterne") pose = { ...poseMarche(marche, 0.9), brasD: poseLanterne(T).brasD };
      else pose = poseMarche(marche);
      const reste = b.t - T;
      if (reste < 0.25) pose = melPose(pose, poseArret(b.mode, T, beat0, h, b), 1 - reste / 0.25);
      return { ...base, p, ry: b.ry !== undefined && reste < 0.3 ? mel(cap, b.ry, 1 - reste / 0.3) : cap, pose, emotion: a.emotion ?? EMOTION[a.mode], rx: 0 };
    }
  }
  // arrêt : chute progressive (0,55 s) ou allongé (à plat)
  let rx = 0;
  if (a.mode === "tombe") rx = -1.5 * borne((T - a.t) / 0.55);
  if (a.mode === "allonge") rx = -Math.PI / 2;
  const p: V3 = [a.p[0], y0 + (a.mode === "allonge" ? (a.h ?? 0.9) : 0) + (a.mode === "tombe" ? 0.22 * borne((T - a.t) / 0.55) : 0), a.p[2]];
  return { ...base, p, ry, pose: poseArret(a.mode, T, beat0, h, a), emotion: a.emotion ?? EMOTION[a.mode], rx };
}

/** Durée de marche entre deux points à la vitesse normale. */
export const duree = (a: V3, b: V3, v = VITESSE_MARCHE) => Math.hypot(b[0] - a[0], b[2] - a[2]) / v;
