# Lot 3 — trois shorts « In This Town » en français (100 % local)

Comptes : TikTok **@tryhowww** · YouTube **histoire-roblox** (« In This Town » = style/hashtag). Rien n'est publié pour ce lot.

| Dossier | Histoire | Durée | Mots | Titre |
|---|---|---|---|---|
| `video-04-prenom-unique/` | Tout le monde s'appelle Alex | 59,0 s | 170 | Dans cette ville, tout le monde s'appelle Alex… sauf moi |
| `video-05-interdit-sortir/` | Personne ne peut sortir | 59,4 s | 184 | Dans cette ville, personne n'a le droit de sortir depuis trois ans… |
| `video-06-hamburger-interdit/` | Les hamburgers interdits | 57,4 s | 177 | Dans cette ville, les hamburgers sont interdits… et je sais enfin pourquoi |

Chaque dossier : `final.mp4` (1080×1920, 30 i/s, H.264 + AAC, sous-titres intégrés), `script.md` (narration, chiffres, accroche, twist,
question finale, titre, description, 5 hashtags), `storyboard.md` (scène par scène, plan par plan, timecodes), `assets/`, `audio/`.
Chaque première phrase commence par « Dans cette ville, … » et chaque dernière phrase est une question.

## Les trois twists (originaux)
- **Prénom unique** : les « Alex » sont des copies ; les vrais dorment dans des cabines de verre sous la mairie. Le narrateur, seul à avoir gardé son prénom, découvre l'original endormi : il est la copie oubliée.
- **Interdit de sortir** : aucun danger extérieur. La ville d'en face, identique, s'est enfermée le même soir, persuadée d'avoir été attaquée par un feu d'artifice mal compris : chaque ville est le « danger » de l'autre.
- **Hamburger interdit** : chaque bouchée efface la personne qu'on aime le plus. L'interdiction vient du narrateur lui-même, qui a oublié sa petite sœur Léa après un burger et n'en garde qu'une assiette de trop.

Note d'honnêteté : les liens de référence (TikTok, YouTube) n'ont pas pu être consultés depuis cet environnement ; les histoires sont écrites à partir
des concepts décrits dans le brief et évitent explicitement les éléments qu'il interdit de reprendre (voleur qui ne se retourne pas, invasion/armée,
maire qui mange un hamburger, restaurant clandestin, confrontation télévisée).

## Vérifications (sur les `final.mp4`)
| | prenom-unique | interdit-sortir | hamburger-interdit |
|---|---|---|---|
| Format | 1080×1920 · 30 i/s · H.264 + AAC 48 kHz | idem | idem |
| Durée (35–60 s) | 59,0 s | 59,4 s | 57,4 s |
| Loudness / crête | −15,8 LUFS / −0,4 dBFS | −13,6 LUFS / −0,7 dBFS | −16,1 LUFS / −0,8 dBFS |
| Images noires / figées | aucune (fondu final) | aucune (fondu final) | aucune (fondu final) |
| Images corrompues (détecteur) | 0 | 0 | 1 : clignotement voulu de l'enseigne néon |
| Synchro sous-titres ↔ voix (`verifier-synchro.py`) | médiane 20 ms · max 108 ms | médiane 11 ms · max 107 ms | médiane 15 ms · max 83 ms |
| Caméras (`verifier-conte.ts`) | OK · 40 plans | OK · 40 plans | OK · 38 plans |

Histoire des corrections : « interdit de sortir » avait deux images isolées défectueuses (noir à 10,2 s, aplat brun à 44,2 s, caméra de départ
dans un volume) ; corrigées puis re-rendues, vérifiées sur les images extraites.

Limites : l'audio n'a pas été écouté (niveaux mesurés) ; voix Piper naturelle mais moins expressive qu'une voix de studio ;
« prénom unique » : le reflet de Noé est une copie translucide ; « interdit de sortir » : les deux garçons sont petits dans les plans larges ;
« hamburger interdit » : le souvenir sépia est le moins lisible. Contenu généré par IA (à déclarer sur les plateformes).

## Reproduire
Voir `videos/README.md` (mêmes commandes, ids `prenom-unique`, `interdit-sortir`, `hamburger-interdit`) : voix locale
(`bash scripts/installer-tts-local.sh`), `RENDER_CONCURRENCY=1` et un seul rendu à la fois.
