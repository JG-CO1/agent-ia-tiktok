# Architecture

## Principe
Deux couches seulement :
1. **Un CLI déterministe** (`npm run fm -- …`, TypeScript) : veille mesurable, vérification des sources,
   voix, rendu, contrôle qualité, publication, statistiques. Testable, reproductible, sans IA.
2. **Claude Code** (Skills + un sous-agent) : le jugement éditorial — choisir les sujets, écrire, vérifier le
   sens, corriger. Il pilote le CLI et ne touche jamais aux identifiants de publication.

```
             ┌────────────── GitHub Actions (Europe/Paris) ───────────────┐
 05:10       │ production.yml                                              │
             │  Claude Code -p "skill produire-journee"                    │
             │   ├─ fm veille ─► data/veille, data/backlog.json            │
             │   ├─ (WebSearch/WebFetch, fm repo) ─► data/plans/<date>.json │
             │   └─ ×3 : fm nouveau → episode.json → fm valider            │
             │           → fm verifier → sous-agent verificateur → verdicts│
             │           → fm voix (ElevenLabs) → fm rendu (Remotion)      │
             │           → fm qc (+ revue visuelle de la planche)          │
             │  fm revue <id> : YouTube privé + Release + issue « 🎬 Revue »│
             └────────────────────────────────────────────────────────────┘
 toi         │ approbation.yml : /approuver · /rejeter … · /corriger …     │
             │   approuver → YouTube programmé (publishAt = créneau)       │
 08:55 12:55 │ publication.yml : fm publier → TikTok (brouillon ou direct),│
 18:55       │   vérification YouTube, historique, commentaire dans l'issue│
 07:20       │ analytics.yml : fm stats + fm rapport ; lundi : bilan Claude │
             └────────────────────────────────────────────────────────────┘
```

## Le contrat : `episodes/<id>/episode.json`
Défini et validé par `src/schema/episode.ts` (zod). Contient : sujet, angle, accroche, **sources**,
**affirmations** (texte + source + citation exacte), **scènes** (type de visuel + voix + direction d'Ecto),
textes de publication, statut, journal et état de diffusion (renseigné uniquement depuis les API).

Cycle de vie : `brouillon → redige → (verifie) → voix → rendu → qc_ok → en_revue → programme → publie`
(ou `rejete` / `echec`).

## Garde-fous contre l'invention
| Étape | Contrôle | Type |
|---|---|---|
| `fm valider` | schéma, durée estimée 30–60 s, intros interdites, promesses de gains, « nouveauté » sans source < 21 j | code |
| `fm verifier` | chaque source répond et est **archivée** (`sources/*.txt`) ; chaque citation est retrouvée **mot pour mot** ; chiffres GitHub recontrôlés **en direct** par l'API | code |
| sous-agent `verificateur` | la citation prouve-t-elle exactement l'affirmation ? faits non sourcés ? commandes inventées ? | IA indépendante |
| `fm qc` | refuse si une affirmation n'est pas `verifiee` | code |

## Moteur vidéo (`video/`, Remotion)
- `Episode.tsx` assemble : fond de marque, scènes (12 templates dans `scenes/`), Ecto (`ghost/`),
  sous-titres mot à mot, badge de format, badge source, barre de progression, voix, effets, musique.
- La **timeline** (`src/core/timeline.ts`) est calculée depuis le minutage réel de la voix : chaque scène
  démarre sur son premier mot, chaque élément peut apparaître sur un mot précis (`sur_mot`), Ecto réagit sur des
  mots (`temps_forts`), la bouche suit l'enveloppe de la voix.
- **Ecto** est un modèle 3D procédural (Three.js) : identique au pixel près d'une vidéo à l'autre. L'éclairage
  est pré-calculé en *matcaps* depuis des matériaux PBR (rendu ~2× plus rapide, aspect identique).
- Grille 1080×1920 respectant les interfaces TikTok/Shorts (`video/theme.ts > LAYOUT`).
- Audio : voix traitée (filtre, compression, loudnorm), effets et fond musical **générés par nos soins**
  (`src/audio/synth.ts`), mastering final à −14 LUFS / −1 dBTP.

Performances mesurées (4 cœurs, rendu logiciel) : ~3 images/s → une vidéo de 45 s en ~7 min.

## Contrôle qualité (`fm qc`)
Format 1080×1920, H.264/yuv420p BT.709, 30 i/s, durée, poids, loudness, crête, **aucun silence > 1,2 s**,
images noires/figées, couverture et synchronisation des sous-titres, accroche immédiate, orthographe (hunspell +
lexique), provenance et licence de chaque asset, absence d'affiliation suggérée, anti-doublon (60 jours),
voix de production, faits vérifiés, revue visuelle de la planche contact. Rapport : `qc.json`.

## Sécurité
- L'agent qui lit des contenus externes (README, pages web : risque d'injection de consignes) n'a ni les
  identifiants YouTube/TikTok ni le jeton d'écriture GitHub dans son environnement ; il n'exécute que
  `npm run fm …` et ses outils de lecture.
- Les secrets vivent dans GitHub Actions (chiffrés) ; les jetons TikTok renouvelés sont chiffrés (AES-256-GCM).
- Seul le **propriétaire** du dépôt peut approuver (`author_association == OWNER`) ; le texte des commentaires
  est traité comme une donnée, jamais exécuté.

## Stockage
- Git : épisodes (JSON, sources archivées, captures), données (backlog, historique, stats, rapports,
  apprentissages), journal des opérations (`data/journal/*.jsonl`).
- Releases GitHub `videos-AAAA-MM` : vidéos finales et planches (sauvegarde, et source pour la publication).

## Étendre
- Nouveau type de scène : ajouter le schéma dans `src/schema/episode.ts`, le composant dans `video/scenes/`,
  l'enregistrer dans `video/Episode.tsx`, une direction par défaut dans `DEFAULT_GHOST`.
- Nouvelle source de veille : un collecteur dans `src/veille/collect.ts` qui renvoie des `Candidate`.
