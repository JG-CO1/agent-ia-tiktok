import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, LAYOUT } from "../theme";
import { enter } from "./anim";

/** Barre de progression fine en haut (rétention). */
export const ProgressBar: React.FC<{ accent: string }> = ({ accent }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = Math.min(1, f / Math.max(1, durationInFrames - 1));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 10, background: "rgba(255,255,255,0.06)" }}>
      <div style={{ width: `${p * 100}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.orange}, ${accent})`, boxShadow: `0 0 18px ${accent}` }} />
    </div>
  );
};

/** Badge de format + nom du média, en haut à gauche. */
export const FormatBadge: React.FC<{ accent: string; label: string; handle: string }> = ({ accent, label, handle }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(f, fps, 4);
  return (
    <div
      style={{
        position: "absolute",
        left: LAYOUT.margin,
        top: LAYOUT.badgeY - 30,
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: p,
        transform: `translateX(${(1 - p) * -30}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 22px 10px 16px",
          borderRadius: 999,
          background: "rgba(10,13,22,0.72)",
          border: `1.5px solid ${accent}55`,
          fontFamily: FONTS.display,
          fontWeight: 800,
          fontSize: 27,
          letterSpacing: 3,
          color: accent,
        }}
      >
        <div style={{ width: 14, height: 14, borderRadius: 7, background: accent, boxShadow: `0 0 14px ${accent}` }} />
        {label}
      </div>
      <div style={{ fontFamily: FONTS.text, fontWeight: 600, fontSize: 26, color: COLORS.dim }}>{handle}</div>
    </div>
  );
};

/** Badge « Source : … » affiché pendant les scènes factuelles. */
export const SourceBadge: React.FC<{ label: string; y: number; localFrame: number }> = ({ label, y, localFrame }) => {
  const { fps } = useVideoConfig();
  const p = enter(localFrame, fps, 10);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: p * 0.95 }}>
      <div
        style={{
          padding: "8px 20px",
          borderRadius: 999,
          background: "rgba(8,10,16,0.75)",
          border: "1px solid rgba(255,255,255,0.12)",
          fontFamily: FONTS.text,
          fontWeight: 500,
          fontSize: 24,
          color: COLORS.dim,
          letterSpacing: 0.3,
        }}
      >
        Source&nbsp;: <span style={{ color: COLORS.text, fontFamily: FONTS.mono, fontSize: 23 }}>{label}</span>
      </div>
    </div>
  );
};
