/**
 * Décor de « La fenêtre de minuit » : zones fixes (quartier, salon, chambre) teintées selon l'heure et les
 * lumières, plus tout ce qui change d'une image à l'autre (fenêtres, bougie, lampe, horloge, lampadaires…).
 * Aucune lumière réelle : une lampe allumée est un matériau plus clair (bible § 4.4).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import { versMonde, type V3 } from "../geo";
import { Bloc, teinter, type Teinte } from "../avatar";
import { cadran, cielAube, halo, lettre, photoFils, reveil } from "../textures";
import { CHAMBRE, FEN_B, FEN_C, FEN_J, HORLOGE, HORLOGE_CADRAN_Y, LAMPADAIRES, MAISON_B, MAISON_C, MAISON_J, PORTE_J_X, SALON, SOL, TETE_LAMPADAIRE, construireMonde } from "./monde";
import { T_AUBE, T_BOUGIE, T_CHAMBRE_LAMPE, T_CHAMBRE_NUIT, T_INTERIEUR_AUBE, T_NOIR, T_NUIT, melTeinte, type Etat, type Tenu } from "./etat";

const coul = new Map<string, THREE.Color>();
function teinteZone(t: Teinte): THREE.Color {
  const cle = t.map((x) => x.toFixed(3)).join("|");
  let c = coul.get(cle);
  if (!c) {
    c = new THREE.Color().setRGB(t[0], t[1], t[2]);
    if (coul.size > 2000) coul.clear();
    coul.set(cle, c);
  }
  return c;
}

const Zone: React.FC<{ g: THREE.BufferGeometry; t: Teinte }> = ({ g, t }) => (
  <mesh geometry={g}>
    <meshBasicMaterial vertexColors color={teinteZone(t)} />
  </mesh>
);

/** Halo plat posé sur une surface (lumière simulée, sans éclairage réel). */
const Tache: React.FC<{ p: V3; s: [number, number]; c: string; o: number; r?: V3 }> = ({ p, s, c, o, r = [-Math.PI / 2, 0, 0] }) => (
  <mesh position={p} rotation={r} renderOrder={2}>
    <planeGeometry args={s} />
    <meshBasicMaterial map={halo()} color={c} transparent opacity={o} depthWrite={false} />
  </mesh>
);

const Lueur: React.FC<{ p: V3; s: number; c: string; o: number }> = ({ p, s, c, o }) => (
  <sprite position={p} scale={[s, s, 1]} renderOrder={3}>
    <spriteMaterial map={halo()} color={c} transparent opacity={o} depthWrite={false} />
  </sprite>
);

/**
 * Vitre : visible seulement de l'extérieur (de l'intérieur, on voit la rue sans voile).
 * Allumée : voile jaune #FFE28A ; éteinte la nuit : presque noire ; le matin : sombre mais on devine l'intérieur.
 */
const Vitre: React.FC<{ p: V3; s: [number, number]; allumee: number; nuit: boolean; claire?: boolean }> = ({ p, s, allumee, nuit, claire }) => {
  const on = allumee > 0.15;
  const c = on ? "#FFE28A" : nuit ? "#0A0F22" : "#27303C";
  const o = on ? 0.22 * allumee : nuit ? 0.9 : claire ? 0.16 : 0.42;
  return (
    <mesh position={p} renderOrder={1}>
      <planeGeometry args={s} />
      <meshBasicMaterial color={c} transparent opacity={o} depthWrite={false} />
    </mesh>
  );
};

// ------------------------------------------------------------------ Accessoires narratifs
let triangle: THREE.BufferGeometry | null = null;
function rabatGeo() {
  if (!triangle) {
    triangle = new THREE.BufferGeometry();
    triangle.setAttribute("position", new THREE.Float32BufferAttribute([-0.45, 0, 0, 0, -0.34, 0, 0.45, 0, 0], 3));
  }
  return triangle;
}

