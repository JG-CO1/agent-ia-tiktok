/**
 * « Ville interdite » — éléments dynamiques : table et chambre (plans texturés), main géante, œil énorme, pince, sirène à ondes,
 * ombre d'une main, lettres des cubes, étiquette de la boîte, abat-jour de la lampe, personnages (accessoires : épis de Léo, toque).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Avatar, Bloc, HANCHE, teinter, type Teinte } from "../../avatar";
import type { Acteur } from "../../ville/foule";
import { Lueur } from "../lib";
import { BOITE, CUBES, HAUT_SIRENE, LAMPE, SIRENE_POS, TABLE, Y_SOL, Y_TABLE } from "./monde";
import { texBois, texEtiquette, texIris, texLettre, texOmbreMain, texOnde, texTapis, texTapisserie } from "./toile";

const PEAU = "#E9967A";

// ------------------------------------------------------------------ Table, plancher, murs de la chambre
export const Chambre: React.FC<{ t: Teinte; mur: boolean }> = ({ t, mur }) => {
  const bois = useMemo(() => {
    const x = texBois().clone();
    x.needsUpdate = true;
    x.repeat.set((TABLE.x1 - TABLE.x0) / 40, (TABLE.z1 - TABLE.z0) / 40);
    return x;
  }, []);
  const papier = useMemo(() => {
    const x = texTapisserie().clone();
    x.needsUpdate = true;
    x.repeat.set(1040 / 160, 1500 / 160);
    return x;
  }, []);
  const papierL = useMemo(() => {
    const x = texTapisserie().clone();
    x.needsUpdate = true;
    x.repeat.set(950 / 160, 1500 / 160);
    return x;
  }, []);
  const c = teinter("#FFFFFF", t);
  const zc = (TABLE.z0 + TABLE.z1) / 2;
  return (
    <>
      {/* dessus de la table */}
      <mesh position={[0, Y_TABLE, zc]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TABLE.x1 - TABLE.x0, TABLE.z1 - TABLE.z0]} />
        <meshBasicMaterial map={bois} color={c} />
      </mesh>
      {/* plancher et tapis */}
      <mesh position={[0, Y_SOL, 45]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1040, 950]} />
        <meshBasicMaterial color={teinter("#C79A66", t)} />
      </mesh>
      <mesh position={[0, Y_SOL + 0.2, -30]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[760, 640]} />
        <meshBasicMaterial map={texTapis()} color={c} />
      </mesh>
      {/* ombre de la table sur le tapis : repère de profondeur du vide */}
      <mesh position={[16, Y_SOL + 0.4, zc + 10]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[TABLE.x1 - TABLE.x0 + 30, TABLE.z1 - TABLE.z0 + 30]} />
        <meshBasicMaterial color="#1B1008" transparent opacity={0.34} depthWrite={false} />
      </mesh>
      {mur && (
        <>
          <mesh position={[0, Y_SOL + 750, -430]}>
            <planeGeometry args={[1040, 1500]} />
            <meshBasicMaterial map={papier} color={c} />
          </mesh>
          <mesh position={[0, Y_SOL + 750, 520]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1040, 1500]} />
            <meshBasicMaterial map={papier} color={c} />
          </mesh>
          <mesh position={[-520, Y_SOL + 750, 45]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[950, 1500]} />
            <meshBasicMaterial map={papierL} color={c} />
          </mesh>
          <mesh position={[520, Y_SOL + 750, 45]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[950, 1500]} />
            <meshBasicMaterial map={papierL} color={c} />
          </mesh>
        </>
      )}
    </>
  );
};

