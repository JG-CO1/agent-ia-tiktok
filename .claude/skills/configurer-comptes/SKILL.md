---
name: configurer-comptes
description: Configure avec le propriétaire, dans son propre Chrome (Claude in Chrome), tous les comptes et clés du Studio Fantôme — GitHub Pages, jeton Claude, ElevenLabs et choix de la voix, chaîne YouTube et Google Cloud, TikTok for Developers, secrets GitHub, activation de la production — en s'arrêtant à chaque paiement, mot de passe, code 2FA, CAPTCHA, acceptation de conditions et saisie de clé. À lancer une fois, dans une session locale démarrée avec `claude --chrome` dans le dossier du projet.
---

# Configurer les comptes du Studio Fantôme

Tu travailles sur l'ordinateur du propriétaire, avec son navigateur connecté (Claude in Chrome). Il t'a demandé
de faire à sa place tout ce qui peut l'être, et de le solliciter seulement quand c'est indispensable.
Marqueurs : 🤖 = toi, 👤 = le propriétaire (demande-lui clairement, puis attends sa réponse).

## Règles (non négociables)

1. **Les clés ne passent jamais par toi.** Ne lis, ne copie, ne recopie, ne tape et ne résume jamais une valeur
   secrète : clé API, *client secret*, jeton. Le propriétaire colle chaque valeur lui-même dans `.env` avec son
   éditeur (tu ne lis jamais `.env`), puis `npm run fm -- secrets-github` l'envoie sur GitHub par l'entrée standard
   de `gh`. Quand une page affiche une clé (création de clé API, identifiants OAuth, *client secret* TikTok), ne
   lis plus la page (ni texte ni capture) tant que le propriétaire n'a pas confirmé l'avoir copiée et fermé la
   fenêtre. Seule exception : le code d'autorisation TikTok à usage unique de la page de retour (il expire en
   quelques minutes et ne sert à rien sans le *client secret*).
2. **Arrête-toi et demande** pour : tout paiement ou choix d'offre payante, mot de passe, code 2FA ou de
   vérification, CAPTCHA, acceptation de conditions ou d'accords développeur, vérification d'identité, le clic
   final d'un consentement OAuth (« Autoriser », « Continuer »), toute suppression.
3. Ne publie rien, ne modifie aucune vidéo existante, ne change pas la visibilité du dépôt.
4. Installer un logiciel sur l'ordinateur : propose la commande, attends l'accord.
5. Les interfaces et les prix changent : lis les pages en direct. Si un menu diffère de ce guide, dis ce que tu
   vois et adapte-toi ; n'invente jamais un menu, un prix ou une limite.
6. Travaille dans de nouveaux onglets, ne touche pas aux onglets déjà ouverts du propriétaire.

## Point de départ

- Déjà fait (session cloud du 14/11/2026) : code sur https://github.com/JG-CO1/agent-ia-tiktok (public, `main`) ;
  workflows `production`, `publication`, `analytics` **désactivés** jusqu'à l'étape 8 ; pages légales et page de
  retour TikTok dans `docs/` ; photo de profil et bannière dans `docs/identite/`.
- Voix **déjà choisie** (14/11) : « Hugo – Punchy French Creator » (`3Tp5mYhT9wrfnry9pzvV`) sur `eleven_v4`, dans
  `config/chaine.json`. Compte ElevenLabs : offre Creator. L'étape 3 se réduit donc à mettre la clé `sk_…` dans
  `.env` (`ELEVENLABS_API_KEY=`) pour l'envoyer sur GitHub ; ne refaire le choix que si le propriétaire le demande.
- 🤖 Mesure ce qui reste à faire et saute les étapes déjà faites :
  `npm run fm -- acces` puis `npm run fm -- secrets-github --verifier`.

## 0. L'ordinateur (5 min)

- 🤖 `node -v` (≥ 22), `git --version`, `ffmpeg -version`, `gh --version`. S'il manque quelque chose, propose :
  macOS `brew install node ffmpeg gh` · Windows `winget install OpenJS.NodeJS.LTS Gyan.FFmpeg GitHub.cli` ·
  Debian/Ubuntu `sudo apt-get install -y nodejs ffmpeg gh` (vérifier ensuite que Node est en version 22 ou plus).
- 🤖 `npm ci`
- 🤖 `gh auth status`. Si GitHub CLI n'est pas connecté : 👤 lance `gh auth login` dans un autre terminal
  (GitHub.com, HTTPS, connexion par le navigateur).
- 🤖 Si `.env` n'existe pas : `cp .env.example .env` (sans l'ouvrir).
- 🤖 `npm run fm -- secret-aleatoire FM_CLE_JETONS` (clé de chiffrement des jetons TikTok, générée sans affichage).

## 1. GitHub Pages (2 min) 🤖

