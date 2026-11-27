/**
 * Textures dessinées au canevas pour « messages » : bulles de chat (avec de VRAIS textes), panneau « Supprimer ce message ? »,
 * boutons, enseigne de la boulangerie, écran de téléphone (chat avec Yanis, saisie en cours).
 * Aucune image externe : rectangles arrondis, aplats et texte (police Inter, installée avec le projet).
 */
import * as THREE from "three";

export type TypeBulle = "bleue" | "grise" | "verte";
const POLICE = `"Inter", "Inter Display", Arial, sans-serif`;

const memo = new Map<string, THREE.CanvasTexture>();
function creer(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  return [cv, cv.getContext("2d")!];
}
function fabrique(cv: HTMLCanvasElement): THREE.CanvasTexture {
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 4;
  tx.needsUpdate = true;
  return tx;
}
function texture(cle: string, w: number, h: number, dessin: (c: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  let t = memo.get(cle);
  if (!t) {
    const [cv, c] = creer(w, h);
    dessin(c);
    t = fabrique(cv);
    memo.set(cle, t);
  }
  return t;
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const q = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + q, y);
  c.arcTo(x + w, y, x + w, y + h, q);
  c.arcTo(x + w, y + h, x, y + h, q);
  c.arcTo(x, y + h, x, y, q);
  c.arcTo(x, y, x + w, y, q);
  c.closePath();
  c.fill();
}

function lignesDe(c: CanvasRenderingContext2D, texte: string, maxW: number): string[] {
  const mots = texte.split(" ");
  const out: string[] = [];
  let cur = "";
  for (const m of mots) {
    const essai = cur ? `${cur} ${m}` : m;
    if (c.measureText(essai).width > maxW && cur) {
      out.push(cur);
      cur = m;
    } else cur = essai;
  }
  if (cur) out.push(cur);
  return out;
}

/** Ajuste la taille de police pour que le texte tienne dans (maxW, maxH). */
function ajuste(c: CanvasRenderingContext2D, texte: string, maxW: number, maxH: number, poids = 700): { fs: number; lignes: string[] } {
  for (let fs = Math.min(190, maxH); fs >= 22; fs -= 4) {
    c.font = `${poids} ${fs}px ${POLICE}`;
    const l = lignesDe(c, texte, maxW);
    if (l.length * fs * 1.12 <= maxH && Math.max(...l.map((x) => c.measureText(x).width)) <= maxW) return { fs, lignes: l };
  }
  c.font = `${poids} 22px ${POLICE}`;
  return { fs: 22, lignes: lignesDe(c, texte, maxW) };
}

const COUL: Record<TypeBulle, { fond: string; bord: string; texte: string; barre: string }> = {
  bleue: { fond: "#1F86FF", bord: "#0B55C9", texte: "#FFFFFF", barre: "#8DC3FF" },
  grise: { fond: "#E9E9EF", bord: "#B4B4C0", texte: "#14141A", barre: "#C4C4CE" },
  verte: { fond: "#35C759", bord: "#1E8F3C", texte: "#FFFFFF", barre: "#95E8AB" },
};
export const COULEUR_BULLE = (t: TypeBulle) => COUL[t].fond;

/**
 * Bulle de chat : `texte` lisible, ou `barres` lignes grises (message illisible), ou trois points (saisie en cours).
 * (w, h) en unités du monde ; la queue est du côté de l'expéditeur (bleue/verte à droite, grise à gauche).
 */