/** Lettres des cubes de l'alphabet + étiquette de la boîte. */
export const JouetsTextes: React.FC<{ t: Teinte }> = ({ t }) => {
  const c = teinter("#FFFFFF", t);
  return (
    <>
      {CUBES.map((cu, i) => {
        const h = cu.s / 2 + 0.05;
        const w = cu.s * 0.82;
        const faces: Array<[V3, V3, string]> = [
          [[0, 0, h], [0, 0, 0], cu.lettres[0]],
          [[h, 0, 0], [0, Math.PI / 2, 0], cu.lettres[1]],
          [[-h, 0, 0], [0, -Math.PI / 2, 0], cu.lettres[2]],
          [[0, h, 0], [-Math.PI / 2, 0, 0], cu.lettres[3]],
        ];
        return faces.map(([p, r, l], k) => (
          <mesh key={`${i}-${k}`} position={[cu.p[0] + p[0], cu.p[1] + p[1], cu.p[2] + p[2]]} rotation={r}>
            <planeGeometry args={[w, w]} />
            <meshBasicMaterial map={texLettre(l, cu.coul)} color={c} />
          </mesh>
        ));
      })}
      <mesh position={[BOITE.x, BOITE.h + 8.2, BOITE.z - BOITE.d / 2 + 1.27]}>
        <planeGeometry args={[30, 7.5]} />
        <meshBasicMaterial map={texEtiquette()} color={c} />
      </mesh>
    </>
  );
};

