/**
 * `fm acces` : vérifie que chaque service est branché, sans jamais afficher une valeur secrète.
 * Seuls les NOMS des variables et des informations publiques (offre, nom de voix, nom de chaîne) sont montrés.
 */
import { chaine, env } from "./config";
import { jetonsPresents } from "./jetons";
import { log, messageErreur } from "./log";
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

export interface ReponseEL {
  status: number;
  texte: string;
  permission: string | null;
  refus: string | null;
  /** Panne passagère côté ElevenLabs (réseau coupé, délai dépassé, 5xx, 429) : ne dit rien de la clé. */
  panne: string | null;
}

/** Lecture d'une réponse ElevenLabs (exportée pour les tests). */
export function lireReponseEL(status: number, texte: string): ReponseEL {
  const panne = status >= 500 || status === 429 ? `HTTP ${status}` : null;
  return { status, texte, permission: status === 401 ? permissionManquante(texte) : null, refus: panne ? null : cleRefusee(status, texte), panne };
}

/**
 * Contrôle ElevenLabs. Seuls la clé, la permission de synthèse et la voix choisie sont indispensables. Une panne
 * passagère d'ElevenLabs (constaté le 18/11/2026 : liste des voix en 502, compte et abonnement sans réponse alors que
 * la synthèse marchait) n'arrête pas la production : la synthèse elle-même est réessayée, le reste est signalé.
 */
