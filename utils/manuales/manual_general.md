# Manual de Usuario - Sistema de Gestión de Transportes

---

## Introducción

Este manual describe el Sistema de Gestión de Transportes, una plataforma web diseñada para gestionar de forma integral las operaciones de transporte, seguridad ocupacional y mantenimiento de equipos.

### Características Principales

- **Gestión de Servicios:** Creación, asignación y seguimiento de servicios de transporte
- **Checklists de Seguridad:** Inspección de operarios, vehículos y equipos antes de cada servicio
- **Caminatas de Seguridad:** Inspecciones en terreno con asignación de responsables
- **Alertas de Seguridad:** Reportes de peligro, tarjetas stop y controles ART
- **No Conformidades:** Seguimiento de items defectuosos detectados en checklists
- **Dashboards:** Métricas e indicadores de operaciones y seguridad
- **Gestión de Equipos:** Administración de tractocamiones y semirremolques

---

## Roles del Sistema

El sistema cuenta con **6 roles** con diferentes permisos y funcionalidades:

| Rol | Descripción |
|-----|-------------|
| **Operario** | Conductor que ejecuta los servicios de transporte |
| **Supervisor** | Revisa y aprueba los checklists antes de cada servicio |
| **Prevencionista** | Gestiona la seguridad y asigna caminatas de seguridad |
| **Coordinador** | Gestiona los servicios y asigna operarios |
| **Taller** | Gestiona el mantenimiento y condiciones mecánicas de equipos |
| **Jefaturas** | Supervisión general, administración de usuarios y equipos |

---

## Acceso y Navegación

### Inicio de Sesión

1. Acceda a la URL del sistema
2. Ingrese su **nombre de usuario** y **contraseña**
3. Click en "Iniciar Sesión"

### Redirección Automática

Al iniciar sesión, cada rol es redirigido a su página principal:

| Rol | Página Principal |
|-----|------------------|
| Operario | Mis Servicios (`/servicios`) |
| Supervisor | Panel de Supervisor (`/supervisor`) |
| Prevencionista | Inicio (`/`) |
| Coordinador | Inicio (`/`) |
| Taller | No Conformidades (`/no-conformidades`) |
| Jefaturas | Inicio (`/`) |

### Barra de Navegación

La barra de navegación superior contiene:

- **Inicio:** Página principal del usuario
- **Menús específicos por rol** (visibles según permisos)
- **Administración:** Gestión de usuarios y equipos (solo Jefaturas)
- **Cerrar Sesión:** Finalizar sesión

---

## Módulos Comunes

### Gestión de Servicios

El módulo de servicios gestiona el ciclo completo de cada viaje de transporte.

#### Estados del Servicio

| Estado | Descripción | Acción Requerida |
|--------|-------------|-----------------|
| PENDIENTE | Servicio creado por coordinador | Ninguna (esperar asignación) |
| ASIGNADO | Servicio asignado al operario | Operario debe aceptar |
| ACEPTADO | Operario aceptó el servicio | Operario inicia checklists |
| EN_CHECKLIST | Completando checklists | Operario completa 4 checklists |
| PENDIENTE_APROBACION | Esperando revisión del supervisor | Supervisor revisa y aprueba/rechaza |
| APROBADO | Checklists aprobados | Operario inicia ejecución |
| EN_EJECUCION | Servicio en curso | Sistema registra tiempo |
| COMPLETADO | Servicio finalizado | Ninguna |
| RECHAZADO | Supervisor rechazó los checklists | Operario corrige y reenvía |
| CANCELADO | Servicio cancelado | Ninguna |

### Checklists de Seguridad

Antes de cada servicio, el operario debe completar **4 checklists obligatorios**:

1. **Checklist de Fatiga y Somnolencia**
   - Evalúa condiciones físicas del operario
   - Resultado: Apto o No Apto
   - Si es "No Apto", debe reportar al coordinador inmediatamente

2. **Checklist Tracto Camiones**
   - Inspección del vehículo tractor
   - Secciones: Documentación, EPP, Luces y Micas, Condiciones Generales, Mecánica y Motor

