/**
 * Rapport de performance (chiffres uniquement, calculés depuis data/stats) :
 * par format, créneau, type d'accroche et durée. Les conclusions qualitatives sont rédigées par le skill
 * `bilan-performances` dans data/apprentissages.md, qui est relu avant chaque nouveau script.
 * Règle : aucun chiffre inventé ; « n/d » si absent ; pas de tendance sur moins de 3 vidéos.
 */
import fs from "node:fs";
import path from "node:path";
import { loadEpisode, readJson } from "../lib/episodes";
import { log } from "../lib/log";
import { DATA_DIR, ROOT } from "../lib/paths";
import { readHistory } from "../publish/publish";
import type { EpisodeStats } from "./stats";

function hookType(h: string): string {
  if (/\?/.test(h)) return "question";
  if (/\d/.test(h)) return "chiffre";
  if (/^(tu|toi|si tu|arrête|stop)\b/i.test(h.trim())) return "interpellation";
  return "affirmation";
}

const mean = (xs: Array<number | null | undefined>) => {
  const v = xs.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const fmt = (v: number | null, d = 1, suffix = "") => (v === null ? "n/d" : `${v.toLocaleString("fr-FR", { maximumFractionDigits: d })}${suffix}`);

export async function writeReport(opts: { days: number }) {
  const stats = readJson<{ episodes: Record<string, EpisodeStats> }>(path.join(DATA_DIR, "stats", "derniers.json"))?.episodes ?? {};
  const since = Date.now() - opts.days * 86400e3;
  const rows = readHistory()
    .publications.filter((h) => new Date(h.date).getTime() >= since)
    .map((h) => {
      let accroche = "";
      let duree: number | null = null;
      try {
        accroche = loadEpisode(h.id).accroche;
        duree = readJson<{ duree: number }>(path.join(ROOT, "episodes", h.id, "voix.json"))?.duree ?? null;
      } catch {
        /* épisode supprimé */
      }
      const s = stats[h.id];
      const y = s?.youtube;
      const t = s?.tiktok;
      const vuesTotal = y?.vues != null || t?.vues != null ? (y?.vues ?? 0) + (t?.vues ?? 0) : null;
      const inter = (n: number | null | undefined, v: number | null | undefined) => (n != null && v ? (100 * n) / v : null);
      return {
        id: h.id,
        format: h.format,
        creneau: h.creneau,
        accroche,
        type_accroche: hookType(accroche),
        duree,
        tranche: duree === null ? "n/d" : duree < 40 ? "30–40 s" : duree < 50 ? "40–50 s" : "50–60 s",
        yt_vues: y?.vues ?? null,
        yt_pct: y?.pourcentage_moyen ?? null,
        yt_r3: y?.retention?.a3s ?? null,
        yt_abos: y?.abonnes_gagnes ?? null,
        tt_vues: t?.vues ?? null,
        vues_total: vuesTotal,
        likes_pct: inter((y?.likes ?? 0) + (t?.likes ?? 0), vuesTotal),
        partages_pct: inter((y?.partages ?? 0) + (t?.partages ?? 0), vuesTotal),
      };
    });
  const groups = (key: keyof (typeof rows)[number]) => {
    const m = new Map<string, typeof rows>();
    for (const r of rows) m.set(String(r[key]), [...(m.get(String(r[key])) ?? []), r]);
    return [...m.entries()].map(([k, rs]) => {
      const n = rs.length;
      const ok = n >= 3;
      return `| ${k} | ${n} | ${ok ? fmt(mean(rs.map((r) => r.vues_total)), 0) : "échantillon < 3"} | ${ok ? fmt(mean(rs.map((r) => r.yt_pct)), 0, " %") : "—"} | ${ok ? fmt(mean(rs.map((r) => (r.yt_r3 === null ? null : r.yt_r3 * 100))), 0, " %") : "—"} | ${ok ? fmt(mean(rs.map((r) => r.yt_abos)), 1) : "—"} |`;
    });
  };
  const head = "| Groupe | Vidéos | Vues moy. (YT+TT) | % moyen vu (YT) | Rétention à 3 s (YT) | Abonnés gagnés moy. (YT) |\n|---|---|---|---|---|---|";
  const today = new Date().toISOString().slice(0, 10);
  const md = `# Rapport de performance — ${today} (${opts.days} derniers jours)

> Chiffres issus de YouTube Analytics et de l'API TikTok. « n/d » = donnée absente (jamais estimée).
> Aucune tendance n'est tirée d'un groupe de moins de 3 vidéos.

## Par vidéo
| Épisode | Format | Créneau | Durée | Accroche | Vues YT | % vu YT | Rét. 3 s | Abonnés YT | Vues TT | Likes % | Partages % |
|---|---|---|---|---|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.id} | ${r.format} | ${r.creneau} | ${fmt(r.duree, 0, " s")} | ${r.accroche.slice(0, 50).replace(/\|/g, "/")} | ${fmt(r.yt_vues, 0)} | ${fmt(r.yt_pct, 0, " %")} | ${r.yt_r3 === null ? "n/d" : fmt(r.yt_r3 * 100, 0, " %")} | ${fmt(r.yt_abos, 0)} | ${fmt(r.tt_vues, 0)} | ${fmt(r.likes_pct, 1, " %")} | ${fmt(r.partages_pct, 2, " %")} |`).join("\n") || "| (aucune publication sur la période) |||||||||||"}

## Par format
${head}
${groups("format").join("\n")}

## Par créneau
${head}
${groups("creneau").join("\n")}

## Par type d'accroche
${head}
${groups("type_accroche").join("\n")}

## Par durée
${head}
${groups("tranche").join("\n")}
`;
  const dir = path.join(DATA_DIR, "rapports");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${today}.md`);
  fs.writeFileSync(out, md);
  log("ok", "rapport", `${path.relative(ROOT, out)} (${rows.length} vidéo(s))`);
  return out;
}
