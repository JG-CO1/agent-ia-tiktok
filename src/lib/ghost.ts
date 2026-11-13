/** Empreinte du code du personnage (video/ghost) : prouve que deux vidéos utilisent exactement le même Ecto. */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./paths";

export function ghostVersion(): string {
  const dir = path.join(ROOT, "video/ghost");
  const h = crypto.createHash("sha256");
  for (const f of fs.readdirSync(dir).sort()) if (f.endsWith(".ts") || f.endsWith(".tsx")) h.update(fs.readFileSync(path.join(dir, f)));
  for (const f of fs.readdirSync(path.join(ROOT, "video/public/matcaps")).sort()) h.update(fs.readFileSync(path.join(ROOT, "video/public/matcaps", f)));
  return h.digest("hex").slice(0, 12);
}
