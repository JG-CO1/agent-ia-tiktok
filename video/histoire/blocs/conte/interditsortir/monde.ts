/**
 * « Interdit de sortir » — décors fixes en blocs (éclairage cuit, plusieurs variantes : coucher de soleil, crépuscule, nuit).
 * Trois lieux éloignés les uns des autres (la caméra ne voit que celui où elle se trouve) :
 *   EXT     (0, 0, 0)      la ville-forteresse A (z > 0), sa muraille (z = 0), la vallée, la ville jumelle B (z < -66) :
 *                          B est le MIROIR EXACT de A par rapport au plan z = -33 (z' = -66 - z)
 *   TOUR    (400, 0, 0)    intérieur de la vieille tour : escalier en colimaçon, échelle, lucarne
 *   CUISINE (-400, 0, 0)   la salle de la maison : père, table, calendrier, horloge, photo du feu d'artifice
 */
import * as THREE from "three";
import type { V3 } from "../../geo";
import { Bati, nuance, type Variante } from "./bati";

// ------------------------------------------------------------------ Repères
export const ZB = -66;
export const mir = (p: V3): V3 => [p[0], p[1], ZB - p[2]];
export const ryMir = (ry: number) => Math.PI - ry;
export const GATE_X = -22;
export const GATE_W = 9;
export const GATE_H = 9.6;
export const HW = 11.5; // hauteur de la muraille
export const EP = 5; // épaisseur de la muraille
export const TOUR_C = { x: 0, z: -0.5, w: 12, d: 12.5, h: 25 };
export const PLAT_Y = 25;
export const SIRENE = { x: -39, z: 5, h: 22 };
export const PUITS: V3 = [-22, 0, 24];
export const TOUR_INT: V3 = [400, 0, 0];
export const CUISINE: V3 = [-400, 0, 0];

export const VAR_EXT: Variante[] = [
  { L: [-0.92, 0.36, 0.0], soleil: [1.15, 0.62, 0.3], ambiant: [0.4, 0.36, 0.56], hauteur: 0.18 }, // coucher de soleil
  { L: [-0.9, 0.2, 0.0], soleil: [0.95, 0.46, 0.42], ambiant: [0.34, 0.34, 0.58], hauteur: 0.2 }, // crépuscule
  { L: [-0.5, 0.78, 0.3], soleil: [0.5, 0.62, 1.05], ambiant: [0.3, 0.34, 0.58], hauteur: 0.1 }, // nuit de lune
];
export const VAR_INT: Variante[] = [{ L: [0.15, 0.85, 0.35], soleil: [1.0, 0.8, 0.52], ambiant: [0.52, 0.44, 0.44], hauteur: 0 }];

const hs = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ------------------------------------------------------------------ Monde : un bâtisseur solide + deux de pièces lumineuses
class Monde {
  s = new Bati(false);
  l0 = new Bati(true); // lumières toujours allumées
  l1 = new Bati(true); // lumières qui s'allument à la fin (les deux villes s'illuminent)
  dans(p: V3, ry: number, f: () => void) {
    this.s.dans(p, ry, () => this.l0.dans(p, ry, () => this.l1.dans(p, ry, f)));
  }
  miroirZ(zc: number, f: () => void) {
    this.s.miroirZ(zc, () => this.l0.miroirZ(zc, () => this.l1.miroirZ(zc, f)));
  }
  boite(p: V3, s: V3, c: string, r?: V3, lum = 1) {
    this.s.boite(p, s, c, r, lum);
  }
  lum(g: 0 | 1, p: V3, s: V3, c: string, r?: V3) {
    (g ? this.l1 : this.l0).boite(p, s, c, r);
  }
  occulte(p: V3, s: V3, ry = 0) {
    this.s.occulte(p, s, ry);
  }
}

const PIERRE = ["#8A7258", "#7C664E", "#957C5F", "#6F5B47", "#867055"];
const PLAT = ["#B59B78", "#A68D6B", "#BFA582"];
const TOIT = ["#7A3B2C", "#6A3228", "#5E2F27", "#86442F"];

/** Mur en blocs appareillés le long de x (de x0 à x1, centré en zc), avec une porte éventuelle [xa, xb, hauteur]. */
function mur(m: Monde, x0: number, x1: number, zc: number, ep: number, h: number, opt: { porte?: [number, number, number]; bloc?: number; creneaux?: "ext" | "les2" | "aucun"; teinte?: string } = {}) {
  const nc = Math.max(2, Math.round(h / 1.9));
  const ch = h / nc;
  const base = opt.bloc ?? 2.4;
  for (let c = 0; c < nc; c++) {
    let x = x0 - (c % 2) * base * 0.55;
    let i = 0;
    while (x < x1) {
      const len = base + hs(c * 131 + i * 7 + zc + x0) * base * 0.75;
      const a = Math.max(x, x0);
      const b = Math.min(x + len, x1);
      x += len;
      i++;
      if (b - a < 0.25) continue;
      const col = nuance(opt.teinte ?? PIERRE[(c * 3 + i) % 5], 0.86 + hs(c * 17 + i * 5 + x0) * 0.26);
      const lumC = 0.82 + 0.18 * (c / (nc - 1));
      const seg: Array<[number, number]> = [];
      const p = opt.porte;
      if (p && c * ch < p[2] - 0.01 && b > p[0] && a < p[1]) {
        if (a < p[0]) seg.push([a, p[0]]);
        if (b > p[1]) seg.push([p[1], b]);
      } else seg.push([a, b]);
      for (const [u, v] of seg) if (v - u > 0.2) m.boite([(u + v) / 2, c * ch + ch / 2, zc], [v - u, ch, ep], col, undefined, lumC);
    }
  }
  if (opt.porte) {
    const [a, b, hp] = opt.porte;
    // linteau en pierre
    m.boite([(a + b) / 2, (hp + h) / 2, zc], [b - a + 3.0, h - hp, ep], nuance("#7C664E", 1.05));
  }
  const cren = opt.creneaux ?? "ext";
  if (cren !== "aucun") {
    for (let x = x0 + 1.0; x < x1 - 0.6; x += 3.4) {
      if (opt.porte && x > opt.porte[0] - 1.6 && x < opt.porte[1] + 1.6) continue;
      m.boite([x, h + 0.7, zc - ep / 2 + 0.5], [1.9, 1.4, 1.0], nuance(PIERRE[Math.floor(x) & 3], 1.0 + hs(x) * 0.15));
      if (cren === "les2") m.boite([x, h + 0.7, zc + ep / 2 - 0.5], [1.9, 1.4, 1.0], nuance(PIERRE[Math.floor(x + 1) & 3], 1.0 + hs(x) * 0.15));
    }
    m.boite([(x0 + x1) / 2, h + 0.3, zc + ep / 2 - 0.35], [x1 - x0, 0.6, 0.7], nuance("#7C664E", 0.95));
  }
}

