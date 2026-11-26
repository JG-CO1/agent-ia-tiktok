/**
 * « Dans cette ville, tout le monde sort faire la fête… sauf moi » — mise en scène plan par plan
 * (script : histoires/huss/SCRIPT.md ; récit : histoires/recits/huss-001.json ; repères de l'épisode : index.ts).
 *
 * Caméra de joueur : survol aérien, 3e personne derrière l'avatar, face à lui, rotation rapide, gros plan sur le ballon,
 * suivi d'un habitant. Jamais de plan fixe. Chaque plan démarre sur un MOT de la narration (indice du mot dans la scène).
 * Le joueur, le ballon et la foule sont des fonctions du temps (joueur.ts, foule.ts) : un plan ne choisit que la caméra.
 *
 * Règles de cadrage : la tête reste entière avec de la marge (jamais plus près que ~3,2), le sujet est visé vers 38–42 %
 * de la hauteur (le mot des sous-titres occupe 53 %), la caméra ne traverse jamais une maison.
 */
import type { V3 } from "../../../geo";
import { type Cam, entre, freine, freineDoux, lisse, mel, mel3, melCam, orbite, viser } from "../../../maths";
import type { PlanGen, CtxGen } from "../../../types";
import type { DonneesVille } from "../../donnees";
import { joueurA, type EtatJoueur } from "../../joueur";
import { DEPART, FETE, PANIER_A, TERRAIN, feteMonde } from "../../lieux";

const PI = Math.PI;

// ------------------------------------------------------------------ Aides
const dn = (c: CtxGen) => c.data as DonneesVille;
const J = (c: CtxGen): EtatJoueur => joueurA(c.T, dn(c));
/** Point du repère d'un avatar (pieds `p`, lacet `ry` ; +z = devant lui, -x = sa droite) vers le monde. */
const devant = (p: V3, ry: number, v: V3): V3 => [p[0] + v[0] * Math.cos(ry) + v[2] * Math.sin(ry), p[1] + v[1], p[2] - v[0] * Math.sin(ry) + v[2] * Math.cos(ry)];
const tete = (j: EtatJoueur): V3 => [j.p[0], j.p[1] + 2.4, j.p[2]];
const torse = (j: EtatJoueur): V3 => [j.p[0], j.p[1] + 1.7, j.p[2]];
const bezier = (a: V3, b: V3, c: V3, k: number): V3 => mel3(mel3(a, b, k), mel3(b, c, k), k);
const plus = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Suivi à la 3e personne : derrière le joueur (dist), à hauteur `haut`, décalé de `cote` vers sa droite. */
function derriere(j: EtatJoueur, dist: number, haut: number, cote: number, sujet: V3, fov: number, sx = 0.5, sy = 0.4): Cam {
  return viser(devant(j.p, j.ry, [-cote, haut, -dist]), sujet, fov, sx, sy);
}
/** Face au joueur, à `dist` devant lui. */
function face(j: EtatJoueur, dist: number, haut: number, cote: number, sujet: V3, fov: number, sy = 0.42): Cam {
  return viser(devant(j.p, j.ry, [-cote, haut, dist]), sujet, fov, 0.5, sy);
}
/**
 * Gros plan sur le ballon : `cote` = décalage latéral dans le repère du joueur (négatif = côté de sa main droite, celle qui
 * dribble), `haut` hauteur de la caméra, `avant` distance devant lui. Le ballon occupe ~18 % de la hauteur de l'écran.
 */
function surBalle(j: EtatJoueur, k: number, cote = -4.2, haut = 1.0, avant = 3.4): Cam {
  return viser(devant(j.p, j.ry, [cote * mel(1, 0.88, k), mel(haut, haut - 0.15, k), avant * mel(1, 0.86, k)]), devant(j.p, j.ry, [-0.7, 0.95, 0.66]), 42, 0.5, 0.45);
}
/** Gros plan du visage : la tête est visée à 34 % de la hauteur, le mot des sous-titres (53 %) passe sous les yeux. */
function visage(j: EtatJoueur, k: number, d0 = 6.4, d1 = 5.4, cote = 0.3): Cam {
  return viser(devant(j.p, j.ry, [-cote, mel(2.95, 2.8, k), mel(d0, d1, k)]), tete(j), 38, 0.5, 0.34);
}
/** Instant (en s depuis le début du plan) → progression bornée entre deux instants. */
const seg = (c: CtxGen, a: number, b: number) => lisse(entre(c.t, a, b));

