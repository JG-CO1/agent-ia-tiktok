/**
 * « Ecto tire les tableaux » : chaque carte (dépôt, étapes, liste…) arrive d'un côté de l'écran, tirée par Ecto.
 * Fonctions pures partagées par la timeline (planification), le moteur vidéo (mouvement) et les tests.
 */
export type PullDir = "gauche" | "droite" | "haut" | "bas";
/** facile : un geste fluide · rapide : coup sec avec rebond · galere : Ecto peine, la carte résiste puis cède. */
export type PullStyle = "facile" | "rapide" | "galere";

export interface Pull {
  scene: number;
  dir: PullDir;
  style: PullStyle;
  /** Première image où la carte est visible. */
  from: number;
  /** Durée de l'arrivée (images). */
  dur: number;
}

export const PULL_DURATION: Record<PullStyle, number> = { facile: 22, rapide: 12, galere: 40 };
/** Images avant l'arrivée du tableau pendant lesquelles Ecto lance sa corde vers le bord de l'écran. */
export const PULL_LEAD = 7;
/** Images après la mise en place pendant lesquelles la corde se rétracte. */
export const PULL_RELEASE = 8;

/** Où Ecto se place pour hisser (nom d'ancre) : toujours à l'opposé de l'entrée, pour tirer le tableau vers lui. */
export const PULLER_ANCHOR: Record<PullDir, "bas-gauche" | "bas-droite" | "haut-droite"> = {
  droite: "bas-gauche",
  haut: "bas-gauche",
  gauche: "bas-droite",
  bas: "haut-droite",
};

/** Point d'attache de la corde sur le tableau en place (px, repère de la scène 1080×1920) : milieu d'un bord latéral. */
export function ringRest(dir: PullDir): { x: number; y: number } {
  return { x: dir === "droite" || dir === "haut" ? 64 : 1016, y: 600 };
}

/** Distance (px) que la carte parcourt depuis hors-champ. */
export const PULL_DISTANCE: Record<PullDir, number> = { gauche: 1150, droite: 1150, haut: 1350, bas: 1350 };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOutBack = (x: number, c: number) => 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/** Points (image, avancement) de la version « galère » : la carte avance, glisse en arrière, puis cède d'un coup. */
const STRUGGLE: Array<[number, number]> = [
  [0, 0],
  [8, 0.22],
  [12, 0.13],
  [21, 0.5],
  [26, 0.36],
  [33, 0.8],
  [36, 0.72],
  [40, 1],
];

/** Avancement de la carte (0 = hors champ, 1 = en place ; peut dépasser 1 : petit rebond). */
export function pullProgress(style: PullStyle, t: number): number {
  const dur = PULL_DURATION[style];
  if (t <= 0) return 0;
  if (t >= dur) return 1;
  if (style === "facile") return easeOutBack(t / dur, 0.9);
  if (style === "rapide") return easeOutBack(t / dur, 2.4);
  for (let i = 1; i < STRUGGLE.length; i++) {
    const [t1, p1] = STRUGGLE[i];
    if (t <= t1) {
      const [t0, p0] = STRUGGLE[i - 1];
      const x = clamp((t - t0) / (t1 - t0));
      // dernier segment : le coup de grâce, avec rebond
      return p0 + (p1 - p0) * (i === STRUGGLE.length - 1 ? easeOutBack(x, 1.6) : easeInOut(x));
    }
  }
  return 1;
}

/** Position (images relatives à `from`) des à-coups d'une arrivée « galère » : sert aux secousses et aux sons. */
export const STRUGGLE_JERKS = [8, 21, 33];

const STYLE_CYCLE: PullStyle[] = ["facile", "galere", "rapide", "facile", "galere", "rapide"];
const DIR_CYCLE: PullDir[] = ["gauche", "droite", "haut", "bas", "droite", "gauche"];

const PULLABLE = new Set(["repo", "terminal", "code", "etapes", "liste", "comparaison", "chiffre", "citation", "capture"]);

/** Planifie l'arrivée de chaque tableau (déterministe : même épisode, même mise en scène). */
export function planPulls(scenes: Array<{ index: number; type: string; from: number; duration: number }>, seed: number): Pull[] {
  const out: Pull[] = [];
  let k = 0;
  let lastDir: PullDir | null = null;
  for (const sc of scenes) {
    if (sc.index === 0 || !PULLABLE.has(sc.type)) continue;
    const style = STYLE_CYCLE[(k + seed) % STYLE_CYCLE.length];
    let dir = DIR_CYCLE[(k + seed) % DIR_CYCLE.length];
    for (let j = 1; dir === lastDir && j <= DIR_CYCLE.length; j++) dir = DIR_CYCLE[(k + seed + j) % DIR_CYCLE.length];
    k++;
    // une arrivée « galère » a besoin de temps ; si la scène est trop courte on passe en version rapide
    const st: PullStyle = sc.duration < PULL_DURATION[style] + 25 ? "rapide" : style;
    if (sc.duration < 40) continue;
    out.push({ scene: sc.index, dir, style: st, from: sc.from - 2, dur: PULL_DURATION[st] });
    lastDir = dir;
  }
  return out;
}

/** Décalage CSS (px), roulis (deg) et petit rebond d'échelle de la carte à l'image `frame`. */
export function pullTransform(p: Pull, frame: number): { x: number; y: number; rot: number; scale: number; done: boolean } {
  const t = frame - p.from;
  const pr = pullProgress(p.style, t);
  const rest = 1 - pr;
  const d = PULL_DISTANCE[p.dir] * rest;
  // tremblement de résistance pendant une arrivée « galère »
  const jitter = p.style === "galere" && t > 0 && t < p.dur ? Math.sin(t * 2.3) * 7 * (1 - pr) : 0;
  const sign = p.dir === "gauche" || p.dir === "haut" ? -1 : 1;
  const horizontal = p.dir === "gauche" || p.dir === "droite";
  // mise en place : la carte « claque » et rebondit légèrement
  const u = t - p.dur;
  const pop = u >= 0 && u < 24 ? (p.style === "facile" ? 0.02 : 0.04) * Math.exp(-u / 5) * Math.sin(u * 0.85) : 0;
  return {
    x: horizontal ? sign * d : jitter,
    y: horizontal ? jitter : sign * d,
    rot: (horizontal ? sign : -sign) * 4.5 * rest,
    scale: 1 + pop,
    done: t >= p.dur,
  };
}

/** Position de l'anneau d'attache (px, repère de la scène) à l'image `frame`, carte en mouvement comprise. */
export function ringAt(p: Pull, frame: number): { x: number; y: number } {
  const tr = pullTransform(p, frame);
  const r = ringRest(p.dir);
  const a = (tr.rot * Math.PI) / 180;
  const dx = (r.x - 540) * tr.scale;
  const dy = (r.y - 960) * tr.scale;
  return { x: 540 + tr.x + dx * Math.cos(a) - dy * Math.sin(a), y: 960 + tr.y + dx * Math.sin(a) + dy * Math.cos(a) };
}
