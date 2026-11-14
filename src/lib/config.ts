/** Configuration de la chaîne (config/chaine.json) + variables d'environnement (.env optionnel). */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { CONFIG_DIR, ROOT } from "./paths";

const ChaineSchema = z.object({
  nom: z.string(),
  handle: z.string(),
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
    sauvegarde_releases: z.boolean(),
  }),
  hashtags_base: z.array(z.string()),
  mention_independance: z.string(),
});
export type Chaine = z.infer<typeof ChaineSchema>;

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
