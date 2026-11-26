/**
 * « Chaque jeudi, quelque chose vient nous chercher… » — décor dynamique : brouillard volumétrique simulé (couches de
 * sprites, faisceaux, halos), fenêtres qui s'éteignent, vitre qui tremble, rideaux, gouttes, inhalateur qui tombe,
 * créature et main géante, porte et lanterne, lumière qui revient. Un seul lieu est dessiné à la fois (celui de la caméra).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import { versMonde, type V3 } from "../../geo";
import { Avatar, Bloc, type Teinte } from "../../avatar";
import { Faisceau, Lueur, OBJETS, Ombre, Tache, Zone, type DonneesConte, type EtatConte } from "../lib";
import { alea, entre, lisse, mel } from "../../maths";
import type { Acteur } from "../../ville/foule";
import { SOL } from "../../minuit/monde";
import { CHAMBRE, CH, ETAGE, FEN, MAISONS_V, N_FEN, N_VILLE, ORDRE_EXTINCTION, PORTE, VITRE_Z, construireBrouillard } from "./monde";
import { BX, creatureEtat, tremblement } from "./histoire";
import { Creature, MainGeante, Seg, coude } from "./creature";
import { IDS_ACTEURS } from "./mise";
import { boutMain } from "./fk";

export const cielBrouillard = (e?: EtatConte) => e?.ciel ?? e?.brouillard?.[0] ?? "#4A5775";

const [XC] = CHAMBRE;
const [PX] = PORTE;
type Lieu = "ville" | "chambre" | "porte";
const lieuDe = (p: V3): Lieu => (p[0] < -200 ? "chambre" : p[0] > 200 ? "porte" : "ville");
const mixT = (a: Teinte, b: Teinte, k: number): Teinte => [mel(a[0], b[0], k), mel(a[1], b[1], k), mel(a[2], b[2], k)];
const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// ------------------------------------------------------------------ Brume : couches de sprites translucides
const Brume: React.FC<{ n: number; x: [number, number]; z: [number, number]; y: [number, number]; s: [number, number]; c?: string; o: number; T: number; cam: V3; graine?: number; derive?: number; monte?: number }> = ({ n, x, z, y, s, c = "#A9B9D4", o, T, cam, graine = 0, derive = 1.5, monte = 0 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const r = (k: number) => alea(i * 7 + k * 131 + graine * 17);
      const p: V3 = [mel(x[0], x[1], r(1)) + Math.sin(T * 0.13 + i) * derive, mel(y[0], y[1], r(2)) + monte, mel(z[0], z[1], r(3)) + Math.cos(T * 0.1 + i * 1.7) * derive];
      const d = dist3(p, cam);
      const fade = Math.min(1, Math.max(0, (d - 2.5) / 10));
      const op = o * (0.55 + 0.45 * r(4)) * fade;
      return op > 0.004 ? <Lueur key={i} p={p} s={mel(s[0], s[1], r(5))} c={c} o={op} /> : null;
    })}
  </>
);

// ------------------------------------------------------------------ Objets en main propres à cette vidéo
const Cle: React.FC<{ T: number }> = ({ T }) => (
  <group rotation={[0, 0.5 + Math.sin(T * 1.3) * 0.3, Math.sin(T * 2.1) * 0.12]} scale={1.15}>
    {/* anneau carré (poignée), tige, deux dents : noir profond */}
    <Bloc p={[0, -0.06, 0]} s={[0.3, 0.05, 0.06]} c="#0B0B10" />
    <Bloc p={[0, -0.28, 0]} s={[0.3, 0.05, 0.06]} c="#0B0B10" />
    <Bloc p={[-0.125, -0.17, 0]} s={[0.05, 0.27, 0.06]} c="#0B0B10" />
    <Bloc p={[0.125, -0.17, 0]} s={[0.05, 0.27, 0.06]} c="#0B0B10" />
    <Bloc p={[0, -0.62, 0]} s={[0.07, 0.7, 0.06]} c="#0B0B10" />
    <Bloc p={[0.08, -0.84, 0]} s={[0.14, 0.07, 0.06]} c="#0B0B10" />
    <Bloc p={[0.07, -0.72, 0]} s={[0.12, 0.07, 0.06]} c="#0B0B10" />
  </group>
);
const Mallette: React.FC = () => (
  <>
    <Bloc p={[0, -0.04, 0]} s={[0.07, 0.08, 0.34]} c="#241A12" />
    <Bloc p={[0, -0.42, 0]} s={[0.22, 0.6, 0.86]} c="#3B2A1E" />
    <Bloc p={[0, -0.42, 0.44]} s={[0.24, 0.1, 0.04]} c="#C9A24A" brut />
  </>
);
/** Main de la belle-mère : doigts et pouce dans le prolongement de la main, alliance dorée à l'annulaire. */
const MainBague: React.FC<{ peau: string; T: number }> = ({ peau, T }) => (
  <>
    {[-0.15, -0.05, 0.05, 0.15].map((x, i) => (
      <Bloc key={i} p={[x, -0.15, 0]} s={[0.09, 0.3 - (i === 0 || i === 3 ? 0.04 : 0), 0.13]} c={peau} />
    ))}
    <Bloc p={[0.25, -0.03, 0.02]} s={[0.09, 0.22, 0.12]} c={peau} r={[0, 0, -0.55]} />
    <Bloc p={[0.05, -0.12, 0]} s={[0.115, 0.05, 0.155]} c="#FFD34E" brut />
    <Lueur p={[0.05, -0.12, 0.12]} s={0.5 + Math.sin(T * 4) * 0.08} c="#FFE08A" o={0.6} />
  </>
);