// ------------------------------------------------------------------ Maisons
function fenetre(m: Monde, x: number, y: number, z: number, face: 1 | -1, i: number, k: number) {
  const gr: 0 | 1 = hs(i * 13 + k * 3.1) < 0.45 ? 0 : 1;
  m.boite([x, y, z + face * 0.02], [1.5, 1.9, 0.12], "#2E211A");
  m.lum(gr, [x, y, z + face * 0.1], [0.14, 1.55, 0.06], "#FFB04A");
  for (const sx of [-1, 1]) m.boite([x + sx * 0.38, y, z + face * 0.1], [0.56, 1.6, 0.12], nuance("#5B3F29", 0.9 + hs(i + k * 7 + sx) * 0.2));
  m.boite([x, y - 1.05, z + face * 0.14], [1.8, 0.2, 0.34], "#3A2A20");
}
function maison(m: Monde, x: number, z: number, ry: number, i: number, w = 9 + ((i * 7) % 4), d = 8 + ((i * 5) % 3), h = 7.4 + ((i * 3) % 3) * 0.8) {
  m.dans([x, 0, z], ry, () => {
    const pi = PIERRE[i % 5];
    const pl = PLAT[i % 3];
    const to = TOIT[(i * 3) % 4];
    m.boite([0, 1.6, 0], [w, 3.2, d], pi, undefined, 0.95);
    m.boite([0, 3.2 + (h - 3.2) / 2, 0], [w - 0.3, h - 3.2, d - 0.3], pl);
    for (const sz of [-1, 1]) {
      for (const px of [-w / 2 + 0.5, 0, w / 2 - 0.5]) m.boite([px, 3.2 + (h - 3.2) / 2, sz * (d / 2 - 0.1)], [0.32, h - 3.2, 0.22], "#3A281D");
      m.boite([0, 3.3, sz * (d / 2 - 0.1)], [w - 0.3, 0.3, 0.24], "#3A281D");
      m.boite([0, h - 0.2, sz * (d / 2 - 0.1)], [w - 0.3, 0.32, 0.24], "#3A281D");
      fenetre(m, -w / 4, 5.4, sz * (d / 2 - 0.02), sz as 1 | -1, i, sz + 1);
      fenetre(m, w / 4, 5.4, sz * (d / 2 - 0.02), sz as 1 | -1, i, sz + 4);
      fenetre(m, -w / 4 - 0.4, 2.0, sz * (d / 2 - 0.02), sz as 1 | -1, i, sz + 7);
      // porte (face +z) : planches sombres
      if (sz === 1) {
        m.boite([w / 4 + 0.4, 1.6, d / 2 + 0.04], [1.7, 3.1, 0.2], "#3A281D");
        m.boite([w / 4 + 0.4, 1.6, d / 2 + 0.16], [1.35, 2.8, 0.1], nuance("#6B4A2F", 0.8 + hs(i) * 0.2));
        m.boite([w / 4 + 0.4, 1.9, d / 2 + 0.24], [1.5, 0.16, 0.08], "#222228", [0, 0, 0.5]);
      } else fenetre(m, w / 4 + 0.4, 2.0, sz * (d / 2 - 0.02), -1, i, 11);
    }
    m.pignon([0, h, 0], w + 1.5, 3.2 + (w - 8) * 0.25, d + 1.4, to);
    m.boite([w * 0.25, h + 2.6, -d * 0.2], [1.3, 3.0, 1.3], PIERRE[(i + 2) % 5]);
    m.occulte([0, 0, 0], [w + 1, h + 3.3, d + 1], 0);
  });
}

