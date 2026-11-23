import React from "react";
import type { Pull } from "../../src/core/pull";
import { PULL_LEAD, PULL_RELEASE, pullProgress, ringAt } from "../../src/core/pull";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * La corde d'Ecto : il la lance vers le tableau hors champ, la tend en le hissant, puis elle se rétracte.
 * `hand` = milieu de ses mains, déjà exprimé dans le repère de la scène (même calque que les tableaux).
 */
export const Rope: React.FC<{ pulls: Pull[]; frame: number; hand: { x: number; y: number } }> = ({ pulls, frame, hand }) => {
  const p = pulls.find((x) => frame >= x.from - PULL_LEAD && frame < x.from + x.dur + PULL_RELEASE);
  if (!p) return null;
  const t = frame - p.from;
  const ring = ringAt(p, frame);
  let end = ring;
  let opacity = 1;
  let ringOpacity = 1;
  let sag = 14;
  let wobble = 0;
  if (t < 0) {
    // lancer : l'extrémité file vers l'anneau encore hors champ
    const k = 1 - Math.pow(1 - clamp01((t + PULL_LEAD) / PULL_LEAD), 2.2);
    const target = ringAt(p, p.from);
    end = { x: lerp(hand.x, target.x, k), y: lerp(hand.y, target.y, k) };
    sag = -60 * Math.sin(k * Math.PI); // la corde s'arque en l'air
    ringOpacity = 0;
  } else if (t < p.dur) {
    const dp = pullProgress(p.style, t) - pullProgress(p.style, t - 1);
    // tendue quand il hisse, molle quand le tableau lui échappe
    sag = dp < -0.004 ? 110 : p.style === "facile" ? 34 : 10;
    wobble = p.style === "galere" && dp >= -0.004 ? 5 * Math.sin(t * 2.9) : 0;
  } else {
    // mise en place : la corde lâche et revient vers lui
    const k = clamp01((t - p.dur) / PULL_RELEASE);
    end = { x: lerp(ring.x, hand.x, k * k), y: lerp(ring.y, hand.y, k * k) };
    sag = 60 * (1 - k);
    opacity = 1 - k * k;
    ringOpacity = 1 - k;
  }
  const mx = (hand.x + end.x) / 2;
  const my = (hand.y + end.y) / 2;
  const dx = end.x - hand.x;
  const dy = end.y - hand.y;
  const len = Math.hypot(dx, dy) || 1;
  // la corde pend vers le bas ; la vibration est perpendiculaire à la corde
  const cx = mx + (-dy / len) * wobble;
  const cy = my + sag + (dx / len) * wobble;
  const d = `M ${hand.x.toFixed(1)} ${hand.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g opacity={opacity} fill="none" strokeLinecap="round">
        <path d={d} stroke="#05070C" strokeWidth={15} />
        <path d={d} stroke="#F3E7D3" strokeWidth={9} />
        <path d={d} stroke="#B9A37F" strokeWidth={9} strokeDasharray="5 13" />
      </g>
      {/* anneau d'attache, fixé au bord du tableau */}
      <g opacity={ringOpacity}>
        <circle cx={ring.x} cy={ring.y} r={22} fill="#05070C" />
        <circle cx={ring.x} cy={ring.y} r={15} fill="none" stroke="#F3E7D3" strokeWidth={7} />
      </g>
    </svg>
  );
};
