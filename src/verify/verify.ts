/**
 * Vérification déterministe des faits d'un épisode :
 *  - chaque source répond (2xx) et son texte est archivé (episodes/<id>/sources/<sid>.txt) ;
 *  - chaque citation est retrouvée mot pour mot dans sa source ;
 *  - les scènes « repo » correspondent aux données GitHub actuelles.
 * Le contrôle du SENS (la citation prouve-t-elle l'affirmation ?) est fait ensuite par le sous-agent vérificateur.
 */
import fs from "node:fs";
import path from "node:path";
import { journal, saveEpisode, writeJson } from "../lib/episodes";
import { log } from "../lib/log";
import { episodeDir } from "../lib/paths";
import type { Episode } from "../schema/episode";
import { rawFile, repoFacts } from "./github";

const UA = "Mozilla/5.0 (compatible; studio-fantome-verifier/1.0)";

/** Normalisation commune page/citation : casse, accents conservés, guillemets/apostrophes/tirets/espaces unifiés. */
export function normalizeForMatch(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // liens Markdown [texte](url) -> texte
    .replace(/[`*_]/g, "") // code et emphase Markdown
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[‐-―]/g, "-")
    .replace(/[#>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extraction texte simple d'une page HTML (scripts/styles retirés, entités décodées). */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|li|h\d|br|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n");
}

/** Pour une page GitHub, le contenu utile est le fichier brut (README, fichier de code…). */
async function githubText(url: URL): Promise<{ text: string; via: string } | null> {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const full = `${parts[0]}/${parts[1]}`;
  if (parts[2] === "blob" && parts.length >= 5) {
    const t = await rawFile(full, parts[3], parts.slice(4).join("/"));
    return t ? { text: t, via: `raw:${parts.slice(3).join("/")}` } : null;
  }
  if (parts.length === 2 || parts[2] === "tree") {
    const facts = await repoFacts(full);
    if (!facts.existe) return null;
    for (const f of ["README.md", "readme.md", "README"]) {
      const t = await rawFile(facts.nom, facts.branche!, f);
      if (t) return { text: `${facts.description ?? ""}\n${t}`, via: `raw:README (${facts.branche})` };
    }
  }
  return null;
}

async function fetchSource(url: string): Promise<{ status: number; text: string; finalUrl: string; via: string }> {
  const u = new URL(url);
  if (u.hostname === "github.com") {
    const g = await githubText(u);
    if (g) return { status: 200, text: g.text, finalUrl: url, via: g.via };
  }
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,text/plain,application/json;q=0.9,*/*;q=0.5" }, redirect: "follow", signal: AbortSignal.timeout(25000) });
  const body = await res.text();
  const ct = res.headers.get("content-type") ?? "";
  return { status: res.status, text: ct.includes("html") ? htmlToText(body) : body, finalUrl: res.url, via: "http" };
}

export async function verifyEpisode(ep: Episode): Promise<boolean> {
  const dir = path.join(episodeDir(ep.id), "sources");
  fs.mkdirSync(dir, { recursive: true });
  const report = {
    date: new Date().toISOString(),
    ok: true,
    sources: [] as Array<Record<string, unknown>>,
    affirmations: [] as Array<Record<string, unknown>>,
    repos: [] as Array<Record<string, unknown>>,
    erreurs: [] as string[],
  };
  const texts = new Map<string, string>();
  for (const s of ep.sources) {
    try {
      const r = await fetchSource(s.url);
      const ok = r.status >= 200 && r.status < 300 && r.text.length > 50;
      if (ok) {
        texts.set(s.id, normalizeForMatch(r.text));
        fs.writeFileSync(path.join(dir, `${s.id}.txt`), `# ${s.url}\n# consulté le ${report.date} via ${r.via}\n\n${r.text}`);
      } else report.erreurs.push(`Source ${s.id} inaccessible (${r.status})`);
      report.sources.push({ id: s.id, url: s.url, http: r.status, url_finale: r.finalUrl, via: r.via, octets: r.text.length, ok });
      log(ok ? "ok" : "erreur", "verifier", `${s.id} ${r.status} ${s.url}`);
    } catch (e) {
      report.erreurs.push(`Source ${s.id} : ${(e as Error).message}`);
      report.sources.push({ id: s.id, url: s.url, ok: false, erreur: (e as Error).message });
      log("erreur", "verifier", `${s.id} ${s.url} : ${(e as Error).message}`);
    }
  }
  for (const a of ep.affirmations) {
    const api = a.citation.match(/^api:github:([\w.-]+\/[\w.-]+):(etoiles|forks|licence|archive|fichiers_skill|jours_depuis_activite)(>=|<=|=)(.+)$/);
    if (api) {
      const f = await repoFacts(api[1]);
      const field = api[2] as "etoiles" | "forks" | "licence" | "archive" | "fichiers_skill" | "jours_depuis_activite";
      const raw = field === "fichiers_skill" ? (Array.isArray(f.fichiers_skill) ? f.fichiers_skill.length : NaN) : (f as unknown as Record<string, unknown>)[field];
      const want = api[4].trim();
      const num = Number(raw);
      const ok =
        f.existe &&
        (api[3] === "=" ? String(raw) === want : api[3] === ">=" ? num >= Number(want) : num <= Number(want));
      a.statut = ok ? (a.statut === "verifiee" ? "verifiee" : "citation_ok") : "rejetee";
      if (!ok) {
        a.note = `API GitHub : ${field} = ${String(raw)} (attendu ${api[3]} ${want})`;
        report.erreurs.push(`Affirmation ${a.id} : ${a.note}`);
      }
      report.affirmations.push({ id: a.id, citation: ok ? "api_ok" : "api_ko", valeur_api: raw, statut: a.statut });
      log(ok ? "ok" : "erreur", "verifier", `${a.id} API GitHub ${field}=${String(raw)} ${api[3]} ${want}`);
      continue;
    }
    const page = texts.get(a.source);
    const q = normalizeForMatch(a.citation);
    let res: "trouvee" | "approchante" | "absente" | "source_inaccessible" = "source_inaccessible";
    if (page) {
      if (page.includes(q)) res = "trouvee";
      else {
        // repli : au moins 85 % des mots de la citation présents dans une fenêtre de la page
        const words = q.split(" ").filter((w) => w.length > 2);
        const hits = words.filter((w) => page.includes(w)).length;
        res = words.length && hits / words.length >= 0.85 ? "approchante" : "absente";
      }
    }
    if (res === "trouvee") {
      if (a.statut === "a_verifier" || a.statut === "rejetee") a.statut = "citation_ok";
    } else {
      a.statut = "rejetee";
      a.note = res === "approchante" ? "Citation non exacte : recopier l'extrait mot pour mot depuis la source" : res === "absente" ? "Citation introuvable dans la source" : "Source inaccessible";
      report.erreurs.push(`Affirmation ${a.id} : ${a.note}`);
    }
    report.affirmations.push({ id: a.id, citation: res, statut: a.statut });
    log(res === "trouvee" ? "ok" : "erreur", "verifier", `${a.id} citation ${res} — « ${a.texte.slice(0, 60)} »`);
  }
  for (const sc of ep.scenes) {
    if (sc.type !== "repo") continue;
    const f = await repoFacts(sc.nom);
    const problems: string[] = [];
    if (!f.existe) problems.push("dépôt introuvable");
    else {
      if (sc.etoiles !== undefined && f.etoiles !== undefined) {
        const tol = Math.max(50, f.etoiles * 0.15);
        if (Math.abs(sc.etoiles - f.etoiles) > tol) problems.push(`étoiles ${sc.etoiles} ≠ ${f.etoiles} (API)`);
      }
      if (sc.licence && f.licence && sc.licence !== f.licence) problems.push(`licence ${sc.licence} ≠ ${f.licence}`);
      if (sc.langage && f.langage && sc.langage !== f.langage) problems.push(`langage ${sc.langage} ≠ ${f.langage}`);
      if (f.archive) problems.push("dépôt archivé");
    }
    report.repos.push({ scene: sc.id, nom: sc.nom, faits: { etoiles: f.etoiles, licence: f.licence, pousse_le: f.pousse_le, avertissements: f.avertissements }, problemes: problems });
    for (const p of problems) report.erreurs.push(`Scène ${sc.id} (${sc.nom}) : ${p}`);
    log(problems.length ? "erreur" : "ok", "verifier", `repo ${sc.nom} : ${problems.join(", ") || "conforme à l'API"}`);
  }
  report.ok = report.erreurs.length === 0;
  writeJson(path.join(episodeDir(ep.id), "verification.json"), report);
  journal(ep, "verifier", report.ok ? "Sources et citations vérifiées (contrôle du sens à faire)" : `${report.erreurs.length} problème(s)`);
  saveEpisode(ep);
  log(report.ok ? "ok" : "erreur", "verifier", report.ok ? "Vérification déterministe OK — reste le contrôle du sens (sous-agent vérificateur)" : `${report.erreurs.length} problème(s) à corriger`);
  return report.ok;
}

/** Enregistre le verdict du contrôle de sens (par le sous-agent vérificateur) pour une affirmation. */
export function setClaimVerdict(ep: Episode, aid: string, verdict: "ok" | "ko", note: string) {
  const a = ep.affirmations.find((x) => x.id === aid);
  if (!a) throw new Error(`Affirmation inconnue : ${aid}`);
  if (verdict === "ok" && a.statut !== "citation_ok" && a.statut !== "verifiee") throw new Error(`${aid} : la citation doit d'abord être retrouvée par \`fm verifier\``);
  a.statut = verdict === "ok" ? "verifiee" : "rejetee";
  a.note = note;
  journal(ep, "verificateur", `${aid} ${verdict.toUpperCase()} : ${note}`);
  saveEpisode(ep);
}