// ------------------------------------------------------------------ Tours
function creneauxCarres(m: Monde, cx: number, cz: number, w: number, d: number, y: number, pas = 3.2) {
  for (let x = -w / 2 + 1; x < w / 2; x += pas) for (const sz of [-1, 1]) m.boite([cx + x, y + 0.9, cz + sz * (d / 2 - 0.4)], [1.7, 1.6, 0.9], nuance(PIERRE[Math.floor(x + 20) & 3], 1.05));
  for (let z = -d / 2 + 1; z < d / 2; z += pas) for (const sx of [-1, 1]) m.boite([cx + sx * (w / 2 - 0.4), y + 0.9, cz + z], [0.9, 1.6, 1.7], nuance(PIERRE[Math.floor(z + 20) & 3], 1.05));
}
function fut(m: Monde, cx: number, cz: number, w: number, d: number, h: number, y0: number, ep = 2.3) {
  const nc = Math.round((h - y0) / 2.4);
  const ch = (h - y0) / nc;
  for (let c = 0; c < nc; c++) {
    const y = y0 + c * ch + ch / 2;
    for (let k = 0; k < 3; k++) {
      m.boite([cx + (k - 1) * (w / 3), y, cz], [w / 3, ch, d], nuance(PIERRE[(c + k * 2) % 5], 0.88 + hs(c * 9 + k * 3 + cx) * 0.24), undefined, 0.84 + 0.16 * (c / nc));
    }
  }
  void ep;
}

/** La vieille tour (côté vallée) : fût, porte d'entrée, plateforme crénelée, lucarne. */
function vieilleTour(m: Monde) {
  const { x, z, w, d, h } = TOUR_C;
  // fût (de la falaise à la plateforme)
  const nc = 14;
  const ch = (h + 14) / nc;
  const y0 = -14;
  for (let c = 0; c < nc; c++) {
    const y = y0 + c * ch + ch / 2;
    for (let k = 0; k < 3; k++) {
      const piece = (xa: number, xb: number, za: number, zb: number) => m.boite([x + (xa + xb) / 2, y, z + (za + zb) / 2], [xb - xa, ch, zb - za], nuance(PIERRE[(c + k * 2) % 5], 0.86 + hs(c * 9 + k * 3) * 0.26), undefined, 0.8 + 0.2 * (c / nc));
      const xa = -w / 2 + (k * w) / 3;
      const xb = -w / 2 + ((k + 1) * w) / 3;
      // face avant (côté ville, z + d/2) : la porte d'entrée perce la première assise
      if (c * ch + y0 < 4.7 && y0 + (c + 1) * ch > 0 && xa < 1.7 && xb > -1.7) {
        piece(xa, xb, -d / 2, d / 2 - 1.6);
      } else piece(xa, xb, -d / 2, d / 2);
    }
  }
  // façade côté ville autour de la porte (z = z + d/2 - 1.6 .. z + d/2)
  const zf = d / 2 - 0.8;
  for (let c = 0; c < 3; c++) {
    const y = c * 2.4 + 1.2;
    const ha = c === 2 ? 2.2 : 2.4;
    m.boite([x - 3.9, y, z + zf], [4.4, ha, 1.6], nuance(PIERRE[(c + 1) % 5], 0.95));
    m.boite([x + 3.9, y, z + zf], [4.4, ha, 1.6], nuance(PIERRE[(c + 3) % 5], 0.95));
  }
  m.boite([x, 5.0, z + zf], [3.4, 0.7, 1.6], "#7A6650");
  m.boite([x, 1.5, z + d / 2 - 1.6 - 0.02], [3.2, 4.4, 0.12], "#050308"); // fond noir du porche
  // fentes de tir (lumière du soir)
  for (const [yy, xx] of [[9, -3], [14, 2.6], [19, -2.2]] as Array<[number, number]>) {
    m.boite([x + xx, yy, z + d / 2 + 0.02], [0.5, 1.8, 0.1], "#1A120E");
    m.lum(0, [x + xx, yy, z + d / 2 + 0.07], [0.22, 1.4, 0.05], "#FF9A3E");
  }
  // corbeaux sous la plateforme
  for (let k = -5; k <= 5; k++) {
    m.boite([x + k * 1.1, PLAT_Y - 1.0, z - d / 2 - 0.55], [0.7, 1.4, 1.3], PIERRE[(k + 5) % 5]);
    m.boite([x + k * 1.1, PLAT_Y - 1.0, z + d / 2 + 0.55], [0.7, 1.4, 1.3], PIERRE[(k + 6) % 5]);
  }
  // plateforme
  const pw = w + 1.8;
  const pd = d + 2.4;
  m.boite([x, PLAT_Y - 0.4, z], [pw, 0.8, pd], "#5D4C3C");
  m.boite([x, PLAT_Y + 0.02, z], [pw - 0.6, 0.1, pd - 0.6], "#7A6650");
  for (let k = -5; k <= 5; k++) m.boite([x + k * 1.1, PLAT_Y + 0.08, z], [0.04, 0.02, pd - 0.6], "#4B3C2E");
  // parapet bas + créneaux (une brèche au centre de la face vallée pour les jumelles)
  const bas = (cx: number, cz: number, sx: number, sz: number) => m.boite([x + cx, PLAT_Y + 0.65, z + cz], [sx, 1.3, sz], nuance("#7C664E", 1.0));
  bas(0, -pd / 2 + 0.45, pw, 0.9);
  bas(0, pd / 2 - 0.45, pw, 0.9);
  bas(-pw / 2 + 0.45, 0, 0.9, pd);
  bas(pw / 2 - 0.45, 0, 0.9, pd);
  for (const px of [-5.6, -4.0, -2.4, 2.4, 4.0, 5.6]) m.boite([x + px, PLAT_Y + 1.75, z - pd / 2 + 0.45], [1.1, 1.0, 0.9], nuance(PIERRE[Math.abs(px * 10) % 5 | 0], 1.08));
  for (const px of [-5.2, -2.5, 0, 2.5, 5.2]) m.boite([x + px, PLAT_Y + 1.75, z + pd / 2 - 0.45], [1.2, 1.0, 0.9], nuance(PIERRE[Math.abs(px * 10) % 5 | 0], 1.08));
  for (const pz of [-3.4, 0, 3.4]) for (const sx of [-1, 1]) m.boite([x + sx * (pw / 2 - 0.45), PLAT_Y + 1.75, z + pz], [0.9, 1.0, 1.2], nuance(PIERRE[Math.abs(pz * 10) % 5 | 0], 1.08));
  // lucarne (trappe d'accès) et haut de l'échelle
  m.boite([x - 3.2, PLAT_Y + 0.14, z + 2.4], [1.9, 0.2, 1.9], "#3A281D");
  m.boite([x - 3.2, PLAT_Y + 0.26, z + 2.4], [1.4, 0.06, 1.4], "#06040A");
  m.lum(0, [x - 3.2, PLAT_Y + 0.31, z + 2.4], [1.3, 0.02, 1.3], "#FFA55A");
  for (const sx of [-1, 1]) m.boite([x - 3.2 + sx * 0.5, PLAT_Y + 0.9, z + 2.4 + 0.1], [0.12, 1.5, 0.12], "#6B4A2F");
  m.occulte([x, 0, z], [w + 1, h + 1, d + 1], 0);
}

