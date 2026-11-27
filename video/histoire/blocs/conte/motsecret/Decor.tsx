/**
 * « Le mot secret » — décor dynamique : porte d'entrée (verrous, chaîne, clé, poignée, verre dépoli, silhouette et main
 * derrière la vitre, vibrations des trois coups, poussière qui tombe), lumière sous la porte, lampe qui tremble,
 * veilleuse, brume au ras du sol, rayons de lune dans la poussière, rabat du lit, tapis qui glisse, trappe qui se soulève.
 * Les personnages sont éclairés par le même calcul que le décor (ambre près de la lampe, bleu dans la lune).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Avatar, Bloc, HANCHE, type Pose, type Teinte } from "../../avatar";
import { halo } from "../../textures";
import { entre, lisse, mel } from "../../maths";
import { Ciel, Lueur, Ombre, Tache, Zone, visibles, type DonneesConte, type EtatConte, type Visible } from "../lib";
import { eclairage, construireMotsecret, FEN_CHAMBRE, FEN_COULOIR, FEN_SALON, H, HORLOGE, APPLIQUE, LAMPE, LIT, PERRON, PORTE, TAPIS, TRAPPE, VEILLEUSE } from "./monde";
import { ajuster } from "./poses";
import { E_TOM } from "./histoire";

export const cielMotsecret = (e?: EtatConte) => e?.ciel ?? "#070A16";

const alea = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Teinte d'un personnage (ou d'un objet mobile) en `p` : la même lumière que celle cuite dans le décor. */
function teinteEn(p: V3, g = 1.12): Teinte {
  const l = eclairage([p[0], p[1] + 1.5, p[2]], [0, 1, 0], false);
  return [Math.min(1.35, l[0] * g), Math.min(1.35, l[1] * g), Math.min(1.35, l[2] * g)];
}

// ------------------------------------------------------------------ Éléments communs
/** Rayon de lune : prisme translucide entre la fenêtre et le sol, additif et fondu vers le bas. */
const Rayon: React.FC<{ axe: 0 | 2; plan: number; u0: number; u1: number; y0: number; y1: number; d: V3; o: number; c?: [number, number, number] }> = ({ axe, plan, u0, u1, y0, y1, d, o, c = [0.45, 0.6, 1.0] }) => {
  const g = useMemo(() => {
    const Q: V3[] = [];
    const corner = (u: number, y: number): V3 => (axe === 0 ? [plan, y, u] : [u, y, plan]);
    const pts = [corner(u0, y0), corner(u1, y0), corner(u1, y1), corner(u0, y1)];
    const P = pts.map((q) => {
      const s = q[1] / -d[1];
      return [q[0] + d[0] * s, 0.02, q[2] + d[2] * s] as V3;
    });
    Q.push(...pts, ...P);
    const pos: number[] = [];
    const col: number[] = [];
    const quad = (a: number, b: number, bb: number, aa: number) => {
      for (const i of [a, b, bb, a, bb, aa]) {
        pos.push(...Q[i]);
        const k = i < 4 ? 0.55 : 0.0;
        col.push(c[0] * k * o, c[1] * k * o, c[2] * k * o);
      }
    };
    for (let i = 0; i < 4; i++) quad(i, (i + 1) % 4, 4 + ((i + 1) % 4), 4 + i);
    const gg = new THREE.BufferGeometry();
    gg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    gg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    return gg;
  }, [axe, plan, u0, u1, y0, y1, d[0], d[1], d[2], o]);
  return (
    <mesh geometry={g} renderOrder={5}>
      <meshBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};
const DIR_SALON: V3 = (() => { const l = Math.hypot(-0.85, -0.45, -0.12); return [-0.85 / l, -0.45 / l, -0.12 / l]; })();
const DIR_COULOIR: V3 = (() => { const l = Math.hypot(-0.9, -0.3, 0.2); return [-0.9 / l, -0.3 / l, 0.2 / l]; })();
const DIR_CHAMBRE: V3 = (() => { const l = Math.hypot(0.05, -0.5, 0.85); return [0.05 / l, -0.5 / l, 0.85 / l]; })();

/** Poussières en suspension dans un volume (grains pâles qui dérivent). */
const Poussieres: React.FC<{ T: number; a: V3; b: V3; n: number; c?: string; o?: number; s?: number }> = ({ T, a, b, n, c = "#BFD0F0", o = 0.55, s = 0.05 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const x = mel(a[0], b[0], alea(i * 3.1)) + Math.sin(T * 0.4 + i) * 0.25;
      const y = mel(a[1], b[1], alea(i * 5.7)) + Math.sin(T * 0.55 + i * 2) * 0.2 - ((T * 0.05 + alea(i)) % 1) * 0.3;
      const z = mel(a[2], b[2], alea(i * 7.3)) + Math.cos(T * 0.35 + i * 1.3) * 0.25;
      return <Bloc key={i} p={[x, y, z]} s={[s, s, s]} c={c} brut opacite={o * (0.5 + 0.5 * Math.sin(T * 1.7 + i * 2.1) ** 2)} />;
    })}
  </>
);

