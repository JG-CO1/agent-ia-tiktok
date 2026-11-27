/**
 * Fumée noire, flammes, braises et lueur de chaleur d'Ecto. Vrais effets animés (particules déterministes) :
 * chaque particule est une fonction analytique de (image, numéro d'émission), sans état entre les images.
 * Quantité de fumée et intensité des flammes dépendent de la colère (src/core/colere.ts).
 * Deux calques : `back` (derrière Ecto : lueur, grosse fumée, flammes) et `front` (devant : volutes fines et braises).
 */
import React, { useLayoutEffect, useRef } from "react";
import { fumeeAt, flammesAt, rageAt, type RageKey } from "../../src/core/colere";
import { modelToScreen, type ResolvedGhost } from "../ghost/performance";

const W = 1080;
const H = 1920;

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// ---------------------------------------------------------------- sprites (créés une fois)
let sprites: { smoke: HTMLCanvasElement; warm: HTMLCanvasElement; flame: HTMLCanvasElement; core: HTMLCanvasElement; dot: HTMLCanvasElement; glow: HTMLCanvasElement } | null = null;

function makeSprite(size: number, paint: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  paint(c.getContext("2d")!, size);
  return c;
}

function getSprites() {
  if (sprites) return sprites;
  sprites = {
    // fumée : cœur sombre, bord légèrement plus clair pour se détacher du fond noir
    smoke: makeSprite(160, (g, s) => {
      const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, "rgba(9,8,12,0.96)");
      r.addColorStop(0.4, "rgba(20,18,26,0.78)");
      r.addColorStop(0.7, "rgba(40,37,50,0.42)");
      r.addColorStop(1, "rgba(52,48,64,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, s, s);
    }),
    // fumée éclairée par les flammes : reflets rouge sombre, ajoutée en lumière
    warm: makeSprite(128, (g, s) => {
      const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, "rgba(190,60,20,0.55)");
      r.addColorStop(0.6, "rgba(120,30,10,0.2)");
      r.addColorStop(1, "rgba(120,30,10,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, s, s);
    }),
    // langue de feu : goutte renversée, rouge à l'extérieur, orange puis jaune au cœur
    flame: makeSprite(128, (g, s) => {
      const body = (scale: number, stops: Array<[number, string]>) => {
        const gr = g.createRadialGradient(s / 2, s * 0.62, 0, s / 2, s * 0.62, s * 0.5 * scale);
        for (const [o, c] of stops) gr.addColorStop(o, c);
        g.fillStyle = gr;
        g.beginPath();
        g.moveTo(s / 2, s * 0.02);
        g.bezierCurveTo(s * 0.9, s * 0.38, s * 0.98, s * 0.7, s / 2, s * 0.98);
        g.bezierCurveTo(s * 0.02, s * 0.7, s * 0.1, s * 0.38, s / 2, s * 0.02);
        g.fill();
      };
      body(1, [
        [0, "rgba(255,150,40,0.95)"],
        [0.6, "rgba(255,70,10,0.8)"],
        [1, "rgba(200,20,0,0.0)"],
      ]);
    }),
    core: makeSprite(96, (g, s) => {
      const r = g.createRadialGradient(s / 2, s * 0.6, 0, s / 2, s * 0.6, s * 0.4);
      r.addColorStop(0, "rgba(255,245,200,0.95)");
      r.addColorStop(0.5, "rgba(255,190,60,0.6)");
      r.addColorStop(1, "rgba(255,120,20,0)");
      g.fillStyle = r;
      g.beginPath();
      g.ellipse(s / 2, s * 0.58, s * 0.26, s * 0.4, 0, 0, Math.PI * 2);
      g.fill();
    }),
    dot: makeSprite(32, (g, s) => {
      const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, "rgba(255,240,190,1)");
      r.addColorStop(0.4, "rgba(255,150,40,0.85)");
      r.addColorStop(1, "rgba(255,60,10,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, s, s);
    }),
    glow: makeSprite(256, (g, s) => {
      const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, "rgba(255,90,30,0.55)");
      r.addColorStop(0.5, "rgba(220,40,10,0.22)");
      r.addColorStop(1, "rgba(220,40,10,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, s, s);
    }),
  };
  return sprites;
}

