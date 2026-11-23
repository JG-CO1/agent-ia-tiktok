DOCUMENT 2 — LES VALISES INVISIBLES

PRÊT POUR CLAUDE CODE 10 scènes · 30 plans

Rédaction
PRODUCTION SCRIPT — LES VALISES INVISIBLES
Roblox Gameplay Storytelling — Remotion + Three.js + ElevenLabs
0. INSTRUCTIONS GÉNÉRALES

Construire une vidéo narrative verticale avec Remotion et Three.js.

Tous les objets et personnages doivent être modélisés en géométrie 3D simple. Aucun générateur d'images IA n'est disponible.

Le rendu doit imiter une capture de gameplay Roblox.

Interdictions absolues

Photorealism.

Global illumination.

Volumetric lighting.

Depth of field.

Ray tracing.

Cinematic lighting.

Realistic human anatomy.

Realistic skin shaders.

Film grain.

Unreal Engine cinematic rendering.

Complex textures.

Cinematic camera effects.

Utiliser :

BoxGeometry.

CylinderGeometry.

PlaneGeometry.

SphereGeometry à faible nombre de segments.

MeshBasicMaterial.

MeshLambertMaterial.

Couleurs plates et saturées.

Ombres simples.

Animations de personnages cubiques.

Paramètres vidéo

Résolution : 1080 × 1920.

Format : 9:16.

Fréquence : 30 FPS.

Durée cible : 66 à 70 secondes.

Narration : 175 à 190 mots.

Voix : ElevenLabs français, masculine, naturelle.

Sous-titres : un mot à la fois.

Police : Arial Black ou Anton.

Texte : #FFFFFF.

Contour : #000000, 7 px.

Position : centre horizontal, environ 53 % de la hauteur.

Les plans doivent durer environ 2,2 secondes chacun. Chaque scène contient trois plans.

Les timings devront être recalés sur la vraie piste ElevenLabs.

1. NARRATION FINALE
Texte intégral à envoyer à ElevenLabs

« Dans notre quartier, il existait une règle étrange. Chaque promesse oubliée faisait apparaître une valise devant la maison de celui qui l'avait faite. Personne ne savait comment elles arrivaient. Au début, je n'y prêtais pas attention. Une valise rouge est apparue devant ma porte. Puis une bleue. Puis une dizaine d'autres. J'ai compris qu'elles étaient toutes liées à des choses que j'avais promises sans jamais les faire. Appeler un ami. Rendre visite à quelqu'un. Tenir une promesse faite des années auparavant. Mais un matin, une dernière valise est apparue. Elle était vieille, marron, et différente des autres. Je l'ai ouverte. À l'intérieur, il y avait une photo de ma grand-mère et une lettre. Elle me rappelait une promesse que je lui avais faite avant sa mort : revenir la voir une dernière fois. Je n'avais jamais pu lui dire au revoir. Au dos de la lettre, quelques mots étaient écrits : "Je sais que tu n'as pas oublié. Je t'attends toujours dans tes souvenirs." Cette nuit-là, j'ai compris que certaines promesses ne disparaissent jamais vraiment. Et toi, quelle promesse aimerais-tu encore pouvoir tenir ? »

Direction vocale

Débit : 155 à 165 mots/minute.

Durée visée : 66 à 70 secondes.

Voix masculine adulte.

Ton mystérieux au début.

Ton légèrement inquiet pendant l'apparition des valises.

Ton émotionnel mais retenu pendant la découverte de la lettre.

Dernière question adressée directement au spectateur.

Pas de surjeu.

Pas de voix de bande-annonce.

La voix doit rester naturelle.

Générer la piste audio avant de figer les timings. Ne jamais couper le texte pour respecter artificiellement une durée.

2. BIBLE VISUELLE
2.1 Personnage principal

ID : PLAYER_01

Apparence constante :

Tête cubique : #E6B98F.

Cheveux bruns foncés : #30251F.

Hoodie noir : #202631.

Pantalon bleu foncé : #34445A.

Chaussures blanches : #E5E5E5.

Yeux noirs rectangulaires.

Bouche simple.

Expressions :

Neutre.

Intrigué.

Surpris.

Inquiet.

Triste.

Ému.

Poses disponibles :

Debout.

Marche.

Course.

Accroupi.

À genoux.

