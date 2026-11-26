---
name: produire-journee
description: Produit les 3 vidéos d'une journée de bout en bout (veille, plan, écriture, vérification, voix, rendu, contrôle qualité) jusqu'à l'état « publiable ». À utiliser par le workflow quotidien ou quand on demande de produire les vidéos d'une date.
---

# Production quotidienne

Entrée : une date AAAA-MM-JJ (par défaut : demain si l'heure de Paris est après 12 h, sinon aujourd'hui).

1. Lire `CLAUDE.md`, `data/apprentissages.md`, puis `npm run fm -- etat` : ne pas refaire un créneau déjà produit.
   **Reprise d'abord** : si un épisode de la date est déjà écrit et vérifié mais pas encore publiable (statut
   `redige`, `verifie`, `voix` ou `rendu`, sans raison d'abandon dans son journal), le reprendre là où il s'est
   arrêté (`valider`/`verifier` si besoin, puis `voix`, `rendu`, `qc`, revue visuelle) **avant** tout nouveau sujet,
   sans réécrire son texte. Si les 3 créneaux de la date ont déjà un épisode publié ou programmé, ne créer aucun
   nouvel épisode : la reprise est le seul travail du jour (pas de veille, pas de nouveau plan).
1 bis. Lire `STUDIO_PHANTOM_KNOWLEDGE.md` (tendances, hooks qui marchent, erreurs à éviter). Le lundi et le jeudi, lancer d'abord
   le skill `radar-tendances` (Trend Radar), puis le skill `moteur-idees` pour noter ≥ 10 idées et choisir les sujets.
2. Skill `veille-claude` → `data/plans/<date>.json` (3 sujets + 1 ou 2 sujets de réserve).
3. Pour chaque créneau 1, 2, 3 : `npm run fm -- nouveau <date> <n> <slug>`, puis skill `ecrire-episode`
   jusqu'à un `qc.json` avec `"publiable": true` (revue visuelle comprise). Si un sujet échoue 3 fois,
   passer au sujet de réserve.
4. Écrire `data/plans/<date>-bilan.md` : pour chaque créneau, id, statut, durée, points d'attention.
   Ne jamais déclarer prêt un épisode dont le QC n'est pas publiable.
5. Ne lance pas `fm revue` ni `fm publier` : le workflow le fait ensuite avec ses propres identifiants.

Rester efficace : une vidéo = un sujet bien vérifié, sans recherches superflues.
