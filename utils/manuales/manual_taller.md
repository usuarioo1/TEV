# Manual de Usuario - Rol Taller

## Introducción

El rol **Taller** es responsable de gestionar las **no conformidades mecánicas y de equipos** detectadas en los checklists de los servicios de transporte así como también la resolución de hallazgos.

**Funcionalidades principales:**
- Gestión de No Conformidades (`/no-conformidades`)
- Gestión de Hallazgos (`/hallazgoschecklist`)

---

## Acceso al Sistema

1. Ingrese a la URL del sistema
2. Ingrese su nombre de usuario y contraseña
3. Presione **Iniciar sesión**

Al iniciar sesión, el sistema lo redirige automáticamente a la página de **No Conformidades**.

---

## No Conformidades

### ¿Qué son?

Son items marcados como **"No"** en los checklists de inspección de equipos (tractocamiones y semirremolques) que requieren corrección.

### Secciones Asignadas al Taller

**Tractocamión:**
- Luces y Micas (luces de freno, direccionales, estacionamiento)
- Condiciones Generales (estado general del vehículo)
- Mecánica y Motor (motor, fluidos, neumáticos, frenos)

**Semirremolque:**
- Conexiones (eléctricas y de aire)
- Neumáticos (estado y presión)
- General (estado general)
- Estructura (largueros, paneles, piso)
- Fijación (pernos, anclajes, sujetadores)

---

## Hallazgos y su Tratamiento (`/hallazgoschecklist`)

### ¿Qué es un Hallazgo?

Un hallazgo es un ítem del checklist marcado como **"SI"** que incluye observación y/o evidencia adicional (imágenes). No equivale a una no conformidad crítica, pero sí requiere seguimiento y trazabilidad.

### Secciones Asignadas al Taller

El Taller trata hallazgos en las mismas secciones técnicas que las no conformidades:

- Tractocamión: Luces y Micas, Condiciones Generales, Mecánica y Motor
- Semirremolque: Conexiones, Neumáticos, General, Estructura, Fijación

### Tratamiento Recomendado

1. Revisar el detalle del hallazgo (servicio, sección, ítem y observación).
2. Diagnosticar la condición detectada y definir acción preventiva/correctiva.
3. Registrar comentarios técnicos con el trabajo realizado.
4. Adjuntar evidencia fotográfica del avance o solución.
5. Cambiar el estado a **CERRADA** cuando la condición quede controlada.

### Diferencia con No Conformidades

- **No Conformidad:** Ítem marcado como "NO", requiere corrección obligatoria.
- **Hallazgo:** Ítem marcado como "SI" con observación, requiere seguimiento preventivo.

---

## Página de No Conformidades (`/no-conformidades`)

### Vista Principal

La página muestra:
- **Tarjetas de resumen:** Conteo de NC Abiertas y Cerradas
- **Filtros de búsqueda**
- **Tabla de no conformidades** (vista por ítem o por servicio)
- **Modal de detalle** al hacer click en una NC

### Tarjetas de Resumen

Dos tarjetas en la parte superior:

| Estado | Color | Descripción |
|--------|-------|-------------|
| **ABIERTA** | Rojo | No conformidades pendientes de resolver |
| **CERRADA** | Verde | No conformidades ya resueltas |

Haga click en una tarjeta para filtrar por ese estado.

---

## Filtros de Búsqueda

### Filtro por Estado

- **Abiertas:** Muestra solo NC pendientes de resolución
- **Cerradas:** Muestra solo NC ya resueltas
- **Todas:** Sin filtro de estado

### Filtro por Tipo de Equipo

- **Tractocamión:** Solo no conformidades del camión tractor
- **Semirremolque:** Solo no conformidades del equipo de transporte

### Búsqueda por Código

Campo de texto para buscar por código de servicio (ej: `SERV-001`).

### Filtro por Rango de Fechas

- **Desde:** Fecha inicial
- **Hasta:** Fecha final

### Limpiar Filtros

Botón para resetear todos los filtros aplicados.

---

## Gestión de No Conformidades

### Ver Detalle

Haga click en cualquier fila de la tabla para abrir el **modal de detalle**.

El modal muestra:
- **Datos del servicio** asociado
- **Tipo de checklist** (Tractocamión o Semirremolque)
- **Sección y ítem** con la no conformidad
- **Observación** registrada por el operario
- **Imágenes** adjuntas (si existen)
- **Historial de comentarios**
- **Acciones** disponibles

### Agregar Comentarios

1. En el modal de detalle, desplácese hasta la sección de comentarios
2. Escriba su comentario describiendo:
   - Diagnóstico del problema
   - Reparación realizada
   - Repuestos utilizados
3. Presione **Enviar** o **Agregar Comentario**

### Adjuntar Imágenes

1. En el modal de detalle, busque la sección de imágenes
2. Click en el botón de adjuntar/Subir imagen
3. Seleccione la imagen del equipo reparado o en proceso
4. La imagen se sube al sistema y queda asociada a la NC

### Cerrar una No Conformidad

Para cerrar una NC, debe:

1. **Revisar** los detalles de la no conformidad
2. **Realizar** la reparación o corrección necesaria
3. **Documentar** la acción con comentarios
4. **Adjuntar** evidencia (imágenes del equipo reparado)
5. **Marcar como cerrada** usando el botón de cerrar

---

## Estados de No Conformidad

| Estado | Significado | Acciones |
|--------|-------------|----------|
| **ABIERTA** | Requiere atención | Revisar, Comentar, Adjuntar imágenes, Cerrar |
| **CERRADA** | Resuelta | Ver historial, Agregar comentarios adicionales |

### Flujo de Gestión

``
ABIERTA → (reparación + comentario + imágenes) → CERRADA
``

---

## Ejemplo Práctico

**Escenario:** Se detecta una NC en "Luces de freno" en un tractocamión.

**Pasos:**

1. Entra a No Conformidades
2. Filtra por: Tractocamión + Estado: ABIERTA
3. Encuentra la NC correspondiente
4. Click en la fila para ver el detalle
5. Diagnostica: bombilla fundida
6. Reemplaza la bombilla
7. Agrega un comentario: "Bombilla de luz de freno reemplazada. Sistema verificado."
8. Adjunta foto del equipo reparado
9. Cierra la NC

---

## Recomendaciones

- **Use filtros** para priorizar su trabajo (estado, tipo, fecha)
- **Use la vista "Por Servicio"** para optimizar visitas de mantenimiento agrupando varias NC del mismo equipo
- **Documente siempre** con comentarios detallados para mantener trazabilidad
- **Adjunte imágenes** como evidencia de la reparación realizada
- **Priorice** las NC abiertas más antiguas

---

## Preguntas Frecuentes

### ¿Cómo sé qué NC me corresponden?

Todas las NC de las secciones asignadas al Taller:
- Tractocamión: Luces y Micas, Condiciones Generales, Mecánica y Motor
- Semirremolque: Conexiones, Neumáticos, General, Estructura, Fijación

### ¿Puedo ver quién detectó la NC?

Sí, en el detalle de cada NC puede ver:
- Operario que completó el checklist
- Fecha y hora de detección
- Observación original

### ¿Qué hago si una NC no corresponde a mi área?

Agregue un comentario indicando que debe ser reasignada al rol correcto y contacte al administrador.

### ¿Puedo revertir una NC cerrada?

Las NC cerradas solo permiten agregar comentarios adicionales. Si necesita reabrirla, contacte al administrador.

---

## Contacto

Si presenta problemas técnicos o dudas sobre el sistema, contacte al administrador del sistema.
