/**
 * Caméra virtuelle : transforme la timeline en mouvements de caméra déterministes.
 * Fonctions pures (sans React ni Remotion) : testables et identiques d'un rendu à l'autre.
 *
 * Principes :
 *  - jamais plus de ~1,2 s d'immobilité : chaque scène a un mouvement lent, choisi selon son rôle narratif ;
 *  - deux scènes consécutives n'utilisent jamais le même mouvement ;
 *  - « punch-in » bref sur les mots d'emphase et les temps forts, micro-secousse sur les impacts ;
 *  - amplitudes bornées (zoom ≤ 1,22, translation ≤ 96 px, roulis ≤ 1,3°) pour ne pas fatiguer les yeux ;
 *  - le zoom reste toujours ≥ 1 : aucun bord vide n'apparaît.
 */
import type { Timeline, TimelineScene } from "../../src/core/timeline";
import { STRUGGLE_JERKS } from "../../src/core/pull";

export type MoveKind =
  | "zoom-lent" // tension : rapprochement progressif
  | "revele" // dézoom qui révèle
  | "travelling-g" // travelling latéral vers la gauche
  | "travelling-d" // travelling latéral vers la droite
  | "panoramique-haut" // découverte vers le haut
  | "panoramique-bas"
  | "respire"; // quasi-statique, très léger (moments sensibles)

export interface CameraSegment {
  from: number;
  to: number;
  kind: MoveKind;
  /** Sens du roulis à l'entrée du plan (changement d'angle). */
  tilt: 1 | -1;
}

export interface Pulse {
  frame: number;
  /** Intensité du punch-in (zoom additionnel). */
  zoom: number;
  /** Intensité de la secousse (px). */
  shake: number;
}

export interface CameraPlan {
  segments: CameraSegment[];
  pulses: Pulse[];
  /** Images de départ des moments où Ecto attrape la caméra (zoom immersif sur lui). */
  grabs: number[];
  seed: number;
}

export interface CameraState {
  /** Zoom global (≥ 1). */
  scale: number;
  tx: number;
  ty: number;
  /** Roulis en degrés. */
  rot: number;
  /** Point focal du zoom (px) : le centre, ou Ecto pendant un « attrape la caméra ». */
  ox: number;
  oy: number;
}

export const CAMERA_LIMITS = { scaleMax: 1.36, shiftMax: 96, rotMax: 1.3 } as const;
/** Durée d'un « attrape la caméra » (images) : élan, maintien, retour. */
export const GRAB_FRAMES = 32;

const W = 1080;
const H = 1920;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Mouvement préféré selon le rôle narratif de la scène. */
function preferred(sc: TimelineScene): MoveKind[] {
  switch (sc.type) {
    case "accroche":
      return ["zoom-lent"];
    case "chiffre":
      return ["zoom-lent", "revele"];
    case "citation":
      return ["respire", "zoom-lent"];
    case "cta":
      return ["revele"];
    case "repo":
    case "capture":
      return ["revele", "panoramique-bas", "travelling-g"];
    case "terminal":
    case "code":
      return ["travelling-d", "panoramique-haut", "zoom-lent"];
    case "comparaison":
      return ["travelling-g", "travelling-d"];
    default:
      return ["travelling-d", "travelling-g", "zoom-lent", "revele", "panoramique-haut"];
  }
}

/** Longues scènes : on les coupe en plans pour ne jamais rester > ~3,2 s sur le même mouvement. */
const MAX_SEGMENT = 96;

