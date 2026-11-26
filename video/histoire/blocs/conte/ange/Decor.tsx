/**
 * « J'étais l'ange gardien… » — décor dynamique : rue ensoleillée (voiture, pilier de lumière, plume), chambre d'Emma
 * (faisceau de la fenêtre, poussière dorée, bocal, silhouette lumineuse), gare (train, barrières, flash, banc, ailes).
 * Seul le lieu où se trouve la caméra est dessiné (les lieux sont à plus de 400 unités les uns des autres).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Bloc, type Teinte } from "../../avatar";
import { Acteurs, Faisceau, Lueur, Ombre, Tache, Zone, visibles, type DonneesConte, type EtatConte } from "../lib";
import { entre, lisse } from "../../maths";
import { CH, GZ, TABLE_CHEVET, Z_PIETON, construireAnge } from "./monde";
import { AilesAnge, Barrieres, Bocal, MainEmma, Nuages, PlumeBloc, PlumeTombe, PluiePlumes, Pilier, SilhouetteDoree, Soleil, Train, Voiture, angleBarriere } from "./objets";
import { L_TRAIN, VIT_TRAIN } from "./histoire";

export const cielAnge = (e?: EtatConte) => e?.ciel ?? "#A9D6EE";

type Lieu = "rue" | "chambre" | "gare";
const lieuDe = (p: V3): Lieu => (p[2] > 400 ? "gare" : p[0] < -200 ? "chambre" : "rue");

const BASE_ZONE: Record<Lieu, Teinte> = { rue: [1.12, 1.07, 0.98], chambre: [1.12, 1.04, 0.92], gare: [1.05, 1.03, 0.97] };
const BASE_ACTEUR: Record<Lieu, Teinte> = { rue: [1.06, 1.02, 0.96], chambre: [1.08, 1.0, 0.92], gare: [1.04, 1.01, 0.96] };
const AMB: Record<string, Teinte> = { souvenir: [1.02, 0.86, 0.66], aube: [1.0, 0.86, 0.8], dore: [1.08, 0.94, 0.76], tendre: [1.0, 0.94, 0.9] };
const teinte = (b: Teinte, amb?: string): Teinte => {
  const a = amb ? AMB[amb] : undefined;
  return a ? [b[0] * a[0], b[1] * a[1], b[2] * a[2]] : b;
};

// ------------------------------------------------------------------ Voiture : trajectoire (arrive vers -z, freine, repart)
const V_VOIT = 20;
function voiture(ev: Record<string, number>, T: number): { z: number; frein: boolean } {
  const tb = ev.sauve - 0.6; // début du freinage
  const dt = T - tb;
  const zFront = Z_PIETON + (V_VOIT * 0.67 - 7 * 0.67 * 0.67); // position du centre au début du freinage = devant + 2,05
  const z0 = zFront + 2.05;
  if (dt < 0) return { z: z0 - V_VOIT * dt, frein: false };
  const arret = V_VOIT / 14; // durée du freinage
  if (dt < arret) return { z: z0 - (V_VOIT * dt - 7 * dt * dt), frein: true };
  const zStop = z0 - (V_VOIT * arret - 7 * arret * arret);
  const repart = arret + 2.2;
  if (dt < repart) return { z: zStop, frein: true };
  const d2 = dt - repart;
  return { z: zStop - Math.min(14, 6 * d2) * d2 * 0.5 - 0 * d2, frein: false };
}

// ------------------------------------------------------------------ Poussière dorée dans le faisceau de la fenêtre
const Poussieres: React.FC<{ T: number; c: V3 }> = ({ T, c }) => (
  <>
    {Array.from({ length: 22 }, (_, i) => {
      const a = i * 2.399;
      const x = c[0] + Math.sin(a) * 2.2 + Math.sin(T * 0.5 + i) * 0.4;
      const z = c[2] + ((i * 29) % 10) * 0.42 + Math.cos(T * 0.4 + i * 2) * 0.3;
      const y = 1.0 + ((i * 17) % 9) * 0.38 + Math.sin(T * 0.6 + i) * 0.25;
      return <Bloc key={i} p={[x, y, z]} s={[0.07, 0.07, 0.07]} c="#FFF0B0" brut opacite={0.55 + Math.sin(T * 2 + i) * 0.25} />;
    })}
  </>
);

const masque = (ev: Record<string, number>): Record<string, number> => ({
  emmaG: ev.flashback - 0.1,
  frereG: ev.flashback - 0.1,
  emma3: ev.flashback + 5.6,
  frere3: ev.flashback + 5.6,
});

export const MondeAnge: React.FC<{ e: EtatConte; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const zones = useMemo(() => construireAnge(), []);
  const T = frame / 30;
  const cam = e.cam.pos;
  const lieu = lieuDe(cam);
  const amb = e.ambiance;
  const ev = data.ev;
  const tz = teinte(BASE_ZONE[lieu], amb);
  const ta = teinte(BASE_ACTEUR[lieu], amb);
  const cache = masque(ev);
  const liste = visibles(data, T, cam, 160).filter((v) => !(v.id in cache && T >= cache[v.id]) && !(v.id === "frereF" && T >= ev.disparait));
  const flashAmbre = amb === "souvenir";

  // ----- ciel : soleil bas venu de l'ouest, nuages
  const soleilDir: V3 = amb === "aube" ? [-210, 55, -150] : [-190, 120, -150];
  const soleilCoul = amb === "aube" ? "#FFB070" : amb === "souvenir" ? "#FFD9A0" : amb === "dore" ? "#FFD27A" : "#FFF0C0";

  // ----- ombres portées des personnages (soleil de l'ouest : elles tombent vers +x)
  const ombres = liste
    .filter((v) => v.d < 55 && !v.a.fantome && v.a.rx === 0 && v.a.p[1] > -5 && lieu !== "chambre")
    .map(({ id, a }) => <Ombre key={id} x={a.p[0] + 0.85 * a.echelle} z={a.p[2] + 0.25 * a.echelle} y={a.p[1] + 0.05} r={0.85 * a.echelle} o={0.34} etire={1.9} angle={Math.PI / 2 - 0.27} />);

  // ----- barrières, trains
  const fenBarr: Array<[number, number]> = [[ev.barr, ev.barrUp], [ev.train2 - 3.2, ev.train2 + 2.2]];
  const angle = angleBarriere(T, fenBarr);
  const clignote = fenBarr.some(([b, h]) => T > b - 0.8 && T < h + 1.2);
  const trains = [ev.train1, ev.train2].map((t0) => ({ t0, z: VIT_TRAIN * (T - t0) })).filter((x) => x.z > -420 && x.z - L_TRAIN < 90);

  // ----- scène 1 : sauvetage
  const dS = T - ev.sauve;
  const pilier1 = Math.max(0, Math.min(1, entre(T, ev.sauve - 0.25, ev.sauve + 0.05)) * (1 - lisse(entre(T, ev.sauve + 0.9, ev.sauve + 2.2))));
  const voit = voiture(ev, T);
  // ----- scène 4 : flash de la gare
  const pilier2 = Math.max(0, entre(T, ev.flashG - 0.35, ev.flashG + 0.05) * (1 - lisse(entre(T, ev.flashG + 1.0, ev.flashG + 2.6))));
  // ----- chambre : silhouette lumineuse
  const sil = Math.min(entre(T, ev.silhouette, ev.silhouette + 0.3), 1 - entre(T, ev.silhouette + 0.9, ev.silhouette + 1.5));
  // ----- final : bocal sur les genoux d'Emma, plume qui descend, couvercle, écriture, disparition
  const emmaF = data.acteur("emmaF", T);
  const frereF = data.acteur("frereF", T);
  const arrivee = ev.depose + 0.85;
  const nPlumesBocal = T >= arrivee ? 13 : 12;
  const lidK = entre(T, ev.couvercle - 0.1, ev.couvercle + 0.35);
  const ecrit = entre(T, ev.ecrit, ev.ecrit + 0.85);
  const evanoui = entre(T, ev.disparait, ev.disparait + 1.7);

  return (
    <>
      <group position={cam}>
        <Soleil dir={soleilDir} couleur={soleilCoul} taille={amb === "aube" ? 46 : 36} />
        {lieu !== "chambre" && <Nuages T={T} couleur={amb === "aube" ? "#FFD8C0" : amb === "souvenir" ? "#F6E6CC" : "#FFFFFF"} />}
      </group>

      {/* ======================================================= RUE */}
      {lieu === "rue" && (
        <>
          <Zone g={zones.rue} t={tz} />
          <mesh geometry={zones.rueOmbres} renderOrder={1}>
            <meshBasicMaterial color="#0B1230" transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          {/* rayons de soleil entre les maisons */}
          <Faisceau p={[-90, 74, -30]} dir={[0.84, -0.52, 0.12]} long={150} rayon={14} c="#FFE9A8" o={0.05} />
          <Faisceau p={[-90, 74, 38]} dir={[0.84, -0.52, 0.12]} long={150} rayon={12} c="#FFE9A8" o={0.045} />
          <Voiture p={[1.8, 0.03, voit.z]} ry={Math.PI} t={ta} frein={voit.frein} />
          <Ombre x={1.8 + 1.1} z={voit.z + 0.5} y={0.06} r={1.7} o={0.34} etire={1.5} angle={0} />
          {/* flash doré du sauvetage : pilier de lumière, halo au sol, pluie de plumes */}
          <Pilier p={[1.0, 0, Z_PIETON]} rayon={2.4} haut={60} o={pilier1} />
          {dS > -0.2 && dS < 2.6 && <Tache p={[1.5, 0.12, Z_PIETON]} s={[16, 16]} c="#FFD86B" o={0.7 * pilier1} />}
          {dS > 0 && dS < 3 && <Lueur p={[6.3, 2.2, Z_PIETON + 0.9]} s={7} c="#FFE08A" o={0.6 * (1 - entre(T, ev.sauve + 0.5, ev.sauve + 2.8))} />}
          <PluiePlumes T={T} t0={ev.sauve + 0.05} centre={[2.2, 0.2, Z_PIETON + 0.4]} rayon={4.5} haut={9} n={16} />
          <PlumeTombe T={T} t0={ev.plumeTombe} duree={1.15} de={[2.3, 5.5, Z_PIETON + 0.3]} sol={[2.6, 0.06, Z_PIETON - 0.4]} s={1.9} />
          <Acteurs liste={liste} frame={frame} T={T} teinte={() => ta} nbDetail={12} ombres={false} />
          {ombres}
        </>
      )}

      {/* ======================================================= CHAMBRE */}
      {lieu === "chambre" && (
        <>
          <Zone g={zones.chambre} t={tz} />
          {/* le ciel et le jardin par la fenêtre : vitre claire, faisceau doré qui tombe sur le tapis */}
          <Faisceau p={[CH[0] + 1.4, 2.5, -4.9]} dir={[0.18, -0.42, 0.88]} long={9.5} rayon={2.7} c="#FFE9A8" o={0.1} />
          <Tache p={[CH[0] + 1.9, 0.12, -1.0]} s={[4.2, 6.2]} c="#FFF0B8" o={0.5} />
          <Lueur p={[CH[0] + 1.4, 2.4, -4.6]} s={9} c="#FFF0B8" o={0.55} />
          <Poussieres T={T} c={[CH[0] + 1.6, 0, -3.2]} />
          {T >= ev.pose && <Bocal p={[TABLE_CHEVET[0], TABLE_CHEVET[1] + 0.58, TABLE_CHEVET[2]]} s={1.05} n={12} T={T} lid={null} />}
          {T >= ev.pose && <Tache p={[TABLE_CHEVET[0], TABLE_CHEVET[1] + 0.03, TABLE_CHEVET[2]]} s={[3.2, 3.2]} c="#FFD54A" o={0.45 + Math.sin(T * 3) * 0.08} />}
          <SilhouetteDoree p={[CH[0] + 1.4, 0, -3.6]} ry={0} e={0.95} o={Math.max(0, sil)} T={T} />
          <Acteurs liste={liste} frame={frame} T={T} teinte={() => ta} nbDetail={6} ombres={false} />
          {ombres}
        </>
      )}

      {/* ======================================================= GARE */}
      {lieu === "gare" && (
        <>
          <Zone g={zones.gare} t={tz} />
          <mesh geometry={zones.gareOmbres} renderOrder={1}>
            <meshBasicMaterial color="#0B1230" transparent opacity={0.36} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <Faisceau p={[-90, 74, GZ - 40]} dir={[0.84, -0.52, 0.12]} long={150} rayon={14} c="#FFE9A8" o={0.04} />
          {trains.map((x) => (
            <Train key={x.t0} z={x.z} t={ta} />
          ))}
          <Barrieres angle={angle} T={T} clignote={clignote} t={ta} />
          {/* flash doré de la gare : pilier de lumière sur les rails, plumes */}
          <Pilier p={[-0.3, 0, GZ + 1.5]} rayon={2.8} haut={70} o={pilier2} />
          {T > ev.flashG - 0.3 && T < ev.flashG + 3 && <Tache p={[-0.3, 0.2, GZ + 1.5]} s={[18, 18]} c="#FFD86B" o={0.7 * pilier2} />}
          <PluiePlumes T={T} t0={ev.flashG + 0.05} centre={[-2.0, 0.2, GZ + 3.0]} rayon={5} haut={10} n={18} duree={3.6} />
          {/* la plume de l'ange (flashback : lumière blanche, sans plume) */}
          {flashAmbre && T > ev.train2 - 0.4 && T < ev.train2 + 1.6 && <Pilier p={[-0.9, 0, GZ + 1.5]} rayon={2.2} haut={50} o={Math.max(0, 1 - Math.abs(T - ev.train2 - 0.1) / 0.9) * 0.9} c="#FFFFFF" />}
          {/* retour au présent : le bocal sur les genoux d'Emma */}
          {emmaF && (
            <group position={[emmaF.p[0] - 0.64 * emmaF.echelle, 1.5, emmaF.p[2]]} rotation={[0, Math.PI / 2, 0]}>
              <Bocal s={0.78} n={nPlumesBocal} T={T} lid={lidK > 0 ? (1 - lisse(lidK)) * 1.6 : null} ecrit={ecrit} t={ta} lueur={T >= arrivee && T < arrivee + 1.2 ? 1.8 : 1} />
              {T >= ev.ecrit && T < ev.ecrit + 1.1 && (
                <MainEmma
                  p={[-0.38 + 0.76 * Math.min(1, ecrit / 0.4) * (ecrit < 0.4 ? 1 : 0) + (ecrit >= 0.4 ? -0.38 + 0.76 * Math.min(1, (ecrit - 0.4) / 0.6) : 0), 0.68 + 0.04, (ecrit < 0.4 ? -0.127 : 0.15) + 0.98 * 0.78]}
                  r={[-0.35, Math.PI, 0]}
                  t={ta}
                />
              )}
              {T >= ev.depose - 0.4 && T < arrivee && (
                <group position={[0, 0.5 + 1.3 * (1 - lisse(entre(T, ev.depose, arrivee))), 0]}>
                  <PlumeBloc s={1.2} o={Math.min(1, (T - (ev.depose - 0.4)) / 0.35)} r={[0, 0.7, 0.12]} />
                  <Lueur p={[0, 0, 0]} s={2.8} c="#FFD54A" o={0.7} />
                </group>
              )}
            </group>
          )}
          {frereF && T < ev.disparait + 0.0 && T >= ev.ange && <AilesAnge p={frereF.p} ry={frereF.ry} e={frereF.echelle} o={lisse(entre(T, ev.ange, ev.ange + 0.7))} T={T} />}
          {frereF && T >= ev.disparait && <SilhouetteDoree p={[frereF.p[0], frereF.p[1] + evanoui * 1.5, frereF.p[2]]} ry={frereF.ry} e={frereF.echelle} o={1 - lisse(evanoui)} T={T} />}
          {frereF && T >= ev.disparait && T < ev.disparait + 2.6 && <AilesAnge p={[frereF.p[0], frereF.p[1] + evanoui * 1.5, frereF.p[2]]} ry={frereF.ry} e={frereF.echelle} o={1 - lisse(evanoui)} T={T} />}
          {T >= ev.disparait && <Pilier p={[frereF ? frereF.p[0] : 0, 0, frereF ? frereF.p[2] : GZ]} rayon={1.8} haut={60} o={Math.sin(Math.min(1, evanoui) * Math.PI) * 0.8} />}
          {T >= ev.disparait && <PluiePlumes T={T} t0={ev.disparait} centre={[frereF ? frereF.p[0] : 0, 0.5, frereF ? frereF.p[2] : GZ]} rayon={2.4} haut={9} n={16} duree={2.6} monte />}
          <Acteurs liste={liste} frame={frame} T={T} teinte={() => ta} nbDetail={8} ombres={false} />
          {ombres}
        </>
      )}
    </>
  );
};
