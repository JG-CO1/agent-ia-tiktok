/**
 * YouTube Data API v3 (OAuth 2.0) : envoi « reprise possible », programmation (publishAt), état, suppression.
 * Les Shorts sont des vidéos verticales classiques (≤ 3 min) : aucun endpoint spécial n'est nécessaire.
 * Quota par défaut (révision du 1er juin 2026) : 100 appels videos.insert / jour + 10 000 unités pour le reste.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import { env } from "../lib/config";
import { chargerJetons, extraireCode, sauverJetons } from "../lib/jetons";
import { FmError, log } from "../lib/log";
import { ecrireEnvLocal } from "../lib/secrets";

const SCOPES = ["https://www.googleapis.com/auth/youtube", "https://www.googleapis.com/auth/yt-analytics.readonly"];
const REDIRECT = "http://127.0.0.1:8765";

let cached: { token: string; exp: number } | null = null;

/** Jeton de rafraîchissement : secret YOUTUBE_REFRESH_TOKEN, sinon celui chiffré par le workflow « Autorisation ». */
export function refreshToken(): string | null {
  return env("YOUTUBE_REFRESH_TOKEN") ?? chargerJetons<{ refresh_token: string }>("youtube")?.refresh_token ?? null;
}

/** Jeton d'accès à partir du jeton de rafraîchissement. */
export async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const refresh = refreshToken();
  if (!refresh) throw new FmError("Pas de jeton YouTube : lancer le workflow « Autorisation » (service youtube) ou `fm auth youtube`", "youtube");
  const body = new URLSearchParams({
    client_id: env("YOUTUBE_CLIENT_ID", true)!,
    client_secret: env("YOUTUBE_CLIENT_SECRET", true)!,
    refresh_token: refresh,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body });
  const j = (await res.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !j.access_token) {
    throw new FmError(
      `OAuth YouTube refusé (${j.error}: ${j.error_description}). Si « invalid_grant » : le jeton a expiré (app OAuth en mode « Test » = 7 jours) -> passer l'app en production puis refaire l'autorisation (workflow « Autorisation » ou \`fm auth youtube\`).`,
      "youtube",
    );
  }
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

/** Retire le champ facultatif containsSyntheticMedia si l'API le refuse (compatibilité). */
function withoutSynthetic(body: unknown): unknown {
  const b = JSON.parse(JSON.stringify(body)) as { status?: Record<string, unknown> };
  if (b.status) delete b.status.containsSyntheticMedia;
  return b;
}

async function api<T>(method: string, url: string, body?: unknown): Promise<T> {
  const send = async (b: unknown) =>
    fetch(url, {
      method,
      headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
      body: b ? JSON.stringify(b) : undefined,
    });
  let res = await send(body);
  let text = await res.text();
  if (res.status === 400 && body && text.includes("containsSyntheticMedia")) {
    res = await send(withoutSynthetic(body));
    text = await res.text();
  }
  if (!res.ok) throw new FmError(`YouTube ${method} ${url.split("?")[0]} -> ${res.status} ${text.slice(0, 400)}`, "youtube");
  return (text ? JSON.parse(text) : {}) as T;
}

export interface YtMeta {
  titre: string;
  description: string;
  tags: string[];
  categorie: string;
  syntheticMedia: boolean;
}

