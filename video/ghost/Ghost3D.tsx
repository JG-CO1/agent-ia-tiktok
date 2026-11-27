/**
 * Ecto, le fantôme robot présentateur — modèle 3D (React Three Fiber).
 * Le rendu est une fonction pure de `pose` : aucune horloge interne, donc 100 % reproductible.
 * Deux modes : « matcap » (production, rapide) et « physique » (référence PBR, sert à pré-calculer les matcaps).
 */
import React, { use, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { BODY, createBezelGeometry, createBodyGeometry, createScreenGeometry, updateHem } from "./geometry";
import { drawFace, FACE_H, FACE_W, type FaceState } from "./face";
import { loadMatcaps, matcapMaterials, physicalMaterial, useLedMaterial } from "./materials";
import type { PropRender } from "./accessoires";
import { Accessoire3D, BonnetPorte, PropLights } from "./Accessoires3D";

export { PALETTE } from "./materials";

export type HandShape = "ouverte" | "pointe" | "poing" | "pouce";

export interface HandPose {
  x: number;
  y: number;
  z: number;
  /** Direction du doigt dans le plan de l'écran (rad) : 0 = droite, PI/2 = haut. */
  dir: number;
  /** 0..1 : oriente la main vers la caméra (« toi ! »). */
  toCamera: number;
  shape: HandShape;
  scale: number;
  /** Rotation autour de l'axe du bras (pour saluer). */
  roll: number;
}

export interface GhostPose {
  time: number;
  bodyX: number;
  bodyY: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  /** >0 écrase, <0 étire (squash & stretch). */
  squash: number;
  scale: number;
  face: FaceState;
  left: HandPose;
  right: HandPose;
  antennaTilt: number;
  antennaGlow: number;
  hemIntensity: number;
  shadow: boolean;
  /** Colère continue 0..2 : LED d'antenne et des oreilles qui rougissent. */
  rage?: number;
  /** Accessoire tenu (voir accessoires.ts), dessiné dans le repère du corps. */
  prop?: PropRender | null;
  /** Bonnet de Père Noël porté (saison) : échelle d'apparition, tremblement, rebond de remise. */
  hat?: { s: number; tremble: number; bob: number } | null;
}

/** Éclairage studio (identique pour le rendu physique et le pré-calcul des matcaps). */
export const StudioLights: React.FC = () => (
  <>
    <hemisphereLight args={["#fff3ea", "#2a120c", 0.2]} />
    <directionalLight position={[-3, 4.2, 4.5]} intensity={2.5} color="#ffe8d4" />
    <directionalLight position={[5.5, 2.2, -2.2]} intensity={5.5} color="#52f2ff" />
    <directionalLight position={[-5.5, 1.2, -2.5]} intensity={2.4} color="#ff9a66" />
    <directionalLight position={[1.5, -3, 4]} intensity={0.3} color="#ffc2a0" />
  </>
);

export const EnvironmentSetup: React.FC = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.0;
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;
    pmrem.dispose();
  }, [gl, scene]);
  return null;
};

/** Canvas du visage redessiné à chaque changement d'état (pendant le rendu, donc avant l'affichage). */
function useFaceTexture(face: FaceState) {
  const { ctx, texture } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = FACE_W;
    canvas.height = FACE_H;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return { ctx: canvas.getContext("2d")!, texture };
  }, []);
  useMemo(() => {
    drawFace(ctx, face);
    texture.needsUpdate = true;
  }, [ctx, texture, face.expression, face.blink, face.lookX, face.lookY, face.mouthOpen, face.speaking, face.time, face.glow, face.rage]);
  return texture;
}

const Hand: React.FC<{ pose: HandPose; material: THREE.Material }> = ({ pose, material }) => {
  const leftward = Math.cos(pose.dir) < 0;
  const ry = (leftward ? Math.PI : 0) + (leftward ? 1 : -1) * pose.toCamera * (Math.PI / 2);
  const rz = leftward ? Math.PI - pose.dir : pose.dir;
  const extendIndex = pose.shape === "pointe" ? 1 : 0;
  const thumbUp = pose.shape === "pouce";
  const thumbOpen = pose.shape === "ouverte" ? 1 : pose.shape === "pointe" ? 0.25 : 0;
  return (
    <group position={[pose.x, pose.y, pose.z]} scale={pose.scale}>
      <group rotation={[pose.roll, ry, rz]}>
        <mesh material={material} scale={[1, 0.9, 0.74]}>
          <sphereGeometry args={[0.165, 40, 28]} />
        </mesh>
        {extendIndex > 0 && (
          <mesh material={material} position={[0.14 + 0.07 * extendIndex, 0.035, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 0.35 + 0.65 * extendIndex, 1]}>
            <capsuleGeometry args={[0.058, 0.15, 8, 20]} />
          </mesh>
        )}
        <mesh
          material={material}
          position={thumbUp ? [0.0, 0.17, 0.02] : [0.02 + 0.04 * thumbOpen, 0.11 + 0.04 * thumbOpen, 0.07]}
          rotation={thumbUp ? [0, 0, 0] : [0, 0, -0.5 - 0.5 * thumbOpen]}
        >
          <capsuleGeometry args={[0.05, thumbUp ? 0.13 : 0.07, 8, 16]} />
        </mesh>
      </group>
    </group>
  );
};

function useShadowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(0,0,0,0.55)");
    grd.addColorStop(0.5, "rgba(0,0,0,0.22)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
}

interface Mats {
  body: THREE.Material;
  hand: THREE.Material;
  metal: THREE.Material;
  face: THREE.Material;
  glass: THREE.Material | null;
  led: THREE.Material;
}

const GhostBody: React.FC<{ pose: GhostPose; mats: Mats }> = ({ pose, mats }) => {
  const bodyGeo = useMemo(() => createBodyGeometry(), []);
  const screenGeo = useMemo(() => createScreenGeometry(), []);
  const bezelGeo = useMemo(() => createBezelGeometry(), []);
  const shadowTex = useShadowTexture();
  useMemo(() => updateHem(bodyGeo, pose.time, pose.hemIntensity), [bodyGeo, pose.time, pose.hemIntensity]);
  const sq = pose.squash;
  const sy = 1 - sq;
  const sxz = 1 + sq * 0.55;
  const top = BODY.yc + BODY.R;
  return (
    <group scale={pose.scale}>
      {pose.shadow && (
        <mesh position={[pose.bodyX, -1.32, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={1 - Math.max(-0.4, Math.min(0.4, pose.bodyY * 0.35))}>
          <planeGeometry args={[2.3, 1.1]} />
          <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={0.8} toneMapped={false} />
        </mesh>
      )}
      <group position={[pose.bodyX, pose.bodyY, 0]} rotation={[pose.rotX, pose.rotY, pose.rotZ]}>
        <group scale={[sxz, sy, sxz]} position={[0, -0.8 * (1 - sy), 0]}>
          <mesh geometry={bodyGeo} material={mats.body} />
          <mesh geometry={screenGeo} material={mats.face} />
          {mats.glass && <mesh geometry={screenGeo} material={mats.glass} />}
          <mesh geometry={bezelGeo} material={mats.metal} />
          {[-1, 1].map((s) => (
            <group key={s} position={[s * (BODY.R + 0.005), BODY.yc + 0.02, -0.02]} rotation={[0, 0, Math.PI / 2]}>
              <mesh material={mats.metal}>
                <cylinderGeometry args={[0.17, 0.19, 0.13, 40]} />
              </mesh>
              <mesh material={mats.led} position={[0, s * -0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.105, 0.016, 12, 48]} />
              </mesh>
            </group>
          ))}
          {pose.hat && (
            <>
              {!pose.prop && <PropLights />}
              <BonnetPorte hat={pose.hat} time={pose.time} />
            </>
          )}
          <group position={[0.06, top - 0.03, 0]} rotation={[0, 0, -0.18 + pose.antennaTilt]}>
            <mesh material={mats.metal} position={[0, 0.13, 0]}>
              <cylinderGeometry args={[0.02, 0.028, 0.26, 16]} />
            </mesh>
            <mesh material={mats.led} position={[0, 0.3, 0]}>
              <sphereGeometry args={[0.072, 28, 20]} />
            </mesh>
          </group>
        </group>
        {pose.prop && <Accessoire3D prop={pose.prop} />}
        <Hand pose={pose.left} material={mats.hand} />
        <Hand pose={pose.right} material={mats.hand} />
      </group>
    </group>
  );
};

const GhostMatcap: React.FC<{ pose: GhostPose }> = ({ pose }) => {
  const tex = use(loadMatcaps()); // suspend jusqu'au chargement (voir loadMatcaps)
  const faceTex = useFaceTexture(pose.face);
  const led = useLedMaterial(pose.antennaGlow);
  // LED de l'antenne et des oreilles : elles rougissent avec la colère (les yeux, eux, sont dessinés dans face.ts)
  if ((pose.rage ?? 0) > 0.02) led.color.lerp(new THREE.Color("#FF2A18"), Math.min(1, (pose.rage ?? 0) * 1.3));
  const base = useMemo(() => matcapMaterials(tex), [tex]);
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false }), [faceTex]);
  return <GhostBody pose={pose} mats={{ ...base, face, led }} />;
};

const GhostPhysical: React.FC<{ pose: GhostPose }> = ({ pose }) => {
  const faceTex = useFaceTexture(pose.face);
  const mats = useMemo(() => {
    const face = new THREE.MeshPhysicalMaterial({
      map: faceTex,
      emissiveMap: faceTex,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 1.3,
      roughness: 0.18,
      metalness: 0.05,
      clearcoat: 0.35,
      clearcoatRoughness: 0.28,
      envMapIntensity: 0.14,
    });
    const led = new THREE.MeshStandardMaterial({ color: "#8CFFF0", emissive: new THREE.Color("#8CFFF0"), emissiveIntensity: 2.2, roughness: 0.3 });
    return { body: physicalMaterial("corps"), hand: physicalMaterial("main"), metal: physicalMaterial("metal"), face, glass: null, led };
  }, [faceTex]);
  (mats.led as THREE.MeshStandardMaterial).emissiveIntensity = 1.6 + 1.4 * pose.antennaGlow;
  return (
    <>
      <EnvironmentSetup />
      <StudioLights />
      <GhostBody pose={pose} mats={mats} />
    </>
  );
};

export const Ghost3D: React.FC<{ pose: GhostPose; mode?: "matcap" | "physique" }> = ({ pose, mode = "matcap" }) =>
  mode === "physique" ? <GhostPhysical pose={pose} /> : <GhostMatcap pose={pose} />;