export function buildCameraPlan(tl: Timeline): CameraPlan {
  const segments: CameraSegment[] = [];
  let last: MoveKind | null = null;
  let tilt: 1 | -1 = hash(tl.seed) > 0.5 ? 1 : -1;
  tl.scenes.forEach((sc) => {
    const to = sc.from + sc.duration;
    const n = Math.max(1, Math.round(sc.duration / MAX_SEGMENT));
    const len = sc.duration / n;
    for (let k = 0; k < n; k++) {
      const options = preferred(sc).filter((m) => m !== last);
      const pool = options.length ? options : (["zoom-lent", "revele", "travelling-d", "travelling-g"] as MoveKind[]).filter((m) => m !== last);
      const kind = k > 0 && n > 1 && hash(tl.seed + sc.index * 7 + k) > 0.5 ? pool[(k + sc.index) % pool.length] : pool[(sc.index + k + tl.seed) % pool.length];
      tilt = tilt === 1 ? -1 : 1;
      segments.push({ from: Math.round(sc.from + k * len), to: k === n - 1 ? to : Math.round(sc.from + (k + 1) * len), kind, tilt });
      last = kind;
    }
  });

  const pulses: Pulse[] = [];
  // Punch-in sur les mots d'emphase (espacés d'au moins 0,5 s pour éviter le tressautement)
  let lastPulse = -999;
  for (const w of tl.words) {
    if (!w.emphasis || w.from - lastPulse < 15) continue;
    pulses.push({ frame: w.from, zoom: 0.03, shake: 0 });
    lastPulse = w.from;
  }
  // Impacts : secousse subtile + punch plus marqué
  for (const c of tl.sfx) {
    if (c.son === "impact") pulses.push({ frame: c.frame, zoom: 0.02, shake: 8 });
    else if (c.son === "ding") pulses.push({ frame: c.frame, zoom: 0.015, shake: 0 });
  }
  // « Ecto attrape la caméra » : petit coup de caméra quand il arrive à l'objectif
  const grabs = tl.beats.filter((b) => b.anchor === "camera").map((b) => b.frame);
  for (const g of grabs) pulses.push({ frame: g + 7, zoom: 0.04, shake: 9 });
  // Tableaux tirés par Ecto : la caméra encaisse chaque à-coup de la version « galère » (sans son), puis la mise en place
  for (const p of tl.pulls) {
    if (p.style === "galere") for (const j of STRUGGLE_JERKS) pulses.push({ frame: p.from + j, zoom: 0, shake: 6 });
    else pulses.push({ frame: p.from + p.dur, zoom: 0.012, shake: p.style === "rapide" ? 8 : 3 });
  }
  pulses.sort((a, b) => a.frame - b.frame);
  return { segments, pulses, grabs, seed: tl.seed };
}

export function segmentAt(plan: CameraPlan, frame: number): CameraSegment {
  let cur = plan.segments[0];
  for (const s of plan.segments) if (frame >= s.from) cur = s;
  return cur;
}

/** Position de repos (0..1) d'un mouvement en fonction de l'avancement p ∈ [0,1] du plan. */
function moveOffsets(kind: MoveKind, p: number): { s: number; x: number; y: number } {
  const e = smooth(clamp(p, 0, 1));
  switch (kind) {
    case "zoom-lent":
      return { s: 1.0 + 0.06 * e, x: 0, y: -10 * e };
    case "revele":
      return { s: 1.07 - 0.06 * e, x: 0, y: 8 * e };
    case "travelling-g":
      return { s: 1.05, x: 26 - 52 * e, y: 0 };
    case "travelling-d":
      return { s: 1.05, x: -26 + 52 * e, y: 0 };
    case "panoramique-haut":
      return { s: 1.05, x: 0, y: 30 - 60 * e };
    case "panoramique-bas":
      return { s: 1.05, x: 0, y: -30 + 60 * e };
    case "respire":
      return { s: 1.015 + 0.02 * e, x: 0, y: 0 };
  }
}

/**
 * État de la caméra à la frame donnée.
 * `follow` : position d'Ecto à l'écran (px) ; la caméra le suit légèrement quand il se déplace.
 */
export function cameraAt(plan: CameraPlan, frame: number, follow?: { x: number; y: number; s: number }): CameraState {
  const seg = segmentAt(plan, frame);
  const span = Math.max(1, seg.to - seg.from);
  const p = (frame - seg.from) / span;
  const base = moveOffsets(seg.kind, p);

  // Entrée de plan : léger « changement d'angle » (zoom + roulis) qui se résorbe en 0,4 s
  const age = frame - seg.from;
  const enter = age < 14 ? 1 - easeOut(age / 14) : 0;
  let scale = base.s + 0.025 * enter;
  let tx = base.x + seg.tilt * 12 * enter;
  let ty = base.y;
  let rot = seg.tilt * 0.45 * enter;

  // Impulsions : ressort amorti (montée 2 frames, retombée ~10 frames) + secousse décroissante
  for (const pu of plan.pulses) {
    const d = frame - pu.frame;
    if (d < -1 || d > 18) continue;
    const up = d < 0 ? 0 : d < 2 ? d / 2 : Math.exp(-(d - 2) / 5);
    scale += pu.zoom * up;
    if (pu.shake > 0 && d >= 0) {
      const decay = Math.exp(-d / 3.2);
      tx += pu.shake * decay * Math.sin(d * 2.7 + pu.frame);
      ty += pu.shake * 0.7 * decay * Math.cos(d * 3.3 + pu.frame * 0.5);
      rot += 0.25 * decay * Math.sin(d * 2.1);
    }
  }

  // Attrape la caméra : plongée vers Ecto (élan rapide, maintien, retour doux), zoom centré sur lui
  let grab = 0;
  for (const g of plan.grabs) {
    const d = frame - g;
    if (d < -2 || d > GRAB_FRAMES + 12) continue;
    const up = easeOut(clamp(d / 7, 0, 1));
    const down = 1 - smooth(clamp((d - (GRAB_FRAMES - 6)) / 14, 0, 1));
    grab = Math.max(grab, up * down);
  }
  scale += 0.2 * grab;
  rot += 0 * grab;

  // Suivi d'Ecto : la caméra accompagne ses déplacements sans le centrer de force
  if (follow) {
    tx += clamp((W / 2 - follow.x) * 0.1, -40, 40);
    ty += clamp((1100 - follow.y) * 0.03, -22, 22);
  }

  scale = clamp(scale, 1, CAMERA_LIMITS.scaleMax);
  // Point focal : centre de l'image, tiré vers Ecto pendant la plongée
  const ox = W / 2 + grab * ((follow ? clamp(follow.x, 200, W - 200) : W / 2) - W / 2);
  const oy = H / 2 + grab * ((follow ? clamp(follow.y, 600, H - 600) : H / 2) - H / 2);
  // Un zoom de s laisse (s-1)×(distance au bord) de marge : on borne la translation pour ne jamais découvrir de bord vide.
  const maxX = Math.min(CAMERA_LIMITS.shiftMax, (scale - 1) * Math.min(ox, W - ox) - 2);
  const maxY = Math.min(CAMERA_LIMITS.shiftMax, (scale - 1) * Math.min(oy, H - oy) - 2);
  tx = clamp(tx, -Math.max(0, maxX), Math.max(0, maxX));
  ty = clamp(ty, -Math.max(0, maxY), Math.max(0, maxY));
  rot = clamp(rot, -CAMERA_LIMITS.rotMax, CAMERA_LIMITS.rotMax);
  return { scale, tx, ty, rot, ox, oy };
}

