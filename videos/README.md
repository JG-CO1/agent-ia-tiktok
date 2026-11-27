# Lots 2 et 3 — trois histoires « In This Town » en français (100 % local)

Comptes : TikTok **@tryhowww** · YouTube **histoire-roblox** (« In This Town » = style/hashtag, jamais un nom de compte).

| Dossier | Histoire | Durée | Mots | Titre de publication |
|---|---|---|---|---|
| `video-01-mot-secret/` | Le mot secret | 55,3 s | 168 | Après minuit, chez nous, on n'ouvre qu'au bon mot… |
| `video-02-telephone/` | Le téléphone qui vole la vie | 53,6 s | 158 | Chaque fois que je regarde mon téléphone, quelqu'un que j'aime vieillit d'un an… |
| `video-03-messages/` | Les messages deviennent réalité | 59,2 s | 171 | Tout ce que j'envoie par message devient réel… mais quelque chose disparaît à chaque fois |

Chaque dossier : `final.mp4` (1080×1920, 30 i/s, H.264 + AAC, sous-titres intégrés), `script.md` (narration, chiffres, accroche,
twist, question finale, titre, description, 5 hashtags), `storyboard.md` (scène par scène, plan par plan, avec timecodes),
`assets/` (sous-titres `.srt`/`.json`, minutage mot à mot, récit) et `audio/` (voix + sons utilisés).

## Fabrication (rien d'externe)
- Voix : **Piper** en local (voix française « siwis », CC-BY 4.0) ; le minutage de chaque mot vient de l'alignement du modèle.
  Aucune API de génération (voix, image, vidéo). Installation : `bash scripts/installer-tts-local.sh` (environnement Python `.venv-piper/`
  et modèle dans `models/`, ignorés par git).
- Images : personnages et décors en blocs 3D originaux construits par programmation (Three.js via Remotion), aucun asset de jeu tiers.
- Sons et nappes : synthétisés par programmation (`src/audio/synth-*.ts`). Montage et encodage : Remotion + FFmpeg.

## Reproduire (une vidéo à la fois)
Pour chaque `<id>` ∈ `mot-secret`, `telephone`, `messages` (récit : `histoires/recits/<id>.json`) :
```bash
bash scripts/installer-tts-local.sh                     # une seule fois
npx tsx scripts/histoire.ts voix <id>                   # voix locale + minutage + sous-titres
npx tsx scripts/verifier-conte.ts <id>                  # caméras et durée
npx tsx scripts/histoire.ts planche <id> plans <nom>    # planches de relecture des plans
RENDER_CONCURRENCY=1 npx tsx scripts/histoire.ts rendu <id>   # histoires/sorties/<id>/<id>.mp4
.venv-piper/bin/python scripts/verifier-synchro.py <id> # synchro voix ↔ sous-titres (hors ligne)
npx tsx scripts/assembler-videos.ts <id>                # videos/video-0N-…/ (storyboard, script, final.mp4)
```
**Un seul rendu à la fois, `RENDER_CONCURRENCY=1`** : avec deux onglets de rendu logiciel, ~11 % des images sortent corrompues.
Derrière un proxy, préfixer par `NODE_USE_ENV_PROXY=1`. Un rendu dure ~15 min.

Lot 3 (`video-04-prenom-unique`, `video-05-interdit-sortir`, `video-06-hamburger-interdit`) : voir `LOT3.md`.
