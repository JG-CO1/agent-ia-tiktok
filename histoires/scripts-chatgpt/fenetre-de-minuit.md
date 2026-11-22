
DOCUMENT 1 — LA FENÊTRE DE MINUIT

PRÊT POUR CLAUDE CODE 10 scènes · 30 plans

Rédaction
PRODUCTION SCRIPT — LA FENÊTRE DE MINUIT
Roblox Gameplay Storytelling — Remotion + Three.js + ElevenLabs
0. INSTRUCTIONS GÉNÉRALES DE PRODUCTION

Tu es responsable de fabriquer intégralement cette vidéo.

Tu disposes de :

Remotion pour le montage et le rendu final.

Three.js pour construire les décors, les personnages, les objets et les caméras.

ElevenLabs pour générer la narration vocale.

Un système de sous-titres synchronisés mot par mot.

Tu ne disposes PAS de générateur d'images IA. Tous les éléments visuels doivent être construits en géométrie 3D avec Three.js.

Règle absolue de rendu

Le résultat doit ressembler à une capture vidéo de gameplay Roblox.

INTERDICTION :

Photorealism.

Global illumination.

Volumetric lighting.

Depth of field.

Cinematic rendering.

Ray tracing.

Realistic human anatomy.

Film-style camera.

Realistic textures.

Cinematic color grading.

Utiliser des MeshBasicMaterial ou des MeshLambertMaterial simples, des géométries cubiques, des couleurs plates et des ombres simples.

La caméra doit toujours ressembler à une caméra contrôlée par un joueur Roblox.

Paramètres de sortie

Résolution : 1080 × 1920.

Format : vertical 9:16.

Fréquence : 30 FPS.

Durée cible : 66 à 70 secondes.

Narration : environ 175 mots.

Voix : ElevenLabs, française, masculine, naturelle, légèrement mystérieuse.

Sous-titres : un mot à la fois.

Police : Arial Black ou Anton.

Texte blanc : #FFFFFF.

Contour noir : #000000, 7 px.

Position : centre horizontal, environ 53 % de la hauteur.

Aucun bandeau de sous-titres.

Ne jamais afficher deux mots simultanément.

1. NARRATION FINALE
Texte intégral à envoyer à ElevenLabs

« Dans notre ville, une règle était connue de tous. Après minuit, personne n'avait le droit de laisser une lumière allumée. Ceux qui désobéissaient disparaissaient avant le lever du soleil. Une nuit, j'ai remarqué une vieille dame, seule derrière sa fenêtre. Elle tenait une petite bougie et regardait constamment la rue. Chaque soir, elle attendait quelqu'un. Son fils, parti depuis des années. Je connaissais la règle. Mais cette nuit-là, je n'ai pas réussi à détourner les yeux. Alors, à minuit passé, j'ai allumé ma lampe pour lui tenir compagnie. Pendant quelques minutes, nos deux fenêtres sont restées éclairées. Puis, soudain, sa bougie s'est éteinte. Sa fenêtre est devenue noire. Le lendemain matin, je suis allé frapper chez elle. Personne n'a répondu. La maison était vide. Pourtant, devant ma porte, une enveloppe m'attendait. À l'intérieur, il y avait une vieille photo d'un garçon et quelques mots : "Merci d'avoir attendu avec moi. Mon fils est enfin rentré." Depuis, chaque nuit, j'éteins ma lumière à minuit. Mais je laisse toujours ma fenêtre ouverte. Et toi, aurais-tu désobéi pour tenir compagnie à quelqu'un ? »

Consignes vocales

Débit : environ 155 à 165 mots/minute.

Durée recherchée : 64 à 69 secondes.

Voix masculine adulte.

Ton : narrateur qui raconte un événement étrange à un ami.

Pas de voix de bande-annonce.

Pas de surjeu dramatique.

Petite pause après les phrases révélant une disparition.

Accentuation légère sur « disparu », « noire », « mon fils » et « merci ».

Ne pas accélérer artificiellement la voix pour faire rentrer le texte dans la vidéo.

Générer l'audio avant de finaliser le montage. Utiliser les timestamps réels de la narration pour synchroniser les scènes et les sous-titres.

