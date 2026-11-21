# Apprentissages (mis à jour par le skill `bilan-performances`)

> Règle : chaque constat cite ses chiffres (n vidéos, moyenne) et sa date. Pas de conclusion sur moins de 3 vidéos
> (en dessous : « signal », à confirmer). Les vues sont cumulées depuis la mise en ligne : comparer des vidéos du même jour.

Dernier bilan : 22/11/2026, sur les 12 vidéos du 18 au 21/11 (relevé du 21/11 à 23 h 19 UTC).

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
