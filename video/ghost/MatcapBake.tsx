/** Pré-calcul des matcaps : une sphère rendue avec le matériau physique, sous l'éclairage studio. */
import React from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { EnvironmentSetup, StudioLights } from "./Ghost3D";
import { physicalMaterial, type MatcapName } from "./materials";

export const MatcapBake: React.FC<{ materiau: MatcapName }> = ({ materiau }) => {
  const mat = React.useMemo(() => physicalMaterial(materiau), [materiau]);
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <ThreeCanvas
        width={512}
        height={512}
        orthographic
        camera={{ zoom: 259, position: [0, 0.16, 9.5], near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      >
        <EnvironmentSetup />
        <StudioLights />
        <mesh material={mat}>
          <sphereGeometry args={[1, 192, 128]} />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
