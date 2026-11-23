/**
 * Construit la timeline de rendu (frames) à partir de l'épisode et du minutage de la voix.
 * Fonction pure, partagée par la CLI (QC, rendu) et le moteur vidéo.
 */
import type { Episode, Format, Scene, SceneType, Son } from "../schema/episode";
import type { GhostBeat } from "../../video/ghost/performance";
import { findWord, normalizeWord } from "./text";
import { planPulls, PULL_LEAD, PULLER_ANCHOR, type Pull } from "./pull";

export const FPS = 30;
/** Durée (images) d'un « Ecto attrape la caméra » avant retour à sa position (voir video/camera/camera.ts). */
const GRAB_LEN = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
/** Avance de l'image sur la voix au début d'une scène (s). */
const SCENE_LEAD = 0.12;
/** Durée de maintien après la dernière syllabe (s). */
const TAIL = 0.9;

export interface VoiceWord {
  texte: string;
  debut: number;
  fin: number;
  scene: number;
  emphase: boolean;
}

export interface VoiceTiming {
  fournisseur: "elevenlabs" | "local";
  modele: string;
  voix: string;
  fichier: string;
  duree: number;
  fps: number;
  mots: VoiceWord[];
  enveloppe: number[];
  genere_le: string;
  /** false si la voix vient du moteur local de secours : publication interdite. */
  qualite_production: boolean;
}

export interface TimelineScene {
  index: number;
  id: string;
  type: SceneType;
  from: number;
  duration: number;
  scene: Scene;
  /** Frames (relatives au début de scène) d'apparition des éléments (lignes, étapes, items…). */
  reveals: number[];
  sources: Array<{ id: string; label: string }>;
}

export interface TimelineWord {
  text: string;
  from: number;
  to: number;
  emphasis: boolean;
  scene: number;
}

export interface SfxCue {
  frame: number;
  son: Son;
  volume: number;
}

export interface ChannelInfo {
  nom: string;
  handle: string;
  promesse: string;
}

export interface Timeline {
  id: string;
  format: Format;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  scenes: TimelineScene[];
  words: TimelineWord[];
  beats: GhostBeat[];
  sfx: SfxCue[];
  /** Arrivée de chaque tableau, tiré par Ecto depuis un côté (voir core/pull.ts). */
  pulls: Pull[];
  envelope: number[];
  voiceSrc: string;
  musicSrc: string | null;
  musicVolume: number;
  channel: ChannelInfo;
  seed: number;
  /** Préfixe staticFile() des fichiers de l'épisode (captures…). */
  assetsBase: string;
  /** Options de diagnostic de performance (ex. "sans-fantome", "sans-fond"). */
  debug?: string[];
}

/** Direction par défaut d'Ecto selon le type de scène (surchargée par `scene.fantome`). */
export const DEFAULT_GHOST: Record<SceneType, Omit<GhostBeat, "frame">> = {
  accroche: { anchor: "centre", expression: "surprise", gesture: "presente" },
  titre: { anchor: "centre", expression: "joie", gesture: "explique" },
  repo: { anchor: "bas", expression: "joie", gesture: "pointer-haut" },
  terminal: { anchor: "bas", expression: "determine", gesture: "tape" },
  code: { anchor: "bas", expression: "reflexion", gesture: "pointer-haut" },
  etapes: { anchor: "bas", expression: "malicieux", gesture: "explique" },
  liste: { anchor: "bas", expression: "joie", gesture: "pointer-haut" },
  comparaison: { anchor: "bas", expression: "reflexion", gesture: "haussement" },
  chiffre: { anchor: "bas", expression: "surprise", gesture: "pointer-haut" },
  citation: { anchor: "bas", expression: "reflexion", gesture: "reflexion" },
  capture: { anchor: "bas-gauche", expression: "surprise", gesture: "pointer-haut" },
  cta: { anchor: "centre", expression: "joie", gesture: "salut" },
};

/** Alternatives de placement quand deux scènes consécutives donneraient la même position à Ecto. */
const ANCHOR_VARIANTS: Partial<Record<NonNullable<GhostBeat["anchor"]>, Array<GhostBeat["anchor"]>>> = {
  bas: ["bas-droite", "bas-gauche"],
  // « centre-haut » recouvrirait les titres des scènes pleines : seul le rapprochement est proposé
  centre: ["gros-plan", "gros-plan"],
  "bas-gauche": ["bas", "bas-droite"],
  "bas-droite": ["bas", "bas-gauche"],
};

