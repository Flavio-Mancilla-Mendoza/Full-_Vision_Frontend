# Configuración del Logo en CloudFront/S3

## Problema Resuelto
El logo del splash screen ahora se carga desde CloudFront/S3 en lugar de archivos locales.

## Pasos para Configurar

### 1. Preparar tu Logo
- Formato recomendado: PNG o SVG (mejor calidad)
- Tamaño recomendado: 512x512px o mayor
- Nombre sugerido: `logo.png`

### 2. Subir el Logo a S3

#### Opción A: Mediante AWS CLI
```bash
# Reemplaza TU-BUCKET-NAME con tu bucket real
aws s3 cp logo.png s3://TU-BUCKET-NAME/assets/logo.png --content-type image/png

# Verificar que se subió correctamente
aws s3 ls s3://TU-BUCKET-NAME/assets/
```

#### Opción B: Mediante Consola de AWS
1. Ir a S3 en la consola de AWS
2. Abrir tu bucket de imágenes
3. Crear carpeta `assets/` si no existe
4. Subir el archivo como `logo.png`
5. Asegurarse que el objeto sea accesible públicamente (o mediante CloudFront)

### 3. Configurar Variables de Entorno

Agrega a tu archivo `.env`:

```env
VITE_LOGO_S3_KEY=assets/logo.png
```

Si tu logo está en otra ubicación en S3, ajusta la ruta:
```env
VITE_LOGO_S3_KEY=mi-carpeta/mi-logo.png
```

### 4. Verificar Configuración Existente

Asegúrate de tener configuradas estas variables en tu `.env`:

```env
VITE_IMAGES_BASE_URL=https://tu-distribucion.cloudfront.net
VITE_AWS_S3_IMAGES_BUCKET=tu-bucket-name
VITE_AWS_REGION=sa-east-1
```

### 5. Reiniciar el Servidor de Desarrollo

```bash
pnpm run dev
```

## Resultado

El logo ahora se carga desde:
```
https://tu-distribucion.cloudfront.net/assets/logo.png
```

## Funcionalidades Adicionales

### Fallback Automático
Si CloudFront no está configurado o la imagen falla, se muestra un logo SVG inline como respaldo.

### Cache de CloudFront
El logo se cachea en CloudFront, mejorando significativamente los tiempos de carga.

### Error Handling
Si la imagen no carga, se registra un warning en la consola y se oculta la imagen rota.

## Troubleshooting

### Logo no se muestra
1. Verificar que el archivo existe en S3: `aws s3 ls s3://bucket/assets/logo.png`
2. Verificar permisos del bucket y CloudFront
3. Revisar la consola del navegador para errores
4. Verificar que `VITE_IMAGES_BASE_URL` esté correctamente configurada

### Imagen se ve pixelada
- Subir una versión de mayor resolución (512x512 o 1024x1024)
- Usar formato SVG para calidad perfecta en cualquier tamaño

### Cache de CloudFront
Si actualizas el logo y no se refleja:
```bash
# Invalidar el cache de CloudFront
aws cloudfront create-invalidation --distribution-id TU-DIST-ID --paths "/assets/logo.png"
```
