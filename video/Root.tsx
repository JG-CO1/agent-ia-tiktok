import React from "react";
import { Composition } from "remotion";
import { GhostLab } from "./GhostLab";
import { MatcapBake } from "./ghost/MatcapBake";
import { Portrait } from "./ghost/Portrait";
import { Episode } from "./Episode";
import { Sketch, type SketchData } from "./sketch/Sketch";
import { Histoire, type HistoireProps } from "./histoire/Histoire";
import { Blocs, type BlocsProps } from "./histoire/Blocs";
import { dureeBlocs } from "./histoire/blocs/decoupage";
import { Cadre, type CadreProps } from "./histoire/Cadre";
import { Duel, type DuelProps } from "./histoire/Duel";
import cadreDemo from "../histoires/recits/cadre-001.json";
import duelDemo from "../histoires/recits/duel-001.json";
import histoireDemo from "../histoires/recits/histoire-001.json";
import sketchDemo from "../histoires/sketches/sketch-001.json";
import { Avatar, Banniere } from "./identite/Identite";
import { buildTimeline, FPS, HEIGHT, WIDTH, type Timeline } from "../src/core/timeline";
import { estimatedVoice } from "../src/core/demo";
import { EpisodeSchema } from "../src/schema/episode";
import demo from "./demo/episode-demo.json";

const demoEpisode = EpisodeSchema.parse(demo);
const demoTimeline: Timeline = buildTimeline(demoEpisode, estimatedVoice(demoEpisode), {
  channel: { nom: "Studio Fantôme", handle: "Studio Fantôme", promesse: "1 astuce Claude par jour" },
  voiceSrc: "",
  assetsBase: "episodes/demo",
  musicSrc: "musique/ambiance-studio.m4a",
});

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Episode"
        component={Episode}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        durationInFrames={demoTimeline.durationInFrames}
        defaultProps={{ timeline: demoTimeline }}
        calculateMetadata={({ props }) => ({ durationInFrames: props.timeline.durationInFrames })}
      />
      <Composition
        id="Sketch"
        component={Sketch}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={Math.round((sketchDemo as SketchData).duree_s * 30)}
        defaultProps={{ data: sketchDemo as SketchData }}
        calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.data.duree_s * 30) })}
      />
      <Composition
        id="Histoire"
        component={Histoire}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={30 * 80}
        defaultProps={{ spec: histoireDemo as unknown as HistoireProps["spec"], minutage: { duree: 80, mots: [], scenes: [{ debut: 0, fin: 80 }], voix: null } }}
        calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(props.minutage.duree * 30) })}
      />
      <Composition
        id="Blocs"
        component={Blocs}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={30 * 70}
        defaultProps={{ spec: { id: "demo", titre: "Demo", cloture: "Et toi ?", scenes: [{ texte: "demo" }] } as BlocsProps["spec"], minutage: { duree: 70, mots: [], scenes: [{ debut: 0, fin: 70 }], voix: null } }}
        calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(dureeBlocs(props.minutage) * 30) })}
      />
      <Composition
        id="Cadre"
        component={Cadre}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={30 * 70}
        defaultProps={{ spec: cadreDemo as unknown as CadreProps["spec"], minutage: { duree: 70, mots: [], scenes: [{ debut: 0, fin: 70 }], voix: null } }}
        calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(props.minutage.duree * 30) })}
      />
      <Composition
        id="Duel"
        component={Duel}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={30 * 60}
        defaultProps={{ spec: duelDemo as unknown as DuelProps["spec"], minutage: { duree: 60, mots: [], scenes: [{ debut: 0, fin: 60 }], voix: null } }}
        calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(props.minutage.duree * 30) })}
      />
      <Composition id="MatcapBake" component={MatcapBake} durationInFrames={1} fps={30} width={512} height={512} defaultProps={{ materiau: "corps" as const }} />
      <Composition id="Portrait" component={Portrait} durationInFrames={60} fps={30} width={800} height={800} defaultProps={{ expression: "neutre" as const, geste: "repos" as const }} />
      <Composition id="GhostLab" component={GhostLab} durationInFrames={480} fps={30} width={1080} height={1920} defaultProps={{}} />
      <Composition id="Avatar" component={Avatar} durationInFrames={60} fps={30} width={1024} height={1024} />
      <Composition id="Banniere" component={Banniere} durationInFrames={60} fps={30} width={2560} height={1440} />
    </>
  );
};
