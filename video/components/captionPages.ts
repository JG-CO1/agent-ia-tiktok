import type { TimelineWord } from "../../src/core/timeline";

export interface CaptionPage {
  from: number;
  to: number;
  words: TimelineWord[];
}

const MAX_WORDS = 3;
const MAX_CHARS = 17;

/** Regroupe les mots en « pages » de sous-titres courtes et rythmées (style TikTok). */
export function paginate(words: TimelineWord[], fps = 30): CaptionPage[] {
  const pages: CaptionPage[] = [];
  let cur: TimelineWord[] = [];
  const flush = () => {
    if (cur.length) pages.push({ from: cur[0].from, to: cur[cur.length - 1].to, words: cur });
    cur = [];
  };
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = cur[cur.length - 1];
    const len = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
    const gap = prev ? w.from - prev.to : 0;
    if (prev && (cur.length >= MAX_WORDS || len > MAX_CHARS || gap > fps * 0.35 || w.scene !== prev.scene || /[.?!:;…]$/.test(prev.text))) {
      flush();
    }
    cur.push(w);
  }
  flush();
  // Chaque page reste affichée jusqu'à la suivante (pas de trou), avec un maximum raisonnable
  for (let i = 0; i < pages.length; i++) {
    const next = pages[i + 1];
    pages[i].to = next ? Math.min(next.from, pages[i].to + fps) : pages[i].to + Math.round(fps * 0.5);
  }
  return pages;
}
