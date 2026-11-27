/**
 * Publication des vidéos du dossier videos/<slug>/ (final.mp4 + script.md) sur YouTube Shorts et TikTok.
 * Titre, description et hashtags viennent de script.md. Chaque statut enregistré (videos/statuts/<slug>.json) vient
 * d'une réponse d'API réelle : rien n'est simulé. Idempotent : un envoi déjà fait n'est jamais refait.
 *
 * TikTok : publication directe SEULEMENT si l'API autorise la visibilité publique pour ce compte (application auditée).
 * Sinon rien n'est envoyé (jamais de publication privée présentée comme publiée) et le statut dit pourquoi.
 */
import fs from "node:fs";
import path from "node:path";
import { FmError, log } from "../lib/log";
import { ROOT } from "../lib/paths";
import * as tt from "./tiktok";
import * as yt from "./youtube";

export interface StatutVideo {
  slug: string;
  titre: string;
  youtube?: { id: string; url: string; statut: string; verifie_le: string; erreur?: string };
  tiktok?: { statut: string; publish_id?: string; post_id?: string; verifie_le: string; detail?: string };
}

const DOSSIER = path.join(ROOT, "videos");
const fichierStatut = (slug: string) => path.join(DOSSIER, "statuts", `${slug}.json`);

export function lireScript(slug: string): { titre: string; description: string; hashtags: string[] } {
  const f = path.join(DOSSIER, slug, "script.md");
  if (!fs.existsSync(f)) throw new FmError(`script.md introuvable : ${f}`, "publication");
  const t = fs.readFileSync(f, "utf8");
  const champ = (nom: string) => t.match(new RegExp(`^- \\*\\*${nom}\\*\\* : (.+)$`, "m"))?.[1]?.trim();
  const titre = champ("Titre");
  const description = champ("Description");
  const hashtags = champ("Hashtags")?.split(/\s+/).filter((h) => h.startsWith("#")) ?? [];
  if (!titre || !description) throw new FmError(`script.md : titre ou description manquant (${slug})`, "publication");
  if (hashtags.length !== 5) throw new FmError(`script.md : il faut exactement 5 hashtags (${hashtags.length} trouvés)`, "publication");
  return { titre, description, hashtags };
}

function lireStatut(slug: string, titre: string): StatutVideo {
  const f = fichierStatut(slug);
  return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")) as StatutVideo) : { slug, titre };
}
function ecrireStatut(s: StatutVideo) {
  fs.mkdirSync(path.dirname(fichierStatut(s.slug)), { recursive: true });
  fs.writeFileSync(fichierStatut(s.slug), JSON.stringify(s, null, 2) + "\n");
}

export async function publierVideo(slug: string, plateformes: Array<"youtube" | "tiktok"> = ["youtube", "tiktok"]): Promise<StatutVideo> {
  if (!/^video-\d{2}-[a-z0-9-]+$/.test(slug)) throw new FmError(`identifiant de vidéo refusé : ${slug}`, "publication");
  const fichier = path.join(DOSSIER, slug, "final.mp4");
  if (!fs.existsSync(fichier)) throw new FmError(`final.mp4 introuvable : ${fichier}`, "publication");
  const meta = lireScript(slug);
  const etat = lireStatut(slug, meta.titre);
  const legende = `${meta.description}\n\n${meta.hashtags.join(" ")}\n\nContenu généré par IA (voix de synthèse, images 3D).`;

  // ---------------------------------------------------------------- YouTube Shorts
  if (plateformes.includes("youtube")) {
    try {
      let id = etat.youtube?.id;
      if (!id) {
        const up = await yt.uploadPrivate(fichier, { titre: meta.titre, description: legende, tags: meta.hashtags.map((h) => h.slice(1)), categorie: "24", syntheticMedia: true });
        id = up.id;
        etat.youtube = { id, url: up.url, statut: "private", verifie_le: new Date().toISOString() };
        ecrireStatut(etat); // identifiant mémorisé tout de suite : jamais de double envoi
      }
      const v0 = await yt.getVideo(id);
      if (v0?.status.privacyStatus !== "public") await yt.makePublic(id, true);
      const v = await yt.getVideo(id);
      if (!v) throw new FmError(`YouTube : vidéo ${id} introuvable après envoi`, "youtube");
      etat.youtube = { id, url: `https://youtube.com/shorts/${id}`, statut: v.status.privacyStatus, verifie_le: new Date().toISOString(), ...(v.status.rejectionReason || v.status.failureReason ? { erreur: v.status.rejectionReason ?? v.status.failureReason } : {}) };
      log(v.status.privacyStatus === "public" ? "ok" : "warn", "publication", `YouTube ${slug} : ${v.status.privacyStatus} ${etat.youtube.url}`);
    } catch (e) {
      etat.youtube = { ...(etat.youtube ?? { id: "", url: "" }), statut: "erreur", erreur: (e as Error).message, verifie_le: new Date().toISOString() };
      log("erreur", "publication", `YouTube ${slug} : ${(e as Error).message}`);
    }
    ecrireStatut(etat);
  }

  // ---------------------------------------------------------------- TikTok
  if (plateformes.includes("tiktok") && !etat.tiktok?.publish_id) {
    try {
      const ci = await tt.creatorInfo(); // réponse réelle de l'API : options de visibilité autorisées pour ce compte
      if (!ci.privacy_level_options.includes("PUBLIC_TO_EVERYONE")) {
        etat.tiktok = {
          statut: "NON_PUBLIE_APPLICATION_NON_APPROUVEE",
          verifie_le: new Date().toISOString(),
          detail: `L'API TikTok n'autorise pas la publication publique pour @${ci.creator_username} (options : ${ci.privacy_level_options.join(", ")}) : application non auditée. Rien n'a été envoyé.`,
        };
        log("warn", "publication", `TikTok ${slug} : ${etat.tiktok.detail}`);
      } else {
        const publish_id = await tt.directPost(fichier, `${meta.titre}\n\n${legende}`, true);
        etat.tiktok = { statut: "ENVOYE", publish_id, verifie_le: new Date().toISOString() };
        ecrireStatut(etat);
        const st = await tt.waitStatus(publish_id);
        etat.tiktok = { statut: st.status, publish_id, post_id: st.publicaly_available_post_id?.[0]?.toString(), verifie_le: new Date().toISOString(), ...(st.fail_reason ? { detail: st.fail_reason } : {}) };
        log(st.status === "PUBLISH_COMPLETE" ? "ok" : "warn", "publication", `TikTok ${slug} : ${st.status}`);
      }
    } catch (e) {
      etat.tiktok = { statut: "ERREUR", verifie_le: new Date().toISOString(), detail: (e as Error).message };
      log("erreur", "publication", `TikTok ${slug} : ${(e as Error).message}`);
    }
    ecrireStatut(etat);
  }
  return etat;
}
