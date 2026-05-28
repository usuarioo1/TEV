# Manual de Usuario - Rol Operario

## Introducción

Este manual describe las funciones y procedimientos que un **operario** puede realizar en el sistema de gestión de transportes.

El operario es el usuario responsable de ejecutar los servicios de transporte asignados por un coordinador. Su tarea principal es completar los checklists de verificación antes de iniciar cada servicio.

---

## Acceso al Sistema

### Inicio de Sesión

1. Acceda a la URL del sistema
2. Ingrese su **nombre de usuario** y **contraseña**
3. Click en "Iniciar Sesión"

### Primera Visualización

Al iniciar sesión, será redirigido automáticamente a la página **"Mis Servicios"**. Esta es la única página principal que verá como operario.

---

## Mis Servicios

La página "Mis Servicios" muestra dos secciones:

### Servicios Activos

Muestra los servicios que están en curso y requieren alguna acción de su parte. Aquí podrá:

- Ver el código del servicio
- Ver el origen y destino del viaje
- Ver la fecha de asignación
- Ver el estado actual del servicio
- Realizar acciones según el estado

### Completados Recientemente

Muestra los últimos 5 servicios que ha completado o cancelado.

---

## Flujo de Trabajo

El flujo de trabajo del operario es el siguiente:

``
ASIGNADO → ACEPTADO → EN_CHECKLIST → PENDIENTE_APROBACION → APROBADO → EN_EJECUCION → COMPLETADO
``

### Paso 1: Recibir Servicio Asignado

Cuando un coordinador le asigna un servicio, recibirá una notificación. El servicio aparecerá en "Mis Servicios" con el estado **"ASIGNADO"**.

**Acción requerida:** Debajo del servicio, haga click en **"Aceptar Servicio"**

### Paso 2: Aceptar el Servicio

Al hacer click en "Aceptar Servicio", será dirigido a un formulario donde deberá confirmar la aceptación. El estado cambiará a **"ACEPTADO"**.

**Acción requerida:** Click en **"Iniciar Checklists"**

### Paso 3: Completar los Checklists

Deberá completar los siguientes 4 checklists (todos son obligatorios):

1. **Checklist de Fatiga y Somnolencia** - Evaluación de su estado físico
2. **Checklist Tracto Camiones** - Inspección del camión
3. **Checklist Semi-remolque** - Inspección del equipo (rampla)
4. **Análisis de Riesgo (AST/ART)** - Identificación de riesgos de la tarea

Cada checklist se puede guardar y editar antes de enviar a aprobación.

**Después de completar los 4 checklists:** Haga click en **"Enviar a Aprobación"**

### Paso 4: Esperar Aprobación del Supervisor

El servicio cambiará al estado **"PENDIENTE_APROBACION"**. El supervisor revisará los checklists y decidirá:

- **Aprobar:** Si todo está correcto
- **Rechazar:** Si hay problemas que debe corregir

Si es rechazado, deberá corregir los problemas y enviar nuevamente.

### Paso 5: Iniciar Ejecución

Una vez aprobado por el supervisor, el estado será **"APROBADO"**. Entonces podrá:

- Click en **"Iniciar Ejecución"** - Esto registra la hora de inicio

### Paso 6: Finalizar el Servicio

Después de completar el viaje, el servicio se marca como **"COMPLETADO"**  apretando el botón de finalizar servicio.

### Importante! Cuando el servicio esta aceptado por el supervisor y el operario vuelve a ingresar a su panel de servicios y revisa su servicio aprobado tiene la opción de exportar el documento de su servicio junto con sus checklist


---

## Checklists

### 3.1 Checklist de Fatiga y Somnolencia

Este checklist evalúa su estado físico antes de comenzar a trabajar.

**Información que debe ingresar:**

- Fecha y hora del control
- Lugar donde se realiza el control
- Su nombre completo
- Su RUT
- Número de licencia de conducir

**Preguntas de evaluación:**
- ¿Durmió al menos 6 horas?
- ¿Descansó adecuadamente?
- ¿Se siente con energía?
- ¿Tiene algún síntoma de enfermedad?
- ¿Consume medicamentos que puedan afectar su conducción?

**Resultado:**
- **Apto:** Puede continuar con el servicio
- **No Apto:** No puede realizar el servicio. Debe报告ar al coordinador inmediatamente

### 3.2 Checklist Tracto Camiones

Inspección detallada del tractor/camión.

