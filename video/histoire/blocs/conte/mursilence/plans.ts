/**
 * « Mur du silence » — mise en scène plan par plan (récit : histoires/recits/mur-silence.json). Chaque plan démarre sur un mot
 * [scène, mot] (scène 1 = indice 0). Trois lieux : le salon (mur, table, canapé caché), la chambre d'Adam, la rue.
 * Trois images-clés ont leur plan : la brique qui tombe (s05p3), le mur qui s'effondre (s06p1), maman sur son canapé (s06p2, s06p3).
 */
import type { PlanGen } from "../../types";
import { D, P, entre, faceA, lisse, mel, mel3, orb, plus, pos, rel, trav, viser, type V3 } from "../cam";
import type { EtatConte } from "../lib";
import { CHAMBRE, RUE, coeur } from "./monde";
import { MAMAN_P } from "./histoire";

const ch = (x: number, y: number, z: number): V3 => [CHAMBRE[0] + x, y, CHAMBRE[2] + z];
const ru = (x: number, y: number, z: number): V3 => [RUE[0] + x, y, RUE[2] + z];

type Ev = Record<string, number>;
/** Brouillard et ciel de l'intérieur selon l'heure : jour pâle, nuit bleue, or après l'effondrement. */
function ambiance(T: number, ev: Ev): { fog: [string, number, number]; ciel: string } {
  const nuit = lisse(entre(T, ev.nuit0, ev.nuit1));
  const or = lisse(entre(T, ev.effondre + 0.15, ev.effondre + 2.4));
  const m = (a: [number, number, number], b: [number, number, number], k: number): [number, number, number] => [mel(a[0], b[0], k), mel(a[1], b[1], k), mel(a[2], b[2], k)];
  const c = m(m([176, 188, 208], [10, 16, 44], nuit), [226, 186, 124], or);
  const hex = "#" + c.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
  return { fog: [hex, mel(mel(9, 7, nuit), 14, or), mel(mel(40, 36, nuit), 50, or)], ciel: hex };
}
const FOG_RUE: [string, number, number] = ["#BCD3EA", 70, 300];
const FOG_CH: [string, number, number] = ["#B4C6E0", 10, 40];
const flash = (T: number, t0: number, amp = 0.8, av = 0.06, ap = 0.45) => amp * entre(T, t0 - av, t0 + 0.03) * (1 - entre(T, t0 + 0.08, t0 + ap));
/** Intérieur : caméra + brouillard du moment + vignette + éclat chaud à chaque battement du mur. */
function S(c: { T: number; data: unknown }, cam: ReturnType<typeof viser>, vignette = 0.4, extra: Partial<EtatConte> = {}): EtatConte {
  const ev = (c.data as { ev: Ev }).ev;
  const a = ambiance(c.T, ev);
  const k = c.T >= ev.bat0 && c.T < ev.effondre ? coeur(c.T, ev.bat0) : 0;
  return { cam, brouillard: a.fog, ciel: a.ciel, fx: { vignette, ...(k > 0.02 ? { flash: ["#FFB347", 0.1 * Math.min(1, k)] as [string, number] } : {}) }, ...extra };
}
const NOIR = (c: { T: number }, d: { finNarration: number }) => lisse(entre(c.T, d.finNarration - 0.02, d.finNarration + 0.14));
/** Titre normalisé d'un plan (sert au storyboard livré). */
const t = (decor: string, perso: string, action: string, camera: string, lumiere: string, effets: string, son: string) => `Décor : ${decor} | Personnages : ${perso} | Action/expressions : ${action} | Caméra : ${camera} | Lumière : ${lumiere} | Effets : ${effets} | Son : ${son}`;
/** Tête d'un personnage debout (centre). */
const tete = (c: Parameters<typeof rel>[0], id: string, h = 2.35): V3 => rel(c, id, [0, h, 0]);

