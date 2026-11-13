/** Minutage estimé (sans synthèse vocale) : pour prévisualiser une mise en page avant la voix réelle. */
import type { Episode } from "../schema/episode";
import { tokenizeScenes } from "./text";
import { FPS, type VoiceTiming } from "./timeline";

export function estimatedVoice(ep: Pick<Episode, "scenes">, wordsPerSecond = 2.9): VoiceTiming {
  const tokens = tokenizeScenes(ep.scenes.map((s) => s.voix));
  let t = 0.15;
  const mots = tokens.map((tk, i) => {
    const plain = tk.display.replace(/ /g, "");
    const d = Math.max(0.16, (0.5 / wordsPerSecond) + plain.length * 0.045);
    const w = { texte: tk.display, debut: +t.toFixed(3), fin: +(t + d).toFixed(3), scene: tk.scene, emphase: tk.emphasis };
    t += d + 0.03;
    if (/[.?!…]$/.test(plain)) t += 0.28;
    else if (/[,;:]$/.test(plain)) t += 0.12;
    if (tokens[i + 1] && tokens[i + 1].scene !== tk.scene) t += 0.2;
    return w;
  });
  const duree = t + 0.1;
  const frames = Math.ceil(duree * FPS);
  const enveloppe = Array.from({ length: frames }, (_, f) => {
    const s = f / FPS;
    const w = mots.find((m) => s >= m.debut && s < m.fin);
    if (!w) return 0;
    return +(0.35 + 0.55 * Math.abs(Math.sin((s - w.debut) * Math.PI * 6))).toFixed(2);
  });
  return {
    fournisseur: "local",
    modele: "estimation",
    voix: "aucune",
    fichier: "",
    duree,
    fps: FPS,
    mots,
    enveloppe,
    genere_le: new Date(0).toISOString(),
    qualite_production: false,
  };
}
