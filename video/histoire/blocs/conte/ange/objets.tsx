/**
 * « J'étais l'ange gardien… » — composants dynamiques locaux : voiture, train, barrières de passage à niveau, bocal de
 * plumes (couvercle « Mon frère »), plumes qui tombent, pilier de lumière dorée, silhouette lumineuse, ailes et auréole,
 * soleil et nuages. Tout est en blocs ; les lumières sont des sprites/cônes additifs (aucune lumière réelle).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Bloc, type Teinte } from "../../avatar";
import { halo } from "../../textures";
import { Lueur, OBJETS, Tache } from "../lib";
import { entre, lisse } from "../../maths";
import { GZ } from "./monde";

const OR = "#FFC81E";
const OR_CLAIR = "#FFF3B0";

// ------------------------------------------------------------------ Plumes et bocal
/** Une plume dorée (bloc plat), centrée en 0, pointe vers +y. */
export const PlumeBloc: React.FC<{ p?: V3; r?: V3; s?: number; o?: number }> = ({ p, r, s = 1, o }) => (
  <group position={p} rotation={r} scale={s}>
    <Bloc p={[0, 0.02, 0]} s={[0.03, 0.9, 0.04]} c={OR_CLAIR} brut opacite={o} />
    <Bloc p={[0, -0.06, 0]} s={[0.06, 0.5, 0.26]} c={OR} brut opacite={o} />
    <Bloc p={[0, 0.2, 0]} s={[0.06, 0.28, 0.2]} c="#FFD240" brut opacite={o} />
    <Bloc p={[0, 0.4, 0]} s={[0.06, 0.18, 0.1]} c="#FFDF6A" brut opacite={o} />
    <Bloc p={[0, -0.12, 0.09]} s={[0.05, 0.26, 0.06]} c="#FFE98A" brut opacite={o} />
  </group>
);

/** Positions des plumes dans le bocal (repère du bocal : centre en 0, hauteur 1). */
const DANS_BOCAL: Array<[V3, V3]> = Array.from({ length: 13 }, (_, i) => {
  const a = i * 2.399 + 0.4;
  const rayon = i < 4 ? 0.07 : 0.26;
  const y = -0.2 + ((i * 5) % 7) * 0.04 - (i < 4 ? 0 : 0.03);
  return [[Math.sin(a) * rayon, y, Math.cos(a) * rayon] as V3, [0.18 * Math.cos(a * 1.7), a * 0.8, 0.42 * Math.sin(a * 1.3) + (i % 2 ? 0.18 : -0.18)] as V3];
});

/** Texture du couvercle : « Mon frère » écrit au feutre, révélé progressivement (étapes mémorisées). */
const NB_ETAPES = 24;
const memoCouvercle = new Map<number, THREE.Texture>();
function couvercle(etape: number): THREE.Texture {
  const k = Math.max(0, Math.min(NB_ETAPES, Math.round(etape)));
  let t = memoCouvercle.get(k);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 512;
    const c = cv.getContext("2d")!;
    c.clearRect(0, 0, 512, 512);
    const f = k / NB_ETAPES;
    c.fillStyle = "#2A2018";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = 'italic bold 168px "Liberation Sans", "DejaVu Sans", Arial, sans-serif';
    const f1 = Math.min(1, f / 0.4);
    const f2 = Math.max(0, (f - 0.4) / 0.6);
    for (const [txt, y, fr] of [["Mon", 180, f1], ["frère", 346, f2]] as Array<[string, number, number]>) {
      if (fr <= 0) continue;
      c.save();
      c.beginPath();
      c.rect(30, y - 110, 452 * fr, 220);
      c.clip();
      c.translate(256, y);
      c.rotate(-0.045);
      c.fillText(txt, 0, 0);
      c.restore();
    }
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    tx.needsUpdate = true;
    t = tx;
    memoCouvercle.set(k, t);
  }
  return t;
}

/**
 * Bocal de plumes : verre translucide, `n` plumes dorées lumineuses (jusqu'à 13), halo doré. Repère : centre du bocal
 * en 0 (hauteur 1, largeur 0,95). `lid` = hauteur du couvercle au-dessus du col (null = pas de couvercle), `ecrit` = 0..1.
 */