Bras levés.

Objet tenu dans la main droite.

2.2 Grand-mère

ID : GRANDMOTHER_PHOTO_01

Elle apparaît uniquement sur une photographie.

Cheveux gris : #A7A7A7.

Tête cubique : #D9AE8B.

Cardigan violet : #79628D.

Haut beige : #C9B99E.

Visage souriant.

Proportions classiques Roblox.

IMPORTANT : ne jamais faire apparaître la grand-mère physiquement dans la scène. Elle est décédée. Sa présence doit uniquement être suggérée par la photo et la lettre.

2.3 Les valises

Chaque valise doit être construite en géométrie simple.

Forme :

Corps rectangulaire.

Poignée supérieure.

Deux petites roues.

Petite bande de couleur.

Pas de texture cuir réaliste.

Créer les identifiants suivants :

ID Couleur Signification visuelle
SUITCASE_RED #B94D4D Première promesse
SUITCASE_BLUE #4779B8 Deuxième promesse
SUITCASE_YELLOW #D7B64A Troisième promesse
SUITCASE_GREEN #568A60 Promesse oubliée
SUITCASE_PURPLE #82669D Autres promesses
SUITCASE_OLD #71513C Dernière valise

La dernière valise doit être différente :

Marron foncé.

Plus petite.

Légèrement usée visuellement, mais toujours en géométrie low-poly.

Aucun détail réaliste.

Poignée plus ancienne.

Une petite étiquette beige #D9C6A3.

2.4 Coordonnées

Convention obligatoire :

X négatif = gauche.

X positif = droite.

Z négatif = arrière-plan.

Z positif = avant-plan.

Y = hauteur.

La maison, la rue et le jardin doivent conserver exactement les mêmes coordonnées pendant toute la vidéo.

3. DÉCOUPAGE EN 10 SCÈNES — 30 PLANS

Durée de base : 6,6 secondes par scène.

Trois plans par scène, environ 2,2 secondes chacun.

SCÈNE 01 — LA RÈGLE

Durée : 6,6 secondes

Narration exacte :
« Dans notre quartier, il existait une règle étrange. »

Décor

Quartier résidentiel Roblox en journée.

Maison principale : centre arrière-plan.

Façade blanche #E5E0D4.

Toit rouge #9B4141.

Porte marron #76523B.

Fenêtres bleues #77A7C9.

Route grise #62666C : avant-plan.

Trottoir #AAAAAA.

Pelouse #55A84B.

Arbres cubiques : gauche et droite.

Boîte aux lettres : devant la maison, à droite.

Personnage

PLAYER_01 :

Position X=0, Z=4.

Debout.

Bras le long du corps.

Visage neutre.

Regard vers la maison.

Ambiance

Heure : 10 h 00.

Ciel : #73C9F5.

Fenêtres : éteintes.

Soleil : cercle jaune #FFE08A.

Éclairage de jeu standard.

Plans

PLAN 1 — 0 à 2,2 s

Type : vue aérienne.

Départ : hauteur Y=24, au-dessus de la route.

Arrivée : Y=12, au-dessus de la maison.

Mouvement : descente rapide.

Écran : quartier entier.

Mot : « QUARTIER »

PLAN 2 — 2,2 à 4,4 s

Type : aerial flyover.

Départ : vue générale de la maison.

Arrivée : façade.

Mouvement : avancée rapide.

Mot : « RÈGLE »

PLAN 3 — 4,4 à 6,6 s

Type : troisième personne arrière.

Départ : derrière PLAYER_01.

Arrivée : caméra légèrement décalée à droite.

Écran : personnage face à sa maison.

Mot : « ÉTRANGE »

SCÈNE 02 — PREMIÈRE APPARITION

Durée : 6,6 secondes

Narration exacte :
« Chaque promesse oubliée faisait apparaître une valise devant la maison de celui qui l'avait faite. »

Décor

Même façade, même position.

Maison blanche au centre.

Porte marron au centre.

Pelouse devant.

Trottoir en avant-plan.

Boîte aux lettres à droite.

Route grise au premier plan.

Personnage

PLAYER_01 :

Position X=-2, Z=3.

Debout.

Tête orientée vers la porte.

Visage intrigué.

Accessoire

SUITCASE_RED :

Position X=0, Y=0, Z=1.

