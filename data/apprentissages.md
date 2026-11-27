# Apprentissages (mis à jour par le skill `bilan-performances`)

> Règle : chaque constat cite ses chiffres (n vidéos, moyenne) et sa date. Pas de conclusion sur moins de 3 vidéos
> (en dessous : « signal », à confirmer). Les vues sont cumulées depuis la mise en ligne : comparer des vidéos du même jour.

Dernier bilan : 22/11/2026, sur les 12 vidéos du 18 au 21/11 (relevé du 21/11 à 23 h 19 UTC).

Bilan du 23/11/2026 : relevé impossible (jeton YouTube absent, 17 vidéos en n/d) ; constats ci-dessous inchangés.

## Ce qui marche
- **TikTok porte la portée** : 3 040 vues TikTok (11 vidéos mesurées) contre 1 257 sur YouTube (12), soit 2,4 fois
  plus pour les mêmes vidéos. (22/11)
- **L'actu datée finit en tête de sa journée** : la vidéo « actu » fait le plus de vues TikTok du jour 4 jours sur 4
  (239, 584, 671, et 20 après quelques heures) et le plus de vues YouTube 3 jours sur 4. Vues TikTok moyennes des
  vidéos d'au moins 1,5 jour : actu 498 (n = 3), business 342 (n = 3), découverte 238 (n = 2). (22/11)
- **Accroche « nom Claude + changement concret »** : « Claude Fable 5.2 coûte moins cher que Fable 5.1. » (584 vues
  TikTok), « Les agents Claude peuvent maintenant tourner sur ta propre infrastructure. » (671), « Quatre modèles
  Claude portent désormais un filigrane… » (1ʳᵉ du 18/11). (22/11, n = 3, signal lié au format actu)
- **Les astuces pratiques font le plus de likes** : taux de likes TikTok découverte 4,1 % (n = 2 ; « mcp add-json »
  5,5 %), business 2,6 % (n = 3), actu 1,5 % (n = 3). L'actu apporte la portée, l'astuce l'engagement. (22/11, signal)
- **Le business retient le mieux sur YouTube** : 64 % et 71 % de la vidéo vus (n = 2), contre 53 % en découverte
  (n = 2) et 50 % en actu (n = 2). (22/11, signal)

## Ce qui ne marche pas
- **Zéro commentaire** sur les 12 vidéos, YouTube comme TikTok : la question écrite dans la description ne suffit pas. (22/11)
- **Accroches « Un … » (définition)** : les 2 plus faibles du 18/11 sur TikTok (220 et 227 vues, contre 239 pour l'actu).
  (22/11, n = 2, signal ; déjà bannies par le skill `ecrire-episode`)
- **Trop de chiffres dans une actu** : « Fable 5.2 » (une dizaine de chiffres en 35 s) a le plus faible % vu (45 %) et
  seulement 36 % du public encore là à mi-vidéo, malgré les meilleures vues de sa journée. (22/11, n = 1, signal)
- **Peu d'abonnés** : 3 gagnés sur YouTube (Fable 5.2 : 2, Linked billing : 1) sur les 6 vidéos mesurées par Analytics. (22/11)

## À appliquer dès maintenant (choix des sujets et écriture)
1. Chaque jour, au moins un sujet d'actualité datée de moins de 7 jours, avec un nom Claude (modèle, fonction,
   Claude Code). En découverte et en business aussi, prendre l'angle « nouveau » quand il est vrai (sortie ou mise à
   jour récente et datée).
2. Accroche du sujet (juste après l'ouverture « Hop hop hop ») : le nom Claude et le changement concret dans les
   6 premiers mots.
3. Un seul chiffre fort par scène, et pas plus de 3 chiffres dans toute la vidéo.
4. Appel à l'action : poser une question courte **à l'oral** dans la dernière scène (« Dis-moi en commentaire : … ? »),
   en plus de la question de la description.
5. Rester entre 30 et 40 s : toutes les vidéos mesurées font de 31 à 43 s, pas encore de comparaison possible.

## Hypothèses à tester
- 2 actus par jour (matin et soir) au lieu d'une : proposé au propriétaire le 22/11 (n encore trop petit pour changer
  `config/chaine.json` sans son accord).