2. BIBLE VISUELLE ET COHÉRENCE
2.1 Personnage principal

ID : PLAYER_01

Tête : cube 0,8 × 0,8 × 0,8.

Torse : bloc 0,9 × 1,0 × 0,45.

Bras : deux blocs 0,3 × 1,0 × 0,3.

Jambes : deux blocs 0,35 × 0,9 × 0,35.

Tête : #E6B98F.

Cheveux : #252525.

Hoodie : #202631.

Pantalon : #303C52.

Chaussures : #171717.

Yeux : deux petits rectangles noirs.

Bouche : petit rectangle noir.

Émotions :

Neutre : yeux et bouche simples.

Inquiet : sourcils inclinés et bouche légèrement ouverte.

Triste : sourcils remontés vers le centre.

Surpris : yeux plus grands et bouche ouverte.

2.2 Vieille dame

ID : OLD_WOMAN_01

Tête cubique : #D9AE8B.

Cheveux gris : #A7A7A7.

Cardigan violet : #79628D.

Jupe : #51485D.

Chaussures : #383838.

Corps et membres rectangulaires.

Visage simple.

Expressions :

Attente : regard vers la fenêtre, bouche neutre.

Tristesse : sourcils remontés, bouche légèrement descendante.

Espoir : yeux orientés vers la rue.

2.3 Le fils sur la photo

ID : SON_PHOTO_01

Avatar masculin cubique.

Cheveux bruns : #493323.

Haut bleu : #376DAD.

Pantalon noir : #242424.

Visage souriant simple.

Il apparaît uniquement sur une photographie rectangulaire dans l'enveloppe.

Ne pas créer un troisième personnage vivant.

2.4 Coordonnées du décor

Utiliser un système de coordonnées stable :

X négatif = gauche.

X positif = droite.

Z négatif = arrière-plan.

Z positif = avant-plan.

Y = hauteur.

Le quartier et la maison ne doivent jamais changer de position entre les scènes.

3. DÉCOUPAGE EN 10 SCÈNES — 30 PLANS

Durée de référence : 3 plans de 2,2 secondes par scène, soit environ 66 secondes.

Les durées sont indicatives. Les transitions doivent être ajustées aux timestamps réels de ElevenLabs.

SCÈNE 01 — LA RÈGLE

Durée : 6,6 secondes
Narration : « Dans notre ville, une règle était connue de tous. »

Décor exact

Quartier résidentiel nocturne.

Route grise #555B65 : centre, allant du premier au dernier plan.

Maison A #D8C6A6 : gauche, arrière-plan.

Maison B #D5D5D5 : centre, arrière-plan.

Maison C #A9B7C7 : droite, arrière-plan.

Collines vert sombre #35513D : arrière-plan lointain.

Lampadaires gris #646464 : gauche et droite.

Lune blanche #FFFFFF : ciel, légèrement à droite.

Étoiles : petits cubes blancs répartis dans le ciel.

Personnages

Aucun personnage au premier plan.

Deux avatars minuscules peuvent être visibles sur un trottoir éloigné.

Ambiance

Heure : 23 h 50.

Ciel : #111D46.

Fenêtres : toutes éteintes sauf une fenêtre jaune #FFD66B sur la maison B.

Lampadaires : allumés.

Plans

PLAN 1 — 0 à 2,2 s

Type : vue aérienne.

Départ : altitude Y=25, position X=0, Z=18.

Arrivée : altitude Y=13, position X=0, Z=4.

Mouvement : descente rapide et légère avancée.

Écran : vue générale du quartier et de ses maisons.

Mot : « VILLE »

PLAN 2 — 2,2 à 4,4 s

Type : aerial flyover.

Départ : au-dessus de la route.

Arrivée : au-dessus des maisons.

Mouvement : déplacement horizontal gauche vers droite.

Écran : plusieurs fenêtres sombres.

Mot : « RÈGLE »

PLAN 3 — 4,4 à 6,6 s

Type : zoom gameplay.

Départ : vue sur les trois maisons.

Arrivée : caméra orientée vers la fenêtre jaune de la maison B.

Mouvement : rapprochement rapide.

Mot : « TOUS »

