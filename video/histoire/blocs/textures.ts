/**
 * Petites textures dessinées au canevas (aucune image externe, aucune IA) : visages façon « décalque » de jeu
 * en blocs, photo du fils, cadran d'horloge, réveil numérique, lettre, halo de lumière.
 * Uniquement des rectangles, arcs et aplats : rendu identique sur toutes les machines (pas de police).
 */
import * as THREE from "three";

export type Emotion = "neutre" | "inquiet" | "triste" | "surpris" | "sourire" | "apaise" | "resolu" | "curieux" | "attente" | "vide" | "dort" | "effraye" | "larmes" | "sinistre" | "colere";

const memo = new Map<string, THREE.Texture>();
function texture(cle: string, w: number, h: number, dessin: (c: CanvasRenderingContext2D) => void): THREE.Texture {
  let t = memo.get(cle);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const c = cv.getContext("2d")!;
    dessin(c);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    tx.needsUpdate = true;
    t = tx;
    memo.set(cle, t);
  }
  return t;
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
  c.fill();
}

function sourcil(c: CanvasRenderingContext2D, cx: number, cy: number, angle: number, w = 44, h = 11) {
  c.save();
  c.translate(cx, cy);
  c.rotate(angle);
  rr(c, -w / 2, -h / 2, w, h, 4);
  c.restore();
}

/** Dessine les traits d'un visage (256 × 256, fond transparent) : yeux rectangulaires arrondis, bouche simple. */
function traits(c: CanvasRenderingContext2D, e: Emotion, ferme: boolean, agee: boolean, encre = "#17171C") {
  if (e === "vide" || e === "effraye" || e === "sinistre") return traitsSpeciaux(c, e, encre);
  if (e === "dort") {
    ferme = true;
    e = "neutre";
  }
  const X = [84, 172];
  const yOeil = 116;
  c.fillStyle = encre;
  c.strokeStyle = encre;
  c.lineCap = "round";
  const grand = e === "surpris";
  const ow = grand ? 32 : agee ? 24 : 27;
  const oh = ferme ? 7 : grand ? 54 : agee ? 32 : 42;
  for (const x of X) rr(c, x - ow / 2, yOeil - oh / 2 + (ferme ? 8 : 0), ow, oh, Math.min(9, oh / 2));
  if (!ferme && !agee) {
    // petit reflet : donne de la vie au regard sans sortir du style
    c.fillStyle = "rgba(255,255,255,0.9)";
    for (const x of X) c.fillRect(x - ow / 2 + 5, yOeil - oh / 2 + 6, 7, 9);
    c.fillStyle = encre;
  }
  // sourcils
  const ys = grand ? 60 : 74;
  if (e === "colere") {
    sourcil(c, X[0], ys + 10, 0.42);
    sourcil(c, X[1], ys + 10, -0.42);
  } else if (e === "inquiet") {
    sourcil(c, X[0], ys, -0.3);
    sourcil(c, X[1], ys, 0.3);
  } else if (e === "triste" || e === "larmes" || e === "apaise" || e === "attente") {
    const a = e === "triste" || e === "larmes" ? 0.42 : e === "attente" ? 0.2 : 0.24;
    sourcil(c, X[0], ys + 2, -a);
    sourcil(c, X[1], ys + 2, a);
  } else if (e === "surpris") {
    sourcil(c, X[0], ys, -0.1, 46);
    sourcil(c, X[1], ys, 0.1, 46);
  } else if (e === "resolu") {
    sourcil(c, X[0], ys + 8, 0.2);
    sourcil(c, X[1], ys + 8, -0.2);
  } else if (e === "curieux") {
    sourcil(c, X[0], ys - 4, -0.12);
    sourcil(c, X[1], ys + 6, 0.02);
  } else if (agee) {
    sourcil(c, X[0], ys + 4, -0.08, 38, 8);
    sourcil(c, X[1], ys + 4, 0.08, 38, 8);
  }
  // bouche
  const yb = 190;
  c.lineWidth = 11;
  if (e === "neutre" || e === "resolu" || e === "curieux") rr(c, 128 - 24, yb - 5, 48, 11, 5);
  else if (e === "attente") rr(c, 128 - 19, yb - 4, 38, 10, 5);
  else if (e === "inquiet") rr(c, 128 - 17, yb - 10, 34, 24, 9);
  else if (e === "surpris") rr(c, 128 - 19, yb - 20, 38, 48, 15);
  else if (e === "colere") rr(c, 128 - 26, yb - 2, 52, 9, 4);
  else if (e === "triste" || e === "larmes") {
    c.beginPath();
    c.arc(128, yb + 34, 40, Math.PI * 1.25, Math.PI * 1.75);
    c.stroke();
    if (e === "larmes") {
      c.fillStyle = "#7FC8F8";
      for (const x of X) rr(c, x - 6, yOeil + 28, 12, 48, 6);
      c.fillStyle = encre;
    }
  } else {
    const r = e === "sourire" ? 44 : 52;
    const o = e === "sourire" ? 0.3 : 0.36;
    c.beginPath();
    c.arc(128, yb - r + 12, r, Math.PI * o, Math.PI * (1 - o));
    c.stroke();
  }
  if (agee) {
    // rides douces : pattes d'oie et plis des joues
    c.lineWidth = 4;
    c.globalAlpha = 0.5;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(128 + s * 68, yOeil - 6);
      c.lineTo(128 + s * 80, yOeil - 12);
      c.moveTo(128 + s * 68, yOeil + 6);
      c.lineTo(128 + s * 80, yOeil + 12);
      c.moveTo(128 + s * 50, yb - 28);
      c.lineTo(128 + s * 58, yb - 6);
      c.stroke();
    }
    c.globalAlpha = 1;
  }
}

