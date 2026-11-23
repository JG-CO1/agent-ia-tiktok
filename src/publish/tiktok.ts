/**
 * TikTok Content Posting API (v2).
 *  - mode « brouillon » (scope video.upload) : la vidéo arrive dans la boîte de réception TikTok du créateur,
 *    qui la finalise et la publie depuis l'app. Idéal tant que l'approbation humaine est requise.
 *  - mode « direct » (scope video.publish) : publication directe. Sans audit TikTok, seule la visibilité
 *    SELF_ONLY (privée) est autorisée : il faut l'audit « Direct Post » pour publier en public.
 * Limites documentées : 6 requêtes/min par jeton ; 5 brouillons en attente max sur 24 h.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import { chaine, env } from "../lib/config";
import { chargerJetons, extraireCode, sauverJetons } from "../lib/jetons";
import { FmError, log } from "../lib/log";
import { ecrireEnvLocal } from "../lib/secrets";

const API = "https://open.tiktokapis.com";

interface Tokens {
  access_token: string;
  refresh_token: string;
  open_id: string;
  expires_at: number;
  refresh_expires_at: number;
  scope: string;
}

// ---- jetons chiffrés dans data/jetons/tiktok.json.enc (TikTok peut renouveler le refresh_token) : voir lib/jetons.ts
const saveTokens = (t: Tokens) => void sauverJetons("tiktok", t);
const loadTokens = () => chargerJetons<Tokens>("tiktok");

async function tokenRequest(params: Record<string, string>): Promise<Tokens> {
  const res = await fetch(`${API}/v2/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: env("TIKTOK_CLIENT_KEY", true)!.trim(), client_secret: env("TIKTOK_CLIENT_SECRET", true)!, ...params }),
  });
  const j = (await res.json()) as Record<string, unknown>;
  if (!res.ok || !j.access_token) throw new FmError(`OAuth TikTok refusé : ${JSON.stringify(j).slice(0, 300)}`, "tiktok");
  const now = Date.now();
  return {
    access_token: String(j.access_token),
    refresh_token: String(j.refresh_token),
    open_id: String(j.open_id),
    expires_at: now + Number(j.expires_in ?? 86400) * 1000,
    refresh_expires_at: now + Number(j.refresh_expires_in ?? 31536000) * 1000,
    scope: String(j.scope ?? ""),
  };
}

let current: Tokens | null = null;
export async function accessToken(): Promise<string> {
  if (current && current.expires_at > Date.now() + 120_000) return current.access_token;
  const stored = loadTokens();
  if (stored && stored.expires_at > Date.now() + 120_000) {
    current = stored;
    return stored.access_token;
  }
  const refresh = stored?.refresh_token ?? env("TIKTOK_REFRESH_TOKEN", true)!;
  const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: refresh });
  if (t.refresh_token !== refresh) {
    log("info", "tiktok", "Nouveau refresh_token reçu : sauvegarde dans le magasin chiffré");
    if (process.env.CI !== "true") {
      // En local (essais) : garder .env à jour pour que `fm secrets-github` resynchronise la copie GitHub.
      ecrireEnvLocal("TIKTOK_REFRESH_TOKEN", t.refresh_token);
      log("warn", "tiktok", "TikTok a renouvelé le jeton : .env mis à jour, relancer `npm run fm -- secrets-github TIKTOK_REFRESH_TOKEN`");
    }
  }
  saveTokens(t);
  current = t;
  return t.access_token;
}

/**
 * Les identifiants de vidéo TikTok (19 chiffres) dépassent la précision des nombres JavaScript : lus tels quels,
 * ils sont arrondis (« 7709488525883870000 ») et ne correspondent plus à aucune vidéo. Les entiers de 16 chiffres ou
 * plus sont donc lus comme des chaînes.
 */
export const jsonGrandsEntiers = (texte: string) => JSON.parse(texte.replace(/([:[,]\s*)(-?\d{16,})(?=\s*[,\]}])/g, '$1"$2"'));

async function post<T>(p: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${p}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body),
  });
  const texte = await res.text().catch(() => "");
  let j: { data?: T; error?: { code: string; message: string; log_id?: string } } = {};
  try {
    j = jsonGrandsEntiers(texte);
  } catch {
    /* réponse non JSON : traitée comme une erreur ci-dessous */
  }
  if (!res.ok || (j.error && j.error.code !== "ok")) {
    throw new FmError(`TikTok ${p} -> ${res.status} ${j.error?.code ?? ""} ${j.error?.message ?? ""} (log_id ${j.error?.log_id ?? "?"})`, "tiktok");
  }
  return j.data as T;
}

export interface CreatorInfo {
  creator_username: string;
  creator_nickname: string;
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  max_video_post_duration_sec: number;
}

export const creatorInfo = () => post<CreatorInfo>("/v2/post/publish/creator_info/query/", {});