/** La tour de la sirène (haut-parleurs, projecteurs) : fût de pierre, cabine, quatre cornes. */
function tourSirene(m: Monde) {
  const { x, z, h } = SIRENE;
  fut(m, x, z, 8, 8, h, 0);
  m.boite([x, h + 0.35, z], [10, 0.7, 10], "#4F4540");
  for (const [dx, dz] of [[-4.5, -4.5], [4.5, -4.5], [4.5, 4.5], [-4.5, 4.5]] as Array<[number, number]>) m.boite([x + dx, h + 2.6, z + dz], [0.5, 4.2, 0.5], "#3A3036");
  m.boite([x, h + 4.9, z], [10.6, 0.5, 10.6], "#3A3036");
  m.boite([x, h + 2.6, z], [1.7, 4.0, 1.7], "#7A2A2A"); // mât
  // quatre cornes évasées
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as Array<[number, number]>) {
    const hor = dx !== 0;
    for (let k = 0; k < 4; k++) {
      const ext = 1.6 + k * 0.9;
      const s = 0.9 + k * 0.7;
      m.boite([x + dx * ext, h + 3.1, z + dz * ext], hor ? [0.9, s, s] : [s, s, 0.9], k === 3 ? "#9A9FA8" : "#4D525C");
    }
  }
  m.occulte([x, 0, z], [9, h + 5, 9], 0);
}

// ------------------------------------------------------------------ Place, puits, étals
function puits(m: Monde, p: V3) {
  m.dans(p, 0, () => {
    m.boite([0, 0.75, 0], [4.2, 1.5, 4.2], "#6F5B47");
    m.boite([0, 1.55, 0], [3.4, 0.2, 3.4], "#8A7258");
    m.boite([0, 1.5, 0], [2.6, 0.12, 2.6], "#08060B");
    for (const sx of [-1, 1]) m.boite([sx * 1.7, 3.0, 0], [0.3, 3.0, 0.3], "#4B3322");
    m.boite([0, 4.6, 0], [4.4, 0.4, 0.5], "#4B3322");
    m.pignon([0, 4.8, 0], 5.0, 1.4, 3.2, "#6A3228");
    m.occulte([0, 0, 0], [4.4, 4.6, 4.4], 0);
  });
}
function etal(m: Monde, p: V3, ry: number, i: number) {
  m.dans(p, ry, () => {
    m.boite([0, 0.9, 0], [3.8, 0.2, 1.8], "#6B4A2F");
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.boite([sx * 1.8, 1.4, sz * 0.8], [0.18, 2.8, 0.18], "#3A281D");
    m.boite([0, 2.95, 0], [4.4, 0.18, 2.4], i % 2 ? "#9E3A2E" : "#C9A24A", [0.18, 0, 0]);
    m.boite([0, 0.45, 0], [3.4, 0.9, 1.4], "#4B3322");
    m.occulte([0, 0, 0], [4, 3, 2.4], 0);
  });
}
function tonneau(m: Monde, x: number, z: number, s = 1) {
  m.s.cylindre([x, 0, z], 0.75 * s, 1.5 * s, "#6B4A2F", 9, 0.68 * s);
  m.s.cylindre([x, 0.5 * s, z], 0.8 * s, 0.14 * s, "#2E2E34", 9);
  m.s.cylindre([x, 1.0 * s, z], 0.8 * s, 0.14 * s, "#2E2E34", 9);
}
function lampadaire(m: Monde, x: number, z: number, g: 0 | 1) {
  m.boite([x, 2.8, z], [0.3, 5.6, 0.3], "#2A2026");
  m.boite([x, 5.7, z], [0.8, 0.6, 0.8], "#2A2026");
  m.lum(g, [x, 5.7, z], [0.5, 0.45, 0.5], "#FFC25E");
}
export const LAMPES: Array<{ p: V3; g: 0 | 1 }> = [
  { p: [-28, 5.7, 10], g: 0 }, { p: [-16, 5.7, 10], g: 1 }, { p: [-36, 5.7, 24], g: 1 }, { p: [-8, 5.7, 24], g: 0 }, { p: [-28, 5.7, 38], g: 1 }, { p: [-16, 5.7, 38], g: 0 },
  { p: [-24, 5.7, 54], g: 1 }, { p: [-20, 5.7, 72], g: 1 }, { p: [-24, 5.7, 90], g: 1 }, { p: [12, 5.7, 20], g: 1 }, { p: [24, 5.7, 40], g: 1 }, { p: [34, 5.7, 70], g: 1 },
];

