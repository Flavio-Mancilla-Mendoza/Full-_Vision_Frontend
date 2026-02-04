#!/usr/bin/env bash
set -euo pipefail

# Script para purgar secretos del historial usando git-filter-repo
# 1) Hacer backup: clonar espejo
# 2) Ejecutar git-filter-repo para eliminar rutas específicas y/o reemplazar texto
# 3) Push --force al remoto (coordinar con equipo)

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "ERROR: git-filter-repo no está instalado. Instálalo: pip install git-filter-repo"
  exit 1
fi

if [ -z "${1-}" ]; then
  echo "Uso: $0 <repo-url>"
  exit 1
fi

REPO_URL="$1"
MIRROR_DIR="repo-mirror-$(date +%Y%m%d%H%M%S)"

echo "1) Clonando espejo del repositorio (backup)..."
git clone --mirror "$REPO_URL" "$MIRROR_DIR"
cd "$MIRROR_DIR"

# Rutas a eliminar del historial. Añade o quita según el reporte de gitleaks.
# Ejemplos detectados: .env.local, dist/ y archivos concretos en supabase/ y docs/ que contienen tokens.
cat > paths-to-remove.txt <<'PATHS'
.env.local
dist/
supabase/test-functions.sh
docs/IMAGE_UPLOAD_S3_FLOW.md
COMANDOS_RAPIDOS.md
supabase/functions/README.md
PATHS

echo "2) Ejecutando git-filter-repo para eliminar rutas listadas..."
# --force para evitar prompt
git filter-repo --invert-paths --paths-from-file paths-to-remove.txt --force

# Opcional: reemplazar tokens JWT visibles u otros secretos por placeholders
# Crea un archivo de reemplazos con formato: literal or regex -> replacement
# Formato de ejemplo para reemplazos (NO regex por defecto, ver documentación):
cat > replace.txt <<'REPL'
# Replace exact JWT (ejemplo) with placeholder
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS... => [REDACTED_JWT]
REPL

# Para aplicar replace-text:
# git filter-repo --replace-text replace.txt --force
# NOTA: Usar replace-text con cuidado: asegúrate de que las claves listadas coincidan con exactitud.

echo "3) Revisar el repo filtrado y luego forzar push al remoto. Esto REESCRIBIRÁ el historial.
    Coordiná con el equipo antes de hacer push --force.
"

echo "Para forzar el push (ejecutar sólo después de coordinar):"
echo "  git remote add origin <remote-url> || true"
echo "  git push --mirror --force origin"

echo "Hecho. Revisa $MIRROR_DIR localmente antes de forzar el push." 
