/**
 * L'écran du téléphone : de VRAIS textes dessinés au canevas (heure, notification, conversation, compteur d'année,
 * vidéo de trente secondes, bannière finale). Chaque état est décrit par une clé de texte, mémorisée ; la clé de
 * l'instant est calculée par `ecranCle` à partir des mots (jamais de temps fixes).
 */
import * as THREE from "three";
import { entre, lisse } from "../../maths";
import { annee } from "./temps";

const POLICE = '"Inter", "DejaVu Sans", "Liberation Sans", Arial, sans-serif';
const W = 256;
const H = 512;
const memo = new Map<string, THREE.Texture>();

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function texte(c: CanvasRenderingContext2D, t: string, x: number, y: number, taille: number, couleur: string, poids = 700, align: CanvasTextAlign = "center") {
  c.font = `${poids} ${taille}px ${POLICE}`;
  c.fillStyle = couleur;
  c.textAlign = align;
  c.textBaseline = "middle";
  c.fillText(t, x, y);
}
function fond(c: CanvasRenderingContext2D, haut: string, bas: string) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, haut);
  g.addColorStop(1, bas);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}
function pastille(c: CanvasRenderingContext2D, an: string, y: number, grand = false) {
  const w = grand ? 214 : 170;
  const h = grand ? 70 : 52;
  rr(c, W / 2 - w / 2, y - h / 2, w, h, h / 2);
  c.fillStyle = "rgba(8,34,56,0.92)";
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = "#5BEBFF";
  c.stroke();
  texte(c, an, W / 2, y + 2, grand ? 46 : 36, "#8CF3FF", 800);
}
function barreHaut(c: CanvasRenderingContext2D) {
  texte(c, "21:47", 22, 22, 17, "#FFFFFF", 700, "left");
  rr(c, W - 52, 14, 30, 15, 4);
  c.fillStyle = "#FFFFFF";
  c.fill();
  c.fillRect(W - 21, 18, 3, 7);
}

function dessiner(c: CanvasRenderingContext2D, cle: string) {
  const [mode, an = "2025", p = "0"] = cle.split("|");
  const k = Number(p);
  if (mode === "noir") {
    c.fillStyle = "#020306";
    c.fillRect(0, 0, W, H);
    return;
  }
  if (mode === "verrou") {
    fond(c, "#0A1730", "#123E66");
    barreHaut(c);
    texte(c, "mardi", W / 2, 118, 22, "#9FB8D4", 600);
    texte(c, "21:47", W / 2, 176, 88, "#FFFFFF", 800);
    pastille(c, an, 250);
    if (k >= 1) {
      rr(c, 16, 318, W - 32, 112, 22);
      c.fillStyle = "rgba(255,255,255,0.20)";
      c.fill();
      c.beginPath();
      c.arc(52, 374, 22, 0, Math.PI * 2);
      c.fillStyle = "#35D7FF";
      c.fill();
      texte(c, "1", 52, 376, 26, "#05202E", 800);
      texte(c, "Message", 88, 350, 17, "#B9D8EE", 600, "left");
      texte(c, "1 nouveau message", 88, 382, 21, "#FFFFFF", 700, "left");
      texte(c, "à l'instant", 88, 408, 15, "#8FB1CC", 500, "left");
    }
    if (k >= 2) {
      texte(c, "Glisser pour répondre", W / 2, 468, 16, "#9FD8F2", 600);
    }
    return;
  }
  if (mode === "feed") {
    fond(c, "#08101F", "#0C1A33");
    barreHaut(c);
    texte(c, "Découvrir", W / 2, 62, 24, "#FFFFFF", 800);
    const tuiles = ["#E5338E", "#2EC4B6", "#F7B731", "#7A4DFF", "#FF6B3A", "#3AA0FF"];
    const dy = (k % 12) * 22;
    for (let i = -1; i < 5; i++) {
      const y = 92 + i * 170 - dy;
      const col = tuiles[(((i + Math.floor(k / 12)) % 6) + 6) % 6];
      rr(c, 18, y, W - 36, 148, 18);
      const g = c.createLinearGradient(0, y, W, y + 148);
      g.addColorStop(0, col);
      g.addColorStop(1, "#101830");
      c.fillStyle = g;
      c.fill();
      c.beginPath();
      c.moveTo(W / 2 - 14, y + 52);
      c.lineTo(W / 2 + 18, y + 74);
      c.lineTo(W / 2 - 14, y + 96);
      c.closePath();
      c.fillStyle = "rgba(255,255,255,0.85)";
      c.fill();
      rr(c, 30, y + 118, 120, 8, 4);
      c.fillStyle = "rgba(255,255,255,0.5)";
      c.fill();
    }
    pastille(c, an, 470);
    return;
  }
  if (mode === "annee") {
    fond(c, "#02060F", "#06203A");
    texte(c, "ANNÉE", W / 2, 150, 26, "#7FD9F5", 700);
    c.shadowColor = "#37E6FF";
    c.shadowBlur = 36;
    texte(c, an, W / 2, 262, 92, "#CFFBFF", 800);
    c.shadowBlur = 0;
    rr(c, 40, 348, W - 80, 6, 3);
    c.fillStyle = "#37E6FF";
    c.fill();
    texte(c, "21:47", W / 2, 400, 28, "#7FA5C4", 600);
    return;
  }
  if (mode === "chat") {
    fond(c, "#0A1426", "#0F2440");
    barreHaut(c);
    c.beginPath();
    c.arc(34, 74, 18, 0, Math.PI * 2);
    c.fillStyle = "#35D7FF";
    c.fill();
    texte(c, "Message", 66, 74, 21, "#FFFFFF", 700, "left");
    rr(c, 16, 128, 168, 56, 18);
    c.fillStyle = "#26364F";
    c.fill();
    texte(c, "Tu viens ?", 100, 156, 22, "#FFFFFF", 600);
    if (k >= 4) {
      rr(c, 62, 206, 178, 56, 18);
      c.fillStyle = "#14B8E0";
      c.fill();
      texte(c, "J'arrive !", 150, 234, 22, "#04202C", 700);
    }
    rr(c, 14, 440, W - 28, 52, 26);
    c.fillStyle = "#17283F";
    c.fill();
    if (k < 4) texte(c, ["", "J", "J'arr", "J'arrive"][Math.min(3, k)] + (k % 2 ? "|" : ""), 34, 466, 22, "#FFFFFF", 600, "left");
    pastille(c, an, 372);
    return;
  }
  if (mode === "video") {
    // k = secondes restantes sur 30
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#C2268A");
    g.addColorStop(0.55, "#5B2BC9");
    g.addColorStop(1, "#14244E");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    barreHaut(c);
    c.beginPath();
    c.arc(W / 2, 220, 62, 0, Math.PI * 2);
    c.fillStyle = "rgba(255,255,255,0.22)";
    c.fill();
    c.beginPath();
    c.moveTo(W / 2 - 18, 186);
    c.lineTo(W / 2 + 34, 220);
    c.lineTo(W / 2 - 18, 254);
    c.closePath();
    c.fillStyle = "#FFFFFF";
    c.fill();
    const reste = Math.max(0, Math.min(30, k));
    rr(c, 22, 430, W - 44, 10, 5);
    c.fillStyle = "rgba(255,255,255,0.3)";
    c.fill();
    rr(c, 22, 430, Math.max(10, (W - 44) * (1 - reste / 30)), 10, 5);
    c.fillStyle = "#FFFFFF";
    c.fill();
    texte(c, `0:${String(Math.round(reste)).padStart(2, "0")}`, W - 24, 462, 20, "#FFFFFF", 700, "right");
    texte(c, "0:30", 24, 462, 20, "rgba(255,255,255,0.7)", 600, "left");
    pastille(c, an, 350);
    return;
  }
  if (mode === "fin") {
    fond(c, "#02050B", "#04121F");
    texte(c, an, W / 2, 70, 26, "#5BEBFF", 700);
    const f = Math.min(1, k / 12);
    c.save();
    c.beginPath();
    c.rect(0, 0, W * f, H);
    c.clip();
    c.shadowColor = "#37E6FF";
    c.shadowBlur = 14;
    texte(c, "Plus personne", W / 2, 218, 31, "#FFFFFF", 800);
    texte(c, "ne t'attend.", W / 2, 268, 34, "#FFFFFF", 800);
    c.restore();
    rr(c, 40, 332, (W - 80) * f, 5, 3);
    c.fillStyle = "#37E6FF";
    c.fill();
    return;
  }
  c.fillStyle = "#000";
  c.fillRect(0, 0, W, H);
}