1. Ouvre https://github.com/JG-CO1/agent-ia-tiktok/settings/pages
2. *Build and deployment* → Source **Deploy from a branch** → branche `main`, dossier `/docs` → **Save**.
3. Après 1 à 3 minutes, chacune doit répondre 200 :
   `curl -sI https://jg-co1.github.io/agent-ia-tiktok/confidentialite.html` (idem `conditions.html`, `tiktok-callback.html`).
4. Facultatif : page d'accueil du dépôt → ⚙️ *About* → description « Média francophone automatisé (TikTok + YouTube
   Shorts) sur l'écosystème Claude, présenté par Ecto. Indépendant, non affilié à Anthropic. », site
   https://jg-co1.github.io/agent-ia-tiktok/

## 2. Jeton Claude pour les workflows (3 min) 👤

- 👤 Dans un **autre terminal** : `claude setup-token`, suivre l'écran, puis coller le jeton dans `.env`
  (`CLAUDE_CODE_OAUTH_TOKEN=`). Ne pas l'exporter dans le terminal : cette session doit rester connectée par
  `/login`, sinon Claude in Chrome se coupe.
- Variante facturée à l'usage : clé de console.anthropic.com → `ANTHROPIC_API_KEY=` dans `.env`.

## 3. ElevenLabs : compte, offre, voix (20 à 30 min)

1. 🤖 Ouvre https://elevenlabs.io/app/sign-up — 👤 crée le compte ou se connecte.
2. 🤖 Ouvre https://elevenlabs.io/pricing et résume les offres **actuelles** (prix, crédits par mois, licence
   commerciale). Besoin réel : environ 950 crédits par vidéo, soit environ 85 000 par mois pour 3 vidéos par jour,
   plus les essais. Il faut une offre **avec licence commerciale** ; d'après l'aide ElevenLabs, l'offre gratuite
   ne permet pas d'utiliser les voix de la Voice Library par l'API. 👤 choisit l'offre et paie.
3. Voix recherchée : **masculine**, vive et chaleureuse, ton d'expert passionné, français de France.
   - 🤖 Ouvre https://elevenlabs.io/app/voice-library avec les filtres langue **French** (accent de France si le
     filtre existe), genre **Male**, usages *social media*, *narration*, *conversational*, triés par popularité.
     Présélectionne 6 voix d'après leurs descriptions. Écarte les voix chuchotées, très graves, de bande-annonce
     ou à l'accent non voulu. Donne la liste au propriétaire.
   - 👤 écoute les aperçus (toi, tu ne peux pas les entendre) et en garde 3.
   - 🤖 ajoute ces 3 voix à **My Voices**.
4. 🤖 Clé API : ouvre la page des clés API (*Developers* ou *Settings* → *API Keys*), **Create API key**, nom
   `studio-fantome`. Si des permissions sont proposées : *Text to Speech* (accès), *Voices* (lecture), *Models*
   (lecture), *User* (lecture, facultatif : sert à `fm acces`). Si une limite de crédits par clé est proposée,
   mets environ 120 000 par mois. 👤 clique sur Créer, colle la clé dans `.env` (`ELEVENLABS_API_KEY=`), ferme la
   fenêtre et te prévient. Ne relis pas la page avant.
5. 🤖 `npm run fm -- acces` (ElevenLabs « ok »), puis `npm run fm -- voix-infos` (identifiants des 3 voix).
6. 🤖 Essai sur le vrai script (environ 3 600 crédits) :
   `npm run fm -- essai-voix 2026-11-14-1-skills-officiels-anthropic --voix <id1>,<id2>,<id3> --modeles eleven_v4,eleven_multilingual_v2`
   Fichiers : `sorties/essais-voix/2026-11-14-1-skills-officiels-anthropic/`. Lis `rapport.json` : la colonne
   **minutage** dit si le modèle renvoie le minutage mot à mot. 👤 écoute et choisit une voix et un modèle.
   Un modèle sans minutage (« non ») ne peut pas être utilisé tel quel, car les sous-titres en dépendent : propose
   `eleven_multilingual_v2`, et note le besoin d'un alignement audio dans `data/apprentissages.md`.
7. 🤖 Écris le choix dans `config/chaine.json` → `voix.voice_id` et `voix.modele` (ajuste `vitesse`, `stabilite`,
   `style` si le propriétaire le demande), puis commit et push (« Voix choisie : … »). L'identifiant de voix n'est
   pas un secret : aucune variable GitHub n'est nécessaire.

## 4. YouTube : chaîne et Google Cloud (25 min)

