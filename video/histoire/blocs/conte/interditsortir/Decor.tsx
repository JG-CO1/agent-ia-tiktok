/**
 * « Dans cette ville, personne n'a le droit de sortir depuis trois ans… » — décor dynamique : ciel qui descend du rouge au bleu nuit,
 * soleil rasant, brume de la vallée, ville A et sa jumelle B (miroir exact), sirènes, grandes portes, lumières qui s'allument, feu d'artifice
 * du souvenir, intérieur de la tour et cuisine. Seul le lieu où se trouve la caméra est dessiné (dioramas à plus de 400 unités).
 */
import React from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Bloc, type Teinte } from "../../avatar";
import { Ciel, Faisceau, Lueur, OBJETS, Silhouette, Tache, mainDroite, type DonneesConte, type EtatConte } from "../lib";
import { entre, lisse, mel } from "../../maths";
import type { Acteur } from "../../ville/foule";
import { couleursCiel, hexMel, phase } from "./ciel";
import { CUISINE, CU, ECHELLE_X, FENTES_TOUR, LAMPES, SOMMET_ECHELLE, TI, TORCHES_TOUR, TOUR_INT, VAR_EXT, ZB, construireCuisine, construireExt, construireTour, mir } from "./monde";
import { Brume, Feu, Perso, Pancarte, Porte, Sirene, Voute } from "./objets";
import { texCalendrier, texHorloge, texPhoto } from "./toile";

export const cielInterditsortir = (e?: EtatConte) => e?.ciel ?? "#C8506C";

type Lieu = "ext" | "tour" | "cuisine";
const lieuDe = (p: V3): Lieu => (p[0] > 200 ? "tour" : p[0] < -200 ? "cuisine" : "ext");

// ------------------------------------------------------------------ Géométries (construites une seule fois par page)
type ExtG = { sol: THREE.BufferGeometry[]; lum0: THREE.BufferGeometry; lum1: THREE.BufferGeometry; ombres: THREE.BufferGeometry[] };
let extC: ExtG | null = null;
function ext(): ExtG {
  if (!extC) {
    const z = construireExt();
    extC = {
      sol: z.couleurs.map((c) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", z.solide.getAttribute("position"));
        g.setAttribute("color", new THREE.BufferAttribute(c, 3));
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -33), 900);
        return g;
      }),
      lum0: z.lum0,
      lum1: z.lum1,
      ombres: z.ombres,
    };
    for (const g of [extC.lum0, extC.lum1, ...extC.ombres]) g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -33), 900);
  }
  return extC;
}
type IntG = { sol: THREE.BufferGeometry; lum: THREE.BufferGeometry };
function fabInt(z: { solide: THREE.BufferGeometry; couleurs: Float32Array[]; lum: THREE.BufferGeometry }): IntG {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", z.solide.getAttribute("position"));
  g.setAttribute("color", new THREE.BufferAttribute(z.couleurs[0], 3));
  g.computeBoundingSphere();
  return { sol: g, lum: z.lum };
}
let tourC: IntG | null = null;
let cuisC: IntG | null = null;
const tour = () => (tourC ??= fabInt(construireTour()));
const cuisine = () => (cuisC ??= fabInt(construireCuisine()));

// ------------------------------------------------------------------ Acteurs visibles
type Vis = { id: string; a: Acteur; d: number };
function visibles2(data: DonneesConte, T: number, cam: V3, lieu: Lieu, portee: number): Vis[] {
  const out: Vis[] = [];
  for (const h of data.habitants) {
    const a = data.acteur(h.id, T);
    if (!a || lieuDe(a.p) !== lieu) continue;
    const d = Math.hypot(a.p[0] - cam[0], a.p[1] - cam[1], a.p[2] - cam[2]);
    if (d < portee) out.push({ id: h.id, a, d });
  }
  return out.sort((u, v) => u.d - v.d);
}

const flick = (T: number, i = 0) => 0.85 + 0.15 * Math.sin(T * 17 + i * 3.1) * Math.sin(T * 7.3 + i);

