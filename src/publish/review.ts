/**
 * Circuit d'approbation : envoi en revue (YouTube privé + sauvegarde + issue GitHub), approbation, rejet.
 * En mode « autonome » (config/chaine.json), la production enchaîne revue + approbation si le QC est publiable.
 */
import { chaine } from "../lib/config";
import { journal, readJson, saveEpisode } from "../lib/episodes";
import { FmError, log } from "../lib/log";
import { episodeFile } from "../lib/paths";
import type { QcReport } from "../qc/qc";
import type { VoiceTiming } from "../core/timeline";
import type { Episode } from "../schema/episode";
import { backupToRelease, closeIssue, commentIssue, createIssue, editLabels, ensureLabel } from "./github";
import * as yt from "./youtube";

/** Description finale (ajoute toujours la mention d'indépendance et les sources). */
export function finalDescription(ep: Episode, platform: "youtube" | "tiktok"): string {
  const c = chaine();
  const base = platform === "youtube" ? ep.publication.description_youtube : ep.publication.description_tiktok;
  const tags = ep.publication.hashtags.join(" ");
  const sources = ep.sources.map((s) => `• ${s.titre} : ${s.url}`).join("\n");
  if (platform === "tiktok") return `${base}\n\n${tags}`.slice(0, 2200);
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
  const voice = readJson<VoiceTiming>(episodeFile(ep.id, "voix.json"));
  // 1. Copie privée sur YouTube (sert d'aperçu ; sera programmée à l'approbation)
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
  // 2. Sauvegarde du fichier final
  let fileUrl = "(sauvegarde désactivée)";
  if (c.publication.sauvegarde_releases) {
    const b = await backupToRelease(video, `${ep.id}.mp4`, ep.id.slice(0, 7));
    await backupToRelease(episodeFile(ep.id, "planche.jpg"), `${ep.id}-planche.jpg`, ep.id.slice(0, 7)).catch(() => undefined);
    fileUrl = b.url;
    ep.diffusion.revue = { ...(ep.diffusion.revue ?? {}), release: b.tag };
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
    const future = new Date(ep.publication_prevue).getTime() > Date.now() + 15 * 60_000;
    if (future) {
      const at = await yt.schedule(ep.diffusion.youtube.id, ep.publication_prevue, false);
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
    await commentIssue(ep.diffusion.revue.issue, `✅ Approuvé. YouTube : ${ep.diffusion.youtube?.statut ?? "désactivé"}. TikTok : envoi au créneau (${formatSlot(ep.publication_prevue)}).`);
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
