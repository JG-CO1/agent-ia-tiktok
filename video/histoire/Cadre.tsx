import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ensureFonts } from "../fonts";

ensureFonts();

/**
 * Format « Cadre » : dessin 2D chaleureux (gros contours bruns, grosses têtes),
 * un seul MOT géant à la fois au centre-bas (blanc, contour noir), voix de narrateur.
 * Mystère « Pourquoi X… ? » + retournement émotionnel. Scripts 100 % originaux.
 */
export type CadreScene = { decor: string; persos?: string[]; emotion?: string; texte: string; horloge?: string };
export type CadreSpec = { id: string; format: "cadre"; titre: string; scenes: CadreScene[]; cloture: string };
export type Mot = { texte: string; debut: number; fin: number; scene: number };
export type Minutage = { duree: number; mots: Mot[]; scenes: Array<{ debut: number; fin: number }>; voix: string | null; musique?: string | null };
export type CadreProps = { spec: CadreSpec; minutage: Minutage };

const DISPLAY = "Inter Display, Inter, sans-serif";
const TRAIT = "#3B2418";
const PEAU = "#F1C9A4";

type PersoDef = { haut: string; bas: string; cheveux?: "gris-chignon" | "roux" | "brun" | "chauve"; lunettes?: boolean; taille?: number };
const PERSOS: Record<string, PersoDef> = {
  simone: { haut: "#D98BA0", bas: "#6B4A5A", cheveux: "gris-chignon", lunettes: true, taille: 0.92 },
  moi: { haut: "#4E8F6B", bas: "#2F3A4F", cheveux: "brun" },
  voisin: { haut: "#C9873B", bas: "#4A3A2A", cheveux: "chauve", taille: 1.02 },
};

const Visage: React.FC<{ e: string; blink: boolean; lunettes?: boolean }> = ({ e, blink, lunettes }) => {
  const oeil = (cx: number) => <ellipse cx={cx} cy={10} rx={11} ry={blink ? 2 : 15} fill={TRAIT} />;
  return (
    <g>
      {oeil(-52)}
      {oeil(52)}
      {lunettes && (
        <>
          <circle cx={-52} cy={10} r={34} fill="#fff" fillOpacity={0.15} stroke={TRAIT} strokeWidth={6} />
          <circle cx={52} cy={10} r={34} fill="#fff" fillOpacity={0.15} stroke={TRAIT} strokeWidth={6} />
          <line x1={-18} y1={8} x2={18} y2={8} stroke={TRAIT} strokeWidth={6} />
        </>
      )}
      <ellipse cx={-92} cy={50} rx={20} ry={11} fill="#E9967A" opacity={0.5} />
      <ellipse cx={92} cy={50} rx={20} ry={11} fill="#E9967A" opacity={0.5} />
      {(e === "triste" || e === "inquiet") && (
        <>
          <line x1={-80} y1={-24} x2={-30} y2={-36} stroke={TRAIT} strokeWidth={8} strokeLinecap="round" />
          <line x1={80} y1={-24} x2={30} y2={-36} stroke={TRAIT} strokeWidth={8} strokeLinecap="round" />
        </>
      )}
      {e === "choc" ? (
        <ellipse cx={0} cy={72} rx={16} ry={22} fill={TRAIT} />
      ) : e === "triste" || e === "inquiet" ? (
        <path d="M -26 84 Q 0 62 26 84" stroke={TRAIT} strokeWidth={8} fill="none" strokeLinecap="round" />
      ) : e === "sourire" ? (
        <path d="M -30 62 Q 0 98 30 62" stroke={TRAIT} strokeWidth={8} fill="#fff" strokeLinecap="round" />
      ) : e === "parle" ? (
        <ellipse cx={0} cy={72} rx={18} ry={14} fill={TRAIT} />
      ) : (
        <line x1={-20} y1={74} x2={20} y2={74} stroke={TRAIT} strokeWidth={8} strokeLinecap="round" />
      )}
      {e === "pleure" && <ellipse cx={-58} cy={50} rx={7} ry={14} fill="#7FC8F2" />}
    </g>
  );
};

