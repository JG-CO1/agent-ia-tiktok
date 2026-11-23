import React, { useMemo } from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ensureFonts } from "../fonts";
import { dureeBlocs, motsAffiches, type Minutage } from "./blocs/decoupage";

ensureFonts();

/**
 * Format « stick » : bonhomme blanc, ombres géantes, fond sombre, un mot-concept à l'écran.
 * Style et règles : histoires/scripts-chatgpt/stickman-ombres.md. Tout est dessiné en SVG, piloté par le temps
 * de la narration (rien ne dépend de l'horloge). Coût de production : nul (aucune IA vidéo).
 */
const DISPLAY = "Inter Display, Inter, sans-serif";
const W = 1080;
const H = 1920;
const SOL = 1290; // ligne du sol
const COL = { fond1: "#101114", fond2: "#191B20", sol: "#292B31", perso: "#F4F4F1", ombre: "#050506", bord: "#2B2D34", gris: "#A7A9AF", rouge: "#A63C43" };

export type Pose = "idle" | "marche" | "assis" | "tombe" | "peur" | "leve" | "course";
export type SceneStick = {
  texte: string;
  decor?: "vide" | "fenetre" | "ville" | "couloir";
  fenetre?: "allumee" | "eteinte";
  lointain?: boolean; // petite silhouette pâle au loin
  perso?: { pose?: Pose; x?: number; face?: 1 | -1; valises?: number; absent?: boolean };
  foule?: { n: number; retournes?: number };
  ombre?: { type?: "geante" | "ego" | "peur"; x?: number; taille?: number };
  mot?: string;
  rouge?: boolean;
  cam?: "zoomIn" | "zoomOut" | "travG" | "travD";
  flash?: boolean;
  fondu?: boolean;
};
export type StickSpec = { id: string; titre: string; scenes: SceneStick[]; cloture: string };
export type StickProps = { spec: StickSpec; minutage: Minutage };

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

// ------------------------------------------------------------------ Bonhomme
const Bonhomme: React.FC<{ x: number; y: number; s: number; pose: Pose; t: number; face?: 1 | -1; valises?: number; phase?: number; trait?: string }> = ({ x, y, s, pose, t, face = 1, valises = 0, phase = 0, trait = COL.perso }) => {
  const tt = t + phase;
  const sw = pose === "marche" ? Math.sin(tt * 6) * 0.5 : pose === "course" ? Math.sin(tt * 11) * 0.8 : 0;
  const resp = Math.sin(tt * 2) * 1.5;
  const tremble = pose === "peur" ? Math.sin(tt * 45) * 2.2 : 0;
  const pencheDeg = Math.min(18, valises * 2.5) + (pose === "tombe" ? 28 : pose === "assis" ? 12 : 0);
  let hipY = -72;
  if (pose === "assis") hipY = -26;
  if (pose === "tombe") hipY = -34;
  const epaule = hipY - 70;
  const tete = { x: pose === "tombe" ? 10 : 0, y: epaule - 22 + (pose === "assis" || pose === "tombe" ? 8 : 0) };
  const L = 70;
  // jambes : [pied gauche, pied droit], coudes ignorés (traits simples)
  let jambes: Array<[number, number, number, number]> = [];
  if (pose === "assis") jambes = [[0, hipY, 62, hipY], [62, hipY, 62, 0]];
  else if (pose === "tombe") jambes = [[0, hipY, -58, hipY + 4], [0, hipY, 8, 0]];
  else jambes = [[0, hipY, Math.sin(sw) * L + 10, hipY + Math.cos(sw) * L], [0, hipY, -Math.sin(sw) * L - 10, hipY + Math.cos(sw) * L]];
  // bras
  const bras: Array<[number, number]> = [];
  const A = 60;
  if (pose === "leve") bras.push([Math.sin(2.6) * A + 10, epaule - Math.cos(2.6) * A * -1 * 0 - A * 0.9], [-Math.sin(0.4) * A, epaule + Math.cos(0.4) * A]);
  else if (pose === "peur") bras.push([A * 0.6, epaule - 10 + Math.sin(tt * 40) * 2], [-A * 0.6, epaule - 10 + Math.cos(tt * 40) * 2]);
  else if (pose === "tombe") bras.push([22, epaule + 55], [-6, epaule + 58]);
  else if (pose === "assis") bras.push([30, epaule + 46], [10, epaule + 50]);
  else bras.push([Math.sin(-sw) * A * 0.9 + 8, epaule + Math.cos(sw) * A], [Math.sin(sw) * A * 0.9 - 8, epaule + Math.cos(sw) * A]);
  const sc = `translate(${x + tremble} ${y + (pose === "idle" ? resp : 0)}) scale(${face * s} ${s}) rotate(${pencheDeg} 0 0)`;
  return (
    <g transform={sc} stroke={trait} strokeWidth={8} strokeLinecap="round" fill="none">
      {Array.from({ length: Math.min(6, valises) }).map((_, i) => (
        <g key={i} transform={`translate(${-62 - (i % 2) * 9} ${epaule + 28 - i * 50 + Math.sin(tt * 2 + i) * 1.5})`}>
          <rect width={62} height={46} rx={8} fill="#17181C" stroke="#4A4D57" strokeWidth={3} />
          <path d="M18 0 V-9 H44 V0" stroke="#4A4D57" strokeWidth={3} />
        </g>
      ))}
      <path d={`M0 ${hipY} L0 ${epaule}`} />
      {jambes.map((j, i) => <path key={i} d={`M${j[0]} ${j[1]} L${j[2]} ${j[3]}`} />)}
      {bras.map((b, i) => <path key={i} d={`M0 ${epaule} L${b[0]} ${b[1]}`} />)}
      <circle cx={tete.x} cy={tete.y} r={21} fill={COL.perso} stroke="none" />
    </g>
  );
};

