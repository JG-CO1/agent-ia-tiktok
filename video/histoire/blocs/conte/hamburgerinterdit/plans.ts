/**
 * « Hamburger interdit » — mise en scène plan par plan (récit : histoires/recits/hamburger-interdit.json).
 * Chaque plan démarre sur un mot [scène, mot]. Néons, rais de lumière, brouillard, vignette, flash et fondu au noir sont
 * réglés plan par plan ; la palette se décolore à mesure que le narrateur comprend.
 */
import type { PlanGen } from "../../types";
import { D, P, PI, entre, faceA, freine, lisse, mel, mel3, plus, rel, secousse, tete, trav, viser, type V3 } from "../cam";
import type { EtatConte } from "../lib";
import { CUISINE, GEANTE, GRENIER, PORTANT, SALON, TABLE_BASSE, TABLE_POLICE } from "./monde";

const [KX] = CUISINE;
const [GX] = GRENIER;
const [, , SZ] = SALON;
const [PX, , PZ] = PORTANT;
const [TX, , TZ] = TABLE_POLICE;

const FOG = {
  rue: ["#7A3A8E", 40, 250] as [string, number, number],
  ruePres: ["#8A5A9A", 36, 190] as [string, number, number],
  rueGris: ["#6A6A74", 24, 150] as [string, number, number],
  cuisine: ["#2A1830", 24, 90] as [string, number, number],
  souvenir: ["#3A2414", 22, 80] as [string, number, number],
  grenier: ["#2A1A0C", 12, 46] as [string, number, number],
  salon: ["#2A1822", 22, 80] as [string, number, number],
};
const S = (cam: ReturnType<typeof viser>, brouillard: [string, number, number], vignette = 0.45, extra: Partial<EtatConte> = {}): EtatConte => ({ cam, brouillard, fx: { vignette }, ...extra });
const SEPIA = ["#FFB066", 0.34] as [string, number];

