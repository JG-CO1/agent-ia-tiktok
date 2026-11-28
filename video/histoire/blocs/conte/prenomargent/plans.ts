/**
 * « Prénom = argent » — mise en scène plan par plan (récit : histoires/recits/prenom-argent.json). Chaque plan démarre sur un mot
 * [scène, mot] (scène 1 = indice 0). Cinq lieux : la rue commerçante (jour), le stade, les toits et le studio de radio, la propriété
 * (château, villa, yacht), la même rue dans sa version ruinée. Le rythme s'accélère vers la vérité (plans courts) ; les trois images-clés
 * ont leur plan : les étagères vides (« rien à vous vendre »), les pièces qui s'envolent des portefeuilles (« un euro que perdait celui
 * qui disait mon prénom »), le silence et Maxime seul devant son compteur arrêté.
 */
import type { PlanGen } from "../../types";
import { D, P, entre, freine, lisse, mel, mel3, melCam, orb, plus, pos, rel, trav, viser, type Cam, type V3 } from "../cam";
import type { EtatConte } from "../lib";
import { CHATEAU, PODIUM, PR, PROP, RU, ST, STADE, TO, TOITS, VILLA, YACHT, ETUDE, BOUL, localBoutique } from "./monde";
import { CITOYENS } from "./histoire";
import { versMonde } from "../../geo";

const rue = (x: number, y: number, z: number): V3 => [x, y, z];
const ru = (x: number, y: number, z: number): V3 => RU([x, y, z]);
const st = (x: number, y: number, z: number): V3 => ST([x, y, z]);
const to = (x: number, y: number, z: number): V3 => TO([x, y, z]);
const pr = (x: number, y: number, z: number): V3 => PR([x, y, z]);

const FOG = {
  rue: ["#BFE6FF", 90, 380] as [string, number, number],
  rueSoir: ["#FFC48A", 70, 320] as [string, number, number],
  ruine: ["#9AA5B3", 26, 240] as [string, number, number],
  stade: ["#CDEBFF", 120, 460] as [string, number, number],
  toits: ["#CDEBFF", 130, 560] as [string, number, number],
  prop: ["#CDEBFF", 170, 760] as [string, number, number],
  propG: ["#9AA5B3", 120, 640] as [string, number, number],
};
const CIEL = { rue: "#38A8FF", soir: "#FF9C55", ruine: "#9AA5B3" };
const S = (cam: Cam, brouillard: [string, number, number], ciel: string, vignette = 0.3, extra: Partial<EtatConte> & { hud?: number } = {}): EtatConte => ({ cam, brouillard, ciel, fx: { vignette }, ...extra });
const flash = (T: number, t0: number, amp = 0.6, av = 0.05, ap = 0.4) => amp * entre(T, t0 - av, t0 + 0.03) * (1 - entre(T, t0 + 0.08, t0 + ap));
const t = (decor: string, perso: string, action: string, camera: string, lumiere: string, effets: string, son: string) => `Décor : ${decor} | Personnages : ${perso} | Action/expressions : ${action} | Caméra : ${camera} | Lumière : ${lumiere} | Effets : ${effets} | Son : ${son}`;
const NOIR = (c: { T: number }, d: { finNarration: number }) => lisse(entre(c.T, d.finNarration - 0.02, d.finNarration + 0.14));