SCÈNE 02 — L'INTERDICTION

Durée : 6,6 secondes
Narration : « Après minuit, personne n'avait le droit de laisser une lumière allumée. »

Décor exact

Même quartier, même orientation.

Maison B au centre.

Porte marron #76523B.

Fenêtres rectangulaires.

Route grise.

Lampadaire à gauche.

Horloge de rue sur un petit panneau : cadran blanc, aiguilles noires.

Personnage

PLAYER_01 :

Position initiale : X=-3, Y=0, Z=4.

Hoodie #202631.

Pantalon #303C52.

Pose debout.

Action : regarde les fenêtres puis tourne la tête vers l'horloge.

Visage : inquiet.

Ambiance

Heure : 23 h 59.

Ciel : #101B43.

Fenêtres : éteintes.

Horloge : aiguilles sur 23:59.

Lampadaire : allumé.

Plans

PLAN 1 — 0 à 2,2 s

Type : troisième personne arrière.

Départ : derrière PLAYER_01.

Arrivée : rapprochement vers l'horloge.

Écran : personnage regardant l'horloge.

Mot : « MINUIT »

PLAN 2 — 2,2 à 4,4 s

Type : gros plan objet.

Départ : horloge entière.

Arrivée : cadran occupant environ 40 % de l'écran.

Mouvement : petite rotation latérale.

Action : aiguille atteint 00:00.

Mot : « PERSONNE »

PLAN 3 — 4,4 à 6,6 s

Type : caméra face personnage.

Départ : plan taille.

Arrivée : plan rapproché visage.

Mouvement : recul léger puis arrêt.

Écran : PLAYER_01 inquiet, fenêtres sombres derrière lui.

Mot : « LUMIÈRE »

SCÈNE 03 — LA VIEILLE DAME

Durée : 6,6 secondes
Narration : « Ceux qui désobéissaient disparaissaient avant le lever du soleil. »

Décor exact

Intérieur de la maison C.

Mur beige #D8C7A8.

Sol marron clair #987A5C.

Fenêtre rectangulaire : centre arrière.

Rideaux violets #75617D.

Canapé brun #74513B : gauche.

Petite table carrée #765A42 : centre.

Bougie sur la table : droite du canapé.

Cadre photo du fils : sur le mur à gauche de la fenêtre.

Personnage

OLD_WOMAN_01 :

Position : X=0, Y=0, Z=-1.

Assise sur le canapé.

Mains posées devant elle.

Tête orientée vers la fenêtre.

Visage triste et patient.

Ambiance

Heure : 00 h 02.

Ciel extérieur : #101A3F.

Fenêtre : éclairée très légèrement par la bougie.

Bougie : jaune #FFE28A.

Autres lumières : éteintes.

Plans

PLAN 1 — 0 à 2,2 s

Type : travelling intérieur.

Départ : porte d'entrée.

Arrivée : vue générale du salon.

Mouvement : avance rapide.

Écran : mobilier cubique et vieille dame.

Mot : « DISPARAISSENT »

PLAN 2 — 2,2 à 4,4 s

Type : troisième personne latérale.

Départ : à gauche du canapé.

Arrivée : face à la vieille dame.

Mouvement : rotation horizontale.

Écran : elle regarde la rue.

Mot : « SOLEIL »

PLAN 3 — 4,4 à 6,6 s

Type : gros plan gameplay.

Départ : visage de la vieille dame.

Arrivée : cadrage incluant son regard et la fenêtre.

Mouvement : léger déplacement vers la droite.

Mot : « ATTENDAIT »

SCÈNE 04 — LE FILS

Durée : 6,6 secondes
Narration : « Une nuit, j'ai remarqué une vieille dame, seule derrière sa fenêtre. Elle tenait une petite bougie et regardait constamment la rue. »

Décor exact

Extérieur de la maison C.

Façade beige #D8C7A8.

Fenêtre centrale : X=0, Y=3, Z=-3.

Porte : gauche de la façade.

Petite clôture blanche : droite.

Pelouse #55A84B.

Trottoir gris.

Bougie visible à travers la fenêtre.

Personnages

PLAYER_01 :

