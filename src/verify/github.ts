/** Faits vérifiables sur un dépôt GitHub (API officielle). Aucun chiffre n'est inventé : tout vient d'ici. */
import { env } from "../lib/config";

export interface RepoFacts {
  existe: boolean;
  nom: string;
  url?: string;
  description?: string | null;
  etoiles?: number;
  forks?: number;
  langage?: string | null;
  licence?: string | null;
  licence_nom?: string | null;
  archive?: boolean;
  cree_le?: string;
  pousse_le?: string;
  jours_depuis_activite?: number;
  sujets?: string[];
  branche?: string;
  readme_extrait?: string;
  readme_longueur?: number;
  fichiers_skill?: string[] | "inconnu";
  avertissements: string[];
  consulte_le: string;
}

const UA = "studio-fantome-veille/1.0";

let tokenRejected = false;
export function ghHeaders(auth = true): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": UA, "X-GitHub-Api-Version": "2022-11-28" };
  const tok = env("GITHUB_TOKEN") ?? env("GH_TOKEN");
  if (auth && tok && !tokenRejected) h.Authorization = `Bearer ${tok}`;
  return h;
}

export async function ghJson<T>(path: string): Promise<{ status: number; data: T | null }> {
  let res = await fetch(`https://api.github.com${path}`, { headers: ghHeaders() });
  if (res.status === 401 && !tokenRejected) {
    // jeton invalide : on continue en anonyme (limites plus basses) plutôt que d'échouer
    tokenRejected = true;
    console.warn("[github] jeton refusé (401) : requêtes anonymes");
    res = await fetch(`https://api.github.com${path}`, { headers: ghHeaders(false) });
  }
  if (!res.ok) return { status: res.status, data: null };
  return { status: res.status, data: (await res.json()) as T };
}

interface GhRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  license: { spdx_id: string; name: string } | null;
  archived: boolean;
  created_at: string;
  pushed_at: string;
  topics?: string[];
  default_branch: string;
}

/** Récupère le dépôt (endpoint /repos, ou recherche `repo:` en repli si l'endpoint est filtré). */
async function fetchRepo(full: string): Promise<GhRepo | null> {
  const direct = await ghJson<GhRepo>(`/repos/${full}`);
  if (direct.data) return direct.data;
  if (direct.status === 404) return null;
  const s = await ghJson<{ items: GhRepo[] }>(`/search/repositories?q=${encodeURIComponent(`repo:${full}`)}`);
  return s.data?.items?.find((r) => r.full_name.toLowerCase() === full.toLowerCase()) ?? null;
}

export async function rawFile(full: string, branch: string, file: string): Promise<string | null> {
  const res = await fetch(`https://raw.githubusercontent.com/${full}/${branch}/${file}`, { headers: { "User-Agent": UA } });
  return res.ok ? res.text() : null;
}

export async function repoFacts(full: string): Promise<RepoFacts> {
  const now = new Date();
  const r = await fetchRepo(full);
  if (!r) return { existe: false, nom: full, avertissements: ["Dépôt introuvable (inexistant ou privé)"], consulte_le: now.toISOString() };
  const warn: string[] = [];
  const days = Math.round((now.getTime() - new Date(r.pushed_at).getTime()) / 86400e3);
  if (r.archived) warn.push("Dépôt archivé (plus maintenu)");
  if (days > 120) warn.push(`Aucune activité depuis ${days} jours`);
  if (!r.license || r.license.spdx_id === "NOASSERTION") warn.push("Pas de licence explicite : tous droits réservés, ne pas inciter à réutiliser le code");
  let readme: string | null = null;
  for (const f of ["README.md", "readme.md", "README.MD", "README"]) {
    readme = await rawFile(r.full_name, r.default_branch, f);
    if (readme) break;
  }
  if (!readme) warn.push("README introuvable : documentation insuffisante");
  // Fichiers SKILL.md (arbre git ; peut être indisponible selon l'environnement)
  let skills: string[] | "inconnu" = "inconnu";
  const tree = await ghJson<{ tree: Array<{ path: string; type: string }>; truncated: boolean }>(`/repos/${r.full_name}/git/trees/${r.default_branch}?recursive=1`);
  if (tree.data) skills = tree.data.tree.filter((t) => t.type === "blob" && /(^|\/)SKILL\.md$/i.test(t.path)).map((t) => t.path).slice(0, 50);
  else if (await rawFile(r.full_name, r.default_branch, "SKILL.md")) skills = ["SKILL.md"];
  return {
    existe: true,
    nom: r.full_name,
    url: r.html_url,
    description: r.description,
    etoiles: r.stargazers_count,
    forks: r.forks_count,
    langage: r.language,
    licence: r.license?.spdx_id ?? null,
    licence_nom: r.license?.name ?? null,
    archive: r.archived,
    cree_le: r.created_at,
    pousse_le: r.pushed_at,
    jours_depuis_activite: days,
    sujets: r.topics ?? [],
    branche: r.default_branch,
    readme_extrait: readme?.slice(0, 1800),
    readme_longueur: readme?.length ?? 0,
    fichiers_skill: skills,
    avertissements: warn,
    consulte_le: now.toISOString(),
  };
}
