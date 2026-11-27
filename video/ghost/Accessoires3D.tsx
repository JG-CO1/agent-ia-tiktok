/**
 * Bibliothèque d'accessoires 3D d'Ecto (primitives procédurales : aucun fichier externe, aucun droit tiers).
 * Rendu = fonction pure de `PropRender` (voir accessoires.ts) : aucune horloge interne, rendu reproductible.
 * Les objets utilisent des matériaux standards éclairés par des lumières douces dédiées (le corps d'Ecto, lui, reste en matcap).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import type { Accessoire } from "../../src/core/colere";
import { BODY, bodyRadius } from "./geometry";
import type { PropRender } from "./accessoires";

const std = (color: string, roughness = 0.55, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

/** Éclairage chaud et doux des accessoires (les lumières n'agissent pas sur les matériaux matcap du corps). */
export const PropLights: React.FC = () => (
  <>
    <hemisphereLight args={["#fff4e6", "#5a3a30", 1.35]} />
    <directionalLight position={[-2.5, 3.5, 5]} intensity={2.2} color="#fff0dd" />
    <directionalLight position={[4, 1, 2]} intensity={0.9} color="#9be8ff" />
  </>
);

// ---------------------------------------------------------------- vapeur
const Steam: React.FC<{ age: number; y: number; spread?: number; amount?: number }> = ({ age, y, spread = 0.07, amount = 1 }) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.3, depthWrite: false }), []);
  return (
    <>
      {[0, 1, 2, 3].map((k) => {
        const u = (age * 0.022 + k * 0.25) % 1;
        const m = mat.clone();
        m.opacity = 0.34 * Math.sin(Math.PI * u) * amount;
        return (
          <mesh key={k} position={[spread * Math.sin(u * 7 + k * 2), y + 0.34 * u, 0.02 * k]} scale={0.6 + 1.3 * u} material={m}>
            <sphereGeometry args={[0.035, 12, 10]} />
          </mesh>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- tasses
const Tasse: React.FC<{ p: PropRender; chocolat: boolean }> = ({ p, chocolat }) => {
  const m = useMemo(
    () => ({
      cup: std(chocolat ? "#3E7CB1" : "#F6F0E6", 0.3, 0, { side: THREE.DoubleSide }),
      band: std("#F4561C", 0.4),
      liquid: std(chocolat ? "#4A2A17" : "#9A5A22", 0.15),
      foam: std("#FFF6EA", 0.8),
      handle: std(chocolat ? "#3E7CB1" : "#F6F0E6", 0.3),
    }),
    [chocolat],
  );
  const h = chocolat ? 0.27 : 0.2;
  const r = chocolat ? 0.17 : 0.16;
  const lathe = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, -h / 2),
      new THREE.Vector2(r * 0.62, -h / 2),
      new THREE.Vector2(r * 0.8, -h / 2 + 0.03),
      new THREE.Vector2(r, h / 2),
      new THREE.Vector2(r - 0.012, h / 2),
      new THREE.Vector2(r * 0.78 - 0.01, -h / 2 + 0.05),
      new THREE.Vector2(0.0, -h / 2 + 0.03),
    ];
    return new THREE.LatheGeometry(pts, 36);
  }, [h, r]);
  // le liquide frémit quand il est en colère
  const ripple = 1 + p.tremble * 0.05 * Math.sin(p.age * 1.9);
  return (
    <group>
      <mesh geometry={lathe} material={m.cup} />
      <mesh position={[0, h / 2 - 0.012, 0]} material={m.band} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r - 0.004, 0.011, 10, 40]} />
      </mesh>
      <mesh position={[0, h / 2 - (chocolat ? 0.05 : 0.04), 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[ripple, ripple, 1]} material={m.liquid}>
        <circleGeometry args={[r * 0.9, 32]} />
      </mesh>
      {chocolat &&
        [-0.07, 0.01, 0.075].map((x, i) => (
          <mesh key={i} position={[x, h / 2 - 0.03, 0.03 * (i - 1)]} material={m.foam}>
            <sphereGeometry args={[0.04, 14, 12]} />
          </mesh>
        ))}
      <mesh position={[r + 0.035, 0.0, 0]} material={m.handle}>
        <torusGeometry args={[chocolat ? 0.075 : 0.062, 0.016, 10, 24, Math.PI * 1.25]} />
      </mesh>
      <Steam age={p.age} y={h / 2} amount={1 - 0.7 * p.a} />
    </group>
  );
};

