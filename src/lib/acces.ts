/**
 * `fm acces` : vérifie que chaque service est branché, sans jamais afficher une valeur secrète.
 * Seuls les NOMS des variables et des informations publiques (offre, nom de voix, nom de chaîne) sont montrés.
 */
import { chaine, env } from "./config";
import { jetonsPresents } from "./jetons";
import { log } from "./log";
import { apiBase } from "../voice/voice";

export interface LigneAcces {
  service: string;
  etat: "ok" | "absent" | "erreur";
  detail: string;
}

const manquants = (noms: string[]) => noms.filter((n) => !env(n));

/** Permission refusée par ElevenLabs (« missing the permission X »), sinon null. */
function permissionManquante(texte: string): string | null {
  return texte.match(/missing the permission ([a-z_]+)/i)?.[1] ?? null;
}

/** Clé elle-même refusée (clé invalide, identifiant de clé collé à la place de la clé…) : message d'ElevenLabs, sinon null. */
function cleRefusee(status: number, texte: string): string | null {
  let detail: { code?: string; status?: string; message?: string } = {};
  try {
    detail = (JSON.parse(texte) as { detail?: typeof detail }).detail ?? {};
  } catch {
    /* réponse non JSON */
  }
  if (detail.status === "missing_permissions") return null;
  if (detail.code === "invalid_api_key" || /api_key/.test(detail.status ?? "") || status === 401) return detail.message ?? `refus ${status}`;
  return null;
}

async function elevenlabs(): Promise<LigneAcces[]> {
  const cle = env("ELEVENLABS_API_KEY");
  if (!cle) return [{ service: "ElevenLabs", etat: "absent", detail: "ELEVENLABS_API_KEY manquant dans .env" }];
  const h = { "xi-api-key": cle, "Content-Type": "application/json", Accept: "application/json" };
  const appel = async (p: string, init: RequestInit = {}) => {
    const r = await fetch(`${apiBase()}${p}`, { ...init, headers: h });
    const t = await r.text();
    return { status: r.status, texte: t, permission: r.status === 401 ? permissionManquante(t) : null, refus: cleRefusee(r.status, t) };
  };
  const voixConfig = env("ELEVENLABS_VOICE_ID") ?? chaine().voix.voice_id;
  const voixChoisie = voixConfig && !voixConfig.startsWith("A_CHOISIR") ? voixConfig : null;
  // Sans consommer de crédit : une synthèse à texte vide est refusée avant tout calcul (permission d'abord).
  const tts = await appel(`/v1/text-to-speech/${encodeURIComponent(voixChoisie ?? "verification")}/with-timestamps`, {
    method: "POST",
    body: JSON.stringify({ text: "", model_id: chaine().voix.modele }),
  });
  if (tts.refus) return [{ service: "ElevenLabs", etat: "erreur", detail: `clé refusée : ${tts.refus.slice(0, 160)}` }];
  const voix = await appel("/v2/voices?page_size=1");
  const modeles = await appel("/v1/models");
  const abonnement = await appel("/v1/user/subscription");
  const indispensables = [tts.permission, voix.permission].filter(Boolean) as string[];
  const facultatives = [modeles.permission, abonnement.permission].filter(Boolean) as string[];
  const lignes: LigneAcces[] = [{ service: "ElevenLabs", etat: "ok", detail: "clé reconnue" }];
  lignes.push(
    indispensables.length
      ? { service: "Permissions", etat: "erreur", detail: `indispensables manquantes : ${indispensables.join(", ")}${facultatives.length ? ` ; facultatives : ${facultatives.join(", ")}` : ""}` }
      : { service: "Permissions", etat: "ok", detail: facultatives.length ? `utiles présentes ; facultatives absentes : ${facultatives.join(", ")}` : "toutes présentes" },
  );
  if (abonnement.status === 200) {
    const j = JSON.parse(abonnement.texte) as { tier?: string; character_count?: number; character_limit?: number };
    lignes.push({ service: "Offre", etat: "ok", detail: `« ${j.tier ?? "?"} », ${j.character_count ?? "?"} / ${j.character_limit ?? "?"} crédits utilisés ce mois` });
  }
  if (!voixChoisie) {
    lignes.push({ service: "Voix", etat: "absent", detail: "aucune voix choisie (config/chaine.json > voix.voice_id ou ELEVENLABS_VOICE_ID)" });
  } else if (!voix.permission) {
    const v = await appel(`/v1/voices/${encodeURIComponent(voixChoisie)}`);
    const nom = v.status === 200 ? (JSON.parse(v.texte) as { name?: string }).name : null;
    lignes.push(nom ? { service: "Voix", etat: "ok", detail: `« ${nom} » (${voixChoisie})` } : { service: "Voix", etat: "erreur", detail: `voix ${voixChoisie} inaccessible avec cette clé (${v.status})` });
  }
  return lignes;
}