/** Envoi en mode « resumable » : en cas de coupure, on reprend à l'octet près (jusqu'à 5 tentatives). */
export async function uploadPrivate(file: string, meta: YtMeta): Promise<{ id: string; url: string }> {
  const size = fs.statSync(file).size;
  const meta0 = {
    snippet: { title: meta.titre, description: meta.description, tags: meta.tags, categoryId: meta.categorie, defaultLanguage: "fr", defaultAudioLanguage: "fr" },
    status: { privacyStatus: "private", selfDeclaredMadeForKids: false, embeddable: true, containsSyntheticMedia: meta.syntheticMedia },
  };
  const start = async (b: unknown) =>
    fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await accessToken()}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(size),
      },
      body: JSON.stringify(b),
    });
  let init = await start(meta0);
  if (init.status === 400) {
    const t = await init.text();
    if (!t.includes("containsSyntheticMedia")) throw new FmError(`YouTube init upload -> 400 ${t.slice(0, 400)}`, "youtube");
    init = await start(withoutSynthetic(meta0));
  }
  if (!init.ok) throw new FmError(`YouTube init upload -> ${init.status} ${(await init.text()).slice(0, 400)}`, "youtube");
  const uploadUrl = init.headers.get("location");
  if (!uploadUrl) throw new FmError("YouTube : pas d'URL d'envoi", "youtube");
  const data = fs.readFileSync(file);
  let offset = 0;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${await accessToken()}`,
          "Content-Type": "video/mp4",
          "Content-Length": String(size - offset),
          ...(offset > 0 ? { "Content-Range": `bytes ${offset}-${size - 1}/${size}` } : {}),
        },
        body: data.subarray(offset),
      });
      if (res.status === 200 || res.status === 201) {
        const v = (await res.json()) as { id: string; status?: { uploadStatus?: string } };
        log("ok", "youtube", `Vidéo envoyée (privée) : ${v.id} [${v.status?.uploadStatus}]`);
        return { id: v.id, url: `https://youtube.com/shorts/${v.id}` };
      }
      if (res.status < 500 && res.status !== 308) throw new FmError(`YouTube upload -> ${res.status} ${(await res.text()).slice(0, 300)}`, "youtube");
    } catch (e) {
      if (e instanceof FmError) throw e;
      log("warn", "youtube", `Coupure pendant l'envoi (${(e as Error).message}), reprise…`);
    }
    // Demande où en est l'envoi, puis reprend
    const st = await fetch(uploadUrl, { method: "PUT", headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Range": `bytes */${size}` } });
    const range = st.headers.get("range");
    offset = range ? Number(range.split("-")[1]) + 1 : 0;
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  throw new FmError("YouTube : envoi impossible après 5 tentatives", "youtube");
}

interface YtVideo {
  id: string;
  status: { privacyStatus: string; uploadStatus: string; publishAt?: string; rejectionReason?: string; failureReason?: string };
  statistics?: Record<string, string>;
}

export async function getVideo(id: string): Promise<YtVideo | null> {
  const r = await api<{ items: YtVideo[] }>("GET", `https://www.googleapis.com/youtube/v3/videos?part=status,statistics&id=${id}`);
  return r.items[0] ?? null;
}

/** Programme la mise en ligne publique à `publishAt` (la vidéo reste privée d'ici là). */
export async function schedule(id: string, publishAt: string, syntheticMedia: boolean) {
  await api("PUT", "https://www.googleapis.com/youtube/v3/videos?part=status", {
    id,
    status: { privacyStatus: "private", publishAt: new Date(publishAt).toISOString(), selfDeclaredMadeForKids: false, embeddable: true, containsSyntheticMedia: syntheticMedia },
  });
  const v = await getVideo(id);
  if (!v?.status.publishAt) throw new FmError(`YouTube : la programmation n'a pas été prise en compte pour ${id}`, "youtube");
  log("ok", "youtube", `${id} programmée pour ${v.status.publishAt}`);
  return v.status.publishAt;
}

export async function makePublic(id: string, syntheticMedia: boolean) {
  await api("PUT", "https://www.googleapis.com/youtube/v3/videos?part=status", {
    id,
    status: { privacyStatus: "public", selfDeclaredMadeForKids: false, embeddable: true, containsSyntheticMedia: syntheticMedia },
  });
  const v = await getVideo(id);
  if (v?.status.privacyStatus !== "public") throw new FmError(`YouTube : ${id} n'est pas publique après mise à jour (${v?.status.privacyStatus})`, "youtube");
  return v;
}

export async function remove(id: string) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${await accessToken()}` } });
  if (!res.ok && res.status !== 404) throw new FmError(`YouTube suppression ${id} -> ${res.status}`, "youtube");
}

export interface ChaineYouTube {
  id: string;
  titre: string;
  handle?: string;
}

/** La chaîne à laquelle donne accès un jeton (pour vérifier qu'on a autorisé le BON compte). */
export async function chaineConnectee(jeton?: string): Promise<ChaineYouTube | null> {
  const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${jeton ?? (await accessToken())}` },
  });
  if (!res.ok) throw new FmError(`YouTube channels.list -> ${res.status} ${(await res.text()).slice(0, 200)}`, "youtube");
  const j = (await res.json()) as { items?: Array<{ id: string; snippet: { title: string; customUrl?: string } }> };
  const c = j.items?.[0];
  return c ? { id: c.id, titre: c.snippet.title, handle: c.snippet.customUrl } : null;
}

