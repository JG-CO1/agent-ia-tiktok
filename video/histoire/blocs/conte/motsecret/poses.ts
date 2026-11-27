/**
 * Poses propres à « Le mot secret » : le moteur ne connaît qu'un jeu de poses fixe, on retouche ici (sans toucher au
 * code partagé) la pose calculée pour un habitant à un instant donné : oreille collée à la porte, main sur la clé,
 * main de maman sur le bras de papa, tête du narrateur qui va de l'un à l'autre, papa penché sous le lit…
 * Tout est une fonction du temps (déterministe).
 */
import type { Membre, Pose } from "../../avatar";
import type { Acteur } from "../../ville/foule";
import { lisse, mel, entre } from "../../maths";

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });
const melM = (a: Membre, b: Membre, k: number): Membre => ({ x: mel(a.x, b.x, k), z: mel(a.z ?? 0, b.z ?? 0, k), pli: mel(a.pli ?? 0, b.pli ?? 0, k) });

/** Valeur interpolée (en douceur sur 0,25 s) d'une suite de paliers [instant, valeur]. */
function paliers(T: number, v: Array<[number, number]>, base = 0, lisseur = 0.25): number {
  let cur = base;
  for (const [t, x] of v) {
    if (T < t) break;
    const k = lisse(entre(T, t, t + lisseur));
    cur = mel(cur, x, k);
  }
  return cur;
}

export function ajuster(id: string, T: number, a: Acteur, ev: Record<string, number>): Pose {
  const p: Pose = { ...a.pose, tete: a.pose.tete ? [a.pose.tete[0], a.pose.tete[1]] : [0, 0] };
  if (id === "papa") {
    // oreille tendue vers la porte pendant « Le mot ? » et la réponse
    const ecoute = lisse(entre(T, ev.ecoute0, ev.ecoute0 + 0.5)) * (1 - lisse(entre(T, ev.ecoute1 - 0.3, ev.ecoute1 + 0.2)));
    p.torse = (p.torse ?? 0) + 0.16 * ecoute;
    p.tete = [0.28 * ecoute, 0.05 * ecoute];
    // la main droite sur la clé, puis maman l'arrête
    const cle = lisse(entre(T, ev.cle - 0.5, ev.cle)) * (1 - lisse(entre(T, ev.relache, ev.relache + 0.9)));
    if (cle > 0) {
      p.brasD = melM(p.brasD, mb(-1.5, -0.1, -0.1), cle);
      p.torse = (p.torse ?? 0) + 0.1 * cle;
    }
    // il tourne la tête vers maman, puis vers la porte
    const vers = lisse(entre(T, ev.saisit, ev.saisit + 0.3)) * (1 - lisse(entre(T, ev.regardeM + 0.8, ev.regardeM + 1.2)));
    p.tete = [(p.tete?.[0] ?? 0) + 0.65 * vers, (p.tete?.[1] ?? 0) + 0.05 * vers];
    // dans la chambre : penché pour soulever le rabat, puis il regarde sous le lit
    const pen = lisse(entre(T, ev.souleve - 0.5, ev.souleve + 0.4));
    if (pen > 0) {
      p.y = (p.y ?? 0) - 0.25 * pen;
      p.torse = 0.5 * pen;
      p.jambeG = melM(p.jambeG, mb(-0.7, 0.05, 0.9), pen);
      p.jambeD = melM(p.jambeD, mb(-0.35, 0.05, 0.5), pen);
      p.brasD = melM(p.brasD, mb(-1.35, 0, -0.5), pen);
      p.brasG = melM(p.brasG, mb(-0.55, 0.15, -0.3), pen);
      p.tete = [0, 0.15 * pen];
    }
  } else if (id === "maman") {
    const g = lisse(entre(T, ev.saisit - 0.4, ev.saisit)) * (1 - lisse(entre(T, ev.cut - 4, ev.cut - 3)));
    if (g > 0) {
      p.brasD = melM(p.brasD, mb(-1.45, 0.0, -0.15), g);
      p.torse = (p.torse ?? 0) + 0.12 * g;
      p.tete = [0.5 * g, 0.05 * g];
    }
  } else if (id === "narr") {
    // la tête va de papa (à sa droite) à maman (à sa gauche)
    const yaw = paliers(T, [[ev.ecoute0, -0.45], [ev.ecoute1, 0], [ev.cle, -0.45], [ev.saisit - 0.3, 0.45], [ev.regardeP, -0.5], [ev.regardeM, 0.5], [ev.regardeM + 1.2, 0]]);
    p.tete = [yaw, 0.04];
  } else if (id === "tom") {
    // accroupi, le regard vers le dessous du lit ; il se tourne vers le couloir sur « comme tu voulais », puis vers papa
    const yaw = paliers(T, [[ev.tomVers, 1.5], [ev.tomVers + 1.3, 0.1], [ev.tomPapa, 0.7]]);
    p.tete = [yaw, 0.38];
  } else if (id === "papaS" || id === "narrS" || id === "maman2") {
    const bas = lisse(entre(T, ev.cut, ev.cut + 0.3));
    p.tete = [0, 0.55 * bas];
    if (id === "narrS") p.brasD = melM(p.brasD, mb(-1.9, -0.1, -2.2), lisse(entre(T, ev.trappe, ev.trappe + 0.5)));
  } else if (id === "tomS") {
    const bas = lisse(entre(T, ev.cut, ev.cut + 0.3));
    const haut = lisse(entre(T, ev.regard - 1.8, ev.regard - 1.2));
    p.tete = [0, mel(0.55, -0.05, haut) * bas];
  }
  if (id === "maman" && T >= ev.cut) {
    const bas = lisse(entre(T, ev.cut, ev.cut + 0.3));
    p.tete = [0, 0.55 * bas];
    p.brasD = melM(p.brasD, mb(-2.0, -0.1, -2.2), lisse(entre(T, ev.trappe - 0.2, ev.trappe + 0.5)));
  }
  return p;
}