// ---------------------------------------------------------------- peluches
const Doudou: React.FC = () => {
  const m = useMemo(
    () => ({ fur: std("#F6E7CF", 0.95), ear: std("#F3B6BE", 0.9), dark: std("#2A1E1A", 0.4), cheek: std("#FF9FA6", 0.8, 0, { transparent: true, opacity: 0.8 }) }),
    [],
  );
  return (
    <group>
      <mesh position={[0, -0.02, 0]} scale={[1, 1.1, 0.9]} material={m.fur}>
        <sphereGeometry args={[0.22, 24, 20]} />
      </mesh>
      <mesh position={[0, 0.27, 0.02]} material={m.fur}>
        <sphereGeometry args={[0.17, 24, 20]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.085, 0.43, 0]} rotation={[0, 0, -s * 0.22]}>
          <mesh position={[0, 0.1, 0]} scale={[1, 1, 0.55]} material={m.fur}>
            <capsuleGeometry args={[0.052, 0.2, 8, 14]} />
          </mesh>
          <mesh position={[0, 0.1, 0.02]} scale={[0.55, 0.85, 0.5]} material={m.ear}>
            <capsuleGeometry args={[0.052, 0.2, 8, 14]} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <mesh position={[s * 0.065, 0.3, 0.155]} material={m.dark}>
            <sphereGeometry args={[0.018, 12, 10]} />
          </mesh>
          <mesh position={[s * 0.1, 0.25, 0.145]} scale={[1, 0.7, 0.6]} material={m.cheek}>
            <sphereGeometry args={[0.03, 12, 10]} />
          </mesh>
          <mesh position={[s * 0.2, -0.05, 0.06]} material={m.fur}>
            <sphereGeometry args={[0.07, 14, 12]} />
          </mesh>
          <mesh position={[s * 0.09, -0.22, 0.12]} material={m.fur}>
            <sphereGeometry args={[0.085, 14, 12]} />
          </mesh>
        </React.Fragment>
      ))}
      <mesh position={[0, 0.265, 0.165]} material={m.ear}>
        <sphereGeometry args={[0.018, 10, 8]} />
      </mesh>
    </group>
  );
};

