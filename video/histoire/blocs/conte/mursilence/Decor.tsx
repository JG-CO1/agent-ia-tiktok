/**
 * « Mur du silence » — décor dynamique : le mur de briques qui pousse par vagues (briques instanciées, joints qui battent comme un cœur),
 * phrases gravées lisibles, lumière ambre des suspensions contre gris-bleu froid du mur, rais de lumière et poussière, nuit qui tombe,
 * effondrement en cascade, canapé de maman révélé dans une lumière dorée, chambre d'Adam et rue du quartier (murs qui dépassent des toits).
 * Seul le lieu où se trouve la caméra est dessiné (lieux éloignés de plus de 400 unités).
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Avatar, Bloc, HANCHE, geometrieBloc, type Pose, type Teinte } from "../../avatar";
import { halo, type Emotion } from "../../textures";
import { Faisceau, Lueur, Ombre, Tache, Zone, visibles, type DonneesConte, type EtatConte } from "../lib";
import { entre, lisse, mel } from "../../maths";
import type { Acteur } from "../../ville/foule";
import { type Brique, CH, CHAMBRE, CH_D, CH_W, COUL, EP, ETAGERE, FEN_E, FEN_O, FEN_CUISINE, HORLOGE, LAMPE_E, LAMPE_O, MUR_CH_X, RUE, SH, SW, TABLE, coeur, construireMursilence, genererMur, SD } from "./monde";
import { E_ADAM, E_LINA, H_ASSIS, H_CANAPE, MAMAN_P, OUEST, Z_TROU } from "./histoire";
import { OBJETS_LOCAUX, Vapeur } from "./objets";
import { poseAccable, poseCroise, poseDispute, poseEtreinte, poseExamine, poseMainBreche, poseMorne, poseMurCote, poseOreille, poseOuvre, poseParle, poseSerreAssise, poseTasse, poseThe } from "./poses";
import { texCadran, texDessin, texGravure, texJoint, texPhoto } from "./toile";

export const cielMursilence = (e?: EtatConte) => e?.ciel ?? "#0A0F22";

type Lieu = "salon" | "chambre" | "rue";
export const lieuDe = (p: V3): Lieu => (p[0] < -300 ? "chambre" : p[0] > 300 ? "rue" : "salon");
const alea = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
void sub;

// ------------------------------------------------------------------ Lumière : jour, nuit, or de la révélation
type Tints = { O: Teinte; E: Teinte; N: Teinte; mur: Teinte; nuit: number; or: number };
const mix3 = (a: Teinte, b: Teinte, k: number): Teinte => [mel(a[0], b[0], k), mel(a[1], b[1], k), mel(a[2], b[2], k)];
function tintes(T: number, ev: Record<string, number>): Tints {
  const nuit = lisse(entre(T, ev.nuit0, ev.nuit1));
  const or = lisse(entre(T, ev.effondre + 0.15, ev.effondre + 2.4));
  const O = mix3(mix3([1.22, 1.08, 0.92], [0.82, 0.62, 0.46], nuit), [1.14, 1.02, 0.84], or);
  const E = mix3(mix3([1.0, 1.07, 1.2], [0.42, 0.5, 0.82], nuit), [1.12, 1.0, 0.84], or);
  return { O, E, N: [1.4, 1.18, 0.86], mur: mix3(mix3(mix3(O, E, 0.5), [0.6, 0.62, 0.78], nuit * 0.6), mix3(O, E, 0.5), or), nuit, or };
}
function teinteActeur(p: V3, tn: Tints): Teinte {
  const w = lisse(entre(p[0], -1.6, 1.6));
  const t = mix3(tn.O, tn.E, w);
  return [Math.min(1.4, t[0] * 1.1 + 0.04), Math.min(1.4, t[1] * 1.1 + 0.04), Math.min(1.4, t[2] * 1.1 + 0.04)];
}
/** Lueur dorée qui filtre entre les briques : nulle au début, puis les joints battent comme un cœur. */
export function lueurMur(T: number, ev: Record<string, number>): number {
  if (T < ev.bat0 - 0.2) return 0;
  const k = coeur(T, ev.bat0);
  const montee = T < ev.vF ? 0.55 : T < ev.tombe ? 0.8 : 1.0;
  const base = T < ev.vF ? 0.1 : T < ev.tombe ? 0.17 : 0.24;
  return Math.min(1, base + k * 0.6 * montee);
}

// ------------------------------------------------------------------ Briques : instances, chute, arrivée
const GEO_PLAN = new THREE.PlaneGeometry(1, 1);
const MAT_BRIQUE = new THREE.MeshBasicMaterial({ vertexColors: true });

