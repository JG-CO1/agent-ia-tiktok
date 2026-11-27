/** Cinématique directe d'un avatar (mêmes transformations que Avatar) : bout des mains, repère de la tête. */
import * as THREE from "three";
import type { V3 } from "../../geo";
import { HANCHE, type Pose } from "../../avatar";
import type { Acteur } from "../../ville/foule";

type A = Pick<Acteur, "p" | "ry" | "rx" | "echelle" | "pose">;
const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const RX = (a: number) => new THREE.Matrix4().makeRotationX(a);

function base(a: A): THREE.Matrix4 {
  return new THREE.Matrix4().compose(new THREE.Vector3(...a.p), new THREE.Quaternion().setFromEuler(new THREE.Euler(a.rx, a.ry, 0, "YXZ")), new THREE.Vector3(a.echelle, a.echelle, a.echelle));
}
function torse(a: A): THREE.Matrix4 {
  return base(a).multiply(T(0, HANCHE + (a.pose.y ?? 0), 0)).multiply(RX(a.pose.torse ?? 0));
}
const out = (m: THREE.Matrix4, v: V3 = [0, 0, 0]): V3 => {
  const p = new THREE.Vector3(...v).applyMatrix4(m);
  return [p.x, p.y, p.z];
};

/** Matrice du bout du bras : `cote` 1 = bras gauche, −1 = bras droit ; `long` sous le coude (0,5 = bout de la main). */
export function matMain(a: A, cote: 1 | -1, long = 0.5): THREE.Matrix4 {
  const m = cote === 1 ? a.pose.brasG : a.pose.brasD;
  return torse(a)
    .multiply(T(cote * 0.68, 0.9, 0))
    .multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(m.x, 0, cote * (m.z ?? 0))))
    .multiply(T(0, -0.4, 0))
    .multiply(RX(m.pli ?? 0))
    .multiply(T(0, -long, 0));
}
export function boutMain(a: A, cote: 1 | -1, long = 0.5, decal: V3 = [0, 0, 0]): V3 {
  return out(matMain(a, cote, long), decal);
}
/** Repère de la tête : origine = base du crâne, y vers le haut, +z devant le visage. */
export function matTete(a: A): THREE.Matrix4 {
  const [lacet, tangage] = a.pose.tete ?? [0, 0];
  return torse(a).multiply(T(0, 1.0, 0)).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(tangage, lacet, 0, "YXZ")));
}
export const pointTete = (a: A, v: V3): V3 => out(matTete(a), v);
export const yeux = (a: A): V3 => pointTete(a, [0, 0.45, 0.42]);
export const pointTorse = (a: A, v: V3): V3 => out(torse(a), v);
export function transformer(m: THREE.Matrix4): { position: V3; quaternion: [number, number, number, number]; scale: V3 } {
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  m.decompose(p, q, s);
  return { position: [p.x, p.y, p.z], quaternion: [q.x, q.y, q.z, q.w], scale: [s.x, s.y, s.z] };
}
