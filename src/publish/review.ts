/**
 * Circuit d'approbation : envoi en revue (YouTube privé + sauvegarde + issue GitHub), approbation, rejet.
 * En mode « autonome » (config/chaine.json), la production enchaîne revue + approbation si le QC est publiable.
 */
import fs from "node:fs";
import { chaine } from "../lib/config";
import { heurePlateforme } from "./schedule";
import { journal, readJson, saveEpisode } from "../lib/episodes";
import { FmError, log } from "../lib/log";
import { episodeFile } from "../lib/paths";
import type { QcReport } from "../qc/qc";
import type { VoiceTiming } from "../core/timeline";
import type { Episode } from "../schema/episode";
import { backupToRelease, closeIssue, commentIssue, createIssue, editLabels, ensureLabel, gh } from "./github";
import * as yt from "./youtube";

/** Hashtag selon le format : l'intention que cherche le spectateur (astuce, business, actu). */
const TAG_FORMAT: Record<string, string> = { decouverte: "#astuce", business: "#business", actu: "#actu", tutoriel: "#tutoriel" };
/** Tag de découverte des vidéos éducatives en français sur TikTok. */
const TAG_DECOUVERTE_TIKTOK = "#apprendresurtiktok";

const normTag = (t: string) =>
  `#${t
    .replace(/^#+/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}_]/gu, "")
    .toLowerCase()}`;

/**
 * Hashtags par plateforme, 5 au plus (au-delà, ils diluent plus qu'ils n'aident) : les 2 de la chaîne
 * (`hashtags_base`), celui du format, puis les plus précis du sujet (ordre de `publication.hashtags`) ; sur TikTok,
 * un tag de découverte éducative à la place du 2e tag de sujet. YouTube ajoute #Shorts à part.
 */
export function hashtagsPour(ep: Episode, plateforme: "youtube" | "tiktok" | "instagram"): string[] {
  const c = chaine();
  const fixes = [...c.hashtags_base.map(normTag), TAG_FORMAT[ep.format] ?? "#astuce"];
  const generiques = new Set([...fixes, "#claude", "#ia", "#ai", "#claudeai", "#shorts", "#actu", "#astuce", "#business", "#tutoriel", TAG_DECOUVERTE_TIKTOK]);
  const sujet = [...new Set(ep.publication.hashtags.map(normTag))].filter((t) => t.length > 2 && !generiques.has(t));
  const out = plateforme === "tiktok" ? [...fixes, ...sujet.slice(0, 1), TAG_DECOUVERTE_TIKTOK] : [...fixes, ...sujet.slice(0, 2)];
  return [...new Set(out)].slice(0, 5);
}

/** Description finale (ajoute toujours la mention d'indépendance et les sources). */
export function finalDescription(ep: Episode, platform: "youtube" | "tiktok" | "instagram"): string {
  const c = chaine();
  const base = platform === "youtube" ? ep.publication.description_youtube : ep.publication.description_tiktok;
  const tags = hashtagsPour(ep, platform).join(" ");
  // TikTok et Instagram : la même description (texte, mention d'indépendance, hashtags de la plateforme) ; 2 200
  // caractères au plus, et pas de sources car les liens n'y sont pas cliquables. Sur TikTok, un brouillon ne peut pas
  // la recevoir par l'API : elle est publiée sur la page docs/legendes.html, à copier au moment de publier.
  if (platform !== "youtube") return `${base}\n\n${c.mention_independance}\n\n${tags}`.slice(0, 2200);
  const sources = ep.sources.map((s) => `• ${s.titre} : ${s.url}`).join("\n");
  return `${base}\n\nSources :\n${sources}\n\n${c.mention_independance}\n\n${tags} #Shorts`.slice(0, 4900);
}