/** Expressions des récits sombres : regard vide (yeux grands ouverts, pupilles minuscules), effroi, sourire inquiétant. */
function traitsSpeciaux(c: CanvasRenderingContext2D, e: Emotion, encre: string) {
  const X = [84, 172];
  const y = 116;
  c.lineCap = "round";
  if (e === "vide") {
    for (const x of X) {
      c.fillStyle = "#F2F2EE";
      rr(c, x - 21, y - 31, 42, 62, 12);
      c.fillStyle = encre;
      rr(c, x - 5, y - 8, 10, 14, 3);
    }
    c.fillStyle = encre;
    rr(c, 128 - 18, 190 - 4, 36, 9, 4);
  } else if (e === "effraye") {
    for (const x of X) {
      c.fillStyle = "#F2F2EE";
      rr(c, x - 22, y - 36, 44, 72, 14);
      c.fillStyle = encre;
      rr(c, x - 7, y - 12, 14, 20, 4);
    }
    c.fillStyle = encre;
    for (const [x, a] of [[X[0], -0.35], [X[1], 0.35]] as Array<[number, number]>) sourcil(c, x, 58, a, 46, 11);
    rr(c, 128 - 15, 190 - 14, 30, 34, 12);
  } else {
    // sinistre : yeux plissés, très large sourire
    c.fillStyle = encre;
    for (const x of X) rr(c, x - 24, y - 6, 48, 13, 5);
    sourcil(c, X[0], 84, 0.32, 48, 10);
    sourcil(c, X[1], 84, -0.32, 48, 10);
    c.lineWidth = 12;
    c.strokeStyle = encre;
    c.beginPath();
    c.arc(128, 150, 62, Math.PI * 0.18, Math.PI * 0.82);
    c.stroke();
  }
}

/** Décalque de visage (fond transparent), à poser sur la face avant de la tête. */
export function visage(e: Emotion, ferme = false, agee = false): THREE.Texture {
  return texture(`visage-${e}-${ferme ? 1 : 0}-${agee ? 1 : 0}`, 256, 256, (c) => traits(c, e, ferme, agee));
}

/** Vieille photographie du fils : avatar en blocs, cheveux bruns, haut bleu, sourire (bible § 2.3). */
export function photoFils(): THREE.Texture {
  return texture("photo-fils", 384, 512, (c) => {
    c.fillStyle = "#F4EEDD";
    c.fillRect(0, 0, 384, 512);
    // image (cadre blanc type tirage ancien)
    const x0 = 26;
    const y0 = 26;
    const w = 332;
    const h = 418;
    c.fillStyle = "#C9D3C4";
    c.fillRect(x0, y0, w, h);
    c.fillStyle = "#A9BE9E";
    c.fillRect(x0, y0 + 300, w, 118);
    // petite maison en arrière-plan
    c.fillStyle = "#D8C7A8";
    c.fillRect(x0 + 12, y0 + 196, 96, 104);
    c.fillStyle = "#A5483C";
    c.beginPath();
    c.moveTo(x0 + 2, y0 + 198);
    c.lineTo(x0 + 60, y0 + 146);
    c.lineTo(x0 + 118, y0 + 198);
    c.closePath();
    c.fill();
    // corps
    c.fillStyle = "#242424";
    c.fillRect(192 - 58, y0 + 372, 116, 46);
    c.fillStyle = "#376DAD";
    c.fillRect(192 - 60, y0 + 236, 120, 140);
    c.fillRect(192 - 94, y0 + 236, 32, 128);
    c.fillRect(192 + 62, y0 + 236, 32, 128);
    c.fillStyle = "#E6B98F";
    c.fillRect(192 - 94, y0 + 364, 32, 22);
    c.fillRect(192 + 62, y0 + 364, 32, 22);
    // tête
    c.fillRect(192 - 62, y0 + 104, 124, 124);
    c.fillStyle = "#493323";
    c.fillRect(192 - 66, y0 + 86, 132, 42);
    c.fillRect(192 - 66, y0 + 86, 20, 78);
    c.fillRect(192 + 46, y0 + 86, 20, 78);
    c.fillStyle = "#17171C";
    c.fillRect(192 - 34, y0 + 150, 14, 24);
    c.fillRect(192 + 20, y0 + 150, 14, 24);
    c.strokeStyle = "#17171C";
    c.lineWidth = 7;
    c.lineCap = "round";
    c.beginPath();
    c.arc(192, y0 + 176, 30, Math.PI * 0.22, Math.PI * 0.78);
    c.stroke();
    // voile sépia (photo ancienne)
    c.fillStyle = "rgba(190,150,90,0.26)";
    c.fillRect(x0, y0, w, h);
    c.strokeStyle = "rgba(90,70,40,0.35)";
    c.lineWidth = 3;
    c.strokeRect(x0, y0, w, h);
  });
}

