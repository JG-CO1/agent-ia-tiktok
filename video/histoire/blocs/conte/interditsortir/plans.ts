/**
 * « Interdit de sortir » — mise en scène plan par plan (récit : histoires/recits/interdit-sortir.json).
 * Chaque plan démarre sur un mot [scène, mot]. Caméra dynamique : contre-plongée sur la sirène, travellings, grues, orbites, zooms aux jumelles ;
 * la ville jumelle B est le miroir exact de A (z' = -66 - z) : les plans du twist reprennent en miroir les cadrages de la scène 1.
 */
import type { PlanGen } from "../../types";
import { D, P, entre, faceA, freine, lisse, mel, mel3, orb, plus, pos, rel, secousse, tete, trav, viser, type Cam, type V3 } from "../cam";
import type { EtatConte, FxConte } from "../lib";
import { couleursCiel, couleurBrume, phase } from "./ciel";
import { CUISINE, ECHELLE_X, PLAT_Y, SOMMET_ECHELLE, TOUR_INT, ZB } from "./monde";
import type { CtxGen } from "../../types";

const [X0] = TOUR_INT;
const [XC] = CUISINE;
const mirV = (p: V3): V3 => [p[0], p[1], ZB - p[2]];
const mirC = (c: Cam): Cam => ({ pos: mirV(c.pos), look: mirV(c.look), fov: c.fov });

type Lieu = "ext" | "tour" | "cuisine";
/** État d'un plan : caméra, brouillard et ciel qui dépendent de l'instant (le crépuscule descend du rouge au bleu nuit). */
function E(c: CtxGen, cam: Cam, o: { lieu?: Lieu; vig?: number; fx?: FxConte; fog?: [number, number] } = {}): EtatConte {
  const lieu = o.lieu ?? "ext";
  const fx: FxConte = { vignette: o.vig ?? 0.42, ...o.fx };
  if (lieu === "tour") return { cam, brouillard: ["#24130C", 12, 78], fx, ciel: "#24130C" };
  if (lieu === "cuisine") return { cam, brouillard: ["#241610", 16, 64], fx, ciel: "#241610" };
  const fog = o.fog ?? [46, 420];
  return { cam, brouillard: [couleurBrume(c.T), fog[0], fog[1]], fx, ciel: couleursCiel(phase(c.T)).h };
}
const SEPIA: FxConte = { teinte: ["#C8955A", 0.62] };
const sh = (T: number, t0: number, dur: number, amp: number): V3 => {
  const dt = T - t0;
  return dt > 0 && dt < dur ? secousse(T, amp * (1 - dt / dur)) : [0, 0, 0];
};

