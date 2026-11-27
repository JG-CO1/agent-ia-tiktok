/**
 * « Dans cette ville, tout le monde s'appelle Alex… » — mise en scène plan par plan (récit : histoires/recits/prenom-unique.json).
 * Chaque plan démarre sur un mot [scène, mot] (scène 1 = indice 0). Cinq lieux : la ville solaire (origine), la salle de classe,
 * la cour-cantine, la même ville de nuit, le sous-sol glacé de la mairie. Le rythme s'accélère vers la révélation (plans courts),
 * les trois images-clés ont leur plan : le sosie qui ouvre les yeux, la plaque « NOÉ » qui s'allume, les deux visages identiques.
 */
import type { PlanGen } from "../../types";
import { D, P, entre, faceA, freine, lisse, mel, mel3, orb, plus, pos, rel, secousse, trav, viser, type V3 } from "../cam";
import type { EtatConte } from "../lib";
import { BOUL, BOUT, CAB_SOSIE, CAB_VOISIN, CABINES, CLASSE, COUR, MAIRIE_Z, NUIT, SIGNE, SOUS, occupant } from "./monde";

const cl = (x: number, y: number, z: number): V3 => [CLASSE[0] + x, y, CLASSE[2] + z];
const co = (x: number, y: number, z: number): V3 => [COUR[0] + x, y, COUR[2] + z];
const nu = (x: number, y: number, z: number): V3 => [NUIT[0] + x, y, NUIT[2] + z];
const ss = (x: number, y: number, z: number): V3 => [SOUS[0] + x, y, SOUS[2] + z];

const FOG = {
  jour: ["#C4E9FF", 70, 330] as [string, number, number],
  jourLoin: ["#C4E9FF", 120, 420] as [string, number, number],
  classe: ["#FFF1C0", 34, 120] as [string, number, number],
  cour: ["#C4E9FF", 60, 300] as [string, number, number],
  nuit: ["#0A1332", 26, 180] as [string, number, number],
  sous: ["#BEEFF8", 24, 150] as [string, number, number],
};
const CIEL = { jour: "#5BB8F5", classe: "#FFF1C0", nuit: "#060B20", sous: "#BEEFF8" };
const S = (cam: ReturnType<typeof viser>, brouillard: [string, number, number], ciel: string, vignette = 0.3, extra: Partial<EtatConte> = {}): EtatConte => ({ cam, brouillard, ciel, fx: { vignette }, ...extra });
const flash = (T: number, t0: number, amp = 0.8, av = 0.06, ap = 0.45) => amp * entre(T, t0 - av, t0 + 0.03) * (1 - entre(T, t0 + 0.08, t0 + ap));
/** Titre normalisé d'un plan (sert au storyboard livré). */
const t = (decor: string, perso: string, action: string, camera: string, lumiere: string, effets: string, son: string) => `Décor : ${decor} | Personnages : ${perso} | Action/expressions : ${action} | Caméra : ${camera} | Lumière : ${lumiere} | Effets : ${effets} | Son : ${son}`;

const NOIR = (c: { T: number }, d: { finNarration: number }) => lisse(entre(c.T, d.finNarration - 0.02, d.finNarration + 0.14));