/** Cadran d'horloge de rue : fond blanc, graduations noires (les aiguilles sont des pièces 3D). */
export function cadran(): THREE.Texture {
  return texture("cadran", 512, 512, (c) => {
    c.fillStyle = "#F6F3EA";
    c.fillRect(0, 0, 512, 512);
    c.fillStyle = "#17171C";
    c.translate(256, 256);
    for (let i = 0; i < 60; i++) {
      c.save();
      c.rotate((i * Math.PI) / 30);
      if (i % 15 === 0) c.fillRect(-13, -236, 26, 62);
      else if (i % 5 === 0) c.fillRect(-8, -236, 16, 42);
      else c.fillRect(-3, -236, 6, 16);
      c.restore();
    }
  });
}

const SEG: Record<string, string> = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abfgcd" };
/** Afficheur de réveil numérique (« 00:12 ») en segments rouges. */
export function reveil(texte: string): THREE.Texture {
  return texture(`reveil-${texte}`, 512, 224, (c) => {
    c.fillStyle = "#0B0B0E";
    c.fillRect(0, 0, 512, 224);
    const dessin = (ch: string, x: number) => {
      const on = SEG[ch] ?? "";
      const w = 76;
      const h = 150;
      const e = 16;
      const y = 37;
      const seg: Record<string, [number, number, number, number]> = {
        a: [x + e, y, w - 2 * e, e],
        g: [x + e, y + h / 2 - e / 2, w - 2 * e, e],
        d: [x + e, y + h - e, w - 2 * e, e],
        f: [x, y + e, e, h / 2 - e * 1.5],
        b: [x + w - e, y + e, e, h / 2 - e * 1.5],
        e: [x, y + h / 2 + e / 2, e, h / 2 - e * 1.5],
        c: [x + w - e, y + h / 2 + e / 2, e, h / 2 - e * 1.5],
      };
      for (const k of Object.keys(seg)) {
        c.fillStyle = on.includes(k) ? "#FF4B3A" : "#2A1114";
        c.fillRect(...seg[k]);
      }
    };
    const [hh, mm] = texte.split(":");
    dessin(hh[0], 36);
    dessin(hh[1], 136);
    dessin(mm[0], 300);
    dessin(mm[1], 400);
    c.fillStyle = "#FF4B3A";
    c.fillRect(248, 80, 16, 16);
    c.fillRect(248, 130, 16, 16);
  });
}

/** Lettre blanche avec des lignes noires simples (aucun texte lisible : les mots passent en sous-titres). */
export function lettre(): THREE.Texture {
  return texture("lettre", 384, 512, (c) => {
    c.fillStyle = "#FBF8EE";
    c.fillRect(0, 0, 384, 512);
    c.fillStyle = "#26262C";
    const lignes = [0.62, 0.86, 0.8, 0.9, 0.72, 0.84, 0.5];
    lignes.forEach((l, i) => c.fillRect(46, 70 + i * 50, 292 * l, 10));
    c.fillRect(214, 440, 124, 10); // signature
    c.strokeStyle = "rgba(60,50,30,0.25)";
    c.lineWidth = 2;
    c.strokeRect(1, 1, 382, 510);
  });
}

/** Halo doux (dégradé radial) pour simuler une lumière sur le sol ou autour d'une flamme. */
export function halo(): THREE.Texture {
  return texture("halo", 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });
}

/** Dégradé vertical pour le ciel de l'aube (haut rose, horizon bleu clair). */
export function cielAube(): THREE.Texture {
  return texture("ciel-aube", 4, 256, (c) => {
    // la voûte couvre de -90° (bas) à +90° (haut) : l'horizon est au milieu du dégradé
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#F0A6BD");
    g.addColorStop(0.3, "#F0A6BD");
    g.addColorStop(0.41, "#F5BFCB");
    g.addColorStop(0.47, "#C2D0EA");
    g.addColorStop(0.5, "#8EC8EC");
    g.addColorStop(1, "#8EC8EC");
    c.fillStyle = g;
    c.fillRect(0, 0, 4, 256);
  });
}
