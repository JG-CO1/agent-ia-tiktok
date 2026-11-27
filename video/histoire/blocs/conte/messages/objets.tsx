/**
 * « Tout ce que j'envoie par message devient réel… » — composants dynamiques locaux : bulles de chat 3D (textes réels),
 * pluie de bonbons, éclats de pixels, bâtiments qui se dissolvent bloc par bloc, chien en blocs, téléphone et pouce,
 * mains qui se pixellisent, parapluies, soleil bonbon et nuages. Tout est en blocs ou en sprites : aucune lumière réelle.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Bloc, type Teinte } from "../../avatar";
import { halo } from "../../textures";
import { alea, borne, entre, lisse, mel } from "../../maths";
import { OBJETS } from "../lib";
import type { Acteur } from "../../ville/foule";
import { boutMain } from "../brouillard/fk";
import { type TypeBulle, COULEUR_BULLE, texBulle, texBouton, texEcran, texEnseigne, texPanneau, texPastille } from "./toile";
import type { Edifice } from "./edifices";

const mel3 = (a: V3, b: V3, k: number): V3 => [mel(a[0], b[0], k), mel(a[1], b[1], k), mel(a[2], b[2], k)];

// ------------------------------------------------------------------ Lumières simples
export const Lueur2: React.FC<{ p: V3; s: number; c: string; o: number; ordre?: number }> = ({ p, s, c, o, ordre = 3 }) => (
  <sprite position={p} scale={[s, s, 1]} renderOrder={ordre}>
    <spriteMaterial map={halo()} color={c} transparent opacity={o} depthWrite={false} fog={false} />
  </sprite>
);

/** Soleil de bonbon (disque + halo, insensible au brouillard), placé à `dir` de la caméra. */
export const Soleil: React.FC<{ dir: V3; couleur: string; halo: string; taille: number }> = ({ dir, couleur, halo: ch, taille }) => (
  <group position={dir}>
    <sprite scale={[taille * 5, taille * 5, 1]} renderOrder={-9}>
      <spriteMaterial map={halo()} color={ch} transparent opacity={0.55} depthWrite={false} fog={false} />
    </sprite>
    <sprite scale={[taille * 1.7, taille * 1.7, 1]} renderOrder={-8}>
      <spriteMaterial map={halo()} color={couleur} transparent opacity={1} depthWrite={false} fog={false} />
    </sprite>
    <sprite scale={[taille * 0.8, taille * 0.8, 1]} renderOrder={-7}>
      <spriteMaterial map={halo()} color="#FFFFFF" transparent opacity={1} depthWrite={false} fog={false} />
    </sprite>
  </group>
);

/** Nuages en blocs (suivent la caméra : voûte lointaine) qui dérivent lentement. */
export const Nuages: React.FC<{ T: number; couleur: string; n?: number; rayon?: number }> = ({ T, couleur, n = 11, rayon = 210 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = i * 2.399 + T * 0.012;
      const x = Math.sin(a) * rayon;
      const z = Math.cos(a) * rayon;
      const y = 62 + ((i * 37) % 31);
      const s = 1 + ((i * 13) % 7) / 7;
      return (
        <group key={i} position={[x, y, z]} rotation={[0, a, 0]} scale={s * 1.8}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[34, 7, 10]} />
            <meshBasicMaterial color={couleur} fog={false} />
          </mesh>
          <mesh position={[-6, 4.6, 0]}>
            <boxGeometry args={[18, 6, 8]} />
            <meshBasicMaterial color={couleur} fog={false} />
          </mesh>
          <mesh position={[9, 3.8, 0]}>
            <boxGeometry args={[14, 5, 8]} />
            <meshBasicMaterial color={couleur} fog={false} />
          </mesh>
        </group>
      );
    })}
  </>
);

