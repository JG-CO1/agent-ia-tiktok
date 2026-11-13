import { Config } from "@remotion/cli/config";

// Rendu WebGL logiciel (pas de GPU sur les serveurs CI / conteneurs).
Config.setChromiumOpenGlRenderer("swangle");
Config.setPublicDir("./video/public");
Config.setEntryPoint("./video/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
// Navigateur imposé (ex. conteneur sans accès au téléchargement de Chrome Headless Shell).
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
