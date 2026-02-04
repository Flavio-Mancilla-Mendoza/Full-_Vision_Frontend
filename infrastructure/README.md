# 🏗️ Full Vision - Infraestructura AWS (Semana 1)

Infraestructura como código (IaC) usando AWS CDK para Full Vision Óptica.

## 📁 Estructura del Proyecto

```
infrastructure/
├── bin/
│   └── infrastructure.ts          # Punto de entrada principal
├── lib/
│   ├── config.ts                 # Configuraciones por ambiente
│   └── full-vision-infrastructure-stack.ts  # Stack principal
├── scripts/
│   ├── deploy.sh                 # Script de deploy (Unix/Linux/macOS)
│   └── deploy.bat                # Script de deploy (Windows)
├── .env.example                  # Ejemplo de variables de entorno
├── .env.dev                      # Variables para desarrollo
├── cdk.json                      # Configuración CDK
├── package.json                  # Dependencias
└── tsconfig.json                 # Configuración TypeScript
```

## 🌟 Arquitectura Implementada

### **Semana 1: Infraestructura Base**

- ✅ **VPC**: Red privada virtual con subnets públicas y privadas
- ✅ **RDS PostgreSQL**: Base de datos principal con backups automáticos
- ✅ **Amazon Cognito**: User Pool para autenticación
- ✅ **S3**: Buckets para frontend y almacenamiento de imágenes
- ✅ **CloudFront**: CDN global para el frontend React
- ✅ **IAM**: Roles y políticas de seguridad
- ✅ **CloudWatch**: Monitoreo y logs

## 🚀 Inicio Rápido

### 1. **Prerequisitos**

```bash
# Node.js 18+
node --version

# AWS CLI v2
aws --version

# Git (opcional)
git --version
```

### 2. **Configuración Inicial**

```bash
# 1. Configurar credenciales AWS
aws configure
# AWS Access Key ID: [Tu Access Key]
# AWS Secret Access Key: [Tu Secret Key]
# Default region name: sa-east-1
# Default output format: json

# 2. Ir al directorio de infraestructura
cd infrastructure

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env.dev
```

### 3. **Configurar Variables de Entorno**

Edita `.env.dev` con tus valores:

```bash
# ================================================================
# AWS Configuration
# ================================================================
AWS_ACCOUNT=235473625827
AWS_REGION=sa-east-1
AWS_PROFILE=default

# ================================================================
# Environment Configuration
# ================================================================
ENVIRONMENT=dev
PROJECT_NAME=full-vision

# ================================================================
# Database Configuration
# ================================================================
DATABASE_ALLOCATED_STORAGE=20
DATABASE_MULTI_AZ=false
DATABASE_DELETION_PROTECTION=false
DATABASE_BACKUP_RETENTION=7

# ... (resto de configuración)
```

### 4. **Deploy de Infraestructura**

#### **Windows:**

```cmd
cd scripts
deploy.bat dev
```

#### **Linux/macOS:**

```bash
cd scripts
chmod +x deploy.sh
./deploy.sh dev
```

#### **Manual (CDK directo):**

```bash
# Bootstrap CDK (solo primera vez)
npx cdk bootstrap aws://TU-ACCOUNT-ID/sa-east-1

# Sintetizar templates
export CDK_ENVIRONMENT=dev
npx cdk synth

# Deploy
npx cdk deploy --all
```

## 🔧 Configuraciones por Ambiente

### **Development (dev)**

- **RDS**: `db.t3.micro` (Free Tier)
- **NAT Gateway**: Deshabilitado (costos)
- **Multi-AZ**: Deshabilitado
- **Monitoreo**: Básico
- **MFA**: Opcional

### **Staging**

- **RDS**: `db.t3.small`
- **NAT Gateway**: Habilitado
- **Multi-AZ**: Deshabilitado
- **Monitoreo**: Detallado
- **MFA**: Opcional

### **Production (prod)**

- **RDS**: `db.t3.large`
- **NAT Gateway**: Habilitado
- **Multi-AZ**: Habilitado
- **Monitoreo**: Completo
- **MFA**: Obligatorio

## 📋 Recursos Creados

