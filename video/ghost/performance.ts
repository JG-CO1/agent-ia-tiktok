/**
 * Jeu d'acteur d'Ecto : transforme une liste de « beats » (position, expression, geste)
 * et l'enveloppe de la voix en une pose 3D pour chaque frame. Entièrement déterministe.
 */
import type { Expression } from "./face";
import type { GhostPose, HandPose, HandShape } from "./Ghost3D";
import { basePose, restHand } from "./defaults";
import { ACCESSOIRE_DEFS, actionAt, apparition, chapeauAt, lancerAt, propAt, rageAt, tremblement, type ChapeauEvent, type Lancer, type PropEvent, type RageKey } from "../../src/core/colere";
import { ARMEMENT, holdPose } from "./accessoires";
import { PULL_DISTANCE, PULL_DURATION, PULL_LEAD, PULLER_ANCHOR, pullProgress, ringRest, type PullDir, type PullStyle } from "../../src/core/pull";

export const ANCHORS = {
  centre: { x: 540, y: 1105, s: 1.0 },
  "centre-haut": { x: 540, y: 760, s: 0.9 },
  bas: { x: 540, y: 1520, s: 0.74 },
  "bas-gauche": { x: 255, y: 1500, s: 0.64 },
  "bas-droite": { x: 825, y: 1500, s: 0.64 },
  "haut-droite": { x: 840, y: 420, s: 0.5 },
  "haut-gauche": { x: 240, y: 420, s: 0.5 },
  gauche: { x: 300, y: 1000, s: 0.72 },
  droite: { x: 780, y: 1000, s: 0.72 },
  "hors-champ": { x: 540, y: 2500, s: 0.74 },
  // Mouvements de mise en scène : Ecto se rapproche de la caméra / recule pour laisser la place au visuel
  "gros-plan": { x: 540, y: 1180, s: 1.14 },
  recule: { x: 540, y: 1560, s: 0.6 },
  // Ecto fonce vers l'objectif (effet « il attrape la caméra ») : très gros plan, face à l'écran
  camera: { x: 540, y: 1470, s: 1.75 },
} as const;
export type Anchor = keyof typeof ANCHORS;

export const GESTURES = [
  "repos",
  "salut",
  "explique",
  "pointer-haut",
  "pointer-gauche",
  "pointer-droite",
  "pointer-toi",
  "pouce",
  "reflexion",
  "celebre",
  "presente",
  "tape",
  "haussement",
  "attrape",
  // Il tire un tableau depuis un côté : calme (tire-*) ou en peinant (peine-*)
  "tire-gauche",
  "tire-droite",
  "tire-haut",
  "tire-bas",
  "arrache-gauche",
  "arrache-droite",
  "arrache-haut",
  "arrache-bas",
  "peine-gauche",
  "peine-droite",
  "peine-haut",
  "peine-bas",
  // Personnalité (2026-11) : colère, accusation, respiration du retour au calme
  "enerve",
  "furie",
  "accuse",
  "respire",
] as const;
export type Gesture = (typeof GESTURES)[number];

export type Look = "camera" | "haut" | "bas" | "gauche" | "droite";

export interface GhostBeat {
  frame: number;
  anchor?: Anchor;
  expression?: Expression;
  gesture?: Gesture;
  look?: Look;
}

/** Effets de personnalité : colère, accessoires tenus, lancers vers la caméra (voir src/core/colere.ts). */
export interface PersoFx {
  rage: RageKey[];
  props: PropEvent[];
  lancers: Lancer[];
  /** Bonnet de Père Noël porté / ôté. */
  chapeau: ChapeauEvent[];
}

export interface Performance {
  beats: GhostBeat[];
  fx?: PersoFx;
  /** Enveloppe de la voix (0..1) par frame, pour la synchronisation labiale. */
  envelope: number[];
  seed: number;
}

