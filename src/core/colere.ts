/**
 * Personnalité d'Ecto : colère à trois niveaux, accessoires du retour au calme, lancer d'objet vers la caméra.
 * Fonctions pures et déterministes, partagées par la timeline (planification), le moteur vidéo (effets), la voix
 * (ton de chaque scène), le contrôle éditorial et les tests. Aucune dépendance à React ni à Remotion.
 *
 * Vocabulaire :
 *  - niveau : « calme » (état 1, adorable) · « enerve » (état 2, yeux rouges + fumée) · « furie » (état 3, flammes)
 *  - accessoire : objet inattendu qui apparaît dans ses mains quand il retrouve son calme
 *  - lancer : il balance l'accessoire tenu vers le spectateur ; l'impact est simulé par-dessus l'image
 */

export const NIVEAUX = ["calme", "enerve", "furie"] as const;
export type Niveau = (typeof NIVEAUX)[number];
export const NIVEAU_NUM: Record<Niveau, 0 | 1 | 2> = { calme: 0, enerve: 1, furie: 2 };

export const ACCESSOIRES = ["the", "chocolat", "doudou", "peluche", "coussin", "plaid", "couverture", "lunettes", "livre", "fleur"] as const;
export type Accessoire = (typeof ACCESSOIRES)[number];

export const IMPACTS = ["leger", "fissure", "brise"] as const;
export type Impact = (typeof IMPACTS)[number];

/** Ton de la voix d'une scène (réglages ElevenLabs et traitement audio dans src/voice). */
export const TONS = ["normal", "doux", "enerve", "furie"] as const;
export type Ton = (typeof TONS)[number];

/** Ce que laisse l'objet sur la « vitre » quand il la touche. */
export type Eclaboussure = "liquide" | "duvet" | "papier" | "petales" | "dur";

export interface AccessoireDef {
  label: string;
  /** Façon de le tenir : détermine la pose des mains (voir video/ghost/performance.ts). */
  tenue: "main" | "deux-mains" | "serre" | "visage" | "enroule";
  /** Durée du cycle de petites actions (images) : boire une gorgée, caresser, ajuster… */
  cycle: number;
  /** Ce qu'il fait avec, dans l'ordre du cycle (documentation + variété). */
  actions: string[];
  eclaboussure: Eclaboussure;
  /** Couleur de l'éclaboussure / des fragments à l'impact. */
  couleur: string;
  /** Un objet qu'on ne lance pas (il est porté sur lui) : lunettes, plaid, couverture. */
  lancable: boolean;
}

export const ACCESSOIRE_DEFS: Record<Accessoire, AccessoireDef> = {
  the: { label: "tasse de thé", tenue: "main", cycle: 96, actions: ["souffle sur le thé", "boit une gorgée", "repose la tasse"], eclaboussure: "liquide", couleur: "#C98A3B", lancable: true },
  chocolat: { label: "tasse de chocolat chaud", tenue: "main", cycle: 104, actions: ["souffle", "boit une gorgée", "moustache de chocolat"], eclaboussure: "liquide", couleur: "#6B3A22", lancable: true },
  doudou: { label: "doudou", tenue: "serre", cycle: 72, actions: ["le serre contre lui", "le caresse"], eclaboussure: "duvet", couleur: "#F3E3C8", lancable: true },
  peluche: { label: "petite peluche", tenue: "serre", cycle: 80, actions: ["la serre", "la fait danser"], eclaboussure: "duvet", couleur: "#B9824F", lancable: true },
  coussin: { label: "petit coussin", tenue: "serre", cycle: 78, actions: ["le serre fort", "le tapote"], eclaboussure: "duvet", couleur: "#8FD3C9", lancable: true },
  plaid: { label: "plaid", tenue: "enroule", cycle: 120, actions: ["s'enroule dedans", "resserre le plaid"], eclaboussure: "duvet", couleur: "#C45A3C", lancable: false },
  couverture: { label: "couverture", tenue: "enroule", cycle: 120, actions: ["s'enveloppe", "respire sous la couverture"], eclaboussure: "duvet", couleur: "#9DB7E6", lancable: false },
  lunettes: { label: "lunettes de lecture", tenue: "visage", cycle: 90, actions: ["les ajuste", "les remonte du doigt"], eclaboussure: "dur", couleur: "#EAF6FF", lancable: false },
  livre: { label: "petit livre", tenue: "deux-mains", cycle: 110, actions: ["tourne une page", "hoche la tête en lisant"], eclaboussure: "papier", couleur: "#F5F1E6", lancable: true },
  fleur: { label: "fleur", tenue: "main", cycle: 90, actions: ["la respire", "la fait tourner"], eclaboussure: "petales", couleur: "#FF8FB3", lancable: true },
};