Corps rouge #B94D4D.

Poignée rouge sombre #793333.

Roues noires #242424.

Orientation face à la caméra.

Ambiance

Heure : 10 h 10.

Ciel : #73C9F5.

Toutes les fenêtres éteintes.

Plans

PLAN 1 — 0 à 2,2 s

Type : gros plan sur porte.

Départ : porte vide.

Arrivée : valise rouge visible devant la porte.

Animation : apparition instantanée avec petit déplacement vertical.

Mot : « PROMESSE »

PLAN 2 — 2,2 à 4,4 s

Type : caméra basse.

Départ : valise de trois-quarts.

Arrivée : valise centrée.

Mouvement : déplacement latéral.

Mot : « OUBLIÉE »

PLAN 3 — 4,4 à 6,6 s

Type : caméra face personnage.

Départ : plan moyen.

Arrivée : visage de PLAYER_01.

Mouvement : petit rapprochement.

Écran : personnage surpris, valise visible en bas de l'image.

Mot : « VALISE »

SCÈNE 03 — PERSONNE NE COMPREND

Durée : 6,6 secondes

Narration exacte :
« Personne ne savait comment elles arrivaient. Au début, je n'y prêtais pas attention. »

Décor

Même quartier.

Maison principale au centre.

Deux maisons voisines visibles.

Route grise.

Trottoir.

Pelouse.

Deux arbres cubiques.

Plusieurs petites valises devant les maisons voisines.

Personnages

PLAYER_01 :

Debout.

Position X=0, Z=4.

Bras croisés.

Visage sceptique.

Deux avatars secondaires :

Avatar A : haut vert #438B62, pantalon noir #252525.

Avatar B : haut bleu #437CB2, pantalon gris #666666.

Ils regardent leurs valises respectives.

Ambiance

Heure : 11 h 00.

Ciel : #73C9F5.

Fenêtres : éteintes.

Lumière : journée.

Plans

PLAN 1 — 0 à 2,2 s

Type : vue aérienne basse.

Départ : maison principale.

Arrivée : maisons voisines.

Mouvement : panoramique horizontal.

Écran : plusieurs valises devant différentes maisons.

Mot : « PERSONNE »

PLAN 2 — 2,2 à 4,4 s

Type : caméra troisième personne.

Départ : derrière PLAYER_01.

Arrivée : profil du personnage.

Mouvement : rotation de 70 degrés.

Écran : personnage qui hausse les épaules.

Mot : « COMPREND »

PLAN 3 — 4,4 à 6,6 s

Type : caméra face personnage.

Départ : plan moyen.

Arrivée : plan taille.

Mouvement : petit recul.

Écran : PLAYER_01 regarde ailleurs.

Mot : « IGNORAIS »

SCÈNE 04 — LES VALISES S'ACCUMULENT

Durée : 6,6 secondes

Narration exacte :
« Une valise rouge est apparue devant ma porte. Puis une bleue. Puis une dizaine d'autres. »

Décor

Façade principale.

Maison blanche.

Porte marron.

Jardin vert.

Trottoir gris.

Boîte aux lettres à droite.

Route visible au premier plan.

Personnage

PLAYER_01 :

Position X=-2, Z=4.

Debout.

Bras légèrement écartés.

Visage surpris.

Accessoires

SUITCASE_RED : X=0, Z=1.

SUITCASE_BLUE : X=1, Z=1.

SUITCASE_YELLOW : X=-1, Z=1.

SUITCASE_GREEN : X=2, Z=2.

SUITCASE_PURPLE : X=-2, Z=2.

Créer une dizaine de valises avec des variations de couleur.

Ambiance

Heure : 16 h 00.

Ciel : #8BC8EB.

Fenêtres : éteintes.

Ombres simples sous les valises.

Plans

PLAN 1 — 0 à 2,2 s

Type : caméra basse face porte.

Départ : valise rouge seule.

Arrivée : apparition de la valise bleue.

Animation : apparition en deux étapes.

Mot : « ROUGE »

PLAN 2 — 2,2 à 4,4 s

Type : caméra troisième personne.

Départ : derrière PLAYER_01.

Arrivée : vue de toutes les valises.

Mouvement : recul rapide.

Mot : « BLEUE »

PLAN 3 — 4,4 à 6,6 s

