/**
 * « Interdit de sortir » — éléments dynamiques : voûte du ciel et soleil, brume de la vallée, sirènes (faisceaux, ondes), grande porte
 * scellée (chaînes, planches, panneau) qui s'ouvre, jumelles de cuivre, pancarte, feu d'artifice, masques et bonnet des personnages.
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Avatar, Bloc, HANCHE, type Teinte } from "../../avatar";
import { halo } from "../../textures";
import { Faisceau, Lueur, Tache } from "../lib";
import { alea, entre, lisse, mel } from "../../maths";
import type { Acteur } from "../../ville/foule";
import { COIFFE_GRIS, MASQUES } from "./histoire";
import { couleursCiel, hexMel } from "./ciel";
import { EP, GATE_H, GATE_W, GATE_X, HW, SIRENE, ZB } from "./monde";
import { texPancarte, texPanneauVille } from "./toile";

// ------------------------------------------------------------------ Voûte du ciel, soleil, lune
const voutes = new Map<number, THREE.CanvasTexture>();
function texVoute(q: number): THREE.CanvasTexture {
  let t = voutes.get(q);
  if (t) return t;
  const c = couleursCiel(q / 24);
  const cv = document.createElement("canvas");
  cv.width = 4;
  cv.height = 256;
  const g = cv.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, c.t);
  gr.addColorStop(0.3, hexMel(c.t, c.m, 0.8));
  gr.addColorStop(0.42, c.m);
  gr.addColorStop(0.48, hexMel(c.m, c.h, 0.75));
  gr.addColorStop(0.5, c.h);
  gr.addColorStop(0.56, hexMel(c.h, "#1A1020", 0.35));
  gr.addColorStop(1, hexMel(c.h, "#1A1020", 0.35));
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
  t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  voutes.set(q, t);
  return t;
}
let disque: THREE.CanvasTexture | null = null;
function texDisque(): THREE.CanvasTexture {
  if (!disque) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    r.addColorStop(0, "rgba(255,248,226,1)");
    r.addColorStop(0.62, "rgba(255,230,170,1)");
    r.addColorStop(0.72, "rgba(255,205,130,0.85)");
    r.addColorStop(1, "rgba(255,150,70,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    disque = new THREE.CanvasTexture(cv);
    disque.colorSpace = THREE.SRGBColorSpace;
  }
  return disque;
}
let anneau: THREE.CanvasTexture | null = null;
function texAnneau(): THREE.CanvasTexture {
  if (!anneau) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    g.strokeStyle = "rgba(255,255,255,0.95)";
    g.lineWidth = 7;
    g.shadowColor = "rgba(255,255,255,0.9)";
    g.shadowBlur = 8;
    g.beginPath();
    g.arc(64, 64, 52, 0, Math.PI * 2);
    g.stroke();
    anneau = new THREE.CanvasTexture(cv);
  }
  return anneau;
}

export const Voute: React.FC<{ ph: number; cam: V3; lune?: boolean }> = ({ ph, cam, lune = false }) => {
  const q = Math.round(ph * 24);
  const tex = texVoute(q);
  const el = ((18 - 28 * ph) * Math.PI) / 180;
  const sun: V3 = [-Math.cos(el) * 0.95 * 700, Math.sin(el) * 700, -Math.cos(el) * 0.31 * 700];
  return (
    <group position={cam}>
      <mesh renderOrder={-20}>
        <sphereGeometry args={[800, 24, 16]} />
        <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      {el > -0.08 && (
        <>
          <sprite position={sun} scale={[760, 760, 1]} renderOrder={-19}>
            <spriteMaterial map={halo()} color="#FF7A3C" transparent opacity={0.55 * Math.min(1, (el + 0.08) * 6)} depthWrite={false} fog={false} />
          </sprite>
          <sprite position={sun} scale={[104, 104, 1]} renderOrder={-18}>
            <spriteMaterial map={texDisque()} color="#FFFFFF" transparent depthWrite={false} fog={false} />
          </sprite>
        </>
      )}
      {lune && (
        <sprite position={[-300, 380, -520]} scale={[78, 78, 1]} renderOrder={-18}>
          <spriteMaterial map={texDisque()} color="#DDE6FF" transparent depthWrite={false} fog={false} />
        </sprite>
      )}
    </group>
  );
};

// ------------------------------------------------------------------ Brume basse de la vallée
export const Brume: React.FC<{ T: number; ph: number; chaud: number }> = ({ T, ph, chaud }) => {
  const c = couleursCiel(ph);
  const base = hexMel(hexMel(c.h, c.m, 0.35), "#F0A070", chaud * 0.55);
  const n = 22;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x = -96 + i * 9.1 + Math.sin(T * 0.18 + i) * 3;
        const y = -15 + alea(i * 3) * 11 + Math.sin(T * 0.3 + i * 1.3) * 0.6;
        const z = -33 + (alea(i * 7 + 2) - 0.5) * 34;
        const s = 36 + alea(i * 5 + 1) * 34;
        return (
          <sprite key={i} position={[x, y, z]} scale={[s * 1.5, s * 0.55, 1]} renderOrder={3}>
            <spriteMaterial map={halo()} color={base} transparent opacity={0.3 + alea(i) * 0.1} depthWrite={false} fog={false} />
          </sprite>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ Sirènes
/** Les faisceaux, ondes et halos d'une tour de sirène ; `z` = −1 pour la ville jumelle (positions miroir). */
export const Sirene: React.FC<{ T: number; actif: number; z: 1 | -1 }> = ({ T, actif, z }) => {
  if (actif <= 0.01) return null;
  const pz = (v: V3): V3 => (z === 1 ? v : [v[0], v[1], ZB - v[2]]);
  const dz = (d: V3): V3 => (z === 1 ? d : [d[0], d[1], -d[2]]);
  const { x, h, z: sz } = SIRENE;
  const top = pz([x, h + 3.4, sz]);
  const a = T * 2.7;
  const pulse = 0.55 + 0.45 * Math.sin(T * 5.4);
  const ang = 0.75 + Math.sin(T * 0.85) * 0.7;
  const lampes: V3[] = [[x + 4.6, h + 4.4, sz + 4.6], [x - 4.6, h + 4.4, sz + 4.6]];
  return (
    <>
      <Faisceau p={top} dir={dz([Math.cos(a) * 0.95, -0.1, Math.sin(a) * 0.95])} long={80} rayon={15} c="#FF2A1E" o={0.17 * actif} />
      <Faisceau p={top} dir={dz([-Math.cos(a) * 0.95, -0.1, -Math.sin(a) * 0.95])} long={80} rayon={15} c="#FF2A1E" o={0.17 * actif} />
      {lampes.map((p, i) => (
        <Faisceau key={i} p={pz(p)} dir={dz([Math.cos(ang + i * 0.5) * 0.85, -0.3, Math.sin(ang + i * 0.5) * 0.85])} long={70} rayon={7} c="#FFE2AE" o={0.15 * actif} />
      ))}
      {lampes.map((p, i) => (
        <Lueur key={`l${i}`} p={pz(p)} s={5} c="#FFF0C8" o={0.85 * actif} />
      ))}
      <Lueur p={top} s={22 + pulse * 6} c="#FF3A2A" o={0.8 * actif * (0.5 + 0.5 * pulse)} />
      <Lueur p={top} s={7} c="#FFD0C0" o={0.9 * actif * pulse} />
      {[0, 1, 2].map((i) => {
        const u = ((T * 0.9 + i / 3) % 1 + 1) % 1;
        return (
          <sprite key={`o${i}`} position={pz([x, h + 3.6, sz + 0.5])} scale={[8 + u * 40, 8 + u * 40, 1]} renderOrder={4}>
            <spriteMaterial map={texAnneau()} color="#FF6A4A" transparent opacity={0.55 * (1 - u) * actif} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ Grande porte (repère de la ville A ; `miroir` pour B)
const T0: Teinte = [1, 1, 1];
export const Porte: React.FC<{ ouv: number; tombe: number; teinte: Teinte; scelle?: boolean }> = ({ ouv, tombe, teinte, scelle = true }) => {
  const th = ouv * 1.55;
  const feuille = (cote: 1 | -1) => (
    <group position={[GATE_X + cote * (GATE_W / 2 - 0.05), 0, 0.95]} rotation={[0, -cote * th, 0]}>
      <group position={[-cote * 2.2, GATE_H / 2 - 0.1, 0]}>
        {[-1.8, -1.08, -0.36, 0.36, 1.08, 1.8].map((dx, i) => (
          <Bloc key={i} p={[dx, 0, 0]} s={[0.74, GATE_H - 0.3, 0.5]} c={["#5B3F29", "#654630", "#533A26"][i % 3]} t={teinte} />
        ))}
        {[-3.4, 0.2, 3.6].map((y, i) => (
          <Bloc key={`b${i}`} p={[0, y, 0.18]} s={[4.4, 0.5, 0.2]} c="#2C2C33" t={teinte} />
        ))}
        {[-3.4, 0.2, 3.6].flatMap((y) => [-1.6, 0, 1.6].map((dx) => <Bloc key={`${y}${dx}`} p={[dx, y, 0.34]} s={[0.26, 0.26, 0.12]} c="#6A6A74" t={teinte} />))}
      </group>
    </group>
  );
  const dechu = tombe;
  return (
    <group position={[0, 0, 0]}>
      <group>
        {feuille(1)}
        {feuille(-1)}
        {scelle && dechu < 0.98 && (
          <group position={[0, -dechu * dechu * 16, 0]} rotation={[0, 0, dechu * 0.7]}>
            {/* deux grandes planches clouées en croix, deux chaînes, cadenas */}
            <Bloc p={[GATE_X, 4.9, 1.45]} s={[0.62, 12.6, 0.22]} c="#7A5A3A" t={teinte} r={[0, 0, 0.66]} />
            <Bloc p={[GATE_X, 4.9, 1.7]} s={[0.62, 12.6, 0.22]} c="#6B4D31" t={teinte} r={[0, 0, -0.66]} />
            {[3.2, 6.8].map((y) =>
              Array.from({ length: 27 }, (_, k) => <Bloc key={`${y}-${k}`} p={[GATE_X - 4.7 + k * 0.36, y + (k % 2) * 0.03, 1.95]} s={k % 2 ? [0.4, 0.2, 0.3] : [0.2, 0.34, 0.2]} c={k % 2 ? "#6A6E78" : "#4F535C"} t={teinte} />),
            )}
            <Bloc p={[GATE_X, 3.2, 2.1]} s={[1.0, 1.2, 0.5]} c="#B58A2E" t={teinte} />
            <Bloc p={[GATE_X, 4.0, 2.1]} s={[0.55, 0.5, 0.2]} c="#8A8F98" t={teinte} />
            {[-3.4, 3.4].map((dx) => [2.2, 7.6].map((y) => <Bloc key={`${dx}${y}`} p={[GATE_X + dx, y, 1.55]} s={[0.4, 0.4, 0.14]} c="#2C2C33" t={teinte} />))}
          </group>
        )}
        {/* panneau officiel cloué sur le mur, à droite de la porte */}
        {scelle && <>
        <Bloc p={[-12.2, 6.2, EP / 2 + 0.06]} s={[5.5, 3.5, 0.14]} c="#3A2A1E" t={teinte} />
        <mesh position={[-12.2, 6.2, EP / 2 + 0.16]}>
          <planeGeometry args={[5.2, 3.25]} />
          <meshBasicMaterial map={texPanneauVille()} color="#FFEFE0" />
        </mesh>
        {[-2.5, 2.5].map((dx) => (
          <Bloc key={dx} p={[-12.2 + dx, 8.2, EP / 2 + 0.2]} s={[0.22, 0.22, 0.1]} c="#2C2C33" t={teinte} />
        ))}
        </>}
      </group>
    </group>
  );
};
void HW;

// ------------------------------------------------------------------ Jumelles de cuivre (dessinées le long de +z, centrées à l'origine)
export const Jumelles: React.FC<{ T: number; echelle?: number; eclat?: number; t?: Teinte }> = ({ T, echelle = 1, eclat = 1, t = T0 }) => {
  const r = 0.14;
  const L = 0.58;
  const g = 0.5 + 0.5 * Math.sin(T * 3.1);
  return (
    <group scale={echelle}>
      {[-0.19, 0.19].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[r, r * 1.03, L, 12]} />
            <meshBasicMaterial color="#C27A3A" />
          </mesh>
          <mesh position={[0, 0, L / 2 + 0.07]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[r * 1.32, r * 1.12, 0.16, 12]} />
            <meshBasicMaterial color="#8E5A2A" />
          </mesh>
          <mesh position={[0, 0, L / 2 + 0.16]}>
            <circleGeometry args={[r * 1.22, 14]} />
            <meshBasicMaterial color="#FFB070" />
          </mesh>
          <mesh position={[0, 0, -L / 2 - 0.09]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[r * 0.75, r * 0.85, 0.18, 10]} />
            <meshBasicMaterial color="#2A1F1A" />
          </mesh>
          <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[r * 1.06, r * 1.06, 0.07, 12]} />
            <meshBasicMaterial color="#E0AE5A" />
          </mesh>
          <Bloc p={[0, r * 0.98, 0]} s={[0.07, 0.03, L * 0.9]} c="#F0B070" t={t} brut />
          <Lueur p={[0, 0, L / 2 + 0.2]} s={0.45 + g * 0.3} c="#FFE0B0" o={0.7 * eclat * (0.45 + 0.45 * g)} />
        </group>
      ))}
      <Bloc p={[0, 0, 0.0]} s={[0.26, 0.1, 0.16]} c="#8E5A2A" t={t} />
      <Bloc p={[0, 0.0, 0.15]} s={[0.4, 0.07, 0.07]} c="#E0AE5A" t={t} />
    </group>
  );
};

// ------------------------------------------------------------------ Accessoires de tête et de main des personnages
/** Repère de la tête d'un personnage (même chaîne de transformations que l'Avatar). */
export const Tete: React.FC<{ a: Acteur; children: React.ReactNode }> = ({ a, children }) => {
  const [lacet, tang] = a.pose.tete ?? [0, 0];
  return (
    <group position={a.p} rotation={[a.rx, a.ry, 0, "YXZ"]} scale={a.echelle}>
      <group position={[0, HANCHE + (a.pose.y ?? 0), 0]}>
        <group rotation={[a.pose.torse ?? 0, 0, 0]}>
          <group position={[0, 1.0, 0]} rotation={[tang, lacet, 0, "YXZ"]}>
            {children}
          </group>
        </group>
      </group>
    </group>
  );
};
/** Repère du personnage entier (origine au sol, +z devant lui). */
export const Corps: React.FC<{ a: Acteur; children: React.ReactNode }> = ({ a, children }) => (
  <group position={a.p} rotation={[a.rx, a.ry, 0, "YXZ"]} scale={a.echelle}>
    {children}
  </group>
);

export const Bonnet: React.FC<{ t: Teinte }> = ({ t }) => (
  <>
    <Bloc p={[0, 0.93, -0.02]} s={[0.96, 0.36, 0.96]} c={COIFFE_GRIS} t={t} />
    <Bloc p={[0, 0.78, -0.02]} s={[0.99, 0.1, 0.99]} c="#6E6E78" t={t} />
    <Bloc p={[0, 1.2, -0.02]} s={[0.28, 0.2, 0.28]} c="#C4C4CC" t={t} />
  </>
);
export const Masque: React.FC<{ i: number; t: Teinte }> = ({ i, t }) => (
  <>
    <Bloc p={[0, 0.2, 0.43]} s={[0.8, 0.36, 0.1]} c={MASQUES[i % MASQUES.length]} t={t} />
    <Bloc p={[0, 0.2, 0.49]} s={[0.5, 0.05, 0.03]} c="#9A9488" t={t} />
    {[-1, 1].map((s) => (
      <Bloc key={s} p={[s * 0.41, 0.34, 0.12]} s={[0.04, 0.05, 0.62]} c="#8A8478" t={t} />
    ))}
  </>
);
export const Barbe: React.FC<{ t: Teinte }> = ({ t }) => (
  <>
    <Bloc p={[0, 0.12, 0.43]} s={[0.76, 0.26, 0.12]} c="#3A2A20" t={t} />
    <Bloc p={[0, 0.24, 0.45]} s={[0.4, 0.08, 0.08]} c="#3A2A20" t={t} />
    {[-1, 1].map((s) => (
      <Bloc key={s} p={[s * 0.4, 0.3, 0.22]} s={[0.06, 0.4, 0.42]} c="#3A2A20" t={t} />
    ))}
  </>
);

/** Pancarte tenue au-dessus de la tête (repère du personnage), légère et lisible. */
export const Pancarte: React.FC<{ T: number; t0: number; tFin: number; penche0: number; t: Teinte }> = ({ T, t0, tFin, penche0, t }) => {
  if (T < penche0 + 0.2 || T > tFin) return null;
  const k = lisse(entre(T, t0, t0 + 0.65));
  const y = mel(1.9, 4.05, k);
  const bas = 1 - lisse(entre(T, tFin - 0.5, tFin));
  return (
    <group position={[0, y * (0.6 + 0.4 * bas), 0.3]}>
      <Bloc p={[0, 0, -0.08]} s={[3.7, 2.8, 0.12]} c="#2A1D14" t={t} />
      <mesh position={[0, 0.0, 0.0]}>
        <planeGeometry args={[3.6, 2.7]} />
        <meshBasicMaterial map={texPancarte()} color="#FFF3E4" />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ Feu d'artifice (fusée, gerbe, éclats)
export const Feu: React.FC<{ T: number; t0: number; tBoum: number; de: V3; vers: V3 }> = ({ T, t0, tBoum, de, vers }) => {
  const dt = T - tBoum;
  const pts = useMemo(() => {
    const n = 150;
    return Array.from({ length: n }, (_, i) => {
      const r = (k: number) => alea(i * 13 + k * 17 + 5);
      const az = r(1) * Math.PI * 2;
      const el = Math.acos(2 * r(2) - 1);
      const v = 7 + r(3) * 15;
      return { d: [Math.sin(el) * Math.cos(az), Math.cos(el), Math.sin(el) * Math.sin(az)] as V3, v, c: r(4), vie: 1.5 + r(5) * 1.3 };
    });
  }, []);
  const vol = T >= t0 && T < tBoum;
  const u = entre(T, t0, tBoum);
  const fusee: V3 = [mel(de[0], vers[0], u * u), mel(de[1], vers[1], u * u), mel(de[2], vers[2], u * u)];
  const geom = useMemo(() => {
    if (dt < 0 || dt > 3.2) return null;
    const pos: number[] = [];
    const col: number[] = [];
    for (const q of pts) {
      if (dt > q.vie) continue;
      const frein = 1 - Math.exp(-dt * 1.4);
      const d = (q.v / 1.4) * frein;
      pos.push(vers[0] + q.d[0] * d, vers[1] + q.d[1] * d - 3.2 * dt * dt, vers[2] + q.d[2] * d);
      const f = 1 - dt / q.vie;
      const jaune: [number, number, number] = [1, 0.92, 0.6];
      const rouge: [number, number, number] = [1, 0.35, 0.18];
      const m = Math.min(1, dt / 1.2 + q.c * 0.3);
      col.push((mel(jaune[0], rouge[0], m)) * f, mel(jaune[1], rouge[1], m) * f, mel(jaune[2], rouge[2], m) * f);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [dt, pts, vers]);
  return (
    <>
      {vol && (
        <>
          <Bloc p={fusee} s={[0.4, 0.4, 0.4]} c="#FFE9B0" brut />
          <Lueur p={fusee} s={3.5} c="#FFB060" o={0.85} />
          {Array.from({ length: 14 }, (_, i) => {
            const uu = Math.max(0, u - (i + 1) * 0.04);
            const p: V3 = [mel(de[0], vers[0], uu * uu), mel(de[1], vers[1], uu * uu), mel(de[2], vers[2], uu * uu)];
            return <Lueur key={i} p={[p[0] + (alea(i) - 0.5) * 0.4, p[1], p[2] + (alea(i + 9) - 0.5) * 0.4]} s={1.6 - i * 0.07} c="#FFC070" o={0.7 * (1 - i / 14)} />;
          })}
        </>
      )}
      {dt >= 0 && dt < 3.2 && (
        <>
          <Lueur p={vers} s={70 * Math.exp(-dt * 3.5) + 12} c="#FFE2A0" o={Math.max(0, 1 - dt * 1.4)} />
          <Lueur p={vers} s={26 + dt * 20} c="#FF8A3A" o={Math.max(0, 0.6 - dt * 0.22)} />
          {geom && (
            <points geometry={geom} frustumCulled={false} renderOrder={6}>
              <pointsMaterial vertexColors size={0.95} sizeAttenuation transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
            </points>
          )}
          <Tache p={[-12, 0.2, 14]} s={[80, 60]} c="#FFB060" o={Math.max(0, 0.55 * Math.exp(-dt * 1.3))} />
        </>
      )}
    </>
  );
};

/** Un personnage entier avec ses accessoires (Avatar + masque / bonnet / barbe / jumelles). */
export const Perso: React.FC<{ id: string; a: Acteur; frame: number; T: number; teinte: Teinte; objets: Record<string, (T: number) => React.ReactNode>; ombre?: boolean }> = ({ id, a, frame, T, teinte, objets, ombre = true }) => {
  const enfant = id.startsWith("n") || id === "tb";
  const habitantMasque = /^(B?r\d+|rA|g[AB]\d*|gAvallee|gBvallee)/.test(id);
  const num = Number((id.match(/\d+/) ?? ["0"])[0]);
  const pere = id === "pere";
  const jum = a.objet === "jumelles";
  const jumMain = a.objet === "jumellesMain" || a.objet === "jumellesBas";
  const yMain = a.objet === "jumellesBas" ? 1.28 : 1.78;
  const grosse = a.objet === "jumellesMain" && T > 15.5 && T < 18.6;
  return (
    <group>
      <Avatar p={a.p} ry={a.ry} pose={a.pose} tenue={a.tenue} emotion={a.emotion} frame={frame} graine={a.graine} teinte={teinte} echelle={a.echelle} sansClin={a.sansClin} clinRapide={a.clinRapide} opacite={1} rx={a.rx} mainD={a.objet && objets[a.objet] ? objets[a.objet](T) : undefined} />
      {(enfant || habitantMasque || pere) && (
        <Tete a={a}>
          {enfant && <Bonnet t={teinte} />}
          {habitantMasque && <Masque i={num + (id.startsWith("B") ? 1 : 0)} t={teinte} />}
          {pere && <Barbe t={teinte} />}
          {jum && (
            <group position={[0, 0.44, 0.68]}>
              <Jumelles T={T} t={teinte} />
            </group>
          )}
        </Tete>
      )}
      {jumMain && (
        <Corps a={a}>
          <group position={[0, yMain + (a.pose.y ?? 0), a.objet === "jumellesBas" ? 0.62 : 0.9]} rotation={[-0.12, 0, 0]}>
            <Jumelles T={T} t={teinte} echelle={grosse ? 1.25 : 1} />
          </group>
        </Corps>
      )}
      {ombre && a.rx === 0 && <Ombre2 a={a} />}
    </group>
  );
};
const Ombre2: React.FC<{ a: Acteur }> = ({ a }) => (
  <mesh position={[a.p[0] + 1.1 * a.echelle, a.p[1] + 0.09, a.p[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[3.2 * a.echelle, 0.62 * a.echelle, 1]} renderOrder={1}>
    <circleGeometry args={[1, 14]} />
    <meshBasicMaterial color="#12091A" transparent opacity={0.42} depthWrite={false} />
  </mesh>
);

export { Faisceau, Lueur, Tache };
