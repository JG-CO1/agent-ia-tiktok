---
name: ecrire-episode
description: Écrit et produit un épisode de 30 à 60 s (episode.json) pour TikTok et YouTube Shorts à partir d'un sujet vérifié — angle, accroche, script, storyboard, sources avec citations exactes, textes de publication — puis enchaîne validation, vérification, voix, rendu et contrôle qualité. À utiliser pour toute nouvelle vidéo ou pour corriger une vidéo existante.
---

# Écrire et produire un épisode

## 0. Avant d'écrire
- Lire `data/apprentissages.md` (ce qui marche / ne marche pas) et les 10 dernières entrées de
  `data/historique.json` (ne pas répéter un angle ou une accroche récents).
- Ouvrir chaque source primaire (WebFetch). Pour un dépôt : `npm run fm -- repo owner/nom`.
  Relever les **phrases exactes** qui prouvent chaque fait : elles deviendront les `citation`.

## 1. Angle
Une seule idée forte, concrète, utile pour un francophone qui utilise (ou veut utiliser) Claude.
Formule : « [bénéfice concret] grâce à [outil / fonction] en [effort faible] ». Pas de liste fourre-tout.

## 2. Accroche (2 premières secondes)
≤ 12 mots, on entre directement dans le sujet. Modèles qui fonctionnent :
- Interpellation : « Tu utilises Claude Code ? Alors tu passes à côté de ça. »
- Contre-intuitif : « Claude peut maintenant écrire du code… pour piloter ses propres outils. »
- Résultat concret : « Ce skill gratuit crée tes présentations à ta place. »
- Chiffre sourcé : « Plus de 190 000 étoiles pour ce dépôt d'Anthropic. »
L'accroche = début exact de la voix de la scène 1 (`type: "accroche"`, `titre` = version courte affichée,
`surligne` = 1-2 mots clés). Champ `accroche` de l'épisode = cette même phrase.

## 3. Script (la voix)
- Français oral, tutoiement, phrases courtes (≤ 15 mots), débit ≈ 2,75 mots/s : **85 à 160 mots** au total.
- Structure : accroche → promesse (pourquoi rester) → démonstration concrète (2-4 scènes) → bénéfice ou
  limite honnête → appel à l'action.
