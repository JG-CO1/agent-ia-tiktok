/**
 * Évaluation déterministe des idées et des accroches (Studio Phantom : moteur d'idées et moteur de hooks).
 * Le JUGEMENT (notes 0–10 par critère) vient de l'agent ; le CALCUL, le classement et les garde-fous sont du code,
 * donc reproductibles. Aucune note ne prédit la viralité : c'est une aide au tri, pas une promesse.
 */
export const CATEGORIES = {
  A: "Claude tricks",
  B: "AI business",
  C: "Claude Code",
  D: "AI automation",
  E: "GitHub discoveries",
  F: "AI news",
  G: "AI experiments",
  H: "Money & productivity",
} as const;
export type Categorie = keyof typeof CATEGORIES;

/** Pondération sur 100 (somme = 100). */
export const POIDS_IDEE = {
  viral: 15,
  originalite: 10,
  utilite: 15,
  curiosite: 15,
  partage: 10,
  sauvegarde: 10,
  demonstration: 15,
  actualite: 10,
} as const;
export type CritereIdee = keyof typeof POIDS_IDEE;

export interface Idee {
  titre: string;
  categorie: Categorie;
  /** Notes de 0 à 10 pour chacun des 8 critères. */
  scores: Record<CritereIdee, number>;
  /** URL de la source primaire (obligatoire pour être retenue). */
  source?: string;
  /** Date de la source (AAAA-MM-JJ). */
  date_source?: string;
  /** L'agent a vérifié que le sujet existe réellement. */
  verifiee?: boolean;
  /** L'idée se présente comme une nouveauté. */
  nouveaute?: boolean;
  /** Une démonstration concrète est possible (ou déjà réalisée). */
  demonstration_realisable?: boolean;
}

export interface IdeeNotee extends Idee {
  score: number;
  retenable: boolean;
  remarques: string[];
}

const JOUR = 86400e3;

export function noterIdee(i: Idee, maintenant = Date.now()): IdeeNotee {
  const remarques: string[] = [];
  let score = 0;
  for (const [k, w] of Object.entries(POIDS_IDEE) as Array<[CritereIdee, number]>) {
    const n = i.scores[k];
    if (typeof n !== "number" || n < 0 || n > 10) remarques.push(`note « ${k} » absente ou hors 0–10`);
    else score += (w * n) / 10;
  }
  let retenable = true;
  if (!i.verifiee) (retenable = false), remarques.push("sujet non vérifié : jamais retenu");
  if (!i.source) (retenable = false), remarques.push("aucune source primaire");
  if (i.nouveaute) {
    const t = i.date_source ? Date.parse(i.date_source) : NaN;
    if (!Number.isFinite(t)) (retenable = false), remarques.push("« nouveauté » sans date de source");
    else if (maintenant - t > 21 * JOUR) (retenable = false), remarques.push("source de plus de 21 jours : ne pas présenter comme nouveauté");
  }
  if (i.demonstration_realisable === false) {
    score = Math.min(score, 70);
    remarques.push("pas de démonstration possible : note plafonnée à 70");
  }
  return { ...i, score: Math.round(score * 10) / 10, retenable, remarques };
}

export function classerIdees(idees: Idee[], maintenant = Date.now()): IdeeNotee[] {
  return idees.map((i) => noterIdee(i, maintenant)).sort((a, b) => Number(b.retenable) - Number(a.retenable) || b.score - a.score);
}

// ---------------------------------------------------------------- hooks

export interface NoteHook {
  texte: string;
  score: number;
  detail: Record<"comprehension" | "curiosite" | "precision" | "enjeu" | "promesse", number>;
  alertes: string[];
}

const MOTS_CURIOSITE = /\b(pourquoi|comment|personne|presque personne|secret|sans (le )?savoir|derrière|caché|enfin|maintenant|plus besoin|avant|au lieu de|le dernier|ce que|ce qui)\b|\?/i;
const MOTS_ENJEU = /\b(tu|toi|ton|ta|tes|te|t')\b|\bt'/i;
const VERBES_PROMESSE = /\b(peux|peut|peuvent|trouve|voit|vois|crée|crées|transforme|automatise|économise|évite|construit|fabrique|répond|génère|lance|monte|écrit|corrige|sait)\b/i;
const OUVERTURES_BANNIES = /^\s*(un|une|voici|aujourd'hui|et si|bonjour|salut|bienvenue|dans cette vidéo)\b/i;
const HYPE = /\b(incroyable|dingue|ouf|de fou|révolutionnaire|hallucinant|fou|choquant|jamais vu|le meilleur|ultime)\b/i;
const REVENUS = /\b(gagner|gagne|riche|millionnaire|revenus? passifs?|devenir riche|\d[\d\s]*\s?(€|euros|k€))\b/i;
const CLICKBAIT = /(tu ne vas pas croire|personne ne te l'a dit|ils ne veulent pas|ce que (les|ils) (te )?cachent)/i;

/**
 * Note une accroche /100 avec des règles lisibles. « Vérité » n'est pas calculable : chaque fait de l'accroche
 * doit avoir une affirmation sourcée (contrôlée par `fm verifier`), sinon l'accroche est rejetée quelle que soit sa note.
 */
export function noterHook(texte: string): NoteHook {
  const propre = texte.replace(/\*/g, "").trim();
  const mots = propre.split(/\s+/).filter(Boolean);
  const alertes: string[] = [];
  const n = mots.length;
  const comprehension = n <= 12 ? 25 : n <= 16 ? 22 : n <= 22 ? 15 : 8;
  if (n > 22) alertes.push(`accroche longue (${n} mots) : trop lente pour les 3 premières secondes`);
  const curiosite = MOTS_CURIOSITE.test(propre) ? 25 : 8;
  const precis = /\d/.test(propre) || /\b[A-Z][\w.-]{2,}\b/.test(propre.slice(1)) || /`/.test(texte);
  const precision = precis ? 20 : 8;
  const enjeu = MOTS_ENJEU.test(propre) ? 15 : 5;
  const promesse = VERBES_PROMESSE.test(propre) ? 15 : 5;
  let score = comprehension + curiosite + precision + enjeu + promesse;
  if (OUVERTURES_BANNIES.test(propre)) (score -= 20), alertes.push("ouverture bannie (Un… / Voici… / Et si… / Aujourd'hui…)");
  if (HYPE.test(propre)) (score -= 15), alertes.push("mot d'hyperbole : promettre un résultat précis plutôt qu'un superlatif");
  if (CLICKBAIT.test(propre)) (score -= 30), alertes.push("tournure de piège à clics");
  if (REVENUS.test(propre)) (score -= 60), alertes.push("promesse de gains interdite par la ligne éditoriale");
  return { texte: propre, score: Math.max(0, Math.min(100, score)), detail: { comprehension, curiosite, precision, enjeu, promesse }, alertes };
}

export function classerHooks(textes: string[]): NoteHook[] {
  return textes.map(noterHook).sort((a, b) => b.score - a.score);
}
