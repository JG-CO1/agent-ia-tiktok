/**
 * « Hamburger interdit » — textures dessinées au canevas (police Inter, aucune image externe) :
 * enseigne géante « HAMBURGERS INTERDITS », panneaux ronds barrés, menu sans burger, pancarte de vitrine, enseignes néon,
 * étiquette « SAISI », papier plié (la phrase clé), pages d'album (photos avec LA silhouette blanche découpée),
 * photo de Léa (couleurs vives) et son verso manuscrit, étiquette du manteau, emballage jauni.
 */
import * as THREE from "three";

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
  tx.anisotropy = 8;
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
}
function remplit(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, couleur: string) {
  rr(c, x, y, w, h, r);
  c.fillStyle = couleur;
  c.fill();
}
/** Taille de police maximale pour que `texte` tienne dans `maxW`. */
function tailleMax(c: CanvasRenderingContext2D, texte: string, maxW: number, poids: number, max: number, style = "") {
  for (let fs = max; fs > 14; fs -= 2) {
    c.font = `${style}${poids} ${fs}px ${POLICE}`;
    if (c.measureText(texte).width <= maxW) return fs;
  }
  return 14;
}
function lignesDe(c: CanvasRenderingContext2D, texte: string, maxW: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const m of texte.split(" ")) {
    const essai = cur ? `${cur} ${m}` : m;
    if (c.measureText(essai).width > maxW && cur) {
      out.push(cur);
      cur = m;
    } else cur = essai;
  }
  if (cur) out.push(cur);
  return out;
}

