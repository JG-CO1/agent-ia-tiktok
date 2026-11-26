/**
 * Habitants de la ville : chacun suit une liste d'étapes (instant, lieu, attitude). Entre deux étapes éloignées,
 * il marche à vitesse constante ; sinon il garde l'attitude de l'étape. Tout est déterministe (fonction du temps),
 * donc identique d'un plan à l'autre et d'un rendu à l'autre.
 */
import type { V3 } from "../geo";
import type { Emotion } from "../textures";
import { type Pose, type Tenue, melPose, poseDebout, poseMarche } from "../avatar";
import { borne, mel } from "../maths";
import { poseAppel, poseDanse, poseHausse, poseInvite, poseMarcheFete, poseCourse } from "./anim";
import { PERIODE } from "./lieux";

export type Mode = "marche" | "fete" | "course" | "danse" | "appel" | "invite" | "hausse" | "debout";
export type Etape = { t: number; p: V3; mode: Mode; /** lacet imposé à l'arrêt (sinon celui du dernier déplacement) */ ry?: number };
export type Habitant = { id: string; tenue: Tenue; etapes: Etape[]; graine: number; variante?: number; courrier?: boolean };
export type Acteur = { p: V3; ry: number; pose: Pose; emotion: Emotion; tenue: Tenue; graine: number; courrier?: boolean };

const EMOTION: Record<Mode, Emotion> = { marche: "neutre", fete: "sourire", course: "sourire", danse: "sourire", appel: "surpris", invite: "sourire", hausse: "curieux", debout: "neutre" };

export const VITESSE_MARCHE = 3.0;
const PHASE_PAR_UNITE = 2.86; // même relation que poseMarche dans les autres mises en scène

function poseArret(mode: Mode, T: number, beat0: number, h: Habitant): Pose {
  const ph = (2 * Math.PI * (T - beat0)) / PERIODE + h.graine;
  switch (mode) {
    case "danse":
      return poseDanse(T, ph, h.variante ?? h.graine);
    case "appel":
      return poseAppel(T);
    case "invite":
      return poseInvite(T);
    case "hausse":
      return poseHausse(T);
    default:
      return poseDebout(T, h.graine);
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
  if (b) {
    const dx = b.p[0] - a.p[0];
    const dz = b.p[2] - a.p[2];
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05) {
      const k = borne((T - a.t) / (b.t - a.t));
      const p: V3 = [mel(a.p[0], b.p[0], k), 0, mel(a.p[2], b.p[2], k)];
      const cap = Math.atan2(dx, dz);
      const marche = (dist * k) * PHASE_PAR_UNITE;
      const vitesse = dist / (b.t - a.t);
      let pose: Pose;
      if (a.mode === "course" || vitesse > 4.6) pose = poseCourse((dist * k * PHASE_PAR_UNITE) * 0.78);
      else if (a.mode === "fete") pose = poseMarcheFete(marche);
      else pose = poseMarche(marche);
      // arrivée : on ralentit dans la pose pour enchaîner sur l'attitude de l'étape suivante (0,25 s)
      const reste = b.t - T;
      if (reste < 0.25) pose = melPose(pose, poseArret(b.mode, T, beat0, h), 1 - reste / 0.25);
      return { p, ry: b.ry !== undefined && reste < 0.3 ? mel(cap, b.ry, 1 - reste / 0.3) : cap, pose, emotion: EMOTION[a.mode], tenue: h.tenue, graine: h.graine, courrier: h.courrier };
    }
  }
  return { p: [a.p[0], 0, a.p[2]], ry, pose: poseArret(a.mode, T, beat0, h), emotion: EMOTION[a.mode], tenue: h.tenue, graine: h.graine, courrier: h.courrier };
}

/** Durée de marche entre deux points à la vitesse normale. */
export const duree = (a: V3, b: V3, v = VITESSE_MARCHE) => Math.hypot(b[0] - a[0], b[2] - a[2]) / v;
