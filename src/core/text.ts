/** Outils texte partagés (CLI + moteur vidéo) : découpage en mots, normalisation, emphase. */

export interface Token {
  /** Mot affiché (ponctuation française rattachée). */
  display: string;
  /** Mot brut tel qu'envoyé à la synthèse vocale. */
  spoken: string;
  emphasis: boolean;
  scene: number;
}

const PUNCT_ONLY = /^[?!:;»«…,.()"'’–—-]+$/u;

/** Normalise pour comparer des mots : minuscules, sans accents ni ponctuation. */
export function normalizeWord(w: string): string {
  return w
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^\p{L}\p{N}'+#./-]/gu, "")
    .replace(/^[.'/-]+|[.'/-]+$/g, "")
    // élisions françaises : « d'instructions » -> « instructions », « l'API » -> « api »
    .replace(/^(jusqu|lorsqu|puisqu|qu|l|d|j|n|s|c|t|m)'(?=\p{L})/u, "");
}

/**
 * Découpe la narration de chaque scène en jetons. Les *astérisques* marquent l'emphase et ne sont pas prononcés.
 * Les signes isolés (« ? », « ! », « : »…) sont rattachés au mot précédent avec une espace fine insécable.
 */
export function tokenizeScenes(voices: string[]): Token[] {
  const out: Token[] = [];
  voices.forEach((voice, scene) => {
    let inEmph = false;
    // Regroupe les nombres écrits avec des espaces (« 190 000 ») en un seul mot
    const raws: string[] = [];
    for (const r of voice.trim().split(/\s+/)) {
      const prev = raws[raws.length - 1];
      if (prev && /^\*?\d{1,3}(\u202F\d{3})*$/.test(prev) && /^\d{3}([\s?!:;,.…*]*)$/.test(r)) raws[raws.length - 1] = `${prev}\u202F${r}`;
      else raws.push(r);
    }
    for (const raw of raws) {
      if (!raw) continue;
      let w = raw;
      let emph = inEmph;
      const starts = w.startsWith("*");
      const ends = w.replace(/[?!:;,.…»"']+$/u, "").endsWith("*");
      if (starts) {
        emph = true;
        inEmph = true;
      }
      if (ends) inEmph = false;
      w = w.replace(/\*/g, "");
      if (!w) continue;
      if (PUNCT_ONLY.test(w) && out.length > 0 && out[out.length - 1].scene === scene && w !== "«") {
        const prev = out[out.length - 1];
        prev.display += " " + w;
        prev.spoken += " " + w;
        continue;
      }
      out.push({ display: w, spoken: w, emphasis: emph, scene });
    }
  });
  return out;
}

/** Trouve l'index (dans `tokens`) du premier mot de la scène qui correspond à `needle` (un ou plusieurs mots). */
export function findWord(tokens: Array<{ display: string; scene: number }>, scene: number, needle: string): number {
  const parts = needle.split(/\s+/).map(normalizeWord).filter(Boolean);
  if (parts.length === 0) return -1;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].scene !== scene) continue;
    let ok = true;
    for (let k = 0; k < parts.length; k++) {
      const t = tokens[i + k];
      if (!t || t.scene !== scene) {
        ok = false;
        break;
      }
      const tw = normalizeWord(t.display.split(" ")[0]);
      if (!(tw === parts[k] || (k === parts.length - 1 && tw.startsWith(parts[k]) && parts[k].length >= 4))) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
}
