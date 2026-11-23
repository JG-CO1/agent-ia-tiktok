import React from "react";
import type { Pull } from "../../src/core/pull";

/** Moments (images depuis l'apparition du tableau) où une goutte de sueur gicle pendant une traction « galère ». */
const DROPS = [3, 11, 19, 28, 36];
const LIFE = 15;

/**
 * Gouttes de sueur d'effort : elles jaillissent du haut de la tête d'Ecto, alternativement de chaque côté,
 * retombent en cloche et s'effacent. `head` = centre d'Ecto à l'écran, `unit` = px par unité du modèle.
 */
export const Sweat: React.FC<{ pulls: Pull[]; frame: number; head: { x: number; y: number }; unit: number }> = ({ pulls, frame, head, unit }) => {
  const p = pulls.find((x) => x.style === "galere" && frame >= x.from && frame < x.from + x.dur + LIFE);
  if (!p) return null;
  const t = frame - p.from;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      {DROPS.map((start, i) => {
        const a = t - start;
        if (a < 0 || a >= LIFE || start > p.dur) return null;
        const side = i % 2 === 0 ? 1 : -1;
        const k = a / LIFE;
        const x = head.x + side * unit * (0.62 + 0.55 * k);
        const y = head.y - unit * (0.95 + 0.5 * k - 1.25 * k * k);
        const size = unit * 0.17 * (1 - 0.3 * k);
        const rot = side * (30 + 70 * k);
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(size / 20).toFixed(3)})`} opacity={k > 0.7 ? (1 - k) / 0.3 : 1}>
            <path d="M 0 -26 C 9 -10 18 0 18 10 A 18 18 0 1 1 -18 10 C -18 0 -9 -10 0 -26 Z" fill="#9DE7FF" stroke="#05070C" strokeWidth={4} strokeLinejoin="round" />
            <ellipse cx={-7} cy={8} rx={4} ry={7} fill="#FFFFFF" opacity={0.85} />
          </g>
        );
      })}
    </svg>
  );
};
