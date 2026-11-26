---
name: moteur-idees
description: Moteur éditorial de Studio Phantom pour une vidéo : 10 idées notées /100, 5 hooks notés, script court orienté démonstration, contrôle de rétention et packaging (titre, description, hashtags, commentaire épinglé, versions TikTok / Shorts / Reels). À utiliser avant d'écrire un épisode, ou pour choisir le meilleur sujet du jour.
---

# Moteur d'idées, de hooks et de scripts (Studio Phantom)

S'insère dans `produire-journee` / `ecrire-episode` : il décide **quoi** produire et **comment l'ouvrir** ; les règles de preuve (`fm valider`, `fm verifier`, `verificateur`) restent inchangées et passent avant tout.

## 1. Dix idées minimum, notées /100
Catégories : **A** Claude tricks · **B** AI business · **C** Claude Code · **D** AI automation · **E** GitHub discoveries · **F** AI news · **G** AI experiments · **H** Money & productivity.
Sources : sujets vérifiés du radar (`radar-tendances`), `data/plans/`, `data/backlog.json`, `STUDIO_PHANTOM_KNOWLEDGE.md` (idées en réserve).
Éviter les contenus génériques (« 5 outils IA incroyables ») quand une démonstration concrète est possible.
Noter chaque idée de 0 à 10 sur : viral, originalite, utilite, curiosite, partage, sauvegarde, demonstration, actualite
(aides : `viral-short-form-ideas` et sa grille `references/idea-evaluation.md`, `content-strategy`, `marketing-psychology`).
Écrire la liste dans un JSON (`titre`, `categorie`, `scores`, `source`, `date_source`, `verifiee`, `nouveaute`, `demonstration_realisable`) puis :
`npm run fm -- idees <fichier.json>` → classement calculé en code (pondérations fixes : viral 15, originalité 10, utilité 15, curiosité 15, partage 10, sauvegarde 10, démonstration 15, actualité 10 ; idée non vérifiée, sans source, ou fausse « nouveauté » = jamais retenue).
Retenir les meilleures en variant les catégories de la journée.

## 2. Cinq hooks
L'ouverture de la chaîne est imposée (voir `ecrire-episode` §2 : « Arrête de scroller, car maintenant, avec Claude (Code), … »). Les 5 hooks sont donc **5 versions de la promesse qui la suit**, avec 5 leviers différents.
Aides : `viral-hooks`, `hook-anatomy`. Chaque hook doit être compris tout de suite, créer de la curiosité, annoncer une promesse précise, correspondre au contenu réel.
`npm run fm -- hook "<hook 1>" "<hook 2>" …` classe les hooks /100 (aide au tri, pas une prédiction). Choisir le meilleur dont **chaque fait est prouvé** ; citer les 4 autres dans le bilan.
Les exemples « il construit ton business pendant que tu dors », « ce repo transforme Claude en employé » ne sont **pas des affirmations à reprendre** : seulement ce que la source prouve.

## 3. Script et démonstration d'abord
Une seule idée centrale. Structure indicative : 0-3 s hook · 3-8 s problème/opportunité · 8-20 s démonstration · 20-35 s résultat concret et intérêt · 35-45 s conclusion ou question orale. Durée 30–40 s (apprentissages).
**Démonstration d'abord** : montrer le résultat à l'écran (capture réelle `fm capture`, commande réelle de la doc, sortie réelle). Si la démonstration n'a pas été réalisée, ne jamais la présenter comme une expérience personnelle : dire ce que dit la source (« le README montre… »).
Business : distinguer ce qui est automatisable, ce qui exige un humain, les coûts, les compétences, les limites ; jamais de revenus promis ni de chiffre de gains non sourcé.

## 4. Rétention (relire le script et la planche)
Repérer : passage trop long, info inutile, plan sans intérêt visuel, explication trop technique, répétition, moment où l'on quitte. Corriger avec le moteur de montage (caméra, tableaux tirés par Ecto, plongées sur « scroller » et 1 à 2 phrases percutantes, sous-titres, un seul bruitage par tableau). Chaque seconde apporte un élément : texte animé, avant/après, capture réelle, chiffre, révélation.

## 5. Packaging (dans `episode.json > publication`)
`titre` (≤ 70 car., promesse claire) · `description_tiktok` (1–2 phrases + question, mots de recherche : Claude, Claude Code, IA, automatisation) · `description_youtube` (2–4 phrases utiles) · `hashtags` (3 à 6, pas de spam) · `commentaire_epingle` (question courte qui appelle une réponse) · CTA oral naturel (question de fin). Les trois versions partent du même fichier ; seules les descriptions diffèrent (YouTube plus complète). Aides : `viral-captions-and-ctas`, `viral-tiktok-content`, `viral-youtube-shorts`, `viral-instagram-reels`.

## 6. Mémoire
Après chaque vidéo, ajouter à `STUDIO_PHANTOM_KNOWLEDGE.md` : hook utilisé + note, idées écartées gardées en réserve, erreurs rencontrées. Lire ce fichier au début de chaque production.
