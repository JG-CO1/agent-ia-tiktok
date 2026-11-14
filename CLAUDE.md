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

## Où sont les choses
- `src/schema/episode.ts` : le contrat `episode.json` (lire les commentaires des champs).
- `episodes/<id>/` : un dossier par vidéo (episode.json, voix.json, verification.json, qc.json, sources/).
- `data/backlog.json`, `data/historique.json`, `data/apprentissages.md` (à lire avant d'écrire un script).
- `config/chaine.json` (identité, créneaux, voix), `config/lexique.txt` (mots techniques acceptés).
- `video/` : moteur Remotion (scènes, Ecto). Ne pas modifier le personnage sans mettre à jour
  `docs/BIBLE-VISUELLE.md` puis regénérer les matcaps (`npm run matcaps`) et les planches (`npm run bible`).

## Skills
- `veille-claude` : trouver, vérifier et noter les sujets du jour.
- `ecrire-episode` : écrire un `episode.json` excellent et sourcé, puis le produire.
- `produire-journee` : orchestrer les 3 vidéos du jour de bout en bout.
- `bilan-performances` : analyser les statistiques et mettre à jour `data/apprentissages.md`.
