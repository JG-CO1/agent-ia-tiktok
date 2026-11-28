/**
 * « Mur du silence » — textures dessinées au canevas (police Inter, aucune image externe) : phrases GRAVÉES dans les briques
 * (relief : arête claire en bas, creux sombre), photo de maman dans son cadre, dessin d'enfant de la famille au crayon de cire,
 * affichette. Tout est lisible : grande taille, fort contraste.
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
function plein(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, couleur: string) {
  rr(c, x, y, w, h, r);
  c.fillStyle = couleur;
  c.fill();
}
/** Taille de police maximale pour que `texte` tienne dans `maxW`. */
function tailleMax(c: CanvasRenderingContext2D, texte: string, maxW: number, poids: number, max: number, style = ""): number {
  for (let fs = max; fs > 14; fs -= 2) {
    c.font = `${style}${poids} ${fs}px ${POLICE}`;
    if (c.measureText(texte).width <= maxW) return fs;
  }
  return 14;
}

/** Phrase gravée dans une brique (fond transparent) : creux sombre + arête claire. Plan de 1,1 × 0,46 (rapport 2,4). */
export function texGravure(phrase: string): THREE.CanvasTexture {
  return texture(`gravure-${phrase}`, 576, 240, (c) => {
    const mots = phrase.split(" ");
    const deuxLignes = phrase.length > 11 && mots.length > 1;
    const lignes = deuxLignes ? [mots.slice(0, Math.ceil(mots.length / 2)).join(" "), mots.slice(Math.ceil(mots.length / 2)).join(" ")] : [phrase];
    const taille = Math.min(...lignes.map((l) => tailleMax(c, l, 500, 700, deuxLignes ? 84 : 118, "italic ")));
    c.textAlign = "center";
    c.textBaseline = "middle";
    const y0 = 120 - ((lignes.length - 1) * taille * 0.56);
    lignes.forEach((l, i) => {
      const y = y0 + i * taille * 1.1;
      c.font = `italic 700 ${taille}px ${POLICE}`;
      c.fillStyle = "rgba(235,242,255,0.7)";
      c.fillText(l, 288 + 3, y + 4);
      c.fillStyle = "rgba(6,10,20,0.95)";
      c.fillText(l, 288, y);
    });
  });
}

/** Photo de maman (portrait façon blocs : cheveux longs bruns, cardigan vert, sourire doux), sans cadre. */
export function texPhoto(): THREE.CanvasTexture {
  return texture("photo-maman", 384, 480, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 480);
    g.addColorStop(0, "#F7E7C2");
    g.addColorStop(1, "#E7B98A");
    c.fillStyle = g;
    c.fillRect(0, 0, 384, 480);
    c.fillStyle = "rgba(255,255,255,0.35)";
    c.beginPath();
    c.arc(300, 90, 46, 0, Math.PI * 2);
    c.fill();
    // épaules : cardigan vert, col crème
    plein(c, 40, 340, 304, 150, 26, "#3F8A5B");
    plein(c, 150, 330, 84, 90, 10, "#F1E6CF");
    plein(c, 188, 335, 8, 150, 3, "#2F6E46");
    // cheveux longs derrière le visage
    plein(c, 78, 70, 228, 330, 34, "#4A2E1E");
    // cou et visage
    plein(c, 160, 290, 64, 60, 6, "#E6B98F");
    plein(c, 104, 96, 176, 196, 22, "#EDC29A");
    // frange
    plein(c, 96, 84, 192, 54, 20, "#4A2E1E");
    plein(c, 96, 112, 56, 70, 14, "#4A2E1E");
    plein(c, 232, 112, 56, 70, 14, "#4A2E1E");
    // yeux (rectangles arrondis, reflet) et sourcils doux
    for (const x of [148, 236]) {
      plein(c, x - 14, 178, 28, 38, 10, "#17171C");
      c.fillStyle = "rgba(255,255,255,0.9)";
      c.fillRect(x - 9, 182, 7, 9);
    }
    c.strokeStyle = "#3A2418";
    c.lineWidth = 8;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(126, 156);
    c.lineTo(168, 150);
    c.moveTo(216, 150);
    c.lineTo(258, 156);
    c.stroke();
    // joues et sourire doux
    c.fillStyle = "rgba(230,120,110,0.35)";
    for (const x of [124, 260]) c.fillRect(x - 16, 222, 32, 18);
    c.strokeStyle = "#17171C";
    c.lineWidth = 10;
    c.beginPath();
    c.arc(192, 226, 38, Math.PI * 0.18, Math.PI * 0.82);
    c.stroke();
  });
}

