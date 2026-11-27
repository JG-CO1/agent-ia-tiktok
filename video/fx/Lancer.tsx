/**
 * Lancer d'objet vers le spectateur : trajectoire 3D en perspective (ThrowLayer) puis impact simulé sur la « vitre »
 * de l'écran (ImpactFx : éclaboussure, fissures, éclats). Tout est temporaire et se dissipe : la vidéo n'est jamais dégradée,
 * et les fissures restent de fins traits pour ne pas masquer les sous-titres.
 */
import React, { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { ACCESSOIRE_DEFS, FRAME_IMPACT, LANCER, pointImpact, type LancerState } from "../../src/core/colere";
import { ARMEMENT, type PropRender } from "../ghost/accessoires";
import { OBJET, PropLights } from "../ghost/Accessoires3D";
import { modelToScreen, type ResolvedGhost } from "../ghost/performance";

const W = 1080;
const H = 1920;
const CAM_Z = 9.5;
/** px par unité du modèle pour une échelle d'Ecto de 1 (même optique que GhostLayer : fov 22° sur 1000 px). */
const UNIT = 1000 / (2 * CAM_Z * Math.tan((11 * Math.PI) / 180));
const FOV = (2 * Math.atan(H / 2 / (CAM_Z * UNIT)) * 180) / Math.PI;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function mulberry(seed: number) {
  let a = Math.floor(seed * 9973 + 1) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- objet en vol
/** Copie estompée de l'objet (traînée de flou de mouvement) : ses matériaux sont remplacés une fois par des matériaux translucides. */
const Echo: React.FC<{ opacity: number; children: React.ReactNode }> = ({ opacity, children }) => (
  <group
    ref={(grp) => {
      if (!grp || grp.userData.echo) return;
      grp.userData.echo = true;
      grp.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const src = m.material as THREE.MeshStandardMaterial;
        m.material = new THREE.MeshBasicMaterial({ color: src.color ?? "#ffffff", map: src.map ?? null, transparent: true, opacity, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      });
    }}
  >
    {children}
  </group>
);

const flightProp = (id: PropRender["id"]): PropRender => ({ id, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, a: 0, tremble: 0, age: 40, vanish: 0, poof: 0 });

/** Position 3D de l'objet à l'avancement t (0 = main, 1 = vitre) : accélère en s'approchant, grossit par la perspective. */
function flightAt(t: number, start: { x: number; y: number }, end: { x: number; y: number }) {
  const te = Math.pow(clamp(t), 1.55);
  const sx = lerp(start.x, end.x, te);
  const sy = lerp(start.y, end.y, te) - 90 * Math.sin(Math.PI * clamp(t)) * 0.0; // trajectoire tendue
  const z = lerp(0.6, 8.55, Math.pow(clamp(t), 2.3));
  return { x: (sx - W / 2) / UNIT, y: (H / 2 - sy) / UNIT, z, rot: t * 7.5 };
}

export const ThrowLayer: React.FC<{ state: LancerState; ghostAtRelease: ResolvedGhost }> = ({ state, ghostAtRelease }) => {
  const { lancer, t } = state;
  const start = modelToScreen(ghostAtRelease, ARMEMENT.x, ARMEMENT.y, ARMEMENT.z);
  const end = pointImpact(lancer.seed);
  const Obj = OBJET[lancer.accessoire];
  const copies = [
    { dt: 0, op: 1 },
    { dt: 0.1, op: 0.42 },
    { dt: 0.2, op: 0.22 },
    { dt: 0.3, op: 0.1 },
  ];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, pointerEvents: "none" }}>
      <ThreeCanvas width={W} height={H} camera={{ fov: FOV, position: [0, 0, CAM_Z] }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
        <PropLights />
        {copies.map((c, i) => {
          const tt = t - c.dt;
          if (tt < 0) return null;
          const f = flightAt(tt, start, end);
          const body = (
            <group position={[f.x, f.y, f.z]} rotation={[f.rot * 0.55, f.rot * 0.3, f.rot]} scale={1.3 + (i === 0 ? 0 : 0.0)}>
              <Obj p={flightProp(lancer.accessoire)} />
            </group>
          );
          return i === 0 ? <React.Fragment key={i}>{body}</React.Fragment> : <Echo key={i} opacity={c.op}>{body}</Echo>;
        })}
      </ThreeCanvas>
    </div>
  );
};