export function texBulle(texte: string, type: TypeBulle, w: number, h: number, opt: { barres?: number; points?: number } = {}): THREE.CanvasTexture {
  const ppu = Math.min(76, 1500 / w);
  const W = Math.round(w * ppu);
  const H = Math.round(h * ppu);
  return texture(`bulle|${texte}|${type}|${W}|${H}|${opt.barres ?? 0}|${opt.points ?? -1}`, W, H, (c) => {
    const k = COUL[type];
    const droite = type !== "grise";
    const r = H * 0.46;
    const marge = Math.max(6, H * 0.06);
    // épaisseur : même forme plus sombre, décalée vers le bas
    c.fillStyle = k.bord;
    rr(c, marge, marge + H * 0.05, W - 2 * marge, H - 2 * marge - H * 0.03, r);
    c.fillStyle = k.fond;
    rr(c, marge, marge, W - 2 * marge, H - 2 * marge - H * 0.04, r);
    // queue
    const bx = droite ? W - marge - H * 0.1 : marge + H * 0.1;
    const s = droite ? -1 : 1;
    c.beginPath();
    c.moveTo(bx - s * H * 0.34, H - marge - H * 0.22);
    c.quadraticCurveTo(bx + s * H * 0.05, H - marge - H * 0.12, bx + s * H * 0.12, H - marge + 0.01 * H);
    c.quadraticCurveTo(bx - s * H * 0.18, H - marge - H * 0.04, bx - s * H * 0.62, H - marge - H * 0.2);
    c.fill();
    if (opt.points !== undefined) {
      for (let i = 0; i < 3; i++) {
        const a = 0.35 + 0.65 * Math.max(0, Math.sin(opt.points * 6 - i * 0.9));
        c.fillStyle = k.texte === "#FFFFFF" ? `rgba(255,255,255,${a})` : `rgba(80,80,95,${a})`;
        c.beginPath();
        c.arc(W / 2 + (i - 1) * H * 0.3, H * 0.46, H * 0.11, 0, Math.PI * 2);
        c.fill();
      }
      return;
    }
    if (opt.barres) {
      c.fillStyle = k.barre;
      const n = opt.barres;
      const lh = Math.min(H * 0.2, (H * 0.55) / n);
      for (let i = 0; i < n; i++) {
        const lw = (W - 2 * (r * 0.8)) * (i === n - 1 && n > 1 ? 0.55 : 0.9 - ((i * 37) % 17) / 100);
        rr(c, droite ? W - r * 0.8 - lw : r * 0.8, H * 0.5 - (n * lh * 1.7) / 2 + i * lh * 1.7, lw, lh, lh / 2);
      }
      return;
    }
    const { fs, lignes } = ajuste(c, texte, W - 2 * r * 0.85, H * 0.7);
    c.font = `700 ${fs}px ${POLICE}`;
    c.fillStyle = k.texte;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const lh = fs * 1.14;
    const y0 = H * 0.47 - ((lignes.length - 1) * lh) / 2;
    lignes.forEach((l, i) => c.fillText(l, W / 2, y0 + i * lh));
  });
}

/** Pastille de date / d'étiquette (« Il y a 15 ans »). */
export function texPastille(texte: string, w: number, h: number, fond = "#DDE6F5", encre = "#3A4766"): THREE.CanvasTexture {
  const ppu = Math.min(80, 1200 / w);
  const W = Math.round(w * ppu);
  const H = Math.round(h * ppu);
  return texture(`past|${texte}|${W}|${H}|${fond}`, W, H, (c) => {
    c.fillStyle = fond;
    rr(c, 2, 2, W - 4, H - 4, H / 2);
    const { fs } = ajuste(c, texte, W * 0.86, H * 0.62, 700);
    c.font = `700 ${fs}px ${POLICE}`;
    c.fillStyle = encre;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(texte, W / 2, H * 0.52);
  });
}