- Durée 30–35 s contre 40–45 s.
- Créneau horaire : impossible à isoler pour l'instant (chaque créneau a son format ; sur TikTok, l'heure dépend de
  l'envoi manuel des brouillons).

## Expériences en cours
- **Ouverture « Hop hop hop, arrête de scroller ! … »** (choix du propriétaire, vidéos à partir du 22/11) contre les
  12 vidéos précédentes : rétention à 3 s et % vu (YouTube), vues TikTok à 48 h. Bilan après 6 à 9 vidéos.
- **Question à l'oral en fin de vidéo** (à partir du 23/11) : nombre de commentaires, contre 0 sur les 12 premières.

## Données manquantes
- lot-map (20/11) : pas encore publiée sur TikTok (brouillon en attente dans l'app).
- % vu, rétention et abonnés : YouTube Analytics a 24 à 72 h de retard (mesurés pour les 6 vidéos des 18 et 19/11).
- La rétention TikTok n'est pas disponible par l'API publique.

---

# Studio Histoires (YouTube « try-thecrack » ; TikTok @tryhowww arrêté par le propriétaire le 25/11/2026)

> Relevé du 23/11/2026 (YouTube Studio > Shorts et TikTok Studio > Publications). Vues cumulées ; on compare à ancienneté égale.
> Conclusion seulement si n ≥ 3. Rétention / abonnés YouTube : la page Insights ne charge pas (« Petit problème… »), donc non mesurée.

## YouTube — moyennes par style (vues)
| Style | Mis en ligne | Âge | Vues par vidéo | Moyenne | n |
|---|---|---|---|---|---|
| (a) « Dans cette ville… » à compteur de vie (moteur du dépôt) | 20/11 | 3 j | 1 176 (parents), 934 (téléphone), 1 306 (années à la banque) | **1 139** | 3 |
| (b) Histoires en blocs 3D Higgsfield (voix Étienne) | 21–22/11 | 1–2 j | 1 058 (métro), 66 (marché), 5 (phare), 3 (neige), 2 (horloge) | 227 (médiane 5 ; 19 sans le métro) | 5 |
| (c) Cadre « Pourquoi Simone / le voisin… » | 20/11 | 3 j | 23, 2, 1, 1 | 7 | 4 |
| (c) Duel « Cinq bougies… » | 20/11 | 3 j | 11, 1, 0 | 4 | 3 |
Pas encore comparables (moins de 24 h) : « plus tard » (13 vues, 1re vidéo du style a depuis le 23/11), « La fenêtre de minuit » en blocs (0).
Commentaires : 0 sur toutes les vidéos YouTube.

## TikTok (vidéos publiques seulement)
- Blocs Higgsfield, 21–22/11 : brouillard 16, neige 11, phare 10, horloge 9, marché 9, métro 3 → moyenne 9,7 (n = 6) ; « #inthistown » (blocs, 23/11) : 3 ; 2 likes en tout, 0 commentaire.
- Les vidéos du 20/11 (style a, cadre, duel) sont restées en « Moi uniquement » avec 0 à 4 vues : aucune comparaison de style possible sur TikTok pour l'instant. Les premières « Dans cette ville… » publiques arrivent à partir du 23/11.
- TikTok reste ~100 fois en dessous de YouTube pour les mêmes sujets (compte récent).

## Constats (23/11)
- **Le style (a) « Dans cette ville… » à compteur de vie est nettement le meilleur sur YouTube** : 1 139 vues en moyenne (n = 3) contre 7 et 4 pour cadre et duel (n = 4 et 3) à même âge. Écart d'un facteur ~200.
- **Les histoires en blocs sont très irrégulières** (n = 5) : un seul succès (métro, 1 058) ; les 4 autres font 2 à 66 vues. Pas de conclusion tant que le métro n'est pas expliqué (un seul cas).
- Les formats cadre et duel ne décollent pas : on arrête d'en produire.
- Les 3 gagnants (a) parlent tous d'un **compteur de temps de vie qui diminue** (parents, téléphone, banque) avec une question finale très personnelle.

## Décision de production (23/11)
- YouTube : 2 vidéos « Dans cette ville… » à compteur de vie par jour + 1 histoire en blocs si les crédits Higgsfield le permettent (Ultra le 01/12/2026 ; avant, ~29 crédits seulement : pas de blocs Higgsfield).
- TikTok : uniquement des histoires. Arrêt de cadre/duel.
- À mesurer à n ≥ 3 : style (a) version « autre thème que compteur de vie » (histoire-009 à 011) contre version compteur de vie (001 à 008).

## Programmation au 23/11/2026 (11 h 50)
- YouTube (limite de 3 envois/jour atteinte) : 24/11 = 4 vidéos déjà en place ; 25/11 = histoire-012 « merci » (10 h), histoire-013 « vieillir » (15 h), stick-002 ; 26/11 = histoire-014 « reflet » (10 h).
- TikTok (étiquette IA activée) : 25/11 = histoire-012 (10 h), histoire-013 (15 h) ; 26/11 = histoire-014 (10 h), histoire-015 « marches » (15 h) ; les récits stick restent à 20 h.
- Reste à envoyer sur YouTube au prochain passage (25/11) : histoire-015 (déjà rendue), puis histoire-009 et 010 (rendues) ou de nouveaux récits ; idée « Les trois coups » dans histoires/idees-chatgpt/2026-11-23.md.
- Pas d'histoire en blocs Higgsfield produite (crédits ~29 avant le 01/12).

---

## Relevé du 27/11/2026 (YouTube Studio > Shorts, 29 vidéos publiques ; TikTok non relevé : projet arrêté)
> Vues cumulées. Les vues se stabilisent en 2–3 jours (ex. « parents » 1 176 le 23/11 → 1 184 le 27/11), donc on compare
> à partir de 24 h. Les mentions J'aime ne sont pas affichées dans la liste (non relevées) ; Insights non consulté.

| Style | Vidéos (vues) | Moyenne | Médiane | n |
|---|---|---|---|---|
| (a1) « Dans cette ville… » compteur de vie (002 à 007) | parents 1 184, téléphone 936, banque 1 306, plus tard 1 051, amis 608, je t'aime 1 309 | **1 066** | 1 118 | 6 |
| (a1 bis) variantes « gain de jours / vieillir » (012, 013) | merci 87, vieillir 965 | 526 | – | 2 (signal) |
| (a2) « Dans cette ville… » autre thème (008, 011, 014) | ombre 336, interdit après 18 h 999, reflet 245 | **527** | 336 | 3 |
| (b) blocs 3D Higgsfield (voix Étienne) | métro 1 218, marché 70, neige 10, phare 9, horloge 3, étage 2, fenêtre de minuit 0 | 187 | 9 | 7 |
| (c) bonhomme (stick-001 à 003) | valises 1, fenêtre 59, ville qui parlait 74 | 45 | 59 | 3 (âges 1 à 3 j) |
| (c) cadre « Pourquoi Simone / le voisin… » | 23, 2, 1, 1 | 7 | 1,5 | 4 |
| (c) duel « Cinq bougies… » | 11, 0, 0 | 4 | 0 | 3 |
Commentaires : 2 au total sur 29 vidéos (« vieillir » 1, « je t'aime » 1). Hors liste : 1 vidéo sans titre (« dans cette ville... », 6 vues, probable test).

## Constats (27/11)
- **Le compteur de vie reste le meilleur moteur** : 1 066 vues en moyenne (n = 6) contre 527 pour les autres thèmes (n = 3), soit ~2 fois plus. Mais « interdit après 18 h » (autre thème) fait 999 : le thème n'est pas tout, l'accroche « interdit / règle étrange » semble aussi porter (signal, n = 1).
- **Variante « gain » (merci, 87)** : flop isolé (n = 1) ; « vieillir » (965) fonctionne. À ne pas généraliser.
- **Blocs 3D** : toujours un seul succès sur 7 (métro 1 218, médiane 9). Pas de conclusion.
- **Bonhomme** : 1, 59, 74 (n = 3, âges différents) : très en dessous du style (a), à surveiller seulement.
- cadre et duel : arrêtés (déjà décidé le 23/11).
- Rien programmé au-delà du 26/11 au moment du relevé : le créneau du 27/11 (10 h) est resté vide.

## Décision de production (27/11)
- YouTube uniquement. Priorité aux récits « Dans cette ville… » avec **règle étrange dès la 1re phrase** et, si possible, compteur de vie ; ≥ 61 s (histoire-010 fait 55,7 s : non publiable en l'état), sujets différents (éviter « valises », déjà publié).