// ------------------------------------------------------------------ Ombre géante
const OmbreGeante: React.FC<{ type: "geante" | "ego" | "peur"; x: number; taille: number; p: number; t: number }> = ({ type, x, taille, p, t }) => {
  const e = ease(p / 1);
  const k = taille * (0.35 + 0.65 * e);
  const monte = (1 - e) * 360;
  const balance = Math.sin(t * 0.9) * 0.6;
  const tete = type === "ego" ? 52 : 24;
  const bras = type === "peur" ? [[-150, -4], [150, -4]] : [[-74, -44], [74, -44]];
  return (
    <g transform={`translate(${x} ${SOL + 40 + monte}) scale(${k}) rotate(${balance} 0 0)`} fill={COL.ombre} stroke={COL.bord} strokeWidth={2.2 / Math.max(1, k / 3)} strokeLinejoin="round" opacity={0.98}>
      <circle cx={0} cy={-150 - (type === "ego" ? 14 : 0)} r={tete} />
      <path d="M-50 -132 L50 -132 L38 -66 L-38 -66 Z" />
      {bras.map((b, i) => <path key={i} d={`M${i ? 46 : -46} -126 L${b[0]} ${b[1]}`} strokeWidth={22} stroke={COL.ombre} fill="none" strokeLinecap="round" />)}
      <path d="M-22 -66 L-26 0 M22 -66 L26 0" strokeWidth={26} stroke={COL.ombre} fill="none" strokeLinecap="round" />
    </g>
  );
};