export type EtatBrique = { p: V3; r: V3; k: number };
const lis01 = (x: number) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};
/** Position, rotation et échelle d'une brique à l'instant T (null = pas encore posée). */
export function etatBrique(b: Brique, T: number): EtatBrique | null {
  if (T < b.ta) return null;
  let x = b.p[0];
  let y = b.p[1];
  let z = b.p[2];
  let rx = 0;
  let ry = 0;
  let rz = 0;
  let k = 1;
  const u = (T - b.ta) / 0.28;
  if (u < 1) {
    const e = 1 - Math.pow(1 - u, 3);
    y += (1 - e) * 2.4;
    ry = (1 - e) * b.lacet * 3;
    rz = (1 - e) * 0.35;
  }
  if (b.fr !== undefined && T >= b.fr && T < b.tf) {
    const r = (T - b.fr) / (b.tf - b.fr);
    x += lis01(r) * 0.14 + Math.sin(T * 70) * 0.014 * r;
    y += Math.sin(T * 53) * 0.008 * r;
  }
  if (T >= b.tf) {
    const t = T - b.tf;
    const dur = Math.max(0.2, b.tl - b.tf);
    const tt = Math.min(t, dur);
    x = b.p[0] + b.v[0] * tt;
    z = b.p[2] + b.v[2] * tt;
    y = b.p[1] + b.v[1] * tt - 0.5 * b.g * tt * tt;
    if (b.fr !== undefined) x += 0.14;
    const yF = b.s[1] / 2 + 0.02;
    if (t > dur) {
      const s = 1 - Math.exp(-(t - dur) * 5);
      x += b.v[0] * 0.1 * s;
      z += b.v[2] * 0.06 * s;
      y = yF;
    }
    const spin = 1 - lis01((t - dur * 0.6) / (dur * 0.4 + 0.12));
    rx = b.w[0] * tt * spin;
    ry = b.w[1] * tt * spin + b.lacet * (1 - spin);
    rz = b.w[2] * tt * spin;
    if (!b.reste) k = 1 - lis01((t - dur - 0.4) / 0.7);
  }
  return { p: [x, y, z], r: [rx, ry, rz], k };
}

