import type { Format } from "../src/schema/episode";

export const COLORS = {
  bg0: "#06080D",
  bg1: "#0E1424",
  card: "rgba(17,23,37,0.86)",
  cardSolid: "#111725",
  cardBorder: "rgba(255,255,255,0.09)",
  text: "#F4F6FB",
  dim: "#9EA7BB",
  faint: "#5B657B",
  orange: "#FF6A2A",
  orangeSoft: "#FF9A62",
  mint: "#5CF2DC",
  green: "#3DDC97",
  red: "#FF5C6C",
  code: "#0A0E16",
} as const;

export const FORMAT_STYLE: Record<Format, { accent: string; label: string }> = {
  decouverte: { accent: "#5CF2DC", label: "DÉCOUVERTE" },
  business: { accent: "#FFC24B", label: "BUSINESS IA" },
  actu: { accent: "#FF5C7A", label: "ACTU" },
  tutoriel: { accent: "#A18CFF", label: "TUTO" },
};

export const FONTS = {
  display: "Inter Display",
  text: "Inter",
  mono: "JetBrains Mono",
} as const;

/** Grille 1080x1920 tenant compte des interfaces TikTok / Shorts (haut, rail droit, bas). */
export const LAYOUT = {
  margin: 64,
  badgeY: 188,
  visualTop: 262,
  visualBottom: 1062,
  captions: { split: 1188, plein: 1478 },
  sourceY: { split: 1078, plein: 1640 },
} as const;

export type Layout = "split" | "plein";
export const layoutOf = (type: string): Layout => (type === "accroche" || type === "titre" || type === "cta" ? "plein" : "split");
