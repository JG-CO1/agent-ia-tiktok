import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ensureFonts } from "../fonts";

ensureFonts();

export type Bulle = { t: number; texte: string; x: number; y: number; sfx?: string; fort?: boolean };
export type SketchData = {
  id: string;
  titre: string;
  duree_s: number;
  heure_depart: string;
  prevu_s: number;
  reel_s: number;
  compteur_debut_s: number;
  compteur_fin_s: number;
  bulles: Bulle[];
  fin: { t: number; texte: string };
};

const hms = (s: number) => {
  const v = Math.max(0, Math.floor(s));
  const h = Math.floor(v / 3600);
  const m = Math.floor((v % 3600) / 60);
  const sec = v % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const clock = (start: string, addS: number) => {
  const [h, m] = start.split(":").map(Number);
  const total = h * 3600 + m * 60 + addS;
  return { h: (total / 3600) % 12, m: (total / 60) % 60 };
};

const MONO = "JetBrains Mono, monospace";
const DISPLAY = "Inter Display, Inter, sans-serif";

const Bubble: React.FC<{ b: Bulle; frame: number; fps: number }> = ({ b, frame, fps }) => {
  const start = Math.round(b.t * fps);
  const p = spring({ frame: frame - start, fps, config: { stiffness: 220, damping: 14, mass: 0.6 } });
  const hold = 3.0 * fps;
  const out = interpolate(frame, [start + hold, start + hold + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < start) return null;
  const lines = b.texte.split("\n");
  const w = 560;
  const h = lines.length * 70 + 54;
  const shake = b.fort ? Math.sin(frame * 1.9) * 4 : 0;
  return (
    <g transform={`translate(${b.x + shake} ${b.y}) scale(${0.4 + 0.6 * p})`} opacity={out * Math.min(1, p * 2)} style={{ transformOrigin: `${b.x}px ${b.y}px` }}>
      <rect x={0} y={0} width={w} height={h} rx={34} fill={b.fort ? "#FFE14A" : "#FFFFFF"} stroke="#0B0F1A" strokeWidth={6} />
      <path d={`M ${w * 0.3} ${h - 2} L ${w * 0.38} ${h + 44} L ${w * 0.46} ${h - 2} Z`} fill={b.fort ? "#FFE14A" : "#FFFFFF"} stroke="#0B0F1A" strokeWidth={6} strokeLinejoin="round" />
      <rect x={w * 0.3 + 4} y={h - 8} width={w * 0.16 - 8} height={14} fill={b.fort ? "#FFE14A" : "#FFFFFF"} />
      {lines.map((l, i) => (
        <text key={i} x={w / 2} y={72 + i * 70} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={b.fort ? 60 : 52} fill="#0B0F1A">
          {l}
        </text>
      ))}
    </g>
  );
};

export const Sketch: React.FC<{ data: SketchData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Progression du compteur « réel » (lent puis très rapide).
  const prog = interpolate(t, [data.compteur_debut_s, data.compteur_fin_s], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.55, 0.05, 0.9, 0.6),
  });
  const reel = prog * data.reel_s;
  const hClock = clock(data.heure_depart, reel);
  const sleepy = interpolate(prog, [0, 1], [0, 1]);
  const moonX = interpolate(prog, [0, 1], [760, 930]);
  const moonY = interpolate(prog, [0, 1], [760, 730]);
  const flicker = 0.85 + 0.15 * Math.sin(frame * 0.9) * Math.sin(frame * 0.31);
  const bob = Math.sin(frame / 14) * 3;
  const blink = frame % 95 > 90 ? 0.12 : 1;
  const eyeOpen = Math.max(0.18, 1 - sleepy * 0.55) * blink;
  const wide = t > data.fin.t - 5 && t < data.fin.t - 1.5 ? 1 : 0;
  const reelHot = prog > 0.02;
  const pulse = 1 + (reelHot ? 0.03 * Math.sin(frame * 0.7) : 0);

  const titleP = spring({ frame: frame - 3, fps, config: { stiffness: 160, damping: 16 } });
  const countP = spring({ frame: frame - Math.round(0.4 * fps), fps, config: { stiffness: 150, damping: 15 } });
  const endP = spring({ frame: frame - Math.round(data.fin.t * fps), fps, config: { stiffness: 120, damping: 15 } });
  const showEnd = t >= data.fin.t;

  return (
    <AbsoluteFill style={{ background: "#0A0F1F" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#141B38" />
            <stop offset="1" stopColor="#0A0F1F" />
          </linearGradient>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#7FD8FF" stopOpacity="0.85" />
            <stop offset="1" stopColor="#7FD8FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0B1030" />
            <stop offset="1" stopColor="#1C2A5E" />
          </linearGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#wall)" />

        <g transform="translate(0 110)">
        {/* Fenêtre + lune */}
        <rect x={690} y={640} width={300} height={360} rx={12} fill="url(#sky)" stroke="#2A3566" strokeWidth={10} />
        <circle cx={moonX} cy={moonY} r={34} fill="#F6F1D2" />
        <circle cx={moonX + 12} cy={moonY - 8} r={30} fill="url(#sky)" />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={720 + i * 60} cy={680 + ((i * 37) % 90)} r={3} fill="#fff" opacity={0.4 + 0.4 * Math.sin(frame / 12 + i)} />
        ))}
        <line x1={840} y1={640} x2={840} y2={1000} stroke="#2A3566" strokeWidth={8} />
        <line x1={690} y1={820} x2={990} y2={820} stroke="#2A3566" strokeWidth={8} />

        {/* Horloge murale */}
        <g transform="translate(545 375)">
          <circle r={86} fill="#E9EDF7" stroke="#0B0F1A" strokeWidth={8} />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={0} y1={-70} x2={0} y2={-60} stroke="#0B0F1A" strokeWidth={5} transform={`rotate(${i * 30})`} />
          ))}
          <line x1={0} y1={0} x2={0} y2={-42} stroke="#0B0F1A" strokeWidth={9} strokeLinecap="round" transform={`rotate(${hClock.h * 30})`} />
          <line x1={0} y1={0} x2={0} y2={-62} stroke="#E0384B" strokeWidth={6} strokeLinecap="round" transform={`rotate(${hClock.m * 6})`} />
          <circle r={7} fill="#0B0F1A" />
        </g>

        {/* Sol + lit */}
        <rect x={0} y={1500} width={1080} height={420} fill="#0D1226" />
        <rect x={60} y={1330} width={960} height={150} rx={24} fill="#3A4A8C" />
        <rect x={60} y={1470} width={960} height={40} rx={10} fill="#222C5C" />

        {/* Lueur du téléphone */}
        <g opacity={flicker}>
          <circle cx={640} cy={1150 + bob} r={340} fill="url(#glow)" opacity={0.55} />
        </g>

        {/* Oreiller */}
        <rect x={120} y={1210} width={290} height={140} rx={60} fill="#C9D3F2" />

        {/* Corps du bonhomme (assis calé) */}
        <g transform={`translate(0 ${bob * 0.4})`}>
          <line x1={400} y1={1290} x2={640} y2={1400} stroke="#FFFFFF" strokeWidth={42} strokeLinecap="round" />
          {/* bras + téléphone */}
          <line x1={440} y1={1300} x2={600} y2={1190} stroke="#FFFFFF" strokeWidth={34} strokeLinecap="round" />
          <g transform={`translate(640 1130) rotate(${-12})`}>
            <rect x={-48} y={-82} width={96} height={164} rx={16} fill="#10162B" stroke="#FFFFFF" strokeWidth={5} />
            <rect x={-40} y={-74} width={80} height={148} rx={10} fill="#7FD8FF" opacity={0.55 + 0.4 * flicker} />
          </g>
          {/* tête */}
          <g transform={`translate(335 ${1215 + bob}) rotate(${-6 + sleepy * 10})`}>
            <circle r={84} fill="#FFFFFF" />
            {/* yeux */}
            <ellipse cx={22} cy={-10} rx={10 + wide * 4} ry={Math.max(2, (12 + wide * 10) * eyeOpen)} fill="#0B0F1A" />
            <ellipse cx={58} cy={-10} rx={10 + wide * 4} ry={Math.max(2, (12 + wide * 10) * eyeOpen)} fill="#0B0F1A" />
            {/* cernes */}
            <path d="M 8 12 Q 22 20 36 12" stroke="#7A6BB8" strokeWidth={6} fill="none" opacity={sleepy} strokeLinecap="round" />
            <path d="M 44 12 Q 58 20 72 12" stroke="#7A6BB8" strokeWidth={6} fill="none" opacity={sleepy} strokeLinecap="round" />
            <path d={wide ? "M 22 42 Q 40 62 60 42" : `M 22 ${44 + sleepy * 6} Q 40 ${40 + sleepy * 4} 60 ${44 + sleepy * 6}`} stroke="#0B0F1A" strokeWidth={6} fill="none" strokeLinecap="round" />
          </g>
        </g>

        {/* Couverture */}
        <path d="M 560 1380 Q 700 1320 1000 1370 L 1000 1490 L 540 1490 Z" fill="#E0384B" opacity={0.92} />

        </g>
        {/* Bulles */}
        {data.bulles.map((b, i) => (
          <Bubble key={i} b={b} frame={frame} fps={fps} />
        ))}
      </svg>

      {/* Titre */}
      <div style={{ position: "absolute", top: 150, left: 70, right: 70, opacity: Math.min(1, titleP * 2), transform: `translateY(${(1 - titleP) * -30}px)` }}>
        <div style={{ background: "#fff", borderRadius: 26, padding: "26px 36px", fontFamily: DISPLAY, fontWeight: 900, fontSize: 60, lineHeight: 1.12, textAlign: "center", color: "#0B0F1A", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>{data.titre}</div>
      </div>

      {/* Compteurs */}
      <div style={{ position: "absolute", top: 400, left: 70, right: 70, display: "flex", justifyContent: "space-between", opacity: Math.min(1, countP * 2), transform: `translateY(${(1 - countP) * 30}px)` }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, letterSpacing: 4, color: "#B8C2E0" }}>PRÉVU</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 84, color: "#FFFFFF", textShadow: "0 0 24px rgba(255,255,255,0.35)" }}>{hms(data.prevu_s)}</div>
        </div>
        <div style={{ textAlign: "right", transform: `scale(${pulse})`, transformOrigin: "right center" }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, letterSpacing: 4, color: "#FF7C8A" }}>RÉEL</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 84, color: "#FF4D5E", textShadow: "0 0 30px rgba(255,77,94,0.75)" }}>{hms(reel)}</div>
        </div>
      </div>

      {/* Carte de fin */}
      {showEnd && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1580, opacity: Math.min(1, endP * 2), transform: `scale(${0.85 + 0.15 * endP})` }}>
          <div style={{ background: "#FFE14A", borderRadius: 30, padding: "30px 30px", fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, lineHeight: 1.15, textAlign: "center", color: "#0B0F1A", whiteSpace: "pre-line", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>{data.fin.texte}</div>
        </div>
      )}

      {/* Sons */}
      <Sequence from={3} durationInFrames={30} layout="none">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} />
      </Sequence>
      {data.bulles.map((b, i) => (
        <Sequence key={i} from={Math.round(b.t * fps)} durationInFrames={40} layout="none">
          <Audio src={staticFile(`sfx/${b.sfx ?? "pop"}.wav`)} volume={b.sfx === "impact" ? 0.9 : 0.6} />
        </Sequence>
      ))}
      <Sequence from={Math.round(data.fin.t * fps)} durationInFrames={40} layout="none">
        <Audio src={staticFile("sfx/ding.wav")} volume={0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};
