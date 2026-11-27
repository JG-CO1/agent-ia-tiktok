/**
 * Les deux bâtiments que le message efface — la boulangerie (à auvent rayé) et la maison de Mme Lopes — sont construits
 * en blocs INDIVIDUELS (et non fusionnés dans le décor) pour pouvoir se dissoudre bloc par bloc, comme un « annuler ».
 * Repère local : façade en z = 0, tournée vers +z ; le corps du bâtiment est en z < 0.
 */
import type { V3 } from "../../geo";
import { X_MAISON, Z_BOUL, Z_LOPES } from "./monde";

/** `c` = couleur normale, `cr` = couleur dans la rue rose ; `tex` = plan texturé (enseigne) au lieu d'un bloc. */
export type Blk = { p: V3; s: V3; c: string; cr: string; r?: V3; tex?: "enseigne"; /** opacité (vitres) */ o?: number };
export type Edifice = { id: "boulangerie" | "maison"; o: V3; ry: number; blocs: Blk[]; hmax: number };

const B = (p: V3, s: V3, c: string, cr: string, r?: V3, o?: number): Blk => ({ p, s, c, cr, r, o });

function boulangerie(): Blk[] {
  const L: Blk[] = [];
  const w = 9.6;
  const d = 7.5;
  const h = 4.8;
  L.push(B([0, 0.15, -d / 2], [w + 0.5, 0.3, d + 0.4], "#CFC7B8", "#FFB0D0"));
  L.push(B([0, (h + 0.3) / 2, -d / 2], [w, h - 0.3, d], "#FFE3A6", "#FF9BC8"));
  // vitrine : verre translucide en retrait de la façade, étal de pains et de gâteaux derrière (entre le verre et le mur)
  L.push(B([-1.2, 1.95, 0.5], [5.6, 2.3, 0.06], "#BFE6FF", "#FFE3F4", undefined, 0.28));
  L.push(B([-1.2, 3.18, 0.52], [6.0, 0.18, 0.22], "#FFFFFF", "#FFFFFF"));
  L.push(B([-1.2, 0.72, 0.52], [6.0, 0.18, 0.22], "#FFFFFF", "#FFFFFF"));
  L.push(B([-4.1, 1.95, 0.52], [0.18, 2.5, 0.22], "#FFFFFF", "#FFFFFF"));
  L.push(B([1.7, 1.95, 0.52], [0.18, 2.5, 0.22], "#FFFFFF", "#FFFFFF"));
  L.push(B([-1.2, 1.95, 0.52], [0.12, 2.3, 0.16], "#FFFFFF", "#FFFFFF"));
  L.push(B([-1.2, 1.95, 0.05], [5.4, 2.1, 0.1], "#FFD9B0", "#FF7AB8")); // fond de la vitrine (mur clair)
  const PAIN = ["#D9923C", "#C27A2E", "#E8A84C", "#B8692A"];
  for (let k = 0; k < 6; k++) L.push(B([-3.6 + k * 0.95, 1.1, 0.27], [0.8, 0.4, 0.36], PAIN[k % 4], k % 2 ? "#FF5AA8" : "#B040E0"));
  L.push(B([-1.2, 1.62, 0.27], [5.4, 0.1, 0.4], "#F3E7D0", "#FFE0F0")); // étagère
  const GAT = ["#FF8FB8", "#FFFFFF", "#FFD23F", "#8B5A3C", "#FF5C7A"];
  for (let k = 0; k < 5; k++) L.push(B([-3.4 + k * 1.1, 2.0, 0.27], [0.7, 0.42, 0.34], GAT[k], GAT[(k + 2) % 5]));
  // porte à droite
  L.push(B([3.5, 1.75, 0.1], [1.7, 2.9, 0.14], "#FF7A5A", "#B040E0"));
  L.push(B([3.5, 2.35, 0.19], [1.1, 1.2, 0.06], "#BFE6FF", "#FFE3F4", undefined, 0.35));
  L.push(B([3.5, 3.35, 0.14], [2.0, 0.16, 0.2], "#FFFFFF", "#FFFFFF"));
  L.push(B([4.15, 1.6, 0.22], [0.14, 0.14, 0.14], "#FFD23F", "#FFD23F"));
  // auvent rayé (8 bandes inclinées)
  for (let i = 0; i < 8; i++) L.push(B([-4.2 + i * 1.2, 3.72, 1.05], [1.2, 0.12, 2.1], i % 2 ? "#FFFFFF" : "#FF5C7A", i % 2 ? "#FFE0F0" : "#E8308C", [0.32, 0, 0]));
  // enseigne en bois au-dessus de l'auvent
  L.push(B([0, 4.4, 0.1], [7.0, 0.8, 0.2], "#7A4A2A", "#8A2A6A"));
  L.push({ p: [0, 4.4, 0.215], s: [6.6, 0.72, 0.02], c: "#7A4A2A", cr: "#8A2A6A", tex: "enseigne" });
  // toit plat, corniche, cheminée
  L.push(B([0, h + 0.15, -d / 2], [w + 0.6, 0.3, d + 0.5], "#B5523C", "#E8308C"));
  L.push(B([-2.6, h + 1.0, -d + 1.3], [1.0, 1.7, 1.0], "#9B5A45", "#C23C94"));
  // fenêtre d'étage latérale et sacs de farine devant
  L.push(B([-3.4, 3.1, -d + 0.1], [1.6, 1.2, 0.1], "#BFE6FF", "#FFE3F4"));
  return L;
}

