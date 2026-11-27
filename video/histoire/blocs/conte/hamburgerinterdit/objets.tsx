/**
 * « Hamburger interdit » — objets dynamiques en blocs : hamburger, cloche et cartable des policiers, couverts, horloge,
 * suspension de cuisine, rais de lumière et poussière du grenier, manteau sur son portant (avec l'étiquette « N. »),
 * emballage et papier plié, album photo (pages qui se tournent), photo de Léa recto verso, éclats d'effacement,
 * enseignes néon, panneaux ronds barrés et bandeaux.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Bloc, type Teinte } from "../../avatar";
import { alea, entre, lisse, mel } from "../../maths";
import { Faisceau, Lueur, Tache } from "../lib";
import { gris } from "./monde";
import { texBandeau, texDos, texEmballage, texEnseigneGeante, texEtiquette, texLea, texMenu, texNeon, texPage, texPancarte, texPanneauRond, texPapier, texSaisi, texEcole } from "./toile";

const BLANC: Teinte = [1, 1, 1];

// ------------------------------------------------------------------ Plan texturé simple
export const Image: React.FC<{ p: V3; s: [number, number]; map: THREE.Texture; r?: V3; alpha?: boolean; add?: boolean; o?: number; double?: boolean; ordre?: number }> = ({ p, s, map, r = [0, 0, 0], alpha = false, add = false, o = 1, double = false, ordre = 0 }) => (
  <mesh position={p} rotation={r} renderOrder={ordre}>
    <planeGeometry args={s} />
    <meshBasicMaterial map={map} transparent={alpha || add || o < 1} opacity={o} depthWrite={!(alpha || add)} blending={add ? THREE.AdditiveBlending : THREE.NormalBlending} side={double ? THREE.DoubleSide : THREE.FrontSide} />
  </mesh>
);

// ------------------------------------------------------------------ Hamburger (blocs)
export const Burger: React.FC<{ s?: number; p?: V3; r?: V3; glow?: number; t?: Teinte }> = ({ s = 1, p = [0, 0, 0], r, glow = 0, t = BLANC }) => (
  <group position={p} rotation={r} scale={s}>
    <Bloc p={[0, 0.09, 0]} s={[1.0, 0.18, 1.0]} c="#E8A33C" t={t} />
    <Bloc p={[0, 0.26, 0]} s={[1.08, 0.17, 1.08]} c="#5B3320" t={t} />
    <Bloc p={[0, 0.37, 0]} s={[1.12, 0.05, 1.12]} c="#FFD23F" t={t} />
    <Bloc p={[0.5, 0.31, 0.5]} s={[0.26, 0.05, 0.26]} c="#FFD23F" t={t} r={[0.8, 0, 0.8]} />
    <Bloc p={[0, 0.44, 0]} s={[1.16, 0.09, 1.16]} c="#6CC24A" t={t} />
    <Bloc p={[0, 0.53, 0]} s={[1.0, 0.1, 1.0]} c="#E8343C" t={t} />
    <Bloc p={[0, 0.69, 0]} s={[1.02, 0.22, 1.02]} c="#F0B04A" t={t} />
    <Bloc p={[0, 0.86, 0]} s={[0.8, 0.14, 0.8]} c="#F0B04A" t={t} />
    {[[-0.2, 0.0], [0.15, 0.2], [0.25, -0.15], [-0.05, -0.22], [-0.28, 0.2]].map(([x, z], i) => (
      <Bloc key={i} p={[x, 0.94, z]} s={[0.1, 0.03, 0.06]} c="#FFF1C9" brut r={[0, i, 0]} />
    ))}
    {glow > 0 && <Lueur p={[0, 0.45, 0]} s={3.2} c="#FFB347" o={glow} />}
  </group>
);

// ------------------------------------------------------------------ Couverts tenus en main (origine = bout de la main)
export const Couverts: React.FC = () => (
  <>
    <Bloc p={[0, -0.05, 0.12]} s={[0.05, 0.05, 0.5]} c="#E8EEF2" />
    <Bloc p={[0, -0.05, 0.42]} s={[0.2, 0.05, 0.12]} c="#E8EEF2" />
    <Bloc p={[0.06, -0.05, 0.52]} s={[0.04, 0.05, 0.12]} c="#E8EEF2" />
    <Bloc p={[-0.06, -0.05, 0.52]} s={[0.04, 0.05, 0.12]} c="#E8EEF2" />
  </>
);
export const Fourchette: React.FC<{ p: V3; r?: V3; t?: Teinte }> = ({ p, r, t = BLANC }) => (
  <group position={p} rotation={r}>
    <Bloc p={[0, 0, 0]} s={[0.08, 0.05, 0.72]} c="#E8EEF2" t={t} />
    <Bloc p={[0, 0, 0.42]} s={[0.26, 0.05, 0.16]} c="#E8EEF2" t={t} />
    <Bloc p={[0.09, 0, 0.56]} s={[0.05, 0.05, 0.16]} c="#E8EEF2" t={t} />
    <Bloc p={[-0.09, 0, 0.56]} s={[0.05, 0.05, 0.16]} c="#E8EEF2" t={t} />
  </group>
);

// ------------------------------------------------------------------ Objets en main : { origine = bout de la main, y vers le bas }
export const EN_MAIN: Record<string, (T: number, g: number) => React.ReactNode> = {
  burger: () => <Burger s={0.7} p={[0, 0.0, 0.38]} r={[0, 0.4, 0]} />,
  burgerHaut: (T) => <Burger s={0.8} p={[0, 0.08, 0.2]} r={[0.1, 0.3 + Math.sin(T * 1.2) * 0.04, 0]} glow={0.55} />,
  couverts: () => <Couverts />,
  cartable: () => (
    <>
      <Bloc p={[0, -0.55, 0]} s={[0.35, 0.3, 0.1]} c="#2A1A12" />
      <Bloc p={[0, -1.05, 0.25]} s={[1.2, 0.95, 0.5]} c="#8A4A2A" />
    </>
  ),
  emballage: (T) => (
    <group rotation={[0.3, 0.2, Math.sin(T * 3) * 0.04]}>
      <Image p={[0, -0.1, 0.34]} s={[0.78, 0.65]} map={texEmballage()} r={[-0.5, 0, 0]} double />
    </group>
  ),
  sifflet: () => <Bloc p={[0, -0.12, 0]} s={[0.22, 0.16, 0.34]} c="#E8EEF2" />,
};

// ------------------------------------------------------------------ Enseignes et panneaux de la rue
export const EnseigneGeante: React.FC<{ p: V3; w: number; h: number; etat: 0 | 1 | 2; luisant?: number }> = ({ p, w, h, etat, luisant = 1 }) => (
  <>
    <Image p={[p[0], p[1], p[2] + 0.06]} s={[w, h]} map={texEnseigneGeante(etat)} ordre={5} />
    {etat === 1 && (
      <>
        <Lueur p={[p[0], p[1] + 2.4, p[2] + 1.5]} s={42} c="#FF4FA3" o={0.42 * luisant} />
        <Lueur p={[p[0], p[1] - 2.8, p[2] + 1.5]} s={30} c="#FF2038" o={0.34 * luisant} />
        <Tache p={[p[0], 0.25, p[2] + 17]} s={[34, 34]} c="#FF4FA3" o={0.32 * luisant} />
      </>
    )}
  </>
);
export const PanneauRond: React.FC<{ p: V3; ry: number; s?: number; gris?: boolean }> = ({ p, ry, s = 1.9, gris: g = false }) => (
  <Image p={p} s={[s, s]} map={texPanneauRond(g)} r={[0, ry, 0]} double alpha />
);
export const Bandeau: React.FC<{ z: number; g?: boolean }> = ({ z, g = false }) => (
  <>
    <Image p={[0, 8.3, z]} s={[26.4, 2.75]} map={texBandeau(g)} double />
    <Bloc p={[0, 9.8, z]} s={[26.4, 0.08, 0.08]} c="#202028" />
  </>
);
export const NeonBoutique: React.FC<{ p: V3; ry: number; texte: string; couleur: string; w: number; h: number; luisant: number; g: boolean }> = ({ p, ry, texte, couleur, w, h, luisant, g }) => (
  <>
    <Image p={p} s={[w, h]} map={texNeon(texte, couleur, w, h, g)} r={[0, ry, 0]} alpha ordre={4} />
    {!g && <Lueur p={[p[0] + Math.sin(ry) * 0.8, p[1], p[2] + Math.cos(ry) * 0.8]} s={w * 1.15} c={couleur} o={0.26 * luisant} />}
  </>
);
export const MenuMural: React.FC<{ p: V3; ry: number; g: boolean }> = ({ p, ry, g }) => (
  <>
    <Bloc p={[p[0] - Math.sin(ry) * 0.08, p[1], p[2] - Math.cos(ry) * 0.08]} s={[Math.abs(Math.cos(ry)) * 4.4 + Math.abs(Math.sin(ry)) * 0.16, 6.4, Math.abs(Math.sin(ry)) * 4.4 + Math.abs(Math.cos(ry)) * 0.16]} c="#F6B81E" t={BLANC} />
    <Image p={p} s={[4.0, 6.0]} map={texMenu(g)} r={[0, ry, 0]} />
  </>
);
export const Pancarte: React.FC<{ p: V3; ry: number; g: boolean; s?: number }> = ({ p, ry, g, s = 3.3 }) => <Image p={p} s={[s, s * (512 / 768)]} map={texPancarte(g)} r={[0, ry, 0.03]} />;
export const PanneauEcole: React.FC<{ p: V3; ry: number; g: boolean }> = ({ p, ry, g }) => <Image p={p} s={[7.5, 1.9]} map={texEcole(g)} r={[0, ry, 0]} />;

// ------------------------------------------------------------------ Table des policiers : cartable, cloche, étiquette
export const Cloche: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Bloc p={[0, 0.06, 0]} s={[2.4, 0.12, 2.4]} c="#C9D4DC" />
    <mesh position={[0, 0.12, 0]} renderOrder={6}>
      <sphereGeometry args={[1.05, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial color="#DFF3FF" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
    <Bloc p={[0, 1.22, 0]} s={[0.22, 0.14, 0.22]} c="#E8EEF2" />
    <Burger s={1.05} p={[0, 0.12, 0]} r={[0, 0.5, 0]} />
    <Lueur p={[0, 0.7, 0]} s={3.4} c="#FFD9A0" o={0.34} />
  </group>
);
export const Saisi: React.FC<{ p: V3; ry: number }> = ({ p, ry }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Bloc p={[0, 0.34, 0]} s={[1.7, 0.85, 0.06]} c="#FFF6DC" />
    <Image p={[0, 0.34, 0.05]} s={[1.6, 0.8]} map={texSaisi()} />
  </group>
);
export const CartableOuvert: React.FC<{ p: V3; ry: number; burger: boolean }> = ({ p, ry, burger }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Bloc p={[0, 0.5, 0]} s={[1.5, 1.0, 0.6]} c="#8A4A2A" />
    <Bloc p={[0, 1.0, -0.28]} s={[1.5, 0.12, 0.6]} c="#6E3A20" r={[-0.9, 0, 0]} />
    <Bloc p={[-0.4, 1.05, 0]} s={[0.5, 0.2, 0.4]} c="#3FA0E0" />
    <Bloc p={[0.2, 1.05, 0.05]} s={[0.6, 0.2, 0.42]} c="#F6B81E" />
    <Bloc p={[0.55, 1.08, 0]} s={[0.3, 0.3, 0.3]} c="#E0223D" />
    {burger && <Burger s={0.9} p={[-0.05, 0.96, 0.02]} r={[0, 0.3, 0.12]} />}
  </group>
);

// ------------------------------------------------------------------ Cuisine : horloge, suspension, couverts posés, fenêtre
export const HorlogeMur: React.FC<{ p: V3; T: number; g: number }> = ({ p, T, g }) => {
  const sec = Math.floor(T) * ((2 * Math.PI) / 60);
  const min = (T / 60) * ((2 * Math.PI) / 60) * 60 * 0.02 + 1.2;
  return (
    <group position={p}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 0.22, 20]} />
        <meshBasicMaterial color={gris("#2FD3C4", g)} />
      </mesh>
      <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.06, 20]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <Bloc key={i} p={[Math.sin((i * Math.PI) / 6) * 0.62, Math.cos((i * Math.PI) / 6) * 0.62, 0.17]} s={[0.07, i % 3 === 0 ? 0.18 : 0.1, 0.03]} c="#1B1B22" r={[0, 0, -(i * Math.PI) / 6]} />
      ))}
      <group position={[0, 0, 0.2]}>
        <group rotation={[0, 0, -min]}><Bloc p={[0, 0.25, 0]} s={[0.1, 0.55, 0.04]} c="#1B1B22" /></group>
        <group rotation={[0, 0, -min * 12 + 0.8]}><Bloc p={[0, 0.17, 0]} s={[0.12, 0.38, 0.04]} c="#1B1B22" /></group>
        <group rotation={[0, 0, -sec]}><Bloc p={[0, 0.28, 0.03]} s={[0.04, 0.66, 0.03]} c="#E0223D" /></group>
        <Bloc p={[0, 0, 0.04]} s={[0.14, 0.14, 0.05]} c="#E0223D" />
      </group>
    </group>
  );
};
export const Suspension: React.FC<{ p: V3; g: number; o?: number }> = ({ p, g, o = 0.13 }) => (
  <>
    <Bloc p={[p[0], p[1] + 0.7, p[2]]} s={[0.07, 1.4, 0.07]} c="#1B1B22" />
    <mesh position={[p[0], p[1] + 0.2, p[2]]}>
      <coneGeometry args={[0.95, 0.7, 10, 1, true]} />
      <meshBasicMaterial color={gris("#FF6FA5", g)} side={THREE.DoubleSide} />
    </mesh>
    <Bloc p={[p[0], p[1] - 0.1, p[2]]} s={[0.45, 0.2, 0.45]} c="#FFF1B8" brut />
    <Lueur p={[p[0], p[1] - 0.2, p[2]]} s={5.2} c="#FFD9A0" o={0.55} />
    <Faisceau p={[p[0], p[1] - 0.25, p[2]]} dir={[0, -1, 0]} long={p[1] - 2.25} rayon={3.5} c="#FFD59A" o={o} />
    <Tache p={[p[0], TABLE_Y_TACHE, p[2]]} s={[7, 5]} c="#FFE2B0" o={0.34} />
  </>
);
const TABLE_Y_TACHE = 2.34;
export const FenetreDehors: React.FC<{ p: V3; s: [number, number]; g: number }> = ({ p, s, g }) => {
  const map = useMemo(() => dehors(g), [g]);
  return (
    <>
      <Image p={p} s={s} map={map} />
      <Lueur p={[p[0], p[1], p[2] + 0.5]} s={9} c={g > 0.5 ? "#8A8A94" : "#FF4FA3"} o={0.22} />
    </>
  );
};
const memoDehors = new Map<number, THREE.CanvasTexture>();
function dehors(g: number): THREE.CanvasTexture {
  const cle = Math.round(g * 10);
  let t = memoDehors.get(cle);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 352;
    const c = cv.getContext("2d")!;
    const gr = c.createLinearGradient(0, 0, 0, 352);
    gr.addColorStop(0, gris("#2B1456", g));
    gr.addColorStop(0.55, gris("#B03A8C", g));
    gr.addColorStop(1, gris("#FF8F7A", g));
    c.fillStyle = gr;
    c.fillRect(0, 0, 512, 352);
    c.fillStyle = gris("#1B0F38", g);
    for (let i = 0; i < 9; i++) c.fillRect(i * 60 - 10, 200 + ((i * 53) % 70), 54, 200);
    for (const [x, y, col] of [[40, 260, "#FF4FA3"], [180, 280, "#36F2E0"], [330, 250, "#FFE04A"], [450, 285, "#FF4FA3"]] as Array<[number, number, string]>) {
      c.fillStyle = gris(col, g);
      c.fillRect(x, y, 34, 12);
    }
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.needsUpdate = true;
    t = tx;
    memoDehors.set(cle, t);
  }
  return t;
}

// ------------------------------------------------------------------ Grenier : rais de lumière, poussière
export const Rais: React.FC<{ o?: number }> = ({ o = 1 }) => {
  const sources: Array<[V3, V3, number]> = [
    [[400 - 0.9, 5.4, -6.0], [0.05, -0.5, 1], 1.5],
    [[400 + 0.1, 5.0, -6.0], [0.0, -0.46, 1], 1.7],
    [[400 + 1.0, 4.6, -6.0], [-0.1, -0.42, 1], 1.4],
  ];
  return (
    <>
      {sources.map(([p, d, r], i) => (
        <group key={i}>
          <Faisceau p={p} dir={d} long={13} rayon={r} c="#FFC76A" o={0.2 * o} />
          <Faisceau p={p} dir={d} long={13} rayon={r * 0.55} c="#FFE2A8" o={0.16 * o} />
          <Tache p={[p[0] + d[0] * (p[1] / -d[1]) * 0.95, 0.12, p[2] + d[2] * (p[1] / -d[1]) * 0.95]} s={[5.2, 7.4]} c="#FFC76A" o={0.4 * o} />
        </group>
      ))}
      <Lueur p={[400, 5.0, -5.5]} s={13} c="#FFD38A" o={0.7 * o} />
    </>
  );
};
export const Poussiere: React.FC<{ T: number; n: number; centre: V3; demi: V3; couleur?: string; taille?: number }> = ({ T, n, centre, demi, couleur = "#FFE2A8", taille = 0.07 }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0.85, depthWrite: false }), [couleur]);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < n; i++) {
      const r = (k: number) => alea(i * 11 + k * 29);
      const dx = Math.sin(T * (0.15 + r(7) * 0.2) + i) * 0.7;
      const dy = Math.sin(T * (0.2 + r(8) * 0.2) + i * 1.7) * 0.5 - ((T * (0.1 + r(9) * 0.1)) % 1) * 0.0;
      dummy.position.set(centre[0] + (r(1) * 2 - 1) * demi[0] + dx, centre[1] + (r(2) * 2 - 1) * demi[1] + dy, centre[2] + (r(3) * 2 - 1) * demi[2] + Math.cos(T * 0.2 + i) * 0.5);
      dummy.rotation.set(T * r(4), T * r(5), 0);
      dummy.scale.setScalar(taille * (0.6 + r(6) * 1.4));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} renderOrder={5} />;
};

// ------------------------------------------------------------------ Manteau sur son portant
/** Origine = sommet du cintre. Le manteau regarde +z ; l'étiquette « N. » est cousue dans la nuque (côté -z). */
export const Manteau: React.FC<{ p: V3; t: Teinte; emballage: boolean; g: number }> = ({ p, t, emballage, g }) => {
  const c = (h: string) => gris(h, g);
  return (
    <group position={p}>
      <Bloc p={[0, 0.12, 0]} s={[0.26, 0.2, 0.2]} c="#8B6238" t={t} />
      <Bloc p={[0, -0.12, 0]} s={[1.5, 0.12, 0.14]} c="#C9A06A" t={t} />
      <Bloc p={[0, -0.2, 0]} s={[1.18, 0.34, 0.76]} c="#FFF1D6" t={t} />
      <Bloc p={[0, -1.4, 0]} s={[1.55, 2.2, 0.66]} c={c("#E0243E")} t={t} />
      <Bloc p={[-1.05, -1.38, 0]} s={[0.54, 2.05, 0.56]} c={c("#E0243E")} t={t} r={[0, 0, -0.07]} />
      <Bloc p={[1.05, -1.38, 0]} s={[0.54, 2.05, 0.56]} c={c("#E0243E")} t={t} r={[0, 0, 0.07]} />
      <Bloc p={[-1.1, -2.5, 0]} s={[0.5, 0.2, 0.52]} c="#FFF1D6" t={t} r={[0, 0, -0.07]} />
      <Bloc p={[1.1, -2.5, 0]} s={[0.5, 0.2, 0.52]} c="#FFF1D6" t={t} r={[0, 0, 0.07]} />
      <Bloc p={[0, -1.45, 0.34]} s={[0.1, 2.0, 0.05]} c="#FFF1D6" t={t} />
      <Bloc p={[0.5, -1.95, 0.35]} s={[0.6, 0.62, 0.1]} c={c("#B8182E")} t={t} />
      <Bloc p={[-0.5, -1.95, 0.35]} s={[0.6, 0.62, 0.1]} c={c("#B8182E")} t={t} />
      {emballage && <Bloc p={[0.5, -1.78, 0.4]} s={[0.4, 0.34, 0.1]} c="#E7D08A" t={t} r={[0.2, 0, 0.15]} />}
      <Image p={[0, -0.52, -0.36]} s={[0.6, 0.6]} map={texEtiquette()} r={[0, Math.PI, 0]} double />
    </group>
  );
};

