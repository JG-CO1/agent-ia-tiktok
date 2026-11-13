/** Scènes « carte » : dépôt GitHub, chiffre clé, citation, capture d'écran. */
import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { COLORS, FONTS } from "../theme";
import { clamp01, ease, enter, formatNumberFr, riseStyle } from "../components/anim";
import { card, fitSize, Icon, VisualZone, type SceneProps } from "./common";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178C6",
  JavaScript: "#F1E05A",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Shell: "#89E051",
  Markdown: "#8B9BB4",
};

function formatDateFr(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export const Repo: React.FC<SceneProps<"repo">> = ({ sc, f, fps, accent }) => {
  const s = sc.scene;
  const [owner, name] = s.nom.split("/");
  const p = enter(f, fps, 0, 160, 16);
  const stars = s.etoiles ?? null;
  const count = stars === null ? 0 : Math.round(stars * ease(f, 8, 38));
  // Taille adaptée à la largeur disponible : le nom ne doit jamais être coupé au milieu
  const nameSize = Math.max(34, Math.min(74, Math.floor(690 / (name.length * 0.61))));
  return (
    <VisualZone>
      <div style={{ ...card, padding: "52px 54px", ...riseStyle(p, 80) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ width: 96, height: 96, borderRadius: 28, background: `${accent}1A`, border: `2px solid ${accent}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="FolderGit2" size={54} color={accent} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONTS.mono, fontWeight: 500, fontSize: 34, color: COLORS.dim }}>{owner} /</div>
            <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: nameSize, color: COLORS.text, lineHeight: 1.05, wordBreak: "break-all" }}>{name}</div>
          </div>
        </div>
        <div style={{ marginTop: 34, fontFamily: FONTS.text, fontWeight: 500, fontSize: 40, lineHeight: 1.32, color: "#D7DCE8" }}>{s.description}</div>
        <div style={{ marginTop: 38, display: "flex", flexWrap: "wrap", gap: 18, fontFamily: FONTS.text, fontWeight: 600, fontSize: 32, color: COLORS.text }}>
          {stars !== null && (
            <Pill>
              <Icon name="Star" size={34} color="#FFC24B" /> {formatNumberFr(count, 0, stars >= 10000)}
            </Pill>
          )}
          {s.langage && (
            <Pill>
              <span style={{ width: 20, height: 20, borderRadius: 10, background: LANG_COLORS[s.langage] ?? COLORS.orangeSoft }} /> {s.langage}
            </Pill>
          )}
          {s.licence && (
            <Pill>
              <Icon name="Scale" size={32} color={COLORS.dim} /> {s.licence}
            </Pill>
          )}
          {formatDateFr(s.mis_a_jour) && (
            <Pill>
              <Icon name="RefreshCw" size={30} color={COLORS.dim} /> {formatDateFr(s.mis_a_jour)}
            </Pill>
          )}
        </div>
      </div>
      {(s.points ?? []).length > 0 && (
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 16 }}>
          {(s.points ?? []).map((pt, i) => {
            const pi = enter(f, fps, sc.reveals[i] ?? 20 + i * 8);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, fontFamily: FONTS.text, fontWeight: 600, fontSize: 38, color: COLORS.text, ...riseStyle(pi, 30) }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="Check" size={36} color={accent} stroke={3} />
                </div>
                {pt}
              </div>
            );
          })}
        </div>
      )}
    </VisualZone>
  );
};

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
    {children}
  </div>
);

export const Chiffre: React.FC<SceneProps<"chiffre">> = ({ sc, f, fps, accent }) => {
  const s = sc.scene;
  const p = enter(f, fps, 0, 140, 14);
  const k = ease(f, 4, 40);
  const val = s.valeur * k;
  const text = `${s.prefixe ?? ""}${formatNumberFr(val, s.decimales)}`;
  const size = fitSize(text + (s.suffixe ?? ""), [[4, 300], [6, 250], [8, 200], [11, 160]], 130);
  const underline = ease(f, 30, 48);
  return (
    <VisualZone>
      <div style={{ textAlign: "center", ...riseStyle(p, 60) }}>
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: size,
            lineHeight: 1,
            letterSpacing: -6,
            background: `linear-gradient(180deg, #FFFFFF 0%, ${accent} 120%)`,
            WebkitBackgroundClip: "text",
            color: "transparent",
            textShadow: "none",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {text}
          {s.suffixe && <span style={{ fontSize: size * 0.42, letterSpacing: -1, marginLeft: 12 }}>{s.suffixe}</span>}
        </div>
        <div style={{ margin: "28px auto 0", width: `${underline * 46}%`, height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${COLORS.orange}, ${accent})` }} />
        <div style={{ marginTop: 34, fontFamily: FONTS.text, fontWeight: 600, fontSize: 46, lineHeight: 1.25, color: "#D7DCE8", opacity: enter(f, fps, 14) }}>{s.legende}</div>
      </div>
    </VisualZone>
  );
};

export const Citation: React.FC<SceneProps<"citation">> = ({ sc, f, fps, accent }) => {
  const s = sc.scene;
  const p = enter(f, fps, 0, 150, 16);
  const size = fitSize(s.texte, [[70, 62], [120, 52], [170, 46]], 40);
  return (
    <VisualZone>
      <div style={{ ...card, padding: "70px 60px 56px", position: "relative", ...riseStyle(p, 70) }}>
        <div style={{ position: "absolute", top: -30, left: 44, fontFamily: FONTS.display, fontWeight: 900, fontSize: 200, lineHeight: 1, color: accent, opacity: 0.9 }}>“</div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: size, lineHeight: 1.28, color: COLORS.text, letterSpacing: -0.4 }}>{s.texte}</div>
        <div style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 18, fontFamily: FONTS.text, fontWeight: 600, fontSize: 34, color: COLORS.dim, opacity: enter(f, fps, 12) }}>
          <div style={{ width: 50, height: 4, background: accent, borderRadius: 2 }} />
          {s.auteur}
        </div>
      </div>
    </VisualZone>
  );
};

export const Capture: React.FC<SceneProps<"capture">> = ({ sc, f, fps, accent, assetsBase }) => {
  const s = sc.scene;
  const p = enter(f, fps, 0, 150, 16);
  const z = s.zoom ?? { x: 0.5, y: 0.3, echelle: 1.15 };
  const k = interpolate(f, [0, sc.duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = 1 + (z.echelle - 1) * k;
  const hl = s.surlignage;
  const hlP = hl ? ease(f, sc.duration * 0.3, sc.duration * 0.3 + 12) : 0;
  const src = staticFile(`${assetsBase}/${s.image}`);
  return (
    <VisualZone>
      <div style={{ ...card, padding: 0, overflow: "hidden", height: s.legende ? 690 : 760, display: "flex", flexDirection: "column", ...riseStyle(p, 80) }}>
        <div style={{ height: 64, display: "flex", alignItems: "center", gap: 12, padding: "0 26px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
          ))}
          <div style={{ marginLeft: 18, flex: 1, height: 38, borderRadius: 19, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", padding: "0 20px", fontFamily: FONTS.mono, fontSize: 22, color: COLORS.dim, overflow: "hidden", whiteSpace: "nowrap" }}>
            {sc.sources[0]?.label ?? ""}
          </div>
        </div>
        <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: `${z.x * 100}% ${z.y * 100}%` }}>
            <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
            {hl && (
              <div
                style={{
                  position: "absolute",
                  left: `${hl.x * 100}%`,
                  top: `${hl.y * 100}%`,
                  width: `${hl.l * 100}%`,
                  height: `${hl.h * 100}%`,
                  borderRadius: 18,
                  border: `5px solid ${accent}`,
                  boxShadow: `0 0 0 9999px rgba(0,0,0,${0.45 * hlP}), 0 0 40px ${accent}`,
                  opacity: hlP,
                  transform: `scale(${1.15 - 0.15 * hlP})`,
                }}
              />
            )}
          </div>
        </div>
      </div>
      {s.legende && (
        <div style={{ marginTop: 26, textAlign: "center", fontFamily: FONTS.text, fontWeight: 600, fontSize: 38, color: COLORS.text, opacity: clamp01(enter(f, fps, 10)) }}>{s.legende}</div>
      )}
    </VisualZone>
  );
};
