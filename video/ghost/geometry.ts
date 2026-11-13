/**
 * Géométrie procédurale du fantôme « Ecto ».
 * Tout est calculé par code : le personnage est strictement identique d'une vidéo à l'autre.
 * Unités : 1 unité ≈ hauteur de la tête / 2.
 */
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const BODY = {
  R: 0.86, // rayon du dôme (tête)
  yc: 0.3, // hauteur du centre du dôme
  yHem: -0.8, // hauteur du bord inférieur (avant ondulations)
  flare: 0.09, // évasement en cloche vers le bas
  lobes: 5, // nombre de "vagues" du bas
  lobeDepth: 0.2,
} as const;

/** Rayon du corps (surface de révolution) à la hauteur y. */
export function bodyRadius(y: number): number {
  const { R, yc, yHem, flare } = BODY;
  if (y >= yc) {
    const d = y - yc;
    return Math.sqrt(Math.max(0, R * R - d * d));
  }
  const t = Math.min(1, Math.max(0, (yc - y) / (yc - yHem)));
  return R + flare * Math.pow(t, 1.7);
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Corps : profil (dessous creux + flanc + dôme) mis en révolution, sommets fusionnés pour des normales lisses. */
export function createBodyGeometry() {
  const { R, yc, yHem } = BODY;
  const pts: THREE.Vector2[] = [];
  const Rh = bodyRadius(yHem);
  // Dessous légèrement creux (de l'axe vers le bord)
  const under = 10;
  for (let k = 0; k <= under; k++) {
    const s = k / under;
    pts.push(new THREE.Vector2(Math.max(0.0005, s * (Rh - 0.06)), yHem + 0.12 * (1 - s * s)));
  }
  // Petit ourlet arrondi
  pts.push(new THREE.Vector2(Rh - 0.025, yHem - 0.012));
  pts.push(new THREE.Vector2(Rh, yHem + 0.012));
  // Flanc
  const side = 34;
  for (let k = 1; k <= side; k++) {
    const y = yHem + 0.012 + (yc - yHem - 0.012) * (k / side);
    pts.push(new THREE.Vector2(bodyRadius(y), y));
  }
  // Dôme
  const dome = 30;
  for (let k = 1; k <= dome; k++) {
    const a = (k / dome) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0.0005, R * Math.cos(a)), yc + R * Math.sin(a)));
  }
  let geo: THREE.BufferGeometry = new THREE.LatheGeometry(pts, 112);
  geo.deleteAttribute("uv");
  geo.deleteAttribute("normal");
  geo = mergeVertices(geo, 1e-5);
  geo.computeVertexNormals();
  const base = (geo.getAttribute("position") as THREE.BufferAttribute).array.slice() as Float32Array;
  geo.userData.base = base;
  return geo;
}

/** Ondulation animée du bas du corps (fonction pure du temps -> rendu déterministe). */
export function updateHem(geo: THREE.BufferGeometry, time: number, intensity = 1) {
  const { yHem, lobes, lobeDepth } = BODY;
  const base = geo.userData.base as Float32Array;
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;
  const yStart = yHem + 0.42;
  const Rh = bodyRadius(yHem);
  const phase = time * 1.4;
  for (let i = 0; i < arr.length; i += 3) {
    const x = base[i];
    const y = base[i + 1];
    const z = base[i + 2];
    arr[i] = x;
    arr[i + 2] = z;
    if (y > yStart) {
      arr[i + 1] = y;
      continue;
    }
    const r = Math.hypot(x, z);
    const theta = Math.atan2(z, x);
    const w = smoothstep(yStart, yHem, y) * smoothstep(0.0, Rh * 0.75, r);
    const wave = 0.5 + 0.5 * Math.cos(lobes * theta + phase);
    const lobe = Math.pow(wave, 1.6) - 0.3;
    const bob = 0.03 * Math.sin(time * 3.1 + theta * 2);
    arr[i + 1] = y - (lobeDepth * lobe + bob) * w * intensity;
    // léger mouvement radial pour donner du volume aux vagues
    const k = 1 + 0.015 * Math.sin(lobes * theta + phase + 1.2) * w * intensity;
    arr[i] = x * k;
    arr[i + 2] = z * k;
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

export const SCREEN = {
  y0: 0.33, // centre vertical de l'écran-visage
  W: 1.06, // largeur (longueur d'arc)
  H: 0.6, // hauteur
  n: 3.4, // exposant du "squircle"
  lift: 0.018, // décollement de la surface du corps
  bulge: 0.035, // bombé du verre
} as const;

function sgnpow(v: number, p: number) {
  return Math.sign(v) * Math.pow(Math.abs(v), p);
}

/** Point de l'écran (coordonnées locales sx, sy en unités) projeté sur la surface du corps. */
export function screenPoint(sx: number, sy: number, extraLift = 0) {
  const { y0, lift, bulge, W, H } = SCREEN;
  const y = y0 + sy;
  const nx = (2 * sx) / W;
  const ny = (2 * sy) / H;
  const a2 = Math.min(1, nx * nx + ny * ny);
  const r = bodyRadius(y) + lift + bulge * (1 - a2) + extraLift;
  const lon = sx / r;
  return new THREE.Vector3(r * Math.sin(lon), y, r * Math.cos(lon));
}

/** Écran-visage en forme de squircle qui épouse la tête. UV 0..1 sur toute la surface. */
export function createScreenGeometry(rings = 22, segs = 96) {
  const { W, H, n } = SCREEN;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  // centre
  const c = screenPoint(0, 0);
  positions.push(c.x, c.y, c.z);
  uvs.push(0.5, 0.5);
  for (let i = 1; i <= rings; i++) {
    const a = i / rings;
    for (let j = 0; j < segs; j++) {
      const phi = (j / segs) * Math.PI * 2;
      const sx = a * (W / 2) * sgnpow(Math.cos(phi), 2 / n);
      const sy = a * (H / 2) * sgnpow(Math.sin(phi), 2 / n);
      const p = screenPoint(sx, sy);
      positions.push(p.x, p.y, p.z);
      uvs.push(sx / W + 0.5, sy / H + 0.5);
    }
  }
  // éventail central
  for (let j = 0; j < segs; j++) {
    indices.push(0, 1 + j, 1 + ((j + 1) % segs));
  }
  for (let i = 1; i < rings; i++) {
    const r0 = 1 + (i - 1) * segs;
    const r1 = 1 + i * segs;
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs;
      indices.push(r0 + j, r1 + j, r1 + j1);
      indices.push(r0 + j, r1 + j1, r0 + j1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Cadre (bezel) autour de l'écran : un tube fermé qui suit le bord. */
export function createBezelGeometry() {
  const { W, H, n } = SCREEN;
  const pts: THREE.Vector3[] = [];
  const segs = 140;
  for (let j = 0; j < segs; j++) {
    const phi = (j / segs) * Math.PI * 2;
    const sx = 1.015 * (W / 2) * sgnpow(Math.cos(phi), 2 / n);
    const sy = 1.015 * (H / 2) * sgnpow(Math.sin(phi), 2 / n);
    pts.push(screenPoint(sx, sy, -0.004));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
  return new THREE.TubeGeometry(curve, 220, 0.03, 14, true);
}
