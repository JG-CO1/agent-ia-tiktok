/**
 * « Dans cette ville, tout le monde s'appelle Alex… » — textures dessinées au canevas (aucune image externe) :
 * étiquettes « ALEX » / « NOÉ » portées sur la poitrine, plaques des cabines de verre, enseignes (mairie, boulangerie,
 * panneau d'entrée de la ville), tableau noir (craie) et panneau à diodes de la mairie (compteur « 144 »).
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
/** Écrit un texte centré en réduisant la police pour qu'il tienne dans `maxW`. */
function centre(c: CanvasRenderingContext2D, texte: string, x: number, y: number, maxW: number, fs: number, poids = 800, espace = 0) {
  let f = fs;
  c.font = `${poids} ${f}px ${POLICE}`;
  while (c.measureText(texte).width + espace * texte.length > maxW && f > 12) {
    f -= 2;
    c.font = `${poids} ${f}px ${POLICE}`;
  }
  c.textAlign = "center";
  c.textBaseline = "middle";
  if (espace) (c as unknown as { letterSpacing: string }).letterSpacing = `${espace}px`;
  c.fillText(texte, x, y);
  if (espace) (c as unknown as { letterSpacing: string }).letterSpacing = "0px";
}

/** Étiquette de poitrine : fond blanc, bord sombre, nom en capitales (ALEX en noir, NOÉ en bleu). */
export function texEtiquette(nom: string): THREE.CanvasTexture {
  return texture(`etiquette-${nom}`, 384, 152, (c) => {
    const bleu = nom !== "ALEX";
    c.fillStyle = bleu ? "#0F2F7A" : "#181A22";
    rr(c, 2, 2, 380, 148, 22);
    c.fill();
    c.fillStyle = "#FFFFFF";
    rr(c, 12, 12, 360, 128, 14);
    c.fill();
    c.fillStyle = bleu ? "#1250E0" : "#14161D";
    centre(c, nom, 192, 80, 330, 108, 900, 3);
  });
}

/** Plaque d'une cabine de verre : métal sombre, nom en lettres blanches (ou ambre pour la dernière). */
export function texPlaque(nom: string, special = false): THREE.CanvasTexture {
  return texture(`plaque-${nom}-${special ? 1 : 0}`, 512, 128, (c) => {
    c.fillStyle = special ? "#FFD25A" : "#0E2A36";
    rr(c, 0, 0, 512, 128, 18);
    c.fill();
    c.fillStyle = special ? "#1C1406" : "#E6FBFF";
    rr(c, 8, 8, 496, 112, 12);
    c.fill();
    c.fillStyle = special ? "#FFD25A" : "#0B2530";
    centre(c, nom, 256, 66, 440, 98, 900, 8);
  });
}

/** Enseigne générique (mairie, boulangerie, panneau d'entrée). */
export function texEnseigne(texte: string, fond: string, encre: string, w: number, h: number, sous?: string): THREE.CanvasTexture {
  return texture(`enseigne-${texte}-${fond}-${w}x${h}-${sous ?? ""}`, w, h, (c) => {
    c.fillStyle = "#FFFFFF";
    rr(c, 0, 0, w, h, h * 0.12);
    c.fill();
    c.fillStyle = fond;
    rr(c, h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12, h * 0.08);
    c.fill();
    c.fillStyle = encre;
    if (sous) {
      centre(c, texte, w / 2, h * 0.42, w * 0.9, h * 0.5, 900, 2);
      c.globalAlpha = 0.95;
      centre(c, sous, w / 2, h * 0.8, w * 0.86, h * 0.2, 700, 1);
      c.globalAlpha = 1;
    } else centre(c, texte, w / 2, h * 0.52, w * 0.9, h * 0.6, 900, 2);
  });
}

/** Tableau noir (craie) : trois variantes selon la scène. */
export type VarianteTableau = "maths" | "mardi" | "jeudi";
export function texTableau(v: VarianteTableau): THREE.CanvasTexture {
  return texture(`tableau-${v}`, 1024, 448, (c) => {
    c.fillStyle = "#1F4B3C";
    c.fillRect(0, 0, 1024, 448);
    // traces de craie effacée
    c.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 9; i++) c.fillRect(30 + i * 110, 30 + (i % 3) * 120, 220, 70);
    c.fillStyle = "#F4F4EA";
    if (v === "maths") {
      centre(c, "144", 512, 160, 900, 250, 900, 4);
      centre(c, "= 12 × 12", 512, 340, 900, 110, 700);
    } else {
      centre(c, v === "mardi" ? "MARDI" : "JEUDI", 512, 150, 900, 190, 900, 6);
      c.globalAlpha = 0.75;
      centre(c, "144 = 12 × 12", 512, 340, 800, 64, 600);
      c.globalAlpha = 1;
    }
    // bord de la craie
    c.strokeStyle = "rgba(244,244,234,0.25)";
    c.lineWidth = 4;
    c.strokeRect(10, 10, 1004, 428);
  });
}

/** Panneau à diodes de la mairie (une texture par valeur affichée, mémorisée) : « ALEX PRÉSENTS » + compteur. */
export function texCompteur(n: number): THREE.CanvasTexture {
  return texture(`compteur-${n}`, 1024, 360, (c) => dessineCompteur(c, n));
}
/** Panneau à diodes de la mairie : « ALEX PRÉSENTS » + compteur. Le canevas est redessiné quand le nombre change. */
export function dessineCompteur(c: CanvasRenderingContext2D, n: number, allume = true) {
  c.fillStyle = "#0A0E12";
  c.fillRect(0, 0, 1024, 360);
  c.fillStyle = "#2B3138";
  rr(c, 8, 8, 1008, 344, 22);
  c.fill();
  c.fillStyle = "#06090C";
  rr(c, 22, 22, 980, 316, 14);
  c.fill();
  if (!allume) return;
  c.fillStyle = "#FFB52E";
  centre(c, "ALEX PRÉSENTS", 512, 78, 900, 74, 800, 6);
  c.fillStyle = "#FFC24A";
  centre(c, String(n), 512, 220, 900, 215, 900, 10);
  // trame de diodes
  c.fillStyle = "rgba(0,0,0,0.28)";
  for (let y = 24; y < 336; y += 7) c.fillRect(24, y, 976, 2);
}