// ------------------------------------------------------------------ Personnages
type Vis = { id: string; a: Acteur; d: number };
function visiblesB(data: DonneesConte, T: number, cam: V3): Vis[] {
  const out: Vis[] = [];
  for (const id of IDS_ACTEURS) {
    const a = data.acteur(id, T);
    if (!a) continue;
    const d = dist3(a.p, cam);
    if (d < 90) out.push({ id, a, d });
  }
  return out;
}
const ActeursB: React.FC<{ liste: Vis[]; frame: number; T: number; teinte: (p: V3) => Teinte }> = ({ liste, frame, T, teinte }) => (
  <>
    {liste.map(({ id, a }) => {
      const toks = (a.objet ?? "").split("+");
      const mainD = toks.includes("cle") ? <Cle T={T} /> : toks.includes("inhalateur") && OBJETS.inhalateur ? OBJETS.inhalateur(T) : undefined;
      const mainG = toks.includes("mallette") ? <Mallette /> : id === "bm" ? <MainBague peau={a.tenue.peau} T={T} /> : undefined;
      return (
        <group key={id}>
          <Avatar p={a.p} ry={a.ry} pose={a.pose} tenue={a.tenue} emotion={a.emotion} frame={frame} graine={a.graine} teinte={teinte(a.p)} echelle={a.echelle} sansClin={a.sansClin} clinRapide={a.clinRapide} rx={a.rx} mainD={mainD} mainG={mainG} />
          {a.rx === 0 && a.p[1] < 0.3 && <Ombre x={a.p[0]} z={a.p[2]} y={a.p[1] + 0.075} r={0.85 * a.echelle} o={0.45} etire={1.35} />}
        </group>
      );
    })}
  </>
);