// ------------------------------------------------------------------ Pictogrammes
/** Petit hamburger dessiné (pain doré, graines, salade, steak, fromage, tomate). `s` = demi-largeur. */
function burger(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, couleurs = { pain: "#F0A93B", paind: "#C97B1E", steak: "#5B3320", salade: "#6CC24A", fromage: "#FFD23F", tomate: "#E8343C" }) {
  const h = s * 0.36;
  // pain du haut (dôme)
  c.fillStyle = couleurs.pain;
  c.beginPath();
  c.moveTo(cx - s, cy - h * 0.6);
  c.quadraticCurveTo(cx - s, cy - s * 1.05, cx, cy - s * 1.05);
  c.quadraticCurveTo(cx + s, cy - s * 1.05, cx + s, cy - h * 0.6);
  c.closePath();
  c.fill();
  c.fillStyle = couleurs.paind;
  c.fillRect(cx - s, cy - h * 0.75, 2 * s, h * 0.3);
  c.fillStyle = "#FFF1C9";
  for (const [dx, dy] of [[-0.45, -0.72], [-0.12, -0.9], [0.25, -0.76], [0.52, -0.58], [-0.62, -0.5]]) {
    c.beginPath();
    c.ellipse(cx + dx * s, cy + dy * s, s * 0.07, s * 0.04, 0.5, 0, Math.PI * 2);
    c.fill();
  }
  // salade ondulée
  c.fillStyle = couleurs.salade;
  c.beginPath();
  c.moveTo(cx - s * 1.08, cy - h * 0.45);
  for (let i = 0; i <= 8; i++) c.lineTo(cx - s * 1.08 + (i * s * 2.16) / 8, cy - h * 0.45 + (i % 2 ? h * 0.35 : 0));
  c.lineTo(cx + s * 1.08, cy - h * 0.1);
  c.lineTo(cx - s * 1.08, cy - h * 0.1);
  c.closePath();
  c.fill();
  // tomate, fromage, steak
  remplit(c, cx - s * 0.98, cy - h * 0.12, s * 1.96, h * 0.34, h * 0.12, couleurs.tomate);
  remplit(c, cx - s * 1.04, cy + h * 0.18, s * 2.08, h * 0.2, 3, couleurs.fromage);
  remplit(c, cx - s * 1.0, cy + h * 0.34, s * 2.0, h * 0.5, h * 0.2, couleurs.steak);
  // pain du bas
  remplit(c, cx - s * 0.94, cy + h * 0.82, s * 1.88, h * 0.55, h * 0.22, couleurs.pain);
}
/** Cercle rouge barré d'une diagonale (sens interdit) autour de (cx, cy). */
function barre(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, couleur = "#FF2038", ep = 0.17) {
  c.strokeStyle = couleur;
  c.lineCap = "round";
  c.lineWidth = r * ep * 2;
  c.beginPath();
  c.arc(cx, cy, r * (1 - ep), 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  const a = Math.PI / 4;
  c.moveTo(cx - Math.cos(a) * r * (1 - ep), cy - Math.sin(a) * r * (1 - ep));
  c.lineTo(cx + Math.cos(a) * r * (1 - ep), cy + Math.sin(a) * r * (1 - ep));
  c.stroke();
}
function luisant(c: CanvasRenderingContext2D, flou: number, couleur: string, fn: () => void) {
  c.save();
  c.shadowColor = couleur;
  c.shadowBlur = flou;
  fn();
  c.restore();
}

// ------------------------------------------------------------------ Enseigne géante (néon qui clignote)
/** `etat` : 1 = allumée, 0 = éteinte (clignotement), 2 = morte et grise (monde décoloré). */
export function texEnseigneGeante(etat: 0 | 1 | 2): THREE.CanvasTexture {
  return texture(`geante|${etat}`, 1024, 1088, (c) => {
    const W = 1024;
    const H = 1088;
    const vif = etat === 1;
    c.fillStyle = etat === 2 ? "#2A2A30" : "#12061F";
    c.fillRect(0, 0, W, H);
    const rose = vif ? "#FF4FA3" : etat === 2 ? "#6A6A72" : "#6B2A4F";
    const cyan = vif ? "#36F2E0" : etat === 2 ? "#5E5E66" : "#235A55";
    const rouge = vif ? "#FF2038" : etat === 2 ? "#74747C" : "#6A1A24";
    // cadre néon double
    for (const [m, col, ep] of [[22, rose, 16], [58, cyan, 9]] as Array<[number, string, number]>) {
      c.strokeStyle = col;
      c.lineWidth = ep;
      if (vif) luisant(c, 36, col, () => { rr(c, m, m, W - 2 * m, H - 2 * m, 54); c.stroke(); });
      else { rr(c, m, m, W - 2 * m, H - 2 * m, 54); c.stroke(); }
    }
    // sens interdit : hamburger barré
    const cx = W / 2;
    const cy = 340;
    const R = 262;
    c.fillStyle = etat === 2 ? "#3A3A42" : "#2A1236";
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.fill();
    if (etat === 2) {
      burger(c, cx, cy + 10, 175, { pain: "#8A8A90", paind: "#6A6A70", steak: "#4A4A50", salade: "#7C7C82", fromage: "#9A9AA0", tomate: "#707076" });
    } else burger(c, cx, cy + 10, 175);
    if (vif) luisant(c, 44, "#FF2038", () => barre(c, cx, cy, R, rouge, 0.15));
    else barre(c, cx, cy, R, rouge, 0.15);
    // textes
    c.textAlign = "center";
    c.textBaseline = "middle";
    const t1 = "HAMBURGERS";
    const f1 = tailleMax(c, t1, 880, 900, 190);
    c.font = `900 ${f1}px ${POLICE}`;
    if (vif) luisant(c, 40, "#FF4FA3", () => { c.fillStyle = "#FFE3F1"; c.fillText(t1, cx, 742); });
    else { c.fillStyle = rose; c.fillText(t1, cx, 742); }
    const t2 = "INTERDITS";
    const f2 = tailleMax(c, t2, 900, 900, 250);
    c.font = `900 ${f2}px ${POLICE}`;
    if (vif) luisant(c, 46, "#FF2038", () => { c.fillStyle = "#FFD6DB"; c.fillText(t2, cx, 920); });
    else { c.fillStyle = rouge; c.fillText(t2, cx, 920); }
  });
}

/** Panneau rond : hamburger barré (poteaux de lampadaires, grilles d'école). */
export function texPanneauRond(gris = false): THREE.CanvasTexture {
  return texture(`rond|${gris ? 1 : 0}`, 256, 256, (c) => {
    c.fillStyle = gris ? "#CFCFD2" : "#FFF8EA";
    c.beginPath();
    c.arc(128, 128, 124, 0, Math.PI * 2);
    c.fill();
    burger(c, 128, 134, 74, gris ? { pain: "#9A9A9F", paind: "#808086", steak: "#55555A", salade: "#8A8A90", fromage: "#B0B0B6", tomate: "#7A7A80" } : undefined);
    barre(c, 128, 128, 118, gris ? "#6A6A70" : "#E01428", 0.15);
  });
}

/** Bandeau en travers de la rue : « HAMBURGERS INTERDITS » (lettres blanches sur rouge, bordure à damier). */
export function texBandeau(gris = false): THREE.CanvasTexture {
  return texture(`bandeau|${gris ? 1 : 0}`, 1536, 160, (c) => {
    const W = 1536;
    const H = 160;
    c.fillStyle = gris ? "#6A6A70" : "#E01E3A";
    c.fillRect(0, 0, W, H);
    for (let i = 0; i < W / 20; i++) {
      c.fillStyle = i % 2 ? (gris ? "#202024" : "#16161C") : "#FFFFFF";
      c.fillRect(i * 20, 0, 20, 12);
      c.fillStyle = i % 2 ? "#FFFFFF" : gris ? "#202024" : "#16161C";
      c.fillRect(i * 20, H - 12, 20, 12);
    }
    c.textAlign = "center";
    c.textBaseline = "middle";
    const t = "HAMBURGERS INTERDITS";
    const f = tailleMax(c, t, 1300, 900, 108);
    c.font = `900 ${f}px ${POLICE}`;
    c.fillStyle = "#FFFFFF";
    c.fillText(t, W / 2, H / 2 + 4);
  });
}

// ------------------------------------------------------------------ Enseignes néon (texte lumineux sur fond transparent)
export function texNeon(texte: string, couleur: string, w: number, h: number, gris = false): THREE.CanvasTexture {
  const ppu = Math.min(120, 1400 / w);
  const W = Math.round(w * ppu);
  const H = Math.round(h * ppu);
  return texture(`neon|${texte}|${couleur}|${W}|${H}|${gris ? 1 : 0}`, W, H, (c) => {
    c.textAlign = "center";
    c.textBaseline = "middle";
    const f = tailleMax(c, texte, W * 0.9, 900, H * 0.7);
    c.font = `900 ${f}px ${POLICE}`;
    if (gris) {
      c.fillStyle = "#7A7A82";
      c.fillText(texte, W / 2, H / 2 + 2);
      return;
    }
    luisant(c, f * 0.45, couleur, () => { c.fillStyle = couleur; c.fillText(texte, W / 2, H / 2 + 2); });
    luisant(c, f * 0.18, couleur, () => { c.fillStyle = "#FFFFFF"; c.fillText(texte, W / 2, H / 2 + 2); });
  });
}

// ------------------------------------------------------------------ Menu du snack (aucun burger)
export function texMenu(gris = false): THREE.CanvasTexture {
  return texture(`menu|${gris ? 1 : 0}`, 640, 960, (c) => {
    const W = 640;
    const H = 960;
    c.fillStyle = gris ? "#3C3C42" : "#1E2A3A";
    c.fillRect(0, 0, W, H);
    c.strokeStyle = gris ? "#8A8A90" : "#F6B81E";
    c.lineWidth = 14;
    rr(c, 14, 14, W - 28, H - 28, 26);
    c.stroke();
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = `900 96px ${POLICE}`;
    c.fillStyle = gris ? "#CFCFD4" : "#FF7FB0";
    c.fillText("MENU", W / 2, 110);
    const lignes = ["HOT-DOG", "FRITES", "MILK-SHAKE", "TARTE", "SALADE"];
    c.font = `800 62px ${POLICE}`;
    lignes.forEach((l, i) => {
      const y = 250 + i * 118;
      c.textAlign = "left";
      c.fillStyle = gris ? "#E2E2E6" : "#FFF3DC";
      c.fillText(l, 62, y);
      c.fillStyle = gris ? "#8A8A90" : "#7FE3D8";
      c.fillRect(62, y + 44, W - 124, 4);
    });
    // la ligne manquante : une barre noire, impossible à lire
    const y = 250 + 5 * 118;
    remplit(c, 52, y - 40, W - 104, 80, 10, "#050508");
    c.textAlign = "center";
    c.font = `800 34px ${POLICE}`;
    c.fillStyle = gris ? "#8A8A90" : "#FF2038";
    c.fillText("— RETIRÉ —", W / 2, y + 3);
  });
}

/** Pancarte scotchée à la vitrine : « Pas de burger ici ». */
export function texPancarte(gris = false): THREE.CanvasTexture {
  return texture(`pancarte|${gris ? 1 : 0}`, 768, 512, (c) => {
    const W = 768;
    const H = 512;
    c.fillStyle = gris ? "#BEBEC2" : "#FFF6DC";
    c.fillRect(0, 0, W, H);
    c.strokeStyle = gris ? "#6A6A70" : "#E01E3A";
    c.lineWidth = 14;
    c.strokeRect(20, 20, W - 40, H - 40);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = gris ? "#202024" : "#16161C";
    for (const [t, y, f] of [["PAS DE", 140, 120], ["BURGER", 270, 140], ["ICI", 395, 120]] as Array<[string, number, number]>) {
      c.font = `900 ${f}px ${POLICE}`;
      c.fillText(t, W / 2 - (t === "ICI" ? 60 : 0), y);
    }
    barre(c, W / 2 + 190, 395, 70, gris ? "#6A6A70" : "#E01428", 0.18);
  });
}

/** Étiquette « SAISI » posée devant la cloche. */
export function texSaisi(): THREE.CanvasTexture {
  return texture("saisi", 512, 256, (c) => {
    c.fillStyle = "#FFF6DC";
    c.fillRect(0, 0, 512, 256);
    c.strokeStyle = "#16161C";
    c.lineWidth = 8;
    c.strokeRect(10, 10, 492, 236);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#E01E3A";
    c.font = `900 118px ${POLICE}`;
    c.fillText("SAISI", 256, 112);
    c.fillStyle = "#16161C";
    c.font = `700 40px ${POLICE}`;
    c.fillText("HAMBURGER INTERDIT", 256, 204);
  });
}
/** Panneau au-dessus de la porte de l'école. */
export function texEcole(gris = false): THREE.CanvasTexture {
  return texture(`ecole|${gris ? 1 : 0}`, 1024, 256, (c) => {
    c.fillStyle = gris ? "#4A4A50" : "#1F2F66";
    c.fillRect(0, 0, 1024, 256);
    c.strokeStyle = gris ? "#9A9AA0" : "#F6B81E";
    c.lineWidth = 12;
    c.strokeRect(14, 14, 996, 228);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = gris ? "#DADADE" : "#FFF3DC";
    c.font = `900 150px ${POLICE}`;
    c.fillText("ÉCOLE", 512, 112);
    c.fillStyle = gris ? "#9A9AA0" : "#7FE3D8";
    c.font = `700 52px ${POLICE}`;
    c.fillText("SACS CONTRÔLÉS À L'ENTRÉE", 512, 205);
  });
}

// ------------------------------------------------------------------ Papier plié (la phrase clé)
/** `chaud` : le mot « efface » passe au rouge, souligné (au moment où la voix le dit). */
export function texPapier(chaud: boolean): THREE.CanvasTexture {
  return texture(`papier|${chaud ? 1 : 0}`, 768, 1024, (c) => {
    const W = 768;
    const H = 1024;
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#F1E2B5");
    g.addColorStop(1, "#E0CB94");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    // pliures
    c.strokeStyle = "rgba(120,90,40,0.28)";
    c.lineWidth = 3;
    for (const y of [H * 0.34, H * 0.67]) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y + 4);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(W / 2, 0);
    c.lineTo(W / 2 - 3, H);
    c.stroke();
    // taches
    c.fillStyle = "rgba(150,100,40,0.13)";
    for (const [x, y, r] of [[90, 120, 70], [650, 880, 90], [700, 160, 50], [120, 900, 60]]) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
    c.textAlign = "center";
    c.textBaseline = "middle";
    const lignes: Array<[string, number, number, number]> = [["Chaque", 200, 128, -0.02], ["bouchée", 345, 128, 0.015], ["efface", 500, 160, -0.01], ["quelqu'un", 660, 128, 0.02], ["que tu aimes.", 800, 104, -0.015]];
    lignes.forEach(([t, y, f, a], i) => {
      c.save();
      c.translate(W / 2, y);
      c.rotate(a);
      c.font = `${i === 2 ? 900 : 800} ${f}px ${POLICE}`;
      c.fillStyle = i === 2 && chaud ? "#D81830" : "#2A1D12";
      c.fillText(t, 0, 0);
      if (i === 2 && chaud) {
        const w = c.measureText(t).width;
        c.fillRect(-w / 2, f * 0.52, w, 10);
      }
      c.restore();
    });
  });
}

