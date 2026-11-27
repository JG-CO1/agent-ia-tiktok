# Série « In This Town » (compte @tryhowww) — mode d'emploi

Moteur : **Remotion + Three.js**, rendu local, aucun générateur vidéo externe. Style « capture de jeu en blocs » (aplats, aucune lumière réelle).

## Fabriquer la vidéo `huss-001`
```bash
export NODE_USE_ENV_PROXY=1          # (cloud) le fetch de Node doit passer par le proxy de l'environnement
npx tsx scripts/gen-sfx-ville.ts     # bruitages + musique de fête (une fois ; déjà dans video/public/sfx/ville/)
npx tsx scripts/histoire.ts voix huss-001        # voix ElevenLabs + minutage + sous-titres (ELEVENLABS_API_KEY)
npx tsx scripts/verifier-ville.ts huss-001       # contrôles automatiques image par image
npx tsx scripts/histoire.ts planche huss-001 plans   # planches contact à regarder
npx tsx scripts/histoire.ts rendu huss-001       # MP4 1080×1920 30 i/s -> histoires/sorties/huss-001/huss-001.mp4
npx tsx scripts/histoire.ts storyboard huss-001  # storyboard minuté (instants réels de la voix)
```
`RENDER_CONCURRENCY=4` accélère le rendu sur une machine à 4 cœurs.

## Ce qui change d'une vidéo à l'autre / ce qui ne change pas
| Je change… | Où |
|---|---|
| le **script**, la **narration**, les **mots affichés** | `histoires/recits/<id>.json` (`scenes[].texte`) ; les mots affichés suivent la voix (un mot à la fois) |
| les **scènes** (plans, caméra) | `video/histoire/blocs/ville/episodes/<id>/plans.ts` : un plan = une caméra qui démarre sur un mot `[scène, mot]` |
| les **personnages secondaires** | `video/histoire/blocs/ville/episodes/<id>/index.ts` (`secondaires`) et `ville/tenues.ts` (couleurs, chapeau, casquette, tablier…) |
| le **tir**, la **musique**, les **regards** du joueur | `index.ts` de l'épisode (`tir`, `musique`, `regards`) : des repères `[scène, mot]` |
| la **prononciation** de la voix (« HUSS » → « Heuss ») | récit : `"prononciation"` |

| Je ne touche pas (réutilisé tel quel) | Où |
|---|---|
| la **ville** (rue, maisons, terrain bleu et orange, maison de fête) | `ville/lieux.ts`, `ville/monde.ts`, `ville/Decor.tsx` |
| le **joueur** (dribble, prise de balle, tir, joie) et le **ballon** (rebonds, panier) | `ville/joueur.ts`, `ville/anim.ts` |
| la **foule** (marcheurs, danseurs) | `ville/foule.ts`, `ville/donnees.ts` |
| le **système de caméra** | `blocs/maths.ts` (`viser`, `orbite`, `melCam`…) + aides de `plans.ts` |
| le **style** « blocs » et les avatars | `blocs/avatar.tsx`, `blocs/geo.ts` |
| le **moteur de sous-titres** (un mot, blanc, contour noir, centré, « HUSS! ») | `Blocs.tsx` (`Mot`), `blocs/decoupage.ts` (`motsAffiches`) |
| le **minutage** voix → mots → plans → rebonds | `scripts/histoire.ts`, `blocs/decoupage.ts`, `ville/donnees.ts` |

## Nouvelle vidéo « In This Town » en 5 étapes
1. Copier `histoires/recits/huss-001.json` en `histoires/recits/<nouvel-id>.json` ; écrire les scènes (garder `"mise_en_scene": "ville"`, ajouter `"episode": "<nouvel-id>"`).
2. Copier le dossier `video/histoire/blocs/ville/episodes/huss-001/` en `episodes/<nouvel-id>/`.
3. L'inscrire dans `video/histoire/blocs/ville/episodes/registre.ts` (une ligne).
4. Adapter les repères `[scène, mot]` de `plans.ts` et `index.ts` au nouveau texte (`npx tsx scripts/histoire.ts plans <id>` liste les plans et leurs instants).
5. `voix` → `verifier-ville` → `planche` → `rendu`.

## Règles qui valent pour toute la série
Texte 100 % original · personnages inventés (aucun élément d'une marque de jeu) · étiquette « contenu IA » · voix constante d'une vidéo à l'autre · aucune lumière réelle, aucun flou, aucun grain · un seul mot à l'écran · ne jamais publier une vidéo qui n'a pas été inspectée image par image.

## Livrables de `huss-001` (`histoires/huss/livrables/`)
| Fichier | Contenu |
|---|---|
| `huss-001.mp4` | Vidéo finale 1080×1920, 30 i/s, H.264 + AAC, 64,5 s, −15,5 LUFS. **Versionnée temporairement** (la création d'une Release GitHub est refusée à la session de production) : à déposer dans la Release « histoires » puis retirer du dépôt, ou à laisser fabriquer par le workflow `histoires.yml`. |
| `voix-narration.mp3` | Narration ElevenLabs traitée (filtre, compression, loudnorm) |
| `minutage-voix.json` | Mot par mot : début, fin, scène (alignement caractère par caractère d'ElevenLabs) |
| `sous-titres.json` / `.srt` | Un mot à la fois, instants d'affichage exacts (« HUSS! » compris), question finale en dernière entrée |
| `musique-fete-120bpm.wav` | Boucle de 4 s (2 mesures) synthétisée localement ; rebonds du ballon calés sur sa grille pendant « La basse » |
| `planche-finale-mp4.jpg` | 20 images extraites du MP4 final aux instants clés |
Le storyboard minuté est `histoires/huss/STORYBOARD.md` ; le script, `histoires/huss/SCRIPT.md` ; la fiche de référence, `histoires/huss/REFERENCE.md`.

## Contrôles effectués sur le MP4 final (26/11/2026)
- Format : 1080×1920, 30 i/s, 64,53 s, aucune image noire ni figée (`blackdetect`, `freezedetect`).
- Sous-titres ↔ voix : transcription automatique du MP4 (ElevenLabs Scribe), 155 mots appariés, écart médian −0,02 s, au pire 0,14 s.
- HUSS : la transcription les ignore (souffles) ; mesure directe de l'énergie du signal : les 15 HUSS sont à −11/−12 dBFS (niveau des mots parlés) et leur attaque tombe à 0–50 ms de leur sous-titre.
- Ballon : jamais sous le sol, 14 HUSS dribblés sur un rebond (écart 0 ms), le tir traverse le centre de l'anneau à 40 ms du mot « panier » ; la caméra ne traverse aucune maison ni personnage (`scripts/verifier-ville.ts`).
- Non vérifié : l'écoute humaine de la voix (prononciation de « Heuss », qualité du mix). À faire par une personne avant publication.