const Peluche: React.FC = () => {
  const m = useMemo(
    () => ({ fur: std("#B27B4A", 0.95), light: std("#E8CFA8", 0.95), dark: std("#241713", 0.4), scarf: std("#F4561C", 0.7) }),
    [],
  );
  return (
    <group>
      <mesh position={[0, -0.03, 0]} scale={[1, 1.08, 0.88]} material={m.fur}>
        <sphereGeometry args={[0.22, 24, 20]} />
      </mesh>
      <mesh position={[0, -0.05, 0.17]} scale={[1, 1.1, 0.4]} material={m.light}>
        <sphereGeometry args={[0.13, 20, 16]} />
      </mesh>
      <mesh position={[0, 0.25, 0.02]} material={m.fur}>
        <sphereGeometry args={[0.17, 24, 20]} />
      </mesh>
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <mesh position={[s * 0.125, 0.39, 0]} material={m.fur}>
            <sphereGeometry args={[0.058, 14, 12]} />
          </mesh>
          <mesh position={[s * 0.125, 0.39, 0.03]} scale={[0.6, 0.6, 0.4]} material={m.light}>
            <sphereGeometry args={[0.058, 12, 10]} />
          </mesh>
          <mesh position={[s * 0.065, 0.285, 0.15]} material={m.dark}>
            <sphereGeometry args={[0.017, 10, 8]} />
          </mesh>
          <mesh position={[s * 0.22, -0.02, 0.05]} material={m.fur}>
            <sphereGeometry args={[0.075, 14, 12]} />
          </mesh>
          <mesh position={[s * 0.1, -0.26, 0.1]} material={m.fur}>
            <sphereGeometry args={[0.09, 14, 12]} />
          </mesh>
        </React.Fragment>
      ))}
      <mesh position={[0, 0.23, 0.17]} scale={[1, 0.8, 0.8]} material={m.light}>
        <sphereGeometry args={[0.07, 16, 12]} />
      </mesh>
      <mesh position={[0, 0.25, 0.235]} material={m.dark}>
        <sphereGeometry args={[0.02, 10, 8]} />
      </mesh>
      <mesh position={[0, 0.115, 0.04]} rotation={[Math.PI / 2 - 0.1, 0, 0]} material={m.scarf}>
        <torusGeometry args={[0.15, 0.035, 10, 28]} />
      </mesh>
    </group>
  );
};

const Coussin: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.62, 0.5, 0.2, 18, 14, 6);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const nx = x / 0.31;
      const ny = y / 0.25;
      // coussin gonflé au centre, coins pincés
      const edge = Math.max(Math.abs(nx), Math.abs(ny));
      const puff = 1 - 0.55 * Math.pow(edge, 4);
      pos.setZ(i, z * (0.45 + 0.9 * puff));
      pos.setX(i, x * (1 - 0.05 * ny * ny));
      pos.setY(i, y * (1 - 0.05 * nx * nx));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const m = useMemo(() => ({ cloth: std("#8FD3C9", 0.9), button: std("#2F6F66", 0.5) }), []);
  return (
    <group>
      <mesh geometry={geo} material={m.cloth} />
      <mesh position={[0, 0, 0.12]} material={m.button}>
        <sphereGeometry args={[0.03, 12, 10]} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- livre
function useLinesTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 320;
    const g = c.getContext("2d")!;
    g.fillStyle = "#FAF6EA";
    g.fillRect(0, 0, 256, 320);
    g.strokeStyle = "#8A8070";
    g.lineWidth = 3;
    g.lineCap = "round";
    for (let i = 0; i < 12; i++) {
      const y = 36 + i * 22;
      const w = i % 5 === 4 ? 110 : 188;
      g.beginPath();
      g.moveTo(34, y);
      g.lineTo(34 + w, y);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

const Livre: React.FC<{ p: PropRender }> = ({ p }) => {
  const tex = useLinesTexture();
  const m = useMemo(
    () => ({ cover: std("#2B3A67", 0.6), page: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), edge: std("#EDE5D2", 0.9) }),
    [tex],
  );
  // une page se tourne une fois par cycle (de droite à gauche), puis le livre redevient immobile
  const f = (p.age - 30) % 110;
  const flip = f >= 0 && f < 16 ? f / 16 : 0;
  const ang = Math.PI * (flip * flip * (3 - 2 * flip));
  return (
    <group rotation={[0, 0, 0]}>
      <mesh position={[0, 0, -0.03]} material={m.cover}>
        <boxGeometry args={[0.66, 0.46, 0.03]} />
      </mesh>
      <mesh position={[-0.155, 0, 0.0]} rotation={[0, 0.07, 0]} material={m.page}>
        <boxGeometry args={[0.3, 0.4, 0.025]} />
      </mesh>
      <mesh position={[0.155, 0, 0.0]} rotation={[0, -0.07, 0]} material={m.page}>
        <boxGeometry args={[0.3, 0.4, 0.025]} />
      </mesh>
      {flip > 0 && (
        <group rotation={[0, -ang, 0]}>
          <mesh position={[0.15, 0, 0.02]} material={m.page}>
            <boxGeometry args={[0.3, 0.4, 0.01]} />
          </mesh>
        </group>
      )}
      <mesh position={[0, 0, -0.005]} material={m.cover}>
        <boxGeometry args={[0.02, 0.44, 0.02]} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- fleur
const Fleur: React.FC<{ p: PropRender }> = ({ p }) => {
  const m = useMemo(
    () => ({ stem: std("#4CAF50", 0.7), petal: std("#FF8FB3", 0.6), center: std("#FFD54F", 0.5) }),
    [],
  );
  const sway = 0.05 * Math.sin(p.age * 0.12);
  return (
    <group rotation={[0, 0, sway]}>
      <mesh position={[0, 0, 0]} material={m.stem}>
        <cylinderGeometry args={[0.014, 0.018, 0.56, 10]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.06, -0.08 + (s > 0 ? 0.08 : 0), 0]} rotation={[0, 0, -s * 0.9]} scale={[1, 0.28, 0.5]} material={m.stem}>
          <sphereGeometry args={[0.07, 14, 10]} />
        </mesh>
      ))}
      <group position={[0, 0.3, 0]}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.075, Math.sin(a) * 0.075, 0.0]} rotation={[0, 0, a]} scale={[1.5, 0.85, 0.5]} material={m.petal}>
              <sphereGeometry args={[0.052, 14, 10]} />
            </mesh>
          );
        })}
        <mesh position={[0, 0, 0.02]} material={m.center}>
          <sphereGeometry args={[0.052, 16, 12]} />
        </mesh>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- lunettes