3. **Checklist Semi-remolque (Equipo)**
   - Inspección del equipo de transporte
   - Secciones: Conexiones, Neumáticos, General, Estructura, Fijación, Documentación

4. **Análisis de Riesgo (AST/ART)**
   - Identificación de riesgos de la tarea
   - Incluye: preguntas integradoras, riesgos potenciales, EPP requeridos, etapas del trabajo

### Indicadores Visuales

Cada checklist muestra un indicador tipo semáforo:

- **Verde:** Todos los items críticos marcados como "Sí"
- **Rojo:** Algún item crítico marcado como "No" o problemas críticos

### Caminatas de Seguridad

Las caminatas de seguridad son inspecciones en terreno que pueden ser:

- **Programadas:** Asignadas por un prevencionista
- **No programadas:** Realizadas espontáneamente

#### Estados de Caminata

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Caminata creada, esperando ejecución |
| EN_PROCESO | Caminata en curso |
| COMPLETADA | Caminata finalizada |
| CANCELADA | Caminata cancelada |

### Alertas de Seguridad

El sistema gestiona tres tipos de alertas:

1. **Reportes de Peligro:** Condiciones peligrosas identificadas
2. **Tarjetas Stop (Alto):** Parada por condiciones inseguras
3. **Controles ART:** Control de análisis de riesgos del trabajo

#### Estados de Alerta

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Alerta creada, esperando atención |
| EN_REVISION | Alerta siendo revisada |
| PENDIENTE_VERIFICACION | Cierre realizado, esperando verificación |
| CERRADO | Alerta verificada y cerrada |

### No Conformidades

Las no conformidades son items marcados como "No" en los checklists que requieren corrección.

#### Estados

| Estado | Descripción |
|--------|-------------|
| ABIERTA | Requiere atención y corrección |
| CERRADA | Ha sido resuelta |

#### Distribución por Rol

| Sección | Rol Responsable |
|---------|-----------------|
| Documentación | Coordinador |
| EPP | Prevencionista |
| Luces y Micas | Taller |
| Condiciones Generales | Taller |
| Mecánica y Motor | Taller |
| Conexiones | Taller |
| Neumáticos | Taller |
| General | Taller |
| Estructura | Taller |
| Fijación | Taller |

### Equipos

El módulo de equipos permite gestionar:

- **Tractocamiones:** Camiones tractores
- **Semirremolques:** Equipos de transporte (ramplas)

#### Gestión por Rol

| Acción | Rol Autorizado |
|--------|----------------|
| Crear equipo | Jefaturas |
| Editar equipo | Jefaturas |
| Activar/Inactivar | Jefaturas |
| Consultar | Todos |

---

## Rol Operario

### Descripción

El operario es el **conductor** responsable de ejecutar los servicios de transporte asignados.

### Funcionalidades

1. **Mis Servicios:** Ver y gestionar servicios asignados
2. **Checklists:** Completar los 4 checklists de seguridad
3. **Historial:** Ver servicios completados

### Flujo de Trabajo

```
ASIGNADO → ACEPTADO → EN_CHECKLIST → PENDIENTE_APROBACION → APROBADO → EN_EJECUCION → COMPLETADO
```

### Acciones del Operario

1. **Recibir Servicio:** Ver servicio con estado "ASIGNADO"
2. **Aceptar Servicio:** Click en "Aceptar Servicio"
3. **Completar Checklists:** Completar los 4 checklists obligatorios
4. **Enviar a Aprobación:** Enviar checklists al supervisor
5. **Iniciar Ejecución:** Después de aprobado, click en "Iniciar Ejecución"
6. **Finalizar Servicio:** Marcar servicio como completado

### Importante

- Si el checklist de fatiga muestra "No Apto", **no debe proseguir** con el servicio
- Cada checklist se puede guardar parcialmente
- Puede editar checklists mientras el supervisor no los haya aprobado

---

## Rol Supervisor

### Descripción

El supervisor es responsable de **revisar y aprobar** los checklists completados por los operarios.

### Funcionalidades

