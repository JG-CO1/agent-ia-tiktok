import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import type { TimelineWord } from "../../src/core/timeline";
import { COLORS, FONTS } from "../theme";
import { paginate } from "./captionPages";

/** Sous-titres synchronisés mot à mot : le mot prononcé s'allume, les mots-clés restent en couleur. */
export const Captions: React.FC<{ words: TimelineWord[]; y: number; accent: string }> = ({ words, y, accent }) => {
  const f = useCurrentFrame();
  const pages = useMemo(() => paginate(words), [words]);
  const page = pages.find((p) => f >= p.from && f < p.to);
  if (!page) return null;
  const age = f - page.from;
  const pop = Math.min(1, age / 4);
  const scale = 0.86 + 0.14 * (1 - Math.pow(1 - pop, 3));
  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        right: 50,
        top: y - 70,
        height: 140,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        // L'espace doit survivre à l'agrandissement du mot prononcé (jusqu'à scale 1.1 sur un mot d'emphase : ~15 px par côté sur un mot long)
        gap: "0 40px",
        transform: `scale(${scale})`,
        opacity: Math.min(1, age / 2 + 0.2),
      }}
    >
      {page.words.map((w, i) => {
        const active = f >= w.from && f < Math.max(w.to, (page.words[i + 1]?.from ?? w.to));
        const color = w.emphasis ? COLORS.orange : active ? accent : COLORS.text;
        return (
          <span
            key={i}
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 78,
              lineHeight: 1.12,
              color,
              WebkitTextStroke: "12px #05070C",
              paintOrder: "stroke fill",
              textShadow: "0 7px 0 rgba(0,0,0,0.38)",
              transform: active ? (w.emphasis ? "translateY(-8px) scale(1.1) rotate(-1.5deg)" : "translateY(-4px) scale(1.06)") : "none",
              display: "inline-block",
              whiteSpace: "nowrap",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
