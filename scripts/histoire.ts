/**
 * Studio « Histoires » : voix de narrateur (ElevenLabs) + rendu d'un récit.
 *   tsx scripts/histoire.ts voix  <id>          (nécessite ELEVENLABS_API_KEY)
 *   tsx scripts/histoire.ts rendu <id>          (voix si histoires/sorties/<id>/minutage.json existe, sinon aperçu muet)
 *   tsx scripts/histoire.ts image <id> <sec>    (une image de contrôle)
 * Format « blocs » uniquement (contrôle des cadrages avant le rendu complet) :
 *   tsx scripts/histoire.ts plans   <id>                      (liste des plans : début, durée, mot-repère)
 *   tsx scripts/histoire.ts planche <id> <quoi> [nom]         (planche contact ; <quoi> = "plans" (3 images par plan),
 *                                                              "s04" (une scène), "s04p2" (un plan, 6 images) ou "1.5,3,10" (secondes))
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { synthesize, resolveVoiceId } from "../src/voice/voice";
import { chaine } from "../src/lib/config";
import { processVoice } from "../src/voice/voice";
import { decouper, dureeBlocs, motsAffiches, type RecitBlocs } from "../video/histoire/blocs/decoupage";
import { plansDe } from "../video/histoire/blocs/plans-registre";

type Scene = { texte: string; titre?: string; decor?: string; personnages?: string; balle?: string; son?: string };
type Spec = { id: string; scenes: Scene[]; format?: string; mise_en_scene?: string; episode?: string; prononciation?: Record<string, string>; cloture?: string; titre?: string; duree_min?: number; queue?: number; acceleration?: number; voix?: { stabilite?: number; similarite?: number; style?: number; vitesse?: number } };
const [cmd, id, arg, arg2] = process.argv.slice(2);
if (!cmd || !id) throw new Error("Usage : tsx scripts/histoire.ts <voix|rendu|image|plans|planche|sous-titres|storyboard> <id> [sec|quoi] [nom]");
const spec: Spec = JSON.parse(fs.readFileSync(path.resolve("histoires/recits", `${id}.json`), "utf8"));
const outDir = path.resolve("histoires/sorties", id);
fs.mkdirSync(outDir, { recursive: true });
const minFile = path.join(outDir, "minutage.json");

type Mot = { texte: string; debut: number; fin: number; scene: number };
type Minutage = { duree: number; mots: Mot[]; scenes: Array<{ debut: number; fin: number }>; voix: string | null; musique?: string | null };
const MUSIQUE = "musique/histoires-fond.mp3";

/**
 * Aperçu muet du format « blocs » : débit calé sur la vraie voix du compte (mesuré sur histoire-005 à 011 :
 * environ 0,35 s par mot, pauses comprises), avec une respiration après les points et les virgules.
 * Les plans étant calés sur les mots, l'aperçu a ainsi le même rythme de coupes que la vidéo finale.
 */