const Perso: React.FC<{ nom: string; x: number; y: number; e: string; frame: number; parle?: boolean; flip?: boolean; seed?: number; tel?: boolean }> = ({ nom, x, y, e, frame, parle, flip, seed = 0, tel }) => {
  const d = PERSOS[nom] ?? PERSOS.moi;
  const s = (d.taille ?? 1) * 1.0;
  const bob = Math.sin(frame / 14 + seed) * 5;
  const blink = (frame + seed * 23) % 120 > 114;
  const emo = parle && Math.floor(frame / 5) % 2 === 0 ? "parle" : e;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx={0} cy={330} rx={150} ry={20} fill="#000" opacity={0.18} />
      {/* jambes */}
      <rect x={-62} y={150} width={44} height={170} rx={18} fill={d.bas} stroke={TRAIT} strokeWidth={8} />
      <rect x={18} y={150} width={44} height={170} rx={18} fill={d.bas} stroke={TRAIT} strokeWidth={8} />
      {/* torse */}
      <rect x={-100} y={-40} width={200} height={230} rx={70} fill={d.haut} stroke={TRAIT} strokeWidth={8} />
      {/* bras */}
      <rect x={-130} y={-10} width={44} height={170} rx={22} fill={d.haut} stroke={TRAIT} strokeWidth={8} transform="rotate(8 -108 -10)" />
      {tel ? (
        <g>
          <rect x={86} y={-150} width={44} height={170} rx={22} fill={d.haut} stroke={TRAIT} strokeWidth={8} transform="rotate(-18 108 20)" />
          <rect x={92} y={-210} width={36} height={64} rx={9} fill="#25304A" stroke={TRAIT} strokeWidth={6} transform="rotate(-10 110 -180)" />
        </g>
      ) : (
        <rect x={86} y={-10} width={44} height={170} rx={22} fill={d.haut} stroke={TRAIT} strokeWidth={8} transform="rotate(-8 108 -10)" />
      )}
      {/* tête */}
      <g transform="translate(0 -170)">
        {d.cheveux === "gris-chignon" && <circle cx={0} cy={-150} r={52} fill="#C9C9CF" stroke={TRAIT} strokeWidth={8} />}
        {d.cheveux === "roux" && <path d="M -120 -20 Q -150 -190 0 -170 Q 150 -190 120 -20 Q 60 -90 0 -70 Q -60 -90 -120 -20 Z" fill="#C8662B" stroke={TRAIT} strokeWidth={8} />}
        <ellipse cx={0} cy={0} rx={132} ry={128} fill={PEAU} stroke={TRAIT} strokeWidth={8} />
        {d.cheveux === "gris-chignon" && <path d="M -128 -10 Q -140 -130 0 -128 Q 140 -130 128 -10 Q 90 -70 0 -66 Q -90 -70 -128 -10 Z" fill="#C9C9CF" stroke={TRAIT} strokeWidth={8} />}
        {d.cheveux === "brun" && <path d="M -130 -8 Q -150 -150 0 -140 Q 150 -150 130 -8 Q 90 -78 0 -72 Q -90 -78 -130 -8 Z" fill="#5A3A28" stroke={TRAIT} strokeWidth={8} />}
        {d.cheveux === "chauve" && <ellipse cx={-118} cy={20} rx={16} ry={34} fill="#E5E5E8" stroke={TRAIT} strokeWidth={6} />}
        {d.cheveux === "chauve" && <ellipse cx={118} cy={20} rx={16} ry={34} fill="#E5E5E8" stroke={TRAIT} strokeWidth={6} />}
        <Visage e={emo} blink={blink} lunettes={d.lunettes} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ Décors
const Horloge: React.FC<{ x: number; y: number; texte: string }> = ({ x, y, texte }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={78} fill="#FFF6E5" stroke={TRAIT} strokeWidth={10} />
    <text y={14} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={700} fontSize={40} fill={TRAIT}>{texte}</text>
  </g>
);

const Hall: React.FC = () => (
  <g>
    <rect width={1080} height={1500} fill="#B6C4D6" />
    <rect y={1180} width={1080} height={320} fill="#8B7B6B" />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={i * 90 + (i % 2) * 0} y={1180} width={90} height={320} fill={i % 2 ? "#9A8A78" : "#8B7B6B"} stroke="#6F6254" strokeWidth={3} />
    ))}
    {/* boîtes aux lettres */}
    <rect x={60} y={300} width={460} height={340} rx={16} fill="#7A8798" stroke={TRAIT} strokeWidth={8} />
    {Array.from({ length: 4 }).map((_, r) =>
      Array.from({ length: 4 }).map((__, c) => (
        <g key={`${r}${c}`}>
          <rect x={80 + c * 112} y={322 + r * 78} width={96} height={62} rx={8} fill="#A9B6C6" stroke={TRAIT} strokeWidth={5} />
          <rect x={112 + c * 112} y={342 + r * 78} width={32} height={8} rx={4} fill={TRAIT} />
        </g>
      )),
    )}
    {/* porte */}
    <rect x={700} y={330} width={300} height={850} rx={20} fill="#8B5A3C" stroke={TRAIT} strokeWidth={10} />
    <circle cx={950} cy={780} r={14} fill="#F6D17A" stroke={TRAIT} strokeWidth={5} />
  </g>
);

