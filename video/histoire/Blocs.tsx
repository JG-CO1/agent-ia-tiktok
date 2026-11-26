import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ensureFonts } from "../fonts";
import type { Cam } from "./blocs/maths";
import { decouper, dureeBlocs, motsAffiches, planCourant, tempsMot, type Minutage, type RecitBlocs } from "./blocs/decoupage";
import { plansDe } from "./blocs/plans-registre";
import { sceneDe } from "./blocs/scenes";

ensureFonts();

/**
 * Format « blocs » : fausse capture de gameplay d'un jeu en blocs (voir
 * histoires/idees-chatgpt/2026-11-22-style-capture-roblox.md). Low-poly, couleurs plates, aucun éclairage réel,
 * caméra de joueur, coupes franches calées sur les mots de la narration, un seul mot à l'écran.
 * La mise en scène de chaque histoire vit dans son dossier (video/histoire/blocs/minuit/).
 */
export type BlocsSpec = RecitBlocs & { prononciation?: Record<string, string> };
export type BlocsProps = { spec: BlocsSpec; minutage: Minutage };

const DISPLAY = "Inter Display, Inter, sans-serif";

const ReglageCamera: React.FC<{ cam: Cam }> = ({ cam }) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.up.set(0, 1, 0);
    camera.fov = cam.fov;
    camera.near = 0.12;
    camera.far = 950;
    camera.lookAt(...cam.look);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  });
  return null;
};

// Largeur approximative (en em) des capitales d'Inter Display Black, pour faire tenir le mot dans l'écran.
const ETROIT = "IÎÏ'’.,!:;";
const LARGE = "MWŒÆ";
function largeurEm(texte: string) {
  let w = 0;
  for (const ch of texte) w += ch === " " ? 0.28 : ETROIT.includes(ch) ? 0.36 : LARGE.includes(ch) ? 1.02 : ch === "-" ? 0.48 : 0.75;
  return w;
}

/** Un seul mot à l'écran : très gros, blanc, contour noir épais, centré à ~53 % de la hauteur, sans bandeau. */
const Mot: React.FC<{ texte: string; age: number }> = ({ texte, age }) => {
  const taille = Math.min(150, Math.floor(930 / Math.max(1, largeurEm(texte))));
  const pop = age < 3 ? 0.86 + 0.14 * Math.min(1, (age + 1) / 3) + (age === 2 ? 0.03 : 0) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 1018,
        height: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: taille,
          lineHeight: 1,
          letterSpacing: -1,
          color: "#FFFFFF",
          WebkitTextStroke: `${Math.round(taille * 0.15)}px #000000`,
          paintOrder: "stroke fill",
          transform: `scale(${pop})`,
          whiteSpace: "nowrap",
        }}
      >
        {texte}
      </div>
    </div>
  );
};

export const Blocs: React.FC<BlocsProps> = ({ spec, minutage }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const duree = dureeBlocs(minutage);

  const mes = sceneDe(spec.mise_en_scene);
  const plans = useMemo(() => decouper(spec, minutage, plansDe(spec.mise_en_scene, spec.episode ?? spec.id)), [spec, minutage]);
  const data = useMemo(() => mes.preparer?.(spec, minutage), [spec, minutage, mes]);
  const mots = useMemo(() => motsAffiches(minutage.mots), [minutage]);
  const sons = useMemo(() => mes.sons(spec, minutage, plans, data), [spec, minutage, plans, data, mes]);

  const plan = planCourant(plans, t);
  const d = Math.max(0.2, plan.fin - plan.debut);
  const loc = t - plan.debut;
  const etat = plan.def.etat({
    p: Math.min(1, Math.max(0, loc / d)),
    t: loc,
    d,
    T: t,
    frame,
    mot: (k) => tempsMot(spec, minutage, plan.def.scene, k) - plan.debut,
    data,
  });
  const ciel = mes.ciel(etat);

  // mot courant : affiché jusqu'au mot suivant (ou 0,4 s après sa fin)
  let iMot = -1;
  for (let i = 0; i < mots.length; i++) if (t >= mots[i].debut) iMot = i;
  const mot = iMot >= 0 ? mots[iMot] : null;
  const motVisible = mot && t <= mot.fin + 0.4;
  const finNarration = mots.length ? mots[mots.length - 1].fin : duree;
  const cloture = interpolate(t, [finNarration + 0.45, finNarration + 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const totalFrames = Math.ceil(duree * fps);

  return (
    <AbsoluteFill style={{ background: ciel, overflow: "hidden" }}>
      <ThreeCanvas flat width={width} height={height} camera={{ fov: etat.cam.fov, position: etat.cam.pos, near: 0.12, far: 950 }} gl={{ antialias: true }} style={{ background: ciel }}>
        <color attach="background" args={[ciel]} />
        {etat.brouillard && <fog attach="fog" args={[etat.brouillard[0], etat.brouillard[1], etat.brouillard[2]]} />}
        <ReglageCamera cam={etat.cam} />
        <mes.Monde e={etat} frame={frame} data={data} />
      </ThreeCanvas>

      {/* effets de plan (récits sombres) : vignette, teinte (souvenirs), flash (révélations), fondu au noir */}
      {etat.fx?.vignette ? <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 38%, rgba(0,0,0,${etat.fx.vignette}) 100%)` }} /> : null}
      {etat.fx?.teinte ? <div style={{ position: "absolute", inset: 0, background: etat.fx.teinte[0], opacity: etat.fx.teinte[1], mixBlendMode: "soft-light" }} /> : null}
      {etat.fx?.flash && etat.fx.flash[1] > 0.001 ? <div style={{ position: "absolute", inset: 0, background: etat.fx.flash[0], opacity: etat.fx.flash[1] }} /> : null}
      {etat.fx?.noir && etat.fx.noir > 0.001 ? <div style={{ position: "absolute", inset: 0, background: "#000", opacity: etat.fx.noir }} /> : null}

      {motVisible && mot && cloture < 0.01 && <Mot texte={mot.texte} age={frame - Math.round(mot.debut * fps)} />}

      {/* Question finale : reste à l'écran après le dernier mot (même style que les sous-titres, sans bandeau) */}
      {cloture > 0 && (
        <div style={{ position: "absolute", left: 70, right: 70, top: 1018, height: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: cloture }}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: 84,
              lineHeight: 1.12,
              textAlign: "center",
              textTransform: "uppercase",
              color: "#FFFFFF",
              WebkitTextStroke: "14px #000000",
              paintOrder: "stroke fill",
              transform: `scale(${0.94 + 0.06 * cloture})`,
            }}
          >
            {spec.cloture}
          </div>
        </div>
      )}

      {minutage.voix && <Audio src={staticFile(minutage.voix)} />}
      {sons.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.t * fps))} durationInFrames={Math.max(1, Math.min(totalFrames, Math.round((s.duree ?? 4) * fps)))} layout="none">
          <Audio src={staticFile(s.src)} loop={s.boucle} volume={s.enveloppe ? (f) => s.volume * interpolate(f, s.enveloppe!.map((x) => x[0] * fps), s.enveloppe!.map((x) => x[1]), { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