Position : avant-plan, X=-3, Z=2.

Pose debout.

Tête orientée vers la fenêtre.

Visage curieux.

OLD_WOMAN_01 :

Position : intérieur, derrière la fenêtre.

Pose assise.

Bougie dans les mains.

Regard vers la rue.

Ambiance

Heure : 00 h 05.

Ciel : #111D46.

Fenêtre de la vieille dame : allumée.

Toutes les autres fenêtres : éteintes.

Plans

PLAN 1 — 0 à 2,2 s

Type : suivi troisième personne.

Départ : derrière PLAYER_01 dans la rue.

Arrivée : face à la maison.

Mouvement : marche avant simulée par caméra.

Mot : « REMARQUÉ »

PLAN 2 — 2,2 à 4,4 s

Type : caméra face à la fenêtre.

Départ : façade entière.

Arrivée : fenêtre centrée.

Mouvement : rapprochement horizontal et avant.

Écran : vieille dame et bougie.

Mot : « SEULE »

PLAN 3 — 4,4 à 6,6 s

Type : gros plan sur objet et personnage.

Départ : bougie.

Arrivée : visage de la vieille dame.

Mouvement : pan vertical.

Action : flamme animée.

Mot : « BOUGIE »

SCÈNE 05 — L'ATTENTE

Durée : 6,6 secondes
Narration : « Chaque soir, elle attendait quelqu'un. Son fils, parti depuis des années. »

Décor exact

Même intérieur, sans aucun changement.

Canapé à gauche.

Fenêtre au centre.

Table et bougie à droite.

Photo encadrée du fils sur le mur gauche.

Rideaux violets.

Porte visible au fond.

Personnages

OLD_WOMAN_01 :

Assise.

Corps tourné vers la fenêtre.

Main droite proche de la bougie.

Visage mélancolique.

PLAYER_01 :

Visible brièvement à travers la fenêtre.

Position extérieure, face à elle.

Pose immobile.

SON_PHOTO_01 :

Uniquement imprimé sur la photographie.

Photo rectangulaire 0,6 × 0,8.

Cadre marron.

Ambiance

Heure : 00 h 08.

Ciel : #101A3F.

Bougie allumée.

Fenêtre allumée.

Lampe de salon éteinte.

Plans

PLAN 1 — 0 à 2,2 s

Type : travelling latéral intérieur.

Départ : canapé.

Arrivée : photographie du fils.

Mouvement : pan gauche vers droite.

Mot : « CHAQUE »

PLAN 2 — 2,2 à 4,4 s

Type : gros plan sur photo.

Départ : photo entière.

Arrivée : visage du fils dans le cadre.

Mouvement : léger zoom.

Mot : « FILS »

PLAN 3 — 4,4 à 6,6 s

Type : caméra derrière la vieille dame.

Départ : derrière son épaule.

Arrivée : fenêtre et rue.

Mouvement : rapprochement lent.

Mot : « ANNÉES »

SCÈNE 06 — LE CHOIX

Durée : 6,6 secondes
Narration : « Je connaissais la règle. Mais cette nuit-là, je n'ai pas réussi à détourner les yeux. »

Décor exact

Maison du protagoniste.

Chambre carrée.

Mur bleu gris #64758A.

Lit rectangulaire : gauche.

Bureau : centre.

Lampe de bureau : droite.

Fenêtre : arrière-plan.

Horloge numérique : 00:12.

Porte : gauche arrière-plan.

Personnage

PLAYER_01 :

Debout devant le bureau.

Hoodie noir.

Pantalon bleu gris.

Main droite levée vers l'interrupteur.

Visage hésitant.

Ambiance

Heure : 00 h 12.

Ciel : #101B43.

Lampe éteinte.

Fenêtre extérieure éteinte.

Seule la lune apporte une lumière visuelle très simple.

Plans

PLAN 1 — 0 à 2,2 s

Type : caméra troisième personne.

Départ : derrière PLAYER_01.

Arrivée : vue du bureau et de la lampe.

Mouvement : avance rapide.

Mot : « RÈGLE »

PLAN 2 — 2,2 à 4,4 s

Type : rotation autour du personnage.

Départ : profil gauche.

