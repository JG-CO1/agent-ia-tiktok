/**
 * « Prénom = argent » — décor dynamique : compteur du compte en banque (HUD collé à la caméra et panneau de la banque), pièces d'or
 * qui volent de la bouche ou du portefeuille de celui qui prononce le prénom jusqu'à Maxime, bulles « MAXIME ! », « + 1 € »,
 * foule du stade (milliers de spectateurs en instances), haut-parleurs qui pulsent, studio « ON AIR », billets, étagères de pain
 * qui se vident, rideaux et panneaux « FERMÉ », portefeuilles vides, poches retournées, yeux en spirale.
 * Seul le lieu où se trouve la caméra est dessiné (lieux à plus de 400 unités les uns des autres).
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Avatar, Bloc, HANCHE, geometrieBloc, type Pose, type Tenue, type Teinte } from "../../avatar";
import { halo, type Emotion } from "../../textures";
import { Faisceau, Lueur, Ombre, Tache, Zone, visibles, type DonneesConte, type EtatConte } from "../lib";
import { entre, lisse, mel } from "../../maths";
import type { Acteur } from "../../ville/foule";
import { poseDebout } from "../../avatar";
import { poseAssise } from "../../avatar";
import {
  texBanniere, texBanque, texBillet, texBulle, texCoque, texCompteur, texEcran, texEnceinte, texEnseigne, texFerme, texOnAir, texPlus, texPortefeuille, texRadio, texSpirale, formatEuros,
} from "./toile";
import { poseAffaisse, poseBalcon, poseChante, poseCrie, poseDJ, poseDonne, poseFauche, poseJoie, poseMontreVide, poseRefuse, poseTransporte, poseTriomphe } from "./poses";
import {
  BANNIERES, BOUL, BOUTIQUES, BANQUE, CHATEAU, ECRAN, ENCEINTES, ETUDE, FANS, LAMPES_RUE, PODIUM, PR, PROP, RUE, RUINE, STADE, TOITS, YACHT, ST, TO,
  construirePrenomargent, gris, localBoutique, positionsPains, ryBoutique,
} from "./monde";
import { ARGENT_FINAL, NB_CITOYENS, T_MAXIME_OR, argent, bouche, tenueCitoyen } from "./histoire";

export const cielPrenomargent = (e?: EtatConte) => e?.ciel ?? "#38A8FF";

type Lieu = "rue" | "ruine" | "stade" | "toits" | "prop";
export const lieuDe = (p: V3): Lieu => (p[2] > 300 ? "ruine" : p[2] < -300 ? "prop" : p[0] < -250 ? "stade" : p[0] > 250 ? "toits" : "rue");
const addV = (o: V3, p: V3): V3 => [o[0] + p[0], o[1] + p[1], o[2] + p[2]];
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const fr = (x: number) => x - Math.floor(x);

const TEINTE_ZONE: Record<string, Teinte> = {
  rue: [1.3, 1.27, 1.15],
  ruine: [1.0, 1.05, 1.18],
  stade: [1.3, 1.27, 1.17],
  toits: [1.25, 1.22, 1.12],
  propV: [1.3, 1.27, 1.15],
  propG: [1.0, 1.06, 1.18],
};
const TEINTE_ACTEUR: Record<string, Teinte> = {
  rue: [1.2, 1.17, 1.08],
  ruine: [1.0, 1.04, 1.14],
  stade: [1.18, 1.15, 1.08],
  toits: [1.18, 1.15, 1.08],
  propV: [1.2, 1.17, 1.08],
  propG: [1.0, 1.04, 1.14],
};

// ------------------------------------------------------------------ Personnage « lite »
export type Lite = {
  id: string;
  p: V3;
  ry: number;
  pose: Pose;
  emotion: Emotion;
  tenue: Tenue;
  echelle: number;
  rx?: number;
  graine?: number;
  sansClin?: boolean;
  /** 0 à 1 : bouche ouverte (chant, cri) */
  bouche?: number;
  /** 0 à 1 : spirales sur les yeux (hypnose) */
  spirale?: number;
  toque?: boolean;
  poche?: boolean;
  portefeuille?: boolean;
  billet?: "100" | "1000";
  /** instant de début de la bulle (« MAXIME ! ») : null = pas de bulle */
  bulle?: number | null;
};

const memoTenue = new Map<string, Tenue>();
function desaturerTenue(id: string, t: Tenue, k: number): Tenue {
  if (k <= 0.01) return t;
  const cle = `${id}|${Math.round(k * 10)}`;
  let r = memoTenue.get(cle);
  if (!r) {
    r = { ...t };
    for (const c of ["peau", "haut", "bas", "chaussures", "cheveux", "bas2", "chapeau", "tablier", "casquette", "echarpe", "bandeau", "sac", "longs", "robe", "manteau", "capuche", "feutre"] as const) {
      const v = t[c];
      if (typeof v === "string") (r as any)[c] = gris(v, Math.round(k * 10) / 10);
    }
    if (memoTenue.size > 3000) memoTenue.clear();
    memoTenue.set(cle, r);
  }
  return r;
}

const Perso: React.FC<{ l: Lite; frame: number; t: Teinte; T: number }> = ({ l, frame, t, T }) => {
  const [lacet, tang] = l.pose.tete ?? [0, 0];
  const b = l.bouche ?? 0;
  const sp = l.spirale ?? 0;
  const gr = Math.min(1, (t[0] + t[1] + t[2]) / 3 + 0.22);
  const encre = useMemo(() => new THREE.Color().setRGB(gr, gr, gr), [gr]);
  return (
    <Avatar p={l.p} ry={l.ry} pose={l.pose} tenue={l.tenue} emotion={l.emotion} frame={frame} graine={l.graine ?? 0} teinte={t} echelle={l.echelle} sansClin={l.sansClin} rx={l.rx ?? 0}
      mainD={l.billet ? <Billet v={l.billet} /> : undefined}>
      {l.poche && (
        <>
          <Bloc p={[0.6, 0.72, 0.1]} s={[0.12, 0.62, 0.42]} c="#F4EEDD" t={t} r={[0, 0, 0.22]} />
          <Bloc p={[-0.6, 0.72, 0.1]} s={[0.12, 0.62, 0.42]} c="#F4EEDD" t={t} r={[0, 0, -0.22]} />
        </>
      )}
      <group position={[0, HANCHE + (l.pose.y ?? 0), 0]} rotation={[l.pose.torse ?? 0, 0, 0]}>
        {l.portefeuille && (
          <group position={[0, 0.58, 0.66]} rotation={[-0.35, 0, 0]}>
            <Bloc p={[0, 0, -0.03]} s={[1.0, 0.74, 0.06]} c="#4A2A12" t={t} />
            <mesh position={[0, 0, 0.011]}>
              <planeGeometry args={[0.96, 0.72]} />
              <meshBasicMaterial map={texPortefeuille()} color={encre} />
            </mesh>
          </group>
        )}
        <group position={[0, 1.0, 0]} rotation={[tang, lacet, 0, "YXZ"]}>
          {b > 0.02 && (
            <group position={[0, 0.2, 0.408]}>
              <mesh renderOrder={3}>
                <planeGeometry args={[0.27, 0.05 + 0.2 * b]} />
                <meshBasicMaterial color="#26080F" />
              </mesh>
              <mesh position={[0, -0.02 - 0.05 * b, 0.002]} renderOrder={4}>
                <planeGeometry args={[0.2, 0.03 + 0.07 * b]} />
                <meshBasicMaterial color="#E0506A" />
              </mesh>
            </group>
          )}
          {sp > 0.02 &&
            [-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.136, 0.4375, 0.41]} rotation={[0, 0, T * 5 * s]} renderOrder={5}>
                <planeGeometry args={[0.215, 0.215]} />
                <meshBasicMaterial map={texSpirale()} color={encre} transparent opacity={sp} depthWrite={false} />
              </mesh>
            ))}
          {l.toque && (
            <>
              <Bloc p={[0, 0.93, 0]} s={[0.9, 0.2, 0.9]} c="#FFFFFF" t={t} />
              <Bloc p={[0, 1.27, 0]} s={[0.8, 0.52, 0.8]} c="#FFFFFF" t={t} />
              <Bloc p={[0, 1.58, 0]} s={[0.92, 0.14, 0.92]} c="#F4F1EA" t={t} />
            </>
          )}
        </group>
      </group>
    </Avatar>
  );
};