function lienAutorisation(state: string): string {
  return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: env("YOUTUBE_CLIENT_ID", true)!,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  })}`;
}

/** Échange un code d'autorisation contre les jetons, puis les enregistre (chiffrés ou dans .env) sans les afficher. */
async function echangerCode(code: string, o: { stocker?: boolean; afficher?: boolean }) {
  const body = new URLSearchParams({ code, client_id: env("YOUTUBE_CLIENT_ID", true)!, client_secret: env("YOUTUBE_CLIENT_SECRET", true)!, redirect_uri: REDIRECT, grant_type: "authorization_code" });
  const t = (await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", body })).json()) as {
    refresh_token?: string;
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!t.refresh_token || !t.access_token) {
    throw new FmError(`Échange du code refusé par Google : ${t.error ?? "pas de jeton"} ${t.error_description ?? ""} (un code ne sert qu'une fois et expire vite : refaire l'autorisation)`, "youtube");
  }
  let ou: string;
  if (o.stocker) {
    if (!sauverJetons("youtube", { refresh_token: t.refresh_token, obtenu_le: new Date().toISOString() })) throw new FmError("Jeton obtenu mais non enregistré : YOUTUBE_CLIENT_SECRET manquant", "youtube");
    ou = "chiffré dans data/jetons/youtube.json.enc";
  } else {
    ecrireEnvLocal("YOUTUBE_REFRESH_TOKEN", t.refresh_token);
    ou = "enregistré dans .env (YOUTUBE_REFRESH_TOKEN, non affiché) ; envoi sur GitHub : npm run fm -- secrets-github";
  }
  let chaine: ChaineYouTube | null = null;
  try {
    chaine = await chaineConnectee(t.access_token);
  } catch (e) {
    log("warn", "youtube", `Jeton obtenu mais chaîne non lue : ${(e as Error).message}`);
  }
  console.log(
    `
Jeton YouTube obtenu et ${ou}.` +
      (chaine ? `
Chaîne autorisée : « ${chaine.titre} »${chaine.handle ? ` (${chaine.handle})` : ""} — id ${chaine.id}` : "\n⚠️ Aucune chaîne YouTube sur ce compte : en créer une, puis recommencer.") +
      "\n",
  );
  if (o.afficher) console.log(`(--afficher) YOUTUBE_REFRESH_TOKEN=${t.refresh_token}\n`);
}

/**
 * Autorisation de la chaîne YouTube. Trois façons :
 *  - `lien` (workflow « Autorisation », rien à installer) : affiche le lien ; après accord, le navigateur part vers
 *    http://127.0.0.1:8765/?code=… qui ne s'ouvre pas : c'est normal, on copie cette adresse ;
 *  - `code` : échange ce code (ou l'adresse complète copiée) ; avec `stocker`, jeton chiffré dans le dépôt ;
 *  - sans option, sur son ordinateur : petit serveur local qui reçoit le retour directement (jeton dans .env).
 */
export function authInteractive(o: { afficher?: boolean; lien?: boolean; code?: string; stocker?: boolean } = {}): Promise<void> {
  if (o.code) return echangerCode(extraireCode(o.code), o);
  const state = crypto.randomBytes(12).toString("hex");
  if (o.lien) {
    console.log(
      `### Autoriser la chaîne YouTube\n\n1. Ouvre [ce lien d'autorisation Google](${lienAutorisation(state)}) avec **le compte de la chaîne** ` +
        `(« application non validée » : *Paramètres avancés* → *Accéder à Studio Fantôme*), puis autorise.\n` +
        `2. Le navigateur part ensuite vers une adresse \`http://127.0.0.1:8765/?state=…&code=…\` qui **ne s'ouvre pas : c'est normal**. ` +
        `Copie cette adresse entière depuis la barre d'adresse.\n3. Relance ce workflow (*Run workflow*) avec le service **youtube** et colle l'adresse dans « code ».\n`,
    );
    return Promise.resolve();
  }
  console.log(`\n1. Ouvre ce lien dans ton navigateur et autorise la chaîne YouTube :\n\n${lienAutorisation(state)}\n\n2. Attente du retour sur ${REDIRECT} …`);
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const q = new URL(req.url ?? "/", REDIRECT).searchParams;
      const fin = (page: string, erreur?: string) => {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!doctype html><meta charset="utf-8"><p style="font:18px system-ui;margin:40px">${page}</p>`);
        server.close();
      };
      if (!q.get("code") && !q.get("error")) return void res.end(); // favicon, etc.
      if (q.get("state") !== state) {
        fin("Réponse refusée (paramètre state inattendu).");
        return reject(new FmError("Retour OAuth refusé : state inattendu", "youtube"));
      }
      if (q.get("error")) {
        fin(`Autorisation refusée : ${q.get("error")}`);
        return reject(new FmError(`Autorisation refusée par Google : ${q.get("error")}`, "youtube"));
      }
      try {
        await echangerCode(q.get("code")!, o);
        fin("C'est bon ! Tu peux fermer cet onglet.");
        resolve();
      } catch (e) {
        fin(`Erreur : ${(e as Error).message}`);
        reject(e);
      }
    });
    server.on("error", (e) => reject(new FmError(`Port 8765 indisponible : ${(e as Error).message}`, "youtube")));
    server.listen(8765, "127.0.0.1");
  });
}
