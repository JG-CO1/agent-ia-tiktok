/**
 * Contrôles automatiques de la mise en scène « huss » sur le minutage réel (image par image, 30 i/s) :
 *   tsx scripts/verifier-ville.ts <id>
 *  - le ballon ne traverse jamais le sol, le joueur ne flotte ni ne s'enfonce, la foule reste au sol ;
 *  - la caméra ne traverse aucune maison (ni la maison de fête) et ne passe pas sous le sol ;
 *  - le tir : le ballon traverse bien le centre de l'anneau, de haut en bas, à l'instant du mot « panier » ;
 *  - chaque HUSS (hors tir) a un rebond du ballon dans les 20 ms qui suivent le délai voulu ;
 *  - le ballon reste à portée de la main du joueur pendant le dribble.
 * Sort en erreur (code 1) au premier défaut.
 */
import fs from "node:fs";
import path from "node:path";
import { decouper, planCourant, dureeBlocs, type Minutage, type RecitBlocs } from "../video/histoire/blocs/decoupage";
import { plansDe } from "../video/histoire/blocs/plans-registre";
import { episodeDe } from "../video/histoire/blocs/ville/episodes/registre";
import { preparerVille, balleMain } from "../video/histoire/blocs/ville/donnees";
import { joueurA } from "../video/histoire/blocs/ville/joueur";
import { evaluer } from "../video/histoire/blocs/ville/foule";
import { versMonde } from "../video/histoire/blocs/geo";
import { FETE, MAISONS, PANIER_A, R_ANNEAU, R_BALLE } from "../video/histoire/blocs/ville/lieux";

const id = process.argv[2] ?? "huss-001";
const recit = JSON.parse(fs.readFileSync(path.resolve("histoires/recits", `${id}.json`), "utf8")) as RecitBlocs;
const minutage = JSON.parse(fs.readFileSync(path.resolve("histoires/sorties", id, "minutage.json"), "utf8")) as Minutage;
const ep = episodeDe((recit as { episode?: string }).episode ?? recit.id);
const d = preparerVille(recit, minutage, ep);
const plans = decouper(recit, minutage, plansDe(recit.mise_en_scene, ep.id));
const FPS = 30;
const N = Math.ceil(dureeBlocs(minutage) * FPS);
const erreurs: string[] = [];
const err = (m: string) => {
  if (erreurs.length < 40) erreurs.push(m);
};

// boîtes des bâtiments (monde) : [xmin, xmax, zmin, zmax, hauteurMax]
const boites: Array<{ nom: string; x0: number; x1: number; z0: number; z1: number; h: number }> = [];
MAISONS.forEach((m, i) => {
  const c = [versMonde(m.p, m.ry, [-m.w / 2, 0, 0]), versMonde(m.p, m.ry, [m.w / 2, 0, 0]), versMonde(m.p, m.ry, [-m.w / 2, 0, -m.d]), versMonde(m.p, m.ry, [m.w / 2, 0, -m.d])];
  boites.push({ nom: `maison ${i}`, x0: Math.min(...c.map((p) => p[0])), x1: Math.max(...c.map((p) => p[0])), z0: Math.min(...c.map((p) => p[2])), z1: Math.max(...c.map((p) => p[2])), h: m.h + 3.5 });
});
boites.push({ nom: "maison de fête", x0: FETE.o[0] - 18.5, x1: FETE.o[0] + 18.5, z0: FETE.o[2] - FETE.d - 1, z1: FETE.o[2] + 0.2, h: 14 });

const proximite = new Map<string, { n: number; min: number; f0: number }>();
let minBalle = 9;
let minPied = 9;
let maxMainBalle = 0;
const camMin = { y: 99 };
for (let f = 0; f < N; f++) {
  const T = f / FPS;
  const plan = planCourant(plans, T);
  const dd = Math.max(0.2, plan.fin - plan.debut);
  const loc = T - plan.debut;
  const etat = plan.def.etat({ p: Math.min(1, Math.max(0, loc / dd)), t: loc, d: dd, T, frame: f, mot: (k: number) => d.mot(plan.def.scene, k) - plan.debut, data: d });
  const [cx, cy, cz] = etat.cam.pos;
  if (![cx, cy, cz, ...etat.cam.look].every(Number.isFinite)) err(`image ${f} (${plan.def.id}) : caméra non finie`);
  camMin.y = Math.min(camMin.y, cy);
  if (cy < 0.25) err(`image ${f} (${plan.def.id}) : caméra sous le sol (y = ${cy.toFixed(2)})`);
  for (const b of boites) if (cx > b.x0 - 0.5 && cx < b.x1 + 0.5 && cz > b.z0 - 0.5 && cz < b.z1 + 0.5 && cy < b.h) err(`image ${f} (${plan.def.id}) : caméra dans ${b.nom} (${cx.toFixed(1)}, ${cy.toFixed(1)}, ${cz.toFixed(1)})`);

  const j = joueurA(T, d);
  // la caméra ne s'écrase pas contre un personnage (distance horizontale < 1,6, à hauteur d'avatar)
  if (cy < 5.2) {
    const proches: Array<[string, number, number]> = [["joueur", j.p[0], j.p[2]]];
    for (const h of d.habitants) {
      const a = evaluer(h, T, d.beat0);
      if (a) proches.push([h.id, a.p[0], a.p[2]]);
    }
    for (const [nom, x, z] of proches) {
      const dist = Math.hypot(cx - x, cz - z);
      if (dist < 1.6) {
        const cle = `${plan.def.id} / ${nom}`;
        const v = proximite.get(cle) ?? { n: 0, min: 99, f0: f };
        v.n++;
        v.min = Math.min(v.min, dist);
        proximite.set(cle, v);
      }
    }
  }
  minBalle = Math.min(minBalle, j.balle[1]);
  minPied = Math.min(minPied, j.p[1]);
  if (j.balle[1] < R_BALLE - 0.01) err(`image ${f} : le ballon traverse le sol (y = ${j.balle[1].toFixed(3)})`);
  if (j.p[1] < -0.001) err(`image ${f} : le joueur s'enfonce (y = ${j.p[1].toFixed(3)})`);
  if (j.mode === "dribble") {
    const main = balleMain(j.p, j.ry, j.balle[1]);
    maxMainBalle = Math.max(maxMainBalle, Math.hypot(main[0] - j.balle[0], main[2] - j.balle[2]));
  }
  for (const h of d.habitants) {
    const a = evaluer(h, T, d.beat0);
    if (a && (a.p[1] < 0 || Math.abs(a.p[1]) > 0.001)) err(`image ${f} : ${h.id} ne touche pas le sol`);
  }
}