1. **Panel de Control:** Estadísticas y servicios pendientes
2. **Aprobar/Rechazar:** Decidir sobre los servicios pendientes
3. **Monitoreo:** Ver servicios en ejecución y completados
4. **Reportes de Seguridad:** Crear reportes, tarjetas stop y controles ART

### Panel de Control

Muestra tarjetas con conteo de servicios por estado:
- Pendientes, Aprobados, En Ejecución, Completados, Rechazados

### Proceso de Aprobación

1. **Seleccionar Servicio:** Click en un servicio pendiente
2. **Revisar Checklists:** Ver los 4 checklists completados
3. **Evaluar Indicadores:** Semáforo verde/rojo por checklist
4. **Decidir:**
   - **Aprobar:** Sin items críticos marcados como "No"
   - **Rechazar:** Con motivo obligatorio si hay problemas

### Firma Digital

Cada aprobación/rechazo genera un registro con:
- ID del supervisor
- ID del servicio
- Fecha y hora
- Observaciones o motivo

---

## Rol Prevencionista

### Descripción

El prevencionista gestiona la **seguridad ocupacional**, creando caminatas y supervisando alertas.

### Funcionalidades

1. **Caminatas de Seguridad:** Crear y asignar caminatas
2. **Mis Alertas Pendientes:** Gestionar alertas asignadas
3. **Todas las Alertas:** Ver todos los reportes
4. **No Conformidades:** Gestionar NC de EPP
5. **Equipos:** Consultar inventario
6. **Dashboard:** Métricas de seguridad y operaciones

### Creación de Caminatas

1. Ir a "Caminatas de Seguridad"
2. Click en "Nueva Caminata"
3. Completar: Zona, Faena, Actividad
4. Asignar a: Supervisor, Coordinador, Jefatura u otro Prevencionista
5. Enviar asignación

### Gestión de Alertas

Como responsable de cierre, el prevencionista puede:

1. **Revisar** los detalles de cada alerta
2. **Implementar** medidas correctivas
3. **Cerrar** la alerta con comentario y opcional imagen
4. **Devolver** para retroceso cuando aplique

### Verificación de Cierres

El prevencionista puede verificar que los cierres de alertas fueron realizados correctamente.

---

## Rol Coordinador

### Descripción

El coordinador gestiona los **servicios de transporte**, asignando operarios y equipos.

### Funcionalidades

1. **Servicios:** Crear, gestionar y consultar servicios
2. **Caminatas de Seguridad:** Registrar inspecciones
3. **No Conformidades:** Gestionar NC de documentación

### Creación de Servicios

1. Ir a "Servicios"
2. Click en "Nuevo Servicio"
3. Completar datos:
   - Descripción
   - Origen y destino
   - Teléfonos de contacto
4. **Asignar operario** (seleccionar de lista)
5. Crear servicio

### Estados de Servicio para Coordinador

| Estado | Acción del Coordinador |
|--------|----------------------|
| PENDIENTE | Ninguna (esperar asignación) |
| ASIGNADO | Ninguna (operario debe aceptar) |
| ACEPTADO | Ninguna (operario en checklists) |
| EN_CHECKLIST | Ninguna (operario en checklists) |
| PENDIENTE_APROBACION | Ninguna (supervisor debe aprobar) |
| APROBADO | Ninguna (esperar inicio) |
| EN_EJECUCION | Ninguna (en curso) |
| COMPLETADO | Ninguna (finalizado) |
| RECHAZADO | Ninguna (operario corregirá) |

### No Conformidades de Documentación

El coordinador es responsable de las NC relacionadas con documentación (licencias, seguros, permisos).

---

## Rol Taller

### Descripción

El taller gestiona el **mantenimiento y condiciones mecánicas** de los equipos de transporte.

### Funcionalidades

1. **No Conformidades:** Gestionar NC mecánicas y de equipos
2. **Equipos:** Consultar inventario de tractocamiones y semirremolques

### Página Principal

Al iniciar sesión, es redirigido a **No Conformidades** (`/no-conformidades`).

### Secciones de Checklist Asignadas

