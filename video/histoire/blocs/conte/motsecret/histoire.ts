/**
 * « Le mot secret » — personnages et événements, tous calés sur les mots du récit (histoires/recits/mot-secret.json).
 * Scènes (indice 0 à 5) : 0 la règle · 1 les trois coups · 2 le doute · 3 la fuite · 4 sous le lit · 5 le twist.
 *
 * Distribution : le narrateur, papa et maman devant la porte (Tom dort dans sa chambre). À la scène 4 le narrateur file dans
 * le couloir, Tom chuchote sous la veilleuse ; papa le suit et soulève le rabat du lit. Sur « Mais sous nos pieds » la
 * mise en scène coupe vers le salon : papa, narrateur et Tom y ont un double (« S ») qui n'existe qu'à partir de la coupe,
 * leurs originaux de la chambre disparaissent à cet instant (voir `masques` dans Decor.tsx).
 */
import type { V3 } from "../../geo";
import type { Tenue } from "../../avatar";
import { type Etape, type Habitant, duree } from "../../ville/foule";

type Mot = (s: number, k: number) => number;

export const T_NARR: Tenue = { genre: "figurant", peau: "#E6B98F", haut: "#5B86D6", bas: "#3F5FA8", chaussures: "#C9CCD6", cheveux: "#4A3022" };
export const T_TOM: Tenue = { genre: "figurant", peau: "#F0C8A0", haut: "#F2C94C", bas: "#D9A93A", chaussures: "#F2F2F2", cheveux: "#E6C46A" };
export const T_MAMAN: Tenue = { genre: "figurant", peau: "#E3B58C", haut: "#4E8A5A", bas: "#3A3F5A", chaussures: "#2A2A30", cheveux: "#7A4A2E", longs: "#7A4A2E" };
export const T_PAPA: Tenue = { genre: "figurant", peau: "#D9AE8B", haut: "#8E939C", bas: "#3A3F52", chaussures: "#2A2A30", cheveux: "#1E1E24" };

export const E_NARR = 0.9;
export const E_TOM = 0.7;

// positions clés
export const P_PAPA: V3 = [-4.3, 0, 5.4];
export const P_PAPA_PORTE: V3 = [-4.3, 0, 6.8];
export const P_MAMAN: V3 = [-1.3, 0, 5.1];
export const P_MAMAN2: V3 = [-4.3, 0, 5.6];
export const P_NARR: V3 = [-2.3, 0, 3.9];
export const P_COULOIR: V3 = [-0.8, 0, -8.3];
export const P_PORTE_CH: V3 = [-0.8, 0, -13.2];
export const P_TOM: V3 = [-1.6, 0, -19.7];
export const P_PAPA_LIT: V3 = [-1.25, 0, -17.6];
/** Rangée devant la trappe (face au nord, tête baissée). */
export const RANGEE_Z = 4.5;
export const P_S = { papa: [2.1, 0, RANGEE_Z] as V3, maman: [3.4, 0, RANGEE_Z] as V3, narr: [4.7, 0, RANGEE_Z] as V3, tom: [0.9, 0, RANGEE_Z + 0.2] as V3 };

export function evenements(mot: Mot): Record<string, number> {
  const tok1 = mot(4, 17) + 0.04;
  return {
    toc1: mot(1, 4) + 0.05,
    toc2: mot(1, 5) + 0.05,
    toc3: mot(1, 6) + 0.05,
    poignee: mot(1, 6) + 0.6,
    ombre: mot(1, 16) - 0.1,
    main: mot(1, 23) + 0.2,
    silFin: mot(3, 6) - 0.3,
    ecoute0: mot(1, 7),
    ecoute1: mot(2, 0),
    cle: mot(2, 3),
    relache: mot(2, 15) + 0.4,
    regardeP: mot(2, 24),
    regardeM: mot(2, 27),
    tomVers: mot(3, 27),
    tomPapa: mot(4, 7),
    saisit: mot(2, 12),
    marcheNarr: mot(3, 2) + 0.1,
    marchePapa: mot(3, 16),
    souleve: mot(4, 9) + 0.05,
    cut: mot(4, 13) - 0.06,
    tok1,
    tok2: tok1 + 0.4,
    tok3: tok1 + 0.8,
    trembleFin: mot(4, 23) + 0.7,
    tapis: mot(5, 7) - 0.05,
    trappe: mot(5, 8) + 0.1,
    regard: mot(5, 17),
  };
}

function etapesFixes(t0: number, p: V3, ry: number, e: Etape["emotion"], mode: Etape["mode"] = "debout"): Etape {
  return { t: t0, p, ry, mode, emotion: e };
}

