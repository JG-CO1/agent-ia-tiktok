/**
 * Instagram Reels — API Instagram avec connexion Instagram (graph.instagram.com).
 *
 * Prérequis (docs/INSTALLATION.md) : compte Instagram professionnel (Créateur ou Entreprise) ; app Meta avec le
 * produit Instagram (« API setup with Instagram login ») et les permissions instagram_business_basic,
 * instagram_business_content_publish (+ instagram_business_manage_insights pour les statistiques) ; jeton longue
 * durée du compte dans le secret INSTAGRAM_ACCESS_TOKEN.
 *
 * Publication d'un Reel (doc Meta « Content Publishing ») : conteneur POST /<IG_ID>/media (media_type=REELS,
 * video_url PUBLIQUE), attente du statut FINISHED, puis POST /<IG_ID>/media_publish. La vidéo est servie par la
 * Release GitHub du dépôt public. Jamais de double publication : le conteneur est mémorisé avant de publier.
 * Le jeton (60 jours) est renouvelé au-delà de 7 jours d'âge et gardé chiffré dans data/jetons/instagram.json.enc.
 */
import { env } from "../lib/config";
import { chargerJetons, sauverJetons } from "../lib/jetons";
import { FmError, log } from "../lib/log";

const base = () => (process.env.INSTAGRAM_API_BASE || "https://graph.instagram.com").replace(/\/$/, "");
const SEPT_JOURS = 7 * 86400e3;

interface JetonStocke {
  access_token: string;
  obtenu_le: string;
  expire_le?: string;
}

let courant: string | null = null;

/** Jeton d'accès : celui du magasin chiffré (renouvelé) ou, à défaut, le secret INSTAGRAM_ACCESS_TOKEN. */
export async function jeton(): Promise<string> {
  if (courant) return courant;
  const stocke = chargerJetons<JetonStocke>("instagram");
  let t = stocke?.access_token ?? env("INSTAGRAM_ACCESS_TOKEN", true)!;
  const age = stocke ? Date.now() - Date.parse(stocke.obtenu_le) : Infinity;
  if (age > SEPT_JOURS) {
    // Renouvellement : possible seulement pour un jeton d'au moins 24 h et non expiré ; sinon on garde l'actuel.
    try {
      const r = await fetch(`${base()}/refresh_access_token?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token: t })}`);
      const j = (await r.json()) as { access_token?: string; expires_in?: number; error?: { message?: string } };
      if (r.ok && j.access_token) {
        t = j.access_token;
        const maintenant = Date.now();
        sauverJetons("instagram", { access_token: t, obtenu_le: new Date(maintenant).toISOString(), expire_le: j.expires_in ? new Date(maintenant + j.expires_in * 1000).toISOString() : undefined });
        log("info", "instagram", "Jeton renouvelé (chiffré dans data/jetons/instagram.json.enc)");
      } else {
        log("warn", "instagram", `Renouvellement du jeton refusé (${r.status}) : ${j.error?.message ?? "?"} — jeton actuel conservé`);
      }
    } catch (e) {
      log("warn", "instagram", `Renouvellement du jeton impossible : ${(e as Error).message}`);
    }
  }
  courant = t;
  return t;
}

async function appel<T>(chemin: string, o: { methode?: "GET" | "POST"; params?: Record<string, string> } = {}): Promise<T> {
  const params = new URLSearchParams({ ...(o.params ?? {}), access_token: await jeton() });
  const methode = o.methode ?? "GET";
  const url = `${base()}${chemin}${methode === "GET" ? `?${params}` : ""}`;
  const res = await fetch(url, methode === "POST" ? { method: "POST", body: params } : undefined);
  const j = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; code?: number; error_user_msg?: string } };
  if (!res.ok || j.error) {
    throw new FmError(`Instagram ${chemin.split("?")[0]} -> ${res.status} ${j.error?.error_user_msg ?? j.error?.message ?? ""}`.trim(), "instagram");
  }
  return j;
}

export interface CompteInstagram {
  id: string;
  username: string;
  type?: string;
}