// ---------- utilitaires ----------
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Ressort amorti analytique (0 -> 1 avec léger dépassement). */
function springStep(t: number, stiffness = 9, damping = 0.55) {
  if (t <= 0) return 0;
  const w = stiffness;
  const z = damping;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
}
function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function lerpHand(a: HandPose, b: HandPose, t: number): HandPose {
  // interpole l'angle par le plus court chemin
  let d = b.dir - a.dir;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    dir: a.dir + d * t,
    toCamera: lerp(a.toCamera, b.toCamera, t),
    shape: (t < 0.5 ? a.shape : b.shape) as HandShape,
    scale: lerp(a.scale, b.scale, t),
    roll: lerp(a.roll, b.roll, t),
  };
}

interface GestureOut {
  left: HandPose;
  right: HandPose;
  bodyX?: number;
  bodyY?: number;
  rotZ?: number;
  rotY?: number;
  squash?: number;
  rotX?: number;
  look?: { x: number; y: number };
}

/**
 * Pose de traction, calée image par image sur l'avancement réel du tableau (core/pull.ts) :
 * lancer de corde, puis halage main sur main ; le corps se penche en arrière sous la tension,
 * bascule en avant quand le tableau lui échappe (version « peine »), et se relâche à la mise en place.
 */
function pullPose(g: Gesture, tl: number, L: HandPose, R: HandPose): GestureOut {
  const [kind, d] = g.split("-") as [string, PullDir];
  const style: PullStyle = kind === "peine" ? "galere" : kind === "arrache" ? "rapide" : "facile";
  const dur = PULL_DURATION[style];
  const t = tl * 30 - PULL_LEAD; // images depuis l'apparition du tableau
  const pr = pullProgress(style, t);
  const dp = pr - pullProgress(style, t - 1);
  // direction de l'anneau vu d'Ecto (unités du modèle : x à droite, y en haut)
  const A = ANCHORS[PULLER_ANCHOR[d]];
  const rest = ringRest(d);
  const horizontal = d === "gauche" || d === "droite";
  const sign = d === "gauche" || d === "haut" ? -1 : 1;
  const off = PULL_DISTANCE[d] * (1 - Math.min(1, pr));
  const rx = rest.x + (horizontal ? sign * off : 0) - A.x;
  const ry = rest.y + (horizontal ? 0 : sign * off) - (A.y - 90 * A.s);
  const len = Math.hypot(rx, ry) || 1;
  const ux = rx / len;
  const uy = -ry / len;
  // allonge des bras : lancer (extension rapide), puis halage main sur main
  let reach: number;
  if (t < 0) reach = 0.55 + 0.95 * (1 - Math.pow(1 - clamp((t + PULL_LEAD) / PULL_LEAD), 3));
  else if (t < dur) reach = 0.78 + 0.62 * (1 - ((pr * 3.3) % 1));
  else reach = 0.8;
  const slipping = t > 0 && t < dur && dp < -0.004;
  const tension = t < 0 ? 0.25 : t >= dur ? 0 : slipping ? -0.9 : style === "galere" ? 1 : style === "rapide" ? 1.15 : 0.6;
  const lead = d === "droite" || d === "bas" ? R : L;
  const rear = lead === R ? L : R;
  const px = -uy;
  const py = ux;
  lead.x = ux * reach;
  lead.y = uy * reach + 0.05;
  rear.x = ux * (reach - 0.36) + px * 0.1;
  rear.y = uy * (reach - 0.36) + py * 0.1 + 0.05;
  for (const h of [lead, rear]) {
    h.z = 0.55;
    h.shape = "poing";
    h.scale = 1.25;
    h.dir = Math.atan2(uy, ux);
    h.toCamera = 0;
  }
  const strain = style === "galere" && t > 0 && t < dur ? 1 : 0;
  // « han ! » : à chaque brassée il part en arrière de tout son poids, puis revient chercher la corde
  const hauling = t > 0 && t < dur && !slipping;
  const heave = hauling ? 1 - (reach - 0.78) / 0.62 : 0;
  const back = slipping ? -1 : hauling ? 0.35 + 0.65 * heave : 0;
  return {
    left: L,
    right: R,
    // penché à l'opposé de la corde sous tension ; emporté vers elle quand ça glisse
    rotZ: ux * (0.1 * tension + 0.3 * back) + strain * 0.04 * Math.sin(tl * 26),
    rotY: 0.32 * ux,
    squash: (uy > 0.5 ? -1 : 1) * 0.07 * Math.max(0, back) + strain * 0.03 * Math.sin(tl * 21),
    bodyX: -ux * 0.26 * back,
    bodyY: -0.1 * uy * Math.max(0, back) + (slipping ? 0.08 * uy : 0),
    look: { x: ux * 0.9, y: uy * 0.9 },
  };
}

