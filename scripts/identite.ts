/**
 * Rend les visuels d'identité de la chaîne dans docs/identite/ à partir du code d'Ecto :
 * photo de profil et icône d'application (1024 x 1024), bannière YouTube (2560 x 1440).
 * Usage : npm run identite
 */
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const out = path.resolve("docs/identite");
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("video/index.ts"), publicDir: path.resolve("video/public") });

async function still(id: string, fichier: string) {
  const composition = await selectComposition({ serveUrl, id, inputProps: {}, browserExecutable, chromiumOptions: { gl: "swangle" } });
  const output = path.join(out, fichier);
  await renderStill({ composition, serveUrl, output, frame: 24, inputProps: {}, browserExecutable, chromiumOptions: { gl: "swangle" }, imageFormat: "png" });
  console.log("rendu", path.relative(process.cwd(), output), `${composition.width}x${composition.height}`);
  return output;
}

const avatar = await still("Avatar", "avatar-1024.png");
await still("Banniere", "banniere-youtube-2560x1440.png");
// Aperçu en rond (comme sur TikTok / YouTube) pour vérifier que rien n'est coupé.
execFileSync("convert", [avatar, "-resize", "320x320", "(", "+clone", "-threshold", "-1", "-negate", "-fill", "white", "-draw", "circle 160,160 160,0", ")", "-alpha", "off", "-compose", "copy_opacity", "-composite", path.join(out, "apercu-rond.png")]);
console.log("aperçu", "docs/identite/apercu-rond.png");