export const Bocal: React.FC<{ p?: V3; r?: V3; s?: number; n: number; T: number; lid?: number | null; ecrit?: number; t?: Teinte; lueur?: number }> = ({ p, r, s = 1, n, T, lid = null, ecrit = 0, t, lueur = 1 }) => (
  <group position={p} rotation={r} scale={s}>
    <Bloc s={[0.95, 1.0, 0.95]} c="#A9D2EA" opacite={0.36} t={t} />
    <Bloc p={[0, -0.5, 0]} s={[0.9, 0.06, 0.9]} c="#E8F3FA" opacite={0.7} t={t} />
    <Bloc p={[0, 0.48, 0]} s={[0.7, 0.1, 0.7]} c="#E8F3FA" opacite={0.5} t={t} />
    {DANS_BOCAL.slice(0, n).map(([pp, rr], i) => (
      <PlumeBloc key={i} p={pp} r={rr} s={0.95} />
    ))}
    <Lueur p={[0, -0.05, 0]} s={(1.9 + Math.sin(T * 3) * 0.15) * lueur} c={OR} o={0.3 * Math.min(1, lueur)} />
    {lid !== null && (
      <group position={[0, 0.58 + lid, 0]}>
        <Bloc s={[0.9, 0.14, 0.9]} c="#E9C27F" t={t} />
        <Bloc p={[0, -0.04, 0]} s={[0.78, 0.12, 0.78]} c="#C99660" t={t} />
        <mesh position={[0, 0.0715, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.86, 0.86]} />
          <meshBasicMaterial map={couvercle(ecrit * NB_ETAPES)} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      </group>
    )}
  </group>
);

// Objets en main (enregistrés dans le dictionnaire du socle : clés propres à cette vidéo)
OBJETS.ange_bocal = (T) => <Bocal p={[0, -0.82, 0]} s={0.95} n={12} T={T} lid={null} />;
OBJETS.ange_plume = (T) => (
  <group position={[0, -0.05, 0]} rotation={[0, 0, 0.12]}>
    <PlumeBloc p={[0, -0.42, 0]} s={1.15} />
    <Lueur p={[0, -0.45, 0]} s={2.0} c={OR} o={0.5 + Math.sin(T * 5) * 0.12} />
  </group>
);

/** Plume qui tombe en tournoyant de (x0, y0, z0) jusqu'au sol à l'instant `t0 + duree` (puis posée, lumineuse). */
export const PlumeTombe: React.FC<{ T: number; t0: number; duree: number; de: V3; sol: V3; s?: number; pose?: boolean }> = ({ T, t0, duree, de, sol, s = 1.3, pose = true }) => {
  if (T < t0) return null;
  const k = Math.min(1, (T - t0) / duree);
  const e = k * (2 - k) * 0.35 + k * 0.65; // chute amortie
  const bal = (1 - k) * 1.1;
  const x = de[0] + (sol[0] - de[0]) * e + Math.sin(T * 3.1) * bal;
  const z = de[2] + (sol[2] - de[2]) * e + Math.cos(T * 2.3) * bal * 0.7;
  const y = de[1] + (sol[1] - de[1]) * e;
  if (k >= 1 && !pose) return null;
  const pos: V3 = k >= 1 ? sol : [x, y, z];
  const rot: V3 = k >= 1 ? [Math.PI / 2 - 0.08, 0.6, 0.15] : [Math.sin(T * 2.7) * 0.9 + 0.4, T * 1.6, Math.cos(T * 3.3) * 0.7];
  return (
    <group>
      <PlumeBloc p={pos} r={rot} s={s} />
      <Lueur p={pos} s={k >= 1 ? 3.2 + Math.sin(T * 4) * 0.4 : 2.6} c={OR} o={0.6} />
      {k >= 1 && <Tache p={[pos[0], sol[1] + 0.03, pos[2]]} s={[5, 5]} c={OR} o={0.5 + Math.sin(T * 4) * 0.1} />}
    </group>
  );
};

