# PowerShell script para preparar limpieza de secretos con git-filter-repo en Windows
param(
    [Parameter(Mandatory = $true)][string]$RepoUrl
)

if (-not (Get-Command git-filter-repo -ErrorAction SilentlyContinue)) {
    Write-Error "git-filter-repo no encontrado. Instale con: pip install git-filter-repo"
    exit 1
}

$mirror = "repo-mirror-$(Get-Date -Format yyyyMMddHHmmss)"
Write-Output "Clonando espejo..."
git clone --mirror $RepoUrl $mirror
Set-Location $mirror

@"
.env.local
 dist/
 supabase/test-functions.sh
 docs/IMAGE_UPLOAD_S3_FLOW.md
 COMANDOS_RAPIDOS.md
 supabase/functions/README.md
"@ | Out-File paths-to-remove.txt -Encoding utf8

Write-Output "Ejecutando git-filter-repo (invert paths)..."
git filter-repo --invert-paths --paths-from-file paths-to-remove.txt --force

Write-Output "Repositorio filtrado en $mirror. Verificalo antes de forzar push."
Write-Output "Para forzar push: git push --mirror --force origin"
