/** Scènes plein écran : accroche, titre, appel à l'action. */
import React from "react";
import { COLORS, FONTS } from "../theme";
import { clamp01, ease, enter } from "../components/anim";
import { fitSize, Icon, type SceneProps } from "./common";
import { normalizeWord } from "../../src/core/text";

const Kicker: React.FC<{ text?: string; accent: string; p: number }> = ({ text, accent, p }) =>
  text ? (
    <div
      style={{
        fontFamily: FONTS.display,
        fontWeight: 800,
        fontSize: 34,
        letterSpacing: 6,
        color: accent,
        textTransform: "uppercase",
        marginBottom: 26,
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px)`,
      }}
    >
      {text}
    </div>
  ) : null;

/** Titre « cinétique » : les mots tombent un à un, les mots surlignés reçoivent un marqueur. */
const KineticTitle: React.FC<{ text: string; highlight: string[]; f: number; fps: number; size: number; accent: string }> = ({
  text,
  highlight,
  f,
  fps,
  size,
}) => {
  const words = text.split(/\s+/);
  // Surligne les expressions exactes (suites de mots), pas chaque mot isolé :
  // « Code Mode » ne doit pas marquer le « Code » de « Claude Code ».
  const norm = words.map(normalizeWord);
  const marked = norm.map(() => false);
  for (const phrase of highlight) {
    const parts = phrase.split(/\s+/).map(normalizeWord).filter(Boolean);
    for (let i = 0; parts.length && i + parts.length <= norm.length; i++) {
      if (parts.every((p, k) => norm[i + k] === p)) for (let k = 0; k < parts.length; k++) marked[i + k] = true;
    }
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `${size * 0.12}px ${size * 0.26}px` }}>
      {words.map((w, i) => {
        const p = enter(f, fps, 2 + i * 3, 230, 15);
        const isHl = marked[i];
        const nextHl = i < words.length - 1 && marked[i + 1];
        const mark = ease(f, 10 + i * 3, 22 + i * 3);
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: size,
              lineHeight: 1.04,
              letterSpacing: -1.5,
              color: isHl ? "#140A05" : COLORS.text,
              opacity: clamp01(p * 1.6),
              transform: `translateY(${(1 - p) * 60}px) rotate(${(1 - p) * -4}deg) scale(${0.8 + 0.2 * p})`,
              padding: isHl ? `0 ${nextHl ? 0 : size * 0.12}px 0 ${i > 0 && marked[i - 1] ? 0 : size * 0.12}px` : 0,
              zIndex: 1,
            }}
          >
            {isHl && (
              <span
                style={{
                  position: "absolute",
                  inset: `${size * 0.06}px ${nextHl ? -size * 0.27 : 0}px ${size * 0.02}px 0`,
                  background: `linear-gradient(100deg, ${COLORS.orange}, ${COLORS.orangeSoft})`,
                  borderRadius: size * 0.16,
                  transform: `scaleX(${mark}) skewX(-6deg)`,
                  transformOrigin: "left center",
                  zIndex: -1,
                  boxShadow: `0 10px 40px ${COLORS.orange}66`,
                }}
              />
            )}
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Accroche: React.FC<SceneProps<"accroche">> = ({ sc, f, fps, accent }) => {
  const s = sc.scene;
  const size = fitSize(s.titre, [[16, 132], [26, 116], [38, 100], [50, 88]], 78);
  const flash = clamp01(1 - f / 5);
  return (
    <>
      <div style={{ position: "absolute", left: 60, right: 60, top: 270, height: 460, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <Kicker text={s.sur_titre} accent={accent} p={enter(f, fps, 0)} />
        <KineticTitle text={s.titre} highlight={s.surligne ?? []} f={f} fps={fps} size={size} accent={accent} />
      </div>
      {flash > 0 && <div style={{ position: "absolute", inset: 0, background: "white", opacity: flash * 0.55 }} />}
    </>
  );
};

export const Titre: React.FC<SceneProps<"titre">> = ({ sc, f, fps, accent }) => {
  const s = sc.scene;
  const size = fitSize(s.titre, [[20, 110], [34, 92], [50, 80]], 70);
  const pi = enter(f, fps, 0, 200, 14);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 260, height: 480, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      {s.icone && (
        <div style={{ marginBottom: 30, transform: `scale(${pi}) rotate(${(1 - pi) * -30}deg)`, padding: 26, borderRadius: 36, background: `${accent}1F`, border: `2px solid ${accent}66` }}>
          <Icon name={s.icone} size={86} color={accent} />
        </div>
      )}
      <Kicker text={s.sur_titre} accent={accent} p={enter(f, fps, 3)} />
      <KineticTitle text={s.titre} highlight={[]} f={f - 3} fps={fps} size={size} accent={accent} />
    </div>
  );
};

const ACTIONS = {
  abonne: { icon: "BellRing", label: "S'abonner" },
  commente: { icon: "MessageCircle", label: "Commente" },
  partage: { icon: "Share2", label: "Partage" },
  enregistre: { icon: "Bookmark", label: "Enregistre" },
} as const;

export const Cta: React.FC<SceneProps<"cta"> & { handle: string; promesse: string }> = ({ sc, f, fps, accent, handle, promesse }) => {
  const s = sc.scene;
  const a = ACTIONS[s.action];
  const pBtn = enter(f, fps, 10, 180, 12);
  const press = f > 34 && f < 44 ? 0.92 : 1;
  const size = fitSize(s.titre, [[22, 96], [34, 84], [50, 72]], 64);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 230, height: 480, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <KineticTitle text={s.titre} highlight={[]} f={f} fps={fps} size={size} accent={accent} />
      {s.sous_titre && (
        <div style={{ marginTop: 24, fontFamily: FONTS.text, fontWeight: 600, fontSize: 40, color: COLORS.dim, opacity: enter(f, fps, 8) }}>
          {s.sous_titre}
        </div>
      )}
      <div
        style={{
          marginTop: 44,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "26px 52px",
          borderRadius: 999,
          background: `linear-gradient(100deg, ${COLORS.orange}, #FF8A4C)`,
          boxShadow: `0 18px 60px ${COLORS.orange}77`,
          fontFamily: FONTS.display,
          fontWeight: 800,
          fontSize: 50,
          color: "#1A0B04",
          transform: `scale(${pBtn * press})`,
          opacity: clamp01(pBtn * 1.5),
        }}
      >
        <Icon name={a.icon} size={50} color="#1A0B04" stroke={2.6} />
        {a.label}
      </div>
      <div style={{ marginTop: 26, fontFamily: FONTS.text, fontWeight: 600, fontSize: 32, color: COLORS.text, opacity: enter(f, fps, 16) }}>
        {handle} <span style={{ color: COLORS.faint }}>·</span> <span style={{ color: accent }}>{promesse}</span>
      </div>
    </div>
  );
};
