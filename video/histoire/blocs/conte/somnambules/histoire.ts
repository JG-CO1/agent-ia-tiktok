/**
 * La ville des somnambules — personnages et événements (tous calés sur les mots du récit).
 * Repères [scène, mot] : voir histoires/recits/somnambules.json (scène 1 = indice 0).
 */
import type { V3 } from "../../geo";
import { versMonde } from "../../geo";
import type { Tenue } from "../../avatar";
import { type Etape, type Habitant, type Mode, duree } from "../../ville/foule";
import { MAISON, MAISONS, MONT, SALON, TUNNEL, seuil } from "./monde";

type Mot = (s: number, k: number) => number;

const PEAU = ["#E6B98F", "#C99873", "#D9AE8B", "#B58463", "#F0C8A0"];
const CHEV = ["#3A2A1E", "#C9A15A", "#252525", "#7A3B22", "#9A9A9A", "#5B3A8C"];
const PYJAMA: Array<[string, string]> = [["#8DA0C8", "#6F7FA6"], ["#A89CC0", "#867AA0"], ["#C8A8A8", "#A58484"], ["#9CB8A8", "#7C9888"], ["#B8B08C", "#968E6C"], ["#8C9CB8", "#6C7C98"], ["#D0C8B8", "#B0A898"], ["#A8B8C8", "#8898A8"]];
const pyjama = (i: number): Tenue => ({ genre: "figurant", peau: PEAU[i % 5], haut: PYJAMA[i % 8][0], bas: PYJAMA[(i + 3) % 8][1], chaussures: "#2A2A30", cheveux: CHEV[(i * 7) % 6] });

export const T_NARR: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#6E86C8", bas: "#4C5C94", chaussures: "#2A2A30", cheveux: "#4A3022" };
export const T_SOEUR: Tenue = { genre: "figurant", peau: "#E3B58C", haut: "#A8484E", bas: "#7C3238", chaussures: "#2A2A30", cheveux: "#2A1C14", longs: "#2A1C14" };
export const T_PROF: Tenue = { genre: "figurant", peau: "#D9AE8B", haut: "#2A2A33", bas: "#1E1E26", chaussures: "#101014", cheveux: "#6A6A6A", manteau: "#1C1C24", feutre: "#15151B", lunettes: "#CFCFD6" };
const T_VEILLEUR = (i: number): Tenue => ({ genre: "figurant", peau: PEAU[(i + 1) % 5], haut: "#4B3A3A", bas: "#2B2B33", chaussures: "#101014", cheveux: CHEV[(i + 2) % 6], manteau: "#2E2A2E" });

/** Habitant qui suit une ligne brisée à vitesse constante (les étapes intermédiaires gardent le mode). */
function chemin(id: string, tenue: Tenue, graine: number, t0: number, v: number, pts: V3[], mode: Mode, extra: Partial<Habitant> = {}, modeFin: Mode = mode): Habitant {
  const etapes: Etape[] = [];
  let t = t0;
  etapes.push({ t, p: pts[0], mode });
  for (let i = 1; i < pts.length; i++) {
    t += duree(pts[i - 1], pts[i], v);
    etapes.push({ t, p: pts[i], mode: i === pts.length - 1 ? modeFin : mode });
  }
  return { id, tenue, etapes, graine, ...extra };
}
const SOMN = { sansClin: true } as const;

export function evenements(mot: Mot): Record<string, number> {
  return {
    ouv: mot(0, 11) - 0.25, // toutes les portes s'ouvrent sur « sort »
    ferme: mot(1, 27),
    pousse: mot(3, 25) - 0.35,
    perd: mot(4, 26),
    frappe: mot(5, 11),
    toc1: mot(5, 21) + 0.05,
    toc2: mot(5, 22) + 0.05,
    toc3: mot(5, 23) + 0.05,
    poignee: mot(5, 26),
    debutCreuse: mot(5, 0),
  };
}

