/**
 * Visuels d'identité de la chaîne, rendus avec le VRAI modèle d'Ecto (même code que les vidéos) :
 * photo de profil / icône d'application (carré, lisible en rond) et bannière YouTube (zone sûre centrale).
 * Aucun logo ni élément de marque d'Anthropic.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Ghost3D } from "../ghost/Ghost3D";
import { resolveGhost } from "../ghost/performance";
import { ensureFonts } from "../fonts";
import { COLORS, FONTS } from "../theme";

const Ecto: React.FC<{ taille: number; rotY?: number }> = ({ taille, rotY = 0.22 }) => {
  const frame = useCurrentFrame();
  const g = resolveGhost({ beats: [{ frame: 0, anchor: "centre", expression: "joie", gesture: "repos" }], envelope: [], seed: 3 }, frame, 30);
  g.pose.rotY = rotY;
  g.pose.face.blink = 0;
  return (
    <ThreeCanvas width={taille} height={taille} camera={{ fov: 22, position: [0, 0.15, 9.5] }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
      <Ghost3D pose={g.pose} />
    </ThreeCanvas>
  );
};

const fond = `radial-gradient(circle at 50% 46%, rgba(255,106,42,0.34) 0%, rgba(255,106,42,0.10) 30%, rgba(0,0,0,0) 52%), radial-gradient(circle at 50% 40%, ${COLORS.bg1} 0%, ${COLORS.bg0} 78%)`;

/** 1024 x 1024 : Ecto tient dans le cercle inscrit (TikTok et YouTube recadrent la photo de profil en rond). */
export const Avatar: React.FC = () => (
  <AbsoluteFill style={{ background: fond, alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 1024, height: 1024, transform: "translateY(18px) scale(1.12)" }}>
      <Ecto taille={1024} />
    </div>
  </AbsoluteFill>
);

/** 2560 x 1440 : tout le contenu utile reste dans la zone sûre de 1546 x 423 au centre (visible sur tous les écrans). */
export const Banniere: React.FC = () => {
  ensureFonts();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, ${COLORS.bg1} 0%, ${COLORS.bg0} 70%)` }}>
      <div
        style={{
          position: "absolute",
          left: (2560 - 1546) / 2,
          top: (1440 - 423) / 2,
          width: 1546,
          height: 423,
          display: "flex",
          alignItems: "center",
          gap: 36,
        }}
      >
        <div style={{ width: 430, height: 430, flex: "none", background: "radial-gradient(circle, rgba(255,106,42,0.30) 0%, rgba(255,106,42,0) 62%)" }}>
          <Ecto taille={430} rotY={0.35} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 132, lineHeight: 1, color: COLORS.text, letterSpacing: -2 }}>
            Studio <span style={{ color: COLORS.orange }}>Fantôme</span>
          </div>
          <div style={{ fontFamily: FONTS.text, fontWeight: 600, fontSize: 52, color: COLORS.mint, whiteSpace: "nowrap" }}>Outils, astuces et actu Claude</div>
          <div style={{ fontFamily: FONTS.text, fontWeight: 400, fontSize: 30, color: COLORS.dim }}>Média indépendant · non affilié à Anthropic</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
