# Bilan de production — 2026-11-23

Les 3 épisodes ont un `qc.json` avec `"publiable": true` (revue visuelle de la planche incluse).
Aucune revue (`fm revue`) ni publication (`fm publier`) n'a été lancée : c'est le rôle des workflows.

| Créneau | Id | Format | Statut | Durée | Musique |
|---|---|---|---|---|---|
| 1 (09 h) | 2026-11-23-1-traxagent-budget-ia | découverte | qc_ok, publiable | 31,4 s | mystérieuse |
| 2 (13 h) | 2026-11-23-2-video-promo-shotcraft | business | qc_ok, publiable | 33,2 s | inspirante |
| 3 (19 h) | 2026-11-23-3-claude-code-hooks-confiance | actu | qc_ok, publiable | 38,4 s | énergique |

## Points d'attention
- **Épisode 1 (TraxAgent)** : produit adossé à un service tiers. La vidéo dit que le serveur MCP relève des offres
  payantes de TraxAgent ; le README annonce aussi une offre gratuite (jusqu'à 100 $ de dépenses IA par mois) et un
  mode démo sans compte, non mentionnés faute de place. Source : README tiers, non vérifié auprès de l'éditeur.
- **Épisode 2 (video-shotcraft)** : idée de service, aucun revenu promis. Le film produit par la skill est en
  paysage 1920×1080 (dit à la voix), pas vertical. Le « client » est présenté comme une idée, pas comme un fait
  de la source. Limites dites : captures de démo à remplacer, licence Remotion possiblement payante pour les entreprises.
- **Épisode 3 (Claude Code 2.1.329)** : date prouvée par le registre npm (19/11/2026), le changelog n'en porte pas.
  Portée de l'avertissement sur les hooks gérés : « Claude Desktop et hôtes non interactifs ».
- Ces sujets sont des dépôts et changements récents ; les changements 2.1.330 et 2.1.327 restent en réserve.

## Accroches écartées
- Épisode 3 : « Ce dossier peut cacher des hooks. Claude Code te le dit maintenant. » (« cacher » non sourcé).
- Épisode 1 : accroche retenue « Où part ton budget IA ? Ce plugin Claude Code répond. »
- Épisode 2 : « Freelance ? Vends des vidéos promo faites avec Claude Code. » retenue.

## Nouveautés de montage utilisées (branche `montage-dynamique`)
Caméra virtuelle (zooms, travellings, punch-in sur les mots en valeur, micro-secousses), parallaxe,
musique dirigée par humeur, « pops » sonores sur les mots d'emphase. Ecto inchangé.

## À décider par le propriétaire
- La règle anti-doublon du contrôle qualité a été assouplie pour les sources génériques (changelog, registre npm,
  notes de version) : le doublon se juge alors sur le numéro de version du sujet (`src/qc/qc.ts`).
- La branche `montage-dynamique` n'est pas fusionnée dans `main` : le workflow de production et de publication
  utilise `main`, donc ces vidéos et le nouveau montage n'y sont pas tant que la fusion n'est pas faite.
- `hunspell` n'est pas installé dans cet environnement : l'orthographe n'a pas été contrôlée automatiquement
  (1 mot inconnu signalé par épisode, non identifié).