**Información que debe ingresar:**

- Patente del vehículo
- Año del vehículo
- Kilometraje actual
- Nombre del conductor

**Secciones de inspección:**
1. **Documentación** - Licencia, seguro, revisión técnica, permiso de circulación
2. **EPP** - Elementos de protección personal (chaleco, calzado, etc.)
3. **Luces y Micas** - Luces de freno, direccionales, estacionamiento
4. **Condiciones Generales** - Estado general del vehículo
5. **Mecánica y Motor** - Estado del motor, fluidos, neumátros

**Importante:** Si marca "NO" en algún item de Documentación, el checklist tendrá una alerta de "crítico".

### 3.3 Checklist Semi-remolque (Equipo)

Inspección del equipo de transporte (rampla, semi-remolque).

**Información que debe ingresar:**

- Marca y modelo del equipo
- Patente
- Año
- Horómetro (horas de uso)
- Kilometraje
- Nombre del conductor
- Fecha y hora

**Secciones de inspección:**
1. **Conexiones** - Eléctricas, aire
2. **Neumáticos** - Estado, presión
3. **General** - Estado general
4. **Estructura** - Estructura del equipo
5. **Fijación** - Sujeción de elementos
6. **Documentación** - Permisos, certificados

**Importante:** Si marca "NO" enitems críticos (conexión eléctrica, conexión de aire, luces, etc.), el checklist tendrá una alerta de "crítico".

### 3.4 Análisis de Riesgo (AST/ART)

Documento que identifica los riesgos de la tarea a realizar y las medidas de control.

**Información que debe ingresar:**

- Tarea a realizar
- Fecha
- Empresa responsable
- Lugar/Área de trabajo
- Tarea normada por (qué normativa aplica)
- Nombre del documento normativo

**Elementos a completar:**
- **Preguntas integradoras:** 10 preguntas sobre la tarea
- **Riesgos potenciales:** Identificación de riesgos
- **Condiciones climáticas:** Cómo el clima afecta el trabajo
- **EPP requeridos:** Elementos de protección necesarios
- **Etapas del trabajo:** Pasos de la tarea
- **Instrucciones especiales:** Notas adicionales
- **Grupo de trabajo:** Nombres de los involucrados

---

## Estados del Servicio

| Estado | Descripción | Acción del Operario |
|--------|-------------|---------------------|
| PENDIENTE | Servicio creado por coordinador | Ninguna (esperar asignación) |
| ASIGNADO | Servicio asignado al operario | Click en "Aceptar Servicio" |
| ACEPTADO | Operario aceptó el servicio | Click en "Iniciar Checklists" |
| EN_CHECKLIST | Completando checklists | Completar los 4 checklists |
| PENDIENTE_APROBACION | Esperando revisión del supervisor | Ninguna (esperar aprobación) |
| APROBADO | Checklists aprobados por supervisor | Click en "Iniciar Ejecución" |
| EN_EJECUCION | Servicio en curso | Ninguna (el sistema lo completa) |
| COMPLETADO | Servicio finalizado | Ver en historial |
| RECHAZADO | Supervisor rechazó los checklists | Corregir y reenviar |

---

## Preguntas Frecuentes

### ¿Qué debo hacer si no puedo completar un checklist?

Cada checklist se puede guardar parcialmente. Puede salir y volver después para continuar. Los datos se mantendrán guardados.

### ¿Qué pasa si el supervisor rechaza mi servicio?

Recibirá una notificación con los motivos del rechazo. Deberá:
1. Revisar los checklists completados
2. Corregir los problemas indicados
3. Enviar nuevamente a aprobación

### ¿Puedo editar un checklist después de enviarlo a aprobación?

Sí, siempre y cuando el supervisor aún no lo haya aprobado. Puede volver a los checklists desde la página del servicio.

### ¿Qué debo hacer si no estoy apto según el checklist de fatiga?

Debe contactar inmediatamente al coordinador para reportar que no puede realizar el servicio. No debe proseguir con el trabajo.

### ¿Cómo sé si un checklist tiene problemas críticos?

En la página de checklists, si un checklist tiene items críticos marcados como "NO", aparecerá una advertencia de color rojo indicando "Completado - Crítico". Deberá revisar y corregir esos items antes de enviar a aprobación.


---

## Contacto

Si tiene problemas técnicos o dudas sobre el sistema, contacte al administrador del sistema o a su coordinator de área.