/**
 * Bibliothèque commune des récits sombres : zones teintées, halos, faisceaux de lanterne, ombres, ciel, objets en main
 * et rendu des personnages (avec niveau de détail). Chaque récit (somnambules, ange, brouillard) compose ces briques.
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "../geo";
import { Avatar, Bloc, type Teinte } from "../avatar";
import { halo } from "../textures";
import { etoiles as geoEtoiles } from "../minuit/monde";
import { type Acteur, type Habitant, evaluer } from "../ville/foule";
import { tempsMot, type Minutage, type RecitBlocs } from "../decoupage";
import type { Cam } from "../maths";

// ------------------------------------------------------------------ État et données
export type FxConte = { vignette?: number; teinte?: [string, number]; flash?: [string, number]; noir?: number };
export type EtatConte = { cam: Cam; brouillard?: [string, number, number]; ciel?: string; fx?: FxConte; /** ambiance propre au récit (« nuit », « aube »…) */ ambiance?: string };
export type DonneesConte = {
  mot: (scene: number, k: number) => number;
  habitants: Habitant[];
  acteur: (id: string, T: number) => Acteur | null;
  /** fin de la dernière parole (s) */
  finNarration: number;
  fin: number;
  /** données propres au récit (instants d'événements calculés une fois) */
  ev: Record<string, number>;
};

/** Prépare les données d'un récit : `habitants(mot)` donne les personnages, `evenements(mot)` les instants clés. */
export function preparerConte(recit: RecitBlocs, m: Minutage, def: { habitants: (mot: (s: number, k: number) => number) => Habitant[]; evenements?: (mot: (s: number, k: number) => number) => Record<string, number> }, dureeMin = 0): DonneesConte {
  const mot = (s: number, k: number) => tempsMot(recit, m, s, k);
  const habitants = def.habitants(mot);
  const index = new Map(habitants.map((h) => [h.id, h]));
  const finNarration = m.mots.length ? m.mots[m.mots.length - 1].fin : m.duree;
  return { mot, habitants, acteur: (id, T) => { const h = index.get(id); return h ? evaluer(h, T, 0) : null; }, finNarration, fin: Math.max(m.duree, m.dureeMin ?? dureeMin), ev: def.evenements ? def.evenements(mot) : {} };
}

// ------------------------------------------------------------------ Briques
const coul = new Map<string, THREE.Color>();
function teinteZone(t: Teinte): THREE.Color {
  const cle = t.map((x) => x.toFixed(3)).join("|");
  let c = coul.get(cle);
  if (!c) {
    c = new THREE.Color().setRGB(t[0], t[1], t[2]);
    coul.set(cle, c);
  }
  return c;
}
export const Zone: React.FC<{ g: THREE.BufferGeometry; t: Teinte }> = ({ g, t }) => (
  <mesh geometry={g}>
    <meshBasicMaterial vertexColors color={teinteZone(t)} />
  </mesh>
);
/** Halo plat posé sur une surface horizontale (lumière simulée). */
export const Tache: React.FC<{ p: V3; s: [number, number]; c: string; o: number }> = ({ p, s, c, o }) => (
  <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
    <planeGeometry args={s} />
    <meshBasicMaterial map={halo()} color={c} transparent opacity={o} depthWrite={false} />
  </mesh>
);
/** Halo toujours face caméra (source lumineuse). */
export const Lueur: React.FC<{ p: V3; s: number; c: string; o: number }> = ({ p, s, c, o }) => (
  <sprite position={p} scale={[s, s, 1]} renderOrder={3}>
    <spriteMaterial map={halo()} color={c} transparent opacity={o} depthWrite={false} />
  </sprite>
);
/** Ombre portée marquée : disque sombre à plat, allongé dans la direction opposée à la lumière. */
export const Ombre: React.FC<{ x: number; z: number; r: number; o: number; y?: number; etire?: number; angle?: number }> = ({ x, z, r, o, y = 0.075, etire = 1, angle = 0 }) => (
  <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, angle]} scale={[1, etire, 1]} renderOrder={1}>
    <circleGeometry args={[r, 16]} />
    <meshBasicMaterial color="#020308" transparent opacity={o} depthWrite={false} />
  </mesh>
);
/** Faisceau lumineux (cône ouvert, additif) : brouillard volumétrique simulé autour d'une lanterne ou d'un phare. */
export const Faisceau: React.FC<{ p: V3; dir: V3; long: number; rayon: number; c: string; o: number }> = ({ p, dir, long, rayon, c, o }) => {
  const g = useMemo(() => {
    const k = new THREE.ConeGeometry(rayon, long, 20, 1, true);
    k.translate(0, -long / 2, 0);
    return k;
  }, [long, rayon]);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(...dir).normalize()), [dir[0], dir[1], dir[2]]);
  return (
    <mesh position={p} quaternion={q} geometry={g} renderOrder={4}>
      <meshBasicMaterial color={c} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
};
/** Ciel : étoiles simples et lune blanche ronde (insensibles au brouillard). */
export const Ciel: React.FC<{ lune?: V3; rayonLune?: number; etoiles?: boolean; couleurLune?: string }> = ({ lune, rayonLune = 30, etoiles = true, couleurLune = "#F4F6FF" }) => {
  const g = useMemo(() => geoEtoiles(), []);
  return (
    <>
      {etoiles && (
        <mesh geometry={g} renderOrder={-10}>
          <meshBasicMaterial color="#FFFFFF" depthWrite={false} fog={false} />
        </mesh>
      )}
      {lune && (
        <mesh position={lune} renderOrder={-9}>
          <circleGeometry args={[rayonLune, 48]} />
          <meshBasicMaterial color={couleurLune} depthWrite={false} fog={false} />
        </mesh>
      )}
    </>
  );
};