/** Compte connecté (vérifie qu'on publie au bon endroit et que c'est un compte professionnel). */
export async function compte(): Promise<CompteInstagram> {
  const j = await appel<{ user_id?: string; id?: string; username: string; account_type?: string }>("/me", { params: { fields: "user_id,username,account_type" } });
  return { id: j.user_id ?? j.id ?? "", username: j.username, type: j.account_type };
}

export type EtatConteneur = "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED";

export async function etatConteneur(id: string): Promise<{ code: EtatConteneur; detail?: string }> {
  const j = await appel<{ status_code: EtatConteneur; status?: string }>(`/${id}`, { params: { fields: "status_code,status" } });
  return { code: j.status_code, detail: j.status };
}

/** Crée le conteneur d'un Reel à partir d'une vidéo accessible publiquement. */
export async function creerConteneur(videoUrl: string, legende: string, o: { partagerFil?: boolean } = {}): Promise<string> {
  const ig = await compte();
  const j = await appel<{ id: string }>(`/${ig.id}/media`, {
    methode: "POST",
    params: { media_type: "REELS", video_url: videoUrl, caption: legende, share_to_feed: String(o.partagerFil ?? true) },
  });
  return j.id;
}

/** Attend que le conteneur soit prêt (Instagram télécharge et traite la vidéo). */
export async function attendreConteneur(id: string, maxMs = 10 * 60_000, pasMs = 10_000): Promise<EtatConteneur> {
  const fin = Date.now() + maxMs;
  for (;;) {
    const e = await etatConteneur(id);
    if (e.code !== "IN_PROGRESS") {
      if (e.code === "ERROR" || e.code === "EXPIRED") throw new FmError(`Conteneur Instagram ${id} : ${e.code} ${e.detail ?? ""}`.trim(), "instagram");
      return e.code;
    }
    if (Date.now() > fin) throw new FmError(`Conteneur Instagram ${id} toujours en traitement après ${Math.round(maxMs / 60_000)} min`, "instagram");
    await new Promise((r) => setTimeout(r, pasMs));
  }
}

/** Publie un conteneur prêt ; renvoie l'identifiant et le lien public du Reel. */
export async function publierConteneur(id: string): Promise<{ id: string; permalien?: string }> {
  const ig = await compte();
  const j = await appel<{ id: string }>(`/${ig.id}/media_publish`, { methode: "POST", params: { creation_id: id } });
  const m = await appel<{ permalink?: string }>(`/${j.id}`, { params: { fields: "permalink,media_product_type" } }).catch(() => ({ permalink: undefined }));
  return { id: j.id, permalien: m.permalink };
}

export interface StatsReel {
  id: string;
  vues: number | null;
  couverture: number | null;
  likes: number | null;
  commentaires: number | null;
  partages: number | null;
  enregistrements: number | null;
  note?: string;
}

/** Statistiques d'un Reel (insights si la permission est accordée, sinon compteurs publics du média). */
export async function statsReel(mediaId: string): Promise<StatsReel> {
  const vide: StatsReel = { id: mediaId, vues: null, couverture: null, likes: null, commentaires: null, partages: null, enregistrements: null };
  try {
    const j = await appel<{ data: Array<{ name: string; values?: Array<{ value: number }>; total_value?: { value: number } }> }>(`/${mediaId}/insights`, {
      params: { metric: "views,reach,likes,comments,shares,saved" },
    });
    const v = (n: string) => {
      const m = j.data.find((x) => x.name === n);
      return m?.total_value?.value ?? m?.values?.[0]?.value ?? null;
    };
    return { id: mediaId, vues: v("views"), couverture: v("reach"), likes: v("likes"), commentaires: v("comments"), partages: v("shares"), enregistrements: v("saved") };
  } catch (e) {
    try {
      const m = await appel<{ like_count?: number; comments_count?: number }>(`/${mediaId}`, { params: { fields: "like_count,comments_count" } });
      return { ...vide, likes: m.like_count ?? null, commentaires: m.comments_count ?? null, note: `insights indisponibles : ${(e as Error).message.slice(0, 120)}` };
    } catch (e2) {
      return { ...vide, note: (e2 as Error).message.slice(0, 160) };
    }
  }
}