/** Enveloppe blanche (debout dans le plan xy, face avant vers +z) : rabat qui s'ouvre, photo puis lettre qui sortent. */
export const Enveloppe: React.FC<{ rabat: number; photo: number; lettre?: number; t: Teinte }> = ({ rabat, photo, lettre: sortieLettre = 0, t }) => (
  <group scale={0.7}>
    <Bloc s={[0.9, 0.6, 0.03]} c="#F1EEE4" t={t} />
    <Bloc p={[0, -0.02, 0.018]} s={[0.9, 0.012, 0.004]} c="#D9D4C5" t={t} />
    <group position={[0, 0.3, 0.02]} rotation={[-rabat * 2.0, 0, 0]} scale={[1, 0.7, 1]}>
      <mesh geometry={rabatGeo()}>
        <meshBasicMaterial color={teinter("#DDD8C9", t)} side={THREE.DoubleSide} />
      </mesh>
    </group>
    {photo > 0.01 && (
      <mesh position={[0.1, -0.02 + photo * 0.62, -0.022]} rotation={[0, 0, -0.05]}>
        <planeGeometry args={[0.45, 0.6]} />
        <meshBasicMaterial map={photoFils()} color={teinter("#FFFFFF", t)} side={THREE.DoubleSide} />
      </mesh>
    )}
    {sortieLettre > 0.01 && (
      <mesh position={[-0.2, -0.04 + sortieLettre * 0.58, -0.03]} rotation={[0, 0, 0.07]}>
        <planeGeometry args={[0.42, 0.56]} />
        <meshBasicMaterial map={lettre()} color={teinter("#FFFFFF", t)} side={THREE.DoubleSide} />
      </mesh>
    )}
  </group>
);

/** Objet tenu par le narrateur (repère de l'avatar). */
export const ObjetTenu: React.FC<{ o: Tenu; t: Teinte }> = ({ o, t }) => (
  <group position={o.p} rotation={[o.r[0], o.r[1], o.r[2], "YXZ"]}>
    {o.type === "enveloppe" && <Enveloppe rabat={o.rabat} photo={o.photo} lettre={o.lettre} t={t} />}
    {o.type === "photo" && (
      <>
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[0.39, 0.52]} />
          <meshBasicMaterial map={photoFils()} color={teinter("#FFFFFF", t)} />
        </mesh>
        <Bloc s={[0.39, 0.52, 0.01]} c="#EFE9D8" t={t} />
      </>
    )}
    {o.type === "lettre" && (
      <>
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[0.46, 0.6]} />
          <meshBasicMaterial map={lettre()} color={teinter("#FFFFFF", t)} />
        </mesh>
        <Bloc s={[0.46, 0.6, 0.01]} c="#F4F0E2" t={t} />
      </>
    )}
  </group>
);

const Bougie: React.FC<{ flamme: number; fumee: number; frame: number; t: Teinte }> = ({ flamme, fumee, frame, t }) => {
  // hauteur de flamme entre 0,12 et 0,20 (bible § 4.4), couleur qui varie légèrement
  const h = (0.16 + 0.03 * Math.sin(frame * 0.9) + 0.012 * Math.sin(frame * 2.3 + 1)) * flamme;
  const penche = 0.1 * Math.sin(frame * 0.55);
  const chaud = Math.sin(frame * 1.3) > 0.2;
  return (
    <group position={SALON.bougie}>
      <Bloc p={[0, 0.03, 0]} s={[0.36, 0.06, 0.36]} c="#B8963E" t={t} />
      <Bloc p={[0.2, 0.07, 0]} s={[0.12, 0.05, 0.1]} c="#B8963E" t={t} />
      <Bloc p={[0, 0.09, 0]} s={[0.2, 0.06, 0.2]} c="#A6842F" t={t} />
      <Bloc p={[0, 0.33, 0]} s={[0.15, 0.44, 0.15]} c="#F3EBD3" t={flamme > 0.05 ? [1.1, 1.0, 0.8] : t} />
      <Bloc p={[0, 0.57, 0]} s={[0.025, 0.05, 0.025]} c="#2A2A2A" />
      {flamme > 0.03 && (
        <group position={[0, 0.6, 0]} rotation={[0, 0, penche]}>
          <Bloc p={[0, h / 2, 0]} s={[0.1, h, 0.1]} c={chaud ? "#FFB23F" : "#FFA42E"} r={[0, Math.PI / 4, 0]} brut />
          <Bloc p={[0, h * 0.36, 0]} s={[0.055, h * 0.62, 0.055]} c="#FFE28A" r={[0, Math.PI / 4, 0]} brut />
        </group>
      )}
      {flamme > 0.03 && <Lueur p={[0, 0.68, 0]} s={1.5 * (0.7 + 0.3 * flamme)} c="#FFC766" o={0.5 * flamme} />}
      {fumee > 0.01 && fumee < 1 && (
        <>
          <Bloc p={[0.02 * Math.sin(fumee * 9), 0.66 + fumee * 0.75, 0]} s={[0.07, 0.07, 0.07]} c="#B9BCC6" opacite={0.7 * (1 - fumee)} brut />
          <Bloc p={[-0.03 * Math.sin(fumee * 7), 0.6 + fumee * 0.45, 0]} s={[0.05, 0.05, 0.05]} c="#B9BCC6" opacite={0.6 * (1 - fumee)} brut />
        </>
      )}
    </group>
  );
};

