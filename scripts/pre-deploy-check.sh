#!/bin/bash

# Script de verificación pre-despliegue
# Ejecuta: bash scripts/pre-deploy-check.sh

echo "🔍 VERIFICANDO PROYECTO FULL VISION..."
echo "======================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Verificar .env
echo "1️⃣  Verificando archivo .env..."
if [ -f .env ]; then
    echo -e "${GREEN}✅ Archivo .env existe${NC}"
    
    if grep -q "VITE_SUPABASE_URL=" .env; then
        if grep -q "VITE_SUPABASE_URL=https://" .env; then
            echo -e "${GREEN}✅ VITE_SUPABASE_URL configurado${NC}"
        else
            echo -e "${RED}❌ VITE_SUPABASE_URL no tiene una URL válida${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}❌ VITE_SUPABASE_URL falta${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY=" .env; then
        if grep -q "VITE_SUPABASE_ANON_KEY=eyJ" .env; then
            echo -e "${GREEN}✅ VITE_SUPABASE_ANON_KEY configurado${NC}"
        else
            echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY no tiene un valor válido${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY falta${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ Archivo .env NO EXISTE${NC}"
    echo -e "${YELLOW}💡 Copia .env.example a .env y configura tus variables${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 2. Verificar dependencias
echo "2️⃣  Verificando dependencias..."
if [ -d node_modules ]; then
    echo -e "${GREEN}✅ node_modules existe${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules no existe${NC}"
    echo -e "${YELLOW}💡 Ejecuta: pnpm install${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# 3. Verificar estructura de carpetas importantes
echo "3️⃣  Verificando estructura del proyecto..."

REQUIRED_DIRS=("src" "src/components" "src/pages" "src/services" "database" "public")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ $dir existe${NC}"
    else
        echo -e "${RED}❌ $dir falta${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# 4. Verificar archivos SQL importantes
echo "4️⃣  Verificando scripts SQL..."

SQL_FILES=(
    "database/full_vision_schema.sql"
    "database/setup-supabase-security.sql"
    "database/add-ready-for-pickup-status.sql"
)

for file in "${SQL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file existe${NC}"
    else
        echo -e "${YELLOW}⚠️  $file falta${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo ""

# 5. Intentar build
echo "5️⃣  Intentando construir el proyecto..."
if command -v pnpm &> /dev/null; then
    echo "Ejecutando pnpm build..."
    if pnpm build > /tmp/build.log 2>&1; then
        echo -e "${GREEN}✅ Build exitoso${NC}"
    else
        echo -e "${RED}❌ Build falló${NC}"
        echo -e "${YELLOW}💡 Ver errores en: /tmp/build.log${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  pnpm no está instalado${NC}"
    echo -e "${YELLOW}💡 Instala pnpm: npm install -g pnpm${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "======================================"
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "======================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡TODO ESTÁ LISTO PARA DESPLEGAR!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Ejecuta las migraciones SQL en Supabase"
    echo "2. Crea un usuario admin"
    echo "3. Agrega productos desde /admin"
    echo "4. Ejecuta: vercel --prod"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  HAY $WARNINGS ADVERTENCIA(S)${NC}"
    echo ""
    echo "Puedes continuar, pero revisa las advertencias arriba."
    exit 0
else
    echo -e "${RED}❌ HAY $ERRORS ERROR(ES) Y $WARNINGS ADVERTENCIA(S)${NC}"
    echo ""
    echo "Debes corregir los errores antes de desplegar."
    echo "Revisa los mensajes arriba para más detalles."
    exit 1
fi
