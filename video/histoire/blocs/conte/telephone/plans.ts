/**
 * « Chaque fois que je regarde mon téléphone, quelqu'un que j'aime vieillit d'un an… » — mise en scène plan par plan
 * (récit : histoires/recits/telephone.json). Chaque plan démarre sur un mot [scène, mot]. Contraste froid/chaud : la lumière
 * cyan de l'écran contre l'orange du couchant ; chaque battement (flash cyan) fait sauter le temps ; rythme qui s'accélère
 * vers le twist ; dernier plan sur la porte qui se ferme, puis noir piloté par `D(c).finNarration`.
 */
import type { PlanGen, CtxGen } from "../../types";
import { D, P, PI, entre, freine, lisse, mel, mel3, orb, plus, pos, secousse, viser, type Cam, type V3 } from "../cam";
import type { EtatConte } from "../lib";
import { CH, CH_Z, PERRON_Y, SA } from "./monde";
import { cielHeure, eclatTotal, heure } from "./temps";
import { boutMain, yeux } from "./fk";
import { FAUTEUIL } from "./histoire";

const [X] = CH;
const [XS] = SA;
const CYAN = "#7FEBFF";

const act = (c: CtxGen, id: string) => D(c).acteur(id, c.T);
/** Centre du téléphone tenu à deux mains par un personnage (à l'instant `T`, par défaut celui du plan). */
const tel = (c: CtxGen, id = "noa", T = c.T): V3 => {
  const a = D(c).acteur(id, T);
  if (!a) return [0, 1.5, 0];
  const L = boutMain(a, 1);
  const R = boutMain(a, -1);
  return [(L[0] + R[0]) / 2, (L[1] + R[1]) / 2 + 0.11, (L[2] + R[2]) / 2];
};
/** Position des yeux d'un personnage (repli : un point plausible). */
const oeil = (c: CtxGen, id: string): V3 => {
  const a = act(c, id);
  return a ? yeux(a) : [0, 2, 0];
};
/** Point devant le visage d'un personnage : `d` devant, `cote` vers sa gauche, `up` au-dessus des yeux. */
const devant = (c: CtxGen, id: string, d: number, up = 0, cote = 0): V3 => {
  const a = act(c, id);
  if (!a) return [0, 2, 0];
  const o = yeux(a);
  const f: V3 = [Math.sin(a.ry), 0, Math.cos(a.ry)];
  const l: V3 = [Math.cos(a.ry), 0, -Math.sin(a.ry)];
  return [o[0] + f[0] * d + l[0] * cote, o[1] + up, o[2] + f[2] * d + l[2] * cote];
};

/** Centre du téléphone tenu d'une main (pendu au bout du bras, ou relevé devant le visage) par un personnage. */
const telMain = (c: CtxGen, id = "noaR"): V3 => {
  const a = act(c, id);
  if (!a) return [0.2, 1.5, 6.2];
  const h = boutMain(a, -1, 0.5);
  const e = a.echelle;
  if (a.pose.brasD.x < -0.8) return [h[0] + Math.sin(a.ry) * 0.06, h[1] + 0.34 * e, h[2] + Math.cos(a.ry) * 0.06];
  return [h[0], h[1] - 0.26 * e, h[2]];
};

/** Brouillard : couleur du ciel du moment (chambre, salon) ou haze orangé de la rue. */
const brume = (c: CtxGen, lieu: "chambre" | "salon" | "rue"): [string, number, number] => {
  if (lieu === "rue") return ["#E98A55", 28, 200];
  const ciel = cielHeure(heure(c.T, D(c).ev));
  return lieu === "chambre" ? [ciel, 9, 60] : [ciel, 12, 70];
};
const skyRue = "#F29A62";