// ---------------------------------------------------------------- impact : fissures, éclaboussure, éclats
interface Crack {
  pts: Array<{ x: number; y: number; d: number }>;
  w: number;
}

function buildCracks(seed: number, level: "leger" | "fissure" | "brise", cx: number, cy: number) {
  const r = mulberry(seed);
  const n = level === "leger" ? 7 : level === "fissure" ? 15 : 22;
  const reach = level === "leger" ? [220, 480] : level === "fissure" ? [620, 1500] : [900, 1900];
  const radials: Crack[] = [];
  for (let i = 0; i < n; i++) {
    let a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.35;
    const L = lerp(reach[0], reach[1], r());
    const pts = [{ x: cx, y: cy, d: 0 }];
    let d = 0;
    let x = cx;
    let y = cy;
    while (d < L) {
      const seg = 40 + r() * 55;
      a += (r() - 0.5) * 0.26;
      x += Math.cos(a) * seg;
      y += Math.sin(a) * seg;
      d += seg;
      pts.push({ x, y, d });
      // branche : une fissure secondaire qui part de biais
      if (level !== "leger" && r() < 0.28 && d < L * 0.8) {
        const ba = a + (r() < 0.5 ? -1 : 1) * (0.45 + r() * 0.5);
        const bl = 70 + r() * 190;
        const bp = [{ x, y, d }];
        let bx = x;
        let by = y;
        let bd = d;
        let aa = ba;
        while (bd < d + bl) {
          const s2 = 30 + r() * 40;
          aa += (r() - 0.5) * 0.3;
          bx += Math.cos(aa) * s2;
          by += Math.sin(aa) * s2;
          bd += s2;
          bp.push({ x: bx, y: by, d: bd });
        }
        radials.push({ pts: bp, w: 0.55 });
      }
    }
    radials.push({ pts, w: 1 });
  }
  return radials;
}

