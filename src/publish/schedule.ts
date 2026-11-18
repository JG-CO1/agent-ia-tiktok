/** Calcul des horaires de publication dans le fuseau de la chaîne (Europe/Paris par défaut, heure d'été gérée). */

/** Décalage UTC (ex. "+01:00") du fuseau `tz` à l'instant `d`. */
export function tzOffset(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(d);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = name.match(/GMT([+-]\d{2}):?(\d{2})?/);
  return m ? `${m[1]}:${m[2] ?? "00"}` : "+00:00";
}

/** "2026-11-14" + "09:00" + "Europe/Paris" -> "2026-11-14T09:00:00+01:00" */
export function publicationIso(date: string, heure: string, tz: string): string {
  const [h, mi] = heure.split(":").map(Number);
  // premier essai avec le décalage à midi UTC ce jour-là, puis correction si on traverse un changement d'heure
  let off = tzOffset(new Date(`${date}T12:00:00Z`), tz);
  const iso = (o: string) => `${date}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00${o}`;
  const real = tzOffset(new Date(iso(off)), tz);
  if (real !== off) off = real;
  return iso(off);
}

/** Date du jour (AAAA-MM-JJ) dans le fuseau donné. */
export function todayIn(tz: string, d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export type Plateforme = "youtube" | "tiktok" | "instagram";

/**
 * Heure de publication d'un épisode sur une plateforme : l'heure de `horaires.<plateforme>` pour son créneau, le même
 * jour. Si `publication_prevue` a été changée à la main (heure différente de celle du créneau), elle s'applique à
 * toutes les plateformes : c'est ce qui permet de forcer une publication immédiate.
 */
export function heurePlateforme(
  ep: { publication_prevue: string; creneau: "matin" | "midi" | "soir" },
  plateforme: Plateforme,
  c: { fuseau: string; creneaux: Record<string, string>; horaires?: Partial<Record<Plateforme, Record<string, string>>> },
): string {
  const date = todayIn(c.fuseau, new Date(ep.publication_prevue));
  const standard = publicationIso(date, c.creneaux[ep.creneau], c.fuseau);
  if (new Date(standard).getTime() !== new Date(ep.publication_prevue).getTime()) return ep.publication_prevue;
  const heure = c.horaires?.[plateforme]?.[ep.creneau];
  return heure ? publicationIso(date, heure, c.fuseau) : ep.publication_prevue;
}

/** Vrai si l'heure de publication `iso` est arrivée (avec une marge en minutes). */
export const estDue = (iso: string, margeMin = 5, maintenant = Date.now()) => new Date(iso).getTime() <= maintenant + margeMin * 60_000;
