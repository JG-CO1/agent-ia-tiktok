/** Petites fonctions de calcul pour les caméras et les animations (aucune dépendance). */
import type { V3 } from "./geo";

export type Cam = { pos: V3; look: V3; fov: number };

export const borne = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mel = (a: number, b: number, k: number) => a + (b - a) * k;
export const mel3 = (a: V3, b: V3, k: number): V3 => [mel(a[0], b[0], k), mel(a[1], b[1], k), mel(a[2], b[2], k)];
export const plus = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** Progression 0 → 1 entre deux instants (bornée). */
export const entre = (t: number, a: number, b: number) => borne((t - a) / (b - a));

/** Démarrage vif puis freinage : mouvement de souris d'un joueur. */
export const freine = (k: number) => 1 - Math.pow(1 - borne(k), 3);
export const freineDoux = (k: number) => 1 - Math.pow(1 - borne(k), 2);
/** Départ et arrivée en douceur. */
export const lisse = (k: number) => {
  const x = borne(k);
  return x * x * (3 - 2 * x);
};
/** Petit rebond à l'arrivée (aiguille d'horloge, interrupteur). */
export const rebond = (k: number) => {
  const x = borne(k);
  return 1 + Math.pow(2, -9 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) * (x < 1 ? 1 : 0);
};

/**
 * Oriente la caméra placée en `pos` pour que `sujet` apparaisse à la position d'écran (sx, sy)
 * (0,0 = coin haut-gauche ; 0.5,0.5 = centre). Format vertical 9:16.
 */
export function viser(pos: V3, sujet: V3, fov: number, sx = 0.5, sy = 0.42): Cam {
  const dx = sujet[0] - pos[0];
  const dy = sujet[1] - pos[1];
  const dz = sujet[2] - pos[2];
  const dh = Math.hypot(dx, dz);
  const lacet0 = Math.atan2(dx, -dz);
  const tang0 = Math.atan2(dy, dh);
  const tf = Math.tan((fov * Math.PI) / 360);
  const ny = 1 - 2 * sy;
  const nx = 2 * sx - 1;
  const tang = tang0 - Math.atan(ny * tf);
  const lacet = lacet0 - Math.atan((nx * tf * 9) / 16 / Math.max(0.2, Math.cos(tang)));
  const d = Math.max(1, Math.hypot(dh, dy));
  return { pos, look: [pos[0] + Math.sin(lacet) * Math.cos(tang) * d, pos[1] + Math.sin(tang) * d, pos[2] - Math.cos(lacet) * Math.cos(tang) * d], fov };
}

/** Caméra entre deux cadrages (positions et points visés interpolés). */
export function melCam(a: Cam, b: Cam, k: number): Cam {
  return { pos: mel3(a.pos, b.pos, k), look: mel3(a.look, b.look, k), fov: mel(a.fov, b.fov, k) };
}

/** Point sur un cercle horizontal autour de `centre` : angle 0 = côté +z, sens trigonométrique vu de dessus. */
export function orbite(centre: V3, rayon: number, angle: number, hauteur: number): V3 {
  return [centre[0] + Math.sin(angle) * rayon, hauteur, centre[2] + Math.cos(angle) * rayon];
}

/** Nombre pseudo-aléatoire stable. */
export const alea = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