Arrivée : profil droit.

Mouvement : arc de 90 degrés.

Écran : hésitation visible sur le visage.

Mot : « MAIS »

PLAN 3 — 4,4 à 6,6 s

Type : gros plan gameplay sur main et interrupteur.

Départ : bras du personnage.

Arrivée : doigt au-dessus de l'interrupteur.

Mouvement : déplacement avant.

Action : main s'arrête juste avant de toucher.

Mot : « YEUX »

SCÈNE 07 — LA LUMIÈRE

Durée : 6,6 secondes
Narration : « Alors, à minuit passé, j'ai allumé ma lampe pour lui tenir compagnie. Pendant quelques minutes, nos deux fenêtres sont restées éclairées. »

Décor exact

Chambre du protagoniste et extérieur de la maison C.

Objets :

Bureau marron #77553B.

Lampe jaune #F4C95D.

Fenêtre du protagoniste.

Lit gris #697080.

Rideaux bleu foncé.

Maison C visible depuis l'extérieur.

Personnage

PLAYER_01 :

Debout devant le bureau.

Main droite en contact avec l'interrupteur.

Visage résolu.

Action : appuie sur l'interrupteur.

OLD_WOMAN_01 :

Visible dans la fenêtre opposée.

Toujours assise.

Tête tournée vers le protagoniste.

Visage légèrement souriant.

Ambiance

Heure : 00 h 15.

Ciel : #101A42.

Lampe du protagoniste : allumée.

Fenêtre de la vieille dame : allumée.

Les deux fenêtres doivent être visiblement lumineuses simultanément.

Plans

PLAN 1 — 0 à 2,2 s

Type : gros plan sur lampe.

Départ : lampe éteinte.

Arrivée : lampe allumée.

Mouvement : aucun déplacement important, léger cadrage latéral.

Animation : changement instantané de matériau de l'ampoule.

Mot : « ALLUMÉ »

PLAN 2 — 2,2 à 4,4 s

Type : caméra troisième personne.

Départ : dos de PLAYER_01.

Arrivée : fenêtre éclairée.

Mouvement : recul.

Mot : « COMPAGNIE »

PLAN 3 — 4,4 à 6,6 s

Type : vue extérieure aérienne basse.

Départ : maison du protagoniste.

Arrivée : cadrage montrant les deux maisons.

Mouvement : déplacement horizontal.

Écran : deux fenêtres jaunes dans le quartier bleu nuit.

Mot : « DEUX »

SCÈNE 08 — LA DISPARITION

Durée : 6,6 secondes
Narration : « Puis, soudain, sa bougie s'est éteinte. Sa fenêtre est devenue noire. »

Décor exact

Extérieur de la maison C.

Façade beige.

Fenêtre centrale.

Rideaux violets.

Rue vide.

Lampadaire à droite.

Maison du protagoniste visible au loin.

Personnages

OLD_WOMAN_01 :

Visible au début derrière la fenêtre.

Pose assise.

Immobile.

Disparaît de la scène à la fin du plan 2.

PLAYER_01 :

Visible sur le trottoir.

Debout.

Corps tourné vers la fenêtre.

Visage choqué.

Ambiance

Heure : 00 h 19.

Ciel : #0C1537.

Bougie : allumée au départ, puis éteinte.

Fenêtre : jaune au départ, noire à la fin.

Aucune lumière intérieure visible après disparition.

Plans

PLAN 1 — 0 à 2,2 s

Type : gros plan sur bougie.

Départ : flamme allumée.

Arrivée : flamme éteinte.

Animation : flamme diminue puis disparaît.

Mot : « SOUDAIN »

PLAN 2 — 2,2 à 4,4 s

Type : caméra face fenêtre.

Départ : fenêtre jaune.

Arrivée : fenêtre noire.

Animation : disparition de OLD_WOMAN_01.

Mouvement : léger rapprochement.

Mot : « NOIRE »

PLAN 3 — 4,4 à 6,6 s

Type : troisième personne arrière.

Départ : dos de PLAYER_01.

Arrivée : caméra à côté de son visage.

Mouvement : rotation rapide de 120 degrés.

