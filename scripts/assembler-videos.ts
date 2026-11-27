/**
 * Assemble les livrables d'une vidéo du lot 2 dans videos/video-0N-<slug>/ :
 *   final.mp4 · script.md · storyboard.md · assets/ (sous-titres, minutage, récit) · audio/ (voix, sons utilisés)
 * Usage : npx tsx scripts/assembler-videos.ts <mot-secret|telephone|messages>
 * Prérequis : voix + rendu faits (histoires/sorties/<id>/<id>.mp4) ; le storyboard est (re)généré ici.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const CIBLES: Record<string, { n: string; slug: string; dossier: string }> = {
  "mot-secret": { n: "01", slug: "mot-secret", dossier: "motsecret" },
  telephone: { n: "02", slug: "telephone", dossier: "telephone" },
  messages: { n: "03", slug: "messages", dossier: "messages" },
};
const id = process.argv[2];
const cible = CIBLES[id];
if (!cible) throw new Error("Usage : tsx scripts/assembler-videos.ts <mot-secret|telephone|messages>");
const src = path.resolve("histoires/sorties", id);
const mp4 = path.join(src, `${id}.mp4`);
if (!fs.existsSync(mp4)) throw new Error(`MP4 introuvable (rendre d'abord) : ${mp4}`);

execFileSync("npx", ["tsx", "scripts/histoire.ts", "storyboard2", id], { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });

type Recit = { titre: string; scenes: Array<{ titre?: string; texte: string }>; cloture: string; twist?: string; publication: { titre: string; description: string; hashtags: string[] } };
const recit = JSON.parse(fs.readFileSync(path.resolve("histoires/recits", `${id}.json`), "utf8")) as Recit;
const min = JSON.parse(fs.readFileSync(path.join(src, "minutage.json"), "utf8")) as { duree: number; mots: Array<{ texte: string; debut: number; fin: number }> };
if (recit.publication.hashtags.length !== 5) throw new Error("Il faut exactement 5 hashtags");

const dir = path.resolve("videos", `video-${cible.n}-${cible.slug}`);
fs.rmSync(dir, { recursive: true, force: true });
for (const d of ["assets", "audio"]) fs.mkdirSync(path.join(dir, d), { recursive: true });

// vidéo : flux vidéo copié, piste audio repassée par un limiteur (crête < 0 dBFS)
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", mp4, "-c:v", "copy", "-af", "alimiter=limit=0.9:level=disabled", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", path.join(dir, "final.mp4")]);
const dureeFinale = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(dir, "final.mp4")]).toString().trim());

// script.md
const texte = recit.scenes.map((s) => s.texte).join(" ");
const nb = texte.split(/\s+/).filter(Boolean).length;
const narration = Math.max(...min.mots.map((m) => m.fin));
const accroche = min.mots.filter((m) => m.debut < 3).map((m) => m.texte).join(" ");
fs.writeFileSync(
  path.join(dir, "script.md"),
  [
    `# ${recit.publication.titre}`,
    "",
    "## Narration complète (première personne)",
    "",
    ...recit.scenes.map((s, i) => `**${i + 1}. ${s.titre ?? ""}** — ${s.texte}`),
    "",
    "## Chiffres",
    "",
    `- Nombre de mots : **${nb}**`,
    `- Durée de la narration (voix réelle) : **${narration.toFixed(1)} s** · durée de la vidéo : **${dureeFinale.toFixed(1)} s** (débit ${(nb / narration).toFixed(2)} mots/s)`,
    "",
    "## Accroche (3 premières secondes)",
    "",
    `« ${accroche} »`,
    "",
    "## Twist final",
    "",
    recit.twist ?? "—",
    "",
    "## Question finale (commentaires)",
    "",
    `« ${recit.cloture} »`,
    "",
    "## Éléments de publication",
    "",
    `- **Titre** : ${recit.publication.titre}`,
    `- **Description** : ${recit.publication.description}`,
    `- **Hashtags** : ${recit.publication.hashtags.join(" ")}`,
    "",
  ].join("\n"),
);
fs.copyFileSync(path.join(src, "storyboard-detaille.md"), path.join(dir, "storyboard.md"));

// assets : sous-titres, minutage, récit ; audio : voix + sons utilisés par la bande-son
for (const f of ["sous-titres.srt", "sous-titres.json", "minutage.json"]) fs.copyFileSync(path.join(src, f), path.join(dir, "assets", f));
fs.copyFileSync(path.resolve("histoires/recits", `${id}.json`), path.join(dir, "assets", "recit.json"));
fs.copyFileSync(path.join(src, "voix.mp3"), path.join(dir, "audio", "voix-narration.mp3"));
const sons = path.resolve("video/histoire/blocs/conte", cible.dossier, "sons.ts");
const utilises = new Set<string>();
const dossiersSfx = ["conte", cible.dossier, "blocs"];
if (fs.existsSync(sons)) for (const m of fs.readFileSync(sons, "utf8").matchAll(/["'`]([a-z0-9-]+)["'`]/g)) for (const d of dossiersSfx) if (fs.existsSync(path.resolve("video/public/sfx", d, `${m[1]}.wav`))) utilises.add(`${d}/${m[1]}`);
fs.mkdirSync(path.join(dir, "audio", "sfx"), { recursive: true });
for (const u of utilises) {
  const [d, n] = u.split("/");
  fs.mkdirSync(path.join(dir, "audio", "sfx", d), { recursive: true });
  fs.copyFileSync(path.resolve("video/public/sfx", d, `${n}.wav`), path.join(dir, "audio", "sfx", d, `${n}.wav`));
}
fs.writeFileSync(path.join(dir, "audio", "README.txt"), `Voix : Piper (synthèse locale hors ligne, voix française « siwis », CC-BY 4.0).\nSons et nappes : synthétisés par programmation (src/audio/synth-*.ts), aucune source externe.\nUtilisés : ${[...utilises].sort().join(", ")}\n`);
console.log(`livrables -> ${dir} (${dureeFinale.toFixed(1)} s, ${nb} mots, ${utilises.size} sons)`);