/** Panneau de confirmation : titre + sous-titre (fond blanc, bord bleu pâle). */
export function texPanneau(titre: string, sous: string, w: number, h: number): THREE.CanvasTexture {
  const ppu = Math.min(80, 1400 / w);
  const W = Math.round(w * ppu);
  const H = Math.round(h * ppu);
  return texture(`pan|${titre}|${sous}|${W}|${H}`, W, H, (c) => {
    c.fillStyle = "#A9C4EE";
    rr(c, 0, H * 0.03, W, H * 0.97, H * 0.14);
    c.fillStyle = "#FFFFFF";
    rr(c, 0, 0, W, H * 0.97, H * 0.14);
    const a = ajuste(c, titre, W * 0.88, H * 0.42, 800);
    c.font = `800 ${a.fs}px ${POLICE}`;
    c.fillStyle = "#14161F";
    c.textAlign = "center";
    c.textBaseline = "middle";
    a.lignes.forEach((l, i) => c.fillText(l, W / 2, H * 0.34 + (i - (a.lignes.length - 1) / 2) * a.fs * 1.12));
    const b = ajuste(c, sous, W * 0.86, H * 0.18, 500);
    c.font = `500 ${b.fs}px ${POLICE}`;
    c.fillStyle = "#6A7390";
    b.lignes.forEach((l, i) => c.fillText(l, W / 2, H * 0.74 + (i - (b.lignes.length - 1) / 2) * b.fs * 1.12));
  });
}

/** Face d'un bouton (texte centré sur fond uni). */
export function texBouton(texte: string, fond: string, encre: string, w: number, h: number): THREE.CanvasTexture {
  const ppu = Math.min(90, 1200 / w);
  const W = Math.round(w * ppu);
  const H = Math.round(h * ppu);
  return texture(`bou|${texte}|${fond}|${W}|${H}`, W, H, (c) => {
    c.fillStyle = fond;
    c.fillRect(0, 0, W, H);
    const a = ajuste(c, texte, W * 0.84, H * 0.5, 800);
    c.font = `800 ${a.fs}px ${POLICE}`;
    c.fillStyle = encre;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(texte, W / 2, H * 0.52);
  });
}

/** Enseigne de la boulangerie (lettres crème sur bois). */
export function texEnseigne(texte: string, fond: string, encre: string, w: number, h: number): THREE.CanvasTexture {
  const ppu = Math.min(120, 1500 / w);
  const W = Math.round(w * ppu);
  const H = Math.round(h * ppu);
  return texture(`ens|${texte}|${fond}|${W}|${H}`, W, H, (c) => {
    c.fillStyle = fond;
    c.fillRect(0, 0, W, H);
    const a = ajuste(c, texte, W * 0.92, H * 0.7, 800);
    c.font = `800 ${a.fs}px ${POLICE}`;
    c.fillStyle = encre;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(texte, W / 2, H * 0.53);
  });
}

// ------------------------------------------------------------------ Écran de téléphone (un seul canevas réutilisé : la saisie change à chaque image)
const ecrans = new Map<string, { tx: THREE.CanvasTexture; c: CanvasRenderingContext2D; cle: string }>();
/**
 * Écran de chat avec Yanis : en-tête, bulles précédentes, champ de saisie avec le texte tapé (`saisie`), clavier si `clavier`
 * (la touche `pression` est allumée), `envoyes` = les messages déjà partis (bulles bleues).
 */