export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « Dans cette ville, un mur grandit chaque fois que deux personnes cessent de se parler. Chez nous, il traverse le salon depuis trois ans, depuis la disparition de maman. »
  P("s01p1", t("salon-cuisine, un mur de briques grises à joints visibles traverse la pièce d'un bout à l'autre", "—", "les briques se posent d'elles-mêmes, en accéléré, en vague qui court du premier plan vers le fond", "travelling latéral rapide le long de la face est du mur, légère plongée, objectif large", "lampes chaudes ambre, rais de lumière froide des fenêtres, poussière en suspension", "vignette, brouillard bleuté", "cliquetis sourds des briques qui se posent, tic-tac"), 0, 0, (c) => {
    const p = c.p;
    return S(c, viser(mel3([3.3, 2.1, 6.0], [3.0, 2.7, 2.4], p), mel3([0.9, 2.4, 2.6], [0.9, 2.9, -0.8], p), mel(60, 56, p), 0.5, 0.42), 0.45);
  }),
  P("s01p2", t("rue du quartier, maisons alignées sous un ciel pâle ; de grands murs gris dépassent des toits au loin", "—", "rien ne bouge dans la rue ; des murs immenses se dressent derrière les maisons", "plan large bas qui monte lentement vers les murs", "jour froid", "brume légère", "vent léger, ville lointaine"), 0, 6, (c) => {
    const k = lisse(c.p);
    return { cam: viser(mel3(ru(3.2, 1.7, 12), ru(2.6, 4.8, 11), k), ru(-2, mel(18, 26, k), -42), mel(66, 60, k), 0.5, 0.4), brouillard: FOG_RUE, ciel: "#BCD3EA", fx: { vignette: 0.3 } };
  }),
  P("s01p3", t("trottoir de la rue, mini-mur de briques qui pousse entre deux passants", "un homme en veste orange et une femme en manteau rouge, face à face puis dos à dos", "ils se disputaient en silence : ils cessent de se parler, se tournent le dos, un mur pousse entre eux brique par brique", "plan oblique bas, la caméra monte lentement avec le mur", "jour froid, ombres courtes", "brume, vignette", "cliquetis des briques, silence soudain"), 0, 11, (c) => {
    const k = lisse(c.p);
    return { cam: viser(mel3(ru(4.6, 1.5, 0.4), ru(3.6, 1.8, -0.6), k), ru(-0.3, mel(2.0, 2.9, k), -4.7), mel(56, 50, k), 0.5, 0.4), brouillard: FOG_RUE, ciel: "#BCD3EA", fx: { vignette: 0.4 } };
  }),
  P("s01p4", t("salon-cuisine coupé en deux par le mur : cuisine à gauche, escalier à droite, table traversée par les briques", "papa et Adam assis aux deux bouts de la table, Lina contre le mur", "le mur domine la pièce, la famille vit de chaque côté", "plan large en plongée depuis le coin du fond, léger travelling latéral", "lampes ambre sur la table, lumière froide des fenêtres", "brouillard, vignette", "tic-tac de l'horloge"), 0, 15, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([7.4, 4.5, -6.3], [6.2, 4.0, -5.2], k), [-1.2, 2.0, 2.4], mel(64, 58, k), 0.5, 0.42), 0.4);
  }),
  P("s01p5", t("chambre d'Adam, le mur de briques perce le plafond ; sur le mur d'en face, le dessin d'enfant de la famille à quatre", "Adam (sweat bleu marine), de dos, immobile devant le dessin", "il regarde le dessin « MA FAMILLE » où maman est encore dessinée", "plan moyen en travelling avant lent, la caméra longe le mur de briques", "jour pâle par la fenêtre, lampe de bureau chaude", "poussière, vignette", "tic-tac, silence"), 0, 21, (c) => {
    const k = lisse(c.p);
    return { cam: viser(mel3(ch(-0.6, 1.8, 4.7), ch(0.4, 2.8, 4.9), k), mel3(ch(2.2, 6.2, 0.4), ch(-5.6, 3.1, 1.9), lisse(entre(c.p, 0.2, 0.95))), mel(70, 58, k), 0.5, 0.4), brouillard: FOG_CH, ciel: "#B4C6E0", fx: { vignette: 0.45 } };
  }),
  P("s01p6", t("étagère du salon : la photo encadrée de maman (cheveux longs bruns, cardigan vert, sourire doux)", "maman, en photo seulement", "la photo trône sur l'étagère, personne ne la regarde plus", "gros plan en poussée lente vers le cadre", "lueur chaude sur la photo", "poussière, vignette", "tic-tac, nappe triste"), 0, 24, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([-2.2, 3.95, -2.6], [-3.35, 3.85, -4.1], k), [-3.8, 3.55, -6.6], mel(40, 32, k), 0.5, 0.33), 0.5);
  }),

  // ======================= SCÈNE 2 — « Papa et moi, on ne se parle plus. Alors le mur monte, brique après brique, et il sépare déjà la cuisine de l'escalier. Ma petite sœur Lina n'arrête pas de le toucher. »
  P("s02p1", t("table du petit-déjeuner coupée par le mur de briques ; plats, tasses, pain", "papa (pull gris, barbe) à gauche et Adam (sweat bleu marine) à droite, chacun d'un côté du mur, sans un mot", "ils déjeunent face à face, têtes basses, sans se regarder", "plan large en plongée depuis le coin haut de l'escalier, léger rapprochement", "suspensions ambre, rais froids", "vignette", "tic-tac, couverts étouffés"), 1, 0, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([8.3, 4.5, 6.3], [6.9, 3.9, 5.7], k), [0.3, 1.9, 3.4], mel(52, 46, k), 0.5, 0.42), 0.4);
  }),
  P("s02p2", t("table, côté est : assiette, bol, verre ; le mur à l'arrière-plan", "Adam, gros plan : regard dans son bol", "il ne dit rien, les yeux tristes, la mâchoire serrée", "gros plan de face, poussée très lente", "lampe ambre sur le visage, joue froide", "vignette", "tic-tac"), 1, 7, (c) => {
    const k = lisse(c.p);
    return S(c, viser(rel(c, "adam", [mel(0, 0.1, k), 2.4, mel(3.0, 2.7, k)]), rel(c, "adam", [0, 2.15, 0]), mel(46, 42, k), 0.5, 0.36), 0.5);
  }),
  P("s02p3", t("table, assiettes de chaque côté, le mur de briques grises qui s'élève entre elles", "—", "les briques tombent une à une sur le faîte du mur, entre les assiettes", "plan en plongée depuis l'angle de la cuisine, léger glissement vers le mur", "ambre sur les assiettes, ombres dures des briques", "poussière, vignette", "cliquetis de briques, tic-tac"), 1, 11, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([-5.9, 3.4, 6.3], [-4.9, 3.0, 5.6], k), [-0.2, 2.3, 3.6], mel(52, 46, k), 0.5, 0.42), 0.45);
  }),
  P("s02p4", t("cuisine : plan de travail, évier, hotte, suspension ambre", "—", "au premier plan le mur monte déjà devant la cuisine", "plan moyen, panoramique du mur vers la cuisine", "ambre chaud, ombre froide du mur", "vignette", "tic-tac"), 1, 15, (c) => {
    const k = lisse(c.p);
    return S(c, viser([-5.0, 2.9, 6.2], mel3([-0.9, 3.2, 4.4], [-9.2, 2.5, 2.6], lisse(entre(c.p, 0.1, 0.95))), 56, 0.5, 0.42), 0.4);
  }),
  P("s02p5", t("escalier de bois contre le mur est ; le mur de briques longe les marches", "—", "le mur borde l'escalier : plus personne ne peut passer", "plan moyen en travelling latéral lent", "lampadaire doré, ombre froide du mur", "vignette", "tic-tac"), 1, 21, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([3.0, 3.2, -3.6], [3.8, 3.0, -2.6], k), [8.6, 2.2, 1.8], 58, 0.5, 0.42), 0.4);
  }),
  P("s02p6", t("pied du mur, côté escalier", "Lina (7 ans, salopette jaune, couettes), son lapin en peluche à la main", "elle arrive vers le mur et pose la main sur les briques", "plan moyen, la caméra recule à hauteur d'enfant", "lueur ambre dans le dos, ombre froide", "vignette", "pas légers, tic-tac"), 1, 23, (c) => {
    const k = lisse(c.p);
    return S(c, viser(plus(pos(c, "lina"), [mel(2.3, 1.8, k), 1.6, mel(3.0, 2.5, k)]), plus(pos(c, "lina"), [-0.2, 1.5, 0]), mel(44, 40, k), 0.5, 0.4), 0.4);
  }),
  P("s02p7", t("mur de briques grises, face est", "Lina, la main à plat sur les briques, qui longe le mur", "elle le touche sans cesse, du bout des doigts, comme pour l'écouter", "gros plan latéral, travelling qui suit la main", "lumière rasante froide", "vignette", "frottement doux des doigts sur la brique"), 1, 27, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3(plus(pos(c, "lina"), [2.0, 1.6, 2.3]), plus(pos(c, "lina"), [1.7, 1.6, 1.9]), k), plus(pos(c, "lina"), [-0.7, 1.4, 0.3]), 38, 0.5, 0.36), 0.45);
  }),

  // ======================= SCÈNE 3 — « Un soir, elle a collé son oreille contre les briques. « Quelqu'un chuchote », a-t-elle dit. J'ai écouté, moi aussi : un battement, très lent. »
  P("s03p1", t("salon de nuit : le mur massif, lampes ambre, fenêtres bleu nuit", "Lina au pied du mur", "la maison est silencieuse", "plan large en plongée depuis le coin du fond, léger rapprochement", "ambre des suspensions contre bleu nuit", "brouillard bleuté, vignette", "silence habité, tic-tac"), 2, 0, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([7.8, 4.7, -6.2], [6.6, 4.2, -5.0], k), [-0.8, 2.0, 1.6], mel(62, 58, k), 0.5, 0.42), 0.5);
  }),
  P("s03p2", t("mur de briques, face est, de très près", "Lina, l'oreille collée contre les briques", "elle ferme les yeux et écoute le mur", "gros plan de profil, poussée lente", "lumière ambre rasante, joue froide", "poussière, vignette", "silence, murmure lointain"), 2, 4, (c) => {
    const k = lisse(c.p);
    return S(c, viser(plus(tete(c, "lina", 2.3), [mel(1.4, 0.9, k), 0.1, mel(2.5, 2.0, k)]), plus(tete(c, "lina", 2.3), [-0.2, 0, 0]), mel(38, 32, k), 0.5, 0.38), 0.5);
  }),
  P("s03p3", t("pied du mur, nuit", "Lina, visage de face, l'oreille toujours contre la brique", "elle chuchote ce qu'elle entend, les yeux grands ouverts", "gros plan de face, orbite lente", "ambre chaud sur le visage", "vignette", "murmure indistinct"), 2, 11, (c) => {
    const k = lisse(c.p);
    const h = tete(c, "lina", 2.3);
    return S(c, viser([h[0] + mel(0.8, 0.3, k), h[1] + 0.1, h[2] + mel(2.3, 2.0, k)], h, mel(34, 30, k), 0.5, 0.38), 0.5);
  }),
  P("s03p4", t("table du salon, côté est, de nuit", "Adam assis, de face", "il lève les yeux : il a entendu", "gros plan de face", "lampe ambre", "vignette", "cœur"), 2, 14, (c) => {
    const k = lisse(c.p);
    return S(c, viser(rel(c, "adam", [mel(0, -0.1, k), 2.3, mel(2.9, 2.6, k)]), rel(c, "adam", [0, 2.15, 0]), 44, 0.5, 0.36), 0.55);
  }),
  P("s03p5", t("salon de nuit, mur de briques face est", "Adam, qui rejoint le mur", "il pose l'oreille contre les briques à son tour", "travelling d'accompagnement en plan moyen", "ambre rasant", "vignette, poussière", "pas, souffle"), 2, 16, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([6.6, 3.1, -1.9], [5.6, 2.9, -1.2], k), plus(pos(c, "adam"), [0, 1.7, 0]), 52, 0.5, 0.42), 0.5);
  }),
  P("s03p6", t("le mur de briques dans la pénombre, joints qui s'allument d'or", "Adam et Lina, deux petites silhouettes contre le mur", "les joints du mur pulsent d'une lueur dorée, comme un cœur", "plan large qui s'éloigne lentement", "or pulsé entre les briques, nuit bleue", "pulsation de lumière, vignette", "battement lent grave"), 2, 21, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([6.6, 2.7, 4.8], [6.9, 2.9, 6.1], k), [0.9, 2.5, 2.4], mel(54, 62, k), 0.5, 0.4), 0.55);
  }),

  // ======================= SCÈNE 4 — « En regardant de près, j'ai vu des mots gravés : « pardon », « reste », « je t'aime ». Chaque brique contenait une phrase qu'on n'avait jamais dite. »
  P("s04p1", t("mur de briques, face est, de nuit", "Adam qui recule d'un pas et examine le mur", "il se penche, intrigué, la main près d'une brique", "plan moyen de profil, léger travelling", "ambre rasant et pulsations dorées", "vignette", "battement lent"), 3, 0, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([5.8, 2.7, -1.8], [5.0, 2.6, -1.2], k), [1.8, 2.3, 1.4], 46, 0.5, 0.4), 0.5);
  }),
  P("s04p2", t("face est du mur, briques grises couvertes de mots gravés", "—", "des mots apparaissent dans la pierre, brique après brique", "gros plan en travelling latéral le long du mur", "lumière rasante qui creuse les lettres, joints dorés", "pulsation de lumière", "battement lent, murmure"), 3, 7, (c) => {
    const k = lisse(c.p);
    return S(c, viser([4.1, 3.2, mel(0.5, -0.9, k)], [0.9, 3.35, mel(0.2, -1.2, k)], 46, 0.5, 0.3), 0.5);
  }),
  P("s04p3", t("face est du mur : brique « pardon » puis brique « reste »", "—", "les deux mots apparaissent gravés l'un après l'autre", "travelling latéral lent entre les deux briques", "lumière rasante, joints dorés", "pulsation de lumière", "battement lent"), 3, 11, (c) => {
    const k = lisse(c.p);
    return S(c, viser([4.1, 3.55, mel(1.5, 0.2, k)], [0.9, 3.7, mel(1.2, -0.1, k)], 44, 0.5, 0.3), 0.5);
  }),
  P("s04p4", t("face est du mur : brique « je t'aime » gravée", "—", "les joints dorés battent autour du mot", "gros plan, poussée lente", "joints dorés pulsés, ambre", "pulsation de lumière, vignette", "battement lent plus fort"), 3, 16, (c) => {
    const k = lisse(c.p);
    return S(c, viser([mel(4.2, 3.4, k), 3.4, -1.3], [0.9, 3.25, -1.75], mel(44, 38, k), 0.5, 0.3), 0.55);
  }),
  P("s04p5", t("le mur de briques sur toute sa longueur, mots gravés partout", "—", "des centaines de phrases gravées défilent", "travelling très rapide le long du mur", "lumière rasante froide, joints d'or", "flou de vitesse léger, vignette", "battement, murmures"), 3, 20, (c) => {
    const z = mel(5.6, -3.4, lisse(c.p));
    return S(c, viser([4.0, 3.5, z], [0.9, 3.4, z - 1.1], 50, 0.5, 0.36), 0.55);
  }),
  P("s04p6", t("salon de nuit, le mur géant couvert de mots", "Adam, petit, de dos devant le mur", "il regarde le mur entier, accablé par tout ce qui n'a jamais été dit", "plan large qui se rapproche lentement, par-dessus l'épaule d'Adam", "ambre, joints dorés pulsés", "vignette", "battement, nappe grave"), 3, 25, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([5.9, 2.9, 2.4], [5.2, 2.8, 1.8], k), [0.9, 3.1, 0.4], mel(62, 56, k), 0.5, 0.42), 0.55);
  }),

  // ======================= SCÈNE 5 — « Alors j'ai pris mon courage : « Papa, maman me manque. » Une brique est tombée. Papa m'a regardé, les larmes aux yeux, et a murmuré : « À moi aussi. » »
  P("s05p1", t("salon de nuit, le mur de briques", "Adam, de profil, au milieu de la pièce face au mur", "il inspire, redresse les épaules, le regard décidé", "gros plan de profil qui contourne vers la face", "ambre sur le visage, pulsations dorées", "vignette", "battement, respiration"), 4, 0, (c) => {
    const k = lisse(c.p);
    return S(c, viser(rel(c, "adam", [mel(-1.8, -0.3, k), 2.4, mel(2.0, 2.7, k)]), rel(c, "adam", [0, 2.3, 0]), mel(46, 44, k), 0.5, 0.36), 0.55);
  }),
  P("s05p2", t("devant le mur, face est", "Adam, gros plan de face, mains serrées contre sa poitrine", "il dit « Papa, maman me manque. » : la voix qui tremble, les larmes qui montent", "gros plan de face, poussée lente", "ambre sur le visage, joints dorés qui battent derrière lui", "pulsation de lumière", "battement, souffle"), 4, 7, (c) => {
    const k = lisse(c.p);
    return S(c, viser(rel(c, "adam", [mel(0.1, -0.05, k), 2.4, mel(2.9, 2.6, k)]), rel(c, "adam", [0, 2.3, 0]), mel(48, 44, k), 0.5, 0.36), 0.6);
  }),
  P("s05p3", t("mur de briques, une brique gravée « maman me manque » au niveau des yeux", "—", "la brique frémit, se détache et tombe vers nous au ralenti, laissant un trou noir et doré", "plan fixe de trois quarts, très léger recul", "joints dorés, lumière froide rasante", "ralenti, poussière, flash doré léger", "choc sourd, grondement de pierre"), 4, 12, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return S(c, viser(mel3([3.5, 2.7, -1.2], [3.1, 2.5, -0.8], k), [1.5, 1.9, 1.75], mel(46, 42, k), 0.5, 0.4), 0.55, { fx: { vignette: 0.55, flash: ["#FFD27A", flash(c.T, ev.tombe + 0.9, 0.18, 0.05, 0.4)] } });
  }),
  P("s05p4", t("trou dans le mur, vu de l'est : un cadre de briques sur un visage", "papa (pull gris, barbe courte), visible à travers la brèche, relevant la tête", "il lève les yeux vers son fils : regard éteint qui revient à la vie", "plan fixe de face à travers l'ouverture, léger zoom", "ambre chaud derrière le visage, briques froides autour", "vignette forte", "battement, souffle"), 4, 16, (c) => {
    const k = lisse(c.p);
    return S(c, viser([mel(3.1, 2.8, k), 2.3, 1.75], tete(c, "papa", 2.2), mel(32, 28, k), 0.5, 0.4), 0.65);
  }),
  P("s05p5", t("brèche du mur, intérieur de la brique manquante", "papa en gros plan, encadré par les briques", "les larmes coulent, il murmure", "gros plan de face depuis la brèche, poussée lente", "ambre sur le visage mouillé", "vignette forte", "battement, murmure"), 4, 19, (c) => {
    const k = lisse(c.p);
    return S(c, viser([mel(0.8, 0.5, k), 2.3, 1.75], tete(c, "papa", 2.2), mel(40, 36, k), 0.5, 0.38), 0.65);
  }),
  P("s05p6", t("salon, devant le mur troué", "Adam et Lina côte à côte", "Adam sourit à travers ses larmes (« À moi aussi »), Lina lui sourit", "plan moyen de face, poussée douce", "ambre sur les deux visages", "vignette douce", "nappe qui s'ouvre, cœur"), 4, 28, (c) => {
    const k = lisse(c.p);
    return S(c, viser([mel(0.9, 1.3, k), 2.4, 2.4], plus(pos(c, "adam"), [-0.3, 2.0, -0.45]), mel(46, 42, k), 0.5, 0.4), 0.45);
  }),

  // ======================= SCÈNE 6 — « Le mur s'est effondré. De l'autre côté, maman était assise dans notre salon depuis trois ans, à nous attendre. Elle n'avait jamais disparu. »
  P("s06p1", t("le mur de briques, du faîte au sol", "Adam, Lina et papa, minuscules", "le mur s'effondre en cascade : les briques tombent, la poussière jaillit, une lumière dorée inonde la pièce", "plan large qui recule vite, légère contre-plongée", "éclat doré à l'effondrement, poussière lumineuse", "flash doré, poussière, vignette", "grondement, briques qui s'écrasent"), 5, 0, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return S(c, viser(mel3([6.0, 3.0, 4.3], [7.4, 3.4, 5.4], k), [0.3, 2.6, -0.4], mel(66, 72, k), 0.5, 0.42), 0.4, { fx: { vignette: 0.4, flash: ["#FFE2A0", flash(c.T, ev.effondre + 0.12, 0.55, 0.05, 0.6)] } });
  }),
  P("s06p2", t("le salon sans mur, lumière dorée et poussière en suspension", "maman, assise sur un canapé couleur brique, cardigan vert, tasse de thé à la main", "elle apparaît peu à peu derrière la poussière qui retombe", "poussée lente vers le canapé", "lumière dorée, rais de lumière, abat-jour ambre", "particules, brume dorée", "nappe chaude qui s'ouvre, carillon"), 5, 4, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([6.6, 2.7, -0.2], [5.6, 2.5, -1.2], k), plus(MAMAN_P, [0.1, 1.6, 0]), mel(48, 42, k), 0.5, 0.4), 0.35);
  }),
  P("s06p3", t("canapé de maman, plaid sur les genoux, lampe dorée derrière", "maman (longs cheveux bruns, cardigan vert)", "elle lève les yeux : elle les voit, surprise puis émue", "gros plan de face, poussée très lente", "or chaud sur le visage", "particules dorées", "nappe chaude, respiration"), 5, 7, (c) => {
    const k = lisse(c.p);
    return S(c, viser(rel(c, "maman", [0.1, mel(2.5, 2.35, k), mel(4.2, 3.6, k)]), rel(c, "maman", [0, 2.12, 0]), mel(42, 38, k), 0.5, 0.36), 0.3);
  }),
  P("s06p4", t("salon dégagé, parquet couvert de poussière dorée", "Adam et Lina qui courent, papa derrière", "ils se précipitent vers le canapé, les larmes aux yeux", "travelling latéral rapide qui les suit", "or, ombres longues", "poussière, flou de vitesse léger", "pas qui courent, nappe"), 5, 12, (c) => {
    const a = plus(pos(c, "adam"), [0, 1.6, 0]);
    return S(c, viser([7.2, 2.9, mel(1.0, -0.6, lisse(c.p))], a, 54, 0.5, 0.42), 0.3);
  }),
  P("s06p5", t("devant le canapé", "maman qui pose sa tasse et ouvre les bras ; Adam qui arrive", "elle sourit, larmes de joie", "plan moyen de face, poussée", "or chaud", "particules", "nappe chaude"), 5, 16, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([4.7, 3.0, -6.2], [4.1, 2.8, -5.6], k), [0.9, 1.9, -2.4], 52, 0.5, 0.4), 0.3);
  }),
  P("s06p6", t("canapé, lumière dorée", "maman serre Adam et Lina dans ses bras, papa se penche vers eux", "la famille réunie : ils pleurent et rient ensemble", "orbite lente autour du groupe", "or, contre-jour du lampadaire", "particules dorées", "nappe émotionnelle, souffle"), 5, 19, (c) => {
    return S(c, orb([0.8, 1.9, -2.5], [4.4, 3.9], [2.1, 2.9], [2.5, 2.8], c.p, 48, 0.4), 0.25);
  }),
  P("s06p7", t("salon baigné d'or, canapé au centre", "la famille réunie : maman, Adam, Lina, papa", "ils restent serrés, immobiles, apaisés", "plan large qui s'élève et recule", "or, rais de lumière, poussière qui retombe", "particules", "nappe chaude"), 5, 23, (c) => {
    const k = lisse(c.p);
    return S(c, viser(mel3([3.9, 2.8, -5.3], [4.9, 3.2, -5.9], k), [0.8, 1.9, -2.5], mel(46, 50, k), 0.5, 0.4), 0.3);
  }),
  P("s06p8", t("le salon sans mur, tout est doré ; le canapé de maman au centre", "la famille réunie sur le canapé", "dernière image : immobile, lumineuse, la poussière retombe", "recul lent et grand angle jusqu'au fondu", "or", "fondu au noir sur la dernière parole", "nappe chaude, silence final"), 5, 27, (c) => {
    const d = D(c);
    const k = lisse(c.p);
    return S(c, viser(mel3([4.9, 3.2, -5.9], [8.4, 4.8, -4.6], k), [0.7, 1.9, -2.4], mel(50, 62, k), 0.5, 0.4), 0.35, { fx: { vignette: 0.4, noir: NOIR(c, d) } });
  }),
];
void trav;
void faceA;