/** Pluie de plumes dorées autour d'un point (instants et dérives déterministes). */
export const PluiePlumes: React.FC<{ T: number; t0: number; duree?: number; centre: V3; rayon?: number; n?: number; haut?: number; monte?: boolean }> = ({ T, t0, duree = 3.2, centre, rayon = 4, n = 14, haut = 7, monte = false }) => {
  if (T < t0 || T > t0 + duree + 1.6) return null;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const d0 = t0 + (i / n) * 1.2;
    const k = (T - d0) / duree;
    if (k < 0 || k > 1) continue;
    const a = i * 2.399;
    const rr = rayon * (0.25 + ((i * 37) % 10) / 12);
    const kk = monte ? k : k;
    const y = monte ? centre[1] + kk * haut : centre[1] + haut * (1 - kk);
    const fade = Math.min(1, k * 5, (1 - k) * 4);
    const x = centre[0] + Math.cos(a) * rr + Math.sin(T * 2 + i) * 0.45;
    const z = centre[2] + Math.sin(a) * rr * 0.8 + Math.cos(T * 1.7 + i) * 0.35;
    items.push(
      <group key={i}>
        <PlumeBloc p={[x, y, z]} r={[Math.sin(T * 2.4 + i) * 0.9, T * 1.3 + i, Math.cos(T * 3 + i * 2) * 0.8]} s={0.9 + (i % 3) * 0.2} o={fade} />
        <Lueur p={[x, y, z]} s={1.6} c={OR} o={0.42 * fade} />
      </group>,
    );
  }
  return <>{items}</>;
};

// ------------------------------------------------------------------ Pilier de lumière dorée
export const Pilier: React.FC<{ p: V3; rayon: number; haut: number; o: number; c?: string }> = ({ p, rayon, haut, o, c = "#FFD86B" }) => {
  if (o < 0.005) return null;
  return (
    <group position={[p[0], p[1] + haut / 2, p[2]]}>
      <mesh renderOrder={5}>
        <cylinderGeometry args={[rayon, rayon * 1.25, haut, 28, 1, true]} />
        <meshBasicMaterial color={c} transparent opacity={o * 0.3} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh renderOrder={5}>
        <cylinderGeometry args={[rayon * 0.55, rayon * 0.7, haut, 24, 1, true]} />
        <meshBasicMaterial color="#FFF6D0" transparent opacity={o * 0.42} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <Lueur p={[0, -haut / 2 + 1.6, 0]} s={rayon * 3.2} c="#FFE9A0" o={o * 0.55} />
    </group>
  );
};

// ------------------------------------------------------------------ Silhouette lumineuse, ailes, auréole
/** Silhouette humaine dorée et translucide (la présence d'un ange gardien), à l'échelle `e`, pieds en `p`. */
export const SilhouetteDoree: React.FC<{ p: V3; ry: number; e: number; o: number; T: number }> = ({ p, ry, e, o, T }) => {
  if (o < 0.01) return null;
  const c = "#FFC21A";
  return (
    <group position={p} rotation={[0, ry, 0]} scale={e}>
      <Bloc p={[0.23, 0.48, 0]} s={[0.46, 0.96, 0.46]} c={c} brut opacite={o * 0.8} />
      <Bloc p={[-0.23, 0.48, 0]} s={[0.46, 0.96, 0.46]} c={c} brut opacite={o * 0.8} />
      <Bloc p={[0, 1.45, 0]} s={[0.92, 1.0, 0.46]} c={c} brut opacite={o * 0.85} />
      <Bloc p={[0.68, 1.5, 0]} s={[0.44, 0.95, 0.44]} c={c} brut opacite={o * 0.8} />
      <Bloc p={[-0.68, 1.5, 0]} s={[0.44, 0.95, 0.44]} c={c} brut opacite={o * 0.8} />
      <Bloc p={[0, 2.35, 0]} s={[0.8, 0.8, 0.8]} c="#FFE27A" brut opacite={o * 0.92} />
      <Lueur p={[0, 1.6, 0]} s={6 + Math.sin(T * 6) * 0.4} c="#FFD24A" o={0.5 * o} />
    </group>
  );
};

