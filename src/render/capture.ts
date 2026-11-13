/** Capture d'écran d'une page publique (Playwright) pour illustrer un épisode ; l'asset est déclaré avec son origine. */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { journal, saveEpisode } from "../lib/episodes";
import { FmError, log } from "../lib/log";
import { episodeDir } from "../lib/paths";
import type { Episode } from "../schema/episode";

const require = createRequire(import.meta.url);

export async function capturePage(ep: Episode, url: string, name: string, opts: { selector?: string; height?: number } = {}) {
  if (!/^[\w.-]+\.(png|jpg)$/.test(name)) throw new FmError("Nom de fichier : lettres/chiffres, .png ou .jpg");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chromium: { launch: (o?: object) => Promise<any> };
  try {
    chromium = require("playwright").chromium;
  } catch {
    throw new FmError("Playwright absent : npm i -D playwright && npx playwright install chromium", "capture");
  }
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: opts.height ?? 1400 }, deviceScaleFactor: 1.6, colorScheme: "dark", locale: "fr-FR" });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);
    // Masque bannières cookies / invitations de connexion fréquentes
    await page.addStyleTag({ content: "[class*='cookie'],[id*='cookie'],[class*='consent'],.signup-prompt,.js-header-wrapper .HeaderMenu{display:none!important}" }).catch(() => undefined);
    const out = path.join(episodeDir(ep.id), "assets", name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const shot = { path: out, ...(name.endsWith(".jpg") ? { type: "jpeg" as const, quality: 86 } : {}) };
    if (opts.selector) await page.locator(opts.selector).first().screenshot(shot);
    else await page.screenshot(shot);
    ep.assets = ep.assets.filter((a) => a.fichier !== name);
    ep.assets.push({ fichier: name, origine: "capture", url, note: `Capture d'écran éditoriale du ${new Date().toISOString().slice(0, 10)}` });
    journal(ep, "capture", `${name} <- ${url}`);
    saveEpisode(ep);
    log("ok", "capture", `${path.relative(process.cwd(), out)}`);
  } finally {
    await browser.close();
  }
}
