/**
 * Matériaux d'Ecto.
 *  - « physique » : matériaux PBR de référence (vernis, reflets d'environnement). Lents en rendu logiciel.
 *  - « matcap »   : éclairage pré-calculé depuis les matériaux physiques (video/public/matcaps/*.png).
 *    La caméra et les lumières étant fixes, le rendu est quasi identique pour une fraction du coût.
 * Régénérer les matcaps après toute modification de lumière/couleur : `npm run fm -- matcaps`.
 */
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

export const PALETTE = {
  body: "#F4561C",
  bodySheen: "#FF9C66",
  hand: "#FF7438",
  metal: "#262B36",
  led: "#8CFFF0",
} as const;

export type MatcapName = "corps" | "main" | "metal" | "verre";
export const MATCAPS: MatcapName[] = ["corps", "main", "metal", "verre"];

/** Matériaux PBR de référence (servent aussi à pré-calculer les matcaps). */
export function physicalMaterial(name: MatcapName): THREE.MeshPhysicalMaterial {
  switch (name) {
    case "corps":
    case "main":
      return new THREE.MeshPhysicalMaterial({
        color: name === "corps" ? PALETTE.body : PALETTE.hand,
        roughness: 0.34,
        metalness: 0,
        clearcoat: 0.9,
        clearcoatRoughness: 0.2,
        sheen: 0.25,
        sheenColor: new THREE.Color(PALETTE.bodySheen),
        sheenRoughness: 0.45,
        emissive: new THREE.Color("#FF3A00"),
        emissiveIntensity: 0.07,
      });
    case "metal":
      return new THREE.MeshPhysicalMaterial({ color: PALETTE.metal, roughness: 0.28, metalness: 0.75, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    case "verre":
      // Verre noir : ne garde que les reflets (superposés en additif sur l'écran)
      return new THREE.MeshPhysicalMaterial({ color: "#000000", roughness: 0.18, metalness: 0.05, clearcoat: 0.55, clearcoatRoughness: 0.2, envMapIntensity: 0.35 });
  }
}

/** Charge les matcaps (attend leur chargement avant de capturer la frame). */
export function useMatcaps(): Record<MatcapName, THREE.Texture> | null {
  const [handle] = useState(() => delayRender("Chargement des matcaps d'Ecto"));
  const [tex, setTex] = useState<Record<MatcapName, THREE.Texture> | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    Promise.all(MATCAPS.map((n) => loader.loadAsync(staticFile(`matcaps/${n}.png`))))
      .then((ts) => {
        const out = {} as Record<MatcapName, THREE.Texture>;
        ts.forEach((t, i) => {
          t.colorSpace = THREE.SRGBColorSpace;
          out[MATCAPS[i]] = t;
        });
        setTex(out);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
  return tex;
}

export function matcapMaterials(t: Record<MatcapName, THREE.Texture>) {
  const mk = (n: MatcapName) => new THREE.MeshMatcapMaterial({ matcap: t[n], toneMapped: false });
  const glass = new THREE.MeshMatcapMaterial({
    matcap: t.verre,
    toneMapped: false,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  return { body: mk("corps"), hand: mk("main"), metal: mk("metal"), glass };
}

export function useLedMaterial(glow: number) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: PALETTE.led, toneMapped: false }), []);
  const dim = new THREE.Color("#3FB8AA");
  const bright = new THREE.Color("#C8FFF9");
  mat.color.copy(dim).lerp(bright, Math.min(1, Math.max(0, 0.35 + glow * 0.5)));
  return mat;
}