/** Pose des mains pour un geste, à l'instant local tl (s) et global tg (s). */
function gesturePose(g: Gesture, tl: number, tg: number): GestureOut {
  const L = restHand(-1);
  const R = restHand(1);
  const bob = (ph: number) => 0.035 * Math.sin(tg * 2.6 + ph);
  L.y += bob(0);
  R.y += bob(1.7);
  switch (g) {
    case "repos":
      return { left: L, right: R };
    case "salut": {
      R.x = 1.12;
      R.y = 0.62;
      R.z = 0.35;
      R.shape = "ouverte";
      R.dir = Math.PI / 2 - 0.35 + 0.42 * Math.sin(tl * 13);
      return { left: L, right: R, rotZ: -0.06 };
    }
    case "explique": {
      L.x = -0.98;
      R.x = 0.98;
      L.z = R.z = 0.55;
      L.y = -0.12 + 0.13 * Math.sin(tl * 5.2);
      R.y = -0.12 + 0.13 * Math.sin(tl * 5.2 + Math.PI * 0.9);
      L.dir = Math.PI - 0.35;
      R.dir = 0.35;
      L.shape = R.shape = "ouverte";
      return { left: L, right: R, rotZ: 0.03 * Math.sin(tl * 2.6) };
    }
    case "pointer-haut": {
      R.x = 0.88;
      R.y = 0.78 + 0.045 * Math.sin(tl * 9);
      R.z = 0.45;
      R.dir = Math.PI / 2 - 0.2;
      R.shape = "pointe";
      return { left: L, right: R, look: { x: 0.35, y: 0.85 }, rotZ: -0.05 };
    }
    case "pointer-gauche": {
      L.x = -1.22 - 0.04 * Math.sin(tl * 9);
      L.y = 0.1;
      L.z = 0.4;
      L.dir = Math.PI + 0.12;
      L.shape = "pointe";
      return { left: L, right: R, look: { x: -0.9, y: 0.1 }, rotY: -0.25, rotZ: 0.06 };
    }
    case "pointer-droite": {
      R.x = 1.22 + 0.04 * Math.sin(tl * 9);
      R.y = 0.1;
      R.z = 0.4;
      R.dir = -0.12;
      R.shape = "pointe";
      return { left: L, right: R, look: { x: 0.9, y: 0.1 }, rotY: 0.25, rotZ: -0.06 };
    }
    case "pointer-toi": {
      R.x = 0.62;
      R.y = -0.12 + 0.03 * Math.sin(tl * 8);
      R.z = 1.05;
      R.dir = 0.1;
      R.toCamera = 1;
      R.shape = "pointe";
      R.scale = 1.45;
      return { left: L, right: R, look: { x: 0, y: 0 } };
    }
    case "pouce": {
      const pop = 1 + 0.25 * Math.exp(-tl * 7) * Math.sin(tl * 18);
      R.x = 0.98;
      R.y = 0.08;
      R.z = 0.62;
      R.dir = 0;
      R.shape = "pouce";
      R.scale = 1.15 * pop;
      return { left: L, right: R };
    }
    case "reflexion": {
      R.x = 0.34;
      R.y = -0.24;
      R.z = 1.0;
      R.dir = Math.PI / 2 + 0.3;
      R.shape = "poing";
      L.x = -1.02;
      return { left: L, right: R, look: { x: 0.55, y: 0.75 }, rotZ: -0.07 };
    }
    case "celebre": {
      const jump = Math.abs(Math.sin(tl * 6.2));
      L.x = -1.02;
      R.x = 1.02;
      L.y = R.y = 0.88 + 0.08 * Math.sin(tl * 12);
      L.z = R.z = 0.3;
      L.dir = Math.PI / 2 + 0.45;
      R.dir = Math.PI / 2 - 0.45;
      L.shape = R.shape = "ouverte";
      return { left: L, right: R, bodyY: 0.16 * jump, squash: 0.08 * (1 - jump) - 0.03 };
    }
    case "presente": {
      L.x = -0.85;
      R.x = 0.85;
      L.y = R.y = 0.42;
      L.z = R.z = 0.5;
      L.dir = Math.PI / 2 + 0.7;
      R.dir = Math.PI / 2 - 0.7;
      L.shape = R.shape = "ouverte";
      return { left: L, right: R, look: { x: 0, y: 0.6 } };
    }
    case "tape": {
      const k = tl * 16;
      L.x = -0.5;
      R.x = 0.5;
      L.y = -0.5 + 0.05 * Math.max(0, Math.sin(k));
      R.y = -0.5 + 0.05 * Math.max(0, Math.sin(k + 2.1));
      L.z = R.z = 0.92;
      L.dir = -Math.PI / 2 - 0.3;
      R.dir = -Math.PI / 2 + 0.3;
      L.shape = R.shape = "poing";
      return { left: L, right: R, look: { x: 0, y: -0.6 } };
    }
    case "attrape": {
      // Les deux mains jaillissent vers la caméra, doigts écartés, avec un petit tremblement d'effort
      const reach = Math.min(1, tl / 0.18);
      const shake = 0.025 * Math.sin(tl * 40) * reach;
      L.x = -0.62;
      R.x = 0.62;
      L.y = R.y = 0.05 + shake;
      L.z = R.z = 0.5 + 0.7 * reach;
      L.toCamera = R.toCamera = reach;
      L.shape = R.shape = "ouverte";
      L.scale = R.scale = 1 + 0.75 * reach;
      L.dir = Math.PI / 2 + 0.25;
      R.dir = Math.PI / 2 - 0.25;
      return { left: L, right: R, look: { x: 0, y: 0 }, squash: -0.04 * reach };
    }
    case "arrache-gauche":
    case "arrache-droite":
    case "arrache-haut":
    case "arrache-bas":
    case "tire-gauche":
    case "tire-droite":
    case "tire-haut":
    case "tire-bas":
    case "peine-gauche":
    case "peine-droite":
    case "peine-haut":
    case "peine-bas":
      return pullPose(g, tl, L, R);
    case "enerve": {
      // poings serrés devant lui, qui tremblent ; il se penche vers l'écran
      const j = 0.02 * Math.sin(tl * 61);
      L.x = -0.66;
      R.x = 0.66;
      L.y = R.y = -0.12 + j;
      L.z = R.z = 0.85;
      L.dir = Math.PI / 2 + 0.5;
      R.dir = Math.PI / 2 - 0.5;
      L.shape = R.shape = "poing";
      L.scale = R.scale = 1.3;
      return { left: L, right: R, rotX: 0.12, squash: -0.02 + 0.015 * Math.sin(tl * 33), look: { x: 0, y: 0 } };
    }
    case "furie": {
      // bras qui moulinent, corps qui sursaute : gestes extrêmement rapides
      const k = tl * 21;
      L.x = -1.0 + 0.3 * Math.sin(k + 1);
      R.x = 1.0 + 0.3 * Math.sin(k + 4);
      L.y = 0.5 + 0.55 * Math.sin(k);
      R.y = 0.5 + 0.55 * Math.sin(k + Math.PI);
      L.z = R.z = 0.6 + 0.3 * Math.sin(k * 0.5);
      L.dir = Math.PI / 2 + 0.6 * Math.sin(k);
      R.dir = Math.PI / 2 - 0.6 * Math.sin(k);
      L.shape = R.shape = "poing";
      L.scale = R.scale = 1.35;
      const jump = Math.abs(Math.sin(k * 0.5));
      return { left: L, right: R, bodyY: 0.1 * jump, squash: 0.06 * (1 - jump) - 0.02, rotX: 0.14, rotZ: 0.08 * Math.sin(k * 0.5), look: { x: 0, y: 0 } };
    }
    case "accuse": {
      // il pointe le spectateur du doigt, par à-coups
      const jab = Math.max(0, Math.sin(tl * 15));
      R.x = 0.6;
      R.y = -0.08 + 0.05 * jab;
      R.z = 1.05 + 0.4 * jab;
      R.dir = 0.1;
      R.toCamera = 1;
      R.shape = "pointe";
      R.scale = 1.45 + 0.3 * jab;
      L.x = -0.7;
      L.y = -0.2;
      L.z = 0.8;
      L.shape = "poing";
      return { left: L, right: R, rotX: 0.1, look: { x: 0, y: 0 } };
    }
    case "respire": {
      // il pose les mains à plat et les descend lentement : « on se calme »
      const u = (Math.sin(tl * 2.4 - Math.PI / 2) + 1) / 2;
      L.x = -0.9;
      R.x = 0.9;
      L.y = R.y = 0.28 - 0.4 * u;
      L.z = R.z = 0.62;
      L.dir = Math.PI + 0.2;
      R.dir = -0.2;
      L.shape = R.shape = "ouverte";
      return { left: L, right: R, squash: -0.03 + 0.05 * u, look: { x: 0, y: -0.1 } };
    }
    case "haussement": {
      L.x = -1.12;
      R.x = 1.12;
      L.y = R.y = 0.18;
      L.dir = Math.PI - 0.6;
      R.dir = 0.6;
      L.shape = R.shape = "ouverte";
      return { left: L, right: R, squash: 0.05 };
    }
  }
}