export function habitants(mot: Mot): Habitant[] {
  const ev = evenements(mot);
  const out: Habitant[] = [];
  const [X] = MONT;

  // ---------------- VILLE : trente-six somnambules sortent des douze maisons
  MAISONS.forEach((md, h) => {
    for (let k = 0; k < 3; k++) {
      const i = h * 3 + k;
      const col = (((i * 5) % 7) - 3) * 0.55; // colonne dans l'avenue
      const dehors = seuil(md, 4.8);
      const pts: V3[] = [seuil(md, -0.8), dehors, [col, 0, dehors[2] + (k - 1) * 0.5], [col * 0.8, 0, -100]];
      out.push(chemin(`sw${i}`, pyjama(i), i * 1.3, ev.ouv + 0.6 + k * 0.9 + (h % 4) * 0.3, 1.5, pts, "somnambule", { ...SOMN, echelle: 0.92 + (i % 4) * 0.05 }));
    }
  });
  // retour à l'aube : dix somnambules remontent l'avenue et rentrent chez eux
  for (let j = 0; j < 10; j++) {
    const md = MAISONS[(j * 5 + 1) % 12];
    const col = (((j * 3) % 5) - 2) * 0.7;
    const dehors = seuil(md, 4.8);
    const tArr = mot(1, 18) + j * 0.55;
    const pts: V3[] = [[col, 0, dehors[2] - 30], [col, 0, dehors[2]], dehors, seuil(md, -0.9)];
    const dist = Math.hypot(30, 0) + Math.hypot(col - dehors[0], 0) + 4;
    const rw = chemin(`rw${j}`, pyjama(j + 40), j * 1.7, tArr - dist / 1.7, 1.7, pts, "somnambule", { ...SOMN });
    rw.etapes[0].objet = "terre";
    out.push(rw);
  }

  // ---------------- MONTAGNE : la file jusqu'à la bouche du tunnel, les veilleurs, le professeur
  for (let j = 0; j < 22; j++) {
    const dx = (((j * 5) % 5) - 2) * 0.85;
    const pts: V3[] = [[X + dx, 0, 30], [X + dx * 0.5, 0, -20], [X, 0, -38]];
    out.push(chemin(`mw${j}`, pyjama(j + 11), j * 0.9, mot(1, 0) - 12 + j * 0.8, 1.8, pts, "somnambule", { ...SOMN, echelle: 0.92 + (j % 4) * 0.05 }));
  }
  const veilleur = (id: string, i: number, p: V3, ry: number): Habitant => ({ id, tenue: T_VEILLEUR(i), graine: i * 2.1, clinRapide: true, echelle: 1.05, etapes: [{ t: -1, p, mode: "lanterne", ry, objet: "lanterne", emotion: "resolu" }] });
  out.push(veilleur("veil0", 0, [X + 4.3, 0, 14], -Math.PI / 2), veilleur("veil1", 1, [X - 4.4, 0, 2], Math.PI / 2), veilleur("veil2", 2, [X + 4.5, 0, -8], -Math.PI / 2));

  const tP0 = mot(2, 8) - 5;
  const posteProf: V3 = [X - 5.6, 0, -6];
  const versTunnel: V3 = [X + 3.4, 0, -15.2];
  const ryProf = Math.atan2(-3.4, -11.8);
  out.push({
    id: "prof",
    tenue: T_PROF,
    graine: 0.4,
    echelle: 1.14,
    clinRapide: true,
    etapes: [
      { t: tP0, p: [X - 5.6, 0, 26], mode: "lanterne", objet: "lanterne", emotion: "resolu" },
      { t: tP0 + duree([X - 5.6, 0, 26], posteProf, 3.6), p: posteProf, mode: "lanterne", ry: Math.PI / 2 },
      { t: mot(3, 16), p: posteProf, mode: "lanterne", ry: Math.PI / 2 },
      { t: mot(3, 24), p: versTunnel, mode: "lanterne" },
      { t: ev.pousse - 0.12, p: versTunnel, mode: "lanterne", ry: ryProf },
      { t: ev.pousse + 0.35, p: versTunnel, mode: "tombe", ry: ryProf, objet: "", emotion: "effraye" },
    ],
  });
  // le narrateur, caché derrière le grand rocher près de la bouche du tunnel
  out.push({
    id: "nMont",
    tenue: T_NARR,
    graine: 0.7,
    echelle: 0.84,
    etapes: [
      { t: mot(2, 4), p: [X + 11.4, 0, -20.6], mode: "cache", ry: -Math.PI / 2 - 0.3, emotion: "inquiet" },
      { t: mot(2, 23), p: [X + 11.4, 0, -20.6], mode: "cache", ry: -Math.PI / 2 - 0.3, emotion: "effraye" },
      { t: mot(4, 1), p: [X + 11.4, 0, -20.6], mode: "debout", ry: -Math.PI / 2, emotion: "surpris" },
      { t: mot(4, 4), p: [X + 12.8, 0, -8.0], mode: "debout", ry: -Math.PI / 2, emotion: "surpris" },
      { t: mot(4, 13), p: [X + 12.8, 0, -8.0], mode: "debout", ry: -Math.PI / 2, emotion: "effraye" },
      { t: mot(4, 34), p: [X + 12.8, 0, -8.0], mode: "debout", ry: -Math.PI / 2, emotion: "vide" },
    ],
  });
  // la grande sœur : surgit du tunnel, pousse le professeur, puis fait face à son frère
  const ryS = Math.atan2(3.4 - 1.4, -15.2 + 19);
  out.push({
    id: "soeur",
    tenue: T_SOEUR,
    graine: 1.9,
    echelle: 0.98,
    etapes: [
      { t: ev.pousse - 1.9, p: [X + 0.4, 0, -34], mode: "course", emotion: "colere" },
      { t: ev.pousse, p: [X + 1.7, 0, -17.9], mode: "pousse", ry: 0.2, emotion: "colere" },
      { t: ev.pousse + 0.6, p: [X + 1.7, 0, -17.9], mode: "debout", ry: 0.2, emotion: "colere" },
      { t: mot(4, 0), p: [X + 1.7, 0, -17.9], mode: "debout", ry: Math.PI / 2, emotion: "apaise" },
      { t: mot(4, 4), p: [X + 10.0, 0, -8.0], mode: "debout", ry: Math.PI / 2, emotion: "apaise" },
    ],
  });
  void ryS;

  // ---------------- MAISON : le narrateur à la fenêtre, puis au lit ; la rue derrière la vitre
  const [XM] = MAISON;
  out.push({ id: "nFen", tenue: T_NARR, graine: 0.3, echelle: 0.84, etapes: [{ t: -1, p: [XM + 0.1, 0, -3.6], mode: "debout", ry: Math.PI, emotion: "effraye" }, { t: mot(0, 22), p: [XM + 0.1, 0, -3.6], mode: "debout", ry: Math.PI, emotion: "inquiet" }] });
  out.push({
    id: "nLit",
    tenue: T_NARR,
    graine: 0.5,
    echelle: 0.84,
    etapes: [
      { t: -1, p: [XM - 2.6, 1.22, 1.6], mode: "allonge", ry: 0, emotion: "effraye" },
      { t: mot(2, 0) - 0.8, p: [XM - 2.6, 1.22, 1.6], mode: "allonge", ry: 0, emotion: "dort" },
      { t: mot(2, 7) + 0.25, p: [XM - 2.6, 1.22, 1.6], mode: "allonge", ry: 0, emotion: "effraye" },
    ],
  });
  for (let i = 0; i < 9; i++) {
    const tc = mot(0, 14) + (i - 3) * 0.95; // instant où il passe devant la fenêtre
    out.push(chemin(`fw${i}`, pyjama(i + 20), i * 1.1, tc - 46 / 1.6, 1.6, [[XM - 46 + (i % 2) * 0.01, 0, -12.2 - (i % 3) * 0.9], [XM + 46, 0, -12.2 - (i % 3) * 0.9]], "somnambule", { ...SOMN }));
  }

  // ---------------- SALON : le concours de regards (souvenir)
  const [XS] = SALON;
  const tS = mot(4, 19);
  out.push({
    id: "kidS",
    tenue: T_SOEUR,
    graine: 2.2,
    echelle: 0.9,
    etapes: [
      { t: tS, p: [XS, 0, 2.4], mode: "assis", ry: Math.PI, h: 1.18, emotion: "vide" },
      { t: ev.perd, p: [XS, 0, 2.4], mode: "assis", ry: Math.PI, h: 1.18, emotion: "dort" },
      { t: ev.perd + 0.3, p: [XS, 0, 2.4], mode: "assis", ry: Math.PI, h: 1.18, emotion: "sourire" },
    ],
  });
  out.push({
    id: "kidN",
    tenue: T_NARR,
    graine: 2.7,
    echelle: 0.78,
    sansClin: true,
    etapes: [
      { t: tS, p: [XS, 0, -2.4], mode: "assis", ry: 0, h: 1.18, emotion: "vide" },
      { t: ev.perd + 0.3, p: [XS, 0, -2.4], mode: "assis", ry: 0, h: 1.18, emotion: "sourire" },
    ],
  });

  // ---------------- TUNNEL : on creuse, la pioche frappe le métal
  const tD = mot(5, 0) - 0.3;
  const [, , ZT] = TUNNEL;
  void ZT;
  const creuse = (id: string, tenue: Tenue, x: number, e: number, g: number): Habitant => ({
    id,
    tenue,
    graine: g,
    echelle: e,
    etapes: [
      { t: tD, p: [x, 0, 362.7], mode: "creuse", ry: Math.PI, objet: "pioche", emotion: "resolu" },
      { t: ev.frappe, p: [x, 0, 362.7], mode: "debout", ry: Math.PI, objet: "pioche", emotion: "effraye" },
    ],
  });
  out.push(creuse("nTun", T_NARR, -0.3, 0.84, 0.3), creuse("soeurTun", T_SOEUR, 2.2, 0.98, 1.4));
  void versMonde;
  return out;
}
