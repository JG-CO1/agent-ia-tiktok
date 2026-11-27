/**
 * « Tout ce que j'envoie par message devient réel… » — mise en scène plan par plan (récit : histoires/recits/messages.json).
 * Chaque plan démarre sur un mot [scène, mot] (scène 1 = indice 0). Trois lieux : la chambre de Sam (x ≈ −400), la rue qui
 * devient rose (origine) et le vide blanc de la conversation (z ≈ 800). Rythme : plans de ~1,5 s, qui s'accélèrent vers
 * la remontée du fil, puis ralentissent sur le twist ; dernier plan : contre-plongée sur le bouton, noir sur `finNarration`.
 */
import type { PlanGen } from "../../types";
import { D, P, entre, faceA, freine, lisse, mel, mel3, orb, plus, pos, rel, secousse, viser, type V3 } from "../cam";
import type { EtatConte } from "../lib";
import { CH, VIDE, Y_TOP } from "./monde";
import { LOPES, MAMAN, PAPA, SAM_V, YANIS } from "./histoire";

const [X] = CH;
const [VX, , VZ] = VIDE;

/** Mélange de deux couleurs hexadécimales. */
function melCoul(a: string, b: string, k: number): string {
  const n = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}
const CIEL = { jour: "#A6D8FF", rose: "#FFB4DA", vide: "#EEF4FF", blanc: "#FFFFFF", chambre: "#9ED2FF" };
const FOG = {
  chambre: ["#B8DCFF", 30, 160] as [string, number, number],
  jour: ["#BDE2FF", 50, 280] as [string, number, number],
  rose: ["#FFBEDF", 44, 250] as [string, number, number],
  aerienR: ["#FFC2E0", 70, 300] as [string, number, number],
  vide: ["#EEF4FF", 40, 230] as [string, number, number],
  blanc: ["#FFFFFF", 36, 170] as [string, number, number],
};
type Etat = EtatConte & { bul?: Partial<Record<"b3" | "g1" | "g2" | "g1b", V3>>; /** gros plan sur le téléphone : l'écran est tourné vers la caméra */ telFace?: boolean };
const S = (cam: ReturnType<typeof viser>, brouillard: [string, number, number], ciel: string, vignette = 0.3, extra: Partial<Etat> = {}): Etat => ({ cam, brouillard, ciel, fx: { vignette }, ...extra });
/** Ciel et brouillard de la rue selon l'avancée de la vague rose (état normal avant, rose après, normal dans la vision). */
function rue(c: { T: number }, ev: Record<string, number>): { ciel: string; brouillard: [string, number, number] } {
  const k = c.T >= ev.vision0 ? 0 : lisse(entre(c.T, ev.rose, ev.rose + 1.9));
  return { ciel: melCoul(CIEL.jour, CIEL.rose, k), brouillard: [melCoul(FOG.jour[0], FOG.rose[0], k), mel(FOG.jour[1], FOG.rose[1], k), mel(FOG.jour[2], FOG.rose[2], k)] };
}
const SR = (c: { T: number; p: number }, cam: ReturnType<typeof viser>, ev: Record<string, number>, vignette = 0.3, extra: Partial<Etat> = {}): Etat => {
  const r = rue(c, ev);
  return { cam, brouillard: r.brouillard, ciel: r.ciel, fx: { vignette }, ...extra };
};
/** Titre normalisé d'un plan (sert au storyboard livré). */
const t = (decor: string, perso: string, action: string, camera: string, lumiere: string, effets: string, son: string) => `Décor : ${decor} | Personnages : ${perso} | Action/expressions : ${action} | Caméra : ${camera} | Lumière : ${lumiere} | Effets : ${effets} | Son : ${son}`;
const flash = (T: number, t0: number, amp = 0.8, av = 0.1, ap = 0.5) => amp * entre(T, t0 - av, t0 + 0.04) * (1 - entre(T, t0 + 0.1, t0 + ap));

// Repères utiles
const SAMCH = (c: Parameters<typeof rel>[0]) => rel(c, "sam", [0, 1.8, 0.86]);
/** Montée le long du fil : position verticale de la caméra (accélération puis arrivée en douceur). */
const MONTEE = (T: number, ev: Record<string, number>) => lisse(Math.pow(entre(T, ev.monte0, ev.haut + 0.1), 1.3));

