/**
 * « Ville interdite » — décor dynamique : ville en blocs de bois peints sous la lumière rasante d'une lampe de chevet (le « soleil »),
 * ombres de mains géantes, sirène, boulangerie soulevée par la main, pince qui emporte les habitants, boîte à jouets où l'on range les disparus,
 * table et chambre d'enfant, œil énorme. Seul le lieu où se trouve la caméra est dessiné (cave à x = -450).
 */
import React from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import type { Teinte } from "../../avatar";
import { entre, lisse, mel, mel3 } from "../../maths";
import { Faisceau, Lueur, Zone, type DonneesConte, type EtatConte } from "../lib";
import type { Acteur } from "../../ville/foule";
import { BOUL, CELLIER, LAMPADAIRES, LEO_MAISON, OEIL, TUNNEL, construireBoulangerie, construireCave, construireMaisonLeo, construirePiece, construireVille } from "./monde";
import { AbatJour, Chambre, JouetsTextes, Main, Oeil, OmbreMain, Perso, Pince, Sirene } from "./objets";
import { FACT_FIN, boulPos, leveFacteur, mainEtat, rangement } from "./histoire";
import { texBoulangerie, texSortie } from "./toile";
import { BARRIERE_Z } from "./monde";

export const cielVilleinterdite = (e?: EtatConte) => e?.ciel ?? "#EBC894";

const lieuDe = (p: V3): "ville" | "cave" => (p[0] < -380 ? "cave" : "ville");

// ------------------------------------------------------------------ Géométries (construites une seule fois par page)
let villeC: THREE.BufferGeometry | null = null;
let leoC: THREE.BufferGeometry | null = null;
let boulC: THREE.BufferGeometry | null = null;
let pieceC: THREE.BufferGeometry | null = null;
let caveC: THREE.BufferGeometry | null = null;
const ville = () => (villeC ??= construireVille());
const maisonLeo = () => (leoC ??= construireMaisonLeo());
const boulangerie = () => (boulC ??= construireBoulangerie());
const piece = () => (pieceC ??= construirePiece());
const cave = () => (caveC ??= construireCave());

// ------------------------------------------------------------------ Personnages visibles
type Vis = { id: string; a: Acteur; d: number };
function visibles2(data: DonneesConte, T: number, cam: V3, lieu: "ville" | "cave", portee: number): Vis[] {
  const out: Vis[] = [];
  for (const h of data.habitants) {
    const a = data.acteur(h.id, T);
    if (!a || lieuDe(a.p) !== lieu) continue;
    const d = Math.hypot(a.p[0] - cam[0], a.p[1] - cam[1], a.p[2] - cam[2]);
    if (d < portee) out.push({ id: h.id, a, d });
  }
  return out.sort((u, v) => u.d - v.d);
}

const CHAUD: Teinte = [1.3, 1.12, 0.9];
const FROID: Teinte = [0.82, 0.86, 1.12];
const clin = (T: number, t0: number, dur = 0.26) => Math.max(0, 1 - Math.abs(T - (t0 + dur / 2)) / (dur / 2));

export const MondeVilleinterdite: React.FC<{ e: EtatConte; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const T = frame / 30;
  const cam = e.cam.pos;
  const lieu = lieuDe(cam);
  const ev = data.ev;
  const soir = lisse(entre(T, ev.soir0, ev.soir1));
  const tz: Teinte = lieu === "cave" ? [1.15, 0.92, 0.76] : mel3(CHAUD, FROID, soir);
  const liste = visibles2(data, T, cam, lieu, lieu === "cave" ? 80 : 230);
  const nbDetail = 18;
  return (
    <>
      {lieu === "ville" && <Dehors T={T} cam={cam} ev={ev} data={data} tz={tz} soir={soir} frame={frame} />}
      {lieu === "cave" && <Dessous T={T} tz={tz} />}
      {liste.map(({ id, a, d }, i) => (i < nbDetail ? <Perso key={id} id={id} a={a} frame={frame} T={T} t={tz} ombre={lieu === "ville" && d < 90 && T < ev.soir1 + 8} /> : null))}
    </>
  );
};