/** Billet tenu à la main (l'origine est le bout de la main, y vers le bas) : plan texturé, bien lisible. */
const Billet: React.FC<{ v: "100" | "1000" }> = ({ v }) => {
  const tex = v === "100" ? texBillet("100 €", "#3CC47B", "#0B5A32") : texBillet("1 000 €", "#FFC21A", "#8A5A00");
  return (
    <group position={[0, -0.2, 0.0]} rotation={[0.2, 0, 0]}>
      {v === "1000" && (
        <>
          <Bloc p={[0, 0, -0.1]} s={[1.0, 0.54, 0.16]} c="#FFC21A" brut />
          <Bloc p={[0, 0, -0.2]} s={[1.02, 0.56, 0.1]} c="#E0A612" brut />
        </>
      )}
      <mesh position={[0, 0, 0.0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1.0, 0.5]} />
        <meshBasicMaterial map={tex} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Personnage lointain : quatre blocs. */
const Sil: React.FC<{ l: Lite; t: Teinte }> = ({ l, t }) => {
  const dy = l.pose.y ?? 0;
  return (
    <group position={l.p} rotation={[l.rx ?? 0, l.ry, 0, "YXZ"]} scale={l.echelle}>
      <Bloc p={[0, 0.5, 0]} s={[0.7, 1.0, 0.4]} c={l.tenue.bas} t={t} />
      <Bloc p={[0, 1.45 + dy, 0]} s={[0.92, 1.0, 0.46]} c={l.tenue.haut} t={t} />
      <Bloc p={[0, 2.35 + dy, 0]} s={[0.8, 0.8, 0.8]} c={l.tenue.peau} t={t} />
      <Bloc p={[0, 2.8 + dy, -0.02]} s={[0.88, 0.22, 0.88]} c={l.tenue.cheveux} t={t} />
      {(l.pose.brasG.x < -1.2 || l.pose.brasD.x < -1.2) && <Bloc p={[0, 1.9 + dy, 0.15]} s={[1.4, 0.3, 0.4]} c={l.tenue.haut} t={t} />}
    </group>
  );
};

const Gens: React.FC<{ liste: Lite[]; cam: V3; frame: number; T: number; t: Teinte; nbDetail?: number; ombres?: boolean; opaciteOmbre?: number }> = ({ liste, cam, frame, T, t, nbDetail = 18, ombres = true, opaciteOmbre = 0.5 }) => {
  const tri = liste.map((l) => ({ l, d: dist(l.p, cam) })).sort((a, b) => a.d - b.d);
  return (
    <>
      {tri.map(({ l, d }, i) => (
        <group key={l.id}>
          {i < nbDetail ? <Perso l={l} frame={frame} t={t} T={T} /> : <Sil l={l} t={t} />}
          {ombres && d < 80 && (l.rx ?? 0) === 0 && <Ombre x={l.p[0]} z={l.p[2]} y={l.p[1] + 0.09} r={0.75 * l.echelle} o={opaciteOmbre} etire={1.25} />}
          {l.bulle !== null && l.bulle !== undefined && d < 70 && <Bulle p={[l.p[0], l.p[1] + 3.3 * l.echelle, l.p[2]]} age={T - l.bulle} s={l.echelle} />}
        </group>
      ))}
    </>
  );
};

// ------------------------------------------------------------------ Sprites : bulles, « + 1 € », halos
const Bulle: React.FC<{ p: V3; age: number; s?: number; texte?: string; grand?: number }> = ({ p, age, s = 1, texte = "MAXIME !", grand = 1 }) => {
  const k = Math.min(1, Math.max(0.05, age / 0.12));
  const pop = 0.7 + 0.3 * k + (age < 0.2 ? 0.08 : 0);
  const e = s * grand * pop;
  return (
    <sprite position={[p[0], p[1] + 0.7 * e, p[2]]} scale={[2.5 * e, 1.25 * e, 1]} renderOrder={6}>
      <spriteMaterial map={texBulle(texte)} transparent depthWrite={false} fog={false} />
    </sprite>
  );
};
const Plus: React.FC<{ p: V3; age: number; texte?: string; grand?: number; cam?: V3 }> = ({ p, age, texte = "+1 €", grand: g0 = 1, cam }) => {
  if (age < 0 || age > 1.1) return null;
  const grand = g0 * (cam ? Math.min(1, Math.max(0.3, dist(p, cam) / 8)) : 1);
  const k = age / 1.1;
  const e = (0.6 + 0.6 * Math.min(1, age / 0.14) + 0.1 * Math.sin(age * 9)) * grand;
  return (
    <sprite position={[p[0], p[1] + 0.9 * lisse(k) * grand, p[2]]} scale={[1.7 * e, 0.85 * e, 1]} renderOrder={7}>
      <spriteMaterial map={texPlus(texte)} transparent opacity={1 - Math.pow(k, 3)} depthWrite={false} fog={false} />
    </sprite>
  );
};
const Phare: React.FC<{ p: V3; s: number; c: string; o: number }> = ({ p, s, c, o }) => (
  <sprite position={p} scale={[s, s, 1]} renderOrder={5}>
    <spriteMaterial map={halo()} color={c} transparent opacity={o} depthWrite={false} fog={false} />
  </sprite>
);
const Plan: React.FC<{ p: V3; w: number; h: number; tex: THREE.Texture; ry?: number; o?: number; rx?: number; fog?: boolean; alpha?: boolean }> = ({ p, w, h, tex, ry = 0, o = 1, rx = 0, fog = true, alpha = false }) => (
  <mesh position={p} rotation={[rx, ry, 0, "YXZ"]} renderOrder={2}>
    <planeGeometry args={[w, h]} />
    <meshBasicMaterial map={tex} transparent={o < 1 || alpha} opacity={o} toneMapped={false} fog={fog} depthWrite={!alpha} />
  </mesh>
);

// ------------------------------------------------------------------ Pièces d'or (instances) : la trajectoire de chaque pièce est visible
type Piece = { p: V3; s: number; spin: number };
const MAX_PIECES = 520;
const GEO_PIECE = new THREE.CylinderGeometry(0.5, 0.5, 0.16, 14).rotateX(Math.PI / 2);
const GEO_PIECE2 = new THREE.CylinderGeometry(0.34, 0.34, 0.2, 12).rotateX(Math.PI / 2);
const MAT_PIECE = new THREE.MeshBasicMaterial({ color: "#D99A00", fog: false });
const MAT_PIECE2 = new THREE.MeshBasicMaterial({ color: "#FFC81A", fog: false });
const Pieces: React.FC<{ liste: Piece[]; cam: V3 }> = ({ liste: toutes, cam }) => {
  const liste = toutes.filter((q) => dist(q.p, cam) > 2.4).map((q) => ({ ...q, s: q.s * Math.min(1, 0.42 + dist(q.p, cam) / 12) }));
  const a = useRef<THREE.InstancedMesh>(null);
  const b = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    d.rotation.order = "YXZ";
    const n = Math.min(MAX_PIECES, liste.length);
    for (let i = 0; i < n; i++) {
      const q = liste[i];
      d.position.set(q.p[0], q.p[1], q.p[2]);
      d.rotation.set(0.35, q.spin, 0);
      d.scale.setScalar(q.s);
      d.updateMatrix();
      a.current?.setMatrixAt(i, d.matrix);
      b.current?.setMatrixAt(i, d.matrix);
    }
    for (const m of [a.current, b.current]) {
      if (!m) continue;
      m.count = n;
      m.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <>
      <instancedMesh ref={a} args={[GEO_PIECE, MAT_PIECE, MAX_PIECES]} frustumCulled={false} renderOrder={3} />
      <instancedMesh ref={b} args={[GEO_PIECE2, MAT_PIECE2, MAX_PIECES]} frustumCulled={false} renderOrder={3} />
    </>
  );
};
/** Une pièce sur une trajectoire en arc entre deux points. */
function vol(a: V3, b: V3, t0: number, dur: number, T: number, arc: number, s = 1): Piece | null {
  const u = (T - t0) / dur;
  if (u < 0 || u > 1) return null;
  const e = u * u * (3 - 2 * u) * 0.35 + u * 0.65;
  return { p: [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e + arc * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * e], s: s * (0.7 + 0.5 * Math.sin(Math.PI * Math.min(1, u * 1.4))), spin: (T - t0) * 15 + t0 * 7 };
}

// ------------------------------------------------------------------ Compteur collé à la caméra (HUD) : en haut de l'écran
const Hud: React.FC<{ cam: { pos: V3; look: V3; fov: number }; texte: string; fige: boolean; o?: number }> = ({ cam, texte, fige, o = 1 }) => {
  const pos = new THREE.Vector3(...cam.pos);
  const look = new THREE.Vector3(...cam.look);
  const m = new THREE.Matrix4().lookAt(pos, look, new THREE.Vector3(0, 1, 0));
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  const f = look.clone().sub(pos).normalize();
  const d = 1.6;
  const Hv = 2 * d * Math.tan((cam.fov * Math.PI) / 360);
  const Wv = (Hv * 9) / 16;
  const w = Wv * 0.9;
  const h = w / 5.12;
  const c = pos.clone().add(f.multiplyScalar(d));
  return (
    <group position={[c.x, c.y, c.z]} quaternion={q}>
      <mesh position={[0, (0.5 - 0.075) * Hv, 0]} renderOrder={1000}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texCompteur(texte, fige)} transparent opacity={o} depthTest={false} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ Foule du stade (instances : torse, tête, cheveux, bras)
const COLS_FAN = ["#E4208C", "#FFC21A", "#0FB36B", "#C4122F", "#6B2BD9", "#FF7A1A", "#1E88E5", "#F4F1EA", "#11A98E", "#FF5CA8"];
const PEAUX = ["#E6B98F", "#D9AE8B", "#C98F66", "#F1C9A0", "#A66B45"];
const CHEVS = ["#16161A", "#3A2A1E", "#D8B25A", "#7A4E2D", "#9A9A9A", "#D4561C"];
const FoulePlein: React.FC<{ T: number; ampl: number; exclus: Set<number>; t: Teinte; tous?: boolean }> = ({ T, ampl, exclus, t, tous = true }) => {
  const N = FANS.length;
  const geo = useMemo(() => geometrieBloc(), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, color: "#FFFFFF" }), []);
  const rTorse = useRef<THREE.InstancedMesh>(null);
  const rTete = useRef<THREE.InstancedMesh>(null);
  const rCheveux = useRef<THREE.InstancedMesh>(null);
  const rBras = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const c = new THREE.Color();
    const col = (hex: string) => {
      c.set(hex);
      c.setRGB(c.r * t[0], c.g * t[1], c.b * t[2]);
      return c;
    };
    for (let k = 0; k < N; k++) {
      rTorse.current?.setColorAt(k, col(COLS_FAN[(k * 7) % COLS_FAN.length]));
      rTete.current?.setColorAt(k, col(PEAUX[(k * 3) % PEAUX.length]));
      rCheveux.current?.setColorAt(k, col(CHEVS[(k * 5) % CHEVS.length]));
      rBras.current?.setColorAt(2 * k, col(COLS_FAN[(k * 7) % COLS_FAN.length]));
      rBras.current?.setColorAt(2 * k + 1, col(COLS_FAN[(k * 7) % COLS_FAN.length]));
    }
    for (const m of [rTorse.current, rTete.current, rCheveux.current, rBras.current]) if (m?.instanceColor) m.instanceColor.needsUpdate = true;
  }, [t[0], t[1], t[2], N]);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    d.rotation.order = "YXZ";
    const put = (m: THREE.InstancedMesh | null, i: number, f: { p: V3; ry: number }, lx: number, ly: number, lz: number, sx: number, sy: number, sz: number, rx = 0, vis = true) => {
      if (!m) return;
      const co = Math.cos(f.ry);
      const si = Math.sin(f.ry);
      d.position.set(STADE[0] + f.p[0] + lx * co + lz * si, f.p[1] + ly, STADE[2] + f.p[2] - lx * si + lz * co);
      d.rotation.set(rx, f.ry, 0);
      d.scale.set(vis ? sx : 0, vis ? sy : 0, vis ? sz : 0);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    };
    for (let k = 0; k < N; k++) {
      const f = FANS[k];
      const vis = tous && !exclus.has(k);
      const s = Math.sin(T * 5.2 + k * 0.37);
      const bond = ampl * 0.22 * Math.abs(s);
      put(rTorse.current, k, f, 0, 0.8 + bond, 0, 0.9, 1.4, 0.55, 0, vis);
      put(rTete.current, k, f, 0, 1.93 + bond, 0, 0.82, 0.82, 0.82, 0, vis);
      put(rCheveux.current, k, f, 0, 2.38 + bond, -0.02, 0.9, 0.22, 0.9, 0, vis);
      for (const side of [-1, 1]) {
        const th = -(0.12 + ampl * (2.45 + 0.35 * s * side));
        put(rBras.current, 2 * k + (side > 0 ? 1 : 0), f, side * 0.62, 1.3 + bond - 0.55 * Math.cos(th), -0.55 * Math.sin(th), 0.28, 1.1, 0.28, th, vis);
      }
    }
    for (const m of [rTorse.current, rTete.current, rCheveux.current, rBras.current]) if (m) m.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={rTorse} args={[geo, mat, N]} frustumCulled={false} />
      <instancedMesh ref={rTete} args={[geo, mat, N]} frustumCulled={false} />
      <instancedMesh ref={rCheveux} args={[geo, mat, N]} frustumCulled={false} />
      <instancedMesh ref={rBras} args={[geo, mat, 2 * N]} frustumCulled={false} />
    </>
  );
};

