/**
 * Rend une série de stills d'une composition avec un seul bundle, puis les assemble en planche.
 * Usage : tsx scripts/lab-stills.ts <compositionId> <sortie.png> '<json: [{frame, props, label}]>'
 */
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const [compId, outFile, specJson] = process.argv.slice(2);
const specs: Array<{ frame: number; props?: Record<string, unknown>; label?: string }> = JSON.parse(specJson);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;

const serveUrl = await bundle({ entryPoint: path.resolve("video/index.ts"), publicDir: path.resolve("video/public") });
const tmpDir = fs.mkdtempSync(path.join(path.dirname(outFile), "stills-"));
const files: string[] = [];
for (const [i, s] of specs.entries()) {
  const composition = await selectComposition({ serveUrl, id: compId, inputProps: s.props ?? {}, browserExecutable, chromiumOptions: { gl: "swangle" } });
  const f = path.join(tmpDir, `${String(i).padStart(2, "0")}.png`);
  await renderStill({ composition, serveUrl, output: f, frame: s.frame, inputProps: s.props ?? {}, browserExecutable, chromiumOptions: { gl: "swangle" }, imageFormat: "png" });
  files.push(f);
}
// Planche : montage ImageMagick (réduit à 1/3)
const labeled = files.map((f, i) => ["-label", specs[i].label ?? `#${i}`, f]).flat();
execFileSync("montage", [...labeled, "-tile", `${Math.min(4, files.length)}x`, "-geometry", "360x640+6+6", "-background", "#222", "-fill", "white", "-pointsize", "22", outFile]);
console.log(outFile);