Écran : avatar figé, fenêtre sombre derrière lui.

Mot : « VIDE »

SCÈNE 09 — LE LENDEMAIN

Durée : 6,6 secondes
Narration : « Le lendemain matin, je suis allé frapper chez elle. Personne n'a répondu. La maison était vide. »

Décor exact

Même maison C.

Porte marron #76523B.

Poignée dorée #D5AF55.

Fenêtre noire.

Pelouse verte.

Boîte aux lettres grise.

Allée grise.

Aucun meuble visible à travers la fenêtre.

Personnage

PLAYER_01 :

Position devant la porte.

Pose debout.

Bras droit levé puis abaissé.

Visage inquiet puis triste.

OLD_WOMAN_01 :

Absente.

Aucun avatar visible dans la maison.

Ambiance

Heure : 07 h 15.

Ciel : #F0A6BD en haut, #8EC8EC à l'horizon.

Soleil : cercle jaune pâle.

Fenêtres : toutes noires.

Lumières artificielles : éteintes.

Plans

PLAN 1 — 0 à 2,2 s

Type : vue aérienne.

Départ : quartier de nuit.

Arrivée : quartier à l'aube.

Transition : changement direct de scène, pas de fondu cinématographique.

Mot : « MATIN »

PLAN 2 — 2,2 à 4,4 s

Type : troisième personne.

Départ : derrière PLAYER_01.

Arrivée : devant la porte.

Mouvement : suivi de marche.

Action : personnage frappe trois fois.

Mot : « PERSONNE »

PLAN 3 — 4,4 à 6,6 s

Type : caméra face fenêtre.

Départ : fenêtre.

Arrivée : intérieur vide.

Mouvement : rapprochement puis léger pan.

Mot : « VIDE »

SCÈNE 10 — LA LETTRE

Durée : 6,6 secondes
Narration : « Pourtant, devant ma porte, une enveloppe m'attendait. À l'intérieur, il y avait une vieille photo d'un garçon et quelques mots : "Merci d'avoir attendu avec moi. Mon fils est enfin rentré." Depuis, chaque nuit, j'éteins ma lumière à minuit. Mais je laisse toujours ma fenêtre ouverte. Et toi, aurais-tu désobéi pour tenir compagnie à quelqu'un ? »

Décor exact

Devant la maison du protagoniste.

Porte bleue foncée #3A526B.

Sol gris clair.

Enveloppe blanche #F1EEE4.

Photo rectangulaire.

Fenêtre du protagoniste à droite.

Pelouse verte.

Boîte aux lettres.

Personnage

PLAYER_01 :

Départ : debout devant sa porte.

Puis : accroupi devant l'enveloppe.

Fin : debout, photo dans la main droite.

Visage : surpris, puis triste et apaisé.

OLD_WOMAN_01 :

Ne pas la faire réapparaître.

Aucun fantôme.

Aucun effet surnaturel visible.

SON_PHOTO_01 :

Visible uniquement dans la photographie.

Cheveux bruns, haut bleu.

Visage souriant.

Ambiance

Heure : 07 h 25.

Ciel : #F1AFC4 et #8ECBE8.

Fenêtre de la maison du protagoniste : allumée au début de la séquence si la continuité le nécessite, puis éteinte.

Fenêtre de la vieille dame : noire.

Plans

PLAN 1 — 0 à 2,2 s

Type : caméra proche du sol.

Départ : chaussures de PLAYER_01.

Arrivée : enveloppe au sol.

Mouvement : pan vertical.

Mot : « ENVELOPPE »

PLAN 2 — 2,2 à 4,4 s

Type : gros plan gameplay sur la photo.

Départ : enveloppe fermée.

Arrivée : photographie visible dans les mains du personnage.

Mouvement : déplacement avant.

Mot : « MERCI »

PLAN 3 — 4,4 à 6,6 s

Type : caméra face personnage.

Départ : plan taille.

Arrivée : plan moyen avec fenêtre ouverte en arrière-plan.

Mouvement : recul lent, sans flou.

Écran : PLAYER_01 regarde la photo puis la fenêtre.

Mot : « TOI ? »

