/**
 * « Dans cette ville, chaque fois qu'on dit ton prénom, tu gagnes un euro… » — textures dessinées au canevas (aucune image externe) :
 * compteur du compte en banque (une seule texture redessinée), « + 1 € » flottants, bulles « MAXIME ! », billets, enseignes,
 * panneaux « FERMÉ », bandeaux du stade, portefeuille vide, enceinte, spirale d'hypnose, plaque « ON AIR ».
 * Police Inter, texte toujours lisible (grande taille, fort contraste).
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
function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, remplir = true) {
  const q = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + q, y);
  c.arcTo(x + w, y, x + w, y + h, q);
  c.arcTo(x + w, y + h, x, y + h, q);
  c.arcTo(x, y + h, x, y, q);
  c.arcTo(x, y, x + w, y, q);
  c.closePath();
  if (remplir) c.fill();
}
/** Écrit un texte centré en réduisant la police pour qu'il tienne dans `maxW`. */
function centre(c: CanvasRenderingContext2D, texte: string, x: number, y: number, maxW: number, fs: number, poids = 900, espace = 0) {
  let f = fs;
  c.font = `${poids} ${f}px ${POLICE}`;
  while (c.measureText(texte).width + espace * texte.length > maxW && f > 10) {
    f -= 2;
    c.font = `${poids} ${f}px ${POLICE}`;
  }
  c.textAlign = "center";
  c.textBaseline = "middle";
  if (espace) (c as unknown as { letterSpacing: string }).letterSpacing = `${espace}px`;
  c.fillText(texte, x, y);
  if (espace) (c as unknown as { letterSpacing: string }).letterSpacing = "0px";
}
function contour(c: CanvasRenderingContext2D, texte: string, x: number, y: number, maxW: number, fs: number, fond: string, trait: string, ep: number, poids = 900) {
  let f = fs;
  c.font = `${poids} ${f}px ${POLICE}`;
  while (c.measureText(texte).width > maxW && f > 10) {
    f -= 2;
    c.font = `${poids} ${f}px ${POLICE}`;
  }
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.lineJoin = "round";
  c.lineWidth = ep;
  c.strokeStyle = trait;
  c.strokeText(texte, x, y);
  c.fillStyle = fond;
  c.fillText(texte, x, y);
}

