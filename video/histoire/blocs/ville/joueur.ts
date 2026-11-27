/**
 * Le personnage principal à l'instant T : dribble, prise de balle, tir, joie, attente du ballon, dribble.
 * Une seule fonction du temps (partagée par tous les plans) : le joueur et le ballon sont donc identiques
 * d'un plan à l'autre, quelle que soit la caméra.
 */
import type { V3 } from "../geo";
import { melPose, poseDebout, type Pose } from "../avatar";
import type { Emotion } from "../textures";
import { borne, entre, lisse, mel } from "./../maths";
import { cycleDribble, poseDribble, poseJoie, poseTir, uDribble, Y_HAUT } from "./anim";
import { balleMain, type DonneesVille } from "./donnees";
import { DEPART, R_BALLE, RY_VERS_A } from "./lieux";

export type EtatJoueur = { p: V3; ry: number; pose: Pose; emotion: Emotion; balle: V3; mode: "dribble" | "prise" | "tir" | "vol" | "joie" | "attente" };

const local = (p: V3, ry: number, l: V3): V3 => [p[0] + l[0] * Math.cos(ry) + l[2] * Math.sin(ry), p[1] + l[1], p[2] - l[0] * Math.sin(ry) + l[2] * Math.cos(ry)];

/** Fenêtres pendant lesquelles il regarde la fête, droit devant lui (tête relevée), au lieu du ballon. */
function regardeFete(T: number, d: DonneesVille): number {
  const f = (a: number, b: number) => lisse(entre(T, a, a + 0.35)) * (1 - lisse(entre(T, b - 0.35, b)));
  return Math.max(0, ...d.ep.regards.fete.map(([a, b]) => f(d.mot(a[0], a[1]), d.mot(b[0], b[1]))));
}
/** Tête tournée vers la rue (le voisin qui l'appelle). */
function regardeRue(T: number, d: DonneesVille): number {
  const [ra, rb] = d.ep.regards.rue;
  const a = d.mot(ra[0], ra[1]);
  const b = d.mot(rb[0], rb[1]) + 0.3;
  return lisse(entre(T, a, a + 0.5)) * (1 - lisse(entre(T, b - 0.4, b)));
}

export function joueurA(T: number, d: DonneesVille): EtatJoueur {
  const tir = d.tir;
  const ry = RY_VERS_A;
  const glisse = Math.sin(T * 0.7) * 0.22;
  const base: V3 = [DEPART[0] + glisse, 0, DEPART[2] + Math.sin(T * 0.5 + 1) * 0.12];
  const fete = regardeFete(T, d);
  const rue = regardeRue(T, d);
  const regard = (pose: Pose): Pose => {
    const t0 = pose.tete ?? [0, 0];
    return { ...pose, tete: [mel(t0[0], -1.05, rue), mel(t0[1], 0.0, Math.max(fete, rue * 0.8))] };
  };

  // --- dribble avant le tir / après le retour du ballon
  const liste = T < tir.prise ? d.impacts.avant : T >= tir.retour ? d.impacts.apres : null;
  if (liste) {
    const u = uDribble(liste, T);
    const uu = u ? u.u : T < tir.prise ? 0.5 : 0.5;
    const { pose, yBalle } = poseDribble(T, uu, 1);
    const attaque = T >= tir.retour ? lisse(entre(T, tir.retour, tir.retour + 0.3)) : 1;
    const p = regard(pose);
    return { p: base, ry, pose: attaque < 1 ? melPose(poseDebout(T, 1), p, attaque) : p, emotion: rue > 0.5 ? "curieux" : "resolu", balle: balleMain(base, ry, yBalle), mode: "dribble" };
  }

  // --- prise de balle : le ballon remonte à la main, puis contre la poitrine
  if (T < tir.debut) {
    const dt = tir.dernierImpact + 0.52 - tir.dernierImpact;
    const u = borne((T - tir.dernierImpact) / dt, 0, 0.5);
    const { pose, yBalle } = poseDribble(T, u, 1);
    const k = lisse(entre(T, tir.dernierImpact + 0.22, tir.debut));
    const respire = Math.sin(T * 5) * 0.03;
    const tirPose = poseTir(0).pose;
    const mixte = melPose(pose, { ...tirPose, torse: (tirPose.torse ?? 0) + respire }, k);
    const mainP = balleMain(base, ry, yBalle);
    const poitrine = local(base, ry, [0, 1.35, 0.62]);
    return { p: base, ry, pose: regard(mixte), emotion: "resolu", balle: [mel(mainP[0], poitrine[0], k), mel(mainP[1], poitrine[1], k), mel(mainP[2], poitrine[2], k)], mode: "prise" };
  }

  // --- le tir
  const kTir = (T - tir.debut) / tir.duree;
  if (T < tir.panier + 0.001 || kTir < 1) {
    const k = Math.min(1, kTir);
    const { pose, saut, balle } = poseTir(k);
    const p: V3 = [base[0], saut, base[2]];
    let b: V3;
    if (T < tir.lache && balle) b = local(p, ry, balle);
    else b = tir.trajet.position(T - tir.lache);
    return { p, ry, pose, emotion: "resolu", balle: b, mode: T < tir.lache ? "tir" : "vol" };
  }

  // --- joie, puis attente du ballon qui revient
  const b = tir.trajet.position(Math.min(T - tir.lache, tir.trajet.tFin));
  const joie = poseJoie(T - tir.panier, 1 - lisse(entre(T, tir.panier + 1.2, tir.panier + 1.8)));
  const pret = melPose(poseDebout(T, 1), poseDribble(T, 0.6, 1).pose, 0.7);
  const k = lisse(entre(T, tir.panier + 1.2, tir.panier + 1.9));
  const mode = T < tir.panier + 1.5 ? "joie" : "attente";
  return { p: base, ry, pose: melPose(joie, pret, k), emotion: "sourire", balle: b, mode };
}

/** Hauteur du ballon minimale visible (le ballon ne traverse jamais le sol). */
export const sousLeSol = (b: V3) => b[1] < R_BALLE - 0.01;
void Y_HAUT;
void cycleDribble;