// ---------------------------------------------------------------- émetteurs de fumée (repère du modèle : x, y)
interface Emitter {
  mx: number;
  my: number;
  /** Pondération : un émetteur faible n'émet qu'à forte densité. */
  w: number;
  /** Dérive latérale du panache (px/image, positif vers la droite). */
  wind: number;
  period: number;
  phase: number;
}
const SMOKE_EMITTERS: Emitter[] = [
  { mx: 0.0, my: 1.12, w: 1, wind: 0.0, period: 2, phase: 0 },
  { mx: -0.52, my: 0.98, w: 0.9, wind: -0.55, period: 3, phase: 1 },
  { mx: 0.52, my: 0.98, w: 0.9, wind: 0.55, period: 3, phase: 2 },
  { mx: -0.93, my: -0.05, w: 0.55, wind: -0.8, period: 4, phase: 1 },
  { mx: 0.93, my: -0.05, w: 0.55, wind: 0.8, period: 4, phase: 3 },
  { mx: -0.7, my: -0.7, w: 0.4, wind: -0.5, period: 5, phase: 2 },
  { mx: 0.7, my: -0.7, w: 0.4, wind: 0.5, period: 5, phase: 4 },
];
const SMOKE_LIFE = 78;

// points d'émission des flammes : arc au-dessus du crâne puis flancs
const FLAME_EMITTERS: Array<{ mx: number; my: number; size: number; w: number }> = [
  ...[-60, -35, -12, 12, 35, 60].map((deg, i) => ({
    mx: 0.9 * Math.sin((deg * Math.PI) / 180),
    my: 0.3 + 0.9 * Math.cos((deg * Math.PI) / 180),
    size: 1.0 - Math.abs(deg) / 150 + (i % 2 ? 0.1 : 0),
    w: 0.35 + 0.65 * (1 - Math.abs(deg) / 75),
  })),
  { mx: -1.0, my: 0.15, size: 0.55, w: 0.55 },
  { mx: 1.0, my: 0.15, size: 0.55, w: 0.55 },
  { mx: -1.0, my: -0.45, size: 0.45, w: 0.7 },
  { mx: 1.0, my: -0.45, size: 0.45, w: 0.7 },
  { mx: -0.6, my: -0.78, size: 0.4, w: 0.8 },
  { mx: 0.6, my: -0.78, size: 0.4, w: 0.8 },
];

