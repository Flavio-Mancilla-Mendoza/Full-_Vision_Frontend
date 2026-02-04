#!/bin/bash

# ================================================================
# Full Vision - AWS Infrastructure Deployment Script (Unix/Linux/macOS)
# ================================================================

set -e  # Exit on any error

echo ""
echo "================================================================"
echo "   Full Vision - AWS Infrastructure Deployment"
echo "================================================================"
echo ""

# Verificar si se especificó un ambiente
if [ -z "$1" ]; then
    echo "❌ Error: Debe especificar un ambiente"
    echo ""
    echo "Uso: ./deploy.sh <environment>"
    echo ""
    echo "Ambientes disponibles:"
    echo "  - dev: Ambiente de desarrollo"
    echo "  - staging: Ambiente de pre-producción"
    echo "  - prod: Ambiente de producción"
    echo ""
    echo "Ejemplo: ./deploy.sh dev"
    exit 1
fi

ENVIRONMENT=$1

echo "🚀 Iniciando deploy para ambiente: $ENVIRONMENT"
echo ""

# Verificar que existe el archivo de configuración
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Archivo de configuración no encontrado: $ENV_FILE"
    echo ""
    echo "Crea el archivo $ENV_FILE basándote en .env.example"
    echo ""
    exit 1
fi

echo "✅ Archivo de configuración encontrado: $ENV_FILE"

# Cargar variables de entorno
set -a  # automatically export all variables
source "$ENV_FILE"
set +a

echo "✅ Variables de entorno cargadas"
echo ""

# Verificar configuración AWS
echo "🔧 Verificando configuración AWS..."

if [ -z "$AWS_ACCOUNT" ]; then
    echo "❌ Error: AWS_ACCOUNT no está configurado"
    exit 1
fi

if [ -z "$AWS_REGION" ]; then
    echo "❌ Error: AWS_REGION no está configurado"
    exit 1
fi

echo "✅ AWS Account: $AWS_ACCOUNT"
echo "✅ AWS Region: $AWS_REGION"
echo ""

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI no está instalado"
    echo ""
    echo "Instala AWS CLI desde: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ AWS CLI disponible"
echo ""

# Verificar credenciales AWS
echo "🔐 Verificando credenciales AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: No hay credenciales AWS configuradas"
    echo ""
    echo "Configura tus credenciales con: aws configure"
    exit 1
fi

echo "✅ Credenciales AWS verificadas"
echo ""

# Verificar Node.js y npm
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo ""
    echo "Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js disponible: $(node --version)"
echo ""

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo "✅ Dependencias instaladas"
else
    echo "✅ Dependencias ya instaladas"
fi
echo ""

# Bootstrap CDK si es necesario (solo primera vez)
echo "🔄 Verificando CDK Bootstrap..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region "$AWS_REGION" &> /dev/null; then
    echo "🚀 CDK no está bootstrapped, ejecutando bootstrap..."
    npx cdk bootstrap "aws://$AWS_ACCOUNT/$AWS_REGION"
    echo "✅ CDK Bootstrap completado"
else
    echo "✅ CDK ya está bootstrapped"
fi
echo ""

# Sintetizar templates
echo "🔨 Sintetizando templates CDK..."
export CDK_ENVIRONMENT="$ENVIRONMENT"
npx cdk synth
echo "✅ Templates sintetizados exitosamente"
echo ""

# Deploy
echo "🚀 Iniciando deploy de infraestructura..."
export CDK_ENVIRONMENT="$ENVIRONMENT"
npx cdk deploy --all --require-approval never

echo ""
echo "================================================================"
echo "   ✅ DEPLOY COMPLETADO EXITOSAMENTE"
echo "================================================================"
echo ""
echo "🎉 La infraestructura para el ambiente '$ENVIRONMENT' ha sido desplegada!"
echo ""
echo "📋 Próximos pasos:"
echo "  1. Revisa las outputs del stack en la consola de CloudFormation"
echo "  2. Configura el frontend con las variables de salida"
echo "  3. Ejecuta las migraciones de base de datos"
echo "  4. Configura los usuarios iniciales en Cognito"
echo ""
echo "🔗 Enlaces útiles:"
echo "  - CloudFormation: https://console.aws.amazon.com/cloudformation/home?region=$AWS_REGION"
echo "  - RDS: https://console.aws.amazon.com/rds/home?region=$AWS_REGION"
echo "  - Cognito: https://console.aws.amazon.com/cognito/home?region=$AWS_REGION"
echo "  - S3: https://console.aws.amazon.com/s3/home?region=$AWS_REGION"
echo "  - CloudFront: https://console.aws.amazon.com/cloudfront/home"
echo ""