Type : vue aérienne.

Départ : hauteur Y=5.

Arrivée : Y=10.

Mouvement : montée rapide.

Écran : dizaine de valises devant la maison.

Mot : « DIZAINE »

SCÈNE 05 — LES PROMESSES OUBLIÉES

Durée : 6,6 secondes

Narration exacte :
« J'ai compris qu'elles étaient toutes liées à des choses que j'avais promises sans jamais les faire. »

Décor

Devant la maison.

Porte marron au centre.

Valises colorées au premier plan.

Fenêtres bleues.

Jardin vert.

Trottoir gris.

Boîte aux lettres.

Personnage

PLAYER_01 :

Position X=0, Z=3.

Accroupi devant les valises.

Main droite sur une valise rouge.

Visage inquiet.

Accessoires

SUITCASE_RED.

SUITCASE_BLUE.

SUITCASE_YELLOW.

SUITCASE_GREEN.

SUITCASE_PURPLE.

Une petite étiquette rectangulaire sur certaines valises.

Ambiance

Heure : 17 h 30.

Ciel : #E6A6B9.

Fenêtres éteintes.

Début de coucher de soleil.

Plans

PLAN 1 — 0 à 2,2 s

Type : travelling horizontal.

Départ : valise rouge.

Arrivée : valise bleue et jaune.

Mouvement : pan de gauche à droite.

Mot : « TOUTES »

PLAN 2 — 2,2 à 4,4 s

Type : caméra troisième personne.

Départ : côté gauche du personnage.

Arrivée : devant le personnage accroupi.

Mouvement : rotation de 90 degrés.

Écran : avatar entouré de valises.

Mot : « PROMIS »

PLAN 3 — 4,4 à 6,6 s

Type : gros plan objet.

Départ : étiquette sur une valise.

Arrivée : visage inquiet du personnage.

Mouvement : pan vertical.

Mot : « JAMAIS »

SCÈNE 06 — LA CULPABILITÉ

Durée : 6,6 secondes

Narration exacte :
« Appeler un ami. Rendre visite à quelqu'un. Tenir une promesse faite des années auparavant. »

Décor

Intérieur de la maison.

Mur bleu gris #64758A.

Sol marron #987A5C.

Canapé gris #777777 à gauche.

Table basse au centre.

Téléphone rectangulaire noir sur la table.

Porte d'entrée à droite.

Fenêtre en arrière-plan.

Valises visibles à travers la fenêtre.

Personnage

PLAYER_01 :

Debout devant la table.

Bras droit dirigé vers le téléphone.

Visage triste.

Tête légèrement inclinée.

Accessoires

PHONE_01 : noir #222222.

TABLE_01 : marron #77553B.

Une photo de famille secondaire sur le mur, sans personnage supplémentaire identifiable.

Ambiance

Heure : 19 h 00.

Ciel : #E69AB7.

Fenêtres : éteintes.

Éclairage : couleurs plates, intérieur sombre mais parfaitement lisible.

Plans

PLAN 1 — 0 à 2,2 s

Type : gros plan sur téléphone.

Départ : téléphone sur table.

Arrivée : écran affichant un appel manqué stylisé.

Mouvement : rapprochement.

Mot : « APPELER »

PLAN 2 — 2,2 à 4,4 s

Type : caméra face personnage.

Départ : plan taille.

Arrivée : visage et torse.

Mouvement : rotation légère.

Écran : personnage baisse la tête.

Mot : « VISITE »

PLAN 3 — 4,4 à 6,6 s

Type : caméra troisième personne arrière.

Départ : dos de PLAYER_01.

Arrivée : fenêtre et valises extérieures.

Mouvement : recul.

Mot : « ANNÉES »

SCÈNE 07 — LA DERNIÈRE VALISE

Durée : 6,6 secondes

Narration exacte :
« Mais un matin, une dernière valise est apparue. Elle était vieille, marron, et différente des autres. »

Décor

Extérieur de la maison.

Maison blanche.

Porte marron.

Jardin vert.

Toutes les valises colorées déjà présentes.

Nouvelle valise devant la porte.

Ciel de petit matin.

Personnage

PLAYER_01 :

Debout.

Position X=0, Z=3.

Corps tourné vers la nouvelle valise.

Visage surpris puis inquiet.

Accessoires

