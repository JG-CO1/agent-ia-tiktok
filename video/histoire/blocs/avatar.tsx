/**
 * Avatar façon jeu en blocs (tête carrée, torse rectangulaire, bras et jambes en blocs articulés au coude et au
 * genou), visage en décalque, couleurs plates. Aucune lumière réelle : chaque face a une teinte « cuite », et
 * l'avatar entier est teinté selon l'endroit où il se trouve (nuit, pièce éclairée à la bougie, aube…).
 */
import React, { createContext, useContext, useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "./geo";
import { visage, type Emotion } from "./textures";

export type Teinte = [number, number, number];

// ------------------------------------------------------------------ Bloc de base (ombrage cuit par face)
const OMBRES = [0.82, 0.78, 1, 0.66, 0.95, 0.74]; // +x, -x, +y, -y, +z, -z
let boiteOmbree: THREE.BufferGeometry | null = null;
export function geometrieBloc(): THREE.BufferGeometry {
  if (!boiteOmbree) {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const col = new Float32Array(g.getAttribute("position").count * 3);
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) col.set([OMBRES[f], OMBRES[f], OMBRES[f]], (f * 4 + v) * 3);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    boiteOmbree = g;
  }
  return boiteOmbree;
}

const teintes = new Map<string, THREE.Color>();
/** Couleur d'aplat (hex sRVB) multipliée par la teinte de la zone (facteurs linéaires). */
export function teinter(hex: string, t: Teinte = [1, 1, 1]): THREE.Color {
  const cle = `${hex}|${t[0].toFixed(3)}|${t[1].toFixed(3)}|${t[2].toFixed(3)}`;
  let c = teintes.get(cle);
  if (!c) {
    c = new THREE.Color(hex);
    c.setRGB(c.r * t[0], c.g * t[1], c.b * t[2]);
    if (teintes.size > 4000) teintes.clear();
    teintes.set(cle, c);
  }
  return c;
}

/** Opacité imposée aux blocs d'un avatar (fantôme translucide). */
const OpaciteCtx = createContext<number>(1);

/** Bloc coloré : pièce élémentaire de tout ce qui bouge (avatars, accessoires). `brut` = lumineux, sans ombrage. */
export const Bloc: React.FC<{ p?: V3; s: V3; c: string; t?: Teinte; r?: V3; brut?: boolean; opacite?: number }> = ({ p, s, c, t, r, brut, opacite }) => {
  const ctx = useContext(OpaciteCtx);
  const o = opacite ?? (ctx < 1 ? ctx : undefined);
  return (
    <mesh position={p} scale={s} rotation={r} geometry={geometrieBloc()}>
      <meshBasicMaterial vertexColors={!brut} color={teinter(c, t)} transparent={o !== undefined} opacity={o ?? 1} depthWrite={o === undefined} />
    </mesh>
  );
};

// ------------------------------------------------------------------ Poses
export type Membre = { x: number; z?: number; pli?: number };
export type Pose = {
  /** décalage vertical du bassin (assis, accroupi) */
  y?: number;
  /** torse penché vers l'avant (rad) */
  torse?: number;
  /** tête : lacet (vers sa gauche +), tangage (vers le bas +) */
  tete?: [number, number];
  brasG: Membre;
  brasD: Membre;
  jambeG: Membre;
  jambeD: Membre;
};
export const HANCHE = 0.95;

const mb = (x = 0, z = 0, pli = 0): Membre => ({ x, z, pli });

/** Debout, au repos : légère respiration des bras (jamais figé). */
export function poseDebout(t: number, graine = 0): Pose {
  const r = Math.sin(t * 1.7 + graine) * 0.035;
  return { brasG: mb(r, 0.05), brasD: mb(-r, 0.05), jambeG: mb(0), jambeD: mb(0), tete: [0, 0] };
}

/** Marche : bras et jambes en opposition, genoux qui plient un peu (cycle = `phase` en radians). */
export function poseMarche(phase: number, ampleur = 1): Pose {
  const s = Math.sin(phase);
  const a = 0.62 * ampleur;
  return {
    y: Math.abs(Math.cos(phase)) * 0.05 * ampleur - 0.02,
    torse: 0.06 * ampleur,
    tete: [0, 0],
    jambeG: mb(-s * a, 0, Math.max(0, -Math.cos(phase)) * 0.55 * ampleur),
    jambeD: mb(s * a, 0, Math.max(0, Math.cos(phase)) * 0.55 * ampleur),
    brasG: mb(s * a * 0.9, 0.04, -0.18 * ampleur),
    brasD: mb(-s * a * 0.9, 0.04, -0.18 * ampleur),
  };
}