export const Fury: React.FC<{ rage: RageKey[]; g: ResolvedGhost; frame: number; layer: "back" | "front"; seed: number }> = ({ rage, g, frame, layer, seed }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const smokeNow = fumeeAt(rage, frame);
  const flameNow = flammesAt(rage, frame);
  const rNow = rageAt(rage, frame);
  const active = smokeNow > 0.01 || flameNow > 0.01;

  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);
    if (!active) return;
    const S = getSprites();
    const unit = (1000 / (2 * 9.5 * Math.tan((11 * Math.PI) / 180))) * g.s;
    const at = (mx: number, my: number) => modelToScreen(g, mx, my);

    // ---- lueur de chaleur (derrière) ----
    if (layer === "back" && rNow > 0.05) {
      const c = at(0, 0.2);
      const pulse = 0.85 + 0.15 * Math.sin(frame * 0.7 + seed);
      const R = unit * (1.7 + 0.5 * Math.min(2, rNow)) * pulse;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = clamp(0.1 + 0.3 * flameNow + 0.1 * Math.min(1, rNow));
      ctx.drawImage(S.glow, c.x - R, c.y - R, R * 2, R * 2);
      ctx.globalAlpha = 1;
    }

    // ---- fumée : volutes montantes, plusieurs émetteurs ----
    ctx.globalCompositeOperation = "source-over";
    SMOKE_EMITTERS.forEach((em, ei) => {
      const nNow = Math.floor((frame - em.phase) / em.period);
      const slots = Math.ceil(SMOKE_LIFE / em.period);
      for (let j = slots; j >= 0; j--) {
        const n = nNow - j;
        const spawn = n * em.period + em.phase;
        const age = frame - spawn;
        if (age < 0 || age > SMOKE_LIFE) continue;
        const dens = fumeeAt(rage, spawn);
        const hh = hash(n * 7.13 + ei * 31.7 + seed);
        // densité : un émetteur faible n'émet qu'à forte colère
        if (hh > dens * em.w * 1.25 || dens < 0.02) continue;
        // une partie des volutes passe devant Ecto (fines, près de la tête) ; le reste derrière
        const inFront = hash(n * 3.7 + ei * 9.1 + seed) > 0.7 && ei < 3;
        if ((layer === "front") !== inFront) continue;
        const u = age / SMOKE_LIFE;
        const o = at(em.mx + (hash(n * 1.9 + ei) - 0.5) * 0.25, em.my);
        // montée freinée, spirale, dérive du panache
        const rise = unit * 1.9 * (1 - Math.exp(-age / 26)) * (0.8 + 0.4 * hash(n + 4.1));
        const curl = Math.sin(age * 0.085 + hh * 6.28) * unit * (0.1 + 0.34 * u) * (1 + 0.5 * (hash(n + 8.8) - 0.5));
        const x = o.x + curl + em.wind * age * (0.7 + 0.5 * hash(n + 2.2)) * (unit / 270);
        const y = o.y - rise;
        const size = unit * (0.26 + 0.85 * Math.pow(u, 0.6)) * (0.8 + 0.5 * hash(n + 6.6)) * (inFront ? 0.55 : 1);
        const alpha = clamp(Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.8 * (0.55 + 0.45 * dens) * (inFront ? 0.5 : 0.85));
        ctx.globalAlpha = alpha;
        ctx.drawImage(S.smoke, x - size, y - size, size * 2, size * 2);
        // reflets de flammes sur le bas de la volute
        if (flameNow > 0.05 && u < 0.35 && !inFront) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = alpha * 0.45 * flameNow * (1 - u / 0.35);
          ctx.drawImage(S.warm, x - size, y - size * 0.6, size * 2, size * 2);
          ctx.globalCompositeOperation = "source-over";
        }
      }
    });

    // ---- flammes (derrière Ecto) : petites langues qui lèchent le corps et le dessus de la tête ----
    if (layer === "back" && flameNow > 0.01) {
      ctx.globalCompositeOperation = "lighter";
      FLAME_EMITTERS.forEach((em, ei) => {
        const period = 2;
        const life = 22;
        const nNow = Math.floor(frame / period);
        for (let j = Math.ceil(life / period); j >= 0; j--) {
          const n = nNow - j;
          const spawn = n * period;
          const age = frame - spawn;
          if (age < 0 || age > life) continue;
          const f = flammesAt(rage, spawn);
          if (hash(n * 5.3 + ei * 17.9 + seed) > f * em.w * 1.3 || f < 0.02) continue;
          const u = age / life;
          const o = at(em.mx, em.my);
          const jitter = (hash(n * 2.1 + ei) - 0.5) * unit * 0.14;
          const lean = em.mx * unit * 0.25 * u + Math.sin(age * 0.5 + ei * 2) * unit * 0.05;
          const rise = unit * (0.3 + 0.5 * f) * (1 - Math.pow(1 - u, 1.6)) * em.size * 1.0;
          const sz = unit * (0.2 + 0.24 * f) * em.size * (1 - 0.75 * u) * (0.85 + 0.3 * hash(n + 9));
          const x = o.x + jitter + lean;
          const y = o.y - rise;
          ctx.globalAlpha = clamp((1 - u) * 1.1) * clamp(0.5 + f);
          ctx.drawImage(S.flame, x - sz / 2, y - sz * 0.85, sz, sz * 1.15);
          ctx.globalAlpha = clamp((1 - u) * 0.9) * clamp(0.4 + f);
          ctx.drawImage(S.core, x - sz * 0.3, y - sz * 0.6, sz * 0.6, sz * 0.7);
        }
      });
    }

    // ---- braises : étincelles qui montent et s'éteignent (devant) ----
    if (layer === "front" && rNow > 0.3) {
      ctx.globalCompositeOperation = "lighter";
      const ember = 0.35 + 0.65 * Math.min(1, rNow / 2);
      for (let j = 0; j < 46; j++) {
        const n = Math.floor(frame / 2) - j;
        const spawn = n * 2;
        const age = frame - spawn;
        if (age < 0 || age > 54) continue;
        const dens = clamp(rageAt(rage, spawn) / 2);
        if (hash(n * 4.9 + seed) > dens * ember * 1.4) continue;
        const u = age / 54;
        const a = hash(n * 1.1 + 3) * Math.PI * 2;
        const o = at(0.95 * Math.sin(a) * 0.9, 0.2 + 0.9 * Math.cos(a) * 0.8);
        const vx = (hash(n * 2.3 + 1) - 0.5) * 3.4 * (unit / 270);
        const vy = -(2.2 + 3.4 * hash(n * 3.3 + 2)) * (unit / 270);
        const x = o.x + vx * age + Math.sin(age * 0.3 + n) * 6;
        const y = o.y + vy * age + 0.05 * age * age * (unit / 270);
        const sz = (6 + 9 * hash(n + 5)) * (1 - 0.7 * u) * (unit / 270);
        ctx.globalAlpha = clamp((1 - u) * (0.7 + 0.3 * Math.sin(age * 1.7 + n)));
        ctx.drawImage(S.dot, x - sz, y - sz, sz * 2, sz * 2);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  });

  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, pointerEvents: "none", display: active ? "block" : "none" }} />;
};
