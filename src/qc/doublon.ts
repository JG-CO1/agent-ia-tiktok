/**
 * Doublons : un même sujet ne repasse pas avant 60 jours.
 *
 * - Page de sujet (dépôt, article, page de doc dédiée) parmi les 2 premières sources et déjà utilisée : doublon.
 * - Page « journal » (changelog, notes de version, registre de paquets) : son adresse ne dit pas le sujet, chaque
 *   version y ajoute une entrée. Elle n'est un doublon que si la même entrée est citée (une citation identique).
 *   Sans cette distinction, toute vidéo sur une nouvelle version de Claude Code était refusée pendant 60 jours après
 *   la première (constaté du 20 au 26/11/2026 : 5 vidéos d'actualité bloquées, 2 journées à 2 vidéos au lieu de 3).
 */
import type { Episode } from "../schema/episode";

export interface EntreeHistorique {
  id: string;
  date: string;
  sources: string[];
}

const JOUR = 86400e3;
const normUrl = (u: string) => u.replace(/\/$/, "").toLowerCase();
const normCitation = (c: string) => c.replace(/\s+/g, " ").trim().toLowerCase();

/** Vrai pour une page qui accumule des entrées datées : changelog, notes de version, liste de releases, registre de paquets. */
export function estSourceJournal(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  const hote = u.hostname.toLowerCase();
  const segments = u.pathname.toLowerCase().split("/").filter(Boolean);
  if (hote === "registry.npmjs.org" || hote === "pypi.org") return true;
  if ((hote === "www.npmjs.com" || hote === "npmjs.com") && segments[0] === "package") return true;
  const dernier = segments[segments.length - 1] ?? "";
  const parent = segments[segments.length - 2] ?? "";
  return /^changelog(\.md)?$/.test(dernier) || dernier === "releases" || dernier === "release-notes" || parent === "release-notes";
}

/**
 * Épisode publié depuis moins de 60 jours qui traite déjà ce sujet, ou null.
 * @param charger lit un épisode de l'historique (null s'il n'existe plus) pour comparer les citations.
 */
export function trouverDoublon(
  ep: Pick<Episode, "id" | "sources" | "affirmations">,
  historique: EntreeHistorique[],
  charger: (id: string) => Pick<Episode, "affirmations"> | null,
  maintenant = Date.now(),
): { id: string; detail: string } | null {
  const principales = ep.sources.slice(0, 2).map((s) => normUrl(s.url));
  const citations = new Set(ep.affirmations.map((a) => normCitation(a.citation)));
  for (const h of historique) {
    if (h.id === ep.id || maintenant - new Date(h.date).getTime() >= 60 * JOUR) continue;
    const communes = h.sources.map(normUrl).filter((u) => principales.includes(u));
    if (!communes.length) continue;
    if (communes.some((u) => !estSourceJournal(u))) return { id: h.id, detail: `même source principale que ${h.id} (< 60 jours)` };
    const commune = charger(h.id)?.affirmations.find((a) => citations.has(normCitation(a.citation)));
    if (commune) return { id: h.id, detail: `même entrée de journal que ${h.id} (< 60 jours) : « ${commune.citation.slice(0, 80)} »` };
  }
  return null;
}
