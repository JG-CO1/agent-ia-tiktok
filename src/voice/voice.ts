/**
 * Voix off : synthèse (ElevenLabs en production, moteur local de secours pour les tests),
 * minutage mot à mot, traitement audio et enveloppe pour la synchronisation labiale.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chaine, env } from "../lib/config";
import { readJson, writeJson } from "../lib/episodes";
import { run } from "../lib/exec";
import { FmError, log, messageErreur } from "../lib/log";
import { CONFIG_DIR, episodeFile } from "../lib/paths";
import { tokenizeScenes, type Token } from "../core/text";
import { FPS, type VoiceTiming, type VoiceWord } from "../core/timeline";
import type { Episode } from "../schema/episode";
import { tonsDesScenes, type Ton } from "../core/colere";

export interface SpokenToken extends Token {
  /** Position du mot (version prononcée) dans le texte envoyé au moteur. */
  start: number;
  end: number;
}

/** Texte de synthèse + correspondance caractère -> mot (avec le dictionnaire de prononciation). */
export function buildSpokenText(ep: Episode): { text: string; tokens: SpokenToken[] } {
  const dict = readJson<{ remplacements: Record<string, string> }>(path.join(CONFIG_DIR, "prononciation.json"))?.remplacements ?? {};
  const tokens = tokenizeScenes(ep.scenes.map((s) => s.voix));
  let text = "";
  const out: SpokenToken[] = [];
  for (const tk of tokens) {
    // le mot nu (sans ponctuation) peut être remplacé ; la ponctuation est conservée pour la prosodie
    const m = tk.spoken.match(/^(.*?)([\s?!:;,.…»"')]*)$/u);
    const core = m?.[1] ?? tk.spoken;
    const tail = m?.[2] ?? "";
    const spoken = (dict[core] ?? core.replace(/(\d)\u202F(?=\d{3})/g, "$1")) + tail;
    if (text) text += " ";
    const start = text.length;
    text += spoken;
    out.push({ ...tk, spoken, start, end: text.length });
  }
  return { text, tokens: out };
}

// ---------------------------------------------------------------- ElevenLabs
export interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

/** Adresse de l'API (surchargeable pour les tests : ELEVENLABS_BASE_URL). */
export const apiBase = () => (env("ELEVENLABS_BASE_URL") ?? "https://api.elevenlabs.io").replace(/\/$/, "");

export function resolveVoiceId(): string {
  const id = env("ELEVENLABS_VOICE_ID") ?? chaine().voix.voice_id;
  if (!id || id.startsWith("A_CHOISIR")) throw new FmError("Aucune voix ElevenLabs choisie (config/chaine.json > voix.voice_id ou ELEVENLABS_VOICE_ID).", "voix");
  return id;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
}

/**
 * Réglages ElevenLabs de chaque ton d'Ecto (les valeurs de base viennent de config/chaine.json) :
 * doux = stable, lent, peu appuyé ; énervé = moins stable, plus appuyé, plus rapide ; furie = cri théâtral, débit rapide.
 */
export function reglagesTon(ton: Ton): VoiceSettings {
  const v = chaine().voix;
  const base: VoiceSettings = { stability: v.stabilite, similarity_boost: v.similarite, style: v.style, speed: v.vitesse };
  const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
  switch (ton) {
    case "doux":
      return { ...base, stability: clamp(base.stability + 0.22, 0, 1), style: clamp(base.style - 0.25, 0, 1), speed: clamp(base.speed - 0.08, 0.7, 1.2) };
    case "enerve":
      return { ...base, stability: 0.25, style: 0.8, speed: clamp(base.speed + 0.05, 0.7, 1.2) };
    case "furie":
      return { ...base, stability: 0.15, style: 1, speed: clamp(base.speed + 0.08, 0.7, 1.2) };
    default:
      return base;
  }
}

/**
 * Nuances de jeu : étiquettes d'émotion ElevenLabs (mesurées : « [angry] » monte la hauteur de ~186 à ~258 Hz, « [shouting] » à ~314 Hz
 * avec plus d'énergie aiguë ; « [softly] » / « [calm] » baissent le niveau et la hauteur).
 * La colère n'est pas uniforme : elle monte de phrase en phrase et chaque virgule la fait monter d'un cran, comme un vrai
 * emportement ; le premier passage calme après un cri commence par un soupir.
 */
export function etiquettesTon(ton: Ton, tokens: Array<{ spoken: string }>, apresColere: boolean): Map<number, string> {
  const tags = new Map<number, string>();
  if (ton === "normal" || tokens.length === 0) return tags;
  // bornes des phrases (mot final : . ? ! …)
  const debuts: number[] = [0];
  tokens.forEach((tk, i) => {
    if (i + 1 < tokens.length && /[.?!…]["»')]*$/u.test(tk.spoken)) debuts.push(i + 1);
  });
  if (ton === "doux") {
    tags.set(0, apresColere ? "[sighs] [calm]" : "[calm]");
    return tags;
  }
  const n = debuts.length;
  const niveaux = ton === "furie" ? ["[angry]", "[angry][shouting]"] : ["[annoyed]", "[angry]"];
  debuts.forEach((d, k) => {
    const fin = debuts[k + 1] ?? tokens.length;
    // la dernière phrase est la plus intense ; les précédentes montent progressivement
    const haut = k === n - 1 && n > 1;
    tags.set(d, haut ? niveaux[1] : niveaux[0]);
    // après chaque virgule, un cran de plus : « MAIS TU LE FAIS EXPRÈS OU QUOI, [shouting] FRÉROT ?! »
    for (let i = d; i < fin - 1; i++) {
      if (/,["»')]*$/u.test(tokens[i].spoken)) tags.set(i + 1, ton === "furie" ? "[shouting]" : "[angry]");
    }
  });
  return tags;
}

/** Traitement audio de chaque ton : le calme est adouci et plus bas ; la colère est plus forte, compressée, brillante. */
export const FILTRE_TON: Record<Ton, string> = {
  normal: "anull",
  doux: "volume=-2.5dB,lowpass=f=7800,acompressor=threshold=-24dB:ratio=2",
  enerve: "volume=1.5dB,highpass=f=100,acompressor=threshold=-18dB:ratio=3.2:attack=4:release=90:makeup=2",
  furie: "volume=4dB,highpass=f=120,equalizer=f=3200:t=q:w=1:g=3,acompressor=threshold=-16dB:ratio=5:attack=3:release=70:makeup=3,asoftclip=type=tanh",
};

export interface SynthOptions {
  voiceId: string;
  model: string;
  /** true : endpoint /with-timestamps (minutage par caractère) ; false : audio seul. */
  timestamps?: boolean;
  /** Réglages de voix propres à cet appel (ton d'Ecto : calme, énervé, furie) ; par défaut ceux de config/chaine.json. */
  settings?: Partial<VoiceSettings>;
  /** Si le modèle ne renvoie pas de minutage : false = on garde l'audio et on renvoie null (essais), true = erreur (production). */
  exigerMinutage?: boolean;
  /** réglages propres à une vidéo (ex. voix plus expressive et plus rapide pour un récit d'horreur) */
  reglages?: Partial<{ stabilite: number; similarite: number; style: number; vitesse: number }>;
}

/**
 * Synthèse ElevenLabs. Renvoie l'alignement caractère par caractère (null si pas de minutage).
 * Reprises automatiques sur 429/5xx ; si l'API refuse `language_code` pour ce modèle, on réessaie sans.
 */
export async function synthesize(text: string, outMp3: string, o: SynthOptions): Promise<Alignment | null> {
  const key = env("ELEVENLABS_API_KEY", true)!;
  const v = { ...chaine().voix, ...(o.reglages ?? {}) };
  const withTs = o.timestamps !== false;
  const url = `${apiBase()}/v1/text-to-speech/${encodeURIComponent(o.voiceId)}${withTs ? "/with-timestamps" : ""}?output_format=mp3_44100_128`;
  let forceLanguage = true;
  let lastErr = "";
  for (let attempt = 1; attempt <= 4; attempt++) {
    const body = {
      text,
      model_id: o.model,
      ...(forceLanguage ? { language_code: "fr" } : {}),
      voice_settings: {
        stability: v.stabilite,
        similarity_boost: v.similarite,
        style: v.style,
        use_speaker_boost: true,
        speed: v.vitesse,
        ...(o.settings ?? {}),
      },
    };
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: withTs ? "application/json" : "audio/mpeg" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });
    } catch (e) {
      // Réseau coupé ou délai dépassé (panne passagère d'ElevenLabs) : on réessaie, plus patiemment que pour un 5xx.
      lastErr = `injoignable (${messageErreur(e)})`;
      if (attempt === 4) break;
      const wait = 5000 * attempt * attempt;
      log("warn", "voix", `ElevenLabs ${lastErr}, nouvel essai dans ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (res.ok) {
      if (!withTs) {
        fs.writeFileSync(outMp3, Buffer.from(await res.arrayBuffer()));
        return null;
      }
      const data = (await res.json()) as { audio_base64?: string; alignment?: Alignment | null; normalized_alignment?: Alignment | null };
      const al = data.alignment ?? data.normalized_alignment ?? null;
      if (data.audio_base64) fs.writeFileSync(outMp3, Buffer.from(data.audio_base64, "base64"));
      if (!data.audio_base64 || (!al && o.exigerMinutage !== false)) {
        throw new FmError(
          `ElevenLabs (${o.model}) n'a pas renvoyé de minutage par caractère : les sous-titres synchronisés en dépendent. Choisir un autre modèle (config/chaine.json > voix.modele ; \`npm run fm -- voix-infos\` liste les modèles).`,
          "voix",
        );
      }
      return al;
    }
    const detail = (await res.text()).slice(0, 300);
    lastErr = `${res.status} ${detail}`;
    if ((res.status === 400 || res.status === 422) && forceLanguage && /language/i.test(detail)) {
      log("info", "voix", `Le modèle ${o.model} refuse language_code : nouvel essai sans`);
      forceLanguage = false;
      continue;
    }
    if (res.status < 500 && res.status !== 429) break; // 400/401/402/404/422 : inutile de réessayer
    if (attempt === 4) break;
    const wait = 2000 * attempt * attempt;
    log("warn", "voix", `ElevenLabs ${res.status}, nouvel essai dans ${wait / 1000}s`);
    await new Promise((r) => setTimeout(r, wait));
  }
  throw new FmError(`ElevenLabs (${o.model}) a échoué : ${lastErr}`, "voix");
}

async function elevenlabs(text: string, outMp3: string): Promise<Alignment> {
  const al = await synthesize(text, outMp3, { voiceId: resolveVoiceId(), model: chaine().voix.modele, timestamps: true });
  if (!al) throw new FmError("ElevenLabs : minutage absent", "voix");
  return al;
}

/** Minutage des mots depuis l'alignement caractère par caractère. */
export function wordsFromAlignment(text: string, tokens: SpokenToken[], al: Alignment): VoiceWord[] {
  let chars = al.characters;
  let starts = al.character_start_times_seconds;
  let ends = al.character_end_times_seconds;
  if (chars.join("") !== text) {
    // Réaligne en ignorant les espaces si le moteur a normalisé le texte
    const map: number[] = [];
    let j = 0;
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) {
        map.push(-1);
        continue;
      }
      while (j < chars.length && /\s/.test(chars[j])) j++;
      map.push(j < chars.length ? j : chars.length - 1);
      j++;
    }
    const s2: number[] = [];
    const e2: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const k = map[i] >= 0 ? map[i] : map[Math.max(0, i - 1)] ?? 0;
      s2.push(starts[k] ?? 0);
      e2.push(ends[k] ?? 0);
    }
    chars = text.split("");
    starts = s2;
    ends = e2;
  }
  return tokens.map((tk) => {
    let a = tk.start;
    let b = tk.end - 1;
    while (a < b && /[^\p{L}\p{N}]/u.test(chars[a])) a++;
    while (b > a && /[^\p{L}\p{N}]/u.test(chars[b])) b--;
    return { texte: tk.display, debut: +starts[a].toFixed(3), fin: +ends[b].toFixed(3), scene: tk.scene, emphase: tk.emphasis };
  });
}

