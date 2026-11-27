// Contrôle numérique des caméras : rayons depuis la caméra contre la géométrie fixe du lieu (faces arrière = caméra dans un volume).
import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { decouper, type Minutage, type RecitBlocs } from "/home/user/agent-ia-tiktok/video/histoire/blocs/decoupage";
import { plansDe } from "/home/user/agent-ia-tiktok/video/histoire/blocs/plans-registre";
import { SCENES } from "/home/user/agent-ia-tiktok/video/histoire/blocs/scenes";
import { zone } from "/home/user/agent-ia-tiktok/video/histoire/blocs/conte/hamburgerinterdit/monde";
const id = "hamburger-interdit";
const recit = JSON.parse(fs.readFileSync(path.resolve("histoires/recits", `${id}.json`), "utf8")) as RecitBlocs & { duree_min?: number };
const minutage = JSON.parse(fs.readFileSync(path.resolve("histoires/sorties", id, "minutage.json"), "utf8")) as Minutage;
minutage.dureeMin = recit.duree_min;
const data = SCENES[recit.mise_en_scene!].preparer!(recit, minutage);
const plans = decouper(recit, minutage, plansDe(recit.mise_en_scene, recit.id));
const lieuDe = (p: number[]) => (p[0] < -200 ? "cuisine" : p[0] > 200 ? "grenier" : p[2] > 200 ? "salon" : "rue");
const meshes: Record<string, THREE.Mesh> = {};
const mesh = (l: string) => (meshes[l] ??= new THREE.Mesh(zone(l as any, 0), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })));
const filtre = process.argv.slice(2);
const ray = new THREE.Raycaster();
for (const pl of plans) {
  if (filtre.length && !filtre.some((f) => pl.def.id.startsWith(f))) continue;
  const out: string[] = [];
  for (const f of [0.02, 0.35, 0.7, 0.98]) {
    const t = pl.debut + (pl.fin - pl.debut) * f;
    const dd = pl.fin - pl.debut;
    const e = pl.def.etat({ p: f, t: t - pl.debut, d: dd, T: t, frame: Math.round(t * 30), mot: (k: number) => data.mot(pl.def.scene, k) - pl.debut, data });
    const cam = new THREE.PerspectiveCamera(e.cam.fov, 9 / 16, 0.12, 900);
    cam.position.set(...(e.cam.pos as [number, number, number]));
    cam.lookAt(...(e.cam.look as [number, number, number]));
    cam.updateMatrixWorld();
    const m = mesh(lieuDe(e.cam.pos));
    m.updateMatrixWorld();
    let back = 0, tot = 0, min = 999, sumd = 0;
    for (let i = -2; i <= 2; i++) for (let j = -4; j <= 4; j++) {
      ray.setFromCamera(new THREE.Vector2(i * 0.45, j * 0.22), cam);
      const h = ray.intersectObject(m)[0];
      tot++;
      if (h) {
        min = Math.min(min, h.distance);
        sumd += h.distance;
        if (h.face && h.face.normal.dot(ray.ray.direction) > 0) back++;
      }
    }
    // distance au premier obstacle sur le rayon central
    ray.setFromCamera(new THREE.Vector2(0, 0), cam);
    const hc = ray.intersectObject(m)[0];
    out.push(`t=${t.toFixed(1)} cam=${e.cam.pos.map((x: number) => x.toFixed(1)).join(",")} faceArr=${back}/${tot} min=${min.toFixed(1)} centre=${hc ? hc.distance.toFixed(1) : "∞"}`);
  }
  console.log(pl.def.id, "\n  " + out.join("\n  "));
}
