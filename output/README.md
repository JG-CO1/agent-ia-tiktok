# Livrables du jour — 3 histoires « blocs » (style In This Town)

Comptes : TikTok **@tryhowww** · YouTube **histoire-roblox**. « In This Town » n'est qu'un style/thème (hashtag), jamais un nom de compte.

| # | Fichier | Titre à l'écran | Question finale (affichée) |
|---|---|---|---|
| 1 | `video_01_somnambules.mp4` | À 3 HEURES DU MATIN, TOUT LE MONDE SORT DE CHEZ SOI… | Tu ouvrirais la porte à ma place ? |
| 2 | `video_02_ange_gardien.mp4` | J'ÉTAIS L'ANGE GARDIEN DE MA PETITE SŒUR… | Si tu pouvais revoir une personne disparue pendant 10 secondes, qui choisirais-tu ? |
| 3 | `video_03_brouillard.mp4` | CHAQUE JEUDI, QUELQUE CHOSE VIENT NOUS CHERCHER… | Tu ferais encore confiance à ce médecin ? |

Chaque `video_0N/` contient : `script.txt` (narration exacte, question finale, légende + hashtags), `subtitles.srt`
(un mot à la fois, minutage réel de la voix), `scenes/` (image toutes les 2 s extraite du MP4 final, `planche.jpg`,
`storyboard.md`), `assets/` (voix, minutage mot à mot, sous-titres JSON, effets sonores/nappes utilisés).

## Ce qui est produit, et comment
- 100 % local : décors, personnages, caméra, brouillard, lumières et effets sont des blocs 3D originaux rendus par
  Remotion + Three.js (rendu logiciel, sans GPU). Aucun générateur vidéo externe, aucun logo, asset ou personnage Roblox.
- Voix : ElevenLabs (`eleven_v4`), accélérée de 10 % (`atempo`) avec minutage rescalé ; musique d'ambiance et bruitages :
  synthétisés localement (`src/audio/synth-conte.ts`).
- Format : 1080×1920, 30 i/s, H.264 + AAC stéréo ; sous-titres français un mot à la fois ; question finale affichée sur le noir final.
- Les récits sont dans `histoires/recits/{somnambules,ange-gardien,brouillard}.json` ; les mondes dans
  `video/histoire/blocs/conte/<histoire>/` (`monde`/`Decor`, `histoire` = acteurs et événements calés sur les mots, `plans`, `sons`).

## Reproduire les trois rendus
Prérequis : Node ≥ 22, `ffmpeg`/`ffprobe`, Chromium (installé avec Remotion). Voix : `ELEVENLABS_API_KEY` dans `.env`
(jamais commité) ; sans clé, réutiliser les `voix.mp3`/`minutage.json` déjà fournis dans `video_0N/assets/` en les copiant
dans `histoires/sorties/<id>/`.

```bash
npm ci
npx tsx scripts/gen-sfx-conte.ts            # (facultatif) régénère les bruitages dans video/public/sfx/conte
```

Pour chaque `<id>` ∈ `somnambules`, `ange-gardien`, `brouillard` :

```bash
npx tsx scripts/histoire.ts voix <id>        # voix + minutage + sous-titres (ElevenLabs)
npx tsx scripts/verifier-conte.ts <id>       # contrôle des caméras et de la durée (35–60 s)
npx tsx scripts/histoire.ts planche <id> plans <nom>   # planche contact pour relire les plans
RENDER_CONCURRENCY=1 npx tsx scripts/histoire.ts rendu <id>   # MP4 dans histoires/sorties/<id>/<id>.mp4 (voir l'avertissement ci-dessous)
npx tsx scripts/histoire.ts storyboard <id>
npx tsx scripts/assembler-output.ts <id>     # recopie le MP4 et les livrables dans output/
```

**Important : `RENDER_CONCURRENCY=1`, et jamais deux rendus en même temps.** Avec la concurrence 2 (deux onglets Chromium en rendu logiciel `swangle`), environ 11 % des images du MP4 sortent corrompues (image tuilée en bandes). Après chaque rendu, vérifier qu'aucune image n'est corrompue (cf. `VERIFICATIONS.md`). Un rendu complet dure ~15 min par vidéo. Derrière un proxy, préfixer par `NODE_USE_ENV_PROXY=1`.

## Vérifications faites (ffprobe, ffmpeg, Scribe)
Voir `VERIFICATIONS.md` : format, durée, piste audio, loudness, images noires/figées, synchronisation sous-titres ↔ voix.