// ------------------------------------------------------------------ Bulle de chat
const q = new THREE.Quaternion();
const m4 = new THREE.Matrix4();
/** Quaternion qui tourne un plan (face +z) vers `cible`, sans roulis. */
function vers(p: V3, cible: V3): THREE.Quaternion {
  m4.lookAt(new THREE.Vector3(...cible), new THREE.Vector3(...p), new THREE.Vector3(0, 1, 0));
  return q.clone().setFromRotationMatrix(m4);
}
export type PropsBulle = { p: V3; w: number; h: number; texte?: string; type: TypeBulle; s?: number; cam?: V3; ry?: number; opacite?: number; barres?: number; points?: number; lueur?: number; epaisseur?: number };
/** Bulle de chat (plan texturé + deux plans plus sombres derrière = épaisseur). `cam` = elle se tourne vers la caméra, sinon `ry`. */
export const Bulle: React.FC<PropsBulle> = ({ p, w, h, texte = "", type, s = 1, cam, ry = 0, opacite = 1, barres, points, lueur = 0, epaisseur = 0.2 }) => {
  const tex = texBulle(texte, type, w, h, { barres, points });
  const quat = cam ? vers(p, cam) : undefined;
  if (opacite <= 0.003 || s <= 0.003) return null;
  const sombre = type === "bleue" ? "#4A6FB0" : type === "verte" ? "#3F8F55" : "#8A8A98";
  return (
    <group position={p} quaternion={quat} rotation={quat ? undefined : [0, ry, 0]} scale={s}>
      {[2, 1].map((k) => (
        <mesh key={k} position={[0, -0.02 * k, -epaisseur * k * 0.5]} renderOrder={4}>
          <planeGeometry args={[w * (1 - 0.004 * k), h]} />
          <meshBasicMaterial map={tex} color={sombre} transparent opacity={opacite} alphaTest={0.05} depthWrite={false} />
        </mesh>
      ))}
      <mesh renderOrder={5}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent opacity={opacite} alphaTest={0.03} depthWrite={false} toneMapped={false} />
      </mesh>
      {lueur > 0 && <Lueur2 p={[0, 0, -0.3]} s={Math.max(w, h) * 1.9} c={COULEUR_BULLE(type)} o={lueur * opacite} ordre={3} />}
    </group>
  );
};

/** Plan texturé simple (pastille, panneau, enseigne). */
export const Plan: React.FC<{ p: V3; w: number; h: number; tex: THREE.Texture; ry?: number; cam?: V3; opacite?: number; s?: number }> = ({ p, w, h, tex, ry = 0, cam, opacite = 1, s = 1 }) => {
  if (opacite <= 0.003 || s <= 0.003) return null;
  const quat = cam ? vers(p, cam) : undefined;
  return (
    <mesh position={p} quaternion={quat} rotation={quat ? undefined : [0, ry, 0]} scale={s} renderOrder={5}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent opacity={opacite} alphaTest={0.03} depthWrite={false} />
    </mesh>
  );
};
export const Pastille: React.FC<{ p: V3; w: number; h: number; texte: string; fond?: string; encre?: string; opacite?: number }> = ({ p, w, h, texte, fond, encre, opacite }) => <Plan p={p} w={w} h={h} tex={texPastille(texte, w, h, fond, encre)} opacite={opacite} />;