// ------------------------------------------------------------------ La fenêtre du narrateur vue de la rue (elle tremble)
const FenetreN: React.FC<{ T: number; ev: Record<string, number> }> = ({ T, ev }) => {
  const a = tremblement(T, ev, "ville");
  const allume = T < ev.lum0 + 0.9;
  const w = N_FEN.w;
  const h = N_FEN.h;
  const pos = versMonde(N_VILLE.p, N_VILLE.ry, [N_FEN.x, N_FEN.y, 0.1]);
  const jx = Math.sin(T * 83) * 0.06 * a;
  const jy = Math.sin(T * 67 + 1) * 0.04 * a;
  return (
    <group position={pos} rotation={[0, N_VILLE.ry, 0]}>
      <group position={[jx, jy, 0]} rotation={[0, 0, Math.sin(T * 59) * 0.012 * a]}>
        <Bloc p={[0, 0, 0.0]} s={[w, h, 0.06]} c={allume ? "#E3B26A" : "#1C2230"} brut />
        {/* rideau et silhouette dans la lumière */}
        <Bloc p={[-w * 0.36, 0, 0.05]} s={[w * 0.26, h - 0.1, 0.05]} c={allume ? "#8A4A58" : "#161A24"} brut />
        <Bloc p={[w * 0.36, 0, 0.05]} s={[w * 0.26, h - 0.1, 0.05]} c={allume ? "#8A4A58" : "#161A24"} brut />
        {/* cadre et croisillons */}
        <Bloc p={[0, h / 2 + 0.1, 0.1]} s={[w + 0.5, 0.2, 0.2]} c="#EFEDE6" />
        <Bloc p={[0, -h / 2 - 0.1, 0.16]} s={[w + 0.7, 0.2, 0.34]} c="#EFEDE6" />
        <Bloc p={[-w / 2 - 0.1, 0, 0.1]} s={[0.2, h, 0.2]} c="#EFEDE6" />
        <Bloc p={[w / 2 + 0.1, 0, 0.1]} s={[0.2, h, 0.2]} c="#EFEDE6" />
        <Bloc p={[0, 0, 0.1]} s={[0.1, h, 0.1]} c="#EFEDE6" />
        <Bloc p={[0, h * 0.15, 0.1]} s={[w, 0.1, 0.1]} c="#EFEDE6" />
        {/* reflet pâle sur la vitre */}
        <mesh position={[0, 0, 0.12]}>
          <planeGeometry args={[w * 0.96, h * 0.96]} />
          <meshBasicMaterial color="#B9CCEE" transparent opacity={0.16 + 0.06 * Math.sin(T * 41) * a} depthWrite={false} />
        </mesh>
      </group>
      {allume && <Lueur p={[0, 0, 1.4]} s={9} c="#FFB866" o={0.55} />}
    </group>
  );
};

// ------------------------------------------------------------------ VILLE
const Ville: React.FC<{ e: EtatConte; T: number; ev: Record<string, number>; zones: ReturnType<typeof construireBrouillard>; data: DonneesConte; frame: number }> = ({ e, T, ev, zones, frame }) => {
  const cam = e.cam.pos;
  const tZ: Teinte = [0.46, 0.52, 0.72];
  const cr = creatureEtat("ville", T, ev);
  const tC: Teinte = [0.8, 0.85, 1.1];
  return (
    <>
      <Zone g={zones.ville} t={tZ} />
      {/* fenêtres éclairées : elles s'éteignent l'une après l'autre sur « éteindre les lumières » */}
      {MAISONS_V.map((md, i) => {
        const off = ev.lum0 + ((ORDRE_EXTINCTION.indexOf(i % 17) + 1) * 0.055);
        if (T >= off) return null;
        const wp = versMonde(md.p, md.ry, [md.fenX, 2.6, 0.1]);
        const n: V3 = [Math.sin(md.ry), 0, Math.cos(md.ry)];
        return (
          <group key={i}>
            <group position={wp} rotation={[0, md.ry, 0]}>
              <Bloc s={[md.fenW - 0.1, 1.78, 0.05]} c="#FFC468" brut />
              <Bloc p={[0, 0, 0.04]} s={[0.1, 1.78, 0.04]} c="#EFEDE6" />
            </group>
            <Lueur p={[wp[0] + n[0] * 1.4, wp[1], wp[2] + n[2] * 1.4]} s={7.5} c="#FFB45E" o={0.5} />
            <Tache p={[wp[0] + n[0] * 3.4, 0.1, wp[2] + n[2] * 3.4]} s={[7, 7]} c="#FFB45E" o={0.2} />
          </group>
        );
      })}
      <FenetreN T={T} ev={ev} />
      {/* brouillard épais : nappe basse dans l'avenue, nappe haute qui recouvre les toits */}
      <Brume n={46} x={[-22, 22]} z={[-140, 70]} y={[0.8, 5]} s={[16, 34]} o={0.22} T={T} cam={cam} graine={1} />
      <Brume n={26} x={[-40, 40]} z={[-130, 60]} y={[8, 12]} s={[30, 52]} o={0.3} T={T} cam={cam} graine={2} derive={3} />
      {cr && <Creature c={cr} t={tC} />}
    </>
  );
};

