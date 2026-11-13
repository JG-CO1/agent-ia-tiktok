import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

/**
 * Fond de marque : dégradé profond, grille technique qui défile, halos lents, grain, vignette.
 * Optimisé pour le rendu logiciel : couches fixes rastérisées une fois puis déplacées par transform.
 */
export const Background: React.FC<{ accent: string }> = ({ accent }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const gridOffset = (f * 0.35) % 80;
  const g1 = { x: 8 * Math.sin(t * 0.35), y: 6 * Math.cos(t * 0.27) };
  const g2 = { x: 7 * Math.cos(t * 0.31), y: 6 * Math.sin(t * 0.22) };
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 0%, ${COLORS.bg1} 0%, ${COLORS.bg0} 62%)`, overflow: "hidden" }}>
      <Img
        src={staticFile("textures/grille.png")}
        style={{ position: "absolute", left: 0, top: -80, width: 1080, height: 2000, transform: `translateY(${gridOffset}px)`, willChange: "transform" }}
      />
      <div
        style={{
          position: "absolute",
          left: -180,
          top: -60,
          width: 900,
          height: 900,
          background: `radial-gradient(closest-side, ${accent}30, transparent)`,
          transform: `translate(${g1.x * 10.8}px, ${g1.y * 19.2}px)`,
          willChange: "transform",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 430,
          top: 1050,
          width: 1000,
          height: 1000,
          background: `radial-gradient(closest-side, ${COLORS.orange}2C, transparent)`,
          transform: `translate(${g2.x * 10.8}px, ${g2.y * 19.2}px)`,
          willChange: "transform",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -256,
          top: -256,
          width: 1080 + 512,
          height: 1920 + 512,
          backgroundImage: `url(${staticFile("textures/grain.png")})`,
          opacity: 0.035,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(90% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};
