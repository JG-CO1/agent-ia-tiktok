import { interpolate, spring, Easing } from "remotion";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Ressort d'entrée standard (0 -> 1). */
export function enter(frame: number, fps: number, delay = 0, stiff = 170, damping = 17) {
  return spring({ frame: frame - delay, fps, config: { stiffness: stiff, damping, mass: 0.7 } });
}

/** Interpolation bornée avec easing doux. */
export function ease(frame: number, a: number, b: number, from = 0, to = 1) {
  return interpolate(frame, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
}

/** Style d'apparition : glisse vers le haut + fondu + léger flou. */
export function riseStyle(p: number, dist = 40): React.CSSProperties {
  return {
    opacity: clamp01(p * 1.4),
    transform: `translateY(${(1 - p) * dist}px) scale(${0.96 + 0.04 * p})`,
    filter: p < 0.98 ? `blur(${(1 - p) * 6}px)` : undefined,
  };
}

/** Formate un nombre à la française (12 345 ; 12,3 k). */
export function formatNumberFr(v: number, decimals = 0, compact = false) {
  if (compact && Math.abs(v) >= 1000) {
    const k = v / 1000;
    return `${k.toLocaleString("fr-FR", { maximumFractionDigits: k >= 100 ? 0 : 1 })} k`;
  }
  return v.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
