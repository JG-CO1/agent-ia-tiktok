/**
 * Choix de la voix : liste les modèles et voix du compte, puis compare plusieurs voix × modèles ElevenLabs
 * sur le vrai script d'un épisode (mêmes traitements audio que la production) avant de trancher à l'écoute.
 * Sortie : sorties/essais-voix/<épisode>/<voix>__<modèle>.mp3 + rapport.json.
 */
import fs from "node:fs";
import path from "node:path";
import { env } from "../lib/config";
import { writeJson } from "../lib/episodes";
import { run } from "../lib/exec";
import { FmError, log } from "../lib/log";
import { SORTIES_DIR } from "../lib/paths";
import type { Episode } from "../schema/episode";
import { apiBase, buildSpokenText, processVoice, synthesize, wordsFromAlignment } from "./voice";

interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
}

async function getJson<T>(p: string): Promise<{ status: number; data: T | null; text: string }> {
  const res = await fetch(`${apiBase()}${p}`, { headers: { "xi-api-key": env("ELEVENLABS_API_KEY", true)!, Accept: "application/json" } });
  const text = await res.text();
  let data: T | null = null;
  try {
    data = res.ok ? (JSON.parse(text) as T) : null;
  } catch {
    data = null;
  }
  return { status: res.status, data, text: text.slice(0, 300) };
}

/** Affiche les modèles de synthèse vocale et les voix disponibles pour ce compte. */
export async function voixInfos() {
  const models = await getJson<Array<{ model_id: string; name?: string; can_do_text_to_speech?: boolean; languages?: Array<{ language_id: string }> }>>("/v1/models");
  if (!models.data) throw new FmError(`Liste des modèles indisponible (${models.status} ${models.text})`, "voix");
  console.log("\nModèles de synthèse vocale (copier l'identifiant dans config/chaine.json > voix.modele) :");
  for (const m of models.data.filter((x) => x.can_do_text_to_speech !== false)) {
    const fr = m.languages ? m.languages.some((l) => l.language_id === "fr") : null;
    console.log(`  ${m.model_id.padEnd(30)} ${(m.name ?? "").padEnd(30)} français : ${fr === null ? "?" : fr ? "oui" : "non"}`);
  }
  // Voix du compte : API v2 d'abord, puis v1 (selon la version de l'API disponible)
  let voices = (await getJson<{ voices: Voice[] }>("/v2/voices?page_size=100")).data?.voices ?? null;
  if (!voices) voices = (await getJson<{ voices: Voice[] }>("/v1/voices")).data?.voices ?? null;
  console.log("\nVoix de ton compte (identifiant → config/chaine.json > voix.voice_id) :");
  if (!voices?.length) console.log("  (aucune : ajoute des voix à « My Voices » depuis la Voice Library)");
  for (const v of voices ?? []) {
    const labels = [v.labels?.gender, v.labels?.age, v.labels?.accent, v.labels?.use_case].filter(Boolean).join(", ");
    console.log(`  ${v.voice_id}  ${v.name.padEnd(24)} ${(v.category ?? "").padEnd(10)} ${labels}`);
  }
}

export interface EssaiOptions {
  voix: string[];
  modeles: string[];
  /** Nombre de scènes lues (défaut 2 : l'accroche et la suite, environ 15 à 20 s). */
  scenes?: number;
  /** Dossier de sortie (défaut : sorties/essais-voix). */
  sortie?: string;
}

export interface EssaiLigne {
  voix: string;
  nom?: string;
  modele: string;
  caracteres: number;
  fichier?: string;
  duree_s?: number;
  caracteres_par_s?: number;
  credits_estimes?: number;
  /** « oui » si le modèle renvoie un minutage exploitable pour les sous-titres. */
  minutage: string;
  erreur?: string;
}

export async function essaiVoix(ep: Episode, o: EssaiOptions): Promise<EssaiLigne[]> {
  const nScenes = Math.max(1, Math.min(o.scenes ?? 2, ep.scenes.length));
  const { text, tokens } = buildSpokenText(ep);
  const extractTokens = tokens.filter((t) => t.scene < nScenes);
  const extract = extractTokens.length ? text.slice(0, extractTokens[extractTokens.length - 1].end) : text;
  const dir = path.join(o.sortie ?? path.join(SORTIES_DIR, "essais-voix"), ep.id);
  fs.mkdirSync(dir, { recursive: true });
  log("info", "essai-voix", `${o.voix.length} voix × ${o.modeles.length} modèle(s) sur ${nScenes} scène(s) (${extract.length} caractères chacun)`);
  const rapport: EssaiLigne[] = [];
  for (const voiceId of o.voix) {
    // Nom lisible de la voix pour nommer les fichiers à écouter (repli : début de l'identifiant)
    const info = await getJson<{ name?: string }>(`/v1/voices/${encodeURIComponent(voiceId)}`).catch(() => null);
    const nomVoix = (info?.data?.name ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
    for (const model of o.modeles) {
      const base = `${nomVoix ? `${nomVoix}-${voiceId.slice(0, 6)}` : voiceId.slice(0, 10)}__${model}`;
      const raw = path.join(dir, `${base}.brut.mp3`);
      const out = path.join(dir, `${base}.mp3`);
      const ligne: EssaiLigne = { voix: voiceId, nom: info?.data?.name, modele: model, caracteres: extract.length, minutage: "non" };
      try {
        let al = null;
        try {
          al = await synthesize(extract, raw, { voiceId, model, timestamps: true, exigerMinutage: false });
        } catch (e) {
          // l'endpoint avec minutage est refusé pour ce modèle : on garde l'audio pour l'écoute
          ligne.minutage = `non (${(e as Error).message.slice(0, 140)})`;
          await synthesize(extract, raw, { voiceId, model, timestamps: false });
        }
        if (al) {
          try {
            const mots = wordsFromAlignment(extract, extractTokens, al);
            const croissant = mots.every((m, i) => i === 0 || m.debut >= mots[i - 1].debut);
            ligne.minutage = croissant ? `oui (${mots.length} mots)` : "non (minutage incohérent)";
          } catch (e) {
            ligne.minutage = `non (alignement inexploitable : ${(e as Error).message.slice(0, 100)})`;
          }
        } else if (ligne.minutage === "non") {
          ligne.minutage = "non (le modèle ne renvoie pas de minutage mot à mot)";
        }
        await processVoice(raw, out);
        fs.rmSync(raw, { force: true });
        const duree = parseFloat((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out])).stdout);
        Object.assign(ligne, {
          fichier: path.relative(process.cwd(), out),
          duree_s: +duree.toFixed(1),
          caracteres_par_s: +(extract.length / duree).toFixed(1),
          credits_estimes: extract.length,
        });
      } catch (e) {
        ligne.erreur = (e as Error).message.slice(0, 300);
      }
      rapport.push(ligne);
      log(ligne.erreur ? "erreur" : "ok", "essai-voix", `${voiceId} / ${model} : ${ligne.erreur ?? `${ligne.duree_s} s, minutage ${ligne.minutage}`}`);
    }
  }
  writeJson(path.join(dir, "rapport.json"), { episode: ep.id, extrait: extract, date: new Date().toISOString(), essais: rapport });
  console.log(`\nÉcoute les fichiers de ${path.relative(process.cwd(), dir)}/ puis reporte ta préférence dans config/chaine.json (voix.voice_id, voix.modele).`);
  console.log("Crédits estimés à 1 par caractère (peut varier selon le modèle : vérifier dans ton compte ElevenLabs).");
  return rapport;
}

