/**
 * « La fenêtre de minuit » — mise en scène plan par plan (script : histoires/scripts-chatgpt/fenetre-de-minuit.md).
 * 10 scènes ; chaque plan démarre sur un MOT de la narration (indice du mot dans la scène) : avec la vraie voix,
 * les coupes et les actions (l'aiguille, la lampe, la flamme) suivent donc le texte, pas des durées fixes.
 * Les caméras sont celles d'un joueur : survol, suivi à la 3e personne, gros plan, rotation autour du personnage,
 * travelling vers un objet, vue à la première personne. Jamais de plan fixe.
 *
 * Règles de cadrage (leçons des versions précédentes) :
 *  - jamais plus près que ~3,4 d'un visage (la tête doit rester entière, avec de la marge) ;
 *  - le personnage n'est jamais placé entre la caméra et l'objet du plan (fenêtre, porte, bougie, enveloppe) ;
 *  - le sujet est visé vers 36–42 % de la hauteur : le mot des sous-titres (53 %) ne le recouvre pas.
 */
import type { V3 } from "../geo";
import { type Cam, entre, freine, freineDoux, lisse, mel, mel3, melCam, orbite, plus, rebond, viser } from "../maths";
import { melPose, poseAccroupi, poseAssise, poseDebout, poseMarche, type Pose, type Teinte } from "../avatar";
import type { Emotion } from "../textures";
import type { Repere } from "../decoupage";
import { B, C, CHAMBRE, FEN_B, FEN_C, FEN_J, HORLOGE, HORLOGE_CADRAN_Y, J, MAISON_C, MAISON_J, PORTE_C_X, PORTE_J_X, SALON, SOL } from "./monde";
import { T_AUBE, T_NOIR, T_NUIT_ACTEUR, melTeinte, type Etat, type EtatActeur } from "./etat";

export type Ctx = {
  /** progression du plan, 0 → 1 */
  p: number;
  /** secondes depuis le début du plan */
  t: number;
  /** durée du plan */
  d: number;
  /** temps global (s) */
  T: number;
  frame: number;
  /** instant (en secondes depuis le début du plan) où commence le mot `k` de la scène */
  mot: (k: number) => number;
};
export type PlanDef = Repere & { titre: string; etat: (c: Ctx) => Etat };

const F = SOL;
const RC = MAISON_C.ry;
const RJ = MAISON_J.ry;
const PI = Math.PI;
const T_BOUGIE_ACTEUR: Teinte = [1.12, 0.88, 0.56];
const T_CHAMBRE_NUIT_ACTEUR: Teinte = [0.32, 0.39, 0.74];
const T_CHAMBRE_LAMPE_ACTEUR: Teinte = [1.16, 1.0, 0.76];
const TETE = 2.37; // hauteur du visage d'un avatar debout (au-dessus de ses pieds)

// ------------------------------------------------------------------ Aides
/** État par défaut : la nuit, après minuit (tout est éteint sauf la bougie de la vieille dame). */
function nuit(c: Ctx, cam: Cam): Etat {
  return {
    cam,
    heure: "nuit",
    lampadaires: false,
    fenB: false,
    horloge: 5,
    salon: { lumiere: 1, meubles: true, flamme: 1, fumee: 0 },
    chambre: { lampe: false, ouverture: 0, reveil: "00:12" },
    joueur: null,
    dame: dame(c, "attente"),
    figurants: false,
    enveloppeAuSol: false,
  };
}

/** Avant minuit : lampadaires et fenêtre de la maison B allumés, pas encore de bougie. */
function avantMinuit(c: Ctx, cam: Cam): Etat {
  const e = nuit(c, cam);
  return { ...e, lampadaires: true, fenB: true, horloge: -10, salon: { ...e.salon, lumiere: 0, flamme: 0 }, dame: null };
}

/** L'aube du lendemain : la maison de la vieille dame est vide. */
function aube(cam: Cam): Etat {
  return {
    cam,
    heure: "aube",
    lampadaires: false,
    fenB: false,
    horloge: 435,
    salon: { lumiere: 0, meubles: false, flamme: 0, fumee: 0 },
    chambre: { lampe: false, ouverture: 0, reveil: "07:25" },
    joueur: null,
    dame: null,
    figurants: false,
    enveloppeAuSol: false,
  };
}

/** Les nuits suivantes : plus de bougie en face ; la fenêtre du narrateur reste ouverte. */
function nuitSuivante(c: Ctx, cam: Cam, lampe: boolean): Etat {
  return { ...nuit(c, cam), salon: { lumiere: 0, meubles: false, flamme: 0, fumee: 0 }, dame: null, chambre: { lampe, ouverture: 1, reveil: lampe ? "23:59" : "00:00" } };
}

/** La vieille dame, assise sur son canapé face à la fenêtre, les mains posées devant elle. */
function dame(c: Ctx, emotion: Emotion, lacetTete = 0, lumiere = 1): EtatActeur {
  const pose = poseAssise(c.T, SALON.assise - F + 0.23);
  pose.tete = [lacetTete + Math.sin(c.T * 0.7) * 0.03, 0.03];
  return { p: C([SALON.dame[0], F, SALON.dame[2]]), ry: RC, pose, emotion, teinte: melTeinte(T_NOIR, T_BOUGIE_ACTEUR, lumiere) };
}

const acteur = (p: V3, ry: number, pose: Pose, emotion: Emotion, teinte: Teinte = T_NUIT_ACTEUR): EtatActeur => ({ p, ry, pose, emotion, teinte });

