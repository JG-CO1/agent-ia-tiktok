/** Opérations GitHub via la CLI `gh` (issues de revue, Releases de sauvegarde). Authentification : GH_TOKEN. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run } from "../lib/exec";

const repoArgs = () => (process.env.GITHUB_REPOSITORY ? ["--repo", process.env.GITHUB_REPOSITORY] : []);

export async function gh(args: string[], input?: string) {
  return (await run("gh", [...args, ...repoArgs()], { input })).stdout.trim();
}

export async function ensureLabel(name: string, color: string, description: string) {
  await gh(["label", "create", name, "--color", color, "--description", description, "--force"]).catch(() => undefined);
}

export async function createIssue(title: string, body: string, labels: string[]): Promise<{ number: number; url: string }> {
  const url = await gh(["issue", "create", "--title", title, "--body-file", "-", ...labels.flatMap((l) => ["--label", l])], body);
  const number = Number(url.split("/").pop());
  return { number, url };
}

export const commentIssue = (n: number, body: string) => gh(["issue", "comment", String(n), "--body-file", "-"], body);
export const closeIssue = (n: number, comment?: string) => gh(["issue", "close", String(n), ...(comment ? ["--comment", comment] : [])]);
export const editLabels = (n: number, add: string[], remove: string[]) =>
  gh(["issue", "edit", String(n), ...add.flatMap((l) => ["--add-label", l]), ...remove.flatMap((l) => ["--remove-label", l])]).catch(() => undefined);

/** Sauvegarde un fichier dans la Release mensuelle `videos-AAAA-MM` (créée si besoin). Renvoie l'URL de téléchargement. */
export async function backupToRelease(file: string, assetName: string, month: string): Promise<{ tag: string; url: string }> {
  const tag = `videos-${month}`;
  try {
    await gh(["release", "view", tag]);
  } catch {
    await gh(["release", "create", tag, "--title", `Vidéos ${month}`, "--notes", "Sauvegarde automatique des vidéos finales (une ressource par épisode)."]);
  }
  // Déjà sauvegardé à l'identique (run précédent interrompu après le dépôt, ou incident GitHub pendant le
  // remplacement) : on ne supprime ni ne renvoie rien. La taille en octets sert de contrôle.
  const taille = fs.statSync(file).size;
  const existant = await gh(["release", "view", tag, "--json", "assets", "-q", `.assets[] | select(.name == "${assetName}") | .size`]).catch(() => "");
  if (String(existant).trim() !== String(taille)) {
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "fm-rel-")), assetName);
    fs.copyFileSync(file, tmp);
    await gh(["release", "upload", tag, tmp, "--clobber"]);
  }
  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repo = process.env.GITHUB_REPOSITORY ?? (await gh(["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]).catch(() => "OWNER/REPO"));
  return { tag, url: `${server}/${repo}/releases/download/${tag}/${assetName}` };
}
