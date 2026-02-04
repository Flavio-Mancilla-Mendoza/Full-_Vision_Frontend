#!/bin/bash
# Script para instalar dependencias de Lambda y desplegar

echo "🚀 Instalando dependencias de Lambda Functions..."

# Post-confirmation function necesita AWS SDK
echo "📦 Instalando dependencias de post-confirmation..."
cd lambda/post-confirmation
npm install --production
cd ../..

echo "✅ Dependencias instaladas"
echo ""
echo "🔨 Compilando CDK..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Compilación exitosa"
    echo ""
    echo "🚀 Desplegando a AWS..."
    npm run deploy:dev
else
    echo "❌ Error en la compilación"
    exit 1
fi