export function texEcran(cle: string): THREE.Texture {
  let t = memo.get(cle);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    dessiner(cv.getContext("2d")!, cle);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    tx.needsUpdate = true;
    t = tx;
    memo.set(cle, t);
  }
  return t;
}

/** Clé de texture de l'écran à l'instant T, et s'il est allumé. */
export function ecranCle(T: number, ev: Record<string, number>): { cle: string; on: boolean } {
  const an = annee(T, ev);
  const A = String(an);
  // éteint : d'« éteint » jusqu'à « rallumé »
  if (T >= ev.eteint && T < ev.rallume) return { cle: "noir", on: false };
  if (T >= ev.rallume) {
    if (T < ev.msg) return { cle: "verrou|2085|2", on: true };
    return { cle: `fin|2085|${Math.round(12 * lisse(entre(T, ev.msg, ev.msg + 1.0)))}`, on: true };
  }
  // défilement du compteur pendant les sauts
  for (const tb of [ev.b1, ev.b2, ev.b3, ev.b4, ev.b5]) if (T >= tb && T < tb + 0.7) return { cle: `annee|${A}`, on: true };
  if (T >= ev.spin0) return { cle: `annee|${A}`, on: true };
  // scène 3 : la vidéo de trente secondes
  if (T >= ev.video0 && T < ev.b5) return { cle: `video|${A}|${Math.round(30 * (1 - entre(T, ev.video0, ev.b5 - 0.05)))}`, on: true };
  const defile = (T: number) => `feed|${A}|${Math.floor(T * 14) % 144}`;
  if (T < ev.notif0) return { cle: defile(T), on: true };
  if (T < ev.rep0) return { cle: `verrou|${A}|1`, on: true };
  if (T < ev.b1) return { cle: `chat|${A}|${Math.min(4, Math.floor((T - ev.rep0) / 0.3))}`, on: true };
  if (T >= ev.notif2 && T < ev.b3) return { cle: `verrou|${A}|1`, on: true };
  return { cle: defile(T), on: true };
}
