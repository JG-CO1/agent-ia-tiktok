/**
 * « Chaque fois que je regarde mon téléphone… » — décor dynamique : lumière cyan de l'écran (halo, cône, poussière), jour et
 * nuit qui défilent par la fenêtre, horloge qui s'emballe, porte de la maison de Noa, voitures et passants de 2085, soleil
 * couchant. Seul le lieu où se trouve la caméra est dessiné (les lieux sont à plus de 400 unités les uns des autres).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Avatar, Bloc, type Teinte } from "../../avatar";
import { halo } from "../../textures";
import { Ciel, Faisceau, Lueur, Ombre, Tache, Zone, type DonneesConte, type EtatConte } from "../lib";
import { entre, lisse } from "../../maths";
import type { Acteur } from "../../ville/foule";
import { CH, CH_W, CH_Z, COULEURS_VOITURES, LAMPES, PORTE_CH, FEN_CH, FEN_SA, LIT_Y, PERRON_Y, ROUTE_Z, SA, construireTelephone } from "./monde";
import { IDS_ACTEURS } from "./mise";
import { VOITURES } from "./histoire";
import { annee, cielHeure, eclatTotal, heure, soleil } from "./temps";
import { ecranCle } from "./ecran";
import { Canne, CoiffureTete, CYAN, FlaqueSoleil, Horloge, Plaid, Poussieres, Telephone, YeuxSup, type Coiffure } from "./objets";
import { boutMain, yeux, matTete, transformer } from "./fk";

const ZPORTE = (PORTE_CH.z0 + PORTE_CH.z1) / 2;
export const cielTelephone = (e?: EtatConte) => e?.ciel ?? "#0A0F22";

export type Lieu = "chambre" | "salon" | "rue";
export const lieuDe = (p: V3): Lieu => (p[0] < -300 ? "chambre" : p[0] > 300 ? "salon" : "rue");

const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255];
const COIFFURE: Record<string, Coiffure> = { noa: "noa", noaR: "noa", lila1: "lila1", lila2: "lila2", lila3: "lila3" };
const LILA = new Set(["lila1", "lila2", "lila3"]);

// ------------------------------------------------------------------ Soleil couchant (disque + halo, insensible au brouillard)
let tDisque: THREE.Texture | null = null;
function disque(): THREE.Texture {
  if (!tDisque) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const c = cv.getContext("2d")!;
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,1)");
    g.addColorStop(0.58, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tDisque = tx;
  }
  return tDisque;
}
const SoleilCiel: React.FC<{ dir: V3; couleur: string; taille: number }> = ({ dir, couleur, taille }) => (
  <group position={dir}>
    <sprite scale={[taille * 6, taille * 6, 1]} renderOrder={-8}>
      <spriteMaterial map={halo()} color={couleur} transparent opacity={0.6} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
    </sprite>
    <sprite scale={[taille, taille, 1]} renderOrder={-7}>
      <spriteMaterial map={disque()} color="#FFF1CC" transparent opacity={0.98} depthWrite={false} fog={false} />
    </sprite>
  </group>
);

// ------------------------------------------------------------------ Téléphone : position et orientation dans le monde
function reperePhone(a: Acteur, cam: V3, face: number): { p: V3; q: [number, number, number, number]; centre: V3; oeil: V3 } | null {
  const e = a.echelle;
  const f = new THREE.Vector3(Math.sin(a.ry), 0, Math.cos(a.ry));
  if (a.objet === "tel2") {
    const L = boutMain(a, 1, 0.5);
    const R = boutMain(a, -1, 0.5);
    const c = new THREE.Vector3((L[0] + R[0]) / 2, (L[1] + R[1]) / 2 + 0.12 * e, (L[2] + R[2]) / 2);
    const o = yeux(a);
    const n = new THREE.Vector3(o[0] - c.x, o[1] - c.y, o[2] - c.z).normalize();
    // l'écran regarde ses yeux, mais reste un peu relevé vers le spectateur placé devant lui
    n.lerp(f.clone().multiplyScalar(0.8).add(new THREE.Vector3(0, 0.6, 0)).normalize(), 0.18).normalize();
    if (face > 0) n.lerp(new THREE.Vector3(cam[0] - c.x, cam[1] - c.y, cam[2] - c.z).normalize(), face).normalize();
    const q = basePhone(n, f);
    return { p: [c.x, c.y, c.z], q: [q.x, q.y, q.z, q.w], centre: [c.x, c.y, c.z], oeil: o };
  }
  if (a.objet === "tel1") {
    const h = boutMain(a, -1, 0.5);
    const o = yeux(a);
    const raised = a.pose.brasD.x < -0.8;
    const c = new THREE.Vector3(h[0], h[1], h[2]);
    let n: THREE.Vector3;
    if (raised) {
      c.add(new THREE.Vector3(0, 0.34 * e, 0).add(f.clone().multiplyScalar(0.06)));
      n = new THREE.Vector3(o[0] - c.x, o[1] - c.y, o[2] - c.z).normalize();
      if (face > 0) n.lerp(new THREE.Vector3(cam[0] - c.x, cam[1] - c.y, cam[2] - c.z).normalize(), face).normalize();
    } else {
      c.add(new THREE.Vector3(0, -0.26 * e, 0));
      n = f.clone().multiplyScalar(0.75).add(new THREE.Vector3(0, 0.65, 0)).normalize();
      if (face > 0) n.lerp(new THREE.Vector3(cam[0] - c.x, cam[1] - c.y, cam[2] - c.z).normalize(), face).normalize();
    }
    const q = basePhone(n, f);
    return { p: [c.x, c.y, c.z], q: [q.x, q.y, q.z, q.w], centre: [c.x, c.y, c.z], oeil: o };
  }
  return null;
}

/** Repère du téléphone : l'écran regarde `n` ; le haut du téléphone est « vers le haut » (sinon vers l'avant du porteur si `n` est presque vertical). */
function basePhone(n: THREE.Vector3, f: THREE.Vector3): THREE.Quaternion {
  const up = new THREE.Vector3(0, 1, 0);
  const yUp = up.clone().sub(n.clone().multiplyScalar(up.dot(n)));
  const yF = f.clone().sub(n.clone().multiplyScalar(f.dot(n)));
  const w = Math.min(1, Math.max(0, (Math.abs(up.dot(n)) - 0.7) / 0.25));
  const y = yUp.lengthSq() < 1e-6 ? yF : yUp.normalize().multiplyScalar(1 - w).add(yF.lengthSq() < 1e-6 ? yUp : yF.normalize().multiplyScalar(w));
  y.normalize();
  const x = new THREE.Vector3().crossVectors(y, n).normalize();
  const y2 = new THREE.Vector3().crossVectors(n, x).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y2, n));
}

