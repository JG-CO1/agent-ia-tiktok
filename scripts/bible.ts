/** Régénère les planches de référence de la bible visuelle (docs/bible/*.png) à partir du code d'Ecto. */
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { EXPRESSIONS } from "../video/ghost/face";
import { GESTURES } from "../video/ghost/performance";

const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const out = path.resolve("docs/bible");
const tmp = fs.mkdtempSync(path.join(out, ".tmp-"));
const serveUrl = await bundle({ entryPoint: path.resolve("video/index.ts"), publicDir: path.resolve("video/public") });

async function shot(props: Record<string, unknown>, file: string, frame = 24) {
  const composition = await selectComposition({ serveUrl, id: "Portrait", inputProps: props, browserExecutable, chromiumOptions: { gl: "swangle" } });
  await renderStill({ composition, serveUrl, output: file, frame, inputProps: props, browserExecutable, chromiumOptions: { gl: "swangle" }, imageFormat: "png" });
  return file;
}
async function sheet(name: string, items: Array<{ label: string; props: Record<string, unknown>; frame?: number }>, cols: number) {
  const files: string[] = [];
  for (const [i, it] of items.entries()) files.push(await shot(it.props, path.join(tmp, `${name}-${i}.png`), it.frame));
  execFileSync("montage", [...items.flatMap((it, i) => ["-label", it.label, files[i]]), "-tile", `${cols}x`, "-geometry", "300x300+8+8", "-background", "#101318", "-fill", "#E8ECF4", "-pointsize", "20", path.join(out, `${name}.png`)]);
  console.log("planche", name);
}

await sheet("expressions", EXPRESSIONS.map((e) => ({ label: e, props: { expression: e, geste: "repos" } })), 5);
await sheet("gestes", GESTURES.map((g) => ({ label: g, props: { expression: "neutre", geste: g }, frame: 18 })), 5);
await sheet(
  "angles",
  [
    { label: "face", props: { expression: "neutre", geste: "repos", rotY: 0 } },
    { label: "trois-quarts", props: { expression: "neutre", geste: "repos", rotY: 0.7 } },
    { label: "profil", props: { expression: "neutre", geste: "repos", rotY: 1.45 } },
    { label: "trois-quarts dos", props: { expression: "neutre", geste: "repos", rotY: 2.4 } },
  ],
  4,
);
fs.rmSync(tmp, { recursive: true, force: true });