// ------------------------------------------------------------------ Décors
const Decor: React.FC<{ s: SceneStick; t: number }> = ({ s, t }) => {
  const lum = s.fenetre !== "eteinte";
  return (
    <g>
      <defs>
        <linearGradient id="fond" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COL.fond1} />
          <stop offset="1" stopColor={COL.fond2} />
        </linearGradient>
        <linearGradient id="sol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COL.sol} />
          <stop offset="1" stopColor="#15161A" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#fond)" />
      {s.decor === "fenetre" && (
        <g>
          <rect x={330} y={360} width={420} height={560} fill={lum ? "#E9EEF6" : "#0B0C0F"} opacity={lum ? 0.92 : 1} stroke="#3A3D46" strokeWidth={10} />
          <path d="M540 360 V920 M330 640 H750" stroke="#3A3D46" strokeWidth={8} />
          {lum && <path d={`M330 920 L750 920 L930 ${SOL} L150 ${SOL} Z`} fill="#fff" opacity={0.07} />}
        </g>
      )}
      {s.decor === "ville" && (
        <g>
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 260 + ((i * 97) % 5) * 70;
            return (
              <g key={i}>
                <rect x={i * 92 - 10} y={SOL - h} width={86} height={h} fill="#14161A" />
                {Array.from({ length: 4 }).map((__, j) => <rect key={j} x={i * 92 + 8 + (j % 2) * 36} y={SOL - h + 30 + Math.floor(j / 2) * 70} width={18} height={26} fill={((i + j) % 3 === 0) ? "#3A3D46" : "#1D1F25"} />)}
              </g>
            );
          })}
        </g>
      )}
      {s.decor === "couloir" && (
        <g stroke="#23252B" strokeWidth={4} fill="none">
          <path d={`M0 0 L440 760 M${W} 0 L640 760 M0 ${H} L440 900 M${W} ${H} L640 900`} />
          <rect x={440} y={760} width={200} height={140} fill="#0B0C0F" stroke="#23252B" />
        </g>
      )}
      <rect x={0} y={SOL} width={W} height={H - SOL} fill="url(#sol)" />
      <rect x={0} y={SOL - 2} width={W} height={3} fill="#3A3D46" opacity={0.7} />
      {s.lointain && <g opacity={0.3}><Bonhomme x={860} y={SOL - 10} s={0.45} pose="idle" t={t} /></g>}
    </g>
  );
};

