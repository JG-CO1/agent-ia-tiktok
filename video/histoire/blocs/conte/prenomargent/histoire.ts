/**
 * « Prénom = argent » — personnages (habitants) et événements calés sur les mots.
 * Repères [scène, mot] : voir histoires/recits/prenom-argent.json (scène 1 = indice 0).
 * Les héros (Maxime, ses copains, la boulangère) ont une apparence FIXE ; la foule varie mais garde ses vêtements d'un plan à l'autre.
 * Les poses, émotions et bulles sont décidées dans Decor.tsx à partir de ces instants (fonction pure du temps).
 */
import type { V3 } from "../../geo";
import type { Tenue } from "../../avatar";
import { type Etape, type Habitant, type Mode, duree } from "../../ville/foule";
import { BOUL, PODIUM, PR, ST, VILLA, YACHT, CHATEAU, RU, TO, ETUDE, ryBoutique, localBoutique } from "./monde";
import { versMonde } from "../../geo";

type Mot = (s: number, k: number) => number;

// ------------------------------------------------------------------ Tenues (apparence fixe)
const PEAU = ["#E6B98F", "#D9AE8B", "#C98F66", "#F1C9A0", "#A66B45"];
const CHEV = ["#16161A", "#3A2A1E", "#D8B25A", "#7A4E2D", "#9A9A9A", "#D4561C"];
export const T_MAXIME: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#10B26C", bas: "#2B3A55", chaussures: "#F4F4F0", cheveux: "#16161A" };
export const T_MAXIME_OR: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#F2B91A", bas: "#E0A612", chaussures: "#FFFFFF", cheveux: "#16161A", lunettes: "#101014", echarpe: "#FFFFFF" };
export const T_COP1: Tenue = { genre: "figurant", peau: "#D9AE8B", haut: "#F28C1E", bas: "#2B3A55", chaussures: "#F4F4F0", cheveux: "#3A2A1E", casquette: "#E5252A" };
export const T_COP2: Tenue = { genre: "figurant", peau: "#C98F66", haut: "#8A3FE0", bas: "#34415E", chaussures: "#E5252A", cheveux: "#16161A", lunettes: "#23232C" };
export const T_COP3: Tenue = { genre: "figurant", peau: "#F1C9A0", haut: "#F2C230", bas: "#243B32", chaussures: "#F4F4F0", cheveux: "#D4561C" };
export const T_BOULANGERE: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#F2E6D0", bas: "#4B3A2A", chaussures: "#2A2A30", cheveux: "#6B3F22", tablier: "#FFFFFF", bandeau: "#FFFFFF", longs: "#6B3F22" };
export const T_DJ: Tenue = { genre: "figurant", peau: "#C98F66", haut: "#E4208C", bas: "#17131F", chaussures: "#F4F4F0", cheveux: "#16161A", casquette: "#17131F", lunettes: "#FFD23F" };
const SHIRTS = ["#E4208C", "#FFC21A", "#0FB36B", "#C4122F", "#6B2BD9", "#FF7A1A", "#1E88E5", "#F4F1EA", "#11A98E", "#FF5CA8"];
const BAS = ["#2B3A55", "#3A3A48", "#5A3B2A", "#243B32", "#6B2BD9", "#1B1B22"];
export function tenueCitoyen(i: number): Tenue {
  const h = (n: number, m: number) => Math.floor(Math.abs(Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 * m);
  const t: Tenue = { genre: "figurant", peau: PEAU[h(1, PEAU.length)], haut: SHIRTS[h(2, SHIRTS.length)], bas: BAS[h(3, BAS.length)], chaussures: h(4, 2) ? "#F4F4F0" : "#1B1B22", cheveux: CHEV[h(5, CHEV.length)] };
  const a = h(6, 9);
  if (a === 0) t.casquette = SHIRTS[h(7, SHIRTS.length)];
  else if (a === 1) t.lunettes = "#23232C";
  else if (a === 2) { t.longs = t.cheveux; t.robe = SHIRTS[h(8, SHIRTS.length)]; }
  else if (a === 3) t.bandeau = "#FFFFFF";
  else if (a === 4) t.longs = t.cheveux;
  return t;
}
export const echelleCitoyen = (i: number) => 0.92 + (i % 4) * 0.035;

// ------------------------------------------------------------------ Compte en banque : (instant, euros), interpolé en logarithme
/** Montant affiché à l'instant T (voir `ev.arrivees` pour les premiers euros, un par un). */
export function argent(T: number, ev: Record<string, number>): number {
  const arr = ev.arrivees as unknown as number[];
  let n = 0;
  for (const t of arr) if (T >= t) n++;
  if (T < ev.paliers0) return n;
  const pts = ev.pts as unknown as Array<[number, number]>;
  if (T >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i];
    const [t1, v1] = pts[i + 1];
    if (T >= t0 && T < t1) {
      const k = (T - t0) / (t1 - t0);
      return Math.exp(Math.log(v0) + (Math.log(v1) - Math.log(v0)) * k);
    }
  }
  return pts[0][1];
}
export const ARGENT_FINAL = 1284906311;

