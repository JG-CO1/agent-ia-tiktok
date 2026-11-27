/**
 * « Chaque fois que je regarde mon téléphone… » — composants dynamiques locaux : téléphone (écran émissif aux vrais
 * textes), pouce, poussière dans le faisceau de l'écran, yeux de Lila (la même couleur à tout âge), reflets dans les
 * pupilles de Noa, coiffures, canne, plaid, horloge murale, voitures de 2085. Tout est en blocs ; les lumières sont des
 * sprites et des cônes additifs (aucune lumière réelle).
 */
import React from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Bloc, type Teinte } from "../../avatar";
import { cadran, halo } from "../../textures";
import { Faisceau, Lueur } from "../lib";
import type { Acteur } from "../../ville/foule";
import { matTete, transformer } from "./fk";
import { texEcran } from "./ecran";

export const CYAN = "#37D8FF";

// ------------------------------------------------------------------ Téléphone
/** Téléphone en blocs (centre en 0, écran vers +z, 0,5 × 0,96). `cle` = texture de l'écran, null = éteint. */
export const Telephone: React.FC<{ cle: string | null; T: number; s?: number; pouce?: boolean; peau?: string; lueur?: number }> = ({ cle, T, s = 1, pouce = false, peau = "#E6B98F", lueur = 1 }) => {
  const k = (T * 1.4) % 1;
  const py = -0.18 + 0.4 * (k < 0.7 ? k / 0.7 : 1 - (k - 0.7) / 0.3);
  return (
    <group scale={s}>
      <Bloc s={[0.5, 0.96, 0.07]} c="#0E1016" brut />
      <Bloc p={[0, 0, -0.005]} s={[0.46, 0.92, 0.07]} c="#1A1D26" brut />
      {cle ? (
        <mesh position={[0, 0, 0.037]}>
          <planeGeometry args={[0.43, 0.86]} />
          <meshBasicMaterial map={texEcran(cle)} toneMapped={false} fog={false} />
        </mesh>
      ) : (
        <mesh position={[0, 0, 0.037]}>
          <planeGeometry args={[0.43, 0.86]} />
          <meshBasicMaterial color="#030407" fog={false} />
        </mesh>
      )}
      {cle && <Lueur p={[0, 0, 0.35]} s={1.9 * lueur} c={CYAN} o={0.26} />}
      {cle && <Lueur p={[0, 0, 0.6]} s={3.4 * lueur} c="#2A9BD6" o={0.1} />}
      {pouce && (
        <group position={[0.1, py, 0.12]} rotation={[0.5, 0, 0.15]}>
          <Bloc s={[0.1, 0.17, 0.08]} c={peau} />
        </group>
      )}
    </group>
  );
};

/** Poussière en suspension dans la lumière de l'écran : petits points qui dérivent. */
export const Poussieres: React.FC<{ T: number; p: V3; n?: number; rayon?: number; c?: string }> = ({ T, p, n = 26, rayon = 1.3, c = "#BFF3FF" }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = i * 2.399;
      const r = rayon * (0.25 + ((i * 37) % 10) / 13);
      const x = p[0] + Math.sin(a + T * 0.15) * r + Math.sin(T * 0.6 + i) * 0.12;
      const z = p[2] + Math.cos(a * 1.3) * r * 0.9 + Math.cos(T * 0.5 + i * 2) * 0.12;
      const y = p[1] + 0.2 + ((i * 17) % 9) * 0.17 + Math.sin(T * 0.7 + i) * 0.1;
      return <Bloc key={i} p={[x, y, z]} s={[0.04, 0.04, 0.04]} c={c} brut opacite={0.35 + Math.sin(T * 2 + i) * 0.25} />;
    })}
  </>
);

