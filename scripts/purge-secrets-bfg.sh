#!/usr/bin/env bash
set -euo pipefail

# Alternativa rápida usando BFG Repo-Cleaner (más simple para eliminar archivos).
# Recomendado: usar en paralelo con rotación de credenciales.

if [ -z "${1-}" ]; then
  echo "Uso: $0 <repo-url>"
  exit 1
fi

REPO_URL="$1"
WORK_DIR="repo-bfg-$(date +%Y%m%d%H%M%S)"

echo "1) Clonando repo (no espejo)"
git clone "$REPO_URL" "$WORK_DIR"
cd "$WORK_DIR"

# Ejemplo: borrar todos los archivos .env.local y la carpeta dist/
java -jar bfg.jar --delete-files ".env.local" --delete-folders "dist" --no-blob-protection

# Limpieza final y push (FORCE)
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "Revisa cambios y luego fuerza push: git push --force"

echo "NOTA: Descarga bfg.jar desde https://rtyley.github.io/bfg-repo-cleaner/"
