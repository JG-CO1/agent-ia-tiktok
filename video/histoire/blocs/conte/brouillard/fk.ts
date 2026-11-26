/** Cinématique directe d'un avatar (mêmes transformations que Avatar) : bout de la main, bouche, points du torse. */
import * as THREE from "three";
import type { V3 } from "../../geo";
import { HANCHE, type Pose } from "../../avatar";
import type { Acteur } from "../../ville/foule";

const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const RX = (a: number) => new THREE.Matrix4().makeRotationX(a);

function base(a: Pick<Acteur, "p" | "ry" | "rx" | "echelle">): THREE.Matrix4 {
  return new THREE.Matrix4().compose(new THREE.Vector3(...a.p), new THREE.Quaternion().setFromEuler(new THREE.Euler(a.rx, a.ry, 0, "YXZ")), new THREE.Vector3(a.echelle, a.echelle, a.echelle));
}
function torse(a: Pick<Acteur, "p" | "ry" | "rx" | "echelle" | "pose">): THREE.Matrix4 {
  return base(a).multiply(T(0, HANCHE + (a.pose.y ?? 0), 0)).multiply(RX(a.pose.torse ?? 0));
}
const out = (m: THREE.Matrix4, v: V3 = [0, 0, 0]): V3 => {
  const p = new THREE.Vector3(...v).applyMatrix4(m);
  return [p.x, p.y, p.z];
};

/** Bout de la main (`cote` 1 = bras gauche, −1 = bras droit), `long` sous le coude (0,5 = bout de la main). */
export function boutMain(a: Pick<Acteur, "p" | "ry" | "rx" | "echelle" | "pose">, cote: 1 | -1, long = 0.5, decal: V3 = [0, 0, 0]): V3 {
  const m = cote === 1 ? a.pose.brasG : a.pose.brasD;
  const M = torse(a)
    .multiply(T(cote * 0.68, 0.9, 0))
    .multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(m.x, 0, cote * (m.z ?? 0))))
    .multiply(T(0, -0.4, 0))
    .multiply(RX(m.pli ?? 0))
    .multiply(T(0, -long, 0));
  return out(M, decal);
}
/** Point de la tête (repère de la tête : origine = base du crâne, y vers le haut, +z devant). Bouche ≈ [0, 0.2, 0.42]. */
export function pointTete(a: Pick<Acteur, "p" | "ry" | "rx" | "echelle" | "pose">, v: V3): V3 {
  const [lacet, tangage] = a.pose.tete ?? [0, 0];
  const M = torse(a).multiply(T(0, 1.0, 0)).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(tangage, lacet, 0, "YXZ")));
  return out(M, v);
}
export const bouche = (a: Pick<Acteur, "p" | "ry" | "rx" | "echelle" | "pose">): V3 => pointTete(a, [0, 0.2, 0.42]);
export const yeux = (a: Pick<Acteur, "p" | "ry" | "rx" | "echelle" | "pose">): V3 => pointTete(a, [0, 0.45, 0.42]);
/** Point du torse (repère du torse : origine = bassin, y vers le haut). */
export const pointTorse = (a: Pick<Acteur, "p" | "ry" | "rx" | "echelle" | "pose">, v: V3): V3 => out(torse(a), v);
