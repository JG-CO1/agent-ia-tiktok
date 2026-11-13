import React from "react";
import { icons } from "lucide-react";
import type { Scene } from "../../src/schema/episode";
import type { TimelineScene } from "../../src/core/timeline";
import { COLORS, LAYOUT } from "../theme";

export interface SceneProps<T extends Scene["type"] = Scene["type"]> {
  sc: TimelineScene & { scene: Extract<Scene, { type: T }> };
  /** Frame locale (0 = début de la scène ; négative pendant la transition d'entrée). */
  f: number;
  fps: number;
  accent: string;
  assetsBase: string;
}

export const Icon: React.FC<{ name?: string; size?: number; color?: string; stroke?: number }> = ({
  name,
  size = 44,
  color = COLORS.text,
  stroke = 2.2,
}) => {
  const C = (name && (icons as Record<string, React.FC<any>>)[name]) || icons.Sparkles;
  return <C size={size} color={color} strokeWidth={stroke} />;
};

/** Zone visuelle supérieure (mise en page « split »). */
export const VisualZone: React.FC<{ children: React.ReactNode; align?: "center" | "start" }> = ({ children, align = "center" }) => (
  <div
    style={{
      position: "absolute",
      left: LAYOUT.margin,
      right: LAYOUT.margin,
      top: LAYOUT.visualTop,
      height: LAYOUT.visualBottom - LAYOUT.visualTop,
      display: "flex",
      flexDirection: "column",
      justifyContent: align === "center" ? "center" : "flex-start",
      alignItems: "stretch",
    }}
  >
    {children}
  </div>
);

export const card: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(25,32,50,0.94) 0%, rgba(13,18,30,0.94) 100%)",
  border: `1.5px solid ${COLORS.cardBorder}`,
  borderRadius: 40,
  boxShadow: "0 22px 44px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.07)",
};

/** Titre de section au-dessus d'un visuel. */
export const SectionTitle: React.FC<{ text?: string; accent: string; p: number }> = ({ text, accent, p }) =>
  text ? (
    <div
      style={{
        fontFamily: "Inter Display",
        fontWeight: 800,
        fontSize: 58,
        lineHeight: 1.08,
        color: COLORS.text,
        marginBottom: 34,
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
        letterSpacing: -0.5,
      }}
    >
      <span style={{ display: "inline-block", width: 14, height: 46, borderRadius: 7, background: accent, marginRight: 20, verticalAlign: -4 }} />
      {text}
    </div>
  ) : null;

/** Taille de police adaptée à la longueur du texte (évite tout débordement). */
export function fitSize(text: string, steps: Array<[maxChars: number, size: number]>, fallback: number) {
  const n = text.length;
  for (const [max, size] of steps) if (n <= max) return size;
  return fallback;
}
