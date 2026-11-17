# Installation et comptes à créer

## Le plus simple : Claude le fait avec ton navigateur

Sur ton ordinateur (macOS, Windows ou Linux ; pas WSL), avec Google Chrome, l'extension
[Claude in Chrome](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn), Claude Code et
un abonnement Claude (Pro, Max, Ultra, Team ou Enterprise) :

```bash
git clone https://github.com/JG-CO1/agent-ia-tiktok.git
cd agent-ia-tiktok
claude --chrome
```

Puis écris : **« Utilise le skill configurer-comptes »**. Claude ouvre les pages, remplit les formulaires et lance
les commandes. Il s'arrête pour ce qui te revient : paiements, mots de passe, codes 2FA, CAPTCHA, acceptation de
conditions, choix de la voix à l'oreille, et le collage de chaque clé dans `.env`. Les clés ne passent jamais par
la conversation : `npm run fm -- secrets-github` les envoie de `.env` vers GitHub sans les afficher.
Le détail de ce qu'il fait est dans `.claude/skills/configurer-comptes/SKILL.md` ; le reste de ce document décrit
les mêmes étapes à la main.

> Une session Claude Code **dans le cloud** (claude.ai/code) ne peut pas piloter ton Chrome : la connexion au
> navigateur passe par une session lancée sur ton ordinateur.

## Sans rien installer (navigateur uniquement)

Tout se fait sur github.com et sur les sites des services ; aucune clé ne passe par une conversation.