function formatSlot(iso: string) {
  const c = chaine();
  return new Date(iso).toLocaleString("fr-FR", { timeZone: c.fuseau, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

function reviewBody(ep: Episode, previewUrl: string, fileUrl: string, qc: QcReport, voice: VoiceTiming | null) {
  const claims = ep.affirmations
    .map((a) => {
      const s = ep.sources.find((x) => x.id === a.source);
      const icon = a.statut === "verifiee" ? "✅" : a.statut === "rejetee" ? "❌" : "⚠️";
      return `| ${icon} | ${a.texte.replace(/\|/g, "/")} | [${s?.titre ?? a.source}](${s?.url}) | « ${a.citation.slice(0, 140).replace(/\|/g, "/")} » |`;
    })
    .join("\n");
  const script = ep.scenes.map((s) => `**${s.id}** (${s.type}) — ${s.voix.replace(/\*/g, "**")}`).join("\n\n");
  const checks = qc.checks
    .filter((c) => c.nom !== "remarque")
    .map((c) => `${c.ok ? "✅" : c.bloquant ? "❌" : "⚠️"} \`${c.nom}\` — ${c.detail}`)
    .join("\n");
  return `## 🎬 À valider : ${ep.publication.titre}

**Créneau :** ${formatSlot(ep.publication_prevue)} · **Format :** ${ep.format} · **Durée :** ${voice ? voice.duree.toFixed(0) + " s" : "?"} · **Épisode :** \`${ep.id}\`

▶️ **Aperçu (YouTube, privé)** : ${previewUrl}
💾 **Fichier vidéo** : ${fileUrl}

### Sujet et angle
${ep.sujet}
> ${ep.angle}

### Accroche (2 premières secondes)
> ${ep.accroche}

### Script
${script}

### Affirmations et preuves
| | Affirmation | Source | Citation exacte |
|---|---|---|---|
${claims || "| | (aucune) | | |"}

### Contrôle qualité (${qc.publiable ? "publiable" : "NON publiable"})
${checks}
${qc.revue_visuelle.note ? `\nRevue visuelle : ${qc.revue_visuelle.statut} — ${qc.revue_visuelle.note}` : ""}

### Textes de publication
**Titre :** ${ep.publication.titre}

**Description TikTok :**
\`\`\`
${finalDescription(ep, "tiktok")}
\`\`\`
${ep.publication.commentaire_epingle ? `\n**Commentaire à épingler :**\n\`\`\`\n${ep.publication.commentaire_epingle}\n\`\`\`\n` : ""}
<details><summary>Description YouTube</summary>

\`\`\`
${finalDescription(ep, "youtube")}
\`\`\`
</details>

---
**Pour décider, réponds en commentaire :**
- \`/approuver\` → programmé pour le ${formatSlot(ep.publication_prevue)} (YouTube + TikTok)
- \`/rejeter <raison>\` → annulé (la copie privée YouTube est supprimée)
- \`/corriger <instructions>\` → l'agent corrige puis renvoie une nouvelle version
`;
}

export async function sendToReview(ep: Episode, opts: { remplacer?: boolean } = {}) {
  const c = chaine();
  const qc = readJson<QcReport>(episodeFile(ep.id, "qc.json"));
  if (!qc?.publiable) throw new FmError("Le contrôle qualité n'est pas « publiable » : impossible d'envoyer en revue.", "revue");
  if (ep.diffusion.revue?.issue && !opts.remplacer) throw new FmError(`Déjà en revue (issue #${ep.diffusion.revue.issue})`, "revue");
  if (opts.remplacer) {
    // Nouvelle version après correction : on retire l'ancienne copie privée et on ferme l'ancienne revue
    const old = ep.diffusion.revue?.issue;
    if (ep.diffusion.youtube && ep.diffusion.youtube.statut !== "public") await yt.remove(ep.diffusion.youtube.id).catch(() => undefined);
    ep.diffusion = {};
    if (old) await closeIssue(old, "♻️ Remplacée par une version corrigée (nouvelle issue de revue).").catch(() => undefined);
  }
  const video = episodeFile(ep.id, "video.mp4");
  if (!fs.existsSync(video) && ep.diffusion.revue?.release) {
    // Run précédent interrompu après la sauvegarde : on récupère la vidéo depuis la Release.
    await gh(["release", "download", ep.diffusion.revue.release, "--pattern", `${ep.id}.mp4`, "--dir", episodeFile(ep.id, ""), "--clobber"]).catch(() => undefined);
    const dl = episodeFile(ep.id, `${ep.id}.mp4`);
    if (fs.existsSync(dl)) fs.renameSync(dl, video);
  }
  if (!fs.existsSync(video)) {
    throw new FmError(
      `Vidéo absente (${ep.id}/video.mp4) : les MP4 ne sont pas versionnés et ce run ne l'a pas produite. Refaire voix + rendu + qc (statut remis à « verifie », puis Production avec « forcer »).`,
      "revue",
    );
  }
  const voice = readJson<VoiceTiming>(episodeFile(ep.id, "voix.json"));
  // 1. Sauvegarde du fichier final AVANT tout envoi : la vidéo ne vit que sur la machine de production ; si
  // l'envoi YouTube échoue ensuite, elle reste récupérable depuis la Release (pas besoin de tout refaire).
  let fileUrl = "(sauvegarde désactivée)";
  if (c.publication.sauvegarde_releases) {
    const b = await backupToRelease(video, `${ep.id}.mp4`, ep.id.slice(0, 7));
    await backupToRelease(episodeFile(ep.id, "planche.jpg"), `${ep.id}-planche.jpg`, ep.id.slice(0, 7)).catch(() => undefined);
    fileUrl = b.url;
    ep.diffusion.revue = { ...(ep.diffusion.revue ?? {}), release: b.tag };
  }
  // 2. Copie privée sur YouTube (sert d'aperçu ; sera programmée à l'approbation)
  let previewUrl = "(YouTube désactivé)";
  if (c.publication.youtube.actif) {
    const up = await yt.uploadPrivate(video, {
      titre: ep.publication.titre,
      description: finalDescription(ep, "youtube"),
      tags: ep.publication.tags_youtube,
      categorie: c.publication.youtube.categorie,
      syntheticMedia: false,
    });
    ep.diffusion.youtube = { id: up.id, url: up.url, statut: "prive_revue", verifie_le: new Date().toISOString() };
    previewUrl = `https://studio.youtube.com/video/${up.id}/edit (privé) — ${up.url}`;
    saveEpisode(ep);
  }
  // 3. Issue d'approbation
  await ensureLabel("revue", "FBCA04", "Vidéo en attente d'approbation");
  await ensureLabel("approuve", "0E8A16", "Vidéo approuvée et programmée");
  await ensureLabel("rejete", "B60205", "Vidéo rejetée");
  const issue = await createIssue(`🎬 Revue — ${formatSlot(ep.publication_prevue)} — ${ep.publication.titre}`, reviewBody(ep, previewUrl, fileUrl, qc, voice), ["revue"]);
  ep.diffusion.revue = { ...(ep.diffusion.revue ?? {}), issue: issue.number, url: issue.url };
  ep.statut = "en_revue";
  journal(ep, "revue", `Issue ${issue.url}`);
  saveEpisode(ep);
  log("ok", "revue", `En revue : ${issue.url}`);
  return issue;
}

export async function approve(ep: Episode) {
  const c = chaine();
  if (ep.statut !== "en_revue" && ep.statut !== "qc_ok") throw new FmError(`Statut ${ep.statut} : approbation impossible`, "revue");
  if (c.publication.youtube.actif && ep.diffusion.youtube) {
    const heureYt = heurePlateforme(ep, "youtube", c);
    const future = new Date(heureYt).getTime() > Date.now() + 15 * 60_000;
    if (future) {
      const at = await yt.schedule(ep.diffusion.youtube.id, heureYt, false);
      ep.diffusion.youtube = { ...ep.diffusion.youtube, statut: "programme", programme_pour: at, verifie_le: new Date().toISOString() };
    } else {
      await yt.makePublic(ep.diffusion.youtube.id, false);
      ep.diffusion.youtube = { ...ep.diffusion.youtube, statut: "public", verifie_le: new Date().toISOString() };
    }
  }
  ep.statut = "programme";
  journal(ep, "approbation", `Approuvé, publication prévue ${ep.publication_prevue}`);
  saveEpisode(ep);
  if (ep.diffusion.revue?.issue) {
    await editLabels(ep.diffusion.revue.issue, ["approuve"], ["revue"]);
    await commentIssue(ep.diffusion.revue.issue, `✅ Approuvé. YouTube : ${ep.diffusion.youtube?.statut ?? "désactivé"}${ep.diffusion.youtube?.programme_pour ? ` (${formatSlot(ep.diffusion.youtube.programme_pour)})` : ""}. TikTok : envoi le ${formatSlot(heurePlateforme(ep, "tiktok", c))}.`);
  }
  log("ok", "revue", `${ep.id} approuvé`);
}

export async function reject(ep: Episode, reason: string) {
  if (ep.diffusion.youtube && ep.diffusion.youtube.statut !== "public") {
    await yt.remove(ep.diffusion.youtube.id).catch((e) => log("warn", "youtube", `Suppression impossible : ${(e as Error).message}`));
    ep.diffusion.youtube = { ...ep.diffusion.youtube, statut: "supprime" };
  }
  ep.statut = "rejete";
  journal(ep, "rejet", reason);
  saveEpisode(ep);
  if (ep.diffusion.revue?.issue) {
    await editLabels(ep.diffusion.revue.issue, ["rejete"], ["revue"]);
    await closeIssue(ep.diffusion.revue.issue, `❌ Rejeté : ${reason}`);
  }
  log("ok", "revue", `${ep.id} rejeté (${reason})`);
}