// --- le tir : passage du ballon dans l'anneau
{
  let meilleur = 9;
  let tPass = 0;
  let prec = d.tir.trajet.position(0);
  for (let t = d.tir.lache + 1 / 240; t < d.tir.panier + 0.4; t += 1 / 240) {
    const p = d.tir.trajet.position(t - d.tir.lache);
    // passage de haut en bas à la hauteur de l'anneau (le ballon a d'abord traversé ce niveau à la montée : on l'ignore)
    if (prec[1] >= PANIER_A[1] && p[1] < PANIER_A[1]) {
      const h = Math.hypot(p[0] - PANIER_A[0], p[2] - PANIER_A[2]);
      if (h < meilleur) {
        meilleur = h;
        tPass = t;
      }
    }
    prec = p;
  }
  const marge = R_ANNEAU - R_BALLE;
  console.log(`panier : le ballon passe à ${meilleur.toFixed(3)} du centre de l'anneau (marge ${marge.toFixed(2)}) à ${tPass.toFixed(2)} s ; mot « panier » à ${d.mot(ep.tir.panier[0], ep.tir.panier[1]).toFixed(2)} s`);
  if (meilleur > marge) err(`le ballon ne passe pas dans l'anneau (écart ${meilleur.toFixed(2)})`);
  if (Math.abs(tPass - d.mot(ep.tir.panier[0], ep.tir.panier[1])) > 0.12) err(`le panier n'est pas sur le mot « panier » (écart ${(tPass - d.mot(ep.tir.panier[0], ep.tir.panier[1])).toFixed(2)} s)`);
}

// --- HUSS calés sur un rebond (hors HUSS du tir : le ballon est en main)
{
  const tous = [...d.impacts.avant, ...d.impacts.apres];
  let pire = 0;
  let n = 0;
  for (const h of d.huss) {
    if (h > d.tir.dernierImpact && h < d.tir.retour) continue;
    const attendu = h + 0.1;
    const proche = Math.min(...tous.map((t) => Math.abs(t - attendu)));
    pire = Math.max(pire, proche);
    n++;
    if (proche > 0.02) err(`HUSS à ${h.toFixed(2)} s : aucun rebond à ${attendu.toFixed(2)} s (écart ${proche.toFixed(3)} s)`);
  }
  console.log(`HUSS : ${d.huss.length} au total, ${n} calés sur un rebond, pire écart ${(pire * 1000).toFixed(0)} ms`);
  const gaps = tous.slice(1).map((t, i) => t - tous[i]).filter((g) => g < 2);
  console.log(`rebonds : ${tous.length}, intervalle ${Math.min(...gaps).toFixed(2)}–${Math.max(...gaps).toFixed(2)} s`);
}
console.log(`ballon : hauteur minimale ${minBalle.toFixed(3)} (rayon ${R_BALLE}) ; pieds : ${minPied.toFixed(3)} ; main–ballon (horizontal) au pire ${maxMainBalle.toFixed(3)} ; caméra la plus basse ${camMin.y.toFixed(2)}`);
for (const [cle, v] of proximite) err(`caméra contre un personnage : ${cle} — ${v.n} images (dès l'image ${v.f0}), distance minimale ${v.min.toFixed(2)}`);
console.log(`${N} images contrôlées, ${plans.length} plans`);
if (erreurs.length) {
  console.error(`\n${erreurs.length} défaut(s) :\n- ${erreurs.join("\n- ")}`);
  process.exit(1);
}
console.log("OK : aucun défaut détecté");
