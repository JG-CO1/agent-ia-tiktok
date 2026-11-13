/**
 * Visage LED d'Ecto, dessiné en 2D sur un canvas puis plaqué sur l'écran 3D.
 * Fonction pure de l'état -> image identique à chaque rendu.
 */
export const EXPRESSIONS = [
  "neutre",
  "joie",
  "surprise",
  "clin",
  "reflexion",
  "determine",
  "triste",
  "amour",
  "malicieux",
  "chargement",
] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export interface FaceState {
  expression: Expression;
  blink: number; // 0 ouvert, 1 fermé
  lookX: number; // -1..1
  lookY: number; // -1..1 (positif = haut)
  mouthOpen: number; // 0..1 (synchronisation labiale)
  speaking: boolean;
  time: number; // secondes
  glow: number; // multiplicateur de lueur
}

export const FACE_W = 1024;
const FACE_SCALE = 1.22;
export const FACE_H = 580;

const LED = "#8CFFF0";
const LED_GLOW = "rgba(70,255,225,0.95)";
const BLUSH = "rgba(255,126,95,0.6)";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function heart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.55);
  ctx.bezierCurveTo(cx - s * 1.1, cy - s * 0.15, cx - s * 0.55, cy - s * 0.95, cx, cy - s * 0.38);
  ctx.bezierCurveTo(cx + s * 0.55, cy - s * 0.95, cx + s * 1.1, cy - s * 0.15, cx, cy + s * 0.55);
  ctx.closePath();
}

/** Pupille "pilule" avec coupe oblique optionnelle (sourcils implicites). */
function pillEye(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  cut: number, // >0 coupe le coin intérieur (déterminé), <0 coupe l'extérieur (triste)
  side: -1 | 1,
  lowerLid = 0, // 0..1 : paupière inférieure (sourire des yeux)
) {
  ctx.save();
  if (cut !== 0 || lowerLid > 0) {
    ctx.beginPath();
    const top = cy - h / 2 - 4;
    const inner = cx - side * (w / 2 + 6);
    const outer = cx + side * (w / 2 + 6);
    const yInner = top + (cut > 0 ? cut : 0);
    const yOuter = top + (cut < 0 ? -cut : 0);
    ctx.moveTo(inner, yInner);
    ctx.lineTo(outer, yOuter);
    ctx.lineTo(outer, cy + h / 2 + 6 - lowerLid * h * 0.55);
    ctx.lineTo(inner, cy + h / 2 + 6 - lowerLid * h * 0.55);
    ctx.closePath();
    ctx.clip();
  }
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, w / 2);
  ctx.fill();
  ctx.restore();
}

