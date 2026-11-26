/**
 * « J'étais l'ange gardien de ma petite sœur… » — mise en scène plan par plan (récit : histoires/recits/ange-gardien.json).
 * Chaque plan démarre sur un mot [scène, mot]. Lumière : jour doux, soleil bas de l'ouest (ombres longues vers +x),
 * flashs dorés pilotés par le temps, flashback désaturé/chaud avec vignette.
 */
import type { PlanGen } from "../../types";
import { D, P, PI, entre, faceA, lisse, mel, mel3, orb, plus, pos, rel, secousse, tete, trav, viser, type V3 } from "../cam";
import type { EtatConte, FxConte } from "../lib";
import { CH, GZ, Z_PIETON } from "./monde";

const [X] = CH;
const G = (x: number, y: number, z: number): V3 => [x, y, GZ + z];
const FOG = {
  rue: ["#D2E6F0", 50, 320] as [string, number, number],
  chambre: ["#FBE6C4", 26, 95] as [string, number, number],
  gare: ["#D9E4E2", 70, 360] as [string, number, number],
  souvenir: ["#E6D0A4", 50, 280] as [string, number, number],
  aube: ["#F3C7AE", 45, 300] as [string, number, number],
  dore: ["#F6DDAA", 45, 320] as [string, number, number],
};
const S = (cam: ReturnType<typeof viser>, brouillard: [string, number, number], vignette = 0.3, extra: Partial<EtatConte> = {}): EtatConte => ({ cam, brouillard, fx: { vignette }, ...extra });

/** Flash doré centré sur t0 : montée rapide, plateau, retombée douce (opacité 0..1). */
export const flash = (T: number, t0: number, amp = 1) => amp * entre(T, t0 - 0.14, t0 + 0.05) * (1 - entre(T, t0 + 0.2, t0 + 1.2));
const fxFlash = (T: number, t0: number, couleur = "#FFE9A0", vignette = 0.3, amp = 1): FxConte => ({ vignette, flash: [couleur, flash(T, t0, amp)] });
const SOUVENIR: Partial<EtatConte> = { ambiance: "souvenir", ciel: "#E9D3A6" };
const fxSouvenir = (vignette = 0.62, extra: Partial<FxConte> = {}): FxConte => ({ vignette, teinte: ["#FFB066", 0.4], ...extra });