IMPORTANT : la narration doit être entièrement audible. Si la dernière phrase dépasse les 6,6 secondes, ajouter du temps à cette scène plutôt que supprimer des mots ou accélérer la voix.

4. BIBLIOTHÈQUE COMPLÈTE DES ASSETS À CONSTRUIRE

Tous les assets doivent être créés une seule fois, avec des identifiants stables, puis réutilisés.

4.1 Décors
ID Objet Géométrie Couleur
HOUSE_A Maison gauche Cubes + toit #D8C6A6
HOUSE_B Maison centrale Cubes + toit #D5D5D5
HOUSE_C Maison vieille dame Cubes + toit #D8C7A8
HOUSE_PLAYER Maison joueur Cubes + toit #64758A
ROAD Route BoxGeometry #555B65
SIDEWALK Trottoir BoxGeometry #929292
GRASS Pelouse PlaneGeometry #55A84B
HILL Colline ConeGeometry simplifiée #35513D
TREE Arbre Cubes + cylindre #43844B
STREETLIGHT Lampadaire Cylindres + cubes #646464
MOON Lune SphereGeometry peu segmentée #FFFFFF
STAR Étoile CubeGeometry #FFFFFF
4.2 Intérieurs

WALL_BEIGE : mur beige.

FLOOR_BROWN : sol marron.

SOFA : canapé cubique.

TABLE : table basse.

BED : lit rectangulaire.

DESK : bureau.

CURTAIN : rideau rectangulaire.

DOOR : porte pivotante.

WINDOW_FRAME : cadre de fenêtre.

WINDOW_GLASS : vitre.

PICTURE_FRAME : cadre photo.

4.3 Accessoires narratifs

Créer les objets suivants :

CANDLE_01 : bougie avec cylindre et petite flamme.

LAMP_01 : lampe de bureau cubique.

ENVELOPE_01 : enveloppe rectangulaire blanche.

SON_PHOTO_01 : photographie du fils.

CLOCK_01 : horloge de rue.

DIGITAL_CLOCK_01 : horloge numérique.

LETTER_01 : lettre blanche avec lignes noires simples.

LIGHT_SWITCH_01 : interrupteur mural.

MAILBOX_01 : boîte aux lettres.

DOOR_HANDLE_01 : poignée de porte.

4.4 Animations réutilisables

Créer des fonctions indépendantes :

animateWalking(character, speed)

animateStanding(character)

animateSitting(character)

animateCrouching(character)

animateHeadTurn(character, direction)

animateArmRaise(character)

animateDoorKnock(character)

animateCandleFlicker(candle, time)

animateLampSwitch(lamp, state)

animateWindowLight(window, state)

animateEnvelopePickup(character, envelope)

animatePhotoReveal(envelope, photo)

animateClockHands(clock, time)

Bougie

Flamme construite avec un petit cône ou plusieurs cubes.

Variation de hauteur entre 0,12 et 0,20 unité.

Variation de luminosité simulée par changement de couleur.

Pas de particules volumétriques.

Extinction : réduction rapide de la flamme puis disparition.

Lampe

Ampoule géométrique jaune.

OFF : #665A43.

ON : #FFE28A.

Changement en moins de 4 frames.

Ne pas créer d'éclairage global : simuler la lumière avec des matériaux plus lumineux.

Fenêtre

OFF : #29323C.

ON : #FFE28A.

Changement de matériau instantané.

Aucun effet bloom excessif.

Enveloppe

Rectangle blanc.

Petit triangle simulant le rabat.

Ouverture par rotation du rabat.

Photo qui devient visible progressivement.

5. SOUND DESIGN

Le son doit accompagner l'histoire sans couvrir la narration.

Moment Son Niveau indicatif
0:00 Vent nocturne léger -32 dB
0:03 Ambiance quartier nocturne -34 dB
0:07 Tic-tac discret -29 dB
0:13 Grincement léger intérieur -31 dB
0:18 Flamme de bougie -35 dB
0:26 Silence partiel -38 dB
0:32 Clic interrupteur -19 dB
0:35 Son électrique très discret -33 dB
0:43 Extinction de la bougie -25 dB
0:45 Silence soudain coupure ambiance
0:50 Bruit de pas -27 dB
0:53 Trois coups sur la porte -18 dB
0:57 Papier/enveloppe -23 dB
1:00 Piano discret -30 dB
1:06 Dernière note de piano -28 dB