// ------------------------------------------------------------------ Éclats de pixels (carrés qui s'envolent)
const PIX = ["#FFFFFF", "#7FC4FF", "#FF8FD0", "#FFE066", "#B07CFF"];
export const Eclats: React.FC<{ p: V3; T: number; t0: number; n?: number; rayon?: number; dur?: number; taille?: number; couleurs?: string[]; graine?: number; monte?: number; ordre?: number }> = ({ p, T, t0, n = 18, rayon = 2.2, dur = 1.1, taille = 0.22, couleurs = PIX, graine = 0, monte = 1.2 }) => {
  const u = (T - t0) / dur;
  if (u < 0 || u > 1) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const r = (k: number) => alea(i * 11 + k * 7 + graine * 31);
        const a = r(1) * Math.PI * 2;
        const e = 1 - Math.pow(1 - u, 2.2);
        const el = (r(2) - 0.35) * 1.6;
        const d = rayon * (0.35 + r(3) * 0.65) * e;
        const pos: V3 = [p[0] + Math.cos(a) * Math.cos(el) * d, p[1] + Math.sin(el) * d + monte * u * (0.4 + r(4)) - 0.6 * u * u, p[2] + Math.sin(a) * Math.cos(el) * d];
        const sz = taille * (0.6 + r(5) * 0.9) * (1 - u * u);
        return <Bloc key={i} p={pos} s={[sz, sz, sz]} c={couleurs[i % couleurs.length]} brut r={[r(6) * 3, r(7) * 3, 0]} />;
      })}
    </>
  );
};

