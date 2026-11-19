import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ensureFonts } from "../fonts";

ensureFonts();

export type SceneSpec = { decor: string; perso_emotion: string; texte: string; fille_emotion?: string; compteur?: [number, number] };
export type RecitSpec = { id: string; serie: string; episode: number; titre: string; scenes: SceneSpec[]; cloture: string };
export type Mot = { texte: string; debut: number; fin: number; scene: number };
export type Minutage = { duree: number; mots: Mot[]; scenes: Array<{ debut: number; fin: number }>; voix: string | null };
export type HistoireProps = { spec: RecitSpec; minutage: Minutage };

const DISPLAY = "Inter Display, Inter, sans-serif";
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ------------------------------------------------------------------ Personnages
type Emotion = string;
const Visage: React.FC<{ e: Emotion; blink: boolean }> = ({ e, blink }) => {
  const eye = (cx: number) => {
    const big = e === "choc";
    const ry = blink ? 2 : big ? 14 : 9;
    return <ellipse cx={cx} cy={-4} rx={big ? 10 : 8} ry={ry} fill="#0B0F1A" />;
  };
  const brow = e === "inquiet" || e === "triste";
  return (
    <g>
      {eye(-20)}
      {eye(20)}
      {brow && (
        <>
          <line x1={-32} y1={-24} x2={-10} y2={-30} stroke="#0B0F1A" strokeWidth={5} strokeLinecap="round" />
          <line x1={32} y1={-24} x2={10} y2={-30} stroke="#0B0F1A" strokeWidth={5} strokeLinecap="round" />
        </>
      )}
      {e === "choc" ? (
        <ellipse cx={0} cy={30} rx={10} ry={14} fill="#0B0F1A" />
      ) : e === "triste" || e === "inquiet" ? (
        <path d="M -16 36 Q 0 24 16 36" stroke="#0B0F1A" strokeWidth={5} fill="none" strokeLinecap="round" />
      ) : e === "sourire" ? (
        <path d="M -18 24 Q 0 46 18 24" stroke="#0B0F1A" strokeWidth={5} fill="none" strokeLinecap="round" />
      ) : (
        <line x1={-12} y1={32} x2={12} y2={32} stroke="#0B0F1A" strokeWidth={5} strokeLinecap="round" />
      )}
      {e === "triste" && <ellipse cx={-22} cy={22} rx={5} ry={9} fill="#7FD8FF" />}
    </g>
  );
};

