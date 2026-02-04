@echo off
REM Script para instalar dependencias de Lambda y desplegar (Windows)

echo 🚀 Instalando dependencias de Lambda Functions...
echo.

REM Post-confirmation function necesita AWS SDK
echo 📦 Instalando dependencias de post-confirmation...
cd lambda\post-confirmation
call npm install --production
cd ..\..

echo.
echo ✅ Dependencias instaladas
echo.
echo 🔨 Compilando CDK...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo ✅ Compilación exitosa
    echo.
    echo 🚀 Desplegando a AWS...
    call npm run deploy:dev
) else (
    echo ❌ Error en la compilación
    exit /b 1
)
