/** Règles éditoriales automatiques (appliquées par `fm valider` et `fm qc`). */
import { chaine } from "../lib/config";
import { narration, type Episode } from "../schema/episode";

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