const Perso: React.FC<{ x: number; y: number; s?: number; haut: string; bas?: string; cheveux?: string; e: Emotion; frame: number; flip?: boolean; bras?: "bas" | "tendu" | "leve"; queue?: boolean; chignon?: boolean; costume?: boolean; seed?: number }> = ({ x, y, s = 1, haut, bas = "#1B2140", cheveux, e, frame, flip, bras = "bas", queue, chignon, costume, seed = 0 }) => {
  const bob = Math.sin(frame / 12 + seed) * 4;
  const blink = (frame + seed * 17) % 110 > 104;
  const sx = flip ? -1 : 1;
  const armEnd = bras === "tendu" ? { x: 120, y: -90 } : bras === "leve" ? { x: 70, y: -170 } : { x: 55, y: 20 };
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s * sx} ${s})`}>
      <ellipse cx={0} cy={250} rx={80} ry={16} fill="#000" opacity={0.28} />
      {/* jambes */}
      <line x1={-24} y1={110} x2={-28} y2={246} stroke={bas} strokeWidth={30} strokeLinecap="round" />
      <line x1={24} y1={110} x2={28} y2={246} stroke={bas} strokeWidth={30} strokeLinecap="round" />
      {/* torse */}
      <rect x={-52} y={-60} width={104} height={190} rx={42} fill={haut} />
      {costume && <path d="M -14 -58 L 0 10 L 14 -58 Z" fill="#fff" />}
      {costume && <path d="M -6 -20 L 0 90 L 6 -20 Z" fill="#B3263E" />}
      {/* bras */}
      <line x1={-46} y1={-30} x2={-58} y2={60} stroke={haut} strokeWidth={26} strokeLinecap="round" />
      <line x1={46} y1={-30} x2={46 + armEnd.x - 46 + 0} y2={-30 + armEnd.y + 30} stroke={haut} strokeWidth={26} strokeLinecap="round" />
      {/* tête */}
      <g transform="translate(0 -128)">
        <circle r={72} fill="#FFFFFF" />
        {cheveux && <path d="M -72 -6 Q -70 -78 0 -78 Q 70 -78 72 -6 Q 40 -40 -10 -34 Q -50 -30 -72 -6 Z" fill={cheveux} />}
        {chignon && <circle cx={0} cy={-84} r={28} fill={cheveux} />}
        {queue && (
          <>
            <circle cx={-78} cy={10} r={20} fill={cheveux} />
            <circle cx={78} cy={10} r={20} fill={cheveux} />
          </>
        )}
        <Visage e={e} blink={blink} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ Décors
const Etoiles: React.FC<{ frame: number; n?: number }> = ({ frame, n = 40 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => (
      <circle key={i} cx={rnd(i) * 1080} cy={rnd(i + 50) * 700} r={1.5 + rnd(i + 9) * 2.5} fill="#fff" opacity={0.3 + 0.5 * Math.abs(Math.sin(frame / 25 + i))} />
    ))}
  </>
);

const Sphere: React.FC<{ cx: number; cy: number; r: number; frame: number; contenu?: "velo" | "enfants" | "vide"; fondu?: number }> = ({ cx, cy, r, frame, contenu = "velo", fondu = 0 }) => (
  <g>
    <circle cx={cx} cy={cy} r={r * 1.7} fill="url(#orbGlow)" opacity={0.7 + 0.2 * Math.sin(frame / 10)} />
    <circle cx={cx} cy={cy} r={r} fill="#CFEFFF" opacity={0.22} stroke="#BDEBFF" strokeWidth={5} />
    {contenu === "velo" && (
      <g opacity={1 - fondu} transform={`translate(${cx} ${cy}) scale(${r / 100})`}>
        <circle cx={-45} cy={30} r={28} fill="none" stroke="#fff" strokeWidth={7} />
        <circle cx={45} cy={30} r={28} fill="none" stroke="#fff" strokeWidth={7} />
        <path d="M -45 30 L -10 -20 L 25 -20 L 45 30 M -10 -20 L 0 30 L -45 30" stroke="#fff" strokeWidth={7} fill="none" strokeLinejoin="round" />
        <line x1={20} y1={-20} x2={14} y2={-42} stroke="#fff" strokeWidth={7} />
      </g>
    )}
    {contenu === "enfants" && (
      <g transform={`translate(${cx} ${cy}) scale(${r / 100})`}>
        <circle cx={-34} cy={-6} r={26} fill="#fff" />
        <rect x={-54} y={18} width={40} height={50} rx={16} fill="#FF8A3D" />
        <circle cx={34} cy={-14} r={22} fill="#fff" />
        <circle cx={14} cy={-6} r={12} fill="#6A3CC2" opacity={0.0} />
        <rect x={16} y={6} width={36} height={52} rx={14} fill="#8E5BE0" />
        <path d="M -44 -4 Q -34 8 -24 -4" stroke="#0B0F1A" strokeWidth={4} fill="none" />
        <path d="M 24 -10 Q 34 2 44 -10" stroke="#0B0F1A" strokeWidth={4} fill="none" />
      </g>
    )}
    <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.22} ry={r * 0.12} fill="#fff" opacity={0.55} transform={`rotate(-30 ${cx - r * 0.35} ${cy - r * 0.4})`} />
  </g>
);

const Decor: React.FC<{ type: string; frame: number; t: number; sc: SceneSpec; prog: number }> = ({ type, frame, t, sc, prog }) => {
  const bobPerso = frame;
  switch (type) {
    case "ville":
      return (
        <g>
          <rect width={1080} height={1920} fill="url(#nuit)" />
          <Etoiles frame={frame} />
          <circle cx={820} cy={330} r={70} fill="#F6F1D2" />
          <circle cx={850} cy={310} r={64} fill="#16204A" />
          {Array.from({ length: 9 }).map((_, i) => {
            const w = 110 + rnd(i) * 70;
            const h = 380 + rnd(i + 3) * 520;
            const x = i * 125 - 20;
            return (
              <g key={i}>
                <rect x={x} y={1330 - h} width={w} height={h} fill={i % 2 ? "#1A2350" : "#141B3E"} />
                {Array.from({ length: Math.floor(h / 70) }).map((__, r) =>
                  Array.from({ length: 2 }).map((___, c) => (
                    <rect key={`${r}-${c}`} x={x + 20 + c * 48} y={1330 - h + 30 + r * 70} width={26} height={34} fill={rnd(i * 31 + r * 7 + c) > 0.45 ? "#FFD36B" : "#232C5E"} opacity={0.9} />
                  )),
                )}
              </g>
            );
          })}
          <rect y={1330} width={1080} height={590} fill="#0C1128" />
          <rect y={1330} width={1080} height={14} fill="#2A3566" />
          {/* panneau */}
          <g transform="translate(150 1180)">
            <rect x={-8} y={-10} width={16} height={190} fill="#2A3566" />
            <rect x={-130} y={-80} width={260} height={90} rx={14} fill="#E0384B" />
            <text x={0} y={-22} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={34} fill="#fff">BANQUE</text>
          </g>
          <Perso x={640} y={1360} s={1.15} haut="#FF8A3D" cheveux="#5B3A22" e={sc.perso_emotion} frame={bobPerso} />
        </g>
      );
    case "lettre":
      return (
        <g>
          <rect width={1080} height={1920} fill="url(#piece)" />
          <rect y={1450} width={1080} height={470} fill="#2B1B17" />
          <rect y={1450} width={1080} height={12} fill="#5A3B30" />
          {/* enveloppe */}
          <g transform={`translate(540 ${1060 + Math.sin(frame / 14) * 10}) rotate(${Math.sin(frame / 30) * 2})`}>
            <rect x={-260} y={-170} width={520} height={340} rx={20} fill="#D8283F" stroke="#7A1020" strokeWidth={8} />
            <path d="M -260 -160 L 0 30 L 260 -160" fill="none" stroke="#7A1020" strokeWidth={8} />
            <circle cx={0} cy={30} r={42} fill="#FFD36B" stroke="#B88A1D" strokeWidth={6} />
            <text x={0} y={46} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={44} fill="#7A1020">!</text>
          </g>
          <g transform="translate(540 760)">
            <rect x={-300} y={-60} width={600} height={110} rx={18} fill="#fff" />
            <text x={0} y={-8} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={46} fill="#B3263E">DETTE : 380 JOURS</text>
            <text x={0} y={34} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={28} fill="#555">de souvenirs à rembourser</text>
          </g>
          <Perso x={210} y={1450} s={1.1} haut="#FF8A3D" cheveux="#5B3A22" e={sc.perso_emotion} frame={bobPerso} />
        </g>
      );
    case "banque":
    case "sphere":
    case "sphere2": {
      const orb = type !== "banque";
      return (
        <g>
          <rect width={1080} height={1920} fill="url(#banque)" />
          {/* piliers */}
          {[80, 330, 750, 1000].map((x, i) => (
            <g key={i}>
              <rect x={x - 28} y={560} width={56} height={760} fill="#2A3566" />
              <rect x={x - 42} y={560} width={84} height={26} fill="#3A4A8C" />
            </g>
          ))}
          <g transform="translate(540 500)">
            <rect x={-300} y={-60} width={600} height={100} rx={16} fill="#E0384B" />
            <text x={0} y={10} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={50} fill="#fff">BANQUE DES SOUVENIRS</text>
          </g>
          <rect y={1360} width={1080} height={560} fill="#0F1530" />
          {/* guichetier */}
          <Perso x={700} y={1080} s={1.15} haut="#7B849E" bas="#4A5170" cheveux="#222" e={orb && type === "sphere2" ? "neutre" : "sourire"} frame={bobPerso} costume seed={3} />
          {/* comptoir */}
          <rect x={0} y={1260} width={1080} height={200} fill="#5A3B30" />
          <rect x={0} y={1252} width={1080} height={22} fill="#7C5143" />
          {orb && <Sphere cx={420} cy={1120} r={90} frame={frame} contenu="velo" fondu={type === "sphere" ? interpolate(prog, [0.55, 0.95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1} />}
          <Perso x={230} y={1500} s={1.25} haut="#FF8A3D" cheveux="#5B3A22" e={type === "sphere2" ? "sourire" : sc.perso_emotion} frame={bobPerso} bras={orb ? "tendu" : "bas"} seed={1} />
          {type === "sphere2" &&
            Array.from({ length: 14 }).map((_, i) => {
              const p = ((t * 0.35 + rnd(i)) % 1);
              return <rect key={i} x={120 + rnd(i + 4) * 800} y={1200 - p * 900} width={36} height={46} rx={6} fill="#CFEFFF" opacity={(1 - p) * 0.7} transform={`rotate(${p * 160 + i * 20} ${120 + rnd(i + 4) * 800} ${1200 - p * 900})`} />;
            })}
        </g>
      );
    }
    case "porte":
      return (
        <g>
          <rect width={1080} height={1920} fill="url(#nuit)" />
          <Etoiles frame={frame} n={25} />
          <rect x={0} y={1000} width={1080} height={920} fill="#17102A" />
          <rect x={200} y={430} width={680} height={1050} rx={20} fill="#2D1F44" />
          <rect x={250} y={480} width={580} height={1000} fill="#FFD36B" opacity={0.9} />
          <rect x={250} y={480} width={580} height={1000} fill="url(#portLight)" />
          <rect y={1470} width={1080} height={450} fill="#0F0B1F" />
          <circle cx={540} cy={380} r={34} fill="#FFD36B" opacity={0.95} />
          <Perso x={640} y={1500} s={1.1} haut="#8E5BE0" bas="#3A2A66" cheveux="#2B1B3A" queue e={sc.fille_emotion ?? "triste"} frame={bobPerso} seed={5} />
          <Perso x={280} y={1590} s={1.35} haut="#FF8A3D" cheveux="#5B3A22" e={sc.perso_emotion} frame={bobPerso} flip={false} seed={2} />
        </g>
      );

    case "compteur":
      return (
        <g>
          <rect width={1080} height={1920} fill="url(#nuit)" />
          <Etoiles frame={frame} n={30} />
          <rect y={1330} width={1080} height={590} fill="#0C1128" />
          <g transform="translate(540 960)">
            <circle r={420} fill="url(#orbGlow)" opacity={0.35} />
            <rect x={-300} y={-170} width={600} height={340} rx={40} fill="#0B1020" stroke="#7FD8FF" strokeWidth={8} />
            <text x={0} y={-90} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={34} fill="#7FD8FF" letterSpacing={4}>FOIS OÙ TU REVERRAS TES PARENTS</text>
            <text x={0} y={90} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={700} fontSize={190} fill="#FF4D5E">{Math.round(sc.compteur ? sc.compteur[0] + (sc.compteur[1] - sc.compteur[0]) * prog : 0)}</text>
          </g>
          <Perso x={230} y={1500} s={1.1} haut="#FF8A3D" cheveux="#5B3A22" e={sc.perso_emotion} frame={bobPerso} />
        </g>
      );
    case "telephone":
      return (
        <g>
          <rect width={1080} height={1920} fill="url(#nuit)" />
          <Etoiles frame={frame} n={25} />
          <rect y={1400} width={1080} height={520} fill="#0C1128" />
          <g transform={`translate(700 ${1000 + Math.sin(frame / 6) * 8}) rotate(${Math.sin(frame / 4) * 3})`}>
            <rect x={-170} y={-260} width={340} height={520} rx={40} fill="#10162B" stroke="#fff" strokeWidth={6} />
            <rect x={-150} y={-240} width={300} height={480} rx={28} fill="#1B2A5E" />
            <circle cy={-80} r={70} fill="#8E5BE0" />
            <circle cy={-100} r={26} fill="#fff" />
            <rect x={-40} y={-66} width={80} height={46} rx={23} fill="#fff" />
            <text y={50} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={50} fill="#fff">MAMAN</text>
            <circle cx={-70} cy={150} r={42} fill="#E0384B" />
            <circle cx={70} cy={150} r={42} fill="#3DDC97" />
          </g>
          <Perso x={240} y={1500} s={1.1} haut="#FF8A3D" cheveux="#5B3A22" e={sc.perso_emotion} frame={bobPerso} bras="tendu" />
        </g>
      );
    case "maison":
      return (
        <g>
          <rect width={1080} height={1920} fill="url(#nuit)" />
          <Etoiles frame={frame} n={25} />
          <circle cx={880} cy={420} r={60} fill="#F6F1D2" />
          <rect y={1420} width={1080} height={500} fill="#10102A" />
          <rect x={180} y={820} width={720} height={600} fill="#4A3B63" />
          <path d="M 140 830 L 540 540 L 940 830 Z" fill="#7A2E3F" />
          <rect x={470} y={1090} width={140} height={330} rx={10} fill="#2A1B3A" />
          <rect x={250} y={900} width={150} height={150} fill="#FFD36B" />
          <rect x={680} y={900} width={150} height={150} fill="#FFD36B" />
          <rect x={250} y={900} width={150} height={150} fill="url(#portLight)" />
          <Perso x={330 + prog * 120} y={1560} s={1.2} haut="#FF8A3D" cheveux="#5B3A22" e={sc.perso_emotion} frame={bobPerso} />
        </g>
      );
    case "cuisine":
    case "cuisine2":
      return (
        <g>
          <rect width={1080} height={1920} fill="#2B1F2E" />
          <rect y={1450} width={1080} height={470} fill="#1B1322" />
          <rect x={620} y={640} width={360} height={360} rx={10} fill="#16204A" stroke="#6B5A7A" strokeWidth={10} />
          <circle cx={720} cy={740} r={34} fill="#F6F1D2" />
          <rect x={0} y={1180} width={1080} height={26} fill="#6B4A3B" />
          {/* table + assiette */}
          <rect x={120} y={1260} width={840} height={30} rx={10} fill="#8A6050" />
          <rect x={200} y={1290} width={26} height={170} fill="#6B4A3B" />
          <rect x={850} y={1290} width={26} height={170} fill="#6B4A3B" />
          <ellipse cx={540} cy={1252} rx={130} ry={22} fill="#F4F6FB" />
          <ellipse cx={540} cy={1240} rx={90} ry={14} fill="#FF9A3D" />
          {Array.from({ length: 5 }).map((_, i) => {
            const p = (t * 0.5 + i * 0.2) % 1;
            return <circle key={i} cx={520 + Math.sin(i * 3 + t * 2) * 30} cy={1220 - p * 160} r={14 + p * 14} fill="#fff" opacity={(1 - p) * 0.25} />;
          })}
          <Perso x={800} y={1470} s={1.2} haut="#C98B9E" bas="#3B2E4A" cheveux="#BDBDBD" chignon e={type === "cuisine2" ? "sourire" : "sourire"} frame={bobPerso} seed={4} flip />
          <Perso x={260} y={1500} s={1.2} haut="#FF8A3D" cheveux="#5B3A22" e={sc.perso_emotion} frame={bobPerso} seed={1} bras={type === "cuisine" ? "tendu" : "bas"} />
        </g>
      );
    case "reconnu":
      return (
        <g>
          <rect width={1080} height={1920} fill="#2B1F2E" />
          <rect y={1450} width={1080} height={470} fill="#1B1322" />
          <circle cx={540} cy={980} r={520} fill="url(#portLight)" opacity={0.6} />
          <rect x={430} y={1470} width={60} height={40} rx={8} fill="#10162B" stroke="#fff" strokeWidth={4} transform="rotate(-8 460 1490)" />
          <Perso x={340} y={1480} s={1.3} haut="#FF8A3D" cheveux="#5B3A22" e={sc.perso_emotion} frame={bobPerso} seed={1} />
          <Perso x={740} y={1480} s={1.3} haut="#C98B9E" bas="#3B2E4A" cheveux="#BDBDBD" chignon e="sourire" frame={bobPerso} seed={4} flip />
        </g>
      );
    default:
    case "fin":
      return (
        <g>
          <rect width={1080} height={1920} fill="#07091A" />
          <Etoiles frame={frame} n={30} />
          <Sphere cx={540} cy={1000} r={230} frame={frame} contenu="enfants" />
          <Perso x={190} y={1560} s={1.1} haut="#FF8A3D" cheveux="#5B3A22" e="choc" frame={bobPerso} seed={2} />
          <Perso x={890} y={1560} s={1.1} haut="#8E5BE0" bas="#3A2A66" cheveux="#2B1B3A" queue e="triste" frame={bobPerso} flip seed={5} />
        </g>
      );
  }
};

// ------------------------------------------------------------------ Sous-titres
const groupes = (mots: Mot[], taille = 4) => {
  const out: Mot[][] = [];
  for (let i = 0; i < mots.length; i += taille) out.push(mots.slice(i, i + taille));
  return out;
};

export const Histoire: React.FC<HistoireProps> = ({ spec, minutage }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = Math.max(0, minutage.scenes.findIndex((s, i) => t >= s.debut && (t < s.fin || i === minutage.scenes.length - 1)));
  const sc = spec.scenes[idx];
  const bornes = minutage.scenes[idx];
  const prog = Math.min(1, Math.max(0, (t - bornes.debut) / Math.max(0.1, bornes.fin - bornes.debut)));
  const local = frame - Math.round(bornes.debut * fps);
  const zoom = 1 + 0.07 * prog;
  const entree = spring({ frame: local, fps, config: { stiffness: 140, damping: 20 } });

  const mots = minutage.mots.filter((m) => m.scene === idx);
  const gr = groupes(mots, 4);
  const courant = gr.find((g) => t >= g[0].debut - 0.05 && t <= g[g.length - 1].fin + 0.25) ?? gr[gr.length - 1] ?? [];
  const motActif = courant.find((m) => t >= m.debut && t <= m.fin + 0.05);

  const titreP = spring({ frame: frame - 4, fps, config: { stiffness: 150, damping: 16 } });
  const fin = t > minutage.duree - 2.2;

  return (
    <AbsoluteFill style={{ background: "#07091A", overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="nuit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0A0F2E" />
            <stop offset="1" stopColor="#222C66" />
          </linearGradient>
          <linearGradient id="piece" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A2230" />
            <stop offset="1" stopColor="#1B1020" />
          </linearGradient>
          <linearGradient id="banque" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1A2350" />
            <stop offset="1" stopColor="#0F1530" />
          </linearGradient>
          <radialGradient id="orbGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#7FD8FF" stopOpacity="0.9" />
            <stop offset="1" stopColor="#7FD8FF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="portLight" cx="0.5" cy="0.5" r="0.7">
            <stop offset="0" stopColor="#FFF3C4" stopOpacity="0.8" />
            <stop offset="1" stopColor="#FFB347" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.6" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.6" />
          </radialGradient>
        </defs>
        <g transform={`translate(540 960) scale(${zoom * 1.03}) translate(-540 -1000)`} opacity={Math.min(1, entree * 1.6)}>
          <Decor type={sc.decor} frame={frame} t={t} sc={sc} prog={prog} />
        </g>
        <rect width={1080} height={1920} fill="url(#vig)" />
      </svg>

      {/* Titre */}
      <div style={{ position: "absolute", top: 150, left: 60, right: 60, opacity: Math.min(1, titreP * 2), transform: `translateY(${(1 - titreP) * -30}px)` }}>
        <div style={{ background: "#fff", borderRadius: 26, padding: "24px 32px", fontFamily: DISPLAY, fontWeight: 900, fontSize: 50, lineHeight: 1.12, textAlign: "center", color: "#0B0F1A", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>{spec.titre}</div>
        <div style={{ margin: "16px auto 0", width: "fit-content", background: "#FFE14A", borderRadius: 18, padding: "8px 26px", fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, color: "#0B0F1A" }}>ÉPISODE {spec.episode}</div>
      </div>

      {sc.compteur && sc.decor !== "compteur" && (
        <div style={{ position: "absolute", top: 440, right: 60, background: "#0B1020", border: "4px solid #7FD8FF", borderRadius: 20, padding: "10px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, color: "#7FD8FF", letterSpacing: 3 }}>COMPTEUR</div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 80, color: "#FF4D5E" }}>{Math.round(sc.compteur[0] + (sc.compteur[1] - sc.compteur[0]) * prog)}</div>
        </div>
      )}
      {/* Sous-titres */}
      <div style={{ position: "absolute", left: 50, right: 50, top: 1600, textAlign: "center", fontFamily: DISPLAY, fontWeight: 900, fontSize: 70, lineHeight: 1.15, textTransform: "uppercase" }}>
        {courant.map((m, i) => (
          <span key={i} style={{ color: motActif === m ? "#FFE14A" : "#FFFFFF", WebkitTextStroke: "10px #0B0F1A", paintOrder: "stroke fill", marginRight: 18, display: "inline-block", transform: motActif === m ? "scale(1.08)" : undefined }}>
            {m.texte}
          </span>
        ))}
      </div>

      {fin && (
        <div style={{ position: "absolute", left: 80, right: 80, top: 1150, textAlign: "center", opacity: interpolate(t, [minutage.duree - 2.2, minutage.duree - 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <div style={{ background: "#FFE14A", borderRadius: 30, padding: "26px 30px", fontFamily: DISPLAY, fontWeight: 900, fontSize: 70, color: "#0B0F1A", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>{spec.cloture}</div>
        </div>
      )}

      {minutage.voix && <Audio src={staticFile(minutage.voix)} />}
      {minutage.scenes.map((s, i) => (
        <Sequence key={i} from={Math.round(s.debut * fps)} durationInFrames={30} layout="none">
          <Audio src={staticFile("sfx/whoosh.wav")} volume={i === 0 ? 0.0 : 0.25} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
