import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Ghost3D } from "./Ghost3D";
import { resolveGhost, type Performance } from "./performance";

export const GHOST_CANVAS = 1000;

/** Calque du présentateur : un canvas 3D 1000x1000 positionné et mis à l'échelle dans la frame. */
export const GhostLayer: React.FC<{ perf: Performance }> = ({ perf }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = resolveGhost(perf, frame, fps);
  // Taille réelle du canevas selon l'échelle affichée (paliers pour éviter les redimensionnements continus)
  const size = g.s >= 0.9 ? GHOST_CANVAS : g.s >= 0.7 ? 780 : g.s >= 0.55 ? 660 : 520;
  const cssScale = (GHOST_CANVAS * g.s) / size;
  return (
    <div
      style={{
        position: "absolute",
        left: g.x - size / 2,
        top: g.y - size / 2,
        width: size,
        height: size,
        transform: `scale(${cssScale})`,
        transformOrigin: "50% 50%",
        pointerEvents: "none",
      }}
    >
      <ThreeCanvas
        width={size}
        height={size}
        camera={{ fov: 22, position: [0, 0.15, 9.5] }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <Ghost3D pose={g.pose} />
      </ThreeCanvas>
    </div>
  );
};