export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « Dans cette ville, personne n'a le droit de sortir depuis trois ans… »
  P("s01p1", "Décor : la ville-forteresse de pierre au coucher du soleil, la tour de la sirène (cornes, projecteurs) vue d'en bas | Personnages : habitants masqués qui courent sur la place | Action/expressions : la sirène hurle, les gens fuient vers leurs maisons | Caméra : contre-plongée sur la tour, poussée lente et basculement | Lumière : soleil rouge rasant, ombres longues, faisceaux rouge et blanc qui balaient | Effets : brume basse, ondes de la sirène, vignette | Son : sirène qui monte et descend, vent de vallée", 0, 0, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-8, 3.2, 19], [-15, 4.2, 14.5], k), mel3([-37, 19, 6], [-39, 24.2, 5], k), 54, 0.5, 0.45), { vig: 0.5 });
  }),
  P("s01p2", "Décor : la grande porte de fer de la muraille, scellée, avec le panneau « INTERDIT DE SORTIR — AIR TOXIQUE » | Personnages : habitants masqués qui passent en courant devant | Action/expressions : la peur, tout le monde rentre | Caméra : plan serré en travelling de côté sur le panneau | Lumière : orange rasant sur la pierre, ombre violette | Effets : vignette | Son : sirène, pas précipités", 0, 3, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-6, 4.0, 17], [-9.5, 4.6, 13.5], k), mel3([-15.5, 5.7, 1.8], [-13.2, 6.1, 2.4], k), 56, 0.5, 0.45), { vig: 0.5 });
  }),
  P("s01p3", "Décor : la place pavée de la ville, le puits, les maisons aux volets clos | Personnages : habitants masqués qui regagnent leurs maisons | Action/expressions : la place se vide | Caméra : grue ascendante au-dessus de la place | Lumière : soleil rouge, ombres très longues | Effets : brume basse | Son : sirène, pas qui s'éloignent", 0, 9, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-23, 2.3, 10], [-23, 15, 4], k), mel3([-22, 2.6, 34], [-22, 4, 26], k), mel(58, 66, k), 0.5, 0.45), { vig: 0.45 });
  }),
  P("s01p4", "Décor : la grande porte de la muraille, planches clouées en croix, deux chaînes et un cadenas | Personnages : aucun | Action/expressions : la porte est condamnée | Caméra : travelling avant jusqu'aux chaînes | Lumière : lumière rasante, ombre dans l'arche | Effets : vignette | Son : sirène, grincement de chaîne", 0, 12, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-22, 3.6, 31], [-22, 4.4, 14], k), mel3([-22, 4.6, 0.8], [-22, 3.8, 0.8], k), mel(56, 48, k), 0.5, 0.46), { vig: 0.55 });
  }),
  P("s01p5", "Décor : au pied de la muraille, le panneau et la porte derrière lui | Personnages : un homme masqué, inquiet | Action/expressions : il regarde vers l'extérieur, effrayé par « l'air empoisonné » | Caméra : gros plan sur son visage | Lumière : contre-jour orange | Effets : vignette | Son : sirène lointaine, vent", 0, 20, (c) => E(c, faceA(c, "rA", [4.6, 3.9], 2.5, 0.0, 36, 2.45, 0.38), { vig: 0.6 })),
  P("s01p6", "Décor : la muraille entière, ses tours et la tour de la sirène qui hurle | Personnages : gardes masqués avec lanternes sur le chemin de ronde | Action/expressions : les projecteurs balaient la muraille, la sirène couvre la ville | Caméra : recul large avec travelling latéral | Lumière : soleil rouge à l'horizon, faisceaux rouges et blancs | Effets : brume, ondes de la sirène | Son : sirène au maximum", 0, 24, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-13, 5, 23], [8, 10, 36], k), mel3([-27, 13, 2], [-22, 12, 2], k), 64, 0.5, 0.45), { vig: 0.45 });
  }),

  // ======================= SCÈNE 2 — « J'ai douze ans… Hier, j'ai grimpé en cachette sur la vieille tour… »
  P("s02p1", "Décor : une rue de la ville, la tour de la sirène et le soleil rouge derrière lui | Personnages : le narrateur, 12 ans, manteau rouge brique et bonnet gris | Action/expressions : il lève les yeux, inquiet | Caméra : gros plan de visage de face | Lumière : contre-jour rouge | Effets : vignette | Son : vent, sirène qui s'éteint", 1, 0, (c) => E(c, faceA(c, "n1", [5.6, 4.8], 2.0, 0.3, 34, 2.0, 0.4), { vig: 0.6 })),
  P("s02p2", "Décor : la ville enfermée vue d'en haut, murs, toits serrés, rien d'autre | Personnages : le narrateur tout petit au milieu des rues | Action/expressions : « jamais vu autre chose que ces rues » | Caméra : grue qui s'élève au-dessus des toits | Lumière : soleil bas, ombres longues | Effets : brume basse | Son : vent de vallée", 1, 6, (c) => {
    const k = freine(c.p);
    return E(c, viser(mel3([-14, 2.8, 13], [-4, 40, 44], k), mel3([-20, 2.4, 14], [-14, 5, 7], k), mel(52, 60, k), 0.5, 0.45), { vig: 0.45 });
  }),
  P("s02p3", "Décor : la vieille tour de pierre au bord de la muraille, son petit porche sombre | Personnages : le narrateur qui se faufile | Action/expressions : il regarde derrière lui puis entre en cachette dans la tour | Caméra : suivi par derrière | Lumière : soleil bas, porche noir | Effets : vignette | Son : pas rapides, vent", 1, 13, (c) => {
    const k = lisse(c.p);
    const p = plus(pos(c, "n2"), [0, 1.5, 0]);
    return E(c, viser(mel3([4.6, 2.3, 17.5], [2.6, 2.2, 12.5], k), mel3(p, [0, 2.3, 4.6], 0.35), 54, 0.5, 0.45), { vig: 0.5 });
  }),
  P("s02p4", "Décor : l'intérieur de la vieille tour, escalier en colimaçon de bois, torches, fentes de lumière orange | Personnages : le narrateur qui monte | Action/expressions : il grimpe vite, sans bruit | Caméra : contre-plongée verticale au centre de la cage, elle s'élève avec lui | Lumière : torches, ombres tournantes | Effets : vignette | Son : pas sur le bois, écho", 1, 15, (c) => {
    const p = pos(c, "nT");
    const k = lisse(c.p);
    return E(c, viser([X0 + 0.5, Math.max(0.7, p[1] + mel(-2.6, 0.2, k)), 0.6], plus(p, [0, 2.3, 0]), mel(70, 62, k), 0.5, 0.42), { lieu: "tour", vig: 0.6 });
  }),
  P("s02p5", "Décor : le haut de la cage d'escalier, l'échelle et la lucarne ouverte sur le ciel orange | Personnages : le narrateur qui grimpe à l'échelle | Action/expressions : il monte vers la lumière | Caméra : contre-plongée vers la trappe | Lumière : rayon orangé qui tombe de la trappe | Effets : brume de poussière | Son : pas sur les barreaux, vent qui s'engouffre", 1, 18, (c) => {
    const p = pos(c, "nE");
    const k = lisse(c.p);
    return E(c, viser([X0 + 1.4, p[1] - mel(2.2, 0.4, k), 1.9], plus(p, [0, 1.8, 0]), 62, 0.5, 0.42), { lieu: "tour", vig: 0.55 });
  }),
  P("s02p6", "Décor : la plateforme de la vieille tour, le soleil rouge à l'horizon | Personnages : le narrateur et les jumelles de cuivre de son grand-père | Action/expressions : il tient les jumelles contre sa poitrine | Caméra : gros plan sur les jumelles de cuivre, orbite lente | Lumière : éclats rouges sur le cuivre | Effets : vignette | Son : vent, cœur", 1, 22, (c) => {
    const k = lisse(c.p);
    const b: V3 = [0, PLAT_Y + 1.52, -6.78];
    return E(c, viser(mel3([2.4, PLAT_Y + 2.7, -10.6], [1.4, PLAT_Y + 2.1, -9.2], k), plus(b, [0, 0.3, 0]), mel(36, 32, k), 0.5, 0.45), { vig: 0.5 });
  }),

  // ======================= SCÈNE 3 — « De l'autre côté de la vallée, il y avait une ville… »
  P("s03p1", "Décor : du haut de la tour, la vallée de brume violette et, au loin, une autre ville au coucher du soleil | Personnages : le narrateur de dos, jumelles aux yeux | Action/expressions : il scrute l'horizon | Caméra : panorama large qui se dégage derrière lui | Lumière : soleil rouge bas à gauche, brume rose | Effets : brume volumétrique | Son : vent de vallée, écho", 2, 0, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([1.6, 28.9, -0.6], [0.9, 28.6, -2.2], k), mel3([-4, 8, -72], [-2, 10, -80], k), mel(64, 56, k), 0.5, 0.42), { vig: 0.4 });
  }),
  P("s03p2", "Décor : à travers les jumelles, une ville de pierre identique éclairée par le couchant | Personnages : aucun | Action/expressions : la ville apparaît | Caméra : zoom lent dans la lunette | Lumière : orange rasant | Effets : forte vignette (lunette) | Son : respiration, nappe qui monte", 2, 6, (c) => {
    const k = lisse(c.p);
    return E(c, viser([-1.2, 27.5, -7.0], mel3([-13, 8, -78], [-22, 11, -70], k), mel(44, 22, k), 0.5, 0.45), { vig: 0.85 });
  }),
  P("s03p3", "Décor : les deux villes face à face de part et d'autre de la vallée, vues d'en haut | Personnages : aucun | Action/expressions : « exactement la même » : la symétrie saute aux yeux | Caméra : grue qui descend au centre de la vallée, axe vertical | Lumière : couchant rouge | Effets : brume | Son : nappe qui s'ouvre", 2, 11, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([0, 108, -20], [0, 74, -26], k), mel3([0, 0, -37], [0, 6, -34], k), 64, 0.5, 0.5), { vig: 0.4, fog: [160, 700] });
  }),
  P("s03p4", "Décor : les toits de la ville et ceux de la ville jumelle | Personnages : aucun | Action/expressions : mêmes toits | Caméra : panoramique rapide depuis les toits de A jusqu'à ceux de B | Lumière : tuiles rouges au couchant | Effets : flou de vitesse (mouvement) | Son : whoosh léger", 2, 15, (c) => {
    const k = lisse(c.p);
    const a = mel(Math.PI * 0.82, 0.04, k);
    const o: V3 = [-3.2, 30.6, -3.0];
    return E(c, viser(o, [o[0] + Math.sin(a) * 50, o[1] - 20, o[2] - Math.cos(a) * 50], 60, 0.5, 0.45), { vig: 0.45 });
  }),
  P("s03p5", "Décor : la muraille crénelée de la ville d'en face, sa grande porte, ses tours | Personnages : aucun | Action/expressions : même muraille, même tour | Caméra : travelling latéral le long de la muraille puis relevé vers la tour jumelle | Lumière : orange rasant, ombres longues | Effets : brume | Son : nappe tendue", 2, 17, (c) => {
    const k = lisse(c.p);
    const kk = lisse(entre(c.p, 0.45, 1));
    return E(c, viser(mel3([-46, 21, -26], [-4, 24, -30], k), mel3([-30, 8, -66], [0, mel(10, 26, kk), -64], k), mel(54, 40, k), 0.5, 0.45), { vig: 0.5 });
  }),
  P("s03p6", "Décor : la plateforme de la tour d'en face, créneaux, ciel rouge | Personnages : une silhouette qui apparaît sur la tour | Action/expressions : quelqu'un se tient là | Caméra : zoom vers le sommet de la tour jumelle | Lumière : contre-jour rouge | Effets : vignette | Son : battement de cœur", 2, 21, (c) => {
    const k = lisse(c.p);
    return E(c, viser([0.2, 27.6, -7.0], mel3([0, 26.8, -63], [0, 27.3, -60], k), mel(22, 13, k), 0.5, 0.45), { vig: 0.6 });
  }),
  P("s03p7", "Décor : la tour d'en face, le ciel rouge | Personnages : le garçon d'en face, manteau vert, bonnet gris, jumelles braquées | Action/expressions : il pointe ses jumelles droit sur nous | Caméra : gros plan sur lui, la lunette luit | Lumière : éclat sur le cuivre | Effets : vignette | Son : choc sourd, cœur", 2, 25, (c) => {
    const k = lisse(c.p);
    return E(c, viser([0.2, 27.5, -7.0], mel3([0, 27.55, -60], [0, 27.5, -60], k), mel(7, 5.4, k), 0.5, 0.42), { vig: 0.6 });
  }),
  P("s03p8", "Décor : la vallée entre les deux tours, vue de côté | Personnages : les deux garçons face à face avec leurs jumelles | Action/expressions : les deux regards se croisent | Caméra : plan symétrique au milieu de la vallée | Lumière : couchant rouge | Effets : brume | Son : silence, cœur", 2, 29, (c) => {
    const k = lisse(c.p);
    return E(c, viser([mel(-10.5, -9.5, k), 27.5, -6.0], plus(pos(c, "n3"), [0, 1.9, 0]), mel(26, 23, k), 0.5, 0.42), { vig: 0.55 });
  }),

  // ======================= SCÈNE 4 — « Un garçon de mon âge… la pancarte »
  P("s04p1", "Décor : la tour d'en face, vue à travers la lunette | Personnages : le garçon d'en face, jumeau du narrateur (manteau vert) | Action/expressions : il baisse ses jumelles, son visage apparaît | Caméra : zoom serré dans la lunette | Lumière : crépuscule rose | Effets : vignette de lunette | Son : souffle", 3, 0, (c) => {
    const k = lisse(c.p);
    return E(c, viser([0.2, 27.5, -7.0], [0, 27.1, -60], mel(8.5, 7.2, k), 0.5, 0.46), { vig: 0.8 });
  }),
  P("s04p2", "Décor : la tour d'en face | Personnages : le garçon d'en face | Action/expressions : il fait de grands signes d'une main, puis se baisse | Caméra : plan moyen au zoom | Lumière : crépuscule violet | Effets : vignette | Son : vent", 3, 5, (c) => E(c, viser([0.2, 27.6, -7.0], [0, 27.4, -60], mel(13, 11, lisse(c.p)), 0.5, 0.45), { vig: 0.65 })),
  P("s04p3", "Décor : la tour d'en face | Personnages : le garçon d'en face | Action/expressions : il lève une pancarte au-dessus de sa tête | Caméra : plan serré qui monte avec la pancarte | Lumière : crépuscule | Effets : vignette | Son : choc sourd à l'apparition", 3, 12, (c) => {
    const k = lisse(c.p);
    return E(c, viser([0.2, 27.6, -7.0], mel3([0, 27.6, -60], [0, 28.3, -59.7], k), mel(12, 11, k), 0.5, 0.45), { vig: 0.6 });
  }),
  P("s04p4", "Décor : la pancarte « DANGER : NE SORTEZ PAS » tenue haut | Personnages : le garçon d'en face | Action/expressions : le message est lisible | Caméra : zoom sur la pancarte, bien lisible | Lumière : crépuscule | Effets : vignette douce | Son : drone grave, cœur", 3, 16, (c) => {
    const k = lisse(c.p);
    return E(c, viser([0.2, 28.4, -7.0], [0, 28.3, -59.7], mel(11, 8.4, k), 0.5, 0.3), { vig: 0.45, fx: { flash: ["#FFFFFF", c.t < 0.1 ? 0.25 * (1 - c.t / 0.1) : 0] } });
  }),
  P("s04p5", "Décor : la plateforme de la vieille tour, le crépuscule | Personnages : le narrateur, stupéfait | Action/expressions : il ne comprend plus rien | Caméra : gros plan de face, poussée lente | Lumière : ciel rose et violet | Effets : vignette | Son : cœur, silence", 3, 23, (c) => E(c, faceA(c, "n3", [5.4, 4.6], 2.2, 0.3, 34, 2.1, 0.4), { vig: 0.62 })),

  // ======================= SCÈNE 5 — « J'ai couru interroger mon père… »
  P("s05p1", "Décor : les rues de la ville à la tombée de la nuit | Personnages : le narrateur qui court | Action/expressions : il fonce vers sa maison, affolé | Caméra : travelling en avant, bas, face à lui | Lumière : fin du crépuscule, lueurs aux fenêtres | Effets : vignette | Son : pas qui claquent, souffle", 4, 0, (c) => {
    const p = pos(c, "n5");
    return E(c, viser([p[0] - 5.4, 1.6, p[2] + 3.9], plus(p, [0, 1.7, 0]), 56, 0.5, 0.42), { vig: 0.55 });
  }),
  P("s05p2", "Décor : la salle de la maison, table, cheminée, mur du fond avec horloge et calendrier | Personnages : le père assis, le narrateur qui entre | Action/expressions : le narrateur surgit | Caméra : plan large depuis le coin de la pièce | Lumière : feu de cheminée, couchant à la fenêtre | Effets : aucun | Son : porte, cœur", 4, 4, (c) => {
    const k = lisse(c.p);
    return E(c, viser([XC + mel(4.4, 4.2, k), 2.8, 3.2], mel3([XC - 0.2, 1.8, -0.9], [XC - 0.3, 1.8, -0.5], k), 64, 0.5, 0.45), { lieu: "cuisine", vig: 0.5 });
  }),
  P("s05p3", "Décor : la salle, la photo au mur derrière lui | Personnages : le père, barbe, manteau bleu, regard fatigué | Action/expressions : il baisse les yeux | Caméra : gros plan sur son visage, poussée lente | Lumière : feu chaud sur le côté | Effets : vignette | Son : souffle, tic-tac", 4, 5, (c) => E(c, faceA(c, "pere", [4.2, 3.6], 3.4, 0.3, 34, 2.45, 0.4), { lieu: "cuisine", vig: 0.6 })),
  P("s05p4", "Décor : la photo encadrée du feu d'artifice sur le mur | Personnages : aucun | Action/expressions : « il y a trois ans » : le souvenir | Caméra : poussée vers la photo | Lumière : lueur de bougie | Effets : vignette | Son : drone triste", 4, 12, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([XC + 0.6, 3.0, 1.2], [XC + 1.0, 2.9, -2.4], k), [XC + 1.1, 2.85, -4.85], mel(42, 30, k), 0.5, 0.45), { lieu: "cuisine", vig: 0.55 });
  }),
  P("s05p5", "Décor : souvenir : la place en fête la nuit, guirlandes de lanternes, la muraille | Personnages : la foule sans masque qui danse | Action/expressions : une fusée monte vers le ciel | Caméra : contre-plongée suivant la fusée | Lumière : lanternes dorées, ciel nocturne | Effets : teinte sépia, vignette | Son : musique de fête assourdie, sifflement de la fusée", 4, 17, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-19, 1.8, 24], [-17, 3.2, 21], k), mel3([-13, 13, 4], [-10, 19, 0], k), 62, 0.5, 0.45), { vig: 0.55, fx: SEPIA });
  }),
  P("s05p6", "Décor : souvenir : la muraille illuminée par l'explosion | Personnages : la foule qui s'enfuit, mains sur la tête | Action/expressions : le feu d'artifice explose tout près de la muraille | Caméra : plan large qui tremble, flash blanc | Lumière : éclair blanc et orange | Effets : flash, secousse, sépia | Son : explosion, cris étouffés", 4, 21, (c) => {
    const ev = D(c).ev;
    const dt = c.T - ev.boum;
    const k = lisse(c.p);
    const s = sh(c.T, ev.boum, 0.7, 0.35);
    return E(c, viser(plus(mel3([-17, 2.2, 22], [-19, 3.4, 26], k), s), mel3([-10, 17, 0], [-11, 12, 2], k), 66, 0.5, 0.45), { vig: 0.5, fx: { ...SEPIA, flash: ["#FFF4D8", dt > -0.02 && dt < 0.5 ? 0.85 * Math.exp(-Math.max(0, dt) * 6) : 0] } });
  }),
  P("s05p7", "Décor : souvenir : la vallée et les deux villes vues du haut de la muraille | Personnages : aucun | Action/expressions : les lumières des deux villes s'éteignent d'effroi | Caméra : plongée large au-dessus de la vallée | Lumière : braises du feu d'artifice | Effets : sépia, brume | Son : sirènes qui naissent, nappe sombre", 4, 26, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([14, 70, 46], [10, 80, 56], k), mel3([0, 4, -60], [0, 4, -52], k), 62, 0.5, 0.45), { vig: 0.5, fx: SEPIA, fog: [140, 900] });
  }),

  // ======================= SCÈNE 6 — « Là-bas aussi, ils ont cru à une attaque… »
  P("s06p1", "Décor : la grande porte de la ville jumelle, planches, chaînes, panneau identique | Personnages : habitants masqués qui courent (les mêmes) | Action/expressions : là-bas aussi, tout est scellé | Caméra : même travelling qu'au début, en miroir | Lumière : nuit bleue, quelques fenêtres | Effets : vignette | Son : sirène lointaine", 5, 0, (c) => {
    const k = lisse(c.p);
    return E(c, mirC(viser(mel3([-22, 3.6, 31], [-22, 4.4, 14], k), mel3([-22, 4.6, 0.8], [-22, 3.8, 0.8], k), mel(56, 48, k), 0.5, 0.46)), { vig: 0.55 });
  }),
  P("s06p2", "Décor : la tour de la sirène de la ville jumelle, identique à la première | Personnages : habitants masqués qui fuient | Action/expressions : la sirène jumelle hurle, mêmes faisceaux | Caméra : même contre-plongée qu'à l'ouverture, en miroir | Lumière : rouge de la sirène sur la nuit bleue | Effets : ondes de la sirène | Son : deux sirènes à l'unisson", 5, 2, (c) => {
    const k = lisse(c.p);
    return E(c, mirC(viser(mel3([-8, 3.2, 19], [-15, 4.2, 14.5], k), mel3([-37, 19, 6], [-39, 24.2, 5], k), 54, 0.5, 0.45)), { vig: 0.5 });
  }),
  P("s06p3", "Décor : les deux villes vues de très haut, l'une en face de l'autre | Personnages : aucun | Action/expressions : le même soir, toutes les lumières s'allument en miroir | Caméra : descente verticale au centre de la vallée | Lumière : fenêtres et lanternes dorées dans la nuit bleue | Effets : fondu de lumière | Son : nappe qui s'ouvre", 5, 8, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([0, 150, -22], [0, 104, -26], k), [0, 0, -37], 64, 0.5, 0.5), { vig: 0.35, fog: [200, 900] });
  }),
  P("s06p4", "Décor : les deux murailles face à face, scellées, de part et d'autre de la vallée | Personnages : aucun | Action/expressions : deux villes enfermées par peur | Caméra : plan latéral parfaitement symétrique | Lumière : lumières dorées en miroir | Effets : brume bleue | Son : silence net", 5, 11, (c) => {
    const k = lisse(c.p);
    return E(c, viser([mel(104, 92, k), 40, -33], [0, 9, -33], 72, 0.5, 0.45), { vig: 0.4, fog: [160, 800] });
  }),
  P("s06p5", "Décor : les chemins de ronde des deux murailles | Personnages : un garde masqué sur chaque muraille, lanterne à la main | Action/expressions : chacun guette l'autre par peur | Caméra : balayage rapide du garde de A au garde de B | Lumière : lanternes dorées | Effets : brume | Son : whoosh, cœur", 5, 15, (c) => {
    const k = lisse(c.p);
    const gA: V3 = [9, 12.6, -1.4];
    const gB: V3 = [9, 12.6, ZB + 1.4];
    return E(c, viser([22, 16, -33], mel3(gA, gB, lisse(entre(c.p, 0.12, 0.88))), mel(40, 36, k), 0.5, 0.45), { vig: 0.5 });
  }),
  P("s06p6", "Décor : vue depuis la tour jumelle : notre tour et ses projecteurs rouges qui balayent | Personnages : le narrateur (qui, pour l'autre, est « le danger ») | Action/expressions : de là-bas, c'est nous qui faisons peur | Caméra : zoom lent vers lui | Lumière : rouge menaçant des sirènes | Effets : vignette de lunette | Son : sirènes, drone grave", 5, 23, (c) => {
    const k = lisse(c.p);
    return E(c, viser([0.5, 28.5, -58.0], mel3([0, 27.3, -6.0], [0, 27.0, -6.0], k), mel(22, 11, k), 0.5, 0.42), { vig: 0.7 });
  }),
  P("s06p7", "Décor : la plateforme de la vieille tour, nuit bleue, lumières de la ville | Personnages : le narrateur, bonnet gris | Action/expressions : il comprend : le danger, c'est nous | Caméra : gros plan de face | Lumière : bleu nuit, reflets dorés | Effets : vignette | Son : silence puis cœur", 5, 26, (c) => E(c, faceA(c, "n3", [5.2, 4.4], 2.2, -0.3, 34, 2.1, 0.4), { vig: 0.62 })),
  P("s06p8", "Décor : les deux tours face à face de part et d'autre de la vallée allumée, la grande porte de A qui s'ouvre sur la lumière | Personnages : les deux garçons, même silhouette, un manteau rouge, un vert | Action/expressions : « Tu ouvrirais la porte le premier ? » : la porte s'ouvre d'un côté | Caméra : lente grue au-dessus de la vallée, composition symétrique | Lumière : lumière dorée qui jaillit de la porte | Effets : fondu au noir sur la dernière parole | Son : nappe finale ouverte, grincement de la porte", 5, 27, (c) => {
    const d = D(c);
    const k = lisse(c.p);
    const noir = lisse(entre(c.T, d.finNarration + 0.05, d.finNarration + 0.55));
    const kk = lisse(entre(c.T, 56.2, 57.8));
    return E(c, viser(mel3([0, 70, -6], [-20, 13, -25], kk), mel3([0, 12, -38], [-22, 6.5, -1], kk), mel(60, 46, kk), 0.5, 0.44), { vig: 0.5, fog: [140, 800], fx: { noir } });
  }),
];
void tete;
void trav;
void orb;
void rel;
void ECHELLE_X;
void SOMMET_ECHELLE;
