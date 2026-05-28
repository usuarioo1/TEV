# Sistema de Alertas Pendientes - Reportes de Peligro y Tarjetas Alto/Stop

## 📋 Resumen de Cambios

Se ha implementado un sistema completo de gestión de estado para **Reportes de Peligro** y **Tarjetas Alto/Stop**, permitiendo:

- ✅ Asignación de responsable de cierre (usuarios que NO sean operarios)
- ✅ Estados de alerta: PENDIENTE, EN_REVISION, CERRADO
- ✅ Página dedicada para revisar alertas pendientes asignadas
- ✅ Proceso de cierre con comentarios
- ✅ Filtrado automático de alertas por responsable

---

## 🔄 Cambios en la Base de Datos (Prisma Schema)

### Nuevo Enum: EstadoAlerta
```prisma
enum EstadoAlerta {
  PENDIENTE    // Creado, esperando revisión del responsable
  EN_REVISION  // En proceso de revisión
  CERRADO      // Solucionado y cerrado
}
```

### Cambios en Modelo ReportePeligro
Se agregaron los siguientes campos:
- `estado` (EstadoAlerta): Estado actual del reporte
- `responsableCierreId` (Int?): ID del usuario responsable de cerrar
- `responsableCierre` (User?): Relación con el usuario responsable
- `fechaCierre` (DateTime?): Fecha en que se cerró
- `comentarioCierre` (String?): Comentarios al cerrar

### Cambios en Modelo TarjetaStop
Se agregaron los mismos campos que en ReportePeligro:
- `estado` (EstadoAlerta)
- `responsableCierreId` (Int?)
- `responsableCierre` (User?)
- `fechaCierre` (DateTime?)
- `comentarioCierre` (String?)

### Cambios en Modelo User
Se agregaron nuevas relaciones:
- `reportesResponsable` (ReportePeligro[]): Reportes donde es responsable de cierre
- `tarjetasResponsable` (TarjetaStop[]): Tarjetas donde es responsable de cierre

---

## 📝 Archivos Modificados

### 1. Schema de Prisma
- **Archivo**: `prisma/schema.prisma`
- **Cambios**: Agregado enum `EstadoAlerta` y campos de estado/responsable en ReportePeligro y TarjetaStop

### 2. Formularios
#### ReportePeligroForm.tsx
- **Archivo**: `components/caminatas/ReportePeligroForm.tsx`
- **Cambios**: Campo "Responsable de Cierre" ahora es un `<select>` que muestra usuarios filtrados (sin operarios)

#### TarjetaStopForm.tsx
- **Archivo**: `components/caminatas/TarjetaStopForm.tsx`
- **Cambios**: Campo "Responsable del Cierre" ahora es un `<select>` que muestra usuarios filtrados (sin operarios)

### 3. APIs de Creación
Todos los endpoints de creación ahora extraen `responsableCierre` del body y lo asignan:

#### Reportes de Peligro
- `app/api/reportes-peligro/route.ts` (POST): Reporte independiente
- `app/api/caminatas/[id]/reportes-peligro/route.ts` (POST): Reporte de caminata

#### Tarjetas Stop
- `app/api/tarjetas-stop/route.ts` (POST): Tarjeta independiente
- `app/api/caminatas/[id]/tarjetas-stop/route.ts` (POST): Tarjeta de caminata

### 4. Nuevas APIs

#### GET /api/alertas/pendientes
- **Archivo**: `app/api/alertas/pendientes/route.ts`
- **Descripción**: Obtiene reportes y tarjetas pendientes del usuario actual (donde es responsable de cierre)
- **Respuesta**:
  ```json
  {
    "reportes": [...],
    "tarjetas": [...],
    "total": 5
  }
  ```

#### PATCH /api/reportes-peligro/[id]/cerrar
- **Archivo**: `app/api/reportes-peligro/[id]/cerrar/route.ts`
- **Descripción**: Cierra un reporte de peligro (solo el responsable puede cerrarlo)
- **Body**: `{ "comentarioCierre": "Solución implementada..." }`

#### PATCH /api/tarjetas-stop/[id]/cerrar
- **Archivo**: `app/api/tarjetas-stop/[id]/cerrar/route.ts`
- **Descripción**: Cierra una tarjeta stop (solo el responsable puede cerrarla)
- **Body**: `{ "comentarioCierre": "Solución implementada..." }`