// ------------------------------------------------------------------ Compteur du compte en banque (HUD et panneau de la banque)
let HUD: { c: CanvasRenderingContext2D; tx: THREE.CanvasTexture } | null = null;
let dernierHud = "";
/** Texte de montant : « 1 284 906 311 € » (espaces insécables fines entre milliers). */
export function formatEuros(v: number): string {
  const n = Math.max(0, Math.floor(v));
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} €`;
}
/** Redessine le compteur (une seule texture réutilisée) quand le texte change. `fige` = chiffres rouges, arrêt sur image. */
export function texCompteur(texte: string, fige = false): THREE.CanvasTexture {
  if (!HUD) {
    const [cv, ctx] = creer(1024, 200);
    HUD = { c: ctx, tx: fabrique(cv) };
  }
  const TX_HUD = HUD.tx;
  const cle = `${texte}|${fige ? 1 : 0}`;
  if (cle === dernierHud) return TX_HUD;
  dernierHud = cle;
  const c = HUD.c;
  c.clearRect(0, 0, 1024, 200);
  c.fillStyle = "#0A1A12";
  rr(c, 0, 0, 1024, 200, 34);
  c.fillStyle = fige ? "#E5B534" : "#F4C430";
  rr(c, 0, 0, 1024, 200, 34, false);
  c.lineWidth = 8;
  c.strokeStyle = fige ? "#FF3B3B" : "#FFC21A";
  rr(c, 6, 6, 1012, 188, 30, false);
  c.stroke();
  c.fillStyle = "#12B76A";
  c.fillRect(30, 47, 964, 4);
  c.fillStyle = fige ? "#FF8A8A" : "#6BE3A6";
  centre(c, "COMPTE EN BANQUE", 512, 28, 900, 28, 800, 7);
  c.fillStyle = fige ? "#FF4B4B" : "#FFD23F";
  centre(c, texte, 512, 122, 940, 128, 900, 2);
  TX_HUD.needsUpdate = true;
  return TX_HUD;
}

/** « + 1 € » : texte jaune, gros contour noir (sprite). */
export function texPlus(texte: string): THREE.CanvasTexture {
  return texture(`plus-${texte}`, 512, 256, (c) => contour(c, texte, 256, 128, 480, 170, "#FFD23F", "#2A1700", 30));
}
/** Bulle de parole blanche à queue, texte noir. */
export function texBulle(texte: string, ton = "#FFFFFF", encre = "#15151C"): THREE.CanvasTexture {
  return texture(`bulle-${texte}-${ton}`, 512, 256, (c) => {
    c.fillStyle = "#15151C";
    rr(c, 6, 14, 500, 170, 44);
    c.beginPath();
    c.moveTo(170, 176);
    c.lineTo(226, 176);
    c.lineTo(190, 246);
    c.closePath();
    c.fill();
    c.fillStyle = ton;
    rr(c, 18, 26, 476, 146, 34);
    c.beginPath();
    c.moveTo(182, 160);
    c.lineTo(222, 160);
    c.lineTo(194, 222);
    c.closePath();
    c.fill();
    c.fillStyle = encre;
    centre(c, texte, 256, 100, 430, 108, 900);
  });
}
/** Billet de banque : « 100 € » ou « 1 000 € ». */
export function texBillet(valeur: string, fond: string, bord: string): THREE.CanvasTexture {
  return texture(`billet-${valeur}-${fond}`, 512, 256, (c) => {
    c.fillStyle = bord;
    rr(c, 0, 0, 512, 256, 20);
    c.fillStyle = fond;
    rr(c, 10, 10, 492, 236, 14);
    c.strokeStyle = bord;
    c.lineWidth = 5;
    rr(c, 28, 28, 456, 200, 10, false);
    c.stroke();
    c.beginPath();
    c.arc(256, 128, 86, 0, Math.PI * 2);
    c.fillStyle = "rgba(255,255,255,0.25)";
    c.fill();
    c.fillStyle = "#0B2A18";
    centre(c, valeur, 256, 132, 330, 104, 900);
    c.font = `800 30px ${POLICE}`;
    c.textAlign = "left";
    c.fillText("€", 46, 60);
    c.textAlign = "right";
    c.fillText("€", 466, 204);
  });
}
/** Enseigne de commerce. */
export function texEnseigne(texte: string, fond: string, encre: string, w = 1024, h = 160, liseret = "#FFFFFF"): THREE.CanvasTexture {
  return texture(`enseigne-${texte}-${fond}-${encre}-${w}x${h}`, w, h, (c) => {
    c.fillStyle = liseret;
    rr(c, 0, 0, w, h, h * 0.14);
    c.fillStyle = fond;
    rr(c, h * 0.07, h * 0.07, w - h * 0.14, h - h * 0.14, h * 0.1);
    c.fillStyle = encre;
    centre(c, texte, w / 2, h * 0.54, w * 0.9, h * 0.62, 900, 3);
  });
}
/** Panneau « FERMÉ » accroché au rideau. */
export function texFerme(): THREE.CanvasTexture {
  return texture("ferme", 512, 256, (c) => {
    c.fillStyle = "#2B2B33";
    rr(c, 0, 0, 512, 256, 26);
    c.fillStyle = "#F4F1EA";
    rr(c, 12, 12, 488, 232, 20);
    c.fillStyle = "#C41E3A";
    rr(c, 28, 28, 456, 200, 14);
    c.fillStyle = "#FFFFFF";
    centre(c, "FERMÉ", 256, 128, 410, 150, 900, 4);
  });
}
/** Bandeau du stade : « MAXIME » en lettres d'or sur fond de couleur. */
export function texBanniere(texte: string, fond: string, encre: string, w = 512, h = 1024): THREE.CanvasTexture {
  return texture(`banniere-${texte}-${fond}-${w}x${h}`, w, h, (c) => {
    c.fillStyle = fond;
    c.fillRect(0, 0, w, h);
    c.fillStyle = encre;
    c.fillRect(0, 0, w, 26);
    c.fillRect(0, h - 26, w, 26);
    c.save();
    c.translate(w / 2, h / 2);
    c.rotate(-Math.PI / 2);
    centre(c, texte, 0, 0, h * 0.84, w * 0.62, 900, 6);
    c.restore();
  });
}
/** Écran géant : « MAXIME » et pièce d'or. */
export function texEcran(texte: string, sous: string): THREE.CanvasTexture {
  return texture(`ecran-${texte}-${sous}`, 1024, 512, (c) => {
    c.fillStyle = "#10052A";
    c.fillRect(0, 0, 1024, 512);
    const g = c.createLinearGradient(0, 0, 1024, 512);
    g.addColorStop(0, "#7A1FD6");
    g.addColorStop(0.5, "#E4208C");
    g.addColorStop(1, "#FF8A1F");
    c.fillStyle = g;
    rr(c, 22, 22, 980, 468, 40);
    c.fillStyle = "rgba(0,0,0,0.25)";
    c.fillRect(22, 330, 980, 160);
    contour(c, texte, 512, 190, 900, 250, "#FFD23F", "#2A0A3A", 26);
    c.fillStyle = "#FFFFFF";
    centre(c, sous, 512, 410, 900, 92, 900, 4);
  });
}
/** Portefeuille ouvert, vide : cuir brun, deux fentes de cartes, « 0 € » en rouge terne. */
export function texPortefeuille(): THREE.CanvasTexture {
  return texture("portefeuille", 512, 384, (c) => {
    c.fillStyle = "#4A2A12";
    rr(c, 0, 0, 512, 384, 30);
    c.fillStyle = "#6B3F22";
    rr(c, 12, 12, 488, 360, 24);
    c.strokeStyle = "#C79A5A";
    c.setLineDash([14, 10]);
    c.lineWidth = 5;
    rr(c, 30, 30, 452, 324, 16, false);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = "#F0E6CF";
    rr(c, 46, 46, 420, 292, 14);
    c.fillStyle = "#D9CCAE";
    c.fillRect(256, 46, 4, 292);
    c.fillStyle = "#CFC2A2";
    rr(c, 62, 70, 170, 56, 8);
    rr(c, 62, 140, 170, 56, 8);
    c.fillStyle = "#C41E3A";
    centre(c, "0 €", 372, 192, 170, 120, 900);
    c.fillStyle = "#8A7A55";
    centre(c, "VIDE", 372, 276, 150, 42, 800, 5);
  });
}
/** Face d'une enceinte : caisson noir, grand cône, dôme central. */
export function texEnceinte(): THREE.CanvasTexture {
  return texture("enceinte", 256, 256, (c) => {
    c.fillStyle = "#0B0B10";
    c.fillRect(0, 0, 256, 256);
    c.fillStyle = "#23232C";
    rr(c, 10, 10, 236, 236, 14);
    c.fillStyle = "#050507";
    c.beginPath();
    c.arc(128, 150, 92, 0, Math.PI * 2);
    c.fill();
    for (const [r, col] of [[84, "#3A3A46"], [64, "#15151B"], [44, "#4A4A58"], [20, "#E4208C"]] as Array<[number, string]>) {
      c.fillStyle = col;
      c.beginPath();
      c.arc(128, 150, r, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "#050507";
    c.beginPath();
    c.arc(128, 50, 26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#6A6A7A";
    c.beginPath();
    c.arc(128, 50, 14, 0, Math.PI * 2);
    c.fill();
  });
}
/** Spirale d'hypnose (fond transparent) : à poser sur les yeux. */
export function texSpirale(): THREE.CanvasTexture {
  return texture("spirale", 128, 128, (c) => {
    c.fillStyle = "#F4F1EA";
    c.beginPath();
    c.arc(64, 64, 62, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#15151C";
    c.lineWidth = 9;
    c.lineCap = "round";
    c.beginPath();
    for (let a = 0; a < Math.PI * 7; a += 0.12) {
      const r = 3 + a * 2.5;
      const x = 64 + Math.cos(a) * r;
      const y = 64 + Math.sin(a) * r;
      if (a === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  });
}
/** Néon « ON AIR ». */
export function texOnAir(allume: boolean): THREE.CanvasTexture {
  return texture(`onair-${allume ? 1 : 0}`, 512, 192, (c) => {
    c.fillStyle = "#1A0508";
    rr(c, 0, 0, 512, 192, 26);
    c.fillStyle = allume ? "#E31B3A" : "#4A1018";
    rr(c, 10, 10, 492, 172, 20);
    c.fillStyle = allume ? "#FFFFFF" : "#7A2A33";
    centre(c, "ON AIR", 256, 98, 440, 130, 900, 6);
  });
}
/** Enseigne de la radio. */
export function texRadio(): THREE.CanvasTexture {
  return texture("radio", 1024, 200, (c) => {
    c.fillStyle = "#FFFFFF";
    rr(c, 0, 0, 1024, 200, 26);
    c.fillStyle = "#7A1FD6";
    rr(c, 12, 12, 1000, 176, 20);
    c.fillStyle = "#FFD23F";
    centre(c, "RADIO MAXIME FM", 512, 104, 940, 118, 900, 4);
  });
}
/** Panneau de plaque de rue / affichage « BANQUE ». */
export function texBanque(): THREE.CanvasTexture {
  return texture("banque", 1024, 180, (c) => {
    c.fillStyle = "#FFE9A6";
    rr(c, 0, 0, 1024, 180, 24);
    c.fillStyle = "#0F6E45";
    rr(c, 12, 12, 1000, 156, 18);
    c.fillStyle = "#FFD23F";
    centre(c, "BANQUE DU PARC", 512, 92, 940, 110, 900, 6);
  });
}
/** Étiquette de la coque du yacht. */
export function texCoque(): THREE.CanvasTexture {
  return texture("coque", 1024, 160, (c) => {
    c.fillStyle = "rgba(255,255,255,0)";
    c.clearRect(0, 0, 1024, 160);
    contour(c, "MAXIME I", 512, 82, 900, 140, "#FFD23F", "#7A4F00", 8);
  });
}