**Tractocamión:**
- Luces y Micas
- Condiciones Generales
- Mecánica y Motor

**Semirremolque:**
- Conexiones (eléctricas y de aire)
- Neumáticos
- General
- Estructura
- Fijación

### Gestión de No Conformidades

1. **Filtrar** por estado, tipo de equipo o fecha
2. **Elegir vista** (por ítem o por servicio)
3. **Revisar detalles** de cada NC
4. **Implementar medidas correctivas**
5. **Documentar** con comentarios e imágenes
6. **Cerrar** la NC una vez resuelta

---

## Rol Jefaturas

### Descripción

Las jefaturas tienen **control transversal** del sistema, administrando usuarios, equipos y visualizando métricas globales.

### Funcionalidades

1. **Actividades Pendientes:** Ver caminatas, tareas y alertas asignadas
2. **Reportar:** Crear reportes de seguridad
3. **Dashboards:** Operaciones y Seguridad
4. **Gestión de Usuarios:** Crear y editar usuarios
5. **Gestión de Equipos:** Crear, editar y gestionar equipos

### Dashboards

#### Dashboard Operaciones (`/dashboard/operaciones`)

- KPIs de servicios por estado
- Servicios completados y aprobaciones
- No conformidades operativas
- Filtro por rango de fechas
- Exportación a Excel

#### Dashboard Seguridad (`/dashboard/gestion-desempeno`)

- Cumplimiento por tipo de actividad
- Actividades por rol
- Distribución de estatus por usuario
- Comparativos programadas vs no programadas

### Gestión de Usuarios

Acceso: `/users`

Permite:
- Ver listado total de usuarios
- Crear nuevo usuario
- Editar nombre y email
- Asignar rol

### Gestión de Equipos

Acceso: `/equipos`

Permite:
- Crear tractocamiones y semirremolques
- Editar registros existentes
- Activar/Inactivar equipos

---

## Flujos de Trabajo

### Flujo Completo de un Servicio

```
1. Coordinador crea servicio
   ↓
2. Operario recibe asignación (ASIGNADO)
   ↓
3. Operario acepta servicio (ACEPTADO)
   ↓
4. Operario completa 4 checklists (EN_CHECKLIST)
   ↓
5. Operario envía a aprobación (PENDIENTE_APROBACION)
   ↓
6. Supervisor revisa y aprueba/rechaza
   ↓
   ├─► APRUEBA → (APROBADO) → Operario inicia ejecución (EN_EJECUCION) → Operario finaliza (COMPLETADO)
   │
   └─► RECHAZA → (RECHAZADO) → Operario corrige → Reenvía a aprobación
```

### Flujo de Caminatas de Seguridad

```
1. Prevencionista crea caminata
   ↓
2. Asignado recibe caminata
   ↓
3. Asignado realiza caminata
   ↓
4. Prevencionista verifica cierre
   ↓
5. Caminata marcada como completada
```

### Flujo de No Conformidades

```
1. Operario marca item como "No" en checklist
   ↓
2. Sistema genera NC según sección
   ↓
3. Rol responsable es notificado
   ↓
4. Responsable revisa y corrige
   ↓
5. Responsable cierra NC con comentario
```

---

## Glosario

| Término | Definición |
|---------|------------|
| **AST/ART** | Análisis de Seguridad en el Trabajo / Análisis de Riesgos del Trabajo |
| **Checklist** | Lista de verificación de items de inspección |
| **EPP** | Elementos de Protección Personal |
| **NC** | No Conformidad - Item defectuoso o incompleto |
| **Semirremolque** | Equipo de transporte (rampla) arrastrado por el tractocamión |
| **Tractocamión** | Camión tractor que arrastra el semirremolque |
| **Tarjeta Stop** | Tarjeta de parada de trabajo por condición insegura |
| **Checklist de Fatiga** | Evaluación del estado físico del operario |
| **Firma Digital** | Registro automático de aprobación/rechazo con fecha y hora |

---

## Contacto

Si tiene problemas técnicos o dudas sobre el sistema, contacte al administrador del sistema.
