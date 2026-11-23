/**
 * Jeu d'acteur d'Ecto : transforme une liste de « beats » (position, expression, geste)
 * et l'enveloppe de la voix en une pose 3D pour chaque frame. Entièrement déterministe.
 */
import type { Expression } from "./face";
import type { GhostPose, HandPose, HandShape } from "./Ghost3D";
import { basePose, restHand } from "./defaults";

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
  "peine-gauche",
  "peine-droite",
  "peine-haut",
  "peine-bas",
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

export interface Performance {
  beats: GhostBeat[];
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
  bodyY?: number;
  rotZ?: number;
  rotY?: number;
  squash?: number;
  look?: { x: number; y: number };
}

/** Pose de traction : une main attrape le bord du tableau côté entrée, l'autre aide ; le corps se penche et peine si besoin. */
function pullPose(g: Gesture, tl: number, L: HandPose, R: HandPose): GestureOut {
  const strong = g.startsWith("peine");
  const dir = g.split("-")[1] as "gauche" | "droite" | "haut" | "bas";
  const rate = strong ? 11 : 6.5;
  const heave = Math.sin(tl * rate); // va-et-vient du bras
  const effort = strong ? 1 : 0.45;
  const hand = dir === "gauche" || dir === "haut" ? L : R;
  const other = hand === L ? R : L;
  const sx = dir === "gauche" ? -1 : dir === "droite" ? 1 : hand === L ? -1 : 1;
  hand.shape = "poing";
  hand.scale = 1.3;
  hand.z = 0.45;
  if (dir === "gauche" || dir === "droite") {
    hand.x = sx * (1.38 + 0.2 * effort * heave);
    hand.y = 0.1 + 0.05 * heave;
    hand.dir = dir === "gauche" ? Math.PI : 0;
  } else if (dir === "haut") {
    hand.x = -0.95 + 0.12 * heave;
    hand.y = 0.95 + 0.14 * effort * heave;
    hand.dir = Math.PI / 2;
  } else {
    hand.x = 0.95 + 0.12 * heave;
    hand.y = -0.75 - 0.14 * effort * heave;
    hand.dir = -Math.PI / 2;
  }
  // la main libre s'agrippe aussi (tension), ou se crispe
  other.shape = "poing";
  other.z = 0.4;
  other.y = -0.05 + 0.05 * Math.sin(tl * rate + 1.2);
  const lean = (dir === "gauche" ? -1 : dir === "droite" ? 1 : 0) * (0.16 + 0.1 * effort * heave);
  return {
    left: L,
    right: R,
    rotZ: -lean * 0.8 + (strong ? 0.05 * Math.sin(tl * 23) : 0),
    rotY: (dir === "gauche" ? -1 : dir === "droite" ? 1 : 0) * 0.3,
    squash: strong ? 0.07 * (1 + Math.sin(tl * rate * 2)) * 0.5 : 0.02,
    bodyY: strong ? 0.03 * Math.sin(tl * 17) : 0,
    look: dir === "gauche" ? { x: -0.9, y: 0.1 } : dir === "droite" ? { x: 0.9, y: 0.1 } : { x: 0, y: dir === "haut" ? 0.9 : -0.8 },
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
    case "tire-gauche":
    case "tire-droite":
    case "tire-haut":
    case "tire-bas":
    case "peine-gauche":
    case "peine-droite":
    case "peine-haut":
    case "peine-bas":
      return pullPose(g, tl, L, R);
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

  // ---- corps ----
  const pose = basePose(t, expression);
  const te = (frame - exprFrame) / fps;
  const exprPop = exprFrame < 0 ? 0 : Math.exp(-te * 9) * Math.sin(te * 22) * 0.06;
  const landing = moving ? Math.exp(-ta * 7) * Math.sin(ta * 16) * 0.07 : 0;
  pose.bodyY = 0.055 * Math.sin(t * 2.75) + 0.05 * eSmooth + (gNext.bodyY ?? 0) * blend;
  pose.rotZ = 0.03 * Math.sin(t * 1.9) - vx * 0.0006 + (gNext.rotZ ?? 0) * blend + (gPrev.rotZ ?? 0) * (1 - blend);
  pose.rotY = 0.06 * Math.sin(t * 0.8) + (gNext.rotY ?? 0) * blend + (gPrev.rotY ?? 0) * (1 - blend);
  pose.squash = exprPop + landing + (gNext.squash ?? 0) * blend;
  pose.left = left;
  pose.right = right;
  pose.face = {
    expression,
    blink: expression === "joie" || expression === "clin" ? 0 : blink,
    lookX: lookTarget.x + jitterX,
    lookY: lookTarget.y + jitterY,
    mouthOpen: clamp(e0 * 1.25),
    speaking,
    time: t,
    glow: 1 + 0.25 * eSmooth,
  };
  pose.antennaTilt = -vx * 0.0012 + 0.07 * Math.sin(t * 3.3) + 0.12 * eSmooth * Math.sin(t * 20);
  pose.antennaGlow = 0.35 + 0.9 * eSmooth;
  pose.shadow = anchor === "centre" || anchor === "centre-haut";

  return { pose, x, y, s, visible: y < 2300 };
}
