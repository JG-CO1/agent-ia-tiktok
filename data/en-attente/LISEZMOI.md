# Épisodes en attente (hors production)

Épisodes écrits et vérifiés le 2026-11-23, rangés ici pour qu'aucun workflow ne les reprenne ni ne les publie
sans décision du propriétaire. Pour en remettre un en production : le déplacer dans `episodes/` sous un identifiant
de la date voulue (`AAAA-MM-JJ-<créneau>-<slug>`, champs `id`, `creneau`, `publication_prevue` à mettre à jour),
statut `verifie` ; le workflow de production le reprendra (voix, rendu, contrôle qualité) avec le montage actuel.

- `2026-11-23-2-video-promo-shotcraft` (business) : idée de service « vidéos promo produit », déjà écrite
  avec l'ouverture « Arrête de scroller, car maintenant… ». Prête à être redatée.
- `2026-11-23-3-claude-code-hooks-confiance` (actu Claude Code 2.1.329) : bloqué par le contrôle anti-doublon
  (le changelog de Claude Code est déjà la source d'un épisode publié depuis moins de 60 jours), comme les autres
  actus de changelog restées au statut `rendu`. À débloquer seulement si le propriétaire assouplit cette règle.

- `2026-11-27-1-ponytail-agent-flemmard` (découverte, prévu le 27/11 à 9 h) : épisode sur la skill `ponytail`, vérifié (10 affirmations),
  voix, rendu et contrôle qualité passés, revue visuelle faite. **En attente de l'accord du propriétaire** avant toute publication
  (le cahier des charges Studio Phantom demande « ne rien publier sans autorisation »). Pour le lancer : le remettre dans `episodes/`,
  y copier `video.mp4` (non versionné, voir le dossier), pousser, puis lancer la production ; l'envoi en revue le programme.
