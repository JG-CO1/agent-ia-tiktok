import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const EPISODES_DIR = path.join(ROOT, "episodes");
export const DATA_DIR = path.join(ROOT, "data");
export const CONFIG_DIR = path.join(ROOT, "config");
export const PUBLIC_DIR = path.join(ROOT, "video/public");
export const SORTIES_DIR = path.join(ROOT, "sorties");

export const episodeDir = (id: string) => path.join(EPISODES_DIR, id);
export const episodeFile = (id: string, name: string) => path.join(EPISODES_DIR, id, name);
/** Dossier public (servi au rendu) où l'on copie les médias de l'épisode. */
export const publicEpisodeDir = (id: string) => path.join(PUBLIC_DIR, "episodes", id);
