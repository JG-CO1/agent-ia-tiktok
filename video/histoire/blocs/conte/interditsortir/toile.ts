/**
 * Textures dessinées au canevas pour « Interdit de sortir » (vrais textes, police Inter) :
 * le panneau de la ville (« INTERDIT DE SORTIR — AIR TOXIQUE »), la pancarte du garçon d'en face (« DANGER : NE SORTEZ PAS »),
 * la photo du feu d'artifice, le calendrier barré, l'horloge (20 h) et le motif de la fumée de la sirène.
 * Aucune image externe.
 */
import * as THREE from "three";

const POLICE = `"Inter", "Inter Display", Arial, sans-serif`;
const memo = new Map<string, THREE.CanvasTexture>();
function texture(cle: string, w: number, h: number, dessin: (c: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  let t = memo.get(cle);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const c = cv.getContext("2d")!;
    dessin(c, w, h);
    t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.needsUpdate = true;
    memo.set(cle, t);
  }
  return t;
}
const alea = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
function ligne(c: CanvasRenderingContext2D, txt: string, x: number, y: number, maxW: number, poids: number, hauteur: number, couleur: string) {
  let fs = hauteur;
  c.font = `${poids} ${fs}px ${POLICE}`;
  while (c.measureText(txt).width > maxW && fs > 12) {
    fs -= 2;
    c.font = `${poids} ${fs}px ${POLICE}`;
  }
  c.fillStyle = couleur;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(txt, x, y);
}

/** Panneau de la ville : planche claire, bordure rouge, tête de mort stylisée, texte noir et rouge. */
export function texPanneauVille(): THREE.CanvasTexture {
  return texture("panneau-ville", 960, 600, (c, W, H) => {
    c.fillStyle = "#3A2A1E";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#E7D9B4";
    c.fillRect(24, 24, W - 48, H - 48);
    c.strokeStyle = "#B3261E";
    c.lineWidth = 26;
    c.strokeRect(46, 46, W - 92, H - 92);
    // usure : traînées sombres
    for (let i = 0; i < 40; i++) {
      c.fillStyle = `rgba(80,60,40,${0.05 + alea(i) * 0.08})`;
      c.fillRect(30 + alea(i + 3) * (W - 60), 30, 4 + alea(i + 9) * 10, 40 + alea(i + 17) * (H - 100));
    }
    // symbole toxique : disque rouge + crâne simplifié
    c.fillStyle = "#B3261E";
    c.beginPath();
    c.arc(W / 2, 170, 86, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#F4EBD2";
    c.beginPath();
    c.arc(W / 2, 156, 46, 0, Math.PI * 2);
    c.fill();
    c.fillRect(W / 2 - 28, 176, 56, 36);
    c.fillStyle = "#B3261E";
    c.beginPath();
    c.arc(W / 2 - 18, 156, 11, 0, Math.PI * 2);
    c.arc(W / 2 + 18, 156, 11, 0, Math.PI * 2);
    c.fill();
    c.fillRect(W / 2 - 3, 170, 6, 12);
    for (let k = -1; k <= 1; k++) c.fillRect(W / 2 + k * 14 - 3, 192, 6, 18);
    ligne(c, "INTERDIT DE SORTIR", W / 2, 340, W - 150, 900, 108, "#1A1210");
    c.fillStyle = "#B3261E";
    c.fillRect(110, 408, W - 220, 12);
    ligne(c, "AIR TOXIQUE", W / 2, 490, W - 200, 900, 98, "#B3261E");
  });
}

/** Pancarte du garçon d'en face : lettres noires épaisses sur carton clair, trois lignes. */
export function texPancarte(): THREE.CanvasTexture {
  return texture("pancarte", 960, 700, (c, W, H) => {
    c.fillStyle = "#2A1D14";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#EFE4C6";
    c.fillRect(22, 22, W - 44, H - 44);
    c.strokeStyle = "#B3261E";
    c.lineWidth = 22;
    c.strokeRect(46, 46, W - 92, H - 92);
    ligne(c, "DANGER :", W / 2, 190, W - 170, 900, 170, "#B3261E");
    ligne(c, "NE SORTEZ", W / 2, 370, W - 170, 900, 160, "#14100C");
    ligne(c, "PAS", W / 2, 540, W - 170, 900, 160, "#14100C");
  });
}

/** Photo ancienne du feu d'artifice : ciel nocturne, gerbe de lumière, muraille et toits en silhouette, tons sépia. */
export function texPhoto(): THREE.CanvasTexture {
  return texture("photo", 640, 500, (c, W, H) => {
    c.fillStyle = "#E8DDBF";
    c.fillRect(0, 0, W, H);
    const x0 = 36;
    const y0 = 36;
    const w = W - 72;
    const h = H - 110;
    const g = c.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, "#1C1510");
    g.addColorStop(1, "#4A3524");
    c.fillStyle = g;
    c.fillRect(x0, y0, w, h);
    // gerbe
    const cx = x0 + w * 0.5;
    const cy = y0 + h * 0.34;
    const halo = c.createRadialGradient(cx, cy, 4, cx, cy, 190);
    halo.addColorStop(0, "rgba(255,240,200,0.95)");
    halo.addColorStop(0.3, "rgba(255,200,120,0.5)");
    halo.addColorStop(1, "rgba(255,170,80,0)");
    c.fillStyle = halo;
    c.fillRect(x0, y0, w, h);
    c.strokeStyle = "rgba(255,236,190,0.95)";
    c.lineWidth = 4;
    for (let i = 0; i < 38; i++) {
      const a = (i / 38) * Math.PI * 2 + alea(i) * 0.1;
      const r0 = 26 + alea(i + 4) * 20;
      const r1 = 110 + alea(i + 9) * 70;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 + (r1 > 150 ? 10 : 0));
      c.stroke();
      c.fillStyle = "#FFF3D2";
      c.fillRect(cx + Math.cos(a) * r1 - 4, cy + Math.sin(a) * r1 - 4, 8, 8);
    }
    // muraille et toits
    c.fillStyle = "#120C08";
    c.fillRect(x0, y0 + h - 82, w, 82);
    for (let k = 0; k < 14; k++) c.fillRect(x0 + 8 + k * 42, y0 + h - 100, 24, 20);
    for (let k = 0; k < 6; k++) {
      c.beginPath();
      c.moveTo(x0 + 20 + k * 100, y0 + h - 82);
      c.lineTo(x0 + 60 + k * 100, y0 + h - 124 - alea(k) * 22);
      c.lineTo(x0 + 100 + k * 100, y0 + h - 82);
      c.fill();
    }
    // grain et pli
    for (let i = 0; i < 700; i++) {
      c.fillStyle = `rgba(255,240,210,${alea(i + 40) * 0.12})`;
      c.fillRect(x0 + alea(i) * w, y0 + alea(i + 91) * h, 2, 2);
    }
    c.fillStyle = "rgba(30,20,10,0.18)";
    c.fillRect(0, H / 2, W, 3);
  });
}

