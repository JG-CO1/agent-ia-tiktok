/**
 * Secrets locaux (.env) et envoi vers GitHub, sans jamais les afficher.
 *
 * Principe : une clé n'est collée qu'une seule fois, par le propriétaire, dans son fichier .env (avec son éditeur).
 * Le CLI la lit et la transmet à `gh secret set` par l'ENTRÉE STANDARD : elle n'apparaît ni à l'écran, ni dans
 * les journaux, ni dans les arguments d'un processus, ni dans la conversation avec Claude.
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { chaine } from "./config";
import { jetonsPresents } from "./jetons";
import { FmError, log } from "./log";
import { ROOT } from "./paths";

/** Secrets lus par les workflows (.github/workflows). Un seul des deux identifiants Claude suffit. */
export const SECRETS_GITHUB = [
  "CLAUDE_CODE_OAUTH_TOKEN",
  "ANTHROPIC_API_KEY",
  "ELEVENLABS_API_KEY",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
  "TIKTOK_CLIENT_KEY",
  "TIKTOK_CLIENT_SECRET",
  "TIKTOK_REFRESH_TOKEN",
  "INSTAGRAM_ACCESS_TOKEN",
  "FM_CLE_JETONS",
] as const;
/** Valeurs non secrètes lues par les workflows (onglet « Variables »). */
export const VARIABLES_GITHUB = ["ELEVENLABS_VOICE_ID"] as const;

export function cheminEnv(): string {
  return process.env.FM_ENV_FICHIER || path.join(ROOT, ".env");
}

export function lireEnvLocal(): Record<string, string> {
  const f = cheminEnv();
  return fs.existsSync(f) ? (parseEnv(fs.readFileSync(f, "utf8")) as Record<string, string>) : {};
}

