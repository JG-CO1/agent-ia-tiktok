/**
 * Légendes TikTok prêtes à copier. L'envoi en brouillon (boîte de réception TikTok) n'accepte que la vidéo : aucune
 * légende ni aucun hashtag ne peut y être pré-rempli par l'API. data/legendes.json alimente donc la page publique
 * docs/legendes.html, où chaque légende (texte + hashtags) se copie d'un geste avant de publier dans l'app.
 */
import fs from "node:fs";
import path from "node:path";
import { chaine } from "../lib/config";
import { listEpisodes, loadEpisode } from "../lib/episodes";
import { log } from "../lib/log";
import { DATA_DIR } from "../lib/paths";
import type { Episode } from "../schema/episode";
import { finalDescription } from "./review";
import { heurePlateforme } from "./schedule";

export interface Legende {
  id: string;
  titre: string;
  format: string;
  /** Heure prévue de l'envoi du brouillon TikTok (ISO). */
  heure_tiktok: string;
  /** a_publier : brouillon dans la boîte TikTok ; a_venir : pas encore arrivé ; publiee : déjà en ligne. */
  etat: "a_publier" | "a_venir" | "publiee";
  legende: string;
}

const SUIVIS = new Set(["en_revue", "approuve", "programme", "publie"]);
const JOUR = 86400e3;

export function etatTikTok(ep: Pick<Episode, "diffusion">): Legende["etat"] {
  const s = ep.diffusion.tiktok?.statut;
  if (s === "PUBLISH_COMPLETE") return "publiee";
  if (s === "SEND_TO_USER_INBOX") return "a_publier";
  return "a_venir";
}

/** Brouillons à publier (tous), prochains envois (2 jours) et dernières publications (2 jours). */
export function legendesTikTok(maintenant = Date.now()): Legende[] {
  const c = chaine();
  const out: Legende[] = [];
  for (const id of listEpisodes()) {
    let ep: Episode;
    try {
      ep = loadEpisode(id);
    } catch {
      continue;
    }
    if (!SUIVIS.has(ep.statut) || ep.diffusion.tiktok?.statut === "FAILED") continue;
    const heure = heurePlateforme(ep, "tiktok", c);
    const ecart = new Date(heure).getTime() - maintenant;
    const etat = etatTikTok(ep);
    const garder = etat === "a_publier" || (etat === "a_venir" && ecart < 2 * JOUR && ecart > -2 * JOUR) || (etat === "publiee" && ecart > -2 * JOUR);
    if (!garder) continue;
    out.push({ id, titre: ep.publication.titre, format: ep.format, heure_tiktok: new Date(heure).toISOString(), etat, legende: finalDescription(ep, "tiktok") });
  }
  const rang = { a_publier: 0, a_venir: 1, publiee: 2 } as const;
  return out.sort((a, b) => rang[a.etat] - rang[b.etat] || (a.etat === "publiee" ? b.heure_tiktok.localeCompare(a.heure_tiktok) : a.heure_tiktok.localeCompare(b.heure_tiktok)));
}

/** Écrit data/legendes.json seulement s'il change (pas de commit pour rien). */
export function ecrireLegendes(): { fichier: string; change: boolean; legendes: Legende[] } {
  const legendes = legendesTikTok();
  const fichier = path.join(DATA_DIR, "legendes.json");
  const texte = JSON.stringify({ legendes }, null, 2) + "\n";
  const change = !fs.existsSync(fichier) || fs.readFileSync(fichier, "utf8") !== texte;
  if (change) fs.writeFileSync(fichier, texte);
  const n = legendes.filter((l) => l.etat === "a_publier").length;
  log("ok", "legendes", `${legendes.length} légende(s) TikTok, dont ${n} brouillon(s) à publier${change ? "" : " (inchangé)"}`);
  return { fichier, change, legendes };
}
