/**
 * Veille : collecte des sujets candidats depuis des sources primaires et des signaux mesurables.
 * Sortie : data/veille/AAAA-MM-JJ.json + mise à jour de data/backlog.json (dédoublonné par URL).
 * Le choix final (intérêt, angle, explicabilité en 60 s) est fait par le skill Claude Code `veille`.
 */
import path from "node:path";
import { readJson, writeJson } from "../lib/episodes";
import { run } from "../lib/exec";
import { log } from "../lib/log";
import { DATA_DIR } from "../lib/paths";
import { htmlToText } from "../verify/verify";
import { ghJson } from "../verify/github";

export interface Candidate {
  id: string;
  type: "github" | "release_note" | "changelog_claude_code" | "anthropic_news" | "anthropic_engineering" | "hacker_news";
  titre: string;
  url: string;
  date: string | null;
  resume: string;
  signaux: Record<string, number | string | boolean | null>;
  /** Scores mesurables 0..5 (les critères de jugement sont ajoutés par l'agent). */
  pre_scores: { nouveaute: number; traction: number; fiabilite: number };
  pre_score: number;
}

const UA = "Mozilla/5.0 (compatible; studio-fantome-veille/1.0)";
const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

function parseEnDate(s: string): string | null {
  const m = s.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? (\d{1,2}),? (20\d\d)/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[3]), MONTHS[m[1].toLowerCase()], Number(m[2])));
  return d.toISOString().slice(0, 10);
}
const ageDays = (iso: string | null) => (iso ? (Date.now() - new Date(iso).getTime()) / 86400e3 : 999);
const freshness = (iso: string | null) => {
  const a = ageDays(iso);
  return a <= 2 ? 5 : a <= 7 ? 4.5 : a <= 14 ? 4 : a <= 30 ? 3 : a <= 90 ? 2 : 1;
};
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

async function getText(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function finalize(c: Omit<Candidate, "pre_score">): Candidate {
  const p = c.pre_scores;
  return { ...c, pre_score: +(p.nouveaute * 0.4 + p.traction * 0.35 + p.fiabilite * 0.25).toFixed(2) };
}

// ------------------------------------------------------------------ collecteurs
async function releaseNotes(days: number): Promise<Candidate[]> {
  const url = "https://platform.claude.com/docs/en/release-notes/overview";
  const text = htmlToText(await getText(url));
  const out: Candidate[] = [];
  const re = /\n\s*((?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, 20\d\d)\s*\n/g;
  const marks: Array<{ date: string; idx: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) marks.push({ date: parseEnDate(m[1])!, idx: m.index + m[0].length });
  for (let i = 0; i < marks.length; i++) {
    const { date, idx } = marks[i];
    if (ageDays(date) > days) continue;
    const end = marks[i + 1] ? marks[i + 1].idx - 40 : idx + 3000;
    const body = text
      .slice(idx, Math.max(idx, end))
      .replace(/(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, 20\d\d/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 700);
    // ignore les dates du sommaire (pas de contenu entre deux dates)
    if (body.length < 60) continue;
    out.push(
      finalize({
        id: `rn-${date}-${slug(body.slice(0, 40))}`,
        type: "release_note",
        titre: body.split(/(?<=\.)\s/)[0].slice(0, 140),
        url,
        date,
        resume: body,
        signaux: { source: "Claude Platform release notes" },
        pre_scores: { nouveaute: freshness(date), traction: 4, fiabilite: 5 },
      }),
    );
  }
  return out;
}

async function anthropicListing(kind: "news" | "engineering", days: number): Promise<Candidate[]> {
  const base = `https://www.anthropic.com/${kind}`;
  const html = await getText(base);
  const out: Candidate[] = [];
  const seen = new Set<string>();
  const re = new RegExp(`<a[^>]+href="(/${kind}/[a-z0-9-]+)"[^>]*>([\\s\\S]*?)</a>`, "g");
  const CATEGORIES = new Set(["announcements", "product", "features", "partnerships", "policy", "research", "societal-impacts", "economic-futures"]);
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1];
    const s = href.split("/").pop()!;
    if (CATEGORIES.has(s) || seen.has(href)) continue;
    const inner = htmlToText(m[2]).replace(/\s+/g, " ").trim();
    const date = parseEnDate(inner) ?? parseEnDate(html.slice(m.index, m.index + 3000));
    if (!inner || ageDays(date) > days) continue;
    seen.add(href);
    const title = inner.replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2},? 20\d\d/g, "").replace(/^(Announcements|Product|Policy|Research|Features|Partnerships)\s*/i, "").trim();
    out.push(
      finalize({
        id: `${kind}-${s}`,
        type: kind === "news" ? "anthropic_news" : "anthropic_engineering",
        titre: title.slice(0, 160) || s,
        url: `https://www.anthropic.com${href}`,
        date,
        resume: title.slice(0, 300),
        signaux: { source: `anthropic.com/${kind}` },
        pre_scores: { nouveaute: freshness(date), traction: kind === "news" ? 4 : 3.5, fiabilite: 5 },
      }),
    );
  }
  return out;
}