/** Assise (bassin à `hauteurBassin` au-dessus du sol de l'avatar), mains posées devant elle. */
export function poseAssise(t: number, hauteurBassin: number): Pose {
  const r = Math.sin(t * 1.3) * 0.02;
  return {
    y: hauteurBassin - HANCHE,
    torse: 0.05,
    tete: [0, 0],
    jambeG: mb(-1.45, 0, 1.3),
    jambeD: mb(-1.45, 0, 1.3),
    brasG: mb(-0.62 + r, 0.08, -0.75),
    brasD: mb(-0.62 - r, 0.08, -0.75),
  };
}

/** Accroupi devant un objet au sol : cuisses repliées, torse penché, bras tendus vers le bas. */
export function poseAccroupi(): Pose {
  return {
    y: -0.42,
    torse: 0.5,
    tete: [0, 0.35],
    jambeG: mb(-1.75, 0, 2.3),
    jambeD: mb(-1.75, 0, 2.3),
    brasG: mb(-0.95, 0.05, -0.5),
    brasD: mb(-0.95, 0.05, -0.5),
  };
}

const mixM = (a: Membre, b: Membre, k: number): Membre => ({ x: a.x + (b.x - a.x) * k, z: (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * k, pli: (a.pli ?? 0) + ((b.pli ?? 0) - (a.pli ?? 0)) * k });
/** Mélange de deux poses (k = 0 → a, k = 1 → b). */
export function melPose(a: Pose, b: Pose, k: number): Pose {
  const m = (u: number | undefined, v: number | undefined) => (u ?? 0) + ((v ?? 0) - (u ?? 0)) * k;
  return {
    y: m(a.y, b.y),
    torse: m(a.torse, b.torse),
    tete: [m(a.tete?.[0], b.tete?.[0]), m(a.tete?.[1], b.tete?.[1])],
    brasG: mixM(a.brasG, b.brasG, k),
    brasD: mixM(a.brasD, b.brasD, k),
    jambeG: mixM(a.jambeG, b.jambeG, k),
    jambeD: mixM(a.jambeD, b.jambeD, k),
  };
}

// ------------------------------------------------------------------ Tenues (bible visuelle § 2)
export type Tenue = {
  genre: "joueur" | "dame" | "figurant" | "sportif";
  peau: string;
  haut: string;
  bas: string;
  chaussures: string;
  cheveux: string;
  bas2?: string;
  /** accessoires de la ville : chapeau de fête pointu, tablier, casquette, écharpe, bandeau, sac de courrier (couleur d'aplat) */
  chapeau?: string;
  tablier?: string;
  casquette?: string;
  echarpe?: string;
  bandeau?: string;
  sac?: string;
  /** récits sombres : cheveux longs, robe, long manteau, capuche, chapeau à bords, lunettes (couleurs d'aplat) */
  longs?: string;
  robe?: string;
  manteau?: string;
  capuche?: string;
  feutre?: string;
  lunettes?: string;
};
export const TENUE_JOUEUR: Tenue = { genre: "joueur", peau: "#E6B98F", haut: "#202631", bas: "#303C52", chaussures: "#171717", cheveux: "#252525" };
export const TENUE_DAME: Tenue = { genre: "dame", peau: "#D9AE8B", haut: "#79628D", bas: "#51485D", chaussures: "#383838", cheveux: "#A7A7A7", bas2: "#B3A398" };

export type AvatarProps = {
  p: V3;
  ry?: number;
  pose: Pose;
  tenue: Tenue;
  emotion?: Emotion;
  /** image courante (clignement des yeux) */
  frame: number;
  graine?: number;
  teinte?: Teinte;
  echelle?: number;
  /** objet tenu : dessiné dans le repère de la main droite / gauche (origine = bout de la main) */
  mainD?: React.ReactNode;
  mainG?: React.ReactNode;
  /** objets dessinés dans le repère de l'avatar (origine = sol, entre les pieds ; +z = devant lui) */
  children?: React.ReactNode;
  /** pas de clignement (somnambules) ; clignement rapide (regard qui trahit un éveillé) */
  sansClin?: boolean;
  clinRapide?: boolean;
  /** translucide (fantôme) : 0 à 1 */
  opacite?: number;
  /** bascule de tout le corps autour des pieds (chute) : tangage en radians, > 0 = vers l'avant */
  rx?: number;
};

const Bras: React.FC<{ cote: 1 | -1; m: Membre; haut: string; peau: string; t: Teinte; objet?: React.ReactNode; manche: string }> = ({ cote, m, haut, peau, t, objet, manche }) => (
  <group position={[cote * 0.68, 0.9, 0]} rotation={[m.x, 0, cote * (m.z ?? 0)]}>
    <Bloc p={[0, -0.15, 0]} s={[0.44, 0.5, 0.44]} c={haut} t={t} />
    <group position={[0, -0.4, 0]} rotation={[m.pli ?? 0, 0, 0]}>
      <Bloc p={[0, -0.17, 0]} s={[0.44, 0.34, 0.44]} c={haut} t={t} />
      <Bloc p={[0, -0.335, 0]} s={[0.46, 0.05, 0.46]} c={manche} t={t} />
      <Bloc p={[0, -0.435, 0]} s={[0.42, 0.15, 0.42]} c={peau} t={t} />
      {objet ? <group position={[0, -0.5, 0]}>{objet}</group> : null}
    </group>
  </group>
);

const Jambe: React.FC<{ cote: 1 | -1; m: Membre; bas: string; bas2: string; chaussures: string; t: Teinte }> = ({ cote, m, bas, bas2, chaussures, t }) => (
  <group position={[cote * 0.23, 0, 0]} rotation={[m.x, 0, cote * (m.z ?? 0)]}>
    <Bloc p={[0, -0.2375, 0]} s={[0.46, 0.475, 0.46]} c={bas} t={t} />
    <group position={[0, -0.475, 0]} rotation={[m.pli ?? 0, 0, 0]}>
      <Bloc p={[0, -0.1675, 0]} s={[0.46, 0.335, 0.46]} c={bas2} t={t} />
      <Bloc p={[0, -0.405, 0.04]} s={[0.47, 0.14, 0.56]} c={chaussures} t={t} />
    </group>
  </group>
);

export const Avatar: React.FC<AvatarProps> = ({ p, ry = 0, pose, tenue, emotion = "neutre", frame, graine = 0, teinte = [1, 1, 1], echelle = 1, mainD, mainG, children, sansClin, clinRapide, opacite = 1, rx = 0 }) => {
  const t = teinte;
  const clin = sansClin ? false : clinRapide ? (frame + graine * 11) % 34 > 30 : (frame + graine * 37) % 104 > 99;
  const dame = tenue.genre === "dame";
  const tex = useMemo(() => visage(emotion, clin, dame), [emotion, clin, dame]);
  const gris = Math.min(1, (t[0] + t[1] + t[2]) / 3 + 0.25);
  const encre = useMemo(() => new THREE.Color().setRGB(gris, gris, gris), [gris]);
  const [lacet, tangage] = pose.tete ?? [0, 0];
  const manche = dame ? "#6B5580" : "#191E28";
  return (
    <OpaciteCtx.Provider value={opacite}>
    <group position={p} rotation={[rx, ry, 0, "YXZ"]} scale={echelle}>
      {children}
      <group position={[0, HANCHE + (pose.y ?? 0), 0]}>
        {tenue.manteau && <Bloc p={[0, -0.12, 0]} s={[1.02, 0.98, 0.58]} c={tenue.manteau} t={t} />}
        {tenue.robe && <Bloc p={[0, -0.08, 0]} s={[1.0, 0.66, 0.56]} c={tenue.robe} t={t} />}
        <Jambe cote={1} m={pose.jambeG} bas={tenue.bas} bas2={tenue.bas2 ?? tenue.bas} chaussures={tenue.chaussures} t={t} />
        <Jambe cote={-1} m={pose.jambeD} bas={tenue.bas} bas2={tenue.bas2 ?? tenue.bas} chaussures={tenue.chaussures} t={t} />
        <group rotation={[pose.torse ?? 0, 0, 0]}>
          <Bloc p={[0, 0.5, 0]} s={[0.92, 1.0, 0.46]} c={tenue.haut} t={t} />
          {tenue.genre === "joueur" && (
            <>
              <Bloc p={[0, 0.95, -0.3]} s={[0.74, 0.36, 0.26]} c="#262D3A" t={t} />
              <Bloc p={[0, 0.3, 0.235]} s={[0.56, 0.26, 0.03]} c="#2B3342" t={t} />
              <Bloc p={[-0.1, 0.76, 0.24]} s={[0.045, 0.3, 0.03]} c="#C9CED8" t={t} />
              <Bloc p={[0.1, 0.76, 0.24]} s={[0.045, 0.3, 0.03]} c="#C9CED8" t={t} />
              <Bloc p={[0, 0.97, 0.12]} s={[0.56, 0.08, 0.3]} c="#262D3A" t={t} />
            </>
          )}
          {dame && (
            <>
              <Bloc p={[0, 0.5, 0.235]} s={[0.22, 0.98, 0.03]} c="#EDE6D8" t={t} />
              <Bloc p={[0, 0.95, 0.235]} s={[0.5, 0.1, 0.04]} c="#EDE6D8" t={t} />
              {[0.72, 0.5, 0.28].map((y) => (
                <Bloc key={y} p={[0.15, y, 0.245]} s={[0.07, 0.07, 0.03]} c="#3F3550" t={t} />
              ))}
            </>
          )}
          {tenue.genre === "figurant" && <Bloc p={[0, 0.3, 0.235]} s={[0.5, 0.2, 0.03]} c="#FFFFFF" t={t} opacite={0.25} />}
          {tenue.genre === "sportif" && (
            <>
              <Bloc p={[0, 0.55, -0.24]} s={[0.46, 0.5, 0.03]} c="#FFFFFF" t={t} />
              <Bloc p={[0, 0.78, 0.24]} s={[0.5, 0.12, 0.03]} c="#FFFFFF" t={t} />
              <Bloc p={[0, 0.08, 0]} s={[0.94, 0.14, 0.48]} c="#FFFFFF" t={t} />
            </>
          )}
          {tenue.tablier && <Bloc p={[0, 0.4, 0.24]} s={[0.66, 0.78, 0.03]} c={tenue.tablier} t={t} />}
          {tenue.echarpe && <Bloc p={[0, 0.55, 0.245]} s={[0.16, 1.1, 0.03]} c={tenue.echarpe} t={t} r={[0, 0, 0.62]} />}
          {tenue.sac && (
            <>
              <Bloc p={[0.5, 0.2, 0.04]} s={[0.26, 0.5, 0.62]} c={tenue.sac} t={t} />
              <Bloc p={[0, 0.58, 0.245]} s={[0.12, 1.2, 0.03]} c="#3A2E22" t={t} r={[0, 0, -0.9]} />
            </>
          )}
          <Bras cote={1} m={pose.brasG} haut={tenue.haut} peau={tenue.peau} t={t} objet={mainG} manche={manche} />
          <Bras cote={-1} m={pose.brasD} haut={tenue.haut} peau={tenue.peau} t={t} objet={mainD} manche={manche} />
          {/* tête */}
          <group position={[0, 1.0, 0]} rotation={[tangage, lacet, 0, "YXZ"]}>
            <Bloc p={[0, 0.4, 0]} s={[0.8, 0.8, 0.8]} c={tenue.peau} t={t} />
            <mesh position={[0, 0.4, 0.402]}>
              <planeGeometry args={[0.8, 0.8]} />
              <meshBasicMaterial map={tex} transparent opacity={opacite} depthWrite={false} color={encre} />
            </mesh>
            {dame ? (
              <>
                <Bloc p={[0, 0.84, -0.02]} s={[0.88, 0.2, 0.88]} c={tenue.cheveux} t={t} />
                <Bloc p={[0, 0.5, -0.41]} s={[0.88, 0.6, 0.14]} c={tenue.cheveux} t={t} />
                <Bloc p={[0.42, 0.56, -0.08]} s={[0.1, 0.5, 0.56]} c={tenue.cheveux} t={t} />
                <Bloc p={[-0.42, 0.56, -0.08]} s={[0.1, 0.5, 0.56]} c={tenue.cheveux} t={t} />
                <Bloc p={[0, 0.76, 0.41]} s={[0.88, 0.1, 0.08]} c={tenue.cheveux} t={t} />
                <Bloc p={[0, 1.02, -0.26]} s={[0.44, 0.34, 0.4]} c="#B5B5B5" t={t} />
                <Bloc p={[0, 1.2, -0.26]} s={[0.24, 0.1, 0.22]} c="#B5B5B5" t={t} />
              </>
            ) : (
              <>
                <Bloc p={[0, 0.85, -0.02]} s={[0.88, 0.22, 0.88]} c={tenue.cheveux} t={t} />
                <Bloc p={[0, 0.5, -0.41]} s={[0.88, 0.62, 0.14]} c={tenue.cheveux} t={t} />
                <Bloc p={[0.42, 0.6, -0.14]} s={[0.1, 0.44, 0.5]} c={tenue.cheveux} t={t} />
                <Bloc p={[-0.42, 0.6, -0.14]} s={[0.1, 0.44, 0.5]} c={tenue.cheveux} t={t} />
                <Bloc p={[0, 0.74, 0.41]} s={[0.88, 0.14, 0.1]} c={tenue.cheveux} t={t} />
                <Bloc p={[-0.22, 0.71, 0.42]} s={[0.4, 0.09, 0.1]} c={tenue.cheveux} t={t} />
              </>
            )}
            {tenue.longs && (
              <>
                <Bloc p={[0, 0.2, -0.43]} s={[0.9, 1.15, 0.16]} c={tenue.longs} t={t} />
                <Bloc p={[0.43, 0.3, -0.1]} s={[0.1, 0.8, 0.5]} c={tenue.longs} t={t} />
                <Bloc p={[-0.43, 0.3, -0.1]} s={[0.1, 0.8, 0.5]} c={tenue.longs} t={t} />
              </>
            )}
            {tenue.capuche && (
              <>
                <Bloc p={[0, 0.9, -0.03]} s={[1.0, 0.22, 1.0]} c={tenue.capuche} t={t} />
                <Bloc p={[0, 0.4, -0.46]} s={[1.0, 0.95, 0.16]} c={tenue.capuche} t={t} />
                <Bloc p={[0.5, 0.42, -0.05]} s={[0.12, 0.95, 0.92]} c={tenue.capuche} t={t} />
                <Bloc p={[-0.5, 0.42, -0.05]} s={[0.12, 0.95, 0.92]} c={tenue.capuche} t={t} />
              </>
            )}
            {tenue.feutre && (
              <>
                <Bloc p={[0, 0.88, 0]} s={[1.3, 0.07, 1.3]} c={tenue.feutre} t={t} />
                <Bloc p={[0, 1.08, 0]} s={[0.78, 0.38, 0.78]} c={tenue.feutre} t={t} />
              </>
            )}
            {tenue.lunettes && (
              <>
                <Bloc p={[-0.2, 0.42, 0.42]} s={[0.3, 0.3, 0.04]} c={tenue.lunettes} t={t} opacite={0.55} />
                <Bloc p={[0.2, 0.42, 0.42]} s={[0.3, 0.3, 0.04]} c={tenue.lunettes} t={t} opacite={0.55} />
                <Bloc p={[0, 0.46, 0.43]} s={[0.12, 0.05, 0.04]} c={tenue.lunettes} t={t} />
              </>
            )}
            {tenue.chapeau && (
              <>
                <Bloc p={[0, 1.02, 0]} s={[0.56, 0.26, 0.56]} c={tenue.chapeau} t={t} />
                <Bloc p={[0, 1.26, 0]} s={[0.38, 0.26, 0.38]} c="#FFFFFF" t={t} />
                <Bloc p={[0, 1.5, 0]} s={[0.22, 0.26, 0.22]} c={tenue.chapeau} t={t} />
                <Bloc p={[0, 1.7, 0]} s={[0.12, 0.14, 0.12]} c="#F5D142" t={t} brut />
              </>
            )}
            {tenue.casquette && (
              <>
                <Bloc p={[0, 0.98, 0]} s={[0.9, 0.24, 0.9]} c={tenue.casquette} t={t} />
                <Bloc p={[0, 0.88, 0.58]} s={[0.8, 0.07, 0.34]} c="#14171F" t={t} />
              </>
            )}
            {tenue.bandeau && <Bloc p={[0, 0.7, 0]} s={[0.84, 0.12, 0.84]} c={tenue.bandeau} t={t} />}
          </group>
        </group>
      </group>
    </group>
    </OpaciteCtx.Provider>
  );
};
