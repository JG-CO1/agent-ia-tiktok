/**
 * Contrôle qualité automatique. Toute vérification « bloquante » en échec interdit la publication.
 * Rapport : episodes/<id>/qc.json
 */
import fs from "node:fs";
import path from "node:path";
import { chaine } from "../lib/config";
import { journal, readJson, saveEpisode, writeJson } from "../lib/episodes";
import { run } from "../lib/exec";
import { log } from "../lib/log";
import { CONFIG_DIR, DATA_DIR, episodeDir, episodeFile, PUBLIC_DIR, ROOT } from "../lib/paths";
import { missingCueWords, type VoiceTiming } from "../core/timeline";
import { tokenizeScenes } from "../core/text";
import { narration, type Episode } from "../schema/episode";
import { editorialLint } from "./editorial";
import { spellCheck } from "./spell";
import { ghostVersion } from "../lib/ghost";
export { ghostVersion };

export interface Check {
  nom: string;
  ok: boolean;
  bloquant: boolean;
  detail: string;
}

export interface QcReport {
  episode: string;
  date: string;
  ok: boolean;
  publiable: boolean;
  fantome_version: string;
  checks: Check[];
  orthographe_a_revoir: string[];
  revue_visuelle: { statut: "a_faire" | "ok" | "ko"; note?: string; date?: string };
}

async function probe(file: string) {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]);
  return JSON.parse(stdout) as {
    streams: Array<{ codec_type: string; codec_name: string; width?: number; height?: number; r_frame_rate?: string; pix_fmt?: string; sample_rate?: string }>;
    format: { duration: string; size: string };
  };
}

async function audioStats(file: string) {
  const { stderr } = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true,silencedetect=noise=-45dB:d=1.2", "-f", "null", "-"]).catch((e) => ({ stderr: String(e) }));
  const I = Number(stderr.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)?.[0] ?? NaN);
  const tpm = stderr.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop()?.match(/-?[\d.]+/)?.[0];
  const silences: Array<[number, number]> = [];
  const re = /silence_start: (-?[\d.]+)[\s\S]*?silence_end: ([\d.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stderr))) silences.push([Number(m[1]), Number(m[2])]);
  return { I, TP: tpm ? Number(tpm) : NaN, silences };
}

async function videoDefects(file: string) {
  const { stderr } = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-vf", "blackdetect=d=0.25:pic_th=0.97,freezedetect=n=0.0015:d=1.6", "-an", "-f", "null", "-"]).catch((e) => ({ stderr: String(e) }));
  return {
    black: (stderr.match(/black_start/g) ?? []).length,
    freezes: (stderr.match(/freeze_start/g) ?? []).length,
  };
}

function onScreenTexts(ep: Episode): string[] {
  const out: string[] = [];
  for (const s of ep.scenes) {
    const v = s as Record<string, unknown>;
    for (const k of ["titre", "sur_titre", "description", "legende", "texte", "sous_titre"]) if (typeof v[k] === "string") out.push(v[k] as string);
    if (s.type === "etapes") s.etapes.forEach((e) => out.push(e.titre, e.detail ?? ""));
    if (s.type === "liste") s.items.forEach((i) => out.push(i.texte));
    if (s.type === "comparaison") out.push(...s.gauche.points, ...s.droite.points);
    if (s.type === "repo") out.push(...(s.points ?? []));
  }
  return out.filter(Boolean);
}

