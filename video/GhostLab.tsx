import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { GhostLayer } from "./ghost/GhostLayer";
import { GESTURES, type GhostBeat, type Performance } from "./ghost/performance";
import { EXPRESSIONS } from "./ghost/face";

/** Banc d'essai du personnage : enchaîne gestes, expressions et positions. */
export const GhostLab: React.FC<{ beats?: GhostBeat[] }> = ({ beats }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const demo: GhostBeat[] =
    beats ??
    GESTURES.map((g, i) => ({
      frame: Math.round(i * 1.2 * fps),
      gesture: g,
      expression: EXPRESSIONS[i % EXPRESSIONS.length],
    }));
  // Enveloppe de parole factice (syllabes ~5/s) pour tester la bouche
  const envelope = Array.from({ length: durationInFrames }, (_, f) => {
    const t = f / fps;
    const syll = Math.max(0, Math.sin(t * Math.PI * 5));
    const phrase = Math.sin(t * 0.9) > -0.4 ? 1 : 0;
    return syll * phrase * 0.9;
  });
  const perf: Performance = { beats: demo, envelope, seed: 7 };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #1d2433 0%, #0a0c12 70%)" }}>
      <GhostLayer perf={perf} />
    </AbsoluteFill>
  );
};