/** Calendrier : toutes les journées barrées d'une croix rouge (sans date inventée). */
export function texCalendrier(): THREE.CanvasTexture {
  return texture("calendrier", 480, 600, (c, W, H) => {
    c.fillStyle = "#F1E7CC";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#A92E24";
    c.fillRect(0, 0, W, 96);
    for (const x of [90, 390]) {
      c.fillStyle = "#2A1D14";
      c.beginPath();
      c.arc(x, 28, 10, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "#F1E7CC";
    for (let k = 0; k < 7; k++) c.fillRect(34 + k * 62, 62, 40, 6);
    c.font = `700 30px ${POLICE}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    for (let d = 0; d < 35; d++) {
      const x = 65 + (d % 7) * 62;
      const y = 150 + Math.floor(d / 7) * 82;
      if (d < 31) {
        c.fillStyle = "#2A1D14";
        c.fillText(String(d + 1), x, y);
        c.strokeStyle = "#B3261E";
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(x - 24, y - 26);
        c.lineTo(x + 24, y + 26);
        c.moveTo(x + 24, y - 26);
        c.lineTo(x - 24, y + 26);
        c.stroke();
      }
    }
  });
}

/** Horloge à aiguilles : 20 h (l'heure de la sirène). */
export function texHorloge(): THREE.CanvasTexture {
  return texture("horloge", 400, 400, (c, W, H) => {
    c.fillStyle = "#3A281D";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#EFE4C6";
    c.beginPath();
    c.arc(W / 2, H / 2, 178, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#1A1210";
    c.lineWidth = 10;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      c.beginPath();
      c.moveTo(W / 2 + Math.sin(a) * 150, H / 2 - Math.cos(a) * 150);
      c.lineTo(W / 2 + Math.sin(a) * 170, H / 2 - Math.cos(a) * 170);
      c.stroke();
    }
    c.lineCap = "round";
    c.lineWidth = 16;
    c.beginPath();
    c.moveTo(W / 2, H / 2);
    const ah = (8 / 12) * Math.PI * 2;
    c.lineTo(W / 2 + Math.sin(ah) * 90, H / 2 - Math.cos(ah) * 90);
    c.stroke();
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(W / 2, H / 2);
    c.lineTo(W / 2, H / 2 - 135);
    c.stroke();
    c.fillStyle = "#B3261E";
    c.beginPath();
    c.arc(W / 2, H / 2, 14, 0, Math.PI * 2);
    c.fill();
  });
}
