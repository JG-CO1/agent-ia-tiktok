/** Épisodes de la ville. Pour en ajouter un : un dossier episodes/<nom>/ (plans + index), une ligne ici. */
import type { EpisodeVille } from "../episode";
import { EPISODE as HUSS_001 } from "./huss-001";

export const EPISODES: Record<string, EpisodeVille> = {
  "huss-001": HUSS_001,
};

export function episodeDe(nom: string | undefined): EpisodeVille {
  const e = EPISODES[nom ?? ""];
  if (!e) throw new Error(`Épisode inconnu : « ${nom} » (connus : ${Object.keys(EPISODES).join(", ")}) — voir video/histoire/blocs/ville/episodes/registre.ts`);
  return e;
}
