---
name: radar-tendances
description: Trend Radar de Studio Phantom. Repère deux fois par semaine (lundi et jeudi) les sujets qui montent dans la niche Claude / Claude Code / agents IA / business IA, vérifie qu'ils sont réels et datés, note leur cycle de vie et écrit data/radar/<date>.md. À utiliser pour la veille de fond, avant de générer des idées, ou quand on demande « qu'est-ce qui monte en ce moment ».
---

# Trend Radar (Studio Phantom)

Complète `veille-claude` (qui alimente le plan du jour) : le radar cherche **ce qui prend de l'ampleur**, pas seulement ce qui vient de sortir.
Rythme : lundi et jeudi (la production quotidienne lance le radar ces jours-là, avant `veille-claude`), ou à la demande.
Cycle de vie des tendances : s'appuyer sur le skill `trend-radar` (émergence → croissance → pic → saturation) et sur `platform-fluency`.

## 1. Collecter (dans l'ordre, s'arrêter dès qu'il y a assez de matière)
1. `npm run fm -- veille --jours 7` : GitHub (nouveaux dépôts et skills), changelog Claude Code, release notes, actualités Anthropic, Hacker News.
2. WebSearch / WebFetch, 4 à 8 requêtes ciblées : Claude Code, nouveaux skills, agents autonomes, automatisations, « built with Claude », Product Hunt (outils IA), blogs IA, communautés Claude Code (Reddit, forums publics).
3. Réseaux (X, TikTok, Instagram, YouTube) : **uniquement des pages publiques accessibles sans connexion** (résultats de recherche, posts publics). Aucun scraping, aucune connexion à un compte, aucun contournement. Ce qui ne s'ouvre pas est noté « non lu » dans le rapport : ne jamais en déduire une tendance.

## 2. Vérifier chaque sujet (sinon il est écarté)
1. Il existe : ouvrir la **source primaire** (annonce, dépôt, changelog, doc).
2. Date exacte de publication ; une « nouveauté » = source datée de moins de 21 jours. Ancienne fonction = jamais « nouveau ».
3. Dépôt : `npm run fm -- repo owner/nom` (archivé, inactif > 4 mois, sans README, contenu douteux → écarté).
4. Une démonstration concrète est possible (sortie visible, projet qui tourne) ?
5. Pertinence pour l'audience francophone, doublon dans `data/historique.json` (60 jours).
6. Signal de traction réel (étoiles/jour, discussions) : le chiffre est cité avec sa source et sa date, jamais estimé.

## 3. Classer
Pour chaque sujet retenu : phase du cycle (émergence / croissance / pic / saturation), catégorie A–H (voir `moteur-idees`), « mérite une vidéo ? » (oui / réserve / non) et pourquoi en une ligne.
Un sujet en **saturation** n'est retenu que s'il apporte un angle inédit.

## 4. Écrire
- `data/radar/AAAA-MM-JJ.md` : tableau (sujet, source + date, phase, catégorie, démonstration possible, verdict) + section « Non lu / non vérifié ».
- Mettre à jour `STUDIO_PHANTOM_KNOWLEDGE.md` : sections « Tendances détectées » et « Nouveaux outils » (une ligne datée par sujet, pas de doublon).
- Alimenter `moteur-idees` : les sujets « oui » deviennent des idées à noter.

Ne rien publier, ne rien promettre : le radar produit de l'information vérifiée, pas du contenu.
