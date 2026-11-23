/**
 * Collecte des statistiques réelles (jamais estimées) :
 *  - YouTube Analytics API v2 : vues, minutes vues, durée et % moyens de visionnage, likes, commentaires,
 *    partages, abonnés gagnés + courbe de rétention (audienceWatchRatio) ;
 *  - TikTok Display API (video.list) : vues, likes, commentaires, partages (pas de rétention via l'API publique).
 * Sortie : data/stats/derniers.json (+ instantané daté). Une métrique indisponible vaut null.
 */
import path from "node:path";
import { chaine } from "../lib/config";
import { listEpisodes, loadEpisode, readJson, saveEpisode, writeJson } from "../lib/episodes";
import { log } from "../lib/log";
import { DATA_DIR } from "../lib/paths";
import * as ig from "../publish/instagram";
import * as tt from "../publish/tiktok";
import * as yt from "../publish/youtube";
import { readHistory } from "../publish/publish";

export interface EpisodeStats {
  id: string;
  maj: string;
  youtube: null | {
    id: string;
    vues: number | null;
    vues_engagees: number | null;
    minutes_vues: number | null;
    duree_moyenne_s: number | null;
    pourcentage_moyen: number | null;
    likes: number | null;
    commentaires: number | null;
    partages: number | null;
    abonnes_gagnes: number | null;
    /** Part de l'audience encore présente à 3 s, 50 % et 90 % de la vidéo. */
    retention: { a3s: number | null; a50: number | null; a90: number | null } | null;
    note?: string;
  };
  tiktok: null | { id: string; vues: number | null; likes: number | null; commentaires: number | null; partages: number | null; note?: string };
  instagram?: null | ig.StatsReel;
}

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