SUITCASE_OLD :

Position X=0, Y=0, Z=0.

Couleur #71513C.

Poignée #493323.

Roues #252525.

Étiquette #D9C6A3.

Taille légèrement inférieure aux autres valises.

Les autres valises ne doivent pas disparaître.

Ambiance

Heure : 06 h 30.

Ciel : #E8AFC1 à l'horizon, #83B9D7 en hauteur.

Fenêtres : éteintes.

Éclairage de journée naissante.

Plans

PLAN 1 — 0 à 2,2 s

Type : vue aérienne.

Départ : maison et valises.

Arrivée : nouvelle valise marron.

Mouvement : descente rapide.

Mot : « MATIN »

PLAN 2 — 2,2 à 4,4 s

Type : caméra basse.

Départ : valise marron de trois-quarts.

Arrivée : étiquette visible.

Mouvement : rotation horizontale légère.

Mot : « DERNIÈRE »

PLAN 3 — 4,4 à 6,6 s

Type : caméra face personnage.

Départ : personnage et valise.

Arrivée : plan rapproché de PLAYER_01.

Mouvement : petit rapprochement.

Mot : « DIFFÉRENTE »

SCÈNE 08 — LA GRAND-MÈRE

Durée : 6,6 secondes

Narration exacte :
« Je l'ai ouverte. À l'intérieur, il y avait une photo de ma grand-mère et une lettre. »

Décor

Devant la maison.

Valise marron au centre.

Autres valises en arrière-plan.

Porte de la maison visible.

Pelouse verte.

Trottoir gris.

Boîte aux lettres à droite.

Personnage

PLAYER_01 :

Accroupi.

Position X=0, Z=2.

Main droite sur la poignée.

Main gauche près du rabat.

Visage inquiet puis triste.

Accessoires

SUITCASE_OLD.

GRANDMOTHER_PHOTO_01.

LETTER_01.

Étiquette beige.

Intérieur de valise marron clair #B59B7A.

La photo doit être un rectangle plat avec un avatar miniature de grand-mère dessiné en géométrie simple.

Ambiance

Heure : 06 h 35.

Ciel : #E8AFC1 et #83B9D7.

Lumières : éteintes.

Aucun effet surnaturel.

Plans

PLAN 1 — 0 à 2,2 s

Type : caméra proche du sol.

Départ : valise fermée.

Arrivée : valise ouverte.

Animation : rotation du couvercle autour d'un axe.

Mot : « OUVERTE »

PLAN 2 — 2,2 à 4,4 s

Type : vue plongeante gameplay.

Départ : intérieur de la valise.

Arrivée : photographie visible.

Mouvement : descente verticale.

Mot : « GRAND-MÈRE »

PLAN 3 — 4,4 à 6,6 s

Type : gros plan sur lettre.

Départ : photo.

Arrivée : lettre blanche à côté.

Mouvement : pan horizontal.

Mot : « LETTRE »

SCÈNE 09 — LA PROMESSE

Durée : 6,6 secondes

Narration exacte :
« Elle me rappelait une promesse que je lui avais faite avant sa mort : revenir la voir une dernière fois. Je n'avais jamais pu lui dire au revoir. »

Décor

Même emplacement devant la maison.

Valise ouverte.

Photo de grand-mère.

Lettre.

Porte marron.

Jardin.

Valises colorées derrière le personnage.

Personnage

PLAYER_01 :

À genoux devant la valise.

Photo tenue dans la main droite.

Lettre dans la main gauche.

Visage triste.

Tête baissée.

Accessoires

Photo de grand-mère.

Lettre.

Valise ouverte.

Petite étiquette beige.

Ambiance

Heure : 06 h 40.

Ciel : #F0B2C3.

Lumière naturelle de jeu.

Toutes les fenêtres éteintes.

Plans

PLAN 1 — 0 à 2,2 s

Type : caméra face personnage.

Départ : plan moyen.

Arrivée : personnage à genoux.

Mouvement : descente verticale.

Mot : « PROMESSE »

PLAN 2 — 2,2 à 4,4 s

Type : gros plan photo.

Départ : photo dans la main.

Arrivée : photo occupant environ 35 % de l'écran.

Mouvement : léger rapprochement.

Mot : « REVENIR »

PLAN 3 — 4,4 à 6,6 s

