@echo off
REM Script de verificación pre-despliegue para Windows
REM Ejecuta: scripts\pre-deploy-check.bat

echo.
echo ========================================
echo 🔍 VERIFICANDO PROYECTO FULL VISION...
echo ========================================
echo.

set ERRORS=0
set WARNINGS=0

REM 1. Verificar .env
echo 1️⃣  Verificando archivo .env...
if exist .env (
    echo ✅ Archivo .env existe
    findstr /C:"VITE_SUPABASE_URL=" .env >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ VITE_SUPABASE_URL configurado
    ) else (
        echo ❌ VITE_SUPABASE_URL falta
        set /a ERRORS+=1
    )
    
    findstr /C:"VITE_SUPABASE_ANON_KEY=" .env >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ VITE_SUPABASE_ANON_KEY configurado
    ) else (
        echo ❌ VITE_SUPABASE_ANON_KEY falta
        set /a ERRORS+=1
    )
) else (
    echo ❌ Archivo .env NO EXISTE
    echo 💡 Copia .env.example a .env y configura tus variables
    set /a ERRORS+=1
)

echo.

REM 2. Verificar dependencias
echo 2️⃣  Verificando dependencias...
if exist node_modules (
    echo ✅ node_modules existe
) else (
    echo ⚠️  node_modules no existe
    echo 💡 Ejecuta: pnpm install
    set /a WARNINGS+=1
)

echo.

REM 3. Verificar estructura de carpetas
echo 3️⃣  Verificando estructura del proyecto...
if exist src (echo ✅ src existe) else (echo ❌ src falta && set /a ERRORS+=1)
if exist src\components (echo ✅ src\components existe) else (echo ❌ src\components falta && set /a ERRORS+=1)
if exist src\pages (echo ✅ src\pages existe) else (echo ❌ src\pages falta && set /a ERRORS+=1)
if exist src\services (echo ✅ src\services existe) else (echo ❌ src\services falta && set /a ERRORS+=1)
if exist database (echo ✅ database existe) else (echo ❌ database falta && set /a ERRORS+=1)
if exist public (echo ✅ public existe) else (echo ❌ public falta && set /a ERRORS+=1)

echo.

REM 4. Verificar archivos SQL
echo 4️⃣  Verificando scripts SQL...
if exist database\full_vision_schema.sql (echo ✅ full_vision_schema.sql existe) else (echo ⚠️  full_vision_schema.sql falta && set /a WARNINGS+=1)
if exist database\setup-supabase-security.sql (echo ✅ setup-supabase-security.sql existe) else (echo ⚠️  setup-supabase-security.sql falta && set /a WARNINGS+=1)
if exist database\add-ready-for-pickup-status.sql (echo ✅ add-ready-for-pickup-status.sql existe) else (echo ⚠️  add-ready-for-pickup-status.sql falta && set /a WARNINGS+=1)

echo.

REM 5. Verificar pnpm
echo 5️⃣  Verificando herramientas...
where pnpm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ pnpm está instalado
) else (
    echo ⚠️  pnpm no está instalado
    echo 💡 Instala pnpm: npm install -g pnpm
    set /a WARNINGS+=1
)

where vercel >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ vercel CLI está instalado
) else (
    echo ⚠️  vercel CLI no está instalado
    echo 💡 Instala vercel: npm install -g vercel
    set /a WARNINGS+=1
)

echo.
echo ========================================
echo 📊 RESUMEN DE VERIFICACIÓN
echo ========================================
echo.

if %ERRORS% EQU 0 (
    if %WARNINGS% EQU 0 (
        echo 🎉 ¡TODO ESTÁ LISTO PARA DESPLEGAR!
        echo.
        echo Próximos pasos:
        echo 1. Ejecuta las migraciones SQL en Supabase
        echo 2. Crea un usuario admin
        echo 3. Agrega productos desde /admin
        echo 4. Ejecuta: vercel --prod
    ) else (
        echo ⚠️  HAY %WARNINGS% ADVERTENCIA^(S^)
        echo.
        echo Puedes continuar, pero revisa las advertencias arriba.
    )
) else (
    echo ❌ HAY %ERRORS% ERROR^(ES^) Y %WARNINGS% ADVERTENCIA^(S^)
    echo.
    echo Debes corregir los errores antes de desplegar.
    echo Revisa los mensajes arriba para más detalles.
)

echo.
pause