export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « Dans cette ville, tout le monde s'appelle Alex. Le maire, la boulangère, même mon prof de maths… »
  P("s01p1", t("avenue solaire aux pavillons turquoise et moutarde identiques, ciel bleu franc", "des dizaines d'Alex (même t-shirt jaune, même étiquette « ALEX »), au loin une silhouette bleue", "tous marchent d'un même pas, en phase, vers la caméra, visages neutres", "travelling avant fulgurant à hauteur d'enfant au milieu de l'allée, objectif très large", "plein soleil, ombres courtes et dures", "vignette légère", "murmure de ville, pas synchronisés"), 0, 0, (c) => {
    const p = c.p;
    const z = mel(46, 6, p);
    return S(viser([0.15, mel(1.45, 1.7, p), z], [0, 2.0, z - 30], 64), FOG.jour, CIEL.jour, 0.3);
  }),
  P("s01p2", t("perron de la mairie, colonnes blanches, drapeaux tricolores", "le maire (costume gris, écharpe tricolore, lunettes) avec l'étiquette « ALEX » sur la poitrine", "il regarde la caméra, impassible", "plan rapproché, poussée lente vers l'étiquette", "soleil de midi", "—", "murmure de ville, pas synchronisés"), 0, 8, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.1, 4.3, MAIRIE_Z + 10.4], [0.0, 4.0, MAIRIE_Z + 9.0], k), [0, 3.7, MAIRIE_Z + 3.4], 40, 0.5, 0.3), FOG.jour, CIEL.jour, 0.3);
  }),
  P("s01p3", t("trottoir devant la boulangerie (enseigne, auvent rayé moutarde, vitrine de pains)", "la boulangère (tablier blanc, bandeau) avec l'étiquette « ALEX »", "elle regarde droit devant, sourire figé", "plan moyen de face depuis le trottoir", "soleil de midi, ombre courte", "—", "murmure de ville"), 0, 11, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([9.6, 3.0, BOUL.z + 5.6], [10.6, 2.9, BOUL.z + 4.8], k), [BOUL.x - 4.0, 2.2, BOUL.z + 3.6], 42, 0.5, 0.28), FOG.jour, CIEL.jour, 0.3);
  }),
  P("s01p4", t("cour de l'école : façade turquoise aux portes moutarde", "le prof de maths (veste marron, lunettes) avec l'étiquette « ALEX », devant l'entrée", "il fait face à la cour, immobile, impassible", "plan moyen de face entre les tables de la cantine, poussée lente", "plein soleil, ombre courte", "—", "murmure, cloche d'école"), 0, 13, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(co(0.3, 2.8, -10.8), co(0.2, 2.7, -12.4), k), co(0.4, 2.55, -17.2), 40, 0.5, 0.36), FOG.cour, CIEL.jour, 0.3);
  }),
  P("s01p5", t("la même avenue vue d'en haut : une mer de t-shirts jaunes", "une foule dense d'Alex en marche synchronisée, et une seule tache bleue immobile (Noé) dans l'allée", "la foule défile de part et d'autre de Noé, qui ne bouge pas", "plan large aérien, descente lente vers l'allée", "plein soleil, ombres dures", "vignette", "murmure de ville, pas synchronisés"), 0, 17, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.5, 17, 16], [0.3, 12, 9], k), [0, 1.2, -22], 58), FOG.jour, CIEL.jour, 0.35);
  }),
  P("s01p6", t("allée centrale de l'avenue, foule en marche derrière lui", "Noé (t-shirt bleu, cheveux roux en bataille), seul au milieu des Alex", "il reste immobile, inquiet, tandis que les autres défilent", "plan moyen de face, poussée lente vers lui", "plein soleil", "vignette", "murmure de ville, pas synchronisés"), 0, 20, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.6, 3.0, -15.4], [0.3, 2.6, -17.8], k), [0, 1.7, -24], mel(44, 40, k), 0.5, 0.3), FOG.jour, CIEL.jour, 0.4);
  }),
  P("s01p7", t("avenue ensoleillée, flou de la foule jaune derrière", "Noé, gros plan : l'étiquette « NOÉ » sur son t-shirt bleu", "il fixe la caméra, effrayé", "gros plan poitrine et visage de face", "soleil de midi", "vignette", "murmure de ville"), 0, 25, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.2, 2.0, -18.9], [0.1, 1.9, -19.5], k), [0, 1.68, -24], 38, 0.5, 0.32), FOG.jour, CIEL.jour, 0.45);
  }),

  // ======================= SCÈNE 2 — « Quand on crie « Alex ! », trente têtes se tournent… cent quarante-quatre Alex. »
  P("s02p1", t("salle de classe, pupitres alignés au cordeau, tableau « 144 »", "le prof de maths (au fond de la classe, dans l'allée) avec l'étiquette « ALEX », élèves courbés devant lui", "il crie « Alex ! », bouche ouverte", "plan rapproché de face dans l'allée, poussée lente vers lui", "soleil par les fenêtres", "—", "cloche d'école, cri de foule grave (« hey »)"), 1, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(cl(0.0, 3.1, 1.0), cl(0.0, 3.1, 1.9), k), cl(0, 2.35, 5.5), 38, 0.5, 0.4), FOG.classe, CIEL.classe, 0.3);
  }),
  P("s02p2", t("salle de classe vue du fond, rangées de nuques puis de visages", "trente élèves (Alex) et, au milieu, un seul t-shirt bleu : Noé", "les trente têtes se retournent d'un bloc vers la caméra, regards vides ; Noé reste de dos, immobile", "travelling arrière en plongée sur les nuques", "soleil par les fenêtres", "vignette", "cri grave, claquement synchronisé"), 1, 7, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(cl(1.2, 4.5, 6.3), cl(1.2, 4.7, 6.8), k), cl(0.3, 1.8, 0.2), mel(66, 70, k), 0.5, 0.42), FOG.classe, CIEL.classe, 0.4);
  }),
  P("s02p3", t("salle de classe, rangée du fond côté fenêtres", "Noé (bleu, roux), tout seul à ne pas s'être retourné au début", "il se retourne vers la caméra et regarde, inquiet, les visages vides", "gros plan depuis le fond de la salle, plan serré sur son visage", "soleil par les fenêtres", "vignette", "silence tendu, cœur"), 1, 11, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(cl(1.9, 3.1, 6.8), cl(2.1, 2.9, 6.2), k), cl(2.34, 2.3, 3.6), 36, 0.5, 0.4), FOG.classe, CIEL.classe, 0.5);
  }),
  P("s02p4", t("salle de classe, allée centrale", "les élèves Alex, visages identiques et vides, tournés vers nous", "ils fixent la caméra sans cligner", "travelling avant à hauteur de visage dans l'allée", "soleil par les fenêtres", "vignette", "murmure, battement de cœur"), 1, 14, (c) => {
    const k = lisse(c.p);
    return S(viser(cl(0, 2.35, mel(6.8, 5.9, k)), cl(0, 2.2, -3), 62), FOG.classe, CIEL.classe, 0.45);
  }),
  P("s02p5", t("cour de l'école, cantine en plein air, trois rangées de tables identiques", "Noé seul à sa table, derrière lui les Alex en rangs", "tous les Alex mangent exactement au même rythme ; Noé les observe", "gros plan sur son regard puis recul et montée sur la grue", "plein soleil, ombres courtes", "—", "murmure, cuillères en cadence"), 1, 16, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(co(-14.1, 2.4, 7.3), co(-12.0, 4.4, 12.5), freine(k)), mel3(co(-14.5, 2.25, 4.05), co(-12.8, 1.9, -2.0), freine(k)), mel(34, 54, freine(k)), 0.5, mel(0.4, 0.45, k)), FOG.cour, CIEL.jour, 0.3);
  }),
  P("s02p6", t("place de la mairie dallée en cases", "cent quarante-quatre Alex rangés en carré de 12 × 12, et Noé à l'écart", "le carré parfait respire en même temps ; Noé regarde de côté", "plan aérien, lente orbite", "plein soleil, ombres dures", "vignette", "murmure, pas synchronisés"), 1, 22, (c) => {
    const k = lisse(c.p);
    return S(orb([0, 0.5, -100], [58, 46], [-0.6, 0.35], [52, 46], k, 56), FOG.jourLoin, CIEL.jour, 0.35);
  }),
  P("s02p7", t("façade de la mairie : panneau à diodes « ALEX PRÉSENTS »", "le carré des cent quarante-quatre, de dos, au premier plan", "le compteur grimpe jusqu'à 144", "plan bas par-dessus les têtes, travelling avant vers le panneau", "soleil, halo ambre du panneau", "flash ambre au 144, vignette", "bip de compteur, murmure"), 1, 28, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.2, 5.6, -76], [0.2, 7.0, -96], k), [0, 11.6, MAIRIE_Z + 6.6], mel(52, 46, k), 0.5, 0.4), FOG.jourLoin, CIEL.jour, 0.4, { fx: { vignette: 0.4, flash: ["#FFC24A", flash(c.T, D(c).ev.compte1, 0.3)] } });
  }),

  // ======================= SCÈNE 3 — « Pourtant, mardi, mon voisin a disparu. Jeudi, ma maîtresse aussi. »
  P("s03p1", t("salle de classe, tableau noir « MARDI »", "les élèves Alex de dos, tous identiques ; à côté de Noé, son voisin", "la classe est penchée sur ses cahiers", "plan large du fond de la salle, légère plongée", "soleil par les fenêtres", "vignette", "murmure de classe"), 2, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(cl(1.2, 3.8, 6.4), cl(1.2, 3.5, 5.7), k), cl(0.4, 2.4, -3), 58, 0.5, 0.42), FOG.classe, CIEL.classe, 0.35);
  }),
  P("s03p2", t("salle de classe, dernière rangée côté fenêtres", "Noé et son voisin (Alex) côte à côte, vus de dos depuis le coin du fond", "le voisin disparaît d'un coup (« a disparu ») ; Noé tourne la tête vers la chaise vide", "plan rapproché depuis le coin du fond de la salle, léger recul", "soleil par les fenêtres", "vignette", "soupir étouffé, murmure"), 2, 3, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(cl(5.3, 3.2, 6.8), cl(4.7, 3.0, 6.3), k), cl(3.1, 2.2, 3.6), mel(50, 46, k), 0.5, 0.4), FOG.classe, CIEL.classe, 0.4);
  }),
  P("s03p3", t("salle de classe, devant le tableau « JEUDI »", "la maîtresse (robe violette, cheveux longs) avec l'étiquette « ALEX »", "elle est là, puis disparaît (« aussi »)", "plan moyen en plongée depuis le milieu de la classe, par-dessus les têtes", "soleil par les fenêtres", "vignette", "soupir étouffé, murmure de classe"), 2, 6, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(cl(-0.5, 4.6, -1.0), cl(-0.9, 4.5, -1.8), k), cl(2.4, 2.8, -5.4), 36, 0.5, 0.42), FOG.classe, CIEL.classe, 0.4);
  }),
  P("s03p4", t("salle de classe vue du fond, côté gauche", "les élèves Alex de dos, tous immobiles, la chaise vide du voisin à côté de Noé", "personne ne bouge, personne ne réagit ; Noé regarde la chaise vide", "plan large depuis le fond de la salle, glissement lent", "soleil par les fenêtres", "vignette", "silence, drone grave"), 2, 10, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(cl(-1.8, 3.4, 6.7), cl(0.0, 3.2, 6.5), k), cl(3.0, 1.7, 2.6), 56, 0.5, 0.42), FOG.classe, CIEL.classe, 0.45);
  }),
  P("s03p5", t("salle de classe, dernière rangée", "Noé, gros plan : il se retourne vers la caméra", "il balaie la classe du regard : « comment savoir qui manque ? »", "gros plan depuis le fond de la salle, léger rapprochement", "soleil par les fenêtres", "vignette", "cœur, drone grave"), 2, 15, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(cl(0.4, 2.9, 6.8), cl(1.4, 2.6, 6.4), k), cl(2.34, 2.3, 3.6), mel(40, 34, k), 0.5, 0.4), FOG.classe, CIEL.classe, 0.55);
  }),

  // ======================= SCÈNE 4 — « Cette nuit, j'ai suivi le maire au sous-sol… son sosie se réveillait. »
  P("s04p1", t("la même avenue, de nuit, lampadaires orange, mairie éclairée au fond", "Noé qui suit à distance le maire (costume gris, écharpe)", "le maire monte les marches de la mairie et pousse la porte, Noé se tapit", "travelling arrière-épaule bas derrière Noé", "nuit bleue, halos orange des lampadaires, porte qui s'ouvre sur la lumière", "vignette, brouillard bleu nuit", "grillons, pas étouffés"), 3, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "noeN", [mel(4.6, 3.6, k), 1.9, -8.6]), nu(0, 2.6, MAIRIE_Z + 7), mel(58, 50, k), 0.5, 0.42), FOG.nuit, CIEL.nuit, 0.55);
  }),
  P("s04p2", t("sous-sol de la mairie : escalier de pierre blanche, néons cyan", "le maire (costume gris, écharpe) qui descend les marches de dos", "il descend sans se retourner", "plan bas latéral sur l'escalier, la caméra suit le maire", "contre-jour orange de la porte, lumière froide cyan", "brume froide au sol, vignette", "bourdonnement froid, pas sur la pierre"), 3, 6, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ss(-6.4, 2.9, 11.4), ss(-5.8, 2.4, 8.6), k), plus(pos(c, "maireSS"), [0, 2.5, 0]), 54, 0.5, 0.42), FOG.sous, CIEL.sous, 0.5);
  }),
  P("s04p3", t("hall glacé du sous-sol : deux rangées de cabines de verre alignées à perte de vue", "le maire minuscule au bas de l'escalier ; occupants endormis dans les cabines", "rien ne bouge, sauf le brouillard au ras du sol", "plongée vertigineuse depuis le haut de l'escalier, descente lente", "néons blancs et faisceaux cyan, brume froide", "brume volumétrique, vignette", "bourdonnement froid, drone grave"), 3, 8, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ss(-1.2, 8.0, 22.0), ss(-1.0, 7.2, 19.0), k), ss(0, 1.5, -40), mel(66, 62, k), 0.5, 0.44), FOG.sous, CIEL.sous, 0.5);
  }),
  P("s04p4", t("allée du hall, cabines de verre marquées « ALEX »", "dormeurs identiques dans chaque cabine (t-shirt jaune, étiquette « ALEX »)", "ils dorment debout, yeux fermés, tous pareils", "travelling latéral à hauteur d'yeux le long des cabines", "néons cyan et blancs, reflets de verre", "brume au sol", "bourdonnement froid, léger tintement de verre"), 3, 12, (c) => {
    const z = mel(-5, -23, lisse(c.p));
    return S(viser(ss(2.2, 2.6, z), ss(-4.9, 3.1, z - 0.3), 52, 0.5, 0.44), FOG.sous, CIEL.sous, 0.45);
  }),
  P("s04p5", t("une cabine du hall, plaque « ALEX »", "le voisin endormi dans sa cabine (même t-shirt jaune « ALEX »)", "il dort debout, yeux fermés, visage paisible", "plan frontal à travers la vitre, poussée lente vers le visage endormi", "faisceau cyan derrière lui, reflets sur la vitre", "brume, vignette", "bourdonnement, cœur lent"), 3, 17, (c) => {
    const k = lisse(c.p);
    const o = occupant(CABINES[CAB_VOISIN]);
    return S(viser(mel3(ss(0.7, 3.1, o[2] + 3.4), ss(-0.2, 2.9, o[2] + 2.1), k), ss(o[0], 2.85, o[2]), mel(40, 34, k), 0.5, 0.38), FOG.sous, CIEL.sous, 0.5);
  }),
  P("s04p6", t("rangée de cabines, glissement vers la cabine suivante", "le voisin, puis son sosie dans la cabine d'à côté (strictement identiques)", "les deux dormeurs se ressemblent trait pour trait", "panoramique latéral rapide de l'une à l'autre", "faisceau cyan, vitres brillantes", "brume, vignette", "bourdonnement, cœur"), 3, 22, (c) => {
    const k = lisse(c.p);
    const a = occupant(CABINES[CAB_VOISIN]);
    const b = occupant(CABINES[CAB_SOSIE]);
    const w = lisse(entre(c.p, 0.3, 0.7));
    return S(viser(mel3(ss(-0.3, 2.9, a[2] + 0.2), ss(-0.3, 2.9, b[2] + 0.6), w), mel3(ss(a[0], 2.8, a[2]), ss(b[0], 2.8, b[2]), w), 40, 0.5, 0.4), FOG.sous, CIEL.sous, 0.5);
  }),
  P("s04p7", t("cabine du sosie, vitre froide, voyant de la cabine", "le sosie du voisin : même visage, même t-shirt jaune « ALEX »", "ses yeux s'ouvrent d'un coup : regard vide, fixe ; voyant rouge", "gros plan de face sur le visage, poussée lente", "éclat cyan sur le visage à l'instant du réveil, voyant rouge pulsé", "flash cyan au réveil, vignette", "choc grave, cœur, soupir de cabine"), 3, 25, (c) => {
    const k = lisse(c.p);
    const o = occupant(CABINES[CAB_SOSIE]);
    const ev = D(c).ev;
    return S(viser(mel3(ss(-0.9, 2.95, o[2]), ss(-1.9, 2.9, o[2]), k), ss(o[0], 2.85, o[2]), mel(36, 30, k), 0.5, 0.38), FOG.sous, CIEL.sous, 0.55, { fx: { vignette: 0.55, flash: ["#C8F6FF", flash(c.T, ev.reveil, 0.22, 0.04, 0.3)] } });
  }),

  // ======================= SCÈNE 5 — « Le maire m'a surpris : « Les vrais dorment. Les copies sont plus faciles à gérer. » … « Noé » »
  P("s05p1", t("allée du hall, cabines en enfilade, le voyant rouge de la cabine du sosie au fond", "le maire surgi devant Noé, vu d'en dessous", "le maire se dresse, regard dur", "contre-plongée menaçante, très bas", "néons cyan, ombres dures", "vignette forte", "choc grave, bourdonnement"), 4, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "maire2", [mel(-0.7, -0.4, k), 1.0, mel(4.3, 3.4, k)]), rel(c, "maire2", [0, 2.75, 0]), 50, 0.5, 0.4), FOG.sous, CIEL.sous, 0.65);
  }),
  P("s05p2", t("allée du hall", "le maire, visage en gros plan (lunettes, écharpe tricolore)", "il parle : « Les vrais dorment. » froid et calme", "gros plan de face, poussée lente", "lumière cyan par en dessous", "vignette", "bourdonnement froid"), 4, 5, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "maire2", [0.25, 2.95, mel(3.7, 2.9, k)]), rel(c, "maire2", [0, 2.7, 0]), 34, 0.5, 0.38), FOG.sous, CIEL.sous, 0.6);
  }),
  P("s05p3", t("hall glacé, cabines de verre des deux côtés, voyant rouge de la cabine du sosie", "le maire de dos au premier plan, Noé petit à côté de la cabine", "« Les copies sont plus faciles à gérer. » Noé recule", "plan en plongée par-dessus l'épaule du maire, léger recul", "néons blancs, brume au sol, voyant rouge", "brume, vignette", "bourdonnement, drone grave"), 4, 9, (c) => {
    const k = lisse(c.p);
    return S(viser(ss(mel(0.4, 0.2, k), mel(5.6, 4.8, k), mel(-21.5, -24.2, k)), ss(-0.5, 1.9, -33.5), 56, 0.5, 0.42), FOG.sous, CIEL.sous, 0.5);
  }),
  P("s05p4", t("allée du hall vue en enfilade, plaques « ALEX » défilant des deux côtés", "dormeurs identiques, de part et d'autre", "rien ne bouge ; on file vers le fond de la salle", "travelling avant ultra rapide au centre de l'allée", "néons qui défilent, lueur dorée au fond", "flou de vitesse léger, brume", "souffle de vent froid, montée de tension"), 4, 17, (c) => {
    const z = mel(-30, -88, freine(c.p));
    return S(viser(ss(0, mel(2.3, 2.7, c.p), z), ss(0, 3.0, z - 40), mel(70, 62, c.p), 0.5, 0.44), FOG.sous, CIEL.sous, 0.55);
  }),
  P("s05p5", t("fond du hall : la dernière cabine, éclairée d'or, plaque encore éteinte", "—", "la cabine du fond se rapproche, seule et lumineuse", "travelling avant vers la plaque", "lueur dorée de la cabine, vitre brillante", "brume, vignette", "bourdonnement, cœur"), 4, 22, (c) => {
    const k = freine(c.p);
    return S(viser(mel3(ss(0, 3.0, -86), ss(0, 3.2, -93.6), k), ss(0, 3.3, BOUT[2] + 2), 46, 0.5, 0.42), FOG.sous, CIEL.sous, 0.55);
  }),
  P("s05p6", t("fond du hall, plaque de la dernière cabine", "—", "la plaque s'allume : « NOÉ »", "plan fixe de face sur la plaque, léger zoom", "plaque qui s'illumine en or", "flash doré à l'allumage, halo", "choc grave, bourdonnement"), 4, 27, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return S(viser(mel3(ss(0, 3.9, -93.4), ss(0, 4.1, -95.6), k), ss(0, 4.45, BOUT[2] + 2.1), mel(40, 36, k), 0.5, 0.34), FOG.sous, CIEL.sous, 0.5, { fx: { vignette: 0.5, flash: ["#FFE9A6", flash(c.T, ev.plaque, 0.45, 0.04, 0.45)] } });
  }),

  // ======================= SCÈNE 6 — « Dedans, un garçon dormait. Il avait mon visage… j'étais la copie qu'ils avaient oubliée… »
  P("s06p1", t("fond du hall, dernière cabine dont la vitre givrée se dissipe", "le garçon endormi apparaît dans la cabine (même visage, même t-shirt bleu que Noé)", "le givre s'efface sur « Dedans, un garçon dormait »", "panoramique vertical doux depuis la plaque « NOÉ » jusqu'au visage endormi", "lueur dorée, vitre froide", "givre qui se dissipe, brume, vignette", "givre de verre, bourdonnement, cœur lent"), 5, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ss(1.3, 3.5, -96.6), ss(0.9, 2.9, -97.4), k), mel3(ss(0, 4.45, BOUT[2] + 2), ss(0, 2.7, BOUT[2] + 0.3), lisse(entre(c.p, 0.15, 0.95))), 42, 0.5, 0.4), FOG.sous, CIEL.sous, 0.5);
  }),
  P("s06p2", t("dernière cabine, vitre froide", "le garçon endormi : même visage, mêmes cheveux roux en bataille, même t-shirt bleu « NOÉ » que Noé", "il dort, yeux fermés, respiration lente", "gros plan de face sur son visage à travers la vitre", "lueur dorée, reflets sur la vitre", "vignette", "cœur, bourdonnement"), 5, 4, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ss(0.1, 2.75, -99.6), ss(0.1, 2.7, -100.1), k), ss(0, 2.62, BOUT[2] + 0.3), 30, 0.5, 0.4), FOG.sous, CIEL.sous, 0.55);
  }),
  P("s06p2b", t("dernière cabine, devant la vitre", "Noé de face (t-shirt bleu, roux en bataille) à côté du garçon endormi derrière la vitre : même visage, même étiquette « NOÉ »", "Noé, terrifié, fixe la caméra ; le dormeur reste yeux fermés", "plan fixe de face qui montre les deux visages côte à côte, poussée lente", "lueur dorée, vitre froide", "flash blanc à la découverte, vignette forte", "choc grave, cœur qui s'accélère"), 5, 7, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return S(viser(mel3(ss(-0.55, 2.65, -93.6), ss(-0.6, 2.65, -94.3), k), ss(-0.7, 2.62, -102.2), mel(39, 35, k), 0.5, 0.4), FOG.sous, CIEL.sous, 0.6, { fx: { vignette: 0.6, flash: ["#FFFFFF", flash(c.T, ev.visage + 0.02, 0.5, 0.02, 0.35)] } });
  }, { continu: true }),
  P("s06p3", t("dernière cabine, devant la vitre", "Noé de face, ses deux mains tremblantes devant lui", "il regarde ses mains, effrayé", "gros plan sur les mains et le visage", "lueur dorée", "vignette forte", "cœur rapide, bourdonnement"), 5, 9, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ss(-1.2, 2.8, -96.2), ss(-1.2, 2.6, -97.0), k), ss(-1.2, 2.0, -100.0), 38, 0.5, 0.42), FOG.sous, CIEL.sous, 0.6);
  }),
  P("s06p4", t("dernière cabine, devant la vitre", "Noé de face : l'étiquette « NOÉ » sur son t-shirt bleu", "il baisse les yeux sur son t-shirt, stupéfait", "gros plan sur la poitrine et l'étiquette, léger zoom", "lueur dorée", "vignette forte", "cœur rapide"), 5, 12, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ss(-1.2, 2.4, -97.0), ss(-1.2, 2.3, -97.8), k), ss(-1.2, 1.85, -100.3), mel(36, 32, k), 0.5, 0.4), FOG.sous, CIEL.sous, 0.6);
  }),
  P("s06p5", t("devant la dernière cabine : vitre qui reflète la salle", "Noé de dos, son reflet translucide dans la vitre à côté du garçon endormi", "il fait face à la vitre : deux Noé, un réel, un reflet", "plan par-dessus l'épaule, lent glissement latéral", "lueur dorée et reflets froids", "vignette, brume", "bourdonnement, cœur"), 5, 16, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ss(1.3, 3.4, -94.4), ss(0.9, 3.1, -95.8), k), ss(-0.6, 2.45, -103.0), mel(40, 34, k), 0.5, 0.42), FOG.sous, CIEL.sous, 0.6);
  }),
  P("s06p6", t("devant la dernière cabine", "le garçon endormi et le reflet de Noé dans la vitre : deux visages identiques", "ils se superposent dans la vitre", "contre-plongée lente qui monte vers les deux visages", "lueur dorée, reflet froid", "vignette forte, buée qui apparaît", "cœur, drone grave"), 5, 22, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ss(1.7, 1.5, -98.4), ss(1.1, 2.3, -99.2), k), ss(-0.6, 2.7, -103.2), mel(40, 32, k), 0.5, 0.4), FOG.sous, CIEL.sous, 0.65);
  }),
  P("s06p7", t("devant la dernière cabine, vitre embuée", "Noé de dos face à la vitre, le garçon endormi et le reflet de Noé", "la buée gagne la vitre : quelqu'un respire derrière", "zoom lent vers la vitre, de plus en plus serré", "lueur dorée qui pulse", "buée, fondu au noir sur la dernière parole", "cœur, drone grave, silence final"), 5, 30, (c) => {
    const d = D(c);
    const k = lisse(c.p);
    return S(viser(mel3(ss(1.0, 2.9, -96.6), ss(0.5, 2.8, -99.0), k), ss(-0.6, 2.7, -103.2), mel(36, 27, k), 0.5, 0.4), FOG.sous, CIEL.sous, 0.7, { fx: { vignette: 0.7, noir: NOIR(c, d) } });
  }),
];
void trav;
void faceA;
void secousse;
void pos;
void COUR;
void SIGNE;