### 5. Nueva Página

#### /caminatas/pendientes
- **Archivo**: `app/caminatas/pendientes/page.tsx`
- **Descripción**: Página que muestra todas las alertas pendientes del usuario actual
- **Características**:
  - Lista de reportes de peligro pendientes
  - Lista de tarjetas stop pendientes
  - Modal para cerrar alertas con comentario
  - Estadísticas de alertas pendientes
  - Filtrado automático por usuario responsable

### 6. Modificación en Página Principal de Caminatas
- **Archivo**: `app/caminatas/page.tsx`
- **Cambios**: Agregado botón "Mis Alertas Pendientes" en el header

---

## 🚀 Instrucciones para Aplicar los Cambios

### 1. Generar y Aplicar Migración de Prisma

```bash
# Generar la migración
npx prisma migrate dev --name add_estado_alertas

# Si hay problemas, puedes resetear y volver a migrar (⚠️ CUIDADO: borra datos)
# npx prisma migrate reset
```

### 2. Regenerar el Cliente de Prisma

```bash
npx prisma generate
```

### 3. Verificar la Base de Datos

```bash
# Abrir Prisma Studio para verificar los cambios
npx prisma studio
```

---

## 📖 Flujo de Uso

### Creación de Alerta (Reporte o Tarjeta)

1. Usuario (coordinador/supervisor) crea un reporte de peligro o tarjeta stop
2. En el formulario, **selecciona un responsable de cierre** (lista filtrada sin operarios)
3. Al guardar:
   - Estado se establece automáticamente en `PENDIENTE`
   - Se asigna el `responsableCierreId`

### Revisión y Cierre

1. Usuario responsable accede a `/caminatas/pendientes`
2. Ve lista de alertas pendientes asignadas a él
3. Puede revisar detalles de cada alerta
4. Hace clic en "Revisar y Cerrar"
5. Ingresa comentario de cierre (obligatorio)
6. Confirma el cierre:
   - Estado cambia a `CERRADO`
   - Se registra `fechaCierre` y `comentarioCierre`
   - La alerta desaparece de la lista de pendientes

---

## 🎯 Permisos y Roles

### Roles que pueden ser Responsables de Cierre
- ✅ Jefaturas
- ✅ Coordinador
- ✅ Supervisor
- ❌ Operario (excluido del listado)

### Acceso a Alertas Pendientes
- Solo el usuario asignado como **responsable de cierre** puede ver y cerrar sus alertas
- Cada usuario ve únicamente las alertas asignadas a él

---

## 🔗 Rutas Agregadas

| Ruta | Descripción |
|------|-------------|
| `/caminatas/pendientes` | Página de alertas pendientes del usuario |
| `GET /api/alertas/pendientes` | API para obtener alertas pendientes |
| `PATCH /api/reportes-peligro/:id/cerrar` | API para cerrar reporte |
| `PATCH /api/tarjetas-stop/:id/cerrar` | API para cerrar tarjeta |

---

## ✅ Testing Sugerido

1. **Crear Reporte de Peligro**
   - Verificar que el select de responsable muestre usuarios sin operarios
   - Verificar que se guarda con estado PENDIENTE

2. **Crear Tarjeta Stop**
   - Verificar que el select de responsable muestre usuarios sin operarios
   - Verificar que se guarda con estado PENDIENTE

3. **Ver Alertas Pendientes**
   - Login como usuario responsable
   - Acceder a /caminatas/pendientes
   - Verificar que aparecen solo las alertas asignadas

4. **Cerrar Alerta**
   - Hacer clic en "Revisar y Cerrar"
   - Ingresar comentario
   - Verificar que desaparece de la lista
   - Verificar en BD que estado cambió a CERRADO

---

## 📊 Mejoras Futuras Sugeridas

- [ ] Notificaciones al responsable cuando se le asigna una alerta
- [ ] Dashboard de métricas de cierre (tiempo promedio, alertas por tipo, etc.)
- [ ] Historial de alertas cerradas
- [ ] Filtros por fecha, tipo, estado en página de pendientes
- [ ] Exportar reportes de alertas a PDF/Excel
- [ ] Recordatorios automáticos para alertas pendientes antiguasDesarrollado con ❤️ usando Next.js, Prisma, y TypeScript
