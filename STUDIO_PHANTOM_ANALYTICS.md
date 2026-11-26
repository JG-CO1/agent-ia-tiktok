# Studio Phantom — Analytics

> Seules des données réelles y figurent. « n/d » = indisponible ; aucune valeur n'est estimée. Aucune conclusion sur moins de 3 vidéos.
> Je n'ai aucun accès aux statistiques privées des comptes depuis une conversation : tout vient des relevés du pipeline
> (`npm run fm -- stats` : YouTube Analytics, TikTok Display API, Instagram), faits avec les identifiants du dépôt.

## Comment ce fichier se met à jour
1. `npm run fm -- stats` (relevé → `data/stats/derniers.json`) puis `npm run fm -- rapport --jours 14` (→ `data/rapports/<date>.md`).
   Les workflows `analytics.yml` le font chaque matin ; le lundi, le skill `bilan-performances` écrit `data/apprentissages.md`.
2. Recopier ici l'instantané (tableaux par format, créneau, accroche, durée) et les 3 meilleurs / 3 moins bons épisodes, avec la date du relevé.
3. Reporter les constats sourcés dans `STUDIO_PHANTOM_KNOWLEDGE.md` (section « Enseignements des analytics »).

Mesurables aujourd'hui : vues (YouTube, TikTok, Instagram), % moyen vu et rétention à 3 s / 50 % / 90 % (YouTube), likes, commentaires,
partages, abonnés gagnés (YouTube). **Non mesurables par API publique** : rétention et temps de visionnage TikTok, sauvegardes (TikTok,
Instagram) — à relever à la main dans l'application si besoin.

## Instantané — relevé du 2026-11-25 (source : `data/rapports/2026-11-25.md`, 14 derniers jours, 24 épisodes)

| Format | Vidéos avec chiffres | Vues moy. (YT+TT+IG) | % moyen vu (YT) | Rétention 3 s (YT) | Abonnés gagnés moy. (YT) |
|---|---|---|---|---|---|
| découverte | 10 | 540 | 65 % | 117 % | 0,7 |
| business | 7 | 598 | 68 % | 118 % | 0,6 |
| actu | 6 | 794 | 61 % | 112 % | 1 |

| Créneau | Vidéos | Vues moy. | % vu YT | Abonnés moy. |
|---|---|---|---|---|
| matin | 9 | 506 | 65 % | 0,2 |
| midi | 7 | 598 | 68 % | 0,6 |
| soir | 7 | 801 | 61 % | 1,4 |

| Ouverture | Vidéos | Vues moy. | % vu YT | Abonnés moy. |
|---|---|---|---|---|
| « Hop hop hop, arrête de scroller… » | 6 | 652 | 67 % | 1,7 |
| « Arrête de scroller, car maintenant… » | 5 | 548 | n/d (YouTube Analytics a 24 à 72 h de retard) | n/d |

Durée : 22 vidéos de 30 à 40 s (614 vues en moyenne) ; une seule entre 40 et 50 s : pas de comparaison possible.

**Lire ces chiffres avec prudence.** Les vues sont cumulées depuis la mise en ligne : une vidéo de 7 jours et une de 1 jour ne se comparent pas.
Le créneau est lié au format (matin = découverte, midi = business, soir = actu) : on ne peut pas dire si c'est l'heure ou le sujet qui joue.
Une rétention à 3 s supérieure à 100 % est telle que renvoyée par YouTube (rapport à la durée de référence) : ne pas la lire comme un pourcentage de spectateurs.

## Ce que les données permettent de dire aujourd'hui
- TikTok porte la portée : à nombre égal de vidéos, ses vues dépassent celles de YouTube (relevé du 22/11 : 3 040 contre 1 257, n = 11 et 12).
- Meilleures vidéos par vues cumulées, parmi celles de plus de 3 jours (YouTube) : « Claude résout deux problèmes de physique » (452 vues YT, 587 TT), « Claude Fable 5.2 coûte moins cher… » (169 YT, 586 TT), « Managed agents auto-hébergés » (679 TT).
- Meilleur taux de likes TikTok : « mobile-agent-testers » (4,4 %, 24/11, vidéo business), « mcp add-json » (3 %, 19/11).
- Partages quasi nuls (0 à 0,22 %) : aucune vidéo ne déclenche encore le partage.
- Abonnés YouTube gagnés : 0 à 3 par vidéo ; un total faible sur la période.

## Ce qu'on ne peut pas encore dire
- Si « Arrête de scroller, car maintenant… » fait mieux ou moins bien que « Hop hop hop… » : 5 vidéos contre 6, métriques YouTube absentes pour les récentes. **Reprendre le 29/11**, puis à n = 9 de chaque.
- Si le nouveau montage (caméra dynamique, tableaux tirés à la corde, plongées sur Ecto) retient mieux : il n'a été appliqué qu'à partir du 23/11 (TraxAgent) ; première comparaison honnête à 6 vidéos montées ainsi.
- Si le créneau compte, si la durée compte, si les hashtags comptent.

## Questions à suivre (une expérience à la fois)
1. Question orale en fin de vidéo (depuis le 23/11) : commentaires > 0 ? (0 sur les 12 premières vidéos au 22/11.)
2. Montage dynamique : % vu et rétention à 50 % (YouTube) avant/après.
3. Ouverture « Arrête de scroller, car maintenant… » : vues TikTok à 48 h, rétention à 3 s.