export function texEcran(id: string, saisie: string, envoyes: string[], clavier = false, pression = -1): THREE.CanvasTexture {
  let e = ecrans.get(id);
  if (!e) {
    const [cv, c] = creer(360, 720);
    e = { tx: fabrique(cv), c, cle: "" };
    ecrans.set(id, e);
  }
  const cle = `${saisie}|${envoyes.join("~")}|${clavier}|${pression}`;
  if (e.cle === cle) return e.tx;
  e.cle = cle;
  const c = e.c;
  const W = 360;
  const H = 720;
  c.clearRect(0, 0, W, H);
  c.fillStyle = "#F4F7FF";
  c.fillRect(0, 0, W, H);
  // en-tête : avatar (violet + casquette) et nom
  c.fillStyle = "#FFFFFF";
  c.fillRect(0, 0, W, 112);
  c.fillStyle = "#D5DEEF";
  c.fillRect(0, 112, W, 3);
  c.fillStyle = "#9B5BE8";
  rr(c, 24, 30, 56, 56, 14);
  c.fillStyle = "#C99873";
  rr(c, 32, 36, 40, 34, 8);
  c.fillStyle = "#22C3B5";
  rr(c, 30, 30, 44, 14, 5);
  c.fillStyle = "#14141A";
  c.fillRect(42, 52, 6, 8);
  c.fillRect(58, 52, 6, 8);
  c.font = `800 34px ${POLICE}`;
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillStyle = "#14141A";
  c.fillText("Yanis", 98, 58);
  // bulles
  const bulle = (txt: string, y: number, droite: boolean, fond: string, encre: string) => {
    c.font = `700 26px ${POLICE}`;
    const l = lignesDe(c, txt, 230);
    const bw = Math.min(262, Math.max(...l.map((x) => c.measureText(x).width)) + 36);
    const bh = l.length * 32 + 24;
    const x = droite ? W - 20 - bw : 20;
    c.fillStyle = fond;
    rr(c, x, y, bw, bh, 24);
    c.fillStyle = encre;
    c.textAlign = "left";
    l.forEach((s, i) => c.fillText(s, x + 18, y + 12 + 16 + i * 32));
    return y + bh + 16;
  };
  let y = 140;
  y = bulle("t'es là ?", y, false, "#E4E4EB", "#14141A");
  for (const m of envoyes) y = bulle(m, y, true, "#1F86FF", "#FFFFFF");
  // clavier (3 rangées de touches arrondies + barre d'espace)
  const yc = clavier ? H - 372 : H - 150; // haut du champ de saisie
  if (clavier) {
    c.fillStyle = "#D6DCEA";
    c.fillRect(0, H - 262, W, 262);
    const rangs = [10, 9, 7];
    let n = 0;
    rangs.forEach((nb, ri) => {
      const kw = 30;
      const gap = 5;
      const x0 = (W - nb * kw - (nb - 1) * gap) / 2;
      for (let i = 0; i < nb; i++, n++) {
        c.fillStyle = n === pression ? "#1F86FF" : "#FFFFFF";
        rr(c, x0 + i * (kw + gap), H - 244 + ri * 58, kw, 48, 8);
      }
    });
    c.fillStyle = "#FFFFFF";
    rr(c, 70, H - 244 + 3 * 58, W - 140, 48, 8);
  }
  c.fillStyle = "#FFFFFF";
  c.fillRect(0, yc, W, 112);
  c.fillStyle = "#D5DEEF";
  c.fillRect(0, yc, W, 3);
  c.fillStyle = "#EDF0F8";
  rr(c, 18, yc + 14, W - 36 - 74, 86, 43);
  c.font = `600 26px ${POLICE}`;
  c.textAlign = "left";
  c.fillStyle = "#14141A";
  if (saisie) {
    const l = lignesDe(c, saisie, 220);
    l.slice(-2).forEach((s, i, a) => c.fillText(s, 42, yc + 57 + (i - (a.length - 1) / 2) * 30));
  } else {
    c.fillStyle = "#9AA3BC";
    c.fillText("Message", 42, yc + 57);
  }
  // bouton envoyer (rond bleu, flèche)
  const cy = yc + 57;
  c.fillStyle = saisie ? "#1F86FF" : "#B7C6E6";
  c.beginPath();
  c.arc(W - 18 - 33, cy, 33, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#FFFFFF";
  c.beginPath();
  c.moveTo(W - 51, cy - 23);
  c.lineTo(W - 26, cy + 3);
  c.lineTo(W - 41, cy + 3);
  c.lineTo(W - 41, cy + 23);
  c.lineTo(W - 61, cy + 23);
  c.lineTo(W - 61, cy + 3);
  c.lineTo(W - 76, cy + 3);
  c.closePath();
  c.fill();
  e.tx.needsUpdate = true;
  return e.tx;
}
