import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ensureFonts } from "../fonts";

ensureFonts();

/**
 * Format « Duel » : fond noir, bonshommes blancs sur des socles, une bougie chacun.
 * Chaque bougie = une force (Motivation, Talent…). Compteur de JOURS en rouge, compteur de flammes.
 * La dernière flamme allumée gagne (bleu). Scripts 100 % originaux.
 */
export type DuelScene = { texte: string; jour: [number, number]; eteints?: string[]; focus?: string };
export type DuelSpec = { id: string; format: "duel"; titre: string; acteurs: Array<{ nom: string; couleur?: "rouge" | "bleu" | "blanc" }>; scenes: DuelScene[]; cloture: string };
export type Mot = { texte: string; debut: number; fin: number; scene: number };
export type Minutage = { duree: number; mots: Mot[]; scenes: Array<{ debut: number; fin: number }>; voix: string | null; musique?: string | null };
export type DuelProps = { spec: DuelSpec; minutage: Minutage };

const DISPLAY = "Inter Display, Inter, sans-serif";
const COULEURS = { rouge: "#FF4B3E", bleu: "#4DA3FF", blanc: "#FFE9B8" } as const;

const Flamme: React.FC<{ cx: number; cy: number; couleur: string; vive: number; frame: number; seed: number }> = ({ cx, cy, couleur, vive, frame, seed }) => {
  const flick = 1 + 0.08 * Math.sin(frame / 3 + seed * 5) + 0.05 * Math.sin(frame / 1.7 + seed);
  const k = vive * flick;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={150 * vive} fill={couleur} opacity={0.22 * vive} />
      <circle r={80 * vive} fill={couleur} opacity={0.3 * vive} />
      <path d={`M 0 ${-70 * k} Q ${30 * k} ${-20 * k} ${16 * k} 0 Q 0 ${12 * k} ${-16 * k} 0 Q ${-30 * k} ${-20 * k} 0 ${-70 * k} Z`} fill={couleur} />
      <path d={`M 0 ${-34 * k} Q ${12 * k} ${-10 * k} 0 0 Q ${-12 * k} ${-10 * k} 0 ${-34 * k} Z`} fill="#fff" opacity={0.9} />
    </g>
  );
};

const Bonhomme: React.FC<{ x: number; nom: string; couleur: string; allume: boolean; vive: number; focus: boolean; frame: number; seed: number; fumee: number }> = ({ x, nom, couleur, allume, vive, focus, frame, seed, fumee }) => {
  const penche = allume ? 0 : 7;
  return (
    <g transform={`translate(${x} 0)`}>
      {/* libellé */}
      <text x={0} y={560} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={focus ? 34 : 28} letterSpacing={1} fill={focus ? couleur : allume ? "#BFC3CC" : "#4A4D55"}>{nom.toUpperCase()}</text>
      {/* socle */}
      <path d="M -78 1110 L 78 1110 L 90 1240 L -90 1240 Z" fill="#0A0A0C" stroke={allume ? "#F2F2F2" : "#6A6D75"} strokeWidth={8} strokeLinejoin="round" />
      {/* bonhomme */}
      <g transform={`rotate(${penche} 0 1100)`}>
        <line x1={0} y1={940} x2={0} y2={1100} stroke="#F2F2F2" strokeWidth={12} strokeLinecap="round" />
        <line x1={0} y1={970} x2={-58} y2={1042} stroke="#F2F2F2" strokeWidth={12} strokeLinecap="round" />
        <line x1={0} y1={970} x2={84} y2={896} stroke="#F2F2F2" strokeWidth={12} strokeLinecap="round" />
        <line x1={0} y1={1100} x2={-40} y2={1112} stroke="#F2F2F2" strokeWidth={12} strokeLinecap="round" />
        <line x1={0} y1={1100} x2={40} y2={1112} stroke="#F2F2F2" strokeWidth={12} strokeLinecap="round" />
        <circle cx={0} cy={896} r={42} fill="#0A0A0C" stroke="#F2F2F2" strokeWidth={10} />
        {/* bougie */}
        <rect x={74} y={808} width={20} height={92} rx={5} fill="#EDE6D3" stroke="#F2F2F2" strokeWidth={3} />
        <line x1={84} y1={808} x2={84} y2={796} stroke={allume ? "#F2F2F2" : "#777"} strokeWidth={4} />
        {allume ? (
          <Flamme cx={84} cy={796} couleur={couleur} vive={vive} frame={frame} seed={seed} />
        ) : (
          fumee > 0 &&
          [0, 1, 2].map((i) => {
            const p = Math.min(1, fumee + i * 0.12);
            return <circle key={i} cx={84 + Math.sin(frame / 7 + i * 2) * 10} cy={786 - p * 150 - i * 34} r={8 + p * 12} fill="#9AA0AB" opacity={(1 - p) * 0.5} />;
          })
        )}
      </g>
    </g>
  );
};