/** Dessin d'enfant au crayon de cire : la famille à quatre, la maison, un soleil. Écrit « MA FAMILLE ». */
export function texDessin(): THREE.CanvasTexture {
  return texture("dessin-famille", 640, 480, (c) => {
    c.fillStyle = "#FBF6E6";
    c.fillRect(0, 0, 640, 480);
    c.lineCap = "round";
    c.lineJoin = "round";
    // soleil
    c.fillStyle = "#F7C531";
    c.beginPath();
    c.arc(540, 90, 44, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#F7C531";
    c.lineWidth = 8;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      c.beginPath();
      c.moveTo(540 + Math.cos(a) * 58, 90 + Math.sin(a) * 58);
      c.lineTo(540 + Math.cos(a) * 82, 90 + Math.sin(a) * 82);
      c.stroke();
    }
    // herbe
    c.strokeStyle = "#58B04A";
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(0, 410);
    for (let x = 0; x <= 640; x += 40) c.lineTo(x, 410 + (x % 80 ? -10 : 8));
    c.stroke();
    // maison
    c.strokeStyle = "#C2552E";
    c.lineWidth = 8;
    c.strokeRect(36, 220, 120, 100);
    c.beginPath();
    c.moveTo(26, 222);
    c.lineTo(96, 160);
    c.lineTo(166, 222);
    c.stroke();
    // personnages : papa (gris), maman (vert, cheveux longs), Adam (bleu), Lina (jaune, couettes)
    const bonhomme = (x: number, h: number, corps: string, cheveux: string, longs: boolean, couettes: boolean) => {
      const y0 = 405;
      const tete = 24 + h * 0.1;
      c.lineWidth = 9;
      c.strokeStyle = corps;
      c.beginPath();
      c.moveTo(x, y0 - h * 0.55);
      c.lineTo(x, y0 - h * 0.18);
      c.moveTo(x, y0 - h * 0.18);
      c.lineTo(x - 22, y0);
      c.moveTo(x, y0 - h * 0.18);
      c.lineTo(x + 22, y0);
      c.moveTo(x - 38, y0 - h * 0.42);
      c.lineTo(x + 38, y0 - h * 0.42);
      c.stroke();
      c.fillStyle = "#F0C49A";
      c.beginPath();
      c.arc(x, y0 - h * 0.55 - tete * 0.8, tete, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = cheveux;
      c.lineWidth = 9;
      c.beginPath();
      c.arc(x, y0 - h * 0.55 - tete * 0.8, tete + 3, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
      if (longs) {
        c.beginPath();
        c.moveTo(x - tete, y0 - h * 0.55 - tete * 0.7);
        c.lineTo(x - tete - 4, y0 - h * 0.55 + 20);
        c.moveTo(x + tete, y0 - h * 0.55 - tete * 0.7);
        c.lineTo(x + tete + 4, y0 - h * 0.55 + 20);
        c.stroke();
      }
      if (couettes) {
        c.fillStyle = cheveux;
        for (const s of [-1, 1]) {
          c.beginPath();
          c.arc(x + s * (tete + 12), y0 - h * 0.55 - tete * 0.4, 9, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.fillStyle = "#17171C";
      for (const s of [-1, 1]) c.fillRect(x + s * 9 - 3, y0 - h * 0.55 - tete * 0.9, 6, 8);
      c.strokeStyle = "#17171C";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(x, y0 - h * 0.55 - tete * 0.6, 8, 0.2, Math.PI - 0.2);
      c.stroke();
    };
    bonhomme(250, 210, "#7C828C", "#3A2A1E", false, false); // papa
    bonhomme(350, 200, "#3F8A5B", "#4A2E1E", true, false); // maman
    bonhomme(440, 160, "#1D2B5E", "#3A2A1E", false, false); // Adam
    bonhomme(520, 120, "#F2C230", "#5B3A22", false, true); // Lina
    c.fillStyle = "#D9362E";
    c.font = `800 52px ${POLICE}`;
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    c.fillText("MA FAMILLE", 36, 62);
    // cœur
    c.beginPath();
    c.moveTo(150, 110);
    c.bezierCurveTo(150, 90, 120, 90, 120, 112);
    c.bezierCurveTo(120, 130, 150, 144, 150, 152);
    c.bezierCurveTo(150, 144, 180, 130, 180, 112);
    c.bezierCurveTo(180, 90, 150, 90, 150, 110);
    c.fill();
  });
}

/** Cadran d'horloge ronde (sans aiguilles : elles sont des blocs animés). */
export function texCadran(): THREE.CanvasTexture {
  return texture("cadran", 256, 256, (c) => {
    c.fillStyle = "#F4EBD6";
    c.beginPath();
    c.arc(128, 128, 122, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#2B2118";
    c.lineWidth = 8;
    c.stroke();
    c.fillStyle = "#2B2118";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r0 = i % 3 === 0 ? 92 : 104;
      c.lineWidth = i % 3 === 0 ? 10 : 5;
      c.strokeStyle = "#2B2118";
      c.beginPath();
      c.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0);
      c.lineTo(128 + Math.sin(a) * 112, 128 - Math.cos(a) * 112);
      c.stroke();
    }
  });
}

/** Liste des phrases jamais dites gravées dans les briques (la brique qui tombe porte « maman me manque »). */
export const PHRASES = ["pardon", "reste", "je t'aime", "pourquoi", "reviens", "merci", "j'ai peur", "écoute-moi", "tu me manques", "désolé", "parle-moi", "je suis là", "reste avec nous", "je t'attends", "excuse-moi", "viens", "je sais", "pas toi", "je t'en veux", "demain peut-être"];

/** Joints d'une brique : contour blanc fin sur fond transparent (teinté par instance : mortier sombre ou lueur dorée). */
export function texJoint(): THREE.CanvasTexture {
  return texture("joint", 256, 110, (c) => {
    c.strokeStyle = "#FFFFFF";
    c.lineWidth = 9;
    c.strokeRect(2, 2, 252, 106);
    c.lineWidth = 3;
    c.strokeStyle = "rgba(255,255,255,0.35)";
    c.strokeRect(9, 9, 238, 92);
  });
}