/** CSS d'un calque à une profondeur donnée (1 = plan des scènes ; <1 = lointain ; >1 = proche). */
export function layerTransform(cam: CameraState, depth: number): string {
  const s = 1 + (cam.scale - 1) * depth;
  return `translate(${(cam.tx * depth).toFixed(2)}px, ${(cam.ty * depth).toFixed(2)}px) rotate(${(cam.rot * depth).toFixed(3)}deg) scale(${s.toFixed(4)})`;
}

/**
 * Courbe de volume musical (0..1) : respire avec la narration, monte sur les temps forts,
 * se tait pendant les phrases sensibles (accroche, chiffres, citations) et s'ouvre sur le final.
 */
export function musicGain(tl: Timeline, frame: number): number {
  const voice = Math.min(1, (tl.envelope[frame] ?? 0) * 1.5);
  let g = 1 - 0.55 * voice; // la voix reste prioritaire
  const sc = tl.scenes.find((s) => frame >= s.from && frame < s.from + s.duration) ?? tl.scenes[0];
  if (sc.type === "citation" || sc.type === "chiffre") g *= 0.75; // passage sensible : on s'efface
  // montée progressive sur la seconde qui précède une transition marquée, puis relâchement
  for (const next of tl.scenes) {
    if (next.index === 0) continue;
    const d = next.from - frame;
    if (d >= 0 && d < 20) g *= 1 + 0.5 * (1 - d / 20);
  }
  if (sc.type === "cta") g *= 1.25;
  // ouverture / fermeture
  const total = tl.durationInFrames;
  g *= Math.min(1, frame / 15) * Math.min(1, (total - frame) / 36);
  return clamp(g, 0, 1.6);
}

/** Image d'un point d'un calque (profondeur `depth`) à l'écran, et l'inverse : sert à relier deux calques (corde). */
export function layerToScreen(cam: CameraState, depth: number, p: { x: number; y: number }): { x: number; y: number } {
  const s = 1 + (cam.scale - 1) * depth;
  const a = (cam.rot * depth * Math.PI) / 180;
  const dx = (p.x - cam.ox) * s;
  const dy = (p.y - cam.oy) * s;
  return { x: cam.ox + cam.tx * depth + dx * Math.cos(a) - dy * Math.sin(a), y: cam.oy + cam.ty * depth + dx * Math.sin(a) + dy * Math.cos(a) };
}
export function screenToLayer(cam: CameraState, depth: number, p: { x: number; y: number }): { x: number; y: number } {
  const s = 1 + (cam.scale - 1) * depth;
  const a = (-cam.rot * depth * Math.PI) / 180;
  const dx = p.x - cam.ox - cam.tx * depth;
  const dy = p.y - cam.oy - cam.ty * depth;
  return { x: cam.ox + (dx * Math.cos(a) - dy * Math.sin(a)) / s, y: cam.oy + (dx * Math.sin(a) + dy * Math.cos(a)) / s };
}