// ------------------------------------------------------------------ CHAMBRE
const Chambre: React.FC<{ e: EtatConte; T: number; ev: Record<string, number>; zones: ReturnType<typeof construireBrouillard>; data: DonneesConte; frame: number }> = ({ e, T, ev, zones, data, frame }) => {
  const cam = e.cam.pos;
  const lum = lisse(entre(T, ev.lumiere, ev.lumiere + 2.0));
  const tI = mixT([0.5, 0.56, 0.8], [1.12, 1.0, 0.84], lum);
  const tE = mixT([0.56, 0.62, 0.88], [0.9, 0.95, 1.12], lum);
  const tA = mixT([0.82, 0.86, 1.08], [1.12, 1.02, 0.9], lum);
  const trem = tremblement(T, ev, "chambre");
  const cr = creatureEtat("chambre", T, ev);
  const liste = visiblesB(data, T, cam);
  // rideaux : fermés sur « fermer les fenêtres », rouverts pendant le flashback
  const ferme = lisse(entre(T, ev.ferme0, ev.ferme1 + 0.3)) * (1 - lisse(entre(T, ev.rideauOuvre, ev.rideauOuvre + 0.5)));
  const lw = mel(0.9, 2.35, ferme);
  const lx = mel(-2.85, -1.12, ferme);
  // gouttes sur la vitre
  const gouttes = [
    { t: ev.goutte1, x: -0.65, y: 2.75 },
    { t: ev.goutte2, x: 0.45, y: 2.9 },
    { t: ev.goutte3, x: -0.15, y: 2.62 },
  ];
  // l'inhalateur lâché : tombe de la main du narrateur, rebondit, roule
  const prop = useMemo(() => {
    const a = data.acteur("nar", ev.tombe - 0.04);
    return a ? boutMain(a, -1, 0.5) : ([XC + 0.9, 1.6, -3.5] as V3);
  }, [data, ev.tombe]);
  const dt = T - ev.tombe;
  let inh: { p: V3; r: number } | null = null;
  if (dt > 0) {
    const g = 20;
    const tFloor = Math.sqrt((2 * Math.max(0.05, prop[1] - 0.12)) / g);
    let y = 0.12;
    if (dt < tFloor) y = prop[1] - 0.5 * g * dt * dt;
    else {
      const t2 = dt - tFloor;
      y = 0.12 + Math.max(0, 1.6 * t2 - 0.5 * g * t2 * t2) * 0.35;
    }
    const roule = Math.min(dt, 1.2);
    inh = { p: [prop[0] + 0.35 * roule, y, prop[2] + 0.5 * roule], r: dt * 5 };
  }
  const lampe: V3 = [XC - 1.55, 1.82, 2.45];
  return (
    <>
      <Zone g={zones.dehors} t={tE} />
      <Zone g={zones.chambre} t={tI} />
      {/* vitre, qui tremble quand la créature passe ou frappe */}
      <group position={[Math.sin(T * 79) * 0.03 * trem, Math.sin(T * 61) * 0.02 * trem, 0]} rotation={[0, 0, Math.sin(T * 53) * 0.006 * trem]}>
        <mesh position={[XC, (FEN.y0 + FEN.y1) / 2, VITRE_Z + 0.02]}>
          <planeGeometry args={[FEN.x1 - FEN.x0, FEN.y1 - FEN.y0]} />
          <meshBasicMaterial color="#C3D4F2" transparent opacity={0.1} depthWrite={false} />
        </mesh>
        {gouttes.map((g, i) => {
          const d = T - g.t;
          if (d < 0 || d > 5) return null;
          const gl = Math.max(0, d - 0.35);
          const y = g.y - 0.55 * Math.pow(gl, 1.35);
          const splash = d < 0.25 ? 1 + (0.25 - d) * 5 : 1;
          return (
            <group key={i} position={[XC + g.x, y, VITRE_Z + 0.06]}>
              <Bloc s={[0.2 * splash, 0.28 * splash, 0.03]} c="#E6F0FF" brut opacite={0.92} />
              <Bloc p={[0, 0.09 + gl * 0.3, 0]} s={[0.07, 0.1 + gl * 0.6, 0.02]} c="#CFE0FA" brut opacite={0.55} />
              <Lueur p={[0, 0, 0.12]} s={0.9} c="#CFE3FF" o={0.4} />
            </group>
          );
        })}
      </group>
      {/* rideaux : voilage translucide (on devine la silhouette derrière) et lourdes tentures */}
      <Bloc p={[XC + lx, 2.05, -3.2]} s={[lw, 3.1, 0.07]} c="#8478A0" opacite={0.5} t={tI} />
      <Bloc p={[XC - lx, 2.05, -3.2]} s={[lw, 3.1, 0.07]} c="#8478A0" opacite={0.5} t={tI} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Bloc p={[XC + s * 2.65, 2.05, -3.5]} s={[1.0, 3.5, 0.22]} c="#6E3342" t={tI} />
          <Bloc p={[XC + s * 2.35, 2.05, -3.4]} s={[0.35, 3.5, 0.3]} c="#7C3B4C" t={tI} />
        </group>
      ))}
      {/* lumière de lune par la fenêtre, poussière et brume dans le faisceau */}
      <Tache p={[XC - 0.4, 0.11, -1.2]} s={[7, 6]} c="#9DB4F0" o={0.3 * (1 - lum)} />
      <Faisceau p={[XC, 2.2, -4.5]} dir={[-0.25, -0.5, 1]} long={10} rayon={2.7} c="#9DB6F0" o={0.075 * (1 - 0.8 * lum)} />
      {/* la lampe de chevet : la lumière revient */}
      {lum > 0.02 && (
        <>
          <Bloc p={lampe} s={[0.58, 0.47, 0.58]} c="#FFE2A0" brut opacite={lum} />
          <Lueur p={[lampe[0], lampe[1], lampe[2] - 0.3]} s={11} c="#FFC87A" o={0.55 * lum} />
          <Tache p={[XC - 2.4, 0.11, 1.6]} s={[8, 8]} c="#FFC87A" o={0.34 * lum} />
          <Faisceau p={lampe} dir={[0.3, -0.7, -0.5]} long={5} rayon={2.4} c="#FFC87A" o={0.08 * lum} />
        </>
      )}
      {/* brume dans la rue, qui s'éloigne quand la lumière revient */}
      <Brume n={34} x={[XC - 40, XC + 40]} z={[-34, -6]} y={[-4.6, 4]} s={[14, 30]} o={0.2 * (1 - 0.85 * lum)} T={T} cam={cam} graine={3} />
      {inh && (
        <group position={inh.p} rotation={[inh.r * 0.6, inh.r * 0.3, inh.r]} scale={1.5}>
          {OBJETS.inhalateur(T)}
        </group>
      )}
      {inh && <Lueur p={[inh.p[0], inh.p[1] + 0.3, inh.p[2]]} s={1.6} c="#7FB0FF" o={0.35} />}
      {cr && <Creature c={cr} t={[0.7, 0.75, 0.95]} />}
      <ActeursB liste={liste} frame={frame} T={T} teinte={() => tA} />
      {void BX}
      {void CH}
      {void ETAGE}
    </>
  );
};

