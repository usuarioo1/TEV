# Flujo de Trabajo - Servicio de Transporte

## Flujo Previo al Inicio del Servicio

Este documento describe el proceso completo que debe seguirse **antes** de que un servicio pueda iniciarse.

---

## 1️⃣ Creación del Servicio (PENDIENTE)

**Actor:** Coordinador / Jefatura

- Se crea un nuevo servicio con datos básicos: código, descripción, origen, destino
- **Estado inicial:** `PENDIENTE`
- El servicio aún no está asignado a ningún operario

---

## 2️⃣ Asignación del Servicio (ASIGNADO)

**Actor:** Coordinador / Jefatura

- Se asigna el servicio a un operario específico
- **Transición:** `PENDIENTE` → `ASIGNADO`
- El operario recibe la notificación del servicio asignado

---

## 3️⃣ Aceptación/Rechazo (ACEPTADO o RECHAZADO)

**Actor:** Operario

### Si acepta:
- El operario revisa y acepta el servicio
- **Transición:** `ASIGNADO` → `ACEPTADO`
- Se habilita el acceso a los checklists de validación

### Si rechaza:
- El operario indica el motivo del rechazo
- **Transición:** `ASIGNADO` → `RECHAZADO`
- El servicio puede ser reasignado o cancelado

---

## 4️⃣ Completar Checklists (EN_CHECKLIST)

**Actor:** Operario

**Transición:** `ACEPTADO` → `EN_CHECKLIST` (automático al iniciar checklists)

El operario debe completar **todos** los siguientes documentos:

### 📋 Checklist de Equipo (Rampla Plana / Drop Deck)
- **Frecuencia:** Semanal
- **Contenido:**
  - Identificación: marca/modelo, patente, año, conductor, fecha/hora
  - Matriz de inspección técnica (conexiones, estructura, frenos, neumáticos, etc.)
  - Estado: OK / NC (No Conforme) / N/A
  - **Condición:** No debe tener ítems con "NC" para aprobar

### 🚛 Checklist de Tracto Camión
- **Frecuencia:** Semanal
- **Contenido:**
  - Datos generales: patente, conductor, RUT, fecha, kilometraje
  - Secciones: Documentación, EPP, Luces, Condiciones generales, Mecánica/Motor
  - Estado: SI / NO / OB (Observación)
  - **Condición:** No debe tener ítems con "NO" para aprobar

### 😴 Checklist de Fatiga y Somnolencia
- **Contenido:**
  - Información del conductor y licencia
  - Sección I: 7 preguntas de autoevaluación
  - Sección II: 12 síntomas durante conducción
  - **Resultado:** Determina si el conductor está apto para trabajar
  - **Condición:** El conductor debe estar APTO (sin señales de fatiga)

### ⚠️ Análisis de Riesgo (AST/ART)
- **Contenido:**
  - Cuestionario de control de riesgos (9 preguntas: SI/NO/N/A)
  - Autorización de equipos mayores (si aplica)
  - Matriz de desarrollo: etapas del trabajo (Antes/Durante/Después) con riesgos y controles
  - Evaluación de término de faena (3 preguntas)
  - Firmas: responsable del trabajo y supervisor revisor
  - **Condición:** Todos los riesgos deben estar controlados

---

## 5️⃣ Envío a Aprobación (PENDIENTE_APROBACION)

**Actor:** Operario

**Requisitos:**
- ✅ Todos los checklists deben estar completados
- ✅ Equipo en condiciones (sin NC en inspecciones)
- ✅ Conductor apto (sin señales de fatiga)
- ✅ Riesgos controlados

**Transición:** `EN_CHECKLIST` → `PENDIENTE_APROBACION`

El sistema muestra un resumen de todas las validaciones antes de enviar.

---

## 6️⃣ Aprobación del Supervisor (APROBADO)

**Actor:** Supervisor

**Revisión:**
- ✅ Checklist de equipo: OK
- ✅ Checklist de fatiga: OK
- ✅ Análisis de riesgo: OK

**Decisiones:**

### Si aprueba:
- **Transición:** `PENDIENTE_APROBACION` → `APROBADO`
- Se genera una firma digital (timestamp + identificación del supervisor)
- El servicio queda listo para iniciar ejecución

### Si rechaza:
- **Transición:** `PENDIENTE_APROBACION` → `RECHAZADO`
- Debe indicar el motivo del rechazo
- El operario debe corregir y volver a enviar

---

## 7️⃣ Inicio de Ejecución (EN_EJECUCION)

**Actor:** Operario / Supervisor

**Requisito previo:** Servicio debe estar en estado `APROBADO`

**Transición:** `APROBADO` → `EN_EJECUCION`

- Se registra la fecha/hora de inicio
- El conductor inicia el traslado con toda la documentación aprobada

---

## Estados Posteriores

### 8️⃣ Completado (COMPLETADO)
- **Transición:** `EN_EJECUCION` → `COMPLETADO`
- Se registra la **Guía de Despacho** con datos de cierre:
  - Km inicial/final, hora inicio/término
  - Tipo de carga, peso
  - Receptor, firma, incidentes

### 9️⃣ Cancelado (CANCELADO)
- Puede ocurrir desde varios estados
- El servicio se cancela con observaciones del motivo

---

## Validaciones Clave

| Validación | Documento | Criterio |
|-----------|-----------|----------|
| Equipo en condiciones | Checklist Equipo | Sin ítems "NC" |
| Tracto en condiciones | Checklist Tracto | Sin ítems "NO" |
| Conductor apto | Checklist Fatiga | Apto para trabajar = true |
| Riesgos controlados | Análisis de Riesgo | Todos controlados |
| Documentación completa | Todos | 4 checklists completados |

---

## Diagrama del Flujo

```
PENDIENTE → ASIGNADO → ACEPTADO → EN_CHECKLIST → PENDIENTE_APROBACION → APROBADO → EN_EJECUCION → COMPLETADO
              ↓           ↓            ↓                  ↓
          CANCELADO   RECHAZADO   RECHAZADO          RECHAZADO
```

---

## Roles y Responsabilidades

| Rol | Acciones |
|-----|----------|
| **Coordinador/Jefatura** | Crear servicios, asignar operarios |
| **Operario** | Aceptar/rechazar, completar checklists, enviar a aprobación |
| **Supervisor** | Revisar documentación, aprobar/rechazar, iniciar ejecución |

---

## Notas Importantes

1. **No se puede saltar pasos:** Cada transición de estado está validada
2. **Todos los checklists son obligatorios:** No se puede enviar a aprobación sin completarlos todos
3. **El conductor debe estar apto:** Si tiene señales de fatiga, debe ser reemplazado
4. **Trazabilidad completa:** Cada acción queda registrada con timestamp y usuario
5. **Firma digital:** La aprobación del supervisor genera un registro inmutable

---

**Versión:** 1.0  
**Última actualización:** Marzo 2026
