/** Rend un sketch (histoires/sketches/<id>.json) en MP4 1080x1920. Usage : tsx scripts/render-sketch.ts sketch-001 [image-seule-en-secondes] */
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const id = process.argv[2];
if (!id) throw new Error("Usage : tsx scripts/render-sketch.ts <id> [secondes-pour-une-image]");
const data = JSON.parse(fs.readFileSync(path.resolve("histoires/sketches", `${id}.json`), "utf8"));
const out = path.resolve("histoires/sorties");
fs.mkdirSync(out, { recursive: true });
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || (process.env.CI ? null : "/usr/bin/google-chrome");
const chromiumOptions = { gl: "swangle" as const, disableWebSecurity: false };
const serveUrl = await bundle({ entryPoint: path.resolve("video/index.ts"), publicDir: path.resolve("video/public") });
const composition = await selectComposition({ serveUrl, id: "Sketch", inputProps: { data }, browserExecutable, chromiumOptions });
const still = process.argv[3];
if (still) {
  const frame = Math.round(Number(still) * composition.fps);
  await renderStill({ composition, serveUrl, output: path.join(out, `${id}-${still}s.png`), frame, inputProps: { data }, browserExecutable, chromiumOptions });
  console.log("image ->", path.join(out, `${id}-${still}s.png`));
} else {
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: path.join(out, `${id}.mp4`), inputProps: { data }, browserExecutable, chromiumOptions, crf: 20, pixelFormat: "yuv420p" });
  console.log("vidéo ->", path.join(out, `${id}.mp4`));
}