/** Brume basse : plans horizontaux translucides superposés au ras du sol. */
const Brume: React.FC<{ T: number; p: V3; s: [number, number]; o: number; c?: string }> = ({ T, p, s, o, c = "#8FA6C8" }) => (
  <>
    {[0.12, 0.34, 0.6, 0.9].map((h, i) => (
      <Tache key={i} p={[p[0] + Math.sin(T * 0.25 + i * 1.7) * 0.4, p[1] + h, p[2] + Math.cos(T * 0.2 + i) * 0.3]} s={[s[0] * (1 - i * 0.08), s[1] * (1 - i * 0.08)]} c={c} o={o * (1 - i * 0.18)} />
    ))}
  </>
);

// ------------------------------------------------------------------ Porte d'entrée
/** Amplitude de la vibration due aux trois coups à l'instant T (signée, décroissante). */
function vibration(T: number, ev: Record<string, number>, k = 1): number {
  let v = 0;
  for (const tk of [ev.toc1, ev.toc2, ev.toc3]) {
    const dt = T - tk;
    if (dt > 0 && dt < 0.55) v += Math.sin(dt * 78) * Math.exp(-dt * 11) * k;
  }
  return v;
}

const BRONZE = "#B8A060";
const Porte: React.FC<{ T: number; ev: Record<string, number>; ext: boolean; t: Teinte }> = ({ T, ev, ext, t }) => {
  const s = ext ? 1 : -1; // côté visible de la porte : +z dehors, -z dedans
  const vib = vibration(T, ev, 0.034);
  const poignee = lisse(entre(T, ev.poignee, ev.poignee + 0.5)) * (1 - lisse(entre(T, ev.poignee + 1.0, ev.poignee + 1.6))) * 0.55;
  const chaine = vibration(T, ev, 0.45) * 0.5;
  // vitre : bleue de nuit vue de l'intérieur, ambrée de l'extérieur
  const vitre = ext ? "#A88450" : "#9DB8E6";
  const sil = lisse(entre(T, ev.ombre + 0.1, ev.ombre + 0.9)) * (1 - lisse(entre(T, ev.silFin, ev.silFin + 0.6)));
  const main = lisse(entre(T, ev.main, ev.main + 0.35)) * (1 - lisse(entre(T, ev.main + 1.4, ev.main + 1.9)));
  const h = halo();
  const x0 = ext ? PERRON[0] + PORTE.x1 : PORTE.x1;
  const z0 = ext ? 0.15 : PORTE.z + 0.15;
  const front = (z: number) => s * z; // distance depuis l'axe de la porte, côté visible
  return (
    <group position={[x0, 0, z0]} rotation={[0, vib, 0]}>
      <Bloc p={[-1.0, 1.75, 0]} s={[2.0, 3.5, 0.2]} c="#5A3B26" t={t} />
      {/* panneaux en creux */}
      <Bloc p={[-0.95, 0.85, front(0.11)]} s={[1.4, 1.1, 0.03]} c="#4A2F1E" t={t} />
      <Bloc p={[-0.95, 3.3, front(0.11)]} s={[1.4, 0.28, 0.03]} c="#4A2F1E" t={t} />
      {/* verre dépoli et son cadre */}
      <Bloc p={[-0.85, 2.55, front(0.1)]} s={[1.15, 1.5, 0.05]} c="#3A2416" t={t} />
      <mesh position={[-0.85, 2.55, front(0.13)]}>
        <planeGeometry args={[0.95, 1.3]} />
        <meshBasicMaterial color={vitre} side={THREE.DoubleSide} />
      </mesh>
      <Bloc p={[-0.85, 2.55, front(0.14)]} s={[0.05, 1.3, 0.02]} c="#3A2416" t={t} />
      <Bloc p={[-0.85, 2.55, front(0.14)]} s={[0.95, 0.05, 0.02]} c="#3A2416" t={t} />
      {/* silhouette floue et main, derrière le verre (vue de l'intérieur seulement) */}
      {!ext && sil > 0.01 && (
        <group position={[0, 0, -0.145]}>
          <Bloc p={[-0.87 + Math.sin(T * 0.7) * 0.02, 2.98, 0]} s={[0.36, 0.42, 0.02]} c="#04060E" brut opacite={0.5 * sil} />
          <Bloc p={[-0.87, 2.5, 0]} s={[0.95, 0.62, 0.02]} c="#04060E" brut opacite={0.5 * sil} />
          <mesh position={[-0.87 + Math.sin(T * 0.7) * 0.02, 2.98, -0.002]}>
            <planeGeometry args={[0.7, 0.8]} />
            <meshBasicMaterial map={h} color="#04060E" transparent opacity={0.8 * sil} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.87, 2.45, -0.002]}>
            <planeGeometry args={[1.3, 1.1]} />
            <meshBasicMaterial map={h} color="#04060E" transparent opacity={0.85 * sil} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      {!ext && main > 0.01 && (
        <group position={[-0.55, 2.4, -0.15]}>
          <Bloc s={[0.34, 0.36, 0.02]} c="#04060E" brut opacite={0.9 * main} />
          {[-0.12, -0.04, 0.04, 0.12].map((dx, i) => (
            <Bloc key={i} p={[dx, 0.3 + (i === 1 || i === 2 ? 0.06 : 0), 0]} s={[0.07, 0.26 + (i === 1 || i === 2 ? 0.06 : 0), 0.02]} c="#04060E" brut opacite={0.9 * main} />
          ))}
          <Bloc p={[0.22, 0.04, 0]} s={[0.2, 0.08, 0.02]} c="#04060E" brut r={[0, 0, 0.5]} opacite={0.9 * main} />
        </group>
      )}
      {ext && (
        <>
          {/* de l'extérieur : heurtoir, lueur de la lampe à travers le verre */}
          <Bloc p={[-0.85, 3.4, 0.15]} s={[0.4, 0.4, 0.06]} c={BRONZE} t={t} />
          <Bloc p={[-0.85, 3.05, 0.17]} s={[0.18, 0.3, 0.08]} c={BRONZE} t={t} />
          <Bloc p={[-1.75, 1.55, 0.2]} s={[0.3, 0.3, 0.06]} c={BRONZE} t={t} />
          <group position={[-1.75, 1.55, 0.24]} rotation={[0, 0, -poignee]}>
            <Bloc p={[0.32, 0, 0]} s={[0.7, 0.12, 0.12]} c={BRONZE} t={t} />
          </group>
        </>
      )}
      {!ext && (
        <>
          {/* poignée à levier */}
          <Bloc p={[-1.75, 1.55, -0.14]} s={[0.36, 0.4, 0.06]} c={BRONZE} t={t} />
          <group position={[-1.75, 1.55, -0.2]} rotation={[0, 0, -poignee]}>
            <Bloc p={[0.34, 0, 0]} s={[0.74, 0.12, 0.12]} c={BRONZE} t={t} />
          </group>
          {/* serrure à clé : la clé est dedans, tournée vers la pièce (anneau en laiton) */}
          <Bloc p={[-1.75, 2.2, -0.13]} s={[0.34, 0.5, 0.05]} c="#2A2A30" t={t} />
          <Bloc p={[-1.75, 2.2, -0.2]} s={[0.16, 0.16, 0.12]} c={BRONZE} t={t} />
          <Bloc p={[-1.75, 2.2, -0.34]} s={[0.08, 0.08, 0.3]} c="#D9B85C" t={t} />
          <Bloc p={[-1.75, 2.38, -0.5]} s={[0.36, 0.08, 0.08]} c="#D9B85C" t={t} />
          <Bloc p={[-1.75, 2.02, -0.5]} s={[0.36, 0.08, 0.08]} c="#D9B85C" t={t} />
          <Bloc p={[-1.93, 2.2, -0.5]} s={[0.08, 0.36, 0.08]} c="#D9B85C" t={t} />
          <Bloc p={[-1.57, 2.2, -0.5]} s={[0.08, 0.36, 0.08]} c="#D9B85C" t={t} />
          {/* verrous : haut, bas */}
          {[3.15, 0.65].map((y) => (
            <group key={y}>
              <Bloc p={[-1.62, y, -0.14]} s={[0.7, 0.18, 0.05]} c={BRONZE} t={t} />
              <Bloc p={[-1.7, y, -0.2]} s={[0.5, 0.1, 0.1]} c="#2A2A30" t={t} />
              <Bloc p={[-1.45, y, -0.26]} s={[0.12, 0.12, 0.14]} c={BRONZE} t={t} />
            </group>
          ))}
          {/* chaîne de sécurité : rail sur la porte, plaque sur le chambranle, maillons qui pendent et se balancent */}
          <Bloc p={[-1.72, 2.85, -0.13]} s={[0.5, 0.1, 0.05]} c="#8A8A92" t={t} />
          <Bloc p={[-2.1, 2.85, -0.3]} s={[0.12, 0.26, 0.06]} c="#8A8A92" t={t} />
          <group position={[-1.9, 2.85, -0.2]} rotation={[0, 0, chaine]}>
            {Array.from({ length: 5 }, (_, i) => (
              <Bloc key={i} p={[-0.05 - i * 0.07, -Math.sin(((i + 0.5) / 5) * Math.PI) * 0.07, -i * 0.02]} s={[0.11, 0.07, 0.07]} c="#D0D0DA" t={t} r={[i % 2 ? 1.57 : 0, 0, 0]} />
            ))}
          </group>
        </>
      )}
    </group>
  );
};

