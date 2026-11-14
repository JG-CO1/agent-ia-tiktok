/** Configuration de la chaîne (config/chaine.json) + variables d'environnement (.env optionnel). */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { CONFIG_DIR, ROOT } from "./paths";

const ChaineSchema = z.object({
  nom: z.string(),
  /** @ de la chaîne sur chaque plateforme (null = pas encore de compte). */
  handles: z.object({ youtube: z.string().nullable(), tiktok: z.string().nullable(), instagram: z.string().nullable() }),
  promesse: z.string(),
  fuseau: z.string().default("Europe/Paris"),
  creneaux: z.object({ matin: z.string(), midi: z.string(), soir: z.string() }),
  formats_par_creneau: z.object({ matin: z.string(), midi: z.string(), soir: z.string() }),
  duree: z.object({ min: z.number(), max: z.number(), cible: z.number() }),
  voix: z.object({
    fournisseur: z.enum(["elevenlabs", "local"]),
    voice_id: z.string(),
    modele: z.string(),
    stabilite: z.number(),
    similarite: z.number(),
    style: z.number(),
    vitesse: z.number(),
    voix_locale: z.string(),
  }),
  musique: z.object({ fichier: z.string().nullable(), volume: z.number() }),
  publication: z.object({
    mode: z.enum(["approbation", "autonome"]),
    youtube: z.object({ actif: z.boolean(), categorie: z.string(), confidentialite_revue: z.enum(["private", "unlisted"]) }),
    tiktok: z.object({ actif: z.boolean(), mode: z.enum(["brouillon", "direct"]), contenu_ia: z.boolean() }),
    /** Reels Instagram (compte professionnel + app Meta) : désactivé tant que l'accès n'est pas configuré. */
    instagram: z.object({ actif: z.boolean(), partager_fil: z.boolean().default(true) }).default({ actif: false, partager_fil: true }),
    sauvegarde_releases: z.boolean(),
  }),
  hashtags_base: z.array(z.string()),
  mention_independance: z.string(),
});
export type Chaine = z.infer<typeof ChaineSchema>;

/**
 * Texte d'identité incrusté dans la vidéo (haut de chaque plan, appel à s'abonner) : le @ s'il est le même sur toutes
 * les plateformes, sinon le nom de la chaîne. Une même vidéo part sur toutes les plateformes, et chacune affiche déjà
 * le @ du compte sous la vidéo : un @ propre à une seule plateforme serait faux ailleurs.
 */
export function signatureVideo(c: Chaine = chaine()): string {
  const connus = Object.values(c.handles).filter((h): h is string => Boolean(h && h.trim()));
  const uniques = new Set(connus.map((h) => h.trim().toLowerCase()));
  return connus.length && uniques.size === 1 ? connus[0].trim() : c.nom;
}

let cached: Chaine | null = null;
export function chaine(): Chaine {
  if (!cached) cached = ChaineSchema.parse(JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, "chaine.json"), "utf8")));
  return cached;
}

let envLoaded = false;
/** Lit une variable d'environnement (charge .env une seule fois s'il existe). */
export function env(name: string, required = false): string | undefined {
  if (!envLoaded) {
    envLoaded = true;
    const f = process.env.FM_ENV_FICHIER || path.join(ROOT, ".env"); // FM_ENV_FICHIER : tests uniquement
    if (fs.existsSync(f)) process.loadEnvFile(f);
  }
  const v = process.env[name];
  if (required && !v) throw new Error(`Variable d'environnement manquante : ${name} (voir docs/INSTALLATION.md)`);
  return v || undefined;
}