const Lunettes: React.FC<{ p: PropRender }> = ({ p }) => {
  const m = useMemo(
    () => ({
      frame: std("#6B3B1F", 0.35, 0.1),
      lens: new THREE.MeshBasicMaterial({ color: "#BFE6FF", transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }),
      glint: new THREE.MeshBasicMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
    }),
    [],
  );
  const glint = ((p.age * 0.03) % 1) * 0.26 - 0.13;
  const adjust = p.a * 0.012;
  return (
    <group position={[0, adjust, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.19, 0, 0]} rotation={[0, s * 0.14, 0]}>
          <mesh material={m.frame}>
            <torusGeometry args={[0.105, 0.013, 12, 40]} />
          </mesh>
          <mesh material={m.lens}>
            <circleGeometry args={[0.1, 28]} />
          </mesh>
          <mesh position={[glint, 0.02, 0.002]} rotation={[0, 0, 0.6]} material={m.glint}>
            <planeGeometry args={[0.012, 0.11]} />
          </mesh>
          <mesh position={[s * 0.1, 0.0, -0.07]} rotation={[0, s * 1.2, 0]} material={m.frame}>
            <capsuleGeometry args={[0.009, 0.16, 6, 8]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} material={m.frame}>
        <capsuleGeometry args={[0.008, 0.1, 6, 8]} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- plaid / couverture
function useClothTexture(kind: "plaid" | "couverture") {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    if (kind === "plaid") {
      g.fillStyle = "#B8472B";
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = "rgba(40,20,20,0.55)";
      for (const p of [24, 152]) {
        g.fillRect(p, 0, 36, 256);
        g.fillRect(0, p, 256, 36);
      }
      g.fillStyle = "rgba(255,240,215,0.85)";
      for (const p of [96, 224]) {
        g.fillRect(p, 0, 8, 256);
        g.fillRect(0, p, 256, 8);
      }
    } else {
      g.fillStyle = "#9DB7E6";
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = "rgba(255,255,255,0.5)";
      for (let y = 8; y < 256; y += 64) g.fillRect(0, y, 256, 10);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 1.5);
    return t;
  }, [kind]);
}

const THETA_STEPS = 72;
const Y_STEPS = 10;
const CLOTH_Y0 = -0.82;
const CLOTH_Y1 = 0.0;