### **🌐 Networking**

- VPC con CIDR `10.0.0.0/16`
- 2 Availability Zones
- Subnets: Públicas, Privadas, Base de Datos
- Internet Gateway
- NAT Gateway (solo staging/prod)

### **🗄️ Base de Datos**

- RDS PostgreSQL 15.4
- Security Groups configurados
- Backup automático
- Secrets Manager para credenciales

### **🔐 Autenticación**

- Cognito User Pool con configuración completa
- Políticas de contraseñas personalizables
- MFA configurable
- Custom attributes para roles

### **📁 Almacenamiento**

- S3 bucket para frontend React
- S3 bucket para imágenes de productos
- Configuración CORS
- Cifrado por defecto

### **🌍 CDN**

- CloudFront Distribution
- Origin Access Identity
- Funciones Edge para SPA routing
- Cache policies optimizadas

## 🔗 Outputs Importantes

Después del deploy, obtienes estas variables:

```bash
# Database
FullVision-dev-DB-Endpoint = your-db.region.rds.amazonaws.com
FullVision-dev-DB-Secret-ARN = arn:aws:secretsmanager:...

# Cognito
FullVision-dev-UserPool-ID = sa-east-1_XXXXXXXXX
FullVision-dev-UserPoolClient-ID = abcdef123456789

# Storage
FullVision-dev-Frontend-Bucket = full-vision-frontend-dev-123456789012
FullVision-dev-Images-Bucket = full-vision-images-dev-123456789012

# CDN
FullVision-dev-CF-URL = d1234567890123.cloudfront.net
```

## 🛠️ Comandos Útiles

```bash
# Ver recursos desplegados
npx cdk list

# Ver diferencias antes de deploy
npx cdk diff

# Destruir infraestructura (⚠️ PELIGROSO)
npx cdk destroy --all

# Ver outputs del stack
aws cloudformation describe-stacks \
  --stack-name FullVisionInfrastructureStack-dev \
  --query 'Stacks[0].Outputs'

# Conectar a la base de datos
aws rds describe-db-instances \
  --db-instance-identifier full-vision-db-dev

# Obtener credenciales de base de datos
aws secretsmanager get-secret-value \
  --secret-id full-vision-db-credentials-dev \
  --query SecretString --output text
```

## 🔍 Troubleshooting

### **Error: CDK no está bootstrapped**

```bash
npx cdk bootstrap aws://TU-ACCOUNT-ID/TU-REGION
```

### **Error: Credenciales AWS**

```bash
aws sts get-caller-identity
# Si falla, ejecutar: aws configure
```

### **Error: Límites de AWS**

- **VPCs**: Máximo 5 por región (por defecto)
- **Elastic IPs**: Máximo 5 por región
- **NAT Gateways**: Costo por hora

### **Error: Stack ya existe**

```bash
# Ver stacks existentes
npx cdk list

# Destruir stack específico
npx cdk destroy FullVisionInfrastructureStack-dev
```

## 💰 Estimación de Costos (Mensual)

### **Development**

- **RDS t3.micro**: ~$15/mes
- **S3**: ~$1-5/mes
- **CloudFront**: ~$1/mes
- **Total**: ~$20/mes

### **Production**

- **RDS t3.large + Multi-AZ**: ~$200/mes
- **NAT Gateway**: ~$45/mes
- **S3**: ~$10/mes
- **CloudFront**: ~$5/mes
- **Total**: ~$260/mes

## 🔄 Próximos Pasos (Semanas 2-4)

- **Semana 2**: ECS Cluster + Load Balancer
- **Semana 3**: API NestJS + Container Registry
- **Semana 4**: CI/CD Pipeline + Domain SSL

## 📞 Soporte

Si tienes problemas:

1. **Revisa logs de CloudFormation**: AWS Console → CloudFormation → Events
2. **Verifica límites de AWS**: AWS Console → Service Quotas
3. **Consulta documentación CDK**: [AWS CDK Docs](https://docs.aws.amazon.com/cdk/)

---

**✅ Semana 1 Completada** | **📅 Próximo: Semana 2 - ECS & Load Balancer**