// ------------------------------------------------------------------ Objets en main (origine = bout de la main, y vers le bas)
export const OBJETS: Record<string, (T: number) => React.ReactNode> = {
  lanterne: (T) => (
    <>
      <Bloc p={[0, -0.04, 0]} s={[0.22, 0.06, 0.22]} c="#222228" />
      <Bloc p={[0, -0.36, 0]} s={[0.34, 0.5, 0.34]} c="#26262C" />
      <Bloc p={[0, -0.36, 0]} s={[0.27, 0.42, 0.27]} c="#FFD27A" brut />
      <Bloc p={[0, -0.64, 0]} s={[0.3, 0.06, 0.3]} c="#222228" />
      <Lueur p={[0, -0.36 + Math.sin(T * 7) * 0.01, 0]} s={2.2} c="#FFC766" o={0.55} />
    </>
  ),
  pioche: () => (
    <>
      <Bloc p={[0, 0.45, 0]} s={[0.09, 1.55, 0.09]} c="#6B4A2F" />
      <Bloc p={[0, 1.2, 0]} s={[0.9, 0.13, 0.13]} c="#A9B0BA" />
      <Bloc p={[0.5, 1.14, 0]} s={[0.16, 0.1, 0.1]} c="#A9B0BA" r={[0, 0, -0.5]} />
      <Bloc p={[-0.5, 1.14, 0]} s={[0.16, 0.1, 0.1]} c="#A9B0BA" r={[0, 0, 0.5]} />
    </>
  ),
  bocal: (T) => (
    <>
      <Bloc p={[0, -0.32, 0]} s={[0.56, 0.62, 0.56]} c="#CFE8F5" opacite={0.38} />
      <Bloc p={[0, -0.64, 0]} s={[0.5, 0.05, 0.5]} c="#6B4A2F" />
      <Bloc p={[0, -0.03, 0]} s={[0.46, 0.07, 0.46]} c="#4A3B2A" />
      {[[-0.1, -0.5, 0.05], [0.1, -0.42, -0.06], [0, -0.3, 0.1], [-0.12, -0.24, -0.08], [0.1, -0.2, 0.08]].map((p, i) => (
        <Bloc key={i} p={p as V3} s={[0.05, 0.24, 0.12]} c="#FFD54A" brut r={[0, i, 0.3 * (i % 3 - 1)]} />
      ))}
      <Lueur p={[0, -0.34, 0]} s={1.1 + Math.sin(T * 3) * 0.1} c="#FFD54A" o={0.4} />
    </>
  ),
  plume: (T) => (
    <>
      <Bloc p={[0, -0.28, 0]} s={[0.05, 0.6, 0.2]} c="#FFD54A" brut r={[0, 0, 0.15]} />
      <Lueur p={[0, -0.3, 0]} s={1.4} c="#FFD54A" o={0.55 + Math.sin(T * 5) * 0.1} />
    </>
  ),
  cle: () => (
    <>
      <Bloc p={[0, -0.28, 0]} s={[0.07, 0.5, 0.05]} c="#0C0C10" />
      <Bloc p={[0, -0.02, 0]} s={[0.22, 0.22, 0.05]} c="#0C0C10" />
      <Bloc p={[0.07, -0.5, 0]} s={[0.14, 0.07, 0.05]} c="#0C0C10" />
    </>
  ),
  inhalateur: () => (
    <>
      <Bloc p={[0, -0.18, 0]} s={[0.16, 0.36, 0.14]} c="#2D78D6" />
      <Bloc p={[0, -0.4, 0.08]} s={[0.16, 0.1, 0.26]} c="#EAEAEA" />
    </>
  ),
  terre: () => (
    <>
      {[[-0.16, -0.12, 0.12], [-0.05, -0.16, 0.14], [0.07, -0.15, 0.14], [0.17, -0.1, 0.12]].map((p, i) => (
        <Bloc key={i} p={p as V3} s={[0.1, 0.09, 0.07]} c="#2A1C10" />
      ))}
    </>
  ),
};