export const MondeInterditsortir: React.FC<{ e: EtatConte; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const T = frame / 30;
  const cam = e.cam.pos;
  const lieu = lieuDe(cam);
  const ev = data.ev;
  const ph = phase(T);
  const v = T < ev.cut1 ? 0 : T < ev.cut2 ? 1 : 2;
  const teinte: Teinte = lieu === "ext" ? (v === 0 ? [1.14, 0.84, 0.74] : v === 1 ? [1.0, 0.76, 0.84] : [0.66, 0.74, 1.02]) : lieu === "tour" ? [1.1, 0.84, 0.66] : [1.1, 0.92, 0.76];
  const souvenir = T >= ev.cut2 && T < ev.crois + 1.3;
  const liste = visibles2(data, T, cam, lieu, 190).filter((v) => !souvenir || v.id.startsWith("f"));
  const nbDetail = lieu === "ext" ? 26 : 12;

  // lumières : les fenêtres « du soir » toujours, les autres allumées pour la fête (souvenir), éteintes d'effroi, rallumées en miroir
  const lum1 = T < ev.cut2 ? 0 : T < ev.crois + 0.15 ? 1 : T < ev.crois + 0.7 ? 1 - lisse(entre(T, ev.crois + 0.15, ev.crois + 0.7)) : T < ev.lumieres ? 0 : lisse(entre(T, ev.lumieres, ev.lumieres + 1.5));
  const chaud = Math.max(lum1, 0) * (T > ev.lumieres ? 1 : 0.5);
  const sirA = T < ev.sirFin ? 1 - lisse(entre(T, ev.sirFin - 0.4, ev.sirFin)) : T > ev.sir2 && T < ev.sir2Fin ? lisse(entre(T, ev.sir2, ev.sir2 + 0.25)) * (1 - lisse(entre(T, ev.sir2Fin - 0.4, ev.sir2Fin))) : 0;
  const ouv = lisse(entre(T, ev.ouvre, ev.ouvre + 1.6));
  const tombe = entre(T, ev.ouvre - 0.1, ev.ouvre + 0.7);

  return (
    <>
      {lieu === "ext" && <ExtT souvenir={souvenir} T={T} v={v} ph={ph} cam={cam} ev={ev} lum1={lum1} chaud={chaud} sirA={sirA} ouv={ouv} tombe={tombe} teinte={teinte} />}
      {lieu === "tour" && <TourT T={T} />}
      {lieu === "cuisine" && <CuisineT T={T} />}
      {liste.map(({ id, a, d }, i) =>
        i < nbDetail ? (
          <group key={id}>
            <Perso id={id} a={a} frame={frame} T={T} teinte={teinte} objets={OBJETS} ombre={lieu === "ext" && v < 2 && d < 70} />
            {a.objet === "lanterne" && d < 90 && <Faisceau p={mainDroite(a)} dir={[Math.sin(a.ry) * 0.8, -0.55, Math.cos(a.ry) * 0.8]} long={9} rayon={3.6} c="#FFC766" o={0.09} />}
            {id === "tb" && <Corps2 a={a}><Pancarte T={T} t0={ev.pancarte0} tFin={ev.pancarteFin} penche0={ev.penche0} t={teinte} /></Corps2>}
          </group>
        ) : (
          <Silhouette key={id} a={a} t={teinte} />
        ),
      )}
      {lieu === "ext" && T > ev.fusee0 - 0.1 && T < ev.boum + 3.4 && <Feu T={T} t0={ev.fusee0} tBoum={ev.boum} de={[-14, 1, 12]} vers={[-10, 20, -1]} />}
    </>
  );
};

const Corps2: React.FC<{ a: Acteur; children: React.ReactNode }> = ({ a, children }) => (
  <group position={a.p} rotation={[a.rx, a.ry, 0, "YXZ"]} scale={a.echelle}>
    {children}
  </group>
);

