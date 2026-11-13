/** Scènes de structure : étapes, liste, comparaison. */
import React from "react";
import { COLORS, FONTS } from "../theme";
import { ease, enter, riseStyle } from "../components/anim";
import { card, Icon, SectionTitle, VisualZone, type SceneProps } from "./common";

export const Etapes: React.FC<SceneProps<"etapes">> = ({ sc, f, fps, accent }) => {
  const s = sc.scene;
  const n = s.etapes.length;
  const gap = n >= 4 ? 18 : 26;
  return (
    <VisualZone>
      <SectionTitle text={s.titre} accent={accent} p={enter(f, fps, 0)} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap }}>
        {s.etapes.map((e, i) => {
          const r = sc.reveals[i] ?? 8 + i * 10;
          const pi = enter(f, fps, r, 200, 16);
          const active = f >= r && (i === n - 1 || f < (sc.reveals[i + 1] ?? Infinity));
          return (
            <div
              key={i}
              style={{
                ...card,
                borderRadius: 32,
                padding: n >= 4 ? "24px 30px" : "32px 34px",
                display: "flex",
                alignItems: "center",
                gap: 28,
                border: active ? `2px solid ${accent}AA` : card.border,
                boxShadow: active ? `0 18px 40px rgba(0,0,0,0.45), 0 0 0 6px ${accent}1C` : card.boxShadow,
                opacity: pi,
                transform: `translateX(${(1 - pi) * 120}px) scale(${0.94 + 0.06 * pi})`,
              }}
            >
              <div
                style={{
                  flex: "0 0 auto",
                  width: 84,
                  height: 84,
                  borderRadius: 26,
                  background: active ? accent : `${accent}22`,
                  color: active ? "#06120F" : accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONTS.display,
                  fontWeight: 900,
                  fontSize: 46,
                }}
              >
                {e.icone ? <Icon name={e.icone} size={46} color={active ? "#06120F" : accent} stroke={2.6} /> : i + 1}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 46, color: COLORS.text, lineHeight: 1.1 }}>{e.titre}</div>
                {e.detail && <div style={{ marginTop: 8, fontFamily: FONTS.text, fontWeight: 500, fontSize: 32, color: COLORS.dim, lineHeight: 1.3 }}>{e.detail}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </VisualZone>
  );
};

const STATE_ICON = { ok: ["Check", COLORS.green], non: ["X", COLORS.red], neutre: ["Minus", COLORS.dim] } as const;

export const Liste: React.FC<SceneProps<"liste">> = ({ sc, f, fps, accent }) => {
  const s = sc.scene;
  return (
    <VisualZone>
      <SectionTitle text={s.titre} accent={accent} p={enter(f, fps, 0)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {s.items.map((it, i) => {
          const pi = enter(f, fps, sc.reveals[i] ?? 8 + i * 9, 210, 16);
          const [icon, color] = it.etat ? STATE_ICON[it.etat] : [it.icone ?? "Sparkles", accent];
          return (
            <div key={i} style={{ ...card, borderRadius: 30, padding: "28px 32px", display: "flex", alignItems: "center", gap: 26, ...riseStyle(pi, 50) }}>
              <div style={{ flex: "0 0 auto", width: 74, height: 74, borderRadius: 22, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={icon} size={44} color={color} stroke={2.6} />
              </div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 44, color: COLORS.text, lineHeight: 1.18 }}>{it.texte}</div>
            </div>
          );
        })}
      </div>
    </VisualZone>
  );
};

export const Comparaison: React.FC<SceneProps<"comparaison">> = ({ sc, f, fps, accent }) => {
  const s = sc.scene;
  const cols = [
    { side: s.gauche, color: COLORS.orange, r: sc.reveals[0] ?? 6 },
    { side: s.droite, color: accent, r: sc.reveals[1] ?? 24 },
  ];
  const vs = enter(f, fps, (sc.reveals[1] ?? 24) - 4, 260, 12);
  return (
    <VisualZone>
      <SectionTitle text={s.titre} accent={accent} p={enter(f, fps, 0)} />
      <div style={{ position: "relative", display: "flex", gap: 24, alignItems: "stretch" }}>
        {cols.map(({ side, color, r }, i) => {
          const pi = enter(f, fps, r, 170, 16);
          return (
            <div key={i} style={{ ...card, flex: 1, borderRadius: 34, padding: "42px 30px 46px", minHeight: 420, borderTop: `6px solid ${color}`, ...riseStyle(pi, 70) }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 54, color, marginBottom: 28, lineHeight: 1.05 }}>{side.nom}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {side.points.map((pt, k) => {
                  const pk = ease(f, r + 6 + k * 5, r + 16 + k * 5);
                  return (
                    <div key={k} style={{ display: "flex", gap: 14, alignItems: "flex-start", fontFamily: FONTS.text, fontWeight: 600, fontSize: 38, color: "#DCE1EC", lineHeight: 1.25, opacity: pk, transform: `translateY(${(1 - pk) * 14}px)` }}>
                      <div style={{ marginTop: 13, flex: "0 0 auto", width: 14, height: 14, borderRadius: 7, background: color }} />
                      {pt}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 96,
            height: 96,
            marginLeft: -48,
            marginTop: -48,
            borderRadius: 48,
            background: COLORS.bg0,
            border: `3px solid ${COLORS.cardBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 36,
            color: COLORS.text,
            transform: `scale(${vs})`,
            boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
          }}
        >
          VS
        </div>
      </div>
    </VisualZone>
  );
};
