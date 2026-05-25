# Manual de Usuario - Rol Coordinador



## Introducción

El rol **Coordinador** es responsable de la **gestión de servicios de transporte**, asignando operarios y supervisando el progreso de cada servicio desde su creación hasta su finalización.

---

## Acceso al Sistema

1. Ingrese a la URL del sistema
2. Ingrese su nombre de usuario y contraseña
3. Presione **Iniciar sesión**

Al iniciar sesión, el sistema lo redirige a la página de **Inicio**.

---

## Página de Inicio

Al entrar como Coordinador, ve tres bloques principales:

1. **Actividades Pendientes** - Actividades asignadas por prevencionista para completar
2. **No Conformidades** - Gestión de No Conformidades de documentación en camiones y semi-remolques.
3. **Reportar** - Reportes
4. **Gestión de servicios** - asignación de servicios a operarios 


---

## Servicios (`/servicios`)

### Se accede con el botón gestión de servicios en la parte superior de la página.

La página muestra:
- **Estadísticas:** Servicios Activos, Pendientes de Acción, Completados
- **Servicios Activos:** Lista de servicios en curso
- **Botón "Crear Servicio":** Para nuevos servicios

### Tarjetas de Estadísticas

| Tarjeta | Descripción |
|---------|-------------|
| **Servicios Activos** | Total de servicios en curso |
| **Pendientes de Acción** | Servicios esperando aceptación o en checklists |
| **Completados (Total)** | Servicios finalizados |

---

## Crear un Servicio (`/servicios/nuevo`)

### Formulario de Creación -->  al hacer clic en crear servicio

Campos obligatorios:
- **Código del Servicio:** Identificador único (o generar automáticamente)
- **Descripción:** Detalle del servicio a realizar
- **Origen:** Punto de partida
- **Destino:** Punto de llegada
- **Operario:** Seleccionar de la lista de operarios disponibles

Campos opcionales:
- **Teléfono de Origen:** Contacto en punto de partida
- **Teléfono de Destino:** Contacto en punto de llegada
- **Observaciones:** Información adicional

### Generar Código Automático

Haga click en el botón de actualizar para generar un código con formato:
`SRV-AAAA-MMDD-HHmm` (ej: `SRV-2026-0510-1430`)

### Selección de Operario

Elija un operario de la lista desplegable. Solo aparecen operarios activos en el sistema.

### Resultado

Al crear el servicio:
- El servicio se crea en estado **ASIGNADO**
- El operario seleccionado lo verá en su sección de servicios
- El operario debe aceptar el servicio para continuar

---

## Seguimiento de Servicios

### Ver Servicios Activos

En la página `/servicios` puede ver todos los servicios que ha creado.

Cada servicio muestra:
- Código y descripción
- Operario asignado
- Estado actual
- Fecha de asignación

### Estados del Servicio

| Estado | Significado |
|--------|-------------|
| **ASIGNADO** | Servicio creado, operario debe aceptarlo |
| **ACEPTADO** | Operario aceptó, esperando inicio de checklists |
| **EN_CHECKLIST** | Operario completando los 4 checklists |
| **PENDIENTE_APROBACION** | Esperando revisión del supervisor |
| **APROBADO** | Supervisor aprobó, operario puede iniciar |
| **EN_EJECUCION** | Servicio en curso |
| **COMPLETADO** | Servicio finalizado |
| **RECHAZADO** | Supervisor rechazó, operario corregirá |

### Nota sobre Gestión

Después de crear un servicio, el coordinador **no realiza acciones directas** sobre el mismo. El flujo lo gestionan:
- **Operario:** Acepta, completa checklists, inicia/finaliza ejecución
- **Supervisor:** Aprueba o rechaza después de los checklists

---

## Caminatas de Seguridad (`/caminatas`)

### Registro de Caminatas

Como coordinador, puede registrar caminatas de seguridad no programadas (auto-asignadas).

### Tipos de Registro

1. **Reporte de Peligro:** Condiciones peligrosas identificadas
2. **Tarjeta Stop (Alto):** Parada por condiciones inseguras
3. **Control ART:** Control de análisis de riesgos

