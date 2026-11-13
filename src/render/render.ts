/** Rendu vidéo (Remotion) + mastering audio + planche contact. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { chaine } from "../lib/config";
import { journal, readJson, saveEpisode, writeJson as writeJsonFile } from "../lib/episodes";
import { run } from "../lib/exec";
import { FmError, log } from "../lib/log";
import { episodeDir, episodeFile, PUBLIC_DIR, publicEpisodeDir, ROOT } from "../lib/paths";
import { buildTimeline, type Timeline, type VoiceTiming } from "../core/timeline";
import { estimatedVoice } from "../core/demo";
import { ghostVersion } from "../lib/ghost";
import type { Episode } from "../schema/episode";

let bundled: string | null = null;
async function getBundle() {
  if (!bundled) {
    log("info", "rendu", "Préparation du bundle Remotion…");
    bundled = await bundle({ entryPoint: path.join(ROOT, "video/index.ts"), publicDir: PUBLIC_DIR });
  }
  return bundled;
}

const browserExecutable = () => process.env.REMOTION_BROWSER_EXECUTABLE || null;

/** Copie les médias de l'épisode dans le dossier public servi au navigateur de rendu. */
function stageMedia(ep: Episode, voice: VoiceTiming | null) {
  const dst = publicEpisodeDir(ep.id);
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(path.join(dst, "assets"), { recursive: true });
  if (voice?.fichier) fs.copyFileSync(episodeFile(ep.id, voice.fichier), path.join(dst, voice.fichier));
  const assetsSrc = path.join(episodeDir(ep.id), "assets");
  if (fs.existsSync(assetsSrc)) {
    for (const f of fs.readdirSync(assetsSrc)) fs.copyFileSync(path.join(assetsSrc, f), path.join(dst, "assets", f));
  }
  return `episodes/${ep.id}`;
}

export function timelineFor(ep: Episode, voice: VoiceTiming, withAudio: boolean): Timeline {
  const c = chaine();
  const base = `episodes/${ep.id}`;
  return buildTimeline(ep, voice, {
    channel: { nom: c.nom, handle: c.handle, promesse: c.promesse },
    voiceSrc: withAudio && voice.fichier ? `${base}/${voice.fichier}` : "",
    assetsBase: base,
    musicSrc: withAudio ? c.musique.fichier : null,
    musicVolume: c.musique.volume,
  });
}

