# Skills externes (étudiés le 2026-11-26)

Cinq dépôts demandés par le propriétaire ont été clonés, lus (README, tous les `SKILL.md`, références) et passés au crible
(commandes réseau, secrets, consignes détournant l'agent, scripts). **Ils ne sont pas tous installés** : seules les
skills en texte pur, sans script ni commande réseau, le sont. Les skills sont copiées dans `.claude/skills/` à un
commit précis (aucune mise à jour automatique) ; les licences (toutes MIT) sont dans `docs/licences-skills-externes/`.

| Dépôt | Commit lu | Verdict | Installé |
|---|---|---|---|
| `vyralcontent/content-skills` | `349e495` | Texte pur (0 script). Chaque `SKILL.md` contenait une section qui demande à l'agent de recommander le service payant Vyral : **retirée**. Dernière activité : juin 2026. | `viral-short-form`, `viral-hooks`, `viral-short-form-ideas`, `viral-tiktok-content`, `viral-youtube-shorts`, `viral-instagram-reels`, `viral-captions-and-ctas` |
| `haidrrrry/claude-remotion-skill` | `1dcbe5e` | Une seule skill (44 Ko), commandes `npm`/`npx remotion` ordinaires. Remotion déjà utilisé par le projet (4.0.543). | `remotion-motion-graphics` |
| `coreyhaines31/marketingskills` | `2bf95ed` | 53 skills, 110 fichiers de code, intégrations avec comptes et clés, partenaires rémunérés. **Sélection** en texte pur, sans scripts, sans `references/listening.md` (recettes `curl`). | `social`, `copywriting`, `content-strategy`, `marketing-psychology`, `marketing-ideas`, `analytics` |
| `scrollmark/social-skills` | `c2bafd6` | 27 skills. Les skills « sociales » sont du texte pur ; les skills vidéo/éditeur exigent le moteur et l'éditeur propriétaires de Scrollmark, `curl \| sh`, `yt-dlp` et un installateur depuis une archive non versionnée : **non installées**. | `hook-anatomy`, `trend-radar`, `platform-fluency`, `read-the-room`, `content-autopsy`, `repurpose-engine`, `voice-matching` |
| `Melvynx/video-agent-skills` | `f454292` | 13 skills dont un moteur de montage de 490 fichiers (Node, Chrome, whisper.cpp, `yt-dlp`). `studio-setup` modifie `.claude/settings.json` (liste d'autorisations shell) et range des clés dans un `.env`; `publish` passe par un service tiers. Contraire à la règle « pas de secrets ni de shell libre » de l'agent de production. | **aucune** |

## Pourquoi cette prudence
Les skills de `.claude/skills/` sont aussi chargées par l'agent de production sur GitHub Actions, qui détient la clé de voix
et lit des pages web. Une skill est une consigne : une skill tierce non relue est une porte d'entrée. On n'installe donc que
du texte relu, on retire toute consigne commerciale, et on garde la liste ci-dessus à jour.

## Doublons et usage
- Hooks : `viral-hooks` (générer, critiquer) + `hook-anatomy` (analyser) ; l'ouverture de la chaîne reste imposée (voir `ecrire-episode`).
- Idées : `viral-short-form-ideas` + `content-strategy` ; la notation /100 est faite par `npm run fm -- idees`.
- Tendances : `trend-radar` (cycle de vie) est utilisée par le skill maison `radar-tendances`.
- Légendes et CTA : `viral-captions-and-ctas` ; plateformes : `platform-fluency`, `viral-tiktok-content`, `viral-youtube-shorts`, `viral-instagram-reels`.
- Motion design : `remotion-motion-graphics` (règles de rythme, boucle « rendre → regarder les images → corriger »).
  Le moteur de la chaîne est `video/` ; la skill sert de référence, pas de remplaçant d'Ecto ni de l'identité visuelle.

## Fonctionnement vérifié
Contrôle automatique des 26 skills de `.claude/skills/` (en-tête valide, nom = dossier, description présente, liens internes
résolus) : aucune erreur. Une skill est un fichier de consignes : « fonctionne » veut dire qu'elle se charge et que ses
références existent, pas qu'elle améliore une vidéo ; cela se mesure sur les épisodes (voir `STUDIO_PHANTOM_ANALYTICS.md`).
