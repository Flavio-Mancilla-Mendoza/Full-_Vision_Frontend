# 🗑️ Guía para Eliminar RDS

## ¿Por qué eliminar RDS?

Tu aplicación **NO usa RDS** - usa **Supabase** para la base de datos. El RDS está desplegado pero nadie se conecta a él, lo que significa que estás pagando ~$15-30/mes por un servicio que no usas.

## ✅ Cambios Realizados

1. **Comentado import de RDS** - Ya no se importa el módulo
2. **Eliminada propiedad `database`** del stack
3. **Comentado todo el código de RDS**:
   - Secret Manager para credenciales
   - Subnet Group
   - Security Group
   - Instancia RDS PostgreSQL
4. **Eliminadas referencias a RDS**:
   - Environment variable `DATABASE_ENDPOINT` en Lambda
   - Políticas IAM de acceso a RDS
   - Outputs de CloudFormation
5. **Código comentado** (no eliminado) para poder restaurarlo si lo necesitas

## 🚀 Cómo Desplegar los Cambios

### Opción 1: Usando CDK Deploy (Recomendado)

```bash
# Desde la carpeta infrastructure
cd infrastructure

# Instalar dependencias si no lo has hecho
npm install

# Ver los cambios que se van a aplicar
npm run diff

# Desplegar los cambios
npm run deploy
```

### Opción 2: Usando los Scripts de Deployment

**Windows:**

```cmd
cd infrastructure
scripts\deploy.bat
```

**Linux/Mac:**

```bash
cd infrastructure
./scripts/deploy.sh
```

## ⚠️ IMPORTANTE: Respaldo

Aunque el RDS no se está usando, si quieres hacer un respaldo antes de eliminarlo:

### 1. Crear Snapshot Manual (Opcional)

```bash
# Obtener el identificador de la instancia
aws rds describe-db-instances --query "DBInstances[?contains(DBInstanceIdentifier, 'full-vision')].DBInstanceIdentifier" --output text

# Crear snapshot
aws rds create-db-snapshot \
  --db-instance-identifier full-vision-db-dev \
  --db-snapshot-identifier full-vision-db-dev-final-backup-2026-01-07
```

### 2. Exportar Configuración (Opcional)

El código comentado en el stack ya sirve como referencia de cómo estaba configurado.

## 📊 ¿Qué va a pasar?

1. **CDK Destroy**: CloudFormation va a:

   - Detener la instancia RDS
   - Eliminar el Security Group
   - Eliminar el Subnet Group
   - Eliminar el Secret en Secrets Manager
   - Eliminar todos los recursos relacionados

2. **Tiempo estimado**: 5-10 minutos

3. **Costo después**: $0/mes en RDS 💰

## 🔄 Si Necesitas Restaurar RDS

1. Descomenta todo el código en el stack
2. Ejecuta `npm run deploy` nuevamente
3. Reconfigura tu aplicación para usar RDS en lugar de Supabase

## ✅ Verificar que Todo Funciona

Después del deploy, verifica que tu aplicación sigue funcionando:

```bash
# Tu app debería seguir usando Supabase sin problemas
npm run dev
```

## 📝 Notas

- **VPC permanece**: El VPC no se elimina porque es usado por otros servicios
- **Subnets permanecen**: Las subnets aisladas quedan por si las necesitas después
- **Cognito, S3, Lambda**: Todos los demás servicios siguen igual
- **Sin impacto**: Tu aplicación no se verá afectada porque nunca usó RDS

## 💡 Próximos Pasos

Después de eliminar RDS, podrías considerar:

1. ✅ Seguir usando Supabase (gratis hasta cierto límite)
2. ✅ Revisar otros servicios AWS que no estés usando
3. ✅ Optimizar costos de NAT Gateway si no lo necesitas ($30-40/mes)

## 🆘 ¿Problemas?

Si algo sale mal durante el deploy:

```bash
# Ver logs detallados
cdk deploy --verbose

# Ver el estado del stack
aws cloudformation describe-stacks --stack-name FullVisionInfrastructureStack-dev
```
