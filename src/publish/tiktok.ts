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
import path from "node:path";
import { env } from "../lib/config";
import { FmError, log } from "../lib/log";
import { DATA_DIR } from "../lib/paths";

const API = "https://open.tiktokapis.com";
const STORE = path.join(DATA_DIR, "jetons", "tiktok.json.enc");

interface Tokens {
  access_token: string;
  refresh_token: string;
  open_id: string;
  expires_at: number;
  refresh_expires_at: number;
  scope: string;
}

// ---- magasin de jetons chiffré (AES-256-GCM, clé FM_CLE_JETONS) : TikTok peut renouveler le refresh_token
function key(): Buffer | null {
  const k = env("FM_CLE_JETONS");
  return k ? crypto.scryptSync(k, "studio-fantome", 32) : null;
}
function saveTokens(t: Tokens) {
  const k = key();
  if (!k) {
    log("warn", "tiktok", "FM_CLE_JETONS absent : le nouveau refresh_token n'est pas sauvegardé (le mettre à jour à la main si TikTok l'a changé).");
    return;
  }
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([c.update(JSON.stringify(t), "utf8"), c.final()]);
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64"));
}
function loadTokens(): Tokens | null {
  const k = key();
  if (!k || !fs.existsSync(STORE)) return null;
  const raw = Buffer.from(fs.readFileSync(STORE, "utf8"), "base64");
  const d = crypto.createDecipheriv("aes-256-gcm", k, raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8")) as Tokens;
}

async function tokenRequest(params: Record<string, string>): Promise<Tokens> {
  const res = await fetch(`${API}/v2/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: env("TIKTOK_CLIENT_KEY", true)!, client_secret: env("TIKTOK_CLIENT_SECRET", true)!, ...params }),
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
  if (t.refresh_token !== refresh) log("info", "tiktok", "Nouveau refresh_token reçu : sauvegarde dans le magasin chiffré");
  saveTokens(t);
  current = t;
  return t.access_token;
}

async function post<T>(p: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${p}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body),
  });
  const j = (await res.json().catch(() => ({}))) as { data?: T; error?: { code: string; message: string; log_id?: string } };
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

/** Statistiques publiques des vidéos du compte (scope video.list). */
export async function listVideos(max = 20): Promise<TtVideo[]> {
  const fields = "id,title,create_time,duration,view_count,like_count,comment_count,share_count,share_url";
  const d = await post<{ videos: TtVideo[] }>(`/v2/video/list/?fields=${fields}`, { max_count: Math.min(20, max) });
  return d.videos ?? [];
}

/**
 * Autorisation initiale. TikTok exige une URL de redirection HTTPS déclarée dans l'app :
 * utiliser la page docs/tiktok-callback.html publiée via GitHub Pages, puis `fm auth tiktok --code <code>`.
 */
export async function authInteractive() {
  const code = process.argv.find((a, i) => process.argv[i - 1] === "--code");
  const redirect = env("TIKTOK_REDIRECT_URI", true)!;
  if (!code) {
    const state = crypto.randomBytes(8).toString("hex");
    const url = `https://www.tiktok.com/v2/auth/authorize/?${new URLSearchParams({
      client_key: env("TIKTOK_CLIENT_KEY", true)!,
      response_type: "code",
      scope: "user.info.basic,video.upload,video.publish,video.list",
      redirect_uri: redirect,
      state,
    })}`;
    console.log(`\n1. Ouvre ce lien (compte TikTok de la chaîne) :\n\n${url}\n\n2. Copie le code affiché sur la page de retour, puis :\n   npm run fm -- auth tiktok --code <CODE>\n`);
    return;
  }
  const t = await tokenRequest({ grant_type: "authorization_code", code: decodeURIComponent(code), redirect_uri: redirect });
  saveTokens(t);
  console.log(`\nJetons obtenus (scopes : ${t.scope}).\nEnregistre ce secret TIKTOK_REFRESH_TOKEN (valable ~1 an) :\n\n${t.refresh_token}\n`);
}