function maison(): Blk[] {
  const L: Blk[] = [];
  const w = 8.8;
  const d = 7.5;
  L.push(B([0, 0.15, -d / 2], [w + 0.4, 0.3, d + 0.4], "#CFC7B8", "#FFB0D0"));
  L.push(B([0, 2.5, -d / 2], [w, 4.4, d], "#FFD9B0", "#FF9AC4"));
  // toit en escalier de blocs (4 marches), cheminée
  for (let i = 0; i < 4; i++) L.push(B([0, 4.95 + i * 0.75, -d / 2], [w + 1.0 - i * 2.2, 0.8, d + 0.9], i % 2 ? "#D9604A" : "#C9503C", i % 2 ? "#F040A0" : "#E8308C"));
  L.push(B([2.4, 6.6, -d + 1.6], [0.95, 2.4, 0.95], "#9B5A45", "#C23C94"));
  // porte (à gauche, comme les autres maisons de ce côté) + marches, auvent, paillasson
  L.push(B([-2.2, 1.85, 0.08], [1.7, 3.1, 0.14], "#3F6A9E", "#B040E0"));
  L.push(B([-2.2, 3.5, 0.12], [2.1, 0.2, 0.2], "#FFFFFF", "#FFFFFF"));
  L.push(B([-3.0, 1.85, 0.12], [0.14, 3.2, 0.2], "#FFFFFF", "#FFFFFF"));
  L.push(B([-1.4, 1.85, 0.12], [0.14, 3.2, 0.2], "#FFFFFF", "#FFFFFF"));
  L.push(B([-1.6, 1.75, 0.22], [0.14, 0.14, 0.14], "#FFD23F", "#FFD23F"));
  L.push(B([-2.2, 0.2, 1.0], [2.4, 0.3, 1.5], "#B8B4A8", "#FFC0D8"));
  L.push(B([-2.2, 0.38, 1.2], [1.4, 0.08, 0.8], "#E8604C", "#FFE066"));
  // fenêtre de droite avec volets verts et jardinière fleurie
  L.push(B([2.0, 2.9, 0.06], [2.4, 2.0, 0.1], "#BFE0FF", "#FFE3F4", undefined, 0.4));
  L.push(B([2.0, 4.0, 0.12], [2.8, 0.16, 0.2], "#FFFFFF", "#FFFFFF"));
  L.push(B([2.0, 1.85, 0.12], [2.8, 0.16, 0.2], "#FFFFFF", "#FFFFFF"));
  L.push(B([0.65, 2.95, 0.12], [0.16, 2.2, 0.2], "#FFFFFF", "#FFFFFF"));
  L.push(B([3.35, 2.95, 0.12], [0.16, 2.2, 0.2], "#FFFFFF", "#FFFFFF"));
  L.push(B([2.0, 2.95, 0.12], [0.1, 2.0, 0.16], "#FFFFFF", "#FFFFFF"));
  L.push(B([-0.15, 2.95, 0.14], [0.7, 2.3, 0.12], "#4CA878", "#7A4AE0"));
  L.push(B([4.15, 2.95, 0.14], [0.7, 2.3, 0.12], "#4CA878", "#7A4AE0"));
  L.push(B([2.0, 1.55, 0.4], [2.6, 0.4, 0.5], "#7A5236", "#A03070"));
  const FL = ["#FF5C7A", "#FFD23F", "#FFFFFF", "#FF8FB8", "#FFD23F", "#FF5C7A"];
  for (let k = 0; k < 6; k++) L.push(B([0.9 + k * 0.44, 1.9, 0.42], [0.3, 0.3, 0.3], FL[k], FL[(k + 2) % 6]));
  // œil-de-bœuf et lanterne
  L.push(B([0, 5.9, 0.04], [1.1, 1.1, 0.1], "#FFFFFF", "#FFFFFF"));
  L.push(B([0, 5.9, 0.08], [0.8, 0.8, 0.1], "#BFE0FF", "#FFE3F4"));
  L.push(B([-0.8, 2.9, 0.16], [0.3, 0.4, 0.3], "#3B3B42", "#3B3B42"));
  return L;
}

export const EDIFICES: Edifice[] = [
  { id: "boulangerie", o: [X_MAISON, 0, Z_BOUL], ry: -Math.PI / 2, blocs: boulangerie(), hmax: 6.2 },
  { id: "maison", o: [-X_MAISON, 0, Z_LOPES], ry: Math.PI / 2, blocs: maison(), hmax: 8.0 },
];
