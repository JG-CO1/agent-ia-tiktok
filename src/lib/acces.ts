/**
 * `fm acces` : vérifie que chaque service est branché, sans jamais afficher une valeur secrète.
 * Seuls les NOMS des variables et des informations publiques (offre, nom de voix, nom de chaîne) sont montrés.
 */
import { chaine, env } from "./config";
import { log } from "./log";
import { apiBase } from "../voice/voice";

export interface LigneAcces {
  service: string;
  etat: "ok" | "absent" | "erreur";
  detail: string;
}

const manquants = (noms: string[]) => noms.filter((n) => !env(n));

async function elevenlabs(): Promise<LigneAcces[]> {
  const cle = env("ELEVENLABS_API_KEY");
  if (!cle) return [{ service: "ElevenLabs", etat: "absent", detail: "ELEVENLABS_API_KEY manquant dans .env" }];
  const lignes: LigneAcces[] = [];
  const r = await fetch(`${apiBase()}/v1/user/subscription`, { headers: { "xi-api-key": cle } });
  if (r.ok) {
    const j = (await r.json()) as { tier?: string; character_count?: number; character_limit?: number };
    lignes.push({ service: "ElevenLabs", etat: "ok", detail: `offre « ${j.tier ?? "?"} », ${j.character_count ?? "?"} / ${j.character_limit ?? "?"} crédits utilisés ce mois` });
  } else {
    const t = await r.text();
    const permission = /missing_permissions|permission/i.test(t);
    lignes.push({
      service: "ElevenLabs",
      etat: permission ? "ok" : "erreur",
      detail: permission ? "clé acceptée (sans la permission « User » : offre non lisible, sans conséquence)" : `clé refusée (${r.status})`,
    });
  }
  const voix = env("ELEVENLABS_VOICE_ID") ?? chaine().voix.voice_id;
  if (!voix || voix.startsWith("A_CHOISIR")) {
    lignes.push({ service: "Voix", etat: "absent", detail: "aucune voix choisie (config/chaine.json > voix.voice_id ou ELEVENLABS_VOICE_ID)" });
  } else {
    const v = await fetch(`${apiBase()}/v1/voices/${encodeURIComponent(voix)}`, { headers: { "xi-api-key": cle } });
    const j = v.ok ? ((await v.json()) as { name?: string }) : null;
    lignes.push(j ? { service: "Voix", etat: "ok", detail: `« ${j.name ?? voix} » (${voix})` } : { service: "Voix", etat: "erreur", detail: `voix ${voix} inaccessible avec cette clé (${v.status})` });
  }
  return lignes;
}

async function youtube(): Promise<LigneAcces> {
  const absents = manquants(["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"]);
  if (absents.length) return { service: "YouTube", etat: "absent", detail: `manque dans .env : ${absents.join(", ")}` };
  const { chaineConnectee } = await import("../publish/youtube");
  const c = await chaineConnectee();
  return c
    ? { service: "YouTube", etat: "ok", detail: `chaîne « ${c.titre} »${c.handle ? ` (${c.handle})` : ""}` }
    : { service: "YouTube", etat: "erreur", detail: "jeton valide mais aucune chaîne sur ce compte Google" };
}

function tiktok(): LigneAcces {
  // Pas d'appel en direct : il faudrait renouveler le jeton, ce qui peut invalider la copie gardée sur GitHub.
  const absents = manquants(["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REDIRECT_URI", "TIKTOK_REFRESH_TOKEN"]);
  return absents.length
    ? { service: "TikTok", etat: "absent", detail: `manque dans .env : ${absents.join(", ")}` }
    : { service: "TikTok", etat: "ok", detail: "configuré (compte vérifié lors de `fm auth tiktok --code`)" };
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
  lignes.push(
    env("FM_CLE_JETONS")
      ? { service: "Chiffrement", etat: "ok", detail: "FM_CLE_JETONS présent" }
      : { service: "Chiffrement", etat: "absent", detail: "FM_CLE_JETONS manquant : npm run fm -- secret-aleatoire FM_CLE_JETONS" },
  );
  console.table(lignes.map((l) => ({ service: l.service, état: l.etat, détail: l.detail })));
  const ko = lignes.filter((l) => l.etat !== "ok").length;
  log(ko ? "warn" : "ok", "acces", ko ? `${ko} point(s) à compléter (seuls les noms sont affichés, jamais les valeurs)` : "Tous les services sont branchés");
  return lignes;
}