// ------------------------------------------------------------------ Dehors : la ville, la table, la chambre
const Dehors: React.FC<{ T: number; cam: V3; ev: Record<string, number>; data: DonneesConte; tz: Teinte; soir: number; frame: number }> = ({ T, cam, ev, data, tz, soir }) => {
  const b = boulPos(T, ev);
  const main = mainEtat(T, ev);
  const ranger = rangement(T, ev);
  const leve = leveFacteur(T, ev);
  const sirA = T < ev.sirFin ? 1 - lisse(entre(T, ev.sirFin - 0.5, ev.sirFin)) : 0;
  // ombre d'une main qui glisse sur la ville pendant la scène 1 (au sol, et sur les toits quand la caméra les surplombe)
  const ombreO = T < 8 ? 0.62 * lisse(entre(T, -2, -0.2)) * (1 - lisse(entre(T, 6.4, 7.4))) : 0;
  const ox = -70 + 17 * T;
  const oz = 3 - 0.9 * T;
  const sec = mainEtat(T, ev);
  // ombre de la main qui descend sur la boulangerie
  const arrive = entre(T, ev.main0, ev.saisit);
  const ombreMain = main.visible ? 0.6 * lisse(arrive) * (1 - lisse(entre(T, ev.sort0, ev.sort1))) : 0;
  const colereO = lisse(entre(T, ev.gronde, ev.gronde + 0.4)) * (1 - lisse(entre(T, ev.clin2 + 0.3, ev.clin2 + 0.7)));
  const fin = data.finNarration;
  const oeilOuv = T < ev.oeil0 ? 0 : Math.min(1, lisse(entre(T, ev.oeil0, ev.oeil0 + 0.4))) * (1 - 0.55 * colereO) * (1 - 0.95 * Math.max(clin(T, ev.clin1), clin(T, ev.clin2), clin(T, ev.clin3, 0.5)));
  const oeilVisible = T > ev.oeil0 - 0.05;
  const cible: V3 = [-8.2, 2.6, 60.3];
  const soirLampe = 1 - 0.28 * soir;
  return (
    <>
      <Zone g={ville()} t={tz} />
      <Zone g={maisonLeo()} t={tz} />
      <Zone g={piece()} t={tz} />
      <Chambre t={tz} mur />
      <JouetsTextes t={tz} />
      <AbatJour o={soirLampe} />
      {/* panneau SORTIE INTERDITE */}
      <mesh position={[0, 5.5, BARRIERE_Z - 0.2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[11.8, 3.2]} />
        <meshBasicMaterial map={texSortie()} color={new THREE.Color().setRGB(tz[0], tz[1], tz[2])} />
      </mesh>
      <mesh position={[0, 5.5, BARRIERE_Z + 0.2]}>
        <planeGeometry args={[11.8, 3.2]} />
        <meshBasicMaterial map={texSortie()} color={new THREE.Color().setRGB(tz[0], tz[1], tz[2])} />
      </mesh>
      {/* boulangerie (suit la main) */}
      <group position={[b.x, b.y, b.z]} rotation={[b.rx, 0, b.rz]}>
        <Zone g={boulangerie()} t={tz} />
        <mesh position={[0, BOUL.h - 1.05, BOUL.d / 2 + 0.14]}>
          <planeGeometry args={[13, 2.0]} />
          <meshBasicMaterial map={texBoulangerie()} color={new THREE.Color().setRGB(tz[0], tz[1], tz[2])} />
        </mesh>
        <Lueur p={[5, 2.6, -BOUL.d / 2 + 4.6]} s={7.5} c="#FF9A3E" o={0.8 * (0.85 + 0.15 * Math.sin(T * 13))} />
        <Lueur p={[0, 5.4, 1.4]} s={9} c="#FFD590" o={0.4} />
        <Lueur p={[0, 3.2, 3.2]} s={14} c="#FFC070" o={0.3} />
      </group>
      {/* lampadaires : s'allument au soir */}
      {soir > 0.1 && LAMPADAIRES.filter((p) => Math.abs(p[0] - cam[0]) < 90 && Math.abs(p[2] - cam[2]) < 90).map((p, i) => <Lueur key={i} p={[p[0], 6.9, p[2]]} s={9} c="#FFC070" o={0.7 * soir} />)}
      <Sirene T={T} actif={sirA} />
      {/* ombre de la main au sol et sur les toits (scène 1) */}
      {ombreO > 0.01 && (
        <>
          <OmbreMain p={[ox, 0.12, oz]} rot={-Math.PI / 2} taille={104} o={ombreO} />
          {cam[1] > 11.8 && <OmbreMain p={[ox - 1.5, 11.0, oz - 0.5]} rot={-Math.PI / 2} taille={104} o={ombreO * 0.8} />}
        </>
      )}
      {/* le facteur : le sol s'assombrit sous la pince */}
      {T > ev.ombreSol0 && T < ev.leve + 1.0 && (
        <mesh position={[FACT_FIN[0], 0.1, FACT_FIN[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
          <circleGeometry args={[mel(0.5, 7.5, lisse(entre(T, ev.ombreSol0, ev.leve))), 24]} />
          <meshBasicMaterial color="#0B0610" transparent opacity={0.62 * lisse(entre(T, ev.ombreSol0, ev.leve - 0.2))} depthWrite={false} />
        </mesh>
      )}
      {leve.visible && <Pince p={leve.p} ouv={leve.ouv} t={tz} />}
      {ranger.visible && <Pince p={ranger.p} ouv={ranger.ouv} t={tz} />}
      {/* la main géante */}
      {main.visible && (
        <>
          <Main p={main.p} ry={Math.PI} curl={main.curl} t={tz} />
          {ombreMain > 0.01 && <OmbreMain p={[main.p[0], 0.12, main.p[2]]} rot={Math.PI / 2} taille={mel(30, 52, 1 - lisse(arrive))} o={ombreMain * (1 - lisse(entre(T, ev.saisit, ev.leve0)) * 0.5)} />}
        </>
      )}
      {oeilVisible && (
        <group>
          <Oeil p={OEIL} cible={cible} S={1} ouv={oeilOuv} colere={colereO * 0.85} pupille={1 + 0.25 * lisse(entre(T, ev.oeil0, ev.oeil0 + 1.2)) - 0.18 * colereO + 0.55 * lisse(entre(T, fin - 1.4, fin - 0.2))} regard={[Math.sin(T * 1.7) * 0.5, Math.sin(T * 1.1) * 0.4]} t={tz} />
        </group>
      )}
      {void sec}
      {void CELLIER}
      {void LEO_MAISON}
    </>
  );
};

// ------------------------------------------------------------------ Dessous : cellier et tunnel
const Dessous: React.FC<{ T: number; tz: Teinte }> = ({ T, tz }) => {
  const g = cave();
  const f = 0.88 + 0.12 * Math.sin(T * 17) * Math.sin(T * 6.3);
  const { x0, z1, h } = CELLIER;
  const { x0: t0, x1: t1, h: th } = TUNNEL;
  return (
    <>
      <Zone g={g} t={tz} />
      {/* cellier : lumière du jour par la trappe */}
      <Faisceau p={[x0 + 3.6, h + 4, -1.0]} dir={[0.25, -1, 0]} long={12} rayon={3.8} c="#FFE2A0" o={0.18} />
      <Lueur p={[x0 + 4, h - 0.4, -1.0]} s={11} c="#FFE2A0" o={0.6} />
      <Lueur p={[x0 + 11, 5.2, 0]} s={12} c="#FFB660" o={0.55 * f} />
      <Lueur p={[x0 + 8.5, 3.0, z1 - 2]} s={5} c="#FFB660" o={0.4} />
      {/* tunnel : ampoules suspendues et lumière de l'échelle */}
      {[0, 1, 2, 3].map((k) => (
        <React.Fragment key={k}>
          <Lueur p={[t0 + 6 + k * 11, th - 0.8, 0]} s={8} c="#FFC070" o={0.62 * (0.9 + 0.1 * Math.sin(T * 11 + k))} />
        </React.Fragment>
      ))}
      <Lueur p={[t1 - 1.0, th - 0.4, 0]} s={12} c="#FFF2C8" o={0.8} />
      <Faisceau p={[t1 - 1.2, th + 0.8, 0]} dir={[0, -1, 0]} long={6.5} rayon={2.4} c="#FFF2C8" o={0.22} />
    </>
  );
};