### Crear un Reporte

1. Vaya a la sección de Reportar en el menú
2. Seleccione el tipo de reporte
3. Complete los campos del formulario
4. Asigne un responsable de cierre
5. Envíe el reporte

### Estados de las Alertas (El flujo completo solo aplica para reportes de peligro, Tarjetas alto/Stop y controles ART )

| Estado | Significado |
|--------|-------------|
| **PENDIENTE** | Reporte creado, esperando atención |
| **EN_REVISION** | Siendo revisado |
| **PENDIENTE_VERIFICACION** | Cierre realizado, esperando verificación |
| **CERRADO** | Alerta verificada y cerrada |

---

## No Conformidades (`/no-conformidades`)

### Secciones Asignadas al Coordinador

El coordinador es responsable de las NC relacionadas con **Documentación**:
- Licencia de conducir
- Seguro obligatorio
- Revisión técnica
- Permiso de circulación

### Gestión de No Conformidades

1. **Filtrar** por estado o tipo de equipo
2. **Ver detalles** de cada NC
3. **Agregar comentarios** sobre las acciones tomadas
4. **Adjuntar imágenes** de documentación corregida
5. **Cerrar** la NC una vez resuelta

---

## Hallazgos y su Tratamiento (`/hallazgoschecklist`)

### ¿Qué es un Hallazgo?

Un hallazgo corresponde a un ítem marcado como **"SI"** en checklist, pero que incluye observación y/o evidencia adicional para seguimiento.

### Sección Asignada al Coordinador

El coordinador es responsable de hallazgos vinculados a **Documentación**:

- Licencia de conducir
- Seguro obligatorio
- Revisión técnica
- Permiso de circulación

### Tratamiento Recomendado

1. Revisar el detalle del hallazgo y la observación registrada.
2. Solicitar/validar documentación vigente al operario o responsables.
3. Registrar comentarios de seguimiento en el historial.
4. Adjuntar evidencia documental cuando corresponda.
5. Cambiar estado a **CERRADA** cuando el hallazgo quede regularizado.

### Diferencia con No Conformidades

- **No Conformidad:** Ítem "NO" que exige corrección obligatoria.
- **Hallazgo:** Ítem "SI" con observación, para control preventivo y trazabilidad.

---

## Estados del flujo de un servicio asignado

| Estado | Descripción |
|---|---|
| `ASIGNADO` | El servicio fue creado y asignado al operario |
| `ACEPTADO` | El operario aceptó el servicio |
| `EN_CHECKLIST` | El operario está completando formularios y checklists |
| `PENDIENTE_APROBACION` | Esperando revisión del supervisor |
| `APROBADO` | El supervisor aprobó el servicio |
| `RECHAZADO` | El supervisor solicitó correcciones |
| `EN_EJECUCION` | El operario comenzó la ejecución del trabajo |
| `COMPLETADO` | El servicio terminó correctamente |

---

## Recomendaciones

- **Asigne siempre** un operario disponible al crear el servicio
- **Agregue observaciones** detalladas para facilitar la ejecución
- **Mantenga contacto** con los operarios para seguimiento
- **Documente** todas las no conformidades de documentación

---

## Preguntas Frecuentes

### ¿Puedo modificar un servicio después de crearlo?

No. Una vez creado el servicio, los datos no pueden modificarse. Si necesita cambios, debe cancelar el servicio y crear uno nuevo.

### ¿Qué hago si no hay operarios disponibles?

Contacte a Jefaturas para que gestione la disponibilidad de operarios.

### ¿Puedo cancelar un servicio?

Sí. Contacte al administrador del sistema para cancelar un servicio existente.

### ¿Cómo sigo el progreso de un servicio?

En la página de Servicios (botón `Gestión de servicios`), puede ver el estado actual de cada servicio que ha creado.

### ¿Qué responsabilidad tengo en las no conformidades?

Usted es responsable de las NC relacionadas con **documentación** (licencias, seguros, permisos). Las NC de EPP corresponden a Prevencionista y las mecánicas a Taller.

---

## Contacto

Si presenta problemas técnicos o dudas sobre el sistema, contacte al administrador del sistema.