- Expliquer simplement (« en gros », une analogie), comme un expert passionné. Jamais condescendant.
- Mettre *entre astérisques* 1 à 3 mots-clés par scène (ils s'affichent en orange dans les sous-titres).
- Interdits : « Bonjour à tous », « aujourd'hui on va voir », superlatifs en série, promesses de gains,
  fait non sourcé, anglicisme inutile (garder les termes d'usage : repo, skill, prompt, workflow).
- Prononciation : si un sigle ou un mot anglais risque d'être mal lu, l'ajouter à `config/prononciation.json`.

## 4. Storyboard (`scenes[]`)
5 à 9 scènes de 3 à 9 s ; une scène = un visuel + une ou deux phrases.

| type | usage | champs clés |
|---|---|---|
| accroche | toujours en premier | titre, surligne, sur_titre |
| repo | présenter un dépôt GitHub | nom, description, etoiles/licence/langage/mis_a_jour **copiés de `fm repo`**, points |
| terminal | une commande réelle | lignes (cmd / sortie / succes / commentaire) — seulement des commandes de la doc |
| code | un fichier réel (SKILL.md, config) | fichier, code (extrait réel), surligner |
| etapes | une méthode en 2-4 étapes | etapes[].titre / detail / icone / sur_mot |
| liste | avantages, checklist | items[].texte / etat / sur_mot |
| comparaison | avant/après, X vs Y | gauche, droite |
| chiffre | un nombre marquant sourcé | valeur, suffixe, legende |
| citation | phrase officielle marquante | texte (traduction fidèle), auteur |
| capture | montrer la vraie page | image (via `fm capture`), zoom, surlignage |
| titre | chapitre / transition | titre, icone |
| cta | toujours en dernier | titre, sous_titre, action |

- `sur_mot` fait apparaître un élément quand le mot est prononcé : l'image suit la voix.
- `fantome` (facultatif, un réglage par défaut existe pour chaque type) : `position` (centre, bas,
  bas-gauche, bas-droite, haut-droite, gauche, droite), `expression` (neutre, joie, surprise, clin, reflexion,
  determine, triste, amour, malicieux, chargement), `geste` (repos, salut, explique, pointer-haut,
  pointer-gauche, pointer-droite, pointer-toi, pouce, reflexion, celebre, presente, tape, haussement).
- `temps_forts` : 1-2 réactions d'Ecto sur un mot précis, ex.
  `{ "sur_mot": "gratuit", "expression": "joie", "geste": "pouce", "son": "ding" }`.
- Transitions : `glisse` par défaut, `zoom` pour une révélation, `flash` pour un choc, `balayage` pour une liste.
- Icônes : noms Lucide en PascalCase (Rocket, Terminal, Sparkles, Zap, Bot, Brain, Workflow, Puzzle,
  ShieldCheck, Clock, Euro, TrendingUp, FileText, FolderGit2, Plug, Search, Wrench…).
- Textes à l'écran courts : ce sont des repères, la voix porte l'explication.

## 5. Sources et affirmations
- `sources[]` : URL exacte, titre, type (officielle / github / documentation / presse / communaute),
  `date_publication` (AAAA-MM-JJ) si connue, `consultee_le` (ISO).
- `affirmations[]` : TOUT fait vérifiable du script ou de l'écran (fonction, chiffre, date, nom de modèle,
  prix, licence, compatibilité) → `texte` (tel que dit en français), `source`, `citation` = copie
  **exacte** (8-300 caractères, langue d'origine, sans retouche). `statut` reste `a_verifier`.
- Nombres (étoiles, prix) : venant de la source ou de `fm repo` le jour même ; à l'oral arrondir vers le bas
  (« plus de 190 000 »).
- Preuves vérifiées en direct par le code (à la place d'une citation textuelle) :
  `api:github:owner/repo:etoiles>=190000` (aussi `forks`, `licence`, `archive`, `fichiers_skill`,
  `jours_depuis_activite`) et `api:npm:<paquet>@<version>:publie=AAAA-MM-JJ` pour dater une version
  (ex. `api:npm:@anthropic-ai/claude-code@2.1.323:publie=2026-11-12`). Source correspondante :
  `https://github.com/owner/repo` ou `https://registry.npmjs.org/<paquet>`.
- Une « nouveauté » se prouve par une date : `date_publication` sur la source + une affirmation datée.
- Une opinion n'est pas une affirmation ; une promesse d'effet (« ça te fait gagner 3 h ») en est une :
  la sourcer ou la retirer.

## 6. Publication
- `titre` ≤ 70 caractères, promesse claire, sans clickbait mensonger.
- `description_tiktok` : 1-2 phrases + une question pour lancer les commentaires.
- `description_youtube` : 2-4 phrases utiles (sources et mention d'indépendance ajoutées automatiquement).
- `hashtags` : 3 à 6, pertinents (#claude #claudecode #ia #automatisation…).

## 7. Production (corriger puis relancer à chaque échec)
1. `npm run fm -- valider <id>`
2. `npm run fm -- verifier <id>`, puis déléguer au sous-agent **verificateur** ; appliquer ses corrections
   (puis `verifier` à nouveau si le texte a changé).
3. `npm run fm -- voix <id>`
4. `npm run fm -- rendu <id>`
5. `npm run fm -- qc <id>` ; puis lire `episodes/<id>/planche.jpg` et contrôler : textes lisibles et sans
   débordement, rien de coupé, Ecto bien placé, visuels cohérents avec la voix. **Zoomer** sur les sous-titres
   (recadrer la planche en pleine résolution) : un espace manquant autour du mot en couleur (« deressources. »)
   ne se voit pas en miniature.
   Enregistrer : `npm run fm -- qc <id> --visuel ok --note "…"` (ou `--visuel ko`, corriger, relancer).
6. Orthographe : corriger les fautes ; n'ajouter à `config/lexique.txt` que des mots corrects.
Trois itérations au maximum : au-delà, abandonner le sujet (noter pourquoi) plutôt que livrer une vidéo moyenne.