// ------------------------------------------------------------------ Pluie de bonbons (maillage périodique autour de la caméra)
const CANDY = ["#FF4F9A", "#FFE066", "#4FC8FF", "#6BFF9A", "#FF9F43", "#B07CFF", "#FFFFFF", "#FF5050"];
let geoBonbon: THREE.BufferGeometry | null = null;
let geoCube: THREE.BufferGeometry | null = null;
function ombrer(g0: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = g0.index ? g0.toNonIndexed() : g0;
  const p = g.getAttribute("position");
  const col = new Float32Array(p.count * 3);
  const L = new THREE.Vector3(-0.3, 0.8, 0.6).normalize();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    n.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
    const k = 0.62 + 0.5 * Math.max(0, n.dot(L));
    for (let j = 0; j < 3; j++) col.set([k, k, k], (i + j) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}
const geos = () => {
  geoBonbon ??= ombrer(new THREE.IcosahedronGeometry(0.5, 1));
  geoCube ??= ombrer(new THREE.BoxGeometry(0.8, 0.8, 0.8));
  return [geoBonbon, geoCube] as const;
};
const enroule = (v: number, c: number, L: number) => c + ((((v - c + L / 2) % L) + L) % L) - L / 2;

/** Pluie de bonbons : `n` sphères et cubes colorés qui tombent, répartis périodiquement autour de la caméra (`cam`). */
export const Pluie: React.FC<{ T: number; t0: number; cam: V3; boite: [number, number]; n: number; haut: number; vit?: number; rampe?: number; taille?: number; zMax?: number; xBorne?: [number, number]; graine?: number }> = ({ T, t0, cam, boite, n, haut, vit = 10, rampe = 1.6, taille = 0.9, zMax = 1e9, xBorne, graine = 0 }) => {
  const [g1, g2] = geos();
  const ref1 = useRef<THREE.InstancedMesh>(null);
  const ref2 = useRef<THREE.InstancedMesh>(null);
  const n1 = Math.ceil(n / 2);
  const n2 = n - n1;
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const P = haut / vit;
  const remplir = (mesh: THREE.InstancedMesh | null, nn: number, decal: number) => {
    if (!mesh) return;
    for (let i = 0; i < nn; i++) {
      const r = (k: number) => alea((i + decal) * 13 + k * 17 + graine * 101);
      const ti = t0 + r(1) * rampe;
      const ph = r(2) * P;
      const tt = T - ti;
      let vis = tt >= 0 ? 1 : 0;
      const y = haut - (((tt + ph) % P) + P) % P * vit;
      const x = enroule(r(3) * boite[0] + 0.0, cam[0], boite[0]);
      const z = enroule(r(4) * boite[1], cam[2], boite[1]);
      if (z > zMax || (xBorne && (x < xBorne[0] || x > xBorne[1]))) vis = 0;
      const yy = Math.max(0.3, y);
      const dc = Math.hypot(x - cam[0], yy - cam[1], z - cam[2]);
      const sz = taille * (0.55 + r(5) * 0.85) * vis * Math.min(1, Math.max(0.0, y / 0.6)) * Math.min(1, (haut - y) / 1.5 + 0.2) * Math.min(1, Math.max(0, (dc - 2.2) / 4));
      dummy.position.set(x, yy, z);
      dummy.rotation.set(T * (r(6) * 3 - 1.5), T * (r(7) * 3 - 1.5), 0);
      dummy.scale.setScalar(Math.max(0.0001, sz));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, col.set(CANDY[Math.floor(r(8) * CANDY.length) % CANDY.length]));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };
  useLayoutEffect(() => {
    remplir(ref1.current, n1, 0);
    remplir(ref2.current, n2, 1000);
  });
  return (
    <>
      <instancedMesh ref={ref1} args={[g1, mat, n1]} frustumCulled={false} />
      <instancedMesh ref={ref2} args={[g2, mat, Math.max(1, n2)]} frustumCulled={false} />
    </>
  );
};

/** Une seule sphère de bonbon qui tombe (la première), puis rebondit deux fois. */
export const PremierBonbon: React.FC<{ T: number; t0: number; x: V3; hauteur: number; taille?: number; couleur?: string }> = ({ T, t0, x, hauteur, taille = 1.1, couleur = "#FF4F9A" }) => {
  const dt = T - t0;
  if (dt < 0 || dt > 4) return null;
  const g = 30;
  const tChute = Math.sqrt((2 * hauteur) / g);
  let y: number;
  if (dt < tChute) y = hauteur - 0.5 * g * dt * dt;
  else {
    const u = dt - tChute;
    const v = g * tChute * 0.45;
    const per = (2 * v) / g;
    const k = u % per;
    y = Math.max(0, v * k - 0.5 * g * k * k) * Math.pow(0.5, Math.floor(u / per));
  }
  return (
    <group position={[x[0], y + taille * 0.5, x[2]]} rotation={[dt * 3, dt * 2, 0]}>
      <mesh geometry={geos()[0]} scale={taille}>
        <meshBasicMaterial vertexColors color={couleur} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ Bâtiments qui se dissolvent bloc par bloc (« annuler »)
const PART = ["#FFFFFF", "#FF8FD0", "#8FD0FF", "#FFE066"];
export type RegleDissolution = { t0: number; dur: number; tR?: number; durR?: number };
const T_BLOC = 0.32;

/** Bâtiment en blocs individuels : se défait de haut en bas (t0, dur), se reconstruit de bas en haut (tR, durR). */
export const EdificeDyn: React.FC<{ ed: Edifice; T: number; frame: number; regle: RegleDissolution; frontZ: number; t: Teinte; rose: boolean }> = ({ ed, T, frame, regle, frontZ, t, rose }) => {
  const [ox, , oz] = ed.o;
  const cs = Math.cos(ed.ry);
  const sn = Math.sin(ed.ry);
  const fini = T > regle.t0 + regle.dur + T_BLOC + 1.2 && (regle.tR === undefined || T < regle.tR);
  if (fini) return null;
  const rend: React.ReactNode[] = [];
  ed.blocs.forEach((b, i) => {
    const r = (k: number) => alea(i * 5 + k * 29 + ed.o[2] * 0.37);
    const yn = borne(b.p[1] / ed.hmax);
    const tD = regle.t0 + regle.dur * (0.78 * (1 - yn) + 0.22 * r(1));
    const tR = regle.tR !== undefined ? regle.tR + (regle.durR ?? 1) * (0.78 * yn + 0.22 * r(2)) : 1e9;
    let k = 1;
    if (T >= tD && T < tD + T_BLOC) k = 1 - (T - tD) / T_BLOC;
    else if (T >= tD + T_BLOC && T < tR) k = 0;
    else if (T >= tR && T < tR + T_BLOC) k = (T - tR) / T_BLOC;
    // particules : un petit cube qui s'envole de chaque bloc qui disparaît
    const uP = (T - tD) / 1.15;
    if (uP > 0 && uP < 1 && T < tR) {
      const a = r(3) * Math.PI * 2;
      const e = 1 - Math.pow(1 - uP, 2);
      const sz = 0.3 * (1 - uP);
      rend.push(<Bloc key={`p${i}`} p={[b.p[0] + Math.cos(a) * 1.3 * e, b.p[1] + 0.8 + 2.4 * e * (0.5 + r(4)), b.p[2] + Math.sin(a) * 1.3 * e + 0.5 * e]} s={[sz, sz, sz]} c={PART[i % 4]} brut r={[uP * 3, uP * 2, 0]} />);
    }
    if (k <= 0.001) return;
    if (k < 1 && (frame + i) % 3 === 0) return; // scintillement de pixel qui part
    const wz = oz - b.p[0] * sn + b.p[2] * cs;
    const col = rose && wz < frontZ ? b.cr : b.c;
    if (b.tex === "enseigne") {
      rend.push(
        <mesh key={i} position={b.p} scale={[1, 1, 1]} renderOrder={6}>
          <planeGeometry args={[b.s[0], b.s[1]]} />
          <meshBasicMaterial map={texEnseigne("BOULANGERIE", col, "#FFF3D0", 6.6, 0.72)} transparent opacity={k} color={new THREE.Color(t[0], t[1], t[2])} />
        </mesh>,
      );
      return;
    }
    rend.push(<Bloc key={i} p={[b.p[0], b.p[1] + (1 - k) * 0.5, b.p[2]]} s={[b.s[0] * k, b.s[1] * k, b.s[2] * k]} c={col} t={t} r={b.r} opacite={b.o !== undefined ? b.o * k : undefined} />);
  });
  void ox;
  return (
    <group position={ed.o} rotation={[0, ed.ry, 0]}>
      {rend}
    </group>
  );
};

// ------------------------------------------------------------------ Chien en blocs
export type EtatChien = { p: V3; ry: number; malade: number; saut: number; queue: number; assis: number; tete: number };
export const Chien: React.FC<{ e: EtatChien; t: Teinte; s?: number }> = ({ e, t, s = 0.85 }) => {
  const L = e.malade; // 1 = couché sur le ventre, la tête sur les pattes
  const sain = "#B5733C";
  const mal = "#BAA282";
  const c = L > 0.5 ? mal : sain;
  const sombre = L > 0.5 ? "#8A7458" : "#7A4A22";
  const clair = L > 0.5 ? "#D8D0C0" : "#F0E0C8";
  const yeux = L > 0.5;
  return (
    <group position={[e.p[0], e.p[1] + e.saut * s, e.p[2]]} rotation={[0, e.ry, 0]} scale={s}>
      <group rotation={[e.assis * -0.55, 0, 0]}>
        <Bloc p={[0, 1.0 - 0.5 * L, 0]} s={[0.95, 0.95 - 0.1 * L, 2.0]} c={c} t={t} />
        <Bloc p={[0, 0.66 - 0.5 * L, 0.1]} s={[0.9, 0.2, 1.3]} c={clair} t={t} />
        {/* tête */}
        <group position={[0, 1.55 - 0.98 * L, 1.2 + 0.25 * L]} rotation={[0.3 * L, e.tete, 0]}>
          <Bloc p={[0, 0, 0]} s={[0.85, 0.85, 0.85]} c={c} t={t} />
          <Bloc p={[0, -0.12, 0.55]} s={[0.46, 0.38, 0.4]} c={clair} t={t} />
          <Bloc p={[0, -0.02, 0.78]} s={[0.2, 0.16, 0.1]} c="#1A1210" t={t} />
          <Bloc p={[0.47, 0.15 - 0.3 * L, -0.05]} s={[0.16, 0.55, 0.34]} c={sombre} t={t} r={[0, 0, -0.25 - 0.9 * L]} />
          <Bloc p={[-0.47, 0.15 - 0.3 * L, -0.05]} s={[0.16, 0.55, 0.34]} c={sombre} t={t} r={[0, 0, 0.25 + 0.9 * L]} />
          {yeux ? (
            <>
              <Bloc p={[0.2, 0.14, 0.43]} s={[0.22, 0.05, 0.04]} c="#1A1210" t={t} />
              <Bloc p={[-0.2, 0.14, 0.43]} s={[0.22, 0.05, 0.04]} c="#1A1210" t={t} />
              <Bloc p={[0.2, 0.28, 0.43]} s={[0.24, 0.04, 0.04]} c="#5A4A3A" t={t} r={[0, 0, 0.35]} />
              <Bloc p={[-0.2, 0.28, 0.43]} s={[0.24, 0.04, 0.04]} c="#5A4A3A" t={t} r={[0, 0, -0.35]} />
            </>
          ) : (
            <>
              <Bloc p={[0.2, 0.15, 0.43]} s={[0.16, 0.2, 0.05]} c="#1A1210" t={t} />
              <Bloc p={[-0.2, 0.15, 0.43]} s={[0.16, 0.2, 0.05]} c="#1A1210" t={t} />
              <Bloc p={[0.23, 0.2, 0.46]} s={[0.05, 0.06, 0.03]} c="#FFFFFF" brut />
              <Bloc p={[-0.17, 0.2, 0.46]} s={[0.05, 0.06, 0.03]} c="#FFFFFF" brut />
              {e.saut > 0.05 && <Bloc p={[0, -0.34, 0.6]} s={[0.26, 0.16, 0.12]} c="#FF7A8A" t={t} />}
            </>
          )}
        </group>
        {/* pattes : debout, ou repliées sous le ventre (malade) */}
        {[[0.3, 0.7, 1], [-0.3, 0.7, 1], [0.3, -0.7, -1], [-0.3, -0.7, -1]].map(([x, z, av], i) => (
          <group key={i} position={[x, 0.62 - 0.32 * L, z]} rotation={[L * (av > 0 ? -1.45 : 1.3) + (1 - L) * Math.sin(e.saut * 9 + i * 1.6) * 0.5 * Math.min(1, e.saut * 4), 0, 0]}>
            <Bloc p={[0, -0.32, 0]} s={[0.28, 0.66, 0.28]} c={c} t={t} />
            <Bloc p={[0, -0.64, 0.04]} s={[0.3, 0.1, 0.36]} c={clair} t={t} />
          </group>
        ))}
        {/* queue */}
        <group position={[0, 1.35 - 0.85 * L, -1.0]} rotation={[-0.6 + L * 0.5, Math.sin(e.queue) * 0.55 * (1 - 0.8 * L), 0]}>
          <Bloc p={[0, 0, -0.3]} s={[0.2, 0.2, 0.75]} c={sombre} t={t} />
        </group>
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ Téléphone et pouce
OBJETS.msg_tel = () => (
  <>
    <Bloc p={[0, -0.28, 0]} s={[0.1, 0.56, 0.3]} c="#1B2030" />
    <Bloc p={[0.054, -0.28, 0]} s={[0.02, 0.5, 0.25]} c="#8DC3FF" brut />
  </>
);

export const TelProp: React.FC<{ p: V3; ry: number; tilt?: number; s?: number; saisie: string; envoyes: string[]; clavier?: boolean; pression?: number; id: string; lueur?: number; children?: React.ReactNode }> = ({ p, ry, tilt = 0, s = 1, saisie, envoyes, clavier, pression, id, lueur = 0.5, children }) => {
  const tex = texEcran(id, saisie, envoyes, clavier, pression);
  return (
    <group position={p} rotation={[tilt, ry, 0, "YXZ"]} scale={s}>
      <Bloc p={[0, 0, 0]} s={[1.0, 1.86, 0.1]} c="#1B2030" brut />
      <Bloc p={[0, 0, -0.01]} s={[1.04, 1.9, 0.08]} c="#3A4262" brut />
      <mesh position={[0, 0, 0.056]} renderOrder={5}>
        <planeGeometry args={[0.88, 1.76]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <Lueur2 p={[0, 0, -0.5]} s={4.2} c="#6FB4FF" o={lueur} ordre={3} />
      {children}
    </group>
  );
};

/** Pouce de Sam : blocs couleur peau, au-dessus du bouton « envoyer » (repère du téléphone). */
export const Pouce: React.FC<{ T: number; envoi: number; peau: string; p0?: V3; cible?: V3 }> = ({ T, envoi, peau, p0 = [0.5, -1.6, 1.4], cible = [0.3, -0.63, 0] }) => {
  const approche = lisse(entre(T, envoi - 1.1, envoi - 0.15));
  const appui = entre(T, envoi - 0.1, envoi + 0.05) * (1 - entre(T, envoi + 0.12, envoi + 0.35));
  const retrait = lisse(entre(T, envoi + 0.4, envoi + 1.2));
  const base = mel3(p0, [cible[0], cible[1], 0.42], approche);
  const pos: V3 = mel3(base, [cible[0], cible[1], 0.07], appui);
  const out = mel3(pos, [pos[0] + 0.4, pos[1] - 1.2, pos[2] + 0.9], retrait);
  return (
    <group position={out} rotation={[-0.75, 0, 0.12]}>
      <Bloc p={[0, 0, 0]} s={[0.26, 0.24, 0.7]} c={peau} />
      <Bloc p={[0, 0.02, 0.42]} s={[0.24, 0.2, 0.18]} c={peau} />
      <Bloc p={[0, 0.115, 0.43]} s={[0.17, 0.03, 0.14]} c="#FFF0E0" />
      <Bloc p={[0, 0, -0.55]} s={[0.4, 0.34, 0.5]} c={peau} />
    </group>
  );
};


/** Le pouce de Sam, pixellisé, qui tremble au-dessus du bouton (la pointe vers le bas, l'ongle vers le spectateur). */
export const PoucePixel: React.FC<{ p: V3; T: number; frame: number; peau: string; s?: number; k?: number }> = ({ p, T, frame, peau, s = 1, k = 1 }) => {
  const jx = Math.sin(T * 37) * 0.05 + Math.sin(T * 61) * 0.03;
  const jy = Math.sin(T * 29 + 1) * 0.06;
  const cubes: React.ReactNode[] = [];
  for (let i = 0; i < 34; i++) {
    const r = (n: number) => alea(i * 5 + n * 17);
    const sz = 0.13 + 0.12 * r(1);
    const flick = ((frame + i * 3) % 6) / 6;
    const o = (0.3 + 0.55 * r(2)) * (flick < 0.15 ? 0.15 : 1) * k;
    const a = r(3) * Math.PI * 2;
    const y = (r(4) - 0.5) * 1.8 - 0.1;
    cubes.push(<Bloc key={i} p={[Math.cos(a) * 0.5, y, Math.sin(a) * 0.46]} s={[sz, sz, sz]} c={i % 3 === 0 ? "#BFE6FF" : i % 3 === 1 ? "#F0CDB0" : "#7FC4FF"} brut opacite={o} />);
  }
  for (let i = 0; i < 8; i++) {
    const per = 1.5;
    const u = (((T / per) + i / 8) % 1 + 1) % 1;
    const r = (n: number) => alea(i * 11 + n * 13);
    const sz = 0.16 * (1 - u);
    cubes.push(<Bloc key={`d${i}`} p={[(r(1) - 0.5) * 0.9, -0.9 - u * 1.5, (r(2) - 0.5) * 0.7]} s={[sz, sz, sz]} c="#CFEBFF" brut opacite={0.9 * (1 - u) * k} />);
  }
  return (
    <group position={[p[0] + jx, p[1] + jy, p[2]]} scale={s} rotation={[0.25, 0, 0.08]} renderOrder={9}>
      <Bloc p={[0, 0.7, 0]} s={[0.78, 1.3, 0.68]} c="#D8A070" opacite={0.8 * k + 0.1} />
      <Bloc p={[0, -0.18, 0.02]} s={[0.66, 0.6, 0.58]} c="#D8A070" opacite={0.8 * k + 0.1} />
      <Bloc p={[0, -0.55, 0.06]} s={[0.6, 0.26, 0.5]} c="#F8DCC4" opacite={0.85 * k + 0.1} />
      <Bloc p={[0, -0.2, 0.38]} s={[0.46, 0.5, 0.06]} c="#FFF0E0" opacite={0.85 * k + 0.1} />
      {cubes}
    </group>
  );
};

// ------------------------------------------------------------------ Mains qui se pixellisent
/** Peau « pixel » autour d'une main : petits cubes bleutés translucides qui scintillent et s'envolent. */
export const MainPixel: React.FC<{ a: Acteur; cote: 1 | -1; T: number; t0: number; frame: number; seg?: number }> = ({ a, cote, T, t0, frame, seg = 1 }) => {
  const k = entre(T, t0, t0 + 1.2);
  if (k <= 0) return null;
  const cubes: React.ReactNode[] = [];
  const e = a.echelle;
  for (let sgm = 0; sgm < seg; sgm++) {
    const c0 = boutMain(a, cote, 0.43 - sgm * 0.27);
    for (let i = 0; i < 16; i++) {
      const r = (n: number) => alea(i * 3 + n * 19 + sgm * 71 + cote * 5);
      const sz = 0.15 * e * (0.8 + 0.5 * r(1));
      const off: V3 = [(r(2) - 0.5) * 0.5 * e, (r(3) - 0.5) * 0.45 * e, (r(4) - 0.5) * 0.5 * e];
      const flick = ((frame + i * 3 + sgm) % 7) / 7;
      const o = (0.35 + 0.5 * r(5)) * (flick < 0.12 ? 0.2 : 1) * k;
      cubes.push(<Bloc key={`${sgm}-${i}`} p={[c0[0] + off[0], c0[1] + off[1], c0[2] + off[2]]} s={[sz, sz, sz]} c={i % 3 === 0 ? "#BFE6FF" : i % 3 === 1 ? "#F0CDB0" : "#7FC4FF"} brut opacite={o} />);
    }
  }
  // des pixels qui se détachent et montent
  const c1 = boutMain(a, cote, 0.43);
  for (let i = 0; i < 6; i++) {
    const per = 1.4;
    const u = (((T - t0) / per + i / 6) % 1 + 1) % 1;
    const r = (n: number) => alea(i * 7 + n * 13 + cote * 17);
    const sz = 0.1 * e * (1 - u);
    cubes.push(<Bloc key={`d${i}`} p={[c1[0] + (r(1) - 0.5) * 0.4 * e, c1[1] + u * 0.9 * e, c1[2] + (r(2) - 0.5) * 0.4 * e]} s={[sz, sz, sz]} c="#CFEBFF" brut opacite={0.9 * k * (1 - u)} />);
  }
  return <>{cubes}</>;
};

// ------------------------------------------------------------------ Parapluie (au-dessus de la tête, hampe visible)
export const Parapluie: React.FC<{ p: V3; echelle: number; coul: string; t: Teinte }> = ({ p, echelle, coul, t }) => (
  <group position={p} scale={echelle}>
    <Bloc p={[0, 3.55, 0]} s={[0.07, 1.6, 0.07]} c="#3A2E2A" t={t} />
    <Bloc p={[0, 4.35, 0]} s={[3.0, 0.14, 3.0]} c={coul} t={t} />
    <Bloc p={[0, 4.55, 0]} s={[2.0, 0.14, 2.0]} c={coul} t={t} />
    <Bloc p={[0, 4.72, 0]} s={[0.9, 0.12, 0.9]} c="#FFFFFF" t={t} />
  </group>
);

// ------------------------------------------------------------------ Le haut du fil
export { texBouton, texPanneau };
