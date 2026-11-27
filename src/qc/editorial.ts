/** Règles éditoriales automatiques (appliquées par `fm valider` et `fm qc`). */
import { chaine } from "../lib/config";
import { narration, type Episode } from "../schema/episode";
import { ACCESSOIRE_DEFS, NIVEAU_NUM, saisonNoel, tonsDesScenes } from "../core/colere";

export interface Issue {
  bloquant: boolean;
  message: string;
}

/** Débit moyen d'une voix off française dynamique (mots/s). */
export const WORDS_PER_SECOND = 2.75;

const INTROS_INTERDITES = [/bonjour à tous/i, /salut tout le monde/i, /aujourd'hui,? (nous allons|on va) (voir|parler)/i, /dans cette vidéo/i, /bienvenue sur (ma|la) chaîne/i];
const PROMESSES_IRREALISTES = [
  /gagne[rz]? \d[\d\s.,]*\s?(k|000|€|euros?)\s*(par|\/)\s*(jour|semaine|mois)/i,
  /devenir riche/i,
  /revenus? passifs? garantis?/i,
  /argent facile/i,
  /sans (aucun )?effort/i,
  /garanti(e|s)? à 100/i,
];
const MOTS_NOUVEAUTE = /\b(nouveau|nouvelle|nouveaux|nouvelles|vient de (sortir|lancer|publier|annoncer)|annonc[eé]|lancement|disponible depuis|tout juste)\b/i;

/** Mots enfantins que le personnage n'emploie pas (voir docs/PERSONNALITE-ECTO.md). */
const MOTS_ENFANTINS = /\b(patates?|cornichons?|nouilles?|zombies?)\b/i;
/** Insultes discriminatoires (handicap, orientation, origine…) : jamais, même pour rire. L'insulte d'Ecto vise un comportement, pas une personne. */
const INSULTES_DISCRIMINANTES =
  /\b(mongol(ien)?s?|gogol(e)?s?|trisomiques?|attard[ée]e?s?|p[ée]d[ée]s?|tapettes?|tarlouzes?|n[èe]gres?|bougnoules?|youpins?|sale(s)? (arabes?|juifs?|noirs?)|nique ta m[èe]re)\b/i;
/** Registre familier du personnage : sert à vérifier que les insultes restent un assaisonnement, pas un tic. */
const REGISTRE_FAMILIER = /\b(d[ée]bile|imb[ée]cile|idiot|con|conne|connerie|conneries|putain|bordel|tdc)\b/gi;

/** Rythme de la personnalité d'Ecto : colère dosée, moments calmes pour suivre l'explication, accessoires variés. */
function perso(ep: Episode): Issue[] {
  const issues: Issue[] = [];
  const tons = tonsDesScenes(ep.scenes);
  const mots = ep.scenes.map((sc) => sc.voix.replace(/\*/g, "").split(/\s+/).filter(Boolean).length);
  const total = mots.reduce((a, b) => a + b, 0) || 1;
  const colere = mots.reduce((a, n, i) => a + (tons[i] === "enerve" || tons[i] === "furie" ? n : 0), 0);
  const calme = mots.reduce((a, n, i) => a + (tons[i] === "doux" || tons[i] === "normal" ? n : 0), 0);
  let furies = 0;
  let lancers = 0;
  let brises = 0;
  let niveau = 0;
  let tenu: string | null = null;
  const vus: string[] = [];
  const consignes = ep.scenes.flatMap((sc) => [sc.fantome, ...(sc.temps_forts ?? [])].filter(Boolean)) as Array<{ colere?: keyof typeof NIVEAU_NUM; accessoire?: string; lancer?: string; chapeau?: string }>;
  const noel = saisonNoel(ep.publication_prevue, ep.saison);
  for (const c of consignes) {
    if (c.colere) {
      if (NIVEAU_NUM[c.colere] === 2 && niveau !== 2) furies++;
      niveau = NIVEAU_NUM[c.colere];
    }
    if (c.accessoire) {
      if (c.accessoire !== "aucun") {
        if (niveau > 0) issues.push({ bloquant: false, message: `Accessoire « ${c.accessoire} » donné pendant la colère : il apparaît au retour au calme (colere: "calme" dans la même consigne)` });
        if (vus.includes(c.accessoire)) issues.push({ bloquant: false, message: `Accessoire « ${c.accessoire} » utilisé deux fois dans la même vidéo : varier` });
        vus.push(c.accessoire);
        tenu = c.accessoire;
      } else tenu = null;
    }
    if (c.chapeau === "jette") lancers++;
    if (c.lancer) {
      lancers++;
      if (c.lancer === "brise") brises++;
      if (!tenu && noel) { /* sans accessoire, il balance son bonnet de Père Noël */ } else if (!tenu) issues.push({ bloquant: false, message: "Lancer sans accessoire tenu : il sera ignoré (donner d'abord un accessoire au retour au calme)" });
      else if (!ACCESSOIRE_DEFS[tenu as keyof typeof ACCESSOIRE_DEFS]?.lancable) issues.push({ bloquant: false, message: `« ${tenu} » ne se lance pas : lancer ignoré` });
      tenu = null;
    }
  }
  if (furies > 3) issues.push({ bloquant: false, message: `${furies} accès de furie : la colère doit avoir un rythme (3 maximum par vidéo)` });
  if (lancers > 2) issues.push({ bloquant: false, message: `${lancers} lancers d'objet : 2 maximum par vidéo` });
  if (brises > 1) issues.push({ bloquant: false, message: "Plusieurs écrans brisés : en réserver un seul par vidéo (impacts variés : leger, fissure, brise)" });
  if (colere / total > 0.45) issues.push({ bloquant: false, message: `Ecto est en colère pendant ${Math.round((100 * colere) / total)} % de la narration : laisser des moments calmes pour suivre l'explication (≤ 45 %)` });
  if (colere > 0 && calme / total < 0.3) issues.push({ bloquant: false, message: "Trop peu de narration calme : l'explication doit pouvoir être suivie (≥ 30 % hors colère)" });
  return issues;
}

export function editorialLint(ep: Episode): Issue[] {
  const issues: Issue[] = [];
  const c = chaine();
  const text = narration(ep);
  const words = text.split(/\s+/).filter(Boolean).length;
  const est = words / WORDS_PER_SECOND;
  if (est < c.duree.min - 4 || est > c.duree.max + 4) {
    issues.push({ bloquant: true, message: `Durée estimée ${est.toFixed(0)} s (${words} mots) hors de ${c.duree.min}–${c.duree.max} s` });
  } else if (est < c.duree.min || est > c.duree.max) {
    issues.push({ bloquant: false, message: `Durée estimée ${est.toFixed(0)} s, limite (${c.duree.min}–${c.duree.max} s)` });
  }
  const first = ep.scenes[0].voix.replace(/\*/g, "");
  const firstSentence = first.split(/(?<=[.?!])\s/)[0];
  if (firstSentence.split(/\s+/).length > 14) issues.push({ bloquant: false, message: `Accroche longue (${firstSentence.split(/\s+/).length} mots) : viser ≤ 12 mots pour les 2 premières secondes` });
  for (const re of INTROS_INTERDITES) if (re.test(text)) issues.push({ bloquant: true, message: `Introduction interdite (${re.source}) : entrer directement dans le sujet` });
  for (const re of PROMESSES_IRREALISTES) if (re.test(text + " " + ep.publication.titre + " " + ep.publication.description_tiktok)) issues.push({ bloquant: true, message: `Promesse irréaliste ou trompeuse (${re.source})` });
  for (const sc of ep.scenes) {
    const n = sc.voix.split(/\s+/).length;
    if (n > 42) issues.push({ bloquant: false, message: `Scène ${sc.id} : ${n} mots, découper pour garder le rythme` });
  }
  if (INSULTES_DISCRIMINANTES.test(text)) issues.push({ bloquant: true, message: "Insulte discriminatoire (handicap, orientation, origine…) : Ecto insulte un comportement (« débile », « imbécile », « t'es sérieux ? »), jamais une catégorie de personnes" });
  if (MOTS_ENFANTINS.test(text)) issues.push({ bloquant: false, message: "Mot enfantin (patate, cornichon, nouille, zombie…) : Ecto parle comme un pote, pas comme un dessin animé" });
  {
    const phrases = text.split(/(?<=[.?!])\s+/).filter(Boolean);
    const familieres = phrases.filter((p) => (p.match(REGISTRE_FAMILIER) ?? []).length > 0).length;
    if (phrases.length >= 6 && familieres / phrases.length > 0.4) issues.push({ bloquant: false, message: `Insultes dans ${familieres} phrases sur ${phrases.length} : elles doivent rester naturelles et rares pour garder leur effet comique` });
  }
  {
    // surnoms : « frérot », « mon reuf »… marquent le personnage mais lassent vite (2 maximum par vidéo)
    const surnoms = (text.match(/\b(fr[ée]rots?|reuf|mon gars|mon pote|ma poule|mec)\b/gi) ?? []).length;
    if (surnoms > 2) issues.push({ bloquant: false, message: `${surnoms} surnoms (frérot, mon reuf, mon gars…) : 2 maximum, sinon ça lasse` });
    // les mots doivent s'enchaîner : les points de suspension créent des blancs dans la voix
    const suspensions = (text.match(/\.{3}|…/g) ?? []).length;
    if (suspensions > 1) issues.push({ bloquant: false, message: `${suspensions} points de suspension : ils créent des pauses, les mots doivent s'enchaîner (phrases courtes, pas de « ... »)` });
  }
  issues.push(...perso(ep));
  if (/\d/.test(text) && ep.affirmations.length === 0) issues.push({ bloquant: true, message: "La narration contient des chiffres mais aucune affirmation sourcée" });
  if (ep.affirmations.length === 0 && ep.format !== "tutoriel") issues.push({ bloquant: true, message: "Aucune affirmation sourcée : chaque fait doit être relié à une source" });
  // Nouveauté = source datée récente
  if (MOTS_NOUVEAUTE.test(text)) {
    const pub = new Date(ep.publication_prevue).getTime();
    const recent = ep.sources.some((s) => s.date_publication && pub - new Date(s.date_publication).getTime() <= 21 * 86400e3);
    if (!recent) issues.push({ bloquant: true, message: "Le script présente une nouveauté mais aucune source n'est datée de moins de 21 jours" });
  }
  if (ep.format === "actu" && !ep.sources.some((s) => s.type === "officielle" || s.type === "documentation")) {
    issues.push({ bloquant: true, message: "Format actu : au moins une source primaire (officielle/documentation) est obligatoire" });
  }
  if (ep.publication.titre.length > 70) issues.push({ bloquant: false, message: "Titre > 70 caractères : risque de troncature sur Shorts" });
  if (ep.publication.hashtags.length < 3) issues.push({ bloquant: false, message: "Moins de 3 hashtags" });
  const usedSources = new Set([...ep.affirmations.map((a) => a.source), ...ep.scenes.flatMap((s) => s.sources ?? [])]);
  for (const s of ep.sources) if (!usedSources.has(s.id)) issues.push({ bloquant: false, message: `Source ${s.id} jamais utilisée` });
  return issues;
}