const Salon: React.FC<{ frame: number; horloge?: string; sonne?: boolean; soir?: number }> = ({ frame, horloge, sonne, soir = 0 }) => (
  <g>
    <rect width={1080} height={1500} fill="#E9C99A" />
    <rect y={1190} width={1080} height={310} fill="#A9703F" />
    <rect y={1190} width={1080} height={14} fill="#7A4D2A" />
    {/* fenêtre */}
    <rect x={90} y={240} width={330} height={440} rx={14} fill={soir > 0.5 ? "#F2A15A" : "#9ED2F0"} stroke={TRAIT} strokeWidth={10} />
    <line x1={255} y1={240} x2={255} y2={680} stroke={TRAIT} strokeWidth={8} />
    <line x1={90} y1={460} x2={420} y2={460} stroke={TRAIT} strokeWidth={8} />
    {/* fauteuil */}
    <rect x={640} y={820} width={320} height={380} rx={60} fill="#B5523B" stroke={TRAIT} strokeWidth={8} />
    <rect x={610} y={950} width={100} height={250} rx={40} fill="#C5624B" stroke={TRAIT} strokeWidth={8} />
    <rect x={900} y={950} width={100} height={250} rx={40} fill="#C5624B" stroke={TRAIT} strokeWidth={8} />
    {/* table + téléphone */}
    <rect x={430} y={1010} width={150} height={20} rx={8} fill="#7A4D2A" stroke={TRAIT} strokeWidth={6} />
    <rect x={490} y={1030} width={30} height={170} fill="#7A4D2A" stroke={TRAIT} strokeWidth={6} />
    <g transform={`translate(505 ${985 + (sonne ? Math.sin(frame * 1.7) * 3 : 0)}) rotate(${sonne ? Math.sin(frame * 1.7) * 4 : 0})`}>
      <rect x={-38} y={-26} width={76} height={36} rx={9} fill="#25304A" stroke={TRAIT} strokeWidth={6} />
      <rect x={-28} y={-20} width={56} height={22} rx={5} fill={sonne ? "#7FE3A8" : "#3A4A6A"} />
    </g>
    {sonne &&
      [0, 1, 2].map((i) => {
        const p = ((frame / 28 + i / 3) % 1);
        return <circle key={i} cx={505} cy={980} r={40 + p * 120} fill="none" stroke="#7FE3A8" strokeWidth={8} opacity={(1 - p) * 0.8} />;
      })}
    {horloge && <Horloge x={540} y={330} texte={horloge} />}
    {/* lampe */}
    <rect x={960} y={260} width={10} height={280} fill={TRAIT} />
    <path d="M 910 320 L 1020 320 L 990 250 L 940 250 Z" fill="#F6D17A" stroke={TRAIT} strokeWidth={6} />
  </g>
);

const Decor: React.FC<{ type: string; frame: number; sc: CadreScene }> = ({ type, frame, sc }) => {
  if (type === "hall") return <Hall />;
  return <Salon frame={frame} horloge={sc.horloge} sonne={type === "salon-sonne"} soir={type === "salon-soir" ? 1 : 0} />;
};

// ------------------------------------------------------------------ Composition
const POSITIONS: Record<number, number[]> = { 1: [540], 2: [330, 760], 3: [210, 540, 870] };