/** Ailes dorées et auréole d'un ange gardien (repère de l'avatar : pieds en `p`, avant = +z). */
export const AilesAnge: React.FC<{ p: V3; ry: number; e: number; o: number; T: number }> = ({ p, ry, e, o, T }) => {
  if (o < 0.01) return null;
  const plumes: React.ReactNode[] = [];
  for (const s of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const L = 1.9 - k * 0.2;
      const th = 0.25 + k * 0.27 + Math.sin(T * 1.6 + k) * 0.03;
      const bx = s * 0.55;
      const by = 2.0 - k * 0.05;
      plumes.push(
        <Bloc key={`${s}${k}`} p={[bx + s * Math.sin(th) * (L / 2), by + Math.cos(th) * (L / 2) - k * 0.12, -0.5 - k * 0.025]} s={[0.26, L, 0.05]} r={[0, 0, -s * th]} c={k % 2 ? "#FFF3B0" : "#FFFFFF"} brut opacite={o * 0.88} />,
      );
    }
  }
  const anneau: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    anneau.push(<Bloc key={i} p={[Math.sin(a) * 0.62, 3.3, Math.cos(a) * 0.62 - 0.05]} s={[0.2, 0.1, 0.2]} c="#FFE066" brut r={[0, a, 0]} opacite={o} />);
  }
  return (
    <group position={p} rotation={[0, ry, 0]} scale={e}>
      {plumes}
      {anneau}
      <Lueur p={[0, 3.3, 0]} s={3.2} c="#FFE9A0" o={0.7 * o} />
      <Lueur p={[0, 2.0, -0.6]} s={7.5} c="#FFE9A0" o={0.4 * o} />
    </group>
  );
};

// ------------------------------------------------------------------ Voiture (qui roule vers -z, phares allumés)
export const Voiture: React.FC<{ p: V3; ry: number; t: Teinte; frein: boolean }> = ({ p, ry, t, frein }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Bloc p={[0, 0.7, 0]} s={[1.95, 0.7, 4.2]} c="#F2B418" t={t} />
    <Bloc p={[0, 1.3, -0.3]} s={[1.75, 0.62, 2.3]} c="#F2B418" t={t} />
    <Bloc p={[0, 1.34, 0.86]} s={[1.5, 0.5, 0.08]} c="#BFD8EE" t={t} />
    <Bloc p={[0, 1.34, -1.46]} s={[1.5, 0.5, 0.08]} c="#9FC0DA" t={t} />
    {[-1, 1].map((s) => (
      <group key={s}>
        <Bloc p={[s * 0.89, 1.34, -0.3]} s={[0.05, 0.46, 1.9]} c="#BFD8EE" t={t} />
        {[-1.35, 1.35].map((z) => (
          <Bloc key={z} p={[s * 0.92, 0.38, z]} s={[0.32, 0.78, 0.78]} c="#1B1B1F" t={t} />
        ))}
        <Bloc p={[s * 0.62, 0.78, 2.12]} s={[0.46, 0.22, 0.06]} c="#FFF6D0" brut />
        <Bloc p={[s * 0.62, 0.78, -2.12]} s={[0.46, 0.22, 0.06]} c={frein ? "#FF3B2E" : "#8E2A24"} brut />
        {frein && <Lueur p={[s * 0.62, 0.78, -2.3]} s={2.4} c="#FF3B2E" o={0.7} />}
      </group>
    ))}
    <Bloc p={[0, 0.42, 2.15]} s={[1.98, 0.2, 0.1]} c="#3A3D44" t={t} />
    <Bloc p={[0, 0.42, -2.15]} s={[1.98, 0.2, 0.1]} c="#3A3D44" t={t} />
    <Bloc p={[0, 1.95, -0.3]} s={[0.7, 0.18, 0.4]} c="#FFFFFF" brut />
    {/* conducteur */}
    <Bloc p={[0.4, 1.25, 0.45]} s={[0.5, 0.5, 0.35]} c="#7A3B3B" t={t} />
    <Bloc p={[0.4, 1.7, 0.45]} s={[0.42, 0.42, 0.42]} c="#E6B98F" t={t} />
    <Lueur p={[0, 0.8, 2.6]} s={4.2} c="#FFF2C0" o={0.5} />
  </group>
);

