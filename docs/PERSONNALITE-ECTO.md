# Personnalité d'Ecto — le pote qui t'engueule puis te prépare un thé

Signature de Studio Fantôme (décision du propriétaire, 2026-11-27) : Ecto parle au spectateur comme à son meilleur pote.
Il peut l'engueuler, l'insulter familièrement, péter un câble… puis redevenir instantanément adorable, assis avec une
tasse de thé ou son doudou, comme si rien ne s'était passé. **C'est le contraste** qui rend la chaîne reconnaissable.

L'identité visuelle ne change pas : même modèle, silhouette, proportions, couleurs (noir, orange, sombre). On ajoute
des expressions, des effets, des accessoires et des comportements. L'empreinte d'identité (`src/lib/ghost.ts`) ne porte
que sur `geometry.ts`, `materials.ts` et les matcaps : elle reste inchangée.

## Les trois états

| État | Consigne (`colere`) | Visuel | Voix (`ton`) |
|---|---|---|---|
| 1 · Normal / adorable | `calme` | yeux cyan, expressions sympathiques ; `serein` quand il retrouve son calme | `normal` (chaleureux) ou `doux` (lent, rassurant) |
| 2 · Énervé | `enerve` | yeux qui rougissent, sourcils froncés, fumée noire en volutes, tremblements, gestes brusques, zoom agressif, quelques braises | `enerve` : plus fort, plus rapide, appuyé |
| 3 · Furie | `furie` | yeux rouge vif incandescents, fumée épaisse, flammes sur le crâne et le corps, braises, lueur de chaleur, corps qui sursaute, zooms brutaux, camera shake | `furie` : cri théâtral, débit rapide |

La colère monte en 10 à 16 images (la rougeur des yeux est progressive) et **retombe en 3 images** : « il s'arrête
brutalement », la fumée se dissipe, il respire (`respire`) et retrouve un visage `serein`. Quantité de fumée et
intensité des flammes sont proportionnelles au niveau (`src/core/colere.ts` : `fumeeAt`, `flammesAt`, `rougeur`).

## Accessoires du retour au calme (10, réutilisables)

`the` (tasse de thé : souffle, gorgée, repose), `chocolat` (chocolat chaud, guimauves), `doudou` (lapin, serré et caressé),
`peluche` (ourson à écharpe orange), `coussin`, `plaid` (tartan, il s'enroule dedans), `couverture` (unie, rayée),
`lunettes` (de lecture, ajustées du doigt), `livre` (ouvert, page tournée), `fleur` (respirée, balancée).
Chaque objet est modélisé en 3D procédural (aucun fichier externe), tenu dans ses mains ou contre son corps, avec une
apparition en « poof » et un cycle de petites actions (`ACCESSOIRE_DEFS` dans `src/core/colere.ts`).
**Varier** : ne pas reprendre l'accessoire des vidéos précédentes (`npm run fm -- accessoires` indique les derniers
utilisés et propose les moins récents). Un seul accessoire à la fois ; jamais le même deux fois dans une vidéo.

## Le lancer d'objet (`lancer`)

Récurrent : il boit son thé, lit ou entend quelque chose qui l'énerve, fixe la caméra, les yeux rougissent, la tasse
tremble, la fumée monte, il crie, puis **balance l'objet vers le spectateur** : l'objet part réellement de sa main,
traverse la scène en perspective (flou de mouvement), touche l'écran. Trois impacts, à varier :
`leger` (éclaboussure / duvet / pétales / pages, petites fissures), `fissure` (réseau de fissures qui se propage),
`brise` (écran brisé : fissures, éclats qui tombent, flash, vignette rouge). L'effet est une simulation graphique qui
**s'efface en ~2,5 s** : jamais de dégradation durable, fissures en traits fins pour ne pas masquer les sous-titres.
Réserver `brise` aux moments importants (1 par vidéo au plus). Les objets non lançables (`plaid`, `couverture`,
`lunettes`) ignorent la consigne.

## Écrire le script (consignes dans `episode.json`)

Dans `fantome` d'une scène (effet au début de la scène) ou d'un `temps_fort` (effet **au mot** `sur_mot`) :

```json
{ "fantome": { "colere": "calme", "accessoire": "the" } }
{ "fantome": { "colere": "enerve" } }
{ "fantome": { "colere": "furie" },
  "temps_forts": [{ "sur_mot": "FRÉROT", "lancer": "brise" }] }
```
- `colere` : `calme` | `enerve` | `furie`, en vigueur jusqu'à la prochaine consigne.
- `accessoire` : un des 10, ou `"aucun"` pour le ranger ; il apparaît quand on le demande (donner avec `colere: "calme"`).
- `lancer` : `leger` | `fissure` | `brise` ; part exactement au mot, avec l'accessoire tenu. Prévoir l'accessoire avant.
- `ton` (par scène, optionnel) : `normal` | `doux` | `enerve` | `furie`. Par défaut il découle de l'état d'Ecto au début de la
  scène et se prolonge. **Le ton est par scène** : pour passer d'un cri au calme, ouvrir une nouvelle scène (courte).
