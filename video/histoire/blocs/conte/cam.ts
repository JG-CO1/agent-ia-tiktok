/**
 * Aides de caméra et constructeur de plans des récits sombres. Un plan = une caméra qui démarre sur un mot
 * `[scène, mot]` ; chaque fonction de caméra reçoit le contexte du plan (progression, temps, données du récit).
 */
import type { V3 } from "../geo";
import { type Cam, entre, freine, freineDoux, lisse, mel, mel3, melCam, orbite, viser } from "../maths";
import type { CtxGen, PlanGen } from "../types";
import type { DonneesConte, EtatConte, FxConte } from "./lib";

export { entre, freine, freineDoux, lisse, mel, mel3, melCam, orbite, viser };
export const PI = Math.PI;
export type { Cam, V3 };
export const D = (c: CtxGen) => c.data as DonneesConte;

/** Position d'un personnage (repli : l'origine). */
export function pos(c: CtxGen, id: string): V3 {
  const a = D(c).acteur(id, c.T);
  return a ? a.p : [0, 0, 0];
}
/** Point dans le repère d'un personnage (pieds + lacet) : +z devant lui, -x sa droite. */
export function rel(c: CtxGen, id: string, v: V3): V3 {
  const a = D(c).acteur(id, c.T);
  if (!a) return v;
  const e = a.echelle;
  return [a.p[0] + (v[0] * Math.cos(a.ry) + v[2] * Math.sin(a.ry)) * e, a.p[1] + v[1] * e, a.p[2] + (-v[0] * Math.sin(a.ry) + v[2] * Math.cos(a.ry)) * e];
}
/** Tête d'un personnage (monde). */
export const tete = (c: CtxGen, id: string): V3 => rel(c, id, [0, 2.4, 0]);
/** Travelling entre deux positions de caméra, en visant un sujet qui peut lui aussi se déplacer. */
export function trav(c: CtxGen, de: V3, vers: V3, cibleDe: V3, cibleVers: V3 = cibleDe, fov: [number, number] = [55, 55], k = lisse(c.p), sy = 0.42): Cam {
  return viser(mel3(de, vers, k), mel3(cibleDe, cibleVers, k), mel(fov[0], fov[1], k), 0.5, sy);
}
/** Face d'un personnage (à `dist` devant lui), visage visé à 34 % de la hauteur. */
export function faceA(c: CtxGen, id: string, dist: [number, number], haut = 2.6, cote = 0, fov = 38, cible = 2.4, sy = 0.36): Cam {
  const k = lisse(c.p);
  return viser(rel(c, id, [cote, haut, mel(dist[0], dist[1], k)]), rel(c, id, [0, cible, 0]), fov, 0.5, sy);
}
/** Orbite autour d'un point. */
export function orb(centre: V3, rayon: [number, number], angle: [number, number], haut: [number, number], k: number, fov = 52, sy = 0.42): Cam {
  return viser(orbite(centre, mel(rayon[0], rayon[1], k), mel(angle[0], angle[1], k), mel(haut[0], haut[1], k)), centre, fov, 0.5, sy);
}
/** Tremblement de caméra (secousse sismique, peur) : déplacement pseudo-aléatoire de la position. */
export function secousse(T: number, amp: number): V3 {
  return [Math.sin(T * 61.3) * amp, Math.sin(T * 47.7 + 1) * amp, Math.sin(T * 53.1 + 2) * amp];
}
export const plus = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Constructeur de plan : `f` renvoie l'état (caméra + brouillard + ciel + effets). */
export function P(id: string, titre: string, scene: number, mot: number, f: (c: CtxGen) => EtatConte | Cam, opts: { continu?: boolean } = {}): PlanGen {
  return {
    id,
    titre,
    scene,
    mot,
    continu: opts.continu,
    etat: (c) => {
      const r = f(c);
      return "pos" in r ? { cam: r as Cam } : (r as EtatConte);
    },
  };
}
/** Raccourci pour les effets. */
export const fx = (o: FxConte): FxConte => o;