/** Indice du citoyen le plus proche d'un point de la rue. */
const idx = (x: number, z: number) => {
  let best = 0;
  let bd = 1e9;
  CITOYENS.forEach((c, i) => {
    const d = (c.x - x) ** 2 + (c.z - z) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
};
const ID_A = idx(4.8, 11);
const ID_B = idx(-4.8, 7);
const ID_C = idx(4.8, 3);
const ID_D = idx(-4.8, -9);

export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « Dans cette ville, chaque fois que quelqu'un prononce ton prénom, tu gagnes un euro. Moi, je m'appelle Maxime, et j'étais fauché. »
  P("s01p1", t("rue commerçante ensoleillée aux auvents rayés et fanions, boutiques saturées", "un copain (casquette rouge, sweat orange) en gros plan", "il crie « MAXIME ! » bouche grande ouverte : une pièce d'or jaillit de sa bouche et file vers Maxime hors champ ; le compteur passe de 0 à 1 €", "plan rapproché de face, légère poussée avant", "plein soleil, ombres courtes et dures", "bulle « MAXIME ! », pièce d'or en vol, compteur en haut", "cri bref, tintement de pièce, « ding » du compteur"), 0, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "cop1", [0.8, mel(3.0, 2.8, k), mel(5.4, 4.6, k)]), rel(c, "cop1", [-0.1, 3.3, 0]), 46, 0.5, 0.56), FOG.rue, CIEL.rue, 0.3);
  }),
  P("s01p2", t("rue commerçante, vue depuis l'épaule de Maxime", "Maxime de dos au premier plan (sweat vert émeraude, cheveux noirs), un copain (sweat jaune) au fond", "le copain crie « MAXIME ! » : la pièce traverse la rue en arc jusqu'à Maxime ; « + 1 € » au-dessus de sa tête", "plan par-dessus l'épaule, caméra qui avance un peu", "plein soleil", "pièce d'or en arc, bulle « MAXIME ! », « + 1 € »", "cri, tintement, ding"), 0, 3, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([1.7, 3.5, 19.4], [1.3, 3.3, 18.4], k), [-0.3, 2.9, 8.5], 52, 0.5, 0.5), FOG.rue, CIEL.rue, 0.3);
  }),
  P("s01p3", t("rue commerçante, boutiques floues derrière", "Maxime (sweat vert émeraude) en gros plan de face", "il reçoit les pièces qui arrivent vers lui : surpris, puis grand sourire ; « + 1 € » jaillit au-dessus de sa tête", "gros plan de visage, léger recul", "plein soleil, ombre dure du nez", "pièces d'or qui passent au premier plan, « + 1 € » doré", "tintement de pièces, ding du compteur"), 0, 8, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.9, 3.0, 10.8], [0.6, 3.0, 10.4], k), [0.0, 2.65, 15], mel(40, 44, k), 0.5, 0.36), FOG.rue, CIEL.rue, 0.35);
  }),
  P("s01p4", t("rue commerçante : banque, café, boulangerie", "Maxime au centre de la chaussée, ses copains au loin", "il sourit, fier : le prénom qu'il porte rapporte un euro à chaque fois ; les pièces tombent vers lui", "orbite lente autour de lui, plan moyen", "plein soleil, ombres dures sur la chaussée", "pièces d'or, compteur en haut", "ambiance de rue, tintements"), 0, 14, (c) => {
    const k = lisse(c.p);
    return S(orb([0, 2.3, 15], [6.4, 5.4], [Math.PI - 0.55, Math.PI + 0.5], [3.0, 2.8], k, 46), FOG.rue, CIEL.rue, 0.3);
  }),
  P("s01p5", t("rue commerçante ensoleillée", "Maxime en plan taille, les mains aux poches retournées", "il tire ses poches : elles sont vides et trouées, mine triste (« fauché »)", "plan rapproché sur les poches, poussée lente", "plein soleil, ombres dures", "poches retournées en blanc sur le jean, compteur à quelques euros", "silence relatif, ambiance de rue"), 0, 18, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-2.3, 2.2, 11.3], [-1.7, 2.1, 11.9], k), [0.0, 1.6, 15], mel(44, 38, k), 0.5, 0.45), FOG.rue, CIEL.rue, 0.45);
  }),

  // ======================= SCÈNE 2 — « J'ai payé mes copains pour qu'ils crient « Maxime ! » toute la journée. Cent euros, puis mille. J'ai loué un stade : vingt mille personnes ont chanté mon prénom. »
  P("s02p1", t("rue commerçante", "Maxime (sweat vert) au premier plan, ses trois copains en ligne au fond de la rue", "Maxime les engage : les copains lèvent les bras, joyeux, prêts à crier", "plan large en plongée de trois quarts, descente lente", "plein soleil, ombres dures", "—", "ambiance de rue"), 1, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([9.0, 6.2, 27.0], [7.4, 5.4, 24.0], k), [0, 1.8, 11.0], 56, 0.5, 0.46), FOG.rue, CIEL.rue, 0.3);
  }),
  P("s02p2", t("rue commerçante", "les trois copains (casquette rouge, lunettes violettes, cheveux roux)", "ils crient « MAXIME ! » à tour de rôle, bouches ouvertes ; des gerbes de pièces d'or partent vers la caméra", "plan moyen de face, poussée lente vers eux", "plein soleil", "bulles « MAXIME ! », pluie de pièces d'or, compteur qui grimpe", "cris, tintements en rafale"), 1, 4, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.0, 3.1, 14.2], [0.0, 3.0, 12.4], k), [0.0, 2.6, 6.2], mel(66, 58, k), 0.5, 0.46), FOG.rue, CIEL.rue, 0.3);
  }),
  P("s02p3", t("rue commerçante, le soir tombe en un instant", "Maxime et ses copains qui crient sans relâche", "toute la journée en un plan : le ciel passe du bleu à l'orange, les pièces ne cessent de voler", "orbite rapide autour du groupe", "lumière dorée de fin de journée", "teinte orange, pluie de pièces", "cris, tintements"), 1, 11, (c) => {
    const k = lisse(c.p);
    return S(orb([0, 2.2, 10.5], [10, 9], [Math.PI * 0.1, Math.PI * 0.5], [4.6, 3.8], k, 76), FOG.rueSoir, CIEL.soir, 0.35, { fx: { vignette: 0.35, teinte: ["#FF8A30", 0.3 * lisse(k)] } });
  }),
  P("s02p4", t("rue commerçante", "Maxime (sweat vert) qui tend un billet de 100 € puis une liasse de 1 000 €", "il paie : « 100 € » puis « 1 000 € », grand sourire", "gros plan de la main et du billet, de face", "plein soleil", "billet lisible « 100 € » puis liasse « 1 000 € », compteur 100 puis 1 000", "froissement de billets, ding"), 1, 14, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([1.7, 2.8, 11.6], [1.3, 2.5, 11.9], k), [0.55, 2.15, 14.3], mel(46, 42, k), 0.5, 0.42), FOG.rue, CIEL.rue, 0.3);
  }),
  P("s02p5", t("stade vide, pelouse rayée, scène dorée au centre", "Maxime en costume doré et lunettes de soleil, seul sur la scène", "il se tient bras en V devant les gradins déserts", "grue ascendante : de ses bottes jusqu'au plan large du stade", "grand soleil, gradins rouges et verts", "—", "souffle de vent, écho du stade vide"), 1, 18, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(st(3.4, 2.4, 14), st(16, 24, 44), freine(k)), mel3(st(0, 3.0, 0), st(0, 6, -6), k), mel(52, 66, k), 0.5, 0.46), FOG.stade, CIEL.rue, 0.3);
  }),
  P("s02p6", t("stade plein : gradins rouges et verts, bannières « MAXIME », écran géant", "des milliers de spectateurs en blocs, Maxime doré sur la scène", "vingt mille personnes chantent, bras levés ; une pluie de pièces d'or file des gradins vers Maxime", "travelling latéral rapide à hauteur de pelouse", "grand soleil, flashs d'appareils", "pluie de pièces, flashs blancs, compteur qui s'emballe", "foule qui chante (voyelles), stade en liesse"), 1, 23, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(st(17, 4.6, -20), st(17, 4.8, 12), k), mel3(st(-40, 8.5, -2), st(-40, 8.5, 12), k), 76, 0.5, 0.48), FOG.stade, CIEL.rue, 0.25);
  }),
  P("s02p7", t("premiers rangs du stade", "des fans en blocs (maillots de couleurs), bouches ouvertes", "ils chantent « MAXIME ! » ; bulles et pièces d'or au-dessus des têtes", "plan rapproché des visages depuis la pelouse", "grand soleil, flashs", "bulles « MAXIME ! », pièces d'or, flashs", "foule qui chante"), 1, 27, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(st(-29.0, 2.3, 4.0), st(-29.6, 2.6, 2.4), k), st(-36.0, 5.0, mel(3.4, 2.4, k)), mel(50, 44, k), 0.5, 0.45), FOG.stade, CIEL.rue, 0.3);
  }),

  // ======================= SCÈNE 3 — « J'ai installé des haut-parleurs sur les toits et même une chanson à la radio : « Maxime, Maxime ! » Chaque seconde, mon compte en banque explosait. »
  P("s03p1", t("toit d'une tour, rangée de grosses enceintes noires et roses", "aucun", "les haut-parleurs s'allument et pulsent, des ondes dorées en sortent", "contre-plongée qui monte vers les enceintes", "ciel bleu éclatant, ombres dures", "ondes concentriques dorées, bulles « MAXIME ! » qui s'envolent", "basse qui pulse, chant de foule diffusé"), 2, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(to(-36, 5, 26), to(-35, 15, 21), k), to(-37, 29.5, 3), mel(60, 56, k), 0.5, 0.42), FOG.toits, CIEL.rue, 0.3);
  }),
  P("s03p2", t("toits de la ville : tours colorées hérissées d'enceintes", "aucun", "toutes les enceintes des toits pulsent ensemble sur la ville", "orbite aérienne au-dessus des toits", "plein soleil, ombres dures", "ondes dorées, bulles « MAXIME ! »", "basse puissante, foule qui chante au loin"), 2, 5, (c) => {
    const k = lisse(c.p);
    return S(orb(to(0, 26, 0), [66, 56], [-0.5, 0.3], [46, 40], k, 60), FOG.toits, CIEL.rue, 0.3);
  }),
  P("s03p3", t("studio de radio vitré sur le toit, néon « ON AIR » et enseigne « RADIO MAXIME FM »", "le DJ (casquette noire, lunettes jaunes) à la console", "il lance la chanson, le néon rouge s'allume", "plan moyen à travers la vitre, léger travelling avant", "néons violets et rose, éclat rouge du ON AIR", "néon qui s'allume, halo rouge", "jingle radio, basse, chant de foule"), 2, 9, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(to(2.8, 33.0, 20.5), to(2.2, 32.9, 17.5), k), to(0, 33.7, 0), mel(42, 38, k), 0.5, 0.46), FOG.toits, CIEL.rue, 0.3);
  }),
  P("s03p4", t("studio de radio, micro et console lumineuse", "le DJ de face", "il chante « Maxime, Maxime ! » dans le micro, bouche grande ouverte, la tête qui dodeline", "gros plan de face dans le studio", "néons violets, console verte et jaune", "vignette", "voix de foule, basse"), 2, 16, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(to(-0.9, 32.2, 4.4), to(-0.5, 32.0, 3.6), k), to(0, 31.9, -0.7), mel(36, 32, k), 0.5, 0.38), FOG.toits, CIEL.rue, 0.4);
  }),
  P("s03p5", t("rue commerçante pleine à craquer, banque et boutiques", "la rue entière : des dizaines de passants qui chantent bouche ouverte, yeux vides", "ils crient « MAXIME ! » ; les pièces d'or filent au-dessus des têtes vers Maxime au fond", "travelling avant rapide au centre de la chaussée", "plein soleil", "bulles « MAXIME ! », pluie de pièces, compteur qui explose", "foule qui chante, tintements"), 2, 17, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(rue(0.0, 3.2, 27.5), rue(0.0, 3.4, 15), k), rue(0.0, 3.6, mel(-30, -45, k)), mel(64, 58, k), 0.5, 0.46), FOG.rue, CIEL.rue, 0.35);
  }),
  P("s03p6", t("podium doré au bout de la rue", "Maxime (costume doré, lunettes de soleil) sur le podium", "il lève les bras, une pluie de pièces d'or s'abat sur lui, bouche ouverte de surprise", "plan rapproché de face, léger recul", "plein soleil, éclats d'or", "pluie de pièces, compteur en haut qui s'emballe", "tintements en cascade, chant de foule"), 2, 20, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(rue(0.6, 3.7, -58.5), rue(1.0, 3.9, -57.2), k), rue(0.0, 4.1, -66), mel(44, 50, k), 0.5, 0.45), FOG.rue, CIEL.rue, 0.35);
  }),
  P("s03p7", t("façade de la banque : écran lumineux du compte de Maxime", "aucun", "le chiffre explose : une gerbe de pièces d'or jaillit de l'écran", "plan large de face sur l'écran de la banque", "plein soleil, éclat doré", "flash doré, explosion de pièces", "explosion de tintements, impact"), 2, 26, (c) => {
    const d = D(c);
    const k = lisse(c.p);
    return S(viser(mel3([9.8, 8.4, 3.0], [9.4, 8.6, 1.5], k), [-11, 9.8, 1.0], 74, 0.5, 0.42), FOG.rue, CIEL.rue, 0.35, { hud: 0, fx: { vignette: 0.35, flash: ["#FFE27A", flash(c.T, d.ev.explose, 0.5, 0.03, 0.34)] } });
  }),

  // ======================= SCÈNE 4 — « J'ai acheté une villa, un yacht, un château. La ville entière chantait mon nom, comme hypnotisée. Un matin, la boulangère a refusé mon argent : « Je n'ai plus rien à vous vendre. » »
  P("s04p1", t("propriété : villa blanche moderne, piscine turquoise, palmiers", "Maxime (costume doré, lunettes de soleil) au bord de la piscine", "il ouvre les bras devant sa villa", "descente lente face à la villa, piscine au premier plan", "grand soleil, reflets dorés", "scintillements", "ambiance de luxe, vagues lointaines"), 3, 1, (c) => {
    const k = lisse(c.p);
    const vla = PR(VILLA);
    const A = versMonde(vla, 0.35, [mel(-22, -17, k), mel(7.0, 4.6, k), 38]);
    return S(viser(A, versMonde(vla, 0.35, [-12, 3.2, 11]), mel(52, 46, k), 0.5, 0.46), FOG.prop, CIEL.rue, 0.3);
  }),
  P("s04p2", t("ponton et mer bleue, yacht blanc à liseré d'or « MAXIME I »", "Maxime sur le pont avant du yacht", "il se tient bras en V sur son yacht", "travelling le long de la coque depuis le ponton", "grand soleil, reflets sur l'eau", "scintillements sur l'eau", "clapotis, ambiance de luxe"), 3, 4, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(pr(112, 3.6, 66), pr(112, 4.6, 36), k), mel3(pr(138, 5.6, 40), pr(138, 6.6, 33), k), 56, 0.5, 0.45), FOG.prop, CIEL.rue, 0.3);
  }),
  P("s04p3", t("château d'or aux toits magenta, balcon doré", "Maxime au balcon, bras en V", "il domine sa pelouse depuis le balcon du château", "contre-plongée depuis la pelouse, grue ascendante", "grand soleil, éclats d'or", "scintillements dorés", "fanfare de luxe, ambiance"), 3, 7, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(pr(6, 1.8, 112), pr(4, 7.5, 104), k), pr(0, 16.2, 64), mel(62, 54, k), 0.5, 0.42), FOG.prop, CIEL.rue, 0.3);
  }),
  P("s04p4", t("rue commerçante pleine, soleil éclatant", "la ville entière : foule serrée, bouches ouvertes, yeux vides", "tous chantent « MAXIME ! » d'une même voix, bras ballants, comme hypnotisés", "travelling avant dans l'allée, plan large", "plein soleil", "bulles « MAXIME ! », pièces d'or, vignette", "chant de foule en nappe de voyelles"), 3, 9, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(rue(0.2, 3.2, 27.0), rue(0.2, 3.0, 19.2), k), rue(0.0, 3.0, mel(-20, -30, k)), mel(64, 58, k), 0.5, 0.46), FOG.rue, CIEL.rue, 0.4);
  }),
  P("s04p5", t("rue commerçante, foule au second plan", "un passant en gros plan (yeux en spirale)", "il chante sans cligner, bouche ouverte : des spirales d'hypnose apparaissent dans ses yeux", "gros plan de face, poussée lente", "plein soleil, vignette", "spirales hypnotiques dans les yeux, vignette", "voix de foule, bourdon qui s'installe"), 3, 14, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, `v${ID_A}`, [0.5, mel(2.8, 2.65, k), mel(3.4, 2.6, k)]), rel(c, `v${ID_A}`, [0, 2.45, 0]), mel(38, 33, k), 0.5, 0.4), FOG.rue, CIEL.rue, 0.5);
  }),
  P("s04p6", t("rue commerçante, vers la boulangerie à auvent rouge et blanc", "Maxime (costume doré, lunettes de soleil) qui marche", "il traverse la rue d'un pas assuré, un matin, vers la boulangerie", "travelling latéral qui le suit", "lumière claire du matin", "—", "pas, chant lointain"), 3, 16, (c) => {
    const k = lisse(c.p);
    const m = pos(c, "maxMatin");
    return S(viser(mel3([m[0] - 7.0, 3.2, 29.4], [m[0] - 5.4, 3.0, 28.6], k), [m[0], 2.4, m[2]], 50, 0.5, 0.46), FOG.rue, "#4DB4FF", 0.35);
  }),
  P("s04p7", t("boulangerie : comptoir rouge, étagères, caisse", "la boulangère (toque, tablier blanc) derrière son comptoir ; Maxime de dos au premier plan", "Maxime lui tend une liasse de 1 000 € ; elle la repousse de la main et secoue la tête, le visage fermé", "plan rapproché sur la boulangère par-dessus l'épaule de Maxime, poussée lente", "lumière du matin", "—", "pas, caisse enregistreuse, chant lointain"), 3, 20, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([9.0, 3.5, 23.9], [9.6, 3.5, 23.5], k), localBoutique(BOUL, [-0.6, 3.1, -5.3]), mel(44, 36, k), 0.5, 0.44), FOG.rue, "#4DB4FF", 0.4);
  }),
  P("s04p8", t("boulangerie : comptoir rouge, étagères dont les derniers pains disparaissent", "la boulangère (toque blanche) et Maxime de dos", "elle dit « Je n'ai plus rien à vous vendre » : les derniers pains disparaissent, le magasin est vide", "gros plan sur son visage puis recul rapide qui révèle les étagères nues", "lumière du matin, ombres dures", "vignette, dernier pain qui disparaît", "voix, silence qui tombe, caisse vide"), 3, 25, (c) => {
    const k = lisse(freine(c.p));
    return S(viser(mel3([11.6, 3.4, 21.0], [6.6, 3.0, 20.4], k), mel3(localBoutique(BOUL, [-0.6, 3.2, -5.3]), localBoutique(BOUL, [0.3, 3.5, -8.0]), k), mel(34, 50, k), 0.5, 0.46), FOG.rue, "#4DB4FF", 0.45);
  }),

  // ======================= SCÈNE 5 — « J'ai regardé les rues : magasins vides, portefeuilles à plat. Chaque euro que je gagnais, c'était un euro que perdait celui qui disait mon prénom. »
  P("s05p1", t("même rue, devenue grise : rideaux baissés, boulangerie fermée", "Maxime (costume doré) seul devant la boulangerie fermée", "il se retourne et regarde la rue, inquiet, puis effaré", "gros plan de face qui glisse derrière son épaule vers la rue", "ciel gris, couleurs éteintes, seul l'or reste vif", "dessaturation brutale", "vent, silence, chant lointain"), 4, 1, (c) => {
    const k = lisse(entre(c.p, 0.25, 0.95));
    const a = viser(rel(c, "maxRuine", [0.5, 2.65, 4.3]), rel(c, "maxRuine", [0, 2.5, 0]), 38, 0.5, 0.4);
    const b = viser(rel(c, "maxRuine", [-2.8, 3.1, -3.4]), ru(-3, 2.4, 6), 54, 0.5, 0.44);
    return S(melCam(a, b, k), FOG.ruine, CIEL.ruine, 0.5);
  }),
  P("s05p2", t("rue grise : magasins aux rideaux de fer baissés, panneaux « FERMÉ »", "la foule qui chante dans la rue, yeux en spirale", "tous les commerces sont fermés, rideaux baissés, panneaux « FERMÉ »", "travelling latéral le long des vitrines", "ciel gris, lumière froide", "dessaturation", "vent, bourdon grave"), 4, 5, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ru(2.4, 3.0, 42), ru(2.4, 3.0, 24), k), mel3(ru(-11, 2.6, 36), ru(-11, 2.6, 18), k), 58, 0.5, 0.46), FOG.ruine, CIEL.ruine, 0.4);
  }),
  P("s05p3", t("rue grise, un passant au premier plan", "un passant (yeux en spirale) qui tient son portefeuille grand ouvert devant lui", "le portefeuille est vide : « 0 € », poches retournées ; il continue de chanter", "plan rapproché de face sur le portefeuille et le visage", "lumière froide et plate", "portefeuille « 0 € » lisible, spirales dans les yeux", "chant monotone, vent"), 4, 7, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, `r${ID_B}`, [0.35, mel(2.1, 2.0, k), mel(3.8, 3.2, k)]), rel(c, `r${ID_B}`, [0, 1.95, 0]), mel(46, 42, k), 0.5, 0.42), FOG.ruine, CIEL.ruine, 0.45);
  }),
  P("s05p4", t("rue grise vue du ras du sol", "la foule qui chante, yeux vides, portefeuilles à plat", "des pièces d'or s'envolent de leurs poches et de leurs portefeuilles et fusent vers Maxime", "plan bas, face aux pièces qui arrivent sur la caméra", "lumière froide, l'or de chaque pièce ressort", "trajectoires de pièces d'or visibles, bulles « MAXIME ! »", "tintements en rafale, chant"), 4, 10, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ru(5.2, 1.6, 24.6), ru(4.8, 1.9, 24.0), k), mel3(ru(0.0, 3.0, 6), ru(0.0, 2.8, 2), k), mel(66, 60, k), 0.5, 0.5), FOG.ruine, CIEL.ruine, 0.4);
  }),
  P("s05p5", t("rue grise, passant en plan rapproché", "un passant, bouche ouverte, portefeuille vide devant lui", "il crie « MAXIME ! » : une pièce d'or sort de son portefeuille et s'envole", "gros plan sur le portefeuille et le visage, plongée légère", "lumière froide, pièce d'or éclatante", "pièce d'or, bulle « MAXIME ! »", "cri, tintement"), 4, 15, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, `r${ID_C}`, [-1.3, mel(2.5, 2.2, k), mel(4.4, 3.6, k)]), rel(c, `r${ID_C}`, [0, 2.0, 0]), mel(46, 42, k), 0.5, 0.45), FOG.ruine, CIEL.ruine, 0.45);
  }),
  P("s05p6", t("rue grise en plongée", "toute la foule de la ville, bouches ouvertes", "chacun lance son « MAXIME ! » et perd une pièce qui vole vers Maxime", "plongée rapide qui descend sur la foule", "lumière froide, pièces d'or vives", "bulles « MAXIME ! », fleuves de pièces d'or, compteur", "chant, tintements"), 4, 18, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ru(3.2, 10.5, 29), ru(2.8, 6.8, 26.5), k), ru(0, 0.8, mel(8, 4, k)), mel(58, 54, k), 0.5, 0.46), FOG.ruine, CIEL.ruine, 0.4);
  }),
  P("s05p7", t("rue grise", "un passant de profil, bouche ouverte", "il dit « MAXIME ! » : sa bulle, puis l'euro qui quitte sa poche et file vers Maxime", "plan rapproché de profil, travelling latéral", "lumière froide", "bulle « MAXIME ! », pièce d'or en vol, éclat blanc bref", "cri, tintement, ding"), 4, 22, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, `r${ID_D}`, [mel(4.4, 3.8, k), 2.8, mel(1.6, 2.2, k)]), rel(c, `r${ID_D}`, [0, 2.7, 0.1]), 44, 0.5, 0.5), FOG.ruine, CIEL.ruine, 0.5, { fx: { vignette: 0.5, flash: ["#FFFFFF", flash(c.T, D(c).mot(4, 23), 0.3)] } });
  }),

  // ======================= SCÈNE 6 — « Ils étaient tous ruinés, et ils chantaient encore. J'étais l'homme le plus riche d'une ville morte, et plus personne ne disait mon prénom. Combien vendrais-tu le tien ? »
  P("s06p1", t("ville grise vue d'en haut : rues vides, rideaux baissés", "la foule en rangs, tournée vers le centre", "ils sont tous ruinés et pourtant debout, bouches ouvertes", "grue descendante sur la rue", "ciel de plomb, couleurs mortes", "vignette", "bourdon grave, chant lointain"), 5, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ru(0, 40, 66), ru(0, 22, 48), k), ru(0, 0, mel(18, 14, k)), mel(64, 60, k), 0.5, 0.46), FOG.ruine, CIEL.ruine, 0.45);
  }),
  P("s06p2", t("rue grise, au cœur de la foule", "des dizaines d'habitants aux yeux en spirale", "ils chantent encore « MAXIME ! » alors que leurs portefeuilles sont vides ; les pièces fusent toujours", "orbite lente à hauteur de visage", "lumière froide, pièces d'or vives", "bulles « MAXIME ! », pièces d'or, vignette", "chant monotone, tintements"), 5, 4, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ru(-0.6, 3.0, 26.4), ru(0.8, 3.0, 28.4), k), mel3(ru(4.6, 2.8, 38), ru(5.2, 2.8, 34), k), 52, 0.5, 0.46), FOG.ruine, CIEL.ruine, 0.5);
  }),
  P("s06p3", t("château d'or dans une plaine grise", "Maxime seul au balcon, lunettes de soleil enlevées", "il se tient immobile, les mains sur la balustrade, le regard vide", "contre-plongée depuis la pelouse, grue ascendante", "ciel gris, l'or du château seul garde sa couleur", "dessaturation (seul l'or reste)", "vent, silence"), 5, 8, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(pr(5, 3.0, 138), pr(3, 8.0, 124), k), pr(0, 17.0, 62), mel(50, 44, k), 0.5, 0.45), FOG.propG, CIEL.ruine, 0.5);
  }),
  P("s06p4", t("balcon doré, plaine grise puis ville morte au loin", "Maxime de dos, appuyé à la balustrade", "il regarde la ville qu'il a vidée", "plan par-dessus l'épaule, lent travelling avant", "ciel gris, l'or du balcon", "dessaturation", "vent"), 5, 14, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(pr(-2.3, 19.8, 59.6), pr(-1.9, 19.6, 60.6), k), pr(0.3, 10.5, 120), 60, 0.5, 0.46), FOG.propG, CIEL.ruine, 0.5);
  }),
  P("s06p5", t("rue grise, plan large depuis le centre", "la foule entière de la ville", "le silence tombe : toutes les bouches se ferment, les bras retombent, les pièces cessent de voler", "plan fixe large avec lente poussée", "lumière froide", "vignette, compteur qui s'arrête", "chant qui s'éteint, silence total"), 5, 16, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(ru(2.6, 3.0, 17.8), ru(2.0, 3.0, 16.0), k), ru(-1.4, 2.6, mel(4, 1, k)), mel(54, 48, k), 0.5, 0.46), FOG.ruine, CIEL.ruine, 0.5);
  }),
  P("s06p6", t("balcon doré", "Maxime en gros plan, sans lunettes, les larmes aux yeux", "plus personne ne dit son prénom : il baisse la tête, le compteur reste figé en rouge", "gros plan de face, poussée très lente", "lumière froide, vignette forte", "compteur arrêté (rouge), vignette", "silence, souffle"), 5, 20, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "maxBalcon2", [0.2, mel(2.7, 2.6, k), mel(3.8, 3.1, k)]), rel(c, "maxBalcon2", [0, 2.45, 0]), mel(40, 33, k), 0.5, 0.4), FOG.propG, CIEL.ruine, 0.6);
  }),
  P("s06p7", t("château d'or, plaine grise, ville morte", "Maxime minuscule sur son balcon, seul", "il reste seul, l'homme le plus riche d'une ville morte", "grand recul aérien", "ciel de plomb, lueur dorée", "dessaturation, vignette", "vent, silence, nappe vide"), 5, 23, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(pr(0, 18, 86), pr(0, 34, 136), k), pr(0, 15, 62), mel(50, 56, k), 0.5, 0.45), FOG.propG, CIEL.ruine, 0.6);
  }),
  P("s06p8", t("rue grise déserte, pavés vides", "des habitants effondrés au loin, flous", "une pièce d'or tourne seule sur la chaussée vide ; le noir tombe", "plan très bas, fixe", "lumière froide, la pièce d'or seule brille", "pièce d'or, fondu au noir sur la dernière parole", "silence, un dernier tintement, noir"), 5, 26, (c) => {
    const d = D(c);
    const k = lisse(c.p);
    return S(viser(mel3(ru(0.9, 0.8, 13.2), ru(1.0, 0.75, 12.6), k), ru(1.4, 0.75, 8.6), mel(46, 42, k), 0.5, 0.5), FOG.ruine, CIEL.ruine, 0.7, { fx: { vignette: 0.7, noir: NOIR(c, d) } });
  }),
];
void plus;
void CHATEAU;
void PODIUM;
void PROP;
void STADE;
void TOITS;
void YACHT;
void ETUDE;
void trav;
void to;