/** Abat-jour de la lampe de chevet : lumineux (le « soleil » de la ville). */
export const AbatJour: React.FC<{ o: number }> = ({ o }) => (
  <>
    <mesh position={[LAMPE[0], 40, LAMPE[2]]}>
      <cylinderGeometry args={[17, 26, 52, 16, 1, true]} />
      <meshBasicMaterial color="#FFD58A" side={THREE.DoubleSide} fog={false} />
    </mesh>
    <mesh position={[LAMPE[0], 66.2, LAMPE[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[17, 16]} />
      <meshBasicMaterial color="#FFF2C8" fog={false} />
    </mesh>
    <Lueur p={[LAMPE[0], 40, LAMPE[2]]} s={380} c="#FFC468" o={0.85 * o} />
    <Lueur p={[LAMPE[0] + 30, 42, LAMPE[2]]} s={900} c="#FFB050" o={0.38 * o} />
  </>
);

// ------------------------------------------------------------------ Personnages : accessoires posés sur la tête
const Tete: React.FC<{ a: Acteur; children: React.ReactNode }> = ({ a, children }) => {
  const [lacet, tangage] = a.pose.tete ?? [0, 0];
  return (
    <group position={a.p} rotation={[a.rx, a.ry, 0, "YXZ"]} scale={a.echelle}>
      <group position={[0, HANCHE + (a.pose.y ?? 0), 0]}>
        <group rotation={[a.pose.torse ?? 0, 0, 0]}>
          <group position={[0, 1.0, 0]} rotation={[tangage, lacet, 0, "YXZ"]}>{children}</group>
        </group>
      </group>
    </group>
  );
};
const Epis: React.FC<{ t: Teinte; c: string }> = ({ t, c }) => (
  <>
    {([[-0.3, 0.12, 0.2], [-0.05, 0.16, 0.5], [0.24, 0.1, -0.25], [-0.12, 0.14, -0.3], [0.12, 0.17, 0.1], [0.34, 0.1, 0.4]] as Array<[number, number, number]>).map(([x, tz, tilt], i) => (
      <Bloc key={i} p={[x, 0.98 + tz, 0.15 - i * 0.07]} s={[0.2, 0.34, 0.2]} c={c} t={t} r={[0.1 * (i % 3 - 1), 0, tilt]} />
    ))}
  </>
);
const Toque: React.FC<{ t: Teinte }> = ({ t }) => (
  <>
    <Bloc p={[0, 0.92, 0]} s={[0.9, 0.16, 0.9]} c="#F4EFE2" t={t} />
    <Bloc p={[0, 1.25, 0]} s={[1.0, 0.55, 1.0]} c="#FFFFFF" t={t} />
    <Bloc p={[0, 1.58, 0]} s={[1.14, 0.2, 1.14]} c="#FFFFFF" t={t} />
  </>
);
const OmbreSol: React.FC<{ a: Acteur }> = ({ a }) => (
  <mesh position={[a.p[0] + 1.1 * a.echelle, a.p[1] + 0.07, a.p[2] - 0.5 * a.echelle]} rotation={[-Math.PI / 2, 0, 0]} scale={[3.0 * a.echelle, 0.62 * a.echelle, 1]} renderOrder={1}>
    <circleGeometry args={[1, 14]} />
    <meshBasicMaterial color="#1A1020" transparent opacity={0.5} depthWrite={false} />
  </mesh>
);
export const Perso: React.FC<{ id: string; a: Acteur; frame: number; T: number; t: Teinte; ombre: boolean }> = ({ id, a, frame, t, ombre }) => (
  <group>
    <Avatar p={a.p} ry={a.ry} pose={a.pose} tenue={a.tenue} emotion={a.emotion} frame={frame} graine={a.graine} teinte={t} echelle={a.echelle} sansClin={a.sansClin} clinRapide={a.clinRapide} opacite={1} rx={a.rx} />
    {id.startsWith("leo") && (
      <Tete a={a}>
        <Epis t={t} c={a.tenue.cheveux} />
      </Tete>
    )}
    {id === "boul" && (
      <Tete a={a}>
        <Toque t={t} />
      </Tete>
    )}
    {ombre && a.rx === 0 && a.p[1] > -1 && a.p[1] < 12 && <OmbreSol a={a} />}
  </group>
);

// ------------------------------------------------------------------ Main géante (palme vers le bas, doigts vers +x local, bras vers -x local)
const Phalange: React.FC<{ seg: number[]; larg: number; ep: number; ang: number[]; t: Teinte; sens?: 1 | -1 }> = ({ seg, larg, ep, ang, t }) => (
  <group rotation={[0, 0, -ang[0]]}>
    <Bloc p={[seg[0] / 2, 0, 0]} s={[seg[0], ep, larg]} c={PEAU} t={t} />
    <group position={[seg[0], 0, 0]} rotation={[0, 0, -ang[1]]}>
      <Bloc p={[seg[1] / 2, 0, 0]} s={[seg[1], ep * 0.97, larg * 0.98]} c={PEAU} t={t} />
      <group position={[seg[1], 0, 0]} rotation={[0, 0, -ang[2]]}>
        <Bloc p={[seg[2] / 2, 0, 0]} s={[seg[2], ep * 0.94, larg * 0.96]} c={PEAU} t={t} />
        <Bloc p={[seg[2] * 0.62, ep * 0.5 + 0.02, 0]} s={[seg[2] * 0.7, 0.14, larg * 0.62]} c="#F8CDB8" t={t} />
      </group>
    </group>
  </group>
);
/** `p` = dessous de la paume. curl 0 = main ouverte, 1 = doigts refermés contre le mur. */
export const Main: React.FC<{ p: V3; ry: number; curl: number; t: Teinte }> = ({ p, ry, curl, t }) => {
  const k = curl;
  const bomb = (a: number, b: number, c: number) => [0.1 + k * a, 0.14 + k * b, 0.1 + k * c];
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Bloc p={[0, 1.8, 0]} s={[20, 3.6, 16]} c={PEAU} t={t} />
      <Bloc p={[-2, 3.7, 0]} s={[12, 0.3, 11]} c="#EBA48A" t={t} />
      {[-6.15, -2.05, 2.05, 6.15].map((z, i) => (
        <group key={z} position={[10.2, 1.8, z]}>
          <Phalange seg={[3.8, 3.1, 2.4].map((s) => s * [0.95, 1.08, 1.02, 0.86][i])} larg={3.4} ep={3.0} ang={bomb(1.28, 0.5, 0.3)} t={t} />
        </group>
      ))}
      <group position={[-10.2, 1.8, 6.4]} rotation={[0, Math.PI, 0]}>
        <Phalange seg={[3.9, 3.2, 2.6]} larg={3.9} ep={3.3} ang={bomb(1.2, 0.5, 0.25)} t={t} />
      </group>
      {/* poignet, avant-bras et manche bleue qui monte hors champ */}
      <group position={[-10, 2.0, 0]} rotation={[0, 0, -0.5]}>
        <Bloc p={[-9, 0, 0]} s={[20, 7.4, 9.4]} c={PEAU} t={t} />
        <Bloc p={[-30, 0, 0]} s={[24, 9.4, 11.6]} c="#3A6BC8" t={t} />
        <Bloc p={[-19.3, 0, 0]} s={[2.4, 9.6, 11.8]} c="#F4EFE2" t={t} />
        <Bloc p={[-80, 0, 0]} s={[76, 11, 13]} c="#3A6BC8" t={t} />
      </group>
    </group>
  );
};

/** Pince de deux doigts (pouce et index) qui descend du ciel, serre un personnage à la taille et l'emporte. */
export const Pince: React.FC<{ p: V3; ouv: number; t: Teinte }> = ({ p, ouv, t }) => (
  <group position={p}>
    {[-1, 1].map((s) => (
      <group key={s} position={[s * (0.75 + ouv * 2.4), 0, 0]}>
        <Bloc p={[0, 38, 0]} s={[3.4, 76, 3.6]} c={PEAU} t={t} />
        <Bloc p={[s * -0.5, 0.2, 0.2]} s={[2.6, 2.2, 3.0]} c={PEAU} t={t} />
        <Bloc p={[s * -0.2, 0.2, 1.7]} s={[1.9, 1.5, 0.3]} c="#F8CDB8" t={t} />
      </group>
    ))}
  </group>
);

/** Ombre d'une main géante, à plat (`y` = hauteur du plan), orientée par `rot` (0 = doigts vers -z). */
export const OmbreMain: React.FC<{ p: V3; rot: number; taille: number; o: number }> = ({ p, rot, taille, o }) => (
  <mesh position={p} rotation={[-Math.PI / 2, 0, rot]} renderOrder={5}>
    <planeGeometry args={[taille, taille]} />
    <meshBasicMaterial map={texOmbreMain()} color="#0B0610" transparent opacity={o} depthWrite={false} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
  </mesh>
);

// ------------------------------------------------------------------ Sirène (cornes qui tournent, feu clignotant, ondes qui s'étendent)
export const Sirene: React.FC<{ T: number; actif: number }> = ({ T, actif }) => {
  const [sx, , sz] = SIRENE_POS;
  const y = HAUT_SIRENE + 0.6;
  return (
    <>
      <group position={[sx, y, sz]} rotation={[0, T * 1.6, 0]}>
        <Bloc p={[0, 0, 0]} s={[1.4, 1.2, 1.4]} c="#33333D" />
        <Bloc p={[1.3, 0.1, 0]} s={[2.4, 1.1, 1.1]} c="#D1332B" />
        <Bloc p={[2.7, 0.1, 0]} s={[0.5, 1.7, 1.7]} c="#F4EFE2" />
        <Bloc p={[-1.3, 0.1, 0]} s={[2.4, 1.1, 1.1]} c="#D1332B" />
        <Bloc p={[-2.7, 0.1, 0]} s={[0.5, 1.7, 1.7]} c="#F4EFE2" />
      </group>
      {actif > 0.02 && (
        <>
          <Lueur p={[sx, y + 1.3, sz]} s={9} c="#FF5A3C" o={actif * (0.45 + 0.35 * Math.sin(T * 9))} />
          {[0, 1, 2].map((k) => {
            const ph = (T * 0.8 + k / 3) % 1;
            return (
              <sprite key={k} position={[sx, y, sz]} scale={[8 + ph * 78, 8 + ph * 78, 1]} renderOrder={3}>
                <spriteMaterial map={texOnde()} color="#FFE8C0" transparent opacity={actif * 0.55 * (1 - ph)} depthWrite={false} />
              </sprite>
            );
          })}
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ Œil énorme
const scleraGeo = (() => {
  let g: THREE.BufferGeometry | null = null;
  return () => {
    if (!g) {
      g = new THREE.SphereGeometry(1, 22, 14);
      const pos = g.getAttribute("position");
      const nor = g.getAttribute("normal");
      const col = new Float32Array(pos.count * 3);
      const base = new THREE.Color("#F7EEE6");
      const rose = new THREE.Color("#E8AFA6");
      for (let i = 0; i < pos.count; i++) {
        const n = new THREE.Vector3(nor.getX(i), nor.getY(i), nor.getZ(i));
        const k = 0.66 + 0.34 * Math.max(0, n.z * 0.7 + n.y * 0.45 - n.x * 0.2);
        const m = THREE.MathUtils.smoothstep(Math.abs(pos.getX(i)), 0.62, 1.0);
        const c = base.clone().lerp(rose, m * 0.8);
        col.set([c.r * k, c.g * k, c.b * k], i * 3);
      }
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }
    return g;
  };
})();
/** L'œil d'un enfant géant, vu de très près : le repère local regarde vers +z (vers `cible`). `ouv` 1 = ouvert, 0 = fermé. */
export const Oeil: React.FC<{ p: V3; cible: V3; S: number; ouv: number; colere?: number; regard?: [number, number]; pupille?: number; t: Teinte }> = ({ p, cible, S, ouv, colere = 0, regard = [0, 0], pupille = 1, t }) => {
  const q = useMemo(() => {
    const m = new THREE.Matrix4();
    m.lookAt(new THREE.Vector3(...cible), new THREE.Vector3(...p), new THREE.Vector3(0, 1, 0));
    return new THREE.Quaternion().setFromRotationMatrix(m);
  }, [p[0], p[1], p[2], cible[0], cible[1], cible[2]]);
  const o = Math.min(1, Math.max(0, ouv));
  const edgeU = (x: number) => -2 + (15 + 2) * o - (Math.abs(x) / 24) ** 2 * 7 * o;
  const edgeL = (x: number) => 2 - (15 + 2) * (0.78 * o) + (Math.abs(x) / 24) ** 2 * 4 * o;
  const xs = [-19.2, -9.6, 0, 9.6, 19.2];
  const skin = "#E9B391";
  const [gx, gy] = regard;
  return (
    <group position={p} quaternion={q} scale={S}>
      {/* visage : plaque, nez, pommette, cheveux */}
      <Bloc p={[0, 0, -2]} s={[170, 112, 6]} c={skin} t={t} />
      <Bloc p={[-38, -6, 1]} s={[16, 44, 14]} c="#DFA382" t={t} />
      <Bloc p={[30, -34, 2]} s={[70, 16, 9]} c="#EFBFA0" t={t} />
      <Bloc p={[0, 62, 1]} s={[176, 28, 12]} c="#6B4423" t={t} />
      <Bloc p={[-40, 52, 8]} s={[40, 14, 8]} c="#7A5029" t={t} r={[0, 0, 0.12]} />
      <Bloc p={[28, 52, 8]} s={[50, 12, 8]} c="#7A5029" t={t} r={[0, 0, -0.08]} />
      {/* globe */}
      <mesh geometry={scleraGeo()} scale={[24, 14.6, 12]}>
        <meshBasicMaterial vertexColors color={teinter("#FFFFFF", t)} />
      </mesh>
      <mesh position={[gx, gy, 12.35]}>
        <circleGeometry args={[10.8, 36]} />
        <meshBasicMaterial map={texIris()} color={teinter("#FFFFFF", t)} />
      </mesh>
      <mesh position={[gx, gy, 12.42]} scale={[pupille, pupille, 1]}>
        <circleGeometry args={[4.5, 28]} />
        <meshBasicMaterial color="#05030A" />
      </mesh>
      <mesh position={[gx - 3.6, gy + 3.8, 12.5]}>
        <planeGeometry args={[2.6, 3.2]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[gx + 2.9, gy - 2.6, 12.5]}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* paupières */}
      {xs.map((x, i) => (
        <React.Fragment key={x}>
          <Bloc p={[x, edgeU(x) + 11, 6.5]} s={[9.7, 22, 13]} c="#E3A683" t={t} />
          <Bloc p={[x, edgeL(x) - 11, 6.5]} s={[9.7, 22, 13]} c="#E8AD8B" t={t} />
          {void i}
        </React.Fragment>
      ))}
      {/* cils */}
      {[-20.5, -15.4, -10.3, -5.1, 0, 5.1, 10.3, 15.4, 20.5].map((x) => (
        <Bloc key={x} p={[x, edgeU(x) - 2.2, 13.3]} s={[1.1, 5.4, 1.2]} c="#2A160C" t={t} r={[-0.25, 0, -x * 0.022]} />
      ))}
      {/* sourcils */}
      <Bloc p={[-14, 27 - colere * 7, 9]} s={[26, 6.4, 8]} c="#3A2412" t={t} r={[0, 0, -colere * 0.5 + 0.05]} />
      <Bloc p={[14, 27 - colere * 7, 9]} s={[26, 6.4, 8]} c="#3A2412" t={t} r={[0, 0, colere * 0.5 - 0.05]} />
    </group>
  );
};