export const PLANS: PlanGen[] = [
  // ======================= SCÈNE 1 — « Dans cette ville, il est interdit de manger des hamburgers… »
  P("s01p1", "Décor : grand-rue rétro rose et turquoise au crépuscule, enseigne géante « HAMBURGERS INTERDITS » | Personnages : aucun | Action/expressions : le néon clignote deux fois puis s'allume | Caméra : contre-plongée, travelling avant | Lumière : néons rose et rouge, ciel violet-orange | Effets : vignette, lueurs | Son : grésillement de néon, nappe sombre", 0, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([0.4, 2.3, -14], [0, 2.6, -27], k), [0, 14.8, GEANTE.p[2]], mel(62, 56, k), 0.5, 0.36), FOG.rue, 0.5);
  }),
  P("s01p2", "Décor : toute la grand-rue vue d'en haut, façades roses, turquoise et moutarde, auvents rayés, voitures arrondies | Personnages : passants minuscules | Action/expressions : la ville entière sous les néons | Caméra : grue descendante en plan large | Lumière : lampadaires chauds, ciel rose | Effets : brouillard, vignette | Son : jukebox lointain, ambiance de ville", 0, 3, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([24, 34, 58], [15, 20, 38], k), mel3([-2, 4, -14], [-2, 3, -20], k), mel(64, 58, k), 0.5, 0.42), FOG.rue, 0.45);
  }),
  P("s01p3", "Décor : poteau de lampadaire devant la façade du diner | Personnages : aucun | Action/expressions : le pictogramme rouge barré d'un hamburger | Caméra : plan serré, léger zoom avant | Lumière : globe chaud, néon rose derrière | Effets : vignette | Son : sifflet de police, impact sourd", 0, 9, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-2.2, 5.0, 4.0], [-4.6, 5.2, 1.9], k), [-8.4, 5.3, 0.0], mel(40, 32, k), 0.5, 0.4), FOG.rue, 0.5);
  }),
  P("s01p4", "Décor : trottoir du diner, menu mural avec une ligne barrée de noir | Personnages : aucun | Action/expressions : le menu n'a plus de hamburger (HOT-DOG, FRITES, MILK-SHAKE, TARTE, SALADE, ligne retirée) | Caméra : travelling avant sur le menu | Lumière : néon rose du bandeau | Effets : vignette | Son : grésillement de néon", 0, 10, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-5.0, 2.8, 4.8], [-7.2, 2.6, 3.2], k), [-11.7, 2.3, 1.6], mel(44, 38, k), 0.5, 0.4), FOG.rue, 0.45);
  }),
  P("s01p5", "Décor : vitrine du diner avec la pancarte « PAS DE BURGER ICI » | Personnages : aucun | Action/expressions : vitrine éclairée, pancarte scotchée | Caméra : travelling latéral le long du trottoir | Lumière : vitrine chaude | Effets : vignette | Son : jukebox, pas de passants", 0, 16, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-3.6, 3.0, 6.8], [-4.0, 2.9, 11.0], k), [-13.3, 2.6, 12.5], 48, 0.5, 0.4), FOG.rue, 0.45);
  }),
  P("s01p6", "Décor : portail de l'école, cour et grille ornée de panneaux barrés | Personnages : deux policiers à képi, écoliers en file | Action/expressions : un policier fouille le cartable d'un élève | Caméra : travelling avant en plan moyen large | Lumière : lueur chaude de la table, ciel violet | Effets : vignette | Son : sifflet de policier", 0, 22, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([3.0, 5.6, -36.4], [8.0, 5.0, -36.6], k), [TX + 1.4, 2.5, TZ - 0.5], mel(56, 48, k), 0.5, 0.42), FOG.rue, 0.5);
  }),
  P("s01p7", "Décor : table des policiers, cartable ouvert puis cloche de verre | Personnages : policier à képi, écolier de dos | Action/expressions : le policier brandit le hamburger confisqué puis le range sous la cloche (étiquette SAISI) | Caméra : plan serré, léger travelling latéral | Lumière : halo chaud sur la cloche | Effets : vignette | Son : clac de la cloche, sifflet", 0, 25, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([8.4, 5.4, -38.6], [10.4, 5.0, -38.0], k), [TX + 1.2, 2.5, TZ - 0.15], mel(48, 42, k), 0.5, 0.42), FOG.rue, 0.5);
  }),

  // ======================= SCÈNE 2 — « Quand j'ai demandé pourquoi, tout le monde a changé de sujet… »
  P("s02p1", "Décor : trottoir devant la vitrine « PAS DE BURGER ICI » | Personnages : le narrateur (blouson rouge cerise) | Action/expressions : il demande « pourquoi ? », curieux | Caméra : gros plan sur son visage | Lumière : néon rose, vitrine chaude | Effets : vignette | Son : jukebox lointain", 1, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-6.4, 2.35, 12.9], [-7.0, 2.3, 12.6], k), [-10.2, 2.0, 12.5], mel(36, 32, k), 0.5, 0.38), FOG.rue, 0.5);
  }),
  P("s02p2", "Décor : trottoir du diner | Personnages : le narrateur et quatre adultes pop | Action/expressions : les adultes lui tournent le dos puis s'éloignent sans répondre | Caméra : plan large, léger travelling arrière | Lumière : lampadaire chaud, ciel rose | Effets : vignette | Son : silence qui s'installe, murmure sourd", 1, 4, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-1.4, 2.3, 12.6], [0.2, 2.6, 12.6], k), [-9.2, 2.2, 12.5], mel(64, 68, k), 0.5, 0.5), FOG.rue, 0.5);
  }),
  P("s02p3", "Décor : cuisine pastel, table à carreaux rouge et blanc | Personnages : la mère (robe turquoise), le père, le narrateur debout | Action/expressions : la mère mange puis s'arrête | Caméra : travelling avant en plongée | Lumière : suspension chaude, fenêtre néon | Effets : vignette | Son : tic-tac de l'horloge", 1, 11, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([KX + 2.0, 3.3, 4.7], [KX + 1.4, 3.1, 3.4], k), [KX - 1.8, 2.5, -2.2], mel(58, 48, k), 0.5, 0.42), FOG.cuisine, 0.5);
  }),
  P("s02p4", "Décor : table de la cuisine, assiette de la mère | Personnages : la mère | Action/expressions : elle pose sa fourchette et son couteau sur l'assiette | Caméra : gros plan sur les mains | Lumière : cône de la suspension | Effets : vignette | Son : cliquetis de couverts, tic-tac", 1, 16, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([KX - 3.5, 3.1, 0.9], [KX - 3.0, 3.0, 0.4], k), [KX - 1.6, 2.4, -1.15], mel(40, 34, k), 0.5, 0.4), FOG.cuisine, 0.5);
  }),
  P("s02p5", "Décor : cuisine, grande horloge murale derrière elle | Personnages : la mère | Action/expressions : regard vide, immobile | Caméra : gros plan sur le visage, zoom lent | Lumière : suspension, néon de la fenêtre | Effets : vignette marquée | Son : tic-tac, silence", 1, 18, (c) => S(faceA(c, "mere", [4.6, 3.8], 3.3, 0.4, 34, 2.9, 0.4), FOG.cuisine, 0.6)),
  P("s02p6", "Décor : cuisine puis porte sombre vers l'escalier | Personnages : le narrateur | Action/expressions : il se décide et sort chercher | Caméra : plan de suivi derrière lui | Lumière : porte noire | Effets : vignette | Son : pas, grincement de plancher", 1, 21, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([KX + 1.6, 3.0, 4.6], [KX + 3.4, 3.0, 4.6], k), mel3([KX + 3.9, 1.9, 0.9], [KX + 6.8, 1.7, 2.5], k), mel(54, 50, k), 0.5, 0.42), FOG.cuisine, 0.55);
  }),

  // ======================= SCÈNE 3 — « Dans le grenier, j'ai trouvé un vieil emballage… »
  P("s03p1", "Décor : grenier poussiéreux, malles, rais de lumière ambrée dans la poussière | Personnages : le narrateur | Action/expressions : il entre et avance vers un manteau | Caméra : travelling avant bas, vers la lucarne | Lumière : rais ambrés contrastés | Effets : poussière, vignette | Son : grincement du plancher, drone sourd", 2, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([GX + 3.4, 1.8, 6.0], [GX + 2.6, 2.0, 4.0], k), [GX - 0.2, 2.6, -3.4], mel(64, 58, k), 0.5, 0.4), FOG.grenier, 0.55);
  }),
  P("s03p2", "Décor : manteau rouge sur son portant, poche | Personnages : le narrateur (main) | Action/expressions : sa main tire un vieil emballage jauni de la poche | Caméra : plan serré de côté sur la poche | Lumière : rais ambré | Effets : poussière, vignette | Son : froissement de papier", 2, 6, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([PX + 2.0, 1.9, PZ + 1.7], [PX + 1.7, 1.8, PZ + 1.4], k), [PX + 0.1, 1.45, PZ + 0.6], mel(50, 42, k), 0.5, 0.42), FOG.grenier, 0.55);
  }),
  P("s03p3", "Décor : grenier, manteau et narrateur côte à côte | Personnages : le narrateur | Action/expressions : le manteau est exactement à sa taille, il le réalise | Caméra : plan de face, orbite lente | Lumière : rais ambrés | Effets : poussière, vignette | Son : battement de cœur", 2, 11, (c) => {
    const k = lisse(c.p);
    return S(viser([PX + mel(2.6, 3.2, k), 2.2, PZ + mel(7.2, 6.6, k)], [PX + 0.9, 1.6, PZ + 0.6], 50, 0.5, 0.42), FOG.grenier, 0.5);
  }),
  P("s03p4", "Décor : grenier | Personnages : le narrateur | Action/expressions : il déplie un papier plié, jauni | Caméra : par-dessus son épaule, le papier s'ouvre | Lumière : rais ambré sur le papier | Effets : poussière | Son : froissement du papier", 2, 15, (c) => {
    const k = lisse(c.p);
    const pap = rel(c, "nGren", [0, 3.0, 1.0]);
    return S(viser(rel(c, "nGren", [0.5, 5.6, -4.6]), mel3(pap, plus(pap, [0, 0.4, 0]), k), 40, 0.5, 0.4), FOG.grenier, 0.5);
  }),
  P("s03p5", "Décor : grenier | Personnages : le narrateur (de dos, tête basse) | Action/expressions : le papier lisible en gros : « Chaque bouchée efface quelqu'un que tu aimes. » (« efface » passe au rouge) | Caméra : par-dessus l'épaule, zoom lent sur le texte | Lumière : lueur ambrée | Effets : flash blanc à « Chaque », poussière | Son : choc sourd, drone menaçant, cœur", 2, 19, (c) => {
    const k = lisse(c.p);
    const d = D(c);
    const dt = c.T - d.ev.flashLue;
    const pap = rel(c, "nGren", [0, 3.0, 1.0]);
    return S(viser(rel(c, "nGren", [mel(0.5, 0.3, k), mel(6.2, 5.8, k), mel(-5.4, -4.4, k)]), pap, mel(38, 33, k), 0.5, 0.4), FOG.grenier, 0.5, { fx: { vignette: 0.5, flash: ["#FFF6DC", dt > 0 && dt < 0.22 ? 0.55 * (1 - dt / 0.22) : 0] } });
  }),

  // ======================= SCÈNE 4 — « Voilà pourquoi tout est interdit. Chez nous, on met toujours quatre assiettes… »
  P("s04p1", "Décor : grenier | Personnages : le narrateur | Action/expressions : le papier à la main, il comprend, effaré | Caméra : gros plan sur son visage, zoom lent | Lumière : rais ambrés | Effets : vignette marquée | Son : cœur, nappe grave", 3, 0, (c) => S(faceA(c, "nGren", [3.3, 2.5], 2.5, 0.2, 34, 2.4, 0.38), FOG.grenier, 0.6)),
  P("s04p2", "Décor : cuisine, table dressée pour quatre | Personnages : la mère debout, le père et le narrateur assis | Action/expressions : le dîner, une assiette de plus que de convives | Caméra : plan large, travelling latéral | Lumière : suspension, néon fenêtre | Effets : vignette, couleurs qui se délavent | Son : tic-tac", 3, 5, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([KX - 4.4, 4.6, -4.2], [KX - 3.6, 4.2, -3.8], k), [KX + 0.4, 2.3, 0.4], mel(62, 56, k), 0.5, 0.42), FOG.cuisine, 0.5);
  }),
  P("s04p3", "Décor : table à carreaux, quatre assiettes (une de trop, éclairée) | Personnages : trois convives, une chaise d'enfant vide | Action/expressions : on compte les assiettes : quatre pour trois | Caméra : plongée qui recule le long de la table | Lumière : halo froid sur la quatrième assiette | Effets : vignette | Son : silence, tic-tac", 3, 10, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([KX - 3.8, 6.0, 3.0], [KX - 2.2, 5.4, 4.8], k), mel3([KX + 0.3, 2.3, 0.3], [KX + 0.3, 2.2, 1.0], k), mel(78, 64, k), 0.5, 0.45), FOG.cuisine, 0.5);
  }),
  P("s04p4", "Décor : cuisine | Personnages : la mère debout au bout de la table | Action/expressions : elle baisse les yeux vers l'assiette vide sans comprendre, la main à la bouche | Caméra : gros plan sur son visage | Lumière : suspension | Effets : vignette marquée | Son : silence, tic-tac", 3, 19, (c) => S(faceA(c, "mere2", [3.8, 3.2], 3.0, 0.3, 34, 2.4, 0.4), FOG.cuisine, 0.6)),
  P("s04p5", "Décor : cuisine | Personnages : le narrateur assis | Action/expressions : il regarde lui aussi l'assiette de trop : « Moi non plus » | Caméra : gros plan sur son visage | Lumière : suspension | Effets : vignette | Son : cœur", 3, 25, (c) => S(faceA(c, "nCuis2", [3.4, 2.8], 4.2, -0.5, 34, 3.2, 0.4), FOG.cuisine, 0.6)),

  // ======================= SCÈNE 5 — « Dans l'album, une silhouette découpée à côté de moi sur chaque photo… »
  P("s05p1", "Décor : salon, album à couverture rouge sur la table basse | Personnages : le narrateur (de dos) | Action/expressions : il pose la main sur l'album | Caméra : plongée par-dessus son épaule | Lumière : lampadaire chaud | Effets : vignette | Son : froissement de couverture", 4, 0, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-2.2, 5.4, SZ - 3.4], [-1.6, 5.0, SZ - 2.8], k), [0, 1.7, SZ + 1.3], mel(52, 46, k), 0.5, 0.42), FOG.salon, 0.5);
  }),
  P("s05p2", "Décor : album ouvert : une photo de lui avec une silhouette blanche découpée à côté | Personnages : aucun (la silhouette blanche, jamais un vrai visage) | Action/expressions : la photo, un garçon et un vide blanc | Caméra : plan serré en plongée, zoom lent | Lumière : lampadaire chaud | Effets : vignette | Son : papier, silence inquiétant", 4, 2, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-1.0, 5.7, SZ - 2.1], [-0.9, 5.1, SZ - 1.3], k), [-0.95, 1.7, SZ + 1.3], mel(42, 34, k), 0.5, 0.42), FOG.salon, 0.5);
  }),
  P("s05p3", "Décor : album | Personnages : le narrateur (de dos) | Action/expressions : les pages défilent : sur chaque photo la même silhouette blanche découpée à côté de lui | Caméra : plongée nerveuse, léger recul | Lumière : lampadaire chaud | Effets : vignette | Son : pages tournées en rafale", 4, 5, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-1.8, 6.3, SZ - 2.6], [-1.2, 5.9, SZ - 1.9], k), [0, 1.7, SZ + 1.3], mel(60, 54, k), 0.5, 0.42), FOG.salon, 0.5);
  }),
  P("s05p4", "Décor : dernière page : la photo de Léa, couleurs vives, un hamburger à la main | Personnages : Léa (photo) | Action/expressions : le seul visage de l'album, en couleurs | Caméra : plongée, zoom avant | Lumière : lampadaire chaud | Effets : vignette | Son : note douce", 4, 12, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([-1.0, 5.7, SZ - 2.0], [-0.9, 5.1, SZ - 1.4], k), [-0.95, 1.7, SZ + 1.3], mel(42, 34, k), 0.5, 0.42), FOG.salon, 0.5);
  }),
  P("s05p5", "Décor : salon | Personnages : le narrateur | Action/expressions : il soulève la photo et la retourne : une écriture au dos | Caméra : par-dessus son épaule, rotation de la photo | Lumière : lampadaire chaud | Effets : vignette | Son : froissement", 4, 18, (c) => {
    const k = lisse(c.p);
    const pap = rel(c, "nSalon", [0, 3.3, 1.0]);
    return S(viser(mel3(rel(c, "nSalon", [0.5, 6.4, -5.0]), rel(c, "nSalon", [0.4, 6.2, -4.7]), k), pap, 42, 0.5, 0.38), FOG.salon, 0.5);
  }),
  P("s05p6", "Décor : verso de la photo, écriture manuscrite | Personnages : le narrateur (épaule) | Action/expressions : « J'ai mangé un burger pour oublier Léa. » (le texte s'écrit mot à mot) | Caméra : par-dessus l'épaule, lent zoom sur le texte | Lumière : lampadaire chaud | Effets : vignette | Son : crayon, cœur, silence", 4, 21, (c) => {
    const k = lisse(c.p);
    const pap = rel(c, "nSalon", [0, 3.3, 1.0]);
    return S(viser(rel(c, "nSalon", [mel(0.45, 0.3, k), mel(6.4, 6.0, k), mel(-5.0, -4.4, k)]), pap, mel(42, 38, k), 0.5, 0.36), FOG.salon, 0.5);
  }),
  P("s05p7", "Décor : verso de la photo, deux lignes : « J'ai mangé un burger pour oublier Léa. Interdisez-les tous. » | Personnages : le narrateur | Action/expressions : la deuxième ligne s'écrit, il en comprend la portée | Caméra : recul lent par-dessus l'épaule | Lumière : lampadaire chaud | Effets : vignette marquée | Son : choc sourd, cœur", 4, 29, (c) => {
    const k = lisse(c.p);
    const pap = rel(c, "nSalon", [0, 3.3, 1.0]);
    return S(viser(rel(c, "nSalon", [mel(0.3, 0.5, k), mel(6.0, 6.5, k), mel(-4.4, -5.2, k)]), pap, mel(38, 42, k), 0.5, 0.36), FOG.salon, 0.6);
  }),
  // ======================= SCÈNE 6 — « Ce manteau était le mien… »
  P("s06p1", "Décor : grenier, le manteau vu de dos, l'étiquette « N. » cousue dans la nuque | Personnages : aucun | Action/expressions : l'étiquette du narrateur : le manteau était à lui | Caméra : gros plan sur l'étiquette, léger zoom | Lumière : rais ambré | Effets : flash blanc, poussière | Son : choc sourd, drone grave", 5, 0, (c) => {
    const k = lisse(c.p);
    const dt = c.T - c.mot(0);
    void dt;
    return S(viser(mel3([PX + 0.9, 2.9, PZ - 2.9], [PX + 0.3, 2.5, PZ - 2.1], k), [PX, 2.34, PZ - 0.82], mel(34, 28, k), 0.5, 0.4), FOG.grenier, 0.55, { fx: { vignette: 0.55, flash: ["#FFF3D2", c.t < 0.2 ? 0.6 * (1 - c.t / 0.2) : 0] } });
  }),
  P("s06p2", "Décor : cuisine en souvenir sépia, la même table | Personnages : le narrateur à huit ans (le même blouson), Léa en robe moutarde à couettes | Action/expressions : le petit garçon lève un hamburger, Léa sourit | Caméra : plan moyen de côté, travelling avant | Lumière : suspension, teinte sépia | Effets : souvenir sépia, vignette | Son : nappe douce, tic-tac", 5, 5, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([KX + 6.2, 3.0, 0.4], [KX + 5.2, 3.0, 0.8], k), [KX - 0.3, 2.6, 2.3], mel(42, 38, k), 0.5, 0.42), FOG.souvenir, 0.55, { fx: { vignette: 0.55, teinte: SEPIA } });
  }),
  P("s06p3", "Décor : cuisine en souvenir sépia | Personnages : le petit narrateur, Léa | Action/expressions : il croque dans le hamburger ; Léa devient blanche et se défait en blocs de couleur | Caméra : gros plan sur la bouche puis panoramique vers Léa | Lumière : flash blanc | Effets : effacement, particules de blocs, flash | Son : croc, balayage descendant doux", 5, 6, (c) => {
    const d = D(c);
    const k = lisse(entre(c.p, 0.3, 0.52));
    const kid = rel(c, "nFb", [0, 3.75, 0]);
    const lea = rel(c, "lea", [0, 3.6, 0]);
    const dt = c.T - d.ev.eff0;
    return S(viser([KX + 0.0, 3.9, 0.0], mel3(kid, lea, k), mel(34, 38, k), 0.5, 0.4), FOG.souvenir, 0.55, { fx: { vignette: 0.55, teinte: SEPIA, flash: ["#FFFFFF", dt > 0 && dt < 0.4 ? 0.55 * (1 - dt / 0.4) : 0] } });
  }),
  P("s06p4", "Décor : cuisine en souvenir | Personnages : le petit narrateur, la chaise de Léa vide | Action/expressions : plus rien de Léa : la chaise vide, les blocs qui s'envolent, puis lui qui oublie | Caméra : sur la chaise vide puis panoramique vif vers son visage vide | Lumière : poussière d'éclats | Effets : particules, vignette | Son : balayage descendant, silence", 5, 11, (c) => {
    const k = lisse(entre(c.p, 0.5, 0.72));
    return S(viser([KX + 0.5, 3.1, 0.3], mel3([KX + 1.6, 2.2, 2.3], rel(c, "nFb", [0, 3.75, 0]), k), mel(46, 38, k), 0.5, 0.42), FOG.souvenir, 0.6, { fx: { vignette: 0.6, teinte: SEPIA } });
  }),
  P("s06p5", "Décor : la grand-rue, maintenant grise et sans néon, enseigne éteinte | Personnages : le narrateur seul | Action/expressions : le monde décoloré, lui debout avec un burger | Caméra : plan large, travelling avant lent | Lumière : gris plat, seul le burger garde ses couleurs | Effets : désaturation, vignette | Son : vent sourd, nappe mélancolique", 5, 16, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3([3.6, 4.4, 21], [2.2, 3.6, 17], k), [0, 2.0, 6.0], mel(54, 48, k), 0.5, 0.42), FOG.rueGris, 0.55);
  }),
  P("s06p6", "Décor : rue grise | Personnages : le narrateur (main) | Action/expressions : le hamburger dans sa main, seul objet en couleurs | Caméra : gros plan sur la main, léger zoom | Lumière : halo orangé du burger | Effets : désaturation, vignette | Son : cœur, silence", 5, 19, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(rel(c, "nFin", [-2.0, 2.3, 3.6]), rel(c, "nFin", [-1.6, 2.1, 2.8]), k), rel(c, "nFin", [-0.62, 1.95, 0.9]), mel(34, 28, k), 0.5, 0.4), FOG.rueGris, 0.6);
  }),
  P("s06p7", "Décor : rue grise | Personnages : le narrateur | Action/expressions : visage grave, le burger monte lentement | Caméra : plan rapproché, zoom lent | Lumière : gris, halo du burger | Effets : désaturation, vignette | Son : cœur", 5, 23, (c) => {
    const k = lisse(c.p);
    return S(viser(mel3(rel(c, "nFin", [-0.3, 2.5, 4.2]), rel(c, "nFin", [-0.25, 2.4, 3.4]), k), rel(c, "nFin", [-0.12, 2.1, 0.3]), mel(36, 30, k), 0.5, 0.4), FOG.rueGris, 0.65);
  }),
  P("s06p8", "Décor : rue grise | Personnages : le narrateur | Action/expressions : le burger près de sa bouche, il hésite, les yeux humides | Caméra : très gros plan sur le visage et le burger, zoom lent | Lumière : halo orangé, tout le reste gris | Effets : vignette marquée, fondu au noir sur la dernière parole | Son : cœur, nappe, coupure au noir", 5, 28, (c) => {
    const d = D(c);
    const k = lisse(c.p);
    const noir = lisse(entre(c.T, d.finNarration - 0.02, d.finNarration + 0.4));
    return S(viser(mel3(rel(c, "nFin", [-0.2, 2.4, 3.7]), rel(c, "nFin", [-0.15, 2.3, 2.9]), k), rel(c, "nFin", [-0.1, 2.15, 0.4]), mel(32, 26, k), 0.5, 0.42), FOG.rueGris, 0.7, { fx: { vignette: 0.7, noir } });
  }),
];
void PI;
void freine;
void secousse;
void tete;
void trav;