function estimeBlocs(): Minutage {
  const mots: Mot[] = [];
  const scenes: Minutage["scenes"] = [];
  let t = 0.2;
  spec.scenes.forEach((s, i) => {
    const debut = t;
    for (const w of s.texte.split(/\s+/).filter(Boolean)) {
      const nu = w.replace(/[«»"“”?!:;.,…]/g, "");
      const d = nu ? 0.12 + Math.min(0.3, nu.length * 0.034) : 0.05;
      mots.push({ texte: w, debut: t, fin: t + d, scene: i });
      t += d + 0.025 + (/[.!?…]$/.test(w) ? 0.26 : /[,;:]$/.test(w) ? 0.11 : 0);
    }
    scenes.push({ debut, fin: t });
  });
  scenes[0].debut = 0;
  return { duree: mots[mots.length - 1].fin + 2.6, mots, scenes, voix: null };
}

function estime(): Minutage {
  if (spec.format === "blocs" || spec.format === "stick") return estimeBlocs();
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
  // Prononciation : ce que la voix DIT (ex. « Heuss ») diffère de ce qui s'AFFICHE (« HUSS! »). Un mot pour un mot.
  const pron = spec.prononciation ?? {};
  const dit = (t: string) => Object.entries(pron).reduce((acc, [k, v]) => acc.replace(new RegExp(`\\b${k}\\b`, "g"), v), t);
  const parles = spec.scenes.map((s) => dit(s.texte));
  const texte = parles.join(" ");
  const brut = path.join(outDir, "voix-brute.mp3");
  const al = await synthesize(texte, brut, { voiceId: process.env.HISTOIRES_VOICE_ID || resolveVoiceId(), model: chaine().voix.modele, timestamps: true, reglages: spec.voix });
  if (!al) throw new Error("Pas de minutage renvoyé par ElevenLabs");
  const traite = path.join(outDir, "voix.mp3");
  await processVoice(brut, traite);
  // accélération uniforme (diction rapide des formats courts) : hauteur conservée, tous les instants recalés exactement
  const accel = spec.acceleration && spec.acceleration > 0 ? spec.acceleration : 1;
  if (accel !== 1) {
    const rapide = path.join(outDir, "voix-rapide.mp3");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", traite, "-filter:a", `atempo=${accel}`, "-b:a", "128k", rapide]);
    fs.renameSync(rapide, traite);
  }
  // mots + bornes de scène depuis l'alignement caractère par caractère
  const chars = al.characters;
  const mots: Mot[] = [];
  let pos = 0;
  const bornesTxt: number[] = [];
  parles.forEach((t) => {
    bornesTxt.push(pos);
    pos += t.length + 1;
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
  // retour au texte affiché : mêmes mots, même ordre (« Heuss » → « HUSS »)
  if (accel !== 1) for (const w of mots) { w.debut /= accel; w.fin /= accel; }
  const originaux = spec.scenes.flatMap((sc) => sc.texte.split(/\s+/).filter(Boolean));
  if (originaux.length !== mots.length) throw new Error(`Minutage : ${mots.length} mots reçus pour ${originaux.length} mots écrits`);
  mots.forEach((w, i) => (w.texte = originaux[i]));
  const scenes = spec.scenes.map((_, i) => {
    const m = mots.filter((w) => w.scene === i);
    return { debut: m.length ? m[0].debut : 0, fin: m.length ? m[m.length - 1].fin : 0 };
  });
  scenes.forEach((s, i) => {
    s.fin = i < scenes.length - 1 ? scenes[i + 1].debut : s.fin + 0.5;
  });
  scenes[0].debut = 0;
  const duree = Math.max(...mots.map((m) => m.fin)) + (spec.queue ?? 2.6);
  const pub = path.resolve("video/public/histoires");
  fs.mkdirSync(pub, { recursive: true });
  fs.copyFileSync(traite, path.join(pub, `${id}.mp3`));
  fs.writeFileSync(minFile, JSON.stringify({ duree, mots, scenes, voix: `histoires/${id}.mp3` } satisfies Minutage, null, 2));
  console.log(`voix OK : ${mots.length} mots, ${duree.toFixed(1)} s`);
  sousTitres();
}

/** Instants d'affichage des sous-titres : un mot à la fois, comme à l'écran (jusqu'au mot suivant, ou 0,4 s après sa fin). */
function sousTitres() {
  const minutage = lireMinutage();
  const mots = motsAffiches(minutage.mots);
  const items = mots.map((m, i) => ({ index: i + 1, texte: m.texte, debut: +m.debut.toFixed(3), fin: +Math.min(i + 1 < mots.length ? mots[i + 1].debut : Infinity, m.fin + 0.4).toFixed(3), cloture: false }));
  const finNarration = mots.length ? mots[mots.length - 1].fin : minutage.duree;
  if (spec.cloture) items.push({ index: items.length + 1, texte: spec.cloture, debut: +(finNarration + 0.45).toFixed(3), fin: +dureeBlocs(minutage).toFixed(3), cloture: true });
  const tc = (t: number) => {
    const ms = Math.round(t * 1000);
    const p = (n: number, l = 2) => String(n).padStart(l, "0");
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(Math.floor((ms % 60000) / 1000))},${p(ms % 1000, 3)}`;
  };
  fs.writeFileSync(path.join(outDir, "sous-titres.json"), JSON.stringify({ id, mots: items }, null, 2));
  fs.writeFileSync(path.join(outDir, "sous-titres.srt"), items.map((m) => `${m.index}\n${tc(m.debut)} --> ${tc(m.fin)}\n${m.texte}\n`).join("\n"));
  console.log(`sous-titres -> ${path.join(outDir, "sous-titres.srt")} (${items.length} entrées)`);
}

/** Storyboard minuté : une ligne par plan (instants réels du minutage) + le détail de chaque scène. */
function storyboard() {
  const minutage = lireMinutage();
  const plans = plansBlocs(minutage);
  const mots = motsAffiches(minutage.mots);
  const f = (t: number) => `${t.toFixed(2)}`;
  const L: string[] = [];
  L.push(`# Storyboard minuté — ${spec.titre ?? id}`, "", `Récit \`${id}\` · mise en scène \`${spec.mise_en_scene ?? "minuit"}\` · ${minutage.voix ? "minutage de la VRAIE voix" : "minutage ESTIMÉ (aperçu muet)"} · durée ${dureeBlocs(minutage).toFixed(1)} s · 1080×1920, 30 i/s.`, "");
  L.push("## Découpage par plan", "", "| # | Plan | Scène | Début (s) | Durée (s) | Narration | Mots affichés | Caméra et action | Transition |", "|---|---|---|---|---|---|---|---|---|");
  const brut = minutage.mots;
  plans.forEach((p, i) => {
    const narr = brut.filter((w) => w.debut >= p.debut - 0.001 && w.debut < p.fin - 0.001).map((w) => w.texte).join(" ").replace(/\|/g, "/");
    const aff = mots.filter((w) => w.debut >= p.debut - 0.001 && w.debut < p.fin - 0.001).map((w) => w.texte).join(" · ");
    L.push(`| ${i + 1} | ${p.def.id} | ${p.def.scene + 1} | ${f(p.debut)} | ${(p.fin - p.debut).toFixed(2)} | ${narr || "—"} | ${aff || "—"} | ${p.def.titre.replace(/\|/g, "/")} | ${i === plans.length - 1 ? "fin : question finale à l'écran" : p.def.continu ? "enchaîné (sans coupe)" : "coupe franche"} |`);
  });
  L.push("", "## Détail par scène", "");
  spec.scenes.forEach((sc, i) => {
    const b = minutage.scenes[i];
    L.push(`### Scène ${i + 1} — ${sc.titre ?? ""} (${f(b.debut)} → ${f(b.fin)} s, ${(b.fin - b.debut).toFixed(1)} s)`, "", `- **Narration** : ${sc.texte}`, `- **Décor** : ${sc.decor ?? "—"}`, `- **Personnages et positions** : ${sc.personnages ?? "—"}`, `- **Ballon** : ${sc.balle ?? "—"}`, `- **Son** : ${sc.son ?? "—"}`, `- **Plans** : ${plans.filter((p) => p.def.scene === i).map((p) => p.def.id).join(", ") || "—"}`, "");
  });
  fs.writeFileSync(path.join(outDir, "storyboard.md"), L.join("\n"));
  console.log("storyboard ->", path.join(outDir, "storyboard.md"));
}

function lireMinutage(): Minutage {
  const minutage: Minutage = fs.existsSync(minFile) && process.env.APERCU_MUET !== "1" ? JSON.parse(fs.readFileSync(minFile, "utf8")) : estime();
  minutage.musique = fs.existsSync(path.resolve("video/public", MUSIQUE)) ? MUSIQUE : null;
  if (spec.duree_min !== undefined) minutage.dureeMin = spec.duree_min;
  return minutage;
}

/** Plans du format « blocs » placés dans le temps (mêmes règles que le rendu). */
function plansBlocs(minutage: Minutage) {
  return decouper(spec as unknown as RecitBlocs, minutage, plansDe(spec.mise_en_scene, spec.episode ?? spec.id));
}

function listerPlans() {
  const minutage = lireMinutage();
  const plans = plansBlocs(minutage);
  for (const p of plans) console.log(`${p.def.id.padEnd(8)} ${p.debut.toFixed(2).padStart(6)} s  ${(p.fin - p.debut).toFixed(2)} s  ${p.def.continu ? "(suite) " : ""}${p.def.titre}`);
  const coupes = plans.filter((p) => !p.def.continu).length;
  console.log(`${plans.length} plans, ${coupes} coupes, durée ${Math.max(dureeBlocs(minutage), plans[plans.length - 1].fin).toFixed(1)} s (${minutage.voix ? "vraie voix" : "aperçu muet"})`);
}

async function rendu() {
  const minutage = lireMinutage();
  const props = { spec: { ...spec, ...JSON.parse(fs.readFileSync(path.resolve("histoires/recits", `${id}.json`), "utf8")) }, minutage };
  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || (process.env.CI ? null : "/usr/bin/google-chrome");
  const chromiumOptions = { gl: "swangle" as const };
  const serveUrl = await bundle({ entryPoint: path.resolve("video/index.ts"), publicDir: path.resolve("video/public") });
  const composition = await selectComposition({ serveUrl, id: ({ cadre: "Cadre", duel: "Duel", blocs: "Blocs", stick: "Stick" } as Record<string, string>)[(spec as { format?: string }).format ?? ""] ?? "Histoire", inputProps: props, browserExecutable, chromiumOptions });
  if (cmd === "planche") {
    // Planche contact : plusieurs images réduites, rangées dans l'ordre, pour contrôler les cadrages d'un coup d'œil.
    const plans = plansBlocs(minutage);
    const quoi = arg ?? "plans";
    let instants: Array<{ t: number; nom: string }> = [];
    if (/^[\d.,]+$/.test(quoi)) instants = quoi.split(",").map((x) => ({ t: Number(x), nom: `${x}s` }));
    else {
      const ids = quoi.split(",");
      const choisis = quoi === "plans" ? plans : plans.filter((p) => ids.some((q) => p.def.id === q || p.def.id.startsWith(`${q}p`)));
      if (!choisis.length) throw new Error(`Aucun plan pour « ${quoi} »`);
      const fr = choisis.length === 1 ? [0.02, 0.2, 0.4, 0.6, 0.8, 0.98] : choisis.length <= 4 ? [0.04, 0.35, 0.65, 0.96] : [0.05, 0.5, 0.95];
      for (const p of choisis) for (const f of fr) instants.push({ t: p.debut + (p.fin - p.debut) * f, nom: p.def.id });
    }
    const tmp = path.join(outDir, "planche-tmp");
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    const echelle = Number(process.env.ECHELLE ?? 0.3);
    let n = 0;
    for (const i of instants) {
      const frame = Math.min(composition.durationInFrames - 1, Math.max(0, Math.round(i.t * composition.fps)));
      await renderStill({ composition, serveUrl, output: path.join(tmp, `${String(n++).padStart(3, "0")}.jpeg`), frame, inputProps: props, browserExecutable, chromiumOptions, scale: echelle, imageFormat: "jpeg", jpegQuality: 88 });
    }
    // 12 images par page (6 colonnes × 2 rangées) : assez grand pour juger chaque cadrage
    const parPage = Number(process.env.PAR_PAGE ?? 12);
    const cols = Number(process.env.COLONNES ?? 6);
    const base = `planche-${arg2 ?? quoi.replace(/[^a-z0-9]+/gi, "-")}`;
    const pages = Math.ceil(instants.length / parPage);
    for (let pg = 0; pg < pages; pg++) {
      const nb = Math.min(parPage, instants.length - pg * parPage);
      const c = Math.min(cols, nb);
      const out = path.join(outDir, pages > 1 ? `${base}-${pg + 1}.jpg` : `${base}.jpg`);
      execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", "1", "-start_number", String(pg * parPage), "-i", path.join(tmp, "%03d.jpeg"), "-vf", `tile=${c}x${Math.ceil(nb / c)}:padding=6:color=white`, "-frames:v", "1", "-q:v", "3", out]);
      console.log("planche ->", out, "|", instants.slice(pg * parPage, pg * parPage + nb).map((i) => `${i.nom}@${i.t.toFixed(2)}`).join(" "));
    }
    fs.rmSync(tmp, { recursive: true, force: true });
    return;
  }
  if (cmd === "image") {
    const out = path.join(outDir, `image-${arg}s.png`);
    await renderStill({ composition, serveUrl, output: out, frame: Math.round(Number(arg) * composition.fps), inputProps: props, browserExecutable, chromiumOptions });
    console.log("image ->", out);
    return;
  }
  const out = path.join(outDir, `${id}.mp4`);
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, inputProps: props, browserExecutable, chromiumOptions, crf: 20, pixelFormat: "yuv420p", ...(process.env.RENDER_CONCURRENCY ? { concurrency: Number(process.env.RENDER_CONCURRENCY) } : {}), ...(process.env.RENDER_RANGE ? { frameRange: process.env.RENDER_RANGE.split(",").map(Number) as [number, number] } : {}) });
  console.log("vidéo ->", out, minutage.voix ? "(avec voix)" : "(aperçu muet)");
}

if (cmd === "voix") await voix();
else if (cmd === "plans") listerPlans();
else if (cmd === "sous-titres") sousTitres();
else if (cmd === "storyboard") storyboard();
else await rendu();