/** Lacet d'un avatar qui regarde de `de` vers `vers`. */
const face = (de: V3, vers: V3) => Math.atan2(vers[0] - de[0], vers[2] - de[2]);

/** Point du repère d'un avatar (pieds `p`, lacet `ry` ; +z = devant lui, -x = sa droite) vers le monde. */
const devant = (p: V3, ry: number, v: V3): V3 => [p[0] + v[0] * Math.cos(ry) + v[2] * Math.sin(ry), p[1] + v[1], p[2] - v[0] * Math.sin(ry) + v[2] * Math.cos(ry)];

/** Marche en ligne droite de `de` à `vers` entre les instants t0 et t1 du plan, puis arrêt. */
function marche(c: Ctx, de: V3, vers: V3, t0: number, t1: number): { p: V3; ry: number; pose: Pose; arrive: number } {
  const k = entre(c.t, t0, t1);
  const p = mel3(de, vers, k);
  const dist = Math.hypot(vers[0] - de[0], vers[2] - de[2]);
  const arrive = entre(c.t, t1 - 0.12, t1 + 0.12);
  const pose = melPose(poseMarche(dist * k * 2.86), poseDebout(c.T), arrive);
  return { p, ry: face(de, vers), pose, arrive };
}

/** Caméra de suivi à la 3e personne : derrière l'avatar (distance, hauteur, décalage vers sa droite), visant `sujet`. */
function suivi(p: V3, ry: number, dist: number, haut: number, cote: number, sujet: V3, fov: number, sx = 0.5, sy = 0.4): Cam {
  return viser(devant(p, ry, [-cote, haut, -dist]), sujet, fov, sx, sy);
}

/** Courbe de Bézier quadratique (trajectoire de survol fluide). */
const bezier = (a: V3, b: V3, c: V3, k: number): V3 => mel3(mel3(a, b, k), mel3(b, c, k), k);

// ------------------------------------------------------------------ Repères (monde)
const FEN_C_CENTRE: V3 = C([(FEN_C.x0 + FEN_C.x1) / 2, (FEN_C.y0 + FEN_C.y1) / 2, 0]);
const FEN_J_CENTRE: V3 = J([(FEN_J.x0 + FEN_J.x1) / 2, (FEN_J.y0 + FEN_J.y1) / 2, 0]);
const FEN_B_CENTRE: V3 = B([FEN_B.x, FEN_B.y, 0.1]);
const CADRAN: V3 = [HORLOGE[0], HORLOGE_CADRAN_Y, HORLOGE[2] + 0.76];
const FLAMME: V3 = C([SALON.bougie[0], SALON.bougie[1] + 0.68, SALON.bougie[2]]);
const VISAGE_DAME: V3 = C([SALON.dame[0], F + 0.67 + 1.4, SALON.dame[2] + 0.1]);
const PHOTO: V3 = C(SALON.photo);
/** Le narrateur dans la rue, face à l'horloge (scène 2). */
const J_RUE: V3 = [1.0, 0.03, -1.7];
const RY_RUE = face(J_RUE, [HORLOGE[0], 0, HORLOGE[2]]);
/** Le narrateur sur le trottoir devant la maison C, à gauche de la fenêtre (il ne la cache jamais). */
const J_DEVANT_C_LOCAL: V3 = [-2.3, 0.14, 4.2];
const J_DEVANT_C: V3 = C(J_DEVANT_C_LOCAL);
const RY_VERS_C = RC + PI;
/** Devant la porte de la vieille dame. */
const PORTE_C: V3 = C([PORTE_C_X, F, 1.05]);
/** Sur son propre perron, devant le paillasson. */
const PERRON: V3 = J([PORTE_J_X + 0.2, F, 1.6]);
const ENVELOPPE: V3 = J([PORTE_J_X + 0.08, F + 0.1, 0.74]);
/** À sa fenêtre, derrière le bureau. */
const A_SA_FENETRE: V3 = J([2.0, F, -1.75]);

/** Trotteuse qui avance par à-coups jusqu'à minuit (`reste` = secondes de film avant le top). */
function horlogeVersMinuit(reste: number): { horloge: number; secondes: number; minuit: boolean } {
  if (reste <= 0) return { horloge: -1 + rebond(-reste / 0.4), secondes: 0, minuit: true };
  const pas = 0.17;
  const n = Math.ceil(reste / pas);
  const dans = 1 - (reste / pas - (n - 1)); // progression dans le pas courant
  return { horloge: -1, secondes: 60 - n + (dans < 0.35 ? rebond(dans / 0.35) - 1 : 0), minuit: false };
}

