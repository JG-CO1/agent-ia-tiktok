/**
 * « Ville interdite » — mise en scène plan par plan (récit : histoires/recits/ville-interdite.json).
 * Chaque plan démarre sur un mot [scène, mot]. Acte 1 : on croit à une vraie ville en danger (ombres immenses, sirène, rues vides, volets clos).
 * Acte 2 : le bord de la table, la main, la boîte, l'œil. Le twist se voit sans la voix : plans larges de la table, boîte aux disparus, œil énorme.
 * Repères : plateau de la ville y = 0 (x -72..72, z -48..58), bord de la table z = 62, boulangerie pas A (-20, -13,5) puis B, trappes x = -11.
 */
import type { PlanGen, CtxGen } from "../../types";
import { D, P, entre, faceA, freine, lisse, mel, mel3, orb, plus, pos, rel, secousse, tete, trav, viser, type Cam, type V3 } from "../cam";
import type { EtatConte, FxConte } from "../lib";
import { BOUL, BORD_Z, CELLIER, CELLULES, LEO_BORD_X, OEIL, TUNNEL, Y_TABLE } from "./monde";
import { FACT_FIN, boulPos } from "./histoire";

const mixHex = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
};
type Lieu = "dehors" | "cave";
/** État d'un plan : caméra, brume dorée de fin d'après-midi (qui se refroidit au « soir ») et effets. */
function E(c: CtxGen, cam: Cam, o: { lieu?: Lieu; vig?: number; fx?: FxConte; fog?: [number, number]; sec?: V3 } = {}): EtatConte {
  const ev = D(c).ev;
  const fx: FxConte = { vignette: o.vig ?? 0.4, ...o.fx };
  const cc = o.sec ? { ...cam, pos: plus(cam.pos, o.sec), look: plus(cam.look, o.sec) } : cam;
  if (o.lieu === "cave") return { cam: cc, brouillard: ["#2A1A10", 10, 70], fx, ciel: "#2A1A10" };
  const soir = lisse(entre(c.T, ev.soir0, ev.soir1));
  const col = mixHex("#EBC48C", "#34304C", soir);
  const fog = o.fog ?? [60, 320];
  return { cam: cc, brouillard: [col, fog[0], fog[1]], fx, ciel: col };
}
/** Secousse du sol : démarre au « tremblé », maximale à l'arrivée de la main, retombe quand la main attrape. */
const tremble = (c: CtxGen, amp = 0.22): V3 => {
  const ev = D(c).ev;
  const k = entre(c.T, ev.secousse0, ev.secousse0 + 0.5) * (1 - entre(c.T, ev.saisit - 0.2, ev.saisit + 0.5) * 0.9);
  return c.T > ev.secousse0 && c.T < ev.saisit + 0.8 ? secousse(c.T, amp * k) : [0, 0, 0];
};
const lueurFlash = (T: number, t0: number, d: number, max: number): [string, number] => ["#FFF1D2", T > t0 && T < t0 + d ? max * (1 - (T - t0) / d) : 0];
const dirOeil = (): V3 => {
  const v: V3 = [-8.2 - OEIL[0], 2.6 - OEIL[1], 60.3 - OEIL[2]];
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
};
const DIST_OEIL = Math.hypot(-8.2 - OEIL[0], 2.6 - OEIL[1], 60.3 - OEIL[2]);
const surOeil = (d: number, haut = 0, cote = 0): V3 => {
  const u = dirOeil();
  return [OEIL[0] + u[0] * d + cote, OEIL[1] + u[1] * d + haut, OEIL[2] + u[2] * d];
};

