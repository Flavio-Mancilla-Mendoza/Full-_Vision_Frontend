@echo off
REM ================================================================
REM Full Vision - AWS Infrastructure Deployment Script (Windows)
REM ================================================================

echo.
echo ================================================================
echo   Full Vision - AWS Infrastructure Deployment
echo ================================================================
echo.

REM Verificar si se especificó un ambiente
if "%1"=="" (
    echo ❌ Error: Debe especificar un ambiente
    echo.
    echo Uso: deploy.bat ^<environment^>
    echo.
    echo Ambientes disponibles:
    echo   - dev: Ambiente de desarrollo
    echo   - staging: Ambiente de pre-producción
    echo   - prod: Ambiente de producción
    echo.
    echo Ejemplo: deploy.bat dev
    exit /b 1
)

set ENVIRONMENT=%1

echo 🚀 Iniciando deploy para ambiente: %ENVIRONMENT%
echo.

REM Verificar que existe el archivo de configuración
set ENV_FILE=.env.%ENVIRONMENT%
if not exist "%ENV_FILE%" (
    echo ❌ Error: Archivo de configuración no encontrado: %ENV_FILE%
    echo.
    echo Crea el archivo %ENV_FILE% basándote en .env.example
    echo.
    exit /b 1
)

echo ✅ Archivo de configuración encontrado: %ENV_FILE%

REM Cargar variables de entorno
for /f "delims== tokens=1,2" %%i in ('type "%ENV_FILE%" ^| findstr /v "^#" ^| findstr "="') do (
    set "%%i=%%j"
)

echo ✅ Variables de entorno cargadas
echo.

REM Verificar configuración AWS
echo 🔧 Verificando configuración AWS...

if "%AWS_ACCOUNT%"=="" (
    echo ❌ Error: AWS_ACCOUNT no está configurado
    exit /b 1
)

if "%AWS_REGION%"=="" (
    echo ❌ Error: AWS_REGION no está configurado
    exit /b 1
)

echo ✅ AWS Account: %AWS_ACCOUNT%
echo ✅ AWS Region: %AWS_REGION%
echo.

REM Verificar AWS CLI
aws --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: AWS CLI no está instalado o no está en el PATH
    echo.
    echo Instala AWS CLI desde: https://aws.amazon.com/cli/
    exit /b 1
)

echo ✅ AWS CLI disponible
echo.

REM Verificar credenciales AWS
echo 🔐 Verificando credenciales AWS...
aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: No hay credenciales AWS configuradas
    echo.
    echo Configura tus credenciales con: aws configure
    exit /b 1
)

echo ✅ Credenciales AWS verificadas
echo.

REM Instalar dependencias si es necesario
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo ❌ Error: Fallo al instalar dependencias
        exit /b 1
    )
    echo ✅ Dependencias instaladas
) else (
    echo ✅ Dependencias ya instaladas
)
echo.

REM Bootstrap CDK si es necesario (solo primera vez)
echo 🔄 Verificando CDK Bootstrap...
aws cloudformation describe-stacks --stack-name CDKToolkit --region %AWS_REGION% >nul 2>&1
if errorlevel 1 (
    echo 🚀 CDK no está bootstrapped, ejecutando bootstrap...
    npx cdk bootstrap aws://%AWS_ACCOUNT%/%AWS_REGION%
    if errorlevel 1 (
        echo ❌ Error: Fallo al hacer bootstrap de CDK
        exit /b 1
    )
    echo ✅ CDK Bootstrap completado
) else (
    echo ✅ CDK ya está bootstrapped
)
echo.

REM Sintetizar templates
echo 🔨 Sintetizando templates CDK...
set CDK_ENVIRONMENT=%ENVIRONMENT%
npx cdk synth
if errorlevel 1 (
    echo ❌ Error: Fallo al sintetizar templates CDK
    exit /b 1
)
echo ✅ Templates sintetizados exitosamente
echo.

REM Deploy
echo 🚀 Iniciando deploy de infraestructura...
set CDK_ENVIRONMENT=%ENVIRONMENT%
npx cdk deploy --all --require-approval never
if errorlevel 1 (
    echo ❌ Error: Fallo el deploy de infraestructura
    exit /b 1
)

echo.
echo ================================================================
echo   ✅ DEPLOY COMPLETADO EXITOSAMENTE
echo ================================================================
echo.
echo 🎉 La infraestructura para el ambiente '%ENVIRONMENT%' ha sido desplegada!
echo.
echo 📋 Próximos pasos:
echo   1. Revisa las outputs del stack en la consola de CloudFormation
echo   2. Configura el frontend con las variables de salida
echo   3. Ejecuta las migraciones de base de datos
echo   4. Configura los usuarios iniciales en Cognito
echo.
echo 🔗 Enlaces útiles:
echo   - CloudFormation: https://console.aws.amazon.com/cloudformation/home?region=%AWS_REGION%
echo   - RDS: https://console.aws.amazon.com/rds/home?region=%AWS_REGION%
echo   - Cognito: https://console.aws.amazon.com/cognito/home?region=%AWS_REGION%
echo   - S3: https://console.aws.amazon.com/s3/home?region=%AWS_REGION%
echo   - CloudFront: https://console.aws.amazon.com/cloudfront/home
echo.

pause