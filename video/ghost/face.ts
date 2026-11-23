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
  // Expressions d'effort et de réaction (2026-11) : voir docs/BIBLE-VISUELLE.md
  "effort",
  "doute",
  "rire",
  "waouh",
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

type Pt = [number, number];

/** Contour d'un rectangle arrondi en polygone (coins échantillonnés). */
function roundRectPoly(x: number, y: number, w: number, h: number, r: number, n = 12): Pt[] {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const corners: Array<[number, number, number]> = [
    [x + w - rr, y + rr, -Math.PI / 2],
    [x + w - rr, y + h - rr, 0],
    [x + rr, y + h - rr, Math.PI / 2],
    [x + rr, y + rr, Math.PI],
  ];
  const pts: Pt[] = [];
  for (const [ccx, ccy, a0] of corners) {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2);
      pts.push([ccx + rr * Math.cos(a), ccy + rr * Math.sin(a)]);
    }
  }
  return pts;
}

/** Découpe d'un polygone par un demi-plan (Sutherland–Hodgman) : garde les points où keep(p) >= 0. */
function clipPoly(poly: Pt[], keep: (p: Pt) => number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = keep(a);
    const fb = keep(b);
    if (fa >= 0) out.push(a);
    if (fa >= 0 !== fb >= 0) {
      const t = fa / (fa - fb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

/**
 * Pupille « pilule » avec coupe oblique (sourcils implicites) et paupière basse optionnelles.
 * La forme est calculée géométriquement : pas de ctx.clip(), que le canvas accéléré du rendu logiciel
 * combine mal avec le halo (shadowBlur), et le halo reste entier autour de la forme coupée.
 */
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
  let poly = roundRectPoly(cx - w / 2, cy - h / 2, w, h, w / 2);
  if (cut !== 0) {
    const top = cy - h / 2 - 4;
    const inner = cx - side * (w / 2 + 6);
    const outer = cx + side * (w / 2 + 6);
    const yInner = top + (cut > 0 ? cut : 0);
    const yOuter = top + (cut < 0 ? -cut : 0);
    const lineY = (x: number) => yInner + ((yOuter - yInner) * (x - inner)) / (outer - inner);
    poly = clipPoly(poly, ([x, y]) => y - lineY(x));
  }
  if (lowerLid > 0) {
    const bottom = cy + h / 2 + 6 - lowerLid * h * 0.55;
    poly = clipPoly(poly, ([, y]) => bottom - y);
  }
  if (poly.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.fill();
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
    if (e === "effort") {
      // yeux serrés « > < »
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.moveTo(cx - side * 56, eyeY - 52);
      ctx.lineTo(cx + side * 44, eyeY + 4 * Math.sin(s.time * 30));
      ctx.lineTo(cx - side * 56, eyeY + 52);
      ctx.stroke();
      continue;
    }
    if (e === "waouh") {
      // étoiles à quatre branches qui scintillent
      const r = 86 * (0.9 + 0.1 * Math.sin(s.time * 9 + side));
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 === 0 ? r : r * 0.34;
        const x = cx + rr * Math.cos(a);
        const y = eyeY + rr * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      continue;
    }
    if (e === "doute") {
      // un œil grand ouvert, l'autre plissé (sourcil levé)
      if (side === -1) pillEye(ctx, cx, eyeY - 8, 112, Math.max(12, 184 * open), 0, side, 0);
      else pillEye(ctx, cx, eyeY + 22, 112, Math.max(12, 84 * open), 30, side, 0);
      continue;
    }
    if (e === "joie" || e === "rire" || isWinkEye) {
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
  if (e === "joie" || e === "amour" || e === "clin" || e === "rire" || e === "waouh" || e === "effort") {
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
  if (e === "effort") {
    // dents serrées (même quand il parle : il force)
    const mw = 168;
    const mh = 58 + 14 * m;
    ctx.lineWidth = 13;
    roundRect(ctx, mx - mw / 2, my - mh / 2 + 4, mw, mh, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx - mw / 2, my + 4);
    ctx.lineTo(mx + mw / 2, my + 4);
    for (const k of [-0.5, 0, 0.5]) {
      ctx.moveTo(mx + k * mw * 0.55, my - mh / 2 + 4);
      ctx.lineTo(mx + k * mw * 0.55, my + mh / 2 + 4);
    }
    ctx.stroke();
  } else if (s.speaking && m > 0.03) {
    const baseW = e === "joie" || e === "rire" || e === "waouh" ? 150 : e === "surprise" ? 90 : 124;
    const mw = baseW - 34 * m;
    const mh = 20 + 86 * m;
    roundRect(ctx, mx - mw / 2, my - mh / 2 + 6, mw, mh, Math.min(mw, mh) / 2);
    ctx.fill();
  } else if (e === "joie" || e === "amour") {
    ctx.beginPath();
    ctx.ellipse(mx, my - 18, 92, 60, 0, 0.08, Math.PI - 0.08);
    ctx.closePath();
    ctx.fill();
  } else if (e === "rire" || e === "waouh") {
    // grande bouche ouverte
    ctx.beginPath();
    ctx.ellipse(mx, my - 26, 112, e === "rire" ? 92 : 74, 0, 0.04, Math.PI - 0.04);
    ctx.closePath();
    ctx.fill();
  } else if (e === "doute") {
    // bouche ondulée
    ctx.beginPath();
    ctx.moveTo(mx - 70, my + 6);
    ctx.bezierCurveTo(mx - 40, my - 22, mx - 18, my + 30, mx + 8, my + 4);
    ctx.bezierCurveTo(mx + 30, my - 18, mx + 50, my + 22, mx + 72, my + 2);
    ctx.stroke();
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
