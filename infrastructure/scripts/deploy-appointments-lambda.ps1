# ================================================================
# Deploy Appointments Lambda to AWS
# ================================================================
# Este script despliega el Lambda de appointments directamente usando AWS CLI
# sin necesidad de CDK (para evitar recrear el API Gateway existente)
#
# Prerrequisitos:
# 1. AWS CLI instalado y configurado
# 2. Variables de entorno configuradas en .env.dev
# ================================================================

param(
    [string]$Environment = "dev",
    [string]$Region = "sa-east-1"
)

$ErrorActionPreference = "Stop"

# Configuración
$LambdaName = "full-vision-appointments-$Environment"
$LambdaDir = "$PSScriptRoot\..\lambda\appointments"
$ZipFile = "$PSScriptRoot\..\lambda-appointments.zip"

Write-Host "🚀 Deploying Lambda: $LambdaName" -ForegroundColor Cyan
Write-Host "📁 Source Directory: $LambdaDir" -ForegroundColor Gray

# 1. Verificar que el directorio existe
if (-not (Test-Path $LambdaDir)) {
    Write-Host "❌ Error: Lambda directory not found: $LambdaDir" -ForegroundColor Red
    exit 1
}

# 2. Verificar dependencias instaladas
$NodeModules = Join-Path $LambdaDir "node_modules"

if (-not (Test-Path $NodeModules)) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    Push-Location $LambdaDir
    npm install --omit=dev
    Pop-Location
}

# 3. Crear ZIP para deployment
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow

# Eliminar ZIP anterior si existe
if (Test-Path $ZipFile) {
    Remove-Item $ZipFile -Force
}

# Crear ZIP con el contenido del directorio
Push-Location $LambdaDir
Compress-Archive -Path * -DestinationPath $ZipFile -Force
Pop-Location

Write-Host "✅ Package created: $ZipFile" -ForegroundColor Green

# 4. Verificar si el Lambda existe
$LambdaExists = $false
try {
    aws lambda get-function --function-name $LambdaName --region $Region 2>$null | Out-Null
    $LambdaExists = $true
    Write-Host "📝 Lambda exists, will update code..." -ForegroundColor Yellow
} catch {
    Write-Host "📝 Lambda does not exist, will create..." -ForegroundColor Yellow
}

# 5. Cargar variables de entorno desde .env.dev
$EnvFile = "$PSScriptRoot\..\.env.$Environment"
if (Test-Path $EnvFile) {
    Write-Host "📄 Loading environment from: $EnvFile" -ForegroundColor Gray
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value)
        }
    }
} else {
    Write-Host "⚠️  No .env.$Environment file found. Using environment variables." -ForegroundColor Yellow
}

$SupabaseUrl = $env:SUPABASE_URL
$SupabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SupabaseUrl -or -not $SupabaseKey) {
    Write-Host "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create a .env.$Environment file with:" -ForegroundColor Yellow
    Write-Host "SUPABASE_URL=https://your-project.supabase.co" -ForegroundColor Gray
    Write-Host "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" -ForegroundColor Gray
    exit 1
}

# 6. Crear o actualizar Lambda
if ($LambdaExists) {
    # Actualizar código
    Write-Host "🔄 Updating Lambda code..." -ForegroundColor Cyan
    aws lambda update-function-code `
        --function-name $LambdaName `
        --zip-file "fileb://$ZipFile" `
        --region $Region

    # Esperar a que termine la actualización
    Write-Host "⏳ Waiting for update to complete..." -ForegroundColor Gray
    aws lambda wait function-updated --function-name $LambdaName --region $Region

    # Actualizar variables de entorno
    Write-Host "🔄 Updating environment variables..." -ForegroundColor Cyan
    aws lambda update-function-configuration `
        --function-name $LambdaName `
        --environment "Variables={NODE_ENV=$Environment,SUPABASE_URL=$SupabaseUrl,SUPABASE_SERVICE_ROLE_KEY=$SupabaseKey}" `
        --region $Region
} else {
    # Crear Lambda nuevo
    Write-Host "➕ Creating new Lambda function..." -ForegroundColor Cyan
    
    # Necesitamos un rol de ejecución
    $RoleName = "full-vision-lambda-appointments-role-$Environment"
    
    # Crear rol si no existe
    $TrustPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
"@
    
    try {
        aws iam get-role --role-name $RoleName 2>$null | Out-Null
        Write-Host "📝 IAM Role exists: $RoleName" -ForegroundColor Gray
    } catch {
        Write-Host "➕ Creating IAM Role: $RoleName" -ForegroundColor Yellow
        aws iam create-role `
            --role-name $RoleName `
            --assume-role-policy-document $TrustPolicy
        
        # Adjuntar política básica de logs
        aws iam attach-role-policy `
            --role-name $RoleName `
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        
        # Esperar a que el rol se propague
        Start-Sleep -Seconds 10
    }
    
    $RoleArn = (aws iam get-role --role-name $RoleName --query 'Role.Arn' --output text)
    
    # Crear función Lambda
    aws lambda create-function `
        --function-name $LambdaName `
        --runtime nodejs20.x `
        --handler index.handler `
        --role $RoleArn `
        --zip-file "fileb://$ZipFile" `
        --timeout 30 `
        --memory-size 512 `
        --environment "Variables={NODE_ENV=$Environment,SUPABASE_URL=$SupabaseUrl,SUPABASE_SERVICE_ROLE_KEY=$SupabaseKey}" `
        --region $Region `
        --description "Full Vision - Appointments and Locations API Handler"
}

# 7. Limpiar
Remove-Item $ZipFile -Force
Write-Host "🧹 Cleaned up temporary files" -ForegroundColor Gray

# 8. Output información
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "✅ Lambda deployed successfully!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "Lambda ARN:" -ForegroundColor Cyan
$LambdaArn = aws lambda get-function --function-name $LambdaName --region $Region --query 'Configuration.FunctionArn' --output text
Write-Host "  $LambdaArn" -ForegroundColor White
Write-Host ""
Write-Host "📌 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Go to AWS API Gateway Console" -ForegroundColor White
Write-Host "  2. Select API: slrrvl1zs2" -ForegroundColor White
Write-Host "  3. Add the following routes pointing to this Lambda:" -ForegroundColor White
Write-Host ""
Write-Host "  Public routes (no auth):" -ForegroundColor Cyan
Write-Host "    GET /public/locations" -ForegroundColor Gray
Write-Host ""
Write-Host "  Protected routes (Cognito auth):" -ForegroundColor Cyan
Write-Host "    GET  /locations" -ForegroundColor Gray
Write-Host "    POST /locations" -ForegroundColor Gray
Write-Host "    GET  /locations/{id}" -ForegroundColor Gray
Write-Host "    PUT  /locations/{id}" -ForegroundColor Gray
Write-Host "    DELETE /locations/{id}" -ForegroundColor Gray
Write-Host ""
Write-Host "    GET  /appointments" -ForegroundColor Gray
Write-Host "    POST /appointments" -ForegroundColor Gray
Write-Host "    GET  /appointments/user" -ForegroundColor Gray
Write-Host "    PUT  /appointments/{id}" -ForegroundColor Gray
Write-Host ""