export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « Dans ma ville, chaque personne possède un ange gardien invisible… »
  P("an01p1", "Vue aérienne de la rue ensoleillée : descente lente vers le passage piéton, soleil bas et ombres longues", 0, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([17, 46, 58], [11, 19, 36], k), mel3([-2, 0, 4], [0, 1.6, 12], k), 62), FOG.rue, 0.3);
  }),
  P("an01p2", "Le piéton traverse sans regarder ; la voiture jaune fonce de face (« sur le point de mourir ») ; le flash monte", 0, 10, (c) => {
    const ev = D(c).ev;
    const k = lisse(c.p);
    const sh = c.T > ev.sauve - 0.5 ? secousse(c.T, 0.05 * entre(c.T, ev.sauve - 0.5, ev.sauve)) : ([0, 0, 0] as V3);
    return { cam: viser(plus(mel3([-3.6, 1.5, 1.4], [-1.2, 1.7, 4.8], k), sh), mel3([1.2, 2.0, 13.5], [1.5, 1.9, 13.0], k), mel(56, 50, k)), brouillard: FOG.rue, fx: fxFlash(c.T, ev.sauve, "#FFE9A0", 0.3) };
  }),
  P("an01p3", "Flash doré : un pilier de lumière tombe du ciel, le piéton est déposé sur le trottoir, la voiture freine", 0, 20, (c) => {
    const ev = D(c).ev;
    const k = lisse(c.p);
    const sh = secousse(c.T, 0.05 * (1 - entre(c.T, ev.sauve, ev.sauve + 0.8)));
    return { cam: viser(plus(mel3([15.5, 3.4, 20], [12.4, 2.7, 17.4], k), sh), mel3([2.5, 3.2, 11.5], [3.4, 2.9, 12.4], k), mel(54, 46, k)), brouillard: FOG.rue, fx: fxFlash(c.T, ev.sauve, "#FFE9A0", 0.3) };
  }),
  P("an01p4", "Gros plan : une plume dorée tombe lentement et se pose sur l'asphalte", 0, 22, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([4.9, 1.9, 16.2], [4.3, 0.9, 14.6], k), [2.5, mel(3.4, 0.3, k), 11.8], 44), FOG.rue, 0.35);
  }),
  P("an01p5", "Transition dorée : Emma, sept ans, tient un bocal rempli de plumes (le sourire timide)", 0, 25, (c) => {
    const k = lisse(c.p);
    return { cam: trav(c, rel(c, "emma", [-1.0, 2.3, 5.4]), rel(c, "emma", [-0.5, 2.0, 4.0]), rel(c, "emma", [-0.2, 1.7, 0]), rel(c, "emma", [-0.3, 1.5, 0]), [46, 38], k), brouillard: FOG.chambre, fx: { vignette: 0.3, flash: ["#FFE9A0", 0.7 * (1 - entre(c.t, 0, 0.55))] } };
  }),
  P("an01p6", "Très gros plan : le bocal, douze plumes dorées qui brillent (« déjà douze »)", 0, 31, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "emma", [mel(-1.5, -1.2, k), 0.9, 2.2]), rel(c, "emma", [-0.72, 0.35, 0.1]), mel(40, 32, k), 0.5, 0.45), FOG.chambre, 0.35);
  }),

  // ======================= SCÈNE 2 — « Elle s'appelait Emma… »
  P("an02p1", "Portrait d'Emma, la lumière de la fenêtre dans les cheveux", 1, 0, (c) => S(faceA(c, "emma", [4.1, 3.5], 2.5, 0.25, 34, 2.4, 0.4), FOG.chambre, 0.3)),
  P("an02p2", "Plan large de la chambre : lit, étagère, rayon de la fenêtre et poussière dorée", 1, 3, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([X - 3.6, 3.5, 4.5], [X - 2.2, 3.1, 3.9], k), mel3([X + 0.8, 1.4, -1.2], [X + 0.8, 1.5, -1.2], k), 64), FOG.chambre, 0.3);
  }),
  P("an02p3", "Elle emporte le bocal : plan de côté, les plumes ballottent et brillent (« collectionnait ces plumes »)", 1, 8, (c) => {
    return S(viser(rel(c, "emma", [-2.7, 1.2, 2.6]), rel(c, "emma", [-0.7, 0.55, 0.3]), 46, 0.5, 0.45), FOG.chambre, 0.3);
  }),
  P("an02p4", "Gros plan sur les plumes : le bocal est posé sur la table de chevet, à côté du lit", 1, 14, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([X - 0.1, 2.2, -0.8], [X - 0.25, 2.0, -1.8], k), mel3([X - 1.1, 1.78, -3.9], [X - 1.0, 1.85, -3.9], k), mel(40, 30, k), 0.5, 0.45), FOG.chambre, 0.3);
  }),
  P("an02p5", "Une silhouette lumineuse apparaît derrière Emma, devant la fenêtre (« son ange la suivait »)", 1, 22, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([X + 0.7, 2.7, 3.3], [X + 1.0, 2.5, 2.2], k), mel3([X + 1.4, 2.0, -2.4], [X + 1.4, 2.0, -2.2], k), mel(48, 42, k), 0.5, 0.44), FOG.chambre, 0.35);
  }),
  P("an02p6", "Le narrateur, léger et transparent, derrière sa sœur : « Moi, je pensais que c'était notre grand-père »", 1, 26, (c) => {
    const k = lisse(c.p);
    return S(trav(c, [X + 0.1, 2.1, 1.5], [X + 1.9, 2.5, -1.4], rel(c, "frereCh", [0, 1.8, 0]), tete(c, "frereCh"), [50, 33], k, 0.4), FOG.chambre, 0.4);
  }),

  // ======================= SCÈNE 3 — « Chaque matin, je l'accompagnais à l'école… »
  P("an03p1", "Les enfants sortent de la maison et partent à l'école sous le soleil : travelling latéral", 2, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.4, 2.4, -36], [1.8, 2.5, -25.5], k), mel3([8.4, 1.8, -27.8], [5.6, 1.7, -21.5], k), 58), FOG.rue, 0.3);
  }),
  P("an03p2", "Emma bavarde sans arrêt, tout sourire, en regardant à côté d'elle (« Elle me parlait »)", 2, 6, (c) => S(faceA(c, "emmaR", [4.3, 3.7], 2.55, -0.9, 36, 2.4, 0.4), FOG.rue, 0.3)),
  P("an03p3", "La mère les suit des yeux, inquiète (« maman disait toujours… »)", 2, 11, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "maman", [mel(3.0, 2.4, k), 2.7, 3.6]), rel(c, "maman", [0, 2.4, 0]), 38, 0.5, 0.42), FOG.rue, 0.35);
  }),
  P("an03p4", "Orbite derrière la mère : sa fille semble parler seule (« la seule à pouvoir m'entendre »)", 2, 15, (c) => S(orb(plus(pos(c, "emmaR"), [0, 1.9, -2.2]), [9.0, 7.0], [PI, 5.9], [2.8, 2.4], lisse(c.p), 52, 0.45), FOG.rue, 0.3)),
  P("an03p5", "Le narrateur, transparent, perplexe : « Je trouvais ça bizarre »", 2, 22, (c) => S(faceA(c, "frereR", [4.2, 3.4], 2.5, 0.5, 34, 2.4, 0.4), FOG.rue, 0.4)),

  // ======================= SCÈNE 4 — « Un samedi, nous sommes allés près de l'ancienne gare… »
  P("an04p1", "Grue sur la gare abandonnée : bâtiment éventré, herbes folles, passage à niveau ; deux enfants arrivent", 3, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(G(-40, 24, 24), G(-27, 8, 13), k), mel3(G(2, 3.5, -6), G(3, 2.5, -3), k), 60), FOG.gare, 0.3);
  }),
  P("an04p2", "Suivi derrière Emma : elle traverse vers les barrières sans regarder (« sans regarder »)", 3, 8, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "emmaG", [mel(-1.6, -1.1, k), 2.6, -4.4]), G(1.0, 1.7, 1.5), 52, 0.5, 0.45), FOG.gare, 0.3);
  }),
  P("an04p3", "Les barrières descendent, feux rouges qui clignotent : Emma est déjà entre les barrières", 3, 13, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(G(-9.2, 2.8, -4.5), G(-8.2, 2.2, -2.8), k), mel3(G(-3.6, 2.2, 1.4), G(-1.8, 2.0, 1.6), k), 50), FOG.gare, 0.35);
  }),
  P("an04p4", "Un train arrive au loin sur les rails ; le frère court vers Emma, figée au milieu des voies", 3, 16, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(G(-7.4, 2.3, 10), G(-5.6, 2.0, 7.8), k), mel3(G(-0.5, 2.6, -40), G(-0.3, 2.4, -22), k), mel(44, 50, k), 0.5, 0.45), FOG.gare, 0.35);
  }),
  P("an04p5", "Le train fonce, phares éblouissants ; Emma de dos, immobile ; le frère se précipite", 3, 23, (c) => {
    const ev = D(c).ev;
    const k = lisse(c.p);
    const sh = secousse(c.T, 0.05 + 0.07 * k);
    return { cam: viser(plus(mel3(G(-2.4, 1.0, 5.8), G(-1.6, 0.8, 4.2), k), sh), mel3(G(-0.2, 2.6, -16), G(-0.1, 2.6, -9), k), 54, 0.5, 0.45), brouillard: FOG.gare, fx: fxFlash(c.T, ev.flashG, "#FFE9A0", 0.4) };
  }),
  P("an04p6", "Flash doré spectaculaire : le pilier de lumière envahit les rails, le train passe en trombe, Emma est sur le trottoir", 3, 26, (c) => {
    const ev = D(c).ev;
    const k = lisse(c.p);
    const dt = c.T - ev.train1;
    const sh = dt > -0.4 && dt < 1.6 ? secousse(c.T, 0.14 * (1 - entre(dt, 0.4, 1.6))) : ([0, 0, 0] as V3);
    return { cam: viser(plus(mel3(G(-12.5, 3.2, 9.5), G(-10.5, 2.8, 8.0), k), sh), mel3(G(-1.0, 3.0, 0.5), G(-2.5, 2.0, 2.4), k), 56), brouillard: FOG.gare, fx: fxFlash(c.T, ev.flashG, "#FFE9A0", 0.35) };
  }),

  // ======================= SCÈNE 5 — « Quand la lumière a disparu, elle tenait une treizième plume… »
  P("an05p1", "La lumière retombe en poussière dorée ; Emma, sur le trottoir, regarde ses mains pendant que le train s'éloigne", 4, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(G(-7.4, 2.0, 9.6), G(-6.2, 1.8, 8.3), k), mel3(G(-3.7, 1.7, 4.7), G(-3.7, 1.6, 4.7), k), 40, 0.5, 0.45), FOG.gare, 0.35);
  }),
  P("an05p2", "GROS PLAN sur les mains d'Emma et la plume dorée : la treizième", 4, 5, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "emmaG", [mel(0.9, 0.5, k), 2.3, 2.3]), rel(c, "emmaG", [0.05, 2.15, 0.8]), mel(38, 30, k), 0.5, 0.46), FOG.gare, 0.4);
  }),
  P("an05p3", "Son visage : la peur, elle ne sourit pas (« Mais elle ne souriait pas »)", 4, 10, (c) => S(faceA(c, "emmaG", [mel(4.2, 3.4, lisse(c.p)), 2.5], 2.5, 0.1, 32, 2.4, 0.4), FOG.gare, 0.45)),
  P("an05p4", "Profil d'Emma : son regard fixe les rails, les larmes montent (« elle murmurait »)", 4, 15, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "emmaG", [mel(-3.6, -3.0, k), 2.5, mel(1.7, 2.3, k)]), rel(c, "emmaG", [0, 2.4, 0.2]), 30, 0.5, 0.4), FOG.gare, 0.5);
  }),
  P("an05p5", "La caméra recule autour d'Emma en larmes : une silhouette translucide se révèle devant elle (« Je savais que c'était toi »)", 4, 22, (c) => {
    const k = lisse(c.p);
    const f = pos(c, "frereG");
    return S(viser(rel(c, "emmaG", [mel(-0.6, -5.8, k), mel(2.5, 3.1, k), mel(3.2, 5.6, k)]), mel3(rel(c, "emmaG", [0, 2.35, 0]), plus(f, [0, 1.8, 0]), k), mel(31, 46, k), 0.5, 0.44), FOG.gare, 0.4, { ambiance: "tendre" });
  }),
  P("an05p6", "Le frère comprend, ému ; puis plan large des deux dans la lumière dorée (« j'ai compris »)", 4, 27, (c) => {
    const k = lisse(c.p);
    const f = pos(c, "frereG");
    const e = pos(c, "emmaG");
    return S(
      viser(mel3(rel(c, "frereG", [1.9, 2.9, 3.6]), G(-11.0, 2.8, 7.4), lisse(entre(c.p, 0.4, 1))), mel3(rel(c, "frereG", [0, 2.35, 0]), mel3(plus(f, [0, 1.6, 0]), plus(e, [0, 1.4, 0]), 0.5), lisse(entre(c.p, 0.4, 1))), mel(34, 50, k), 0.5, 0.42),
      FOG.dore,
      0.45,
      { ambiance: "tendre" },
    );
  }),

  // ======================= SCÈNE 6 — « Trois ans auparavant, j'avais sauté sur ces mêmes rails… »
  P("an06p1", "Flashback (teinte chaude, vignette) : la même gare, trois ans plus tôt ; la petite Emma s'avance vers les rails", 5, 0, (c) => {
    const k = lisse(c.p);
    return { cam: viser(mel3(G(9, 3.4, 10.5), G(7, 3.0, 9.2), k), G(-2.0, 1.4, 1.6), 54), brouillard: FOG.souvenir, fx: fxSouvenir(), ...SOUVENIR };
  }),
  P("an06p2", "Le frère se met à courir vers elle, le train arrive au loin (« j'avais sauté sur ces mêmes rails »)", 5, 3, (c) => {
    const f = pos(c, "frere3");
    return { cam: viser(G(3.4, 1.7, 6.6), plus(f, [0, 1.5, 0]), 52, 0.5, 0.45), brouillard: FOG.souvenir, fx: fxSouvenir(), ...SOUVENIR };
  }),
  P("an06p3", "Il la pousse hors des rails : elle est projetée sur le trottoir ; le train frappe, flash blanc", 5, 7, (c) => {
    const ev = D(c).ev;
    const k = lisse(c.p);
    const fb = entre(c.T, ev.train2 - 0.22, ev.train2 + 0.02);
    return { cam: viser(mel3(G(-5.0, 2.2, 6.2), G(-4.2, 1.9, 5.4), k), mel3(G(-0.6, 1.2, 1.6), G(-1.4, 1.1, 2.6), k), 48), brouillard: FOG.souvenir, fx: fxSouvenir(0.62, { flash: ["#FFFFFF", fb] }), ...SOUVENIR };
  }),
  P("an06p4", "Emma survit : couchée puis assise sur le trottoir, en larmes, pendant que le train passe (« Elle avait survécu »)", 5, 12, (c) => {
    const ev = D(c).ev;
    const k = lisse(c.p);
    const fb = 1 - entre(c.T, ev.train2 + 0.02, ev.train2 + 0.7);
    return { cam: viser(G(mel(-5.6, -5.0, k), 1.6, mel(9.4, 8.3, k)), rel(c, "emma3", [0, 1.7, 0]), 36, 0.5, 0.44), brouillard: FOG.souvenir, fx: fxSouvenir(0.66, { flash: ["#FFFFFF", fb] }), ...SOUVENIR };
  }),
  P("an06p5", "Les voies vides, la poussière retombe : le frère n'est plus là (« Moi, non. »)", 5, 15, (c) => {
    const k = lisse(c.p);
    return { cam: viser(mel3(G(-8.4, 4.4, 9.6), G(-7.2, 3.4, 8.0), k), mel3(G(1.5, 1.0, -3), G(0.5, 0.8, -1), k), 52), brouillard: FOG.souvenir, fx: fxSouvenir(0.72), ...SOUVENIR };
  }),
  P("an06p6", "Retour au présent, lumière douce du matin : Emma sur le banc du quai, le fantôme debout près d'elle (« elle venait me rendre visite »)", 5, 17, (c) => {
    const k = lisse(c.p);
    return S(orb(G(5.4, 1.8, -20.4), [mel(10.5, 6.2, k), 6.2], [mel(-1.9, -1.45, k), -1.45], [mel(3.2, 2.0, k), 2.0], 1, mel(50, 40, k), 0.44), FOG.dore, 0.3, { ambiance: "tendre" });
  }),
  P("an06p7", "« Chaque matin » : contre-jour, soleil bas, deux silhouettes au bord du quai", 5, 25, (c) => {
    const k = lisse(c.p);
    return S(viser(G(mel(9.2, 8.5, k), 1.6, -21.0), G(2.5, 2.6, -19.6), 52, 0.5, 0.42), FOG.aube, 0.4, { ambiance: "aube", ciel: "#F6C0A2" });
  }),
  P("an06p7b", "« J'étais son ange gardien » : le fantôme, auréole et ailes d'or, vu en contre-plongée", 5, 29, (c) => {
    const k = lisse(c.p);
    return S(viser(rel(c, "frereF", [mel(-1.6, -0.4, k), mel(1.2, 3.2, k), mel(4.8, 5.6, k)]), rel(c, "frereF", [0, mel(2.4, 2.9, k), 0]), mel(48, 44, k), 0.5, 0.44), FOG.dore, 0.4, { ambiance: "dore" });
  }),
  P("an06p8", "Emma retient la treizième plume au-dessus du bocal, elle descend et se pose : treize (« Mais pourquoi… »)", 5, 34, (c) => {
    const ev = D(c).ev;
    const k = lisse(c.p);
    return { cam: viser(G(mel(3.4, 4.1, k), mel(2.9, 2.6, k), mel(-17.6, -18.6, k)), G(5.5, 2.05, -19.3), 38, 0.5, 0.45), brouillard: FOG.dore, fx: { vignette: 0.35, flash: ["#FFE9A0", 0.35 * (1 - entre(c.T, ev.depose - 0.3, ev.depose + 0.4)) * entre(c.T, ev.depose - 0.5, ev.depose - 0.3)] }, ambiance: "dore" };
  }),
  P("an06p9", "Le couvercle se pose, gros plan : elle écrit « Mon frère » au feutre", 5, 38, (c) => {
    const k = lisse(c.p);
    return S(viser(G(mel(6.7, 6.9, k), mel(3.5, 3.4, k), mel(-17.0, -17.3, k)), G(5.35, 1.95, -19.1), 32, 0.5, 0.45), FOG.dore, 0.4, { ambiance: "dore" });
  }),
  P("an06p10", "Recul lent : la silhouette du frère s'efface dans la lumière, Emma serre le bocal ; dernière image", 5, 41, (c) => {
    const d = D(c);
    const k = lisse(entre(c.p, 0, 1));
    const fl = Math.min(1, entre(c.T, d.ev.disparait, d.ev.disparait + 1.0)) * (1 - entre(c.T, d.ev.disparait + 1.0, d.ev.disparait + 2.3));
    const noir = 0.5 * entre(c.T, d.finNarration + 0.6, d.fin);
    return { cam: viser(mel3(G(6.5, 3.2, -17.3), G(-1.2, 2.6, -14.0), k), mel3(G(5.0, 1.9, -19.4), G(4.6, 2.2, -20.2), k), mel(34, 50, k), 0.5, 0.44), brouillard: FOG.dore, fx: { vignette: 0.45, flash: ["#FFE9A0", 0.7 * fl], noir }, ambiance: "dore" };
  }, { continu: false }),
];
void tete;
void Z_PIETON;