/** Poussière qui tombe du linteau à chaque coup. */
const PoussiereLinteau: React.FC<{ T: number; ev: Record<string, number>; x: number; z: number }> = ({ T, ev, x, z }) => (
  <>
    {[ev.toc1, ev.toc2, ev.toc3].flatMap((tk, kk) =>
      Array.from({ length: 12 }, (_, i) => {
        const dt = T - tk - alea(i + kk * 17) * 0.05;
        if (dt < 0 || dt > 1.4) return null;
        const x0 = x - 0.9 + alea(i * 3 + kk) * 1.8;
        const y = 3.45 - 1.6 * dt * dt * 0.9 - dt * 0.25;
        if (y < 0.1) return null;
        return <Bloc key={`${kk}-${i}`} p={[x0 + Math.sin(dt * 3 + i) * 0.05, y, z]} s={[0.05, 0.05, 0.05]} c="#C9D0DE" brut opacite={0.9 * (1 - dt / 1.4)} />;
      }),
    )}
  </>
);

// ------------------------------------------------------------------ Personnages
const Barbe: React.FC<{ pose: Pose; t: Teinte; c: string }> = ({ pose, t, c }) => {
  const [lacet, tangage] = pose.tete ?? [0, 0];
  return (
    <group position={[0, HANCHE + (pose.y ?? 0), 0]} rotation={[pose.torse ?? 0, 0, 0]}>
      <group position={[0, 1.0, 0]} rotation={[tangage, lacet, 0, "YXZ"]}>
        <Bloc p={[0, 0.07, 0.3]} s={[0.84, 0.16, 0.24]} c={c} t={t} />
        <Bloc p={[0, 0.1, 0.415]} s={[0.62, 0.1, 0.03]} c={c} t={t} />
        <Bloc p={[0, 0.28, 0.412]} s={[0.4, 0.07, 0.03]} c={c} t={t} />
        <Bloc p={[0.42, 0.18, 0.1]} s={[0.06, 0.34, 0.6]} c={c} t={t} />
        <Bloc p={[-0.42, 0.18, 0.1]} s={[0.06, 0.34, 0.6]} c={c} t={t} />
      </group>
    </group>
  );
};