export const Cadre: React.FC<CadreProps> = ({ spec, minutage }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = Math.max(0, minutage.scenes.findIndex((s, i) => t >= s.debut && (t < s.fin || i === minutage.scenes.length - 1)));
  const sc = spec.scenes[idx];
  const bornes = minutage.scenes[idx];
  const prog = Math.min(1, Math.max(0, (t - bornes.debut) / Math.max(0.1, bornes.fin - bornes.debut)));
  const local = frame - Math.round(bornes.debut * fps);
  const entree = spring({ frame: local, fps, config: { stiffness: 120, damping: 20 } });
  const zoom = 1.04 + 0.1 * prog;

  // un seul mot à la fois : visible du début du mot jusqu'au début du suivant
  const motIdx = minutage.mots.findIndex((m, i) => t >= m.debut && (i === minutage.mots.length - 1 || t < minutage.mots[i + 1].debut));
  const mot = motIdx >= 0 ? minutage.mots[motIdx] : undefined;
  const motVisible = mot && t <= mot.fin + 0.7;
  const pop = mot ? spring({ frame: frame - Math.round(mot.debut * fps), fps, config: { stiffness: 380, damping: 16 } }) : 1;
  const persos = sc.persos ?? ["moi"];
  const pos = POSITIONS[Math.min(3, persos.length)];
  const parleur = persos.length > 1 ? persos[Math.floor(idx % persos.length)] : persos[0];
  const enParole = !!mot && t >= mot.debut && t <= mot.fin + 0.05;
  const fin = t > minutage.duree - 2.4;

  return (
    <AbsoluteFill style={{ background: "#2B1B12", overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="vigC" cx="0.5" cy="0.45" r="0.8">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#1A0E08" stopOpacity="0.7" />
          </radialGradient>
        </defs>
        <g transform={`translate(540 760) scale(${zoom}) translate(-540 -760)`} opacity={Math.min(1, entree * 1.8)}>
          <g transform="translate(0 130)">
            <Decor type={sc.decor} frame={frame} sc={sc} />
            {persos.map((nom, i) => (
              <Perso key={nom + i} nom={nom} x={sc.decor === "salon-sonne" ? 270 : pos[i]} y={880} e={sc.emotion ?? "neutre"} frame={frame} parle={enParole && nom === parleur} flip={i % 2 === 1 && persos.length === 2} seed={i * 3} tel={sc.decor === "salon-appel" && nom === "simone"} />
            ))}
          </g>
        </g>
        <rect width={1080} height={1920} fill="url(#vigC)" />
        {/* bandes haut et bas pour le style cadré */}
        <rect y={1640} width={1080} height={280} fill="#1A0E08" opacity={0.55} />
      </svg>

      {/* Mot géant, un à la fois */}
      {motVisible && mot && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1330, textAlign: "center", fontFamily: DISPLAY, fontWeight: 900, fontSize: mot.texte.length > 9 ? 120 : 160, textTransform: "uppercase", letterSpacing: -2, color: "#fff", WebkitTextStroke: "26px #0B0B0B", paintOrder: "stroke fill", transform: `scale(${0.82 + 0.18 * Math.min(1.12, pop)})`, whiteSpace: "nowrap" }}>
          {mot.texte}
        </div>
      )}

      {fin && (
        <div style={{ position: "absolute", left: 70, right: 70, top: 560, textAlign: "center", opacity: interpolate(t, [minutage.duree - 2.4, minutage.duree - 1.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <div style={{ background: "#FFE14A", borderRadius: 30, padding: "26px 30px", fontFamily: DISPLAY, fontWeight: 900, fontSize: 70, color: "#0B0F1A", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>{spec.cloture}</div>
        </div>
      )}

      {minutage.voix && <Audio src={staticFile(minutage.voix)} />}
      {minutage.musique && (
        <Audio loop src={staticFile(minutage.musique)} volume={(f) => 0.18 * interpolate(f, [0, 20, Math.ceil(minutage.duree * fps) - 45, Math.ceil(minutage.duree * fps) - 5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      )}
      {minutage.scenes.map((s, i) => (
        <Sequence key={i} from={Math.round(s.debut * fps)} durationInFrames={30} layout="none">
          <Audio src={staticFile("sfx/whoosh.wav")} volume={i === 0 ? 0 : 0.2} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