// ------------------------------------------------------------------ La ville (repère local : muraille en z = 0, ville vers +z)
function ville(m: Monde) {
  // sol : terre sombre, pavés de la place, rue de l'avenue
  m.boite([0, -0.6, 62], [200, 1.2, 140], "#4B3B30");
  m.boite([0, 0.02, 60], [144, 0.1, 132], "#5A4A3C");
  // place pavée
  for (let ix = 0; ix < 16; ix++) for (let iz = 0; iz < 11; iz++) {
    const x = -50 + ix * 3.4 + 1.7;
    const z = 4 + iz * 3.4 + 1.7;
    m.boite([x, 0.06, z], [3.3, 0.14, 3.3], nuance("#85705A", 0.82 + hs(ix * 11 + iz * 5) * 0.34), undefined, 1);
  }
  // avenue
  for (let iz = 0; iz < 28; iz++) m.boite([-22, 0.05, 42 + iz * 3.4 + 1.7], [10.4, 0.12, 3.3], nuance("#7A6652", 0.82 + hs(iz * 5) * 0.3));
  // muraille avec la grande porte, tours d'angle, murs latéraux et du fond
  mur(m, -76, 76, 0, EP, HW, { porte: [GATE_X - GATE_W / 2, GATE_X + GATE_W / 2, GATE_H], creneaux: "les2" });
  m.occulte([0, 0, 0], [152, HW + 1.4, EP], 0);
  for (const sx of [-1, 1]) {
    fut(m, sx * 74, 1, 9, 9, 17, 0);
    m.boite([sx * 74, 17.4, 1], [10.4, 0.8, 10.4], "#4F4540");
    creneauxCarres(m, sx * 74, 1, 10.4, 10.4, 17.8);
    m.occulte([sx * 74, 0, 1], [9.5, 18, 9.5], 0);
    m.dans([sx * 74, 0, 0], -Math.PI / 2, () => mur(m, 4, 128, 0, EP, HW - 1.5, { bloc: 5, creneaux: "ext" }));
  }
  mur(m, -76, 76, 130, EP, HW - 1.5, { bloc: 5, creneaux: "ext" });
  tourSirene(m);
  vieilleTour(m);
  puits(m, PUITS);
  etal(m, [-40, 0, 16], 0.6, 0);
  etal(m, [-6, 0, 18], -0.5, 1);
  etal(m, [-38, 0, 34], 1.2, 2);
  etal(m, [-4, 0, 34], -1.2, 3);
  for (const [x, z, s] of [[-30, 8, 1], [-29, 9.5, 0.9], [-14, 8, 1], [-12.5, 9, 0.8], [-44, 28, 1], [-1.5, 22, 1]] as Array<[number, number, number]>) tonneau(m, x, z, s);
  // avant-poste de la porte : banc, caisses
  m.boite([-31, 0.6, 3.6], [2.2, 1.2, 1.6], "#6B4A2F");
  m.boite([-12.6, 0.6, 3.6], [2.0, 1.2, 1.8], "#6B4A2F", [0, 0.3, 0]);
  // maisons autour de la place
  let i = 0;
  for (const z of [14, 28, 41]) maison(m, -59, z, Math.PI / 2, i++);
  for (const z of [12, 26, 40]) maison(m, 10.5, z, -Math.PI / 2, i++);
  for (const x of [-46, -37, -8, 1]) maison(m, x, 47, Math.PI, i++);
  // avenue
  for (let z = 55; z < 125; z += 13) {
    maison(m, -33.5, z, Math.PI / 2, i++);
    maison(m, -10.5, z + 4, -Math.PI / 2, i++);
  }
  // quartiers est et ouest
  for (const x of [24, 40, 56, 70]) for (let z = 16; z < 125; z += 14) maison(m, x + (z % 3), z + (x % 5) * 0.4, (i % 2 ? 0 : Math.PI) + (x > 50 ? 0.0 : 0), i++, 10, 9, 7.6 + ((i * 3) % 3) * 0.8);
  for (const x of [-48, -62]) for (let z = 60; z < 125; z += 14) maison(m, x, z, i % 2 ? 0 : Math.PI, i++, 10, 9);
  // lampadaires
  for (const l of LAMPES) lampadaire(m, l.p[0], l.p[2], l.g);
  // lanternes de la muraille (s'allument à la fin)
  for (let x = -70; x <= 70; x += 7) {
    if (Math.abs(x - GATE_X) < 7) continue;
    m.lum(1, [x, HW + 0.9, 1.7], [0.45, 0.7, 0.45], "#FFB84D");
    m.boite([x, HW + 0.45, 1.7], [0.5, 0.3, 0.5], "#2A2026");
  }
  // lumières de la porte
  for (const sx of [-1, 1]) {
    m.boite([GATE_X + sx * 6, 3.0, 2.3], [0.3, 6.0, 0.3], "#2A2026");
    m.lum(1, [GATE_X + sx * 6, 6.1, 2.3], [0.6, 0.6, 0.6], "#FFB84D");
  }
}