export const Duel: React.FC<DuelProps> = ({ spec, minutage }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = Math.max(0, minutage.scenes.findIndex((s, i) => t >= s.debut && (t < s.fin || i === minutage.scenes.length - 1)));
  const sc = spec.scenes[idx];
  const bornes = minutage.scenes[idx];
  const prog = Math.min(1, Math.max(0, (t - bornes.debut) / Math.max(0.1, bornes.fin - bornes.debut)));
  const jour = Math.max(1, Math.round(sc.jour[0] + (sc.jour[1] - sc.jour[0]) * prog));

  // moment d'extinction : 60 % de la scène
  const T_EXT = 0.6;
  const etat = spec.acteurs.map((a) => {
    const sortie = spec.scenes.findIndex((s) => s.eteints?.includes(a.nom));
    if (sortie < 0) return { allume: true, vive: 1, fumee: 0 };
    if (idx < sortie) return { allume: true, vive: 1, fumee: 0 };
    if (idx > sortie) return { allume: false, vive: 0, fumee: 1 };
    const b = minutage.scenes[sortie];
    const tExt = b.debut + (b.fin - b.debut) * T_EXT;
    if (t < tExt - 0.8) return { allume: true, vive: 1, fumee: 0 };
    if (t < tExt) return { allume: true, vive: interpolate(t, [tExt - 0.8, tExt], [1, 0.25]) * (0.6 + 0.4 * Math.abs(Math.sin(frame / 2))), fumee: 0 };
    return { allume: false, vive: 0, fumee: Math.min(1, (t - tExt) / 2.5) };
  });
  const flammes = etat.filter((e) => e.allume).length;
  const n = spec.acteurs.length;
  const xs = spec.acteurs.map((_, i) => 540 + (i - (n - 1) / 2) * (900 / Math.max(n - 1, 1)) * (n > 1 ? 0.92 : 0));

  const mots = minutage.mots.filter((m) => m.scene === idx);
  const groupes: Mot[][] = [];
  for (let i = 0; i < mots.length; i += 4) groupes.push(mots.slice(i, i + 4));
  const courant = groupes.find((g) => t >= g[0].debut - 0.05 && t <= g[g.length - 1].fin + 0.25) ?? groupes[groupes.length - 1] ?? [];
  const motActif = courant.find((m) => t >= m.debut && t <= m.fin + 0.05);
  const entree = spring({ frame: frame - 2, fps, config: { stiffness: 140, damping: 18 } });
  const fin = t > minutage.duree - 2.4;

  return (
    <AbsoluteFill style={{ background: "#030304", overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="scene" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0" stopColor="#14151C" />
            <stop offset="1" stopColor="#030304" />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#scene)" />
        <line x1={0} y1={1240} x2={1080} y2={1240} stroke="#2A2C34" strokeWidth={4} />
        <g transform="translate(0 40)" opacity={Math.min(1, entree * 1.6)}>
          {spec.acteurs.map((a, i) => (
            <Bonhomme key={a.nom} x={xs[i]} nom={a.nom} couleur={COULEURS[a.couleur ?? "blanc"]} allume={etat[i].allume} vive={etat[i].vive} focus={sc.focus === a.nom} frame={frame} seed={i} fumee={etat[i].fumee} />
          ))}
        </g>
      </svg>

      {/* Compteur de jours + flammes */}
      <div style={{ position: "absolute", top: 160, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ display: "inline-block", border: "5px solid #FF4B3E", borderRadius: 16, padding: "6px 38px", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 84, color: "#FF4B3E", background: "rgba(40,6,4,0.55)" }}>JOUR {jour}</div>
      </div>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ display: "inline-block", border: "4px solid #F2F2F2", borderRadius: 40, padding: "6px 34px", fontFamily: DISPLAY, fontWeight: 900, fontSize: 44, color: "#F2F2F2", letterSpacing: 2 }}>
          FLAMMES ALLUMÉES&nbsp;&nbsp;<span style={{ color: flammes <= 1 ? "#4DA3FF" : "#FFE9B8" }}>{flammes} / {n}</span>
        </div>
      </div>

      {/* Sous-titres */}
      <div style={{ position: "absolute", left: 50, right: 50, top: 1500, textAlign: "center", fontFamily: DISPLAY, fontWeight: 900, fontSize: 72, lineHeight: 1.12, textTransform: "uppercase" }}>
        {courant.map((m, i) => (
          <span key={i} style={{ color: t >= m.debut - 0.03 ? "#FFFFFF" : "#6C7080", letterSpacing: -1, WebkitTextStroke: "10px #000", paintOrder: "stroke fill", margin: "0 14px", display: "inline-block", transform: motActif === m ? "scale(1.08)" : undefined }}>
            {m.texte}
          </span>
        ))}
      </div>

      {fin && (
        <div style={{ position: "absolute", left: 80, right: 80, top: 640, textAlign: "center", opacity: interpolate(t, [minutage.duree - 2.4, minutage.duree - 1.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <div style={{ background: "#FFE14A", borderRadius: 30, padding: "26px 30px", fontFamily: DISPLAY, fontWeight: 900, fontSize: 70, color: "#0B0F1A" }}>{spec.cloture}</div>
        </div>
      )}

      {minutage.voix && <Audio src={staticFile(minutage.voix)} />}
      {minutage.musique && (
        <Audio loop src={staticFile(minutage.musique)} volume={(f) => 0.2 * interpolate(f, [0, 20, Math.ceil(minutage.duree * fps) - 45, Math.ceil(minutage.duree * fps) - 5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      )}
      {minutage.scenes.map((s, i) => (
        <Sequence key={i} from={Math.round(s.debut * fps)} durationInFrames={30} layout="none">
          <Audio src={staticFile("sfx/whoosh.wav")} volume={i === 0 ? 0 : 0.2} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
