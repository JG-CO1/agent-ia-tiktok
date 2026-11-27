/**
 * Assemble les livrables d'une vidéo « conte » dans output/ :
 *   output/video_0N_<nom>.mp4  +  output/video_0N/{script.txt, subtitles.srt, scenes/, assets/}
 * Usage : npx tsx scripts/assembler-output.ts <id>   (somnambules | ange-gardien | brouillard)
 * Ne rend rien : le MP4 doit déjà exister (histoires/sorties/<id>/<id>.mp4).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const CIBLES: Record<string, { n: string; nom: string; dossier: string }> = {
  somnambules: { n: "01", nom: "somnambules", dossier: "somnambules" },
  "ange-gardien": { n: "02", nom: "ange_gardien", dossier: "ange" },
  brouillard: { n: "03", nom: "brouillard", dossier: "brouillard" },
};
const id = process.argv[2];
const cible = CIBLES[id];
if (!cible) throw new Error("Usage : tsx scripts/assembler-output.ts <somnambules|ange-gardien|brouillard>");

const src = path.resolve("histoires/sorties", id);
const mp4 = path.join(src, `${id}.mp4`);
if (!fs.existsSync(mp4)) throw new Error(`MP4 introuvable (rendre d'abord) : ${mp4}`);
const recit = JSON.parse(fs.readFileSync(path.resolve("histoires/recits", `${id}.json`), "utf8")) as { titre?: string; scenes: Array<{ texte: string }>; cloture?: string; legende_tiktok?: string };

const out = path.resolve("output");
const dir = path.join(out, `video_${cible.n}`);
fs.rmSync(dir, { recursive: true, force: true });
for (const d of ["scenes", "assets"]) fs.mkdirSync(path.join(dir, d), { recursive: true });
// vidéo copiée telle quelle ; seule la piste audio repasse par un limiteur (crête < 0 dBFS, pas d'écrêtage)
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", mp4, "-c:v", "copy", "-af", "alimiter=limit=0.9:level=disabled", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", path.join(out, `video_${cible.n}_${cible.nom}.mp4`)]);

// script : narration exacte + question finale + légende
const script = [recit.titre ? `TITRE : ${recit.titre}` : "", "", ...recit.scenes.map((s) => s.texte), "", `QUESTION FINALE : ${recit.cloture ?? ""}`, "", `LÉGENDE : ${recit.legende_tiktok ?? ""}`, ""].join("\n");
fs.writeFileSync(path.join(dir, "script.txt"), script);
fs.copyFileSync(path.join(src, "sous-titres.srt"), path.join(dir, "subtitles.srt"));

// assets : voix, minutage, sous-titres mot à mot, effets sonores réellement utilisés par la bande-son
for (const f of ["voix.mp3", "minutage.json", "sous-titres.json"]) if (fs.existsSync(path.join(src, f))) fs.copyFileSync(path.join(src, f), path.join(dir, "assets", f));
const sonsTs = path.resolve("video/histoire/blocs/conte", cible.dossier, "sons.ts");
const utilises = new Set<string>();
if (fs.existsSync(sonsTs)) for (const m of fs.readFileSync(sonsTs, "utf8").matchAll(/["'`]([a-z0-9-]+)["'`]/g)) if (fs.existsSync(path.resolve("video/public/sfx/conte", `${m[1]}.wav`))) utilises.add(m[1]);
fs.mkdirSync(path.join(dir, "assets", "sfx"), { recursive: true });
for (const n of utilises) fs.copyFileSync(path.resolve("video/public/sfx/conte", `${n}.wav`), path.join(dir, "assets", "sfx", `${n}.wav`));
fs.writeFileSync(path.join(dir, "assets", "README.txt"), `Effets sonores et nappes utilisés (synthétisés localement par src/audio/synth-conte.ts, aucune source externe) :\n${[...utilises].sort().join("\n")}\n\nVoix : ElevenLabs (voix.mp3, minutage.json = minutage mot à mot). Aucun média externe.\n`);

// scenes : une image toutes les 2 s extraite du MP4 final + planche d'ensemble
const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString().trim());
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", mp4, "-vf", "fps=1/2,scale=360:640", "-q:v", "3", path.join(dir, "scenes", "plan-%02d.jpg")]);
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", mp4, "-vf", "fps=30/" + dur.toFixed(2) + ",scale=240:426,tile=10x3", "-frames:v", "1", "-q:v", "3", path.join(dir, "scenes", "planche.jpg")]);
const sb = path.join(src, "storyboard.md");
if (fs.existsSync(sb)) fs.copyFileSync(sb, path.join(dir, "scenes", "storyboard.md"));
console.log(`livrables -> ${dir} (${dur.toFixed(1)} s, ${utilises.size} sons)`);