// ------------------------------------------------------------------ Papier plié (le message) : tenu devant le narrateur
export const Papier: React.FC<{ p: V3; ry: number; k: number; chaud: boolean }> = ({ p, ry, k, chaud }) => {
  // k : 0 = plié (petit), 1 = déplié (grand, lisible)
  const e = lisse(k);
  const w = mel(0.5, 2.0, e);
  const h = mel(0.38, 2.7, e);
  return (
    <group position={p} rotation={[-0.12, ry, 0]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={k > 0.6 ? texPapier(chaud) : undefined} color={k > 0.6 ? "#FFFFFF" : "#E7D08A"} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ Album photo et photo de Léa
export const Album: React.FC<{ p: V3; T: number; ouvert: boolean; flips: number[]; tFlip: number }> = ({ p, T, ouvert, flips, tFlip }) => {
  const nOk = flips.filter((f) => T >= f + tFlip).length; // pages entièrement tournées
  const page = (i: number) => (i >= 8 ? texLea() : texPage(i % 8));
  const demi = 0.95;
  const W = 1.85;
  const Hh = 2.38;
  const encours = flips.findIndex((f) => T >= f && T < f + tFlip);
  const kF = encours >= 0 ? (T - flips[encours]) / tFlip : 0;
  const lg = nOk * 2 - 1; // page gauche (-1 = couverture intérieure)
  const droite = nOk * 2 + (encours >= 0 ? 2 : 0); // page droite visible sous la page qui se tourne
  void droite;
  return (
    <group position={p}>
      {/* couverture */}
      <Bloc p={[0, 0.1, 0]} s={[4.3, 0.2, 2.7]} c="#9A2A3A" />
      {!ouvert ? (
        <>
          <Bloc p={[0, 0.3, 0]} s={[4.0, 0.2, 2.5]} c="#B83248" />
          <Bloc p={[0, 0.42, 0]} s={[2.4, 0.04, 0.8]} c="#F6B81E" />
        </>
      ) : (
        <>
          <Bloc p={[-demi, 0.28, 0]} s={[W + 0.1, 0.16, Hh + 0.1]} c="#F1E6CC" />
          <Bloc p={[demi, 0.28, 0]} s={[W + 0.1, 0.16, Hh + 0.1]} c="#F1E6CC" />
          {/* page gauche (déjà tournée) */}
          {lg >= 0 && (
            <mesh position={[-demi, 0.37, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[W, Hh]} />
              <meshBasicMaterial map={page(lg)} />
            </mesh>
          )}
          {/* page droite visible */}
          <mesh position={[demi, 0.37, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[W, Hh]} />
            <meshBasicMaterial map={page(nOk * 2 + (encours >= 0 ? 2 : 0))} />
          </mesh>
          {/* page qui se tourne */}
          {encours >= 0 && (
            <group position={[0, 0.42, 0]} rotation={[0, 0, Math.PI * lisse(kF)]}>
              <mesh position={[demi, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[W, Hh]} />
                <meshBasicMaterial map={page(encours * 2)} />
              </mesh>
              <mesh position={[demi, 0.0, 0]} rotation={[Math.PI / 2, 0, Math.PI]}>
                <planeGeometry args={[W, Hh]} />
                <meshBasicMaterial map={page(encours * 2 + 1)} />
              </mesh>
            </group>
          )}
        </>
      )}
    </group>
  );
};

/** Photo de Léa : recto couleurs vives, verso manuscrit (révélé au fil des mots). */
export const PhotoLea: React.FC<{ p: V3; r: V3; tourne: number; f1: number; f2: number; s?: number }> = ({ p, r, tourne, f1, f2, s = 1 }) => {
  const W = 2.0 * s;
  const H = 2.5 * s;
  return (
    <group position={p} rotation={r}>
      <group rotation={[0, Math.PI * lisse(tourne), 0]}>
        <mesh>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial map={texLea()} side={THREE.FrontSide} />
        </mesh>
        <mesh rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial map={texDos(f1, f2)} side={THREE.FrontSide} />
        </mesh>
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ Éclats d'effacement (Léa se défait en blocs de couleur qui s'envolent)
export const Eclats: React.FC<{ T: number; t0: number; t1: number; centre: V3; echelle?: number; n?: number }> = ({ T, t0, t1, centre, echelle = 1, n = 46 }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 1, depthWrite: false }), []);
  const couleurs = useMemo(() => ["#F6B81E", "#EBC09A", "#3A2418", "#FFFFFF", "#FFFFFF", "#FFD98A"].map((c) => new THREE.Color(c)), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const k = (T - t0) / (t1 - t0);
    for (let i = 0; i < n; i++) {
      const r = (q: number) => alea(i * 13 + q * 31);
      const dem = r(1) * 0.55; // départ échelonné : le bas se défait d'abord… puis le haut
      const kk = Math.max(0, Math.min(1, (k - dem * 0.5) / 0.55));
      const start: V3 = [centre[0] + (r(2) - 0.5) * 0.9 * echelle, centre[1] + (0.2 + r(3) * 2.3) * echelle, centre[2] + (r(4) - 0.5) * 0.5 * echelle];
      const vit: V3 = [(r(5) - 0.5) * 1.8, 0.6 + r(6) * 2.8, (r(7) - 0.5) * 1.8];
      const tt = kk * 1.6;
      dummy.position.set(start[0] + vit[0] * tt + Math.sin(tt * 3 + i) * 0.15, start[1] + vit[1] * tt, start[2] + vit[2] * tt);
      dummy.rotation.set(tt * r(8) * 6, tt * r(9) * 6, tt * 2);
      const vis = kk > 0 && kk < 1 ? 1 : 0;
      dummy.scale.setScalar(vis * (0.2 + r(10) * 0.28) * echelle * (1 - kk * 0.8));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, couleurs[i % couleurs.length]);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} renderOrder={7} />;
};