async function claudeCodeChangelog(days: number): Promise<Candidate[]> {
  const md = await getText("https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md");
  let times: Record<string, string> = {};
  try {
    times = JSON.parse((await run("npm", ["view", "@anthropic-ai/claude-code", "time", "--json"])).stdout);
  } catch {
    /* dates indisponibles : on garde les versions sans date */
  }
  const out: Candidate[] = [];
  const sections = md.split(/\n## /).slice(1, 25);
  for (const sec of sections) {
    const version = sec.split("\n")[0].trim().replace(/^\[|\].*$/g, "");
    const date = times[version]?.slice(0, 10) ?? null;
    if (date && ageDays(date) > days) continue;
    const bullets = sec
      .split("\n")
      .filter((l) => /^\s*[-*] /.test(l))
      .map((l) => l.replace(/^\s*[-*] /, "").trim())
      .slice(0, 12);
    if (!bullets.length) continue;
    out.push(
      finalize({
        id: `cc-${version}`,
        type: "changelog_claude_code",
        titre: `Claude Code ${version} : ${bullets[0].slice(0, 110)}`,
        url: "https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md",
        date,
        resume: bullets.join(" • ").slice(0, 900),
        signaux: { version, nb_changements: bullets.length },
        pre_scores: { nouveaute: freshness(date), traction: 3.5, fiabilite: 5 },
      }),
    );
  }
  return out;
}

interface GhItem {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  created_at: string;
  pushed_at: string;
  license: { spdx_id: string } | null;
  topics?: string[];
  archived: boolean;
  language: string | null;
}

async function github(days: number): Promise<Candidate[]> {
  const since = new Date(Date.now() - days * 86400e3).toISOString().slice(0, 10);
  const recent = new Date(Date.now() - Math.max(days, 30) * 86400e3).toISOString().slice(0, 10);
  const queries = [
    `topic:claude-code pushed:>${since} stars:>30`,
    `topic:agent-skills pushed:>${since} stars:>30`,
    `topic:claude-skills pushed:>${since} stars:>20`,
    `"claude code" in:name,description created:>${recent} stars:>40`,
    `claude skills in:name,description created:>${recent} stars:>40`,
    `mcp claude in:name,description created:>${recent} stars:>60`,
  ];
  const byName = new Map<string, GhItem>();
  for (const q of queries) {
    const r = await ghJson<{ items: GhItem[] }>(`/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=20`);
    for (const it of r.data?.items ?? []) if (!it.archived) byName.set(it.full_name, it);
    await new Promise((res) => setTimeout(res, 2500)); // API de recherche : ~10 requêtes/min en anonyme
  }
  return [...byName.values()].map((it) => {
    const ageCreated = Math.max(1, ageDays(it.created_at));
    const velocity = it.stargazers_count / ageCreated;
    const traction = Math.min(5, Math.log10(it.stargazers_count + 1) * 0.9 + Math.log10(velocity + 1) * 1.1);
    const lic = it.license && it.license.spdx_id !== "NOASSERTION";
    return finalize({
      id: `gh-${it.full_name.replace("/", "--").toLowerCase()}`,
      type: "github",
      titre: `${it.full_name} — ${it.description ?? ""}`.slice(0, 160),
      url: it.html_url,
      date: it.created_at.slice(0, 10),
      resume: it.description ?? "",
      signaux: {
        etoiles: it.stargazers_count,
        etoiles_par_jour: +velocity.toFixed(1),
        cree_le: it.created_at.slice(0, 10),
        pousse_le: it.pushed_at.slice(0, 10),
        licence: it.license?.spdx_id ?? null,
        langage: it.language,
        sujets: (it.topics ?? []).slice(0, 8).join(","),
      },
      pre_scores: { nouveaute: Math.max(freshness(it.created_at), freshness(it.pushed_at) - 1.5), traction: +traction.toFixed(2), fiabilite: lic ? 4 : 3 },
    });
  });
}

async function hackerNews(days: number): Promise<Candidate[]> {
  const since = Math.floor((Date.now() - days * 86400e3) / 1000);
  const url = `https://hn.algolia.com/api/v1/search?query=claude&tags=story&numericFilters=created_at_i>${since},points>40&hitsPerPage=30`;
  const data = JSON.parse(await getText(url)) as { hits: Array<{ objectID: string; title: string; url: string | null; points: number; num_comments: number; created_at: string }> };
  return data.hits
    .filter((h) => /claude|anthropic/i.test(h.title))
    .map((h) =>
      finalize({
        id: `hn-${h.objectID}`,
        type: "hacker_news",
        titre: h.title,
        url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
        date: h.created_at.slice(0, 10),
        resume: `${h.points} points, ${h.num_comments} commentaires sur Hacker News`,
        signaux: { points: h.points, commentaires: h.num_comments, discussion: `https://news.ycombinator.com/item?id=${h.objectID}` },
        pre_scores: { nouveaute: freshness(h.created_at), traction: Math.min(5, Math.log10(h.points) * 1.8), fiabilite: 2.5 },
      }),
    );
}

// ------------------------------------------------------------------ orchestration
export interface BacklogEntry extends Candidate {
  premiere_vue: string;
  statut: "nouveau" | "retenu" | "traite" | "ecarte";
  note?: string;
}

export async function collect(opts: { days: number }) {
  const collectors: Array<[string, () => Promise<Candidate[]>]> = [
    ["release notes plateforme", () => releaseNotes(Math.max(opts.days, 14))],
    ["actualités Anthropic", () => anthropicListing("news", Math.max(opts.days, 14))],
    ["blog engineering Anthropic", () => anthropicListing("engineering", Math.max(opts.days, 30))],
    ["changelog Claude Code", () => claudeCodeChangelog(Math.max(opts.days, 10))],
    ["GitHub", () => github(opts.days)],
    ["Hacker News", () => hackerNews(opts.days)],
  ];
  const all: Candidate[] = [];
  const errors: string[] = [];
  for (const [name, fn] of collectors) {
    try {
      const c = await fn();
      all.push(...c);
      log("ok", "veille", `${name} : ${c.length} sujet(s)`);
    } catch (e) {
      errors.push(`${name} : ${(e as Error).message}`);
      log("warn", "veille", `${name} indisponible : ${(e as Error).message}`);
    }
  }
  all.sort((a, b) => b.pre_score - a.pre_score);
  const today = new Date().toISOString().slice(0, 10);
  writeJson(path.join(DATA_DIR, "veille", `${today}.json`), { date: new Date().toISOString(), erreurs: errors, candidats: all });
  // Backlog dédoublonné (URL), en conservant les statuts déjà attribués
  const file = path.join(DATA_DIR, "backlog.json");
  const backlog = readJson<{ sujets: BacklogEntry[] }>(file) ?? { sujets: [] };
  const key = (c: Pick<Candidate, "url" | "id" | "type">) => (c.type === "changelog_claude_code" || c.type === "release_note" ? c.id : c.url.toLowerCase().replace(/\/$/, ""));
  const index = new Map(backlog.sujets.map((s) => [key(s), s]));
  let added = 0;
  for (const c of all) {
    const k = key(c);
    const prev = index.get(k);
    if (prev) Object.assign(prev, { ...c, premiere_vue: prev.premiere_vue, statut: prev.statut, note: prev.note });
    else {
      index.set(k, { ...c, premiere_vue: today, statut: "nouveau" });
      added++;
    }
  }
  const sujets = [...index.values()].filter((s) => ageDays(s.premiere_vue) <= 45).sort((a, b) => b.pre_score - a.pre_score);
  writeJson(file, { mis_a_jour: new Date().toISOString(), sujets });
  log("ok", "veille", `${all.length} candidat(s), ${added} nouveau(x) dans le backlog (${sujets.filter((s) => s.statut === "nouveau").length} à traiter)`);
  return all;
}