// ------------------------------------------------------------------ Visage : yeux de Lila, reflets de Noa
const memoVisage = new Map<string, THREE.Texture>();
const X_OEIL = [84, 172];
function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
  c.fill();
}
/** Calque de yeux (256 × 256) posé sur le visage : iris colorés (Lila) ou reflets cyan de l'écran (Noa). */
function texVisage(type: "lila" | "noa", grand: boolean): THREE.Texture {
  const cle = `${type}-${grand ? 1 : 0}`;
  let t = memoVisage.get(cle);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const c = cv.getContext("2d")!;
    const ow = grand ? 36 : 31;
    const oh = grand ? 58 : 46;
    for (const x of X_OEIL) {
      if (type === "lila") {
        c.fillStyle = "#0E8F86";
        rr(c, x - ow / 2, 116 - oh / 2, ow, oh, 11);
        c.fillStyle = "#33D3C4";
        rr(c, x - ow / 2 + 4, 116 - oh / 2 + 4, ow - 8, oh - 8, 8);
        c.fillStyle = "#07342F";
        rr(c, x - 7, 116 - 12, 14, 24, 5);
        c.fillStyle = "rgba(255,255,255,0.95)";
        c.fillRect(x - ow / 2 + 5, 116 - oh / 2 + 6, 8, 11);
        c.fillRect(x + 4, 116 + 5, 5, 6);
      } else {
        c.fillStyle = "#17171C";
        rr(c, x - 14, 116 - 23, 28, 46, 9);
        c.fillStyle = "#6FEBFF";
        rr(c, x - 10, 116 - 15, 20, 30, 6);
        c.fillStyle = "#EFFFFF";
        rr(c, x - 6, 116 - 9, 12, 18, 4);
      }
    }
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    tx.needsUpdate = true;
    t = tx;
    memoVisage.set(cle, t);
  }
  return t;
}
const EMO_OEIL_OUVERT = new Set(["neutre", "triste", "sourire", "apaise", "larmes", "surpris", "curieux", "inquiet", "attente", "resolu"]);
/** Calque d'yeux posé sur le visage d'un personnage (suit la tête). Disparaît au clignement et aux émotions « vide / effroi ». */
export const YeuxSup: React.FC<{ a: Acteur; frame: number; type: "lila" | "noa" }> = ({ a, frame, type }) => {
  const clin = !a.sansClin && (frame + a.graine * 37) % 104 > 99;
  if (clin || !EMO_OEIL_OUVERT.has(a.emotion)) return null;
  const tr = transformer(matTete(a));
  const grand = a.emotion === "surpris";
  return (
    <group position={tr.position} quaternion={tr.quaternion} scale={tr.scale}>
      <mesh position={[0, 0.4, 0.4045]} renderOrder={5}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial map={texVisage(type, grand)} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-3} color={type === "noa" ? "#FFFFFF" : "#FFFFFF"} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ Coiffures (repère de la tête : origine = base du crâne)
export type Coiffure = "noa" | "lila1" | "lila2" | "lila3" | "papa" | "aucune";
export const CoiffureTete: React.FC<{ a: Acteur; type: Coiffure; t: Teinte }> = ({ a, type, t }) => {
  if (type === "aucune") return null;
  const tr = transformer(matTete(a));
  const c = a.tenue.cheveux;
  return (
    <group position={tr.position} quaternion={tr.quaternion} scale={tr.scale}>
      {type === "noa" && (
        <>
          <Bloc p={[0.12, 1.04, 0.06]} s={[0.24, 0.2, 0.34]} c={c} t={t} r={[0.2, 0.3, 0.2]} />
          <Bloc p={[-0.26, 1.0, -0.08]} s={[0.26, 0.18, 0.3]} c={c} t={t} r={[-0.2, 0.5, -0.3]} />
          <Bloc p={[0.32, 0.96, 0.18]} s={[0.22, 0.14, 0.26]} c={c} t={t} r={[0.1, -0.4, 0.4]} />
          <Bloc p={[-0.05, 0.98, 0.34]} s={[0.4, 0.12, 0.16]} c={c} t={t} r={[0.4, 0.1, -0.1]} />
          <Bloc p={[0.4, 0.62, 0.3]} s={[0.1, 0.3, 0.2]} c={c} t={t} r={[0, 0, 0.2]} />
        </>
      )}
      {type === "lila1" && (
        <>
          {[-1, 1].map((s) => (
            <group key={s}>
              <Bloc p={[s * 0.56, 0.78, -0.1]} s={[0.26, 0.12, 0.26]} c="#F2C230" t={t} />
              <Bloc p={[s * 0.58, 0.5, -0.1]} s={[0.22, 0.5, 0.22]} c={c} t={t} r={[0, 0, s * 0.12]} />
              <Bloc p={[s * 0.6, 0.22, -0.1]} s={[0.16, 0.16, 0.16]} c={c} t={t} />
            </group>
          ))}
        </>
      )}
      {type === "lila2" && (
        <>
          <Bloc p={[0, 0.86, -0.52]} s={[0.26, 0.2, 0.2]} c="#F2C230" t={t} />
          <Bloc p={[0, 0.55, -0.64]} s={[0.24, 0.56, 0.22]} c={c} t={t} r={[0.3, 0, 0]} />
          <Bloc p={[0, 0.2, -0.78]} s={[0.18, 0.22, 0.18]} c={c} t={t} r={[0.5, 0, 0]} />
        </>
      )}
      {type === "lila3" && (
        <>
          <Bloc p={[0, 0.95, -0.4]} s={[0.4, 0.24, 0.34]} c="#F3F3F3" t={t} />
          <Bloc p={[0, 1.12, -0.4]} s={[0.22, 0.14, 0.2]} c="#F3F3F3" t={t} />
        </>
      )}
    </group>
  );
};

// ------------------------------------------------------------------ Objets divers
/** Canne de la vieille Lila (dessinée dans le repère du bout de la main droite : y vers le bas). */
export const Canne: React.FC = () => (
  <>
    <Bloc p={[0, 0.05, 0]} s={[0.14, 0.12, 0.34]} c="#5B3A22" />
    <Bloc p={[0, -0.7, 0]} s={[0.09, 1.5, 0.09]} c="#6B4A2F" />
    <Bloc p={[0, -1.47, 0]} s={[0.14, 0.06, 0.14]} c="#2A2A30" />
  </>
);

/** Plaid orange : sur les genoux de grand-mère, ou plié sur l'assise du fauteuil (repère : monde). */
export const Plaid: React.FC<{ p: V3; ry: number; plie: boolean; t: Teinte }> = ({ p, ry, plie, t }) => (
  <group position={p} rotation={[0, ry, 0]}>
    {plie ? (
      <>
        <Bloc p={[0, 0.09, 0.05]} s={[0.9, 0.18, 0.7]} c="#E8892E" t={t} />
        <Bloc p={[0, 0.2, 0.05]} s={[0.9, 0.05, 0.14]} c="#B8501F" t={t} />
        <Bloc p={[0, 0.2, -0.12]} s={[0.9, 0.05, 0.1]} c="#F4B860" t={t} />
      </>
    ) : (
      <>
        <Bloc p={[0, 0.1, 0.55]} s={[1.05, 0.14, 0.95]} c="#E8892E" t={t} />
        <Bloc p={[0, 0.0, 1.0]} s={[1.05, 0.7, 0.14]} c="#E8892E" t={t} />
        <Bloc p={[0, 0.19, 0.55]} s={[1.05, 0.04, 0.12]} c="#B8501F" t={t} />
        <Bloc p={[0, 0.19, 0.2]} s={[1.05, 0.04, 0.1]} c="#F4B860" t={t} />
      </>
    )}
  </group>
);

/** Horloge murale : cadran + aiguilles (heure h, 0–24). */
export const Horloge: React.FC<{ p: V3; h: number }> = ({ p, h }) => (
  <group position={p}>
    <mesh renderOrder={1}>
      <planeGeometry args={[1.14, 1.14]} />
      <meshBasicMaterial map={cadran()} color="#E8E2D2" />
    </mesh>
    <group position={[0, 0, 0.02]} rotation={[0, 0, -(h / 12) * Math.PI * 2]}>
      <Bloc p={[0, 0.15, 0]} s={[0.07, 0.34, 0.03]} c="#17171C" />
    </group>
    <group position={[0, 0, 0.04]} rotation={[0, 0, -(h % 1) * Math.PI * 2]}>
      <Bloc p={[0, 0.24, 0]} s={[0.045, 0.52, 0.03]} c="#17171C" />
    </group>
    <Bloc p={[0, 0, 0.055]} s={[0.1, 0.1, 0.03]} c="#C94A3A" />
  </group>
);

/** Halo plat de la lumière du jour qui tombe par une fenêtre : parallélogramme additif au sol. */
export const FlaqueSoleil: React.FC<{ p: V3; s: [number, number]; c: string; o: number; angle?: number }> = ({ p, s, c, o, angle = 0 }) => (
  <mesh position={p} rotation={[-Math.PI / 2, 0, angle]} renderOrder={2}>
    <planeGeometry args={s} />
    <meshBasicMaterial map={halo()} color={c} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} />
  </mesh>
);

export { Faisceau };
