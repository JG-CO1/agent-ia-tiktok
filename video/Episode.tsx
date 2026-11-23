/** Composition principale : assemble fond, scènes, Ecto, sous-titres, habillage et audio à partir d'une Timeline. */
import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Timeline, TimelineScene } from "../src/core/timeline";
import { Background } from "./components/Background";
import { Captions } from "./components/Captions";
import { FormatBadge, ProgressBar, SourceBadge } from "./components/Chrome";
import { clamp01 } from "./components/anim";
import { pullTransform } from "../src/core/pull";
import { GhostLayer } from "./ghost/GhostLayer";
import { handsScreen, resolveGhost } from "./ghost/performance";
import { Rope } from "./components/Rope";
import { buildCameraPlan, cameraAt, layerToScreen, layerTransform, musicGain, screenToLayer } from "./camera/camera";
import { COLORS, FORMAT_STYLE, LAYOUT, layoutOf } from "./theme";
import { ensureFonts } from "./fonts";
import { Accroche, Cta, Titre } from "./scenes/plein";
import { Capture, Chiffre, Citation, Repo } from "./scenes/cartes";
import { Comparaison, Etapes, Liste } from "./scenes/listes";
import { Code, Terminal } from "./scenes/code";
import type { SceneProps } from "./scenes/common";

const IN = 8; // durée des transitions (frames)

