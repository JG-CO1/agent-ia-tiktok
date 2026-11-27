/**
 * Empreinte d'IDENTITÉ d'Ecto : prouve que deux vidéos utilisent exactement le même personnage
 * (silhouette, proportions, matériaux, couleurs). Elle porte sur le modèle (geometry.ts), les matériaux (materials.ts)
 * et les matcaps pré-calculés. Les comportements ajoutés par-dessus (expressions, gestes, accessoires, colère, effets)
 * ne changent pas l'identité : ils sont dans face.ts, performance.ts, accessoires.ts, Accessoires3D.tsx, Ghost3D.tsx.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./paths";

export const FICHIERS_IDENTITE = ["geometry.ts", "materials.ts"] as const;

export function ghostVersion(): string {
  const dir = path.join(ROOT, "video/ghost");
  const h = crypto.createHash("sha256");
  for (const f of FICHIERS_IDENTITE) h.update(fs.readFileSync(path.join(dir, f)));
  for (const f of fs.readdirSync(path.join(ROOT, "video/public/matcaps")).sort()) h.update(fs.readFileSync(path.join(ROOT, "video/public/matcaps", f)));
  return h.digest("hex").slice(0, 12);
}
