# Actualización del Formulario de Análisis Seguro de la Tarea (AST)

## Resumen de Cambios

Se ha actualizado completamente el formulario de **Análisis de Riesgos** para convertirlo en un **Análisis Seguro de la Tarea (AST)** siguiendo la estructura del documento `formularioast.md`.

## 📋 Cambios Realizados

### 1. Schema de Prisma (`prisma/schema.prisma`)

**Modelo AnalisisRiesgo actualizado:**

Se ha reemplazado completamente la estructura anterior con los 10 pasos del formulario AST:

- ✅ **PASO 1**: Antecedentes Generales del Trabajo
  - `tareaRealizar`, `fecha`, `empresaResponsable`, `lugarAreaTrabajo`
  - `tareaNormadaPor` (AST o Documento), `nombreDocumento`

- ✅ **PASO 2**: Preguntas a los Integrantes del Trabajo (12 preguntas SI/NO)
  - `preguntasIntegrantes` (JSON)
  - La pregunta 12 incluye selección múltiple de aspectos ambientales

- ✅ **PASO 3**: Control del Supervisor
  - `controlSupervisor` (textarea)

- ✅ **PASO 4**: Identificación de Riesgos Potenciales (26 riesgos SI/NO)
  - `riesgosPotenciales` (JSON)

- ✅ **PASO 5**: Condiciones Adversas Climáticas y/o Terreno
  - `condicionesClimaticas` (JSON con selección múltiple)
  - Incluye opción "Otro" con campo de texto libre

- ✅ **PASO 6**: EPP y Elementos Requeridos
  - `eppElementos` (JSON con selección múltiple de 23 elementos)

- ✅ **PASO 7**: Etapas, Identificación de Peligros, Riesgos y Medidas de Control
  - `etapasTrabajo` (JSON array dinámico)
  - Campos: etapa, peligros, riesgos, medidasControl

- ✅ **PASO 8**: Instrucciones Especiales del Supervisor
  - `instruccionesEspeciales` (textarea)

- ✅ **PASO 9**: Identificación del Grupo de Trabajo
  - `grupoTrabajo` (JSON array dinámico)
  - Campos: nombre, rut (solo estos dos, sin firma)

- ✅ **PASO 10**: Firma de Aprobación para Comenzar la Tarea
  - `supervisorResponsableId` (relación con User - dropdown de supervisores)
  - `fechaAprobacion` (automática al guardar)
  - **Sin campos de firma** según requerimiento

**Modelo User actualizado:**
- Se agregó la relación inversa `analisisRiesgoAprobados` para los análisis donde el usuario es supervisor responsable

### 2. Componente React (`components/servicios/checklists/AnalisisRiesgoForm.tsx`)

**Completamente reescrito:**

- ✅ Estructura de 10 pasos claramente separados
- ✅ PASO 2: Radio buttons SI/NO para las 12 preguntas
- ✅ PASO 2 - Pregunta 12: Checkboxes de selección múltiple para aspectos ambientales
- ✅ PASO 4: 26 riesgos con radio buttons SI/NO
- ✅ PASO 5: Checkboxes de selección múltiple para condiciones climáticas + campo "Otro"
- ✅ PASO 6: Checkboxes de selección múltiple para 23 EPP y elementos
- ✅ PASO 7: Tabla dinámica similar a la anterior pero con nuevos campos
- ✅ PASO 8: Textarea para instrucciones especiales
- ✅ PASO 9: Array dinámico de participantes (nombre y rut, sin firma)
- ✅ PASO 10: Dropdown de supervisores y fecha automática (sin firma)

**Validaciones implementadas:**
- Todos los pasos obligatorios validados
- Verificación de que todas las preguntas sean respondidas
- Validación de selecciones múltiples (al menos una opción)
- Validación de etapas completas

### 3. API Route (`app/api/servicios/[id]/checklists/riesgo/route.ts`)

**Actualizado completamente:**