async function ytReport(params: Record<string, string>) {
  const url = `https://youtubeanalytics.googleapis.com/v2/reports?${new URLSearchParams({ ids: "channel==MINE", ...params })}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${await yt.accessToken()}` } });
  if (!res.ok) throw new Error(`YouTube Analytics ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as { columnHeaders: Array<{ name: string }>; rows?: Array<Array<string | number>> };
}

async function youtubeStats(videoId: string, publishedAt: string, durationS: number): Promise<NonNullable<EpisodeStats["youtube"]>> {
  const start = fmtDate(new Date(publishedAt));
  const end = fmtDate(new Date());
  const out: NonNullable<EpisodeStats["youtube"]> = {
    id: videoId,
    vues: null,
    vues_engagees: null,
    minutes_vues: null,
    duree_moyenne_s: null,
    pourcentage_moyen: null,
    likes: null,
    commentaires: null,
    partages: null,
    abonnes_gagnes: null,
    retention: null,
  };
  try {
    const r = await ytReport({
      startDate: start,
      endDate: end,
      metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained",
      dimensions: "video",
      filters: `video==${videoId}`,
    });
    const row = r.rows?.[0];
    if (row) {
      const col = (n: string) => {
        const i = r.columnHeaders.findIndex((h) => h.name === n);
        return i >= 0 ? Number(row[i]) : null;
      };
      Object.assign(out, {
        vues: col("views"),
        minutes_vues: col("estimatedMinutesWatched"),
        duree_moyenne_s: col("averageViewDuration"),
        pourcentage_moyen: col("averageViewPercentage"),
        likes: col("likes"),
        commentaires: col("comments"),
        partages: col("shares"),
        abonnes_gagnes: col("subscribersGained"),
      });
    } else {
      // Analytics a 24 à 72 h de retard : en attendant, compteurs en temps réel de l'API Data (vues, likes, commentaires).
      const v = await yt.getVideo(videoId).catch(() => null);
      const n = (k: string) => (v?.statistics?.[k] !== undefined ? Number(v.statistics[k]) : null);
      Object.assign(out, { vues: n("viewCount"), likes: n("likeCount"), commentaires: n("commentCount") });
      out.note = "compteurs en temps réel (API Data) ; durée vue, rétention et abonnés : Analytics, sous 24–72 h";
    }
  } catch (e) {
    out.note = (e as Error).message;
  }
  try {
    // Les « vues engagées » (métrique Shorts) ne sont pas disponibles partout : facultatif
    const r = await ytReport({ startDate: start, endDate: end, metrics: "engagedViews", dimensions: "video", filters: `video==${videoId}` });
    out.vues_engagees = r.rows?.[0] ? Number(r.rows[0][1]) : null;
  } catch {
    out.vues_engagees = null;
  }
  try {
    const r = await ytReport({ startDate: start, endDate: end, metrics: "audienceWatchRatio", dimensions: "elapsedVideoTimeRatio", filters: `video==${videoId}` });
    const pts = (r.rows ?? []).map((x) => [Number(x[0]), Number(x[1])] as const);
    if (pts.length) {
      const at = (ratio: number) => {
        let best = pts[0];
        for (const p of pts) if (Math.abs(p[0] - ratio) < Math.abs(best[0] - ratio)) best = p;
        return +best[1].toFixed(3);
      };
      out.retention = { a3s: durationS > 0 ? at(Math.min(1, 3 / durationS)) : null, a50: at(0.5), a90: at(0.9) };
    }
  } catch {
    out.retention = null;
  }
  return out;
}

export async function collectStats() {
  const c = chaine();
  const hist = readHistory().publications;
  const file = path.join(DATA_DIR, "stats", "derniers.json");
  const latest = readJson<{ episodes: Record<string, EpisodeStats> }>(file) ?? { episodes: {} };
  // TikTok : liste des vidéos récentes du compte (pour rapprocher par post_id)
  let ttVideos: tt.TtVideo[] = [];
  if (c.publication.tiktok.actif) {
    try {
      ttVideos = await tt.listVideos(100); // 3 vidéos par jour : 20 ne couvrent qu'une semaine
    } catch (e) {
      log("warn", "stats", `TikTok indisponible : ${(e as Error).message}`);
    }
  }
  // Met à jour les statuts TikTok en attente (brouillons publiés depuis l'app)
  for (const id of listEpisodes()) {
    try {
      const ep = loadEpisode(id);
      const t = ep.diffusion.tiktok;
      if (t && !t.post_id && t.statut !== "FAILED") {
        const st = await tt.publishStatus(t.publish_id);
        ep.diffusion.tiktok = { ...t, statut: st.status, post_id: st.publicaly_available_post_id?.[0]?.toString(), verifie_le: new Date().toISOString() };
        saveEpisode(ep);
      }
    } catch {
      /* statut indisponible : on réessaiera */
    }
  }
  for (const h of hist) {
    if (Date.now() - new Date(h.date).getTime() > 45 * 86400e3) continue; // au-delà, les chiffres bougent peu
    let ep;
    try {
      ep = loadEpisode(h.id);
    } catch {
      continue;
    }
    const voice = readJson<{ duree: number }>(path.join(DATA_DIR, "..", "episodes", h.id, "voix.json"));
    const s: EpisodeStats = { id: h.id, maj: new Date().toISOString(), youtube: null, tiktok: null, instagram: null };
    if (ep.diffusion.youtube?.statut === "public") s.youtube = await youtubeStats(ep.diffusion.youtube.id, h.date, voice?.duree ?? 0);
    const postId = ep.diffusion.tiktok?.post_id;
    if (postId) {
      const v = tt.trouverVideo(ttVideos, postId);
      if (v && v.id !== postId && ep.diffusion.tiktok) {
        // Identifiant enregistré arrondi (avant la lecture exacte des grands entiers) : on garde le vrai.
        ep.diffusion.tiktok = { ...ep.diffusion.tiktok, post_id: v.id };
        saveEpisode(ep);
      }
      s.tiktok = v
        ? { id: v.id, vues: v.view_count ?? null, likes: v.like_count ?? null, commentaires: v.comment_count ?? null, partages: v.share_count ?? null }
        : { id: postId, vues: null, likes: null, commentaires: null, partages: null, note: `vidéo absente des ${ttVideos.length} dernières du compte` };
    }
    const igId = ep.diffusion.instagram?.media_id;
    if (igId) s.instagram = await ig.statsReel(igId);
    latest.episodes[h.id] = s;
  }
  writeJson(file, { maj: new Date().toISOString(), episodes: latest.episodes });
  writeJson(path.join(DATA_DIR, "stats", `${fmtDate(new Date())}.json`), latest.episodes);
  log("ok", "stats", `${Object.keys(latest.episodes).length} épisode(s) suivis`);
}
