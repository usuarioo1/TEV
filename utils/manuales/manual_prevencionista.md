# Manual de Usuario - Rol Prevencionista

## Introducción

Este manual describe las funciones y procedimientos que un **prevencionista** puede realizar en el sistema de gestión de seguridad.

El prevencionista es el usuario responsable de la **gestión de seguridad** en la operación de transportes y faena. Sus funciones principales incluyen crear y asignar caminatas de seguridad, supervisar alertas de seguridad, gestionar no conformidades de EPP y verificar el cierre de alertas asignadas.

---

## Acceso al Sistema

### Inicio de Sesión

1. Acceda a la URL del sistema
2. Ingrese su **nombre de usuario** y **contraseña**
3. Click en "Iniciar Sesión"

### Primera Visualización

Al iniciar sesión, será redirigido automáticamente a la página **"Inicio"** donde verá las tarjetas de acceso a las secciones disponibles para su rol.

---

## Panel de Control (Dashboard)

El prevencionista tiene acceso al dashboard del sistema (`/dashboard`), donde puede visualizar métricas e indicadores de la operación.

### Métricas Disponibles

El dashboard muestra las siguientes métricas:

- **Servicios por Estado:** Conteo de servicios en cada estado (pendiente, aprobado, en ejecución, completado, etc.)
- **Servicios Completados:** Total de servicios finalizados (hoy, semana, mes) y comparación con mes anterior
- **Seguridad:**
  - Porcentaje de riesgos controlados
  - Total de análisis de riesgo
  - Porcentaje de equipos en condiciones
  - Total de checklists de equipo
  - Conductores no aptos y de reemplazo
  - Porcentaje de conductores aptos
  - Total de checklists de fatiga
- **Alertas:** Equipos con problemas, tractos con problemas, servicios rechazados
- **Tiempos:** Promedio de ciclo (horas) y promedio de aprobación (minutos)
- **Aprobaciones:** Tasa de aprobación y totales
- **Aceptación de Operarios:** Porcentaje y totales
- **No Conformidades:** Listado de NC por categoría y frecuencia

---

## Gestión de Caminatas de Seguridad

### Acceso

Desde la página de inicio, haga click en **"Caminatas de Seguridad"** o desde el menú superior en **"Asignar actividades"**.

### Crear y Asignar Caminatas

El prevencionista puede **crear nuevas caminatas de seguridad** y asignarlas a:

- Supervisores
- Coordinadores
- Jefaturas
- Otros prevencionistas (o autoasignarse)

### Formulario de Nueva Caminata

Al crear una caminata, debe completar:

- **Fecha programada:** Fecha en que se debe realizar la caminata
- **Zona:** Zona o área de la faena
- **Faena:** Nombre de la faena
- **Actividad:** Tipo de actividad (caminata de seguridad)
- **Asignado a:** Usuario responsable de realizar la caminata
- **Descripción:** Detalles adicionales de la caminata

### Seguimiento de Caminatas

En la página de caminatas puede:

- Ver el estado de cada caminata (pendiente, cumplida, fuera de plazo, atrasada)
- Ver quién está asignado a cada caminata
- Consultar el historial de caminatas realizadas

---

## Alertas de Seguridad

### Tipos de Alertas

El sistema gestiona diferentes tipos de alertas de seguridad:

1. **Caminatas de Seguridad** - Inspecciones en terreno
2. **Reportes de Peligro** - Reportes de condiciones peligrosas identificadas
3. **Tarjetas Stop (Alto)** - Tarjetas de parada por condiciones inseguras
4. **Controles ART** - Control de análisis de riesgos del trabajo

### Mis Alertas Pendientes

Acceda a **"Mis Actividades Pendientes"** en el inicio para ver que actividades tiene asignadas o cierres tiene pendiente o No conformidades o hallazgos que atender.

Por cada alerta pendiente debe:

1. Revisar los detalles de la alerta
2. Implementar las medidas correctivas necesarias
3. Cerrar la alerta indicando la solución implementada

### Todas las Alertas

Acceda a **"Todas las Alertas"** (`/caminatas/alertas`) para visualizar el registro completo de alertas de seguridad del sistema, independientemente de su responsable.