type Vis = { id: string; a: Acteur; d: number };
function onde(T: number, t0: number, t1: number, t2: number, t3: number) {
  return lisse(entre(T, t0, t1)) * (1 - lisse(entre(T, t2, t3)));
}

export const MondeTelephone: React.FC<{ e: EtatConte & { face?: number }; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const zones = useMemo(() => construireTelephone(), []);
  const T = frame / 30;
  const cam = e.cam.pos;
  const lieu = lieuDe(cam);
  const ev = data.ev;

  // ----- temps qui passe
  const h = heure(T, ev);
  const ciel = cielHeure(h);
  const sol = soleil(h);
  const nuit = sol.haut < -0.05;
  const sc = ecranCle(T, ev);
  const flash = eclatTotal(T, ev);
  const sunRGB = hex(sol.couleur);

  // ----- personnages visibles
  const liste: Vis[] = [];
  for (const id of IDS_ACTEURS) {
    const a = data.acteur(id, T);
    if (!a) continue;
    if (lieuDe(a.p) !== lieu) continue;
    const d = Math.hypot(a.p[0] - cam[0], a.p[1] - cam[1], a.p[2] - cam[2]);
    if (d < 120) liste.push({ id, a, d });
  }
  liste.sort((u, v) => u.d - v.d);

  // ----- teintes
  const lum = sol.lum;
  const teinteInt = (base: Teinte): Teinte => [base[0] * (0.8 + lum * (0.55 * sunRGB[0])), base[1] * (0.8 + lum * (0.45 * sunRGB[1])), base[2] * (0.8 + lum * (0.4 * sunRGB[2]))];
  const tzChambre = teinteInt([0.33, 0.39, 0.66]);
  const tzSalon = teinteInt([0.62, 0.55, 0.56]);
  const hall = lisse(entre(T, data.mot(0, 6) - 0.4, data.mot(0, 6) - 0.05));
  const tzCouloir: Teinte = [(0.25 + 0.85 * hall), (0.2 + 0.7 * hall), (0.18 + 0.52 * hall)];
  const tzRue: Teinte = [1.0, 0.8, 0.62];
  const tActeur = (id: string, a: Acteur): Teinte => {
    if (lieu === "rue") return [1.2, 0.92, 0.72];
    if (id === "noa") return sc.on ? [0.66, 1.0, 1.2] : lieu === "salon" ? [0.72, 0.66, 0.7] : [0.46, 0.52, 0.8];
    if (lieu === "chambre") return a.p[0] > CH[0] + CH_W - 1.6 ? [0.95, 0.75, 0.6] : [0.5, 0.56, 0.82];
    return teinteInt([0.92, 0.82, 0.78]);
  };

  // ----- éléments qui bougent
  const porte = Math.max(onde(T, ev.porteOuv, ev.porteOuv + 0.45, ev.porteFerme, ev.porteFerme + 0.5), onde(T, ev.porte2, ev.porte2 + 0.45, ev.porte3, ev.porteClose));
  const phones = liste.map((v) => ({ v, r: reperePhone(v.a, cam, e.face ?? 0) })).filter((x) => x.r);

  // ----- lumière du jour par la fenêtre
  const dansChambre = lieu === "chambre";
  const dansSalon = lieu === "salon";

  const ombres = liste
    .filter((v) => v.d < 60 && !v.a.fantome && v.a.rx === 0 && v.a.p[1] > -5)
    .map(({ id, a }) =>
      lieu === "rue" ? (
        <Ombre key={id} x={a.p[0] + 0.9 * a.echelle} z={a.p[2] + 0.2 * a.echelle} y={a.p[1] + 0.06} r={0.85 * a.echelle} o={0.42} etire={2.2} angle={Math.PI / 2 - 0.1} />
      ) : (
        <Ombre key={id} x={a.p[0]} z={a.p[2]} y={a.p[1] + 0.1} r={0.8 * a.echelle} o={0.4} etire={1.25} />
      ),
    );

  return (
    <>
      {/* ---------------- ciel */}
      <group position={cam}>
        {lieu !== "rue" && nuit && <Ciel lune={[-45, 112, -290]} rayonLune={24} />}
        {lieu === "rue" && <SoleilCiel dir={[-300, 30, 46]} couleur="#FF8A3C" taille={46} />}
      </group>

      {/* ======================================================= CHAMBRE */}
      {dansChambre && (
        <>
          <Zone g={zones.chambre} t={tzChambre} />
          <Zone g={zones.couloir} t={tzCouloir} />
          {/* le jour et la nuit par la fenêtre */}
          <mesh position={[CH[0], (FEN_CH.y0 + FEN_CH.y1) / 2, -CH_Z - 0.08]}>
            <planeGeometry args={[FEN_CH.x1 - FEN_CH.x0, FEN_CH.y1 - FEN_CH.y0]} />
            <meshBasicMaterial color={ciel} transparent opacity={0.34} depthWrite={false} fog={false} />
          </mesh>
          <Faisceau p={[CH[0] + 0.2, 2.3, -CH_Z + 0.1]} dir={[0.12, -0.4, 0.9]} long={9.5} rayon={2.7} c={sol.couleur} o={0.13 * lum} />
          <FlaqueSoleil p={[CH[0] + 0.7, 0.13, -1.0]} s={[4.0, 6.0]} c={sol.couleur} o={0.55 * lum} angle={0.1} />
          <Lueur p={[CH[0] + 0.1, 2.2, -CH_Z + 0.3]} s={7} c={sol.couleur} o={0.5 * lum} />
          {/* le couloir allumé, derrière la porte de droite */}
          <Lueur p={[CH[0] + CH_W + 1.0, 2.6, ZPORTE]} s={8} c="#FFC890" o={0.5 * hall} />
          <FlaqueSoleil p={[CH[0] + CH_W - 1.4, 0.13, ZPORTE]} s={[5.2, 4.6]} c="#FFB870" o={0.5 * hall} angle={Math.PI / 2} />
          <Faisceau p={[CH[0] + CH_W + 0.1, 2.9, ZPORTE]} dir={[-0.85, -0.55, 0]} long={6} rayon={2.3} c="#FFC890" o={0.08 * hall} />
        </>
      )}

      {/* ======================================================= SALON */}
      {dansSalon && (
        <>
          <Zone g={zones.salon} t={tzSalon} />
          <mesh position={[SA[0] + 5.46, (FEN_SA.y0 + FEN_SA.y1) / 2, (FEN_SA.z0 + FEN_SA.z1) / 2]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[FEN_SA.z1 - FEN_SA.z0, FEN_SA.y1 - FEN_SA.y0]} />
            <meshBasicMaterial color={ciel} transparent opacity={0.4} depthWrite={false} fog={false} />
          </mesh>
          <Faisceau p={[SA[0] + 5.3, 2.4, -0.8]} dir={[-0.88, -0.42, 0.08]} long={10} rayon={2.6} c={sol.couleur} o={0.14 * lum} />
          <FlaqueSoleil p={[SA[0] + 2.7, 0.13, -0.6]} s={[6.0, 3.6]} c={sol.couleur} o={0.6 * lum} angle={0.15} />
          <Lueur p={[SA[0] + 5.2, 2.2, -0.8]} s={7} c={sol.couleur} o={0.5 * lum} />
          <Lueur p={[SA[0] + 4.7, 2.0, 1.6]} s={4.5} c="#FFD9A0" o={0.5} />
          <Horloge p={[SA[0] - 0.2, 3.0, -4.63]} h={h} />
        </>
      )}

      {/* ======================================================= RUE (2085, soleil couchant) */}
      {lieu === "rue" && (
        <>
          <Zone g={zones.rue} t={tzRue} />
          <Faisceau p={[-110, 64, 12]} dir={[0.86, -0.46, 0.06]} long={170} rayon={15} c="#FF9A55" o={0.075} />
          <Faisceau p={[-110, 70, -6]} dir={[0.86, -0.5, 0.12]} long={170} rayon={11} c="#FFB070" o={0.05} />
          {/* lampadaires et enseignes allumés */}
          {LAMPES.filter(([x]) => Math.abs(x - cam[0]) < 90).map(([x, z, cote]) => (
            <Lueur key={`${x}${z}`} p={[x, 4.9, z + cote * 1.05]} s={5.5} c="#BFF7FF" o={0.55} />
          ))}
          {[[-50, "#FF4FA3"], [-8, "#2EE6D6"], [30, "#FFD23A"], [62, "#8A4DFF"]].filter(([x]) => Math.abs((x as number) - cam[0]) < 100).map(([x, c]) => (
            <Lueur key={`b${x}`} p={[x as number, 7.3, ROUTE_Z - 1.9]} s={9} c={c as string} o={0.4} />
          ))}
          <Lueur p={[1.6, PERRON_Y + 3.0, 1.6]} s={4.5} c="#FFD9A0" o={0.5} />
          <Lueur p={[-4.2, 2.6, 0.8]} s={5} c="#FFC86A" o={0.45} />
          <Lueur p={[4.2, 2.6, 0.8]} s={5} c="#FFC86A" o={0.45} />
          <Tache p={[0, PERRON_Y + 0.05, 1.2]} s={[6, 5]} c="#FFC86A" o={0.4} />
          {/* la porte de la maison de Noa (battante, vers l'extérieur) */}
          <group position={[-0.78, PERRON_Y + 1.58, 0.12]} rotation={[0, -1.75 * porte, 0]}>
            <Bloc p={[0.78, 0, 0]} s={[1.56, 3.16, 0.12]} c="#7A4A35" t={tzRue} />
            <Bloc p={[0.78, 0.55, 0.07]} s={[1.06, 1.0, 0.03]} c="#8E5A42" t={tzRue} />
            <Bloc p={[0.78, -0.8, 0.07]} s={[1.06, 1.05, 0.03]} c="#8E5A42" t={tzRue} />
            <Bloc p={[1.35, -0.15, 0.1]} s={[0.14, 0.14, 0.1]} c="#D5AF55" t={tzRue} />
          </group>
          {porte > 0.05 && <Lueur p={[0, PERRON_Y + 1.8, -0.6]} s={4.2} c="#FFC86A" o={0.5 * porte} />}
          {/* les voitures de 2085 : bulles colorées qui flottent, feux allumés */}
          {VOITURES.map(([tC, sens, z, v, ci], i) => {
            const x = sens * v * (T - tC);
            if (Math.abs(x - cam[0]) > 130) return null;
            const y = 0.28 + Math.sin(T * 3 + i) * 0.03;
            return (
              <group key={i} position={[x, y, z]} rotation={[0, sens > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
                <Zone g={zones.voitures[COULEURS_VOITURES[ci % COULEURS_VOITURES.length]]} t={[1.05, 0.9, 0.82]} />
                <Lueur p={[0, 0.9, 2.3]} s={3.4} c="#FFF3D0" o={0.7} />
                <Lueur p={[0, 0.7, -2.3]} s={2.4} c="#FF4A5A" o={0.55} />
                <Tache p={[0, -0.1, 0]} s={[3.4, 5.2]} c="#37D8FF" o={0.35} />
              </group>
            );
          })}
        </>
      )}

      {/* ======================================================= LE FAUTEUIL DE GRAND-MÈRE : plaid sur les genoux, puis plié */}
      {dansSalon && (
        <Plaid p={[SA[0] + 3.3 - 0.45, 0.96, -0.9 - 0.45]} ry={-Math.PI * 0.75} plie={T >= ev.b5} t={tzSalon} />
      )}

      {/* ======================================================= PERSONNAGES */}
      {liste.map(({ id, a, d }) => {
        const t = tActeur(id, a);
        const dh = a.pose.y ?? 0;
        return (
          <group key={id}>
            <Avatar p={a.p} ry={a.ry} pose={a.pose} tenue={a.tenue} emotion={a.emotion} frame={frame} graine={a.graine} teinte={t} echelle={a.echelle} sansClin={a.sansClin} rx={a.rx} mainD={a.objet === "canne" ? <Canne /> : undefined}>
              {id === "lila3" && (
                <>
                  <Bloc p={[0, 0.95 + 1.0 + dh - 0.08, -0.02]} s={[1.18, 0.34, 0.66]} c="#F2C230" t={t} />
                  <Bloc p={[0.4, 0.95 + 0.62 + dh, 0.3]} s={[0.36, 0.7, 0.06]} c="#F2C230" t={t} />
                  <Bloc p={[-0.4, 0.95 + 0.62 + dh, 0.3]} s={[0.36, 0.7, 0.06]} c="#F2C230" t={t} />
                  <Bloc p={[0, 0.95 + 0.4 + dh, -0.36]} s={[1.0, 0.8, 0.06]} c="#E3B52A" t={t} />
                </>
              )}
            </Avatar>
            {COIFFURE[id] && d < 40 && <CoiffureTete a={a} type={COIFFURE[id]} t={t} />}
            {LILA.has(id) && d < 40 && <YeuxSup a={a} frame={frame} type="lila" />}
            {(id === "noa" || id === "noaR") && sc.on && d < 40 && a.pose.tete && (a.objet === "tel2" || a.pose.brasD.x < -0.8) && <YeuxSup a={a} frame={frame} type="noa" />}
          </group>
        );
      })}
      {ombres}

      {/* ======================================================= TÉLÉPHONES : écran émissif, halo cyan, poussière */}
      {phones.map(({ v, r }) => {
        const pr = r!;
        const a = v.a;
        const e2 = a.echelle;
        const noir = !sc.on;
        const vers = new THREE.Vector3(pr.oeil[0] - pr.centre[0], pr.oeil[1] - pr.centre[1], pr.oeil[2] - pr.centre[2]);
        const haut = a.objet === "tel2";
        const dessus: V3 = [pr.centre[0] + vers.x * 0.5, pr.centre[1] + vers.y * 0.5, pr.centre[2] + vers.z * 0.5];
        const sol0 = dansSalon ? 0.76 : LIT_Y + 0.2;
        const fl = noir ? 0 : 1;
        return (
          <group key={`tel${v.id}`}>
            <group position={pr.p} quaternion={pr.q}>
              <Telephone cle={noir ? null : sc.cle} T={T} s={0.92} pouce={haut && !noir && sc.cle.startsWith("feed")} peau={a.tenue.peau} lueur={1} />
            </group>
            {!noir && haut && <Lueur p={dessus} s={2.4 * e2} c={CYAN} o={0.3} />}
            {!noir && haut && <Lueur p={[pr.centre[0], pr.centre[1] - 0.1, pr.centre[2]]} s={3.6 * e2} c="#2A9BD6" o={0.12} />}
            {!noir && haut && (
              <Faisceau p={[pr.centre[0], pr.centre[1], pr.centre[2]]} dir={[vers.x, vers.y, vers.z]} long={Math.max(0.8, vers.length() * 1.8)} rayon={0.9 * e2} c="#5BDFFF" o={0.16} />
            )}
            {!noir && haut && <Tache p={[pr.centre[0], dansSalon ? 0.13 : 0.13, pr.centre[2]]} s={[5.2 * e2, 5.2 * e2]} c={CYAN} o={0.45 * fl} />}
            {!noir && haut && <Tache p={[pr.centre[0] - (dansSalon ? 0 : 0.3), sol0, pr.centre[2] - (dansSalon ? 0.4 : 0)]} s={[3.6 * e2, 3.6 * e2]} c="#7FE9FF" o={0.35 * fl} />}
            {!noir && haut && <Poussieres T={T} p={[pr.centre[0] + vers.x * 0.3, pr.centre[1] - 0.4, pr.centre[2] + vers.z * 0.3]} rayon={1.1 * e2} />}
            {!noir && !haut && <Lueur p={pr.centre} s={4.2} c={CYAN} o={0.34} />}
          </group>
        );
      })}
      {void annee}
      {void matTete}
      {void transformer}
      {void CH_W}
    </>
  );
};

