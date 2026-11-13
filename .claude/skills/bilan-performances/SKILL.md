---
name: bilan-performances
description: Analyse les statistiques réelles des vidéos publiées (vues, rétention, partages, abonnés) et met à jour data/apprentissages.md pour améliorer les prochains scripts. À utiliser chaque semaine ou pour tout bilan de performance.
---

# Bilan de performances

1. `npm run fm -- stats`, puis `npm run fm -- rapport --jours 14`, et lire `data/rapports/<date>.md`.
2. Analyser sans extrapoler : formats, créneaux, types d'accroche, durées, sujets. Ne conclure que sur des
   groupes d'au moins 3 vidéos, en citant les chiffres (n, moyenne). Signaler les données manquantes (n/d).
3. Mettre à jour `data/apprentissages.md` (80 lignes max) : « Ce qui marche », « Ce qui ne marche pas »,
   « Hypothèses à tester », « Expérience en cours » (une ou deux à la fois, par exemple accroche question
   contre affirmation sur 6 vidéos). Chaque point : constat + chiffres + date.
4. Règle solide (au moins 8 vidéos, écart net) : proposer l'ajustement de `config/chaine.json`
   (créneaux, durée cible) dans le bilan, sans le modifier sans validation humaine.
5. Résumé de 10 lignes maximum dans `data/rapports/<date>-bilan.md`.