export async function runQc(ep: Episode, opts: { visuel?: "ok" | "ko"; note?: string } = {}): Promise<QcReport> {
  const c = chaine();
  const checks: Check[] = [];
  const add = (nom: string, ok: boolean, bloquant: boolean, detail: string) => checks.push({ nom, ok, bloquant, detail });

  // 1. Règles éditoriales
  const lint = editorialLint(ep);
  const blocking = lint.filter((i) => i.bloquant);
  add("regles_editoriales", blocking.length === 0, true, blocking.map((i) => i.message).join(" | ") || `${lint.length} remarque(s) non bloquante(s)`);
  for (const i of lint.filter((x) => !x.bloquant)) add("remarque", false, false, i.message);

  // 2. Vérification des faits
  const verif = readJson<{ ok: boolean; date: string; affirmations: Array<{ id: string; statut: string }> }>(episodeFile(ep.id, "verification.json"));
  const allVerified = ep.affirmations.every((a) => a.statut === "verifiee");
  add("faits_verifies", Boolean(verif?.ok) && allVerified, true, verif ? `${ep.affirmations.filter((a) => a.statut === "verifiee").length}/${ep.affirmations.length} affirmations vérifiées (${verif.date})` : "`fm verifier` non exécuté");

  // 3. Voix
  const voice = readJson<VoiceTiming>(episodeFile(ep.id, "voix.json"));
  add("voix_presente", Boolean(voice), true, voice ? `${voice.fournisseur} / ${voice.modele}` : "voix absente");
  add("voix_production", Boolean(voice?.qualite_production), true, voice?.qualite_production ? "voix de production" : "voix de test locale : non publiable");
  if (voice) {
    const expected = tokenizeScenes(ep.scenes.map((s) => s.voix)).length;
    add("sous_titres_couverture", voice.mots.length === expected, true, `${voice.mots.length}/${expected} mots minutés`);
    let mono = true;
    for (let i = 1; i < voice.mots.length; i++) if (voice.mots[i].debut + 0.001 < voice.mots[i - 1].debut || voice.mots[i].fin > voice.duree + 0.5) mono = false;
    add("sous_titres_synchro", mono, true, mono ? "minutage croissant et dans la durée" : "minutage incohérent");
    const firstWord = voice.mots[0]?.debut ?? 99;
    add("accroche_immediate", firstWord <= 0.45, true, `premier mot à ${firstWord.toFixed(2)} s`);
    const missing = missingCueWords(ep, voice);
    add("reperes_mots", missing.length === 0, false, missing.length ? `introuvables : ${missing.join(", ")}` : "tous les temps forts sont calés");
  }

  // 4. Fichier vidéo
  const video = episodeFile(ep.id, "video.mp4");
  if (!fs.existsSync(video)) {
    add("video_presente", false, true, "video.mp4 absente (lancer `fm rendu`)");
  } else {
    const p = await probe(video);
    const v = p.streams.find((s) => s.codec_type === "video");
    const a = p.streams.find((s) => s.codec_type === "audio");
    const dur = Number(p.format.duration);
    add("format_vertical", v?.width === 1080 && v?.height === 1920, true, `${v?.width}x${v?.height}`);
    add("codec", v?.codec_name === "h264" && v?.pix_fmt === "yuv420p" && a?.codec_name === "aac", true, `${v?.codec_name}/${v?.pix_fmt} + ${a?.codec_name ?? "pas d'audio"}`);
    add("cadence", v?.r_frame_rate === "30/1", true, `${v?.r_frame_rate} i/s`);
    add("duree", dur >= c.duree.min && dur <= c.duree.max + 1, true, `${dur.toFixed(1)} s (cible ${c.duree.min}–${c.duree.max} s)`);
    add("poids", Number(p.format.size) < 280e6, true, `${(Number(p.format.size) / 1e6).toFixed(1)} Mo`);
    add("poids_optimal", Number(p.format.size) < 60e6, false, Number(p.format.size) < 60e6 ? "taille raisonnable" : "fichier lourd (> 60 Mo) : vérifier les textures animées");
    const au = await audioStats(video);
    add("loudness", Math.abs(au.I + 14) <= 1.5, true, `${au.I.toFixed(1)} LUFS intégrés (cible -14)`);
    add("crete", !(au.TP > -0.3), true, `crête ${Number.isNaN(au.TP) ? "?" : au.TP.toFixed(1)} dBFS`);
    const deadAir = au.silences.filter(([s, e]) => e - s > 1.2 && s < dur - 1.2);
    add("pas_de_temps_mort", deadAir.length === 0, true, deadAir.length ? `silences : ${deadAir.map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)} s`).join(", ")}` : "aucun silence > 1,2 s");
    const vd = await videoDefects(video);
    add("images_noires", vd.black === 0, true, `${vd.black} séquence(s) noire(s)`);
    add("images_figees", vd.freezes === 0, false, `${vd.freezes} séquence(s) figée(s) > 1,6 s`);
    add("planche_contact", fs.existsSync(episodeFile(ep.id, "planche.jpg")), false, "planche.jpg pour la revue visuelle");
  }

  // 5. Orthographe (narration + textes à l'écran + publication)
  const texts = [narration(ep), ...onScreenTexts(ep), ep.publication.titre, ep.publication.description_tiktok, ep.publication.description_youtube];
  // Identifiants techniques de l'épisode (commandes, code, noms de dépôts) : exclus du correcteur
  const identifiers = ep.scenes.flatMap((s) =>
    s.type === "terminal" ? s.lignes.filter((l) => l.type === "cmd").map((l) => l.texte) : s.type === "code" ? [s.code] : s.type === "repo" ? [s.nom] : [],
  );
  const unknown = await spellCheck(texts.join("\n"), identifiers);
  add("orthographe", unknown.length === 0, false, unknown.length ? `${unknown.length} mot(s) inconnu(s) à relire : ${unknown.slice(0, 20).join(", ")}` : "aucun mot inconnu");

  // 6. Provenance des assets (licences)
  const assetsDir = path.join(episodeDir(ep.id), "assets");
  const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
  const declared = new Map(ep.assets.map((a) => [a.fichier.replace(/^assets\//, ""), a]));
  const undeclared = files.filter((f) => !declared.has(f));
  const badCaptures = ep.assets.filter((a) => a.origine === "capture" && !a.url);
  const badLicences = ep.assets.filter((a) => a.origine === "licence" && !a.licence);
  add("provenance_assets", undeclared.length === 0 && badCaptures.length === 0 && badLicences.length === 0, true, undeclared.length ? `non déclarés : ${undeclared.join(", ")}` : `${files.length} asset(s) déclaré(s)`);
  const musicOk = !c.musique.fichier || fs.existsSync(path.join(PUBLIC_DIR, c.musique.fichier));
  const licences = readJson<{ fichiers: Record<string, string> }>(path.join(CONFIG_DIR, "licences.json"))?.fichiers ?? {};
  add("licence_musique", musicOk && (!c.musique.fichier || Boolean(licences[c.musique.fichier])), true, c.musique.fichier ? `${c.musique.fichier} : ${licences[c.musique.fichier] ?? "LICENCE NON DOCUMENTÉE"}` : "sans musique");

  // 7. Marque : pas d'affiliation suggérée
  const pubText = `${ep.publication.titre} ${ep.publication.description_youtube} ${ep.publication.description_tiktok}`;
  const affiliation = /(compte|chaîne|média) officiel|\bofficiel(le)? (d'|de )?anthropic|partenaire (officiel )?d'anthropic|anthropic (présente|vous présente)/i.test(pubText + " " + narration(ep));
  add("pas_d_affiliation", !affiliation, true, affiliation ? "formulation suggérant une affiliation à Anthropic" : "aucune affiliation suggérée");

  // 8. Doublons (historique de publication)
  const hist = readJson<{ publications: Array<{ id: string; date: string; sources: string[]; sujet: string }> }>(path.join(DATA_DIR, "historique.json"))?.publications ?? [];
  const mainUrls = new Set(ep.sources.slice(0, 2).map((s) => s.url.replace(/\/$/, "").toLowerCase()));
  const dup = hist.find((h) => h.id !== ep.id && Date.now() - new Date(h.date).getTime() < 60 * 86400e3 && h.sources.some((u) => mainUrls.has(u.replace(/\/$/, "").toLowerCase())));
  add("pas_de_doublon", !dup, true, dup ? `même source principale que ${dup.id} (< 60 jours)` : "sujet inédit sur 60 jours");

  // 9. Cohérence du personnage : la vidéo doit avoir été rendue avec la version actuelle d'Ecto
  const rendu = readJson<{ fantome_version: string; date: string }>(episodeFile(ep.id, "rendu.json"));
  const current = ghostVersion();
  if (fs.existsSync(video)) {
    add(
      "personnage_coherent",
      rendu?.fantome_version === current,
      true,
      rendu ? (rendu.fantome_version === current ? `Ecto ${current} (version actuelle)` : `rendu avec Ecto ${rendu.fantome_version}, version actuelle ${current} : relancer le rendu`) : "rendu.json absent : relancer le rendu",
    );
  }

  const prev = readJson<QcReport>(episodeFile(ep.id, "qc.json"));
  const revue = opts.visuel ? { statut: opts.visuel, note: opts.note, date: new Date().toISOString() } : prev?.revue_visuelle ?? { statut: "a_faire" as const };
  const ok = checks.every((x) => x.ok || !x.bloquant);
  const report: QcReport = {
    episode: ep.id,
    date: new Date().toISOString(),
    ok,
    publiable: ok && revue.statut === "ok",
    fantome_version: rendu?.fantome_version ?? current,
    checks,
    orthographe_a_revoir: unknown,
    revue_visuelle: revue,
  };
  writeJson(episodeFile(ep.id, "qc.json"), report);
  for (const x of checks) log(x.ok ? "ok" : x.bloquant ? "erreur" : "warn", "qc", `${x.nom} — ${x.detail}`);
  log(report.publiable ? "ok" : report.ok ? "warn" : "erreur", "qc", report.publiable ? "PUBLIABLE" : report.ok ? "Contrôles OK — revue visuelle à faire (fm qc <id> --visuel ok)" : "NON PUBLIABLE : corriger les points bloquants");
  if (report.publiable && ep.statut === "rendu") {
    ep.statut = "qc_ok";
    journal(ep, "qc", "Contrôle qualité réussi");
    saveEpisode(ep);
  }
  return report;
}