1. Chaîne : 👤 indique le compte Google qui portera la chaîne (un compte dédié est conseillé). S'il n'y a pas
   encore de chaîne, 🤖 ouvre YouTube → avatar → **Créer une chaîne** ; nom « Studio Fantôme », un @ disponible ;
   👤 valide. Ensuite, dans YouTube Studio → *Personnalisation* : photo `docs/identite/avatar-1024.png`, bannière
   `docs/identite/banniere-youtube-2560x1440.png`. Note le @ obtenu (étape 7).
2. 🤖 https://console.cloud.google.com/projectcreate → nom `studio-fantome` → Créer (👤 accepte les conditions de
   Google Cloud si c'est la première fois ; aucune facturation n'est nécessaire).
3. 🤖 Dans ce projet, active **YouTube Data API v3** (https://console.cloud.google.com/apis/library/youtube.googleapis.com)
   et **YouTube Analytics API** (https://console.cloud.google.com/apis/library/youtubeanalytics.googleapis.com).
4. 🤖 *Google Auth Platform* (https://console.cloud.google.com/auth/overview) → commencer :
   - nom de l'app « Studio Fantôme » ; e-mail d'assistance et e-mail de contact : 👤 les choisit ; audience
     **Externe** ; 👤 accepte la *Google API Services: User Data Policy* ;
   - *Branding* : page d'accueil `https://jg-co1.github.io/agent-ia-tiktok/`, confidentialité
     `…/confidentialite.html`, conditions `…/conditions.html`, domaine autorisé `jg-co1.github.io`. **Pas de logo** :
     un logo impose une vérification de la marque par Google ;
   - *Accès aux données* → ajouter manuellement `https://www.googleapis.com/auth/youtube` et
     `https://www.googleapis.com/auth/yt-analytics.readonly` → enregistrer ;
   - *Audience* → utilisateurs test : le compte Google de la chaîne ; puis **Publier l'application** → « En
     production » (👤 confirme). En mode Test, le jeton expire au bout de 7 jours.
5. 🤖 *Clients* → **Créer un client** → type **Application de bureau** → nom `studio-fantome-cli` → Créer.
   👤 colle l'ID client et le code secret dans `.env` (`YOUTUBE_CLIENT_ID=`, `YOUTUBE_CLIENT_SECRET=`), ferme la
   fenêtre et te prévient. Si le secret n'est plus visible, il faut en ajouter un nouveau sur la fiche du client.
6. 🤖 Lance **en arrière-plan** `npm run fm -- auth youtube` (elle attend le retour sur 127.0.0.1:8765) et ouvre le
   lien affiché. 👤 choisit le compte et la chaîne, passe l'avertissement « application non validée »
   (*Paramètres avancés* → *Accéder à Studio Fantôme*), coche les autorisations, puis *Continuer*.
   La commande affiche « Chaîne autorisée : … » : fais confirmer que c'est la bonne, sinon recommence.
7. 🤖 `npm run fm -- acces` : YouTube « ok ».

## 5. TikTok (30 min, plus le délai de revue de TikTok)

1. 👤 crée ou choisit le compte TikTok de la chaîne (application mobile), avec le même nom et le même @ que sur
   YouTube si possible. Photo `docs/identite/avatar-1024.png` ; bio : « Outils, astuces et actu Claude. Média
   indépendant, non affilié à Anthropic. »
2. 🤖 https://developers.tiktok.com/ → *Log in* (👤 avec le compte de la chaîne) → inscription développeur
   (👤 accepte les conditions).
3. 🤖 *Manage apps* → créer une app :
   - nom « Studio Fantôme » ; catégorie la plus proche de vidéo ou divertissement ;
   - description : « Outil interne de Studio Fantôme : envoie les vidéos de notre propre chaîne en brouillon dans
     notre boîte de réception TikTok, où nous les finalisons et publions nous-mêmes, et lit les statistiques de nos
     vidéos. » ;
   - icône `docs/identite/avatar-1024.png` (si une autre taille est exigée :
     `ffmpeg -i docs/identite/avatar-1024.png -vf scale=512:512 docs/identite/icone-512.png`) ;
   - conditions `https://jg-co1.github.io/agent-ia-tiktok/conditions.html`, confidentialité
     `https://jg-co1.github.io/agent-ia-tiktok/confidentialite.html` ; plateforme **Web**, site
     `https://jg-co1.github.io/agent-ia-tiktok/` ;
   - si TikTok demande de prouver la propriété de l'URL : choisis la vérification par fichier pour le préfixe
     `https://jg-co1.github.io/agent-ia-tiktok/`, mets le fichier téléchargé tel quel dans `docs/`, commit et push,
     attends que `curl -sI` sur son URL réponde 200, puis clique sur *Verify*.
4. 🤖 Produits :
   - **Login Kit** : redirection Web `https://jg-co1.github.io/agent-ia-tiktok/tiktok-callback.html` ;
   - **Display API** : nécessaire pour `video.list` (statistiques) ;
   - **Content Posting API** : envoi en **brouillon** (*Upload*). Laisse *Direct Post* désactivé.
   - Scopes : `user.info.basic`, `video.list`, `video.upload`.
5. Sandbox, à tester avant la revue :
   - 🤖 crée un sandbox, ajoute le compte de la chaîne en *target user* ;
   - 👤 colle le *Client key* et le *Client secret* du sandbox dans `.env` (`TIKTOK_CLIENT_KEY=`, `TIKTOK_CLIENT_SECRET=`) ;
   - 🤖 `npm run fm -- auth tiktok` → ouvre le lien → 👤 autorise → la page de retour affiche une commande prête :
     lance-la. Elle affiche le compte et les scopes accordés ; aucun ne doit manquer ;
   - 🤖 `npm run fm -- essai-tiktok 2026-11-14-1-skills-officiels-anthropic` : le statut attendu est
     `SEND_TO_USER_INBOX`. 👤 vérifie que le brouillon arrive dans l'app TikTok et **ne le publie pas** (voix de
     test). Si l'envoi est refusé, recopie le message d'erreur exact.
6. Revue TikTok : 🤖 remplis le formulaire avec le texte ci-dessous ; 👤 enregistre une courte vidéo d'écran
   (autorisation, envoi en brouillon, arrivée dans la boîte de réception TikTok), l'ajoute et soumet.
   > Studio Fantôme is a small independent French media that publishes short educational videos about AI tools.
   > This app is an internal tool used only by our team, for our own TikTok account. Login Kit
   > (user.info.basic): we authorize our own account once and confirm which account is connected. Content Posting
   > API (video.upload): our pipeline sends each finished video as a draft to our own TikTok inbox; we review,
   > edit and publish it manually in the TikTok app. Display API (video.list): we read the view, like, comment and
   > share counts of our own videos to improve future content. We never access other users' data and share no data
   > with third parties. Privacy policy and terms of service are linked in the app details.
7. Une fois l'app acceptée : 👤 remplace dans `.env` les identifiants du sandbox par ceux de production, puis
   refais l'autorisation (étape 5, `auth tiktok`).

## 5 bis. Instagram Reels (15 min)

Suivre `docs/INSTALLATION.md` § 6 bis : 👤 compte professionnel **Créateur** (dans l'app Instagram) ; 🤖 app Meta sur
developers.facebook.com (cas d'usage Instagram, produit Instagram, connexion Instagram) ; 👤 *Ajouter un compte* avec
le compte de la chaîne, puis colle le jeton dans `.env` (`INSTAGRAM_ACCESS_TOKEN=`) ; 🤖 `npm run fm -- acces`
(Instagram « ok », compte créateur) puis `publication.instagram.actif` = `true` dans `config/chaine.json`.

## 6. Tout envoyer sur GitHub 🤖

`npm run fm -- secrets-github` envoie les secrets présents dans `.env` sans les afficher, puis liste ce qui manque.
Termine par `npm run fm -- acces`.

## 7. Identité dans le projet 🤖

- `config/chaine.json` : `handles` = le @ de chaque plateforme (actuellement YouTube `@PIlot-IA`, TikTok `@pilote.ia`,
  Instagram à compléter) et `nom` (« Studio Fantôme »). La vidéo affiche le @ seulement s'il est le même partout,
  sinon le nom : changer l'un ou l'autre impose de relancer le rendu des vidéos non publiées.
- Si TikTok n'est pas encore validé : `publication.tiktok.actif` = `false`. YouTube tourne seul en attendant ;
  remets `true` après la revue.
- Commit et push.

## 8. Activer la production 🤖 (avec l'accord 👤)

1. `gh workflow enable production.yml --repo JG-CO1/agent-ia-tiktok`, puis pareil pour `publication.yml` et
   `analytics.yml`.
2. Premier essai : `gh workflow run production.yml --repo JG-CO1/agent-ia-tiktok -f date=<AAAA-MM-JJ du lendemain>`,
   puis `gh run watch --repo JG-CO1/agent-ia-tiktok`. À la fin, une issue « 🎬 Revue » est créée par vidéo :
   👤 regarde l'aperçu YouTube privé et répond `/approuver`, `/rejeter <raison>` ou `/corriger <instructions>`.
3. Si une étape échoue, lis le journal de l'exécution, explique la cause et ne relance pas en boucle.

## 9. Fin

Fais le point avec le propriétaire : ce qui est en place, ce qui attend (revue TikTok, audit éventuel), et les
commandes utiles (`npm run fm -- acces`, `npm run fm -- secrets-github --verifier`). Les 3 vidéos du 14/11 ont une
voix de test : propose de les revoicer (`voix`, `rendu`, `qc`) et de les reprogrammer, ou de les laisser de côté.
