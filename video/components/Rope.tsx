import React from "react";
import type { Pull } from "../../src/core/pull";
import { PULL_LEAD, pullProgress, ringAt } from "../../src/core/pull";

type P = { x: number; y: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);

/** Images pendant lesquelles la corde, lâchée, tombe au sol et s'efface. */
export const ROPE_FALL = 16;
const N = 18; // maillons de la corde simulée
const GRAVITY = 2.6; // px / image²

export interface RopeHands {
  /** Main la plus proche du tableau (celle qui tient la corde tendue). */
  lead: P;
  /** Main arrière : la corde halée ressort derrière elle. */
  rear: P;
}

/**
 * Corde physique (intégration de Verlet, rejouée depuis le lancer à chaque image : rendu déterministe).
 * Elle pend sous son poids, se tend quand Ecto hisse, mollit et ondule quand le tableau lui échappe,
 * puis tombe au sol quand il la lâche.
 */
function simulate(p: Pull, frame: number, hands: (f: number) => RopeHands): { pts: P[]; fall: number } {
  const f0 = p.from - PULL_LEAD;
  const start = hands(f0).lead;
  let pts: P[] = Array.from({ length: N }, () => ({ ...start }));
  let prev: P[] = pts.map((q) => ({ ...q }));
  const target0 = ringAt(p, p.from);
  let length = 40;
  let fall = 0;
  for (let f = f0; f <= frame; f++) {
    const t = f - p.from;
    const h = hands(f).lead;
    let end: P | null;
    let pinStart = true;
    if (t < 0) {
      // lancer : le bout file vers l'anneau en cloche
      const k = 1 - Math.pow(1 - clamp01((t + PULL_LEAD) / PULL_LEAD), 2.2);
      end = { x: lerp(h.x, target0.x, k), y: lerp(h.y, target0.y, k) - 110 * Math.sin(k * Math.PI) };
      length = dist(h, end) * 1.1 + 30;
    } else if (t < p.dur) {
      end = ringAt(p, f);
      const dp = pullProgress(p.style, t) - pullProgress(p.style, t - 1);
      // tendue quand il hisse ; du mou quand le tableau repart
      const slack = dp < -0.004 ? 0.16 : p.style === "facile" ? 0.045 : 0.012;
      length = dist(h, end) * (1 + slack);
    } else {
      // lâchée : elle se détache du tableau, puis de ses mains, et tombe
      end = null;
      fall = t - p.dur;
      pinStart = fall < 4;
    }
    const seg = length / (N - 1);
    for (let i = 0; i < N; i++) {
      const vx = (pts[i].x - prev[i].x) * 0.9;
      const vy = (pts[i].y - prev[i].y) * 0.9;
      prev[i] = { ...pts[i] };
      pts[i] = { x: pts[i].x + vx, y: pts[i].y + vy + GRAVITY };
    }
    for (let it = 0; it < 14; it++) {
      if (pinStart) pts[0] = { ...h };
      if (end) pts[N - 1] = { ...end };
      for (let i = 0; i < N - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const d = dist(a, b) || 0.001;
        if (d <= seg) continue; // une corde ne pousse pas : elle ne résiste qu'à l'étirement
        const c = (d - seg) / d / 2;
        const ox = (b.x - a.x) * c;
        const oy = (b.y - a.y) * c;
        const fixA = i === 0 && pinStart;
        const fixB = i === N - 2 && end !== null;
        if (!fixA) pts[i] = { x: a.x + ox * (fixB ? 2 : 1), y: a.y + oy * (fixB ? 2 : 1) };
        if (!fixB) pts[i + 1] = { x: b.x - ox * (fixA ? 2 : 1), y: b.y - oy * (fixA ? 2 : 1) };
      }
      for (const q of pts) if (q.y > 1905) q.y = 1905; // le sol
    }
    if (pinStart) pts[0] = { ...h };
    if (end) pts[N - 1] = { ...end };
  }
  return { pts, fall };
}

/** Courbe lisse passant par les maillons (Catmull-Rom converti en Bézier). */
function smoothPath(pts: P[]): string {
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Trait de corde tressée : gaine sombre, fibre claire, torons en biais qui défilent quand la corde file. */
const Strand: React.FC<{ d: string; flow: number; width?: number }> = ({ d, flow, width = 13 }) => (
  <>
    <path d={d} stroke="#05070C" strokeWidth={width + 6} />
    <path d={d} stroke="#E9D9B8" strokeWidth={width} />
    <path d={d} stroke="#A98A5B" strokeWidth={width} strokeDasharray="4 9" strokeDashoffset={-flow} />
    <path d={d} stroke="#FFF6E0" strokeWidth={2.5} strokeDasharray="6 20" strokeDashoffset={-flow} opacity={0.7} />
  </>
);

export const Rope: React.FC<{ pulls: Pull[]; frame: number; hands: (f: number) => RopeHands }> = ({ pulls, frame, hands }) => {
  const p = pulls.find((x) => frame >= x.from - PULL_LEAD && frame < x.from + x.dur + ROPE_FALL);
  if (!p) return null;
  const { pts, fall } = simulate(p, frame, hands);
  const t = frame - p.from;
  const pr = clamp01(pullProgress(p.style, t));
  const now = hands(frame);
  const ring = ringAt(p, frame);
  const opacity = fall > 0 ? 1 - clamp01((fall - 5) / (ROPE_FALL - 5)) : 1;
  const held = fall < 4;
  // corde déjà halée : elle ressort de la main arrière et s'amasse en pendant
  const tailLen = 50 + 210 * pr;
  const sway = 14 * Math.sin(frame * 0.5);
  const tail = `M ${now.rear.x.toFixed(1)} ${now.rear.y.toFixed(1)} q ${(sway * 0.6).toFixed(1)} ${(tailLen * 0.5).toFixed(1)} ${sway.toFixed(1)} ${tailLen.toFixed(1)}`;
  const between = `M ${now.lead.x.toFixed(1)} ${now.lead.y.toFixed(1)} L ${now.rear.x.toFixed(1)} ${now.rear.y.toFixed(1)}`;
  const flow = pr * 1150;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g opacity={opacity} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Strand d={smoothPath(pts)} flow={flow} />
        {held && t >= 0 && <Strand d={between} flow={flow} />}
        {held && t >= 0 && <Strand d={tail} flow={flow} />}
      </g>
      {/* nœud et anneau d'attache, fixés au bord du tableau (disparaissent quand la corde est lâchée) */}
      {t >= 0 && fall < 6 && (
        <g opacity={1 - clamp01(fall / 6)}>
          <circle cx={ring.x} cy={ring.y} r={24} fill="#05070C" />
          <circle cx={ring.x} cy={ring.y} r={16} fill="none" stroke="#C9CED8" strokeWidth={7} />
          <circle cx={ring.x} cy={ring.y} r={9} fill="#E9D9B8" stroke="#05070C" strokeWidth={3} />
        </g>
      )}
    </svg>
  );
};