/** Position du bout de la main droite (monde), pour poser un halo de lanterne. */
export function mainDroite(a: Acteur): V3 {
  const e = a.echelle;
  const l: V3 = [-0.7 * e, 1.05 * e, 0.55 * e];
  return [a.p[0] + l[0] * Math.cos(a.ry) + l[2] * Math.sin(a.ry), a.p[1] + l[1], a.p[2] - l[0] * Math.sin(a.ry) + l[2] * Math.cos(a.ry)];
}

// ------------------------------------------------------------------ Silhouette (personnages éloignés : quelques blocs)
export const Silhouette: React.FC<{ a: Acteur; t: Teinte }> = ({ a, t }) => {
  const e = a.echelle;
  const dy = a.pose.y ?? 0;
  return (
    <group position={a.p} rotation={[a.rx, a.ry, 0, "YXZ"]} scale={e}>
      <Bloc p={[0, 0.5, 0]} s={[0.7, 1.0, 0.4]} c={a.tenue.bas} t={t} />
      <Bloc p={[0, 1.45 + dy, 0]} s={[0.92, 1.0, 0.46]} c={a.tenue.haut} t={t} />
      <Bloc p={[0, 2.35 + dy, 0]} s={[0.8, 0.8, 0.8]} c={a.tenue.peau} t={t} />
      <Bloc p={[0, 2.8 + dy, -0.02]} s={[0.88, 0.22, 0.88]} c={a.tenue.cheveux} t={t} />
      {(a.pose.brasG.x < -1.2 || a.pose.brasD.x < -1.2) && <Bloc p={[0, 1.8 + dy, 0.5]} s={[1.5, 0.3, 0.8]} c={a.tenue.haut} t={t} />}
    </group>
  );
};

export type Visible = { id: string; a: Acteur; d: number };
/** Personnages visibles depuis la caméra (triés du plus proche au plus lointain). */
export function visibles(data: DonneesConte, T: number, cam: V3, portee = 140): Visible[] {
  const out: Visible[] = [];
  for (const h of data.habitants) {
    const a = evaluer(h, T, 0);
    if (!a) continue;
    const d = Math.hypot(a.p[0] - cam[0], a.p[1] - cam[1], a.p[2] - cam[2]);
    if (d < portee) out.push({ id: h.id, a, d });
  }
  return out.sort((u, v) => u.d - v.d);
}

/** Rend les personnages : les `nbDetail` plus proches en détail (avatar complet), les autres en silhouette. */
export const Acteurs: React.FC<{ liste: Visible[]; frame: number; T: number; teinte: (p: V3) => Teinte; nbDetail?: number; ombres?: boolean; lumiereOmbre?: number }> = ({ liste, frame, T, teinte, nbDetail = 14, ombres = true, lumiereOmbre = 0 }) => (
  <>
    {liste.map(({ id, a, d }, i) =>
      i < nbDetail ? (
        <group key={id}>
          <Avatar p={a.p} ry={a.ry} pose={a.pose} tenue={a.tenue} emotion={a.emotion} frame={frame} graine={a.graine} teinte={teinte(a.p)} echelle={a.echelle} sansClin={a.sansClin} clinRapide={a.clinRapide} opacite={a.fantome ? 0.5 : 1} rx={a.rx} mainD={a.objet && OBJETS[a.objet] ? OBJETS[a.objet](T) : undefined} />
          {ombres && d < 45 && a.rx === 0 && !a.fantome && <Ombre x={a.p[0]} z={a.p[2]} y={a.p[1] + 0.075} r={0.85 * a.echelle} o={0.45} etire={1.35} angle={lumiereOmbre} />}
          {a.objet === "lanterne" && d < 60 && <Tache p={[a.p[0], a.p[1] + 0.1, a.p[2]]} s={[9, 9]} c="#FFC766" o={0.4} />}
          {a.fantome && <Lueur p={[a.p[0], a.p[1] + 1.8 * a.echelle, a.p[2]]} s={5} c="#BFE0FF" o={0.35} />}
        </group>
      ) : (
        <Silhouette key={id} a={a} t={teinte(a.p)} />
      ),
    )}
  </>
);