Type : caméra derrière le personnage.

Départ : vue sur les valises.

Arrivée : caméra légèrement au-dessus de son épaule, lettre visible.

Mouvement : rotation de 45 degrés.

Mot : « PARDON »

SCÈNE 10 — LE MESSAGE

Durée : 6,6 secondes de base, extensible selon la narration.

Narration exacte :
« Au dos de la lettre, quelques mots étaient écrits : "Je sais que tu n'as pas oublié. Je t'attends toujours dans tes souvenirs." Cette nuit-là, j'ai compris que certaines promesses ne disparaissent jamais vraiment. Et toi, quelle promesse aimerais-tu encore pouvoir tenir ? »

Décor

Jardin devant la maison.

Maison blanche au centre arrière-plan.

Porte marron.

Pelouse verte.

Valises colorées réparties devant la maison.

Dernière valise marron ouverte au centre.

Route grise en arrière-plan.

Ciel rose et bleu pâle.

Personnage

PLAYER_01 :

Debout à la fin.

Photo dans la main droite.

Lettre dans la main gauche.

Visage triste mais apaisé.

Regard vers la photo puis vers la caméra.

Accessoires

Lettre.

Photo de grand-mère.

Valise marron ouverte.

Autres valises colorées.

Ambiance

Heure : 06 h 50.

Ciel : #F1B6C7 et #94C7E1.

Lumières : éteintes.

Musique : piano discret.

Aucun fantôme, aucune apparition.

Plans

PLAN 1 — 0 à 2,2 s

Type : gros plan sur la lettre.

Départ : face avant de la lettre.

Arrivée : lettre retournée, dos visible.

Mouvement : rotation de l'objet.

Mot : « OUBLIÉ »

PLAN 2 — 2,2 à 4,4 s

Type : caméra troisième personne arrière.

Départ : derrière PLAYER_01.

Arrivée : plan moyen avec toutes les valises.

Mouvement : recul progressif.

Écran : personnage debout face à sa maison.

Mot : « SOUVENIRS »

PLAN 3 — 4,4 à 6,6 s

Type : caméra face personnage.

Départ : plan moyen.

Arrivée : personnage et photo visibles.

Mouvement : léger déplacement latéral.

Écran : avatar regarde la photo puis la caméra.

Mot : « TOI ? »

IMPORTANT : si la narration continue après les 6,6 secondes, prolonger la scène avec un plan supplémentaire de 2 à 4 secondes. Ne jamais supprimer la dernière question.

4. BIBLIOTHÈQUE COMPLÈTE DES ASSETS À CONSTRUIRE

Créer tous les assets une seule fois et les réutiliser.

4.1 Environnement extérieur
ID Objet Géométrie Couleur
HOUSE_MAIN Maison familiale Cubes + toit #E5E0D4
ROOF_MAIN Toit rouge Cubes inclinés ou prismes #9B4141
ROAD Route BoxGeometry #62666C
SIDEWALK Trottoir BoxGeometry #AAAAAA
GRASS Pelouse PlaneGeometry #55A84B
TREE Arbre cubique Cubes + cylindre #43844B
MAILBOX Boîte aux lettres Cubes #777777
SUN Soleil SphereGeometry simplifiée #FFE08A
CLOUD Nuage Cubes #FFFFFF
4.2 Intérieur

WALL_BLUE : mur bleu gris.

FLOOR_BROWN : sol marron.

SOFA_GREY : canapé gris.

TABLE_BROWN : table basse.

WINDOW_MAIN : fenêtre.

DOOR_MAIN : porte.

CURTAIN : rideaux.

WALL_PHOTO : cadre photo.

PHONE_01 : téléphone rectangulaire.

CHAIR : chaise cubique.

4.3 Valises

Construire six modèles réutilisables :

SUITCASE_RED.

SUITCASE_BLUE.

SUITCASE_YELLOW.

SUITCASE_GREEN.

SUITCASE_PURPLE.

SUITCASE_OLD.

Chaque valise doit posséder :

Un corps rectangulaire.

Une poignée.

Deux roues.

Une bande décorative.

Une position et une rotation configurables.

Prévoir une fonction :

createSuitcase({
id,
color,
position,
rotation,
scale,
isOld
})

Toutes les valises doivent utiliser le même système de géométrie.

