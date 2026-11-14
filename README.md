# Studio Fantôme

Média francophone automatisé sur l'écosystème **Claude** pour **TikTok** et **YouTube Shorts**, présenté par
**Ecto**, un petit fantôme robot 3D orange. Le système cherche les meilleurs sujets, vérifie chaque fait, écrit
le script, génère la voix, rend une vidéo motion design 1080×1920, la contrôle, la soumet à ton approbation,
la publie aux créneaux 9 h / 13 h / 19 h (Europe/Paris) et apprend de ses statistiques.

> Média indépendant, non affilié à Anthropic. Claude est une marque d'Anthropic.

## Comment ça marche
| Étape | Outil | Où |
|---|---|---|
| Veille (GitHub, changelog Claude Code, annonces et docs Anthropic, Hacker News) | CLI `fm veille` + skill `veille-claude` | `src/veille`, `.claude/skills` |
| Vérification (citations exactes, faits GitHub en direct, contrôle du sens) | `fm verifier` + sous-agent `verificateur` | `src/verify`, `.claude/agents` |
| Script + storyboard (`episode.json`) | skill `ecrire-episode` (Claude Code) | `episodes/<id>/` |
| Voix française + minutage mot à mot | ElevenLabs (`with-timestamps`) | `src/voice` |
| Motion design + Ecto 3D + sous-titres + sons | Remotion, Three.js, FFmpeg | `video/` |
| Contrôle qualité (format, son, silences, sous-titres, orthographe, licences, faits…) | `fm qc` | `src/qc` |
| Approbation | issue GitHub « 🎬 Revue » + `/approuver` | `.github/workflows/approbation.yml` |
| Publication + historique + anti-doublon | YouTube Data API, TikTok Content Posting API | `src/publish` |
| Statistiques + apprentissage | YouTube Analytics, TikTok video.list, skill `bilan-performances` | `src/analytics` |

Détails : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Comptes et clés : [docs/INSTALLATION.md](docs/INSTALLATION.md) ·
Personnage et charte : [docs/BIBLE-VISUELLE.md](docs/BIBLE-VISUELLE.md) · Ton et règles :
[docs/LIGNE-EDITORIALE.md](docs/LIGNE-EDITORIALE.md)

## Démarrage rapide
```bash
npm ci
npx remotion browser ensure
npm run fm -- aide                      # toutes les commandes
npm run fm -- veille                    # sujets du moment -> data/veille/
npm run fm -- rendu <id> --brouillon    # aperçu rapide d'un épisode (sans voix)
npm run studio                          # Remotion Studio : éditer et prévisualiser les templates
npm test                                # tests de la logique critique
```
Production d'une journée avec Claude Code : `claude`, puis « Utilise le skill produire-journee pour demain ».

Configuration des comptes (ElevenLabs, YouTube, TikTok, secrets GitHub) : sur ton ordinateur, `claude --chrome`
dans le dossier du projet, puis « Utilise le skill configurer-comptes ». Voir [docs/INSTALLATION.md](docs/INSTALLATION.md).

## État (testé / non testé)
| Module | État |
|---|---|
| Personnage 3D, 12 templates, sous-titres, transitions, sons, mastering | ✅ testé (rendus réels) |
| Contrat `episode.json`, validation éditoriale, timeline synchronisée sur la voix | ✅ testé |
| Vérification (archivage des sources, citations exactes, API GitHub) | ✅ testé sur un épisode réel |
| Contrôle qualité automatique | ✅ testé |
| Tests unitaires de la logique critique (`npm test`) | ✅ 21/21 |
| Clés sans affichage : `secrets-github`, `secret-aleatoire`, `acces`, jetons OAuth écrits dans `.env` | ✅ testé contre un faux `gh` et un faux serveur (valeurs uniquement par l'entrée standard) ; retour OAuth YouTube testé en local (state, refus) ; échange réel avec Google et TikTok **non testé** (identifiants requis) |
| Dépôt GitHub public, pages légales (GitHub Pages) | ✅ code envoyé ; Pages à activer dans les réglages du dépôt ; workflows planifiés désactivés jusqu'à la pose des secrets |
| Identité visuelle (photo de profil, icône d'app, bannière YouTube) | ✅ `docs/identite/`, rendue avec le vrai modèle d'Ecto (`npm run identite`) |
| Contrôle automatique du visage d'Ecto (`npm run bible`) et de sa version au QC | ✅ testé |
| Production d'une journée complète (14/11 : Découverte, Business, Actu) | ✅ 3 épisodes vérifiés, rendus et contrôlés — voix de test, à régénérer avec ElevenLabs |
| Veille (release notes, actualités Anthropic, changelog, GitHub) | ✅ testé — Hacker News : code écrit, non joignable depuis l'environnement de développement |
| Voix ElevenLabs | ✅ testée en réel (14/11) : voix « Hugo » sur `eleven_v4`, minutage mot à mot exploitable, choisie par mesures de prosodie parmi 5 voix françaises (`voix-bibliotheque`, `voix-ajouter`, `essai-voix`) |
| Publication YouTube / TikTok, approbation par issue, statistiques | ⚠️ code écrit, **pas encore testé** (comptes et autorisations requis) |
| Workflows GitHub Actions | ⚠️ YAML et chaque bloc shell validés (`bash -n`), script d'enregistrement d'état corrigé et testé sur un dépôt local ; **jamais exécutés sur GitHub** (secrets requis) |

## Arborescence
```
config/         identité de la chaîne, prononciation, lexique, licences
docs/           installation, architecture, bible visuelle (+ planches), ligne éditoriale
episodes/<id>/  episode.json, voix.json, verification.json, qc.json, sources archivées, assets
data/           backlog, plans, historique, stats, rapports, apprentissages, journal des opérations
src/            CLI déterministe (schema, core, veille, verify, voice, render, qc, publish, analytics)
video/          moteur Remotion (Episode, scènes, Ecto 3D, thème, polices, sons générés)
.claude/        Skills et sous-agent pour Claude Code
.github/        workflows (production, approbation, publication, statistiques)
```

## Licences
Code du studio : à définir par le propriétaire. Remotion : gratuit jusqu'à 3 personnes (licence entreprise
au-delà, voir remotion.dev/license). Polices Inter et JetBrains Mono : SIL OFL. Icônes Lucide : ISC.
Ecto, effets sonores et musique : créations originales générées par le code du studio.