// ------------------------------------------------------------------ Composition
export const Stick: React.FC<StickProps> = ({ spec, minutage }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const duree = dureeBlocs(minutage);
  const mots = useMemo(() => motsAffiches(minutage.mots), [minutage]);

  // scène courante
  let idx = 0;
  minutage.scenes.forEach((b, i) => { if (t >= b.debut) idx = i; });
  const sc = spec.scenes[Math.min(idx, spec.scenes.length - 1)];
  const bornes = minutage.scenes[Math.min(idx, minutage.scenes.length - 1)] ?? { debut: 0, fin: duree };
  const fin = idx >= minutage.scenes.length - 1 ? duree : bornes.fin;
  const d = Math.max(0.5, fin - bornes.debut);
  const loc = t - bornes.debut;
  const p = Math.min(1, Math.max(0, loc / d));

  // caméra
  const cam = sc.cam ?? "zoomIn";
  const z = cam === "zoomIn" ? 1 + 0.08 * p : cam === "zoomOut" ? 1.12 - 0.12 * p : 1.07;
  const tx = cam === "travG" ? 50 - 100 * p : cam === "travD" ? -50 + 100 * p : 0;

  // personnage
  const pr = sc.perso ?? {};
  const pose: Pose = pr.pose ?? "idle";
  const hx = (pr.x ?? 0.5) * W + (pose === "marche" || pose === "course" ? (pr.face === -1 ? -1 : 1) * (p - 0.5) * 120 : 0);
  const taille = sc.ombre?.taille ?? 6;

  // sous-titres : groupes de 3 mots max
  const groupes = useMemo(() => {
    const g: Array<{ texte: string; debut: number; fin: number }> = [];
    let cur: typeof mots = [];
    const clos = () => { if (cur.length) { g.push({ texte: cur.map((m) => m.texte).join(" "), debut: cur[0].debut, fin: cur[cur.length - 1].fin }); cur = []; } };
    for (const m of mots) {
      cur.push(m);
      if (cur.length >= 3 || /[.?!]$/.test(m.texte) || /[.?!]\s*[?!]?$/.test(m.texte)) clos();
    }
    clos();
    return g;
  }, [mots]);
  const gAff = groupes.find((g, i) => t >= g.debut - 0.02 && t < Math.max(g.fin + 0.1, (groupes[i + 1]?.debut ?? 0) - 0.02));

  // mot-concept
  const motT = loc - 0.1;
  const motOn = sc.mot && motT > 0 && loc < Math.min(2.6, d - 0.1);
  const motScale = 0.86 + 0.14 * ease(motT / 0.3);
  const motOp = motOn ? Math.min(1, motT / 0.15) * Math.min(1, (Math.min(2.6, d - 0.1) - loc) / 0.2) : 0;

  const flash = sc.flash ? Math.max(0, 0.85 - loc / 0.22) : 0;
  const noir = sc.fondu ? Math.max(0, 1 - loc / 0.45) : 0;
  const finCloture = Math.min(1, Math.max(0, (t - (duree - 2.4)) / 0.5));

  // foule
  const foule = sc.foule;
  const nFoule = foule?.n ?? 0;

  return (
    <AbsoluteFill style={{ background: COL.fond1 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${W / 2 + tx} ${H / 2}) scale(${z}) translate(${-W / 2} ${-H / 2})`}>
          <Decor s={sc} t={t} />
          {sc.ombre && <OmbreGeante type={sc.ombre.type ?? "geante"} x={(sc.ombre.x ?? 0.5) * W} taille={taille} p={Math.min(1, loc / 1.6)} t={t} />}
          {Array.from({ length: nFoule }).map((_, i) => {
            const rang = Math.floor(i / 9);
            const col = i % 9;
            const flip = i < (foule?.retournes ?? 0) ? -1 : 1;
            const marche = Math.sin(t * 3 + i) > -2 ? "marche" : "idle";
            return <Bonhomme key={i} x={70 + col * 118 + (rang % 2) * 40 + (flip === -1 ? -(p * 60) : p * 60)} y={SOL + 20 + rang * 70} s={0.62 + rang * 0.1} pose={marche as Pose} t={t} face={flip as 1 | -1} phase={i * 0.7} trait={i === 0 && flip === -1 ? "#FFFFFF" : "#D9D9D4"} />;
          })}
          {!pr.absent && <Bonhomme x={hx} y={SOL + 24} s={1.6} pose={pose} t={t} face={pr.face ?? 1} valises={pr.valises ?? 0} />}
        </g>
      </svg>

      {sc.mot && motOn && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 560, padding: "0 60px", textAlign: "center", fontFamily: DISPLAY, fontWeight: 900, fontSize: sc.mot.length > 9 ? 130 : 190, letterSpacing: 6, color: sc.rouge ? COL.rouge : "#FFFFFF", opacity: motOp, transform: `scale(${motScale})`, textTransform: "uppercase" }}>
          {sc.mot}
        </div>
      )}

      {gAff && finCloture < 0.2 && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1430, textAlign: "center", fontFamily: DISPLAY, fontWeight: 900, fontSize: 74, color: "#FFFFFF", WebkitTextStroke: "16px #000000", paintOrder: "stroke fill", lineHeight: 1.1 }}>
          {gAff.texte}
        </div>
      )}

      {finCloture > 0 && (
        <div style={{ position: "absolute", inset: 0, background: `rgba(5,5,6,${0.6 * finCloture})`, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 90px" }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, textAlign: "center", color: "#FFFFFF", opacity: finCloture, textTransform: "uppercase", lineHeight: 1.15 }}>{spec.cloture}</div>
        </div>
      )}

      {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: flash }} />}
      {noir > 0 && <AbsoluteFill style={{ background: "#000", opacity: noir }} />}

      {minutage.voix && <Audio src={staticFile(minutage.voix)} />}
      {minutage.musique && <Audio src={staticFile(minutage.musique)} loop volume={(f) => 0.1 * interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" })} />}
    </AbsoluteFill>
  );
};