// ---------------------------------------------------------------------------------------------------------------
// Voice Library (voix partagées par la communauté ElevenLabs) : chercher des candidates puis les ajouter au compte.
// L'API ne permet d'utiliser une voix de la bibliothèque qu'une fois ajoutée à « My Voices » (offre payante requise).

export interface VoixPartagee {
  public_owner_id: string;
  voice_id: string;
  name: string;
  gender?: string;
  age?: string;
  accent?: string;
  language?: string;
  locale?: string;
  use_case?: string;
  descriptive?: string;
  category?: string;
  description?: string;
  cloned_by_count?: number;
  usage_character_count_1y?: number;
  preview_url?: string;
  verified_languages?: Array<{ language?: string; accent?: string; locale?: string; model_id?: string }>;
}

export interface RechercheOptions {
  langue?: string;
  genre?: string;
  age?: string;
  accent?: string;
  usage?: string;
  recherche?: string;
  nombre?: number;
  tri?: string;
  /** Fichier de sortie (défaut : sorties/voix-bibliotheque.json). */
  fichier?: string;
}

/** Cherche des voix dans la Voice Library et écrit la liste complète dans sorties/voix-bibliotheque.json. */
export async function voixBibliotheque(o: RechercheOptions = {}): Promise<VoixPartagee[]> {
  const q = new URLSearchParams({ page_size: String(Math.min(100, Math.max(1, o.nombre ?? 20))) });
  if (o.langue) q.set("language", o.langue);
  if (o.genre) q.set("gender", o.genre);
  if (o.age) q.set("age", o.age);
  if (o.accent) q.set("accent", o.accent);
  if (o.usage) q.set("use_cases", o.usage);
  if (o.recherche) q.set("search", o.recherche);
  if (o.tri) q.set("sort", o.tri);
  const r = await getJson<{ voices?: VoixPartagee[] }>(`/v1/shared-voices?${q}`);
  if (!r.data) throw new FmError(`Voice Library indisponible (${r.status} ${r.text})`, "voix");
  const voix = r.data.voices ?? [];
  console.log(`\n${voix.length} voix (${[o.langue, o.genre, o.age, o.accent, o.usage, o.recherche].filter(Boolean).join(", ") || "sans filtre"}) :`);
  for (const v of voix) {
    const tags = [v.gender, v.age, v.accent, v.use_case, v.descriptive].filter(Boolean).join(", ");
    console.log(`  ${v.name.slice(0, 26).padEnd(26)} ${String(v.cloned_by_count ?? "?").padStart(7)} ajouts  ${tags}`);
    console.log(`      voix-ajouter ${v.public_owner_id} ${v.voice_id}   ${(v.description ?? "").replace(/\s+/g, " ").slice(0, 110)}`);
  }
  writeJson(o.fichier ?? path.join(SORTIES_DIR, "voix-bibliotheque.json"), { date: new Date().toISOString(), filtres: { ...o, fichier: undefined }, voix });
  return voix;
}

/** Ajoute une voix de la bibliothèque à « My Voices » ; renvoie l'identifiant utilisable pour la synthèse. */
export async function voixAjouter(publicOwnerId: string, voiceId: string, nom?: string): Promise<string> {
  const res = await fetch(`${apiBase()}/v1/voices/add/${encodeURIComponent(publicOwnerId)}/${encodeURIComponent(voiceId)}`, {
    method: "POST",
    headers: { "xi-api-key": env("ELEVENLABS_API_KEY", true)!, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ new_name: nom ?? `Ecto ${voiceId.slice(0, 6)}` }),
  });
  const text = await res.text();
  if (!res.ok) throw new FmError(`Ajout de la voix ${voiceId} refusé (${res.status}) : ${text.slice(0, 300)}`, "voix");
  const id = (JSON.parse(text) as { voice_id?: string }).voice_id ?? voiceId;
  log("ok", "voix", `Voix ajoutée à « My Voices » : ${nom ?? voiceId} -> ${id}`);
  return id;
}
