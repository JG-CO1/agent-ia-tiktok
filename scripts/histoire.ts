/**
 * Studio « Histoires » : voix de narrateur (ElevenLabs) + rendu d'un récit.
 *   tsx scripts/histoire.ts voix  <id>          (nécessite ELEVENLABS_API_KEY)
 *   tsx scripts/histoire.ts rendu <id>          (voix si histoires/sorties/<id>/minutage.json existe, sinon aperçu muet)
 *   tsx scripts/histoire.ts image <id> <sec>    (une image de contrôle)
 */
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { synthesize, resolveVoiceId } from "../src/voice/voice";
import { chaine } from "../src/lib/config";
import { processVoice } from "../src/voice/voice";

type Scene = { texte: string };
type Spec = { id: string; scenes: Scene[] };
const [cmd, id, arg] = process.argv.slice(2);
if (!cmd || !id) throw new Error("Usage : tsx scripts/histoire.ts <voix|rendu|image> <id> [sec]");
const spec: Spec = JSON.parse(fs.readFileSync(path.resolve("histoires/recits", `${id}.json`), "utf8"));
const outDir = path.resolve("histoires/sorties", id);
fs.mkdirSync(outDir, { recursive: true });
const minFile = path.join(outDir, "minutage.json");

type Mot = { texte: string; debut: number; fin: number; scene: number };
type Minutage = { duree: number; mots: Mot[]; scenes: Array<{ debut: number; fin: number }>; voix: string | null };

function estime(): Minutage {
  const mots: Mot[] = [];
  const scenes: Minutage["scenes"] = [];
  let t = 0.3;
  spec.scenes.forEach((s, i) => {
    const debut = t;
    for (const w of s.texte.split(/\s+/).filter(Boolean)) {
      const d = 0.2 + Math.min(0.3, w.length * 0.03);
      mots.push({ texte: w, debut: t, fin: t + d, scene: i });
      t += d + 0.03;
    }
    t += 0.35;
    scenes.push({ debut, fin: t });
  });
  return { duree: t + 2.2, mots, scenes, voix: null };
}

async function voix() {
  const texte = spec.scenes.map((s) => s.texte).join(" ");
  const brut = path.join(outDir, "voix-brute.mp3");
  const al = await synthesize(texte, brut, { voiceId: process.env.HISTOIRES_VOICE_ID || resolveVoiceId(), model: chaine().voix.modele, timestamps: true });
  if (!al) throw new Error("Pas de minutage renvoyé par ElevenLabs");
  const traite = path.join(outDir, "voix.mp3");
  await processVoice(brut, traite);
  // mots + bornes de scène depuis l'alignement caractère par caractère
  const chars = al.characters;
  const mots: Mot[] = [];
  let pos = 0;
  const bornesTxt: number[] = [];
  spec.scenes.forEach((s, i) => {
    bornesTxt.push(pos);
    pos += s.texte.length + 1;
    void i;
  });
  const sceneDe = (c: number) => Math.max(0, bornesTxt.filter((b) => c >= b).length - 1);
  let cur = "";
  let st = 0;
  let sc = 0;
  chars.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) mots.push({ texte: cur, debut: st, fin: al.character_end_times_seconds[i - 1], scene: sc });
      cur = "";
    } else {
      if (!cur) {
        st = al.character_start_times_seconds[i];
        sc = sceneDe(i);
      }
      cur += ch;
    }
  });
  if (cur) mots.push({ texte: cur, debut: st, fin: al.character_end_times_seconds[chars.length - 1], scene: sc });
  const scenes = spec.scenes.map((_, i) => {
    const m = mots.filter((w) => w.scene === i);
    return { debut: m.length ? m[0].debut : 0, fin: m.length ? m[m.length - 1].fin : 0 };
  });
  scenes.forEach((s, i) => {
    s.fin = i < scenes.length - 1 ? scenes[i + 1].debut : s.fin + 0.5;
  });
  scenes[0].debut = 0;
  const duree = Math.max(...mots.map((m) => m.fin)) + 2.6;
  const pub = path.resolve("video/public/histoires");
  fs.mkdirSync(pub, { recursive: true });
  fs.copyFileSync(traite, path.join(pub, `${id}.mp3`));
  fs.writeFileSync(minFile, JSON.stringify({ duree, mots, scenes, voix: `histoires/${id}.mp3` } satisfies Minutage, null, 2));
  console.log(`voix OK : ${mots.length} mots, ${duree.toFixed(1)} s`);
}

async function rendu() {
  const minutage: Minutage = fs.existsSync(minFile) && process.env.APERCU_MUET !== "1" ? JSON.parse(fs.readFileSync(minFile, "utf8")) : estime();
  const props = { spec: { ...spec, ...JSON.parse(fs.readFileSync(path.resolve("histoires/recits", `${id}.json`), "utf8")) }, minutage };
  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || (process.env.CI ? null : "/usr/bin/google-chrome");
  const chromiumOptions = { gl: "swangle" as const };
  const serveUrl = await bundle({ entryPoint: path.resolve("video/index.ts"), publicDir: path.resolve("video/public") });
  const composition = await selectComposition({ serveUrl, id: "Histoire", inputProps: props, browserExecutable, chromiumOptions });
  if (cmd === "image") {
    const out = path.join(outDir, `image-${arg}s.png`);
    await renderStill({ composition, serveUrl, output: out, frame: Math.round(Number(arg) * composition.fps), inputProps: props, browserExecutable, chromiumOptions });
    console.log("image ->", out);
    return;
  }
  const out = path.join(outDir, `${id}.mp4`);
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, inputProps: props, browserExecutable, chromiumOptions, crf: 20, pixelFormat: "yuv420p" });
  console.log("vidéo ->", out, minutage.voix ? "(avec voix)" : "(aperçu muet)");
}

if (cmd === "voix") await voix();
else await rendu();