/** Habitant suivi par la caméra (jamais null : repli sur le centre de la rue). */
function hab(c: CtxGen, id: string): V3 {
  const a = dn(c).acteur(id, c.T);
  return a ? a.p : [0, 0, -30];
}

// ------------------------------------------------------------------ Les plans
export const PLANS: PlanGen[] = [
  // ============ SCÈNE 1 — LA RÈGLE : « Dans cette ville, tout le monde sort faire la fête… sauf moi. »
  {
    id: "s01p1",
    titre: "Survol aérien depuis la maison de fête, puis piqué rapide qui se pose derrière le joueur qui dribble",
    scene: 0,
    mot: 0,
    etat: (c) => {
      const j = J(c);
      const a = freineDoux(entre(c.p, 0, 0.62));
      const aerien = viser(bezier([16, 36, -50], [9, 26, -10], [-4, 16, 18], a), mel3([0, 4, -84], [-13, 1, 6], lisse(a)), 62, 0.5, 0.42);
      const fin = derriere(j, 6.2, 3.8, 0.6, [j.p[0], 2.4, j.p[2] - 5], 56, 0.5, 0.4);
      return { cam: melCam(aerien, fin, freine(entre(c.p, 0.5, 1))) };
    },
  },
  {
    id: "s01p3",
    titre: "Face au joueur, plan taille : il dribble, sérieux (« la fête… sauf moi »)",
    scene: 0,
    mot: 9,
    etat: (c) => {
      const j = J(c);
      const k = freine(c.p);
      const cam = melCam(face(j, 6.4, 2.9, 0.3, torse(j), 52), face(j, 5.0, 2.7, -0.2, [j.p[0], 2.2, j.p[2]], 50), k);
      return { cam };
    },
  },

  // ============ SCÈNE 2 — LA FÊTE : « Ce soir, il y a une énorme fête au bout de la rue. Même le facteur y va. Avec le courrier. »
  {
    id: "s02p1",
    titre: "Travelling aérien le long de la rue pleine de monde, qui descend vers la maison de fête (« énorme fête au bout de la rue »)",
    scene: 1,
    mot: 0,
    etat: (c) => {
      const k = lisse(c.p);
      const pos = bezier([3, 9.5, 42], [1.5, 7.0, -8], [-1.5, 3.6, -44], k);
      return { cam: viser(pos, mel3([0, 3, -70], [0, 3.8, -84], k), mel(62, 56, k), 0.5, 0.42) };
    },
  },
  {
    id: "s02p3",
    titre: "Travelling latéral : le facteur marche vers la fête ; la caméra passe devant lui, on voit l'enveloppe et le sac (« Même le facteur y va. Avec le courrier. »)",
    scene: 1,
    mot: 13,
    etat: (c) => {
      const f = hab(c, "facteur");
      const k = lisse(entre(c.p, 0.45, 0.9));
      const flanc = viser([f[0] - 6.4, 2.4, f[2] + 2.4], [f[0], 2.0, f[2] - 0.6], 50, 0.5, 0.42);
      const face = viser([f[0] - 3.6, 2.4, f[2] - 6.0], [f[0], 1.9, f[2]], 44, 0.5, 0.42);
      return { cam: melCam(flanc, face, k) };
    },
  },

  // ============ SCÈNE 3 — LE TERRAIN : « Moi, j'ai un terrain de basket, un ballon, et une seule mission : m'entraîner. »
  {
    id: "s03p1",
    titre: "Plan large depuis la rue (lui qui dribble sur le terrain bleu et orange), puis survol des lignes et des deux paniers",
    scene: 2,
    mot: 0,
    etat: (c) => {
      const j = J(c);
      const large = viser(mel3([-1.5, 4.8, 14.5], [-4.5, 4.2, 11], lisse(c.p)), plus(torse(j), [0, 0.2, 0]), 56, 0.5, 0.42);
      const k = mel(-21, -5, lisse(entre(c.p, 0.4, 1)));
      const haut = viser([k, mel(13, 15.5, lisse(entre(c.p, 0.4, 1))), mel(22, 0, lisse(entre(c.p, 0.4, 1)))], [TERRAIN.cx, 0.5, 6], 60, 0.5, 0.45);
      return { cam: melCam(large, haut, lisse(entre(c.p, 0.35, 0.62))) };
    },
  },
  {
    id: "s03p3",
    titre: "Gros plan au ras du sol : le ballon rebondit entre sa main et le terrain (« un ballon »)",
    scene: 2,
    mot: 6,
    etat: (c) => {
      const j = J(c);
      return { cam: surBalle(j, lisse(c.p), -4.2, 0.9, 3.4) };
    },
  },
  {
    id: "s03p4",
    titre: "3e personne derrière lui (le panier est devant), puis rotation rapide autour de lui (« une seule mission : m'entraîner »)",
    scene: 2,
    mot: 10,
    etat: (c) => {
      const j = J(c);
      // un seul mouvement continu : on part derrière lui (le panier devant), puis la caméra tourne autour de lui
      const r = freine(entre(c.p, 0.5, 1));
      const k = freineDoux(entre(c.p, 0, 0.5));
      const pos = orbite(torse(j), mel(mel(7.0, 6.0, k), 4.4, r), mel(0.14, -1.7, r), mel(mel(4.2, 3.6, k), 2.2, r));
      const sujet = mel3([j.p[0], mel(3.2, 2.6, k), j.p[2] - 6], torse(j), lisse(entre(c.p, 0.45, 0.8)));
      return { cam: viser(pos, sujet, mel(56, 52, r), 0.5, 0.42) };
    },
  },

  // ============ SCÈNE 4 — LE DRIBBLE : « Alors je dribble. HUSS. HUSS. HUSS. »
  {
    id: "s04p1",
    titre: "Face à lui, plan taille bas : il dribble (« Alors je dribble »)",
    scene: 3,
    mot: 0,
    etat: (c) => {
      const j = J(c);
      const k = lisse(c.p);
      return { cam: face(j, mel(6.2, 5.0, k), mel(1.7, 2.1, k), 0.2, torse(j), 52, 0.44) };
    },
  },
  {
    id: "s04p2",
    titre: "Gros plan ballon, bas : HUSS (le ballon frappe le sol)",
    scene: 3,
    mot: 3,
    etat: (c) => {
      const j = J(c);
      return { cam: surBalle(j, lisse(c.p), -4.2, 0.9, 3.4) };
    },
  },
  {
    id: "s04p4",
    titre: "Rotation rapide de la face au profil, en s'approchant : HUSS",
    scene: 3,
    mot: 5,
    etat: (c) => {
      const j = J(c);
      const k = freine(c.p);
      const pos = orbite(torse(j), mel(6.6, 5.0, k), mel(PI + 0.3, PI + 1.4, k), mel(2.2, 1.7, k));
      return { cam: viser(pos, torse(j), 50, 0.5, 0.4) };
    },
  },

  // ============ SCÈNE 5 — LES VOISINS : « Mes voisins passent devant le terrain en dansant. L'un d'eux me crie : « Tu viens ? » Je réponds : « Non, j'ai entraînement. » »
  {
    id: "s05p1",
    titre: "Au ras du trottoir : trois voisins arrivent en dansant ; la caméra passe par-dessus l'épaule du joueur, ils défilent derrière la clôture",
    scene: 4,
    mot: 0,
    etat: (c) => {
      const j = J(c);
      const k = lisse(entre(c.p, 0, 0.5));
      const rue = viser(mel3([-0.2, 1.8, -11], [-0.4, 2.1, -6.5], k), [-4.4, 2.3, 17], 46, 0.5, 0.42);
      const epaule = viser(mel3([-17.8, 2.8, 8.2], [-17.0, 2.9, 7.2], lisse(c.p)), [-6.0, 2.4, mel(7, 3.6, lisse(c.p))], 52, 0.5, 0.42);
      void j;
      // coupe franche à mi-plan (la caméra ne traverse pas le terrain)
      return { cam: c.p < 0.5 ? rue : epaule };
    },
  },
  {
    id: "s05p3",
    titre: "Du point de vue du joueur : le voisin s'arrête au bord du terrain et lui crie dessus, la caméra s'approche : « Tu viens ? »",
    scene: 4,
    mot: 8,
    etat: (c) => {
      const v = hab(c, "voisin0");
      const k = lisse(entre(c.p, 0.35, 0.75));
      const large = viser([mel(-11.8, -11.0, lisse(c.p)), 2.5, 4.6], [v[0], 2.5, v[2]], 46, 0.5, 0.42);
      const serre = viser([-11.2, 2.9, 2.7], [v[0], 2.75, v[2]], 36, 0.5, 0.46);
      return { cam: melCam(large, serre, k) };
    },
  },
  {
    id: "s05p6",
    titre: "Dos du voisin, le joueur au loin qui dribble : « Je réponds : Non, j'ai entraînement »",
    scene: 4,
    mot: 18,
    etat: (c) => {
      const j = J(c);
      const k = lisse(c.p);
      return { cam: viser(mel3([-2.6, 2.9, 6.4], [-3.4, 2.8, 5.6], k), plus(torse(j), [0, 0.2, 0]), 50, 0.5, 0.42) };
    },
  },

  // ============ SCÈNE 6 — LE REGARD : « Il me regarde comme si je venais de la Lune. Je continue. HUSS. HUSS. HUSS. »
  {
    id: "s06p1",
    titre: "Gros plan sur le voisin médusé, puis panoramique brusque vers la Lune (« comme si je venais de la Lune »)",
    scene: 5,
    mot: 0,
    etat: (c) => {
      const v = hab(c, "voisin0");
      const k = lisse(c.p);
      const pos: V3 = [mel(-11.0, -9.4, k), mel(2.9, 1.5, lisse(entre(c.p, 0.4, 0.7))), mel(3.0, 4.6, lisse(entre(c.p, 0.4, 0.7)))];
      const visage = viser(pos, [v[0], 2.75, v[2]], mel(36, 52, lisse(entre(c.p, 0.3, 0.6))), 0.5, 0.46);
      const lune = viser(pos, [-70, 96, -330], 60, 0.5, 0.36);
      return { cam: melCam(visage, { ...lune, pos }, lisse(entre(c.p, 0.52, 0.85))) };
    },
  },
  {
    id: "s06p4",
    titre: "Gros plan ballon, côté : « Je continue » + HUSS",
    scene: 5,
    mot: 10,
    etat: (c) => {
      const j = J(c);
      return { cam: surBalle(j, lisse(c.p), 4.4, 0.9, 3.2) };
    },
  },
  {
    id: "s06p5",
    titre: "Visage en plongée légère, en s'approchant : HUSS",
    scene: 5,
    mot: 13,
    etat: (c) => {
      const j = J(c);
      return { cam: visage(j, lisse(c.p), 6.6, 5.4, 0.4) };
    },
  },
  {
    id: "s06p6",
    titre: "Montée verticale au-dessus du terrain : HUSS",
    scene: 5,
    mot: 13,
    etat: (c) => {
      const j = J(c);
      const k = freineDoux(c.p);
      return { cam: viser(mel3([j.p[0] + 3.5, 5.0, j.p[2] - 4.5], [-6, 26, 20], k), mel3(torse(j), [TERRAIN.cx, 0, TERRAIN.cz], k), 60, 0.5, 0.42) };
    },
  },

  // ============ SCÈNE 7 — LA VILLE : « Le boulanger a fermé sa boutique pour aller danser. Le policier aussi. Même le maire a mis un chapeau pointu. »
  {
    id: "s07p1",
    titre: "Dans la rue : le boulanger sort de chez lui et part danser ; la caméra passe derrière lui, la fête brille au bout de la rue",
    scene: 6,
    mot: 0,
    etat: (c) => {
      const b = hab(c, "boulanger");
      const rue = viser([-1.8, 2.3, b[2] + 8.5 - c.t * 0.6], [b[0] - 0.4, 2.0, b[2]], 50, 0.5, 0.42);
      const derriere = viser([b[0] - 1.3, 3.0, b[2] + 7.5], [0, mel(3.4, 4.2, c.p), -84], 54, 0.5, 0.42);
      return { cam: melCam(rue, derriere, lisse(entre(c.p, 0.5, 0.78))) };
    },
  },
  {
    id: "s07p3",
    titre: "Le policier traverse la rue en dansant (« Le policier aussi »)",
    scene: 6,
    mot: 9,
    etat: (c) => {
      const p = hab(c, "policier");
      return { cam: viser([1.6, 2.4, p[2] + 7.0 - c.t * 0.5], [p[0] + 0.4, 2.0, p[2]], 50, 0.5, 0.42) };
    },
  },
  {
    id: "s07p4",
    titre: "Le maire sur la piste de danse : gros plan, puis tilt vers son chapeau pointu",
    scene: 6,
    mot: 12,
    etat: (c) => {
      const m = hab(c, "maire");
      const k = seg(c, c.d * 0.45, c.d * 0.8);
      return { cam: viser([m[0] - 1.9, 2.9, m[2] + 7.2 - c.t * 0.3], [m[0], mel(2.6, 3.6, k), m[2]], 38, 0.5, 0.42) };
    },
  },

  // ============ SCÈNE 8 — LA BASSE : « La musique est si forte que mon ballon rebondit en rythme. Je n'ai rien décidé. C'est la basse. »
  {
    id: "s08p1",
    titre: "Enceinte géante qui pulse, la foule qui saute derrière (« La musique »)",
    scene: 7,
    mot: 0,
    etat: (c) => {
      const k = lisse(c.p);
      return { cam: viser(mel3(feteMonde([-10.4, 4.6, 17.5]), feteMonde([-9.6, 4.2, 15.0]), k), feteMonde([-8.8, 1.9, 4.4]), 50, 0.5, 0.42) };
    },
  },
  {
    id: "s08p2",
    titre: "Gros plan ballon au ras du sol : il rebondit sur la basse (« mon ballon rebondit en rythme »)",
    scene: 7,
    mot: 6,
    etat: (c) => {
      const j = J(c);
      return { cam: surBalle(j, lisse(c.p), -4.2, 0.8, 3.4) };
    },
  },
  {
    id: "s08p3",
    titre: "Le joueur, trois quarts face : il hausse les sourcils, le ballon continue seul (« Je n'ai rien décidé »)",
    scene: 7,
    mot: 11,
    etat: (c) => {
      const j = J(c);
      const k = lisse(c.p);
      return { cam: face(j, mel(5.4, 4.6, k), 2.6, mel(-2.4, -1.8, k), tete(j), 42, 0.42) };
    },
  },
  {
    id: "s08p4",
    titre: "Vue aérienne : le terrain à gauche, la maison de fête qui pulse au loin (« C'est la basse »)",
    scene: 7,
    mot: 15,
    etat: (c) => {
      const k = lisse(c.p);
      return { cam: viser(mel3([-1, 13, 24], [-3, 11, 17], k), [-6, 3, -45], 64, 0.5, 0.45) };
    },
  },

  // ============ SCÈNE 9 — LE SOUFFLE : « HUSS. HUSS. HUSS. »
  {
    id: "s09p1",
    titre: "Au ras du sol, face à lui : jambes et ballon, HUSS",
    scene: 8,
    mot: 0,
    etat: (c) => {
      const j = J(c);
      return { cam: surBalle(j, lisse(c.p), -1.0, 0.6, 4.8) };
    },
  },
  {
    id: "s09p2",
    titre: "Profil du visage, en s'approchant : HUSS",
    scene: 8,
    mot: 1,
    etat: (c) => {
      const j = J(c);
      return { cam: visage(j, lisse(c.p), 6.0, 5.2, -3.2) };
    },
  },
  {
    id: "s09p3",
    titre: "Haut et derrière lui : son dribble, et le panier devant (HUSS)",
    scene: 8,
    mot: 2,
    etat: (c) => {
      const j = J(c);
      const k = lisse(c.p);
      return { cam: viser(devant(j.p, j.ry, [mel(0.6, 0.2, k), mel(5.0, 4.4, k), mel(-5.8, -5.0, k)]), [j.p[0], 3.2, j.p[2] - 6.5], 54, 0.5, 0.42) };
    },
  },

  // ============ SCÈNE 10 — LE CONTRASTE : « Eux, ils dansent. Moi, je transpire. Chacun son sport. »
  {
    id: "s10p1",
    titre: "Plan large sur la foule qui danse devant la maison de fête (« Eux, ils dansent »)",
    scene: 9,
    mot: 0,
    etat: (c) => {
      const k = lisse(c.p);
      return { cam: viser(mel3([0, 7.4, -42], [3, 6.6, -46], k), mel3([-1, 2.4, -70], [1, 2.6, -68], k), 58, 0.5, 0.42) };
    },
  },
  {
    id: "s10p2",
    titre: "Plan serré sur lui, concentré, en sueur (« Moi, je transpire »)",
    scene: 9,
    mot: 3,
    etat: (c) => {
      const j = J(c);
      return { cam: visage(j, lisse(c.p), 5.8, 4.9, 0.2) };
    },
  },
  {
    id: "s10p3",
    titre: "Derrière son épaule : lui au premier plan, la fête qui brille tout au bout (« Chacun son sport »)",
    scene: 9,
    mot: 6,
    etat: (c) => {
      const j = J(c);
      const k = lisse(c.p);
      return { cam: viser(devant(j.p, j.ry, [mel(-0.8, -0.4, k), mel(4.2, 3.8, k), mel(-7.4, -6.6, k)]), [mel(-11, -10, k), 3.0, -22], 60, 0.5, 0.5) };
    },
  },

  // ============ SCÈNE 11 — LE TIR : « Dernier tir de la soirée. Je respire. HUSS. HUSS. HUSS. Et… panier. »
  {
    id: "s11p1",
    titre: "De profil depuis le bord du terrain : il se prépare, le panier à gauche (« Dernier tir »)",
    scene: 10,
    mot: 0,
    etat: (c) => {
      const j = J(c);
      const k = lisse(c.p);
      return { cam: viser(mel3([-20.0, 2.6, 2.4], [-18.6, 2.8, 2.9], k), [j.p[0] - 0.8, 2.1, j.p[2] - 1.2], 54, 0.5, 0.42) };
    },
  },
  {
    id: "s11p2",
    titre: "Gros plan du visage : il respire, il vise (« Je respire »)",
    scene: 10,
    mot: 5,
    etat: (c) => {
      const j = J(c);
      return { cam: visage(j, lisse(c.p), 6.0, 5.0, 0.2) };
    },
  },
  {
    id: "s11p5",
    titre: "Derrière lui : HUSS, la détente, le tir ; la caméra suit le ballon jusqu'au panier (« Et… »)",
    scene: 10,
    mot: 9,
    etat: (c) => {
      const d = dn(c);
      const j = J(c);
      const w = lisse(entre(c.T, d.tir.lache - 0.05, d.tir.lache + 0.55));
      const pos = mel3(devant(j.p, j.ry, [-1.4, 3.0, -6.4]), devant(j.p, j.ry, [-1.0, 4.6, -5.0]), w);
      const sujet = mel3(mel3([j.p[0], 2.6, j.p[2]], [j.p[0], 3.4, j.p[2]], entre(c.T, d.tir.debut, d.tir.lache)), mel3(j.balle, [PANIER_A[0], PANIER_A[1] - 0.4, PANIER_A[2] + 1.2], 0.35), w);
      return { cam: viser(pos, sujet, mel(54, 50, w), 0.5, mel(0.42, 0.4, w)) };
    },
  },
  {
    id: "s11p6",
    titre: "Au panier : le ballon traverse le filet, le filet bouge (« panier »)",
    scene: 10,
    mot: 11,
    etat: (c) => {
      const d = dn(c);
      const j = J(c);
      const k = lisse(c.p);
      // la caméra suit le ballon qui retombe à travers le filet, puis rebondit
      const suit = lisse(entre(c.T, d.tir.panier + 0.25, d.tir.panier + 0.85));
      const sujet = mel3([PANIER_A[0], PANIER_A[1] - 0.5, PANIER_A[2]], [j.balle[0], Math.max(0.8, j.balle[1] + 0.3), j.balle[2]], suit);
      return { cam: viser(mel3([PANIER_A[0] + 3.2, 5.6, PANIER_A[2] + 4.4], [PANIER_A[0] + 2.8, 4.0, PANIER_A[2] + 4.2], k), sujet, 44, 0.5, 0.42) };
    },
  },

  // ============ SCÈNE 12 — LA FIN : « Personne n'a vu. Tant pis. Demain, ils referont la fête, et moi, je m'entraînerai encore. Et toi, plutôt fête ou entraînement ? HUSS. HUSS. HUSS. »
  {
    id: "s12p1",
    titre: "Au milieu des danseurs, face à la rue : personne ne regarde le terrain, tout au fond (« Personne n'a vu »)",
    scene: 11,
    mot: 0,
    etat: (c) => {
      const k = lisse(c.p);
      return { cam: viser(mel3(feteMonde([2, 6.6, 25]), feteMonde([-1, 6.0, 24]), k), mel3(feteMonde([-1, 2.6, 9]), feteMonde([1, 2.6, 9]), k), 56, 0.5, 0.42) };
    },
  },
  {
    id: "s12p3",
    titre: "Montée lente : la ville la nuit, le terrain éclairé et la fête au loin (« Demain, ils referont la fête »)",
    scene: 11,
    mot: 5,
    etat: (c) => {
      const k = freineDoux(c.p);
      return { cam: viser(mel3([-5, 7, 14], [-3, 24, 34], k), [-6, 2, -32], 62, 0.5, 0.44) };
    },
  },
  {
    id: "s12p4",
    titre: "3e personne : il dribble de nouveau, comme tous les soirs (« et moi, je m'entraînerai encore »)",
    scene: 11,
    mot: 10,
    etat: (c) => {
      const j = J(c);
      const k = lisse(c.p);
      return { cam: derriere(j, mel(6.6, 5.4, k), mel(3.6, 3.0, k), -1.0, [j.p[0], 2.5, j.p[2] - 5], 54, 0.5, 0.42) };
    },
  },
  {
    id: "s12p5",
    titre: "Face caméra : il pose la question (« Et toi, plutôt fête ou entraînement ? »)",
    scene: 11,
    mot: 15,
    etat: (c) => {
      const j = J(c);
      return { cam: visage(j, lisse(c.p), 6.0, 5.0, -0.2) };
    },
  },
  {
    id: "s12p6",
    titre: "Gros plan ballon : HUSS",
    scene: 11,
    mot: 22,
    etat: (c) => {
      const j = J(c);
      return { cam: surBalle(j, lisse(c.p), 4.4, 0.9, 3.2) };
    },
  },
  {
    id: "s12p7",
    titre: "Profil du visage : HUSS",
    scene: 11,
    mot: 23,
    etat: (c) => {
      const j = J(c);
      return { cam: visage(j, lisse(c.p), 6.0, 5.2, -3.2) };
    },
  },
  {
    id: "s12p8",
    titre: "Dernier plan : la caméra s'élève au-dessus du terrain, la ville endormie (HUSS)",
    scene: 11,
    mot: 24,
    etat: (c) => {
      const j = J(c);
      const k = freineDoux(c.p);
      return { cam: viser(mel3([j.p[0] + 2.0, 5.0, j.p[2] - 4.0], [-5, 36, 28], k), mel3(torse(j), [-6, 0, -20], k), 60, 0.5, 0.42) };
    },
  },
];

void DEPART;
void FETE;
