/**
 * « Mur du silence » — objets tenus en main (origine = bout de la main, y vers le bas) : mug de papa, tasse de thé de maman
 * (avec sa vapeur), lapin en peluche de Lina.
 */
import React from "react";
import type { V3 } from "../../geo";
import { Bloc } from "../../avatar";
import { Lueur } from "../lib";

export const OBJETS_LOCAUX: Record<string, (T: number) => React.ReactNode> = {
  tasse: () => (
    <>
      <Bloc p={[0, -0.26, 0]} s={[0.36, 0.42, 0.36]} c="#6F7A86" />
      <Bloc p={[0, -0.06, 0]} s={[0.3, 0.04, 0.3]} c="#2B2118" />
      <Bloc p={[0.24, -0.26, 0]} s={[0.1, 0.24, 0.1]} c="#6F7A86" />
    </>
  ),
  tasseThe: (T) => (
    <>
      <Bloc p={[0, -0.24, 0]} s={[0.42, 0.34, 0.42]} c="#F4F1E8" />
      <Bloc p={[0, -0.4, 0]} s={[0.44, 0.04, 0.44]} c="#3E6FA8" />
      <Bloc p={[0, -0.06, 0]} s={[0.36, 0.04, 0.36]} c="#B9743A" />
      <Bloc p={[0, -0.5, 0]} s={[0.5, 0.06, 0.5]} c="#E9E3D2" />
      {[0, 1, 2].map((i) => {
        const u = ((T * 0.7 + i / 3) % 1 + 1) % 1;
        return <Bloc key={i} p={[Math.sin(T * 3 + i * 2) * 0.05, 0.1 + u * 0.55, Math.cos(T * 2 + i) * 0.04]} s={[0.07, 0.1, 0.07]} c="#FFFFFF" brut opacite={0.5 * (1 - u)} />;
      })}
    </>
  ),
  lapin: (T) => (
    <>
      <Bloc p={[0, -0.42, 0.02]} s={[0.46, 0.6, 0.34]} c="#F4EFE6" />
      <Bloc p={[0, -0.86, 0.04]} s={[0.42, 0.38, 0.38]} c="#F4EFE6" />
      <Bloc p={[-0.1, -1.22, 0.02]} s={[0.1, 0.5, 0.08]} c="#F4EFE6" r={[0, 0, 0.08 + Math.sin(T * 1.5) * 0.02]} />
      <Bloc p={[0.1, -1.22, 0.02]} s={[0.1, 0.5, 0.08]} c="#F4EFE6" r={[0, 0, -0.08]} />
      <Bloc p={[-0.1, -1.22, 0.07]} s={[0.05, 0.38, 0.02]} c="#F2B6B6" />
      <Bloc p={[0.1, -1.22, 0.07]} s={[0.05, 0.38, 0.02]} c="#F2B6B6" />
      <Bloc p={[-0.09, -0.86, 0.235]} s={[0.06, 0.07, 0.03]} c="#17171C" />
      <Bloc p={[0.09, -0.86, 0.235]} s={[0.06, 0.07, 0.03]} c="#17171C" />
      <Bloc p={[0, -0.95, 0.2]} s={[0.1, 0.06, 0.1]} c="#F2B6B6" />
      <Bloc p={[0, -0.34, -0.2]} s={[0.18, 0.18, 0.12]} c="#FFFFFF" />
    </>
  ),
};

/** Vapeur d'une tasse posée (halos). */
export const Vapeur: React.FC<{ p: V3; T: number }> = ({ p, T }) => (
  <>
    {[0, 1].map((i) => {
      const u = ((T * 0.45 + i / 2) % 1 + 1) % 1;
      return <Lueur key={i} p={[p[0] + Math.sin(T * 2 + i) * 0.06, p[1] + u * 0.9, p[2]]} s={0.5 + u * 0.4} c="#FFFFFF" o={0.4 * (1 - u)} />;
    })}
  </>
);