// ------------------------------------------------------------------ PORTE
/** Ouverture du vantail (0 = fermé, 1 = grand ouvert vers l'intérieur). */
export function ouvPorte(T: number, ev: Record<string, number>): number {
  if (T < ev.perePart + 3.6) return 0.85 * lisse(entre(T, ev.perePart - 1.8, ev.perePart - 1.1)) * (1 - lisse(entre(T, ev.perePart + 3.0, ev.perePart + 3.6)));
  if (T < ev.invFin) return 0.45 * lisse(entre(T, ev.porteInvite + 0.2, ev.invFin - 0.1));
  if (T < ev.medecin - 0.3) return 0.14 * lisse(entre(T, ev.porteDeverr, ev.porteDeverr + 0.5));
  return mel(0.14, 0.95, lisse(entre(T, ev.medecin - 0.3, ev.medecin + 1.1)));
}
const Porte: React.FC<{ e: EtatConte; T: number; ev: Record<string, number>; zones: ReturnType<typeof construireBrouillard>; data: DonneesConte; frame: number }> = ({ e, T, ev, zones, data, frame }) => {
  const cam = e.cam.pos;
  const tZ: Teinte = [0.5, 0.56, 0.76];
  const tA: Teinte = [0.9, 0.92, 1.05];
  const liste = visiblesB(data, T, cam);
  const cr = creatureEtat("porte", T, ev);
  const ouv = ouvPorte(T, ev);
  const vacille = 0.85 + 0.15 * Math.sin(T * 23) * Math.sin(T * 7.3);
  // verrou : se retire sur « déverrouillée »
  const verrou = 1 - lisse(entre(T, ev.porteDeverr, ev.porteDeverr + 0.15));
  // brume qui monte derrière le médecin à la fin
  const monte = lisse(entre(T, ev.sourire - 0.6, ev.fin + 1));
  // mur de brume qui avale le père
  const zm = mel(36, 9, lisse(entre(T, ev.brumeMur - 0.9, ev.brumeMur + 1.4)));
  // bras géant qui tâtonne à la porte
  const kb = lisse(entre(T, ev.mainPorte0, ev.mainPorte0 + 0.7)) * (1 - lisse(entre(T, ev.mainPorte1 - 0.2, ev.mainPorte1 + 0.5)));
  return (
    <>
      <Zone g={zones.porte} t={tZ} />
      {/* le vantail de la porte d'entrée (charnière à gauche, s'ouvre vers l'intérieur) */}
      <group position={[PX - 0.75, SOL + 1.5, 0.02]} rotation={[0, ouv * 1.65, 0]}>
        <Bloc p={[0.75, 0, 0]} s={[1.5, 3.0, 0.12]} c="#3A526B" t={tZ} />
        <Bloc p={[0.75, 0.7, 0.07]} s={[1.06, 0.95, 0.03]} c="#3A526B" t={mixT(tZ, [1.2, 1.2, 1.2], 0.5)} />
        <Bloc p={[0.75, -0.7, 0.07]} s={[1.06, 1.05, 0.03]} c="#3A526B" t={mixT(tZ, [1.2, 1.2, 1.2], 0.5)} />
        <Bloc p={[1.28, -0.1, 0.1]} s={[0.2, 0.52, 0.05]} c="#8A7440" t={tZ} />
        <Bloc p={[1.28, 0.02, 0.14]} s={[0.05, 0.1, 0.03]} c="#050507" />
        <Bloc p={[1.2, -0.3, 0.17]} s={[0.22, 0.09, 0.14]} c="#D5AF55" t={tZ} />
        <Bloc p={[1.5 - 0.09 * verrou, 0.1, 0]} s={[0.2 * verrou + 0.02, 0.14, 0.09]} c="#B89A52" />
      </group>
      {/* lanterne murale : la seule lumière, chaude, dans le brouillard */}
      <Bloc p={[PX + 1.55, SOL + 2.5, 0.2]} s={[0.16, 0.2, 0.16]} c="#FFD27A" brut />
      <Lueur p={[PX + 1.55, SOL + 2.5, 0.7]} s={7 * vacille} c="#FFB458" o={0.75 * vacille} />
      <Tache p={[PX + 1.4, 0.12, 2.6]} s={[7, 7]} c="#FFB458" o={0.3 * vacille} />
      <Faisceau p={[PX + 1.55, SOL + 2.4, 0.4]} dir={[0.15, -0.8, 0.6]} long={6.5} rayon={2.4} c="#FFB458" o={0.1 * vacille} />
      {/* brouillard dense autour de la maison */}
      <Brume n={50} x={[PX - 30, PX + 30]} z={[-3, 46]} y={[0.6, 4.6]} s={[14, 30]} o={0.22} T={T} cam={cam} graine={5} />
      <Brume n={14} x={[PX - 9, PX + 9]} z={[zm - 3, zm + 3]} y={[1, 6]} s={[18, 30]} o={0.45 * lisse(entre(T, ev.brumeMur - 0.9, ev.brumeMur + 0.4))} T={T} cam={cam} graine={6} derive={0.5} />
      {monte > 0.01 && (
        <>
          <Brume n={20} x={[PX - 7, PX + 7]} z={[-2.5, 2]} y={[0.4, 3.2]} s={[10, 18]} o={0.4 * monte} T={T} cam={cam} graine={7} monte={monte * 2.4} />
          <Brume n={14} x={[PX - 12, PX + 12]} z={[-3, 0.5]} y={[4, 8]} s={[14, 24]} o={0.35 * monte} T={T} cam={cam} graine={8} monte={-monte * 0.5} />
        </>
      )}
      {cr && <Creature c={cr} t={[0.75, 0.8, 1.0]} />}
      {kb > 0.01 && <BrasPorte T={T} k={kb} t={[0.8, 0.85, 1.05]} />}
      <ActeursB liste={liste} frame={frame} T={T} teinte={() => tA} />
    </>
  );
};