function valeurEnv(valeur: string): string {
  if (/[\r\n"]/.test(valeur)) throw new FmError("Valeur refusée : retour à la ligne ou guillemet dans un secret", "secrets");
  // Sans guillemets, Node coupe la valeur au premier « # » : on protège tout ce qui n'est pas « simple ».
  return /^[A-Za-z0-9_\-./:+=@,]*$/.test(valeur) ? valeur : `"${valeur}"`;
}

/** Écrit (ou remplace) NOM=valeur dans .env, sans rien afficher. Les autres lignes sont conservées. */
export function ecrireEnvLocal(nom: string, valeur: string) {
  if (!/^[A-Z][A-Z0-9_]*$/.test(nom)) throw new FmError(`Nom de variable invalide : ${nom}`, "secrets");
  const f = cheminEnv();
  if (!fs.existsSync(f)) {
    const modele = path.join(ROOT, ".env.example");
    fs.writeFileSync(f, fs.existsSync(modele) ? fs.readFileSync(modele, "utf8") : "", { mode: 0o600 });
  }
  const lignes = fs.readFileSync(f, "utf8").split("\n");
  const re = new RegExp(`^\\s*(?:export\\s+)?${nom}\\s*=(.*)$`);
  let trouve = false;
  const sortie = lignes.map((l) => {
    const m = l.match(re);
    if (!m) return l;
    trouve = true;
    // Ligne du modèle « NOM=   # explication » : on garde l'explication.
    const commentaire = /^\s+#/.test(m[1]) ? m[1].replace(/^\s+/, "   ") : "";
    return `${nom}=${valeurEnv(valeur)}${commentaire}`;
  });
  if (!trouve) {
    if (sortie.length && sortie[sortie.length - 1] !== "") sortie.push("");
    sortie.splice(sortie.length - 1, 0, `${nom}=${valeurEnv(valeur)}`);
  }
  fs.writeFileSync(f, sortie.join("\n"), { mode: 0o600 });
  process.env[nom] = valeur;
}

/** Génère une clé aléatoire forte directement dans .env (jamais affichée). */
export function secretAleatoire(nom: string, o: { remplacer?: boolean } = {}) {
  if (lireEnvLocal()[nom] && !o.remplacer) {
    throw new FmError(`${nom} existe déjà dans .env : rien n'est changé (--remplacer pour en créer une nouvelle ; pour FM_CLE_JETONS, les jetons TikTok déjà chiffrés deviendraient illisibles).`, "secrets");
  }
  ecrireEnvLocal(nom, crypto.randomBytes(32).toString("base64"));
  log("ok", "secrets", `${nom} généré dans .env (44 caractères aléatoires, non affichés)`);
}

/** owner/nom du dépôt GitHub (option --depot, sinon remote « origin »). */
export function depotGitHub(depot?: string): string {
  if (depot) return depot;
  const r = spawnSync("git", ["remote", "get-url", "origin"], { cwd: ROOT, encoding: "utf8" });
  const m = (r.stdout ?? "").trim().match(/github\.com[/:]([^/\s]+)\/([^/\s]+?)(?:\.git)?$/);
  if (!m) throw new FmError("Dépôt GitHub introuvable (remote « origin ») : préciser --depot owner/nom", "secrets");
  return `${m[1]}/${m[2]}`;
}

function gh(args: string[], input?: string) {
  const r = spawnSync("gh", args, { cwd: ROOT, input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  if (r.error) throw new FmError("GitHub CLI (gh) introuvable : l'installer (cli.github.com) puis `gh auth login`", "secrets");
  if (r.status !== 0) throw new FmError(`gh ${args.slice(0, 2).join(" ")} : ${(r.stderr || r.stdout).trim().slice(0, 300)}`, "secrets");
  return r.stdout;
}

function nomsSurGitHub(type: "secret" | "variable", depot: string): Set<string> {
  const j = JSON.parse(gh([type, "list", "--repo", depot, "--json", "name"]) || "[]") as Array<{ name: string }>;
  return new Set(j.map((x) => x.name));
}

export interface BilanSecrets {
  envoyes: string[];
  variables: string[];
  manquants: string[];
}

/**
 * Envoie vers GitHub les secrets et variables présents dans .env (seuls les noms attendus par les workflows),
 * puis dresse la liste de ce qui manque encore sur GitHub. Avec `verifier`, n'envoie rien.
 */
export function secretsGithub(o: { depot?: string; noms?: string[]; verifier?: boolean } = {}): BilanSecrets {
  const depot = depotGitHub(o.depot);
  const local = lireEnvLocal();
  const voulus = (n: string) => !o.noms?.length || o.noms.includes(n);
  const envoyes: string[] = [];
  const variables: string[] = [];
  if (!o.verifier) {
    for (const nom of SECRETS_GITHUB) {
      const v = local[nom];
      if (!v || !voulus(nom)) continue;
      gh(["secret", "set", nom, "--repo", depot], v); // valeur transmise par l'entrée standard uniquement
      envoyes.push(nom);
    }
    for (const nom of VARIABLES_GITHUB) {
      const v = local[nom];
      if (!v || !voulus(nom)) continue;
      gh(["variable", "set", nom, "--repo", depot, "--body", v]);
      variables.push(nom);
    }
  }
  const surGithub = nomsSurGitHub("secret", depot);
  const varsGithub = nomsSurGitHub("variable", depot);
  const manquants: string[] = [];
  if (!surGithub.has("CLAUDE_CODE_OAUTH_TOKEN") && !surGithub.has("ANTHROPIC_API_KEY")) manquants.push("CLAUDE_CODE_OAUTH_TOKEN (ou ANTHROPIC_API_KEY)");
  for (const nom of ["ELEVENLABS_API_KEY", "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"]) {
    if (!surGithub.has(nom)) manquants.push(nom);
  }
  // Jetons de rafraîchissement : un secret GitHub OU les jetons chiffrés par le workflow « Autorisation » suffisent.
  if (!surGithub.has("YOUTUBE_REFRESH_TOKEN") && !jetonsPresents("youtube")) manquants.push("autorisation YouTube (workflow « Autorisation » ou YOUTUBE_REFRESH_TOKEN)");
  if (!surGithub.has("TIKTOK_REFRESH_TOKEN") && !jetonsPresents("tiktok")) manquants.push("autorisation TikTok (workflow « Autorisation » ou TIKTOK_REFRESH_TOKEN)");
  if (chaine().publication.instagram.actif && !surGithub.has("INSTAGRAM_ACCESS_TOKEN") && !jetonsPresents("instagram")) manquants.push("INSTAGRAM_ACCESS_TOKEN");
  // FM_CLE_JETONS est facultatif : sans lui, les jetons TikTok sont chiffrés avec une clé dérivée de TIKTOK_CLIENT_SECRET.
  // La voix choisie peut simplement être écrite dans config/chaine.json (pas un secret) : la variable devient inutile.
  const voixDansConfig = !chaine().voix.voice_id.startsWith("A_CHOISIR");
  for (const nom of VARIABLES_GITHUB) if (!varsGithub.has(nom) && !(nom === "ELEVENLABS_VOICE_ID" && voixDansConfig)) manquants.push(`${nom} (variable)`);
  if (envoyes.length) log("ok", "secrets", `Secrets envoyés sur ${depot} : ${envoyes.join(", ")}`);
  if (variables.length) log("ok", "secrets", `Variables envoyées sur ${depot} : ${variables.join(", ")}`);
  if (!o.verifier && !envoyes.length && !variables.length) log("info", "secrets", "Aucune valeur attendue trouvée dans .env");
  log(manquants.length ? "warn" : "ok", "secrets", manquants.length ? `Encore absents de GitHub : ${manquants.join(", ")}` : "Tous les secrets et variables attendus sont sur GitHub");
  return { envoyes, variables, manquants };
}
