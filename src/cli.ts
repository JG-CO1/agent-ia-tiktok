#!/usr/bin/env tsx
/**
 * CLI du studio : `npm run fm -- <commande> [arguments] [--options]`
 * Chaque commande est déterministe et vérifiable ; l'intelligence éditoriale vit dans les Skills Claude Code.
 */
import fs from "node:fs";
import path from "node:path";
import { FmError, log } from "./lib/log";
import { chaine } from "./lib/config";
import { listEpisodes, loadEpisode, readEpisodeRaw, readJson, saveEpisode, journal } from "./lib/episodes";
import { episodeDir, episodeFile, ROOT } from "./lib/paths";
import { EpisodeSchema, narration } from "./schema/episode";

type Flags = Record<string, string | boolean>;
function parseArgs(argv: string[]) {
  const pos: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      if (v !== undefined) flags[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith("--")) flags[k] = argv[++i];
      else flags[k] = true;
    } else pos.push(a);
  }
  return { pos, flags };
}

const HELP = `
Studio Fantôme — commandes (npm run fm -- <commande>)

  Production
    nouveau <AAAA-MM-JJ> <1|2|3> <slug> [--format decouverte|business|actu|tutoriel]
                               Crée le squelette d'un épisode (episodes/<id>/episode.json)
    valider <id>               Valide le schéma + règles éditoriales (longueurs, durée estimée)
    verifier <id>              Vérifie les sources et les citations exactes (+ faits GitHub)
    verdict <id> <aN> ok|ko --note "…"
                               Verdict du sous-agent vérificateur sur le SENS d'une affirmation
    voix <id> [--local]        Génère la voix (ElevenLabs ; --local = voix de test non publiable)
    capture <id> <url> <nom.png> [--selecteur css] [--hauteur 1600]
                               Capture d'écran d'une page publique dans episodes/<id>/assets
    rendu <id> [--brouillon]   Rend la vidéo 1080x1920 (+ mastering audio, planche contact)
    qc <id> [--visuel ok|ko --note "…"]
                               Contrôle qualité complet (bloquant) ; --visuel enregistre la revue de la planche

  Veille
    veille [--jours 7]         Collecte les sujets candidats (GitHub, changelog, Anthropic, HN)
    repo <owner/repo>          Faits vérifiés sur un dépôt GitHub (existence, licence, activité…)

  Publication
    revue <id> [--remplacer]   Envoie en revue : YouTube privé + issue GitHub d'approbation
    approuver <id>             Approuve (programme YouTube à l'heure du créneau)
    rejeter <id> [--raison …]  Rejette l'épisode
    publier [--maintenant]     Publie les épisodes approuvés dont le créneau est arrivé
    auth <youtube|tiktok>      Obtient un jeton OAuth (à faire une fois, en local)

  Suivi
    etat                       Tableau de bord des épisodes
    stats                      Récupère les statistiques (YouTube Analytics, TikTok)
    rapport [--jours 14]       Rapport de performance -> data/apprentissages.md
    sons                       Régénère effets sonores et fond musical
`;