// ------------------------------------------------------------------ Train (loco + 3 wagons), avant en z = 0, il roule vers +z
export const L_LOCO = 9.5;
export const Train: React.FC<{ z: number; t: Teinte }> = ({ z, t }) => {
  const wagons = [
    { c: "#9A4A32", z: -(L_LOCO + 0.7 + 3.7) },
    { c: "#3E5C8A", z: -(L_LOCO + 0.7 + 3.7 + 8.1) },
    { c: "#7A7A68", z: -(L_LOCO + 0.7 + 3.7 + 16.2) },
  ];
  return (
    <group position={[0, 0, GZ + z]}>
      {/* locomotive */}
      <Bloc p={[0, 1.0, -L_LOCO / 2]} s={[3.0, 0.8, L_LOCO]} c="#3A3A40" t={t} />
      <Bloc p={[0, 2.5, -2.2]} s={[2.7, 2.2, 4.4]} c="#2F6B4F" t={t} />
      <Bloc p={[0, 2.75, -6.8]} s={[3.0, 3.1, 4.4]} c="#2F6B4F" t={t} />
      <Bloc p={[0, 4.45, -6.8]} s={[3.1, 0.3, 4.8]} c="#4A4A50" t={t} />
      <Bloc p={[0, 3.05, -0.3]} s={[2.4, 1.0, 0.6]} c="#2F6B4F" t={t} />
      <Bloc p={[0, 1.7, -0.05]} s={[3.1, 0.5, 0.3]} c="#F2C230" t={t} />
      <Bloc p={[0, 2.0, -4.5]} s={[3.04, 0.22, 9.0]} c="#F2C230" t={t} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Bloc p={[s * 1.51, 3.3, -6.8]} s={[0.06, 1.1, 1.6]} c="#BFD8EE" t={t} />
          <Bloc p={[s * 0.85, 3.4, 0.0]} s={[0.55, 0.45, 0.1]} c="#FFF6D0" brut />
          <Bloc p={[s * 0.9, 0.7, -2.0]} s={[0.4, 1.2, 1.6]} c="#1E1E22" t={t} />
          <Bloc p={[s * 0.9, 0.7, -7.2]} s={[0.4, 1.2, 1.6]} c="#1E1E22" t={t} />
        </group>
      ))}
      <Bloc p={[0, 4.0, -1.2]} s={[0.7, 1.0, 0.7]} c="#4A4A50" t={t} />
      <Lueur p={[0, 3.3, 0.8]} s={8} c="#FFF2C0" o={0.75} />
      {/* wagons */}
      {wagons.map((w, i) => (
        <group key={i} position={[0, 0, w.z]}>
          <Bloc p={[0, 1.0, 0]} s={[3.0, 0.7, 7.6]} c="#3A3A40" t={t} />
          <Bloc p={[0, 2.8, 0]} s={[3.0, 3.0, 7.4]} c={w.c} t={t} />
          <Bloc p={[0, 4.4, 0]} s={[3.1, 0.22, 7.7]} c="#55555C" t={t} />
          <Bloc p={[0, 3.3, 0]} s={[3.04, 0.2, 7.5]} c="#E8E0C8" t={t} />
          {[-1, 1].map((s) => (
            <group key={s}>
              {[-2.4, 0, 2.4].map((dz) => (
                <Bloc key={dz} p={[s * 1.51, 3.1, dz]} s={[0.06, 1.0, 1.2]} c="#BFD8EE" t={t} />
              ))}
              <Bloc p={[s * 0.9, 0.7, -2.4]} s={[0.4, 1.2, 1.5]} c="#1E1E22" t={t} />
              <Bloc p={[s * 0.9, 0.7, 2.4]} s={[0.4, 1.2, 1.5]} c="#1E1E22" t={t} />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ Barrières de passage à niveau
/** Angle d'un bras : 1,3 rad levé, 0 baissé. `fenetres` = [descente, remontée] successives. */
export function angleBarriere(T: number, fenetres: Array<[number, number]>): number {
  let a = 1.3;
  for (const [bas, haut] of fenetres) {
    const k = lisse(entre(T, bas, bas + 1.0)) * (1 - lisse(entre(T, haut, haut + 1.4)));
    a = Math.min(a, 1.3 * (1 - k));
  }
  return a;
}
export const Barrieres: React.FC<{ angle: number; T: number; clignote: boolean; t: Teinte }> = ({ angle, T, clignote, t }) => {
  const arm = (x: number, zPivot: number, dir: 1 | -1) => (
    <group position={[x, 2.0, GZ + zPivot]} rotation={[-dir * angle, 0, 0]}>
      <group>
        {Array.from({ length: 7 }, (_, i) => (
          <Bloc key={i} p={[0, 0, dir * (0.5 + i * 1.0)]} s={[0.2, 0.22, 1.0]} c={i % 2 ? "#F4F1E8" : "#D4382E"} t={t} />
        ))}
        <Bloc p={[0, 0.2, dir * 7.2]} s={[0.22, 0.2, 0.2]} c="#FF3B2E" brut />
        {clignote && <Lueur p={[0, 0.25, dir * 7.2]} s={2.0} c="#FF3B2E" o={Math.sin(T * 9 + (dir > 0 ? 0 : Math.PI)) > 0 ? 0.8 : 0.1} />}
      </group>
    </group>
  );
  return (
    <>
      {arm(-4.8, -4.0, 1)}
      {arm(4.8, 4.0, -1)}
      {clignote &&
        [[-4.8, -4.0, 0], [4.8, 4.0, Math.PI]].map(([x, z, ph], i) => (
          <Lueur key={i} p={[x, 3.45, GZ + z]} s={3.0} c="#FF3B2E" o={Math.sin(T * 9 + ph) > 0 ? 0.9 : 0.12} />
        ))}
    </>
  );
};

// ------------------------------------------------------------------ Ciel : soleil flou et nuages en blocs
let soleilTex: THREE.Texture | null = null;
function disqueSoleil(): THREE.Texture {
  if (!soleilTex) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const c = cv.getContext("2d")!;
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,1)");
    g.addColorStop(0.58, "rgba(255,255,255,0.0)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    soleilTex = tx;
  }
  return soleilTex;
}
export const Soleil: React.FC<{ dir: V3; couleur: string; taille?: number; halo?: number }> = ({ dir, couleur, taille = 38, halo: h = 1 }) => (
  <group position={dir}>
    <sprite scale={[taille * 5.5, taille * 5.5, 1]} renderOrder={-8}>
      <spriteMaterial map={halo()} color={couleur} transparent opacity={0.55 * h} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
    </sprite>
    <sprite scale={[taille, taille, 1]} renderOrder={-7}>
      <spriteMaterial map={disqueSoleil()} color="#FFFFFF" transparent opacity={0.98} depthWrite={false} fog={false} />
    </sprite>
  </group>
);

export const Nuages: React.FC<{ T: number; couleur?: string; n?: number }> = ({ T, couleur = "#FFFFFF", n = 12 }) => {
  const g = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2.7 + T * 0.004;
    const R = 330 + (i % 4) * 40;
    const y = 120 + ((i * 53) % 90);
    const w = 50 + ((i * 17) % 40);
    items.push(
      <group key={i} position={[Math.sin(a) * R, y, Math.cos(a) * R]} rotation={[0, a, 0]}>
        <mesh geometry={g} scale={[w, 9, 18]} renderOrder={-9}>
          <meshBasicMaterial color={couleur} fog={false} depthWrite={false} transparent opacity={0.92} />
        </mesh>
        <mesh geometry={g} position={[w * 0.12, 8, 0]} scale={[w * 0.55, 9, 15]} renderOrder={-9}>
          <meshBasicMaterial color={couleur} fog={false} depthWrite={false} transparent opacity={0.92} />
        </mesh>
        <mesh geometry={g} position={[-w * 0.2, -5, 2]} scale={[w * 0.7, 6, 14]} renderOrder={-9}>
          <meshBasicMaterial color="#E6EEF6" fog={false} depthWrite={false} transparent opacity={0.9} />
        </mesh>
      </group>,
    );
  }
  return <>{items}</>;
};

// ------------------------------------------------------------------ Crayon (écrit sur le couvercle) et main d'Emma
export const MainEmma: React.FC<{ p: V3; r?: V3; t: Teinte; s?: number }> = ({ p, r, t, s = 1 }) => (
  <group position={p} rotation={r} scale={s}>
    <Bloc p={[0, 0, 0]} s={[0.34, 0.14, 0.4]} c="#F2CBA4" t={t} />
    <Bloc p={[0, 0.0, 0.34]} s={[0.3, 0.12, 0.3]} c="#F2CBA4" t={t} />
    <Bloc p={[0, 0.05, 0.62]} s={[0.1, 0.1, 0.62]} c="#F4B84A" t={t} />
    <Bloc p={[0, 0.02, 0.98]} s={[0.07, 0.07, 0.1]} c="#2A2018" t={t} />
    <Bloc p={[0, 0.0, -0.4]} s={[0.4, 0.2, 0.5]} c="#F4A6B8" t={t} />
  </group>
);