/** Horloge de rue à quatre cadrans : aiguilles noires, trotteuse rouge. */
const Horloge: React.FC<{ minutes: number; secondes?: number; t: Teinte }> = ({ minutes, secondes, t }) => {
  const aMin = -(minutes / 60) * Math.PI * 2;
  const aH = -(minutes / 720) * Math.PI * 2;
  const blanc = teinteZone([Math.min(1, t[0] * 2.4), Math.min(1, t[1] * 2.05), Math.min(1, t[2] * 1.33)]);
  return (
    <group position={[HORLOGE[0], HORLOGE_CADRAN_Y, HORLOGE[2]]}>
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ry) => (
        <group key={ry} rotation={[0, ry, 0]}>
          <mesh position={[0, 0, 0.756]}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshBasicMaterial map={cadran()} color={blanc} />
          </mesh>
          <group position={[0, 0, 0.77]} rotation={[0, 0, aH]}>
            <Bloc p={[0, 0.15, 0]} s={[0.1, 0.38, 0.03]} c="#15151A" brut />
          </group>
          <group position={[0, 0, 0.79]} rotation={[0, 0, aMin]}>
            <Bloc p={[0, 0.22, 0]} s={[0.065, 0.56, 0.03]} c="#15151A" brut />
          </group>
          {secondes !== undefined && (
            <group position={[0, 0, 0.805]} rotation={[0, 0, -(secondes / 60) * Math.PI * 2]}>
              <Bloc p={[0, 0.2, 0]} s={[0.03, 0.66, 0.02]} c="#D0352E" brut />
            </group>
          )}
          <Bloc p={[0, 0, 0.815]} s={[0.12, 0.12, 0.03]} c="#B5352E" brut />
        </group>
      ))}
    </group>
  );
};

/** Battant de fenêtre (cadre blanc + vitre), charnière sur son bord x = 0. */
const Battant: React.FC<{ w: number; h: number; sens: 1 | -1; t: Teinte; allumee: number; nuit: boolean }> = ({ w, h, sens, t, allumee, nuit }) => (
  <group>
    <Bloc p={[(sens * w) / 2, h / 2 - 0.05, 0]} s={[w, 0.1, 0.08]} c="#EFEDE6" t={t} />
    <Bloc p={[(sens * w) / 2, -h / 2 + 0.05, 0]} s={[w, 0.1, 0.08]} c="#EFEDE6" t={t} />
    <Bloc p={[sens * 0.05, 0, 0]} s={[0.1, h, 0.08]} c="#EFEDE6" t={t} />
    <Bloc p={[sens * (w - 0.05), 0, 0]} s={[0.1, h, 0.08]} c="#EFEDE6" t={t} />
    <Bloc p={[(sens * w) / 2, 0.22, 0]} s={[w - 0.2, 0.07, 0.06]} c="#EFEDE6" t={t} />
    <Vitre p={[(sens * w) / 2, 0, 0]} s={[w - 0.18, h - 0.18]} allumee={allumee} nuit={nuit} />
  </group>
);

