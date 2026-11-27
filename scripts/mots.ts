/** Affiche, scène par scène, les mots indexés (indice dans la scène) avec leur instant réel : tsx scripts/mots.ts <id> */
import fs from "node:fs";
import path from "node:path";
const id = process.argv[2];
if (!id) throw new Error("Usage : tsx scripts/mots.ts <id>");
const m = JSON.parse(fs.readFileSync(path.resolve("histoires/sorties", id, "minutage.json"), "utf8")) as { duree: number; mots: Array<{ texte: string; debut: number; fin: number; scene: number }> };
console.log(`${id} : durée ${m.duree.toFixed(1)} s, ${m.mots.length} mots`);
const n = Math.max(...m.mots.map((w) => w.scene)) + 1;
for (let s = 0; s < n; s++) {
  const w = m.mots.filter((x) => x.scene === s);
  console.log(`\nSCÈNE ${s + 1} (indice ${s}) [${w[0].debut.toFixed(1)}–${w[w.length - 1].fin.toFixed(1)} s]\n` + w.map((x, k) => `${k}:${x.texte}@${x.debut.toFixed(1)}`).join(" "));
}
