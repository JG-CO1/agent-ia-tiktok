# Lot 4 — trois shorts « In This Town » en français (100 % local)

Comptes : TikTok **@tryhowww** · YouTube **histoire-roblox** (« In This Town » = style/hashtag). Rien n'est publié pour ce lot.

Voix : ElevenLabs (intégration existante, vérifiée fonctionnelle) ; images, décors, personnages, animations, sons et montage : 100 % locaux (Three.js + Remotion + FFmpeg), aucun générateur externe, aucun asset de jeu tiers, aucun logo.

## Présentation des trois vidéos

### `video-07-ville-interdite/final.mp4`
- **Titre** : Dans cette ville, personne n'a le droit de sortir depuis l'arrivée des géants…
- **Description** : Chaque jour, une ombre passe sur les toits et quelqu'un disparaît. Un garçon de onze ans désobéit et découvre à qui appartient vraiment sa ville.
- **Hashtags** : #InThisTown #Mystere #TwistFinal #Suspense #Storytime
- **Twist** : La ville est un jouet posé sur une table : les « géants » sont un enfant qui joue, les disparus sont rangés le soir dans une boîte, et les adultes le savent. Sortir de la ville, c'est tomber de la table.
- **Question finale** : « Et toi, tu voudrais savoir si ton monde est un jouet ? »

### `video-08-mur-silence/final.mp4`
- **Titre** : Dans cette ville, un mur grandit quand on cesse de se parler… et il cachait maman
- **Description** : Depuis trois ans, un mur traverse leur salon. Un garçon, sa petite sœur et un père muet découvrent ce que chaque brique renferme.
- **Hashtags** : #InThisTown #HistoireTriste #TwistFinal #Famille #Storytime
- **Twist** : Chaque brique contient une phrase jamais dite. La mère n'a jamais disparu : le mur, né du silence entre le père et son fils, la tenait enfermée de l'autre côté, dans leur propre salon, à les attendre.
- **Question finale** : « Quelle phrase n'as-tu jamais osé dire ? »

### `video-09-prenom-argent/final.mp4`
- **Titre** : Dans cette ville, quand on dit ton prénom, tu gagnes un euro… jusqu'à ce que je comprenne qui payait
- **Description** : Il fait chanter son prénom à tout un stade pour devenir riche. Puis il découvre d'où vient l'argent, et ce que cela coûte à la ville.
- **Hashtags** : #InThisTown #Argent #TwistFinal #Suspense #Storytime
- **Twist** : Chaque euro gagné est un euro retiré à celui qui prononce le prénom. Toute la ville s'est ruinée en chantant, hypnotisée ; il devient l'homme le plus riche d'une ville morte, et plus personne ne prononce son prénom.
- **Question finale** : « Combien vendrais-tu le tien ? »

## Vérifications (sur les `final.mp4`)

| Dossier | Durée | Mots | Loudness / crête | Images corrompues | Synchro sous-titres ↔ voix | Caméras |
|---|---|---|---|---|---|---|
| `video-07-ville-interdite` | 55,4 s | 188 | −15,7 LUFS / −0,9 dBFS | 0 (2 signalées : mouvements normaux) | médiane 93 ms · max 248 ms | OK · 43 plans |
| `video-08-mur-silence` | 52,2 s | 177 | −15,9 LUFS / −0,6 dBFS | 0 (1 image corrigée puis re-rendu) | médiane 32 ms · max 197 ms | OK · 39 plans |
| `video-09-prenom-argent` | 47,6 s | 165 | −15,6 LUFS / −0,8 dBFS | 0 | médiane 25 ms · max 215 ms | OK · 42 plans |

Tous : 1080×1920 · 30 i/s · H.264 + AAC 48 kHz stéréo · aucune image noire ni figée hors fondu final · sous-titres un mot à la fois.

Notes d'honnêteté :
- Les horodatages de mots d'ElevenLabs sont moins précis que ceux de la voix locale du lot précédent (jusqu'à ≈ 0,25 s d'écart sur quelques attaques mesurées) ; le décalage reste léger car les sous-titres affichent un mot à la fois.
- L'audio n'a pas été écouté : mixage contrôlé par mesures (loudness, crête) et calage par code.
- « Ville interdite » : l'œil final est dans le ciel au-dessus de la table (pas dans une fenêtre du salon) ; le crochet d'ouverture (ombre de main) se lit surtout comme une grande ombre. « Mur du silence » : quelques plans serrés (pièce étroite). « Prénom = argent » : la foule du stade compte ≈ 2 200 personnages, pas 20 000.
- Les liens de référence n'ont pas été consultés (non accessibles) ; histoires écrites à partir des concepts du brief, avec des twists différents des originaux décrits (invasion extraterrestre, mur qui grandit avec le silence sans cette révélation, dollar par prénom sans cette chute).
- Contenu généré par IA (à déclarer sur les plateformes).

Corrections faites en cours de route : « mur du silence » avait une bascule de rotation d'une image (tête d'Adam à 31,27 s) : cause corrigée, vidéo re-rendue.

## Reproduire
Voir `videos/README.md` : ids `ville-interdite`, `mur-silence`, `prenom-argent` ; voix ElevenLabs (`NODE_USE_ENV_PROXY=1 ELEVENLABS_API_KEY=… npx tsx scripts/histoire.ts voix <id>`, clé jamais affichée) ou voix locale Piper (`"tts": "piper"` dans le récit) ; `RENDER_CONCURRENCY=1`, un seul rendu à la fois.
