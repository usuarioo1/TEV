# 🎉 Guía de Prueba - Cloudinary Integration

## ✅ Configuración Completada

### Archivos implementados:
1. ✅ Cloudinary SDK instalado
2. ✅ Variables de entorno configuradas en `.env`
3. ✅ Utilidades de Cloudinary: `lib/cloudinary.ts`
4. ✅ API endpoint: `app/api/upload/route.ts`
5. ✅ Formularios actualizados:
   - `components/caminatas/ReportePeligroForm.tsx`
   - `components/caminatas/TarjetaStopForm.tsx`
6. ✅ Componente de visualización: `components/caminatas/ImageGallery.tsx`
7. ✅ Integración en página de detalles: `app/caminatas/[id]/page.tsx`

## 🧪 Cómo Probar la Funcionalidad

### Paso 1: Iniciar el servidor
```bash
npm run dev
```

### Paso 2: Navega a Caminatas de Seguridad
1. Inicia sesión en la aplicación
2. Ve al menú "Caminatas de Seguridad"
3. Selecciona una caminata existente (o crea una nueva)

### Paso 3: Agregar Reporte con Imágenes

#### 3.1 Crear Reporte de Peligro
1. Click en el botón **"Agregar"** 
2. Selecciona **"Reporte de Peligro"**
3. Llena el formulario:
   - Tipo de Peligro: "Ejemplo de prueba"
   - Zonas: "Zona A"
   - Faena: "Prueba"
   - Actividad: "Test"
   - Tarea: "Verificación"
   - Responsable: "Juan Pérez"
   - Tipo de Riesgo: "Alto"
   - Nivel de Hallazgo: "Crítico"
   - Plazo de Cierre: (fecha futura)
   - Descripción: "Este es un reporte de prueba con imágenes"
   
4. **Adjuntar imágenes:**
   - Click en "Choose File" o "Examinar"
   - Selecciona 1-3 imágenes de prueba (JPG, PNG)
   - Verás la lista de imágenes seleccionadas

5. Click en **"Crear Reporte de Peligro"**
6. Espera a que diga "Subiendo imágenes..." y luego complete

#### 3.2 Crear Tarjeta Stop
1. Click en el botón **"Agregar"**
2. Selecciona **"Tarjeta Alto/Stop"**
3. Llena el formulario y adjunta imágenes
4. Envía el formulario

### Paso 4: Ver las Imágenes
1. Después de crear el reporte, la página se recargará
2. Verás el reporte con una galería de imágenes en miniatura
3. **Click en cualquier imagen** para verla en tamaño completo
4. Usa el botón X o click fuera para cerrar el modal

## 📸 Características de la Galería

- ✨ Grid responsive de thumbnails
- 🔍 Modal de vista completa al hacer click
- 📱 Diseño adaptable a móviles
- ⚡ Carga optimizada desde Cloudinary CDN
- 🎨 Separación visual entre reportes y tarjetas

## 🔍 Verificación en Cloudinary

1. Ve a tu dashboard: https://cloudinary.com/console
2. Click en **"Media Library"**
3. Navega a la carpeta `nextminer/caminatas/`
4. Verás las subcarpetas:
   - `reportes-peligro/` - Imágenes de reportes
   - `tarjetas-stop/` - Imágenes de tarjetas stop

## 🐛 Troubleshooting

### Las imágenes no se suben
**Verifica:**
1. Credenciales en `.env` son correctas
2. El servidor está corriendo (`npm run dev`)
3. Revisa la consola del navegador (F12) para errores
4. Verifica que las imágenes sean formatos válidos (JPG, PNG, etc.)

### Error "Cannot read properties of undefined"
**Solución:**
1. Detén el servidor (Ctrl+C)
2. Reinicia: `npm run dev`
3. Limpia cache del navegador (Ctrl+Shift+R)

### Las imágenes no se ven en la galería
**Verifica:**
1. Que el reporte tenga datos.imagenes con URLs válidas
2. Revisa en Cloudinary que las imágenes se subieron
3. Verifica la consola del navegador para errores de red

## 📊 Datos Guardados

Las URLs de las imágenes se guardan en el campo JSON `datos` de la siguiente forma:

```json
{
  "imagenes": [
    {
      "url": "https://res.cloudinary.com/tu-cloud/image/upload/...",
      "publicId": "nextminer/caminatas/reportes-peligro/..."
    }
  ],
  "cantidadImagenes": 1,
  "tipoPeligro": "...",
  "descripcionDetallada": "..."
}
```

## ✨ Próximos Pasos Opcionales

- [ ] Agregar límite de tamaño de archivo
- [ ] Agregar preview de imágenes antes de subir
- [ ] Implementar eliminación de imágenes
- [ ] Agregar drag & drop para subir imágenes
- [ ] Implementar compresión del lado del cliente

## 🎯 Resumen

Todo está configurado y listo para usar. La funcionalidad completa incluye:
- ✅ Subida de múltiples imágenes
- ✅ Almacenamiento en Cloudinary
- ✅ Visualización en galería responsive
- ✅ Modal de vista completa
- ✅ Integración con reportes y tarjetas

¡Prueba creando un reporte con imágenes y verifica que todo funcione correctamente! 🚀