/** Mastering : loudness -14 LUFS intégré, crête vraie -1 dBTP (2 passes), faststart. */
export async function master(input: string, output: string) {
  const { stderr } = await run("ffmpeg", ["-hide_banner", "-i", input, "-af", "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"]).catch(
    (e) => ({ stderr: String(e) }),
  );
  const m = stderr.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
  if (!m) throw new FmError("Mesure de loudness impossible (piste audio absente ?)", "rendu");
  const j = JSON.parse(m[0]);
  const af = `loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  await run("ffmpeg", ["-y", "-v", "error", "-i", input, "-af", af, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", output]);
}

/** Planche contact : une image au cœur de chaque scène, extraite de la vidéo finale. */
export async function contactSheet(video: string, tl: Timeline, out: string) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fm-planche-"));
  const frames: string[] = [];
  const points = [Math.round(tl.fps * 1.2), ...tl.scenes.map((s) => s.from + Math.round(s.duration * 0.6))];
  for (const [i, f] of points.entries()) {
    const file = path.join(tmp, `${String(i).padStart(2, "0")}.jpg`);
    await run("ffmpeg", ["-y", "-v", "error", "-ss", (f / tl.fps).toFixed(3), "-i", video, "-frames:v", "1", "-vf", "scale=360:640", "-q:v", "3", file]);
    frames.push(file);
  }
  const labels = ["0:01 hook", ...tl.scenes.map((s) => `${s.id} (${s.type})`)];
  await run("montage", [...frames.flatMap((f, i) => ["-label", labels[i], f]), "-tile", "6x", "-geometry", "+6+6", "-background", "#1b1b1b", "-fill", "white", "-pointsize", "18", out]);
  fs.rmSync(tmp, { recursive: true, force: true });
}

export async function renderEpisode(
  ep: Episode,
  opts: { brouillon?: boolean; concurrency?: number; frames?: [number, number]; sortie?: string; debug?: string[] } = {},
) {
  const voiceFile = episodeFile(ep.id, "voix.json");
  let voice = readJson<VoiceTiming>(voiceFile);
  if (!voice && !opts.brouillon) throw new FmError("Pas de voix : lancer d'abord `npm run fm -- voix <id>` (ou `rendu --brouillon`).", "rendu");
  const draft = opts.brouillon || !voice;
  if (draft && !voice) voice = estimatedVoice(ep);
  stageMedia(ep, draft && voice!.fournisseur === "local" && !voice!.fichier ? null : voice);
  const tl = timelineFor(ep, voice!, Boolean(voice!.fichier));
  if (opts.debug?.length) tl.debug = opts.debug;
  const serveUrl = await getBundle();
  const inputProps = { timeline: tl };
  const chromiumOptions = { gl: "swangle" as const };
  const composition = await selectComposition({ serveUrl, id: "Episode", inputProps, browserExecutable: browserExecutable(), chromiumOptions, timeoutInMilliseconds: 120000 });
  const raw = episodeFile(ep.id, draft ? "brouillon-brut.mp4" : "rendu-brut.mp4");
  const final = episodeFile(ep.id, draft ? "brouillon.mp4" : "video.mp4");
  const t0 = Date.now();
  let lastPct = -10;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: raw,
    inputProps,
    browserExecutable: browserExecutable(),
    chromiumOptions,
    concurrency: opts.concurrency ?? Math.max(1, Math.min(8, os.cpus().length)),
    crf: draft ? 26 : 19,
    pixelFormat: "yuv420p",
    colorSpace: "bt709",
    audioCodec: "aac",
    audioBitrate: "192k",
    jpegQuality: draft ? 80 : 94,
    scale: draft ? 0.5 : 1,
    timeoutInMilliseconds: 120000,
    frameRange: opts.frames ?? null,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct >= lastPct + 10) {
        lastPct = pct;
        log("info", "rendu", `${pct} %`);
      }
    },
  });
  if (opts.frames) {
    const n = opts.frames[1] - opts.frames[0] + 1;
    const secs = (Date.now() - t0) / 1000;
    if (opts.sortie) fs.copyFileSync(raw, opts.sortie);
    fs.rmSync(raw, { force: true });
    log("ok", "rendu", `extrait ${n} frames en ${secs.toFixed(1)} s -> ${(n / secs).toFixed(2)} images/s`);
    return { final: opts.sortie ?? raw, timeline: tl, draft };
  }
  const hasAudio = Boolean(tl.voiceSrc || tl.musicSrc);
  if (hasAudio) await master(raw, final);
  else fs.copyFileSync(raw, final);
  fs.rmSync(raw, { force: true });
  await contactSheet(final, tl, episodeFile(ep.id, draft ? "planche-brouillon.jpg" : "planche.jpg"));
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  log("ok", "rendu", `${path.relative(ROOT, final)} (${(tl.durationInFrames / tl.fps).toFixed(1)} s de vidéo, rendu en ${secs} s)`);
  if (!draft) {
    writeJsonFile(episodeFile(ep.id, "rendu.json"), {
      date: new Date().toISOString(),
      fantome_version: ghostVersion(),
      duree_s: +(tl.durationInFrames / tl.fps).toFixed(2),
      frames: tl.durationInFrames,
      fichier: "video.mp4",
      octets: fs.statSync(final).size,
      rendu_en_s: Number(secs),
    });
    ep.statut = "rendu";
    journal(ep, "rendu", `Vidéo rendue (${(tl.durationInFrames / tl.fps).toFixed(1)} s) en ${secs} s`);
    saveEpisode(ep);
  }
  return { final, timeline: tl, draft };
}