const Plaid: React.FC<{ p: PropRender; kind: "plaid" | "couverture" }> = ({ p, kind }) => {
  const tex = useClothTexture(kind);
  const { geo, count } = useMemo(() => {
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= THETA_STEPS; i++) {
      const th = (i / THETA_STEPS) * Math.PI * 2;
      for (let j = 0; j <= Y_STEPS; j++) {
        const y = CLOTH_Y0 + ((CLOTH_Y1 - CLOTH_Y0) * j) / Y_STEPS;
        const u = j / Y_STEPS;
        // plis verticaux et bord supérieur ondulé
        const fold = 0.028 * Math.sin(th * 9 + u * 2.5) + 0.016 * Math.sin(th * 5 - u * 4);
        const r = bodyRadius(y) + 0.045 + fold + 0.03 * u;
        const yy = y + (j === Y_STEPS ? 0.03 * Math.sin(th * 6) : 0);
        pos.push(r * Math.sin(th), yy, r * Math.cos(th));
        uv.push(i / THETA_STEPS, u);
      }
    }
    for (let i = 0; i < THETA_STEPS; i++) {
      for (let j = 0; j < Y_STEPS; j++) {
        const a = i * (Y_STEPS + 1) + j;
        const b = a + 1;
        const c = a + (Y_STEPS + 1);
        const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return { geo: g, count: idx.length };
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide }), [tex]);
  const roll = useMemo(() => std(kind === "plaid" ? "#9A3A22" : "#7F9BD0", 0.95), [kind]);
  // l'enroulement progresse de l'arrière vers l'avant (apparition), puis le tissu respire
  const wrap = Math.min(1, p.s);
  const breathe = 1 + 0.012 * Math.sin(p.age * 0.09) + 0.02 * p.a;
  geo.setDrawRange(0, Math.floor((count * wrap) / 6) * 6);
  const rollR = bodyRadius(CLOTH_Y1) + 0.08;
  return (
    <group scale={[breathe, 1, breathe]} rotation={[0, Math.PI * (1 - wrap) * 0.6, 0]}>
      <mesh geometry={geo} material={mat} />
      {wrap > 0.98 && (
        <mesh position={[0, CLOTH_Y1 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={roll}>
          <torusGeometry args={[rollR, 0.055, 12, 56]} />
        </mesh>
      )}
    </group>
  );
};

// ---------------------------------------------------------------- bonnet de Père Noël
/** Cône recourbé : le bout retombe sur le côté (origine = centre du bord, axe vertical). */
function useConeGeometry() {
  return useMemo(() => {
    const N = 22;
    const M = 36;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const r = 0.58 * Math.pow(1 - t, 0.82) + 0.012;
      const cx = 0.42 * Math.pow(t, 2.1);
      const cy = 0.82 * t - 0.3 * Math.pow(t, 2.1);
      for (let j = 0; j <= M; j++) {
        const a = (j / M) * Math.PI * 2;
        pos.push(cx + r * Math.cos(a), cy, r * Math.sin(a));
      }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
      const a = i * (M + 1) + j;
      idx.push(a, a + M + 1, a + 1, a + 1, a + M + 1, a + M + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
}

/** Le bonnet seul : rouge, bordure de fourrure blanche, pompon. `sway` fait balancer le pompon. */
export const Chapeau: React.FC<{ sway?: number }> = ({ sway = 0 }) => {
  const cone = useConeGeometry();
  const m = useMemo(() => ({ red: std("#D81E2A", 0.72, 0, { side: THREE.DoubleSide }), fur: std("#FFFFFF", 0.95, 0, { emissive: "#6a6a6a" }), shade: std("#F0EAE4", 0.95) }), []);
  const tipX = 0.42;
  const tipY = 0.82 - 0.3;
  return (
    <group>
      <mesh geometry={cone} material={m.red} />
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.8]} material={m.fur}>
        <torusGeometry args={[0.6, 0.115, 16, 48]} />
      </mesh>
      <mesh position={[0.0, -0.02, 0.0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.5]} material={m.shade}>
        <torusGeometry args={[0.54, 0.09, 12, 40]} />
      </mesh>
      <group position={[tipX, tipY, 0]} rotation={[0, 0, sway]}>
        <mesh position={[0.05, -0.04, 0]} material={m.fur}>
          <sphereGeometry args={[0.15, 18, 14]} />
        </mesh>
      </group>
    </group>
  );
};

/** Bonnet porté : posé en arrière sur le dôme, légèrement de travers ; il tremble avec la colère. */
export const BonnetPorte: React.FC<{ hat: { s: number; tremble: number; bob: number }; time: number }> = ({ hat, time }) => {
  const sway = 0.16 * Math.sin(time * 2.4) + hat.tremble * 0.2 * Math.sin(time * 38) + hat.bob * 0.5;
  return (
    <group position={[-0.1, 0.94 + 0.04 * hat.bob, 0.0]} rotation={[-0.16, 0, 0.2 + hat.tremble * 0.03 * Math.sin(time * 45)]} scale={Math.max(0.0001, hat.s) * 0.98}>
      <Chapeau sway={sway} />
    </group>
  );
};

// ---------------------------------------------------------------- éclat d'apparition / de départ
const Poof: React.FC<{ t: number; color?: string }> = ({ t, color = "#FFE3B0" }) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, toneMapped: false }), [color]);
  const m = mat.clone();
  m.opacity = Math.max(0, 1 - t) * 0.9;
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const rad = 0.12 + 0.46 * (1 - Math.pow(1 - t, 3));
        return (
          <mesh key={i} position={[Math.cos(a) * rad, Math.sin(a) * rad, 0.12]} scale={(0.5 + 0.5 * (i % 3)) * (1 - 0.6 * t)} material={m}>
            <sphereGeometry args={[0.03, 8, 6]} />
          </mesh>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- assemblage
export const OBJET: Record<Accessoire | "chapeau", React.FC<{ p: PropRender }>> = {
  chapeau: () => (
    <group scale={0.42} position={[0, -0.16, 0]}>
      <Chapeau />
    </group>
  ),
  the: ({ p }) => <Tasse p={p} chocolat={false} />,
  chocolat: ({ p }) => <Tasse p={p} chocolat />,
  doudou: () => <Doudou />,
  peluche: () => <Peluche />,
  coussin: () => <Coussin />,
  plaid: ({ p }) => <Plaid p={p} kind="plaid" />,
  couverture: ({ p }) => <Plaid p={p} kind="couverture" />,
  lunettes: ({ p }) => <Lunettes p={p} />,
  livre: ({ p }) => <Livre p={p} />,
  fleur: ({ p }) => <Fleur p={p} />,
};

/** Accessoire tenu, dans le repère du corps d'Ecto (à placer dans le groupe du corps). */
export const Accessoire3D: React.FC<{ prop: PropRender }> = ({ prop: p }) => {
  const Obj = OBJET[p.id];
  const burst = p.poof > 0 ? 1 - p.poof : p.vanish > 0 ? p.vanish : -1;
  // les tissus enroulés sont ancrés au corps, les autres à la main
  const anchored = p.id === "plaid" || p.id === "couverture";
  return (
    <>
      <PropLights />
      <group position={anchored ? [0, 0, 0] : [p.x, p.y, p.z]} rotation={anchored ? [0, 0, 0] : [p.rx, p.ry, p.rz]} scale={anchored ? 1 : Math.max(0.0001, p.s)}>
        {p.s > 0.002 && <Obj p={p} />}
        {burst >= 0 && <Poof t={Math.min(1, burst)} color={p.id === "fleur" ? "#FFC2D6" : "#FFE3B0"} />}
      </group>
    </>
  );
};

export { BODY };