export function habitants(mot: Mot): Habitant[] {
  const ev = evenements(mot);
  const out: Habitant[] = [];
  const S = Math.PI; // face au nord (-z)
  const O = -Math.PI / 2; // face à l'ouest (-x)

  // ---------------- PAPA : devant la serrure ; puis il suit le couloir jusqu'à la chambre
  const papaVers = (de: V3, pts: V3[], t0: number, v: number): Etape[] => {
    const et: Etape[] = [{ t: t0, p: de, mode: "marche", emotion: "inquiet" }];
    let t = t0;
    let cur = de;
    for (const q of pts) {
      t += duree(cur, q, v);
      et.push({ t, p: q, mode: "marche", emotion: "inquiet" });
      cur = q;
    }
    return et;
  };
  const cheminPapa: V3[] = [[0.5, 0, -3.2], [0.5, 0, -13.6], [0.2, 0, -15.2], P_PAPA_LIT];
  const marche = papaVers(P_PAPA_PORTE, cheminPapa, ev.marchePapa, 4.2);
  const arrive = marche[marche.length - 1].t;
  out.push({
    id: "papa",
    tenue: T_PAPA,
    graine: 0.4,
    echelle: 1.0,
    etapes: [
      etapesFixes(0, P_PAPA, 0, "resolu"),
      etapesFixes(mot(1, 0), P_PAPA, 0, "resolu"),
      etapesFixes(mot(1, 0) + 0.9, P_PAPA_PORTE, 0, "attente"),
      etapesFixes(mot(1, 26) - 0.3, P_PAPA_PORTE, 0, "attente"),
      etapesFixes(mot(1, 26), P_PAPA_PORTE, 0.6, "apaise"),
      etapesFixes(mot(2, 0) - 0.3, P_PAPA_PORTE, 0.6, "apaise"),
      etapesFixes(mot(2, 0), P_PAPA_PORTE, 0, "resolu"),
      etapesFixes(mot(2, 8), P_PAPA_PORTE, 0, "surpris"),
      etapesFixes(mot(2, 15), P_PAPA_PORTE, 0, "inquiet"),
      ...marche.slice(0, 1).map((e) => ({ ...e, ry: 0 })),
      ...marche.slice(1, -1),
      { ...marche[marche.length - 1], mode: "debout" as const, ry: O, emotion: "inquiet" as const },
      { t: arrive + 0.5, p: P_PAPA_LIT, mode: "debout", ry: O, emotion: "resolu" },
    ],
  });

  // ---------------- MAMAN : à côté de papa ; elle lui attrape le bras ; puis elle rejoint le tapis
  out.push({
    id: "maman",
    tenue: T_MAMAN,
    graine: 1.3,
    echelle: 0.97,
    etapes: [
      etapesFixes(0, P_MAMAN, 0, "inquiet"),
      etapesFixes(mot(2, 8) - 0.15, P_MAMAN, 0, "inquiet"),
      { t: ev.saisit - 0.15, p: P_MAMAN2, mode: "marche", emotion: "inquiet", ry: 0 },
      etapesFixes(ev.saisit + 0.1, P_MAMAN2, 0, "inquiet"),
      etapesFixes(mot(2, 15), P_MAMAN2, 0, "effraye"),
      { t: mot(3, 20), p: P_MAMAN2, mode: "marche", emotion: "inquiet", ry: 0 },
      { t: mot(3, 20) + duree(P_MAMAN2, P_S.maman, 3.2), p: P_S.maman, mode: "debout", ry: S, emotion: "effraye" },
      etapesFixes(mot(5, 30), P_S.maman, S, "effraye"),
    ],
  });

  // ---------------- LE NARRATEUR : devant la porte, puis le couloir, puis le seuil de la chambre
  const nA = ev.marcheNarr;
  const v = 4.0;
  const mouche: V3 = [-0.2, 0, -3.2];
  const tMouche = nA + duree(P_NARR, mouche, v);
  const tCouloir = tMouche + duree(mouche, P_COULOIR, v);
  const tPorte = mot(3, 26) + duree(P_COULOIR, P_PORTE_CH, 2.4);
  out.push({
    id: "narr",
    tenue: T_NARR,
    graine: 2.1,
    echelle: E_NARR,
    etapes: [
      etapesFixes(0, P_NARR, 0, "attente"),
      etapesFixes(mot(0, 18), P_NARR, 0, "resolu"),
      etapesFixes(mot(2, 8), P_NARR, 0, "inquiet"),
      etapesFixes(mot(3, 0), P_NARR, 0, "effraye"),
      { t: nA, p: P_NARR, mode: "marche", emotion: "effraye", ry: 0 },
      { t: tMouche, p: mouche, mode: "marche", emotion: "inquiet" },
      { t: tCouloir, p: P_COULOIR, mode: "debout", ry: S, emotion: "surpris" },
      { t: mot(3, 21) - 0.1, p: P_COULOIR, mode: "halete", ry: S, emotion: "effraye" },
      { t: mot(3, 26), p: P_COULOIR, mode: "marche", ry: S, emotion: "effraye" },
      { t: tPorte, p: P_PORTE_CH, mode: "debout", ry: S, emotion: "effraye" },
      { t: ev.cut - 1, p: P_PORTE_CH, mode: "debout", ry: S, emotion: "effraye" },
    ],
  });

  // ---------------- TOM : accroupi près du lit, il chuchote sous le lit
  out.push({
    id: "tom",
    tenue: T_TOM,
    graine: 3.3,
    echelle: E_TOM,
    etapes: [
      { t: mot(2, 0), p: P_TOM, mode: "cache", ry: O, emotion: "apaise" },
      { t: mot(3, 16), p: P_TOM, mode: "cache", ry: O, emotion: "apaise" },
      { t: mot(4, 7), p: P_TOM, mode: "cache", ry: O, emotion: "neutre" },
    ],
  });

  // ---------------- DOUBLES DU SALON (apparaissent à la coupe de « Mais sous nos pieds »)
  const apres = ev.cut - 0.02;
  out.push({ id: "papaS", tenue: T_PAPA, graine: 0.4, etapes: [{ t: apres, p: P_S.papa, mode: "debout", ry: S, emotion: "effraye" }] });
  out.push({ id: "narrS", tenue: T_NARR, graine: 2.1, echelle: E_NARR, etapes: [{ t: apres, p: P_S.narr, mode: "debout", ry: S, emotion: "effraye" }] });
  out.push({
    id: "tomS",
    tenue: T_TOM,
    graine: 3.3,
    echelle: E_TOM,
    etapes: [
      { t: apres, p: P_S.tom, mode: "debout", ry: S, emotion: "neutre" },
      { t: mot(5, 9), p: P_S.tom, mode: "debout", ry: S, emotion: "apaise" },
    ],
  });
  return out;
}