/** La colère impose le visage : froncé dès qu'elle s'installe, hurlant en furie ; sinon l'expression demandée. */
function expressionFor(base: Expression, rage: number): Expression {
  if (rage >= 1.35) return "furie";
  if (rage >= 0.3) return "colere";
  return base;
}

const LOOKS: Record<Look, { x: number; y: number }> = {
  camera: { x: 0, y: 0 },
  haut: { x: 0.1, y: 0.9 },
  bas: { x: 0, y: -0.8 },
  gauche: { x: -0.9, y: 0.05 },
  droite: { x: 0.9, y: 0.05 },
};

export interface ResolvedGhost {
  pose: GhostPose;
  /** Position et échelle à l'écran (px dans la frame 1080x1920). */
  x: number;
  y: number;
  s: number;
  visible: boolean;
  /** Colère continue 0..2 à cette image (0 si aucune consigne). */
  rage: number;
}

/** Calcule l'état complet d'Ecto à la frame `frame`. */
export function resolveGhost(perf: Performance, frame: number, fps: number): ResolvedGhost {
  const beats = [...perf.beats].sort((a, b) => a.frame - b.frame);
  const t = frame / fps;

  // Dernière valeur connue de chaque piste + précédente (pour les transitions)
  let anchor: Anchor = "centre";
  let prevAnchor: Anchor = "centre";
  let anchorFrame = -999;
  let expression: Expression = "neutre";
  let exprFrame = -999;
  let gesture: Gesture = "repos";
  let prevGesture: Gesture = "repos";
  let gestureFrame = -999;
  let look: Look | undefined;
  for (const b of beats) {
    if (b.frame > frame) break;
    if (b.anchor && b.anchor !== anchor) {
      prevAnchor = anchor;
      anchor = b.anchor;
      anchorFrame = b.frame;
    } else if (b.anchor && anchorFrame < 0) {
      prevAnchor = b.anchor;
      anchorFrame = b.frame;
    }
    if (b.expression && b.expression !== expression) {
      expression = b.expression;
      exprFrame = b.frame;
    }
    if (b.gesture && b.gesture !== gesture) {
      prevGesture = gesture;
      gesture = b.gesture;
      gestureFrame = b.frame;
    }
    if (b.look) look = b.look;
  }

  // ---- position à l'écran (ressort) ----
  const ta = (frame - anchorFrame) / fps;
  const k = anchorFrame < 0 ? 1 : springStep(ta, 10, 0.62);
  const A0 = ANCHORS[prevAnchor];
  const A1 = ANCHORS[anchor];
  const x = lerp(A0.x, A1.x, k);
  const y = lerp(A0.y, A1.y, k);
  const s = lerp(A0.s, A1.s, k);
  const moving = anchorFrame >= 0 && ta < 0.7;
  const vx = moving ? (A1.x - A0.x) * Math.exp(-ta * 6) : 0;

  // ---- gestes (fondu entre l'ancien et le nouveau) ----
  const tg = (frame - gestureFrame) / fps;
  const blend = gestureFrame < 0 ? 1 : easeInOut(clamp(tg / 0.28));
  const gPrev = gesturePose(prevGesture, tg + 10, t);
  const gNext = gesturePose(gesture, Math.max(0, tg), t);
  const left = lerpHand(gPrev.left, gNext.left, blend);
  const right = lerpHand(gPrev.right, gNext.right, blend);

  // ---- voix ----
  const env = perf.envelope;
  const e0 = env[frame] ?? 0;
  const eSmooth = ((env[frame - 2] ?? 0) + (env[frame - 1] ?? 0) * 2 + e0 * 3 + (env[frame + 1] ?? 0) * 2) / 8;
  const speaking = eSmooth > 0.04;

  // ---- clignements déterministes ----
  let blink = 0;
  const period = 3.2;
  const cycle = Math.floor(t / period);
  const blinkAt = cycle * period + 0.4 + hash(cycle + perf.seed) * 2.2;
  const db = (t - blinkAt) * fps;
  if (db >= 0 && db < 6) blink = Math.sin((db / 6) * Math.PI);

  // ---- regard ----
  const lookTarget = look ? LOOKS[look] : gNext.look ?? { x: 0, y: 0 };
  const sacc = Math.floor(t / 1.7);
  const jitterX = (hash(sacc * 3.1 + perf.seed) - 0.5) * 0.25;
  const jitterY = (hash(sacc * 5.7 + perf.seed) - 0.5) * 0.18;

  // ---- personnalité : colère, accessoire tenu, lancer ----
  const fx = perf.fx;
  const rage = fx ? rageAt(fx.rage, frame) : 0;
  const trem = tremblement(rage, frame);
  const lancer = fx ? lancerAt(fx.lancers, frame) : null;
  const throwing = lancer && lancer.phase !== "impact" ? lancer : null;
  const prop = fx ? propAt(fx.props, frame) : null;
  let heldAcc = prop?.accessoire ?? null;
  let heldAge = prop?.age ?? 0;
  let vanish = 0;
  if (!heldAcc && prop?.parti && !lancer) {
    heldAcc = prop.parti.accessoire;
    heldAge = 999;
    vanish = clamp(prop.parti.depuis / 8);
  }
  // l'objet qui vient d'être lancé n'est plus dans sa main
  if (lancer && lancer.phase === "vol") heldAcc = null;
  const tremble = clamp(rage);
  const chapeauLance = throwing?.lancer.accessoire === "chapeau";
  const bonnet = fx ? chapeauAt(fx.chapeau, frame) : { on: false, age: 0 };
  let hold: ReturnType<typeof holdPose> | null = null;
  if (heldAcc) {
    const def = ACCESSOIRE_DEFS[heldAcc];
    const ap = apparition(heldAge);
    const act = heldAge >= 999 ? 0 : actionAt(def, heldAge);
    const poof = heldAge < 999 && heldAge >= 0 && heldAge < 9 ? 1 - heldAge / 9 : 0;
    hold = holdPose(heldAcc, heldAge, act, tremble, t, ap, vanish, poof);
  }

  // ---- corps ----
  const pose = basePose(t, expression);
  const te = (frame - exprFrame) / fps;
  const exprPop = exprFrame < 0 ? 0 : Math.exp(-te * 9) * Math.sin(te * 22) * 0.06;
  const landing = moving ? Math.exp(-ta * 7) * Math.sin(ta * 16) * 0.07 : 0;
  pose.bodyY = 0.055 * Math.sin(t * 2.75) + 0.05 * eSmooth + (gNext.bodyY ?? 0) * blend + trem.y * 0.022;
  pose.bodyX = (gNext.bodyX ?? 0) * blend + trem.x * 0.026;
  pose.rotZ = 0.03 * Math.sin(t * 1.9) - vx * 0.0006 + (gNext.rotZ ?? 0) * blend + (gPrev.rotZ ?? 0) * (1 - blend) + trem.rot * 0.035;
  pose.rotY = 0.06 * Math.sin(t * 0.8) + (gNext.rotY ?? 0) * blend + (gPrev.rotY ?? 0) * (1 - blend);
  pose.rotX = 0.06 + ((gNext.rotX ?? 0) * blend + (gPrev.rotX ?? 0) * (1 - blend));
  pose.squash = exprPop + landing + (gNext.squash ?? 0) * blend + (rage > 1.2 ? 0.035 * Math.sin(t * 41) * (rage - 1.2) : 0);
  pose.left = left;
  pose.right = right;
  let lookT = lookTarget;
  if (hold) {
    // il tient quelque chose : les mains, le regard et le corps suivent l'accessoire
    pose.left = hold.left;
    pose.right = hold.right;
    pose.bodyY += hold.bodyY ?? 0;
    pose.rotZ += hold.rotZ ?? 0;
    pose.squash += hold.squash ?? 0;
    if (hold.look && rage < 0.3) lookT = hold.look;
  }
  if (throwing) {
    // armement : bras en arrière, corps cambré ; puis détente du bras vers la caméra
    const arm = throwing.phase === "armement" ? easeInOut(throwing.t) : 1;
    const R = restHand(1);
    const ex = throwing.phase === "vol" ? easeInOut(clamp(throwing.t * 2.2)) : 0;
    // le bonnet : la main monte d'abord l'attraper sur sa tête (première moitié de l'armement), puis arme le bras
    const versTete = chapeauLance && throwing.phase === "armement" ? clamp(throwing.t * 2) : 1;
    const armeBras = chapeauLance && throwing.phase === "armement" ? clamp(throwing.t * 2 - 1) : arm;
    const dep = chapeauLance ? { x: 0.3, y: 1.05, z: 0.55 } : { x: hold?.right.x ?? 0.64, y: hold?.right.y ?? -0.3, z: hold?.right.z ?? 0.9 };
    const mid = chapeauLance ? { x: lerp(restHand(1).x, dep.x, easeInOut(versTete)), y: lerp(restHand(1).y, dep.y, easeInOut(versTete)), z: lerp(restHand(1).z, dep.z, easeInOut(versTete)) } : dep;
    R.x = lerp(mid.x, ARMEMENT.x, easeInOut(armeBras));
    R.y = lerp(mid.y, ARMEMENT.y, easeInOut(armeBras));
    R.z = lerp(mid.z, ARMEMENT.z, easeInOut(armeBras));
    R.shape = "poing";
    R.scale = 1.3;
    if (ex > 0) {
      R.x = lerp(ARMEMENT.x, 0.45, ex);
      R.y = lerp(ARMEMENT.y, 0.18, ex);
      R.z = lerp(ARMEMENT.z, 1.45, ex);
      R.toCamera = ex;
      R.shape = "ouverte";
      R.scale = 1.3 + 0.5 * ex;
    }
    pose.right = R;
    const Lh = restHand(-1);
    Lh.x = -0.95;
    Lh.y = 0.35 + 0.3 * arm;
    Lh.z = 0.55;
    Lh.shape = "poing";
    Lh.scale = 1.25;
    pose.left = Lh;
    pose.rotZ += throwing.phase === "armement" ? 0.12 * arm : 0.12 - 0.3 * ex;
    pose.rotX = 0.06 - 0.12 * arm + (throwing.phase === "vol" ? 0.32 * ex : 0);
    pose.squash += throwing.phase === "vol" ? -0.06 * ex : 0.03 * arm;
    lookT = { x: 0, y: 0 };
    // l'objet suit la main pendant l'armement (le bonnet n'apparaît dans sa main qu'une fois arraché de sa tête)
    if (throwing.phase === "armement") {
      if (hold) {
        hold.render.x = R.x - 0.12;
        hold.render.y = R.y + 0.05;
        hold.render.z = R.z + 0.05;
        hold.render.rz = 0.5 * arm;
      } else if (chapeauLance && throwing.t >= 0.5) {
        hold = { left: Lh, right: R, render: { id: "chapeau", x: R.x, y: R.y + 0.08, z: R.z + 0.12, rx: 0, ry: 0, rz: 0.4, s: 1, a: 0, tremble: 0, age: heldAge, vanish: 0, poof: 0 } };
      }
    }
  }
  pose.face = {
    expression: expressionFor(expression, rage),
    blink: expression === "joie" || expression === "clin" || rage > 0.3 ? 0 : blink,
    lookX: rage > 0.3 ? 0 : lookT.x + jitterX,
    lookY: rage > 0.3 ? 0 : lookT.y + jitterY,
    mouthOpen: clamp(e0 * (rage > 0.3 ? 1.5 : 1.25)),
    speaking,
    time: t,
    glow: 1 + 0.25 * eSmooth,
    rage,
  };
  pose.rage = rage;
  if (hold) pose.prop = hold.render;
  if (bonnet.on) pose.hat = { s: bonnet.age < 9 && bonnet.age >= 0 && frame > 2 ? apparition(bonnet.age) : 1, tremble, bob: bonnet.age >= 0 && bonnet.age < 9 && frame > 2 ? 1 - bonnet.age / 9 : 0 };
  pose.antennaTilt = -vx * 0.0012 + 0.07 * Math.sin(t * 3.3) + 0.12 * eSmooth * Math.sin(t * 20) + 0.18 * rage * Math.sin(t * 46);
  pose.antennaGlow = 0.35 + 0.9 * eSmooth + 0.5 * rage;
  pose.shadow = anchor === "centre" || anchor === "centre-haut";

  return { pose, x, y, s, visible: y < 2300, rage };
}

