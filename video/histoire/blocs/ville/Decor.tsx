/**
 * Décor dynamique de la mise en scène « huss » : tout ce qui bouge ou clignote (fenêtres de la fête, guirlandes,
 * enceintes, boule à facettes, anneaux et filets, ballon, joueur, foule) posé sur les zones fixes de monde.ts.
 * Aucune lumière réelle : une lumière est un matériau clair ou un halo plat (consigne « capture de jeu »).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import { versMonde, type V3 } from "../geo";
import { Avatar, Bloc, teinter, type Teinte } from "../avatar";
import { halo } from "../textures";
import { TETE_LAMPADAIRE } from "../minuit/monde";
import { construireVille } from "./monde";
import { T_ACTEUR_FETE, T_ACTEUR_RUE, T_ACTEUR_TERRAIN, T_EXT, T_FETE, T_TERRAIN, type EtatVille } from "./etat";
import type { DonneesVille } from "./donnees";
import { joueurA } from "./joueur";
import { evaluer, type Acteur } from "./foule";
import { ENCEINTES, FENETRES_FETE, FETE, GUIRLANDES, H_PROJECTEUR, LAMPADAIRES, PANIER_A, PANIER_B, PERIODE, PROJECTEURS, R_ANNEAU, R_BALLE, TERRAIN, TERRAIN_BORDS, feteMonde, guirlande } from "./lieux";
import { TENUE_SPORTIF } from "./tenues";

export const cielVille = (_e?: EtatVille) => "#101C48";

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
const Zone: React.FC<{ g: THREE.BufferGeometry; t: Teinte }> = ({ g, t }) => (
  <mesh geometry={g}>
    <meshBasicMaterial vertexColors color={teinteZone(t)} />
  </mesh>
);
/** Halo plat posé sur le sol (lumière simulée). */
const Tache: React.FC<{ p: V3; s: [number, number]; c: string; o: number }> = ({ p, s, c, o }) => (
  <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
    <planeGeometry args={s} />
    <meshBasicMaterial map={halo()} color={c} transparent opacity={o} depthWrite={false} />
  </mesh>
);
const Lueur: React.FC<{ p: V3; s: number; c: string; o: number }> = ({ p, s, c, o }) => (
  <sprite position={p} scale={[s, s, 1]} renderOrder={3}>
    <spriteMaterial map={halo()} color={c} transparent opacity={o} depthWrite={false} />
  </sprite>
);
/** Ombre portée simple (disque sombre à plat) : les pieds et le ballon ne flottent jamais. */
const Ombre: React.FC<{ x: number; z: number; r: number; o: number }> = ({ x, z, r, o }) => (
  <mesh position={[x, 0.075, z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
    <circleGeometry args={[r, 14]} />
    <meshBasicMaterial color="#05060F" transparent opacity={o} depthWrite={false} />
  </mesh>
);

const COULEURS_FETE = ["#FF4FA3", "#27D3F5", "#FFE04A", "#8E5BFF", "#5CFF8A"];
const phaseTemps = (T: number, beat0: number) => (T - beat0) / PERIODE;

// ------------------------------------------------------------------ Ballon
const Balle: React.FC<{ p: V3; T: number }> = ({ p, T }) => (
  <group position={p} rotation={[T * 5.1, T * 3.3, 0]}>
    <mesh>
      <icosahedronGeometry args={[R_BALLE, 1]} />
      <meshBasicMaterial color="#F08A28" />
    </mesh>
    {[[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]].map((r, i) => (
      <mesh key={i} rotation={r as [number, number, number]}>
        <torusGeometry args={[R_BALLE * 1.012, 0.014, 4, 20]} />
        <meshBasicMaterial color="#14110E" />
      </mesh>
    ))}
  </group>
);

// ------------------------------------------------------------------ Anneau et filet
const Anneau: React.FC<{ p: V3; swish: number }> = ({ p, swish }) => (
  <group position={p}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[R_ANNEAU, 0.055, 6, 18]} />
      <meshBasicMaterial color="#F2601B" />
    </mesh>
    <group scale={[1 + 0.3 * swish, 1 + 0.18 * swish, 1 + 0.3 * swish]}>
      {Array.from({ length: 10 }, (_, i) => (
        <group key={i} rotation={[0, (i / 10) * Math.PI * 2, 0]}>
          <mesh position={[0.47, -0.5, 0]} rotation={[0, 0, 0.31]} scale={[0.04, 1.0, 0.04]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>
      ))}
      {[-0.3, -0.7].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R_ANNEAU - 0.2 - i * 0.17, 0.018, 4, 14]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      ))}
    </group>
  </group>
);

