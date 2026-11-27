/**
 * Vidéo de démonstration de la personnalité d'Ecto (3 niveaux de colère, accessoires, lancer, vitre brisée).
 * Ce n'est PAS un épisode : l'épisode-fixture est copié dans un dossier temporaire, rendu, puis supprimé ;
 * la vidéo est déposée dans sorties/ et n'entre jamais dans le circuit de publication.
 */
import fs from "node:fs";
import path from "node:path";
import { saveEpisode } from "../lib/episodes";
import { log } from "../lib/log";
import { episodeDir, episodeFile, publicEpisodeDir, ROOT, SORTIES_DIR } from "../lib/paths";
import { EpisodeSchema } from "../schema/episode";
import { generateVoice } from "../voice/voice";
import { renderEpisode } from "./render";

export const FIXTURE_ECTO = path.join(ROOT, "video/demo/ecto-personnalite.json");

/** Dossier où la voix de la démo est conservée entre deux essais (évite de reconsommer des crédits de synthèse). */
const CACHE_VOIX = path.join(SORTIES_DIR, "demo-ecto-voix");
const FICHIERS_VOIX = ["voix.json", "voix.wav", "voix-brute.wav"];
function restaurerVoix(id: string) {
  if (!fs.existsSync(CACHE_VOIX)) return;
  for (const f of FICHIERS_VOIX) if (fs.existsSync(path.join(CACHE_VOIX, f))) fs.copyFileSync(path.join(CACHE_VOIX, f), episodeFile(id, f));
}
function memoriserVoix(id: string) {
  fs.mkdirSync(CACHE_VOIX, { recursive: true });
  for (const f of FICHIERS_VOIX) if (fs.existsSync(episodeFile(id, f))) fs.copyFileSync(episodeFile(id, f), path.join(CACHE_VOIX, f));
}

export async function demoEcto(o: { local?: boolean; brouillon?: boolean; frames?: [number, number]; concurrency?: number; sortie?: string; garder?: boolean; avecVoix?: boolean; reutiliserVoix?: boolean }) {
  const ep = EpisodeSchema.parse(JSON.parse(fs.readFileSync(FIXTURE_ECTO, "utf8")));
  fs.rmSync(episodeDir(ep.id), { recursive: true, force: true });
  fs.mkdirSync(episodeDir(ep.id), { recursive: true });
  saveEpisode(ep);
  try {
    const voiceFile = episodeFile(ep.id, "voix.json");
    if (o.reutiliserVoix) restaurerVoix(ep.id);
    // brouillon : minutage estimé, sans voix (aucun crédit ElevenLabs consommé) sauf --avec-voix ; rendu final : voix réelle
    if (!o.brouillon || o.avecVoix) {
      if (o.reutiliserVoix && fs.existsSync(voiceFile)) log("info", "demo", "voix déjà générée : réutilisée");
      else await generateVoice(ep, { local: o.local });
    }
    if (fs.existsSync(voiceFile)) memoriserVoix(ep.id);
    const r = await renderEpisode(ep, { brouillon: o.brouillon, concurrency: o.concurrency, frames: o.frames, sortie: o.sortie, debug: undefined });
    fs.mkdirSync(SORTIES_DIR, { recursive: true });
    const nom = o.brouillon ? "demo-ecto-brouillon.mp4" : "demo-ecto-personnalite.mp4";
    if (!o.frames && fs.existsSync(r.final)) {
      fs.copyFileSync(r.final, path.join(SORTIES_DIR, nom));
      const planche = episodeFile(ep.id, o.brouillon ? "planche-brouillon.jpg" : "planche.jpg");
      if (fs.existsSync(planche)) fs.copyFileSync(planche, path.join(SORTIES_DIR, nom.replace(".mp4", "-planche.jpg")));
      log("ok", "demo", `sorties/${nom}`);
    }
    return r;
  } finally {
    if (!o.garder) {
      fs.rmSync(episodeDir(ep.id), { recursive: true, force: true });
      fs.rmSync(publicEpisodeDir(ep.id), { recursive: true, force: true });
    }
  }
}
