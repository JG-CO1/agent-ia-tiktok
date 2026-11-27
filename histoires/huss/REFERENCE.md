# Fiche de référence technique — « In This Town / HUSS HUSS HUSS »

> **Ce que cette fiche est, et n'est pas.** Les deux pages de référence demandées
> (`soracai.com/ai-huss-huss-huss` et `ttanon.com/@synelite1/video/7710239627721887008`) **n'ont pas pu être ouvertes** dans
> l'environnement de production : les deux noms d'hôtes ne sont pas résolus par le réseau de la session (erreur `ENOTFOUND`),
> et aucune vidéo n'est lisible. **Je n'ai donc visionné aucun plan de ces vidéos** et cette fiche ne contient aucune
> mesure prise sur elles. Elle est construite uniquement à partir de ce qui est écrit dans le dépôt et dans la demande,
> et chaque ligne dit d'où elle vient. Les mesures marquées « à vérifier » doivent être confrontées à la vidéo par une
> personne qui peut l'ouvrir (voir « Comment compléter cette fiche » en bas).

## Sources réellement utilisées
| Code | Source | Fiabilité |
|---|---|---|
| **D** | La demande du propriétaire (cette session) : concept, HUSS, caméra, style, sous-titres, voix | Directe |
| **S** | `histoires/idees-chatgpt/2026-11-22-style-capture-roblox.md` — « STYLE VALIDÉ PAR GABRIEL », écrit à partir de la vidéo @larpniverse « While they are out partying » (lien TikTok court dans le fichier) | Notes du propriétaire, vidéo non revue ici |
| **T** | `histoires/idees-chatgpt/2026-11-22-anglais.md` — relevé de tendances (références, concept, conseil de structure) | Relevé ChatGPT, **chiffres non certifiés** |
| **H** | Hypothèse de travail : choix que j'ai fait faute de source, à corriger si la vidéo dit autre chose | Aucune |

Références citées par **T** (chiffres non certifiés, 8–22 nov. 2026) : @larpniverse « Everybody HUSS » ~21,5 M ; @thedrizzleshow
« Everybody is out partying. Except me » ~7,9 M ; @synelite1 « In This Town Everybody HUSS » ~6,9 M ; @inthistownstories ~6,5 M ;
@plot.rush88 ~4,9 M. **S** donne « While they are out partying » à 9,8 M de likes.

## Concept (D, T)
Dans cette ville, tout le monde sort faire la fête, sauf le personnage principal, qui préfère s'entraîner au basket.
Le gimmick est un souffle, **HUSS**, répété en rythme quand il dribble. Le conseil de structure de **T** : règle originale →
conséquences logiques qui s'enchaînent → retournement. Répartition visée dans **T** : 50 % règles impossibles, 30 % horreur/mystère,
20 % émotion ; ici : 100 % humour absurde (D : « pas d'intrigue dramatique ou horrifique »).

## Les 9 rubriques demandées
| # | Rubrique | Ce que les sources permettent d'affirmer | Statut |
|---|---|---|---|
| 1 | **Scènes et ordre** | Ordre reconstitué à partir de **D** : accroche (la règle), présentation du personnage, entraînement au ballon, contraste avec la fête, répétition du HUSS. L'ordre exact de la vidéo de référence est inconnu. | H — à vérifier |
| 2 | **Durée des plans** | **S** : « plans de 2 à 4 s, coupes franches, jamais de plan statique prolongé ». Notre montage : 38 plans en 64,5 s (moyenne 1,7 s ; 1 à 3 s, plus courts sur les HUSS pour suivre le souffle). | S pour la consigne, H pour la mesure de la référence |
| 3 | **Mouvements de caméra** | **S** : survol aérien rapide · suivi à la 3e personne derrière l'avatar · gros plan face au personnage · rotation brusque autour du personnage · travelling rapide vers un objet. **D** ajoute : zooms courts, plans rapprochés sur le ballon. | S, D |
| 4 | **Déplacements des personnages** | **D** : le personnage dribble, marche, court, regarde les autres, interagit ; les habitants vont à la fête. Détail des trajets de la référence : inconnu. | D — trajets H |
| 5 | **Actions visibles** | **D** : dribble, tir, panier, regard vers la fête, réaction à un panier. **T/D** : HUSS en rythme pendant le dribble. | D |
| 6 | **Couleurs et décors** | **S** (couleurs exactes) : nuit `#101C48`, lune blanche ronde, étoiles simples, fenêtres `#FFF3A6`, herbe `#55B94D`, route `#777777`, maisons `#E7D7B9`, basket bleu `#1689E8` / orange `#F49A32`. **D** : maison de fête au loin avec banderoles et décorations, lampadaires basiques, collines géométriques. | S, D — repris tels quels |
| 7 | **Rythme des changements de plans** | **S** : coupes franches, décor toujours en mouvement. Mesure sur la référence : inconnue. | H — à vérifier |
| 8 | **Placement des textes** | **S** : un seul mot à l'écran, très gros, blanc, contour noir épais (5–8 px en 1080p), police type Arial Black/Anton, centré **au milieu de l'écran**, sans fond ni bandeau, synchronisé à la voix. **D** : « HUSS! » pour le souffle. | S, D — repris tels quels |
| 9 | **Voix, respiration, action** | **D** : voix masculine, calme, légèrement monotone, débit régulier ; les HUSS audibles et rythmés, **synchronisés avec le mouvement du ballon** ; sons du basket (rebond, pas, ambiance de fête au loin) ; musique discrète seulement si utile. | D |

## Ce que le montage final fait en conséquence
- **HUSS ↔ ballon** : chaque HUSS dribblé est calé sur un rebond (écart mesuré : 0 ms sur 14, voir `scripts/verifier-ville.ts`) ; le ballon frappe le sol 0,1 s après le début du souffle, comme une expiration au moment de pousser la balle.
- **Sous-titres** : un mot à la fois, `motsAffiches()` dans `video/histoire/blocs/decoupage.ts`, instants issus de l'alignement caractère par caractère d'ElevenLabs (`sous-titres.json` / `.srt`).
- **Style** : aplats, ombrage cuit par face, aucune lumière réelle, aucun flou, aucun grain ; les lumières sont des halos plats.

## Originalité (règles du dépôt, `docs/HISTOIRES.md`)
Le concept (tout le monde fait la fête sauf moi, je m'entraîne, souffle HUSS) est repris ; **le texte, les gags, l'ordre des scènes
et les personnages sont originaux** (facteur au courrier, voisin qui crie, boulanger, policier, maire au chapeau pointu, basse qui dicte le
rebond, panier sur « panier »). Aucun avatar, logo, interface ou visage d'une marque de jeu : les personnages sont des blocs inventés.

## Comment compléter cette fiche
Quelqu'un qui peut ouvrir les deux vidéos remplit, pour chaque plan : durée, mouvement de caméra, action, texte affiché. Il suffit
ensuite d'adapter `video/histoire/blocs/ville/episodes/huss-001/plans.ts` (un plan = une caméra qui démarre sur un mot) ;
rien d'autre n'est à changer. Alternative : autoriser les deux domaines dans le réseau de l'environnement et me redemander l'analyse.