function sourceInfo(size: number) {
  // ≤ 64 Mo : un seul morceau ; au-delà, morceaux de 10 Mo (le dernier absorbe le reste)
  if (size <= 64 * 1024 * 1024) return { source: "FILE_UPLOAD", video_size: size, chunk_size: size, total_chunk_count: 1 };
  const chunk = 10 * 1024 * 1024;
  return { source: "FILE_UPLOAD", video_size: size, chunk_size: chunk, total_chunk_count: Math.floor(size / chunk) };
}

async function uploadFile(uploadUrl: string, file: string, info: ReturnType<typeof sourceInfo>) {
  const data = fs.readFileSync(file);
  for (let i = 0; i < info.total_chunk_count; i++) {
    const start = i * info.chunk_size;
    const end = i === info.total_chunk_count - 1 ? data.length - 1 : start + info.chunk_size - 1;
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4", "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${data.length}` },
      body: data.subarray(start, end + 1),
    });
    if (!res.ok && res.status !== 206) throw new FmError(`TikTok envoi du morceau ${i + 1} -> ${res.status} ${(await res.text()).slice(0, 200)}`, "tiktok");
  }
}

/** Envoie la vidéo en brouillon (boîte de réception TikTok). */
export async function uploadDraft(file: string): Promise<string> {
  const info = sourceInfo(fs.statSync(file).size);
  const d = await post<{ publish_id: string; upload_url: string }>("/v2/post/publish/inbox/video/init/", { source_info: info });
  await uploadFile(d.upload_url, file, info);
  log("ok", "tiktok", `Brouillon envoyé (publish_id ${d.publish_id})`);
  return d.publish_id;
}

/** Publication directe (nécessite l'audit TikTok pour une visibilité publique). */
export async function directPost(file: string, caption: string, isAigc: boolean): Promise<string> {
  const ci = await creatorInfo();
  const wanted = "PUBLIC_TO_EVERYONE";
  const privacy = ci.privacy_level_options.includes(wanted) ? wanted : ci.privacy_level_options[0];
  if (privacy !== wanted) log("warn", "tiktok", `Visibilité publique non autorisée pour cette app (options : ${ci.privacy_level_options.join(", ")}) -> ${privacy}. Audit TikTok requis.`);
  const info = sourceInfo(fs.statSync(file).size);
  const d = await post<{ publish_id: string; upload_url: string }>("/v2/post/publish/video/init/", {
    post_info: {
      title: caption.slice(0, 2200),
      privacy_level: privacy,
      disable_duet: ci.duet_disabled,
      disable_comment: ci.comment_disabled,
      disable_stitch: ci.stitch_disabled,
      video_cover_timestamp_ms: 1200,
      is_aigc: isAigc,
    },
    source_info: info,
  });
  await uploadFile(d.upload_url, file, info);
  log("ok", "tiktok", `Publication directe lancée (publish_id ${d.publish_id}, ${privacy})`);
  return d.publish_id;
}

export interface PublishStatus {
  status: "PROCESSING_UPLOAD" | "PROCESSING_DOWNLOAD" | "SEND_TO_USER_INBOX" | "PUBLISH_COMPLETE" | "FAILED" | string;
  fail_reason?: string;
  publicaly_available_post_id?: Array<number | string>;
  uploaded_bytes?: number;
}
export const publishStatus = (publish_id: string) => post<PublishStatus>("/v2/post/publish/status/fetch/", { publish_id });

/** Attend un statut final (ou l'arrivée en boîte de réception), sans dépasser la limite de 6 requêtes/min. */
export async function waitStatus(publish_id: string, maxMs = 150_000): Promise<PublishStatus> {
  const t0 = Date.now();
  let last: PublishStatus = { status: "INCONNU" };
  while (Date.now() - t0 < maxMs) {
    await new Promise((r) => setTimeout(r, 11_000));
    last = await publishStatus(publish_id);
    if (["SEND_TO_USER_INBOX", "PUBLISH_COMPLETE", "FAILED"].includes(last.status)) return last;
  }
  return last;
}

export interface TtVideo {
  id: string;
  title?: string;
  create_time?: number;
  duration?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  share_url?: string;
}

/** Statistiques publiques des vidéos du compte (scope video.list), les plus récentes d'abord, par pages de 20. */
export async function listVideos(max = 20): Promise<TtVideo[]> {
  const fields = "id,title,create_time,duration,view_count,like_count,comment_count,share_count,share_url";
  const out: TtVideo[] = [];
  let cursor: number | undefined;
  while (out.length < max) {
    const d = await post<{ videos?: TtVideo[]; cursor?: number; has_more?: boolean }>(`/v2/video/list/?fields=${fields}`, {
      max_count: Math.min(20, max - out.length),
      ...(cursor !== undefined ? { cursor } : {}),
    });
    out.push(...(d.videos ?? []).map((v) => ({ ...v, id: String(v.id) })));
    if (!d.has_more || d.cursor === undefined || !d.videos?.length) break;
    cursor = d.cursor;
  }
  return out;
}

/**
 * Vidéo TikTok correspondant à un identifiant enregistré : égalité exacte, sinon même valeur une fois arrondie
 * (identifiants enregistrés avant la lecture exacte des grands entiers).
 */
export function trouverVideo(videos: TtVideo[], postId: string): TtVideo | undefined {
  return videos.find((v) => v.id === postId) ?? videos.find((v) => Number(v.id) === Number(postId));
}

/**
 * Autorisation initiale. TikTok exige une URL de redirection HTTPS déclarée dans l'app :
 * utiliser la page docs/tiktok-callback.html publiée via GitHub Pages, puis `fm auth tiktok --code <code>`.
 */
/** Scopes demandés : ceux des produits ajoutés à l'app (Login Kit, Display API, Content Posting API). */
export function scopesTikTok(o: { direct?: boolean } = {}): string[] {
  const s = ["user.info.basic", "video.list", "video.upload"]; // profil, statistiques (Display API), brouillons
  if (o.direct || chaine().publication.tiktok.mode === "direct") s.push("video.publish"); // publication directe
  return s;
}

/**
 * Autorisation du compte TikTok de la chaîne, en deux temps : le lien (le code s'affiche ensuite sur la page de
 * retour publiée par GitHub Pages), puis l'échange du code.
 *  - sur son ordinateur : le jeton est écrit dans .env (puis `fm secrets-github`) ;
 *  - dans le workflow « Autorisation » (`stocker`) : le jeton est chiffré dans data/jetons/tiktok.json.enc.
 * Aucune valeur secrète n'est affichée (sauf `afficher`, déconseillé).
 */
export async function authInteractive(o: { code?: string; afficher?: boolean; direct?: boolean; stocker?: boolean; lien?: boolean } = {}) {
  const redirect = env("TIKTOK_REDIRECT_URI", true)!;
  if (!o.code) {
    const state = crypto.randomBytes(8).toString("hex");
    const url = `https://www.tiktok.com/v2/auth/authorize/?${new URLSearchParams({
      client_key: env("TIKTOK_CLIENT_KEY", true)!.trim(),
      response_type: "code",
      scope: scopesTikTok(o).join(","),
      redirect_uri: redirect,
      state,
    })}`;
    if (o.lien) {
      // Texte Markdown pour le résumé du workflow « Autorisation »
      console.log(
        `### Autoriser le compte TikTok de la chaîne

