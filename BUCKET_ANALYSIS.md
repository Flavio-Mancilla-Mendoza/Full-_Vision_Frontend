# Análisis de Buckets S3 - Full Vision

**Fecha:** 2 Jan 2026  
**Región:** sa-east-1 (América del Sur - São Paulo)

---

## 📊 Buckets Encontrados

### 1. `cdk-hnb659fds-assets-235473625827-sa-east-1`

- **Tipo:** CDK Assets Bucket
- **Propósito:** Almacena archivos de infraestructura (Lambda code, templates, etc.) generados por CDK
- **Estado:** ✅ **EN USO ACTIVO**
- **¿Puedo eliminarlo?** ❌ **NO - CRÍTICO**

**Detalles:**

- Este bucket es creado y gestionado automáticamente por AWS CDK
- Contiene archivos necesarios para el despliegue de tu infraestructura
- Si lo eliminas, tus próximos despliegues con `cdk deploy` fallarán
- CDK lo recreará automáticamente si lo borras, pero podrías perder recursos previos

**Acción recomendada:** **MANTENER**

---

### 2. `fullvisioninfrastructures-productimagesbucket03bda-dfbsfpswo25e`

- **Tipo:** Product Images Bucket
- **Propósito:** Almacena imágenes de productos para la aplicación
- **Estado:** ✅ **EN USO ACTIVO**
- **¿Puedo eliminarlo?** ❌ **NO - EN USO**

**Referencias encontradas:**

- `.env`: `VITE_AWS_S3_IMAGES_BUCKET`
- `.env`: `VITE_IMAGES_BASE_URL`
- `infrastructure/outputs.json`: `ImagesBucketName`
- `infrastructure/.env.dev`: `IMAGES_BUCKET_NAME`
- `src/services/imageStorage.ts`: Upload de imágenes de productos
- `src/components/admin/ProductManagement.tsx`: Gestión de imágenes
- CDK Stack: `ProductImagesBucket` (línea ~393)
- Políticas IAM en múltiples funciones Lambda

**Acción recomendada:** **MANTENER**

---

### 3. `fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv`

- **Tipo:** Frontend Bucket
- **Propósito:** Hosting estático del frontend React (Website S3)
- **Estado:** ⚠️ **DECLARADO PERO NO USADO ACTIVAMENTE**
- **¿Puedo eliminarlo?** ⚠️ **POSIBLE - VERIFICAR PRIMERO**

**Referencias encontradas:**

- `infrastructure/outputs.json`: `FrontendBucketName`
- CDK Stack: `FrontendBucket` (línea ~347)
- Configurado con website hosting (`websiteIndexDocument: "index.html"`)
- CloudFront está comentado en CDK (línea 7, 27, 434-439)

**Análisis:**
Este bucket fue creado para hosting del frontend, pero:

1. ❌ NO está referenciado en `.env` del frontend
2. ❌ NO está en la documentación de deployment actual
3. ⚠️ CloudFront está comentado/deshabilitado en el CDK
4. ✅ Existe en `outputs.json` (fue desplegado)

**Posibles escenarios:**

- **Escenario A:** Frontend se despliega a otro servicio (Vercel, Netlify, Amplify)
- **Escenario B:** Frontend se sirve desde otro stack no visto
- **Escenario C:** Bucket fue creado pero nunca utilizado

**Acción recomendada:** **VERIFICAR Y POSIBLEMENTE ELIMINAR**

---

## 🎯 Recomendaciones de Acción

### ✅ Buckets SEGUROS para mantener (NO eliminar):

1. ✅ `cdk-hnb659fds-assets-235473625827-sa-east-1` - **CDK requiere este bucket**
2. ✅ `fullvisioninfrastructures-productimagesbucket03bda-dfbsfpswo25e` - **Aplicación en uso**

### ⚠️ Bucket POSIBLE de eliminar (con verificación):

3. ⚠️ `fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv` - **Frontend Bucket**

---

## 📋 Plan de Verificación para Frontend Bucket

Antes de eliminar el Frontend Bucket, verifica:

### Paso 1: Verificar si tiene contenido

```bash
aws s3 ls s3://fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv --region sa-east-1
```

### Paso 2: Verificar tamaño del bucket

```bash
aws s3 ls s3://fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv --recursive --human-readable --summarize --region sa-east-1
```

### Paso 3: Verificar si hay CloudFront distribution apuntando a él

```bash
aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv.s3.amazonaws.com']].{Id:Id,DomainName:DomainName,Status:Status}" --output table
```

### Paso 4: Verificar en la consola AWS

- Ve a S3 Console y revisa:
  - Tamaño del bucket
  - Última modificación de objetos
  - Propiedades del bucket
  - Configuración de Website Hosting