/**
 * Position à l'écran (px, repère du calque d'Ecto) du milieu de ses deux mains : sert à y accrocher la corde.
 * Reproduit la hiérarchie de Ghost3D (mains dans le groupe du corps, rotation Euler XYZ) et la caméra de GhostLayer.
 */
export function handsScreen(g: ResolvedGhost): { left: { x: number; y: number }; right: { x: number; y: number }; unit: number } {
  const unit = (1000 / (2 * 9.5 * Math.tan((11 * Math.PI) / 180))) * g.s; // px par unité du modèle
  const { rotY, rotZ, bodyX, bodyY, scale } = g.pose;
  const one = (h: HandPose) => {
    const x1 = h.x * Math.cos(rotZ) - h.y * Math.sin(rotZ);
    const y1 = h.x * Math.sin(rotZ) + h.y * Math.cos(rotZ);
    const x2 = x1 * Math.cos(rotY) + h.z * Math.sin(rotY);
    const z2 = -x1 * Math.sin(rotY) + h.z * Math.cos(rotY);
    const f = 9.5 / (9.5 - z2 * scale);
    return { x: g.x + (x2 + bodyX) * scale * unit * f, y: g.y - ((y1 + bodyY) * scale - 0.15) * unit * f };
  };
  return { left: one(g.pose.left), right: one(g.pose.right), unit };
}

/** Point du modèle (repère du corps) projeté à l'écran (px) : sert à placer fumée, flammes et objets lancés. */
export function modelToScreen(g: ResolvedGhost, mx: number, my: number, mz = 0): { x: number; y: number } {
  const unit = (1000 / (2 * 9.5 * Math.tan((11 * Math.PI) / 180))) * g.s;
  const { rotY, rotZ, bodyX, bodyY, scale } = g.pose;
  const x1 = mx * Math.cos(rotZ) - my * Math.sin(rotZ);
  const y1 = mx * Math.sin(rotZ) + my * Math.cos(rotZ);
  const x2 = x1 * Math.cos(rotY) + mz * Math.sin(rotY);
  const z2 = -x1 * Math.sin(rotY) + mz * Math.cos(rotY);
  const f = 9.5 / (9.5 - z2 * scale);
  return { x: g.x + (x2 + bodyX) * scale * unit * f, y: g.y - ((y1 + bodyY) * scale - 0.15) * unit * f };
}