// ------------------------------------------------------------------ colère
export interface RageKey {
  frame: number;
  niveau: 0 | 1 | 2;
}

/** Images de montée vers un niveau (descendre est quasi instantané : « il s'arrête brutalement »). */
const RISE: Record<string, number> = { "0>1": 16, "1>2": 10, "0>2": 12 };
export const FALL_FRAMES = 3;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Niveau de colère continu (0..2) : monte en quelques images, retombe d'un coup. */
export function rageAt(keys: readonly RageKey[], frame: number): number {
  let from = 0;
  let to = 0;
  let at = -1e9;
  for (const k of keys) {
    if (k.frame > frame) break;
    // niveau réellement atteint (ou en cours) au moment du changement
    from = to;
    to = k.niveau;
    at = k.frame;
  }
  if (to === from) return to;
  const dur = to > from ? RISE[`${from}>${to}`] ?? 12 : FALL_FRAMES;
  const t = clamp((frame - at) / dur);
  // si on a changé avant la fin de la montée précédente, on repart du niveau entier précédent (suffisant ici)
  return from + (to - from) * smooth(t);
}

/** Niveau « entier » (0, 1, 2) à une image : pour choisir une expression, un geste ou un son. */
export function niveauAt(keys: readonly RageKey[], frame: number): 0 | 1 | 2 {
  let n: 0 | 1 | 2 = 0;
  for (const k of keys) {
    if (k.frame > frame) break;
    n = k.niveau;
  }
  return n;
}

/**
 * Quantité de fumée (0..1) : proportionnelle à la colère, avec une traînée de quelques images après le retour au calme
 * (la fumée ne disparaît pas d'un coup : elle se dissipe, sauf quand `brutal` demande une coupure franche).
 */
export function fumeeAt(keys: readonly RageKey[], frame: number): number {
  const base = (r: number) => (r <= 0.02 ? 0 : clamp(0.22 + 0.34 * Math.min(r, 1) + 0.44 * Math.max(0, r - 1)));
  let v = base(rageAt(keys, frame));
  for (let k = 3; k <= 18; k += 3) v = Math.max(v, base(rageAt(keys, frame - k)) * (1 - k / 22));
  return clamp(v);
}

/** Intensité des flammes (0..1) : n'existent qu'à partir de l'état 3. */
export function flammesAt(keys: readonly RageKey[], frame: number): number {
  const r = rageAt(keys, frame);
  return r <= 1.05 ? 0 : clamp((r - 1.05) / 0.95);
}

/** Rougeur des yeux (0..1) : elle s'installe progressivement dès que la colère monte. */
export const rougeur = (rage: number) => clamp((rage - 0.04) * 1.3);

/** Tremblement du corps et de la caméra à une image donnée, en unités normalisées (-1..1), déterministe. */
export function tremblement(rage: number, frame: number): { x: number; y: number; rot: number } {
  const a = clamp(rage / 2) ** 0.8 * (rage > 0.02 ? 1 : 0);
  const f = frame;
  return {
    x: a * (0.6 * Math.sin(f * 2.3) + 0.4 * Math.sin(f * 5.1 + 1)) + 0,
    y: a * (0.6 * Math.cos(f * 2.9) + 0.4 * Math.sin(f * 4.3 + 2)) + 0,
    rot: a * (0.7 * Math.sin(f * 1.9 + 0.5) + 0.3 * Math.cos(f * 6.7)) + 0,
  };
}

// ------------------------------------------------------------------ accessoires
export interface PropEvent {
  frame: number;
  /** Un accessoire qui apparaît ; null : il le range (disparition animée). */
  accessoire: Accessoire | null;
}

export interface PropState {
  accessoire: Accessoire | null;
  /** Images depuis l'apparition. */
  age: number;
  /** Accessoire qui vient d'être rangé (disparition en cours) et images depuis son départ. */
  parti: { accessoire: Accessoire; depuis: number } | null;
}

export const APPARITION = 10;
export const DISPARITION = 8;

export function propAt(events: readonly PropEvent[], frame: number): PropState {
  let cur: Accessoire | null = null;
  let since = -1e9;
  let gone: Accessoire | null = null;
  let goneAt = -1e9;
  for (const e of events) {
    if (e.frame > frame) break;
    if (cur && e.accessoire !== cur) {
      gone = cur;
      goneAt = e.frame;
    }
    cur = e.accessoire;
    since = e.frame;
  }
  const parti = gone && frame - goneAt < DISPARITION ? { accessoire: gone, depuis: frame - goneAt } : null;
  return { accessoire: cur, age: cur ? frame - since : 0, parti };
}

