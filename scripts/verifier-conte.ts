/**
 * Contrôles automatiques d'un récit sombre, image par image (30 i/s) sur le minutage réel :
 *   tsx scripts/verifier-conte.ts <id>
 *  - la caméra reste finie, au-dessus du sol, et ne s'écrase contre aucun personnage (3D, < 0,8) ;
 *  - aucun personnage ne s'enfonce sous le sol ou ne dépasse de sa pose (position finie) ;
 *  - chaque plan existe, démarre sur un mot réel et la durée de la vidéo est comprise entre 35 et 60 s.
 */
import fs from "node:fs";
import path from "node:path";
import { decouper, planCourant, dureeBlocs, type Minutage, type RecitBlocs } from "../video/histoire/blocs/decoupage";
import { plansDe } from "../video/histoire/blocs/plans-registre";
import { SCENES } from "../video/histoire/blocs/scenes";
import { evaluer } from "../video/histoire/blocs/ville/foule";
import type { DonneesConte } from "../video/histoire/blocs/conte/lib";

const id = process.argv[2];
if (!id) throw new Error("Usage : tsx scripts/verifier-conte.ts <id>");
const recit = JSON.parse(fs.readFileSync(path.resolve("histoires/recits", `${id}.json`), "utf8")) as RecitBlocs & { duree_min?: number };
const minutage = JSON.parse(fs.readFileSync(path.resolve("histoires/sorties", id, "minutage.json"), "utf8")) as Minutage;
if (recit.duree_min !== undefined) minutage.dureeMin = recit.duree_min;
const mes = SCENES[recit.mise_en_scene ?? ""];
const data = mes.preparer!(recit, minutage) as DonneesConte;
const plans = decouper(recit, minutage, plansDe(recit.mise_en_scene, recit.id));
const dur = dureeBlocs(minutage);
const N = Math.ceil(dur * 30);
const erreurs: string[] = [];
const proches = new Map<string, { n: number; min: number; f0: number }>();
for (let f = 0; f < N; f++) {
  const T = f / 30;
  const plan = planCourant(plans, T);
  const dd = Math.max(0.2, plan.fin - plan.debut);
  const loc = T - plan.debut;
  const etat = plan.def.etat({ p: Math.min(1, Math.max(0, loc / dd)), t: loc, d: dd, T, frame: f, mot: (k: number) => data.mot(plan.def.scene, k) - plan.debut, data });
  const [cx, cy, cz] = etat.cam.pos;
  if (![cx, cy, cz, ...etat.cam.look].every(Number.isFinite)) erreurs.push(`image ${f} (${plan.def.id}) : caméra non finie`);
  if (cy < 0.2) erreurs.push(`image ${f} (${plan.def.id}) : caméra sous le sol (${cy.toFixed(2)})`);
  for (const h of data.habitants) {
    const a = evaluer(h, T, 0);
    if (!a) continue;
    if (![a.p[0], a.p[1], a.p[2]].every(Number.isFinite)) erreurs.push(`image ${f} : ${h.id} position non finie`);
    const dist = Math.hypot(cx - a.p[0], cy - (a.p[1] + 1.4 * a.echelle), cz - a.p[2]);
    if (dist < 0.8) {
      const cle = `${plan.def.id} / ${h.id}`;
      const v = proches.get(cle) ?? { n: 0, min: 99, f0: f };
      v.n++;
      v.min = Math.min(v.min, dist);
      proches.set(cle, v);
    }
  }
}
for (const [cle, v] of proches) erreurs.push(`caméra contre un personnage : ${cle} — ${v.n} images (dès ${v.f0}), distance minimale ${v.min.toFixed(2)}`);
if (dur < 35 || dur > 60) erreurs.push(`durée ${dur.toFixed(1)} s hors de 35–60 s`);
console.log(`${id} : ${plans.length} plans, ${N} images, durée ${dur.toFixed(1)} s, voix jusqu'à ${data.finNarration.toFixed(1)} s`);
if (erreurs.length) {
  console.error(`\n${erreurs.length} défaut(s) :\n- ${erreurs.slice(0, 40).join("\n- ")}`);
  process.exit(1);
}
console.log("OK : aucun défaut détecté");