/** Bras géant qui sort du brouillard et tâtonne sur la poignée sans réussir à la tourner. */
const BrasPorte: React.FC<{ T: number; k: number; t: Teinte }> = ({ T, k, t }) => {
  const knob = new THREE.Vector3(PX + 0.55, 1.75, 0.45);
  const loin = new THREE.Vector3(5, 5.5, 9).multiplyScalar(1 - k);
  const wob = new THREE.Vector3(Math.sin(T * 3.1) * 0.35, Math.sin(T * 2.3) * 0.3 + 0.25, 0.9 + Math.sin(T * 1.7) * 0.2);
  const H = knob.clone().add(wob).add(loin);
  const S = new THREE.Vector3(PX + 8, 11, 20);
  const el = coude(S, H, 14, 14, new THREE.Vector3(0.4, 1, 0.2));
  const ex = new THREE.Vector3().subVectors(H, el.e).normalize();
  const n = new THREE.Vector3(0, 0, -1);
  const ey = new THREE.Vector3().crossVectors(n, ex).normalize();
  const ez = new THREE.Vector3().crossVectors(ex, ey).normalize();
  return (
    <>
      <Seg a={S} b={el.e} w={1.0} h={1.0} c="#191B22" t={t} />
      <Seg a={el.e} b={H} w={0.8} h={0.8} c="#191B22" t={t} />
      <MainGeante p={H} ex={ex} ey={ey} ez={ez} s={3.6} t={t} ecart={1.2 + 0.3 * Math.sin(T * 5)} plie={0.45 + 0.2 * Math.sin(T * 4)} />
    </>
  );
};

// ------------------------------------------------------------------ Monde
export const MondeBrouillard: React.FC<{ e: EtatConte; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const zones = useMemo(() => construireBrouillard(), []);
  const T = frame / 30;
  const lieu = lieuDe(e.cam.pos);
  const ev = data.ev;
  return (
    <>
      {lieu === "ville" && <Ville e={e} T={T} ev={ev} zones={zones} data={data} frame={frame} />}
      {lieu === "chambre" && <Chambre e={e} T={T} ev={ev} zones={zones} data={data} frame={frame} />}
      {lieu === "porte" && <Porte e={e} T={T} ev={ev} zones={zones} data={data} frame={frame} />}
    </>
  );
};
