/**
 * « Chaque jeudi, quelque chose vient nous chercher… » — mise en scène plan par plan (récit : histoires/recits/brouillard.json).
 * Chaque plan démarre sur un mot [scène, mot] (scène 1 = indice 0). Caméra dynamique : survol, travellings, plongées et
 * contre-plongées, gros plans de visages, de main (alliance), de clé ; tremblement calé sur les pas de la créature.
 * Trois lieux : la ville (x ≈ 0), la chambre (x ≈ −400), le perron (x ≈ +400).
 */
import type { CtxGen, PlanGen } from "../../types";
import { D, P, entre, lisse, mel, mel3, plus, secousse, viser, type Cam, type V3 } from "../cam";
import type { EtatConte } from "../lib";
import { boutMain, pointTete } from "./fk";
import { BX, creatureEtat, tremblement } from "./histoire";
import { CHAMBRE, PORTE, VITRE_Z } from "./monde";

const [XC] = CHAMBRE;
const [PX] = PORTE;
const FOG = {
  aerien: ["#5A6888", 40, 235] as [string, number, number],
  villeLoin: ["#566485", 10, 108] as [string, number, number],
  ville: ["#566485", 6, 84] as [string, number, number],
  chambre: ["#5E6E94", 10, 52] as [string, number, number],
  souvenir: ["#444F6E", 3, 30] as [string, number, number],
  porte: ["#46516F", 3, 42] as [string, number, number],
};
const S = (cam: Cam, brouillard: [string, number, number], vignette = 0.5, extra: Partial<EtatConte> = {}): EtatConte => ({ cam, brouillard, fx: { vignette }, ...extra });
const ev = (c: CtxGen) => D(c).ev;
const act = (c: CtxGen, id: string) => D(c).acteur(id, c.T);
/** Point du repère de la tête d'un personnage (origine = base du crâne, +z devant lui). */
const ptTete = (c: CtxGen, id: string, v: V3 = [0, 0.4, 0.2]): V3 => {
  const a = act(c, id);
  return a ? pointTete(a, v) : [0, 0, 0];
};
/** Bout de la main (monde). */
const main = (c: CtxGen, id: string, cote: 1 | -1): V3 => {
  const a = act(c, id);
  return a ? boutMain(a, cote, 0.5) : [0, 0, 0];
};
const sh = (c: CtxGen, amp: number): V3 => (amp > 0.0005 ? secousse(c.T, amp) : [0, 0, 0]);
const FOND = 0.37;
/** Face d'un personnage : visage visé à ~37 % de la hauteur, caméra devant lui (suit sa tête, même assis, accroupi ou penché). */
function faceCam(c: CtxGen, id: string, dist: [number, number], o: { up?: number; side?: number; fov?: [number, number]; sy?: number; tremble?: number; dy?: number } = {}): Cam {
  const a = act(c, id);
  if (!a) return viser([0, 3, 10], [0, 2, 0], 40);
  const t0 = pointTete(a, [0, 0.4 - (o.dy ?? 0), 0.4]);
  const t1 = pointTete(a, [0, 0.4 - (o.dy ?? 0), 1.4]);
  let nx = t1[0] - t0[0];
  let nz = t1[2] - t0[2];
  const L = Math.hypot(nx, nz) || 1;
  nx /= L;
  nz /= L;
  const k = lisse(c.p);
  const d = mel(dist[0], dist[1], k);
  const s = o.side ?? 0;
  const fov = o.fov ?? [34, 34];
  const pos: V3 = [t0[0] + nx * d - nz * s, t0[1] + (o.up ?? 0.12), t0[2] + nz * d + nx * s];
  return viser(plus(pos, sh(c, o.tremble ?? 0)), t0, mel(fov[0], fov[1], k), 0.5, o.sy ?? FOND);
}
const cv = (c: CtxGen) => creatureEtat("ville", c.T, ev(c)) ?? { x: 0, z: -10, ry: 0 };
const FIN_TOT = (c: CtxGen) => D(c).fin;
/** Mélange de deux couleurs hexadécimales. */
function melCoul(a: string, b: string, k: number): string {
  const n = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}

