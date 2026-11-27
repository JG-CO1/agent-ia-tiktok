/** La ville des somnambules — décor dynamique : portes qui s'ouvrent, lanternes, faisceaux, mur de terre, poignée, lune. */
import React, { useMemo } from "react";
import { versMonde, type V3 } from "../../geo";
import { Bloc, type Teinte } from "../../avatar";
import { Acteurs, Ciel, Faisceau, Lueur, Tache, Zone, mainDroite, visibles, type DonneesConte, type EtatConte } from "../lib";
import { lisse, entre } from "../../maths";
import { FENETRE, MAISON, MAISONS, MONT, PORTE_Z, SALON, TUNNEL, construireSomnambules, seuil } from "./monde";

export const cielSomnambules = (e?: EtatConte) => e?.ciel ?? "#0A0F22";

const lieuDe = (p: V3): "tunnel" | "mont" | "chambre" | "salon" | "ville" => (p[2] > 200 ? "tunnel" : p[0] > 200 ? "mont" : p[0] < -370 ? "chambre" : p[0] < -200 ? "salon" : "ville");
const TEINTE_ACTEUR: Record<string, Teinte> = { tunnel: [1.0, 0.8, 0.62], mont: [0.78, 0.84, 1.08], chambre: [0.74, 0.8, 1.08], salon: [1.1, 0.96, 0.8], ville: [0.76, 0.82, 1.06] };
const TEINTE_ZONE: Record<string, Teinte> = { tunnel: [1.0, 0.74, 0.52], mont: [0.48, 0.56, 0.88], chambre: [0.7, 0.78, 1.1], salon: [1.16, 0.96, 0.76], ville: [0.42, 0.5, 0.82] };

