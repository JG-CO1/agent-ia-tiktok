# Vérifications des trois vidéos (faites sur les fichiers de `output/`)

| | video_01_somnambules | video_02_ange_gardien | video_03_brouillard |
|---|---|---|---|
| Résolution / cadence | 1080×1920 · 30 i/s | 1080×1920 · 30 i/s | 1080×1920 · 30 i/s |
| Codecs | H.264 + AAC stéréo 48 kHz | idem | idem |
| Durée | 57,47 s | 58,99 s | 56,94 s |
| Poids | 18,8 Mo | 33,9 Mo | 24,9 Mo |
| Loudness intégrée | −15,8 LUFS | −13,5 LUFS | −15,3 LUFS |
| Crête échantillon | −0,6 dBFS | −0,1 dBFS | −0,9 dBFS |
| Images noires ≥ 0,3 s / images figées ≥ 1,5 s (ffmpeg) | aucune | aucune | aucune |
| Images corrompues (détecteur) | 4 suspectes, vérifiées à l'œil : mouvements de tête normaux | 1 suspecte, vérifiée à l'œil : passage voulu de la barrière dans le flashback | 0 |
| Synchro sous-titres ↔ voix (Scribe, mots appariés) | écart max 0,145 s (185 mots) | écart max 0,153 s (191 mots) | écart max 0,129 s (194 mots) |
| Caméras (`scripts/verifier-conte.ts`) | OK, 30 plans | OK, 40 plans | OK, 40 plans |

Méthode :
- `ffprobe` (format, codecs, durée), `ffmpeg ebur128` (loudness, crête), `blackdetect`/`freezedetect`.
- Synchro : la voix de chaque vidéo est retranscrite par ElevenLabs Scribe (horodatage par mot), puis comparée mot à mot au
  minutage qui pilote les sous-titres (même minutage que `subtitles.srt`) ; les sous-titres s'affichent un mot à la fois.
- Relecture visuelle : planche de 24 images extraites de chaque MP4 final (images lues une à une), en plus des planches de plans
  vérifiées pendant la mise au point.
- Détecteur d'images corrompues : une image très différente de ses deux voisines alors que celles-ci se ressemblent ; chaque
  image signalée est décodée et regardée.
- Piste audio : repassée par un limiteur à l'assemblage (`scripts/assembler-output.ts`, crête < 0 dBFS), vidéo copiée sans ré-encodage.

Incident corrigé : les premiers rendus (concurrence 2) contenaient 11–13 % d'images corrompues ; ils ont été refaits à
`RENDER_CONCURRENCY=1`, un seul rendu à la fois (voir `README.md`).

Limites connues (honnêteté) :
- L'audio n'a pas été écouté à l'oreille ; le mixage est contrôlé par mesures (loudness, crête) et le calage par code sur les mots.
- Vidéo 2 : le fantôme est translucide (50 %) et peu contrasté en gros plan ; les plumes du bocal ressemblent à des plaques jaunes.
- Vidéo 3 : tête de la créature en bloc lisse ; les visages n'existent que de face (profils évités) ; la façade du perron reste pâle (brume).
- Voix : synthèse ElevenLabs accélérée de 10 %. Aucun logo ni asset Roblox ; contenu généré par IA (à déclarer sur les plateformes).