/** 0..1 : l'accessoire grossit en « pop » à l'apparition (léger dépassement), puis reste à 1. */
export function apparition(age: number): number {
  if (age < 0) return 0;
  const t = clamp(age / APPARITION);
  return t < 1 ? 1 - Math.pow(1 - t, 3) + 0.14 * Math.sin(t * Math.PI) : 1;
}

/**
 * Avancement (0..1) de la petite action de l'accessoire dans son cycle :
 * 0 = position de repos ; 1 = pleine action (tasse à la bouche, doudou serré, livre : page tournée…).
 * `age` en images depuis l'apparition ; le premier geste ne démarre qu'après l'apparition.
 */
export function actionAt(def: AccessoireDef, age: number): number {
  const a = age - APPARITION - 8;
  if (a < 0) return 0;
  const c = a % def.cycle;
  const u = c / def.cycle;
  // repos 0-0.25 · montée 0.25-0.45 · maintien 0.45-0.6 · descente 0.6-0.8 · repos
  if (u < 0.25) return 0;
  if (u < 0.45) return smooth((u - 0.25) / 0.2);
  if (u < 0.6) return 1;
  if (u < 0.8) return 1 - smooth((u - 0.6) / 0.2);
  return 0;
}

// ------------------------------------------------------------------ lancer d'objet
export interface Lancer {
  /** Image du lâcher : l'objet quitte la main. */
  frame: number;
  accessoire: Accessoire;
  impact: Impact;
  seed: number;
}

export const LANCER = { armement: 10, vol: 9, fx: 80 } as const;

export type LancerPhase = "armement" | "vol" | "impact";

export interface LancerState {
  lancer: Lancer;
  phase: LancerPhase;
  /** Avancement dans la phase (0..1) ; pour « impact » : images depuis le choc. */
  t: number;
  /** Images depuis le choc (0 avant). */
  depuis: number;
}

/** Lancer actif (armement, vol ou effets de l'impact) à une image donnée, ou null. */
export function lancerAt(lancers: readonly Lancer[], frame: number): LancerState | null {
  for (const l of lancers) {
    const d = frame - l.frame;
    if (d >= -LANCER.armement && d < 0) return { lancer: l, phase: "armement", t: (d + LANCER.armement) / LANCER.armement, depuis: 0 };
    if (d >= 0 && d < LANCER.vol) return { lancer: l, phase: "vol", t: d / LANCER.vol, depuis: 0 };
    if (d >= LANCER.vol && d < LANCER.vol + LANCER.fx) return { lancer: l, phase: "impact", t: d - LANCER.vol, depuis: d - LANCER.vol };
  }
  return null;
}

/** Images (relatives au lâcher) où l'objet touche l'écran. */
export const FRAME_IMPACT = LANCER.vol;

/** Point d'impact à l'écran (px, repère 1080×1920) : près du centre, variable, hors du bandeau de sous-titres. */
export function pointImpact(seed: number): { x: number; y: number } {
  const h = (n: number) => {
    const x = Math.sin((seed + n) * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return { x: 540 + (h(1) - 0.5) * 300, y: 800 + (h(2) - 0.5) * 220 };
}

// ------------------------------------------------------------------ ton de la voix
interface SceneColere {
  ton?: Ton;
  fantome?: { colere?: Niveau; accessoire?: Accessoire | "aucun"; lancer?: Impact };
}

/**
 * Ton de voix de chaque scène : le `ton` explicite, sinon celui qui découle de l'état d'Ecto au début de la scène.
 * Il hérite de la scène précédente tant qu'aucune consigne ne change (une colère se prolonge, un calme aussi).
 */
export function tonsDesScenes(scenes: readonly SceneColere[]): Ton[] {
  const out: Ton[] = [];
  let niveau: 0 | 1 | 2 = 0;
  let ton: Ton = "normal";
  let tenu = false;
  for (const sc of scenes) {
    const f = sc.fantome;
    if (f?.colere) niveau = NIVEAU_NUM[f.colere];
    if (f?.accessoire) tenu = f.accessoire !== "aucun";
    if (f?.lancer) tenu = false;
    if (sc.ton) ton = sc.ton;
    else if (niveau === 2) ton = "furie";
    else if (niveau === 1) ton = "enerve";
    else if (ton === "furie" || ton === "enerve" || tenu) ton = "doux";
    out.push(ton);
  }
  return out;
}