export const Decor: React.FC<{ e: Etat; frame: number }> = ({ e, frame }) => {
  const zones = useMemo(() => construireMonde(), []);
  const nuit = e.heure === "nuit";
  const tExt = nuit ? T_NUIT : T_AUBE;
  const tSalon = nuit ? melTeinte(T_NOIR, T_BOUGIE, e.salon.lumiere) : T_INTERIEUR_AUBE;
  const tChambre = e.chambre.lampe ? T_CHAMBRE_LAMPE : nuit ? T_CHAMBRE_NUIT : T_INTERIEUR_AUBE;
  const salonAllume = nuit && e.salon.lumiere > 0.15;
  const chambreAllumee = e.chambre.lampe ? 1 : 0;
  // halo des fenêtres allumées : seulement vu de loin (de près, on regarde à travers la vitre)
  const loin = (p: V3) => Math.min(1, Math.max(0, (Math.hypot(e.cam.pos[0] - p[0], e.cam.pos[1] - p[1], e.cam.pos[2] - p[2]) - 12) / 14));
  const centreC = versMonde(MAISON_C.o, MAISON_C.ry, [(FEN_C.x0 + FEN_C.x1) / 2, (FEN_C.y0 + FEN_C.y1) / 2, 0.4]);
  const centreJ = versMonde(MAISON_J.o, MAISON_J.ry, [(FEN_J.x0 + FEN_J.x1) / 2, (FEN_J.y0 + FEN_J.y1) / 2, 0.4]);
  const fj = FEN_J;
  const wj = (fj.x1 - fj.x0) / 2;
  const hj = fj.y1 - fj.y0;
  const ouv = e.chambre.ouverture * 1.85;
  const [lx, ly, lz] = CHAMBRE.lampe;
  const lune: V3 = [90, 76, -361];

  return (
    <>
      {/* ---- ciel */}
      {nuit ? (
        <>
          <mesh geometry={zones.etoiles} renderOrder={-10}>
            <meshBasicMaterial color="#FFFFFF" depthWrite={false} />
          </mesh>
          <mesh position={lune} rotation={[0.2, -0.244, 0, "YXZ"]} renderOrder={-9}>
            <circleGeometry args={[24, 48]} />
            <meshBasicMaterial color="#FFFFFF" depthWrite={false} />
          </mesh>
        </>
      ) : (
        <>
          <mesh renderOrder={-10}>
            <sphereGeometry args={[430, 24, 16]} />
            <meshBasicMaterial map={cielAube()} side={THREE.BackSide} depthWrite={false} />
          </mesh>
          <mesh position={[153, 59, -343]} rotation={[0.157, -0.419, 0, "YXZ"]} renderOrder={-9}>
            <circleGeometry args={[30, 48]} />
            <meshBasicMaterial color="#FFF1B5" depthWrite={false} />
          </mesh>
          {(
            [
              [-150, 96, -330, 1],
              [40, 122, -350, 1.3],
              [210, 104, -300, 0.9],
              [-290, 110, -180, 1.1],
            ] as Array<[number, number, number, number]>
          ).map(([x, y, z, s], i) => (
            <group key={i} position={[x, y, z]} scale={s} rotation={[0, Math.atan2(-x, -z), 0]}>
              <Bloc s={[70, 12, 16]} c="#FFE6EA" brut />
              <Bloc p={[-14, 9, 0]} s={[34, 10, 14]} c="#FFEFF1" brut />
              <Bloc p={[20, 7, 0]} s={[26, 8, 14]} c="#FFEFF1" brut />
            </group>
          ))}
        </>
      )}

      {/* ---- zones fixes */}
      <Zone g={zones.ext} t={tExt} />
      <Zone g={zones.salon} t={tSalon} />
      {e.salon.meubles && <Zone g={zones.salonMeubles} t={tSalon} />}
      <Zone g={zones.chambre} t={tChambre} />

      {/* ---- maison C : vitre, bougie, photo du fils */}
      <group position={MAISON_C.o} rotation={[0, MAISON_C.ry, 0]}>
        <Vitre p={[(FEN_C.x0 + FEN_C.x1) / 2, (FEN_C.y0 + FEN_C.y1) / 2, -0.2]} s={[FEN_C.x1 - FEN_C.x0, FEN_C.y1 - FEN_C.y0]} allumee={salonAllume ? e.salon.lumiere : 0} nuit={nuit} claire />
        {e.salon.meubles && (
          <>
            <Bougie flamme={e.salon.flamme} fumee={e.salon.fumee} frame={frame} t={tSalon} />
            <mesh position={[SALON.photo[0], SALON.photo[1], SALON.photo[2] - 0.055]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.7, 0.92]} />
              <meshBasicMaterial map={photoFils()} color={teinteZone([Math.min(1, tSalon[0]), Math.min(1, tSalon[1]), Math.min(1, tSalon[2])])} />
            </mesh>
          </>
        )}
        {salonAllume && <Tache p={[(FEN_C.x0 + FEN_C.x1) / 2, 0.08, 2.2]} s={[5.6, 5.0]} c="#FFC766" o={0.5 * e.salon.lumiere} />}
        {!nuit && <Tache p={[1.2, SOL + 0.06, -2.3]} s={[4.6, 4.2]} c="#FFE9C4" o={0.5} />}
      </group>
      {salonAllume && loin(centreC) > 0.02 && <Lueur p={centreC} s={7.5} c="#FFD27A" o={0.4 * loin(centreC) * e.salon.lumiere} />}
      {e.chambre.lampe && loin(centreJ) > 0.02 && <Lueur p={centreJ} s={7} c="#FFE28A" o={0.4 * loin(centreJ)} />}

      {/* ---- maison J : battants, lampe, réveil, interrupteur, enveloppe */}
      <group position={MAISON_J.o} rotation={[0, MAISON_J.ry, 0]}>
        <group position={[fj.x0, (fj.y0 + fj.y1) / 2, -0.14]} rotation={[0, -ouv, 0]}>
          <Battant w={wj} h={hj} sens={1} t={tExt} allumee={chambreAllumee} nuit={nuit} />
        </group>
        <group position={[fj.x1, (fj.y0 + fj.y1) / 2, -0.14]} rotation={[0, ouv, 0]}>
          <Battant w={wj} h={hj} sens={-1} t={tExt} allumee={chambreAllumee} nuit={nuit} />
        </group>
        {/* abat-jour : OFF #665A43, ON #FFE28A (changement immédiat) */}
        <Bloc p={[lx, ly + 0.78, lz]} s={[0.52, 0.36, 0.52]} c={e.chambre.lampe ? "#FFE28A" : "#665A43"} t={e.chambre.lampe ? undefined : tChambre} brut={e.chambre.lampe} />
        <Bloc p={[lx, ly + 0.97, lz]} s={[0.34, 0.04, 0.34]} c={e.chambre.lampe ? "#FFF3C4" : "#5A4F3B"} t={e.chambre.lampe ? undefined : tChambre} brut={e.chambre.lampe} />
        <Bloc p={[lx, ly + 0.58, lz]} s={[0.12, 0.1, 0.12]} c={e.chambre.lampe ? "#FFF6D0" : "#8A8470"} t={e.chambre.lampe ? undefined : tChambre} brut={e.chambre.lampe} />
        {e.chambre.lampe && (
          <>
            <Lueur p={[lx, ly + 0.76, lz]} s={2.3} c="#FFE28A" o={0.42} />
            <Tache p={[lx + 0.25, ly + 0.012, lz - 0.02]} s={[2.3, 1.0]} c="#FFF0B8" o={0.55} />
            <Tache p={[(fj.x0 + fj.x1) / 2, 0.08, 2.2]} s={[5.2, 5.0]} c="#FFE28A" o={0.5} />
          </>
        )}
        <mesh position={[CHAMBRE.reveil[0], CHAMBRE.reveil[1] + 0.17, CHAMBRE.reveil[2] + 0.125]}>
          <planeGeometry args={[0.62, 0.27]} />
          <meshBasicMaterial map={reveil(e.chambre.reveil)} />
        </mesh>
        <Bloc p={[CHAMBRE.interrupteur[0] + 0.05, CHAMBRE.interrupteur[1], CHAMBRE.interrupteur[2]]} s={[0.05, 0.24, 0.13]} c="#CFCABC" t={tChambre} r={[0, 0, e.chambre.lampe ? 0.3 : -0.3]} />
        {e.enveloppeAuSol && (
          <group position={[PORTE_J_X + 0.08, SOL + 0.075, 0.74]} rotation={[-Math.PI / 2, 0, 0.28]}>
            <Enveloppe rabat={0} photo={0} t={tExt} />
          </group>
        )}
      </group>

      {/* ---- maison B : la fenêtre jaune de 23 h 50 */}
      {e.fenB && (
        <group position={MAISON_B.o} rotation={[0, MAISON_B.ry, 0]}>
          <mesh position={[FEN_B.x, FEN_B.y, 0.064]}>
            <planeGeometry args={[FEN_B.w, FEN_B.h]} />
            <meshBasicMaterial color="#FFD66B" />
          </mesh>
          <Tache p={[FEN_B.x, 0.08, 2.2]} s={[4.6, 4.6]} c="#FFD66B" o={0.46} />
        </group>
      )}

      {/* ---- horloge de rue et lampadaires */}
      <Horloge minutes={e.horloge} secondes={e.secondes} t={tExt} />
      {LAMPADAIRES.map((l, i) => {
        const b = versMonde(l.p, l.ry, [0, TETE_LAMPADAIRE + 0.02, 1.1]);
        const on = e.lampadaires && nuit;
        return (
          <group key={i}>
            <group position={b} rotation={[0, l.ry, 0]}>
              <Bloc s={[0.42, 0.07, 0.68]} c={on ? "#FFE9A8" : "#A3A39B"} t={on ? undefined : tExt} brut={on} />
            </group>
            {on && (
              <>
                <Lueur p={[b[0], b[1] - 0.05, b[2]]} s={2.6} c="#FFE2A0" o={0.5} />
                <Tache p={[b[0], 0.2, b[2]]} s={[10, 10]} c="#FFDB8E" o={0.46} />
              </>
            )}
          </group>
        );
      })}
    </>
  );
};