// ------------------------------------------------------------------ Étiquette du manteau et emballage
export function texEtiquette(): THREE.CanvasTexture {
  return texture("etiquette", 256, 256, (c) => {
    c.fillStyle = "#F7F2E6";
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = "#B6A98C";
    c.setLineDash([10, 8]);
    c.lineWidth = 5;
    c.strokeRect(12, 12, 232, 232);
    c.setLineDash([]);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#D81830";
    c.font = `900 190px ${POLICE}`;
    c.fillText("N.", 128, 138);
  });
}
export function texEmballage(): THREE.CanvasTexture {
  return texture("emballage", 384, 320, (c) => {
    c.fillStyle = "#E7D08A";
    c.fillRect(0, 0, 384, 320);
    c.fillStyle = "rgba(200,60,50,0.55)";
    for (let i = 0; i < 6; i++) c.fillRect(0, 30 + i * 52, 384, 16);
    burger(c, 192, 160, 70, { pain: "#C9A24E", paind: "#A98430", steak: "#7A5A38", salade: "#8DA85E", fromage: "#D6B84F", tomate: "#B8584A" });
    c.fillStyle = "rgba(110,80,30,0.25)";
    for (const [x, y, r] of [[60, 70, 40], [330, 250, 52], [300, 40, 30]]) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
  });
}