const REGISTRY: Record<string, React.FC<any>> = {
  accroche: Accroche,
  titre: Titre,
  repo: Repo,
  terminal: Terminal,
  code: Code,
  etapes: Etapes,
  liste: Liste,
  comparaison: Comparaison,
  chiffre: Chiffre,
  citation: Citation,
  capture: Capture,
  cta: Cta,
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function transitionStyle(kind: string, tIn: number, tOut: number, nextKind: string): React.CSSProperties {
  const ei = easeOut(tIn);
  const eo = easeOut(tOut);
  let transform = "";
  let opacity = 1;
  let clipPath: string | undefined;
  let filter: string | undefined;
  if (tIn < 1) {
    if (kind === "glisse") {
      transform += ` translateX(${(1 - ei) * 520}px)`;
      opacity = tIn;
    } else if (kind === "zoom") {
      transform += ` scale(${1.22 - 0.22 * ei})`;
      opacity = tIn;
    } else if (kind === "balayage") {
      clipPath = `inset(0 0 0 ${(1 - ei) * 100}%)`;
    } else if (kind === "flash") {
      opacity = tIn > 0.3 ? 1 : 0;
    }
  }
  if (tOut > 0) {
    if (nextKind === "glisse") {
      transform += ` translateX(${-eo * 300}px)`;
      opacity *= 1 - tOut;
    } else if (nextKind === "zoom") {
      transform += ` scale(${1 - 0.12 * eo})`;
      opacity *= 1 - tOut;
      filter = `blur(${eo * 10}px)`;
    } else if (nextKind === "fondu") {
      opacity *= 1 - tOut;
    } else if (nextKind === "coupe" || nextKind === "flash") {
      opacity *= tOut > 0.6 ? 0 : 1;
    } else {
      opacity *= 1 - tOut * 0.4;
    }
  }
  return { transform: transform || undefined, opacity, clipPath, filter };
}

const SceneSlot: React.FC<{ sc: TimelineScene; next?: TimelineScene; tl: Timeline; accent: string }> = ({ sc, next, tl, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pull = tl.pulls.find((p) => p.scene === sc.index);
  const nextPull = next ? tl.pulls.find((p) => p.scene === next.index) : undefined;
  const start = sc.index === 0 ? 0 : pull ? pull.from : sc.from - IN;
  const end = next ? next.from : tl.durationInFrames;
  if (frame < start || frame >= end) return null;
  const f = frame - sc.from;
  const kind = pull ? "coupe" : sc.scene.transition ?? "glisse";
  const tIn = sc.index === 0 || kind === "coupe" ? 1 : clamp01((frame - start) / IN);
  const nextKind = nextPull ? "fondu" : next?.scene.transition ?? "glisse";
  const tOut = next && nextKind !== "balayage" ? clamp01((frame - (next.from - IN)) / IN) : 0;
  const punch = 1 + 0.035 * Math.exp(-Math.max(0, f) / 5);
  const Comp = REGISTRY[sc.type];
  const props: SceneProps & Record<string, unknown> = {
    sc: sc as SceneProps["sc"],
    f,
    fps,
    accent,
    assetsBase: tl.assetsBase,
    handle: tl.channel.handle,
    promesse: tl.channel.promesse,
  };
  const pt = pull && frame < pull.from + pull.dur + 24 ? pullTransform(pull, frame) : null;
  const pullStyle: React.CSSProperties = pt
    ? { transform: `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px) rotate(${pt.rot.toFixed(2)}deg) scale(${pt.scale.toFixed(4)})` }
    : {};
  return (
    <AbsoluteFill style={{ ...transitionStyle(kind, tIn, tOut, nextKind), zIndex: next && tIn < 1 ? 2 : 1, ...pullStyle }}>
      <AbsoluteFill style={{ transform: `scale(${pt ? 1 : punch})` }}>
        <Comp {...props} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Episode: React.FC<{ timeline: Timeline }> = ({ timeline: tl }) => {
  ensureFonts();
  const frame = useCurrentFrame();
  const style = FORMAT_STYLE[tl.format];
  const accent = style.accent;
  let current = tl.scenes[0];
  for (const s of tl.scenes) if (frame >= s.from) current = s;
  const layout = layoutOf(current.type);
  const flashScene = tl.scenes.find((s) => s.scene.transition === "flash" && frame >= s.from - 2 && frame < s.from + 5);
  const flash = flashScene ? 1 - Math.abs(frame - flashScene.from) / 5 : 0;
  // Caméra virtuelle : plan calculé une fois, état évalué à chaque image (le suivi d'Ecto utilise sa position réelle)
  const plan = useMemo(() => buildCameraPlan(tl), [tl]);
  const g = resolveGhost({ beats: tl.beats, envelope: tl.envelope, seed: tl.seed }, frame, tl.fps);
  const cam = cameraAt(plan, frame, { x: g.x, y: g.y, s: g.s });
  // Pendant « Ecto attrape la caméra », le badge de source s'efface (il passerait sur son visage)
  const grabbing = tl.beats.some((b) => b.anchor === "camera" && frame >= b.frame && frame < b.frame + 36);
  const fill: React.CSSProperties = { position: "absolute", inset: 0, transformOrigin: `${cam.ox}px ${cam.oy}px`, willChange: "transform" };
  return (
    <AbsoluteFill style={{ background: COLORS.bg0, overflow: "hidden" }}>
      {/* Parallaxe : fond lointain (déplacé peu, surdimensionné pour ne jamais montrer de bord), scènes, puis Ecto plus proche */}
      {!tl.debug?.includes("sans-fond") && (
        <div style={{ ...fill, transform: `${layerTransform(cam, 0.4)} scale(1.1)` }}>
          <Background accent={accent} />
        </div>
      )}
      <div style={{ ...fill, transform: layerTransform(cam, 1) }}>
        {tl.scenes.map((sc, i) => (
          <SceneSlot key={sc.id} sc={sc} next={tl.scenes[i + 1]} tl={tl} accent={accent} />
        ))}
      </div>
      {/* La corde vit dans le calque des tableaux ; la main d'Ecto (calque plus proche) y est reprojetée */}
      <div style={{ ...fill, transform: layerTransform(cam, 1) }}>
        <Rope pulls={tl.pulls} frame={frame} hand={screenToLayer(cam, 1, layerToScreen(cam, 1.12, handsScreen(g)))} />
      </div>
      {!tl.debug?.includes("sans-fantome") && (
        <div style={{ ...fill, transform: layerTransform(cam, 1.12) }}>
          <GhostLayer perf={{ beats: tl.beats, envelope: tl.envelope, seed: tl.seed }} />
        </div>
      )}
      {current.sources.length > 0 && layout === "split" && !grabbing && (
        <SourceBadge label={current.sources[0].label} y={LAYOUT.sourceY.split} localFrame={frame - current.from} />
      )}
      <Captions words={tl.words} y={LAYOUT.captions[layout]} accent={accent} />
      <FormatBadge accent={accent} label={style.label} handle={tl.channel.handle} />
      <ProgressBar accent={accent} />
      {flash > 0 && <AbsoluteFill style={{ background: "white", opacity: flash * 0.7 }} />}
      {tl.voiceSrc && <Audio src={staticFile(tl.voiceSrc)} />}
      {tl.sfx.map((c, i) => (
        <Sequence key={i} from={c.frame} durationInFrames={40} layout="none">
          <Audio src={staticFile(`sfx/${c.son}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
      {tl.musicSrc && (
        <Audio
          src={staticFile(tl.musicSrc)}
          loop
          volume={(f) => Math.min(1, tl.musicVolume * musicGain(tl, f))}
        />
      )}
    </AbsoluteFill>
  );
};