### Paso 5: Revisar logs de acceso (si están habilitados)

```bash
aws s3api get-bucket-logging --bucket fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv --region sa-east-1
```

---

## 🗑️ Procedimiento Seguro de Eliminación

Si después de las verificaciones decides eliminar el **Frontend Bucket**:

### Opción 1: Usando el script seguro (recomendado)

**Dry-run primero (sin eliminar):**

```bash
cd scripts
bash safe-delete-s3-buckets.sh \
  --bucket fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv \
  --region sa-east-1 \
  --backup-dir ./backups/frontend-bucket
```

**Ejecutar eliminación (después de verificar dry-run):**

```bash
bash safe-delete-s3-buckets.sh \
  --bucket fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv \
  --region sa-east-1 \
  --backup-dir ./backups/frontend-bucket \
  --execute \
  --confirm fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv
```

### Opción 2: Usando PowerShell (Windows)

**Dry-run:**

```powershell
cd scripts
.\safe-delete-s3-buckets.ps1 `
  -BucketName fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv `
  -Region sa-east-1 `
  -BackupDir .\backups\frontend-bucket
```

**Ejecutar:**

```powershell
.\safe-delete-s3-buckets.ps1 `
  -BucketName fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv `
  -Region sa-east-1 `
  -BackupDir .\backups\frontend-bucket `
  -Execute `
  -ConfirmName fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv
```

### Opción 3: Manual con AWS CLI

**Vaciar bucket:**

```bash
aws s3 rm s3://fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv --recursive --region sa-east-1
```

**Eliminar versiones (si está versionado):**

```bash
aws s3api list-object-versions \
  --bucket fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv \
  --region sa-east-1 \
  --query 'Versions[].{Key:Key,VersionId:VersionId}' \
  --output text | while read key version; do
    aws s3api delete-object \
      --bucket fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv \
      --key "$key" \
      --version-id "$version" \
      --region sa-east-1
done
```

**Eliminar bucket:**

```bash
aws s3api delete-bucket \
  --bucket fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv \
  --region sa-east-1
```

---

## 📝 Después de Eliminar un Bucket

### Si eliminas el Frontend Bucket:

1. **Actualizar CDK Stack** (eliminar del código):

   ```typescript
   // Comentar o eliminar en: infrastructure/lib/full-vision-infrastructure-stack.ts
   // Línea ~347: this.storageS3 = new s3.Bucket(...)
   ```

2. **Actualizar outputs.json:**

   ```bash
   cd infrastructure
   cdk synth
   # Verificar que el bucket ya no aparece en outputs
   ```

3. **Redesplegar CDK (opcional):**
   ```bash
   cdk deploy FullVisionInfrastructureStack-dev
   ```

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### ❌ NUNCA elimines:

- `cdk-hnb659fds-assets-*` - CDK lo necesita
- `fullvisioninfrastructures-productimagesbucket03bda-*` - Tu app lo usa activamente

### ⚠️ Antes de eliminar cualquier bucket:

1. ✅ Haz backup del contenido
2. ✅ Verifica que no esté en uso
3. ✅ Ejecuta dry-run primero
4. ✅ Guarda el backup por al menos 30 días
5. ✅ Verifica que la aplicación funciona después

### 💡 Costos de S3:

- Buckets vacíos: **$0 (gratis)**
- Solo pagas por: almacenamiento + requests + transferencia
- Si el bucket está vacío o con poco contenido, el costo es mínimo

---

## 🔍 Preguntas Frecuentes

**P: ¿Dónde se está sirviendo mi frontend actualmente?**  
R: Necesitamos verificar. Revisa:

- `package.json` scripts de deploy
- Vercel/Netlify/Amplify config
- CloudFront distributions activas
- `VITE_APP_URL` en `.env`

**P: ¿Puedo recrear el bucket si me equivoco?**  
R: Sí, pero:

- El nombre del bucket puede tardar 24hrs en estar disponible de nuevo
- Deberás re-subir todo el contenido
- Por eso recomendamos hacer backup primero

**P: ¿El CDK asset bucket crece indefinidamente?**  
R: Sí, CDK guarda cada versión de assets. Puedes:

- Configurar lifecycle rules para eliminar versiones antiguas
- Limpiarlo manualmente cada cierto tiempo (con precaución)

---

## 📞 Siguiente Paso

**Responde estas preguntas:**

1. ¿Dónde se sirve actualmente tu frontend React? (localhost, Vercel, S3, etc.)
2. ¿Has desplegado el frontend a producción?
3. ¿Usas CloudFront o planeas usarlo?

Con esa info puedo confirmar 100% si es seguro eliminar el Frontend Bucket.