const COLOR_SOFT = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const ImpactFx: React.FC<{ state: LancerState; level: "leger" | "fissure" | "brise" }> = ({ state, level }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const d = state.depuis;
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;
    g.clearRect(0, 0, W, H);
    const { lancer } = state;
    const def = ACCESSOIRE_DEFS[lancer.accessoire];
    const { x: cx, y: cy } = pointImpact(lancer.seed);
    const master = d < 46 ? 1 : clamp(1 - (d - 46) / 32);
    if (master <= 0) return;
    const r = mulberry(lancer.seed + 11);

    // ---- flash et teinte ----
    if (d < 6) {
      g.fillStyle = `rgba(255,255,255,${(level === "leger" ? 0.5 : 0.9) * (1 - d / 6)})`;
      g.fillRect(0, 0, W, H);
    }
    if (level === "brise") {
      const v = g.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1200);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, `rgba(40,0,0,${0.5 * Math.exp(-d / 26) * master})`);
      g.fillStyle = v;
      g.fillRect(0, 0, W, H);
    }

    // ---- éclaboussure ----
    g.save();
    g.globalAlpha = master;
    const grow = easeOut(clamp(d / 4));
    if (def.eclaboussure === "liquide") {
      g.fillStyle = COLOR_SOFT(def.couleur, 0.92);
      g.beginPath();
      g.ellipse(cx, cy, 120 * grow, 96 * grow, 0.2, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < 34; i++) {
        const a = r() * Math.PI * 2;
        const dist = (90 + r() * 360) * grow;
        const rad = 5 + r() * 26;
        g.beginPath();
        g.arc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, rad * grow, 0, Math.PI * 2);
        g.fill();
        // traînée entre le centre et la goutte
        g.strokeStyle = COLOR_SOFT(def.couleur, 0.7);
        g.lineWidth = rad * 0.5;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * dist * 0.45, cy + Math.sin(a) * dist * 0.45);
        g.lineTo(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist);
        g.stroke();
      }
      // coulures qui descendent le long de la vitre
      for (let i = 0; i < 6; i++) {
        const ox = cx + (r() - 0.5) * 220;
        const len = Math.min(420, Math.max(0, d - 4) * (5 + r() * 6));
        g.strokeStyle = COLOR_SOFT(def.couleur, 0.82);
        g.lineWidth = 7 + r() * 9;
        g.beginPath();
        g.moveTo(ox, cy + 40);
        g.lineTo(ox, cy + 40 + len);
        g.stroke();
        g.beginPath();
        g.arc(ox, cy + 40 + len, 6 + r() * 6, 0, Math.PI * 2);
        g.fillStyle = COLOR_SOFT(def.couleur, 0.9);
        g.fill();
      }
      // reflet brillant sur la flaque
      g.fillStyle = "rgba(255,255,255,0.35)";
      g.beginPath();
      g.ellipse(cx - 34, cy - 30, 38 * grow, 18 * grow, -0.5, 0, Math.PI * 2);
      g.fill();
    } else {
      // duvet / papier / pétales : fragments légers qui volent puis retombent
      const n = def.eclaboussure === "papier" ? 16 : 30;
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2;
        const speed = 7 + r() * 17;
        const x = cx + Math.cos(a) * speed * Math.min(d, 18) * 1.5 + Math.sin(d * 0.2 + i) * 6;
        const y = cy + Math.sin(a) * speed * Math.min(d, 18) * 1.2 + 0.5 * 0.35 * Math.max(0, d - 6) ** 2;
        const rot = a + d * 0.12 * (i % 2 ? 1 : -1);
        g.save();
        g.translate(x, y);
        g.rotate(rot);
        if (def.eclaboussure === "papier") {
          g.fillStyle = "rgba(250,246,234,0.95)";
          g.fillRect(-26, -34, 52, 68);
          g.strokeStyle = "rgba(120,110,90,0.7)";
          g.lineWidth = 3;
          for (let k = 0; k < 4; k++) {
            g.beginPath();
            g.moveTo(-18, -22 + k * 14);
            g.lineTo(18, -22 + k * 14);
            g.stroke();
          }
        } else if (def.eclaboussure === "petales") {
          g.fillStyle = i % 3 ? "rgba(255,143,179,0.95)" : "rgba(255,194,214,0.95)";
          g.beginPath();
          g.ellipse(0, 0, 30, 15, 0, 0, Math.PI * 2);
          g.fill();
        } else {
          const gr = g.createRadialGradient(0, 0, 0, 0, 0, 40);
          gr.addColorStop(0, COLOR_SOFT(def.couleur, 0.95));
          gr.addColorStop(1, COLOR_SOFT(def.couleur, 0));
          g.fillStyle = gr;
          g.beginPath();
          g.arc(0, 0, 18 + (i % 4) * 6, 0, Math.PI * 2);
          g.fill();
        }
        g.restore();
      }
    }
    g.restore();

    // ---- fissures ----
    const prog = easeOut(clamp(d / 8));
    const cracks = buildCracks(lancer.seed, level, cx, cy);
    const draw = (c: Crack, ox: number, oy: number, color: string, width: number) => {
      g.strokeStyle = color;
      g.lineWidth = width * c.w;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.beginPath();
      const limit = (c.pts[c.pts.length - 1].d - c.pts[0].d) * prog + c.pts[0].d;
      g.moveTo(c.pts[0].x + ox, c.pts[0].y + oy);
      for (let i = 1; i < c.pts.length; i++) {
        const p = c.pts[i];
        if (p.d <= limit) g.lineTo(p.x + ox, p.y + oy);
        else {
          const q = c.pts[i - 1];
          const k = (limit - q.d) / Math.max(1, p.d - q.d);
          if (k > 0) g.lineTo(q.x + (p.x - q.x) * k + ox, q.y + (p.y - q.y) * k + oy);
          break;
        }
      }
      g.stroke();
    };
    g.save();
    g.globalAlpha = master;
    for (const c of cracks) draw(c, 2, 2, "rgba(0,0,0,0.38)", 3.2);
    if (level === "brise") for (const c of cracks) draw(c, -2.5, 0, "rgba(255,70,70,0.28)", 2.4); // dispersion chromatique
    for (const c of cracks) draw(c, 0, 0, "rgba(255,255,255,0.82)", 2.4);
    for (const c of cracks) draw(c, -1, -1, "rgba(160,225,255,0.4)", 1.1);
    // anneaux concentriques entre les fissures principales
    if (level !== "leger") {
      const mains = cracks.filter((c) => c.w === 1);
      const ringCount = level === "fissure" ? 3 : 4;
      g.strokeStyle = "rgba(255,255,255,0.55)";
      g.lineWidth = 1.7;
      for (let k = 1; k <= ringCount; k++) {
        const dist = 70 * Math.pow(k, 1.45) + 50;
        g.beginPath();
        let started = false;
        mains.forEach((c, i) => {
          const p = c.pts.find((q) => q.d >= dist);
          if (!p || p.d > (c.pts[c.pts.length - 1].d) * prog) {
            started = false;
            return;
          }
          if (!started || (i * 7 + k * 3) % 5 === 0) {
            g.moveTo(p.x, p.y);
            started = true;
          } else g.lineTo(p.x, p.y);
        });
        g.stroke();
      }
      // éclats de verre (écran brisé) : plaques qui se détachent près du choc et tombent
      if (level === "brise") {
        const mains2 = mains;
        for (let i = 0; i < mains2.length; i++) {
          const a = mains2[i];
          const b = mains2[(i + 1) % mains2.length];
          for (const dist of [120, 250]) {
            const pa = a.pts.find((q) => q.d >= dist);
            const pb = b.pts.find((q) => q.d >= dist);
            if (!pa || !pb) continue;
            const start = 9 + ((i * 5 + dist) % 11);
            const fall = Math.max(0, d - start);
            const dy = 0.55 * fall * fall;
            const dx = ((i % 3) - 1) * fall * 2.5;
            const rot = fall * 0.05 * (i % 2 ? 1 : -1);
            const mx = (cx + pa.x + pb.x) / 3;
            const my = (cy + pa.y + pb.y) / 3;
            g.save();
            g.translate(mx + dx, my + dy);
            g.rotate(rot);
            g.translate(-mx, -my);
            g.globalAlpha = master * clamp(1 - fall / 40) * 0.9;
            g.fillStyle = "rgba(220,240,255,0.14)";
            g.strokeStyle = "rgba(255,255,255,0.7)";
            g.lineWidth = 1.6;
            g.beginPath();
            g.moveTo(cx, cy);
            g.lineTo(pa.x, pa.y);
            g.lineTo(pb.x, pb.y);
            g.closePath();
            if (fall > 0) g.fill();
            g.stroke();
            g.restore();
          }
        }
      }
    }
    // point d'impact
    const core = g.createRadialGradient(cx, cy, 0, cx, cy, 70);
    core.addColorStop(0, "rgba(255,255,255,0.65)");
    core.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = core;
    g.beginPath();
    g.arc(cx, cy, 70, 0, Math.PI * 2);
    g.fill();
    g.restore();
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, pointerEvents: "none" }} />;
};

export { FRAME_IMPACT, LANCER };