1. Ouvre [ce lien d'autorisation TikTok](${url}) et connecte-toi avec **le compte de la chaîne**.
` +
          `2. La page de retour affiche un code : copie-le.
3. Relance ce workflow (*Run workflow*) avec le service **tiktok** et ce code.
`,
      );
    } else {
      console.log(`
1. Ouvre ce lien (compte TikTok de la chaîne) :

${url}

2. La page de retour affiche la commande à lancer :
   npm run fm -- auth tiktok --code '<CODE>'
`);
    }
    return;
  }
  // Code seul, adresse complète ou commande copiée (apostrophes comprises, ex. sous Windows)
  const code = extraireCode(o.code);
  const t = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirect });
  let ou: string;
  if (o.stocker) {
    if (!sauverJetons("tiktok", t)) throw new FmError("Jetons TikTok obtenus mais non enregistrés : TIKTOK_CLIENT_SECRET (ou FM_CLE_JETONS) manquant", "tiktok");
    ou = "chiffrés dans data/jetons/tiktok.json.enc";
  } else {
    ecrireEnvLocal("TIKTOK_REFRESH_TOKEN", t.refresh_token);
    ou = "enregistrés dans .env (TIKTOK_REFRESH_TOKEN, non affiché) ; envoi sur GitHub : npm run fm -- secrets-github";
  }
  let compte = "";
  try {
    const res = await fetch(`${API}/v2/user/info/?fields=open_id,display_name`, { headers: { Authorization: `Bearer ${t.access_token}` } });
    const j = (await res.json()) as { data?: { user?: { display_name?: string } } };
    compte = j.data?.user?.display_name ?? "";
  } catch {
    /* information facultative */
  }
  const accordes = t.scope.split(",").map((x) => x.trim());
  const manquants = scopesTikTok(o).filter((x) => !accordes.includes(x));
  console.log(
    `
Jetons TikTok obtenus et ${ou}.` +
      (compte ? `
Compte TikTok autorisé : « ${compte} »` : "") +
      `
Scopes accordés : ${t.scope || "?"} — manquants : ${manquants.join(", ") || "aucun"}
`,
  );
  if (o.afficher) console.log(`(--afficher) TIKTOK_REFRESH_TOKEN=${t.refresh_token}
`);
}