// ------------------------------------------------------------------ Vallée, falaises, collines
function pin(m: Bati, x: number, y: number, z: number, s: number, i: number) {
  m.boite([x, y + 0.9 * s, z], [0.5 * s, 1.8 * s, 0.5 * s], "#2C2226");
  for (let k = 0; k < 3; k++) m.cone([x, y + (1.4 + k * 1.6) * s, z], (2.2 - k * 0.55) * s, 3.2 * s, nuance(["#2F3B3A", "#34413F", "#2A3636"][i % 3], 0.92 + k * 0.08), 6, i);
}
function vallee(b: Bati) {
  // sol de la vallée (violet sombre), falaises en gradins des deux côtés
  b.boite([0, -26.6, -33], [400, 1.2, 60], "#3B3249");
  b.boite([0, -26.2, -33], [400, 0.3, 40], "#443A52");
  for (const s of [0, 1]) {
    const f = (z: number) => (s ? ZB - z : z);
    const box = (zc: number, ez: number, y0: number, y1: number, c: string) => b.boite([0, (y0 + y1) / 2, f(zc)], [400, y1 - y0, ez], c);
    box(-4.5, 3, -26, 0, "#5A4A44");
    box(-7.5, 3, -26, -8, "#4F4048");
    box(-11, 4, -26, -16, "#463A4C");
    // blocs de roche qui dépassent
    for (let i = 0; i < 18; i++) {
      const x = -90 + i * 10.5 + hs(i * 3 + s) * 4;
      const sz = 2.5 + hs(i * 5 + s) * 3;
      b.boite([x, -26 + sz * 0.6, f(-13.5 - hs(i * 7) * 5)], [sz * 1.4, sz * 1.2, sz * 1.1], nuance(["#463A4C", "#524552", "#3F3446"][i % 3], 0.9 + hs(i) * 0.2), [0, hs(i) * 2, 0]);
    }
    for (let i = 0; i < 24; i++) pin(b, -100 + i * 8.5 + hs(i * 11 + s) * 3, -26 + hs(i) * 0.4, f(-15 - hs(i * 13 + s) * 9), 1.5 + hs(i * 2) * 1.1, i + s);
    // collines et montagnes derrière les villes
    for (let i = 0; i < 9; i++) b.cone([-150 + i * 40 + hs(i * 3 + s) * 12, -2, f(150 + hs(i * 5) * 40)], 60 + hs(i * 7) * 30, 50 + hs(i * 9 + s) * 50, ["#3B2F4A", "#46364F", "#33294A"][i % 3], 6, i);
  }
  // rocher et lit de rivière au fond
  b.boite([0, -26, -33], [400, 0.2, 5], "#2D3A5E");
  for (let i = 0; i < 10; i++) b.boite([-60 + i * 13, -25.2, -30 - hs(i) * 8], [3, 1.6, 2.6], "#4F4352", [0, i, 0]);
  // montagnes lointaines sur les côtés
  for (let i = 0; i < 8; i++) for (const sx of [-1, 1]) b.cone([sx * (220 + i * 30), -8, -33 + (i - 4) * 60], 90, 100 + hs(i * 3) * 50, "#3B2F4A", 6, i);
}

export type ZonesExt = {
  solide: THREE.BufferGeometry;
  couleurs: Float32Array[];
  lum0: THREE.BufferGeometry;
  lum1: THREE.BufferGeometry;
  ombres: THREE.BufferGeometry[];
};
export function construireExt(): ZonesExt {
  const m = new Monde();
  ville(m);
  m.miroirZ(ZB, () => ville(m));
  vallee(m.s);
  const { g, variantes } = m.s.construire(VAR_EXT);
  const l0 = m.l0.construire([VAR_EXT[0]]);
  const l1 = m.l1.construire([VAR_EXT[0]]);
  return { solide: g, couleurs: variantes, lum0: l0.g, lum1: l1.g, ombres: [m.s.ombres(VAR_EXT[0].L), m.s.ombres(VAR_EXT[1].L)] };
}

// ------------------------------------------------------------------ TOUR (intérieur) : colimaçon, échelle, lucarne
export const TI = { R: 4.9, Ri: 4.3, marches: 40, da: (2 * Math.PI) / 18, rise: 0.62, rMarche: 3.1, haut: 26.0, y0: 0.4 };
/** Angle de la marche `i` : la dernière marche est à l'angle 0 (face à l'échelle, côté +x). */
export const angleMarche = (i: number) => (i - TI.marches) * TI.da;
export const posMarche = (i: number, r = TI.rMarche): V3 => [TOUR_INT[0] + r * Math.cos(angleMarche(i)), TI.y0 + TI.rise * (i + 1), TOUR_INT[2] + r * Math.sin(angleMarche(i))];
export const SOMMET_ECHELLE = TI.y0 + TI.rise * TI.marches; // palier haut (≈ 25,2)
export const ECHELLE_X = TOUR_INT[0] + 4.05;