### Verificación de Cierres

El prevencionista puede **verificar el cierre de alertas** previamente reportadas, confirmando que los problemas identificados fueron corregidos adecuadamente.

---

## No Conformidades

### Acceso

Desde la página de inicio, haga click en **"No Conformidades"** (`/no-conformidades`).

### Funcionalidades

Como prevencionista, puede:

- **Ver no conformidades** de EPP detectadas en los checklists de los operarios
- **Gestionar las no conformidades** asignadas a su rol
- **Dar seguimiento** a las correcciones realizadas

Las no conformidades de EPP son generadas cuando un operario marca como "NO" algún item relacionado con elementos de protección personal en los checklists de inspección.

---

## Hallazgos y su Tratamiento

### Acceso

Desde la página de inicio, haga click en **"Hallazgos"** (`/hallazgoschecklist`).

### ¿Qué es un Hallazgo?

Un hallazgo es un ítem marcado como **"SI"** en checklist, pero con observación y/o evidencia adicional. Se registra para seguimiento preventivo y trazabilidad.

### Responsabilidad del Prevencionista

El prevencionista gestiona hallazgos de su área, principalmente los asociados a **EPP** y condiciones de seguridad operativa.

### Tratamiento Recomendado

1. Revisar el contexto del servicio, sección y evidencia del hallazgo.
2. Evaluar el riesgo y definir acción preventiva o correctiva.
3. Registrar comentarios de seguimiento en el historial.
4. Adjuntar evidencia de gestión/corrección cuando corresponda.
5. Cambiar estado a **CERRADA** cuando el hallazgo quede tratado.

### Diferencia con No Conformidades

- **No Conformidad:** Ítem "NO", requiere corrección obligatoria.
- **Hallazgo:** Ítem "SI" con observación, requiere tratamiento y seguimiento.

---

## Consulta de Equipos

### Acceso

Desde la página de inicio, haga click en **"Equipos"** (`/equipos`).

### Funcionalidades

El prevencionista puede consultar información de:

- **Tractocamiones:** Ver estado, historial de mantenimiento, checklists realizados
- **Semirremolques (Equipos):** Ver estado, historial, inspecciones

Esta funcionalidad permite hacer seguimiento del estado de los equipos y las no conformidades mecánicas asociadas.

---

## Estados del Servicio

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Servicio creado por coordinador |
| ASIGNADO | Servicio asignado al operario |
| ACEPTADO | Operario aceptó el servicio |
| EN_CHECKLIST | Operario completando checklists |
| PENDIENTE_APROBACION | Esperando revisión del supervisor |
| APROBADO | Checklists aprobados |
| EN_EJECUCION | Servicio en curso |
| COMPLETADO | Servicio finalizado |
| RECHAZADO | Supervisor rechazado |

---

## Preguntas Frecuentes

### ¿Puedo aprobar o rechazar servicios?

No. La aprobación de servicios es responsabilidad del supervisor. El prevencionista supervisa las alertas de seguridad y las no conformidades.

### ¿Qué puedo hacer si veo una alerta de seguridad crítica?

Si detecta una condición peligrosa, puede crear un **Reporte de Peligro** desde la sección de caminatas de seguridad, assignándolo al responsable correspondiente para su cierre.

### ¿Cómo asigno una caminata de seguridad?

1. Vaya a "Caminatas de Seguridad" o click en "Asignar actividades"
2. Click en "Nueva Caminata" o botón de crear
3. Complete el formulario con fecha, zona, faena y asignado
4. Envíe la asignación

### ¿Qué hago cuando me asignan una alerta como responsable de cierre?

1. Acceda a "Mis Alertas Pendientes"
2. Revise los detalles de la alerta
3. Implemente las medidas correctivas
4. Cierre la alerta con el detalle de la solución

### ¿Puedo ver los servicios en ejecución?

Sí, puede consultar el estado de los servicios desde el dashboard o desde la sección de servicios (consulta únicamente, sin capacidad de aprobación).

---

## Contacto

Si tiene problemas técnicos o dudas sobre el sistema, contacte al administrador del sistema.