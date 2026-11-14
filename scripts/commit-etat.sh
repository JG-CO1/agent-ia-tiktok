#!/usr/bin/env bash
# Enregistre l'état (épisodes, données) dans le dépôt, avec plusieurs tentatives en cas de course entre workflows.
set -euo pipefail
# (pas d'apostrophe dans ${1:-…} : bash la prend pour un guillemet et le script ne se lance plus)
MSG="${1:-}"
[ -n "$MSG" ] || MSG="Mise à jour de l'état"
# Identité officielle des commits faits avec le GITHUB_TOKEN (aucune adresse personnelle).
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
# Dossier par dossier : un dossier absent ne doit pas empêcher d'enregistrer les autres.
for p in episodes data config; do [ -e "$p" ] && git add -A -- "$p"; done
if git diff --cached --quiet; then echo "Rien à enregistrer"; exit 0; fi
git commit -q -m "$MSG"
for i in 1 2 3 4 5; do
  if git push -q; then echo "État enregistré"; exit 0; fi
  sleep $((i * 5)); git pull -q --rebase -X theirs || git pull -q --rebase
done
echo "Impossible d'enregistrer l'état" >&2; exit 1
