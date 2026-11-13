/** Lecture / écriture des épisodes, avec validation systématique du schéma. */
import fs from "node:fs";
import path from "node:path";
import { EpisodeSchema, type Episode } from "../schema/episode";
import { EPISODES_DIR, episodeDir, episodeFile } from "./paths";
import { FmError } from "./log";

export function listEpisodes(): string[] {
  if (!fs.existsSync(EPISODES_DIR)) return [];
  return fs
    .readdirSync(EPISODES_DIR)
    .filter((d) => fs.existsSync(path.join(EPISODES_DIR, d, "episode.json")))
    .sort();
}

export function readEpisodeRaw(id: string): unknown {
  const f = episodeFile(id, "episode.json");
  if (!fs.existsSync(f)) throw new FmError(`Épisode introuvable : ${id}`);
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

export function loadEpisode(id: string): Episode {
  const r = EpisodeSchema.safeParse(readEpisodeRaw(id));
  if (!r.success) {
    const msg = r.error.issues.map((i) => `  - ${i.path.join(".") || "(racine)"} : ${i.message}`).join("\n");
    throw new FmError(`episode.json invalide (${id}) :\n${msg}`, "validation");
  }
  return r.data;
}

export function saveEpisode(ep: Episode) {
  fs.mkdirSync(episodeDir(ep.id), { recursive: true });
  fs.writeFileSync(episodeFile(ep.id, "episode.json"), JSON.stringify(ep, null, 2) + "\n");
}

export function journal(ep: Episode, etape: string, message: string) {
  ep.journal.push({ date: new Date().toISOString(), etape, message });
}

export function readJson<T>(file: string): T | null {
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as T) : null;
}

export function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}