// ------------------------------------------------------------------ Événements
export function evenements(mot: Mot): Record<string, number> {
  const crisS1 = [-0.06, 1.28, 2.1, 2.95];
  const crisS2: number[] = [];
  for (let i = 0; i < 9; i++) crisS2.push(7.35 + i * 0.4);
  const ev: Record<string, any> = {
    crisS1,
    arrivees: crisS1.map((t) => t + 0.62),
    crisS2,
    paliers0: 7.2,
    noteA: mot(1, 14) - 0.14, // « Cent » : le billet de 100 €
    noteB: mot(1, 17) - 0.1, // « mille » : la liasse
    riche: mot(1, 18) - 0.04, // costume doré dès « J'ai loué »
    chanteStade: mot(1, 22) + 0.3,
    pluie: mot(1, 25) - 0.2, // les pièces pleuvent sur la scène
    hpOn: mot(2, 3) - 0.2, // haut-parleurs
    onAir: mot(2, 9),
    chanteRue: mot(2, 15) - 0.1, // la rue entière chante
    explose: mot(2, 26) - 0.05, // « explosait »
    hypno: mot(3, 14), // « comme hypnotisée »
    pain0: mot(3, 15) + 0.8, // les étagères se vident (un matin)
    refuse: mot(3, 21),
    rien: mot(3, 29), // « rien » : les derniers pains
    ruine: mot(4, 0) - 0.06, // retour sur la rue : tout est fermé
    plat: mot(4, 7) - 0.12, // « portefeuilles à plat »
    vole: mot(4, 10) - 0.2, // les pièces volent des poches vers Maxime
    stop: mot(5, 16) - 0.05, // « et plus personne » : la foule se tait
    fige: mot(5, 16) + 0.9, // le compteur s'arrête
    fin: mot(5, 22) + 0.4,
  };
  ev.pts = [
    [mot(1, 0), 4], [7.6, 6], [8.3, 28], [9.4, 84], [mot(1, 14), 100], [10.3, 380], [mot(1, 17) + 0.2, 1000], [12.4, 1210], [13.3, 2100], [13.8, 6400], [14.4, 21400],
    [16.5, 62000], [18.0, 190000], [19.7, 620000], [20.5, 2400000], [21.4, 9800000], [22.1, 31000000], [24.5, 52000000], [28, 91000000], [31.2, 122000000],
    [34.4, 168000000], [37.6, 300000000], [40.0, 680000000], [mot(5, 16), 1241000000], [ev.fige, ARGENT_FINAL],
  ];
  return ev as Record<string, number>;
}

// ------------------------------------------------------------------ Aides
const etape = (t: number, p: V3, mode: Mode = "debout", extra: Partial<Etape> = {}): Etape => ({ t, p, mode, ...extra });
const fixe = (id: string, tenue: Tenue, p: V3, ry: number, echelle = 1, graine = 0): Habitant => ({ id, tenue, graine, echelle, sansClin: false, etapes: [etape(-5, p, "debout", { ry })] });

export const CITOYENS: Array<{ x: number; z: number; ry: number }> = [];
{
  let n = 0;
  for (let r = 0; r < 22; r++) {
    const z = 52 - r * 4.2;
    if (z > 15 && z < 29) continue;
    for (const x0 of [-9, -4.8, 4.8, 9]) {
      const j = Math.sin(n * 91.7) * 0.7;
      const jz = Math.sin(n * 47.3) * 0.9;
      CITOYENS.push({ x: x0 + j, z: z + jz, ry: z > 24 ? Math.PI : 0 });
      n++;
    }
  }
}
export const NB_CITOYENS = CITOYENS.length;

/** Position (monde) du bout de la bouche d'un personnage (pour les pièces). */
export const bouche = (p: V3, ry: number, e: number): V3 => [p[0] + Math.sin(ry) * 0.45 * e, p[1] + 2.5 * e, p[2] + Math.cos(ry) * 0.45 * e];