// ---------------------------------------------------------------- Moteur local (secours, non publiable)
async function localEngine(tokens: SpokenToken[], outWav: string): Promise<VoiceWord[]> {
  const voice = chaine().voix.voix_locale;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fm-voix-"));
  // Découpe en phrases (on synthétise phrase par phrase pour connaître leurs bornes exactes)
  const sentences: SpokenToken[][] = [];
  let cur: SpokenToken[] = [];
  tokens.forEach((tk, i) => {
    cur.push(tk);
    const next = tokens[i + 1];
    if (!next || next.scene !== tk.scene || /[.?!…:]$/.test(tk.spoken)) {
      sentences.push(cur);
      cur = [];
    }
  });
  const parts: string[] = [];
  const words: VoiceWord[] = [];
  let t = 0.1;
  const silence = path.join(tmp, "sil.wav");
  await run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "0.14", silence]);
  const lead = path.join(tmp, "lead.wav");
  await run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "0.1", lead]);
  parts.push(lead);
  for (const [k, sent] of sentences.entries()) {
    const raw = path.join(tmp, `s${k}.wav`);
    const wav = path.join(tmp, `s${k}-48k.wav`);
    await run("espeak-ng", ["-v", voice, "-s", "172", "-p", "48", "-w", raw, sent.map((s) => s.spoken).join(" ")]);
    await run("ffmpeg", ["-y", "-v", "error", "-i", raw, "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse", "-ar", "48000", "-ac", "1", wav]);
    const dur = parseFloat((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav])).stdout);
    // Répartition proportionnelle à la longueur des mots (le débit d'espeak est régulier)
    const weights = sent.map((s) => s.spoken.replace(/[^\p{L}\p{N}]/gu, "").length + 1.2);
    const total = weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    sent.forEach((s, i) => {
      const a = t + (acc / total) * dur;
      acc += weights[i];
      const b = t + (acc / total) * dur;
      words.push({ texte: s.display, debut: +a.toFixed(3), fin: +(b - 0.02).toFixed(3), scene: s.scene, emphase: s.emphasis });
    });
    parts.push(wav, silence);
    t += dur + 0.14;
  }
  const list = path.join(tmp, "list.txt");
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
  await run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", outWav]);
  fs.rmSync(tmp, { recursive: true, force: true });
  return words;
}