const Briques: React.FC<{ liste: Brique[]; T: number; tint: Teinte; glow: (b: Brique) => number; pouls: number }> = ({ liste, T, tint, glow, pouls }) => {
  const a = useRef<THREE.InstancedMesh>(null);
  const jE = useRef<THREE.InstancedMesh>(null);
  const jO = useRef<THREE.InstancedMesh>(null);
  const bases = useMemo(() => liste.map((b) => new THREE.Color(b.teinte)), [liste]);
  const matJoint = useMemo(() => new THREE.MeshBasicMaterial({ map: texJoint(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), []);
  const n = liste.length;
  useLayoutEffect(() => {
    const ma = a.current;
    const me = jE.current;
    const mo = jO.current;
    if (!ma || !me || !mo) return;
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    const off = new THREE.Matrix4();
    const qE = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
    const qO = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
    const m = new THREE.Matrix4();
    const sombre = 0.03;
    for (let i = 0; i < n; i++) {
      const b = liste[i];
      const e = etatBrique(b, T);
      if (!e || e.k <= 0.002) {
        d.position.set(0, -80, 0);
        d.rotation.set(0, 0, 0);
        d.scale.setScalar(0.0001);
        d.updateMatrix();
        ma.setMatrixAt(i, d.matrix);
        me.setMatrixAt(i, d.matrix);
        mo.setMatrixAt(i, d.matrix);
        continue;
      }
      d.position.set(e.p[0], e.p[1], e.p[2]);
      d.rotation.set(e.r[0], e.r[1], e.r[2]);
      d.scale.setScalar(e.k);
      d.updateMatrix();
      const base = d.matrix.clone();
      // contours (joints) posés sur les faces est et ouest
      off.compose(new THREE.Vector3(b.s[0] / 2 + 0.006, 0, 0), qE, new THREE.Vector3(b.s[2] + 0.01, b.s[1] + 0.01, 1));
      m.multiplyMatrices(base, off);
      me.setMatrixAt(i, m);
      off.compose(new THREE.Vector3(-b.s[0] / 2 - 0.006, 0, 0), qO, new THREE.Vector3(b.s[2] + 0.01, b.s[1] + 0.01, 1));
      m.multiplyMatrices(base, off);
      mo.setMatrixAt(i, m);
      d.scale.set(b.s[0] * e.k, b.s[1] * e.k, b.s[2] * e.k);
      d.updateMatrix();
      ma.setMatrixAt(i, d.matrix);
      const l = 1 + 0.16 * pouls;
      col.setRGB(bases[i].r * tint[0] * l, bases[i].g * tint[1] * l, bases[i].b * tint[2] * l);
      ma.setColorAt(i, col);
      const g = glow(b);
      col.setRGB(sombre * tint[0] * (1 - g) + 1.0 * g, sombre * tint[1] * (1 - g) + 0.46 * g, sombre * tint[2] * (1 - g) + 0.08 * g);
      me.setColorAt(i, col);
      mo.setColorAt(i, col);
    }
    for (const mm of [ma, me, mo]) {
      mm.instanceMatrix.needsUpdate = true;
      if (mm.instanceColor) mm.instanceColor.needsUpdate = true;
    }
  });
  return (
    <>
      <instancedMesh ref={a} args={[geometrieBloc(), MAT_BRIQUE, n]} frustumCulled={false} />
      <instancedMesh ref={jE} args={[GEO_PLAN, matJoint, n]} frustumCulled={false} renderOrder={1} />
      <instancedMesh ref={jO} args={[GEO_PLAN, matJoint, n]} frustumCulled={false} renderOrder={1} />
    </>
  );
};

/** Phrases gravées dans les briques (suivent leur brique, y compris pendant la chute). */
const Gravures: React.FC<{ liste: Brique[]; T: number; ev: Record<string, number>; tint: Teinte }> = ({ liste, T, ev, tint }) => {
  const col = useMemo(() => new THREE.Color().setRGB(Math.min(1.2, tint[0]), Math.min(1.2, tint[1]), Math.min(1.2, tint[2])), [tint[0], tint[1], tint[2]]);
  return (
    <>
      {liste.map((b) => {
        if (!b.grave) return null;
        const e = etatBrique(b, T);
        if (!e || e.k < 0.05) return null;
        const o = lisse(entre(T, ev.grave0 + alea(b.id) * 0.9, ev.grave0 + 0.6 + alea(b.id) * 0.9));
        if (o < 0.01) return null;
        return (
          <group key={b.id} position={e.p} rotation={[e.r[0], e.r[1], e.r[2]]} scale={e.k}>
            {b.grave[0] && (
              <mesh position={[b.s[0] / 2 + 0.014, 0, 0]} rotation={[0, Math.PI / 2, 0]} renderOrder={2}>
                <planeGeometry args={[b.s[2] - 0.08, 0.44]} />
                <meshBasicMaterial map={texGravure(b.grave[0])} color={col} transparent opacity={o} depthWrite={false} toneMapped={false} />
              </mesh>
            )}
            {b.grave[1] && (
              <mesh position={[-b.s[0] / 2 - 0.014, 0, 0]} rotation={[0, -Math.PI / 2, 0]} renderOrder={2}>
                <planeGeometry args={[b.s[2] - 0.08, 0.44]} />
                <meshBasicMaterial map={texGravure(b.grave[1])} color={col} transparent opacity={o} depthWrite={false} toneMapped={false} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ Particules (points)
type Fn = (i: number, T: number, out: V3) => boolean;
const Nuage: React.FC<{ n: number; T: number; taille: number; couleur: string; opacite: number; additif?: boolean; fn: Fn; fog?: boolean }> = ({ n, T, taille, couleur, opacite, additif = false, fn, fog = true }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }, [n]);
  useLayoutEffect(() => {
    const att = geo.getAttribute("position") as THREE.BufferAttribute;
    const out: V3 = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      const ok = fn(i, T, out);
      if (ok) att.setXYZ(i, out[0], out[1], out[2]);
      else att.setXYZ(i, 0, -500, 0);
    }
    att.needsUpdate = true;
  });
  return (
    <points geometry={geo} frustumCulled={false} renderOrder={5}>
      <pointsMaterial map={halo()} size={taille} sizeAttenuation transparent opacity={opacite} color={couleur} depthWrite={false} blending={additif ? THREE.AdditiveBlending : THREE.NormalBlending} fog={fog} />
    </points>
  );
};
/** Poussière en suspension dans une boîte (dérive lente, retombe doucement). */
const Poussiere: React.FC<{ T: number; centre: V3; demi: V3; n?: number; opacite?: number; taille?: number }> = ({ T, centre, demi, n = 150, opacite = 0.55, taille = 0.085 }) => (
  <Nuage
    n={n}
    T={T}
    taille={taille}
    couleur="#FFF1D2"
    opacite={opacite}
    additif
    fn={(i, t, o) => {
      const h = 2 * demi[1];
      const y = (((alea(i * 3 + 1) * h - t * (0.08 + alea(i) * 0.1)) % h) + h) % h;
      o[0] = centre[0] + (alea(i * 7 + 2) - 0.5) * 2 * demi[0] + Math.sin(t * 0.25 + i) * 0.35;
      o[1] = centre[1] - demi[1] + y;
      o[2] = centre[2] + (alea(i * 11 + 3) - 0.5) * 2 * demi[2] + Math.cos(t * 0.2 + i * 1.3) * 0.35;
      return true;
    }}
  />
);

// ------------------------------------------------------------------ Personnages
type Retouche = { ry?: number; pose?: Pose; emotion?: Emotion; objet?: string };
function retouche(id: string, a: Acteur, T: number, ev: Record<string, number>): Retouche {
  switch (id) {
    case "papa": {
      if (T < ev.papaLeve) {
        const tang = T < ev.papaTete ? 0.34 : mel(0.34, -0.06, lisse(entre(T, ev.papaTete, ev.papaTete + 0.7)));
        const cyc = T % 5.3;
        const boit = T < 16.4 && cyc < 1.8 ? Math.sin((Math.PI * cyc) / 1.8) : 0;
        return { pose: boit > 0.02 ? poseTasse(T, H_ASSIS, 0.7, boit, tang) : poseMorne(T, H_ASSIS, 0.7, tang), objet: T < 16.4 ? "tasse" : "" };
      }
      if (T < ev.papaArrive) return {};
      if (T < ev.larmes - 0.2) return { pose: poseAccable(T, mel(0.3, -0.03, lisse(entre(T, ev.papaArrive, ev.papaArrive + 0.6)))) };
      if (T < ev.effondre + 0.3) return { pose: poseMainBreche(T, lisse(entre(T, ev.larmes + 0.5, ev.larmes + 1.6)), -0.03) };
      if (T < ev.etreinte + 1.2) return {};
      return { pose: poseEtreinte(T, 2, 0.28) };
    }
    case "adam": {
      if (T < ev.adamVa) return { pose: poseMorne(T, H_ASSIS, 0.3, 0.3) };
      if (T >= ev.adamArrive && T < ev.adamRecule) return { pose: poseOreille(T, 0.2), ry: OUEST };
      if (T >= ev.adamAvance && T < ev.adamParle + 0.2) return { pose: poseExamine(T, 0.2), ry: OUEST };
      if (T >= ev.adamParle + 0.4 && T < ev.adamParle + 1.2) return { ry: OUEST };
      if (T >= ev.adamParle + 1.2 && T < ev.effondre) {
        const k = lisse(entre(T, ev.adamParle + 2.4, ev.vF + 1.4));
        const kk = k * (1 - 0.55 * lisse(entre(T, ev.etreinte - 8, ev.effondre - 0.2))) ;
        void kk;
        return { ry: OUEST, pose: poseParle(T, T < ev.effondre - 3 ? lisse(entre(T, ev.vF + 0.9, ev.vF + 1.6)) : 0.6) };
      }
      if (T >= ev.etreinte + 0.3) return { pose: poseEtreinte(T, 0.3, 0.55) };
      return {};
    }
    case "lina": {
      if (T < ev.linaVa) {
        if (T >= ev.linaOreille - 0.1) return { pose: poseOreille(T, 1.1), ry: OUEST, objet: "lapin" };
        return { pose: poseMurCote(T, 0.4), ry: 0, objet: "lapin" };
      }
      if (T >= ev.etreinte + 0.5) return { pose: poseEtreinte(T, 1.4, 0.4) };
      return {};
    }
    case "maman": {
      const lev = lisse(entre(T, ev.maman0, ev.maman0 + 0.5));
      const tang = mel(0.24, -0.05, lev);
      if (T >= ev.etreinte + 0.7) return { pose: poseSerreAssise(T, H_CANAPE) };
      if (T >= ev.etreinte - 0.4) return { pose: poseOuvre(T, H_CANAPE, lisse(entre(T, ev.etreinte - 0.4, ev.etreinte + 0.2))) };
      return { pose: poseThe(T, H_CANAPE, tang, 0) };
    }
    case "rA":
    case "rB": {
      const turn = lisse(entre(T, ev.rue1, ev.rue1 + 0.45));
      const base = id === "rA" ? Math.PI / 2 : -Math.PI / 2;
      return { ry: base + (id === "rA" ? -1 : 1) * Math.PI * turn, pose: T < ev.rue1 ? poseDispute(T, id === "rA" ? 0 : 1.7) : poseCroise(T) };
    }
    case "adamCh":
      return { pose: { ...poseCroise(T), brasG: { x: -0.1, z: 0.1, pli: -0.1 }, brasD: { x: -0.1, z: 0.1, pli: -0.1 }, tete: [0, 0.1] } };
    default:
      return {};
  }
}

type Lite = { id: string; a: Acteur; objet?: string };
const Perso: React.FC<{ l: Lite; frame: number; t: Teinte; T: number }> = ({ l, frame, t, T }) => {
  const { a, id } = l;
  const [lacet, tang] = a.pose.tete ?? [0, 0];
  const mainD = l.objet && OBJETS_LOCAUX[l.objet] ? OBJETS_LOCAUX[l.objet](T) : undefined;
  const mainG = id === "lina" ? OBJETS_LOCAUX.lapin(T) : undefined;
  return (
    <Avatar p={a.p} ry={a.ry} pose={a.pose} tenue={a.tenue} emotion={a.emotion} frame={frame} graine={a.graine} teinte={t} echelle={a.echelle} sansClin={a.sansClin} clinRapide={a.clinRapide} rx={a.rx} mainD={mainD} mainG={mainG}>
      <group position={[0, HANCHE + (a.pose.y ?? 0), 0]} rotation={[a.pose.torse ?? 0, 0, 0]}>
        {id === "maman" && (
          <>
            <Bloc p={[0, 0.52, 0.245]} s={[0.24, 0.94, 0.03]} c="#F1E6CF" t={t} />
            {[0.7, 0.45, 0.2].map((y) => (
              <Bloc key={y} p={[0.13, y, 0.265]} s={[0.05, 0.05, 0.03]} c="#7A5A3E" t={t} />
            ))}
          </>
        )}
        {id === "lina" && (
          <>
            <Bloc p={[0, 0.3, 0.245]} s={[0.66, 0.6, 0.03]} c="#F2C230" t={t} />
            <Bloc p={[0, 0.34, 0.265]} s={[0.3, 0.2, 0.03]} c="#E0AE1E" t={t} />
            {[-0.24, 0.24].map((x) => (
              <Bloc key={x} p={[x, 0.78, 0.245]} s={[0.1, 0.5, 0.03]} c="#F2C230" t={t} />
            ))}
            <Bloc p={[0, 0.88, -0.245]} s={[0.56, 0.3, 0.03]} c="#F2C230" t={t} />
          </>
        )}
        <group position={[0, 1.0, 0]} rotation={[tang, lacet, 0, "YXZ"]}>
          {id === "papa" && (
            <>
              <Bloc p={[0, 0.04, 0.42]} s={[0.82, 0.13, 0.05]} c="#2B2118" t={t} />
              <Bloc p={[-0.405, 0.22, 0.12]} s={[0.04, 0.34, 0.5]} c="#2B2118" t={t} />
              <Bloc p={[0.405, 0.22, 0.12]} s={[0.04, 0.34, 0.5]} c="#2B2118" t={t} />
            </>
          )}
          {id === "maman" && (
            <>
              {[-1, 1].map((sx) => (
                <Bloc key={sx} p={[sx * 0.5, 0.2, 0.12]} s={[0.17, 1.0, 0.34]} c="#4A2E1E" t={t} />
              ))}
              <Bloc p={[0.3, 0.78, 0.44]} s={[0.1, 0.1, 0.05]} c="#F1E6CF" t={t} />
            </>
          )}
          {(id === "adam" || id === "adamCh") && <Bloc p={[-0.16, 0.7, 0.44]} s={[0.36, 0.2, 0.08]} c="#3A2A1E" t={t} r={[0, 0, 0.35]} />}
          {id === "lina" && (
            <>
              {[-1, 1].map((s) => (
                <group key={s}>
                  <Bloc p={[s * 0.52, 0.62, -0.05]} s={[0.2, 0.2, 0.2]} c="#D9362E" t={t} />
                  <Bloc p={[s * 0.54, 0.38, -0.05]} s={[0.26, 0.5, 0.26]} c="#5B3A22" t={t} r={[0, 0, s * 0.12]} />
                </group>
              ))}
            </>
          )}
        </group>
      </group>
    </Avatar>
  );
};

// ------------------------------------------------------------------ Salon
const FOG_PANE = { jour: new THREE.Color("#D4E6FF"), nuit: new THREE.Color("#0E1736") };
const couleurVitre = (nuit: number) => new THREE.Color().lerpColors(FOG_PANE.jour, FOG_PANE.nuit, nuit);

const Salon: React.FC<{ zones: ReturnType<typeof construireMursilence>; briques: Brique[]; T: number; frame: number; e: EtatConte; data: DonneesConte }> = ({ zones, briques, T, frame, e, data }) => {
  const cam = e.cam.pos;
  const ev = data.ev;
  const tn = tintes(T, ev);
  const vitre = couleurVitre(tn.nuit);
  const lu = lueurMur(T, ev);
  const pouls = T >= ev.bat0 && T < ev.effondre ? coeur(T, ev.bat0) : 0;
  const jour = 1 - tn.nuit;
  const lampOn = 1 - 0.0;
  const or = tn.or;
  const liste = visibles(data, T, cam, 160).filter((v) => lieuDe(v.a.p) === "salon");
  const retouches = liste.map(({ id, a, d }) => {
    const r = retouche(id, a, T, ev);
    const aa: Acteur = { ...a, ry: r.ry ?? a.ry, pose: r.pose ?? a.pose, emotion: r.emotion ?? a.emotion };
    return { id, a: aa, d, objet: r.objet ?? a.objet };
  });
  // lueur pulsée (pas de point d'accroche : les joints brillent, ce halo adoucit)
  const zc = (TABLE.z0 + TABLE.z1) / 2;
  const lueurTrou = lisse(entre(T, ev.tombe + 0.2, ev.tombe + 0.9)) * (1 - lisse(entre(T, ev.effondre, ev.effondre + 0.4)));
  const e0 = ev.effondre;
  const nuages = (i: number, t: number, o: V3): boolean => {
    // poussière de l'effondrement : jaillit du mur, s'étale, retombe lentement
    const z = -6.8 + 13.6 * alea(i * 3 + 1);
    const t0 = e0 + 0.1 * Math.abs(z - Z_TROU) + alea(i * 5) * 0.4;
    const u = t - t0;
    if (u < 0 || u > 10) return false;
    const vx = (alea(i * 7 + 2) - 0.5) * 6;
    const vy = 1.2 + alea(i * 9 + 1) * 2.4;
    const dx = (1 - Math.exp(-2.4 * u)) / 2.4;
    o[0] = (alea(i * 13 + 3) - 0.5) * 1.8 + vx * dx;
    o[1] = Math.max(0.25, 0.4 + alea(i * 17 + 5) * 5 + vy * dx - 0.28 * u);
    o[2] = z + (alea(i * 19 + 7) - 0.5) * 1.5 + (alea(i * 23) - 0.5) * 2 * dx;
    return true;
  };
  const fadeP = 1 - lisse(entre(T, e0 + 6, e0 + 9.5));
  return (
    <>
      <Zone g={zones.ouest} t={tn.O} />
      <Zone g={zones.est} t={tn.E} />
      <Zone g={zones.nook} t={tn.N} />

      {/* fenêtres : jour pâle, nuit bleue ; lune ; rais de lumière */}
      {[FEN_O, FEN_E].map((f, k) => (
        <group key={k}>
          <mesh position={[(f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2, -SD - 0.12]} renderOrder={1}>
            <planeGeometry args={[f.x1 - f.x0, f.y1 - f.y0]} />
            <meshBasicMaterial color={vitre} fog={false} />
          </mesh>
          <Faisceau p={[(f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2 + 0.2, -SD + 0.2]} dir={[0.18 * (k ? -1 : 1), -0.38, 1]} long={13} rayon={2.8} c={tn.nuit > 0.5 ? "#7F9CFF" : "#DCEBFF"} o={mel(0.05, 0.026, tn.nuit) * (1 - 0.6 * or)} />
          {tn.nuit > 0.02 && <Lueur p={[(f.x0 + f.x1) / 2 + 0.6, (f.y0 + f.y1) / 2 + 0.3, -SD + 0.3]} s={3.6} c="#AFC4FF" o={0.4 * tn.nuit} />}
        </group>
      ))}
      <mesh position={[-SW + 0.12, (FEN_CUISINE.y0 + FEN_CUISINE.y1) / 2, (FEN_CUISINE.z0 + FEN_CUISINE.z1) / 2]} rotation={[0, Math.PI / 2, 0]} renderOrder={1}>
        <planeGeometry args={[FEN_CUISINE.z1 - FEN_CUISINE.z0, FEN_CUISINE.y1 - FEN_CUISINE.y0]} />
        <meshBasicMaterial color={vitre} fog={false} />
      </mesh>

      {/* lampes : suspensions chaudes (côté famille), lampadaire de l'escalier */}
      <Lueur p={[LAMPE_O[0], LAMPE_O[1] - 0.45, LAMPE_O[2]]} s={8.5} c="#FFC766" o={0.78 * lampOn} />
      <Faisceau p={[LAMPE_O[0], LAMPE_O[1] - 0.5, LAMPE_O[2]]} dir={[0, -1, 0]} long={3.9} rayon={2.2} c="#FFC766" o={0.016 + 0.02 * tn.nuit} />
      <Tache p={[LAMPE_O[0], TABLE.h + 0.02, zc]} s={[6.5, 5]} c="#FFC766" o={0.55} />
      <Tache p={[LAMPE_O[0], 0.14, zc]} s={[11, 9]} c="#FFB454" o={0.3 + 0.2 * tn.nuit} />
      <Lueur p={[LAMPE_E[0], LAMPE_E[1] - 0.45, LAMPE_E[2]]} s={7} c="#FFD9A0" o={0.55} />
      <Faisceau p={[LAMPE_E[0], LAMPE_E[1] - 0.5, LAMPE_E[2]]} dir={[0, -1, 0]} long={3.9} rayon={2.0} c="#FFD9A0" o={0.022} />
      <Tache p={[LAMPE_E[0], TABLE.h + 0.02, zc]} s={[5.5, 4.4]} c="#FFD9A0" o={0.4} />
      <Tache p={[LAMPE_E[0], 0.14, zc]} s={[9, 8]} c="#FFE0B0" o={0.2 + 0.1 * tn.nuit} />
      <Lueur p={[6.05, 3.9, 0.75]} s={5} c="#FFE9A6" o={0.5} />
      <Tache p={[6.05, 0.14, 0.75]} s={[7, 7]} c="#FFE0A0" o={0.25} />
      <Lueur p={[-9.2, 5.2, 2.0]} s={4} c="#FFE9B0" o={0.3} />

      {/* horloge : cadran et trotteuse (une seconde par tic) */}
      <mesh position={[HORLOGE[0], HORLOGE[1], HORLOGE[2] + 0.12]} renderOrder={2}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial map={texCadran()} transparent toneMapped={false} />
      </mesh>
      <group position={[HORLOGE[0], HORLOGE[1], HORLOGE[2] + 0.15]}>
        <group rotation={[0, 0, -1.2]}>
          <Bloc p={[0, 0.3, 0]} s={[0.09, 0.62, 0.04]} c="#2B2118" brut />
        </group>
        <group rotation={[0, 0, -3.5]}>
          <Bloc p={[0, 0.4, 0.03]} s={[0.07, 0.86, 0.04]} c="#2B2118" brut />
        </group>
        <group rotation={[0, 0, -Math.floor(T) * (Math.PI / 30)]}>
          <Bloc p={[0, 0.4, 0.06]} s={[0.025, 0.84, 0.03]} c="#C23B2E" brut />
        </group>
      </group>

      {/* photo de maman sur l'étagère */}
      <mesh position={ETAGERE.photo} renderOrder={2}>
        <planeGeometry args={[0.84, 1.05]} />
        <meshBasicMaterial map={texPhoto()} toneMapped={false} color={new THREE.Color().setRGB(Math.min(1.2, tn.O[0]), Math.min(1.2, tn.O[1]), Math.min(1.2, tn.O[2]))} />
      </mesh>
      <Lueur p={[ETAGERE.photo[0], ETAGERE.photo[1] + 0.2, ETAGERE.photo[2] + 0.5]} s={3.2} c="#FFD9A0" o={0.3} />

      {/* le mur : briques, joints qui battent, mots gravés */}
      <Briques liste={briques} T={T} tint={tn.mur} pouls={pouls} glow={(b) => (T >= b.tf ? Math.max(lu, 0.95 * (1 - lisse(entre(T, b.tf, b.tf + 1.5)))) : lu * (b.id % 3 === 0 ? 1 : 0.85))} />
      <Gravures liste={briques} T={T} ev={ev} tint={tn.mur} />
      {lueurTrou > 0.01 && <Lueur p={[MUR_X(), 2.25, Z_TROU]} s={3.0 + 1.0 * pouls} c="#FFC766" o={0.22 * lueurTrou} />}

      {/* la révélation : lumière dorée qui inonde la brèche */}
      {or > 0.001 && (
        <>
          <Lueur p={[0.2, 2.3, -2.5]} s={14} c="#FFD27A" o={0.4 * or} />
          <Lueur p={[0.1, 3.9, -4.7]} s={6} c="#FFE9A6" o={0.7 * or} />
          <Faisceau p={[-0.3, 2.6, -2.5]} dir={[1, 0.04, 0.15]} long={11} rayon={4.2} c="#FFD27A" o={0.1 * or} />
          <Faisceau p={[-0.3, 2.6, -2.5]} dir={[0.9, 0.35, -0.3]} long={10} rayon={3.0} c="#FFE2A0" o={0.07 * or} />
          <Faisceau p={[-0.3, 2.6, -2.5]} dir={[0.9, -0.2, 0.55]} long={10} rayon={3.0} c="#FFE2A0" o={0.07 * or} />
          <Faisceau p={[0.3, 2.6, -2.5]} dir={[-1, 0.05, 0.1]} long={9} rayon={3.4} c="#FFD27A" o={0.06 * or} />
          <Tache p={[1.6, 0.16, -2.5]} s={[8, 8]} c="#FFD27A" o={0.5 * or} />
          <Tache p={[-1.0, 0.16, -2.5]} s={[6, 6]} c="#FFD27A" o={0.3 * or} />
        </>
      )}
      <Vapeur p={[MAMAN_P[0] + 0.62, 2.2, MAMAN_P[2] + 0.05]} T={T} />

      {/* poussière en suspension, puis celle de l'effondrement */}
      <Poussiere T={T} centre={[0, 3.0, 0]} demi={[8.8, 2.7, 6.3]} n={150} opacite={0.5 * (1 - 0.3 * tn.nuit)} />
      <Nuage n={60} T={T} taille={2.6} couleur="#CDC4B4" opacite={0.2 * fadeP} fn={nuages} />
      <Nuage n={170} T={T} taille={0.13} couleur="#FFE9B8" opacite={0.8 * fadeP} additif fn={nuages} />

      {/* personnages */}
      {retouches.map(({ id, a, d, objet }) => (
        <group key={id}>
          <Perso l={{ id, a, objet }} frame={frame} T={T} t={teinteActeur(a.p, tn)} />
          {d < 50 && a.rx === 0 && <Ombre x={a.p[0]} z={a.p[2]} y={0.16} r={0.8 * a.echelle} o={0.4} etire={1.25} />}
        </group>
      ))}
    </>
  );
};
const MUR_X = () => EP / 2;

// ------------------------------------------------------------------ Chambre
const Chambre: React.FC<{ zones: ReturnType<typeof construireMursilence>; T: number; frame: number; e: EtatConte; data: DonneesConte }> = ({ zones, T, frame, e, data }) => {
  const ev = data.ev;
  const cam = e.cam.pos;
  const liste = visibles(data, T, cam, 80).filter((v) => lieuDe(v.a.p) === "chambre");
  const t: Teinte = [1.14, 1.06, 0.98];
  return (
    <>
      <Zone g={zones.chambre} t={t} />
      <mesh position={[CHAMBRE[0], 2.8, -CH_D - 0.04]} renderOrder={1}>
        <planeGeometry args={[6.5, 2.0]} />
        <meshBasicMaterial color="#D4E6FF" fog={false} />
      </mesh>
      <Faisceau p={[CHAMBRE[0] - 0.5, 3.2, -CH_D + 0.2]} dir={[0.25, -0.45, 1]} long={11} rayon={2.6} c="#DCEBFF" o={0.08} />
      <mesh position={[CHAMBRE[0] - CH_W + 0.2, 3.3, 1.9]} rotation={[0, Math.PI / 2, 0]} renderOrder={2}>
        <planeGeometry args={[3.0, 2.25]} />
        <meshBasicMaterial map={texDessin()} toneMapped={false} />
      </mesh>
      <Lueur p={[CHAMBRE[0] + 1.9, 2.3, -4.4]} s={4} c="#FFC766" o={0.5} />
      <Tache p={[CHAMBRE[0] + 1.4, 1.4, -4.2]} s={[4, 3]} c="#FFC766" o={0.4} />
      <Lueur p={[CHAMBRE[0] - 3.3, 3.4, 1.9]} s={5} c="#FFE9B0" o={0.22} />
      <Poussiere T={T} centre={[CHAMBRE[0], 2.4, 0]} demi={[5.2, 2.2, 4.2]} n={110} opacite={0.55} />
      {/* sous la trémie, une poussière blanche retombe */}
      <Nuage n={40} T={T} taille={1.6} couleur="#E8E2D4" opacite={0.14} fn={(i, tt, o) => {
        o[0] = CHAMBRE[0] + MUR_CH_X + (alea(i * 3) - 0.5) * 3;
        o[1] = 0.6 + ((alea(i * 5) * 4.4 - tt * 0.1) % 4.4 + 4.4) % 4.4;
        o[2] = (alea(i * 7) - 0.5) * 9;
        return true;
      }} />
      {liste.map(({ id, a, d }) => {
        const r = retouche(id, a, T, ev);
        const aa: Acteur = { ...a, ry: r.ry ?? a.ry, pose: r.pose ?? a.pose };
        return (
          <group key={id}>
            <Perso l={{ id, a: aa, objet: r.objet ?? a.objet }} frame={frame} T={T} t={[1.12, 1.06, 1.0]} />
            {d < 50 && <Ombre x={a.p[0]} z={a.p[2]} y={0.1} r={0.8 * a.echelle} o={0.35} etire={1.2} />}
          </group>
        );
      })}
      <mesh position={[CHAMBRE[0] - 1.5, 0.8, 1.8]} />
    </>
  );
};

// ------------------------------------------------------------------ Rue
function genererMiniMur(ev: Record<string, number>): Brique[] {
  const out: Brique[] = [];
  let id = 0;
  for (let j = 0; j < 8; j++) {
    for (let i = 0; i < 4; i++) {
      const zc = -4.7 + (i - 1.5) * 1.0 + (j % 2 ? 0.5 : 0) * 0 + ((j % 2) * 0.5 - 0.25);
      out.push({ id: id++, i, j, p: [RUE[0], j * 0.5 + 0.25, zc], s: [1.1, 0.45, 0.94], teinte: COUL.brique[(i * 3 + j * 5) % COUL.brique.length], ta: ev.rue1 + 0.05 + j * 0.115 + Math.abs(i - 1.5) * 0.03, tf: 1e9, v: [0, 0, 0], w: [0, 0, 0], g: 17, reste: true, tl: 0, lacet: (alea(id) - 0.5) * 0.6 });
    }
  }
  return out;
}
const Rue: React.FC<{ zones: ReturnType<typeof construireMursilence>; mini: Brique[]; T: number; frame: number; e: EtatConte; data: DonneesConte }> = ({ zones, mini, T, frame, e, data }) => {
  const ev = data.ev;
  const cam = e.cam.pos;
  const liste = visibles(data, T, cam, 160).filter((v) => lieuDe(v.a.p) === "rue");
  const t: Teinte = [1.15, 1.12, 1.04];
  return (
    <>
      <group position={cam}>
        <Lueur p={[-60, 120, -260]} s={110} c="#FFF6D0" o={0.7} />
      </group>
      <Zone g={zones.rue} t={t} />
      <Briques liste={mini} T={T} tint={[1.1, 1.08, 1.04]} pouls={0} glow={() => 0} />
      {liste.map(({ id, a, d }) => {
        const r = retouche(id, a, T, ev);
        const aa: Acteur = { ...a, ry: r.ry ?? a.ry, pose: r.pose ?? a.pose };
        return (
          <group key={id}>
            <Perso l={{ id, a: aa, objet: r.objet ?? a.objet }} frame={frame} T={T} t={[1.12, 1.1, 1.04]} />
            {d < 60 && <Ombre x={a.p[0]} z={a.p[2]} y={0.2} r={0.8 * a.echelle} o={0.4} etire={1.2} />}
          </group>
        );
      })}
    </>
  );
};
void E_ADAM;
void E_LINA;
void MAMAN_P;
void SH;

// ------------------------------------------------------------------ Le monde
export const MondeMursilence: React.FC<{ e: EtatConte; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const zones = useMemo(() => construireMursilence(), []);
  const ev = data.ev;
  const briques = useMemo(() => genererMur({ v0: ev.v0, vagues: [ev.vA, ev.vB, ev.vC, ev.vD, ev.vE, ev.vF], effondre: ev.effondre, tombe: ev.tombe, zTrou: Z_TROU, secousse: ev.secousse }), [ev]);
  const mini = useMemo(() => genererMiniMur(ev), [ev]);
  const T = frame / 30;
  const lieu = lieuDe(e.cam.pos);
  if (lieu === "chambre") return <Chambre zones={zones} T={T} frame={frame} e={e} data={data} />;
  if (lieu === "rue") return <Rue zones={zones} mini={mini} T={T} frame={frame} e={e} data={data} />;
  return <Salon zones={zones} briques={briques} T={T} frame={frame} e={e} data={data} />;
};
void FEN_E;
