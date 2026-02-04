**Purgado de secretos (guía rápida y checklist)**

IMPORTANTE: Reescribir el historial es destructivo para forks/colaboradores. Coordina con el equipo.

Pasos resumidos:

1. Rotación inmediata (antes de reescribir historial)

- Rotar cualquier credencial encontrada (tokens JWT, Supabase service keys, Sentry DSN, AWS keys).
- Marcar/invalidar tokens en los servicios correspondientes.

2. Hacer backup completo del repo

- `git clone --mirror <repo-url> repo-mirror.git`

3. Ejecutar la purga en una copia espejo (recomendado)

- Ver `scripts/purge-secrets-git-filter-repo.sh` (bash) o `scripts/purge-secrets-windows.ps1` (PowerShell).
- Opcional: `scripts/purge-secrets-bfg.sh` para BFG.

4. Revisar resultado localmente

- Abrir el `repo-mirror` creado, revisar commits y archivos.
- Ejecutar `gitleaks` de nuevo sobre el mirror para validar.

5. Forzar `push` al remoto (solo después de coordinación)

- `git push --mirror --force origin`
- Informar al equipo para que hagan `git fetch` y vuelvan a clonar o rebase/realign sus ramas.

6. Post-limpieza

- Rotar claves nuevamente por precaución.
- Actualizar secrets en Secrets Manager / Vault.
- Ejecutar pipeline CI para asegurar que no quedan secretos.

Checklist de comunicación:

- Avisar fecha/hora del push forzado y qué ramas afectará.
- Pedir a colaboradores que:
  - Guarden cambios locales no comiteados.
  - Vuelvan a clonar el repo o ejecuten `git fetch --all && git reset --hard origin/main` en ramas de trabajo.

Notas técnicas:

- `git-filter-repo` es el método recomendado (más rápido y flexible que filter-branch).
- Reemplazar valores (no solo eliminar) puede ser útil si quieres mantener archivos pero sin valores sensibles — usa `--replace-text` con cuidado.

Soporte:

- Si quieres, puedo generar y adaptar el archivo `paths-to-remove.txt` con las rutas exactas detectadas por `gitleaks` en tu reporte.