/** Pause maximale (s) conservée entre deux mots, par ton : les mots s'enchaînent ; le calme garde un peu de souffle. */
export const PAUSE_MAX: Record<Ton, number> = { normal: 0.16, doux: 0.26, enerve: 0.12, furie: 0.1 };

/**
 * Resserre la voix : supprime le silence de tête et de queue et raccourcit toute pause entre deux mots à `pauseMax`.
 * Les coupes tombent au milieu des silences (fondus de 4 ms) et le minutage des mots est recalculé : sous-titres et lèvres restent synchrones.
 */
export async function resserrer(entree: string, sortie: string, mots: VoiceWord[], pauseMax: number): Promise<VoiceWord[]> {
  if (mots.length === 0) {
    fs.copyFileSync(entree, sortie);
    return mots;
  }
  const dureeTotale = parseFloat((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", entree])).stdout);
  const debut = Math.max(0, mots[0].debut - 0.03);
  const fin = Math.min(dureeTotale, mots[mots.length - 1].fin + 0.1);
  const segments: Array<[number, number]> = [];
  const coupes: Array<[number, number]> = [];
  let a = debut;
  for (let i = 0; i + 1 < mots.length; i++) {
    const trou = mots[i + 1].debut - mots[i].fin;
    if (trou > pauseMax + 0.03) {
      const ka = mots[i].fin + pauseMax / 2;
      const kb = mots[i + 1].debut - pauseMax / 2;
      segments.push([a, ka]);
      coupes.push([ka, kb]);
      a = kb;
    }
  }
  segments.push([a, fin]);
  const f = segments.map(([s0, e0], k) => {
    const d = Math.max(0.01, e0 - s0);
    return `[0:a]atrim=start=${s0.toFixed(4)}:end=${e0.toFixed(4)},asetpts=PTS-STARTPTS,afade=t=in:d=0.004,afade=t=out:st=${Math.max(0, d - 0.004).toFixed(4)}:d=0.004[s${k}]`;
  });
  const concat = `${segments.map((_, k) => `[s${k}]`).join("")}concat=n=${segments.length}:v=0:a=1[out]`;
  await run("ffmpeg", ["-y", "-v", "error", "-i", entree, "-filter_complex", [...f, concat].join(";"), "-map", "[out]", "-ar", "48000", "-ac", "1", sortie]);
  const retire = (t: number) => coupes.reduce((acc, [ka, kb]) => (kb <= t ? acc + (kb - ka) : acc), 0);
  return mots.map((w) => ({ ...w, debut: +(w.debut - debut - retire(w.debut)).toFixed(3), fin: +(w.fin - debut - retire(w.fin)).toFixed(3) }));
}

/** Découpe la narration en groupes de scènes consécutives de même ton (un appel de synthèse par groupe). */
export function groupesParTon(tons: Ton[]): Array<{ ton: Ton; de: number; a: number }> {
  const out: Array<{ ton: Ton; de: number; a: number }> = [];
  tons.forEach((t, i) => {
    const last = out[out.length - 1];
    if (last && last.ton === t) last.a = i;
    else out.push({ ton: t, de: i, a: i });
  });
  return out;
}

/** Texte de synthèse d'un sous-ensemble de mots (étiquettes d'émotion insérées avant certains mots), positions relatives à ce texte. */
function texteDe(tokens: SpokenToken[], etiquettes: Map<number, string> = new Map()): { text: string; tokens: SpokenToken[] } {
  let text = "";
  const out: SpokenToken[] = [];
  tokens.forEach((tk, i) => {
    if (text) text += " ";
    const tag = etiquettes.get(i);
    if (tag) text += tag + " ";
    const start = text.length;
    text += tk.spoken;
    out.push({ ...tk, start, end: text.length });
  });
  return { text, tokens: out };
}

/**
 * Voix à plusieurs tempéraments : chaque groupe de scènes de même ton est synthétisé avec ses réglages, traité (calme adouci,
 * colère forte), puis assemblé avec un silence entre les groupes (plus long quand il « s'arrête brutalement » pour se calmer).
 */
async function voixParTons(ep: Episode, tokens: SpokenToken[], tons: Ton[], outWav: string): Promise<{ words: VoiceWord[]; alignements: unknown[] }> {
  const groupes = groupesParTon(tons);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fm-tons-"));
  const parts: string[] = [];
  const words: VoiceWord[] = [];
  const alignements: unknown[] = [];
  let t = 0;
  const silence = async (sec: number, name: string) => {
    const f = path.join(tmp, name);
    await run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", sec.toFixed(3), f]);
    parts.push(f);
    t += sec;
  };
  for (const [k, gr] of groupes.entries()) {
    if (k > 0) {
      const apresCri = (groupes[k - 1].ton === "furie" || groupes[k - 1].ton === "enerve") && gr.ton === "doux";
      await silence(apresCri ? 0.2 : 0.05, `gap${k}.wav`);
    }
    const apresColere = k > 0 && (groupes[k - 1].ton === "furie" || groupes[k - 1].ton === "enerve");
    const brut = tokens.filter((tk) => tk.scene >= gr.de && tk.scene <= gr.a);
    const sub = texteDe(brut, etiquettesTon(gr.ton, brut, apresColere));
    const mp3 = path.join(tmp, `g${k}.mp3`);
    log("info", "voix", `ElevenLabs (${chaine().voix.modele}) ton « ${gr.ton} » : scènes ${gr.de + 1}–${gr.a + 1}, ${sub.text.length} caractères`);
    const al = await synthesize(sub.text, mp3, { voiceId: resolveVoiceId(), model: chaine().voix.modele, timestamps: true, settings: reglagesTon(gr.ton) });
    if (!al) throw new FmError("ElevenLabs : minutage absent", "voix");
    alignements.push({ ton: gr.ton, scenes: [gr.de, gr.a], alignement: al });
    const wav = path.join(tmp, `g${k}.wav`);
    await run("ffmpeg", ["-y", "-v", "error", "-i", mp3, "-af", FILTRE_TON[gr.ton], "-ar", "48000", "-ac", "1", wav]);
    const serre = path.join(tmp, `g${k}-serre.wav`);
    const mg = await resserrer(wav, serre, wordsFromAlignment(sub.text, sub.tokens, al), PAUSE_MAX[gr.ton]);
    const dur = parseFloat((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", serre])).stdout);
    for (const w of mg) words.push({ ...w, debut: +(w.debut + t).toFixed(3), fin: +(w.fin + t).toFixed(3) });
    parts.push(serre);
    t += dur;
  }
  const list = path.join(tmp, "list.txt");
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
  await run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c:a", "pcm_s16le", outWav]);
  fs.rmSync(tmp, { recursive: true, force: true });
  void ep;
  return { words, alignements };
}

// ---------------------------------------------------------------- Post-traitement
/** Chaîne « broadcast » légère : coupe-bas, compression douce, niveau homogène. */
export async function processVoice(input: string, output: string) {
  await run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    input,
    "-af",
    "highpass=f=75,acompressor=threshold=-20dB:ratio=2.6:attack=6:release=140:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=9",
    "-ar",
    "48000",
    "-ac",
    "1",
    output,
  ]);
}

/** Enveloppe RMS par frame (0..1), normalisée au 95e centile, pour animer la bouche. */
export async function envelopeOf(wav: string, fps = FPS): Promise<number[]> {
  const { stdout } = await runBuffer("ffmpeg", ["-v", "error", "-i", wav, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"]);
  const samples = new Int16Array(stdout.buffer, stdout.byteOffset, Math.floor(stdout.length / 2));
  const per = 16000 / fps;
  const n = Math.ceil(samples.length / per);
  const rms: number[] = [];
  for (let f = 0; f < n; f++) {
    let s = 0;
    const a = Math.floor(f * per);
    const b = Math.min(samples.length, Math.floor((f + 1) * per));
    for (let i = a; i < b; i++) s += (samples[i] / 32768) ** 2;
    rms.push(Math.sqrt(s / Math.max(1, b - a)));
  }
  const sorted = [...rms].sort((x, y) => x - y);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 1;
  return rms.map((v) => {
    const x = Math.min(1, v / p95);
    return x < 0.12 ? 0 : +x.toFixed(2);
  });
}

function runBuffer(cmd: string, args: string[]): Promise<{ stdout: Buffer }> {
  return new Promise((resolve, reject) => {
    import("node:child_process").then(({ spawn }) => {
      const p = spawn(cmd, args);
      const chunks: Buffer[] = [];
      p.stdout.on("data", (d: Buffer) => chunks.push(d));
      p.on("error", reject);
      p.on("close", (code) => (code === 0 ? resolve({ stdout: Buffer.concat(chunks) }) : reject(new Error(`${cmd} code ${code}`))));
    });
  });
}

/** Génère la voix d'un épisode : voix.wav (traitée) + voix.json (minutage, enveloppe). */
export async function generateVoice(ep: Episode, opts: { local?: boolean } = {}): Promise<VoiceTiming> {
  const cfg = chaine().voix;
  const useLocal = opts.local || cfg.fournisseur === "local";
  const { text, tokens } = buildSpokenText(ep);
  const rawFile = episodeFile(ep.id, useLocal ? "voix-brute.wav" : "voix-brute.mp3");
  const outWav = episodeFile(ep.id, "voix.wav");
  let words: VoiceWord[];
  let rawOverride: string | null = null;
  if (useLocal) {
    log("warn", "voix", "Moteur local de secours (qualité test) : la vidéo ne sera PAS publiable.");
    words = await localEngine(tokens, rawFile);
  } else if (new Set(tonsDesScenes(ep.scenes)).size > 1 || tonsDesScenes(ep.scenes)[0] !== "normal") {
    // Ecto change de tempérament : une synthèse par groupe de scènes de même ton
    const raw = episodeFile(ep.id, "voix-brute.wav");
    const r = await voixParTons(ep, tokens, tonsDesScenes(ep.scenes), raw);
    writeJson(episodeFile(ep.id, "alignement-elevenlabs.json"), r.alignements);
    words = r.words;
    rawOverride = raw;
  } else {
    log("info", "voix", `ElevenLabs (${cfg.modele}), ${text.length} caractères`);
    const al = await elevenlabs(text, rawFile);
    writeJson(episodeFile(ep.id, "alignement-elevenlabs.json"), al);
    words = wordsFromAlignment(text, tokens, al);
    const serre = episodeFile(ep.id, "voix-serree.wav");
    words = await resserrer(rawFile, serre, words, PAUSE_MAX.normal);
    rawOverride = serre;
  }
  await processVoice(rawOverride ?? rawFile, outWav);
  const duree = parseFloat((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", outWav])).stdout);
  const timing: VoiceTiming = {
    fournisseur: useLocal ? "local" : "elevenlabs",
    modele: useLocal ? `espeak-ng/${cfg.voix_locale}` : cfg.modele,
    voix: useLocal ? cfg.voix_locale : env("ELEVENLABS_VOICE_ID") ?? cfg.voice_id,
    fichier: "voix.wav",
    duree: +duree.toFixed(3),
    fps: FPS,
    mots: words,
    enveloppe: await envelopeOf(outWav),
    genere_le: new Date().toISOString(),
    qualite_production: !useLocal,
  };
  writeJson(episodeFile(ep.id, "voix.json"), timing);
  log("ok", "voix", `${words.length} mots, ${duree.toFixed(1)} s (${timing.fournisseur})`);
  return timing;
}
