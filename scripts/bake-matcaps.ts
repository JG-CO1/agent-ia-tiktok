/** Pré-calcule les matcaps d'Ecto (video/public/matcaps/*.png) depuis les matériaux physiques. */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { MATCAPS } from "../video/ghost/materials";

const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const out = path.resolve("video/public/matcaps");
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("video/index.ts"), publicDir: path.resolve("video/public") });
for (const materiau of MATCAPS) {
  const inputProps = { materiau };
  const composition = await selectComposition({ serveUrl, id: "MatcapBake", inputProps, browserExecutable, chromiumOptions: { gl: "swangle" } });
  await renderStill({ composition, serveUrl, output: path.join(out, `${materiau}.png`), inputProps, browserExecutable, chromiumOptions: { gl: "swangle" }, imageFormat: "png" });
  console.log("matcap", materiau);
}
