#!/usr/bin/env bash
# Enregistre l'état (épisodes, données) dans le dépôt, avec plusieurs tentatives en cas de course entre workflows.
set -euo pipefail
MSG="${1:-Mise à jour de l'état}"
git config user.name "studio-fantome[bot]"
git config user.email "studio-fantome-bot@users.noreply.github.com"
git add episodes data config 2>/dev/null || true
if git diff --cached --quiet; then echo "Rien à enregistrer"; exit 0; fi
git commit -q -m "$MSG"
for i in 1 2 3 4 5; do
  if git push -q; then echo "État enregistré"; exit 0; fi
  sleep $((i * 5)); git pull -q --rebase -X theirs || git pull -q --rebase
done
echo "Impossible d'enregistrer l'état" >&2; exit 1
