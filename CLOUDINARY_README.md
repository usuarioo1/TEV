# Configuración de Cloudinary para NextMiner

## 📋 Resumen

Esta aplicación usa Cloudinary para gestionar la subida y almacenamiento de imágenes en:
- Reportes de Peligro (Caminatas de Seguridad)
- Tarjetas Alto/Stop

## 🚀 Configuración Inicial

### 1. Crear cuenta en Cloudinary

1. Visita [https://cloudinary.com](https://cloudinary.com)
2. Crea una cuenta gratuita (incluye 25 GB de almacenamiento)
3. Accede al dashboard en [https://cloudinary.com/console](https://cloudinary.com/console)

### 2. Obtener credenciales

En el dashboard de Cloudinary encontrarás:
- **Cloud Name**: Tu nombre de cloud único
- **API Key**: Clave pública de API
- **API Secret**: Clave secreta de API (¡no la compartas!)

### 3. Configurar variables de entorno

Edita el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="tu-cloud-name-aqui"
CLOUDINARY_API_KEY="tu-api-key-aqui"
CLOUDINARY_API_SECRET="tu-api-secret-aqui"
CLOUDINARY_FOLDER="nextminer"
```

**⚠️ Importante**: 
- NO compartas tu `API_SECRET`
- NO subas el archivo `.env.local` a Git
- Usa `.env.example` como referencia

### 4. Reiniciar el servidor de desarrollo

Después de configurar las variables:

```bash
npm run dev
```

## 📁 Estructura de Archivos

```
lib/
  cloudinary.ts          # Utilidades para subir/eliminar imágenes
app/
  api/
    upload/
      route.ts           # Endpoint para subir imágenes
components/
  caminatas/
    ReportePeligroForm.tsx  # Formulario con upload de imágenes
    TarjetaStopForm.tsx     # Formulario con upload de imágenes
    ImageGallery.tsx        # Galería para visualizar imágenes
```

## 🔧 Uso

### Subir imágenes desde un formulario

Los formularios `ReportePeligroForm` y `TarjetaStopForm` ya incluyen:
1. Input de archivos que acepta múltiples imágenes
2. Conversión a base64
3. Upload automático a Cloudinary antes de guardar el reporte
4. Almacenamiento de URLs en el campo JSON `datos`

### Visualizar imágenes

Usa el componente `ImageGallery`:

```tsx
import ImageGallery from '@/components/caminatas/ImageGallery';

// En tu componente:
<ImageGallery 
    images={reporte.datos.imagenes} 
    title="Imágenes del Reporte"
/>
```

### API de Cloudinary

```typescript
import { uploadToCloudinary, uploadMultipleToCloudinary } from '@/lib/cloudinary';

// Subir una imagen (base64)
const result = await uploadToCloudinary(base64Image, 'mi-carpeta');
// Returns: { url, secureUrl, publicId }

// Subir múltiples imágenes
const results = await uploadMultipleToCloudinary([img1, img2], 'mi-carpeta');
```

## 🌳 Organización en Cloudinary

Las imágenes se organizan en carpetas:
- `nextminer/caminatas/reportes-peligro/` - Reportes de peligro
- `nextminer/caminatas/tarjetas-stop/` - Tarjetas stop

## ⚡ Optimizaciones

Cloudinary aplica automáticamente:
- Compresión de calidad automática
- Formato de imagen optimizado (WebP cuando es soportado)
- CDN global para carga rápida

## 🔒 Seguridad

- ✅ Solo usuarios autenticados pueden subir imágenes
- ✅ API Key/Secret nunca se exponen al cliente
- ✅ Validación de tipos de archivo en el servidor
- ✅ Las URLs son públicas pero difíciles de adivinar

## 📊 Límites del plan gratuito

- **Almacenamiento**: 25 GB
- **Ancho de banda**: 25 GB/mes
- **Transformaciones**: 25,000/mes

Para más información: [https://cloudinary.com/pricing](https://cloudinary.com/pricing)

## 🐛 Troubleshooting

### Error: "Cannot read properties of undefined (reading 'uploader')"

**Causa**: Variables de entorno no configuradas correctamente.

**Solución**: 
1. Verifica que `.env.local` existe
2. Verifica que las variables están correctamente escritas
3. Reinicia el servidor de desarrollo

### Error: "Invalid signature"

**Causa**: `API_SECRET` incorrecto.

**Solución**: 
1. Verifica el `API_SECRET` en tu dashboard de Cloudinary
2. Asegúrate de copiar el valor completo

### Las imágenes no se ven

**Causa**: URL incorrecta o imagen eliminada.

**Solución**: 
1. Verifica que la URL está guardada correctamente en la BD
2. Revisa en tu dashboard de Cloudinary que la imagen existe

## 📞 Soporte

- Documentación oficial: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- SDKs: [https://cloudinary.com/documentation/cloudinary_sdks](https://cloudinary.com/documentation/cloudinary_sdks)
