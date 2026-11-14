# Installation et comptes à créer

Ordre conseillé : **1 → 2 → 3 → 4** (la chaîne peut déjà produire des vidéos), puis **5 → 6** (publication).
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

1. Créer un dépôt (privé conseillé au départ) et y pousser ce projet.
   - **Public** : minutes GitHub Actions illimitées et machines 4 cœurs, mais tout le pipeline et les scripts
     à venir sont visibles avant publication.
   - **Privé** : 2 000 minutes/mois gratuites (machines 2 cœurs). Une vidéo de 45 s prend environ
     12–15 min de rendu sur 2 cœurs → ~1 200 min/mois pour 3 vidéos/jour : ça tient, mais sans marge.
2. *Settings → Actions → General → Workflow permissions* : **Read and write permissions**.
3. *Settings → General → Features* : Issues activées (c'est là que tu approuves les vidéos).
4. Les secrets se créent dans *Settings → Secrets and variables → Actions* :
   onglet **Secrets** pour les clés, onglet **Variables** pour les valeurs non secrètes.

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
4. *Identifiants → Créer → ID client OAuth → Application de bureau* : copier l'ID et le secret
   → secrets **`YOUTUBE_CLIENT_ID`** et **`YOUTUBE_CLIENT_SECRET`** (et dans `.env`).
5. Sur ton ordinateur : `npm run fm -- auth youtube`, ouvrir le lien, choisir **le compte/la chaîne** qui
   publiera (si c'est un compte de marque, le sélectionner), autoriser. Le jeton s'affiche dans le terminal
   → secret **`YOUTUBE_REFRESH_TOKEN`**.
6. Quotas (historique de révisions de l'API, 1er juin 2026) : 100 envois `videos.insert` par jour par défaut,
   largement suffisant. D'après la révision du 2 novembre 2026, les vidéos envoyées par un projet non audité
   ne sont plus bloquées en privé : le premier test le confirmera (le système vérifie l'état réel de chaque
   vidéo). Si une vidéo restait verrouillée en privé, demander l'audit via le formulaire
   « YouTube API Services – Audit and Quota Extension ».

## 6. TikTok (publication + statistiques)

1. developers.tiktok.com → se connecter avec le compte TikTok de la chaîne → *Manage apps → Connect an app*.
2. Renseigner : nom, icône, catégorie, description, **URL des conditions d'utilisation** et **de la politique
   de confidentialité** (obligatoires), plateforme **Web**. Des modèles sont fournis : `docs/conditions.html`
   et `docs/confidentialite.html` (compléter nom et e-mail), publiés avec GitHub Pages
   (*Settings → Pages → Deploy from a branch → main / docs*) ; Google demande aussi ces URL pour l'écran de
   consentement.
3. Ajouter les produits :
   - **Login Kit** : URL de redirection = la page `docs/tiktok-callback.html` publiée via GitHub Pages
     (*Settings → Pages → Deploy from branch → /docs*), ex. `https://<compte>.github.io/<depot>/tiktok-callback.html`.
   - **Content Posting API** : activer l'**envoi en brouillon (Upload)** ; la publication directe (Direct Post)
     est optionnelle.
4. Scopes : `user.info.basic`, `video.upload`, `video.list` (+ `video.publish` pour la publication directe).
5. Tester d'abord en **Sandbox** (comptes testeurs), puis soumettre l'app à la revue TikTok (décrire l'usage :
   « publier les vidéos de notre propre compte, en brouillon validé par nous », avec une courte vidéo de démo).
6. Autorisation : `npm run fm -- auth tiktok` → ouvrir le lien → copier le code affiché sur la page de retour →
   `npm run fm -- auth tiktok --code <CODE>`.
   Secrets : **`TIKTOK_CLIENT_KEY`**, **`TIKTOK_CLIENT_SECRET`**, **`TIKTOK_REFRESH_TOKEN`**, variable/secret
   **`TIKTOK_REDIRECT_URI`**, et **`FM_CLE_JETONS`** (phrase aléatoire longue, ex. `openssl rand -base64 32`)
   qui chiffre les jetons renouvelés par TikTok (`data/jetons/tiktok.json.enc`).
7. Modes (`config/chaine.json > publication.tiktok.mode`) :
   - `brouillon` (défaut) : la vidéo arrive dans ta boîte de réception TikTok, tu la publies depuis l'app
     (et tu peux y ajouter un son tendance). Max 5 brouillons en attente sur 24 h.
   - `direct` : publication sans passer par l'app. **Sans l'audit TikTok « Direct Post », seule la visibilité
     privée est autorisée** : n'activer ce mode qu'après l'audit.

## 7. Configuration de la chaîne

`config/chaine.json` : nom, @handle, promesse, créneaux (9 h / 13 h / 19 h, Europe/Paris), formats par créneau,
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
| GitHub Actions | 0 € (dépôt public) ; inclus dans 2 000 min (privé, à surveiller) |
| YouTube / TikTok API | 0 € |
| Remotion | 0 € pour une structure de 3 personnes maximum (licence entreprise au-delà) |
| Musique, effets, polices, personnage | 0 € (générés ou sous licence libre) |
