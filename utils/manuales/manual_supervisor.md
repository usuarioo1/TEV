# Manual de Usuario - Rol Supervisor

## Introducción

Este manual describe las funciones y procedimientos que un **supervisor** puede realizar en el sistema de gestión de transportes.

El supervisor es el usuario responsable de **revisar y aprobar los checklists** completados por los operarios antes de que un servicio pueda ser ejecutado. Su aprobación es un paso obligatorio en el flujo de trabajo del servicio.


---

## Acceso al Sistema

### Inicio de Sesión

1. Acceda a la URL del sistema
2. Ingrese su **nombre de usuario** y **contraseña**
3. Click en "Iniciar Sesión"

### Primera Visualización

Al iniciar sesión, será redirigido automáticamente a la página **"Panel de Supervisor"**. Esta muestra los servicios que requieren su revisión.

---

## Panel de Control

El panel de control (`/supervisor`) es la página principal del supervisor y muestra:

### Tarjetas de Estadísticas

En la parte superior verá tarjetas con el conteo de servicios por estado:

- **Pendientes:** Servicios esperando su aprobación
- **Aprobados:** Servicios ya aprobados
- **En Ejecución:** Servicios actualmente activos
- **Completados:** Servicios finalizados
- **Rechazados:** Servicios rechazados

### Lista de Servicios Pendientes

Debajo de las estadísticas encontrará la lista de servicios pendientes de aprobación. Cada servicio muestra:

- Código del servicio
- Origen y destino del viaje
- Fecha de asignación
- Nombre del operario asignado
- Estado actual
- Indicadores visuales de validación (semáforo verde/rojo)

---
## Aprobar o Rechazar Checklists

### Acceso al Detalle del Servicio

Para revisar un servicio, haga click en el servicio desde cualquier lista. Será dirigido a la página de detalle `/supervisor/[id]`.

### Revisión de Checklists

En la página de detalle podrá revisar los **4 checklists** completados por el operario:

1. **Checklist de Fatiga y Somnolencia** - Evalúa si el operario está en condiciones físicas de trabajar
2. **Checklist Tracto Camiones** - Inspección del vehículo tractor
3. **Checklist Semi-remolque (Equipo)** - Inspección del equipo de transporte (rampla)
4. **Análisis de Riesgo (AST/ART)** - Identificación de riesgos de la tarea

### Indicadores Visuales

Cada checklist tiene un indicador visual tipo semáforo:

- **Verde:** Todos los items críticos están marcados como "Sí"
- **Rojo:** Algun item crítico está marcado como "No" o el operario no está apto

### Formulario de Aprobación

Después de revisar los checklists, complete el formulario de aprobación:

**Para Aprobar:**
- Agregue observaciones opcionales
- Click en **"Aprobar Servicio"**

**Para Rechazar:**
- Complete el campo **"Motivo del rechazo"** (obligatorio)
- Click en **"Rechazar Servicio"**

### Resultado de la Acción

- **Aprobado:** El servicio cambia a estado `APROBADO`. El operario podrá iniciar la ejecución.
- **Rechazado:** El servicio cambia a estado `RECHAZADO`. El operario deberá corregir los problemas y reenviar.

### Firma Digital

Cada aprobación o rechazo genera automáticamente un registro de firma digital que incluye:

- ID del supervisor
- ID del servicio
- Fecha y Hora

---

## Monitoreo de Servicios

### Servicios en Ejecución

La página "En Ejecución" (`/supervisor/en-ejecucion`) muestra los servicios que están actualmente activos. Para cada servicio podrá ver:

- Código y ruta del servicio
- Tiempo transcurrido desde el inicio de la ejecución
- Nombre del operario



### Servicios Completados

La página "Completados" (`/supervisor/completados`) muestra el historial de servicios finalizados. Cada servicio muestra:

- Duración total del servicio
- Fecha de finalización
- Estado final

### Servicios Rechazados

La página "Rechazados" (`/supervisor/rechazados`) muestra el historial de servicios que fueron rechazados, ya sea por el supervisor o por el operario.

---

## Reportes 

El supervisor puede crear **reportes de seguridad** directamente desde el sistema:

### Tipos de Reportes Disponibles

1. **Caminatas de Seguridad** 
2. **Reporte de Peligro** - Reporte de condiciones peligrosas identificadas
3. **Tarjeta Stop** - Tarjeta de parada por condiciones inseguras
4. **Control ART** - Control de análisis de riesgos del trabajo

### Crear un Reporte

1. Vaya a la sección de reportar de seguridad
2. Seleccione el tipo de reporte
3. Complete los campos requeridos
4. Envíe el reporte

### Verificar Cierres de Alertas

El supervisor puede **verificar el cierre de alertas** de seguridad previamente reportadas, confirmando que los problemas identificados fueron corregidos.

---

## Estados del Servicio

| Estado | Descripción | Acción del Supervisor |
|--------|-------------|---------------------|
| ASIGNADO | Servicio asignado al operario | Ninguna |
| ACEPTADO | Operario aceptó el servicio | Ninguna |
| EN_CHECKLIST | Operario completando checklists | Ninguna |
| PENDIENTE_APROBACION | Esperando revisión del supervisor | Revisar y aprobar/rechazar |
| APROBADO | Checklists aprobados | Puede monitorear ejecución |
| EN_EJECUCION | Servicio en curso | Puede monitorear |
| COMPLETADO | Servicio finalizado | Ver en historial |
| RECHAZADO | Supervisor rechazó los checklists | Ver en historial |

### Flujo de Trabajo Relevante para el Supervisor

`
PENDIENTE_APROBACION → (revisión) → APROBADO → EN_EJECUCION → COMPLETADO
                                   ↓
                                   RECHAZADO (con motivo)
`

---

## Preguntas Frecuentes

### ¿Qué debo verificar antes de aprobar un servicio?

Antes de aprobar, revise:

1. Que todos los checklists estén completos
2. Que no haya items críticos marcados como "NO" (especialmente en documentación)
3. Que el operario esté declarado como "Apto" en el checklist de fatiga
4. Que los riesgos identificados tengan medidas de control definidas

### ¿Qué pasa si rechazo un servicio?

El servicio cambiará al estado `RECHAZADO` con su motivo registrado. El operario recibirá una notificación con los motivos del rechazo y deberá:

1. Corregir los problemas indicados
2. Reenviar los checklists a aprobación

### ¿Puedo editar mi decisión después de aprobar?

No. Una vez que se aprueba o rechaza un servicio, la decisión queda registrada. Si necesita hacer cambios, contacte al administrador del sistema.

### ¿Qué significa el indicador rojo en un checklist?

El indicador rojo significa que hay items críticos marcados como "NO" o que el operario no está apto. Deberá evaluar si los problemas son lo suficientemente graves como para rechazar el servicio.

### ¿Puedo aprobar parcialmente los checklists?

No. La aprobación es del servicio en su totalidad. Si hay problemas en un checklist específico, puede rechazar el servicio indicando el problema específico en el motivo.

### ¿Qué hago si un operario marca "No Apto" en el checklist de fatiga?

Debería rechazar el servicio inmediatamente. Un operario que no está en condiciones físicas no debe realizar el servicio. Contacte al coordinador para asignar otro operario.
