import React from "react";
import { Composition } from "remotion";
import { GhostLab } from "./GhostLab";
import { MatcapBake } from "./ghost/MatcapBake";
import { Portrait } from "./ghost/Portrait";
import { Episode } from "./Episode";
import { Avatar, Banniere } from "./identite/Identite";
import { buildTimeline, FPS, HEIGHT, WIDTH, type Timeline } from "../src/core/timeline";
import { estimatedVoice } from "../src/core/demo";
import { EpisodeSchema } from "../src/schema/episode";
import demo from "./demo/episode-demo.json";

const demoEpisode = EpisodeSchema.parse(demo);
const demoTimeline: Timeline = buildTimeline(demoEpisode, estimatedVoice(demoEpisode), {
  channel: { nom: "Studio Fantôme", handle: "@ton.compte", promesse: "1 outil Claude par jour" },
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
      <Composition id="MatcapBake" component={MatcapBake} durationInFrames={1} fps={30} width={512} height={512} defaultProps={{ materiau: "corps" as const }} />
      <Composition id="Portrait" component={Portrait} durationInFrames={60} fps={30} width={800} height={800} defaultProps={{ expression: "neutre" as const, geste: "repos" as const }} />
      <Composition id="GhostLab" component={GhostLab} durationInFrames={480} fps={30} width={1080} height={1920} defaultProps={{}} />
      <Composition id="Avatar" component={Avatar} durationInFrames={60} fps={30} width={1024} height={1024} />
      <Composition id="Banniere" component={Banniere} durationInFrames={60} fps={30} width={2560} height={1440} />
    </>
  );
};
