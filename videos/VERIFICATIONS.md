# Vérifications qualité (faites sur les `final.mp4`)

| | video-01-mot-secret | video-02-telephone | video-03-messages |
|---|---|---|---|
| Format | 1080×1920 · 30 i/s | idem | idem |
| Codecs | H.264 + AAC stéréo 48 kHz | idem | idem |
| Durée (35–60 s exigés) | 55,3 s | 53,6 s | 59,2 s |
| Mots (≈ 160–180 visés) | 168 | 158 | 171 |
| Loudness intégrée | −14,8 LUFS | −15,4 LUFS | −15,1 LUFS |
| Crête échantillon | −0,7 dBFS | −0,8 dBFS | −0,8 dBFS |
| Images noires ≥ 0,3 s / figées ≥ 1,5 s | aucune | aucune | 0,4 s : fondu final avant la question (voulu) |
| Images corrompues (rendu, détecteur) | 0 | 0 | 0 |
| Synchro sous-titres ↔ attaques de la voix | médiane 6 ms · max 66 ms | médiane 5 ms · max 58 ms | médiane 5 ms · max 74 ms |
| Caméras (`verifier-conte.ts`) | OK · 39 plans | OK · 31 plans | OK · 46 plans |

Méthodes :
- `ffprobe` (format, codecs, durée) ; `ffmpeg ebur128` (loudness, crête) ; `blackdetect` / `freezedetect`.
- Images corrompues : détecteur « image très différente de ses deux voisines » (les rendus à concurrence 2 en contenaient 11–13 % ;
  les rendus finaux à concurrence 1 : 0). Chaque image suspecte est regardée à l'œil.
- Synchro : pour chaque mot qui suit une vraie pause, instant d'attaque de l'énergie dans la voix comparé au début de mot du minutage
  qui pilote les sous-titres (`scripts/verifier-synchro.py`, hors ligne). Le minutage lui-même sort de l'alignement du modèle de voix.
- Relecture visuelle : planche de 24 images extraites de chaque MP4 final, plus images isolées des moments clés ; une 1re version
  de « mot secret » avait des plans illisibles (porte, dessous du lit) : corrigés puis re-rendus.
- Piste audio : limiteur à l'assemblage (crête < 0 dBFS), vidéo copiée sans ré-encodage.

Limites connues (honnêteté) :
- L'audio n'a pas été écouté : mixage contrôlé par mesures et calage par code. La voix Piper est naturelle mais moins expressive qu'une
  voix de studio ; un rythme plus rapide est appliqué avant le twist.
- Mot secret : sombre par choix ; la main sur le bras (s03p4) et la main sur la clé (s03p2) restent peu lisibles ; la cave n'est pas montrée (suggestion).
- Téléphone : le plan où la sœur grandit (s02p2) est le moins lisible ; l'écran reflété dans les yeux du narrateur est un effet voulu un peu étrange.
- Messages : monde rose assez monochrome ; mains/pouce « pixellisés » du narrateur peu précis ; vitesse de certains plans (≈ 1,3 s) soutenue.
- Contenu généré par IA (à déclarer sur les plateformes) ; histoires originales, inspirées uniquement des mécaniques des concepts demandés.