async function main() {
  const { pos, flags } = parseArgs(process.argv.slice(2));
  const [cmd, ...args] = pos;
  switch (cmd) {
    case undefined:
    case "aide":
    case "help":
      console.log(HELP);
      return;

    case "nouveau": {
      const [date, slot, slug] = args;
      if (!date || !slot || !slug) throw new FmError("Usage : nouveau <AAAA-MM-JJ> <1|2|3> <slug>");
      const c = chaine();
      const creneau = (["matin", "midi", "soir"] as const)[Number(slot) - 1];
      if (!creneau) throw new FmError("Créneau : 1 (matin), 2 (midi) ou 3 (soir)");
      const id = `${date}-${slot}-${slug}`;
      if (fs.existsSync(episodeFile(id, "episode.json"))) throw new FmError(`Existe déjà : ${id}`);
      const heure = c.creneaux[creneau];
      const { publicationIso } = await import("./publish/schedule");
      const format = (flags.format as string) ?? c.formats_par_creneau[creneau];
      const skeleton = {
        version: 1,
        id,
        creneau,
        publication_prevue: publicationIso(date, heure, c.fuseau),
        format,
        sujet: "A_REMPLIR",
        angle: "A_REMPLIR",
        accroche: "A_REMPLIR",
        sources: [],
        affirmations: [],
        scenes: [],
        assets: [],
        publication: { titre: "A_REMPLIR", description_youtube: "A_REMPLIR", description_tiktok: "A_REMPLIR", hashtags: [...c.hashtags_base], tags_youtube: [] },
        statut: "brouillon",
        journal: [{ date: new Date().toISOString(), etape: "nouveau", message: "Squelette créé" }],
      };
      fs.mkdirSync(path.join(episodeDir(id), "assets"), { recursive: true });
      fs.writeFileSync(episodeFile(id, "episode.json"), JSON.stringify(skeleton, null, 2) + "\n");
      log("ok", "nouveau", `episodes/${id}/episode.json (${format}, publication ${skeleton.publication_prevue})`);
      return;
    }

    case "valider": {
      const id = need(args[0]);
      const raw = JSON.stringify(readEpisodeRaw(id));
      if (raw.includes("A_REMPLIR")) throw new FmError("Des champs « A_REMPLIR » restent à compléter.", "validation");
      const ep = loadEpisode(id);
      const { editorialLint } = await import("./qc/editorial");
      const issues = editorialLint(ep);
      for (const i of issues) log(i.bloquant ? "erreur" : "warn", "validation", i.message);
      if (issues.some((i) => i.bloquant)) throw new FmError("Validation éditoriale : corrections nécessaires.", "validation");
      if (ep.statut === "brouillon") {
        ep.statut = "redige";
        journal(ep, "valider", "Schéma et règles éditoriales OK");
        saveEpisode(ep);
      }
      log("ok", "validation", `${id} valide (${narration(ep).split(/\s+/).length} mots de narration)`);
      return;
    }

    case "verifier": {
      const id = need(args[0]);
      const { verifyEpisode } = await import("./verify/verify");
      const ok = await verifyEpisode(loadEpisode(id));
      if (!ok) process.exitCode = 2;
      return;
    }

    case "verdict": {
      const [id, aid, verdict] = args;
      if (!id || !aid || (verdict !== "ok" && verdict !== "ko") || !flags.note) throw new FmError('Usage : verdict <id> <a1> ok|ko --note "justification"');
      const { setClaimVerdict } = await import("./verify/verify");
      setClaimVerdict(loadEpisode(id), aid, verdict, String(flags.note));
      log("ok", "verificateur", `${id} ${aid} -> ${verdict}`);
      return;
    }

    case "voix": {
      const id = need(args[0]);
      const ep = loadEpisode(id);
      const { generateVoice } = await import("./voice/voice");
      const v = await generateVoice(ep, { local: Boolean(flags.local) });
      ep.statut = ep.statut === "rendu" || ep.statut === "qc_ok" ? ep.statut : "voix";
      journal(ep, "voix", `${v.fournisseur} ${v.modele} — ${v.duree.toFixed(1)} s`);
      saveEpisode(ep);
      return;
    }

    case "capture": {
      const [id, url, name] = args;
      if (!id || !url || !name) throw new FmError("Usage : capture <id> <url> <nom.png>");
      const { capturePage } = await import("./render/capture");
      await capturePage(loadEpisode(id), url, name, { selector: flags.selecteur as string | undefined, height: flags.hauteur ? Number(flags.hauteur) : undefined });
      return;
    }

    case "rendu": {
      const id = need(args[0]);
      const { renderEpisode } = await import("./render/render");
      const frames = typeof flags.frames === "string" ? (flags.frames.split("-").map(Number) as [number, number]) : undefined;
      await renderEpisode(loadEpisode(id), {
        brouillon: Boolean(flags.brouillon),
        concurrency: flags.concurrence ? Number(flags.concurrence) : undefined,
        frames,
        sortie: flags.sortie as string | undefined,
        debug: typeof flags.debug === "string" ? flags.debug.split(",") : undefined,
      });
      return;
    }

    case "qc": {
      const id = need(args[0]);
      const { runQc } = await import("./qc/qc");
      const visuel = flags.visuel === "ok" || flags.visuel === "ko" ? (flags.visuel as "ok" | "ko") : undefined;
      const report = await runQc(loadEpisode(id), { visuel, note: flags.note as string | undefined });
      if (!report.ok) process.exitCode = 2;
      return;
    }

    case "veille": {
      const { collect } = await import("./veille/collect");
      await collect({ days: flags.jours ? Number(flags.jours) : 7 });
      return;
    }

    case "repo": {
      const { repoFacts } = await import("./verify/github");
      console.log(JSON.stringify(await repoFacts(need(args[0])), null, 2));
      return;
    }

    case "revue": {
      const { sendToReview } = await import("./publish/review");
      await sendToReview(loadEpisode(need(args[0])), { remplacer: Boolean(flags.remplacer) });
      return;
    }
    case "approuver": {
      const { approve } = await import("./publish/review");
      await approve(loadEpisode(need(args[0])));
      return;
    }
    case "rejeter": {
      const { reject } = await import("./publish/review");
      await reject(loadEpisode(need(args[0])), (flags.raison as string) ?? "sans motif");
      return;
    }
    case "publier": {
      const { publishDue } = await import("./publish/publish");
      await publishDue({ now: Boolean(flags.maintenant), only: args[0] });
      return;
    }
    case "auth": {
      const target = need(args[0]);
      if (target === "youtube") (await import("./publish/youtube")).authInteractive();
      else if (target === "tiktok") (await import("./publish/tiktok")).authInteractive();
      else throw new FmError("auth youtube | auth tiktok");
      return;
    }

    case "stats": {
      const { collectStats } = await import("./analytics/stats");
      await collectStats();
      return;
    }
    case "rapport": {
      const { writeReport } = await import("./analytics/report");
      await writeReport({ days: flags.jours ? Number(flags.jours) : 14 });
      return;
    }

    case "etat": {
      const rows = listEpisodes().map((id) => {
        try {
          const e = loadEpisode(id);
          const v = readJson<{ duree: number; fournisseur: string }>(episodeFile(id, "voix.json"));
          return { id, statut: e.statut, format: e.format, publication: e.publication_prevue, duree: v ? `${v.duree.toFixed(0)} s` : "-", voix: v?.fournisseur ?? "-" };
        } catch (e) {
          return { id, statut: "INVALIDE", format: "-", publication: "-", duree: "-", voix: String((e as Error).message).split("\n")[0].slice(0, 40) };
        }
      });
      console.table(rows);
      return;
    }

    case "sons": {
      const { generateAll } = await import("./audio/synth");
      log("ok", "sons", generateAll(path.join(ROOT, "video/public/sfx"), path.join(ROOT, "video/public/musique")).join(", "));
      return;
    }

    default:
      throw new FmError(`Commande inconnue : ${cmd}\n${HELP}`);
  }
}

function need(v: string | undefined): string {
  if (!v) throw new FmError("Argument manquant (voir `npm run fm -- aide`)");
  return v;
}

void EpisodeSchema;
main().catch((e) => {
  const etape = e instanceof FmError ? e.etape : "erreur";
  log("erreur", etape, e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});
