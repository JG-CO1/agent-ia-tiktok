/**
 * Poses des récits sombres (somnambules, creusage, chute, veille, assis…). Mêmes conventions que ville/anim.ts :
 * bras x < 0 = vers l'avant, x ≈ -π = levés ; torse > 0 = penché en avant.
 */
import { HANCHE, poseAssise, poseDebout, poseMarche, type Membre, type Pose } from "../avatar";
import { mel } from "../maths";

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });

/** Somnambule qui marche : pas lents et réguliers, bras tendus devant, tête droite. */
export function poseSomnambuleMarche(phase: number): Pose {
  const p = poseMarche(phase, 0.7);
  p.brasG = mb(-1.5, 0.05, -0.05);
  p.brasD = mb(-1.5, -0.05, -0.05);
  p.tete = [0, -0.02];
  p.torse = 0;
  return p;
}
/** Somnambule à l'arrêt : raide, bras tendus, léger balancement. */
export function poseSomnambule(T: number, g = 0): Pose {
  const r = Math.sin(T * 0.9 + g) * 0.03;
  return { y: 0, torse: 0, tete: [0, -0.02], jambeG: mb(0), jambeD: mb(0), brasG: mb(-1.5 + r, 0.05, -0.05), brasD: mb(-1.5 - r, -0.05, -0.05) };
}
/** Creuse à la pioche (cycle 1,3 Hz) : bras levés puis abattus, torse qui suit. */
export function poseCreuse(T: number, g = 0): Pose {
  const k = (Math.sin(T * 8.2 + g) + 1) / 2; // 0 = en bas, 1 = en haut
  const x = mel(-0.55, -2.55, k);
  return {
    y: -0.12,
    torse: mel(0.5, -0.05, k),
    tete: [0, 0.15],
    jambeG: mb(-0.35, 0.12, 0.45),
    jambeD: mb(-0.1, 0.12, 0.2),
    brasG: mb(x, 0.1, mel(-0.5, -0.1, k)),
    brasD: mb(x, -0.1, mel(-0.5, -0.1, k)),
  };
}
/** Chute en arrière (les pieds restent au sol, le corps bascule avec `rx`) : bras en l'air. */
export function poseTombe(): Pose {
  return { y: 0, torse: 0, tete: [0, -0.2], jambeG: mb(0.2, 0.1, 0.2), jambeD: mb(-0.2, 0.1, 0.2), brasG: mb(-2.4, 0.7, -0.2), brasD: mb(-2.2, -0.7, -0.2) };
}
/** Accroupi, caché derrière un rocher, qui épie. */
export function poseCache(T: number, g = 0): Pose {
  return { y: -0.5, torse: 0.55, tete: [Math.sin(T * 0.5 + g) * 0.15, -0.2], jambeG: mb(-1.8, 0, 2.3), jambeD: mb(-1.8, 0, 2.3), brasG: mb(-0.9, 0.1, -0.5), brasD: mb(-0.9, -0.1, -0.5) };
}
/** Debout, une lanterne tenue au bout du bras droit : veille, tête qui balaye lentement. */
export function poseLanterne(T: number, g = 0): Pose {
  return { y: 0, torse: 0, tete: [Math.sin(T * 0.6 + g) * 0.55, 0], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(-0.1, 0.06, -0.05), brasD: mb(-0.5, -0.15, -0.85) };
}
/** Pousse : bras tendus devant, torse penché. */
export function posePousse(): Pose {
  return { y: -0.05, torse: 0.4, tete: [0, 0.1], jambeG: mb(-0.5, 0, 0.3), jambeD: mb(0.5, 0, 0.1), brasG: mb(-1.5, 0.1, -0.1), brasD: mb(-1.5, -0.1, -0.1) };
}
/** Assis sur une chaise (assise à `h`), mains posées. */
export function poseAssis(T: number, h = 1.3, g = 0): Pose {
  const p = poseAssise(T, h);
  p.tete = [Math.sin(T * 0.4 + g) * 0.1, 0.04];
  return p;
}
/** Allongé sur le dos, endormi, ou qui fait semblant (à poser avec `rx = -π/2` sur un lit). */
export function poseAllonge(): Pose {
  return { y: 0, torse: 0, tete: [0, 0], jambeG: mb(0), jambeD: mb(0), brasG: mb(0.05, 0.1), brasD: mb(0.05, -0.1) };
}
/** Halète : épaules qui montent et descendent, tête relevée, mains près de la gorge. */
export function poseHalete(T: number): Pose {
  const r = Math.sin(T * 9);
  return { y: r * 0.03, torse: 0.18 + r * 0.06, tete: [0, 0.1], jambeG: mb(-0.1, 0.07), jambeD: mb(0.1, 0.07), brasG: mb(-1.2, 0.2, -1.5), brasD: mb(-1.0, -0.2, -1.5) };
}
/** Retient quelqu'un : une main devant le visage (au niveau de la bouche d'un enfant), l'autre à l'épaule. */
export function poseRetient(): Pose {
  return { y: -0.05, torse: 0.25, tete: [0, 0.1], jambeG: mb(-0.3, 0.05, 0.2), jambeD: mb(0.1, 0.05), brasG: mb(-1.45, 0.1, -0.2), brasD: mb(-0.8, -0.3, -0.9) };
}
/** Regarde fixement (adulte qui surveille) : immobile, tête droite. */
export function poseVeille(T: number, g = 0): Pose {
  return { ...poseDebout(T, g), tete: [Math.sin(T * 0.35 + g) * 0.3, 0] };
}
/** Lève une main (salue, montre). */
export function poseMontre(T: number): Pose {
  return { y: 0, torse: 0, tete: [0, 0], jambeG: mb(-0.05, 0.07), jambeD: mb(0.05, 0.07), brasG: mb(-0.05, 0.06), brasD: mb(-1.7 + Math.sin(T * 2) * 0.05, -0.25, -0.2) };
}
/** Prend dans ses bras / serre : bras refermés devant. */
export function poseSerre(): Pose {
  return { y: -0.02, torse: 0.08, tete: [0, 0.06], jambeG: mb(-0.05), jambeD: mb(0.05), brasG: mb(-1.05, -0.35, -1.25), brasD: mb(-1.05, 0.35, -1.25) };
}
export const HAUTEUR_BASSIN = HANCHE;
