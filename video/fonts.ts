import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const FILES: Array<[family: string, file: string, weight: string]> = [
  ["Inter Display", "InterDisplay-Black.otf", "900"],
  ["Inter Display", "InterDisplay-ExtraBold.otf", "800"],
  ["Inter Display", "InterDisplay-Bold.otf", "700"],
  ["Inter Display", "InterDisplay-SemiBold.otf", "600"],
  ["Inter", "Inter-Regular.otf", "400"],
  ["Inter", "Inter-Medium.otf", "500"],
  ["Inter", "Inter-SemiBold.otf", "600"],
  ["Inter", "Inter-Bold.otf", "700"],
  ["JetBrains Mono", "JetBrainsMono-Regular.ttf", "400"],
  ["JetBrains Mono", "JetBrainsMono-Medium.ttf", "500"],
  ["JetBrains Mono", "JetBrainsMono-Bold.ttf", "700"],
];

let loaded = false;
/** Charge les polices embarquées (licence OFL) : rendu identique sur toutes les machines. */
export function ensureFonts() {
  if (loaded) return;
  loaded = true;
  for (const [family, file, weight] of FILES) {
    loadFont({ family, url: staticFile(`fonts/${file}`), weight }).catch((e) => console.error("Police", file, e));
  }
}