async function youtube(): Promise<LigneAcces> {
  const absents = manquants(["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"]);
  if (absents.length) return { service: "YouTube", etat: "absent", detail: `manque : ${absents.join(", ")}` };
  const { chaineConnectee, refreshToken } = await import("../publish/youtube");
  if (!refreshToken()) return { service: "YouTube", etat: "absent", detail: "pas encore autorisé (workflow « Autorisation » ou `fm auth youtube`)" };
  const c = await chaineConnectee();
  if (!c) return { service: "YouTube", etat: "erreur", detail: "jeton valide mais aucune chaîne sur ce compte Google" };
  const attendu = chaine().handles.youtube;
  if (attendu && c.handle && c.handle.toLowerCase() !== attendu.toLowerCase()) {
    return { service: "YouTube", etat: "erreur", detail: `chaîne autorisée ${c.handle} (« ${c.titre} ») au lieu de ${attendu} : refaire l'autorisation avec le bon compte` };
  }
  return { service: "YouTube", etat: "ok", detail: `chaîne « ${c.titre} »${c.handle ? ` (${c.handle})` : ""}` };
}

function tiktok(): LigneAcces {
  // Pas d'appel en direct : il faudrait renouveler le jeton, ce qui peut invalider la copie gardée ailleurs.
  const absents = manquants(["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"]);
  if (absents.length) return { service: "TikTok", etat: "absent", detail: `manque : ${absents.join(", ")}` };
  if (!env("TIKTOK_REFRESH_TOKEN") && !jetonsPresents("tiktok")) return { service: "TikTok", etat: "absent", detail: "pas encore autorisé (workflow « Autorisation » ou `fm auth tiktok`)" };
  return { service: "TikTok", etat: "ok", detail: "autorisé (compte vérifié lors de l'autorisation)" };
}

async function instagram(): Promise<LigneAcces> {
  if (!env("INSTAGRAM_ACCESS_TOKEN") && !jetonsPresents("instagram")) {
    return { service: "Instagram", etat: "absent", detail: chaine().publication.instagram.actif ? "INSTAGRAM_ACCESS_TOKEN manquant" : "non activé (config/chaine.json > publication.instagram)" };
  }
  const { compte } = await import("../publish/instagram");
  const c = await compte();
  const pro = c.type === "BUSINESS" || c.type === "MEDIA_CREATOR";
  return pro
    ? { service: "Instagram", etat: "ok", detail: `@${c.username} (compte ${c.type === "BUSINESS" ? "entreprise" : "créateur"})` }
    : { service: "Instagram", etat: "erreur", detail: `@${c.username} n'est pas un compte professionnel (${c.type ?? "type inconnu"}) : le passer en compte Créateur` };
}

export async function verifierAcces(): Promise<LigneAcces[]> {
  const lignes: LigneAcces[] = [];
  const sur = async (service: string, f: () => Promise<LigneAcces | LigneAcces[]>) => {
    try {
      lignes.push(...([] as LigneAcces[]).concat(await f()));
    } catch (e) {
      lignes.push({ service, etat: "erreur", detail: (e as Error).message.slice(0, 160) });
    }
  };
  await sur("ElevenLabs", elevenlabs);
  await sur("YouTube", youtube);
  lignes.push(tiktok());
  await sur("Instagram", instagram);
  console.table(lignes.map((l) => ({ service: l.service, état: l.etat, détail: l.detail })));
  const ko = lignes.filter((l) => l.etat !== "ok").length;
  log(ko ? "warn" : "ok", "acces", ko ? `${ko} point(s) à compléter (seuls les noms sont affichés, jamais les valeurs)` : "Tous les services sont branchés");
  return lignes;
}