// ------------------------------------------------------------------ Silhouette (habitants éloignés : 5 blocs)
const Silhouette: React.FC<{ a: Acteur; t: Teinte }> = ({ a, t }) => {
  const dy = a.pose.y ?? 0;
  return (
    <group position={a.p} rotation={[0, a.ry, 0]}>
      <Bloc p={[0, 0.5, 0]} s={[0.7, 1.0, 0.4]} c={a.tenue.bas} t={t} />
      <Bloc p={[0, 1.45 + dy, 0]} s={[0.92, 1.0, 0.46]} c={a.tenue.haut} t={t} />
      <Bloc p={[0, 2.35 + dy, 0]} s={[0.8, 0.8, 0.8]} c={a.tenue.peau} t={t} />
      <Bloc p={[0, 2.8 + dy, -0.02]} s={[0.88, 0.22, 0.88]} c={a.tenue.cheveux} t={t} />
      {a.tenue.chapeau && <Bloc p={[0, 3.35 + dy, 0]} s={[0.4, 0.9, 0.4]} c={a.tenue.chapeau} t={t} />}
      {(a.pose.brasG.x < -1.5 || a.pose.brasD.x < -1.5) && <Bloc p={[0, 2.3 + dy, 0]} s={[1.7, 0.3, 0.3]} c={a.tenue.haut} t={t} />}
    </group>
  );
};

const teinteAt = (p: V3): Teinte => {
  const b = TERRAIN_BORDS;
  if (p[0] > b.x0 - 1.5 && p[0] < b.x1 + 1.5 && p[2] > b.z0 - 1.5 && p[2] < b.z1 + 1.5) return T_ACTEUR_TERRAIN;
  if (p[2] < -50) return T_ACTEUR_FETE;
  return T_ACTEUR_RUE;
};

const Courrier = (
  <>
    <Bloc p={[0, -0.12, 0.08]} s={[0.34, 0.05, 0.46]} c="#FFFFFF" brut />
    <Bloc p={[0.02, -0.08, 0.1]} s={[0.3, 0.05, 0.42]} c="#F4E6C8" brut />
  </>
);