4.4 Accessoires émotionnels

Créer :

GRANDMOTHER_PHOTO_01 : photographie rectangulaire.

LETTER_01 : lettre blanche.

ENVELOPE_01 : enveloppe.

PHONE_01 : téléphone.

SUITCASE_TAG_01 : étiquette beige.

PHOTO_FRAME_01 : cadre photo.

La photo de grand-mère doit être cohérente dans tous les plans.

Ne pas générer de photo externe. Construire l'avatar de la grand-mère dans une petite scène 3D simplifiée et utiliser une représentation plane de cette image dans la photographie.

5. ANIMATIONS À PROGRAMMER

Créer des fonctions indépendantes et réutilisables :

animateWalking(character, speed)

animateStanding(character)

animateCrouching(character)

animateKneeling(character)

animateHeadTurn(character, direction)

animateArmRaise(character)

animateSuitcaseAppear(suitcase)

animateSuitcaseOpen(suitcase)

animateSuitcaseClose(suitcase)

animateSuitcasePickup(character, suitcase)

animatePhotoReveal(suitcase, photo)

animateLetterReveal(suitcase, letter)

animateLetterTurn(letter)

animateCharacterEmotion(character, emotion)

animateCameraFollow(camera, target)

animateCameraOrbit(camera, target, angle)

Apparition des valises

La fonction animateSuitcaseAppear doit :

Positionner la valise au sol.

La faire apparaître sans particules.

Effectuer une petite élévation verticale.

La faire redescendre en moins de 12 frames.

Terminer exactement à sa position prévue.

Les valises déjà apparues ne doivent jamais disparaître.

Ouverture de la dernière valise

Le couvercle doit pivoter autour d'un axe situé sur l'arrière.

État initial : fermé.

Rotation finale : environ -100 degrés.

Durée : 18 frames.

Animation simple et mécanique.

La photo et la lettre restent invisibles avant ouverture.

Révélation de la photo

La photo apparaît dans la valise.

Elle peut être légèrement soulevée par le personnage.

Aucun effet lumineux surnaturel.

Aucun flou.

Le personnage doit tenir la photo dans une main.

Animation de la lettre

La lettre peut être retournée par une rotation de 180 degrés autour de l'axe Y.

Le texte écrit sur la lettre peut être représenté par des lignes géométriques et des mots lisibles en overlay si nécessaire.

Texte exact au dos :

« Je sais que tu n'as pas oublié. Je t'attends toujours dans tes souvenirs. »

Ne jamais essayer de reproduire le texte en 3D avec des caractères déformés. Utiliser un overlay HTML propre si une lecture textuelle est nécessaire.

6. SOUND DESIGN

Le sound design doit renforcer le mystère et la révélation émotionnelle.

Moment indicatif Son Volume
0:00 Ambiance légère de quartier -32 dB
0:05 Vent léger -34 dB
0:10 Petit son de valise apparaissant -24 dB
0:17 Roulement léger de valise -28 dB
0:24 Plusieurs petits impacts de valises -25 dB
0:31 Ambiance intérieure discrète -34 dB
0:37 Son de notification de téléphone -24 dB
0:43 Petit bruit sourd à l'apparition de la dernière valise -22 dB
0:47 Grincement d'ouverture de valise -24 dB
0:51 Musique qui devient plus douce -30 dB
0:55 Bruit de papier -25 dB
0:59 Piano mélancolique -30 dB
1:04 Dernière note de piano -29 dB
Musique

Début :

Ambiance mystérieuse.

Quelques notes espacées.

Pas de grosse percussion.

Milieu :

Tension légèrement croissante.

Petits sons de valises.

Musique toujours en arrière-plan.

Fin :

Piano discret.

Mélodie simple.

Ton émotionnel, sans être dramatique.

La narration doit toujours rester devant la musique.

Ne pas utiliser de sons comiques ou de bruitages cartoon exagérés.

7. LES 12 ERREURS À ÉVITER

Rendu cinématique : aucune lumière volumétrique, aucune profondeur de champ, aucune global illumination, aucun rendu photoréaliste.

Valises trop réalistes : les valises doivent être construites avec des formes rectangulaires simples. Pas de cuir détaillé, de coutures ou de reflets réalistes.

Valises qui changent de position : une fois apparue, chaque valise doit rester exactement à la même position.