- ✅ Acepta la nueva estructura de datos con los 10 pasos
- ✅ Validaciones para cada paso:
  - Paso 1: campos obligatorios
  - Paso 2: 12 preguntas respondidas
  - Paso 3: control del supervisor si hay respuestas NO
  - Paso 4: todos los riesgos respondidos
  - Paso 5: al menos una condición seleccionada
  - Paso 6: al menos un EPP seleccionado
  - Paso 7: al menos una etapa completa
  - Paso 10: supervisor responsable seleccionado
- ✅ Verificación de que el supervisor seleccionado existe y tiene el rol correcto
- ✅ Guarda correctamente todos los campos JSON

### 4. API Users (`app/api/users/route.ts`)

**Actualizado:**
- ✅ Ahora acepta query parameter `rol` para filtrar usuarios
- ✅ Permite obtener solo supervisores: `/api/users?rol=supervisor`

### 5. Base de Datos

**Migración aplicada:**
- ✅ La base de datos fue reseteada y actualizada con la nueva estructura
- ✅ Se ejecutó el seed para repoblar datos de prueba
- ✅ Cliente de Prisma regenerado

**⚠️ IMPORTANTE:** Se eliminaron 4 registros existentes en AnalisisRiesgo durante la migración debido a incompatibilidad de estructura.

## 🎯 Características Implementadas Según Requerimientos

### ✅ Estructura por Pasos
- Los 10 pasos están claramente separados y organizados visualmente

### ✅ Pregunta 12 del Paso 2 - Selección Múltiple
- Checkboxes para los 6 aspectos ambientales:
  - Generación RESPEL
  - Generación Residuo No Peligro
  - Generación Derrame
  - Generación Emisiones Atmosféricas
  - Consumo Hídrico
  - Consumo Eléctrico

### ✅ Paso 5 - Selección Múltiple con "Otro"
- Checkboxes para: Viento, Lluvia, Hielo, Barro, Nieve, Terreno en desnivel
- Checkbox "Otro" con campo de texto habilitado al marcarlo

### ✅ Paso 7 - Tabla Dinámica Actualizada
- Similar al formulario anterior pero con las nuevas preguntas del AST:
  - ¿Qué voy hacer? Paso a Paso (ETAPA)
  - ¿Con qué interactúo en mi tarea? (PELIGROS)
  - ¿Qué me podría suceder o dañar? (RIESGOS)
  - ¿Cómo puedo evitar el daño o accidente? (MEDIDAS DE CONTROL)

### ✅ Paso 8 - Textarea
- Campo de texto libre para instrucciones especiales del supervisor

### ✅ Paso 9 - Participantes Dinámicos
- Se pueden agregar/eliminar participantes dinámicamente
- Solo campos: nombre y rut
- Sin firma (según requerimiento)

### ✅ Paso 10 - Supervisor y Fecha
- Dropdown con lista de supervisores
- Fecha automática al guardar
- Sin firma (según requerimiento)

## 📁 Archivos Modificados

1. `prisma/schema.prisma` - Schema actualizado
2. `components/servicios/checklists/AnalisisRiesgoForm.tsx` - Componente completamente reescrito
3. `app/api/servicios/[id]/checklists/riesgo/route.ts` - API route actualizado
4. `app/api/users/route.ts` - Agregado filtro por rol
5. `prisma/migrations/manual_actualizar_ast_formulario.sql` - Script de migración manual (referencia)

## 🚀 Siguientes Pasos

Para usar el nuevo formulario:

1. Inicie sesión como operario (ej: `diana / diana123`)
2. Vaya a un servicio asignado
3. Acceda a "Checklists"
4. Complete el "Análisis Seguro de la Tarea (AST)"

## 📝 Datos de Prueba

Los siguientes usuarios están disponibles después del seed:

- **Supervisores**: francisco / francisco123
- **Operarios**: diana / diana123, edward / edward123, gabriela / gabriela123, hector / hector123
- **Coordinadores**: charlie / charlie123, isabel / isabel123

## ✨ Mejoras Adicionales

- Interfaz moderna y responsive
- Validaciones en tiempo real
- Mensajes de error claros y específicos
- Organización visual clara de los 10 pasos
- Auto-población de datos del usuario logueado
- Fecha automática en el paso 10

---

**Fecha de actualización:** 10 de Marzo de 2026
**Estado:** ✅ Completado y funcional