/** Réactions du visage sur les mots mis en valeur (tirées à tour de rôle : jamais deux fois la même d'affilée). */
const REACTIONS: Array<NonNullable<GhostBeat["expression"]>> = ["waouh", "clin", "surprise", "malicieux", "rire", "determine", "joie"];

/** Expressions « d'entretien » glissées quand le visage ne change pas depuis ~2 s (toutes souriantes ou attentives). */
const LIVELY: Array<NonNullable<GhostBeat["expression"]>> = ["clin", "malicieux", "joie", "determine", "waouh", "reflexion", "surprise"];

/** Relances d'Ecto au milieu d'une longue scène (bibliothèque de mouvements réutilisables, jamais la même deux fois de suite). */
const MID_SCENE: Array<Pick<GhostBeat, "anchor" | "gesture" | "expression">> = [
  { gesture: "explique", expression: "joie" },
  { anchor: "bas-droite", gesture: "pointer-gauche", expression: "clin" },
  { gesture: "reflexion", expression: "reflexion" },
  { anchor: "bas-gauche", gesture: "pointer-droite", expression: "waouh" },
  { anchor: "gros-plan", gesture: "presente", expression: "surprise" },
];

/** Éléments révélés progressivement pour chaque type de scène. */
function revealItems(scene: Scene): Array<{ sur_mot?: string }> {
  switch (scene.type) {
    case "terminal":
      return scene.lignes;
    case "etapes":
      return scene.etapes;
    case "liste":
      return scene.items;
    case "comparaison":
      return [{}, {}];
    case "repo":
      return (scene.points ?? []).map(() => ({}));
    default:
      return [];
  }
}

const sec = (s: number, fps: number) => Math.round(s * fps);

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 1000);
}

/** La musique de l'épisode : piste de l'humeur choisie (même dossier que le fond par défaut de la chaîne). */
export function moodMusic(defaultSrc: string, humeur: string) {
  const dir = defaultSrc.includes("/") ? defaultSrc.slice(0, defaultSrc.lastIndexOf("/")) : "musique";
  return `${dir}/${humeur}.m4a`;
}