Règles :

La narration reste dominante.

Musique instrumentale originale ou libre de droits.

Pas de jumpscare.

Pas de gros impact sonore.

Le silence à la disparition est volontaire.

Le piano ne doit apparaître qu'après la découverte de l'enveloppe.

Les timestamps sont indicatifs : les recaler sur le montage vocal final.

6. LES 12 ERREURS À ÉVITER

Rendu cinématique : ne jamais utiliser de matériaux photoréalistes, de global illumination ou de volumetric lighting.

Personnages trop réalistes : les avatars doivent rester cubiques, avec des membres rectangulaires et des visages très simples.

Caméra trop proche : ne jamais couper la tête ou les pieds sans intention précise. En plan moyen, conserver le personnage entier avec de la marge.

Personnage qui cache l'action : la bougie, la fenêtre, l'interrupteur et l'enveloppe doivent toujours rester visibles. Le personnage ne doit jamais être placé devant l'objet narratif.

Plans statiques : chaque plan doit comporter un mouvement de caméra ou une animation de personnage ou d'objet.

Mots qui se chevauchent : un seul mot visible. Supprimer le précédent avant de faire apparaître le suivant.

Sous-titres trop petits : le mot doit être immédiatement lisible sur un écran de smartphone.

Décors incohérents : ne jamais déplacer la maison de la vieille dame ou modifier la forme des rues entre deux scènes.

Personnages qui changent d'apparence : verrouiller les couleurs, proportions, vêtements et accessoires des avatars.

Lumières incohérentes : la fenêtre doit être éclairée avant la disparition et complètement noire après. Ne pas laisser une lampe allumée par erreur.

Transitions trop sophistiquées : éviter les fondus, les rotations cinématiques et les effets de particules. Privilégier les cuts francs.

Narration mal synchronisée : ne jamais forcer les scènes à respecter des durées fixes si les mots sont encore prononcés. Adapter les plans à la vraie durée audio.

7. CHECKLIST DE CONTRÔLE QUALITÉ

Avant chaque export, vérifier chaque élément.

Narration

Le texte complet est présent.

La voix est française et intelligible.

Durée audio supérieure ou égale à 63 secondes.

Aucun mot coupé.

Aucune phrase supprimée.

Question finale audible.

Visuels

Tous les personnages sont cubiques.

Les maisons restent identiques.

Les couleurs correspondent à la bible visuelle.

Le ciel évolue correctement.

La bougie est visible et animée.

La lampe s'allume au bon moment.

Les deux fenêtres sont éclairées simultanément.

La fenêtre de la vieille dame devient noire.

La vieille dame ne réapparaît pas.

L'enveloppe et la photo sont visibles.

Caméra

Aucun plan ne dépasse 4 secondes sans justification.

Chaque plan montre une action identifiable.

Aucun objet important n'est caché.

Aucun cadrage ne coupe accidentellement un personnage.

La caméra reste dans un style gameplay.

Les mouvements sont dynamiques mais lisibles.

Sous-titres

Un seul mot à l'écran.

Texte blanc #FFFFFF.

Contour noir épais.

Position centrale.

Synchronisation avec la voix.

Aucun chevauchement.

Ponctuation correctement gérée.

Audio

Narration plus forte que la musique.

Vent discret.

Tic-tac audible.

Extinction accompagnée d'un silence.

Coups à la porte synchronisés.

Piano uniquement sur la révélation.

Export

1080 × 1920.

30 FPS.

MP4 H.264.

Aucun écran noir accidentel.

Aucun élément hors cadre.

Durée finale supérieure ou égale à 63 secondes.

Lecture intégrale vérifiée avant publication.

CONDITION FINALE

Ne considère pas la vidéo comme terminée tant que toutes les cases ne sont pas validées.

Si une scène ne ressemble pas à une capture de gameplay Roblox, reconstruis-la.

La priorité est l'histoire, la lisibilité, le mouvement et la cohérence visuelle. Pas la sophistication graphique.