// ------------------------------------------------------------------ Les plans
export const PLANS: PlanDef[] = [
  // ============ SCÈNE 1 — LA RÈGLE : « Dans notre ville, une règle était connue de tous. »
  {
    id: "s01p1",
    titre: "Vue aérienne : descente rapide sur le quartier (23 h 50)",
    scene: 0,
    mot: 0,
    etat: (c) => {
      const k = freineDoux(c.p);
      return { ...avantMinuit(c, { pos: mel3([0, 27, 52], [0, 14, 33], k), look: mel3([0, 0, 8], [0, 4.4, -9], k), fov: 58 }), figurants: true };
    },
  },
  {
    id: "s01p2",
    titre: "Survol de gauche à droite au-dessus des toits (fenêtres sombres), puis zoom vers la seule fenêtre jaune",
    scene: 0,
    mot: 4,
    etat: (c) => {
      const k = lisse(c.p);
      const pos = bezier([-12.5, 10.5, 15.5], [-2, 9.4, 13], [1.1, 3.7, -3.4], k);
      const sujet = mel3(plus(FEN_J_CENTRE, [0, 0.4, 0]), FEN_B_CENTRE, lisse(entre(c.p, 0, 0.5)));
      return { ...avantMinuit(c, viser(pos, sujet, mel(56, 50, k), 0.5, mel(0.4, 0.35, k))), figurants: true };
    },
  },

  // ============ SCÈNE 2 — L'INTERDICTION : « Après minuit, personne n'avait le droit de laisser une lumière allumée. »
  {
    id: "s02p1",
    titre: "3e personne derrière le narrateur, puis travelling vers l'horloge : l'aiguille atteint 00:00, tout s'éteint",
    scene: 1,
    mot: 0,
    etat: (c) => {
      const top = Math.min(c.d * 0.78, Math.max(c.d * 0.5, c.mot(3))); // « n'avait »
      const depart = viser(devant(J_RUE, RY_RUE, [-1.0, 3.5, -6]), CADRAN, 56, 0.5, 0.33);
      const pres = viser(devant(J_RUE, RY_RUE, [-1.0, 3.5, -5]), CADRAN, 56, 0.5, 0.33);
      const horloge = viser([-8, 4.2, -2.5], CADRAN, 50, 0.4, 0.3);
      const k1 = lisse(entre(c.t, 0, c.d * 0.3));
      const k2 = lisse(entre(c.t, c.d * 0.22, top - 0.12));
      const cam = melCam(melCam(depart, pres, k1), { ...horloge, pos: plus(horloge.pos, [0.35 * (1 - c.p), 0, 0]) }, k2);
      const h = horlogeVersMinuit(top - c.t);
      const pose = poseDebout(c.T);
      pose.tete = [mel(-0.5, 0, freine(c.p * 2.2)), -0.12]; // il regarde les fenêtres, puis l'horloge
      const e = avantMinuit(c, cam);
      return { ...e, lampadaires: !h.minuit, fenB: !h.minuit, horloge: h.horloge, secondes: h.secondes, joueur: acteur(J_RUE, RY_RUE, pose, "inquiet") };
    },
  },
  {
    id: "s02p3",
    titre: "Face au narrateur : plan taille → visage inquiet, fenêtres sombres derrière lui",
    scene: 1,
    mot: 6,
    etat: (c) => {
      const k = freine(c.p);
      const tete: V3 = [J_RUE[0], TETE, J_RUE[2]];
      const cam = melCam(viser(devant(J_RUE, RY_RUE, [-0.7, 2.25, 5.6]), tete, 50, 0.5, 0.36), viser(devant(J_RUE, RY_RUE, [-0.5, 2.4, 3.8]), tete, 50, 0.5, 0.37), k);
      const pose = poseDebout(c.T);
      pose.tete = [mel(0.12, -0.25, lisse(c.p)), -0.05];
      const e = avantMinuit(c, cam);
      return { ...e, lampadaires: false, fenB: false, horloge: 0, secondes: 0, joueur: acteur(J_RUE, RY_RUE, pose, "inquiet") };
    },
  },

  // ============ SCÈNE 3 — LA VIEILLE DAME : « Ceux qui désobéissaient disparaissaient avant le lever du soleil. »
  {
    id: "s03p1",
    titre: "Travelling intérieur : de la porte d'entrée à la vue générale du salon",
    scene: 2,
    mot: 0,
    etat: (c) => {
      const k = freine(c.p);
      const cam: Cam = { pos: C(mel3([-3.9, 2.5, -1.1], [-3.7, 3.0, -6.9], k)), look: C(mel3([1.0, 2.0, -3.2], [0.8, 1.9, -2.2], k)), fov: 62 };
      return { ...nuit(c, cam), horloge: 2 };
    },
  },
  {
    id: "s03p2",
    titre: "Rotation latérale autour d'elle, jusqu'à son visage : elle regarde la rue",
    scene: 2,
    mot: 4,
    etat: (c) => {
      const k = lisse(c.p);
      const centre: V3 = [SALON.dame[0], 0, SALON.dame[2]];
      const pos = C(orbite(centre, mel(2.9, 2.7, k), mel(1.6, 0.42, k), mel(2.75, 2.6, k)));
      return { ...nuit(c, viser(pos, VISAGE_DAME, 60, 0.5, 0.38)), horloge: 2 };
    },
  },

  // ============ SCÈNE 4 — « Une nuit, j'ai remarqué une vieille dame, seule derrière sa fenêtre. Elle tenait une petite bougie et regardait constamment la rue. »
  {
    id: "s04p1",
    titre: "Suivi 3e personne : le narrateur marche dans la rue vers la maison éclairée",
    scene: 3,
    mot: 0,
    etat: (c) => {
      const m = marche(c, [1.9, 0.03, 0.4], J_DEVANT_C, 0, c.d * 0.84);
      m.pose.tete = [mel(0, -0.45, m.arrive), -0.08 * m.arrive];
      const cam = suivi(m.p, m.ry, mel(7.6, 7.0, c.p), 3.3, 1.0, FEN_C_CENTRE, 58, 0.7, 0.36);
      return { ...nuit(c, cam), joueur: acteur(m.p, m.ry, m.pose, "curieux") };
    },
  },
  {
    id: "s04p2",
    titre: "Face à la fenêtre : façade entière → fenêtre centrée",
    scene: 3,
    mot: 7,
    etat: (c) => {
      const k = freine(c.p);
      const cible = C([1.0, 2.35, -0.4]);
      const cam = melCam(viser(C([-1.2, 4.4, 15.5]), cible, 54, 0.62, 0.4), viser(C([1.0, 2.9, 7.8]), cible, 54, 0.5, 0.4), k);
      const pose = poseDebout(c.T);
      pose.tete = [-0.45, -0.08];
      return { ...nuit(c, cam), joueur: acteur(J_DEVANT_C, RY_VERS_C, pose, "curieux") };
    },
  },
  {
    id: "s04p3",
    titre: "Gros plan : la bougie, puis le visage de la vieille dame (panoramique vertical)",
    scene: 3,
    mot: 11,
    etat: (c) => {
      const k = lisse(entre(c.t, c.mot(15) - 0.1, c.mot(17) + 0.5));
      const pos = C(mel3([0.45, 2.05, 3.7], [0.4, 2.2, 3.3], k));
      const cam = melCam(viser(pos, FLAMME, 34, 0.5, 0.44), viser(pos, VISAGE_DAME, 36, 0.6, 0.34), k);
      return { ...nuit(c, cam), dame: dame(c, "attente", -0.05) };
    },
  },

  // ============ SCÈNE 5 — L'ATTENTE : « Chaque soir, elle attendait quelqu'un. Son fils, parti depuis des années. »
  {
    id: "s05p1",
    titre: "Travelling latéral intérieur : du canapé vers la photo du fils, puis gros plan sur son visage",
    scene: 4,
    mot: 0,
    etat: (c) => {
      const tPhoto = Math.min(c.d * 0.75, Math.max(c.d * 0.4, c.mot(5))); // « Son fils »
      const k1 = lisse(entre(c.t, 0, tPhoto));
      const k2 = freine(entre(c.t, tPhoto - 0.05, c.d));
      const a = viser(C([3.3, 2.75, -5.9]), VISAGE_DAME, 54, 0.45, 0.4);
      const b = viser(C([-0.6, 2.6, -3.6]), PHOTO, 50, 0.5, 0.4);
      const gros = viser(C([-1.6, 2.66, -1.95]), plus(PHOTO, [0, 0.06, 0]), 44, 0.5, 0.4);
      return { ...nuit(c, melCam(melCam(a, b, k1), gros, k2)), horloge: 8 };
    },
  },
  {
    id: "s05p3",
    titre: "Derrière son épaule : la fenêtre, la rue, et le narrateur dehors, face à elle",
    scene: 4,
    mot: 7,
    etat: (c) => {
      const k = lisse(c.p);
      const dehors = C([0.3, 0.14, 4.2]);
      const cam = viser(C(mel3([2.7, 3.2, -6.3], [2.5, 3.05, -5.7], k)), plus(dehors, [0, 2.1, 0]), 46, 0.42, 0.4);
      return { ...nuit(c, cam), horloge: 8, joueur: acteur(dehors, RY_VERS_C, poseDebout(c.T), "neutre") };
    },
  },

  // ============ SCÈNE 6 — LE CHOIX : « Je connaissais la règle. Mais cette nuit-là, je n'ai pas réussi à détourner les yeux. »
  {
    id: "s06p1",
    titre: "3e personne dans la chambre : le bureau, la lampe éteinte, et sa fenêtre éclairée au loin",
    scene: 5,
    mot: 0,
    etat: (c) => {
      const k = freine(c.p);
      const cam = viser(J(mel3([0.9, 4.15, -7.2], [0.85, 4.05, -6.3], k)), FEN_C_CENTRE, 56, 0.36, 0.35);
      const pose = poseDebout(c.T);
      pose.tete = [0.5, 0];
      return { ...nuit(c, cam), horloge: 12, joueur: acteur(J(CHAMBRE.joueur), RJ, pose, "inquiet", T_CHAMBRE_NUIT_ACTEUR) };
    },
  },
  {
    id: "s06p2",
    titre: "Rotation autour du narrateur : il hésite",
    scene: 5,
    mot: 4,
    etat: (c) => {
      const k = lisse(c.p);
      const ici: V3 = [2.1, F, -3.4];
      const pos = J(orbite(ici, 2.9, mel(0.45, -0.55, k), mel(2.75, 2.65, k)));
      const cam = viser(pos, J([ici[0], F + TETE, ici[2]]), 56, 0.5, 0.37);
      const pose = poseDebout(c.T);
      const kt = lisse(entre(c.p, 0.25, 0.8));
      pose.tete = [mel(0.45, -0.55, kt), mel(0, 0.12, kt)]; // de la fenêtre d'en face vers l'interrupteur
      return { ...nuit(c, cam), horloge: 12, joueur: acteur(J(ici), RJ, pose, "inquiet", T_CHAMBRE_NUIT_ACTEUR) };
    },
  },
  {
    id: "s06p3",
    titre: "Gros plan : son bras se lève, la main s'arrête juste avant l'interrupteur",
    scene: 5,
    mot: 9,
    etat: (c) => {
      const k = freine(c.p);
      const inter = J(CHAMBRE.interrupteur);
      const cam = viser(J(mel3([0.28, 2.52, -0.6], [0.12, 2.42, -0.88], k)), plus(inter, [0.12, 0, 0]), 50, 0.42, 0.42);
      const pose = poseDebout(c.T);
      const leve = freine(entre(c.p, 0, 0.6));
      const hesite = 0.07 * lisse(entre(c.p, 0.62, 0.9));
      pose.brasD = { x: 0, z: mel(0.05, 1.5, leve) - hesite, pli: mel(-0.3, 0, leve) };
      pose.tete = [-0.6, 0.08];
      return { ...nuit(c, cam), horloge: 12, joueur: acteur(J(CHAMBRE.joueurInterrupteur), RJ, pose, "inquiet", T_CHAMBRE_NUIT_ACTEUR) };
    },
  },

  // ============ SCÈNE 7 — LA LUMIÈRE : « Alors, à minuit passé, j'ai allumé ma lampe pour lui tenir compagnie. Pendant quelques minutes, nos deux fenêtres sont restées éclairées. »
  {
    id: "s07p1",
    titre: "Gros plan sur la lampe : éteinte → allumée (sur « allumé »)",
    scene: 6,
    mot: 0,
    etat: (c) => {
      const k = lisse(c.p);
      const lampe = J([CHAMBRE.lampe[0], CHAMBRE.lampe[1] + 0.66, CHAMBRE.lampe[2]]);
      const cam = viser(J(mel3([1.7, 2.6, -2.9], [1.95, 2.5, -2.6], k)), lampe, 44, 0.5, 0.42);
      const clic = c.t - c.mot(5);
      const on = clic >= 0;
      const pose = poseDebout(c.T);
      pose.brasD = { x: 0, z: on ? 1.5 - 0.5 * lisse(entre(clic, 0.15, 0.6)) : mel(1.43, 1.56, freine(entre(clic, -0.25, 0))), pli: 0 };
      pose.tete = [on ? -0.2 : -0.6, 0.06];
      return {
        ...nuit(c, cam),
        horloge: 15,
        chambre: { lampe: on, ouverture: 0, reveil: "00:15" },
        joueur: acteur(J(CHAMBRE.joueurInterrupteur), RJ, pose, on ? "resolu" : "inquiet", on ? T_CHAMBRE_LAMPE_ACTEUR : T_CHAMBRE_NUIT_ACTEUR),
      };
    },
  },
  {
    id: "s07p2",
    titre: "3e personne : dos du narrateur, sa lampe allumée, la fenêtre d'en face éclairée (recul)",
    scene: 6,
    mot: 8,
    etat: (c) => {
      const k = lisse(c.p);
      const cam = viser(J(mel3([0.85, 4.0, -6.0], [0.9, 4.15, -7.2], k)), FEN_C_CENTRE, 56, 0.36, 0.35);
      const pose = poseDebout(c.T);
      pose.tete = [0.5, 0];
      return { ...nuit(c, cam), horloge: 15, chambre: { lampe: true, ouverture: 0, reveil: "00:15" }, joueur: acteur(J(CHAMBRE.joueur), RJ, pose, "resolu", T_CHAMBRE_LAMPE_ACTEUR), dame: dame(c, "apaise", -0.45) };
    },
  },
  {
    id: "s07p3",
    titre: "À sa fenêtre : elle tourne la tête vers lui et sourit légèrement",
    scene: 6,
    mot: 12,
    etat: (c) => {
      const k = lisse(c.p);
      const cam = viser(C(mel3([0.55, 2.5, 4.0], [0.7, 2.45, 3.3], k)), VISAGE_DAME, 34, 0.6, 0.36);
      const tourne = lisse(entre(c.p, 0.05, 0.55));
      return { ...nuit(c, cam), horloge: 15, chambre: { lampe: true, ouverture: 0, reveil: "00:15" }, dame: dame(c, tourne > 0.5 ? "apaise" : "attente", -0.45 * tourne) };
    },
  },
  {
    id: "s07p4",
    titre: "Vue aérienne basse : les deux fenêtres jaunes dans le quartier bleu nuit",
    scene: 6,
    mot: 15,
    etat: (c) => {
      const k = lisse(c.p);
      const cam = viser(mel3([0.8, 7.2, 20.5], [0.8, 10, 29], k), [0.8, 2.5, -6.5], 70, 0.5, 0.36);
      const pose = poseDebout(c.T);
      pose.tete = [0.5, 0];
      return { ...nuit(c, cam), horloge: 16, chambre: { lampe: true, ouverture: 0, reveil: "00:16" }, joueur: acteur(A_SA_FENETRE, RJ, pose, "resolu", T_CHAMBRE_LAMPE_ACTEUR), dame: dame(c, "apaise", -0.45) };
    },
  },

  // ============ SCÈNE 8 — LA DISPARITION : « Puis, soudain, sa bougie s'est éteinte. Sa fenêtre est devenue noire. »
  {
    id: "s08p1",
    titre: "Gros plan sur la bougie : la flamme diminue puis disparaît (sur « éteinte »)",
    scene: 7,
    mot: 0,
    etat: (c) => {
      const k = lisse(c.p);
      const cam = viser(C(mel3([-1.15, 2.2, -2.3], [-0.85, 2.1, -1.95], k)), FLAMME, 42, 0.5, 0.4);
      const fin = c.t - (c.mot(5) - 0.05);
      const lumiere = fin < 0 ? 1 : mel(1, 0.55, entre(fin, 0, 0.3));
      return {
        ...nuit(c, cam),
        horloge: 19,
        chambre: { lampe: true, ouverture: 0, reveil: "00:19" },
        salon: { lumiere, meubles: true, flamme: fin < 0 ? 1 : 1 - freineDoux(fin / 0.3), fumee: fin < 0.2 ? 0 : entre(fin, 0.2, 1.6) },
        dame: dame(c, "attente", 0, lumiere),
      };
    },
  },
  {
    id: "s08p2",
    titre: "Face à la fenêtre : jaune → noire, la vieille dame disparaît ; rotation rapide vers le visage choqué du narrateur",
    scene: 7,
    mot: 6,
    etat: (c) => {
      const tNoir = c.mot(8) - 0.04; // « est devenue noire »
      const tRot = Math.min(c.d - 0.75, c.mot(9) + 0.1);
      const noir = c.t >= tNoir;
      const k = freine(entre(c.t, tRot, tRot + 0.55));
      const devantFenetre = viser(C(mel3([-2.7, 3.25, 10.8], [-2.7, 3.2, 10.4], lisse(c.p * 2))), C([1.0, 2.35, 0]), 54, 0.74, 0.38);
      // rotation autour de lui : de derrière jusqu'à son visage, par sa droite
      const a = mel(0.1, 2.859, k);
      const r = mel(6.0, 3.6, k) + 0.25 * entre(c.t, tRot + 0.55, c.d);
      const pos = C([J_DEVANT_C_LOCAL[0] + Math.sin(a) * r, mel(3.2, 2.5, k), J_DEVANT_C_LOCAL[2] + Math.cos(a) * r]);
      const visage = viser(pos, plus(J_DEVANT_C, [0, TETE - 0.14, 0]), 52, mel(0.5, 0.66, k), 0.38);
      const cam = k <= 0 ? devantFenetre : k < 0.2 ? melCam(devantFenetre, visage, k / 0.2) : visage;
      const pose = poseDebout(c.T);
      const choc = lisse(entre(c.t, tNoir, tNoir + 0.2));
      pose.tete = [mel(-0.5, 0, k), -0.06];
      pose.brasG = { x: -0.3 * choc, z: 0.05 + 0.2 * choc, pli: -0.55 * choc };
      pose.brasD = { x: -0.3 * choc, z: 0.05 + 0.2 * choc, pli: -0.55 * choc };
      return {
        ...nuit(c, cam),
        horloge: 19,
        chambre: { lampe: true, ouverture: 0, reveil: "00:19" },
        salon: { lumiere: noir ? 0 : 0.55, meubles: true, flamme: 0, fumee: 0 },
        dame: noir ? null : dame(c, "attente", 0, 0.55),
        joueur: acteur(J_DEVANT_C, RY_VERS_C, pose, noir ? "surpris" : "curieux"),
      };
    },
  },

  // ============ SCÈNE 9 — LE LENDEMAIN : « Le lendemain matin, je suis allé frapper chez elle. Personne n'a répondu. La maison était vide. »
  {
    id: "s09p1",
    titre: "Vue aérienne : le quartier à l'aube (coupe franche depuis la nuit)",
    scene: 8,
    mot: 0,
    etat: (c) => {
      const k = freineDoux(c.p);
      const cam: Cam = { pos: mel3([3, 17, 37], [1, 13.5, 31], k), look: mel3([0.5, 2, -4], [1.5, 3.4, -8], k), fov: 58 };
      const m = marche(c, [-3.6, 0.03, 0.6], [2.6, 0.03, -3.6], -0.6, 2.4);
      return { ...aube(cam), joueur: acteur(m.p, m.ry, m.pose, "inquiet", T_AUBE) };
    },
  },
  {
    id: "s09p2",
    titre: "3e personne : il marche jusqu'à la porte, la caméra passe sur son côté, il frappe trois fois",
    scene: 8,
    mot: 3,
    etat: (c) => {
      const tArr = Math.max(0.5, c.mot(6) - 0.12); // « frapper »
      const m = marche(c, C([PORTE_C_X - 0.05, 0.05, 5.2]), PORTE_C, 0, tArr);
      const p: V3 = [m.p[0], mel(0.05, F, entre(c.t, tArr - 0.4, tArr - 0.12)), m.p[2]];
      const coups = c.t - tArr - 0.08;
      if (coups > 0) {
        const leve = freine(coups / 0.16);
        const frappe = coups < 1.0 ? Math.max(0, Math.sin((coups - 0.1) * ((PI * 2) / 0.3))) : 0;
        m.pose.brasD = { x: mel(0, -1.5, leve), z: 0.05, pli: mel(0, -1.3 + 0.8 * frappe, leve) };
        m.pose.tete = [0, -0.04];
      }
      const k = lisse(entre(c.t, 0.05, tArr + 0.15));
      const cam = melCam(viser(C([-1.3, 3.0, 9.2]), C([PORTE_C_X, 2.0, 0.2]), 54, 0.42, 0.42), viser(C([1.5, 2.5, 3.9]), C([PORTE_C_X + 0.1, 2.0, 0.55]), 54, 0.4, 0.42), k);
      return { ...aube(cam), joueur: acteur(p, RY_VERS_C, m.pose, "inquiet", T_AUBE) };
    },
  },
  {
    id: "s09p3",
    titre: "Personne ne répond : il se tourne vers la fenêtre, son bras retombe",
    scene: 8,
    mot: 9,
    etat: (c) => {
      const k = lisse(c.p);
      const tete = plus(PORTE_C, [0, TETE, 0]);
      const cam = viser(C(mel3([1.0, 2.55, 2.9], [0.7, 2.5, 2.7], k)), tete, 48, 0.5, 0.37);
      const tourne = lisse(entre(c.p, 0.08, 0.5));
      const pose = poseDebout(c.T);
      pose.brasD = { x: mel(-1.5, 0, tourne), z: 0.05, pli: mel(-1.0, 0, tourne) };
      pose.tete = [-0.3 * tourne, 0.1 * lisse(entre(c.p, 0.6, 1))];
      return { ...aube(cam), joueur: acteur(PORTE_C, RY_VERS_C - 0.95 * tourne, pose, c.p > 0.55 ? "triste" : "inquiet", T_AUBE) };
    },
  },
  {
    id: "s09p4",
    titre: "Face à la fenêtre : on s'approche, l'intérieur est vide",
    scene: 8,
    mot: 12,
    etat: (c) => {
      const k = freine(c.p);
      const cam = viser(C(mel3([0.7, 2.9, 8.2], [1.25, 2.55, 2.5], k)), C(mel3([1.0, 2.3, -1], [0.3, 2.0, -4.5], k)), 54, 0.5, 0.42);
      return aube(cam);
    },
  },

  // ============ SCÈNE 10 — LA LETTRE
  {
    id: "s10p1",
    titre: "3e personne : il rentre chez lui ; quelque chose de blanc l'attend sur le paillasson",
    scene: 9,
    mot: 0,
    etat: (c) => {
      const m = marche(c, J([PORTE_J_X + 0.25, 0.05, 8.0]), J([PORTE_J_X + 0.25, 0.05, 4.2]), 0, c.d * 0.92);
      const cam = viser(J(mel3([1.2, 3.1, 13.0], [0.9, 2.9, 10.6], lisse(c.p))), J([PORTE_J_X + 0.5, 1.2, 2.0]), 58, 0.6, 0.45);
      return { ...aube(cam), enveloppeAuSol: true, joueur: acteur(m.p, RJ + PI, m.pose, "triste", T_AUBE) };
    },
  },
  {
    id: "s10p2",
    titre: "Caméra au ras du sol : ses chaussures, puis l'enveloppe ; il s'accroupit et la ramasse",
    scene: 9,
    mot: 4,
    etat: (c) => {
      const k = lisse(entre(c.p, 0.05, 0.5));
      const cam = viser(J(mel3([1.5, F + 0.7, 3.3], [1.1, F + 0.82, 2.8], k)), mel3(plus(PERRON, [0, 0.14, 0]), plus(ENVELOPPE, [0, 0.16, 0.1]), k), 46, 0.5, 0.52);
      const bas = lisse(entre(c.p, 0.42, 0.8));
      const pose = melPose(poseDebout(c.T), poseAccroupi(), bas);
      const prise = lisse(entre(c.p, 0.82, 1));
      const j = acteur(PERRON, RJ + PI, pose, "curieux", T_AUBE);
      if (prise > 0) j.tenu = { type: "enveloppe", p: [0, mel(0.1, 0.36, prise), 0.86], r: [mel(-PI / 2, -1.3, prise), PI, 0.2 * (1 - prise)], rabat: 0, photo: 0 };
      return { ...aube(cam), enveloppeAuSol: prise <= 0, joueur: j };
    },
  },
  {
    id: "s10p3",
    titre: "Vue à la première personne : l'enveloppe s'ouvre dans ses mains, la vieille photo du garçon apparaît",
    scene: 9,
    mot: 9,
    etat: (c) => {
      const ry = RJ + PI;
      const rabat = lisse(entre(c.t, 0.1, 0.55));
      const photo = freineDoux(entre(c.t, Math.max(0.45, c.mot(12) - 0.25), Math.max(1.0, c.mot(14) + 0.1)));
      const k = lisse(c.p);
      const cam: Cam = { pos: devant(PERRON, ry, [0, 2.38, 0.3]), look: devant(PERRON, ry, [0.01, 1.53 + 0.1 * photo, 0.9 + 0.06 * photo]), fov: mel(68, 62, k) };
      const pose = poseDebout(c.T);
      pose.brasG = { x: -0.78, z: -0.2, pli: -0.62 };
      pose.brasD = { x: -0.78, z: -0.2, pli: -0.62 };
      const j = acteur(PERRON, ry, pose, "curieux", T_AUBE);
      j.tenu = { type: "enveloppe", p: [0, 1.5, 0.86], r: [-1.2, PI, 0], rabat, photo };
      return { ...aube(cam), joueur: j };
    },
  },
  {
    id: "s10p4",
    titre: "Même vue : quelques mots — la lettre sort à son tour",
    scene: 9,
    mot: 17,
    continu: true,
    etat: (c) => {
      const ry = RJ + PI;
      const sortie = freineDoux(entre(c.t, 0.05, 0.55));
      const cam: Cam = { pos: devant(PERRON, ry, [0, 2.38, 0.3]), look: devant(PERRON, ry, [0.01 + 0.06 * sortie, 1.63, 0.96]), fov: mel(62, 60, c.p) };
      const pose = poseDebout(c.T);
      pose.brasG = { x: -0.78, z: -0.2, pli: -0.62 };
      pose.brasD = { x: -0.78, z: -0.2, pli: -0.62 };
      const j = acteur(PERRON, ry, pose, "surpris", T_AUBE);
      j.tenu = { type: "enveloppe", p: [0, 1.5, 0.86], r: [-1.2, PI, 0], rabat: 1, photo: 1, lettre: sortie };
      return { ...aube(cam), joueur: j };
    },
  },
  {
    id: "s10p5",
    titre: "Face à lui, devant sa porte bleue : il lit — surpris, puis triste, puis apaisé",
    scene: 9,
    mot: 22,
    etat: (c) => {
      const k = lisse(c.p);
      const tete = plus(PERRON, [0, TETE, 0]);
      const cam = viser(J(mel3([PORTE_J_X + 0.75, 2.45, 6.2], [PORTE_J_X + 0.55, 2.5, 5.6], k)), tete, 46, 0.5, 0.36);
      const pose = poseDebout(c.T);
      pose.brasG = { x: -0.6, z: -0.14, pli: -1.15 };
      pose.brasD = { x: -0.6, z: -0.14, pli: -1.15 };
      pose.tete = [0, mel(0.3, 0.12, lisse(entre(c.p, 0.7, 1)))];
      const j = acteur(PERRON, RJ, pose, c.p < 0.38 ? "surpris" : c.p < 0.78 ? "triste" : "apaise", T_AUBE);
      j.tenu = { type: "lettre", p: [0, 1.6, 0.56], r: [-0.5, PI, 0] };
      return { ...aube(cam), joueur: j };
    },
  },
  {
    id: "s10p6",
    titre: "Derrière lui : la photo à la main, il regarde la maison d'en face, fenêtre noire",
    scene: 9,
    mot: 27,
    etat: (c) => {
      const pieds = J([0.5, 0.14, 4.4]);
      const ry = face(pieds, FEN_C_CENTRE);
      const k = lisse(c.p);
      const cam = suivi(pieds, ry, mel(4.2, 4.6, k), mel(2.9, 3.0, k), 0.5, FEN_C_CENTRE, 58, 0.66, 0.34);
      const pose = poseDebout(c.T);
      pose.brasD = { x: -0.35, z: 0.1, pli: -0.9 };
      pose.tete = [0, -0.08];
      const j = acteur(pieds, ry, pose, "apaise", T_AUBE);
      j.tenu = { type: "photo", p: [-0.7, 1.42, 0.42], r: [0.12, PI, 0.08] };
      return { ...aube(cam), joueur: j };
    },
  },
  {
    id: "s10p7",
    titre: "La nuit suivante : l'horloge marque minuit, sa fenêtre s'éteint (sur « j'éteins »)",
    scene: 9,
    mot: 33,
    etat: (c) => {
      const k = lisse(c.p);
      const cam = viser(mel3([6.0, 3.7, -7.3], [5.4, 3.6, -7.6], k), [HORLOGE[0], HORLOGE_CADRAN_Y, HORLOGE[2]], 44, 0.74, 0.28);
      const top = Math.min(c.d - 0.6, Math.max(0.5, c.mot(36)));
      const h = horlogeVersMinuit(top - c.t);
      const pose = poseDebout(c.T);
      pose.tete = [0.5, 0];
      return {
        ...nuitSuivante(c, cam, !h.minuit),
        lampadaires: !h.minuit,
        horloge: h.horloge,
        secondes: h.secondes,
        joueur: acteur(A_SA_FENETRE, RJ, pose, "neutre", h.minuit ? T_CHAMBRE_NUIT_ACTEUR : T_CHAMBRE_LAMPE_ACTEUR),
      };
    },
  },
  {
    id: "s10p8",
    titre: "Sa fenêtre : lumière éteinte, mais grande ouverte",
    scene: 9,
    mot: 41,
    etat: (c) => {
      const k = lisse(c.p);
      const cam = viser(J(mel3([4.8, 3.1, 7.6], [3.6, 2.9, 5.4], k)), J([1.9, 2.5, 0]), 48, 0.5, 0.4);
      const pose = poseDebout(c.T);
      pose.tete = [0.5, 0];
      return { ...nuitSuivante(c, cam, false), horloge: 20, joueur: acteur(A_SA_FENETRE, RJ, pose, "apaise", T_CHAMBRE_NUIT_ACTEUR) };
    },
  },
  {
    id: "s10p9",
    titre: "Face à lui, à sa fenêtre ouverte : « Et toi ? »",
    scene: 9,
    mot: 48,
    etat: (c) => {
      const tete = plus(A_SA_FENETRE, [0, TETE, 0]);
      const cam = melCam(viser(J([2.25, 2.75, 2.2]), tete, 40, 0.5, 0.37), viser(J([2.2, 2.75, 2.8]), tete, 40, 0.5, 0.37), lisse(c.p));
      const pose = poseDebout(c.T);
      pose.tete = [mel(0.5, 0, lisse(entre(c.t, 0, 0.35))), 0];
      return { ...nuitSuivante(c, cam, false), horloge: 20, joueur: acteur(A_SA_FENETRE, RJ, pose, "apaise", T_CHAMBRE_NUIT_ACTEUR) };
    },
  },
  {
    id: "s10p10",
    titre: "Recul lent : sa maison, la fenêtre ouverte dans la nuit",
    scene: 9,
    mot: 52,
    etat: (c) => {
      const k = lisse(c.p);
      const cam = melCam(viser(J([2.4, 3.2, 6.0]), J([1.6, 2.7, 0]), 50, 0.5, 0.4), viser(J([1.7, 4.6, 13.5]), J([1.0, 3.0, 0]), 50, 0.5, 0.4), k);
      return { ...nuitSuivante(c, cam, false), horloge: 20, joueur: acteur(A_SA_FENETRE, RJ, poseDebout(c.T), "apaise", T_CHAMBRE_NUIT_ACTEUR) };
    },
  },
  {
    id: "s10p11",
    titre: "Dernière image : le quartier endormi vu d'en haut (la caméra remonte, à l'inverse de l'ouverture) — question finale",
    scene: 9,
    mot: 58,
    etat: (c) => {
      const k = lisse(c.p);
      const cam: Cam = { pos: mel3([0, 12.5, 30], [0, 19, 40], k), look: mel3([0, 3.6, -8], [0, 2.4, -3], k), fov: 58 };
      return { ...nuitSuivante(c, cam, false), horloge: 20, joueur: acteur(A_SA_FENETRE, RJ, poseDebout(c.T), "apaise", T_CHAMBRE_NUIT_ACTEUR) };
    },
  },
];
