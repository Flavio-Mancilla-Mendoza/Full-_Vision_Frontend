# Lambda@Edge para Optimización de Imágenes

Esta función Lambda@Edge intercepta requests a CloudFront y redimensiona/optimiza imágenes on-the-fly.

## Características

- **Resize automático**: `?w=400` redimensiona a 400px de ancho
- **Calidad ajustable**: `?q=85` ajusta calidad JPEG/WebP
- **Formato moderno**: Convierte a WebP automáticamente si el navegador lo soporta
- **Cache eficiente**: Las imágenes transformadas se cachean en CloudFront

## Parámetros de Query String

- `w` - Ancho deseado en píxeles (ej: `?w=800`)
- `q` - Calidad de compresión 1-100 (ej: `?q=85`)

## Ejemplo de URLs

```
# Original
https://dmnfd6b4vz00z.cloudfront.net/products/glasses-1.jpg

# Optimizada (400px, calidad 80)
https://dmnfd6b4vz00z.cloudfront.net/products/glasses-1.jpg?w=400&q=80

# Para mobile (320px)
https://dmnfd6b4vz00z.cloudfront.net/products/glasses-1.jpg?w=320&q=75
```

## Instalación

### 1. Deploy de la función Lambda

```bash
cd infrastructure
npm install
npx cdk deploy --stack=ImageOptimizationStack
```

### 2. Configurar CloudFront

La función se asociará automáticamente como:

- **Evento**: Origin Response
- **Distribución**: Tu CloudFront existente

### 3. Habilitar transformaciones en frontend

En `src/hooks/use-image-optimization.ts`, descomentar:

```typescript
// Línea ~70
return `${baseUrl}?${params.toString()}`;
```

## Costos

- Lambda@Edge: ~$0.60 por millón de requests
- Transferencia de datos: Según plan de CloudFront
- **Ahorro**: Reduce ancho de banda 50-70% con imágenes optimizadas

## Alternativas sin Lambda@Edge

Si prefieres no usar Lambda@Edge, puedes:

1. **Pre-generar tamaños**: Subir múltiples versiones (thumbnail, medium, large) al subir
2. **Servicio externo**: Imgix, Cloudinary (más costoso pero sin config)
3. **Sharp en build time**: Generar versiones durante deployment

## Límites de Lambda@Edge

- Memoria máxima: 128 MB
- Timeout: 5 segundos (origin response)
- Tamaño de código: 1 MB comprimido

Para imágenes muy grandes (>10MB), considera pre-procesamiento.