const Lapin: React.FC<{ t: Teinte }> = ({ t }) => (
  <group rotation={[0.15, 0, 0]}>
    <Bloc p={[0, -0.05, 0]} s={[0.1, 0.5, 0.1]} c="#F2E6EA" t={t} />
    <Bloc p={[0.12, -0.12, 0]} s={[0.1, 0.45, 0.1]} c="#F2E6EA" t={t} />
    <Bloc p={[0.06, -0.62, 0]} s={[0.42, 0.34, 0.32]} c="#F2E6EA" t={t} />
    <Bloc p={[0.06, -0.62, 0.17]} s={[0.1, 0.1, 0.04]} c="#E89AAE" t={t} />
    <Bloc p={[0.06, -1.05, 0]} s={[0.5, 0.56, 0.3]} c="#EFE2E6" t={t} />
    <Bloc p={[0.06, -1.4, 0.0]} s={[0.4, 0.2, 0.28]} c="#E6D6DC" t={t} />
  </group>
);

/** Qui est visible, et où (les originaux de la chambre disparaissent à la coupe, les doubles du salon apparaissent). */
const visible = (id: string, T: number, ev: Record<string, number>) => (id.endsWith("S") ? T >= ev.cut : id === "maman" ? true : T < ev.cut);

const Personnages: React.FC<{ liste: Visible[]; frame: number; T: number; ev: Record<string, number>; lieu: string }> = ({ liste, frame, T, ev, lieu }) => (
  <>
    {liste
      .filter((v) => visible(v.id, T, ev))
      .slice(0, 8)
      .map(({ id, a, d }) => {
        const pose = ajuster(id, T, a, ev);
        const t = teinteEn(a.p);
        const brut = id === "papa" || id === "papaS";
        const lapin = id === "tom" || id === "tomS";
        // ombre portée : lampe du salon (nord-ouest), veilleuse / lune dans la chambre
        const dx = a.p[0] - (a.p[2] > -14 ? LAMPE[0] : VEILLEUSE[0]);
        const dz = a.p[2] - (a.p[2] > -14 ? LAMPE[2] : VEILLEUSE[2]);
        const ang = Math.atan2(dx, dz);
        return (
          <group key={id}>
            <Avatar p={a.p} ry={a.ry} pose={pose} tenue={a.tenue} emotion={a.emotion} frame={frame} graine={a.graine} teinte={t} echelle={a.echelle} sansClin={a.sansClin} clinRapide={a.clinRapide} rx={a.rx} mainG={lapin ? <Lapin t={t} /> : undefined}>
              {brut && <Barbe pose={pose} t={t} c="#1E1E24" />}
            </Avatar>
            {d < 45 && lieu === "maison" && <Ombre x={a.p[0]} z={a.p[2]} y={a.p[1] + 0.09} r={0.9 * a.echelle} o={0.5} etire={1.5} angle={-ang + Math.PI / 2} />}
          </group>
        );
      })}
  </>
);