1. **Pages** : *Settings → Pages → Deploy from a branch → `main` / `/docs` → Save*.
2. **Secrets** (*Settings → Secrets and variables → Actions → New repository secret*), à coller depuis chaque service :
   | Secret | Où le trouver |
   |---|---|
   | `ELEVENLABS_API_KEY` | ElevenLabs → *API Keys* → *Create* : la valeur **`sk_…`**, affichée une seule fois (pas l'identifiant de la clé) |
   | `ANTHROPIC_API_KEY` | console.anthropic.com → *API Keys* (facturation à l'usage) ; ou `CLAUDE_CODE_OAUTH_TOKEN` via `claude setup-token`, qui demande Claude Code |
   | `YOUTUBE_CLIENT_SECRET` | Google Cloud → *Google Auth Platform → Clients* → client « Application de bureau » (étape 5) |
   | `TIKTOK_CLIENT_SECRET` | TikTok for Developers → ton app (étape 6) |

   Et dans l'onglet **Variables** (*New repository variable*), les identifiants **publics** : `YOUTUBE_CLIENT_ID`
   (se termine par `.apps.googleusercontent.com`) et `TIKTOK_CLIENT_KEY`. En secret, GitHub les masquerait
   (`client_id=***`) et le lien d'autorisation affiché serait cassé.
3. **Autoriser YouTube puis TikTok** avec le workflow *Actions → Autorisation (YouTube / TikTok) → Run workflow* :
   - lance-le avec le service et **sans code** : le lien d'autorisation apparaît dans le résumé de l'exécution ;
   - ouvre-le avec le compte de la chaîne et autorise ;
     - YouTube : le navigateur part ensuite vers `http://127.0.0.1:8765/?…code=…`, une page qui **ne s'ouvre pas, c'est
       normal** : copie l'adresse entière ;
     - TikTok : la page de retour affiche le code, avec un bouton pour le copier ;
   - relance le workflow avec le même service et colle l'adresse ou le code dans « code ». Le résumé indique le nom de
     la chaîne ou du compte autorisé. Les jetons sont chiffrés dans `data/jetons/` avec une clé dérivée du client
     secret (ou de `FM_CLE_JETONS` pour TikTok, s'il existe) : le code collé ne sert qu'une fois et ne vaut rien sans
     ce secret.
4. **Voix** : une session Claude Code dans le cloud peut chercher les voix, faire les essais et refaire les vidéos si
   la clé ElevenLabs y est enregistrée (formulaire sécurisé de l'environnement cloud).
5. **Activer** les workflows *Production quotidienne*, *Publication* et *Statistiques et apprentissage* (*Actions* →
   le workflow → *Enable workflow*), puis lancer une première *Production quotidienne* à la main.

> **Horaires.** Les déclenchements planifiés de GitHub peuvent partir avec des heures de retard (constaté : +8 h 30 les
> 16 et 17/11/2026). La *Production quotidienne* tourne donc **la veille vers 15 h pour le lendemain** (sans date
> saisie, elle produit pour demain), et la *Publication* passe **toutes les heures** : elle publie ce qui est dû et
> rattrape un passage manqué. YouTube ne dépend pas de ces horaires (programmation à l'approbation).

Ordre conseillé à la main : **1 → 2 → 3 → 4** (la chaîne peut déjà produire des vidéos), puis **5 → 6** (publication).
Compte rendu des coûts en fin de document.

---

## 1. Poste local (pour tester et pour les autorisations OAuth)

- Node.js 22+, Git, FFmpeg, hunspell + dictionnaire français, ImageMagick.
  - macOS : `brew install node ffmpeg hunspell imagemagick` puis le dictionnaire FR
    (par exemple `brew install --cask libreoffice` fournit fr_FR, ou télécharger `fr_FR.dic/.aff`
    dans `~/Library/Spelling`).
  - Ubuntu/Debian : `sudo apt-get install -y ffmpeg hunspell hunspell-fr imagemagick`
- Dans le dossier du projet :
  ```bash
  npm ci
  npx remotion browser ensure        # navigateur de rendu
  npx -y playwright@1 install chromium   # captures d'écran (facultatif)
  cp .env.example .env                # puis remplir au fur et à mesure (jamais committé)
  ```
- Vérifier : `npm run fm -- aide`, puis `npm run fm -- veille`.

## 2. Dépôt GitHub (orchestration, approbation, sauvegarde)

Dépôt : **https://github.com/JG-CO1/agent-ia-tiktok**, **public** (choix du 14/11/2026).
- Public : GitHub Actions est gratuit sur les machines standard des dépôts publics, et GitHub Pages est disponible
  en offre gratuite. En contrepartie, le code, les scripts des vidéos à venir et les issues de revue sont visibles
  par tous. Aucune clé n'est dans le dépôt, et seules tes réponses `/approuver`, `/rejeter` et `/corriger`
  (propriétaire du dépôt) déclenchent quelque chose.
- Pour mémoire, en privé : GitHub Pages n'est pas disponible avec l'offre gratuite, et les 2 000 minutes
  d'Actions par mois risquent de ne pas suffire. Estimation non mesurée : production de 3 vidéos (agent Claude +
  rendus sur 2 cœurs) et publications ≈ 1,5 h de machine par jour, soit environ 3 000 min par mois.

1. Les workflows déclarent eux-mêmes leurs permissions : rien à régler dans *Settings → Actions*.
2. *Settings → Pages* → *Deploy from a branch* → `main` / `/docs` → Save. Les pages publiques sont alors
   https://jg-co1.github.io/agent-ia-tiktok/confidentialite.html, `…/conditions.html` et
   `…/tiktok-callback.html` (adresse de retour TikTok).
3. Issues : activées par défaut (c'est là que tu approuves les vidéos).
4. Secrets : colle chaque clé dans ton `.env` local, puis `npm run fm -- secrets-github` les envoie sur GitHub par
   GitHub CLI (`gh auth login` une fois) sans les afficher. `npm run fm -- secrets-github --verifier` liste ce qui
   manque encore. À la main : *Settings → Secrets and variables → Actions*.
5. Les workflows planifiés (`production`, `publication`, `analytics`) sont **désactivés** tant que les secrets ne
   sont pas en place. Les réactiver ensuite : *Actions* → choisir le workflow → *Enable workflow*, ou
   `gh workflow enable production.yml` (et de même pour `publication.yml` et `analytics.yml`).

## 3. Claude (le cerveau : veille, écriture, vérification)

Au choix :
- **Abonnement Claude Pro / Max** (recommandé si tu l'as déjà) : sur ton ordinateur, avec Claude Code
  installé, lancer `claude setup-token`, suivre l'écran, copier le jeton → secret **`CLAUDE_CODE_OAUTH_TOKEN`**.
  La production quotidienne consomme ton quota d'utilisation (3 vidéos ≈ une longue session par jour).
- **Clé API** (facturation à l'usage) : Console Claude → *API Keys* → *Create Key* → secret
  **`ANTHROPIC_API_KEY`**. Ordre de grandeur : quelques dizaines de dollars par mois pour 90 vidéos
  (recherche + écriture + vérification), à surveiller dans la Console les premières semaines.

## 4. ElevenLabs (voix off française)

La voix fait la moitié de l'impression d'une vidéo : c'est le choix à faire **à l'oreille**, avant de lancer la
production. La voix locale utilisée dans les vidéos de démonstration est volontairement basique et non publiable.

> **Choix actuel (14/11/2026)** : « Hugo – Punchy French Creator » de la Voice Library (`3Tp5mYhT9wrfnry9pzvV`), modèle
> `eleven_v4`, offre Creator. Pour en changer : `npm run fm -- voix-bibliotheque --genre male --usage social_media`,
> `npm run fm -- voix-ajouter <public_owner_id> <voice_id>`, puis `essai-voix` (étape 6).

1. Créer un compte sur elevenlabs.io.
2. Choisir une offre **avec licence commerciale** (l'offre gratuite n'en a pas) :
   - *Starter* (~30 000 crédits/mois, environ 30 vidéos : 1 crédit ≈ 1 caractère, ~950 caractères par vidéo).
   - *Creator* (~100 000 crédits/mois) : nécessaire pour 3 vidéos/jour (≈ 85 000 caractères) + les régénérations.
   Vérifier les montants à jour sur elevenlabs.io/pricing.
   **Avec l'offre gratuite, les voix de la Voice Library ne sont pas utilisables par l'API** (aide ElevenLabs) :
   il faut au moins Starter pour comparer des voix avec l'outil ci-dessous.
3. *Voice Library* : filtrer *Language : French*, usage *Narration / Social media*, écouter les aperçus, retenir
   2 ou 3 voix vives et chaleureuses (Ecto = un expert passionné), les ajouter à « My Voices ».
4. *Profile → API Keys* : créer une clé (permission Text to Speech).
5. GitHub : secret **`ELEVENLABS_API_KEY`**, variable **`ELEVENLABS_VOICE_ID`** (et dans `.env` en local).
6. **Comparer et choisir** :
   ```bash
   npm run fm -- voix-infos        # modèles disponibles et identifiants de tes voix
   npm run fm -- essai-voix <id-episode> --voix <id1>,<id2>,<id3> --modeles eleven_v4,eleven_multilingual_v2
   ```
   Les fichiers à écouter sont dans `sorties/essais-voix/<épisode>/` (même traitement audio que la production,
   sur l'accroche et la scène suivante du vrai script). `eleven_v4` est le modèle le plus expressif d'après la
   documentation ElevenLabs ; `eleven_multilingual_v2` est le plus stable. Le rapport (`rapport.json`) indique pour
   chaque modèle s'il renvoie le **minutage mot à mot**, dont les sous-titres synchronisés dépendent : un modèle
   sans minutage ne peut pas être utilisé tel quel (le dire à Claude Code, une solution d'alignement existe).
   Coût d'un essai : environ 1 crédit par caractère (≈ 600 crédits par voix et par modèle).
7. Reporter le choix dans `config/chaine.json > voix` (`voice_id`, `modele`), régler au besoin la stabilité, le
   style et la vitesse, puis tester : `npm run fm -- voix <id>` et écouter `episodes/<id>/voix.wav`.
   Corriger les prononciations (sigles, mots anglais) dans `config/prononciation.json`.

## 5. YouTube (publication Shorts + statistiques)

1. console.cloud.google.com → créer un projet (ex. « studio-fantome »).
2. *APIs et services → Bibliothèque* : activer **YouTube Data API v3** et **YouTube Analytics API**.
3. *Écran de consentement OAuth* (Google Auth Platform) : type **Externe**, nom de l'app, e-mail.
   Ajouter les champs d'application `.../auth/youtube` et `.../auth/yt-analytics.readonly`.
   Ajouter ton compte Google en utilisateur test, puis **Publier l'application (« En production »)** :
   en mode « Test », le jeton de rafraîchissement expire au bout de 7 jours. Une app personnelle non vérifiée
   affiche un avertissement lors de l'autorisation (*Paramètres avancés → Continuer*) : c'est normal.
   URL demandées : accueil `https://jg-co1.github.io/agent-ia-tiktok/`, confidentialité `…/confidentialite.html`,
   conditions `…/conditions.html`. Ne pas ajouter de logo (Google exige alors une vérification de la marque).
4. *Clients → Créer un client → Application de bureau* : coller l'ID et le secret dans `.env`
   (**`YOUTUBE_CLIENT_ID`**, **`YOUTUBE_CLIENT_SECRET`**).
5. Sur ton ordinateur : `npm run fm -- auth youtube`, ouvrir le lien, choisir **le compte/la chaîne** qui
   publiera (si c'est un compte de marque, le sélectionner), autoriser. Le jeton est écrit dans `.env`
   (**`YOUTUBE_REFRESH_TOKEN`**) sans être affiché, et la commande indique le nom de la chaîne autorisée.
   Puis `npm run fm -- secrets-github` et `npm run fm -- acces` (YouTube « ok »).
6. Quotas (historique de révisions de l'API, 1er juin 2026) : 100 envois `videos.insert` par jour par défaut,
   largement suffisant. D'après la révision du 2 novembre 2026, les vidéos envoyées par un projet non audité
   ne sont plus bloquées en privé : le premier test le confirmera (le système vérifie l'état réel de chaque
   vidéo). Si une vidéo restait verrouillée en privé, demander l'audit via le formulaire
   « YouTube API Services – Audit and Quota Extension ».

## 6. TikTok (publication + statistiques)

1. developers.tiktok.com → se connecter avec le compte TikTok de la chaîne → *Manage apps → Connect an app*.
2. Renseigner : nom, icône (`docs/identite/avatar-1024.png`), catégorie, description, **URL des conditions
   d'utilisation** (`https://jg-co1.github.io/agent-ia-tiktok/conditions.html`) et **de la politique de
   confidentialité** (`…/confidentialite.html`), plateforme **Web** (site `https://jg-co1.github.io/agent-ia-tiktok/`).
   Si TikTok demande de prouver la propriété de l'URL, déposer son fichier de vérification dans `docs/` (publié par
   GitHub Pages).
3. Ajouter les produits :
   - **Login Kit** : URL de redirection `https://jg-co1.github.io/agent-ia-tiktok/tiktok-callback.html`.
   - **Display API** : fournit `video.list` (statistiques des vidéos) et `user.info.basic`.
   - **Content Posting API** : activer l'**envoi en brouillon (Upload)** ; la publication directe (Direct Post)
     est optionnelle.
4. Scopes : `user.info.basic`, `video.list`, `video.upload` (+ `video.publish` pour la publication directe : la
   commande d'autorisation ne le demande qu'en mode `direct` ou avec `--avec-direct`).
5. Tester d'abord en **Sandbox** (comptes testeurs) : autorisation, puis `npm run fm -- essai-tiktok <id-episode>`
   (envoi en brouillon, rien n'est publié). Ensuite, soumettre l'app à la revue TikTok (décrire l'usage : « envoyer
   les vidéos de notre propre compte en brouillon, publiées par nous », avec une courte vidéo de démo). Le texte
   proposé est dans le skill `configurer-comptes`.
6. Autorisation : `npm run fm -- auth tiktok` → ouvrir le lien → la page de retour affiche la commande à lancer
   (`npm run fm -- auth tiktok --code '…'`). Le jeton est écrit dans `.env` sans être affiché ; la commande indique
   le compte autorisé et les scopes accordés.
   Dans `.env` : **`TIKTOK_CLIENT_KEY`**, **`TIKTOK_CLIENT_SECRET`**, **`TIKTOK_REFRESH_TOKEN`** (écrit par la commande),
   **`TIKTOK_REDIRECT_URI`** (déjà renseignée dans `.env.example`), et **`FM_CLE_JETONS`**
   (`npm run fm -- secret-aleatoire FM_CLE_JETONS`), qui chiffre les jetons renouvelés par TikTok
   (`data/jetons/tiktok.json.enc`). Puis `npm run fm -- secrets-github`.
7. Modes (`config/chaine.json > publication.tiktok.mode`) :
   - `brouillon` (défaut) : la vidéo arrive dans ta boîte de réception TikTok, tu la publies depuis l'app
     (et tu peux y ajouter un son tendance). Max 5 brouillons en attente sur 24 h.
   - `direct` : publication sans passer par l'app. **Sans l'audit TikTok « Direct Post », seule la visibilité
     privée est autorisée** : n'activer ce mode qu'après l'audit.

## 6 bis. Instagram Reels (publication + statistiques)

D'après la documentation Meta (*Instagram Platform → Content Publishing*), la publication de Reels par l'API passe
par l'**API Instagram avec connexion Instagram** et exige un **compte professionnel**.

1. **Compte** (application Instagram, toi seul) : créer le compte de la chaîne (idéalement le même @ que sur TikTok
   et YouTube), photo `docs/identite/avatar-1024.png`, bio « Outils, astuces et actu Claude. Média indépendant, non
   affilié à Anthropic. », puis *Paramètres → Type de compte et outils → Passer à un compte professionnel →
   **Créateur***.
2. **App Meta** : developers.facebook.com → *Mes apps → Créer une app* → choisir le cas d'usage Instagram (API avec
   connexion Instagram) → produit **Instagram** → *Configuration de l'API avec la connexion Instagram*. URL de
   politique de confidentialité si elle est demandée : `https://jg-co1.github.io/agent-ia-tiktok/confidentialite.html`.
3. *Générer des jetons d'accès → Ajouter un compte* : se connecter avec le compte Instagram de la chaîne. Si Meta le
   demande, ajouter d'abord ce compte comme **testeur Instagram** (*Rôles de l'app*) et accepter l'invitation dans
   Instagram (*Paramètres → Applications et sites web*). Permissions : `instagram_business_basic`,
   `instagram_business_content_publish`, `instagram_business_manage_insights`.
4. Copier le jeton dans le secret GitHub **`INSTAGRAM_ACCESS_TOKEN`**. Il dure 60 jours ; le workflow de
   publication le renouvelle au-delà de 7 jours d'âge et le garde chiffré dans `data/jetons/instagram.json.enc`.
5. L'app ne sert qu'au compte de la chaîne (qui a un rôle sur l'app) : en principe, pas d'examen Meta à demander,
   à confirmer au premier essai.
6. `config/chaine.json > publication.instagram.actif` = `true`. À chaque créneau, le workflow *Publication* crée
   une variante au son AAC 128 kb/s (spécification Reels de Meta), la dépose dans la Release publique du dépôt,
   laisse Instagram la télécharger, attend la fin du traitement, puis publie le Reel. Le lien est commenté dans
   l'issue de revue. Un épisode n'est jamais publié deux fois (le conteneur est mémorisé avant publication).

## 7. Configuration de la chaîne

`config/chaine.json` : nom, @ par plateforme (`handles` ; la vidéo affiche le @ s'il est le même partout, sinon le
nom), promesse, créneaux (9 h / 13 h / 19 h, Europe/Paris), formats par créneau,
durées, voix, musique, mode de publication (`approbation` puis `autonome` quand tout est fiable).

## 8. Premier essai complet

1. Local : `claude` dans le dossier du projet, puis « Utilise le skill produire-journee pour demain ».
2. GitHub : *Actions → Production quotidienne → Run workflow*. À la fin, une issue « 🎬 Revue » par vidéo :
   regarder l'aperçu privé YouTube, lire le script et les sources, puis commenter `/approuver`, `/rejeter …`
   ou `/corriger …`.
3. Au créneau, *Publication* envoie TikTok et vérifie YouTube ; chaque résultat est commenté dans l'issue.
4. Le lendemain matin, *Statistiques et apprentissage* collecte les chiffres ; le lundi, bilan hebdomadaire.

## 9. Si tu utilises Claude Code dans le cloud (claude.ai/code)

L'environnement doit autoriser ces hôtes : `api.elevenlabs.io`, `open.tiktokapis.com`, `hn.algolia.com`,
`github.githubassets.com` (captures GitHub stylées), en plus de GitHub et des API Google déjà accessibles.

## Coûts mensuels indicatifs (3 vidéos/jour)

| Poste | Coût |
|---|---|
| ElevenLabs (Creator) | ~22 $ |
| Claude | inclus dans un abonnement existant, ou clé API à l'usage |
| GitHub Actions | 0 € (dépôt public, machines standard) |
| YouTube / TikTok API | 0 € |
| Remotion | 0 € pour une structure de 3 personnes maximum (licence entreprise au-delà) |
| Musique, effets, polices, personnage | 0 € (générés ou sous licence libre) |
