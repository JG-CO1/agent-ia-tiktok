/**
 * Publication au créneau : pour chaque épisode approuvé dont l'heure est arrivée,
 * envoie sur TikTok et vérifie l'état YouTube. Rien n'est marqué « publié » sans confirmation de l'API.
 */
import path from "node:path";
import { chaine } from "../lib/config";
import { journal, listEpisodes, loadEpisode, readJson, saveEpisode, writeJson } from "../lib/episodes";
import { log } from "../lib/log";
import { DATA_DIR, episodeFile } from "../lib/paths";
import type { Episode } from "../schema/episode";
import fs from "node:fs";
import { closeIssue, commentIssue, gh } from "./github";
import { finalDescription } from "./review";
import * as tt from "./tiktok";
import * as yt from "./youtube";

export interface HistoryEntry {
  id: string;
  date: string;
  titre: string;
  format: string;
  creneau: string;
  sujet: string;
  sources: string[];
  youtube?: { id: string; url: string; statut: string };
  tiktok?: { publish_id: string; mode: string; statut: string; post_id?: string };
}

const HISTORY = path.join(DATA_DIR, "historique.json");
export const readHistory = () => readJson<{ publications: HistoryEntry[] }>(HISTORY) ?? { publications: [] };

function recordHistory(ep: Episode) {
  const h = readHistory();
  const entry: HistoryEntry = {
    id: ep.id,
    date: ep.publication_prevue,
    titre: ep.publication.titre,
    format: ep.format,
    creneau: ep.creneau,
    sujet: ep.sujet,
    sources: ep.sources.map((s) => s.url),
    youtube: ep.diffusion.youtube ? { id: ep.diffusion.youtube.id, url: ep.diffusion.youtube.url, statut: ep.diffusion.youtube.statut } : undefined,
    tiktok: ep.diffusion.tiktok ? { publish_id: ep.diffusion.tiktok.publish_id, mode: ep.diffusion.tiktok.mode, statut: ep.diffusion.tiktok.statut, post_id: ep.diffusion.tiktok.post_id } : undefined,
  };
  h.publications = [...h.publications.filter((p) => p.id !== ep.id), entry].sort((a, b) => a.date.localeCompare(b.date));
  writeJson(HISTORY, h);
}

/** Les MP4 ne sont pas versionnés : on récupère la vidéo finale depuis la Release de sauvegarde si besoin. */
async function ensureVideo(ep: Episode) {
  const file = episodeFile(ep.id, "video.mp4");
  if (fs.existsSync(file)) return file;
  const tag = ep.diffusion.revue?.release;
  if (!tag) throw new Error("vidéo absente localement et aucune Release de sauvegarde");
  const tmp = episodeFile(ep.id, `${ep.id}.mp4`);
  await gh(["release", "download", tag, "--pattern", `${ep.id}.mp4`, "--dir", episodeFile(ep.id, ""), "--clobber"]);
  fs.renameSync(tmp, file);
  return file;
}

async function publishOne(ep: Episode) {
  const c = chaine();
  const notes: string[] = [];
  let complete = true;

  // YouTube : la mise en ligne est faite par YouTube (publishAt) ; on vérifie et on corrige si besoin
  if (c.publication.youtube.actif && ep.diffusion.youtube && ep.diffusion.youtube.statut !== "public") {
    try {
      const v = await yt.getVideo(ep.diffusion.youtube.id);
      if (!v) throw new Error("vidéo introuvable sur YouTube");
      if (v.status.privacyStatus === "public") {
        ep.diffusion.youtube = { ...ep.diffusion.youtube, statut: "public", verifie_le: new Date().toISOString() };
      } else if (Date.now() > new Date(ep.publication_prevue).getTime() + 10 * 60_000) {
        await yt.makePublic(ep.diffusion.youtube.id, false);
        ep.diffusion.youtube = { ...ep.diffusion.youtube, statut: "public", verifie_le: new Date().toISOString() };
        notes.push("YouTube : programmation non appliquée, mise en public manuelle effectuée");
      } else {
        complete = false;
        notes.push(`YouTube : encore ${v.status.privacyStatus} (programmée ${v.status.publishAt ?? "?"})`);
      }
    } catch (e) {
      complete = false;
      ep.diffusion.youtube = { ...ep.diffusion.youtube, statut: "erreur", erreur: (e as Error).message };
      notes.push(`YouTube : ERREUR ${(e as Error).message}`);
    }
  }

  // TikTok : un seul envoi par épisode (anti-doublon)
  if (c.publication.tiktok.actif && !ep.diffusion.tiktok?.publish_id) {
    try {
      const file = await ensureVideo(ep);
      const mode = c.publication.tiktok.mode;
      const publish_id = mode === "direct" ? await tt.directPost(file, finalDescription(ep, "tiktok"), c.publication.tiktok.contenu_ia) : await tt.uploadDraft(file);
      ep.diffusion.tiktok = { publish_id, mode, statut: "ENVOYE" };
      saveEpisode(ep); // on mémorise tout de suite le publish_id : jamais de double envoi
      const st = await tt.waitStatus(publish_id);
      ep.diffusion.tiktok = {
        publish_id,
        mode,
        statut: st.status,
        post_id: st.publicaly_available_post_id?.[0]?.toString(),
        verifie_le: new Date().toISOString(),
        erreur: st.fail_reason,
      };
      if (st.status === "FAILED") {
        complete = false;
        notes.push(`TikTok : ÉCHEC (${st.fail_reason})`);
      } else if (st.status === "SEND_TO_USER_INBOX") {
        notes.push("TikTok : brouillon arrivé dans ta boîte de réception TikTok — ouvre l'app pour publier");
      } else if (st.status === "PUBLISH_COMPLETE") {
        notes.push("TikTok : publié");
      } else {
        notes.push(`TikTok : statut ${st.status} (vérifié à nouveau lors des stats)`);
      }
    } catch (e) {
      complete = false;
      notes.push(`TikTok : ERREUR ${(e as Error).message}`);
      log("erreur", "tiktok", (e as Error).message);
    }
  }

  if (complete) ep.statut = "publie";
  journal(ep, "publication", notes.join(" | ") || "rien à faire");
  saveEpisode(ep);
  recordHistory(ep);
  if (ep.diffusion.revue?.issue) {
    const body = `📣 Publication du ${new Date().toLocaleString("fr-FR", { timeZone: c.fuseau })}\n\n${notes.map((n) => `- ${n}`).join("\n")}${ep.diffusion.youtube ? `\n- YouTube : ${ep.diffusion.youtube.url}` : ""}`;
    await commentIssue(ep.diffusion.revue.issue, body).catch(() => undefined);
    if (complete) await closeIssue(ep.diffusion.revue.issue).catch(() => undefined);
  }
  log(complete ? "ok" : "warn", "publication", `${ep.id} : ${notes.join(" | ")}`);
}

export async function publishDue(opts: { now?: boolean; only?: string } = {}) {
  const ids = opts.only ? [opts.only] : listEpisodes();
  let n = 0;
  for (const id of ids) {
    let ep: Episode;
    try {
      ep = loadEpisode(id);
    } catch {
      continue;
    }
    if (ep.statut !== "programme") continue;
    const due = new Date(ep.publication_prevue).getTime() <= Date.now() + 5 * 60_000;
    if (!due && !opts.now) continue;
    n++;
    await publishOne(ep);
  }
  log("info", "publication", n ? `${n} épisode(s) traité(s)` : "Aucun épisode à publier maintenant");
}
