/**
 * « Le mot secret » — mise en scène plan par plan (récit : histoires/recits/mot-secret.json).
 * Chaque plan démarre sur un mot [scène, mot]. Huis clos : porte d'entrée (verrous, horloge à 2 h), salon à la lampe ambrée,
 * couloir sous la lune, chambre du petit frère à la veilleuse, tapis et trappe. Le rythme s'accélère jusqu'au twist.
 */
import type { PlanGen } from "../../types";
import { D, P, entre, lisse, mel, mel3, orb, plus, pos, rel, secousse, tete, viser, type V3 } from "../cam";
import type { EtatConte } from "../lib";
import { PERRON, PORTE, TRAPPE } from "./monde";
import { RANGEE_Z } from "./histoire";

const [XP] = PERRON;
const FOG = {
  salon: ["#0B1226", 16, 52] as [string, number, number],
  couloir: ["#0A1020", 7, 30] as [string, number, number],
  chambre: ["#0C1328", 12, 46] as [string, number, number],
  dehors: ["#101C38", 8, 60] as [string, number, number],
};
const S = (cam: ReturnType<typeof viser>, brouillard: [string, number, number], vignette = 0.5, extra: Partial<EtatConte> = {}): EtatConte => ({ cam, brouillard, fx: { vignette }, ...extra });

/** Gros plan d'un visage : la caméra est à `off` (repère du monde) de la tête, qu'elle vise à ~36 % de la hauteur. */
const vis = (c: Parameters<typeof tete>[0], id: string, off: V3, fov = 34, haut = 2.4, sy = 0.33) => {
  const ac = D(c).acteur(id, c.T);
  const a = pos(c, id);
  const e = ac?.echelle ?? 1;
  const ry = ac?.ry ?? 0;
  // on vise le visage (devant la tête), pas le centre du crâne : le regard reste au milieu du cadre
  const h: V3 = [a[0] + Math.sin(ry) * 0.38 * e, a[1] + haut * e, a[2] + Math.cos(ry) * 0.38 * e];
  return viser(plus(h, off), h, fov, 0.5, sy);
};
/** Tête d'un personnage accroupi (Tom près du lit). */
const teteBas = (c: Parameters<typeof tete>[0], id: string, y = 1.2): V3 => {
  const a = pos(c, id);
  return [a[0] - 0.6, a[1] + y, a[2]];
};
const cogne = (T: number, ev: Record<string, number>, amp: number, ks = ["toc1", "toc2", "toc3"]): V3 => {
  let a = 0;
  for (const k of ks) {
    const dt = T - ev[k];
    if (dt > 0 && dt < 0.4) a = Math.max(a, amp * (1 - dt / 0.4));
  }
  return a > 0 ? secousse(T, a) : [0, 0, 0];
};
const PX = (PORTE.x0 + PORTE.x1) / 2;

