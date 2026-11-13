/** Portrait de référence d'Ecto (planches de la bible visuelle). */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Ghost3D } from "./Ghost3D";
import { resolveGhost, type Gesture } from "./performance";
import type { Expression } from "./face";

export const Portrait: React.FC<{ expression: Expression; geste: Gesture; rotY?: number }> = ({ expression, geste, rotY }) => {
  const frame = useCurrentFrame();
  const g = resolveGhost({ beats: [{ frame: 0, anchor: "centre", expression, gesture: geste }], envelope: [], seed: 3 }, frame, 30);
  if (rotY !== undefined) g.pose.rotY = rotY;
  g.pose.face.blink = 0;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #1c2334 0%, #090b11 72%)" }}>
      <ThreeCanvas width={800} height={800} camera={{ fov: 22, position: [0, 0.15, 9.5] }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
        <Ghost3D pose={g.pose} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