export function construireTour(): { solide: THREE.BufferGeometry; couleurs: Float32Array[]; lum: THREE.BufferGeometry } {
  const b = new Bati(false);
  const l = new Bati(true);
  const [X0] = TOUR_INT;
  // sol de pierre
  b.boite([X0, -0.3, 0], [14, 0.6, 14], "#5F5040");
  // mur circulaire : 16 blocs par assise
  const nAs = 14;
  const ha = TI.haut / nAs;
  for (let c = 0; c < nAs; c++) {
    for (let k = 0; k < 18; k++) {
      const a = (k + (c % 2) * 0.5) * ((2 * Math.PI) / 18);
      const R = TI.R + 0.6;
      b.boite([X0 + Math.cos(a) * (R - 0.1), c * ha + ha / 2, Math.sin(a) * (R - 0.1)], [1.5, ha, 2.15], nuance(PIERRE[(c + k) % 5], 0.8 + hs(c * 19 + k) * 0.3), [0, -a, 0], 0.8 + 0.2 * (c / nAs));
    }
  }
  // plafond avec la trappe (côté +x) et sa lumière
  b.boite([X0, TI.haut + 0.3, 0], [12, 0.6, 12], "#4A3A2E");
  // escalier : marches de bois sur pierre, accrochées au mur
  for (let i = 0; i < TI.marches; i++) {
    const a = angleMarche(i);
    const y = TI.y0 + TI.rise * (i + 1);
    const r = TI.rMarche + 0.15;
    b.boite([X0 + Math.cos(a) * r, y - 0.2, Math.sin(a) * r], [2.7, 0.4, 1.28], nuance(i % 2 ? "#7B5C3E" : "#6B4F36", 0.92 + hs(i) * 0.2), [0, -a, 0]);
    b.boite([X0 + Math.cos(a) * (r + 1.2), y - 0.85, Math.sin(a) * (r + 1.2)], [0.5, 1.0, 1.1], "#4A3A2E", [0, -a, 0]); // corbeau dans le mur
  }
  // palier haut et échelle
  const yPal = SOMMET_ECHELLE;
  b.boite([X0 + 3.4, yPal - 0.2, 0], [3.0, 0.4, 3.6], "#7B5C3E");
  for (const sz of [-0.55, 0.55]) b.boite([ECHELLE_X, yPal + 1.7, sz], [0.14, 3.6, 0.14], "#5B3F29", [0, 0, 0.2]);
  for (let k = 0; k < 8; k++) b.boite([ECHELLE_X + 0.15 * (k / 8), yPal + 0.3 + k * 0.45, 0], [0.14, 0.12, 1.2], "#6B4A2F", [0, 0, 0.2]);
  // trappe ouverte dans le plafond
  b.boite([X0 + 4.1, TI.haut + 0.3, 0], [2.4, 0.7, 2.4], "#08060B");
  l.boite([X0 + 4.1, TI.haut + 0.7, 0], [2.0, 0.05, 2.0], "#FFB066");
  // fentes de lumière dans le mur
  for (let i = 0; i < 6; i++) {
    const a = 0.6 + i * 1.07 + 1.2;
    const y = 3 + i * 4;
    b.boite([X0 + Math.cos(a) * (TI.R + 0.3), y, Math.sin(a) * (TI.R + 0.3)], [0.6, 2.4, 0.8], "#150F0C", [0, -a, 0]);
    l.boite([X0 + Math.cos(a) * (TI.Ri + 0.15), y, Math.sin(a) * (TI.Ri + 0.15)], [0.12, 2.0, 0.34], "#FF9A4A", [0, -a, 0]);
  }
  // porte d'entrée en bas
  b.boite([X0 + 4.55, 1.9, 0], [0.5, 3.8, 3.1], "#0A070A");
  // torches
  for (let i = 0; i < 5; i++) {
    const a = 0.2 + i * 1.3;
    const y = 4 + i * 4.8;
    b.boite([X0 + Math.cos(a) * (TI.Ri - 0.1), y, Math.sin(a) * (TI.Ri - 0.1)], [0.14, 0.9, 0.14], "#2A2026", [0, 0, 0]);
    l.boite([X0 + Math.cos(a) * (TI.Ri - 0.2), y + 0.65, Math.sin(a) * (TI.Ri - 0.2)], [0.32, 0.4, 0.32], "#FFB04A");
  }
  const g1 = b.construire(VAR_INT);
  const g2 = l.construire([VAR_INT[0]]);
  return { solide: g1.g, couleurs: g1.variantes, lum: g2.g };
}
export const TORCHES_TOUR: V3[] = Array.from({ length: 5 }, (_, i) => {
  const a = 0.2 + i * 1.3;
  return [TOUR_INT[0] + Math.cos(a) * (TI.Ri - 0.2), 4 + i * 4.8 + 0.65, Math.sin(a) * (TI.Ri - 0.2)] as V3;
});