// ------------------------------------------------------------------ Cycles de chant : chacun crie « MAXIME ! » à son rythme
const PERIODE = 1.3;
/** État du cycle de l'individu i à l'instant T : numéro de cri, temps écoulé depuis le début du cri. */
function cycle(T: number, i: number, t0: number, periode = PERIODE) {
  const ph = fr(i * 0.6180339) * periode;
  const k = Math.floor((T - t0 - ph) / periode);
  return { k, tl: T - t0 - ph - k * periode, debut: t0 + ph + k * periode };
}
const ouverture = (tl: number) => (tl < 0 ? 0.1 : tl < 0.55 ? 0.55 + 0.45 * Math.pow(Math.sin(tl * 33), 2) : 0.1);

// ------------------------------------------------------------------ Le monde
type EtatPA = EtatConte & { hud?: number };
export const MondePrenomargent: React.FC<{ e: EtatPA; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const zones = useMemo(() => construirePrenomargent(), []);
  const T = frame / 30;
  const cam = e.cam.pos;
  const lieu = lieuDe(cam);
  const ev = data.ev as Record<string, any>;
  const grisPaysage = T >= ev.ruine;
  const clePal = lieu === "prop" ? (grisPaysage ? "propG" : "propV") : lieu;
  const tz = TEINTE_ZONE[clePal];
  const ta = TEINTE_ACTEUR[clePal];
  const montant = argent(T, ev);
  const fige = T >= ev.fige;
  const texteHud = formatEuros(montant);
  const desat = lisse(entre(T, ev.ruine - 0.1, ev.plat + 1.5)) * 0.55 + lisse(entre(T, ev.stop - 4.5, ev.stop)) * 0.3;

  // ---------------------------------------------------------------- personnages
  const accesActeur = (id: string): Acteur | null => data.acteur(id, T);
  const pMax = (): V3 => {
    const a = accesActeur(T < 11.3 ? "max" : lieu === "ruine" ? "maxRuine" : "maxMatin");
    return a ? addV(a.p, [0, 2.1, 0]) : addV(RUE, [0, 2.1, 15]);
  };
  const lites: Lite[] = [];
  const liste = visibles(data, T, cam, 160);
  for (const { id, a } of liste) {
    const l = pnj(id, a, T, ev, desat);
    if (l) lites.push(l);
  }

  const pieces: Piece[] = [];
  const plusSprites: React.ReactNode[] = [];
  const bulles: React.ReactNode[] = [];

  // =================================================================== RUE / RUINE
  if (lieu === "rue" || lieu === "ruine") {
    const ruine = lieu === "ruine";
    const dec: V3 = ruine ? RUINE : RUE;
    const sink = ruine ? (accesActeur("maxRuine") ? addV(accesActeur("maxRuine")!.p, [0, 2.2, 0]) : addV(RUINE, [9.6, 2.2, 22.6])) : T < 11.3 ? pMax() : T < 26.2 ? addV(PODIUM, [0, 3.8, 0]) : (() => {
      const m = accesActeur("maxMatin");
      return m ? addV(m.p, [0, 2.2, 0]) : addV(PODIUM, [0, 3.8, 0]);
    })();
    // --- pièces des cris de la scène 1 et 2 (copains)
    if (!ruine) {
      const cops = ["cop1", "cop3", "cop2", "cop1"];
      (ev.crisS1 as number[]).forEach((t0, i) => {
        const a = accesActeur(cops[i]);
        if (!a) return;
        const p = vol(bouche(a.p, a.ry, a.echelle), pMax(), t0 + 0.06, 0.56, T, 2.2, 1.0);
        if (p) pieces.push(p);
        const arr = ev.arrivees[i] as number;
        plusSprites.push(<Plus key={`p${i}`} p={addV(pMax(), [0, 1.0, 0])} age={T - arr} grand={i === 3 ? 1.3 : 1} cam={cam} />);
        bulles.push(T - t0 >= 0 && T - t0 < 0.7 ? <Bulle key={`b1${i}`} p={addV(a.p, [0, 3.25 * a.echelle, 0])} age={T - t0} s={a.echelle} /> : null);
      });
      (ev.crisS2 as number[]).forEach((t0, i) => {
        if (T > 11.4) return;
        const id = ["cop1", "cop2", "cop3"][i % 3];
        const a = accesActeur(id);
        if (!a) return;
        for (let j = 0; j < 3; j++) {
          const p = vol(bouche(a.p, a.ry, a.echelle), pMax(), t0 + 0.06 + j * 0.09, 0.5, T, 1.8 + j * 0.5, 0.95);
          if (p) pieces.push(p);
        }
        if (T - t0 >= 0 && T - t0 < 0.6) bulles.push(<Bulle key={`b2${i}`} p={addV(a.p, [0, 3.25 * a.echelle, 0])} age={T - t0} s={a.echelle} />);
      });
    }
    // --- pièces des citoyens qui chantent (jour : vers le podium puis vers Maxime ; ruine : vers Maxime)
    const t0c = ruine ? ev.ruine - 0.6 : ev.chanteRue;
    const actif = ruine ? T < ev.stop + 0.1 : T >= ev.chanteRue && T < ev.ruine;
    if (actif) {
      let nb = 0;
      for (const { id, a } of liste) {
        if (!(id.startsWith(ruine ? "r" : "v") && /\d$/.test(id) && id !== "rue")) continue;
        const i = parseInt(id.slice(1), 10);
        if (Number.isNaN(i)) continue;
        if (ruine && T >= ev.stop) continue;
        for (const dk of [0, -1]) {
          const c = cycle(T, i, t0c);
          const tl = c.tl + 0.0;
          const t1 = c.debut + dk * PERIODE;
          const dd = dist(a.p, sink);
          const dur = Math.min(1.9, 0.55 + dd / 38);
          const depart = ruine && T >= ev.plat ? addV(a.p, [0, 1.9 * a.echelle, 0.5 * a.echelle]) : bouche(a.p, a.ry, a.echelle);
          void tl;
          const p = vol(depart, sink, t1 + 0.08, dur, T, 3 + (i % 5), ruine ? 1.0 : 0.95);
          if (p && nb < 230) {
            pieces.push(p);
            nb++;
          }
        }
        if (dist(a.p, cam) < 60 && lites.find((l) => l.id === id) && nb < 230) {
          const c = cycle(T, i, t0c);
          if (c.tl >= 0 && c.tl < 0.6 && ((ruine && T < ev.stop) || !ruine)) bulles.push(<Bulle key={`bb${id}`} p={addV(a.p, [0, 3.25 * a.echelle, 0])} age={c.tl} s={a.echelle * 0.95} />);
        }
      }
    }
    // --- explosion de pièces sur la façade de la banque (« explosait »)
    if (!ruine && T >= ev.explose && T < ev.explose + 1.8) {
      const o: V3 = [-10.4, 12.6, 1];
      for (let i = 0; i < 90; i++) {
        const u = Math.sin(i * 12.9898) * 43758.5453;
        const g = u - Math.floor(u);
        const v = Math.sin(i * 78.233) * 12345.6789;
        const h = v - Math.floor(v);
        const w = Math.sin(i * 39.346) * 24634.6345;
        const q = w - Math.floor(w);
        const t = T - ev.explose - h * 0.12;
        if (t < 0) continue;
        const vx = 6 + g * 14;
        const vy = 6 + q * 12;
        const vz = (h - 0.5) * 22;
        pieces.push({ p: [o[0] + vx * t, o[1] + vy * t - 9 * t * t, o[2] + vz * t], s: 0.8 + 0.5 * g, spin: t * 14 + i });
      }
    }
    // --- pièce qui roule sur la chaussée vide (dernière image)
    if (ruine && T >= ev.fige + 0.2) {
      const t = T - (ev.fige + 0.2);
      const x = 1.4 - 0.12 * Math.min(t, 3);
      const z = 600 + 10.2 - 0.08 * Math.min(t, 3);
      pieces.push({ p: [x, 0.8 + 0.03 * Math.sin(t * 9), z], s: 1.2, spin: t * 3.2 });
      void sink;
    }

    // --- étagères de pain (jour)
    const pains = !ruine ? positionsPains() : [];
    const plein = T < ev.pain0;
    const reste = T < ev.rien;

    const lamps = LAMPES_RUE.filter((p) => Math.hypot(p[0] - cam[0], p[2] - (cam[2] - dec[2])) < 110);
    void lamps;
    return (
      <>
        <group position={cam}>{ruine ? <Phare p={[-60, 120, -300]} s={90} c="#D9DEE6" o={0.5} /> : <Phare p={[-70, 150, -300]} s={160} c="#FFF6C8" o={0.9} />}</group>
        <group position={dec}>
          <Zone g={ruine ? zones.ruine : zones.rue} t={tz} />
          {BOUTIQUES.map((b, i) => (
            <group key={i} position={[b.x, 0, b.z]} rotation={[0, ryBoutique(b), 0]}>
              <Plan p={[0, 5.35, 0.42]} w={(b.w ?? 14) - 1.3} h={1.32} tex={texEnseigne(b.nom, ruine ? "#2B2E36" : "#17131F", ruine ? "#9AA0AA" : b.accent === "#2B1A10" || b.accent === "#17131F" ? "#FFE9B0" : b.accent === "#FFFFFF" ? "#FFFFFF" : b.accent, 1024, 192, ruine ? "#8A8F99" : "#FFFFFF")} />
              {ruine && (
                <Plan p={[b.special === "banque" ? 6.6 : b.special === "boulangerie" ? 0 : 4.6, b.special === "boulangerie" ? 3.0 : 2.1, 0.5]} w={b.special === "boulangerie" ? 3.2 : 1.7} h={b.special === "boulangerie" ? 1.6 : 0.85} tex={texFerme()} />
              )}
            </group>
          ))}
          {/* panneau de la banque : le compte de Maxime en grand */}
          <group position={[BANQUE.x, 0, BANQUE.z]} rotation={[0, ryBoutique(BANQUE), 0]}>
            <Plan p={[0, 9.3, 0.5]} w={16.4} h={3.2} tex={texCompteur(texteHud, fige)} />
            <Plan p={[0, 12.1, 0.5]} w={9} h={1.6} tex={texBanque()} />
          </group>
          {/* pain sur les étagères et le comptoir */}
          {!ruine &&
            pains.map(({ p, k }) => {
              const visible = plein || (reste && k < 3);
              if (!visible) return null;
              return k % 2 ? (
                <Bloc key={k} p={p} s={[0.45, 0.36, 0.9]} c={k % 3 ? "#E0A24E" : "#C98A38"} t={tz} r={[0, ryBoutique(BOUL), 0]} />
              ) : (
                <Bloc key={k} p={p} s={[1.1, 0.26, 0.3]} c="#E9B36A" t={tz} r={[0, ryBoutique(BOUL) + 0.15 * (k % 3), 0]} />
              );
            })}
          {!ruine &&
            plein &&
            [-3.9, -2.2, -0.5, 1.2, 2.9].map((x, i) => <Bloc key={`c${i}`} p={localBoutique(BOUL, [x, 1.95, -3.4])} s={[0.7, 0.28, 0.5]} c={i % 2 ? "#D9852E" : "#F2C26A"} t={tz} />)}
          {ruine && lieu === "ruine" && <Tache p={[0, 0.3, 20]} s={[40, 90]} c="#8A93A0" o={0.1} />}
        </group>
        {bulles}
        {plusSprites}
        <Pieces liste={pieces} cam={cam} />
        {!ruine && T >= ev.explose && T < ev.explose + 0.35 && <Lueur p={addV(BANQUE.x ? [BANQUE.x + 1.5, 12.2, BANQUE.z] : [0, 0, 0], [0, 0, 0])} s={16} c="#FFE27A" o={0.6 * (1 - (T - ev.explose) / 0.35)} />}
        <Gens liste={lites} cam={cam} frame={frame} T={T} t={ta} nbDetail={26} ombres opaciteOmbre={ruine ? 0.3 : 0.55} />
        {e.hud !== 0 && <Hud cam={e.cam} texte={texteHud} fige={fige} />}
      </>
    );
  }

  // =================================================================== STADE
  if (lieu === "stade") {
    const chant = lisse(entre(T, ev.chanteStade - 0.1, ev.chanteStade + 0.5));
    // pièces : une pluie dense des gradins vers la scène
    const cible = addV(STADE, [0, 4.0, 0]);
    if (T >= ev.chanteStade - 0.2 && T < ev.chanteStade + 7) {
      for (let j = 0; j < FANS.length; j += 6) {
        const f = FANS[j];
        const per = 1.4 + (j % 3) * 0.12;
        const ph = fr(j * 0.754) * per;
        const u0 = T - (ev.chanteStade - 0.2) - ph;
        if (u0 < 0) continue;
        const t0 = T - (u0 % per);
        const dd = Math.hypot(f.p[0], f.p[2]);
        const p = vol(addV(STADE, [f.p[0], f.p[1] + 2.4, f.p[2]]), cible, t0, per * 0.96, T, 4 + dd * 0.1, 2.0);
        if (p) pieces.push(p);
      }
    }
    // spectateurs proches en détail, les autres en instances
    const proches = T < ev.chanteStade - 0.2 ? [] : FANS.map((f, k) => ({ k, d: dist(addV(STADE, f.p), cam) })).filter((x) => x.d < 34).sort((a, b) => a.d - b.d).slice(0, 22);
    const exclus = new Set(proches.map((x) => x.k));
    proches.forEach(({ k }) => {
      const f = FANS[k];
      const c = cycle(T, k, ev.chanteStade);
      const tenue = tenueFan(k);
      lites.push({ id: `f${k}`, p: addV(STADE, f.p), ry: f.ry, pose: chant > 0.5 ? poseChante(T, k) : poseDebout(T, k), emotion: chant > 0.5 ? "sourire" : "neutre", tenue, echelle: 0.8, graine: k, sansClin: true, bouche: chant > 0.5 ? ouverture(c.tl) : 0, bulle: chant > 0.5 && c.tl >= 0 && c.tl < 0.6 && k % 2 === 0 ? c.debut : null });
    });
    const flashs: React.ReactNode[] = [];
    for (let i = 0; i < 40; i++) {
      const f = FANS[(i * 53) % Math.min(FANS.length, 700)];
      const pp = addV(STADE, [f.p[0], f.p[1] + 2.6, f.p[2]]);
      const per = 0.7 + fr(i * 0.37) * 0.9;
      const u = fr(T / per + i * 0.173);
      if (u < 0.09 && dist(pp, cam) < 170) flashs.push(<Lueur key={i} p={pp} s={7 + (i % 3) * 2} c="#FFFFFF" o={0.95 * (1 - u / 0.09)} />);
    }
    return (
      <>
        <group position={cam}>
          <Phare p={[-60, 160, -300]} s={150} c="#FFF6C8" o={0.9} />
        </group>
        <group position={STADE}>
          <Zone g={zones.stade} t={tz} />
        </group>
        <group position={STADE}>
          <Plan p={ECRAN.p} w={ECRAN.w} h={ECRAN.h} tex={texEcran("MAXIME", "+1 €  +1 €  +1 €")} fog={false} />
          <Lueur p={[0, ECRAN.p[1], ECRAN.p[2] + 6]} s={46} c="#FF9AD0" o={0.22} />
          {BANNIERES.map((b, i) => (
            <Plan key={i} p={b.p} w={b.w} h={b.h} ry={b.ry} tex={texBanniere("MAXIME", b.fond, b.encre)} />
          ))}
          {[[-60, -78], [60, -78], [-60, 78], [60, 78]].map(([x, z], i) => (
            <Lueur key={i} p={[x, 46, z]} s={30} c="#FFFFFF" o={0.5} />
          ))}
          <Lueur p={[0, 6, 0]} s={22} c="#FFE27A" o={0.35} />
        </group>
        <FoulePlein T={T} ampl={chant} exclus={exclus} t={ta} tous={T >= ev.chanteStade - 0.2} />
        <Pieces liste={pieces} cam={cam} />
        {flashs}
        <Gens liste={lites} cam={cam} frame={frame} T={T} t={ta} nbDetail={26} ombres opaciteOmbre={0.45} />
        {e.hud !== 0 && <Hud cam={e.cam} texte={texteHud} fige={fige} />}
      </>
    );
  }

  // =================================================================== TOITS
  if (lieu === "toits") {
    const on = T >= ev.hpOn;
    const onAir = T >= ev.onAir;
    const enc = ENCEINTES.filter((x) => dist(addV(TOITS, x.p), cam) < 130);
    const rings: React.ReactNode[] = [];
    const notes: React.ReactNode[] = [];
    enc.forEach((x, i) => {
      const pulse = on ? 1 + 0.09 * Math.exp(-((T * 2.2 + i * 0.13) % 1) * 7) : 1;
      const ph = on ? fr(T * 1.1 + i * 0.31) : 2;
      for (const o of [0, 0.5]) {
        const u = fr(ph + o);
        if (!on) continue;
        const r = 1.8 + u * 9;
        rings.push(
          <mesh key={`r${i}${o}`} position={addV(TOITS, [x.p[0] + Math.sin(x.ry) * 1.2, x.p[1] + 0.6, x.p[2] + Math.cos(x.ry) * 1.2])} rotation={[0, x.ry, 0]} renderOrder={4}>
            <ringGeometry args={[r - 0.55, r, 36]} />
            <meshBasicMaterial color="#FFD23F" transparent opacity={0.8 * (1 - u)} depthWrite={false} side={THREE.DoubleSide} fog={false} />
          </mesh>,
        );
      }
      if (on && i % 4 === 0) {
        const u = fr(T * 0.9 + i * 0.27);
        notes.push(<Bulle key={`n${i}`} p={addV(TOITS, [x.p[0] + Math.sin(x.ry) * (3 + 10 * u), x.p[1] + 1.5 + 6 * u, x.p[2] + Math.cos(x.ry) * (3 + 10 * u)])} age={0.2} s={3.2 * (1 - 0.4 * u)} />);
      }
      void pulse;
    });
    const dj = lites.find((l) => l.id === "dj");
    return (
      <>
        <group position={cam}>
          <Phare p={[-60, 150, -300]} s={150} c="#FFF6C8" o={0.9} />
        </group>
        <group position={TOITS}>
          <Zone g={zones.toits} t={tz} />
          <mesh geometry={zones.toitsVerre} renderOrder={6}>
            <meshBasicMaterial vertexColors transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} color={new THREE.Color().setRGB(tz[0], tz[1], tz[2])} />
          </mesh>
        </group>
        <group position={TOITS}>
          {ENCEINTES.map((x, i) => {
            if (dist(addV(TOITS, x.p), cam) > 130) return null;
            const pulse = on ? 1 + 0.09 * Math.exp(-((T * 2.2 + i * 0.13) % 1) * 7) : 1;
            return (
              <group key={i} position={x.p} rotation={[0, x.ry, 0]}>
                <Plan p={[0, 0.6 * x.s, 0.76 * x.s]} w={3.1 * x.s * pulse} h={3.1 * x.s * pulse} tex={texEnceinte()} />
              </group>
            );
          })}
          <Plan p={[0, ETUDE.roof + 1.15 + 6.3, ETUDE.d / 2 + 0.6]} w={4.2} h={1.6} tex={texOnAir(onAir)} fog={false} />
          <Plan p={[0, ETUDE.roof + 1.15 + 8.4, ETUDE.d / 2 + 0.6]} w={11} h={2.2} tex={texRadio()} fog={false} />
          {onAir && <Lueur p={[0, ETUDE.roof + 1.15 + 6.3, ETUDE.d / 2 + 1.5]} s={9} c="#FF3B4E" o={0.55} />}
          <Lueur p={[0, ETUDE.roof + 1.15 + 4.2, 0]} s={18} c="#FF7AD0" o={0.18} />
        </group>
        {rings}
        {notes}
        <Gens liste={lites} cam={cam} frame={frame} T={T} t={ta} nbDetail={6} ombres={false} />
        {dj && null}
        {e.hud !== 0 && <Hud cam={e.cam} texte={texteHud} fige={fige} />}
      </>
    );
  }

  // =================================================================== PROPRIÉTÉ
  const vive = !grisPaysage;
  const scintille: React.ReactNode[] = [];
  if (vive) {
    for (let i = 0; i < 26; i++) {
      const u = fr(T * 0.8 + i * 0.381);
      if (u < 0.2) scintille.push(<Lueur key={`s${i}`} p={addV(PROP, [-28 + ((i * 7) % 56), 6 + ((i * 11) % 28), CHATEAU.z + 0.6])} s={3.2} c="#FFFFFF" o={0.9 * (1 - u / 0.2)} />);
    }
    for (let i = 0; i < 24; i++) {
      const u = fr(T * 0.7 + i * 0.263);
      if (u < 0.25) scintille.push(<Lueur key={`m${i}`} p={addV(PROP, [110 + ((i * 29) % 160), 0.8, -60 + ((i * 47) % 220)])} s={2.4} c="#FFFFFF" o={0.9 * (1 - u / 0.25)} />);
    }
  }
  return (
    <>
      <group position={cam}>
        {vive ? <Phare p={[-70, 150, -300]} s={160} c="#FFF6C8" o={0.9} /> : <Phare p={[-60, 120, -300]} s={90} c="#D9DEE6" o={0.5} />}
      </group>
      <group position={PROP}>
        <Zone g={vive ? zones.propVive : zones.propGrise} t={tz} />
      </group>
      <group position={PROP}>
        <Plan p={[YACHT[0] - 5.2, 1.9, YACHT[2]]} w={13} h={2.0} ry={-Math.PI / 2} tex={texCoque()} alpha />
        <Lueur p={[0, 9, CHATEAU.z + 4]} s={32} c="#FFE27A" o={vive ? 0.25 : 0.4} />
        <Lueur p={[0, 14, CHATEAU.z + 8]} s={22} c="#FFD23F" o={vive ? 0.15 : 0.35} />
      </group>
      {scintille}
      <Gens liste={lites} cam={cam} frame={frame} T={T} t={ta} nbDetail={8} ombres opaciteOmbre={0.45} />
      {e.hud !== 0 && <Hud cam={e.cam} texte={texteHud} fige={fige} />}
    </>
  );
};