const TETE_LEO: V3 = [LEO_BORD_X, Y_TABLE + 1.9, BORD_Z - 2.2];
export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « Dans cette ville, personne n'a le droit de sortir depuis l'arrivée des géants… »
  P("s01p1", "Décor : les toits colorés de la ville en blocs de bois peints, brume dorée de fin d'après-midi | Personnages : aucun (une ombre géante en forme de main glisse sur les toits) | Action/expressions : une ombre immense avance sur la ville | Caméra : plongée de grande hauteur depuis l'est, lent travelling | Lumière : soleil rasant doré, grande ombre noire en forme de main sur les rues et les toits | Effets : brume, vignette | Son : sirène d'alerte, vent, grave sourd", 0, 0, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([46, 34, 44], [36, 30, 40], k), mel3([-32, 0, 3], [-24, 0, 2], k), 56, 0.5, 0.45), { vig: 0.45, fog: [90, 300] });
  }),
  P("s01p2", "Décor : l'avenue qui s'achève sur la barrière rouge et blanche et le grand panneau « SORTIE INTERDITE » | Personnages : habitants qui courent se mettre à l'abri | Action/expressions : la panique, tout le monde rentre | Caméra : plan large à hauteur d'homme, travelling avant vers le panneau | Lumière : contre-jour doré, ombres longues | Effets : brume | Son : sirène, pas précipités", 0, 8, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-3.5, 3.6, 26], [-1.5, 3.8, 33], k), mel3([0, 5.4, 54], [0, 5.6, 54], k), mel(56, 50, k), 0.5, 0.4), { vig: 0.5, fog: [40, 200] });
  }),
  P("s01p3", "Décor : la grande place, la fontaine, les façades aux volets clos | Personnages : habitants qui courent, ombre géante qui passe sur la place | Action/expressions : un habitant file devant la fontaine pendant que l'ombre d'une main traverse la place | Caméra : plan rasant dans la rue, légère contre-plongée vers la tour de la sirène | Lumière : soleil rasant, grande ombre froide | Effets : vignette | Son : sirène, grondement sourd", 0, 12, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-19, 1.8, 0.4], [-14, 2.0, -0.4], k), mel3([-2, 9, -6], [4, 11, -6], k), mel(60, 56, k), 0.5, 0.45), { vig: 0.55, fog: [50, 220] });
  }),
  P("s01p4", "Décor : toute la ville vue d'en haut, rues, toits, place, avec la sirène sur sa tour (la ville est posée sur un plateau) | Personnages : minuscules passants qui courent | Action/expressions : l'ombre glisse sur les toits | Caméra : orbite lente en plongée | Lumière : lumière dorée, grande ombre | Effets : brume | Son : sirène, vent", 0, 15, (c) => {
    const k = lisse(c.p);
    return E(c, orb([0, 0, 2], [64, 66], [-2.5, -1.7], [46, 40], k, 62, 0.47), { vig: 0.4, fog: [60, 260] });
  }),
  P("s01p5", "Décor : les toits et les cheminées de la ville, au ras des tuiles | Personnages : aucun | Action/expressions : l'ombre géante file au-dessus des toits | Caméra : travelling rapide à hauteur de toit | Lumière : tuiles rouges au soleil rasant, ombre noire | Effets : vignette | Son : sirène lointaine, vent", 0, 20, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-2, 13.2, 16], [22, 13.0, 13], k), mel3([36, 8.5, -2], [56, 8.5, -2], k), 56, 0.5, 0.5), { vig: 0.5, fog: [30, 95] });
  }),
  P("s01p6", "Décor : la place, la fontaine et la tour de la sirène au crépuscule doré | Personnages : un facteur (veste orange, casquette bleue, sacoche) qui lève la tête, puis deux énormes doigts qui le pincent | Action/expressions : le facteur est soulevé dans les airs, les bras en croix | Caméra : plan large depuis le côté de la place, basculement vers le haut qui suit son ascension | Lumière : sol qui s'assombrit sous la pince | Effets : vignette, flash blanc bref | Son : sirène qui s'éteint, silence net", 0, 24, (c) => {
    const ev = D(c).ev;
    const dt = c.T - ev.leve;
    const haut = dt > 0 ? 38 * Math.min(1, (dt / 0.95)) ** 2 : 0;
    const k = lisse(c.p);
    const f = lueurFlash(c.T, ev.leve + 0.62, 0.22, 0.5);
    return E(c, viser(mel3([-11.5, 2.5, -2.4], [-10.0, 2.6, -2.0], k), [FACT_FIN[0], 2.2 + Math.min(haut, 34) * 0.9, FACT_FIN[2]], mel(54, 62, lisse(entre(c.T, ev.leve - 0.2, ev.leve + 0.8))), 0.5, 0.45), { vig: 0.6, fx: { flash: f }, fog: [50, 220] });
  }),

  // ======================= SCÈNE 2 — « Les adultes répètent : "Restez chez vous, ou ils vous emporteront." »
  P("s02p1", "Décor : la place, la fontaine derrière lui | Personnages : un adulte au gilet bleu, visage grave | Action/expressions : il regarde fixement la caméra | Caméra : gros plan de face, poussée lente | Lumière : lumière dorée sur le visage, ombre à droite | Effets : vignette | Son : drone grave, vent", 1, 0, (c) => E(c, faceA(c, "a2", [5.6, 4.4], 2.55, 0.0, 34, 2.4, 0.4), { vig: 0.6, fog: [40, 200] })),
  P("s02p2", "Décor : la place et les maisons aux volets clos | Personnages : un adulte au gilet rouge et chapeau, le doigt levé | Action/expressions : il répète la consigne « Restez chez vous » | Caméra : plan américain, légère contre-plongée | Lumière : lumière dorée rasante | Effets : vignette | Son : drone grave", 1, 5, (c) => {
    const k = lisse(c.p);
    return E(c, viser(rel(c, "a1", [mel(1.2, 0.5, k), 1.6, mel(7.0, 5.4, k)]), rel(c, "a1", [0, 2.5, 0]), 40, 0.5, 0.4), { vig: 0.6, fog: [40, 200] });
  }),
  P("s02p3", "Décor : la place, les maisons, la tour de la sirène au fond | Personnages : une femme à la robe verte, inquiète, et les autres adultes | Action/expressions : « ou ils vous emporteront » | Caméra : gros plan en travelling | Lumière : dorée, ombre longue | Effets : vignette | Son : drone grave, sirène lointaine", 1, 11, (c) => E(c, faceA(c, "a3", [mel(6.4, 4.8, lisse(c.p)), 3.6], 2.5, 0.5, 34, 2.4, 0.4), { vig: 0.62, fog: [40, 200] })),
  P("s02p4", "Décor : la maison bleue de Léo, volets verts ouverts, une rue déserte | Personnages : Léo (11 ans, pull jaune, cheveux en épis) à la fenêtre | Action/expressions : l'enfant regarde la rue, inquiet | Caméra : plan moyen depuis l'avenue, travelling avant | Lumière : doré rasant, intérieur chaud | Effets : vignette | Son : ambiance sourde, vent", 1, 13, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([8.0, 3.8, 49], [4.2, 3.4, 44.8], k), [-9, 3.0, 42], mel(52, 44, k), 0.5, 0.42), { vig: 0.5, fog: [40, 200] });
  }),
  P("s02p5", "Décor : la fenêtre de sa chambre, papier peint crème derrière lui | Personnages : Léo, regard fixe | Action/expressions : il n'a jamais vu de géant, curiosité têtue | Caméra : gros plan de visage à travers la fenêtre | Lumière : lumière dorée sur le visage | Effets : vignette | Son : cœur lointain", 1, 21, (c) => {
    const k = lisse(c.p);
    return E(c, viser([mel(-2.4, -3.9, k), 2.9, 42.5], [-9.4, 2.78, 42.0], 30, 0.5, 0.4), { vig: 0.62, fog: [30, 160] });
  }),
  P("s02p6", "Décor : le jardin derrière la maison bleue, la trappe de la cave ouverte | Personnages : Léo qui se faufile | Action/expressions : il file vers la trappe | Caméra : suivi latéral en légère plongée | Lumière : ombres portées bleutées | Effets : vignette | Son : pas étouffés", 1, 25, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([1.4, 3.3, 52.5], [-3.5, 3.0, 54.5], k), plus(pos(c, "leo2"), [0, 1.5, 0]), 52, 0.5, 0.45), { vig: 0.55, fog: [40, 200] });
  }),
  P("s02p7", "Décor : le jardin, la maison bleue derrière lui | Personnages : Léo, mâchoire serrée | Action/expressions : « j'ai décidé de le regarder en face » | Caméra : gros plan de visage, poussée lente | Lumière : doré rasant | Effets : vignette | Son : cœur", 1, 29, (c) => E(c, viser([-8.0, 2.3, mel(55.4, 54.6, lisse(c.p))], [-8.6, 1.9, 49.4], 32, 0.5, 0.42), { vig: 0.62, fog: [30, 160] })),

  // ======================= SCÈNE 3 — « Je me suis faufilé par la cave jusqu'au bord de la ville… »
  P("s03p1", "Décor : le cellier de pierre, l'escalier de bois qui monte vers la trappe, un rai de lumière | Personnages : Léo qui descend l'escalier | Action/expressions : il descend à pas de loup | Caméra : plan large depuis le fond de la pièce | Lumière : rayon de lumière dorée, ombres froides | Effets : poussière, vignette | Son : pas sur le bois, écho", 2, 0, (c) => {
    const k = lisse(c.p);
    const x0 = CELLIER.x0;
    return E(c, viser(mel3([x0 + 15, 3.4, 4.4], [x0 + 13, 3.0, 3.6], k), [x0 + 6, 3.2, -1], 58, 0.5, 0.45), { lieu: "cave", vig: 0.5 });
  }),
  P("s03p2", "Décor : le tunnel de la cave, tuyaux de cuivre, ampoules, une échelle au bout | Personnages : Léo qui court | Action/expressions : il fonce vers la lumière | Caméra : suivi dans son dos | Lumière : ampoules orange, ombres | Effets : vignette | Son : pas qui résonnent, goutte", 2, 6, (c) => {
    const p = pos(c, "leo4");
    return E(c, viser([p[0] - 4.2, 2.6, 0.9], plus(p, [0, 1.8, 0]), 54, 0.5, 0.42), { lieu: "cave", vig: 0.55 });
  }),
  P("s03p3", "Décor : le bord du plateau de la ville, la lisière de gazon, la barrière, le rebord de bois au bout | Personnages : Léo, sorti de la cave | Action/expressions : il avance prudemment vers le bout du monde | Caméra : suivi latéral bas, travelling | Lumière : soleil rasant, ombre longue | Effets : vignette | Son : vent, pas", 2, 8, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([4.5, 2.4, 58.6], [0.5, 2.1, 58.9], k), plus(pos(c, "leo5"), [0, 1.7, 0]), 52, 0.5, 0.44), { vig: 0.5, fog: [60, 500] });
  }),
  P("s03p4", "Décor : le rebord arrondi de la table, les veinures du bois, et rien au-delà | Personnages : Léo, minuscule au bord | Action/expressions : il s'arrête net, le monde finit là | Caméra : plan rasant le long du rebord, travelling avant lent | Lumière : soleil rasant sur les veinures | Effets : vignette | Son : vent, silence", 2, 12, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-21, 0.6, 59.3], [-15.2, 0.55, 59.5], k), [LEO_BORD_X + 1.2, 0.3, 61.8], mel(58, 52, k), 0.42, 0.46), { vig: 0.5, fog: [80, 700] });
  }),
  P("s03p5", "Décor : le vide immense sous le bord de la table, le tapis très loin en bas | Personnages : Léo au bord (en haut du cadre) | Action/expressions : vertige, il regarde en bas | Caméra : la caméra passe par-dessus le bord et bascule à la verticale sur le tapis | Lumière : lumière chaude, le sol lointain dans la brume | Effets : vertige (plongée) | Son : souffle du vide", 2, 18, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([LEO_BORD_X + 1.6, 2.4, 61.6], [LEO_BORD_X + 1.8, 3.0, 65.5], k), mel3([LEO_BORD_X + 2, -6, 120], [LEO_BORD_X + 1.8, -148, 70], lisse(entre(c.p, 0.1, 0.95))), mel(64, 70, k), 0.5, 0.45), { vig: 0.55, fog: [100, 520] });
  }),
  P("s03p6", "Décor : au loin les murs de la chambre à rayures bleues, la plinthe, le plancher | Personnages : Léo petit au bord (de dos) | Action/expressions : « au loin, des murs » | Caméra : travelling arrière lent, par-dessus l'épaule | Lumière : dorée, brume | Effets : brume | Son : nappe, vent", 2, 23, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([LEO_BORD_X - 3.9, 3.4, 56.6], [LEO_BORD_X - 5.4, 4.2, 54.4], k), mel3([-30, 5, 330], [10, 30, 400], k), 60, 0.5, 0.42), { vig: 0.4, fog: [140, 900] });
  }),
  P("s03p7", "Décor : un mur de la chambre, papier peint à rayures, plus haut que le ciel | Personnages : aucun | Action/expressions : « murs plus hauts que le ciel » | Caméra : contre-plongée verticale le long du mur | Lumière : brume dorée | Effets : brume, vignette | Son : drone qui s'ouvre", 2, 26, (c) => {
    const k = lisse(c.p);
    return E(c, viser([-6, 3.2, 58.6], mel3([-6, 60, 420], [-6, 520, 520], k), mel(66, 70, k), 0.5, 0.44), { vig: 0.5, fog: [120, 900] });
  }),

  // ======================= SCÈNE 4 — « Soudain, le sol a tremblé. Une main gigantesque est descendue… »
  P("s04p1", "Décor : le bord de la table, la ville en arrière-plan | Personnages : Léo au bord, de dos | Action/expressions : il se retourne, inquiet | Caméra : plan large, la caméra commence à vibrer | Lumière : dorée | Effets : tremblement de caméra | Son : grondement sourd", 3, 0, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-14.5, 3.0, 49.0], [-13.0, 2.8, 51.0], k), plus(pos(c, "leo5"), [0, 1.5, 0]), 54, 0.5, 0.45), { vig: 0.5, sec: tremble(c, 0.1) });
  }),
  P("s04p2", "Décor : le bord de la table, la brume dorée derrière lui | Personnages : Léo face à nous, terrifié | Action/expressions : le sol tremble sous lui, il recule | Caméra : gros plan de visage, forte secousse | Lumière : dorée | Effets : tremblement | Son : grondement, craquement de bois", 3, 3, (c) => E(c, viser([TETE_LEO[0] - 0.4, 2.1, mel(54.6, 55.4, lisse(c.p))], TETE_LEO, 34, 0.5, 0.42), { vig: 0.62, fog: [60, 300], sec: tremble(c, 0.2) })),
  P("s04p3", "Décor : la ville, la boulangerie et le ciel doré | Personnages : minuscules habitants figés | Action/expressions : une main géante apparaît dans le ciel | Caméra : grande contre-plongée vers la main | Lumière : contre-jour, ombre énorme sur la rue | Effets : tremblement | Son : basse sourde", 3, 5, (c) => E(c, viser(mel3([-34, 9, 44], [-30, 10, 40], lisse(c.p)), [-10, 44, -13], 60, 0.5, 0.5), { vig: 0.5, fog: [160, 700], sec: tremble(c, 0.22) })),
  P("s04p4", "Décor : la boulangerie jaune sur sa place, la rue | Personnages : la main géante qui descend | Action/expressions : « est descendue » : les doigts s'ouvrent | Caméra : contre-plongée oblique, léger recul | Lumière : ombre qui avale la boulangerie | Effets : tremblement | Son : basse, craquements", 3, 8, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-54, 5.8, 2.8], [-50, 6.6, 2.6], k), mel3([-21, 27, -13], [-21, 17, -13.5], k), 58, 0.5, 0.5), { vig: 0.5, fog: [80, 400], sec: tremble(c, 0.2) });
  }),
  P("s04p5", "Décor : le toit plat de la boulangerie | Personnages : la main géante (peau rose, ongles) | Action/expressions : les doigts se referment sur la boulangerie, le pouce de l'autre côté | Caméra : plan serré en travelling autour des doigts | Lumière : lumière rasante sur la peau | Effets : tremblement | Son : bois qui craque, basse", 3, 10, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-52, 13, 6], [-47, 12, 2], k), [-27.5, 8.5, -13.5], mel(46, 42, k), 0.5, 0.45), { vig: 0.5, fog: [80, 400], sec: tremble(c, 0.12) });
  }),
  P("s04p6", "Décor : la rue, la boulangerie soulevée à plus de dix mètres du sol | Personnages : la main géante porte le bâtiment | Action/expressions : « et l'a déplacée » : elle glisse la boulangerie plus loin | Caméra : plan large qui suit le déplacement : l'échelle devient évidente | Lumière : ombre de la main et du bâtiment sur la rue | Effets : brume | Son : froissement de bois, basse", 3, 14, (c) => {
    const b = boulPos(c.T, D(c).ev);
    const k = lisse(c.p);
    return E(c, viser([b.x + mel(13, 19, k), 4.6, mel(3.4, 4.2, k)], [b.x - 1.5, 10.5 + b.y * 0.6, b.z], 62, 0.5, 0.5), { vig: 0.4, fog: [90, 420] });
  }),
  P("s04p7", "Décor : l'intérieur de la boulangerie, four rougeoyant, étagères de pains, table de pétrissage | Personnages : la boulangère à toque et tablier blanc | Action/expressions : elle pétrit la pâte tranquillement pendant que tout bouge | Caméra : plan moyen frontal, la pièce tangue légèrement | Lumière : four orange, intérieur chaud | Effets : vignette | Son : froissement de farine, basse lointaine", 3, 20, (c) => {
    const b = boulPos(c.T, D(c).ev);
    const k = lisse(c.p);
    return E(c, viser([b.x + mel(3.4, 2.4, k), b.y + 3.3, b.z + mel(10.6, 9.4, k)], [b.x + 0.2, b.y + 3.0, b.z - 3.2], 44, 0.5, 0.45), { vig: 0.5, fog: [60, 300] });
  }),
  P("s04p8", "Décor : la table de pétrissage, la pâte, le four rougeoyant | Personnages : la boulangère | Action/expressions : ses mains pétrissent sans s'arrêter | Caméra : plan rapproché sur son visage et ses mains | Lumière : orange du four | Effets : vignette | Son : pâte pétrie, souffle", 3, 23, (c) => {
    const b = boulPos(c.T, D(c).ev);
    const k = lisse(c.p);
    return E(c, viser([b.x + mel(3.0, 1.9, k), b.y + 3.1, b.z + mel(3.2, 2.4, k)], [b.x + 0.4, b.y + 2.7, b.z - 1.9], 36, 0.5, 0.42), { vig: 0.55, fog: [60, 300] });
  }),
  P("s04p9", "Décor : l'intérieur de la boulangerie posée à son nouvel emplacement | Personnages : la boulangère, sereine | Action/expressions : elle n'a rien remarqué | Caméra : gros plan de visage, poussée très lente | Lumière : orange chaud | Effets : vignette | Son : calme soudain, cœur lointain", 3, 26, (c) => {
    const b = boulPos(c.T, D(c).ev);
    const k = lisse(c.p);
    return E(c, viser([b.x + 0.6, b.y + mel(3.15, 3.0, k), b.z + mel(2.0, 1.4, k)], [b.x + 0.4, b.y + 2.8, b.z - 1.9], 32, 0.5, 0.42), { vig: 0.6, fog: [60, 300] });
  }),

  // ======================= SCÈNE 5 — « Alors j'ai compris. Les disparus n'étaient pas mangés : on les rangeait le soir dans une boîte… »
  P("s05p1", "Décor : le rebord de la table, brume dorée | Personnages : Léo face à nous | Action/expressions : il comprend, les yeux écarquillés puis résolus | Caméra : gros plan de visage, poussée lente | Lumière : dorée | Effets : vignette | Son : silence, cœur", 4, 0, (c) => E(c, viser([TETE_LEO[0] + 0.5, 2.1, mel(55.0, 55.8, lisse(c.p))], TETE_LEO, 34, 0.5, 0.42), { vig: 0.62, fog: [60, 300] })),
  P("s05p2", "Décor : toute la table vue d'en haut : la ville minuscule sur un grand plateau de bois, crayons, gommes, cubes de l'alphabet, boîte à jouets, lampe de chevet géante | Personnages : aucun (la ville est un jouet) | Action/expressions : la révélation : tout est miniature | Caméra : grande grue qui s'élève et recule sur la table | Lumière : lampe de chevet en guise de soleil | Effets : brume | Son : nappe qui s'ouvre", 4, 3, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([118, 22, 66], [96, 118, 150], k), mel3([22, 2, -20], [30, -8, -36], k), mel(58, 66, k), 0.5, 0.5), { vig: 0.35, fog: [200, 1000] });
  }),
  P("s05p3", "Décor : la boîte à jouets ouverte, compartiments en bois, couvercle dressé, à la tombée du soir | Personnages : un facteur tenu entre deux énormes doigts | Action/expressions : on le range dans une case | Caméra : plan large en plongée depuis l'avant de la boîte | Lumière : le jour baisse, la lampe rougeoie | Effets : crépuscule | Son : froissement de boîte, toc de bois", 4, 9, (c) => {
    const k = lisse(c.p);
    const cl = CELLULES[5];
    return E(c, viser(mel3([cl[0] - 16, 21, cl[2] + 28], [cl[0] - 13, 15, cl[2] + 21], k), [cl[0] - 1, 8 + 6 * (1 - k), cl[2]], 54, 0.5, 0.46), { vig: 0.5, fog: [120, 600] });
  }),
  P("s05p4", "Décor : la boîte à jouets vue de face, étiquette « PETITS HABITANTS À RANGER LE SOIR » sur le couvercle | Personnages : les disparus, rangés, immobiles, les yeux ouverts | Action/expressions : un habitant par compartiment, regard vide | Caméra : travelling latéral le long des visages | Lumière : soir, chaude lumière de lampe | Effets : vignette | Son : silence, drone", 4, 14, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([112, 4.4, CELLULES[0][2] + 10.6], [134, 4.4, CELLULES[0][2] + 10.6], k), mel3([113, 3.0, CELLULES[0][2]], [135, 3.0, CELLULES[0][2]], k), 40, 0.5, 0.42), { vig: 0.5, fog: [120, 600] });
  }),
  P("s05p5", "Décor : l'avenue au bout de la ville, la barrière et le panneau « SORTIE INTERDITE » derrière eux | Personnages : les adultes, calmes | Action/expressions : ils savaient, sourire triste | Caméra : travelling lent devant leurs visages | Lumière : soir, bleu froid | Effets : vignette | Son : drone triste", 4, 17, (c) => {
    const k = lisse(c.p);
    return E(c, viser([mel(-3.6, 1.8, k), 2.7, 44.6], [mel(-2.4, 0.2, k), 2.5, mel(50.4, 51.8, k)], 36, 0.5, 0.4), { vig: 0.6, fog: [80, 400] });
  }),
  P("s05p6", "Décor : la bande de gazon puis le rebord de bois au bout de la ville | Personnages : un habitant qui a franchi la barrière | Action/expressions : « sortir de la ville » : il marche vers le bord | Caméra : suivi latéral bas | Lumière : soir | Effets : vignette | Son : pas, vent", 4, 22, (c) => {
    const p = pos(c, "sort");
    return E(c, viser([mel(10.5, 9.0, lisse(c.p)), 2.5, mel(57.4, 59.2, lisse(c.p))], plus(p, [0, 1.3, 0]), 52, 0.5, 0.45), { vig: 0.5, fog: [80, 400] });
  }),
  P("s05p7", "Décor : le rebord de la table et le vide jusqu'au tapis | Personnages : l'habitant qui tombe | Action/expressions : « c'était tomber de la table » : il bascule dans le vide | Caméra : plongée qui accompagne la chute | Lumière : soir | Effets : vertige | Son : vent, sifflement", 4, 27, (c) => {
    const ev = D(c).ev;
    const dt = Math.max(0, c.T - ev.chute0);
    const y = Y_TABLE - 0.5 * 85 * dt * dt;
    return E(c, viser([mel(8.5, 6.0, lisse(c.p)), 4.0, 72], [3.5 + 0.5 * dt, Math.max(-120, y + 0.5), BORD_Z + 1.4], 62, 0.5, 0.45), { vig: 0.5, fog: [100, 600] });
  }),

  // ======================= SCÈNE 6 — « J'ai levé la tête. Un œil énorme me fixait… »
  P("s06p1", "Décor : le bord de la table, le ciel doré | Personnages : Léo se retourne et lève la tête | Action/expressions : il lève les yeux, bouche bée | Caméra : plan rapproché de face, légère contre-plongée | Lumière : doré froid | Effets : vignette | Son : silence net", 5, 0, (c) => E(c, viser(rel(c, "leo5", [0.4, 2.2, mel(6.4, 5.0, lisse(c.p))]), rel(c, "leo5", [0, 2.4, 0]), 34, 0.5, 0.4), { vig: 0.62, fog: [100, 500] })),
  P("s06p2", "Décor : le ciel au-dessus de la table, un visage d'enfant géant | Personnages : aucun (l'œil d'un enfant géant) | Action/expressions : un œil énorme s'ouvre dans le ciel | Caméra : contre-plongée depuis le bord, l'œil occupe le ciel | Lumière : lumière chaude sur l'iris | Effets : flash bref, vignette | Son : battement sourd", 5, 4, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return E(c, viser(mel3([-9.5, 1.0, 56], [-8.8, 1.6, 56.4], k), mel3([-4, 60, 100], [-2, 64, 100], k), mel(66, 58, k), 0.5, 0.4), { vig: 0.5, fx: { flash: lueurFlash(c.T, ev.oeil0, 0.18, 0.4) }, fog: [120, 700] });
  }),
  P("s06p3", "Décor : le bord de la table, ciel au-dessus | Personnages : Léo en gros plan, terrifié, l'œil se reflète dans son regard | Action/expressions : « me fixait » : il n'ose plus bouger | Caméra : gros plan de visage, poussée | Lumière : lueur chaude sur son visage | Effets : vignette | Son : cœur, basse", 5, 7, (c) => E(c, viser(rel(c, "leo5", [0.3, 2.5, mel(5.4, 4.4, lisse(c.p))]), rel(c, "leo5", [0, 2.4, 0]), 30, 0.5, 0.4), { vig: 0.68, fog: [100, 500] })),
  P("s06p4", "Décor : l'œil énorme, iris brun, cils, sourcil | Personnages : l'enfant géant (œil seul) | Action/expressions : l'œil se plisse, la voix gronde | Caméra : travelling avant vers l'œil | Lumière : chaude | Effets : vignette | Son : voix grave qui gronde, basse", 5, 9, (c) => {
    const k = lisse(c.p);
    return E(c, viser(surOeil(mel(66, 52, k), 0, 0), plus(OEIL, [0, 0, 0]), mel(48, 42, k), 0.5, 0.42), { vig: 0.5, fog: [200, 900] });
  }),
  P("s06p5", "Décor : l'avenue, la barrière et le panneau sous un œil immense | Personnages : aucun (l'œil de l'enfant) | Action/expressions : « Rentre dans ta maison, Léo » : l'œil domine la ville et le panneau « SORTIE INTERDITE » | Caméra : plan large en contre-plongée depuis l'avenue | Lumière : chaude | Effets : vignette | Son : silence", 5, 14, (c) => {
    const k = lisse(c.p);
    return E(c, viser(mel3([-3.4, 1.9, 44.5], [-2.2, 2.3, 46.5], k), mel3([-3, 44, 100], [-3, 50, 100], k), mel(70, 64, k), 0.5, 0.34), { vig: 0.5, fog: [100, 600] });
  }),
  P("s06p6", "Décor : l'œil énorme, la ville dans le reflet | Personnages : l'enfant géant | Action/expressions : « C'est mon jeu » : l'œil se plisse, cligne | Caméra : gros plan de l'iris | Lumière : chaude | Effets : vignette | Son : battement, basse", 5, 20, (c) => {
    const k = lisse(c.p);
    return E(c, viser(surOeil(mel(46, 36, k), 0, mel(3, 0, k)), OEIL, mel(46, 40, k), 0.5, 0.45), { vig: 0.6, fog: [200, 900] });
  }),
  P("s06p7", "Décor : l'œil de l'enfant géant, l'iris occupe tout l'écran | Personnages : l'enfant géant (œil) | Action/expressions : l'œil cligne lentement | Caméra : plan fixe qui se resserre sur l'iris | Lumière : chaude | Effets : fondu au noir | Son : battement, silence net", 5, 24, (c) => {
    const d = D(c);
    const k = lisse(c.p);
    const noir = lisse(entre(c.T, d.finNarration - 0.18, d.finNarration + 0.2));
    return E(c, viser(surOeil(mel(40, 26, k), 0, 0), OEIL, 42, 0.5, 0.45), { vig: 0.7, fx: { noir }, fog: [200, 900] });
  }),
];
void BOUL;
void TUNNEL;
void tete;
void trav;
void freine;