export function habitants(mot: Mot): Habitant[] {
  const ev = evenements(mot);
  const out: Habitant[] = [];

  // ---------------- RUE (jour) : Maxime, ses copains, les passants
  out.push(fixe("max", T_MAXIME, [0, 0, 15], Math.PI, 0.95, 0.2));
  out.push(fixe("cop1", T_COP1, [-2.7, 0, 7.2], 0.1, 1.0, 0.5));
  out.push(fixe("cop2", T_COP2, [2.8, 0, 7.8], -0.1, 1.02, 1.1));
  out.push(fixe("cop3", T_COP3, [0.1, 0, 5.4], 0, 0.98, 1.9));
  // passants : marchent sur les trottoirs
  for (let i = 0; i < 12; i++) {
    const x = (i % 2 ? 9.2 : -9.2) + (Math.sin(i * 7.7) * 0.6);
    const sens = i % 3 === 0 ? -1 : 1;
    const z0 = sens > 0 ? 60 - ((i * 13) % 30) - 40 : 20 + ((i * 11) % 40);
    const z1 = z0 + sens * 140;
    const v = 2.4 + (i % 3) * 0.3;
    out.push({ id: `pass${i}`, tenue: tenueCitoyen(100 + i), graine: i, echelle: echelleCitoyen(i), sansClin: false, etapes: [etape(-5, [x, 0, z0], "marche"), etape(-5 + duree([x, 0, z0], [x, 0, z1], v), [x, 0, z1], "marche")] });
  }
  // la boulangère derrière son comptoir
  out.push(fixe("boul", T_BOULANGERE, localBoutique(BOUL, [-0.6, 0.44, -5.3]), ryBoutique(BOUL), 1.0, 2.6));
  // Maxime (doré) : podium de la rue, balcon
  out.push(fixe("maxPod", T_MAXIME_OR, [PODIUM[0], 1.7, PODIUM[2]], 0, 1.0, 0.4));
  out.push({ id: "maxMatin", tenue: T_MAXIME_OR, graine: 0.7, echelle: 1.0, sansClin: false, etapes: [etape(23.8, [0, 0, 33], "marche", { emotion: "neutre" }), etape(23.8 + duree([0, 0, 33], [0, 0, 22], 3.6), [0, 0, 22], "marche"), etape(23.8 + duree([0, 0, 33], [0, 0, 22], 3.6) + duree([0, 0, 22], [10.9, 0, 22], 3.6), [10.9, 0, 22], "debout", { ry: Math.PI / 2 })] });

  // ---------------- foule de la rue (chante dès « Maxime, Maxime ! »)
  CITOYENS.forEach((c, i) => {
    out.push({ id: `v${i}`, tenue: tenueCitoyen(i), graine: i * 0.37, echelle: echelleCitoyen(i), sansClin: true, etapes: [etape(-5, [c.x, 0, c.z], "debout", { ry: c.ry + Math.sin(i * 3.1) * 0.25 })] });
    out.push({ id: `r${i}`, tenue: tenueCitoyen(i), graine: i * 0.37, echelle: echelleCitoyen(i), sansClin: true, etapes: [etape(-5, RU([c.x, 0, c.z]), "debout", { ry: c.ry + Math.sin(i * 3.1) * 0.25 })] });
  });
  // Maxime devant la boulangerie fermée, dans la ville grise
  out.push(fixe("maxRuine", T_MAXIME_OR, RU([6.2, 0, 23.5]), -Math.PI / 2, 1.0, 0.9));

  // ---------------- STADE : Maxime sur la scène dorée
  out.push(fixe("maxStade", T_MAXIME_OR, ST([0, 1.9, 0]), 0, 1.0, 0.3));
  // ---------------- TOITS : le DJ de la radio (assis, face à la ville)
  out.push(fixe("dj", T_DJ, TO([0, ETUDE.roof + 1.27, -0.7]), 0, 1.0, 1.2));
  // ---------------- PROPRIÉTÉ : Maxime à la villa, sur le yacht, au balcon du château
  out.push(fixe("maxVilla", T_MAXIME_OR, versMonde(PR(VILLA), 0.35, [-12, 1.25, 11.2]), 0.35, 1.0, 0.2));
  out.push(fixe("maxYacht", T_MAXIME_OR, PR([YACHT[0] + 0.5, 6.1, YACHT[2] - 7.2]), Math.PI, 1.0, 0.6));
  out.push(fixe("maxBalcon", T_MAXIME_OR, PR([0, CHATEAU.balconY + 0.1, CHATEAU.balconZ + 1.6]), 0, 1.0, 0.8));
  out.push(fixe("maxBalcon2", { ...T_MAXIME_OR, lunettes: undefined }, PR([0, CHATEAU.balconY + 0.1, CHATEAU.balconZ + 1.6]), 0, 1.0, 0.8));
  void ev;
  return out;
}