Grand-mère qui apparaît physiquement : elle doit uniquement exister dans la photographie. Pas de fantôme, pas de flashback 3D, pas de silhouette.

Personnage qui cache la valise : toujours garder la valise principale visible. Le personnage doit être légèrement décalé sur la gauche ou la droite.

Caméra trop proche : ne jamais couper la tête, les bras ou les objets narratifs importants. Prévoir une marge de cadrage.

Plans statiques : ajouter un mouvement de caméra, une action ou une animation à chaque plan.

Sous-titres multiples : un seul mot à l'écran, synchronisé avec la voix. Aucun mot ne doit rester après le suivant.

Apparition incohérente : chaque nouvelle valise doit apparaître dans un ordre précis et conserver sa couleur.

Photo incohérente : la photographie doit toujours représenter la même grand-mère, avec les mêmes cheveux, vêtements et visage.

Surdramatisation : pas de lumière blanche intense, de fantôme, de flash ou de transition surnaturelle. L'émotion vient de l'histoire.

Mauvais timing vocal : ne jamais accélérer la narration ni supprimer des phrases. Les plans doivent s'adapter à l'audio réel.

8. CHECKLIST DE CONTRÔLE QUALITÉ
Narration

Texte complet envoyé à ElevenLabs.

Voix française naturelle.

Durée audio supérieure ou égale à 63 secondes.

Aucune phrase coupée.

La révélation de la grand-mère est compréhensible.

La dernière question est audible.

Personnages

PLAYER_01 conserve son apparence.

Le personnage possède des proportions Roblox.

Les émotions sont lisibles.

La grand-mère apparaît uniquement dans la photo.

La photo représente toujours le même personnage.

Décors

Maison identique dans toutes les scènes.

Porte et fenêtres conservent leurs positions.

Route et jardin cohérents.

Les valises sont toutes visibles aux bons moments.

La dernière valise est visuellement différente.

Objets

Chaque valise a sa bonne couleur.

Aucune valise ne disparaît.

Les poignées et roues sont visibles.

La dernière valise s'ouvre correctement.

La photographie est lisible.

La lettre est visible.

Le texte au dos de la lettre est correct.

Caméra

Survol aérien d'introduction.

Suivi troisième personne.

Gros plan sur la première valise.

Rotation autour du personnage.

Gros plan sur la dernière valise.

Vue plongeante lors de l'ouverture.

Aucun plan mal cadré.

Aucun objet narratif caché.

Sous-titres

Un mot par écran.

Police épaisse.

Texte blanc.

Contour noir.

Bonne position.

Synchronisation vocale.

Aucun chevauchement.

Audio

Sons d'apparition des valises.

Bruit d'ouverture.

Bruit de papier.

Musique discrète.

Voix toujours dominante.

Silence ou baisse musicale pendant la révélation.

Export

1080 × 1920.

30 FPS.

MP4 H.264.

Durée supérieure ou égale à 63 secondes.

Aucune frame noire.

Aucun élément hors écran.

Lecture intégrale vérifiée.

9. CONDITION FINALE DE LIVRAISON

La vidéo doit raconter une histoire visuelle compréhensible même sans le son.

Un spectateur doit pouvoir comprendre :

Les promesses oubliées créent des valises.

Les valises s'accumulent devant la maison.

Une dernière valise apparaît.

Elle contient une photo de grand-mère et une lettre.

La révélation concerne une promesse jamais tenue.

L'émotion doit venir de la découverte progressive, pas d'effets visuels sophistiqués.

Le rendu doit rester fidèle à une capture de gameplay Roblox.

Avant de livrer :

Générer la vidéo complète.

Lire le fichier du début à la fin.

Vérifier les sous-titres.

Vérifier les mouvements.

Corriger les problèmes de caméra.

Corriger les incohérences des objets.

Exporter uniquement la version validée.

Consigne commune aux deux productions : Claude Code doit générer d'abord les voix ElevenLabs, récupérer leurs durées réelles, puis ajuster les scènes et les animations aux timestamps audio. Les 30 plans sont une structure de départ, pas une limite qui doit couper la narration.

Les deux documents sont prêts à être transmis séparément à Claude Code.

ChatGPT peut faire des erreurs. Vérifiez les informations importantes.
Dernière réponse

Analyser