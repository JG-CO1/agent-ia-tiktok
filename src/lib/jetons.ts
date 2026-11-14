/**
 * Magasin de jetons OAuth chiffré (AES-256-GCM), versionné dans data/jetons/<service>.json.enc.
 *
 * Pourquoi dans le dépôt : un workflow GitHub ne peut pas écrire de secret GitHub. L'autorisation « sans rien
 * installer » (workflow Autorisation) et les renouvellements de jetons par TikTok sont donc enregistrés ici,
 * chiffrés. Le dépôt étant public, la clé doit être un vrai secret à haute entropie :
 *  - TikTok : FM_CLE_JETONS si défini (32 octets aléatoires), sinon dérivée de TIKTOK_CLIENT_SECRET ;
 *  - YouTube : toujours dérivée de YOUTUBE_CLIENT_SECRET (présent dans chaque étape qui parle à YouTube) ;
 *  - Instagram : FM_CLE_JETONS si défini, sinon dérivée du secret INSTAGRAM_ACCESS_TOKEN d'origine (le jeton
 *    renouvelé, lui, est dans le magasin ; si le secret est remplacé, le magasin devient illisible et le
 *    nouveau secret prend le relais).
 * Le fichier indique quelle source de clé a servi ; sans elle, ou si elle a changé, on renvoie null (le code
 * appelant se rabat alors sur le secret *_REFRESH_TOKEN) au lieu d'échouer.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { env } from "./config";
import { log } from "./log";
import { DATA_DIR } from "./paths";

export type Service = "youtube" | "tiktok" | "instagram";
type SourceCle = "FM_CLE_JETONS" | "YOUTUBE_CLIENT_SECRET" | "TIKTOK_CLIENT_SECRET" | "INSTAGRAM_ACCESS_TOKEN";

export const fichierJetons = (service: Service) => path.join(process.env.FM_JETONS_DIR || path.join(DATA_DIR, "jetons"), `${service}.json.enc`);

function sourcePourEcrire(service: Service): SourceCle | null {
  if (service === "youtube") return env("YOUTUBE_CLIENT_SECRET") ? "YOUTUBE_CLIENT_SECRET" : null;
  if (env("FM_CLE_JETONS")) return "FM_CLE_JETONS";
  const repli: SourceCle = service === "tiktok" ? "TIKTOK_CLIENT_SECRET" : "INSTAGRAM_ACCESS_TOKEN";
  return env(repli) ? repli : null;
}

function cle(source: SourceCle, service: Service): Buffer | null {
  const v = env(source);
  return v ? crypto.scryptSync(v, `studio-fantome:${service}:${source}`, 32) : null;
}

export function jetonsPresents(service: Service): boolean {
  return fs.existsSync(fichierJetons(service));
}

/** Chiffre et enregistre des jetons. Renvoie false (sans rien écrire) si aucune clé n'est disponible. */
export function sauverJetons(service: Service, donnees: object): boolean {
  const source = sourcePourEcrire(service);
  const k = source ? cle(source, service) : null;
  if (!source || !k) {
    log("warn", service, `Aucune clé de chiffrement disponible : jetons ${service} non enregistrés`);
    return false;
  }
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([c.update(JSON.stringify(donnees), "utf8"), c.final()]);
  const f = fichierJetons(service);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ v: 2, cle: source, data: Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64") }) + "\n");
  return true;
}

/** Déchiffre les jetons enregistrés, ou null (absents, clé indisponible ou changée, fichier abîmé). */
export function chargerJetons<T>(service: Service): T | null {
  const f = fichierJetons(service);
  if (!fs.existsSync(f)) return null;
  try {
    const texte = fs.readFileSync(f, "utf8").trim();
    // Format 1 (TikTok, avant la v2) : base64 brut chiffré avec FM_CLE_JETONS et le sel « studio-fantome »
    const v1 = !texte.startsWith("{");
    const enveloppe = v1 ? { cle: "FM_CLE_JETONS" as SourceCle, data: texte } : (JSON.parse(texte) as { cle: SourceCle; data: string });
    const secret = env(enveloppe.cle);
    if (!secret) {
      log("warn", service, `Jetons ${service} chiffrés avec ${enveloppe.cle}, absent ici : non utilisés`);
      return null;
    }
    const k = v1 ? crypto.scryptSync(secret, "studio-fantome", 32) : cle(enveloppe.cle, service)!;
    const raw = Buffer.from(enveloppe.data, "base64");
    const d = crypto.createDecipheriv("aes-256-gcm", k, raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8")) as T;
  } catch {
    log("warn", service, `Jetons ${service} illisibles (clé changée ou fichier abîmé) : non utilisés`);
    return null;
  }
}

/**
 * Extrait un code d'autorisation de ce que la personne a collé : le code seul, l'adresse complète de la page de
 * retour (…?code=…&scope=…), ou la commande proposée par la page de retour TikTok (… --code '…').
 */
export function extraireCode(saisie: string): string {
  let s = saisie.trim();
  const url = s.match(/[?&]code=([^&\s'"]+)/);
  if (url) s = url[1];
  else {
    const cmd = s.match(/--code\s+(['"]?)(.+?)\1\s*$/);
    if (cmd) s = cmd[2];
    s = s.replace(/^(['"])(.*)\1$/, "$2");
  }
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
