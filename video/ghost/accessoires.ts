/**
 * Accessoires d'Ecto : où ils sont, comment il les tient, ce qu'il en fait (boire, serrer, ajuster, tourner une page…).
 * Fonctions pures de l'état de l'accessoire (âge, action, tremblement) ; le dessin 3D est dans Accessoires3D.tsx.
 * Toutes les positions sont dans le repère du corps (celui des mains), en unités du modèle.
 */
import type { Accessoire } from "../../src/core/colere";
import { ACCESSOIRE_DEFS } from "../../src/core/colere";
import type { HandPose } from "./Ghost3D";
import { restHand } from "./defaults";

export interface PropRender {
  id: Accessoire;
  x: number;
  y: number;
  z: number;
  /** Rotations (rad) autour de x, y, z. */
  rx: number;
  ry: number;
  rz: number;
  /** Échelle d'apparition / de disparition (0..1.1). */
  s: number;
  /** Avancement de la petite action (0 repos, 1 pleine action). */
  a: number;
  /** Tremblement de colère (0..1) : la tasse vibre, le liquide frémit. */
  tremble: number;
  /** Images depuis l'apparition (animations en boucle : vapeur, pages). */
  age: number;
  /** Disparition en cours (0..1) : sert au « poof ». */
  vanish: number;
  /** Éclat d'apparition en cours (0..1). */
  poof: number;
}

export interface HoldOut {
  left: HandPose;
  right: HandPose;
  render: PropRender;
  bodyY?: number;
  rotZ?: number;
  rotX?: number;
  squash?: number;
  look?: { x: number; y: number };
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function hand(side: -1 | 1, x: number, y: number, z: number, shape: HandPose["shape"] = "poing", scale = 1.15, dir?: number): HandPose {
  const h = restHand(side);
  h.x = x;
  h.y = y;
  h.z = z;
  h.shape = shape;
  h.scale = scale;
  if (dir !== undefined) h.dir = dir;
  return h;
}

/**
 * Pose des mains et position de l'accessoire.
 * @param age images depuis l'apparition · @param a avancement de l'action (0..1) · @param tremble colère 0..1 · @param t temps (s)
 */
export function holdPose(id: Accessoire, age: number, a: number, tremble: number, t: number, ap: number, vanish: number, poof: number): HoldOut {
  const def = ACCESSOIRE_DEFS[id];
  const e = smooth(a);
  const jx = tremble * 0.014 * Math.sin(t * 74);
  const jy = tremble * 0.012 * Math.sin(t * 91 + 1.3);
  const bob = 0.012 * Math.sin(t * 2.6);
  // apparition : monte depuis le bas des mains, avec un petit rebond
  const rise = (1 - clamp(ap)) * -0.25;
  const mk = (x: number, y: number, z: number, o: Partial<PropRender> = {}): PropRender => ({
    id,
    x: x + jx,
    y: y + jy + rise,
    z,
    rx: 0,
    ry: 0,
    rz: 0,
    s: ap * (1 - vanish),
    a,
    tremble,
    age,
    vanish,
    poof,
    ...o,
  });
  switch (def.tenue) {
    case "main": {
      // tasse / fleur dans la main droite ; la main gauche soutient (chocolat) ou se pose
      const flower = id === "fleur";
      const x = lerp(0.64, flower ? 0.16 : 0.1, e);
      const y = lerp(flower ? -0.3 : -0.42, flower ? -0.26 : 0.12, e) + bob;
      const z = lerp(0.92, flower ? 1.12 : 1.2, e);
      const tilt = (flower ? 0.28 : 0.4) * e;
      const render = mk(x, y, z, { rz: tilt + tremble * 0.03 * Math.sin(t * 63) });
      const R = hand(1, x + (flower ? 0.0 : 0.2), y + (flower ? -0.08 : -0.03), z + 0.1, "poing", 1.15);
      const L = id === "chocolat" ? hand(-1, x - 0.17, y - 0.1, z + 0.1, "ouverte", 1.1, Math.PI / 2 + 0.2) : hand(-1, -0.52, -0.46, 0.8, "poing", 1.1);
      return { left: L, right: R, render, bodyY: -0.02 * e, rotZ: -0.03 * e, look: { x: 0, y: -0.25 * (1 - e) } };
    }
    case "serre": {
      // doudou / peluche / coussin serrés contre lui, caresse de la main droite pendant l'action
      const big = id === "coussin";
      const sq = 1 - 0.09 * e;
      const y = (big ? -0.5 : -0.56) + 0.03 * e + bob;
      const render = mk(0, y, big ? 1.08 : 1.02, { rz: 0.06 * Math.sin(t * 1.4), s: ap * (1 - vanish) * sq * (big ? 1 : 0.8) });
      const sweep = Math.sin(t * 5.2) * 0.14 * e;
      const R = hand(1, 0.36 + (big ? 0.12 : 0) + sweep * 0.3, y + 0.18 * e + 0.02, 1.22 + 0.1 * e, e > 0.05 ? "ouverte" : "poing", 1.1, Math.PI / 2 + 0.7);
      const L = hand(-1, -0.36 - (big ? 0.12 : 0), y + 0.04, 1.18, "poing", 1.1, Math.PI / 2 - 0.2);
      return { left: L, right: R, render, squash: 0.02 * e, rotZ: 0.03 * Math.sin(t * 1.4) * 0.5, look: { x: 0, y: -0.2 } };
    }
    case "deux-mains": {
      // livre ouvert tenu à deux mains, page tournée pendant l'action
      const render = mk(0, -0.42 + bob, 1.04, { rx: -0.22 });
      const L = hand(-1, -0.46, -0.5, 1.12, "poing", 1.1);
      const R = hand(1, 0.46, -0.5, 1.12, "poing", 1.1);
      return { left: L, right: R, render, look: { x: 0.05 * Math.sin(t * 1.1), y: -0.3 } };
    }
    case "visage": {
      // lunettes posées sur l'écran ; la main droite vient les ajuster pendant l'action
      const render = mk(0, 0.4, 1.0, { s: ap * (1 - vanish) });
      const R = hand(1, lerp(1.02, 0.34, e), lerp(-0.18, 0.4, e), lerp(0.3, 1.14, e), e > 0.1 ? "pointe" : "poing", 1.15, Math.PI / 2 + 0.5);
      return { left: restHand(-1), right: R, render, look: { x: 0, y: 0 } };
    }
    case "enroule": {
      // plaid / couverture : il s'enroule (apparition = enroulement), puis resserre le tissu
      const render = mk(0, -0.18, 0, { s: ap * (1 - vanish) });
      const L = hand(-1, -0.52 + 0.04 * e, -0.28 + 0.06 * e, 1.0, "poing", 1.15);
      const R = hand(1, 0.52 - 0.04 * e, -0.28 + 0.06 * e, 1.0, "poing", 1.15);
      return { left: L, right: R, render, squash: -0.02 * e, look: { x: 0, y: -0.15 } };
    }
  }
}

/** Positions de la main droite pendant l'armement du lancer (repère du corps). */
export const ARMEMENT = { x: 1.0, y: 0.84, z: 0.05 };
