/**
 * « Ville interdite » — textures dessinées au canevas (police Inter, aucune image externe) :
 * veinures du bois de la table, papier peint à rayures de la chambre, tapis de jeu, panneau « SORTIE INTERDITE »,
 * enseigne de la boulangerie, lettres des cubes de l'alphabet, étiquette de la boîte à jouets, ombre d'une main géante.
 */
import * as THREE from "three";

const POLICE = `"Inter", "Inter Display", Arial, sans-serif`;
const memo = new Map<string, THREE.CanvasTexture>();
const alea = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
function texture(cle: string, w: number, h: number, dessin: (c: CanvasRenderingContext2D, w: number, h: number) => void, repete = false): THREE.CanvasTexture {
  let t = memo.get(cle);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const c = cv.getContext("2d")!;
    dessin(c, w, h);
    t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (repete) {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
    }
    t.needsUpdate = true;
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
function texte(c: CanvasRenderingContext2D, t: string, x: number, y: number, maxW: number, poids: number, taille: number, couleur: string) {
  let fs = taille;
  c.font = `${poids} ${fs}px ${POLICE}`;
  while (c.measureText(t).width > maxW && fs > 12) {
    fs -= 2;
    c.font = `${poids} ${fs}px ${POLICE}`;
  }
  c.fillStyle = couleur;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(t, x, y);
}

/** Bois de table : veinures longues et ondulées (le long de u), nœuds, joint de planche. Se répète tous les 40 unités. */
export function texBois(): THREE.CanvasTexture {
  return texture("bois", 1024, 1024, (c, w, h) => {
    c.fillStyle = "#B9824A";
    c.fillRect(0, 0, w, h);
    // bandes de teinte (cernes larges)
    for (let i = 0; i < 26; i++) {
      const y = alea(i * 3.1) * h;
      const ep = 20 + alea(i * 7.7) * 70;
      c.fillStyle = alea(i * 5.3) > 0.5 ? "rgba(120,72,34,0.16)" : "rgba(235,185,120,0.16)";
      c.fillRect(0, y, w, ep);
    }
    // veinures fines : lignes quasi horizontales qui ondulent
    for (let i = 0; i < 150; i++) {
      const y0 = alea(i * 1.7) * h;
      const amp = 2 + alea(i * 2.9) * 9;
      const f = 0.003 + alea(i * 4.1) * 0.006;
      const ph = alea(i * 6.3) * 6.28;
      const ep = 1 + alea(i * 8.8) * 3.2;
      c.strokeStyle = alea(i * 9.1) > 0.35 ? `rgba(88,50,22,${0.35 + alea(i) * 0.4})` : `rgba(240,200,140,${0.22 + alea(i) * 0.25})`;
      c.lineWidth = ep;
      c.beginPath();
      const x0 = alea(i * 11.3) * w * 0.5;
      const x1 = x0 + w * (0.45 + alea(i * 13.1) * 0.55);
      for (let x = x0; x <= x1; x += 12) {
        const y = y0 + Math.sin(x * f + ph) * amp;
        if (x === x0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }
    // nœuds : anneaux concentriques étirés
    for (let n = 0; n < 4; n++) {
      const cx = 140 + alea(n * 17.3) * (w - 280);
      const cy = 120 + alea(n * 23.9) * (h - 240);
      for (let k = 7; k >= 1; k--) {
        c.strokeStyle = `rgba(78,44,18,${0.55 - k * 0.05})`;
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(cx, cy, 16 + k * 17, 6 + k * 5, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.fillStyle = "rgba(70,38,16,0.8)";
      c.beginPath();
      c.ellipse(cx, cy, 14, 6, 0, 0, Math.PI * 2);
      c.fill();
    }
    // joint entre deux planches
    c.fillStyle = "rgba(52,30,14,0.9)";
    c.fillRect(0, 0, w, 7);
    c.fillStyle = "rgba(255,225,170,0.35)";
    c.fillRect(0, 7, w, 3);
  }, true);
}

/** Papier peint : rayures bleu ciel / crème, petites étoiles dorées. Une répétition = 160 unités (4 bandes de 40). */
export function texTapisserie(): THREE.CanvasTexture {
  return texture("tapisserie", 512, 512, (c, w, h) => {
    const bande = w / 4;
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i % 2 === 0 ? "#8EC3E6" : "#F6EBD3";
      c.fillRect(i * bande, 0, bande, h);
    }
    // liserés
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i % 2 === 0 ? "#6FA9D1" : "#E9D9B8";
      c.fillRect(i * bande, 0, 5, h);
    }
    // étoiles sur les bandes crème
    for (const i of [1, 3]) {
      for (let k = 0; k < 4; k++) {
        const cx = i * bande + bande / 2 + (k % 2 ? 6 : -6);
        const cy = 64 + k * 128;
        c.fillStyle = "#E7B53C";
        c.beginPath();
        for (let s = 0; s < 10; s++) {
          const r = s % 2 === 0 ? 20 : 8;
          const a = (s * Math.PI) / 5 - Math.PI / 2;
          c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        c.closePath();
        c.fill();
      }
    }
  }, true);
}

/** Tapis de chambre d'enfant : fond vert, routes, cercles de couleur. */
export function texTapis(): THREE.CanvasTexture {
  return texture("tapis", 1024, 1024, (c, w, h) => {
    c.fillStyle = "#6FB36A";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#5CA05A";
    for (let i = 0; i < 24; i++) c.fillRect(0, i * 44, w, 22);
    // routes
    c.fillStyle = "#555B66";
    c.fillRect(0, 440, w, 140);
    c.fillRect(440, 0, 140, h);
    c.fillStyle = "#F2E2A0";
    for (let x = 20; x < w; x += 80) c.fillRect(x, 506, 44, 8);
    for (let y = 20; y < h; y += 80) c.fillRect(506, y, 8, 44);
    // maisons et ronds
    const cols = ["#E0453B", "#F0B040", "#4F9ADB", "#F4E7C8", "#C96AA0"];
    for (let k = 0; k < 14; k++) {
      const x = 40 + alea(k * 3.3) * (w - 160);
      const y = 40 + alea(k * 7.1) * (h - 160);
      if ((x > 400 && x < 620) || (y > 400 && y < 620)) continue;
      c.fillStyle = cols[k % 5];
      c.fillRect(x, y, 90, 70);
      c.fillStyle = "#7A3B2A";
      c.beginPath();
      c.moveTo(x - 8, y);
      c.lineTo(x + 45, y - 40);
      c.lineTo(x + 98, y);
      c.closePath();
      c.fill();
    }
    c.fillStyle = "#4B8B4A";
    for (let k = 0; k < 10; k++) {
      const x = 60 + alea(k * 9.7) * (w - 120);
      const y = 60 + alea(k * 5.9) * (h - 120);
      c.beginPath();
      c.arc(x, y, 26, 0, Math.PI * 2);
      c.fill();
    }
  }, true);
}

/** Panneau planté au bout de l'avenue. */
export function texSortie(): THREE.CanvasTexture {
  return texture("sortie", 1024, 320, (c, w, h) => {
    c.fillStyle = "#F4EFE2";
    rr(c, 0, 0, w, h, 26);
    c.fill();
    c.fillStyle = "#D1332B";
    rr(c, 18, 18, w - 36, h - 36, 18);
    c.fill();
    c.fillStyle = "#F4EFE2";
    rr(c, 36, 36, w - 72, h - 72, 10);
    c.fill();
    // pictogramme : bonhomme barré
    c.fillStyle = "#1B1B22";
    c.beginPath();
    c.arc(150, 118, 24, 0, Math.PI * 2);
    c.fill();
    c.fillRect(124, 148, 52, 70);
    c.strokeStyle = "#D1332B";
    c.lineWidth = 16;
    c.beginPath();
    c.arc(150, 160, 78, 0, Math.PI * 2);
    c.moveTo(98, 108);
    c.lineTo(202, 212);
    c.stroke();
    texte(c, "SORTIE", 600, 112, 640, 900, 120, "#D1332B");
    texte(c, "INTERDITE", 600, 224, 640, 900, 120, "#1B1B22");
  });
}

/** Enseigne de la boulangerie (sur le linteau). */
export function texBoulangerie(): THREE.CanvasTexture {
  return texture("boulangerie", 1024, 160, (c, w, h) => {
    c.fillStyle = "#7A3B20";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#F3D58A";
    c.fillRect(10, 10, w - 20, h - 20);
    c.fillStyle = "#8C2F1B";
    c.fillRect(18, 18, w - 36, h - 36);
    texte(c, "BOULANGERIE", w / 2, h / 2 + 4, w - 120, 900, 108, "#FFE9B0");
    // deux épis de blé
    c.fillStyle = "#F3D58A";
    for (const x of [70, w - 70]) {
      for (let k = 0; k < 4; k++) {
        c.beginPath();
        c.ellipse(x - 10, 56 + k * 22, 7, 14, -0.5, 0, Math.PI * 2);
        c.ellipse(x + 10, 56 + k * 22, 7, 14, 0.5, 0, Math.PI * 2);
        c.fill();
      }
    }
  });
}

/** Face d'un cube de l'alphabet. */
export function texLettre(lettre: string, fond: string): THREE.CanvasTexture {
  return texture(`lettre-${lettre}-${fond}`, 256, 256, (c, w, h) => {
    c.fillStyle = fond;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(255,255,255,0.55)";
    c.lineWidth = 10;
    c.strokeRect(14, 14, w - 28, h - 28);
    texte(c, lettre, w / 2, h / 2 + 8, 170, 900, 190, "#FFFFFF");
  });
}

/** Étiquette collée sur la boîte à jouets. */
export function texEtiquette(): THREE.CanvasTexture {
  return texture("etiquette", 1024, 256, (c, w, h) => {
    c.fillStyle = "#F7F0DC";
    rr(c, 0, 0, w, h, 24);
    c.fill();
    c.strokeStyle = "#B53A2C";
    c.lineWidth = 10;
    rr(c, 14, 14, w - 28, h - 28, 16);
    c.stroke();
    texte(c, "PETITS HABITANTS", w / 2, 96, w - 120, 900, 120, "#B53A2C");
    texte(c, "À RANGER LE SOIR", w / 2, 200, w - 220, 800, 62, "#3A2A20");
  });
}

/** Numéro d'un compartiment. */
export function texNumero(n: number): THREE.CanvasTexture {
  return texture(`num-${n}`, 128, 128, (c, w, h) => {
    c.fillStyle = "#F7F0DC";
    rr(c, 0, 0, w, h, 14);
    c.fill();
    texte(c, String(n), w / 2, h / 2 + 4, 90, 900, 90, "#3A2A20");
  });
}

/** Ombre portée d'une main géante (doigts écartés), noir doux sur fond transparent. Axe de la main : vers le haut de l'image. */
export function texOmbreMain(): THREE.CanvasTexture {
  return texture("ombre-main", 512, 512, (c, w, h) => {
    c.filter = "blur(3px)";
    c.fillStyle = "#000000";
    // paume
    rr(c, 130, 250, 212, 180, 46);
    c.fill();
    // poignet et avant-bras
    c.fillRect(180, 420, 120, 100);
    // doigts : longueurs différentes, bien écartés
    const doigts: Array<[number, number, number, number]> = [
      [136, 120, 36, 150],
      [184, 60, 36, 210],
      [232, 36, 36, 232],
      [280, 80, 36, 190],
    ];
    for (const [x, y, ww, hh] of doigts) {
      rr(c, x, y, ww, hh, 20);
      c.fill();
    }
    // pouce
    c.save();
    c.translate(132, 360);
    c.rotate(-1.0);
    rr(c, -80, -20, 130, 40, 20);
    c.fill();
    c.restore();
  });
}

/** Iris d'un œil énorme : anneau sombre, fibres rayonnantes brun-ambre, collerette claire autour de la pupille. */
export function texIris(): THREE.CanvasTexture {
  return texture("iris", 512, 512, (c, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const g = c.createRadialGradient(cx, cy, 40, cx, cy, 250);
    g.addColorStop(0, "#D9A04C");
    g.addColorStop(0.35, "#B87A33");
    g.addColorStop(0.75, "#7A4A22");
    g.addColorStop(0.93, "#3A2110");
    g.addColorStop(1, "#1E1008");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 150; i++) {
      const a = alea(i * 1.3) * Math.PI * 2;
      const r0 = 50 + alea(i * 2.1) * 60;
      const r1 = 140 + alea(i * 3.7) * 100;
      c.strokeStyle = alea(i * 4.9) > 0.5 ? `rgba(255,214,140,${0.12 + alea(i) * 0.2})` : `rgba(60,30,10,${0.18 + alea(i) * 0.25})`;
      c.lineWidth = 1 + alea(i * 5.5) * 3;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      c.lineTo(cx + Math.cos(a + 0.05) * r1, cy + Math.sin(a + 0.05) * r1);
      c.stroke();
    }
    c.strokeStyle = "rgba(255,230,170,0.5)";
    c.lineWidth = 6;
    c.beginPath();
    c.arc(cx, cy, 76, 0, Math.PI * 2);
    c.stroke();
  });
}

/** Onde de la sirène : anneau fin et doux. */
export function texOnde(): THREE.CanvasTexture {
  return texture("onde", 256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 90, w / 2, h / 2, 126);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.55, "rgba(255,255,255,0.95)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
}
