---
name: veille-claude
description: Recherche, vérifie et note les meilleurs sujets du jour sur l'écosystème Claude (Skills et dépôts GitHub, outils, nouveautés Claude Code, idées business, actualité IA) selon 6 critères, puis écrit le plan du jour. À utiliser avant d'écrire des épisodes ou pour alimenter le backlog.
---

# Veille Claude

1. `npm run fm -- veille --jours 7`, puis lire `data/veille/<date>.json` (candidats triés par pré-score :
   nouveauté, traction et fiabilité mesurées) et `data/backlog.json`.
2. Compléter par 2 à 4 recherches ciblées (WebSearch) : nouveautés Claude Code, Skills sur GitHub, annonces
   Anthropic récentes, cas d'usage business. Toujours remonter à la source primaire et vérifier la date.
3. Pour 8 à 15 candidats prometteurs :
   - Dépôt GitHub : `npm run fm -- repo owner/nom`. Écarter si archivé, sans README, inactif depuis plus de
     4 mois, contenu douteux (malware, contournement de CGU, scraping abusif). Licence absente : ne jamais
     inciter à réutiliser le code (le dire si on en parle).
   - Actualité : ouvrir la source primaire, relever la date exacte. Écarter rumeurs et fuites, et toute
     « nouveauté » de plus de 21 jours (un tutoriel peut parler d'une fonction plus ancienne sans la dire nouvelle).
4. Noter chaque sujet de 1 à 5 :

   | critère | 5 | 1 |
   |---|---|---|
   | interet_fr | concerne la plupart des utilisateurs francophones de Claude | niche anglophone |
   | nouveaute | moins de 3 jours, ou inédit en français | déjà vu partout |
   | utilite | utilisable aujourd'hui, gain concret | théorique |
   | viralite | effet « waouh » démontrable, surprenant | banal |
   | explicable_60s | une idée, montrable en 3-5 scènes | demande 5 minutes |
   | fiabilite | source primaire vérifiée | rumeur, source unique douteuse |

   Score = moyenne pondérée (fiabilite et utilite comptent 1,5). **fiabilite ≥ 4 obligatoire.**
5. Doublons : consulter `data/historique.json` ; même outil ou même annonce publiés il y a moins de 60 jours
   = écarter (sauf mise à jour majeure, présentée comme telle).
6. Répartition indicative : créneau 1 (matin) Découverte, 2 (midi) Business, 3 (soir) Actu/Tutoriel.
   Flexible : les meilleurs sujets gagnent, en variant les formats dans la journée.
7. Écrire `data/plans/<date>.json` :
   `{ "date", "sujets": [{ "creneau", "format", "titre_de_travail", "angle", "sources": [urls], "scores": {…}, "pourquoi" }], "reserve": [...] }`
   et mettre à jour `data/backlog.json` (statut `retenu` / `ecarte` + note courte).

Business : idées concrètes et réalistes (quoi vendre, à qui, comment Claude aide), jamais de revenus promis ;
un chiffre n'est cité qu'avec sa source.