// ------------------------------------------------------------------ EXTÉRIEUR : villes, vallée, ciel
const ExtT: React.FC<{ souvenir: boolean; T: number; v: number; ph: number; cam: V3; ev: Record<string, number>; lum1: number; chaud: number; sirA: number; ouv: number; tombe: number; teinte: Teinte }> = ({ souvenir, T, v, ph, cam, ev, lum1, chaud, sirA, ouv, tombe, teinte }) => {
  const g = ext();
  const opOmbre = v === 0 ? 0.5 : v === 1 ? 0.36 : 0;
  const lampes0 = 0.15 + 0.6 * ph;
  const miroirLum = T > ev.lumieres ? lisse(entre(T, ev.lumieres, ev.lumieres + 1.5)) : 0;
  return (
    <>
      <Voute ph={ph} cam={cam} lune={v === 2} />
      {v === 2 && (
        <group position={cam}>
          <Ciel lune={undefined} etoiles />
        </group>
      )}
      <mesh geometry={g.sol[v]}>
        <meshBasicMaterial vertexColors />
      </mesh>
      {opOmbre > 0 && (
        <mesh geometry={g.ombres[Math.min(1, v)]} renderOrder={1}>
          <meshBasicMaterial color="#14091C" transparent opacity={opOmbre} depthWrite={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
      )}
      <mesh geometry={g.lum0} renderOrder={2}>
        <meshBasicMaterial vertexColors fog={false} transparent opacity={v === 0 ? 0.55 + 0.45 * ph * 2 : 1} />
      </mesh>
      {(lum1 > 0.01) && (
        <mesh geometry={g.lum1} renderOrder={2}>
          <meshBasicMaterial vertexColors fog={false} transparent opacity={lum1} />
        </mesh>
      )}
      <Brume T={T} ph={ph} chaud={chaud} />
      {/* lampadaires : halos (A et miroir B) */}
      {LAMPES.map((l, i) => {
        const o = l.g === 0 ? lampes0 : lum1 * 0.75;
        if (o < 0.02) return null;
        return (
          <React.Fragment key={i}>
            <Lueur p={l.p} s={7.5} c="#FFB84D" o={o * flick(T, i)} />
            <Lueur p={mir(l.p)} s={7.5} c="#FFB84D" o={o * flick(T, i + 4)} />
          </React.Fragment>
        );
      })}
      {/* lanternes de la muraille : lueurs alignées (s'allument en miroir à la fin) */}
      {miroirLum > 0.02 && [-1, 1].map((s) => Array.from({ length: 21 }, (_, k) => {
        const x = -70 + k * 7;
        if (Math.abs(x + 22) < 7) return null;
        const p: V3 = [x, 12.4, 1.7];
        return <Lueur key={`${s}${k}`} p={s === 1 ? p : mir(p)} s={5.2} c="#FFB84D" o={0.55 * miroirLum} />;
      }))}
      <Sirene T={T} actif={sirA} z={1} />
      <Sirene T={T} actif={sirA} z={-1} />
      {/* les deux grandes portes scellées (la jumelle est le miroir exact) */}
      <Porte ouv={ouv} tombe={tombe} teinte={teinte} scelle={!souvenir} />
      <group position={[0, 0, ZB]} scale={[1, 1, -1]}>
        <Porte ouv={0} tombe={0} teinte={teinte} scelle={!souvenir} />
      </group>
      {/* la lumière qui jaillit de la porte ouverte */}
      {ouv > 0.01 && (
        <>
          <Lueur p={[-22, 6, -3.2]} s={26} c="#FFC070" o={0.8 * ouv} />
          <Faisceau p={[-22, 3.5, -1.5]} dir={[0, -0.12, -1]} long={46} rayon={11} c="#FFB866" o={0.18 * ouv} />
          <Tache p={[-22, 0.1, -6]} s={[18, 22]} c="#FFB866" o={0.55 * ouv} />
          <Lueur p={[-22, 2.2, 5]} s={16} c="#FFD490" o={0.55 * ouv} />
        </>
      )}
      {/* souvenir : guirlandes de lanternes de fête au-dessus de la place */}
      {T >= ev.cut2 && T < ev.crois + 0.7 && <Guirlandes T={T} />}
      <Soir T={T} />
    </>
  );
};
/** Petites particules du soir (cendres et poussière portées par le vent). */
const Soir: React.FC<{ T: number }> = () => null;

const Guirlandes: React.FC<{ T: number }> = ({ T }) => (
  <>
    {[14, 28, 42].map((z, row) =>
      Array.from({ length: 22 }, (_, k) => {
        const x = -58 + k * 3.2;
        const y = 9.2 - Math.sin((k / 21) * Math.PI) * -1.6 + 0;
        const c = ["#E0453B", "#F0B040", "#3FA69A", "#C96AA0"][(k + row) % 4];
        return (
          <group key={`${row}-${k}`}>
            <Bloc p={[x, y, z]} s={[0.5, 0.7, 0.5]} c={c} brut />
            {k % 2 === 0 && <Lueur p={[x, y, z]} s={3.4} c="#FFC070" o={0.5 * flick(T, k)} />}
          </group>
        );
      }),
    )}
  </>
);

// ------------------------------------------------------------------ TOUR (intérieur)
const TourT: React.FC<{ T: number }> = ({ T }) => {
  const g = tour();
  const [X0] = TOUR_INT;
  return (
    <>
      <mesh geometry={g.sol}>
        <meshBasicMaterial vertexColors />
      </mesh>
      <mesh geometry={g.lum} renderOrder={2}>
        <meshBasicMaterial vertexColors fog={false} />
      </mesh>
      {TORCHES_TOUR.map((p, i) => (
        <React.Fragment key={i}>
          <Lueur p={[p[0], p[1] + 0.3, p[2]]} s={6.5} c="#FFA64A" o={0.6 * flick(T, i)} />
          <Lueur p={[p[0], p[1] + 0.3, p[2]]} s={2.2} c="#FFE0A0" o={0.8 * flick(T, i + 2)} />
        </React.Fragment>
      ))}
      {FENTES_TOUR.map((p, i) => (
        <Lueur key={`f${i}`} p={p} s={5} c="#FF9A4A" o={0.4} />
      ))}
      <Lueur p={[X0 + 4.1, TI.haut + 0.8, 0]} s={15} c="#FFC080" o={0.75} />
      <Faisceau p={[X0 + 4.1, TI.haut + 0.6, 0]} dir={[-0.12, -1, 0]} long={13} rayon={3} c="#FFB070" o={0.14} />
      <Lueur p={[ECHELLE_X - 0.4, SOMMET_ECHELLE + 2, 0]} s={5} c="#FFC080" o={0.35} />
      <Tache p={[X0 + 3.1, SOMMET_ECHELLE + 0.05, 0]} s={[5, 5]} c="#FFC080" o={0.35} />
    </>
  );
};

// ------------------------------------------------------------------ CUISINE
const CuisineT: React.FC<{ T: number }> = ({ T }) => {
  const g = cuisine();
  const [X0] = CUISINE;
  const d = CU.d;
  const f = flick(T, 1);
  return (
    <>
      <mesh geometry={g.sol}>
        <meshBasicMaterial vertexColors />
      </mesh>
      <mesh geometry={g.lum} renderOrder={2}>
        <meshBasicMaterial vertexColors fog={false} />
      </mesh>
      {/* le mur du fond : calendrier barré, horloge à 20 h, photo du feu d'artifice */}
      <mesh position={[X0 - 3.0, 2.65, -d + 0.12]}>
        <planeGeometry args={[1.4, 1.75]} />
        <meshBasicMaterial map={texCalendrier()} color="#FFE6CC" />
      </mesh>
      <mesh position={[X0 - 0.7, 3.4, -d + 0.14]}>
        <planeGeometry args={[1.15, 1.15]} />
        <meshBasicMaterial map={texHorloge()} color="#FFE6CC" />
      </mesh>
      <mesh position={[X0 + 1.1, 2.85, -d + 0.14]}>
        <planeGeometry args={[1.8, 1.41]} />
        <meshBasicMaterial map={texPhoto()} color="#FFEBD6" />
      </mesh>
      {/* lumière : feu de la cheminée, couchant à la fenêtre, bougie, porte ouverte sur le soir */}
      <Lueur p={[X0 - 3.6, 1.0, 0.4]} s={6.5 * f} c="#FF9A3E" o={0.75} />
      <Lueur p={[X0 - 3.6, 0.8, 0.4]} s={2.6} c="#FFD590" o={0.8 * f} />
      <Tache p={[X0 - 2.0, 0.1, 0.4]} s={[7, 8]} c="#FF9A3E" o={0.4 * f} />
      <Lueur p={[X0 + 4.6, 2.6, 0.2]} s={8} c="#FF9A55" o={0.5} />
      <Tache p={[X0 + 2.6, 0.1, 0.2]} s={[7, 4.5]} c="#FF9A55" o={0.4} />
      <Faisceau p={[X0 + 4.9, 2.6, 0.2]} dir={[-1, -0.35, 0.05]} long={9} rayon={2.4} c="#FFAA66" o={0.1} />
      <Lueur p={[X0 + 1.2, 2.35, -0.3]} s={2.2} c="#FFD590" o={0.9 * flick(T, 5)} />
      <Tache p={[X0 + 1.2, 1.7, -0.3]} s={[3, 3]} c="#FFD590" o={0.2} />
      <Lueur p={[X0 + 2.0, 1.8, d + 0.2]} s={8} c="#FF8A3C" o={0.5} />
      <Tache p={[X0 + 2.0, 0.1, d - 1.0]} s={[4, 5]} c="#FF8A3C" o={0.38} />
      {void mel}
      {void hexMel}
      {void couleursCiel}
      {void VAR_EXT}
    </>
  );
};