// ------------------------------------------------------------------ Monde
export const MondeMotsecret: React.FC<{ e: EtatConte; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const zones = useMemo(() => construireMotsecret(), []);
  const T = frame / 30;
  const cam = e.cam.pos;
  const lieu = cam[0] > 200 ? "perron" : "maison";
  const ev = data.ev;
  const liste = visibles(data, T, cam, 80);

  // ----- tremblements du plancher (trois coups venus d'en bas) et lumière de la lampe
  const tk = [ev.tok1, ev.tok2, ev.tok3];
  let sol = 0;
  for (const t of tk) {
    const dt = T - t;
    if (dt > 0 && dt < 0.7) sol += Math.sin(dt * 55) * Math.exp(-dt * 6);
  }
  const trembl = lisse(entre(T, ev.tok1 - 0.05, ev.tok1 + 0.05)) * (1 - lisse(entre(T, ev.trembleFin, ev.trembleFin + 0.5)));
  const lampeSwing = sol * 0.07 + trembl * Math.sin(T * 31) * 0.015;
  const lampeFlick = 0.92 + Math.sin(T * 13) * 0.03 + Math.sin(T * 5.3) * 0.03 - trembl * 0.25 * (0.5 + 0.5 * Math.sin(T * 40));

  // ----- tapis et trappe
  const gliss = lisse(entre(T, ev.tapis, ev.tapis + 1.15));
  const ouvre = lisse(entre(T, ev.trappe, ev.trappe + 1.5)) * 0.17;
  const rattle = sol * 0.012;
  const lueurTrappe = lisse(entre(T, ev.trappe - 0.1, ev.trappe + 1.0));
  const tc: V3 = [TRAPPE.x, 0, TRAPPE.z];

  // ----- rabat du lit
  const leve = lisse(entre(T, ev.souleve, ev.souleve + 0.8)) * 1.42;

  const tZone = teinteEn([0, 0, 0]);
  void tZone;

  const veillFlick = 0.9 + Math.sin(T * 9.1) * 0.04 + Math.sin(T * 3.3) * 0.05;
  const horlogeSec = (Math.floor(T) % 60) * ((2 * Math.PI) / 60) + Math.min(1, (T % 1) * 8) * ((2 * Math.PI) / 60) * 0.5;

  return (
    <>
      <group position={cam}>
        <Ciel lune={lieu === "perron" ? [-70, 135, -300] : [290, 153, 41]} rayonLune={30} couleurLune="#E6ECFF" />
      </group>

      {lieu === "maison" && (
        <>
          <Zone g={zones.maison} t={[1, 1, 1]} />

          {/* vitrages bleutés */}
          <mesh position={[FEN_SALON.plan - 0.05, (FEN_SALON.y0 + FEN_SALON.y1) / 2, (FEN_SALON.u0 + FEN_SALON.u1) / 2]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[FEN_SALON.u1 - FEN_SALON.u0, FEN_SALON.y1 - FEN_SALON.y0]} />
            <meshBasicMaterial color="#5C7FC8" transparent opacity={0.3} depthWrite={false} />
          </mesh>
          <mesh position={[FEN_COULOIR.plan + 0.05, (FEN_COULOIR.y0 + FEN_COULOIR.y1) / 2, (FEN_COULOIR.u0 + FEN_COULOIR.u1) / 2]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[FEN_COULOIR.u1 - FEN_COULOIR.u0, FEN_COULOIR.y1 - FEN_COULOIR.y0]} />
            <meshBasicMaterial color="#5C7FC8" transparent opacity={0.3} depthWrite={false} />
          </mesh>
          <mesh position={[(FEN_CHAMBRE.u0 + FEN_CHAMBRE.u1) / 2, (FEN_CHAMBRE.y0 + FEN_CHAMBRE.y1) / 2, FEN_CHAMBRE.plan + 0.05]}>
            <planeGeometry args={[FEN_CHAMBRE.u1 - FEN_CHAMBRE.u0, FEN_CHAMBRE.y1 - FEN_CHAMBRE.y0]} />
            <meshBasicMaterial color="#5C7FC8" transparent opacity={0.3} depthWrite={false} />
          </mesh>

          <Poussieres T={T} a={[1.0, 0.6, 0.2]} b={[6.5, 3.6, 3.6]} n={34} />
          <Poussieres T={T} a={[-1.1, 0.8, -9.0]} b={[1.1, 3.0, -6.8]} n={14} />
          <Poussieres T={T} a={[0.5, 0.8, -21.0]} b={[3.6, 3.4, -16.4]} n={24} />
          <Poussieres T={T} a={[-5, 0.6, 2]} b={[0, 3, 7.5]} n={22} c="#8FA6C8" o={0.35} />

          {/* brume au ras du sol près de la porte, dans le couloir, devant la chambre */}
          <Brume T={T} p={[-3.4, 0, 6.6]} s={[9, 5]} o={0.15} />
          <Brume T={T} p={[0, 0, -8]} s={[3.2, 9]} o={0.1} />
          <Brume T={T} p={[0, 0, -15.5]} s={[5, 3]} o={0.1} c="#9BAAC8" />

          {/* sous la porte : filet de lumière froide et ombres de pieds */}
          <mesh position={[(PORTE.x0 + PORTE.x1) / 2, 0.07, PORTE.z - 0.1]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
            <planeGeometry args={[2.0, 0.34]} />
            <meshBasicMaterial color="#9DB8EC" transparent opacity={0.8} depthWrite={false} />
          </mesh>
          <Tache p={[(PORTE.x0 + PORTE.x1) / 2, 0.09, PORTE.z - 0.9]} s={[3.4, 2.4]} c="#6D8FD0" o={0.4} />
          {T > ev.ombre && T < ev.silFin + 0.4 && (
            <group>
              {[-0.5, 0.42].map((dx, i) => (
                <mesh key={i} position={[(PORTE.x0 + PORTE.x1) / 2 + dx, 0.075, PORTE.z - 0.1]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
                  <planeGeometry args={[0.55, 0.3]} />
                  <meshBasicMaterial color="#040612" transparent opacity={0.92 * lisse(entre(T, ev.ombre, ev.ombre + 0.5)) * (1 - lisse(entre(T, ev.silFin, ev.silFin + 0.5)))} depthWrite={false} />
                </mesh>
              ))}
            </group>
          )}

          <Porte T={T} ev={ev} ext={false} t={teinteEn([(PORTE.x0 + PORTE.x1) / 2, 0, PORTE.z - 1.5], 1.0)} />
          <PoussiereLinteau T={T} ev={ev} x={(PORTE.x0 + PORTE.x1) / 2} z={PORTE.z - 0.3} />

          {/* horloge : trotteuse qui avance par à-coups */}
          <group position={[HORLOGE[0], HORLOGE[1], HORLOGE[2] - 0.15]} rotation={[0, 0, horlogeSec]}>
            <Bloc p={[0, 0.22, 0]} s={[0.025, 0.5, 0.012]} c="#C0392B" brut />
            <Bloc p={[0, -0.04, 0]} s={[0.08, 0.08, 0.02]} c="#C0392B" brut />
          </group>

          {/* lampe de salon : pied, abat-jour lumineux, halo ; elle tremble quand le plancher est frappé */}
          <group position={[LAMPE[0], 1.71, LAMPE[2]]} rotation={[0, 0, lampeSwing]}>
            <Bloc p={[0, 0.1, 0]} s={[0.55, 0.2, 0.55]} c="#2A1C12" t={teinteEn(LAMPE)} />
            <Bloc p={[0, 0.55, 0]} s={[0.14, 0.9, 0.14]} c="#3A2A1C" t={teinteEn(LAMPE)} />
            <Bloc p={[0, 1.04, 0]} s={[0.95, 0.78, 0.95]} c="#E9A850" brut />
            <Bloc p={[0, 1.04, 0]} s={[0.78, 0.8, 0.78]} c="#FFD08A" brut />
            <Lueur p={[0, 1.0, 0]} s={7.5 * lampeFlick} c="#FFB45A" o={0.5} />
            <Lueur p={[0, 1.0, 0]} s={2.6} c="#FFE0A8" o={0.8 * lampeFlick} />
          </group>

          {/* applique d'entrée */}
          <Bloc p={[APPLIQUE[0], APPLIQUE[1], 7.88]} s={[0.4, 0.5, 0.2]} c="#E9A850" brut />
          <Lueur p={[APPLIQUE[0], APPLIQUE[1], 7.6]} s={3.2} c="#FFB45A" o={0.4} />
          {/* veilleuse en étoile */}
          <group position={[VEILLEUSE[0], 1.3, VEILLEUSE[2]]}>
            <Bloc p={[0, 0.12, 0]} s={[0.5, 0.24, 0.5]} c="#6B4A2F" t={teinteEn(VEILLEUSE)} />
            <group position={[0, 0.7, 0]}>
              {[0, 0.628, 1.257, 1.885, 2.513].map((a, i) => (
                <Bloc key={i} p={[0, 0, 0]} s={[0.16, 0.74, 0.08]} c="#FFE08A" brut r={[0, 0, a]} />
              ))}
              <Lueur p={[0, 0, 0.1]} s={3.6 * veillFlick} c="#FFC766" o={0.6} />
              <Lueur p={[0, 0, 0.1]} s={1.2} c="#FFF0C0" o={0.9} />
            </group>
          </group>
          <Tache p={[VEILLEUSE[0] + 0.5, 0.1, VEILLEUSE[2] + 1.0]} s={[5, 5]} c="#FFB866" o={0.18 * veillFlick} />

          {/* rabat de couverture : la partie loin du lit pend toujours, la partie près de la porte se soulève */}
          <Bloc p={[LIT.x1 + 0.04, 0.98, -20.8]} s={[0.06, 1.64, 3.6]} c="#3E5AA6" t={teinteEn([LIT.x1 + 0.4, 0, -20.8], 1)} />
          <group position={[LIT.x1 + 0.04, 1.8, -17.7]} rotation={[0, 0, leve]}>
            <Bloc p={[0.0, -0.84, 0]} s={[0.06, 1.68, 2.6]} c="#3E5AA6" t={teinteEn([LIT.x1 + 0.4, 0, -17.7], 1)} />
            <Bloc p={[0.0, -1.5, 0]} s={[0.07, 0.1, 2.6]} c="#F2D45C" t={teinteEn([LIT.x1 + 0.4, 0, -17.7], 1)} />
          </group>

          {/* tapis épais (tuiles éclairées une à une) qui glisse, trappe de cave dessous */}
          <Bloc p={[tc[0], 0.07, tc[2]]} s={[TRAPPE.t + 0.5, 0.14, TRAPPE.t + 0.5]} c="#020204" brut />
          <group position={[tc[0], 0.12, TRAPPE.z - TRAPPE.t / 2]} rotation={[-ouvre + rattle, 0, 0]}>
            <Bloc p={[0, 0, TRAPPE.t / 2]} s={[TRAPPE.t, 0.14, TRAPPE.t]} c="#4A3220" t={teinteEn([tc[0], 0, tc[2]], 1.0)} />
            {Array.from({ length: 4 }, (_, i) => (
              <Bloc key={i} p={[-TRAPPE.t / 2 + 0.275 + i * 0.55, 0.075, TRAPPE.t / 2]} s={[0.04, 0.02, TRAPPE.t]} c="#2A1C12" t={teinteEn([tc[0], 0, tc[2]], 1.0)} />
            ))}
            <Bloc p={[0, 0.1, TRAPPE.t * 0.86]} s={[0.46, 0.05, 0.46]} c="#1A1A1E" t={teinteEn([tc[0], 0, tc[2]], 1.0)} />
            <Bloc p={[0, 0.14, TRAPPE.t * 0.86]} s={[0.34, 0.04, 0.34]} c="#B8A060" t={teinteEn([tc[0], 0, tc[2]], 1.0)} />
          </group>
          {Array.from({ length: 30 }, (_, k) => {
            const i = k % 6;
            const j = Math.floor(k / 6);
            const w = (TAPIS.x1 - TAPIS.x0) / 6;
            const dz = (TAPIS.z1 - TAPIS.z0) / 5;
            const x = TAPIS.x0 + w * (i + 0.5);
            const z = TAPIS.z0 + dz * (j + 0.5);
            const bord = i === 0 || i === 5 || j === 0 || j === 4;
            const glisse = gliss * (3.7 + (j % 2) * 0.1) * (0.6 + 0.4 * (1 - (j + 1) / 5)) + gliss * 0.0;
            const bosse = sol * 0.03 * (j % 2 ? 1 : -1) + (1 - gliss) * (k % 2) * 0.0;
            return <Bloc key={k} p={[x - glisse, 0.09 + bosse + gliss * 0.02 * (i % 2), z + gliss * (j - 2) * 0.05]} s={[w - 0.02, 0.17, dz - 0.02]} c={bord ? "#6A2A36" : (i + j) % 2 ? "#8A3A48" : "#823442"} t={teinteEn([x, 0, z], 1.02)} />;
          })}
          {/* lumière pâle qui monte de la trappe */}
          {lueurTrappe > 0.01 && (
            <>
              <mesh position={[tc[0], 0.1 + ouvre * 1.1, TRAPPE.z + TRAPPE.t / 2 - 0.1]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
                <planeGeometry args={[TRAPPE.t * 0.95, 0.3 + ouvre * 1.8]} />
                <meshBasicMaterial color="#9DB8E8" transparent opacity={0.6 * lueurTrappe} depthWrite={false} blending={THREE.AdditiveBlending} />
              </mesh>
              <Lueur p={[tc[0], 0.3, TRAPPE.z + TRAPPE.t / 2]} s={5.5} c="#A8C8FF" o={0.4 * lueurTrappe} />
              <Tache p={[tc[0], 0.14, TRAPPE.z + TRAPPE.t / 2 + 0.9]} s={[7, 4.6]} c="#BFD8FF" o={0.38 * lueurTrappe} />
              <Lueur p={[tc[0], 1.3, TRAPPE.z + TRAPPE.t / 2 + 0.2]} s={4.2} c="#8FB0F0" o={0.18 * lueurTrappe} />
            </>
          )}
          {/* poussière qui saute au sol quand on frappe dessous */}
          {tk.flatMap((t, kk) =>
            Array.from({ length: 14 }, (_, i) => {
              const dt = T - t;
              if (dt < 0 || dt > 1.1) return null;
              const v = 1.2 + alea(i + kk * 9) * 2.4;
              const y = 0.2 + v * dt - 4.9 * dt * dt * 0.8;
              if (y < 0.15) return null;
              const a = alea(i * 2.3 + kk) * Math.PI * 2;
              const r = 0.4 + alea(i * 4.1 + kk * 3) * 2.3;
              return <Bloc key={`${kk}-${i}`} p={[tc[0] + Math.cos(a) * r, y, tc[2] + Math.sin(a) * r]} s={[0.06, 0.06, 0.06]} c="#B8C4DA" brut opacite={0.85 * (1 - dt / 1.1)} />;
            }),
          )}

          <Personnages liste={liste} frame={frame} T={T} ev={ev} lieu={lieu} />
        </>
      )}

      {lieu === "perron" && (
        <>
          <Zone g={zones.perron} t={[0.4, 0.5, 0.9]} />
          <Porte T={T} ev={ev} ext t={[0.7, 0.78, 1.1]} />
          <PoussiereLinteau T={T} ev={ev} x={PERRON[0] + (PORTE.x0 + PORTE.x1) / 2} z={0.5} />
          <Brume T={T} p={[PERRON[0] - 3.5, 0, 6]} s={[26, 22]} o={0.24} c="#9DB0D0" />
          <Brume T={T + 3} p={[PERRON[0] - 3.5, 0.5, 14]} s={[30, 18]} o={0.2} c="#9DB0D0" />
          <Brume T={T + 6} p={[PERRON[0] - 3.5, 0, 28]} s={[44, 30]} o={0.24} c="#8FA4C8" />
          <Poussieres T={T} a={[PERRON[0] - 8, 0.5, 1]} b={[PERRON[0] + 2, 4, 10]} n={22} c="#B8C8E8" o={0.4} s={0.06} />
          {/* lueur ambrée de la lampe du salon derrière le verre dépoli */}
          <Lueur p={[PERRON[0] + (PORTE.x0 + PORTE.x1) / 2, 2.6, 0.9]} s={3.6} c="#FFB45A" o={0.22} />
          <Lueur p={[PERRON[0] + (PORTE.x0 + PORTE.x1) / 2, 0.15, 1.2]} s={4.4} c="#FFB45A" o={0.12} />
        </>
      )}
      {void H}
      {void E_TOM}
    </>
  );
};