// ------------------------------------------------------------------ CUISINE (la salle de la maison)
export const CU = { w: 5, d: 5, h: 4.6 };
export function construireCuisine(): { solide: THREE.BufferGeometry; couleurs: Float32Array[]; lum: THREE.BufferGeometry } {
  const b = new Bati(false);
  const l = new Bati(true);
  const [X0] = CUISINE;
  const { w, d, h } = CU;
  b.dans([X0, 0, 0], 0, () => {
    // sol de dalles
    for (let ix = 0; ix < 6; ix++) for (let iz = 0; iz < 6; iz++) b.boite([-4.2 + ix * 1.68, -0.1, -4.2 + iz * 1.68], [1.66, 0.2, 1.66], nuance("#7A6A58", 0.84 + hs(ix * 7 + iz * 3) * 0.3));
    // murs : pierre en bas, plâtre en haut
    const wall = (cx: number, cz: number, sx: number, sz: number) => {
      b.boite([cx, 1.5, cz], [sx, 3.0, sz], "#7C6A58");
      b.boite([cx, 3.0 + (h - 3.0) / 2, cz], [sx, h - 3.0, sz], "#B09878");
    };
    wall(0, -d - 0.25, 2 * w + 1, 0.5); // fond
    wall(-w - 0.25, 0, 0.5, 2 * d + 1); // gauche (cheminée)
    wall(w + 0.25, 0, 0.5, 2 * d + 1); // droite (fenêtre)
    // mur d'entrée : porte x ∈ [1, 3]
    wall(-w / 2 - 0.5, d + 0.25, w * 1 + 1.5 + 0.6, 0.5);
    b.boite([w * 0.5 + 1.0 + 0.25, 1.5, d + 0.25], [3.0, 3.0, 0.5], "#7C6A58");
    b.boite([w * 0.5 + 1.0 + 0.25, 3.0 + (h - 3.0) / 2, d + 0.25], [3.0, h - 3.0, 0.5], "#B09878");
    b.boite([2.0, 3.5 + (h - 3.5) / 2, d + 0.25], [2.0, h - 3.5, 0.5], "#B09878");
    // plafond à poutres
    b.boite([0, h + 0.15, 0], [2 * w + 1, 0.3, 2 * d + 1], "#3F2F24");
    for (let k = -3; k <= 3; k++) b.boite([k * 1.5, h - 0.2, 0], [0.4, 0.4, 2 * d], "#2E2018");
    // fenêtre à droite (z ∈ [-1, 1.4]) : vitre lumineuse (dehors : le couchant) + volets ouverts
    l.boite([w - 0.0, 2.6, 0.2], [0.1, 1.9, 2.5], "#FF9A55");
    for (const dz of [-1.3, 1.7]) b.boite([w - 0.2, 2.6, 0.2 + dz], [0.3, 2.0, 0.5], "#4B3322");
    b.boite([w - 0.15, 1.6, 0.2], [0.4, 0.2, 2.9], "#6B4A2F");
    b.boite([w - 0.2, 3.65, 0.2], [0.3, 0.2, 2.9], "#4B3322");
    b.boite([w - 0.2, 2.6, 0.2], [0.2, 2.0, 0.1], "#4B3322");
    // porte ouverte : le soir orange dehors
    l.boite([2.0, 1.7, d + 0.6], [2.0, 3.4, 0.1], "#E07A3C");
    b.boite([0.85, 1.7, d + 0.3], [0.3, 3.5, 0.5], "#4B3322");
    b.boite([3.15, 1.7, d + 0.3], [0.3, 3.5, 0.5], "#4B3322");
    // cheminée à gauche : foyer de pierre, feu
    b.boite([-w + 0.7, 1.6, 0.4], [1.4, 3.2, 3.6], "#6B5846");
    b.boite([-w + 1.0, 4.0, 0.4], [1.0, 2.0, 2.0], "#5D4C3C");
    b.boite([-w + 1.35, 0.95, 0.4], [0.2, 1.7, 2.1], "#0E0809");
    l.boite([-w + 1.2, 0.35, 0.4], [0.4, 0.5, 1.5], "#FF8A2E");
    l.boite([-w + 1.2, 0.8, 0.5], [0.3, 0.6, 0.8], "#FFC25E");
    // table et chaises
    b.boite([0, 1.55, -0.6], [3.4, 0.2, 1.9], "#6B4A2F");
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.boite([sx * 1.5, 0.75, -0.6 + sz * 0.8], [0.2, 1.5, 0.2], "#4B3322");
    // chaise du père (fond) et chaise face
    b.boite([0, 0.9, -2.35], [1.2, 0.18, 1.1], "#5B3F29");
    b.boite([0, 1.7, -2.95], [1.2, 1.7, 0.16], "#5B3F29");
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.boite([sx * 0.5, 0.45, -2.35 + sz * 0.45], [0.14, 0.9, 0.14], "#4B3322");
    b.boite([0.2, 0.9, 1.55], [1.2, 0.18, 1.1], "#5B3F29");
    // sur la table : bol, pain, bougie
    b.boite([-0.7, 1.75, -0.5], [0.8, 0.22, 0.8], "#9A7A52");
    b.boite([0.6, 1.72, -0.9], [0.9, 0.16, 0.5], "#C79A5A");
    b.boite([1.2, 1.9, -0.3], [0.16, 0.5, 0.16], "#E8DCC0");
    l.boite([1.2, 2.22, -0.3], [0.12, 0.2, 0.12], "#FFCF6E");
    // étagère au fond (à droite) avec pots
    b.boite([3.2, 2.3, -d + 0.2], [2.0, 0.14, 0.5], "#5B3F29");
    b.boite([3.2, 3.1, -d + 0.2], [2.0, 0.14, 0.5], "#5B3F29");
    for (let k = 0; k < 4; k++) {
      b.boite([2.5 + k * 0.45, 2.55, -d + 0.25], [0.3, 0.36, 0.3], ["#8A5A36", "#A9783E", "#6C4A33", "#9B6A44"][k]);
      b.boite([2.5 + k * 0.45, 3.4, -d + 0.25], [0.28, 0.4, 0.28], ["#B98A58", "#7A5A3C", "#8A5A36", "#A9783E"][k]);
    }
    // tapis, coffre
    b.boite([0, 0.04, 0.9], [4.0, 0.06, 3.0], "#7A3B2C");
    b.boite([-3.6, 0.55, 3.4], [2.0, 1.1, 1.2], "#4B3322");
    // cadre : emplacements de calendrier, horloge, photo (dessinés en canvas dans le décor dynamique)
    b.boite([-2.8, 2.65, -d + 0.07], [1.55, 1.95, 0.1], "#3A281D");
    b.boite([-0.55, 3.3, -d + 0.07], [1.3, 1.3, 0.12], "#3A281D");
    b.boite([1.15, 2.85, -d + 0.07], [1.95, 1.55, 0.12], "#3A281D");
  });
  const g1 = b.construire(VAR_INT);
  const g2 = l.construire([VAR_INT[0]]);
  return { solide: g1.g, couleurs: g1.variantes, lum: g2.g };
}