export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « Tout ce que j'envoie par message devient réel… »
  P("s01p1", t("chambre de Sam, pastel, fenêtre sur la rue", "son pouce (couleur peau) et les mains de Sam (sweat orange)", "le pouce appuie sur « envoyer » : une bulle bleue (« Il pleut des bonbons. ») jaillit de l'écran et grossit", "gros plan de face sur le téléphone tenu à deux mains, le pouce appuie et la bulle fonce vers la caméra", "lueur bleue de l'écran, jour doux de la fenêtre", "bulle 3D qui grossit, vignette", "pop d'envoi puis ding de réception, boîte à musique pastel"), 0, 0, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return S(viser(mel3(rel(c, "sam", [0.45, 2.2, 2.3]), rel(c, "sam", [0.25, 2.1, 1.8], ), k), rel(c, "sam", [0, 1.6, 0.86]), mel(46, 44, k)), FOG.chambre, CIEL.chambre, 0.3, { telFace: true });
  }),
  P("s01p2", t("chambre de Sam, bulle géante qui flotte devant la fenêtre", "Sam de dos, debout au milieu de la pièce", "la bulle (« Il pleut des bonbons. ») flotte au-dessus de lui, énorme, bleue", "plan large depuis le coin de la pièce, léger recul", "lueur bleue de la bulle, jour de la fenêtre", "glow bleu autour de la bulle", "boîte à musique pastel, ding"), 0, 6, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([X + 1.7, 3.0, 3.9], [X + 2.2, 3.1, 4.3], k), mel3([X + 0.2, 2.4, -1.7], [X + 0.4, 2.5, -2.1], k), mel(62, 58, k)), FOG.chambre, CIEL.chambre, 0.3);
  }),
  P("s01p3", t("chambre de Sam, la bulle bleue en haut de l'image", "Sam (14 ans)", "gros plan sur son visage éclairé en bleu : stupéfait puis curieux (« Je l'ai compris »)", "face à lui depuis la fenêtre, gros plan, légère poussée", "lueur bleue sur le visage, contre-jour de la fenêtre", "vignette", "boîte à musique, nappe discrète"), 0, 8, (c) => S(faceA(c, "sam", [2.9, 2.5], 2.95, 0.5, 36, 2.45, 0.36), FOG.chambre, CIEL.chambre, 0.35)),
  P("s01p4", t("écran du téléphone : conversation avec Yanis (avatar violet à casquette)", "Yanis (en icône), Sam (main hors champ)", "le message « Il pleut des bonbons. » est parti dans le fil, bulle bleue à droite", "gros plan de face sur l'écran du téléphone, en légère poussée", "lumière bleutée de l'écran", "aucun", "boîte à musique"), 0, 12, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(rel(c, "sam", [0.3, 2.45, 2.2]), rel(c, "sam", [0.1, 2.35, 1.7]), k), rel(c, "sam", [0, 2.0, 0.86]), mel(38, 34, k)), FOG.chambre, CIEL.chambre, 0.35, { telFace: true });
  }),
  P("s01p5", t("chambre de Sam, mur de la fenêtre", "Sam de dos", "la bulle s'envole vers la fenêtre, grossit et éclate contre la vitre en pixels carrés (« bonbons. »)", "plan large depuis l'arrière-gauche, travelling latéral vers la fenêtre", "flash blanc de l'éclatement", "flash, particules carrées, vignette", "éclat de verre, crépitement de pixels"), 0, 19, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    const f = flash(c.T, ev.eclat, 0.7, 0.05, 0.5);
    return S(viser(mel3([X - 2.6, 2.7, 3.2], [X - 0.2, 2.6, 2.0], k), [X + 0.7, 2.5, -4.0], mel(56, 50, k)), FOG.chambre, CIEL.chambre, 0.3, { fx: { vignette: 0.3, flash: ["#FFFFFF", f] } });
  }),
  P("s01p6", t("fenêtre de la chambre ouverte sur la rue d'en face, maisons pastel", "Sam de dos à la fenêtre, Yanis dehors (sweat violet, casquette) téléphone en main", "la première sphère de bonbon tombe du ciel, puis la pluie ; Yanis lève les yeux, stupéfait", "plan fixe qui avance doucement vers la fenêtre, cadré sur la rue", "jour clair, lueur du ciel", "pluie de bonbons colorés", "pluie cristalline de bonbons, ding de la première sphère"), 0, 24, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([X + 2.2, 2.55, -0.4], [X + 1.7, 2.45, -2.4], k), mel3([X + 0.6, 2.7, -10], [X + 1.0, 3.0, -9], k), mel(48, 44, k)), FOG.chambre, CIEL.chambre, 0.25);
  }),
  P("s01p7", t("vue aérienne de la rue de quartier : maisons pastel, boulangerie à auvent rayé, maison de Mme Lopes", "passants minuscules sous la pluie", "la rue entière se réécrit : une vague rose balaie les maisons, le sol devient caramel, les bonbons tombent", "descente aérienne face à la rue, qui plonge vers l'avenue", "soleil de bonbon rose, halo magenta", "vague rose lumineuse, brouillard rose, pluie de bonbons", "balayage de réécriture montant, pluie cristalline"), 0, 28, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([7, 54, 78], [3, 26, 42], k), mel3([0, 3, -12], [0, 2, -4], k), mel(62, 58, k)), ev, 0.3, { fx: { vignette: 0.3, flash: ["#FFE3F6", flash(c.T, ev.rose + 0.9, 0.3, 0.3, 0.6)] } });
  }),
  P("s01p8", t("rue rose et collante : sol caramel, maisons bonbon, bonbons qui tombent comme de la pluie", "Sam de dos au milieu de la chaussée, passants sous des parapluies", "Sam, téléphone en main, regarde la rue rose ; les passants s'abritent des bonbons", "travelling bas qui avance dans l'axe de la rue", "soleil rose, ciel de barbe à papa", "pluie de bonbons, brouillard rose, vignette", "pluie cristalline de bonbons, boîte à musique"), 0, 32, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([0.6, 1.1, 17], [0.4, 1.5, 11], k), mel3([0, 2.6, -3], [-0.8, 2.3, -4], k), mel(54, 50, k)), ev, 0.3);
  }),

  // ======================= SCÈNE 2 — « Mais chaque message réalisé efface quelque chose… »
  P("s02p1", t("rue rose sous la pluie de bonbons", "Sam (inquiet)", "gros plan sur son visage : l'euphorie retombe, il comprend que quelque chose cloche", "gros plan frontal, poussée lente", "soleil rose, contre-jour doré", "pluie de bonbons derrière lui, vignette", "pluie cristalline, boîte à musique qui ralentit"), 1, 0, (c) => {
    const ev = D(c).ev;
    return SR(c, faceA(c, "sam", [3.6, 2.7], 2.5, 0.3, 36, 2.45, 0.37), ev, 0.38);
  }),
  P("s02p2", t("rue rose, boulangerie à auvent rayé au fond à droite", "Sam, passants sous leurs parapluies", "la caméra quitte Sam et glisse vers la boulangerie, encore intacte", "travelling latéral vers la vitrine", "soleil rose rasant, ombres longues violettes", "brouillard rose", "pluie cristalline, pad triste qui entre"), 1, 4, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([-5.2, 1.9, -4.6], [-2.4, 2.2, -8.8], k), mel3([14, 3.0, -13], [14, 3.0, -16], k), mel(56, 52, k)), ev, 0.3);
  }),
  P("s02p3", t("façade de la boulangerie : vitrine de pains et de gâteaux, auvent rayé, enseigne « BOULANGERIE »", "aucun", "la boulangerie, parfaitement normale sous la pluie de bonbons", "travelling d'approche face à la façade", "soleil rose, reflets sur la vitrine", "pluie de bonbons", "pluie cristalline"), 1, 7, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([3.0, 2.4, -10.5], [5.6, 2.7, -13.2], k), mel3([14, 3.0, -16.2], [14, 3.2, -16.2], k), mel(54, 50, k)), ev, 0.32);
  }),
  P("s02p4", t("la boulangerie se dissout bloc par bloc, comme un « annuler » : le toit puis l'auvent puis les murs s'effacent", "aucun", "des carrés de pixels s'envolent ; il ne reste qu'un terrain vide", "recul et montée en diagonale devant la façade pendant qu'elle disparaît", "soleil rose, éclats blancs et roses", "dissolution en blocs, particules carrées, scintillement", "balayage « annuler » descendant, crépitement de pixels"), 1, 11, (c) => {
    const k = freine(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([6.2, 3.6, -6.2], [0.8, 7.0, -3.2], k), mel3([14, 3.2, -16.5], [14, 2.2, -16.5], k), mel(54, 60, k)), ev, 0.3);
  }),
  P("s02p5", t("trottoir devant le terrain vide de la boulangerie", "passants sous leurs parapluies à bonbons", "ils marchent devant le vide sans le regarder : personne ne regrette rien", "travelling bas de profil qui suit un passant, le terrain vide derrière lui", "soleil rose, ciel de barbe à papa", "pluie de bonbons", "pluie cristalline, pad triste"), 1, 14, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    const a = pos(c, "pA");
    return SR(c, viser(mel3([a[0] - 7.4, 1.5, a[2] - 2.6], [a[0] - 6.4, 1.6, a[2] - 2.0], k), plus(a, [0.4, 2.3, 0.9]), mel(56, 52, k)), ev, 0.32);
  }),
  P("s02p6", t("trottoir ouest, bonbons qui tombent", "passante (cheveux longs) sous son parapluie", "visage neutre, indifférent, elle passe sans un regard pour le vide", "gros plan de face, suivi", "soleil rose, ombres violettes", "vignette", "pluie cristalline, goutte lointaine"), 1, 18, (c) => {
    const ev = D(c).ev;
    return SR(c, faceA(c, "pB", [3.4, 2.7], 2.5, 0.2, 36, 2.45, 0.37), ev, 0.38);
  }),
  P("s02p7", t("rue rose, terrain vide de la boulangerie au loin", "Sam de dos qui se retourne", "il se retourne, seul à se souvenir ; la caméra le dépasse", "plan moyen derrière lui, léger travelling circulaire", "soleil rose, contre-jour", "vignette", "battements de cœur lents"), 1, 19, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([-6.6, 3.8, 3.8], [-6.0, 3.5, 2.6], k), mel3([12, 1.8, -15], [14, 1.6, -16], k), mel(56, 52, k)), ev, 0.38);
  }),
  P("s02p8", t("rue rose, bonbons qui tombent derrière lui", "Sam (14 ans)", "gros plan inquiet : seul à se souvenir de la boulangerie", "gros plan frontal, zoom lent", "soleil rose", "vignette, pluie de bonbons", "battements de cœur, pad triste"), 1, 21, (c) => {
    const ev = D(c).ev;
    return SR(c, faceA(c, "sam", [3.1, 2.6], 2.45, 0.0, 34, 2.45, 0.37), ev, 0.45);
  }),

  // ======================= SCÈNE 3 — « J'ai continué. « Le chien de ma voisine est guéri. »… »
  P("s03p1", t("jardin de Mme Lopes vu du trottoir, rue rose", "Sam (resolu), ses pouces sur le clavier", "il tape « Le chien de ma voisine est guéri. » : le texte s'écrit lettre par lettre", "gros plan de face sur le téléphone", "lueur bleue de l'écran sur fond rose", "aucun", "touches de clavier"), 2, 0, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3(rel(c, "sam", [0.3, 2.2, 2.2]), rel(c, "sam", [0.1, 2.1, 1.7]), k), rel(c, "sam", [0, 1.55, 0.86]), mel(44, 40, k)), ev, 0.32, { telFace: true });
  }),
  P("s03p2", t("rue rose, ciel de barbe à papa", "Sam", "la bulle bleue (« Le chien de ma voisine est guéri. ») jaillit du téléphone et flotte au-dessus du jardin", "plan moyen en contre-plongée qui monte avec la bulle", "lueur bleue de la bulle sur le rose", "glow bleu", "pop d'envoi, ding"), 2, 2, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([1.2, 1.6, 6.4], [0.4, 2.6, 8.4], k), mel3([-7.4, 4.0, 13.6], [-8.8, 5.2, 15.0], k), mel(62, 58, k)), ev, 0.3);
  }),
  P("s03p3", t("jardin de Mme Lopes : niche, pelouse rose", "le chien marron en blocs, malade, couché sur le flanc", "il respire faiblement, yeux fermés ; la bulle s'abat sur lui et éclate", "plan serré au-dessus de la clôture sur le chien", "lueur bleue de la bulle, ombre verdâtre", "éclatement de pixels bleus et jaunes", "éclat de verre, aboiement joyeux"), 2, 7, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([-4.2, 2.9, 16.0], [-5.4, 2.3, 17.4], k), mel3([-9.5, 0.9, 20.4], [-9.5, 1.2, 20.2], k), mel(46, 40, k)), ev, 0.35, { bul: { b3: [-9, 5, 15] } });
  }),
  P("s03p4", t("jardin de Mme Lopes", "le chien guéri, Mme Lopes (cheveux gris, robe fleurie), Sam", "le chien bondit de joie en cercle, Mme Lopes lève les bras", "plan moyen qui accompagne les bonds", "soleil rose", "étincelles de pixels", "aboiements joyeux, boîte à musique qui déraille"), 2, 12, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([-3.2, 3.2, 12.8], [-4.8, 3.4, 14.4], k), mel3([-10.4, 1.8, 18.0], [-10.4, 2.0, 18.4], k), mel(60, 56, k)), ev, 0.28);
  }),
  P("s03p5", t("façade de la maison de Mme Lopes (toit en escalier de blocs, fenêtre fleurie, porte bleue)", "Mme Lopes devant sa maison, le chien", "la maison commence à s'effacer par le toit ; Mme Lopes sourit encore", "plan large qui recule, légèrement en plongée", "soleil rose, éclats blancs", "dissolution en blocs, particules carrées", "balayage « annuler » descendant, crépitement de pixels"), 2, 16, (c) => {
    const k = freine(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([-5.6, 3.4, 11.0], [-2.2, 4.8, 6.8], k), mel3([-14, 3.6, 17], [-14, 3.0, 17], k), mel(56, 62, k)), ev, 0.3);
  }),
  P("s03p6", t("la maison de Mme Lopes se défait, pelouse rose", "Mme Lopes (se dissout avec sa maison), le chien", "la voisine disparaît avec les derniers blocs, il ne reste que la pelouse", "plan bas depuis le trottoir sur le jardin qui se vide, léger travelling", "soleil rose, pixels blancs", "dissolution en blocs et en pixels, vignette", "balayage « annuler », silence qui se creuse"), 2, 22, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([-6.0, 2.2, 12.0], [-7.6, 2.4, 15.0], k), mel3([-14.0, 2.2, 17.4], [-12.8, 1.4, 18.6], k), mel(56, 52, k)), ev, 0.4);
  }),
  P("s03p7", t("terrain vide de la maison de Mme Lopes, pelouse rose et niche", "le chien assis seul, Sam de dos", "le chien regarde le vide ; Sam, glacé, ne bouge plus", "plan large le long de la rue sur le terrain vide entre les maisons voisines, poussée lente", "soleil rose", "pluie de bonbons, vignette", "pad triste, battements de cœur"), 2, 26, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([-7.6, 2.4, 2.6], [-7.6, 2.2, 6.6], k), [-12.5, 1.9, 22.0], mel(58, 52, k)), ev, 0.42);
  }),

  // ======================= SCÈNE 4 — « Paniqué, j'ai tapé… Impossible. Un seul message peut être supprimé. »
  P("s04p1", t("rue rose devant le terrain vide", "Sam (14 ans), paniqué", "les mains sur la tête, visage effaré", "gros plan frontal nerveux, caméra qui tremble", "soleil rose, ombres dures", "secousse de caméra, vignette", "battements de cœur rapides"), 3, 0, (c) => {
    const ev = D(c).ev;
    const sh = secousse(c.T, 0.03);
    const b = faceA(c, "sam", [3.0, 2.4], 2.45, 0.2, 36, 2.45, 0.37);
    return SR(c, viser(plus(b.pos, sh), plus(b.look, sh), 36), ev, 0.5);
  }),
  P("s04p2", t("rue rose, écran du téléphone avec clavier", "Sam, pouces fébriles", "il tape « Tout redevient comme avant. » ; la bulle part dans le ciel", "gros plan de face sur l'écran qui tremble", "lueur bleue de l'écran", "secousse légère", "touches de clavier rapides, pop d'envoi"), 3, 2, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    const sh = secousse(c.T, 0.012);
    return SR(c, viser(plus(mel3(rel(c, "sam", [0.3, 2.2, 2.2]), rel(c, "sam", [0.1, 2.1, 1.6]), k), sh), rel(c, "sam", [0, 1.55, 0.86]), mel(44, 38, k)), ev, 0.35, { telFace: true });
  }),
  P("s04p3", t("rue rose, ciel de barbe à papa", "Sam, bulle grise du système", "une bulle grise à trois points apparaît : le système répond", "plan moyen en légère contre-plongée, poussée", "lueur grise-bleue de la bulle", "glow gris", "ding grave du système"), 3, 10, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([2.6, 2.2, 3.4], [1.2, 2.6, 5.0], k), mel3([-8.6, 4.2, 10.6], [-9.0, 4.6, 10.2], k), mel(56, 52, k)), ev, 0.4, { bul: { g1: [-9.0, 4.6, 10.2] } });
  }),
  P("s04p4", t("rue rose, bulle grise géante", "Sam minuscule dessous", "« Impossible. » : la bulle grise s'impose, Sam recule", "gros plan sur la bulle, poussée brusque", "lueur grise-blanche dure", "léger flash, secousse", "ding grave, choc sourd"), 3, 13, (c) => {
    const k = freine(c.p);
    const ev = D(c).ev;
    const sh = secousse(c.T, 0.02 * (1 - entre(c.t, 0, 0.4)));
    return SR(c, viser(plus(mel3([3.4, 3.0, 4.6], [1.6, 3.4, 5.8], k), sh), [-9.0, 4.6, 10.2], mel(50, 44, k)), ev, 0.45, { bul: { g1: [-9.0, 4.6, 10.2] } });
  }),
  P("s04p5", t("rue rose, deux bulles grises : « Impossible. » et « Un seul message peut être supprimé. »", "Sam", "la phrase du système s'affiche, énorme, au-dessus de lui", "plongée puis poussée vers la bulle", "lueur grise-blanche", "vignette", "ding grave"), 3, 14, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    return SR(c, viser(mel3([4.2, 2.8, 5.0], [2.4, 3.4, 7.0], k), mel3([-9.4, 5.6, 12.6], [-9.6, 5.4, 13.0], k), mel(58, 54, k)), ev, 0.45, { bul: { g1b: [-9.2, 9.8, 12.2], g2: [-9.6, 5.4, 13.0] } });
  }),
  P("s04p6", t("rue rose, bulles grises dans le ciel", "Sam (14 ans)", "il lit « supprimé » : le visage se ferme, il lève les yeux vers le fil", "gros plan frontal, poussée lente", "lueur grise sur le visage", "vignette", "battements de cœur, nappe qui monte"), 3, 19, (c) => {
    const ev = D(c).ev;
    return SR(c, faceA(c, "sam", [3.2, 2.5], 2.4, -0.1, 34, 2.45, 0.37), ev, 0.5);
  }),
  P("s04p7", t("le vide blanc de la conversation : colonne de bulles géantes qui s'étire vers le ciel", "aucun", "la caméra remonte le fil : « Un seul message peut être supprimé. », « Impossible. », « Tout redevient comme avant. », « Le chien… », « Il pleut des bonbons. », puis les vieux messages", "travelling vertical vertigineux le long du fil, qui accélère", "blanc-bleuté, lueur des bulles", "flash blanc à l'entrée, brouillard blanc, poussière de pixels", "whoosh montant, montée de tension, houle"), 3, 22, (c) => {
    const ev = D(c).ev;
    const u = MONTEE(c.T, ev);
    const y = mel(7, Y_TOP + 6, u);
    const pos0: V3 = [VX + mel(1.5, 0.5, u), y, VZ + mel(25, 30, u)];
    return S(viser(pos0, [VX, y + mel(8, 14, u), VZ], mel(60, 70, u)), FOG.vide, CIEL.vide, 0.2, { fx: { vignette: 0.2, flash: ["#FFFFFF", 0.9 * (1 - entre(c.t, 0, 0.35))] } });
  }),
  P(
    "s04p8",
    t("le vide blanc de la conversation, fil de bulles qui défilent", "aucun", "la montée s'emballe : les bulles filent, des dates passent (« Il y a 8 ans », « Il y a 12 ans »)", "même travelling vertical, plus rapide, champ qui s'élargit", "blanc-bleuté, halo blanc au sommet", "brouillard blanc, poussière de pixels", "whoosh montant, houle, tension qui monte"),
    3,
    26,
    (c) => {
      const ev = D(c).ev;
      const u = MONTEE(c.T, ev);
      const y = mel(7, Y_TOP + 6, u);
      const pos0: V3 = [VX + mel(1.5, 0.5, u), y, VZ + mel(25, 30, u)];
      return S(viser(pos0, [VX, y + mel(8, 14, u), VZ], mel(60, 70, u)), FOG.vide, CIEL.vide, 0.2);
    },
    { continu: true },
  ),

  // ======================= SCÈNE 5 — « Le premier message datait d'il y a quinze ans… »
  P("s05p1", t("sommet du fil : plateforme blanche et bleue, bulle énorme « Je voudrais un fils parfait. » au bout du vide", "Sam minuscule sur la plateforme", "arrivée en haut : le premier message se dresse, immense", "plan large qui se stabilise après la montée, en légère contre-plongée", "lumière blanche, halo derrière la bulle", "brouillard blanc", "choc sourd, nappe"), 4, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([VX + 1.0, Y_TOP + 2.0, VZ + 38], [VX + 1.8, Y_TOP + 2.6, VZ + 31], k), [VX, Y_TOP + 10.8, VZ - 9], mel(62, 58, k)), FOG.vide, CIEL.vide, 0.25);
  }),
  P("s05p2", t("sommet du fil, pastille « Il y a 15 ans » au-dessus de la bulle géante", "aucun", "la date du premier message : il y a quinze ans", "plongée inversée : la caméra monte vers la pastille", "lumière blanche", "brouillard blanc", "nappe, cœur"), 4, 7, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([VX - 1, Y_TOP + 13, VZ + 16], [VX + 1, Y_TOP + 15.5, VZ + 9], k), mel3([VX, Y_TOP + 16.8, VZ - 9], [VX, Y_TOP + 19.2, VZ - 9], k), mel(46, 40, k)), FOG.vide, CIEL.vide, 0.3);
  }),
  P("s05p3", t("sommet du fil, souvenir chaud derrière la bulle", "la mère (silhouette translucide, téléphone en main)", "elle tape un message, silhouette douce dans une lueur chaude", "gros plan de trois quarts, légèrement flou chaud", "halo chaud orangé sur fond blanc", "silhouette translucide, vignette chaude", "halo, cœur"), 4, 9, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([MAMAN[0] - 5.6, Y_TOP + 3.6, MAMAN[2] + 8.6], [MAMAN[0] - 4.6, Y_TOP + 3.2, MAMAN[2] + 7.0], k), plus(MAMAN, [0.2, 2.2, 0]), mel(40, 34, k)), FOG.vide, CIEL.vide, 0.4, { fx: { vignette: 0.4, teinte: ["#FFB066", 0.18] } });
  }),
  P("s05p4", t("sommet du fil, souvenir chaud derrière la bulle", "le père (silhouette translucide)", "il écoute, sourit doucement", "gros plan de trois quarts, poussée lente", "halo chaud orangé sur fond blanc", "silhouette translucide, vignette chaude", "halo, cœur"), 4, 14, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([PAPA[0] + 5.2, Y_TOP + 3.6, PAPA[2] + 8.6], [PAPA[0] + 4.2, Y_TOP + 3.2, PAPA[2] + 7.0], k), plus(PAPA, [0, 2.3, 0]), mel(40, 34, k)), FOG.vide, CIEL.vide, 0.4, { fx: { vignette: 0.4, teinte: ["#FFB066", 0.18] } });
  }),
  P("s05p5", t("sommet du fil : le premier message en grand, bulle bleue « Je voudrais un fils parfait. »", "aucun", "les mots remplissent l'image : « Je voudrais un fils parfait. »", "poussée lente vers le texte de la bulle", "lumière blanche, bulle bleue éclatante", "glow bleu, brouillard blanc", "ding, cœur"), 4, 18, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([VX + 0.5, Y_TOP + 11, VZ + 36], [VX, Y_TOP + 11.4, VZ + 16], k), [VX, Y_TOP + 11.2, VZ - 9], mel(46, 42, k)), FOG.vide, CIEL.vide, 0.3);
  }),
  P("s05p6", t("sommet du fil : le panneau « Supprimer ce message ? » surgit sous la bulle, boutons Annuler et Supprimer", "aucun", "la caméra descend de la bulle vers le panneau qui apparaît", "tilt vertical qui descend en avançant", "lumière blanche, bouton rouge éclatant", "pop du panneau, brouillard blanc", "pop, ding grave, choc"), 4, 24, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([VX + 0.5, Y_TOP + 9.5, VZ + 27], [VX + 1.2, Y_TOP + 6.5, VZ + 20], k), mel3([VX, Y_TOP + 11, VZ - 9], [VX + 0.8, Y_TOP + 4.2, VZ + 3], k), mel(52, 48, k)), FOG.vide, CIEL.vide, 0.3);
  }),
  P("s05p7", t("sommet du fil : panneau « Supprimer ce message ? », bouton Supprimer rouge", "Sam de dos, minuscule devant le panneau", "il lit la question ; le bouton rouge palpite", "plan par-dessus l'épaule de Sam, poussée vers le bouton", "lumière blanche, halo rouge du bouton", "pulsation lumineuse rouge", "cœur, drone menaçant"), 4, 29, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([SAM_V[0] + 4.2, Y_TOP + 5.4, SAM_V[2] + 10.5], [SAM_V[0] + 3.2, Y_TOP + 4.4, SAM_V[2] + 6.8], k), mel3([VX + 1.0, Y_TOP + 3.9, VZ + 2.4], [VX + 2.4, Y_TOP + 2.8, VZ + 3.2], k), mel(46, 40, k)), FOG.vide, CIEL.vide, 0.35);
  }),

  // ======================= SCÈNE 6 — « C'était moi, le message. »
  P("s06p1", t("sommet du fil, fond blanc", "Sam (14 ans, sweat orange)", "gros plan : « C'était moi, le message. » — le visage se vide, il comprend", "gros plan frontal, poussée rapide", "lumière blanche dure, joues pâles", "vignette, brouillard blanc", "choc sourd, silence"), 5, 0, (c) => {
    const k = lisse(c.p);
    const b = faceA(c, "sam", [3.4, 2.55], 2.55, 0, 34, 2.45, 0.37);
    return S(b, FOG.blanc, CIEL.blanc, 0.4 + 0.1 * k);
  }),
  P("s06p2", t("sommet du fil, fond blanc", "Sam : ses mains", "il se regarde les mains : elles ont une texture de pixels translucides qui scintillent et se détachent", "gros plan sur les mains devant le visage", "lumière blanche dure", "pixels bleutés translucides, scintillement", "crépitement de pixels, cœur"), 5, 3, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(rel(c, "sam", [0.5, 2.9, 2.9]), rel(c, "sam", [0.3, 2.65, 2.0]), k), rel(c, "sam", [0, 2.0, 0.75]), mel(36, 30, k), 0.5, 0.4), FOG.blanc, CIEL.blanc, 0.4);
  }),
  P("s06p3", t("sommet du fil : bouton rouge « Supprimer » immense", "le pouce de Sam, pixellisé", "son pouce tremble au-dessus du bouton", "plan serré en plongée sur le pouce et le bouton rouge", "lumière blanche, halo rouge sur le pouce", "pixels translucides, tremblement", "souffle, cœur"), 5, 4, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([VX + 12.0, Y_TOP + 7.6, VZ + 20.0], [VX + 10.2, Y_TOP + 6.6, VZ + 17.0], k), [VX + 3.3, Y_TOP + 3.5, VZ + 4.4], mel(36, 32, k)), FOG.blanc, CIEL.blanc, 0.4);
  }),
  P("s06p4", t("sommet du fil, plateforme immense", "Sam minuscule devant le panneau et le bouton", "il est tout petit, figé devant la décision", "plan large en plongée, lent tour de caméra", "lumière blanche, bouton rouge éclatant", "brouillard blanc", "nappe blanche, cœur"), 5, 8, (c) => {
    const k = lisse(c.p);
    return S(viser(orb([VX + 2, Y_TOP + 3, VZ + 6], [27, 24], [-0.55, -0.2], [Y_TOP + 11, Y_TOP + 8], k, 56).pos, [VX + 2, Y_TOP + 3.4, VZ + 6], mel(56, 52, k)), FOG.blanc, CIEL.blanc, 0.3);
  }),
  P("s06p5", t("sommet du fil, derrière Sam", "Sam de dos, minuscule, le bouton rouge devant lui", "« Si j'appuie » : il tend la main vers le bouton", "plan bas derrière lui, qui avance", "lumière blanche, halo rouge", "pulsation rouge", "cœur, nappe"), 5, 10, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([SAM_V[0] + 2.2, Y_TOP + 2.2, SAM_V[2] + 5.4], [SAM_V[0] + 1.2, Y_TOP + 2.4, SAM_V[2] + 3.4], k), mel3([VX + 3, Y_TOP + 2.4, VZ + 3.2], [VX + 3.3, Y_TOP + 2.2, VZ + 3.2], k), mel(46, 42, k)), FOG.blanc, CIEL.blanc, 0.4);
  }),
  P("s06p6", t("la rue d'avant, redevenue normale : maisons pastel, boulangerie intacte, maison de Mme Lopes", "aucun (la rue sans personne)", "vision de « tout redevient normal » : les blocs se reconstruisent, la boulangerie et la maison réapparaissent", "panoramique rapide d'une maison à l'autre", "soleil doux, ciel bleu", "blocs qui se reforment, flash blanc, teinte douce", "balayage de réécriture, carillon"), 5, 12, (c) => {
    const k = lisse(c.p);
    const ev = D(c).ev;
    const f = flash(c.T, ev.vision0 + 0.02, 0.8, 0.02, 0.35);
    return {
      cam: viser(mel3([5.2, 2.6, -8.0], [-4.6, 3.0, 10.4], lisse(entre(c.p, 0.45, 1))), mel3([14, 3.0, -16], [-14, 3.2, 16.6], lisse(entre(c.p, 0.55, 1))), 56),
      brouillard: FOG.jour,
      ciel: CIEL.jour,
      fx: { vignette: 0.3, teinte: ["#FFE9A0", 0.22], flash: ["#FFFFFF", f] },
    };
  }),
  P("s06p7", t("sommet du fil, fond blanc", "Sam (14 ans)", "« sauf moi » : ses bras se pixellisent, il s'effrite ; larmes", "plan moyen frontal en légère plongée", "lumière blanche dure, silhouette qui se détache", "pixels qui s'envolent, brouillard blanc", "réécriture inversée, cœur, nappe"), 5, 15, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(rel(c, "sam", [0.4, 2.7, 4.8]), rel(c, "sam", [0.2, 2.5, 3.8]), k), rel(c, "sam", [0, 1.75, 0]), mel(44, 38, k), 0.5, 0.4), FOG.blanc, CIEL.blanc, 0.4);
  }),
  P("s06p8", t("sommet du fil : le bouton rouge immense, plateforme blanche à l'infini", "Sam : silhouette minuscule et sombre", "le bouton enfle jusqu'à écraser l'image ; Sam, tout petit, tend la main ; fondu au noir sur la dernière parole", "contre-plongée basse très lente, le bouton au premier plan", "contre-jour blanc dur, silhouettes très sombres, halo rouge", "brouillard blanc, fondu au noir", "nappe blanche, cœur, drone, dernier choc sourd"), 5, 17, (c) => {
    const k = lisse(c.p);
    const d = D(c);
    const noir = lisse(entre(c.T, d.finNarration - 0.02, d.finNarration + 0.14));
    return S(viser(mel3([VX + 3.0, Y_TOP + 0.3, VZ + 30], [VX + 3.1, Y_TOP + 0.25, VZ + 26], k), mel3([VX + 3.3, Y_TOP + 6.2, VZ + 3], [VX + 3.3, Y_TOP + 7.4, VZ + 3], k), mel(60, 64, k)), FOG.blanc, CIEL.blanc, 0.45, { ambiance: "silhouette", fx: { vignette: 0.45, noir } });
  }),
];
void YANIS;
void LOPES;
void freine;