export function drawFace(ctx: CanvasRenderingContext2D, s: FaceState) {
  const W = FACE_W;
  const H = FACE_H;
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  // Fond du verre
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.42, 40, W * 0.5, H * 0.5, W * 0.62);
  bg.addColorStop(0, "#1B2232");
  bg.addColorStop(0.55, "#0D111A");
  bg.addColorStop(1, "#05070B");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Lignes de balayage discrètes
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = LED;
  for (let y = 0; y < H; y += 7) ctx.fillRect(0, y, W, 2);
  ctx.globalAlpha = 1;

  // Agrandit l'ensemble du visage autour du centre (lisibilité sur mobile)
  ctx.translate(W / 2, H / 2);
  ctx.scale(FACE_SCALE, FACE_SCALE);
  ctx.translate(-W / 2, -H / 2);

  const glow = Math.max(0, s.glow);
  ctx.fillStyle = LED;
  ctx.strokeStyle = LED;
  ctx.shadowColor = LED_GLOW;
  ctx.shadowBlur = 34 * glow;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const lx = Math.max(-1, Math.min(1, s.lookX));
  const ly = Math.max(-1, Math.min(1, s.lookY));
  const dx = lx * 44;
  const dy = -ly * 30;
  const eyeY = 250 + dy;
  const eyes: Array<{ cx: number; side: -1 | 1 }> = [
    { cx: W / 2 - 200 + dx, side: -1 },
    { cx: W / 2 + 200 + dx, side: 1 },
  ];
  const open = 1 - Math.min(1, Math.max(0, s.blink)) * 0.93;
  const e = s.expression;

  // ---- Yeux ----
  for (const { cx, side } of eyes) {
    const isWinkEye = e === "clin" && side === 1;
    if (e === "joie" || isWinkEye) {
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.arc(cx, eyeY + 42, 62, Math.PI * 1.18, Math.PI * 1.82);
      ctx.stroke();
      continue;
    }
    if (e === "amour") {
      heart(ctx, cx, eyeY, 78 * (0.92 + 0.08 * Math.sin(s.time * 8)));
      ctx.fill();
      continue;
    }
    if (e === "chargement") {
      const a0 = s.time * 6 * (side === 1 ? 1 : -1);
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(cx, eyeY, 52, a0, a0 + Math.PI * 1.35);
      ctx.stroke();
      continue;
    }
    if (e === "surprise") {
      ctx.beginPath();
      ctx.ellipse(cx, eyeY, 64, 72 * open, 0, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    let w = 110;
    let h = 172;
    let cut = 0;
    let lid = 0;
    if (e === "reflexion") {
      h = 118;
      lid = side === -1 ? 0.25 : 0;
    } else if (e === "determine") {
      h = 132;
      cut = 46;
    } else if (e === "triste") {
      h = 126;
      cut = -44;
    } else if (e === "malicieux") {
      h = 120;
      cut = 30;
      lid = 0.3;
    }
    pillEye(ctx, cx, eyeY, w, Math.max(12, h * open), cut, side, lid);
  }

  // ---- Joues ----
  if (e === "joie" || e === "amour" || e === "clin") {
    ctx.save();
    ctx.shadowColor = BLUSH;
    ctx.shadowBlur = 26;
    ctx.fillStyle = BLUSH;
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(W / 2 + sgn * 300 + dx * 0.4, 388, 48, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---- Bouche ----
  const mx = W / 2 + dx * 0.35;
  const my = 438 + dy * 0.3;
  const m = Math.min(1, Math.max(0, s.mouthOpen));
  ctx.lineWidth = 17;
  if (s.speaking && m > 0.03) {
    const baseW = e === "joie" ? 150 : e === "surprise" ? 90 : 124;
    const mw = baseW - 34 * m;
    const mh = 20 + 86 * m;
    roundRect(ctx, mx - mw / 2, my - mh / 2 + 6, mw, mh, Math.min(mw, mh) / 2);
    ctx.fill();
  } else if (e === "joie" || e === "amour") {
    ctx.beginPath();
    ctx.ellipse(mx, my - 18, 92, 60, 0, 0.08, Math.PI - 0.08);
    ctx.closePath();
    ctx.fill();
  } else if (e === "surprise") {
    ctx.beginPath();
    ctx.ellipse(mx, my + 4, 32, 42, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (e === "triste") {
    ctx.beginPath();
    ctx.arc(mx, my + 62, 62, Math.PI * 1.22, Math.PI * 1.78);
    ctx.stroke();
  } else if (e === "determine") {
    ctx.beginPath();
    ctx.moveTo(mx - 52, my + 6);
    ctx.lineTo(mx + 52, my + 6);
    ctx.stroke();
  } else if (e === "malicieux") {
    ctx.beginPath();
    ctx.moveTo(mx - 64, my - 2);
    ctx.quadraticCurveTo(mx + 10, my + 34, mx + 66, my - 22);
    ctx.stroke();
  } else if (e === "reflexion") {
    ctx.beginPath();
    ctx.moveTo(mx - 30, my + 10);
    ctx.lineTo(mx + 44, my - 4);
    ctx.stroke();
  } else if (e === "chargement") {
    for (let i = 0; i < 3; i++) {
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(s.time * 7 - i * 0.9));
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(mx - 46 + i * 46, my + 4, 13, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    // neutre / clin : petit sourire
    ctx.beginPath();
    ctx.arc(mx, my - 40, 66, Math.PI * 0.24, Math.PI * 0.76);
    ctx.stroke();
  }
  ctx.restore();
}
