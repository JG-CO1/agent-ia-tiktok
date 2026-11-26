#!/usr/bin/env tsx
/**
 * CLI du studio : `npm run fm -- <commande> [arguments] [--options]`
 * Chaque commande est déterministe et vérifiable ; l'intelligence éditoriale vit dans les Skills Claude Code.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { FmError, log } from "./lib/log";

// Derrière un proxy HTTPS (sessions cloud, réseaux d'entreprise), le fetch intégré de Node n'utilise HTTPS_PROXY
// qu'avec NODE_USE_ENV_PROXY=1 (Node ≥ 22.21) : sans lui, les appels d'API échouent (« fetch failed », ENOTFOUND).
// On se relance alors une fois avec la variable. Sans proxy (GitHub Actions, la plupart des postes) : rien ne change.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const NODE_OPTIONS = `${process.env.NODE_OPTIONS ?? ""} --disable-warning=UNDICI-EHPA`.trim(); // avertissement « expérimental » sans intérêt
  const r = spawnSync(process.execPath, [...process.execArgv, ...process.argv.slice(1)], { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_OPTIONS } });
  process.exit(r.status ?? 1);
}
import { chaine } from "./lib/config";
import { listEpisodes, loadEpisode, readEpisodeRaw, readJson, saveEpisode, journal } from "./lib/episodes";
import { DATA_DIR, episodeDir, episodeFile, ROOT } from "./lib/paths";
import { EpisodeSchema, narration } from "./schema/episode";

type Flags = Record<string, string | boolean>;
function parseArgs(argv: string[]) {
  const pos: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const eq = a.indexOf("="); // seulement le premier « = » : une valeur peut en contenir (codes OAuth, base64)
      const k = eq < 0 ? a.slice(2) : a.slice(2, eq);
      const v = eq < 0 ? undefined : a.slice(eq + 1);
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
    voix-infos                 Liste les modèles et les voix ElevenLabs de ton compte
    voix-bibliotheque [--genre male|female] [--usage social_media] [--accent …] [--recherche …] [--nombre 20]
                               Cherche des voix françaises dans la Voice Library (liste -> sorties/voix-bibliotheque.json)
    voix-ajouter <public_owner_id> <voice_id> [--nom …]
                               Ajoute une voix de la bibliothèque à « My Voices » (nécessaire pour l'utiliser)
    essai-voix <id> --voix <id1,id2> [--modeles m1,m2] [--scenes 2]
                               Compare voix et modèles sur le vrai script (fichiers à écouter + rapport)
    capture <id> <url> <nom.png> [--selecteur css] [--hauteur 1600]
                               Capture d'écran d'une page publique dans episodes/<id>/assets
    rendu <id> [--brouillon]   Rend la vidéo 1080x1920 (+ mastering audio, planche contact)
    qc <id> [--visuel ok|ko --note "…"]
                               Contrôle qualité complet (bloquant) ; --visuel enregistre la revue de la planche

  Veille
    veille [--jours 7]         Collecte les sujets candidats (GitHub, changelog, Anthropic, HN)
    idees <fichier.json>       Classe ≥ 10 idées notées par critère (calcul /100 en code) → data/idees/<date>.json
    hook "<accroche>" […]      Note des accroches /100 (clarté, curiosité, précision, enjeu, promesse) et signale les pièges
    repo <owner/repo>          Faits vérifiés sur un dépôt GitHub (existence, licence, activité…)

  Publication
    legendes                   Légendes TikTok prêtes à copier (data/legendes.json -> page docs/legendes.html) :
                               un brouillon TikTok ne peut pas recevoir de légende par l'API
    revue <id> [--remplacer]   Envoie en revue : YouTube privé + issue GitHub d'approbation
    approuver <id>             Approuve (programme YouTube à l'heure du créneau)
    rejeter <id> [--raison …]  Rejette l'épisode
    publier [--maintenant]     Publie les épisodes approuvés dont le créneau est arrivé

  Comptes et clés (en local, une fois — aucune valeur secrète n'est affichée)
    auth youtube               Autorise la chaîne YouTube ; jeton écrit dans .env
    auth tiktok [--code <C>]   Lien d'autorisation TikTok, puis échange du code ; jeton écrit dans .env
    auth <service> --lien | --code <C> --stocker
                               Variante sans rien installer (workflow « Autorisation ») : jetons chiffrés dans data/jetons/
    secret-aleatoire <NOM>     Génère une clé aléatoire dans .env (ex. FM_CLE_JETONS)
    secrets-github [NOMS…] [--verifier]
                               Envoie les clés de .env vers les secrets GitHub (par gh), liste ce qui manque
    acces [--seulement elevenlabs,youtube] [--strict]
                               Vérifie ElevenLabs, la voix, YouTube, TikTok, Instagram (noms seulement, jamais les
                               valeurs) ; --strict : échoue si un service contrôlé n'est pas prêt
    essai-tiktok <id|fichier.mp4>
                               Envoie une vidéo en BROUILLON TikTok (rien n'est publié) : test sandbox, démo

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

    case "voix-bibliotheque": {
      const { voixBibliotheque } = await import("./voice/essai");
      const opt = (k: string) => (typeof flags[k] === "string" ? (flags[k] as string) : undefined);
      await voixBibliotheque({
        langue: opt("langue") ?? "fr",
        genre: opt("genre"),
        age: opt("age"),
        accent: opt("accent"),
        usage: opt("usage"),
        recherche: opt("recherche"),
        tri: opt("tri"),
        nombre: flags.nombre ? Number(flags.nombre) : 20,
      });
      return;
    }
    case "voix-ajouter": {
      const { voixAjouter } = await import("./voice/essai");
      await voixAjouter(need(args[0]), need(args[1]), typeof flags.nom === "string" ? flags.nom : undefined);
      return;
    }
    case "voix-infos": {
      const { voixInfos } = await import("./voice/essai");
      await voixInfos();
      return;
    }

    case "essai-voix": {
      const id = need(args[0]);
      if (typeof flags.voix !== "string") throw new FmError("Usage : essai-voix <id> --voix <voice_id1,voice_id2> [--modeles m1,m2] [--scenes 2]");
      const { essaiVoix } = await import("./voice/essai");
      await essaiVoix(loadEpisode(id), {
        voix: flags.voix.split(",").map((x) => x.trim()).filter(Boolean),
        modeles: typeof flags.modeles === "string" ? flags.modeles.split(",").map((x) => x.trim()).filter(Boolean) : [chaine().voix.modele],
        scenes: flags.scenes ? Number(flags.scenes) : undefined,
      });
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

    case "legendes": {
      const { ecrireLegendes } = await import("./publish/legendes");
      ecrireLegendes();
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
      const o = {
        afficher: Boolean(flags.afficher),
        lien: Boolean(flags.lien),
        stocker: Boolean(flags.stocker),
        code: typeof flags.code === "string" ? flags.code : undefined,
      };
      if (target === "youtube") await (await import("./publish/youtube")).authInteractive(o);
      else if (target === "tiktok") await (await import("./publish/tiktok")).authInteractive({ ...o, direct: Boolean(flags["avec-direct"]) });
      else throw new FmError("auth youtube | auth tiktok [--lien] [--code <CODE> [--stocker]]");
      return;
    }

    case "secrets-github": {
      const { secretsGithub } = await import("./lib/secrets");
      const r = secretsGithub({ depot: typeof flags.depot === "string" ? flags.depot : undefined, noms: args, verifier: Boolean(flags.verifier) });
      if (flags.strict && r.manquants.length) process.exitCode = 1;
      return;
    }
    case "secret-aleatoire": {
      const { secretAleatoire } = await import("./lib/secrets");
      secretAleatoire(need(args[0]), { remplacer: Boolean(flags.remplacer) });
      return;
    }
    case "acces": {
      const { verifierAcces } = await import("./lib/acces");
      const seulement = typeof flags.seulement === "string" ? flags.seulement.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean) : undefined;
      const lignes = await verifierAcces({ seulement });
      // --strict : code de sortie 1 si un service contrôlé n'est pas « ok » (contrôle préalable des workflows)
      if (flags.strict && lignes.some((l) => l.etat !== "ok")) process.exitCode = 1;
      return;
    }
    case "essai-tiktok": {
      // Envoi d'essai en BROUILLON (boîte de réception du compte, rien n'est publié) : sandbox, vidéo de démo pour la revue.
      const cible = need(args[0]);
      const fichier = fs.existsSync(cible) ? path.resolve(cible) : episodeFile(cible, "video.mp4");
      if (!fs.existsSync(fichier)) throw new FmError(`Vidéo introuvable : ${fichier}`, "tiktok");
      const tt = await import("./publish/tiktok");
      log("info", "tiktok", `Envoi d'essai en brouillon : ${path.relative(ROOT, fichier)}`);
      const publishId = await tt.uploadDraft(fichier);
      const st = await tt.waitStatus(publishId);
      log(st.status === "FAILED" ? "erreur" : "ok", "tiktok", `publish_id ${publishId} : ${st.status}${st.fail_reason ? ` (${st.fail_reason})` : ""}`);
      if (st.status === "FAILED") process.exitCode = 1;
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

    case "idees": {
      // fm idees <fichier.json> : classe les idées (notes 0–10 par critère, calcul /100 en code) et écrit data/idees/<date>.json
      const { classerIdees } = await import("./veille/scoring");
      const file = need(args[0]);
      const idees = JSON.parse(fs.readFileSync(file, "utf8")) as Parameters<typeof classerIdees>[0];
      if (!Array.isArray(idees) || idees.length < 10) log("warn", "idees", `${Array.isArray(idees) ? idees.length : 0} idée(s) : la méthode en demande au moins 10`);
      const out = classerIdees(idees);
      console.table(out.map((i) => ({ score: i.score, retenable: i.retenable ? "oui" : "NON", cat: i.categorie, titre: i.titre.slice(0, 70), remarques: i.remarques.join(" ; ").slice(0, 80) })));
      const dir = path.join(DATA_DIR, "idees");
      fs.mkdirSync(dir, { recursive: true });
      const dest = path.join(dir, `${new Date().toISOString().slice(0, 10)}.json`);
      fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
      log("ok", "idees", `${out.filter((i) => i.retenable).length}/${out.length} retenable(s) → ${path.relative(ROOT, dest)}`);
      return;
    }
    case "hook": {
      // fm hook "<accroche>" ["<autre>" …] : note chaque accroche /100 (règles lisibles) ; la vérité reste à prouver par les sources
      const { classerHooks } = await import("./veille/scoring");
      if (!args.length) throw new FmError("Donne au moins une accroche entre guillemets.", "hook");
      for (const h of classerHooks(args)) {
        console.log(`${String(h.score).padStart(3)}/100  ${h.texte}`);
        console.log(`        ${Object.entries(h.detail).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
        for (const a of h.alertes) console.log(`        ⚠ ${a}`);
      }
      console.log("\nAide au tri, pas une prédiction : chaque fait de l'accroche doit avoir une affirmation sourcée (fm verifier).");
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
