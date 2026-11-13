/** Scènes techniques : terminal animé et extrait de code. */
import React from "react";
import { COLORS, FONTS } from "../theme";
import { ease, enter, riseStyle } from "../components/anim";
import { card, VisualZone, type SceneProps } from "./common";

const WindowBar: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ height: 66, display: "flex", alignItems: "center", gap: 12, padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
    {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
      <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
    ))}
    <div style={{ flex: 1, textAlign: "center", marginRight: 80, fontFamily: FONTS.mono, fontWeight: 500, fontSize: 24, color: COLORS.dim }}>{title}</div>
  </div>
);

const LINE_STYLE = {
  cmd: { color: COLORS.text, prefix: "$ " },
  sortie: { color: "#AEB6C8", prefix: "" },
  commentaire: { color: "#6B7590", prefix: "# " },
  succes: { color: COLORS.green, prefix: "✓ " },
} as const;

/** Autorise un retour à la ligne après « / », « @ » et « - » plutôt qu'au milieu d'un mot. */
const softBreaks = (t: string) => t.replace(/([/@-])/g, "$1\u200B");

export const Terminal: React.FC<SceneProps<"terminal">> = ({ sc, f, fps, accent }) => {
  const s = sc.scene;
  const p = enter(f, fps, 0, 160, 16);
  const visible = s.lignes.map((_, i) => sc.reveals[i] ?? 8 + i * 12).filter((r) => f >= r).length;
  const longest = Math.max(...s.lignes.map((l) => l.texte.length + 2), 12);
  const termSize = Math.max(30, Math.min(37, Math.floor(870 / (longest * 0.61))));
  const cursorLine = Math.max(0, visible - 1);
  return (
    <VisualZone>
      <div style={{ ...card, background: COLORS.code, padding: 0, overflow: "hidden", ...riseStyle(p, 80) }}>
        <WindowBar title={s.titre ?? "terminal"} />
        <div style={{ padding: "38px 38px 44px", minHeight: 470, display: "flex", flexDirection: "column", gap: 16 }}>
          {s.lignes.map((l, i) => {
            const r = sc.reveals[i] ?? 8 + i * 12;
            if (f < r) return null;
            const st = LINE_STYLE[l.type];
            const typed = l.type === "cmd" ? Math.min(l.texte.length, Math.floor((f - r) * 1.7)) : l.texte.length;
            const shown = l.texte.slice(0, typed);
            const fade = l.type === "cmd" ? 1 : ease(f, r, r + 5);
            return (
              <div key={i} style={{ fontFamily: FONTS.mono, fontWeight: l.type === "cmd" ? 700 : 500, fontSize: termSize, lineHeight: 1.35, color: st.color, whiteSpace: "pre-wrap", overflowWrap: "break-word", opacity: fade }}>
                {st.prefix && <span style={{ color: l.type === "cmd" ? accent : st.color }}>{st.prefix}</span>}
                {softBreaks(shown)}
                {i === cursorLine && (Math.floor(f / 8) % 2 === 0 || typed < l.texte.length) && (
                  <span style={{ display: "inline-block", width: 18, height: 38, marginLeft: 4, verticalAlign: -6, background: accent }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </VisualZone>
  );
};

// Coloration syntaxique minimale (suffisante pour de courts extraits)
const KEYWORDS = /\b(import|from|export|const|let|function|return|async|await|if|else|for|def|class|true|false|null|None|npm|npx|claude|name|description)\b/g;
function highlight(line: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const comment = line.match(/^(\s*)(#|\/\/)(.*)$/);
  if (comment && !line.trim().startsWith("#!")) {
    // titres Markdown (#, ##) en couleur d'accent, commentaires en gris
    const isMdHeading = /^\s*#{1,3}\s/.test(line);
    return [<span key="c" style={{ color: isMdHeading ? "#FFB27F" : "#6B7590", fontWeight: isMdHeading ? 700 : 500 }}>{line}</span>];
  }
  const yamlKey = line.match(/^(\s*)([\w-]+)(:)(.*)$/);
  if (yamlKey) {
    out.push(<span key="i">{yamlKey[1]}</span>, <span key="k" style={{ color: "#7FD8FF" }}>{yamlKey[2]}</span>, <span key="p" style={{ color: COLORS.dim }}>:</span>);
    out.push(<span key="v" style={{ color: "#C3E88D" }}>{yamlKey[4]}</span>);
    return out;
  }
  let last = 0;
  const re = /("[^"]*"|'[^']*'|`[^`]*`)|\b(\d+)\b|(\b(?:import|from|export|const|let|function|return|async|await|if|else|for|def|class|true|false|null|None)\b)/g;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(<span key={k++}>{line.slice(last, m.index)}</span>);
    const color = m[1] ? "#C3E88D" : m[2] ? "#F78C6C" : "#C792EA";
    out.push(<span key={k++} style={{ color }}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(<span key={k++}>{line.slice(last)}</span>);
  void KEYWORDS;
  return out;
}

export const Code: React.FC<SceneProps<"code">> = ({ sc, f, fps, accent }) => {
  const s = sc.scene;
  const p = enter(f, fps, 0, 160, 16);
  const lines = s.code.replace(/\t/g, "  ").split("\n").slice(0, 16);
  const hl = new Set(s.surligner ?? []);
  const longest = Math.max(...lines.map((l) => l.length), 10);
  const byWidth = Math.floor(830 / (longest * 0.61));
  const size = Math.max(28, Math.min(lines.length > 12 ? 28 : lines.length > 8 ? 31 : 36, byWidth));
  return (
    <VisualZone>
      <div style={{ ...card, background: COLORS.code, padding: 0, overflow: "hidden", ...riseStyle(p, 80) }}>
        <WindowBar title={s.fichier ?? s.langage} />
        <div style={{ padding: "26px 0 32px" }}>
          {lines.map((line, i) => {
            const li = ease(f, 4 + i * 2, 12 + i * 2);
            const on = hl.has(i + 1);
            const hp = on ? ease(f, sc.duration * 0.25, sc.duration * 0.25 + 10) : 0;
            return (
              <div key={i} style={{ position: "relative", display: "flex", fontFamily: FONTS.mono, fontSize: size, lineHeight: 1.5, color: "#D6DCEA", opacity: li }}>
                {on && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${hp * 100}%`, background: `${accent}22`, borderLeft: `6px solid ${accent}` }} />}
                <div style={{ position: "relative", width: 84, textAlign: "right", paddingRight: 26, color: "#4B556B", flex: "0 0 auto" }}>{i + 1}</div>
                <div style={{ position: "relative", whiteSpace: "pre-wrap", overflowWrap: "break-word", minWidth: 0, paddingRight: 24 }}>{highlight(line)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </VisualZone>
  );
};
