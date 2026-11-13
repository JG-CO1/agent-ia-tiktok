import type { GhostPose, HandPose } from "./Ghost3D";
import type { Expression } from "./face";

export const restHand = (side: -1 | 1): HandPose => ({
  x: side * 1.08,
  y: -0.2,
  z: 0.25,
  dir: side === 1 ? -0.5 : Math.PI + 0.5,
  toCamera: 0,
  shape: "poing",
  scale: 1.15,
  roll: 0,
});

export function basePose(time = 0, expression: Expression = "neutre"): GhostPose {
  return {
    time,
    bodyX: 0,
    bodyY: 0,
    rotX: 0.06,
    rotY: 0,
    rotZ: 0,
    squash: 0,
    scale: 1,
    face: { expression, blink: 0, lookX: 0, lookY: 0, mouthOpen: 0, speaking: false, time, glow: 1 },
    left: restHand(-1),
    right: restHand(1),
    antennaTilt: 0,
    antennaGlow: 0.5,
    hemIntensity: 1,
    shadow: true,
  };
}