// ------------------------------------------------------------------ Album : photos et silhouette blanche découpée
function garcon(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  // blouson rouge cerise, jean, cheveux châtains (même apparence que dans la 3D)
  c.fillStyle = "#2F4A8C";
  c.fillRect(x - 0.45 * s, y + 1.3 * s, 0.36 * s, 0.9 * s);
  c.fillRect(x + 0.09 * s, y + 1.3 * s, 0.36 * s, 0.9 * s);
  c.fillStyle = "#FFFFFF";
  c.fillRect(x - 0.5 * s, y + 2.1 * s, 0.44 * s, 0.2 * s);
  c.fillRect(x + 0.06 * s, y + 2.1 * s, 0.44 * s, 0.2 * s);
  c.fillStyle = "#E0243E";
  c.fillRect(x - 0.62 * s, y + 0.35 * s, 1.24 * s, 1.1 * s);
  c.fillRect(x - 0.95 * s, y + 0.4 * s, 0.34 * s, 0.9 * s);
  c.fillRect(x + 0.61 * s, y + 0.4 * s, 0.34 * s, 0.9 * s);
  c.fillStyle = "#EBC09A";
  c.fillRect(x - 0.4 * s, y - 0.5 * s, 0.8 * s, 0.85 * s);
  c.fillStyle = "#8A5A3A";
  c.fillRect(x - 0.44 * s, y - 0.58 * s, 0.88 * s, 0.3 * s);
  c.fillStyle = "#17171C";
  c.fillRect(x - 0.22 * s, y - 0.18 * s, 0.1 * s, 0.16 * s);
  c.fillRect(x + 0.12 * s, y - 0.18 * s, 0.1 * s, 0.16 * s);
  c.fillRect(x - 0.12 * s, y + 0.1 * s, 0.24 * s, 0.05 * s);
}
/** LA silhouette : la même sur chaque photo (fillette aux couettes), blanche, découpée aux ciseaux. */
export function silhouetteBlanche(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const pts: Array<[number, number]> = [
    [-0.34, -0.55], [0.34, -0.55], [0.36, -0.2], [0.62, -0.1], [0.66, 0.2], [0.4, 0.2], [0.38, 0.32], [0.6, 1.45], [0.34, 1.5], [0.3, 1.95],
    [0.1, 1.95], [0.06, 1.55], [-0.06, 1.55], [-0.1, 1.95], [-0.3, 1.95], [-0.34, 1.5], [-0.6, 1.45], [-0.38, 0.32], [-0.4, 0.2], [-0.66, 0.2], [-0.62, -0.1], [-0.36, -0.2],
  ];
  const trace = (dx: number, dy: number) => {
    c.beginPath();
    pts.forEach(([px, py], i) => (i ? c.lineTo(x + px * s + dx, y + py * s + dy) : c.moveTo(x + px * s + dx, y + py * s + dy)));
    c.closePath();
  };
  c.fillStyle = "rgba(0,0,0,0.28)";
  trace(0.05 * s, 0.05 * s);
  c.fill();
  c.fillStyle = "#FFFFFF";
  trace(0, 0);
  c.fill();
  c.strokeStyle = "#CFCFD4";
  c.lineWidth = Math.max(2, s * 0.03);
  c.stroke();
}
const FONDS: Array<[string, string, string]> = [
  ["#D8C7A0", "#B9A47C", "ANNIVERSAIRE"],
  ["#CBD8DC", "#E3D3A5", "LA PLAGE"],
  ["#DCE3E8", "#F2F4F6", "LA NEIGE"],
  ["#C7D3B0", "#9DB080", "AU PARC"],
  ["#E3C7C0", "#C9A59C", "AU DINER"],
  ["#C9BFA0", "#A89B78", "NOËL"],
  ["#CDD6C4", "#B3C0A4", "LE JARDIN"],
  ["#D9C9B8", "#BBA58E", "À LA MAISON"],
];
/** Page d'album n° `i` (0 à 7) : une photo ancienne, le garçon et la silhouette blanche à côté de lui. */
export function texPage(i: number): THREE.CanvasTexture {
  return texture(`page|${i}`, 700, 900, (c) => {
    const W = 700;
    const H = 900;
    c.fillStyle = "#EFE3C8";
    c.fillRect(0, 0, W, H);
    const [haut, bas, legende] = FONDS[i % FONDS.length];
    const x0 = 60;
    const y0 = 110;
    const w = 580;
    const h = 560;
    c.fillStyle = "#FFFFFF";
    c.fillRect(x0 - 22, y0 - 22, w + 44, h + 90);
    c.fillStyle = haut;
    c.fillRect(x0, y0, w, h * 0.62);
    c.fillStyle = bas;
    c.fillRect(x0, y0 + h * 0.62, w, h * 0.38);
    // un détail de décor par photo (sans texte)
    c.fillStyle = "rgba(255,255,255,0.55)";
    if (i % 3 === 0) c.fillRect(x0 + 40, y0 + 50, 130, 70);
    else if (i % 3 === 1) c.fillRect(x0 + w - 190, y0 + 60, 120, 120);
    else c.fillRect(x0 + 60, y0 + 70, 200, 40);
    c.fillStyle = "rgba(90,60,40,0.35)";
    c.fillRect(x0 + w * 0.6, y0 + h * 0.38, 160, 130);
    garcon(c, x0 + w * 0.3, y0 + h * 0.28, 120);
    silhouetteBlanche(c, x0 + w * 0.68, y0 + h * 0.28, 108);
    c.fillStyle = "rgba(255,230,180,0.14)";
    c.fillRect(x0, y0, w, h);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#5A4630";
    c.font = `700 40px ${POLICE}`;
    c.fillText(legende, W / 2, y0 + h + 36);
    c.fillStyle = "rgba(140,110,70,0.5)";
    for (const [px, py] of [[x0 - 30, y0 - 30], [x0 + w + 30, y0 - 30], [x0 - 30, y0 + h + 66], [x0 + w + 30, y0 + h + 66]]) c.fillRect(px - 16, py - 16, 32, 32);
  });
}
/** La dernière photo : Léa seule, en couleurs vives, avec un hamburger. */
export function texLea(): THREE.CanvasTexture {
  return texture("lea", 640, 800, (c) => {
    const W = 640;
    const H = 800;
    c.fillStyle = "#FFFFFF";
    c.fillRect(0, 0, W, H);
    const x0 = 28;
    const y0 = 28;
    const w = W - 56;
    const h = H - 150;
    c.fillStyle = "#FF8FBA";
    c.fillRect(x0, y0, w, h);
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? "#FF6FA5" : "#FFA8CB";
      c.fillRect(x0 + i * (w / 6), y0, w / 6, h);
    }
    c.fillStyle = "#2FD3C4";
    c.fillRect(x0, y0 + h * 0.78, w, h * 0.22);
    // Léa : robe moutarde, couettes, grand sourire
    const cx = x0 + w / 2;
    const cy = y0 + h * 0.2;
    c.fillStyle = "#3A2418";
    c.fillRect(cx - 190, cy + 10, 78, 190);
    c.fillRect(cx + 112, cy + 10, 78, 190);
    c.fillStyle = "#F6B81E";
    c.fillRect(cx - 120, cy + 262, 240, 250);
    c.fillStyle = "#EBC09A";
    c.fillRect(cx - 150, cy + 300, 50, 160);
    c.fillRect(cx - 118, cy + 500, 90, 90);
    c.fillRect(cx + 28, cy + 500, 90, 90);
    c.fillRect(cx - 108, cy - 70, 216, 224);
    c.fillStyle = "#3A2418";
    c.fillRect(cx - 118, cy - 86, 236, 70);
    c.fillStyle = "#17171C";
    c.fillRect(cx - 62, cy + 28, 26, 44);
    c.fillRect(cx + 36, cy + 28, 26, 44);
    c.fillStyle = "#FFFFFF";
    c.fillRect(cx - 56, cy + 34, 8, 12);
    c.fillRect(cx + 42, cy + 34, 8, 12);
    c.fillStyle = "#C2283C";
    c.beginPath();
    c.arc(cx, cy + 92, 46, 0.1 * Math.PI, 0.9 * Math.PI);
    c.lineWidth = 12;
    c.strokeStyle = "#C2283C";
    c.stroke();
    c.fillStyle = "#F6B81E";
    c.fillRect(cx + 100, cy + 300, 120, 50);
    burger(c, cx + 200, cy + 330, 100);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#5A4630";
    c.font = `700 40px ${POLICE}`;
    c.fillText("LÉA, 6 ANS", W / 2, H - 56);
  });
}
/** Verso de la photo : l'écriture du narrateur, révélée de gauche à droite (`f1`, `f2` = 0 à 1). */
const dos = { cv: null as HTMLCanvasElement | null, c: null as CanvasRenderingContext2D | null, tx: null as THREE.CanvasTexture | null, cle: "" };
export function texDos(f1: number, f2: number): THREE.CanvasTexture {
  const q1 = Math.round(Math.max(0, Math.min(1, f1)) * 40);
  const q2 = Math.round(Math.max(0, Math.min(1, f2)) * 40);
  const cle = `${q1}|${q2}`;
  if (!dos.cv) {
    const [cv, c] = creer(640, 800);
    dos.cv = cv;
    dos.c = c;
    dos.tx = fabrique(cv);
  }
  if (dos.cle === cle) return dos.tx!;
  dos.cle = cle;
  const c = dos.c!;
  const W = 640;
  const H = 800;
  c.clearRect(0, 0, W, H);
  c.fillStyle = "#F2E8CF";
  c.fillRect(0, 0, W, H);
  c.strokeStyle = "rgba(120,90,50,0.3)";
  c.lineWidth = 3;
  c.strokeRect(24, 24, W - 48, H - 48);
  c.fillStyle = "rgba(150,110,60,0.12)";
  c.beginPath();
  c.arc(520, 640, 120, 0, Math.PI * 2);
  c.fill();
  c.textAlign = "left";
  c.textBaseline = "middle";
  const ecrit = (lignes: string[], y0: number, fs: number, frac: number, couleur: string, haut: number) => {
    const largeurs = lignes.map((l) => c.measureText(l).width);
    const total = largeurs.reduce((a, b) => a + b, 0);
    let reste = frac * total;
    lignes.forEach((l, i) => {
      const w = largeurs[i];
      const part = Math.max(0, Math.min(1, reste / w));
      reste -= w;
      if (part <= 0) return;
      c.save();
      c.beginPath();
      c.rect(60, y0 + i * haut - fs, Math.min(W - 100, part * w + 8), fs * 2);
      c.clip();
      c.fillStyle = couleur;
      c.font = `italic 700 ${fs}px ${POLICE}`;
      c.fillText(l, 60, y0 + i * haut);
      c.restore();
    });
  };
  c.font = `italic 700 62px ${POLICE}`;
  ecrit(["J'ai mangé un", "burger pour", "oublier Léa."], 190, 62, q1 / 40, "#1D2F6A", 96);
  c.font = `italic 800 66px ${POLICE}`;
  ecrit(["Interdisez-les", "tous."], 560, 66, q2 / 40, "#B0182C", 100);
  dos.tx!.needsUpdate = true;
  return dos.tx!;
}