export function buildTimeline(
  ep: Episode,
  voice: VoiceTiming,
  opts: { channel: ChannelInfo; voiceSrc: string; assetsBase: string; musicSrc?: string | null; musicVolume?: number },
): Timeline {
  const fps = FPS;
  const words: TimelineWord[] = voice.mots.map((w) => ({
    text: w.texte,
    from: sec(w.debut, fps),
    to: Math.max(sec(w.fin, fps), sec(w.debut, fps) + 2),
    emphasis: w.emphase,
    scene: w.scene,
  }));
  const tokens = voice.mots.map((w) => ({ display: w.texte, scene: w.scene }));
  const durationInFrames = sec(voice.duree + TAIL, fps);

  // Début de chaque scène = premier mot de la scène (moins une petite avance)
  const starts = ep.scenes.map((_, i) => {
    if (i === 0) return 0;
    const first = voice.mots.find((w) => w.scene === i);
    if (!first) throw new Error(`Aucun mot de voix pour la scène ${ep.scenes[i].id}`);
    return Math.max(1, sec(first.debut - SCENE_LEAD, fps));
  });

  const sourceLabel = (id: string) => {
    const s = ep.sources.find((x) => x.id === id);
    if (!s) return id;
    try {
      const u = new URL(s.url);
      const path = u.pathname.split("/").filter(Boolean).slice(0, 2).join("/");
      return (u.hostname.replace(/^www\./, "") + (u.hostname.includes("github.com") && path ? "/" + path : "")).slice(0, 48);
    } catch {
      return s.titre;
    }
  };

  const scenes: TimelineScene[] = ep.scenes.map((scene, i) => {
    const from = starts[i];
    const to = i < ep.scenes.length - 1 ? starts[i + 1] : durationInFrames;
    const duration = Math.max(fps, to - from);
    const items = revealItems(scene);
    const reveals: number[] = [];
    const span = Math.max(12, Math.round(duration * 0.62));
    items.forEach((it, k) => {
      let f = Math.round(8 + (k * span) / Math.max(1, items.length));
      if (it.sur_mot) {
        const wi = findWord(tokens, i, it.sur_mot);
        if (wi >= 0) f = words[wi].from - from - 3;
      }
      const prev = reveals.length ? reveals[reveals.length - 1] + 4 : 4;
      reveals.push(Math.min(duration - 8, Math.max(prev, f)));
    });
    return {
      index: i,
      id: scene.id,
      type: scene.type,
      from,
      duration,
      scene,
      reveals,
      sources: (scene.sources ?? []).map((id) => ({ id, label: sourceLabel(id) })),
    };
  });

  // ---- Jeu d'Ecto ----
  const beats: GhostBeat[] = [];
  let prevAnchor: GhostBeat["anchor"];
  const pulls = planPulls(scenes, hashString(ep.id));
  scenes.forEach((sc) => {
    const d = DEFAULT_GHOST[sc.type];
    const f = sc.scene.fantome;
    // Ecto va chercher le tableau sur son côté d'entrée et le tire ; puis il retrouve sa place de scène
    const pull = pulls.find((x) => x.scene === sc.index);
    let defaultFrame = sc.from;
    if (pull) {
      const kind = pull.style === "galere" ? "peine" : pull.style === "rapide" ? "arrache" : "tire";
      const land = pull.from + pull.dur;
      // il file se placer, lance sa corde, puis hisse (le geste est calé sur l'avancement du tableau)
      beats.push({ frame: Math.max(0, pull.from - PULL_LEAD - 8), anchor: PULLER_ANCHOR[pull.dir] });
      beats.push({
        frame: Math.max(0, pull.from - PULL_LEAD),
        gesture: `${kind}-${pull.dir}` as GhostBeat["gesture"],
        expression: pull.style === "galere" ? "effort" : pull.style === "rapide" ? "malicieux" : "determine",
      });
      if (pull.style === "galere") {
        // le tableau lui échappe deux fois : surprise, puis il s'y remet
        beats.push({ frame: pull.from + 9, expression: "surprise" }, { frame: pull.from + 14, expression: "effort" });
        beats.push({ frame: pull.from + 22, expression: "surprise" }, { frame: pull.from + 27, expression: "effort" });
      }
      defaultFrame = land + (pull.style === "facile" ? 4 : 14);
      // une plongée vers la caméra dans la foulée : il lâche le tableau un peu plus tôt
      for (const tf of sc.scene.temps_forts ?? []) {
        if (tf.position !== "camera") continue;
        const wi = findWord(tokens, sc.index, tf.sur_mot);
        if (wi >= 0) defaultFrame = Math.max(sc.from + 8, Math.min(defaultFrame, words[wi].from - 6));
      }
      // mise en place réussie : petite réaction avant de reprendre sa place
      if (pull.style !== "facile" && defaultFrame >= land + 10) {
        beats.push({ frame: land, expression: pull.style === "galere" ? "rire" : "clin", gesture: pull.style === "galere" ? "celebre" : "pouce" });
      }
    }
    // Variété : sans consigne explicite, Ecto ne reste pas au même endroit d'une scène à l'autre
    let anchor = f?.position ?? d.anchor;
    if (!f?.position && anchor === prevAnchor) anchor = ANCHOR_VARIANTS[anchor ?? "bas"]?.[sc.index % 2] ?? anchor;
    prevAnchor = anchor;
    beats.push({
      frame: defaultFrame,
      anchor,
      expression: f?.expression ?? d.expression,
      gesture: f?.geste ?? d.gesture,
      look: f?.regard,
    });
    // Scène longue sans temps fort : relance à mi-parcours (autre geste, léger déplacement) pour garder du mouvement
    if (sc.duration > 80 && !(sc.scene.temps_forts ?? []).length) {
      // Mise en page « split » : les sous-titres occupent le milieu, Ecto reste donc dans le bas de l'écran
      const pleine = sc.type === "accroche" || sc.type === "titre" || sc.type === "cta";
      // Scènes pleines : sous-titres tout en bas, Ecto reste au centre (gros plan possible) ; split : Ecto en bas, jamais au centre
      const pool = pleine ? MID_SCENE.filter((m) => !m.anchor || m.anchor === "gros-plan") : MID_SCENE.filter((m) => m.anchor !== "gros-plan");
      const alt = pool[(sc.index + (hashString(ep.id) % 3)) % pool.length];
      // jamais avant qu'il ait fini de hisser le tableau et repris sa place
      const mid = Math.max(sc.from + Math.round(sc.duration * 0.5), defaultFrame + 14);
      if (mid < sc.from + sc.duration - 20) beats.push({ frame: mid, anchor: alt.anchor ?? anchor, gesture: alt.gesture, expression: alt.expression });
    }
    for (const tf of sc.scene.temps_forts ?? []) {
      const wi = findWord(tokens, sc.index, tf.sur_mot);
      if (wi < 0) continue; // signalé par le contrôle qualité
      beats.push({
        frame: Math.max(sc.from, words[wi].from - 2),
        anchor: tf.position,
        expression: tf.expression,
        gesture: tf.geste,
        look: tf.regard,
      });
    }
  });

  // ---- Visage vivant : une réaction sur chaque mot mis en valeur, puis retour à l'humeur de la scène ----
  {
    const busy = (f: number) =>
      pulls.some((p) => f >= p.from - PULL_LEAD - 10 && f <= p.from + p.dur + 18) || beats.some((b) => Math.abs(b.frame - f) < 12);
    let lastReact = -999;
    let k = hashString(ep.id);
    for (const w of words) {
      if (!w.emphasis || w.from - lastReact < 34 || busy(w.from) || busy(w.from + 26)) continue;
      const sc = scenes[w.scene];
      const base = sc.scene.fantome?.expression ?? DEFAULT_GHOST[sc.type].expression;
      const sceptique = sc.scene.type === "liste" && sc.scene.items.some((it) => it.etat === "non");
      let react = sceptique ? "doute" : REACTIONS[k++ % REACTIONS.length];
      if (react === base) react = REACTIONS[k++ % REACTIONS.length];
      beats.push({ frame: Math.max(0, w.from - 2), expression: react });
      beats.push({ frame: w.from + 26, expression: base });
      lastReact = w.from;
    }
  }

  // ---- « Ecto attrape la caméra » : très gros plan immersif sur les phrases percutantes ----
  // 1) Le hook : dès « scroller » (à défaut, le premier mot d'emphase), Ecto fonce vers l'objectif.
  const hookWords = words.filter((w) => w.scene === 0);
  const hookWord = hookWords.find((w) => /scroll/i.test(w.text)) ?? hookWords.find((w) => w.emphasis) ?? hookWords[0];
  if (hookWord && !beats.some((b) => b.anchor === "camera" && b.frame < scenes[Math.min(1, scenes.length - 1)].from)) {
    beats.push({ frame: Math.max(0, hookWord.from - 4), anchor: "camera", gesture: "attrape", expression: "determine", look: "camera" });
  }
  // 2) Retour à la position de la scène après chaque plongée (sauf si une autre consigne arrive entre-temps)
  beats.sort((a, b) => a.frame - b.frame);
  for (const b of [...beats]) {
    if (b.anchor !== "camera") continue;
    const back = b.frame + GRAB_LEN;
    if (beats.some((o) => o !== b && o.frame > b.frame && o.frame <= back + 2)) continue;
    const sc = [...scenes].reverse().find((x) => x.from <= b.frame) ?? scenes[0];
    const d = DEFAULT_GHOST[sc.type];
    beats.push({ frame: back, anchor: sc.scene.fantome?.position ?? d.anchor, gesture: sc.scene.fantome?.geste ?? d.gesture, expression: d.expression });
  }

  // ---- Jamais le même visage plus de ~2 s : on glisse une expression vivante dans chaque long intervalle ----
  {
    // seuls les vrais changements comptent (deux consignes identiques de suite = un seul visage)
    const expr = beats
      .filter((b) => b.expression)
      .sort((a, b) => a.frame - b.frame)
      .filter((b, i, all) => i === 0 || b.expression !== all[i - 1].expression);
    let k = hashString(ep.id) + 3;
    const extra: GhostBeat[] = [];
    for (let i = 0; i < expr.length; i++) {
      const end = i + 1 < expr.length ? expr[i + 1].frame : durationInFrames - 20;
      let cur = expr[i].expression;
      for (let f = expr[i].frame + 56; f < end - 18; f += 56) {
        let next = LIVELY[k++ % LIVELY.length];
        if (next === cur) next = LIVELY[k++ % LIVELY.length];
        extra.push({ frame: f, expression: next });
        // une consigne identique à venir remettrait l'ancien visage : on la laisse faire, mais on repart d'elle
        cur = next;
      }
    }
    beats.push(...extra);
    beats.sort((a, b) => a.frame - b.frame);
  }

  // ---- Effets sonores (tous générés par nos soins : aucun problème de droits) ----
  const sfx: SfxCue[] = [];
  scenes.forEach((sc) => {
    if (sc.index > 0) {
      const t = sc.scene.transition ?? "glisse";
      if (t !== "coupe") sfx.push({ frame: Math.max(0, sc.from - 3), son: t === "flash" ? "impact" : "whoosh", volume: 0.3 });
    }
    if (sc.type === "chiffre") sfx.push({ frame: sc.from + 40, son: "ding", volume: 0.3 });
    if (sc.type === "cta") sfx.push({ frame: sc.from + 10, son: "ding", volume: 0.26 });
    const revealSound: Son | null =
      sc.type === "terminal" ? "clic" : sc.type === "etapes" || sc.type === "liste" || sc.type === "repo" ? "pop" : null;
    if (revealSound) for (const r of sc.reveals) sfx.push({ frame: sc.from + r, son: revealSound, volume: 0.22 });
    for (const tf of sc.scene.temps_forts ?? []) {
      if (!tf.son) continue;
      const wi = findWord(tokens, sc.index, tf.sur_mot);
      if (wi >= 0) sfx.push({ frame: words[wi].from, son: tf.son, volume: 0.3 });
    }
  });
  for (const b of beats) if (b.anchor === "camera") sfx.push({ frame: b.frame, son: "whoosh", volume: 0.34 });
  // Mots d'emphase : petit « pop » synchronisé (espacés d'au moins 0,9 s, pas sur un son déjà présent)
  let lastEmph = -999;
  for (const w of words) {
    if (!w.emphasis || w.from - lastEmph < 27) continue;
    if (sfx.some((c) => Math.abs(c.frame - w.from) < 9)) continue;
    sfx.push({ frame: w.from, son: "pop", volume: 0.16 });
    lastEmph = w.from;
  }
  // Intro silencieuse côté effets : la phrase d'accroche parle seule (pas de choc, whoosh ni pop avant la fin de la première scène)
  const introEnd = scenes.length > 1 ? scenes[1].from : 0;
  for (let i = sfx.length - 1; i >= 0; i--) if (sfx[i].frame < introEnd) sfx.splice(i, 1);
  // Tableaux tirés par Ecto : aucun bruitage pendant qu'il tire, un seul son quand le tableau est en place
  for (const p of pulls) {
    const land = p.from + p.dur;
    for (let i = sfx.length - 1; i >= 0; i--) if (sfx[i].frame >= p.from - PULL_LEAD - 4 && sfx[i].frame <= land + 6) sfx.splice(i, 1);
    sfx.push({ frame: land, son: p.style === "galere" ? "impact" : "pop", volume: p.style === "galere" ? 0.3 : 0.32 });
  }
  // Jamais de rafale : deux bruitages sont séparés d'au moins un tiers de seconde (on garde le plus important)
  const rank = (c: SfxCue) => (c.son === "impact" ? 0 : c.son === "whoosh" ? 1 : c.son === "ding" ? 2 : c.son === "pop" ? 4 : 3);
  const landings = new Set(pulls.map((p) => p.from + p.dur));
  const kept: SfxCue[] = [];
  for (const c of [...sfx].sort((a, b) => (landings.has(a.frame) ? -1 : rank(a)) - (landings.has(b.frame) ? -1 : rank(b)) || a.frame - b.frame)) {
    if (kept.every((k) => Math.abs(k.frame - c.frame) >= 10)) kept.push(c);
  }
  sfx.length = 0;
  sfx.push(...kept);
  sfx.sort((a, b) => a.frame - b.frame);

  // Enveloppe alignée sur la durée totale
  const envelope = Array.from({ length: durationInFrames }, (_, f) => voice.enveloppe[f] ?? 0);

  return {
    id: ep.id,
    format: ep.format,
    fps,
    width: WIDTH,
    height: HEIGHT,
    durationInFrames,
    scenes,
    words,
    beats,
    sfx,
    pulls,
    envelope,
    voiceSrc: opts.voiceSrc,
    musicSrc: opts.musicSrc ? moodMusic(opts.musicSrc, ep.humeur_musicale ?? "energique") : null,
    musicVolume: opts.musicVolume ?? 0.08,
    channel: opts.channel,
    seed: hashString(ep.id),
    assetsBase: opts.assetsBase,
  };
}

/** Liste des « sur_mot » introuvables dans la narration (utilisé par le contrôle qualité). */
export function missingCueWords(ep: Episode, voice: VoiceTiming): string[] {
  const tokens = voice.mots.map((w) => ({ display: w.texte, scene: w.scene }));
  const missing: string[] = [];
  ep.scenes.forEach((sc, i) => {
    const cues = [...(sc.temps_forts ?? []).map((t) => t.sur_mot), ...revealItems(sc).map((it) => it.sur_mot).filter(Boolean)] as string[];
    for (const c of cues) if (findWord(tokens, i, c) < 0) missing.push(`${sc.id}: « ${c} » (${normalizeWord(c)})`);
  });
  return missing;
}
