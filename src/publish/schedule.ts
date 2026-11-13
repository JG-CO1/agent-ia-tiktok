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