/** État du plan : caméra (secouée à chaque battement), brouillard, vignette, flash cyan des battements. */
function etat(c: CtxGen, cam: Cam, lieu: "chambre" | "salon" | "rue", vignette = 0.5, extra: Partial<EtatConte> & { face?: number } = {}, flashPlus: [string, number] | null = null): EtatConte {
  const ev = D(c).ev;
  const fl = eclatTotal(c.T, ev);
  const sh = fl > 0.05 ? secousse(c.T, 0.035 * fl) : ([0, 0, 0] as V3);
  const cam2: Cam = { pos: plus(cam.pos, sh), look: plus(cam.look, sh), fov: cam.fov };
  const ciel = lieu === "rue" ? skyRue : cielHeure(heure(c.T, ev));
  const flash: [string, number] = flashPlus && flashPlus[1] > 0.001 ? flashPlus : [CYAN, 0.82 * fl];
  return { cam: cam2, brouillard: brume(c, lieu), ciel, fx: { vignette, flash }, ...extra };
}
const CH_ = "chambre" as const;
const SA_ = "salon" as const;
const RUE_ = "rue" as const;

export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « Chaque fois que je regarde mon téléphone, quelqu'un que j'aime vieillit d'un an… »
  P("s01p1", "Décor : chambre de Noa plongée dans le noir | Personnages : Noa (15 ans, sweat vert foncé) assis au bord du lit | Action/expressions : son pouce glisse sur l'écran, une notification tombe, visage éclairé par en dessous, regard fixe | Caméra : orbite lente autour du téléphone, de l'épaule vers le visage | Lumière : halo cyan de l'écran, seule source dans la pièce, visage éclairé par en dessous | Effets : poussière dans le faisceau de l'écran, vignette | Son : nappe froide, glissements du pouce, notification douce", 0, 0, (c) => {
    const k = lisse(c.p);
    const ph = tel(c);
    const eo = oeil(c, "noa");
    const ct: V3 = mel3(ph, [(ph[0] + eo[0]) / 2, (ph[1] + eo[1]) / 2, (ph[2] + eo[2]) / 2], 0.5);
    const cam = viser(orbitePlan(ct, mel(2.9, 2.3, k), mel(-3.0, -4.2, k), mel(2.3, 1.8, k)), mel3(ct, [(ph[0] + eo[0]) / 2, (ph[1] + eo[1]) / 2 + 0.05, (ph[2] + eo[2]) / 2], k), mel(38, 40, k), 0.5, 0.42);
    return etat(c, cam, CH_, 0.6, { face: 0.85 });
  }),
  P("s01p2", "Décor : chambre, embrasure de la porte sur le couloir allumé (lumière chaude) | Personnages : Lila, 10 ans (salopette jaune, couettes) | Action/expressions : elle fait coucou de la main en souriant | Caméra : plan moyen, lente poussée depuis le fond de la chambre | Lumière : contre-jour orange du couloir | Effets : vignette | Son : nappe froide, battement de cœur", 0, 7, (c) => {
    const k = lisse(c.p);
    const a = act(c, "lila1");
    const t: V3 = a ? [a.p[0], 1.6, a.p[2]] : [X + 3.6, 1.6, 1.2];
    return etat(c, viser([X - 0.2 + 0.9 * k, 1.5, 1.45], t, mel(50, 42, k), 0.5, 0.42), CH_, 0.55);
  }),
  P("s01p3", "Décor : chambre sombre, porte ouverte sur le couloir orange | Personnages : Noa de dos au premier plan, Lila (10 ans) au loin dans l'embrasure | Action/expressions : Noa immobile, absorbé par l'écran, Lila lui fait signe | Caméra : plan large par-dessus son épaule, poussée très lente | Lumière : lueur cyan sur sa joue et sur le lit contre le couloir orange | Effets : poussière dans le faisceau, vignette | Son : nappe froide, battement de cœur", 0, 13, (c) => {
    const k = lisse(c.p);
    return etat(c, viser([X - 4.0 + 0.3 * k, 2.5 - 0.1 * k, 4.3 - 0.2 * k], [X + 1.0, 1.6, 1.1], mel(68, 64, k), 0.5, 0.42), CH_, 0.6);
  }),
  P("s01p4", "Décor : écran du téléphone en gros plan, conversation | Personnages : mains de Noa, pouce qui tape | Action/expressions : il répond « J'arrive ! » ; à l'envoi, flash cyan et le compteur d'année défile 2025 → 2026 | Caméra : gros plan épaule, poussée vers l'écran, secousse au battement | Lumière : écran cyan éblouissant, ombres dures | Effets : flash cyan, vignette | Son : frappes sur l'écran, whoosh du temps qui monte jusqu'au flash", 0, 19, (c) => {
    const k = lisse(c.p);
    const ph = tel(c);
    return etat(c, viser([ph[0] + 1.9 - 0.3 * k, ph[1] + 1.0 - 0.1 * k, ph[2] + 0.5 - 0.1 * k], plus(ph, [0, 0.12, 0]), mel(36, 30, k), 0.5, 0.45), CH_, 0.55, { face: 1 });
  }),

  // ======================= SCÈNE 2 — « Ma petite sœur de dix ans est devenue une adolescente, sous mes yeux… »
  P("s02p1", "Décor : embrasure de la porte, couloir chaud derrière | Personnages : Lila, 10 ans, qui fait signe | Action/expressions : sourire, couettes qui bougent | Caméra : plan moyen fixe légèrement orbital | Lumière : contre-jour chaud, ombre longue vers la chambre | Effets : vignette | Son : nappe froide", 1, 0, (c) => {
    const k = lisse(c.p);
    const a = act(c, "lila1");
    const t: V3 = a ? [a.p[0], 1.45, a.p[2]] : [X + 3.6, 1.45, 1.2];
    return etat(c, viser([X + 0.5 + 0.8 * k, 1.35, 1.3 - 0.25 * k], t, 44, 0.5, 0.42), CH_, 0.55);
  }),
  P("s02p2", "Décor : seuil de la chambre, même cadrage serré | Personnages : Lila → Lila, 15 ans (pull jaune, queue de cheval, mêmes yeux verts) | Action/expressions : flash, elle grandit d'un coup devant l'objectif | Caméra : gros plan fixe sur son visage | Lumière : contre-jour chaud puis flash cyan | Effets : flash cyan, secousse, vignette | Son : whoosh du temps", 1, 6, (c) => {
    const a = act(c, "lila1") ?? act(c, "lila2");
    const base: V3 = a ? [a.p[0], 0, a.p[2]] : [X + 3.6, 0, 1.2];
    return etat(c, viser([base[0] - 3.6, 1.7, base[2] + 0.3], [base[0], 1.8, base[2]], 40, 0.5, 0.42), CH_, 0.6);
  }),
  P("s02p3", "Décor : chambre dans l'ombre, lueur de l'écran | Personnages : Noa | Action/expressions : visage stupéfait, pupilles qui reflètent l'écran | Caméra : gros plan de face, très légère poussée | Lumière : cyan par en dessous | Effets : vignette | Son : battement de cœur", 1, 10, (c) => {
    const k = lisse(c.p);
    return etat(c, viser(devant(c, "noa", mel(2.5, 2.1, k), 0.15, 0.1), oeil(c, "noa"), 34, 0.5, 0.4), CH_, 0.6);
  }),
  P("s02p4", "Décor : écran verrouillé, 2031 | Personnages : mains de Noa | Action/expressions : un autre message arrive : « 1 nouveau message » | Caméra : gros plan sur l'écran, contre-plongée oblique | Lumière : écran cyan | Effets : poussière dans le faisceau | Son : notification douce", 1, 13, (c) => {
    const k = lisse(c.p);
    const ph = tel(c);
    return etat(c, viser([ph[0] + 1.2 - 0.25 * k, ph[1] - 0.5 + 0.2 * k, ph[2] - 0.9 + 0.2 * k], plus(ph, [0, 0.04, 0]), mel(38, 30, k), 0.5, 0.42), CH_, 0.55, { face: 1 });
  }),
  P("s02p5", "Décor : embrasure de la porte | Personnages : papa (chemise bleue) | Action/expressions : il apparaît, cheveux noirs puis gris au flash | Caméra : plan moyen fixe, léger travelling | Lumière : contre-jour chaud, flash cyan | Effets : flash cyan, secousse | Son : whoosh du temps", 1, 16, (c) => {
    const k = lisse(c.p);
    const a = act(c, "papa1") ?? act(c, "papa2");
    const t: V3 = a ? [a.p[0], 2.3, a.p[2]] : [X + 3.7, 2.3, 2.65];
    return etat(c, viser([X + 0.2 + 0.5 * k, 2.0, 1.4 + 0.2 * k], t, 46, 0.5, 0.42), CH_, 0.55);
  }),
  P("s02p6", "Décor : embrasure de la porte | Personnages : papa, plan serré sur la tête | Action/expressions : ses cheveux blanchissent d'un coup | Caméra : gros plan légèrement en contre-plongée | Lumière : flash cyan sur fond chaud | Effets : flash cyan, secousse | Son : whoosh du temps, cœur", 1, 21, (c) => {
    const k = lisse(c.p);
    const a = act(c, "papa2") ?? act(c, "papa3") ?? act(c, "papa1");
    const base: V3 = a ? [a.p[0], 0, a.p[2]] : [X + 3.7, 0, 2.65];
    return etat(c, viser([base[0] - 3.1 + 0.3 * k, 2.5, base[2] - 0.5], [base[0], 2.7, base[2]], 34, 0.5, 0.42), CH_, 0.6);
  }),
  P("s02p7", "Décor : chambre, la famille a vieilli dans l'embrasure | Personnages : Noa de dos au premier plan, Lila ado et papa aux cheveux blancs au fond | Action/expressions : Noa n'a pas bougé, immobile | Caméra : poussée lente derrière son épaule | Lumière : cyan sur lui, couloir orange derrière | Effets : vignette | Son : nappe froide, battement de cœur", 1, 23, (c) => {
    const k = lisse(c.p);
    return etat(c, viser([X - 3.6 + 0.8 * k, 1.95, 3.0 - 0.1 * k], [X + 2.6, 2.0, 1.9], mel(48, 42, k), 0.5, 0.42), CH_, 0.6);
  }),
  P("s02p8", "Décor : chambre sombre | Personnages : Noa | Action/expressions : regard vide, « toujours quinze ans » | Caméra : gros plan de face, 3/4, zoom lent | Lumière : cyan par en dessous | Effets : vignette appuyée | Son : cœur lent", 1, 28, (c) => {
    const k = lisse(c.p);
    return etat(c, viser(devant(c, "noa", mel(1.9, 1.5, k), -0.1, -0.8), oeil(c, "noa"), mel(32, 28, k), 0.5, 0.42), CH_, 0.7);
  }),
  P("s02p9", "Décor : écran du téléphone, fil d'actualité | Personnages : pouce de Noa | Action/expressions : le pouce fait défiler sans fin | Caméra : très gros plan sur le pouce et l'écran | Lumière : écran cyan | Effets : poussière | Son : glissements du pouce", 1, 32, (c) => {
    const k = lisse(c.p);
    const ph = tel(c);
    return etat(c, viser([ph[0] + 1.2 - 0.2 * k, ph[1] + 0.85 - 0.15 * k, ph[2] - 0.8 + 0.15 * k], plus(ph, [0, 0.06, 0.0]), mel(34, 26, k), 0.5, 0.45), CH_, 0.6, { face: 1 });
  }),

  // ======================= SCÈNE 3 — « Une vidéo de trente secondes, et le fauteuil de grand-mère était vide… »
  P("s03p1", "Décor : salon, canapé, télé éteinte | Personnages : Noa sur le canapé | Action/expressions : la vidéo de trente secondes défile sur l'écran, le compte à rebours file | Caméra : gros plan sur l'écran, puis grue montante qui révèle Noa sur le canapé | Lumière : cyan de l'écran dans un salon orangé | Effets : poussière dans le faisceau | Son : nappe froide, glissements du pouce", 2, 0, (c) => {
    const k = lisse(c.p);
    const ph = tel(c);
    return etat(c, viser(mel3([ph[0] + 0.9, ph[1] + 0.95, ph[2] - 1.4], [XS + 0.9, 2.9, 0.6], k), mel3(plus(ph, [0, 0.1, 0]), [XS - 0.3, 1.6, 3.2], k), mel(34, 50, k), 0.5, 0.42), SA_, 0.55, { face: 1 - 0.6 * k });
  }),
  P("s03p2", "Décor : salon, fauteuil de grand-mère au couchant, plaid orange | Personnages : grand-mère (lunettes, plaid sur les genoux) | Action/expressions : elle sourit doucement ; au flash, le fauteuil est vide, le plaid plié | Caméra : poussée lente jusqu'au fauteuil vide | Lumière : rayon orange de la fenêtre, flash cyan | Effets : flash cyan, vignette | Son : whoosh du temps, silence", 2, 5, (c) => {
    const k = lisse(c.p);
    return etat(c, viser(mel3([XS - 0.2, 1.95, -3.8], [XS + 0.8, 1.85, -3.3], k), [FAUTEUIL[0] - 0.1, 1.5, FAUTEUIL[2] + 0.1], mel(56, 46, k), 0.5, 0.42), SA_, 0.55);
  }),
  P("s03p3", "Décor : salon | Personnages : Noa | Action/expressions : il comprend, les yeux écarquillés, les larmes montent | Caméra : gros plan de face, zoom nerveux | Lumière : cyan par en dessous | Effets : vignette appuyée | Son : battement de cœur", 2, 12, (c) => {
    const k = lisse(c.p);
    return etat(c, viser(devant(c, "noa", mel(2.2, 1.7, k), 0.1, 0.3), oeil(c, "noa"), mel(34, 28, k), 0.5, 0.4), SA_, 0.7);
  }),
  P("s03p4", "Décor : écran du téléphone, le compteur d'année s'emballe jusqu'à 2085 | Personnages : mains de Noa | Action/expressions : « pendant que je regarde l'écran… » | Caméra : plan épaule, rapprochement nerveux | Lumière : écran cyan | Effets : jour et nuit défilent dans la pièce | Son : horloge qui accélère", 2, 15, (c) => {
    const k = lisse(c.p);
    const ph = tel(c);
    return etat(c, viser([ph[0] + 1.0 - 0.3 * k, ph[1] + 1.0 - 0.15 * k, ph[2] - 1.5 + 0.2 * k], plus(ph, [0, 0.1, 0]), mel(36, 28, k), 0.5, 0.45), SA_, 0.6, { face: 1 });
  }),
  P("s03p5", "Décor : salon, horloge murale dont les aiguilles tournent follement, télé éteinte | Personnages : (personne : la pièce continue sans lui) | Action/expressions : « le monde continue sans moi » | Caméra : travelling arrière lent, de l'horloge vers la pièce | Lumière : la lumière de la pièce change de couleur d'une seconde à l'autre | Effets : jour et nuit en éclair, vignette | Son : horloge qui s'emballe", 2, 20, (c) => {
    const k = freine(c.p);
    return etat(c, viser(mel3([XS - 0.2, 2.4, -0.4], [XS - 0.2, 3.0, 2.4], k), mel3([XS - 0.2, 3.0, -4.6], [XS - 0.2, 2.3, -4.0], lisse(entre(c.p, 0.3, 1))), mel(50, 60, k), 0.5, 0.42), SA_, 0.6);
  }),

  // ======================= SCÈNE 4 — « J'ai éteint le téléphone et j'ai couru dehors… »
  P("s04p1", "Décor : salon | Personnages : Noa | Action/expressions : il éteint l'écran : le noir se fait, plus un bruit | Caméra : gros plan sur l'écran qui s'éteint, recul brusque | Lumière : l'écran cyan disparaît, la pièce plonge dans l'ombre | Effets : extinction | Son : silence net", 3, 0, (c) => {
    const k = lisse(c.p);
    const ph = tel(c, "noa", D(c).mot(3, 0));
    return etat(c, viser([ph[0] + 0.8 + 0.5 * k, ph[1] + 0.9 + 0.2 * k, ph[2] - 1.4 - 0.5 * k], plus(ph, [0, 0.1, 0]), mel(30, 36, k), 0.5, 0.45), SA_, 0.7, { face: 1 });
  }),
  P("s04p2", "Décor : rue de 2085 au couchant, façade de la maison de Noa | Personnages : Noa | Action/expressions : la porte s'ouvre, il en jaillit en courant vers l'objectif | Caméra : travelling arrière devant lui | Lumière : orange du couchant, ombres longues | Effets : brouillard orangé | Son : porte, pas de course, vent", 3, 4, (c) => {
    const k = lisse(c.p);
    return etat(c, viser([1.2 + 0.6 * k, 1.5, 14.0], mel3([0.1, 1.7, 3.0], plus(pos(c, "noaR"), [0, 1.5, 0]), lisse(entre(c.p, 0.1, 0.65))), mel(52, 44, k), 0.5, 0.42), RUE_, 0.45);
  }),
  P("s04p3", "Décor : route de 2085, voitures arrondies aux couleurs vives, lampadaires étranges | Personnages : (Noa au loin sur le trottoir) | Action/expressions : les voitures flottantes défilent | Caméra : travelling latéral bas face au couchant | Lumière : contre-jour orange, halos des phares | Effets : brouillard orangé, éclat du soleil | Son : sifflement des voitures", 3, 8, (c) => {
    const k = lisse(c.p);
    return etat(c, viser([mel(-9, 7, k), 1.0, 21.8], [mel(-1, 3, k), 1.5, 13.5], 52, 0.5, 0.44), RUE_, 0.4);
  }),
  P("s04p4", "Décor : trottoir de 2085, passants aux couleurs vives | Personnages : inconnus (cheveux turquoise, manteau rose…), Noa figé au milieu | Action/expressions : les gens passent sans le voir | Caméra : plan moyen depuis la pelouse, léger mouvement | Lumière : couchant orange | Effets : vignette | Son : pas, voix lointaines", 3, 12, (c) => {
    const k = lisse(c.p);
    return etat(c, viser([mel(6.8, 4.6, k), 1.7, 1.8], [0.2, 1.9, 8.6], 52, 0.5, 0.42), RUE_, 0.5);
  }),
  P("s04p5", "Décor : la maison de Noa au bout du trottoir, vieillie, fenêtres allumées | Personnages : Noa de dos, une silhouette sur le perron | Action/expressions : il se retourne vers chez lui, la vieille dame l'attend | Caméra : épaule, poussée vers la maison | Lumière : contre-jour orange | Effets : brouillard orangé | Son : vent, nappe", 3, 15, (c) => {
    const k = lisse(c.p);
    return etat(c, viser([2.4 - 0.6 * k, 2.3, mel(12.6, 11.0, k)], [0.0, 2.3, 0.5], mel(50, 44, k), 0.5, 0.42), RUE_, 0.5);
  }),
  P("s04p6", "Décor : perron de la maison, auvent, lanterne | Personnages : la vieille dame (cheveux blancs, châle jaune, canne) | Action/expressions : elle attend, immobile, le regard doux | Caméra : plan serré, poussée lente vers son visage | Lumière : couchant orange sur le visage | Effets : vignette | Son : vent", 3, 21, (c) => {
    const k = lisse(c.p);
    const o = oeil(c, "lila3");
    return etat(c, viser([mel(-1.9, -1.0, k), 2.2, mel(5.6, 4.6, k)], [o[0], o[1] - 0.05, o[2]], mel(40, 32, k), 0.5, 0.4), RUE_, 0.5);
  }),

  // ======================= SCÈNE 5 — « Elle m'a dit : Tu as mis soixante ans à lever les yeux, grand frère. »
  P("s05p1", "Décor : perron au couchant | Personnages : la vieille dame | Action/expressions : elle parle, voix douce, expression apaisée et triste | Caméra : gros plan sur son visage | Lumière : orange chaud | Effets : vignette | Son : vent, nappe", 4, 5, (c) => {
    const k = lisse(c.p);
    return etat(c, viser(devant(c, "lila3", mel(2.9, 2.5, k), 0.0, 0.35), oeil(c, "lila3"), mel(30, 26, k), 0.5, 0.4), RUE_, 0.55);
  }),
  P("s05p2", "Décor : trottoir devant la maison | Personnages : Noa, resté adolescent | Action/expressions : visage figé, bouche entrouverte | Caméra : contre-champ, gros plan de face | Lumière : couchant sur son visage | Effets : vignette | Son : cœur", 4, 14, (c) => {
    const k = lisse(c.p);
    return etat(c, viser(devant(c, "noaR", mel(3.4, 2.9, k), 0.1, 0.3), oeil(c, "noaR"), 36, 0.5, 0.4), RUE_, 0.6);
  }),
  P("s05p3", "Décor : perron | Personnages : la vieille dame | Action/expressions : ses yeux verts, ceux de Lila, s'embuent | Caméra : très gros plan sur les yeux | Lumière : couchant | Effets : vignette appuyée | Son : choc sourd, nappe", 4, 17, (c) => {
    const k = lisse(c.p);
    return etat(c, viser(devant(c, "lila3", mel(2.3, 1.55, k), 0.0, 0.1), oeil(c, "lila3"), mel(26, 22, k), 0.5, 0.42), RUE_, 0.65);
  }),

  // ======================= SCÈNE 6 — « Mon écran s'est rallumé tout seul : Plus personne ne t'attend. »
  P("s06p1", "Décor : trottoir au couchant, la maison derrière | Personnages : Noa, téléphone éteint au bout du bras | Action/expressions : l'écran se rallume tout seul dans sa main, il le relève devant son visage, yeux écarquillés | Caméra : de la main vers le visage, mouvement vertical | Lumière : le cyan revient, froid contre l'orange | Effets : halo cyan | Son : bourdonnement d'écran, notification", 5, 0, (c) => {
    const k = lisse(c.p);
    const ph = telMain(c);
    const eo = oeil(c, "noaR");
    const cible = mel3(plus(ph, [0, 0.05, 0]), eo, lisse(entre(c.p, 0.45, 1)));
    return etat(c, viser([ph[0] - 0.8, mel(1.0, 2.0, k), ph[2] - 2.5], cible, mel(36, 32, k), 0.5, 0.42), RUE_, 0.5, { face: 1 });
  }),
  P("s06p2", "Décor : écran du téléphone | Personnages : Noa tient l'appareil | Action/expressions : la bannière « Plus personne ne t'attend. » s'écrit | Caméra : gros plan sur l'écran, poussée | Lumière : cyan violent | Effets : halo | Son : choc froid", 5, 7, (c) => {
    const k = lisse(c.p);
    const ph = telMain(c);
    return etat(c, viser([ph[0] - 0.45 + 0.1 * k, ph[1] + 0.1, ph[2] - mel(2.1, 1.7, k)], plus(ph, [0, 0.03, 0]), mel(27, 23, k), 0.5, 0.45), RUE_, 0.55, { face: 1 });
  }),
  P("s06p3", "Décor : perron et porte de la maison | Personnages : Noa (au premier plan, de dos), la vieille dame qui se retourne et rentre | Action/expressions : elle lui tourne le dos et pousse la porte | Caméra : contre-plongée sur Noa, la dame dans le fond | Lumière : couchant orange, halo cyan du téléphone | Effets : vignette | Son : pas de canne, porte", 5, 13, (c) => {
    const k = lisse(c.p);
    const a = act(c, "noaR");
    const b: V3 = a ? [a.p[0], 0, a.p[2]] : [0.2, 0, 6.2];
    return etat(c, viser([b[0] + mel(1.6, 1.2, k), 0.55, b[2] + mel(2.6, 2.2, k)], [0.0, mel(2.0, 2.2, k), 1.0], mel(46, 40, k), 0.5, 0.42), RUE_, 0.55);
  }),
  P("s06p4", "Décor : rue au crépuscule, façade de la maison de Noa | Personnages : Noa de dos au premier plan, la vieille dame qui entre | Action/expressions : la porte se referme sur elle, Noa reste seul | Caméra : contre-plongée, recul lent et montée | Lumière : orange mourant et halo cyan du téléphone | Effets : fondu au noir | Son : porte qui se ferme, silence, choc sourd", 5, 20, (c) => {
    const d = D(c);
    const k = lisse(c.p);
    const noir = lisse(entre(c.T, d.finNarration - 0.02, d.finNarration + 0.14));
    const a = act(c, "noaR");
    const b: V3 = a ? [a.p[0], 0, a.p[2]] : [0.2, 0, 6.2];
    const cam = viser([b[0] + mel(1.8, 3.0, k), mel(0.5, 1.5, k), b[2] + mel(4.8, 8.0, k)], [0.0, mel(2.3, 2.6, k), 1.0], mel(50, 56, k), 0.5, 0.44);
    return { ...etat(c, cam, RUE_, 0.65), fx: { vignette: 0.65, noir } };
  }),
];

/** Orbite : angle 0 = côté +z, hauteur absolue. */
function orbitePlan(centre: V3, rayon: number, angle: number, hauteur: number): V3 {
  return [centre[0] + Math.sin(angle) * rayon, hauteur, centre[2] + Math.cos(angle) * rayon];
}
void orb;
void PI;
void pos;
void CH_Z;
void PERRON_Y;
