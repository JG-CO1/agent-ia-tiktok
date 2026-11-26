# Studio Phantom — base de connaissances permanente

Lire en début de production ; compléter après chaque vidéo. Chaque entrée : une ligne, datée, avec sa source. Pas de doublon.
Studio Phantom = Studio Fantôme (identité à l'écran inchangée : nom « Studio Fantôme », avatar Ecto, direction artistique et personnage identiques).

## Tendances détectées
- 2026-11-26 — Les **skills pour agents** (SKILL.md) explosent en nombre et en étoiles : `coreyhaines31/marketingskills` (plus de 62 000 étoiles), `ponytail` (plus de 199 000), `graphify` (plus de 153 000), `archify` (plus de 100 000), `caveman` (plus de 123 000) ; chiffres relevés par `fm repo` le 26/11. Phase : croissance / pic. Angle d'avance : démonstrations mesurées, pas des listes.
- 2026-11-23 → 26 — Claude Code sort une version par jour ou presque (2.1.327 → 2.1.332) ; sujets récurrents : hooks et confiance du dossier (2.1.329), `/tasks` (2.1.329), skills et commandes shell au chargement (2.1.332). Frein éditorial : la règle anti-doublon bloque une actu changelog si la source a déjà servi (< 60 jours).
- 2026-11-24 — Retrait annoncé de Claude Opus 4.5 (release notes). 2026-11-18 → 20 — introduction en bourse d'Anthropic (actu d'entreprise : faits seulement, aucun conseil financier).
- 2026-11-12 — Claude Managed Agents auto-hébergés ; 2026-11-09 — Claude Fable 5.2 (traités ; voir historique).
- Non lu faute d'accès public : X, TikTok, Instagram, Product Hunt (le radar ne lit que des pages publiques sans connexion).

## Meilleures idées en réserve (classement `data/idees/2026-11-26.json`)
1. Expérience « même tâche avec et sans ponytail » (G, 83) — voir `data/idees/2026-11-26-concepts.md`.
2. Reviewer de code `alibaba/open-code-review` (D, 78). 3. Audits de page de conversion avec le skill `cro` (B, 76,5).
4. `caveman` — réduire les réponses et sorties d'outils (E, 75). 5. `graphify` — dépôt en graphe interrogeable (E, 74). 6. `archify` — schéma interactif (E, 74).

## Hooks et ouvertures
- Ouverture de la chaîne depuis le 23/11 (choix du propriétaire) : « Arrête de scroller, car maintenant, avec Claude (Code), … », sans effet sonore, avec plongée d'Ecto vers la caméra sur « scroller ». Remplace « Hop hop hop, arrête de scroller ! … ».
- Les accroches « nom Claude + changement concret » font les meilleures actus (Fable 5.2 : 586 vues TikTok ; managed agents : 679). Signal, n = 3 (22/11).
- Outil : `npm run fm -- hook "…"` note une accroche /100 ; elle ne prouve pas la vérité, qui reste contrôlée par `fm verifier`.
- Interdits : commencer par « Un… / Voici… / Et si… / Aujourd'hui… », hyperboles, promesse de gains, piège à clics.

## Formats éditoriaux
- Découverte (matin), business (midi), actu (soir), 30 à 40 s, une seule idée, une question orale en fin de vidéo.
- Style visuel : caméra virtuelle bornée, tableaux hissés à la corde par Ecto (calme / sec / en galérant), plongées d'Ecto sur 1 à 2 phrases percutantes, visage qui change toutes les ~2 s, un seul bruitage par tableau, intro sans bruitage.
- Idée de service (business) : toujours « idée à tester », jamais un revenu promis ; distinguer automatisable / humain / coûts / limites.

## Erreurs à éviter (vécues)
- Citation trop courte qui ne prouve pas le fait (affirmations a6/a9 du 25/11) : copier jusqu'au mot qui prouve (« Remotion », « faire un court »).
- Généraliser une portée (« Claude Desktop **et hôtes non interactifs** », 25/11) ; dire « cette semaine » pour un lundi qui suit un vendredi ; écrire « créé le … » sans preuve de date de création.
- Présenter comme nouveau ce qui ne l'est pas (« maintenant » doit rester vrai).
- Compter sur le MP4 d'un run interrompu : les MP4 et la voix ne sont pas versionnés → un épisode « rendu » sans fichier doit être refait.
- Plusieurs boucles de rendu en même temps : elles se marchent dessus ; une seule file.
- L'agent de production est refusé quand le crédit Claude est épuisé (25 et 26/11) : un épisode terminé doit pouvoir partir sans lui.
- TikTok brouillon : l'API n'accepte aucune légende ; la description est à coller (page des légendes).

## Résultats des expériences
- Montage dynamique + nouvelle ouverture : en cours, aucune conclusion (voir `STUDIO_PHANTOM_ANALYTICS.md`).
- Question orale de fin : en cours (commentaires à suivre).

## Nouveaux outils et skills intéressants
- Installés (relus, texte pur) : voir `docs/SKILLS-EXTERNES.md` — `viral-*`, `remotion-motion-graphics`, `social`, `copywriting`, `content-strategy`, `marketing-psychology`, `marketing-ideas`, `analytics`, `hook-anatomy`, `trend-radar`, `platform-fluency`, `read-the-room`, `content-autopsy`, `repurpose-engine`, `voice-matching`.
- Refusés : Melvynx/video-agent-skills et la partie vidéo/éditeur de scrollmark/social-skills (shell libre, clés dans `.env`, installateurs `curl | sh`).
- Outils maison : `fm idees`, `fm hook`, `fm veille`, `fm repo`, skills `radar-tendances` et `moteur-idees`.

## Enseignements des analytics
- Voir `STUDIO_PHANTOM_ANALYTICS.md` (relevé du 25/11) et `data/apprentissages.md`. Rien de conclu sur moins de 3 vidéos.