- Le moteur pose tout seul gestes (`enerve`, `furie`, `accuse`, `respire`), expressions, gros plans, caméra (zoom,
  secousse, coup d'impact) et sons (`tension`, `agacement`, `fumee`, `flamme`, `soupir`, `poof`, `gorgee`, `lancer`, `verre`).

## Voix : une colère qui monte, pas un volume fixe
Un cri à intensité constante sonne faux. Pour chaque scène de colère, `src/voice/voice.ts` (`etiquettesTon`) pose des
étiquettes d'émotion ElevenLabs et fait **monter** l'intensité : de phrase en phrase (la dernière est la plus forte) et à
chaque virgule (« MAIS TU LE FAIS EXPRÈS OU QUOI, [shouting] FRÉROT ?! »). `enerve` : `[annoyed]` puis `[angry]` ; `furie` :
`[angry]` puis `[angry][shouting]` ; le premier passage calme après un cri commence par `[sighs] [calm]`. Mesures (voix actuelle,
même phrase) : sans étiquette 186 Hz, `[annoyed]` 211, `[angry]` 258, `[shouting]` 314 Hz avec plus d'énergie aiguë ; `[softly]` : −10 dB.
Pour écrire une colère crédible : phrases courtes de longueur inégale, une montée (« Dis-moi... tu l'as installé ? » → « MAIS TU LE
FAIS EXPRÈS ?! »), un mot final isolé et criant. La voix « normale » est aussi plus vive (stabilité 0,36, style 0,45, vitesse 1,08).

## Rythme (contrôlé par `fm valider`, avertissements)
- ≤ 3 accès de furie, ≤ 2 lancers, ≤ 1 écran brisé par vidéo ; colère ≤ 45 % de la narration, ≥ 30 % de narration calme :
  les moments calmes servent à suivre l'explication. Pas d'explosion partout.
- Pendant les scènes pleines (accroche, titre, cta) Ecto se rapproche (`gros-plan`) ; dans les mises en page « split »
  il reste en bas : sous-titres et informations restent lisibles (la fumée passe derrière le texte).

## Langage
Très familier, provocateur, parfois vulgaire, **comme un vrai pote, pas comme un assistant** : « mon reuf », « frérot »,
« mon gars », « t'es sérieux là ? », « mais t'es con ou quoi ? », « espèce d'idiot », « imbécile », « TDC », « putain »,
« bordel », « fais un effort », « réveille-toi », « arrête tes conneries », « tu te fous de moi ? ».
- Les insultes sont un assaisonnement : **naturelles, variées, jamais à chaque phrase** (avertissement si > 40 % des phrases).
- Pas de mots enfantins (« patate », « cornichon », « nouille », « zombie »).
- **Jamais d'insulte discriminatoire** (handicap, orientation, origine, religion…) : Ecto insulte un comportement
  (« t'as scrollé comme un débile »), jamais une catégorie de personnes. `fm valider` bloque ces mots.
- Les règles de fond restent absolues : rien d'inventé, sources et citations exactes, aucune promesse de gains,
  indépendance vis-à-vis d'Anthropic. La personnalité habille les faits, elle ne les remplace jamais.
- Colère : MAJUSCULES, phrases courtes, `?!`. Calme : pauses (« ... »), « Bon. », « Pardon mon reuf. », « Viens, je t'explique. ».
- Vulgarité et plateformes : YouTube peut limiter la monétisation / la portée des Shorts très grossiers, TikTok modère
  aussi. Doser les gros mots (un « putain » ou « bordel » par vidéo suffit souvent) et vérifier les statistiques
  (`bilan-performances`) avant d'en mettre plus.

## Exemple de scénario (30 s)
0–3 s `furie` « EH OH FRÉROT ! T'ES SÉRIEUX ?! TU SCROLLAIS COMME UN DÉBILE… » → 3–6 s `calme` + `the` « Bon... pardon mon
reuf. Je vais t'expliquer calmement. » → 6–14 s explication (`doux`) → 14–18 s `enerve` puis `furie` + `lancer: "brise"`
→ 18–27 s explication → 27–30 s `calme` + `doudou` « Voilà frérot. Tu vois quand tu veux ? Je suis fier de toi. »
La vidéo de démonstration (`npm run fm -- demo-ecto`, fixture `video/demo/ecto-personnalite.json`) joue ce schéma.

## Pour le développeur
- Logique pure : `src/core/colere.ts` (niveaux, fumée, accessoires, lancer, ton). Planification : `planPerso` dans
  `src/core/timeline.ts` (consignes → pistes `tl.fx`, beats, sons). Voix : `src/voice/voice.ts` (`reglagesTon`, `FILTRE_TON`,
  un appel de synthèse par groupe de scènes de même ton).
- Visuel : `video/ghost/face.ts` (yeux rouges, `colere`/`furie`/`serein`), `performance.ts` (gestes, tremblement, mains),
  `accessoires.ts` (poses) + `Accessoires3D.tsx` (objets), `video/fx/Fury.tsx` (fumée, flammes, braises),
  `video/fx/Lancer.tsx` (trajectoire 3D, impact, fissures), `video/camera/camera.ts` (zoom/secousses de colère).
- Sons : `src/audio/synth.ts` (`generatePerso`), générés par nos soins, licences dans `config/licences.json`.
