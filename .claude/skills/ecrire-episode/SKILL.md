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

## 2. Ouverture et accroche (les premières secondes) — la partie la plus importante
Le spectateur décide de rester ou de swiper en 1 à 2 secondes.

**Ouverture signature (choix du propriétaire, toutes les vidéos, mot pour mot) :**
« Hop hop hop, arrête de *scroller* ! Regarde ces astuces Claude qui peuvent faire évoluer ton business. »
- Une seule astuce dans la vidéo : « … Regarde cette astuce Claude qui peut faire évoluer ton business. »
- Actu qui ne donne ni astuce ni usage concret pour un business (ex. un résultat de recherche) :
  « Hop hop hop, arrête de *scroller* ! Regarde cette nouveauté Claude. » On n'annonce jamais une astuce
  business que la vidéo ne donne pas : ce serait un piège à clics.
- Scène 1 (`type: "accroche"`) = l'ouverture seule : `titre` « Arrête de scroller ! », `surligne` ["scroller"],
  `sur_titre` « Astuce Claude » (ou « Nouveauté Claude »). Le champ `accroche` de l'épisode = cette ouverture
  (début exact de la voix de la scène 1). Ne pas la réécrire, ne pas la raccourcir.

**Accroche du sujet (scène 2, juste après l'ouverture)** : elle doit **créer un manque** (curiosité, enjeu,
surprise) que seule la suite de la vidéo comble. ≤ 12 mots, on entre directement dans le sujet, et elle doit
rester **vraie et sourcée** (pas de piège à clics).

**Méthode obligatoire (pour l'accroche du sujet) :**
1. Écrire **5 accroches candidates**, chacune avec un levier différent (liste ci-dessous).
2. Noter chacune de 1 à 5 sur : *curiosité* (on veut la suite ?), *précision* (chiffre, nom, résultat
   concret), *enjeu personnel* (« toi », ce que tu gagnes ou risques), *vérité* (100 % soutenue par les sources).
3. Garder la meilleure (total le plus haut, vérité = 5 obligatoire). Citer les 4 autres dans
   le bilan de fin (ne pas ajouter de champ à `episode.json`).

**Leviers qui marchent :**
- Erreur / risque : « Tu fais sûrement cette erreur avec Claude Code. »
- Contre-intuitif : « Claude écrit du code… pour se piloter lui-même. »
- Résultat concret et chiffré : « Ce skill gratuit crée une landing page en une seule commande. » (si vérifiable)
- Secret / méconnu : « Presque personne n'utilise cette commande de Claude. »
- Avant / après : « Avant, 2 heures. Maintenant, une seule commande. »
- Interpellation ciblée : « Freelance ? Cette idée de service peut te rapporter des clients. »
- Boucle ouverte : « Le dernier point change tout. » (seulement si le dernier point est vraiment le plus fort)

**À bannir dans l'accroche du sujet** (trop mou, on swipe) : commencer par « Un… », « Une idée de… », « Et si… »,
« Voici… », « Aujourd'hui… », une simple définition, ou une phrase qui ne dit pas pourquoi ça me concerne.
Exemples à ne plus faire → version forte :
- « Un agent open source qui utilise ton iPhone comme toi. » → « Ton iPhone peut maintenant se servir tout seul. »
- « Un audit SEO pour un petit commerce, avec Claude Code. » → « Ce commerce perd des clients sur Google. Claude Code trouve pourquoi. »
- « Quatre modèles Claude portent désormais un filigrane de texte. » → « Ton texte écrit par Claude est maintenant repérable. »

**À l'écran (scène 2) :** l'accroche du sujet est la voix de la scène 2 (`type: "titre"` avec `titre` = 3 à 6
mots en gros, la version la plus choc ; ou une scène visuelle forte : capture, chiffre, repo). Le visuel bouge
ou change dès la 1ʳᵉ seconde (pas d'écran fixe). Dans les 5 secondes qui suivent, la **promesse** dit ce qu'on
va gagner à rester (« En 30 secondes, je te montre comment. »).

## 3. Script (la voix)
- Français oral, tutoiement, phrases courtes (≤ 15 mots), débit ≈ 2,75 mots/s : **85 à 160 mots** au total.
- Structure : ouverture signature → accroche du sujet → promesse (pourquoi rester) → démonstration concrète
  (2-4 scènes) → bénéfice ou limite honnête → appel à l'action. Les 85 à 160 mots comprennent l'ouverture.
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
- `hashtags` : 2 à 4 tags **précis du sujet**, du plus précis au moins précis (#claudecode, #anthropic, nom de
  l'outil…). Le code ajoute lui-même #claudeai #ia, le tag du format (#astuce, #business, #actu) et, sur TikTok,
  #apprendresurtiktok : 5 hashtags au plus par plateforme. Les légendes TikTok prêtes à copier sont publiées sur
  la page `docs/legendes.html` (un brouillon TikTok ne peut pas recevoir de légende par l'API).

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