export const MondeVille: React.FC<{ e: EtatVille; frame: number; data: DonneesVille }> = ({ e, frame, data }) => {
  const zones = useMemo(() => construireVille(), []);
  const T = frame / 30;
  const ph = phaseTemps(T, data.beat0);
  const frac = ph - Math.floor(ph);
  const kick = Math.max(0, 1 - frac * 3.2);
  const idx = Math.floor(ph);
  const cam = e.cam.pos;

  const joueur = joueurA(T, data);
  const swish = (() => {
    const dt = T - data.tir.panier;
    return dt > 0 && dt < 1.4 ? Math.exp(-dt * 4.5) * Math.cos(dt * 22) : 0;
  })();

  // habitants : les plus proches en détail, les autres en silhouette
  const habitants = e.sansFoule
    ? []
    : data.habitants
        .map((h) => {
          const a = evaluer(h, T, data.beat0);
          if (!a) return null;
          const d = Math.hypot(a.p[0] - cam[0], a.p[1] - cam[1], a.p[2] - cam[2]);
          return { id: h.id, a, d };
        })
        .filter((x): x is { id: string; a: Acteur; d: number } => !!x && x.d < 150)
        .sort((u, v) => u.d - v.d);
  const NB_DETAIL = 14;

  const lune: V3 = [-70, 96, -330];
  const lampes = LAMPADAIRES.map((l) => versMonde(l.p, l.ry, [0, TETE_LAMPADAIRE + 0.02, 1.1]));
  const hautBalle = joueur.balle[1];

  return (
    <>
      {/* ---- ciel : étoiles simples, lune blanche parfaitement ronde */}
      <mesh geometry={zones.etoiles} renderOrder={-10}>
        <meshBasicMaterial color="#FFFFFF" depthWrite={false} />
      </mesh>
      <mesh position={lune} renderOrder={-9}>
        <circleGeometry args={[34, 48]} />
        <meshBasicMaterial color="#FFFFFF" depthWrite={false} />
      </mesh>

      {/* ---- zones fixes */}
      <Zone g={zones.ext} t={T_EXT} />
      <Zone g={zones.terrain} t={T_TERRAIN} />
      <Zone g={zones.fete} t={T_FETE} />

      {/* ---- lampadaires allumés : tête claire + halo plat au sol */}
      {lampes.map((b, i) => (
        <group key={i}>
          <group position={b} rotation={[0, LAMPADAIRES[i].ry, 0]}>
            <Bloc s={[0.42, 0.07, 0.68]} c="#FFE9A8" brut />
          </group>
          <Lueur p={[b[0], b[1] - 0.05, b[2]]} s={2.4} c="#FFE2A0" o={0.5} />
          <Tache p={[b[0], 0.1, b[2]]} s={[9, 9]} c="#FFDB8E" o={0.4} />
        </group>
      ))}

      {/* ---- terrain : projecteurs, paniers */}
      {PROJECTEURS.map((p, i) => (
        <group key={i}>
          <Bloc p={[p[0], H_PROJECTEUR + 0.2, p[2] + (p[2] < TERRAIN.cz ? 0.2 : -0.2)]} s={[1.7, 0.5, 0.06]} c="#F4F8FF" brut />
          <Lueur p={[p[0], H_PROJECTEUR + 0.2, p[2]]} s={4.2} c="#DDEBFF" o={0.55} />
        </group>
      ))}
      <Tache p={[TERRAIN.cx, 0.12, TERRAIN.cz]} s={[26, 40]} c="#CFE2FF" o={0.28} />
      <Anneau p={PANIER_A} swish={swish} />
      <Anneau p={PANIER_B} swish={0} />

      {/* ---- maison de fête : fenêtres qui clignotent sur le rythme, guirlandes, enceintes, boule à facettes */}
      <group position={FETE.o} rotation={[0, FETE.ry, 0]}>
        {FENETRES_FETE.map((f, i) => (
          <mesh key={i} position={[f.x, f.y, 0.13]}>
            <planeGeometry args={[f.w, f.h]} />
            <meshBasicMaterial color={COULEURS_FETE[(idx + i * 2 + (i % 2)) % COULEURS_FETE.length]} />
          </mesh>
        ))}
        {GUIRLANDES.flatMap(([a, c, n, sag], gi) =>
          guirlande(a, c, n, sag).map((p, i) => (
            <mesh key={`${gi}-${i}`} position={p}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshBasicMaterial color={COULEURS_FETE[(i + gi + (idx % 2)) % COULEURS_FETE.length]} />
            </mesh>
          )),
        )}
        {ENCEINTES.map((p, i) => {
          const s = Math.sign(p[0]);
          const x = p[0] + s * 2.6;
          return (
            <group key={i} position={[x, 0, p[2] + 0.98]}>
              <mesh position={[0, 1.0, 0]} scale={[1 + 0.14 * kick, 1 + 0.14 * kick, 1]}>
                <circleGeometry args={[0.78, 14]} />
                <meshBasicMaterial color="#3A3C4A" />
              </mesh>
              <mesh position={[0, 1.0, 0.01]} scale={[1 + 0.2 * kick, 1 + 0.2 * kick, 1]}>
                <circleGeometry args={[0.32, 12]} />
                <meshBasicMaterial color="#7A7E92" />
              </mesh>
              <mesh position={[0, 2.5, 0]}>
                <circleGeometry args={[0.32, 10]} />
                <meshBasicMaterial color="#3A3C4A" />
              </mesh>
            </group>
          );
        })}
        {/* boule à facettes sous l'auvent */}
        <group position={[0, 4.3, 4.6]} rotation={[0, T * 1.4, 0]}>
          <mesh>
            <icosahedronGeometry args={[0.6, 1]} />
            <meshBasicMaterial color="#D8E4F0" />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[Math.cos(i * 0.8) * 0.75, Math.sin(i * 1.3) * 0.45, Math.sin(i * 0.8) * 0.75]} scale={0.1 + 0.14 * (((idx + i) % 3) === 0 ? 1 : 0)}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          ))}
        </group>
      </group>
      {/* halos colorés au sol (piste de danse) et lueur de la maison */}
      {[[-10, 12], [0, 18], [10, 12], [-5, 24], [5, 24]].map(([x, z], i) => {
        const w = feteMonde([x, 0.1, z]);
        return <Tache key={i} p={w} s={[13, 13]} c={COULEURS_FETE[(idx + i) % COULEURS_FETE.length]} o={0.34 + 0.18 * kick} />;
      })}
      <Lueur p={feteMonde([-16, 5, -3])} s={14} c="#FF4FA3" o={0.22} />
      <Lueur p={feteMonde([16, 5, -3])} s={14} c="#27D3F5" o={0.22} />

      {/* ---- le joueur, son ombre et le ballon */}
      <Avatar p={joueur.p} ry={joueur.ry} pose={joueur.pose} tenue={TENUE_SPORTIF} emotion={joueur.emotion} frame={frame} graine={1} teinte={T_ACTEUR_TERRAIN} />
      <Ombre x={joueur.p[0]} z={joueur.p[2]} r={0.85} o={0.38} />
      <Balle p={joueur.balle} T={T} />
      <Ombre x={joueur.balle[0]} z={joueur.balle[2]} r={R_BALLE * (1.1 - Math.min(0.5, hautBalle * 0.08))} o={Math.max(0.12, 0.45 - hautBalle * 0.05)} />

      {/* ---- habitants */}
      {habitants.map((h, i) =>
        i < NB_DETAIL ? (
          <group key={h.id}>
            <Avatar p={h.a.p} ry={h.a.ry} pose={h.a.pose} tenue={h.a.tenue} emotion={h.a.emotion} frame={frame} graine={h.a.graine} teinte={teinteAt(h.a.p)} mainD={h.a.courrier ? Courrier : undefined} />
            {h.d < 40 && <Ombre x={h.a.p[0]} z={h.a.p[2]} r={0.8} o={0.34} />}
          </group>
        ) : (
          <Silhouette key={h.id} a={h.a} t={teinteAt(h.a.p)} />
        ),
      )}
    </>
  );
};

void teinter;