// ------------------------------------------------------------------ Scénario des personnages : pose, émotion, bouche, accessoires selon l'instant
function tenueFan(k: number): Tenue {
  return { genre: "figurant", peau: PEAUX[(k * 3) % PEAUX.length], haut: COLS_FAN[(k * 7) % COLS_FAN.length], bas: "#2B3A55", chaussures: "#F4F4F0", cheveux: CHEVS[(k * 5) % CHEVS.length] };
}
const TENUE_BALCON_NU: Tenue = { ...T_MAXIME_OR, lunettes: undefined };

/** Transforme un habitant en personnage à dessiner (ou null s'il est caché à cet instant). */
function pnj(id: string, a: Acteur, T: number, ev: Record<string, any>, desat: number): Lite | null {
  const base: Lite = { id, p: a.p, ry: a.ry, pose: a.pose, emotion: a.emotion, tenue: a.tenue, echelle: a.echelle, rx: a.rx, graine: a.graine, sansClin: a.sansClin };
  const arr = ev.arrivees as number[];
  // ----- Maxime (sweat vert) : rue, scènes 1 et 2
  if (id === "max") {
    if (T > ev.riche + 0.05) return null;
    const dernierArr = arr.filter((t) => T >= t).length;
    const vientDarriver = arr.some((t) => T >= t && T < t + 0.9);
    const fauche = T >= 5.35 && T < 7.35;
    const donne = T >= ev.noteA - 0.3 && T < ev.noteB + 1.0;
    let pose: Pose = poseDebout(T, 0.3);
    let emotion: Emotion = "neutre";
    if (T < arr[0]) emotion = "curieux";
    else if (vientDarriver) {
      emotion = T < arr[0] + 0.7 ? "surpris" : "sourire";
      pose = poseJoie(T, 0.2);
    } else if (dernierArr > 0 && T < 5.35) {
      emotion = "sourire";
      pose = poseJoie(T, 0.2);
    }
    if (fauche) {
      emotion = "triste";
      pose = poseFauche(T);
    }
    if (T >= 7.35) {
      emotion = "sourire";
      pose = poseDebout(T, 0.3);
    }
    if (donne) {
      pose = poseDonne(lisse(entre(T, ev.noteA - 0.3, ev.noteA + 0.2)));
      emotion = "sourire";
    }
    return { ...base, pose, emotion, poche: T >= 5.0 && T < 8.0, billet: donne ? (T < ev.noteB ? "100" : "1000") : undefined };
  }
  // ----- copains : crient « Maxime ! »
  if (id === "cop1" || id === "cop2" || id === "cop3") {
    if (T > ev.riche + 0.05) return null;
    const cops = ["cop1", "cop3", "cop2", "cop1"];
    const mes: number[] = [];
    (ev.crisS1 as number[]).forEach((t, i) => cops[i] === id && mes.push(t));
    (ev.crisS2 as number[]).forEach((t, i) => ["cop1", "cop2", "cop3"][i % 3] === id && mes.push(t));
    let tl = -1;
    for (const t of mes) if (T >= t && T < t + 0.6) tl = T - t;
    if (tl >= 0) return { ...base, pose: poseCrie(T, base.graine), emotion: "sourire", bouche: ouverture(tl) };
    // en dehors de ses cris, il sourit et tape des mains
    return { ...base, pose: poseJoie(T, base.graine), emotion: "sourire", bouche: 0 };
  }
  // ----- passants
  if (id.startsWith("pass")) return T > 16.5 ? null : { ...base, emotion: "neutre" };
  // ----- Maxime doré
  if (id === "maxPod") {
    if (T < 17.5 || T > ev.explose + 1.5) return null;
    return { ...base, pose: poseTriomphe(T), emotion: T >= ev.explose - 0.8 ? "surpris" : "sourire" };
  }
  if (id === "maxStade") {
    if (T < 10.9 || T > 14.6) return null;
    return { ...base, pose: poseTriomphe(T), emotion: "sourire", ry: Math.PI * 0 };
  }
  if (id === "dj") {
    if (T < 14.4 || T > 20) return null;
    const c = cycle(T, 3, ev.onAir, 1.0);
    const chante = T >= ev.onAir;
    const pose = poseDJ(T);
    return { ...base, pose, p: [a.p[0], a.p[1] - 0.12, a.p[2]], emotion: chante ? "sourire" : "neutre", bouche: chante ? ouverture(c.tl % 0.6) : 0 };
  }
  if (id === "maxVilla") return T < 21.8 || T > 23.2 ? null : { ...base, pose: poseTriomphe(T), emotion: "sourire" };
  if (id === "maxYacht") return T < 22.8 || T > 24.0 ? null : { ...base, pose: poseTriomphe(T), emotion: "sourire" };
  if (id === "maxBalcon") {
    if (T < 23.4 || T > 25.2) return null;
    return { ...base, pose: poseTriomphe(T), emotion: "sourire" };
  }
  if (id === "maxBalcon2") {
    if (T < 39.2) return null;
    const stop = T >= ev.stop;
    return { ...base, tenue: TENUE_BALCON_NU, pose: poseBalcon(T, 0.3), emotion: T >= ev.stop + 0.3 ? "larmes" : T >= 40.6 ? "triste" : "inquiet", sansClin: false, graine: stop ? 0.5 : 0.3 };
  }
  if (id === "maxMatin") {
    if (T < 23.7 || T > ev.ruine) return null;
    const arrive = T >= 28.6;
    const refus = T >= ev.refuse + 0.2;
    return { ...base, pose: arrive ? (refus ? poseDonne(0.9) : poseDonne(lisse(entre(T, 28.6, 28.95)))) : base.pose, emotion: refus ? "inquiet" : arrive ? "curieux" : "sourire", billet: arrive ? "1000" : undefined };
  }
  if (id === "boul") {
    if (T < 26 || T > ev.ruine + 0.2) return null;
    const refus = T >= ev.refuse && T < ev.rien - 0.3;
    const apres = T >= ev.rien - 0.3;
    return {
      ...base,
      toque: true,
      pose: refus ? poseRefuse(T) : apres ? poseAffaisse(T, 0.2) : poseDebout(T, 0.5),
      emotion: apres ? "triste" : refus ? "colere" : "neutre",
      bouche: T >= ev.rien - 0.45 && T < ev.rien + 0.9 ? 0.5 + 0.4 * Math.sin(T * 14) ** 2 : 0,
      sansClin: false,
    };
  }
  if (id === "maxRuine") {
    if (T < ev.ruine - 0.4 || T > ev.fin + 5) return null;
    const vu = T >= ev.vole + 1.2;
    return { ...base, pose: { ...poseDebout(T, 0.4), tete: [0.9 * lisse(entre(T, 31.4, 32.2)) - 0.6 * lisse(entre(T, 33.6, 34.4)), 0.02] }, emotion: vu ? "effraye" : "inquiet", sansClin: false, ry: base.ry };
  }
  // ----- foule de la rue (jour) : chante, puis hypnotisée
  if (id.startsWith("v")) {
    if (T < ev.chanteRue - 1.5 || T >= ev.ruine + 0.2) return null;
    const i = parseInt(id.slice(1), 10);
    const c = cycle(T, i, ev.chanteRue);
    const chante = T >= ev.chanteRue;
    const hy = T >= ev.hypno - 1.5;
    const joie = T < ev.hypno - 1.0;
    return {
      ...base,
      pose: chante ? (joie ? poseChante(T, i) : poseTransporte(T, i)) : poseDebout(T, i),
      emotion: chante ? (hy ? "vide" : "sourire") : "neutre",
      bouche: chante ? ouverture(c.tl) : 0,
      spirale: lisse(entre(T, ev.hypno, ev.hypno + 0.5)),
      bulle: chante && c.tl >= 0 && c.tl < 0.6 ? c.debut : null,
      sansClin: true,
      tenue: desaturerTenue(id, a.tenue, desat),
    };
  }
  // ----- foule de la ville ruinée : yeux vides, spirales, portefeuille à plat, poches retournées, chante encore, puis se tait
  if (id.startsWith("r")) {
    if (T < ev.ruine - 0.5) return null;
    const i = parseInt(id.slice(1), 10);
    if (Number.isNaN(i)) return null;
    const c = cycle(T, i, ev.ruine - 0.6);
    const chante = T < ev.stop;
    const plat = T >= ev.plat;
    const apresSilence = T >= ev.stop;
    const k = lisse(entre(T, ev.stop, ev.stop + 0.7));
    return {
      ...base,
      pose: apresSilence ? poseAffaisse(T, i) : plat ? poseMontreVide(T, i) : poseTransporte(T, i),
      emotion: apresSilence ? (k > 0.5 ? "triste" : "vide") : "vide",
      bouche: chante ? ouverture(c.tl) : 0,
      spirale: chante ? 1 : 1 - k,
      bulle: chante && c.tl >= 0 && c.tl < 0.6 ? c.debut : null,
      sansClin: true,
      poche: true,
      portefeuille: plat && !apresSilence,
      tenue: desaturerTenue(id, a.tenue, desat),
    };
  }
  return base;
}

void tenueCitoyen;
void NB_CITOYENS;
void ARGENT_FINAL;
void poseAssise;
void mel;
void Faisceau;
void PR;
void ST;
void TO;