async function elevenlabs(): Promise<LigneAcces[]> {
  const cle = env("ELEVENLABS_API_KEY");
  if (!cle) return [{ service: "ElevenLabs", etat: "absent", detail: "ELEVENLABS_API_KEY manquant dans .env" }];
  const h = { "xi-api-key": cle, "Content-Type": "application/json", Accept: "application/json" };
  const appel = async (p: string, init: RequestInit = {}): Promise<ReponseEL> => {
    try {
      const r = await fetch(`${apiBase()}${p}`, { ...init, headers: h, signal: AbortSignal.timeout(20_000) });
      return lireReponseEL(r.status, await r.text());
    } catch (e) {
      return { status: 0, texte: "", permission: null, refus: null, panne: messageErreur(e) };
    }
  };
  /** Appel indispensable : jusqu'à 3 essais (5 s puis 15 s d'attente) tant qu'ElevenLabs est en panne passagère. */
  const appelSur = async (p: string, init: RequestInit = {}) => {
    let r = await appel(p, init);
    for (let essai = 1; essai < 3 && r.panne; essai++) {
      await new Promise((ok) => setTimeout(ok, essai === 1 ? 5_000 : 15_000));
      r = await appel(p, init);
    }
    return r;
  };
  const voixConfig = env("ELEVENLABS_VOICE_ID") ?? chaine().voix.voice_id;
  const voixChoisie = voixConfig && !voixConfig.startsWith("A_CHOISIR") ? voixConfig : null;
  // Sans consommer de crédit : une synthèse à texte vide est refusée avant tout calcul (permission d'abord).
  const tts = await appelSur(`/v1/text-to-speech/${encodeURIComponent(voixChoisie ?? "verification")}/with-timestamps`, {
    method: "POST",
    body: JSON.stringify({ text: "", model_id: chaine().voix.modele }),
  });
  if (tts.panne) return [{ service: "ElevenLabs", etat: "erreur", detail: `synthèse injoignable (${tts.panne}) après 3 essais : panne d'ElevenLabs ? réessayer plus tard` }];
  if (tts.refus) return [{ service: "ElevenLabs", etat: "erreur", detail: `clé refusée : ${tts.refus.slice(0, 160)}` }];
  const voix = await appel("/v2/voices?page_size=1");
  const modeles = await appel("/v1/models");
  const abonnement = await appel("/v1/user/subscription");
  const indispensables = [tts.permission, voix.permission].filter(Boolean) as string[];
  const facultatives = [modeles.permission, abonnement.permission].filter(Boolean) as string[];
  const lignes: LigneAcces[] = [{ service: "ElevenLabs", etat: "ok", detail: "clé reconnue, synthèse joignable" }];
  const nonVerifiable = voix.panne ? ` ; lecture des voix non vérifiable pour l'instant (${voix.panne})` : "";
  lignes.push(
    indispensables.length
      ? { service: "Permissions", etat: "erreur", detail: `indispensables manquantes : ${indispensables.join(", ")}${facultatives.length ? ` ; facultatives : ${facultatives.join(", ")}` : ""}` }
      : { service: "Permissions", etat: "ok", detail: `${facultatives.length ? `utiles présentes ; facultatives absentes : ${facultatives.join(", ")}` : "toutes présentes"}${nonVerifiable}` },
  );
  if (abonnement.status === 200) {
    const j = JSON.parse(abonnement.texte) as { tier?: string; character_count?: number; character_limit?: number };
    lignes.push({ service: "Offre", etat: "ok", detail: `« ${j.tier ?? "?"} », ${j.character_count ?? "?"} / ${j.character_limit ?? "?"} crédits utilisés ce mois` });
  } else if (abonnement.panne) {
    lignes.push({ service: "Offre", etat: "ok", detail: `non lisible pour l'instant (${abonnement.panne})` });
  }
  if (!voixChoisie) {
    lignes.push({ service: "Voix", etat: "absent", detail: "aucune voix choisie (config/chaine.json > voix.voice_id ou ELEVENLABS_VOICE_ID)" });
  } else if (!voix.permission) {
    const v = await appelSur(`/v1/voices/${encodeURIComponent(voixChoisie)}`);
    const nom = v.status === 200 ? (JSON.parse(v.texte) as { name?: string }).name : null;
    lignes.push(
      nom
        ? { service: "Voix", etat: "ok", detail: `« ${nom} » (${voixChoisie})` }
        : v.panne
          ? { service: "Voix", etat: "ok", detail: `${voixChoisie} : non vérifiable pour l'instant (${v.panne}) ; la synthèse répond` }
          : { service: "Voix", etat: "erreur", detail: `voix ${voixChoisie} inaccessible avec cette clé (${v.status})` },
    );
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

async function instagram(): Promise<LigneAcces[]> {
  const ig = await import("../publish/instagram");
  const actif = chaine().publication.instagram.actif;
  const attendu = chaine().handles.instagram?.replace(/^@/, "").toLowerCase();
  const verifierHandle = (c: { username: string }): LigneAcces | null =>
    attendu && c.username.toLowerCase() !== attendu ? { service: "Instagram", etat: "erreur", detail: `compte @${c.username} au lieu de @${attendu} (config/chaine.json > handles.instagram)` } : null;

  if (ig.connexion() === "facebook") {
    if (!env("INSTAGRAM_ACCESS_TOKEN")) {
      return [{ service: "Instagram", etat: "absent", detail: actif ? "INSTAGRAM_ACCESS_TOKEN manquant (jeton d'utilisateur système)" : "non activé (config/chaine.json > publication.instagram)" }];
    }
    if (!env("INSTAGRAM_USER_ID")) {
      // Aide : comptes Instagram professionnels liés aux Pages que le jeton voit (les ID ne sont pas secrets).
      const trouves = await ig.decouvrirComptes().catch(() => []);
      const liste = trouves.map((c) => `@${c.username ?? "?"} = ${c.id} (Page « ${c.page} »)`).join(" ; ");
      return [{ service: "Instagram", etat: "absent", detail: `INSTAGRAM_USER_ID manquant${liste ? ` ; comptes vus par le jeton : ${liste}` : " (ID du compte Instagram professionnel)"}` }];
    }
    const c = await ig.compte();
    const lignes: LigneAcces[] = [verifierHandle(c) ?? { service: "Instagram", etat: "ok", detail: `@${c.username} (connexion Facebook, API ${ig.versionGraph()}, jeton sans expiration)` }];
    try {
      const p = await ig.permissionsManquantes();
      lignes.push(
        p.indispensables.length
          ? { service: "Permissions IG", etat: "erreur", detail: `manquantes : ${p.indispensables.join(", ")}${p.facultatives.length ? ` ; pour les statistiques : ${p.facultatives.join(", ")}` : ""}` }
          : { service: "Permissions IG", etat: "ok", detail: p.facultatives.length ? `publication possible ; pour les statistiques : ${p.facultatives.join(", ")}` : "toutes présentes" },
      );
    } catch (e) {
      lignes.push({ service: "Permissions IG", etat: "ok", detail: `non vérifiables (${(e as Error).message.slice(0, 90)})` });
    }
    return lignes;
  }

  // Ancien mode : API Instagram avec connexion Instagram
  if (!env("INSTAGRAM_ACCESS_TOKEN") && !jetonsPresents("instagram")) {
    return [{ service: "Instagram", etat: "absent", detail: actif ? "INSTAGRAM_ACCESS_TOKEN manquant" : "non activé (config/chaine.json > publication.instagram)" }];
  }
  const c = await ig.compte();
  const pro = c.type === "BUSINESS" || c.type === "MEDIA_CREATOR";
  if (!pro) return [{ service: "Instagram", etat: "erreur", detail: `@${c.username} n'est pas un compte professionnel (${c.type ?? "type inconnu"}) : le passer en compte Créateur` }];
  return [verifierHandle(c) ?? { service: "Instagram", etat: "ok", detail: `@${c.username} (compte ${c.type === "BUSINESS" ? "entreprise" : "créateur"}, connexion Instagram)` }];
}

/**
 * @param o.seulement services à contrôler (« elevenlabs », « youtube », « tiktok », « instagram ») ; tous par défaut.
 *   Sert aux workflows : contrôle de la voix avant de lancer l'agent de production.
 */
export async function verifierAcces(o: { seulement?: string[] } = {}): Promise<LigneAcces[]> {
  const lignes: LigneAcces[] = [];
  const voulu = (s: string) => !o.seulement?.length || o.seulement.includes(s);
  const sur = async (service: string, f: () => Promise<LigneAcces | LigneAcces[]>) => {
    try {
      lignes.push(...([] as LigneAcces[]).concat(await f()));
    } catch (e) {
      lignes.push({ service, etat: "erreur", detail: messageErreur(e) });
    }
  };
  if (voulu("elevenlabs")) await sur("ElevenLabs", elevenlabs);
  if (voulu("youtube")) await sur("YouTube", youtube);
  if (voulu("tiktok")) lignes.push(tiktok());
  if (voulu("instagram")) await sur("Instagram", instagram);
  console.table(lignes.map((l) => ({ service: l.service, état: l.etat, détail: l.detail })));
  const ko = lignes.filter((l) => l.etat !== "ok").length;
  log(ko ? "warn" : "ok", "acces", ko ? `${ko} point(s) à compléter (seuls les noms sont affichés, jamais les valeurs)` : "Tous les services sont branchés");
  return lignes;
}