export const MondeSomnambules: React.FC<{ e: EtatConte; frame: number; data: DonneesConte }> = ({ e, frame, data }) => {
  const zones = useMemo(() => construireSomnambules(), []);
  const T = frame / 30;
  const cam = e.cam.pos;
  const lieu = lieuDe(cam);
  const aube = e.ambiance === "aube";
  const ev = data.ev;
  const liste = visibles(data, T, cam, 150);
  const teinteActeur = (p: V3): Teinte => (aube && lieuDe(p) === "ville" ? [1.1, 0.9, 0.82] : TEINTE_ACTEUR[lieuDe(p)]);
  const tZone: Teinte = aube && lieu === "ville" ? [1.0, 0.8, 0.72] : TEINTE_ZONE[lieu];

  // portes : s'ouvrent toutes ensemble, se referment au retour
  const ouv = lisse(entre(T, ev.ouv, ev.ouv + 0.55)) * (1 - lisse(entre(T, ev.ferme, ev.ferme + 0.8)));
  // la lanterne du professeur roule après la poussée
  const pr = data.acteur("prof", ev.pousse + 0.4);
  const dtL = T - (ev.pousse + 0.3);
  const roule = dtL > 0 && pr ? 4.2 * (1 - Math.exp(-2.2 * dtL)) : 0;
  const lanterneSol: V3 | null = dtL > -0.01 && pr ? [pr.p[0] + roule * 0.5, 0.42, pr.p[2] + roule * 0.87 + 0.6] : null;

  // mur de terre : neuf blocs qui tombent un à un, le dernier sur la frappe
  const grille = Array.from({ length: 9 }, (_, k) => ({ x: ((k % 3) - 1) * 2.4, y: 1.1 + Math.floor(k / 3) * 2.3, tombe: k === 4 ? ev.frappe : ev.frappe + 0.2 + ((k * 5) % 9) * 0.1 }));
  const jeu = (k: number) => lisse(entre(T, grille[k].tombe, grille[k].tombe + 0.4));
  const epais = 1 - 0.55 * lisse(entre(T, ev.debutCreuse ?? 0, ev.frappe)); // la paroi s'amincit à mesure qu'on creuse
  const murs = grille;
  const handle = lisse(entre(T, ev.poignee, ev.poignee + 1.3));

  const lune: V3 = [cam[0] - 60, cam[1] + 90, cam[2] - 300];
  const vib = T > ev.toc1 - 0.05 ? Math.max(0, Math.sin((T - ev.toc1) * 60) * Math.exp(-((T - ev.toc1) % 0.55) * 7)) : 0;

  return (
    <>
      <group position={cam}>
        {aube ? <Ciel etoiles={false} lune={[-60, 40, -300]} rayonLune={42} couleurLune="#FFC890" /> : <Ciel lune={[-45, 112, -290]} rayonLune={30} />}
      </group>
      {void lune}

      {lieu === "ville" && (
        <>
          <Zone g={zones.ville} t={tZone} />
          {MAISONS.map((md, i) => (
            <group key={i} position={md.p} rotation={[0, md.ry, 0]}>
              {ouv > 0.01 && (
                <mesh position={[md.porteX, 1.75, 0.3]}>
                  <planeGeometry args={[1.5, 2.9]} />
                  <meshBasicMaterial color="#030308" />
                </mesh>
              )}
              <group position={[md.porteX - 0.75, 1.75, 0.34]} rotation={[0, -ouv * 1.75, 0]}>
                <Bloc p={[0.75, 0, 0]} s={[1.5, 2.9, 0.1]} c={md.porteC} t={tZone} />
              </group>
              {ouv > 0.4 && <Lueur p={[md.porteX, 1.6, 0.9]} s={3.4} c="#3C4A78" o={0.35 * ouv} />}
            </group>
          ))}
        </>
      )}

      {lieu === "mont" && (
        <>
          <Zone g={zones.mont} t={tZone} />
          {[-1, 1].map((s) => (
            <group key={s}>
              <Bloc p={[MONT[0] + s * 6.9, 2.9, -22]} s={[0.3, 0.46, 0.3]} c="#FFD27A" brut />
              <Lueur p={[MONT[0] + s * 6.9, 2.9, -22]} s={4.5} c="#FFB347" o={0.5} />
              <Tache p={[MONT[0] + s * 6.9, 0.1, -21]} s={[12, 12]} c="#FFB347" o={0.28} />
            </group>
          ))}
          {lanterneSol && (
            <group position={lanterneSol} rotation={[0, 0.6, Math.PI / 2 + roule * 0.6]}>
              <Bloc s={[0.34, 0.5, 0.34]} c="#26262C" />
              <Bloc s={[0.27, 0.42, 0.27]} c="#FFD27A" brut />
              <Lueur p={[0, 0, 0]} s={3.2 + Math.sin(T * 25) * 0.25} c="#FFC766" o={0.6} />
            </group>
          )}
          {lanterneSol && <Tache p={[lanterneSol[0], 0.1, lanterneSol[2]]} s={[11, 11]} c="#FFC766" o={0.4} />}
        </>
      )}

      {lieu === "chambre" && (
        <>
          <Zone g={zones.maison} t={tZone} />
          <mesh position={[MAISON[0], (FENETRE.y0 + FENETRE.y1) / 2, -4.55]}>
            <planeGeometry args={[FENETRE.x1 - FENETRE.x0, FENETRE.y1 - FENETRE.y0]} />
            <meshBasicMaterial color="#9DB6E8" transparent opacity={0.13} depthWrite={false} />
          </mesh>
          <Tache p={[MAISON[0], 0.1, -1.6]} s={[7, 6]} c="#8FB0FF" o={0.28} />
          <Lueur p={[MAISON[0] - 3.7, 1.3, -1.6]} s={2.2} c="#FFB347" o={0.3} />
        </>
      )}

      {lieu === "salon" && (
        <>
          <Zone g={zones.salon} t={tZone} />
          <Lueur p={[SALON[0] + 4.1, 3.3, 1.5]} s={9} c="#FFC766" o={0.4} />
          <Tache p={[SALON[0], 0.1, 0]} s={[11, 10]} c="#FFC766" o={0.35} />
        </>
      )}

      {lieu === "tunnel" && (
        <>
          <Zone g={zones.tunnel} t={tZone} />
          {[-1, 1].map((s) => [388, 376, 366].map((z, i) => (
            <group key={`${s}${i}`}>
              <Bloc p={[s * 3.9, 5.2 - (i % 2) * 0.3, z]} s={[0.3, 0.42, 0.3]} c="#FFD27A" brut />
              <Lueur p={[s * 3.9, 5.2 - (i % 2) * 0.3, z]} s={5.5} c="#FFB347" o={0.5 + Math.sin(T * 9 + i + s) * 0.05} />
            </group>
          )))}
          <Tache p={[0, 0.1, 372]} s={[14, 40]} c="#FFB347" o={0.22} />
          <Lueur p={[0, 3.2, 362.6]} s={9} c="#FFC766" o={0.32} />
          {murs.map((m, k) => (
            <group key={k} position={[m.x, m.y - jeu(k) * m.y * 0.9, PORTE_Z + 1.3 + (1 - epais) * 0.6 + jeu(k) * 1.4]} scale={1 - jeu(k) * 0.4}>
              {jeu(k) < 0.98 && <Bloc s={[2.45, 2.35, 1.3 * epais + 0.3]} c="#4A3B2B" t={tZone} r={[0, 0, jeu(k) * 0.8]} />}
            </group>
          ))}
          <group position={[1.9 + vib * 0.04, 3.2, PORTE_Z + 0.85]} rotation={[0, 0, -handle * 0.6]}>
            <Bloc p={[0, -0.1, 0]} s={[0.4, 0.8, 0.2]} c="#2B2F36" t={tZone} />
            <Bloc p={[0.3, -0.4, 0.05]} s={[0.9, 0.3, 0.3]} c="#2B2F36" t={tZone} />
          </group>
          {T > ev.frappe && T < ev.frappe + 1.4 && <Lueur p={[0, 3.2, PORTE_Z + 2]} s={12 + (T - ev.frappe) * 6} c="#B49A78" o={0.35 * (1 - (T - ev.frappe) / 1.4)} />}
        </>
      )}

      {/* faisceaux des lanternes portées (brouillard volumétrique simulé) */}
      {liste.filter((v) => v.a.objet === "lanterne" && v.d < 70).map((v) => {
        const h = mainDroite(v.a);
        const dir: V3 = [Math.sin(v.a.ry) * 0.8, -0.55, Math.cos(v.a.ry) * 0.8];
        return <Faisceau key={v.id} p={h} dir={dir} long={11} rayon={4.2} c="#FFC766" o={0.09} />;
      })}

      <Acteurs liste={liste} frame={frame} T={T} teinte={teinteActeur} nbDetail={lieu === "ville" ? 18 : 14} />
      {void versMonde}
      {void seuil}
      {void TUNNEL}
    </>
  );
};
