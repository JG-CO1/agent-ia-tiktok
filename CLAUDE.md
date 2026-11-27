# Studio Fantôme — consignes pour Claude Code

Média francophone automatisé (TikTok + YouTube Shorts) sur l'écosystème Claude, présenté par **Ecto**,
un fantôme robot 3D orange. Ce dépôt contient un CLI déterministe (`npm run fm -- …`) et des Skills qui
portent le jugement éditorial. Lis `docs/ARCHITECTURE.md` pour la vue d'ensemble.

## Règles absolues (non négociables)
1. **Rien d'inventé.** Pas de fonctionnalité, de dépôt, de chiffre, de date ou de citation inventés.
   Chaque fait affiché ou prononcé est une `affirmation` reliée à une source ET à une `citation` copiée
   **mot pour mot** depuis cette source (langue d'origine). `fm verifier` le contrôle par code.
2. **Sources primaires d'abord** (annonces Anthropic, docs, changelog, dépôt GitHub lui-même).
   Une rumeur n'est jamais présentée comme un fait. Une nouveauté doit avoir une source datée < 21 jours.
3. **Pas de promesse de revenus irréaliste**, pas de « devenir riche », pas de chiffres de gains non sourcés.
4. **Indépendance** : jamais suggérer une affiliation à Anthropic, jamais utiliser leur logo ni la mascotte officielle.
5. **Jamais publier une vidéo défectueuse** pour tenir la cadence : mieux vaut 2 vidéos parfaites que 3 moyennes.
6. **Ne jamais simuler un succès** : un statut de publication vient toujours d'une réponse d'API.
7. **Secrets** : ne jamais lire `.env`, ne jamais afficher ni écrire une clé dans un fichier ou un log.

## Commandes du pipeline (dans l'ordre)
```
npm run fm -- veille                      # collecte des sujets -> data/veille/, data/backlog.json
npm run fm -- repo owner/nom              # faits GitHub réels (étoiles, licence, activité, SKILL.md)
npm run fm -- nouveau AAAA-MM-JJ <1|2|3> <slug>
npm run fm -- valider <id>                # schéma + règles éditoriales
npm run fm -- verifier <id>               # sources archivées + citations exactes + faits GitHub
#   -> sous-agent `verificateur` : contrôle du SENS, puis `fm verdict <id> <aN> ok|ko --note …`
npm run fm -- capture <id> <url> <nom.jpg> [--selecteur css]   # si une capture d'écran aide
npm run fm -- voix <id>                   # ElevenLabs (jamais --local pour une vidéo publiable)
#   (humain, hors production) voix-infos : modèles et voix du compte ; essai-voix : comparer voix et modèles
npm run fm -- rendu <id>                  # vidéo 1080x1920 + planche contact
npm run fm -- qc <id>                     # contrôle qualité ; puis revue visuelle de planche.jpg :
npm run fm -- qc <id> --visuel ok --note "…"   # (ou --visuel ko et corriger)
```
`revue`, `approuver`, `publier`, `stats` sont lancés par les workflows GitHub (identifiants de publication
non accessibles à l'agent de production).

## Mode automatique (GitHub Actions)
Les permissions sont celles de `.claude/settings.json` (+ `--allowedTools` du workflow), en mode « don't ask » :
- lire : Read, Glob, Grep (jamais `cat`) ; écrire : Write, Edit (dans `episodes/`, `data/`, lexique, prononciation) ;
- web : WebFetch, WebSearch (jamais `curl`) ; faits GitHub : `npm run fm -- repo owner/nom` ;
- shell : uniquement `npm run fm -- …` (et `ls`, `git status/diff/log`). `node`, `cat`, `curl` et les scripts sont
  refusés **par conception** (l'agent lit des pages web et dispose de clés) : ne pas s'arrêter sur un refus, utiliser
  l'outil prévu ci-dessus.

## Où sont les choses
- `src/schema/episode.ts` : le contrat `episode.json` (lire les commentaires des champs).
- `episodes/<id>/` : un dossier par vidéo (episode.json, voix.json, verification.json, qc.json, sources/).
- `data/backlog.json`, `data/historique.json`, `data/apprentissages.md` (à lire avant d'écrire un script).
- `config/chaine.json` (identité, créneaux, voix), `config/lexique.txt` (mots techniques acceptés).
- `video/` : moteur Remotion (scènes, Ecto). Ne pas modifier le personnage sans mettre à jour
  `docs/BIBLE-VISUELLE.md` puis regénérer les matcaps (`npm run matcaps`) et les planches (`npm run bible`).

## Moteur éditorial Studio Phantom (2026-11-26)
- Lire `STUDIO_PHANTOM_KNOWLEDGE.md` avant de produire ; le compléter après chaque vidéo. `STUDIO_PHANTOM_ANALYTICS.md` = performances réelles.
- `npm run fm -- idees <fichier.json>` classe ≥ 10 idées notées /100 ; `npm run fm -- hook "…" "…"` note des accroches /100 (aide au tri).
- Skills externes installées (texte pur, relues) : voir `docs/SKILLS-EXTERNES.md`. N'en installer aucune autre sans relecture complète
  (une skill est une consigne : pas de scripts, pas de commande réseau, pas de lecture de `.env`, pas de consigne commerciale).

## Personnalité d'Ecto (2026-11-27)
- Ecto est un pote sans filtre qui part en fumée puis revient avec un doudou : lire `docs/PERSONNALITE-ECTO.md` avant d'écrire.
  Consignes dans `episode.json` : `fantome.colere` (calme | enerve | furie), `fantome.accessoire`, `temps_forts[].lancer`, `ton` de scène.
- `npm run fm -- accessoires` (variété), `npm run fm -- demo-ecto` (vidéo de démonstration → `sorties/`, jamais publiée).
- Insultes : comportements seulement, jamais de discrimination ; la personnalité n'autorise aucun fait inventé.

## Skills
- `veille-claude` : trouver, vérifier et noter les sujets du jour.
- `ecrire-episode` : écrire un `episode.json` excellent et sourcé, puis le produire.
- `produire-journee` : orchestrer les 3 vidéos du jour de bout en bout.
- `radar-tendances` : Trend Radar (lundi et jeudi) ; `moteur-idees` : 10 idées /100, 5 hooks, script démonstration d'abord, packaging.
- `bilan-performances` : analyser les statistiques et mettre à jour `data/apprentissages.md`.
- `configurer-comptes` : une fois, dans une session locale `claude --chrome`, brancher comptes et clés avec le
  propriétaire (les valeurs secrètes ne passent jamais par la conversation : `.env` puis `fm secrets-github`).
