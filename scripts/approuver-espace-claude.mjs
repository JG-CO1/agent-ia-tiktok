// Marque un dossier comme approuvé (« trust dialog » accepté) pour Claude Code, dans ~/.claude.json, sans toucher au
// reste du fichier. Sans cela, en mode non interactif (-p), Claude Code ignore les permissions.allow du projet.
// Usage : node scripts/approuver-espace-claude.mjs [dossier] (défaut : dossier courant)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dossier = path.resolve(process.argv[2] || process.cwd());
const chemins = [...new Set([dossier, fs.realpathSync(dossier)])];
const fichier = path.join(process.env.CLAUDE_CONFIG_DIR || os.homedir(), ".claude.json");

let config = {};
if (fs.existsSync(fichier)) {
  try {
    config = JSON.parse(fs.readFileSync(fichier, "utf8"));
  } catch {
    console.error(`${fichier} illisible : il est remplacé`);
  }
}
config.projects ??= {};
for (const c of chemins) config.projects[c] = { ...(config.projects[c] ?? {}), hasTrustDialogAccepted: true };
fs.mkdirSync(path.dirname(fichier), { recursive: true });
fs.writeFileSync(fichier, JSON.stringify(config, null, 2) + "\n");
console.log(`Claude Code : ${chemins.join(", ")} approuvé dans ${fichier}`);