export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « Après minuit, chez nous, on n'ouvre la porte qu'à celui qui connaît le mot secret… »
  P("s01p1", "Décor : verrous de la porte d'entrée (chaîne, clé dans la serrure, loquet) | Personnages : aucun (hors champ) | Action/expressions : le métal luit dans la nuit, rien ne bouge | Caméra : gros plan macro, travelling latéral lent le long des verrous | Lumière : lueur ambre de la lampe contre bleu lune, ombres dures | Effets : vignette, brouillard | Son : drone grave, tic-tac de l'horloge, bois qui craque", 0, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.5, 3.3, 5.6], [0.1, 3.2, 4.9], k), mel3([1.0, 3.5, 7.8], [0.5, 3.3, 7.9], k), mel(30, 44, k)), FOG.salon, 0.55);
  }),
  P("s01p2", "Décor : le salon-entrée de nuit, porte d'entrée, horloge murale arrêtée sur 2 h, lampe et lune | Personnages : toute la famille en pyjama, de dos, face à la porte | Action/expressions : ils se tiennent immobiles, chuchotent, rituel d'avant le coucher | Caméra : plan large légèrement plongeant, poussée lente | Lumière : lampe ambre en fond, tache de lune au sol, brume au ras du sol | Effets : vignette, brume | Son : drone grave, horloge qui tic-taque", 0, 4, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-0.1, 2.0, -2.4], [-0.5, 1.9, -1.0], k), [-1.8, 2.4, 8.0], mel(62, 56, k)), FOG.salon, 0.5);
  }),
  P("s01p3", "Décor : devant la porte d'entrée, verrous et chaîne | Personnages : papa (pull gris, barbe courte) | Action/expressions : visage fermé, regard fixe vers la porte, il garde le rituel | Caméra : gros plan trois-quarts, poussée lente | Lumière : ombre dure sur le visage, reflet bleu du verre dépoli | Effets : vignette | Son : drone grave, cœur sourd", 0, 10, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "papa", [mel(1.6, 1.2, k), mel(0.1, 0.0, k), mel(1.7, 1.5, k)], mel(48, 42, k)), FOG.salon, 0.6);
  }),
  P("s01p4", "Décor : salon-entrée, porte au fond | Personnages : maman (cardigan vert) et le narrateur (pyjama bleu) | Action/expressions : maman, tendue, regarde la porte, le narrateur lève les yeux vers elle | Caméra : plan moyen, orbite lente autour de maman | Lumière : lampe ambre sur le côté, lune froide | Effets : vignette | Son : drone grave, tic-tac", 0, 18, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "maman", [mel(-1.1, -0.8, k), 0.0, mel(2.0, 1.8, k)], mel(50, 44, k)), FOG.salon, 0.6);
  }),
  P("s01p5", "Décor : salon-entrée, face à la porte | Personnages : le narrateur (garçon de 12 ans, pyjama bleu, cheveux bruns) | Action/expressions : il murmure le mot secret, regard sérieux tourné vers la porte | Caméra : gros plan sur le visage, zoom lent | Lumière : lune froide sur la joue, ambre derrière | Effets : vignette marquée | Son : drone grave, souffle, cœur", 0, 22, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "narr", [mel(-0.7, -0.4, k), 0.05, mel(2.6, 2.2, k)], mel(46, 38, k)), FOG.salon, 0.68);
  }),
  // ======================= SCÈNE 2 — « Cette nuit, on a frappé trois fois… »
  P("s02p1", "Décor : le perron, vu de dehors, brume basse, lampadaire éteint, porte d'entrée au verre dépoli ambré | Personnages : aucun visible (point de vue de celui qui frappe) | Action/expressions : la caméra avance lentement vers la porte dans la brume | Caméra : travelling avant, à hauteur d'épaule | Lumière : nuit bleue, lueur ambre derrière le verre | Effets : brume, vignette | Son : vent, drone grave", 1, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([XP - 3.7, 1.9, 13.5], [XP - 3.5, 2.0, 5.4], k), [XP - 3.5, 2.7, 0.3], mel(58, 50, k)), FOG.dehors, 0.68);
  }),
  P("s02p2", "Décor : l'intérieur de la porte, poignée, clé dans la serrure, chaîne | Personnages : aucun | Action/expressions : trois coups secs, la porte vibre, la chaîne tinte, la poussière tombe du linteau, la poignée bouge | Caméra : gros plan sur la poignée, secousse à chaque coup | Lumière : bleu lune sur le bois, ambre lointain | Effets : secousse de caméra, poussière | Son : trois coups sur bois, drone grave, cœur", 1, 4, (c) => {
    const ev = D(c).ev;
    const k = lisse(c.p);
    return S(viser(plus(mel3([-3.2, 2.3, 3.2], [-3.4, 2.3, 4.0], k), cogne(c.T, ev, 0.07)), [-3.6, 2.4, 8.0], mel(56, 50, k)), FOG.salon, 0.6);
  }),
  P("s02p3", "Décor : devant la porte | Personnages : papa | Action/expressions : il penche l'oreille vers le bois, puis demande à voix basse « Le mot ? » | Caméra : gros plan de profil, poussée lente | Lumière : ombre dure, reflet bleu sur le front | Effets : vignette | Son : drone grave, respiration, cœur", 1, 7, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "papa", [mel(2.9, 2.4, k), mel(0.0, -0.1, k), 0.5], mel(46, 40, k)), FOG.salon, 0.62);
  }),
  P("s02p4", "Décor : le sol sous la porte | Personnages : l'ombre fine de deux pieds, derrière la porte | Action/expressions : un filet de lumière froide, interrompu par une ombre immobile | Caméra : rasant, à ras du sol, face à la porte | Lumière : lumière bleue sous la porte, brume au sol | Effets : brume, vignette | Son : drone grave, souffle très doux", 1, 16, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-3.45, 0.3, 6.3], [-3.5, 0.26, 6.9], k), [-3.5, 0.12, 8.05], mel(58, 52, k), 0.5, 0.5), FOG.salon, 0.55);
  }),
  P("s02p5", "Décor : le verre dépoli de la porte, vu de l'intérieur | Personnages : une silhouette floue derrière la vitre, puis une main qui s'y pose | Action/expressions : l'ombre se penche, une main se plaque sur le verre : « Mirabelle » | Caméra : poussée lente vers la vitre | Lumière : verre bleu pâle, silhouette noire | Effets : vignette | Son : murmure, drone grave, cœur", 1, 22, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-3.1, 2.8, 4.9], [-3.4, 2.7, 6.1], k), [-3.4, 2.6, 8.0], mel(40, 32, k)), FOG.salon, 0.62);
  }),
  P("s02p6", "Décor : devant la porte | Personnages : papa | Action/expressions : ses épaules se relâchent, le visage s'apaise : c'était le bon mot | Caméra : gros plan de face trois-quarts, recul très lent | Lumière : ambre sur le visage, bleu derrière | Effets : vignette | Son : drone grave, soupir", 1, 26, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "papa", [mel(2.0, 2.4, k), 0.1, mel(0.7, 0.5, k)], mel(46, 42, k)), FOG.salon, 0.55);
  }),
  // ======================= SCÈNE 3 — « Papa a posé la main sur la clé. Mais maman lui a attrapé le bras… »
  P("s03p1", "Décor : la porte d'entrée et ses verrous | Personnages : papa, de profil | Action/expressions : il avance la main vers la serrure | Caméra : plan moyen latéral, travelling | Lumière : ambre et bleu | Effets : vignette | Son : drone grave, bois qui craque", 2, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-1.3, 2.6, 7.6], [-1.8, 2.5, 7.5], k), mel3([-4.3, 2.2, 7.0], [-4.3, 2.2, 7.5], k), 50), FOG.salon, 0.55);
  }),
  P("s03p2", "Décor : la serrure et la clé | Personnages : la main de papa | Action/expressions : sa main se pose sur la clé noire | Caméra : extrême gros plan sur la main et la clé | Lumière : reflet de laiton, ombre profonde | Effets : vignette | Son : cliquetis de métal, cœur", 2, 4, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-2.2, 2.5, 5.6], [-2.6, 2.4, 6.2], k), [-4.3, 2.25, 7.55], mel(34, 28, k)), FOG.salon, 0.62);
  }),
  P("s03p3", "Décor : devant la porte | Personnages : maman | Action/expressions : elle se précipite vers papa, le visage tendu | Caméra : plan moyen serré, légère plongée | Lumière : ambre latéral | Effets : vignette | Son : drone grave, pas rapides", 2, 8, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-0.6, 3.4, 3.2], [-1.2, 3.0, 3.6], k), [-3.0, 1.9, 6.6], mel(50, 44, k)), FOG.salon, 0.58);
  }),
  P("s03p4", "Décor : devant la porte | Personnages : papa et maman | Action/expressions : la main de maman attrape le bras de papa, il se fige | Caméra : gros plan sur la main qui serre le bras, plongée | Lumière : ambre, ombre dure | Effets : vignette | Son : frottement de tissu, cœur", 2, 12, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([1.7, 2.3, 6.4], [1.2, 2.2, 6.6], k), [-4.5, 1.9, 6.3], mel(42, 36, k)), FOG.salon, 0.6);
  }),
  P("s03p5", "Décor : devant la porte | Personnages : maman | Action/expressions : elle murmure, les yeux écarquillés, le doigt sur les lèvres : « Ce mot, on ne le dit jamais dehors » | Caméra : gros plan, zoom lent | Lumière : ambre sur la joue, lune froide | Effets : vignette | Son : murmure, drone grave", 2, 15, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "maman", [mel(1.5, 1.3, k), 0.0, mel(1.4, 1.3, k)], mel(50, 44, k)), FOG.salon, 0.65);
  }),
  P("s03p6", "Décor : devant la porte | Personnages : maman, de près | Action/expressions : elle murmure : « On le murmure, seulement entre nous » | Caméra : extrême gros plan sur le visage | Lumière : ambre dur, ombres marquées | Effets : vignette forte | Son : souffle, cœur qui accélère", 2, 24, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "maman", [mel(1.3, 1.1, k), -0.1, mel(1.3, 1.2, k)], mel(42, 36, k), 2.3), FOG.salon, 0.7);
  }),
  P("s03p7", "Décor : salon-entrée | Personnages : le narrateur | Action/expressions : il regarde papa, puis maman, de plus en plus inquiet | Caméra : gros plan, léger panoramique | Lumière : lune bleue, ambre dans le dos | Effets : vignette | Son : drone grave, cœur", 2, 27, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "narr", [mel(1.3, 1.0, k), 0.0, mel(2.1, 1.8, k)], mel(48, 42, k)), FOG.salon, 0.62);
  }),
  // ======================= SCÈNE 4 — « Alors comment l'inconnu le connaissait-il ? Dans le couloir… »
  P("s04p1", "Décor : salon-entrée | Personnages : le narrateur | Action/expressions : il comprend, les yeux grands ouverts | Caméra : gros plan trois-quarts, poussée | Lumière : lune froide | Effets : vignette | Son : choc sourd, cœur", 3, 0, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "narr", [mel(1.4, 1.0, k), 0.0, mel(1.9, 1.6, k)], mel(46, 40, k)), FOG.salon, 0.65);
  }),
  P("s04p2", "Décor : la porte d'entrée au fond, verre dépoli, silhouette derrière | Personnages : papa et maman devant la porte, le narrateur qui s'éloigne | Action/expressions : la silhouette est toujours là, immobile, derrière la vitre | Caméra : plan large bas, poussée lente | Lumière : verre bleu, ambre | Effets : brume au sol, vignette | Son : drone grave, tic-tac", 3, 3, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-3.0, 1.4, 3.0], [-3.0, 1.7, 4.2], k), [-3.45, 2.6, 8.0], mel(60, 52, k)), FOG.salon, 0.58);
  }),
  P("s04p3", "Décor : le couloir sous la lune, fenêtre à croisillons | Personnages : le narrateur qui s'engage dans le couloir, de face | Action/expressions : il avance sur la pointe des pieds vers la chambre | Caméra : travelling arrière devant lui, plan large | Lumière : bandes de lune sur le mur, ambre du salon derrière | Effets : brume, vignette | Son : pas étouffés, bois qui craque, drone grave", 3, 6, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.4, 2.5, -12.4], [0.3, 2.3, -11.0], k), [-0.5, 1.9, -3.5], mel(54, 50, k)), FOG.couloir, 0.55);
  }),
  P("s04p4", "Décor : le couloir | Personnages : le narrateur | Action/expressions : il s'arrête, l'oreille tendue vers la chambre | Caméra : gros plan de trois-quarts | Lumière : lune sur le visage | Effets : vignette | Son : silence qui s'épaissit, chuchotement lointain", 3, 9, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "narr", [mel(1.5, 1.2, k), 0.1, mel(-1.9, -1.6, k)], 30), FOG.couloir, 0.65);
  }),
  P("s04p5", "Décor : le couloir et, au fond, la porte entrouverte de la chambre éclairée par la veilleuse | Personnages : le narrateur, de dos | Action/expressions : il écoute les chuchotements | Caméra : travelling avant dans le couloir qui s'étire | Lumière : filet ambre au bout du couloir | Effets : brume, vignette | Son : chuchotement, cœur", 3, 13, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.3, 2.6, -4.6], [0.2, 2.5, -9.4], k), [0.0, 1.9, -15.0], mel(60, 54, k)), FOG.couloir, 0.6);
  }),
  P("s04p6", "Décor : la chambre du petit frère, veilleuse en étoile, dessin au mur | Personnages : Tom (6 ans, pyjama jaune, cheveux blonds, peluche lapin) accroupi près du lit | Action/expressions : il chuchote « Chut. Il est arrivé », le regard vers le dessous du lit, un léger sourire | Caméra : gros plan trois-quarts, poussée lente | Lumière : ambre doux de la veilleuse, lune au fond | Effets : vignette | Son : chuchotement, drone grave", 3, 17, (c) => {
    const k = lisse(c.p);
    const t = teteBas(c, "tom");
    return S(viser(plus(t, [mel(1.6, 1.1, k), mel(0.3, 0.2, k), mel(2.7, 2.5, k)]), t, mel(46, 40, k), 0.5, 0.4), FOG.chambre, 0.6);
  }),
  P("s04p7", "Décor : le couloir | Personnages : le narrateur | Action/expressions : « Je lui ai appris le mot » : la terreur le saisit, les mains à la gorge | Caméra : gros plan frontal, poussée rapide | Lumière : lune bleue | Effets : vignette forte | Son : choc, cœur qui s'accélère", 3, 21, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "narr", [mel(0.9, 0.4, k), 0.1, mel(-2.4, -2.0, k)], mel(34, 26, k)), FOG.couloir, 0.72);
  }),
  P("s04p8", "Décor : la chambre du petit frère | Personnages : Tom | Action/expressions : il se tourne lentement vers le couloir et sourit : « comme tu voulais » | Caméra : gros plan de profil | Lumière : ambre de la veilleuse | Effets : vignette | Son : chuchotement, grincement du plancher", 3, 27, (c) => {
    const k = lisse(c.p);
    const t = teteBas(c, "tom");
    return S(viser(plus(t, [mel(0.3, 0.1, k), 0.15, mel(2.6, 2.2, k)]), t, mel(42, 36, k), 0.5, 0.4), FOG.chambre, 0.68);
  }),
  // ======================= SCÈNE 5 — « Il parlait à quelqu'un sous son lit… »
  P("s05p1", "Décor : la chambre du petit frère, le dessous du lit dans l'ombre | Personnages : le narrateur au seuil, Tom accroupi, papa qui entre | Action/expressions : Tom parle à l'obscurité sous le lit ; papa entre dans la chambre | Caméra : travelling avant bas depuis la porte, vers le lit | Lumière : veilleuse ambre, rayon de lune en travers du sol | Effets : poussière, vignette | Son : drone grave, craquement du plancher", 4, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([2.1, 1.5, -15.1], [1.2, 1.1, -16.4], k), [-3.0, 0.7, -19.0], mel(56, 52, k)), FOG.chambre, 0.58);
  }),
  P("s05p2", "Décor : la chambre, le lit au rabat de couverture | Personnages : papa penché sur le lit, Tom près de lui | Action/expressions : papa se penche, la main saisit le bord de la couverture | Caméra : plan moyen latéral, légère plongée | Lumière : veilleuse ambre sur le côté | Effets : vignette | Son : froissement de tissu, cœur", 4, 7, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([2.2, 2.6, -15.2], [1.6, 2.4, -15.6], k), [-2.0, 1.4, -18.3], mel(54, 48, k)), FOG.chambre, 0.58);
  }),
  P("s05p3", "Décor : le dessous du lit, vide, poussière | Personnages : papa (main sur la couverture soulevée) | Action/expressions : la couverture se soulève, révélant l'ombre noire sous le lit | Caméra : très bas, face au dessous du lit, glissé vers l'ombre | Lumière : veilleuse rasante | Effets : poussière, vignette | Son : froissement, silence", 4, 10, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-0.7, 0.7, -15.0], [-1.0, 0.6, -15.5], k), [-2.4, 0.9, -18.0], mel(56, 48, k), 0.5, 0.5), FOG.chambre, 0.6);
  }),
  P("s05p4", "Décor : le dessous du lit, vu depuis l'ouverture de la couverture soulevée, poussière, un chausson et un cube de bois | Personnages : aucun visible (papa et Tom hors champ de chaque côté) | Action/expressions : « Personne » : sous le lit il n'y a que de l'ombre, rien ne bouge | Caméra : bas, plan subjectif qui glisse lentement dans l'obscurité | Lumière : veilleuse rasante qui s'éteint dans le noir | Effets : poussière, vignette forte | Son : silence pesant, battement de cœur", 4, 12, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-1.7, 0.95, -18.65], [-2.15, 0.85, -18.65], k), [-4.6, 0.55, -18.65], mel(66, 58, k), 0.5, 0.5), FOG.chambre, 0.72);
  }),
  P("s05p5", "Décor : le salon, tapis épais au centre, lampe ambre, lune par la fenêtre | Personnages : papa, maman, le narrateur et Tom, immobiles, la tête baissée | Action/expressions : « sous nos pieds » : tous regardent le sol | Caméra : plan bas face à la famille, poussée | Lumière : ambre et lune | Effets : vignette | Son : drone grave, tic-tac", 4, 13, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([3.0, 1.1, -0.9], [3.0, 1.3, -0.2], k), [2.9, 1.9, RANGEE_Z], mel(62, 54, k)), FOG.salon, 0.58);
  }),
  P("s05p6", "Décor : le salon, la lampe de la commode | Personnages : aucun | Action/expressions : trois coups viennent du plancher : la lampe tremble, la poussière saute | Caméra : gros plan sur la lampe, secousse à chaque coup | Lumière : abat-jour ambre qui vacille | Effets : secousse de caméra, poussière | Son : trois coups sourds sous le plancher, grincement", 4, 17, (c) => {
    const ev = D(c).ev;
    const k = lisse(c.p);
    return S(viser(plus(mel3([-0.2, 2.9, 0.3], [-0.8, 2.9, -0.2], k), cogne(c.T, ev, 0.1, ["tok1", "tok2", "tok3"])), [-2.75, 2.7, -2.45], 44), FOG.salon, 0.6);
  }),
  P("s05p7", "Décor : le tapis et la trappe dessous, vus d'en haut | Personnages : la famille, au bord du cadre | Action/expressions : le tapis vibre, la poussière saute, la trappe frémit | Caméra : plongée verticale lente sur le tapis | Lumière : tache de lune sur le tapis | Effets : secousse, poussière | Son : coups sourds, tremblement du plancher", 4, 21, (c) => {
    const ev = D(c).ev;
    const k = lisse(c.p);
    return S(viser(plus(mel3([3.3, 4.2, 4.4], [3.3, 4.2, 3.4], k), cogne(c.T, ev, 0.05, ["tok1", "tok2", "tok3"])), [TRAPPE.x, 0.1, TRAPPE.z], mel(56, 50, k)), FOG.salon, 0.6);
  }),

  // ======================= SCÈNE 6 — « Et la voix a murmuré : Mirabelle… ouvrez-moi… »
  P("s06p1", "Décor : le salon, le tapis qui bouge | Personnages : la famille figée au fond du cadre | Action/expressions : le tapis ondule, quelque chose pousse dessous | Caméra : très bas, face au tapis, poussée lente | Lumière : lune sur le tapis, ambre derrière | Effets : brume, vignette | Son : murmure venu d'en bas, drone grave", 5, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([3.3, 0.55, -0.6], [3.3, 0.5, 0.4], k), [3.2, 0.9, 3.6], mel(52, 46, k), 0.5, 0.5), FOG.salon, 0.6);
  }),
  P("s06p2", "Décor : le bord du tapis et la trappe de cave | Personnages : aucun | Action/expressions : le tapis glisse tout seul, découvrant la trappe de bois et son anneau | Caméra : bas, plan rapproché sur la trappe | Lumière : lune sur le bois | Effets : vignette | Son : frottement du tapis, murmure", 5, 7, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([4.9, 0.9, 3.4], [4.2, 0.7, 3.2], k), [3.2, 0.1, 1.6], mel(50, 44, k), 0.5, 0.52), FOG.salon, 0.6);
  }),
  P("s06p4", "Décor : le salon, face à la trappe | Personnages : Tom | Action/expressions : Tom relève la tête et sourit calmement : il n'a pas peur | Caméra : gros plan de face, très lent | Lumière : lueur pâle montant du sol sur son visage | Effets : vignette | Son : murmure, drone grave", 5, 9, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "tomS", [mel(0.3, 0.1, k), mel(0.1, 0.0, k), mel(-2.7, -2.2, k)], 32), FOG.salon, 0.68);
  }),
  P("s06p5", "Décor : le salon | Personnages : maman | Action/expressions : maman, la main devant la bouche, fixe l'ouverture | Caméra : gros plan de face, plongée légère | Lumière : lueur pâle sur le visage | Effets : vignette | Son : souffle coupé, cœur", 5, 15, (c) => {
    const k = lisse(c.p);
    return S(vis(c, "maman", [mel(-0.2, 0.2, k), mel(-0.3, -0.1, k), mel(-2.7, -2.3, k)], mel(48, 42, k), 2.4, 0.38), FOG.salon, 0.7);
  }),
  P("s06p6", "Décor : la trappe entrouverte sur le noir | Personnages : les pieds de la famille au bord du cadre | Action/expressions : l'ouverture reste béante, le noir attend ; fondu au noir | Caméra : plongée lente vers la fente de lumière pâle | Lumière : filet pâle sur l'obscurité | Effets : lueur, fondu au noir | Son : murmure, battement de cœur, puis silence", 5, 19, (c) => {
    const d = D(c);
    const k = lisse(c.p);
    const noir = lisse(entre(c.T, d.finNarration - 0.02, d.finNarration + 0.14));
    return S(viser(mel3([3.3, 2.3, 3.7], [3.3, 0.85, 3.2], k), mel3([3.3, 0.3, 2.3], [3.3, 0.22, 2.5], k), mel(56, 52, k), 0.5, 0.5), FOG.salon, 0.72, { fx: { vignette: 0.72, noir } });
  }),
];
void rel;
void orb;