export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « Dans ma ville, chaque jeudi soir, une créature traverse le brouillard… »
  P("br01p1", "Vue aérienne de la ville cubique noyée de brouillard : descente vers l'avenue, une silhouette gigantesque au loin", 0, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([7, 58, 78], [3, 36, 46], k), mel3([0, 5, -50], [-1, 6, -47], k), 62), FOG.aerien, 0.5);
  }),
  P("br01p2", "Au ras de l'avenue, la silhouette de la créature traverse le brouillard entre les maisons (travelling)", 0, 6, (c) => {
    const k = lisse(c.p);
    const cr = cv(c);
    return S(viser([mel(-1.8, -0.4, k), mel(1.5, 1.9, k), mel(14, 7, k)], [cr.x, 8, cr.z], 44), FOG.villeLoin, 0.55);
  }),
  P("br01p3", "Gros plan sur la tête lisse et sans visage, qui se penche : elle est aveugle mais elle écoute (travelling arrière en contre-plongée)", 0, 11, (c) => {
    const k = lisse(c.p);
    const cr = cv(c);
    return S(viser(plus([cr.x + mel(-6, 5.5, k), mel(8.0, 10.2, k), cr.z + 15.5], sh(c, 0.03 * tremblement(c.T, ev(c), "ville"))), [cr.x, 12.4, cr.z - 0.2], 40, 0.5, 0.44), FOG.villeLoin, 0.6);
  }),
  P("br01p4", "GROS PLAN sur la fenêtre éclairée du narrateur : la vitre tremble à chaque pas", 0, 20, (c) => {
    const k = lisse(c.p);
    const a = tremblement(c.T, ev(c), "ville");
    return S(viser(plus(mel3([-3.6, 7.6, -8.4], [-5.2, 7.45, -9.3], k), sh(c, 0.06 * a)), [-10.4, 7.3, -10.4], mel(40, 33, k), 0.5, 0.45), FOG.ville, 0.6);
  }),
  P("br01p5", "Contre-plongée : la créature arrive droit sur nous, ses jambes immenses dans le brouillard", 0, 25, (c) => {
    const k = lisse(c.p);
    const cr = cv(c);
    return S(viser(plus([3.0, mel(1.3, 1.7, k), -1.0], sh(c, 0.05 * tremblement(c.T, ev(c), "ville"))), [cr.x, mel(5.5, 8, k), cr.z], 64, 0.5, 0.45), FOG.ville, 0.6);
  }),

  // ======================= SCÈNE 2 — « Tout le monde connaît la règle… »
  P("br02p1", "Toute la rue éclairée dans la brume, puis les lumières s'éteignent une à une ; la créature est plantée devant la maison", 1, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([2, 3.2, 40], [6.5, 7.5, 25], k), mel3([-1.5, 4.5, -24], [-4, 5.5, -16], k), mel(60, 56, k)), FOG.villeLoin, 0.5);
  }),
  P("br02p2", "Le narrateur ferme le rideau (vu de dos) : le voilage se tire devant la fenêtre", 1, 10, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([XC - 1.5, 2.0, -0.3], [XC - 1.2, 2.05, -1.0], k), [XC + 0.5, 2.2, -3.4], 52), FOG.chambre, 0.6);
  }),
  P("br02p3", "Caché derrière le rideau, accroupi, les mains sur la bouche : il retient son souffle (vu à travers le voilage)", 1, 14, (c) => {
    const k = lisse(c.p);
    const t = ptTete(c, "nar", [0, 0.4, 0.2]);
    return S(viser(mel3([XC + 0.5, 1.55, -0.5], [XC + 0.8, 1.5, -1.4], k), t, mel(42, 38, k), 0.5, 0.4), FOG.chambre, 0.65);
  }),
  P("br02p4", "GROS PLAN sur son visage : il manque d'air, les yeux écarquillés (« Je souffre d'asthme »)", 1, 17, (c) => S(faceCam(c, "nar", [2.8, 2.65], { fov: [34, 30], tremble: 0.012 }), FOG.chambre, 0.7)),
  P("br02p5", "GROS PLAN sur l'inhalateur bleu qu'il porte à sa bouche, la main qui tremble", 1, 21, (c) => {
    const h = main(c, "nar", -1);
    const m = ptTete(c, "nar", [0, 0.2, 0.42]);
    const k = lisse(c.p);
    const t: V3 = [(h[0] + m[0]) / 2, (h[1] + m[1]) / 2, (h[2] + m[2]) / 2];
    return S(viser(plus([t[0] + mel(0.15, 0.0, k), t[1] + 0.1, t[2] + mel(2.1, 1.8, k)], sh(c, 0.012)), t, 34, 0.5, 0.42), FOG.chambre, 0.7);
  }),
  P("br02p6", "L'inhalateur lui échappe, rebondit sur le parquet et roule (plongée rasante)", 1, 23, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([XC + 2.7, 1.2, -0.6], [XC + 2.3, 0.9, -1.3], k), mel3([XC + 0.9, 0.8, -3.5], [XC + 1.2, 0.35, -3.3], k), mel(50, 44, k), 0.5, 0.45), FOG.chambre, 0.65);
  }),
  P("br02p7", "À travers le voilage, la silhouette gigantesque passe devant la fenêtre", 1, 27, (c) => {
    const cc = creatureEtat("chambre", c.T, ev(c));
    return S(viser([XC - 0.2, 2.0, -2.3], [cc ? cc.x : XC, 2.3, -13], 54, 0.5, 0.45), FOG.chambre, 0.65);
  }),

  // ======================= SCÈNE 3 — « Mon père avait disparu trois ans plus tôt… »
  P("br03p1", "Souvenir : sur le perron, le père s'éloigne dans le brouillard, de dos ; un mur de brume l'avale (grue qui s'élève)", 2, 0, (c) => {
    const k = lisse(c.p);
    const p = act(c, "pere");
    const cible: V3 = p ? plus(p.p, [0, 2.7, 0]) : [PX, 2.7, 6];
    return S(viser(mel3([PX - 0.3, 2.25, -0.5], [PX + 1.4, 3.6, 2.6], k), cible, mel(52, 46, k), 0.5, 0.44), FOG.souvenir, 0.6, { fx: { vignette: 0.6, teinte: ["#8FA6E8", 0.28] } });
  }),
  P("br03p2", "Chambre sombre : la belle-mère assise sur sa chaise près du lit, tournée vers la fenêtre (vue de dos, la lune sur le parquet)", 2, 13, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([XC + 1.8, 2.6, 4.2], [XC + 1.5, 2.4, 3.7], k), [XC - 1.8, 1.4, -0.8], mel(68, 62, k), 0.5, 0.42), FOG.chambre, 0.6);
  }),
  P("br03p3", "La belle-mère, de trois quarts, le regard fixé droit devant elle sur la vitre ; le lit du garçon derrière elle", 2, 17, (c) => {
    const k = lisse(c.p);
    return S(viser([XC + mel(-0.1, -0.5, k), 2.4, mel(-2.3, -1.9, k)], ptTete(c, "bm", [0, 0.4, 0.2]), mel(36, 32, k), 0.5, 0.4), FOG.chambre, 0.65);
  }),
  P("br03p4", "Le garçon, dans son lit, la fixe à la dérobée : il croit qu'elle attend que le monstre l'emporte", 2, 23, (c) => {
    const k = lisse(c.p);
    const a = act(c, "nar");
    const t = a ? pointTete(a, [0, 0.4, 0.3]) : ([BX, 1.6, 1.9] as V3);
    return S(viser([BX + mel(0.3, 0.1, k), 2.4, mel(-0.7, -0.3, k)], t, mel(36, 31, k), 0.5, 0.4), FOG.chambre, 0.65);
  }),
  P("br03p5", "Contre-plongée : la belle-mère immobile, le regard fixe, domine le lit", 2, 28, (c) => {
    const k = lisse(c.p);
    return S(viser([XC - mel(0.9, 1.1, k), mel(1.3, 1.5, k), mel(-1.4, -1.0, k)], ptTete(c, "bm", [0, 0.4, 0.1]), 50, 0.5, 0.42), FOG.chambre, 0.72);
  }),

  // ======================= SCÈNE 4 — « Un soir, trois gouttes contre la vitre m'ont réveillé… »
  P("br04p1", "Le garçon dort, le visage calme (poussée lente)", 3, 0, (c) => {
    const k = lisse(c.p);
    const a = act(c, "nar");
    const t = a ? pointTete(a, [0, 0.4, 0.3]) : ([BX, 1.6, 1.9] as V3);
    return S(viser([BX + mel(0.5, 0.35, k), mel(2.4, 2.25, k), mel(-0.9, -0.3, k)], t, 36, 0.5, 0.4), FOG.chambre, 0.65);
  }),
  P("br04p2", "Trois gouttes frappent la vitre, l'une après l'autre", 3, 3, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([XC - 0.1, 2.5, -2.0], [XC, 2.55, -2.5], k), [XC + 0.05, 2.72, VITRE_Z], 46, 0.5, 0.45), FOG.chambre, 0.6);
  }),
  P("br04p3", "Ses yeux s'ouvrent d'un coup (« réveillé »)", 3, 7, (c) => {
    const k = lisse(c.p);
    const a = act(c, "nar");
    const t = a ? pointTete(a, [0, 0.4, 0.3]) : ([BX, 1.6, 1.9] as V3);
    return S(viser([BX + 0.15, mel(2.15, 2.0, k), mel(-0.4, 0.0, k)], t, mel(32, 26, k), 0.5, 0.4), FOG.chambre, 0.65, { fx: { vignette: 0.65 } });
  }),
  P("br04p4", "Derrière le verre, une main grise gigantesque apparaît et se plaque sur la vitre (la fenêtre vibre)", 3, 9, (c) => {
    const k = lisse(c.p);
    const e = ev(c);
    const dt = c.T - e.mainColle;
    return S(viser(plus(mel3([XC + 0.5, 2.15, -0.2], [XC + 0.4, 2.25, -1.3], k), sh(c, 0.02 * tremblement(c.T, e, "chambre"))), [XC + 0.15, 2.5, -5.4], mel(60, 54, k), 0.5, 0.45), FOG.chambre, 0.6, { fx: { vignette: 0.6, flash: ["#FFFFFF", dt > 0 && dt < 0.12 ? 0.3 * (1 - dt / 0.12) : 0] } });
  }),
  P("br04p5", "Il est assis dans le lit, sa respiration devient incontrôlable (tremblement croissant)", 3, 13, (c) => S(faceCam(c, "nar", [2.75, 2.5], { fov: [34, 30], up: 0.1, tremble: 0.012 + 0.03 * c.p }), FOG.chambre, 0.7)),
  P("br04p6", "EXTRÊME GROS PLAN sur ses yeux : il n'a plus d'air", 3, 17, (c) => S(faceCam(c, "nar", [2.2, 1.95], { fov: [25, 22], sy: 0.4, tremble: 0.035 }), FOG.chambre, 0.78)),
  P("br04p7", "Derrière lui, une silhouette surgit de l'ombre : une main humaine monte vers son visage", 3, 21, (c) => S(faceCam(c, "nar", [2.9, 2.6], { fov: [40, 36], side: -0.55, up: 0.35, tremble: 0.02 }), FOG.chambre, 0.7)),
  P("br04p8", "La main se pose sur sa bouche : ses yeux écarquillés", 3, 26, (c) => S(faceCam(c, "nar", [2.2, 1.9], { fov: [32, 28], side: -0.2, up: 0.2, tremble: 0.012 }), FOG.chambre, 0.72)),

  // ======================= SCÈNE 5 — « C'était ma belle-mère… »
  P("br05p1", "C'était ma belle-mère : son visage se révèle, penché au-dessus de l'épaule du garçon", 4, 0, (c) => S(faceCam(c, "bm", [2.5, 2.1], { fov: [38, 33], side: 0.55, up: -0.1 }), FOG.chambre, 0.6)),
  P("br05p2", "GROS PLAN sur sa main et son alliance dorée, posée doucement sur la bouche de l'enfant", 4, 3, (c) => S(faceCam(c, "nar", [2.2, 1.8], { fov: [32, 26], side: -0.3, up: 0.12, dy: 0.12, sy: 0.43, tremble: 0.004 }), FOG.chambre, 0.6)),
  P("br05p3", "Tableau : l'enfant et sa belle-mère immobiles, joue contre joue, pour ne faire aucun bruit (poussée lente)", 4, 8, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([XC - 1.7, 2.55, -2.6], [XC - 1.9, 2.5, -1.7], k), [BX + 0.25, 2.0, 2.6], mel(42, 38, k), 0.5, 0.45), FOG.chambre, 0.65);
  }),
  P("br05p4", "Elle le faisait depuis trois ans : son visage, tendre et fatigué", 4, 14, (c) => S(faceCam(c, "bm", [2.3, 1.95], { fov: [34, 29], side: 0.5, up: -0.12 }), FOG.chambre, 0.62)),
  P("br05p5", "Le monstre s'en va : la main se retire de la vitre, la silhouette s'éloigne dans la rue", 4, 20, (c) => {
    const k = lisse(c.p);
    return S(viser([XC + 1.2, 2.0, -0.5], [XC + mel(0.2, 2.3, k), 2.6, -9], 54, 0.5, 0.45), FOG.chambre, 0.6);
  }),
  P("br05p6", "Le brouillard s'éloigne, la lumière revient dans la chambre : tous deux, enfin soulagés", 4, 26, (c) => {
    const k = lisse(c.p);
    const lum = lisse(entre(c.T, ev(c).lumiere, ev(c).lumiere + 2));
    return S(viser(mel3([XC - 0.9, 2.3, -2.3], [XC - 1.2, 2.25, -1.8], k), [XC - 2.1, 2.0, 1.3], 54, 0.5, 0.45), [FOG.chambre[0], FOG.chambre[1], mel(52, 120, lum)], 0.45);
  }),

  // ======================= SCÈNE 6 — « Elle m'a expliqué que la créature ne pouvait pas ouvrir une porte… »
  P("br06p1", "Elle lui explique, assise près du lit, dans la lumière revenue (trois quarts)", 5, 0, (c) => {
    const k = lisse(c.p);
    return S(viser([XC + mel(0.2, 0.0, k), 2.4, -1.75], ptTete(c, "bm", [0, 0.4, 0.2]), mel(36, 32, k), 0.5, 0.4), [FOG.chambre[0], 10, 120], 0.45);
  }),
  P("br06p2", "Sur le perron, la main géante tâtonne sur la poignée sans parvenir à la tourner : la créature ne peut pas ouvrir une porte", 5, 5, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([PX - 3.4, 2.9, 9.2], [PX - 2.4, 2.5, 6.6], k), [PX + 0.9, 2.5, 0.8], mel(46, 40, k), 0.5, 0.45), FOG.porte, 0.6);
  }),
  P("br06p3", "« Quelqu'un devait l'inviter » : la porte s'ouvre lentement sur le noir (poussée)", 5, 13, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([PX, 2.45, 7.2], [PX + 0.4, 2.2, 4.4], k), [PX, 2.0, -0.5], 52, 0.5, 0.44), FOG.porte, 0.62);
  }),
  P("br06p4", "Souvenir : la nuit où le père a disparu, la maison dans le brouillard, la porte fermée", 5, 16, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([PX + 6.5, 3.2, 12], [PX + 5.0, 3.0, 9.5], k), [PX, 3.8, 0], 55), FOG.souvenir, 0.6, { fx: { vignette: 0.6, teinte: ["#8FA6E8", 0.28] } });
  }),
  P("br06p5", "Souvenir : gros plan sur la serrure — le verrou se retire, la porte était déverrouillée", 5, 23, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([PX + 1.5, 1.85, 2.0], [PX + 1.15, 1.8, 1.5], k), [PX + 0.5, 1.65, 0.2], mel(38, 32, k), 0.5, 0.45), FOG.souvenir, 0.6, { fx: { vignette: 0.6, teinte: ["#8FA6E8", 0.28] } });
  }),
  P("br06p6", "Souvenir : sur le seuil, une silhouette en blouse blanche, de dos, tient quelque chose (travelling avant)", 5, 27, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([PX - 1.0, 2.8, 8.2], [PX - 0.4, 2.7, 6.4], k), [PX, 2.7, 2.7], 46), FOG.souvenir, 0.6, { fx: { vignette: 0.6, teinte: ["#8FA6E8", 0.25] } });
  }),
  P("br06p7", "GROS PLAN sur la clé noire qui pend au bout de ses doigts, sur la blouse blanche", 5, 33, (c) => {
    const h = main(c, "med", -1);
    const k = lisse(c.p);
    const t: V3 = [h[0], h[1] - 0.62, h[2]];
    return S(viser([t[0] + mel(0.35, 0.15, k), t[1] + 0.1, t[2] - mel(2.0, 1.6, k)], t, mel(36, 32, k), 0.5, 0.45), FOG.souvenir, 0.62, { fx: { vignette: 0.62, teinte: ["#8FA6E8", 0.2] } });
  }),
  P("br06p8", "Il se retourne vers nous : c'était notre médecin (poussée)", 5, 37, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([PX + 0.4, 3.0, 9.6], [PX + 0.1, 2.9, 7.6], k), [PX, 3.0, 2.7], mel(42, 38, k), 0.5, 0.42), FOG.porte, 0.62);
  }),
  P("br06p9", "DERNIER PLAN — le médecin, souriant, face caméra ; derrière lui, la porte béante et le brouillard qui remonte ; noir", 5, 39, (c) => {
    const e = ev(c);
    const k = lisse(c.p);
    const monte = lisse(entre(c.T, e.sourire - 0.6, e.fin + 1));
    const t = act(c, "med");
    const tete: V3 = t ? pointTete(t, [0, 0.42, 0.3]) : [PX, 2.5, 3.1];
    const fin = FIN_TOT(c);
    const noir = lisse(entre(c.T, fin - 0.55, fin - 0.02));
    const dt = c.T - e.sourire;
    return S(viser([PX + mel(0.2, 0, k), 2.7, mel(8.6, 7.5, k)], tete, mel(40, 35, k), 0.5, 0.37), [melCoul(FOG.porte[0], "#212840", monte), 3, mel(42, 22, monte)], 0.62, { fx: { vignette: 0.64, noir, flash: ["#FFFFFF", dt > 0 && dt < 0.15 ? 0.3 * (1 - dt / 0.15) : 0] } });
  }),
];
void lisse;
